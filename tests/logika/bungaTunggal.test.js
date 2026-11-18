import { describe, expect, it } from 'vitest';
import {
  HARI_PER_TAHUN,
  MAKS_BARIS_TABEL,
  bungaDariTabunganAkhir,
  cariLama,
  cariModal,
  cariModalDariTabunganAkhir,
  cariSukuBunga,
  hitungBunga,
  hitungTabunganAkhir,
  keTahun,
  tabelPertumbuhan,
  ubahSatuanWaktu,
} from '../../src/logika/bungaTunggal.js';
import { GalatMasukan } from '../../src/logika/galat.js';

/** Memastikan fungsi melempar GalatMasukan dengan kode tertentu. */
function harusGalat(fungsi, kode) {
  try {
    fungsi();
  } catch (galat) {
    expect(galat).toBeInstanceOf(GalatMasukan);
    expect(galat.kode).toBe(kode);
    expect(typeof galat.message).toBe('string');
    expect(galat.message.length).toBeGreaterThan(0);
    return galat;
  }
  throw new Error(`Seharusnya melempar GalatMasukan dengan kode ${kode}`);
}

// Contoh utama dari docs/api.md: M = 2.000.000, p = 6% per tahun, lama 8 bulan → B = 80.000
const CONTOH = { modal: 2_000_000, sukuBunga: 6, lama: 8, satuan: 'bulan' };

describe('HARI_PER_TAHUN (KF-02: 1 tahun = 365 hari, diputuskan)', () => {
  it('memakai asumsi sementara 365 sesuai docs/api.md', () => {
    expect(HARI_PER_TAHUN).toBe(365);
  });
});

describe('keTahun', () => {
  it('tahun tetap', () => {
    expect(keTahun(2, 'tahun')).toBe(2);
  });

  it('bulan dibagi 12', () => {
    expect(keTahun(6, 'bulan')).toBe(0.5);
    expect(keTahun(18, 'bulan')).toBe(1.5);
  });

  it('hari dibagi HARI_PER_TAHUN, bisa diganti 360 (KF-02)', () => {
    expect(keTahun(73, 'hari')).toBeCloseTo(0.2, 10);
    expect(keTahun(90, 'hari', 360)).toBe(0.25);
  });

  it('menolak masukan tidak valid', () => {
    harusGalat(() => keTahun('8', 'bulan'), 'BUKAN_ANGKA');
    harusGalat(() => keTahun(NaN, 'bulan'), 'BUKAN_ANGKA');
    harusGalat(() => keTahun(Infinity, 'tahun'), 'BUKAN_ANGKA');
    harusGalat(() => keTahun(-1, 'bulan'), 'NEGATIF');
    harusGalat(() => keTahun(3, 'minggu'), 'SATUAN_TIDAK_DIKENAL');
    harusGalat(() => keTahun(3, 'hari', 0), 'PEMBAGIAN_NOL');
  });
});

describe('ubahSatuanWaktu', () => {
  it('mengubah bulan ↔ tahun', () => {
    expect(ubahSatuanWaktu(18, 'bulan', 'tahun')).toBe(1.5);
    expect(ubahSatuanWaktu(2, 'tahun', 'bulan')).toBe(24);
    expect(ubahSatuanWaktu(5, 'bulan', 'bulan')).toBe(5);
  });

  it('mengubah tahun ↔ hari', () => {
    expect(ubahSatuanWaktu(1, 'tahun', 'hari')).toBe(365);
    expect(ubahSatuanWaktu(180, 'hari', 'tahun', 360)).toBe(0.5);
  });

  it('menolak masukan tidak valid', () => {
    harusGalat(() => ubahSatuanWaktu(-2, 'tahun', 'bulan'), 'NEGATIF');
    harusGalat(() => ubahSatuanWaktu(2, 'tahun', 'abad'), 'SATUAN_TIDAK_DIKENAL');
    harusGalat(() => ubahSatuanWaktu(undefined, 'tahun', 'bulan'), 'BUKAN_ANGKA');
  });
});

