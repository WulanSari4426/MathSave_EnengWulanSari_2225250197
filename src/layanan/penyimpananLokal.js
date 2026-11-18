/**
 * Penyimpanan di perangkat untuk kenyamanan saja: posisi kartu materi terakhir dan antrean
 * jawaban kuis yang belum terkirim (KF-20 J2). Bukan data resmi: server tetap acuan.
 * PIN, kode kelas, kode reset, dan token TIDAK PERNAH disimpan di sini (KF-05 L6).
 * Semua akses dibungkus try/catch: mode privat atau penyimpanan penuh tidak boleh merusak halaman.
 */
const AWALAN = 'lanora:';

export function bacaLokal(kunci, cadangan = null) {
  try {
    const teks = globalThis.localStorage?.getItem(AWALAN + kunci);
    return teks === null || teks === undefined ? cadangan : JSON.parse(teks);
  } catch {
    return cadangan;
  }
}

export function tulisLokal(kunci, nilai) {
  try {
    globalThis.localStorage?.setItem(AWALAN + kunci, JSON.stringify(nilai));
    return true;
  } catch {
    return false;
  }
}

export function hapusLokal(kunci) {
  try {
    globalThis.localStorage?.removeItem(AWALAN + kunci);
  } catch {
    // diabaikan
  }
}
