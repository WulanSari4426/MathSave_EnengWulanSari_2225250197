-- MathSave — Fase 4: fungsi RPC siswa (api.md bagian 3.1–3.11).
-- Semua RPC: SECURITY DEFINER, search_path tetap, identitas dari auth.uid() (bukan parameter).
-- Galat dimunculkan dengan pesan berupa kode di api.md bagian 4.
-- Fungsi berawalan "_" dan tutup_sesi_kedaluwarsa adalah fungsi internal: tidak bisa dipanggil siswa.

-- ===========================================================================
-- Fungsi internal
-- ===========================================================================

create function public._galat(p_kode text, p_detail jsonb default null) returns void
language plpgsql as $$
begin
  if p_detail is null then
    raise exception using message = p_kode, errcode = 'P0001';
  end if;
  raise exception using message = p_kode, detail = p_detail::text, errcode = 'P0001';
end $$;

-- ID siswa yang sedang masuk. Gagal TIDAK_MASUK jika tidak ada sesi atau siswa nonaktif.
create function public._siswa_wajib() returns uuid
language plpgsql stable set search_path = public as $$
declare v_id uuid;
begin
  select id into v_id from public.siswa where auth_user_id = auth.uid() and aktif;
  if v_id is null then perform public._galat('TIDAK_MASUK'); end if;
  return v_id;
end $$;

-- Mengubah teks menjadi angka tanpa galat (kosong jika bukan angka).
create function public._ke_angka(p_teks text) returns numeric
language plpgsql immutable as $$
begin
  return p_teks::numeric;
exception when others then
  return null;
end $$;

-- Opsi pilihan ganda sesuai urutan sesi. p_dengan_kunci hanya true setelah kuis dikumpulkan.
create function public._opsi_tampil(p_opsi jsonb, p_urutan text[], p_dengan_kunci boolean) returns jsonb
language sql immutable as $$
  select jsonb_agg(
           jsonb_build_object('id', u.id, 'huruf', chr(64 + u.i::int), 'teks', o->>'teks')
           || case when p_dengan_kunci
                   then jsonb_build_object('kunci', coalesce((o->>'kunci')::boolean, false))
                   else '{}'::jsonb end
           order by u.i)
  from unnest(p_urutan) with ordinality as u(id, i)
  join jsonb_array_elements(p_opsi) o on o->>'id' = u.id
$$;

-- "Soal publik": tanpa jawaban, pembahasan, pola kesalahan, petunjuk, maupun kunci opsi (api.md 3.3).
create function public._soal_publik(p_soal public.soal, p_nomor smallint, p_urutan text[]) returns jsonb
language sql stable as $$
  select jsonb_build_object(
           'id', p_soal.id,
           'kode', p_soal.kode,
           'sub_materi', p_soal.sub_materi,
           'tingkat', p_soal.tingkat,
           'konteks', p_soal.konteks,
           'teks_soal', p_soal.teks_soal,
           'satuan_jawaban', p_soal.satuan_jawaban,
           'bentuk', p_soal.bentuk,
           'opsi', case when p_soal.bentuk = 'pilihan_ganda'
                        then public._opsi_tampil(p_soal.opsi, p_urutan, false) end)
         || case when p_nomor is null then '{}'::jsonb else jsonb_build_object('nomor', p_nomor) end
$$;

-- Menilai satu jawaban (api.md 3.6 "Proses"). Satu sumber penilaian untuk latihan dan kuis.
-- Hasil: { benar, jenis_kesalahan, pesan, jawaban_siswa }
create function public._nilai_jawaban(p_soal public.soal, p_jawaban numeric, p_opsi text) returns jsonb
language plpgsql stable as $$
declare
  v_benar boolean;
  v_jenis text;
  v_pesan text;
  v_nilai numeric;
  v_opsi jsonb;
