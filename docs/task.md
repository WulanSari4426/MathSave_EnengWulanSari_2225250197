# Daftar Tugas — Lanora

> **Catatan nama:** Lanora sebelumnya bernama **MathSave** (nama diganti 12 November 2026). Wawancara, keputusan, dan dokumen sebelum tanggal itu memakai nama MathSave. Pengenal teknis lama sengaja tidak diubah agar akun dan data siswa tetap aman: domain email internal `siswa.mathsave.invalid` dan `penilai.mathsave.invalid`, nama paket npm `mathsave`, kunci `mathsave:pesan-singkat`, komentar di file migrasi, dan nama folder proyek.

Rencana pengerjaan per fase. Kode fitur (F-xx), kebutuhan (KB-xx, NF-xx), dan konfirmasi (KF-xx) mengacu ke [PRD.md](PRD.md).

Tanda: `[ ]` belum, `[x]` selesai.

---

## Fase 0 — Analisis dan Perencanaan

- [x] Membaca dan menganalisis hasil wawancara (`referensi/HASIL WAWANCARA ALPRO.docx`)
- [x] Menyusun analisis kebutuhan berdasarkan Cognitive Load Theory
- [x] Menyusun dokumen: PRD, README, AGENTS, architecture, design, api, task
- [x] Memeriksa ketentuan paket Free Supabase (11 November 2026)

## Fase 1 — Konfirmasi (sebelum coding)

- [x] KF-01: Hosting frontend — **diputuskan 12 November 2026: Netlify Free** ($0, 300 credits per bulan dengan hard limit), terhubung ke GitHub; build `npm run build`, publish `dist`; database dan Auth tetap di Supabase. Ketentuan paket gratis sudah diperiksa di halaman resmi pada 12 November 2026 (architecture.md bagian 7).
- [x] KF-02: **Diputuskan 12 November 2026: 1 tahun = 365 hari** (dasar kalender). Asumsi sementara menjadi keputusan resmi.
- [x] KF-03: Notasi dan istilah — **diputuskan 12 November 2026**: M = modal awal, B = besar bunga, p = suku bunga per tahun, t = lama menabung (tahun), A = jumlah tabungan akhir; B = M × (p/100) × t dan A = M + B (PRD F-02 "Notasi dan istilah resmi")
- [ ] KF-04: Posisi materi dalam kurikulum sekolah
- [x] KF-05: Login — **diputuskan 12 November 2026: Kode Siswa + PIN** (kode unik, PIN per siswa, dibagikan peneliti, tanpa email pribadi, PIN di-hash, pesan gagal tidak membocorkan informasi, data per akun)
- [x] KF-05b: batas percobaan login diputuskan (5 kali gagal per akun → kunci 5 menit)
- [x] Detail KF-05b dikonfirmasi 12 November 2026: penghitungan berurutan, kembali 0 setelah berhasil atau setelah kunci berakhir, kunci mulai pada kegagalan ke-5 (K7–K10). Risiko penguncian sengaja diterima sementara (RS-01).
- [x] KF-05c: lupa PIN — **diputuskan 12 November 2026**: reset dibantu guru/peneliti, siswa membuat PIN baru sendiri, akun dan data tetap, tanpa fitur lupa PIN mandiri
- [x] KF-05d: format kode — **diputuskan 12 November 2026**: kode kelas `230706` (hanya pendaftaran pertama), kode siswa `S001`, `S002`, … dari peneliti, PIN dibuat siswa saat pendaftaran pertama (menggantikan bagian PIN di L3), pendaftaran didampingi peneliti, risiko RS-02 dicatat, repositori GitHub wajib privat
- [x] KF-05a: format PIN — **diputuskan 12 November 2026**: tepat 6 digit angka, dibuat siswa saat pendaftaran pertama, diketik dua kali, ≠ kode kelas `230706`, tersamar, disimpan sesuai L6
- [x] KF-05e: pretest/posttest — **diputuskan 12 November 2026**: dikerjakan di dalam Lanora, memakai 4 soal Mathematical Literacy (tugas Pak Aan) dengan 4 indikator, skor maksimal 6 per soal (total 24), pretest sebelum dan posttest setelah pembelajaran, terpisah dari bank latihan/kuis, dan hasil dapat dibedakan. Rincian di PRD F-12.
- [x] PP-01 s.d. PP-10: detail pretest/posttest — **diputuskan 12 November 2026** (sumber soal, kesamaan soal, satu kesempatan, tanpa batas waktu, penilaian per tahapan rubrik, tampilan hasil, penilaian otomatis, jawaban per tahapan, variasi penulisan, akses data). Lihat PRD F-12.
- [x] PT-03: penilaian tahapan uraian — **diputuskan 12 November 2026: Pilihan A** (gabungan otomatis + manual oleh peneliti/guru)
- [x] PT-08: pelaksanaan penilaian manual — **diputuskan 12 November 2026** (halaman khusus, peneliti/guru, "Sedang dinilai", koreksi tercatat, satu penilai)
- [ ] PT-01, PT-02, PT-04 s.d. PT-07, PT-09 s.d. PT-13: pertanyaan teknis pretest/posttest yang tersisa (file instrumen, rincian rubrik, toleransi, bentuk setara, skor lanjutan, skor sebagian, urutan pelaksanaan, konfirmasi/offline, identitas CSV, angka ambigu, rincian skor untuk siswa). PT-03, PT-08, dan PT-14 s.d. PT-24 sudah diputuskan. Lihat PRD F-12.
- [ ] KF-06: Izin penggunaan data siswa untuk uji coba
- [ ] KF-07: Jumlah siswa dan kelas uji coba
- [ ] KF-08: Perlu atau tidaknya informan wawancara tambahan
- [ ] KF-09: Aturan pembulatan hasil
- [x] KF-10: Bentuk jawaban kuis — **diputuskan 11 November 2026**: 20 soal = 15 pilihan ganda + 5 isian angka, isian dinilai dengan toleransi
- [x] KF-11: Perilaku timer — **diputuskan 11 November 2026**: timer tetap berjalan saat aplikasi ditutup atau offline, bisa dilanjutkan selama waktu tersisa, dikumpulkan otomatis berdasarkan waktu server, tidak diulang
- [x] KF-12: Komposisi kuis — **diputuskan 11 November 2026**: tingkat mudah 6 / sedang 10 / sulit 4; submateri konsep 3 / besar bunga 5 / tabungan akhir 4 / modal atau suku bunga 4 / lama menabung 2 / penerapan 2; bentuk 15 pilihan ganda + 5 isian
- [x] KF-13: Pengulangan kuis — **diputuskan 12 November 2026**: maksimal 2 percobaan, percobaan dihitung sejak kuis berhasil dimulai (termasuk jika keluar, offline, atau waktu habis), kedua hasil disimpan, nilai utama = nilai tertinggi, percobaan ketiga ditolak
- [x] KF-14: Bank soal kuis — **diputuskan 12 November 2026**: minimal 40 soal berbeda, percobaan 1 dan 2 masing-masing 20 soal tanpa soal yang sama untuk siswa yang sama, keduanya mengikuti kisi-kisi KF-21, kuis tidak dimulai jika bank kurang. **Tambahan:** bank soal latihan dan kuis terpisah; latihan tidak memengaruhi bank kuis.
- [x] KF-15: Petunjuk dan pembahasan — **diputuskan 12 November 2026**: petunjuk hanya di latihan, maksimal 3 tingkat (diketahui/ditanya, rumus/konsep, langkah awal), tanpa jawaban akhir, tidak tersedia di kuis; pembahasan lengkap setelah jawaban latihan diperiksa
- [x] KF-22 *(sebelumnya KF-15)*: Berpindah nomor dan mengubah jawaban — **diputuskan 12 November 2026 (N1 + R1)**: bebas berpindah (Sebelumnya/Berikutnya + panel nomor), boleh mengubah jawaban sampai dikumpulkan, jawaban terakhir yang diterima server dinilai, tanpa tanda ragu-ragu
- [x] KF-16: Konfirmasi dan pengingat — **diputuskan 12 November 2026 (A1 + B1)**: dialog konfirmasi selalu muncul saat Selesai Kuis (jumlah dan nomor soal kosong, jawaban belum terkirim); satu pengingat tenang saat sisa 5 menit
- [x] KF-17: Keluar di tengah kuis — **diputuskan 12 November 2026 (C1, keluar sementara)**: ✕ dan tombol kembali Android memunculkan dialog; keluar tidak mengumpulkan kuis dan tidak menghentikan timer; kuis bisa dilanjutkan selama waktu tersisa
- [x] KF-18: Opsi pilihan ganda — **diputuskan 12 November 2026 (D1 + E1)**: 4 opsi A–D dengan 1 kunci; urutan opsi diacak per siswa saat sesi dibuat lalu dikunci; jawaban disimpan dengan ID opsi tetap
- [x] KF-19: Toleransi isian angka — **diputuskan 12 November 2026 (F1 + G1)**: Rupiah ±1, persen ±0,01, waktu ±0,01; kunci jawaban isian harus rapi (Rupiah bulat, persen ≤ 1 desimal, lama menabung bulat)
- [x] KF-20: Jawaban offline — **diputuskan 11 November 2026, Pilihan A (aturan ketat)**: jawaban sah hanya jika diterima server sebelum batas waktu, jawaban offline yang terlambat ditolak, jam perangkat tidak dipakai
- [x] KF-21: Kisi-kisi kuis — **diputuskan 11 November 2026**: kisi-kisi tetap 20 nomor (submateri, tingkat, bentuk per nomor), tanpa penggantian kategori otomatis
- [ ] Memperbarui dokumen jika ada jawaban konfirmasi yang mengubah rancangan

## Fase 2 — Persiapan Proyek

- [x] Membuat proyek Vite (JavaScript biasa), struktur folder sesuai [architecture.md](architecture.md) bagian 3
- [x] Memasang `@supabase/supabase-js`, `three`, dan `vitest` dengan versi dipatok tepat
- [x] Membuat `.env.example` dan memastikan `.env` ada di `.gitignore`
- [x] Membuat `src/gaya/utama.css` berisi token warna dan tipografi dari [design.md](design.md)
- [x] Membuat router hash dan kerangka 4 menu navigasi bawah
- [ ] Uji buka di ponsel Android asli (Chrome) dan berpindah antarmenu

**Selesai jika:** aplikasi kosong bisa dibuka di Chrome Android dan berpindah antarmenu.

> Catatan verifikasi (11 November 2026): `npm run dev` berjalan tanpa galat, `npm test` lulus (9 tes router), `npm run build` berhasil. Tampilan sudah diperiksa di peramban Edge mode tanpa layar pada lebar 360 px dan 412 px. Uji di ponsel Android asli **belum** dilakukan.

## Fase 3 — Logika Matematika (F-03, F-04, F-09)

- [x] `bungaTunggal.js`: `keTahun`, `hitungBunga`, `hitungTabunganAkhir`, `cariModal`, `cariSukuBunga`, `cariLama`, `tabelPertumbuhan`
- [x] `parserAngka.js`: `uraiAngka`, `formatRupiah`, `formatAngka`
- [x] `diagnosis.js`: `hitungPolaKesalahan`
- [x] Tes Vitest untuk semua fungsi di atas, termasuk contoh di [api.md](api.md) bagian 5.3

**Selesai jika:** semua tes lulus. Contoh M = 2.000.000, p = 6%, 8 bulan menghasilkan B = 80.000 dan pola `SATUAN_WAKTU` = 960.000.

> Catatan verifikasi (11 November 2026): 86 tes lulus (77 tes logika + 9 tes router), `npm run build` berhasil. Nilai 365 hari per tahun (KF-02) dan pembulatan ke rupiah terdekat saat tampil (KF-09) masih **asumsi sementara** dan belum dikonfirmasi.
>
> Pembaruan 12 November 2026: KF-02 sudah diputuskan (1 tahun = 365 hari). Nilai di kode sudah sesuai, sehingga tes Fase 3 tidak perlu diulang. KF-09 masih terbuka.

## Fase 4 — Database Supabase

- [ ] Membuat proyek Supabase (paket Free) — dilakukan pengembang dengan akunnya
- [x] Migrasi tabel: `siswa`, `soal`, `percobaan_jawaban`, `sesi_kuis`, `kemajuan_materi`, `penjelasan_siswa`, `percobaan_masuk`, `status_masuk` (penguncian login per akun, KF-05b), `reset_pin` (kode reset sementara, KF-05c), `kisi_kisi_kuis` (berisi 20 baris kisi-kisi KF-21), `sesi_kuis_soal` (dengan `UNIQUE (siswa_id, soal_id)`, KF-14). Tabel `soal` memakai kolom `bank` (`latihan`/`kuis`) beserta batasan `CHECK` pemisahan bank (KF-14), bukan `untuk_kuis`. → `supabase/migrations/20261112000001_skema_dasar.sql`
- [x] Mengaktifkan RLS dan kebijakan sesuai [architecture.md](architecture.md) bagian 6 → `20261112000002_rls_dan_hak_akses.sql`
- [x] Mencabut akses `anon` ke semua tabel dan fungsi
- [x] Menulis fungsi RPC siswa sesuai [api.md](api.md) bagian 3.1–3.11, termasuk fungsi internal `tutup_sesi_kedaluwarsa` → `20261112000003_rpc_siswa.sql`. RPC pretest/posttest dan penilai (3.12–3.13) dikerjakan di Fase 12A, karena menunggu PT-01.
- [x] Tes database Vitest dengan PGlite (`tests/db/`): RLS, hak akses `anon`/siswa, batasan tabel `soal`, kisi-kisi, dan semua RPC 3.1–3.11
- [ ] Menjalankan ketiga migrasi di proyek Supabase asli (SQL Editor atau Supabase CLI), lalu mengulang pemeriksaan "Selesai jika" di bawah dengan dua akun siswa sungguhan
- [ ] Menguji permintaan bersamaan di Supabase asli (dua `mulai_kuis` sekaligus, `periksa_jawaban` bersamaan dengan `selesaikan_kuis`). PGlite hanya punya satu koneksi, jadi penguncian baris belum teruji.

