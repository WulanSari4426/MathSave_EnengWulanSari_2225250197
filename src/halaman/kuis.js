/**
 * Kuis (PRD F-07; design.md 5.9–5.9d). Keputusan KF-10 sampai KF-22:
 *  - 20 soal sesuai kisi-kisi (15 pilihan ganda + 5 isian), 30 menit, maksimal 2 percobaan (KF-13).
 *  - Timer dari batas_waktu SERVER; tetap berjalan saat aplikasi ditutup atau offline (KF-11).
 *  - Jawaban resmi hanya setelah server membalas { tersimpan: true }; sebelum itu "Belum terkirim"
 *    dan disimpan sementara di perangkat (KF-20). Jawaban terakhir yang diterima server yang dinilai (KF-22).
 *  - Tanpa petunjuk dan tanpa benar/salah selama kuis (KF-15 H8, aturan 8).
 *  - Selesai Kuis selalu dengan konfirmasi (KF-16 A1); ✕ dan tombol kembali Android = keluar sementara (KF-17).
 *
 * Rute: #/kuis (mulai/lanjutkan) dan #/kuis/hasil/:sesiKuisId (hasil, juga dari Riwayat).
 */
import {
  el, kepalaHalaman, tombol, tautanTombol, kotakGalat, teksMemuat, isiUlang,
} from '../komponen/elemen.js';
import { daftarPembahasan } from '../komponen/blokMateri.js';
import { buatLembar } from '../komponen/lembar.js';
import {
  mulaiKuis, statusKuis, selesaikanKuis, simpanJawabanKuis,
} from '../layanan/api.js';
import { bacaLokal, tulisLokal, hapusLokal } from '../layanan/penyimpananLokal.js';
import { uraiAngka, formatAngka, formatRupiah } from '../logika/parserAngka.js';
import { PESAN_FORMAT_ANGKA } from '../logika/periksaIsian.js';
import { labelJawaban } from '../logika/latihan.js';
import {
  hitungSelisihJam, sisaWaktuMs, formatSisaWaktu, perluPengingat, petaTersimpan, antreJawaban,
  cocokkanAntrean, statusSoal, LABEL_STATUS, jawabanBerlaku, ringkasStatus, teksKonfirmasi,
  teksStatusJawaban, teksCaraSelesai, samaJawaban,
} from '../logika/kuis.js';

/** Tombol utama yang aman mendapat fokus pertama saat dialog dibuka (bukan aksi yang mengumpulkan/keluar). */
const autofokus = (b) => {
  b.setAttribute('autofocus', '');
  return b;
};

const kunciAntrean = (id) => `kuis:${id}:antrean`;
const kunciNomor = (id) => `kuis:${id}:nomor`;
const kunciSatuan = (id) => `kuis:${id}:satuan`;

export function tampilkan(wadah, parameter) {
  if (parameter.sesiKuisId) return tampilkanHasil(wadah, parameter.sesiKuisId);
  return tampilkanMulai(wadah);
}

