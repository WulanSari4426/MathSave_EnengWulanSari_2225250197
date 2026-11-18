/**
 * Sub-bab materi (PRD F-02, F-03; design.md 5.3, 5.4).
 *  - Kartu langkah: satu ide per kartu, pindah dengan Kembali / Lanjut (tanpa perpindahan otomatis).
 *  - Contoh lengkap: langkah muncul satu per satu ("Tampilkan langkah berikutnya").
 *  - Contoh setengah jadi: siswa mengisi hasil langkah Hitung.
 *  - Coba Sendiri: setelah dikerjakan, sub-bab ditandai selesai (simpan_kemajuan 'selesai').
 * Kemajuan 'sedang' disimpan saat siswa pindah kartu (api.md 3.2). Posisi terakhir juga diingat
 * di perangkat agar bisa dilanjutkan (kenyamanan, bukan data resmi).
 */
import { el, kepalaFokus, tombol, tautanTombol, bilahKemajuan, isiUlang } from '../komponen/elemen.js';
import { isiKartu, kotakRumus, blokLangkah } from '../komponen/blokMateri.js';
import { MATERI, URUTAN_SUB_MATERI, SUB_MATERI_LATIHAN, susunLayar } from '../data/materi.js';
import { periksaIsianMateri, PESAN_FORMAT_ANGKA } from '../logika/periksaIsian.js';
import { simpanKemajuan } from '../layanan/api.js';
import { bacaLokal, tulisLokal } from '../layanan/penyimpananLokal.js';
import { pesanGalatRpc } from '../logika/pesanGalat.js';

/** Kolom angka dengan label terlihat dan contoh format (design.md 6 "Kolom angka"). */
function kolomAngka(label, satuan) {
  const id = `isian-${Math.random().toString(36).slice(2, 8)}`;
  const input = el('input', {
    id, className: 'isian', inputmode: 'decimal', autocomplete: 'off', enterkeyhint: 'done',
  });
  const contoh = satuan === 'rupiah' ? 'Contoh: 80000 atau 80.000' : 'Contoh: 6 atau 2,5';
  return {
    elemen: el('div', { className: 'kolom-isian' }, el('label', { for: id, teks: label }), input,
      el('p', { className: 'keterangan', teks: contoh })),
    input,
  };
}

/** Kotak umpan balik: ikon + teks + warna status (design.md 6), diumumkan pembaca layar. */
function umpanBalik(status, teks) {
  const benar = status === 'benar';
  return el('div', { className: `umpan-balik ${benar ? 'umpan-benar' : 'umpan-salah'}`, role: 'status' },
    el('span', { className: 'umpan-ikon', 'aria-hidden': 'true', teks: benar ? '✓' : '✕' }),
    el('span', { teks }));
}

