// RPC kuis api.md 3.6 (mode kuis), 3.7, 3.7a, 3.8, serta 3.9 dan 3.10.
import { describe, test, expect, beforeAll } from 'vitest';
import { buatDb, buatSiswa, rpcSebagai, sebagai, sebagaiAdmin } from './bantuDb.js';
import { tambahSoalLatihan, isiBankKuis } from './soalUji.js';

let db;

/** Memundurkan seluruh waktu sesi (dan jawabannya) seolah sudah lewat `menit` menit. */
async function mundurkanWaktu(sesiId, menit) {
  await sebagaiAdmin(db);
  await db.query(
    `update public.sesi_kuis set mulai_pada = mulai_pada - make_interval(mins => $2),
            batas_waktu = batas_waktu - make_interval(mins => $2) where id = $1`, [sesiId, menit]);
  await db.query(
    `update public.percobaan_jawaban set dibuat_pada = dibuat_pada - make_interval(mins => $2)
      where sesi_kuis_id = $1`, [sesiId, menit]);
}

const jawabKuis = (siswa, sesi, soal, { benar = true, opsi } = {}) =>
  rpcSebagai(db, siswa, 'periksa_jawaban', {
    p_soal_id: soal.id,
    p_jawaban: soal.bentuk === 'isian' ? (benar ? 80000 : 960000) : null,
    p_jumlah_petunjuk: 0,
    p_durasi_detik: 10,
    p_sesi_kuis_id: sesi.sesi_kuis_id,
    p_opsi: soal.bentuk === 'pilihan_ganda' ? (opsi ?? (benar ? 'o1' : 'o2')) : null,
  });

beforeAll(async () => {
  db = await buatDb();
  await isiBankKuis(db);
}, 60000);

describe('3.7 mulai_kuis', () => {
  test('20 soal sesuai kisi-kisi, opsi diacak tanpa kunci, timer 30 menit waktu server', async () => {
    const siswa = await buatSiswa(db);
    const sesi = await rpcSebagai(db, siswa, 'mulai_kuis');

    expect(sesi.percobaan_ke).toBe(1);
    expect(sesi.maks_percobaan).toBe(2);
    expect(sesi.soal).toHaveLength(20);
    expect(sesi.soal.map((s) => s.nomor)).toEqual([...Array(20).keys()].map((i) => i + 1));
    expect(sesi.jawaban_tersimpan).toEqual([]);
    expect(new Date(sesi.batas_waktu) - new Date(sesi.mulai_pada)).toBe(30 * 60 * 1000);

    const { rows: kisi } = await db.query('select * from public.kisi_kisi_kuis order by nomor');
    const { rows: soalDb } = await db.query('select id, kategori_kuis, tingkat, bentuk from public.soal');
    const peta = new Map(soalDb.map((s) => [s.id, s]));
    sesi.soal.forEach((s, i) => {
      const asli = peta.get(s.id);
      expect([asli.kategori_kuis, asli.tingkat, asli.bentuk])
        .toEqual([kisi[i].kategori_kuis, kisi[i].tingkat, kisi[i].bentuk]);
    });

    const pg = sesi.soal.filter((s) => s.bentuk === 'pilihan_ganda');
    expect(pg).toHaveLength(15);
    for (const s of pg) {
      expect(s.opsi.map((o) => o.huruf)).toEqual(['A', 'B', 'C', 'D']);
      expect(s.opsi.map((o) => o.id).sort()).toEqual(['o1', 'o2', 'o3', 'o4']);
      for (const o of s.opsi) expect(Object.keys(o).sort()).toEqual(['huruf', 'id', 'teks']);
    }
    const teks = JSON.stringify(sesi);
    for (const terlarang of ['kunci', 'pembahasan', 'pola_kesalahan', 'jenis_kesalahan', '"jawaban"']) {
      expect(teks).not.toContain(terlarang);
    }
  });

  test('melanjutkan sesi: waktu dan urutan opsi tidak berubah, bukan percobaan baru (KF-11, KF-18)', async () => {
    const siswa = await buatSiswa(db);
    const pertama = await rpcSebagai(db, siswa, 'mulai_kuis');
    const lagi = await rpcSebagai(db, siswa, 'mulai_kuis');
    expect(lagi.sesi_kuis_id).toBe(pertama.sesi_kuis_id);
    expect(lagi.batas_waktu).toBe(pertama.batas_waktu);
    expect(lagi.soal).toEqual(pertama.soal);
    const { rows } = await db.query('select count(*)::int as n from public.sesi_kuis where siswa_id = $1', [siswa.siswaId]);
    expect(rows[0].n).toBe(1);
  });

  test('percobaan kedua memakai 20 soal berbeda; percobaan ketiga ditolak (KF-13, KF-14)', async () => {
    const siswa = await buatSiswa(db);
    const s1 = await rpcSebagai(db, siswa, 'mulai_kuis');
    await rpcSebagai(db, siswa, 'selesaikan_kuis', { p_sesi_kuis_id: s1.sesi_kuis_id });
    const s2 = await rpcSebagai(db, siswa, 'mulai_kuis');
    expect(s2.percobaan_ke).toBe(2);
    const id1 = new Set(s1.soal.map((s) => s.id));
    expect(s2.soal.some((s) => id1.has(s.id))).toBe(false);
    await rpcSebagai(db, siswa, 'selesaikan_kuis', { p_sesi_kuis_id: s2.sesi_kuis_id });
    await expect(rpcSebagai(db, siswa, 'mulai_kuis')).rejects.toThrow(/BATAS_PERCOBAAN_KUIS/);
  });

  test('sesi yang habis waktunya tetap dihitung sebagai percobaan (KF-13 P3)', async () => {
    const siswa = await buatSiswa(db);
    const s1 = await rpcSebagai(db, siswa, 'mulai_kuis');
    await mundurkanWaktu(s1.sesi_kuis_id, 31);
    const s2 = await rpcSebagai(db, siswa, 'mulai_kuis');
    expect(s2.percobaan_ke).toBe(2);
    expect(s2.sesi_kuis_id).not.toBe(s1.sesi_kuis_id);
  });
});

