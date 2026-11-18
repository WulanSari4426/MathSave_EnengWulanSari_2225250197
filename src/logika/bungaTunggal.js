/**
 * Rumus bunga tunggal dan tabungan (docs/PRD.md F-02, F-04; docs/api.md bagian 5.1).
 *
 * SATU-SATUNYA tempat rumus ditulis (AGENTS.md bagian 6). Modul ini murni:
 * tidak mengakses DOM, jaringan, atau Supabase.
 *
 * Notasi (AS-05, notasi akhir menunggu KF-03):
 *   M = modal, p = suku bunga (% per TAHUN, AS-04), t = lama menabung dalam tahun
 *   B = M × p/100 × t
 *   Tabungan akhir = M + B
 *
 * Ketepatan hitung:
 *   Lama menabung disimpan sebagai pecahan (lama / penyebut), misalnya 8 bulan = 8/12 tahun.
 *   Perkalian dikerjakan dulu, pembagian terakhir, agar hasil seperti 80.000 tidak menjadi
 *   80.000,00000001. Hasil TIDAK dibulatkan; pembulatan hanya saat ditampilkan (KF-09).
 */
import { GalatMasukan } from './galat.js';

/**
 * Jumlah hari dalam 1 tahun.
 * KF-02: 1 tahun = 365 hari (diputuskan 12 November 2026). Opsi `hariPerTahun` tetap ada
 * untuk tes, tetapi kode aplikasi tidak boleh mengirim nilai lain (AGENTS.md §6).
 */
export const HARI_PER_TAHUN = 365;

/** Satuan lama menabung yang didukung. */
export const SATUAN_WAKTU = Object.freeze(['tahun', 'bulan', 'hari']);

/** Jumlah baris maksimal tabel pertumbuhan (docs/design.md bagian 8: maksimal 24 tumpukan). */
export const MAKS_BARIS_TABEL = 24;

// ---------------------------------------------------------------------------
// Validasi
// ---------------------------------------------------------------------------

function pastikanAngka(nilai, nama) {
  if (typeof nilai !== 'number' || !Number.isFinite(nilai)) {
    throw new GalatMasukan('BUKAN_ANGKA', `${nama} harus berupa angka.`);
  }
}

function pastikanTidakNegatif(nilai, nama) {
  pastikanAngka(nilai, nama);
  if (nilai < 0) {
    throw new GalatMasukan('NEGATIF', `${nama} tidak boleh negatif.`);
  }
}

/** Untuk nilai yang dipakai sebagai pembagi: harus > 0. */
function pastikanPembagi(nilai, nama) {
  pastikanTidakNegatif(nilai, nama);
  if (nilai === 0) {
    throw new GalatMasukan(
      'PEMBAGIAN_NOL',
      `${nama} tidak boleh nol karena dipakai sebagai pembagi.`,
    );
  }
}

/** Mengembalikan penyebut untuk mengubah satuan ke tahun: tahun → 1, bulan → 12, hari → hariPerTahun. */
function penyebutSatuan(satuan, hariPerTahun) {
  switch (satuan) {
    case 'tahun':
      return 1;
    case 'bulan':
      return 12;
    case 'hari':
      pastikanPembagi(hariPerTahun, 'Jumlah hari per tahun');
      return hariPerTahun;
    default:
      throw new GalatMasukan(
        'SATUAN_TIDAK_DIKENAL',
        `Satuan waktu "${satuan}" tidak dikenal. Gunakan tahun, bulan, atau hari.`,
      );
  }
}

// ---------------------------------------------------------------------------
// Konversi waktu
// ---------------------------------------------------------------------------

/**
 * Mengubah lama menabung ke tahun.
 * Contoh: keTahun(8, 'bulan') → 0,666…; keTahun(73, 'hari') → 0,2 (dengan 365 hari).
 * @param {number} lama
 * @param {'tahun'|'bulan'|'hari'} satuan
 * @param {number} [hariPerTahun=HARI_PER_TAHUN] KF-02
 * @returns {number}
 */
export function keTahun(lama, satuan, hariPerTahun = HARI_PER_TAHUN) {
  pastikanTidakNegatif(lama, 'Lama menabung');
  return lama / penyebutSatuan(satuan, hariPerTahun);
}

