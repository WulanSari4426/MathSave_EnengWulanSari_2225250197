// Tutor AI — modul murni Edge Function (_bersama/tutorAI.js) dan layanan frontend.
import { describe, test, expect, vi } from 'vitest';
import {
  MODEL_TUTOR, modelGratis, ambilToken, validasiRiwayat, buatBadanOpenRouter,
  ambilTeksJawaban, tafsirkanRespons, prosesTutor, rincianGalat429, modelDiizinkan,
  DAFTAR_MODEL_TUTOR, BATAS_WAKTU_TOTAL_MS, BATAS_PER_PERCOBAAN_MS, SISA_MINIMAL_MS, PROMPT_TUTOR,
} from '../../supabase/functions/_bersama/tutorAI.js';

const GEMMA = 'google/gemma-4-26b-a4b-it:free';
const NEMOTRON = 'nvidia/nemotron-3-ultra-550b-a55b:free';
const LING = 'inclusionai/ling-3.2-flash:free';
import { pilihKunciPublik } from '../../supabase/functions/_bersama/kunciSupabase.js';
import { kirimPesanTutor, pesanGalatTutor } from '../../src/layanan/tutorAI.js';

const tanya = [{ role: 'user', content: 'Apa itu bunga tunggal?' }];
const jawabanOk = { choices: [{ message: { content: ' Bunga tunggal adalah ... ' }, finish_reason: 'stop' }] };

function alatUji({ siswa = 'ok', status = 200, hasil = jawabanOk, daftarModel } = {}) {
  return {
    verifikasiSiswa: vi.fn(async () => siswa),
    panggilOpenRouter: vi.fn(async () => ({ status, hasil })),
    daftarModel,
  };
}

describe('daftar model gratis', () => {
  test('tepat tiga model yang disetujui, berurutan, semuanya :free', () => {
    expect(DAFTAR_MODEL_TUTOR.map((m) => m.id)).toEqual([GEMMA, NEMOTRON, LING]);
    expect(MODEL_TUTOR).toBe(GEMMA);
    expect(DAFTAR_MODEL_TUTOR.every((m) => modelGratis(m.id) && m.id.endsWith(':free'))).toBe(true);
    expect(Object.isFrozen(DAFTAR_MODEL_TUTOR)).toBe(true);
  });
  test('model berbayar, slug aneh, atau :free di luar daftar ditolak', () => {
    expect(modelGratis('google/gemma-4-26b-a4b-it')).toBe(false);
    expect(modelGratis('openrouter/auto')).toBe(false);
    expect(modelGratis('a/b:free:x')).toBe(false);
    expect(modelDiizinkan('google/gemma-4-26b-a4b-it')).toBe(false);
    expect(modelDiizinkan('google/gemma-4-31b-it:free')).toBe(false);
    expect(modelDiizinkan('nvidia/nemotron-3-ultra-550b-a55b')).toBe(false);
    for (const id of [GEMMA, NEMOTRON, LING]) expect(modelDiizinkan(id)).toBe(true);
    expect(() => buatBadanOpenRouter(tanya, 'google/gemma-4-26b-a4b-it')).toThrow();
    expect(() => buatBadanOpenRouter(tanya, 'google/gemma-4-31b-it:free')).toThrow();
  });
  test('badan permintaan: satu model, tanpa `models`, tanpa fallback penyedia, prompt MathSave', () => {
    for (const id of [GEMMA, NEMOTRON, LING]) {
      const badan = buatBadanOpenRouter(tanya, id);
      expect(badan.model).toBe(id);
      expect(badan.models).toBeUndefined();
      expect(badan.provider).toEqual({ allow_fallbacks: false });
      expect(badan.messages[0]).toEqual({ role: 'system', content: PROMPT_TUTOR });
      expect(badan.messages.slice(1)).toEqual(tanya);
      expect(badan.max_tokens).toBe(1200);
    }
    expect(PROMPT_TUTOR).toContain('Tutor AI MathSave');
  });
  test('reasoning diatur per model agar tidak menghabiskan token jawaban', () => {
    expect(buatBadanOpenRouter(tanya, GEMMA).reasoning).toEqual({ enabled: false });
    expect(buatBadanOpenRouter(tanya, NEMOTRON).reasoning).toEqual({ effort: 'none' });
    expect(buatBadanOpenRouter(tanya, LING).reasoning).toEqual({ enabled: false });
  });
  test('satu model tidak sah di daftar → tidak ada permintaan sama sekali', async () => {
    for (const daftarModel of [
      [GEMMA, 'google/gemma-4-26b-a4b-it'],
      ['openai/gpt-5', LING],
      [GEMMA, 'google/gemma-4-31b-it:free'],
      [],
    ]) {
      const alat = alatUji({ daftarModel });
      const h = await prosesTutor({ token: 't', badan: { messages: tanya } }, alat);
      expect(h.status).toBe(500);
      expect(h.isi).toEqual({ kode_galat: 'KONFIGURASI_SERVER_BELUM_LENGKAP' });
      expect(alat.panggilOpenRouter).not.toHaveBeenCalled();
    }
  });
});

