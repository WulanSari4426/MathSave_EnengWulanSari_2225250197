# API — Lanora

> **Catatan nama:** Lanora sebelumnya bernama **MathSave** (nama diganti 12 November 2026). Wawancara, keputusan, dan dokumen sebelum tanggal itu memakai nama MathSave. Pengenal teknis lama sengaja tidak diubah agar akun dan data siswa tetap aman: domain email internal `siswa.mathsave.invalid` dan `penilai.mathsave.invalid`, nama paket npm `mathsave`, kunci `mathsave:pesan-singkat`, komentar di file migrasi, dan nama folder proyek.

Dokumen ini mendefinisikan antarmuka antara frontend dan Supabase, serta fungsi logika di frontend. Struktur tabel ada di [architecture.md](architecture.md) bagian 6. Kode fitur (F-xx) mengacu ke [PRD.md](PRD.md).

---

## 1. Ringkasan

| Nama | Jenis | Fitur | Siapa yang memanggil |
|---|---|---|---|
| `masuk-kode` | Edge Function (HTTP POST) | F-01 | Siswa (belum masuk). Fase 5A: username + PIN (bagian 2e). |
| `daftar-pertama` | Edge Function (HTTP POST) | F-01, KF-05d, KF-05f | Siswa yang belum punya akun. Fase 5A: kode kelas → pilih kelas + username + PIN (bagian 2e). |
| `atur-pin-baru` | Edge Function (HTTP POST) | F-01, KF-05c | Siswa yang sudah diberi kode reset oleh guru/peneliti. Fase 5A: username + kode reset (bagian 2e). |
| `ambil_profil` | RPC | F-01, F-10 | Siswa |
| `simpan_kemajuan` | RPC | F-02, F-10 | Siswa |
| `ambil_soal_latihan` | RPC | F-05, F-06 | Siswa |
| `periksa_pemahaman` | RPC | F-05 | Siswa |
| `ambil_petunjuk` | RPC | F-08 | Siswa |
| `periksa_jawaban` | RPC | F-06, F-07, F-09 | Siswa |
| `mulai_kuis` | RPC | F-07 | Siswa |
| `status_kuis` | RPC | F-07 | Siswa |
| `selesaikan_kuis` | RPC | F-07, F-09 | Siswa |
| `ringkasan_kemajuan` | RPC | F-10 | Siswa |
| `riwayat_belajar` | RPC | F-10 | Siswa |
| `simpan_penjelasan` | RPC | F-11 | Siswa |
| `mulai_tes`, `simpan_jawaban_tahap`, `selesaikan_tes`, `ambil_hasil_tes` | RPC | F-12 (PP-01 sampai PP-10) | Siswa |
| `nilai-tes` | Edge Function (dipanggil server) | F-12 (PP-05, PP-07, PP-09) | Server, bukan siswa |
| `profil_penilai`, `ambil_antrean_penilaian`, `ambil_tahap_untuk_dinilai`, `simpan_nilai_manual` | RPC | F-12 (PT-03, PT-08, PT-14, PT-15) | **Penilai**: guru dan peneliti, tidak pernah siswa |
| `koreksi_skor`, `cari_tahap_untuk_koreksi`, `riwayat_koreksi` | RPC | F-12 (PT-08, PT-16, PT-17) | **Peneliti** saja (PT-18) |
| `masuk-penilai` | Edge Function | F-12 (PT-14, PT-20, PT-21, PT-22) | Penilai sebelum masuk (satu-satunya jalan login penilai) |

Ketentuan umum:

- Semua RPC dipanggil dengan `supabase.rpc('nama_fungsi', { ...parameter })` memakai token siswa.
- Semua RPC adalah fungsi PostgreSQL `SECURITY DEFINER` dengan `search_path` yang ditetapkan. Setiap fungsi mengambil `siswa_id` dari `auth.uid()`, **bukan** dari parameter.
- Hak `EXECUTE` hanya diberikan ke peran `authenticated`, tidak ke `anon`.
- Semua panggilan dari frontend dibungkus di `src/layanan/api.js`. Halaman tidak memanggil `supabase.rpc` secara langsung.

---

## 2. Edge Function `masuk-kode`

> **KF-05f (12 November 2026):** bagian 2, 2a, 2b, dan 2c menjelaskan alur **kode siswa** yang saat ini masih dipakai kode. Setelah Fase 5A diterapkan, alur yang berlaku adalah **bagian 2e** (username + pilihan kelas). Nama ketiga Edge Function **tetap sama**, sehingga `supabase/config.toml` tidak perlu diubah.

`POST {SUPABASE_URL}/functions/v1/masuk-kode`

Header: `Content-Type: application/json`, `apikey: {ANON_KEY}`

Login memakai **kode siswa + PIN** (KF-05, PRD F-01).

**Permintaan**

```json
{ "kode": "s001", "pin": "******" }
```

PIN dikirim lewat HTTPS di badan permintaan, tidak pernah di URL, dan tidak dicatat di log mana pun.

**Proses**

1. Normalisasi kode siswa: huruf besar, hapus spasi dan `-`. Contoh: `s001` → `S001` (KF-05d). Kode yang tidak berpola `S` + 3 angka langsung dianggap gagal (`MASUK_GAGAL`, tetap dihitung untuk kunci). Hapus spasi di PIN. PIN yang bukan **tepat 6 digit angka** (KF-05a) langsung dianggap gagal (`MASUK_GAGAL`, tetap dihitung untuk kunci). PIN diperlakukan sebagai teks, sehingga angka 0 di depan tetap sah. **Kode kelas tidak dipakai** di login (KF-05d D7). Akun yang belum melakukan pendaftaran pertama juga menghasilkan `MASUK_GAGAL`.
2. **Periksa kunci akun (KF-05b).** Hitung `kode_hash = HMAC(RAHASIA_KODE, "cari:" + kode)`, lalu baca `status_masuk` untuk `kode_hash` itu. Ini dilakukan **untuk kode terdaftar maupun tidak**. Jika `terkunci_sampai > now()`, langsung kembalikan 429 `TERLALU_BANYAK_PERCOBAAN` tanpa memeriksa PIN.
   - Batas: **5 kali gagal berurutan per akun** → terkunci **5 menit** (waktu server). Kesalahan satu kode tidak memengaruhi kode lain.
   - Batas IP tambahan **opsional**. Jika dipakai, ambangnya tidak boleh mengunci siswa satu Wi-Fi sekolah (wajib lolos uji satu kelas). Aturan lama "10 kali gagal per IP dalam 15 menit" **tidak berlaku lagi**.
3. Cari `siswa` dengan `kode_hash = HMAC(RAHASIA_KODE, "cari:" + kode)` dan `aktif = true`.
4. Hitung kata sandi `HMAC(RAHASIA_KODE, "sandi:" + kode + ":" + pin)`. Langkah ini **tetap dijalankan walaupun kode tidak ditemukan**, agar waktu respons tidak membocorkan apakah kode terdaftar.
5. Jika siswa ditemukan, masuk ke Supabase Auth dengan email internal dan kata sandi tersebut. Supabase Auth membandingkannya dengan hash bcrypt yang tersimpan.
6. Perbarui `status_masuk` secara atomik: berhasil → `gagal_berturut = 0`; gagal → `gagal_berturut + 1`; jika mencapai 5 → `terkunci_sampai = now() + 5 menit`. Kegagalan ke-5 itu sendiri tetap dijawab `MASUK_GAGAL`. Percobaan **berikutnya** yang dijawab 429.
7. Catat hasil ke `percobaan_masuk` (berhasil/gagal/terkunci, `ip_hash`, dan `kode_hash`), **tanpa** PIN.

**Respons berhasil — 200**

```json
{
  "access_token": "eyJ...",
  "refresh_token": "abc...",
  "expires_in": 3600,
  "siswa": { "nama_panggilan": "Rani", "kelas": "VIII-C" }
}
```

Frontend lalu memanggil `supabase.auth.setSession({ access_token, refresh_token })`.

**Respons gagal**

| Status | `kode_galat` | Pesan untuk siswa |
|---|---|---|
| 400 | `ISIAN_KOSONG` | "Tulis kode siswa dan PIN-mu dulu." |
| 401 | `MASUK_GAGAL` | "Kode siswa atau PIN salah. Periksa kembali, atau tanyakan ke gurumu." |
| 429 | `TERLALU_BANYAK_PERCOBAAN` | "Terlalu banyak percobaan masuk. Tunggu 5 menit, lalu coba lagi." (KF-05b) |
| 500 | `GALAT_SERVER` | "Maaf, terjadi gangguan. Coba lagi sebentar lagi." |

Bentuk badan respons gagal:

```json
{ "kode_galat": "MASUK_GAGAL" }
```

Pesan ditentukan di frontend berdasarkan `kode_galat`.

- **Tidak membocorkan informasi (KF-05 L7):** kode yang tidak terdaftar, siswa nonaktif, dan PIN yang salah **selalu** menghasilkan status 401 `MASUK_GAGAL` dengan isi respons yang sama. Kode galat lama `KODE_SALAH` dan `KODE_KOSONG` tidak dipakai lagi.
- `ISIAN_KOSONG` diperiksa di frontend sebelum mengirim, dan diperiksa lagi di server. `ISIAN_KOSONG` tidak menambah hitungan gagal.
- **Penguncian tidak membocorkan informasi (KF-05b + L7):** respons 429 untuk kode terdaftar dan tidak terdaftar sama persis. Respons tidak memuat sisa percobaan, sisa waktu kunci, atau keterangan apakah PIN yang dikirim saat terkunci benar. Selama terkunci, PIN yang benar pun ditolak dengan 429 yang sama.
- **Memulai** reset PIN tidak bisa dilakukan lewat endpoint siswa (KF-05c R6). Reset dimulai guru atau peneliti dengan alat pengelola. Setelah itu, siswa membuat PIN baru lewat `atur-pin-baru` (bagian 2a).

## 2b. Edge Function `daftar-pertama` (KF-05d)

`POST {SUPABASE_URL}/functions/v1/daftar-pertama`

Dipakai **sekali per akun**: siswa membuat PIN sendiri dengan kode kelas dan kode siswa dari peneliti.

**Permintaan**

```json
{ "kode_kelas": "230706", "kode": "s001", "pin_baru": "******" }
```

Konfirmasi PIN (mengetik dua kali, KF-05a P3) dan bentuk 6 digit diperiksa di frontend sebelum dikirim, dan diperiksa lagi di server. Hanya `pin_baru` yang dikirim. Kode kelas **tidak** disimpan atau dibandingkan di frontend, termasuk untuk aturan PIN ≠ kode kelas.

**Proses**

