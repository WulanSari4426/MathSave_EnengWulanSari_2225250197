/**
 * Mengelompokkan daftar kelas dari server (daftar-pertama, aksi periksa_kode_kelas) per jenjang,
 * untuk <select> + <optgroup> di layar Daftar langkah 2 (design.md 5.0). Daftar kelas TIDAK
 * pernah ditulis di frontend: isinya selalu dari server, diatur peneliti (KF-05f U6).
 */

const ROMAWI = { 7: 'VII', 8: 'VIII', 9: 'IX', 10: 'X', 11: 'XI', 12: 'XII' };

/** 8 → "Kelas VIII" */
export function labelJenjang(jenjang) {
  return ROMAWI[jenjang] ? `Kelas ${ROMAWI[jenjang]}` : null;
}

/**
 * @param {Array<{id: number, nama: string, jenjang: number}>} kelas  urutan dari server dipertahankan
 * @returns {Array<{jenjang: number, label: string, kelas: Array<{id: number, nama: string}>}>}
 *          hanya jenjang VII–XII yang punya kelas; entri yang tidak lengkap diabaikan
 */
export function kelompokkanKelas(kelas) {
  if (!Array.isArray(kelas)) return [];
  const peta = new Map();
  for (const k of kelas) {
    if (!k || !Number.isInteger(k.id) || typeof k.nama !== 'string' || !labelJenjang(k.jenjang)) continue;
    if (!peta.has(k.jenjang)) peta.set(k.jenjang, []);
    peta.get(k.jenjang).push({ id: k.id, nama: k.nama });
  }
  return [...peta.keys()].sort((a, b) => a - b)
    .map((jenjang) => ({ jenjang, label: labelJenjang(jenjang), kelas: peta.get(jenjang) }));
}
