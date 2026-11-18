# Arsitektur — Lanora

> **Catatan nama:** Lanora sebelumnya bernama **MathSave** (nama diganti 12 November 2026). Wawancara, keputusan, dan dokumen sebelum tanggal itu memakai nama MathSave. Pengenal teknis lama sengaja tidak diubah agar akun dan data siswa tetap aman: domain email internal `siswa.mathsave.invalid` dan `penilai.mathsave.invalid`, nama paket npm `mathsave`, kunci `mathsave:pesan-singkat`, komentar di file migrasi, dan nama folder proyek.

Dokumen ini menjelaskan struktur teknis Lanora. Kebutuhan dan kode fitur (F-xx, KB-xx, NF-xx, KF-xx) mengacu ke [PRD.md](PRD.md). Detail endpoint ada di [api.md](api.md).

---

## 1. Gambaran Umum

Lanora adalah **aplikasi web satu halaman** (*single page application*) yang dirancang untuk smartphone Android. Semua tampilan dan logika antarmuka berjalan di peramban. Data disimpan di **Supabase**.

```
┌──────────────────────────────┐
│  Peramban (Chrome Android)   │
│                              │
│  Frontend Lanora           │
│  - Vite + JavaScript         │
│  - supabase-js               │
│  - Three.js (dimuat saat     │
│    ilustrasi 3D dibuka)      │
└──────────────┬───────────────┘
               │ HTTPS
┌──────────────▼───────────────────────────────────────┐
│  Supabase (paket Free)                               │
│                                                      │
│  ┌───────────────┐  ┌───────────────────────────┐    │
│  │ Edge Function │  │ Supabase Auth             │    │
│  │ masuk-kode    ├─►│ (sesi & token JWT)        │    │
│  └───────┬───────┘  └───────────────────────────┘    │
│          │                                           │
│  ┌───────▼──────────────────────────────────────┐    │
│  │ PostgreSQL + Row Level Security              │    │
│  │ - tabel: siswa, soal, percobaan_jawaban, ... │    │
│  │ - fungsi RPC: periksa_jawaban, mulai_kuis... │    │
│  └──────────────────────────────────────────────┘    │
│                                                      │
│  ┌──────────────────────────────┐                    │
│  │ Storage: gambar materi       │                    │
│  └──────────────────────────────┘                    │
└──────────────────────────────────────────────────────┘

Hosting file frontend (HTML/JS/CSS): Netlify Free, deploy dari GitHub (KF-01, bagian 7)
```

## 2. Pilihan Teknologi

| Lapisan | Pilihan | Alasan |
|---|---|---|
| Frontend | **Vite + JavaScript (ES Modules)**, HTML, CSS | Ringan, mudah dipahami dalam konteks Alpro, tanpa framework besar (AS-07) |
| Router | Router berbasis hash (`#/beranda`), ditulis sendiri | Tidak butuh konfigurasi server. Cocok untuk hosting statis apa pun. |
| Koneksi data | `@supabase/supabase-js` v2 | Klien resmi Supabase untuk Auth, database, dan RPC |
| 3D | **Three.js** (versi dipatok tepat di `package.json`) | Hanya untuk ilustrasi tumpukan koin di Simulasi (F-04, KT-04) |
| Database | Supabase PostgreSQL | Arahan dosen (KT-03) |
| Autentikasi | Supabase Auth, dipanggil lewat Edge Function `masuk-kode` | Login dengan kode siswa + PIN tanpa email pribadi (F-01, KF-05) |
| Logika server | Fungsi PostgreSQL (RPC) dan 1 Edge Function | Pemeriksaan jawaban di server agar kunci jawaban tidak terbuka (NF-05) |
| Uji otomatis | **Vitest** | Menguji fungsi hitung bunga, pengurai angka, dan diagnosis kesalahan (NF-08) |
| Uji database | **PGlite** (`@electric-sql/pglite`, devDependency, versi dipatok) — disetujui pengembang 12 November 2026 | PostgreSQL versi WebAssembly untuk menjalankan migrasi, RLS, dan RPC di Vitest tanpa Docker atau proyek Supabase. Tidak ikut ke aplikasi. Penguncian baris untuk permintaan bersamaan tidak bisa diuji di sini (satu koneksi). |
| Hosting frontend | **Netlify Free** + deploy dari GitHub (KF-01) | Situs statis bisa dibuka lewat link di HP dan laptop. Database dan Auth tetap di Supabase. Lihat bagian 7. |

## 3. Struktur Folder (rencana)

```
MathSave_EnengWulanSari_2225250197/
├── README.md
├── AGENTS.md
├── docs/                     # dokumen perencanaan
├── referensi/                # hasil wawancara (jangan diubah)
├── public/
│   ├── gambar/               # ilustrasi materi (SVG/PNG ringan)
│   ├── favicon.svg, logo-lanora.svg          # dibuat dari src/komponen/logo.js (design.md 7.3)
│   ├── ikon-192.png, ikon-512.png, apple-touch-icon.png
│   └── manifest.webmanifest  # nama dan ikon aplikasi Lanora (tanpa service worker)
├── scripts/
│   └── buat-ikon-lanora.mjs  # membuat favicon, logo, dan bahan ikon PNG dari satu sumber gambar
├── cadangan/                 # salinan file sebelum rebranding (tidak masuk Git)
├── src/
│   ├── main.js               # titik masuk aplikasi
│   ├── router.js             # router berbasis hash
│   ├── rute.js               # daftar rute dan aturan tampil navigasi bawah
│   ├── layanan/
│   │   ├── supabase.js       # membuat klien Supabase
│   │   ├── auth.js           # masuk, keluar, cek sesi
│   │   └── api.js            # pembungkus semua panggilan RPC
│   ├── halaman/              # satu file per layar
│   │   ├── masuk.js
│   │   ├── beranda.js
│   │   ├── belajar.js        # daftar sub-bab
│   │   ├── subbab.js         # kartu langkah + contoh
│   │   ├── simulasi.js
│   │   ├── latihan.js
│   │   ├── kuis.js
│   │   └── riwayat.js
│   ├── komponen/             # tombol, kartu, panel Pahami Soal, petunjuk, logo Lanora (logo.js), dll.
│   ├── logika/
│   │   ├── galat.js          # GalatMasukan: galat masukan dengan kode & pesan Indonesia
│   │   ├── bungaTunggal.js   # semua rumus (murni, tanpa DOM)
│   │   ├── parserAngka.js    # "Rp1.200.000" → 1200000
│   │   └── diagnosis.js      # menghitung nilai pola kesalahan
│   ├── data/
│   │   └── materi.js         # isi kartu langkah & contoh soal sub-bab P0, M1–M6
│   │                         # logika halaman belajar (murni, diuji): logika/latihan.js, kuis.js, riwayat.js, simulasi.js, periksaIsian.js, pesanGalat.js
│   ├── tiga-d/
│   │   └── ilustrasiTabungan.js
│   └── gaya/
│       └── utama.css         # token warna & tipografi dari design.md
├── supabase/
│   ├── migrations/           # skema tabel, RLS, fungsi RPC (SQL)
│   ├── functions/
│   │   ├── daftar-pertama/   # Edge Function pendaftaran pertama (kode kelas + kode siswa + PIN, KF-05d)
│   │   ├── _bersama/         # logika bersama Edge Function (diuji Vitest): kodeSiswa, kriptografi, alurLogin, penangan; alatSupabase = adaptor khusus Deno
│   │   ├── masuk-kode/       # Edge Function login
│   │   ├── masuk-penilai/    # Edge Function login penilai + penguncian (PT-21)
│   │   ├── atur-pin-baru/    # Edge Function membuat PIN baru setelah reset (KF-05c)
│   │   └── nilai-tes/        # Edge Function penilaian otomatis pretest/posttest per tahapan (PP-05, PP-07, PP-09)
│   └── seed/
│       ├── soal.sql          # bank soal (DIBUAT OTOMATIS: node supabase/seed/buat-bank-soal.js dari seed/data/bankSoal.js + seed/inti/bankSoal.js)
│       ├── periksa-bank-soal.sql # kueri kecukupan bank kuis per kombinasi kisi-kisi (hanya membaca)
│       ├── buat-siswa.js     # KHUSUS akun lama kode siswa S001… (KF-05d); hanya berjalan dengan --akun-lama-kode-siswa. Tidak dipakai untuk siswa baru sejak KF-05f.
│       ├── kelola-kelas.js   # skrip peneliti (Fase 5A): daftar, tambah, ubah-nama, nonaktifkan/aktifkan kelas; tanpa hapus (KF-05f U6)
│       ├── reset-pin.js      # skrip pengelola untuk reset PIN (KF-05c; Fase 5A: berdasarkan username)
│       ├── hitung-kode-kelas.js # menghitung secret KODE_KELAS_HASH (kode kelas diketik saat diminta)
│       ├── inti/             # logika skrip pengelola (diuji Vitest) dan klien Supabase pengelola
│       └── kelola-penilai.js # skrip pengelola peneliti: buat akun penilai, reset kata sandi, nonaktifkan guru (PT-21, PT-22)
├── tests/
│   ├── logika/               # tes Vitest
│   └── db/                   # tes migrasi, RLS, dan RPC di PGlite (PostgreSQL WebAssembly, hanya untuk tes)
├── .env.example              # contoh variabel lingkungan (tanpa nilai rahasia)
├── index.html
└── package.json
```

## 4. Pembagian Tanggung Jawab

| Bagian | Di mana | Catatan |
|---|---|---|
| Isi materi (kartu langkah, contoh soal sub-bab) | Frontend, `src/data/materi.js` | Bukan data rahasia dan jarang berubah. Tidak perlu memanggil server. |
| Simulasi | Frontend, `src/logika/bungaTunggal.js` | Hitungan langsung di perangkat, tanpa server. |
| Bank soal latihan dan kuis | Database, tabel `soal` | Kunci jawaban, pembahasan, dan pola kesalahan **tidak** dikirim ke perangkat sebelum dijawab. |
| Pemeriksaan jawaban dan diagnosis | Database, fungsi `periksa_jawaban` | Membandingkan jawaban dengan kunci dan nilai pola kesalahan. |
| Riwayat dan perkembangan | Database | Tabel `percobaan_jawaban`, `sesi_kuis`, `kemajuan_materi` |
| Login | Edge Function `masuk-kode` + Supabase Auth | Lihat bagian 5 |

### Satu sumber rumus

Rumus hanya ditulis **sekali** di `src/logika/bungaTunggal.js`:

- dipakai Simulasi dan contoh di frontend;
- dipakai skrip *seed* untuk menghitung `jawaban` dan `pola_kesalahan` setiap soal sebelum disimpan ke database.

Dengan begitu, fungsi SQL `periksa_jawaban` tidak menghitung ulang rumus. Fungsi itu cukup membandingkan angka.

### Notasi di kode dan di tampilan (KF-03)

- **Tampilan untuk siswa** (materi, contoh, petunjuk, pembahasan, pesan kesalahan, Simulasi) memakai simbol resmi KF-03: M, B, p, t, A, dengan rumus **B = M × (p/100) × t** dan **A = M + B** (PRD F-02).
- **Nama di kode dan database** tetap memakai kata bahasa Indonesia agar mudah dibaca: `modal` (M), `bunga` (B), `sukuBunga`/`suku_bunga` (p), `lama` (t setelah diubah ke tahun), dan `tabunganAkhir`/`tabungan_akhir` (A). Nama-nama ini **tidak diganti**, karena struktur dan kode tidak diubah.
- **Konversi waktu (KF-02):** 1 tahun = 12 bulan = 365 hari. `HARI_PER_TAHUN = 365` di `bungaTunggal.js` adalah satu-satunya sumber nilai ini, dan semua bagian aplikasi (Simulasi, skrip *seed*, diagnosis) memakai nilai bawaan tersebut tanpa menggantinya.
- Teks pesan dan komentar di kode Fase 3 yang masih memakai penulisan lama ("p% × t", "Tabungan akhir = M + B") diselaraskan pada fase yang sesuai (lihat task.md). Logika perhitungannya sudah sesuai rumus KF-03 dan tidak perlu diubah.

## 5. Desain Login dengan Kode Siswa + PIN (KF-05)

### 5.0 Rancangan akun username dan pilihan kelas (KF-05f, disetujui 12 November 2026)

> **Status:** rancangan disetujui, **belum diimplementasi** (task.md Fase 5A, Tahap 2–7). Sampai Fase 5A diterapkan, kode dan database masih memakai rancangan kode siswa di bawah subbagian ini. Prinsip yang **tetap**: tanpa email pribadi (email internal `<siswa.id>@siswa.mathsave.invalid`), PIN tidak pernah disimpan (HMAC + bcrypt), `anon` tanpa akses database, semua lewat Edge Function, dan identitas data belajar tetap `siswa.id`.

**Perubahan data** (migrasi baru `…0005`; migrasi `…0001`–`…0004` tidak diubah; tanpa `DELETE`/`DROP` data):

