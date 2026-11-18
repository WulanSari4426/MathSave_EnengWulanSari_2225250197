/**
 * Mengurai dan memformat angka dalam format Indonesia (docs/api.md bagian 5.2).
 * Titik = pemisah ribuan, koma = desimal. Contoh: 1.234.567,5
 * Modul murni: tanpa DOM dan jaringan.
 */
import { GalatMasukan } from './galat.js';

const POLA_RIBUAN_TITIK = /^\d{1,3}(\.\d{3})+$/; // 1.200.000
const POLA_RIBUAN_KOMA = /^\d{1,3}(,\d{3}){2,}$/; // 1,200,000 (format Inggris, minimal 2 koma)
const POLA_LENGKAP_ID = /^\d{1,3}(\.\d{3})+,\d+$/; // 1.200.000,50

/**
 * Mengubah teks jawaban siswa menjadi angka.
 *
 * Aturan:
 *  - "Rp", spasi, dan tanda "%" di akhir diabaikan.
 *  - Titik dengan kelompok 3 angka = ribuan: "1.200.000" → 1200000, "1.500" → 1500.
 *  - Satu koma = desimal: "2,5" → 2.5.
 *  - Satu titik yang BUKAN pola ribuan = desimal (keyboard ponsel sering memakai titik): "2.5" → 2.5.
 *  - Titik dan koma bersama harus format Indonesia: "1.200.000,5" → 1200000.5.
 *  - Tanda minus di depan diterima ("-5"); kewajaran nilai diperiksa di tempat lain.
 *
 * @param {string|number} teks
 * @returns {number|null} null jika teks bukan angka yang valid
 */
export function uraiAngka(teks) {
  if (typeof teks === 'number') return Number.isFinite(teks) ? teks : null;
  if (typeof teks !== 'string') return null;

  let s = teks.replace(/[\s ]/g, '');
  let tanda = 1;
  if (s.startsWith('-')) {
    tanda = -1;
    s = s.slice(1);
  }
  s = s.replace(/^rp\.?/i, '').replace(/%$/, '');

  if (!/^[\d.,]+$/.test(s) || !/\d/.test(s)) return null;

  const jumlahTitik = (s.match(/\./g) || []).length;
  const jumlahKoma = (s.match(/,/g) || []).length;
  let baku; // format yang dipahami Number(), misalnya "1200000.5"

  if (jumlahTitik > 0 && jumlahKoma > 0) {
    if (!POLA_LENGKAP_ID.test(s)) return null;
    baku = s.replace(/\./g, '').replace(',', '.');
  } else if (jumlahTitik > 0) {
    if (POLA_RIBUAN_TITIK.test(s)) baku = s.replace(/\./g, '');
    else if (jumlahTitik === 1 && /^\d*\.\d+$/.test(s)) baku = s;
    else return null;
  } else if (jumlahKoma > 0) {
    if (jumlahKoma === 1 && /^\d*,\d+$/.test(s)) baku = s.replace(',', '.');
    else if (POLA_RIBUAN_KOMA.test(s)) baku = s.replace(/,/g, '');
    else return null;
  } else {
    baku = s;
  }

  const angka = Number(baku);
  if (!Number.isFinite(angka)) return null;
  return angka === 0 ? 0 : tanda * angka;
}

function pastikanAngka(angka) {
  if (typeof angka !== 'number' || !Number.isFinite(angka)) {
    throw new GalatMasukan('BUKAN_ANGKA', 'Nilai yang akan ditampilkan harus berupa angka.');
  }
}

/** "1200000" → "1.200.000" */
function kelompokkanRibuan(bilanganBulat) {
  return bilanganBulat.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Format angka Indonesia, maksimal `maksDesimal` angka di belakang koma.
 * Nol di akhir desimal dibuang. Contoh: 2.5 → "2,5"; 1200000 → "1.200.000"; 2/3 → "0,67".
 * @param {number} angka
 * @param {number} [maksDesimal=2]
 * @returns {string}
 */
export function formatAngka(angka, maksDesimal = 2) {
  pastikanAngka(angka);
  const [bulat, desimal = ''] = Math.abs(angka).toFixed(maksDesimal).split('.');
  const desimalBersih = desimal.replace(/0+$/, '');
  const teks = kelompokkanRibuan(bulat) + (desimalBersih ? ',' + desimalBersih : '');
  const nol = /^[0,]+$/.test(teks);
  return angka < 0 && !nol ? '-' + teks : teks;
}

/**
 * Format Rupiah, dibulatkan ke rupiah terdekat (KF-09: aturan pembulatan BELUM DIKONFIRMASI;
 * pembulatan ke rupiah terdekat mengikuti NF-08 di PRD).
 * Contoh: 80000 → "Rp80.000"; -5000 → "-Rp5.000".
 * @param {number} angka
 * @returns {string}
 */
export function formatRupiah(angka) {
  pastikanAngka(angka);
  const bulat = Math.round(Math.abs(angka));
  const teks = 'Rp' + kelompokkanRibuan(String(bulat));
  return angka < 0 && bulat !== 0 ? '-' + teks : teks;
}
