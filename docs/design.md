# Desain Antarmuka — Lanora

> **Catatan nama:** Lanora sebelumnya bernama **MathSave** (nama diganti 12 November 2026). Wawancara, keputusan, dan dokumen sebelum tanggal itu memakai nama MathSave. Pengenal teknis lama sengaja tidak diubah agar akun dan data siswa tetap aman: domain email internal `siswa.mathsave.invalid` dan `penilai.mathsave.invalid`, nama paket npm `mathsave`, kunci `mathsave:pesan-singkat`, komentar di file migrasi, dan nama folder proyek.

Panduan visual dan interaksi Lanora. Setiap keputusan desain di sini dikaitkan dengan kebutuhan siswa di [PRD.md](PRD.md) (kode KB-xx) dan prinsip Cognitive Load Theory.

> **Revisi 11 November 2026 — tema Sage Green + Cream.** Tema visual diganti dari biru-putih menjadi sage green dan krem, dengan kartu membulat, bayangan lembut, dan ilustrasi matematika yang ramah. Prinsip beban kognitif tetap berlaku. Pastel dan ilustrasi dibatasi agar tidak bertentangan dengan temuan wawancara bahwa warna dan animasi yang ramai mengganggu fokus (EL03, DS03). Lihat bagian 2, 6, dan 7.
>
> **Revisi 12 November 2026 — rebranding Lanora, tema Emerald + Mint.** Nama aplikasi menjadi Lanora. Palet diganti menjadi hijau emerald dan mint yang lebih segar, dengan struktur token, komponen, dan aturan yang **sama**. Hanya nilai warnanya yang berubah. Ditambah logo, favicon, ikon aplikasi, dan manifest (bagian 7.3). Semua pasangan teks dihitung ulang dan lolos WCAG AA (bagian 2).

---

## 1. Prinsip Desain

| No | Prinsip | Alasan (dari wawancara) |
|---|---|---|
| 1 | **Satu layar, satu tujuan.** Satu kartu berisi satu ide atau satu soal. | Kalimat panjang dan informasi tidak relevan membingungkan (EL01, DS03) → KB-08 |
| 2 | **Palet terbatas.** Emerald dan mint sebagai dasar, hijau hutan untuk teks. Pastel hanya untuk ilustrasi dan penanda kecil. Warna umpan balik hanya untuk benar/salah. | Warna terlalu banyak membuat tidak fokus (EL03) → KB-08 |
| 3 | **Tanpa animasi dekoratif.** Hanya transisi singkat (≤ 200 ms) yang membantu orientasi. | Animasi ramai membuat tidak fokus (EL03, DS03) → KB-08 |
| 4 | **Siswa mengatur kecepatan.** Tidak ada perpindahan otomatis. | Penjelasan terlalu cepat sulit dipahami (EL04) → KB-01 |
| 5 | **Rumus dekat dengan angkanya.** Rumus, arti simbol, dan substitusi berada dalam satu blok. | Sering salah memasukkan angka (IL05) → KB-16 |
| 6 | **Contoh, tabel, gambar** sebagai media utama, teks pendek sebagai pendukung. | Paling mudah paham lewat contoh, tabel, dan gambar (EL02) → KB-07 |
| 7 | **Bantuan tersedia, tapi tidak memaksa.** Petunjuk dibuka atas kemauan siswa. | Ingin bisa mandiri (DS02), tapi butuh petunjuk bertahap (GL03) → KB-09 |
| 8 | **Ilustrasi secukupnya.** Satu ilustrasi kecil di kartu sambutan halaman menu. Tidak ada ilustrasi di layar fokus (materi, soal, kuis). | Gambar membantu (EL02), tetapi informasi yang tidak berhubungan dengan materi mengganggu (DS03) → KB-07, KB-08 |

## 2. Warna

Token warna ditulis sebagai variabel CSS di `src/gaya/utama.css`.

Tema: **Emerald + Mint** (Lanora, sejak 12 November 2026). Sebelumnya Sage Green + Cream: `#4E7D5B` sage, `#2F4F3A` hijau tua, `#FBF8F1` krem.

**Warna dasar**

| Token | Nilai | Kegunaan |
|---|---|---|
| `--warna-utama` | `#17784F` (emerald) | Tombol utama, latar emblem logo, bagian bunga di ilustrasi 3D |
| `--warna-utama-tua` | `#0F3D2E` (hijau hutan) | Judul, teks penting, ikon menu aktif, garis ilustrasi dan logo |
| `--warna-utama-muda` | `#E2F4EA` (mint muda) | Kartu sambutan, kotak rumus, kotak petunjuk |
| `--warna-utama-lembut` | `#9ED9B8` (mint pastel) | **Hanya** dekorasi: isian ilustrasi, simbol di logo, ikon menu aktif, garis tombol sekunder |
| `--warna-latar` | `#F6FBF8` (putih kehijauan) | Latar halaman, `theme-color` |
| `--warna-kartu` | `#FFFFFF` | Kartu, navigasi bawah |
| `--warna-permukaan` | `#EAF5EF` (mint pucat) | Kartu sekunder, kotak pesan galat, bagian modal di ilustrasi 3D |
| `--warna-garis` | `#D5E8DD` | Garis tepi kartu dan kolom isian |
| `--warna-teks` | `#12372A` | Teks utama |
| `--warna-teks-redup` | `#4C6359` | Keterangan, label |
| `--warna-teks-terang` | `#FFFFFF` | Teks di atas tombol utama |

**Aksen pastel** (hanya untuk ilustrasi dan penanda kecil, **tidak** untuk teks atau latar besar)

| Token | Nilai | Contoh pemakaian |
|---|---|---|
| `--aksen-kuning` | `#F6E7B4` | Koin, label "Bagian ini sedang disiapkan" |
| `--aksen-peach` | `#F8D9C9` | Celengan, tombol "=" kalkulator |
| `--aksen-peach-tua` | `#EEBBA4` | Hidung celengan, pipi wajah ilustrasi |
| `--aksen-biru` | `#D3E6EC` | Layar kalkulator, batang grafik |

**Umpan balik**

| Token | Nilai | Kegunaan |
|---|---|---|
| `--warna-benar` | `#1F7A45` | **Hanya** umpan balik benar |
| `--warna-salah` | `#B3412E` | **Hanya** umpan balik salah dan pesan galat |

**Kontras yang sudah diperiksa** (dihitung ulang dengan rumus WCAG, 12 November 2026, palet Emerald + Mint):

| Pasangan | Rasio | Hasil |
|---|---|---|
| Teks utama di atas latar | 12,50 : 1 | Lolos AA |
| Teks utama di atas mint muda / mint pucat | 11,44 : 1 / 11,71 : 1 | Lolos AA |
| Teks redup di atas latar / putih | 6,20 : 1 / 6,49 : 1 | Lolos AA |
| Teks redup di atas mint muda / mint pucat | 5,67 : 1 / 5,81 : 1 | Lolos AA |
| Teks putih di atas emerald `#17784F` (tombol) | 5,47 : 1 | Lolos AA |
| Hijau hutan di atas mint muda (kartu sambutan) | 10,63 : 1 | Lolos AA |
| Hijau umpan balik di atas putih / mint muda | 5,35 : 1 / 4,67 : 1 | Lolos AA |
| Merah umpan balik di atas putih / mint pucat | 5,66 : 1 / 5,07 : 1 | Lolos AA |
| Emerald sebagai garis fokus di atas putih / latar | 5,47 : 1 / 5,23 : 1 | Lolos (≥ 3 : 1 untuk komponen) |

Hijau umpan balik `#1F7A45` dan emerald `#17784F` hampir sama (1,02 : 1). Karena itu umpan balik benar/salah **wajib** memakai ikon dan teks, tidak hanya warna. Mint pastel `--warna-utama-lembut` tidak boleh menjadi latar teks. Emerald yang lebih terang (misalnya `#1F8A5B`, 4,34 : 1 dengan teks putih) **tidak dipakai** untuk tombol.

Aturan:

- Warna tidak pernah menjadi satu-satunya penanda. Umpan balik selalu disertai ikon (✓ atau ✕) dan teks ("Benar", "Belum tepat").
- Hijau umpan balik (`--warna-benar`) lebih tua dari warna tema, dan selalu disertai ikon ✓, agar tidak tertukar dengan warna tema.
- Bayangan memakai hijau tua transparan, bukan hitam: `--bayangan-kartu`, `--bayangan-tombol`, `--bayangan-navigasi`.
- Versi 1 memakai **tema terang saja** (asumsi, untuk menjaga kesederhanaan).

