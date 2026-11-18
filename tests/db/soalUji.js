// Data soal KHUSUS TES database. Bukan bank soal resmi (Fase 7) dan tidak pernah tampil ke siswa.
import { sebagaiAdmin } from './bantuDb.js';

const PEMBAHASAN = [
  { langkah: 'Pahami', isi: 'Contoh pembahasan tes.' },
  { langkah: 'Rencanakan', isi: 'B = M × (p/100) × t' },
  { langkah: 'Hitung', isi: '...' },
  { langkah: 'Periksa', isi: '...' },
];

/** Soal latihan isian. M = 2.000.000, p = 6, 8 bulan → B = 80.000. */
export async function tambahSoalLatihan(db, kode, ubah = {}) {
  await sebagaiAdmin(db);
  const data = {
    kode,
    sub_materi: 'M3',
    tingkat: 2,
    teks_soal: 'Soal tes: bunga 8 bulan.',
    diketahui: { modal: 2000000, suku_bunga: 6, lama: 8, satuan_lama: 'bulan' },
    ditanya: 'bunga',
    satuan_jawaban: 'rupiah',
    jawaban: 80000,
    toleransi: 1,
    sorotan: ['Rp2.000.000', '6% per tahun', '8 bulan'],
    petunjuk: ['Petunjuk 1', 'Petunjuk 2', 'Petunjuk 3'],
    pola_kesalahan: [
      { jenis: 'SATUAN_WAKTU', nilai: 960000, pesan: 'Ubah dulu bulan ke tahun.' },
      { jenis: 'PERSEN', nilai: 8000000, pesan: 'Suku bunga dibagi 100 dulu.' },
    ],
    ...ubah,
  };
  const { rows } = await db.query(
    `insert into public.soal (kode, sub_materi, tingkat, bank, bentuk, teks_soal, diketahui, ditanya,
       satuan_jawaban, jawaban, toleransi, sorotan, petunjuk, pembahasan, pola_kesalahan)
     values ($1, $2, $3, 'latihan', 'isian', $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) returning id`,
    [
      data.kode, data.sub_materi, data.tingkat, data.teks_soal, JSON.stringify(data.diketahui),
      data.ditanya, data.satuan_jawaban, data.jawaban, data.toleransi, JSON.stringify(data.sorotan),
      JSON.stringify(data.petunjuk), JSON.stringify(PEMBAHASAN), JSON.stringify(data.pola_kesalahan),
    ],
  );
  return rows[0].id;
}

/** Opsi pilihan ganda tes: o1 kunci (80.000), o2 pengecoh SATUAN_WAKTU. */
export const OPSI_UJI = [
  { id: 'o1', teks: 'Rp80.000', nilai: 80000, kunci: true, jenis_kesalahan: null },
  { id: 'o2', teks: 'Rp960.000', nilai: 960000, kunci: false, jenis_kesalahan: 'SATUAN_WAKTU' },
  { id: 'o3', teks: 'Rp8.000.000', nilai: 8000000, kunci: false, jenis_kesalahan: 'PERSEN' },
  { id: 'o4', teks: 'Rp2.080.000', nilai: 2080000, kunci: false, jenis_kesalahan: null },
];

async function tambahSoalKuis(db, kode, kisi) {
  const pg = kisi.bentuk === 'pilihan_ganda';
  await db.query(
    `insert into public.soal (kode, sub_materi, tingkat, bank, bentuk, opsi, kategori_kuis, teks_soal,
       diketahui, ditanya, satuan_jawaban, jawaban, toleransi, pembahasan, pola_kesalahan)
     values ($1, 'M3', $2, 'kuis', $3, $4, $5, 'Soal kuis tes.', $6, 'bunga', 'rupiah', 80000, 1, $7, $8)`,
    [
      kode, kisi.tingkat, kisi.bentuk, pg ? JSON.stringify(OPSI_UJI) : null, kisi.kategori_kuis,
      JSON.stringify({ modal: 2000000, suku_bunga: 6, lama: 8, satuan_lama: 'bulan' }),
      JSON.stringify(PEMBAHASAN),
      JSON.stringify([{ jenis: 'SATUAN_WAKTU', nilai: 960000, pesan: 'Ubah dulu bulan ke tahun.' }]),
    ],
  );
}

/**
 * Mengisi bank kuis tepat sebanyak minimum KF-14: dua soal untuk setiap nomor kisi-kisi
 * (total 40). `kurangiNomor` melewatkan satu soal untuk nomor tertentu agar bank kurang.
 */
export async function isiBankKuis(db, { awalan = 'K', kurangiNomor = null } = {}) {
  await sebagaiAdmin(db);
  const { rows: kisi } = await db.query('select * from public.kisi_kisi_kuis order by nomor');
  for (const baris of kisi) {
    await tambahSoalKuis(db, `${awalan}-${baris.nomor}-a`, baris);
    if (baris.nomor !== kurangiNomor) await tambahSoalKuis(db, `${awalan}-${baris.nomor}-b`, baris);
  }
}
