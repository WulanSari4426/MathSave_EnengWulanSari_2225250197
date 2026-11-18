/**
 * Username yang tidak boleh dipakai siswa (KF-05f, aturan username): menyerupai peran,
 * merek, atau sistem. Hanya dipakai server, tidak dikirim ke frontend.
 * Dibandingkan dengan username yang sudah dinormalisasi (huruf kecil).
 */
const TERLARANG = new Set([
  'admin', 'administrator', 'root', 'sistem', 'system', 'operator', 'moderator',
  'guru', 'peneliti', 'penilai', 'siswa', 'pengelola', 'dosen',
  'lanora', 'mathsave', 'supabase', 'bantuan', 'support', 'resmi', 'official',
]);

/** Awalan yang juga tidak boleh, agar tidak menyamar sebagai peran (misalnya "admin_lanora"). */
const AWALAN_TERLARANG = ['admin', 'lanora', 'peneliti', 'penilai', 'guru_'];

export function usernameTerlarang(username) {
  return TERLARANG.has(username) || AWALAN_TERLARANG.some((awalan) => username.startsWith(awalan));
}