## 3. Tipografi

| Elemen | Ukuran | Tebal |
|---|---|---|
| Judul halaman | 24 px, warna hijau tua | 700 |
| Judul kartu | 18 px, warna hijau tua | 700 |
| Teks isi | 16 px, tinggi baris 1,55 | 400 |
| Rumus | 18 px | 600 |
| Keterangan | 14 px | 400 |
| Label navigasi bawah | 12 px | 600 (aktif 700) |
| Tombol | 16 px | 700 |

- Huruf: *system font* (`system-ui, Roboto, "Segoe UI", sans-serif`). Di Android, ini berarti **Roboto**, yang mudah dibaca dan sudah ada di perangkat. Tidak ada unduhan font tambahan, agar halaman tetap ringan (NF-03) dan tidak ada permintaan ke layanan font pihak ketiga (NF-06).
- Angka di tabel memakai `font-variant-numeric: tabular-nums` agar sejajar.
- Rupiah ditulis `Rp2.000.000` (tanpa spasi, titik pemisah ribuan).
- Panjang baris teks maksimal ±60 karakter. Satu kartu berisi maksimal ±60 kata.

## 4. Tata Letak

- **Mobile-first**: dirancang untuk lebar 360–412 px.
- Di layar lebar, konten berada di tengah dengan lebar maksimal 480 px.
- Jarak memakai kelipatan 8 px (8, 16, 24, 32).
- Area sentuh minimal **48 × 48 px**.
- Tombol aksi utama berada di bagian bawah layar agar mudah dijangkau ibu jari.

### Navigasi

Bilah navigasi bawah dengan **4 menu** (ikon + teks):

| Menu | Rute | Isi |
|---|---|---|
| Beranda | `#/beranda` | Ringkasan kemajuan, tombol lanjut belajar, pintasan Simulasi |
| Belajar | `#/belajar` | Daftar sub-bab P0, M1–M6 dan Simulasi |
| Latihan | `#/latihan` | Latihan per sub-bab dan tombol Kuis |
| Riwayat | `#/riwayat` | Riwayat aktivitas dan kesalahan tersering |

Rute lain: `#/masuk`, `#/daftar` (Daftar pertama kali, KF-05d), `#/pin-baru` (Buat PIN baru, KF-05c); kedua rute baru ditambahkan ke `src/rute.js` saat Fase 5, `#/belajar/:subMateri`, `#/simulasi`, `#/latihan/:subMateri/:tingkat`, `#/kuis`, `#/kuis/hasil/:sesiKuisId`.

Navigasi bawah **disembunyikan** saat siswa mengerjakan soal atau kuis, agar fokus. Tombol **✕ Keluar** di kiri atas meminta konfirmasi sebelum keluar. Di layar kuis, ✕ dan tombol kembali Android memunculkan dialog "keluar sementara" (KF-17, bagian 5.9c).

Tampilan navigasi bawah:

- Latar putih dengan sudut atas membulat (20 px) dan bayangan lembut ke atas. Tinggi 72 px ditambah area aman layar (*gesture bar* Android).
- Ikon garis dua lapis. Pada menu aktif, ikon berada dalam **pil mint** (56 × 32 px), bagian dalam ikon terisi, dan label menjadi tebal berwarna hijau hutan.
- Menu aktif ditandai pil, warna, dan ketebalan label sekaligus, tidak hanya warna.
- Di laptop (≥ 768 px), navigasi menjadi kartu mengambang selebar konten (480 px) di tengah bawah layar.

## 5. Rancangan Layar (wireframe)

### 5.0 Layar akun username dan pilihan kelas (KF-05f, rencana Fase 5A)

> **Status:** rancangan disetujui 12 November 2026. **Frontend sudah diimplementasi** (Fase 5A Tahap 5), tetapi belum di-deploy. Layar 5.1, 5.1a, dan 5.1b di bawah adalah rancangan lama (kode siswa) yang kini **tidak dipakai lagi oleh kode** dan disimpan sebagai riwayat. Tema, komponen, pesan galat (ikon ✕ + teks), dan aturan kolom PIN (selalu tersamar, tanpa tombol tampilkan) **tetap sama**.
>
> **Catatan implementasi Tahap 5:**
> - Kolom yang bermasalah ditandai `aria-invalid` (garis `--warna-salah`) dan menerima fokus, di samping pesan berikon.
> - Jika pilihan kelas ditolak server (kelas baru dinonaktifkan peneliti), daftar kelas dimuat ulang otomatis dari server, dan username tetap terisi.
> - Jika kode kelas ditolak di langkah 2, siswa dikembalikan ke langkah 1.
> - Respons 201 (akun atau PIN tersimpan tetapi masuk otomatis gagal) mengarah ke layar Masuk dengan pesan sekali tampil:
>   - "Akun sudah dibuat. Silakan masuk dengan username dan PIN-mu.";
>   - "PIN baru tersimpan. Silakan masuk dengan PIN barumu."
> - Jika server mengirim daftar kelas kosong: "Belum ada kelas yang bisa dipilih. Beri tahu gurumu."

**Masuk** (menggantikan 5.1): kartu sambutan Lanora tetap seperti sekarang. Kolom **Kode siswa** diganti **Username**:

```
│  Username                  │
│  [ contoh: rani_08     ]   │
│  PIN (6 angka)             │
│  [ ••••••              ]   │
│  [        Masuk        ]   │
│  Belum punya akun? Daftar  │
│  Lupa PIN? Tanyakan ke     │
│  guru atau penelitimu.     │
│  Saya punya kode reset     │
```

- Kolom username: `autocapitalize="none"`, `autocomplete="off"`, `spellcheck="false"`. Huruf besar boleh diketik, karena server mengubahnya ke huruf kecil.
- Gagal: "Username atau PIN salah. Periksa kembali, atau tanyakan ke gurumu." Pesannya seragam (L7).
- Isi kolom PIN dikosongkan setelah gagal, sedangkan username tetap terisi.

**Daftar, langkah 1 dari 2:** kode kelas (satu layar, satu tujuan).

```
┌────────────────────────────┐
│ ✕   Daftar                 │
│ Langkah 1 dari 2           │
│                            │
│ Isi kode kelas dari guru   │
│ atau penelitimu.           │
│  Kode kelas                │
│  [ 6 angka            ]    │
│                            │
│  [        Lanjut       ]   │
│ Sudah pernah daftar?       │
│ Masuk saja, atau minta     │
│ reset PIN ke gurumu.       │
└────────────────────────────┘
```

- `inputmode="numeric"`, `maxlength="6"`. Jika salah: "Kode kelas tidak sesuai. Tanyakan ke guru atau penelitimu."
- Teks "Sudah pernah daftar? …" mengurangi akun ganda (RS-03).

**Daftar, langkah 2 dari 2:** kelas, username, dan PIN. Langkah ini hanya muncul setelah server membenarkan kode kelas. Kode kelas disimpan di memori halaman, tidak di penyimpanan perangkat.

```
┌────────────────────────────┐
│ ←   Daftar                 │
│ Langkah 2 dari 2           │
│  Kelasmu                   │
│  [ Pilih kelas        ▾ ]  │
│     SMP: VII · VIII · IX   │
│     SMA/SMK: X · XI · XII  │
│  Username                  │
│  [                    ]    │
│  3–20 huruf kecil, angka,  │
│  atau _, diawali huruf.    │
│  Username juga tampil      │
│  sebagai namamu. Jangan    │
│  pakai nama lengkap atau   │
│  nomor HP.                 │
│  Buat PIN (6 angka)        │
│  [ ••••••             ]    │
│  Ulangi PIN                │
│  [ ••••••             ]    │
│  [  Daftar dan masuk  ]    │
└────────────────────────────┘
```

- **Pilihan kelas:** elemen `<select>` bawaan (ramah TalkBack dan papan ketik Android), dikelompokkan dengan `<optgroup>` per jenjang **Kelas VII** sampai **Kelas XII**. Isinya hanya kelas aktif dari server, dan jenjang yang tidak punya kelas aktif tidak ditampilkan. Isian awal "Pilih kelas" tidak bisa dikirim ("Pilih kelasmu dari daftar.").
- Tombol **←** kembali ke langkah 1 tanpa mengirim apa pun. Tombol ✕ di langkah 1 kembali ke layar Masuk.
- Sebelum dikirim, frontend memeriksa format username, PIN 6 angka, dan kecocokan kedua PIN, dengan pesan yang sama seperti 5.1b. Ketersediaan username dan PIN ≠ kode kelas hanya diperiksa server.
- "Username sudah dipakai. Coba yang lain." ditampilkan di bawah kolom username. Kelas dan username tetap terisi, sedangkan kedua kolom PIN dikosongkan.
- Batas per IP (U9): "Terlalu banyak percobaan pendaftaran dari jaringan ini. Coba lagi nanti, atau minta bantuan gurumu."
- Berhasil: langsung ke Beranda dengan pesan "Pendaftaran berhasil. Ingat username dan PIN-mu untuk masuk berikutnya."

