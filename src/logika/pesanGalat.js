/**
 * Pesan galat RPC untuk siswa (api.md bagian 4). Modul murni, tanpa DOM.
 */
export const PESAN_GALAT_RPC = Object.freeze({
  TIDAK_MASUK: 'Sesi berakhir. Silakan masuk lagi.',
  SOAL_TIDAK_DITEMUKAN: 'Soal tidak ditemukan. Coba muat ulang.',
  INPUT_TIDAK_VALID: 'Ada isian yang belum sesuai.',
  SESI_TIDAK_VALID: 'Kuis tidak ditemukan.',
  KUIS_SUDAH_SELESAI: 'Kuis ini sudah selesai.',
  PETUNJUK_TIDAK_TERSEDIA: 'Petunjuk tidak tersedia saat kuis.',
  WAKTU_HABIS: 'Waktu kuis sudah habis. Jawabanmu sudah dikumpulkan.',
  OPSI_TIDAK_VALID: 'Pilihan jawaban tidak dikenal. Coba pilih lagi.',
  BATAS_PERCOBAAN_KUIS: 'Kamu sudah memakai 2 kesempatan kuis. Nilai tertinggimu tetap tersimpan.',
  BANK_SOAL_KURANG: 'Kuis belum bisa dimulai karena bank soal belum mencukupi. Beri tahu gurumu.',
  GALAT_JARINGAN: 'Koneksi internet terputus. Periksa koneksimu, lalu coba lagi.',
  BELUM_TERHUBUNG: 'Aplikasi belum terhubung ke server. Beri tahu gurumu.',
  GALAT_SERVER: 'Maaf, terjadi gangguan. Coba lagi sebentar lagi.',
});

/** @param {string} kode @returns {string} */
export function pesanGalatRpc(kode) {
  return PESAN_GALAT_RPC[kode] ?? PESAN_GALAT_RPC.GALAT_SERVER;
}
