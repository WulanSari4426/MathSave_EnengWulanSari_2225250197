// Fase 5A Tahap 3 — alur Edge Function untuk akun USERNAME (KF-05f; api.md 2e).
// Dijalankan terhadap fungsi SQL asli (migrasi 0001–0005) di PGlite + Auth palsu (alatUji.js).
import { describe, test, expect, beforeAll } from 'vitest';
import { buatDb } from '../db/bantuDb.js';
import {
  buatAuthPalsu, buatAlatUji, tambahKelas, setelKelasAktif, resetPinUsername, siapkanSiswa,
  beriUsernameAkunLama, lewatkanKunci, statusKunci, kueriPemilik, KODE_KELAS_UJI, RAHASIA_UJI,
} from './alatUji.js';
import { prosesMasuk, prosesDaftarPertama, prosesAturPinBaru } from '../../supabase/functions/_bersama/alurLogin.js';
import { turunan } from '../../supabase/functions/_bersama/kriptografi.js';

let db;
let auth;
let alat;
let kelas;   // { viiic, xipa, nonaktif }

const denganIp = (ip) => ({ ...alat, ipHash: ip });
const periksa = (kodeKelas, a = alat) => prosesDaftarPertama({ aksi: 'periksa_kode_kelas', kode_kelas: kodeKelas }, a);
const daftar = (username, { pin = '482915', ulang = pin, kelasId = kelas.viiic, kodeKelas = KODE_KELAS_UJI, a = alat } = {}) =>
  prosesDaftarPertama({ aksi: 'daftar', kode_kelas: kodeKelas, kelas_id: kelasId, username, pin_baru: pin, ulang_pin: ulang }, a);
const masuk = (username, pin) => prosesMasuk({ username, pin }, alat);
const aturPin = (username, kodeReset, pin, ulang = pin) =>
  prosesAturPinBaru({ username, kode_reset: kodeReset, pin_baru: pin, ulang_pin: ulang }, alat);
const ulangi = async (n, fn) => {
  const hasil = [];
  for (let i = 0; i < n; i += 1) hasil.push(await fn());
  return hasil;
};
const hitung = async (sql, nilai) => Number((await kueriPemilik(db, sql, nilai))[0].n);
const akunAuthDb = () => hitung('select count(*) as n from auth.users');
const jumlahSiswa = () => hitung('select count(*) as n from public.siswa');

const GAGAL = { status: 401, isi: { kode_galat: 'MASUK_GAGAL' } };
const TERKUNCI = { status: 429, isi: { kode_galat: 'TERLALU_BANYAK_PERCOBAAN' } };
const KODE_SALAH = { status: 401, isi: { kode_galat: 'KODE_KELAS_SALAH' } };
const BATAS_DAFTAR = { status: 429, isi: { kode_galat: 'TERLALU_BANYAK_PENDAFTARAN' } };
const DIPAKAI = { status: 409, isi: { kode_galat: 'USERNAME_SUDAH_DIPAKAI' } };
const RESET_GAGAL = { status: 401, isi: { kode_galat: 'RESET_GAGAL' } };
const tolakPin = (alasan) => ({ status: 400, isi: { kode_galat: 'PIN_TIDAK_SESUAI_ATURAN', alasan } });

beforeAll(async () => {
  db = await buatDb();
  auth = buatAuthPalsu(db);
  alat = await buatAlatUji(db, auth);
  kelas = {
    xipa: await tambahKelas(db, 'X IPA 1', 10),
    viiic: await tambahKelas(db, 'VIII-C', 8),
    nonaktif: await tambahKelas(db, 'VII-Z', 7),
  };
  await setelKelasAktif(db, kelas.nonaktif, false);
}, 60000);