**Buat PIN baru** (menggantikan 5.1a): kolom **Kode siswa** diganti **Username**. Bagian lainnya tetap. Gagal: "Username atau kode reset tidak sesuai, atau kode reset sudah tidak berlaku. Tanyakan ke guru atau penelitimu."

**Beranda:** kartu sambutan menyapa **"Halo, rani_08"** (username sebagai nama tampilan, U5), diambil dari `ambil_profil()`.

### 5.1 Masuk

```
┌────────────────────────────┐
│                            │
│         Lanora           │
│  Belajar Bunga Tunggal     │
│      dan Tabungan          │
│                            │
│  Kode siswa                │
│  ┌──────────────────────┐  │
│  │ contoh: S001         │  │
│  └──────────────────────┘  │
│                            │
│  PIN (6 angka)             │
│  ┌──────────────────────┐  │
│  │ ••••••               │  │
│  └──────────────────────┘  │
│                            │
│  ┌──────────────────────┐  │
│  │        Masuk         │  │
│  └──────────────────────┘  │
│                            │
│  Pertama kali? Daftar di   │
│  sini                      │
│  Lupa PIN? Tanyakan ke     │
│  guru atau penelitimu.     │
└────────────────────────────┘
```

Diperbarui 12 November 2026 sesuai KF-05 (Kode Siswa + PIN) dan KF-05d (format `S001`, PIN dibuat saat pendaftaran pertama).

- Kolom kode siswa memakai `autocapitalize="characters"` dan `autocomplete="off"`, dengan contoh "contoh: S001". **Tidak ada kolom kode kelas** di layar Masuk (KF-05d D7).
- Tautan **"Pertama kali? Daftar di sini"** membuka layar Daftar pertama kali (5.1b).
- **Kolom PIN (KF-05a)**, sama di layar Masuk, Buat PIN baru, dan Daftar pertama kali:
  - `type="password"` (selalu tersamar), `inputmode="numeric"` (papan ketik angka), `maxlength="6"`, `pattern="[0-9]{6}"`, `autocomplete="off"`.
  - **Tidak ada tombol untuk menampilkan PIN** (P5), agar PIN tidak terlihat teman di sebelah saat di kelas.
  - Label menyebut aturannya: "PIN (6 angka)". Jika kurang atau lebih dari 6 angka, atau ada huruf, muncul petunjuk sebelum dikirim: "PIN harus 6 angka."
  - Angka 0 di depan tetap sah. Contoh: `012345`.
- Pesan jika gagal selalu sama, di bawah kolom PIN, dengan ikon ✕ dan teks (tidak hanya warna): "Kode siswa atau PIN salah. Periksa kembali, atau tanyakan ke gurumu." Aplikasi tidak menyebut bagian mana yang salah (KF-05 L7).
- Isi kolom PIN dikosongkan setelah percobaan gagal. Isi kolom kode tetap.
- **Saat akun terkunci (KF-05b, penguncian bertingkat sejak 12 November 2026):** pesan "Terlalu banyak percobaan. Tunggu beberapa menit, lalu coba lagi." (lama kunci 5, 15, atau 60 menit tidak disebut) ditampilkan dengan ikon dan teks, di tempat yang sama dengan pesan gagal. Tombol **Masuk** tetap aktif, dan siswa tetap bisa mengetik. Tidak ada hitung mundur atau keterangan sisa percobaan, agar tidak membocorkan informasi akun. Nada pesan tenang, tanpa warna merah mencolok di seluruh layar.
- **Tidak ada fitur "Lupa PIN" mandiri** (KF-05c R6). Di bawah tombol Masuk hanya ada teks kecil: "Lupa PIN? Tanyakan ke guru atau penelitimu." Teks ini bukan tautan untuk mereset sendiri.
- Tautan sekunder **"Saya punya kode reset"** membuka layar Buat PIN baru (5.1a). Layar ini hanya berguna bagi siswa yang sudah diberi kode reset oleh guru atau peneliti.
- Jika aplikasi belum terhubung ke Supabase (`.env` kosong), layar Masuk menampilkan: "Aplikasi belum terhubung ke server. Beri tahu gurumu."
- Siswa yang belum masuk dan membuka halaman lain dialihkan ke layar Masuk. Siswa yang sudah masuk dan membuka layar Masuk/Daftar dialihkan ke Beranda.

### 5.1a Buat PIN baru (KF-05c)

```
┌────────────────────────────┐
│ ✕   Buat PIN baru          │
│                            │
│ Isi kode reset dari guru   │
│ atau penelitimu.           │
│                            │
│  Kode siswa                │
│  [ contoh: S001      ]     │
│  Kode reset                │
│  [                   ]     │
│  PIN baru (6 angka)        │
│  [ ••••••              ]   │
│  Ulangi PIN baru           │
│  [ ••••••              ]   │
│                            │
│  [   Simpan dan masuk   ]  │
└────────────────────────────┘
```

- Tanpa navigasi bawah dan tanpa ilustrasi (layar fokus). Tombol ✕ kembali ke layar Masuk.
- Jika kedua PIN baru tidak sama, pesan muncul **sebelum** dikirim: "PIN baru dan ulangannya belum sama."
- Gagal karena kode siswa atau kode reset: pesan seragam dengan ikon dan teks, "Kode siswa atau kode reset tidak sesuai, atau kode reset sudah tidak berlaku. Tanyakan ke guru atau penelitimu." (KF-05 L7).
- Berhasil: siswa langsung masuk ke Beranda dengan riwayat belajar yang sama, ditambah pesan singkat "PIN baru tersimpan. Ingat PIN-mu, ya."
- Aturan PIN (KF-05a) ditampilkan di label: "PIN baru (6 angka)". Petunjuk sebelum dikirim: "PIN harus 6 angka." Jika server menolak karena PIN sama dengan kode kelas: "PIN tidak boleh sama dengan kode kelas. Buat PIN lain." Kedua kolom PIN dikosongkan setelah ditolak.
- Layar ini **tidak** meminta kode kelas. Kode kelas hanya dipakai di pendaftaran pertama (KF-05d).

### 5.1b Daftar pertama kali (KF-05d)

```
┌────────────────────────────┐
│ ✕   Daftar pertama kali    │
│                            │
│ Isi kode dari penelitimu,  │
│ lalu buat PIN sendiri.     │
│                            │
│  Kode kelas                │
│  [ 6 angka          ]      │
│  Kode siswa                │
│  [ contoh: S001     ]      │
│                            │
│  Buat PIN (6 angka)        │
│  [ ••••••              ]   │
│  Ulangi PIN                │
│  [ ••••••              ]   │
│                            │
│  [  Daftar dan masuk  ]    │
└────────────────────────────┘
```

- **Dua kolom terpisah dengan label berbeda** agar kode kelas dan kode siswa tidak tertukar (D6). Kode kelas memakai `inputmode="numeric"` dengan keterangan "6 angka", sedangkan kode siswa memakai keterangan "contoh: S001".
- Jika isian jelas tertukar (misalnya huruf S di kolom kode kelas), muncul petunjuk ramah **sebelum** dikirim: "Kode kelas berupa 6 angka. Kode siswa diawali huruf S." Petunjuk ini hanya membahas format, tanpa memeriksa apakah kodenya terdaftar.
- Jika PIN dan ulangannya tidak sama, muncul pesan sebelum dikirim: "PIN dan ulangannya belum sama." Jika PIN bukan 6 angka: "PIN harus 6 angka."
- Jika server menolak karena PIN sama dengan kode kelas: "PIN tidak boleh sama dengan kode kelas. Buat PIN lain." Pemeriksaan ini hanya di server, karena kode kelas tidak boleh ada di aplikasi. Kedua kolom PIN dikosongkan, sedangkan kode kelas dan kode siswa tetap terisi.
- Kolom PIN mengikuti aturan yang sama dengan layar Masuk: selalu tersamar, tanpa tombol tampilkan.
- Gagal dari server: pesan seragam dengan ikon dan teks, "Pendaftaran tidak bisa diproses. Periksa kode kelas dan kode siswa. Jika kamu sudah pernah mendaftar, masuk dengan kode siswa dan PIN-mu, atau tanyakan ke penelitimu." (KF-05 L7).
- Berhasil: langsung masuk ke Beranda dengan pesan "Pendaftaran berhasil. Ingat kode siswa dan PIN-mu untuk masuk berikutnya."
- Layar fokus: tanpa navigasi bawah dan tanpa ilustrasi. Rute rencana: `#/daftar`.

