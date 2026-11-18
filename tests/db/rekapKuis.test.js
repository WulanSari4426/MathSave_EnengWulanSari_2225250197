// Tes Database: View Rekapitulasi Nilai Kuis untuk Peneliti (Fase 9, PRD PP-10).
// Menguji: hak akses (anon/siswa ditolak, service_role diizinkan), privasi kolom,
// dan akurasi kalkulasi skor, jumlah benar, salah, tidak dijawab, durasi, dan nilai tertinggi.
import { describe, test, expect, beforeAll } from 'vitest';
import { buatDb, buatSiswa, sebagai, sebagaiAdmin, sebagaiAnon, rpcSebagai } from './bantuDb.js';
import { isiBankKuis } from './soalUji.js';

let db;
let siswaBelum;
let siswaP1;
let siswaP2;
let siswaP2Menurun;

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

  // 1. Siswa belum pernah kuis
  siswaBelum = await buatSiswa(db, { nama: 'charlie_01', kelas: 'VIII-A' });

  // 2. Siswa hanya selesai P1: 14 benar, 4 salah, 2 kosong
  siswaP1 = await buatSiswa(db, { nama: 'deni_02', kelas: 'VIII-A' });
  const s1 = await rpcSebagai(db, siswaP1, 'mulai_kuis');
  for (let i = 0; i < 14; i++) await jawabKuis(siswaP1, s1, s1.soal[i], { benar: true });
  for (let i = 14; i < 18; i++) await jawabKuis(siswaP1, s1, s1.soal[i], { benar: false });
  // Soal 18 & 19 (indeks) tidak dijawab (2 soal kosong)
  await rpcSebagai(db, siswaP1, 'selesaikan_kuis', { p_sesi_kuis_id: s1.sesi_kuis_id });

  // 3. Siswa selesai P1 (10 benar = 50) dan P2 (18 benar = 90) -> nilai tertinggi 90
  siswaP2 = await buatSiswa(db, { nama: 'elsa_03', kelas: 'VIII-B' });
  const s2_1 = await rpcSebagai(db, siswaP2, 'mulai_kuis');
  for (let i = 0; i < 10; i++) await jawabKuis(siswaP2, s2_1, s2_1.soal[i], { benar: true });
  await rpcSebagai(db, siswaP2, 'selesaikan_kuis', { p_sesi_kuis_id: s2_1.sesi_kuis_id });

  const s2_2 = await rpcSebagai(db, siswaP2, 'mulai_kuis');
  for (let i = 0; i < 18; i++) await jawabKuis(siswaP2, s2_2, s2_2.soal[i], { benar: true });
  for (let i = 18; i < 20; i++) await jawabKuis(siswaP2, s2_2, s2_2.soal[i], { benar: false });
  await rpcSebagai(db, siswaP2, 'selesaikan_kuis', { p_sesi_kuis_id: s2_2.sesi_kuis_id });

  // 4. Siswa dengan nilai menurun: P1 (16 benar = 80) dan P2 (12 benar = 60) -> nilai tertinggi 80
  siswaP2Menurun = await buatSiswa(db, { nama: 'fani_04', kelas: 'VIII-B' });
  const s4_1 = await rpcSebagai(db, siswaP2Menurun, 'mulai_kuis');
  for (let i = 0; i < 16; i++) await jawabKuis(siswaP2Menurun, s4_1, s4_1.soal[i], { benar: true });
  await rpcSebagai(db, siswaP2Menurun, 'selesaikan_kuis', { p_sesi_kuis_id: s4_1.sesi_kuis_id });

  const s4_2 = await rpcSebagai(db, siswaP2Menurun, 'mulai_kuis');
  for (let i = 0; i < 12; i++) await jawabKuis(siswaP2Menurun, s4_2, s4_2.soal[i], { benar: true });
  await rpcSebagai(db, siswaP2Menurun, 'selesaikan_kuis', { p_sesi_kuis_id: s4_2.sesi_kuis_id });
}, 60000);

describe('Hak Akses dan Keamanan View Rekap Kuis', () => {
  test('anon tidak bisa membaca v_rekap_kuis maupun v_rekap_sesi_kuis', async () => {
    await sebagaiAnon(db);
    await expect(db.query('select * from public.v_rekap_kuis')).rejects.toThrow(/permission denied/);
    await expect(db.query('select * from public.v_rekap_sesi_kuis')).rejects.toThrow(/permission denied/);
    await sebagaiAdmin(db);
  });

  test('siswa (authenticated) tidak bisa membaca v_rekap_kuis maupun v_rekap_sesi_kuis', async () => {
    await sebagai(db, siswaP1.authId);
    await expect(db.query('select * from public.v_rekap_kuis')).rejects.toThrow(/permission denied/);
    await expect(db.query('select * from public.v_rekap_sesi_kuis')).rejects.toThrow(/permission denied/);
    await sebagaiAdmin(db);
  });

  test('admin / service_role dapat membaca kedua view dengan sukses', async () => {
    await sebagaiAdmin(db);
    const rekap = await db.query('select * from public.v_rekap_kuis');
    const sesi = await db.query('select * from public.v_rekap_sesi_kuis');
    expect(rekap.rows.length).toBeGreaterThanOrEqual(4);
    expect(sesi.rows.length).toBeGreaterThanOrEqual(5); // 1 + 2 + 2
  });

  test('view tidak memuat kolom rahasia (auth_user_id, kode_hash, PIN, password)', async () => {
    await sebagaiAdmin(db);
    const { rows: kolomRekap } = await db.query(
      `select column_name from information_schema.columns
       where table_schema = 'public' and table_name = 'v_rekap_kuis'`,
    );
    const namaKolom = kolomRekap.map((c) => c.column_name);
    for (const terlarang of ['auth_user_id', 'kode_hash', 'pin', 'password', 'token', 'secret']) {
      expect(namaKolom).not.toContain(terlarang);
    }
  });
});

