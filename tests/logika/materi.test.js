// Fase 6 — isi materi (src/data/materi.js) dan pemeriksaan isian materi.
import { describe, test, expect } from 'vitest';
import {
  MATERI, URUTAN_SUB_MATERI, LANGKAH, TOLERANSI, susunLayar, SUB_MATERI_LATIHAN,
} from '../../src/data/materi.js';
import {
  hitungBunga, hitungTabunganAkhir, cariModal, cariSukuBunga, cariLama,
} from '../../src/logika/bungaTunggal.js';
import { formatAngka } from '../../src/logika/parserAngka.js';
import { periksaIsianMateri, dalamToleransi } from '../../src/logika/periksaIsian.js';

/** Menghitung jawaban dari data contoh memakai SATU-SATUNYA modul rumus (AGENTS.md §6). */
function hitungUlang({ data, ditanya, satuanJawaban }) {
  const { modal, sukuBunga, lama, satuan, bunga } = data;
  switch (ditanya) {
    case 'bunga': return hitungBunga({ modal, sukuBunga, lama, satuan });
    case 'tabungan_akhir': return hitungTabunganAkhir({ modal, sukuBunga, lama, satuan });
    case 'modal': return cariModal({ bunga, sukuBunga, lama, satuan });
    case 'suku_bunga': return cariSukuBunga({ bunga, modal, lama, satuan });
    case 'lama': return cariLama({ bunga, modal, sukuBunga, satuanHasil: satuanJawaban });
    default: throw new Error(`ditanya tidak dikenal: ${ditanya}`);
  }
}

const semuaTeks = (nilai) => {
  if (typeof nilai === 'string') return [nilai];
  if (Array.isArray(nilai)) return nilai.flatMap(semuaTeks);
  if (nilai && typeof nilai === 'object') return Object.values(nilai).flatMap(semuaTeks);
  return [];
};
const jumlahKata = (teks) => teks.trim().split(/\s+/).filter(Boolean).length;

describe('Struktur materi (PRD F-02, F-03)', () => {
  test('tujuh sub-bab berurutan P0, M1–M6, masing-masing punya kartu dan Coba Sendiri', () => {
    expect(URUTAN_SUB_MATERI).toEqual(['P0', 'M1', 'M2', 'M3', 'M4', 'M5', 'M6']);
    expect(Object.keys(MATERI)).toEqual(URUTAN_SUB_MATERI);
    for (const id of URUTAN_SUB_MATERI) {
      expect(MATERI[id].id).toBe(id);
      expect(MATERI[id].kartu.length).toBeGreaterThanOrEqual(3);
      expect(MATERI[id].cobaSendiri).toBeTruthy();
    }
    expect(MATERI.P0.opsional).toBe(true);
  });

  test('M2–M5 punya minimal 2 contoh: satu lengkap dan satu setengah jadi (F-03)', () => {
    for (const id of ['M2', 'M3', 'M4', 'M5']) {
      const jenis = MATERI[id].contoh.map((c) => c.jenis);
      expect(jenis.length, id).toBeGreaterThanOrEqual(2);
      expect(jenis, id).toContain('lengkap');
      expect(jenis, id).toContain('setengah');
    }
  });

  test('setiap contoh punya 4 langkah tetap dan diakhiri Periksa', () => {
    for (const id of URUTAN_SUB_MATERI) {
      for (const c of MATERI[id].contoh) {
        expect(c.langkah.map((l) => l.langkah), `${id} ${c.judul}`).toEqual([...LANGKAH]);
        for (const l of c.langkah) expect(l.baris.length).toBeGreaterThan(0);
      }
    }
  });

  test('satu kartu = satu ide: teks kartu paling banyak 60 kata', () => {
    for (const id of URUTAN_SUB_MATERI) {
      for (const k of MATERI[id].kartu) {
        expect(jumlahKata(k.teks.join(' ')), `${id} "${k.judul}"`).toBeLessThanOrEqual(60);
      }
    }
  });

  test('urutan layar: kartu, contoh, lalu Coba Sendiri', () => {
    const layar = susunLayar('M3');
    expect(layar[0]).toEqual({ jenis: 'kartu', indeks: 0 });
    expect(layar.at(-1)).toEqual({ jenis: 'coba', indeks: 0 });
    expect(layar.filter((l) => l.jenis === 'contoh')).toHaveLength(MATERI.M3.contoh.length);
    expect(susunLayar('X9')).toEqual([]);
    expect(SUB_MATERI_LATIHAN).not.toContain('M1');
  });
});

