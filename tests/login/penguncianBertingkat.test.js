// Perbaikan keamanan login 12 November 2026 (migrasi 0006):
//   - penguncian bertingkat per username: 5 → 15 → 60 menit
//   - batas 100 login gagal per jam per IP tepercaya
//   - galat Supabase Auth (429) tidak dihitung sebagai PIN salah
// Dijalankan terhadap fungsi SQL asli (migrasi 0001–0006) di PGlite + Auth palsu (alatUji.js).
import { describe, test, expect, beforeAll, vi } from 'vitest';
import { buatDb } from '../db/bantuDb.js';
import {
  buatAuthPalsu, buatAlatUji, tambahKelas, resetPinUsername, lewatkanKunci, statusKunci, lamaKunciMenit,
  mundurkanStatusKunci, kueriPemilik, KODE_KELAS_UJI,
} from './alatUji.js';
import { prosesMasuk, prosesDaftarPertama, prosesAturPinBaru } from '../../supabase/functions/_bersama/alurLogin.js';
import { buatPenangan } from '../../supabase/functions/_bersama/penangan.js';
import { GalatLayananSibuk } from '../../supabase/functions/_bersama/galatAuth.js';

let db;
let auth;
let alat;
let kelasId;

const dariIp = (ip) => ({ ...alat, ipHash: ip });
const daftar = (username, pin, ip = `daftar-${username}`) => prosesDaftarPertama({
  aksi: 'daftar', kode_kelas: KODE_KELAS_UJI, kelas_id: kelasId, username, pin_baru: pin, ulang_pin: pin,
}, dariIp(ip));
const masuk = (username, pin, ip = null) => prosesMasuk({ username, pin }, dariIp(ip));
const aturPin = (username, kodeReset, pin, ip = null) =>
  prosesAturPinBaru({ username, kode_reset: kodeReset, pin_baru: pin, ulang_pin: pin }, dariIp(ip));
const ulangi = async (n, fn) => {
  const hasil = [];
  for (let i = 0; i < n; i += 1) hasil.push(await fn(i));
  return hasil;
};
const hitung = async (sql, nilai) => Number((await kueriPemilik(db, sql, nilai))[0].n);
const gagalDariIp = (ip) => hitung('select count(*) as n from public.percobaan_masuk where ip_hash = $1 and not berhasil', [ip]);

const GAGAL = { status: 401, isi: { kode_galat: 'MASUK_GAGAL' } };
const TERKUNCI = { status: 429, isi: { kode_galat: 'TERLALU_BANYAK_PERCOBAAN' } };

/** 5 kegagalan → terkunci; mengembalikan lama kunci (menit). */
async function kunciSekali(username) {
  expect(await ulangi(5, () => masuk(username, '000000'))).toEqual(Array(5).fill(GAGAL));
  expect(await masuk(username, '000000')).toEqual(TERKUNCI);
  return lamaKunciMenit(db, username);
}

beforeAll(async () => {
  db = await buatDb();
  auth = buatAuthPalsu(db);
  alat = await buatAlatUji(db, auth);
  kelasId = await tambahKelas(db, 'VIII-C', 8);
  for (const [u, pin] of [['ani', '202020'], ['bima', '212121'], ['cici', '232323'], ['dodi', '242424'],
    ['eka', '252525'], ['fani', '262626'], ['gita', '272727'], ['hadi', '282828']]) {
    expect((await daftar(u, pin)).status).toBe(200);
  }
}, 60000);