```sql
-- Daftar kelas yang diatur peneliti (U6)
create table public.kelas (
  id          smallint generated always as identity primary key,
  nama        text not null unique check (length(trim(nama)) between 1 and 20),  -- contoh: VIII-C, X IPA 1
  jenjang     smallint not null check (jenjang between 7 and 12),               -- VII–XII
  urutan      smallint not null default 0,
  aktif       boolean not null default true,      -- false = tidak tampil di pilihan; siswa lama tetap
  dibuat_pada timestamptz not null default now()
);

alter table public.siswa add column username text;
alter table public.siswa add constraint siswa_username_unik unique (username);              -- U3
alter table public.siswa add constraint siswa_username_format
  check (username is null or username ~ '^[a-z][a-z0-9_]{2,19}$');                           -- U4: huruf kecil
alter table public.siswa add column kelas_id smallint references public.kelas (id);         -- tanpa ON DELETE CASCADE
alter table public.siswa alter column kode_hash drop not null;                               -- akun lama tetap sah
alter table public.siswa add constraint siswa_punya_identitas_login
  check (username is not null or kode_hash is not null);

-- Batas pendaftaran per IP (U9). Hanya IP yang di-HMAC, bukan IP asli.
create table public.percobaan_daftar (
  id bigint generated always as identity primary key,
  ip_hash text not null,
  jenis text not null check (jenis in ('akun_baru', 'kode_kelas_salah')),
  dibuat_pada timestamptz not null default now()
);
```

- **Keunikan tanpa membedakan huruf besar/kecil:** username selalu disimpan huruf kecil (dijaga `CHECK`), jadi `UNIQUE` biasa sudah cukup. Dua pendaftaran bersamaan dengan username yang sama → database hanya menerima satu.
- **Akun baru:** `nama_panggilan` diisi sama dengan `username` (U5), dan `kelas` (teks) diisi nama kelas yang dipilih, di samping `kelas_id`. Dengan begitu `ambil_profil()`, RLS, dan data Fase 4 tidak perlu diubah.
- **Kelas tidak pernah dihapus.** Foreign key `siswa.kelas_id` mencegah penghapusan kelas yang sudah dipakai, dan peneliti cukup menonaktifkannya.

**Kata sandi Auth akun baru:** `HMAC-SHA256(RAHASIA_KODE, "sandi-siswa:" + siswa.id + ":" + PIN)`. Nilainya terikat ke `siswa.id`, bukan ke username, supaya perubahan username di masa depan tidak merusak PIN. Akun lama (jika ada) tetap memakai rumus lamanya sampai di-reset. Secret yang dipakai tetap sama, tanpa secret baru.

**Kunci penguncian login (K1–K10):** `HMAC(RAHASIA_KODE, "cari-username:" + username)` di tabel `status_masuk` yang sudah ada (kolom `kode_hash` dipakai sebagai kunci umum). Username yang tidak terdaftar ikut terkunci dengan cara yang sama.

**Alur pendaftaran (Edge Function `daftar-pertama`, dua aksi):**

```
Langkah 1 { aksi: "periksa_kode_kelas", kode_kelas }
   1. batas IP: kode_kelas_salah ≥ 20/jam → TERLALU_BANYAK_PERCOBAAN
   2. HMAC(RAHASIA_KODE, "kelas:" + kode_kelas) = KODE_KELAS_HASH ?
        tidak → catat 'kode_kelas_salah' → KODE_KELAS_SALAH
        ya    → kembalikan daftar kelas AKTIF (id, nama, jenjang), terurut jenjang + urutan

Langkah 2 { aksi: "daftar", kode_kelas, kelas_id, username, pin_baru }
   1. batas IP: kode_kelas_salah ≥ 20/jam atau akun_baru ≥ 60/jam → TERLALU_BANYAK_PERCOBAAN
   2. kode kelas diperiksa ULANG (pilihan dari perangkat tidak dipercaya)
   3. kelas_id harus kelas aktif                                → KELAS_TIDAK_SAH
   4. normalisasi + format + kata terlarang username            → USERNAME_TIDAK_SAH
   5. aturan PIN (P1, P4)                                       → PIN_TIDAK_SESUAI_ATURAN
   6. username sudah dipakai? (pemeriksaan awal)                → USERNAME_SUDAH_DIPAKAI
   7. siswa.id baru → buat pengguna Auth (email internal, kata sandi turunan)
   8. simpan_siswa_mandiri(...)  ── gagal UNIQUE → hapus pengguna Auth → USERNAME_SUDAH_DIPAKAI
   9. catat 'akun_baru' → signInWithPassword → sesi → Beranda
```

Tidak ada lagi langkah "klaim akun yang sudah ada", jadi cacat "akun macet" pada rancangan lama ikut hilang. Jika langkah 9 gagal, akun sudah utuh dan siswa cukup masuk lewat layar Masuk.

**Login (`masuk-kode`):** username + PIN → kunci per username → `cari_siswa_username` (aktif) → kata sandi turunan dari `siswa.id` → `signInWithPassword`. HMAC tetap dihitung walaupun username tidak ada (pakai id tiruan), agar waktu respons tidak membocorkan keberadaan username. Respons gagal seragam: `MASUK_GAGAL`.

**Reset PIN (KF-05c):** `reset-pin.js <username> peneliti`. Layar Buat PIN baru: username + kode reset + PIN baru. Kode reset 24 jam sekali pakai, dan penguncian per username tetap berlaku.

**Fungsi database baru** (hanya `service_role`, dengan `revoke` eksplisit dari `public`/`anon`/`authenticated` di akhir migrasi):

| Fungsi | Dipakai oleh |
|---|---|
| `daftar_kelas_aktif()` | `daftar-pertama` langkah 1 |
| `cari_siswa_username(p_username)` | `masuk-kode`, `atur-pin-baru`, `reset-pin.js` |
| `username_tersedia(p_username)` | `daftar-pertama` (pemeriksaan awal, sebelum membuat akun Auth) |
| `simpan_siswa_mandiri(p_id, p_auth_user_id, p_username, p_kelas_id, p_ip_hash)` | `daftar-pertama`. Satu transaksi: kunci per IP (`pg_advisory_xact_lock`), memeriksa batas 60 akun baru, memeriksa kelas aktif (`FOR SHARE`), mengisi `nama_panggilan`/`kelas`, dan mencatat `akun_baru`. Galat: `TERLALU_BANYAK_PENDAFTARAN`, `KELAS_TIDAK_SAH`, `USERNAME_TIDAK_SAH`, `USERNAME_SUDAH_DIPAKAI`. Jika gagal, tidak ada yang tersimpan, dan Edge Function menghapus akun Auth yang baru dibuat. |
| `status_batas_daftar(p_ip_hash)` → `{kode_kelas_salah_tercapai, akun_baru_tercapai}`, `catat_kode_kelas_salah(p_ip_hash)` | `daftar-pertama` (U9, jendela 1 jam). Angka batas hanya ada di `batas_daftar()`. |
| `buat_reset_pin_siswa(p_siswa_id, p_kunci_hash, p_token_hash, p_berlaku, p_dibuat_oleh)` | `reset-pin.js` |
| `kelola_kelas_daftar/tambah/ubah_nama/setel_aktif(...)` | `kelola-kelas.js` |
| `beri_username_akun_lama(p_siswa_id, p_username)` | Hanya untuk migrasi akun lama (U8). Saat ini tidak ada akun lama. |

**Catatan teknis dari Tahap 0 (12 November 2026):** di proyek Supabase ini, `service_role` **tidak** punya hak membaca tabel secara langsung (`42501 permission denied for table siswa`), tetapi bisa menjalankan fungsi RPC yang diberi `grant`. Karena itu, Edge Function dan **semua skrip pengelola (termasuk `kelola-kelas.js`) wajib memakai fungsi RPC**, bukan `from('tabel')`. Pengelolaan kelas lewat Table Editor dasbor **tidak** dipakai, karena bisa menghapus baris tanpa pemeriksaan.

**Pengelolaan daftar kelas (U6):** `node --env-file=.env supabase/seed/kelola-kelas.js <perintah>`:
- `daftar`: semua kelas beserta status aktif dan jumlah siswanya;
- `tambah "<nama>" <jenjang 7–12> [urutan]`;
- `ubah-nama <id> "<nama baru>"`, yang tidak mengubah teks `siswa.kelas` yang sudah tersimpan;
- `nonaktifkan <id>` / `aktifkan <id>`.

**Tidak ada perintah hapus.** Isi awal daftar kelas ditentukan peneliti, dan aplikasi tidak mengarang daftar kelas.

**Akun lama (U8):** hasil Tahap 0 menunjukkan 0 akun. Jika sebelum Fase 5A diterapkan ternyata ada akun kode siswa, peneliti memberi username lewat skrip (`beri_username_akun_lama`), lalu **wajib menjalankan reset PIN** untuk akun itu. `siswa.id`, `auth_user_id`, dan data belajarnya tidak berubah. *(Koreksi Tahap 2, 12 November 2026: PIN lama tidak bisa dipakai dengan username, karena kata sandi Auth lama diturunkan dari kode siswa asli yang tidak disimpan server.)* Siswa lalu membuat PIN baru di layar Buat PIN baru dengan username + kode reset. Tidak ada dua cara login yang dipertahankan selamanya.

---

*Sisa bagian 5 di bawah ini adalah rancangan kode siswa (KF-05/KF-05d) yang **saat ini** dipakai kode. Bagian ini digantikan 5.0 setelah Fase 5A diterapkan, dan tetap dicatat sebagai riwayat.*

Supabase Auth membutuhkan identitas (email) dan kata sandi. Agar siswa cukup memakai **kode siswa + PIN** tanpa email pribadi (KF-05 L4), dipakai rancangan berikut.

**Aturan PIN (KF-05a):** tepat 6 digit angka, diperlakukan sebagai teks (angka 0 di depan tetap sah), tidak sama dengan kode kelas, dan tidak ditampilkan terbuka. Bentuk 6 digit diperiksa di perangkat dan di server pada pendaftaran pertama dan reset. Larangan sama dengan kode kelas **hanya** diperiksa di server, karena kode kelas tidak boleh ada di frontend. Saat login, PIN yang tidak 6 digit langsung gagal.

**Prinsip penyimpanan PIN (KF-05 L6):** PIN **tidak pernah disimpan** dalam bentuk apa pun di tabel Lanora, dan tidak pernah dicatat di log. PIN hanya menjadi bahan kata sandi akun Supabase Auth, dan kata sandi itu sendiri disimpan Supabase Auth dalam bentuk **hash bcrypt**. Jadi ada dua lapis: HMAC dengan `RAHASIA_KODE` (sehingga PIN yang pendek tetap menghasilkan kata sandi panjang), lalu bcrypt oleh Supabase Auth.

**Dua jenis kode (KF-05d):**

| | Kode akses kelas | Kode siswa |
|---|---|---|
| Nilai | `230706` | `S001`, `S002`, `S003`, … (unik) |
| Dipakai di | **Hanya** `daftar-pertama` | `daftar-pertama`, `masuk-kode`, `atur-pin-baru` |
| Disimpan sebagai | Hash HMAC di *secret* Edge Function `KODE_KELAS_HASH`. **Tidak pernah** di frontend, hasil build, atau Netlify. | `siswa.kode_hash` (HMAC "cari:") |
| Normalisasi | Hapus spasi, harus 6 angka | Huruf besar, hapus spasi dan `-`, harus berpola `S` + 3 angka |

Pola format dipakai untuk menolak isian yang tertukar, misalnya `230706` di kolom kode siswa (D6). Penolakan tetap memakai pesan seragam (L7).

**Saat peneliti membuat siswa** (skrip `supabase/seed/buat-siswa.js`, dijalankan di komputer pengelola dengan *service role key*):

1. Menetapkan **kode siswa** berurutan: `S001`, `S002`, … (KF-05d D3).
2. Membuat pengguna Supabase Auth dengan email internal `<siswa.id>@siswa.mathsave.invalid` (UUID baris `siswa`, dibuat skrip lebih dulu, sehingga Edge Function bisa menyusun email tanpa memanggil Admin API) dan kata sandi **acak yang tidak diketahui siapa pun**, karena siswa belum punya PIN. Email ini bukan email siswa dan tidak pernah dipakai untuk mengirim surat.
3. Menyimpan baris di tabel `siswa` berisi `kode_hash = HMAC-SHA256(RAHASIA_KODE, "cari:" + kode_ternormalisasi)`, `auth_user_id`, nama panggilan, kelas, dan `pin_dibuat_pada = null` (belum mendaftar).
4. Mencetak **daftar kode siswa** (tanpa PIN) untuk dibagikan peneliti. Peneliti tidak pernah mengetahui PIN siswa.

**Pendaftaran pertama** (siswa membuat PIN sendiri, KF-05d D5):

