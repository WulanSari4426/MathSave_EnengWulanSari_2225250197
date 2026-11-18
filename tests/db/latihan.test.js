// RPC api.md 3.1–3.6 (mode latihan) dan 3.11.
import { describe, test, expect, beforeAll } from 'vitest';
import { buatDb, buatSiswa, rpcSebagai } from './bantuDb.js';
import { tambahSoalLatihan, isiBankKuis } from './soalUji.js';

let db;
let rani;
let soalId;

const jawab = (siswa, idSoal, jawaban, ubah = {}) =>
  rpcSebagai(db, siswa, 'periksa_jawaban', {
    p_soal_id: idSoal, p_jawaban: jawaban, p_jumlah_petunjuk: 0, p_durasi_detik: 20, p_sesi_kuis_id: null,
    ...ubah,
  });

beforeAll(async () => {
  db = await buatDb();
  rani = await buatSiswa(db, { nama: 'Rani' });
  soalId = await tambahSoalLatihan(db, 'M3-T2-01');
  await isiBankKuis(db);
}, 60000);

describe('3.1 ambil_profil', () => {
  test('mengembalikan nama panggilan dan kelas', async () => {
    expect(await rpcSebagai(db, rani, 'ambil_profil')).toEqual({ nama_panggilan: 'Rani', kelas: 'VIII-C' });
  });
});

describe('3.2 simpan_kemajuan', () => {
  test('selesai tidak bisa kembali menjadi sedang, kartu terakhir tetap diperbarui', async () => {
    const siswa = await buatSiswa(db);
    await rpcSebagai(db, siswa, 'simpan_kemajuan', { p_sub_materi: 'M2', p_status: 'selesai', p_kartu_terakhir: 5 });
    await rpcSebagai(db, siswa, 'simpan_kemajuan', { p_sub_materi: 'M2', p_status: 'sedang', p_kartu_terakhir: 1 });
    const { rows } = await db.query(
      `select status, kartu_terakhir from public.kemajuan_materi where siswa_id = $1`, [siswa.siswaId]);
    expect(rows).toEqual([{ status: 'selesai', kartu_terakhir: 1 }]);
  });

  test.each([
    { p_sub_materi: 'M9', p_status: 'sedang', p_kartu_terakhir: 0 },
    { p_sub_materi: 'M1', p_status: 'belum', p_kartu_terakhir: 0 },
    { p_sub_materi: 'M1', p_status: 'sedang', p_kartu_terakhir: -1 },
  ])('isian tidak sah ditolak INPUT_TIDAK_VALID (%o)', async (param) => {
    await expect(rpcSebagai(db, rani, 'simpan_kemajuan', param)).rejects.toThrow(/INPUT_TIDAK_VALID/);
  });
});

describe('3.3 ambil_soal_latihan', () => {
  test('hanya bank latihan, tanpa kunci, pembahasan, petunjuk, atau pola kesalahan', async () => {
    const hasil = await rpcSebagai(db, rani, 'ambil_soal_latihan', { p_sub_materi: 'M3', p_tingkat: 2, p_jumlah: 20 });
    expect(hasil).toHaveLength(1);
    expect(hasil[0].kode).toBe('M3-T2-01');
    expect(hasil[0].opsi).toBeNull();
    for (const terlarang of ['jawaban', 'pembahasan', 'petunjuk', 'pola_kesalahan', 'toleransi']) {
      expect(hasil[0]).not.toHaveProperty(terlarang);
    }
  });

  test('soal yang sudah dijawab benar diletakkan paling akhir', async () => {
    const siswa = await buatSiswa(db);
    const lain = await tambahSoalLatihan(db, 'M1-T1-01', { sub_materi: 'M1', tingkat: 1 });
    const lain2 = await tambahSoalLatihan(db, 'M1-T1-02', { sub_materi: 'M1', tingkat: 1 });
    await jawab(siswa, lain, 80000);
    for (let i = 0; i < 5; i += 1) {
      const hasil = await rpcSebagai(db, siswa, 'ambil_soal_latihan', { p_sub_materi: 'M1', p_tingkat: 1, p_jumlah: 2 });
      expect(hasil.map((s) => s.id)).toEqual([lain2, lain]);
    }
  });
});

