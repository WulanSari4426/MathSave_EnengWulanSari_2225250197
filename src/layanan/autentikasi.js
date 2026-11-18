/**
 * Daftar (dua langkah), masuk, buat PIN baru, dan keluar — KF-05f (username + PIN), api.md 2e.
 * Semua alur memanggil Edge Function. Respons bersesi disimpan lewat supabase.auth.setSession.
 * PIN, kode kelas, dan kode reset hanya dikirim lewat HTTPS di badan permintaan:
 * TIDAK disimpan di localStorage/sessionStorage dan TIDAK dicatat ke console (KF-05 L6).
 */
import { supabase, URL_SUPABASE, KUNCI_PUBLIK } from './supabase.js';

/**
 * Memanggil Edge Function. Tidak pernah melempar galat.
 * @returns {Promise<{ok: true, status: number, data: object} |
 *                   {ok: false, status?: number, kode_galat: string, alasan?: string}>}
 */
export async function panggilFungsiLogin(
  nama,
  isi,
  { fetchFn = globalThis.fetch, url = URL_SUPABASE, kunci = KUNCI_PUBLIK } = {},
) {
  if (!url || !kunci) return { ok: false, kode_galat: 'BELUM_TERHUBUNG' };

  let respons;
  try {
    respons = await fetchFn(`${url}/functions/v1/${nama}`, {
      method: 'POST',
      // Kunci publik (sb_publishable_) bukan JWT: dikirim di header apikey saja, sesuai dokumentasi
      // Supabase "Securing Edge Functions" (diperiksa 12 November 2026). Authorization hanya untuk JWT pengguna.
      headers: { 'Content-Type': 'application/json', apikey: kunci },
      body: JSON.stringify(isi),
    });
  } catch {
    return { ok: false, kode_galat: 'GALAT_JARINGAN' };
  }

  let data = null;
  try {
    data = await respons.json();
  } catch {
    data = null;
  }

  if (respons.ok && data && typeof data === 'object') return { ok: true, status: respons.status, data };
  return { ok: false, status: respons.status, kode_galat: data?.kode_galat ?? 'GALAT_SERVER', alasan: data?.alasan };
}

/**
 * Menafsirkan hasil alur yang bisa memberi sesi (api.md 2e.2–2e.4):
 *   200 + token      → { ok, jenis: 'sesi', data }
 *   201 + akun_dibuat / pin_diubah (tanpa token) → { ok, jenis: 'tanpa_sesi' }  ← BUKAN kegagalan
 *   selain itu        → galat
 */
export function tafsirkanHasilSesi(hasil) {
  if (!hasil.ok) return hasil;
  const { status, data } = hasil;
  if (data.access_token && data.refresh_token) return { ok: true, jenis: 'sesi', data };
  if (status === 201 && (data.akun_dibuat === true || data.pin_diubah === true)) {
    return { ok: true, jenis: 'tanpa_sesi' };
  }
  return { ok: false, kode_galat: 'GALAT_SERVER' };
}

const setSessionBawaan = (sesi) => supabase.auth.setSession(sesi);

async function alurBersesi(nama, isi, { setSession = setSessionBawaan, ...opsi } = {}) {
  const hasil = tafsirkanHasilSesi(await panggilFungsiLogin(nama, isi, opsi));
  if (!hasil.ok || hasil.jenis === 'tanpa_sesi') return hasil;
  const { error } = await setSession({
    access_token: hasil.data.access_token,
    refresh_token: hasil.data.refresh_token,
  });
  if (error) return { ok: false, kode_galat: 'GALAT_SERVER' };
  return { ok: true, jenis: 'sesi', siswa: hasil.data.siswa };
}

/** Masuk: username + PIN (api.md 2e.3). */
export const masuk = (username, pin, opsi) => alurBersesi('masuk-kode', { username, pin }, opsi);

/** Daftar langkah 1 (api.md 2e.1): kode kelas benar → daftar kelas aktif dari server. */
export async function periksaKodeKelas(kodeKelas, opsi) {
  const hasil = await panggilFungsiLogin('daftar-pertama', { aksi: 'periksa_kode_kelas', kode_kelas: kodeKelas }, opsi);
  if (!hasil.ok) return hasil;
  if (!Array.isArray(hasil.data.kelas)) return { ok: false, kode_galat: 'GALAT_SERVER' };
  return { ok: true, kelas: hasil.data.kelas };
}

/** Daftar langkah 2 (api.md 2e.2). Kode kelas dikirim ulang dan diperiksa ulang server. */
export const daftarAkun = ({ kodeKelas, kelasId, username, pin, ulangPin }, opsi) =>
  alurBersesi('daftar-pertama', {
    aksi: 'daftar', kode_kelas: kodeKelas, kelas_id: Number(kelasId), username, pin_baru: pin, ulang_pin: ulangPin,
  }, opsi);

/** Buat PIN baru dengan username + kode reset (api.md 2e.4). */
export const aturPinBaru = ({ username, kodeReset, pin, ulangPin }, opsi) =>
  alurBersesi('atur-pin-baru', { username, kode_reset: kodeReset, pin_baru: pin, ulang_pin: ulangPin }, opsi);

export async function sudahMasuk() {
  if (!supabase) return false;
  const { data } = await supabase.auth.getSession();
  return Boolean(data?.session);
}

export async function keluar() {
  if (supabase) await supabase.auth.signOut();
}

/** Menjalankan `saatKeluar` jika sesi berakhir (keluar, atau token tidak bisa diperbarui). */
export function pantauKeluar(saatKeluar) {
  if (!supabase) return;
  supabase.auth.onAuthStateChange((peristiwa) => {
    if (peristiwa === 'SIGNED_OUT') saatKeluar();
  });
}