```
Siswa ──kode kelas + kode siswa + PIN baru──► Edge Function daftar-pertama
   1. normalisasi; tolak jika format kode kelas/kode siswa tidak sesuai (tertukar) → DAFTAR_GAGAL
   2. cek kunci untuk kode_hash (mekanisme KF-05b)
   3. bandingkan HMAC kode kelas dengan secret KODE_KELAS_HASH
   4. cari siswa (aktif = true) dengan kode_hash, DAN pin_dibuat_pada masih kosong
   4a. aturan PIN (KF-05a): tepat 6 digit angka (teks, angka 0 di depan sah), dan
       HMAC(RAHASIA_KODE, "kelas:" + PIN) ≠ KODE_KELAS_HASH (PIN ≠ kode kelas)
       → jika melanggar (dan langkah 1–4 valid): PIN_TIDAK_SESUAI_ATURAN
   5. semua benar → kata sandi Auth = HMAC(RAHASIA_KODE, "sandi:" + kode + ":" + PIN)
                    isi pin_dibuat_pada = now() (dalam satu transaksi; cegah pendaftaran ganda)
                    kembalikan sesi → siswa masuk
      salah satu salah → DAFTAR_GAGAL (pesan seragam), gagal +1 di status_masuk
```

- Akun yang `pin_dibuat_pada`-nya sudah terisi **tidak bisa didaftarkan ulang** (RS-02). Pembaruan `pin_dibuat_pada` memakai kondisi `WHERE pin_dibuat_pada IS NULL`, sehingga dua permintaan pendaftaran bersamaan hanya satu yang berhasil.
- Kode siswa yang belum mendaftar tidak bisa login lewat `masuk-kode`, karena kata sandinya acak. Hasilnya `MASUK_GAGAL` yang seragam.
- Setelah dibuat, PIN tidak bisa dilihat lagi dari sistem. Jika siswa lupa, PIN di-*reset* dengan bantuan guru atau peneliti (KF-05c, lihat "Reset PIN" di bawah). Kode kelas **tidak** dipakai di alur reset.

**Saat siswa masuk:**

```
Siswa ──kode + PIN──► Edge Function masuk-kode
                 1. normalisasi kode siswa (huruf besar, hapus spasi & "-"; pola S + 3 angka); PIN hanya dihapus spasinya
                    dan harus tepat 6 digit (KF-05a), jika tidak → MASUK_GAGAL (tetap dihitung untuk kunci)
                    (kode kelas TIDAK dipakai saat login, KF-05d D7)
                 2. cek kunci akun: hitung HMAC "cari:" kode → baca status_masuk
                    terkunci (KF-05b) → TERLALU_BANYAK_PERCOBAAN (tanpa memeriksa PIN)
                 3. hitung HMAC "cari:" → cari di tabel siswa (aktif = true)
                 4. signInWithPassword(email internal, HMAC "sandi:" kode + PIN)
                 5. berhasil → kembalikan sesi (access_token, refresh_token)
                    gagal (kode tidak ada ATAU PIN salah) → satu jawaban yang sama: MASUK_GAGAL
                 6. perbarui status_masuk untuk kode_hash itu (berhasil → 0; gagal → +1;
                    gagal ke-5 → terkunci_sampai = now() + 5 menit)
Frontend ◄──sesi── supabase.auth.setSession(sesi)
```

Setelah itu, semua panggilan ke database memakai token siswa. RLS membatasi akses dengan `auth.uid()`, sehingga siswa hanya bisa membaca dan menulis data miliknya (KF-05 L5). Ini berlaku untuk latihan, kuis, riwayat, serta **pretest dan posttest** (KF-05 L8, KF-05e, PRD F-12).

Catatan:

- **Tidak membocorkan informasi (L7):** kode yang tidak terdaftar dan PIN yang salah menghasilkan respons, kode galat, dan pesan yang **sama**. Untuk mengurangi perbedaan waktu respons, Edge Function tetap menghitung HMAC kata sandi walaupun kode tidak ditemukan. Log hanya mencatat hasil berhasil/gagal tanpa kode atau PIN.
- `RAHASIA_KODE` disimpan sebagai *secret* Edge Function dan di komputer pengelola. Nilai ini **tidak boleh** ada di frontend, repositori, atau Netlify.
- Penerimaan domain `.invalid` oleh Supabase Auth **perlu diuji** di tahap implementasi. Jika ditolak, gunakan domain milik sendiri yang tidak menerima email.
- **Reset PIN** (KF-05c): lihat subbagian di bawah.

### Reset PIN (KF-05c)

Keputusan: reset dibantu guru atau peneliti, lalu **siswa membuat PIN baru sendiri** dengan akun yang sama. Tidak ada fitur lupa PIN mandiri (PRD F-01 "Lupa PIN", R1–R6). Rancangan teknis di bawah ini adalah **usulan** untuk memenuhi keputusan itu. Parameter yang belum ditentukan dicatat sebagai tugas Fase 5.

```
Guru/peneliti ──(identitas siswa dicek langsung)──► skrip/alat reset (pakai service role, tidak di perangkat siswa)
   1. kata sandi Auth siswa diganti nilai acak yang tidak diketahui siapa pun → PIN lama langsung tidak berlaku
   2. buat KODE RESET sementara (sekali pakai, ada masa berlaku); simpan hanya hash-nya di tabel reset_pin
   3. tampilkan kode reset sekali ke guru/peneliti → diberikan langsung ke siswa

Siswa ──kode siswa + kode reset + PIN baru──► Edge Function atur-pin-baru
   4. cek batas percobaan (per kode siswa, seperti KF-05b)
   5. cocokkan hash kode reset: milik siswa itu, belum dipakai, belum kedaluwarsa
   5a. aturan PIN (KF-05a): tepat 6 digit angka, dan PIN ≠ kode kelas (dibandingkan dengan KODE_KELAS_HASH)
   6. kata sandi Auth = HMAC(RAHASIA_KODE, "sandi:" + kode + ":" + PIN_baru)  (cara yang sama dengan PIN awal)
   7. tandai kode reset terpakai, lalu kembalikan sesi → siswa masuk ke akun lamanya
```

Jaminan keamanan dan data:

- **Hanya pihak berwenang yang bisa memulai reset.** Langkah 1–3 membutuhkan *service role key*, yang hanya ada di komputer peneliti, bukan di frontend, repositori, atau Netlify. Tidak ada endpoint siswa yang bisa memulai reset (R6).
- **Kode reset** disimpan sebagai hash (seperti `kode_hash`), hanya berlaku untuk satu siswa, sekali pakai, dan kedaluwarsa. Kode reset dan PIN baru tidak pernah dicatat di log.
- **PIN baru** tidak disimpan di tabel mana pun. PIN baru menjadi bahan kata sandi Auth (HMAC + bcrypt), sama seperti PIN awal (KF-05 L6).
- **Akun dan data tetap (R4, R5):** reset hanya mengganti kata sandi Auth. `auth_user_id`, `siswa.id`, dan semua data belajar (`percobaan_jawaban`, `sesi_kuis`, `sesi_kuis_soal`, `kemajuan_materi`, `penjelasan_siswa`) tidak disentuh. Tidak ada `DELETE` maupun pembuatan akun baru dalam proses ini.
- **Tidak membocorkan informasi (KF-05 L7):** kode siswa salah, kode reset salah, kode reset kedaluwarsa, atau kode reset yang sudah dipakai dijawab dengan pesan yang **sama**.
- Siswa dengan kuis yang masih berjalan tetap bisa melanjutkannya setelah membuat PIN baru, selama waktu kuis belum habis (KF-11, KF-17), karena sesinya terikat pada akun yang sama.

**`reset_pin`** (KF-05c, hanya diakses *service role* dan Edge Function)

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid PK | |
| siswa_id | uuid → siswa | |
| token_hash | text | hash kode reset, bukan kode aslinya |
| kedaluwarsa_pada | timestamptz | `dibuat_pada + 24 jam` (KF-05c detail b, task.md Fase 5). Kode lama yang dibatalkan diisi `now()`. |
| dipakai_pada | timestamptz, boleh kosong | diisi saat PIN baru berhasil dibuat |
| dibuat_oleh | text | catatan singkat siapa yang mereset (misalnya "peneliti"), tanpa data pribadi lain |
| dibuat_pada | timestamptz | |

Saat reset baru dibuat untuk siswa yang sama, kode reset lama yang belum dipakai otomatis dibatalkan.
- **Penguncian akun (KF-05b):** maksimal 5 kali gagal berurutan per akun, lalu terkunci 5 menit (waktu server). Penghitung disimpan per `kode_hash` dari kode yang **dicoba**, sehingga kode yang tidak terdaftar juga "terkunci" dengan cara yang sama dan penguncian tidak membocorkan kode mana yang ada. Selama terkunci, PIN tidak diperiksa sama sekali. Aturan penghitungan K7–K10 dikonfirmasi pengembang (PRD F-01).
- **Risiko yang diterima sementara (RS-01):** orang yang mengetahui kode siswa lain bisa sengaja menguncinya selama 5 menit. Rancangan ini tidak menambahkan mitigasi lain sampai ada keputusan baru setelah uji coba.
- **Satu siswa tidak mengunci siswa lain (K4):** penguncian hanya berlaku untuk `kode_hash` yang gagal. Batas berdasarkan IP **tidak** menjadi dasar penguncian utama. Jika batas IP tambahan dipakai (K5), ambangnya jauh di atas pemakaian satu sekolah dan tidak pernah mengunci akun.

## 6. Model Data

```
auth.users (Supabase)
     │ 1
     │
     │ 1
  siswa ───────────┬──────────────┬─────────────────┐
     │ 1           │ 1            │ 1               │ 1
     │ *           │ *            │ *               │ *
kemajuan_materi  sesi_kuis    percobaan_jawaban   penjelasan_siswa
                   │ 1            │ *
                   └──────*───────┘ (sesi_kuis_id boleh kosong)
                                  │ *
                                  │ 1
                                soal
```

### Tabel

**`siswa`**

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid PK | |
| auth_user_id | uuid UNIQUE → auth.users | |
| kode_hash | text UNIQUE | HMAC "cari:" dari kode siswa (`S001`, …, KF-05d). **Fase 5A:** boleh kosong, hanya untuk akun lama. |
| username | text UNIQUE, boleh kosong | **Fase 5A (KF-05f).** Huruf kecil, `^[a-z][a-z0-9_]{2,19}$`, unik global, dan sekaligus nama tampilan. Wajib ada username **atau** `kode_hash`. |
| kelas_id | smallint → kelas, boleh kosong | **Fase 5A (KF-05f U6).** Kelas pilihan siswa saat mendaftar. |
| pin_dibuat_pada | timestamptz, boleh kosong | Kosong = belum pendaftaran pertama. Diisi saat siswa membuat PIN (KF-05d), dan diperbarui saat PIN baru dibuat setelah reset (KF-05c). **PIN-nya sendiri tidak disimpan.** Akun Fase 5A langsung terisi saat mendaftar. |
| nama_panggilan | text | contoh: "Rani". Akun Fase 5A: sama dengan `username` (U5). |
| kelas | text | contoh: "VIII-C". Akun Fase 5A: salinan `kelas.nama` saat mendaftar. |
| aktif | boolean | default `true`. Peneliti dapat menonaktifkan akun yang tidak semestinya (RS-03), tanpa menghapus data. |
| dibuat_pada | timestamptz | |

**`kelas`** (Fase 5A, KF-05f U6) dan **`percobaan_daftar`** (Fase 5A, U9): lihat bagian 5.0. Kedua tabel hanya diakses lewat fungsi `service_role`.

