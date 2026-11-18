/**
 * Data bank soal Lanora (task.md Fase 7). STATUS: DRAF — wajib diperiksa dosen/guru sebelum dipakai.
 *
 * Hanya parameter cerita dan angka yang ditulis di sini. Teks soal, kunci jawaban, pola kesalahan,
 * petunjuk, pembahasan, dan opsi dihitung oleh supabase/seed/inti/bankSoal.js.
 *
 * Bank latihan (KF-14): semua isian, ±60 soal (P0 6, M2 10, M3 12, M4 10, M5 14, M6 8).
 * Bank kuis (KF-14, KF-21): 40 soal, tepat 2 × jumlah nomor kisi-kisi untuk setiap kombinasi
 * (kategori_kuis + tingkat + bentuk). Tidak ada soal yang sama di kedua bank (S1).
 */
import { buatSoalIsian, buatSoalPilihanGanda, buatSoalPernyataan } from '../inti/bankSoal.js';

const K = (nama, tempat, barang) => ({ nama, tempat, barang });

// ---------------------------------------------------------------------------
// Bank LATIHAN
// ---------------------------------------------------------------------------
const LATIHAN = [
  // P0 pemanasan: persen dari suatu jumlah (bunga 1 tahun)
  ['P0', 1, K('Rani', 'koperasi sekolah'), 'bunga', 400000, 5, 1, 'tahun', { templat: 'p0' }],
  ['P0', 1, K('Budi', 'bank'), 'bunga', 600000, 10, 1, 'tahun', { templat: 'p0' }],
  ['P0', 2, K('Sinta', 'koperasi'), 'bunga', 1500000, 6, 1, 'tahun', { templat: 'p0' }],
  ['P0', 2, K('Dimas', 'bank desa'), 'bunga', 2400000, 4, 1, 'tahun', { templat: 'p0' }],
  ['P0', 3, K('Ayu', 'koperasi sekolah'), 'bunga', 3250000, 8, 1, 'tahun', { templat: 'p0' }],
  ['P0', 3, K('Bayu', 'bank'), 'bunga', 4500000, 7, 1, 'tahun', { templat: 'p0' }],

  // M2 rumus bunga tunggal, waktu dalam tahun
  ['M2', 1, K('Lina', 'koperasi sekolah'), 'bunga', 1000000, 5, 2, 'tahun'],
  ['M2', 1, K('Tia', 'bank'), 'bunga', 2000000, 4, 2, 'tahun'],
  ['M2', 1, K('Nina', 'koperasi'), 'bunga', 800000, 10, 3, 'tahun'],
  ['M2', 1, K('Fajar', 'bank desa'), 'bunga', 1500000, 4, 2, 'tahun'],
  ['M2', 2, K('Gita', 'bank'), 'bunga', 2500000, 6, 3, 'tahun'],
  ['M2', 2, K('Hadi', 'koperasi sekolah'), 'bunga', 3200000, 5, 4, 'tahun'],
  ['M2', 2, K('Intan', 'koperasi'), 'bunga', 1800000, 7, 2, 'tahun'],
  ['M2', 3, K('Joko', 'bank'), 'bunga', 4750000, 6, 3, 'tahun'],
  ['M2', 3, K('Kiki', 'bank desa'), 'bunga', 6400000, 4.5, 2, 'tahun'],
  ['M2', 3, K('Lukman', 'koperasi sekolah'), 'bunga', 3600000, 7.5, 4, 'tahun'],

  // M3 waktu dalam bulan dan hari
  ['M3', 1, K('Maya', 'koperasi sekolah'), 'bunga', 1200000, 6, 6, 'bulan'],
  ['M3', 1, K('Nanda', 'bank'), 'bunga', 2400000, 5, 3, 'bulan'],
  ['M3', 1, K('Oki', 'koperasi'), 'bunga', 1800000, 4, 6, 'bulan'],
  ['M3', 1, K('Putri', 'bank desa'), 'bunga', 3000000, 6, 4, 'bulan'],
  ['M3', 2, K('Raka', 'bank'), 'bunga', 2500000, 6, 9, 'bulan'],
  ['M3', 2, K('Salsa', 'koperasi sekolah'), 'bunga', 3600000, 5, 8, 'bulan'],
  ['M3', 2, K('Tono', 'koperasi'), 'bunga', 4200000, 6, 10, 'bulan'],
  ['M3', 2, K('Umi', 'bank'), 'bunga', 2000000, 9, 18, 'bulan'],
  ['M3', 3, K('Vina', 'bank desa'), 'bunga', 3650000, 6, 73, 'hari'],
  ['M3', 3, K('Wahyu', 'bank'), 'bunga', 1825000, 8, 146, 'hari'],
  ['M3', 3, K('Yoga', 'koperasi'), 'bunga', 7300000, 5, 219, 'hari'],
  ['M3', 3, K('Zahra', 'bank'), 'bunga', 5475000, 4, 292, 'hari'],

  // M4 jumlah tabungan akhir
  ['M4', 1, K('Rani', 'bank'), 'tabungan_akhir', 1000000, 6, 2, 'tahun'],
  ['M4', 1, K('Budi', 'koperasi sekolah'), 'tabungan_akhir', 2000000, 5, 1, 'tahun'],
  ['M4', 1, K('Sinta', 'bank desa'), 'tabungan_akhir', 1500000, 4, 3, 'tahun'],
  ['M4', 2, K('Dimas', 'koperasi'), 'tabungan_akhir', 1200000, 10, 6, 'bulan'],
  ['M4', 2, K('Ayu', 'bank'), 'tabungan_akhir', 2400000, 6, 8, 'bulan'],
  ['M4', 2, K('Bayu', 'koperasi sekolah'), 'tabungan_akhir', 3000000, 8, 3, 'bulan'],
  ['M4', 2, K('Lina', 'bank desa'), 'tabungan_akhir', 1800000, 5, 4, 'bulan'],
  ['M4', 3, K('Tia', 'bank'), 'tabungan_akhir', 3650000, 8, 146, 'hari'],
  ['M4', 3, K('Nina', 'koperasi'), 'tabungan_akhir', 4500000, 6, 15, 'bulan'],
  ['M4', 3, K('Fajar', 'bank', 'laptop'), 'tabungan_akhir', 2920000, 5, 73, 'hari', { templat: 'beli' }],

  // M5 mencari modal awal, suku bunga, atau lama menabung
  ['M5', 1, K('Gita', 'koperasi sekolah'), 'modal', 1000000, 5, 2, 'tahun'],
  ['M5', 1, K('Hadi', 'bank'), 'suku_bunga', 1500000, 4, 2, 'tahun'],
  ['M5', 1, K('Intan', 'koperasi'), 'lama', 1000000, 10, 3, 'tahun'],
  ['M5', 1, K('Joko', 'bank desa'), 'modal', 2500000, 4, 3, 'tahun'],
  ['M5', 1, K('Kiki', 'bank'), 'suku_bunga', 3000000, 5, 4, 'tahun'],
  ['M5', 2, K('Lukman', 'koperasi sekolah'), 'modal', 2400000, 6, 8, 'bulan'],
  ['M5', 2, K('Maya', 'bank'), 'suku_bunga', 1200000, 7, 6, 'bulan'],
  ['M5', 2, K('Nanda', 'koperasi'), 'lama', 2000000, 6, 9, 'bulan'],
  ['M5', 2, K('Oki', 'bank desa'), 'lama', 1800000, 8, 6, 'bulan'],
  ['M5', 2, K('Putri', 'bank'), 'modal', 3000000, 9, 4, 'bulan'],
  ['M5', 3, K('Raka', 'koperasi'), 'modal', 2000000, 6, 6, 'bulan', { dari: 'tabungan_akhir' }],
  ['M5', 3, K('Salsa', 'bank'), 'suku_bunga', 2500000, 8, 9, 'bulan', { dari: 'tabungan_akhir' }],
  ['M5', 3, K('Tono', 'koperasi sekolah'), 'lama', 2400000, 5, 15, 'bulan', { dari: 'tabungan_akhir' }],
  ['M5', 3, K('Umi', 'bank desa'), 'lama', 3650000, 10, 73, 'hari', { dari: 'tabungan_akhir' }],

  // M6 strategi soal cerita (penerapan sehari-hari)
  ['M6', 1, K('Gita', 'koperasi sekolah', 'sepatu'), 'tabungan_akhir', 900000, 10, 1, 'tahun', { templat: 'beli' }],
  ['M6', 1, K('Vina', 'koperasi sekolah'), 'bunga', 1000000, 6, 6, 'bulan'],
  ['M6', 2, K('Wahyu', 'bank', 'sepeda'), 'lama', 2000000, 6, 9, 'bulan', { templat: 'beli', dari: 'tabungan_akhir' }],
  ['M6', 2, K('Yoga', 'koperasi', 'tas sekolah'), 'modal', 1250000, 8, 6, 'bulan', { templat: 'beli', dari: 'tabungan_akhir' }],
  ['M6', 2, K('Zahra', 'bank', 'ponsel'), 'tabungan_akhir', 1800000, 6, 8, 'bulan', { templat: 'beli' }],
  ['M6', 3, K('Rani', 'bank', 'laptop'), 'lama', 3650000, 8, 146, 'hari', { templat: 'beli', dari: 'tabungan_akhir' }],
  ['M6', 3, K('Budi', 'koperasi', 'kamera'), 'modal', 4000000, 7.5, 18, 'bulan', { templat: 'beli', dari: 'tabungan_akhir' }],
  ['M6', 3, K('Sinta', 'bank desa', 'gitar'), 'lama', 2400000, 6, 15, 'bulan', { templat: 'beli', dari: 'tabungan_akhir' }],
];

