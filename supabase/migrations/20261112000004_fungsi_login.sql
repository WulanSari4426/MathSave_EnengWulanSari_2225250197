-- MathSave — Fase 5: fungsi database untuk Edge Function login dan skrip pengelola.
-- HANYA untuk service_role (Edge Function dan skrip di komputer peneliti). Siswa dan anon tidak punya akses.
-- Tabel Fase 4 tidak diubah. Fungsi ini ada karena aturan berikut harus atomik dalam satu perintah,
-- yang tidak bisa dinyatakan lewat PostgREST biasa:
--   - penguncian KF-05b (INSERT … ON CONFLICT … DO UPDATE, architecture.md "status_masuk")
--   - klaim pendaftaran pertama bersyarat pin_dibuat_pada IS NULL (KF-05d, RS-02)
--   - pemakaian kode reset sekali pakai (KF-05c)
-- Nilai yang diterima selalu HASH (kode_hash, token_hash). Kode siswa, PIN, dan kode reset asli
-- tidak pernah masuk ke database.

-- ---------------------------------------------------------------------------
-- Penguncian login per akun (KF-05b, K1–K10)
-- ---------------------------------------------------------------------------

-- true jika kode_hash sedang terkunci (waktu server).
create function public.kunci_masuk_aktif(p_kode_hash text) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select terkunci_sampai > now() from public.status_masuk where kode_hash = p_kode_hash),
    false)
$$;

-- Mencatat hasil satu percobaan (masuk, daftar, atau atur PIN baru) secara atomik.
--  - berhasil → gagal_berturut = 0, kunci dihapus (K8)
--  - gagal    → +1 berurutan (K7); kegagalan ke-5 mengunci 5 menit (K10)
--  - kunci yang sudah berakhir dianggap mulai dari 0 lagi (K6, K9)
--  - kegagalan saat masih terkunci tidak menambah hitungan dan tidak memperpanjang kunci
-- Juga menulis log percobaan_masuk tanpa kode atau PIN asli.
create function public.catat_percobaan_masuk(p_kode_hash text, p_berhasil boolean, p_ip_hash text default null)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_berhasil then
    insert into public.status_masuk as s (kode_hash, gagal_berturut, terkunci_sampai, diperbarui_pada)
    values (p_kode_hash, 0, null, now())
    on conflict (kode_hash) do update
      set gagal_berturut = 0, terkunci_sampai = null, diperbarui_pada = now();
  else
    insert into public.status_masuk as s (kode_hash, gagal_berturut, terkunci_sampai, diperbarui_pada)
    values (p_kode_hash, 1, null, now())
    on conflict (kode_hash) do update
      set gagal_berturut = case
            when s.terkunci_sampai > now() then s.gagal_berturut                   -- masih terkunci
            when s.terkunci_sampai is not null then 1                             -- kunci berakhir
            else least(s.gagal_berturut + 1, 5) end,
          terkunci_sampai = case
            when s.terkunci_sampai > now() then s.terkunci_sampai                 -- tidak diperpanjang
            when s.terkunci_sampai is null and s.gagal_berturut + 1 >= 5
              then now() + interval '5 minutes'                                   -- kegagalan ke-5
            else null end,
          diperbarui_pada = now();
  end if;

  insert into public.percobaan_masuk (ip_hash, kode_hash, berhasil)
  values (p_ip_hash, p_kode_hash, p_berhasil);
end $$;

-- ---------------------------------------------------------------------------
-- Akun siswa
-- ---------------------------------------------------------------------------

-- Data siswa AKTIF untuk proses login. null jika tidak ada atau nonaktif.
create function public.cari_siswa_untuk_masuk(p_kode_hash text) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
           'id', id, 'auth_user_id', auth_user_id, 'pin_dibuat_pada', pin_dibuat_pada,
           'nama_panggilan', nama_panggilan, 'kelas', kelas)
  from public.siswa where kode_hash = p_kode_hash and aktif
$$;

-- Klaim pendaftaran pertama: hanya berhasil jika PIN belum pernah dibuat (RS-02).
-- Dua permintaan bersamaan → hanya satu yang mendapat true.
create function public.klaim_pendaftaran_pertama(p_siswa_id uuid) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  update public.siswa set pin_dibuat_pada = now()
   where id = p_siswa_id and aktif and pin_dibuat_pada is null;
  return found;
end $$;