**Selesai jika:** siswa A tidak bisa membaca data siswa B, dan tabel `soal` tidak bisa dibaca langsung dari frontend.

> Catatan verifikasi (12 November 2026): ketiga migrasi dijalankan di PGlite 0.5.13 (PostgreSQL 18.6) dengan simulasi peran `anon`/`authenticated`, `auth.uid()`, dan hak bawaan Supabase. Ada 74 tes database yang lulus: RLS aktif di semua tabel, `anon` tidak bisa membaca tabel atau menjalankan fungsi apa pun, siswa B tidak melihat data siswa A, `soal`/`kisi_kisi_kuis`/`sesi_kuis_soal` tidak bisa dibaca langsung, serta RPC latihan dan kuis sesuai api.md. Total `npm test` 160 tes lulus, dan `npm run build` berhasil. Belum dijalankan di Supabase asli, karena proyeknya belum dibuat.
>
> Penyesuaian saat implementasi (tidak mengubah keputusan): (1) siswa memang bisa membaca `percobaan_jawaban` miliknya, tetapi baris kuis yang **belum dikumpulkan** disembunyikan oleh RLS, karena kolom `benar` akan membocorkan kunci selama kuis (F-07 aturan 8). (2) `simpan_penjelasan` hanya menerima soal yang dijawab benar di latihan atau di kuis yang sudah dikumpulkan, dengan alasan yang sama. (3) `percobaan_jawaban` mendapat kolom `urutan` (nomor urut penerimaan) sebagai pemecah seri untuk "jawaban terakhir yang diterima server" (KF-22). (4) Riwayat latihan dikelompokkan per hari menurut zona waktu WIB (`Asia/Jakarta`).

## Fase 5 — Login Kode Siswa + PIN (F-01, KF-05)

> **Digantikan sebagian oleh Fase 5A (KF-05f, 12 November 2026).** Penguncian, aturan PIN, reset PIN, dan prinsip keamanan di fase ini tetap dipakai ulang. Bagian yang khusus kode siswa (`S001`, `buat-siswa.js`, klaim pendaftaran) diganti alur username di Fase 5A. Butir uji integrasi Fase 5 yang menyangkut kode siswa tidak perlu dijalankan lagi, dan diganti daftar uji Fase 5A.

**Prasyarat**

- [x] KF-05 diputuskan: Kode Siswa + PIN (12 November 2026)
- [x] KF-05a: format PIN diputuskan (6 digit angka, konfirmasi dua kali, ≠ kode kelas, tersamar)
- [x] KF-05b: batas percobaan gagal — **diputuskan 12 November 2026**: 5 kali gagal per akun → kunci 5 menit, batas utama per akun, batas IP opsional tanpa mengunci satu Wi-Fi sekolah. Detail penghitungan K7–K10 dan risiko RS-01 juga sudah dikonfirmasi.
- [x] KF-05c: prosedur lupa PIN diputuskan (reset oleh guru/peneliti → siswa membuat PIN baru sendiri, akun dan data tetap, tanpa lupa PIN mandiri)
- [x] KF-05d: format kode diputuskan (kode kelas `230706`, kode siswa `S001`…, PIN dibuat siswa saat pendaftaran pertama)
- [x] KF-05e: pretest/posttest di dalam aplikasi (fiturnya F-12, dikerjakan di Fase 12A; PP-01 s.d. PP-10 sudah diputuskan, dan PT-01 s.d. PT-13 masih terbuka)

**Pekerjaan**

Tanda `[x]` di bawah berarti kode sudah ditulis dan logikanya lulus tes lokal (Vitest + PGlite + Auth palsu). **Belum ada yang diuji di Supabase asli.** Pengujian integrasi ada di daftar terpisah di bawahnya.

- [x] Skrip `supabase/seed/buat-siswa.js` (KF-05d): membuat kode siswa berurutan `S001`, `S002`, …, pengguna Auth dengan email internal `<siswa.id>@siswa.mathsave.invalid` dan **kata sandi acak** (siswa belum punya PIN), serta baris `siswa` (`kode_hash` tanpa kode asli, `pin_dibuat_pada = null`). Mencetak daftar kode siswa **tanpa PIN**. Nomor berikutnya dicari dengan mencocokkan hash S001–S999, karena kode asli tidak disimpan.
- [x] Skrip `supabase/seed/hitung-kode-kelas.js` untuk menghitung *secret* `KODE_KELAS_HASH`. Kode kelas diketik saat diminta, tidak lewat argumen, tidak di kode, dan tidak di `.env` frontend.
- [ ] Menyimpan *secret* `RAHASIA_KODE` dan `KODE_KELAS_HASH` di Edge Function Supabase (`supabase secrets set`). Butuh proyek Supabase.
- [x] Edge Function `daftar-pertama` (KF-05d, api.md 2b): memeriksa format kedua kode (tolak jika tertukar), kode kelas, kode siswa yang belum terdaftar, lalu klaim bersyarat `pin_dibuat_pada IS NULL` sebelum mengganti kata sandi Auth. Klaim dibatalkan jika penggantian gagal. Memakai pesan seragam `DAFTAR_GAGAL`, mekanisme kunci KF-05b, dan log tanpa kode atau PIN.
- [x] Layar Daftar pertama kali (design.md 5.1b) dan tautan "Pertama kali? Daftar di sini" di layar Masuk
- [x] Alat reset PIN untuk guru/peneliti (KF-05c, `supabase/seed/reset-pin.js`): mengganti kata sandi Auth dengan nilai acak (PIN lama langsung tidak berlaku), membuat kode reset sementara sekali pakai (yang disimpan hanya hash-nya di `reset_pin`), dan membatalkan kode reset lama. Tidak menyentuh `siswa.id` maupun data belajar.
- [x] Edge Function `atur-pin-baru` (KF-05c, api.md 2a): memeriksa kode siswa + kode reset, membuat PIN baru dengan HMAC yang sama dengan PIN awal, menandai kode reset terpakai (dikembalikan jika penggantian kata sandi gagal), langsung memberi sesi, memakai pesan seragam `RESET_GAGAL`, dan log tanpa kode reset atau PIN
- [x] Layar Buat PIN baru (design.md 5.1a) dan teks "Lupa PIN? Tanyakan ke guru atau penelitimu" di layar Masuk, **tanpa** fitur lupa PIN mandiri
- [x] **Detail teknis KF-05c yang ditetapkan saat implementasi** (12 November 2026, bukan keputusan kebijakan baru):
  - (a) Kode reset terdiri dari 8 karakter dari `ABCDEFGHJKMNPQRSTUVWXYZ23456789` (tanpa 0/O, 1/I/L) dan ditampilkan sebagai `ABCD-2345`. Huruf kecil, spasi, dan `-` diterima.
  - (b) Masa berlaku 24 jam, sekali pakai.
  - (c) Reset lewat skrip `reset-pin.js` di komputer peneliti, sesuai rancangan yang sudah ada. Tidak ada halaman pengelola untuk guru.
  - (d) Sesi lama di perangkat lain **tidak** dikeluarkan secara paksa, karena reset hanya mengganti kata sandi Auth. Apakah token penyegar lama tetap berlaku di Supabase perlu dicek saat uji integrasi.
  - (e) Reset **mengakhiri** kunci KF-05b akun itu, karena identitas siswa sudah diperiksa langsung oleh guru/peneliti.
  - (f) Layar Buat PIN baru memakai penghitung kunci yang sama per kode siswa (`status_masuk`): 5 kali gagal berurutan → 5 menit.
- [ ] Menguji apakah Supabase Auth menerima email internal `.invalid`. Jika tidak, ganti domain.
- [x] Edge Function `masuk-kode` menerima `kode` + `pin`, dengan respons `MASUK_GAGAL` yang seragam dan log tanpa PIN
- [x] Penguncian akun (KF-05b): tabel `status_masuk` per `kode_hash` (termasuk kode tidak terdaftar), 5 kali gagal berurutan → kunci 5 menit waktu server, pembaruan atomik lewat fungsi `catat_percobaan_masuk` (migrasi `20261112000004`), PIN tidak diperiksa selama terkunci, dan hitungan kembali 0 setelah berhasil atau kunci berakhir. Satu penghitung per kode dipakai bersama oleh masuk, daftar, dan atur PIN baru.
- [x] Batas IP tambahan (opsional, KF-05b K5): **tidak dipakai**. IP hanya dicatat sebagai `ip_hash` di `percobaan_masuk` untuk pemantauan, sehingga satu Wi-Fi sekolah tidak pernah terkunci.
- [x] Halaman Masuk sesuai design.md 5.1 (kolom kode siswa, kolom PIN 6 angka yang selalu tersamar **tanpa tombol tampilkan**), penyimpanan sesi (supabase-js), pengaman rute (belum masuk → `#/masuk`), dan tombol Keluar di Beranda
- [x] Validasi PIN KF-05a di `daftar-pertama` dan `atur-pin-baru`, di frontend dan server: tepat 6 digit (`^[0-9]{6}$`, sebagai teks), dua isian sama. Pemeriksaan PIN ≠ kode kelas **hanya di server** lewat `KODE_KELAS_HASH`. Di `masuk-kode`, PIN yang bukan 6 digit langsung `MASUK_GAGAL`.

**Pengujian integrasi yang masih dibutuhkan (Supabase asli)**

- [ ] Menjalankan migrasi `20261112000001` sampai `20261112000004`, lalu men-*deploy* ketiga Edge Function (`supabase functions deploy masuk-kode daftar-pertama atur-pin-baru`)
- [ ] Memastikan variabel bawaan Edge Function (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) tersedia dengan nama itu di proyek baru. Jika proyek memakai kunci publik format baru (bukan JWT), periksa apakah fungsi perlu di-*deploy* dengan `--no-verify-jwt`.
- [ ] `signInWithPassword` dengan kata sandi salah benar-benar menghasilkan galat status 400 (dipakai `alatSupabase.js` untuk membedakan "PIN salah" dari gangguan server)
- [ ] Panggilan dari browser HP lewat link Netlify lolos CORS
- [ ] Mengulang seluruh daftar "Selesai jika" di bawah dengan akun dan HP sungguhan, termasuk 10 permintaan gagal bersamaan (PGlite hanya punya satu koneksi)
- [ ] Memeriksa log Edge Function di dasbor: tidak ada PIN, kode siswa, kode kelas, atau kode reset

**Selesai jika:**

