// Alat bantu tes database: menjalankan migrasi Supabase di PGlite (PostgreSQL WebAssembly).
// Bagian Supabase yang dibutuhkan (peran, auth.users, auth.uid(), hak bawaan) disimulasikan
// di sini saja, BUKAN di file migrasi.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';

const FOLDER_MIGRASI = join(import.meta.dirname, '..', '..', 'supabase', 'migrations');

// Meniru lingkungan Supabase: peran, skema auth, dan hak bawaan untuk objek baru di public.
const SIMULASI_SUPABASE = `
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin bypassrls;

  create schema auth;
  create table auth.users (id uuid primary key, email text);
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  $$;
  grant usage on schema auth to anon, authenticated, service_role;
  grant execute on function auth.uid() to anon, authenticated, service_role;

  grant usage on schema public to anon, authenticated, service_role;
  -- Supabase memberi hak penuh ke anon/authenticated untuk objek baru di public.
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
  alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
`;

export function daftarMigrasi() {
  return readdirSync(FOLDER_MIGRASI)
    .filter((nama) => nama.endsWith('.sql'))
    .sort();
}

/** Menjalankan satu file migrasi (nama file di supabase/migrations). */
export async function jalankanMigrasi(db, nama) {
  await db.exec(readFileSync(join(FOLDER_MIGRASI, nama), 'utf8'));
}

/**
 * @param {object} [opsi]
 * @param {string} [opsi.sebelum] jalankan hanya migrasi yang namanya < nilai ini,
 *                                misalnya '20261112000005' untuk meniru database sebelum Fase 5A
 */
export async function buatDb({ sebelum = null } = {}) {
  const db = new PGlite();
  await db.exec(SIMULASI_SUPABASE);
  for (const nama of daftarMigrasi()) {
    if (sebelum && nama >= sebelum) continue;
    await jalankanMigrasi(db, nama);
  }
  return db;
}

/** Kembali ke peran pemilik database (seperti service role / skrip pengelola). */
export async function sebagaiAdmin(db) {
  await db.exec(`reset role; select set_config('request.jwt.claim.sub', '', false);`);
}

/** Menjalankan perintah berikutnya sebagai pengguna masuk dengan auth.uid() tertentu. */
export async function sebagai(db, authId) {
  await db.exec(`reset role; set role authenticated;`);
  await db.query(`select set_config('request.jwt.claim.sub', $1, false)`, [authId]);
}

/** Seperti Edge Function / skrip pengelola: peran service_role. */
export async function sebagaiServiceRole(db) {
  await db.exec(`reset role; select set_config('request.jwt.claim.sub', '', false); set role service_role;`);
}

export async function sebagaiAnon(db) {
  await db.exec(`reset role; select set_config('request.jwt.claim.sub', '', false); set role anon;`);
}

let nomorSiswa = 0;

/** Membuat akun Auth + baris siswa (seperti buat-siswa.js), lalu kembali ke peran admin. */
export async function buatSiswa(db, { nama = 'Uji', aktif = true } = {}) {
  await sebagaiAdmin(db);
  nomorSiswa += 1;
  const authId = randomUUID();
  await db.query(`insert into auth.users (id, email) values ($1, $2)`, [
    authId,
    `${authId}@siswa.mathsave.invalid`,
  ]);
  const { rows } = await db.query(
    `insert into public.siswa (auth_user_id, kode_hash, nama_panggilan, kelas, aktif, pin_dibuat_pada)
     values ($1, $2, $3, 'VIII-C', $4, now()) returning id`,
    [authId, `hash-uji-${nomorSiswa}-${authId}`, nama, aktif],
  );
  return { authId, siswaId: rows[0].id };
}

/**
 * Memanggil RPC dengan notasi parameter bernama, seperti supabase.rpc().
 * Nilai objek dikirim sebagai jsonb.
 */
export async function rpc(db, nama, parameter = {}) {
  const kunci = Object.keys(parameter);
  const nilai = kunci.map((k) => {
    const v = parameter[k];
    return v !== null && typeof v === 'object' && !(v instanceof Date) ? JSON.stringify(v) : v;
  });
  const argumen = kunci
    .map((k, i) => {
      const v = parameter[k];
      const tipe = v !== null && typeof v === 'object' && !(v instanceof Date) ? '::jsonb' : '';
      return `${k} => $${i + 1}${tipe}`;
    })
    .join(', ');
  const { rows } = await db.query(`select public.${nama}(${argumen}) as hasil`, nilai);
  return rows[0].hasil;
}

/** Menjalankan RPC sebagai siswa tertentu. */
export async function rpcSebagai(db, siswa, nama, parameter = {}) {
  await sebagai(db, siswa.authId);
  try {
    return await rpc(db, nama, parameter);
  } finally {
    await sebagaiAdmin(db);
  }
}
