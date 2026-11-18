// Alat uji alur login: dijalankan terhadap PGlite (fungsi SQL asli dari migrasi, dipanggil sebagai
// service_role) dan Supabase Auth PALSU di memori.
// Yang TIDAK teruji di sini: HTTP Supabase, Auth asli (bcrypt), secret Edge Function, dan
// konkurensi sungguhan (PGlite satu koneksi → semua akses diserialkan lewat satu antrean).
import { randomUUID } from 'node:crypto';
import { sebagaiAdmin, sebagaiServiceRole } from '../db/bantuDb.js';
import { turunan, emailInternalSiswa, buatKataSandiAcak } from '../../supabase/functions/_bersama/kriptografi.js';
import { resetPinUsername as resetPinSkrip } from '../../supabase/seed/inti/kelolaSiswa.js';

export const RAHASIA_UJI = 'rahasia-khusus-tes-bukan-rahasia-asli';
// Kode kelas KHUSUS TES. Sengaja bukan kode kelas asli.
export const KODE_KELAS_UJI = '111222';

// ---------------------------------------------------------------------------
// Satu antrean per database: peran (service_role/admin) adalah keadaan koneksi PGlite,
// jadi setiap tugas "atur peran → kueri → kembalikan peran" tidak boleh disela tugas lain.
// ---------------------------------------------------------------------------
const antreanDb = new WeakMap();
function antre(db, tugas) {
  const rantai = antreanDb.get(db) ?? Promise.resolve();
  const hasil = rantai.then(tugas, tugas);
  antreanDb.set(db, hasil.catch(() => {}));
  return hasil;
}

/** Galat RPC seperti alatSupabase.js: `kode` berisi pesan PostgreSQL. */
function bungkusGalat(e) {
  const galat = new Error(e.message);
  galat.kode = e.message;
  return galat;
}

function sebagaiServer(db, sql, nilai) {
  return antre(db, async () => {
    await sebagaiServiceRole(db);
    try {
      return (await db.query(sql, nilai)).rows;
    } catch (e) {
      throw bungkusGalat(e);
    } finally {
      await sebagaiAdmin(db);
    }
  });
}
const satu = async (db, sql, nilai) => (await sebagaiServer(db, sql, nilai))[0]?.h;

function sebagaiPemilik(db, sql, nilai) {
  return antre(db, async () => {
    await sebagaiAdmin(db);
    return (await db.query(sql, nilai)).rows;
  });
}

/**
 * Supabase Auth palsu: menyimpan kata sandi apa adanya (yang asli memakai bcrypt).
 * Jika `db` diberikan, buatPengguna/hapusPengguna juga mengisi/menghapus auth.users.
 */
export function buatAuthPalsu(db = null) {
  const pengguna = new Map(); // authUserId → { email, sandi }
  const auth = {
    gagalUbahSandiBerikutnya: false,
    gagalMasukBerikutnya: false,
    gagalHapusBerikutnya: false,
    // Galat yang dilempar masuk() berikutnya (misalnya GalatLayananSibuk untuk Auth 429).
    lemparMasukBerikutnya: null,
    jumlahMasuk: 0,
    pengguna,
    tambah(email, sandi) {
      const id = randomUUID();
      pengguna.set(id, { email, sandi });
      return id;
    },
    async masuk(email, sandi) {
      auth.jumlahMasuk += 1;
      if (auth.lemparMasukBerikutnya) {
        const galat = auth.lemparMasukBerikutnya;
        auth.lemparMasukBerikutnya = null;
        throw galat;
      }
      if (auth.gagalMasukBerikutnya) {
        auth.gagalMasukBerikutnya = false;
        return null;
      }
      for (const [id, p] of pengguna) {
        if (p.email === email && p.sandi === sandi) {
          return { access_token: `akses-${id}`, refresh_token: `segar-${id}`, expires_in: 3600 };
        }
      }
      return null;
    },
    async ubahSandi(authUserId, sandi) {
      if (auth.gagalUbahSandiBerikutnya) {
        auth.gagalUbahSandiBerikutnya = false;
        throw new Error('Auth tidak tersedia (simulasi)');
      }
      const p = pengguna.get(authUserId);
      if (!p) throw new Error('Pengguna Auth tidak ada');
      p.sandi = sandi;
    },
    async buatPengguna(email, sandi) {
      const id = auth.tambah(email, sandi);
      if (db) await sebagaiPemilik(db, 'insert into auth.users (id, email) values ($1, $2)', [id, email]);
      return id;
    },
    async hapusPengguna(authUserId) {
      if (auth.gagalHapusBerikutnya) {
        auth.gagalHapusBerikutnya = false;
        throw new Error('Hapus Auth gagal (simulasi)');
      }
      pengguna.delete(authUserId);
      if (db) await sebagaiPemilik(db, 'delete from auth.users where id = $1', [authUserId]);
    },
  };
  return auth;
}