- Kode dan PIN benar → masuk ke Beranda.
- **Kode benar + PIN salah**, dan **kode tidak terdaftar + PIN apa pun**, menghasilkan status, isi respons, dan pesan **yang sama persis** (`MASUK_GAGAL`), tanpa menyebut bagian mana yang salah.
- **KF-05b:** 4 kali PIN salah lalu PIN benar → berhasil masuk, dan hitungan kembali 0.
- **KF-05b (K7, K8, K10):** 3 kali salah → berhasil → 4 kali salah tidak mengunci akun, karena hitungan dimulai dari 0 lagi. Kegagalan ke-5 berurutan dijawab `MASUK_GAGAL`, dan percobaan ke-6 baru dijawab 429.
- **KF-05b:** 5 kali PIN salah → percobaan ke-6 (dengan PIN benar sekalipun) ditolak 429 "Tunggu 5 menit". Setelah 5 menit (waktu server), PIN benar diterima.
- **KF-05b:** selama akun siswa A terkunci, siswa B, C, dan seterusnya dari **IP/Wi-Fi yang sama** tetap bisa masuk dengan kode dan PIN masing-masing.
- **KF-05b:** satu kelas (±30 siswa) login bersamaan dari satu IP, termasuk beberapa yang salah PIN 1–2 kali, tidak memicu penguncian massal oleh batas IP.
- **KF-05b:** kode **tidak terdaftar** yang dicoba 5 kali juga menghasilkan 429 pada percobaan ke-6, dengan respons yang sama persis seperti kode terdaftar yang terkunci. Respons 429 tidak memuat sisa percobaan atau sisa waktu.
- **KF-05b:** 10 permintaan gagal yang dikirim bersamaan untuk satu kode tidak membuat `gagal_berturut` melewati batas atau menghasilkan lebih dari satu masa kunci.
- **KF-05b:** percobaan selama terkunci tidak memperpanjang masa kunci.
- Database, tabel `siswa`, `percobaan_masuk`, dan log Edge Function **tidak memuat PIN** dalam bentuk apa pun (diperiksa langsung).
- Siswa A yang sudah masuk tidak bisa membaca atau menulis data latihan, kuis, atau riwayat siswa B (RLS, KF-05 L5).
- **KF-05d:** siswa `S003` yang belum mendaftar mengisi kode kelas `230706` + `S003` + PIN baru → berhasil masuk. Login berikutnya cukup `S003` + PIN, tanpa kode kelas.
- **KF-05d:** pendaftaran kedua untuk `S003` (dengan kode kelas benar) ditolak `DAFTAR_GAGAL`, dan PIN `S003` tidak berubah. Dua permintaan pendaftaran bersamaan untuk akun yang sama hanya menghasilkan satu yang berhasil.
- **KF-05d:** kode kelas salah, kode siswa tidak terdaftar, kode yang tertukar (`230706` di kolom kode siswa atau `S001` di kolom kode kelas), dan akun yang sudah terdaftar semuanya menghasilkan `DAFTAR_GAGAL` yang **sama persis**.
- **KF-05d:** kode kelas tidak ditemukan di hasil build frontend (`dist/`) maupun di respons jaringan mana pun.
- **KF-05d:** akun yang belum mendaftar tidak bisa masuk lewat `masuk-kode` (`MASUK_GAGAL`).
- **KF-05d:** `s001` dan ` S001 ` (dengan spasi) dibaca sebagai `S001`.
- **KF-05a:** di pendaftaran pertama **dan** pembuatan PIN baru setelah reset, PIN `12345` (5 digit), `1234567` (7 digit), dan `12a456` ditolak, sedangkan `482915` diterima.
- **KF-05a:** PIN `012345` diterima saat pendaftaran, lalu login dengan `012345` berhasil. Angka 0 di depan tidak hilang.
- **KF-05a:** PIN `230706` (sama dengan kode kelas) ditolak di pendaftaran pertama dan di pembuatan PIN baru setelah reset, dengan pesan "PIN tidak boleh sama dengan kode kelas". Pesan ini hanya muncul jika kode kelas + kode siswa (atau kode siswa + kode reset) valid.
- **KF-05a:** dua isian PIN yang berbeda ditolak sebelum dikirim.
- **KF-05a:** kolom PIN selalu tersamar, tanpa tombol tampilkan, dan nilai `230706` tidak ditemukan di hasil build frontend (`dist/`).
- **KF-05a:** login dengan PIN yang bukan 6 digit menghasilkan `MASUK_GAGAL` yang sama dengan PIN salah, dan tetap dihitung untuk kunci KF-05b.
- **KF-05c:** setelah reset oleh peneliti, PIN lama langsung ditolak. Siswa membuat PIN baru dengan kode reset, lalu PIN baru diterima di `masuk-kode`.
- **KF-05c:** `siswa.id` dan `auth_user_id` sama sebelum dan sesudah reset. Jumlah baris `percobaan_jawaban`, `sesi_kuis`, `sesi_kuis_soal`, `kemajuan_materi`, dan `penjelasan_siswa` milik siswa itu juga sama, dan nilai kuis tertinggi tetap tampil.
- **KF-05c:** kode reset yang sudah dipakai, kedaluwarsa, milik siswa lain, atau salah ditolak dengan `RESET_GAGAL` yang sama persis. Reset kedua membatalkan kode reset pertama.
- **KF-05c:** tidak ada endpoint atau tombol yang memungkinkan siswa memulai reset sendiri. Memanggil alat reset tanpa *service role key* gagal.
- **KF-05c:** kode reset dan PIN baru tidak muncul di database dalam bentuk asli, maupun di log Edge Function.

> Catatan verifikasi (12 November 2026): `npm test` lulus dengan 226 tes, termasuk 66 tes baru Fase 5 di `tests/login/`. Alur ketiga Edge Function diuji terhadap fungsi SQL asli di PGlite, memakai Auth palsu di memori. Butir "Selesai jika" di atas lulus di tingkat ini, termasuk penguncian K7–K10, respons seragam, satu kelas dari satu IP, 10 kegagalan bersamaan (diserialkan), pendaftaran ganda, aturan PIN, reset, dan pemindaian seluruh tabel tanpa PIN/kode. `npm run build` berhasil, dan hasil build `dist/` diperiksa tidak memuat `230706`, `RAHASIA_KODE`, `KODE_KELAS_HASH`, atau awalan HMAC. Tampilan layar Masuk, Daftar, dan Buat PIN baru sudah dicek di lebar 360 px. **Belum diuji:** Supabase Auth asli (bcrypt, sesi, token), HTTP Edge Function, secret, CORS, dan konkurensi sungguhan.

## Fase 5A — Akun Username dan Pilihan Kelas (F-01, KF-05f)

Keputusan KF-05f disetujui 12 November 2026 (PRD F-01). Rancangan teknis ada di architecture.md 5.0, spesifikasi di api.md 2e, dan layar di design.md 5.0.

**Tahap 0 — Pemeriksaan read-only dan cadangan**

- [x] Cadangan lokal dokumen sebelum Tahap 1: `cadangan/sebelum-username-kelas-20261112/` (7 file + `SHA256SUMS`). Sidik jari 86 file kode direkam untuk membuktikan Tahap 1 tidak mengubah kode.
- [x] Pemeriksaan database read-only (12 November 2026), hanya menghitung baris tanpa membaca isi dan tanpa menulis:
  - Supabase Auth: **0 pengguna** (0 email internal siswa, 0 lainnya).
  - Tabel `siswa`: **0 baris** (lewat fungsi `daftar_kode_hash_siswa`). Karena data belajar wajib merujuk `siswa`, juga belum ada data belajar.
  - Kolom `username` dan tabel `kelas` **belum ada**, sesuai rencana.
  - Fungsi migrasi `…0004` **sudah terpasang** (`kunci_masuk_aktif` bisa dipanggil).
  - **Temuan:** `service_role` tidak punya hak membaca tabel secara langsung (`42501`), tetapi bisa menjalankan fungsi RPC. Semua skrip dan Edge Function Fase 5A wajib memakai RPC.
- [x] **Kesimpulan:** tidak ada akun lama yang perlu dimigrasikan saat ini. Rancangan tetap mendukung akun lama (U8).
- [ ] **Sebelum Tahap 7 (wajib, oleh pengembang):** ulangi pemeriksaan jumlah akun, lalu cadangkan data:
  - dasbor **Table Editor → siswa → Export to CSV** (dan tabel data belajar jika sudah ada isinya);
  - atau, jika Supabase CLI tersedia, cadangan skema + data dengan `supabase db dump` ke file **di luar repositori**.

  Ketersediaan cadangan otomatis paket Free tidak diasumsikan (AGENTS.md §8).

**Tahap 1 — Dokumentasi**

- [x] PRD (F-01 KF-05f U1–U10, aturan username, status aturan lama, RS-03–RS-05, PT-11, PT-15), architecture.md 5.0 dan 6, api.md 2e, design.md 5.0, task.md (fase ini), AGENTS.md, dan README.md diperbarui 12 November 2026. Tidak ada kode yang berubah.

**Tahap 2 — Migrasi (ditulis dan diuji di PGlite, TIDAK dijalankan)**

- [x] `supabase/migrations/20261112000005_username_dan_kelas.sql`:
  - tabel `kelas` dan `percobaan_daftar`;
  - `siswa.username` (`UNIQUE` + `CHECK` huruf kecil), `siswa.kelas_id`, `kode_hash` boleh kosong, dan `CHECK` identitas login;
  - fungsi `service_role` (architecture.md 5.0);
  - diakhiri `revoke all on all functions … from public, anon, authenticated` lalu `grant` yang tepat. Tanpa `DELETE`/`DROP` data.
- [x] Tes PGlite `tests/db/username_kelas.test.js`:
  - username ganda ditolak, termasuk dua pendaftaran bersamaan dan perbedaan huruf besar/kecil;
  - format dan huruf kecil dijaga database;
  - kelas nonaktif tidak bisa dipilih, dan kelas yang sudah dipakai tidak bisa dihapus;
  - batas U9 dengan jendela 1 jam;
  - akun lama berbasis `kode_hash` tetap sah;
  - `anon`/`authenticated` tidak bisa memanggil fungsi baru;
  - 234 tes lama tetap lulus.

> Catatan verifikasi Tahap 2 (12 November 2026):
> - **Tes:** `npm test` lulus dengan 283 tes (234 lama + 49 baru), dan `npm run build` berhasil.
> - **Uji mutasi:** setiap pelemahan migrasi berikut membuat tes gagal, lalu file dikembalikan utuh: UNIQUE dihapus (4 tes gagal), batas akun 60 → 61 (1 gagal), kelas nonaktif diterima (1 gagal), dan CHECK huruf kecil dihapus (8 gagal).
> - **Keutuhan data:** migrasi `…0005` dijalankan di atas database yang sudah berisi akun kode siswa dan data belajar. Sidik jari isi kesebelas tabel lama sama persis sebelum dan sesudah migrasi.
> - **Batasan PGlite:** PGlite hanya punya satu koneksi, jadi "pendaftaran bersamaan" diuji secara berurutan. Pengamannya adalah UNIQUE di database (diuji langsung) dan kunci per IP (`pg_advisory_xact_lock`). Konkurensi sungguhan diuji di Tahap 7.
> - **Belum dilakukan:** migrasi **belum dijalankan** di Supabase.
>
> **Koreksi rancangan:** akun lama yang diberi username **wajib di-reset PIN-nya**, karena kata sandi lamanya diturunkan dari kode siswa asli yang tidak disimpan server (architecture.md 5.0).

**Tahap 3 — Logika Edge Function** (`supabase/functions/_bersama/`)

- [x] Aturan username (normalisasi, format) di `_bersama/username.js`, yang juga akan dipakai frontend. Pola sama persis dengan `CHECK` migrasi 0005 (dijaga tes). Kata terlarang ada di `_bersama/usernameTerlarang.js`, hanya di server.
- [x] `alurLogin.js`: `daftar-pertama` dua aksi (2e.1, 2e.2) dengan pembersihan akun Auth jika simpan gagal; `masuk-kode` dan `atur-pin-baru` dengan username; kata sandi `"sandi-siswa:" + siswa.id`; kunci `"cari-username:"`. Konfirmasi PIN (`ulang_pin`) juga diperiksa server. Jika akun/PIN tersimpan tetapi masuk otomatis gagal, respons 201 tanpa sesi.
- [x] `alatSupabase.js`: hanya lewat RPC, ditambah `auth.admin.createUser` / `deleteUser`. Nama ketiga fungsi, `index.js`, dan `config.toml` tetap.

> Catatan verifikasi Tahap 3 (12 November 2026):
> - **Tes:** `npm test` lulus dengan 304 tes (283 sebelumnya; `alurLogin.test.js` ditulis ulang untuk username menjadi 48 tes, ditambah 6 tes `username.test.js`). `npm run build` berhasil, dan `dist/` tidak memuat `230706`, nama secret, awalan HMAC, atau daftar kata terlarang.
> - **Uji mutasi:** setiap pelemahan berikut membuat tes gagal, lalu file dikembalikan utuh: akun Auth tidak dihapus saat simpan gagal (3 tes gagal), kode kelas tidak diperiksa ulang di langkah 2 (1 gagal), kunci login diabaikan (4 gagal), dan konfirmasi PIN diabaikan (2 gagal).
> - **Belum diuji:** Edge Function belum di-deploy, dan Supabase Auth asli, HTTP, CORS, serta konkurensi sungguhan belum diuji (Tahap 7).
>
> **Peralihan sementara:** frontend (Tahap 5) dan `reset-pin.js` (Tahap 4) masih memakai kode siswa. Keduanya tidak cocok dengan logika baru sampai tahapnya dikerjakan. Ini tidak berdampak karena belum ada yang di-deploy.

**Tahap 4 — Skrip pengelola**

- [x] `supabase/seed/kelola-kelas.js` + `inti/kelolaKelas.js`: daftar, tambah (jenjang 7–12 atau VII–XII), ubah-nama, nonaktifkan/aktifkan. Tanpa hapus (perintah `hapus` ditolak dengan penjelasan). Hanya lewat RPC, dan tidak membutuhkan `RAHASIA_KODE`.
- [x] `reset-pin.js <username> <peneliti|guru>` lewat `cari_siswa_username` → `buat_reset_pin_siswa` (tanda tangan dibaca dari migrasi 0005, lalu diuji). Kode reset hanya ditampilkan sekali, sedangkan database menyimpan HMAC-nya. Reset versi kode siswa (`resetPinSiswa`) **dihapus** dari `inti/kelolaSiswa.js`, karena `atur-pin-baru` sejak Tahap 3 hanya menerima username, sehingga kode reset dari jalur lama tidak akan pernah bisa dipakai.
- [x] `buat-siswa.js` hanya berjalan dengan tanda `--akun-lama-kode-siswa`, dan berhenti sebelum membaca CSV atau terhubung ke Supabase jika tanda itu tidak ada. `buatAkunSiswa` (akun lama) tetap ada dan tetap diuji.