1. Normalisasi `kode` (huruf besar, pola `S` + 3 angka) dan `kode_kelas` (6 angka). Format yang tidak sesuai, termasuk kedua kode yang tertukar (D6), dijawab `DAFTAR_GAGAL`.
2. Periksa kunci untuk `kode_hash` (mekanisme KF-05b, 5 kali gagal berurutan → 5 menit).
3. Bandingkan `HMAC(RAHASIA_KODE, "kelas:" + kode_kelas)` dengan *secret* `KODE_KELAS_HASH`.
4. Cari `siswa` dengan `kode_hash` itu, `aktif = true`, dan `pin_dibuat_pada` **masih kosong**.
5. Periksa aturan PIN (KF-05a): `pin_baru` **tepat 6 digit angka** (`^[0-9]{6}$`, sebagai teks), dan `HMAC(RAHASIA_KODE, "kelas:" + pin_baru)` **tidak sama** dengan `KODE_KELAS_HASH` (PIN ≠ kode kelas `230706`). Langkah ini hanya dijalankan setelah langkah 3–4 valid.
6. Klaim akun dulu: isi `pin_dibuat_pada = now()` dengan syarat `pin_dibuat_pada IS NULL` (fungsi `klaim_pendaftaran_pertama`). Jika syarat gagal karena ada pendaftaran lain lebih dulu, jawab `DAFTAR_GAGAL`. Setelah klaim berhasil, perbarui kata sandi Auth menjadi `HMAC(RAHASIA_KODE, "sandi:" + kode + ":" + pin_baru)`. Jika pembaruan Auth gagal, klaim dibatalkan (`pin_dibuat_pada` kembali kosong) dan respons 500 `GALAT_SERVER`. *(Catatan implementasi: Admin API Auth tidak bisa ikut transaksi database. Urutan klaim → ganti kata sandi → batalkan jika gagal memberi jaminan yang sama: dari dua pendaftaran bersamaan, hanya satu yang berhasil.)*
7. Masuk dengan kata sandi baru dan kembalikan sesi (bentuk sama dengan `masuk-kode`). Perbarui `status_masuk`.

**Respons**

| Status | `kode_galat` | Pesan untuk siswa |
|---|---|---|
| 200 | — | (sesi; siswa langsung masuk ke Beranda) |
| 400 | `ISIAN_KOSONG` | "Lengkapi kode kelas, kode siswa, dan PIN barumu." |
| 400 | `PIN_TIDAK_SESUAI_ATURAN` | "PIN harus 6 angka." atau "PIN tidak boleh sama dengan kode kelas. Buat PIN lain." Hanya dikirim jika kode kelas dan kode siswa **sudah terbukti valid** dan akun belum terdaftar. Badan respons memuat `alasan`: `BUKAN_6_ANGKA` atau `SAMA_DENGAN_KODE_KELAS`, agar frontend memilih pesan yang tepat. Contoh: `{ "kode_galat": "PIN_TIDAK_SESUAI_ATURAN", "alasan": "SAMA_DENGAN_KODE_KELAS" }`. |
| 401 | `DAFTAR_GAGAL` | "Pendaftaran tidak bisa diproses. Periksa kode kelas dan kode siswa. Jika kamu sudah pernah mendaftar, masuk dengan kode siswa dan PIN-mu, atau tanyakan ke penelitimu." |
| 429 | `TERLALU_BANYAK_PERCOBAAN` | "Terlalu banyak percobaan. Tunggu 5 menit, lalu coba lagi." |
| 500 | `GALAT_SERVER` | "Maaf, terjadi gangguan. Coba lagi sebentar lagi." |

`DAFTAR_GAGAL` dipakai untuk **semua** kasus berikut: kode kelas salah, kode siswa tidak terdaftar, kode tertukar, atau akun sudah pernah didaftarkan. Dengan begitu, respons tidak membocorkan kode siswa mana yang ada atau sudah dipakai (KF-05 L7). Kode kelas, kode siswa, dan PIN tidak dicatat di log.

## 2a. Edge Function `atur-pin-baru` (KF-05c)

`POST {SUPABASE_URL}/functions/v1/atur-pin-baru`

Dipakai siswa **setelah** guru atau peneliti melakukan reset dan memberinya kode reset sementara. Tanpa kode reset yang valid, fungsi ini tidak bisa mengubah PIN apa pun, sehingga bukan fitur "Lupa PIN" mandiri.

**Permintaan**

```json
{ "kode": "s001", "kode_reset": "********", "pin_baru": "******" }
```

Konfirmasi PIN (mengetik dua kali, KF-05a P3) dan bentuk 6 digit diperiksa di frontend sebelum dikirim, dan diperiksa lagi di server. Hanya `pin_baru` yang dikirim.

**Proses**

1. Normalisasi kode siswa seperti `masuk-kode`. Hitung `kode_hash`.
2. Periksa batas percobaan untuk `kode_hash` itu. Memakai penghitung yang sama dengan `masuk-kode` (`status_masuk`): 5 kali gagal berurutan → 5 menit (ditetapkan saat implementasi, KF-05c detail f).
3. Cari `reset_pin` yang cocok: milik siswa dengan `kode_hash` itu, hash kode reset sama, `dipakai_pada` kosong, dan `kedaluwarsa_pada > now()`. Pemeriksaan tetap dijalankan dengan waktu yang setara walaupun kode siswa tidak ditemukan.
4. Periksa aturan PIN (KF-05a), sama dengan `daftar-pertama`: tepat 6 digit angka (sebagai teks) dan PIN ≠ kode kelas (dibandingkan dengan *secret* `KODE_KELAS_HASH`). Langkah ini hanya dijalankan setelah langkah 3 valid.
5. Perbarui kata sandi Auth siswa menjadi `HMAC(RAHASIA_KODE, "sandi:" + kode + ":" + pin_baru)` dengan hak *service role* di dalam fungsi. Akun dan data belajar tidak diubah.
6. Isi `dipakai_pada`, lalu masuk dengan kata sandi baru dan kembalikan sesi (bentuk sama dengan `masuk-kode`).

**Respons**

| Status | `kode_galat` | Pesan untuk siswa |
|---|---|---|
| 200 | — | (sesi; siswa langsung masuk ke Beranda) |
| 400 | `ISIAN_KOSONG` | "Lengkapi kode siswa, kode reset, dan PIN barumu." |
| 400 | `PIN_TIDAK_SESUAI_ATURAN` | "PIN harus 6 angka." atau "PIN tidak boleh sama dengan kode kelas. Buat PIN lain." Hanya dikirim jika kode siswa dan kode reset **sudah terbukti valid**, agar tidak membocorkan informasi. |
| 401 | `RESET_GAGAL` | "Kode siswa atau kode reset tidak sesuai, atau kode reset sudah tidak berlaku. Tanyakan ke guru atau penelitimu." |
| 429 | `TERLALU_BANYAK_PERCOBAAN` | "Terlalu banyak percobaan. Tunggu 5 menit, lalu coba lagi." |
| 500 | `GALAT_SERVER` | "Maaf, terjadi gangguan. Coba lagi sebentar lagi." |

`RESET_GAGAL` dipakai untuk semua kasus: kode siswa tidak terdaftar, kode reset salah, kedaluwarsa, sudah dipakai, atau milik siswa lain (KF-05 L7). Kode reset dan PIN tidak pernah dicatat di log.

Kode reset: 8 karakter dari `ABCDEFGHJKMNPQRSTUVWXYZ23456789`, ditampilkan `ABCD-2345`, berlaku 24 jam, sekali pakai. Huruf kecil, spasi, dan `-` diterima. Disimpan sebagai `HMAC(RAHASIA_KODE, "reset:" + kode_reset)`. Jika penggantian kata sandi Auth gagal setelah kode dipakai, pemakaiannya dibatalkan agar kode itu bisa dicoba lagi.

### 2c. Fungsi database khusus Edge Function dan skrip pengelola

Migrasi `20261112000004_fungsi_login.sql`. Hak `EXECUTE` **hanya** untuk `service_role`. Siswa dan `anon` tidak bisa memanggilnya. Semua masukan berupa hash, tidak pernah kode atau PIN asli.

| Fungsi | Dipakai oleh | Kegunaan |
|---|---|---|
| `kunci_masuk_aktif(p_kode_hash)` | ketiga Edge Function | `true` jika `terkunci_sampai > now()` |
| `catat_percobaan_masuk(p_kode_hash, p_berhasil, p_ip_hash)` | ketiga Edge Function | Pembaruan `status_masuk` yang atomik (K6–K10, tidak memperpanjang kunci) dan log `percobaan_masuk` |
| `cari_siswa_untuk_masuk(p_kode_hash)` | ketiga Edge Function | Data siswa **aktif** (`id`, `auth_user_id`, `pin_dibuat_pada`, nama panggilan, kelas), atau `null` |
| `klaim_pendaftaran_pertama(p_siswa_id)` / `batalkan_klaim_pendaftaran` | `daftar-pertama` | Klaim bersyarat `pin_dibuat_pada IS NULL` dan pembatalannya |
| `cari_reset_pin_valid`, `pakai_reset_pin`, `batalkan_pakai_reset_pin` | `atur-pin-baru` | Kode reset yang masih berlaku, pemakaian sekali, dan pembatalan |
| `tambah_siswa`, `daftar_kode_hash_siswa` | `buat-siswa.js` | Menyimpan siswa baru dan menentukan nomor kode berikutnya |
| `buat_reset_pin(p_kode_hash, p_token_hash, p_berlaku, p_dibuat_oleh)` | *(akun kode siswa)* | Membatalkan kode reset lama, membuat yang baru, mengakhiri kunci, dan mengembalikan `auth_user_id`. **Sejak Fase 5A Tahap 4 tidak dipakai skrip mana pun.** `reset-pin.js` memakai `buat_reset_pin_siswa` (2e.6). |

**Keluar:** `supabase.auth.signOut()` di frontend, tanpa endpoint khusus.

---

## 2e. Alur username dan pilihan kelas (KF-05f, rencana Fase 5A)

> **Status:** spesifikasi disetujui. Backend (migrasi `…0005`, Edge Function, skrip) dan frontend (`src/layanan/autentikasi.js`, `src/layanan/api.js`) **sudah diimplementasi dan diuji lokal (Fase 5A Tahap 2–5), tetapi belum dijalankan atau di-deploy ke Supabase.** Rancangan data dan fungsi SQL ada di architecture.md bagian 5.0. Header, CORS, bentuk sesi berhasil (`access_token`, `refresh_token`, `expires_in`, `siswa`), dan `GALAT_SERVER` sama dengan bagian 2.

**Aturan username:** dinormalisasi lebih dulu (spasi tepi dibuang, huruf kecil), lalu harus cocok `^[a-z][a-z0-9_]{2,19}$` dan bukan kata terlarang (`admin`, `guru`, `peneliti`, `lanora`, dan lainnya yang disimpan di kode server). Aturan ini ada di satu modul `_bersama/` yang juga dipakai frontend. Daftar kata terlarang hanya ada di server.

### 2e.1 `daftar-pertama`, aksi `periksa_kode_kelas` (langkah 1)

```json
{ "aksi": "periksa_kode_kelas", "kode_kelas": "230706" }
```

**Berhasil — 200** (hanya kelas `aktif`, terurut jenjang lalu `urutan`):

```json
{ "kelas": [ { "id": 3, "nama": "VIII-C", "jenjang": 8 }, { "id": 7, "nama": "X IPA 1", "jenjang": 10 } ] }
```

Daftar kelas **tidak pernah** dikirim sebelum kode kelas terbukti benar.

### 2e.2 `daftar-pertama`, aksi `daftar` (langkah 2)

```json
{ "aksi": "daftar", "kode_kelas": "230706", "kelas_id": 3, "username": "Rani_08", "pin_baru": "******", "ulang_pin": "******" }
```

