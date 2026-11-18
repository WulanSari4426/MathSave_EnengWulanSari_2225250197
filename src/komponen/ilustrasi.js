/**
 * Ilustrasi matematika sederhana (SVG inline) untuk tema Sage Green + Cream.
 * Lihat docs/design.md bagian 7.
 *
 * Aturan pemakaian:
 *  - Hanya di kepala halaman menu utama (Beranda, Belajar, Latihan, Riwayat, Simulasi),
 *    halaman Masuk, Hasil Kuis, dan Halaman tidak ditemukan.
 *  - TIDAK dipakai di layar fokus (kartu materi, soal latihan, kuis) agar tidak
 *    mengganggu konsentrasi siswa (EL03, DS03).
 *  - Warna diatur lewat kelas CSS (`.il-*` di utama.css), bukan warna langsung,
 *    agar tetap memakai token tema.
 *  - Bersifat dekoratif: aria-hidden="true", tidak mengandung informasi materi.
 */

const BUKA = (label) =>
  `<svg class="ilustrasi" viewBox="0 0 120 120" aria-hidden="true" focusable="false" data-ilustrasi="${label}">`;
const TUTUP = '</svg>';

/** Wajah lucu kecil: dua mata dan senyum, berpusat di (cx, cy). */
function wajah(cx, cy, jarak = 7) {
  return `
    <circle class="il-mata" cx="${cx - jarak}" cy="${cy}" r="2.4"/>
    <circle class="il-mata" cx="${cx + jarak}" cy="${cy}" r="2.4"/>
    <path class="il-garis-tipis" d="M${cx - 4} ${cy + 5} q4 4 8 0"/>
    <circle class="il-pipi" cx="${cx - jarak - 4}" cy="${cy + 5}" r="2.6"/>
    <circle class="il-pipi" cx="${cx + jarak + 4}" cy="${cy + 5}" r="2.6"/>`;
}

