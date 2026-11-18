/**
 * Generator baris tabel `soal` (task.md Fase 7). Modul murni, diuji Vitest.
 *
 * - Jawaban dan pola kesalahan dihitung src/logika/diagnosis.js (memakai bungaTunggal.js),
 *   bukan ditulis tangan (architecture.md: skrip seed menghitung jawaban dan pola_kesalahan).
 * - Toleransi per satuan (KF-19 F1) dan pemeriksaan kunci rapi (KF-19 G1).
 * - Petunjuk tepat 3 tingkat tanpa jawaban akhir (KF-15 H3–H6), hanya bank latihan.
 * - Pembahasan 4 langkah Pahami → Rencanakan → Hitung → Periksa (KF-15 H9, F-03).
 * - Pilihan ganda: tepat 4 opsi o1–o4, 1 kunci + 3 pengecoh dari pola kesalahan (KF-18).
 * - Notasi KF-03: M, B, p, t, A; B = M × (p/100) × t; A = M + B. 1 tahun = 365 hari (KF-02).
 */
import { hitungJawaban, hitungPolaKesalahan } from '../../../src/logika/diagnosis.js';
import { hitungBunga, keTahun } from '../../../src/logika/bungaTunggal.js';
import { formatAngka, formatRupiah, uraiAngka } from '../../../src/logika/parserAngka.js';

export const TOLERANSI = Object.freeze({ rupiah: 1, persen: 0.01, tahun: 0.01, bulan: 0.01, hari: 0.01 });

const DITANYA_ISTILAH = {
  bunga: 'besar bunga (B)',
  tabungan_akhir: 'jumlah tabungan akhir (A)',
  modal: 'modal awal (M)',
  suku_bunga: 'suku bunga per tahun (p)',
  lama: 'lama menabung',
};

const rp = (n) => formatRupiah(n);
const angka = (n) => formatAngka(n);
/** Teks t untuk rumus: 3 → "3", 8 bulan → "(8/12)", 73 hari → "(73/365)". */
const teksT = (lama, satuan) => (satuan === 'tahun' ? angka(lama) : `(${lama}/${satuan === 'bulan' ? 12 : 365})`);
const teksLama = (lama, satuan) => `${angka(lama)} ${satuan}`;

/** Kunci jawaban isian harus "rapi" (KF-19 G1). */
export function kunciRapi(nilai, satuan) {
  if (!Number.isFinite(nilai) || nilai <= 0) return false;
  if (satuan === 'rupiah' || satuan === 'tahun' || satuan === 'bulan' || satuan === 'hari') {
    return Math.abs(nilai - Math.round(nilai)) < 1e-9;
  }
  if (satuan === 'persen') return Math.abs(nilai * 10 - Math.round(nilai * 10)) < 1e-9;
  return false;
}

/** Angka dalam teks petunjuk yang sama dengan jawaban dan tidak berasal dari data soal → bocor (H6). */
export function petunjukMembocorkan(petunjuk, jawaban, angkaDiketahui) {
  for (const teks of petunjuk) {
    for (const token of teks.match(/\d[\d.,]*/g) ?? []) {
      const nilai = uraiAngka(token.replace(/[.,]$/, ''));
      if (nilai === null) continue;
      if (Math.abs(nilai - jawaban) < 1e-9 && !angkaDiketahui.some((d) => Math.abs(d - nilai) < 1e-9)) return true;
    }
  }
  return false;
}

/**
 * Nilai lengkap dari spesifikasi: semua soal dibuat dari M, p, lama, satuan yang benar,
 * lalu bagian yang ditanya disembunyikan.
 */
function nilaiLengkap({ modal, p, lama, satuan }) {
  const bunga = hitungBunga({ modal, sukuBunga: p, lama, satuan });
  return { modal, p, lama, satuan, bunga, akhir: modal + bunga, tahun: keTahun(lama, satuan) };
}

