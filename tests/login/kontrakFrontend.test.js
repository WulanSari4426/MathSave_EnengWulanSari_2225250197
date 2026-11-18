// Fase 5A Tahap 5 — tes kontrak ujung-ke-ujung (tanpa Supabase asli):
//   layanan frontend (src/layanan/autentikasi.js, api.js)
//     → fetch palsu → penangan HTTP ASLI (_bersama/penangan.js)
//     → logika Edge Function ASLI (_bersama/alurLogin.js)
//     → RPC ASLI migrasi 0001–0005 di PGlite (+ Auth palsu).
// Dengan begitu frontend diuji terhadap respons backend yang sebenarnya, bukan respons karangan.
import { describe, test, expect, beforeAll, vi } from 'vitest';
import { buatDb, rpcSebagai } from '../db/bantuDb.js';
import {
  buatAuthPalsu, buatAlatUji, tambahKelas, setelKelasAktif, resetPinUsername, kueriPemilik, KODE_KELAS_UJI,
} from './alatUji.js';
import { buatPenangan } from '../../supabase/functions/_bersama/penangan.js';
import { prosesMasuk, prosesDaftarPertama, prosesAturPinBaru } from '../../supabase/functions/_bersama/alurLogin.js';
import { masuk, periksaKodeKelas, daftarAkun, aturPinBaru } from '../../src/layanan/autentikasi.js';
import { ambilProfil, sapaan } from '../../src/layanan/api.js';
import { pesanLogin } from '../../src/logika/validasiLogin.js';
import { tandaiKolom } from '../../src/komponen/formulir.js';
import { tampilkanKodeReset } from '../../supabase/functions/_bersama/kodeSiswa.js';

let db;
let auth;
let alat;
let kelas;
let ipBerikut = 0;

/** fetch palsu: meneruskan ke penangan HTTP asli Edge Function, tanpa jaringan. */
function buatOpsi({ ip } = {}) {
  const proses = { 'masuk-kode': prosesMasuk, 'daftar-pertama': prosesDaftarPertama, 'atur-pin-baru': prosesAturPinBaru };
  const ipHash = ip ?? `ip-uji-${(ipBerikut += 1)}`;
  const fetchFn = async (url, init) => {
    const nama = new URL(url).pathname.split('/').pop();
    const penangan = buatPenangan(proses[nama], async () => ({ ...alat, ipHash }), { catatGalat: () => {} });
    return penangan(new Request(url, init));
  };
  const setSession = vi.fn(async () => ({ error: null }));
  return { fetchFn, url: 'https://lanora-uji.invalid', kunci: 'kunci-publik-uji', setSession };
}

/** Klien RPC palsu untuk ambilProfil: token sesi Auth palsu "akses-<authId>" → RPC sebagai siswa itu. */
const klienDariSesi = (setSession) => {
  const token = setSession.mock.calls.at(-1)[0].access_token;
  const authId = token.replace('akses-', '');
  return { authId, klien: { rpc: async (nama, param) => ({ data: await rpcSebagai(db, { authId }, nama, param), error: null }) } };
};

const daftarLengkap = (username, pin, opsi, kelasId = kelas.viiic) =>
  daftarAkun({ kodeKelas: KODE_KELAS_UJI, kelasId: String(kelasId), username, pin, ulangPin: pin }, opsi);

beforeAll(async () => {
  db = await buatDb();
  auth = buatAuthPalsu(db);
  alat = await buatAlatUji(db, auth);
  kelas = {
    viiic: await tambahKelas(db, 'VIII-C', 8),
    xipa: await tambahKelas(db, 'X IPA 1', 10),
    nonaktif: await tambahKelas(db, 'VII-Z', 7),
  };
  await setelKelasAktif(db, kelas.nonaktif, false);
}, 60000);

