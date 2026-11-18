/**
 * Pembantu kecil untuk membuat elemen halaman. Semua teks dipasang lewat textContent,
 * sehingga isi dari server tidak pernah ditafsirkan sebagai HTML.
 */
import { ilustrasi as ambilIlustrasi } from './ilustrasi.js';
import { pesanGalatRpc } from '../logika/pesanGalat.js';

/**
 * @param {string} tag
 * @param {object} [atribut] className, teks, dan atribut HTML lain (on* = pendengar peristiwa)
 * @param {...(Node|string|null|false)} anak
 */
export function el(tag, atribut = {}, ...anak) {
  const elemen = document.createElement(tag);
  for (const [nama, nilai] of Object.entries(atribut)) {
    if (nilai === undefined || nilai === null || nilai === false) continue;
    if (nama === 'className') elemen.className = nilai;
    else if (nama === 'teks') elemen.textContent = nilai;
    else if (nama.startsWith('on') && typeof nilai === 'function') elemen.addEventListener(nama.slice(2), nilai);
    else if (nilai === true) elemen.setAttribute(nama, '');
    else elemen.setAttribute(nama, String(nilai));
  }
  for (const a of anak.flat()) {
    if (a === null || a === undefined || a === false) continue;
    elemen.append(a instanceof Node ? a : document.createTextNode(String(a)));
  }
  return elemen;
}

/** Mengganti isi elemen; null/undefined/false dibuang (replaceChildren(null) akan menulis "null"). */
export function isiUlang(elemen, ...anak) {
  elemen.replaceChildren(...anak.flat().filter((a) => a !== null && a !== undefined && a !== false));
}

/** Menambah anak; null/undefined/false dibuang. */
export function tambah(elemen, ...anak) {
  elemen.append(...anak.flat().filter((a) => a !== null && a !== undefined && a !== false));
}

/** Kepala halaman menu: kartu sambutan dengan satu ilustrasi (design.md 7.1). */
export function kepalaHalaman({ judul, subjudul = '', ilustrasi = '' }) {
  const kepala = el('header', { className: 'halaman-kepala' });
  const h1 = el('h1', { teks: judul });
  const svg = ilustrasi ? ambilIlustrasi(ilustrasi) : '';
  if (!svg) {
    kepala.append(h1);
    if (subjudul) kepala.append(el('p', { className: 'subjudul', teks: subjudul }));
    return kepala;
  }
  kepala.classList.add('kartu-sambutan');
  const teks = el('div', { className: 'kartu-sambutan-teks' }, h1,
    subjudul ? el('p', { className: 'subjudul', teks: subjudul }) : null);
  const gambar = el('div', { className: 'kartu-sambutan-gambar' });
  gambar.innerHTML = svg; // markup statis dari ilustrasi.js
  kepala.append(teks, gambar);
  return kepala;
}

/**
 * Kepala layar fokus (materi, latihan, kuis): tombol ✕ dan judul, tanpa ilustrasi.
 * @param {{ judul: string, keterangan?: string, kembaliKe?: string, labelTutup?: string, onTutup?: (e: Event) => void }} opsi
 */
export function kepalaFokus({ judul, keterangan = '', kembaliKe = '#/beranda', labelTutup = 'Tutup', onTutup }) {
  const tutup = el('a', { className: 'tombol tombol-ikon', href: kembaliKe });
  tutup.innerHTML = '<span class="ikon-tutup" aria-hidden="true">✕</span>';
  tutup.append(el('span', { className: 'khusus-pembaca-layar', teks: labelTutup }));
  if (onTutup) tutup.addEventListener('click', onTutup);
  const h1 = el('h1', { teks: judul });
  const ket = el('p', { className: 'keterangan', teks: keterangan });
  const kepala = el('header', { className: 'halaman-kepala' },
    el('div', { className: 'kepala-fokus' }, tutup, el('div', { className: 'kepala-fokus-teks' }, h1, ket)));
  return { kepala, h1, ket, tutup };
}

/** Tombol. `sekunder` → .tombol-sekunder. `penuh` → lebar penuh. */
export function tombol(teks, onClick, { sekunder = false, penuh = true, jenis = 'button' } = {}) {
  const kelas = ['tombol', sekunder && 'tombol-sekunder', penuh && 'tombol-penuh'].filter(Boolean).join(' ');
  return el('button', { type: jenis, className: kelas, teks, onclick: onClick });
}

/** Tautan bergaya tombol. */
export function tautanTombol(teks, href, { sekunder = false } = {}) {
  return el('a', { className: sekunder ? 'tombol tombol-sekunder tombol-penuh' : 'tombol tombol-penuh', href, teks });
}

/** Kotak pesan galat dengan ikon ✕ dan teks, plus tombol Coba lagi opsional. */
export function kotakGalat(kodeAtauTeks, onCobaLagi) {
  const teks = /^[A-Z_]+$/.test(kodeAtauTeks) ? pesanGalatRpc(kodeAtauTeks) : kodeAtauTeks;
  const kotak = el('div', { className: 'kartu' },
    el('p', { className: 'pesan-galat', role: 'alert' },
      el('span', { className: 'pesan-galat-ikon', 'aria-hidden': 'true', teks: '✕' }), el('span', { teks })));
  if (onCobaLagi) kotak.append(tombol('Coba lagi', onCobaLagi, { sekunder: true }));
  return kotak;
}

/** Teks memuat untuk wadah yang sedang menunggu server. */
export const teksMemuat = (teks = 'Memuat…') => el('p', { className: 'keterangan', role: 'status', teks });

/**
 * Bilah kemajuan satu warna tanpa animasi (design.md 6).
 * @param {number} nilai @param {number} maks @param {string} label
 */
export function bilahKemajuan(nilai, maks, label) {
  const persen = maks > 0 ? Math.round((100 * nilai) / maks) : 0;
  const bilah = el('div', {
    className: 'bilah-kemajuan', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': maks,
    'aria-valuenow': nilai, 'aria-label': label,
  }, el('span', { className: 'bilah-kemajuan-isi', style: `width:${persen}%` }));
  return bilah;
}
