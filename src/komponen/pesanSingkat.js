/**
 * Pesan singkat satu kali setelah pindah halaman, misalnya
 * "Pendaftaran berhasil. Ingat kode siswa dan PIN-mu untuk masuk berikutnya." (design.md 5.1a, 5.1b).
 * Disimpan di sessionStorage, tidak pernah berisi PIN atau kode.
 */
const KUNCI = 'mathsave:pesan-singkat';

export function simpanPesanSingkat(teks) {
  try {
    sessionStorage.setItem(KUNCI, teks);
  } catch {
    // Penyimpanan diblokir: pesan dilewati, tidak mengganggu alur.
  }
}

export function ambilPesanSingkat() {
  try {
    const teks = sessionStorage.getItem(KUNCI);
    sessionStorage.removeItem(KUNCI);
    return teks;
  } catch {
    return null;
  }
}

/** Kartu pesan berhasil, diumumkan pembaca layar. Tanpa animasi (design.md bagian 9). */
export function buatKartuPesan(teks) {
  const kartu = document.createElement('p');
  kartu.className = 'pesan-berhasil';
  kartu.setAttribute('role', 'status');
  kartu.textContent = teks;
  return kartu;
}
