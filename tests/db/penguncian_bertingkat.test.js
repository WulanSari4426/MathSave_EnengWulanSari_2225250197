// Migrasi 20261112000006_penguncian_bertingkat.sql: penguncian bertingkat per username dan
// batas gagal login per IP. Alurnya diuji di tests/login/penguncianBertingkat.test.js.
import { describe, test, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { buatDb, jalankanMigrasi, sebagaiAdmin, sebagaiServiceRole, rpcSebagai } from './bantuDb.js';

const MIGRASI_6 = '20261112000006_penguncian_bertingkat.sql';

async function hakFungsi(db, nama) {
  await sebagaiAdmin(db);
  const { rows } = await db.query(
    `select has_function_privilege('anon', p.oid, 'execute') as anon,
            has_function_privilege('authenticated', p.oid, 'execute') as siswa,
            has_function_privilege('service_role', p.oid, 'execute') as server
       from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = $1`, [nama]);
  return rows;
}

describe('Struktur dan hak akses migrasi 0006', () => {
  let db;
  beforeAll(async () => { db = await buatDb(); }, 60000);

  test.each(['catat_percobaan_masuk', 'masuk_ip_terbatas', 'kunci_masuk_aktif'])(
    'fungsi %s hanya bisa dijalankan service_role', async (nama) => {
      expect(await hakFungsi(db, nama)).toEqual([{ anon: false, siswa: false, server: true }]);
    });

  test.each(['lama_kunci_masuk', 'batas_masuk_ip', '_tingkat_kunci_berlaku'])(
    'fungsi pembantu %s tertutup untuk anon dan siswa', async (nama) => {
      const [hak] = await hakFungsi(db, nama);
      expect(hak).toMatchObject({ anon: false, siswa: false });
    });

  test('RPC siswa Fase 4 tetap bisa dipanggil siswa setelah revoke di akhir migrasi', async () => {
    for (const nama of ['ambil_profil', 'periksa_jawaban', 'mulai_kuis', 'simpan_penjelasan']) {
      expect((await hakFungsi(db, nama))[0]).toMatchObject({ anon: false, siswa: true });
    }
  });

  test('lama kunci: 5, 15, lalu 60 menit; batas IP 100', async () => {
    await sebagaiAdmin(db);
    const { rows } = await db.query(
      `select extract(epoch from public.lama_kunci_masuk(t::smallint))::int / 60 as menit
         from generate_series(0, 4) t order by t`);
    expect(rows.map((r) => r.menit)).toEqual([5, 15, 60, 60, 60]);
    expect((await db.query('select public.batas_masuk_ip() as n')).rows[0].n).toBe(100);
  });

  test('tingkat_kunci dibatasi 0–3 oleh CHECK', async () => {
    await sebagaiAdmin(db);
    await expect(db.query(
      `insert into public.status_masuk (kode_hash, gagal_berturut, tingkat_kunci) values ('uji-cek', 0, 4)`))
      .rejects.toThrow(/check/);
  });

  test('masuk_ip_terbatas(null) → false; anon/siswa tidak bisa membaca percobaan_masuk', async () => {
    await sebagaiServiceRole(db);
    try {
      expect((await db.query('select public.masuk_ip_terbatas(null) as h')).rows[0].h).toBe(false);
    } finally {
      await sebagaiAdmin(db);
    }
  });

  test('file migrasi tanpa DROP, DELETE, TRUNCATE, atau UPDATE data', () => {
    const sql = readFileSync(join(import.meta.dirname, '..', '..', 'supabase', 'migrations', MIGRASI_6), 'utf8')
      .replace(/--.*$/gm, '');
    expect(sql).not.toMatch(/\b(drop|delete|truncate)\b/i);
    expect(sql).not.toMatch(/\bupdate\s+public\./i);
    expect(sql).toMatch(/revoke all on all functions in schema public from public, anon, authenticated;/);
  });
});

describe('Migrasi 0006 dijalankan di atas data yang sudah ada', () => {
  let db;
  let siswa;

  beforeAll(async () => {
    db = await buatDb({ sebelum: '20261112000006' });
    await sebagaiAdmin(db);
    siswa = { siswaId: randomUUID(), authId: randomUUID() };
    await db.query('insert into auth.users (id, email) values ($1, $2)', [siswa.authId, `${siswa.siswaId}@siswa.mathsave.invalid`]);
    await db.query(
      `insert into public.siswa (id, auth_user_id, kode_hash, nama_panggilan, kelas, pin_dibuat_pada)
       values ($1, $2, 'hash-lama', 'Rani', 'VIII-C', now())`, [siswa.siswaId, siswa.authId]);
    // Satu akun sedang terkunci, satu lagi punya 2 kegagalan, sebelum migrasi.
    await db.query(
      `insert into public.status_masuk (kode_hash, gagal_berturut, terkunci_sampai)
       values ('kunci-terkunci', 5, now() + interval '3 minutes'), ('kunci-dua', 2, null)`);
    await db.query(`insert into public.percobaan_masuk (ip_hash, kode_hash, berhasil) values ('ip-x', 'kunci-dua', false)`);
  }, 60000);

  test('baris lama tetap utuh, tingkat_kunci = 0, kunci yang berjalan tetap berlaku', async () => {
    const potret = async () => (await db.query(
      `select kode_hash, gagal_berturut, terkunci_sampai from public.status_masuk order by kode_hash`)).rows;
    await sebagaiAdmin(db);
    const sebelum = await potret();
    const jumlahLog = (await db.query('select count(*)::int as n from public.percobaan_masuk')).rows[0].n;

    await jalankanMigrasi(db, MIGRASI_6);

    await sebagaiAdmin(db);
    expect(await potret()).toEqual(sebelum);
    expect((await db.query('select count(*)::int as n from public.percobaan_masuk')).rows[0].n).toBe(jumlahLog);
    const tingkat = (await db.query('select distinct tingkat_kunci from public.status_masuk')).rows;
    expect(tingkat).toEqual([{ tingkat_kunci: 0 }]);

    await sebagaiServiceRole(db);
    try {
      expect((await db.query(`select public.kunci_masuk_aktif('kunci-terkunci') as h`)).rows[0].h).toBe(true);
      // Hitungan lama dilanjutkan: kegagalan ke-3, ke-4, lalu ke-5 mengunci 5 menit (tingkat 0 → 1).
      for (let i = 0; i < 3; i += 1) await db.query(`select public.catat_percobaan_masuk('kunci-dua', false, 'ip-x')`);
    } finally {
      await sebagaiAdmin(db);
    }
    const { rows } = await db.query(
      `select gagal_berturut, tingkat_kunci,
              round(extract(epoch from terkunci_sampai - now()) / 60)::int as menit
         from public.status_masuk where kode_hash = 'kunci-dua'`);
    expect(rows[0]).toEqual({ gagal_berturut: 5, tingkat_kunci: 1, menit: 5 });
  });

  test('data siswa dan RPC siswa tidak terpengaruh', async () => {
    const profil = await rpcSebagai(db, siswa, 'ambil_profil', {});
    expect(JSON.stringify(profil)).toContain('Rani');
  });
});