describe('Kalkulasi dan Akurasi Data v_rekap_kuis (Per Siswa)', () => {
  test('siswa belum kuis: status belum_mulai, jumlah 0, seluruh metrik null', async () => {
    await sebagaiAdmin(db);
    const { rows } = await db.query(
      'select * from public.v_rekap_kuis where siswa_id = $1',
      [siswaBelum.siswaId],
    );
    expect(rows).toHaveLength(1);
    const r = rows[0];
    expect(r.status_kuis).toBe('belum_mulai');
    expect(r.jumlah_percobaan).toBe(0);
    expect(r.nilai_tertinggi).toBeNull();
    expect(r.p1_skor).toBeNull();
    expect(r.p2_skor).toBeNull();
  });

  test('siswa 1 percobaan: 14 benar, 4 salah, 2 tidak dijawab -> skor 70, sisa null', async () => {
    await sebagaiAdmin(db);
    const { rows } = await db.query(
      'select * from public.v_rekap_kuis where siswa_id = $1',
      [siswaP1.siswaId],
    );
    expect(rows).toHaveLength(1);
    const r = rows[0];
    expect(r.status_kuis).toBe('selesai_1_percobaan');
    expect(r.jumlah_percobaan).toBe(1);
    expect(r.nilai_tertinggi).toBe(70);

    // Percobaan 1
    expect(r.p1_skor).toBe(70);
    expect(r.p1_jumlah_benar).toBe(14);
    expect(r.p1_jumlah_salah).toBe(6); // 20 - 14
    expect(r.p1_jumlah_tidak_dijawab).toBe(2);
    expect(r.p1_cara_selesai).toBe('siswa');
    expect(r.p1_mulai_pada).toBeDefined();
    expect(r.p1_selesai_pada).toBeDefined();
    expect(r.p1_durasi_detik).toBeGreaterThanOrEqual(0);

    // Percobaan 2 masih kosong
    expect(r.p2_skor).toBeNull();
    expect(r.p2_jumlah_benar).toBeNull();
    expect(r.p2_jumlah_salah).toBeNull();
    expect(r.p2_jumlah_tidak_dijawab).toBeNull();
    expect(r.p2_selesai_pada).toBeNull();
  });

  test('siswa 2 percobaan (skor naik 50 -> 90): nilai tertinggi 90', async () => {
    await sebagaiAdmin(db);
    const { rows } = await db.query(
      'select * from public.v_rekap_kuis where siswa_id = $1',
      [siswaP2.siswaId],
    );
    expect(rows).toHaveLength(1);
    const r = rows[0];
    expect(r.status_kuis).toBe('selesai_2_percobaan');
    expect(r.jumlah_percobaan).toBe(2);
    expect(r.nilai_tertinggi).toBe(90);

    // P1: 10 benar
    expect(r.p1_skor).toBe(50);
    expect(r.p1_jumlah_benar).toBe(10);
    expect(r.p1_jumlah_salah).toBe(10);
    expect(r.p1_jumlah_tidak_dijawab).toBe(10);

    // P2: 18 benar, 2 salah, 0 tidak dijawab
    expect(r.p2_skor).toBe(90);
    expect(r.p2_jumlah_benar).toBe(18);
    expect(r.p2_jumlah_salah).toBe(2);
    expect(r.p2_jumlah_tidak_dijawab).toBe(0);
  });

  test('siswa 2 percobaan (skor turun 80 -> 60): nilai tertinggi tetap 80', async () => {
    await sebagaiAdmin(db);
    const { rows } = await db.query(
      'select * from public.v_rekap_kuis where siswa_id = $1',
      [siswaP2Menurun.siswaId],
    );
    expect(rows).toHaveLength(1);
    const r = rows[0];
    expect(r.status_kuis).toBe('selesai_2_percobaan');
    expect(r.p1_skor).toBe(80);
    expect(r.p2_skor).toBe(60);
    expect(r.nilai_tertinggi).toBe(80);
  });
});

describe('Kalkulasi dan Akurasi Data v_rekap_sesi_kuis (Per Sesi)', () => {
  test('mencatat setiap percobaan dalam baris tersendiri beserta nilai_tertinggi_siswa', async () => {
    await sebagaiAdmin(db);
    const { rows } = await db.query(
      `select percobaan_ke, skor, jumlah_benar, jumlah_salah, jumlah_tidak_dijawab,
              nilai_tertinggi_siswa, cara_selesai, status_sesi
       from public.v_rekap_sesi_kuis
       where siswa_id = $1 order by percobaan_ke`,
      [siswaP2.siswaId],
    );
    expect(rows).toHaveLength(2);

    expect(rows[0]).toMatchObject({
      percobaan_ke: 1,
      skor: 50,
      jumlah_benar: 10,
      jumlah_salah: 10,
      jumlah_tidak_dijawab: 10,
      nilai_tertinggi_siswa: 90,
      status_sesi: 'selesai',
    });

    expect(rows[1]).toMatchObject({
      percobaan_ke: 2,
      skor: 90,
      jumlah_benar: 18,
      jumlah_salah: 2,
      jumlah_tidak_dijawab: 0,
      nilai_tertinggi_siswa: 90,
      status_sesi: 'selesai',
    });
  });
});
