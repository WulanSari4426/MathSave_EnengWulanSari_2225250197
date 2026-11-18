/**
 * Riwayat belajar (PRD F-10; design.md 5.10).
 *  - Nilai kuis tertinggi (nilai utama, KF-13 P6) + percobaan 1 dan 2 dengan tautan ke hasilnya (P5).
 *  - Kesalahan yang paling sering (30 hari) dengan tautan ke sub-bab terkait.
 *  - Aktivitas terbaru (latihan dan kuis), bisa dimuat lebih banyak.
 */
import { el, kepalaHalaman, tombol, tautanTombol, kotakGalat, teksMemuat, isiUlang } from '../komponen/elemen.js';
import { ringkasanKemajuan, riwayatBelajar } from '../layanan/api.js';
import { labelKesalahan, barisAktivitas, formatTanggal, JENIS_KESALAHAN_TAMPIL } from '../logika/riwayat.js';

const UKURAN_HALAMAN = 20;

export function tampilkan(wadah) {
  let aktif = true;
  const kartuKuis = el('div', { className: 'kartu isi-kartu', 'aria-live': 'polite' }, teksMemuat());
  const kartuSalah = el('div', { className: 'kartu isi-kartu', 'aria-live': 'polite' }, teksMemuat());
  const daftarAktivitas = el('ul', { className: 'daftar-polos' });
  const wadahLagi = el('div');
  const kartuAktivitas = el('div', { className: 'kartu isi-kartu' },
    el('h2', { teks: 'Aktivitas terbaru' }), daftarAktivitas, wadahLagi);

  wadah.append(el('section', { className: 'halaman' },
    kepalaHalaman({ judul: 'Riwayat Belajar', subjudul: 'Lihat perkembangan belajarmu.', ilustrasi: 'grafik' }),
    kartuKuis, kartuSalah, kartuAktivitas));

  async function muatRingkasan() {
    const hasil = await ringkasanKemajuan();
    if (!aktif) return;
    if (!hasil.ok) {
      kartuKuis.replaceChildren(kotakGalat(hasil.kode_galat, muatRingkasan));
      kartuSalah.replaceChildren();
      return;
    }
    const { kuis, kesalahan_tersering: salah } = hasil.data;
    kartuKuis.replaceChildren(
      el('h2', { teks: `Nilai kuis tertinggi: ${kuis.nilai_tertinggi ?? 'belum ada'}` }),
      kuis.percobaan.length === 0
        ? el('p', { className: 'keterangan', teks: 'Kamu belum mengerjakan kuis.' })
        : el('ul', { className: 'daftar-polos' }, ...kuis.percobaan.map((p) => el('li', {},
          el('a', { className: 'baris-riwayat', href: `#/kuis/hasil/${p.sesi_kuis_id}`, 'aria-label': `Lihat hasil percobaan ${p.percobaan_ke}, nilai ${p.skor}` },
            el('span', { teks: `Percobaan ${p.percobaan_ke}` }),
            el('strong', { teks: String(p.skor) }),
            el('span', { className: 'keterangan', teks: `${formatTanggal(p.selesai_pada)} ›` }))))),
      el('p', { className: 'keterangan', teks: `Maksimal 2 percobaan. Sisa kesempatan: ${kuis.sisa_percobaan}.` }),
    );

    kartuSalah.replaceChildren(el('h2', { teks: 'Sering keliru di' }));
    if (!salah || salah.length === 0) {
      kartuSalah.append(el('p', { className: 'keterangan', teks: 'Belum ada kesalahan yang sering muncul dalam 30 hari terakhir.' }));
      return;
    }
    for (const s of salah) {
      const sub = s.sub_materi_terkait ?? JENIS_KESALAHAN_TAMPIL[s.jenis]?.sub;
      kartuSalah.append(el('div', { className: 'grup-tombol' },
        el('p', { teks: `• ${labelKesalahan(s.jenis)} (${s.jumlah}×)` }),
        sub ? tautanTombol(`Ulangi ${sub}`, `#/belajar/${sub}`, { sekunder: true }) : null));
    }
  }

  let terakhir = null;
  async function muatAktivitas() {
    wadahLagi.replaceChildren(teksMemuat());
    const hasil = await riwayatBelajar(UKURAN_HALAMAN, terakhir);
    if (!aktif) return;
    if (!hasil.ok) {
      wadahLagi.replaceChildren(kotakGalat(hasil.kode_galat, muatAktivitas));
      return;
    }
    const baris = hasil.data ?? [];
    if (baris.length === 0 && terakhir === null) {
      daftarAktivitas.append(el('li', { className: 'keterangan', teks: 'Belum ada aktivitas. Mulai dari menu Belajar atau Latihan.' }));
    }
    for (const item of baris) {
      const b = barisAktivitas(item);
      const isi = [el('span', { className: 'keterangan', teks: b.tanggal }), el('span', { teks: b.judul }), el('strong', { teks: b.hasil })];
      daftarAktivitas.append(el('li', {}, b.href
        ? el('a', { className: 'baris-riwayat', href: b.href }, ...isi)
        : el('div', { className: 'baris-riwayat' }, ...isi)));
    }
    terakhir = baris.at(-1)?.waktu ?? terakhir;
    isiUlang(wadahLagi, baris.length === UKURAN_HALAMAN
      ? tombol('Muat lebih banyak', muatAktivitas, { sekunder: true }) : null);
  }

  muatRingkasan();
  muatAktivitas();
  return () => {
    aktif = false;
  };
}
