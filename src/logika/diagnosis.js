/**
 * Diagnosis kesalahan umum (docs/PRD.md F-09; docs/api.md bagian 5.3).
 *
 * Dipakai skrip seed (Fase 7) untuk mengisi kolom `jawaban` dan `pola_kesalahan`
 * pada tabel `soal`. Fungsi SQL `periksa_jawaban` cukup membandingkan angka dengan
 * nilai-nilai ini, tanpa menghitung ulang rumus (docs/architecture.md bagian 4).
 *
 * Bentuk `soal` mengikuti kolom tabel `soal` (docs/architecture.md bagian 6):
 * {
 *   diketahui: { modal, suku_bunga, lama, satuan_lama, bunga, tabungan_akhir }, // isi yang ada saja
 *   ditanya: 'bunga' | 'tabungan_akhir' | 'modal' | 'suku_bunga' | 'lama',
 *   satuan_jawaban: 'rupiah' | 'persen' | 'tahun' | 'bulan' | 'hari'   // wajib jika ditanya 'lama'
 * }
 */
import {
  HARI_PER_TAHUN,
  bungaDariTabunganAkhir,
  cariLama,
  cariModal,
  cariModalDariTabunganAkhir,
  cariSukuBunga,
  hitungBunga,
  hitungTabunganAkhir,
  keTahun,
  ubahSatuanWaktu,
} from './bungaTunggal.js';
import { GalatMasukan } from './galat.js';
import { formatAngka, formatRupiah } from './parserAngka.js';

export const JENIS_KESALAHAN = Object.freeze({
  SATUAN_WAKTU: 'SATUAN_WAKTU',
  PERSEN: 'PERSEN',
  TERTUKAR_BUNGA_TABUNGAN: 'TERTUKAR_BUNGA_TABUNGAN',
  RUMUS_INVERS: 'RUMUS_INVERS',
  LAINNYA: 'LAINNYA',
});

export const DITANYA = Object.freeze(['bunga', 'tabungan_akhir', 'modal', 'suku_bunga', 'lama']);

/** Toleransi bawaan saat membandingkan nilai (sama dengan kolom `soal.toleransi`). */
export const TOLERANSI_BAWAAN = 0.5;

/** Pesan untuk jawaban salah yang tidak cocok dengan pola mana pun. */
export const PESAN_LAINNYA =
  'Jawabanmu belum tepat. Coba periksa lagi perhitunganmu langkah demi langkah.';

// Diagnosis selalu memakai HARI_PER_TAHUN bawaan (KF-02: 1 tahun = 365 hari, diputuskan).
const PENYEBUT_TAMPIL = { bulan: '12', hari: String(HARI_PER_TAHUN) };

/** Membuang sisa galat pembulatan biner, misalnya 166666.66666666666 → 166666.666667. */
function rapikan(nilai) {
  return Math.round(nilai * 1e6) / 1e6;
}

/** Membaca diketahui dari soal dan mengubah nama kolom ke nama fungsi rumus. */
function bacaSoal(soal) {
  if (!soal || typeof soal !== 'object' || !soal.diketahui || typeof soal.diketahui !== 'object') {
    throw new GalatMasukan('BUKAN_ANGKA', 'Data soal belum lengkap: bagian "diketahui" belum diisi.');
  }
  if (!DITANYA.includes(soal.ditanya)) {
    throw new GalatMasukan(
      'DITANYA_TIDAK_DIKENAL',
      `Jenis yang ditanya "${soal.ditanya}" tidak dikenal. Gunakan: ${DITANYA.join(', ')}.`,
    );
  }
  const d = soal.diketahui;
  return {
    ditanya: soal.ditanya,
    satuanJawaban: soal.satuan_jawaban,
    modal: d.modal,
    sukuBunga: d.suku_bunga,
    lama: d.lama,
    satuan: d.satuan_lama,
    bunga: d.bunga,
    tabunganAkhir: d.tabungan_akhir,
  };
}

function adaNilai(nilai) {
  return nilai !== undefined && nilai !== null;
}

function pastikanSatuanJawabanLama(satuanJawaban) {
  if (!['tahun', 'bulan', 'hari'].includes(satuanJawaban)) {
    throw new GalatMasukan(
      'SATUAN_TIDAK_DIKENAL',
      'Untuk soal yang menanyakan lama menabung, satuan_jawaban harus tahun, bulan, atau hari.',
    );
  }
}

