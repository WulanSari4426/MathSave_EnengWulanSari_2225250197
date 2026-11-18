-- Pemeriksaan kecukupan bank soal kuis (KF-14, KF-21; task.md Fase 7). HANYA MEMBACA.
-- Jalankan di Supabase SQL Editor sebelum uji coba. Setiap baris harus berstatus "cukup",
-- agar siswa tidak mendapat BANK_SOAL_KURANG saat menekan Mulai Kuis.
select k.kategori_kuis,
       k.tingkat,
       k.bentuk,
       string_agg(k.nomor::text, ', ' order by k.nomor) as nomor_kisi_kisi,
       2 * count(*) as minimum,
       (select count(*) from public.soal s
         where s.bank = 'kuis' and s.aktif
           and s.kategori_kuis = k.kategori_kuis and s.tingkat = k.tingkat and s.bentuk = k.bentuk) as tersedia,
       case when (select count(*) from public.soal s
                   where s.bank = 'kuis' and s.aktif
                     and s.kategori_kuis = k.kategori_kuis and s.tingkat = k.tingkat and s.bentuk = k.bentuk)
                 >= 2 * count(*) then 'cukup' else 'KURANG' end as status
from public.kisi_kisi_kuis k
group by k.kategori_kuis, k.tingkat, k.bentuk
order by min(k.nomor);

-- Ringkasan bank latihan per sub-bab dan tingkat (5 soal per sesi latihan).
select sub_materi, tingkat, count(*) as jumlah
from public.soal
where bank = 'latihan' and aktif
group by sub_materi, tingkat
order by sub_materi, tingkat;
