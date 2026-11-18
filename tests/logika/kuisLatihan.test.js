// Fase 8–9 — logika latihan dan kuis di perangkat (src/logika/latihan.js, src/logika/kuis.js).
import { describe, test, expect } from 'vitest';
import {
  labelJawaban, pecahSorotan, susunDiketahui, ringkasLatihan, durasiDetik, PILIHAN_DITANYA,
} from '../../src/logika/latihan.js';
import {
  hitungSelisihJam, sisaWaktuMs, formatSisaWaktu, perluPengingat, petaTersimpan, antreJawaban,
  cocokkanAntrean, statusSoal, jawabanBerlaku, ringkasStatus, teksKonfirmasi, teksStatusJawaban,
  samaJawaban, teksCaraSelesai, DURASI_KUIS_MS,
} from '../../src/logika/kuis.js';
import { pesanGalatRpc, PESAN_GALAT_RPC } from '../../src/logika/pesanGalat.js';
import { KODE_RPC, tafsirkanGalatRpc } from '../../src/layanan/api.js';

describe('Latihan (F-05, F-06, F-08)', () => {
  test('label kolom jawaban sesuai satuan', () => {
    expect(labelJawaban('rupiah')).toBe('Jawabanmu (Rp)');
    expect(labelJawaban('persen')).toBe('Jawabanmu (% per tahun)');
    expect(labelJawaban('bulan')).toBe('Jawabanmu (bulan)');
  });

  test('sorotan petunjuk level 1 memecah teks tanpa mengubah isinya', () => {
    const teks = 'Rani menabung Rp2.000.000 dengan suku bunga 6% per tahun selama 8 bulan.';
    const bagian = pecahSorotan(teks, ['Rp2.000.000', '6% per tahun', '8 bulan', 'tidak ada']);
    expect(bagian.map((b) => b.teks).join('')).toBe(teks);
    expect(bagian.filter((b) => b.sorot).map((b) => b.teks)).toEqual(['Rp2.000.000', '6% per tahun', '8 bulan']);
    expect(pecahSorotan(teks, null)).toEqual([{ teks, sorot: false }]);
  });

  test('sorotan yang tumpang-tindih tidak membuat potongan ganda', () => {
    const bagian = pecahSorotan('6 bulan dan 6% per tahun', ['6% per tahun', '6 bulan']);
    expect(bagian.filter((b) => b.sorot).map((b) => b.teks)).toEqual(['6 bulan', '6% per tahun']);
  });

  test('Pahami Soal: hanya kolom yang diisi dikirim, format Indonesia diurai', () => {
    expect(susunDiketahui({ modal: 'Rp2.000.000', suku_bunga: '6', lama: '8', satuan_lama: 'bulan', bunga: '' }))
      .toEqual({ ok: true, diketahui: { modal: 2000000, suku_bunga: 6, lama: 8, satuan_lama: 'bulan' } });
    expect(susunDiketahui({ modal: 'dua juta' })).toEqual({ ok: false, kunci: 'modal' });
    expect(susunDiketahui({ satuan_lama: 'bulan' })).toEqual({ ok: true, diketahui: {} });
    expect(PILIHAN_DITANYA.map((d) => d.nilai)).toEqual(['bunga', 'tabungan_akhir', 'modal', 'suku_bunga', 'lama']);
  });

  test('ringkasan 5 soal dan durasi', () => {
    const r = ringkasLatihan([
      { benarPertama: true, pernahBenar: true, petunjuk: 0, dicoba: true },
      { benarPertama: false, pernahBenar: true, petunjuk: 2, dicoba: true },
      { benarPertama: false, pernahBenar: false, petunjuk: 3, dicoba: true },
      { benarPertama: false, pernahBenar: false, petunjuk: 0, dicoba: false },
    ]);
    expect(r).toEqual({ jumlahSoal: 4, dikerjakan: 3, benarPertama: 1, pernahBenar: 2, petunjuk: 5 });
    expect(durasiDetik(1000, 4600)).toBe(4);
    expect(durasiDetik(5000, 1000)).toBe(0);
  });
});

describe('Timer kuis berbasis waktu server (KF-11)', () => {
  const mulai = '2026-11-20T08:00:00+07:00';
  const batas = '2026-11-20T08:30:00+07:00';

  test('sisa waktu memakai selisih jam server, bukan jam perangkat', () => {
    // Jam ponsel 10 menit lebih cepat dari server.
    const jamPonsel = Date.parse(mulai) + 10 * 60 * 1000;
    const selisih = hitungSelisihJam(mulai, jamPonsel);
    expect(selisih).toBe(-10 * 60 * 1000);
    expect(sisaWaktuMs(batas, jamPonsel, selisih)).toBe(DURASI_KUIS_MS);
    // 18 menit kemudian (jam perangkat terus berjalan, termasuk saat offline)
    expect(formatSisaWaktu(sisaWaktuMs(batas, jamPonsel + 18 * 60 * 1000, selisih))).toBe('12:00');
  });

  test('mengubah jam ponsel setelah kuis dimulai tidak menambah waktu sesungguhnya bagi server', () => {
    const selisih = hitungSelisihJam(mulai, Date.parse(mulai));
    // Siswa memundurkan jam 1 jam: tampilan bertambah, tetapi server tetap menolak setelah batas (diuji di tests/db).
    expect(sisaWaktuMs(batas, Date.parse(batas) + 1000, selisih)).toBe(0);
  });

  test('format mm:ss dibulatkan ke atas, tidak pernah negatif', () => {
    expect(formatSisaWaktu(DURASI_KUIS_MS)).toBe('30:00');
    expect(formatSisaWaktu(1)).toBe('00:01');
    expect(formatSisaWaktu(-5000)).toBe('00:00');
    expect(sisaWaktuMs('bukan tanggal', 0, 0)).toBe(0);
    expect(hitungSelisihJam('bukan tanggal', 123)).toBe(0);
  });

  test('pengingat 5 menit hanya sekali, termasuk saat dibuka dengan sisa < 5 menit (KF-16 B1)', () => {
    expect(perluPengingat(5 * 60 * 1000 + 1, false)).toBe(false);
    expect(perluPengingat(5 * 60 * 1000, false)).toBe(true);
    expect(perluPengingat(2 * 60 * 1000, false)).toBe(true);
    expect(perluPengingat(2 * 60 * 1000, true)).toBe(false);
    expect(perluPengingat(0, false)).toBe(false);
  });
});

