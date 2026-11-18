/**
 * Logika Simulasi (PRD F-04; design.md 5.8, 8). Modul murni. Rumus HANYA dari bungaTunggal.js.
 * Pembulatan Rupiah hanya saat ditampilkan (KF-09). 1 tahun = 365 hari (KF-02).
 */
import { hitungBunga, hitungTabunganAkhir, tabelPertumbuhan, SATUAN_WAKTU } from './bungaTunggal.js';
import { GalatMasukan } from './galat.js';
import { uraiAngka, formatAngka, formatRupiah } from './parserAngka.js';

/** Batas wajar masukan agar layar tetap terbaca (bukan aturan matematika). */
export const BATAS_SIMULASI = Object.freeze({ modal: 1e12, sukuBunga: 100, lama: { tahun: 100, bulan: 1200, hari: 36500 } });

/**
 * Mengurai isian siswa.
 * @returns {{ ok: true, data: {modal, sukuBunga, lama, satuan} } | { ok: false, kolom: string, pesan: string }}
 */
export function bacaMasukanSimulasi({ modal, sukuBunga, lama, satuan }) {
  const angka = { modal: uraiAngka(modal), sukuBunga: uraiAngka(sukuBunga), lama: uraiAngka(lama) };
  const nama = { modal: 'Modal awal', sukuBunga: 'Suku bunga', lama: 'Lama menabung' };
  for (const kolom of ['modal', 'sukuBunga', 'lama']) {
    if (angka[kolom] === null) return { ok: false, kolom, pesan: `${nama[kolom]} harus berupa angka. Contoh: 1000000 atau 1.000.000.` };
    if (angka[kolom] <= 0) return { ok: false, kolom, pesan: `${nama[kolom]} harus lebih dari nol.` };
  }
  if (!SATUAN_WAKTU.includes(satuan)) return { ok: false, kolom: 'satuan', pesan: 'Pilih satuan lama menabung.' };
  if (angka.modal > BATAS_SIMULASI.modal) return { ok: false, kolom: 'modal', pesan: 'Modal awal terlalu besar untuk simulasi ini.' };
  if (angka.sukuBunga > BATAS_SIMULASI.sukuBunga) return { ok: false, kolom: 'sukuBunga', pesan: 'Suku bunga paling besar 100% per tahun.' };
  if (angka.lama > BATAS_SIMULASI.lama[satuan]) return { ok: false, kolom: 'lama', pesan: `Lama menabung paling lama ${formatAngka(BATAS_SIMULASI.lama[satuan])} ${satuan}.` };
  return { ok: true, data: { ...angka, satuan } };
}

const teksT = (lama, satuan) => (satuan === 'tahun' ? formatAngka(lama) : `(${formatAngka(lama)}/${satuan === 'bulan' ? 12 : 365})`);

/**
 * Hasil simulasi: rumus tersubstitusi, nilai bunga dan tabungan akhir, serta tabel per periode.
 * @returns {{ bunga: number, akhir: number, rumus: string[], kepalaTabel: string[], baris: Array<{periode: string, bunga: string, tabungan: string}>, tumpukan: Array<{label: string, modal: number, bunga: number}> }}
 */
export function hitungSimulasi({ modal, sukuBunga, lama, satuan }) {
  try {
    const data = { modal, sukuBunga, lama, satuan };
    const bunga = hitungBunga(data);
    const akhir = hitungTabunganAkhir(data);
    const tabel = tabelPertumbuhan(data);
    const perTahun = satuan === 'bulan' && tabel.length > 1 && tabel[0].periode >= 12;
    const namaPeriode = satuan === 'hari' ? 'Hari ke-' : satuan === 'tahun' || perTahun ? 'Tahun ke-' : 'Bulan ke-';
    const labelPeriode = (p) => (satuan === 'bulan' && perTahun ? formatAngka(p / 12) : formatAngka(p));
    return {
      ok: true,
      bunga,
      akhir,
      rumus: [
        'B = M × (p/100) × t',
        `B = ${formatAngka(modal)} × (${formatAngka(sukuBunga)}/100) × ${teksT(lama, satuan)}`,
        `B = ${formatRupiah(bunga)}`,
        'A = M + B',
        `A = ${formatAngka(modal)} + ${formatAngka(bunga)}`,
        `Jumlah tabungan akhir A = ${formatRupiah(akhir)}`,
      ],
      kepalaTabel: [namaPeriode, 'Bunga', 'Tabungan'],
      baris: tabel.map((b) => ({
        periode: labelPeriode(b.periode), bunga: formatRupiah(b.bungaKumulatif), tabungan: formatRupiah(b.tabungan),
      })),
      // Maksimal 24 tumpukan untuk ilustrasi 3D (design.md 8); sama dengan baris tabel.
      tumpukan: tabel.map((b) => ({ label: labelPeriode(b.periode), modal, bunga: b.bungaKumulatif })),
      satuanTumpukan: satuan === 'hari' ? 'hari' : satuan === 'tahun' || perTahun ? 'tahun' : 'bulan',
    };
  } catch (e) {
    if (e instanceof GalatMasukan) return { ok: false, pesan: e.message };
    throw e;
  }
}
