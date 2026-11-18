/**
 * Alur Edge Function masuk-kode, daftar-pertama, dan atur-pin-baru untuk akun USERNAME
 * (KF-05f; api.md bagian 2e; architecture.md 5.0). Nama ekspor tetap, jadi index.js tidak berubah.
 *
 * Semua akses luar disuntikkan lewat `alat` (lihat alatSupabase.js):
 *   alat.rahasiaKode    RAHASIA_KODE (secret)          alat.kodeKelasHash  KODE_KELAS_HASH (secret)
 *   alat.ipHash         HMAC alamat IP dari sumber TEPERCAYA (penangan.js ambilIp), atau null
 *   alat.db   { kunciAktif, catatPercobaan, ipMasukTerbatas, statusBatasDaftar, catatKodeKelasSalah, daftarKelasAktif,
 *               usernameTersedia, cariSiswaUsername, simpanSiswaMandiri,
 *               cariResetValid, pakaiReset, batalkanPakaiReset }   ← semuanya RPC service_role
 *   alat.auth { masuk(email, sandi) → sesi|null, ubahSandi(id, sandi),
 *               buatPengguna(email, sandi) → id, hapusPengguna(id) }
 *
 * Prinsip (KF-05 L6, L7): PIN, kode kelas, dan kode reset tidak pernah disimpan atau dicatat.
 * Login dan reset menjawab semua kegagalan identitas dengan respons yang sama persis.
 * Pengecualian yang disengaja (KF-05f RS-04): "username sudah dipakai" saat mendaftar,
 * hanya setelah kode kelas terbukti benar dan dibatasi per IP (U9).
 */
import {
  normalisasiKodeKelas, kodeKelasSah, normalisasiPin, pinSah, normalisasiKodeReset, kodeResetSah,
} from './kodeSiswa.js';
import { normalisasiUsername, usernameSah } from './username.js';
import { usernameTerlarang } from './usernameTerlarang.js';
import { turunan, samaAman, emailInternalSiswa } from './kriptografi.js';

const respons = (status, isi) => ({ status, isi });
const galat = (status, kode, tambahan = {}) => respons(status, { kode_galat: kode, ...tambahan });
const isianAda = (nilai) => typeof nilai === 'string' && nilai.trim() !== '';

/** ID tiruan untuk menyamakan waktu respons saat username tidak ditemukan. */
const ID_TIRUAN = '00000000-0000-4000-8000-000000000000';
/** percobaan_daftar.ip_hash wajib terisi. Permintaan tanpa header IP berbagi satu ember. */
const IP_TIDAK_DIKETAHUI = 'ip-tidak-diketahui';

/** Galat dari RPC yang sengaja dimunculkan migrasi 0005 (pesan = kode). */
const GALAT_SIMPAN_SISWA = {
  USERNAME_SUDAH_DIPAKAI: () => galat(409, 'USERNAME_SUDAH_DIPAKAI'),
  USERNAME_TIDAK_SAH: () => galat(400, 'USERNAME_TIDAK_SAH', { alasan: 'FORMAT' }),
  KELAS_TIDAK_SAH: () => galat(400, 'KELAS_TIDAK_SAH'),
  TERLALU_BANYAK_PENDAFTARAN: () => galat(429, 'TERLALU_BANYAK_PENDAFTARAN'),
};

/** Mengambil kode galat bisnis dari galat RPC (alatSupabase menaruhnya di `kode`). */
function kodeGalatRpc(e) {
  const teks = String(e?.kode ?? e?.message ?? '');
  return Object.keys(GALAT_SIMPAN_SISWA).find((kode) => teks.includes(kode)) ?? null;
}

function bentukSesi(sesi, siswa) {
  return respons(200, {
    access_token: sesi.access_token,
    refresh_token: sesi.refresh_token,
    expires_in: sesi.expires_in,
    siswa: { nama_panggilan: siswa.nama_panggilan, kelas: siswa.kelas },
  });
}

async function kodeKelasBenar(kodeKelasMentah, alat) {
  const kodeKelas = normalisasiKodeKelas(kodeKelasMentah);
  if (!kodeKelasSah(kodeKelas)) return false;
  return samaAman(await turunan.kodeKelasHash(alat.rahasiaKode, kodeKelas), alat.kodeKelasHash);
}

