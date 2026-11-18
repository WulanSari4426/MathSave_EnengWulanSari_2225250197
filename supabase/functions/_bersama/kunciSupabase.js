/**
 * Memilih kunci API Supabase untuk Edge Function (modul murni, diuji Vitest). Nilai kunci
 * tidak pernah dicatat; pesan galat hanya menyebut NAMA variabel.
 *
 * Dokumentasi Supabase (diperiksa 12 November 2026): Edge Function mendapat SUPABASE_PUBLISHABLE_KEYS
 * dan SUPABASE_SECRET_KEYS (objek JSON berisi kunci bernama, misalnya "default"). SUPABASE_ANON_KEY dan
 * SUPABASE_SERVICE_ROLE_KEY masih ada tetapi berisi kunci LAMA, yang sedang dihentikan Supabase.
 * Kunci format baru dipakai lebih dulu; kunci lama hanya cadangan.
 *
 * @param {(nama: string) => string|null} bacaEnv
 * @returns {{ kunciPublik: string, kunciRahasia: string }}
 */
export function pilihKunciSupabase(bacaEnv) {
  const kunciPublik = kunciBernama(bacaEnv('SUPABASE_PUBLISHABLE_KEYS')) ?? bacaEnv('SUPABASE_ANON_KEY');
  const kunciRahasia = kunciBernama(bacaEnv('SUPABASE_SECRET_KEYS')) ?? bacaEnv('SUPABASE_SERVICE_ROLE_KEY');
  if (!kunciPublik) throw new Error('Variabel SUPABASE_PUBLISHABLE_KEYS/SUPABASE_ANON_KEY belum diatur.');
  if (!kunciRahasia) throw new Error('Variabel SUPABASE_SECRET_KEYS/SUPABASE_SERVICE_ROLE_KEY belum diatur.');
  return { kunciPublik, kunciRahasia };
}

/**
 * Hanya kunci publik (untuk fungsi yang bertindak atas nama siswa, misalnya tutor-ai).
 * Urutan sama dengan pilihKunciSupabase: format baru lebih dulu, kunci lama cadangan.
 * @returns {string|null}
 */
export function pilihKunciPublik(bacaEnv) {
  return kunciBernama(bacaEnv('SUPABASE_PUBLISHABLE_KEYS')) ?? bacaEnv('SUPABASE_ANON_KEY') ?? null;
}

/** Nilai kunci "default" dari objek JSON kunci bernama, atau null jika tidak ada/tidak sah. */
function kunciBernama(teksJson) {
  if (!teksJson) return null;
  try {
    const nilai = JSON.parse(teksJson)?.default;
    return typeof nilai === 'string' && nilai.trim() !== '' ? nilai : null;
  } catch {
    return null;
  }
}
