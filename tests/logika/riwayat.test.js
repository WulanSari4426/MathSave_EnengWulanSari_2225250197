// Fase 10 — logika Beranda dan Riwayat (src/logika/riwayat.js).
import { describe, test, expect } from 'vitest';
import {
  labelKesalahan, formatTanggal, barisAktivitas, saranBerikutnya, JENIS_KESALAHAN_TAMPIL,
} from '../../src/logika/riwayat.js';

describe('Riwayat (F-10)', () => {
  test('jenis kesalahan punya label Indonesia dan sub-bab terkait sesuai api.md 3.9', () => {
    expect(JENIS_KESALAHAN_TAMPIL.SATUAN_WAKTU.sub).toBe('M3');
    expect(JENIS_KESALAHAN_TAMPIL.PERSEN.sub).toBe('P0');
    expect(JENIS_KESALAHAN_TAMPIL.TERTUKAR_BUNGA_TABUNGAN.sub).toBe('M4');
    expect(JENIS_KESALAHAN_TAMPIL.RUMUS_INVERS.sub).toBe('M5');
    expect(labelKesalahan('SATUAN_WAKTU')).toMatch(/Satuan waktu/);
    expect(labelKesalahan('LAINNYA')).toBe('Kesalahan lain');
  });

  test('baris kuis bertaut ke hasilnya; baris latihan menampilkan benar/jumlah', () => {
    expect(barisAktivitas({ jenis: 'kuis', waktu: '2026-11-20T08:15:00+07:00', skor: 70, percobaan_ke: 1, sesi_kuis_id: 'a2b9' }))
      .toEqual({ tanggal: formatTanggal('2026-11-20T08:15:00+07:00'), judul: 'Kuis (percobaan 1)', hasil: 'Nilai 70', href: '#/kuis/hasil/a2b9' });
    expect(barisAktivitas({ jenis: 'latihan', waktu: '2026-11-19T19:02:00+07:00', sub_materi: 'M3', tingkat: 2, benar: 4, jumlah: 5 }))
      .toMatchObject({ judul: 'Latihan M3 · sedang', hasil: '4/5 benar', href: null });
    expect(formatTanggal('bukan tanggal')).toBe('');
    expect(formatTanggal('2026-11-20T12:00:00Z')).toMatch(/20/);
  });

  test('satu saran langkah berikutnya: kesalahan tersering dulu, lalu sub-bab berikutnya', () => {
    expect(saranBerikutnya({ kesalahan_tersering: [{ jenis: 'SATUAN_WAKTU', jumlah: 4, sub_materi_terkait: 'M3' }], sub_materi_lanjut: 'M4' }))
      .toMatchObject({ href: '#/belajar/M3', tombol: 'Ulangi M3' });
    expect(saranBerikutnya({ kesalahan_tersering: [], sub_materi_lanjut: 'M4' }))
      .toEqual({ teks: '', href: '#/belajar/M4', tombol: 'Lanjut belajar' });
    expect(saranBerikutnya({ kesalahan_tersering: [], sub_materi_lanjut: null }).href).toBe('#/latihan');
  });
});