function kodeBerurutan(daftar, buatKode) {
  const nomor = {};
  return daftar.map((d) => {
    const awal = buatKode(d);
    nomor[awal] = (nomor[awal] ?? 0) + 1;
    return `${awal}-${String(nomor[awal]).padStart(2, '0')}`;
  });
}

const kodeLatihan = kodeBerurutan(LATIHAN, ([sub, tingkat]) => `${sub}-T${tingkat}`);

export const SOAL_LATIHAN = LATIHAN.map(([sub, tingkat, konteks, ditanya, modal, p, lama, satuan, lain = {}], i) =>
  buatSoalIsian({
    kode: kodeLatihan[i], sub, tingkat, bank: 'latihan', konteks, ditanya, modal, p, lama, satuan, ...lain,
  }));

// ---------------------------------------------------------------------------
// Bank KUIS
// ---------------------------------------------------------------------------
const SUB_KATEGORI = {
  konsep: 'M1', besar_bunga: 'M3', tabungan_akhir: 'M4', modal_suku_bunga: 'M5', lama_menabung: 'M5', penerapan: 'M6',
};
const SINGKAT = {
  konsep: 'KONSEP', besar_bunga: 'BUNGA', tabungan_akhir: 'AKHIR', modal_suku_bunga: 'MODALP', lama_menabung: 'LAMA', penerapan: 'TERAP',
};