describe('token dan kunci', () => {
  test('ambilToken', () => {
    expect(ambilToken('Bearer abc.def')).toBe('abc.def');
    expect(ambilToken('bearer  xyz ')).toBe('xyz');
    expect(ambilToken('')).toBeNull();
    expect(ambilToken(null)).toBeNull();
    expect(ambilToken('Basic abc')).toBeNull();
  });
  test('kunci publik format baru didahulukan, kunci lama cadangan', () => {
    const env = { SUPABASE_PUBLISHABLE_KEYS: '{"default":"sb_publishable_x"}', SUPABASE_ANON_KEY: 'lama' };
    expect(pilihKunciPublik((n) => env[n] ?? null)).toBe('sb_publishable_x');
    expect(pilihKunciPublik((n) => ({ SUPABASE_ANON_KEY: 'lama' })[n] ?? null)).toBe('lama');
    expect(pilihKunciPublik(() => null)).toBeNull();
  });
});

describe('validasiRiwayat', () => {
  test('riwayat sah dirapikan', () => {
    expect(validasiRiwayat({ messages: [{ role: 'user', content: '  hai ' }] }))
      .toEqual({ ok: true, pesan: [{ role: 'user', content: 'hai' }] });
  });
  test.each([
    [null, 'RIWAYAT_TIDAK_VALID'],
    [{ messages: [] }, 'RIWAYAT_TIDAK_VALID'],
    [{ messages: Array(13).fill(tanya[0]) }, 'RIWAYAT_TIDAK_VALID'],
    [{ messages: [{ role: 'system', content: 'x' }] }, 'PESAN_TIDAK_VALID'],
    [{ messages: [{ role: 'user', content: '   ' }] }, 'PESAN_TIDAK_VALID'],
    [{ messages: [{ role: 'user', content: 'a'.repeat(2001) }] }, 'PESAN_TIDAK_VALID'],
    [{ messages: [...tanya, { role: 'assistant', content: 'ok' }] }, 'PESAN_TERAKHIR_HARUS_DARI_SISWA'],
  ])('%j → %s', (badan, kode) => {
    expect(validasiRiwayat(badan)).toEqual({ ok: false, kode_galat: kode });
  });
});

describe('tafsirkanRespons OpenRouter', () => {
  test('jawaban sah', () => {
    expect(tafsirkanRespons(200, jawabanOk)).toEqual({
      status: 200, isi: { answer: 'Bunga tunggal adalah ...', model: MODEL_TUTOR },
    });
  });
  test('isi berupa daftar bagian teks', () => {
    expect(ambilTeksJawaban({ choices: [{ message: { content: [{ type: 'text', text: 'A' }, 'B'] } }] })).toBe('AB');
  });
  test.each([
    [429, { error: { code: 429, message: 'rate limited' } }, 429, 'TUTOR_AI_SIBUK'],
    [404, { error: { code: 404, message: 'No endpoints found matching your data policy' } }, 502, 'MODEL_TIDAK_TERSEDIA'],
    [401, { error: { code: 401, message: 'No auth credentials found' } }, 500, 'KONFIGURASI_SERVER_BELUM_LENGKAP'],
    [402, { error: { code: 402 } }, 500, 'KONFIGURASI_SERVER_BELUM_LENGKAP'],
    [408, { error: { code: 408 } }, 504, 'TUTOR_AI_LAMBAT'],
    [500, null, 502, 'TUTOR_AI_SEDANG_TIDAK_TERSEDIA'],
    // OpenRouter bisa membalas 200 dengan objek error dari penyedia.
    [200, { error: { code: 429, message: 'upstream rate limit' } }, 429, 'TUTOR_AI_SIBUK'],
    [200, { choices: [{ message: { content: null }, finish_reason: 'length' }] }, 502, 'JAWABAN_AI_TIDAK_VALID'],
  ])('HTTP %i → %i %s', (http, hasil, status, kode) => {
    const h = tafsirkanRespons(http, hasil);
    expect(h.status).toBe(status);
    expect(h.isi).toEqual({ kode_galat: kode });
    expect(typeof h.log).toBe('string');
  });
});