function bentukDiketahui(v, ditanya, dari) {
  const waktu = { lama: v.lama, satuan_lama: v.satuan };
  const hasilKnown = dari === 'tabungan_akhir' ? { tabungan_akhir: v.akhir } : { bunga: v.bunga };
  switch (ditanya) {
    case 'bunga':
    case 'tabungan_akhir':
      return { modal: v.modal, suku_bunga: v.p, ...waktu };
    case 'modal':
      return { ...hasilKnown, suku_bunga: v.p, ...waktu };
    case 'suku_bunga':
      return { modal: v.modal, ...hasilKnown, ...waktu };
    case 'lama':
      return { modal: v.modal, suku_bunga: v.p, ...hasilKnown };
    default:
      throw new Error(`ditanya tidak dikenal: ${ditanya}`);
  }
}

// ---------------------------------------------------------------------------
// Teks soal
// ---------------------------------------------------------------------------

function teksSoal(v, ditanya, dari, k, satuanJawaban, templat) {
  const { nama, tempat } = k;
  const lama = teksLama(v.lama, v.satuan);
  const hasilKalimat = dari === 'tabungan_akhir'
    ? `jumlah tabungannya menjadi ${rp(v.akhir)}`
    : `ia mendapat bunga ${rp(v.bunga)}`;

  if (templat === 'p0') {
    return `${tempat[0].toUpperCase()}${tempat.slice(1)} memberi bunga ${angka(v.p)}% per tahun. Berapa bunga selama 1 tahun untuk tabungan ${rp(v.modal)}?`;
  }
  if (templat === 'beli' && ditanya === 'lama') {
    return `${nama} ingin membeli ${k.barang} seharga ${rp(v.akhir)}. Ia menabung ${rp(v.modal)} di ${tempat} dengan suku bunga ${angka(v.p)}% per tahun. Setelah berapa ${satuanJawaban} jumlah tabungannya tepat cukup untuk membeli ${k.barang}?`;
  }
  if (templat === 'beli' && ditanya === 'modal') {
    return `${nama} ingin punya ${rp(v.akhir)} untuk membeli ${k.barang} setelah menabung ${lama}. Suku bunga di ${tempat} ${angka(v.p)}% per tahun. Berapa modal awal yang harus ${nama} tabung sekarang?`;
  }
  if (templat === 'beli' && ditanya === 'tabungan_akhir') {
    return `${nama} menabung ${rp(v.modal)} di ${tempat} untuk membeli ${k.barang}. Suku bunganya ${angka(v.p)}% per tahun. Berapa jumlah tabungan akhir ${nama} setelah ${lama}?`;
  }
  switch (ditanya) {
    case 'bunga':
      return `${nama} menabung ${rp(v.modal)} di ${tempat} dengan suku bunga ${angka(v.p)}% per tahun. Berapa besar bunga yang ${nama} peroleh setelah ${lama}?`;
    case 'tabungan_akhir':
      return `${nama} menabung ${rp(v.modal)} di ${tempat} dengan suku bunga ${angka(v.p)}% per tahun. Berapa jumlah tabungan ${nama} setelah ${lama}?`;
    case 'modal':
      return dari === 'tabungan_akhir'
        ? `Setelah menabung ${lama} di ${tempat} dengan suku bunga ${angka(v.p)}% per tahun, jumlah tabungan ${nama} menjadi ${rp(v.akhir)}. Berapa modal awal ${nama}?`
        : `${nama} menabung di ${tempat} dengan suku bunga ${angka(v.p)}% per tahun. Setelah ${lama}, ia mendapat bunga ${rp(v.bunga)}. Berapa modal awal ${nama}?`;
    case 'suku_bunga':
      return `${nama} menabung ${rp(v.modal)} di ${tempat}. Setelah ${lama}, ${hasilKalimat}. Berapa suku bunga per tahunnya?`;
    case 'lama':
      return `${nama} menabung ${rp(v.modal)} di ${tempat} dengan suku bunga ${angka(v.p)}% per tahun. Setelah beberapa waktu, ${hasilKalimat}. Berapa ${satuanJawaban} ${nama} menabung?`;
    default:
      throw new Error(ditanya);
  }
}

