/**
 * Aturan format kode siswa, kode kelas, kode reset, dan PIN (KF-05a, KF-05c, KF-05d).
 * Satu sumber aturan: dipakai Edge Function (Deno), skrip pengelola (Node), dan frontend (Vite).
 * Modul ini TIDAK memuat kode kelas asli. Kode kelas hanya dibandingkan di server lewat hash.
 */

export const POLA_KODE_SISWA = /^S[0-9]{3}$/;
export const POLA_KODE_KELAS = /^[0-9]{6}$/;
export const POLA_PIN = /^[0-9]{6}$/;

/** Huruf dan angka kode reset tanpa yang mirip (0/O, 1/I/L). */
export const ALFABET_KODE_RESET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const PANJANG_KODE_RESET = 8;
const POLA_KODE_RESET = new RegExp(`^[${ALFABET_KODE_RESET}]{${PANJANG_KODE_RESET}}$`);

const keTeks = (nilai) => (typeof nilai === 'string' ? nilai : '');

/** "s001", " S-001 " → "S001" */
export function normalisasiKodeSiswa(teks) {
  return keTeks(teks).toUpperCase().replace(/[\s-]/g, '');
}

export function kodeSiswaSah(kode) {
  return POLA_KODE_SISWA.test(kode);
}

/** Nomor urut → kode siswa: 1 → "S001". */
export function formatKodeSiswa(nomor) {
  if (!Number.isInteger(nomor) || nomor < 1 || nomor > 999) {
    throw new RangeError('Nomor kode siswa harus 1 sampai 999.');
  }
  return `S${String(nomor).padStart(3, '0')}`;
}

/** Kode kelas: hanya spasi yang dihapus. */
export function normalisasiKodeKelas(teks) {
  return keTeks(teks).replace(/\s/g, '');
}

export function kodeKelasSah(kode) {
  return POLA_KODE_KELAS.test(kode);
}

/** PIN tetap teks: angka 0 di depan tidak hilang. Hanya spasi yang dihapus. */
export function normalisasiPin(teks) {
  return keTeks(teks).replace(/\s/g, '');
}

export function pinSah(pin) {
  return POLA_PIN.test(pin);
}

/** "abcd-2345" → "ABCD2345" */
export function normalisasiKodeReset(teks) {
  return keTeks(teks).toUpperCase().replace(/[\s-]/g, '');
}

export function kodeResetSah(kode) {
  return POLA_KODE_RESET.test(kode);
}

/** "ABCD2345" → "ABCD-2345" agar mudah dibacakan guru. */
export function tampilkanKodeReset(kode) {
  return `${kode.slice(0, 4)}-${kode.slice(4)}`;
}

/**
 * Isian jelas tertukar di layar Daftar (D6): huruf S di kolom kode kelas,
 * atau 6 angka di kolom kode siswa. Hanya memeriksa format, bukan keberadaan kode.
 */
export function kodeTertukar(kodeKelasMentah, kodeSiswaMentah) {
  const kelas = normalisasiKodeKelas(kodeKelasMentah).toUpperCase();
  const siswa = normalisasiKodeSiswa(kodeSiswaMentah);
  return kelas.startsWith('S') || POLA_KODE_KELAS.test(siswa);
}
