/**
 * Klien Supabase untuk skrip pengelola di komputer peneliti (Node).
 * Membaca .env lokal: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RAHASIA_KODE.
 * Kunci service role dan RAHASIA_KODE TIDAK PERNAH masuk frontend, repositori, atau Netlify.
 */
import { createClient } from '@supabase/supabase-js';

export function wajibEnv(nama) {
  const nilai = process.env[nama];
  if (!nilai) {
    throw new Error(`${nama} belum diisi di .env. Jalankan skrip dengan: node --env-file=.env <skrip>`);
  }
  return nilai;
}

export function buatKlienPengelola() {
  const url = process.env.SUPABASE_URL || wajibEnv('VITE_SUPABASE_URL');
  const admin = createClient(url, wajibEnv('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Hanya RPC: di proyek ini service_role tidak punya hak membaca tabel langsung (Fase 5A Tahap 0).
  async function rpc(nama, parameter = {}) {
    const { data, error } = await admin.rpc(nama, parameter);
    if (error) {
      const galat = new Error(`${nama}: ${error.message}`);
      galat.kode = error.message; // misalnya KELAS_SUDAH_ADA
      throw galat;
    }
    return data;
  }

  return {
    // Dibaca saat dibutuhkan: kelola-kelas.js tidak memerlukan RAHASIA_KODE.
    get rahasiaKode() {
      return wajibEnv('RAHASIA_KODE');
    },
    db: {
      // Akun lama berbasis kode siswa (buat-siswa.js, hanya dengan --akun-lama-kode-siswa)
      daftarKodeHash: () => rpc('daftar_kode_hash_siswa'),
      tambahSiswa: (id, authUserId, kodeHash, nama, kelas) =>
        rpc('tambah_siswa', {
          p_id: id, p_auth_user_id: authUserId, p_kode_hash: kodeHash, p_nama_panggilan: nama, p_kelas: kelas,
        }),
      // Reset PIN berdasarkan username (migrasi 0005)
      cariSiswaUsername: (username) => rpc('cari_siswa_username', { p_username: username }),
      buatResetPinSiswa: (siswaId, kunciHash, tokenHash, berlaku, dibuatOleh) =>
        rpc('buat_reset_pin_siswa', {
          p_siswa_id: siswaId, p_kunci_hash: kunciHash, p_token_hash: tokenHash,
          p_berlaku: berlaku, p_dibuat_oleh: dibuatOleh,
        }),
      // Daftar kelas (migrasi 0005). Tidak ada fungsi hapus.
      kelolaKelasDaftar: () => rpc('kelola_kelas_daftar'),
      kelolaKelasTambah: (nama, jenjang, urutan) =>
        rpc('kelola_kelas_tambah', { p_nama: nama, p_jenjang: jenjang, p_urutan: urutan }),
      kelolaKelasUbahNama: (id, nama) => rpc('kelola_kelas_ubah_nama', { p_id: id, p_nama: nama }),
      kelolaKelasSetelAktif: (id, aktif) => rpc('kelola_kelas_setel_aktif', { p_id: id, p_aktif: aktif }),
    },
    auth: {
      async buatPengguna(email, sandi) {
        const { data, error } = await admin.auth.admin.createUser({ email, password: sandi, email_confirm: true });
        if (error) throw new Error(`Gagal membuat akun Auth: ${error.message}`);
        return data.user.id;
      },
      async hapusPengguna(authUserId) {
        await admin.auth.admin.deleteUser(authUserId);
      },
      async ubahSandi(authUserId, sandi) {
        const { error } = await admin.auth.admin.updateUserById(authUserId, { password: sandi });
        if (error) throw new Error(`Gagal mengganti kata sandi: ${error.message}`);
      },
    },
  };
}