Kode kelas diperiksa **ulang** di langkah ini. Urutan proses ada di architecture.md 5.0.
- **Berhasil:** 200 dengan sesi, dan `siswa.nama_panggilan` = username yang sudah dinormalisasi (`rani_08`).
- **`ulang_pin`** (Tahap 3, 12 November 2026): konfirmasi PIN diperiksa juga di server, bukan hanya di frontend. Jika berbeda: `PIN_TIDAK_SESUAI_ATURAN` dengan alasan `TIDAK_SAMA`.
- **201 `{ "akun_dibuat": true }`** (tanpa sesi): akun sudah tersimpan, tetapi masuk otomatis gagal. Akun **tidak** dihapus. Frontend mengarahkan siswa ke layar Masuk dengan pesan "Akun sudah dibuat. Silakan masuk dengan username dan PIN-mu."
- Jika penyimpanan siswa gagal setelah akun Auth dibuat (username direbut pendaftaran lain, kelas dinonaktifkan, atau batas IP tercapai), akun Auth itu **dihapus lagi** sebelum galat dikirim, sehingga tidak ada akun yatim. Jika penghapusan juga gagal, respons 500 dan log memuat UUID akun Auth tersebut (tanpa username atau PIN) agar peneliti bisa membersihkannya.

### 2e.3 `masuk-kode` (login)

```json
{ "username": "Rani_08", "pin": "******" }
```

Username yang tidak terdaftar, PIN salah, dan akun nonaktif **selalu** dijawab 401 `MASUK_GAGAL` dengan respons yang sama. Penguncian dihitung per username dan **bertingkat** (5 → 15 → 60 menit), ditambah batas gagal per IP tepercaya. Rinciannya di 2e.8.

### 2e.4 `atur-pin-baru`

```json
{ "username": "rani_08", "kode_reset": "ABCD-2345", "pin_baru": "******", "ulang_pin": "******" }
```

Sama dengan bagian 2a, tetapi siswa dikenali dari username dan konfirmasi PIN juga diperiksa server (`TIDAK_SAMA`). `RESET_GAGAL` tetap seragam. Kata sandi baru diturunkan dari `siswa.id` (`"sandi-siswa:"`), termasuk untuk akun lama yang sudah diberi username. Jika PIN baru sudah tersimpan tetapi masuk otomatis gagal (termasuk Supabase Auth 429), respons **201 `{ "pin_diubah": true }`** (tanpa sesi), dan siswa masuk lewat layar Masuk dengan PIN barunya. Hal yang sama berlaku untuk pendaftaran: akun tersimpan + masuk otomatis gagal → 201 `akun_dibuat`, bukan 500. Batas IP dan penguncian bertingkat (2e.8) juga berlaku di layar ini.

### 2e.5 Kode galat (baru dan berubah)

| Status | `kode_galat` | Dipakai di | Pesan untuk siswa |
|---|---|---|---|
| 400 | `ISIAN_KOSONG` | semua | Masuk: "Tulis username dan PIN-mu dulu." Daftar: "Lengkapi semua isian dulu." Buat PIN baru: "Lengkapi username, kode reset, dan PIN barumu." |
| 401 | `KODE_KELAS_SALAH` | daftar langkah 1 & 2 | "Kode kelas tidak sesuai. Tanyakan ke guru atau penelitimu." |
| 400 | `KELAS_TIDAK_SAH` | daftar langkah 2 | "Pilih kelasmu dari daftar." |
| 400 | `USERNAME_TIDAK_SAH` | daftar langkah 2 | "Username harus 3–20 karakter: huruf kecil, angka, atau _, dan diawali huruf." (alasan `FORMAT`), atau "Username ini tidak boleh dipakai. Coba yang lain." (alasan `TERLARANG`) |
| 409 | `USERNAME_SUDAH_DIPAKAI` | daftar langkah 2 | "Username sudah dipakai. Coba yang lain." (pengecualian L7 yang disengaja, RS-04) |
| 400 | `PIN_TIDAK_SESUAI_ATURAN` | daftar, atur PIN baru | Sama dengan bagian 2b (alasan `BUKAN_6_ANGKA` / `SAMA_DENGAN_KODE_KELAS`), ditambah alasan `TIDAK_SAMA`: "PIN dan ulangannya belum sama." |
| 401 | `MASUK_GAGAL` | masuk | "Username atau PIN salah. Periksa kembali, atau tanyakan ke gurumu." |
| 401 | `RESET_GAGAL` | atur PIN baru | "Username atau kode reset tidak sesuai, atau kode reset sudah tidak berlaku. Tanyakan ke guru atau penelitimu." |
| 429 | `TERLALU_BANYAK_PERCOBAAN` | masuk, atur PIN baru (per username bertingkat, atau per IP tepercaya; 2e.8) | "Terlalu banyak percobaan. Tunggu beberapa menit, lalu coba lagi." (lama kunci tidak disebut, L7) |
| 503 | `LAYANAN_SIBUK` | masuk, daftar, atur PIN baru (Supabase Auth membatasi laju, 429) | "Server sedang sibuk. Tunggu sebentar, lalu coba lagi." Tidak dihitung sebagai PIN salah. |
| 429 | `TERLALU_BANYAK_PENDAFTARAN` | daftar (per IP, U9: 20 kode kelas salah atau 60 akun baru per jam) | "Terlalu banyak percobaan pendaftaran dari jaringan ini. Coba lagi nanti, atau minta bantuan gurumu." |

Kode galat lama `DAFTAR_GAGAL` tidak dipakai lagi setelah Fase 5A.

### 2e.6 Fungsi database khusus `service_role`

Lihat tabel "Fungsi database baru" di architecture.md 5.0 (migrasi `…0005`). Semuanya dipanggil lewat RPC. Di proyek ini, `service_role` tidak punya hak membaca tabel secara langsung (hasil Tahap 0).

### 2e.8 Penguncian bertingkat, batas IP, galat Auth, dan header (perbaikan keamanan 12 November 2026, migrasi `…0006`)

Diputuskan pengembang 12 November 2026. Alur tampilan tidak berubah: daftar dengan kode kelas → pilih kelas → username → PIN; login hanya username + PIN; kode kelas tidak diminta saat login; PIN tetap 6 angka.

- **Penguncian bertingkat per username** (`status_masuk.tingkat_kunci`): kegagalan ke-5 berurutan mengunci **5 menit** (kunci ke-1), **15 menit** (ke-2), lalu **60 menit** (ke-3 dan seterusnya). Tingkat kembali 0 setelah login/atur PIN berhasil, setelah reset PIN oleh peneliti, atau setelah **24 jam** tanpa percobaan. K7, K8, K10 dan aturan "tidak diperpanjang selama terkunci" tetap. Username tidak terdaftar diperlakukan sama.
- **Batas gagal login per IP:** **100 kegagalan per jam** per IP (`masuk_ip_terbatas`, `batas_masuk_ip()`), di `masuk-kode` dan `atur-pin-baru`. Dijawab 429 `TERLALU_BANYAK_PERCOBAAN` yang sama dengan kunci username. Penolakan ini **tidak dicatat** (banjir permintaan tidak menambah baris log). Satu kelas 30 siswa yang masing-masing salah 2 kali (60 kegagalan) tetap bisa masuk (diuji).
- **Sumber IP tepercaya:** hanya header `cf-connecting-ip` (diisi Cloudflare di depan Supabase). `x-forwarded-for` dan `x-real-ip` **tidak** dipakai, karena nilai pertamanya bisa diisi klien (temuan T3). Dokumentasi resmi Supabase belum menyebut header IP untuk Edge Function (diperiksa 12 November 2026), jadi perilaku ini **wajib** diuji di proyek asli. Tanpa IP tepercaya: batas login per IP tidak dipakai (hanya kunci per username), dan pendaftaran (U9) memakai satu ember bersama `ip-tidak-diketahui`.
- **Galat Supabase Auth:** dikenali lewat `error.code`/status, bukan teks pesan. `invalid_credentials` (atau 400 tanpa kode) = PIN salah dan dihitung gagal. **429 / `over_request_rate_limit`** = layanan sibuk → 503 `LAYANAN_SIBUK`, **tidak** dihitung gagal. Galat lain → 500 `GALAT_SERVER`, tidak dihitung gagal.
- **Kunci API Edge Function:** `SUPABASE_SECRET_KEYS` / `SUPABASE_PUBLISHABLE_KEYS` (kunci `default`) dipakai lebih dulu, dengan cadangan `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_ANON_KEY`.
- **Header dari frontend:** kunci publik `sb_publishable_` dikirim **hanya** di header `apikey`. `Authorization` tidak dikirim, karena kunci itu bukan JWT (dokumentasi Supabase "Securing Edge Functions" dan "API keys", diperiksa 12 November 2026).
- **`verify_jwt` tetap bawaan (`true`)**, dan `supabase/config.toml` tidak diubah. Menurut dokumentasi resmi, pemeriksaan platform tetap menerima kunci publishable/secret di header `apikey` atau `Authorization`. Jadi tidak ada alasan teknis terverifikasi untuk mematikannya. Pemeriksaan ini **bukan** autentikasi siswa (kunci publik bisa dibaca siapa pun), sehingga pengamannya tetap di dalam fungsi: kode kelas, kunci per username, batas IP, aturan PIN, dan kode reset sekali pakai. Jika uji di proyek asli membuktikan permintaan ditolak 401 oleh platform, keputusan ini ditinjau ulang.

### 2e.7 Skrip pengelola (Fase 5A Tahap 4)

Skrip dijalankan di komputer peneliti dengan `node --env-file=.env …`, **hanya lewat RPC**. Nama fungsi dan parameternya diuji agar sama dengan tanda tangan di migrasi.

| Skrip | RPC (migrasi `…0005`) | Catatan |
|---|---|---|
| `supabase/seed/reset-pin.js <username> <peneliti\|guru>` | `cari_siswa_username(p_username)` → `buat_reset_pin_siswa(p_siswa_id, p_kunci_hash, p_token_hash, p_berlaku, p_dibuat_oleh)`, lalu Admin API mengganti kata sandi Auth dengan nilai acak | Username dinormalisasi ke huruf kecil. `p_kunci_hash` = HMAC `"cari-username:"`, sehingga kunci login username itu ikut diakhiri. Kode reset hanya **ditampilkan sekali** di terminal, sedangkan database menyimpan HMAC-nya. Akun nonaktif atau tidak ada: "tidak ditemukan atau akunnya nonaktif". |
| `supabase/seed/kelola-kelas.js daftar` | `kelola_kelas_daftar()` | Tabel id, nama, jenjang (VII–XII), urutan, status, jumlah siswa |
| `… tambah "<nama>" <jenjang> [urutan]` | `kelola_kelas_tambah(p_nama, p_jenjang, p_urutan)` | Jenjang `7`–`12` atau `VII`–`XII`. `KELAS_SUDAH_ADA` → "Nama kelas itu sudah ada…" |
| `… ubah-nama <id> "<nama>"` | `kelola_kelas_ubah_nama(p_id, p_nama)` | Teks kelas pada siswa yang sudah tersimpan tidak berubah |
| `… nonaktifkan <id>` / `aktifkan <id>` | `kelola_kelas_setel_aktif(p_id, p_aktif)` | `KELAS_TIDAK_DITEMUKAN` → "Kelas dengan id itu tidak ditemukan…" |
| *(tidak ada)* `hapus` | — | Ditolak dengan pesan "Tidak ada perintah hapus… Gunakan nonaktifkan". Migrasi juga tidak menyediakan fungsi hapus. |
| `supabase/seed/buat-siswa.js <csv> --akun-lama-kode-siswa` | `daftar_kode_hash_siswa`, `tambah_siswa` (0004) | **Hanya akun lama.** Tanpa tanda itu, skrip berhenti sebelum membaca CSV atau terhubung ke Supabase. |