describe('hitungBunga', () => {
  it('contoh api.md: 2.000.000 × 6% × 8/12 = 80.000 (tepat, tanpa sisa desimal)', () => {
    expect(hitungBunga(CONTOH)).toBe(80_000);
  });

  it('waktu dalam tahun', () => {
    expect(hitungBunga({ modal: 1_000_000, sukuBunga: 6, lama: 2, satuan: 'tahun' })).toBe(120_000);
  });

  it('waktu dalam hari (365 dan 360)', () => {
    const data = { modal: 3_650_000, sukuBunga: 10, lama: 73, satuan: 'hari' };
    expect(hitungBunga(data)).toBe(73_000);
    expect(hitungBunga({ ...data, hariPerTahun: 360 })).toBeCloseTo(74_013.8889, 4);
  });

  it('nilai nol menghasilkan bunga nol', () => {
    expect(hitungBunga({ ...CONTOH, modal: 0 })).toBe(0);
    expect(hitungBunga({ ...CONTOH, sukuBunga: 0 })).toBe(0);
    expect(hitungBunga({ ...CONTOH, lama: 0 })).toBe(0);
  });

  it('menerima suku bunga desimal', () => {
    expect(hitungBunga({ modal: 1_000_000, sukuBunga: 2.5, lama: 1, satuan: 'tahun' })).toBe(25_000);
  });

  it('menolak masukan tidak valid', () => {
    harusGalat(() => hitungBunga({ ...CONTOH, modal: -1 }), 'NEGATIF');
    harusGalat(() => hitungBunga({ ...CONTOH, sukuBunga: -6 }), 'NEGATIF');
    harusGalat(() => hitungBunga({ ...CONTOH, lama: -8 }), 'NEGATIF');
    harusGalat(() => hitungBunga({ ...CONTOH, modal: '2000000' }), 'BUKAN_ANGKA');
    harusGalat(() => hitungBunga({ ...CONTOH, satuan: undefined }), 'SATUAN_TIDAK_DIKENAL');
    harusGalat(() => hitungBunga(), 'BUKAN_ANGKA');
  });

  it('pesan galat berbahasa Indonesia', () => {
    const galat = harusGalat(() => hitungBunga({ ...CONTOH, modal: -1 }), 'NEGATIF');
    expect(galat.message).toBe('Modal tidak boleh negatif.');
  });
});

describe('hitungTabunganAkhir', () => {
  it('modal + bunga', () => {
    expect(hitungTabunganAkhir(CONTOH)).toBe(2_080_000);
    expect(hitungTabunganAkhir({ modal: 1_500_000, sukuBunga: 8, lama: 9, satuan: 'bulan' })).toBe(1_590_000);
  });

  it('menolak masukan tidak valid', () => {
    harusGalat(() => hitungTabunganAkhir({ ...CONTOH, modal: null }), 'BUKAN_ANGKA');
    harusGalat(() => hitungTabunganAkhir({ ...CONTOH, lama: -1 }), 'NEGATIF');
  });
});

describe('bungaDariTabunganAkhir', () => {
  it('tabungan akhir − modal', () => {
    expect(bungaDariTabunganAkhir({ tabunganAkhir: 2_080_000, modal: 2_000_000 })).toBe(80_000);
    expect(bungaDariTabunganAkhir({ tabunganAkhir: 500, modal: 500 })).toBe(0);
  });

  it('menolak tabungan akhir lebih kecil dari modal', () => {
    harusGalat(() => bungaDariTabunganAkhir({ tabunganAkhir: 1_000, modal: 2_000 }), 'DI_LUAR_RENTANG');
    harusGalat(() => bungaDariTabunganAkhir({ tabunganAkhir: -1, modal: 0 }), 'NEGATIF');
  });
});

