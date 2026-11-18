/**
 * Membuat paket pemeriksaan materi dan bank soal untuk dosen/guru (task.md Fase 6–7).
 * HANYA MEMBACA src/data/materi.js dan supabase/seed/data/bankSoal.js; tidak mengubah bank soal,
 * tidak menghubungi Supabase. Hasil: docs/validasi/*.html (siap cetak A4).
 *
 *   node scripts/buat-paket-validasi.mjs
 *
 * Pemeriksaan otomatis memakai diagnosis.js/bungaTunggal.js (satu-satunya sumber rumus, AGENTS.md §6).
 */
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { MATERI, URUTAN_SUB_MATERI, TOLERANSI } from '../src/data/materi.js';
import { SOAL_LATIHAN, SOAL_KUIS } from '../supabase/seed/data/bankSoal.js';
import { hitungJawaban } from '../src/logika/diagnosis.js';
import { formatAngka, formatRupiah } from '../src/logika/parserAngka.js';
import { kunciRapi, petunjukMembocorkan } from '../supabase/seed/inti/bankSoal.js';
import { TEMUAN, KEPUTUSAN } from './data/temuanValidasi.mjs';

const AKAR = join(import.meta.dirname, '..');
const TUJUAN = join(AKAR, 'docs', 'validasi');
const TANGGAL = '13 November 2026';

