-- Lanora — penguncian login bertingkat per username dan batas gagal login per IP.
-- Diputuskan pengembang 12 November 2026 (KF-05b diperbarui; PRD "Batas percobaan login").
--
-- Prinsip migrasi ini:
--   - Migrasi 0001–0005 TIDAK diubah. Tidak ada DELETE, DROP TABLE, DROP COLUMN, atau perubahan data siswa.
--   - status_masuk mendapat satu kolom baru (tingkat_kunci, bawaan 0). Baris lama tetap sah.
--   - catat_percobaan_masuk diganti (CREATE OR REPLACE, tanda tangan sama), sehingga Edge Function
--     dan skrip lama tetap memanggil fungsi yang sama.
--   - Fungsi baru hanya untuk service_role.

-- ===========================================================================
-- 1. Penguncian bertingkat per username
-- ===========================================================================
-- Kunci ke-1 = 5 menit, ke-2 = 15 menit, ke-3 dan seterusnya = 60 menit.
-- Tingkat kembali 0 setelah login/atur PIN berhasil, setelah reset PIN oleh peneliti
-- (buat_reset_pin_siswa menghapus baris status_masuk), atau setelah 24 jam tanpa percobaan.
alter table public.status_masuk
  add column tingkat_kunci smallint not null default 0 check (tingkat_kunci between 0 and 3);

-- Satu sumber angka lama kunci.
create function public.lama_kunci_masuk(p_tingkat smallint) returns interval
language sql immutable as $$
  select case
    when p_tingkat <= 0 then interval '5 minutes'
    when p_tingkat = 1 then interval '15 minutes'
    else interval '60 minutes' end
$$;

-- Tingkat yang berlaku: dianggap 0 jika baris tidak disentuh selama 24 jam.
create function public._tingkat_kunci_berlaku(p_tingkat smallint, p_diperbarui timestamptz) returns smallint
language sql stable as $$
  select case when p_diperbarui < now() - interval '24 hours' then 0::smallint else p_tingkat end
$$;

-- Sama dengan versi 0004 (K6–K10: dihitung berurutan, kunci mulai pada kegagalan ke-5,
-- kegagalan saat terkunci tidak menambah hitungan dan tidak memperpanjang kunci),
-- tetapi lama kunci mengikuti tingkat_kunci.
create or replace function public.catat_percobaan_masuk(p_kode_hash text, p_berhasil boolean, p_ip_hash text default null)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_berhasil then
    insert into public.status_masuk as s (kode_hash, gagal_berturut, terkunci_sampai, tingkat_kunci, diperbarui_pada)
    values (p_kode_hash, 0, null, 0, now())
    on conflict (kode_hash) do update
      set gagal_berturut = 0, terkunci_sampai = null, tingkat_kunci = 0, diperbarui_pada = now();
  else
    insert into public.status_masuk as s (kode_hash, gagal_berturut, terkunci_sampai, tingkat_kunci, diperbarui_pada)
    values (p_kode_hash, 1, null, 0, now())
    on conflict (kode_hash) do update
      set gagal_berturut = case
            when s.terkunci_sampai > now() then s.gagal_berturut                   -- masih terkunci
            when s.terkunci_sampai is not null then 1                             -- kunci berakhir
            else least(s.gagal_berturut + 1, 5) end,
          terkunci_sampai = case
            when s.terkunci_sampai > now() then s.terkunci_sampai                 -- tidak diperpanjang
            when s.terkunci_sampai is null and s.gagal_berturut + 1 >= 5          -- kegagalan ke-5
              then now() + public.lama_kunci_masuk(
                     public._tingkat_kunci_berlaku(s.tingkat_kunci, s.diperbarui_pada))
            else null end,
          tingkat_kunci = case
            when s.terkunci_sampai > now() then s.tingkat_kunci
            when s.terkunci_sampai is null and s.gagal_berturut + 1 >= 5
              then least(public._tingkat_kunci_berlaku(s.tingkat_kunci, s.diperbarui_pada) + 1, 3)
            else public._tingkat_kunci_berlaku(s.tingkat_kunci, s.diperbarui_pada) end,
          diperbarui_pada = now();
  end if;

  insert into public.percobaan_masuk (ip_hash, kode_hash, berhasil)
  values (p_ip_hash, p_kode_hash, p_berhasil);
end $$;

-- ===========================================================================
-- 2. Batas gagal login per IP (KF-05b K5: opsional, tidak boleh mengunci satu Wi-Fi sekolah)
-- ===========================================================================
-- Hanya dipakai jika Edge Function mendapat IP dari sumber tepercaya (penangan.js ambilIp).
-- 100 kegagalan per jam per IP: satu kelas ±30 siswa yang salah PIN 1–2 kali tidak mendekatinya,
-- tetapi penebakan PIN yang disebar ke banyak username dari satu IP berhenti.
create function public.batas_masuk_ip() returns integer
language sql immutable as $$ select 100 $$;

create index percobaan_masuk_ip_gagal_idx
  on public.percobaan_masuk (ip_hash, dibuat_pada desc) where not berhasil;

-- true jika IP ini sudah mencapai batas gagal dalam 1 jam terakhir. null → false (tanpa batas IP).
create function public.masuk_ip_terbatas(p_ip_hash text) returns boolean
language sql stable security definer set search_path = public as $$
  select p_ip_hash is not null and (
    select count(*) from public.percobaan_masuk
    where ip_hash = p_ip_hash and not berhasil and dibuat_pada > now() - interval '1 hour'
  ) >= public.batas_masuk_ip()
$$;

-- ===========================================================================
-- 3. Hak akses (AGENTS.md §7)
-- ===========================================================================
revoke all on all functions in schema public from public, anon, authenticated;

-- RPC siswa Fase 4 (tidak berubah)
grant execute on function public.id_siswa_saya() to authenticated;
grant execute on function public.ambil_profil() to authenticated;
grant execute on function public.simpan_kemajuan(text, text, smallint) to authenticated;
grant execute on function public.ambil_soal_latihan(text, smallint, smallint) to authenticated;
grant execute on function public.periksa_pemahaman(uuid, jsonb, text) to authenticated;
grant execute on function public.ambil_petunjuk(uuid, smallint) to authenticated;
grant execute on function public.periksa_jawaban(uuid, numeric, smallint, integer, uuid, text) to authenticated;
grant execute on function public.mulai_kuis() to authenticated;
grant execute on function public.status_kuis() to authenticated;
grant execute on function public.selesaikan_kuis(uuid) to authenticated;
grant execute on function public.ringkasan_kemajuan() to authenticated;
grant execute on function public.riwayat_belajar(smallint, timestamptz) to authenticated;
grant execute on function public.simpan_penjelasan(uuid, text) to authenticated;

-- Fungsi baru, hanya service_role (hak service_role yang lama tidak terpengaruh perintah revoke di atas)
grant execute on function public.catat_percobaan_masuk(text, boolean, text) to service_role;
grant execute on function public.masuk_ip_terbatas(text) to service_role;