**`soal`**

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid PK | |
| kode | text UNIQUE | contoh: `M3-T2-04` |
| sub_materi | text | `P0`, `M1`–`M6` |
| tingkat | smallint | 1 = mudah, 2 = sedang, 3 = sulit |
| bank | text NOT NULL | `latihan` atau `kuis` (KF-14). Satu soal hanya berada di **satu** bank, sehingga bank latihan dan bank kuis terpisah. Menggantikan kolom lama `untuk_kuis` (boolean), yang memungkinkan satu soal dipakai di keduanya. |
| bentuk | text | `isian` (isian angka) atau `pilihan_ganda`. Soal `pilihan_ganda` hanya ada di bank `kuis`; bank `latihan` hanya berisi `isian`. |
| opsi | jsonb, boleh kosong | Hanya untuk `pilihan_ganda`: array **tepat 4** objek `{id:"o1", teks:"Rp80.000", nilai:80000, kunci:true, jenis_kesalahan:null}` (KF-18). `id` (`o1`–`o4`) adalah pengenal **tetap** opsi di bank soal, bukan huruf yang tampil. Huruf A–D ditentukan per sesi dari urutan acak di `sesi_kuis_soal.urutan_opsi`. Tepat satu opsi bertanda `kunci: true`. `nilai` diisi untuk soal hitungan dan kosong untuk soal pernyataan (misalnya soal `konsep`). `jenis_kesalahan` diisi untuk pengecoh yang berasal dari `pola_kesalahan`, selain itu kosong (dinilai `LAINNYA`). |
| kategori_kuis | text, boleh kosong | Submateri kuis (PRD F-07, KF-12): `konsep`, `besar_bunga`, `tabungan_akhir`, `modal_suku_bunga`, `lama_menabung`, `penerapan`. Wajib diisi jika `bank = 'kuis'`, dan harus kosong jika `bank = 'latihan'`. |
| konteks | text | contoh: "koperasi sekolah" |
| teks_soal | text | |
| sorotan | jsonb | potongan teks penting untuk petunjuk level 1 |
| diketahui | jsonb | contoh: `{"modal":2000000,"suku_bunga":6,"lama":8,"satuan_lama":"bulan"}` |
| ditanya | text | `bunga` (B), `tabungan_akhir` (A), `modal` (M), `suku_bunga` (p), `lama` (t). Nama kolom dan nilai tetap seperti ini. Simbol dalam kurung mengikuti notasi KF-03 untuk tampilan. |
| satuan_jawaban | text | `rupiah`, `persen`, `tahun`, `bulan`, `hari` |
| jawaban | numeric, boleh kosong | Kunci jawaban angka. Wajib untuk `isian`. Untuk `pilihan_ganda` hitungan berisi `nilai` opsi kunci. Kosong untuk `pilihan_ganda` pernyataan (kunci ditentukan oleh `opsi[].kunci`). |
| toleransi | numeric | Toleransi penilaian isian angka, sesuai `satuan_jawaban` (KF-19): `rupiah` = 1, `persen` = 0.01, `tahun`/`bulan`/`hari` = 0.01. Diisi skrip bank soal per soal. Untuk soal pilihan ganda tidak dipakai dalam penilaian. |
| petunjuk | jsonb, boleh kosong | Array tepat **3** teks untuk tingkat 1–3 (KF-15): 1 = diketahui dan ditanya, 2 = rumus/konsep, 3 = langkah awal perhitungan tanpa jawaban akhir. Wajib untuk bank `latihan`, kosong untuk bank `kuis`. |
| pembahasan | jsonb | array langkah `{langkah:"Pahami", isi:"..."}` |
| pola_kesalahan | jsonb | array `{jenis:"SATUAN_WAKTU", nilai:960000, pesan:"..."}`, dihitung skrip *seed* |
| aktif | boolean | |

Batasan pemisahan bank pada tabel `soal` (KF-14):

- `CHECK (bank IN ('latihan', 'kuis'))`
- `CHECK (bank = 'kuis' OR (bentuk = 'isian' AND kategori_kuis IS NULL))`: soal latihan selalu isian dan tanpa kategori kuis.
- `CHECK (bank = 'latihan' OR kategori_kuis IS NOT NULL)`: soal kuis selalu punya kategori kisi-kisi.
- Soal isian (KF-19, G1): `CHECK (bentuk = 'pilihan_ganda' OR toleransi IS NOT NULL)`. Kunci jawaban yang rapi (Rupiah bulat, persen ≤ 1 desimal, lama menabung bulat) diperiksa skrip *seed*, misalnya `jawaban = round(jawaban)` untuk `rupiah`/`tahun`/`bulan`/`hari` dan `jawaban * 10 = round(jawaban * 10)` untuk `persen`.
- `CHECK (bentuk = 'isian' OR jsonb_array_length(opsi) = 4)`: soal pilihan ganda selalu punya 4 opsi (KF-18). Keberadaan tepat satu opsi `kunci: true` dan `id` yang unik (`o1`–`o4`) diperiksa oleh pemicu (*trigger*) atau skrip *seed*.
- Kolom `petunjuk` wajib terisi tepat 3 teks untuk bank `latihan` (`CHECK (bank = 'kuis' OR jsonb_array_length(petunjuk) = 3)`), dan wajib kosong untuk bank `kuis` (`CHECK (bank = 'latihan' OR petunjuk IS NULL)`), karena kuis tanpa petunjuk (KF-15).
- Memindahkan soal antarbank hanya boleh dilakukan pengelola lewat skrip/migrasi, tidak pernah lewat RPC siswa.

**`percobaan_jawaban`**

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid PK | |
| siswa_id | uuid → siswa | |
| soal_id | uuid → soal | |
| sesi_kuis_id | uuid → sesi_kuis, boleh kosong | kosong = latihan |
| jawaban_siswa | numeric, boleh kosong | Isian: angka yang diketik. Pilihan ganda: `nilai` opsi yang dipilih. |
| *(catatan kuis)* | — | Di kuis, satu soal bisa punya beberapa baris karena siswa boleh mengubah jawaban (KF-22). Yang dinilai adalah baris dengan `dibuat_pada` terakhir yang masih sebelum `sesi_kuis.batas_waktu`. Baris lama tidak dihapus. |
| opsi_dipilih | text, boleh kosong | **ID tetap** opsi yang dipilih (pilihan ganda saja), contoh `"o2"`, bukan huruf yang tampil (KF-18 O5) |
| benar | boolean | |
| jenis_kesalahan | text, boleh kosong | kode dari PRD F-09 |
| jumlah_petunjuk | smallint | 0–3 (KF-15). Selalu 0 untuk jawaban kuis. |
| durasi_detik | integer | |
| dibuat_pada | timestamptz | waktu server saat jawaban diterima (KF-20) |
| urutan | bigint identity | nomor urut penerimaan, pemecah seri untuk "jawaban terakhir" (KF-22) |

**`sesi_kuis`**

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid PK | |
| siswa_id | uuid → siswa | |
| percobaan_ke | smallint | 1 atau 2 (KF-13). `CHECK (percobaan_ke BETWEEN 1 AND 2)` dan `UNIQUE (siswa_id, percobaan_ke)`, sehingga database sendiri menolak percobaan ketiga, termasuk dua permintaan Mulai Kuis yang terkirim bersamaan. |
| *(daftar soal)* | — | Disimpan di tabel `sesi_kuis_soal` (20 baris per sesi), bukan kolom array, agar aturan "tidak ada soal dipakai ulang" (KF-14) bisa dijaga oleh database. Kolom lama `daftar_soal uuid[]` tidak dipakai lagi. |
| mulai_pada | timestamptz | waktu server (`now()` di database) saat siswa menekan Mulai Kuis; diisi sekali, tidak pernah diubah |
| batas_waktu | timestamptz | `mulai_pada + 30 menit`; diisi sekali, tidak pernah diubah atau diulang (KF-11) |
| selesai_pada | timestamptz, boleh kosong | kosong = kuis masih berlangsung |
| cara_selesai | text, boleh kosong | `siswa` (tombol Selesai Kuis) atau `waktu_habis` |
| hasil_dilihat | boolean | default `false`; menjadi `true` setelah siswa membuka hasil. Dipakai `status_kuis` untuk memberi tahu kuis yang dikumpulkan otomatis. |
| jumlah_benar | smallint | |
| skor | smallint | nilai akhir 0–100 = jumlah benar ÷ 20 × 100 |

**`kisi_kisi_kuis`** (KF-21)

Berisi 20 baris tetap sesuai tabel kisi-kisi di PRD F-07. Diisi lewat file migrasi dan hanya diubah lewat migrasi baru jika kisi-kisi resmi berubah.

| Kolom | Tipe | Keterangan |
|---|---|---|
| nomor | smallint PK | 1–20 |
| kategori_kuis | text | sama dengan `soal.kategori_kuis` |
| tingkat | smallint | 1 = mudah, 2 = sedang, 3 = sulit |
| bentuk | text | `pilihan_ganda` atau `isian` |

Pemilihan soal untuk nomor *n*: ambil soal dengan `bank = 'kuis'`, `aktif = true`, serta `kategori_kuis`, `tingkat`, dan `bentuk` **sama persis** dengan baris nomor *n*, yang belum dipakai di nomor lain pada sesi yang sama **dan belum pernah diterima siswa ini di percobaan sebelumnya** (KF-14). Jika ada beberapa kandidat, boleh dipilih acak (KF-21 K3). Jika tidak ada kandidat, **tidak ada penggantian kategori**. Sesi tidak dibuat (KF-21 K4).

**`sesi_kuis_soal`** (KF-14, KF-21)

Satu baris = satu soal yang diterima siswa pada satu nomor dalam satu percobaan.

| Kolom | Tipe | Keterangan |
|---|---|---|
| sesi_kuis_id | uuid → sesi_kuis | |
| siswa_id | uuid → siswa | disalin dari sesi, agar batasan di bawah bisa dibuat |
| nomor | smallint | 1–20, mengacu `kisi_kisi_kuis.nomor` |
| soal_id | uuid → soal | |
| urutan_opsi | text[], boleh kosong | Hanya untuk soal pilihan ganda: 4 `id` opsi dalam urutan acak yang dilihat siswa, contoh `{o3,o1,o4,o2}` sehingga huruf opsi A → o3, B → o1, C → o4, D → o2 (KF-18; huruf opsi ini bukan simbol rumus KF-03). Diacak **sekali** saat sesi dibuat dan **tidak pernah diubah**. Kosong untuk soal isian. |

Batasan:

- `PRIMARY KEY (sesi_kuis_id, nomor)`: tepat satu soal per nomor per sesi.
- `UNIQUE (sesi_kuis_id, soal_id)`: tidak ada soal ganda dalam satu sesi.
- **`UNIQUE (siswa_id, soal_id)`**: soal yang sama **tidak bisa** diberikan dua kali kepada siswa yang sama di percobaan mana pun (KF-14 B4). Batasan ini menjadi pengaman terakhir walaupun logika pemilihan keliru atau ada permintaan bersamaan.
- Baris tidak pernah dihapus, termasuk untuk sesi yang ditutup karena waktu habis. Soal yang sudah diterima tetap dihitung "terpakai" walaupun tidak dijawab.

**Pemeriksaan kecukupan bank soal** (KF-14 B1, B7)

- Bank dianggap mencukupi jika setiap kombinasi `(kategori_kuis, tingkat, bentuk)` di `kisi_kisi_kuis` punya soal `bank = 'kuis'` dan `aktif = true` minimal **2 × jumlah nomor yang memakai kombinasi itu**. Totalnya 40, sesuai tabel sebaran di PRD F-07. Soal bank latihan tidak pernah dihitung.

**Pemisahan bank latihan dan kuis** (KF-14 tambahan, S1–S6)

| Bagian | Latihan | Kuis |
|---|---|---|
| Sumber soal | hanya `bank = 'latihan'` | hanya `bank = 'kuis'` |
| Catatan pemakaian | `percobaan_jawaban` dengan `sesi_kuis_id` kosong | `sesi_kuis_soal` + `percobaan_jawaban` dengan `sesi_kuis_id` |
| Memengaruhi ketersediaan bank kuis? | **Tidak.** Latihan tidak menulis ke `sesi_kuis_soal`, dan pemeriksaan kecukupan maupun pengecualian soal kuis hanya membaca data kuis. | Ya, lewat `sesi_kuis_soal` (soal yang sudah diterima tidak dipakai ulang untuk siswa yang sama) |

Setiap RPC memeriksa bank soal yang diminta. Soal dari bank yang salah diperlakukan sebagai `SOAL_TIDAK_DITEMUKAN`, sehingga keberadaan soal kuis tidak terlihat dari fitur latihan.
- Pemeriksaan ini dijalankan **sebelum setiap percobaan**, termasuk percobaan pertama. Percobaan kedua juga memeriksa bahwa setelah soal percobaan pertama dikecualikan, setiap nomor masih punya kandidat.
- Pengelola dapat melihat hasil pemeriksaan per kombinasi (jumlah tersedia vs. minimum) lewat kueri pemeriksaan di `supabase/seed/` sebelum uji coba.

**Pengulangan kuis** (KF-13)

- Satu baris `sesi_kuis` = satu percobaan. Baris dibuat hanya jika `mulai_kuis` berhasil (soal lengkap sesuai kisi-kisi dan timer dimulai). Kegagalan sebelum itu, misalnya `BANK_SOAL_KURANG` atau gagal koneksi, tidak membuat baris, sehingga tidak dihitung (P4).
- Baris sesi **tidak pernah dihapus**. Sesi yang ditutup karena waktu habis (`cara_selesai = 'waktu_habis'`) tetap dihitung sebagai percobaan (P3, P5).
- Melanjutkan sesi yang masih berjalan memakai baris yang sama, tanpa percobaan baru (sejalan dengan KF-11).
- **Nilai utama** = `max(skor)` dari sesi milik siswa yang sudah dikumpulkan (`selesai_pada` tidak kosong). Nilai ini dihitung saat dibutuhkan, tidak disimpan di kolom terpisah, agar tidak ada dua sumber data yang bisa berbeda.
- **Percobaan kedua memakai soal berbeda** (KF-14): kandidat soal mengecualikan semua `soal_id` milik siswa di `sesi_kuis_soal`.
- **Permintaan bersamaan:** `mulai_kuis` mengunci baris `siswa` milik pemanggil (`SELECT … FOR UPDATE`) di awal transaksi. Dengan begitu, pemeriksaan sesi aktif, penghitungan percobaan, pemilihan soal, dan pembuatan sesi berjalan bergantian per siswa. Permintaan kedua menunggu, lalu melihat sesi yang baru dibuat dan mengembalikannya (atau ditolak `BATAS_PERCOBAAN_KUIS`). Batasan `UNIQUE (siswa_id, percobaan_ke)` dan `UNIQUE (siswa_id, soal_id)` tetap menjadi pengaman kedua.
- Seluruh pembuatan sesi (baris `sesi_kuis` dan 20 baris `sesi_kuis_soal`) terjadi dalam **satu transaksi**. Jika satu bagian gagal, tidak ada yang tersimpan, sehingga percobaan tidak terhitung (KF-13 P4).

