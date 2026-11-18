/**
 * Mengatur daftar pilihan kelas VII–XII untuk pendaftaran siswa (KF-05f U6). Di komputer peneliti:
 *
 *   node --env-file=.env supabase/seed/kelola-kelas.js daftar
 *   node --env-file=.env supabase/seed/kelola-kelas.js tambah "VIII-C" 8
 *   node --env-file=.env supabase/seed/kelola-kelas.js ubah-nama 3 "VIII C"
 *   node --env-file=.env supabase/seed/kelola-kelas.js nonaktifkan 3
 *   node --env-file=.env supabase/seed/kelola-kelas.js aktifkan 3
 *
 * Isi daftar kelas ditentukan peneliti, tidak dikarang aplikasi.
 * Tidak ada perintah hapus. Hanya lewat RPC (service_role), tidak membaca tabel langsung.
 * Membutuhkan VITE_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY di .env (tidak butuh RAHASIA_KODE).
 */
import { jalankanPerintahKelas, CARA_PAKAI } from './inti/kelolaKelas.js';
import { buatKlienPengelola } from './inti/klienPengelola.js';

async function utama() {
  const argumen = process.argv.slice(2);
  if (argumen.length === 0) {
    console.log(CARA_PAKAI);
    process.exit(1);
  }
  const { db } = buatKlienPengelola();
  console.log(await jalankanPerintahKelas(argumen, db));
}

utama().catch((e) => {
  console.error(`Gagal: ${e.message}`);
  process.exit(1);
});
