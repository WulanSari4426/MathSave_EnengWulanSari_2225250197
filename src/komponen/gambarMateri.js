/**
 * Gambar penjelas materi (design.md 7.2): gaya garis sama dengan ilustrasi 7.1, TANPA wajah,
 * diam, dan membawa informasi materi, sehingga punya teks alternatif (role="img" + aria-label).
 * Warna lewat kelas .il-* (token tema), bukan warna langsung.
 */

const GAMBAR = {
  /** M1: modal awal + besar bunga = jumlah tabungan akhir. */
  tabungan: {
    label: 'Gambar: modal awal (M) ditambah besar bunga (B) menjadi jumlah tabungan akhir (A).',
    svg: `
      <rect class="il-sage il-garis" x="12" y="54" width="56" height="44" rx="8"/>
      <text class="il-teks il-teks-sage" x="40" y="81" text-anchor="middle" font-size="14">M</text>
      <text class="il-teks" x="40" y="114" text-anchor="middle" font-size="9">Modal awal</text>
      <text class="il-teks" x="84" y="82" text-anchor="middle" font-size="18">+</text>
      <rect class="il-kuning il-garis" x="100" y="70" width="40" height="28" rx="8"/>
      <text class="il-teks" x="120" y="89" text-anchor="middle" font-size="14">B</text>
      <text class="il-teks" x="120" y="114" text-anchor="middle" font-size="9">Besar bunga</text>
      <text class="il-teks" x="156" y="82" text-anchor="middle" font-size="18">=</text>
      <rect class="il-sage il-garis" x="172" y="54" width="56" height="44" rx="8"/>
      <rect class="il-kuning il-garis" x="172" y="38" width="56" height="16" rx="6"/>
      <text class="il-teks" x="200" y="81" text-anchor="middle" font-size="14">A</text>
      <text class="il-teks" x="200" y="114" text-anchor="middle" font-size="9">Jumlah tabungan akhir</text>`,
    viewBox: '0 0 240 124',
  },

  /** M3: garis waktu 12 bulan = 1 tahun, 6 bulan = 6/12 tahun. */
  garisWaktu: {
    label: 'Gambar: garis waktu 12 bulan sama dengan 1 tahun. 6 bulan adalah 6/12 tahun.',
    svg: `
      <rect class="il-sage" x="16" y="34" width="104" height="14" rx="4"/>
      <line class="il-garis" x1="16" y1="41" x2="224" y2="41"/>
      ${Array.from({ length: 13 }, (_, i) => {
        const x = 16 + i * (208 / 12);
        const panjang = i % 6 === 0 ? 12 : 6;
        return `<line class="il-garis-tipis" x1="${x}" y1="${41 - panjang}" x2="${x}" y2="${41 + panjang}"/>`;
      }).join('')}
      <text class="il-teks" x="16" y="70" text-anchor="middle" font-size="10">0</text>
      <text class="il-teks" x="120" y="70" text-anchor="middle" font-size="10">6 bulan</text>
      <text class="il-teks" x="224" y="70" text-anchor="middle" font-size="10">12 bulan</text>
      <text class="il-teks" x="68" y="22" text-anchor="middle" font-size="10">6/12 tahun</text>
      <text class="il-teks" x="224" y="88" text-anchor="middle" font-size="10">= 1 tahun</text>`,
    viewBox: '0 0 240 96',
  },
};

export const NAMA_GAMBAR_MATERI = Object.freeze(Object.keys(GAMBAR));

/** @returns {HTMLElement|null} */
export function gambarMateri(nama) {
  const g = GAMBAR[nama];
  if (!g) return null;
  const wadah = document.createElement('figure');
  wadah.className = 'gambar-materi';
  wadah.innerHTML = `<svg viewBox="${g.viewBox}" role="img" focusable="false">${g.svg}</svg>`; // markup statis
  wadah.firstElementChild.setAttribute('aria-label', g.label);
  return wadah;
}
