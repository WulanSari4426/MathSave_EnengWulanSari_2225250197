// Edge Function tutor-ai. Logika ada di ../_bersama/tutorAI.js (diuji Vitest). File ini hanya pembungkus Deno.
// Isi pesan siswa dan kunci API TIDAK PERNAH dicatat di log.
import { createClient } from 'npm:@supabase/supabase-js@2.118.0';
import { HEADER_CORS } from '../_bersama/penangan.js';
import { pilihKunciPublik } from '../_bersama/kunciSupabase.js';
import { prosesTutor, ambilToken, URL_OPENROUTER } from '../_bersama/tutorAI.js';

const bacaEnv = (nama) => Deno.env.get(nama) ?? null;

function json(status, isi) {
  return new Response(JSON.stringify(isi), {
    status,
    headers: { ...HEADER_CORS, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

/** Sesi Auth sah DAN pemilik sesi adalah siswa aktif (RPC ambil_profil, identitas dari auth.uid()). */
function buatVerifikasiSiswa(url, kunciPublik) {
  return async (token) => {
    const klien = createClient(url, kunciPublik, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const { data, error } = await klien.auth.getUser(token);
    if (error || !data?.user) {
      console.error('TUTOR_AI_AUTH:', error?.status ?? '-', error?.message ?? 'pengguna kosong');
      return 'SESI_TIDAK_VALID';
    }
    const { data: profil, error: galatProfil } = await klien.rpc('ambil_profil');
    if (galatProfil || !profil) {
      console.error('TUTOR_AI_PROFIL:', galatProfil?.message ?? 'profil kosong');
      return 'AKSES_SISWA_DITOLAK';
    }
    return 'ok';
  };
}

/** batasMs = batas percobaan ini: min(sisa dari 45 detik total, 18 detik), dihitung di _bersama/tutorAI.js. */
function buatPanggilOpenRouter(kunciOpenRouter) {
  return async (badan, batasMs) => {
    let respons;
    try {
      respons = await fetch(URL_OPENROUTER, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${kunciOpenRouter}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://lanora23.netlify.app',
          'X-Title': 'Lanora',
        },
        body: JSON.stringify(badan),
        signal: AbortSignal.timeout(Math.max(1, batasMs)),
      });
    } catch (e) {
      // Batas waktu atau jaringan putus → dipetakan ke 408 (TUTOR_AI_LAMBAT) / 503.
      const waktuHabis = e?.name === 'TimeoutError' || e?.name === 'AbortError';
      return { status: waktuHabis ? 408 : 503, hasil: { error: { code: waktuHabis ? 408 : 503, message: e?.name } } };
    }
    let hasil = null;
    try {
      hasil = await respons.json();
    } catch {
      hasil = null;
    }
    return { status: respons.status, hasil };
  };
}

Deno.serve(async (permintaan) => {
  if (permintaan.method === 'OPTIONS') return new Response('ok', { headers: HEADER_CORS });
  if (permintaan.method !== 'POST') return json(405, { kode_galat: 'METODE_TIDAK_DIDUKUNG' });

  try {
    const url = bacaEnv('SUPABASE_URL');
    const kunciPublik = pilihKunciPublik(bacaEnv);
    const kunciOpenRouter = bacaEnv('OPENROUTER_API_KEY');
    if (!url || !kunciPublik || !kunciOpenRouter) {
      // Hanya NAMA variabel yang kosong, bukan nilainya.
      const kosong = [!url && 'SUPABASE_URL', !kunciPublik && 'SUPABASE_PUBLISHABLE_KEYS/ANON_KEY',
        !kunciOpenRouter && 'OPENROUTER_API_KEY'].filter(Boolean).join(', ');
      console.error('TUTOR_AI_KONFIGURASI: variabel kosong:', kosong);
      return json(500, { kode_galat: 'KONFIGURASI_SERVER_BELUM_LENGKAP' });
    }

    let badan = null;
    try {
      badan = await permintaan.json();
    } catch {
      badan = null;
    }

    const hasil = await prosesTutor(
      { token: ambilToken(permintaan.headers.get('Authorization')), badan },
      {
        verifikasiSiswa: buatVerifikasiSiswa(url, kunciPublik),
        panggilOpenRouter: buatPanggilOpenRouter(kunciOpenRouter),
        // Kegagalan per model: hanya ID model, nomor percobaan, kode galat, rincian 429.
        catat: (pesan) => console.error('TUTOR_AI_MODEL:', pesan),
      },
    );
    if (hasil.info) console.log('TUTOR_AI_BERHASIL:', hasil.info);
    if (hasil.log) console.error('TUTOR_AI:', hasil.isi.kode_galat ?? '-', hasil.log);
    return json(hasil.status, hasil.isi);
  } catch (e) {
    console.error('TUTOR_AI_GALAT:', e?.name ?? 'Error', e?.message ?? '');
    return json(500, { kode_galat: 'GALAT_SERVER' });
  }
});
