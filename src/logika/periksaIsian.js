/**
 * Pemeriksaan isian angka di perangkat untuk materi (contoh setengah jadi dan Coba Sendiri).
 * Materi tidak disimpan sebagai jawaban di server (architecture.md: isi materi ada di frontend),
 * jadi pemeriksaannya cukup di sini. Latihan dan kuis tetap dinilai server.
 */
import { uraiAngka } from './parserAngka.js';

/** Pesan format, sama seperti di latihan (PRD F-09). */
export const PESAN_FORMAT_ANGKA = 'Tulis jawaban dalam angka, contoh: 150000 atau 150.000.';

/** |nilai − kunci| ≤ toleransi, dengan pembulatan kecil agar galat pecahan biner tidak mengubah hasil. */
export function dalamToleransi(nilai, kunci, toleransi) {
  return Math.round(Math.abs(nilai - kunci) * 1e9) / 1e9 <= toleransi;
}

/**
 * @param {string} teks isian siswa
 * @param {{ jawaban: number, toleransi: number }} kunci
 * @returns {{ status: 'kosong'|'format'|'benar'|'salah', nilai: number|null }}
 */
export function periksaIsianMateri(teks, { jawaban, toleransi }) {
  if (typeof teks !== 'string' || teks.trim() === '') return { status: 'kosong', nilai: null };
  const nilai = uraiAngka(teks);
  if (nilai === null) return { status: 'format', nilai: null };
  return { status: dalamToleransi(nilai, jawaban, toleransi) ? 'benar' : 'salah', nilai };
}