/** [kategori, tingkat, bentuk, konteks, ditanya, modal, p, lama, satuan, lain] */
const KUIS_HITUNG = [
  ['besar_bunga', 1, 'pg', K('Joko', 'bank'), 'bunga', 2000000, 5, 2, 'tahun', { sub: 'M2' }],
  ['besar_bunga', 1, 'pg', K('Maya', 'koperasi'), 'bunga', 1200000, 8, 1, 'tahun', { sub: 'M2' }],
  ['tabungan_akhir', 1, 'pg', K('Raka', 'bank desa'), 'tabungan_akhir', 1000000, 8, 2, 'tahun'],
  ['tabungan_akhir', 1, 'pg', K('Salsa', 'koperasi sekolah'), 'tabungan_akhir', 2500000, 4, 1, 'tahun'],
  ['modal_suku_bunga', 1, 'pg', K('Tono', 'bank'), 'suku_bunga', 2000000, 5, 2, 'tahun'],
  ['modal_suku_bunga', 1, 'pg', K('Umi', 'koperasi'), 'modal', 1200000, 10, 1, 'tahun'],
  ['lama_menabung', 1, 'pg', K('Vina', 'koperasi sekolah'), 'lama', 1000000, 6, 2, 'tahun'],
  ['lama_menabung', 1, 'pg', K('Wahyu', 'bank'), 'lama', 2000000, 5, 3, 'tahun'],

  ['besar_bunga', 2, 'pg', K('Yoga', 'koperasi'), 'bunga', 1800000, 6, 8, 'bulan'],
  ['besar_bunga', 2, 'pg', K('Zahra', 'bank'), 'bunga', 2400000, 7, 6, 'bulan'],
  ['besar_bunga', 2, 'pg', K('Rani', 'bank desa'), 'bunga', 3000000, 5, 9, 'bulan'],
  ['besar_bunga', 2, 'pg', K('Budi', 'koperasi sekolah'), 'bunga', 1200000, 9, 4, 'bulan'],
  ['tabungan_akhir', 2, 'pg', K('Sinta', 'bank'), 'tabungan_akhir', 1500000, 6, 8, 'bulan'],
  ['tabungan_akhir', 2, 'pg', K('Dimas', 'koperasi'), 'tabungan_akhir', 2000000, 9, 4, 'bulan'],
  ['tabungan_akhir', 2, 'pg', K('Ayu', 'bank desa'), 'tabungan_akhir', 3600000, 5, 6, 'bulan'],
  ['tabungan_akhir', 2, 'pg', K('Bayu', 'koperasi sekolah'), 'tabungan_akhir', 2400000, 8, 3, 'bulan'],
  ['modal_suku_bunga', 2, 'pg', K('Lina', 'bank'), 'modal', 1600000, 6, 9, 'bulan'],
  ['modal_suku_bunga', 2, 'pg', K('Tia', 'koperasi'), 'suku_bunga', 2000000, 9, 8, 'bulan'],
  ['penerapan', 2, 'pg', K('Nina', 'koperasi sekolah', 'sepeda'), 'lama', 1200000, 10, 6, 'bulan', { templat: 'beli', dari: 'tabungan_akhir' }],
  ['penerapan', 2, 'pg', K('Fajar', 'bank', 'ponsel'), 'tabungan_akhir', 2200000, 6, 9, 'bulan', { templat: 'beli' }],
  ['modal_suku_bunga', 3, 'pg', K('Gita', 'bank desa'), 'modal', 3000000, 8, 9, 'bulan', { dari: 'tabungan_akhir' }],
  ['modal_suku_bunga', 3, 'pg', K('Hadi', 'bank'), 'suku_bunga', 3650000, 6, 73, 'hari', { dari: 'tabungan_akhir' }],
  ['penerapan', 3, 'pg', K('Intan', 'bank', 'laptop'), 'lama', 7300000, 5, 146, 'hari', { templat: 'beli', dari: 'tabungan_akhir' }],
  ['penerapan', 3, 'pg', K('Joko', 'koperasi', 'sepeda motor listrik'), 'modal', 2500000, 6, 18, 'bulan', { templat: 'beli', dari: 'tabungan_akhir' }],

  ['lama_menabung', 2, 'isian', K('Kiki', 'bank'), 'lama', 2400000, 6, 9, 'bulan'],
  ['lama_menabung', 2, 'isian', K('Lukman', 'koperasi'), 'lama', 3000000, 8, 3, 'bulan'],
  ['besar_bunga', 2, 'isian', K('Maya', 'bank desa'), 'bunga', 2700000, 8, 4, 'bulan'],
  ['besar_bunga', 2, 'isian', K('Nanda', 'koperasi sekolah'), 'bunga', 1500000, 6, 10, 'bulan'],
  ['modal_suku_bunga', 2, 'isian', K('Oki', 'bank'), 'suku_bunga', 1800000, 7, 6, 'bulan'],
  ['modal_suku_bunga', 2, 'isian', K('Putri', 'koperasi'), 'modal', 2800000, 6, 6, 'bulan'],
  ['besar_bunga', 3, 'isian', K('Raka', 'bank'), 'bunga', 2190000, 10, 73, 'hari'],
  ['besar_bunga', 3, 'isian', K('Salsa', 'bank desa'), 'bunga', 1460000, 5, 292, 'hari'],
  ['tabungan_akhir', 3, 'isian', K('Tono', 'koperasi sekolah'), 'tabungan_akhir', 1825000, 6, 219, 'hari'],
  ['tabungan_akhir', 3, 'isian', K('Umi', 'bank'), 'tabungan_akhir', 4800000, 7.5, 15, 'bulan'],
];