describe('prosesTutor', () => {
  test('tanpa token → 401 TIDAK_MASUK, tidak memverifikasi', async () => {
    const alat = alatUji();
    expect(await prosesTutor({ token: null, badan: { messages: tanya } }, alat))
      .toEqual({ status: 401, isi: { kode_galat: 'TIDAK_MASUK' } });
    expect(alat.verifikasiSiswa).not.toHaveBeenCalled();
  });
  test('sesi tidak sah / bukan siswa', async () => {
    expect((await prosesTutor({ token: 't', badan: { messages: tanya } }, alatUji({ siswa: 'SESI_TIDAK_VALID' }))).status).toBe(401);
    expect((await prosesTutor({ token: 't', badan: { messages: tanya } }, alatUji({ siswa: 'AKSES_SISWA_DITOLAK' }))).isi)
      .toEqual({ kode_galat: 'AKSES_SISWA_DITOLAK' });
  });
  test('riwayat salah tidak sampai ke OpenRouter', async () => {
    const alat = alatUji();
    expect((await prosesTutor({ token: 't', badan: {} }, alat)).status).toBe(400);
    expect(alat.panggilOpenRouter).not.toHaveBeenCalled();
  });
  test('alur sukses', async () => {
    const alat = alatUji();
    const h = await prosesTutor({ token: 't', badan: { messages: tanya } }, alat);
    expect(h.status).toBe(200);
    expect(h.isi).toEqual({ answer: 'Bunga tunggal adalah ...', model: MODEL_TUTOR });
    expect(alat.verifikasiSiswa).toHaveBeenCalledWith('t');
    expect(alat.panggilOpenRouter).toHaveBeenCalledTimes(1);
    expect(alat.panggilOpenRouter.mock.calls[0][0].model).toBe(MODEL_TUTOR);
  });
});

describe('layanan frontend kirimPesanTutor', () => {
  const klienDengan = (hasil) => ({ functions: { invoke: vi.fn(async () => hasil) } });

  test('jawaban sah', async () => {
    const klien = klienDengan({ data: { answer: ' Halo ', model: MODEL_TUTOR }, error: null });
    expect(await kirimPesanTutor(tanya, { klien })).toEqual({ ok: true, data: { answer: 'Halo', model: MODEL_TUTOR } });
    expect(klien.functions.invoke).toHaveBeenCalledWith('tutor-ai', { body: { messages: tanya } });
  });
  test('kode galat server diteruskan, bukan diganti satu kode umum', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const error = { name: 'FunctionsHttpError', context: new Response(JSON.stringify({ kode_galat: 'TUTOR_AI_SIBUK' }), { status: 429 }) };
    expect(await kirimPesanTutor(tanya, { klien: klienDengan({ data: null, error }) }))
      .toEqual({ ok: false, kode_galat: 'TUTOR_AI_SIBUK' });
  });
  test('galat jaringan dan badan bukan JSON', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect((await kirimPesanTutor(tanya, { klien: klienDengan({ error: { name: 'FunctionsFetchError' } }) })).kode_galat)
      .toBe('GALAT_JARINGAN');
    const error = { name: 'FunctionsHttpError', context: new Response('Bad Gateway', { status: 502 }) };
    expect((await kirimPesanTutor(tanya, { klien: klienDengan({ error }) })).kode_galat)
      .toBe('TUTOR_AI_SEDANG_TIDAK_TERSEDIA');
  });
  test('pesan untuk siswa', () => {
    expect(pesanGalatTutor('SESI_TIDAK_VALID')).toMatch(/masuk lagi/);
    expect(pesanGalatTutor('KODE_ASING')).toMatch(/belum bisa menjawab/);
  });
});

// ---------------------------------------------------------------------------
// Galat 429: rincian log dan coba ulang otomatis
// ---------------------------------------------------------------------------