describe('BANK_SOAL_KURANG (KF-14, KF-21)', () => {
  test('bank kurang → galat dengan rincian kombinasi, tanpa sesi dan tanpa percobaan terpakai', async () => {
    const dbKurang = await buatDb();
    await isiBankKuis(dbKurang, { kurangiNomor: 1 });
    const siswa = await buatSiswa(dbKurang);
    await sebagai(dbKurang, siswa.authId);
    let galat;
    try {
      await dbKurang.query('select public.mulai_kuis()');
    } catch (e) {
      galat = e;
    }
    await sebagaiAdmin(dbKurang);
    expect(galat.message).toBe('BANK_SOAL_KURANG');
    expect(JSON.parse(galat.detail)).toEqual({
      kombinasi_kurang: [{ kategori_kuis: 'konsep', tingkat: 1, bentuk: 'pilihan_ganda', tersedia: 3, minimum: 4 }],
    });
    const { rows } = await dbKurang.query('select count(*)::int as n from public.sesi_kuis');
    expect(rows[0].n).toBe(0);
  }, 60000);

  test('soal dinonaktifkan setelah percobaan 1 → percobaan 2 gagal, soal lama tidak dipakai ulang, kesempatan tetap (KF-14)', async () => {
    const dbB = await buatDb();
    await isiBankKuis(dbB);
    const siswa = await buatSiswa(dbB);
    await sebagai(dbB, siswa.authId);
    const s1 = (await dbB.query('select public.mulai_kuis() as h')).rows[0].h;
    await dbB.query('select public.selesaikan_kuis($1)', [s1.sesi_kuis_id]);
    await sebagaiAdmin(dbB);

    // Nomor 20 (penerapan, sulit, pilihan ganda): nonaktifkan satu-satunya kandidat baru.
    const dipakai = s1.soal.find((s) => s.nomor === 20).id;
    await dbB.query(
      `update public.soal set aktif = false
        where bank = 'kuis' and kategori_kuis = 'penerapan' and tingkat = 3 and id <> $1`, [dipakai]);

    await sebagai(dbB, siswa.authId);
    await expect(dbB.query('select public.mulai_kuis()')).rejects.toThrow(/BANK_SOAL_KURANG/);
    const status = (await dbB.query('select public.status_kuis() as h')).rows[0].h;
    await sebagaiAdmin(dbB);

    expect(status.percobaan).toMatchObject({ digunakan: 1, sisa: 1 });
    const { rows } = await dbB.query('select count(*)::int as n from public.sesi_kuis where siswa_id = $1', [siswa.siswaId]);
    expect(rows[0].n).toBe(1);
  }, 60000);
});