/**
 * Bunga yang diketahui pada soal mencari suku bunga atau lama.
 * Jika soal memberi tabungan akhir (bukan bunga), bunga = tabungan akhir − modal.
 */
function bungaDiketahui(s) {
  if (adaNilai(s.bunga)) return s.bunga;
  return bungaDariTabunganAkhir({ tabunganAkhir: s.tabunganAkhir, modal: s.modal });
}

/**
 * Menghitung kunci jawaban sebuah soal.
 * @param {object} soal lihat keterangan di atas
 * @returns {number} belum dibulatkan untuk tampilan (KF-09)
 */
export function hitungJawaban(soal) {
  const s = bacaSoal(soal);
  const waktu = { lama: s.lama, satuan: s.satuan };

  switch (s.ditanya) {
    case 'bunga':
      return rapikan(hitungBunga({ modal: s.modal, sukuBunga: s.sukuBunga, ...waktu }));
    case 'tabungan_akhir':
      return rapikan(hitungTabunganAkhir({ modal: s.modal, sukuBunga: s.sukuBunga, ...waktu }));
    case 'modal':
      if (adaNilai(s.bunga)) {
        return rapikan(cariModal({ bunga: s.bunga, sukuBunga: s.sukuBunga, ...waktu }));
      }
      return rapikan(
        cariModalDariTabunganAkhir({ tabunganAkhir: s.tabunganAkhir, sukuBunga: s.sukuBunga, ...waktu }),
      );
    case 'suku_bunga':
      return rapikan(cariSukuBunga({ bunga: bungaDiketahui(s), modal: s.modal, ...waktu }));
    case 'lama':
      pastikanSatuanJawabanLama(s.satuanJawaban);
      return rapikan(
        cariLama({
          bunga: bungaDiketahui(s),
          modal: s.modal,
          sukuBunga: s.sukuBunga,
          satuanHasil: s.satuanJawaban,
        }),
      );
    default:
      // tidak mungkin terjadi karena sudah diperiksa di bacaSoal
      throw new GalatMasukan('DITANYA_TIDAK_DIKENAL', 'Jenis yang ditanya tidak dikenal.');
  }
}

// ---------------------------------------------------------------------------
// Pesan
// ---------------------------------------------------------------------------

function pesanSatuanWaktu(s) {
  const lama = formatAngka(s.lama);
  return `Lama menabung dalam ${s.satuan}. Ubah dulu ke tahun: ${lama} ${s.satuan} = ${lama}/${PENYEBUT_TAMPIL[s.satuan]} tahun.`;
}

function pesanPersen(s) {
  const p = formatAngka(s.sukuBunga);
  return `Ingat, suku bunga ${p}% ditulis p/100 = ${p}/100 di dalam rumus.`;
}

// ---------------------------------------------------------------------------
// Pola kesalahan per jenis yang ditanya
// ---------------------------------------------------------------------------

function polaBungaAtauTabungan(s) {
  const pola = [];
  const tambahModal = s.ditanya === 'tabungan_akhir' ? s.modal : 0;
  const bungaBenar = hitungBunga({ modal: s.modal, sukuBunga: s.sukuBunga, lama: s.lama, satuan: s.satuan });

  if (s.satuan !== 'tahun') {
    const bungaSalah = hitungBunga({ modal: s.modal, sukuBunga: s.sukuBunga, lama: s.lama, satuan: 'tahun' });
    pola.push({ jenis: JENIS_KESALAHAN.SATUAN_WAKTU, nilai: tambahModal + bungaSalah, pesan: pesanSatuanWaktu(s) });
  }

  // Lupa membagi 100: hasilnya 100 kali bunga yang benar
  pola.push({ jenis: JENIS_KESALAHAN.PERSEN, nilai: tambahModal + bungaBenar * 100, pesan: pesanPersen(s) });

  if (s.ditanya === 'bunga') {
    pola.push({
      jenis: JENIS_KESALAHAN.TERTUKAR_BUNGA_TABUNGAN,
      nilai: s.modal + bungaBenar,
      pesan: 'Yang ditanya adalah besar bunga (B) saja. Jumlah tabungan akhir (A) = M + B, jadi bunganya jangan ditambah modal awal.',
    });
  } else {
    pola.push({
      jenis: JENIS_KESALAHAN.TERTUKAR_BUNGA_TABUNGAN,
      nilai: bungaBenar,
      pesan: 'Yang ditanya adalah jumlah tabungan akhir (A), yaitu A = M + B.',
    });
  }
  return pola;
}