---

## 3. Fungsi RPC

### 3.1 `ambil_profil()`

**Keluaran**

```json
{ "nama_panggilan": "Rani", "kelas": "VIII-C" }
```

### 3.2 `simpan_kemajuan(p_sub_materi, p_status, p_kartu_terakhir)`

| Parameter | Tipe | Nilai |
|---|---|---|
| `p_sub_materi` | text | `P0`, `M1`–`M6` |
| `p_status` | text | `sedang` atau `selesai` |
| `p_kartu_terakhir` | smallint | indeks kartu terakhir yang dibuka (mulai 0) |

Melakukan *upsert* ke `kemajuan_materi`. Status `selesai` tidak bisa kembali menjadi `sedang`.

**Keluaran:** `{ "ok": true }`

### 3.3 `ambil_soal_latihan(p_sub_materi, p_tingkat, p_jumlah)`

| Parameter | Tipe | Default |
|---|---|---|
| `p_sub_materi` | text | wajib |
| `p_tingkat` | smallint | wajib (1–3) |
| `p_jumlah` | smallint | 5 |

Mengambil soal aktif secara acak **hanya dari bank latihan** (`bank = 'latihan'`, KF-14 S2). Soal bank kuis tidak pernah dikembalikan oleh fungsi ini. Soal yang sudah dijawab benar oleh siswa diutamakan untuk tidak dipilih. Fungsi ini hanya membaca, dan tidak menulis apa pun yang memengaruhi bank kuis (S4).

**Keluaran:** array **soal publik**. Kolom `jawaban`, `pembahasan`, `pola_kesalahan`, dan `petunjuk` **tidak** disertakan.

```json
[
  {
    "id": "6f1c...",
    "kode": "M3-T2-04",
    "sub_materi": "M3",
    "tingkat": 2,
    "konteks": "koperasi sekolah",
    "teks_soal": "Rani menabung Rp2.000.000 di koperasi sekolah dengan suku bunga 6% per tahun. Berapa bunga yang Rani peroleh setelah 8 bulan?",
    "satuan_jawaban": "rupiah",
    "bentuk": "isian",
    "opsi": null
  }
]
```

Bank latihan hanya berisi soal `bentuk = 'isian'`, sehingga `opsi` selalu `null` di sini.

**Bentuk soal publik pilihan ganda** (hanya muncul di kuis, lihat 3.7). `opsi` berisi **4 opsi** (KF-18) **dalam urutan acak milik sesi ini** (`sesi_kuis_soal.urutan_opsi`). Setiap opsi hanya memuat `id`, `huruf`, dan `teks`. `nilai`, `kunci`, dan `jenis_kesalahan` **tidak** dikirim:

```json
{
  "id": "9d2e...",
  "kode": "M3-T2-PG-02",
  "nomor": 2,
  "teks_soal": "…",
  "satuan_jawaban": "rupiah",
  "bentuk": "pilihan_ganda",
  "opsi": [
    { "id": "o3", "huruf": "A", "teks": "Rp2.080.000" },
    { "id": "o1", "huruf": "B", "teks": "Rp80.000" },
    { "id": "o4", "huruf": "C", "teks": "Rp8.000.000" },
    { "id": "o2", "huruf": "D", "teks": "Rp960.000" }
  ]
}
```

- `id` adalah pengenal tetap opsi di bank soal. `huruf` hanya untuk tampilan, sesuai urutan acak sesi ini. Siswa lain bisa melihat huruf yang berbeda untuk opsi yang sama.
- Urutan dan huruf **sama** setiap kali sesi ini dibuka (`mulai_kuis` atau `status_kuis`), termasuk setelah keluar sementara atau menutup aplikasi.

### 3.4 `periksa_pemahaman(p_soal_id, p_diketahui, p_ditanya)`

Untuk panel **Pahami Soal** (F-05). Siswa mengisi tabel *Diketahui* dan memilih *Ditanya*.

| Parameter | Tipe | Contoh |
|---|---|---|
| `p_soal_id` | uuid | |
| `p_diketahui` | jsonb | `{"modal":2000000,"suku_bunga":6,"lama":8,"satuan_lama":"bulan"}` |
| `p_ditanya` | text | `bunga` |

**Keluaran**

```json
{
  "semua_tepat": false,
  "rincian": {
    "modal": true,
    "suku_bunga": true,
    "lama": true,
    "satuan_lama": false,
    "ditanya": true
  },
  "pesan": "Periksa lagi satuan lama menabung pada soal."
}
```

Hasil ini **tidak** disimpan sebagai jawaban dan tidak memengaruhi nilai. Hanya untuk soal `bank = 'latihan'`. Soal bank kuis ditolak dengan `SOAL_TIDAK_DITEMUKAN` (KF-14).

### 3.5 `ambil_petunjuk(p_soal_id, p_level)`

| Parameter | Tipe | Nilai |
|---|---|---|
| `p_soal_id` | uuid | |
| `p_level` | smallint | 1–3 (KF-15). Nilai lain ditolak `INPUT_TIDAK_VALID`. |

Hanya untuk soal `bank = 'latihan'` (KF-14, KF-15 H1). Soal bank kuis selalu ditolak: `PETUNJUK_TIDAK_TERSEDIA` jika soal sedang dikerjakan dalam kuis yang belum selesai (H8), dan `SOAL_TIDAK_DITEMUKAN` untuk soal bank kuis lainnya.

**Keluaran**

```json
{
  "level": 1,
  "langkah": "Pahami",
  "teks": "Diketahui: modal Rp2.000.000, suku bunga 6% per tahun, lama 8 bulan. Yang ditanya: besar bunga.",
  "sorotan": ["Rp2.000.000", "6% per tahun", "8 bulan"],
  "level_maks": 3
}
```

| `level` | `langkah` | Isi `teks` (KF-15) |
|---|---|---|
| 1 | Pahami | Informasi yang diketahui dan ditanyakan |
| 2 | Rencanakan | Rumus atau konsep yang sesuai |
| 3 | Hitung | Arahan langkah awal perhitungan, **tanpa jawaban akhir** |

- `sorotan` hanya diisi pada level 1.
- Bertahap (H7): frontend hanya menampilkan tombol untuk level berikutnya, yaitu level 2 setelah level 1 dan level 3 setelah level 2. Tidak ada level 4.
- Teks petunjuk diambil apa adanya dari `soal.petunjuk`. Server tidak menambahkan jawaban. Larangan jawaban akhir (H6) dijaga saat bank soal disusun (Fase 7).

### 3.6 `periksa_jawaban(p_soal_id, p_jawaban, p_jumlah_petunjuk, p_durasi_detik, p_sesi_kuis_id, p_opsi)`

| Parameter | Tipe | Keterangan |
|---|---|---|
| `p_soal_id` | uuid | |
| `p_jawaban` | numeric atau `null` | Soal isian: sudah diurai dari teks oleh `uraiAngka` di frontend. Soal pilihan ganda: `null`. |
| `p_jumlah_petunjuk` | smallint | 0–3 (KF-15). Selalu 0 di kuis. |
| `p_durasi_detik` | integer | |
| `p_sesi_kuis_id` | uuid atau `null` | `null` = latihan |
| `p_opsi` | text atau `null` | Soal pilihan ganda: **`id` tetap** opsi yang dipilih, contoh `"o2"`, **bukan huruf** yang tampil (KF-18 O5). Soal isian: `null`. Default `null`. |

Tepat satu dari `p_jawaban` atau `p_opsi` harus diisi sesuai `soal.bentuk`. Jika tidak, galat `INPUT_TIDAK_VALID` (`id` opsi tidak ada di soal itu: `OPSI_TIDAK_VALID`).

**Pemeriksaan bank (KF-14):**

- Mode latihan (`p_sesi_kuis_id = null`): soal **wajib** `bank = 'latihan'`. Soal bank kuis ditolak dengan `SOAL_TIDAK_DITEMUKAN`, sehingga soal kuis tidak bisa dijawab atau dibuka pembahasannya lewat latihan.
- Mode kuis: soal **wajib** tercatat di `sesi_kuis_soal` untuk sesi itu (otomatis `bank = 'kuis'`). Soal lain ditolak dengan `SOAL_TIDAK_DITEMUKAN`.
- Jawaban latihan hanya menulis ke `percobaan_jawaban` (tanpa `sesi_kuis_id`), tidak pernah ke `sesi_kuis_soal`, sehingga tidak mengubah ketersediaan bank kuis (S4).

**Proses**

1. Isian: `benar = |p_jawaban − jawaban| ≤ toleransi` (`soal.toleransi`, sesuai satuan jawaban, KF-19: `rupiah` 1, `persen` 0,01, `tahun`/`bulan`/`hari` 0,01). Perbandingan memakai `numeric` di database, bukan bilangan pecahan biner, agar batas toleransi (misalnya selisih tepat 1 rupiah) dinilai konsisten.
   Pilihan ganda: `benar` = opsi `p_opsi` bertanda `kunci: true` di bank soal. Cara ini juga berlaku untuk soal pernyataan yang opsinya bukan angka (misalnya `kategori_kuis = 'konsep'`, KF-12).
2. Jika salah:
   - Isian: cocokkan jawaban dengan setiap `pola_kesalahan[i].nilai` (toleransi sama). Pola pertama yang cocok menentukan `jenis_kesalahan`. Jika tidak ada yang cocok, `LAINNYA`.
   - Pilihan ganda: `jenis_kesalahan` diambil dari `jenis_kesalahan` opsi yang dipilih. Jika kosong, `LAINNYA`.
3. Mode kuis: jalankan `tutup_sesi_kedaluwarsa` dulu (architecture.md bagian 6). Lalu tolak dengan `WAKTU_HABIS` jika `now()` server sudah melewati `sesi_kuis.batas_waktu`, dan dengan `KUIS_SUDAH_SELESAI` jika sesi sudah dikumpulkan. Jam perangkat tidak dipakai. Ketepatan waktu ditentukan oleh `now()` server **saat jawaban diterima** (KF-20). Jawaban offline yang baru sampai setelah batas waktu ditolak tanpa pengecualian, dan frontend tidak boleh mengirim waktu pembuatan jawaban versi perangkat.
4. Simpan baris ke `percobaan_jawaban` (`jawaban_siswa` = angka isian, atau `nilai` opsi bila ada; `opsi_dipilih` = `p_opsi`).

**Keluaran — mode latihan**

```json
{
  "benar": false,
  "jenis_kesalahan": "SATUAN_WAKTU",
  "pesan": "Lama menabung dalam bulan. Ubah dulu ke tahun: 8 bulan = 8/12 tahun.",
  "jumlah_salah_soal_ini": 1,
  "pembahasan": [ /* 4 langkah, lihat bentuk di bawah */ ]
}
```

- `pembahasan` **selalu diisi** di mode latihan setelah jawaban diperiksa, baik benar maupun salah (KF-15 H9, PRD F-06/F-08). Aturan lama "diisi jika benar atau setelah 2 kali salah" tidak berlaku lagi. `jumlah_salah_soal_ini` tetap dikirim untuk riwayat.
- Mode kuis tetap tidak mengirim pembahasan sebelum kuis dikumpulkan (F-07 aturan 8).
- Bentuk `pembahasan`:

```json
[
  { "langkah": "Pahami", "isi": "Diketahui modal awal M = Rp2.000.000, suku bunga per tahun p = 6, lama menabung 8 bulan. Ditanya: besar bunga (B)." },
  { "langkah": "Rencanakan", "isi": "Lama menabung dalam bulan, jadi t = 8/12 tahun. Rumus: B = M × (p/100) × t." },
  { "langkah": "Hitung", "isi": "B = 2.000.000 × (6/100) × (8/12) = 80.000" },
  { "langkah": "Periksa", "isi": "Bunga Rp80.000 lebih kecil dari modal dan lebih kecil dari bunga setahun (Rp120.000). Masuk akal." }
]
```

**Keluaran — mode kuis** (`p_sesi_kuis_id` diisi)

```json
{ "tersimpan": true }
```

`tersimpan: true` adalah **satu-satunya tanda** bahwa jawaban sudah resmi (KF-20, J1). Sebelum balasan ini diterima, frontend menandai jawaban sebagai "Belum terkirim" dan menyimpannya sementara di perangkat (J2). Jika balasan berupa `WAKTU_HABIS`, jawaban di perangkat dibuang dan soal itu dinilai sebagai tidak dijawab (J4).

Hasil benar/salah, kunci, dan pembahasan tidak dikirim sebelum kuis dikumpulkan. Jika soal yang sama dijawab ulang dalam sesi yang sama, **jawaban terakhir yang diterima server sebelum `batas_waktu`** yang dinilai (KF-22 N1c). Siswa boleh mengubah jawaban sebanyak apa pun selama kuis belum dikumpulkan. Setiap perubahan dicatat sebagai baris baru di `percobaan_jawaban`. Jawaban pilihan ganda tidak bisa dihapus lewat fungsi ini, hanya diganti.

### 3.7 `mulai_kuis()`

Membuat `sesi_kuis` baru berisi **20 soal** dari **bank kuis** (`bank = 'kuis'`, KF-14 S3): **15 soal `pilihan_ganda` dan 5 soal `isian`** (PRD F-07, KF-10). Mencatat `mulai_pada` dengan waktu server dan `batas_waktu = mulai_pada + 30 menit`.

- **Pemilihan soal per nomor kisi-kisi** (KF-21, PRD F-07 "Kisi-kisi kuis"). Untuk nomor 1 sampai 20, baca baris `kisi_kisi_kuis` nomor itu, lalu ambil satu soal (`bank = 'kuis'`, `aktif = true`) yang `kategori_kuis`, `tingkat`, dan `bentuk`-nya **sama persis**, belum dipakai di nomor lain pada sesi ini, dan **belum pernah diterima siswa ini di percobaan sebelumnya** (KF-14: dikecualikan semua `soal_id` milik siswa di `sesi_kuis_soal`, termasuk soal yang tidak dijawab).
  - Jika ada beberapa kandidat, boleh dipilih acak di antara kandidat itu saja (K3).
  - Komposisi tidak diacak. Hasilnya otomatis sesuai KF-12 (tingkat 6/10/4, submateri 3/5/4/4/2/2) dan KF-10 (15 pilihan ganda + 5 isian), karena kisi-kisi sudah memenuhinya.
  - Urutan soal dalam kuis = nomor 1–20 (KF-21), tidak diacak.
  - **Pengacakan opsi (KF-18 E1):** untuk setiap soal pilihan ganda, 4 `id` opsi diacak **sekali** saat sesi dibuat dan disimpan di `sesi_kuis_soal.urutan_opsi` dalam transaksi yang sama. Urutan ini tidak pernah dibuat ulang, termasuk saat sesi dilanjutkan.
  - Jika ada nomor yang tidak punya kandidat, **kategori tidak diganti otomatis** (K4). Fungsi gagal dengan `BANK_SOAL_KURANG`, sesi tidak dibuat, timer tidak dimulai, dan detail galat berisi daftar nomor yang kosong, contoh `{"nomor_kosong": [6, 13]}`, untuk pengelola.
- **Pemeriksaan kecukupan bank (KF-14)** dijalankan sebelum memilih soal, **pada setiap percobaan termasuk yang pertama**: setiap kombinasi `(kategori_kuis, tingkat, bentuk)` harus punya soal aktif **di bank kuis** minimal 2 × jumlah nomor yang memakainya (soal bank latihan tidak dihitung) (total 40, tabel di PRD F-07). Jika kurang, gagal dengan `BANK_SOAL_KURANG` dan detail `{"kombinasi_kurang": [{"kategori_kuis": "konsep", "tingkat": 1, "bentuk": "pilihan_ganda", "tersedia": 3, "minimum": 4}]}`. Tujuannya agar siswa tidak memakai percobaan pertama lalu terhalang di percobaan kedua.
- **Satu transaksi dan kunci per siswa (KF-13, KF-14):** fungsi mengunci baris `siswa` pemanggil (`SELECT … FOR UPDATE`), lalu menjalankan pemeriksaan sesi aktif, batas percobaan, kecukupan bank, pemilihan soal, serta pembuatan `sesi_kuis` dan 20 baris `sesi_kuis_soal` dalam satu transaksi. Permintaan bersamaan dari siswa yang sama dijalankan bergantian. Batasan `UNIQUE (siswa_id, soal_id)` dan `UNIQUE (siswa_id, percobaan_ke)` menjadi pengaman kedua.
  - Spesifikasi lama 3 : 4 : 3 untuk 10 soal dan pemilihan acak berdasarkan total tidak berlaku lagi.

**Keluaran**

```json
{
  "sesi_kuis_id": "a2b9...",
  "mulai_pada": "2026-11-20T08:00:00+07:00",
  "batas_waktu": "2026-11-20T08:30:00+07:00",
  "waktu_server": "2026-11-20T08:00:00+07:00",
  "soal": [ /* 20 soal publik berurutan nomor 1–20, bentuk sama dengan 3.3 ditambah "nomor" */ ],
  "jawaban_tersimpan": []
}
```

- Setiap soal publik di kuis memuat `nomor` (1–20). Kunci jawaban, pembahasan, `nilai`/`kunci`/`jenis_kesalahan` opsi tetap tidak dikirim (KF-21 K5).

- `waktu_server` dipakai frontend untuk menghitung selisih dengan jam perangkat (`selisih = waktu_server − jam perangkat saat respons diterima`). Sisa waktu di layar = `batas_waktu − (jam perangkat + selisih)`. Hitungan ini hanya tampilan dan tetap berjalan saat offline. Keputusan waktu habis tetap di server.
- `jawaban_tersimpan` berisi `{ soal_id, jawaban, opsi }` yang sudah diterima server, untuk melanjutkan sesi. Isinya tidak memuat benar/salah. Daftar ini adalah **acuan resmi** jawaban yang sah (KF-20). Saat tersambung lagi, frontend mencocokkan antrean jawaban offline dengan daftar ini. Jawaban yang ternyata sudah diterima ditandai "Tersimpan", dan sisanya dikirim jika waktu masih ada.
- Fungsi ini menjalankan `tutup_sesi_kedaluwarsa` lebih dulu.
- Jika siswa masih punya sesi yang belum dikumpulkan dan **waktunya masih tersisa**, sesi itu dikembalikan **tanpa mengubah `mulai_pada` dan `batas_waktu`** (KF-11: waktu tidak diulang). Sesi baru tidak dibuat.
- Sesi yang waktunya sudah lewat sudah ditutup otomatis oleh langkah di atas, jadi tidak pernah dilanjutkan.
- **Batas percobaan (KF-13).** Urutan pemeriksaan:
  1. Ada sesi yang masih berjalan → kembalikan sesi itu. Bukan percobaan baru.
  2. Jumlah sesi milik siswa (termasuk yang ditutup karena waktu habis) sudah 2 → gagal dengan `BATAS_PERCOBAAN_KUIS`. Tidak ada sesi atau timer baru.
  3. Selain itu → pilih soal per kisi-kisi (KF-21). Jika berhasil, buat sesi dengan `percobaan_ke = jumlah sesi + 1`. Jika gagal (`BANK_SOAL_KURANG`), tidak ada sesi yang dibuat dan percobaan tidak terhitung.
  
  Batasan `UNIQUE (siswa_id, percobaan_ke)` dan `CHECK (percobaan_ke BETWEEN 1 AND 2)` di database menjaga aturan ini, termasuk jika dua permintaan datang bersamaan. Permintaan yang kalah mendapat sesi yang sudah dibuat, atau `BATAS_PERCOBAAN_KUIS`.
- Keluaran juga memuat `"percobaan_ke": 1` dan `"maks_percobaan": 2`.

### 3.7a `status_kuis()`

Dipanggil frontend saat aplikasi dibuka atau kembali online, untuk mengetahui apakah ada kuis yang perlu dilanjutkan atau baru saja dikumpulkan otomatis. Menjalankan `tutup_sesi_kedaluwarsa` lebih dulu. Tidak membuat sesi baru.

**Keluaran**

```json
{
  "waktu_server": "2026-11-20T08:12:05+07:00",
  "sesi_aktif": {
    "sesi_kuis_id": "a2b9...",
    "mulai_pada": "2026-11-20T08:00:00+07:00",
    "batas_waktu": "2026-11-20T08:30:00+07:00",
    "percobaan_ke": 1,
    "soal": [ /* 20 soal publik */ ],
    "jawaban_tersimpan": [ /* seperti 3.7 */ ]
  },
  "dikumpulkan_otomatis": null,
  "percobaan": {
    "maks": 2,
    "digunakan": 1,
    "sisa": 1,
    "nilai_tertinggi": null
  }
}
```

- `sesi_aktif`: sesi yang masih berjalan, atau `null`.
- `percobaan` (KF-13): `digunakan` = jumlah sesi yang pernah berhasil dimulai, termasuk yang sedang berjalan atau ditutup karena waktu habis. `sisa = maks − digunakan`. `nilai_tertinggi` = skor tertinggi dari sesi yang sudah dikumpulkan, atau `null` jika belum ada. Frontend memakai data ini untuk "Kesempatan kuis: n dari 2" dan untuk menonaktifkan tombol Mulai Kuis saat `sisa = 0`.
- `dikumpulkan_otomatis`: `{ "sesi_kuis_id": "...", "skor": 70, "selesai_pada": "..." }` untuk sesi yang ditutup server karena waktu habis dan hasilnya **belum pernah dibuka** siswa, atau `null`. Frontend menampilkan pesan "Waktu kuis sudah habis. Jawabanmu sudah dikumpulkan otomatis." lalu membuka hasilnya. Penanda "sudah dibuka" disimpan di kolom `sesi_kuis.hasil_dilihat`.

### 3.8 `selesaikan_kuis(p_sesi_kuis_id)`

Mengumpulkan kuis. Dipanggil saat siswa menekan **Selesai Kuis**, atau oleh frontend saat sisa waktu mencapai 0. Sebelum memanggil fungsi ini, frontend mengirim dulu jawaban yang masih "Belum terkirim" (KF-20, J3). Jika perangkat offline, panggilan gagal dan kuis belum terkumpul. Saat waktu habis, server tetap mengumpulkannya lewat `tutup_sesi_kedaluwarsa`.