-- Membatalkan klaim jika penggantian kata sandi Auth gagal, agar siswa bisa mencoba lagi.
create function public.batalkan_klaim_pendaftaran(p_siswa_id uuid) returns void
language sql security definer set search_path = public as $$
  update public.siswa set pin_dibuat_pada = null where id = p_siswa_id
$$;

-- Dipakai skrip buat-siswa.js.
create function public.tambah_siswa(
  p_id uuid, p_auth_user_id uuid, p_kode_hash text, p_nama_panggilan text, p_kelas text)
returns void
language sql security definer set search_path = public as $$
  insert into public.siswa (id, auth_user_id, kode_hash, nama_panggilan, kelas, pin_dibuat_pada)
  values (p_id, p_auth_user_id, p_kode_hash, trim(p_nama_panggilan), trim(p_kelas), null)
$$;

-- Dipakai skrip buat-siswa.js untuk menentukan nomor kode berikutnya (kode asli tidak disimpan).
create function public.daftar_kode_hash_siswa() returns setof text
language sql stable security definer set search_path = public as $$
  select kode_hash from public.siswa
$$;

-- ---------------------------------------------------------------------------
-- Reset PIN (KF-05c)
-- ---------------------------------------------------------------------------

-- Dipakai reset-pin.js: membatalkan kode reset lama yang belum dipakai, membuat yang baru,
-- dan mengakhiri kunci login akun itu. Mengembalikan auth_user_id siswa (null jika tidak ada).
create function public.buat_reset_pin(
  p_kode_hash text, p_token_hash text, p_berlaku interval, p_dibuat_oleh text)
returns uuid
language plpgsql security definer set search_path = public as $$
declare v_siswa public.siswa;
begin
  select * into v_siswa from public.siswa where kode_hash = p_kode_hash and aktif for update;
  if v_siswa.id is null then return null; end if;

  update public.reset_pin set kedaluwarsa_pada = now()
   where siswa_id = v_siswa.id and dipakai_pada is null and kedaluwarsa_pada > now();

  insert into public.reset_pin (siswa_id, token_hash, kedaluwarsa_pada, dibuat_oleh)
  values (v_siswa.id, p_token_hash, now() + p_berlaku, p_dibuat_oleh);

  delete from public.status_masuk where kode_hash = p_kode_hash;

  return v_siswa.auth_user_id;
end $$;

-- id reset_pin yang masih berlaku untuk siswa itu, atau null.
create function public.cari_reset_pin_valid(p_siswa_id uuid, p_token_hash text) returns uuid
language sql stable security definer set search_path = public as $$
  select id from public.reset_pin
  where siswa_id = p_siswa_id and token_hash = p_token_hash
    and dipakai_pada is null and kedaluwarsa_pada > now()
$$;
-- Memakai kode reset sekali saja dan mencatat waktu PIN baru dibuat.
-- Hanya siswa aktif yang boleh menggunakan token reset.
create function public.pakai_reset_pin(p_reset_id uuid) returns boolean
language plpgsql security definer set search_path = public as $$
declare
  v_siswa_id uuid;
begin
  select s.id into v_siswa_id
  from public.reset_pin rp
  join public.siswa s on s.id = rp.siswa_id
  where rp.id = p_reset_id
    and s.aktif
    and rp.dipakai_pada is null
    and rp.kedaluwarsa_pada > now()
  for update of s;

  if v_siswa_id is null then return false; end if;

  update public.reset_pin
  set dipakai_pada = now()
  where id = p_reset_id
    and siswa_id = v_siswa_id
    and dipakai_pada is null
    and kedaluwarsa_pada > now();

  if not found then return false; end if;

  update public.siswa
  set pin_dibuat_pada = now()
  where id = v_siswa_id and aktif;

  return found;
end $$;


-- Membatalkan pemakaian jika penggantian kata sandi Auth gagal.
create function public.batalkan_pakai_reset_pin(p_reset_id uuid) returns void
language sql security definer set search_path = public as $$
  update public.reset_pin set dipakai_pada = null where id = p_reset_id
$$;

-- ---------------------------------------------------------------------------
-- Hak akses: hanya service_role.
-- ---------------------------------------------------------------------------
revoke all on all functions in schema public from public, anon, authenticated;

-- Pulihkan hak RPC siswa Fase 4 (dicabut oleh perintah di atas).
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