/**
 * Mengubah lama menabung dari satu satuan ke satuan lain.
 * Contoh: ubahSatuanWaktu(18, 'bulan', 'tahun') → 1,5; ubahSatuanWaktu(2, 'tahun', 'bulan') → 24.
 * @param {number} lama
 * @param {'tahun'|'bulan'|'hari'} dari
 * @param {'tahun'|'bulan'|'hari'} ke
 * @param {number} [hariPerTahun=HARI_PER_TAHUN] KF-02
 * @returns {number}
 */
export function ubahSatuanWaktu(lama, dari, ke, hariPerTahun = HARI_PER_TAHUN) {
  pastikanTidakNegatif(lama, 'Lama menabung');
  const penyebutAsal = penyebutSatuan(dari, hariPerTahun);
  const penyebutTujuan = penyebutSatuan(ke, hariPerTahun);
  return (lama * penyebutTujuan) / penyebutAsal;
}

// ---------------------------------------------------------------------------
// Rumus utama
// ---------------------------------------------------------------------------

/**
 * Bunga tunggal: B = M × p/100 × t.
 * @param {object} data
 * @param {number} data.modal       ≥ 0 (Rp)
 * @param {number} data.sukuBunga   ≥ 0 (% per tahun)
 * @param {number} data.lama        ≥ 0
 * @param {'tahun'|'bulan'|'hari'} data.satuan
 * @param {number} [data.hariPerTahun] KF-02
 * @returns {number} bunga (Rp), belum dibulatkan
 */
export function hitungBunga({ modal, sukuBunga, lama, satuan, hariPerTahun = HARI_PER_TAHUN } = {}) {
  pastikanTidakNegatif(modal, 'Modal');
  pastikanTidakNegatif(sukuBunga, 'Suku bunga');
  pastikanTidakNegatif(lama, 'Lama menabung');
  const penyebut = penyebutSatuan(satuan, hariPerTahun);
  return (modal * sukuBunga * lama) / (100 * penyebut);
}

/**
 * Tabungan akhir = M + B.
 * @param {object} data sama dengan hitungBunga
 * @returns {number} tabungan akhir (Rp), belum dibulatkan
 */
export function hitungTabunganAkhir(data = {}) {
  return data.modal + hitungBunga(data);
}

/**
 * Bunga dari selisih tabungan akhir dan modal: B = tabungan akhir − M.
 * @param {object} data
 * @param {number} data.tabunganAkhir ≥ modal
 * @param {number} data.modal         ≥ 0
 * @returns {number}
 */
export function bungaDariTabunganAkhir({ tabunganAkhir, modal } = {}) {
  pastikanTidakNegatif(tabunganAkhir, 'Tabungan akhir');
  pastikanTidakNegatif(modal, 'Modal');
  if (tabunganAkhir < modal) {
    throw new GalatMasukan(
      'DI_LUAR_RENTANG',
      'Tabungan akhir tidak boleh lebih kecil dari modal pada bunga tunggal.',
    );
  }
  return tabunganAkhir - modal;
}

// ---------------------------------------------------------------------------
// Mencari nilai yang belum diketahui (sub-bab M5)
// ---------------------------------------------------------------------------

/**
 * Modal dari bunga: M = B ÷ (p/100 × t).
 * Suku bunga dan lama harus > 0 (pembagi).
 * @returns {number} modal (Rp)
 */
export function cariModal({ bunga, sukuBunga, lama, satuan, hariPerTahun = HARI_PER_TAHUN } = {}) {
  pastikanTidakNegatif(bunga, 'Bunga');
  pastikanPembagi(sukuBunga, 'Suku bunga');
  pastikanPembagi(lama, 'Lama menabung');
  const penyebut = penyebutSatuan(satuan, hariPerTahun);
  return (bunga * 100 * penyebut) / (sukuBunga * lama);
}

/**
 * Modal dari tabungan akhir: M = tabungan akhir ÷ (1 + p/100 × t).
 * Pembagi selalu ≥ 1, jadi suku bunga atau lama boleh 0 (hasilnya modal = tabungan akhir).
 * @returns {number} modal (Rp)
 */
export function cariModalDariTabunganAkhir({
  tabunganAkhir,
  sukuBunga,
  lama,
  satuan,
  hariPerTahun = HARI_PER_TAHUN,
} = {}) {
  pastikanTidakNegatif(tabunganAkhir, 'Tabungan akhir');
  pastikanTidakNegatif(sukuBunga, 'Suku bunga');
  pastikanTidakNegatif(lama, 'Lama menabung');
  const penyebut = penyebutSatuan(satuan, hariPerTahun);
  return (tabunganAkhir * 100 * penyebut) / (100 * penyebut + sukuBunga * lama);
}

