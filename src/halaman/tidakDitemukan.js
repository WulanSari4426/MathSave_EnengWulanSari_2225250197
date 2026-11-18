import { ilustrasi } from '../komponen/ilustrasi.js';

export function tampilkan(wadah) {
  const halaman = document.createElement('section');
  halaman.className = 'halaman halaman-tengah';
  halaman.innerHTML = `
    <div class="ilustrasi-besar">${ilustrasi('angka')}</div>
    <h1>Halaman tidak ditemukan</h1>
    <p>Alamat yang kamu buka tidak ada.</p>
    <a class="tombol tombol-penuh" href="#/beranda">Ke Beranda</a>
  `;
  wadah.append(halaman);
}
