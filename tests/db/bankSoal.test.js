// Fase 7 — bank soal (supabase/seed/data/bankSoal.js → soal.sql) terhadap migrasi dan RPC asli di PGlite.
import { describe, test, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { buatDb, buatSiswa, rpcSebagai, sebagaiAdmin } from './bantuDb.js';
import { SOAL_LATIHAN, SOAL_KUIS, SEMUA_SOAL } from '../../supabase/seed/data/bankSoal.js';
import {
  buatSql, kunciRapi, petunjukMembocorkan, TOLERANSI, buatSoalIsian, buatSoalPilihanGanda,
} from '../../supabase/seed/inti/bankSoal.js';

const AKAR = join(import.meta.dirname, '..', '..');
const SQL_BERKAS = readFileSync(join(AKAR, 'supabase', 'seed', 'soal.sql'), 'utf8');
const SQL_PERIKSA = readFileSync(join(AKAR, 'supabase', 'seed', 'periksa-bank-soal.sql'), 'utf8');

const kelompok = (daftar, kunci) => daftar.reduce((acc, s) => {
  const k = kunci(s);
  acc[k] = (acc[k] ?? 0) + 1;
  return acc;
}, {});

const teksSemua = (s) => [s.teks_soal, ...(s.petunjuk ?? []), ...s.pembahasan.map((l) => l.isi),
  ...(s.opsi ?? []).map((o) => o.teks), ...s.pola_kesalahan.map((p) => p.pesan)];

describe('Isi bank soal (task.md Fase 7)', () => {
  test('soal.sql sama dengan hasil generator (tidak disunting manual)', () => {
    expect(SQL_BERKAS).toBe(buatSql(SEMUA_SOAL, {
      judul: `Bank soal Lanora: ${SOAL_LATIHAN.length} latihan + ${SOAL_KUIS.length} kuis`,
    }));
  });

  test('bank latihan: 60 soal isian, sebaran P0 6, M2 10, M3 12, M4 10, M5 14, M6 8, setiap tingkat terisi', () => {
    expect(SOAL_LATIHAN).toHaveLength(60);
    expect(SOAL_LATIHAN.every((s) => s.bank === 'latihan' && s.bentuk === 'isian' && s.kategori_kuis === null)).toBe(true);
    expect(kelompok(SOAL_LATIHAN, (s) => s.sub_materi)).toEqual({ P0: 6, M2: 10, M3: 12, M4: 10, M5: 14, M6: 8 });
    for (const sub of ['P0', 'M2', 'M3', 'M4', 'M5', 'M6']) {
      for (const t of [1, 2, 3]) {
        expect(SOAL_LATIHAN.some((s) => s.sub_materi === sub && s.tingkat === t), `${sub} T${t}`).toBe(true);
      }
    }
  });

  test('bank kuis: 40 soal, 15:5 per kisi-kisi → 30 pilihan ganda + 10 isian, tanpa petunjuk', () => {
    expect(SOAL_KUIS).toHaveLength(40);
    expect(kelompok(SOAL_KUIS, (s) => s.bentuk)).toEqual({ pilihan_ganda: 30, isian: 10 });
    expect(SOAL_KUIS.every((s) => s.bank === 'kuis' && s.kategori_kuis && s.petunjuk === null)).toBe(true);
  });

  test('kode unik, dan tidak ada teks soal yang sama di bank latihan dan kuis (KF-14 S1)', () => {
    expect(new Set(SEMUA_SOAL.map((s) => s.kode)).size).toBe(SEMUA_SOAL.length);
    expect(new Set(SEMUA_SOAL.map((s) => s.teks_soal)).size).toBe(SEMUA_SOAL.length);
  });

  test('kunci isian rapi dan toleransi sesuai satuan (KF-19)', () => {
    for (const s of SEMUA_SOAL.filter((x) => x.bentuk === 'isian')) {
      expect(kunciRapi(s.jawaban, s.satuan_jawaban), s.kode).toBe(true);
      expect(s.toleransi, s.kode).toBe(TOLERANSI[s.satuan_jawaban]);
    }
  });

  test('tepat 3 petunjuk latihan, tanpa jawaban akhir (KF-15 H6); pembahasan 4 langkah', () => {
    for (const s of SOAL_LATIHAN) {
      expect(s.petunjuk, s.kode).toHaveLength(3);
      const diketahui = Object.values(s.diketahui).filter((x) => typeof x === 'number');
      expect(petunjukMembocorkan(s.petunjuk, s.jawaban, diketahui), s.kode).toBe(false);
    }
    for (const s of SEMUA_SOAL) {
      expect(s.pembahasan.map((l) => l.langkah), s.kode).toEqual(['Pahami', 'Rencanakan', 'Hitung', 'Periksa']);
    }
  });

  test('pemeriksa petunjuk benar-benar menangkap jawaban yang bocor', () => {
    expect(petunjukMembocorkan(['Jawabannya Rp80.000.'], 80000, [2000000, 6, 8])).toBe(true);
    expect(petunjukMembocorkan(['Masukkan p = 6.'], 6, [6])).toBe(false); // 6 berasal dari data soal
  });

  test('notasi KF-03: tidak ada "p%"; rumus resmi dipakai', () => {
    const semua = SEMUA_SOAL.flatMap(teksSemua).join('\n');
    expect(semua).not.toMatch(/p%/);
    expect(semua).not.toMatch(/\bn\s*=|\bMa\b/);
    expect(semua).toContain('B = M × (p/100) × t');
  });

  test('pilihan ganda: 4 opsi o1–o4, tepat satu kunci, teks berbeda; pengecoh hitungan memakai pola kesalahan', () => {
    for (const s of SOAL_KUIS.filter((x) => x.bentuk === 'pilihan_ganda')) {
      expect(s.opsi.map((o) => o.id), s.kode).toEqual(['o1', 'o2', 'o3', 'o4']);
      expect(s.opsi.filter((o) => o.kunci), s.kode).toHaveLength(1);
      expect(new Set(s.opsi.map((o) => o.teks)).size, s.kode).toBe(4);
      if (s.kategori_kuis !== 'konsep') {
        expect(s.opsi.some((o) => !o.kunci && o.jenis_kesalahan), s.kode).toBe(true);
        expect(s.opsi.find((o) => o.kunci).nilai).toBe(s.jawaban);
      }
    }
    // Letak kunci di bank tidak selalu o1
    expect(new Set(SOAL_KUIS.map((s) => s.opsi?.findIndex((o) => o.kunci))).size).toBeGreaterThan(1);
  });

  test('generator menolak kunci tidak rapi dan data yang tidak konsisten', () => {
    const dasar = { kode: 'X', sub: 'M3', tingkat: 1, bank: 'latihan', konteks: { nama: 'A', tempat: 'bank' } };
    expect(() => buatSoalIsian({ ...dasar, ditanya: 'bunga', modal: 1000000, p: 7, lama: 5, satuan: 'bulan' }))
      .toThrow(/tidak rapi/);
    expect(() => buatSoalPilihanGanda({ ...dasar, kategori: 'besar_bunga', ditanya: 'bunga', modal: 1200000, p: 6, lama: 6, satuan: 'bulan' }))
      .not.toThrow();
  });
});

describe('soal.sql di database (migrasi + RPC asli)', () => {
  let db;
  let idKeSoal;

  beforeAll(async () => {
    db = await buatDb();
    await sebagaiAdmin(db);
    await db.exec(SQL_BERKAS);
    await db.exec(SQL_BERKAS); // dijalankan dua kali: tetap aman (on conflict do nothing)
    const { rows } = await db.query('select id, kode from public.soal');
    const perKode = Object.fromEntries(SEMUA_SOAL.map((s) => [s.kode, s]));
    idKeSoal = Object.fromEntries(rows.map((r) => [r.id, perKode[r.kode]]));
  }, 120000);

  test('semua soal masuk tanpa melanggar batasan tabel; kueri kecukupan: semua "cukup"', async () => {
    await sebagaiAdmin(db);
    expect(Number((await db.query('select count(*) as n from public.soal')).rows[0].n)).toBe(100);
    const tanpaKomentar = SQL_PERIKSA.replace(/--.*$/gm, '');
    const hasil = await db.query(tanpaKomentar.split(';')[0]);
    expect(hasil.rows).toHaveLength(17);
    expect(hasil.rows.every((r) => r.status === 'cukup')).toBe(true);
    expect(hasil.rows.reduce((n, r) => n + Number(r.minimum), 0)).toBe(40);
  });

  test('latihan: kunci dinilai benar, setiap pola kesalahan dikenali, petunjuk 1–3 tersedia', async () => {
    const siswa = await buatSiswa(db);
    for (const [id, s] of Object.entries(idKeSoal).filter(([, x]) => x.bank === 'latihan')) {
      const benar = await rpcSebagai(db, siswa, 'periksa_jawaban', {
        p_soal_id: id, p_jawaban: s.jawaban, p_jumlah_petunjuk: 0, p_durasi_detik: 5, p_sesi_kuis_id: null,
      });
      expect(benar.benar, s.kode).toBe(true);
      expect(benar.pembahasan).toHaveLength(4);
      for (const pola of s.pola_kesalahan) {
        const salah = await rpcSebagai(db, siswa, 'periksa_jawaban', {
          p_soal_id: id, p_jawaban: pola.nilai, p_jumlah_petunjuk: 1, p_durasi_detik: 5, p_sesi_kuis_id: null,
        });
        expect(salah.benar, `${s.kode} ${pola.jenis}`).toBe(false);
        expect(salah.jenis_kesalahan, `${s.kode} ${pola.jenis}`).toBe(pola.jenis);
      }
    }
    const [idContoh] = Object.entries(idKeSoal).find(([, x]) => x.kode === 'M3-T2-01');
    const p3 = await rpcSebagai(db, siswa, 'ambil_petunjuk', { p_soal_id: idContoh, p_level: 3 });
    expect(p3.langkah).toBe('Hitung');
    expect(p3.teks).toContain('9/12');
  }, 120000);

  test('ambil_soal_latihan: hanya bank latihan, per sub-bab dan tingkat', async () => {
    const siswa = await buatSiswa(db);
    const soal = await rpcSebagai(db, siswa, 'ambil_soal_latihan', { p_sub_materi: 'M3', p_tingkat: 2, p_jumlah: 5 });
    expect(soal).toHaveLength(4);
    expect(soal.every((s) => idKeSoal[s.id].bank === 'latihan' && s.sub_materi === 'M3' && s.tingkat === 2)).toBe(true);
    expect(soal[0]).not.toHaveProperty('jawaban');
  });

  test('kuis: dua percobaan × 20 soal berbeda sesuai kisi-kisi; semua benar → 100; percobaan ketiga ditolak', async () => {
    const siswa = await buatSiswa(db);
    const dipakai = new Set();
    for (const percobaan of [1, 2]) {
      const sesi = await rpcSebagai(db, siswa, 'mulai_kuis');
      expect(sesi.percobaan_ke).toBe(percobaan);
      expect(sesi.soal).toHaveLength(20);
      expect(sesi.soal.filter((s) => s.bentuk === 'pilihan_ganda')).toHaveLength(15);
      for (const s of sesi.soal) {
        expect(dipakai.has(s.id)).toBe(false);
        dipakai.add(s.id);
        const bank = idKeSoal[s.id];
        await rpcSebagai(db, siswa, 'periksa_jawaban', {
          p_soal_id: s.id,
          p_jawaban: bank.bentuk === 'isian' ? bank.jawaban : null,
          p_jumlah_petunjuk: 0,
          p_durasi_detik: 3,
          p_sesi_kuis_id: sesi.sesi_kuis_id,
          p_opsi: bank.bentuk === 'pilihan_ganda' ? bank.opsi.find((o) => o.kunci).id : null,
        });
      }
      const hasil = await rpcSebagai(db, siswa, 'selesaikan_kuis', { p_sesi_kuis_id: sesi.sesi_kuis_id });
      expect(hasil.skor).toBe(100);
      expect(hasil.rincian.every((r) => r.pembahasan.length === 4)).toBe(true);
    }
    await expect(rpcSebagai(db, siswa, 'mulai_kuis')).rejects.toThrow(/BATAS_PERCOBAAN_KUIS/);
  }, 120000);

  test('kuis: memilih pengecoh memberi jenis kesalahan dan pesannya di hasil', async () => {
    const siswa = await buatSiswa(db);
    const sesi = await rpcSebagai(db, siswa, 'mulai_kuis');
    const pg = sesi.soal.find((s) => idKeSoal[s.id].kategori_kuis === 'besar_bunga' && s.bentuk === 'pilihan_ganda');
    const pengecoh = idKeSoal[pg.id].opsi.find((o) => !o.kunci && o.jenis_kesalahan);
    await rpcSebagai(db, siswa, 'periksa_jawaban', {
      p_soal_id: pg.id, p_jawaban: null, p_jumlah_petunjuk: 0, p_durasi_detik: 3,
      p_sesi_kuis_id: sesi.sesi_kuis_id, p_opsi: pengecoh.id,
    });
    const hasil = await rpcSebagai(db, siswa, 'selesaikan_kuis', { p_sesi_kuis_id: sesi.sesi_kuis_id });
    const r = hasil.rincian.find((x) => x.soal_id === pg.id);
    expect(r.status).toBe('salah');
    expect(r.jenis_kesalahan).toBe(pengecoh.jenis_kesalahan);
    expect(r.pesan).toBeTruthy();
    expect(hasil.jumlah_tidak_dijawab).toBe(19);
  }, 60000);
});