### 5.2 Beranda

```
┌────────────────────────────┐
│ Halo, Rani                 │
│                            │
│ ┌────────────────────────┐ │
│ │ Kemajuan belajar       │ │
│ │ ███████░░░░  3 dari 7  │ │
│ │ Lanjut: M4 Tabungan    │ │
│ │ akhir                  │ │
│ │ [ Lanjut belajar ]     │ │
│ └────────────────────────┘ │
│                            │
│ Nilai kuis tertinggi: 85   │
│ Kesempatan kuis: 0 dari 2  │
│                            │
│ [ Coba Simulasi ]          │
│                            │
├────────────────────────────┤
│ Beranda Belajar Latihan    │
│                   Riwayat  │
└────────────────────────────┘
```

Hanya 3 blok informasi. Sapaan berada di kartu sambutan bersama satu ilustrasi kecil (celengan, bagian 7.1). Tanpa banner atau gambar dekoratif lain.

- Tombol **Keluar** (sekunder, lebar penuh) berada di bagian paling bawah Beranda (Fase 5). Setelah keluar, siswa kembali ke layar Masuk.
- Pesan sekali tampil setelah daftar atau buat PIN baru (5.1a, 5.1b) muncul di bawah kartu sambutan sebagai kartu hijau muda dengan `role="status"`, tanpa animasi.

### 5.3 Kartu langkah materi

```
┌────────────────────────────┐
│ ✕   M3 Waktu dalam bulan   │
│     Kartu 2 dari 6         │
│ ━━━━━━━━━░░░░░░░░░░░░░░░░  │
│                            │
│ Suku bunga ditulis per     │
│ TAHUN. Jika lama menabung  │
│ dalam bulan, ubah dulu     │
│ ke tahun.                  │
│                            │
│ ┌────────────────────────┐ │
│ │ 1 tahun = 12 bulan     │ │
│ │ 6 bulan = 6/12 tahun   │ │
│ │ 8 bulan = 8/12 tahun   │ │
│ └────────────────────────┘ │
│                            │
│ [ Kembali ]   [ Lanjut ]   │
└────────────────────────────┘
```

### 5.4 Contoh soal langkah demi langkah

```
┌────────────────────────────┐
│ ✕   Contoh 1               │
│                            │
│ Rani menabung Rp2.000.000  │
│ dengan bunga 6% per tahun. │
│ Berapa bunganya setelah    │
│ 8 bulan?                   │
│                            │
│ 1  Pahami                  │
│    M = Rp2.000.000         │
│    p = 6% per tahun        │
│    lama = 8 bulan          │
│    Ditanya: bunga (B)      │
│                            │
│ 2  Rencanakan              │
│ ┌────────────────────────┐ │
│ │ B = M × (p/100) × t    │ │
│ │ t = 8/12 tahun         │ │
│ └────────────────────────┘ │
│                            │
│ [ Tampilkan langkah 3 ]    │
└────────────────────────────┘
```

Langkah muncul satu per satu sesuai ketukan siswa. Empat langkah tetap: **Pahami → Rencanakan → Hitung → Periksa**.

### 5.5 Soal latihan dan panel Pahami Soal

```
┌────────────────────────────┐
│ ✕   Latihan M3 · Soal 2/5  │
│                            │
│ Dimas menabung Rp1.500.000 │
│ di bank dengan bunga 8%    │
│ per tahun. Berapa tabungan │
│ Dimas setelah 9 bulan?     │
│                            │
│ [ Pahami Soal ]            │
│                            │
│ Jawabanmu (Rp)             │
│ ┌──────────────────────┐   │
│ │                      │   │
│ └──────────────────────┘   │
│                            │
│ [ Minta petunjuk ]         │
│ [      Periksa       ]     │
└────────────────────────────┘

Panel Pahami Soal (lembar dari bawah):
┌────────────────────────────┐
│ Pahami Soal                │
│ Diketahui                  │
│  Modal       [ 1.500.000 ] │
│  Suku bunga  [ 8   ] %/thn │
│  Lama        [ 9 ] [bulan▾]│
│ Ditanya      [ pilih ▾    ]│
│                            │
│ [ Cek pemahamanku ]        │
└────────────────────────────┘
```

Kolom jawaban memakai `inputmode="decimal"` agar papan ketik angka muncul di Android.

### 5.6 Petunjuk bertahap

Diperbarui 12 November 2026 sesuai KF-15 (maksimal 3 tingkat, hanya di latihan).

```
┌────────────────────────────┐
│ Petunjuk 1 dari 3          │
│ ┌────────────────────────┐ │
│ │ Diketahui: modal       │ │
│ │ Rp1.500.000, bunga 8%  │ │
│ │ per tahun, lama 9      │ │
│ │ bulan.                 │ │
│ │ Ditanya: tabungan      │ │
│ │ akhir.                 │ │
│ └────────────────────────┘ │
│ [ Petunjuk berikutnya ]    │
│ [ Tutup ]                  │
└────────────────────────────┘
```

- Petunjuk muncul di kotak berlatar `--warna-utama-muda`. Bagian penting di teks soal diberi garis bawah tebal (bukan warna mencolok).
- Judul kotak menunjukkan tingkat: "Petunjuk 1 dari 3". Tingkat 1 = diketahui dan ditanya, tingkat 2 = rumus/konsep, tingkat 3 = langkah awal perhitungan.
- Petunjuk yang sudah dibuka tetap terlihat (menumpuk ke bawah). Tombol "Petunjuk berikutnya" hanya membuka satu tingkat di atasnya, dan hilang setelah tingkat 3.
- Tombol **Minta petunjuk** hanya ada di layar latihan. Layar kuis tidak punya tombol petunjuk.

### 5.7 Umpan balik jawaban salah

```
┌────────────────────────────┐
│ ✕ Belum tepat              │
│                            │
│ Lama menabung dalam bulan. │
│ Ubah dulu ke tahun:        │
│ 9 bulan = 9/12 tahun.      │
│                            │
│ Pembahasan                 │
│ 1 Pahami ...               │
│ 2 Rencanakan ...           │
│ 3 Hitung ...               │
│ 4 Periksa ...              │
│                            │
│ [ Coba lagi ]              │
│ [ Soal berikutnya ]        │
└────────────────────────────┘
```

Nada pesan: menjelaskan, tidak menyalahkan. Hindari kata "Salah!" atau tanda seru berlebihan.

Sesuai KF-15 (H9), **pembahasan lengkap 4 langkah langsung tampil** setelah jawaban latihan diperiksa, baik benar maupun salah. Jika benar, bagian atas berisi "✓ Benar" dan pujian singkat, lalu pembahasan. Jika salah, pesan jenis kesalahan tampil di atas pembahasan. Langkah pembahasan boleh dibuka satu per satu dengan ketukan (seperti contoh 5.4) agar tidak terasa panjang. Tombol "Lihat pembahasan setelah 2 kali salah" dari rancangan lama tidak dipakai lagi.

### 5.8 Simulasi

```
┌────────────────────────────┐
│ Simulasi Tabungan          │
│                            │
│ Modal (Rp)  [ 1.000.000 ]  │
│ Suku bunga  [ 6 ] % / thn  │
│ Lama        [ 12 ][bulan▾] │
│                            │
│ ┌────────────────────────┐ │
│ │ B = M × (p/100) × t    │ │
│ │ B = 1.000.000 × (6/100)│ │
│ │     × (12/12)          │ │
│ │ B = Rp60.000           │ │
│ │ A = M + B              │ │
│ │ Jumlah tabungan akhir  │ │
│ │ A = Rp1.060.000        │ │
│ └────────────────────────┘ │
│                            │
│ Bulan │ Bunga  │ Tabungan  │
│   1   │  5.000 │ 1.005.000 │
│   2   │ 10.000 │ 1.010.000 │
│  ...  │   ...  │    ...    │
│                            │
│ [ Tampilkan ilustrasi 3D ] │
└────────────────────────────┘
```

Hasil diperbarui setelah siswa selesai mengetik (jeda ±300 ms), tanpa animasi angka berjalan.

### 5.9 Hasil kuis

Diperbarui 11 November 2026 sesuai [PRD.md](PRD.md) F-07 (20 soal, 30 menit).

