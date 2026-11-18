-- Lanora — Fase 9 / Peneliti: View Rekapitulasi Nilai Kuis (PRD PP-10, F-07).
--
-- Tujuan:
--   Menyediakan rekap nilai kuis siswa yang mudah dibaca dan diekspor ke CSV
--   melalui dasbor Supabase (Table Editor / SQL Editor) oleh peneliti.
--
-- Prinsip Keamanan & Privasi:
--   1. Hak akses view HANYA untuk service_role (dan postgres sebagai pemilik view).
--      Hak akses public, anon, dan authenticated (siswa/guru) DICABUT TOTAL.
--   2. View TIDAK memuat rahasia: auth_user_id, kata sandi, PIN, token, atau hash.
--   3. Identitas yang ditampilkan sesuai kebutuhan analisis penelitian (RS-05, PT-11):
--      siswa_id (UUID), username (nama tampilan), dan kelas.
--   4. Guru tidak diberikan akses ke view ini atau ke dasbor Supabase (PT-17).
--   5. Tidak mengubah tabel, aturan kuis, atau migrasi sebelumnya.

-- ===========================================================================
-- 1. View Rekap Per Siswa (Matriks Perbandingan P1 vs P2 + Nilai Tertinggi)
-- ===========================================================================
-- Format 1 baris per siswa: memuat skor percobaan 1, percobaan 2, nilai tertinggi,
-- jumlah benar/salah/kosong, waktu, durasi, dan cara selesai berdampingan.
create or replace view public.v_rekap_kuis as
select
  sw.id as siswa_id,
  sw.username,
  coalesce(k.nama, sw.kelas) as kelas,
  k.jenjang as kelas_jenjang,
  sw.aktif as siswa_aktif,
  case
    when s2.selesai_pada is not null then 'selesai_2_percobaan'
    when s1.selesai_pada is not null and s2.id is null then 'selesai_1_percobaan'
    when (s1.id is not null and s1.selesai_pada is null) or (s2.id is not null and s2.selesai_pada is null) then 'sedang_berjalan'
    else 'belum_mulai'
  end as status_kuis,
  (case when s1.id is not null then 1 else 0 end + case when s2.id is not null then 1 else 0 end) as jumlah_percobaan,
  case
    when s1.selesai_pada is not null and s2.selesai_pada is not null then greatest(s1.skor, s2.skor)
    when s1.selesai_pada is not null then s1.skor
    when s2.selesai_pada is not null then s2.skor
    else null
  end as nilai_tertinggi,

  -- Percobaan 1
  s1.id as p1_sesi_id,
  s1.skor as p1_skor,
  s1.jumlah_benar as p1_jumlah_benar,
  case when s1.selesai_pada is not null then (20 - s1.jumlah_benar)::smallint end as p1_jumlah_salah,
  case when s1.selesai_pada is not null then
    (20 - coalesce((
      select count(distinct pj.soal_id)
      from public.percobaan_jawaban pj
      where pj.sesi_kuis_id = s1.id
        and pj.dibuat_pada < s1.batas_waktu
    ), 0))::smallint
  end as p1_jumlah_tidak_dijawab,
  s1.mulai_pada as p1_mulai_pada,
  s1.selesai_pada as p1_selesai_pada,
  case when s1.selesai_pada is not null
    then round(extract(epoch from (s1.selesai_pada - s1.mulai_pada)))::integer
  end as p1_durasi_detik,
  s1.cara_selesai as p1_cara_selesai,

  -- Percobaan 2
  s2.id as p2_sesi_id,
  s2.skor as p2_skor,
  s2.jumlah_benar as p2_jumlah_benar,
  case when s2.selesai_pada is not null then (20 - s2.jumlah_benar)::smallint end as p2_jumlah_salah,
  case when s2.selesai_pada is not null then
    (20 - coalesce((
      select count(distinct pj.soal_id)
      from public.percobaan_jawaban pj
      where pj.sesi_kuis_id = s2.id
        and pj.dibuat_pada < s2.batas_waktu
    ), 0))::smallint
  end as p2_jumlah_tidak_dijawab,
  s2.mulai_pada as p2_mulai_pada,
  s2.selesai_pada as p2_selesai_pada,
  case when s2.selesai_pada is not null
    then round(extract(epoch from (s2.selesai_pada - s2.mulai_pada)))::integer
  end as p2_durasi_detik,
  s2.cara_selesai as p2_cara_selesai

from public.siswa sw
left join public.kelas k on k.id = sw.kelas_id
left join public.sesi_kuis s1 on s1.siswa_id = sw.id and s1.percobaan_ke = 1
left join public.sesi_kuis s2 on s2.siswa_id = sw.id and s2.percobaan_ke = 2;

-- ===========================================================================
-- 2. View Rekap Per Sesi (Granular per Percobaan Kuis)
-- ===========================================================================
-- Format 1 baris per sesi kuis: untuk analisis statistik atau regresi per sesi.
create or replace view public.v_rekap_sesi_kuis as
select
  s.id as sesi_kuis_id,
  sw.id as siswa_id,
  sw.username,
  coalesce(k.nama, sw.kelas) as kelas,
  k.jenjang as kelas_jenjang,
  s.percobaan_ke,
  s.skor,
  (
    select max(s_all.skor)
    from public.sesi_kuis s_all
    where s_all.siswa_id = sw.id
      and s_all.selesai_pada is not null
  ) as nilai_tertinggi_siswa,
  s.jumlah_benar,
  case
    when s.selesai_pada is not null then (20 - s.jumlah_benar)::smallint
    else null
  end as jumlah_salah,
  case
    when s.selesai_pada is not null then
      (20 - coalesce((
        select count(distinct pj.soal_id)
        from public.percobaan_jawaban pj
        where pj.sesi_kuis_id = s.id
          and pj.dibuat_pada < s.batas_waktu
      ), 0))::smallint
    else null
  end as jumlah_tidak_dijawab,
  s.mulai_pada,
  s.selesai_pada,
  case
    when s.selesai_pada is not null
      then round(extract(epoch from (s.selesai_pada - s.mulai_pada)))::integer
    else null
  end as durasi_detik,
  s.cara_selesai,
  case
    when s.selesai_pada is not null then 'selesai'
    when s.batas_waktu <= now() then 'kedaluwarsa_belum_ditutup'
    else 'berlangsung'
  end as status_sesi,
  s.hasil_dilihat,
  sw.aktif as siswa_aktif
from public.sesi_kuis s
join public.siswa sw on sw.id = s.siswa_id
left join public.kelas k on k.id = sw.kelas_id;

-- ===========================================================================
-- 3. Hak Akses dan Keamanan
-- ===========================================================================
-- Cabut seluruh hak dari public, anon, dan authenticated (siswa & guru di app).
revoke all on public.v_rekap_kuis from public, anon, authenticated;
revoke all on public.v_rekap_sesi_kuis from public, anon, authenticated;

-- Beri hak baca hanya ke service_role (untuk skrip pengelola peneliti / Table Editor Supabase).
grant select on public.v_rekap_kuis to service_role;
grant select on public.v_rekap_sesi_kuis to service_role;