describe('3.6 periksa_jawaban — kuis', () => {
  test('menyimpan tanpa membocorkan benar/salah; RLS menyembunyikan baris selama kuis', async () => {
    const siswa = await buatSiswa(db);
    const sesi = await rpcSebagai(db, siswa, 'mulai_kuis');
    const hasil = await jawabKuis(siswa, sesi, sesi.soal[0], { benar: false });
    expect(hasil).toEqual({ tersimpan: true });

    await sebagai(db, siswa.authId);
    const { rows } = await db.query('select benar from public.percobaan_jawaban');
    await sebagaiAdmin(db);
    expect(rows).toEqual([]);

    await rpcSebagai(db, siswa, 'selesaikan_kuis', { p_sesi_kuis_id: sesi.sesi_kuis_id });
    await sebagai(db, siswa.authId);
    const sesudah = await db.query('select benar from public.percobaan_jawaban');
    await sebagaiAdmin(db);
    expect(sesudah.rows).toEqual([{ benar: false }]);
  });

  test('petunjuk tidak tercatat di kuis; soal di luar sesi ditolak', async () => {
    const siswa = await buatSiswa(db);
    const sesi = await rpcSebagai(db, siswa, 'mulai_kuis');
    const latihan = await tambahSoalLatihan(db, `L-${siswa.siswaId}`);
    await expect(rpcSebagai(db, siswa, 'periksa_jawaban', {
      p_soal_id: latihan, p_jawaban: 80000, p_jumlah_petunjuk: 0, p_durasi_detik: 1, p_sesi_kuis_id: sesi.sesi_kuis_id,
    })).rejects.toThrow(/SOAL_TIDAK_DITEMUKAN/);
  });

  test('opsi tidak dikenal → OPSI_TIDAK_VALID; huruf "A" bukan id opsi (KF-18 O5)', async () => {
    const siswa = await buatSiswa(db);
    const sesi = await rpcSebagai(db, siswa, 'mulai_kuis');
    const pg = sesi.soal.find((s) => s.bentuk === 'pilihan_ganda');
    await expect(jawabKuis(siswa, sesi, pg, { opsi: 'A' })).rejects.toThrow(/OPSI_TIDAK_VALID/);
  });

  test('sesi milik siswa lain → SESI_TIDAK_VALID', async () => {
    const a = await buatSiswa(db);
    const b = await buatSiswa(db);
    const sesi = await rpcSebagai(db, a, 'mulai_kuis');
    await expect(jawabKuis(b, sesi, sesi.soal[0])).rejects.toThrow(/SESI_TIDAK_VALID/);
    await expect(rpcSebagai(db, b, 'selesaikan_kuis', { p_sesi_kuis_id: sesi.sesi_kuis_id }))
      .rejects.toThrow(/SESI_TIDAK_VALID/);
  });

  test('jawaban terakhir yang diterima server yang dinilai (KF-22)', async () => {
    const siswa = await buatSiswa(db);
    const sesi = await rpcSebagai(db, siswa, 'mulai_kuis');
    const pg = sesi.soal.find((s) => s.bentuk === 'pilihan_ganda');
    await jawabKuis(siswa, sesi, pg, { opsi: 'o2' });
    await jawabKuis(siswa, sesi, pg, { opsi: 'o1' });
    const lanjut = await rpcSebagai(db, siswa, 'mulai_kuis');
    expect(lanjut.jawaban_tersimpan).toEqual([{ soal_id: pg.id, jawaban: null, opsi: 'o1' }]);
    const hasil = await rpcSebagai(db, siswa, 'selesaikan_kuis', { p_sesi_kuis_id: sesi.sesi_kuis_id });
    expect(hasil.jumlah_benar).toBe(1);
  });

  test('setelah batas waktu → WAKTU_HABIS; setelah dikumpulkan → KUIS_SUDAH_SELESAI', async () => {
    const a = await buatSiswa(db);
    const sesiA = await rpcSebagai(db, a, 'mulai_kuis');
    await mundurkanWaktu(sesiA.sesi_kuis_id, 31);
    await expect(jawabKuis(a, sesiA, sesiA.soal[0])).rejects.toThrow(/WAKTU_HABIS/);

    const b = await buatSiswa(db);
    const sesiB = await rpcSebagai(db, b, 'mulai_kuis');
    await rpcSebagai(db, b, 'selesaikan_kuis', { p_sesi_kuis_id: sesiB.sesi_kuis_id });
    await expect(jawabKuis(b, sesiB, sesiB.soal[0])).rejects.toThrow(/KUIS_SUDAH_SELESAI/);
  });
});