function sorotanDari(teks, v, diketahui) {
  const calon = [];
  if ('modal' in diketahui) calon.push(rp(v.modal));
  if ('suku_bunga' in diketahui) calon.push(`${angka(v.p)}% per tahun`);
  if ('lama' in diketahui) calon.push(teksLama(v.lama, v.satuan));
  if ('bunga' in diketahui) calon.push(rp(v.bunga));
  if ('tabungan_akhir' in diketahui) calon.push(rp(v.akhir));
  return calon.filter((c) => teks.includes(c));
}

// ---------------------------------------------------------------------------
// Petunjuk (latihan) dan pembahasan
// ---------------------------------------------------------------------------

function kalimatDiketahui(v, diketahui) {
  const bagian = [];
  if ('modal' in diketahui) bagian.push(`modal awal M = ${rp(v.modal)}`);
  if ('suku_bunga' in diketahui) bagian.push(`suku bunga p = ${angka(v.p)} (${angka(v.p)}% per tahun)`);
  if ('lama' in diketahui) bagian.push(`lama menabung ${teksLama(v.lama, v.satuan)}`);
  if ('bunga' in diketahui) bagian.push(`besar bunga B = ${rp(v.bunga)}`);
  if ('tabungan_akhir' in diketahui) bagian.push(`jumlah tabungan akhir (A) = ${rp(v.akhir)}`);
  return bagian.join(', ');
}

function ditanyaTeks(ditanya, satuanJawaban) {
  return ditanya === 'lama' ? `lama menabung (dalam ${satuanJawaban})` : DITANYA_ISTILAH[ditanya];
}

function rumusUntuk(ditanya, dari) {
  switch (ditanya) {
    case 'bunga': return 'B = M × (p/100) × t';
    case 'tabungan_akhir': return 'B = M × (p/100) × t, lalu A = M + B';
    case 'modal': return dari === 'tabungan_akhir' ? 'M = A ÷ (1 + (p/100) × t)' : 'M = B ÷ ((p/100) × t)';
    case 'suku_bunga': return dari === 'tabungan_akhir' ? 'B = A − M, lalu p = (B × 100) ÷ (M × t)' : 'p = (B × 100) ÷ (M × t)';
    case 'lama': return dari === 'tabungan_akhir' ? 'B = A − M, lalu t = (B × 100) ÷ (M × p)' : 't = (B × 100) ÷ (M × p)';
    default: throw new Error(ditanya);
  }
}

function petunjuk(v, ditanya, dari, diketahui, satuanJawaban) {
  const p1 = `Diketahui: ${kalimatDiketahui(v, diketahui)}. Yang ditanya: ${ditanyaTeks(ditanya, satuanJawaban)}.`;
  const ubahWaktu = 'lama' in diketahui && v.satuan !== 'tahun' ? ' Ingat, t harus dalam tahun.' : '';
  const p2 = `Gunakan rumus ${rumusUntuk(ditanya, dari)}.${ubahWaktu}${ditanya === 'lama' && satuanJawaban !== 'tahun' ? ` Hasil t dalam tahun, lalu ubah ke ${satuanJawaban}.` : ''}`;

  let p3;
  const langkahWaktu = 'lama' in diketahui && v.satuan !== 'tahun'
    ? `Ubah dulu ${teksLama(v.lama, v.satuan)} menjadi tahun: t = ${v.lama}/${v.satuan === 'bulan' ? 12 : 365}. `
    : '';
  switch (ditanya) {
    case 'bunga':
    case 'tabungan_akhir':
      p3 = `${langkahWaktu}Lalu masukkan M = ${angka(v.modal)} dan p = ${angka(v.p)} ke rumus B = M × (p/100) × t.`;
      if (ditanya === 'tabungan_akhir') p3 += ' Setelah B didapat, tambahkan ke modal awal.';
      break;
    case 'modal':
      p3 = `${langkahWaktu}Hitung dulu (p/100) × t = (${angka(v.p)}/100) × ${teksT(v.lama, v.satuan)}. Lalu bagi ${dari === 'tabungan_akhir' ? 'jumlah tabungan akhir dengan (1 + hasil itu)' : 'besar bunga dengan hasil itu'}.`;
      break;
    case 'suku_bunga':
      p3 = `${langkahWaktu}${dari === 'tabungan_akhir' ? `Cari besar bunga dulu: B = ${angka(v.akhir)} − ${angka(v.modal)}. ` : ''}Kalikan besar bunga dengan 100, lalu bagi dengan M × t.`;
      break;
    case 'lama':
      p3 = `${dari === 'tabungan_akhir' ? `Cari besar bunga dulu: B = ${angka(v.akhir)} − ${angka(v.modal)}. ` : ''}Kalikan besar bunga dengan 100, lalu bagi dengan M × p = ${angka(v.modal)} × ${angka(v.p)}.`;
      break;
    default:
      throw new Error(ditanya);
  }
  return [p1, p2, p3];
}