export function tampilkan(wadah, { subMateri }) {
  const id = String(subMateri || '').toUpperCase();
  const materi = MATERI[id];
  if (!materi) {
    wadah.append(el('section', { className: 'halaman' },
      el('h1', { teks: 'Sub-bab tidak ditemukan' }),
      el('p', { teks: 'Pilih sub-bab dari daftar materi.' }),
      tautanTombol('Kembali ke Belajar', '#/belajar')));
    return undefined;
  }

  const layar = susunLayar(id);
  const kunciLokal = `materi:${id}`;
  let indeks = Math.min(Math.max(0, Number(bacaLokal(kunciLokal, 0)) || 0), layar.length - 1);
  let aktif = true;

  const { kepala, ket } = kepalaFokus({
    judul: `${id} ${materi.judul}`, kembaliKe: '#/belajar', labelTutup: 'Tutup materi, kembali ke daftar sub-bab',
  });
  const wadahBilah = el('div');
  const isi = el('div', { className: 'isi-layar', 'aria-live': 'polite' });
  const tombolKembali = tombol('Kembali', () => pindah(indeks - 1), { sekunder: true, penuh: false });
  const tombolLanjut = tombol('Lanjut', () => pindah(indeks + 1), { penuh: false });
  const navigasi = el('div', { className: 'baris-tombol' }, tombolKembali, tombolLanjut);

  wadah.append(el('section', { className: 'halaman' }, kepala, wadahBilah, isi, navigasi));

  function simpanSedang() {
    // Kemajuan tidak menghalangi belajar: kegagalan jaringan cukup diabaikan di sini.
    void simpanKemajuan(id, 'sedang', indeks);
  }

  function pindah(baru) {
    if (baru < 0 || baru >= layar.length) return;
    indeks = baru;
    tulisLokal(kunciLokal, indeks);
    simpanSedang();
    gambar();
    window.scrollTo(0, 0);
  }

  function gambar() {
    const posisi = layar[indeks];
    const jenis = { kartu: 'Kartu', contoh: 'Contoh', coba: 'Coba Sendiri' }[posisi.jenis];
    ket.textContent = `${jenis} · ${indeks + 1} dari ${layar.length}`;
    wadahBilah.replaceChildren(bilahKemajuan(indeks + 1, layar.length, `Layar ${indeks + 1} dari ${layar.length}`));

    if (posisi.jenis === 'kartu') isi.replaceChildren(isiKartu(materi.kartu[posisi.indeks]));
    else if (posisi.jenis === 'contoh') isi.replaceChildren(layarContoh(materi.contoh[posisi.indeks]));
    else isi.replaceChildren(layarCoba());

    tombolKembali.disabled = indeks === 0;
    tombolLanjut.hidden = indeks === layar.length - 1;
  }

  // ---------------------------------------------------------------------------
  // Contoh langkah demi langkah
  // ---------------------------------------------------------------------------
  function layarContoh(contoh) {
    const daftar = el('ol', { className: 'daftar-langkah' });
    const wadahContoh = el('div', { className: 'kartu isi-kartu' },
      el('h2', { teks: contoh.judul }),
      el('div', { className: 'kotak-soal' }, el('p', { teks: contoh.soal })),
      daftar);
    const tombolLangkah = tombol('', () => {
      terbuka += 1;
      gambarLangkah();
    }, { sekunder: true });
    wadahContoh.append(tombolLangkah);

    let terbuka = 1;
    let isianSelesai = !contoh.isian;

    function gambarLangkah() {
      daftar.replaceChildren();
      contoh.langkah.slice(0, terbuka).forEach((l, i) => {
        const tunda = contoh.isian && i === contoh.isian.langkah && !isianSelesai;
        const baris = tunda ? l.baris.slice(0, contoh.isian.tampil) : l.baris;
        const blok = blokLangkah(i + 1, l.langkah, l.langkah === 'Rencanakan' ? [] : baris);
        if (l.langkah === 'Rencanakan') blok.append(kotakRumus(baris));
        if (tunda) blok.append(blokIsian(contoh.isian));
        daftar.append(blok);
      });
      const menunggu = contoh.isian && terbuka > contoh.isian.langkah && !isianSelesai;
      tombolLangkah.hidden = terbuka >= contoh.langkah.length || menunggu;
      tombolLangkah.textContent = `Tampilkan langkah ${terbuka + 1}`;
    }

    function blokIsian(isian) {
      const { elemen, input } = kolomAngka(`Lengkapi: ${isian.label}`, isian.satuan);
      const wadahPesan = el('div', { 'aria-live': 'polite' });
      let percobaan = 0;
      const tombolLihat = tombol('Lihat jawabannya', () => {
        isianSelesai = true;
        gambarLangkah();
      }, { sekunder: true });
      tombolLihat.hidden = true;
      const periksa = tombol('Periksa', () => {
        const hasil = periksaIsianMateri(input.value, isian);
        if (hasil.status === 'kosong') {
          wadahPesan.replaceChildren(umpanBalik('salah', 'Tulis jawabanmu dulu.'));
          return;
        }
        if (hasil.status === 'format') {
          wadahPesan.replaceChildren(umpanBalik('salah', PESAN_FORMAT_ANGKA));
          return;
        }
        percobaan += 1;
        if (hasil.status === 'benar') {
          isianSelesai = true;
          gambarLangkah();
          daftar.querySelectorAll('.langkah')[isian.langkah]
            ?.prepend(umpanBalik('benar', 'Benar! Hitunganmu tepat.'));
          return;
        }
        wadahPesan.replaceChildren(umpanBalik('salah', 'Belum tepat. Periksa lagi perhitunganmu langkah demi langkah.'));
        tombolLihat.hidden = percobaan < 1;
      });
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') periksa.click();
      });
      return el('div', { className: 'blok-isian' }, elemen, periksa, wadahPesan, tombolLihat);
    }

    gambarLangkah();
    return wadahContoh;
  }

  // ---------------------------------------------------------------------------
  // Coba Sendiri → sub-bab selesai
  // ---------------------------------------------------------------------------
  function layarCoba() {
    const soal = materi.cobaSendiri;
    const { elemen, input } = kolomAngka(soal.label, soal.satuan);
    const hasilEl = el('div', { 'aria-live': 'polite' });
    const statusSimpan = el('p', { className: 'keterangan', role: 'status' });
    const lanjutan = el('div', { className: 'grup-tombol' });

    const periksa = tombol('Periksa', async () => {
      const hasil = periksaIsianMateri(input.value, soal);
      if (hasil.status === 'kosong') {
        hasilEl.replaceChildren(umpanBalik('salah', 'Tulis jawabanmu dulu.'));
        return;
      }
      if (hasil.status === 'format') {
        hasilEl.replaceChildren(umpanBalik('salah', PESAN_FORMAT_ANGKA));
        return;
      }
      const benar = hasil.status === 'benar';
      hasilEl.replaceChildren(
        umpanBalik(benar ? 'benar' : 'salah',
          benar ? 'Benar! Kamu sudah menyelesaikan sub-bab ini.' : 'Belum tepat. Baca pembahasannya, lalu coba lagi.'),
        el('div', { className: 'pembahasan' }, el('h3', { teks: 'Pembahasan' }),
          ...soal.pembahasan.map((b) => el('p', { teks: b }))),
      );
      await tandaiSelesai();
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') periksa.click();
    });

    async function tandaiSelesai() {
      statusSimpan.textContent = 'Menyimpan kemajuanmu…';
      const hasil = await simpanKemajuan(id, 'selesai', layar.length - 1);
      if (!aktif) return;
      if (hasil.ok) {
        statusSimpan.textContent = '✓ Sub-bab ini tercatat selesai.';
        tulisLokal(kunciLokal, 0);
      } else {
        statusSimpan.textContent = `${pesanGalatRpc(hasil.kode_galat)} Tekan Periksa lagi untuk menyimpan.`;
      }
      tampilkanLanjutan();
    }

    function tampilkanLanjutan() {
      const urutan = URUTAN_SUB_MATERI.indexOf(id);
      const berikut = URUTAN_SUB_MATERI[urutan + 1];
      isiUlang(lanjutan,
        berikut ? tautanTombol(`Lanjut ke ${berikut} ${MATERI[berikut].judul}`, `#/belajar/${berikut}`) : null,
        SUB_MATERI_LATIHAN.includes(id) ? tautanTombol(`Latihan ${id}`, `#/latihan/${id}/1`, { sekunder: true }) : null,
        tautanTombol('Kembali ke daftar materi', '#/belajar', { sekunder: true }),
      );
    }

    return el('div', { className: 'kartu isi-kartu' },
      el('h2', { teks: 'Coba Sendiri' }),
      el('div', { className: 'kotak-soal' }, el('p', { teks: soal.soal })),
      elemen, periksa, hasilEl, statusSimpan, lanjutan);
  }

  simpanSedang();
  gambar();
  return () => {
    aktif = false;
  };
}

