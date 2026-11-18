// Perbaikan keamanan login 12 November 2026: galat Supabase Auth (termasuk 429), pilihan kunci API
// Edge Function, sumber IP tepercaya, dan header kunci publik dari frontend.
import { describe, test, expect, vi } from 'vitest';
import {
  tafsirkanGalatMasuk, galatAdminAuth, GalatLayananSibuk, adalahLayananSibuk,
} from '../../supabase/functions/_bersama/galatAuth.js';
import { pilihKunciSupabase } from '../../supabase/functions/_bersama/kunciSupabase.js';
import { buatPenangan, ambilIp } from '../../supabase/functions/_bersama/penangan.js';
import { panggilFungsiLogin } from '../../src/layanan/autentikasi.js';
import { pesanLogin } from '../../src/logika/validasiLogin.js';

const minta = (header = {}) => new Request('http://lokal/fungsi', { method: 'POST', body: '{}', headers: header });

describe('tafsirkanGalatMasuk (Supabase Auth signInWithPassword)', () => {
  test('kredensial salah → dihitung sebagai gagal', () => {
    expect(tafsirkanGalatMasuk({ status: 400, code: 'invalid_credentials' })).toBe('kredensial_salah');
    expect(tafsirkanGalatMasuk({ status: 400 })).toBe('kredensial_salah'); // Auth lama tanpa `code`
  });

  test('429 atau kode batas laju → GalatLayananSibuk (bukan PIN salah)', () => {
    for (const galat of [
      { status: 429, code: 'over_request_rate_limit' },
      { status: 429 },
      { code: 'over_request_rate_limit' },
    ]) {
      expect(() => tafsirkanGalatMasuk(galat)).toThrow(GalatLayananSibuk);
    }
  });

  test('galat lain → Error biasa (menjadi 500), bukan dianggap PIN salah', () => {
    for (const galat of [
      { status: 400, code: 'validation_failed' },
      { status: 400, code: 'email_not_confirmed' },
      { status: 500 },
      {},
    ]) {
      let dilempar = null;
      try { tafsirkanGalatMasuk(galat); } catch (e) { dilempar = e; }
      expect(dilempar).toBeInstanceOf(Error);
      expect(adalahLayananSibuk(dilempar)).toBe(false);
    }
  });

  test('pesan galat tidak memuat isi pesan Auth (yang bisa memuat data pengguna)', () => {
    let pesan = '';
    try { tafsirkanGalatMasuk({ status: 500, message: 'rahasia-123@siswa' }); } catch (e) { pesan = e.message; }
    expect(pesan).not.toContain('rahasia-123');
  });

  test('galatAdminAuth: 429 → GalatLayananSibuk, lainnya Error biasa', () => {
    expect(adalahLayananSibuk(galatAdminAuth('Gagal membuat akun Auth', { status: 429 }))).toBe(true);
    const lain = galatAdminAuth('Gagal membuat akun Auth', { status: 422, code: 'email_exists' });
    expect(adalahLayananSibuk(lain)).toBe(false);
    expect(lain.message).toContain('email_exists');
  });
});

describe('pilihKunciSupabase (variabel bawaan Edge Function)', () => {
  const env = (isi) => (nama) => isi[nama] ?? null;

  test('kunci format baru ("default") dipakai lebih dulu', () => {
    expect(pilihKunciSupabase(env({
      SUPABASE_PUBLISHABLE_KEYS: JSON.stringify({ default: 'pub-baru' }),
      SUPABASE_SECRET_KEYS: JSON.stringify({ default: 'rahasia-baru' }),
      SUPABASE_ANON_KEY: 'pub-lama', SUPABASE_SERVICE_ROLE_KEY: 'rahasia-lama',
    }))).toEqual({ kunciPublik: 'pub-baru', kunciRahasia: 'rahasia-baru' });
  });

  test('JSON kosong, rusak, atau tanpa "default" → kunci lama', () => {
    expect(pilihKunciSupabase(env({
      SUPABASE_PUBLISHABLE_KEYS: '{}', SUPABASE_SECRET_KEYS: '{rusak',
      SUPABASE_ANON_KEY: 'pub-lama', SUPABASE_SERVICE_ROLE_KEY: 'rahasia-lama',
    }))).toEqual({ kunciPublik: 'pub-lama', kunciRahasia: 'rahasia-lama' });
  });

  test('tidak ada sama sekali → galat yang hanya menyebut NAMA variabel', () => {
    expect(() => pilihKunciSupabase(env({ SUPABASE_ANON_KEY: 'pub-lama' })))
      .toThrow(/SUPABASE_SECRET_KEYS\/SUPABASE_SERVICE_ROLE_KEY/);
    let pesan = '';
    try { pilihKunciSupabase(env({ SUPABASE_SECRET_KEYS: '{"default":"nilai-rahasia"}' })); } catch (e) { pesan = e.message; }
    expect(pesan).toMatch(/SUPABASE_PUBLISHABLE_KEYS/);
    expect(pesan).not.toContain('nilai-rahasia');
  });
});

