/**
 * Layar Masuk (design.md 5.0, F-01, KF-05f): username + PIN 6 angka.
 * Tidak ada kolom kode siswa maupun kode kelas, dan tidak ada "Lupa PIN" mandiri (KF-05c R6).
 */
import { emblemLanora } from '../komponen/logo.js';
import {
  buatKolom, buatPesanGalat, setelSibuk, tandaiKolom, ATRIBUT_PIN, ATRIBUT_USERNAME,
} from '../komponen/formulir.js';
import { ambilPesanSingkat, buatKartuPesan } from '../komponen/pesanSingkat.js';
import { periksaIsianMasuk, pesanLogin } from '../logika/validasiLogin.js';
import { masuk } from '../layanan/autentikasi.js';
import { supabaseSiap } from '../layanan/supabase.js';

export function tampilkan(wadah) {
  const halaman = document.createElement('section');
  halaman.className = 'halaman';

  // Merek Lanora: nama sebagai teks h1 (dibaca pembaca layar), emblem sebagai dekorasi.
  const kepala = document.createElement('header');
  kepala.className = 'halaman-kepala kartu-sambutan';
  kepala.innerHTML = `
    <div class="kartu-sambutan-teks">
      <h1 class="merek">Lanora</h1>
      <p class="subjudul">Belajar Bunga Tunggal dan Tabungan</p>
    </div>
    <div class="kartu-sambutan-gambar">${emblemLanora()}</div>`;

  const formulir = document.createElement('form');
  formulir.className = 'formulir';
  formulir.noValidate = true; // pesan memakai bahasa aplikasi, bukan pesan bawaan peramban

  const kolomUsername = buatKolom({ label: 'Username', atribut: ATRIBUT_USERNAME });
  const kolomPin = buatKolom({ label: 'PIN (6 angka)', atribut: ATRIBUT_PIN });
  const galat = buatPesanGalat();
  const tombol = document.createElement('button');
  tombol.type = 'submit';
  tombol.className = 'tombol tombol-penuh';
  tombol.textContent = 'Masuk';

  formulir.append(kolomUsername.elemen, kolomPin.elemen, galat.elemen, tombol);

  const bawah = document.createElement('div');
  bawah.className = 'tautan-bawah';
  bawah.innerHTML = `
    <a class="tautan" href="#/daftar">Belum punya akun? Daftar</a>
    <p class="keterangan">Lupa PIN? Tanyakan ke guru atau penelitimu.</p>
    <a class="tautan tautan-kecil" href="#/pin-baru">Saya punya kode reset</a>`;

  halaman.append(kepala);
  // Pesan sekali tampil, misalnya setelah akun dibuat tetapi masuk otomatis gagal (HTTP 201).
  const pesan = ambilPesanSingkat();
  if (pesan) halaman.append(buatKartuPesan(pesan));
  halaman.append(formulir, bawah);
  wadah.append(halaman);

  if (!supabaseSiap) galat.tampilkan(pesanLogin('masuk', { kode_galat: 'BELUM_TERHUBUNG' }));

  formulir.addEventListener('submit', async (peristiwa) => {
    peristiwa.preventDefault();
    galat.sembunyikan();
    tandaiKolom(kolomUsername.input, false);
    tandaiKolom(kolomPin.input, false);

    const isian = { username: kolomUsername.input.value, pin: kolomPin.input.value };
    const tolak = periksaIsianMasuk(isian);
    if (tolak) {
      galat.tampilkan(pesanLogin('masuk', tolak));
      return;
    }

    setelSibuk(tombol, true);
    const hasil = await masuk(isian.username, isian.pin);
    setelSibuk(tombol, false);

    if (hasil.ok) {
      window.location.replace('#/beranda');
      return;
    }
    // Pesan seragam (L7). PIN dikosongkan, username tetap (design.md 5.0).
    kolomPin.input.value = '';
    galat.tampilkan(pesanLogin('masuk', hasil));
    kolomPin.input.focus();
  });
}