**Mekanisme timer kuis** (PRD F-07 "Aturan timer", KF-11)

Prinsip: **waktu server adalah satu-satunya acuan.** Jam perangkat siswa tidak pernah dipakai untuk memutuskan apakah waktu habis atau apakah jawaban diterima tepat waktu. Jawaban hanya sah jika sudah diterima dan tersimpan di server (`percobaan_jawaban`) sebelum `batas_waktu` (KF-11, KF-20). Antrean jawaban offline di perangkat hanya penampung sementara, bukan data resmi.

```
Mulai Kuis ──► server: mulai_pada = now(), batas_waktu = now() + 30 menit (sekali saja)
                │
Perangkat ◄─────┘ batas_waktu + waktu_server
   │  hitung mundur di layar = batas_waktu − (jam perangkat + selisih jam)
   │  (tetap berjalan saat offline; hanya tampilan)
   │
   ├─ Selesai Kuis / hitungan mencapai 0 ──► selesaikan_kuis
   └─ aplikasi ditutup / offline ──► server menutup sesi sendiri setelah batas_waktu
```

| Situasi | Perilaku |
|---|---|
| Siswa membuka aplikasi lagi sebelum batas waktu | `mulai_kuis`/`status_kuis` mengembalikan sesi yang sama dengan `batas_waktu` yang sama. Timer **tidak** diulang. |
| Batas waktu lewat saat aplikasi tertutup atau offline | Sesi ditutup otomatis oleh server: `cara_selesai = 'waktu_habis'`, `selesai_pada = batas_waktu`, dan nilai dihitung dari jawaban yang **sudah diterima server** sebelum batas waktu. |
| Jawaban dipilih saat offline | Hanya disimpan sementara di perangkat dengan status "Belum terkirim", belum resmi (KF-20). |
| Internet kembali **sebelum** batas waktu | Jawaban yang belum terkirim dikirim ke server. Setelah server membalas `tersimpan: true`, statusnya menjadi "Tersimpan". |
| Internet kembali **setelah** batas waktu | Jawaban offline yang belum diterima server ditolak (`WAKTU_HABIS`) tanpa pengecualian, dibuang dari perangkat, dan soalnya dinilai "Tidak dijawab" (KF-20). |
| Balasan server hilang karena sinyal putus | Status ditentukan ulang dari `jawaban_tersimpan` milik server saat tersambung lagi. |
| Jam ponsel diubah siswa | Tidak berpengaruh. Server memakai `now()` database. |

**Cara server menutup sesi yang kedaluwarsa:** fungsi internal `tutup_sesi_kedaluwarsa(siswa_id)` dijalankan di awal setiap RPC yang berhubungan dengan kuis atau riwayat (`status_kuis`, `mulai_kuis`, `periksa_jawaban` mode kuis, `selesaikan_kuis`, `ringkasan_kemajuan`, `riwayat_belajar`). Fungsi ini menutup sesi milik siswa yang `selesai_pada` masih kosong tetapi `batas_waktu` sudah lewat. Dengan begitu, sesi tertutup tepat waktu dari sudut pandang data (karena `selesai_pada = batas_waktu`) tanpa perlu layanan terjadwal tambahan. Penjadwal di database (misalnya ekstensi `pg_cron`) **tidak** dipakai di rancangan ini. Ketersediaannya di paket Free Supabase juga belum diperiksa.

**Instrumen pretest/posttest (KF-05e, PRD F-12)**

Empat soal Mathematical Literacy adalah **instrumen penelitian tersendiri** (T8, PP-01). Karena itu, soal-soalnya **tidak** disimpan di tabel `soal` (bank `latihan`/`kuis`), dan hasilnya **tidak** disimpan di `sesi_kuis`, `sesi_kuis_soal`, atau `percobaan_jawaban`. Pretest dan posttest memakai **instrumen yang sama persis** (PP-02), jadi tidak ada kolom jenis tes pada tabel instrumen. Isi soal, kisi-kisi, dan rubrik diambil dari file instrumen Pak Aan (PT-01), **tidak dikarang**.

**`instrumen_tes`** (4 baris)

| Kolom | Tipe | Keterangan |
|---|---|---|
| nomor | smallint PK | 1–4, sesuai urutan instrumen asli. **Tidak diacak** (PP-02). |
| indikator | text | `penalaran`, `merumuskan`, `menerapkan`, `menafsirkan_mengevaluasi` (T3) |
| teks_soal | text | Disalin **persis** dari instrumen. Tidak disunting pengembang. |
| skor_maksimal | smallint | 6 (T4). `CHECK (skor_maksimal = 6)`. |
| pembahasan | jsonb | Kunci jawaban dan pembahasan dari kisi-kisi instrumen. **Hanya** dikirim ke siswa setelah posttest siswa itu selesai (PP-06). |

**`rubrik_tahap`** (tahapan penilaian per soal, PP-05, PP-08)

| Kolom | Tipe | Keterangan |
|---|---|---|
| nomor_soal | smallint → instrumen_tes | |
| nomor_tahap | smallint | Urutan tahapan dalam soal |
| label | text | Nama tahapan yang tampil di kolom jawaban siswa, sesuai rubrik |
| skor_maksimal | smallint | Poin tahapan. **Jumlah semua tahapan dalam satu soal = 6** (diperiksa skrip pengisian instrumen dan pemicu database). |
| jenis_pemeriksaan | text | `nilai`, `ekspresi`, `pilihan`, atau `uraian` (lihat "Penilaian otomatis" di bawah) |
| kunci | jsonb | Kunci tahapan: nilai dan satuan, ekspresi, pilihan yang benar, atau deskripsi rubrik untuk uraian. **Tidak pernah dikirim ke perangkat siswa.** |
| toleransi | numeric, boleh kosong | Untuk `nilai`/`ekspresi`, besarnya menunggu PT-04 |
| bentuk_setara | jsonb, boleh kosong | Bentuk lain yang dianggap benar menurut rubrik, menunggu PT-05 |

`PRIMARY KEY (nomor_soal, nomor_tahap)`. Jumlah tahapan dan isinya mengikuti rubrik (PT-02).

**`hasil_tes`** (satu baris per siswa per jenis tes)

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid PK | |
| siswa_id | uuid → siswa | |
| jenis_tes | text | `pretest` atau `posttest` (T9). `CHECK (jenis_tes IN ('pretest','posttest'))`. |
| mulai_pada | timestamptz | Waktu server saat tes pertama kali dibuka (PP-04). Tidak berubah saat dilanjutkan. |
| selesai_pada | timestamptz, boleh kosong | Waktu server saat siswa menekan Selesai tes (PP-04) |
| status | text | `berlangsung` → (Selesai tes) → `menunggu_penilaian_manual` jika ada tahapan `menunggu_manual`, atau `dinilai` jika semua tahapan sudah punya skor (PT-03) |
| skor_total | smallint, boleh kosong | 0–24 (T5, PP-05). Gabungan skor otomatis + manual (G5). Diisi **hanya jika** semua tahapan sudah punya skor. Kosong selama ada tahapan `menunggu_manual`. |

**`UNIQUE (siswa_id, jenis_tes)`** (PP-03): satu kesempatan per jenis tes. Melanjutkan memakai baris yang sama, bukan baris baru.

**`jawaban_tahap_tes`** (satu baris per tahapan per hasil tes, PP-08)

| Kolom | Tipe | Keterangan |
|---|---|---|
| hasil_tes_id | uuid → hasil_tes | |
| nomor_soal, nomor_tahap | smallint → rubrik_tahap | |
| jawaban_mentah | text, boleh kosong | Persis seperti yang diketik siswa, untuk audit dan tinjauan |
| nilai_terbaca | jsonb, boleh kosong | Hasil normalisasi, misalnya `{"nilai":400000,"satuan":"rupiah"}`, atau kosong jika tidak terbaca |
| status_penilaian | text | **`otomatis`**, **`menunggu_manual`**, atau **`dinilai_manual`** (PT-03 G4). `CHECK` pada ketiga nilai ini. |
| hasil | text, boleh kosong | `benar`, `salah`, `sebagian`, atau `kosong`. Kosong selama `menunggu_manual`. |
| skor | smallint, boleh kosong | 0 sampai `rubrik_tahap.skor_maksimal`. **Kosong** selama `menunggu_manual`. Wajib terisi untuk `otomatis` dan `dinilai_manual`. |
| alasan_penilaian | text, boleh kosong | Catatan mesin penilai, misalnya "setara 400.000 rupiah", "format ambigu: 1.500 → penilaian manual", atau "tahapan uraian → penilaian manual" |
| dinilai_oleh | uuid → penilai, boleh kosong | Untuk `dinilai_manual`: **satu** penilai yang menetapkan skor (PT-08 M5) |
| catatan_penilai | text, boleh kosong | Catatan penilai manual terkait rubrik (opsional) |
| versi | integer | Naik setiap kali skor/status berubah. Dipakai agar dua penilai tidak menimpa satu sama lain (M5). |
| disimpan_pada, dinilai_pada | timestamptz | |

Aturan konsistensi: `status_penilaian = 'menunggu_manual'` ⇔ `skor IS NULL`. Skor manual dibatasi 0 sampai `skor_maksimal` tahapan (dijaga `CHECK`/pemicu). `status_penilaian = 'dinilai_manual'` ⇒ `dinilai_oleh IS NOT NULL`.

**`penilai`** (PT-08 M2)

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid PK | |
| auth_user_id | uuid UNIQUE → auth.users | Akun Auth penilai dengan **email internal** `<penilai.id>@penilai.mathsave.invalid` yang tidak menerima email (PT-23 E1), dan kata sandi turunan HMAC (PT-21). Terpisah dari akun siswa. |
| email_hash | text UNIQUE | `HMAC(RAHASIA_PENILAI, "penilai-cari:" + email asli ternormalisasi)` (PT-24 J1). Dipakai `masuk-penilai` untuk mencari akun. Email asli **tidak disimpan** sebagai teks. |
| peran | text | `peneliti` atau `guru`. `CHECK (peran IN ('peneliti','guru'))`. |
| nama_tampilan | text | Nama singkat yang tercatat sebagai identitas penilai di riwayat koreksi (PT-16 K2) |
| aktif | boolean | Penilai nonaktif tidak bisa masuk atau membuka halaman penilaian. Hanya diubah peneliti lewat `kelola-penilai.js` (PT-20 S3, PT-22, PT-24 J3–J4). |
| dibuat_pada | timestamptz | |

**Pembuatan akun penilai (PT-14 A2–A4, PT-21):** peneliti menjalankan `kelola-penilai.js` di komputernya. Skrip menerima email asli, nama tampilan, peran, dan kata sandi (≥ 12 karakter), lalu membuat pengguna Auth dengan **email internal** (ditandai sudah terkonfirmasi, tidak ada email yang dikirim) dan **kata sandi turunan** (lihat di bawah), kemudian menambahkan baris `penilai` berisi `email_hash`. Email asli hanya dipakai untuk menghitung `email_hash`, dan daftar email guru disimpan peneliti di luar repositori. Dasbor Supabase tidak dipakai untuk mengetik kata sandi penilai, karena dasbor tidak bisa menghitung kata sandi turunan. **Pendaftaran mandiri (sign up) dimatikan** di pengaturan Supabase Auth, sehingga tidak ada registrasi bebas. Ini aman untuk siswa, karena akun siswa juga dibuat peneliti (KF-05d). Kata sandi guru diberikan peneliti secara pribadi dan tidak pernah dicatat di repositori atau dokumen.

**Kata sandi turunan penilai (PT-21 L3).** Mengikuti prinsip PIN siswa (KF-05 L6):

```
kata sandi Auth = HMAC-SHA256(RAHASIA_PENILAI, "penilai-sandi:" + auth_user_id + ":" + kata sandi yang diketik)
```

- Kata sandi yang diketik penilai **tidak pernah disimpan** di tabel Lanora atau log. Supabase Auth hanya menyimpan bcrypt dari kata sandi turunan.
- Kata sandi yang diketik **tidak bisa dipakai** langsung ke layanan login Supabase, sehingga penguncian di `masuk-penilai` tidak bisa dilewati (L2).
- **Rahasia terpisah (PT-24 J1–J2):** `RAHASIA_PENILAI` hanya untuk akun penilai, dan `RAHASIA_KODE` hanya untuk akun siswa. Kebocoran salah satu rahasia tidak membuka akun jenis lainnya. Jika `RAHASIA_PENILAI` diganti, semua `email_hash` dan kata sandi turunan penilai harus dibuat ulang dengan `kelola-penilai.js`.