// ===========================================================================
// Layar mulai / lanjutkan
// ===========================================================================
function tampilkanMulai(wadah) {
  let aktif = true;
  let bersihkanSesi = null;
  const isi = el('div', { className: 'halaman' }, teksMemuat());
  wadah.append(isi);

  async function muat() {
    isi.replaceChildren(teksMemuat('Memeriksa kuismu…'));
    const hasil = await statusKuis();
    if (!aktif) return;
    if (!hasil.ok) {
      isi.replaceChildren(el('h1', { teks: 'Kuis' }), kotakGalat(hasil.kode_galat, muat),
        tautanTombol('Kembali ke Latihan', '#/latihan', { sekunder: true }));
      return;
    }
    const { sesi_aktif: sesi, dikumpulkan_otomatis: otomatis, percobaan, waktu_server: waktuServer } = hasil.data;
    if (sesi) {
      // Melanjutkan sesi yang sama: bukan percobaan baru, waktu tidak diulang (KF-11 T3, T5; KF-13).
      bersihkanSesi = jalankanSesi(isi, { ...sesi, waktu_server: waktuServer }, () => aktif);
      return;
    }
    gambarMulai(percobaan, otomatis);
  }

  function gambarMulai(percobaan, otomatis) {
    const galat = el('div', { 'aria-live': 'polite' });
    const bisaMulai = percobaan.sisa > 0;
    const tombolMulai = tombol('Mulai Kuis', async () => {
      tombolMulai.disabled = true;
      tombolMulai.textContent = 'Menyiapkan soal…';
      const hasil = await mulaiKuis();
      if (!aktif) return;
      if (!hasil.ok) {
        // Belum berhasil dimulai → kesempatan tidak berkurang (KF-13 P4).
        tombolMulai.disabled = false;
        tombolMulai.textContent = 'Mulai Kuis';
        galat.replaceChildren(kotakGalat(hasil.kode_galat));
        return;
      }
      bersihkanSesi = jalankanSesi(isi, hasil.data, () => aktif);
    });
    tombolMulai.disabled = !bisaMulai;

    isiUlang(isi,
      kepalaHalaman({ judul: 'Kuis', subjudul: 'Uji pemahamanmu secara mandiri.', ilustrasi: 'simbol' }),
      otomatis ? el('div', { className: 'kartu isi-kartu', role: 'status' },
        el('p', { teks: 'Waktu kuis sudah habis. Jawabanmu sudah dikumpulkan otomatis.' }),
        tautanTombol('Lihat hasil', `#/kuis/hasil/${otomatis.sesi_kuis_id}`)) : null,
      el('div', { className: 'kartu isi-kartu' },
        el('h2', { teks: 'Aturan kuis' }),
        el('ul', {},
          el('li', { teks: '20 soal: 15 pilihan ganda dan 5 isian angka.' }),
          el('li', { teks: 'Waktu 30 menit, mulai saat kamu menekan Mulai Kuis.' }),
          el('li', { teks: 'Waktu tetap berjalan walaupun aplikasi ditutup atau internet terputus.' }),
          el('li', { teks: 'Tidak ada petunjuk. Pembahasan muncul setelah kuis dikumpulkan.' }),
          el('li', { teks: 'Soal yang tidak dijawab dihitung salah.' }))),
      el('div', { className: 'kartu isi-kartu' },
        bisaMulai
          ? el('p', { teks: `Kesempatan kuis: ${percobaan.digunakan + 1} dari ${percobaan.maks}` })
          : el('p', { teks: `Kamu sudah memakai ${percobaan.maks} kesempatan kuis.${percobaan.nilai_tertinggi !== null ? ` Nilai tertinggimu: ${percobaan.nilai_tertinggi}.` : ''}` }),
        percobaan.nilai_tertinggi !== null && bisaMulai
          ? el('p', { teks: `Nilai tertinggimu: ${percobaan.nilai_tertinggi}. Kamu masih punya ${percobaan.sisa} kesempatan lagi.` }) : null,
        tombolMulai,
        galat),
      bisaMulai ? null : tautanTombol('Lihat hasil di Riwayat', '#/riwayat', { sekunder: true }),
      tautanTombol('Kembali ke Latihan', '#/latihan', { sekunder: true }),
    );
  }

  muat();
  return () => {
    aktif = false;
    bersihkanSesi?.();
  };
}

// ===========================================================================
// Mengerjakan kuis
// ===========================================================================
/**
 * @param {HTMLElement} isi
 * @param {object} paket hasil mulai_kuis / status_kuis.sesi_aktif (+ waktu_server)
 * @returns {() => void} bersih-bersih
 */
