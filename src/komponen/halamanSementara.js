/**
 * Kerangka halaman sementara untuk Fase 2.
 * Isi sebenarnya dikerjakan pada fase berikutnya (docs/task.md).
 */
import { ilustrasi as ambilIlustrasi } from './ilustrasi.js';

/**
 * @param {object} opsi
 * @param {string} opsi.judul
 * @param {string} opsi.deskripsi   teks pendek tentang isi halaman nanti
 * @param {string} [opsi.subjudul]  satu kalimat pendek di bawah judul (kartu sambutan)
 * @param {string} [opsi.ilustrasi] nama ilustrasi dari komponen/ilustrasi.js.
 *                                  Jangan dipakai di layar fokus (docs/design.md bagian 7).
 * @param {boolean} [opsi.modeFokus] true → tampilkan tombol tutup (✕) di kiri atas
 * @param {string} [opsi.kembaliKe] hash tujuan tombol tutup, contoh "#/belajar"
 * @param {Array<{teks: string, href: string, sekunder?: boolean}>} [opsi.tautan]
 * @returns {HTMLElement}
 */
export function buatHalamanSementara({
  judul,
  deskripsi,
  subjudul = '',
  ilustrasi = '',
  modeFokus = false,
  kembaliKe = '#/beranda',
  tautan = [],
}) {
  const halaman = document.createElement('section');
  halaman.className = 'halaman';

  const kepala = document.createElement('header');
  kepala.className = 'halaman-kepala';

  if (modeFokus) {
    const baris = document.createElement('div');
    baris.className = 'kepala-fokus';
    const tutup = document.createElement('a');
    tutup.className = 'tombol tombol-ikon';
    tutup.href = kembaliKe;
    tutup.innerHTML = '<span class="ikon-tutup" aria-hidden="true">✕</span><span class="khusus-pembaca-layar">Tutup</span>';
    baris.append(tutup);
    kepala.append(baris);
  }

  const h1 = document.createElement('h1');
  h1.textContent = judul;

  const svg = modeFokus ? '' : ambilIlustrasi(ilustrasi);
  if (svg) {
    // Kartu sambutan: judul di kiri, ilustrasi kecil di kanan
    kepala.classList.add('kartu-sambutan');
    const teks = document.createElement('div');
    teks.className = 'kartu-sambutan-teks';
    teks.append(h1);
    if (subjudul) {
      const p = document.createElement('p');
      p.className = 'subjudul';
      p.textContent = subjudul;
      teks.append(p);
    }
    const gambar = document.createElement('div');
    gambar.className = 'kartu-sambutan-gambar';
    gambar.innerHTML = svg; // markup statis dari ilustrasi.js, bukan masukan pengguna
    kepala.append(teks, gambar);
  } else {
    kepala.append(h1);
    if (subjudul) {
      const p = document.createElement('p');
      p.className = 'subjudul';
      p.textContent = subjudul;
      kepala.append(p);
    }
  }
  halaman.append(kepala);

  const kartu = document.createElement('div');
  kartu.className = 'kartu';
  const p = document.createElement('p');
  p.textContent = deskripsi;
  const catatan = document.createElement('p');
  catatan.className = 'keterangan label-segera';
  catatan.textContent = 'Bagian ini sedang disiapkan.';
  kartu.append(p, catatan);
  halaman.append(kartu);

  if (tautan.length) {
    const grup = document.createElement('div');
    grup.className = 'grup-tombol';
    for (const { teks, href, sekunder } of tautan) {
      const a = document.createElement('a');
      a.className = sekunder ? 'tombol tombol-sekunder tombol-penuh' : 'tombol tombol-penuh';
      a.href = href;
      a.textContent = teks;
      grup.append(a);
    }
    halaman.append(grup);
  }

  return halaman;
}