/**
 * Batas gagal login per IP (migrasi 0006, 100 per jam). Hanya jika IP berasal dari sumber
 * tepercaya; tanpa IP, hanya penguncian per username yang berlaku.
 * Permintaan yang ditolak di sini TIDAK dicatat, agar banjir permintaan tidak menambah baris log.
 */
async function ipMasukTerbatas(alat) {
  if (!alat.ipHash) return false;
  return Boolean(await alat.db.ipMasukTerbatas(alat.ipHash));
}

/**
 * Masuk otomatis setelah akun dibuat atau PIN diganti. Pada titik ini perubahan SUDAH tersimpan,
 * jadi kegagalan apa pun (termasuk Supabase Auth membatasi laju) dijawab 201 tanpa sesi:
 * siswa diarahkan ke layar Masuk, bukan diminta mengulang pendaftaran.
 */
async function masukSetelahPerubahan(alat, email, sandi) {
  try {
    return await alat.auth.masuk(email, sandi);
  } catch {
    return null;
  }
}

/** Aturan PIN KF-05a + konfirmasi. null jika boleh dipakai. */
async function periksaPinBaru(pin, ulang, alat) {
  if (!pinSah(pin)) return galat(400, 'PIN_TIDAK_SESUAI_ATURAN', { alasan: 'BUKAN_6_ANGKA' });
  if (pin !== ulang) return galat(400, 'PIN_TIDAK_SESUAI_ATURAN', { alasan: 'TIDAK_SAMA' });
  if (samaAman(await turunan.kodeKelasHash(alat.rahasiaKode, pin), alat.kodeKelasHash)) {
    return galat(400, 'PIN_TIDAK_SESUAI_ATURAN', { alasan: 'SAMA_DENGAN_KODE_KELAS' });
  }
  return null;
}

// ---------------------------------------------------------------------------
// masuk-kode: username + PIN (api.md 2e.3, KF-05b per username)
// ---------------------------------------------------------------------------
export async function prosesMasuk(masukan, alat) {
  const { username: usernameMentah, pin: pinMentah } = masukan ?? {};
  // ISIAN_KOSONG tidak menambah hitungan gagal.
  if (!isianAda(usernameMentah) || !isianAda(pinMentah)) return galat(400, 'ISIAN_KOSONG');

  const username = normalisasiUsername(usernameMentah);
  const pin = normalisasiPin(pinMentah);
  const kunci = await turunan.kunciUsername(alat.rahasiaKode, username);

  // Batas per IP → respons yang sama dengan kunci username (tidak membocorkan penyebabnya).
  if (await ipMasukTerbatas(alat)) return galat(429, 'TERLALU_BANYAK_PERCOBAAN');

  // Terkunci → 429 tanpa memeriksa PIN, untuk username terdaftar maupun tidak.
  if (await alat.db.kunciAktif(kunci)) {
    await alat.db.catatPercobaan(kunci, false, alat.ipHash);
    return galat(429, 'TERLALU_BANYAK_PERCOBAAN');
  }

  const formatSah = usernameSah(username) && pinSah(pin);
  const siswa = formatSah ? await alat.db.cariSiswaUsername(username) : null;
  // Tetap dihitung walaupun username tidak ada, agar waktu respons tidak membocorkannya.
  const sandi = await turunan.kataSandiSiswa(alat.rahasiaKode, siswa?.id ?? ID_TIRUAN, pin);

  let sesi = null;
  if (siswa && siswa.pin_dibuat_pada) {
    // Galat Auth (termasuk 429 → GalatLayananSibuk) dilempar SEBELUM catatPercobaan,
    // sehingga gangguan layanan tidak dihitung sebagai PIN salah.
    sesi = await alat.auth.masuk(emailInternalSiswa(siswa.id), sandi);
  }

  await alat.db.catatPercobaan(kunci, Boolean(sesi), alat.ipHash);
  if (!sesi) return galat(401, 'MASUK_GAGAL');
  return bentukSesi(sesi, siswa);
}

