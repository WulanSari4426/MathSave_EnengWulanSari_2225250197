// Edge Function daftar-pertama (api.md bagian 2b, KF-05d).
// Logika ada di ../_bersama/alurLogin.js (diuji Vitest). File ini hanya pembungkus Deno.
import { buatPenangan } from '../_bersama/penangan.js';
import { prosesDaftarPertama } from '../_bersama/alurLogin.js';
import { buatAlatSupabase } from '../_bersama/alatSupabase.js';

Deno.serve(buatPenangan(prosesDaftarPertama, buatAlatSupabase));