/** Bentuk 429 asli dari log Supabase 18 November 2026 (user_id dan raw berisi data yang TIDAK boleh masuk log). */
const galat429 = (metadataTambahan = {}) => ({
  error: {
    message: 'Provider returned error',
    code: 429,
    metadata: {
      raw: 'google/gemma-4-26b-a4b-it:free is temporarily rate-limited upstream. Please retry shortly',
      provider_name: 'Google AI Studio',
      is_byok: false,
      provider_error_code: '429',
      limit_source: 'upstream_provider_shared_pool',
      ...metadataTambahan,
    },
  },
  user_id: 'user_RAHASIA_JANGAN_DICATAT',
});


/**
 * Jam palsu dan OpenRouter palsu PER MODEL.
 * `respons[model]` = antrean respons; `durasi[model]` = lama satu panggilan (ms).
 * Seperti AbortSignal.timeout(batasMs) di index.js: panggilan yang melewati batasnya diputus (408).
 */
function alatCadangan(respons, { durasi = {}, daftarModel } = {}) {
  let jam = 0;
  const antrean = Object.fromEntries(Object.entries(respons).map(([m, r]) => [m, [...r]]));
  const alat = {
    verifikasiSiswa: vi.fn(async () => 'ok'),
    panggilOpenRouter: vi.fn(async (badan, batasMs) => {
      const lama = durasi[badan.model] ?? 0;
      if (lama > batasMs) {
        jam += batasMs;
        return { status: 408, hasil: { error: { code: 408, message: 'TimeoutError' } } };
      }
      jam += lama;
      const r = antrean[badan.model]?.shift();
      if (!r) throw new Error(`Respons uji untuk ${badan.model} habis`);
      return r;
    }),
    sekarang: () => jam,
    tunggu: vi.fn(async (ms) => { jam += ms; }),
    catat: vi.fn(),
    daftarModel,
  };
  const modelDipanggil = () => alat.panggilOpenRouter.mock.calls.map((c) => c[0].model);
  const semuaLog = () => alat.catat.mock.calls.map((c) => c[0]).join('\n');
  return { alat, jam: () => jam, modelDipanggil, semuaLog };
}
const masukan = { token: 't', badan: { messages: tanya } };
const ok200 = { status: 200, hasil: jawabanOk };
const sibuk = (meta) => ({ status: 429, hasil: galat429(meta) });
const habis404 = { status: 404, hasil: { error: { code: 404, message: 'No endpoints found' } } };

describe('rincian log 429', () => {
  test('mengambil limit_source, provider_name, provider_error_code, retry_after_seconds', () => {
    expect(rincianGalat429(galat429({ retry_after_seconds: 1 }))).toEqual({
      limit_source: 'upstream_provider_shared_pool',
      provider_name: 'Google AI Studio',
      provider_error_code: '429',
      retry_after_seconds: 1,
    });
  });
  test('retry_after dari header Retry-After jika retry_after_seconds tidak ada', () => {
    expect(rincianGalat429(galat429({ headers: { 'Retry-After': '3' } })).retry_after_seconds).toBe(3);
    expect(rincianGalat429(galat429()).retry_after_seconds).toBeNull();
    expect(rincianGalat429(galat429({ retry_after_seconds: -1 })).retry_after_seconds).toBeNull();
  });
  test('metadata kosong atau aneh tidak membuat galat', () => {
    expect(rincianGalat429({ error: { code: 429 } })).toEqual({
      limit_source: null, provider_name: null, provider_error_code: null, retry_after_seconds: null,
    });
    expect(rincianGalat429(null).limit_source).toBeNull();
    expect(rincianGalat429(galat429({ provider_name: { obj: 1 } })).provider_name).toBeNull();
  });
  test('log 429 memuat empat bidang dan TIDAK memuat raw, user_id, atau isi pesan siswa', () => {
    const { log } = tafsirkanRespons(429, galat429({ retry_after_seconds: 1 }));
    expect(log).toContain('limit_source=upstream_provider_shared_pool');
    expect(log).toContain('provider_name=Google AI Studio');
    expect(log).toContain('provider_error_code=429');
    expect(log).toContain('retry_after_seconds=1');
    expect(log).not.toMatch(/RAHASIA|user_|temporarily|bunga tunggal/i);
  });
  test('bidang yang tidak ada ditulis "-"', () => {
    expect(tafsirkanRespons(429, { error: { code: 429 } }).log)
      .toContain('limit_source=- provider_name=- provider_error_code=- retry_after_seconds=-');
  });
});

