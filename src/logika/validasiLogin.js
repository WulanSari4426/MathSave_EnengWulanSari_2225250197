/**
 * Pemeriksaan isian layar Masuk, Daftar (dua langkah), dan Buat PIN baru SEBELUM dikirim,
 * serta pesan untuk setiap kode galat (api.md bagian 2e.5; design.md 5.0). KF-05f: username + PIN.
 *
 * Aturan format diambil dari modul yang SAMA dengan Edge Function (_bersama/username.js,
 * _bersama/kodeSiswa.js). Kode kelas asli dan daftar username terlarang TIDAK ada di frontend;
 * keduanya hanya diperiksa server.
 */
import { normalisasiPin, pinSah, normalisasiKodeKelas, kodeKelasSah } from '../../supabase/functions/_bersama/kodeSiswa.js';
import { normalisasiUsername, usernameSah } from '../../supabase/functions/_bersama/username.js';

const kosong = (nilai) => typeof nilai !== 'string' || nilai.trim() === '';

/** Aturan PIN + konfirmasi. null jika sah. */
function periksaPin(pin, ulangPin) {
  if (!pinSah(normalisasiPin(pin))) return { kode_galat: 'PIN_TIDAK_SESUAI_ATURAN', alasan: 'BUKAN_6_ANGKA' };
  if (normalisasiPin(pin) !== normalisasiPin(ulangPin)) {
    return { kode_galat: 'PIN_TIDAK_SESUAI_ATURAN', alasan: 'TIDAK_SAMA' };
  }
  return null;
}

/** Layar Masuk: username + PIN. Format username tidak dibahas agar pesan login tetap seragam. */
export function periksaIsianMasuk({ username, pin }) {
  if (kosong(username) || kosong(pin)) return { kode_galat: 'ISIAN_KOSONG' };
  if (!pinSah(normalisasiPin(pin))) return { kode_galat: 'PIN_TIDAK_SESUAI_ATURAN', alasan: 'BUKAN_6_ANGKA' };
  return null;
}

/** Daftar langkah 1: hanya format 6 angka. Benar/tidaknya kode diperiksa server. */
export function periksaIsianKodeKelas({ kodeKelas }) {
  if (kosong(kodeKelas)) return { kode_galat: 'ISIAN_KOSONG' };
  if (!kodeKelasSah(normalisasiKodeKelas(kodeKelas))) return { kode_galat: 'KODE_KELAS_FORMAT' };
  return null;
}

/** Daftar langkah 2: kelas, username, PIN, konfirmasi PIN. */
export function periksaIsianDaftar({ kelasId, username, pin, ulangPin }) {
  if (kelasId === undefined || kelasId === null || String(kelasId).trim() === '') {
    return { kode_galat: 'KELAS_TIDAK_SAH' };
  }
  if ([username, pin, ulangPin].some(kosong)) return { kode_galat: 'ISIAN_KOSONG' };
  if (!usernameSah(normalisasiUsername(username))) return { kode_galat: 'USERNAME_TIDAK_SAH', alasan: 'FORMAT' };
  return periksaPin(pin, ulangPin);
}

/** Buat PIN baru: username + kode reset + PIN + konfirmasi. */
export function periksaIsianPinBaru({ username, kodeReset, pin, ulangPin }) {
  if ([username, kodeReset, pin, ulangPin].some(kosong)) return { kode_galat: 'ISIAN_KOSONG' };
  return periksaPin(pin, ulangPin);
}

const PESAN_UMUM = {
  GALAT_SERVER: 'Maaf, terjadi gangguan. Coba lagi sebentar lagi.',
  GALAT_JARINGAN: 'Koneksi internet terputus. Periksa koneksimu, lalu coba lagi.',
  BELUM_TERHUBUNG: 'Aplikasi belum terhubung ke server. Beri tahu gurumu.',
  // Supabase Auth membatasi laju (503). Bukan kesalahan siswa; PIN tidak dihitung salah.
  LAYANAN_SIBUK: 'Server sedang sibuk. Tunggu sebentar, lalu coba lagi.',
};

const PESAN_PIN = {
  BUKAN_6_ANGKA: 'PIN harus 6 angka.',
  SAMA_DENGAN_KODE_KELAS: 'PIN tidak boleh sama dengan kode kelas. Buat PIN lain.',
  TIDAK_SAMA: 'PIN dan ulangannya belum sama.',
};