describe('3.8 selesaikan_kuis', () => {
  test('nilai, rincian 20 soal dengan kunci dan pembahasan, soal kosong dihitung salah', async () => {
    const siswa = await buatSiswa(db);
    const sesi = await rpcSebagai(db, siswa, 'mulai_kuis');
    // 14 benar, 4 salah, 2 tidak dijawab
    for (const [i, soal] of sesi.soal.entries()) {
      if (i < 14) await jawabKuis(siswa, sesi, soal, { benar: true });
      else if (i < 18) await jawabKuis(siswa, sesi, soal, { benar: false });
    }
    const hasil = await rpcSebagai(db, siswa, 'selesaikan_kuis', { p_sesi_kuis_id: sesi.sesi_kuis_id });
    expect(hasil).toMatchObject({
      skor: 70, percobaan_ke: 1, sisa_percobaan: 1, nilai_tertinggi: 70, jumlah_soal: 20,
      jumlah_benar: 14, jumlah_salah: 6, jumlah_tidak_dijawab: 2, cara_selesai: 'siswa',
      nomor_salah: [15, 16, 17, 18, 19, 20],
    });
    expect(hasil.rincian).toHaveLength(20);
    const salahPg = hasil.rincian.find((r) => r.status === 'salah' && r.bentuk === 'pilihan_ganda');
    expect(salahPg.jenis_kesalahan).toBe('SATUAN_WAKTU');
    expect(salahPg.pesan).toBe('Ubah dulu bulan ke tahun.');
    expect(salahPg.opsi.filter((o) => o.kunci)).toHaveLength(1);
    const soalAsli = sesi.soal.find((s) => s.id === salahPg.soal_id);
    expect(salahPg.opsi.map((o) => [o.id, o.huruf])).toEqual(soalAsli.opsi.map((o) => [o.id, o.huruf]));
    expect(salahPg.huruf_dipilih).toBe(soalAsli.opsi.find((o) => o.id === 'o2').huruf);
    const kosong = hasil.rincian.find((r) => r.status === 'tidak_dijawab');
    expect(kosong).toMatchObject({ jawaban_siswa: null, jenis_kesalahan: null });
    expect(hasil.rincian.every((r) => r.pembahasan.length === 4)).toBe(true);
  });

  test('aman dipanggil dua kali: hasil sama', async () => {
    const siswa = await buatSiswa(db);
    const sesi = await rpcSebagai(db, siswa, 'mulai_kuis');
    await jawabKuis(siswa, sesi, sesi.soal[0]);
    const satu = await rpcSebagai(db, siswa, 'selesaikan_kuis', { p_sesi_kuis_id: sesi.sesi_kuis_id });
    const dua = await rpcSebagai(db, siswa, 'selesaikan_kuis', { p_sesi_kuis_id: sesi.sesi_kuis_id });
    expect(dua).toEqual(satu);
  });

  test('ditutup server karena waktu habis: hanya jawaban sebelum batas yang dinilai', async () => {
    const siswa = await buatSiswa(db);
    const sesi = await rpcSebagai(db, siswa, 'mulai_kuis');
    await jawabKuis(siswa, sesi, sesi.soal[0]);
    await jawabKuis(siswa, sesi, sesi.soal[1]);
    await mundurkanWaktu(sesi.sesi_kuis_id, 31);

    const status = await rpcSebagai(db, siswa, 'status_kuis');
    expect(status.sesi_aktif).toBeNull();
    expect(status.dikumpulkan_otomatis).toMatchObject({ sesi_kuis_id: sesi.sesi_kuis_id, skor: 10 });
    expect(status.percobaan).toEqual({ maks: 2, digunakan: 1, sisa: 1, nilai_tertinggi: 10 });

    const hasil = await rpcSebagai(db, siswa, 'selesaikan_kuis', { p_sesi_kuis_id: sesi.sesi_kuis_id });
    expect(hasil).toMatchObject({ cara_selesai: 'waktu_habis', jumlah_benar: 2, skor: 10 });
    const { rows } = await db.query('select selesai_pada = batas_waktu as tepat from public.sesi_kuis where id = $1', [sesi.sesi_kuis_id]);
    expect(rows[0].tepat).toBe(true);

    // Sudah dibuka → tidak lagi dilaporkan sebagai dikumpulkan otomatis.
    expect((await rpcSebagai(db, siswa, 'status_kuis')).dikumpulkan_otomatis).toBeNull();
  });
});