describe('Pendaftaran dua langkah (frontend → backend asli)', () => {
  test('langkah 1: kode benar → daftar kelas aktif dari server (bukan hardcode)', async () => {
    expect(await periksaKodeKelas(KODE_KELAS_UJI, buatOpsi())).toEqual({
      ok: true,
      kelas: [{ id: kelas.viiic, nama: 'VIII-C', jenjang: 8 }, { id: kelas.xipa, nama: 'X IPA 1', jenjang: 10 }],
    });
  });

  test('langkah 1: kode kelas salah → "Kode kelas tidak sesuai."', async () => {
    const hasil = await periksaKodeKelas('999999', buatOpsi());
    expect(hasil).toMatchObject({ ok: false, status: 401, kode_galat: 'KODE_KELAS_SALAH' });
    expect(pesanLogin('daftar', hasil)).toMatch(/^Kode kelas tidak sesuai\./);
  });

  test('langkah 2 berhasil → sesi disimpan; profil = username; sapaan "Halo, wulan123"', async () => {
    const opsi = buatOpsi();
    const hasil = await daftarLengkap('Wulan123', '482915', opsi);
    expect(hasil).toEqual({ ok: true, jenis: 'sesi', siswa: { nama_panggilan: 'wulan123', kelas: 'VIII-C' } });
    expect(opsi.setSession).toHaveBeenCalledTimes(1);
    const { klien } = klienDariSesi(opsi.setSession);
    const profil = await ambilProfil({ klien });
    expect(profil).toEqual({ ok: true, data: { nama_panggilan: 'wulan123', kelas: 'VIII-C' } });
    expect(sapaan(profil.data.nama_panggilan)).toBe('Halo, wulan123');
  });

  test('username sudah dipakai (beda huruf besar/kecil)', async () => {
    const hasil = await daftarLengkap('WULAN123', '111111', buatOpsi());
    expect(hasil).toMatchObject({ ok: false, status: 409, kode_galat: 'USERNAME_SUDAH_DIPAKAI' });
    expect(pesanLogin('daftar', hasil)).toBe('Username sudah dipakai. Coba yang lain.');
  });

  test('username terlarang (hanya diketahui server)', async () => {
    const hasil = await daftarLengkap('admin', '111111', buatOpsi());
    expect(hasil).toMatchObject({ ok: false, kode_galat: 'USERNAME_TIDAK_SAH', alasan: 'TERLARANG' });
  });

  test('username format salah tetap ditolak server walau frontend dilewati', async () => {
    expect(await daftarLengkap('a b', '111111', buatOpsi())).toMatchObject({ kode_galat: 'USERNAME_TIDAK_SAH', alasan: 'FORMAT' });
  });

  test('kelas tidak aktif ditolak, dan pesan memandu memilih ulang', async () => {
    const hasil = await daftarLengkap('citra', '111111', buatOpsi(), kelas.nonaktif);
    expect(hasil).toMatchObject({ ok: false, kode_galat: 'KELAS_TIDAK_SAH' });
    expect(pesanLogin('daftar', hasil)).toBe('Pilih kelasmu dari daftar.');
  });

  test('PIN tidak sama dan PIN tidak valid (frontend dilewati, server tetap menolak)', async () => {
    const opsi = buatOpsi();
    expect(await daftarAkun({ kodeKelas: KODE_KELAS_UJI, kelasId: kelas.viiic, username: 'dina', pin: '482915', ulangPin: '482916' }, opsi))
      .toMatchObject({ kode_galat: 'PIN_TIDAK_SESUAI_ATURAN', alasan: 'TIDAK_SAMA' });
    expect(await daftarLengkap('dina', '12a456', opsi))
      .toMatchObject({ kode_galat: 'PIN_TIDAK_SESUAI_ATURAN', alasan: 'BUKAN_6_ANGKA' });
    expect(opsi.setSession).not.toHaveBeenCalled();
  });

  test('HTTP 201 akun_dibuat tanpa sesi → "tanpa_sesi" (BUKAN gagal); akun bisa dipakai masuk', async () => {
    auth.gagalMasukBerikutnya = true;
    const opsi = buatOpsi();
    const hasil = await daftarLengkap('eka_201', '242424', opsi);
    expect(hasil).toEqual({ ok: true, jenis: 'tanpa_sesi' });
    expect(opsi.setSession).not.toHaveBeenCalled();
    expect((await masuk('eka_201', '242424', buatOpsi())).ok).toBe(true);
  });
});