```
┌────────────────────────────┐
│ Kuis selesai               │
│ Dikumpulkan: waktu habis   │
│                            │
│ ┌────────────────────────┐ │
│ │      Nilai akhir       │ │
│ │          70            │ │
│ │ ✓ Benar 14  ✕ Salah 6  │ │
│ │ (2 tidak dijawab)      │ │
│ └────────────────────────┘ │
│                            │
│ Soal yang salah:           │
│ [2] [5] [9] [11] [16] [20] │
│                            │
│ Rincian soal               │
│ ┌────────────────────────┐ │
│ │ Soal 2 · Pilihan ganda │ │
│ │ ✕ Salah              ▾ │ │
│ │  A  Rp80.000   ✓ Benar │ │
│ │  B  Rp960.000  ← Kamu  │ │
│ │  C  Rp2.080.000        │ │
│ │  D  Rp8.000.000        │ │
│ │ Satuan waktu: 8 bulan  │ │
│ │ = 8/12 tahun.          │ │
│ │ 1 Pahami ...           │ │
│ │ 2 Rencanakan ...       │ │
│ │ 3 Hitung ...           │ │
│ │ 4 Periksa ...          │ │
│ └────────────────────────┘ │
│ ┌────────────────────────┐ │
│ │ Soal 9 · Isian angka   │ │
│ │ ✕ Salah              ▾ │ │
│ │ Jawabanmu: Rp2.580.000 │ │
│ │ Jawaban benar:         │ │
│ │ Rp1.590.000            │ │
│ │ Satuan waktu: ...      │ │
│ │ 1 Pahami ... 4 Periksa │ │
│ └────────────────────────┘ │
│ │ Soal 3 · PG  ✓ Benar ▸ │ │
│ │ Soal 5 · Isian         │ │
│ │ ✕ Tidak dijawab      ▸ │ │
│ ...                        │
│                            │
│ [ Kembali ke Latihan ]     │
└────────────────────────────┘
```

- **Ringkasan di atas**: nilai akhir, jumlah benar dan salah, serta jumlah tidak dijawab sebagai bagian dari salah. Keterangan cara pengumpulan ditulis netral ("Dikumpulkan: waktu habis" atau "Dikumpulkan olehmu").
- **Nomor soal yang salah** tampil sebagai tombol nomor (area sentuh ≥ 48 px). Mengetuk nomor menggulir ke rincian soal itu.
- **Rincian 20 soal** berupa daftar yang bisa dibuka satu per satu. Soal yang salah terbuka lebih dulu. Label kecil di judul menunjukkan bentuk soal: "Pilihan ganda" atau "Isian angka".
- **Pilihan ganda**: semua opsi ditampilkan. Opsi yang benar diberi "✓ Benar", opsi yang dipilih siswa diberi "← Kamu". Jika siswa memilih opsi yang benar, kedua penanda ada di opsi yang sama. Penanda selalu berupa teks dan ikon, bukan hanya warna. Setiap soal pilihan ganda punya 4 opsi (A–D, KF-18), ditampilkan dengan huruf dan urutan yang **sama persis** dengan saat siswa mengerjakan.
- **Isian angka**: "Jawabanmu" berisi angka yang diketik siswa dalam format Rupiah/angka Indonesia, lalu "Jawaban benar".
- Setiap soal (benar, salah, atau tidak dijawab) punya pembahasan 4 langkah. Soal yang salah juga menampilkan pesan jenis kesalahan.
- Status selalu memakai ikon dan teks (✓ Benar / ✕ Salah), tidak hanya warna. Hijau dan merah umpan balik hanya dipakai di sini, tidak untuk dekorasi.
- Satu ilustrasi kecil `simbol` di kepala halaman (bagian 7.1). Tanpa konfeti atau animasi perayaan.

Tampilan **selama kuis** dirancang di 5.9a–5.9d (semua keputusan KF-10 sampai KF-22 sudah ditetapkan).

### 5.9a Dialog konfirmasi Selesai Kuis (KF-16, A1)

```
┌────────────────────────────┐
│ Kumpulkan kuis?            │
│                            │
│ Masih ada 3 soal belum     │
│ dijawab: no. 5, 12, 18.    │
│                            │
│ 2 jawaban belum terkirim   │
│ dan belum tersimpan di     │
│ server.                    │
│                            │
│ Soal yang tidak dijawab    │
│ dihitung salah.            │
│                            │
│ [ Kembali ke soal ]        │
│ [ Ya, kumpulkan ]          │
└────────────────────────────┘
```

- Muncul **setiap kali** tombol Selesai Kuis ditekan. Jika semua soal sudah dijawab, isinya "Semua soal sudah dijawab. Kumpulkan sekarang?"
- Baris "belum terkirim" hanya muncul jika ada antrean jawaban offline (KF-20).
- **Kembali ke soal** adalah tombol utama (`.tombol`), ditaruh di atas agar tidak mudah salah ketuk. **Ya, kumpulkan** adalah tombol sekunder (`.tombol-sekunder`).
- Dialog berupa lembar dari bawah atau kartu di tengah, dengan latar soal diredupkan. Tanpa animasi selain transisi ≤ 200 ms.
- Timer di kepala layar tetap terlihat dan tetap berjalan. Jika waktu habis saat dialog terbuka, dialog tertutup dan siswa diarahkan ke pemberitahuan kuis dikumpulkan otomatis.

### 5.9b Pengingat sisa waktu (KF-16, B1)

```
┌────────────────────────────┐
│ ✕   Kuis · Soal 14 dari 20 │
│     Sisa waktu 04:58       │
│ ┌────────────────────────┐ │
│ │ Sisa waktu 5 menit.    │ │
│ └────────────────────────┘ │
│                            │
│ (soal tetap terlihat)      │
```

- Hanya **satu kali**, saat sisa waktu mencapai 5 menit.
- Berupa kotak teks kecil berlatar `--warna-utama-muda` di bawah kepala layar. Tidak menutupi soal, tanpa suara, kedip, getar, atau warna merah. Diumumkan ke pembaca layar dengan `aria-live="polite"`.
- Bisa ditutup dengan ketukan, dan hilang sendiri setelah ±8 detik.

### 5.9c Dialog keluar sementara (KF-17, C1)

```
┌────────────────────────────┐
│ Keluar dari kuis?          │
│                            │
│ Waktu tetap berjalan.      │
│ Sisa waktu: 18:42          │
│                            │
│ Kamu bisa melanjutkan      │
│ kuis selama waktu belum    │
│ habis. Kuis tidak          │
│ dikumpulkan.               │
│                            │
│ [ Tetap di kuis ]          │
│ [ Keluar sementara ]       │
└────────────────────────────┘
```

- Muncul saat ✕ ditekan **atau** saat tombol/gestur kembali Android dipakai di layar kuis.
- **Tetap di kuis** adalah tombol utama (`.tombol`), di atas. **Keluar sementara** adalah tombol sekunder.
- Kalimat "Waktu tetap berjalan" ditulis tebal agar siswa tidak mengira waktunya berhenti. Sisa waktu di dialog ikut berkurang.
- Setelah keluar, menu **Latihan** dan **Beranda** menampilkan kartu "Kuis sedang berjalan · sisa 18:10" dengan tombol **Lanjutkan kuis**. Kartu ini hilang setelah kuis dikumpulkan atau waktunya habis. Jika waktu habis, kartu diganti pemberitahuan "Kuis sudah dikumpulkan otomatis" dengan tautan ke hasil.

### 5.9d Layar kuis (KF-22 N1 + R1, bersama KF-15–KF-20)

**Soal pilihan ganda**

```
┌────────────────────────────┐
│ ✕  Soal 2 dari 20          │
│    Sisa waktu 24:13        │
│    ⚠ Offline · 1 belum     │  ← hanya saat offline
│      terkirim              │
├────────────────────────────┤
│ Rani menabung Rp2.000.000  │
│ dengan bunga 6% per tahun. │
│ Berapa bunganya setelah    │
│ 8 bulan?                   │
│                            │
│ ┌────────────────────────┐ │
│ │ A  Rp2.080.000         │ │
│ └────────────────────────┘ │
│ ┌────────────────────────┐ │
│ │ B  Rp80.000          ● │ │  ← dipilih
│ └────────────────────────┘ │
│ ┌────────────────────────┐ │
│ │ C  Rp8.000.000         │ │
│ └────────────────────────┘ │
│ ┌────────────────────────┐ │
│ │ D  Rp960.000           │ │
│ └────────────────────────┘ │
│ ✓ Tersimpan                │
├────────────────────────────┤
│ [ ‹ Sebelumnya ] [ Berikutnya › ] │
│ [ Daftar soal ]  [ Selesai Kuis ] │
└────────────────────────────┘
```