describe('3.4 periksa_pemahaman', () => {
  test('semua tepat', async () => {
    const hasil = await rpcSebagai(db, rani, 'periksa_pemahaman', {
      p_soal_id: soalId,
      p_diketahui: { modal: 2000000, suku_bunga: 6, lama: 8, satuan_lama: 'bulan' },
      p_ditanya: 'bunga',
    });
    expect(hasil.semua_tepat).toBe(true);
  });

  test('satuan lama salah → pesan menunjuk satuan lama', async () => {
    const hasil = await rpcSebagai(db, rani, 'periksa_pemahaman', {
      p_soal_id: soalId,
      p_diketahui: { modal: 2000000, suku_bunga: 6, lama: 8, satuan_lama: 'tahun' },
      p_ditanya: 'bunga',
    });
    expect(hasil).toEqual({
      semua_tepat: false,
      rincian: { modal: true, suku_bunga: true, lama: true, satuan_lama: false, ditanya: true },
      pesan: 'Periksa lagi satuan lama menabung pada soal.',
    });
  });

  test('soal bank kuis ditolak SOAL_TIDAK_DITEMUKAN (KF-14)', async () => {
    const { rows } = await db.query(`select id from public.soal where bank = 'kuis' limit 1`);
    await expect(
      rpcSebagai(db, rani, 'periksa_pemahaman', { p_soal_id: rows[0].id, p_diketahui: {}, p_ditanya: 'bunga' }),
    ).rejects.toThrow(/SOAL_TIDAK_DITEMUKAN/);
  });
});

describe('3.5 ambil_petunjuk', () => {
  test('level 1 memuat sorotan, level 2–3 tidak', async () => {
    const satu = await rpcSebagai(db, rani, 'ambil_petunjuk', { p_soal_id: soalId, p_level: 1 });
    expect(satu).toEqual({
      level: 1, langkah: 'Pahami', teks: 'Petunjuk 1',
      sorotan: ['Rp2.000.000', '6% per tahun', '8 bulan'], level_maks: 3,
    });
    const tiga = await rpcSebagai(db, rani, 'ambil_petunjuk', { p_soal_id: soalId, p_level: 3 });
    expect(tiga).toMatchObject({ level: 3, langkah: 'Hitung', teks: 'Petunjuk 3', sorotan: null });
  });

  test('level 4 ditolak INPUT_TIDAK_VALID', async () => {
    await expect(rpcSebagai(db, rani, 'ambil_petunjuk', { p_soal_id: soalId, p_level: 4 }))
      .rejects.toThrow(/INPUT_TIDAK_VALID/);
  });

  test('soal kuis di luar kuis berjalan → SOAL_TIDAK_DITEMUKAN', async () => {
    const { rows } = await db.query(`select id from public.soal where bank = 'kuis' limit 1`);
    await expect(rpcSebagai(db, rani, 'ambil_petunjuk', { p_soal_id: rows[0].id, p_level: 1 }))
      .rejects.toThrow(/SOAL_TIDAK_DITEMUKAN/);
  });

  test('soal kuis yang sedang dikerjakan → PETUNJUK_TIDAK_TERSEDIA (H8)', async () => {
    const siswa = await buatSiswa(db);
    const sesi = await rpcSebagai(db, siswa, 'mulai_kuis');
    await expect(rpcSebagai(db, siswa, 'ambil_petunjuk', { p_soal_id: sesi.soal[0].id, p_level: 1 }))
      .rejects.toThrow(/PETUNJUK_TIDAK_TERSEDIA/);
  });
});

