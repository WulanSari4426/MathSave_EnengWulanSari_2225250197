/**
 * Menghitung KODE_KELAS_HASH untuk secret Edge Function (KF-05d). Dijalankan sekali oleh peneliti:
 *
 *   node --env-file=.env supabase/seed/hitung-kode-kelas.js
 *
 * Kode kelas diketik saat diminta, agar tidak tersimpan di riwayat terminal.
 * Hasilnya disimpan sebagai secret Supabase:  supabase secrets set KODE_KELAS_HASH=<hasil>
 * Kode kelas asli TIDAK disimpan di repositori, frontend, maupun Netlify.
 */
import { createInterface } from 'node:readline/promises';
import { hitungKodeKelasHash } from './inti/kelolaSiswa.js';
import { wajibEnv } from './inti/klienPengelola.js';

async function utama() {
  const rahasia = wajibEnv('RAHASIA_KODE');
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const kodeKelas = await rl.question('Kode kelas (6 angka): ');
  rl.close();
  console.log(`\nKODE_KELAS_HASH=${await hitungKodeKelasHash(rahasia, kodeKelas)}\n`);
}

utama().catch((e) => {
  console.error(`Gagal: ${e.message}`);
  process.exit(1);
});
