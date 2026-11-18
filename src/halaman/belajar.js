/**
 * Belajar: daftar sub-bab P0, M1–M6 dan Simulasi (PRD F-02, design.md 4).
 * Urutan disarankan tetapi tidak dikunci: semua sub-bab bisa dibuka.
 * Kemajuan dari ringkasan_kemajuan (api.md 3.9): jumlah selesai dan sub-bab yang disarankan berikutnya.
 */
import { el, kepalaHalaman, bilahKemajuan } from '../komponen/elemen.js';
import { MATERI, URUTAN_SUB_MATERI } from '../data/materi.js';
import { ringkasanKemajuan } from '../layanan/api.js';

export function tampilkan(wadah) {
  let aktif = true;
  const ringkas = el('div', { className: 'kartu kartu-sekunder', 'aria-live': 'polite' },
    el('p', { className: 'keterangan', teks: 'Memuat kemajuanmu…' }));

  const daftar = el('ol', { className: 'daftar-sub-bab' });
  const butir = {};
  for (const id of URUTAN_SUB_MATERI) {
    const m = MATERI[id];
    const penanda = el('span', { className: 'label-segera', hidden: true, teks: 'Disarankan berikutnya' });
    const tautan = el('a', { className: 'kartu kartu-tautan', href: `#/belajar/${id}` },
      el('span', { className: 'kode-sub-bab', teks: id }),
      el('span', { className: 'isi-sub-bab' },
        el('strong', { teks: m.judul + (m.opsional ? ' (opsional)' : '') }),
        el('span', { className: 'keterangan', teks: m.ringkas }),
        penanda));
    butir[id] = penanda;
    daftar.append(el('li', {}, tautan));
  }

  const simulasi = el('a', { className: 'kartu kartu-tautan', href: '#/simulasi' },
    el('span', { className: 'kode-sub-bab', 'aria-hidden': 'true', teks: '⇄' }),
    el('span', { className: 'isi-sub-bab' },
      el('strong', { teks: 'Simulasi tabungan' }),
      el('span', { className: 'keterangan', teks: 'Ubah modal, suku bunga, dan lama menabung, lalu lihat hasilnya.' })));

  wadah.append(el('section', { className: 'halaman' },
    kepalaHalaman({ judul: 'Belajar', subjudul: 'Pelajari materi sedikit demi sedikit.', ilustrasi: 'buku' }),
    ringkas,
    el('h2', { teks: 'Materi' }),
    daftar,
    el('h2', { teks: 'Coba sendiri' }),
    simulasi));

  ringkasanKemajuan().then((hasil) => {
    if (!aktif) return;
    ringkas.replaceChildren();
    if (!hasil.ok) {
      ringkas.append(el('p', { className: 'keterangan', teks: 'Kemajuan belum bisa dimuat. Kamu tetap bisa membuka materi.' }));
      return;
    }
    const { sub_materi_selesai: selesai, total_sub_materi: total, sub_materi_lanjut: lanjut } = hasil.data;
    ringkas.append(
      el('p', { teks: `Sub-bab selesai: ${selesai} dari ${total}` }),
      bilahKemajuan(selesai, total, `Sub-bab selesai ${selesai} dari ${total}`),
    );
    if (lanjut && butir[lanjut]) butir[lanjut].hidden = false;
  });

  return () => {
    aktif = false;
  };
}
