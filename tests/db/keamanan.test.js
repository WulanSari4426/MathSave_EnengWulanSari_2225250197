// Fase 4 — "Selesai jika": siswa A tidak bisa membaca data siswa B,
// dan tabel soal tidak bisa dibaca langsung dari frontend. Juga: anon tanpa akses apa pun.
import { describe, test, expect, beforeAll } from 'vitest';
import { buatDb, buatSiswa, sebagai, sebagaiAdmin, sebagaiAnon, rpcSebagai } from './bantuDb.js';
import { tambahSoalLatihan } from './soalUji.js';

const SEMUA_TABEL = [
  'siswa', 'soal', 'sesi_kuis', 'kisi_kisi_kuis', 'sesi_kuis_soal', 'percobaan_jawaban',
  'kemajuan_materi', 'penjelasan_siswa', 'percobaan_masuk', 'status_masuk', 'reset_pin',
];

const RPC_SISWA = [
  'ambil_profil', 'simpan_kemajuan', 'ambil_soal_latihan', 'periksa_pemahaman', 'ambil_petunjuk',
  'periksa_jawaban', 'mulai_kuis', 'status_kuis', 'selesaikan_kuis', 'ringkasan_kemajuan',
  'riwayat_belajar', 'simpan_penjelasan',
];

let db;
let rani;
let budi;
let soalId;

beforeAll(async () => {
  db = await buatDb();
  rani = await buatSiswa(db, { nama: 'Rani' });
  budi = await buatSiswa(db, { nama: 'Budi' });
  soalId = await tambahSoalLatihan(db, 'M3-T2-01');
  await rpcSebagai(db, rani, 'simpan_kemajuan', { p_sub_materi: 'M1', p_status: 'sedang', p_kartu_terakhir: 2 });
  await rpcSebagai(db, rani, 'periksa_jawaban', {
    p_soal_id: soalId, p_jawaban: 80000, p_jumlah_petunjuk: 0, p_durasi_detik: 30, p_sesi_kuis_id: null,
  });
}, 60000);

describe('RLS aktif dan anon tanpa akses', () => {
  test('RLS aktif di semua tabel public', async () => {
    await sebagaiAdmin(db);
    const { rows } = await db.query(
      `select relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
       where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity`,
    );
    expect(rows).toEqual([]);
  });

  test.each(SEMUA_TABEL)('anon tidak bisa membaca tabel %s', async (tabel) => {
    await sebagaiAnon(db);
    await expect(db.query(`select * from public.${tabel}`)).rejects.toThrow(/permission denied/);
    await sebagaiAdmin(db);
  });

  test('anon tidak bisa menjalankan fungsi apa pun di public', async () => {
    await sebagaiAdmin(db);
    const { rows } = await db.query(
      `select p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
       where n.nspname = 'public' and has_function_privilege('anon', p.oid, 'execute')`,
    );
    expect(rows).toEqual([]);
  });

  test('siswa hanya bisa menjalankan RPC yang terdaftar di api.md (fungsi internal tertutup)', async () => {
    await sebagaiAdmin(db);
    const { rows } = await db.query(
      `select p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
       where n.nspname = 'public' and has_function_privilege('authenticated', p.oid, 'execute')
       order by 1`,
    );
    expect(rows.map((r) => r.proname).sort()).toEqual([...RPC_SISWA, 'id_siswa_saya'].sort());
  });
});

