// Edge Function atur-pin-baru (api.md bagian 2a, KF-05c).
// Logika ada di ../_bersama/alurLogin.js (diuji Vitest). File ini hanya pembungkus Deno.
import { buatPenangan } from '../_bersama/penangan.js';
import { prosesAturPinBaru } from '../_bersama/alurLogin.js';
import { buatAlatSupabase } from '../_bersama/alatSupabase.js';

Deno.serve(buatPenangan(prosesAturPinBaru, buatAlatSupabase));