function jalankanSesi(isi, paket, masihAktif) {
  const sesiId = paket.sesi_kuis_id;
  const soal = paket.soal ?? [];
  const selisih = hitungSelisihJam(paket.waktu_server, Date.now());
  const tersimpan = petaTersimpan(paket.jawaban_tersimpan);
  let antrean = cocokkanAntrean(bacaLokal(kunciAntrean(sesiId), {}), tersimpan);
  simpanAntrean();
  tulisLokal(kunciSatuan(sesiId), Object.fromEntries(soal.map((s) => [s.id, s.satuan_jawaban])));

  let posisi = Math.min(Math.max(0, Number(bacaLokal(kunciNomor(sesiId), 0)) || 0), soal.length - 1);
  let selesai = false;
  let mengirim = false;
  let offline = typeof navigator !== 'undefined' && navigator.onLine === false;
  let pengingatSudah = false;
  let keluarDisengaja = false;
  const mulaiTampil = Date.now();

  // --- Kepala tetap (sticky) -------------------------------------------------
  const judul = el('h1', { teks: '' });
  const teksSisa = el('p', { className: 'sisa-waktu', 'aria-live': 'off' });
  const barisOffline = el('p', { className: 'baris-offline', role: 'status', hidden: true });
  const tutup = el('button', { type: 'button', className: 'tombol tombol-ikon' });
  tutup.innerHTML = '<span class="ikon-tutup" aria-hidden="true">✕</span>';
  tutup.append(el('span', { className: 'khusus-pembaca-layar', teks: 'Keluar sementara dari kuis' }));
  tutup.addEventListener('click', () => bukaKeluar());
  const wadahPengingat = el('div', { 'aria-live': 'polite' });
  const kepala = el('header', { className: 'kepala-kuis' },
    el('div', { className: 'kepala-fokus' }, tutup, el('div', { className: 'kepala-fokus-teks' }, judul, teksSisa)),
    barisOffline, wadahPengingat);

  const badan = el('div', { className: 'kartu isi-kartu' });
  const statusEl = el('p', { className: 'status-jawaban', role: 'status' });
  const pesanEl = el('div', { 'aria-live': 'polite' });
  const tombolSebelum = tombol('‹ Sebelumnya', () => pindah(posisi - 1), { sekunder: true, penuh: false });
  const tombolBerikut = tombol('Berikutnya ›', () => pindah(posisi + 1), { sekunder: true, penuh: false });
  const tombolDaftar = tombol('Daftar soal', () => bukaDaftar(), { sekunder: true, penuh: false });
  const tombolSelesai = tombol('Selesai Kuis', () => bukaKonfirmasi(), { penuh: false });
  const navigasi = el('div', { className: 'navigasi-kuis' }, tombolSebelum, tombolBerikut, tombolDaftar, tombolSelesai);

  isi.replaceChildren(el('section', { className: 'halaman' }, kepala, badan, statusEl, pesanEl, navigasi));

  const lembarDaftar = buatLembar({ judul: 'Daftar soal' });
  const lembarKonfirmasi = buatLembar({ judul: 'Kumpulkan kuis?' });
  const lembarKeluar = buatLembar({ judul: 'Keluar dari kuis?' });
  const semuaLembar = [lembarDaftar, lembarKonfirmasi, lembarKeluar];

  // --- Waktu -------------------------------------------------------------------
  const sisa = () => sisaWaktuMs(paket.batas_waktu, Date.now(), selisih);
  function detak() {
    const ms = sisa();
    teksSisa.textContent = `Sisa waktu ${formatSisaWaktu(ms)}`;
    if (lembarKeluar.terbuka()) gambarKeluar();
    if (perluPengingat(ms, pengingatSudah)) tampilkanPengingat();
    if (ms <= 0 && !selesai) waktuHabis();
  }
  const pewaktu = setInterval(detak, 1000);
  const pengirimBerkala = setInterval(() => {
    if (Object.keys(antrean).length > 0) kirimAntrean();
  }, 10000);

  function tampilkanPengingat() {
    pengingatSudah = true; // sekali per pembukaan kuis (KF-16 B1)
    const kotak = el('div', { className: 'pengingat' },
      el('p', { teks: 'Sisa waktu 5 menit.' }),
      tombol('Tutup', () => kotak.remove(), { sekunder: true, penuh: false }));
    kotak.lastChild.setAttribute('aria-label', 'Tutup pengingat');
    wadahPengingat.replaceChildren(kotak);
    setTimeout(() => kotak.remove(), 8000);
  }

  // --- Antrean dan pengiriman --------------------------------------------------
  function simpanAntrean() {
    if (Object.keys(antrean).length === 0) hapusLokal(kunciAntrean(sesiId));
    else tulisLokal(kunciAntrean(sesiId), antrean);
  }

  function aturOffline(nilai) {
    offline = nilai;
    const jumlah = Object.keys(antrean).length;
    if (offline) {
      barisOffline.hidden = false;
      barisOffline.textContent = `⚠ Offline · ${jumlah} belum terkirim. Waktu kuis tetap berjalan. Jawaban yang kamu pilih sekarang belum terkirim dan belum tersimpan di server.`;
    } else if (jumlah > 0) {
      barisOffline.hidden = false;
      barisOffline.textContent = 'Tersambung lagi. Mengirim jawabanmu…';
    } else {
      barisOffline.hidden = true;
    }
  }

  async function kirimAntrean() {
    if (mengirim || selesai) return;
    mengirim = true;
    let adaYangTerkirim = false;
    try {
      for (const [soalId, jawaban] of Object.entries(antrean)) {
        const hasil = await simpanJawabanKuis({
          sesiKuisId: sesiId, soalId, jawaban: jawaban.jawaban, opsiId: jawaban.opsi,
          durasiDetik: Math.round((Date.now() - mulaiTampil) / 1000),
        });
        if (!masihAktif() || selesai) return;
        if (hasil.ok) {
          tersimpan[soalId] = jawaban;
          // Hanya hapus jika siswa tidak mengganti jawaban selama pengiriman.
          if (samaJawaban(antrean[soalId], jawaban)) {
            const { [soalId]: _, ...lain } = antrean;
            antrean = lain;
          }
          adaYangTerkirim = true;
          continue;
        }
        if (hasil.kode_galat === 'GALAT_JARINGAN') {
          aturOffline(true);
          break;
        }
        if (hasil.kode_galat === 'WAKTU_HABIS' || hasil.kode_galat === 'KUIS_SUDAH_SELESAI') {
          // Jawaban offline yang terlambat ditolak dan dibuang (KF-20 J4).
          const terlambat = Object.keys(antrean).length > 0;
          antrean = {};
          simpanAntrean();
          await akhiri(terlambat ? 'Waktu kuis sudah habis saat kamu offline. Jawaban yang belum terkirim tidak dihitung.' : null);
          return;
        }
        // Galat lain (misalnya OPSI_TIDAK_VALID): buang dari antrean dan beri tahu.
        const { [soalId]: _, ...lain } = antrean;
        antrean = lain;
        pesanEl.replaceChildren(kotakGalat(hasil.kode_galat));
      }
      if (adaYangTerkirim && Object.keys(antrean).length === 0) {
        aturOffline(false);
        if (!barisOffline.hidden) barisOffline.textContent = 'Semua jawaban sudah tersimpan.';
        barisOffline.hidden = false;
        setTimeout(() => {
          if (!offline && Object.keys(antrean).length === 0) barisOffline.hidden = true;
        }, 4000);
      }
    } finally {
      mengirim = false;
      simpanAntrean();
      gambarStatus();
    }
    // Jika siswa memilih jawaban baru selama pengiriman, kirim lagi.
    if (!offline && Object.keys(antrean).length > 0) kirimAntrean();
  }

  function jawab(soalId, jawaban) {
    if (selesai) return;
    if (samaJawaban(jawaban, jawabanBerlaku(soalId, tersimpan, antrean))) return;
    antrean = antreJawaban(antrean, soalId, jawaban);
    simpanAntrean();
    gambarStatus();
    if (offline) aturOffline(true);
    else kirimAntrean();
  }

  // --- Soal ----------------------------------------------------------------------
  let inputIsian = null;

  /** Isian dikirim saat siswa pindah nomor atau menekan Simpan. Kolom kosong tidak menghapus jawaban (KF-22). */
  function kirimIsianJikaAda() {
    if (!inputIsian) return true;
    const teks = inputIsian.value.trim();
    if (teks === '') return true;
    const nilai = uraiAngka(teks);
    if (nilai === null) {
      inputIsian.setAttribute('aria-invalid', 'true');
      pesanEl.replaceChildren(kotakGalat(PESAN_FORMAT_ANGKA));
      inputIsian.focus();
      return false;
    }
    inputIsian.removeAttribute('aria-invalid');
    jawab(soal[posisi].id, { jawaban: nilai, opsi: null });
    return true;
  }

  function pindah(baru) {
    if (baru < 0 || baru >= soal.length || baru === posisi) return;
    if (!kirimIsianJikaAda()) return;
    posisi = baru;
    tulisLokal(kunciNomor(sesiId), posisi);
    gambarSoal();
    window.scrollTo(0, 0);
  }

  function gambarSoal() {
    const s = soal[posisi];
    pesanEl.replaceChildren();
    judul.textContent = `Soal ${s.nomor} dari ${soal.length}`;
    const berlaku = jawabanBerlaku(s.id, tersimpan, antrean);
    badan.replaceChildren(el('p', { className: 'keterangan', teks: s.bentuk === 'pilihan_ganda' ? 'Pilihan ganda' : 'Isian angka' }),
      el('div', { className: 'kotak-soal' }, el('p', { teks: s.teks_soal })));
    inputIsian = null;

    if (s.bentuk === 'pilihan_ganda') {
      const grup = el('ul', { className: 'daftar-opsi', role: 'radiogroup', 'aria-label': `Pilihan jawaban soal ${s.nomor}` });
      for (const o of s.opsi ?? []) {
        const dipilih = berlaku?.opsi === o.id;
        const b = el('button', {
          type: 'button', className: 'opsi', role: 'radio', 'aria-checked': dipilih ? 'true' : 'false',
          onclick: () => {
            jawab(s.id, { jawaban: null, opsi: o.id }); // id tetap, bukan huruf (KF-18 O5)
            gambarSoal();
          },
        },
        el('span', { className: 'opsi-huruf', teks: o.huruf }),
        el('span', { className: 'opsi-teks', teks: o.teks }),
        el('span', { className: 'opsi-tanda', 'aria-hidden': 'true', teks: dipilih ? '●' : '' }));
        grup.append(el('li', {}, b));
      }
      badan.append(grup);
    } else {
      const id = `kuis-isian-${s.nomor}`;
      inputIsian = el('input', {
        id, className: 'isian', inputmode: 'decimal', autocomplete: 'off', enterkeyhint: 'done',
      });
      if (berlaku?.jawaban !== null && berlaku?.jawaban !== undefined) inputIsian.value = formatAngka(Number(berlaku.jawaban));
      inputIsian.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') kirimIsianJikaAda();
      });
      inputIsian.addEventListener('change', () => kirimIsianJikaAda());
      badan.append(el('div', { className: 'kolom-isian' },
        el('label', { for: id, teks: labelJawaban(s.satuan_jawaban) }), inputIsian,
        el('p', { className: 'keterangan', teks: 'Jawaban dikirim saat kamu pindah soal atau menekan Simpan jawaban.' })),
      tombol('Simpan jawaban', () => kirimIsianJikaAda(), { sekunder: true }));
    }
    tombolSebelum.disabled = posisi === 0;
    tombolBerikut.disabled = posisi === soal.length - 1;
    gambarStatus();
  }

  function gambarStatus() {
    if (selesai || !soal[posisi]) return;
    statusEl.textContent = teksStatusJawaban(statusSoal(soal[posisi].id, tersimpan, antrean));
    if (lembarDaftar.terbuka()) gambarDaftar();
    if (offline) aturOffline(true);
  }

  // --- Panel daftar soal (KF-22 N1d) -----------------------------------------------
  function tombolNomor(s, saatKetuk) {
    const status = statusSoal(s.id, tersimpan, antrean);
    const label = LABEL_STATUS[status];
    return el('button', {
      type: 'button', className: 'tombol-nomor', 'aria-current': soal.indexOf(s) === posisi ? 'true' : 'false',
      'aria-label': `Soal ${s.nomor}, ${label.teks}`,
      onclick: saatKetuk,
    }, el('span', { teks: String(s.nomor) }), el('span', { className: 'ikon-status', 'aria-hidden': 'true', teks: label.ikon }));
  }

  function gambarDaftar() {
    const r = ringkasStatus(soal, tersimpan, antrean);
    lembarDaftar.isi.replaceChildren(
      el('p', { className: 'keterangan', teks: '✓ Tersimpan · ⏳ Belum terkirim · ○ Belum dijawab' }),
      el('ul', { className: 'panel-nomor' }, ...soal.map((s, i) => el('li', {}, tombolNomor(s, () => {
        lembarDaftar.tutup();
        pindah(i);
      })))),
      el('p', { teks: `Tersimpan ${r.tersimpan.length} · Belum terkirim ${r.belum_terkirim.length} · Belum dijawab ${r.belum_dijawab.length}` }),
      tombol('Tutup', () => lembarDaftar.tutup(), { sekunder: true }),
    );
  }

  function bukaDaftar() {
    kirimIsianJikaAda();
    gambarDaftar();
    lembarDaftar.buka();
  }

  // --- Konfirmasi Selesai Kuis (KF-16 A1) -----------------------------------------
  function bukaKonfirmasi() {
    if (!kirimIsianJikaAda()) return;
    const r = ringkasStatus(soal, tersimpan, antrean);
    const status = el('div', { 'aria-live': 'polite' });
    const ya = tombol('Ya, kumpulkan', async () => {
      ya.disabled = true;
      status.replaceChildren(teksMemuat('Mengirim jawaban…'));
      await kirimAntrean();
      if (selesai) return;
      if (Object.keys(antrean).length > 0) {
        // Offline: kuis BELUM terkumpul (PRD F-07 "Penerapan").
        ya.disabled = false;
        status.replaceChildren(kotakGalat('Kuis belum terkumpul karena internet terputus. Coba lagi setelah tersambung. Waktu tetap berjalan.'));
        return;
      }
      lembarKonfirmasi.tutup();
      await akhiri(null);
      ya.disabled = false;
    }, { sekunder: true });
    isiUlang(lembarKonfirmasi.isi,
      ...teksKonfirmasi(r).map((t) => el('p', { teks: t })),
      r.belum_dijawab.length > 0 ? el('ul', { className: 'panel-nomor', 'aria-label': 'Soal yang belum dijawab' },
        ...r.belum_dijawab.map((n) => {
          const s = soal.find((x) => x.nomor === n);
          return el('li', {}, tombolNomor(s, () => {
            lembarKonfirmasi.tutup();
            pindah(soal.indexOf(s));
          }));
        })) : null,
      autofokus(tombol('Kembali ke soal', () => lembarKonfirmasi.tutup())),
      ya,
      status,
    );
    lembarKonfirmasi.buka();
  }

  // --- Keluar sementara (KF-17) -----------------------------------------------------
  function gambarKeluar() {
    lembarKeluar.isi.replaceChildren(
      el('p', {}, el('strong', { teks: 'Waktu tetap berjalan.' }), ` Sisa waktu: ${formatSisaWaktu(sisa())}`),
      el('p', { teks: 'Kamu bisa melanjutkan kuis selama waktu belum habis. Kuis tidak dikumpulkan.' }),
      autofokus(tombol('Tetap di kuis', () => lembarKeluar.tutup())),
      tombol('Keluar sementara', () => {
        kirimIsianJikaAda();
        keluarDisengaja = true;
        lembarKeluar.tutup();
        window.location.hash = '#/latihan';
      }, { sekunder: true }),
    );
  }

  function bukaKeluar() {
    gambarKeluar();
    lembarKeluar.buka();
  }

  // Tombol/gestur kembali Android: tampilkan dialog yang sama, bukan langsung keluar (KF-17).
  history.pushState({ kuisLanora: sesiId }, '', window.location.href);
  function saatKembali() {
    if (selesai || keluarDisengaja) return;
    history.pushState({ kuisLanora: sesiId }, '', window.location.href);
    bukaKeluar();
  }
  window.addEventListener('popstate', saatKembali);

  // --- Koneksi ------------------------------------------------------------------------
  const saatOnline = () => {
    aturOffline(false);
    kirimAntrean();
  };
  const saatOffline = () => aturOffline(true);
  window.addEventListener('online', saatOnline);
  window.addEventListener('offline', saatOffline);

  // --- Selesai -------------------------------------------------------------------------
  async function waktuHabis() {
    selesai = true;
    for (const l of semuaLembar) l.tutup();
    // Server yang memutuskan. Jawaban yang belum diterima sebelum batas waktu tidak dihitung (KF-20).
    await akhiri(Object.keys(antrean).length > 0
      ? 'Waktu kuis sudah habis. Jawaban yang belum terkirim tidak dihitung.' : 'Waktu kuis sudah habis. Jawabanmu dikumpulkan otomatis.');
  }

  async function akhiri(pesan) {
    selesai = true;
    for (const l of semuaLembar) l.tutup();
    const hasil = await selesaikanKuis(sesiId);
    if (!masihAktif()) return;
    if (!hasil.ok) {
      // Offline saat waktu habis: server tetap menutup kuis (KF-11 T4); hasil dibuka saat tersambung.
      isi.replaceChildren(el('section', { className: 'halaman' },
        el('h1', { teks: 'Kuis' }),
        kotakGalat(hasil.kode_galat === 'GALAT_JARINGAN'
          ? 'Internet terputus. Jika waktu sudah habis, kuismu dikumpulkan server secara otomatis. Sambungkan internet untuk melihat hasilnya.'
          : hasil.kode_galat, () => window.location.reload()),
        tautanTombol('Kembali ke Latihan', '#/latihan', { sekunder: true })));
      return;
    }
    antrean = {};
    hapusLokal(kunciAntrean(sesiId));
    hapusLokal(kunciNomor(sesiId));
    if (pesan) tulisLokal(`kuis:${sesiId}:pesan`, pesan);
    window.location.hash = `#/kuis/hasil/${sesiId}`;
  }

  gambarSoal();
  detak();
  if (offline) aturOffline(true);
  if (Object.keys(antrean).length > 0 && !offline) kirimAntrean();

  return () => {
    clearInterval(pewaktu);
    clearInterval(pengirimBerkala);
    window.removeEventListener('popstate', saatKembali);
    window.removeEventListener('online', saatOnline);
    window.removeEventListener('offline', saatOffline);
    for (const l of semuaLembar) l.hapus();
  };
}

