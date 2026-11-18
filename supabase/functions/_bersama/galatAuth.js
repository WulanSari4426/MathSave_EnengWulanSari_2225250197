/**
 * Penafsiran galat Supabase Auth untuk Edge Function login (modul murni, diuji Vitest).
 *
 * Dokumentasi Supabase Auth meminta galat dikenali lewat `error.code`, bukan teks pesan.
 * Kode yang dipakai di sini: `invalid_credentials` (kata sandi/email salah) dan
 * `over_request_rate_limit` (terlalu banyak permintaan dari satu IP). HTTP 429 = batas laju.
 */

/**
 * Supabase Auth sedang membatasi laju atau tidak tersedia sementara.
 * BUKAN kesalahan PIN: tidak boleh dihitung sebagai percobaan gagal.
 */
export class GalatLayananSibuk extends Error {
  constructor(keterangan = '') {
    super(`Supabase Auth membatasi laju${keterangan ? `: ${keterangan}` : ''}`);
    this.name = 'GalatLayananSibuk';
    this.layananSibuk = true;
  }
}

export const adalahLayananSibuk = (e) => Boolean(e?.layananSibuk);

const KODE_BATAS_LAJU = new Set(['over_request_rate_limit', 'over_email_send_rate_limit', 'over_sms_send_rate_limit']);

/**
 * Menafsirkan galat signInWithPassword.
 * @returns {'kredensial_salah'} jika kata sandi/email salah (dihitung sebagai gagal)
 * @throws {GalatLayananSibuk} jika dibatasi laju (429)
 * @throws {Error} untuk galat lain (menjadi 500, tidak dihitung sebagai gagal)
 */
export function tafsirkanGalatMasuk(error) {
  if (error?.status === 429 || KODE_BATAS_LAJU.has(error?.code)) {
    throw new GalatLayananSibuk(String(error?.code ?? error?.status));
  }
  // Supabase Auth lama tidak selalu mengisi `code`; 400 tanpa kode = kredensial salah.
  if (error?.code === 'invalid_credentials' || (error?.status === 400 && !error?.code)) {
    return 'kredensial_salah';
  }
  // Pesan galat Auth tidak memuat kata sandi; hanya kode dan status yang dicatat.
  throw new Error(`Auth gagal: ${error?.code ?? 'tanpa_kode'} (${error?.status ?? '?'})`);
}

/** Galat Admin API (buat/ubah/hapus pengguna): 429 → GalatLayananSibuk, lainnya → Error. */
export function galatAdminAuth(tindakan, error) {
  if (error?.status === 429 || KODE_BATAS_LAJU.has(error?.code)) {
    return new GalatLayananSibuk(`${tindakan}: ${error?.code ?? error?.status}`);
  }
  return new Error(`${tindakan}: ${error?.code ?? 'tanpa_kode'} (${error?.status ?? '?'}) ${error?.message ?? ''}`.trim());
}
