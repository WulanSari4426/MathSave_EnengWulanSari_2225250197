// Fase 5 — modul murni: aturan kode/PIN, kriptografi, pembungkus HTTP, dan skrip pengelola.
import { describe, test, expect, vi, beforeAll } from 'vitest';
import {
  normalisasiKodeSiswa, kodeSiswaSah, formatKodeSiswa, normalisasiKodeKelas, kodeKelasSah,
  normalisasiPin, pinSah, normalisasiKodeReset, kodeResetSah, tampilkanKodeReset, kodeTertukar,
} from '../../supabase/functions/_bersama/kodeSiswa.js';
import {
  hmacHex, samaAman, turunan, buatKodeReset, buatKataSandiAcak, emailInternalSiswa,
} from '../../supabase/functions/_bersama/kriptografi.js';
import { buatPenangan, ambilIp } from '../../supabase/functions/_bersama/penangan.js';
import {
  bacaDaftarSiswa, buatAkunSiswa, hitungKodeKelasHash, nomorBerikutnya,
} from '../../supabase/seed/inti/kelolaSiswa.js';
import { buatDb, sebagaiAdmin } from '../db/bantuDb.js';
import { buatAuthPalsu, buatAlatUji, RAHASIA_UJI } from './alatUji.js';

describe('kodeSiswa.js', () => {
  test('normalisasi kode siswa (KF-05d)', () => {
    expect(normalisasiKodeSiswa('s001')).toBe('S001');
    expect(normalisasiKodeSiswa(' S-0 01 ')).toBe('S001');
    expect(normalisasiKodeSiswa(undefined)).toBe('');
    expect(kodeSiswaSah('S001')).toBe(true);
    expect(kodeSiswaSah('S01')).toBe(false);
    expect(kodeSiswaSah('230706')).toBe(false);
  });

  test('format kode berurutan', () => {
    expect(formatKodeSiswa(1)).toBe('S001');
    expect(formatKodeSiswa(42)).toBe('S042');
    expect(() => formatKodeSiswa(1000)).toThrow(RangeError);
  });

  test('PIN tetap teks 6 digit; 0 di depan tidak hilang (KF-05a)', () => {
    expect(normalisasiPin(' 012 345 ')).toBe('012345');
    expect(pinSah('012345')).toBe(true);
    for (const salah of ['12345', '1234567', '12a456', '１２３４５６', '']) expect(pinSah(salah)).toBe(false);
  });

  test('kode kelas 6 angka', () => {
    expect(kodeKelasSah(normalisasiKodeKelas(' 123 456 '))).toBe(true);
    expect(kodeKelasSah('S001')).toBe(false);
  });

  test('kode reset tanpa huruf/angka yang mirip', () => {
    expect(normalisasiKodeReset('abcd-2345')).toBe('ABCD2345');
    expect(kodeResetSah('ABCD2345')).toBe(true);
    expect(kodeResetSah('ABCD0345')).toBe(false); // 0 tidak dipakai
    expect(tampilkanKodeReset('ABCD2345')).toBe('ABCD-2345');
  });

  test('isian tertukar di layar Daftar (D6)', () => {
    expect(kodeTertukar('S001', '123456')).toBe(true);
    expect(kodeTertukar('123456', '654321')).toBe(true);
    expect(kodeTertukar('123456', 'S001')).toBe(false);
  });
});

describe('kriptografi.js', () => {
  test('HMAC-SHA256 sesuai vektor uji RFC 4231 kasus 2', async () => {
    expect(await hmacHex('Jefe', 'what do ya want for nothing?'))
      .toBe('5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843');
  });

  test('turunan memakai awalan berbeda per kegunaan', async () => {
    const nilai = await Promise.all([
      turunan.kodeHash('r', 'x'), turunan.kodeKelasHash('r', 'x'), turunan.tokenResetHash('r', 'x'),
      turunan.ipHash('r', 'x'),
    ]);
    expect(new Set(nilai).size).toBe(4);
    expect(await turunan.kataSandi('r', 'S001', '012345')).toHaveLength(64); // < 72 bita batas bcrypt
  });

  test('rahasia kosong ditolak', async () => {
    await expect(hmacHex('', 'x')).rejects.toThrow(/belum diatur/);
  });

  test('samaAman', () => {
    expect(samaAman('abc', 'abc')).toBe(true);
    expect(samaAman('abc', 'abd')).toBe(false);
    expect(samaAman('abc', 'abcd')).toBe(false);
  });

  test('kode reset dan kata sandi acak', () => {
    const kode = new Set(Array.from({ length: 200 }, buatKodeReset));
    expect(kode.size).toBe(200);
    for (const k of kode) expect(kodeResetSah(k)).toBe(true);
    expect(buatKataSandiAcak()).toMatch(/^[A-Za-z0-9]{48}$/);
    expect(emailInternalSiswa('abc')).toBe('abc@siswa.mathsave.invalid');
  });
});