**Soal isian angka**

```
│ Jawabanmu (Rp)             │
│ ┌──────────────────────┐   │
│ │ 1.590.000            │   │
│ └──────────────────────┘   │
│ ⏳ Belum terkirim           │  ← saat offline
```

**Panel daftar soal** (lembar dari bawah, dibuka dengan "Daftar soal")

```
┌────────────────────────────┐
│ Daftar soal                │
│ ✓ Tersimpan  ⏳ Belum      │
│ terkirim  ○ Belum dijawab  │
│                            │
│ [1✓] [2✓] [3✓] [4○] [5○]   │
│ [6✓] [7⏳] [8○] [9○] [10○] │
│ [11○] ...          [20○]   │
│                            │
│ Tersimpan 6 · Belum        │
│ terkirim 1 · Belum         │
│ dijawab 13                 │
└────────────────────────────┘
```

Aturan tampilan:

- **Kepala layar**: nomor soal ("Soal 2 dari 20"), sisa waktu (teks biasa, tanpa kedip atau warna merah), tombol ✕ (dialog keluar sementara 5.9c). Baris "Offline · n belum terkirim" hanya muncul saat tidak tersambung (KF-20 J7).
- **Opsi pilihan ganda**: 4 baris A–D dalam urutan acak sesi ini (KF-18), masing-masing kartu yang bisa diketuk (≥ 48 px). Opsi terpilih diberi garis tepi tebal `--warna-utama`, latar `--warna-utama-muda`, dan tanda ● (tidak hanya warna). Mengetuk opsi lain langsung mengganti pilihan (KF-22).
- **Isian angka**: kolom `inputmode="decimal"`, dibaca `uraiAngka`. Jawaban dikirim saat siswa pindah nomor atau menutup papan ketik.
- **Status jawaban di bawah soal**: "✓ Tersimpan", "⏳ Belum terkirim", atau tanpa teks jika belum dijawab. **Tidak pernah** menampilkan benar/salah.
- **Navigasi**: tombol **Sebelumnya** / **Berikutnya** (Sebelumnya nonaktif di nomor 1, Berikutnya nonaktif di nomor 20), **Daftar soal** untuk membuka panel nomor, dan **Selesai Kuis** (dialog 5.9a). Gestur geser kiri/kanan **tidak** dipakai, agar tidak berpindah soal tanpa sengaja.
- **Panel daftar soal**: 20 tombol nomor (≥ 48 px, 5 per baris di layar 360 px). Status ditunjukkan ikon + teks keterangan (✓ / ⏳ / ○), bukan hanya warna. Mengetuk nomor menutup panel dan membuka soal itu. Nomor di dialog Selesai Kuis (5.9a) juga bisa diketuk dengan cara yang sama.
- **Tanpa** tanda ragu-ragu (R1), **tanpa** tombol petunjuk (KF-15), dan **tanpa** ilustrasi (layar fokus, bagian 7.1).
- Pengingat 5 menit (5.9b) muncul di bawah kepala layar tanpa menutupi soal.

### 5.10 Riwayat

```
┌────────────────────────────┐
│ Riwayat Belajar            │
│                            │
│ Nilai kuis tertinggi: 85   │
│ Percobaan 1  70   20 Nov › │
│ Percobaan 2  85   22 Nov › │
│ (maksimal 2 percobaan)     │
│                            │
│ Sering keliru di:          │
│ • Satuan waktu (4×)        │
│   [ Ulangi M3 ]            │
│ • Mencari modal/waktu (2×) │
│   [ Ulangi M5 ]            │
│                            │
│ Aktivitas terbaru          │
│ 22 Nov  Kuis (2)   85      │
│ 20 Nov  Kuis (1)   70      │
│ 19 Nov  Latihan M3  4/5    │
└────────────────────────────┘
```

Nilai utama kuis adalah **nilai tertinggi** (PRD F-07, KF-13). Kedua percobaan tampil dengan nilai dan tanggalnya, dan masing-masing bisa diketuk untuk membuka hasilnya. Karena kuis maksimal 2 kali, daftar dua baris lebih jelas daripada grafik. Jika grafik tetap dipakai, gunakan satu warna (`--warna-utama`) tanpa animasi.

### 5.11 Pretest dan posttest (KF-05e, PP-01 sampai PP-10, PRD F-12)

**Layar soal** (satu soal per layar, kolom jawaban per tahapan rubrik)

```
┌────────────────────────────┐
│ ✕  Pretest · Soal 1 dari 4 │
│    Penalaran               │
├────────────────────────────┤
│ (teks soal persis dari     │
│  instrumen, termasuk       │
│  gambar/tabel)             │
│                            │
│ Tahap 1: (label rubrik)    │
│ ┌────────────────────────┐ │
│ │                        │ │
│ └────────────────────────┘ │
│ Tahap 2: (label rubrik)    │
│ ┌────────────────────────┐ │
│ │                        │ │
│ └────────────────────────┘ │
│ ...                        │
│ ✓ Jawaban tersimpan        │
├────────────────────────────┤
│ [ ‹ Sebelumnya ] [ Berikutnya › ] │
│        [ Selesai tes ]     │
└────────────────────────────┘
```

- **Layar fokus**: tanpa navigasi bawah, tanpa ilustrasi, tanpa tombol petunjuk, dan **tanpa hitung mundur waktu** (PP-04).
- Judul selalu menyebut jenis tes, **"Pretest"** atau **"Posttest"**, beserta indikator soal (T9).
- Empat soal **persis** sesuai instrumen, dalam urutan tetap 1–4 (PP-02).
- **Satu kolom per tahapan rubrik** (PP-08), dengan label diambil dari rubrik. Bentuk kolom mengikuti jenis tahapan (PT-02):
  - Tahapan angka memakai `inputmode="decimal"` dan menerima `400000`, `400.000`, `Rp400.000`, `6%`, atau `8 bulan` (PP-09).
  - Tahapan pilihan memakai pilihan yang bisa diketuk.
  - Tahapan uraian memakai area teks.
- Penanda **"✓ Jawaban tersimpan"** muncul setelah jawaban tahapan diterima server (PP-03). Tampilan saat offline menunggu PT-10.
- Tidak ada umpan balik benar/salah selama tes.
- Tombol ✕ keluar tanpa menghapus jawaban. Tes bisa dilanjutkan nanti (PP-03).

**Layar hasil** (setelah Selesai tes, PP-06)

```
┌────────────────────────────┐
│ Pretest selesai            │
│                            │
│ Skor total: 17 dari 24     │
│                            │
│ Soal 1 · Penalaran    4/6  │
│ Soal 2 · Merumuskan   5/6  │
│ Soal 3 · Menerapkan   6/6  │
│ Soal 4 · Menafsirkan  2/6  │
│                            │
│ Kunci jawaban dan          │
│ pembahasan tersedia        │
│ setelah posttest selesai.  │
│                            │
│ [ Ke Beranda ]             │
└────────────────────────────┘
```

- Skor ditampilkan per soal dan total (PP-06).
- Selama posttest belum selesai, kunci dan pembahasan tidak ditampilkan. Yang muncul hanya kalimat "Kunci jawaban dan pembahasan tersedia setelah posttest selesai."
- Setelah posttest selesai, ada tombol **Lihat pembahasan** untuk keempat soal.
- **Jawaban kosong (PT-03 G7–G9):** tahapan yang dikosongkan siswa langsung dihitung 0, termasuk tahapan uraian, dan tidak masuk antrean penilaian manual. Jika tidak ada tahapan lain yang perlu dinilai manual, tes langsung berstatus "dinilai".
- **Saat penilaian manual belum selesai (PT-08 M3):** layar hasil **hanya** menampilkan status "Sedang dinilai", **tanpa angka skor apa pun**, termasuk skor soal yang sudah dinilai otomatis:

  ```
  ┌────────────────────────────┐
  │ Pretest selesai            │
  │                            │
  │ ⏳ Sedang dinilai           │
  │ Jawabanmu sedang dinilai   │
  │ oleh guru atau peneliti.   │
  │ Skormu akan tampil di sini │
  │ setelah selesai dinilai.   │
  │                            │
  │ [ Ke Beranda ]             │
  └────────────────────────────┘
  ```

  Status ditandai ikon dan teks, tanpa warna mencolok dan tanpa animasi berputar terus-menerus.
