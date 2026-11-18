/**
 * Logika layar latihan (PRD F-05, F-06, F-08, F-09; design.md 5.5–5.7). Modul murni, tanpa DOM.
 */
import { uraiAngka } from './parserAngka.js';

/** Label kolom jawaban sesuai satuan jawaban soal. */
export function labelJawaban(satuan) {
  return {
    rupiah: 'Jawabanmu (Rp)', persen: 'Jawabanmu (% per tahun)', tahun: 'Jawabanmu (tahun)',
    bulan: 'Jawabanmu (bulan)', hari: 'Jawabanmu (hari)',
  }[satuan] ?? 'Jawabanmu';
}

/**
 * Memecah teks soal menjadi potongan biasa dan potongan yang disorot (petunjuk level 1).
 * Potongan yang tumpang-tindih atau tidak ditemukan diabaikan.
 * @returns {Array<{teks: string, sorot: boolean}>}
 */
export function pecahSorotan(teks, sorotan = []) {
  const rentang = [];
  for (const s of Array.isArray(sorotan) ? sorotan : []) {
    if (typeof s !== 'string' || !s) continue;
    let mulai = teks.indexOf(s);
    while (mulai !== -1 && rentang.some(([a, b]) => mulai < b && mulai + s.length > a)) {
      mulai = teks.indexOf(s, mulai + 1);
    }
    if (mulai !== -1) rentang.push([mulai, mulai + s.length]);
  }
  rentang.sort((x, y) => x[0] - y[0]);
  const hasil = [];
  let posisi = 0;
  for (const [a, b] of rentang) {
    if (a > posisi) hasil.push({ teks: teks.slice(posisi, a), sorot: false });
    hasil.push({ teks: teks.slice(a, b), sorot: true });
    posisi = b;
  }
  if (posisi < teks.length) hasil.push({ teks: teks.slice(posisi), sorot: false });
  return hasil;
}

/** Kolom tabel Diketahui di panel Pahami Soal (api.md 3.4). */
export const KOLOM_PAHAMI = Object.freeze([
  { kunci: 'modal', label: 'Modal awal (Rp)' },
  { kunci: 'suku_bunga', label: 'Suku bunga (% per tahun)' },
  { kunci: 'lama', label: 'Lama menabung' },
  { kunci: 'bunga', label: 'Besar bunga (Rp)' },
  { kunci: 'tabungan_akhir', label: 'Jumlah tabungan akhir (Rp)' },
]);

export const PILIHAN_DITANYA = Object.freeze([
  { nilai: 'bunga', label: 'Besar bunga (B)' },
  { nilai: 'tabungan_akhir', label: 'Jumlah tabungan akhir (A)' },
  { nilai: 'modal', label: 'Modal awal (M)' },
  { nilai: 'suku_bunga', label: 'Suku bunga per tahun (p)' },
  { nilai: 'lama', label: 'Lama menabung (t)' },
]);

/**
 * Mengubah isian Pahami Soal menjadi p_diketahui. Hanya kolom yang diisi yang dikirim
 * ("isi yang ada saja", PRD F-05).
 * @param {Record<string,string>} isian teks per kunci, plus satuan_lama
 * @returns {{ ok: true, diketahui: object } | { ok: false, kunci: string }}
 */
export function susunDiketahui(isian) {
  const diketahui = {};
  for (const { kunci } of KOLOM_PAHAMI) {
    const teks = isian[kunci];
    if (typeof teks !== 'string' || teks.trim() === '') continue;
    const nilai = uraiAngka(teks);
    if (nilai === null) return { ok: false, kunci };
    diketahui[kunci] = nilai;
  }
  if ('lama' in diketahui && isian.satuan_lama) diketahui.satuan_lama = isian.satuan_lama;
  return { ok: true, diketahui };
}

/**
 * Ringkasan setelah satu sesi latihan.
 * @param {Array<{benarPertama: boolean, pernahBenar: boolean, petunjuk: number, dicoba: boolean}>} catatan
 */
export function ringkasLatihan(catatan) {
  const dicoba = catatan.filter((c) => c.dicoba);
  return {
    jumlahSoal: catatan.length,
    dikerjakan: dicoba.length,
    benarPertama: dicoba.filter((c) => c.benarPertama).length,
    pernahBenar: dicoba.filter((c) => c.pernahBenar).length,
    petunjuk: catatan.reduce((n, c) => n + c.petunjuk, 0),
  };
}

/** Lama mengerjakan dalam detik bulat, tidak pernah negatif. */
export const durasiDetik = (mulaiMs, sekarangMs) => Math.max(0, Math.round((sekarangMs - mulaiMs) / 1000));
