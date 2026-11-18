# AGENTS.md — Panduan untuk Asisten AI dan Pengembang

> **Catatan nama:** Lanora sebelumnya bernama **MathSave** (nama diganti 12 November 2026). Wawancara, keputusan, dan dokumen sebelum tanggal itu memakai nama MathSave. Pengenal teknis lama sengaja tidak diubah agar akun dan data siswa tetap aman: domain email internal `siswa.mathsave.invalid` dan `penilai.mathsave.invalid`, nama paket npm `mathsave`, kunci `mathsave:pesan-singkat`, komentar di file migrasi, dan nama folder proyek.

Berkas ini berisi aturan kerja untuk asisten AI (atau siapa pun) yang mengerjakan kode Lanora. Baca berkas ini sebelum mengubah apa pun.

## 1. Sumber Kebenaran

Dokumen di `docs/` adalah acuan utama. Jika kode dan dokumen berbeda, **dokumen yang diikuti**, atau tanyakan dulu ke pengembang.

| Pertanyaan | Lihat |
|---|---|
| Fitur apa dan mengapa? | [docs/PRD.md](docs/PRD.md) |
| Struktur folder, tabel, keamanan | [docs/architecture.md](docs/architecture.md) |
| Warna, layout, teks, animasi | [docs/design.md](docs/design.md) |
| Nama fungsi, parameter, respons | [docs/api.md](docs/api.md) |
| Urutan pekerjaan | [docs/task.md](docs/task.md) |

Jika sebuah perubahan mengubah perilaku yang tertulis di dokumen, perbarui dokumen terkait dalam perubahan yang sama.

## 2. Status Proyek

- Tahap saat ini: **Fase 4 (database) dan Fase 5 (login kode siswa) selesai di tingkat kode dan tes lokal.** Migrasi `…0001`–`…0004` sudah terpasang di proyek Supabase (Tahap 0 Fase 5A). **Fase 5A (KF-05f: username + pilihan kelas) disetujui. Tahap 0–5 selesai: migrasi `…0005`, logika Edge Function username di `_bersama/`, skrip pengelola (`reset-pin.js` per username, `kelola-kelas.js`), dan frontend username (Masuk, Daftar dua langkah, Buat PIN baru, sapaan Beranda) diuji lokal, tetapi belum dijalankan atau di-deploy ke Supabase. Tahap 6–7 menunggu persetujuan pengembang.** Perbaikan keamanan login 12 November 2026 (migrasi `…0006` penguncian bertingkat + batas IP tepercaya, galat Auth 429, header `apikey`) selesai di tingkat kode dan tes lokal, belum dijalankan di Supabase (api.md 2e.8). **Fase 6–11 (13 November 2026):** materi, bank soal (`supabase/seed/soal.sql`, 60 latihan + 40 kuis), latihan, kuis, riwayat, dan simulasi selesai di tingkat kode dan tes lokal. Isi materi dan bank soal berstatus DRAF sampai diperiksa dosen/guru; soal.sql belum dijalankan di Supabase (task.md Fase 6–11). Semua panggilan RPC siswa dari frontend lewat `src/layanan/api.js`. `buat-siswa.js` hanya untuk akun lama, dengan tanda `--akun-lama-kode-siswa`. Jangan mengubah kode login sebelum diminta.
- **Akun siswa sejak KF-05f:** daftar dengan kode kelas `230706` → pilih kelas → username → PIN + konfirmasi; login dengan username + PIN. Kode siswa `S001` tidak dipakai untuk akun baru.
  - Username unik global, disimpan **huruf kecil**, dijaga `UNIQUE` + `CHECK` di database, dan sekaligus nama tampilan. Username termasuk identitas, jadi **tidak boleh** sampai ke penilai (PT-15).
  - Daftar kelas (VII–XII) diatur peneliti lewat `kelola-kelas.js`. **Jangan mengarang daftar kelas** dan jangan menghapus kelas.
  - Batas pendaftaran per IP: 60 akun baru dan 20 kode kelas salah per jam. Login tetap tanpa batas IP.
  - Sasaran penelitian tetap SMP kelas VIII.
  - Di proyek ini `service_role` **tidak** punya hak tabel langsung. Edge Function dan skrip hanya memakai fungsi RPC.
  - Jangan pernah menghapus akun atau data belajar siswa. Gunakan `aktif = false`.