**Email penilai (PT-14 A1, PT-23):**

| Email | Dipakai untuk | Disimpan di |
|---|---|---|
| Email **asli** | Diketik penilai di layar masuk (A1) | Tidak disimpan sebagai teks. Hanya `penilai.email_hash`. |
| Email **internal** `<penilai.id>@penilai.mathsave.invalid` | Identitas akun di Supabase Auth, dipakai `masuk-penilai` saat memanggil `signInWithPassword` di server | `auth.users` |

- Email internal tidak menerima surat, sehingga **magic link, OTP email, dan email pemulihan tidak pernah sampai ke siapa pun** (E3). Penerimaan domain `.invalid` oleh Supabase Auth diuji bersama akun siswa. Jika ditolak, keduanya memakai domain milik sendiri yang tidak menerima email.
- Frontend tidak pernah memanggil `signInWithOtp`, `signInWithPassword`, atau `resetPasswordForEmail` untuk penilai. Penyedia login lain di Supabase Auth (telepon, OAuth, masuk anonim) tidak diaktifkan (E2–E3).

**Saat penilai masuk (PT-21 L1–L2, PT-22 D2):**

```
Penilai ──email + kata sandi──► Edge Function masuk-penilai
                 1. normalisasi email (huruf kecil, buang spasi di tepi)
                 2. email_hash = HMAC(RAHASIA_PENILAI, "penilai-cari:" + email) → baca status_masuk_penilai
                    terkunci → TERLALU_BANYAK_PERCOBAAN (kata sandi tidak diperiksa)
                 3. cari penilai lewat email_hash
                 4. hitung kata sandi turunan (TETAP dihitung walaupun email tidak ada, agar waktu respons sama)
                 5. penilai tidak ada ATAU aktif = false → MASUK_PENILAI_GAGAL (tanpa memanggil Auth)   (D2)
                    selain itu → signInWithPassword(email internal, kata sandi turunan) di server   (PT-23)
                 6. berhasil → kembalikan sesi; gagal → MASUK_PENILAI_GAGAL (jawaban sama dengan langkah 5)
                 7. perbarui status_masuk_penilai secara atomik (berhasil → 0; gagal → +1;
                    gagal ke-5 → terkunci_sampai = now() + 5 menit)
Frontend ◄──sesi── supabase.auth.setSession(sesi) → profil_penilai()
```

**Keamanan dan pengelolaan akun penilai (PT-19 sampai PT-24):**

- **Kata sandi minimal 12 karakter** (S1): diperiksa `kelola-penilai.js` terhadap kata sandi yang diketik, saat membuat akun dan saat mereset. Pengaturan panjang minimal di Supabase Auth tidak menjadi pengaman, karena yang tersimpan di Auth adalah kata sandi turunan yang selalu panjang.
- **Lupa kata sandi** (P1–P3, L4): penilai menghubungi peneliti. Peneliti menjalankan `kelola-penilai.js reset`, yang menghitung kata sandi turunan baru dan memperbaruinya lewat Admin API Supabase. Peneliti lalu memberikan kata sandi baru secara pribadi. **Email pemulihan Supabase tidak dipakai** (tidak ada `resetPasswordForEmail` di frontend). Reset juga mengosongkan kunci di `status_masuk_penilai` untuk akun itu.
- **Penguncian** (S2, L2): tabel `status_masuk_penilai` (`email_hash` PK = HMAC email yang dicoba, terdaftar atau tidak; `gagal_berturut` 0–5; `terkunci_sampai`; `diperbarui_pada`), hanya diakses Edge Function `masuk-penilai`. Aturannya sama dengan `status_masuk` siswa (KF-05b): atomik, berurutan, kunci berakhir setelah 5 menit, kembali 0 setelah berhasil.
- **Penonaktifan** (S3, PT-22): `kelola-penilai.js nonaktifkan` hanya untuk akun berperan `guru`, dan **menolak** akun `peneliti` (D4). Langkahnya:
  1. `penilai.aktif = false` (D1). Baris `penilai` dan akun Auth **tidak dihapus**, agar `dinilai_oleh`, `koreksi_skor.penilai_id`, dan `dinilai_oleh_sebelum` tetap merujuk ke orang yang benar.
  2. **Cabut sesi** guru di Supabase Auth (D3), sehingga token penyegar tidak bisa dipakai lagi. Fungsi Admin API yang tepat untuk mencabut sesi pengguna lain diperiksa saat implementasi, dan **tidak boleh** berupa penghapusan akun.
  3. Selama sisa umur token akses, semua RPC penilai tetap menolak (`BUKAN_PENILAI`) karena `adalah_penilai()` memeriksa `aktif` di setiap panggilan. Frontend yang menerima `BUKAN_PENILAI` langsung keluar.
  4. Login berikutnya ditolak `masuk-penilai` (D2).
- **Aktif kembali** (PT-24 J3–J5): `kelola-penilai.js aktifkan` hanya untuk akun berperan `guru`. Skrip mengubah `aktif = true` dan mengosongkan kunci di `status_masuk_penilai`. Guru masuk lagi lewat `masuk-penilai` dengan kata sandi yang berlaku, atau kata sandi baru jika peneliti sekaligus mereset. Nilai yang pernah diberikan, `dinilai_oleh`, dan riwayat koreksi tidak berubah.
- **Hanya peneliti** (PT-24 J4): `aktifkan`, `nonaktifkan`, `buat`, dan `reset` hanya ada di skrip pengelola yang membutuhkan `SUPABASE_SERVICE_ROLE_KEY` dan `RAHASIA_PENILAI` di komputer peneliti. Tidak ada RPC, endpoint, atau tombol di aplikasi untuk mengubah `penilai.aktif`, dan RLS tidak memberi hak `UPDATE` atas tabel `penilai` kepada siapa pun selain *service role*.

**Fungsi pemeriksa peran** (`SECURITY DEFINER`, memakai `auth.uid()`):

| Fungsi | Benar jika | Dipakai untuk |
|---|---|---|
| `adalah_penilai()` | ada di `penilai`, `aktif = true`, peran `peneliti` **atau** `guru` | antrean dan menilai jawaban (PT-17 H1) |
| `adalah_peneliti()` | ada di `penilai`, `aktif = true`, peran `peneliti` | koreksi skor, menelusuri skor yang sudah dinilai, riwayat koreksi, dan data penelitian/CSV (PT-17 H2–H3, PT-18 R1) |

Akun siswa **tidak pernah** ada di tabel `penilai`, sehingga siswa tidak bisa memakai fungsi penilaian (PT-08 M2).

**`koreksi_skor`** (riwayat koreksi, PT-08 M4 dan PT-16; tidak bisa diubah atau dihapus)

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid PK | |
| hasil_tes_id, nomor_soal, nomor_tahap | → jawaban_tahap_tes | Tahapan yang dikoreksi |
| skor_sebelum | smallint | Skor lama (K2) |
| skor_sesudah | smallint | Skor baru, 0 sampai `skor_maksimal` tahapan (K2) |
| status_sebelum | text | `otomatis` atau `dinilai_manual` (PT-16 K1). Tahapan `menunggu_manual` tidak dikoreksi, melainkan dinilai. |
| dinilai_oleh_sebelum | uuid → penilai, boleh kosong | Penilai sebelumnya (kosong jika `otomatis`). Menjaga jejak penilaian pertama (PT-18 R3). |
| alasan | text | **Wajib**, tidak boleh kosong (`CHECK (length(trim(alasan)) > 0)`) |
| penilai_id | uuid → penilai | Identitas penilai |
| dikoreksi_pada | timestamptz | Waktu server |

Saat koreksi disimpan, dalam **satu transaksi**: baris `koreksi_skor` dibuat, `jawaban_tahap_tes` diperbarui (`skor` baru, `status_penilaian = 'dinilai_manual'`, `dinilai_oleh` = pengoreksi, `versi` naik), lalu skor soal dan `hasil_tes.skor_total` dihitung ulang. Tabel `koreksi_skor` hanya bisa ditambah (*append-only*, K3): tidak ada `UPDATE` atau `DELETE` untuk siapa pun lewat aplikasi. Hak `UPDATE`/`DELETE` dicabut di database dan dijaga pemicu. Koreksi **hanya oleh peneliti** (PT-18 R1). Koreksi adalah proses terpisah dari penilaian pertama (R3), sehingga tidak ditolak oleh aturan satu penilai (M5).

`PRIMARY KEY (hasil_tes_id, nomor_soal, nomor_tahap)`. Jawaban disimpan per tahapan sepanjang pengerjaan, sehingga tidak hilang saat terjadi gangguan (PP-03). Setelah `hasil_tes.selesai_pada` terisi, baris tidak bisa diubah oleh siswa.

**Penilaian gabungan otomatis + manual per tahapan** (PP-05, PP-07, PP-09, PT-03 Pilihan A)

```
Selesai tes
   │
   ▼
nilai-tes (otomatis, server) untuk setiap tahapan:
   jawaban kosong (semua jenis, termasuk uraian) ► otomatis, hasil=kosong, skor 0   (G7, G8: tidak masuk antrean manual)
   nilai / ekspresi / pilihan, hasil PASTI ─────► otomatis, skor sesuai rubrik
   nilai / ekspresi tidak pasti (ambigu/tak terbaca) ─► menunggu_manual (skor kosong)   (G3)
   uraian ──────────────────────────────────────► menunggu_manual (skor kosong)   (G2)
   │
   ▼
ada menunggu_manual? ── ya ──► hasil_tes.status = menunggu_penilaian_manual
   │                               │  peneliti/guru menilai dengan rubrik asli → dinilai_manual
   │                               ▼
   └── tidak ─────────────────► hasil_tes.status = dinilai
                                 skor soal = Σ skor tahapan (maks 6)
                                 skor total = Σ skor soal (maks 24)   (G5)
```

| `jenis_pemeriksaan` | Mekanisme otomatis | Jika tidak pasti |
|---|---|---|
| `nilai` | Normalisasi ke nilai + satuan, konversi satuan waktu (KF-02), lalu dibandingkan dengan kunci dalam toleransi | `menunggu_manual` |
| `ekspresi` | Ekspresi aritmetika (angka, + − × ÷, kurung, pecahan, persen) diurai dengan **pengurai aman** buatan sendiri (**tidak** memakai `eval`), lalu dihitung dan dibandingkan. Struktur ekspresi diperiksa jika rubrik mensyaratkannya. | `menunggu_manual` |
| `pilihan` | Isian terstruktur dicocokkan dengan kunci | — (selalu pasti) |
| `uraian` | **Tidak dinilai otomatis** (PT-03 G2). Jawaban terisi selalu dinilai manual oleh peneliti/guru berdasarkan rubrik asli. Jawaban kosong otomatis bernilai 0 (G7). | `menunggu_manual` (hanya jika terisi) |

**Penilaian manual:** penilai membaca `jawaban_mentah` beserta deskripsi rubrik di `rubrik_tahap.kunci`, lalu mengisi `skor`, `hasil`, `dinilai_oleh`, `catatan_penilai`, dan mengubah status menjadi `dinilai_manual`. Setelah tahapan `menunggu_manual` terakhir dinilai, server menghitung ulang skor soal dan `skor_total` lalu mengubah status tes menjadi `dinilai`. Siswa tidak pernah bisa mengisi atau mengubah skor.

**Pelaksanaan (PT-08):**

- **Alat:** halaman penilaian **di dalam Lanora** (rute `#/penilai/...`, design.md 5.12), memakai RPC khusus penilai (api.md 3.13). Dasbor Supabase **bukan** alat penilaian. Dasbor tetap dipakai peneliti untuk melihat dan mengunduh data penelitian (PP-10).
- **Akses:** hanya akun di tabel `penilai`. Antrean dan menilai memeriksa `adalah_penilai()` (guru + peneliti). Koreksi, penelusuran skor yang sudah dinilai, riwayat koreksi, dan data penelitian memeriksa `adalah_peneliti()` (PT-17, PT-18). Rute penilai di frontend juga memeriksa peran, tetapi hanya untuk kenyamanan, **bukan** sebagai pengaman.
- **Login penilai (PT-14, PT-20, PT-21):** email + kata sandi, lewat layar masuk terpisah dari layar masuk siswa, **hanya** melalui Edge Function `masuk-penilai` (lihat "Saat penilai masuk" di atas). Frontend **tidak** memanggil `signInWithPassword` sendiri. Setelah masuk, frontend memanggil `profil_penilai()` untuk mengetahui peran. Jika akun tidak ada di `penilai` atau nonaktif, penilai langsung dikeluarkan.
- **Anonim (PT-15):** RPC penilaian **tidak pernah** mengembalikan `siswa_id`, nama panggilan, kode siswa, atau kelas. Tahapan dikenali dengan `hasil_tes_id` dan nomor soal/tahap, ditambah `jenis_tes`. Hubungan ke siswa tetap tersimpan di `hasil_tes.siswa_id` untuk peneliti (N3).
- **Satu penilai per tahapan (M5, PT-18 R3):** berlaku untuk penilaian pertama. Penyimpanan nilai memakai pemeriksaan `versi`. Jika tahapan sudah dinilai orang lain sejak halaman dibuka, penyimpanan ditolak `SUDAH_DINILAI`.
- **Koreksi (M4, PT-16, PT-18):** hanya peneliti, lewat RPC koreksi yang **mewajibkan alasan**, untuk skor `otomatis` maupun `dinilai_manual`, lalu tercatat di `koreksi_skor`. Guru hanya menilai antrean (R2).
- **Kunci rubrik:** penilai boleh melihat deskripsi rubrik dan kunci tahapan. Siswa tetap tidak pernah menerimanya, kecuali pembahasan setelah posttest (PP-06).

