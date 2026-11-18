// Fase 5A Tahap 4 — skrip pengelola: reset PIN berdasarkan username, kelola-kelas, dan
// penjaga buat-siswa.js. Fungsi inti dijalankan terhadap RPC asli migrasi 0005 di PGlite.
import { describe, test, expect, beforeAll, vi } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { buatDb } from '../db/bantuDb.js';
import {
  buatAuthPalsu, buatAlatUji, statusKunci, kueriPemilik, KODE_KELAS_UJI, RAHASIA_UJI,
} from './alatUji.js';
import { prosesDaftarPertama, prosesMasuk, prosesAturPinBaru } from '../../supabase/functions/_bersama/alurLogin.js';
import { resetPinUsername, izinBuatAkunLama, IZIN_AKUN_LAMA } from '../../supabase/seed/inti/kelolaSiswa.js';
import {
  jalankanPerintahKelas, bacaJenjang, formatDaftarKelas, CARA_PAKAI,
} from '../../supabase/seed/inti/kelolaKelas.js';

const AKAR = join(import.meta.dirname, '..', '..');
const baca = (jalur) => readFileSync(join(AKAR, jalur), 'utf8');

let db;
let auth;
let alat;
const kelas = (...argumen) => jalankanPerintahKelas(argumen, alat.db);

beforeAll(async () => {
  db = await buatDb();
  auth = buatAuthPalsu(db);
  alat = await buatAlatUji(db, auth);
}, 60000);