describe('cariModal', () => {
  it('M = B ÷ (p% × t)', () => {
    expect(cariModal({ bunga: 80_000, sukuBunga: 6, lama: 8, satuan: 'bulan' })).toBe(2_000_000);
    expect(cariModal({ bunga: 120_000, sukuBunga: 6, lama: 2, satuan: 'tahun' })).toBe(1_000_000);
  });

  it('menolak pembagian dengan nol', () => {
    harusGalat(() => cariModal({ bunga: 80_000, sukuBunga: 0, lama: 8, satuan: 'bulan' }), 'PEMBAGIAN_NOL');
    harusGalat(() => cariModal({ bunga: 80_000, sukuBunga: 6, lama: 0, satuan: 'bulan' }), 'PEMBAGIAN_NOL');
  });

  it('menolak masukan tidak valid', () => {
    harusGalat(() => cariModal({ bunga: -1, sukuBunga: 6, lama: 8, satuan: 'bulan' }), 'NEGATIF');
    harusGalat(() => cariModal({ bunga: 80_000, sukuBunga: 6, lama: 8, satuan: 'pekan' }), 'SATUAN_TIDAK_DIKENAL');
  });
});

describe('cariModalDariTabunganAkhir', () => {
  it('M = tabungan akhir ÷ (1 + p% × t)', () => {
    expect(
      cariModalDariTabunganAkhir({ tabunganAkhir: 2_080_000, sukuBunga: 6, lama: 8, satuan: 'bulan' }),
    ).toBe(2_000_000);
  });

  it('suku bunga atau lama nol → modal = tabungan akhir (tidak ada pembagian nol)', () => {
    expect(cariModalDariTabunganAkhir({ tabunganAkhir: 1_000, sukuBunga: 0, lama: 3, satuan: 'tahun' })).toBe(1_000);
    expect(cariModalDariTabunganAkhir({ tabunganAkhir: 1_000, sukuBunga: 5, lama: 0, satuan: 'tahun' })).toBe(1_000);
  });

  it('menolak masukan tidak valid', () => {
    harusGalat(
      () => cariModalDariTabunganAkhir({ tabunganAkhir: -5, sukuBunga: 6, lama: 8, satuan: 'bulan' }),
      'NEGATIF',
    );
  });
});

describe('cariSukuBunga', () => {
  it('p = B ÷ (M × t) × 100', () => {
    expect(cariSukuBunga({ bunga: 80_000, modal: 2_000_000, lama: 8, satuan: 'bulan' })).toBe(6);
    expect(cariSukuBunga({ bunga: 25_000, modal: 1_000_000, lama: 1, satuan: 'tahun' })).toBe(2.5);
  });

  it('menolak pembagian dengan nol', () => {
    harusGalat(() => cariSukuBunga({ bunga: 80_000, modal: 0, lama: 8, satuan: 'bulan' }), 'PEMBAGIAN_NOL');
    harusGalat(() => cariSukuBunga({ bunga: 80_000, modal: 2_000_000, lama: 0, satuan: 'bulan' }), 'PEMBAGIAN_NOL');
  });

  it('menolak nilai negatif', () => {
    harusGalat(() => cariSukuBunga({ bunga: 80_000, modal: -2, lama: 8, satuan: 'bulan' }), 'NEGATIF');
  });
});

describe('cariLama', () => {
  it('t = B ÷ (M × p%), dalam satuan yang diminta', () => {
    const data = { bunga: 80_000, modal: 2_000_000, sukuBunga: 6 };
    expect(cariLama({ ...data, satuanHasil: 'bulan' })).toBe(8);
    expect(cariLama({ ...data, satuanHasil: 'tahun' })).toBeCloseTo(2 / 3, 10);
    expect(cariLama(data)).toBeCloseTo(2 / 3, 10); // bawaan: tahun
    expect(cariLama({ bunga: 73_000, modal: 3_650_000, sukuBunga: 10, satuanHasil: 'hari' })).toBe(73);
  });

  it('hasil boleh pecahan', () => {
    expect(cariLama({ bunga: 75_000, modal: 2_000_000, sukuBunga: 6, satuanHasil: 'bulan' })).toBe(7.5);
  });

  it('menolak pembagian dengan nol', () => {
    harusGalat(() => cariLama({ bunga: 80_000, modal: 0, sukuBunga: 6 }), 'PEMBAGIAN_NOL');
    harusGalat(() => cariLama({ bunga: 80_000, modal: 2_000_000, sukuBunga: 0 }), 'PEMBAGIAN_NOL');
  });

  it('menolak satuan hasil tidak dikenal', () => {
    harusGalat(
      () => cariLama({ bunga: 80_000, modal: 2_000_000, sukuBunga: 6, satuanHasil: 'jam' }),
      'SATUAN_TIDAK_DIKENAL',
    );
  });
});

