-- Lanora — Fase 5A (KF-05f): akun username dan pilihan kelas.
-- Rancangan: docs/architecture.md bagian 5.0, docs/api.md bagian 2e.
--
-- Prinsip migrasi ini:
--   - Migrasi 0001–0004 TIDAK diubah. Tidak ada DELETE, DROP TABLE, DROP COLUMN, atau perubahan data.
--   - Akun lama berbasis kode siswa (kode_hash) tetap sah.
--   - Tabel baru ber-RLS tanpa hak untuk anon/authenticated. Fungsi baru hanya untuk service_role.
--   - Nilai yang diterima fungsi berupa hash (kunci penguncian, token reset, IP), tidak pernah PIN.

-- ===========================================================================
-- 1. Daftar kelas yang diatur peneliti (U6)
-- ===========================================================================
create table public.kelas (
  id           smallint generated always as identity primary key,
  nama         text not null check (length(trim(nama)) between 1 and 20 and nama = trim(nama)),
  jenjang      smallint not null check (jenjang between 7 and 12),     -- VII–XII
  urutan       smallint not null default 0,
  aktif        boolean not null default true,                          -- false = tidak tampil di pilihan
  dibuat_pada  timestamptz not null default now()
);
-- Nama kelas unik tanpa membedakan huruf besar/kecil ("VIII-C" = "viii-c").
create unique index kelas_nama_unik on public.kelas (lower(nama));

-- ===========================================================================
-- 2. Username dan kelas pada siswa (U2–U5, U8)
-- ===========================================================================
alter table public.siswa add column username text;
alter table public.siswa add column kelas_id smallint references public.kelas (id);  -- tanpa ON DELETE CASCADE

-- U3 + U4: unik global. Karena CHECK memaksa huruf kecil, UNIQUE biasa sudah tidak membedakan besar/kecil.
alter table public.siswa add constraint siswa_username_unik unique (username);
alter table public.siswa add constraint siswa_username_format
  check (username is null or username ~ '^[a-z][a-z0-9_]{2,19}$');

-- Akun baru tidak memakai kode siswa; akun lama tetap memakainya.
alter table public.siswa alter column kode_hash drop not null;
alter table public.siswa add constraint siswa_punya_identitas_login
  check (username is not null or kode_hash is not null);

create index siswa_kelas_idx on public.siswa (kelas_id);

-- ===========================================================================
-- 3. Batas pendaftaran per IP (U9): 60 akun baru, 20 kode kelas salah, per jam
-- ===========================================================================
create table public.percobaan_daftar (
  id           bigint generated always as identity primary key,
  ip_hash      text not null,                                          -- HMAC IP, bukan IP asli
  jenis        text not null check (jenis in ('akun_baru', 'kode_kelas_salah')),
  dibuat_pada  timestamptz not null default now()
);
create index percobaan_daftar_ip_idx on public.percobaan_daftar (ip_hash, jenis, dibuat_pada desc);

-- Satu sumber angka batas (U9).
create function public.batas_daftar(p_jenis text) returns integer
language sql immutable as $$
  select case p_jenis when 'akun_baru' then 60 when 'kode_kelas_salah' then 20 end
$$;

create function public._jumlah_percobaan_daftar(p_ip_hash text, p_jenis text) returns integer
language sql stable set search_path = public as $$
  select count(*)::int from public.percobaan_daftar
  where ip_hash = p_ip_hash and jenis = p_jenis and dibuat_pada > now() - interval '1 hour'
$$;

-- Status batas untuk satu IP: dipakai Edge Function sebelum memproses pendaftaran.
create function public.status_batas_daftar(p_ip_hash text) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'kode_kelas_salah_tercapai',
      public._jumlah_percobaan_daftar(p_ip_hash, 'kode_kelas_salah') >= public.batas_daftar('kode_kelas_salah'),
    'akun_baru_tercapai',
      public._jumlah_percobaan_daftar(p_ip_hash, 'akun_baru') >= public.batas_daftar('akun_baru'))
$$;

create function public.catat_kode_kelas_salah(p_ip_hash text) returns void
language sql security definer set search_path = public as $$
  insert into public.percobaan_daftar (ip_hash, jenis) values (p_ip_hash, 'kode_kelas_salah')
$$;

-- ===========================================================================
-- 4. Pendaftaran mandiri dan login dengan username
-- ===========================================================================

-- Kelas aktif untuk layar Daftar langkah 2, terurut jenjang lalu urutan.
create function public.daftar_kelas_aktif() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', id, 'nama', nama, 'jenjang', jenjang)
                            order by jenjang, urutan, lower(nama)), '[]'::jsonb)
  from public.kelas where aktif
$$;

-- Pemeriksaan awal sebelum membuat akun Auth (bukan pengaman utama; pengaman utama = UNIQUE).
create function public.username_tersedia(p_username text) returns boolean
language sql stable security definer set search_path = public as $$
  select not exists (select 1 from public.siswa where username = lower(trim(p_username)))
$$;