// ---------------------------------------------------------------------------
describe('Penguncian bertingkat per username (KF-05b diperbarui)', () => {
  test('kunci ke-1 = 5 menit, ke-2 = 15 menit, ke-3 dan seterusnya = 60 menit', async () => {
    expect(await kunciSekali('ani')).toBe(5);
    expect((await statusKunci(db, 'ani')).tingkat_kunci).toBe(1);
    await lewatkanKunci(db, 'ani');
    expect(await kunciSekali('ani')).toBe(15);
    await lewatkanKunci(db, 'ani');
    expect(await kunciSekali('ani')).toBe(60);
    await lewatkanKunci(db, 'ani');
    expect(await kunciSekali('ani')).toBe(60);
    expect((await statusKunci(db, 'ani')).tingkat_kunci).toBe(3);
  });

  test('selama terkunci, PIN benar tetap ditolak dan kunci tidak diperpanjang', async () => {
    await kunciSekali('bima');
    const awal = (await statusKunci(db, 'bima')).terkunci_sampai;
    expect(await masuk('bima', '212121')).toEqual(TERKUNCI);
    await ulangi(3, () => masuk('bima', '000000'));
    expect((await statusKunci(db, 'bima')).terkunci_sampai).toEqual(awal);
    expect((await statusKunci(db, 'bima')).tingkat_kunci).toBe(1);
  });

  test('login berhasil mengembalikan tingkat ke 0', async () => {
    await kunciSekali('cici');
    await lewatkanKunci(db, 'cici');
    expect((await masuk('cici', '232323')).status).toBe(200);
    expect(await statusKunci(db, 'cici')).toMatchObject({ gagal_berturut: 0, tingkat_kunci: 0, terkunci_sampai: null });
    expect(await kunciSekali('cici')).toBe(5);
  });

  test('24 jam tanpa percobaan → tingkat kembali 0; kurang dari 24 jam → tingkat tetap', async () => {
    await kunciSekali('dodi');
    await mundurkanStatusKunci(db, 'dodi', '23 hours');
    expect(await kunciSekali('dodi')).toBe(15);
    await mundurkanStatusKunci(db, 'dodi', '25 hours');
    expect(await kunciSekali('dodi')).toBe(5);
  });

  test('reset PIN oleh peneliti mengakhiri kunci DAN tingkatnya', async () => {
    await kunciSekali('eka');
    await lewatkanKunci(db, 'eka');
    await kunciSekali('eka');
    const kodeReset = await resetPinUsername(db, alat, 'eka');
    expect(await statusKunci(db, 'eka')).toBeNull();
    expect((await aturPin('eka', kodeReset, '353535')).status).toBe(200);
    expect(await kunciSekali('eka')).toBe(5);
  });

  test('username tidak terdaftar bertingkat dengan cara dan respons yang sama (L7)', async () => {
    expect(await kunciSekali('hantu_bertingkat')).toBe(5);
    await lewatkanKunci(db, 'hantu_bertingkat');
    expect(await kunciSekali('hantu_bertingkat')).toBe(15);
  });

  test('layar Buat PIN baru memakai tingkat yang sama dengan layar Masuk', async () => {
    await kunciSekali('fani');
    await lewatkanKunci(db, 'fani');
    expect(await ulangi(5, () => aturPin('fani', 'AAAA-BBBB', '363636')))
      .toEqual(Array(5).fill({ status: 401, isi: { kode_galat: 'RESET_GAGAL' } }));
    expect(await aturPin('fani', 'AAAA-BBBB', '363636')).toEqual(TERKUNCI);
    expect(await lamaKunciMenit(db, 'fani')).toBe(15);
  });

  test('10 kegagalan bersamaan → satu masa kunci 5 menit, tingkat naik satu kali', async () => {
    await Promise.all(Array.from({ length: 10 }, () => masuk('gita', '000000')));
    expect(await statusKunci(db, 'gita')).toMatchObject({ gagal_berturut: 5, tingkat_kunci: 1 });
    expect(await lamaKunciMenit(db, 'gita')).toBe(5);
  });
});

