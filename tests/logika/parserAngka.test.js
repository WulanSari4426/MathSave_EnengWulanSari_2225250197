import { describe, expect, it } from 'vitest';
import { formatAngka, formatRupiah, uraiAngka } from '../../src/logika/parserAngka.js';
import { GalatMasukan } from '../../src/logika/galat.js';

describe('uraiAngka', () => {
  it('contoh dari docs/api.md', () => {
    expect(uraiAngka('Rp1.200.000')).toBe(1_200_000);
    expect(uraiAngka('1200000')).toBe(1_200_000);
    expect(uraiAngka('2,5')).toBe(2.5);
    expect(uraiAngka('6%')).toBe(6);
    expect(uraiAngka('abc')).toBeNull();
  });

  it('mengabaikan Rp, spasi, dan huruf besar/kecil', () => {
    expect(uraiAngka('Rp 80.000')).toBe(80_000);
    expect(uraiAngka('rp80.000')).toBe(80_000);
    expect(uraiAngka('Rp. 80.000')).toBe(80_000);
    expect(uraiAngka('  150 000 ')).toBe(150_000);
    expect(uraiAngka('6 %')).toBe(6);
  });

  it('titik dengan kelompok 3 angka = ribuan', () => {
    expect(uraiAngka('1.500')).toBe(1_500);
    expect(uraiAngka('12.345.678')).toBe(12_345_678);
  });

  it('satu titik yang bukan pola ribuan = desimal (keyboard ponsel)', () => {
    expect(uraiAngka('2.5')).toBe(2.5);
    expect(uraiAngka('0.06')).toBe(0.06);
  });

  it('format Indonesia lengkap: titik ribuan + koma desimal', () => {
    expect(uraiAngka('1.200.000,5')).toBe(1_200_000.5);
    expect(uraiAngka(',5')).toBe(0.5);
  });

  it('koma lebih dari satu dengan kelompok 3 angka = ribuan (format Inggris)', () => {
    expect(uraiAngka('1,200,000')).toBe(1_200_000);
  });

  it('tanda minus diterima', () => {
    expect(uraiAngka('-5')).toBe(-5);
    expect(uraiAngka('-Rp5.000')).toBe(-5_000);
    expect(Object.is(uraiAngka('-0'), 0)).toBe(true);
  });

  it('menerima angka biasa', () => {
    expect(uraiAngka(42)).toBe(42);
    expect(uraiAngka(NaN)).toBeNull();
    expect(uraiAngka(Infinity)).toBeNull();
  });

  it('mengembalikan null untuk teks yang tidak valid', () => {
    for (const teks of ['', '   ', 'Rp', '%', '1.2.3', '1,2,3', '12.34.567', '5,', '1.200,5,1', '1..2', '2x', '--5', null, undefined, {}]) {
      expect(uraiAngka(teks)).toBeNull();
    }
  });
});

describe('formatAngka', () => {
  it('contoh dari docs/api.md', () => {
    expect(formatAngka(2.5)).toBe('2,5');
    expect(formatAngka(1_200_000)).toBe('1.200.000');
  });

  it('maksimal 2 desimal secara bawaan, nol di akhir dibuang', () => {
    expect(formatAngka(2 / 3)).toBe('0,67');
    expect(formatAngka(6)).toBe('6');
    expect(formatAngka(1.5, 4)).toBe('1,5');
    expect(formatAngka(1_234.5678, 0)).toBe('1.235');
  });

  it('angka negatif', () => {
    expect(formatAngka(-1_500.25)).toBe('-1.500,25');
    expect(formatAngka(-0.001)).toBe('0');
  });

  it('menolak nilai bukan angka', () => {
    expect(() => formatAngka('5')).toThrow(GalatMasukan);
    expect(() => formatAngka(NaN)).toThrow(GalatMasukan);
  });
});

describe('formatRupiah', () => {
  it('contoh dari docs/api.md', () => {
    expect(formatRupiah(80_000)).toBe('Rp80.000');
  });

  it('dibulatkan ke rupiah terdekat (KF-09)', () => {
    expect(formatRupiah(74_013.8889)).toBe('Rp74.014');
    expect(formatRupiah(166_666.4)).toBe('Rp166.666');
    expect(formatRupiah(0)).toBe('Rp0');
    expect(formatRupiah(999)).toBe('Rp999');
  });

  it('angka negatif', () => {
    expect(formatRupiah(-5_000)).toBe('-Rp5.000');
    expect(formatRupiah(-0.4)).toBe('Rp0');
  });

  it('menolak nilai bukan angka', () => {
    expect(() => formatRupiah(undefined)).toThrow('Nilai yang akan ditampilkan harus berupa angka.');
  });
});
