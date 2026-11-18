/**
 * Layar Daftar dua langkah (design.md 5.0, KF-05f, api.md 2e.1–2e.2).
 *   Langkah 1: kode kelas → server memeriksa dan mengirim daftar kelas aktif.
 *   Langkah 2: pilih kelas → username → PIN → ulangi PIN → akun dibuat.
 * Kode kelas hanya disimpan di variabel halaman ini (memori), TIDAK di penyimpanan perangkat.
 * Daftar kelas TIDAK ditulis di frontend; selalu dari server (diatur peneliti).
 */
import {
  buatKolom, buatPesanGalat, buatKepalaFokus, buatPilihanKelas, setelSibuk, tandaiKolom,
  ATRIBUT_PIN, ATRIBUT_USERNAME, ATRIBUT_KODE_KELAS,
} from '../komponen/formulir.js';
import { simpanPesanSingkat } from '../komponen/pesanSingkat.js';
import {
  periksaIsianKodeKelas, periksaIsianDaftar, pesanLogin, kolomGalat, PESAN_BERHASIL,
} from '../logika/validasiLogin.js';
import { kelompokkanKelas } from '../logika/kelasPilihan.js';
import { periksaKodeKelas, daftarAkun } from '../layanan/autentikasi.js';

function buatTombol(teks, jenis = 'submit') {
  const tombol = document.createElement('button');
  tombol.type = jenis;
  tombol.className = 'tombol tombol-penuh';
  tombol.textContent = teks;
  return tombol;
}

function penandaLangkah(teks) {
  const p = document.createElement('p');
  p.className = 'penanda-langkah';
  p.textContent = teks;
  return p;
}

/** Fokus ke judul setelah berganti langkah, agar pembaca layar mengumumkannya. */
function fokusJudul(halaman) {
  const judul = halaman.querySelector('h1');
  if (!judul) return;
  judul.setAttribute('tabindex', '-1');
  judul.focus({ preventScroll: true });
  window.scrollTo(0, 0);
}