describe('cadangan berurutan antarmodel gratis', () => {
  test('model utama berhasil → hanya Gemma dipanggil, model yang menjawab dicatat', async () => {
    const { alat, modelDipanggil } = alatCadangan({ [GEMMA]: [ok200] });
    const h = await prosesTutor(masukan, alat);
    expect(h.status).toBe(200);
    expect(h.isi.model).toBe(GEMMA);
    expect(h.info).toBe(`model=${GEMMA} percobaan=1 putaran=1 berhasil`);
    expect(modelDipanggil()).toEqual([GEMMA]);
  });
  test('Gemma 429 → Nemotron langsung dicoba tanpa menunggu', async () => {
    const { alat, modelDipanggil, semuaLog } = alatCadangan({
      [GEMMA]: [sibuk({ retry_after_seconds: 1 })], [NEMOTRON]: [ok200],
    });
    const h = await prosesTutor(masukan, alat);
    expect(h.status).toBe(200);
    expect(h.isi.model).toBe(NEMOTRON);
    expect(h.info).toBe(`model=${NEMOTRON} percobaan=2 putaran=1 berhasil`);
    expect(modelDipanggil()).toEqual([GEMMA, NEMOTRON]);
    expect(alat.tunggu).not.toHaveBeenCalled();
    expect(semuaLog()).toContain(`model=${GEMMA} percobaan=1 putaran=1 gagal=TUTOR_AI_SIBUK`);
    expect(semuaLog()).toContain('limit_source=upstream_provider_shared_pool');
  });
  test('urutan Gemma → Nemotron → Ling', async () => {
    const { alat, modelDipanggil } = alatCadangan({ [GEMMA]: [sibuk()], [NEMOTRON]: [sibuk()], [LING]: [ok200] });
    const h = await prosesTutor(masukan, alat);
    expect(h.isi.model).toBe(LING);
    expect(modelDipanggil()).toEqual([GEMMA, NEMOTRON, LING]);
    expect(alat.tunggu).not.toHaveBeenCalled();
  });
  test('setiap model dikirim dengan pengaturan reasoning-nya sendiri', async () => {
    const { alat } = alatCadangan({ [GEMMA]: [sibuk()], [NEMOTRON]: [sibuk()], [LING]: [ok200] });
    await prosesTutor(masukan, alat);
    const badan = alat.panggilOpenRouter.mock.calls.map((c) => c[0]);
    expect(badan.map((b) => b.reasoning)).toEqual([{ enabled: false }, { effort: 'none' }, { enabled: false }]);
    expect(badan.every((b) => b.models === undefined && b.provider.allow_fallbacks === false)).toBe(true);
  });
  test('galat selain 429 (404, jawaban kosong) juga pindah ke model berikutnya', async () => {
    const kosong = { status: 200, hasil: { choices: [{ message: { content: '' }, finish_reason: 'length' }] } };
    const { alat, modelDipanggil, semuaLog } = alatCadangan({ [GEMMA]: [habis404], [NEMOTRON]: [kosong], [LING]: [ok200] });
    const h = await prosesTutor(masukan, alat);
    expect(h.isi.model).toBe(LING);
    expect(modelDipanggil()).toEqual([GEMMA, NEMOTRON, LING]);
    expect(semuaLog()).toMatch(/gagal=MODEL_TIDAK_TERSEDIA/);
    expect(semuaLog()).toMatch(/gagal=JAWABAN_AI_TIDAK_VALID.*finish_reason: length/);
  });
  test('galat kunci/akun (401/402) → berhenti, cadangan tidak dicoba', async () => {
    for (const kode of [401, 402]) {
      const { alat, modelDipanggil } = alatCadangan({ [GEMMA]: [{ status: kode, hasil: { error: { code: kode } } }] });
      const h = await prosesTutor(masukan, alat);
      expect(h.isi).toEqual({ kode_galat: 'KONFIGURASI_SERVER_BELUM_LENGKAP' });
      expect(h.log).toMatch(/cadangan tidak dicoba/);
      expect(modelDipanggil()).toEqual([GEMMA]);
    }
  });
  test('semua 429 → satu putaran ulang pendek (mengikuti retry_after terkecil)', async () => {
    const { alat, modelDipanggil, semuaLog } = alatCadangan({
      [GEMMA]: [sibuk({ retry_after_seconds: 2 }), sibuk()],
      [NEMOTRON]: [sibuk({ retry_after_seconds: 1 }), ok200],
      [LING]: [sibuk()],
    });
    const h = await prosesTutor(masukan, alat);
    expect(h.isi.model).toBe(NEMOTRON);
    expect(h.info).toBe(`model=${NEMOTRON} percobaan=5 putaran=2 berhasil`);
    expect(modelDipanggil()).toEqual([GEMMA, NEMOTRON, LING, GEMMA, NEMOTRON]);
    expect(alat.tunggu.mock.calls).toEqual([[1000]]);
    expect(semuaLog()).toMatch(/putaran 2 dalam 1000 ms/);
  });
  test('putaran ulang hanya untuk model yang terkena 429', async () => {
    const { alat, modelDipanggil } = alatCadangan({
      [GEMMA]: [sibuk(), ok200], [NEMOTRON]: [habis404], [LING]: [sibuk()],
    });
    const h = await prosesTutor(masukan, alat);
    expect(h.isi.model).toBe(GEMMA);
    expect(modelDipanggil()).toEqual([GEMMA, NEMOTRON, LING, GEMMA]);
  });
  test('semua 429 dua putaran → TUTOR_AI_SIBUK, maksimal 6 percobaan', async () => {
    const { alat, modelDipanggil } = alatCadangan({
      [GEMMA]: [sibuk(), sibuk()], [NEMOTRON]: [sibuk(), sibuk()], [LING]: [sibuk(), sibuk()],
    });
    const h = await prosesTutor(masukan, alat);
    expect(h.status).toBe(429);
    expect(h.isi).toEqual({ kode_galat: 'TUTOR_AI_SIBUK' });
    expect(modelDipanggil()).toHaveLength(6);
    expect(h.log).toMatch(/Semua model gagal \(6 percobaan\)/);
    expect(h.log).toContain(`${LING}=TUTOR_AI_SIBUK`);
  });
  test('retry_after panjang → tidak menunggu, putaran ulang dilewati', async () => {
    const { alat, modelDipanggil, semuaLog } = alatCadangan({
      [GEMMA]: [sibuk({ retry_after_seconds: 30 })],
      [NEMOTRON]: [sibuk({ retry_after_seconds: 30 })],
      [LING]: [sibuk({ retry_after_seconds: 30 })],
    });
    const h = await prosesTutor(masukan, alat);
    expect(h.isi).toEqual({ kode_galat: 'TUTOR_AI_SIBUK' });
    expect(modelDipanggil()).toHaveLength(3);
    expect(alat.tunggu).not.toHaveBeenCalled();
    expect(semuaLog()).toMatch(/putaran 2 dilewati: retry_after 30000 ms/);
  });
  test('campuran 429 dan 404 tanpa sukses → TUTOR_AI_SIBUK diutamakan', async () => {
    const { alat } = alatCadangan({
      [GEMMA]: [sibuk({ retry_after_seconds: 30 })], [NEMOTRON]: [habis404], [LING]: [habis404],
    });
    expect((await prosesTutor(masukan, alat)).isi).toEqual({ kode_galat: 'TUTOR_AI_SIBUK' });
  });
  test('semua 404 → MODEL_TIDAK_TERSEDIA, tanpa putaran ulang', async () => {
    const { alat, modelDipanggil } = alatCadangan({ [GEMMA]: [habis404], [NEMOTRON]: [habis404], [LING]: [habis404] });
    const h = await prosesTutor(masukan, alat);
    expect(h.isi).toEqual({ kode_galat: 'MODEL_TIDAK_TERSEDIA' });
    expect(modelDipanggil()).toHaveLength(3);
    expect(alat.tunggu).not.toHaveBeenCalled();
  });
  test('log tidak memuat isi pesan siswa, raw, atau user_id', async () => {
    const pesanPribadi = { token: 't', badan: { messages: [{ role: 'user', content: 'Nama saya Budi, rumah di Jl. Mawar' }] } };
    const { alat, semuaLog } = alatCadangan({
      [GEMMA]: [sibuk(), sibuk()], [NEMOTRON]: [habis404], [LING]: [sibuk(), sibuk()],
    });
    const h = await prosesTutor(pesanPribadi, alat);
    const log = `${semuaLog()}\n${h.log}`;
    expect(log).toContain('gagal=TUTOR_AI_SIBUK');
    expect(log).not.toMatch(/Budi|Mawar|RAHASIA|user_|temporarily/);
  });
});