- `cara_selesai` ditentukan server dengan `now()`: `siswa` jika dipanggil sebelum `batas_waktu`, `waktu_habis` jika sesudahnya. Untuk `waktu_habis`, `selesai_pada` diisi `batas_waktu`, dan hanya jawaban yang diterima sebelum `batas_waktu` yang dinilai.
- Sesi yang ditutup server lewat `tutup_sesi_kedaluwarsa` dihitung dengan cara yang sama, sehingga hasilnya identik dengan jika perangkat memanggil fungsi ini tepat waktu.
- Memanggil fungsi ini menandai `hasil_dilihat = true`, sehingga dipakai juga untuk membuka ulang hasil dari Riwayat.
- Soal yang tidak dijawab dihitung **salah**.
- Nilai: `skor = round(100 × jumlah_benar / 20)`, yaitu 5 poin per soal (AS-08).
- Jika sesi sudah dikumpulkan, fungsi mengembalikan hasil yang sama (aman dipanggil dua kali, misalnya saat tombol Selesai Kuis ditekan bersamaan dengan waktu habis).

**Keluaran**

```json
{
  "skor": 70,
  "percobaan_ke": 1,
  "sisa_percobaan": 1,
  "nilai_tertinggi": 70,
  "jumlah_soal": 20,
  "jumlah_benar": 14,
  "jumlah_salah": 6,
  "jumlah_tidak_dijawab": 2,
  "nomor_salah": [2, 5, 9, 11, 16, 20],
  "cara_selesai": "waktu_habis",
  "rincian": [
    {
      "nomor": 2,
      "soal_id": "9d2e...",
      "bentuk": "pilihan_ganda",
      "teks_soal": "…",
      "opsi": [
        { "id": "o3", "huruf": "A", "teks": "Rp2.080.000", "kunci": false },
        { "id": "o1", "huruf": "B", "teks": "Rp80.000", "kunci": true },
        { "id": "o4", "huruf": "C", "teks": "Rp8.000.000", "kunci": false },
        { "id": "o2", "huruf": "D", "teks": "Rp960.000", "kunci": false }
      ],
      "opsi_dipilih": "o2",
      "huruf_dipilih": "D",
      "jawaban_siswa": 960000,
      "jawaban_benar": 80000,
      "status": "salah",
      "jenis_kesalahan": "SATUAN_WAKTU",
      "pesan": "Lama menabung dalam bulan. Ubah dulu ke tahun: 8 bulan = 8/12 tahun.",
      "pembahasan": [ /* 4 langkah */ ]
    },
    {
      "nomor": 5,
      "soal_id": "6f1c...",
      "bentuk": "isian",
      "teks_soal": "…",
      "opsi": null,
      "opsi_dipilih": null,
      "huruf_dipilih": null,
      "jawaban_siswa": null,
      "jawaban_benar": 1590000,
      "status": "tidak_dijawab",
      "jenis_kesalahan": null,
      "pesan": null,
      "pembahasan": [ /* 4 langkah */ ]
    }
  ]
}
```

- `rincian` berisi **20 soal** sesuai urutan kuis, termasuk yang benar, dan masing-masing punya `pembahasan`.
- `status`: `benar`, `salah`, atau `tidak_dijawab`. `jumlah_salah` sudah termasuk `jumlah_tidak_dijawab`.
- Pada `rincian`, opsi pilihan ganda memuat tanda `kunci`, karena kuis sudah dikumpulkan. Urutan dan `huruf` opsi **sama persis** dengan yang dilihat siswa saat mengerjakan (dari `urutan_opsi`, KF-18 O6). `opsi_dipilih` berisi `id`, dan `huruf_dipilih` berisi huruf yang tampil.
- Untuk soal pilihan ganda pernyataan (tanpa angka, misalnya `konsep`), `jawaban_siswa` dan `jawaban_benar` bernilai `null`. Yang ditampilkan adalah teks opsi yang dipilih (`opsi_dipilih`) dan teks opsi bertanda `kunci`.
- Setiap butir `rincian` juga memuat `tingkat` dan `kategori_kuis`. `nomor` sama dengan nomor kisi-kisi KF-21.
- `skor` adalah nilai percobaan ini. `nilai_tertinggi` adalah nilai utama dari semua percobaan yang sudah dikumpulkan, termasuk yang ini (KF-13). `sisa_percobaan` dipakai untuk pesan "Kamu masih punya 1 kesempatan lagi" atau menonaktifkan tombol kuis.

### 3.9 `ringkasan_kemajuan()`

**Keluaran**

```json
{
  "sub_materi_selesai": 3,
  "total_sub_materi": 7,
  "sub_materi_lanjut": "M4",
  "kuis": {
    "nilai_tertinggi": 85,
    "percobaan": [
      { "percobaan_ke": 1, "skor": 70, "selesai_pada": "2026-11-20T08:30:00+07:00", "sesi_kuis_id": "a2b9..." },
      { "percobaan_ke": 2, "skor": 85, "selesai_pada": "2026-11-22T09:12:00+07:00", "sesi_kuis_id": "c7d1..." }
    ],
    "sisa_percobaan": 0
  },
  "kesalahan_tersering": [
    { "jenis": "SATUAN_WAKTU", "jumlah": 4, "sub_materi_terkait": "M3" },
    { "jenis": "RUMUS_INVERS", "jumlah": 2, "sub_materi_terkait": "M5" }
  ]
}
```

`kesalahan_tersering` berisi maksimal 3 jenis dari 30 hari terakhir, tidak termasuk `LAINNYA`. Jawaban pilihan ganda kuis ikut dihitung jika opsi yang dipilih berasal dari pola kesalahan.

`kuis.nilai_tertinggi` adalah **nilai utama** yang ditampilkan di Beranda (KF-13, P6): skor tertinggi dari percobaan yang sudah dikumpulkan, atau `null` jika belum ada. `kuis.percobaan` berisi semua percobaan yang sudah dikumpulkan (maksimal 2). Field lama `skor_kuis_terakhir` diganti oleh struktur ini.

Pemetaan jenis kesalahan ke sub-bab:

| Jenis | Sub-bab terkait |
|---|---|
| `SATUAN_WAKTU` | M3 |
| `PERSEN` | P0 |
| `TERTUKAR_BUNGA_TABUNGAN` | M4 |
| `RUMUS_INVERS` | M5 |

### 3.10 `riwayat_belajar(p_batas, p_sebelum)`

| Parameter | Tipe | Default |
|---|---|---|
| `p_batas` | smallint | 20 (maksimal 50) |
| `p_sebelum` | timestamptz | `null` = terbaru |

**Keluaran**

```json
[
  { "jenis": "kuis", "waktu": "2026-11-20T08:15:00+07:00", "skor": 70, "percobaan_ke": 1, "cara_selesai": "waktu_habis", "sesi_kuis_id": "a2b9..." },
  { "jenis": "latihan", "waktu": "2026-11-19T19:02:00+07:00", "sub_materi": "M3", "tingkat": 2, "benar": 4, "jumlah": 5 }
]
```

Aktivitas latihan dikelompokkan per sub-bab dan tingkat dalam satu hari. Setiap percobaan kuis yang sudah dikumpulkan muncul sebagai baris tersendiri dengan `percobaan_ke` (KF-13, P5).

### 3.11 `simpan_penjelasan(p_soal_id, p_isi)`

`p_isi` maksimal 500 karakter. Hanya bisa disimpan untuk soal yang sudah pernah dijawab benar oleh siswa.

**Keluaran:** `{ "ok": true }`

### 3.12 Pretest dan posttest (KF-05e, PP-01 sampai PP-10, PRD F-12)

Prinsip umum:

- **Fungsi terpisah dari kuis dan latihan (T8, PP-01).** Fungsi `ambil_soal_latihan`, `mulai_kuis`, `periksa_jawaban`, dan `selesaikan_kuis` **tidak** pernah mengembalikan atau menerima soal instrumen, dan sebaliknya.
- **`p_jenis_tes`** hanya menerima `'pretest'` atau `'posttest'` (T9). Selain itu, `INPUT_TIDAK_VALID`.
- **Identitas dari `auth.uid()`**, bukan dari parameter.
- **Aturan kuis tidak berlaku:** tidak ada timer (PP-04), tidak ada pengacakan (PP-02), dan satu kesempatan per jenis tes (PP-03).
- **Kunci rubrik tidak pernah dikirim** ke perangkat siswa. Pembahasan baru dikirim setelah posttest siswa selesai (PP-06).

#### 3.12.1 `mulai_tes(p_jenis_tes)`

- Jika siswa **belum** punya `hasil_tes` untuk jenis itu: buat baris baru dengan `mulai_pada = now()` dan `status = 'berlangsung'`.
- Jika sudah ada dan `status = 'berlangsung'`: **lanjutkan** baris yang sama, dengan `mulai_pada` tetap. Ini **bukan** percobaan baru (PP-03).
- Jika sudah selesai: gagal dengan `TES_SUDAH_SELESAI`.
- Aturan kapan pretest/posttest boleh dibuka (urutan penelitian) **menunggu PT-09**. Galatnya (misalnya `TES_BELUM_DIBUKA`) ditambahkan setelah diputuskan.

**Keluaran**

```json
{
  "hasil_tes_id": "…",
  "jenis_tes": "pretest",
  "mulai_pada": "2026-11-20T08:00:00+07:00",
  "soal": [
    {
      "nomor": 1,
      "indikator": "penalaran",
      "teks_soal": "(persis dari instrumen)",
      "tahap": [
        { "nomor_tahap": 1, "label": "(label tahapan dari rubrik)", "jawaban_tersimpan": "…" }
      ]
    }
  ]
}
```

Empat soal selalu dalam urutan instrumen (PP-02). `tahap` berasal dari `rubrik_tahap` (label saja, tanpa kunci). `jawaban_tersimpan` berisi jawaban yang sudah tersimpan saat melanjutkan (PP-03).

#### 3.12.2 `simpan_jawaban_tahap(p_hasil_tes_id, p_nomor_soal, p_nomor_tahap, p_jawaban)`

- Menyimpan atau mengganti `jawaban_mentah` satu tahapan (PP-08). Dipanggil saat siswa berpindah kolom atau soal.
- Ditolak dengan `TES_SUDAH_SELESAI` jika tes sudah selesai.
- **Tidak menilai** dan tidak mengembalikan benar/salah.
- Perilaku saat offline (antrean di perangkat) **menunggu PT-10**.

**Keluaran:** `{ "tersimpan": true }`

#### 3.12.3 `selesaikan_tes(p_hasil_tes_id)`

- Mengisi `selesai_pada = now()` dan mengunci jawaban (PP-04). Setelah itu, memanggil penilaian otomatis (Edge Function `nilai-tes`, architecture.md bagian 6). Tahapan **kosong** (semua jenis, termasuk uraian) langsung bernilai 0 dengan status `otomatis` dan tidak masuk antrean manual (PT-03 G7–G9). Tahapan uraian yang **terisi** dan tahapan yang tidak pasti diberi status `menunggu_manual` (G2, G10). Setelah itu, status tes menjadi `menunggu_penilaian_manual` atau `dinilai`. Jika semua tahapan uraian dikosongkan dan tahapan lain pasti, tes langsung `dinilai`.
- Dialog konfirmasi sebelum memanggil fungsi ini **menunggu PT-10**.
- Aman dipanggil dua kali: jika sudah selesai, mengembalikan hasil yang sama.