describe('ambilIp: hanya sumber tepercaya (temuan T3)', () => {
  test('cf-connecting-ip dipakai (IPv4 dan IPv6)', () => {
    expect(ambilIp(minta({ 'cf-connecting-ip': '203.0.113.7' }))).toBe('203.0.113.7');
    expect(ambilIp(minta({ 'cf-connecting-ip': ' 2001:db8::1 ' }))).toBe('2001:db8::1');
  });

  test('x-forwarded-for dan x-real-ip yang bisa diisi klien TIDAK dipakai', () => {
    expect(ambilIp(minta({ 'x-forwarded-for': '1.2.3.4, 5.6.7.8' }))).toBeNull();
    expect(ambilIp(minta({ 'x-real-ip': '1.2.3.4' }))).toBeNull();
    // Nilai palsu di x-forwarded-for tidak mengubah IP yang dipakai.
    expect(ambilIp(minta({ 'x-forwarded-for': '9.9.9.9', 'cf-connecting-ip': '203.0.113.7' }))).toBe('203.0.113.7');
  });

  test('nilai bukan alamat IP atau terlalu panjang → null', () => {
    for (const nilai of ['', 'bukan ip', '1.2.3.4, 5.6.7.8', '<script>', 'a'.repeat(46)]) {
      expect(ambilIp(minta({ 'cf-connecting-ip': nilai }))).toBeNull();
    }
    expect(ambilIp(minta())).toBeNull();
  });
});

describe('penangan.js: Supabase Auth membatasi laju', () => {
  test('GalatLayananSibuk → 503 LAYANAN_SIBUK, log tanpa isi permintaan', async () => {
    const catatGalat = vi.fn();
    const proses = async () => { throw new GalatLayananSibuk('over_request_rate_limit'); };
    const r = await buatPenangan(proses, async () => ({}), { catatGalat })(
      new Request('http://lokal/fungsi', { method: 'POST', body: '{"username":"rani","pin":"908172"}' }),
    );
    expect(r.status).toBe(503);
    expect(await r.json()).toEqual({ kode_galat: 'LAYANAN_SIBUK' });
    expect(catatGalat.mock.calls.flat().join(' ')).not.toContain('908172');
  });

  test('frontend menampilkan pesan tenang untuk LAYANAN_SIBUK di semua layar login', () => {
    for (const layar of ['masuk', 'daftar', 'pinBaru']) {
      expect(pesanLogin(layar, { kode_galat: 'LAYANAN_SIBUK' })).toBe('Server sedang sibuk. Tunggu sebentar, lalu coba lagi.');
    }
  });
});

describe('Frontend: kunci publik dikirim di header apikey saja', () => {
  test('tanpa header Authorization (kunci sb_publishable_ bukan JWT)', async () => {
    const fetchFn = vi.fn(async () => new Response('{"kelas":[]}', { status: 200 }));
    await panggilFungsiLogin('daftar-pertama', { aksi: 'periksa_kode_kelas' },
      { fetchFn, url: 'https://contoh.invalid', kunci: 'sb_publishable_uji' });
    const { headers } = fetchFn.mock.calls[0][1];
    expect(headers.apikey).toBe('sb_publishable_uji');
    expect(Object.keys(headers).map((h) => h.toLowerCase())).not.toContain('authorization');
  });
});
