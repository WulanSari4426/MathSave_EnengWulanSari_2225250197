/**
 * Pembungkus RPC siswa (api.md bagian 3). Halaman tidak memanggil supabase.rpc langsung.
 * Identitas siswa SELALU dari sesi (auth.uid() di server), tidak pernah dari parameter.
 *
 * Setiap fungsi mengembalikan { ok: true, data } atau { ok: false, kode_galat, detail? }
 * dan tidak pernah melempar galat.
 */
import { supabase } from './supabase.js';

/** Kode galat RPC yang dikenal (api.md bagian 4). */
export const KODE_RPC = [
  'TIDAK_MASUK', 'SOAL_TIDAK_DITEMUKAN', 'INPUT_TIDAK_VALID', 'SESI_TIDAK_VALID', 'KUIS_SUDAH_SELESAI',
  'PETUNJUK_TIDAK_TERSEDIA', 'WAKTU_HABIS', 'OPSI_TIDAK_VALID', 'BATAS_PERCOBAAN_KUIS', 'BANK_SOAL_KURANG',
];

/** Menerjemahkan galat supabase-js menjadi kode galat api.md. */
export function tafsirkanGalatRpc(error) {
  const pesan = String(error?.message ?? '');
  // Urutan penting: OPSI_TIDAK_VALID lebih dulu dari INPUT_TIDAK_VALID tidak perlu,
  // karena pesan RPC berisi tepat satu kode.
  const kode = KODE_RPC.find((k) => pesan === k || pesan.includes(k));
  if (kode) return kode;
  if (/fetch|network|jaringan|Failed to|Load failed/i.test(pesan)) return 'GALAT_JARINGAN';
  return 'GALAT_SERVER';
}

/** Detail galat (misalnya BANK_SOAL_KURANG) berupa JSON di `error.details`, atau null. */
function bacaDetail(error) {
  if (!error?.details) return null;
  try {
    return JSON.parse(error.details);
  } catch {
    return null;
  }
}

/**
 * Memanggil satu RPC.
 * @returns {Promise<{ok: true, data: any} | {ok: false, kode_galat: string, detail?: object|null}>}
 */
export async function panggilRpc(nama, parameter = {}, { klien = supabase } = {}) {
  if (!klien) return { ok: false, kode_galat: 'BELUM_TERHUBUNG' };
  try {
    // RPC tanpa parameter dipanggil dengan namanya saja: identitas selalu dari auth.uid() di server.
    const { data, error } = Object.keys(parameter).length === 0
      ? await klien.rpc(nama)
      : await klien.rpc(nama, parameter);
    if (error) return { ok: false, kode_galat: tafsirkanGalatRpc(error), detail: bacaDetail(error) };
    return { ok: true, data };
  } catch {
    return { ok: false, kode_galat: 'GALAT_JARINGAN' };
  }
}

// ---------------------------------------------------------------------------
// 3.1 Profil dan sapaan
// ---------------------------------------------------------------------------

/**
 * Profil siswa yang sedang masuk. Sejak KF-05f, nama_panggilan = username (huruf kecil).
 * @returns {Promise<{ok: true, data: {nama_panggilan: string, kelas: string}} | {ok: false, kode_galat: string}>}
 */
export async function ambilProfil({ klien = supabase } = {}) {
  const hasil = await panggilRpc('ambil_profil', {}, { klien });
  if (!hasil.ok) return { ok: false, kode_galat: hasil.kode_galat };
  if (!hasil.data || typeof hasil.data.nama_panggilan !== 'string') return { ok: false, kode_galat: 'GALAT_SERVER' };
  return { ok: true, data: hasil.data };
}

/** Sapaan Beranda: "Halo, wulan123". Tanpa nama (belum termuat/galat): "Halo!". */
export function sapaan(namaPanggilan) {
  const nama = typeof namaPanggilan === 'string' ? namaPanggilan.trim() : '';
  return nama ? `Halo, ${nama}` : 'Halo!';
}

// ---------------------------------------------------------------------------
// 3.2 Kemajuan materi (Fase 6)
// ---------------------------------------------------------------------------

/** @param {'sedang'|'selesai'} status  @param {number} kartuTerakhir indeks mulai 0 */
export const simpanKemajuan = (subMateri, status, kartuTerakhir, opsi) =>
  panggilRpc('simpan_kemajuan', {
    p_sub_materi: subMateri, p_status: status, p_kartu_terakhir: kartuTerakhir,
  }, opsi);

// ---------------------------------------------------------------------------
// 3.3–3.6 Latihan (Fase 8)
// ---------------------------------------------------------------------------

export const ambilSoalLatihan = (subMateri, tingkat, jumlah = 5, opsi) =>
  panggilRpc('ambil_soal_latihan', { p_sub_materi: subMateri, p_tingkat: tingkat, p_jumlah: jumlah }, opsi);

export const periksaPemahaman = (soalId, diketahui, ditanya, opsi) =>
  panggilRpc('periksa_pemahaman', { p_soal_id: soalId, p_diketahui: diketahui, p_ditanya: ditanya }, opsi);

export const ambilPetunjuk = (soalId, level, opsi) =>
  panggilRpc('ambil_petunjuk', { p_soal_id: soalId, p_level: level }, opsi);

/** Latihan: soal isian, jawaban sudah diurai uraiAngka. */
export const periksaJawabanLatihan = ({ soalId, jawaban, jumlahPetunjuk, durasiDetik }, opsi) =>
  panggilRpc('periksa_jawaban', {
    p_soal_id: soalId, p_jawaban: jawaban, p_jumlah_petunjuk: jumlahPetunjuk,
    p_durasi_detik: durasiDetik, p_sesi_kuis_id: null, p_opsi: null,
  }, opsi);

// ---------------------------------------------------------------------------
// 3.6–3.8 Kuis (Fase 9)
// ---------------------------------------------------------------------------

/**
 * Kuis: tepat satu dari `jawaban` (isian) atau `opsiId` (pilihan ganda, id tetap "o1"–"o4", KF-18 O5).
 * Tidak mengirim waktu perangkat (KF-20 J6).
 */
export const simpanJawabanKuis = ({ sesiKuisId, soalId, jawaban = null, opsiId = null, durasiDetik = 0 }, opsi) =>
  panggilRpc('periksa_jawaban', {
    p_soal_id: soalId, p_jawaban: opsiId ? null : jawaban, p_jumlah_petunjuk: 0,
    p_durasi_detik: durasiDetik, p_sesi_kuis_id: sesiKuisId, p_opsi: opsiId,
  }, opsi);

export const mulaiKuis = (opsi) => panggilRpc('mulai_kuis', {}, opsi);
export const statusKuis = (opsi) => panggilRpc('status_kuis', {}, opsi);
export const selesaikanKuis = (sesiKuisId, opsi) =>
  panggilRpc('selesaikan_kuis', { p_sesi_kuis_id: sesiKuisId }, opsi);

// ---------------------------------------------------------------------------
// 3.9–3.11 Kemajuan dan riwayat (Fase 10)
// ---------------------------------------------------------------------------

export const ringkasanKemajuan = (opsi) => panggilRpc('ringkasan_kemajuan', {}, opsi);
export const riwayatBelajar = (batas = 20, sebelum = null, opsi) =>
  panggilRpc('riwayat_belajar', { p_batas: batas, p_sebelum: sebelum }, opsi);