describe('Masuk dengan username + PIN', () => {
  test('berhasil (tidak peka huruf besar) → sesi disimpan', async () => {
    const opsi = buatOpsi();
    expect(await masuk('WULAN123', '482915', opsi)).toEqual({ ok: true, jenis: 'sesi', siswa: { nama_panggilan: 'wulan123', kelas: 'VIII-C' } });
    expect(opsi.setSession).toHaveBeenCalledWith({ access_token: expect.any(String), refresh_token: expect.any(String) });
  });

  test('PIN salah dan username tidak terdaftar → respons dan pesan SAMA PERSIS', async () => {
    const a = await masuk('wulan123', '000000', buatOpsi());
    const b = await masuk('tidak_ada_siapa', '000000', buatOpsi());
    expect(a).toEqual(b);
    expect(pesanLogin('masuk', a)).toBe('Username atau PIN salah. Periksa kembali, atau tanyakan ke gurumu.');
  });

  test('penguncian backend tetap berlaku: percobaan ke-6 → pesan tunggu (lama kunci bertingkat, tidak disebut)', async () => {
    await daftarLengkap('fajar', '151515', buatOpsi());
    for (let i = 0; i < 5; i += 1) await masuk('fajar', '000000', buatOpsi());
    const hasil = await masuk('fajar', '151515', buatOpsi());
    expect(hasil).toMatchObject({ ok: false, status: 429, kode_galat: 'TERLALU_BANYAK_PERCOBAAN' });
    expect(pesanLogin('masuk', hasil)).toBe('Terlalu banyak percobaan. Tunggu beberapa menit, lalu coba lagi.');
  });

  test('gagal menyimpan sesi di perangkat → galat server (tidak dianggap masuk)', async () => {
    const opsi = buatOpsi();
    opsi.setSession = vi.fn(async () => ({ error: new Error('penyimpanan penuh') }));
    expect(await masuk('wulan123', '482915', opsi)).toEqual({ ok: false, kode_galat: 'GALAT_SERVER' });
  });
});