> Catatan verifikasi Tahap 4 (12 November 2026):
> - **Tes:** `tests/login/skripPengelola.test.js` berisi 24 tes. Nama RPC dan nama parameter di `klienPengelola.js` dicocokkan dengan tanda tangan di file migrasi. Selain itu diuji: reset per username terhadap RPC asli di PGlite (PIN lama ditolak, kode baru dipakai di `atur-pin-baru`, kunci diakhiri, kode reset tidak tersimpan sebagai teks dan tidak tercetak ke log oleh fungsi inti), kelola kelas lengkap dengan pesan galat, penolakan `hapus`, dan penjaga `buat-siswa.js`.
> - **Reset di tes alur:** pembantu reset di `alatUji.js` kini memanggil fungsi skrip yang sebenarnya, jadi 48 tes alur Tahap 3 ikut menguji `reset-pin.js`.
> - **Uji mutasi:** parameter RPC salah ketik dan kode reset tercetak ke log sama-sama membuat tes gagal, lalu file dikembalikan utuh.
> - **Belum dilakukan:** skrip **belum dijalankan** ke Supabase.

**Tahap 5 — Frontend**

- [x] Layar Masuk (username), Daftar dua langkah dengan `<select>` + `<optgroup>` VII–XII, Buat PIN baru (username + `ulang_pin`), sapaan Beranda dengan username lewat `ambil_profil` (design.md 5.0); validasi dan pesan (api.md 2e.5); hanya token warna yang sudah ada.

> Catatan verifikasi Tahap 5 (12 November 2026):
> - **Kontrak:** diambil langsung dari `alurLogin.js` dan api.md 2e.
> - **File baru:** `src/layanan/api.js` (ambil_profil + sapaan) dan `src/logika/kelasPilihan.js` (pengelompokan kelas dari server, tanpa daftar hardcode).
> - **Kode siswa sudah hilang dari frontend:** tidak ada lagi `S001`, "Kode siswa", atau `ATRIBUT_KODE_SISWA` di `src/`.
> - **Tes:** `tests/login/frontend.test.js` ditulis ulang (validasi, pesan, kelas, penafsiran 200/201, profil, keamanan). `tests/login/kontrakFrontend.test.js` (baru) menguji layanan frontend **terhadap penangan HTTP dan logika Edge Function asli** dengan RPC di PGlite, mencakup:
>   - daftar dua langkah; username dipakai, terlarang, format salah; kelas nonaktif; PIN tidak sama/tidak valid;
>   - 201 tanpa sesi, untuk pendaftaran maupun reset;
>   - login dan penguncian; reset PIN;
>   - kode reset tidak tercatat di console;
>   - profil dan kemajuan belajar tetap pada siswa yang benar.
> - **Hasil:** `npm test` 381 tes lulus, dan `npm run build` berhasil. Satu kali putaran penuh pertama sempat gagal 1 tes di `modulMurni.test.js` (file tidak berubah). Tes itu lulus di 9 putaran penuh berikutnya dan 4 putaran tunggal, sehingga dicatat sebagai *flaky* yang penyebabnya belum diketahui.
> - **Tampilan:** diperiksa di 360 px dan desktop dengan build terpisah ber-URL palsu dan jaringan tiruan, tanpa menghubungi Supabase.
> - Tahap 6 (pengujian lokal penuh) **belum** dicentang.

**Tahap 6 — Pengujian lokal**

- [ ] `npm test` dan `npm run build` lulus. Tangkapan layar 360 px untuk Masuk, Daftar langkah 1 dan 2, dan Buat PIN baru. Pemindaian `dist/` tanpa `230706` dan rahasia.

**Perbaikan keamanan login (12 November 2026, atas permintaan pengembang)** — kode dan tes lokal saja, belum dijalankan di Supabase

- [x] Migrasi baru `…0006_penguncian_bertingkat.sql`: `status_masuk.tingkat_kunci`, `catat_percobaan_masuk` bertingkat (5 → 15 → 60 menit, kembali 0 setelah berhasil/reset/24 jam), `masuk_ip_terbatas` (100 gagal per jam per IP). Migrasi 0001–0005 tidak diubah.
- [x] `penangan.js` `ambilIp`: hanya `cf-connecting-ip`; `x-forwarded-for`/`x-real-ip` tidak dipercaya (T3).
- [x] Galat Supabase Auth lewat `error.code`/status (`_bersama/galatAuth.js`): 429 → 503 `LAYANAN_SIBUK` dan tidak dihitung gagal. Masuk otomatis gagal setelah akun dibuat atau PIN diganti → 201 (bukan 500).
- [x] Kunci Edge Function dari `SUPABASE_SECRET_KEYS`/`SUPABASE_PUBLISHABLE_KEYS` dengan cadangan kunci lama (`_bersama/kunciSupabase.js`, T7).
- [x] Frontend mengirim kunci publik hanya di header `apikey`. `verify_jwt` tetap bawaan (`true`), dan `config.toml` tidak diubah (api.md 2e.8).
- [x] Tes: `tests/login/penguncianBertingkat.test.js`, `tests/login/galatAuthDanIp.test.js`, `tests/db/penguncian_bertingkat.test.js`.
- [ ] **Diuji di proyek asli (Tahap 7):** (a) fungsi gema sementara memastikan `cf-connecting-ip` ada dan nilai palsu dari klien tidak diteruskan; (b) permintaan hanya dengan header `apikey` diterima platform saat `verify_jwt = true`; (c) batas laju masuk Supabase Auth (Auth → Rate Limits) cukup untuk 30 login dalam beberapa menit dari IP Edge Function; (d) email `.invalid` diterima `createUser` (T6).

**Tahap 7 — Penerapan (hanya dengan izin pengembang)**

- [ ] Cadangan (lihat Tahap 0) → jalankan migrasi `…0005` lalu `…0006` → isi daftar kelas dengan `kelola-kelas.js` (isi ditentukan peneliti) → deploy ulang ketiga Edge Function → uji integrasi di bawah.

**Selesai jika:**

- Siswa baru: `230706` → pilih kelas → username `Rani_08` → PIN + ulangi → langsung masuk Beranda dengan sapaan "Halo, rani_08". Login berikutnya `rani_08` + PIN berhasil, dan `RANI_08` juga berhasil.
- Username yang sama (beda huruf besar/kecil) oleh siswa lain → `USERNAME_SUDAH_DIPAKAI`, dan tidak ada akun Auth yatim yang tertinggal. Dua pendaftaran bersamaan → tepat satu berhasil.
- Kode kelas salah → `KODE_KELAS_SALAH` dan daftar kelas tidak dikirim. Kesalahan ke-21 dalam satu jam dari IP yang sama → `TERLALU_BANYAK_PENDAFTARAN`. Satu kelas (±30 siswa) dari satu Wi-Fi bisa mendaftar tanpa terhalang.
- Kelas nonaktif tidak muncul dan tidak bisa dipilih lewat permintaan buatan. `kelas_id` acak → `KELAS_TIDAK_SAH`.
- Login gagal tetap seragam. Penguncian 5 kali gagal per username bertingkat 5 → 15 → 60 menit, termasuk username yang tidak terdaftar. Batas 100 gagal per jam per IP tepercaya.
- Reset PIN dengan username: PIN lama tidak berlaku, PIN baru diterima, dan `siswa.id` serta data belajar tetap sama.
- `230706`, `RAHASIA_KODE`, dan `KODE_KELAS_HASH` tidak ada di `dist/`. Penilai tidak pernah menerima username (PT-15).
- Jumlah baris data belajar sebelum dan sesudah migrasi sama, dan tidak ada akun yang hilang.

## Fase 6 — Materi Bertahap (F-02, F-03)

- [x] Menulis isi `src/data/materi.js` untuk P0, M1–M6 (kartu langkah ±60 kata per kartu), memakai **notasi resmi KF-03**: M, B, p, t, A; B = M × (p/100) × t; A = M + B. Simbol lain (n, Ma, "p%") tidak dipakai.
- [x] Minimal 2 contoh per sub-bab M2–M5 (contoh lengkap + contoh setengah jadi)
- [x] Gambar SVG pendukung untuk M1 dan M3
- [x] Halaman Belajar, kartu langkah, contoh langkah demi langkah
- [x] Menyimpan kemajuan (`simpan_kemajuan`)
- [ ] Isi materi diperiksa dosen/guru — paket: `docs/validasi/01-materi` (HTML + PDF).

**Selesai jika:** siswa bisa menyelesaikan satu sub-bab dan statusnya tercatat `selesai`.

> Catatan verifikasi (13 November 2026): isi `src/data/materi.js` berstatus **DRAF** sampai diperiksa dosen/guru. Tes `tests/logika/materi.test.js` menghitung ulang semua angka contoh dan Coba Sendiri dengan `bungaTunggal.js`, memeriksa batas 60 kata per kartu, dan melarang notasi lama (p%, n, Ma). Halaman Belajar dan Subbab diperiksa di 360 px dengan Supabase tiruan. Keterbatasan: belum ada RPC yang mengembalikan status per sub-bab, jadi daftar Belajar menandai "Disarankan berikutnya" dari `ringkasan_kemajuan`, dan posisi kartu terakhir diingat di perangkat.

## Fase 7 — Bank Soal (F-05, F-06)

- [x] Menyusun **bank soal latihan** ±60 soal (`bank = 'latihan'`, semuanya isian; P0: 6, M2: 10, M3: 12, M4: 10, M5: 14, M6: 8), masing-masing dengan 4 petunjuk dan pembahasan 4 langkah
- [x] Memastikan **tidak ada soal yang sama** di bank latihan dan bank kuis (KF-14 S1). Setiap soal punya tepat satu nilai `bank`, dan isi soal kuis tidak disalin ke latihan.
- [x] Variasi konteks cerita (koperasi sekolah, bank, menabung untuk membeli barang, membandingkan dua tawaran)
- [x] Semua petunjuk, pembahasan, dan opsi soal memakai notasi KF-03 (M, B, p, t, A). Huruf A sebagai simbol selalu disertai istilahnya agar tidak tertukar dengan huruf opsi A–D.
- [x] Setiap soal bank latihan punya **tepat 3 petunjuk** sesuai KF-15, dan diperiksa bahwa **tidak ada petunjuk yang memuat jawaban akhir** (misalnya cek otomatis di skrip *seed* bahwa teks petunjuk tidak memuat nilai `jawaban` yang diformat). Soal bank kuis tanpa petunjuk.
- [x] Skrip *seed* menghitung `jawaban` dan `pola_kesalahan` memakai `bungaTunggal.js` dan `diagnosis.js`
- [ ] Bank soal diperiksa dosen/guru — paket pemeriksaan siap (13 November 2026): `docs/validasi/` (HTML + PDF), dibuat ulang dengan `node scripts/buat-paket-validasi.mjs`. Temuan T-01 s.d. T-09 dan keputusan K-1 s.d. K-4 di 00-ringkasan-pemeriksaan.
- [x] Soal kuis **pilihan ganda** (`bentuk = 'pilihan_ganda'`): menyusun **tepat 4 opsi** (`id` tetap `o1`–`o4`, 1 kunci + 3 pengecoh, KF-18), dengan pengecoh disarankan dari `pola_kesalahan` dan ditambah manual bila kurang dari 3. Letak kunci di bank soal tidak penting karena opsi diacak per siswa.
- [x] Mengisi `toleransi` setiap soal isian sesuai satuan jawabannya (KF-19): `rupiah` 1, `persen` 0,01, `tahun`/`bulan`/`hari` 0,01. Skrip *seed* selalu mengisi nilai ini dan tidak bergantung pada nilai bawaan 0,5 di `diagnosis.js`.
- [x] Pemeriksaan **kunci rapi** di skrip *seed* (KF-19 G1): soal isian dengan kunci Rupiah tidak bulat, persen lebih dari 1 desimal, atau lama menabung tidak bulat ditolak dan dilaporkan
- [x] Memberi label `kategori_kuis` pada setiap soal kuis (`konsep`, `besar_bunga`, `tabungan_akhir`, `modal_suku_bunga`, `lama_menabung`, `penerapan`) sesuai KF-12
- [x] Menyusun soal kuis kategori `konsep` (sub-bab M1) di bank kuis. Bank latihan ±60 soal di atas belum memuat soal M1. Jumlah minimum: 4 soal konsep–mudah–PG dan 2 soal konsep–sedang–PG (KF-14).
- [x] Menyusun **bank soal kuis minimal 40 soal berbeda** (`bank = 'kuis'`, terpisah dari bank latihan, KF-14) dengan sebaran minimum per kombinasi sesuai tabel di PRD F-07 "Bank soal kuis": 4 soal untuk masing-masing konsep–mudah–PG, besar bunga–sedang–PG, dan tabungan akhir–sedang–PG, serta 2 soal untuk masing-masing dari 14 kombinasi lainnya
- [x] Menandai opsi kunci (`opsi[].kunci`) dan `jenis_kesalahan` pengecoh pada setiap soal pilihan ganda
- [x] Memastikan bank soal kuis cukup untuk **dua percobaan** pada **setiap nomor kisi-kisi KF-21** (KF-14): 17 kombinasi submateri–tingkat–bentuk, masing-masing minimal 2 × jumlah nomor yang memakainya (total 40)
- [x] Kueri pemeriksaan kecukupan bank soal di `supabase/seed/` (jumlah tersedia vs. minimum per kombinasi) dijalankan sebelum uji coba, agar `BANK_SOAL_KURANG` tidak muncul ke siswa

