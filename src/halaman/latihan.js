/**
 * Latihan (PRD F-05, F-06, F-08, F-09; design.md 5.5–5.7).
 *  - #/latihan                    : pilih sub-bab dan tingkat, plus kartu kuis (KF-13, KF-17)
 *  - #/latihan/:subMateri/:tingkat: 5 soal dari BANK LATIHAN saja (KF-14 S2)
 * Petunjuk maksimal 3 tingkat (KF-15), pembahasan lengkap setelah SETIAP pemeriksaan (H9).
 * Penilaian di server (periksa_jawaban); perangkat hanya mengurai angka (uraiAngka).
 */
import {
  el, kepalaHalaman, kepalaFokus, tombol, tautanTombol, kotakGalat, teksMemuat, bilahKemajuan, isiUlang,
} from '../komponen/elemen.js';
import { daftarPembahasan } from '../komponen/blokMateri.js';
import { buatLembar } from '../komponen/lembar.js';
import { MATERI, SUB_MATERI_LATIHAN } from '../data/materi.js';
import {
  ambilSoalLatihan, ambilPetunjuk, periksaJawabanLatihan, periksaPemahaman, statusKuis,
} from '../layanan/api.js';
import { uraiAngka } from '../logika/parserAngka.js';
import { PESAN_LAINNYA } from '../logika/diagnosis.js';
import { PESAN_FORMAT_ANGKA } from '../logika/periksaIsian.js';
import {
  labelJawaban, pecahSorotan, KOLOM_PAHAMI, PILIHAN_DITANYA, susunDiketahui, ringkasLatihan, durasiDetik,
} from '../logika/latihan.js';
import { formatSisaWaktu, sisaWaktuMs, hitungSelisihJam } from '../logika/kuis.js';
import { pesanGalatRpc } from '../logika/pesanGalat.js';

const NAMA_TINGKAT = { 1: 'Mudah', 2: 'Sedang', 3: 'Sulit' };

export function tampilkan(wadah, parameter) {
  if (parameter.subMateri) return tampilkanSesi(wadah, parameter);
  return tampilkanMenu(wadah);
}