function pembahasan(v, ditanya, dari, diketahui, satuanJawaban, jawaban) {
  const tT = teksT(v.lama, v.satuan);
  const pahami = `Diketahui ${kalimatDiketahui(v, diketahui)}. Ditanya: ${ditanyaTeks(ditanya, satuanJawaban)}.`;
  const waktu = v.satuan === 'tahun' ? `t = ${angka(v.lama)} tahun.` : `Lama menabung dalam ${v.satuan}, jadi t = ${v.lama}/${v.satuan === 'bulan' ? 12 : 365} tahun.`;
  const rencana = `${'lama' in diketahui ? `${waktu} ` : ''}Rumus: ${rumusUntuk(ditanya, dari)}.`;
  const bungaDulu = dari === 'tabungan_akhir' && (ditanya === 'suku_bunga' || ditanya === 'lama')
    ? `B = ${angka(v.akhir)} − ${angka(v.modal)} = ${angka(v.bunga)}. ` : '';

  let hitung;
  let periksa;
  const cekBalik = `B = ${angka(v.modal)} × (${angka(v.p)}/100) × ${tT} = ${rp(v.bunga)}`;
  switch (ditanya) {
    case 'bunga': {
      hitung = `B = ${angka(v.modal)} × (${angka(v.p)}/100) × ${tT} = ${angka(jawaban)}. Jadi besar bunga ${rp(jawaban)}.`;
      const setahun = (v.modal * v.p) / 100;
      if (v.tahun < 1) periksa = `Bunga 1 tahun = ${rp(setahun)}. Lama menabung kurang dari 1 tahun, jadi bunganya lebih kecil. ${rp(jawaban)} masuk akal.`;
      else if (v.tahun > 1) periksa = `Bunga 1 tahun = ${rp(setahun)}. Untuk ${angka(v.tahun)} tahun, bunganya ${angka(v.tahun)} × ${rp(setahun)} = ${rp(jawaban)}. Cocok.`;
      else periksa = `Bunga 1 tahun adalah ${angka(v.p)}% dari modal awal, yaitu ${rp(jawaban)}. Cocok.`;
      break;
    }
    case 'tabungan_akhir':
      hitung = `B = ${angka(v.modal)} × (${angka(v.p)}/100) × ${tT} = ${angka(v.bunga)}. A = ${angka(v.modal)} + ${angka(v.bunga)} = ${angka(jawaban)}. Jadi jumlah tabungan akhir ${rp(jawaban)}.`;
      periksa = `Jumlah tabungan akhir lebih besar dari modal awal, dan A − M = ${rp(v.bunga)} sama dengan besar bunga. Cocok.`;
      break;
    case 'modal':
      hitung = dari === 'tabungan_akhir'
        ? `(p/100) × t = (${angka(v.p)}/100) × ${tT} = ${angka(v.bunga / v.modal, 4)}. M = ${angka(v.akhir)} ÷ (1 + ${angka(v.bunga / v.modal, 4)}) = ${angka(jawaban)}. Jadi modal awal ${rp(jawaban)}.`
        : `(p/100) × t = (${angka(v.p)}/100) × ${tT} = ${angka(v.bunga / v.modal, 4)}. M = ${angka(v.bunga)} ÷ ${angka(v.bunga / v.modal, 4)} = ${angka(jawaban)}. Jadi modal awal ${rp(jawaban)}.`;
      periksa = `Masukkan kembali: ${cekBalik}${dari === 'tabungan_akhir' ? `, dan M + B = ${rp(v.akhir)}` : ''}. Sama dengan soal.`;
      break;
    case 'suku_bunga':
      hitung = `${bungaDulu}p = (${angka(v.bunga)} × 100) ÷ (${angka(v.modal)} × ${tT}) = ${angka(jawaban)}. Jadi suku bunganya ${angka(jawaban)}% per tahun.`;
      periksa = `Masukkan kembali: ${cekBalik}. Sama dengan soal.`;
      break;
    case 'lama': {
      const ubah = satuanJawaban === 'tahun' ? ''
        : ` Ubah ke ${satuanJawaban}: ${angka(v.tahun, 4)} × ${satuanJawaban === 'bulan' ? 12 : 365} = ${angka(jawaban)} ${satuanJawaban}.`;
      hitung = `${bungaDulu}t = (${angka(v.bunga)} × 100) ÷ (${angka(v.modal)} × ${angka(v.p)}) = ${angka(v.tahun, 4)} tahun.${ubah} Jadi lama menabung ${angka(jawaban)} ${satuanJawaban}.`;
      periksa = `Masukkan kembali: ${cekBalik}. Sama dengan soal.`;
      break;
    }
    default:
      throw new Error(ditanya);
  }
  return [
    { langkah: 'Pahami', isi: pahami },
    { langkah: 'Rencanakan', isi: rencana },
    { langkah: 'Hitung', isi: hitung },
    { langkah: 'Periksa', isi: periksa },
  ];
}