// ---------------------------------------------------------------------------
describe('Daftar langkah 1: periksa kode kelas (api.md 2e.1)', () => {
  test('kode kelas benar → daftar kelas AKTIF saja, terurut jenjang', async () => {
    expect(await periksa(KODE_KELAS_UJI)).toEqual({
      status: 200,
      isi: { kelas: [{ id: kelas.viiic, nama: 'VIII-C', jenjang: 8 }, { id: kelas.xipa, nama: 'X IPA 1', jenjang: 10 }] },
    });
    expect((await periksa(' 111 222 ', denganIp('ip-spasi'))).status).toBe(200);
  });

  test('kode kelas salah atau berformat lain → KODE_KELAS_SALAH tanpa daftar kelas, dan tercatat', async () => {
    const a = denganIp('ip-salah-1');
    for (const salah of ['999999', 'S001', '12345']) expect(await periksa(salah, a)).toEqual(KODE_SALAH);
    expect(await hitung(`select count(*) as n from public.percobaan_daftar where ip_hash = 'ip-salah-1'
                         and jenis = 'kode_kelas_salah'`)).toBe(3);
  });

  test('isian kosong atau aksi tidak dikenal → ISIAN_KOSONG, tidak dicatat', async () => {
    expect(await periksa('  ')).toEqual({ status: 400, isi: { kode_galat: 'ISIAN_KOSONG' } });
    expect(await prosesDaftarPertama({ aksi: 'lain' }, alat)).toEqual({ status: 400, isi: { kode_galat: 'ISIAN_KOSONG' } });
    expect(await prosesDaftarPertama({ kode_kelas: KODE_KELAS_UJI }, alat)).toEqual({ status: 400, isi: { kode_galat: 'ISIAN_KOSONG' } });
  });

  test('U9: 20 kode salah per IP per jam → percobaan ke-21 ditolak, bahkan dengan kode benar; IP lain tidak terpengaruh', async () => {
    const a = denganIp('ip-tebak');
    expect(await ulangi(20, () => periksa('000000', a))).toEqual(Array(20).fill(KODE_SALAH));
    expect(await periksa(KODE_KELAS_UJI, a)).toEqual(BATAS_DAFTAR);
    expect(await daftar('tebak_lolos', { a })).toEqual(BATAS_DAFTAR);
    expect((await periksa(KODE_KELAS_UJI, denganIp('ip-lain'))).status).toBe(200);
  });
});

