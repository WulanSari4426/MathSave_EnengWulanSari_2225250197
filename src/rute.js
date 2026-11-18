
/**
 * Daftar rute Lanora (docs/design.md bagian 4).
 * Halaman dimuat dengan import() dinamis agar halaman awal tetap ringan (NF-03).
 *
 * navigasi: false → navigasi bawah disembunyikan supaya siswa fokus.
 * publik: true → bisa dibuka tanpa masuk.
 */
export const RUTE_AWAL = '/beranda';
export const RUTE_MASUK = '/masuk';

export const DAFTAR_RUTE = [
  { pola: '/masuk', muat: () => import('./halaman/masuk.js'), navigasi: false, menu: null, publik: true },
  { pola: '/daftar', muat: () => import('./halaman/daftar.js'), navigasi: false, menu: null, publik: true },
  { pola: '/pin-baru', muat: () => import('./halaman/pinBaru.js'), navigasi: false, menu: null, publik: true },

  { pola: '/beranda', muat: () => import('./halaman/beranda.js'), navigasi: true, menu: 'beranda' },
  { pola: '/belajar', muat: () => import('./halaman/belajar.js'), navigasi: true, menu: 'belajar' },
  { pola: '/belajar/:subMateri', muat: () => import('./halaman/subbab.js'), navigasi: false, menu: 'belajar' },
  { pola: '/simulasi', muat: () => import('./halaman/simulasi.js'), navigasi: true, menu: 'belajar' },

  { pola: '/latihan', muat: () => import('./halaman/latihan.js'), navigasi: true, menu: 'latihan' },
  {
    pola: '/latihan/:subMateri/:tingkat',
    muat: () => import('./halaman/latihan.js'),
    navigasi: false,
    menu: 'latihan',
  },

  { pola: '/kuis', muat: () => import('./halaman/kuis.js'), navigasi: false, menu: 'latihan' },
  { pola: '/kuis/hasil/:sesiKuisId', muat: () => import('./halaman/kuis.js'), navigasi: true, menu: 'latihan' },

  { pola: '/riwayat', muat: () => import('./halaman/riwayat.js'), navigasi: true, menu: 'riwayat' },
  { pola: '/tutor', muat: () => import('./halaman/tutor.js'), navigasi: true, menu: 'tutor' },
];

/**
 * Mengatur pengalihan berdasarkan status login.
 */
export function tentukanPengalihan(rute, sudahMasuk) {
  if (rute.publik) return sudahMasuk ? RUTE_AWAL : null;
  return sudahMasuk ? null : RUTE_MASUK;
}

export const RUTE_TIDAK_DITEMUKAN = {
  pola: '*',
  muat: () => import('./halaman/tidakDitemukan.js'),
  navigasi: true,
  menu: null,
};