describe('3.7a status_kuis', () => {
  test('sesi aktif dikembalikan tanpa membuat sesi baru', async () => {
    const siswa = await buatSiswa(db);
    const kosong = await rpcSebagai(db, siswa, 'status_kuis');
    expect(kosong).toMatchObject({ sesi_aktif: null, dikumpulkan_otomatis: null });
    expect(kosong.percobaan).toEqual({ maks: 2, digunakan: 0, sisa: 2, nilai_tertinggi: null });

    const sesi = await rpcSebagai(db, siswa, 'mulai_kuis');
    const status = await rpcSebagai(db, siswa, 'status_kuis');
    expect(status.sesi_aktif.sesi_kuis_id).toBe(sesi.sesi_kuis_id);
    expect(status.percobaan.digunakan).toBe(1);
  });
});

describe('3.9 ringkasan_kemajuan dan 3.10 riwayat_belajar', () => {
  test('nilai tertinggi dari 2 percobaan, kesalahan tersering, dan sub-bab berikutnya', async () => {
    const siswa = await buatSiswa(db);
    await rpcSebagai(db, siswa, 'simpan_kemajuan', { p_sub_materi: 'P0', p_status: 'selesai', p_kartu_terakhir: 3 });
    await rpcSebagai(db, siswa, 'simpan_kemajuan', { p_sub_materi: 'M1', p_status: 'selesai', p_kartu_terakhir: 3 });

    const s1 = await rpcSebagai(db, siswa, 'mulai_kuis');
    for (const soal of s1.soal.slice(0, 4)) await jawabKuis(siswa, s1, soal, { benar: false });
    await rpcSebagai(db, siswa, 'selesaikan_kuis', { p_sesi_kuis_id: s1.sesi_kuis_id });
    const s2 = await rpcSebagai(db, siswa, 'mulai_kuis');
    for (const soal of s2.soal.slice(0, 6)) await jawabKuis(siswa, s2, soal, { benar: true });
    await rpcSebagai(db, siswa, 'selesaikan_kuis', { p_sesi_kuis_id: s2.sesi_kuis_id });

    const latihan = await tambahSoalLatihan(db, `R-${siswa.siswaId}`);
    await rpcSebagai(db, siswa, 'periksa_jawaban', {
      p_soal_id: latihan, p_jawaban: 8000000, p_jumlah_petunjuk: 1, p_durasi_detik: 5, p_sesi_kuis_id: null,
    });

    const r = await rpcSebagai(db, siswa, 'ringkasan_kemajuan');
    expect(r).toMatchObject({ sub_materi_selesai: 2, total_sub_materi: 7, sub_materi_lanjut: 'M2' });
    expect(r.kuis.nilai_tertinggi).toBe(30);
    expect(r.kuis.sisa_percobaan).toBe(0);
    expect(r.kuis.percobaan.map((p) => [p.percobaan_ke, p.skor])).toEqual([[1, 0], [2, 30]]);
    expect(r.kesalahan_tersering).toEqual([
      { jenis: 'SATUAN_WAKTU', jumlah: 4, sub_materi_terkait: 'M3' },
      { jenis: 'PERSEN', jumlah: 1, sub_materi_terkait: 'P0' },
    ]);

    const riwayat = await rpcSebagai(db, siswa, 'riwayat_belajar', { p_batas: 20 });
    expect(riwayat.map((x) => x.jenis)).toEqual(['latihan', 'kuis', 'kuis']);
    expect(riwayat[0]).toMatchObject({ sub_materi: 'M3', tingkat: 2, benar: 0, jumlah: 1 });
    expect(riwayat[1]).toMatchObject({ percobaan_ke: 2, skor: 30, cara_selesai: 'siswa' });

    const halaman2 = await rpcSebagai(db, siswa, 'riwayat_belajar', { p_batas: 1, p_sebelum: riwayat[0].waktu });
    expect(halaman2).toHaveLength(1);
    await expect(rpcSebagai(db, siswa, 'riwayat_belajar', { p_batas: 51 })).rejects.toThrow(/INPUT_TIDAK_VALID/);
  });
});
