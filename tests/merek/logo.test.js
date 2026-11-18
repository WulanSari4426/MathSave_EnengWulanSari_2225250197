// Rebranding Lanora: logo, favicon, ikon, dan manifest konsisten dengan token warna.
import { describe, test, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { WARNA_HEKS, emblemSvg, emblemLanora, logoLengkapSvg } from '../../src/komponen/logo.js';

const akar = join(import.meta.dirname, '..', '..');
const baca = (jalur) => readFileSync(join(akar, jalur));
const css = baca('src/gaya/utama.css').toString();
const token = (nama) => css.match(new RegExp(`--${nama}:\\s*(#[0-9a-fA-F]{6})`))[1].toUpperCase();

describe('Logo Lanora', () => {
  test('warna file mandiri sama dengan token CSS', () => {
    expect(WARNA_HEKS).toEqual({
      latar: token('warna-utama'),
      tua: token('warna-utama-tua'),
      kertas: token('warna-kartu'),
      aksen: token('warna-utama-lembut'),
      manik: token('aksen-kuning'),
    });
  });

  test('emblem di aplikasi memakai token CSS dan dekoratif secara bawaan', () => {
    const svg = emblemLanora();
    expect(svg).toContain('var(--warna-utama)');
    expect(svg).toContain('aria-hidden="true"');
    expect(svg).not.toMatch(/#[0-9A-F]{6}/i);
    expect(emblemLanora({ label: 'Lanora' })).toContain('aria-label="Lanora"');
  });

  test('public/favicon.svg sama dengan hasil generator (tidak disunting manual)', () => {
    expect(baca('public/favicon.svg').toString()).toBe(emblemSvg({ sederhana: true, sudut: 26 }));
    expect(baca('public/logo-lanora.svg').toString()).toBe(logoLengkapSvg());
  });

  test.each([['ikon-192', 192], ['ikon-512', 512], ['apple-touch-icon', 180]])(
    'public/%s.png berukuran %ipx',
    (nama, ukuran) => {
      const png = baca(`public/${nama}.png`);
      expect(png.subarray(1, 4).toString()).toBe('PNG');
      expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([ukuran, ukuran]);
    },
  );

  test('manifest memakai nama Lanora dan ikon yang ada', () => {
    const manifest = JSON.parse(baca('public/manifest.webmanifest').toString());
    expect(manifest.name).toBe('Lanora');
    for (const ikon of manifest.icons) expect(() => baca(`public/${ikon.src}`)).not.toThrow();
  });

  test('index.html memakai nama Lanora, tanpa MathSave', () => {
    const html = baca('index.html').toString();
    expect(html).toContain('<title>Lanora</title>');
    expect(html).toContain('rel="manifest"');
    expect(html).not.toMatch(/mathsave/i);
  });
});