describe('tabelPertumbuhan', () => {
  it('per bulan untuk lama ≤ 24 bulan', () => {
    const tabel = tabelPertumbuhan({ modal: 1_000_000, sukuBunga: 6, lama: 12, satuan: 'bulan' });
    expect(tabel).toHaveLength(12);
    expect(tabel[0]).toEqual({ periode: 1, satuan: 'bulan', bungaKumulatif: 5_000, tabungan: 1_005_000 });
    expect(tabel[11]).toEqual({ periode: 12, satuan: 'bulan', bungaKumulatif: 60_000, tabungan: 1_060_000 });
  });

  it('bunga bertambah sama besar setiap periode (linear)', () => {
    const tabel = tabelPertumbuhan({ modal: 1_000_000, sukuBunga: 6, lama: 6, satuan: 'bulan' });
    const selisih = tabel.slice(1).map((baris, i) => baris.bungaKumulatif - tabel[i].bungaKumulatif);
    expect(new Set(selisih)).toEqual(new Set([5_000]));
  });

  it('lebih dari 24 bulan dikelompokkan per tahun, baris terakhir = lama', () => {
    const tabel = tabelPertumbuhan({ modal: 1_000_000, sukuBunga: 6, lama: 30, satuan: 'bulan' });
    expect(tabel.map((b) => b.periode)).toEqual([12, 24, 30]);
    expect(tabel[2].bungaKumulatif).toBe(150_000);
  });

  it('per tahun, termasuk lama pecahan', () => {
    const tabel = tabelPertumbuhan({ modal: 1_000_000, sukuBunga: 6, lama: 2.5, satuan: 'tahun' });
    expect(tabel.map((b) => b.periode)).toEqual([1, 2, 2.5]);
    expect(tabel[2].tabungan).toBe(1_150_000);
  });

  it(`tidak pernah lebih dari ${MAKS_BARIS_TABEL} baris`, () => {
    expect(tabelPertumbuhan({ modal: 1_000, sukuBunga: 5, lama: 50, satuan: 'tahun' }).length).toBeLessThanOrEqual(
      MAKS_BARIS_TABEL,
    );
    expect(tabelPertumbuhan({ modal: 1_000, sukuBunga: 5, lama: 600, satuan: 'bulan' }).length).toBeLessThanOrEqual(
      MAKS_BARIS_TABEL,
    );
    expect(tabelPertumbuhan({ modal: 1_000, sukuBunga: 5, lama: 24, satuan: 'bulan' })).toHaveLength(24);
  });

  it('satuan hari: satu baris', () => {
    const tabel = tabelPertumbuhan({ modal: 3_650_000, sukuBunga: 10, lama: 73, satuan: 'hari' });
    expect(tabel).toEqual([{ periode: 73, satuan: 'hari', bungaKumulatif: 73_000, tabungan: 3_723_000 }]);
  });

  it('menolak lama nol dan masukan tidak valid', () => {
    harusGalat(() => tabelPertumbuhan({ ...CONTOH, lama: 0 }), 'DI_LUAR_RENTANG');
    harusGalat(() => tabelPertumbuhan({ ...CONTOH, modal: -1 }), 'NEGATIF');
    harusGalat(() => tabelPertumbuhan({ ...CONTOH, satuan: 'minggu' }), 'SATUAN_TIDAK_DIKENAL');
  });
});