/** Soal konsep (pernyataan). Kunci ditandai langsung; pembahasan 4 langkah. */
const KUIS_KONSEP = [
  {
    tingkat: 1,
    teks: 'Pada soal tabungan, apa arti modal awal (M)?',
    opsi: [
      { teks: 'Uang yang pertama kali ditabung', kunci: true },
      { teks: 'Tambahan uang dari bank atau koperasi' },
      { teks: 'Uang di tabungan setelah ditambah bunga' },
      { teks: 'Persen bunga dalam satu tahun' },
    ],
    pembahasan: [
      'Pertanyaan ini menanyakan arti simbol M.',
      'Ingat lima istilah: M modal awal, B besar bunga, p suku bunga per tahun, t lama menabung, A jumlah tabungan akhir.',
      'M adalah uang yang pertama kali ditabung, sebelum ada bunga.',
      'Tambahan uang adalah B, dan uang setelah ditambah bunga adalah jumlah tabungan akhir (A). Jadi jawabannya tepat.',
    ],
  },
  {
    tingkat: 1,
    teks: 'Suku bunga sebuah koperasi 6% per tahun. Bagaimana suku bunga ini dimasukkan ke rumus B = M × (p/100) × t?',
    opsi: [
      { teks: 'p = 6, lalu dibagi 100 menjadi (6/100)', kunci: true },
      { teks: 'p = 0,6' },
      { teks: 'p = 60' },
      { teks: 'p = 6, tanpa dibagi 100' },
    ],
    pembahasan: [
      'Yang ditanya: cara menulis suku bunga 6% di rumus.',
      'Di rumus, suku bunga ditulis sebagai angka persennya (p = 6), lalu dibagi 100.',
      '6% = 6/100 = 0,06, jadi bagian rumusnya (p/100) = (6/100).',
      'Jika p tidak dibagi 100, bunganya menjadi 100 kali terlalu besar. Jadi jawabannya tepat.',
    ],
  },
  {
    tingkat: 1,
    teks: 'Pada bunga tunggal, bunga setiap tahun dihitung dari apa?',
    opsi: [
      { teks: 'Dari modal awal saja', kunci: true },
      { teks: 'Dari jumlah tabungan akhir tahun sebelumnya' },
      { teks: 'Dari bunga tahun sebelumnya' },
      { teks: 'Dari suku bunga saja, tanpa modal' },
    ],
    pembahasan: [
      'Yang ditanya: dasar perhitungan bunga tunggal.',
      'Rumus bunga tunggal B = M × (p/100) × t hanya memakai modal awal M.',
      'Karena dasarnya selalu M, bunga setiap tahun sama besar.',
      'Jika bunga dihitung dari tabungan akhir tahun sebelumnya, itu bukan bunga tunggal. Jadi jawabannya tepat.',
    ],
  },
  {
    tingkat: 1,
    teks: 'Apa yang dimaksud dengan jumlah tabungan akhir (A)?',
    opsi: [
      { teks: 'Modal awal ditambah besar bunga', kunci: true },
      { teks: 'Modal awal dikurangi besar bunga' },
      { teks: 'Besar bunga saja' },
      { teks: 'Modal awal dikali suku bunga' },
    ],
    pembahasan: [
      'Yang ditanya: arti jumlah tabungan akhir (A).',
      'Rumusnya A = M + B.',
      'Jadi jumlah tabungan akhir = modal awal + besar bunga.',
      'Jumlah tabungan akhir selalu lebih besar dari modal awal jika ada bunga. Jadi jawabannya tepat.',
    ],
  },
  {
    tingkat: 2,
    teks: 'Lama menabung 8 bulan. Nilai t yang dimasukkan ke rumus B = M × (p/100) × t adalah ....',
    opsi: [
      { teks: 't = 8/12', kunci: true },
      { teks: 't = 8' },
      { teks: 't = 8/365' },
      { teks: 't = 12/8' },
    ],
    pembahasan: [
      'Yang ditanya: nilai t untuk lama menabung 8 bulan.',
      'Suku bunga per tahun, jadi t harus dalam tahun. 1 tahun = 12 bulan.',
      't = banyak bulan ÷ 12 = 8/12 tahun.',
      'Memakai t = 8 membuat bunga 12 kali terlalu besar. Jadi jawabannya tepat.',
    ],
  },
  {
    tingkat: 2,
    teks: 'Modal awal Rp1.000.000 dengan suku bunga 10% per tahun (bunga tunggal). Pernyataan mana yang benar?',
    opsi: [
      { teks: 'Bunganya bertambah Rp100.000 setiap tahun', kunci: true },
      { teks: 'Bunga tahun kedua lebih besar daripada bunga tahun pertama' },
      { teks: 'Bunga tahun kedua Rp110.000' },
      { teks: 'Bunga hanya diberikan pada tahun pertama' },
    ],
    pembahasan: [
      'Yang ditanya: sifat bunga tunggal untuk M = Rp1.000.000 dan p = 10.',
      'Bunga 1 tahun = M × (p/100) × 1.',
      'B = 1.000.000 × (10/100) × 1 = Rp100.000 setiap tahun.',
      'Pada bunga tunggal, bunga dihitung dari modal awal saja, jadi bunga setiap tahun sama. Jadi jawabannya tepat.',
    ],
  },
];