// ===========================================================================
// Menu latihan + kartu kuis
// ===========================================================================
function tampilkanMenu(wadah) {
  let aktif = true;
  let pewaktu = null;
  const kartuKuis = el('div', { className: 'kartu isi-kartu', 'aria-live': 'polite' },
    el('h2', { teks: 'Kuis' }), teksMemuat());

  const daftar = el('ul', { className: 'daftar-polos' });
  for (const id of SUB_MATERI_LATIHAN) {
    daftar.append(el('li', { className: 'kartu isi-kartu' },
      el('div', { className: 'kartu-tautan' },
        el('span', { className: 'kode-sub-bab', teks: id }),
        el('span', { className: 'isi-sub-bab' }, el('strong', { teks: MATERI[id].judul }),
          el('span', { className: 'keterangan', teks: 'Pilih tingkat · 5 soal' }))),
      el('div', { className: 'pilihan-tingkat' },
        ...[1, 2, 3].map((t) => el('a', {
          className: t === 1 ? 'tombol' : 'tombol tombol-sekunder',
          href: `#/latihan/${id}/${t}`,
          'aria-label': `Latihan ${id} tingkat ${NAMA_TINGKAT[t]}`,
          teks: NAMA_TINGKAT[t],
        })))));
  }

  wadah.append(el('section', { className: 'halaman' },
    kepalaHalaman({ judul: 'Latihan', subjudul: 'Asah kemampuanmu dengan soal cerita.', ilustrasi: 'kalkulator' }),
    kartuKuis,
    el('h2', { teks: 'Latihan per sub-bab' }),
    daftar));

  statusKuis().then((hasil) => {
    if (!aktif) return;
    kartuKuis.replaceChildren(el('h2', { teks: 'Kuis' }));
    if (!hasil.ok) {
      kartuKuis.append(el('p', { className: 'keterangan', teks: pesanGalatRpc(hasil.kode_galat) }),
        tautanTombol('Buka kuis', '#/kuis', { sekunder: true }));
      return;
    }
    const { sesi_aktif: sesi, percobaan, dikumpulkan_otomatis: otomatis, waktu_server: waktuServer } = hasil.data;
    if (otomatis) {
      kartuKuis.append(el('p', { teks: 'Kuis sudah dikumpulkan otomatis karena waktunya habis.' }),
        tautanTombol('Lihat hasil', `#/kuis/hasil/${otomatis.sesi_kuis_id}`));
    }
    if (sesi) {
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
    kartuKuis.append(el('p', { teks: '20 soal · 30 menit · 15 pilihan ganda dan 5 isian angka.' }));
    if (percobaan.nilai_tertinggi !== null) {
      kartuKuis.append(el('p', { teks: `Nilai kuis tertinggi: ${percobaan.nilai_tertinggi}` }));
    }
    kartuKuis.append(el('p', { className: 'keterangan', teks: `Kesempatan kuis tersisa: ${percobaan.sisa} dari ${percobaan.maks}` }));
    kartuKuis.append(percobaan.sisa > 0
      ? tautanTombol('Buka kuis', '#/kuis')
      : el('p', { teks: 'Kamu sudah memakai 2 kesempatan kuis. Hasilnya bisa dilihat di Riwayat.' }));
  });

  return () => {
    aktif = false;
    clearInterval(pewaktu);
  };
}

// ===========================================================================
// Sesi latihan 5 soal
// ===========================================================================
function tampilkanSesi(wadah, { subMateri, tingkat: tingkatTeks }) {
  const id = String(subMateri).toUpperCase();
  const tingkat = Number(tingkatTeks);
  let aktif = true;
  const lembarAktif = [];

  if (!SUB_MATERI_LATIHAN.includes(id) || ![1, 2, 3].includes(tingkat)) {
    wadah.append(el('section', { className: 'halaman' },
      el('h1', { teks: 'Latihan tidak ditemukan' }), tautanTombol('Kembali ke Latihan', '#/latihan')));
    return undefined;
  }

  const { kepala, h1, ket } = kepalaFokus({
    judul: `Latihan ${id} · ${NAMA_TINGKAT[tingkat]}`, kembaliKe: '#/latihan', labelTutup: 'Tutup latihan',
  });
  const isi = el('div', { className: 'halaman' }, teksMemuat('Menyiapkan soal…'));
  wadah.append(el('section', { className: 'halaman' }, kepala, isi));

  let daftarSoal = [];
  let catatan = [];
  let nomor = 0;

  async function muat() {
    isi.replaceChildren(teksMemuat('Menyiapkan soal…'));
    const hasil = await ambilSoalLatihan(id, tingkat, 5);
    if (!aktif) return;
    if (!hasil.ok) {
      isi.replaceChildren(kotakGalat(hasil.kode_galat, muat));
      return;
    }
    daftarSoal = hasil.data ?? [];
    if (daftarSoal.length === 0) {
      isi.replaceChildren(el('div', { className: 'kartu' },
        el('p', { teks: 'Belum ada soal untuk bagian ini. Coba tingkat lain atau beri tahu gurumu.' })),
      tautanTombol('Kembali ke Latihan', '#/latihan', { sekunder: true }));
      return;
    }
    catatan = daftarSoal.map(() => ({ benarPertama: false, pernahBenar: false, petunjuk: 0, dicoba: false }));
    nomor = 0;
    tampilkanSoal();
  }

  // -------------------------------------------------------------------------
  function tampilkanSoal() {
    const soal = daftarSoal[nomor];
    const c = catatan[nomor];
    const mulai = Date.now();
    let levelPetunjuk = 0;
    let sorotan = [];

    ket.textContent = `Soal ${nomor + 1} dari ${daftarSoal.length}`;
    h1.focus?.({ preventScroll: true });

    const teksSoal = el('p');
    const gambarTeksSoal = () => {
      teksSoal.replaceChildren(...pecahSorotan(soal.teks_soal, sorotan)
        .map((b) => (b.sorot ? el('mark', { className: 'sorot', teks: b.teks }) : document.createTextNode(b.teks))));
    };
    gambarTeksSoal();

    // Petunjuk bertahap
    const wadahPetunjuk = el('div', { className: 'grup-tombol', 'aria-live': 'polite' });
    const tombolPetunjuk = tombol('Minta petunjuk', async () => {
      tombolPetunjuk.disabled = true;
      const hasil = await ambilPetunjuk(soal.id, levelPetunjuk + 1);
      if (!aktif) return;
      tombolPetunjuk.disabled = false;
      if (!hasil.ok) {
        wadahPetunjuk.append(el('p', { className: 'keterangan', teks: pesanGalatRpc(hasil.kode_galat) }));
        return;
      }
      levelPetunjuk = hasil.data.level;
      c.petunjuk = Math.max(c.petunjuk, levelPetunjuk);
      if (levelPetunjuk === 1 && Array.isArray(hasil.data.sorotan)) {
        sorotan = hasil.data.sorotan;
        gambarTeksSoal();
      }
      wadahPetunjuk.append(el('div', { className: 'kotak-petunjuk' },
        el('strong', { teks: `Petunjuk ${levelPetunjuk} dari ${hasil.data.level_maks} · ${hasil.data.langkah}` }),
        el('p', { teks: hasil.data.teks ?? '' })));
      tombolPetunjuk.textContent = 'Petunjuk berikutnya';
      tombolPetunjuk.hidden = levelPetunjuk >= hasil.data.level_maks;
    }, { sekunder: true });

    // Kolom jawaban
    const idIsian = `jawaban-${nomor}`;
    const input = el('input', {
      id: idIsian, className: 'isian', inputmode: 'decimal', autocomplete: 'off', enterkeyhint: 'done',
      'aria-describedby': `${idIsian}-ket`,
    });
    const kolom = el('div', { className: 'kolom-isian' },
      el('label', { for: idIsian, teks: labelJawaban(soal.satuan_jawaban) }), input,
      el('p', { id: `${idIsian}-ket`, className: 'keterangan', teks: soal.satuan_jawaban === 'rupiah' ? 'Contoh: 150000 atau 150.000' : 'Contoh: 6 atau 2,5' }));
    const wadahHasil = el('div', { className: 'grup-tombol', 'aria-live': 'polite' });

    const tombolPeriksa = tombol('Periksa', async () => {
      const nilai = uraiAngka(input.value);
      if (input.value.trim() === '' || nilai === null) {
        input.setAttribute('aria-invalid', 'true');
        wadahHasil.replaceChildren(umpan('salah', input.value.trim() === '' ? 'Tulis jawabanmu dulu.' : PESAN_FORMAT_ANGKA));
        input.focus();
        return; // tidak dihitung sebagai jawaban salah (PRD F-09)
      }
      input.removeAttribute('aria-invalid');
      tombolPeriksa.disabled = true;
      const hasil = await periksaJawabanLatihan({
        soalId: soal.id, jawaban: nilai, jumlahPetunjuk: levelPetunjuk, durasiDetik: durasiDetik(mulai, Date.now()),
      });
      if (!aktif) return;
      tombolPeriksa.disabled = false;
      if (!hasil.ok) {
        wadahHasil.replaceChildren(kotakGalat(hasil.kode_galat));
        return;
      }
      if (!c.dicoba) c.benarPertama = hasil.data.benar;
      c.dicoba = true;
      c.pernahBenar ||= hasil.data.benar;
      tampilkanHasil(hasil.data);
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') tombolPeriksa.click();
    });

    function tampilkanHasil(data) {
      const kepalaUmpan = data.benar
        ? umpan('benar', 'Benar! Langkahmu sudah tepat.')
        : umpan('salah', `Belum tepat. ${data.pesan ?? PESAN_LAINNYA}`);
      const terakhir = nomor === daftarSoal.length - 1;
      wadahHasil.replaceChildren(
        kepalaUmpan,
        daftarPembahasan(data.pembahasan, { bertahap: true }),
        tombol('Coba lagi', () => {
          input.value = '';
          wadahHasil.replaceChildren();
          input.focus();
        }, { sekunder: true }),
        tombol(terakhir ? 'Lihat ringkasan' : 'Soal berikutnya', () => {
          if (terakhir) tampilkanRingkasan();
          else {
            nomor += 1;
            tampilkanSoal();
          }
        }),
      );
      kepalaUmpan.scrollIntoView?.({ block: 'nearest' });
    }

    isi.replaceChildren(
      bilahKemajuan(nomor + 1, daftarSoal.length, `Soal ${nomor + 1} dari ${daftarSoal.length}`),
      el('div', { className: 'kartu isi-kartu' },
        el('div', { className: 'kotak-soal' }, teksSoal),
        tombol('Pahami Soal', () => bukaPahami(soal), { sekunder: true }),
        kolom,
        tombolPetunjuk,
        wadahPetunjuk,
        tombolPeriksa,
        wadahHasil),
    );
  }

  // -------------------------------------------------------------------------
  // Panel Pahami Soal (F-05): tidak disimpan sebagai jawaban dan tidak memengaruhi nilai
  // -------------------------------------------------------------------------
  function bukaPahami(soal) {
    const lembar = buatLembar({ judul: 'Pahami Soal' });
    lembarAktif.push(lembar);
    const masukan = {};
    const baris = KOLOM_PAHAMI.map(({ kunci, label }) => {
      const idK = `pahami-${kunci}`;
      const input = el('input', { id: idK, className: 'isian', inputmode: 'decimal', autocomplete: 'off' });
      masukan[kunci] = input;
      if (kunci !== 'lama') return el('div', { className: 'kolom-isian' }, el('label', { for: idK, teks: label }), input);
      const pilih = el('select', { className: 'isian isian-pilihan', 'aria-label': 'Satuan lama menabung' },
        ...['tahun', 'bulan', 'hari'].map((s) => el('option', { value: s, teks: s })));
      masukan.satuan_lama = pilih;
      return el('div', { className: 'kolom-isian' }, el('label', { for: idK, teks: label }),
        el('div', { className: 'baris-isian' }, input, pilih));
    });
    const ditanya = el('select', { id: 'pahami-ditanya', className: 'isian isian-pilihan' },
      el('option', { value: '', teks: 'Pilih yang ditanya' }),
      ...PILIHAN_DITANYA.map((d) => el('option', { value: d.nilai, teks: d.label })));
    const hasilEl = el('div', { 'aria-live': 'polite' });
    const cek = tombol('Cek pemahamanku', async () => {
      const susun = susunDiketahui(Object.fromEntries(Object.entries(masukan).map(([k, v]) => [k, v.value])));
      if (!susun.ok) {
        hasilEl.replaceChildren(umpan('salah', PESAN_FORMAT_ANGKA));
        masukan[susun.kunci].focus();
        return;
      }
      if (!ditanya.value) {
        hasilEl.replaceChildren(umpan('salah', 'Pilih dulu apa yang ditanya soal.'));
        return;
      }
      cek.disabled = true;
      const hasil = await periksaPemahaman(soal.id, susun.diketahui, ditanya.value);
      cek.disabled = false;
      if (!hasil.ok) {
        hasilEl.replaceChildren(kotakGalat(hasil.kode_galat));
        return;
      }
      hasilEl.replaceChildren(umpan(hasil.data.semua_tepat ? 'benar' : 'salah', hasil.data.pesan));
    });
    lembar.isi.append(
      el('p', { className: 'keterangan', teks: 'Isi yang diketahui dari soal saja. Kolom yang tidak ada di soal biarkan kosong.' }),
      el('div', { className: 'kotak-soal' }, el('p', { teks: soal.teks_soal })),
      ...baris,
      el('div', { className: 'kolom-isian' }, el('label', { for: 'pahami-ditanya', teks: 'Yang ditanya' }), ditanya),
      cek, hasilEl,
      tombol('Tutup', () => lembar.tutup(), { sekunder: true }),
    );
    lembar.dialog.addEventListener('close', () => lembar.hapus());
    lembar.buka();
  }

  // -------------------------------------------------------------------------
  function tampilkanRingkasan() {
    const r = ringkasLatihan(catatan);
    ket.textContent = 'Ringkasan';
    const urutan = SUB_MATERI_LATIHAN.indexOf(id);
    const berikut = tingkat < 3 ? `#/latihan/${id}/${tingkat + 1}`
      : SUB_MATERI_LATIHAN[urutan + 1] ? `#/latihan/${SUB_MATERI_LATIHAN[urutan + 1]}/1` : null;
    isiUlang(isi,
      el('div', { className: 'kartu isi-kartu', role: 'status' },
        el('h2', { teks: 'Latihan selesai' }),
        el('p', { teks: `Benar pada percobaan pertama: ${r.benarPertama} dari ${r.jumlahSoal} soal.` }),
        el('p', { teks: `Akhirnya benar: ${r.pernahBenar} dari ${r.jumlahSoal} soal.` }),
        el('p', { className: 'keterangan', teks: `Petunjuk yang kamu buka: ${r.petunjuk}. Petunjuk tidak mengurangi nilai.` })),
      tombol('Ulangi latihan ini', muat),
      berikut ? tautanTombol('Latihan berikutnya', berikut, { sekunder: true }) : null,
      tautanTombol(`Baca lagi materi ${id}`, `#/belajar/${id}`, { sekunder: true }),
      tautanTombol('Kembali ke Latihan', '#/latihan', { sekunder: true }),
    );
  }

  muat();
  return () => {
    aktif = false;
    for (const l of lembarAktif) l.hapus();
  };
}

function umpan(status, teks) {
  const benar = status === 'benar';
  return el('div', { className: `umpan-balik ${benar ? 'umpan-benar' : 'umpan-salah'}`, role: 'status' },
    el('span', { className: 'umpan-ikon', 'aria-hidden': 'true', teks: benar ? '✓' : '✕' }),
    el('span', { teks }));
}
