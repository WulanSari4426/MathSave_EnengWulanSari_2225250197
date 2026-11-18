/**
 * Klien Supabase untuk frontend. Hanya memakai nilai PUBLIK (URL dan kunci anon/publishable),
 * yang dilindungi RLS. Kunci service role dan RAHASIA_KODE tidak pernah ada di sini (AGENTS.md §7).
 */
import { createClient } from '@supabase/supabase-js';

export const URL_SUPABASE = import.meta.env.VITE_SUPABASE_URL ?? '';
export const KUNCI_PUBLIK = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

/** false jika .env belum diisi (misalnya sebelum proyek Supabase dibuat). */
export const supabaseSiap = Boolean(URL_SUPABASE && KUNCI_PUBLIK);

export const supabase = supabaseSiap ? createClient(URL_SUPABASE, KUNCI_PUBLIK) : null;