// ---------------------------------------------------------------------------
// Soal isian dan pilihan ganda
// ---------------------------------------------------------------------------

/**
 * @param {object} s
 * @param {string} s.kode
 * @param {'P0'|'M1'|'M2'|'M3'|'M4'|'M5'|'M6'} s.sub
 * @param {1|2|3} s.tingkat
 * @param {'latihan'|'kuis'} s.bank
 * @param {string} [s.kategori] kategori_kuis (wajib untuk bank kuis)
 * @param {{nama: string, tempat: string, barang?: string}} s.konteks
 * @param {'bunga'|'tabungan_akhir'|'modal'|'suku_bunga'|'lama'} s.ditanya
 * @param {number} s.modal  @param {number} s.p  @param {number} s.lama  @param {'tahun'|'bulan'|'hari'} s.satuan
 * @param {'bunga'|'tabungan_akhir'} [s.dari='bunga'] nilai hasil yang diketahui (untuk modal/p/lama)
 * @param {'biasa'|'p0'|'beli'} [s.templat='biasa']
 */
export function buatSoalIsian(s) {
  const { kode, sub, tingkat, bank, kategori = null, konteks, ditanya, dari = 'bunga', templat = 'biasa' } = s;
  const v = nilaiLengkap(s);
  const satuanJawaban = { bunga: 'rupiah', tabungan_akhir: 'rupiah', modal: 'rupiah', suku_bunga: 'persen' }[ditanya] ?? v.satuan;
  const diketahui = bentukDiketahui(v, ditanya, dari);
  const dasar = { diketahui, ditanya, satuan_jawaban: satuanJawaban, toleransi: TOLERANSI[satuanJawaban] };

  const jawaban = hitungJawaban(dasar);
  const kebenaran = { bunga: v.bunga, tabungan_akhir: v.akhir, modal: v.modal, suku_bunga: v.p, lama: v.lama }[ditanya];
  if (Math.abs(jawaban - kebenaran) > 1e-6) throw new Error(`${kode}: jawaban ${jawaban} ≠ nilai asal ${kebenaran}`);
  if (!kunciRapi(jawaban, satuanJawaban)) throw new Error(`${kode}: kunci tidak rapi (${jawaban} ${satuanJawaban})`);
  for (const nilai of [v.bunga, v.akhir]) {
    if ((ditanya !== 'bunga' && ditanya !== 'tabungan_akhir') && !Number.isInteger(nilai)) {
      throw new Error(`${kode}: data rupiah pada soal harus bulat (${nilai})`);
    }
  }

  const teks = teksSoal(v, ditanya, dari, konteks, satuanJawaban, templat);
  const angkaDiketahui = Object.values(diketahui).filter((x) => typeof x === 'number');
  const baris = {
    kode,
    sub_materi: sub,
    tingkat,
    bank,
    bentuk: 'isian',
    opsi: null,
    kategori_kuis: bank === 'kuis' ? kategori : null,
    konteks: konteks.tempat,
    teks_soal: teks,
    sorotan: sorotanDari(teks, v, diketahui),
    diketahui,
    ditanya,
    satuan_jawaban: satuanJawaban,
    jawaban: Math.round(jawaban * 100) / 100,
    toleransi: TOLERANSI[satuanJawaban],
    petunjuk: null,
    pembahasan: pembahasan(v, ditanya, dari, diketahui, satuanJawaban, jawaban),
    pola_kesalahan: hitungPolaKesalahan(dasar).map((p) => ({ ...p, nilai: Math.round(p.nilai * 10000) / 10000 })),
  };
  if (bank === 'latihan') {
    baris.petunjuk = petunjuk(v, ditanya, dari, diketahui, satuanJawaban);
    if (petunjukMembocorkan(baris.petunjuk, jawaban, angkaDiketahui)) throw new Error(`${kode}: petunjuk memuat jawaban akhir`);
  }
  return baris;
}