describe('Siswa hanya melihat datanya sendiri (KF-05 L5)', () => {
  test('tabel siswa: Budi hanya melihat dirinya', async () => {
    await sebagai(db, budi.authId);
    const { rows } = await db.query('select nama_panggilan from public.siswa');
    await sebagaiAdmin(db);
    expect(rows).toEqual([{ nama_panggilan: 'Budi' }]);
  });

  test('Budi tidak melihat jawaban dan kemajuan Rani', async () => {
    await sebagai(db, budi.authId);
    const jawaban = await db.query('select * from public.percobaan_jawaban');
    const kemajuan = await db.query('select * from public.kemajuan_materi');
    await sebagaiAdmin(db);
    expect(jawaban.rows).toEqual([]);
    expect(kemajuan.rows).toEqual([]);
  });

  test('Rani melihat jawaban dan kemajuannya sendiri', async () => {
    await sebagai(db, rani.authId);
    const jawaban = await db.query('select benar from public.percobaan_jawaban');
    const kemajuan = await db.query('select sub_materi from public.kemajuan_materi');
    await sebagaiAdmin(db);
    expect(jawaban.rows).toEqual([{ benar: true }]);
    expect(kemajuan.rows).toEqual([{ sub_materi: 'M1' }]);
  });

  test('siswa tidak bisa menulis langsung ke tabel jawaban, kemajuan, atau profil', async () => {
    await sebagai(db, rani.authId);
    await expect(
      db.query(`insert into public.percobaan_jawaban (siswa_id, soal_id, benar)
                values ($1, $2, true)`, [rani.siswaId, soalId]),
    ).rejects.toThrow(/permission denied/);
    await expect(db.query(`update public.siswa set kelas = 'IX'`)).rejects.toThrow(/permission denied/);
    await expect(
      db.query(`insert into public.kemajuan_materi (siswa_id, sub_materi, status)
                values ($1, 'M2', 'selesai')`, [rani.siswaId]),
    ).rejects.toThrow(/permission denied/);
    await sebagaiAdmin(db);
  });

  test('siswa tidak bisa menambah penjelasan atas nama siswa lain', async () => {
    await sebagai(db, budi.authId);
    await expect(
      db.query(`insert into public.penjelasan_siswa (siswa_id, soal_id, isi) values ($1, $2, 'x')`,
        [rani.siswaId, soalId]),
    ).rejects.toThrow(/row-level security/);
    await sebagaiAdmin(db);
  });

  test('siswa nonaktif ditolak TIDAK_MASUK', async () => {
    const nonaktif = await buatSiswa(db, { nama: 'Lama', aktif: false });
    await expect(rpcSebagai(db, nonaktif, 'ambil_profil')).rejects.toThrow(/TIDAK_MASUK/);
  });

  test('tanpa sesi (auth.uid kosong) ditolak TIDAK_MASUK', async () => {
    await sebagai(db, '00000000-0000-0000-0000-000000000000');
    await expect(db.query('select public.ambil_profil()')).rejects.toThrow(/TIDAK_MASUK/);
    await sebagaiAdmin(db);
  });
});

describe('Kunci jawaban tidak bisa dibaca langsung (AGENTS.md §7)', () => {
  test.each(['soal', 'kisi_kisi_kuis', 'sesi_kuis_soal', 'status_masuk', 'reset_pin', 'percobaan_masuk'])(
    'siswa tidak bisa SELECT tabel %s',
    async (tabel) => {
      await sebagai(db, rani.authId);
      await expect(db.query(`select * from public.${tabel}`)).rejects.toThrow(/permission denied/);
      await sebagaiAdmin(db);
    },
  );
});

