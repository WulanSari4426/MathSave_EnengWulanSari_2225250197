import { describe, expect, it } from 'vitest';
import {
  JENIS_KESALAHAN,
  PESAN_LAINNYA,
  hitungJawaban,
  hitungPolaKesalahan,
} from '../../src/logika/diagnosis.js';
import { GalatMasukan } from '../../src/logika/galat.js';

const { SATUAN_WAKTU, PERSEN, TERTUKAR_BUNGA_TABUNGAN, RUMUS_INVERS } = JENIS_KESALAHAN;

/** Soal contoh dari docs/api.md bagian 3.3 & 5.3 */
const SOAL_BUNGA = {
  diketahui: { modal: 2_000_000, suku_bunga: 6, lama: 8, satuan_lama: 'bulan' },
  ditanya: 'bunga',
  satuan_jawaban: 'rupiah',
};

/** Ringkas hasil menjadi { JENIS: nilai } agar mudah dibandingkan. */
function petakan(pola) {
  return Object.fromEntries(pola.map((p) => [p.jenis, p.nilai]));
}

function kodeGalat(fungsi) {
  try {
    fungsi();
  } catch (galat) {
    expect(galat).toBeInstanceOf(GalatMasukan);
    return galat.kode;
  }
  return null;
}

describe('hitungJawaban', () => {
  it('bunga dan tabungan akhir', () => {
    expect(hitungJawaban(SOAL_BUNGA)).toBe(80_000);
    expect(hitungJawaban({ ...SOAL_BUNGA, ditanya: 'tabungan_akhir' })).toBe(2_080_000);
  });

  it('modal dari bunga atau dari tabungan akhir', () => {
    expect(
      hitungJawaban({ diketahui: { bunga: 80_000, suku_bunga: 6, lama: 8, satuan_lama: 'bulan' }, ditanya: 'modal' }),
    ).toBe(2_000_000);
    expect(
      hitungJawaban({
        diketahui: { tabungan_akhir: 2_080_000, suku_bunga: 6, lama: 8, satuan_lama: 'bulan' },
        ditanya: 'modal',
      }),
    ).toBe(2_000_000);
  });

  it('suku bunga dari bunga atau dari tabungan akhir', () => {
    const dasar = { modal: 2_000_000, lama: 8, satuan_lama: 'bulan' };
    expect(hitungJawaban({ diketahui: { ...dasar, bunga: 80_000 }, ditanya: 'suku_bunga' })).toBe(6);
    expect(hitungJawaban({ diketahui: { ...dasar, tabungan_akhir: 2_080_000 }, ditanya: 'suku_bunga' })).toBe(6);
  });

  it('lama dalam satuan yang diminta', () => {
    const diketahui = { modal: 2_000_000, suku_bunga: 6, bunga: 80_000 };
    expect(hitungJawaban({ diketahui, ditanya: 'lama', satuan_jawaban: 'bulan' })).toBe(8);
    expect(hitungJawaban({ diketahui, ditanya: 'lama', satuan_jawaban: 'tahun' })).toBe(0.666667);
  });

  it('menolak data soal yang tidak valid', () => {
    expect(kodeGalat(() => hitungJawaban({ ...SOAL_BUNGA, ditanya: 'diskon' }))).toBe('DITANYA_TIDAK_DIKENAL');
    expect(kodeGalat(() => hitungJawaban({ ditanya: 'bunga' }))).toBe('BUKAN_ANGKA');
    expect(kodeGalat(() => hitungJawaban(null))).toBe('BUKAN_ANGKA');
    expect(
      kodeGalat(() => hitungJawaban({ diketahui: { modal: 1, suku_bunga: 6, bunga: 5 }, ditanya: 'lama' })),
    ).toBe('SATUAN_TIDAK_DIKENAL');
    expect(
      kodeGalat(() =>
        hitungJawaban({
          diketahui: { modal: 2_000_000, tabungan_akhir: 1_000_000, lama: 1, satuan_lama: 'tahun' },
          ditanya: 'suku_bunga',
        }),
      ),
    ).toBe('DI_LUAR_RENTANG');
    expect(
      kodeGalat(() => hitungJawaban({ ...SOAL_BUNGA, diketahui: { ...SOAL_BUNGA.diketahui, modal: -1 } })),
    ).toBe('NEGATIF');
  });
});

