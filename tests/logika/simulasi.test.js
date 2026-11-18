// Fase 11 — Simulasi (src/logika/simulasi.js) dan aturan pemuatan Three.js (AGENTS.md §5).
import { describe, test, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { bacaMasukanSimulasi, hitungSimulasi } from '../../src/logika/simulasi.js';

const AKAR = join(import.meta.dirname, '..', '..');
const baca = (p) => readFileSync(join(AKAR, p), 'utf8');

describe('Simulasi (F-04, design.md 5.8)', () => {
  test('contoh design.md: Rp1.000.000, 6% per tahun, 12 bulan → B = Rp60.000, A = Rp1.060.000', () => {
    const m = bacaMasukanSimulasi({ modal: '1.000.000', sukuBunga: '6', lama: '12', satuan: 'bulan' });
    expect(m).toEqual({ ok: true, data: { modal: 1000000, sukuBunga: 6, lama: 12, satuan: 'bulan' } });
    const h = hitungSimulasi(m.data);
    expect(h.bunga).toBeCloseTo(60000, 6);
    expect(h.akhir).toBeCloseTo(1060000, 6);
    expect(h.rumus).toEqual([
      'B = M × (p/100) × t',
      'B = 1.000.000 × (6/100) × (12/12)',
      'B = Rp60.000',
      'A = M + B',
      'A = 1.000.000 + 60.000',
      'Jumlah tabungan akhir A = Rp1.060.000',
    ]);
    expect(h.kepalaTabel[0]).toBe('Bulan ke-');
    expect(h.baris).toHaveLength(12);
    expect(h.baris[0]).toEqual({ periode: '1', bunga: 'Rp5.000', tabungan: 'Rp1.005.000' });
    expect(h.tumpukan).toHaveLength(12);
  });

  test('bunga bertambah sama setiap periode (linear)', () => {
    const h = hitungSimulasi({ modal: 2000000, sukuBunga: 6, lama: 5, satuan: 'tahun' });
    const selisih = h.tumpukan.map((t, i) => t.bunga - (h.tumpukan[i - 1]?.bunga ?? 0));
    for (const s of selisih) expect(s).toBeCloseTo(120000, 6);
  });

  test('lebih dari 24 bulan dikelompokkan per tahun; maksimal 24 tumpukan (design.md 8)', () => {
    const h = hitungSimulasi({ modal: 1000000, sukuBunga: 5, lama: 36, satuan: 'bulan' });
    expect(h.kepalaTabel[0]).toBe('Tahun ke-');
    expect(h.baris.map((b) => b.periode)).toEqual(['1', '2', '3']);
    expect(hitungSimulasi({ modal: 1000000, sukuBunga: 5, lama: 1200, satuan: 'bulan' }).tumpukan.length).toBeLessThanOrEqual(24);
    expect(hitungSimulasi({ modal: 1000000, sukuBunga: 5, lama: 100, satuan: 'tahun' }).tumpukan.length).toBeLessThanOrEqual(24);
  });

  test('hari dibagi 365 (KF-02); tabel hari satu baris', () => {
    const h = hitungSimulasi({ modal: 3650000, sukuBunga: 10, lama: 73, satuan: 'hari' });
    expect(h.bunga).toBeCloseTo(73000, 6);
    expect(h.rumus[1]).toBe('B = 3.650.000 × (10/100) × (73/365)');
    expect(h.baris).toHaveLength(1);
  });

  test('masukan salah memberi pesan Indonesia dan menunjuk kolomnya', () => {
    expect(bacaMasukanSimulasi({ modal: 'satu juta', sukuBunga: '6', lama: '1', satuan: 'tahun' }))
      .toMatchObject({ ok: false, kolom: 'modal' });
    expect(bacaMasukanSimulasi({ modal: '1000', sukuBunga: '0', lama: '1', satuan: 'tahun' }))
      .toMatchObject({ ok: false, kolom: 'sukuBunga' });
    expect(bacaMasukanSimulasi({ modal: '1000', sukuBunga: '150', lama: '1', satuan: 'tahun' }))
      .toMatchObject({ ok: false, kolom: 'sukuBunga' });
    expect(bacaMasukanSimulasi({ modal: '1000', sukuBunga: '5', lama: '2', satuan: 'minggu' }))
      .toMatchObject({ ok: false, kolom: 'satuan' });
  });
});

describe('Aturan Three.js (AGENTS.md §5)', () => {
  const berkas = readdirSync(join(AKAR, 'src'), { recursive: true })
    .filter((f) => f.endsWith('.js')).map((f) => `src/${f.replaceAll('\\', '/')}`);

  test('three hanya diimpor di src/tiga-d/', () => {
    for (const b of berkas) {
      if (b.startsWith('src/tiga-d/')) continue;
      expect(baca(b), b).not.toMatch(/from ['"]three/);
    }
  });

  test('modul 3D hanya dimuat lewat import() dinamis dari halaman Simulasi, tidak dari main.js', () => {
    const pemakai = berkas.filter((b) => baca(b).includes('tiga-d/ilustrasiTabungan'));
    expect(pemakai).toEqual(['src/halaman/simulasi.js']);
    expect(baca('src/halaman/simulasi.js')).toMatch(/await import\('\.\.\/tiga-d\/ilustrasiTabungan\.js'\)/);
    expect(baca('src/main.js')).not.toMatch(/three|tiga-d/);
  });

  test('ilustrasi 3D: tanpa animasi otomatis, maksimal 24 tumpukan, rasio piksel ≤ 2, ada dispose', () => {
    const isi = baca('src/tiga-d/ilustrasiTabungan.js');
    expect(isi).not.toMatch(/requestAnimationFrame|setAnimationLoop/);
    expect(isi).toMatch(/MAKS_TUMPUKAN = 24/);
    expect(isi).toMatch(/Math\.min\(window\.devicePixelRatio \|\| 1, 2\)/);
    expect(isi).toMatch(/dispose\(\)/);
    expect(isi).toMatch(/shadowMap\.enabled = false/);
  });
});
