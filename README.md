# Lanora

> **Catatan nama:** Lanora sebelumnya bernama **MathSave** (nama diganti 12 November 2026). Wawancara, keputusan, dan dokumen sebelum tanggal itu memakai nama MathSave. Pengenal teknis lama sengaja tidak diubah agar akun dan data siswa tetap aman: domain email internal `siswa.mathsave.invalid` dan `penilai.mathsave.invalid`, nama paket npm `mathsave`, kunci `mathsave:pesan-singkat`, komentar di file migrasi, dan nama folder proyek.

Aplikasi web pembelajaran **Bunga Tunggal dan Tabungan** untuk siswa SMP kelas VIII, dirancang untuk smartphone Android.

> **Status: Fase 3 (logika matematika) selesai.** Kerangka aplikasi, router, navigasi bawah, serta fungsi rumus dan tesnya sudah ada. Materi, login, dan koneksi Supabase belum dikerjakan.

| | |
|---|---|
| Pengembang | Eneng Wulan Sari (NIM 2225250197) |
| Program studi | Pendidikan Matematika |
| Mata kuliah | Algoritma dan Pemrograman (Alpro) |

## Tentang Aplikasi

Lanora membantu siswa memahami bunga tunggal dan tabungan secara bertahap. Rancangannya berdasarkan hasil wawancara siswa dan dianalisis dengan **Cognitive Load Theory**. Tujuannya adalah meningkatkan **literasi matematis**, yaitu kemampuan memahami soal cerita, memilih rumus, menghitung, dan memeriksa kewajaran jawaban.

### Fitur yang direncanakan

| Kode | Fitur |
|---|---|
| F-01 | Masuk dengan kode siswa + PIN (KF-05) |
| F-02 | Materi bertahap (pemanasan prasyarat + 6 sub-bab) |
| F-03 | Rumus dan contoh soal langkah demi langkah |
| F-04 | Simulasi bunga tunggal dan tabungan, dengan ilustrasi 3D pendukung |
| F-05 | Soal cerita kehidupan sehari-hari dengan panel Pahami Soal |
| F-06 | Latihan soal bertingkat |
| F-07 | Kuis |
| F-08 | Petunjuk bertahap |
| F-09 | Penjelasan kesalahan |
| F-10 | Riwayat dan perkembangan belajar |
| F-11 | Jelaskan dengan kata-katamu (opsional) |
| F-12 | Pretest dan posttest Mathematical Literacy di dalam aplikasi (instrumen penelitian, 4 soal, skor 0–24; KF-05e) |

Urutan pemakaian dalam penelitian: **pendaftaran pertama → pretest → pembelajaran dengan Lanora → posttest**. Soal pretest/posttest adalah instrumen penelitian tersendiri dan terpisah dari soal latihan maupun kuis. Aturan pelaksanaannya sudah diputuskan (PP-01 sampai PP-10 di [docs/PRD.md](docs/PRD.md) F-12): soal sama persis untuk pretest dan posttest, satu kesempatan per tes, tanpa batas waktu, jawaban per tahapan rubrik yang dinilai gabungan otomatis dan manual (tahapan matematis dinilai sistem, tahapan uraian dinilai peneliti/guru, PT-03), skor terlihat setelah tes, pembahasan setelah posttest, dan data penelitian lewat dasbor Supabase/CSV. Pertanyaan teknis yang tersisa tercatat sebagai PT-01 sampai PT-13.

## Dokumen Perencanaan

| Dokumen | Isi |
|---|---|
| [docs/PRD.md](docs/PRD.md) | Analisis wawancara, kebutuhan berdasarkan Cognitive Load Theory, fitur, asumsi, dan hal yang perlu dikonfirmasi |
| [docs/architecture.md](docs/architecture.md) | Teknologi, struktur folder, model data, login kode siswa, hosting dan biaya |
| [docs/design.md](docs/design.md) | Prinsip desain, warna, tipografi, rancangan layar, aturan ilustrasi 3D |
| [docs/api.md](docs/api.md) | Edge Function, fungsi RPC Supabase, dan modul logika frontend |
| [docs/task.md](docs/task.md) | Daftar tugas per fase |
| [AGENTS.md](AGENTS.md) | Aturan untuk asisten AI atau pengembang yang mengerjakan kode |

Data sumber: [referensi/HASIL WAWANCARA ALPRO.docx](referensi/HASIL%20WAWANCARA%20ALPRO.docx)

## Rencana Teknologi

| Bagian | Teknologi |
|---|---|
| Frontend | Vite, JavaScript (ES Modules), HTML, CSS |
| Database dan autentikasi | Supabase (PostgreSQL, Auth, Edge Functions) |
| Ilustrasi 3D | Three.js (hanya di halaman Simulasi) |
| Pengujian | Vitest |
| Hosting frontend | **Netlify Free**, deploy dari GitHub (KF-01). Deployment dilakukan di Fase 14. |

### Catatan hosting dan biaya

Ketentuan paket Free Supabase diperiksa pada 11 November 2026 (rincian di [docs/architecture.md](docs/architecture.md) bagian 7):

- Batasnya cukup untuk perkiraan pemakaian Lanora: database 500 MB, 500.000 pemanggilan Edge Function per bulan, dan 50.000 pengguna aktif bulanan.
- **Proyek Free dijeda setelah 1 minggu tidak aktif.** Sebelum dipakai lagi, pulihkan proyek dari dasbor Supabase.
- **Supabase paket Free tidak bisa menyajikan halaman web frontend.** Tanpa Custom Domain (fitur berbayar), file HTML di Storage disajikan sebagai teks biasa. Karena itu frontend di-host di **Netlify Free** (KF-01).