// ===========================================================================
// Hasil kuis (design.md 5.9)
// ===========================================================================
function tampilkanHasil(wadah, sesiKuisId) {
  let aktif = true;
  const isi = el('div', { className: 'halaman' }, teksMemuat('Memuat hasil kuis…'));
  wadah.append(isi);

  async function muat() {
    // Pengaman: hasil tidak dibuka untuk kuis yang masih berjalan, karena selesaikan_kuis akan mengumpulkannya.
    const status = await statusKuis();
    if (!aktif) return;
    if (status.ok && status.data.sesi_aktif?.sesi_kuis_id === sesiKuisId) {
      window.location.replace('#/kuis');
      return;
    }
    const hasil = await selesaikanKuis(sesiKuisId);
    if (!aktif) return;
    if (!hasil.ok) {
      isi.replaceChildren(el('h1', { teks: 'Hasil Kuis' }), kotakGalat(hasil.kode_galat, muat),
        tautanTombol('Kembali ke Riwayat', '#/riwayat', { sekunder: true }));
      return;
    }
    gambar(hasil.data);
  }

  function gambar(h) {
    const satuan = bacaLokal(kunciSatuan(sesiKuisId), {});
    const pesan = bacaLokal(`kuis:${sesiKuisId}:pesan`, null);
    hapusLokal(`kuis:${sesiKuisId}:pesan`);
    const rincian = h.rincian ?? [];
    const kotakRincian = {};

    const daftarRincian = el('div', { className: 'grup-tombol' }, ...rincian.map((r) => {
      const d = rincianSoal(r, satuan[r.soal_id]);
      kotakRincian[r.nomor] = d;
      return d;
    }));

    isiUlang(isi,
      kepalaHalaman({ judul: 'Kuis selesai', subjudul: teksCaraSelesai(h.cara_selesai), ilustrasi: 'simbol' }),
      pesan ? el('div', { className: 'kartu kartu-sekunder', role: 'status' }, el('p', { teks: pesan })) : null,
      el('div', { className: 'kartu isi-kartu' },
        el('p', { className: 'keterangan teks-tengah', teks: `Percobaan ke-${h.percobaan_ke} · Nilai akhir` }),
        el('p', { className: 'nilai-akhir', teks: String(h.skor) }),
        el('p', { className: 'teks-tengah' },
          el('span', { className: 'label-benar', teks: `✓ Benar ${h.jumlah_benar}` }), '   ',
          el('span', { className: 'label-salah', teks: `✕ Salah ${h.jumlah_salah}` })),
        h.jumlah_tidak_dijawab > 0
          ? el('p', { className: 'keterangan teks-tengah', teks: `Salah ${h.jumlah_salah}, termasuk ${h.jumlah_tidak_dijawab} tidak dijawab.` }) : null,
        el('p', { className: 'keterangan teks-tengah', teks: `Nilai tertinggimu: ${h.nilai_tertinggi ?? h.skor}.${h.sisa_percobaan > 0 ? ` Kamu masih punya ${h.sisa_percobaan} kesempatan lagi.` : ' Kedua kesempatan kuis sudah dipakai.'}` })),
      (h.nomor_salah ?? []).length > 0 ? el('div', { className: 'isi-kartu' },
        el('h2', { teks: 'Soal yang salah' }),
        el('ul', { className: 'panel-nomor' }, ...h.nomor_salah.map((n) => el('li', {},
          el('button', {
            type: 'button', className: 'tombol-nomor', 'aria-label': `Lihat soal ${n}`,
            onclick: () => {
              const d = kotakRincian[n];
              if (!d) return;
              d.open = true;
              d.scrollIntoView({ block: 'start' });
              d.querySelector('summary')?.focus();
            },
          }, String(n)))))) : null,
      el('h2', { teks: 'Rincian soal' }),
      daftarRincian,
      tautanTombol('Kembali ke Latihan', '#/latihan'),
      tautanTombol('Lihat Riwayat', '#/riwayat', { sekunder: true }),
    );
  }

  muat();
  return () => {
    aktif = false;
  };
}