> Catatan verifikasi (13 November 2026): data di `supabase/seed/data/bankSoal.js`, generator `supabase/seed/inti/bankSoal.js`, hasil `supabase/seed/soal.sql` (`node supabase/seed/buat-bank-soal.js`), kueri `supabase/seed/periksa-bank-soal.sql`. 60 soal latihan + 40 soal kuis (30 pilihan ganda, 10 isian), tepat minimum 17 kombinasi. Tes `tests/db/bankSoal.test.js` menjalankan soal.sql di PGlite: semua kombinasi "cukup", kunci latihan dinilai benar, setiap pola kesalahan dikenali, dua percobaan kuis × 20 soal berbeda dengan nilai 100, percobaan ketiga ditolak. **soal.sql belum dijalankan di Supabase**: tunggu pemeriksaan dosen/guru, lalu jalankan di SQL Editor dan periksa dengan periksa-bank-soal.sql. Teks pesan `diagnosis.js` sudah diselaraskan ke KF-03 (butir Fase 8).

## Fase 8 — Latihan, Petunjuk, dan Penjelasan Kesalahan (F-05, F-06, F-08, F-09)

- [x] Halaman Latihan: pilih sub-bab dan tingkat
- [x] Tampilan soal, kolom jawaban `inputmode="decimal"`
- [x] Panel Pahami Soal (`periksa_pemahaman`)
- [x] Petunjuk bertahap **maksimal 3 tingkat** (`ambil_petunjuk`, KF-15): tingkat 1 diketahui/ditanya, tingkat 2 rumus/konsep, tingkat 3 langkah awal perhitungan. Dibuka berurutan sesuai kebutuhan, hanya di latihan.
- [x] Umpan balik dan pesan kesalahan (`periksa_jawaban`)
- [x] Menyelaraskan **teks pesan dan komentar** di `src/logika/diagnosis.js` dan `src/logika/bungaTunggal.js` dengan notasi KF-03 (misalnya "p% × t" → "(p/100) × t", "tabungan akhir" → "jumlah tabungan akhir (A)"). Hanya teks yang diubah, bukan logika atau nama fungsi. Tes Vitest yang memeriksa teks pesan ikut disesuaikan dan harus tetap lulus.
- [x] Memperbarui komentar "KF-02: belum dikonfirmasi" di `src/logika/bungaTunggal.js`, `src/logika/diagnosis.js`, dan judul tes di `tests/logika/bungaTunggal.test.js` menjadi "KF-02: 1 tahun = 365 hari (diputuskan)". Nilai `HARI_PER_TAHUN = 365` tidak berubah.
- [x] Pembahasan lengkap 4 langkah langsung tampil setelah **setiap** pemeriksaan jawaban latihan, benar maupun salah (KF-15 H9). Ini menggantikan rencana lama "tombol Lihat pembahasan setelah 2 kali salah".
- [x] Ringkasan setelah 5 soal

- [x] Latihan, petunjuk, Pahami Soal, dan pemeriksaan jawaban latihan hanya menerima soal bank latihan (KF-14 S2)

**Selesai jika:**

- Jawaban 960.000 untuk soal contoh memunculkan pesan satuan waktu.
- **KF-14 (pemisahan bank):** `ambil_soal_latihan` tidak pernah mengembalikan soal bank kuis, termasuk saat bank latihan untuk sub-bab/tingkat itu kosong.
- **KF-14:** memanggil `periksa_jawaban` mode latihan, `ambil_petunjuk`, atau `periksa_pemahaman` dengan ID soal bank kuis ditolak `SOAL_TIDAK_DITEMUKAN`, tanpa membocorkan kunci atau pembahasan.
- **KF-15:** `ambil_petunjuk` dengan level 4 atau 0 ditolak `INPUT_TIDAK_VALID`. Level 1–3 mengembalikan isi yang sesuai (diketahui/ditanya, rumus/konsep, langkah awal).
- **KF-15:** tombol petunjuk tingkat berikutnya hanya muncul setelah tingkat sebelumnya dibuka, dan hilang setelah tingkat 3.
- **KF-15:** setiap pemeriksaan jawaban latihan, benar maupun salah dan termasuk percobaan pertama yang salah, mengembalikan dan menampilkan `pembahasan` 4 langkah.
- **KF-15:** selama kuis aktif tidak ada tombol petunjuk, dan `ambil_petunjuk` untuk soal kuis ditolak.

> Catatan verifikasi (13 November 2026): `src/halaman/latihan.js`, logika `src/logika/latihan.js` (tes `tests/logika/kuisLatihan.test.js`). Penilaian, petunjuk, dan Pahami Soal tetap di server (RPC 0003, tes `tests/db/latihan.test.js` dan `tests/db/bankSoal.test.js`). Tampilan 360 px diperiksa dengan Supabase tiruan.

## Fase 9 — Kuis (F-07)

Spesifikasi: [PRD.md](PRD.md) F-07 (diperbarui 11 November 2026): **20 soal (15 pilihan ganda + 5 isian angka), 30 menit**, tombol Selesai Kuis, dikumpulkan otomatis saat waktu habis, soal kosong dihitung salah, kunci dan pembahasan baru muncul setelah dikumpulkan.

**Prasyarat**

- [x] KF-10 bentuk jawaban diputuskan (15 pilihan ganda + 5 isian angka)
- [x] KF-11 perilaku timer diputuskan (waktu server, tetap berjalan, tidak diulang)
- [x] KF-20 jawaban offline diputuskan (aturan ketat berdasarkan waktu penerimaan server)
- [x] KF-12 komposisi kuis diputuskan (tingkat 6/10/4, submateri 3/5/4/4/2/2, bentuk 15/5)
- [x] KF-21 kisi-kisi tetap 20 nomor diputuskan
- [x] Menyesuaikan [api.md](api.md) dan [architecture.md](architecture.md) dengan KF-21: tabel `kisi_kisi_kuis`, pemilihan soal per nomor tanpa penggantian kategori, `nomor` pada soal kuis, dan pesan `BANK_SOAL_KURANG`
- [x] KF-13 pengulangan kuis diputuskan (maksimal 2 percobaan, nilai tertinggi)
- [x] Menyesuaikan [api.md](api.md) dan [architecture.md](architecture.md) dengan KF-13: kolom `sesi_kuis.percobaan_ke` beserta batasannya, pemeriksaan percobaan di `mulai_kuis`, data `percobaan` di `status_kuis`, `nilai_tertinggi` di `selesaikan_kuis` dan `ringkasan_kemajuan`, serta galat `BATAS_PERCOBAAN_KUIS`
- [x] KF-14 bank soal kuis diputuskan (minimal 40, soal berbeda per percobaan), termasuk tambahan 12 November 2026: bank latihan dan bank kuis terpisah
- [x] Menyesuaikan [api.md](api.md) dan [architecture.md](architecture.md) dengan pemisahan bank: kolom `soal.bank` (menggantikan `untuk_kuis`) beserta batasan `CHECK`, filter bank di setiap RPC latihan dan kuis, dan penolakan soal dari bank yang salah
- [x] Menyesuaikan [api.md](api.md) dan [architecture.md](architecture.md) dengan KF-14: tabel `sesi_kuis_soal` (menggantikan kolom `daftar_soal`), pengecualian soal percobaan sebelumnya, pemeriksaan kecukupan bank sebelum setiap percobaan, kunci per siswa dan satu transaksi di `mulai_kuis`, serta detail `BANK_SOAL_KURANG`
- [x] KF-15 petunjuk dan pembahasan latihan diputuskan (petunjuk tidak tersedia di kuis)
- [x] KF-16 konfirmasi Selesai Kuis dan pengingat 5 menit diputuskan (A1 + B1)
- [x] KF-17 keluar di tengah kuis diputuskan (C1, keluar sementara)
- [x] KF-18 opsi pilihan ganda diputuskan (4 opsi, diacak per siswa dan dikunci per sesi)
- [x] Menyesuaikan [api.md](api.md) dan [architecture.md](architecture.md) dengan KF-18: `soal.opsi` 4 objek ber-`id` tetap, kolom `sesi_kuis_soal.urutan_opsi`, `p_opsi` berupa `id`, serta `huruf`/`huruf_dipilih` di soal publik dan hasil
- [x] KF-19 toleransi isian angka dan kunci rapi diputuskan (F1 + G1)
- [x] KF-22 pindah nomor/ubah jawaban diputuskan (N1 + R1). **Semua keputusan fitur kuis (KF-10 s.d. KF-22) sudah ditetapkan.**
- [x] Menyesuaikan dokumen dengan KF-22: aturan di PRD F-07, catatan "jawaban terakhir sebelum batas waktu" di api.md dan architecture.md, serta rancangan layar kuis 5.9d di design.md
- [x] Menyesuaikan [api.md](api.md) dan [architecture.md](architecture.md) dengan KF-12: kolom `kategori_kuis`, opsi bertanda `kunci` dan `jenis_kesalahan`, aturan komposisi di `mulai_kuis`, dan galat `BANK_SOAL_KURANG`
- [x] Menyesuaikan [api.md](api.md) dan [architecture.md](architecture.md) dengan KF-20: `tersimpan: true` sebagai tanda resmi, `jawaban_tersimpan` sebagai acuan, dan penolakan jawaban terlambat tanpa pengecualian
- [x] Menyesuaikan [api.md](api.md) dan [architecture.md](architecture.md) dengan KF-11: `status_kuis`, `tutup_sesi_kedaluwarsa`, kolom `hasil_dilihat`, dan aturan waktu server
- [x] Menyesuaikan [api.md](api.md) 3.3 dan 3.6–3.8: 20 soal, bentuk pilihan ganda/isian, rumus nilai ÷ 20, batas waktu, penolakan jawaban setelah waktu habis, isi `rincian` hasil. *(Komposisi sudah ditetapkan di KF-12.)*
- [x] Menyesuaikan [architecture.md](architecture.md): kolom `soal.bentuk` dan `soal.opsi`, `percobaan_jawaban.opsi_dipilih`, serta `sesi_kuis` 20 soal dengan `batas_waktu` dan `cara_selesai`
- [x] Bank soal kuis minimal 40 soal dengan sebaran per kombinasi terpenuhi (KF-14, dikerjakan di Fase 7)

**Pekerjaan**