begin
  if p_soal.bentuk = 'isian' then
    v_nilai := p_jawaban;
    -- Perbandingan numeric, bukan pecahan biner (KF-19).
    v_benar := abs(p_jawaban - p_soal.jawaban) <= p_soal.toleransi;
    if not v_benar then
      select pk->>'jenis', pk->>'pesan' into v_jenis, v_pesan
      from jsonb_array_elements(p_soal.pola_kesalahan) with ordinality as e(pk, i)
      where public._ke_angka(pk->>'nilai') is not null
        and abs(p_jawaban - public._ke_angka(pk->>'nilai')) <= p_soal.toleransi
      order by i limit 1;
    end if;
  else
    select o into v_opsi from jsonb_array_elements(p_soal.opsi) o where o->>'id' = p_opsi;
    v_nilai := public._ke_angka(v_opsi->>'nilai');
    v_benar := coalesce((v_opsi->>'kunci')::boolean, false);
    if not v_benar then
      v_jenis := nullif(v_opsi->>'jenis_kesalahan', '');
      select pk->>'pesan' into v_pesan
      from jsonb_array_elements(p_soal.pola_kesalahan) with ordinality as e(pk, i)
      where pk->>'jenis' = v_jenis
      order by i limit 1;
    end if;
  end if;

  if not v_benar and v_jenis is null then
    v_jenis := 'LAINNYA';
    v_pesan := null;
  end if;

  return jsonb_build_object(
    'benar', v_benar,
    'jenis_kesalahan', case when v_benar then null else v_jenis end,
    'pesan', case when v_benar then null else v_pesan end,
    'jawaban_siswa', v_nilai);
end $$;

-- Jawaban sah terakhir per soal dalam satu sesi: diterima server sebelum batas_waktu (KF-20, KF-22).
create function public._jawaban_akhir(p_sesi_kuis_id uuid)
returns table (soal_id uuid, jawaban_siswa numeric, opsi_dipilih text, benar boolean, jenis_kesalahan text)
language sql stable set search_path = public as $$
  select distinct on (pj.soal_id)
         pj.soal_id, pj.jawaban_siswa, pj.opsi_dipilih, pj.benar, pj.jenis_kesalahan
  from public.percobaan_jawaban pj
  join public.sesi_kuis s on s.id = pj.sesi_kuis_id
  where pj.sesi_kuis_id = p_sesi_kuis_id
    and pj.dibuat_pada < s.batas_waktu
  order by pj.soal_id, pj.urutan desc
$$;

-- Menutup satu sesi dan menghitung nilainya. Soal tidak dijawab = salah (F-07 aturan 6).
create function public._tutup_sesi(p_sesi_kuis_id uuid, p_cara text, p_selesai_pada timestamptz) returns void
language plpgsql set search_path = public as $$
declare v_benar int;
begin
  select count(*) into v_benar
  from public._jawaban_akhir(p_sesi_kuis_id) j
  join public.sesi_kuis_soal ks on ks.sesi_kuis_id = p_sesi_kuis_id and ks.soal_id = j.soal_id
  where j.benar;

  update public.sesi_kuis
     set selesai_pada = p_selesai_pada,
         cara_selesai = p_cara,
         jumlah_benar = v_benar,
         skor = round(100.0 * v_benar / 20)        -- 5 poin per soal (AS-08)
   where id = p_sesi_kuis_id and selesai_pada is null;
end $$;

-- Menutup sesi milik siswa yang batas waktunya sudah lewat (architecture.md bagian 6).
-- selesai_pada = batas_waktu, sehingga hasilnya sama dengan jika ditutup tepat waktu.
create function public.tutup_sesi_kedaluwarsa(p_siswa_id uuid) returns void
language plpgsql set search_path = public as $$
declare r record;
begin
  for r in
    select id, batas_waktu from public.sesi_kuis
    where siswa_id = p_siswa_id and selesai_pada is null and batas_waktu <= now()
    for update
  loop
    perform public._tutup_sesi(r.id, 'waktu_habis', r.batas_waktu);
  end loop;
end $$;

-- Ringkasan kesempatan kuis (KF-13).
create function public._ringkasan_percobaan(p_siswa_id uuid) returns jsonb
language sql stable set search_path = public as $$
  select jsonb_build_object(
           'maks', 2,
           'digunakan', count(*),
           'sisa', greatest(0, 2 - count(*)),
           'nilai_tertinggi', max(skor) filter (where selesai_pada is not null))
  from public.sesi_kuis where siswa_id = p_siswa_id
$$;

-- Isi sesi untuk dikerjakan atau dilanjutkan (api.md 3.7). Tanpa benar/salah.
create function public._paket_sesi(p_sesi_kuis_id uuid) returns jsonb
language sql stable set search_path = public as $$
  select jsonb_build_object(
           'sesi_kuis_id', s.id,
           'mulai_pada', s.mulai_pada,
           'batas_waktu', s.batas_waktu,
           'waktu_server', now(),
           'percobaan_ke', s.percobaan_ke,
           'maks_percobaan', 2,
           'soal', (select jsonb_agg(public._soal_publik(so, ks.nomor, ks.urutan_opsi) order by ks.nomor)
                    from public.sesi_kuis_soal ks join public.soal so on so.id = ks.soal_id
                    where ks.sesi_kuis_id = s.id),
           'jawaban_tersimpan', coalesce(
                    (select jsonb_agg(jsonb_build_object(
                              'soal_id', j.soal_id,
                              'jawaban', case when so.bentuk = 'isian' then j.jawaban_siswa end,
                              'opsi', j.opsi_dipilih))
                     from public._jawaban_akhir(s.id) j join public.soal so on so.id = j.soal_id),
                    '[]'::jsonb))
  from public.sesi_kuis s where s.id = p_sesi_kuis_id