**Normalisasi (PP-09):**

- Membuang `Rp`, spasi, dan pemisah ribuan; mengenali koma desimal; mengenali `%`; mengenali satuan `tahun`/`bulan`/`hari`.
- Fungsi `uraiAngka` (Fase 3) sudah menangani `Rp`, ribuan, dan desimal, tetapi **membuang `%` tanpa catatan** dan **belum mengenali satuan**. Untuk tes, dibutuhkan fungsi normalisasi baru yang **menyimpan informasi** persen dan satuan, serta **menandai angka ambigu**. Kode Fase 3 tidak diubah sekarang. Ini menjadi tugas Fase 12A.
- Angka yang bisa dibaca dua arti, misalnya `1.500` atau `1,500`, ditandai ambigu, dan penanganannya mengikuti PT-12.

**Tempat penilaian:** Edge Function `nilai-tes`, dipanggil server saat tes diselesaikan. Fungsi ini memakai modul normalisasi dan pengurai ekspresi yang ditulis sekali dan diuji dengan Vitest, mengikuti prinsip "satu sumber logika" seperti `bungaTunggal.js`. Penilaian tidak pernah dijalankan di perangkat siswa, karena kunci rubrik tidak boleh dikirim ke perangkat.

**Jaminan "tidak mengarang skor" (PT-03 G3):** mesin penilai hanya memberi skor jika hasil pemeriksaan **pasti** (`benar`, `salah`, atau `sebagian` menurut aturan rubrik). Tahapan **kosong** (tidak diisi atau hanya spasi) pasti bernilai 0, dengan status `otomatis` dan hasil `kosong`, untuk **semua jenis tahapan** termasuk uraian, baik di pretest maupun posttest. Tahapan kosong **tidak pernah** masuk `v_antrean_penilaian_manual` (G7–G9). Tahapan yang **terisi** tetapi tidak pasti dialihkan ke `menunggu_manual` tanpa skor (G10), dan skor total tidak diisi sampai penilaian manual selesai.

**Tidak skor penuh hanya dari jawaban akhir:** skor soal adalah jumlah skor per tahapan. Tahapan jawaban akhir hanya bernilai sebesar bobotnya di rubrik. Aturan skor lanjutan (PT-06) dan skor sebagian (PT-07) mengikuti rubrik.

**Data penelitian dan CSV (PP-10):**

- *View* `v_hasil_tes_penelitian`, hanya dapat dibaca *service role*/peneliti, berisi satu baris per siswa per jenis tes: identitas siswa (kolom menunggu PT-11), `jenis_tes`, `mulai_pada`, `selesai_pada`, durasi (`selesai_pada − mulai_pada`), skor setiap tahapan **beserta status penilaiannya** (`otomatis`, `menunggu_manual`, `dinilai_manual`), skor per soal/indikator, `skor_total`, dan status tes. Dengan begitu, peneliti bisa membedakan skor otomatis dan manual dalam analisis.
- Antrean penilaian `v_antrean_penilaian_manual` berisi semua tahapan berstatus `menunggu_manual` beserta jawaban siswa, label tahapan, dan deskripsi rubrik. Jawaban kosong tidak pernah muncul di antrean ini (G8). Penilai membacanya **lewat RPC halaman penilaian** (PT-08), bukan langsung. *View* ini **tidak memuat** kolom identitas siswa (PT-15 N1), hanya `jenis_tes` (N2).
- *View* `v_koreksi_skor` (**hanya peneliti**, PT-17 H2–H3) berisi riwayat koreksi: skor lama/baru, status sebelumnya, alasan, penilai, dan waktu (PT-16 K2). Peneliti bisa mengunduhnya sebagai CSV bersama data penelitian.
- Semua *view* data penelitian dan unduhan CSV **hanya untuk peneliti**. Guru tidak punya akses (PT-17 H2).
- *View* kedua untuk perbandingan: satu baris per siswa dengan kolom pretest dan posttest berdampingan.
- Peneliti membuka *view* ini di **dasbor Supabase** dan mengunduhnya sebagai **CSV**. Ketersediaan tombol unduh CSV di dasbor Supabase paket Free **perlu dipastikan** saat implementasi. Jika tidak tersedia, alternatifnya dibahas dengan pengembang.

**`kemajuan_materi`**

| Kolom | Tipe | Keterangan |
|---|---|---|
| siswa_id | uuid → siswa | PK gabungan |
| sub_materi | text | PK gabungan |
| status | text | `belum`, `sedang`, `selesai` |
| kartu_terakhir | smallint | untuk melanjutkan belajar |
| diperbarui_pada | timestamptz | |

**`penjelasan_siswa`** (F-11, prioritas Could)

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid PK | |
| siswa_id | uuid → siswa | |
| soal_id | uuid → soal | |
| isi | text | maksimal 500 karakter |
| dibuat_pada | timestamptz | |

**`percobaan_masuk`** (hanya diakses Edge Function)

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | bigint PK | |
| ip_hash | text | hash alamat IP, bukan IP asli |
| kode_hash | text, boleh kosong | HMAC "cari:" dari kode yang dicoba (bukan kode asli). PIN tidak pernah dicatat. |
| berhasil | boolean | |
| dibuat_pada | timestamptz | |

Tabel ini adalah **log** untuk pemantauan dan batas IP tambahan yang opsional. Penguncian akun memakai tabel `status_masuk` di bawah.

**`status_masuk`** (KF-05b, hanya diakses Edge Function)

| Kolom | Tipe | Keterangan |
|---|---|---|
| kode_hash | text PK | HMAC "cari:" dari kode yang dicoba, **terdaftar atau tidak** |
| gagal_berturut | smallint | Jumlah kegagalan berurutan, 0–5 |
| terkunci_sampai | timestamptz, boleh kosong | Diisi `now() + lama_kunci_masuk(tingkat)` saat kegagalan ke-5. Kosong = tidak terkunci. |
| tingkat_kunci | smallint 0–3, bawaan 0 | (migrasi `…0006`) Jumlah masa kunci yang sudah terjadi. Lama kunci: tingkat 0 → 5 menit, 1 → 15 menit, 2 ke atas → 60 menit. Kembali 0 setelah berhasil, setelah reset PIN (baris dihapus), atau jika `diperbarui_pada` lebih dari 24 jam yang lalu. |
| diperbarui_pada | timestamptz | |

Aturan:

- Perubahan nilai dilakukan secara **atomik** dalam satu perintah atau transaksi (`INSERT … ON CONFLICT … DO UPDATE`), sehingga beberapa percobaan bersamaan tidak bisa melewati batas 5.
- Kegagalan dihitung **berurutan** (K7). Kegagalan ke-5 mengisi `terkunci_sampai` (K10).
- Jika `terkunci_sampai` ≤ `now()`, kunci dianggap berakhir: `gagal_berturut` kembali 0 dan `terkunci_sampai` dikosongkan pada percobaan berikutnya (K6, K9).
- Login berhasil → `gagal_berturut = 0` (K8).
- Penguncian hanya memengaruhi `kode_hash` itu sendiri, tidak pernah alamat IP atau akun lain (K4).
- Baris lama yang tidak terkunci dan tidak berubah lebih dari 1 hari boleh dihapus berkala, karena tidak memuat data pribadi.

Catatan: siswa satu sekolah sering berbagi satu IP publik (Wi-Fi sekolah). Karena itu, aturan lama "10 kali gagal per IP dalam 15 menit" **tidak berlaku lagi** (KF-05b K3, K5).

**Batas gagal login per IP (migrasi `…0006`, 12 November 2026):** `masuk_ip_terbatas(p_ip_hash)` menghitung `percobaan_masuk` yang gagal dari `ip_hash` itu dalam 1 jam terakhir (indeks parsial `percobaan_masuk_ip_gagal_idx`). Mulai 100 kegagalan (`batas_masuk_ip()`), `masuk-kode` dan `atur-pin-baru` menjawab `TERLALU_BANYAK_PERCOBAAN` tanpa mencatat permintaan itu. `ip_hash` hanya diisi dari header tepercaya `cf-connecting-ip` (`penangan.js` `ambilIp`). `x-forwarded-for` tidak dipakai karena bisa diisi klien. Tanpa IP tepercaya, batas ini tidak dipakai.

### Row Level Security (ringkas)

| Tabel | Siswa (`authenticated`) | Catatan |
|---|---|---|
| siswa | SELECT baris miliknya | Tidak bisa mengubah data |
| soal | **Tidak ada akses langsung** | Hanya lewat fungsi RPC `SECURITY DEFINER` |
| percobaan_jawaban | SELECT miliknya, **kecuali** baris kuis yang sesinya belum dikumpulkan (kolom `benar` akan membocorkan kunci selama kuis, F-07 aturan 8) | INSERT hanya lewat `periksa_jawaban` |
| sesi_kuis | SELECT miliknya | Dibuat/diubah lewat RPC |
| kemajuan_materi | SELECT miliknya | Diubah lewat RPC |
| penjelasan_siswa | SELECT, INSERT miliknya | |
| percobaan_masuk | Tidak ada akses | Hanya *service role* |
| kelas *(Fase 5A)* | Tidak ada akses langsung | Hanya lewat fungsi `service_role` (`daftar_kelas_aktif`, `kelola_kelas_*`). Siswa menerima daftar kelas lewat `daftar-pertama` setelah kode kelas benar. |
| percobaan_daftar *(Fase 5A)* | Tidak ada akses | Hanya *service role* (batas U9) |
| status_masuk | Tidak ada akses | Hanya *service role*, lewat fungsi `kunci_masuk_aktif` dan `catat_percobaan_masuk` (api.md 2c). Dipakai bersama oleh `masuk-kode`, `daftar-pertama`, dan `atur-pin-baru` (KF-05b). |
| reset_pin | Tidak ada akses | Hanya *service role* (alat reset peneliti dan Edge Function `atur-pin-baru`, KF-05c) |
| instrumen_tes | Tidak ada akses langsung | Teks soal dibaca lewat RPC tes. `pembahasan` hanya dikirim setelah posttest siswa selesai (PP-06). Kapan tes boleh dibuka menunggu PT-09. |
| rubrik_tahap | Tidak ada akses langsung | `label` tahapan dikirim lewat RPC tes. `kunci` **tidak pernah** dikirim ke perangkat siswa. |
| hasil_tes, jawaban_tahap_tes | Penulisan jawaban hanya lewat RPC tes. Siswa membaca **skor** miliknya hanya jika status tes `dinilai` (PP-06, PT-08 M3), dan **tidak pernah** bisa menulis skor atau status penilaian. | Penilaian otomatis berjalan di server. Penilaian manual lewat RPC yang memeriksa `adalah_penilai()` (guru + peneliti). Koreksi lewat RPC yang memeriksa `adalah_peneliti()` (PT-17, PT-18). Peneliti membaca lewat *view* penelitian (PP-10). Guru tidak bisa membaca `hasil_tes` maupun skor secara langsung. |
| penilai | Tidak ada akses untuk siswa | Penilai membaca baris miliknya sendiri. Baris dibuat, dinonaktifkan (`aktif = false`, tidak dihapus), dan diaktifkan kembali **hanya** oleh peneliti dengan `kelola-penilai.js` (*service role*). Tidak ada `INSERT`/`UPDATE`/`DELETE` untuk peran `authenticated` (PT-14, PT-21 L4, PT-22, PT-24 J3–J4). |
| status_masuk_penilai | Tidak ada akses | Hanya *service role* (Edge Function `masuk-penilai` dan `kelola-penilai.js` saat reset, PT-20 S2, PT-21) |
| koreksi_skor | Tidak ada akses untuk siswa dan guru | Ditambah lewat RPC koreksi oleh peneliti. **Tidak bisa diubah atau dihapus** (PT-16 K3). Dibaca peneliti lewat `v_koreksi_skor`. |
| v_hasil_tes_penelitian | Tidak ada akses untuk siswa dan guru | Hanya peneliti (PP-10, PT-17 H2–H3) |
| v_antrean_penilaian_manual | Tidak ada akses untuk siswa | Dibaca penilai (guru + peneliti) lewat RPC halaman penilaian (PT-08, PT-17 H1). **Tanpa identitas siswa** (PT-15). |
| v_koreksi_skor | Tidak ada akses untuk siswa dan guru | Hanya peneliti (PT-17 H2–H3) |
| kisi_kisi_kuis | Tidak ada akses langsung | Dibaca oleh RPC `mulai_kuis` (`SECURITY DEFINER`) |
| sesi_kuis_soal | Tidak ada akses langsung | Ditulis dan dibaca hanya lewat RPC kuis. Soal tetap dikirim lewat bentuk "soal publik" tanpa kunci. |