export async function buatAlatUji(db, auth) {
  const dbAlat = {
    // Penguncian (0004)
    kunciAktif: (k) => satu(db, 'select public.kunci_masuk_aktif($1) as h', [k]),
    catatPercobaan: (k, ok, ip) => satu(db, 'select public.catat_percobaan_masuk($1, $2, $3) as h', [k, ok, ip]),
    // Batas gagal login per IP (0006)
    ipMasukTerbatas: (ip) => satu(db, 'select public.masuk_ip_terbatas($1) as h', [ip]),
    // Username dan kelas (0005)
    statusBatasDaftar: (ip) => satu(db, 'select public.status_batas_daftar($1) as h', [ip]),
    catatKodeKelasSalah: (ip) => satu(db, 'select public.catat_kode_kelas_salah($1) as h', [ip]),
    daftarKelasAktif: () => satu(db, 'select public.daftar_kelas_aktif() as h'),
    usernameTersedia: (u) => satu(db, 'select public.username_tersedia($1) as h', [u]),
    cariSiswaUsername: (u) => satu(db, 'select public.cari_siswa_username($1) as h', [u]),
    simpanSiswaMandiri: (id, authId, u, kelasId, ip) =>
      satu(db, 'select public.simpan_siswa_mandiri($1, $2, $3, $4, $5) as h', [id, authId, u, kelasId, ip]),
    // Reset PIN (0004)
    cariResetValid: (id, t) => satu(db, 'select public.cari_reset_pin_valid($1, $2) as h', [id, t]),
    pakaiReset: (id) => satu(db, 'select public.pakai_reset_pin($1) as h', [id]),
    batalkanPakaiReset: (id) => satu(db, 'select public.batalkan_pakai_reset_pin($1) as h', [id]),
    // Skrip pengelola lama (kode siswa) — dipakai tes modulMurni.test.js
    cariSiswa: (h) => satu(db, 'select public.cari_siswa_untuk_masuk($1) as h', [h]),
    daftarKodeHash: async () =>
      (await sebagaiServer(db, 'select public.daftar_kode_hash_siswa() as h')).map((r) => r.h),
    tambahSiswa: (id, authId, h, nama, kelas) =>
      satu(db, 'select public.tambah_siswa($1, $2, $3, $4, $5) as h', [id, authId, h, nama, kelas]),
    buatResetPin: (h, t, berlaku, oleh) =>
      satu(db, 'select public.buat_reset_pin($1, $2, $3::interval, $4) as h', [h, t, berlaku, oleh]),
    // Skrip pengelola Fase 5A (Tahap 4): sama persis dengan klienPengelola.js, lewat RPC 0005
    buatResetPinSiswa: (id, kunci, token, berlaku, oleh) =>
      satu(db, 'select public.buat_reset_pin_siswa($1, $2, $3, $4::interval, $5) as h', [id, kunci, token, berlaku, oleh]),
    kelolaKelasDaftar: () => satu(db, 'select public.kelola_kelas_daftar() as h'),
    kelolaKelasTambah: (nama, jenjang, urutan) =>
      satu(db, 'select public.kelola_kelas_tambah($1, $2, $3) as h', [nama, jenjang, urutan]),
    kelolaKelasUbahNama: (id, nama) => satu(db, 'select public.kelola_kelas_ubah_nama($1, $2) as h', [id, nama]),
    kelolaKelasSetelAktif: (id, aktif) => satu(db, 'select public.kelola_kelas_setel_aktif($1, $2) as h', [id, aktif]),
  };

  return {
    rahasiaKode: RAHASIA_UJI,
    kodeKelasHash: await turunan.kodeKelasHash(RAHASIA_UJI, KODE_KELAS_UJI),
    ipHash: await turunan.ipHash(RAHASIA_UJI, '10.0.0.1'),
    db: dbAlat,
    auth,
  };
}