describe('hitungPolaKesalahan — ditanya bunga', () => {
  it('contoh api.md bagian 5.3', () => {
    expect(petakan(hitungPolaKesalahan(SOAL_BUNGA))).toEqual({
      [SATUAN_WAKTU]: 960_000,
      [PERSEN]: 8_000_000,
      [TERTUKAR_BUNGA_TABUNGAN]: 2_080_000,
    });
  });

  it('pesan sesuai konteks soal dan berbahasa Indonesia', () => {
    const pola = hitungPolaKesalahan(SOAL_BUNGA);
    expect(pola.find((p) => p.jenis === SATUAN_WAKTU).pesan).toBe(
      'Lama menabung dalam bulan. Ubah dulu ke tahun: 8 bulan = 8/12 tahun.',
    );
    expect(pola.find((p) => p.jenis === PERSEN).pesan).toBe('Ingat, suku bunga 6% ditulis p/100 = 6/100 di dalam rumus.');
  });

  it('waktu dalam tahun: tidak ada pola satuan waktu', () => {
    const soal = { ...SOAL_BUNGA, diketahui: { modal: 1_000_000, suku_bunga: 6, lama: 2, satuan_lama: 'tahun' } };
    expect(hitungPolaKesalahan(soal).map((p) => p.jenis)).toEqual([PERSEN, TERTUKAR_BUNGA_TABUNGAN]);
  });

  it('waktu dalam hari', () => {
    const soal = { ...SOAL_BUNGA, diketahui: { modal: 3_650_000, suku_bunga: 10, lama: 73, satuan_lama: 'hari' } };
    const pola = hitungPolaKesalahan(soal);
    expect(petakan(pola)[SATUAN_WAKTU]).toBe(26_645_000);
    expect(pola[0].pesan).toContain('73 hari = 73/365 tahun');
  });

  it('membuang pola yang sama dengan jawaban benar', () => {
    const soal = { ...SOAL_BUNGA, diketahui: { ...SOAL_BUNGA.diketahui, modal: 0 } };
    expect(hitungPolaKesalahan(soal)).toEqual([]);
  });
});

describe('hitungPolaKesalahan — ditanya tabungan akhir', () => {
  it('pola satuan waktu, persen, dan tertukar', () => {
    const soal = {
      diketahui: { modal: 1_500_000, suku_bunga: 8, lama: 9, satuan_lama: 'bulan' },
      ditanya: 'tabungan_akhir',
    };
    expect(hitungJawaban(soal)).toBe(1_590_000);
    expect(petakan(hitungPolaKesalahan(soal))).toEqual({
      [SATUAN_WAKTU]: 2_580_000,
      [PERSEN]: 10_500_000,
      [TERTUKAR_BUNGA_TABUNGAN]: 90_000,
    });
  });
});

describe('hitungPolaKesalahan — ditanya modal', () => {
  it('diketahui bunga', () => {
    const soal = { diketahui: { bunga: 80_000, suku_bunga: 6, lama: 8, satuan_lama: 'bulan' }, ditanya: 'modal' };
    expect(petakan(hitungPolaKesalahan(soal))).toEqual({
      [RUMUS_INVERS]: 3_200,
      [SATUAN_WAKTU]: 166_666.666667,
      [PERSEN]: 20_000,
    });
  });

  it('diketahui tabungan akhir', () => {
    const soal = {
      diketahui: { tabungan_akhir: 2_080_000, suku_bunga: 6, lama: 8, satuan_lama: 'bulan' },
      ditanya: 'modal',
    };
    const pola = hitungPolaKesalahan(soal);
    expect(petakan(pola)).toEqual({
      [TERTUKAR_BUNGA_TABUNGAN]: 52_000_000,
      [RUMUS_INVERS]: 1_996_800,
      [SATUAN_WAKTU]: 1_405_405.405405,
      [PERSEN]: 416_000,
    });
    expect(pola[0].pesan).toContain('Rp2.080.000 adalah jumlah tabungan akhir (A)');
  });
});