describe('Jawaban offline dan status nomor (KF-20, KF-22)', () => {
  const soal = [{ id: 'a', nomor: 1 }, { id: 'b', nomor: 2 }, { id: 'c', nomor: 3 }, { id: 'd', nomor: 4 }];
  const tersimpan = petaTersimpan([
    { soal_id: 'a', jawaban: null, opsi: 'o2' },
    { soal_id: 'b', jawaban: 80000, opsi: null },
  ]);

  test('antrean menyimpan pilihan terakhir saja; status tidak pernah benar/salah', () => {
    let antrean = antreJawaban({}, 'c', { opsi: 'o1' });
    antrean = antreJawaban(antrean, 'c', { opsi: 'o3' });
    expect(antrean).toEqual({ c: { jawaban: null, opsi: 'o3' } });
    expect(statusSoal('a', tersimpan, antrean)).toBe('tersimpan');
    expect(statusSoal('c', tersimpan, antrean)).toBe('belum_terkirim');
    expect(statusSoal('d', tersimpan, antrean)).toBe('belum_dijawab');
    expect(teksStatusJawaban('tersimpan')).toBe('✓ Tersimpan');
    expect(teksStatusJawaban('belum_terkirim')).toBe('⏳ Belum terkirim');
    expect(teksStatusJawaban('belum_dijawab')).toBe('');
  });

  test('mengubah jawaban yang sudah tersimpan saat offline → "Belum terkirim", dan yang berlaku jawaban baru', () => {
    const antrean = antreJawaban({}, 'a', { opsi: 'o4' });
    expect(statusSoal('a', tersimpan, antrean)).toBe('belum_terkirim');
    expect(jawabanBerlaku('a', tersimpan, antrean)).toEqual({ jawaban: null, opsi: 'o4' });
  });

  test('saat tersambung lagi, antrean yang ternyata sudah diterima server dibuang', () => {
    const antrean = { a: { jawaban: null, opsi: 'o2' }, b: { jawaban: 80000.0, opsi: null }, c: { jawaban: null, opsi: 'o1' } };
    expect(cocokkanAntrean(antrean, tersimpan)).toEqual({ c: { jawaban: null, opsi: 'o1' } });
    expect(samaJawaban({ jawaban: '80000', opsi: null }, { jawaban: 80000, opsi: null })).toBe(true);
    expect(samaJawaban(null, tersimpan.a)).toBe(false);
  });

  test('ringkasan panel nomor dan dialog Selesai Kuis (KF-16 A1)', () => {
    const antrean = { c: { jawaban: null, opsi: 'o1' } };
    const r = ringkasStatus(soal, tersimpan, antrean);
    expect(r).toEqual({ tersimpan: [1, 2], belum_terkirim: [3], belum_dijawab: [4] });
    expect(teksKonfirmasi(r)).toEqual([
      'Masih ada 1 soal belum dijawab: no. 4. Yakin ingin mengumpulkan?',
      '1 jawaban belum terkirim dan belum tersimpan di server.',
      'Soal yang tidak dijawab dihitung salah.',
    ]);
    expect(teksKonfirmasi({ tersimpan: [1, 2, 3, 4], belum_terkirim: [], belum_dijawab: [] }))
      .toEqual(['Semua soal sudah dijawab. Kumpulkan sekarang?']);
    expect(teksCaraSelesai('waktu_habis')).toBe('Dikumpulkan: waktu habis');
    expect(teksCaraSelesai('siswa')).toBe('Dikumpulkan olehmu');
  });
});

describe('Galat RPC (api.md bagian 4)', () => {
  test('setiap kode punya pesan Indonesia; kode tak dikenal → gangguan umum', () => {
    for (const kode of KODE_RPC) expect(PESAN_GALAT_RPC[kode], kode).toBeTruthy();
    expect(pesanGalatRpc('APA_SAJA')).toBe(PESAN_GALAT_RPC.GALAT_SERVER);
  });

  test('pesan PostgreSQL berupa kode dikenali; galat fetch menjadi galat jaringan', () => {
    expect(tafsirkanGalatRpc({ message: 'BANK_SOAL_KURANG' })).toBe('BANK_SOAL_KURANG');
    expect(tafsirkanGalatRpc({ message: 'OPSI_TIDAK_VALID' })).toBe('OPSI_TIDAK_VALID');
    expect(tafsirkanGalatRpc({ message: 'TypeError: Failed to fetch' })).toBe('GALAT_JARINGAN');
    expect(tafsirkanGalatRpc({ message: 'boom' })).toBe('GALAT_SERVER');
  });
});