function polaModal(s) {
  const pola = [];
  const waktuSalah = { lama: s.lama, satuan: 'tahun' };

  const tahun = keTahun(s.lama, s.satuan);

  if (adaNilai(s.bunga)) {
    pola.push({
      jenis: JENIS_KESALAHAN.RUMUS_INVERS,
      nilai: hitungBunga({ modal: s.bunga, sukuBunga: s.sukuBunga, lama: s.lama, satuan: s.satuan }),
      pesan: 'Untuk mencari modal awal, bagi besar bunga dengan ((p/100) × t), jangan dikalikan.',
    });
    if (s.satuan !== 'tahun') {
      pola.push({
        jenis: JENIS_KESALAHAN.SATUAN_WAKTU,
        nilai: cariModal({ bunga: s.bunga, sukuBunga: s.sukuBunga, ...waktuSalah }),
        pesan: pesanSatuanWaktu(s),
      });
    }
    // Lupa membagi 100: M = B ÷ (p × t)
    pola.push({ jenis: JENIS_KESALAHAN.PERSEN, nilai: s.bunga / (s.sukuBunga * tahun), pesan: pesanPersen(s) });
    return pola;
  }

  // Diketahui tabungan akhir
  const Ma = s.tabunganAkhir;
  pola.push({
    jenis: JENIS_KESALAHAN.TERTUKAR_BUNGA_TABUNGAN,
    nilai: cariModal({ bunga: Ma, sukuBunga: s.sukuBunga, lama: s.lama, satuan: s.satuan }),
    pesan: `Pada soal, ${formatRupiah(Ma)} adalah jumlah tabungan akhir (A), bukan besar bunga. Karena A = M + B, modal awal M = A ÷ (1 + (p/100) × t).`,
  });
  pola.push({
    jenis: JENIS_KESALAHAN.RUMUS_INVERS,
    nilai: Ma - hitungBunga({ modal: Ma, sukuBunga: s.sukuBunga, lama: s.lama, satuan: s.satuan }),
    pesan: 'Bunga dihitung dari modal awal, bukan dari jumlah tabungan akhir. Gunakan M = A ÷ (1 + (p/100) × t).',
  });
  if (s.satuan !== 'tahun') {
    pola.push({
      jenis: JENIS_KESALAHAN.SATUAN_WAKTU,
      nilai: cariModalDariTabunganAkhir({ tabunganAkhir: Ma, sukuBunga: s.sukuBunga, ...waktuSalah }),
      pesan: pesanSatuanWaktu(s),
    });
  }
  pola.push({ jenis: JENIS_KESALAHAN.PERSEN, nilai: Ma / (1 + s.sukuBunga * tahun), pesan: pesanPersen(s) });
  return pola;
}

function polaSukuBunga(s) {
  const pola = [];
  const bunga = bungaDiketahui(s);
  const benar = cariSukuBunga({ bunga, modal: s.modal, lama: s.lama, satuan: s.satuan });

  pola.push({
    jenis: JENIS_KESALAHAN.PERSEN,
    nilai: benar / 100,
    pesan: 'Hasil baginya masih berupa pecahan. Kalikan dengan 100 agar menjadi persen: p = (B × 100) ÷ (M × t).',
  });
  if (s.satuan !== 'tahun') {
    pola.push({
      jenis: JENIS_KESALAHAN.SATUAN_WAKTU,
      nilai: cariSukuBunga({ bunga, modal: s.modal, lama: s.lama, satuan: 'tahun' }),
      pesan: pesanSatuanWaktu(s),
    });
  }
  pola.push({
    jenis: JENIS_KESALAHAN.RUMUS_INVERS,
    nilai: (bunga / s.modal) * 100,
    pesan: 'Untuk mencari suku bunga, gunakan p = (B × 100) ÷ (M × t). Jangan lupa membagi dengan lama menabung.',
  });
  if (!adaNilai(s.bunga)) {
    pola.push({
      jenis: JENIS_KESALAHAN.TERTUKAR_BUNGA_TABUNGAN,
      nilai: cariSukuBunga({ bunga: s.tabunganAkhir, modal: s.modal, lama: s.lama, satuan: s.satuan }),
      pesan: `Pada soal, ${formatRupiah(s.tabunganAkhir)} adalah jumlah tabungan akhir (A), bukan besar bunga. Cari bunganya dulu: B = A − M.`,
    });
  }
  return pola;
}