/** Teks opsi sesuai satuan jawaban. */
export function teksOpsi(nilai, satuan) {
  if (satuan === 'rupiah') return rp(nilai);
  if (satuan === 'persen') return `${angka(nilai)}% per tahun`;
  return `${angka(nilai)} ${satuan}`;
}

/**
 * Pilihan ganda hitungan: 1 kunci + 3 pengecoh. Pengecoh diambil dari pola kesalahan
 * (jenis tercatat), lalu ditambah calon manual berjenis LAINNYA bila kurang dari 3 (PRD F-07).
 * Letak kunci di bank diputar (`letakKunci` 0–3); urutan tampil diacak lagi per sesi oleh server.
 */
export function buatSoalPilihanGanda(s, { letakKunci = 0 } = {}) {
  const dasar = buatSoalIsian({ ...s, bank: 'kuis' });
  const satuan = dasar.satuan_jawaban;
  const kunci = dasar.jawaban;
  const v = nilaiLengkap(s);
  const tampil = (n) => teksOpsi(n, satuan);
  const sudah = new Set([tampil(kunci)]);
  const pengecoh = [];
  const tambah = (nilai, jenis) => {
    if (pengecoh.length >= 3 || !Number.isFinite(nilai) || nilai <= 0) return;
    const nilaiTampil = satuan === 'rupiah' ? Math.round(nilai) : Math.round(nilai * 100) / 100;
    const t = tampil(nilaiTampil);
    if (sudah.has(t)) return;
    sudah.add(t);
    pengecoh.push({ nilai: nilaiTampil, jenis });
  };
  for (const p of dasar.pola_kesalahan) tambah(p.nilai, p.jenis);
  const calonLain = satuan === 'rupiah'
    ? [(v.modal * v.p) / 100, v.akhir, kunci * 2, kunci / 2, kunci + v.bunga]
    : satuan === 'persen' ? [kunci * 2, kunci / 2, kunci + 1, kunci + 2]
      : [kunci * 2, kunci + 1, kunci > 1 ? kunci - 1 : kunci + 2, kunci * 12];
  for (const n of calonLain) tambah(n, null);
  if (pengecoh.length < 3) throw new Error(`${s.kode}: pengecoh kurang dari 3`);

  const isi = [...pengecoh];
  isi.splice(letakKunci % 4, 0, { nilai: kunci, jenis: null, kunci: true });
  const opsi = isi.map((o, i) => ({
    id: `o${i + 1}`, teks: tampil(o.nilai), nilai: o.nilai, kunci: Boolean(o.kunci), jenis_kesalahan: o.kunci ? null : o.jenis,
  }));
  return { ...dasar, bentuk: 'pilihan_ganda', opsi, petunjuk: null };
}

