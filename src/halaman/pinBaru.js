/**
 * Layar Buat PIN baru (design.md 5.0, KF-05c + KF-05f): username + kode reset + PIN baru + ulangi.
 * Hanya berguna bagi siswa yang sudah diberi kode reset oleh guru/peneliti. Bukan "Lupa PIN" mandiri.
 * Kode reset TIDAK disimpan di localStorage/sessionStorage dan TIDAK dicatat ke console.
 */
import {
  buatKolom, buatPesanGalat, buatKepalaFokus, setelSibuk, tandaiKolom, ATRIBUT_PIN, ATRIBUT_USERNAME,
} from '../komponen/formulir.js';
import { simpanPesanSingkat } from '../komponen/pesanSingkat.js';
import { periksaIsianPinBaru, pesanLogin, kolomGalat, PESAN_BERHASIL } from '../logika/validasiLogin.js';
import { aturPinBaru } from '../layanan/autentikasi.js';

export function tampilkan(wadah) {
  const halaman = document.createElement('section');
  halaman.className = 'halaman';

  const pengantar = document.createElement('p');
  pengantar.textContent = 'Isi username dan kode reset dari guru atau penelitimu.';

  const formulir = document.createElement('form');
  formulir.className = 'formulir';
  formulir.noValidate = true;

  const kolomUsername = buatKolom({ label: 'Username', atribut: ATRIBUT_USERNAME });
  const kolomReset = buatKolom({
    label: 'Kode reset',
    atribut: {
      type: 'text', autocapitalize: 'characters', autocomplete: 'off', autocorrect: 'off',
      spellcheck: 'false', maxlength: '9', placeholder: 'contoh: ABCD-2345',
    },
  });
  const kolomPin = buatKolom({ label: 'PIN baru (6 angka)', atribut: ATRIBUT_PIN });
  const kolomUlang = buatKolom({ label: 'Ulangi PIN baru', atribut: ATRIBUT_PIN });
  const galat = buatPesanGalat();
  const tombol = document.createElement('button');
  tombol.type = 'submit';
  tombol.className = 'tombol tombol-penuh';
  tombol.textContent = 'Simpan dan masuk';

  formulir.append(kolomUsername.elemen, kolomReset.elemen, kolomPin.elemen, kolomUlang.elemen, galat.elemen, tombol);
  halaman.append(buatKepalaFokus('Buat PIN baru', '#/masuk'), pengantar, formulir);
  wadah.append(halaman);

  const kolom = { username: kolomUsername.input, pin: kolomPin.input, ulangPin: kolomUlang.input };

  formulir.addEventListener('submit', async (peristiwa) => {
    peristiwa.preventDefault();
    galat.sembunyikan();
    Object.values(kolom).forEach((input) => tandaiKolom(input, false));

    const isian = {
      username: kolomUsername.input.value,
      kodeReset: kolomReset.input.value,
      pin: kolomPin.input.value,
      ulangPin: kolomUlang.input.value,
    };
    const tolak = periksaIsianPinBaru(isian);
    if (tolak) {
      galat.tampilkan(pesanLogin('pinBaru', tolak));
      tandaiKolom(kolom[kolomGalat(tolak)], true);
      return;
    }

    setelSibuk(tombol, true);
    const hasil = await aturPinBaru(isian);
    setelSibuk(tombol, false);

    if (hasil.ok) {
      // 200 bersesi → Beranda. 201 tanpa sesi → PIN sudah berlaku, siswa masuk lewat layar Masuk.
      const bersesi = hasil.jenis === 'sesi';
      simpanPesanSingkat(bersesi ? PESAN_BERHASIL.pinBaruMasuk : PESAN_BERHASIL.pinBaruTanpaSesi);
      window.location.replace(bersesi ? '#/beranda' : '#/masuk');
      return;
    }
    kolomPin.input.value = '';
    kolomUlang.input.value = '';
    galat.tampilkan(pesanLogin('pinBaru', hasil));
    tandaiKolom(kolom[kolomGalat(hasil)], true);
  });
}
