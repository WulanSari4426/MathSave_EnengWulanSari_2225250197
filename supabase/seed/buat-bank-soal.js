/**
 * Menulis supabase/seed/soal.sql dari data bank soal (task.md Fase 7). Tidak menghubungi Supabase.
 *
 *   node supabase/seed/buat-bank-soal.js
 *
 * Setelah isi soal diperiksa dosen/guru, peneliti menjalankan soal.sql di Supabase SQL Editor,
 * lalu periksa-bank-soal.sql untuk memastikan setiap kombinasi kisi-kisi kuis mencukupi.
 * Skrip ini berhenti dengan galat jika ada kunci yang tidak rapi, petunjuk yang memuat jawaban,
 * atau pengecoh pilihan ganda yang kurang (supabase/seed/inti/bankSoal.js).
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { SEMUA_SOAL, SOAL_LATIHAN, SOAL_KUIS } from './data/bankSoal.js';
import { buatSql } from './inti/bankSoal.js';

const tujuan = join(import.meta.dirname, 'soal.sql');
writeFileSync(tujuan, buatSql(SEMUA_SOAL, { judul: `Bank soal Lanora: ${SOAL_LATIHAN.length} latihan + ${SOAL_KUIS.length} kuis` }));
console.log(`Ditulis: ${tujuan} (${SOAL_LATIHAN.length} soal latihan, ${SOAL_KUIS.length} soal kuis).`);