export function tampilkan(wadah) {
  const halaman = document.createElement('section');
  halaman.className = 'halaman';
  wadah.append(halaman);

  let kodeKelas = ''; // hanya di memori, dibuang saat pindah halaman
  let aktif = true;

  // ---------------------------------------------------------------- Langkah 1
  function langkahSatu() {
    halaman.replaceChildren();
    const pengantar = document.createElement('p');
    pengantar.textContent = 'Isi kode kelas dari guru atau penelitimu.';

    const formulir = document.createElement('form');
    formulir.className = 'formulir';
    formulir.noValidate = true;
    const kolomKode = buatKolom({ label: 'Kode kelas', atribut: ATRIBUT_KODE_KELAS });
    kolomKode.input.value = kodeKelas;
    const galat = buatPesanGalat();
    const tombol = buatTombol('Lanjut');
    formulir.append(kolomKode.elemen, galat.elemen, tombol);

    const catatan = document.createElement('p');
    catatan.className = 'keterangan teks-tengah';
    catatan.innerHTML = 'Sudah pernah daftar? <a class="tautan-sebaris" href="#/masuk">Masuk saja</a>, atau minta reset PIN ke gurumu.';

    halaman.append(buatKepalaFokus('Daftar', '#/masuk'), penandaLangkah('Langkah 1 dari 2'), pengantar, formulir, catatan);

    formulir.addEventListener('submit', async (peristiwa) => {
      peristiwa.preventDefault();
      galat.sembunyikan();
      tandaiKolom(kolomKode.input, false);

      const tolak = periksaIsianKodeKelas({ kodeKelas: kolomKode.input.value });
      if (tolak) {
        galat.tampilkan(pesanLogin('daftar', tolak));
        tandaiKolom(kolomKode.input, true);
        return;
      }

      setelSibuk(tombol, true);
      const hasil = await periksaKodeKelas(kolomKode.input.value);
      setelSibuk(tombol, false);
      if (!aktif) return;

      if (!hasil.ok) {
        galat.tampilkan(pesanLogin('daftar', hasil));
        if (kolomGalat(hasil) === 'kodeKelas') tandaiKolom(kolomKode.input, true);
        return;
      }
      kodeKelas = kolomKode.input.value;
      langkahDua(hasil.kelas);
    });
  }

  // ---------------------------------------------------------------- Langkah 2
  function langkahDua(daftarKelas, { pesanAwal = '', usernameAwal = '' } = {}) {
    halaman.replaceChildren();
    const kelompok = kelompokkanKelas(daftarKelas);

    // Kepala: ← kembali ke langkah 1 (tanpa mengirim apa pun)
    const kepala = document.createElement('header');
    kepala.className = 'halaman-kepala';
    const baris = document.createElement('div');
    baris.className = 'kepala-fokus';
    const kembali = document.createElement('button');
    kembali.type = 'button';
    kembali.className = 'tombol tombol-ikon';
    kembali.innerHTML = '<span class="ikon-tutup" aria-hidden="true">←</span><span class="khusus-pembaca-layar">Kembali ke langkah 1</span>';
    kembali.addEventListener('click', langkahSatu);
    const h1 = document.createElement('h1');
    h1.textContent = 'Daftar';
    baris.append(kembali, h1);
    kepala.append(baris);

    halaman.append(kepala, penandaLangkah('Langkah 2 dari 2'));

    if (kelompok.length === 0) {
      const galatKosong = buatPesanGalat();
      galatKosong.tampilkan(pesanLogin('daftar', { kode_galat: 'KELAS_KOSONG' }));
      halaman.append(galatKosong.elemen);
      fokusJudul(halaman);
      return;
    }

    const formulir = document.createElement('form');
    formulir.className = 'formulir';
    formulir.noValidate = true;
    const pilihan = buatPilihanKelas(kelompok);
    const kolomUsername = buatKolom({
      label: 'Username',
      atribut: ATRIBUT_USERNAME,
      keterangan: '3–20 huruf kecil, angka, atau _, diawali huruf. Username juga tampil sebagai namamu. Jangan pakai nama lengkap atau nomor HP.',
    });
    const kolomPin = buatKolom({ label: 'Buat PIN (6 angka)', atribut: ATRIBUT_PIN });
    const kolomUlang = buatKolom({ label: 'Ulangi PIN', atribut: ATRIBUT_PIN });
    const galat = buatPesanGalat();
    const tombol = buatTombol('Daftar dan masuk');
    formulir.append(pilihan.elemen, kolomUsername.elemen, kolomPin.elemen, kolomUlang.elemen, galat.elemen, tombol);
    halaman.append(formulir);
    kolomUsername.input.value = usernameAwal;
    fokusJudul(halaman);
    if (pesanAwal) {
      galat.tampilkan(pesanAwal);
      tandaiKolom(pilihan.input, true);
    }

    const kolom = { kelas: pilihan.input, username: kolomUsername.input, pin: kolomPin.input, ulangPin: kolomUlang.input };
    const kosongkanPin = () => {
      kolomPin.input.value = '';
      kolomUlang.input.value = '';
    };

    formulir.addEventListener('submit', async (peristiwa) => {
      peristiwa.preventDefault();
      galat.sembunyikan();
      Object.values(kolom).forEach((input) => tandaiKolom(input, false));

      const isian = {
        kodeKelas,
        kelasId: pilihan.input.value,
        username: kolomUsername.input.value,
        pin: kolomPin.input.value,
        ulangPin: kolomUlang.input.value,
      };
      const tolak = periksaIsianDaftar(isian);
      if (tolak) {
        galat.tampilkan(pesanLogin('daftar', tolak));
        tandaiKolom(kolom[kolomGalat(tolak)], true);
        return;
      }

      setelSibuk(tombol, true);
      const hasil = await daftarAkun(isian);
      setelSibuk(tombol, false);
      if (!aktif) return;

      if (hasil.ok && hasil.jenis === 'sesi') {
        simpanPesanSingkat(PESAN_BERHASIL.daftarMasuk);
        window.location.replace('#/beranda');
        return;
      }
      if (hasil.ok && hasil.jenis === 'tanpa_sesi') {
        // HTTP 201: akun SUDAH dibuat, hanya masuk otomatis yang gagal. Bukan kegagalan pendaftaran.
        simpanPesanSingkat(PESAN_BERHASIL.daftarTanpaSesi);
        window.location.replace('#/masuk');
        return;
      }

      // Kode kelas berubah/salah di server → kembali ke langkah 1.
      if (hasil.kode_galat === 'KODE_KELAS_SALAH') {
        kodeKelas = '';
        langkahSatu();
        return;
      }
      kosongkanPin(); // kelas dan username tetap terisi (design.md 5.0)
      galat.tampilkan(pesanLogin('daftar', hasil));
      tandaiKolom(kolom[kolomGalat(hasil)], true);

      // Kelas baru saja dinonaktifkan peneliti → muat ulang pilihan dari server.
      if (hasil.kode_galat === 'KELAS_TIDAK_SAH') {
        const segar = await periksaKodeKelas(kodeKelas);
        if (aktif && segar.ok) {
          langkahDua(segar.kelas, { pesanAwal: pesanLogin('daftar', hasil), usernameAwal: kolomUsername.input.value });
        }
      }
    });
  }

  langkahSatu();
  // Dipanggil router saat pindah halaman: kode kelas di memori dibuang.
  return () => {
    aktif = false;
    kodeKelas = '';
  };
}