- **Setelah semua tahapan dinilai** (status `dinilai`), skor akhir gabungan otomatis + manual tampil seperti contoh layar hasil di atas. Jika kemudian ada koreksi skor (M4), siswa melihat skor terbaru tanpa pemberitahuan khusus. *(Perlu tidaknya pemberitahuan koreksi tidak diatur PT-08.)*

### 5.12 Halaman penilaian (PT-08, hanya peneliti/guru)

Halaman ini bagian dari Lanora (M1), tetapi **tidak** muncul di navigasi bawah siswa dan hanya bisa dipakai akun penilai (M2). Rute rencana: `#/penilai/masuk` (masuk), `#/penilai` (antrean), `#/penilai/tahap/:hasilTesId/:soal/:tahap` (menilai), dan `#/penilai/koreksi` (khusus peneliti: cari skor untuk dikoreksi).

**Masuk sebagai penilai (PT-14)**

```
┌────────────────────────────┐
│ Lanora · Penilai         │
├────────────────────────────┤
│ Email                      │
│ [                        ] │
│ Kata sandi                 │
│ [                        ] │
│                            │
│ [        Masuk         ]   │
│ Lupa kata sandi?           │
│ Hubungi peneliti.          │
└────────────────────────────┘
```

- Layar ini terpisah dari layar masuk siswa (kode + PIN). **Tidak ada tautan "Daftar"**, karena akun penilai dibuat peneliti (PT-14 A2–A3).
- Tombol **Masuk** mengirim email dan kata sandi ke Edge Function `masuk-penilai` (PT-21). Kolom kata sandi dikosongkan setelah dikirim dan tidak disimpan di perangkat.
- Login gagal: "Email atau kata sandi salah." Setelah 5 kali gagal berurutan: "Terlalu banyak percobaan. Coba lagi 5 menit lagi." (PT-20 S2). Tombol **Masuk** tetap bisa ditekan, dan server yang menolak.
- **Tidak ada tautan "Lupa kata sandi".** Di bawah tombol ada teks kecil: "Lupa kata sandi? Hubungi peneliti." (PT-19).
- Saat login, akun nonaktif mendapat pesan seragam "Email atau kata sandi salah." (PT-22 D2). Guru yang **masih punya sesi terbuka** saat akunnya dinonaktifkan akan dikeluarkan pada permintaan berikutnya, dengan pesan "Akun ini tidak aktif lagi." lalu kembali ke layar masuk (PT-22 D3).
- Kolom **Email** diisi email asli penilai (PT-14 A1). Email internal akun (PT-23) tidak pernah ditampilkan.
- Tidak ada pilihan "Masuk dengan tautan email" atau "Kirim kode" (PT-23 E3).
- Tidak ada layar pengelolaan akun (buat, reset, nonaktifkan, aktifkan kembali) di aplikasi. Semua itu dikerjakan peneliti dengan skrip pengelola di komputernya (PT-21 L4, PT-24 J4). Guru yang diaktifkan kembali cukup masuk lagi dari layar ini.
- Akun siswa yang mencoba masuk di sini ditolak oleh server (`BUKAN_PENILAI`).

**Antrean penilaian**

```
┌────────────────────────────┐
│ Penilaian manual           │
│ Menunggu dinilai: 12       │
├────────────────────────────┤
│ Pretest · Soal 1           │
│ Tahap 3 · (label rubrik)   │
│                       [ › ]│
├────────────────────────────┤
│ Posttest · Soal 4          │
│ Tahap 2 · (label rubrik)   │
│                       [ › ]│
└────────────────────────────┘
```

- **Tanpa nama, kode, atau kelas siswa** (PT-15 N1). Yang ditampilkan hanya jenis tes (Pretest/Posttest, N2), nomor soal, dan tahapan.
- Guru hanya melihat antrean ini dan layar menilai. Menu koreksi dan data penelitian **tidak** ditampilkan untuk guru, dan server tetap menolak aksesnya (PT-17).

**Menilai satu tahapan**

```
┌────────────────────────────┐
│ ✕  Posttest · Soal 1 · T3  │
├────────────────────────────┤
│ Soal: (teks instrumen)     │
│ Rubrik tahap ini (maks 2): │
│ (deskripsi rubrik asli)    │
│                            │
│ Jawaban siswa:             │
│ ┌────────────────────────┐ │
│ │ (jawaban_mentah)       │ │
│ └────────────────────────┘ │
│ Catatan sistem: format     │
│ ambigu: 1.500              │
│                            │
│ Skor: [0] [1] [2]          │
│ Catatan (opsional): [   ]  │
│                            │
│ [   Simpan nilai   ]       │
└────────────────────────────┘
```

- Skor dipilih dengan tombol angka dari 0 sampai skor maksimal tahapan, sehingga tidak bisa keluar rentang.
- Jika tahapan sudah dinilai orang lain, muncul pesan "Jawaban ini sudah dinilai" dan antrean dimuat ulang (M5).

**Koreksi skor (M4, PT-16; khusus peneliti, PT-18)**

```
┌────────────────────────────┐
│ Koreksi skor               │
│ Skor saat ini: 2 (otomatis)│
│ Skor baru: [0] [1] [2]     │
│ Alasan koreksi (wajib):    │
│ ┌────────────────────────┐ │
│ │                        │ │
│ └────────────────────────┘ │
│ Penilai: (nama_tampilan)   │
│ [ Batal ] [ Simpan koreksi ]│
└────────────────────────────┘
```

- Berlaku untuk skor **otomatis** maupun skor yang sudah **dinilai manual** (PT-16). Label di baris "Skor saat ini" menyebut asalnya: "(otomatis)" atau "(dinilai manual)".
- **Simpan koreksi** tidak aktif sampai alasan diisi dan skor baru berbeda dari skor lama.
- Nama penilai dan waktu dicatat otomatis oleh server, sehingga tidak bisa diketik manual.
- Riwayat koreksi tahapan itu (skor lama → baru, alasan, penilai, waktu) ditampilkan di bawah formulir. Tidak ada tombol ubah atau hapus (PT-16 K3).
- Layar koreksi juga tanpa identitas siswa, hanya jenis tes, soal, dan tahapan (PT-15).

Halaman penilai memakai tema yang sama (design.md bagian 2). Layar ini dipakai orang dewasa di laptop atau HP, jadi tetap responsif.
- Tanpa konfeti atau animasi perayaan. Tampilannya dibedakan dari hasil kuis: tanpa "Kesempatan kuis" dan tanpa nilai tertinggi.

## 6. Komponen

| Komponen | Dipakai di | Catatan |
|---|---|---|
| Tombol utama (`.tombol`) | Semua layar | Latar emerald `--warna-utama`, teks putih tebal, tinggi minimal 48 px, sudut 14 px, bayangan bawah tipis. Saat disentuh turun 1 px. |
| Tombol sekunder (`.tombol-sekunder`) | Semua layar | Latar putih, garis 2 px mint pastel, teks hijau hutan |
| Tombol ikon (`.tombol-ikon`) | Tombol tutup ✕ | Tanpa latar, 48 × 48 px |
| Kartu sambutan (`.kartu-sambutan`) | Kepala halaman menu | Latar mint muda, sudut 20 px, judul + subjudul di kiri, ilustrasi 96 px di kanan (di layar Masuk: emblem Lanora) |
| Kartu (`.kartu`) | Semua layar | Latar putih di atas latar putih kehijauan, sudut 20 px, garis tipis, `--bayangan-kartu` |
| Kartu sekunder (`.kartu-sekunder`) | Informasi tambahan | Latar mint pucat, tanpa bayangan |
| Label kecil (`.label-segera`) | Penanda status | Pil kuning pastel, teks hijau tua 14 px |
| Kotak rumus | Materi, contoh, simulasi | Latar `--warna-utama-muda`, teks hijau tua, huruf 18 px |
| Tabel | Materi, simulasi | Baris berselang `--warna-permukaan`, angka rata kanan |
| Bilah kemajuan | Kartu langkah, beranda | Satu warna, tanpa animasi |
| Kolom angka | Soal, simulasi | Label di atas, satuan di samping, contoh format di bawah |
| Panel Pahami Soal | Soal | Lembar dari bawah |
| Kotak petunjuk | Soal latihan saja | Menampilkan "Petunjuk n dari 3" (KF-15) |
| Kotak umpan balik | Soal | Ikon + teks + warna status |
| Navigasi bawah | Beranda, Belajar, Latihan, Riwayat | Ikon garis dua lapis + teks, pil mint pada menu aktif (bagian 4) |

## 7. Gambar dan Ilustrasi 2D

### 7.1 Ilustrasi dekoratif (kartu sambutan)

