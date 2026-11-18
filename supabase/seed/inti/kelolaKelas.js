/**
 * Logika skrip kelola-kelas.js (KF-05f U6): peneliti mengatur daftar pilihan kelas VII–XII.
 * Semua akses lewat RPC service_role dari migrasi 0005:
 *   kelola_kelas_daftar(), kelola_kelas_tambah(p_nama, p_jenjang, p_urutan),
 *   kelola_kelas_ubah_nama(p_id, p_nama), kelola_kelas_setel_aktif(p_id, p_aktif)
 * TIDAK ADA perintah hapus. Kelas yang tidak dipakai lagi cukup dinonaktifkan,
 * agar riwayat siswa yang sudah memilihnya tetap utuh.
 */

export const CARA_PAKAI = `Cara pakai: node --env-file=.env supabase/seed/kelola-kelas.js <perintah>

  daftar                                   semua kelas, status aktif, dan jumlah siswanya
  tambah "<nama kelas>" <jenjang> [urutan] jenjang 7–12 atau VII–XII, contoh: tambah "VIII-C" 8
  ubah-nama <id> "<nama baru>"             nama lama siswa yang sudah tersimpan tidak berubah
  nonaktifkan <id>                         kelas tidak tampil lagi di pilihan pendaftaran
  aktifkan <id>                            kelas tampil lagi di pilihan pendaftaran

Tidak ada perintah hapus. Gunakan "nonaktifkan".`;

const ROMAWI = { VII: 7, VIII: 8, IX: 9, X: 10, XI: 11, XII: 12 };
const NAMA_JENJANG = Object.fromEntries(Object.entries(ROMAWI).map(([r, n]) => [n, r]));

/** "8", "VIII", "viii" → 8. Selain 7–12 → null. */
export function bacaJenjang(teks) {
  const t = String(teks ?? '').trim().toUpperCase();
  if (ROMAWI[t]) return ROMAWI[t];
  if (/^[0-9]+$/.test(t) && Number(t) >= 7 && Number(t) <= 12) return Number(t);
  return null;
}

function bacaBilanganBulat(teks, { min, max }) {
  const t = String(teks ?? '').trim();
  if (!/^[0-9]+$/.test(t)) return null;
  const n = Number(t);
  return n >= min && n <= max ? n : null;
}

const bacaId = (teks) => bacaBilanganBulat(teks, { min: 1, max: 32767 });

const PESAN_GALAT_RPC = {
  KELAS_SUDAH_ADA: 'Nama kelas itu sudah ada (huruf besar/kecil dianggap sama).',
  KELAS_TIDAK_SAH: 'Nama kelas harus 1–20 karakter, dan jenjang 7–12.',
  KELAS_TIDAK_DITEMUKAN: 'Kelas dengan id itu tidak ditemukan. Lihat id dengan perintah "daftar".',
};

/** Galat RPC bisnis → pesan untuk peneliti. Galat lain diteruskan apa adanya. */
function terjemahkanGalat(e) {
  const teks = String(e?.kode ?? e?.message ?? '');
  const kode = Object.keys(PESAN_GALAT_RPC).find((k) => teks.includes(k));
  if (kode) {
    const galat = new Error(PESAN_GALAT_RPC[kode]);
    galat.kode = kode;
    return galat;
  }
  return e;
}

/** Tabel teks sederhana untuk perintah "daftar". */
export function formatDaftarKelas(daftar) {
  if (!daftar.length) return 'Belum ada kelas. Tambahkan dengan: tambah "<nama kelas>" <jenjang>';
  const baris = daftar.map((k) => [
    String(k.id), k.nama, NAMA_JENJANG[k.jenjang] ?? String(k.jenjang), String(k.urutan),
    k.aktif ? 'aktif' : 'nonaktif', String(k.jumlah_siswa),
  ]);
  const judul = ['id', 'nama', 'jenjang', 'urutan', 'status', 'siswa'];
  const lebar = judul.map((j, i) => Math.max(j.length, ...baris.map((b) => b[i].length)));
  const susun = (b) => b.map((sel, i) => sel.padEnd(lebar[i])).join('  ').trimEnd();
  return [susun(judul), susun(lebar.map((l) => '-'.repeat(l))), ...baris.map(susun)].join('\n');
}

/**
 * Menjalankan satu perintah. Mengembalikan teks untuk ditampilkan.
 * @param {string[]} argumen  contoh: ['tambah', 'VIII-C', '8']
 * @param {{ kelolaKelasDaftar, kelolaKelasTambah, kelolaKelasUbahNama, kelolaKelasSetelAktif }} db
 */
export async function jalankanPerintahKelas(argumen, db) {
  const [perintah, ...sisa] = argumen;
  try {
    switch (perintah) {
      case 'daftar':
        return formatDaftarKelas(await db.kelolaKelasDaftar());

      case 'tambah': {
        const [nama, jenjangTeks, urutanTeks] = sisa;
        if (!nama?.trim() || jenjangTeks === undefined) throw new Error(CARA_PAKAI);
        const jenjang = bacaJenjang(jenjangTeks);
        if (jenjang === null) throw new Error('Jenjang harus 7–12 atau VII–XII.');
        const urutan = urutanTeks === undefined ? 0 : bacaBilanganBulat(urutanTeks, { min: 0, max: 32767 });
        if (urutan === null) throw new Error('Urutan harus bilangan bulat 0 atau lebih.');
        const id = await db.kelolaKelasTambah(nama.trim(), jenjang, urutan);
        return `Kelas "${nama.trim()}" (jenjang ${NAMA_JENJANG[jenjang]}) ditambahkan dengan id ${id}.`;
      }

      case 'ubah-nama': {
        const [idTeks, nama] = sisa;
        const id = bacaId(idTeks);
        if (id === null || !nama?.trim()) throw new Error(CARA_PAKAI);
        await db.kelolaKelasUbahNama(id, nama.trim());
        return `Nama kelas id ${id} diubah menjadi "${nama.trim()}". Nama yang sudah tersimpan pada siswa tidak berubah.`;
      }

      case 'nonaktifkan':
      case 'aktifkan': {
        const id = bacaId(sisa[0]);
        if (id === null) throw new Error(CARA_PAKAI);
        const aktif = perintah === 'aktifkan';
        await db.kelolaKelasSetelAktif(id, aktif);
        return aktif
          ? `Kelas id ${id} aktif dan tampil di pilihan pendaftaran.`
          : `Kelas id ${id} dinonaktifkan. Siswa yang sudah memilihnya tidak berubah.`;
      }

      case 'hapus':
        throw new Error('Tidak ada perintah hapus, agar data siswa yang sudah memilih kelas itu tetap utuh. Gunakan "nonaktifkan <id>".');

      default:
        throw new Error(CARA_PAKAI);
    }
  } catch (e) {
    throw terjemahkanGalat(e);
  }
}