/** Format jawaban isian sesuai satuan (Rupiah hanya dibulatkan saat ditampilkan, KF-09). */
function formatJawaban(nilai, satuan, kategori) {
  if (nilai === null || nilai === undefined) return '—';
  const n = Number(nilai);
  const s = satuan ?? (['besar_bunga', 'tabungan_akhir'].includes(kategori) ? 'rupiah' : null);
  if (s === 'rupiah') return formatRupiah(n);
  if (s === 'persen') return `${formatAngka(n)}% per tahun`;
  if (s) return `${formatAngka(n)} ${s}`;
  return formatAngka(n);
}

function rincianSoal(r, satuan) {
  const status = {
    benar: { teks: '✓ Benar', kelas: 'label-benar' },
    salah: { teks: '✕ Salah', kelas: 'label-salah' },
    tidak_dijawab: { teks: '✕ Tidak dijawab', kelas: 'label-salah' },
  }[r.status];
  const bentuk = r.bentuk === 'pilihan_ganda' ? 'Pilihan ganda' : 'Isian angka';
  const isi = el('div', { className: 'rincian-isi' }, el('div', { className: 'kotak-soal' }, el('p', { teks: r.teks_soal })));

  if (r.bentuk === 'pilihan_ganda') {
    // Huruf dan urutan sama persis dengan saat mengerjakan (KF-18 O6). Penanda berupa teks.
    isi.append(el('ul', { className: 'daftar-opsi' }, ...(r.opsi ?? []).map((o) => {
      const tanda = [o.kunci ? '✓ Benar' : '', o.id === r.opsi_dipilih ? '← Kamu' : ''].filter(Boolean).join(' ');
      return el('li', { className: 'opsi', 'aria-checked': o.id === r.opsi_dipilih ? 'true' : 'false' },
        el('span', { className: 'opsi-huruf', teks: o.huruf }),
        el('span', { className: 'opsi-teks', teks: o.teks }),
        el('span', { className: `opsi-tanda ${o.kunci ? 'label-benar' : ''}`, teks: tanda }));
    })));
    if (!r.opsi_dipilih) isi.append(el('p', { teks: 'Kamu tidak memilih jawaban.' }));
  } else {
    isi.append(
      el('p', { teks: `Jawabanmu: ${r.jawaban_siswa === null ? 'Tidak dijawab' : formatJawaban(r.jawaban_siswa, satuan, r.kategori_kuis)}` }),
      el('p', { teks: `Jawaban benar: ${formatJawaban(r.jawaban_benar, satuan, r.kategori_kuis)}` }),
    );
  }
  if (r.status === 'salah') {
    isi.append(el('div', { className: 'umpan-balik umpan-salah' },
      el('span', { className: 'umpan-ikon', 'aria-hidden': 'true', teks: '✕' }),
      el('span', { teks: r.pesan ?? 'Jawabanmu belum tepat. Coba periksa lagi perhitunganmu langkah demi langkah.' })));
  }
  isi.append(daftarPembahasan(r.pembahasan));

  const d = el('details', { className: 'rincian-soal' },
    el('summary', {},
      el('span', { teks: `Soal ${r.nomor} · ${bentuk}` }),
      el('span', { className: status.kelas, teks: status.teks })),
    isi);
  if (r.status !== 'benar') d.open = true; // soal yang salah terbuka lebih dulu
  return d;
}