const PESAN_USERNAME = {
  FORMAT: 'Username harus 3–20 karakter: huruf kecil, angka, atau _, dan diawali huruf.',
  TERLARANG: 'Username ini tidak boleh dipakai. Coba yang lain.',
};

const PESAN_LAYAR = {
  masuk: {
    ISIAN_KOSONG: 'Tulis username dan PIN-mu dulu.',
    MASUK_GAGAL: 'Username atau PIN salah. Periksa kembali, atau tanyakan ke gurumu.',
    TERLALU_BANYAK_PERCOBAAN: 'Terlalu banyak percobaan. Tunggu beberapa menit, lalu coba lagi.',
  },
  daftar: {
    ISIAN_KOSONG: 'Lengkapi semua isian dulu.',
    KODE_KELAS_FORMAT: 'Kode kelas berupa 6 angka.',
    KODE_KELAS_SALAH: 'Kode kelas tidak sesuai. Tanyakan ke guru atau penelitimu.',
    KELAS_TIDAK_SAH: 'Pilih kelasmu dari daftar.',
    KELAS_KOSONG: 'Belum ada kelas yang bisa dipilih. Beri tahu gurumu.',
    USERNAME_SUDAH_DIPAKAI: 'Username sudah dipakai. Coba yang lain.',
    TERLALU_BANYAK_PENDAFTARAN:
      'Terlalu banyak percobaan pendaftaran dari jaringan ini. Coba lagi nanti, atau minta bantuan gurumu.',
  },
  pinBaru: {
    ISIAN_KOSONG: 'Lengkapi username, kode reset, dan PIN barumu.',
    RESET_GAGAL:
      'Username atau kode reset tidak sesuai, atau kode reset sudah tidak berlaku. Tanyakan ke guru atau penelitimu.',
    TERLALU_BANYAK_PERCOBAAN: 'Terlalu banyak percobaan. Tunggu beberapa menit, lalu coba lagi.',
  },
};

/** Pesan sekali tampil setelah berhasil (pesanSingkat). Tidak pernah memuat username, PIN, atau kode. */
export const PESAN_BERHASIL = {
  daftarMasuk: 'Pendaftaran berhasil. Ingat username dan PIN-mu untuk masuk berikutnya.',
  daftarTanpaSesi: 'Akun sudah dibuat. Silakan masuk dengan username dan PIN-mu.',
  pinBaruMasuk: 'PIN baru tersimpan. Ingat PIN-mu, ya.',
  pinBaruTanpaSesi: 'PIN baru tersimpan. Silakan masuk dengan PIN barumu.',
};

/**
 * @param {'masuk'|'daftar'|'pinBaru'} layar
 * @param {{kode_galat: string, alasan?: string}} hasil
 */
export function pesanLogin(layar, { kode_galat: kode, alasan } = {}) {
  if (kode === 'PIN_TIDAK_SESUAI_ATURAN') {
    if (layar === 'pinBaru' && alasan === 'TIDAK_SAMA') return 'PIN baru dan ulangannya belum sama.';
    return PESAN_PIN[alasan] ?? PESAN_PIN.BUKAN_6_ANGKA;
  }
  if (kode === 'USERNAME_TIDAK_SAH') return PESAN_USERNAME[alasan] ?? PESAN_USERNAME.FORMAT;
  return PESAN_LAYAR[layar]?.[kode] ?? PESAN_UMUM[kode] ?? PESAN_UMUM.GALAT_SERVER;
}

/** Kolom mana yang perlu ditandai/difokuskan untuk suatu galat (bantuan aksesibilitas). */
export function kolomGalat({ kode_galat: kode, alasan } = {}) {
  if (kode === 'USERNAME_TIDAK_SAH' || kode === 'USERNAME_SUDAH_DIPAKAI') return 'username';
  if (kode === 'KELAS_TIDAK_SAH') return 'kelas';
  if (kode === 'KODE_KELAS_FORMAT' || kode === 'KODE_KELAS_SALAH') return 'kodeKelas';
  if (kode === 'PIN_TIDAK_SESUAI_ATURAN') return alasan === 'TIDAK_SAMA' ? 'ulangPin' : 'pin';
  return null;
}
