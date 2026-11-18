/**
 * Logika tampilan kemajuan dan riwayat (PRD F-10; design.md 5.2, 5.10). Modul murni.
 */

/** Nama jenis kesalahan untuk siswa (PRD F-09) dan sub-bab terkait (api.md 3.9). */
export const JENIS_KESALAHAN_TAMPIL = Object.freeze({
  SATUAN_WAKTU: { label: 'Satuan waktu (bulan/hari belum diubah ke tahun)', sub: 'M3' },
  PERSEN: { label: 'Suku bunga belum dibagi 100', sub: 'P0' },
  TERTUKAR_BUNGA_TABUNGAN: { label: 'Besar bunga dan jumlah tabungan akhir tertukar', sub: 'M4' },
  RUMUS_INVERS: { label: 'Mencari modal awal, suku bunga, atau lama menabung', sub: 'M5' },
});

export function labelKesalahan(jenis) {
  return JENIS_KESALAHAN_TAMPIL[jenis]?.label ?? 'Kesalahan lain';
}

/** "20 Nov" (zona waktu perangkat; tanggal dari server dalam ISO). */
export function formatTanggal(iso, { tahun = false } = {}) {
  const t = new Date(iso);
  if (Number.isNaN(t.getTime())) return '';
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', ...(tahun ? { year: 'numeric' } : {}) }).format(t);
}

const NAMA_TINGKAT = { 1: 'mudah', 2: 'sedang', 3: 'sulit' };

/**
 * Satu baris "Aktivitas terbaru" dari riwayat_belajar (api.md 3.10).
 * @returns {{ tanggal: string, judul: string, hasil: string, href: string|null }}
 */
export function barisAktivitas(item) {
  if (item.jenis === 'kuis') {
    return {
      tanggal: formatTanggal(item.waktu),
      judul: `Kuis (percobaan ${item.percobaan_ke})`,
      hasil: `Nilai ${item.skor}`,
      href: item.sesi_kuis_id ? `#/kuis/hasil/${item.sesi_kuis_id}` : null,
    };
  }
  return {
    tanggal: formatTanggal(item.waktu),
    judul: `Latihan ${item.sub_materi} · ${NAMA_TINGKAT[item.tingkat] ?? ''}`.trim(),
    hasil: `${item.benar}/${item.jumlah} benar`,
    href: null,
  };
}

/**
 * Satu saran langkah berikutnya untuk Beranda (PRD F-10).
 * @param {object} ringkasan hasil ringkasan_kemajuan
 * @returns {{ teks: string, href: string, tombol: string }}
 */
export function saranBerikutnya(ringkasan) {
  const salah = ringkasan?.kesalahan_tersering?.[0];
  if (salah && JENIS_KESALAHAN_TAMPIL[salah.jenis]) {
    const sub = salah.sub_materi_terkait ?? JENIS_KESALAHAN_TAMPIL[salah.jenis].sub;
    return { teks: `Kamu sering keliru di: ${labelKesalahan(salah.jenis)}.`, href: `#/belajar/${sub}`, tombol: `Ulangi ${sub}` };
  }
  if (ringkasan?.sub_materi_lanjut) {
    return { teks: '', href: `#/belajar/${ringkasan.sub_materi_lanjut}`, tombol: 'Lanjut belajar' };
  }
  return { teks: 'Semua sub-bab sudah selesai. Coba latihan atau kuis.', href: '#/latihan', tombol: 'Buka Latihan' };
}