function polaLama(s) {
  const pola = [];
  const bunga = bungaDiketahui(s);
  const satuanJawaban = s.satuanJawaban;
  const lamaDalam = (satuanHasil, b = bunga) =>
    cariLama({ bunga: b, modal: s.modal, sukuBunga: s.sukuBunga, satuanHasil });

  // Menjawab dalam satuan yang tidak diminta
  const satuanLain = satuanJawaban === 'tahun' ? 'bulan' : 'tahun';
  pola.push({
    jenis: JENIS_KESALAHAN.SATUAN_WAKTU,
    nilai: lamaDalam(satuanLain),
    pesan:
      satuanJawaban === 'tahun'
        ? 'Perhatikan satuan yang ditanya. Jawaban diminta dalam tahun, bukan bulan.'
        : `Perhatikan satuan yang ditanya. Jawaban diminta dalam ${satuanJawaban}. Ubah hasil dalam tahun ke ${satuanJawaban}.`,
  });

  // Lupa membagi 100: t = B ÷ (M × p)
  pola.push({ jenis: JENIS_KESALAHAN.PERSEN, nilai: lamaDalam(satuanJawaban) / 100, pesan: pesanPersen(s) });

  // Pecahan terbalik: (M × p%) ÷ B tahun, lalu diubah ke satuan jawaban
  if (bunga > 0) {
    const lamaTahun = lamaDalam('tahun');
    const terbalikTahun = 1 / lamaTahun;
    pola.push({
      jenis: JENIS_KESALAHAN.RUMUS_INVERS,
      nilai: ubahSatuanWaktu(terbalikTahun, 'tahun', satuanJawaban),
      pesan: 'Untuk mencari lama menabung, gunakan t = (B × 100) ÷ (M × p), jangan dibalik.',
    });
  }

  if (!adaNilai(s.bunga)) {
    pola.push({
      jenis: JENIS_KESALAHAN.TERTUKAR_BUNGA_TABUNGAN,
      nilai: lamaDalam(satuanJawaban, s.tabunganAkhir),
      pesan: `Pada soal, ${formatRupiah(s.tabunganAkhir)} adalah jumlah tabungan akhir (A), bukan besar bunga. Cari bunganya dulu: B = A − M.`,
    });
  }
  return pola;
}

/**
 * Menghitung nilai jawaban yang muncul jika siswa melakukan kesalahan umum.
 * Pola yang nilainya sama dengan jawaban benar, sama dengan pola sebelumnya,
 * atau bukan angka yang wajar, dibuang agar diagnosis tidak ambigu.
 *
 * Toleransi diambil dari `soal.toleransi` jika ada. Untuk soal persen atau lama menabung,
 * toleransi 0,5 bisa terlalu besar (0,06 dan 0,5 dianggap sama), jadi isi toleransi yang
 * lebih kecil pada soal seperti itu.
 *
 * @param {object} soal
 * @param {object} [opsi]
 * @param {number} [opsi.toleransi] default: soal.toleransi, lalu TOLERANSI_BAWAAN
 * @returns {Array<{jenis: string, nilai: number, pesan: string}>}
 */
export function hitungPolaKesalahan(soal, { toleransi = soal?.toleransi ?? TOLERANSI_BAWAAN } = {}) {
  const jawaban = hitungJawaban(soal); // sekaligus memvalidasi data soal
  const s = bacaSoal(soal);

  let pola;
  if (s.ditanya === 'bunga' || s.ditanya === 'tabungan_akhir') pola = polaBungaAtauTabungan(s);
  else if (s.ditanya === 'modal') pola = polaModal(s);
  else if (s.ditanya === 'suku_bunga') pola = polaSukuBunga(s);
  else pola = polaLama(s);

  const hasil = [];
  for (const p of pola) {
    if (!Number.isFinite(p.nilai) || p.nilai < 0) continue;
    const nilai = rapikan(p.nilai);
    if (Math.abs(nilai - jawaban) <= toleransi) continue;
    if (hasil.some((h) => Math.abs(h.nilai - nilai) <= toleransi)) continue;
    hasil.push({ jenis: p.jenis, nilai, pesan: p.pesan });
  }
  return hasil;
}