- [x] `mulai_kuis` (KF-14): mengunci baris siswa, memeriksa kecukupan bank (minimum per kombinasi, total 40) sebelum setiap percobaan, mengecualikan semua soal yang pernah diterima siswa di percobaan sebelumnya, lalu menyimpan sesi dan 20 baris `sesi_kuis_soal` dalam satu transaksi
- [x] `mulai_kuis`: memilih soal **per nomor kisi-kisi KF-21** (kombinasi submateri–tingkat–bentuk sama persis, acak hanya di antara kandidat kombinasi yang sama, tanpa soal ganda), mencatat `mulai_pada` dan `batas_waktu` di server, dan gagal dengan `BANK_SOAL_KURANG` (daftar nomor kosong) tanpa mengganti kategori dan tanpa memulai timer jika ada nomor yang tidak punya kandidat
- [x] Tampilan saat `BANK_SOAL_KURANG`: keterangan bahwa bank soal belum mencukupi dan kuis belum bisa dimulai
- [x] Batas percobaan (KF-13): `mulai_kuis` melanjutkan sesi aktif, menolak dengan `BATAS_PERCOBAAN_KUIS` jika 2 percobaan sudah dipakai, dan mengisi `percobaan_ke` hanya saat sesi berhasil dibuat. Batasan `UNIQUE`/`CHECK` di database ikut dibuat.
- [x] Tampilan kesempatan kuis (KF-13): "Kesempatan kuis: n dari 2" sebelum mulai, sisa kesempatan di halaman hasil, dan tombol Mulai Kuis nonaktif dengan pesan + nilai tertinggi setelah 2 percobaan
- [x] Halaman kuis: nomor soal "n dari 20", tanpa petunjuk, tanpa umpan balik benar/salah
- [x] Tampilan soal **pilihan ganda**: 4 opsi A–D dalam urutan dari server, bisa dipilih satu (area sentuh ≥ 48 px), perangkat tidak menerima opsi kunci, dan jawaban dikirim sebagai `id` opsi (KF-18)
- [x] Pengacakan opsi di `mulai_kuis` (KF-18 E1): diacak sekali per soal per sesi dan disimpan di `sesi_kuis_soal.urutan_opsi`
- [x] Tampilan soal **isian angka**: kolom `inputmode="decimal"`, dibaca dengan `uraiAngka`, masukan bukan angka ditolak dengan pesan format
- [x] Penilaian isian dengan toleransi `soal.toleransi` (KF-19: Rupiah ±1, persen ±0,01, waktu ±0,01), dan pilihan ganda berdasarkan opsi kunci
- [x] Timer 30 menit yang tampil sebagai sisa waktu dan dihitung dari waktu mulai di server
- [x] Menyimpan jawaban per soal selama kuis (`periksa_jawaban` mode kuis) tanpa mengirim kunci atau pembahasan ke perangkat
- [x] Tombol **Selesai Kuis** untuk mengumpulkan sebelum waktu habis
- [x] Dialog konfirmasi Selesai Kuis (KF-16 A1, design.md 5.9a): selalu muncul, menampilkan jumlah dan nomor soal belum dijawab serta jawaban belum terkirim, dengan tombol Kembali ke soal / Ya, kumpulkan, tanpa menghentikan timer
- [x] Pengingat sisa waktu 5 menit (KF-16 B1, design.md 5.9b): satu kali, teks tenang tanpa suara, kedip, atau warna merah, dihitung dari `batas_waktu` server, tetap muncul saat offline
- [x] Pengumpulan otomatis saat waktu habis, di perangkat dan dijaga di server (jawaban setelah batas waktu ditolak)
- [x] Melanjutkan sesi kuis yang belum selesai selama waktu masih tersisa, tanpa mengulang timer (KF-11)
- [x] Dialog keluar sementara (KF-17 C1, design.md 5.9c) untuk tombol ✕ **dan** tombol/gestur kembali Android di layar kuis: tidak mengumpulkan kuis, tidak menghentikan timer
- [x] Kartu "Kuis sedang berjalan" dengan tombol **Lanjutkan kuis** di Latihan dan Beranda (memakai `status_kuis`), atau pemberitahuan "dikumpulkan otomatis" jika waktu sudah habis
- [x] Fungsi server `tutup_sesi_kedaluwarsa`: menutup sesi yang lewat `batas_waktu` dengan `cara_selesai = 'waktu_habis'` dan `selesai_pada = batas_waktu`
- [x] `status_kuis` dipanggil saat aplikasi dibuka atau kembali online: melanjutkan sesi aktif, atau memberi tahu kuis yang dikumpulkan otomatis lalu membuka hasilnya
- [x] Hitungan mundur di layar memakai `batas_waktu` dan selisih jam terhadap `waktu_server` (tetap berjalan saat offline; hanya tampilan)
- [x] Antrean jawaban offline (KF-20): jawaban yang dipilih saat offline disimpan sementara di perangkat dengan status "Belum terkirim". Saat online dan waktu masih ada, antrean dikirim sebelum kuis dikumpulkan. Jawaban yang ditolak `WAKTU_HABIS` dibuang.
- [x] Mencocokkan antrean dengan `jawaban_tersimpan` dari server saat tersambung lagi, untuk kasus balasan server hilang
- [x] Informasi untuk siswa (KF-20, J7): pemberitahuan internet terputus, penanda per soal "Belum terkirim"/"Tersimpan", pemberitahuan pengiriman ulang, dan pemberitahuan jawaban yang tidak dihitung karena waktu habis saat offline (contoh pesan di PRD F-07)
- [x] Rancangan tampilan informasi di atas ditambahkan ke design.md bersama rancangan layar kuis (design.md 5.9d)
- [x] Layar kuis sesuai design.md 5.9d (KF-22 N1): tombol Sebelumnya/Berikutnya, panel daftar soal 1–20 dengan status Tersimpan / Belum terkirim / Belum dijawab, tanpa tanda ragu-ragu
- [x] Mengubah jawaban (KF-22): pilihan ganda bisa diganti, isian bisa diubah, setiap perubahan dikirim ke server dan antrean offline hanya menyimpan pilihan terakhir per soal
- [x] Nomor soal kosong di dialog Selesai Kuis (5.9a) bisa diketuk untuk menuju soal itu
- [x] `selesaikan_kuis`: menghitung nilai (benar ÷ 20 × 100), soal kosong dihitung salah
- [x] Halaman hasil: nilai akhir, jumlah benar dan salah (termasuk jumlah tidak dijawab), nomor soal yang salah, lalu untuk setiap soal: jawaban siswa, jawaban benar, pembahasan 4 langkah, dan pesan jenis kesalahan untuk soal yang salah. Pilihan ganda menampilkan semua opsi dengan tanda opsi yang dipilih dan opsi yang benar; isian menampilkan angka yang diketik dan kuncinya.
- [x] Hasil kuis bisa dibuka lagi dari Riwayat

**Selesai jika:**

- Kunci jawaban dan pembahasan tidak ada di respons jaringan mana pun selama kuis berlangsung (cek tab Network).
- Kuis yang dibiarkan sampai 30 menit terkumpul otomatis, dan jawaban yang dikirim setelahnya ditolak server.
- Menutup browser di menit ke-10 lalu membukanya di menit ke-20: kuis yang sama berlanjut dengan sisa ±10 menit, bukan 30 menit.
- Menutup browser lalu membukanya setelah 30 menit: muncul pemberitahuan kuis sudah dikumpulkan otomatis, beserta hasilnya. Jawaban yang sempat diterima server dinilai.
- Memutus internet selama kuis: hitungan mundur tetap berjalan, muncul pemberitahuan, dan soal yang dijawab saat offline ditandai "Belum terkirim". Setelah tersambung lagi sebelum batas waktu, jawaban itu terkirim dan berubah menjadi "Tersimpan".
- Memutus internet, menjawab 3 soal, lalu menyambung lagi setelah batas waktu: ketiga jawaban itu ditolak, tampil sebagai "Tidak dijawab" di hasil, dan muncul pemberitahuan bahwa jawaban tersebut tidak dihitung. Jawaban yang diterima server sebelum offline tetap dinilai.
- Server tidak menerima atau memakai waktu dari perangkat untuk menilai ketepatan waktu jawaban.
- Mengubah jam ponsel maju atau mundur tidak menambah atau mengurangi waktu kuis.
- Kuis dengan 2 soal kosong menampilkan keduanya sebagai salah dan "Tidak dijawab".
- Hasil menampilkan semua bagian di atas untuk 20 soal.
- Setiap sesi kuis yang dibuat berisi tepat: 6 mudah, 10 sedang, 4 sulit; 3 konsep, 5 besar bunga, 4 tabungan akhir, 4 modal/suku bunga, 2 lama menabung, 2 penerapan; 15 pilihan ganda dan 5 isian (diuji pada beberapa sesi).
- Soal nomor *n* di setiap sesi selalu cocok dengan baris nomor *n* kisi-kisi KF-21 (submateri, tingkat, dan bentuk), dan tidak ada soal yang muncul dua kali dalam satu sesi.
- Jika satu kombinasi dikosongkan di bank soal uji, `mulai_kuis` gagal dengan `BANK_SOAL_KURANG` yang menyebut nomornya, tidak ada soal kategori lain yang dipakai sebagai pengganti, dan tidak ada sesi atau timer yang dimulai.
- Soal pilihan ganda pernyataan (tanpa angka) dinilai benar hanya jika opsi bertanda `kunci` yang dipilih.
- Selama kuis, respons soal pilihan ganda hanya berisi `kode` dan `teks` opsi, tanpa `nilai` atau tanda kunci.
- Jawaban isian yang selisihnya masih dalam toleransi soal dinilai benar, dan yang di luar toleransi dinilai salah (diuji di batas toleransi).
- **KF-19:** untuk kunci Rp80.000, jawaban 79.999, 80.000, dan 80.001 benar, sedangkan 79.998 dan 80.002 salah. Untuk kunci 2,5%, jawaban 2,49 dan 2,51 benar, sedangkan 2,48 salah. Untuk kunci 8 bulan, jawaban 8,01 benar dan 8,02 salah. Uji yang sama berlaku di latihan dan kuis.
- **KF-19:** jawaban 0,06 dan 0,5 pada soal suku bunga (kunci 6) tetap terdiagnosis sebagai dua jenis kesalahan berbeda.
- **KF-16:** menekan Selesai Kuis selalu memunculkan dialog, baik saat masih ada soal kosong (jumlah dan nomornya disebut) maupun saat semua sudah dijawab. Memilih Kembali ke soal tidak mengumpulkan kuis, dan timer tetap berjalan.
- **KF-16:** dengan 2 jawaban di antrean offline, dialog menyebutkan "2 jawaban belum terkirim".
- **KF-16:** jika waktu habis saat dialog terbuka, kuis tetap terkumpul otomatis oleh server.
- **KF-16:** pengingat "Sisa waktu 5 menit" muncul tepat sekali, juga saat offline. Tidak ada pengingat lain, dan tanpa suara, kedip, atau warna merah. Membuka kuis saat sisa waktu di bawah 5 menit memunculkan pengingat sekali.
- **KF-22:** dari soal 3 siswa bisa pindah ke soal 18 lewat panel nomor, lalu kembali ke soal 3 dengan jawaban tetap terlihat.
- **KF-22:** mengganti jawaban soal 2 dari opsi D ke opsi B sebelum dikumpulkan membuat soal 2 dinilai berdasarkan opsi B. Perubahan yang baru diterima server setelah batas waktu tidak dipakai, dan jawaban terakhir sebelum batas waktu yang dinilai.
- **KF-22:** panel nomor menampilkan status Tersimpan / Belum terkirim / Belum dijawab dengan ikon dan teks, tidak pernah menampilkan benar/salah, dan tidak ada tombol ragu-ragu.
- **KF-22:** mengetuk nomor di dialog Selesai Kuis membuka soal itu, dan timer tetap berjalan.
- **KF-18:** setiap soal pilihan ganda di kuis menampilkan tepat 4 opsi A–D. Menyimpan soal pilihan ganda dengan 3 atau 5 opsi ditolak database.
- **KF-18:** dua siswa yang mendapat soal yang sama bisa melihat urutan opsi berbeda. Untuk siswa yang sama, urutan dan huruf tetap sama setelah keluar sementara, menutup browser, membuka dari perangkat lain, dan di halaman hasil.
- **KF-18:** jawaban dinilai berdasarkan `id` opsi. Memilih opsi kunci yang tampil di huruf mana pun dinilai benar, dan antrean offline yang berisi `id` opsi tetap dinilai benar setelah terkirim.
- **KF-17:** menekan ✕ atau tombol kembali Android di layar kuis memunculkan dialog keluar sementara. **Tetap di kuis** menutup dialog, sedangkan **Keluar sementara** membawa siswa ke Latihan tanpa mengumpulkan kuis.
- **KF-17:** keluar sementara di menit ke-10 lalu menekan Lanjutkan kuis di menit ke-15 melanjutkan sesi yang sama: soal dan jawaban tersimpan sama, sisa ±15 menit, dan jumlah percobaan tidak bertambah.
- **KF-17:** keluar sementara lalu menunggu sampai waktu habis membuat kuis terkumpul otomatis, dan kartu di Latihan/Beranda berubah menjadi pemberitahuan beserta tautan hasil.
- **KF-13:** setelah 2 percobaan dikumpulkan, percobaan ketiga ditolak `BATAS_PERCOBAAN_KUIS` tanpa membuat sesi baru.
- **KF-13:** menutup browser setelah kuis dimulai lalu membiarkan waktu habis tetap terhitung 1 percobaan. Hasilnya tersimpan dan tampil di Riwayat.
- **KF-13:** membuka kuis lagi saat percobaan masih berjalan melanjutkan sesi yang sama, dan jumlah percobaan tidak bertambah.
- **KF-13:** `BANK_SOAL_KURANG` atau gagal koneksi saat menekan Mulai Kuis tidak mengurangi kesempatan.
- **KF-13:** dua permintaan Mulai Kuis yang dikirim bersamaan tidak menghasilkan lebih dari 1 sesi baru, dan total sesi siswa tidak pernah lebih dari 2.
- **KF-13:** dengan nilai percobaan 1 = 70 dan percobaan 2 = 60, nilai utama yang tampil adalah 70, dan kedua nilai tampil di Riwayat.
- **KF-14:** dengan bank tepat 40 soal sesuai sebaran minimum, percobaan 1 dan 2 masing-masing berisi 20 soal, dan **tidak ada satu pun `soal_id` yang sama** di antara keduanya. Gabungan keduanya = seluruh 40 soal.
- **KF-14:** soal yang diterima di percobaan 1 tetapi tidak dijawab tetap tidak muncul lagi di percobaan 2.
- **KF-14:** bank dengan total 40 soal tetapi satu kombinasi di bawah minimum (misalnya konsep–mudah–PG hanya 3) membuat **percobaan pertama** pun gagal dengan `BANK_SOAL_KURANG` beserta kombinasi yang kurang, dan kesempatan tidak berkurang.
- **KF-14:** menonaktifkan satu soal setelah percobaan 1 sehingga satu nomor tidak punya kandidat baru membuat percobaan 2 gagal dengan `BANK_SOAL_KURANG`, tanpa memakai ulang soal percobaan 1 dan tanpa mengganti kategori.
- **KF-14 (pemisahan bank):** setiap sesi kuis hanya berisi soal `bank = 'kuis'`. Menambah atau mengaktifkan soal bank latihan dengan kombinasi yang sama tidak membuat bank kuis yang kurang menjadi "mencukupi".
- **KF-14 (pemisahan bank):** siswa yang mengerjakan banyak latihan sebelum kuis tetap mendapat pilihan soal kuis dan hasil pemeriksaan kecukupan yang sama persis dengan siswa yang tidak berlatih. Latihan tidak menulis ke `sesi_kuis_soal`.
- **KF-14 (pemisahan bank):** menyimpan soal latihan berbentuk pilihan ganda, atau soal kuis tanpa `kategori_kuis`, ditolak oleh batasan `CHECK` database.
- **KF-14:** dua permintaan Mulai Kuis bersamaan untuk percobaan 2 menghasilkan paling banyak 1 sesi baru, tanpa soal yang tumpang tindih dengan percobaan 1. Memasukkan soal yang sama dua kali untuk siswa yang sama langsung ke database ditolak oleh `UNIQUE (siswa_id, soal_id)`.

