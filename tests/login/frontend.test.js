// Fase 5A Tahap 5 — logika frontend: validasi sebelum kirim, pesan, pengelompokan kelas,
// penafsiran respons, profil/sapaan, pengaman rute, dan larangan menyimpan rahasia.
import { describe, test, expect, vi } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  periksaIsianMasuk, periksaIsianKodeKelas, periksaIsianDaftar, periksaIsianPinBaru, pesanLogin, kolomGalat,
  PESAN_BERHASIL,
} from '../../src/logika/validasiLogin.js';
import { kelompokkanKelas, labelJenjang } from '../../src/logika/kelasPilihan.js';
import { panggilFungsiLogin, tafsirkanHasilSesi } from '../../src/layanan/autentikasi.js';
import { ambilProfil, sapaan } from '../../src/layanan/api.js';
import { DAFTAR_RUTE, RUTE_TIDAK_DITEMUKAN, tentukanPengalihan } from '../../src/rute.js';
import { cocokkanRute } from '../../src/router.js';

const AKAR = join(import.meta.dirname, '..', '..');
const baca = (jalur) => readFileSync(join(AKAR, jalur), 'utf8');
/** Isi kode tanpa komentar: komentar boleh MENYEBUT nama rahasia/penyimpanan untuk menjelaskan larangannya. */
const kode = (jalur) => baca(jalur)
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^\s*\/\/.*$/gm, '')
  .replace(/\s\/\/ .*$/gm, '');

describe('Validasi sebelum dikirim (design.md 5.0)', () => {
  test('Masuk: username + PIN; format username tidak dibahas agar pesan login seragam', () => {
    expect(periksaIsianMasuk({ username: '', pin: '123456' })).toEqual({ kode_galat: 'ISIAN_KOSONG' });
    expect(periksaIsianMasuk({ username: 'rani_08', pin: '12a456' }))
      .toEqual({ kode_galat: 'PIN_TIDAK_SESUAI_ATURAN', alasan: 'BUKAN_6_ANGKA' });
    expect(periksaIsianMasuk({ username: 'RANI_08', pin: '012345' })).toBeNull();
    expect(periksaIsianMasuk({ username: 'a b', pin: '012345' })).toBeNull(); // server menjawab MASUK_GAGAL
  });

  test('Daftar langkah 1: hanya format 6 angka', () => {
    expect(periksaIsianKodeKelas({ kodeKelas: ' ' })).toEqual({ kode_galat: 'ISIAN_KOSONG' });
    expect(periksaIsianKodeKelas({ kodeKelas: 'S001' })).toEqual({ kode_galat: 'KODE_KELAS_FORMAT' });
    expect(periksaIsianKodeKelas({ kodeKelas: '12345' })).toEqual({ kode_galat: 'KODE_KELAS_FORMAT' });
    expect(periksaIsianKodeKelas({ kodeKelas: ' 123 456 ' })).toBeNull();
  });

  const sah = { kelasId: '3', username: 'Rani_08', pin: '482915', ulangPin: '482915' };
  test('Daftar langkah 2: isian sah (huruf besar boleh, server menjadikannya huruf kecil)', () => {
    expect(periksaIsianDaftar(sah)).toBeNull();
  });

  test('Daftar langkah 2: kelas belum dipilih', () => {
    expect(periksaIsianDaftar({ ...sah, kelasId: '' })).toEqual({ kode_galat: 'KELAS_TIDAK_SAH' });
  });

  test.each(['ab', '1abc', '_abc', 'rani-08', 'rani budi', 'a'.repeat(21), 'réni'])(
    'Daftar langkah 2: username tidak valid "%s"', (username) => {
      expect(periksaIsianDaftar({ ...sah, username })).toEqual({ kode_galat: 'USERNAME_TIDAK_SAH', alasan: 'FORMAT' });
    });

  test('Daftar langkah 2: PIN tidak valid dan PIN tidak sama', () => {
    expect(periksaIsianDaftar({ ...sah, pin: '12345', ulangPin: '12345' }))
      .toEqual({ kode_galat: 'PIN_TIDAK_SESUAI_ATURAN', alasan: 'BUKAN_6_ANGKA' });
    expect(periksaIsianDaftar({ ...sah, ulangPin: '482916' }))
      .toEqual({ kode_galat: 'PIN_TIDAK_SESUAI_ATURAN', alasan: 'TIDAK_SAMA' });
    expect(periksaIsianDaftar({ ...sah, ulangPin: ' ' })).toEqual({ kode_galat: 'ISIAN_KOSONG' });
  });

  test('frontend tidak memeriksa PIN = kode kelas dan tidak tahu username terlarang (hanya server)', () => {
    expect(periksaIsianDaftar({ ...sah, pin: '230706', ulangPin: '230706' })).toBeNull();
    expect(periksaIsianDaftar({ ...sah, username: 'admin' })).toBeNull();
  });

  test('Buat PIN baru: username + kode reset + PIN + ulangi', () => {
    const isi = { username: 'rani_08', kodeReset: 'ABCD-2345', pin: '482915', ulangPin: '482915' };
    expect(periksaIsianPinBaru(isi)).toBeNull();
    expect(periksaIsianPinBaru({ ...isi, kodeReset: '' })).toEqual({ kode_galat: 'ISIAN_KOSONG' });
    expect(periksaIsianPinBaru({ ...isi, ulangPin: '000000' }))
      .toEqual({ kode_galat: 'PIN_TIDAK_SESUAI_ATURAN', alasan: 'TIDAK_SAMA' });
  });

  test('aturan username diambil dari modul yang sama dengan Edge Function (tidak disalin)', () => {
    expect(baca('src/logika/validasiLogin.js')).toMatch(/from '\.\.\/\.\.\/supabase\/functions\/_bersama\/username\.js'/);
  });
});