/** Menambah kelas lewat fungsi pengelola (seperti kelola-kelas.js nanti). */
export const tambahKelas = (db, nama, jenjang, urutan = 0) =>
  satu(db, 'select public.kelola_kelas_tambah($1, $2, $3) as h', [nama, jenjang, urutan]);

export const setelKelasAktif = (db, id, aktif) =>
  satu(db, 'select public.kelola_kelas_setel_aktif($1, $2) as h', [id, aktif]);

/**
 * Reset PIN berdasarkan username memakai FUNGSI SKRIP ASLI (supabase/seed/inti/kelolaSiswa.js),
 * sehingga tes alur juga menguji reset-pin.js. Mengembalikan kode reset (bentuk ABCD-2345).
 */
export async function resetPinUsername(db, alat, username) {
  const hasil = await resetPinSkrip({
    usernameMentah: username, dibuatOleh: 'peneliti', rahasiaKode: RAHASIA_UJI, db: alat.db, auth: alat.auth,
  });
  return hasil.kodeReset;
}

/** Akun LAMA berbasis kode siswa (seperti buat-siswa.js + pendaftaran pertama lama). */
export async function siapkanSiswa(db, auth, kode, { pin = null, nama = 'Rani', aktif = true } = {}) {
  const siswaId = randomUUID();
  const email = emailInternalSiswa(siswaId);
  const sandi = pin ? await turunan.kataSandi(RAHASIA_UJI, kode, pin) : buatKataSandiAcak();
  const authId = auth.tambah(email, sandi);
  await sebagaiPemilik(db, 'insert into auth.users (id, email) values ($1, $2)', [authId, email]);
  await sebagaiPemilik(db,
    `insert into public.siswa (id, auth_user_id, kode_hash, nama_panggilan, kelas, aktif, pin_dibuat_pada)
     values ($1, $2, $3, $4, 'VIII-C', $5, $6)`,
    [siswaId, authId, await turunan.kodeHash(RAHASIA_UJI, kode), nama, aktif, pin ? new Date() : null]);
  return { siswaId, authId };
}

/** Memberi username ke akun lama (fungsi migrasi 0005). */
export const beriUsernameAkunLama = (db, siswaId, username) =>
  satu(db, 'select public.beri_username_akun_lama($1, $2) as h', [siswaId, username]);

/** Mengakhiri kunci username seolah 5 menit sudah lewat. */
export async function lewatkanKunci(db, username) {
  await sebagaiPemilik(db,
    `update public.status_masuk set terkunci_sampai = now() - interval '1 second' where kode_hash = $1`,
    [await turunan.kunciUsername(RAHASIA_UJI, username)]);
}

export async function statusKunci(db, username) {
  const rows = await sebagaiPemilik(db,
    'select gagal_berturut, terkunci_sampai, tingkat_kunci from public.status_masuk where kode_hash = $1',
    [await turunan.kunciUsername(RAHASIA_UJI, username)]);
  return rows[0] ?? null;
}

/** Lama kunci yang sedang berlaku untuk username, dalam menit (dibulatkan), atau null. */
export async function lamaKunciMenit(db, username) {
  const rows = await sebagaiPemilik(db,
    `select round(extract(epoch from terkunci_sampai - now()) / 60)::int as menit
       from public.status_masuk where kode_hash = $1 and terkunci_sampai > now()`,
    [await turunan.kunciUsername(RAHASIA_UJI, username)]);
  return rows[0]?.menit ?? null;
}

/** Memundurkan waktu status kunci username, seolah tidak ada percobaan selama `interval`. */
export async function mundurkanStatusKunci(db, username, interval) {
  await sebagaiPemilik(db,
    `update public.status_masuk
        set diperbarui_pada = now() - $2::interval,
            terkunci_sampai = case when terkunci_sampai is null then null else now() - interval '1 second' end
      where kode_hash = $1`,
    [await turunan.kunciUsername(RAHASIA_UJI, username), interval]);
}

/** Kueri bebas sebagai pemilik database (lewat antrean yang sama). */
export const kueriPemilik = sebagaiPemilik;