describe('Notasi resmi KF-03 dan KF-02', () => {
  const teks = semuaTeks(MATERI).join('\n');

  test('tidak memakai "p%", simbol n, atau Ma', () => {
    expect(teks).not.toMatch(/p%/);
    expect(teks).not.toMatch(/\bn\s*=/);
    expect(teks).not.toMatch(/\bMa\b/);
  });

  test('rumus resmi ditulis persis', () => {
    expect(teks).toContain('B = M × (p/100) × t');
    expect(teks).toContain('A = M + B');
  });

  test('hari dibagi 365 (bukan 360), dan bulan tidak diubah lewat angka 30 hari', () => {
    expect(teks).toContain('365');
    expect(teks).not.toMatch(/\/\s*360|÷\s*360/);
    expect(teks).not.toMatch(/30 hari per bulan|1 bulan = 30/);
  });

  test('simbol A selalu bersama istilahnya ("jumlah tabungan akhir (A)" atau dalam rumus)', () => {
    for (const baris of semuaTeks(MATERI)) {
      // "(A)" berdiri sendiri hanya boleh setelah kata "akhir"
      for (const cocok of baris.matchAll(/\(A\)/g)) {
        expect(baris.slice(0, cocok.index).toLowerCase(), baris).toMatch(/akhir\s*$/);
      }
    }
  });
});

describe('Semua angka dihitung ulang dengan bungaTunggal.js', () => {
  const semuaContoh = URUTAN_SUB_MATERI.flatMap((id) => MATERI[id].contoh.map((c) => [id, c]));

  test.each(semuaContoh)('%s: jawaban contoh benar', (id, c) => {
    expect(hitungUlang(c)).toBeCloseTo(c.jawaban, 6);
  });

  test.each(semuaContoh.filter(([, c]) => c.jenis === 'lengkap'))(
    '%s: langkah Hitung memuat hasil akhirnya', (id, c) => {
      const hitung = c.langkah[2].baris.join(' ');
      expect(hitung).toContain(formatAngka(c.jawaban));
    });

  test.each(semuaContoh.filter(([, c]) => c.jenis === 'setengah'))(
    '%s: isian siswa = jawaban contoh, dengan toleransi KF-19', (id, c) => {
      expect(c.isian.jawaban).toBe(c.jawaban);
      expect(c.isian.toleransi).toBe(TOLERANSI[c.isian.satuan]);
      expect(c.isian.langkah).toBe(2);
      expect(c.isian.tampil).toBeLessThan(c.langkah[2].baris.length);
    });

  test.each(URUTAN_SUB_MATERI)('%s: Coba Sendiri benar, kunci rapi, toleransi sesuai satuan', (id) => {
    const c = MATERI[id].cobaSendiri;
    expect(hitungUlang({ ...c, satuanJawaban: c.satuanJawaban ?? c.satuan })).toBeCloseTo(c.jawaban, 6);
    expect(c.toleransi).toBe(TOLERANSI[c.satuan]);
    if (c.satuan === 'rupiah' || c.satuan === 'bulan') expect(Number.isInteger(c.jawaban)).toBe(true);
    expect(c.pembahasan.length).toBeGreaterThan(0);
  });
});

describe('periksaIsianMateri', () => {
  const kunci = { jawaban: 80000, toleransi: 1 };

  test('format Indonesia dibaca uraiAngka', () => {
    expect(periksaIsianMateri('Rp80.000', kunci)).toEqual({ status: 'benar', nilai: 80000 });
    expect(periksaIsianMateri('80000', kunci).status).toBe('benar');
    expect(periksaIsianMateri('80.001', kunci).status).toBe('benar');
    expect(periksaIsianMateri('80.002', kunci).status).toBe('salah');
  });

  test('kosong dan bukan angka dibedakan dari jawaban salah', () => {
    expect(periksaIsianMateri('  ', kunci).status).toBe('kosong');
    expect(periksaIsianMateri('delapan', kunci).status).toBe('format');
  });

  test('toleransi persen dan waktu 0,01', () => {
    expect(periksaIsianMateri('5,01', { jawaban: 5, toleransi: 0.01 }).status).toBe('benar');
    expect(periksaIsianMateri('5,02', { jawaban: 5, toleransi: 0.01 }).status).toBe('salah');
    expect(dalamToleransi(0.1 + 0.2, 0.3, 0)).toBe(true);
  });
});
