/**
 * Titik masuk aplikasi Lanora (sebelumnya MathSave): gaya, navigasi bawah, router, dan pengaman rute login (Fase 5).
 */
import './gaya/utama.css';
import './gaya/fitur.css';
import { mulaiRouter, ambilJalur, cocokkanRute } from './router.js';
import {
  DAFTAR_RUTE, RUTE_AWAL, RUTE_MASUK, RUTE_TIDAK_DITEMUKAN, tentukanPengalihan,
} from './rute.js';
import { buatNavigasiBawah, perbaruiNavigasiBawah } from './komponen/navigasiBawah.js';
import { sudahMasuk, pantauKeluar } from './layanan/autentikasi.js';

const wadah = document.getElementById('konten');
const navigasi = document.getElementById('navigasi-bawah');

buatNavigasiBawah(navigasi);

mulaiRouter({
  daftarRute: DAFTAR_RUTE,
  ruteAwal: RUTE_AWAL,
  ruteTidakDitemukan: RUTE_TIDAK_DITEMUKAN,
  wadah,
  periksaAkses: async (rute) => tentukanPengalihan(rute, await sudahMasuk()),
  setelahPindah: ({ rute }) => perbaruiNavigasiBawah(navigasi, rute),
});

// Sesi berakhir (keluar atau token kedaluwarsa) → kembali ke layar Masuk.
pantauKeluar(() => {
  const hasil = cocokkanRute(ambilJalur(window.location.hash), DAFTAR_RUTE);
  if (!hasil?.rute.publik) window.location.replace('#' + RUTE_MASUK);
});