-- Data siswa AKTIF berdasarkan username, untuk login dan atur PIN baru. null jika tidak ada.
create function public.cari_siswa_username(p_username text) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
           'id', id, 'auth_user_id', auth_user_id, 'username', username,
           'pin_dibuat_pada', pin_dibuat_pada, 'nama_panggilan', nama_panggilan, 'kelas', kelas)
  from public.siswa where username = lower(trim(p_username)) and aktif
$$;

-- Menyimpan siswa baru setelah akun Auth dibuat Edge Function. Satu transaksi:
--   kunci per IP → periksa batas akun baru → periksa kelas aktif → simpan siswa → catat 'akun_baru'.
-- Galat yang mungkin (Edge Function lalu MENGHAPUS akun Auth yang baru dibuat):
--   TERLALU_BANYAK_PENDAFTARAN, KELAS_TIDAK_SAH, USERNAME_TIDAK_SAH, USERNAME_SUDAH_DIPAKAI
create function public.simpan_siswa_mandiri(
  p_id uuid, p_auth_user_id uuid, p_username text, p_kelas_id smallint, p_ip_hash text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_username text := lower(trim(p_username));
  v_kelas public.kelas;
  v_kendala text;
begin
  -- Pendaftaran dari IP yang sama dijalankan bergantian, agar batas 60 tidak terlewati bersamaan.
  perform pg_advisory_xact_lock(hashtextextended('lanora-daftar:' || p_ip_hash, 0));
  if public._jumlah_percobaan_daftar(p_ip_hash, 'akun_baru') >= public.batas_daftar('akun_baru') then
    raise exception using message = 'TERLALU_BANYAK_PENDAFTARAN', errcode = 'P0001';
  end if;

  -- FOR SHARE: kelas tidak bisa dinonaktifkan/diubah di tengah transaksi ini.
  select * into v_kelas from public.kelas where id = p_kelas_id and aktif for share;
  if v_kelas.id is null then
    raise exception using message = 'KELAS_TIDAK_SAH', errcode = 'P0001';
  end if;

  begin
    insert into public.siswa
      (id, auth_user_id, kode_hash, username, kelas_id, nama_panggilan, kelas, pin_dibuat_pada)
    values
      (p_id, p_auth_user_id, null, v_username, v_kelas.id, v_username, v_kelas.nama, now());
  exception
    when unique_violation then
      get stacked diagnostics v_kendala = constraint_name;
      if v_kendala = 'siswa_username_unik' then
        raise exception using message = 'USERNAME_SUDAH_DIPAKAI', errcode = 'P0001';
      end if;
      raise;
    when check_violation then
      get stacked diagnostics v_kendala = constraint_name;
      if v_kendala in ('siswa_username_format', 'siswa_nama_panggilan_check', 'siswa_punya_identitas_login') then
        raise exception using message = 'USERNAME_TIDAK_SAH', errcode = 'P0001';
      end if;
      raise;
  end;

  insert into public.percobaan_daftar (ip_hash, jenis) values (p_ip_hash, 'akun_baru');

  return jsonb_build_object('id', p_id, 'nama_panggilan', v_username, 'kelas', v_kelas.nama);
end $$;

-- ===========================================================================
-- 5. Reset PIN berdasarkan siswa.id (reset-pin.js mencari siswa lewat username)
-- ===========================================================================
-- Sama dengan buat_reset_pin (0004), tetapi siswa dikenali dari id dan kunci penguncian
-- (HMAC "cari-username:") diberikan pemanggil. Mengembalikan auth_user_id, atau null.
create function public.buat_reset_pin_siswa(
  p_siswa_id uuid, p_kunci_hash text, p_token_hash text, p_berlaku interval, p_dibuat_oleh text)
returns uuid
language plpgsql security definer set search_path = public as $$
declare v_siswa public.siswa;
begin
  select * into v_siswa from public.siswa where id = p_siswa_id and aktif for update;
  if v_siswa.id is null then return null; end if;

  update public.reset_pin set kedaluwarsa_pada = now()
   where siswa_id = v_siswa.id and dipakai_pada is null and kedaluwarsa_pada > now();

  insert into public.reset_pin (siswa_id, token_hash, kedaluwarsa_pada, dibuat_oleh)
  values (v_siswa.id, p_token_hash, now() + p_berlaku, p_dibuat_oleh);

  delete from public.status_masuk where kode_hash = p_kunci_hash;   -- hanya baris penguncian, bukan data siswa
  return v_siswa.auth_user_id;
end $$;

-- ===========================================================================
-- 6. Pengelolaan daftar kelas oleh peneliti (kelola-kelas.js). Tidak ada fungsi hapus.
-- ===========================================================================
create function public.kelola_kelas_daftar() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
           'id', k.id, 'nama', k.nama, 'jenjang', k.jenjang, 'urutan', k.urutan, 'aktif', k.aktif,
           'jumlah_siswa', (select count(*) from public.siswa s where s.kelas_id = k.id))
         order by k.jenjang, k.urutan, lower(k.nama)), '[]'::jsonb)
  from public.kelas k
$$;