$$;

-- Hasil kuis yang sudah dikumpulkan (api.md 3.8).
create function public._hasil_kuis(p_sesi_kuis_id uuid) returns jsonb
language plpgsql stable set search_path = public as $$
declare
  v_sesi public.sesi_kuis;
  v_rincian jsonb;
  v_ringkas jsonb;
begin
  select * into v_sesi from public.sesi_kuis where id = p_sesi_kuis_id;

  select jsonb_agg(baris order by nomor) into v_rincian
  from (
    select ks.nomor,
           jsonb_build_object(
             'nomor', ks.nomor,
             'soal_id', so.id,
             'bentuk', so.bentuk,
             'tingkat', so.tingkat,
             'kategori_kuis', so.kategori_kuis,
             'teks_soal', so.teks_soal,
             'opsi', case when so.bentuk = 'pilihan_ganda'
                          then public._opsi_tampil(so.opsi, ks.urutan_opsi, true) end,
             'opsi_dipilih', j.opsi_dipilih,
             'huruf_dipilih', case when j.opsi_dipilih is not null
                                   then chr(64 + array_position(ks.urutan_opsi, j.opsi_dipilih)) end,
             'jawaban_siswa', j.jawaban_siswa,
             'jawaban_benar', so.jawaban,
             'status', case when j.soal_id is null then 'tidak_dijawab'
                            when j.benar then 'benar' else 'salah' end,
             'jenis_kesalahan', case when j.soal_id is not null and not j.benar then j.jenis_kesalahan end,
             'pesan', case when j.soal_id is not null and not j.benar
                           then public._nilai_jawaban(so, j.jawaban_siswa, j.opsi_dipilih)->>'pesan' end,
             'pembahasan', so.pembahasan) as baris,
           (j.soal_id is null) as kosong,
           coalesce(j.benar, false) as benar
    from public.sesi_kuis_soal ks
    join public.soal so on so.id = ks.soal_id
    left join public._jawaban_akhir(p_sesi_kuis_id) j on j.soal_id = ks.soal_id
    where ks.sesi_kuis_id = p_sesi_kuis_id
  ) r;

  v_ringkas := public._ringkasan_percobaan(v_sesi.siswa_id);

  return jsonb_build_object(
    'sesi_kuis_id', v_sesi.id,
    'skor', v_sesi.skor,
    'percobaan_ke', v_sesi.percobaan_ke,
    'sisa_percobaan', v_ringkas->'sisa',
    'nilai_tertinggi', v_ringkas->'nilai_tertinggi',
    'jumlah_soal', 20,
    'jumlah_benar', v_sesi.jumlah_benar,
    'jumlah_salah', 20 - v_sesi.jumlah_benar,
    'jumlah_tidak_dijawab', (select count(*) from jsonb_array_elements(v_rincian) e
                             where e->>'status' = 'tidak_dijawab'),
    'nomor_salah', coalesce((select jsonb_agg((e->>'nomor')::int order by (e->>'nomor')::int)
                             from jsonb_array_elements(v_rincian) e
                             where e->>'status' <> 'benar'), '[]'::jsonb),
    'cara_selesai', v_sesi.cara_selesai,
    'selesai_pada', v_sesi.selesai_pada,
    'rincian', v_rincian);
end $$;

-- ===========================================================================
-- RPC untuk siswa
-- ===========================================================================

-- 3.1
create function public.ambil_profil() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v_id uuid := public._siswa_wajib();
begin
  return (select jsonb_build_object('nama_panggilan', nama_panggilan, 'kelas', kelas)
          from public.siswa where id = v_id);
end $$;

