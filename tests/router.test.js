import { describe, expect, it } from 'vitest';
import { ambilJalur, cocokkanRute } from '../src/router.js';
import { DAFTAR_RUTE } from '../src/rute.js';

describe('ambilJalur', () => {
  it('mengubah hash menjadi jalur', () => {
    expect(ambilJalur('#/belajar/M3')).toBe('/belajar/M3');
  });

  it('mengembalikan "/" untuk hash kosong', () => {
    expect(ambilJalur('')).toBe('/');
    expect(ambilJalur('#')).toBe('/');
    expect(ambilJalur('#/')).toBe('/');
  });

  it('membuang query dan garis miring di akhir', () => {
    expect(ambilJalur('#/latihan/?a=1')).toBe('/latihan');
  });

  it('menambahkan garis miring di awal bila tidak ada', () => {
    expect(ambilJalur('#beranda')).toBe('/beranda');
  });
});

describe('cocokkanRute', () => {
  it('mencocokkan 4 menu utama', () => {
    for (const jalur of ['/beranda', '/belajar', '/latihan', '/riwayat']) {
      expect(cocokkanRute(jalur, DAFTAR_RUTE)?.rute.pola).toBe(jalur);
    }
  });

  it('mengambil parameter dari jalur', () => {
    const hasil = cocokkanRute('/latihan/M3/2', DAFTAR_RUTE);
    expect(hasil.rute.pola).toBe('/latihan/:subMateri/:tingkat');
    expect(hasil.parameter).toEqual({ subMateri: 'M3', tingkat: '2' });
  });

  it('membedakan /kuis dan /kuis/hasil/:sesiKuisId', () => {
    expect(cocokkanRute('/kuis', DAFTAR_RUTE).rute.pola).toBe('/kuis');
    const hasil = cocokkanRute('/kuis/hasil/abc', DAFTAR_RUTE);
    expect(hasil.rute.pola).toBe('/kuis/hasil/:sesiKuisId');
    expect(hasil.parameter.sesiKuisId).toBe('abc');
  });

  it('mengembalikan null untuk jalur yang tidak dikenal atau rusak', () => {
    expect(cocokkanRute('/tidak-ada', DAFTAR_RUTE)).toBeNull();
    expect(cocokkanRute('/belajar/%E0%A4%A', DAFTAR_RUTE)).toBeNull();
  });

  it('menyembunyikan navigasi bawah saat mengerjakan soal, kuis, dan materi', () => {
    for (const jalur of ['/masuk', '/belajar/M1', '/latihan/M3/2', '/kuis']) {
      expect(cocokkanRute(jalur, DAFTAR_RUTE).rute.navigasi).toBe(false);
    }
  });
});
