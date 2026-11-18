-- MathSave — Fase 4: skema dasar (architecture.md bagian 5 dan 6).
-- Tabel pretest/posttest dan penilai (Fase 12A) dibuat di migrasi terpisah setelah PT-01.
-- Jangan mengubah file ini setelah dijalankan di Supabase. Buat migrasi baru.

-- gen_random_uuid() bawaan PostgreSQL 13+, tidak perlu ekstensi.

-- ---------------------------------------------------------------------------
-- Siswa (KF-05, KF-05d). PIN TIDAK PERNAH disimpan di sini (KF-05 L6).
-- ---------------------------------------------------------------------------
create table public.siswa (
  id               uuid primary key default gen_random_uuid(),
  auth_user_id     uuid not null unique references auth.users (id),
  kode_hash        text not null unique,              -- HMAC "cari:" kode siswa
  pin_dibuat_pada  timestamptz,                       -- kosong = belum pendaftaran pertama
  nama_panggilan   text not null check (length(trim(nama_panggilan)) between 1 and 40),
  kelas            text not null check (length(trim(kelas)) between 1 and 20),
  aktif            boolean not null default true,
  dibuat_pada      timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Bank soal latihan dan kuis (KF-14: dua bank terpisah)
-- ---------------------------------------------------------------------------
create table public.soal (
  id              uuid primary key default gen_random_uuid(),
  kode            text not null unique,
  sub_materi      text not null check (sub_materi in ('P0','M1','M2','M3','M4','M5','M6')),
  tingkat         smallint not null check (tingkat between 1 and 3),
  bank            text not null check (bank in ('latihan','kuis')),
  bentuk          text not null check (bentuk in ('isian','pilihan_ganda')),
  opsi            jsonb,
  kategori_kuis   text check (kategori_kuis in
                    ('konsep','besar_bunga','tabungan_akhir','modal_suku_bunga','lama_menabung','penerapan')),
  konteks         text,
  teks_soal       text not null,
  sorotan         jsonb not null default '[]'::jsonb,
  diketahui       jsonb not null default '{}'::jsonb,
  ditanya         text not null check (ditanya in ('bunga','tabungan_akhir','modal','suku_bunga','lama')),
  satuan_jawaban  text not null check (satuan_jawaban in ('rupiah','persen','tahun','bulan','hari')),
  jawaban         numeric,
  toleransi       numeric check (toleransi is null or toleransi >= 0),
  petunjuk        jsonb,
  pembahasan      jsonb not null default '[]'::jsonb,
  pola_kesalahan  jsonb not null default '[]'::jsonb,
  aktif           boolean not null default true,

  -- Pemisahan bank (KF-14)
  constraint soal_latihan_isian_tanpa_kategori
    check (bank = 'kuis' or (bentuk = 'isian' and kategori_kuis is null)),
  constraint soal_kuis_punya_kategori
    check (bank = 'latihan' or kategori_kuis is not null),
  -- Isian wajib punya kunci dan toleransi (KF-19)
  constraint soal_isian_punya_kunci
    check (bentuk = 'pilihan_ganda' or (jawaban is not null and toleransi is not null and opsi is null)),
  -- Pilihan ganda tepat 4 opsi (KF-18)
  constraint soal_pg_empat_opsi
    check (bentuk = 'isian' or (jsonb_typeof(opsi) = 'array' and jsonb_array_length(opsi) = 4)),
  -- Petunjuk 3 tingkat hanya di latihan (KF-15)
  constraint soal_latihan_tiga_petunjuk
    check (bank = 'kuis' or (jsonb_typeof(petunjuk) = 'array' and jsonb_array_length(petunjuk) = 3)),
  constraint soal_kuis_tanpa_petunjuk
    check (bank = 'latihan' or petunjuk is null)
);

-- Opsi pilihan ganda: id unik o1–o4 dan tepat satu kunci (KF-18).
create function public.periksa_opsi_soal() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.bentuk = 'pilihan_ganda' then
    if (select count(distinct o->>'id') from jsonb_array_elements(new.opsi) o
        where o->>'id' in ('o1','o2','o3','o4')) <> 4 then
      raise exception 'Opsi soal % harus memakai id o1–o4 yang unik', new.kode;
    end if;
    if (select count(*) from jsonb_array_elements(new.opsi) o
        where (o->>'kunci')::boolean is true) <> 1 then
      raise exception 'Soal % harus punya tepat satu opsi kunci', new.kode;
    end if;
  end if;
  return new;
end $$;

create trigger soal_periksa_opsi
  before insert or update on public.soal
  for each row execute function public.periksa_opsi_soal();

create index soal_latihan_idx on public.soal (sub_materi, tingkat) where bank = 'latihan' and aktif;
create index soal_kuis_idx on public.soal (kategori_kuis, tingkat, bentuk) where bank = 'kuis' and aktif;

-- ---------------------------------------------------------------------------
-- Kuis (KF-11, KF-13, KF-14, KF-18, KF-21)
-- ---------------------------------------------------------------------------
create table public.sesi_kuis (
  id             uuid primary key default gen_random_uuid(),
  siswa_id       uuid not null references public.siswa (id),
  percobaan_ke   smallint not null check (percobaan_ke between 1 and 2),
  mulai_pada     timestamptz not null default now(),
  batas_waktu    timestamptz not null,
  selesai_pada   timestamptz,
  cara_selesai   text check (cara_selesai in ('siswa','waktu_habis')),
  hasil_dilihat  boolean not null default false,
  jumlah_benar   smallint check (jumlah_benar between 0 and 20),
  skor           smallint check (skor between 0 and 100),
  unique (siswa_id, percobaan_ke),
  constraint sesi_kuis_selesai_lengkap
    check ((selesai_pada is null) = (cara_selesai is null))
);

create table public.kisi_kisi_kuis (
  nomor          smallint primary key check (nomor between 1 and 20),
  kategori_kuis  text not null,
  tingkat        smallint not null check (tingkat between 1 and 3),
  bentuk         text not null check (bentuk in ('isian','pilihan_ganda'))
);

-- 20 baris kisi-kisi resmi (PRD F-07, KF-21). Diubah hanya lewat migrasi baru.
insert into public.kisi_kisi_kuis (nomor, kategori_kuis, tingkat, bentuk) values
  ( 1, 'konsep',           1, 'pilihan_ganda'),
  ( 2, 'besar_bunga',      1, 'pilihan_ganda'),
  ( 3, 'tabungan_akhir',   1, 'pilihan_ganda'),
  ( 4, 'modal_suku_bunga', 1, 'pilihan_ganda'),
  ( 5, 'lama_menabung',    1, 'pilihan_ganda'),
  ( 6, 'konsep',           1, 'pilihan_ganda'),
  ( 7, 'besar_bunga',      2, 'pilihan_ganda'),
  ( 8, 'tabungan_akhir',   2, 'pilihan_ganda'),
  ( 9, 'modal_suku_bunga', 2, 'pilihan_ganda'),
  (10, 'lama_menabung',    2, 'isian'),
  (11, 'konsep',           2, 'pilihan_ganda'),
  (12, 'besar_bunga',      2, 'isian'),
  (13, 'tabungan_akhir',   2, 'pilihan_ganda'),
  (14, 'modal_suku_bunga', 2, 'isian'),
  (15, 'besar_bunga',      2, 'pilihan_ganda'),
  (16, 'penerapan',        2, 'pilihan_ganda'),
  (17, 'besar_bunga',      3, 'isian'),
  (18, 'tabungan_akhir',   3, 'isian'),
  (19, 'modal_suku_bunga', 3, 'pilihan_ganda'),
  (20, 'penerapan',        3, 'pilihan_ganda');

create table public.sesi_kuis_soal (
  sesi_kuis_id  uuid not null references public.sesi_kuis (id),
  siswa_id      uuid not null references public.siswa (id),
  nomor         smallint not null references public.kisi_kisi_kuis (nomor),
  soal_id       uuid not null references public.soal (id),
  urutan_opsi   text[],
  primary key (sesi_kuis_id, nomor),
  unique (sesi_kuis_id, soal_id),
  unique (siswa_id, soal_id)          -- KF-14 B4: soal tidak pernah diberikan dua kali
);

-- ---------------------------------------------------------------------------
-- Jawaban latihan dan kuis
-- ---------------------------------------------------------------------------
create table public.percobaan_jawaban (
  id               uuid primary key default gen_random_uuid(),
  siswa_id         uuid not null references public.siswa (id),
  soal_id          uuid not null references public.soal (id),
  sesi_kuis_id     uuid references public.sesi_kuis (id),   -- kosong = latihan
  jawaban_siswa    numeric,
  opsi_dipilih     text check (opsi_dipilih is null or opsi_dipilih in ('o1','o2','o3','o4')),
  benar            boolean not null,
  jenis_kesalahan  text check (jenis_kesalahan is null or jenis_kesalahan in
                     ('SATUAN_WAKTU','PERSEN','TERTUKAR_BUNGA_TABUNGAN','RUMUS_INVERS','LAINNYA')),
  jumlah_petunjuk  smallint not null default 0 check (jumlah_petunjuk between 0 and 3),
  durasi_detik     integer not null default 0 check (durasi_detik >= 0),
  -- Waktu server saat jawaban diterima (KF-20). Jam perangkat tidak pernah dipakai.
  dibuat_pada      timestamptz not null default now(),
  -- Urutan penerimaan, pemecah seri jika dua jawaban punya waktu yang sama (KF-22).
  urutan           bigint generated always as identity,
  constraint percobaan_kuis_tanpa_petunjuk check (sesi_kuis_id is null or jumlah_petunjuk = 0)
);

create index percobaan_jawaban_siswa_idx on public.percobaan_jawaban (siswa_id, dibuat_pada desc);
create index percobaan_jawaban_sesi_idx on public.percobaan_jawaban (sesi_kuis_id, soal_id, urutan desc)
  where sesi_kuis_id is not null;

-- ---------------------------------------------------------------------------
-- Kemajuan materi dan penjelasan siswa
-- ---------------------------------------------------------------------------
create table public.kemajuan_materi (
  siswa_id         uuid not null references public.siswa (id),
  sub_materi       text not null check (sub_materi in ('P0','M1','M2','M3','M4','M5','M6')),
  status           text not null check (status in ('belum','sedang','selesai')),
  kartu_terakhir   smallint not null default 0 check (kartu_terakhir >= 0),
  diperbarui_pada  timestamptz not null default now(),
  primary key (siswa_id, sub_materi)
);

create table public.penjelasan_siswa (
  id           uuid primary key default gen_random_uuid(),
  siswa_id     uuid not null references public.siswa (id),
  soal_id      uuid not null references public.soal (id),
  isi          text not null check (length(isi) between 1 and 500),
  dibuat_pada  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Login dan reset PIN (hanya service role / Edge Function)
-- ---------------------------------------------------------------------------
create table public.percobaan_masuk (
  id           bigint generated always as identity primary key,
  ip_hash      text,
  kode_hash    text,
  berhasil     boolean not null,
  dibuat_pada  timestamptz not null default now()
);

create table public.status_masuk (
  kode_hash        text primary key,
  gagal_berturut   smallint not null default 0 check (gagal_berturut between 0 and 5),
  terkunci_sampai  timestamptz,
  diperbarui_pada  timestamptz not null default now()
);

create table public.reset_pin (
  id                uuid primary key default gen_random_uuid(),
  siswa_id          uuid not null references public.siswa (id),
  token_hash        text not null unique,
  kedaluwarsa_pada  timestamptz not null,
  dipakai_pada      timestamptz,
  dibuat_oleh       text not null,
  dibuat_pada       timestamptz not null default now()
);