const kodeKuis = kodeBerurutan(
  [...KUIS_KONSEP.map((k) => ['konsep', k.tingkat, 'pg']), ...KUIS_HITUNG],
  ([kategori, tingkat, bentuk]) => `KU-${SINGKAT[kategori]}-T${tingkat}-${bentuk === 'isian' ? 'IS' : 'PG'}`,
);

export const SOAL_KUIS = [
  ...KUIS_KONSEP.map((k, i) => buatSoalPernyataan({
    kode: kodeKuis[i], sub: 'M1', tingkat: k.tingkat, teks: k.teks, opsi: k.opsi, pembahasan: k.pembahasan,
  })),
  ...KUIS_HITUNG.map(([kategori, tingkat, bentuk, konteks, ditanya, modal, p, lama, satuan, lain = {}], i) => {
    const kode = kodeKuis[KUIS_KONSEP.length + i];
    const spek = {
      kode, sub: lain.sub ?? SUB_KATEGORI[kategori], tingkat, bank: 'kuis', kategori, konteks, ditanya,
      modal, p, lama, satuan, dari: lain.dari, templat: lain.templat,
    };
    return bentuk === 'isian' ? buatSoalIsian(spek) : buatSoalPilihanGanda(spek, { letakKunci: i });
  }),
];

export const SEMUA_SOAL = [...SOAL_LATIHAN, ...SOAL_KUIS];
