/**
 * Aturan username siswa (KF-05f U3–U5). Satu sumber aturan format untuk Edge Function dan,
 * nanti (Fase 5A Tahap 5), frontend. Sama dengan CHECK di migrasi 0005:
 *   ^[a-z][a-z0-9_]{2,19}$  → 3–20 karakter, huruf kecil/angka/_, diawali huruf.
 * Daftar kata terlarang ada di usernameTerlarang.js dan HANYA dipakai server.
 */

export const POLA_USERNAME = /^[a-z][a-z0-9_]{2,19}$/;

/** " Rani_08 " → "rani_08" (U4: disimpan huruf kecil). */
export function normalisasiUsername(teks) {
  return typeof teks === 'string' ? teks.trim().toLowerCase() : '';
}

/** Format saja (bukan ketersediaan dan bukan kata terlarang). */
export function usernameSah(username) {
  return POLA_USERNAME.test(username);
}