/**
 * Suku bunga per tahun: p = B ÷ (M × t) × 100.
 * Modal dan lama harus > 0 (pembagi).
 * @returns {number} suku bunga (% per tahun)
 */
export function cariSukuBunga({ bunga, modal, lama, satuan, hariPerTahun = HARI_PER_TAHUN } = {}) {
  pastikanTidakNegatif(bunga, 'Bunga');
  pastikanPembagi(modal, 'Modal');
  pastikanPembagi(lama, 'Lama menabung');
  const penyebut = penyebutSatuan(satuan, hariPerTahun);
  return (bunga * 100 * penyebut) / (modal * lama);
}

/**
 * Lama menabung: t = B ÷ (M × p/100), lalu diubah ke satuanHasil.
 * Modal dan suku bunga harus > 0 (pembagi).
 * Hasil bisa berupa pecahan (misalnya 7,5 bulan); tampilan yang memutuskan cara menampilkannya.
 * @param {object} data
 * @param {number} data.bunga
 * @param {number} data.modal
 * @param {number} data.sukuBunga
 * @param {'tahun'|'bulan'|'hari'} [data.satuanHasil='tahun']
 * @param {number} [data.hariPerTahun] KF-02
 * @returns {number} lama dalam satuanHasil
 */
export function cariLama({
  bunga,
  modal,
  sukuBunga,
  satuanHasil = 'tahun',
  hariPerTahun = HARI_PER_TAHUN,
} = {}) {
  pastikanTidakNegatif(bunga, 'Bunga');
  pastikanPembagi(modal, 'Modal');
  pastikanPembagi(sukuBunga, 'Suku bunga');
  const penyebut = penyebutSatuan(satuanHasil, hariPerTahun);
  return (bunga * 100 * penyebut) / (modal * sukuBunga);
}

// ---------------------------------------------------------------------------
// Tabel pertumbuhan (Simulasi, F-04)
// ---------------------------------------------------------------------------

/**
 * Menentukan titik-titik periode untuk tabel, maksimal MAKS_BARIS_TABEL baris.
 *  - bulan ≤ 24  : per bulan
 *  - bulan > 24  : per 12 bulan (per tahun), sesuai docs/design.md bagian 8
 *  - tahun       : per tahun (dikelompokkan jika lebih dari 24 tahun)
 *  - hari        : satu baris saja (tabel per hari tidak berguna di layar ponsel)
 * Periode terakhir selalu sama dengan lama, termasuk bila lama berupa pecahan.
 */
function titikPeriode(lama, satuan) {
  if (satuan === 'hari') return [lama];

  let langkah;
  if (satuan === 'bulan' && lama <= MAKS_BARIS_TABEL) {
    langkah = 1;
  } else {
    const dasar = satuan === 'bulan' ? 12 : 1;
    langkah = dasar * Math.max(1, Math.ceil(lama / (dasar * MAKS_BARIS_TABEL)));
  }

  const titik = [];
  for (let periode = langkah; periode < lama; periode += langkah) {
    titik.push(periode);
  }
  titik.push(lama);
  return titik;
}

/**
 * Tabel pertumbuhan tabungan per periode, untuk tabel Simulasi dan ilustrasi 3D.
 * @param {object} data sama dengan hitungBunga; lama harus > 0
 * @returns {Array<{periode: number, satuan: string, bungaKumulatif: number, tabungan: number}>}
 */
export function tabelPertumbuhan({ modal, sukuBunga, lama, satuan, hariPerTahun = HARI_PER_TAHUN } = {}) {
  // Validasi lengkap sekaligus (modal, suku bunga, lama, satuan)
  hitungBunga({ modal, sukuBunga, lama, satuan, hariPerTahun });
  if (lama === 0) {
    throw new GalatMasukan('DI_LUAR_RENTANG', 'Lama menabung harus lebih dari nol untuk membuat tabel.');
  }

  return titikPeriode(lama, satuan).map((periode) => {
    const bungaKumulatif = hitungBunga({ modal, sukuBunga, lama: periode, satuan, hariPerTahun });
    return { periode, satuan, bungaKumulatif, tabungan: modal + bungaKumulatif };
  });
}
