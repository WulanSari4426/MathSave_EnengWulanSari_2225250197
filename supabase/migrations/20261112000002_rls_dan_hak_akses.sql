-- MathSave — Fase 4: Row Level Security dan hak akses (architecture.md bagian 6 "Row Level Security").
-- Prinsip: anon tidak boleh apa-apa. Siswa (authenticated) hanya membaca data miliknya.
-- Semua penulisan oleh siswa lewat RPC SECURITY DEFINER (migrasi berikutnya).

-- Supabase memberi hak bawaan ke anon/authenticated untuk objek baru di schema public.
-- Cabut semuanya dulu, lalu beri hanya yang diperlukan.
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all functions in schema public from public, anon, authenticated;

alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke all on functions from public, anon, authenticated;

-- RLS aktif di SEMUA tabel. Tabel tanpa kebijakan = tertutup bagi selain service role.
alter table public.siswa             enable row level security;
alter table public.soal              enable row level security;
alter table public.sesi_kuis         enable row level security;
alter table public.kisi_kisi_kuis    enable row level security;
alter table public.sesi_kuis_soal    enable row level security;
alter table public.percobaan_jawaban enable row level security;
alter table public.kemajuan_materi   enable row level security;
alter table public.penjelasan_siswa  enable row level security;
alter table public.percobaan_masuk   enable row level security;
alter table public.status_masuk      enable row level security;
alter table public.reset_pin         enable row level security;

-- ID siswa milik pengguna yang sedang masuk (aktif saja). Dipakai kebijakan RLS.
create function public.id_siswa_saya() returns uuid
language sql stable security definer set search_path = public as $$
  select id from public.siswa where auth_user_id = auth.uid() and aktif
$$;
revoke all on function public.id_siswa_saya() from public, anon;
grant execute on function public.id_siswa_saya() to authenticated;

-- siswa: SELECT baris miliknya, tanpa hak mengubah.
grant select on public.siswa to authenticated;
create policy siswa_baca_milik_sendiri on public.siswa
  for select to authenticated using (auth_user_id = auth.uid() and aktif);

-- sesi_kuis: SELECT miliknya. Dibuat/diubah lewat RPC.
grant select on public.sesi_kuis to authenticated;
create policy sesi_kuis_baca_milik_sendiri on public.sesi_kuis
  for select to authenticated using (siswa_id = public.id_siswa_saya());

-- percobaan_jawaban: SELECT miliknya. Baris kuis yang sesinya BELUM dikumpulkan
-- disembunyikan, karena kolom `benar`/`jenis_kesalahan` akan membocorkan kunci
-- selama kuis berlangsung (PRD F-07 aturan 8, KF-21 K5).
grant select on public.percobaan_jawaban to authenticated;
create policy percobaan_jawaban_baca_milik_sendiri on public.percobaan_jawaban
  for select to authenticated using (
    siswa_id = public.id_siswa_saya()
    and (
      sesi_kuis_id is null
      or exists (select 1 from public.sesi_kuis s
                 where s.id = sesi_kuis_id and s.selesai_pada is not null)
    )
  );

-- kemajuan_materi: SELECT miliknya. Diubah lewat simpan_kemajuan.
grant select on public.kemajuan_materi to authenticated;
create policy kemajuan_materi_baca_milik_sendiri on public.kemajuan_materi
  for select to authenticated using (siswa_id = public.id_siswa_saya());

-- penjelasan_siswa: SELECT dan INSERT miliknya. INSERT langsung tetap dibatasi
-- milik sendiri; aturan "soal sudah dijawab benar" dijaga simpan_penjelasan.
grant select, insert on public.penjelasan_siswa to authenticated;
create policy penjelasan_baca_milik_sendiri on public.penjelasan_siswa
  for select to authenticated using (siswa_id = public.id_siswa_saya());
create policy penjelasan_tambah_milik_sendiri on public.penjelasan_siswa
  for insert to authenticated with check (siswa_id = public.id_siswa_saya());

-- soal, kisi_kisi_kuis, sesi_kuis_soal, percobaan_masuk, status_masuk, reset_pin:
-- tidak ada GRANT dan tidak ada kebijakan untuk authenticated/anon.
-- Kunci jawaban, pembahasan, dan pola kesalahan hanya keluar lewat RPC (AGENTS.md §7).