Ilustrasi matematika lucu bergaya garis tebal membulat, dengan wajah sederhana (mata titik, senyum, pipi). Semuanya SVG inline di `src/komponen/ilustrasi.js`, tanpa file gambar tambahan.

| Nama | Gambar | Dipakai di |
|---|---|---|
| `celengan` | Celengan dengan koin "Rp" | Beranda (layar Masuk memakai emblem Lanora, bagian 7.3) |
| `buku` | Buku terbuka dengan simbol + × % = | Belajar |
| `koin` | Tumpukan koin dan batang naik | Simulasi |
| `kalkulator` | Kalkulator berwajah | Latihan |
| `grafik` | Papan grafik naik | Riwayat |
| `simbol` | Simbol + % × ÷ dalam lingkaran pastel | Hasil Kuis |
| `angka` | Angka "1 ? 3" | Halaman tidak ditemukan |

Aturan:

- **Satu ilustrasi per halaman**, ukuran 96 px di kartu sambutan (72 px di layar < 360 px).
- **Tidak ada ilustrasi di layar fokus**: kartu materi, soal latihan, dan kuis. Komponen `buatHalamanSementara` otomatis mengabaikan ilustrasi saat `modeFokus` aktif.
- Ilustrasi **diam** (tidak beranimasi) dan bersifat dekoratif (`aria-hidden="true"`), jadi tidak membawa informasi materi.
- Warna diatur lewat kelas CSS `.il-*` yang memakai token tema. Garis selalu hijau hutan, isian memakai mint pastel atau aksen pastel. (Nama kelas `.il-sage` dan `.il-krem` sengaja tidak diganti. Keduanya nama internal yang warnanya kini mengikuti token Emerald + Mint.)
- Tidak ada ilustrasi latar atau pola yang memenuhi layar.

### 7.2 Gambar penjelas materi (Fase 6)

- Dipakai untuk menjelaskan, bukan menghias. Contoh: celengan/buku tabungan untuk istilah di M1, garis waktu 12 bulan di M3.
- Gaya garis sama dengan ilustrasi 7.1 agar konsisten, tetapi tanpa wajah, agar fokus pada informasi.
- Setiap gambar penjelas punya teks alternatif (`alt` atau `aria-label`) dalam bahasa Indonesia.

### 7.3 Logo, favicon, dan ikon aplikasi (Lanora, 12 November 2026)

**Konsep emblem:** huruf **L** berdiri di atas **buku terbuka**, dengan **topi wisuda** di puncak L dan simbol matematika **+ = × %** di sekitarnya. Maknanya: belajar matematika sampai tuntas. Latar emerald, garis hijau hutan, halaman buku dan huruf L putih, simbol mint pastel, dan manik rumbai topi kuning pastel. Konsep koin dan daun **tidak** dipakai.

| Aset | File | Keterangan |
|---|---|---|
| Emblem di aplikasi | `emblemLanora()` di `src/komponen/logo.js` | SVG inline, warna dari token CSS. Dekoratif (`aria-hidden`), karena nama "Lanora" sudah ditulis sebagai teks. |
| Logo lengkap | `public/logo-lanora.svg` | Emblem + tulisan "Lanora" (huruf sistem, tebal 800, hijau hutan) |
| Favicon | `public/favicon.svg` | Versi **sederhana** tanpa simbol kecil dan rumbai, garis lebih tebal, agar jelas di 16–32 px |
| Ikon aplikasi | `public/ikon-192.png`, `public/ikon-512.png` | Latar penuh tanpa sudut membulat (dipotong sistem operasi). Isi diperkecil 78% agar masuk zona aman ikon *maskable*. |
| Apple Touch Icon | `public/apple-touch-icon.png` (180 px) | Sama dengan ikon aplikasi |
| Manifest | `public/manifest.webmanifest` | Nama "Lanora", `display: standalone`, `theme_color` dan `background_color` = `--warna-latar`. Tanpa service worker. |

Aturan:

- **Satu sumber gambar.** Semua aset dibuat dari fungsi `gambarEmblem()` di `src/komponen/logo.js` oleh `scripts/buat-ikon-lanora.mjs`. File PNG dipotret dengan Edge/Chrome headless. Jangan menyunting `favicon.svg` atau PNG secara manual. Tes `tests/merek/logo.test.js` memastikan favicon sama dengan hasil generator dan warna logo sama dengan token CSS.
- **Layar Masuk:** kartu sambutan berisi judul teks **"Lanora"** (32 px, tebal 800) dan subjudul "Belajar Bunga Tunggal dan Tabungan", dengan emblem 96 px di kanan sebagai pengganti ilustrasi celengan. Ini tetap mematuhi aturan satu gambar per halaman.
- Logo **diam**, tanpa animasi, dan tidak dipakai sebagai latar atau pola.
- Jika token warna berubah, perbarui `WARNA_HEKS` di `logo.js`, lalu jalankan ulang `node scripts/buat-ikon-lanora.mjs <folder-bahan>` dan potret ulang PNG-nya.

## 8. Ilustrasi 3D (Three.js)

Tujuan pembelajaran: memperlihatkan bahwa pada bunga tunggal, **bunga bertambah sama besar setiap periode** (pertumbuhan linear) dan **modal tetap**.

| Aturan | Rincian |
|---|---|
| Lokasi | Hanya di halaman Simulasi |
| Pemicu | Tombol "Tampilkan ilustrasi 3D". Tidak tampil otomatis. |
| Isi | Deretan tumpukan koin per periode. Bagian bawah (modal) berwarna `--warna-permukaan` dengan garis tepi, bagian atas (bunga) berwarna `--warna-utama`. |
| Label | Label periode di bawah tumpukan, keterangan singkat: "Bagian hijau = bunga. Bertambah sama setiap bulan." |
| Gerakan | Tidak ada animasi otomatis. Siswa memutar/memperbesar dengan jari. Tombol "Atur ulang tampilan". |
| Ringan | Maksimal 24 tumpukan, geometri sederhana, tanpa bayangan dinamis, rasio piksel ≤ 2 |
| Cadangan | Jika WebGL tidak tersedia: "Perangkatmu belum mendukung tampilan 3D. Lihat tabel di atas." |

Jika lama menabung lebih dari 24 bulan, tumpukan dikelompokkan per tahun.

## 9. Gerak dan Animasi

- Diperbolehkan: transisi antarkartu (geser/memudar ≤ 200 ms), membuka panel dari bawah, perubahan warna menu/tombol (150 ms), dan tombol turun 1 px saat disentuh.
- Tidak diperbolehkan: maskot bergerak, konfeti, angka berjalan, latar bergerak, kedip.
- Jika perangkat mengaktifkan `prefers-reduced-motion`, semua transisi dimatikan.

## 10. Gaya Bahasa (Microcopy)

| Pedoman | Contoh |
|---|---|
| Sapa dengan "kamu" | "Coba hitung bunganya." |
| Kalimat pendek, satu ide | "Ubah bulan ke tahun dulu." |
| Istilah dan simbol konsisten (KF-03, PRD F-02) | Modal awal (M), besar bunga (B), suku bunga per tahun (p), lama menabung (t, dalam tahun), jumlah tabungan akhir (A). Rumus ditulis B = M × (p/100) × t dan A = M + B, tidak pernah "p%". Simbol A selalu disertai istilahnya agar tidak tertukar dengan huruf opsi A–D di kuis. |
| Umpan balik menjelaskan, tidak menghakimi | "Belum tepat. Lama menabung dalam bulan…" |
| Tombol berupa kata kerja | "Periksa", "Lanjut", "Coba lagi", "Minta petunjuk" |
| Pujian secukupnya | "Benar! Kamu sudah mengubah satuan waktu dengan tepat." |

## 11. Aksesibilitas

- Ukuran teks mengikuti pengaturan ukuran huruf perangkat (memakai satuan `rem`).
- Semua kolom isian punya label yang terlihat.
- Urutan fokus dan label tombol jelas untuk pembaca layar (TalkBack).
- Umpan balik diumumkan dengan `aria-live="polite"`.

## 12. Ringkasan Kaitan Desain dan Beban Kognitif

| Jenis beban | Keputusan desain |
|---|---|
| Intrinsic (diurutkan) | Sub-bab kecil, soal bertingkat, rumus invers dipisah ke M5 |
| Extraneous (ditekan) | Palet terbatas, tanpa animasi dekoratif, satu tujuan per layar, rumus berdampingan dengan angka, navigasi disembunyikan saat mengerjakan soal |
| Germane (didorong) | Contoh bertahap, 4 langkah tetap, petunjuk bertahap, langkah Periksa, kesalahan tersering di Riwayat |
