/**
 * Logo Lanora (sebelumnya MathSave): emblem huruf L dengan topi wisuda, buku terbuka,
 * dan simbol matematika (+ = × %), ditambah tulisan "Lanora".
 *
 * Satu sumber gambar untuk tampilan aplikasi, favicon, dan ikon aplikasi
 * (lihat scripts/buat-ikon-lanora.mjs). Fungsi di sini hanya menghasilkan teks SVG,
 * tanpa DOM, sehingga bisa dipakai di peramban maupun Node.
 */

/** Warna untuk tampilan di aplikasi: mengikuti token CSS (src/gaya/utama.css). */
export const WARNA_TOKEN = {
  latar: 'var(--warna-utama)',
  tua: 'var(--warna-utama-tua)',
  kertas: 'var(--warna-kartu)',
  aksen: 'var(--warna-utama-lembut)',
  manik: 'var(--aksen-kuning)',
};

/** Warna tetap untuk file mandiri (favicon, PNG), sama dengan nilai token. */
export const WARNA_HEKS = {
  latar: '#17784F',
  tua: '#0F3D2E',
  kertas: '#FFFFFF',
  aksen: '#9ED9B8',
  manik: '#F6E7B4',
};

/**
 * Isi emblem dalam kotak 120 × 120.
 * @param {object} opsi
 * @param {typeof WARNA_HEKS} [opsi.warna]
 * @param {number} [opsi.sudut]      sudut latar; 0 untuk ikon aplikasi (dipotong sistem operasi)
 * @param {boolean} [opsi.sederhana] tanpa simbol dan rumbai, untuk ukuran sangat kecil (favicon)
 * @param {number} [opsi.skala]      perkecil isi (bukan latar) agar masuk zona aman ikon maskable
 */
export function gambarEmblem({ warna = WARNA_TOKEN, sudut = 28, sederhana = false, skala = 1 } = {}) {
  const w = (bagian) => `style="fill:${warna[bagian]}"`;
  const garis = (bagian, tebal) =>
    `style="fill:none;stroke:${warna[bagian]};stroke-width:${tebal};stroke-linecap:round;stroke-linejoin:round"`;
  const tepi = sederhana ? 6 : 3.5;
  const isiTepi = (isi) =>
    `style="fill:${warna[isi]};stroke:${warna.tua};stroke-width:${tepi};stroke-linejoin:round"`;

  const simbol = sederhana
    ? ''
    : `
    <path ${garis('aksen', 4)} d="M16 40h12M22 34v12"/>
    <path ${garis('aksen', 4)} d="M16 57h12M16 64h12"/>
    <path ${garis('aksen', 4)} d="M89 44l10 10M99 44l-10 10"/>
    <path ${garis('aksen', 4)} d="M100 14L88 34"/>
    <circle ${w('aksen')} cx="88" cy="17" r="3.6"/>
    <circle ${w('aksen')} cx="100" cy="31" r="3.6"/>`;

  const rumbai = sederhana
    ? ''
    : `
    <path ${garis('tua', 2.5)} d="M52.5 21L72 24v9"/>
    <circle ${w('manik')} cx="72" cy="35" r="3.2"/>`;

  const transformasi = skala === 1 ? '' : ` transform="translate(60 60) scale(${skala}) translate(-60 -60)"`;

  // Urutan: simbol → buku → huruf L berdiri di atas buku → topi wisuda di puncak L.
  return `
    <rect ${w('latar')} width="120" height="120" rx="${sudut}"/>
    <g${transformasi}>${simbol}
    <path ${isiTepi('kertas')} d="M60 100C50 93 37 91 24 93V69c13-2 26 0 36 7z"/>
    <path ${isiTepi('kertas')} d="M60 100c10-7 23-9 36-7V69c-13-2-26 0-36 7z"/>
    <path ${isiTepi('kertas')} d="M45 29h14v23h21v13H45z"/>
    <path ${w('tua')} d="M40 23v8c8 5 17 5 25 0v-8z"/>
    <path ${w('tua')} d="M52.5 12L76 21l-23.5 9L29 21z"/>${rumbai}
    </g>`;
}

/**
 * Emblem untuk tampilan di aplikasi (warna mengikuti token).
 * Dekoratif secara bawaan: nama "Lanora" sudah ditulis sebagai teks di dekatnya.
 */
export function emblemLanora({ label = '' } = {}) {
  const aksesibel = label ? `role="img" aria-label="${label}"` : 'aria-hidden="true" focusable="false"';
  return `<svg class="logo-emblem" viewBox="0 0 120 120" ${aksesibel}>${gambarEmblem()}</svg>`;
}

/** Logo lengkap (emblem + tulisan "Lanora") sebagai file SVG mandiri. */
export function logoLengkapSvg({ warna = WARNA_HEKS } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 120" role="img" aria-label="Lanora">
  <title>Lanora</title>${gambarEmblem({ warna })}
  <text x="140" y="82" style="fill:${warna.tua};font-family:system-ui,Roboto,'Segoe UI',sans-serif;font-size:64px;font-weight:800;letter-spacing:-1px">Lanora</text>
</svg>
`;
}

/** Emblem sebagai file SVG mandiri (favicon atau bahan ikon PNG). */
export function emblemSvg({ warna = WARNA_HEKS, sudut = 28, sederhana = false, skala = 1, ukuran = null } = {}) {
  const dimensi = ukuran ? ` width="${ukuran}" height="${ukuran}"` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"${dimensi}>${gambarEmblem({ warna, sudut, sederhana, skala })}
</svg>
`;
}