-- 3.2 Status "selesai" tidak bisa kembali menjadi "sedang".
create function public.simpan_kemajuan(p_sub_materi text, p_status text, p_kartu_terakhir smallint)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_id uuid := public._siswa_wajib();
begin
  if p_sub_materi is null or p_sub_materi not in ('P0','M1','M2','M3','M4','M5','M6')
     or p_status is null or p_status not in ('sedang','selesai')
     or p_kartu_terakhir is null or p_kartu_terakhir not between 0 and 200 then
    perform public._galat('INPUT_TIDAK_VALID');
  end if;

  insert into public.kemajuan_materi as k (siswa_id, sub_materi, status, kartu_terakhir, diperbarui_pada)
  values (v_id, p_sub_materi, p_status, p_kartu_terakhir, now())
  on conflict (siswa_id, sub_materi) do update
    set status = case when k.status = 'selesai' then 'selesai' else excluded.status end,
        kartu_terakhir = excluded.kartu_terakhir,
        diperbarui_pada = now();

  return jsonb_build_object('ok', true);
end $$;

-- 3.3 Hanya bank latihan (KF-14 S2). Soal yang sudah dijawab benar diletakkan di akhir.
create function public.ambil_soal_latihan(p_sub_materi text, p_tingkat smallint, p_jumlah smallint default 5)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v_id uuid := public._siswa_wajib();
begin
  if p_sub_materi is null or p_sub_materi not in ('P0','M1','M2','M3','M4','M5','M6')
     or p_tingkat is null or p_tingkat not between 1 and 3
     or p_jumlah is null or p_jumlah not between 1 and 20 then
    perform public._galat('INPUT_TIDAK_VALID');
  end if;

  return coalesce((
    select jsonb_agg(public._soal_publik(t.s, null, null) order by t.urut)
    from (
      select so as s,
             row_number() over (order by
               exists (select 1 from public.percobaan_jawaban pj
                       where pj.siswa_id = v_id and pj.soal_id = so.id
                         and pj.sesi_kuis_id is null and pj.benar),
               random()) as urut
      from public.soal so
      where so.bank = 'latihan' and so.aktif
        and so.sub_materi = p_sub_materi and so.tingkat = p_tingkat
    ) t
    where t.urut <= p_jumlah), '[]'::jsonb);
end $$;

-- 3.4 Panel "Pahami Soal". Tidak disimpan dan tidak memengaruhi nilai.
create function public.periksa_pemahaman(p_soal_id uuid, p_diketahui jsonb, p_ditanya text)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_id uuid := public._siswa_wajib();
  v_soal public.soal;
  v_isian jsonb := coalesce(p_diketahui, '{}'::jsonb);
  v_rincian jsonb := '{}'::jsonb;
  v_pesan text;
  v_kunci text;
  v_tepat boolean;
  v_urutan text[] := array['modal','suku_bunga','lama','satuan_lama','bunga','tabungan_akhir'];
begin
  if jsonb_typeof(v_isian) <> 'object' then perform public._galat('INPUT_TIDAK_VALID'); end if;

  select * into v_soal from public.soal where id = p_soal_id and bank = 'latihan' and aktif;
  if v_soal.id is null then perform public._galat('SOAL_TIDAK_DITEMUKAN'); end if;

  for v_kunci in
    select k from jsonb_object_keys(v_soal.diketahui) k
    order by coalesce(array_position(v_urutan, k), 99), k
  loop
    if v_kunci = 'satuan_lama' then
      v_tepat := lower(trim(coalesce(v_isian->>v_kunci, ''))) = lower(v_soal.diketahui->>v_kunci);
    else
      v_tepat := coalesce(public._ke_angka(v_isian->>v_kunci) = public._ke_angka(v_soal.diketahui->>v_kunci), false);
    end if;
    v_rincian := v_rincian || jsonb_build_object(v_kunci, v_tepat);
    if not v_tepat and v_pesan is null then
      v_pesan := 'Periksa lagi ' || case v_kunci
                   when 'modal' then 'modal awal'
                   when 'suku_bunga' then 'suku bunga'
                   when 'lama' then 'lama menabung'
                   when 'satuan_lama' then 'satuan lama menabung'
                   when 'bunga' then 'besar bunga'
                   when 'tabungan_akhir' then 'tabungan akhir'
                   else 'data' end || ' pada soal.';
    end if;
  end loop;

  v_tepat := coalesce(p_ditanya = v_soal.ditanya, false);
  v_rincian := v_rincian || jsonb_build_object('ditanya', v_tepat);
  if not v_tepat and v_pesan is null then
    v_pesan := 'Periksa lagi apa yang ditanyakan soal.';
  end if;

  return jsonb_build_object(
    'semua_tepat', v_pesan is null,
    'rincian', v_rincian,
    'pesan', coalesce(v_pesan, 'Sudah tepat. Lanjutkan ke langkah berikutnya.'));
end $$;