describe('3.6 periksa_jawaban — latihan', () => {
  test('jawaban benar: pembahasan selalu dikirim', async () => {
    const siswa = await buatSiswa(db);
    const hasil = await jawab(siswa, soalId, 80000);
    expect(hasil.benar).toBe(true);
    expect(hasil.jenis_kesalahan).toBeNull();
    expect(hasil.pembahasan).toHaveLength(4);
  });

  test('toleransi Rupiah ±1 (KF-19): selisih tepat 1 benar, 1,01 salah', async () => {
    const siswa = await buatSiswa(db);
    expect((await jawab(siswa, soalId, 80001)).benar).toBe(true);
    expect((await jawab(siswa, soalId, 79999)).benar).toBe(true);
    expect((await jawab(siswa, soalId, 80001.01)).benar).toBe(false);
  });

  test('pola kesalahan SATUAN_WAKTU dikenali beserta pesannya, dan salah dihitung', async () => {
    const siswa = await buatSiswa(db);
    const hasil = await jawab(siswa, soalId, 960000);
    expect(hasil).toMatchObject({
      benar: false, jenis_kesalahan: 'SATUAN_WAKTU', pesan: 'Ubah dulu bulan ke tahun.', jumlah_salah_soal_ini: 1,
    });
    expect(hasil.pembahasan).toHaveLength(4);
    const kedua = await jawab(siswa, soalId, 12345);
    expect(kedua).toMatchObject({ benar: false, jenis_kesalahan: 'LAINNYA', pesan: null, jumlah_salah_soal_ini: 2 });
  });

  test('soal bank kuis tidak bisa dijawab lewat latihan (KF-14)', async () => {
    const { rows } = await db.query(`select id from public.soal where bank = 'kuis' and bentuk = 'isian' limit 1`);
    await expect(jawab(rani, rows[0].id, 80000)).rejects.toThrow(/SOAL_TIDAK_DITEMUKAN/);
  });

  test('isian tanpa angka, atau dengan opsi, ditolak INPUT_TIDAK_VALID', async () => {
    await expect(jawab(rani, soalId, null)).rejects.toThrow(/INPUT_TIDAK_VALID/);
    await expect(jawab(rani, soalId, 80000, { p_opsi: 'o1' })).rejects.toThrow(/INPUT_TIDAK_VALID/);
  });

  test('jumlah petunjuk di luar 0–3 ditolak', async () => {
    await expect(jawab(rani, soalId, 80000, { p_jumlah_petunjuk: 4 })).rejects.toThrow(/INPUT_TIDAK_VALID/);
  });

  test('jawaban latihan tidak menyentuh sesi_kuis_soal (KF-14 S4)', async () => {
    const { rows } = await db.query('select count(*)::int as n from public.sesi_kuis_soal s join public.siswa w on w.id = s.siswa_id where w.id = $1', [rani.siswaId]);
    expect(rows[0].n).toBe(0);
  });
});

describe('3.11 simpan_penjelasan', () => {
  test('hanya untuk soal yang pernah dijawab benar', async () => {
    const siswa = await buatSiswa(db);
    await expect(rpcSebagai(db, siswa, 'simpan_penjelasan', { p_soal_id: soalId, p_isi: 'Karena…' }))
      .rejects.toThrow(/INPUT_TIDAK_VALID/);
    await jawab(siswa, soalId, 80000);
    expect(await rpcSebagai(db, siswa, 'simpan_penjelasan', { p_soal_id: soalId, p_isi: 'Karena 8 bulan = 8/12 tahun.' }))
      .toEqual({ ok: true });
  });

  test('lebih dari 500 karakter atau kosong ditolak', async () => {
    const siswa = await buatSiswa(db);
    await jawab(siswa, soalId, 80000);
    await expect(rpcSebagai(db, siswa, 'simpan_penjelasan', { p_soal_id: soalId, p_isi: 'a'.repeat(501) }))
      .rejects.toThrow(/INPUT_TIDAK_VALID/);
    await expect(rpcSebagai(db, siswa, 'simpan_penjelasan', { p_soal_id: soalId, p_isi: '   ' }))
      .rejects.toThrow(/INPUT_TIDAK_VALID/);
  });
});