describe('hitungPolaKesalahan — ditanya suku bunga', () => {
  const dasar = { modal: 2_000_000, lama: 8, satuan_lama: 'bulan' };

  it('diketahui bunga (toleransi kecil untuk soal persen)', () => {
    const soal = { diketahui: { ...dasar, bunga: 80_000 }, ditanya: 'suku_bunga', toleransi: 0.01 };
    expect(petakan(hitungPolaKesalahan(soal))).toEqual({
      [PERSEN]: 0.06,
      [SATUAN_WAKTU]: 0.5,
      [RUMUS_INVERS]: 4,
    });
  });

  it('toleransi bawaan 0,5 terlalu besar untuk soal persen: pola mirip dibuang', () => {
    const soal = { diketahui: { ...dasar, bunga: 80_000 }, ditanya: 'suku_bunga' };
    expect(hitungPolaKesalahan(soal).map((p) => p.jenis)).toEqual([PERSEN, RUMUS_INVERS]);
  });

  it('diketahui tabungan akhir', () => {
    const soal = { diketahui: { ...dasar, tabungan_akhir: 2_080_000 }, ditanya: 'suku_bunga', toleransi: 0.01 };
    expect(petakan(hitungPolaKesalahan(soal))[TERTUKAR_BUNGA_TABUNGAN]).toBe(156);
  });
});

describe('hitungPolaKesalahan — ditanya lama', () => {
  const diketahui = { modal: 2_000_000, suku_bunga: 6, bunga: 80_000 };

  it('jawaban dalam bulan', () => {
    const soal = { diketahui, ditanya: 'lama', satuan_jawaban: 'bulan', toleransi: 0.01 };
    expect(petakan(hitungPolaKesalahan(soal))).toEqual({
      [SATUAN_WAKTU]: 0.666667,
      [PERSEN]: 0.08,
      [RUMUS_INVERS]: 18,
    });
  });

  it('jawaban dalam tahun: pola satuan waktu = jawaban dalam bulan', () => {
    const soal = { diketahui, ditanya: 'lama', satuan_jawaban: 'tahun', toleransi: 0.01 };
    expect(petakan(hitungPolaKesalahan(soal))[SATUAN_WAKTU]).toBe(8);
  });

  it('diketahui tabungan akhir', () => {
    const soal = {
      diketahui: { modal: 2_000_000, suku_bunga: 6, tabungan_akhir: 2_080_000 },
      ditanya: 'lama',
      satuan_jawaban: 'bulan',
      toleransi: 0.01,
    };
    expect(hitungJawaban(soal)).toBe(8);
    expect(petakan(hitungPolaKesalahan(soal))[TERTUKAR_BUNGA_TABUNGAN]).toBe(208);
  });
});

describe('ketentuan umum pola kesalahan', () => {
  it('setiap pola punya jenis, nilai angka ≥ 0, dan pesan', () => {
    const pola = hitungPolaKesalahan(SOAL_BUNGA);
    for (const p of pola) {
      expect(Object.values(JENIS_KESALAHAN)).toContain(p.jenis);
      expect(p.nilai).toBeGreaterThanOrEqual(0);
      expect(p.pesan.length).toBeGreaterThan(0);
    }
  });

  it('pesan untuk kesalahan lain tersedia', () => {
    expect(PESAN_LAINNYA).toContain('belum tepat');
  });
});
