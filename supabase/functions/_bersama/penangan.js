/**
 * Pembungkus HTTP untuk Edge Function login. Hanya memakai Request/Response standar web,
 * sehingga bisa diuji di Node dan dijalankan di Deno.
 *
 * Badan permintaan (berisi PIN/kode) TIDAK PERNAH dicatat di log (KF-05 L6).
 */
import { adalahLayananSibuk } from './galatAuth.js';

export const HEADER_CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(status, isi) {
  return new Response(JSON.stringify(isi), {
    status,
    headers: { ...HEADER_CORS, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

/** Hanya karakter alamat IPv4/IPv6, maksimal 45 karakter. */
const POLA_IP = /^[0-9A-Fa-f:.]{2,45}$/;

/**
 * Alamat IP klien dari sumber TEPERCAYA saja, atau null.
 *
 * Hanya `cf-connecting-ip` yang dipakai: header ini diisi Cloudflare di depan Supabase,
 * dan nilai palsu dari klien ditolak/ditimpa di sana. `x-forwarded-for` dan `x-real-ip`
 * TIDAK dipercaya, karena nilai pertama `x-forwarded-for` bisa diisi sendiri oleh klien
 * sehingga batas per IP bisa dilewati (temuan T3).
 * Dokumentasi resmi Supabase belum menyebut header IP untuk Edge Function (diperiksa
 * 12 November 2026), jadi perilaku ini WAJIB diuji di proyek asli sebelum dipakai siswa.
 * null → batas login per IP tidak dipakai; pendaftaran memakai satu ember bersama.
 */
export function ambilIp(permintaan) {
  const nilai = permintaan.headers.get('cf-connecting-ip')?.trim();
  return nilai && POLA_IP.test(nilai) ? nilai : null;
}

/**
 * @param {(masukan: object, alat: object) => Promise<{status:number, isi:object}>} proses
 * @param {(permintaan: Request) => Promise<object>} buatAlat
 * @param {{ catatGalat?: (pesan: string) => void }} [opsi]
 */
export function buatPenangan(proses, buatAlat, { catatGalat = console.error } = {}) {
  return async function penangan(permintaan) {
    if (permintaan.method === 'OPTIONS') return new Response('ok', { headers: HEADER_CORS });
    if (permintaan.method !== 'POST') return json(405, { kode_galat: 'METODE_TIDAK_DIDUKUNG' });

    let masukan;
    try {
      masukan = await permintaan.json();
    } catch {
      return json(400, { kode_galat: 'ISIAN_KOSONG' });
    }
    if (masukan === null || typeof masukan !== 'object' || Array.isArray(masukan)) {
      return json(400, { kode_galat: 'ISIAN_KOSONG' });
    }

    try {
      const alat = await buatAlat(permintaan);
      const { status, isi } = await proses(masukan, alat);
      return json(status, isi);
    } catch (e) {
      // Hanya nama dan pesan galat, tanpa isi permintaan.
      catatGalat(`Galat server: ${e?.name ?? 'Error'}: ${e?.message ?? ''}`);
      // Supabase Auth membatasi laju (429): bukan kesalahan siswa, coba lagi sebentar lagi.
      if (adalahLayananSibuk(e)) return json(503, { kode_galat: 'LAYANAN_SIBUK' });
      return json(500, { kode_galat: 'GALAT_SERVER' });
    }
  };
}