> Catatan verifikasi (13 November 2026): `src/halaman/kuis.js` (mulai/lanjutkan, layar soal, hasil) dan logika `src/logika/kuis.js` (timer dari `waktu_server`, pengingat sekali, antrean offline pilihan terakhir, status nomor, teks dialog; tes `tests/logika/kuisLatihan.test.js`). Fungsi server sudah diuji di `tests/db/kuis.test.js` dan dengan bank soal asli di `tests/db/bankSoal.test.js`. Tampilan 360 px (soal pilihan ganda, isian, pengingat, dialog Selesai Kuis, panel nomor, dialog keluar, hasil) diperiksa dengan Supabase tiruan. **Belum diuji di Supabase dan ponsel sungguhan:** keluar-masuk aplikasi, mode pesawat, tombol kembali Android, dan pengumpulan otomatis oleh server.

## Fase 10 — Riwayat dan Perkembangan (F-10)

- [x] Ringkasan kemajuan di Beranda (`ringkasan_kemajuan`), dengan **nilai kuis tertinggi** sebagai nilai utama dan sisa kesempatan kuis (KF-13)
- [x] Halaman Riwayat: nilai kuis tertinggi, nilai percobaan 1 dan 2 dengan tautan ke hasil masing-masing (KF-13), kesalahan tersering, aktivitas terbaru (`riwayat_belajar`)
- [x] Tautan "Ulangi" ke sub-bab yang terkait dengan kesalahan

> Catatan verifikasi (13 November 2026): Beranda dan `src/halaman/riwayat.js`, logika `src/logika/riwayat.js` (tes `tests/logika/riwayat.test.js`). Tampilan 360 px diperiksa dengan Supabase tiruan.

## Fase 11 — Simulasi dan Ilustrasi 3D (F-04)

- [x] Halaman Simulasi: masukan, rumus tersubstitusi, hasil, tabel
- [x] Ilustrasi 3D tumpukan koin dengan `import()` dinamis
- [x] Cadangan jika WebGL tidak tersedia, dan `dispose()` saat meninggalkan halaman

**Selesai jika:** ilustrasi tidak dimuat sebelum tombol ditekan (cek tab Network), dan halaman tetap lancar di Android kelas menengah.

> Catatan verifikasi (13 November 2026): `src/halaman/simulasi.js`, logika `src/logika/simulasi.js`, 3D `src/tiga-d/ilustrasiTabungan.js` (chunk terpisah, dimuat hanya setelah tombol ditekan). Tes `tests/logika/simulasi.test.js` memeriksa rumus tersubstitusi, maksimal 24 tumpukan, tanpa animasi otomatis, dispose, dan larangan impor three di luar `src/tiga-d/`. **Belum diuji di ponsel Android sungguhan** (kelancaran 3D dan sentuhan).

## Fase 12 — Fitur Tambahan (Could)

- [ ] F-11 Jelaskan dengan kata-katamu (`simpan_penjelasan`)

## Fase 12A — Pretest dan Posttest Mathematical Literacy (F-12, KF-05e)

Spesifikasi: PRD F-12. Fase ini **tidak bisa dimulai** sebelum prasyarat terpenuhi.

**Prasyarat**

- [x] KF-05e diputuskan: pretest/posttest di dalam aplikasi, 4 soal, 4 indikator, skor 0–6 per soal, total 24
- [x] PP-01 sampai PP-10 diputuskan (12 November 2026): instrumen Pak Aan, soal sama persis, satu kesempatan, tanpa batas waktu, penilaian per tahapan rubrik, skor terlihat dan pembahasan setelah posttest, penilaian otomatis, jawaban per tahapan, variasi penulisan, dan data lewat dasbor/CSV
- [x] Spesifikasi RPC tes di api.md 3.12 dan rancangan layar di design.md 5.11 diperbarui berdasarkan PP-01 sampai PP-10
- [ ] **PT-01:** file empat soal, kisi-kisi jawaban, dan rubrik Pak Aan diserahkan ke `referensi/`
- [ ] **PT-02:** rincian tahapan rubrik per soal (jumlah tahapan, poin, jenis jawaban) diambil dari rubrik
- [x] **PT-03:** diputuskan 12 November 2026 — Pilihan A, gabungan penilaian otomatis (tahapan matematis) dan manual oleh peneliti/guru (tahapan uraian dan yang tidak pasti), dengan status `otomatis`/`menunggu_manual`/`dinilai_manual`. Tambahan: jawaban kosong di semua tahapan otomatis bernilai 0 dan tidak masuk antrean manual (G7–G10).
- [x] **PT-08:** diputuskan 12 November 2026 — halaman penilaian khusus di Lanora, akses peneliti dan guru (bukan siswa), siswa hanya melihat "Sedang dinilai" tanpa skor sementara, koreksi skor otomatis dengan catatan wajib (skor sebelum/sesudah, alasan, penilai, waktu), satu penilai per jawaban
- [x] **PT-14 s.d. PT-17:** diputuskan 12 November 2026 — penilai masuk dengan email + kata sandi, akun dibuat peneliti lewat Supabase tanpa registrasi bebas, kredensial guru diberikan pribadi (PT-14); penilai tidak melihat nama/kode siswa tetapi tahu pretest/posttest (PT-15); skor manual boleh dikoreksi dengan riwayat yang tidak bisa diubah/dihapus (PT-16); guru hanya antrean + menilai, tanpa seluruh hasil/CSV, peneliti akses penuh (PT-17)
- [x] **PT-18 s.d. PT-20:** diputuskan 12 November 2026 — koreksi skor (otomatis dan manual) hanya oleh peneliti, guru hanya menilai antrean, M5 berlaku untuk penilaian pertama (PT-18); lupa kata sandi → hubungi peneliti, reset oleh peneliti lewat Supabase, tanpa reset email mandiri (PT-19); kata sandi minimal 12 karakter, kunci 5 menit setelah 5 kali gagal, peneliti dapat menonaktifkan akun guru (PT-20)
- [x] **PT-21 dan PT-22:** diputuskan 12 November 2026 — login penilai wajib lewat Edge Function `masuk-penilai` dengan rahasia server, penguncian tidak bisa dilewati lewat login langsung ke Supabase, reset oleh peneliti dengan alat pengelola khusus (PT-21); akun guru dinonaktifkan dengan `aktif = false` tanpa dihapus, login ditolak, sesi aktif dicabut, akun peneliti tidak ikut dinonaktifkan (PT-22)
- [x] **PT-23 dan PT-24:** diputuskan 12 November 2026 — akun Auth penilai memakai email internal yang tidak menerima email, login hanya lewat `masuk-penilai`, tanpa magic link/OTP (PT-23); rahasia terpisah `RAHASIA_PENILAI` (bukan `RAHASIA_KODE`), akun guru boleh diaktifkan kembali, hanya oleh peneliti, riwayat penilaian dipertahankan (PT-24)
- [ ] **PT-04 s.d. PT-07 dan PT-09 s.d. PT-13** dijawab (toleransi, bentuk setara, skor lanjutan, skor sebagian, urutan pelaksanaan, konfirmasi/offline, identitas di CSV, angka ambigu, rincian skor untuk siswa)

**Pekerjaan**

- [ ] Migrasi tabel `instrumen_tes`, `rubrik_tahap`, `hasil_tes` (`UNIQUE (siswa_id, jenis_tes)`), dan `jawaban_tahap_tes`, serta *view* penelitian (architecture.md bagian 6). Semuanya terpisah dari `soal`, `sesi_kuis`, dan `percobaan_jawaban`.
- [ ] Memasukkan empat soal, kisi-kisi, dan rubrik **persis** dari instrumen (PP-01, PP-02), lalu diperiksa ulang peneliti. Skrip pengisian memastikan jumlah poin tahapan per soal = 6.
- [ ] Modul **normalisasi jawaban tes** (PP-09): mengenali `Rp`, ribuan, desimal, `%`, satuan tahun/bulan/hari, dan **menandai angka ambigu** (PT-12). `uraiAngka` Fase 3 tidak diubah begitu saja, karena dipakai latihan dan kuis.
- [ ] **Pengurai ekspresi aritmetika aman** (tanpa `eval`) untuk tahapan `ekspresi`, dengan tes Vitest
- [ ] Edge Function `nilai-tes` (PT-03): penilaian otomatis tahapan `nilai`, `ekspresi`, dan `pilihan` yang hasilnya pasti (status `otomatis`), jawaban kosong di **semua jenis tahapan termasuk uraian** → `otomatis` skor 0 tanpa masuk antrean (G7–G9), tahapan `uraian` yang terisi dan tahapan terisi yang tidak pasti → `menunggu_manual` tanpa skor (G10)
- [ ] Penilaian manual (PT-03, PT-08): *view* `v_antrean_penilaian_manual`, pengisian skor oleh peneliti/guru (status `dinilai_manual`, skor 0 sampai maksimal tahapan, satu penilai dengan pemeriksaan `versi`), lalu perhitungan ulang skor soal dan total
- [ ] Tabel `penilai` (peran `peneliti`/`guru`, `nama_tampilan`) serta fungsi `adalah_penilai()` dan `adalah_peneliti()` (PT-17)
- [ ] Supabase Auth: **pendaftaran mandiri dimatikan** (PT-14). Pemulihan lewat email tidak dipakai (PT-19). Penyedia login telepon, OAuth, dan masuk anonim tidak diaktifkan (PT-23 E3).
- [ ] *Secret* `RAHASIA_PENILAI` dibuat (nilai acak, berbeda dari `RAHASIA_KODE`) dan disimpan sebagai *secret* Edge Function serta di `.env` lokal peneliti. Nama variabelnya (tanpa nilai) ditambahkan ke `.env.example` saat implementasi (PT-24 J1).
- [ ] Tabel `status_masuk_penilai` dan kolom `penilai.email_hash` (PT-21, PT-24)
- [ ] Edge Function `masuk-penilai` (api.md 3.13.0): kunci diperiksa lebih dulu, akun nonaktif ditolak, kata sandi turunan HMAC dihitung di server, respons gagal seragam, dan pembaruan kunci atomik (PT-20 S2, PT-21, PT-22 D2)
- [ ] Skrip `kelola-penilai.js` (dijalankan lokal oleh peneliti, *service role* + `RAHASIA_PENILAI` dari `.env` lokal): `buat` (email internal `<penilai.id>@penilai.mathsave.invalid`, kata sandi ≥ 12 karakter, kata sandi turunan, baris `penilai` dengan `email_hash`), `reset` (kata sandi baru ≥ 12 karakter, kosongkan kunci), `nonaktifkan` (khusus `guru`: `aktif = false` + cabut sesi, tanpa menghapus akun; menolak `peneliti`), dan `aktifkan` (khusus `guru`: `aktif = true` + kosongkan kunci). Fungsi Admin API untuk mencabut sesi diperiksa di dokumentasi resmi Supabase saat implementasi.
- [ ] Prosedur peneliti tertulis (tanpa kredensial) untuk membuat akun, mereset kata sandi, dan menonaktifkan akun guru setelah penelitian
- [ ] Tabel `koreksi_skor` (*append-only*, `UPDATE`/`DELETE` dicabut + pemicu penolak) dan *view* `v_koreksi_skor` khusus peneliti (PT-16 K3)
- [ ] RPC penilai (api.md 3.13): `profil_penilai`, `ambil_antrean_penilaian`, `ambil_tahap_untuk_dinilai`, `simpan_nilai_manual` [penilai]; `koreksi_skor` (otomatis dan dinilai_manual, alasan wajib), `cari_tahap_untuk_koreksi`, `riwayat_koreksi` [peneliti]. Tidak ada respons yang memuat identitas siswa (PT-15).
- [ ] Halaman penilaian (design.md 5.12): layar masuk penilai, antrean anonim dengan label Pretest/Posttest, menilai satu tahapan, dan koreksi skor dengan riwayat (hanya untuk peneliti). Rute `#/penilai/...` tidak muncul di navigasi siswa.
- [ ] Layar hasil siswa: hanya "Sedang dinilai" tanpa angka skor selama `menunggu_penilaian_manual` (PT-08 M3)
- [ ] RPC `mulai_tes` (lanjutkan tanpa percobaan baru), `simpan_jawaban_tahap`, `selesaikan_tes`, `ambil_hasil_tes` (api.md 3.12)
- [ ] Layar soal per tahapan dan layar hasil (design.md 5.11), tanpa hitung mundur
- [ ] *View* penelitian dan pengunduhan CSV dari dasbor Supabase (PP-10). Pastikan tombol unduh CSV tersedia di paket Free.

**Selesai jika:**