Peran `anon` tidak mendapat akses ke tabel mana pun.

## 7. Hosting dan Biaya

### Supabase

Ketentuan paket **Free** yang diperiksa dari halaman resmi [supabase.com/pricing](https://supabase.com/pricing) dan [dokumentasi Custom Domains](https://supabase.com/docs/guides/platform/custom-domains) pada **11 November 2026**:

| Ketentuan paket Free | Nilai |
|---|---|
| Proyek aktif | maksimal 2 |
| Ukuran database | 500 MB |
| Penyimpanan file | 1 GB, ukuran unggahan maksimal 50 MB |
| Egress | 5 GB (+ 5 GB *cached egress*) |
| Pengguna aktif bulanan (Auth) | 50.000 |
| Pemanggilan Edge Function | 500.000 per bulan |
| Penjedaan | Proyek Free **dijeda setelah 1 minggu tidak aktif** |
| Custom Domain | **Tidak tersedia** di paket Free (add-on $10 per domain per bulan, khusus paket berbayar) |
| Paket Pro | mulai $25 per bulan |

Ketentuan ini bisa berubah. Periksa ulang halaman resmi sebelum peluncuran.

**Perkiraan pemakaian Lanora** (asumsi 1–3 kelas, ±100 siswa):

- Database: bank soal ±60 baris dan riwayat jawaban ribuan baris. Perkiraan jauh di bawah 500 MB.
- Edge Function: hanya dipanggil saat login. Perkiraan jauh di bawah 500.000 per bulan.
- Egress: gambar materi dibuat ringan (SVG atau PNG terkompresi).

**Risiko penjedaan:** Jika aplikasi tidak dipakai selama 1 minggu (misalnya saat libur), proyek dijeda. Pengelola harus memulihkan proyek dari dasbor Supabase sebelum aplikasi dipakai lagi. Langkah ini dicatat di README.

### Hosting frontend: Netlify Free (KF-01, diputuskan 12 November 2026)

**Latar belakang.** Supabase Storage **tidak cocok** untuk menyajikan halaman web di paket Free. File HTML disajikan sebagai teks biasa demi keamanan, kecuali proyek memakai Custom Domain, dan Custom Domain hanya tersedia di paket berbayar. Karena itu, frontend di-host terpisah, sedangkan **database, autentikasi, dan Edge Function tetap di Supabase**.

**Keputusan:** frontend Lanora (hasil build Vite) di-host di **Netlify paket Free ($0)** dan terhubung ke repositori **GitHub** untuk deployment otomatis. Alasan dari pengembang:
- dipakai untuk penelitian dan uji coba langsung dengan siswa di sekolah;
- harus bisa dibuka lewat link dari HP maupun laptop;
- frontend memakai Vite + JavaScript;
- pembaruan dilakukan otomatis lewat GitHub.

```
GitHub (repositori) ──push──► Netlify (build: npm run build → dist/) ──► https://<nama-situs>.netlify.app
                                                                              │
                                                    HP/laptop siswa ◄─────────┘
                                                          │ HTTPS (supabase-js)
                                                          ▼
                                                    Supabase (database, Auth, Edge Function)
```

**Ketentuan paket Free Netlify**, diperiksa dari halaman resmi pada **12 November 2026**: [netlify.com/pricing](https://www.netlify.com/pricing/), [Credit-based pricing plans](https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/credit-based-pricing-plans/), dan [How credits work](https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/how-credits-work/).

| Ketentuan | Nilai |
|---|---|
| Harga | $0 ("You'll never be charged for the Free plan") |
| Credits | **300 credits per bulan**, dengan **hard limit**, tanpa *auto recharge*, dan sisa tidak dibawa ke bulan berikutnya |
| Jika credits habis | **Semua situs dijeda**, dan pengunjung melihat halaman "Site not available" sampai credits direset di awal siklus berikutnya |
| Production deploy | **15 credits** per deploy |
| Deploy Preview dan branch deploy | 0 credits |
| Deploy gagal dan *rollback* | Tidak memakai credits |
| Bandwidth | 20 credits per GB |
| Web request | 2 credits per 10.000 request |
| Compute (functions) | 10 credits per GB-jam (tidak dipakai Lanora, karena backend di Supabase) |
| Deploy dari Git | Termasuk ("Deploy from AI, Git, or API") |
| Custom domain dengan SSL/HTTPS | Termasuk |
| Build bersamaan | 1 |
| *Shared* environment variables | **Tidak tersedia** di Free (khusus Pro) |
| Environment variables per situs | **Tidak disebutkan** di halaman yang dibaca. **Perlu diverifikasi** saat Fase 14. |
| Batasan penggunaan komersial/penelitian | Tidak disebutkan di halaman yang dibaca |

Ketentuan ini bisa berubah. Periksa ulang halaman resmi sebelum deployment dan sebelum uji coba.

**Konfigurasi build** (dipasang saat Fase 14, bukan sekarang):

| Pengaturan | Nilai |
|---|---|
| Build command | `npm run build` |
| Publish directory | `dist` |
| Versi Node | ≥ 22.12 (sesuai `engines` di `package.json`) |
| Environment variables | `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` (bagian 8). Kunci rahasia **tidak pernah** dimasukkan ke Netlify. |
| Aturan *redirect*/*rewrite* | Tidak diperlukan, karena router memakai hash (`#/...`) dan Vite memakai `base: './'` |

Variabel `VITE_*` dibaca Vite **saat build**, sehingga harus tersedia di lingkungan build Netlify. Jika ternyata environment variables per situs tidak tersedia di paket Free, keputusan cara alternatifnya dibahas dengan pengembang saat Fase 14, tanpa pernah menaruh kunci rahasia di repositori.

**Perkiraan pemakaian credits** (asumsi kasar, perlu dipantau; ±100 siswa, ±10 kunjungan per siswa per bulan):

| Komponen | Perkiraan | Credits/bulan |
|---|---|---|
| Bandwidth | ±0,5 GB (bundle kecil, ±30 KB gzip tanpa Three.js; Three.js hanya dimuat di Simulasi) | ±10 |
| Web request | ±20.000 | ±4 |
| Production deploy | **15 per deploy** | 10 deploy = 150 |

**Risiko utama: production deploy, bukan jumlah siswa.** Jika setiap *push* ke cabang produksi memicu deploy, 20 kali push dalam sebulan sudah menghabiskan 300 credits, dan situs akan **dijeda di tengah penelitian**. Rekomendasi pemantauan:

- Pantau saldo credits di dasbor Netlify, minimal sebelum dan setelah setiap sesi uji coba dengan siswa.
- Batasi jumlah production deploy selama periode penelitian. Kumpulkan beberapa perubahan dalam satu deploy, dan uji dulu dengan Deploy Preview (0 credits).
- Hindari deploy di hari uji coba, kecuali untuk perbaikan penting.
- Catat jumlah deploy dan sisa credits di log penelitian.

Cara mengatur cabang dan deploy otomatis secara rinci ditetapkan saat Fase 14.

## 8. Variabel Lingkungan

| Nama | Dipakai di | Rahasia? | Diatur di |
|---|---|---|---|
| `VITE_SUPABASE_URL` | Frontend | Tidak | `.env` lokal dan **environment variables build Netlify** (KF-01) |
| `VITE_SUPABASE_ANON_KEY` | Frontend | Tidak (kunci publik, dilindungi RLS) | `.env` lokal dan **environment variables build Netlify** (KF-01) |
| `RAHASIA_KODE` | Edge Function akun siswa (`masuk-kode`, `daftar-pertama`, `atur-pin-baru`) dan skrip pengelola siswa. **Tidak** dipakai untuk akun penilai (PT-24 J2). | **Ya** | *Secret* Edge Function Supabase dan `.env` lokal pengelola. **Tidak pernah** di Netlify. |
| `RAHASIA_PENILAI` | Edge Function `masuk-penilai` dan skrip `kelola-penilai.js` (PT-24 J1) | **Ya** | *Secret* Edge Function Supabase dan `.env` lokal peneliti. Nilainya berbeda dari `RAHASIA_KODE`. **Tidak pernah** di frontend, repositori, atau Netlify. |
| `KODE_KELAS_HASH` | Edge Function `daftar-pertama` (KF-05d), serta `daftar-pertama` dan `atur-pin-baru` untuk memastikan PIN ≠ kode kelas (KF-05a) | **Ya** | *Secret* Edge Function Supabase: `HMAC(RAHASIA_KODE, "kelas:" + kode_kelas)`. Kode kelas asli tidak disimpan di server. **Tidak pernah** di frontend atau Netlify. |
| `SUPABASE_SERVICE_ROLE_KEY` | Skrip pengelola (lokal) dan Edge Function (otomatis tersedia) | **Ya**, jangan pernah ke frontend | `.env` lokal pengelola. **Tidak pernah** di Netlify. |

> Supabase sedang memperkenalkan format kunci API baru (*publishable* dan *secret key*). Saat implementasi, ikuti nama kunci yang tampil di dasbor proyek. Prinsipnya tetap: hanya kunci publik yang boleh ada di frontend.

## 9. Ilustrasi 3D (Three.js)

- Dimuat dengan `import()` dinamis **hanya** saat siswa menekan "Tampilkan ilustrasi 3D" di halaman Simulasi.
- Isi adegan: deretan tumpukan koin per periode. Bagian modal berwarna netral, bagian bunga berwarna utama.
- Tanpa animasi otomatis. Kamera dapat diputar dan diperbesar dengan sentuhan (`OrbitControls`).
- Jumlah objek dibatasi (maksimal 24 tumpukan). Rasio piksel dibatasi ≤ 2 agar ringan di Android.
- Cek dukungan WebGL. Jika tidak didukung, tampilkan pesan dan tabel saja.
- Saat siswa meninggalkan halaman, *renderer* dan geometri dibersihkan (`dispose()`).

## 10. Keamanan dan Privasi

- Tidak ada kunci rahasia di frontend atau di repositori. `.env` masuk `.gitignore`.
- Netlify hanya menerima variabel publik `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY`. `RAHASIA_KODE`, `RAHASIA_PENILAI`, dan `SUPABASE_SERVICE_ROLE_KEY` tidak pernah dimasukkan ke Netlify, karena semua variabel `VITE_*` ikut tertanam di hasil build yang bisa dibaca siapa pun (KF-01).
- RLS aktif di semua tabel (bagian 6).
- Kunci jawaban, pembahasan, dan pola kesalahan hanya keluar dari server **setelah** jawaban dikirim. Pada kuis, semuanya keluar setelah kuis diselesaikan.
- Untuk soal pilihan ganda, perangkat hanya menerima `kode` dan `teks` opsi. `nilai`, `kunci`, dan `jenis_kesalahan` opsi tidak dikirim selama kuis, karena dari situ siswa bisa menebak opsi kunci.
- Batas waktu kuis diperiksa dengan **waktu server** (`now()` dibandingkan `sesi_kuis.batas_waktu`), **bukan jam perangkat siswa**. Jawaban yang diterima server setelah batas waktu ditolak, termasuk jawaban yang dibuat saat offline (KF-20). Sesi yang kedaluwarsa ditutup otomatis oleh server (lihat "Mekanisme timer kuis" di bagian 6).
- Antrean jawaban offline di perangkat hanya berisi pilihan siswa (ID opsi atau angka), tanpa kunci jawaban.
- Urutan acak opsi disimpan di server (`sesi_kuis_soal.urutan_opsi`), bukan dibuat di perangkat, sehingga tidak bisa diubah siswa dan tetap sama di perangkat mana pun. Antrean ini dihapus setelah terkirim, ditolak, atau kuis selesai.
- Data pribadi minimal: nama panggilan dan kelas. Tanpa email pribadi (KF-05). Kode siswa disimpan dalam bentuk hash. **PIN tidak disimpan di tabel mana pun.** PIN hanya menjadi bahan kata sandi Supabase Auth, yang disimpan sebagai hash bcrypt (bagian 5).
- Daftar kode siswa dibagikan langsung ke masing-masing siswa. PIN tidak pernah diketahui peneliti, karena dibuat sendiri oleh siswa (KF-05d).
- **Kode kelas `230706`** hanya diperiksa di server lewat *secret* `KODE_KELAS_HASH`, dan **tidak boleh** ada di kode frontend, hasil build, atau Netlify. Nilainya boleh tercatat di dokumen perencanaan **hanya jika repositori GitHub privat** (KF-05d, dikonfirmasi pengembang).
- Alamat IP untuk pembatasan login disimpan sebagai hash dan dihapus berkala (lebih dari 7 hari).