const ILUSTRASI = {
  /** Celengan dengan koin masuk. Untuk Beranda & Masuk. */
  celengan: `${BUKA('celengan')}
    <ellipse class="il-bayang" cx="60" cy="104" rx="34" ry="5"/>
    <circle class="il-kuning il-garis" cx="62" cy="20" r="11"/>
    <text class="il-teks" x="62" y="24.5" text-anchor="middle" font-size="11">Rp</text>
    <path class="il-peach il-garis" d="M22 66c0-19 17-32 40-32s40 13 40 32-17 30-40 30-40-11-40-30z"/>
    <path class="il-peach il-garis" d="M36 42l-4-13 14 7"/>
    <rect class="il-krem il-garis" x="51" y="36" width="20" height="5" rx="2.5"/>
    <rect class="il-peach il-garis" x="34" y="88" width="10" height="12" rx="4"/>
    <rect class="il-peach il-garis" x="76" y="88" width="10" height="12" rx="4"/>
    <ellipse class="il-peach-tua il-garis" cx="98" cy="66" rx="7" ry="9"/>
    <circle class="il-mata" cx="96" cy="64" r="1.6"/>
    <circle class="il-mata" cx="100" cy="64" r="1.6"/>
    ${wajah(70, 60, 8)}
    <path class="il-garis il-kosong" d="M22 62c-6 0-8 6-4 8"/>
  ${TUTUP}`,

  /** Buku terbuka dengan simbol. Untuk Belajar. */
  buku: `${BUKA('buku')}
    <ellipse class="il-bayang" cx="60" cy="104" rx="38" ry="5"/>
    <path class="il-sage il-garis" d="M14 34h40c3 0 6 3 6 6v56c0-3-3-6-6-6H14z"/>
    <path class="il-sage il-garis" d="M106 34H66c-3 0-6 3-6 6v56c0-3 3-6 6-6h40z"/>
    <path class="il-putih il-garis" d="M20 30h32c4 0 8 4 8 8v52c0-3-3-6-7-6H20z"/>
    <path class="il-putih il-garis" d="M100 30H68c-4 0-8 4-8 8v52c0-3 3-6 7-6h33z"/>
    <text class="il-teks" x="36" y="52" text-anchor="middle" font-size="14">+</text>
    <text class="il-teks" x="36" y="72" text-anchor="middle" font-size="14">×</text>
    <text class="il-teks" x="84" y="52" text-anchor="middle" font-size="13">%</text>
    <text class="il-teks" x="84" y="72" text-anchor="middle" font-size="14">=</text>
    <circle class="il-kuning il-garis" cx="100" cy="20" r="8"/>
    <path class="il-garis-tipis" d="M100 15v10M95 20h10"/>
  ${TUTUP}`,

  /** Tumpukan koin berwajah. Untuk Simulasi (sejalan dengan ilustrasi 3D koin). */
  koin: `${BUKA('koin')}
    <ellipse class="il-bayang" cx="60" cy="104" rx="36" ry="5"/>
    <g class="il-kuning il-garis">
      <path d="M18 92v-8h36v8c0 4-8 7-18 7s-18-3-18-7z"/>
      <ellipse cx="36" cy="84" rx="18" ry="6"/>
      <path d="M18 80v-8h36v8c0 4-8 7-18 7s-18-3-18-7z"/>
      <ellipse cx="36" cy="72" rx="18" ry="6"/>
      <path d="M18 68v-8h36v8c0 4-8 7-18 7s-18-3-18-7z"/>
      <ellipse cx="36" cy="60" rx="18" ry="6"/>
    </g>
    <path class="il-sage il-garis" d="M68 98V70h10v28zM84 98V58h10v40zM100 98V46h10v52z"/>
    <circle class="il-kuning il-garis" cx="78" cy="30" r="17"/>
    <circle class="il-garis-tipis" cx="78" cy="30" r="12" fill="none"/>
    ${wajah(78, 28, 5)}
  ${TUTUP}`,

  /** Kalkulator berwajah. Untuk Latihan. */
  kalkulator: `${BUKA('kalkulator')}
    <ellipse class="il-bayang" cx="60" cy="106" rx="30" ry="5"/>
    <rect class="il-sage il-garis" x="30" y="12" width="60" height="88" rx="12"/>
    <rect class="il-biru il-garis" x="38" y="20" width="44" height="24" rx="6"/>
    ${wajah(60, 30, 8)}
    <g class="il-krem il-garis">
      <rect x="38" y="52" width="12" height="10" rx="3"/>
      <rect x="54" y="52" width="12" height="10" rx="3"/>
      <rect x="38" y="68" width="12" height="10" rx="3"/>
      <rect x="54" y="68" width="12" height="10" rx="3"/>
      <rect x="38" y="84" width="12" height="10" rx="3"/>
      <rect x="54" y="84" width="12" height="10" rx="3"/>
    </g>
    <rect class="il-peach il-garis" x="70" y="52" width="12" height="42" rx="3"/>
    <text class="il-teks" x="76" y="77" text-anchor="middle" font-size="12">=</text>
    <text class="il-teks-sage" x="102" y="34" text-anchor="middle" font-size="16">+</text>
    <text class="il-teks-sage" x="18" y="62" text-anchor="middle" font-size="16">÷</text>
  ${TUTUP}`,

  /** Papan grafik naik. Untuk Riwayat. */
  grafik: `${BUKA('grafik')}
    <ellipse class="il-bayang" cx="60" cy="106" rx="36" ry="5"/>
    <rect class="il-putih il-garis" x="16" y="20" width="88" height="78" rx="12"/>
    <path class="il-garis-tipis" d="M28 86h64"/>
    <rect class="il-biru il-garis" x="32" y="66" width="12" height="20" rx="3"/>
    <rect class="il-sage il-garis" x="54" y="54" width="12" height="32" rx="3"/>
    <rect class="il-kuning il-garis" x="76" y="40" width="12" height="46" rx="3"/>
    <path class="il-garis il-kosong" d="M30 56l22-14 20 6 20-18"/>
    <path class="il-garis il-kosong" d="M84 30h8v8"/>
    <circle class="il-peach il-garis" cx="100" cy="18" r="9"/>
    <path class="il-garis-tipis" d="M96 18l3 3 5-6"/>
  ${TUTUP}`,

  /** Simbol matematika dalam lingkaran pastel. Untuk Hasil Kuis. */
  simbol: `${BUKA('simbol')}
    <circle class="il-sage il-garis" cx="40" cy="40" r="20"/>
    <circle class="il-kuning il-garis" cx="82" cy="34" r="16"/>
    <circle class="il-peach il-garis" cx="78" cy="80" r="20"/>
    <circle class="il-biru il-garis" cx="34" cy="84" r="14"/>
    <text class="il-teks" x="40" y="47" text-anchor="middle" font-size="20">+</text>
    <text class="il-teks" x="82" y="40" text-anchor="middle" font-size="16">%</text>
    <text class="il-teks" x="78" y="87" text-anchor="middle" font-size="20">×</text>
    <text class="il-teks" x="34" y="90" text-anchor="middle" font-size="16">÷</text>
  ${TUTUP}`,

  /** Angka dengan tanda tanya. Untuk Halaman tidak ditemukan. */
  angka: `${BUKA('angka')}
    <ellipse class="il-bayang" cx="60" cy="106" rx="34" ry="5"/>
    <rect class="il-biru il-garis" x="12" y="50" width="30" height="40" rx="10"/>
    <rect class="il-kuning il-garis" x="45" y="38" width="30" height="52" rx="10"/>
    <rect class="il-peach il-garis" x="78" y="50" width="30" height="40" rx="10"/>
    <text class="il-teks" x="27" y="77" text-anchor="middle" font-size="18">1</text>
    <text class="il-teks" x="60" y="70" text-anchor="middle" font-size="22">?</text>
    <text class="il-teks" x="93" y="77" text-anchor="middle" font-size="18">3</text>
    <circle class="il-mata" cx="54" cy="80" r="2"/>
    <circle class="il-mata" cx="66" cy="80" r="2"/>
  ${TUTUP}`,
};

/** Nama ilustrasi yang tersedia. */
export const NAMA_ILUSTRASI = Object.freeze(Object.keys(ILUSTRASI));

/**
 * Mengembalikan markup SVG ilustrasi.
 * @param {string} nama salah satu NAMA_ILUSTRASI
 * @returns {string} markup SVG, atau string kosong jika nama tidak dikenal
 */
export function ilustrasi(nama) {
  return ILUSTRASI[nama] || '';
}