// ---------------------------------------------------------------------------
describe('RPC yang dipakai skrip sesuai tanda tangan di migrasi (tidak menebak)', () => {
  const sqlMigrasi = readdirSync(join(AKAR, 'supabase', 'migrations'))
    .filter((f) => f.endsWith('.sql')).map((f) => baca(`supabase/migrations/${f}`)).join('\n');

  /** Parameter fungsi dari "create function public.<nama>(...)" di migrasi. */
  function parameterFungsi(nama) {
    const cocok = sqlMigrasi.match(new RegExp(`create function public\\.${nama}\\(([^)]*)\\)`, 'i'));
    if (!cocok) return null;
    return [...cocok[1].matchAll(/\b(p_\w+)\b/g)].map((m) => m[1]);
  }

  const panggilan = [...baca('supabase/seed/inti/klienPengelola.js').matchAll(/rpc\('(\w+)'(?:,\s*\{([^}]*)\})?/g)]
    .map((m) => ({ nama: m[1], kunci: [...(m[2] ?? '').matchAll(/\b(p_\w+)\s*:/g)].map((k) => k[1]) }));

  test('klienPengelola memanggil RPC yang ada', () => {
    expect(panggilan.map((p) => p.nama).sort()).toEqual([
      'buat_reset_pin_siswa', 'cari_siswa_username', 'daftar_kode_hash_siswa', 'kelola_kelas_daftar',
      'kelola_kelas_setel_aktif', 'kelola_kelas_tambah', 'kelola_kelas_ubah_nama', 'tambah_siswa',
    ]);
  });

  test.each(panggilan.map((p) => [p.nama, p]))('%s: fungsi ada dan nama parameternya tepat', (_, p) => {
    const param = parameterFungsi(p.nama);
    expect(param).not.toBeNull();
    expect([...p.kunci].sort()).toEqual([...param].sort());
  });

  test('skrip pengelola tidak membaca tabel langsung dan tidak punya perintah/RPC hapus', () => {
    for (const berkas of ['supabase/seed/inti/klienPengelola.js', 'supabase/seed/inti/kelolaKelas.js',
      'supabase/seed/inti/kelolaSiswa.js', 'supabase/seed/kelola-kelas.js', 'supabase/seed/reset-pin.js',
      'supabase/seed/buat-siswa.js']) {
      const isi = baca(berkas);
      expect(isi, berkas).not.toMatch(/\.from\(/);
      expect(isi, berkas).not.toMatch(/rpc\('\w*(hapus|delete)\w*'/i);
    }
  });
});

// ---------------------------------------------------------------------------
describe('reset-pin.js: reset berdasarkan username', () => {
  const daftar = (username, pin, ip) => prosesDaftarPertama(
    { aksi: 'daftar', kode_kelas: KODE_KELAS_UJI, kelas_id: alat.kelasUji, username, pin_baru: pin, ulang_pin: pin },
    { ...alat, ipHash: ip });
  const reset = (usernameMentah, dibuatOleh = 'peneliti') =>
    resetPinUsername({ usernameMentah, dibuatOleh, rahasiaKode: RAHASIA_UJI, db: alat.db, auth });

  beforeAll(async () => {
    alat.kelasUji = await alat.db.kelolaKelasTambah('VIII-C', 8, 0);
    await daftar('rani_08', '303030', 'ip-r1');
    await daftar('budi', '313131', 'ip-r2');
  });

  test('berhasil: username dinormalisasi, kode berbentuk ABCD-2345, PIN lama langsung tidak berlaku', async () => {
    const hasil = await reset('  RANI_08 ');
    expect(hasil).toMatchObject({ username: 'rani_08', berlakuJam: 24 });
    expect(hasil.kodeReset).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    expect((await prosesMasuk({ username: 'rani_08', pin: '303030' }, alat)).status).toBe(401);
    const atur = await prosesAturPinBaru(
      { username: 'rani_08', kode_reset: hasil.kodeReset, pin_baru: '404040', ulang_pin: '404040' }, alat);
    expect(atur.status).toBe(200);
  });

  test('kode reset tidak disimpan sebagai teks; yang tersimpan hanya HMAC; skrip tidak mencetak/menulis log', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { kodeReset } = await reset('budi');
    expect(log).not.toHaveBeenCalled();
    expect(err).not.toHaveBeenCalled();
    log.mockRestore();
    err.mockRestore();

    const semua = JSON.stringify(await kueriPemilik(db, 'select * from public.reset_pin'));
    expect(semua).not.toContain(kodeReset);
    expect(semua).not.toContain(kodeReset.replace('-', ''));
    const [{ dibuat_oleh: oleh }] = await kueriPemilik(db,
      `select dibuat_oleh from public.reset_pin order by dibuat_pada desc limit 1`);
    expect(oleh).toBe('peneliti');
  });

  test('reset mengakhiri kunci login username itu', async () => {
    for (let i = 0; i < 5; i += 1) await prosesMasuk({ username: 'budi', pin: '000000' }, alat);
    expect((await statusKunci(db, 'budi')).terkunci_sampai).not.toBeNull();
    await reset('budi');
    expect(await statusKunci(db, 'budi')).toBeNull();
  });

  test('format username salah, username tidak ada, akun nonaktif, atau "oleh" kosong → pesan jelas, tanpa perubahan', async () => {
    const jumlahReset = async () => Number((await kueriPemilik(db, 'select count(*) as n from public.reset_pin'))[0].n);
    const sebelum = await jumlahReset();
    await expect(reset('S001')).rejects.toThrow(/tidak ditemukan/);          // format sah, tapi bukan username terdaftar
    await expect(reset('a b')).rejects.toThrow(/Format username tidak sah/);
    await expect(reset('tidak_ada')).rejects.toThrow(/tidak ditemukan atau akunnya nonaktif/);
    await expect(reset('rani_08', '  ')).rejects.toThrow(/siapa yang mereset/);
    await kueriPemilik(db, `update public.siswa set aktif = false where username = 'budi'`);
    await expect(reset('budi')).rejects.toThrow(/tidak ditemukan atau akunnya nonaktif/);
    expect(await jumlahReset()).toBe(sebelum);
  });
});

// ---------------------------------------------------------------------------
describe('kelola-kelas.js', () => {
  test('bacaJenjang: 7–12 dan VII–XII; selain itu null', () => {
    expect([bacaJenjang('8'), bacaJenjang('VIII'), bacaJenjang('xii'), bacaJenjang(' 7 ')]).toEqual([8, 8, 12, 7]);
    for (const salah of ['6', '13', 'VI', 'XIII', '8.5', '', 'delapan']) expect(bacaJenjang(salah)).toBeNull();
  });

  test('tambah (angka/Romawi), daftar terurut, nama ganda ditolak dengan pesan jelas', async () => {
    expect(await kelas('tambah', 'X IPA 1', 'X')).toMatch(/"X IPA 1" \(jenjang X\) ditambahkan dengan id \d+/);
    expect(await kelas('tambah', '  VII-A ', '7', '1')).toMatch(/"VII-A" \(jenjang VII\)/);
    await expect(kelas('tambah', 'x ipa 1', '10')).rejects.toThrow(/sudah ada/);
    const teks = await kelas('daftar');
    const baris = teks.split('\n');
    expect(baris[0]).toMatch(/^id\s+nama\s+jenjang\s+urutan\s+status\s+siswa$/);
    expect(baris.findIndex((b) => b.includes('VII-A'))).toBeLessThan(baris.findIndex((b) => b.includes('X IPA 1')));
  });

  test('isian tidak sah ditolak sebelum memanggil database', async () => {
    const dbPalsu = { kelolaKelasTambah: vi.fn(), kelolaKelasUbahNama: vi.fn(), kelolaKelasSetelAktif: vi.fn() };
    await expect(jalankanPerintahKelas(['tambah', 'IX-A', '13'], dbPalsu)).rejects.toThrow(/Jenjang harus 7–12/);
    await expect(jalankanPerintahKelas(['tambah', 'IX-A', '9', '-1'], dbPalsu)).rejects.toThrow(/Urutan/);
    await expect(jalankanPerintahKelas(['tambah', ' ', '9'], dbPalsu)).rejects.toThrow(/Cara pakai/);
    await expect(jalankanPerintahKelas(['ubah-nama', 'abc', 'Baru'], dbPalsu)).rejects.toThrow(/Cara pakai/);
    await expect(jalankanPerintahKelas(['nonaktifkan', '0'], dbPalsu)).rejects.toThrow(/Cara pakai/);
    for (const fn of Object.values(dbPalsu)) expect(fn).not.toHaveBeenCalled();
  });

  test('nama terlalu panjang → pesan dari database', async () => {
    await expect(kelas('tambah', 'Nama kelas yang terlalu panjang', '9')).rejects.toThrow(/1–20 karakter/);
  });

  test('ubah-nama, nonaktifkan, aktifkan; id tidak dikenal → pesan jelas', async () => {
    const id = (await kelas('tambah', 'IX-B', '9')).match(/id (\d+)/)[1];
    expect(await kelas('ubah-nama', id, 'IX-B Unggulan')).toMatch(/diubah menjadi "IX-B Unggulan"/);
    expect(await kelas('nonaktifkan', id)).toMatch(/dinonaktifkan/);
    expect((await alat.db.daftarKelasAktif()).map((k) => String(k.id))).not.toContain(id);
    expect(await kelas('aktifkan', id)).toMatch(/aktif dan tampil/);
    expect((await alat.db.daftarKelasAktif()).map((k) => String(k.id))).toContain(id);
    await expect(kelas('nonaktifkan', '32000')).rejects.toThrow(/tidak ditemukan/);
  });

  test('tidak ada perintah hapus: "hapus" ditolak dan kelas tetap ada', async () => {
    const id = (await kelas('tambah', 'XII-A', '12')).match(/id (\d+)/)[1];
    await expect(kelas('hapus', id)).rejects.toThrow(/Tidak ada perintah hapus/);
    expect(await kelas('daftar')).toContain('XII-A');
    expect(CARA_PAKAI).not.toMatch(/^\s*hapus/m);
  });

  test('perintah tidak dikenal atau kosong → cara pakai', async () => {
    await expect(kelas('lain')).rejects.toThrow(/Cara pakai/);
    await expect(kelas()).rejects.toThrow(/Cara pakai/);
  });

  test('formatDaftarKelas: daftar kosong memberi petunjuk', () => {
    expect(formatDaftarKelas([])).toMatch(/Belum ada kelas/);
  });
});

// ---------------------------------------------------------------------------
describe('buat-siswa.js hanya untuk akun lama', () => {
  test('tanpa tanda --akun-lama-kode-siswa → tidak diizinkan', () => {
    expect(izinBuatAkunLama(['daftar.csv'])).toBe(false);
    expect(izinBuatAkunLama(['daftar.csv', IZIN_AKUN_LAMA])).toBe(true);
    expect(IZIN_AKUN_LAMA).toBe('--akun-lama-kode-siswa');
  });

  test('pemeriksaan izin dilakukan sebelum membaca CSV atau terhubung ke Supabase', () => {
    const isi = baca('supabase/seed/buat-siswa.js');
    const posisiIzin = isi.indexOf('izinBuatAkunLama(argumen)');
    expect(posisiIzin).toBeGreaterThan(0);
    expect(posisiIzin).toBeLessThan(isi.indexOf('readFileSync(berkas'));
    expect(posisiIzin).toBeLessThan(isi.indexOf('buatKlienPengelola()'));
  });
});