describe('Batasan tabel soal (KF-14, KF-15, KF-18, KF-19)', () => {
  test('soal latihan pilihan ganda ditolak database', async () => {
    await sebagaiAdmin(db);
    const opsiSah = JSON.stringify([
      { id: 'o1', teks: 'a', kunci: true }, { id: 'o2', teks: 'b', kunci: false },
      { id: 'o3', teks: 'c', kunci: false }, { id: 'o4', teks: 'd', kunci: false },
    ]);
    await expect(
      db.query(`insert into public.soal (kode, sub_materi, tingkat, bank, bentuk, opsi, teks_soal, ditanya,
                  satuan_jawaban, petunjuk)
                values ('X-1', 'M1', 1, 'latihan', 'pilihan_ganda', $1, 't', 'bunga', 'rupiah', '["a","b","c"]')`,
        [opsiSah]),
    ).rejects.toThrow(/soal_latihan_isian_tanpa_kategori/);
  });

  test('soal kuis tanpa kategori ditolak', async () => {
    await expect(
      db.query(`insert into public.soal (kode, sub_materi, tingkat, bank, bentuk, teks_soal, ditanya,
                  satuan_jawaban, jawaban, toleransi)
                values ('X-2', 'M1', 1, 'kuis', 'isian', 't', 'bunga', 'rupiah', 1, 1)`),
    ).rejects.toThrow(/soal_kuis_punya_kategori/);
  });

  test('soal kuis dengan petunjuk ditolak (kuis tanpa petunjuk)', async () => {
    await expect(
      db.query(`insert into public.soal (kode, sub_materi, tingkat, bank, bentuk, kategori_kuis, teks_soal,
                  ditanya, satuan_jawaban, jawaban, toleransi, petunjuk)
                values ('X-3', 'M1', 1, 'kuis', 'isian', 'konsep', 't', 'bunga', 'rupiah', 1, 1, '["a","b","c"]')`),
    ).rejects.toThrow(/soal_kuis_tanpa_petunjuk/);
  });

  test('soal latihan tanpa 3 petunjuk ditolak', async () => {
    await expect(
      db.query(`insert into public.soal (kode, sub_materi, tingkat, bank, bentuk, teks_soal, ditanya,
                  satuan_jawaban, jawaban, toleransi, petunjuk)
                values ('X-4', 'M1', 1, 'latihan', 'isian', 't', 'bunga', 'rupiah', 1, 1, '["a","b"]')`),
    ).rejects.toThrow(/soal_latihan_tiga_petunjuk/);
  });

  test('pilihan ganda dengan dua kunci ditolak pemicu', async () => {
    const opsi = JSON.stringify([
      { id: 'o1', teks: 'a', kunci: true }, { id: 'o2', teks: 'b', kunci: true },
      { id: 'o3', teks: 'c', kunci: false }, { id: 'o4', teks: 'd', kunci: false },
    ]);
    await expect(
      db.query(`insert into public.soal (kode, sub_materi, tingkat, bank, bentuk, opsi, kategori_kuis,
                  teks_soal, ditanya, satuan_jawaban)
                values ('X-5', 'M1', 1, 'kuis', 'pilihan_ganda', $1, 'konsep', 't', 'bunga', 'rupiah')`, [opsi]),
    ).rejects.toThrow(/tepat satu opsi kunci/);
  });

  test('isian tanpa toleransi ditolak (KF-19)', async () => {
    await expect(
      db.query(`insert into public.soal (kode, sub_materi, tingkat, bank, bentuk, teks_soal, ditanya,
                  satuan_jawaban, jawaban, petunjuk)
                values ('X-6', 'M1', 1, 'latihan', 'isian', 't', 'bunga', 'rupiah', 1, '["a","b","c"]')`),
    ).rejects.toThrow(/soal_isian_punya_kunci/);
  });
});

describe('Kisi-kisi kuis (KF-21, KF-12, KF-10)', () => {
  test('20 nomor: 15 pilihan ganda + 5 isian, tingkat 6/10/4, submateri 3/5/4/4/2/2', async () => {
    await sebagaiAdmin(db);
    const { rows } = await db.query('select * from public.kisi_kisi_kuis order by nomor');
    expect(rows).toHaveLength(20);
    const hitung = (kolom) =>
      rows.reduce((acc, r) => ({ ...acc, [r[kolom]]: (acc[r[kolom]] ?? 0) + 1 }), {});
    expect(hitung('bentuk')).toEqual({ pilihan_ganda: 15, isian: 5 });
    expect(hitung('tingkat')).toEqual({ 1: 6, 2: 10, 3: 4 });
    expect(hitung('kategori_kuis')).toEqual({
      konsep: 3, besar_bunga: 5, tabungan_akhir: 4, modal_suku_bunga: 4, lama_menabung: 2, penerapan: 2,
    });
  });
});