describe('batas waktu total 45 detik', () => {
  test('setiap percobaan dibatasi 18 detik', async () => {
    const { alat } = alatCadangan({ [GEMMA]: [sibuk()], [NEMOTRON]: [sibuk()], [LING]: [ok200] },
      { durasi: { [GEMMA]: 4_000, [NEMOTRON]: 4_000 } });
    await prosesTutor(masukan, alat);
    expect(BATAS_PER_PERCOBAAN_MS).toBe(18_000);
    expect(alat.panggilOpenRouter.mock.calls.map((c) => c[1])).toEqual([18_000, 18_000, 18_000]);
  });
  test('model lambat diputus di 18 detik, cadangan tetap sempat menjawab', async () => {
    const { alat, jam } = alatCadangan({ [GEMMA]: [], [NEMOTRON]: [ok200] },
      { durasi: { [GEMMA]: 60_000, [NEMOTRON]: 5_000 } });
    const h = await prosesTutor(masukan, alat);
    expect(h.isi.model).toBe(NEMOTRON);
    expect(jam()).toBe(23_000);
  });
  test('ketiga model lambat → percobaan ketiga hanya diberi sisa waktu, total tepat 45 detik', async () => {
    const { alat, jam } = alatCadangan({ [GEMMA]: [], [NEMOTRON]: [], [LING]: [] },
      { durasi: { [GEMMA]: 60_000, [NEMOTRON]: 60_000, [LING]: 60_000 } });
    const h = await prosesTutor(masukan, alat);
    expect(alat.panggilOpenRouter.mock.calls.map((c) => c[1])).toEqual([18_000, 18_000, 9_000]);
    expect(h.isi).toEqual({ kode_galat: 'TUTOR_AI_LAMBAT' });
    expect(jam()).toBe(BATAS_WAKTU_TOTAL_MS);
  });
  test('putaran ulang dipotong batas waktu: model berikutnya dilewati jika sisa < 5 detik', async () => {
    // 3 × 13 = 39 detik; jeda 1 → sisa 5 → putaran 2 mulai. Gemma hanya diberi 5 detik dan diputus
    // tepat di 45 detik; Nemotron dilewati karena waktu habis.
    const { alat, jam, modelDipanggil, semuaLog } = alatCadangan(
      { [GEMMA]: [sibuk()], [NEMOTRON]: [sibuk()], [LING]: [sibuk()] },
      { durasi: { [GEMMA]: 13_000, [NEMOTRON]: 13_000, [LING]: 13_000 } },
    );
    const h = await prosesTutor(masukan, alat);
    expect(modelDipanggil()).toEqual([GEMMA, NEMOTRON, LING, GEMMA]);
    expect(alat.panggilOpenRouter.mock.calls[3][1]).toBe(SISA_MINIMAL_MS);
    expect(semuaLog()).toContain(`model=${NEMOTRON} putaran=2 dilewati`);
    expect(h.isi).toEqual({ kode_galat: 'TUTOR_AI_SIBUK' });
    expect(jam()).toBe(BATAS_WAKTU_TOTAL_MS);
  });
  test('putaran ulang dilewati jika jeda membuat sisa waktu < 5 detik', async () => {
    const { alat, jam, semuaLog } = alatCadangan(
      { [GEMMA]: [sibuk()], [NEMOTRON]: [sibuk()], [LING]: [sibuk()] },
      { durasi: { [GEMMA]: 13_500, [NEMOTRON]: 13_500, [LING]: 13_500 } },
    );
    const h = await prosesTutor(masukan, alat);
    expect(h.isi).toEqual({ kode_galat: 'TUTOR_AI_SIBUK' });
    expect(alat.tunggu).not.toHaveBeenCalled();
    expect(semuaLog()).toMatch(/putaran 2 dilewati: waktu tidak cukup/);
    expect(jam()).toBeLessThanOrEqual(BATAS_WAKTU_TOTAL_MS);
  });
});
