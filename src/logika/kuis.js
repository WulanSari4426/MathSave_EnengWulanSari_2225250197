/**
 * Logika kuis di perangkat (PRD F-07; KF-11, KF-16, KF-17, KF-20, KF-22). Modul murni, tanpa DOM.
 *
 * Prinsip:
 *  - Server satu-satunya penentu waktu habis dan jawaban sah (KF-11 T4, KF-20 J1, J6).
 *  - Sisa waktu di layar = batas_waktu − (jam perangkat + selisih), selisih dihitung dari waktu_server
 *    saat respons diterima, sehingga hitungan mundur tetap berjalan saat offline (T2).
 *  - Antrean offline menyimpan PILIHAN TERAKHIR per soal saja (KF-22) dan tidak pernah menyimpan
 *    benar/salah atau kunci.
 */

export const DURASI_KUIS_MS = 30 * 60 * 1000;
export const BATAS_PENGINGAT_MS = 5 * 60 * 1000;
export const JUMLAH_SOAL = 20;

/** selisih = waktu server − jam perangkat saat respons diterima (ms). */
export function hitungSelisihJam(waktuServerIso, jamPerangkatMs) {
  const server = Date.parse(waktuServerIso);
  return Number.isFinite(server) ? server - jamPerangkatMs : 0;
}

/** Sisa waktu (ms, ≥ 0) menurut perkiraan jam server. */
export function sisaWaktuMs(batasWaktuIso, jamPerangkatMs, selisih) {
  const batas = Date.parse(batasWaktuIso);
  if (!Number.isFinite(batas)) return 0;
  return Math.max(0, batas - (jamPerangkatMs + selisih));
}

/** "24:13" — detik dibulatkan ke atas agar 0:00 hanya tampil saat waktu benar-benar habis. */
export function formatSisaWaktu(ms) {
  const detik = Math.max(0, Math.ceil(ms / 1000));
  const menit = Math.floor(detik / 60);
  return `${String(menit).padStart(2, '0')}:${String(detik % 60).padStart(2, '0')}`;
}

/** Pengingat 5 menit muncul SEKALI (KF-16 B1), termasuk saat kuis dibuka dengan sisa < 5 menit. */
export function perluPengingat(sisaMs, sudahDitampilkan) {
  return !sudahDitampilkan && sisaMs > 0 && sisaMs <= BATAS_PENGINGAT_MS;
}

// ---------------------------------------------------------------------------
// Jawaban: tersimpan di server vs antrean di perangkat
// ---------------------------------------------------------------------------

/** jawaban_tersimpan dari server → { [soalId]: { jawaban, opsi } }. */
export function petaTersimpan(jawabanTersimpan = []) {
  const peta = {};
  for (const j of jawabanTersimpan ?? []) {
    peta[j.soal_id] = { jawaban: j.jawaban ?? null, opsi: j.opsi ?? null };
  }
  return peta;
}

export function samaJawaban(a, b) {
  if (!a || !b) return false;
  if (a.opsi || b.opsi) return a.opsi === b.opsi;
  return a.jawaban !== null && b.jawaban !== null && Number(a.jawaban) === Number(b.jawaban);
}

/** Menambah/mengganti pilihan terakhir untuk satu soal (KF-22: hanya pilihan terakhir). */
export function antreJawaban(antrean, soalId, jawaban) {
  return { ...antrean, [soalId]: { jawaban: jawaban.jawaban ?? null, opsi: jawaban.opsi ?? null } };
}

/**
 * Setelah tersambung lagi: buang antrean yang ternyata sudah diterima server
 * (balasan bisa hilang walaupun permintaan sampai, PRD F-07 "Penerapan").
 */
export function cocokkanAntrean(antrean, tersimpan) {
  const sisa = {};
  for (const [soalId, j] of Object.entries(antrean ?? {})) {
    if (!samaJawaban(j, tersimpan[soalId])) sisa[soalId] = j;
  }
  return sisa;
}

/** 'belum_terkirim' | 'tersimpan' | 'belum_dijawab' (KF-22 N1d). Tidak pernah benar/salah. */
export function statusSoal(soalId, tersimpan, antrean) {
  if (antrean?.[soalId]) return 'belum_terkirim';
  if (tersimpan?.[soalId]) return 'tersimpan';
  return 'belum_dijawab';
}

export const LABEL_STATUS = Object.freeze({
  tersimpan: { ikon: '✓', teks: 'Tersimpan' },
  belum_terkirim: { ikon: '⏳', teks: 'Belum terkirim' },
  belum_dijawab: { ikon: '○', teks: 'Belum dijawab' },
});

/** Jawaban yang sedang berlaku untuk tampilan: antrean (lebih baru) atau yang tersimpan. */
export function jawabanBerlaku(soalId, tersimpan, antrean) {
  return antrean?.[soalId] ?? tersimpan?.[soalId] ?? null;
}

/**
 * Ringkasan untuk panel nomor dan dialog Selesai Kuis.
 * @param {Array<{id: string, nomor: number}>} soal
 */
export function ringkasStatus(soal, tersimpan, antrean) {
  const hasil = { tersimpan: [], belum_terkirim: [], belum_dijawab: [] };
  for (const s of soal) hasil[statusSoal(s.id, tersimpan, antrean)].push(s.nomor);
  return hasil;
}

/** Teks dialog konfirmasi Selesai Kuis (KF-16 A1; design.md 5.9a). */
export function teksKonfirmasi(ringkas) {
  const kosong = ringkas.belum_dijawab;
  const baris = [];
  baris.push(kosong.length === 0
    ? 'Semua soal sudah dijawab. Kumpulkan sekarang?'
    : `Masih ada ${kosong.length} soal belum dijawab: no. ${kosong.join(', ')}. Yakin ingin mengumpulkan?`);
  if (ringkas.belum_terkirim.length > 0) {
    baris.push(`${ringkas.belum_terkirim.length} jawaban belum terkirim dan belum tersimpan di server.`);
  }
  if (kosong.length > 0) baris.push('Soal yang tidak dijawab dihitung salah.');
  return baris;
}

/** Teks status di bawah soal (design.md 5.9d): tanpa teks jika belum dijawab. */
export function teksStatusJawaban(status) {
  if (status === 'tersimpan') return '✓ Tersimpan';
  if (status === 'belum_terkirim') return '⏳ Belum terkirim';
  return '';
}

/** Galat yang berarti perangkat sedang offline (jawaban tetap di antrean). */
export const GALAT_OFFLINE = Object.freeze(['GALAT_JARINGAN']);

/** Keterangan cara pengumpulan untuk hasil (design.md 5.9). */
export function teksCaraSelesai(cara) {
  return cara === 'waktu_habis' ? 'Dikumpulkan: waktu habis' : 'Dikumpulkan olehmu';
}