-- 3.5 Petunjuk bertahap, hanya bank latihan (KF-15).
create function public.ambil_petunjuk(p_soal_id uuid, p_level smallint) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_id uuid := public._siswa_wajib();
  v_soal public.soal;
begin
  if p_level is null or p_level not between 1 and 3 then
    perform public._galat('INPUT_TIDAK_VALID');
  end if;

  select * into v_soal from public.soal where id = p_soal_id and aktif;
  if v_soal.id is null then perform public._galat('SOAL_TIDAK_DITEMUKAN'); end if;

  if v_soal.bank = 'kuis' then
    -- H8: soal yang sedang dikerjakan di kuis berjalan → PETUNJUK_TIDAK_TERSEDIA.
    if exists (select 1 from public.sesi_kuis_soal ks
               join public.sesi_kuis s on s.id = ks.sesi_kuis_id
               where ks.soal_id = v_soal.id and s.siswa_id = v_id
                 and s.selesai_pada is null and s.batas_waktu > now()) then
      perform public._galat('PETUNJUK_TIDAK_TERSEDIA');
    end if;
    perform public._galat('SOAL_TIDAK_DITEMUKAN');
  end if;

  return jsonb_build_object(
    'level', p_level,
    'langkah', (array['Pahami','Rencanakan','Hitung'])[p_level],
    'teks', v_soal.petunjuk->>(p_level - 1),
    'sorotan', case when p_level = 1 then v_soal.sorotan end,
    'level_maks', 3);
end $$;

-- 3.6 Memeriksa jawaban latihan, atau menyimpan jawaban kuis.
create function public.periksa_jawaban(
  p_soal_id uuid,
  p_jawaban numeric,
  p_jumlah_petunjuk smallint,
  p_durasi_detik integer,
  p_sesi_kuis_id uuid,
  p_opsi text default null)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid := public._siswa_wajib();
  v_soal public.soal;
  v_sesi public.sesi_kuis;
  v_hasil jsonb;
  v_salah int;
begin
  if p_soal_id is null then perform public._galat('INPUT_TIDAK_VALID'); end if;

  if p_sesi_kuis_id is null then
    -- Mode latihan: hanya bank latihan (KF-14).
    select * into v_soal from public.soal where id = p_soal_id and bank = 'latihan' and aktif;
    if v_soal.id is null then perform public._galat('SOAL_TIDAK_DITEMUKAN'); end if;
  else
    -- Mode kuis: sesi milik siswa, lalu tutup sesi kedaluwarsa (architecture.md bagian 6).
    select * into v_sesi from public.sesi_kuis where id = p_sesi_kuis_id and siswa_id = v_id;
    if v_sesi.id is null then perform public._galat('SESI_TIDAK_VALID'); end if;

    perform public.tutup_sesi_kedaluwarsa(v_id);
    -- Kunci baris sesi agar tidak bentrok dengan selesaikan_kuis.
    select * into v_sesi from public.sesi_kuis where id = p_sesi_kuis_id for share;

    if now() >= v_sesi.batas_waktu then perform public._galat('WAKTU_HABIS'); end if;
    if v_sesi.selesai_pada is not null then perform public._galat('KUIS_SUDAH_SELESAI'); end if;

    select so.* into v_soal from public.soal so
    join public.sesi_kuis_soal ks on ks.soal_id = so.id and ks.sesi_kuis_id = v_sesi.id
    where so.id = p_soal_id;
    if v_soal.id is null then perform public._galat('SOAL_TIDAK_DITEMUKAN'); end if;
  end if;

  -- Tepat satu dari p_jawaban / p_opsi sesuai bentuk soal.
  if v_soal.bentuk = 'isian' then
    if p_jawaban is null or p_opsi is not null then perform public._galat('INPUT_TIDAK_VALID'); end if;
  else
    if p_opsi is null or p_jawaban is not null then perform public._galat('INPUT_TIDAK_VALID'); end if;
    if not exists (select 1 from jsonb_array_elements(v_soal.opsi) o where o->>'id' = p_opsi) then
      perform public._galat('OPSI_TIDAK_VALID');
    end if;
  end if;

  if coalesce(p_jumlah_petunjuk, 0) not between 0 and 3
     or coalesce(p_durasi_detik, 0) < 0 then
    perform public._galat('INPUT_TIDAK_VALID');
  end if;

  v_hasil := public._nilai_jawaban(v_soal, p_jawaban, p_opsi);

  insert into public.percobaan_jawaban
    (siswa_id, soal_id, sesi_kuis_id, jawaban_siswa, opsi_dipilih, benar, jenis_kesalahan,
     jumlah_petunjuk, durasi_detik)
  values
    (v_id, v_soal.id, p_sesi_kuis_id, (v_hasil->>'jawaban_siswa')::numeric, p_opsi,
     (v_hasil->>'benar')::boolean, v_hasil->>'jenis_kesalahan',
     case when p_sesi_kuis_id is null then coalesce(p_jumlah_petunjuk, 0) else 0 end,
     coalesce(p_durasi_detik, 0));

  if p_sesi_kuis_id is not null then
    -- Kuis: benar/salah, kunci, dan pembahasan tidak dikirim sebelum dikumpulkan.
    return jsonb_build_object('tersimpan', true);
  end if;

  select count(*) into v_salah from public.percobaan_jawaban
  where siswa_id = v_id and soal_id = v_soal.id and sesi_kuis_id is null and not benar;

  return jsonb_build_object(
    'benar', (v_hasil->>'benar')::boolean,
    'jenis_kesalahan', v_hasil->'jenis_kesalahan',
    'pesan', v_hasil->'pesan',
    'jumlah_salah_soal_ini', v_salah,
    'pembahasan', v_soal.pembahasan);    -- selalu diisi di latihan (KF-15 H9)