describe('Pesan untuk siswa (api.md 2e.5)', () => {
  test.each([
    ['masuk', { kode_galat: 'MASUK_GAGAL' }, 'Username atau PIN salah. Periksa kembali, atau tanyakan ke gurumu.'],
    ['masuk', { kode_galat: 'TERLALU_BANYAK_PERCOBAAN' }, 'Terlalu banyak percobaan. Tunggu beberapa menit, lalu coba lagi.'],
    ['daftar', { kode_galat: 'KODE_KELAS_SALAH' }, 'Kode kelas tidak sesuai. Tanyakan ke guru atau penelitimu.'],
    ['daftar', { kode_galat: 'KELAS_TIDAK_SAH' }, 'Pilih kelasmu dari daftar.'],
    ['daftar', { kode_galat: 'USERNAME_SUDAH_DIPAKAI' }, 'Username sudah dipakai. Coba yang lain.'],
    ['daftar', { kode_galat: 'USERNAME_TIDAK_SAH', alasan: 'TERLARANG' }, 'Username ini tidak boleh dipakai. Coba yang lain.'],
    ['daftar', { kode_galat: 'USERNAME_TIDAK_SAH', alasan: 'FORMAT' }, 'Username harus 3–20 karakter: huruf kecil, angka, atau _, dan diawali huruf.'],
    ['daftar', { kode_galat: 'PIN_TIDAK_SESUAI_ATURAN', alasan: 'TIDAK_SAMA' }, 'PIN dan ulangannya belum sama.'],
    ['daftar', { kode_galat: 'PIN_TIDAK_SESUAI_ATURAN', alasan: 'SAMA_DENGAN_KODE_KELAS' }, 'PIN tidak boleh sama dengan kode kelas. Buat PIN lain.'],
    ['daftar', { kode_galat: 'TERLALU_BANYAK_PENDAFTARAN' }, 'Terlalu banyak percobaan pendaftaran dari jaringan ini. Coba lagi nanti, atau minta bantuan gurumu.'],
    ['pinBaru', { kode_galat: 'PIN_TIDAK_SESUAI_ATURAN', alasan: 'TIDAK_SAMA' }, 'PIN baru dan ulangannya belum sama.'],
    ['pinBaru', { kode_galat: 'RESET_GAGAL' }, 'Username atau kode reset tidak sesuai, atau kode reset sudah tidak berlaku. Tanyakan ke guru atau penelitimu.'],
    ['masuk', { kode_galat: 'GALAT_JARINGAN' }, 'Koneksi internet terputus. Periksa koneksimu, lalu coba lagi.'],
    ['masuk', { kode_galat: 'ENTAH' }, 'Maaf, terjadi gangguan. Coba lagi sebentar lagi.'],
  ])('%s %o', (layar, hasil, pesan) => {
    expect(pesanLogin(layar, hasil)).toBe(pesan);
  });

  test('pesan login tidak menyebut apakah username terdaftar', () => {
    expect(pesanLogin('masuk', { kode_galat: 'MASUK_GAGAL' })).not.toMatch(/tidak terdaftar|tidak ditemukan|belum ada/i);
  });

  test('kolom yang ditandai untuk setiap galat', () => {
    expect(kolomGalat({ kode_galat: 'USERNAME_SUDAH_DIPAKAI' })).toBe('username');
    expect(kolomGalat({ kode_galat: 'KELAS_TIDAK_SAH' })).toBe('kelas');
    expect(kolomGalat({ kode_galat: 'PIN_TIDAK_SESUAI_ATURAN', alasan: 'TIDAK_SAMA' })).toBe('ulangPin');
    expect(kolomGalat({ kode_galat: 'MASUK_GAGAL' })).toBeNull();
  });

  test('pesan berhasil tidak memuat data pribadi', () => {
    for (const teks of Object.values(PESAN_BERHASIL)) expect(teks).not.toMatch(/\{|\$|[0-9]{6}/);
  });
});

describe('Pilihan kelas dari server (kelasPilihan.js)', () => {
  test('dikelompokkan per jenjang VII–XII, urutan dari server dipertahankan', () => {
    const dariServer = [
      { id: 7, nama: 'X IPA 1', jenjang: 10 }, { id: 2, nama: 'VIII-A', jenjang: 8 },
      { id: 3, nama: 'VIII-C', jenjang: 8 }, { id: 9, nama: 'VII-B', jenjang: 7 },
    ];
    expect(kelompokkanKelas(dariServer)).toEqual([
      { jenjang: 7, label: 'Kelas VII', kelas: [{ id: 9, nama: 'VII-B' }] },
      { jenjang: 8, label: 'Kelas VIII', kelas: [{ id: 2, nama: 'VIII-A' }, { id: 3, nama: 'VIII-C' }] },
      { jenjang: 10, label: 'Kelas X', kelas: [{ id: 7, nama: 'X IPA 1' }] },
    ]);
  });

  test('entri tidak lengkap atau jenjang di luar VII–XII diabaikan; bukan array → kosong', () => {
    expect(kelompokkanKelas([{ id: 1, nama: 'VI-A', jenjang: 6 }, { id: 'x', nama: 'A', jenjang: 8 }, null])).toEqual([]);
    expect(kelompokkanKelas(undefined)).toEqual([]);
    expect(labelJenjang(12)).toBe('Kelas XII');
  });

  test('frontend tidak berisi daftar kelas hardcode', () => {
    for (const berkas of ['src/halaman/daftar.js', 'src/logika/kelasPilihan.js', 'src/komponen/formulir.js']) {
      expect(baca(berkas), berkas).not.toMatch(/['"](VII|VIII|IX|X|XI|XII)[- ][A-Z0-9]/);
    }
  });
});

describe('Penafsiran respons (tafsirkanHasilSesi)', () => {
  test('200 + token → sesi; 201 akun_dibuat / pin_diubah → tanpa_sesi (BUKAN gagal)', () => {
    expect(tafsirkanHasilSesi({ ok: true, status: 200, data: { access_token: 'a', refresh_token: 'b' } }).jenis).toBe('sesi');
    expect(tafsirkanHasilSesi({ ok: true, status: 201, data: { akun_dibuat: true } })).toEqual({ ok: true, jenis: 'tanpa_sesi' });
    expect(tafsirkanHasilSesi({ ok: true, status: 201, data: { pin_diubah: true } })).toEqual({ ok: true, jenis: 'tanpa_sesi' });
  });

  test('2xx tanpa token dan tanpa tanda → galat server; galat diteruskan', () => {
    expect(tafsirkanHasilSesi({ ok: true, status: 200, data: {} })).toEqual({ ok: false, kode_galat: 'GALAT_SERVER' });
    expect(tafsirkanHasilSesi({ ok: false, kode_galat: 'MASUK_GAGAL' })).toEqual({ ok: false, kode_galat: 'MASUK_GAGAL' });
  });

  test('panggilFungsiLogin: jaringan putus, badan bukan JSON, dan .env kosong', async () => {
    const opsi = (fetchFn) => ({ fetchFn, url: 'https://contoh.invalid', kunci: 'publik' });
    expect(await panggilFungsiLogin('masuk-kode', {}, opsi(async () => { throw new TypeError('x'); })))
      .toEqual({ ok: false, kode_galat: 'GALAT_JARINGAN' });
    expect((await panggilFungsiLogin('masuk-kode', {}, opsi(async () => new Response('<html>', { status: 502 })))).kode_galat)
      .toBe('GALAT_SERVER');
    const fetchFn = vi.fn();
    expect(await panggilFungsiLogin('masuk-kode', {}, { fetchFn, url: '', kunci: '' }))
      .toEqual({ ok: false, kode_galat: 'BELUM_TERHUBUNG' });
    expect(fetchFn).not.toHaveBeenCalled();
  });
});

describe('Profil dan sapaan Beranda (layanan/api.js)', () => {
  test('sapaan memakai username', () => {
    expect(sapaan('wulan123')).toBe('Halo, wulan123');
    expect(sapaan('')).toBe('Halo!');
    expect(sapaan(null)).toBe('Halo!');
  });

  test('ambilProfil memanggil RPC ambil_profil tanpa parameter identitas', async () => {
    const klien = { rpc: vi.fn(async () => ({ data: { nama_panggilan: 'wulan123', kelas: 'VIII-C' }, error: null })) };
    expect(await ambilProfil({ klien })).toEqual({ ok: true, data: { nama_panggilan: 'wulan123', kelas: 'VIII-C' } });
    expect(klien.rpc).toHaveBeenCalledWith('ambil_profil');
  });

  test('ambilProfil: TIDAK_MASUK, jaringan, dan tanpa klien', async () => {
    expect(await ambilProfil({ klien: { rpc: async () => ({ data: null, error: { message: 'TIDAK_MASUK' } }) } }))
      .toEqual({ ok: false, kode_galat: 'TIDAK_MASUK' });
    expect(await ambilProfil({ klien: { rpc: async () => { throw new TypeError('Failed to fetch'); } } }))
      .toEqual({ ok: false, kode_galat: 'GALAT_JARINGAN' });
    expect(await ambilProfil({ klien: null })).toEqual({ ok: false, kode_galat: 'BELUM_TERHUBUNG' });
  });
});

describe('Pengaman rute (tidak berubah)', () => {
  const rute = (jalur) => cocokkanRute(jalur, DAFTAR_RUTE).rute;
  test('belum masuk: hanya Masuk, Daftar, dan Buat PIN baru', () => {
    for (const jalur of ['/masuk', '/daftar', '/pin-baru']) expect(tentukanPengalihan(rute(jalur), false)).toBeNull();
    for (const jalur of ['/beranda', '/latihan', '/kuis']) expect(tentukanPengalihan(rute(jalur), false)).toBe('/masuk');
    expect(tentukanPengalihan(RUTE_TIDAK_DITEMUKAN, false)).toBe('/masuk');
  });
  test('sudah masuk: layar Masuk/Daftar dialihkan ke Beranda', () => {
    expect(tentukanPengalihan(rute('/daftar'), true)).toBe('/beranda');
  });
});

describe('Keamanan frontend', () => {
  const berkasSrc = readdirSync(join(AKAR, 'src'), { recursive: true })
    .filter((f) => f.endsWith('.js')).map((f) => `src/${f.replaceAll('\\', '/')}`);

  test('tidak ada sisa kode siswa (S001 / "Kode siswa") di alur siswa', () => {
    for (const berkas of berkasSrc) {
      expect(baca(berkas), berkas).not.toMatch(/S0\d\d|Kode siswa|ATRIBUT_KODE_SISWA/);
    }
  });

  test('alur login tidak memakai localStorage/sessionStorage dan tidak mencatat ke console', () => {
    for (const berkas of ['src/halaman/masuk.js', 'src/halaman/daftar.js', 'src/halaman/pinBaru.js',
      'src/layanan/autentikasi.js', 'src/logika/validasiLogin.js']) {
      const isi = kode(berkas);
      expect(isi, berkas).not.toMatch(/localStorage|sessionStorage/);
      expect(isi, berkas).not.toMatch(/console\./);
    }
  });

  test('pesan singkat (sessionStorage) hanya diisi teks tetap PESAN_BERHASIL, tidak pernah kode reset/PIN', () => {
    for (const berkas of ['src/halaman/daftar.js', 'src/halaman/pinBaru.js']) {
      const panggilan = [...baca(berkas).matchAll(/simpanPesanSingkat\(([^)]*)\)/g)].map((m) => m[1]);
      expect(panggilan.length).toBeGreaterThan(0);
      for (const arg of panggilan) expect(arg, berkas).toMatch(/^(bersesi \? )?PESAN_BERHASIL\.\w+( : PESAN_BERHASIL\.\w+)?$/);
    }
  });

  test('frontend tidak berisi kode kelas asli atau rahasia server', () => {
    for (const berkas of berkasSrc) {
      expect(kode(berkas), berkas).not.toMatch(/230706|RAHASIA_KODE|KODE_KELAS_HASH|SERVICE_ROLE/);
    }
  });
});