describe('penangan.js (pembungkus HTTP Edge Function)', () => {
  const minta = (metode, badan, header = {}) =>
    new Request('http://lokal/fungsi', { method: metode, body: badan, headers: header });

  test('OPTIONS → CORS', async () => {
    const r = await buatPenangan(vi.fn(), vi.fn())(minta('OPTIONS'));
    expect(r.status).toBe(200);
    expect(r.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });

  test('selain POST → 405', async () => {
    expect((await buatPenangan(vi.fn(), vi.fn())(minta('GET'))).status).toBe(405);
  });

  test('JSON rusak atau bukan objek → 400 ISIAN_KOSONG', async () => {
    const p = buatPenangan(vi.fn(), vi.fn());
    for (const badan of ['{rusak', '[1]', 'null']) {
      const r = await p(minta('POST', badan));
      expect(r.status).toBe(400);
      expect(await r.json()).toEqual({ kode_galat: 'ISIAN_KOSONG' });
    }
  });

  test('hasil proses diteruskan sebagai JSON tanpa cache', async () => {
    const proses = vi.fn(async () => ({ status: 401, isi: { kode_galat: 'MASUK_GAGAL' } }));
    const r = await buatPenangan(proses, async () => ({}))(minta('POST', '{"kode":"S001","pin":"123456"}'));
    expect(r.status).toBe(401);
    expect(r.headers.get('Cache-Control')).toBe('no-store');
    expect(await r.json()).toEqual({ kode_galat: 'MASUK_GAGAL' });
    expect(proses).toHaveBeenCalledWith({ kode: 'S001', pin: '123456' }, {});
  });

  test('galat server → 500 GALAT_SERVER, dan log TIDAK memuat PIN atau kode', async () => {
    const catatGalat = vi.fn();
    const proses = async () => { throw new Error('basis data mati'); };
    const r = await buatPenangan(proses, async () => ({}), { catatGalat })(
      minta('POST', '{"kode":"S077","pin":"908172"}'),
    );
    expect(r.status).toBe(500);
    expect(await r.json()).toEqual({ kode_galat: 'GALAT_SERVER' });
    const log = catatGalat.mock.calls.flat().join(' ');
    expect(log).toContain('basis data mati');
    expect(log).not.toContain('908172');
    expect(log).not.toContain('S077');
  });

  test('ambilIp hanya memakai cf-connecting-ip; x-forwarded-for diabaikan (rinciannya di galatAuthDanIp.test.js)', () => {
    expect(ambilIp(minta('POST', '{}', { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' }))).toBeNull();
    expect(ambilIp(minta('POST', '{}', { 'cf-connecting-ip': '1.2.3.4' }))).toBe('1.2.3.4');
    expect(ambilIp(minta('POST', '{}'))).toBeNull();
  });
});

describe('Skrip pengelola (buat-siswa, hitung-kode-kelas)', () => {
  let db;
  let auth;
  let alat;

  beforeAll(async () => {
    db = await buatDb();
    auth = buatAuthPalsu(db);
    alat = await buatAlatUji(db, auth);
  }, 60000);

  test('bacaDaftarSiswa: baris judul dilewati, baris kosong diabaikan, baris tak lengkap ditolak', () => {
    expect(bacaDaftarSiswa('nama_panggilan,kelas\nRani,VIII-C\n\n Budi , VIII-C \n'))
      .toEqual([{ nama: 'Rani', kelas: 'VIII-C' }, { nama: 'Budi', kelas: 'VIII-C' }]);
    expect(() => bacaDaftarSiswa('Rani\n')).toThrow(/Baris 1/);
  });

  test('buatAkunSiswa: kode berurutan, akun Auth email internal, tanpa PIN, dan melanjutkan nomor', async () => {
    const pertama = await buatAkunSiswa({
      daftar: [{ nama: 'Rani', kelas: 'VIII-C' }, { nama: 'Budi', kelas: 'VIII-C' }],
      rahasiaKode: RAHASIA_UJI, db: alat.db, auth,
    });
    expect(pertama.map((s) => s.kode)).toEqual(['S001', 'S002']);
    const kedua = await buatAkunSiswa({
      daftar: [{ nama: 'Citra', kelas: 'VIII-D' }], rahasiaKode: RAHASIA_UJI, db: alat.db, auth,
    });
    expect(kedua).toEqual([{ kode: 'S003', nama: 'Citra', kelas: 'VIII-D' }]);

    await sebagaiAdmin(db);
    const { rows } = await db.query('select pin_dibuat_pada, auth_user_id, id from public.siswa');
    expect(rows).toHaveLength(3);
    expect(rows.every((r) => r.pin_dibuat_pada === null)).toBe(true);
    for (const r of rows) expect(auth.pengguna.get(r.auth_user_id).email).toBe(`${r.id}@siswa.mathsave.invalid`);
    expect(await nomorBerikutnya(RAHASIA_UJI, new Set(await alat.db.daftarKodeHash()))).toBe(4);
    // Batas waktu khusus 30 detik: tes ini menghitung ±3.000 HMAC (pencarian S001–S999 tiga kali)
    // dan normalnya selesai ±0,5 detik, tetapi pernah melewati batas bawaan 5 detik saat CPU sibuk
    // menjalankan file tes lain secara paralel (direproduksi: "Test timed out in 5000ms", 5072 ms).
  }, 30000);

  test('hitungKodeKelasHash memeriksa format dan sama dengan hash yang dipakai Edge Function', async () => {
    await expect(hitungKodeKelasHash(RAHASIA_UJI, 'S001')).rejects.toThrow(/6 angka/);
    expect(await hitungKodeKelasHash(RAHASIA_UJI, ' 111 222 ')).toBe(alat.kodeKelasHash);
  });
});