// ---------------------------------------------------------------------------
describe('Daftar langkah 2: akun baru (api.md 2e.2)', () => {
  test('berhasil → langsung masuk; username huruf kecil sebagai nama tampilan; login berikutnya tidak peka huruf besar', async () => {
    const h = await daftar(' Rani_08 ');
    expect(h.status).toBe(200);
    expect(h.isi).toMatchObject({ expires_in: 3600, siswa: { nama_panggilan: 'rani_08', kelas: 'VIII-C' } });
    expect(h.isi.access_token).toBeTruthy();
    const rows = await kueriPemilik(db, `select username, kelas_id, kode_hash from public.siswa where username = 'rani_08'`);
    expect(rows).toEqual([{ username: 'rani_08', kelas_id: kelas.viiic, kode_hash: null }]);
    expect((await masuk('RANI_08', '482915')).status).toBe(200);
  });

  test('username dipakai (beda huruf besar/kecil) → 409, dan tidak ada akun Auth yatim', async () => {
    const authSebelum = await akunAuthDb();
    expect(await daftar('RANI_08', { pin: '111111' })).toEqual(DIPAKAI);
    expect(await akunAuthDb()).toBe(authSebelum);
  });

  test('dua pendaftaran bersamaan dengan username sama → tepat satu berhasil, tanpa akun Auth yatim', async () => {
    const authSebelum = await akunAuthDb();
    const siswaSebelum = await jumlahSiswa();
    const hasil = await Promise.all([daftar('kembar', { pin: '121212' }), daftar('KEMBAR', { pin: '131313' })]);
    expect(hasil.map((h) => h.status).sort()).toEqual([200, 409]);
    expect(await jumlahSiswa()).toBe(siswaSebelum + 1);
    expect(await akunAuthDb()).toBe(authSebelum + 1);
    expect(auth.pengguna.size).toBe(await akunAuthDb());
  });

  test('kode kelas salah di langkah 2 → KODE_KELAS_SALAH, tercatat, dan tidak ada akun dibuat', async () => {
    const a = denganIp('ip-langkah2');
    const authSebelum = await akunAuthDb();
    expect(await daftar('budi_salah', { kodeKelas: '999999', a })).toEqual(KODE_SALAH);
    expect(await akunAuthDb()).toBe(authSebelum);
    expect(await hitung(`select count(*) as n from public.percobaan_daftar where ip_hash = 'ip-langkah2'`)).toBe(1);
  });

  test('kelas nonaktif → KELAS_TIDAK_SAH (dicek database), akun Auth sementara dihapus lagi', async () => {
    const authSebelum = await akunAuthDb();
    expect(await daftar('citra', { kelasId: kelas.nonaktif })).toEqual({ status: 400, isi: { kode_galat: 'KELAS_TIDAK_SAH' } });
    expect(await daftar('citra', { kelasId: 32000 })).toEqual({ status: 400, isi: { kode_galat: 'KELAS_TIDAK_SAH' } });
    expect(await akunAuthDb()).toBe(authSebelum);
  });

  test.each([['abc'], [0], [-1], [1.5], ['1; drop table siswa']])(
    'kelas_id tidak berbentuk id (%s) → KELAS_TIDAK_SAH sebelum akun dibuat', async (kelasId) => {
      const authSebelum = await akunAuthDb();
      expect(await daftar('dina', { kelasId })).toEqual({ status: 400, isi: { kode_galat: 'KELAS_TIDAK_SAH' } });
      expect(await akunAuthDb()).toBe(authSebelum);
    });

  test.each(['ab', '1abc', 'rani-08', 'rani budi', 'a'.repeat(21), 'réni'])(
    'format username salah "%s" → USERNAME_TIDAK_SAH (FORMAT)', async (username) => {
      expect(await daftar(username)).toEqual({ status: 400, isi: { kode_galat: 'USERNAME_TIDAK_SAH', alasan: 'FORMAT' } });
    });

  test.each(['admin', 'Guru', 'lanora', 'lanora_resmi', 'admin2', 'peneliti_a'])(
    'username terlarang "%s" → USERNAME_TIDAK_SAH (TERLARANG)', async (username) => {
      expect(await daftar(username)).toEqual({ status: 400, isi: { kode_galat: 'USERNAME_TIDAK_SAH', alasan: 'TERLARANG' } });
    });

  test('aturan PIN: bukan 6 angka, konfirmasi berbeda, sama dengan kode kelas; 012345 sah', async () => {
    for (const pin of ['12345', '1234567', '12a456']) expect(await daftar('eka', { pin })).toEqual(tolakPin('BUKAN_6_ANGKA'));
    expect(await daftar('eka', { pin: '482915', ulang: '482916' })).toEqual(tolakPin('TIDAK_SAMA'));
    expect(await daftar('eka', { pin: KODE_KELAS_UJI })).toEqual(tolakPin('SAMA_DENGAN_KODE_KELAS'));
    expect((await daftar('eka', { pin: '012345' })).status).toBe(200);
    expect((await masuk('eka', '012345')).status).toBe(200);
    expect(await masuk('eka', '12345')).toEqual(GAGAL);
  });

  test('isian wajib kosong (termasuk ulang_pin) → ISIAN_KOSONG', async () => {
    const kosong = { status: 400, isi: { kode_galat: 'ISIAN_KOSONG' } };
    expect(await daftar('fajar', { ulang: ' ' })).toEqual(kosong);
    expect(await daftar('fajar', { kelasId: null })).toEqual(kosong);
    expect(await daftar(' ')).toEqual(kosong);
  });

  test('akun dibuat tetapi masuk otomatis gagal → 201 akun_dibuat, akun TETAP ada dan bisa dipakai masuk', async () => {
    auth.gagalMasukBerikutnya = true;
    expect(await daftar('gita', { pin: '242424' })).toEqual({ status: 201, isi: { akun_dibuat: true } });
    expect((await masuk('gita', '242424')).status).toBe(200);
  });

  test('simpan gagal DAN hapus akun Auth gagal → galat server yang menyebut UUID akun yatim (tanpa username/PIN)', async () => {
    auth.gagalHapusBerikutnya = true;
    let galat;
    try {
      await daftar('hana', { kelasId: kelas.nonaktif, pin: '252525' });
    } catch (e) {
      galat = e;
    }
    expect(galat.message).toMatch(/Akun Auth yatim tidak terhapus \([0-9a-f-]{36}\)/);
    expect(galat.message).not.toMatch(/hana|252525/);
    auth.gagalHapusBerikutnya = false;
  });

  test('U9: akun ke-60 dari satu IP diterima, ke-61 ditolak tanpa membuat akun Auth', async () => {
    await kueriPemilik(db, `insert into public.percobaan_daftar (ip_hash, jenis)
                            select 'ip-kelas', 'akun_baru' from generate_series(1, 59)`);
    const a = denganIp('ip-kelas');
    expect((await daftar('ke_enampuluh', { a })).status).toBe(200);
    const authSebelum = await akunAuthDb();
    expect(await daftar('ke_enampuluh_satu', { a })).toEqual(BATAS_DAFTAR);
    expect(await akunAuthDb()).toBe(authSebelum);
  });

  test('satu kelas (30 siswa) dari satu Wi-Fi bisa mendaftar semua', async () => {
    const a = denganIp('ip-wifi-sekolah');
    const hasil = await Promise.all(Array.from({ length: 30 }, (_, i) => daftar(`siswa_${i}`, { a })));
    expect(hasil.every((h) => h.status === 200)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
describe('Masuk dengan username + PIN (api.md 2e.3, K1–K10 per username)', () => {
  beforeAll(async () => {
    for (const [u, pin] of [['joko', '101010'], ['kiki', '111000'], ['lina', '121212'], ['mira', '141414'],
      ['nina', '151515'], ['oki', '161616'], ['putu', '171717'], ['qori', '181818'], ['rudi', '191919']]) {
      await daftar(u, { pin, a: denganIp(`ip-${u}`) });
    }
  }, 60000);

  test('PIN salah, username tidak terdaftar, akun nonaktif → respons sama persis (L7)', async () => {
    expect(await masuk('joko', '999999')).toEqual(GAGAL);
    expect(await masuk('tidak_ada', '999999')).toEqual(GAGAL);
    await kueriPemilik(db, `update public.siswa set aktif = false where username = 'rudi'`);
    expect(await masuk('rudi', '191919')).toEqual(GAGAL);
  });

  test('isian kosong → 400, tidak dihitung; username/PIN berformat salah → MASUK_GAGAL dan dihitung', async () => {
    const sebelum = await statusKunci(db, 'joko');
    for (let i = 0; i < 6; i += 1) expect(await masuk('joko', ' ')).toEqual({ status: 400, isi: { kode_galat: 'ISIAN_KOSONG' } });
    expect(await statusKunci(db, 'joko')).toEqual(sebelum);
    expect(await masuk('qori', '12a')).toEqual(GAGAL);
    expect(await masuk('a b', '181818')).toEqual(GAGAL);
    expect((await statusKunci(db, 'qori')).gagal_berturut).toBe(1);
  });

  test('4 salah lalu benar → berhasil dan hitungan kembali 0 (K8)', async () => {
    await ulangi(4, () => masuk('kiki', '000000'));
    expect((await masuk('KIKI', '111000')).status).toBe(200);
    expect((await statusKunci(db, 'kiki')).gagal_berturut).toBe(0);
  });

  test('kegagalan ke-5 MASUK_GAGAL, ke-6 (PIN benar) 429; setelah 5 menit PIN benar diterima (K7, K10, K6)', async () => {
    expect(await ulangi(5, () => masuk('lina', '000000'))).toEqual(Array(5).fill(GAGAL));
    expect(await masuk('lina', '121212')).toEqual(TERKUNCI);
    await lewatkanKunci(db, 'lina');
    expect((await masuk('lina', '121212')).status).toBe(200);
  });

  test('kunci tidak diperpanjang, tidak memengaruhi akun lain, dan berlaku sama untuk username tidak terdaftar', async () => {
    await ulangi(5, () => masuk('mira', '000000'));
    const awal = (await statusKunci(db, 'mira')).terkunci_sampai;
    await ulangi(3, () => masuk('mira', '000000'));
    expect((await statusKunci(db, 'mira')).terkunci_sampai).toEqual(awal);
    expect((await masuk('nina', '151515')).status).toBe(200);
    await ulangi(5, () => masuk('hantu', '000000'));
    expect(await masuk('hantu', '000000')).toEqual(TERKUNCI);
  });

  test('10 kegagalan bersamaan → hitungan berhenti di 5 dengan satu masa kunci', async () => {
    await Promise.all(Array.from({ length: 10 }, () => masuk('oki', '000000')));
    expect((await statusKunci(db, 'oki')).gagal_berturut).toBe(5);
    expect(await masuk('oki', '161616')).toEqual(TERKUNCI);
  });

  test('kunci memakai HMAC username, bukan username asli', async () => {
    await masuk('putu', '000000');
    const kunci = await turunan.kunciUsername(RAHASIA_UJI, 'putu');
    const kunciDb = (await kueriPemilik(db, 'select kode_hash from public.status_masuk')).map((r) => r.kode_hash);
    expect(kunciDb).not.toContain('putu');
    expect(kunciDb).toContain(kunci);
    expect(kunci).toMatch(/^[0-9a-f]{64}$/);
  });
});

// ---------------------------------------------------------------------------
describe('Buat PIN baru dengan username + kode reset (api.md 2e.4, KF-05c)', () => {
  beforeAll(async () => {
    for (const [u, pin] of [['siti', '303030'], ['tono', '313131'], ['umar', '323232'], ['vina', '333333'],
      ['wati', '343434'], ['xena', '353535'], ['yudi', '363636'], ['zaki', '373737']]) {
      await daftar(u, { pin, a: denganIp(`ip-reset-${u}`) });
    }
  }, 60000);

  test('PIN lama langsung tidak berlaku; PIN baru diterima; akun yang sama', async () => {
    const [sebelum] = await kueriPemilik(db, `select id, auth_user_id from public.siswa where username = 'siti'`);
    const kodeReset = await resetPinUsername(db, alat, 'siti');
    expect(kodeReset).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    expect(await masuk('siti', '303030')).toEqual(GAGAL);
    expect((await aturPin('SITI', kodeReset.toLowerCase(), '404040')).status).toBe(200);
    expect((await masuk('siti', '404040')).status).toBe(200);
    const [sesudah] = await kueriPemilik(db, `select id, auth_user_id from public.siswa where username = 'siti'`);
    expect(sesudah).toEqual(sebelum);
  });

  test('kode salah, milik akun lain, username tidak terdaftar, terpakai, kedaluwarsa → RESET_GAGAL sama persis', async () => {
    const kodeTono = await resetPinUsername(db, alat, 'tono');
    const kodeUmar = await resetPinUsername(db, alat, 'umar');
    expect(await aturPin('tono', 'AAAA-BBBB', '414141')).toEqual(RESET_GAGAL);
    expect(await aturPin('tono', kodeUmar, '414141')).toEqual(RESET_GAGAL);
    expect(await aturPin('tidak_ada', kodeTono, '414141')).toEqual(RESET_GAGAL);
    expect((await aturPin('tono', kodeTono, '414141')).status).toBe(200);
    expect(await aturPin('tono', kodeTono, '515151')).toEqual(RESET_GAGAL);
    await kueriPemilik(db, `update public.reset_pin set kedaluwarsa_pada = now() - interval '1 second' where dipakai_pada is null`);
    expect(await aturPin('umar', kodeUmar, '414141')).toEqual(RESET_GAGAL);
  });

  test('aturan PIN hanya setelah kode valid; kode reset tidak terpakai saat PIN ditolak', async () => {
    const kodeReset = await resetPinUsername(db, alat, 'vina');
    expect(await aturPin('vina', 'ZZZZ-ZZZZ', KODE_KELAS_UJI)).toEqual(RESET_GAGAL);
    expect(await aturPin('vina', kodeReset, '12345')).toEqual(tolakPin('BUKAN_6_ANGKA'));
    expect(await aturPin('vina', kodeReset, '565656', '565657')).toEqual(tolakPin('TIDAK_SAMA'));
    expect(await aturPin('vina', kodeReset, KODE_KELAS_UJI)).toEqual(tolakPin('SAMA_DENGAN_KODE_KELAS'));
    expect((await aturPin('vina', kodeReset, '565656')).status).toBe(200);
  });

  test('reset mengakhiri kunci login username itu', async () => {
    await ulangi(5, () => masuk('wati', '000000'));
    expect(await masuk('wati', '343434')).toEqual(TERKUNCI);
    const kodeReset = await resetPinUsername(db, alat, 'wati');
    expect((await aturPin('wati', kodeReset, '454545')).status).toBe(200);
  });

  test('ganti kata sandi Auth gagal → kode reset dikembalikan dan bisa dipakai lagi', async () => {
    const kodeReset = await resetPinUsername(db, alat, 'xena');
    auth.gagalUbahSandiBerikutnya = true;
    await expect(aturPin('xena', kodeReset, '464646')).rejects.toThrow(/simulasi/);
    expect((await aturPin('xena', kodeReset, '464646')).status).toBe(200);
  });

  test('PIN baru tersimpan tetapi masuk otomatis gagal → 201 pin_diubah; PIN baru berlaku', async () => {
    const kodeReset = await resetPinUsername(db, alat, 'yudi');
    auth.gagalMasukBerikutnya = true;
    expect(await aturPin('yudi', kodeReset, '474747')).toEqual({ status: 201, isi: { pin_diubah: true } });
    expect((await masuk('yudi', '474747')).status).toBe(200);
  });

  test('kesalahan berulang di layar ini ikut dikunci per username (KF-05c detail f)', async () => {
    await ulangi(5, () => aturPin('zaki', 'AAAA-BBBB', '484848'));
    expect(await aturPin('zaki', 'AAAA-BBBB', '484848')).toEqual(TERKUNCI);
  });
});

// ---------------------------------------------------------------------------
describe('Kompatibilitas akun lama (U8)', () => {
  test('akun kode siswa → diberi username → PIN lama TIDAK berlaku → reset → PIN baru; id dan data belajar tetap', async () => {
    const lama = await siapkanSiswa(db, auth, 'S001', { pin: '600600', nama: 'Rani' });
    await kueriPemilik(db, `insert into public.kemajuan_materi (siswa_id, sub_materi, status, kartu_terakhir)
                            values ($1, 'M3', 'selesai', 4)`, [lama.siswaId]);
    await beriUsernameAkunLama(db, lama.siswaId, 'Rani_Lama');

    // Kata sandi lama diturunkan dari kode siswa asli, yang tidak disimpan server (koreksi Tahap 2).
    expect(await masuk('rani_lama', '600600')).toEqual(GAGAL);

    const kodeReset = await resetPinUsername(db, alat, 'rani_lama');
    expect((await aturPin('rani_lama', kodeReset, '616161')).status).toBe(200);
    const h = await masuk('rani_lama', '616161');
    expect(h.status).toBe(200);
    expect(h.isi.siswa).toEqual({ nama_panggilan: 'Rani', kelas: 'VIII-C' });

    const rows = await kueriPemilik(db, 'select id, auth_user_id from public.siswa where username = $1', ['rani_lama']);
    expect(rows).toEqual([{ id: lama.siswaId, auth_user_id: lama.authId }]);
    expect(await hitung('select count(*) as n from public.kemajuan_materi where siswa_id = $1', [lama.siswaId])).toBe(1);
  });
});

// ---------------------------------------------------------------------------
describe('Tidak ada rahasia tersimpan (KF-05 L6)', () => {
  test('PIN, kode kelas, dan kode reset tidak ada di tabel mana pun', async () => {
    await daftar('rahasia_uji', { pin: '482917', a: denganIp('ip-rahasia') });
    await masuk('rahasia_uji', '000002');
    const kodeReset = await resetPinUsername(db, alat, 'rahasia_uji');
    await aturPin('rahasia_uji', kodeReset, '583928');

    const tabel = await kueriPemilik(db, `select tablename from pg_tables where schemaname = 'public'`);
    let semua = '';
    for (const { tablename } of tabel) semua += JSON.stringify(await kueriPemilik(db, `select * from public.${tablename}`));
    for (const rahasia of ['482917', '000002', '583928', KODE_KELAS_UJI, kodeReset, kodeReset.replace('-', '')]) {
      expect(semua).not.toContain(rahasia);
    }
  });
});
