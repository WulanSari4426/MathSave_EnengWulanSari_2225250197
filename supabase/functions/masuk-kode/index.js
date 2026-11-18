// Edge Function masuk-kode (api.md bagian 2, KF-05, KF-05b).
// Logika ada di ../_bersama/alurLogin.js (diuji Vitest). File ini hanya pembungkus Deno.
import { buatPenangan } from '../_bersama/penangan.js';
import { prosesMasuk } from '../_bersama/alurLogin.js';
import { buatAlatSupabase } from '../_bersama/alatSupabase.js';

Deno.serve(buatPenangan(prosesMasuk, buatAlatSupabase));
