/**
 * Galat untuk masukan yang tidak valid pada modul logika.
 *
 * `kode` dipakai program untuk membedakan jenis galat.
 * `message` berisi pesan berbahasa Indonesia yang boleh langsung ditampilkan.
 *
 * Daftar kode:
 *  - BUKAN_ANGKA          : nilai bukan angka (misalnya teks, kosong, NaN, Infinity)
 *  - NEGATIF              : nilai negatif padahal harus ≥ 0
 *  - PEMBAGIAN_NOL        : nilai 0 padahal dipakai sebagai pembagi
 *  - SATUAN_TIDAK_DIKENAL : satuan waktu bukan 'tahun', 'bulan', atau 'hari'
 *  - DI_LUAR_RENTANG      : nilai tidak masuk akal untuk perhitungan ini
 *  - DITANYA_TIDAK_DIKENAL: jenis yang ditanya pada soal tidak dikenal
 */
export class GalatMasukan extends Error {
  /**
   * @param {string} kode
   * @param {string} pesan
   */
  constructor(kode, pesan) {
    super(pesan);
    this.name = 'GalatMasukan';
    this.kode = kode;
  }
}
