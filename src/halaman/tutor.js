
import { el, kepalaHalaman } from '../komponen/elemen.js';
import { kirimPesanTutor, pesanGalatTutor } from '../layanan/tutorAI.js';
import { isiPesanTutor } from '../komponen/isiTutor.js';

const KUNCI_RIWAYAT = 'lanora-tutor-ai';
const BATAS_PESAN = 12;

function ambilRiwayat() {
  try {
    const data = JSON.parse(localStorage.getItem(KUNCI_RIWAYAT) || '[]');
    if (!Array.isArray(data)) return [];
    return data.filter((p) =>
      ['user', 'assistant'].includes(p.role) &&
      typeof p.content === 'string'
    ).slice(-BATAS_PESAN);
  } catch {
    return [];
  }
}

export function tampilkan(wadah) {
  let aktif = true;
  let sedangMengirim = false;
  let pesan = ambilRiwayat();

  const daftarPesan = el('div', {
    className: 'tutor-daftar-pesan',
    'aria-live': 'polite',
  });

  const status = el('p', {
    className: 'keterangan',
    role: 'status',
  });

  const kolomPesan = el('textarea', {
    className: 'tutor-kolom-pesan',
    placeholder: 'Tulis pertanyaan matematika di sini...',
    rows: 3,
    maxlength: 2000,
    'aria-label': 'Pesan untuk Tutor AI',
  });

  const tombolKirim = el('button', {
    className: 'tombol tombol-penuh',
    type: 'submit',
    teks: 'Kirim pertanyaan',
  });

  function simpanRiwayat() {
    try {
      localStorage.setItem(KUNCI_RIWAYAT, JSON.stringify(pesan));
    } catch {
      status.textContent = 'Riwayat belum bisa disimpan di perangkat ini.';
    }
  }

  function tampilkanPesan() {
    daftarPesan.replaceChildren();

    if (pesan.length === 0) {
      daftarPesan.append(
        el('div', { className: 'tutor-sambutan' },
          el('h2', { teks: 'Halo! Aku Tutor AI.' }),
          el('p', {
            teks: 'Yuk, belajar bunga tunggal dan tabungan bersama. Tanyakan hal yang belum kamu pahami, ya.',
          }),
        ),
      );
      return;
    }

    for (const item of pesan) {
      daftarPesan.append(
        el('div', {
          className: `tutor-pesan tutor-pesan-${item.role}`,
        },
          el('strong', {
            teks: item.role === 'user' ? 'Kamu' : 'Tutor AI',
          }),
          // Jawaban AI: Markdown + rumus (dirender aman, tanpa HTML). Pesan siswa: teks biasa.
          item.role === 'assistant' ? isiPesanTutor(item.content) : el('p', { teks: item.content }),
        ),
      );
    }
  }

  async function kirim(event) {
    event.preventDefault();

    const isi = kolomPesan.value.trim();

    if (!isi || sedangMengirim || !aktif) return;

    if (pesan.length >= BATAS_PESAN) {
      status.textContent = 'Percakapan sudah mencapai batas. Muat percakapan baru untuk melanjutkan.';
      return;
    }

    sedangMengirim = true;
    tombolKirim.disabled = true;
    kolomPesan.disabled = true;
    status.textContent = 'Tutor AI sedang berpikir...';

    pesan.push({ role: 'user', content: isi });
    tampilkanPesan();
    simpanRiwayat();
    kolomPesan.value = '';

    const hasil = await kirimPesanTutor(pesan);

    if (!aktif) return;

    if (!hasil.ok) {
      pesan.pop();
      tampilkanPesan();
      kolomPesan.value = isi;
      status.textContent = pesanGalatTutor(hasil.kode_galat);
    } else {
      pesan.push({
        role: 'assistant',
        content: hasil.data.answer,
      });

      pesan = pesan.slice(-BATAS_PESAN);
      simpanRiwayat();
      tampilkanPesan();
      status.textContent = '';
    }

    sedangMengirim = false;
    tombolKirim.disabled = false;
    kolomPesan.disabled = false;
    kolomPesan.focus();
  }

  function hapusPercakapan() {
    if (sedangMengirim) return;

    pesan = [];
    simpanRiwayat();
    tampilkanPesan();
    status.textContent = 'Percakapan baru dimulai.';
  }

  const formulir = el('form', {
    className: 'tutor-form',
    onsubmit: kirim,
  }, kolomPesan, tombolKirim);

  wadah.append(
    el('section', { className: 'halaman halaman-tutor' },
      kepalaHalaman({
        judul: 'Tutor AI',
        subjudul: 'Belajar matematika langkah demi langkah.',
      }),
      el('div', { className: 'kartu tutor-kartu' },
        daftarPesan,
        status,
        formulir,
        el('button', {
          className: 'tombol tombol-sekunder',
          type: 'button',
          teks: 'Percakapan baru',
          onclick: hapusPercakapan,
        }),
      ),
    ),
  );

  tampilkanPesan();

  return () => {
    aktif = false;
  };
}
