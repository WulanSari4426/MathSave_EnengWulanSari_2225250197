/**
 * Logika skrip pengelola siswa (buat-siswa.js, reset-pin.js, hitung-kode-kelas.js).
 * Dijalankan di komputer peneliti dengan service role key. Tidak pernah di frontend.
 * Akses database/Auth disuntikkan (hanya RPC), sehingga bisa diuji dengan Vitest.
 */
import {
  formatKodeSiswa, normalisasiKodeKelas, kodeKelasSah, tampilkanKodeReset,
} from '../../functions/_bersama/kodeSiswa.js';
import { normalisasiUsername, usernameSah } from '../../functions/_bersama/username.js';
import {
  turunan, emailInternalSiswa, buatKataSandiAcak, buatKodeReset,
} from '../../functions/_bersama/kriptografi.js';

/**
 * buat-siswa.js hanya untuk akun LAMA berbasis kode siswa (KF-05d). Sejak KF-05f, siswa baru
 * mendaftar sendiri dengan username. Skrip wajib dijalankan dengan tanda ini agar tidak terpakai
 * tanpa sengaja.
 */
export const IZIN_AKUN_LAMA = '--akun-lama-kode-siswa';

/** @returns {boolean} true jika peneliti sengaja meminta pembuatan akun lama. */
export function izinBuatAkunLama(argumen) {
  return argumen.includes(IZIN_AKUN_LAMA);
}

/** Masa berlaku kode reset (KF-05c detail b, ditetapkan saat implementasi). */
export const MASA_BERLAKU_RESET_JAM = 24;

/**
 * Membaca daftar siswa dari teks CSV "nama_panggilan,kelas" (baris judul boleh ada).
 * @returns {Array<{nama: string, kelas: string}>}
 */
export function bacaDaftarSiswa(teks) {
  const hasil = [];
  const baris = String(teks).split(/\r?\n/);
  baris.forEach((isi, i) => {
    const bersih = isi.trim();
    if (!bersih) return;
    const [nama = '', kelas = ''] = bersih.split(',').map((x) => x.trim());
    if (i === 0 && nama.toLowerCase() === 'nama_panggilan') return;
    if (!nama || !kelas) throw new Error(`Baris ${i + 1} belum lengkap. Format: nama_panggilan,kelas`);
    if (nama.length > 40 || kelas.length > 20) {
      throw new Error(`Baris ${i + 1}: nama maksimal 40 huruf, kelas maksimal 20 huruf.`);
    }
    hasil.push({ nama, kelas });
  });
  return hasil;
}

/**
 * Nomor kode berikutnya. Kode asli tidak disimpan, jadi dicari dengan mencocokkan hash S001–S999.
 * @param {Set<string>} hashTerpakai
 */
export async function nomorBerikutnya(rahasiaKode, hashTerpakai) {
  let terbesar = 0;
  for (let n = 1; n <= 999; n += 1) {
    if (hashTerpakai.has(await turunan.kodeHash(rahasiaKode, formatKodeSiswa(n)))) terbesar = n;
  }
  return terbesar + 1;
}

/**
 * Membuat akun siswa berurutan S001, S002, … dengan kata sandi acak (belum ada PIN, KF-05d).
 * @param {object} p
 * @param {Array<{nama:string, kelas:string}>} p.daftar
 * @param {string} p.rahasiaKode
 * @param {{ daftarKodeHash: () => Promise<string[]>,
 *           tambahSiswa: (id, authUserId, kodeHash, nama, kelas) => Promise<void> }} p.db
 * @param {{ buatPengguna: (email, sandi) => Promise<string>,
 *           hapusPengguna?: (authUserId) => Promise<void> }} p.auth
 * @returns {Promise<Array<{kode:string, nama:string, kelas:string}>>}  TANPA PIN
 */
export async function buatAkunSiswa({ daftar, rahasiaKode, db, auth }) {
  const hashTerpakai = new Set(await db.daftarKodeHash());
  let nomor = await nomorBerikutnya(rahasiaKode, hashTerpakai);
  if (nomor + daftar.length - 1 > 999) throw new Error('Kode siswa tidak cukup (maksimal S999).');

  const hasil = [];
  for (const { nama, kelas } of daftar) {
    const kode = formatKodeSiswa(nomor);
    const siswaId = crypto.randomUUID();
    const kodeHash = await turunan.kodeHash(rahasiaKode, kode);
    const authUserId = await auth.buatPengguna(emailInternalSiswa(siswaId), buatKataSandiAcak());
    try {
      await db.tambahSiswa(siswaId, authUserId, kodeHash, nama, kelas);
    } catch (e) {
      if (auth.hapusPengguna) await auth.hapusPengguna(authUserId);
      throw new Error(`Gagal menyimpan ${kode}: ${e.message}. Siswa sebelumnya sudah tersimpan.`);
    }
    hasil.push({ kode, nama, kelas });
    nomor += 1;
  }
  return hasil;
}

/**
 * Reset PIN oleh guru/peneliti berdasarkan USERNAME (KF-05c + KF-05f). Lewat RPC saja:
 *   cari_siswa_username → buat_reset_pin_siswa (kode reset lama dibatalkan, kunci login username
 *   diakhiri) → kata sandi Auth diganti acak (PIN lama langsung tidak berlaku).
 * Kode reset hanya DIKEMBALIKAN ke pemanggil untuk ditampilkan sekali. Yang tersimpan di
 * database hanya HMAC-nya. Fungsi ini tidak menulis file atau log.
 * Akun lama (kode siswa) harus diberi username dulu (beri_username_akun_lama) sebelum di-reset.
 * @returns {Promise<{username: string, kodeReset: string, berlakuJam: number}>}
 */
export async function resetPinUsername({ usernameMentah, rahasiaKode, dibuatOleh, db, auth }) {
  const username = normalisasiUsername(usernameMentah);
  if (!usernameSah(username)) {
    throw new Error('Format username tidak sah: 3–20 huruf kecil, angka, atau _, diawali huruf.');
  }
  const oleh = String(dibuatOleh ?? '').trim();
  if (!oleh) throw new Error('Tuliskan siapa yang mereset, misalnya "peneliti".');

  const siswa = await db.cariSiswaUsername(username);
  if (!siswa) throw new Error(`Username ${username} tidak ditemukan atau akunnya nonaktif.`);

  const kodeReset = buatKodeReset();
  const kunciHash = await turunan.kunciUsername(rahasiaKode, username);
  const tokenHash = await turunan.tokenResetHash(rahasiaKode, kodeReset);

  const authUserId = await db.buatResetPinSiswa(
    siswa.id, kunciHash, tokenHash, `${MASA_BERLAKU_RESET_JAM} hours`, oleh.slice(0, 40),
  );
  if (!authUserId) throw new Error(`Username ${username} tidak ditemukan atau akunnya nonaktif.`);

  await auth.ubahSandi(authUserId, buatKataSandiAcak());
  return { username, kodeReset: tampilkanKodeReset(kodeReset), berlakuJam: MASA_BERLAKU_RESET_JAM };
}

/** KODE_KELAS_HASH untuk secret Edge Function. Kode kelas tidak disimpan di mana pun. */
export async function hitungKodeKelasHash(rahasiaKode, kodeKelasMentah) {
  const kodeKelas = normalisasiKodeKelas(kodeKelasMentah);
  if (!kodeKelasSah(kodeKelas)) throw new Error('Kode kelas harus 6 angka.');
  return turunan.kodeKelasHash(rahasiaKode, kodeKelas);
}
