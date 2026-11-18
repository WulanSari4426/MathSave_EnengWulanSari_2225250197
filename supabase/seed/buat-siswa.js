/**
 * KHUSUS AKUN LAMA berbasis kode siswa S001, S002, … (KF-05d).
 *
 * Sejak KF-05f (12 November 2026), siswa baru MENDAFTAR SENDIRI di aplikasi dengan
 * kode kelas, pilihan kelas, username, dan PIN. Skrip ini TIDAK dipakai untuk siswa baru.
 * Skrip dipertahankan hanya untuk kompatibilitas akun lama, dan wajib dijalankan dengan tanda:
 *
 *   node --env-file=.env supabase/seed/buat-siswa.js daftar-siswa.csv --akun-lama-kode-siswa
 *
 * Akun lama yang dibuat di sini belum punya username. Agar bisa masuk dengan alur username,
 * peneliti harus memberi username (beri_username_akun_lama) lalu menjalankan reset PIN.
 * Isi CSV: "nama_panggilan,kelas" per baris. Simpan file CSV DI LUAR repositori.
 */
import { readFileSync } from 'node:fs';
import { bacaDaftarSiswa, buatAkunSiswa, izinBuatAkunLama, IZIN_AKUN_LAMA } from './inti/kelolaSiswa.js';
import { buatKlienPengelola } from './inti/klienPengelola.js';

async function utama() {
  const argumen = process.argv.slice(2);
  if (!izinBuatAkunLama(argumen)) {
    console.error(
      'Skrip ini TIDAK dipakai untuk siswa baru. Sejak KF-05f, siswa mendaftar sendiri di aplikasi\n' +
      '(kode kelas → pilih kelas → username → PIN). Untuk mengatur pilihan kelas, pakai kelola-kelas.js.\n\n' +
      `Jika memang perlu membuat akun LAMA berbasis kode siswa, tambahkan tanda ${IZIN_AKUN_LAMA}.`,
    );
    process.exit(1);
  }
  const berkas = argumen.find((a) => !a.startsWith('--'));
  if (!berkas) {
    console.error(`Cara pakai: node --env-file=.env supabase/seed/buat-siswa.js <daftar-siswa.csv> ${IZIN_AKUN_LAMA}`);
    process.exit(1);
  }
  const daftar = bacaDaftarSiswa(readFileSync(berkas, 'utf8'));
  if (daftar.length === 0) {
    console.error('Daftar siswa kosong.');
    process.exit(1);
  }

  const klien = buatKlienPengelola();
  const hasil = await buatAkunSiswa({ daftar, rahasiaKode: klien.rahasiaKode, db: klien.db, auth: klien.auth });

  console.log(`\n${hasil.length} akun LAMA dibuat. Bagikan kode siswa berikut (tanpa PIN):\n`);
  console.table(hasil.map(({ kode, nama, kelas }) => ({ 'Kode siswa': kode, Nama: nama, Kelas: kelas })));
}

utama().catch((e) => {
  console.error(`Gagal: ${e.message}`);
  process.exit(1);
});
