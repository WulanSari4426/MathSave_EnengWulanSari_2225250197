/**
 * Reset PIN siswa oleh guru/peneliti berdasarkan USERNAME (KF-05c, KF-05f). Di komputer peneliti:
 *
 *   node --env-file=.env supabase/seed/reset-pin.js <username> <peneliti|guru>
 *
 * Periksa identitas siswa secara langsung SEBELUM menjalankan skrip ini.
 * Akibatnya: PIN lama langsung tidak berlaku, kode reset lama dibatalkan, kunci login diakhiri.
 * Akun dan data belajar siswa tidak berubah.
 *
 * Kode reset hanya DITAMPILKAN SEKALI di layar ini, tidak disimpan ke file atau log.
 * Database hanya menyimpan HMAC-nya. Berikan langsung kepada siswa, lalu tutup terminal.
 *
 * Akun lama (kode siswa S001, tanpa username) harus diberi username dulu
 * (fungsi beri_username_akun_lama) sebelum bisa di-reset.
 */
import { resetPinUsername } from './inti/kelolaSiswa.js';
import { buatKlienPengelola } from './inti/klienPengelola.js';

async function utama() {
  const [username, dibuatOleh] = process.argv.slice(2);
  if (!username || !dibuatOleh) {
    console.error('Cara pakai: node --env-file=.env supabase/seed/reset-pin.js <username> <peneliti|guru>');
    process.exit(1);
  }
  const klien = buatKlienPengelola();
  const hasil = await resetPinUsername({
    usernameMentah: username, dibuatOleh, rahasiaKode: klien.rahasiaKode, db: klien.db, auth: klien.auth,
  });

  console.log(`\nPIN untuk username ${hasil.username} sudah direset. PIN lama tidak berlaku lagi.`);
  console.log(`Kode reset: ${hasil.kodeReset}  (berlaku ${hasil.berlakuJam} jam, sekali pakai)`);
  console.log('Minta siswa membuka "Saya punya kode reset" di layar Masuk, lalu mengisi username dan kode ini.\n');
}

utama().catch((e) => {
  console.error(`Gagal: ${e.message}`);
  process.exit(1);
});