// ---------------------------------------------------------------------------
describe('Batas gagal login per IP tepercaya (100 per jam)', () => {
  test('kegagalan disebar ke banyak username: ke-100 masih dijawab, sesudahnya IP itu ditolak', async () => {
    const ip = 'ip-penebak';
    // 25 username × 4 kegagalan = 100, tidak ada satu pun username yang terkunci.
    const hasil = await ulangi(100, (i) => masuk(`tebak_${Math.floor(i / 4)}`, '000000', ip));
    expect(hasil).toEqual(Array(100).fill(GAGAL));
    expect(await gagalDariIp(ip)).toBe(100);

    // Akun sah dengan PIN benar pun ditolak dari IP itu, dengan respons yang sama seperti kunci username.
    expect(await masuk('hadi', '282828', ip)).toEqual(TERKUNCI);
    expect(await aturPin('hadi', 'AAAA-BBBB', '383838', ip)).toEqual(TERKUNCI);
    // Penolakan karena batas IP tidak dicatat (banjir permintaan tidak menambah baris log),
    // dan tidak menambah hitungan kunci username.
    expect(await gagalDariIp(ip)).toBe(100);
    expect(await statusKunci(db, 'hadi')).toBeNull();

    // IP lain tidak terpengaruh.
    expect((await masuk('hadi', '282828', 'ip-lain')).status).toBe(200);
  }, 60000);

  test('99 kegagalan belum ditolak; login berhasil tidak dihitung', async () => {
    const ip = 'ip-hampir';
    await ulangi(99, (i) => masuk(`hampir_${Math.floor(i / 4)}`, '000000', ip));
    expect((await masuk('hadi', '282828', ip)).status).toBe(200);
    expect(await masuk('hampir_x', '000000', ip)).toEqual(GAGAL);   // kegagalan ke-100
    expect(await masuk('hadi', '282828', ip)).toEqual(TERKUNCI);
  }, 60000);

  test('kegagalan lebih dari 1 jam yang lalu tidak dihitung', async () => {
    const ip = 'ip-penebak';
    await kueriPemilik(db,
      `update public.percobaan_masuk set dibuat_pada = now() - interval '61 minutes' where ip_hash = $1`, [ip]);
    expect((await masuk('hadi', '282828', ip)).status).toBe(200);
  });

  test('satu kelas (30 siswa) dari satu Wi-Fi, masing-masing salah PIN 2 kali, semua tetap bisa masuk', async () => {
    const ip = 'ip-wifi-sekolah';
    const kelas = Array.from({ length: 30 }, (_, i) => [`murid_${String(i).padStart(2, '0')}`, String(400000 + i)]);
    for (const [u, pin] of kelas) expect((await daftar(u, pin, ip)).status).toBe(200);
    for (const [u, pin] of kelas) {
      expect(await masuk(u, '000000', ip)).toEqual(GAGAL);
      expect(await masuk(u, '000001', ip)).toEqual(GAGAL);
      expect((await masuk(u, pin, ip)).status).toBe(200);
    }
  }, 120000);

  test('tanpa IP tepercaya, batas IP tidak dipakai (hanya kunci per username)', async () => {
    const ipMasukTerbatas = vi.fn(alat.db.ipMasukTerbatas);
    const tanpaIp = { ...alat, ipHash: null, db: { ...alat.db, ipMasukTerbatas } };
    expect((await prosesMasuk({ username: 'hadi', pin: '282828' }, tanpaIp)).status).toBe(200);
    expect(ipMasukTerbatas).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
describe('Galat Supabase Auth (termasuk 429)', () => {
  test('masuk: Auth 429 → tidak dihitung sebagai PIN salah, dan HTTP 503 LAYANAN_SIBUK', async () => {
    const sebelum = await statusKunci(db, 'hadi');
    auth.lemparMasukBerikutnya = new GalatLayananSibuk('over_request_rate_limit');
    await expect(masuk('hadi', '282828')).rejects.toThrow(GalatLayananSibuk);
    expect(await statusKunci(db, 'hadi')).toEqual(sebelum);

    auth.lemparMasukBerikutnya = new GalatLayananSibuk('over_request_rate_limit');
    const penangan = buatPenangan(prosesMasuk, async () => alat, { catatGalat: () => {} });
    const r = await penangan(new Request('http://lokal/masuk-kode', {
      method: 'POST', body: JSON.stringify({ username: 'hadi', pin: '282828' }),
    }));
    expect(r.status).toBe(503);
    expect(await r.json()).toEqual({ kode_galat: 'LAYANAN_SIBUK' });
    expect(await statusKunci(db, 'hadi')).toEqual(sebelum);
    // Setelah layanan pulih, PIN yang sama langsung diterima.
    expect((await masuk('hadi', '282828')).status).toBe(200);
  });

  test('daftar: akun sudah tersimpan tetapi masuk otomatis kena 429 → 201 akun_dibuat (bukan 500)', async () => {
    auth.lemparMasukBerikutnya = new GalatLayananSibuk('over_request_rate_limit');
    expect(await daftar('ika', '292929')).toEqual({ status: 201, isi: { akun_dibuat: true } });
    expect((await masuk('ika', '292929')).status).toBe(200);
    // Mendaftar ulang dengan username yang sama memang ditolak: akunnya sudah ada.
    expect((await daftar('ika', '292929')).status).toBe(409);
  });

  test('daftar: membuat akun Auth kena 429 → galat sibuk, tidak ada siswa tersimpan', async () => {
    const asli = auth.buatPengguna;
    auth.buatPengguna = async () => { throw new GalatLayananSibuk('createUser'); };
    try {
      await expect(daftar('joni', '303030')).rejects.toThrow(GalatLayananSibuk);
    } finally {
      auth.buatPengguna = asli;
    }
    expect(await hitung(`select count(*) as n from public.siswa where username = 'joni'`)).toBe(0);
    expect((await daftar('joni', '303030')).status).toBe(200);
  });

  test('Buat PIN baru: PIN sudah diganti tetapi masuk otomatis gagal → 201 pin_diubah; PIN baru berlaku', async () => {
    const kodeReset = await resetPinUsername(db, alat, 'gita');
    auth.lemparMasukBerikutnya = new Error('Auth gagal: tanpa_kode (500)');
    expect(await aturPin('gita', kodeReset, '313131')).toEqual({ status: 201, isi: { pin_diubah: true } });
    expect((await masuk('gita', '313131')).status).toBe(200);
  });
});