// ---------------------------------------------------------------------------
// daftar-pertama: dua aksi (api.md 2e.1, 2e.2)
// ---------------------------------------------------------------------------
export async function prosesDaftarPertama(masukan, alat) {
  const aksi = masukan?.aksi;
  if (aksi === 'periksa_kode_kelas') return periksaKodeKelas(masukan, alat);
  if (aksi === 'daftar') return daftarAkun(masukan, alat);
  return galat(400, 'ISIAN_KOSONG');
}

/** Langkah 1: kode kelas benar → daftar kelas aktif. */
async function periksaKodeKelas({ kode_kelas: kodeKelasMentah }, alat) {
  if (!isianAda(kodeKelasMentah)) return galat(400, 'ISIAN_KOSONG');
  const ip = alat.ipHash ?? IP_TIDAK_DIKETAHUI;

  const batas = await alat.db.statusBatasDaftar(ip);
  if (batas.kode_kelas_salah_tercapai) return galat(429, 'TERLALU_BANYAK_PENDAFTARAN');

  if (!(await kodeKelasBenar(kodeKelasMentah, alat))) {
    await alat.db.catatKodeKelasSalah(ip);
    return galat(401, 'KODE_KELAS_SALAH');
  }
  return respons(200, { kelas: await alat.db.daftarKelasAktif() });
}

/** Langkah 2: semua isian diperiksa ulang di server, lalu akun dibuat. */
async function daftarAkun(masukan, alat) {
  const {
    kode_kelas: kodeKelasMentah, kelas_id: kelasIdMentah, username: usernameMentah,
    pin_baru: pinMentah, ulang_pin: ulangMentah,
  } = masukan;
  const kelasIdAda = kelasIdMentah !== undefined && kelasIdMentah !== null && String(kelasIdMentah).trim() !== '';
  if (!isianAda(kodeKelasMentah) || !kelasIdAda || !isianAda(usernameMentah)
      || !isianAda(pinMentah) || !isianAda(ulangMentah)) {
    return galat(400, 'ISIAN_KOSONG');
  }
  const ip = alat.ipHash ?? IP_TIDAK_DIKETAHUI;

  // 1. Batas per IP (U9)
  const batas = await alat.db.statusBatasDaftar(ip);
  if (batas.kode_kelas_salah_tercapai || batas.akun_baru_tercapai) {
    return galat(429, 'TERLALU_BANYAK_PENDAFTARAN');
  }

  // 2. Kode kelas diperiksa ULANG: pilihan dari perangkat tidak dipercaya begitu saja.
  if (!(await kodeKelasBenar(kodeKelasMentah, alat))) {
    await alat.db.catatKodeKelasSalah(ip);
    return galat(401, 'KODE_KELAS_SALAH');
  }

  // 3. Kelas: bentuk id dulu. Aktif/tidaknya diperiksa database di simpan_siswa_mandiri.
  const kelasId = Number(kelasIdMentah);
  if (!Number.isInteger(kelasId) || kelasId < 1 || kelasId > 32767) return galat(400, 'KELAS_TIDAK_SAH');

  // 4. Username
  const username = normalisasiUsername(usernameMentah);
  if (!usernameSah(username)) return galat(400, 'USERNAME_TIDAK_SAH', { alasan: 'FORMAT' });
  if (usernameTerlarang(username)) return galat(400, 'USERNAME_TIDAK_SAH', { alasan: 'TERLARANG' });

  // 5. PIN dan konfirmasinya
  const tolakPin = await periksaPinBaru(normalisasiPin(pinMentah), normalisasiPin(ulangMentah), alat);
  if (tolakPin) return tolakPin;
  const pin = normalisasiPin(pinMentah);

  // 6. Pemeriksaan awal ketersediaan, agar tidak membuat akun Auth yang langsung dihapus.
  //    Pengaman sebenarnya tetap UNIQUE di database (langkah 8).
  if (!(await alat.db.usernameTersedia(username))) return galat(409, 'USERNAME_SUDAH_DIPAKAI');

  // 7. Akun Auth dengan email internal dan kata sandi turunan dari siswa.id
  const siswaId = crypto.randomUUID();
  const email = emailInternalSiswa(siswaId);
  const sandi = await turunan.kataSandiSiswa(alat.rahasiaKode, siswaId, pin);
  const authUserId = await alat.auth.buatPengguna(email, sandi);

  // 8. Simpan siswa (satu transaksi di database). Gagal → hapus akun Auth agar tidak ada akun yatim.
  let siswa;
  try {
    siswa = await alat.db.simpanSiswaMandiri(siswaId, authUserId, username, kelasId, ip);
  } catch (e) {
    try {
      await alat.auth.hapusPengguna(authUserId);
    } catch (eHapus) {
      // Log hanya berisi UUID akun Auth (tanpa username/PIN) agar peneliti bisa membersihkannya.
      throw new Error(`Akun Auth yatim tidak terhapus (${authUserId}): ${eHapus?.message ?? eHapus}`);
    }
    const kode = kodeGalatRpc(e);
    if (kode) return GALAT_SIMPAN_SISWA[kode]();
    throw e;
  }

  // 9. Masuk. Jika gagal, akun TETAP sah (tidak dihapus): siswa diarahkan ke layar Masuk.
  const sesi = await masukSetelahPerubahan(alat, email, sandi);
  if (!sesi) return respons(201, { akun_dibuat: true });
  return bentukSesi(sesi, siswa);
}