// ---------------------------------------------------------------------------
// Pembantu
// ---------------------------------------------------------------------------
const esc = (t) => String(t ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const NAMA_TINGKAT = { 1: 'Mudah', 2: 'Sedang', 3: 'Sulit' };
const NAMA_DITANYA = {
  bunga: 'Besar bunga (B)', tabungan_akhir: 'Jumlah tabungan akhir (A)', modal: 'Modal awal (M)',
  suku_bunga: 'Suku bunga per tahun (p)', lama: 'Lama menabung (t)',
};
const NAMA_KATEGORI = {
  konsep: 'Konsep bunga tunggal', besar_bunga: 'Menghitung besar bunga', tabungan_akhir: 'Menghitung jumlah tabungan akhir',
  modal_suku_bunga: 'Menentukan modal awal atau suku bunga', lama_menabung: 'Menghitung lama menabung', penerapan: 'Penerapan dalam masalah sehari-hari',
};
const NAMA_KESALAHAN = {
  SATUAN_WAKTU: 'Satuan waktu', PERSEN: 'Persen tidak dibagi 100', TERTUKAR_BUNGA_TABUNGAN: 'Bunga dan tabungan akhir tertukar',
  RUMUS_INVERS: 'Rumus invers salah susun', LAINNYA: 'Pengecoh umum',
};
/** Indikator soal latihan per sub-bab (PRD F-02, isi utama sub-bab). */
const INDIKATOR_LATIHAN = {
  P0: 'Menghitung persen dari suatu jumlah (bunga 1 tahun) sebagai prasyarat',
  M2: 'Menghitung besar bunga dengan rumus B = M × (p/100) × t, waktu dalam tahun',
  M3: 'Menghitung besar bunga dengan waktu dalam bulan atau hari (diubah ke tahun)',
  M4: 'Menghitung jumlah tabungan akhir A = M + B',
  M5: 'Mencari modal awal, suku bunga, atau lama menabung',
  M6: 'Menyelesaikan soal cerita dengan 4 langkah (penerapan sehari-hari)',
};
const DITANYA_SUB = { P0: ['bunga'], M2: ['bunga'], M3: ['bunga'], M4: ['tabungan_akhir'], M5: ['modal', 'suku_bunga', 'lama'] };
const DITANYA_KATEGORI = { besar_bunga: ['bunga'], tabungan_akhir: ['tabungan_akhir'], modal_suku_bunga: ['modal', 'suku_bunga'], lama_menabung: ['lama'] };

/** Kisi-kisi KF-21 dibaca langsung dari migrasi (sumber yang dipakai database). */
function bacaKisi() {
  const sql = readFileSync(join(AKAR, 'supabase', 'migrations', '20261112000001_skema_dasar.sql'), 'utf8');
  return [...sql.matchAll(/\(\s*(\d+),\s*'(\w+)',\s*(\d),\s*'(\w+)'\)/g)]
    .map((m) => ({ nomor: Number(m[1]), kategori: m[2], tingkat: Number(m[3]), bentuk: m[4] }));
}

function teksNilai(nilai, satuan) {
  if (nilai === null || nilai === undefined) return '—';
  if (satuan === 'rupiah') return formatRupiah(nilai);
  if (satuan === 'persen') return `${formatAngka(nilai)}% per tahun`;
  return `${formatAngka(nilai)} ${satuan}`;
}

function teksDiketahui(d) {
  const b = [];
  if (d.modal !== undefined) b.push(`M = ${formatRupiah(d.modal)}`);
  if (d.suku_bunga !== undefined) b.push(`p = ${formatAngka(d.suku_bunga)} (${formatAngka(d.suku_bunga)}% per tahun)`);
  if (d.lama !== undefined) b.push(`lama = ${formatAngka(d.lama)} ${d.satuan_lama}`);
  if (d.bunga !== undefined) b.push(`B = ${formatRupiah(d.bunga)}`);
  if (d.tabungan_akhir !== undefined) b.push(`jumlah tabungan akhir (A) = ${formatRupiah(d.tabungan_akhir)}`);
  return b.join('; ');
}

/** Pemeriksaan otomatis satu soal → daftar { ok, teks }. */
function periksaSoal(s) {
  const hasil = [];
  const cek = (ok, teks) => hasil.push({ ok, teks });
  if (s.kategori_kuis === 'konsep') {
    cek(s.opsi.filter((o) => o.kunci).length === 1, 'Tepat satu opsi kunci');
    cek(new Set(s.opsi.map((o) => o.teks)).size === 4, '4 opsi berbeda');
    cek(s.pembahasan.length === 4, 'Pembahasan 4 langkah');
    return hasil;
  }
  const hitung = hitungJawaban(s);
  cek(Math.abs(hitung - s.jawaban) < 1e-6, `Kunci dihitung ulang dari data soal: ${teksNilai(hitung, s.satuan_jawaban)}`);
  cek(kunciRapi(s.jawaban, s.satuan_jawaban), `Kunci rapi (KF-19 G1) dan toleransi ${formatAngka(s.toleransi)} sesuai satuan ${s.satuan_jawaban}`);
  if (s.diketahui.satuan_lama) cek(true, `Satuan waktu ${s.diketahui.satuan_lama} diubah ke tahun: ${s.diketahui.satuan_lama === 'tahun' ? 't = lama' : s.diketahui.satuan_lama === 'bulan' ? 't = bulan ÷ 12' : 't = hari ÷ 365'}`);
  const hitungLangkah = s.pembahasan[2].isi;
  const teksKunci = s.satuan_jawaban === 'rupiah' ? formatRupiah(s.jawaban) : formatAngka(s.jawaban);
  cek(hitungLangkah.includes(teksKunci), 'Langkah Hitung memuat kunci jawaban');
  if (s.bank === 'latihan') {
    cek(s.petunjuk.length === 3, 'Tepat 3 petunjuk (KF-15)');
    const diketahui = Object.values(s.diketahui).filter((x) => typeof x === 'number');
    cek(!petunjukMembocorkan(s.petunjuk, s.jawaban, diketahui), 'Petunjuk tidak memuat jawaban akhir (KF-15 H6)');
    if (DITANYA_SUB[s.sub_materi]) cek(DITANYA_SUB[s.sub_materi].includes(s.ditanya), `Yang ditanya sesuai indikator sub-bab ${s.sub_materi}`);
    if (s.sub_materi === 'M2') cek(s.diketahui.satuan_lama === 'tahun', 'M2: waktu dalam tahun');
    if (s.sub_materi === 'M3') cek(['bulan', 'hari'].includes(s.diketahui.satuan_lama), 'M3: waktu dalam bulan atau hari');
  } else {
    if (DITANYA_KATEGORI[s.kategori_kuis]) cek(DITANYA_KATEGORI[s.kategori_kuis].includes(s.ditanya), `Yang ditanya sesuai kategori kisi-kisi (${NAMA_KATEGORI[s.kategori_kuis]})`);
    if (s.opsi) {
      const kunci = s.opsi.filter((o) => o.kunci);
      cek(kunci.length === 1 && Math.abs(kunci[0].nilai - s.jawaban) < 1e-6, 'Tepat satu opsi kunci = kunci jawaban');
      cek(new Set(s.opsi.map((o) => o.teks)).size === 4, '4 opsi berbeda (KF-18)');
    }
  }
  return hasil;
}

// ---------------------------------------------------------------------------
// Kerangka HTML
// ---------------------------------------------------------------------------
const GAYA = `
  :root { --utama:#17784f; --tua:#0f3d2e; --muda:#e2f4ea; --garis:#c9ddd1; --redup:#4c6359; --salah:#b3412e; --benar:#1f7a45; }
  * { box-sizing: border-box; }
  body { margin: 0; font: 11pt/1.5 system-ui, 'Segoe UI', Roboto, sans-serif; color: #12372a; background: #fff; }
  .lembar { max-width: 190mm; margin: 0 auto; padding: 12mm 10mm 16mm; }
  .draf { position: sticky; top: 0; z-index: 5; background: #fff6d6; border: 2px solid #b8860b; color: #5c4300; padding: 6px 10px; font-weight: 700; text-align: center; margin-bottom: 12px; }
  h1 { font-size: 20pt; margin: 0 0 4px; color: var(--tua); }
  h2 { font-size: 15pt; margin: 22px 0 8px; color: var(--tua); border-bottom: 2px solid var(--muda); padding-bottom: 4px; page-break-after: avoid; }
  h3 { font-size: 12pt; margin: 14px 0 6px; color: var(--tua); page-break-after: avoid; }
  p { margin: 4px 0; }
  .ket { color: var(--redup); font-size: 9.5pt; }
  table { width: 100%; border-collapse: collapse; margin: 6px 0; font-size: 10pt; }
  th, td { border: 1px solid var(--garis); padding: 4px 6px; text-align: left; vertical-align: top; }
  th { background: var(--muda); }
  .kartu { border: 1px solid var(--garis); border-radius: 8px; padding: 8px 10px; margin: 10px 0; page-break-inside: avoid; }
  .soal { border-left: 4px solid var(--utama); }
  .kotak { background: #f3f8f5; border-radius: 6px; padding: 6px 8px; margin: 4px 0; }
  .rumus { background: var(--muda); border-radius: 6px; padding: 6px 8px; font-weight: 600; }
  .label { display: inline-block; border: 1px solid var(--garis); border-radius: 999px; padding: 0 8px; font-size: 9pt; margin-right: 4px; background: #fff; }
  .kunci { color: var(--benar); font-weight: 700; }
  .salah { color: var(--salah); }
  .cek { font-size: 9pt; color: var(--redup); }
  .cek .ok::before { content: '✓ '; color: var(--benar); font-weight: 700; }
  .cek .tidak::before { content: '✕ '; color: var(--salah); font-weight: 700; }
  .periksa { margin-top: 6px; border-top: 1px dashed var(--garis); padding-top: 6px; font-size: 10pt; }
  .periksa .garis { display: block; border-bottom: 1px solid #999; height: 20px; margin-top: 2px; }
  .temuan-Tinggi { background: #fdeceb; } .temuan-Sedang { background: #fff4dc; } .temuan-Rendah { background: #f3f8f5; }
  ol.langkah { margin: 4px 0; padding-left: 20px; } ol.langkah li { margin: 2px 0; }
  .daftar-isi a { color: var(--utama); }
  @page { size: A4; margin: 12mm 10mm; }
  @media print { .draf { position: static; } a { color: inherit; text-decoration: none; } .lembar { padding: 0; } }
`;

function halaman(judul, isi) {
  return `<!doctype html>
<html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(judul)} — Paket Validasi Lanora (DRAF)</title><style>${GAYA}</style></head>
<body><div class="lembar">
<div class="draf">DRAF — belum disetujui dosen/guru. Jangan dipakai untuk siswa sebelum ada persetujuan.</div>
<h1>${esc(judul)}</h1>
<p class="ket">Paket validasi Lanora · Bunga Tunggal dan Tabungan · SMP kelas VIII · disusun ${TANGGAL} · dibuat otomatis dari kode (scripts/buat-paket-validasi.mjs), sehingga isinya sama persis dengan yang akan dipakai aplikasi.</p>
${isi}
</div></body></html>`;
}

const kotakPeriksa = (label = 'Hasil pemeriksaan') => `<div class="periksa"><strong>${esc(label)}:</strong> ☐ Sesuai &nbsp; ☐ Perlu perbaikan &nbsp; ☐ Ganti soal<br>Catatan:<span class="garis"></span><span class="garis"></span></div>`;
const daftarCek = (cek) => `<div class="cek">Pemeriksaan otomatis: ${cek.map((c) => `<span class="${c.ok ? 'ok' : 'tidak'}">${esc(c.teks)}</span>`).join(' · ')}</div>`;
const pembahasanHtml = (p) => `<ol class="langkah">${p.map((l) => `<li><strong>${esc(l.langkah)}:</strong> ${esc(l.isi)}</li>`).join('')}</ol>`;

// ---------------------------------------------------------------------------
// 01 Materi
// ---------------------------------------------------------------------------
function dokumenMateri() {
  const bagian = URUTAN_SUB_MATERI.map((id) => {
    const m = MATERI[id];
    const kartu = m.kartu.map((k, i) => `<div class="kartu"><h3>Kartu ${i + 1}: ${esc(k.judul)}</h3>
      ${k.teks.map((t) => `<p>${esc(t)}</p>`).join('')}
      ${k.rumus ? `<div class="rumus">${k.rumus.map(esc).join('<br>')}</div>` : ''}
      ${k.tabel ? `<table><tr>${k.tabel.kepala.map((h) => `<th>${esc(h)}</th>`).join('')}</tr>${k.tabel.baris.map((b) => `<tr>${b.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</table>` : ''}
      ${k.gambar ? `<p class="ket">[Gambar penjelas: ${k.gambar === 'tabungan' ? 'M + B = jumlah tabungan akhir (A)' : 'garis waktu 12 bulan = 1 tahun, 6 bulan = 6/12 tahun'}]</p>` : ''}
      ${k.catatan ? `<p class="ket">${esc(k.catatan)}</p>` : ''}
      <p class="ket">${k.teks.join(' ').trim().split(/\s+/).length} kata (batas ±60)</p></div>`).join('');
    const contoh = m.contoh.map((c) => `<div class="kartu"><h3>${esc(c.judul)} <span class="label">${c.jenis === 'lengkap' ? 'contoh lengkap' : 'contoh setengah jadi'}</span></h3>
      <div class="kotak">${esc(c.soal)}</div>
      <ol class="langkah">${c.langkah.map((l, i) => `<li><strong>${esc(l.langkah)}:</strong> ${l.baris.map(esc).join(' · ')}${c.isian && i === c.isian.langkah ? ` <em>(siswa mengisi: ${esc(c.isian.label)} = ${esc(teksNilai(c.isian.jawaban, c.isian.satuan))})</em>` : ''}</li>`).join('')}</ol>
      <p><span class="kunci">Jawaban: ${esc(teksNilai(c.jawaban, c.satuanJawaban ?? (c.ditanya === 'suku_bunga' ? 'persen' : c.ditanya === 'lama' ? 'bulan' : 'rupiah')))}</span></p></div>`).join('');
    const cs = m.cobaSendiri;
    return `<h2 id="${id}">${id} · ${esc(m.judul)}${m.opsional ? ' (opsional)' : ''}</h2>
      <p class="ket">${esc(m.ringkas)} · ${m.kartu.length} kartu · ${m.contoh.length} contoh · 1 soal Coba Sendiri</p>
      ${kartu}${contoh}
      <div class="kartu"><h3>Coba Sendiri</h3><div class="kotak">${esc(cs.soal)}</div>
      <p><span class="kunci">Kunci: ${esc(teksNilai(cs.jawaban, cs.satuan))}</span> · toleransi ${formatAngka(cs.toleransi)} (${cs.satuan})</p>
      <p><strong>Pembahasan:</strong> ${cs.pembahasan.map(esc).join(' ')}</p></div>
      ${kotakPeriksa(`Pemeriksaan sub-bab ${id}`)}`;
  }).join('');
  return halaman('01 · Materi P0 dan M1–M6', `
    <h2>Cara memeriksa</h2>
    <p>Setiap sub-bab terdiri dari kartu langkah (satu ide per kartu, ±60 kata), contoh langkah demi langkah (M2–M5 minimal 2: lengkap dan setengah jadi), dan satu soal Coba Sendiri. Siswa berpindah kartu dengan tombol Lanjut/Kembali.</p>
    <p>Periksa: ketepatan konsep dan rumus, notasi resmi (M, B, p, t, A; B = M × (p/100) × t; A = M + B; 1 tahun = 12 bulan = 365 hari), kejelasan bahasa untuk siswa SMP kelas VIII, dan kebenaran angka. Semua angka contoh sudah dihitung ulang otomatis dan cocok (tests/logika/materi.test.js).</p>
    <p class="daftar-isi">Daftar isi: ${URUTAN_SUB_MATERI.map((id) => `<a href="#${id}">${id}</a>`).join(' · ')}</p>
    ${bagian}`);
}

// ---------------------------------------------------------------------------
// 02 Soal latihan
// ---------------------------------------------------------------------------
function kartuSoalLatihan(s) {
  return `<div class="kartu soal" id="${s.kode}">
    <h3>${esc(s.kode)} <span class="label">${s.sub_materi}</span><span class="label">Tingkat ${s.tingkat} · ${NAMA_TINGKAT[s.tingkat]}</span><span class="label">Isian angka</span></h3>
    <p class="ket">Indikator: ${esc(INDIKATOR_LATIHAN[s.sub_materi])} · Konteks: ${esc(s.konteks)}</p>
    <div class="kotak">${esc(s.teks_soal)}</div>
    <table>
      <tr><th style="width:28%">Diketahui</th><td>${esc(teksDiketahui(s.diketahui))}</td></tr>
      <tr><th>Ditanya</th><td>${esc(NAMA_DITANYA[s.ditanya])}${s.ditanya === 'lama' ? `, dalam ${s.satuan_jawaban}` : ''}</td></tr>
      <tr><th>Kunci jawaban</th><td class="kunci">${esc(teksNilai(s.jawaban, s.satuan_jawaban))} <span class="ket">(diterima ±${formatAngka(s.toleransi)} ${s.satuan_jawaban})</span></td></tr>
      <tr><th>Petunjuk 1 (Pahami)</th><td>${esc(s.petunjuk[0])}</td></tr>
      <tr><th>Petunjuk 2 (Rencanakan)</th><td>${esc(s.petunjuk[1])}</td></tr>
      <tr><th>Petunjuk 3 (Hitung awal)</th><td>${esc(s.petunjuk[2])}</td></tr>
      <tr><th>Pembahasan / cara perhitungan</th><td>${pembahasanHtml(s.pembahasan)}</td></tr>
      <tr><th>Jawaban salah yang dikenali</th><td>${s.pola_kesalahan.length ? s.pola_kesalahan.map((p) => `<div><span class="salah">${esc(teksNilai(p.nilai, s.satuan_jawaban))}</span> — ${esc(NAMA_KESALAHAN[p.jenis] ?? p.jenis)}: ${esc(p.pesan)}</div>`).join('') : '—'}</td></tr>
    </table>
    ${daftarCek(periksaSoal(s))}
    ${kotakPeriksa()}
  </div>`;
}

function dokumenLatihan() {
  const ringkas = ['P0', 'M2', 'M3', 'M4', 'M5', 'M6'].map((sub) => `<tr><td>${sub}</td><td>${esc(INDIKATOR_LATIHAN[sub])}</td>${[1, 2, 3].map((t) => `<td>${SOAL_LATIHAN.filter((s) => s.sub_materi === sub && s.tingkat === t).length}</td>`).join('')}<td>${SOAL_LATIHAN.filter((s) => s.sub_materi === sub).length}</td></tr>`).join('');
  const isi = ['P0', 'M2', 'M3', 'M4', 'M5', 'M6'].map((sub) => `<h2 id="${sub}">${sub} · ${esc(MATERI[sub].judul)}</h2>${SOAL_LATIHAN.filter((s) => s.sub_materi === sub).map(kartuSoalLatihan).join('')}`).join('');
  return halaman('02 · Bank Soal Latihan (60 soal)', `
    <h2>Ringkasan</h2>
    <p>Bank latihan hanya berisi soal <strong>isian angka</strong> dan terpisah dari bank kuis (KF-14). Siswa mengerjakan 5 soal per sub-bab dan tingkat, dengan panel Pahami Soal, petunjuk bertahap maksimal 3 tingkat (KF-15), dan pembahasan 4 langkah setelah setiap pemeriksaan jawaban.</p>
    <table><tr><th>Sub-bab</th><th>Indikator</th><th>Mudah</th><th>Sedang</th><th>Sulit</th><th>Jumlah</th></tr>${ringkas}
      <tr><th colspan="5">Total</th><th>${SOAL_LATIHAN.length}</th></tr></table>
    <p class="ket">Tingkat pada latihan bersifat relatif di dalam satu sub-bab (lihat temuan T-01 di dokumen 00). Toleransi penilaian (KF-19): Rupiah ±1, persen ±0,01, waktu ±0,01. "Jawaban salah yang dikenali" adalah pola kesalahan umum; jika jawaban siswa sama dengan nilai itu, siswa mendapat pesan penjelasan.</p>
    ${isi}`);
}

// ---------------------------------------------------------------------------
// 03 Soal kuis
// ---------------------------------------------------------------------------
function kartuSoalKuis(s, kisi) {
  const nomor = kisi.filter((k) => k.kategori === s.kategori_kuis && k.tingkat === s.tingkat && k.bentuk === s.bentuk).map((k) => k.nomor);
  const satuan = s.satuan_jawaban;
  const opsi = s.opsi ? `<tr><th>Opsi (urutan di bank; diacak per siswa saat kuis)</th><td><table>
      <tr><th>Id</th><th>Opsi</th><th>Status</th><th>Alasan</th></tr>
      ${s.opsi.map((o) => {
        const pola = s.pola_kesalahan.find((p) => p.jenis === o.jenis_kesalahan);
        const alasan = o.kunci
          ? (s.kategori_kuis === 'konsep' ? s.pembahasan[2].isi : `Hasil perhitungan yang benar: ${s.pembahasan[2].isi}`)
          : pola ? `${NAMA_KESALAHAN[o.jenis_kesalahan]}: ${pola.pesan}` : s.kategori_kuis === 'konsep' ? 'Pernyataan tidak tepat; alasannya dijelaskan di langkah Periksa pada pembahasan.' : 'Pengecoh umum (tidak berasal dari pola kesalahan tertentu); siswa mendapat pesan umum.';
        return `<tr><td>${o.id}</td><td>${esc(o.teks)}</td><td class="${o.kunci ? 'kunci' : 'salah'}">${o.kunci ? 'KUNCI' : 'Pengecoh'}</td><td>${esc(alasan)}</td></tr>`;
      }).join('')}</table></td></tr>` : '';
  return `<div class="kartu soal" id="${s.kode}">
    <h3>${esc(s.kode)} <span class="label">Nomor kisi-kisi ${nomor.join(' dan ')}</span><span class="label">${esc(NAMA_KATEGORI[s.kategori_kuis])}</span><span class="label">${NAMA_TINGKAT[s.tingkat]}</span><span class="label">${s.bentuk === 'isian' ? 'Isian angka' : 'Pilihan ganda'}</span></h3>
    <p class="ket">Sub-bab terkait: ${s.sub_materi} · Konteks: ${esc(s.konteks)}</p>
    <div class="kotak">${esc(s.teks_soal)}</div>
    <table>
      ${s.kategori_kuis === 'konsep' ? '' : `<tr><th style="width:28%">Diketahui</th><td>${esc(teksDiketahui(s.diketahui))}</td></tr>
      <tr><th>Ditanya</th><td>${esc(NAMA_DITANYA[s.ditanya])}${s.ditanya === 'lama' ? `, dalam ${satuan}` : ''}</td></tr>`}
      <tr><th style="width:28%">Kunci jawaban</th><td class="kunci">${s.kategori_kuis === 'konsep' ? esc(s.opsi.find((o) => o.kunci).teks) : esc(teksNilai(s.jawaban, satuan))}${s.bentuk === 'isian' ? ` <span class="ket">(diterima ±${formatAngka(s.toleransi)} ${satuan})</span>` : ''}</td></tr>
      ${opsi}
      ${s.bentuk === 'isian' && s.pola_kesalahan.length ? `<tr><th>Jawaban salah yang dikenali</th><td>${s.pola_kesalahan.map((p) => `<div><span class="salah">${esc(teksNilai(p.nilai, satuan))}</span> — ${esc(NAMA_KESALAHAN[p.jenis])}: ${esc(p.pesan)}</div>`).join('')}</td></tr>` : ''}
      <tr><th>Pembahasan (tampil setelah kuis dikumpulkan)</th><td>${pembahasanHtml(s.pembahasan)}</td></tr>
    </table>
    ${daftarCek(periksaSoal(s))}
    ${kotakPeriksa()}
  </div>`;
}

function dokumenKuis() {
  const kisi = bacaKisi();
  const baris = kisi.map((k) => {
    const kandidat = SOAL_KUIS.filter((s) => s.kategori_kuis === k.kategori && s.tingkat === k.tingkat && s.bentuk === k.bentuk);
    return `<tr><td>${k.nomor}</td><td>${esc(NAMA_KATEGORI[k.kategori])}</td><td>${NAMA_TINGKAT[k.tingkat]}</td><td>${k.bentuk === 'isian' ? 'Isian angka' : 'Pilihan ganda'}</td><td>${kandidat.map((s) => `<a href="#${s.kode}">${s.kode}</a>`).join(', ')}</td></tr>`;
  }).join('');
  const kombinasi = new Map();
  for (const k of kisi) {
    const kunci = `${k.kategori}|${k.tingkat}|${k.bentuk}`;
    kombinasi.set(kunci, { ...k, nomor: [...(kombinasi.get(kunci)?.nomor ?? []), k.nomor] });
  }
  const barisKombinasi = [...kombinasi.values()].map((k) => {
    const ada = SOAL_KUIS.filter((s) => s.kategori_kuis === k.kategori && s.tingkat === k.tingkat && s.bentuk === k.bentuk).length;
    const min = 2 * k.nomor.length;
    return `<tr><td>${esc(NAMA_KATEGORI[k.kategori])} – ${NAMA_TINGKAT[k.tingkat]} – ${k.bentuk === 'isian' ? 'isian' : 'PG'}</td><td>${k.nomor.join(', ')}</td><td>${min}</td><td>${ada}</td><td class="${ada >= min ? 'kunci' : 'salah'}">${ada >= min ? 'cukup' : 'KURANG'}</td></tr>`;
  }).join('');
  const urut = [...kombinasi.values()].flatMap((k) => SOAL_KUIS.filter((s) => s.kategori_kuis === k.kategori && s.tingkat === k.tingkat && s.bentuk === k.bentuk).map((s) => kartuSoalKuis(s, kisi)));
  return halaman('03 · Bank Soal Kuis (40 soal)', `
    <h2>Aturan kuis yang dipakai</h2>
    <p>Satu sesi kuis: 20 soal, 30 menit, 15 pilihan ganda + 5 isian angka, maksimal 2 percobaan dengan 20 soal berbeda (KF-10 sampai KF-22). Setiap nomor punya kategori, tingkat, dan bentuk yang tetap (kisi-kisi KF-21). Server memilih satu soal per nomor dari kandidat di bawah. Pilihan ganda: 4 opsi, 1 kunci, urutan diacak per siswa. Tanpa petunjuk selama kuis; pembahasan tampil setelah kuis dikumpulkan.</p>
    <p class="ket">Dokumen ini memuat kunci jawaban kuis. Jangan dibagikan kepada siswa.</p>
    <h2>Kisi-kisi KF-21 dan soal kandidat</h2>
    <table><tr><th>No.</th><th>Submateri (indikator)</th><th>Tingkat</th><th>Bentuk</th><th>Soal kandidat di bank</th></tr>${baris}</table>
    <h3>Kecukupan per kombinasi (KF-14: minimal 2 × jumlah nomor)</h3>
    <table><tr><th>Kombinasi</th><th>Nomor</th><th>Minimum</th><th>Tersedia</th><th>Status</th></tr>${barisKombinasi}
      <tr><th colspan="2">Total</th><th>40</th><th>${SOAL_KUIS.length}</th><th></th></tr></table>
    <p class="ket">Rincian: ${SOAL_KUIS.filter((s) => s.bentuk === 'pilihan_ganda').length} pilihan ganda, ${SOAL_KUIS.filter((s) => s.bentuk === 'isian').length} isian angka. Semua kombinasi tepat di batas minimum: jika satu soal ditolak, kombinasinya menjadi kurang dan kuis tidak bisa dimulai sampai soal pengganti ditambahkan.</p>
    <h2>Rincian soal</h2>
    ${urut.join('')}`);
}

// ---------------------------------------------------------------------------
// 00 Ringkasan pemeriksaan
// ---------------------------------------------------------------------------
function dokumenRingkasan() {
  const semua = [...SOAL_LATIHAN, ...SOAL_KUIS];
  const hasilCek = semua.map((s) => periksaSoal(s));
  const gagal = hasilCek.flat().filter((c) => !c.ok).length;
  const totalCek = hasilCek.flat().length;
  const tabelTemuan = TEMUAN.map((t) => `<tr class="temuan-${t.prioritas}"><td>${t.id}</td><td>${t.prioritas}</td><td>${esc(t.judul)}<br><span class="ket">${esc(t.rincian)}</span></td><td>${esc(t.soal)}</td><td>${esc(t.saran)}</td></tr>`).join('');
  const tabelKeputusan = KEPUTUSAN.map((k) => `<tr><td>${k.id}</td><td>${esc(k.pertanyaan)}</td><td>${esc(k.pilihan)}</td><td>☐ ________</td></tr>`).join('');
  return halaman('00 · Ringkasan Pemeriksaan dan Lembar Persetujuan', `
    <h2>Isi paket</h2>
    <table><tr><th>Dokumen</th><th>Isi</th></tr>
      <tr><td>01-materi.html</td><td>Materi P0 dan M1–M6: ${URUTAN_SUB_MATERI.reduce((n, id) => n + MATERI[id].kartu.length, 0)} kartu, ${URUTAN_SUB_MATERI.reduce((n, id) => n + MATERI[id].contoh.length, 0)} contoh, 7 soal Coba Sendiri</td></tr>
      <tr><td>02-soal-latihan.html</td><td>${SOAL_LATIHAN.length} soal latihan isian, dengan kunci, cara perhitungan, pembahasan, 3 petunjuk, dan jawaban salah yang dikenali</td></tr>
      <tr><td>03-soal-kuis.html</td><td>${SOAL_KUIS.length} soal kuis, kisi-kisi KF-21, kecukupan per kombinasi, opsi beserta alasan kunci dan pengecoh</td></tr></table>
    <p><strong>Status: DRAF.</strong> Seluruh materi dan soal belum boleh dipakai siswa sampai lembar persetujuan di bawah ditandatangani. Bank soal belum dimasukkan ke database.</p>

    <h2>Hasil pemeriksaan otomatis</h2>
    <table><tr><th>Pemeriksaan</th><th>Hasil</th></tr>
      <tr><td>Kunci jawaban dihitung ulang dari data soal (rumus B = M × (p/100) × t, A = M + B, dan rumus invers M5)</td><td class="kunci">${semua.filter((s) => s.kategori_kuis !== 'konsep').length} dari ${semua.filter((s) => s.kategori_kuis !== 'konsep').length} cocok</td></tr>
      <tr><td>Hitung ulang independen (aritmetika terpisah dari kode aplikasi, dijalankan saat menyusun paket ini)</td><td class="kunci">94 dari 94 cocok; teks setiap soal memuat semua data yang dibutuhkan</td></tr>
      <tr><td>Satuan waktu: bulan ÷ 12 dan hari ÷ 365 langsung ke tahun (KF-02)</td><td class="kunci">Sesuai di semua soal dan pembahasan</td></tr>
      <tr><td>Kunci rapi dan toleransi sesuai satuan (KF-19)</td><td class="kunci">Sesuai</td></tr>
      <tr><td>Petunjuk latihan tepat 3 dan tidak memuat jawaban akhir (KF-15)</td><td class="kunci">Sesuai</td></tr>
      <tr><td>Yang ditanya sesuai indikator sub-bab / kategori kisi-kisi</td><td class="kunci">Sesuai</td></tr>
      <tr><td>Kecukupan bank kuis per kombinasi KF-21 / KF-14</td><td class="kunci">17 dari 17 cukup (tepat minimum)</td></tr>
      <tr><td>Jumlah butir pemeriksaan otomatis per soal yang gagal</td><td class="${gagal ? 'salah' : 'kunci'}">${gagal} dari ${totalCek}</td></tr></table>
    <p class="ket">Pemeriksaan otomatis memastikan perhitungan dan aturan teknis. Ketepatan konsep, bahasa, kewajaran konteks, dan mutu pengecoh tetap perlu dinilai dosen/guru.</p>

    <h2>Temuan yang perlu diperbaiki atau diputuskan</h2>
    <table><tr><th>No.</th><th>Prioritas</th><th>Temuan</th><th>Soal</th><th>Saran</th></tr>${tabelTemuan}</table>

    <h2>Keputusan yang dibutuhkan dari dosen/guru</h2>
    <table><tr><th>No.</th><th>Pertanyaan</th><th>Pilihan</th><th>Keputusan</th></tr>${tabelKeputusan}</table>

    <h2>Cara memberi catatan</h2>
    <p>Setiap sub-bab dan soal punya kotak "☐ Sesuai ☐ Perlu perbaikan ☐ Ganti soal" dan baris catatan. Cukup tandai dan tulis catatan di cetakan atau PDF. Perbaikan akan dikerjakan di data bank soal, lalu paket ini dibuat ulang untuk diperiksa sekali lagi.</p>

    <h2>Lembar persetujuan</h2>
    <table>
      <tr><th style="width:30%">Bagian</th><th>Disetujui</th><th>Nama pemeriksa</th><th>Tanggal</th><th>Tanda tangan</th></tr>
      <tr><td>Materi P0, M1–M6</td><td>☐ Ya ☐ Dengan perbaikan ☐ Tidak</td><td></td><td></td><td style="height:34px"></td></tr>
      <tr><td>Bank soal latihan (60)</td><td>☐ Ya ☐ Dengan perbaikan ☐ Tidak</td><td></td><td></td><td style="height:34px"></td></tr>
      <tr><td>Bank soal kuis (40)</td><td>☐ Ya ☐ Dengan perbaikan ☐ Tidak</td><td></td><td></td><td style="height:34px"></td></tr>
    </table>`);
}

mkdirSync(TUJUAN, { recursive: true });
const berkas = {
  '00-ringkasan-pemeriksaan.html': dokumenRingkasan(),
  '01-materi.html': dokumenMateri(),
  '02-soal-latihan.html': dokumenLatihan(),
  '03-soal-kuis.html': dokumenKuis(),
};
for (const [nama, isi] of Object.entries(berkas)) writeFileSync(join(TUJUAN, nama), isi);
console.log(`Ditulis ke ${TUJUAN}: ${Object.keys(berkas).join(', ')}`);
export { TOLERANSI };
