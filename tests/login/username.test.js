// Fase 5A Tahap 3 — modul murni username dan turunan HMAC baru.
import { describe, test, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { normalisasiUsername, usernameSah, POLA_USERNAME } from '../../supabase/functions/_bersama/username.js';
import { usernameTerlarang } from '../../supabase/functions/_bersama/usernameTerlarang.js';
import { turunan } from '../../supabase/functions/_bersama/kriptografi.js';

describe('username.js', () => {
  test('normalisasi: spasi tepi dibuang, huruf kecil; bukan teks → kosong', () => {
    expect(normalisasiUsername('  Rani_08 ')).toBe('rani_08');
    expect(normalisasiUsername(undefined)).toBe('');
    expect(normalisasiUsername(42)).toBe('');
  });

  test('format sah dan tidak sah', () => {
    for (const u of ['abc', 'rani_08', 'a'.repeat(20), 'x1_']) expect(usernameSah(u)).toBe(true);
    for (const u of ['ab', '1abc', '_abc', 'Rani', 'rani-08', 'rani budi', 'a'.repeat(21), 'réni', '']) {
      expect(usernameSah(u)).toBe(false);
    }
  });

  test('pola sama persis dengan CHECK di migrasi 0005 (satu aturan di aplikasi dan database)', () => {
    const sql = readFileSync(
      join(import.meta.dirname, '..', '..', 'supabase', 'migrations', '20261112000005_username_dan_kelas.sql'), 'utf8');
    expect(sql).toContain(`username ~ '${POLA_USERNAME.source}'`);
  });
});

describe('usernameTerlarang.js', () => {
  test('kata dan awalan terlarang', () => {
    for (const u of ['admin', 'guru', 'peneliti', 'lanora', 'mathsave', 'admin_lanora', 'lanora2', 'guru_mtk']) {
      expect(usernameTerlarang(u)).toBe(true);
    }
    for (const u of ['rani_08', 'gurita', 'budi', 'siswa_baik']) expect(usernameTerlarang(u)).toBe(false);
  });
});

describe('Turunan HMAC baru (KF-05f)', () => {
  test('kunci username dan kata sandi siswa: awalan terpisah dari turunan lama', async () => {
    const nilai = await Promise.all([
      turunan.kunciUsername('r', 'rani'), turunan.kodeHash('r', 'rani'),
      turunan.kataSandiSiswa('r', 'id-1', '012345'), turunan.kataSandi('r', 'id-1', '012345'),
    ]);
    expect(new Set(nilai).size).toBe(4);
  });

  test('kata sandi terikat siswa.id dan PIN (bukan username), 64 karakter (< 72 batas bcrypt)', async () => {
    const a = await turunan.kataSandiSiswa('r', 'id-1', '012345');
    expect(a).toHaveLength(64);
    expect(await turunan.kataSandiSiswa('r', 'id-2', '012345')).not.toBe(a);
    expect(await turunan.kataSandiSiswa('r', 'id-1', '012346')).not.toBe(a);
  });
});