- Logika Edge Function ditulis di `supabase/functions/_bersama/` sebagai modul murni dan diuji Vitest. File `index.js` tiap fungsi dan `alatSupabase.js` hanya pembungkus Deno. Aturan format kode/PIN hanya ada di `_bersama/kodeSiswa.js`, dan frontend mengimpor file yang sama.
- Jangan mengerjakan fase berikutnya sebelum pengembang meminta.
- Setiap halaman di `src/halaman/` mengekspor `tampilkan(wadah, parameter)`. Fungsi ini boleh mengembalikan fungsi bersih-bersih yang dipanggil router saat siswa pindah halaman. Rute baru didaftarkan di `src/rute.js`.
- Kerjakan sesuai urutan fase di [docs/task.md](docs/task.md). Tandai `[x]` hanya untuk tugas yang benar-benar selesai dan teruji.
- Hal yang belum dikonfirmasi (KF-01 sampai KF-09 di PRD bagian 12) **jangan diputuskan sendiri**. Gunakan nilai asumsi yang tertulis dan beri komentar `// KF-xx` di kode.

## 3. Data Wawancara

- File `referensi/HASIL WAWANCARA ALPRO.docx` adalah data penelitian. **Jangan diubah, dipindahkan, atau dihapus.**
- Jangan mengarang isi wawancara. Setiap klaim tentang kebutuhan siswa harus merujuk kode pertanyaan (misalnya EL03, GL03) yang ada di PRD bagian 2.
- Wawancara hanya melibatkan satu informan (S01). Jangan menulis seolah-olah datanya mewakili banyak siswa.
- Jangan memakai atau menyalin foto dokumentasi informan ke dalam aplikasi.

## 4. Aturan Antarmuka

- **Semua teks yang dilihat siswa berbahasa Indonesia**, menyapa dengan "kamu", kalimat pendek. Lihat [docs/design.md](docs/design.md) bagian 10.
- Nama variabel, fungsi, dan file juga memakai bahasa Indonesia (`hitungBunga`, `uraiAngka`, `halaman/latihan.js`). Kata kunci teknis yang lazim boleh tetap bahasa Inggris.
- Pakai hanya token warna dari `src/gaya/utama.css`. **Jangan menambah warna baru.** Hijau/merah hanya untuk umpan balik.
- **Jangan menambah animasi dekoratif**, maskot, konfeti, atau informasi yang tidak berhubungan dengan materi (EL03, DS03).
- Satu layar, satu tujuan. Jangan menumpuk banyak blok informasi di satu layar.
- Area sentuh minimal 48 × 48 px. Uji di lebar 360 px.
- Istilah matematika konsisten: modal, suku bunga, bunga, lama menabung, tabungan akhir.

## 5. Aturan Three.js

- Three.js **hanya** dipakai di halaman Simulasi untuk ilustrasi tumpukan koin (F-04).
- Wajib dimuat dengan `import()` dinamis setelah siswa menekan tombol. Jangan diimpor di `main.js`.
- Tanpa animasi otomatis, maksimal 24 tumpukan, ada cadangan jika WebGL tidak tersedia, panggil `dispose()` saat keluar halaman.
- Jangan memakai Three.js untuk latar, logo, atau dekorasi.

## 6. Aturan Matematika

- Semua rumus hanya ada di `src/logika/bungaTunggal.js`. Jangan menulis ulang rumus di file lain.
- Suku bunga dianggap **per tahun** kecuali soal menyebut lain (AS-04).
- `HARI_PER_TAHUN = 365` sesuai keputusan KF-02 (1 tahun = 365 hari). Jangan mengirim nilai `hariPerTahun` lain dari kode aplikasi.
- Notasi rumus mengikuti KF-03: M, B, p, t, A; B = M × (p/100) × t; A = M + B (PRD F-02).
- Pembulatan Rupiah hanya saat ditampilkan (KF-09).
- Setiap fungsi di `src/logika/` wajib punya tes Vitest. Jalankan tes sebelum menyatakan pekerjaan selesai.
- Jangan mengubah isi soal atau pembahasan tanpa persetujuan pengembang, karena isinya akan diperiksa dosen/guru.

### Instrumen pretest/posttest (KF-05e, PP-01 sampai PP-10)