/**
 * Pilihan ganda pernyataan (kategori konsep): opsi teks ditulis tangan, kunci ditandai langsung (PRD F-07 catatan).
 * @param {{kode, sub, tingkat, teks, opsi: Array<{teks: string, kunci?: boolean}>, pembahasan: string[4], ditanya?: string}} s
 */
export function buatSoalPernyataan(s) {
  if (s.opsi.length !== 4 || s.opsi.filter((o) => o.kunci).length !== 1) throw new Error(`${s.kode}: harus 4 opsi dengan 1 kunci`);
  if (s.pembahasan.length !== 4) throw new Error(`${s.kode}: pembahasan harus 4 langkah`);
  return {
    kode: s.kode,
    sub_materi: s.sub,
    tingkat: s.tingkat,
    bank: 'kuis',
    bentuk: 'pilihan_ganda',
    opsi: s.opsi.map((o, i) => ({ id: `o${i + 1}`, teks: o.teks, nilai: null, kunci: Boolean(o.kunci), jenis_kesalahan: null })),
    kategori_kuis: 'konsep',
    konteks: s.konteks ?? 'konsep',
    teks_soal: s.teks,
    sorotan: [],
    diketahui: {},
    ditanya: s.ditanya ?? 'bunga',
    satuan_jawaban: 'rupiah',
    jawaban: null,
    toleransi: null,
    petunjuk: null,
    pembahasan: ['Pahami', 'Rencanakan', 'Hitung', 'Periksa'].map((langkah, i) => ({ langkah, isi: s.pembahasan[i] })),
    pola_kesalahan: [],
  };
}

// ---------------------------------------------------------------------------
// SQL
// ---------------------------------------------------------------------------

const KOLOM = ['kode', 'sub_materi', 'tingkat', 'bank', 'bentuk', 'opsi', 'kategori_kuis', 'konteks', 'teks_soal',
  'sorotan', 'diketahui', 'ditanya', 'satuan_jawaban', 'jawaban', 'toleransi', 'petunjuk', 'pembahasan', 'pola_kesalahan'];
const KOLOM_JSON = new Set(['opsi', 'sorotan', 'diketahui', 'petunjuk', 'pembahasan', 'pola_kesalahan']);

function literal(nama, nilai) {
  if (nilai === null || nilai === undefined) return 'null';
  if (KOLOM_JSON.has(nama)) return `'${JSON.stringify(nilai).replaceAll("'", "''")}'::jsonb`;
  if (typeof nilai === 'number') return String(nilai);
  return `'${String(nilai).replaceAll("'", "''")}'`;
}

/** Satu file SQL: satu transaksi, aman dijalankan ulang (kode yang sudah ada dilewati). */
export function buatSql(daftar, { judul = 'Bank soal Lanora' } = {}) {
  const baris = daftar.map((s) => `insert into public.soal (${KOLOM.join(', ')})\nvalues (${KOLOM.map((k) => literal(k, s[k])).join(', ')})\non conflict (kode) do nothing;`);
  return `-- ${judul}\n-- DIBUAT OTOMATIS oleh supabase/seed/buat-bank-soal.js. Jangan disunting manual.\n-- STATUS: DRAF, wajib diperiksa dosen/guru sebelum dijalankan (task.md Fase 7).\n-- Jalankan di Supabase SQL Editor. Soal yang kodenya sudah ada dilewati (tidak ditimpa).\nbegin;\n\n${baris.join('\n\n')}\n\ncommit;\n`;
}