describe('Buat PIN baru dengan username + kode reset', () => {
  test('berhasil → sesi; PIN lama tidak berlaku, PIN baru berlaku', async () => {
    await daftarLengkap('gita', '303030', buatOpsi());
    const kodeReset = await resetPinUsername(db, alat, 'gita');
    const opsi = buatOpsi();
    expect(await aturPinBaru({ username: 'Gita', kodeReset: kodeReset.toLowerCase(), pin: '404040', ulangPin: '404040' }, opsi))
      .toMatchObject({ ok: true, jenis: 'sesi' });
    expect((await masuk('gita', '303030', buatOpsi())).ok).toBe(false);
    expect((await masuk('gita', '404040', buatOpsi())).ok).toBe(true);
  });

  test('HTTP 201 pin_diubah tanpa sesi → "tanpa_sesi"; PIN baru berlaku', async () => {
    await daftarLengkap('hana', '313131', buatOpsi());
    const kodeReset = await resetPinUsername(db, alat, 'hana');
    auth.gagalMasukBerikutnya = true;
    const opsi = buatOpsi();
    expect(await aturPinBaru({ username: 'hana', kodeReset, pin: '414141', ulangPin: '414141' }, opsi))
      .toEqual({ ok: true, jenis: 'tanpa_sesi' });
    expect(opsi.setSession).not.toHaveBeenCalled();
    expect((await masuk('hana', '414141', buatOpsi())).ok).toBe(true);
  });

  test('kode salah → RESET_GAGAL; PIN tidak sama → TIDAK_SAMA (setelah kode valid)', async () => {
    await daftarLengkap('ika', '323232', buatOpsi());
    expect(await aturPinBaru({ username: 'ika', kodeReset: 'AAAA-BBBB', pin: '424242', ulangPin: '424242' }, buatOpsi()))
      .toMatchObject({ kode_galat: 'RESET_GAGAL' });
    const kodeReset = await resetPinUsername(db, alat, 'ika');
    const hasil = await aturPinBaru({ username: 'ika', kodeReset, pin: '424242', ulangPin: '424243' }, buatOpsi());
    expect(hasil).toMatchObject({ kode_galat: 'PIN_TIDAK_SESUAI_ATURAN', alasan: 'TIDAK_SAMA' });
    expect(pesanLogin('pinBaru', hasil)).toBe('PIN baru dan ulangannya belum sama.');
  });

  test('kode reset tidak pernah dicatat ke console oleh layanan frontend', async () => {
    await daftarLengkap('joni', '333333', buatOpsi());
    const kodeReset = await resetPinUsername(db, alat, 'joni');
    const mata = ['log', 'info', 'warn', 'error', 'debug'].map((m) => vi.spyOn(console, m).mockImplementation(() => {}));
    await aturPinBaru({ username: 'joni', kodeReset, pin: '434343', ulangPin: '434343' }, buatOpsi());
    for (const m of mata) {
      expect(JSON.stringify(m.mock.calls)).not.toContain(kodeReset);
      m.mockRestore();
    }
    expect(kodeReset).toBe(tampilkanKodeReset(kodeReset.replace('-', '')));
  });
});

describe('Profil dan data belajar tetap terhubung ke siswa yang benar', () => {
  test('setiap akun hanya melihat profil dan kemajuan miliknya; sesi menentukan siswa, bukan parameter', async () => {
    const opsiA = buatOpsi();
    const opsiB = buatOpsi();
    await daftarLengkap('kiki_a', '515151', opsiA, kelas.viiic);
    await daftarLengkap('lala_b', '525252', opsiB, kelas.xipa);
    const a = klienDariSesi(opsiA.setSession);
    const b = klienDariSesi(opsiB.setSession);

    expect((await ambilProfil({ klien: a.klien })).data).toEqual({ nama_panggilan: 'kiki_a', kelas: 'VIII-C' });
    expect((await ambilProfil({ klien: b.klien })).data).toEqual({ nama_panggilan: 'lala_b', kelas: 'X IPA 1' });

    await rpcSebagai(db, { authId: a.authId }, 'simpan_kemajuan', { p_sub_materi: 'M3', p_status: 'selesai', p_kartu_terakhir: 4 });
    expect((await rpcSebagai(db, { authId: a.authId }, 'ringkasan_kemajuan')).sub_materi_selesai).toBe(1);
    expect((await rpcSebagai(db, { authId: b.authId }, 'ringkasan_kemajuan')).sub_materi_selesai).toBe(0);

    // Masuk ulang memakai siswa.id yang sama → data belajar tetap ada.
    const [sebelum] = await kueriPemilik(db, `select id from public.siswa where username = 'kiki_a'`);
    const opsiUlang = buatOpsi();
    await masuk('kiki_a', '515151', opsiUlang);
    const ulang = klienDariSesi(opsiUlang.setSession);
    expect(ulang.authId).toBe(a.authId);
    expect((await rpcSebagai(db, { authId: ulang.authId }, 'ringkasan_kemajuan')).sub_materi_selesai).toBe(1);
    const [sesudah] = await kueriPemilik(db, `select id from public.siswa where username = 'kiki_a'`);
    expect(sesudah.id).toBe(sebelum.id);
  });
});

describe('Komponen formulir', () => {
  test('tandaiKolom aman dipanggil tanpa kolom (null)', () => {
    expect(() => tandaiKolom(null, true)).not.toThrow();
  });
});