Ketentuan paket Free Netlify diperiksa pada 12 November 2026:

- $0, **300 credits per bulan dengan hard limit**. **Jika credits habis, situs dijeda** sampai bulan berikutnya.
- Setiap production deploy memakai **15 credits**, sedangkan Deploy Preview memakai 0 credits. Batasi jumlah production deploy selama penelitian, dan **pantau saldo credits**, terutama sebelum uji coba dengan siswa.
- Build: `npm run build`, publish directory `dist`. Environment variables build: `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` saja.

## Cara Menjalankan

Kebutuhan: **Node.js 22.12 atau lebih baru**.

```bash
npm install        # memasang dependensi (sekali saja)
npm run dev        # server pengembangan → http://localhost:5173
npm test           # menjalankan tes
npm run build      # membuat hasil build di folder dist/
npm run preview    # mencoba hasil build
```

**Mencoba di ponsel Android:** sambungkan ponsel dan komputer ke Wi-Fi yang sama, jalankan `npm run dev`, lalu buka alamat **Network** yang tampil di terminal (contoh `http://192.168.x.x:5173`) di Chrome Android. Jika tidak terbuka, izinkan Node.js di Windows Firewall untuk jaringan privat.

Variabel lingkungan: salin `.env.example` menjadi `.env`. Tanpa `.env`, aplikasi tetap terbuka, tetapi layar Masuk menampilkan "Aplikasi belum terhubung ke server."

### Menyiapkan Supabase dan akun siswa (sekali, oleh peneliti)

> **KF-05f (12 November 2026):** siswa **mendaftar sendiri** dengan kode kelas, pilihan kelas, username, dan PIN, lalu masuk dengan username + PIN. Status Fase 5A: migrasi `…0005`, logika Edge Function, dan skrip pengelola sudah siap dan diuji lokal. Frontend (Tahap 5) belum, dan **belum ada yang dijalankan atau di-deploy ke Supabase** (Tahap 7). Langkah di bawah adalah urutan **setelah** Fase 5A siap diterapkan.

> Langkah ini **belum pernah diuji** di proyek Supabase asli. Daftar uji integrasi ada di `docs/task.md` Fase 5A.

1. Buat proyek Supabase (paket Free). Di **Authentication → Sign In / Providers**, matikan pendaftaran mandiri (*Allow new users to sign up*). Akun siswa dibuat Edge Function lewat Admin API, jadi tidak membutuhkan pendaftaran mandiri.
2. Cadangkan data dulu (task.md Fase 5A, Tahap 0). Lalu di **SQL Editor**, jalankan file di `supabase/migrations/` **berurutan** dari `…0001` sampai `…0005`.
3. Isi `.env`: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, dan `RAHASIA_KODE`. Buat `RAHASIA_KODE` acak, misalnya dengan `node -e "console.log(crypto.randomBytes(32).toString('hex'))"`. Simpan cadangannya di tempat aman: jika nilainya hilang, semua siswa harus di-reset.
4. Hitung hash kode kelas: `node --env-file=.env supabase/seed/hitung-kode-kelas.js`. Kode kelas diketik saat diminta. Yang disimpan sebagai secret hanya bagian hash-nya.
5. Atur secret Edge Function `RAHASIA_KODE` dan `KODE_KELAS_HASH` (dasbor **Edge Functions → Secrets**), lalu deploy `masuk-kode`, `daftar-pertama`, dan `atur-pin-baru` beserta folder `_bersama`. Cara deploy (Supabase CLI atau editor dasbor) dipilih saat uji integrasi.
6. **Isi daftar kelas** yang bisa dipilih siswa (isinya ditentukan peneliti). Skrip ini hanya butuh URL dan `SUPABASE_SERVICE_ROLE_KEY`:
   ```bash
   node --env-file=.env supabase/seed/kelola-kelas.js tambah "VIII-C" 8      # jenjang 7–12 atau VII–XII
   node --env-file=.env supabase/seed/kelola-kelas.js daftar                 # lihat id, status, jumlah siswa
   node --env-file=.env supabase/seed/kelola-kelas.js ubah-nama <id> "<nama baru>"
   node --env-file=.env supabase/seed/kelola-kelas.js nonaktifkan <id>       # atau: aktifkan <id>
   ```
   **Tidak ada perintah hapus.** Kelas yang tidak dipakai lagi cukup dinonaktifkan, dan siswa yang sudah memilihnya tidak berubah.
7. Umumkan kode kelas kepada siswa. Siswa mendaftar sendiri di aplikasi.
8. Reset PIN jika siswa lupa, setelah memastikan identitasnya secara langsung:
   ```bash
   node --env-file=.env supabase/seed/reset-pin.js <username> peneliti
   ```
   Kode reset **hanya tampil sekali** di layar, tidak disimpan ke file atau log, berlaku 24 jam, dan sekali pakai. Siswa memasukkannya di "Saya punya kode reset" bersama username-nya.

`buat-siswa.js` (kode `S001`) **tidak dipakai untuk siswa baru**. Skrip hanya berjalan dengan tanda `--akun-lama-kode-siswa`, untuk kompatibilitas akun lama. Akun lama perlu diberi username lalu di-reset PIN-nya sebelum bisa masuk dengan username (architecture.md 5.0).

`SUPABASE_SERVICE_ROLE_KEY` dan `RAHASIA_KODE` **tidak boleh** masuk Netlify, repositori, atau frontend.

## Struktur Folder

Struktur folder lengkap ada di [docs/architecture.md](docs/architecture.md) bagian 3. Folder yang masih kosong diberi file `.gitkeep`.