create function public.kelola_kelas_tambah(p_nama text, p_jenjang smallint, p_urutan smallint default 0)
returns smallint
language plpgsql security definer set search_path = public as $$
declare v_id smallint;
begin
  insert into public.kelas (nama, jenjang, urutan) values (trim(p_nama), p_jenjang, coalesce(p_urutan, 0))
  returning id into v_id;
  return v_id;
exception
  when unique_violation then raise exception using message = 'KELAS_SUDAH_ADA', errcode = 'P0001';
  when check_violation then raise exception using message = 'KELAS_TIDAK_SAH', errcode = 'P0001';
end $$;

-- Mengubah nama kelas. Teks siswa.kelas yang sudah tersimpan tidak ikut berubah (riwayat).
create function public.kelola_kelas_ubah_nama(p_id smallint, p_nama text) returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.kelas set nama = trim(p_nama) where id = p_id;
  if not found then raise exception using message = 'KELAS_TIDAK_DITEMUKAN', errcode = 'P0001'; end if;
exception
  when unique_violation then raise exception using message = 'KELAS_SUDAH_ADA', errcode = 'P0001';
  when check_violation then raise exception using message = 'KELAS_TIDAK_SAH', errcode = 'P0001';
end $$;

create function public.kelola_kelas_setel_aktif(p_id smallint, p_aktif boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.kelas set aktif = p_aktif where id = p_id;
  if not found then raise exception using message = 'KELAS_TIDAK_DITEMUKAN', errcode = 'P0001'; end if;
end $$;

-- ===========================================================================
-- 7. Akun lama (U8): memberi username tanpa menyentuh siswa.id, auth_user_id, atau data belajar.
--    Setelah ini peneliti WAJIB menjalankan reset PIN, karena kata sandi lama diturunkan dari
--    kode siswa asli yang tidak disimpan server. Siswa lalu membuat PIN baru dengan username.
-- ===========================================================================
create function public.beri_username_akun_lama(p_siswa_id uuid, p_username text) returns void
language plpgsql security definer set search_path = public as $$
declare v_kendala text;
begin
  update public.siswa set username = lower(trim(p_username))
   where id = p_siswa_id and username is null;
  if not found then
    raise exception using message = 'AKUN_TIDAK_DITEMUKAN_ATAU_SUDAH_PUNYA_USERNAME', errcode = 'P0001';
  end if;
exception
  when unique_violation then
    raise exception using message = 'USERNAME_SUDAH_DIPAKAI', errcode = 'P0001';
  when check_violation then
    get stacked diagnostics v_kendala = constraint_name;
    if v_kendala = 'siswa_username_format' then
      raise exception using message = 'USERNAME_TIDAK_SAH', errcode = 'P0001';
    end if;
    raise;
end $$;

-- ===========================================================================
-- 8. RLS dan hak akses
-- ===========================================================================
alter table public.kelas enable row level security;
alter table public.percobaan_daftar enable row level security;
-- Tanpa kebijakan dan tanpa GRANT: tertutup bagi anon dan siswa.
revoke all on public.kelas, public.percobaan_daftar from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

-- Hak EXECUTE bawaan PUBLIC dicabut eksplisit (AGENTS.md §7), lalu diberikan hanya yang perlu.
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

-- Fungsi login Fase 5 (0004), tetap untuk service_role
grant execute on function public.kunci_masuk_aktif(text) to service_role;
grant execute on function public.catat_percobaan_masuk(text, boolean, text) to service_role;
grant execute on function public.cari_siswa_untuk_masuk(text) to service_role;
grant execute on function public.klaim_pendaftaran_pertama(uuid) to service_role;
grant execute on function public.batalkan_klaim_pendaftaran(uuid) to service_role;
grant execute on function public.tambah_siswa(uuid, uuid, text, text, text) to service_role;
grant execute on function public.daftar_kode_hash_siswa() to service_role;
grant execute on function public.buat_reset_pin(text, text, interval, text) to service_role;
grant execute on function public.cari_reset_pin_valid(uuid, text) to service_role;
grant execute on function public.pakai_reset_pin(uuid) to service_role;
grant execute on function public.batalkan_pakai_reset_pin(uuid) to service_role;

-- Fungsi baru Fase 5A, hanya service_role
grant execute on function public.status_batas_daftar(text) to service_role;
grant execute on function public.catat_kode_kelas_salah(text) to service_role;
grant execute on function public.daftar_kelas_aktif() to service_role;
grant execute on function public.username_tersedia(text) to service_role;
grant execute on function public.cari_siswa_username(text) to service_role;
grant execute on function public.simpan_siswa_mandiri(uuid, uuid, text, smallint, text) to service_role;
grant execute on function public.buat_reset_pin_siswa(uuid, text, text, interval, text) to service_role;
grant execute on function public.kelola_kelas_daftar() to service_role;
grant execute on function public.kelola_kelas_tambah(text, smallint, smallint) to service_role;
grant execute on function public.kelola_kelas_ubah_nama(smallint, text) to service_role;
grant execute on function public.kelola_kelas_setel_aktif(smallint, boolean) to service_role;
grant execute on function public.beri_username_akun_lama(uuid, text) to service_role;