- Empat soal, kisi-kisi jawaban, dan rubrik **berasal dari instrumen Pak Aan**. **Jangan membuat, menyunting, meringkas, atau mengurutkan ulang** soal, kisi-kisi, maupun rubrik (PP-01, PP-02). Jika file instrumen belum ada (PT-01), berhenti dan minta filenya.
- Instrumen disimpan terpisah dari bank soal latihan/kuis (tabel `soal`), dan tidak boleh dicampur.
- Penilaian otomatis (PP-07): periksa **kesetaraan nilai matematika**, bukan kesamaan teks. **Pencocokan kata kunci tidak boleh menjadi satu-satunya dasar skor.**
- **Jangan mengarang skor.** Jawaban yang ambigu atau tidak dapat dikenali, serta semua tahapan uraian, diberi status `menunggu_manual` tanpa skor untuk dinilai peneliti/guru (PT-03). Skor total tidak diisi sampai penilaian manual selesai.
- Status penilaian tahapan hanya `otomatis`, `menunggu_manual`, atau `dinilai_manual`. Skor akhir adalah gabungan skor otomatis dan manual.
- Jawaban **kosong** (tidak diisi atau hanya spasi) di semua tahapan, termasuk uraian, otomatis bernilai 0 dan tidak masuk antrean manual, di pretest maupun posttest (PT-03 G7–G9). Isian lain, misalnya "-" atau "?", **bukan** jawaban kosong.
- Jawaban akhir yang benar **tidak** memberi skor penuh. Setiap tahapan dinilai sesuai bobot rubrik (PP-05).
- Jangan memakai `eval` atau `new Function` untuk menghitung ekspresi jawaban siswa. Gunakan pengurai aritmetika yang aman.
- Kunci rubrik **tidak pernah** dikirim ke perangkat siswa. Pembahasan baru tersedia setelah posttest siswa selesai (PP-06).
- **Halaman penilaian (PT-08)** hanya untuk peran penilai (peneliti/guru). Setiap fungsi penilaian **wajib** memeriksa `adalah_penilai()` di server, dan fungsi khusus peneliti memeriksa `adalah_peneliti()`. Menyembunyikan menu di frontend bukan pengaman.
- **Akun penilai (PT-14, PT-19, PT-20):** masuk dengan email + kata sandi. Akun hanya dibuat peneliti lewat Supabase. Jangan membuat halaman atau fungsi pendaftaran penilai, dan pendaftaran mandiri Supabase tetap mati. **Jangan pernah** menulis email/kata sandi penilai di kode, repositori, dokumen, atau contoh.
  - Kata sandi minimal 12 karakter.
  - **Login penilai hanya lewat Edge Function `masuk-penilai`** (PT-21, PT-23). Frontend **tidak boleh** memanggil `signInWithPassword`, `signInWithOtp`, atau `resetPasswordForEmail` untuk penilai, dan tidak ada magic link/OTP. Akun Auth penilai memakai **email internal** `.invalid`. Email asli hanya disimpan sebagai `email_hash`.
  - Kata sandi Auth penilai adalah turunan HMAC dengan **`RAHASIA_PENILAI`** (PT-24). **Jangan memakai `RAHASIA_KODE` untuk penilai**, dan jangan memakai `RAHASIA_PENILAI` untuk siswa. Kata sandi asli dan kedua rahasia tidak pernah ada di frontend, `localStorage`, repositori, atau log.
  - Penguncian 5 kali gagal → 5 menit **diperiksa di server** sebelum kata sandi, dan tidak boleh bisa dilewati lewat login langsung ke Supabase.
  - **Tidak ada** reset kata sandi lewat email (`resetPasswordForEmail`) dan tidak ada tautan "Lupa kata sandi". Reset, pembuatan akun, dan penonaktifan hanya lewat skrip `kelola-penilai.js` di komputer peneliti, bukan lewat aplikasi atau endpoint publik.
  - **Penonaktifan (PT-22):** akun guru dinonaktifkan dengan `penilai.aktif = false` dan sesinya dicabut, **bukan** dihapus, agar riwayat penilaian tetap utuh. `masuk-penilai` menolak akun nonaktif. Akun peneliti tidak dinonaktifkan. Akun guru boleh diaktifkan kembali (PT-24). Hanya peneliti yang mengaktifkan atau menonaktifkan, lewat skrip pengelola. Jangan membuat RPC, endpoint, atau tombol untuk itu, dan riwayat penilaian tidak boleh berubah.