**Keluaran** (sama dengan 3.12.4)

#### 3.12.4 `ambil_hasil_tes(p_jenis_tes)`

```json
{
  "jenis_tes": "pretest",
  "status": "dinilai",
  "mulai_pada": "…",
  "selesai_pada": "…",
  "skor_per_soal": [
    { "nomor": 1, "indikator": "penalaran", "skor": 4, "skor_maksimal": 6, "final": true, "menunggu_manual": false }
  ],
  "skor_total": 17,
  "skor_total_final": true,
  "pembahasan_tersedia": false
}
```

- **Skor** ditampilkan setelah tes selesai (PP-06).
- `status`: `berlangsung`, `menunggu_penilaian_manual`, atau `dinilai` (PT-03).
- **Selama status `menunggu_penilaian_manual` (PT-08 M3):** respons **tidak memuat angka skor apa pun**. `skor_per_soal` berisi `skor: null` dan `final: false` untuk **semua** soal (termasuk soal yang seluruhnya dinilai otomatis, karena masih bisa dikoreksi), `skor_total: null`, dan `skor_total_final: false`. Frontend menampilkan "Sedang dinilai".
- Angka skor baru dikirim setelah status `dinilai`. Jika kemudian ada koreksi (M4), respons berikutnya memakai skor yang sudah dikoreksi.
- Skor akhir adalah gabungan skor otomatis dan manual (PT-03 G5).
- **Pembahasan** (`pembahasan_tersedia: true` beserta kunci jawaban per soal) hanya dikirim jika **posttest siswa itu sudah selesai** (PP-06). Sebelum itu, kunci dan pembahasan tidak ada di respons, termasuk untuk pretest.
- Saat ini hanya skor per soal dan total yang dikirim ke siswa. Perlu tidaknya skor per tahapan juga ditampilkan menunggu **PT-13**. Skor per tahapan tetap tercatat untuk peneliti (PP-10).

#### 3.12.5 Data penelitian (PP-10)

Tidak ada RPC untuk siswa. Peneliti membuka *view* `v_hasil_tes_penelitian` (dan *view* perbandingan pretest–posttest) di **dasbor Supabase**, lalu mengunduh **CSV**. Isinya mencakup skor setiap tahapan beserta **status penilaiannya** (`otomatis`, `menunggu_manual`, `dinilai_manual`), skor per soal, skor total, waktu mulai, waktu selesai, durasi, jenis tes, dan status tes. Kolom identitas siswa menunggu PT-11.

#### 3.12.5a Penilaian manual (PT-03, PT-08)

Siswa **tidak pernah** bisa mengisi skor atau mengubah status penilaian. Penilaian manual dan koreksi dilakukan peneliti/guru lewat **halaman penilaian di Lanora** dengan RPC di bagian 3.13. Jawaban kosong tidak masuk antrean (G7–G8).

### 3.13 Halaman penilaian (PT-08, hanya untuk penilai)

Semua fungsi di bagian ini:

- Memeriksa peran di server. Fungsi bertanda **[penilai]** boleh dipanggil guru dan peneliti (`adalah_penilai()`). Fungsi bertanda **[peneliti]** hanya boleh dipanggil peneliti (`adalah_peneliti()`, PT-17, PT-18). Pemanggil yang bukan penilai aktif, termasuk akun siswa, gagal dengan `BUKAN_PENILAI`. Guru yang memanggil fungsi peneliti gagal dengan `BUKAN_PENELITI`.
- Mencatat penilai dari `auth.uid()` → `penilai.id`, bukan dari parameter.
- **Tidak pernah mengembalikan identitas siswa** (`siswa_id`, nama panggilan, kode siswa, kelas). Tahapan dikenali dengan `hasil_tes_id` + nomor soal/tahap, ditambah `jenis_tes` (PT-15).

#### 3.13.0 Edge Function `masuk-penilai` (PT-14, PT-20, PT-21, PT-22)

**Satu-satunya jalan login penilai** (PT-21 L1). Frontend **tidak** memanggil `supabase.auth.signInWithPassword` sendiri, dan tidak memakai `masuk-kode`. Layar masuknya terpisah dari layar masuk siswa.

**Masukan:** `POST { "email": "…", "kata_sandi": "…" }`

**Langkah di server** (rincian di architecture.md, "Saat penilai masuk"):

1. Normalisasi email **asli** yang diketik, lalu hitung `email_hash = HMAC(RAHASIA_PENILAI, "penilai-cari:" + email)` (PT-24 J1).
2. **Periksa kunci** di `status_masuk_penilai`, untuk email terdaftar maupun tidak. Jika terkunci → 429 `TERLALU_BANYAK_PERCOBAAN`, kata sandi tidak diperiksa (PT-20 S2, PT-21 L2).
3. Cari `penilai` lewat `email_hash`.
4. Hitung kata sandi turunan `HMAC(RAHASIA_PENILAI, "penilai-sandi:" + auth_user_id + ":" + kata_sandi)`. Langkah ini **tetap dijalankan** walaupun email tidak ditemukan, agar waktu respons tidak membocorkan email terdaftar.
5. Penilai tidak ditemukan **atau `aktif = false`** → 401 `MASUK_PENILAI_GAGAL` (PT-22 D2). Selain itu, panggil `signInWithPassword(email internal akun, kata sandi turunan)` di server (PT-23 E1).
6. Perbarui `status_masuk_penilai` secara atomik (berhasil → 0; gagal → +1; gagal ke-5 → terkunci 5 menit). Akun nonaktif dan email tidak terdaftar juga dihitung sebagai gagal.

**Keluaran berhasil:** `{ "access_token": "…", "refresh_token": "…" }` → frontend memanggil `supabase.auth.setSession`, lalu `profil_penilai()`.

| Status | Kode | Arti | Pesan untuk penilai |
|---|---|---|---|
| 401 | `MASUK_PENILAI_GAGAL` | Email tidak terdaftar, kata sandi salah, atau akun nonaktif. Respons **sama persis** untuk ketiganya. | "Email atau kata sandi salah." |
| 429 | `TERLALU_BANYAK_PERCOBAAN` | Akun (`email_hash`) terkunci | "Terlalu banyak percobaan. Coba lagi 5 menit lagi." |

Catatan:

- Kata sandi yang diketik dan `RAHASIA_PENILAI` **tidak pernah** disimpan di frontend, `localStorage`, tabel Lanora, atau log (PT-21 L3). `RAHASIA_KODE` tidak dipakai di fungsi ini (PT-24 J2).
- **Tidak ada jalur login lain** untuk penilai (PT-23 E2–E3): frontend tidak memanggil `signInWithOtp`, `signInWithPassword`, atau `resetPasswordForEmail`. Akun Auth penilai memakai email internal yang tidak menerima email, sehingga magic link dan OTP tidak bisa diterima.
- Tidak ada fungsi pendaftaran penilai. Akun dibuat peneliti dengan `kelola-penilai.js`, dan pendaftaran mandiri dimatikan (PT-14 A2–A3).
- **Tidak ada endpoint lupa/reset kata sandi** untuk penilai, dan frontend tidak memanggil `resetPasswordForEmail` (PT-19 P3). Reset hanya lewat `kelola-penilai.js` di komputer peneliti (PT-21 L4). Skrip ini bukan endpoint publik.
- Kata sandi minimal 12 karakter (PT-20 S1) diperiksa `kelola-penilai.js` saat akun dibuat atau direset. `masuk-penilai` tidak memeriksa panjang, agar tidak membocorkan aturan akun.
- Setelah masuk, frontend memanggil **`profil_penilai()`** [penilai], yang mengembalikan `{ "nama_tampilan": "…", "peran": "guru" }`. Jika gagal `BUKAN_PENILAI` (termasuk akun yang dinonaktifkan, PT-20 S3), frontend langsung keluar dari sesi.
- **Penonaktifan (PT-22).** `kelola-penilai.js nonaktifkan` mengubah `aktif = false` dan mencabut sesi guru di Supabase Auth (D1, D3), tanpa menghapus akun. Akun `peneliti` ditolak oleh skrip (D4). Pada panggilan RPC berikutnya, sesi yang belum kedaluwarsa mendapat `BUKAN_PENILAI`, dan frontend menampilkan "Akun ini tidak aktif lagi." lalu keluar.
- **Aktif kembali (PT-24 J3–J5).** `kelola-penilai.js aktifkan` (khusus `guru`) mengubah `aktif = true` dan mengosongkan kunci login. Setelah itu `masuk-penilai` menerima login guru lagi. Riwayat penilaian tidak berubah. Tidak ada RPC atau endpoint untuk mengaktifkan atau menonaktifkan akun (J4).

#### 3.13.1 `ambil_antrean_penilaian()` [penilai]

Daftar tahapan `menunggu_manual` dari `v_antrean_penilaian_manual`, berisi `hasil_tes_id`, `jenis_tes` (pretest/posttest, PT-15 N2), `nomor_soal`, `nomor_tahap`, label tahapan, dan waktu tes selesai. **Tanpa identitas siswa** (N1). Guru melihat seluruh antrean (PT-17 H1).

#### 3.13.2 `ambil_tahap_untuk_dinilai(p_hasil_tes_id, p_nomor_soal, p_nomor_tahap)` [penilai]

Mengembalikan `jenis_tes`, teks soal, label tahapan, **deskripsi rubrik asli dan kunci tahapan**, skor maksimal tahapan, `jawaban_mentah` siswa, `nilai_terbaca` dan `alasan_penilaian` mesin (jika ada), status saat ini, skor saat ini, dan `versi`. **Tanpa identitas siswa.** Guru hanya bisa membuka tahapan berstatus `menunggu_manual` (H1). Peneliti bisa membuka semua tahapan.

#### 3.13.3 `simpan_nilai_manual(p_hasil_tes_id, p_nomor_soal, p_nomor_tahap, p_skor, p_hasil, p_catatan, p_versi)` [penilai]

- Hanya untuk tahapan `menunggu_manual`.
- `p_skor` 0 sampai skor maksimal tahapan. Di luar rentang → `SKOR_DI_LUAR_RENTANG`.
- `p_versi` harus sama dengan `versi` saat ini. Jika tidak (sudah dinilai orang lain), → `SUDAH_DINILAI` (M5).
- Mengisi `skor`, `hasil`, `catatan_penilai`, dan `dinilai_oleh`, lalu mengubah status menjadi `dinilai_manual` dan menaikkan `versi`. Setelah itu, skor soal dan total dihitung ulang. Jika tidak ada lagi tahapan `menunggu_manual`, status tes menjadi `dinilai`.

**Keluaran:** `{ "tersimpan": true, "status_tes": "dinilai" }`

#### 3.13.4 `koreksi_skor(p_hasil_tes_id, p_nomor_soal, p_nomor_tahap, p_skor_baru, p_alasan, p_versi)` [peneliti]

*(Sebelumnya bernama `koreksi_skor_otomatis`. Diganti karena PT-16 juga mengizinkan koreksi skor manual.)*