- Empat soal tampil sama persis dengan instrumen (diperiksa peneliti kata per kata, termasuk gambar/tabel), dalam urutan yang sama untuk pretest dan posttest (PP-02).
- Soal instrumen tidak pernah muncul di latihan, kuis, kisi-kisi, atau pemeriksaan kecukupan bank soal. Soal latihan/kuis juga tidak muncul di tes (T8).
- **PP-03:** menutup browser di tengah pretest lalu membukanya lagi → tes yang sama berlanjut dengan jawaban tersimpan, `mulai_pada` tidak berubah, dan tidak ada baris `hasil_tes` kedua. Setelah selesai, `mulai_tes('pretest')` ditolak `TES_SUDAH_SELESAI`.
- **PP-04:** tidak ada hitung mundur. `mulai_pada` dan `selesai_pada` tercatat dengan waktu server.
- **PP-05:** jumlah poin tahapan setiap soal = 6, skor soal 0–6, dan total 0–24. Nilai di luar rentang ditolak database.
- **PP-06:** setelah pretest selesai, siswa melihat skor tetapi respons tidak memuat kunci/pembahasan. Setelah posttest selesai, pembahasan tersedia.
- **PP-07:** jawaban yang hanya berisi jawaban akhir benar (tahapan lain kosong) **tidak** mendapat skor penuh, hanya poin tahapan jawaban akhir. Jawaban yang hanya berisi kata kunci tanpa nilai yang benar tidak mendapat poin tahapan angka.
- **PP-08:** jawaban tersimpan per tahapan, dan CSV menampilkan skor setiap tahapan.
- **PP-09:** untuk kunci 400.000 rupiah, `400000`, `400.000`, `Rp400.000`, `Rp 400.000`, dan `400.000,00` dinilai setara. `40.000` salah. `1.500` (jika ambigu menurut PT-12) **tidak** diberi skor karangan.
- **PP-10:** CSV memuat jenis tes, waktu mulai, waktu selesai, durasi, skor setiap tahapan, skor per soal, dan total. Pretest dan posttest siswa yang sama bisa dipasangkan.
- **PT-03:** jawaban yang tidak bisa dikenali atau ambigu → status `menunggu_manual`, skor kosong, dan `skor_total` tidak diisi. Sistem tidak memberi skor otomatis.
- **PT-03:** tahapan uraian yang diisi siswa selalu `menunggu_manual`, dan tidak pernah dinilai otomatis (termasuk dari kata kunci).
- **PT-03 G7–G9 (jawaban kosong):** di **pretest dan posttest**, setiap tahapan kosong, baik `nilai`, `ekspresi`, `pilihan`, maupun `uraian` (termasuk isian yang hanya spasi), berstatus `otomatis` dengan skor 0 dan **tidak muncul** di `v_antrean_penilaian_manual`. Siswa yang mengosongkan semua tahapan uraian, dengan tahapan lain pasti, langsung mendapat status tes `dinilai`.
- **PT-03 G10:** isian yang terisi tetapi tidak pasti (misalnya "-", "?", atau `1.500` yang ambigu) **tidak** dianggap kosong, dan masuk `menunggu_manual`.
- **PT-03:** setelah peneliti mengisi semua tahapan `menunggu_manual`, status tahapan menjadi `dinilai_manual`, status tes menjadi `dinilai`, dan `skor_total` = jumlah skor otomatis + manual (maks 24). Skor manual di luar rentang tahapan ditolak.
- **PT-03:** siswa tidak bisa mengubah skor atau status penilaian lewat RPC atau akses langsung.
- **PT-08 M2:** akun siswa yang memanggil RPC penilai mana pun ditolak `BUKAN_PENILAI`, dan membuka rute `#/penilai` tidak menampilkan data. Akun guru dan peneliti aktif bisa memakai halaman penilaian. Penilai nonaktif ditolak.
- **PT-08 M3:** selama tes `menunggu_penilaian_manual`, respons `ambil_hasil_tes` siswa **tidak memuat angka skor apa pun** (termasuk soal yang dinilai otomatis), dan layar hanya menampilkan "Sedang dinilai". Setelah tahapan terakhir dinilai, skor gabungan tampil.
- **PT-08 M4:** koreksi skor otomatis (oleh peneliti) tanpa alasan ditolak. Koreksi yang sah menghasilkan satu baris `koreksi_skor` berisi skor sebelum, skor sesudah, alasan, penilai, dan waktu server. Tahapan menjadi `dinilai_manual`, dan skor soal/total ikut berubah. Baris `koreksi_skor` tidak bisa diubah atau dihapus.
- **PT-08 M5:** dua penilai yang menyimpan nilai tahapan yang sama hampir bersamaan → hanya yang pertama tersimpan, dan yang kedua menerima `SUDAH_DINILAI`.
- **PT-14:** tidak ada cara mendaftar akun penilai dari aplikasi atau lewat `signUp` (ditolak karena pendaftaran mandiri mati). Akun siswa yang masuk di layar penilai ditolak `BUKAN_PENILAI`.
- **PT-15:** respons semua RPC penilai, termasuk yang dipanggil peneliti, tidak memuat `siswa_id`, nama panggilan, kode siswa, atau kelas (diperiksa di tab Network). Label Pretest/Posttest tampil. Di database, `hasil_tes.siswa_id` tetap terisi.
- **PT-16:** skor `dinilai_manual` bisa dikoreksi peneliti. Koreksi menghasilkan baris `koreksi_skor` berisi skor lama, skor baru, `status_sebelum`, alasan, penilai, dan waktu server. Koreksi kedua atas tahapan yang sama menambah baris baru, bukan menimpa. `UPDATE`/`DELETE` atas `koreksi_skor`, bahkan oleh peneliti, ditolak.
- **PT-17:** akun guru yang memanggil `koreksi_skor`, `cari_tahap_untuk_koreksi`, atau `riwayat_koreksi` ditolak `BUKAN_PENELITI`. Guru tidak bisa membaca *view* penelitian, `v_koreksi_skor`, atau tabel hasil secara langsung. Guru tidak bisa membuka tahapan yang tidak berstatus `menunggu_manual`.
- **PT-18:** peneliti bisa mengoreksi tahapan yang sudah dinilai guru, tanpa ditolak `SUDAH_DINILAI`. Baris `koreksi_skor` mencatat `dinilai_oleh_sebelum` = guru tersebut. Guru yang mencoba mengoreksi ditolak `BUKAN_PENELITI`.
- **PT-19:** layar masuk penilai tidak punya tautan reset, dan frontend tidak memanggil `resetPasswordForEmail`. Setelah peneliti mereset, kata sandi lama ditolak dan kata sandi baru diterima.
- **PT-20 S1:** membuat atau mereset akun penilai dengan kata sandi kurang dari 12 karakter ditolak.
- **PT-20 S2:** 5 kali kata sandi salah berurutan → percobaan ke-6, **bahkan dengan kata sandi benar**, ditolak `TERLALU_BANYAK_PERCOBAAN` selama 5 menit. Setelah 5 menit, login benar berhasil. Email tidak terdaftar, kata sandi salah, dan akun nonaktif memberi respons yang sama.
- **PT-21 L2–L3:** memanggil layanan login Supabase langsung (`signInWithPassword` dengan kunci publik) memakai email dan kata sandi penilai yang **benar** tetap gagal, karena kata sandi Auth adalah kata sandi turunan. Hasil build frontend tidak memuat `RAHASIA_PENILAI` maupun `RAHASIA_KODE`, dan kata sandi tidak tersimpan di `localStorage` atau log.
- **PT-21 L4:** setelah `kelola-penilai.js reset`, kata sandi lama ditolak, kata sandi baru diterima, dan kunci akun kosong. Kata sandi kurang dari 12 karakter ditolak skrip.
- **PT-22 D1–D3:** setelah `nonaktifkan`, login guru ditolak `MASUK_PENILAI_GAGAL`, token penyegar lama tidak bisa memperpanjang sesi, dan RPC dari sesi yang masih terbuka ditolak `BUKAN_PENILAI`. Akun Auth dan baris `penilai` masih ada, dan nilai serta riwayat yang pernah dibuat guru itu tetap utuh.
- **PT-22 D4:** `nonaktifkan` untuk akun peneliti ditolak skrip, dan akun peneliti tetap bisa masuk.
- **PT-23:** email akun penilai di `auth.users` adalah email internal `.invalid`, dan email asli tidak ada sebagai teks di tabel mana pun. Meminta magic link/OTP untuk email asli maupun email internal tidak menghasilkan sesi. Hasil build frontend tidak memuat `signInWithOtp`, `signInWithPassword`, atau `resetPasswordForEmail` untuk alur penilai.
- **PT-24 J1–J2:** mengganti `RAHASIA_KODE` di lingkungan uji tidak memengaruhi login penilai, dan mengganti `RAHASIA_PENILAI` tidak memengaruhi login siswa. Hasil build frontend tidak memuat `RAHASIA_PENILAI`.
- **PT-24 J3–J5:** guru yang dinonaktifkan lalu diaktifkan kembali bisa masuk lagi, dan semua nilai, `dinilai_oleh`, serta riwayat koreksi sebelumnya masih sama. Akun guru tidak bisa mengubah `penilai.aktif` miliknya atau milik orang lain lewat RPC maupun akses tabel langsung.
- **PT-03:** CSV menampilkan status penilaian setiap tahapan, sehingga skor otomatis dan manual bisa dibedakan.
- Siswa lain tidak bisa membaca hasil tes siswa tersebut (RLS), dan kunci rubrik tidak pernah muncul di respons jaringan siswa.

## Fase 13 — Pengujian

- [ ] Tes Vitest lulus
- [ ] Uji di minimal 2 perangkat Android (layar ±360 px dan ±412 px)
- [ ] Pemeriksaan kontras warna dan ukuran area sentuh (NF-04)
- [ ] Pemeriksaan keamanan: tidak ada kunci rahasia di hasil build frontend, RLS aktif (NF-05)
- [ ] Uji coba dengan siswa (setelah KF-06) lewat link Netlify (deploy Fase 14 dilakukan lebih dulu), dengan urutan penelitian KF-05e: **pendaftaran pertama → pretest → pembelajaran** (login, belajar sub-bab, latihan, kuis) **→ posttest**
- [ ] Kuesioner SUS dan wawancara singkat setelah uji coba (PRD bagian 11)
- [ ] Mengambil data pretest dan posttest untuk analisis penelitian lewat dasbor Supabase/CSV (PP-10)
- [ ] Mencatat temuan dan perbaikan
- [ ] Meninjau ulang **RS-02** (pendaftaran pertama didahului orang lain): catat apakah ada akun yang didaftarkan bukan oleh pemiliknya, dan berapa yang harus di-reset
- [ ] Meninjau ulang **RS-01** (penguncian akun sengaja oleh orang yang mengetahui kode siswa lain) berdasarkan kejadian selama uji coba. Hasilnya dicatat: risiko tetap diterima, atau diusulkan keputusan baru kepada pengembang.

## Fase 14 — Peluncuran

> **Catatan urutan:** uji coba dengan siswa (Fase 13) dilakukan lewat link Netlify, jadi langkah deploy Netlify di bawah perlu selesai **sebelum** uji coba Fase 13.

- [ ] Memeriksa ulang ketentuan paket gratis Supabase dan **Netlify Free** (300 credits per bulan, hard limit, 15 credits per production deploy) di halaman resmi, lalu mencatat tanggal pemeriksaan
- [ ] Memastikan environment variables per situs tersedia di Netlify Free (belum disebutkan di halaman yang diperiksa 12 November 2026). Jika tidak tersedia, cara alternatifnya dibahas dengan pengembang tanpa menaruh kunci rahasia di repositori.
- [ ] Menyiapkan repositori GitHub proyek (dengan persetujuan pengembang) sebagai **repositori privat** (wajib, karena dokumen memuat kode kelas, KF-05d), dan memastikan `.env` tidak ikut terunggah
- [ ] Memastikan Netlify Free bisa terhubung ke repositori GitHub **privat** (belum diperiksa di halaman resmi). Jika tidak bisa, bahas dengan pengembang sebelum mengubah apa pun.
- [ ] Membuat situs di **Netlify Free** dan menghubungkannya ke repositori GitHub (KF-01)
- [ ] Konfigurasi build Netlify: build command `npm run build`, publish directory `dist`, Node ≥ 22.12
- [ ] Mengatur environment variables build Netlify: `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` saja. `RAHASIA_KODE`, `RAHASIA_PENILAI`, dan `SUPABASE_SERVICE_ROLE_KEY` **tidak** dimasukkan ke Netlify.
- [ ] Menetapkan cara deploy yang hemat credits selama penelitian, misalnya membatasi production deploy dan menguji dulu dengan Deploy Preview (0 credits)
- [ ] Uji link Netlify di HP Android dan laptop: halaman terbuka lewat HTTPS, semua rute hash berjalan, dan koneksi ke Supabase berhasil
- [ ] Pemantauan credits Netlify selama penelitian: cek saldo sebelum dan sesudah setiap sesi uji coba, lalu catat jumlah deploy dan sisa credits
- [ ] Deploy frontend sesuai keputusan KF-01 (Netlify Free)
- [ ] Mengatur *secret* Edge Function di Supabase
- [ ] Membuat akun dan membagikan kode siswa (`S001`, …) sebelum uji coba, lalu mengumumkan kode kelas kepada peserta (KF-05d). PIN tidak dibagikan, karena dibuat sendiri oleh siswa.
- [ ] Menjadwalkan **sesi pendaftaran pertama bersama di kelas dengan pendampingan peneliti** (KF-05d, mitigasi RS-02), dan memastikan setiap siswa mendaftarkan akunnya sendiri.
- [ ] Memperbarui README dengan cara menjalankan dan alamat aplikasi
- [ ] Mencatat prosedur memulihkan proyek Supabase yang dijeda
