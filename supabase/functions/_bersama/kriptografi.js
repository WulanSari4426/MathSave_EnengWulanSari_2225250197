/**
 * HMAC dan bilangan acak dengan Web Crypto (tersedia di Deno dan Node ≥ 20).
 * Rahasia (RAHASIA_KODE) hanya ada di Edge Function dan skrip pengelola, TIDAK di frontend.
 */
import { ALFABET_KODE_RESET, PANJANG_KODE_RESET } from './kodeSiswa.js';

const penyandi = new TextEncoder();

export async function hmacHex(rahasia, pesan) {
  if (!rahasia) throw new Error('Rahasia HMAC belum diatur.');
  const kunci = await crypto.subtle.importKey(
    'raw', penyandi.encode(rahasia), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const tanda = await crypto.subtle.sign('HMAC', kunci, penyandi.encode(pesan));
  return Array.from(new Uint8Array(tanda), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Perbandingan teks dengan waktu tetap, agar waktu respons tidak membocorkan kecocokan sebagian. */
export function samaAman(a, b) {
  const x = penyandi.encode(String(a ?? ''));
  const y = penyandi.encode(String(b ?? ''));
  let beda = x.length ^ y.length;
  const panjang = Math.max(x.length, y.length);
  for (let i = 0; i < panjang; i += 1) beda |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return beda === 0;
}

/**
 * Turunan HMAC (architecture.md bagian 5). Awalan berbeda memisahkan kegunaan,
 * sehingga hash satu kegunaan tidak bisa dipakai untuk kegunaan lain.
 */
export const turunan = {
  // Akun lama berbasis kode siswa (KF-05/KF-05d). Tetap ada untuk kompatibilitas skrip lama.
  kodeHash: (rahasia, kode) => hmacHex(rahasia, `cari:${kode}`),
  kataSandi: (rahasia, kode, pin) => hmacHex(rahasia, `sandi:${kode}:${pin}`),
  // Akun username (KF-05f): kunci penguncian per username, dan kata sandi terikat siswa.id
  // (bukan username) agar perubahan username tidak merusak PIN.
  kunciUsername: (rahasia, username) => hmacHex(rahasia, `cari-username:${username}`),
  kataSandiSiswa: (rahasia, siswaId, pin) => hmacHex(rahasia, `sandi-siswa:${siswaId}:${pin}`),
  kodeKelasHash: (rahasia, kodeKelas) => hmacHex(rahasia, `kelas:${kodeKelas}`),
  tokenResetHash: (rahasia, kodeReset) => hmacHex(rahasia, `reset:${kodeReset}`),
  ipHash: (rahasia, ip) => hmacHex(rahasia, `ip:${ip}`),
};

/** Email internal akun Auth siswa. Bukan email siswa dan tidak menerima surat (KF-05 L4). */
export function emailInternalSiswa(siswaId) {
  return `${siswaId}@siswa.mathsave.invalid`;
}

/** Teks acak tanpa bias (rejection sampling). */
export function teksAcak(panjang, alfabet) {
  const batas = 256 - (256 % alfabet.length);
  let hasil = '';
  while (hasil.length < panjang) {
    const bita = crypto.getRandomValues(new Uint8Array(panjang * 2));
    for (const b of bita) {
      if (b < batas && hasil.length < panjang) hasil += alfabet[b % alfabet.length];
    }
  }
  return hasil;
}

export function buatKodeReset() {
  return teksAcak(PANJANG_KODE_RESET, ALFABET_KODE_RESET);
}

/** Kata sandi acak yang tidak diketahui siapa pun (siswa belum mendaftar, atau PIN lama dibatalkan). */
export function buatKataSandiAcak() {
  return teksAcak(48, 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789');
}