// ---------------------------------------------------------------------------
// atur-pin-baru: username + kode reset (api.md 2e.4, KF-05c)
// ---------------------------------------------------------------------------
export async function prosesAturPinBaru(masukan, alat) {
  const {
    username: usernameMentah, kode_reset: resetMentah, pin_baru: pinMentah, ulang_pin: ulangMentah,
  } = masukan ?? {};
  if (!isianAda(usernameMentah) || !isianAda(resetMentah) || !isianAda(pinMentah) || !isianAda(ulangMentah)) {
    return galat(400, 'ISIAN_KOSONG');
  }

  const username = normalisasiUsername(usernameMentah);
  const kodeReset = normalisasiKodeReset(resetMentah);
  const kunci = await turunan.kunciUsername(alat.rahasiaKode, username);

  // Batas per IP dan penghitung kunci yang sama dengan layar Masuk (KF-05c detail f).
  if (await ipMasukTerbatas(alat)) return galat(429, 'TERLALU_BANYAK_PERCOBAAN');
  if (await alat.db.kunciAktif(kunci)) {
    await alat.db.catatPercobaan(kunci, false, alat.ipHash);
    return galat(429, 'TERLALU_BANYAK_PERCOBAAN');
  }

  const gagal = async () => {
    await alat.db.catatPercobaan(kunci, false, alat.ipHash);
    return galat(401, 'RESET_GAGAL');
  };

  // Dihitung selalu, agar waktu respons setara walaupun username tidak ada.
  const tokenHash = await turunan.tokenResetHash(alat.rahasiaKode, kodeReset);
  const siswa = usernameSah(username) ? await alat.db.cariSiswaUsername(username) : null;
  const resetId = siswa && kodeResetSah(kodeReset) ? await alat.db.cariResetValid(siswa.id, tokenHash) : null;
  if (!resetId) return gagal();

  // Aturan PIN hanya diperiksa setelah username + kode reset terbukti valid (L7).
  const tolakPin = await periksaPinBaru(normalisasiPin(pinMentah), normalisasiPin(ulangMentah), alat);
  if (tolakPin) return tolakPin;
  const pin = normalisasiPin(pinMentah);

  // Sekali pakai: jika permintaan lain lebih dulu memakainya, yang ini gagal.
  if (!(await alat.db.pakaiReset(resetId))) return gagal();

  const sandi = await turunan.kataSandiSiswa(alat.rahasiaKode, siswa.id, pin);
  try {
    await alat.auth.ubahSandi(siswa.auth_user_id, sandi);
  } catch (e) {
    await alat.db.batalkanPakaiReset(resetId);
    throw e;
  }
  await alat.db.catatPercobaan(kunci, true, alat.ipHash);

  // PIN baru sudah berlaku. Jika masuk otomatis gagal, siswa cukup masuk lewat layar Masuk.
  const sesi = await masukSetelahPerubahan(alat, emailInternalSiswa(siswa.id), sandi);
  if (!sesi) return respons(201, { pin_diubah: true });
  return bentukSesi(sesi, siswa);
}
