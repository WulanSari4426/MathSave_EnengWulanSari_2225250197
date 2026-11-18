/**
 * Beranda (PRD F-10; design.md 5.2). Hanya 3 blok informasi: kemajuan belajar + saran,
 * kuis (nilai tertinggi dan kesempatan, atau kuis yang sedang berjalan), dan pintasan Simulasi.
 * Sapaan memakai username sebagai nama tampilan (KF-05f U5), diambil dari sesi di server.
 */
import { el, kepalaHalaman, tombol, tautanTombol, bilahKemajuan, teksMemuat, tambah } from '../komponen/elemen.js';
import { ambilPesanSingkat, buatKartuPesan } from '../komponen/pesanSingkat.js';
import { keluar } from '../layanan/autentikasi.js';
import { ambilProfil, sapaan, ringkasanKemajuan, statusKuis } from '../layanan/api.js';
import { MATERI } from '../data/materi.js';
import { saranBerikutnya } from '../logika/riwayat.js';
import { hitungSelisihJam, sisaWaktuMs, formatSisaWaktu } from '../logika/kuis.js';

export function tampilkan(wadah) {
  let aktif = true;
  let pewaktu = null;

  const kepala = kepalaHalaman({ judul: sapaan(null), subjudul: 'Ayo lanjutkan belajarmu hari ini.', ilustrasi: 'celengan' });
  const judul = kepala.querySelector('h1');
  const kartuKemajuan = el('div', { className: 'kartu isi-kartu', 'aria-live': 'polite' },
    el('h2', { teks: 'Kemajuan belajar' }), teksMemuat());
  const kartuKuis = el('div', { className: 'kartu isi-kartu', 'aria-live': 'polite' }, teksMemuat());

  const tombolKeluar = tombol('Keluar', async () => {
    tombolKeluar.disabled = true;
    await keluar();
    window.location.replace('#/masuk');
  }, { sekunder: true });

  const halaman = el('section', { className: 'halaman' },
    kepala, kartuKemajuan, kartuKuis,
    tautanTombol('Coba Simulasi', '#/simulasi', { sekunder: true }),
    tombolKeluar);

  // Pesan sekali setelah daftar/buat PIN baru (design.md 5.0).
  const pesan = ambilPesanSingkat();
  if (pesan) kepala.after(buatKartuPesan(pesan));
  wadah.append(halaman);

  ambilProfil().then((hasil) => {
    if (aktif && hasil.ok) judul.textContent = sapaan(hasil.data.nama_panggilan);
  });

  ringkasanKemajuan().then((hasil) => {
    if (!aktif) return;
    kartuKemajuan.replaceChildren(el('h2', { teks: 'Kemajuan belajar' }));
    if (!hasil.ok) {
      kartuKemajuan.append(el('p', { className: 'keterangan', teks: 'Kemajuan belum bisa dimuat. Kamu tetap bisa belajar.' }),
        tautanTombol('Buka materi', '#/belajar'));
      return;
    }
    const r = hasil.data;
    const saran = saranBerikutnya(r);
    tambah(kartuKemajuan,
      bilahKemajuan(r.sub_materi_selesai, r.total_sub_materi, `Sub-bab selesai ${r.sub_materi_selesai} dari ${r.total_sub_materi}`),
      el('p', { teks: `${r.sub_materi_selesai} dari ${r.total_sub_materi} sub-bab selesai` }),
      r.sub_materi_lanjut ? el('p', { teks: `Lanjut: ${r.sub_materi_lanjut} ${MATERI[r.sub_materi_lanjut]?.judul ?? ''}` }) : null,
      saran.teks ? el('p', { className: 'keterangan', teks: saran.teks }) : null,
      tautanTombol(saran.tombol, saran.href),
    );
  });

  statusKuis().then((hasil) => {
    if (!aktif) return;
    kartuKuis.replaceChildren(el('h2', { teks: 'Kuis' }));
    if (!hasil.ok) {
      kartuKuis.append(el('p', { className: 'keterangan', teks: 'Status kuis belum bisa dimuat.' }));
      return;
    }
    const { sesi_aktif: sesi, percobaan, dikumpulkan_otomatis: otomatis, waktu_server: waktuServer } = hasil.data;
    if (sesi) {
      // Kartu "Kuis sedang berjalan" setelah keluar sementara (design.md 5.9c).
      const selisih = hitungSelisihJam(waktuServer, Date.now());
      const teksSisa = el('p', { className: 'sisa-waktu' });
      const perbarui = () => {
        teksSisa.textContent = `Kuis sedang berjalan · sisa ${formatSisaWaktu(sisaWaktuMs(sesi.batas_waktu, Date.now(), selisih))}`;
      };
      perbarui();
      pewaktu = setInterval(perbarui, 1000);
      kartuKuis.append(teksSisa, tautanTombol('Lanjutkan kuis', '#/kuis'));
      return;
    }
    if (otomatis) {
      kartuKuis.append(el('p', { role: 'status', teks: 'Kuis sudah dikumpulkan otomatis karena waktunya habis.' }),
        tautanTombol('Lihat hasil', `#/kuis/hasil/${otomatis.sesi_kuis_id}`, { sekunder: true }));
    }
    kartuKuis.append(
      el('p', { teks: `Nilai kuis tertinggi: ${percobaan.nilai_tertinggi ?? 'belum ada'}` }),
      el('p', { className: 'keterangan', teks: `Sisa kesempatan kuis: ${percobaan.sisa} dari ${percobaan.maks}` }),
    );
  });

  return () => {
    aktif = false;
    clearInterval(pewaktu);
  };
}