end $$;

-- 3.7 Memulai atau melanjutkan kuis (KF-11, KF-13, KF-14, KF-18, KF-21).
create function public.mulai_kuis() returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid := public._siswa_wajib();
  v_sesi_id uuid;
  v_jumlah int;
  v_kurang jsonb;
  v_kosong int[] := '{}';
  v_kisi record;
  v_soal public.soal;
begin
  -- Permintaan bersamaan dari siswa yang sama dijalankan bergantian.
  perform 1 from public.siswa where id = v_id for update;

  perform public.tutup_sesi_kedaluwarsa(v_id);

  -- 1. Sesi yang masih berjalan dilanjutkan tanpa mengubah waktu (KF-11).
  select id into v_sesi_id from public.sesi_kuis
  where siswa_id = v_id and selesai_pada is null;
  if v_sesi_id is not null then
    return public._paket_sesi(v_sesi_id);
  end if;

  -- 2. Batas 2 percobaan (KF-13).
  select count(*) into v_jumlah from public.sesi_kuis where siswa_id = v_id;
  if v_jumlah >= 2 then perform public._galat('BATAS_PERCOBAAN_KUIS'); end if;

  -- 3. Kecukupan bank kuis: minimal 2 × jumlah nomor per kombinasi (KF-14 B1).
  select jsonb_agg(jsonb_build_object(
           'kategori_kuis', k.kategori_kuis, 'tingkat', k.tingkat, 'bentuk', k.bentuk,
           'tersedia', k.tersedia, 'minimum', k.minimum)
         order by k.kategori_kuis, k.tingkat, k.bentuk)
    into v_kurang
  from (
    select g.kategori_kuis, g.tingkat, g.bentuk, 2 * g.n as minimum,
           (select count(*) from public.soal so
             where so.bank = 'kuis' and so.aktif and so.kategori_kuis = g.kategori_kuis
               and so.tingkat = g.tingkat and so.bentuk = g.bentuk) as tersedia
    from (select kategori_kuis, tingkat, bentuk, count(*) as n
          from public.kisi_kisi_kuis group by 1, 2, 3) g
  ) k
  where k.tersedia < k.minimum;

  if v_kurang is not null then
    perform public._galat('BANK_SOAL_KURANG', jsonb_build_object('kombinasi_kurang', v_kurang));
  end if;

  -- 4. Buat sesi lalu pilih soal per nomor kisi-kisi (KF-21). Satu transaksi:
  --    jika satu nomor gagal, semuanya dibatalkan dan percobaan tidak terhitung (KF-13 P4).
  insert into public.sesi_kuis (siswa_id, percobaan_ke, mulai_pada, batas_waktu)
  values (v_id, v_jumlah + 1, now(), now() + interval '30 minutes')
  returning id into v_sesi_id;

  for v_kisi in select * from public.kisi_kisi_kuis order by nomor loop
    select so.* into v_soal
    from public.soal so
    where so.bank = 'kuis' and so.aktif
      and so.kategori_kuis = v_kisi.kategori_kuis
      and so.tingkat = v_kisi.tingkat
      and so.bentuk = v_kisi.bentuk
      -- Belum pernah diterima siswa ini, termasuk di nomor lain sesi ini (KF-14).
      and not exists (select 1 from public.sesi_kuis_soal ks
                      where ks.siswa_id = v_id and ks.soal_id = so.id)
    order by random()
    limit 1;

    if v_soal.id is null then
      v_kosong := v_kosong || v_kisi.nomor::int;
      continue;
    end if;

    insert into public.sesi_kuis_soal (sesi_kuis_id, siswa_id, nomor, soal_id, urutan_opsi)
    values (v_sesi_id, v_id, v_kisi.nomor, v_soal.id,
            case when v_soal.bentuk = 'pilihan_ganda' then
              (select array_agg(o->>'id' order by random()) from jsonb_array_elements(v_soal.opsi) o)
            end);
    v_soal := null;
  end loop;

  if cardinality(v_kosong) > 0 then
    perform public._galat('BANK_SOAL_KURANG', jsonb_build_object('nomor_kosong', to_jsonb(v_kosong)));
  end if;

  return public._paket_sesi(v_sesi_id);
