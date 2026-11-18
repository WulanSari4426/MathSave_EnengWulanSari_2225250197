/**
 * Adaptor Supabase untuk Edge Function (KHUSUS Deno). Belum diuji di Supabase asli.
 * Logika ada di alurLogin.js. File ini hanya meneruskan panggilan ke fungsi SQL dan Supabase Auth.
 *
 * Semua akses database lewat RPC (migrasi 0004 dan 0005), karena di proyek ini service_role
 * TIDAK punya hak membaca tabel secara langsung (temuan Tahap 0 Fase 5A).
 *
 * Variabel lingkungan (disediakan Supabase, docs "Edge Function secrets", diperiksa 12 November 2026):
 *   SUPABASE_URL
 *   SUPABASE_PUBLISHABLE_KEYS / SUPABASE_SECRET_KEYS (JSON, kunci "default") → dipakai lebih dulu
 *   SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY (kunci lama)              → cadangan
 * Secret yang diatur pengelola: RAHASIA_KODE, KODE_KELAS_HASH
 */
import { createClient } from 'npm:@supabase/supabase-js@2.118.0';
import { turunan } from './kriptografi.js';
import { ambilIp } from './penangan.js';
import { tafsirkanGalatMasuk, galatAdminAuth } from './galatAuth.js';
import { pilihKunciSupabase } from './kunciSupabase.js';

const opsiTanpaSesi = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };

function wajib(nama) {
  const nilai = Deno.env.get(nama);
  if (!nilai) throw new Error(`Variabel ${nama} belum diatur.`);
  return nilai;
}

const bacaEnv = (nama) => Deno.env.get(nama) ?? null;

/** Galat RPC: `kode` berisi pesan PostgreSQL (misalnya USERNAME_SUDAH_DIPAKAI). */
class GalatRpc extends Error {
  constructor(nama, error) {
    super(`RPC ${nama} gagal: ${error.message}`);
    this.kode = error.message;
  }
}

export async function buatAlatSupabase(permintaan) {
  const url = wajib('SUPABASE_URL');
  const { kunciPublik, kunciRahasia } = pilihKunciSupabase(bacaEnv);
  const admin = createClient(url, kunciRahasia, opsiTanpaSesi);
  const rahasiaKode = wajib('RAHASIA_KODE');

  async function rpc(nama, parameter = {}) {
    const { data, error } = await admin.rpc(nama, parameter);
    if (error) throw new GalatRpc(nama, error);
    return data;
  }

  const ip = ambilIp(permintaan);

  return {
    rahasiaKode,
    // Dibaca saat dibutuhkan (masuk-kode tidak memerlukannya).
    get kodeKelasHash() {
      return wajib('KODE_KELAS_HASH');
    },
    ipHash: ip ? await turunan.ipHash(rahasiaKode, ip) : null,
    db: {
      // Penguncian login (0004), kunci = HMAC "cari-username:"
      kunciAktif: (kunci) => rpc('kunci_masuk_aktif', { p_kode_hash: kunci }),
      catatPercobaan: (kunci, berhasil, ipHash) =>
        rpc('catat_percobaan_masuk', { p_kode_hash: kunci, p_berhasil: berhasil, p_ip_hash: ipHash }),
      // Batas gagal login per IP (0006)
      ipMasukTerbatas: (ipHash) => rpc('masuk_ip_terbatas', { p_ip_hash: ipHash }),
      // Pendaftaran dan login username (0005)
      statusBatasDaftar: (ipHash) => rpc('status_batas_daftar', { p_ip_hash: ipHash }),
      catatKodeKelasSalah: (ipHash) => rpc('catat_kode_kelas_salah', { p_ip_hash: ipHash }),
      daftarKelasAktif: () => rpc('daftar_kelas_aktif'),
      usernameTersedia: (username) => rpc('username_tersedia', { p_username: username }),
      cariSiswaUsername: (username) => rpc('cari_siswa_username', { p_username: username }),
      simpanSiswaMandiri: (id, authUserId, username, kelasId, ipHash) =>
        rpc('simpan_siswa_mandiri', {
          p_id: id, p_auth_user_id: authUserId, p_username: username, p_kelas_id: kelasId, p_ip_hash: ipHash,
        }),
      // Reset PIN (0004)
      cariResetValid: (siswaId, tokenHash) =>
        rpc('cari_reset_pin_valid', { p_siswa_id: siswaId, p_token_hash: tokenHash }),
      pakaiReset: (resetId) => rpc('pakai_reset_pin', { p_reset_id: resetId }),
      batalkanPakaiReset: (resetId) => rpc('batalkan_pakai_reset_pin', { p_reset_id: resetId }),
    },
    auth: {
      async masuk(email, sandi) {
        // Klien baru per percobaan, tanpa menyimpan sesi di server.
        const klien = createClient(url, kunciPublik, opsiTanpaSesi);
        const { data, error } = await klien.auth.signInWithPassword({ email, password: sandi });
        if (error) {
          // kredensial salah → null (dihitung gagal); 429 → GalatLayananSibuk (503); lainnya → 500
          tafsirkanGalatMasuk(error);
          return null;
        }
        return data.session;
      },
      async ubahSandi(authUserId, sandi) {
        const { error } = await admin.auth.admin.updateUserById(authUserId, { password: sandi });
        if (error) throw galatAdminAuth('Gagal mengganti kata sandi', error);
      },
      async buatPengguna(email, sandi) {
        // email_confirm: email internal .invalid tidak menerima surat, jadi langsung terkonfirmasi.
        const { data, error } = await admin.auth.admin.createUser({ email, password: sandi, email_confirm: true });
        if (error) throw galatAdminAuth('Gagal membuat akun Auth', error);
        return data.user.id;
      },
      async hapusPengguna(authUserId) {
        const { error } = await admin.auth.admin.deleteUser(authUserId);
        if (error) throw galatAdminAuth('Gagal menghapus akun Auth', error);
      },
    },
  };
}