- Untuk tahapan berstatus **`otomatis`** (PT-08 M4) maupun **`dinilai_manual`** (PT-16 K1). Tahapan `menunggu_manual` tidak dikoreksi, melainkan dinilai lewat 3.13.3 → `KOREKSI_TIDAK_DIIZINKAN`.
- **Hanya peneliti** (PT-18 R1). Guru → `BUKAN_PENELITI`.
- Koreksi adalah proses terpisah dari penilaian pertama (R3), sehingga tidak ditolak karena tahapan sudah dinilai orang lain. Penilai sebelumnya disimpan di `koreksi_skor.dinilai_oleh_sebelum`.
- `p_alasan` **wajib** dan tidak boleh kosong → jika kosong, `ALASAN_KOREKSI_KOSONG`.
- `p_skor_baru` 0 sampai skor maksimal tahapan, dan harus berbeda dari skor sekarang.
- Dalam satu transaksi: membuat baris `koreksi_skor` (skor lama, skor baru, status sebelumnya, alasan, penilai, waktu server, PT-16 K2), memperbarui tahapan menjadi `dinilai_manual` dengan `dinilai_oleh` = pengoreksi, menaikkan `versi`, lalu menghitung ulang skor soal dan total.
- `p_versi` dipakai agar dua koreksi bersamaan tidak saling menimpa (sama seperti 3.13.3).
- Tidak ada fungsi untuk mengubah atau menghapus riwayat koreksi (PT-16 K3).

**Keluaran:** `{ "terkoreksi": true, "skor_sebelum": 2, "skor_sesudah": 1 }`

#### 3.13.5 `cari_tahap_untuk_koreksi(p_filter)` [peneliti]

Untuk menemukan skor otomatis atau manual yang mungkin salah. Peneliti menelusuri tahapan berstatus `otomatis` atau `dinilai_manual` per soal atau per tes, **tanpa identitas siswa**. Bentuk filter ditetapkan saat implementasi. Guru tidak punya akses (PT-17 H1–H2).

#### 3.13.5a `riwayat_koreksi(p_hasil_tes_id, p_nomor_soal, p_nomor_tahap)` [peneliti]

Daftar koreksi suatu tahapan (skor lama → baru, alasan, `nama_tampilan` penilai, waktu). Hanya baca. Data lengkap untuk analisis tersedia di *view* `v_koreksi_skor` dan CSV peneliti.

#### 3.13.6 Galat penilaian

| Kode | Arti | Pesan untuk penilai |
|---|---|---|
| `BUKAN_PENILAI` | Pemanggil bukan penilai aktif (termasuk siswa) | "Halaman ini hanya untuk peneliti dan guru." |
| `SUDAH_DINILAI` | Tahapan sudah dinilai atau diubah orang lain (M5) | "Jawaban ini sudah dinilai. Muat ulang untuk melihat nilai terbaru." |
| `SKOR_DI_LUAR_RENTANG` | Skor < 0 atau > skor maksimal tahapan | "Skor harus antara 0 dan {maks}." |
| `BUKAN_PENELITI` | Guru memanggil fungsi khusus peneliti (koreksi, penelusuran skor, riwayat, data penelitian; PT-17) | "Fitur ini hanya untuk peneliti." |
| `ALASAN_KOREKSI_KOSONG` | Koreksi tanpa alasan (M4, PT-16 K2) | "Tuliskan alasan koreksi." |
| `KOREKSI_TIDAK_DIIZINKAN` | Tahapan masih `menunggu_manual` (harus dinilai, bukan dikoreksi) | "Jawaban ini belum dinilai. Nilai dulu dari antrean." |

#### 3.12.6 Galat tes

| Kode | Arti | Pesan untuk siswa |
|---|---|---|
| `TES_SUDAH_SELESAI` | Tes jenis itu sudah diselesaikan (PP-03) | "Kamu sudah menyelesaikan tes ini." |
| `TES_TIDAK_DITEMUKAN` | `p_hasil_tes_id` bukan milik siswa | "Tes tidak ditemukan." |

---

## 4. Galat RPC

Fungsi RPC memunculkan galat PostgreSQL dengan pesan berupa kode berikut. Frontend menerjemahkannya menjadi pesan untuk siswa.

| Kode | Arti | Pesan untuk siswa |
|---|---|---|
| `TIDAK_MASUK` | Tidak ada sesi atau siswa nonaktif | "Sesi berakhir. Silakan masuk lagi." |
| `SOAL_TIDAK_DITEMUKAN` | ID soal tidak ada atau tidak aktif | "Soal tidak ditemukan. Coba muat ulang." |
| `INPUT_TIDAK_VALID` | Parameter di luar rentang | "Ada isian yang belum sesuai." |
| `SESI_TIDAK_VALID` | Sesi kuis bukan milik siswa atau tidak ada | "Kuis tidak ditemukan." |
| `KUIS_SUDAH_SELESAI` | Menjawab pada kuis yang sudah ditutup | "Kuis ini sudah selesai." |
| `PETUNJUK_TIDAK_TERSEDIA` | Meminta petunjuk saat kuis | "Petunjuk tidak tersedia saat kuis." |
| `WAKTU_HABIS` | Menjawab kuis setelah `batas_waktu` | "Waktu kuis sudah habis. Jawabanmu sudah dikumpulkan." |
| `OPSI_TIDAK_VALID` | Kode opsi tidak ada pada soal pilihan ganda | "Pilihan jawaban tidak dikenal. Coba pilih lagi." |
| `BATAS_PERCOBAAN_KUIS` | Siswa sudah memakai 2 percobaan kuis (KF-13) | "Kamu sudah memakai 2 kesempatan kuis. Nilai tertinggimu tetap tersimpan." |
| `BANK_SOAL_KURANG` | Bank soal kuis belum memenuhi minimum per kombinasi (KF-14, total 40), atau ada nomor kisi-kisi (KF-21) yang tidak punya soal baru yang sesuai untuk siswa ini | "Kuis belum bisa dimulai karena bank soal belum mencukupi. Beri tahu gurumu." |

Galat jaringan ditampilkan dengan pesan "Koneksi internet terputus. Periksa koneksimu, lalu coba lagi." dan tombol **Coba lagi**.

---

## 5. Modul Logika Frontend

Fungsi murni tanpa akses DOM atau jaringan, sehingga mudah diuji dengan Vitest.

### 5.1 `src/logika/bungaTunggal.js`

Nama parameter fungsi memakai kata (sesuai kode Fase 3), sedangkan rumus memakai simbol resmi KF-03: `modal` = M, `bunga` = B, `sukuBunga` = p, `lama` (setelah diubah ke tahun) = t, `tabunganAkhir` = A.

| Fungsi | Masukan | Keluaran |
|---|---|---|
| `keTahun(lama, satuan)` | `satuan`: `'tahun'`, `'bulan'`, `'hari'` | t dalam tahun (banyak bulan ÷ 12, banyak hari ÷ `HARI_PER_TAHUN`) |
| `hitungBunga({ modal, sukuBunga, lama, satuan })` | `sukuBunga` = p, angka persen per tahun (6 untuk 6%) | B = M × (p/100) × t |
| `hitungTabunganAkhir({ modal, sukuBunga, lama, satuan })` | | A = M + B |
| `ubahSatuanWaktu(lama, dari, ke)` | satuan `'tahun'`, `'bulan'`, `'hari'` | contoh 18 bulan → 1,5 tahun |
| `bungaDariTabunganAkhir({ tabunganAkhir, modal })` | A ≥ M | B = A − M |
| `cariModal({ bunga, sukuBunga, lama, satuan })` | | M = B ÷ ((p/100) × t) |
| `cariModalDariTabunganAkhir({ tabunganAkhir, sukuBunga, lama, satuan })` | | M = A ÷ (1 + (p/100) × t) |
| `cariSukuBunga({ bunga, modal, lama, satuan })` | | p = (B × 100) ÷ (M × t) |
| `cariLama({ bunga, modal, sukuBunga, satuanHasil })` | | t = (B × 100) ÷ (M × p), dikonversi ke `satuanHasil` |
| `tabelPertumbuhan({ modal, sukuBunga, lama, satuan })` | | array `{ periode, bungaKumulatif, tabungan }` untuk tabel dan ilustrasi 3D (maksimal 24 baris) |

Konstanta `HARI_PER_TAHUN = 365` adalah **keputusan resmi KF-02** (1 tahun = 365 hari, dasar kalender), sesuai rumus t = banyak hari ÷ 365 pada notasi KF-03. Opsi `hariPerTahun` di setiap fungsi tetap ada di kode Fase 3, tetapi **aplikasi selalu memakai nilai bawaan 365** dan tidak boleh mengirim nilai lain. Nilai 360 hanya dipakai di tes untuk memastikan parameter berfungsi. Hasil Rupiah dibulatkan ke rupiah terdekat hanya saat ditampilkan (KF-09).

Masukan tidak valid memunculkan `GalatMasukan` (`src/logika/galat.js`) dengan `kode` dan pesan berbahasa Indonesia:

| `kode` | Kapan |
|---|---|
| `BUKAN_ANGKA` | Nilai bukan angka, kosong, NaN, atau Infinity |
| `NEGATIF` | Nilai negatif |
| `PEMBAGIAN_NOL` | Nilai 0 yang dipakai sebagai pembagi (misalnya suku bunga 0 saat mencari modal) |
| `SATUAN_TIDAK_DIKENAL` | Satuan bukan tahun, bulan, atau hari |
| `DI_LUAR_RENTANG` | Tabungan akhir < modal, atau lama 0 saat membuat tabel |
| `DITANYA_TIDAK_DIKENAL` | `ditanya` pada soal tidak dikenal |

### 5.2 `src/logika/parserAngka.js`

| Fungsi | Contoh |
|---|---|
| `uraiAngka(teks)` | `"Rp1.200.000"` → `1200000`; `"1200000"` → `1200000`; `"2,5"` → `2.5`; `"6%"` → `6`; `"abc"` → `null` |
| `formatRupiah(angka)` | `80000` → `"Rp80.000"` |
| `formatAngka(angka)` | `2.5` → `"2,5"` |

Aturan: titik = pemisah ribuan, koma = desimal (format Indonesia).

### 5.3 `src/logika/diagnosis.js`

| Fungsi | Keterangan |
|---|---|
| `hitungJawaban(soal)` | Menghitung kunci jawaban dari `diketahui` dan `ditanya`. Dipakai skrip *seed* untuk mengisi kolom `jawaban`. |
| `hitungPolaKesalahan(soal)` | Menerima `diketahui` dan `ditanya`, mengembalikan array `{ jenis, nilai, pesan }`. Dipakai skrip *seed* untuk mengisi kolom `pola_kesalahan`. Toleransi diambil dari `soal.toleransi` (bawaan kode Fase 3: 0,5). Sesuai KF-19, skrip *seed* **wajib** mengisi `toleransi` per satuan (Rupiah 1, persen/waktu 0,01) sebelum memanggil fungsi ini, sehingga nilai bawaan 0,5 tidak terpakai. |

Contoh untuk soal M = 2.000.000, p = 6%, lama = 8 bulan, ditanya bunga (jawaban 80.000):

| Jenis | Nilai pola | Cara salah |
|---|---|---|
| `SATUAN_WAKTU` | 960.000 | 2.000.000 × 6/100 × 8 |
| `PERSEN` | 8.000.000 | 2.000.000 × 6 × 8/12 |
| `TERTUKAR_BUNGA_TABUNGAN` | 2.080.000 | menjawab jumlah tabungan akhir (A) padahal ditanya besar bunga (B) |

Pola yang nilainya sama dengan jawaban benar atau sama dengan pola lain dibuang agar diagnosis tidak ambigu.