- **Anonimitas (PT-15):** fungsi dan layar penilai **tidak boleh** mengembalikan atau menampilkan `siswa_id`, nama panggilan, kode siswa, atau kelas. Yang boleh hanya jenis tes (pretest/posttest). Hubungan jawaban dengan siswa tetap disimpan di database.
- **Hak akses guru (PT-17):** guru hanya melihat antrean penilaian manual dan menilai. Guru tidak boleh melihat seluruh hasil, *view* penelitian, riwayat koreksi, atau CSV. Peneliti memiliki akses penuh.
- **Koreksi skor (PT-08 M4, PT-16):** skor `otomatis` maupun `dinilai_manual` boleh dikoreksi **hanya oleh peneliti** (PT-18). Guru hanya menilai jawaban di antrean. Setiap koreksi **wajib** dicatat di `koreksi_skor` (skor lama/baru, alasan, penilai, waktu server). Tabel ini tidak boleh diubah atau dihapus. Satu jawaban dinilai satu penilai pada **penilaian pertama** (M5). Koreksi peneliti adalah proses terpisah.
- Selama penilaian manual belum selesai, jangan mengirim angka skor apa pun ke siswa. Siswa hanya melihat "Sedang dinilai".
- **Tidak memakai model AI atau layanan luar** untuk menilai jawaban. PT-03 memilih penilaian manual oleh peneliti/guru untuk tahapan uraian. Perubahan ini butuh keputusan baru dari pengembang.

## 7. Aturan Supabase dan Keamanan

- **RLS wajib aktif** di semua tabel. Peran `anon` tidak boleh mengakses tabel atau fungsi apa pun.
- Frontend tidak boleh membaca tabel `soal` secara langsung. Kunci jawaban, pembahasan, dan pola kesalahan hanya keluar lewat RPC sesuai [docs/api.md](docs/api.md).
- Fungsi RPC mengambil identitas siswa dari `auth.uid()`, **bukan** dari parameter.
- **Jangan pernah** menaruh `SUPABASE_SERVICE_ROLE_KEY`, kunci *secret*, `RAHASIA_KODE`, `RAHASIA_PENILAI`, atau `KODE_KELAS_HASH` di frontend, di repositori, atau di contoh kode. Hanya `VITE_SUPABASE_URL` dan kunci publik/anon yang boleh ada di frontend.
- Perubahan skema dibuat sebagai file migrasi baru di `supabase/migrations/`. Jangan mengubah migrasi lama yang sudah dijalankan.
- Setiap tabel atau fungsi baru wajib diuji di `tests/db/` (PGlite). Akhiri setiap migrasi dengan `revoke all on all functions in schema public from public, anon, authenticated;` lalu `grant execute` hanya untuk RPC yang terdaftar di api.md. Hak `EXECUTE` bawaan PUBLIC tidak hilang hanya dengan *default privileges* per schema. Simulasi Supabase hanya ada di `tests/db/bantuDb.js`, tidak di migrasi.
- Data pribadi siswa minimal: nama panggilan dan kelas.

## 8. Biaya dan Layanan Luar

- Gunakan paket gratis atau berbiaya rendah. **Jangan menyatakan sebuah layanan gratis sebelum memeriksa ketentuan resminya**, dan catat tanggal pemeriksaannya.
- Jangan menambah layanan atau pustaka pihak ketiga baru tanpa persetujuan pengembang.
- Patok versi pustaka secara tepat di `package.json`.

## 9. Gaya Kode

- JavaScript ES Modules, tanpa framework UI besar (AS-07).
- Satu file per halaman di `src/halaman/`. Semua panggilan Supabase lewat `src/layanan/`.
- Fungsi pendek dan diberi nama yang menjelaskan tujuannya. Komentar dalam bahasa Indonesia untuk bagian yang tidak jelas dengan sendirinya.
- Tangani galat jaringan dan tampilkan pesan dari [docs/api.md](docs/api.md) bagian 4.

## 10. Perintah

Node.js ≥ 22.12. Jika `node` tidak dikenali di terminal Windows, tambahkan `C:\Program Files\nodejs` ke PATH.

| Perintah | Kegunaan |
|---|---|
| `npm install` | Memasang dependensi |
| `npm run dev` | Server pengembangan (http://localhost:5173, juga bisa dibuka dari ponsel di Wi-Fi yang sama) |
| `npm test` | Menjalankan tes Vitest (`tests/**/*.test.js`), termasuk tes database di PGlite (`tests/db/`) |
| `npm run build` | Build produksi ke `dist/` |
| `npm run preview` | Mencoba hasil build |

Tambah dependensi selalu dengan `--save-exact` agar versi terpatok.