end $$;

-- 3.7a Status kuis saat aplikasi dibuka. Tidak membuat sesi baru.
create function public.status_kuis() returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid := public._siswa_wajib();
  v_aktif uuid;
  v_otomatis jsonb;
begin
  perform public.tutup_sesi_kedaluwarsa(v_id);

  select id into v_aktif from public.sesi_kuis where siswa_id = v_id and selesai_pada is null;

  select jsonb_build_object('sesi_kuis_id', id, 'skor', skor, 'selesai_pada', selesai_pada)
    into v_otomatis
  from public.sesi_kuis
  where siswa_id = v_id and cara_selesai = 'waktu_habis' and not hasil_dilihat
  order by selesai_pada desc limit 1;

  return jsonb_build_object(
    'waktu_server', now(),
    'sesi_aktif', case when v_aktif is not null then public._paket_sesi(v_aktif) end,
    'dikumpulkan_otomatis', v_otomatis,
    'percobaan', public._ringkasan_percobaan(v_id));
end $$;

-- 3.8 Mengumpulkan kuis. Aman dipanggil berkali-kali; juga untuk membuka ulang hasil.
create function public.selesaikan_kuis(p_sesi_kuis_id uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid := public._siswa_wajib();
  v_sesi public.sesi_kuis;
begin
  select * into v_sesi from public.sesi_kuis
  where id = p_sesi_kuis_id and siswa_id = v_id
  for update;
  if v_sesi.id is null then perform public._galat('SESI_TIDAK_VALID'); end if;

  if v_sesi.selesai_pada is null then
    if now() < v_sesi.batas_waktu then
      perform public._tutup_sesi(v_sesi.id, 'siswa', now());
    else
      perform public._tutup_sesi(v_sesi.id, 'waktu_habis', v_sesi.batas_waktu);
    end if;
  end if;

  update public.sesi_kuis set hasil_dilihat = true where id = v_sesi.id;

  return public._hasil_kuis(v_sesi.id);
end $$;

-- 3.9 Ringkasan untuk Beranda.
create function public.ringkasan_kemajuan() returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid := public._siswa_wajib();
  v_urutan text[] := array['P0','M1','M2','M3','M4','M5','M6'];
  v_ringkas jsonb;
begin
  perform public.tutup_sesi_kedaluwarsa(v_id);
  v_ringkas := public._ringkasan_percobaan(v_id);

  return jsonb_build_object(
    'sub_materi_selesai',
      (select count(*) from public.kemajuan_materi where siswa_id = v_id and status = 'selesai'),
    'total_sub_materi', cardinality(v_urutan),
    'sub_materi_lanjut',
      (select u.sm from unnest(v_urutan) with ordinality as u(sm, i)
       where not exists (select 1 from public.kemajuan_materi k
                         where k.siswa_id = v_id and k.sub_materi = u.sm and k.status = 'selesai')
       order by u.i limit 1),
    'kuis', jsonb_build_object(
      'nilai_tertinggi', v_ringkas->'nilai_tertinggi',
      'percobaan', coalesce((
        select jsonb_agg(jsonb_build_object(
                 'percobaan_ke', percobaan_ke, 'skor', skor,
                 'selesai_pada', selesai_pada, 'sesi_kuis_id', id) order by percobaan_ke)
        from public.sesi_kuis where siswa_id = v_id and selesai_pada is not null), '[]'::jsonb),
      'sisa_percobaan', v_ringkas->'sisa'),
    'kesalahan_tersering', coalesce((
      select jsonb_agg(jsonb_build_object(
               'jenis', jenis, 'jumlah', jumlah,
               'sub_materi_terkait', case jenis
                   when 'SATUAN_WAKTU' then 'M3'
                   when 'PERSEN' then 'P0'
                   when 'TERTUKAR_BUNGA_TABUNGAN' then 'M4'
                   when 'RUMUS_INVERS' then 'M5' end)
             order by jumlah desc, jenis)
      from (
        select jenis, count(*) as jumlah
        from (
          -- Latihan 30 hari terakhir
          select pj.jenis_kesalahan as jenis
          from public.percobaan_jawaban pj
          where pj.siswa_id = v_id and pj.sesi_kuis_id is null and not pj.benar
            and pj.dibuat_pada >= now() - interval '30 days'
          union all
          -- Kuis yang sudah dikumpulkan: hanya jawaban akhir yang dinilai
          select j.jenis_kesalahan
          from public.sesi_kuis s
          cross join lateral public._jawaban_akhir(s.id) j
          where s.siswa_id = v_id and s.selesai_pada is not null
            and s.selesai_pada >= now() - interval '30 days' and not j.benar
        ) semua
        where jenis is not null and jenis <> 'LAINNYA'
        group by jenis
        order by count(*) desc, jenis
        limit 3
      ) t), '[]'::jsonb));
end $$;

-- 3.10 Riwayat belajar. Latihan dikelompokkan per sub-bab, tingkat, dan hari (WIB).
create function public.riwayat_belajar(p_batas smallint default 20, p_sebelum timestamptz default null)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_id uuid := public._siswa_wajib();
begin
  if p_batas is null or p_batas not between 1 and 50 then
    perform public._galat('INPUT_TIDAK_VALID');
  end if;

  perform public.tutup_sesi_kedaluwarsa(v_id);

  return coalesce((
    select jsonb_agg(isi order by waktu desc)
    from (
      select isi, waktu from (
        select s.selesai_pada as waktu,
               jsonb_build_object('jenis', 'kuis', 'waktu', s.selesai_pada, 'skor', s.skor,
                                  'percobaan_ke', s.percobaan_ke, 'cara_selesai', s.cara_selesai,
                                  'sesi_kuis_id', s.id) as isi
        from public.sesi_kuis s
        where s.siswa_id = v_id and s.selesai_pada is not null
        union all
        select max(pj.dibuat_pada),
               jsonb_build_object('jenis', 'latihan', 'waktu', max(pj.dibuat_pada),
                                  'sub_materi', so.sub_materi, 'tingkat', so.tingkat,
                                  'benar', count(*) filter (where pj.benar), 'jumlah', count(*))
        from public.percobaan_jawaban pj
        join public.soal so on so.id = pj.soal_id
        where pj.siswa_id = v_id and pj.sesi_kuis_id is null
        group by so.sub_materi, so.tingkat, (pj.dibuat_pada at time zone 'Asia/Jakarta')::date
      ) semua
      where p_sebelum is null or waktu < p_sebelum
      order by waktu desc
      limit p_batas
    ) t), '[]'::jsonb);
end $$;

-- 3.11 Penjelasan siswa (F-11). Hanya untuk soal yang pernah dijawab benar di latihan
-- atau di kuis yang SUDAH dikumpulkan (agar tidak membocorkan kunci selama kuis).
create function public.simpan_penjelasan(p_soal_id uuid, p_isi text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_id uuid := public._siswa_wajib();
begin
  if p_isi is null or length(trim(p_isi)) = 0 or length(p_isi) > 500 then
    perform public._galat('INPUT_TIDAK_VALID');
  end if;
  if not exists (select 1 from public.soal where id = p_soal_id) then
    perform public._galat('SOAL_TIDAK_DITEMUKAN');
  end if;
  if not exists (
       select 1 from public.percobaan_jawaban pj
       left join public.sesi_kuis s on s.id = pj.sesi_kuis_id
       where pj.siswa_id = v_id and pj.soal_id = p_soal_id and pj.benar
         and (pj.sesi_kuis_id is null or s.selesai_pada is not null)) then
    perform public._galat('INPUT_TIDAK_VALID');
  end if;

  insert into public.penjelasan_siswa (siswa_id, soal_id, isi) values (v_id, p_soal_id, trim(p_isi));
  return jsonb_build_object('ok', true);
end $$;

-- ===========================================================================
-- Hak eksekusi: hanya RPC siswa untuk authenticated. Fungsi internal tertutup.
-- (Hak EXECUTE bawaan PUBLIC tidak bisa dicabut lewat default privileges per schema,
--  jadi dicabut eksplisit di sini.)
-- ===========================================================================
revoke all on all functions in schema public from public, anon, authenticated;

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
