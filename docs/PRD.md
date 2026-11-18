# PRD — Lanora

> **Catatan nama:** Lanora sebelumnya bernama **MathSave** (nama diganti 12 November 2026). Wawancara, keputusan, dan dokumen sebelum tanggal itu memakai nama MathSave. Pengenal teknis lama sengaja tidak diubah agar akun dan data siswa tetap aman: domain email internal `siswa.mathsave.invalid` dan `penilai.mathsave.invalid`, nama paket npm `mathsave`, kunci `mathsave:pesan-singkat`, komentar di file migrasi, dan nama folder proyek.

**Product Requirements Document**
Aplikasi pembelajaran Bunga Tunggal dan Tabungan untuk siswa SMP kelas VIII

| Item | Keterangan |
|---|---|
| Nama produk | Lanora |
| Pengembang | Eneng Wulan Sari (NIM 2225250197), Pendidikan Matematika |
| Konteks | Tugas mata kuliah Algoritma dan Pemrograman (Alpro) |
| Versi dokumen | 1.0 (tahap perencanaan) |
| Tanggal | 11 November 2026 |
| Sumber data kebutuhan | `referensi/HASIL WAWANCARA ALPRO.docx` (informan S01, wawancara 5 November 2026) |
| Dokumen terkait | [architecture.md](architecture.md), [design.md](design.md), [api.md](api.md), [task.md](task.md) |

---

## 1. Latar Belakang

Bunga tunggal dan tabungan adalah materi aritmetika sosial yang dekat dengan kehidupan sehari-hari. Namun, siswa masih kesulitan memilih rumus, mengubah satuan waktu, dan memahami soal cerita. Lanora dirancang sebagai aplikasi web yang nyaman dibuka di smartphone Android. Aplikasi ini membantu siswa belajar secara bertahap, berlatih, dan menerima umpan balik ketika jawabannya salah.

Rancangan aplikasi berpijak pada dua kerangka:

1. **Cognitive Load Theory (CLT)**: mengelola beban *intrinsic*, menekan beban *extraneous*, dan mendorong beban *germane*.
2. **Mathematical Literacy** (literasi matematis): kemampuan siswa untuk **merumuskan** masalah nyata ke bentuk matematika, **menerapkan** konsep dan prosedur, lalu **menafsirkan** hasilnya kembali ke konteks nyata.

## 2. Ringkasan Data Wawancara

### 2.1 Profil informan

| Item | Data dari dokumen |
|---|---|
| Kode informan | S01 |
| Kelas | VIII-C |
| Tanggal wawancara | 5 November 2026 |
| Pewawancara | Eneng Wulan Sari |
| Materi target | Bunga Tunggal dan Tabungan |

> **Keterbatasan data:** Wawancara hanya melibatkan **satu informan**. Temuan di bawah ini menggambarkan kebutuhan S01 dan belum tentu mewakili seluruh siswa kelas VIII. Lihat bagian 12 (Asumsi dan Hal yang Perlu Dikonfirmasi).

### 2.2 Temuan utama per bagian wawancara

Kutipan diringkas dari jawaban informan. Kode di kolom kiri adalah kode pertanyaan pada dokumen wawancara.

| Kode | Temuan (berdasarkan jawaban S01) |
|---|---|
| K01 | Awalnya sedikit bingung cara menghitung bunga. Pertama kali belajar materi ini dari YouTube karena guru tidak masuk. |
| K02 | Guru menjelaskan lewat contoh soal di papan tulis. Siswa memperhatikan, mencatat rumus, lalu mencoba mengerjakan soal. |
| K03 | Langsung mengenali rumus bunga tunggal dan jumlah tabungan akhir, tetapi **ragu pada soal cerita yang meminta modal atau waktu**. |
| IL01 | Paling sulit: **menentukan rumus yang tepat** dan **menghitung bunga jika waktu dalam bulan atau hari**. |
| IL02 | Perlu memikirkan modal awal, suku bunga, dan lama menabung, lalu menentukan rumus dan menghitung. |
| IL03 | Prasyarat: **operasi hitung, pecahan, persentase, dan perkalian**. |
| IL04 | Kesulitan naik ketika **informasi soal tidak lengkap** dan harus mencari nilai yang belum diketahui. |
| IL05 | Salah karena **kurang paham cara menggunakan rumus** atau **salah memasukkan angka**. |
| EL01 | Paham konsep, tetapi bingung jika soal **berkalimat panjang atau berbeda dari contoh**. |
| EL02 | Lebih mudah paham lewat **contoh soal, tabel, dan penjelasan guru**. **Gambar** sangat membantu. |
| EL03 | **Warna terlalu banyak atau animasi terlalu ramai** membuat tidak fokus. |
| EL04 | Penjelasan **terlalu cepat** membuat materi sulit dikuasai. |
| EL05 | Paling susah memahami **maksud cerita** dan **angka mana yang dipakai untuk menghitung apa**. |
| GL01 | Paling paham ketika **mengerjakan contoh soal bersama guru, lalu berlatih mandiri**. |
| GL02 | Memeriksa jawaban dengan **mengecek ulang hitungan dan ketepatan rumus**. |
| GL03 | Bantuan yang efektif: **petunjuk langkah demi langkah** dan **contoh soal yang mirip**. |
| GL04 | Pernah menjelaskan cara menghitung bunga tunggal ke teman dengan menunjukkan rumus dan langkah. |
| GL05 | Yang membantu mengerjakan soal baru: **memahami rumus, mengetahui langkah, dan sering berlatih**. |
| DS01 | Butuh **penjelasan materi yang mudah, contoh soal, latihan seperti kuis, dan penjelasan ulang untuk jawaban salah**. |
| DS02 | **Konsep, rumus, dan contoh soal dijelaskan perlahan**. **Latihan dikerjakan sendiri** agar mandiri. |
| DS03 | Aplikasi sebaiknya **tidak punya terlalu banyak animasi, warna berlebihan, atau informasi yang tidak berhubungan dengan materi**. |

## 3. Analisis Kebutuhan Berdasarkan Cognitive Load Theory

### 3.1 Intrinsic Cognitive Load (kerumitan materi itu sendiri)

Beban intrinsik muncul dari banyaknya unsur yang harus diolah bersamaan, yaitu modal, suku bunga, lama menabung, satuan waktu, dan pilihan rumus (IL02). Beban ini tidak bisa dihilangkan, tetapi bisa **diurutkan dan dipecah**.

| Sumber beban (bukti) | Strategi dalam aplikasi |
|---|---|
| Banyak unsur yang harus dipikirkan sekaligus (IL02) | Materi dipecah menjadi sub-bab kecil (P0, M1–M6). Satu sub-bab hanya membahas satu ide baru. |
| Memilih rumus yang tepat (IL01, IL05) | Panduan "**Apa yang ditanya?**" untuk memilih rumus. Rumus invers dikenalkan terpisah di M5. |
| Satuan waktu bulan/hari (IL01) | Sub-bab khusus M3 dan simulasi satuan waktu. |
| Prasyarat persen, pecahan, perkalian (IL03) | Pemanasan prasyarat opsional (P0) sebelum masuk materi. |
| Kesulitan naik saat informasi tidak lengkap (IL04, K03) | Soal disusun bertingkat: **Tingkat 1** (mencari bunga) → **Tingkat 2** (tabungan akhir, waktu bulan/hari) → **Tingkat 3** (mencari modal, suku bunga, atau waktu). |

### 3.2 Extraneous Cognitive Load (beban dari cara penyajian)

Beban ekstrinsik tidak membantu belajar dan **harus ditekan**.

| Sumber beban (bukti) | Strategi dalam aplikasi |
|---|---|
| Warna dan animasi berlebihan (EL03, DS03) | Palet terbatas: 1 warna utama, warna netral, dan warna status hanya untuk umpan balik. Tanpa animasi dekoratif. |
| Informasi yang tidak berhubungan dengan materi (DS03) | Satu layar berisi satu tujuan. Tanpa banner, maskot ramai, atau iklan. |
| Penjelasan terlalu cepat (EL04) | Siswa mengatur kecepatan sendiri dengan tombol **Lanjut** dan **Kembali**. Tidak ada slide otomatis. |
| Kalimat soal panjang atau berbeda dari contoh (EL01, EL05) | Panel **Pahami Soal**: siswa memilah informasi menjadi tabel *Diketahui* dan *Ditanya* sebelum menghitung. |
| Rumus terpisah dari angka (*split attention*) | Rumus ditampilkan berdampingan dengan substitusi angkanya pada langkah yang sama. |
| Salah memasukkan angka (IL05) | Kolom isian berlabel jelas (Modal, Suku bunga, Lama), format Rupiah otomatis, dan contoh format. |

### 3.3 Germane Cognitive Load (usaha membangun pemahaman)

Beban germane perlu **didorong** agar siswa membangun skema penyelesaian yang bisa dipakai di soal baru.

| Kebutuhan (bukti) | Strategi dalam aplikasi |
|---|---|
| Contoh bersama, lalu latihan mandiri (GL01, DS02) | Pola **contoh lengkap → contoh setengah jadi → soal mandiri** (*worked example fading*). |
| Petunjuk langkah demi langkah dan contoh mirip (GL03) | Petunjuk bertahap maksimal 3 tingkat di latihan (KF-15), ditambah pembahasan lengkap setelah jawaban diperiksa. Contoh soal yang mirip tersedia di contoh langkah demi langkah setiap sub-bab (F-03), tidak lagi sebagai tingkat petunjuk. |
| Cek kewajaran jawaban (GL02) | Langkah **Periksa** di setiap pembahasan, misalnya "Apakah bunga lebih kecil dari modal? Apakah satuannya Rupiah?" |
| Transfer ke cerita yang berbeda (GL05, EL01) | Satu konsep dilatih dengan beberapa konteks cerita (koperasi sekolah, bank, menabung untuk membeli barang). |
| Menjelaskan ke orang lain (GL04) | Opsi **"Jelaskan dengan kata-katamu"** setelah soal benar (pilihan, tidak dinilai). Prioritas *Could*. |
| Penjelasan jawaban salah (DS01, IL05) | Diagnosis jenis kesalahan dan penjelasan yang sesuai dengan kesalahannya. |

## 4. Rancangan untuk Mathematical Literacy

Setiap soal cerita dikerjakan dengan **4 langkah tetap** agar menjadi kebiasaan berpikir. Keempat langkah ini juga dipakai dalam pembahasan dan petunjuk.

| Langkah di aplikasi | Proses literasi matematis | Kebutuhan dari wawancara |
|---|---|---|
| **1. Pahami** — tentukan apa yang diketahui dan ditanya | Merumuskan (*formulate*) | EL05, EL01, IL02 |
| **2. Rencanakan** — pilih rumus yang sesuai, ubah satuan bila perlu | Merumuskan (*formulate*) | IL01, K03 |
| **3. Hitung** — substitusikan angka dan hitung | Menerapkan (*employ*) | IL05, IL03 |
| **4. Periksa** — apakah jawaban masuk akal dalam cerita? | Menafsirkan (*interpret*) | GL02 |

Selain itu, soal Tingkat 3 dapat memuat **keputusan sederhana**, misalnya membandingkan dua tawaran tabungan, agar siswa menafsirkan hasil hitungan dalam konteks nyata.

## 5. Tujuan Produk

1. Membantu siswa memahami konsep bunga tunggal dan tabungan secara bertahap, termasuk saat belajar tanpa guru (K01).
2. Mengurangi kesalahan memilih rumus dan mengubah satuan waktu (IL01, IL05).
3. Meningkatkan kemampuan siswa menyelesaikan soal cerita, termasuk mencari modal, suku bunga, dan waktu (K03, IL04).
4. Memberikan umpan balik yang menjelaskan **mengapa** jawaban salah (DS01).
5. Menyajikan tampilan sederhana yang tidak mengganggu fokus (EL03, DS03).

### Di luar cakupan versi 1

- Bunga majemuk, diskon, pajak, dan topik aritmetika sosial lain.
- Dasbor guru untuk memantau siswa (dicatat sebagai pengembangan berikutnya).
- Mode luring (offline) penuh.
- Aplikasi Android native (.apk). Versi 1 adalah aplikasi web yang responsif.

## 6. Pengguna

| Peran | Deskripsi | Kebutuhan utama |
|---|---|---|
| **Siswa** (pengguna utama) | Siswa SMP kelas VIII, memakai smartphone Android. *(KF-05f U10: pilihan kelas di aplikasi mencakup VII–XII sebagai kemampuan teknis saja. Sasaran penelitian tetap SMP kelas VIII.)* | Belajar bertahap, berlatih, mendapat petunjuk dan penjelasan, melihat perkembangan |
| **Pengelola** (peneliti/pengembang atau guru) | Mengumumkan kode kelas, mengatur daftar kelas, mendampingi pendaftaran, dan mengisi bank soal lewat skrip. *(Sejak KF-05f: siswa membuat akun sendiri dengan username. Peneliti tidak lagi membuat kode siswa `S001`, ….)* | Mengatur daftar kelas, mendampingi pendaftaran, mengelola soal, membantu reset PIN, menonaktifkan akun yang tidak semestinya |

### Persona (dibentuk dari data S01)

> **Siswa kelas VIII** yang sudah mengenal rumus bunga tunggal dan tabungan akhir, tetapi ragu saat soal cerita meminta modal atau waktu. Ia belajar paling baik dari contoh soal, tabel, dan gambar, lalu berlatih sendiri. Ia mudah kehilangan fokus jika tampilan terlalu ramai atau penjelasan terlalu cepat. Ia pernah belajar materi ini dari YouTube saat guru tidak hadir.

## 7. Daftar Kebutuhan (Hasil Wawancara)

Kode **KB** dipakai di seluruh dokumen untuk menelusuri kebutuhan sampai ke fitur.

| Kode | Kebutuhan | Sumber | Jenis beban CLT |
|---|---|---|---|
| KB-01 | Penjelasan bertahap yang kecepatannya diatur siswa | EL04, DS02 | Extraneous |
| KB-02 | Bantuan memilih rumus yang tepat | IL01, IL05, K03 | Intrinsic |
| KB-03 | Bantuan menghitung bunga dengan waktu dalam bulan atau hari | IL01 | Intrinsic |
| KB-04 | Latihan mencari nilai yang belum diketahui (modal, suku bunga, waktu) | K03, IL04 | Intrinsic |
| KB-05 | Bantuan memahami maksud soal cerita dan memilah angka | EL01, EL05 | Extraneous |
| KB-06 | Penguatan prasyarat: operasi hitung, pecahan, persentase, perkalian | IL03 | Intrinsic |
| KB-07 | Penyajian lewat contoh soal, tabel, dan gambar | EL02, K02 | Extraneous |
| KB-08 | Tampilan tanpa warna berlebihan, animasi ramai, atau informasi tidak relevan | EL03, DS03 | Extraneous |
| KB-09 | Petunjuk langkah demi langkah dan contoh soal yang mirip | GL03 | Germane |
| KB-10 | Penjelasan ulang ketika jawaban salah | DS01, IL05 | Germane |
| KB-11 | Contoh terbimbing, lalu latihan mandiri dan kuis | GL01, DS01, DS02 | Germane |
| KB-12 | Kebiasaan memeriksa kewajaran jawaban | GL02 | Germane |
| KB-13 | Variasi konteks cerita agar bisa mengerjakan soal baru | GL05, EL01 | Germane |
| KB-14 | Kesempatan menjelaskan cara penyelesaian dengan kata sendiri | GL04 | Germane |
| KB-15 | Bisa dipakai belajar mandiri tanpa guru | K01 | — |
| KB-16 | Mengurangi kesalahan memasukkan angka | IL05 | Extraneous |

Kebutuhan berikut **bukan berasal dari wawancara**, melainkan dari ketentuan tugas atau dosen:

| Kode | Kebutuhan | Sumber |
|---|---|---|
| KT-01 | Login menggunakan kode siswa. *Penerapan (KF-05, 12 November 2026): kode siswa + PIN. Diubah oleh pengembang (KF-05f, 12 November 2026): username buatan siswa + PIN, dengan kode kelas `230706` saat pendaftaran.* | Ketentuan tugas |
| KT-02 | Riwayat dan perkembangan belajar | Ketentuan tugas |
| KT-03 | Database dan hosting dengan Supabase. *Penerapan (KF-01, 12 November 2026): database, autentikasi, dan Edge Function di Supabase. Halaman web (frontend) di Netlify Free, karena Supabase Free tidak bisa menyajikan halaman HTML.* | Arahan dosen |
| KT-04 | Three.js hanya untuk ilustrasi 3D pendukung | Ketentuan tugas |
| KT-05 | Seluruh tampilan berbahasa Indonesia dan responsif di Android | Ketentuan tugas |

## 8. Fitur dan Kebutuhan Fungsional

Prioritas memakai metode MoSCoW: **M** = Must, **S** = Should, **C** = Could.

| Kode | Fitur | Memenuhi | Prioritas |
|---|---|---|---|
| F-01 | Daftar dan masuk dengan username dan PIN (KF-05f; sebelumnya kode siswa dan PIN) | KT-01 | M |
| F-02 | Materi bertahap (termasuk pemanasan prasyarat) | KB-01, KB-06, KB-07, KB-15 | M |
| F-03 | Rumus dan contoh soal langkah demi langkah | KB-02, KB-03, KB-07, KB-11, KB-12 | M |
| F-04 | Simulasi perhitungan bunga tunggal dan tabungan (dengan ilustrasi 3D pendukung) | KB-03, KB-07, KT-04 | M (3D: S) |
| F-05 | Soal cerita kontekstual dengan panel Pahami Soal | KB-05, KB-13 | M |
| F-06 | Latihan soal bertingkat | KB-04, KB-11, KB-13 | M |
| F-07 | Kuis | KB-11 | M |
| F-08 | Petunjuk bertahap | KB-09 | M |
| F-09 | Penjelasan kesalahan | KB-10, KB-16 | M |
| F-10 | Riwayat dan perkembangan belajar | KT-02 | M |
| F-11 | Jelaskan dengan kata-katamu | KB-14 | C |
| F-12 | Pretest dan posttest Mathematical Literacy (instrumen penelitian) | KF-05e | M |

### F-01 Daftar dan masuk dengan username dan PIN

**Keputusan KF-05f (12 November 2026): akun username dan pilihan kelas.** Keputusan ini menggantikan pemakaian kode siswa `S001` dari KF-05 dan KF-05d. Aturan lain yang tidak disebut di sini tetap berlaku. *Status: keputusan disetujui, implementasi belum dikerjakan (task.md Fase 5A, Tahap 2–7). Kode aplikasi saat ini masih memakai kode siswa sampai Fase 5A diterapkan.*

| No | Aturan |
|---|---|
| U1 | **Pendaftaran:** isi kode kelas utama `230706` → pilih kelas → buat username → buat PIN → konfirmasi PIN → akun dibuat dan siswa langsung masuk ke Beranda. |
| U2 | **Login:** username + PIN. Kode siswa seperti `S001` **tidak lagi diminta** saat pendaftaran maupun login. |
| U3 | Username **unik secara global** (seluruh aplikasi), dijaga batasan `UNIQUE` di database, bukan hanya oleh aplikasi. |
| U4 | Username **disimpan dalam huruf kecil**. Huruf besar diubah otomatis, sehingga `Rani` dan `rani` dianggap username yang sama. |
| U5 | Username **sekaligus nama tampilan**, misalnya pada sapaan di Beranda. |
| U6 | Siswa **memilih kelas** dari jenjang **VII–XII** (SMP dan SMA/SMK). Daftar kelas **diatur peneliti** dan tidak dikunci permanen di kode aplikasi. |
| U7 | Kode kelas utama **tetap `230706`** (D1 tetap berlaku). |
| U8 | **Akun dan data belajar lama tetap dipertahankan.** Jika ada akun berbasis kode siswa, akun itu diberi username lewat migrasi/skrip tanpa memutus data belajarnya. |
| U9 | **Batas pendaftaran per IP:** maksimal **60 akun baru** dan **20 kesalahan kode kelas** per IP per jam. |
| U10 | **Sasaran penelitian tetap SMP kelas VIII.** Pilihan kelas VII–XII hanya perluasan kemampuan teknis aplikasi, bukan cakupan penelitian. |

**Aturan username** (rincian teknis yang disetujui bersama KF-05f):

- 3–20 karakter, hanya huruf `a–z`, angka `0–9`, dan garis bawah `_`, serta **diawali huruf**.
- Spasi di tepi dibuang, dan huruf besar diubah ke huruf kecil sebelum diperiksa dan disimpan (U4).
- Kata yang menyerupai peran atau merek tidak boleh dipakai, misalnya `admin`, `guru`, `peneliti`, dan `lanora`. Daftar lengkapnya disimpan di kode server.
- Petunjuk di layar Daftar: "Username juga tampil sebagai namamu. Jangan pakai nama lengkap atau nomor HP."

**Status aturan lama setelah KF-05f:**

| Aturan lama | Status |
|---|---|
| L1 (kode siswa unik) | **Diganti** U3 (username unik) |
| L2 (PIN untuk masuk), L4 (tanpa email pribadi), L5, L6, L8 | **Tetap** |
| L3 (kode siswa dari peneliti) | **Tidak berlaku.** Siswa membuat akunnya sendiri. |
| L7 (tidak membocorkan informasi) | **Tetap untuk login.** Pesannya menjadi "Username atau PIN salah. Periksa kembali, atau tanyakan ke gurumu." **Pengecualian yang disengaja:** saat mendaftar, siswa diberi tahu "Username sudah dipakai", karena U3 tidak bisa dipenuhi tanpa pesan ini. Pesan ini hanya muncul setelah kode kelas benar, dan dibatasi U9 (RS-04). |
| K1–K10 (penguncian 5 kali gagal → 5 menit) | **Diperbarui 12 November 2026:** dihitung **per username** dan **bertingkat** (kunci ke-1 = 5 menit, ke-2 = 15 menit, ke-3 dst. = 60 menit). Lihat "Pembaruan penguncian" di bawah. Username yang tidak terdaftar juga "terkunci" dengan cara yang sama. |
| K5 (batas IP opsional) | Untuk **pendaftaran**, kini diisi U9. Untuk **login**, **diperbarui 12 November 2026:** 100 kegagalan per jam per IP, hanya jika IP berasal dari sumber tepercaya. Ambang ini tidak mengunci satu Wi-Fi sekolah (diuji: 30 siswa × 2 kesalahan). |
| P1–P6 (aturan PIN) | **Tetap.** P4 (PIN ≠ kode kelas) diperiksa di server setelah kode kelas terbukti benar. |
| D1 (kode kelas `230706`) | **Tetap** (U7) |
| D2–D7 (kode siswa, format `S001`, dibagikan peneliti, tidak tertukar) | **Tidak berlaku** |
| R1–R6 (lupa PIN) | **Tetap.** Layar Buat PIN baru meminta **username + kode reset**, dan guru/peneliti mereset berdasarkan username. |
| RS-01 (penguncian sengaja) | **Tetap**, kini oleh orang yang mengetahui username siswa lain |
| RS-02 (akun didaftarkan lebih dulu oleh orang lain) | **Tidak berlaku**, karena tidak ada lagi akun yang disiapkan lebih dulu. Diganti RS-03 sampai RS-05. |

**Risiko baru** (dicatat 12 November 2026):

- **RS-03, akun dibuat bebas.** Siapa pun yang mengetahui kode kelas bisa membuat akun, termasuk akun ganda milik satu siswa (misalnya karena lupa PIN lalu membuat akun baru). Penanganan: batas U9, pendaftaran didampingi peneliti, teks "Sudah pernah daftar? Masuk saja, atau minta reset PIN ke gurumu." di layar Daftar, dan peneliti dapat menonaktifkan akun yang tidak semestinya (`siswa.aktif = false`, tanpa menghapus data).
- **RS-04, keberadaan username bisa diketahui** lewat pesan "Username sudah dipakai". Penanganan: pesan hanya muncul setelah kode kelas benar, batas U9, dan pesan login tetap seragam.
- **RS-05, pemetaan identitas penelitian.** Kelas dipilih sendiri dan tidak diverifikasi, dan sistem tidak menyimpan nama asli. Penanganan: saat sesi pendaftaran yang didampingi, siswa menuliskan username-nya di daftar hadir yang disimpan peneliti **di luar sistem**. Pemasangan pretest–posttest tetap memakai `siswa.id`, sehingga tidak terpengaruh. Kaitannya dengan PT-11 (identitas di CSV) dicatat di F-12.

**Hasil pemeriksaan akun lama (Tahap 0, 12 November 2026, read-only):** Supabase Auth berisi **0 pengguna**, dan tabel `siswa` berisi **0 baris**. Karena setiap baris data belajar wajib merujuk `siswa`, belum ada data belajar. Jadi saat ini **tidak ada akun lama yang perlu dimigrasikan**. Rancangan tetap mendukung akun lama (U8), seandainya ada akun yang dibuat sebelum Fase 5A diterapkan.

---

*Rancangan sebelumnya di bawah ini (KF-05 sampai KF-05d) tetap dicatat sebagai riwayat penelitian. Bagian yang bertentangan dengan KF-05f mengikuti tabel "Status aturan lama" di atas.*

**Keputusan KF-05 (12 November 2026): login memakai Kode Siswa + PIN.**

| No | Aturan |
|---|---|
| L1 | Setiap siswa memiliki **kode siswa yang unik**. |
| L2 | Setiap siswa memiliki **PIN** untuk masuk ke Lanora. |
| L3 | **Kode siswa** diberikan oleh peneliti sebelum uji coba. *(Diperbarui oleh KF-05d, 12 November 2026: PIN **tidak** lagi diberikan peneliti. PIN dibuat sendiri oleh siswa saat pendaftaran pertama. Lihat "Kode kelas, kode siswa, dan pendaftaran pertama" di bawah.)* |
| L4 | Siswa **tidak memakai email pribadi** untuk login. |
| L5 | Setiap siswa **hanya dapat mengakses akun dan data belajarnya sendiri**. |
| L6 | PIN **tidak disimpan sebagai teks biasa**. PIN disimpan secara aman dengan *hashing* (architecture.md bagian 5). |
| L7 | Jika kode siswa atau PIN salah, tampil **pesan yang jelas tanpa membocorkan informasi sensitif**: aplikasi tidak memberi tahu bagian mana yang salah atau apakah kode itu terdaftar. |
| L8 | Login mendukung penyimpanan hasil **latihan, kuis, pretest, dan posttest** sesuai akun masing-masing siswa. *(Sejak KF-05e, 12 November 2026: pretest dan posttest dikerjakan di dalam aplikasi, lihat F-12.)* |

Perilaku di layar Masuk:

- Siswa mengisi **Kode siswa** (format `S001`, KF-05d) dan **PIN** pribadinya. Kode kelas **tidak** diminta saat login biasa.
- Kode tidak membedakan huruf besar dan kecil. Spasi dan tanda hubung diabaikan.
- Kolom PIN **selalu disamarkan** (••••••) dan tidak bisa ditampilkan terbuka (KF-05a P5). Kolom hanya menerima angka, maksimal 6 digit.
- Jika kode atau PIN salah, pesannya **selalu sama**: "Kode siswa atau PIN salah. Periksa kembali, atau tanyakan ke gurumu." (L7)
- Percobaan masuk yang gagal dibatasi **per akun siswa** untuk mencegah tebak-tebakan PIN (KF-05b, lihat "Batas percobaan login" di bawah).

**Batas percobaan login** (KF-05b, diputuskan 12 November 2026)

| No | Aturan |
|---|---|
| K1 | Maksimal **5 kali percobaan login gagal** untuk setiap akun siswa. |
| K2 | Setelah 5 kali gagal, akun **dikunci sementara selama 5 menit**. |
| K3 | Pembatasan utama dihitung **berdasarkan akun siswa** (kode siswa yang dicoba), bukan hanya alamat IP. |
| K4 | Kesalahan login satu siswa **tidak boleh** membuat akun siswa lain terkunci. |
| K5 | Pembatasan tambahan berdasarkan IP **boleh** diterapkan, tetapi **tidak boleh** mengunci seluruh siswa yang memakai Wi-Fi sekolah yang sama. |
| K6 | Setelah 5 menit, siswa **dapat mencoba login kembali**. |

Penerapan:

- **Cara menghitung** (keputusan tambahan KF-05b, dikonfirmasi pengembang 12 November 2026):

  | No | Aturan |
  |---|---|
  | K7 | Kegagalan dihitung **berurutan**. |
  | K8 | Jika login **berhasil**, penghitung kembali ke **0**. |
  | K9 | Setelah masa penguncian 5 menit **berakhir**, penghitung kembali ke **0**. |
  | K10 | Penguncian dimulai pada **kegagalan ke-5**. Kegagalan ke-5 itu sendiri masih dijawab "Kode siswa atau PIN salah", dan percobaan berikutnya selama 5 menit dijawab "Terlalu banyak percobaan masuk". |

  Masa kunci dihitung dari **waktu server**.
- **Selama terkunci**, semua percobaan untuk akun itu ditolak, **termasuk jika PIN-nya benar**, dan tidak menambah atau memperpanjang masa kunci.
- **Tidak membocorkan informasi (KF-05 L7):** kode siswa yang **tidak terdaftar** diperlakukan sama persis, yaitu juga "terkunci" setelah 5 kali gagal selama 5 menit. Dengan begitu, penguncian tidak bisa dipakai untuk menebak kode mana yang terdaftar.
- **Pesan saat terkunci:** "Terlalu banyak percobaan masuk. Tunggu 5 menit, lalu coba lagi." Pesan tidak menyebut apakah kode benar, PIN salah, atau sisa percobaan.
- **Batas IP tambahan (K5)** bersifat opsional. Jika dipakai, ambangnya harus jauh di atas pemakaian normal satu sekolah, dan wajib lolos uji "satu kelas login bersamaan dari satu Wi-Fi". Angka ambang dicatat saat implementasi Fase 5.
- **Pembaruan penguncian (diputuskan pengembang 12 November 2026, migrasi `…0006`):** untuk mengurangi penebakan PIN yang disebar ke banyak username, penguncian per username menjadi **bertingkat**: kegagalan ke-5 berurutan mengunci 5 menit (kunci ke-1), 15 menit (ke-2), lalu 60 menit (ke-3 dan seterusnya). Tingkat kembali 0 setelah login berhasil, setelah reset PIN oleh guru/peneliti, atau setelah 24 jam tanpa percobaan. K6 dan K9 berlaku per masa kunci: setelah masa kunci berakhir, penghitung kegagalan kembali 0, tetapi tingkatnya tetap. Ditambah batas **100 login gagal per jam per IP** (K5) jika IP berasal dari sumber tepercaya. Pesan saat terkunci menjadi "Terlalu banyak percobaan. Tunggu beberapa menit, lalu coba lagi." tanpa menyebut lama kunci (L7). Rincian teknis di api.md 2e.8.
- **Risiko yang diterima untuk sementara** (RS-01, dikonfirmasi pengembang 12 November 2026): orang yang mengetahui kode siswa lain bisa sengaja membuat akun itu terkunci selama 5 menit. Risiko ini **diterima sementara**, karena dampaknya dibatasi oleh durasi kunci yang singkat (K6) dan siswa hanya perlu menunggu. Risiko ini ditinjau ulang setelah uji coba dengan siswa (task.md Fase 13). Tidak ada perubahan aturan sampai ada keputusan baru.
- Sesi tetap tersimpan di perangkat sampai siswa memilih **Keluar**.
- Semua data (latihan, kuis, riwayat) tersimpan pada akun siswa dan dijaga oleh Row Level Security berdasarkan akun yang masuk (L5, L8).

**Detail yang belum ditentukan** (dicatat sebagai hal yang perlu dikonfirmasi, bukan keputusan):

| Kode | Pertanyaan |
|---|---|
| KF-05a | ✅ **Diputuskan 12 November 2026.** PIN tepat 6 digit angka, dibuat siswa saat pendaftaran pertama, diketik dua kali untuk konfirmasi, tidak boleh sama dengan kode kelas `230706`, tidak ditampilkan terbuka, dan disimpan sesuai L6. Rincian di "Aturan PIN" di bawah. |
| KF-05b | ✅ **Diputuskan 12 November 2026.** Maksimal 5 kali gagal per akun siswa, lalu akun dikunci 5 menit. Batas utama per akun, bukan hanya per IP. Satu siswa tidak membuat siswa lain terkunci. Batas IP tambahan opsional dan tidak boleh mengunci satu Wi-Fi sekolah. Setelah 5 menit, siswa bisa mencoba lagi. Rincian di "Batas percobaan login" di atas. *(Aturan lama 10 kali per IP per 15 menit tidak berlaku lagi.)* **Detail tambahan (dikonfirmasi 12 November 2026):** penghitungan berurutan, kembali ke 0 setelah login berhasil atau setelah masa kunci berakhir, dan penguncian dimulai pada kegagalan ke-5 (K7–K10). Risiko penguncian sengaja oleh orang yang mengetahui kode siswa diterima sementara (RS-01). **Detail KF-05b selesai.** |
| KF-05c | ✅ **Diputuskan 12 November 2026.** Siswa yang lupa PIN menghubungi guru atau peneliti, yang membantu reset. Setelah reset, siswa membuat PIN baru sendiri dengan akun yang sama, dan seluruh data belajar tetap tersimpan. Tidak ada fitur "Lupa PIN" mandiri. Rincian di "Lupa PIN" di bawah. |
| KF-05d | ✅ **Diputuskan 12 November 2026.** Kode akses kelas `230706`. Kode siswa unik berformat `S001`, `S002`, `S003`, dan seterusnya, dibuat dan dibagikan peneliti. PIN dibuat sendiri oleh siswa saat pendaftaran pertama. Kode kelas dan kode siswa punya fungsi berbeda. Login berikutnya memakai kode siswa + PIN. Rincian di "Kode kelas, kode siswa, dan pendaftaran pertama" di bawah. |
| KF-05e | ✅ **Diputuskan 12 November 2026.** Pretest dan posttest Mathematical Literacy dikerjakan **di dalam Lanora**, memakai empat soal instrumen penelitian (tugas Pak Aan), dengan skor maksimal 6 per soal dan total 24. Detail pelaksanaan sudah diputuskan di **PP-01 sampai PP-10**, sedangkan pertanyaan teknis yang tersisa ada di **PT-01 sampai PT-13** (F-12). |
| KF-05f | ✅ **Diputuskan 12 November 2026.** Akun dibuat sendiri oleh siswa: kode kelas `230706` → pilih kelas VII–XII (daftar diatur peneliti) → username unik global (huruf kecil, sekaligus nama tampilan) → PIN + konfirmasi. Login memakai username + PIN. Kode siswa tidak dipakai lagi. Batas 60 akun baru dan 20 kesalahan kode kelas per IP per jam. Akun dan data lama dipertahankan. Sasaran penelitian tetap SMP kelas VIII. Rincian di awal F-01. |

**Aturan PIN** (KF-05a, diputuskan 12 November 2026)

| No | Aturan |
|---|---|
| P1 | PIN terdiri dari **tepat 6 digit angka** (0–9). |
| P2 | PIN **dibuat sendiri oleh siswa** saat pendaftaran pertama (sama dengan KF-05d D5). |
| P3 | Siswa memasukkan PIN **dua kali** untuk konfirmasi. |
| P4 | PIN **tidak boleh sama** dengan kode kelas `230706`. |
| P5 | PIN **tidak ditampilkan secara terbuka** saat dimasukkan. |
| P6 | PIN **tidak disimpan sebagai teks biasa**, mengikuti KF-05 L6 (HMAC + bcrypt Supabase Auth, tanpa kolom PIN). |

Penerapan pada setiap alur:

| Aturan | Pendaftaran pertama (KF-05d) | Login | Membuat PIN baru setelah reset (KF-05c) |
|---|---|---|---|
| P1: tepat 6 digit | ✅ diperiksa di perangkat dan di server | Diperiksa di perangkat sebelum dikirim. Di server, PIN yang tidak 6 digit langsung dijawab `MASUK_GAGAL`. | ✅ diperiksa di perangkat dan di server |
| P3: diketik dua kali | ✅ | — (cukup sekali) | ✅ |
| P4: ≠ kode kelas | ✅ diperiksa **hanya di server** | — (PIN yang tersimpan tidak mungkin sama dengan kode kelas) | ✅ diperiksa **hanya di server** |
| P5: tersamar | ✅ | ✅ | ✅ |
| P6: penyimpanan aman | ✅ | (hanya dibandingkan oleh Supabase Auth) | ✅ |

Ketentuan teknis turunan:

- PIN diperlakukan sebagai **teks 6 karakter**, bukan bilangan, sehingga angka 0 di depan tetap berlaku. Contoh: `012345` adalah PIN yang sah dan tidak sama dengan `12345`.
- Pemeriksaan P4 **hanya di server**: PIN dibandingkan dengan *secret* `KODE_KELAS_HASH`. Nilai `230706` **tidak boleh** ditulis di kode frontend, karena hasil build bisa dibaca siapa pun.
- Pesan kesalahan bentuk PIN, termasuk "PIN tidak boleh sama dengan kode kelas", hanya dikirim server **setelah** kode kelas + kode siswa (pendaftaran) atau kode siswa + kode reset (reset) terbukti valid, sesuai L7.
- Kekuatan PIN: 6 digit menghasilkan 1.000.000 kemungkinan. Dengan batas 5 kali gagal per 5 menit per akun (KF-05b), menebak PIN secara acak membutuhkan waktu yang sangat lama.
- Larangan PIN yang mudah ditebak selain kode kelas, misalnya `000000` atau `123456`, **tidak** termasuk keputusan KF-05a, sehingga tidak diterapkan.

**Kode kelas, kode siswa, dan pendaftaran pertama** (KF-05d, diputuskan 12 November 2026)

| No | Aturan |
|---|---|
| D1 | **Kode akses kelas** adalah `230706`. |
| D2 | Setiap siswa memiliki **kode siswa yang unik**. |
| D3 | Format kode siswa: **`S001`, `S002`, `S003`, dan seterusnya**. |
| D4 | Kode siswa **dibuat dan dibagikan oleh peneliti**. |
| D5 | **PIN dibuat sendiri oleh siswa saat pendaftaran pertama** (menggantikan bagian PIN di L3). |
| D6 | Kode kelas dan kode siswa memiliki **fungsi berbeda dan tidak boleh tertukar**. |
| D7 | **Login berikutnya** memakai **kode siswa + PIN pribadi**, tanpa kode kelas. |

**Perbedaan kedua kode** (D6, dikonfirmasi pengembang 12 November 2026):

| | Kode akses kelas | Kode siswa |
|---|---|---|
| Nilai/format | `230706` (6 angka, sama untuk satu kelas) | `S` + nomor urut, misalnya `S001` (unik per siswa) |
| Fungsi | Membuktikan bahwa siswa adalah peserta kelas uji coba | Menunjukkan akun siswa yang mana |
| Dipakai saat | **Hanya pendaftaran pertama** | Pendaftaran pertama, setiap login, dan membuat PIN baru setelah reset (KF-05c) |
| Siapa yang tahu | Seluruh siswa kelas uji coba | Siswa pemilik akun dan peneliti |

Agar tidak tertukar:

- Layar pendaftaran memakai dua kolom terpisah dengan label jelas, yaitu **Kode kelas** dan **Kode siswa**, beserta contoh formatnya.
- Server menolak isian yang formatnya tertukar, misalnya `230706` diisi di kolom kode siswa, atau `S001` di kolom kode kelas. Pesannya tetap seragam dan tidak membocorkan informasi (L7).
- Kode siswa dinormalisasi: huruf kecil `s001` dianggap `S001`, dan spasi diabaikan.

**Alur pendaftaran pertama** (sekali per akun):

1. Peneliti membuat akun untuk setiap siswa (`S001`, `S002`, …) **tanpa PIN**, lalu membagikan kode siswa masing-masing dan mengumumkan kode kelas.
2. Siswa membuka layar **Daftar pertama kali**, lalu mengisi kode kelas, kode siswa, dan PIN baru (diketik dua kali).
3. Jika kode kelas benar, kode siswa terdaftar, dan akun itu **belum pernah didaftarkan**, PIN disimpan secara aman (L6) dan siswa langsung masuk.
4. Setelah itu, siswa selalu masuk dengan **kode siswa + PIN** (D7).
5. Akun yang sudah terdaftar **tidak bisa didaftarkan ulang**. Jika lupa PIN, siswa memakai prosedur reset KF-05c.

**Pendampingan pendaftaran pertama** (dikonfirmasi pengembang): pendaftaran pertama dilakukan **bersama-sama di kelas dengan pendampingan peneliti**, agar setiap siswa mendaftarkan akunnya sendiri.

**Risiko RS-02 (dicatat 12 November 2026):** karena kode siswa berurutan dan kode kelas diketahui satu kelas, seseorang bisa mendaftar lebih dulu di akun siswa lain yang belum mendaftar. Penanganannya:

- pendaftaran pertama didampingi peneliti (di atas);
- akun yang sudah terdaftar tidak bisa didaftarkan ulang;
- jika akun ternyata didaftarkan orang lain, peneliti melakukan reset KF-05c, lalu pemilik akun membuat PIN sendiri.

Format kode tidak diubah, dan RS-02 ditinjau ulang setelah uji coba. Catatan terkait RS-01: kode yang berurutan juga memudahkan orang menebak kode untuk penguncian sengaja. Hal ini ikut ditinjau saat RS-01 ditinjau ulang. Keputusan RS-01 tidak diubah.

**Penyimpanan kode kelas:** nilai `230706` boleh ditulis di dokumen perencanaan dengan syarat **repositori GitHub privat** (dikonfirmasi pengembang). Di aplikasi, kode kelas **tidak boleh** ada di frontend atau hasil build Netlify, dan hanya diperiksa di server (architecture.md bagian 5).

Bentuk PIN sudah diputuskan di KF-05a (6 digit angka, lihat "Aturan PIN" di atas). Yang masih terbuka: kode kelas jika ada lebih dari satu kelas (bergantung KF-07). Saat ini hanya satu kode kelas yang ditetapkan.

**Lupa PIN** (KF-05c, diputuskan 12 November 2026)

| No | Aturan |
|---|---|
| R1 | Siswa yang lupa PIN **menghubungi guru atau peneliti**. |
| R2 | Guru atau peneliti **membantu melakukan reset PIN**. |
| R3 | Setelah reset, **siswa membuat PIN baru sendiri**. |
| R4 | Siswa tetap memakai **akun yang sama**, tanpa membuat akun baru. |
| R5 | **Seluruh data belajar** sebelumnya (latihan, kuis, riwayat) **tetap tersimpan** dan tidak terhapus akibat reset. |
| R6 | **Tidak ada fitur "Lupa PIN" mandiri** yang bisa dipakai tanpa bantuan guru atau peneliti. |

Alur (rancangan teknis di architecture.md bagian 5):

1. Siswa memberi tahu guru atau peneliti bahwa ia lupa PIN.
2. Guru atau peneliti memastikan identitas siswa secara langsung, lalu menjalankan reset. Sistem memberikan **kode reset sementara** untuk siswa itu, dan PIN lama langsung tidak berlaku.
3. Guru atau peneliti memberikan kode reset itu **langsung kepada siswa**.
4. Di layar **Buat PIN baru**, siswa mengisi kode siswa, kode reset, dan PIN baru (diketik dua kali). *(KF-05f: **username** menggantikan kode siswa.)*
5. Jika valid, PIN baru tersimpan secara aman (KF-05 L6), kode reset tidak bisa dipakai lagi, dan siswa langsung masuk ke akun lamanya dengan semua data utuh (R4, R5).

Ketentuan keamanan:

- Reset hanya bisa **dimulai** oleh guru atau peneliti yang berwenang, tidak pernah oleh siswa sendiri (R6).
- Layar Buat PIN baru **tidak berguna tanpa kode reset** dari guru atau peneliti, jadi tidak termasuk fitur "Lupa PIN" mandiri.
- Kode reset hanya untuk satu siswa, **sekali pakai**, dan **punya masa berlaku**.
- Kesalahan di layar Buat PIN baru memakai pesan seragam yang tidak membocorkan informasi (KF-05 L7), dan percobaannya ikut dibatasi.
- PIN baru mengikuti aturan yang sama dengan PIN awal (KF-05a): tepat 6 digit angka, diketik dua kali, tidak sama dengan kode kelas, dan tersamar.

Detail teknis yang belum ditentukan dicatat sebagai **tugas implementasi Fase 5** (task.md), bukan keputusan: bentuk dan masa berlaku kode reset, cara guru menjalankan reset (skrip di komputer peneliti atau halaman khusus pengelola), apakah sesi lama di perangkat lain ikut dikeluarkan, apakah reset juga mengakhiri kunci KF-05b, dan batas percobaan di layar Buat PIN baru.

### F-02 Materi bertahap

Urutan sub-bab:

| ID | Sub-bab | Isi utama |
|---|---|---|
| P0 | Pemanasan (opsional) | Persen ke pecahan/desimal, perkalian bilangan besar, pecahan bulan/tahun |
| M1 | Mengenal tabungan dan bunga | Istilah dan simbol: modal awal (M), besar bunga (B), suku bunga per tahun (p), lama menabung (t), jumlah tabungan akhir (A). Disertai gambar. |
| M2 | Rumus bunga tunggal (waktu dalam tahun) | B = M × (p/100) × t |
| M3 | Waktu dalam bulan dan hari | Ubah dulu ke tahun: t = banyak bulan ÷ 12, atau t = banyak hari ÷ 365 (KF-02). Lalu B = M × (p/100) × t. |
| M4 | Jumlah tabungan akhir | A = M + B |
| M5 | Mencari nilai yang belum diketahui | Mencari M, p, atau t dari B atau A (rumus di tabel notasi di bawah) |
| M6 | Strategi soal cerita | 4 langkah: Pahami → Rencanakan → Hitung → Periksa |

**1 tahun = 365 hari** (dasar kalender), sesuai keputusan KF-02 (12 November 2026). Tahun kabisat tidak dibedakan: 1 tahun selalu dihitung 365 hari di seluruh aplikasi (materi, soal, Simulasi, pembahasan).

**Notasi dan istilah resmi** (KF-03, diputuskan 12 November 2026)

Simbol dan istilah di bawah dipakai **sama persis** di materi, contoh soal, petunjuk, pembahasan, pesan kesalahan, dan Simulasi.

| Simbol | Istilah | Satuan | Penjelasan untuk siswa |
|---|---|---|---|
| **M** | Modal awal | Rupiah | Uang yang pertama kali ditabung |
| **B** | Besar bunga | Rupiah | Tambahan uang dari bank atau koperasi |
| **p** | Suku bunga per tahun | persen (%) | Persen bunga dalam **satu tahun**. Contoh: 6% per tahun ditulis p = 6. |
| **t** | Lama menabung | **tahun** | Lama uang ditabung. Jika diketahui dalam bulan atau hari, ubah dulu ke tahun. |
| **A** | Jumlah tabungan akhir | Rupiah | Uang di tabungan setelah ditambah bunga |

**Rumus utama**

| Rumus | Dibaca |
|---|---|
| **B = M × (p/100) × t** | Besar bunga = modal awal × (suku bunga ÷ 100) × lama menabung |
| **A = M + B** | Jumlah tabungan akhir = modal awal + besar bunga |

**Mengubah lama menabung ke tahun** (t selalu dalam tahun)

| Diketahui | t (tahun) | Contoh |
|---|---|---|
| bulan | t = banyak bulan ÷ 12 | 8 bulan → t = 8/12 |
| hari | t = banyak hari ÷ 365 (KF-02: 1 tahun = 365 hari) | 73 hari → t = 73/365 |
| tahun | t = banyak tahun | 2 tahun → t = 2 |

1 tahun = 12 bulan = 365 hari. Bulan **tidak** diubah ke hari, atau sebaliknya, lewat angka 30. Bulan selalu dibagi 12, dan hari selalu dibagi 365, langsung ke tahun.

**Rumus untuk mencari nilai yang belum diketahui** (sub-bab M5, diturunkan dari kedua rumus utama)

| Dicari | Rumus |
|---|---|
| Modal awal dari besar bunga | M = B ÷ ((p/100) × t) |
| Modal awal dari jumlah tabungan akhir | M = A ÷ (1 + (p/100) × t) |
| Besar bunga dari jumlah tabungan akhir | B = A − M |
| Suku bunga per tahun | p = (B × 100) ÷ (M × t) |
| Lama menabung (tahun) | t = (B × 100) ÷ (M × p) |

Catatan penulisan:

- Suku bunga ditulis sebagai angka persennya (p = 6, bukan p = 0,06), lalu dibagi 100 di dalam rumus. Karena itu, rumus selalu ditulis **(p/100)**, bukan "p%".
- Huruf **A** sebagai simbol jumlah tabungan akhir selalu ditulis dalam rumus atau bersama istilahnya ("jumlah tabungan akhir (A)"), agar tidak tertukar dengan huruf opsi pilihan ganda A–D di kuis (KF-18).
- Simbol lain (misalnya n untuk waktu, atau Ma untuk tabungan akhir) **tidak** dipakai.

Ketentuan:

- Setiap sub-bab terdiri dari beberapa **kartu langkah**. Satu kartu berisi satu ide (teks pendek, maksimal sekitar 60 kata, ditambah gambar atau tabel bila perlu).
- Siswa berpindah kartu dengan **Lanjut** dan **Kembali**. Tidak ada perpindahan otomatis.
- Sub-bab ditandai selesai setelah siswa mencapai kartu terakhir dan mengerjakan soal "Coba Sendiri".
- Urutan disarankan, tetapi tidak dikunci. Siswa boleh membuka sub-bab mana pun.

### F-03 Rumus dan contoh langkah demi langkah

- Setiap sub-bab M2–M5 memiliki minimal **2 contoh soal**:
  1. **Contoh lengkap**: semua langkah ditampilkan satu per satu dengan tombol "Tampilkan langkah berikutnya".
  2. **Contoh setengah jadi**: satu atau dua langkah terakhir diisi siswa.
- Rumus selalu ditampilkan bersama arti setiap simbolnya dan substitusi angkanya.
- Setiap contoh diakhiri langkah **Periksa** (cek kewajaran).

### F-04 Simulasi

- Masukan: modal (Rp), suku bunga (% per tahun), lama menabung beserta satuannya (tahun, bulan, atau hari).
- Keluaran:
  1. Rumus dengan angka yang sudah disubstitusi.
  2. Nilai bunga dan tabungan akhir.
  3. **Tabel** pertumbuhan tabungan per periode (per bulan atau per tahun).
  4. **Ilustrasi 3D** (opsional, dibuka dengan tombol): tumpukan koin per periode. Bagian modal tetap, bagian bunga bertambah sama besar setiap periode, sehingga sifat **linear** bunga tunggal terlihat.
- Ilustrasi 3D tidak bergerak sendiri. Siswa dapat memutar tampilan dengan jari. Jika perangkat tidak mendukung WebGL, hanya tabel yang ditampilkan.

### F-05 Soal cerita dan panel Pahami Soal

- Soal memakai konteks sehari-hari, misalnya tabungan di koperasi sekolah, tabungan di bank, atau menabung untuk membeli sepeda.
- Sebelum menjawab, siswa dapat membuka panel **Pahami Soal**:
  - Mengisi tabel *Diketahui* (Modal, Suku bunga, Lama, Bunga, Tabungan akhir; isi yang ada saja).
  - Memilih *Ditanya* dari daftar pilihan.
  - Aplikasi memberi tahu apakah pemilahan sudah tepat sebelum siswa menghitung.
- Bagian penting dalam teks soal dapat disorot setelah siswa meminta petunjuk level 1.

### F-06 Latihan soal

- Latihan dikelompokkan per sub-bab dan per tingkat (1–3).
- Setiap sesi latihan berisi 5 soal, diambil **hanya dari bank soal latihan** (KF-14, terpisah dari bank kuis).
- Jawaban dinilai dengan toleransi sesuai satuan, dan setiap kunci jawaban berupa angka "rapi" (KF-19, lihat F-07 "Toleransi dan kunci jawaban isian angka").
- Petunjuk bertahap (F-08, maksimal 3 tingkat) dan penjelasan kesalahan (F-09) tersedia.
- **Setelah jawaban diperiksa** (benar atau salah), siswa langsung mendapat **pembahasan lengkap** 4 langkah (KF-15 aturan 9). Jika salah, pesan jenis kesalahan (F-09) ditampilkan di atas pembahasan.
- Siswa tetap boleh mencoba lagi soal yang sama.
- *(Spesifikasi lama "pembahasan ditawarkan setelah 2 kali salah" diganti oleh KF-15, 12 November 2026.)*

### F-07 Kuis

> **Diperbarui 11 November 2026** berdasarkan keputusan pengembang. Spesifikasi sebelumnya (10 soal, tanpa batas waktu) diganti dengan aturan di bawah. Alasan awal "tanpa batas waktu" adalah inferensi perancang dari EL04 (penjelasan guru terlalu cepat), bukan permintaan langsung informan. Tampilan timer tetap dibuat tenang agar tidak menambah tekanan (lihat [design.md](design.md) bagian 5.9).

**Aturan kuis (keputusan yang sudah ditetapkan)**

| No | Aturan |
|---|---|
| 1 | Satu sesi kuis berisi **20 soal** dengan komposisi tingkat dan submateri sesuai KF-12 (lihat "Komposisi soal kuis" di bawah). |
| 2 | Waktu pengerjaan **30 menit**. |
| 3 | Timer **mulai saat siswa menekan Mulai Kuis**. |
| 4 | Siswa dapat mengakhiri kuis lebih awal dengan tombol **Selesai Kuis**. |
| 5 | Jika waktu habis, jawaban yang sudah diisi **otomatis dikumpulkan**. |
| 6 | Soal yang **tidak dijawab dihitung salah**. |
| 7 | Setelah dikumpulkan, tampil hasil lengkap (lihat "Hasil kuis" di bawah). |
| 8 | **Kunci jawaban dan pembahasan tidak terlihat** selama kuis berlangsung. |
| 9 | 20 soal terdiri dari **15 soal pilihan ganda** dan **5 soal isian angka** (KF-10, diputuskan 11 November 2026). |
| 10 | Soal pilihan ganda: siswa **memilih satu** dari **4 opsi (A–D)**. Urutan opsi diacak per siswa dan dikunci untuk sesi itu (KF-18). |
| 11 | Soal isian angka: siswa **menghitung sendiri** dan mengetik jawaban berupa angka. Penilaian memakai **toleransi perhitungan** sesuai satuan jawaban (KF-19): Rupiah ±1, persen ±0,01, waktu ±0,01. |

**Komposisi soal kuis** (KF-12, diputuskan 11 November 2026)

Setiap sesi kuis harus memenuhi **ketiga pembagian berikut sekaligus**. Masing-masing berjumlah 20.

*A. Tingkat kesulitan*

| Tingkat | Nilai `tingkat` | Jumlah |
|---|---|---|
| Mudah | 1 | 6 |
| Sedang | 2 | 10 |
| Sulit | 3 | 4 |
| **Total** | | **20** |

*B. Submateri*

| Submateri kuis | Nilai `kategori_kuis` | Jumlah |
|---|---|---|
| Konsep bunga tunggal | `konsep` | 3 |
| Menghitung besar bunga | `besar_bunga` | 5 |
| Menghitung jumlah tabungan akhir | `tabungan_akhir` | 4 |
| Menentukan modal awal atau suku bunga | `modal_suku_bunga` | 4 |
| Menghitung lama menabung | `lama_menabung` | 2 |
| Penerapan dalam masalah sehari-hari | `penerapan` | 2 |
| **Total** | | **20** |

*C. Bentuk soal* (tetap sesuai KF-10)

| Bentuk | Jumlah |
|---|---|
| Pilihan ganda | 15 |
| Isian angka | 5 |
| **Total** | **20** |

Catatan:

- Submateri kuis (B) **tidak sama persis** dengan sub-bab materi (P0, M1–M6). Karena itu, setiap soal kuis diberi label `kategori_kuis` secara eksplisit di bank soal, bukan ditebak dari sub-bab. Sub-bab P0 (pemanasan) tidak termasuk dalam pembagian B.
- Sebagai panduan penyusun soal, pemetaan yang paling dekat adalah: `konsep` ↔ M1, `besar_bunga` ↔ M2–M3, `tabungan_akhir` ↔ M4, `modal_suku_bunga` dan `lama_menabung` ↔ M5, `penerapan` ↔ M6. Label akhir tetap ditentukan penyusun soal untuk setiap soal.
- Pembagian A, B, dan C adalah **jumlah total**. Kombinasi per nomor ditetapkan oleh **kisi-kisi tetap KF-21** di bawah.
- Soal `konsep` bisa saja tidak berjawaban angka, misalnya pilihan ganda berupa pernyataan. Karena itu, opsi kunci pilihan ganda ditandai langsung di bank soal (`kunci`), tidak dihitung dari angka.

**Kisi-kisi kuis** (KF-21, diputuskan 11 November 2026)

Setiap nomor soal punya submateri, tingkat kesulitan, dan bentuk soal yang **tetap**.

| No. | Submateri | `kategori_kuis` | Tingkat | `tingkat` | Bentuk | `bentuk` |
|---|---|---|---|---|---|---|
| 1 | Konsep bunga tunggal | `konsep` | Mudah | 1 | Pilihan ganda | `pilihan_ganda` |
| 2 | Menghitung besar bunga | `besar_bunga` | Mudah | 1 | Pilihan ganda | `pilihan_ganda` |
| 3 | Jumlah tabungan akhir | `tabungan_akhir` | Mudah | 1 | Pilihan ganda | `pilihan_ganda` |
| 4 | Modal awal atau suku bunga | `modal_suku_bunga` | Mudah | 1 | Pilihan ganda | `pilihan_ganda` |
| 5 | Lama menabung | `lama_menabung` | Mudah | 1 | Pilihan ganda | `pilihan_ganda` |
| 6 | Konsep bunga tunggal | `konsep` | Mudah | 1 | Pilihan ganda | `pilihan_ganda` |
| 7 | Menghitung besar bunga | `besar_bunga` | Sedang | 2 | Pilihan ganda | `pilihan_ganda` |
| 8 | Jumlah tabungan akhir | `tabungan_akhir` | Sedang | 2 | Pilihan ganda | `pilihan_ganda` |
| 9 | Modal awal atau suku bunga | `modal_suku_bunga` | Sedang | 2 | Pilihan ganda | `pilihan_ganda` |
| 10 | Lama menabung | `lama_menabung` | Sedang | 2 | Isian angka | `isian` |
| 11 | Konsep bunga tunggal | `konsep` | Sedang | 2 | Pilihan ganda | `pilihan_ganda` |
| 12 | Menghitung besar bunga | `besar_bunga` | Sedang | 2 | Isian angka | `isian` |
| 13 | Jumlah tabungan akhir | `tabungan_akhir` | Sedang | 2 | Pilihan ganda | `pilihan_ganda` |
| 14 | Modal awal atau suku bunga | `modal_suku_bunga` | Sedang | 2 | Isian angka | `isian` |
| 15 | Menghitung besar bunga | `besar_bunga` | Sedang | 2 | Pilihan ganda | `pilihan_ganda` |
| 16 | Penerapan sehari-hari | `penerapan` | Sedang | 2 | Pilihan ganda | `pilihan_ganda` |
| 17 | Menghitung besar bunga | `besar_bunga` | Sulit | 3 | Isian angka | `isian` |
| 18 | Jumlah tabungan akhir | `tabungan_akhir` | Sulit | 3 | Isian angka | `isian` |
| 19 | Modal awal atau suku bunga | `modal_suku_bunga` | Sulit | 3 | Pilihan ganda | `pilihan_ganda` |
| 20 | Penerapan sehari-hari | `penerapan` | Sulit | 3 | Pilihan ganda | `pilihan_ganda` |

Pemeriksaan kesesuaian dengan KF-12 dan KF-10:

| Pembagian | Nomor | Jumlah | Ketentuan |
|---|---|---|---|
| Mudah | 1–6 | 6 | 6 ✓ |
| Sedang | 7–16 | 10 | 10 ✓ |
| Sulit | 17–20 | 4 | 4 ✓ |
| Konsep bunga tunggal | 1, 6, 11 | 3 | 3 ✓ |
| Menghitung besar bunga | 2, 7, 12, 15, 17 | 5 | 5 ✓ |
| Jumlah tabungan akhir | 3, 8, 13, 18 | 4 | 4 ✓ |
| Modal awal atau suku bunga | 4, 9, 14, 19 | 4 | 4 ✓ |
| Lama menabung | 5, 10 | 2 | 2 ✓ |
| Penerapan sehari-hari | 16, 20 | 2 | 2 ✓ |
| Isian angka | 10, 12, 14, 17, 18 | 5 | 5 ✓ |
| Pilihan ganda | 1–9, 11, 13, 15, 16, 19, 20 | 15 | 15 ✓ |

Ketentuan KF-21:

| No | Ketentuan |
|---|---|
| K1 | Setiap nomor soal memiliki submateri, tingkat kesulitan, dan bentuk soal yang tetap (tabel di atas). |
| K2 | Sistem mengambil soal **berdasarkan kisi-kisi per nomor**, bukan mengacak komposisi kategorinya. Urutan soal dalam kuis mengikuti nomor 1–20. |
| K3 | Pengacakan **hanya** boleh dilakukan di antara variasi soal yang tersedia dalam kombinasi yang sama (submateri + tingkat + bentuk), jika memang diperlukan. Satu soal tidak boleh muncul dua kali dalam satu sesi. |
| K4 | Jika bank soal tidak punya soal untuk kombinasi suatu nomor, kategori **tidak boleh diganti otomatis**. Kuis tidak dimulai, dan muncul keterangan bahwa bank soal belum mencukupi. |
| K5 | Kunci jawaban dan pembahasan tetap tersembunyi selama kuis berlangsung (aturan 8 kuis). |

**Bank soal kuis** (KF-14, diputuskan 12 November 2026)

| No | Aturan |
|---|---|
| B1 | Bank soal kuis wajib memiliki **minimal 40 soal berbeda**. |
| B2 | Percobaan pertama memakai 20 soal. |
| B3 | Percobaan kedua memakai **20 soal yang berbeda** dari percobaan pertama. |
| B4 | **Tidak ada soal yang dipakai ulang** di antara percobaan pertama dan kedua untuk siswa yang sama. |
| B5 | Kedua percobaan wajib mengikuti kisi-kisi tetap 20 nomor (KF-21). |
| B6 | Setiap soal harus cocok dengan kombinasi nomor kisi-kisi: submateri, tingkat kesulitan, dan bentuk soal. |
| B7 | Jika bank soal belum mencukupi, kuis tidak dapat dimulai dan sistem menampilkan informasi bahwa bank soal belum mencukupi. |
| B8 | Berlaku bersama KF-12, KF-13, dan KF-21. |

**Sebaran minimum per kombinasi.** Angka 40 baru cukup jika sebarannya mengikuti kisi-kisi. Karena 2 percobaan tidak boleh berbagi soal, setiap kombinasi butuh **2 × jumlah nomor yang memakainya**:

| Kombinasi (submateri – tingkat – bentuk) | Nomor kisi-kisi | Nomor per percobaan | Minimum soal |
|---|---|---|---|
| Konsep – mudah – PG | 1, 6 | 2 | **4** |
| Besar bunga – sedang – PG | 7, 15 | 2 | **4** |
| Tabungan akhir – sedang – PG | 8, 13 | 2 | **4** |
| Besar bunga – mudah – PG | 2 | 1 | 2 |
| Tabungan akhir – mudah – PG | 3 | 1 | 2 |
| Modal/suku bunga – mudah – PG | 4 | 1 | 2 |
| Lama menabung – mudah – PG | 5 | 1 | 2 |
| Modal/suku bunga – sedang – PG | 9 | 1 | 2 |
| Lama menabung – sedang – isian | 10 | 1 | 2 |
| Konsep – sedang – PG | 11 | 1 | 2 |
| Besar bunga – sedang – isian | 12 | 1 | 2 |
| Modal/suku bunga – sedang – isian | 14 | 1 | 2 |
| Penerapan – sedang – PG | 16 | 1 | 2 |
| Besar bunga – sulit – isian | 17 | 1 | 2 |
| Tabungan akhir – sulit – isian | 18 | 1 | 2 |
| Modal/suku bunga – sulit – PG | 19 | 1 | 2 |
| Penerapan – sulit – PG | 20 | 1 | 2 |
| **Total (17 kombinasi)** | | **20** | **40** |

Bank soal dianggap **mencukupi** hanya jika **setiap** kombinasi memenuhi minimum di tabel ini (soal `bank = 'kuis'` dan `aktif`). Total 40 yang menumpuk di sebagian kombinasi tetap dianggap belum mencukupi.

**Mekanisme pemilihan soal per percobaan**

1. **Sebelum percobaan pertama:** server memeriksa bahwa setiap kombinasi punya soal minimal sebanyak tabel di atas, sehingga percobaan kedua pasti bisa dibuat. Jika tidak, kuis tidak dimulai (B7). Siswa tidak boleh menghabiskan percobaan pertama lalu terhalang di percobaan kedua.
2. **Percobaan pertama:** untuk setiap nomor 1–20, pilih satu soal dari kombinasi nomor itu, boleh acak di antara kandidat (KF-21 K3), tanpa soal ganda dalam sesi.
3. **Percobaan kedua:** sama seperti langkah 2, tetapi kandidat **mengecualikan semua 20 soal yang diterima siswa di percobaan pertama**, termasuk soal yang tidak dijawab. Jika ada nomor yang tidak punya kandidat tersisa (misalnya ada soal yang dinonaktifkan setelah percobaan pertama), kuis tidak dimulai (B7), kategori tidak diganti (K4), dan kesempatan tidak berkurang (KF-13 P4).
4. **Penjagaan bersamaan:** pemilihan soal dan pembuatan sesi dijalankan bergantian per siswa (dikunci di server). Database juga menolak soal yang sama dipakai dua kali oleh siswa yang sama, sehingga B4 tetap terjaga walaupun dua permintaan Mulai Kuis datang bersamaan.

**Pemisahan bank soal latihan dan kuis** (tambahan KF-14, diputuskan 12 November 2026)

| No | Aturan |
|---|---|
| S1 | Soal latihan dan soal kuis memakai **bank soal yang terpisah**. Setiap soal hanya berada di **satu** bank: `latihan` atau `kuis`. |
| S2 | Latihan (F-06) **hanya** mengambil soal dari bank latihan. |
| S3 | Kuis (F-07) **hanya** mengambil soal dari bank kuis. |
| S4 | Penggunaan soal latihan **tidak boleh mengurangi, mengambil, atau mengubah** ketersediaan soal di bank kuis. |
| S5 | Bank kuis tetap wajib minimal 40 soal dengan sebaran sesuai kombinasi kisi-kisi KF-21 (tabel di atas). Soal di bank latihan **tidak** ikut dihitung. |
| S6 | Pemisahan diterapkan pada rancangan database, API, dan pengujian. |

Akibatnya:

- Siswa tidak pernah melihat soal kuis di latihan, sehingga tidak bisa "berlatih" dengan soal kuis sebelum kuis.
- Fitur khusus latihan (petunjuk bertahap F-08, panel Pahami Soal F-05, pembahasan langsung setelah jawaban diperiksa) hanya bekerja untuk soal bank latihan. Soal bank kuis tidak bisa diakses lewat fungsi-fungsi latihan.
- Riwayat latihan tidak memengaruhi pemilihan soal kuis. Yang dikecualikan pada percobaan kedua hanya soal kuis yang diterima di percobaan pertama (B3–B4).
- Total soal yang perlu disusun minimal **±60 soal latihan + 40 soal kuis**, tanpa soal yang dipakai bersama.

**Selama kuis berlangsung**

- Tampil: nomor soal (misalnya "Soal 3 dari 20"), teks soal, tempat menjawab, **sisa waktu**, dan tombol **Selesai Kuis**.
- Tempat menjawab sesuai bentuk soal:
  - **Pilihan ganda**: daftar opsi, siswa memilih satu. Perangkat hanya menerima teks opsi, tanpa tanda opsi mana yang benar.
  - **Isian angka**: kolom angka (`inputmode="decimal"`), dibaca dengan `uraiAngka` dari Fase 3 (contoh "Rp80.000" → 80000). Masukan yang bukan angka ditolak di perangkat dengan pesan format, sama seperti di latihan.
- **Tanpa petunjuk** dan tanpa umpan balik benar/salah per soal, agar menjadi latihan mandiri (DS02). Ketentuan ini tetap dari spesifikasi sebelumnya.
- Kunci jawaban, pembahasan, dan pesan kesalahan **tidak dikirim ke perangkat** sampai kuis dikumpulkan (NF-05), bukan hanya disembunyikan di tampilan.
- Lihat **Aturan timer** di bawah (KF-11, sudah diputuskan).
- Lama pengerjaan tetap dicatat.

**Aturan timer** (KF-11, diputuskan 11 November 2026)

| No | Aturan |
|---|---|
| T1 | Timer 30 menit **tetap berjalan** meskipun siswa menutup aplikasi atau browser. |
| T2 | Timer **tetap berjalan** meskipun koneksi internet terputus. |
| T3 | Siswa **dapat melanjutkan** kuis selama batas waktu belum habis. |
| T4 | Jika waktu sudah habis, kuis **otomatis dikumpulkan berdasarkan waktu server**. |
| T5 | Waktu **tidak boleh diulang dari awal** ketika siswa membuka kembali aplikasi. |

**Wajib: batas waktu memakai waktu server, bukan jam perangkat siswa.**

- Saat siswa menekan Mulai Kuis, server mencatat `mulai_pada` dan `batas_waktu = mulai_pada + 30 menit` **satu kali**. Nilai ini tidak pernah diubah atau diulang (T5).
- Server menjadi satu-satunya penentu apakah waktu sudah habis. Mengubah jam ponsel tidak menambah atau mengurangi waktu.
- Sisa waktu di layar hanya tampilan. Perangkat menghitungnya dari `batas_waktu` dan selisih jam perangkat terhadap waktu server, sehingga hitungan mundur tetap berjalan saat offline (T2).
- Jika siswa membuka aplikasi lagi sebelum batas waktu, kuis yang sama dilanjutkan dengan sisa waktu yang sebenarnya dan jawaban yang sudah tersimpan (T3).
- Jika kuis tidak dikumpulkan perangkat karena aplikasi ditutup atau offline, **server menutupnya sendiri** setelah `batas_waktu` lewat (T4). Hanya jawaban yang sudah diterima server sebelum batas waktu yang dinilai. Waktu selesai dicatat sama dengan `batas_waktu`.
- Saat siswa membuka aplikasi lagi setelah waktu habis, aplikasi memberi tahu bahwa kuis sudah dikumpulkan otomatis dan menampilkan hasilnya.
- Jawaban yang dibuat saat offline mengikuti **Aturan jawaban offline** di bawah (KF-20).

**Aturan jawaban offline** (KF-20, diputuskan 11 November 2026: aturan ketat berdasarkan waktu penerimaan server)

| No | Aturan |
|---|---|
| J1 | Jawaban **sah hanya jika sudah diterima dan tersimpan di server sebelum `batas_waktu`**. |
| J2 | Saat offline, jawaban yang dipilih hanya **tersimpan sementara di perangkat** dan **belum** dianggap jawaban resmi. |
| J3 | Jika internet kembali **sebelum** batas waktu, jawaban yang tersimpan di perangkat boleh dikirim ke server selama waktu masih ada. |
| J4 | Jika internet baru kembali **setelah** batas waktu, jawaban offline yang belum diterima server **ditolak dan tidak dihitung**. |
| J5 | Jawaban yang **sudah diterima server** sebelum batas waktu **tetap tersimpan dan dinilai**. |
| J6 | **Jam perangkat tidak boleh dipakai** untuk menentukan apakah jawaban diterima tepat waktu. Acuannya waktu server saat jawaban diterima. |
| J7 | Siswa harus diberi **informasi yang jelas** bahwa jawaban offline belum terkirim dan belum tersimpan di server. |

Konsistensi dengan KF-11: timer tetap berjalan saat offline (T2), dan penentu waktu habis tetap server (T4). Karena itu, waktu offline tidak "dibekukan", dan tidak ada pengecualian untuk jawaban yang terlambat sampai.

Penerapan:

- Satu jawaban dianggap **tersimpan** hanya setelah server membalas berhasil. Sebelum itu, statusnya **belum terkirim**.
- Jika permintaan sampai ke server tetapi balasannya hilang karena sinyal putus, status ditentukan ulang dari daftar jawaban yang diterima server (`jawaban_tersimpan` di `mulai_kuis`/`status_kuis`) saat koneksi kembali.
- Saat koneksi kembali dan waktu masih ada, perangkat mengirim jawaban yang belum terkirim **sebelum** mengumpulkan kuis.
- Jika siswa menekan Selesai Kuis saat offline, kuis **belum** terkumpul. Siswa diberi tahu untuk mencoba lagi setelah tersambung. Jika waktu habis lebih dulu, server mengumpulkan kuis dengan jawaban yang sudah diterima (T4, J5).
- Jawaban offline yang ditolak setelah waktu habis dihapus dari perangkat. Di hasil kuis, soal itu tampil sebagai "Tidak dijawab", sesuai aturan soal kosong (aturan 6 kuis).

Informasi untuk siswa (J7), rancangan tampilannya di [design.md](design.md) bagian 5.9d:

| Keadaan | Contoh pesan |
|---|---|
| Koneksi terputus | "Internet terputus. Waktu kuis tetap berjalan. Jawaban yang kamu pilih sekarang **belum terkirim** dan **belum tersimpan** di server." |
| Per soal yang belum terkirim | Penanda teks "Belum terkirim" (bukan hanya warna atau ikon) |
| Per soal yang sudah diterima server | Penanda teks "Tersimpan" |
| Koneksi kembali, waktu masih ada | "Tersambung lagi. Mengirim jawabanmu…" lalu "Semua jawaban sudah tersimpan." |
| Koneksi kembali setelah waktu habis | "Waktu kuis sudah habis saat kamu offline. Jawaban yang belum terkirim tidak dihitung." |

**Konfirmasi dan pengingat waktu** (KF-16, diputuskan 12 November 2026: pilihan A1 + B1)

*A1 — Konfirmasi sebelum Selesai Kuis*

- Setiap kali siswa menekan **Selesai Kuis**, dialog konfirmasi **selalu** muncul, termasuk jika semua soal sudah dijawab.
- Dialog menampilkan jumlah dan nomor soal yang belum dijawab. Contoh: "Masih ada 3 soal belum dijawab (no. 5, 12, 18). Yakin ingin mengumpulkan?" Jika semua sudah dijawab: "Semua soal sudah dijawab. Kumpulkan sekarang?"
- Jika ada jawaban berstatus "Belum terkirim" karena offline (KF-20), dialog juga menyebutkannya. Contoh: "2 jawaban belum terkirim dan belum tersimpan di server."
- Tombol: **Kembali ke soal** (dialog ditutup, kuis berlanjut, timer tetap berjalan) dan **Ya, kumpulkan**.
- Dialog **tidak menghentikan timer** (KF-11). Jika waktu habis saat dialog masih terbuka, kuis tetap dikumpulkan otomatis oleh server.
- Pengumpulan otomatis karena waktu habis **tidak** memakai dialog ini.
- "Soal belum dijawab" berarti soal yang belum punya jawaban sama sekali, baik yang sudah tersimpan di server maupun yang masih di antrean offline. Jawaban yang belum terkirim disebut terpisah.

*B1 — Satu pengingat sisa waktu*

- Satu pengingat muncul saat sisa waktu mencapai **5 menit**: "Sisa waktu 5 menit."
- Tampilannya tenang: teks biasa di bagian atas layar, **tanpa suara, kedip, getar, atau warna merah**, dan tidak menutupi soal (EL03, DS03).
- Pengingat bisa ditutup siswa, dan hilang sendiri setelah beberapa detik.
- Dihitung dari `batas_waktu` server dan selisih jam (KF-11), sehingga tetap muncul saat offline.
- Hanya ditampilkan, tidak dicatat di server.
- Jika siswa membuka atau melanjutkan kuis saat sisa waktu sudah di bawah 5 menit, pengingat muncul sekali saat kuis dibuka.
- Tidak ada pengingat lain, misalnya pada sisa 1 menit.

**Berpindah nomor dan mengubah jawaban** (KF-22, diputuskan 12 November 2026: pilihan N1 + R1)

| No | Aturan |
|---|---|
| N1a | Siswa **bebas berpindah** antarnomor dengan tombol **Sebelumnya** / **Berikutnya** dan **panel nomor 1–20** yang bisa diketuk. Urutan soal tetap nomor 1–20 (KF-21). |
| N1b | Siswa **boleh mengubah jawaban** kapan saja selama kuis belum dikumpulkan dan waktu belum habis. |
| N1c | Yang dinilai adalah **jawaban terakhir yang diterima server sebelum `batas_waktu`** (KF-11, KF-20). Mengubah jawaban berarti mengirim jawaban baru. |
| N1d | Panel nomor menampilkan status setiap soal dengan **teks/ikon, bukan hanya warna**: **Tersimpan**, **Belum terkirim** (antrean offline, KF-20), dan **Belum dijawab**. Panel tidak pernah menampilkan benar/salah. |
| N1e | Nomor soal kosong di dialog Selesai Kuis (KF-16) bisa diketuk untuk langsung menuju soal itu. |
| R1 | **Tidak ada** tanda "ragu-ragu". Siswa cukup mengubah jawaban bila perlu, agar tampilan tetap sederhana (EL03, DS03). |

- Pilihan ganda: memilih opsi lain menggantikan pilihan sebelumnya. Jawaban pilihan ganda **tidak bisa dikosongkan lagi** setelah dipilih, cukup diganti.
- Isian angka: siswa boleh mengubah angkanya. Jawaban dikirim saat siswa pindah nomor atau menekan tombol simpan di soal itu. Mengosongkan kolom isian tidak menghapus jawaban yang sudah tersimpan di server.
- Saat offline, antrean di perangkat hanya menyimpan **pilihan terakhir** untuk setiap soal (KF-20).

**Keluar di tengah kuis** (KF-17, diputuskan 12 November 2026: pilihan C1 "keluar sementara")

- Menekan **✕ Keluar** di layar kuis memunculkan dialog: "Kamu akan keluar dari kuis. **Waktu tetap berjalan** (sisa 18:42). Kamu bisa melanjutkan selama waktu belum habis."
- Tombol dialog: **Tetap di kuis** (tombol utama) dan **Keluar sementara**.
- **Keluar sementara** tidak mengumpulkan kuis dan **tidak menghentikan timer** (KF-11). Kuis tetap berstatus berjalan di server.
- Siswa dapat **melanjutkan** kuis dari menu Latihan atau Beranda selama waktu belum habis. Kuis yang dilanjutkan memakai sesi, soal, jawaban tersimpan, dan batas waktu yang sama. Tidak ada percobaan baru (KF-13).
- Jika waktu habis selama siswa di luar kuis, server mengumpulkan kuis otomatis (KF-11). Saat siswa kembali, muncul pemberitahuan dan hasilnya (`status_kuis`).
- Jawaban offline yang belum terkirim tetap tersimpan sementara di perangkat dan dikirim saat kuis dibuka lagi, selama waktu masih ada (KF-20).
- **Tombol/gestur kembali Android** mengikuti aturan yang sama dengan ✕: memunculkan dialog yang sama, bukan langsung keluar.
- Perilaku ini sama dengan menutup aplikasi atau browser (KF-11), sehingga siswa hanya perlu memahami satu aturan: **keluar tidak menghentikan waktu dan tidak mengumpulkan kuis**. Satu-satunya cara mengumpulkan sebelum waktu habis adalah tombol Selesai Kuis (KF-16).

**Pengumpulan**

- Kuis dikumpulkan dengan salah satu cara: siswa menekan **Selesai Kuis** lalu memilih **Ya, kumpulkan** di dialog konfirmasi (KF-16), atau **waktu habis** (otomatis, ditentukan waktu server).
- Setelah dikumpulkan, jawaban tidak bisa diubah lagi.
- Nilai akhir memakai skala 0–100: `nilai = jumlah benar ÷ 20 × 100`, sehingga setiap soal bernilai 5 (AS-08). Soal pilihan ganda dan isian angka berbobot sama.

**Penilaian per bentuk soal**

| Bentuk | Benar jika | Jenis kesalahan (F-09) |
|---|---|---|
| Pilihan ganda | Opsi yang dipilih adalah opsi yang ditandai `kunci` di bank soal | Diambil dari pola kesalahan yang menjadi sumber opsi pengecoh itu. Opsi pengecoh lain, termasuk pengecoh soal `konsep`, bernilai `LAINNYA`. |
| Isian angka | Selisih jawaban dengan kunci ≤ toleransi soal (`soal.toleransi`, sesuai satuan jawaban, KF-19) | Dicocokkan dengan nilai pola kesalahan, seperti di latihan |

**Toleransi dan kunci jawaban isian angka** (KF-19, diputuskan 12 November 2026: pilihan F1 + G1)

Berlaku untuk **semua soal isian**, baik di bank latihan maupun 5 soal isian kuis (nomor 10, 12, 14, 17, 18).

*F1 — Toleransi per satuan jawaban*

| `satuan_jawaban` | Toleransi | Contoh (kunci) | Diterima | Ditolak |
|---|---|---|---|---|
| `rupiah` | **±1** | Rp80.000 | 79.999 – 80.001 | 79.998, 80.002 |
| `persen` | **±0,01** | 2,5 | 2,49 – 2,51 | 2,48, 2,52 |
| `tahun`, `bulan`, `hari` | **±0,01** | 8 bulan | 7,99 – 8,01 | 7,98, 8,02 |

- Nilai toleransi disimpan per soal (`soal.toleransi`) dan diisi skrip bank soal sesuai `satuan_jawaban`. Pengecualian untuk soal tertentu hanya boleh dengan alasan yang dicatat.
- Toleransi yang sama dipakai untuk mencocokkan pola kesalahan (F-09). Dengan toleransi yang ketat untuk persen dan waktu, pola kesalahan yang nilainya berdekatan (misalnya 0,06 dan 0,5) tetap bisa dibedakan (temuan Fase 3).
- Toleransi hanya mengurus selisih angka. Format penulisan ("Rp80.000", "80000", "80.000", "2,5", "2.5") sudah diurus oleh `uraiAngka` (Fase 3).

*G1 — Kunci jawaban isian harus "rapi"*

| `satuan_jawaban` | Syarat kunci jawaban |
|---|---|
| `rupiah` | Bilangan bulat (tanpa sen) |
| `persen` | Paling banyak **1 angka desimal** (misalnya 6 atau 2,5) |
| `tahun`, `bulan`, `hari` | Bilangan **bulat** dalam satuan yang ditanya (misalnya 8 bulan, bukan 7,5 bulan) |

- Penyusun soal memilih angka pada soal agar kunci jawabannya memenuhi syarat di atas. Skrip bank soal memeriksa syarat ini dan menolak soal yang tidak memenuhinya.
- Karena kunci selalu rapi, siswa tidak perlu menebak aturan pembulatan, sehingga soal isian **tidak bergantung pada KF-09** (aturan pembulatan, yang masih terbuka dan tetap berlaku untuk tampilan lain, misalnya Simulasi).
- G1 hanya mengatur **kunci jawaban** soal isian. Nilai opsi pilihan ganda dan hasil Simulasi tidak diatur oleh keputusan ini.
| Tidak dijawab (kedua bentuk) | Selalu salah | Tidak ada; ditampilkan "Tidak dijawab" |

Opsi pengecoh pilihan ganda **disarankan** diambil dari nilai `pola_kesalahan` yang sudah dihitung `hitungPolaKesalahan` (Fase 3), misalnya Rp960.000 untuk kesalahan satuan waktu. Dengan begitu, pilihan siswa langsung memberi tahu jenis kesalahannya. Setiap soal pilihan ganda butuh **1 kunci + 3 pengecoh** (KF-18). Jika pola kesalahan kurang dari 3 (misalnya soal dengan waktu dalam tahun hanya punya 2 pola), atau soal berupa pernyataan (`konsep`), penyusun soal menambah pengecoh secara manual.

**Opsi pilihan ganda** (KF-18, diputuskan 12 November 2026: pilihan D1 + E1)

| No | Aturan |
|---|---|
| O1 | Setiap soal pilihan ganda punya **tepat 4 opsi**, ditampilkan sebagai **A–D**, dengan **tepat 1** opsi kunci. |
| O2 | Urutan opsi **diacak untuk setiap siswa** saat sesi kuis dibuat, lalu **dikunci** untuk sesi itu. |
| O3 | Urutan yang terkunci disimpan di server, sehingga **tetap sama** saat kuis dilanjutkan setelah keluar sementara atau menutup aplikasi (KF-11, KF-17), dan di halaman hasil. |
| O4 | Huruf A–D yang tampil mengikuti urutan yang dilihat siswa. Siswa lain bisa melihat soal yang sama dengan letak kunci berbeda. |
| O5 | Jawaban disimpan dengan **ID opsi yang tetap**, bukan huruf, sehingga pengacakan tidak memengaruhi penilaian maupun antrean jawaban offline (KF-20). |
| O6 | Halaman hasil menampilkan opsi dengan huruf dan urutan yang **sama persis** dengan saat siswa mengerjakan. |

Urutan soal dalam kuis tidak diacak, karena sudah ditetapkan oleh kisi-kisi KF-21.

**Hasil kuis** (setelah dikumpulkan)

| Bagian | Isi |
|---|---|
| Nilai akhir | Angka 0–100 |
| Ringkasan | Jumlah jawaban **benar** dan **salah**. Jumlah salah termasuk soal yang tidak dijawab, yang juga disebutkan terpisah (misalnya "Salah: 6, termasuk 2 tidak dijawab"). |
| Nomor soal yang salah | Daftar nomor soal yang dijawab salah atau tidak dijawab |
| Rincian per soal (20 soal) | Teks soal, bentuk soal, **jawaban siswa** (atau "Tidak dijawab"), **jawaban yang benar**, status benar/salah, dan **pembahasan 4 langkah** (Pahami → Rencanakan → Hitung → Periksa). Untuk pilihan ganda, semua opsi ditampilkan dengan tanda opsi yang dipilih siswa dan opsi yang benar. Untuk isian angka, ditampilkan angka yang diketik siswa dan kunci jawabannya. |
| Penjelasan kesalahan | Untuk soal yang salah, ditambah pesan jenis kesalahan dari F-09, misalnya satuan waktu |

Hasil kuis tetap bisa dibuka lagi dari halaman Riwayat (F-10).

**Aturan pengulangan kuis** (KF-13, diputuskan 12 November 2026)

| No | Aturan |
|---|---|
| P1 | Siswa hanya boleh mengerjakan kuis **maksimal 2 kali** (2 percobaan). |
| P2 | Setiap kuis yang **berhasil dimulai** dihitung sebagai satu percobaan. "Berhasil dimulai" berarti sesi kuis sudah dibuat server dan timer sudah berjalan (`mulai_kuis` berhasil). |
| P3 | Percobaan **tetap dihitung** jika siswa keluar dari aplikasi, menutup browser, kehilangan koneksi, atau waktu habis setelah kuis dimulai. |
| P4 | Kuis yang **belum berhasil dimulai tidak dihitung**, misalnya karena gagal koneksi saat menekan Mulai Kuis atau `BANK_SOAL_KURANG` (KF-21). |
| P5 | Hasil **kedua percobaan disimpan** dan tampil di Riwayat. Tidak ada hasil yang dihapus atau ditimpa. |
| P6 | **Nilai utama** yang ditampilkan adalah **nilai tertinggi** dari seluruh percobaan yang sudah dikumpulkan. |
| P7 | Setelah 2 percobaan dipakai, siswa **tidak dapat memulai kuis ketiga**. |

Kesesuaian dengan keputusan lain:

- **KF-11 (timer server):** melanjutkan kuis yang masih berjalan **tidak** dihitung sebagai percobaan baru, karena sesinya sama dan timernya tidak diulang. Percobaan yang waktunya habis saat aplikasi tertutup tetap dihitung (P3), dan hasilnya dikumpulkan server.
- **KF-20 (jawaban offline):** nilai setiap percobaan hanya dihitung dari jawaban yang diterima server sebelum batas waktu. Kehilangan koneksi tidak membatalkan atau mengembalikan percobaan.
- **KF-21 (kisi-kisi):** percobaan kedua memakai kisi-kisi yang sama, dengan **20 soal yang berbeda** dari percobaan pertama (KF-14).
- Selama percobaan pertama masih berjalan, percobaan kedua tidak bisa dimulai. Membuka kuis lagi justru melanjutkan percobaan yang sedang berjalan.

Penjagaan di server: penghitungan percobaan dan larangan percobaan ketiga dilakukan di server (`mulai_kuis`), bukan di perangkat. Database juga menolak percobaan ke-3, termasuk jika dua permintaan Mulai Kuis terkirim bersamaan.

Informasi untuk siswa:

| Keadaan | Contoh tampilan |
|---|---|
| Sebelum mulai | "Kesempatan kuis: 1 dari 2" (atau "2 dari 2") di dekat tombol Mulai Kuis |
| Setelah percobaan pertama | Nilai tertinggi dan keterangan "Kamu masih punya 1 kesempatan lagi." |
| Kedua percobaan terpakai | Tombol Mulai Kuis tidak aktif, dengan pesan "Kamu sudah memakai 2 kesempatan kuis. Nilai tertinggimu: 85." Hasil kedua percobaan tetap bisa dibuka. |

**Semua keputusan fitur kuis sudah ditetapkan** (KF-10 sampai KF-22, per 12 November 2026): bentuk jawaban (KF-10), timer (KF-11), komposisi soal (KF-12), pengulangan (KF-13), bank soal (KF-14), petunjuk dan pembahasan latihan (KF-15), konfirmasi dan pengingat (KF-16), keluar sementara (KF-17), opsi pilihan ganda (KF-18), toleransi dan kunci rapi (KF-19), jawaban offline (KF-20), kisi-kisi (KF-21), serta berpindah nomor dan mengubah jawaban (KF-22).

Latihan (F-06) **tidak berubah**: tetap isian angka dengan petunjuk dan penjelasan kesalahan. Soal pilihan ganda hanya dipakai di kuis. Sesuai tambahan KF-14, latihan dan kuis memakai bank soal yang terpisah (S1–S6).

### F-08 Petunjuk bertahap

**Aturan petunjuk dan pembahasan** (KF-15, diputuskan 12 November 2026)

| No | Aturan |
|---|---|
| H1 | Petunjuk **hanya tersedia di mode latihan** (soal bank latihan, KF-14). |
| H2 | Petunjuk diberikan bertahap, **maksimal 3 tingkat**. |
| H3 | Tingkat 1 membantu siswa **mengidentifikasi informasi yang diketahui dan ditanyakan**. |
| H4 | Tingkat 2 membantu siswa **menentukan rumus atau konsep** yang sesuai. |
| H5 | Tingkat 3 memberikan **arahan langkah awal perhitungan**. |
| H6 | Petunjuk **tidak boleh langsung memberikan jawaban akhir**. |
| H7 | Siswa membuka petunjuk **bertahap sesuai kebutuhan**: tingkat berikutnya hanya bisa dibuka setelah tingkat sebelumnya, dan siswa boleh berhenti di tingkat mana pun. |
| H8 | Petunjuk **tidak tersedia selama kuis aktif**. |
| H9 | Setelah jawaban latihan diperiksa, siswa mendapat **pembahasan lengkap** yang menjelaskan proses penyelesaian. |

| Tingkat | Isi | Langkah literasi | Contoh (soal: Rani menabung Rp2.000.000, bunga 6% per tahun, berapa bunga setelah 8 bulan?) |
|---|---|---|---|
| 1 | Informasi yang diketahui dan yang ditanyakan. Bagian penting dalam soal disorot. | Pahami | "Diketahui: modal Rp2.000.000, suku bunga 6% per tahun, lama 8 bulan. Yang ditanya: besar bunga." |
| 2 | Rumus atau konsep yang sesuai | Rencanakan | "Gunakan rumus bunga tunggal B = M × (p/100) × t. Ingat, t harus dalam tahun." |
| 3 | Arahan langkah awal perhitungan, **tanpa hasil akhir** | Hitung | "Ubah dulu 8 bulan menjadi tahun: t = 8/12. Lalu masukkan M = 2.000.000 dan p = 6 ke rumus." |

- Petunjuk tingkat 3 boleh menyebut angka yang diketahui dan langkah pertama, tetapi **tidak boleh** memuat nilai jawaban akhir (pada contoh: 80.000) atau hasil antara yang langsung sama dengan jawaban. Ketentuan ini diperiksa saat bank soal disusun (Fase 7).
- **Pembahasan lengkap** (H9) memakai 4 langkah yang sama dengan F-03: Pahami → Rencanakan → Hitung → Periksa, termasuk hasil akhir dan cek kewajaran. Pembahasan ditampilkan setelah **setiap** pemeriksaan jawaban latihan, benar maupun salah.
- Di kuis tidak ada tombol petunjuk, dan server menolak permintaan petunjuk untuk soal bank kuis (KF-14). Pembahasan soal kuis baru muncul setelah kuis dikumpulkan (F-07).
- Jumlah petunjuk yang dipakai (0–3) dicatat di riwayat dan **tidak mengurangi nilai** latihan.
- *(Spesifikasi lama 4 tingkat, dengan tingkat 4 "contoh soal yang mirip", diganti oleh KF-15. Contoh soal yang mirip tetap tersedia di contoh langkah demi langkah sub-bab, F-03.)*

### F-09 Penjelasan kesalahan

Jika jawaban salah, aplikasi mencocokkan jawaban siswa dengan pola kesalahan umum yang sudah dihitung untuk setiap soal:

| Kode jenis kesalahan | Contoh pola | Pesan singkat (contoh) |
|---|---|---|
| `SATUAN_WAKTU` | Bulan dipakai seolah-olah tahun (t = 6, bukan 6/12) | "Lama menabung dalam **bulan**. Ubah dulu ke tahun: 6 bulan = 6/12 tahun." |
| `PERSEN` | Suku bunga tidak dibagi 100 | "Ingat, suku bunga 6% ditulis p/100 = 6/100 di dalam rumus." |
| `TERTUKAR_BUNGA_TABUNGAN` | Menjawab besar bunga padahal ditanya jumlah tabungan akhir, atau sebaliknya | "Yang ditanya adalah **jumlah tabungan akhir**, yaitu A = M + B." |

Teks pesan di tabel ini mengikuti notasi KF-03. Pesan yang sekarang dihasilkan kode Fase 3 (`diagnosis.js`) masih memakai penulisan lama ("p% × t", "tabungan akhir"). Penyelarasan teks pesan di kode dicatat sebagai tugas di task.md dan dikerjakan pada fase yang sesuai. Logika perhitungannya tidak berubah.
| `RUMUS_INVERS` | Salah menyusun rumus saat mencari M, p, atau t | "Untuk mencari modal awal, bagi besar bunga dengan ((p/100) × t)." |
| `LAINNYA` | Tidak cocok dengan pola mana pun | "Jawabanmu belum tepat. Coba periksa lagi perhitunganmu langkah demi langkah." |

Di latihan, pesan kesalahan langsung diikuti **pembahasan lengkap** 4 langkah (KF-15 H9), lalu tombol **Coba lagi**. Di kuis, pesan kesalahan dan pembahasan ditampilkan setelah kuis selesai.

Masukan yang bukan angka ditolak di perangkat dengan pesan format, misalnya "Tulis jawaban dalam angka, contoh: 150000 atau 150.000." Penolakan ini tidak dihitung sebagai jawaban salah.

### F-10 Riwayat dan perkembangan belajar

- **Beranda** menampilkan: sub-bab yang sudah selesai (misalnya 3 dari 7), **nilai kuis tertinggi** beserta sisa kesempatan kuis (KF-13), dan satu saran langkah berikutnya.
- **Halaman Riwayat** menampilkan:
  - Daftar aktivitas terbaru (latihan dan kuis) beserta tanggal dan hasil.
  - Nilai kuis: **nilai tertinggi** sebagai nilai utama, ditambah nilai percobaan 1 dan 2 (maksimal 2 percobaan, KF-13), masing-masing dengan tanggal dan tautan ke hasilnya. Grafik sederhana satu warna tetap boleh dipakai untuk membandingkan kedua percobaan.
  - **Kesalahan yang paling sering**, misalnya "Satuan waktu (4 kali)", beserta tautan ke sub-bab yang relevan.

### F-11 Jelaskan dengan kata-katamu (Could)

Setelah menjawab benar, siswa dapat menulis penjelasan singkat. Teks disimpan untuk dibaca sendiri dan tidak dinilai.

### F-12 Pretest dan Posttest Mathematical Literacy (KF-05e)

**Keputusan KF-05e (12 November 2026)**

| No | Aturan |
|---|---|
| T1 | Pretest dan posttest dilaksanakan **di dalam aplikasi Lanora**. |
| T2 | Keduanya memakai **empat soal Mathematical Literacy** yang sudah disiapkan untuk tugas Pak Aan. |
| T3 | Setiap soal mewakili **satu indikator**: penalaran, merumuskan, menerapkan, serta menafsirkan dan mengevaluasi. |
| T4 | Setiap soal memiliki **skor maksimal 6**. |
| T5 | **Total skor maksimal 24**. |
| T6 | **Pretest** dilaksanakan **sebelum** pembelajaran menggunakan Lanora. |
| T7 | **Posttest** dilaksanakan **setelah** rangkaian pembelajaran selesai. |
| T8 | Soal pretest dan posttest adalah **instrumen penelitian tersendiri**, bukan bagian dari bank soal latihan maupun kuis. |
| T9 | Jawaban dan skor setiap tes **tercatat** dan **dapat dibedakan** antara pretest dan posttest. |

**Struktur instrumen**

| Soal | Indikator Mathematical Literacy | Skor maksimal |
|---|---|---|
| 1 | Penalaran | 6 |
| 2 | Merumuskan | 6 |
| 3 | Menerapkan | 6 |
| 4 | Menafsirkan dan mengevaluasi | 6 |
| | **Total** | **24** |

*Urutan nomor di tabel ini mengikuti urutan indikator dalam keputusan. Urutan soal sebenarnya mengikuti instrumen asli (PP-01, PP-02).*

**Ketentuan yang mengikuti langsung dari KF-05e:**

- **Terpisah dari bank soal (T8).** Empat soal instrumen disimpan terpisah dari tabel `soal` (bank `latihan` dan `kuis`, KF-14). Soal instrumen tidak muncul di latihan, kuis, kisi-kisi KF-21, maupun pemeriksaan kecukupan bank soal, dan sebaliknya.
- **Isi soal tidak diubah.** Aplikasi menampilkan empat soal **persis seperti instrumen yang disepakati**. Soal, kisi-kisi jawaban, dan rubrik tidak dibuat atau disunting oleh pengembang aplikasi.
- **Dapat dibedakan dan dibandingkan (T9).** Setiap hasil tes menyimpan jenis tes (`pretest` atau `posttest`), siswa, jawaban dan skor **per tahapan rubrik**, skor per soal (0–6), total (0–24), serta waktu mulai dan selesai.
- **Data per akun (KF-05 L5, L8).** Hasil tes tersimpan pada akun siswa dan hanya bisa diakses siswa itu sendiri (sebatas yang diizinkan PP-06) serta peneliti (PP-10).
- **Aturan kuis tidak otomatis berlaku.** Timer, batas percobaan, pengacakan, dan pembahasan kuis (F-07, KF-10 sampai KF-22) **tidak** berlaku untuk pretest/posttest. Aturan tes diatur oleh PP-01 sampai PP-10 di bawah.

**Keputusan PP-01 sampai PP-10 (12 November 2026)**

| Kode | Topik | Keputusan |
|---|---|---|
| **PP-01** | Sumber soal | Empat soal Mathematical Literacy dari **instrumen Pak Aan**, lengkap dengan **kisi-kisi jawaban dan rubrik**. Setiap soal skor maksimal 6, total 24. Khusus pretest/posttest, bukan bank soal latihan atau kuis. |
| **PP-02** | Kesamaan soal | Pretest dan posttest memakai **empat soal yang sama persis**, termasuk **urutan**, indikator, dan rubrik penilaian. Soal **tidak diacak**. |
| **PP-03** | Kesempatan | Setiap tes hanya **satu kesempatan**. Jika ada gangguan teknis, siswa **melanjutkan** tes yang sama tanpa kehilangan jawaban yang sudah tersimpan. Melanjutkan **bukan** percobaan baru. |
| **PP-04** | Batas waktu | **Tidak ada batas waktu.** Sistem tetap mencatat **waktu mulai dan selesai**. |
| **PP-05** | Dasar penilaian | Penilaian mengikuti **tahapan penyelesaian dalam rubrik**. Setiap soal maksimal 6 poin, total maksimal 24 poin. |
| **PP-06** | Tampilan hasil | Setelah tes selesai, siswa **dapat melihat skor**. **Kunci jawaban dan pembahasan** baru tersedia **setelah posttest selesai**. |
| **PP-07** | Penilaian otomatis | Sistem menilai **otomatis berdasarkan rubrik setiap tahapan**. Pencocokan kata kunci sederhana **tidak boleh** menjadi satu-satunya metode. |
| **PP-08** | Format jawaban | Jawaban setiap soal **dipisahkan per tahapan rubrik**, bukan satu kolom uraian bebas. |
| **PP-09** | Variasi penulisan | Sistem menerima variasi penulisan yang **bermakna matematika sama**, misalnya `400000`, `400.000`, dan `Rp400.000`. Normalisasi memperhatikan pemisah ribuan, tanda desimal, persen, dan satuan. |
| **PP-10** | Akses data penelitian | Peneliti melihat hasil lewat **dasbor Supabase** dan mengunduh **CSV**, berisi skor setiap tahapan, skor total, dan waktu pengerjaan. Data pretest dan posttest dapat dibedakan dan dibandingkan. |

**Penerapan keputusan pada alur tes**

1. **Mulai** (PP-03, PP-04): siswa membuka pretest atau posttest. Server mencatat `mulai_pada` (waktu server). Jika tes itu sudah pernah dimulai dan belum selesai, tes **dilanjutkan** dengan jawaban yang sudah tersimpan. Jika sudah selesai, tes tidak bisa dibuka lagi.
2. **Mengerjakan** (PP-02, PP-08): empat soal ditampilkan dalam urutan instrumen. Setiap soal memiliki **kolom terpisah untuk setiap tahapan rubrik**. Jawaban setiap tahapan **disimpan ke server** saat siswa berpindah kolom atau soal, sehingga gangguan teknis tidak menghilangkan jawaban yang sudah tersimpan (PP-03). Tidak ada hitung mundur waktu (PP-04).
3. **Selesai** (PP-03, PP-04): siswa menekan **Selesai tes**. Server mencatat `selesai_pada`, dan jawaban tidak bisa diubah lagi.
4. **Penilaian** (PP-05, PP-07, PP-09, PT-03): server menilai otomatis setiap tahapan yang bisa diperiksa secara matematis. Tahapan uraian dan tahapan yang tidak bisa dipastikan masuk antrean **penilaian manual** peneliti/guru. Skor keduanya digabungkan.
5. **Hasil** (PP-06): siswa melihat skor per soal dan total **setelah penilaian selesai**. Selama penilaian manual belum selesai, siswa hanya melihat "Sedang dinilai" tanpa skor sementara (PT-08 M3). Kunci jawaban dan pembahasan **tidak** ditampilkan sampai posttest siswa itu selesai. Setelah posttest selesai, kunci dan pembahasan tersedia.
6. **Data penelitian** (PP-10): peneliti membaca hasil di dasbor Supabase dan mengunduh CSV (architecture.md bagian 6).

**Rancangan penilaian otomatis per tahapan** (PP-05, PP-07, PP-09; rincian teknis di architecture.md)

Prinsip:

- **Setiap tahapan dinilai sendiri** sesuai bobotnya di rubrik. Jumlah bobot semua tahapan dalam satu soal = 6. Jawaban akhir yang benar **hanya** mendapat poin tahapan jawaban akhir, **tidak** otomatis memberi skor penuh.
- **Kesetaraan nilai matematika, bukan kesamaan teks.** Jawaban angka diubah dulu menjadi nilai, lalu dibandingkan dengan nilai kunci. Contoh: `400000`, `400.000`, dan `Rp400.000` setara.
- **Normalisasi (PP-09):** mengenali `Rp`, pemisah ribuan titik, desimal koma, tanda `%`, dan satuan waktu (tahun/bulan/hari) beserta konversinya (KF-02: 1 tahun = 12 bulan = 365 hari).
- **Tidak menganggap salah karena format.** Jawaban dalam bentuk lain yang benar, misalnya pecahan atau satuan lain yang setara, dinilai sesuai nilainya, **sejauh rubrik mengizinkan bentuk tersebut** (PT-05).
- **Tidak mengarang skor.** Jika jawaban **ambigu** (misalnya `1.500` yang bisa berarti seribu lima ratus atau satu koma lima) atau **tidak dapat dikenali**, sistem **tidak** memberi skor otomatis. Tahapan itu diberi status **"menunggu penilaian manual"** (PT-03). Total skor soal dan tes ditandai **belum final** sampai semua tahapan punya skor.
- **Pencocokan kata kunci** boleh dipakai hanya sebagai **pemeriksaan pendukung**, tidak pernah sebagai satu-satunya dasar skor (PP-07).

Jenis pemeriksaan per tahapan, ditentukan dari rubrik saat instrumen dimasukkan:

| Jenis tahapan | Contoh isi tahapan | Cara pemeriksaan otomatis | Keandalan |
|---|---|---|---|
| **Nilai** | Besar bunga, jumlah tabungan akhir, lama menabung | Normalisasi lalu dibandingkan dengan kunci dalam batas toleransi (PT-04), dengan konversi satuan | **Andal** |
| **Ekspresi/perhitungan** | Substitusi angka ke rumus | Diurai sebagai ekspresi aritmetika yang **aman** (tanpa menjalankan kode), dihitung, lalu dibandingkan. Struktur rumus diperiksa jika rubrik mensyaratkannya. | **Cukup andal** untuk ekspresi aritmetika sederhana |
| **Pilihan/identifikasi** | Memilih yang diketahui/ditanya, memilih rumus | Kolom isian terstruktur (misalnya pilihan rumus atau kolom M, p, t), dicocokkan dengan kunci | **Andal**, **jika** rubrik memungkinkan isian terstruktur tanpa mengubah soal |
| **Uraian/penalaran** | Alasan, kesimpulan, evaluasi kewajaran | **Dinilai manual** oleh peneliti/guru berdasarkan rubrik asli (PT-03) | — |

**Penilaian gabungan otomatis + manual** (PT-03, diputuskan 12 November 2026: Pilihan A)

| No | Aturan |
|---|---|
| G1 | Tahapan yang **dapat diperiksa secara matematis** dan punya kriteria jawaban yang jelas (`nilai`, `ekspresi`, `pilihan`) **dinilai otomatis** oleh sistem. |
| G2 | Tahapan **uraian** yang membutuhkan penilaian alasan, penjelasan, atau interpretasi **dinilai manual oleh peneliti/guru** berdasarkan **rubrik asli**. |
| G3 | Sistem **tidak boleh** memberi skor otomatis jika kebenaran jawaban **tidak dapat dipastikan**. Tahapan seperti itu, misalnya angka ambigu atau tidak terbaca, dialihkan ke penilaian manual. |
| G4 | Setiap tahapan punya **status penilaian** yang membedakan: **dinilai otomatis**, **menunggu penilaian manual**, dan **sudah dinilai manual**. |
| G5 | Skor otomatis dan manual **digabungkan** menjadi skor akhir setiap soal (maks 6) dan total tes (maks 24). |
| G6 | Keputusan **PP-01 sampai PP-10 tetap berlaku**. |

Kesesuaian dengan PP-07: penilaian otomatis tetap menjadi cara utama untuk semua tahapan yang bisa diperiksa secara matematis, dan pencocokan kata kunci tetap tidak dipakai sebagai satu-satunya dasar skor. PT-03 hanya mengatur tahapan yang **tidak** bisa dipastikan oleh mesin, sehingga PP-07 tidak diubah.

Status penilaian per tahapan:

| Status | Arti | Skor |
|---|---|---|
| `otomatis` | Dinilai sistem dengan hasil pasti (benar, salah, atau sebagian menurut rubrik) | Terisi oleh sistem |
| `menunggu_manual` | Tahapan uraian (G2), atau tahapan angka/ekspresi yang tidak bisa dipastikan (G3) | **Kosong** |
| `dinilai_manual` | Sudah dinilai peneliti/guru berdasarkan rubrik asli | Terisi oleh penilai |

**Penanganan jawaban kosong** (keputusan tambahan PT-03, dikonfirmasi pengembang 12 November 2026)

| No | Aturan |
|---|---|
| G7 | Jawaban **kosong** pada **semua tahapan**, termasuk tahapan **uraian**, otomatis memperoleh **skor 0** (status `otomatis`, hasil `kosong`). |
| G8 | Jawaban kosong **tidak masuk antrean penilaian manual**. |
| G9 | Aturan ini berlaku untuk **pretest dan posttest**. |
| G10 | Jawaban yang **terisi** tetapi tidak dapat dipastikan kebenarannya tetap mengikuti aturan penilaian manual (`menunggu_manual`, G2–G3). |

Batasan "kosong" saat implementasi: tahapan yang tidak pernah diisi, atau isinya hanya spasi. Isian berupa tanda atau teks lain, misalnya "-", "?", atau "tidak tahu", **tidak** dianggap kosong. Isian seperti itu tetap mengikuti G10: dinilai otomatis jika pasti, atau dialihkan ke penilaian manual. *(Batasan ini adalah tafsiran teknis dan bisa diubah pengembang.)*
- Status tes menjadi **"menunggu penilaian manual"** selama masih ada tahapan `menunggu_manual`, lalu **"dinilai"** setelah semua tahapan punya skor. Skor total baru final setelah itu (G5).
- Pelaksanaan penilaian manual diatur PT-08 (di bawah).

**Pelaksanaan penilaian manual** (PT-08, diputuskan 12 November 2026)

| No | Aturan |
|---|---|
| M1 | Penilaian manual dilakukan lewat **halaman khusus penilaian di dalam Lanora**, bukan lewat dasbor Supabase. |
| M2 | **Peneliti dan guru** boleh mengakses halaman penilaian. **Siswa tidak boleh** mengaksesnya. |
| M3 | Selama penilaian manual belum selesai, siswa **hanya melihat status "Sedang dinilai"**, **tanpa skor sementara**. |
| M4 | Penilai **boleh mengoreksi skor otomatis** jika ditemukan kesalahan *(PT-18: koreksi hanya oleh peneliti)*. Setiap koreksi **wajib** mencatat: skor sebelum dan sesudah koreksi, **alasan** koreksi, **identitas penilai**, dan **waktu** koreksi. |
| M5 | Setiap jawaban **cukup dinilai oleh satu orang**, yaitu peneliti atau guru. |

Penerapan:

- **Penilai adalah peran tersendiri.** Akun penilai (peneliti/guru) berbeda dari akun siswa, dan hak aksesnya diperiksa di server untuk setiap permintaan. Menyembunyikan menu di tampilan saja tidak cukup (M2). Cara masuk, hak akses tiap peran, koreksi, dan keamanan akun diatur PT-14 sampai PT-20 (di bawah).
- **Tampilan siswa (M3).** Selama tes berstatus "menunggu penilaian manual", siswa hanya melihat "Sedang dinilai". **Tidak ada angka skor sama sekali**, termasuk skor soal yang sudah dinilai otomatis, karena skor itu pun masih bisa dikoreksi (M4). Setelah semua tahapan dinilai, skor gabungan tampil (PP-06, G5). *(Tafsiran ketat aturan M3, bisa diubah pengembang.)*
- **Koreksi skor otomatis (M4).** Tahapan yang dikoreksi berubah status menjadi `dinilai_manual`, karena skornya kini ditetapkan penilai. Ini tetap memakai tiga status PT-03 G4. Riwayat koreksi disimpan terpisah dan tidak bisa dihapus. Skor soal dan total dihitung ulang. Jika tes sudah berstatus "dinilai", skor yang dilihat siswa ikut berubah sesuai koreksi.
- **Satu penilai (M5).** Setiap tahapan dinilai oleh satu orang. Tidak ada penilaian ganda atau rata-rata antarpenilai. Jika dua penilai membuka tahapan yang sama bersamaan, hanya penyimpanan pertama yang diterima, dan penilai kedua diberi tahu bahwa tahapan sudah dinilai.
**Akun, anonimitas, koreksi, dan hak akses penilai** (PT-14 sampai PT-17, diputuskan 12 November 2026)

| Kode | No | Aturan |
|---|---|---|
| PT-14 | A1 | Peneliti dan guru **login dengan email dan kata sandi** (Supabase Auth). |
| | A2 | Akun penilai **dibuat oleh peneliti** melalui Supabase. |
| | A3 | **Tidak ada registrasi penilai bebas.** |
| | A4 | Kredensial guru **diberikan secara pribadi** oleh peneliti. |
| PT-15 | N1 | Penilai **tidak boleh melihat nama atau kode siswa**. |
| | N2 | Penilai **boleh mengetahui** apakah jawaban berasal dari **pretest atau posttest**. |
| | N3 | Sistem **tetap menyimpan** hubungan jawaban dengan akun siswa untuk penelitian. |
| PT-16 | K1 | Skor yang sudah **dinilai manual boleh dikoreksi kembali**. |
| | K2 | Setiap koreksi **wajib** mencatat skor lama, skor baru, alasan, identitas penilai, dan waktu koreksi. |
| | K3 | Riwayat koreksi **tidak boleh diubah atau dihapus**. |
| PT-17 | H1 | **Guru** hanya boleh **melihat antrean penilaian manual dan menilai jawaban**. |
| | H2 | Guru **tidak boleh** melihat seluruh hasil penelitian atau mengunduh CSV. |
| | H3 | **Peneliti** memiliki **akses penuh** ke hasil penelitian dan ekspor CSV. |

Penerapan:

- **Login penilai (A1–A4).** Layar masuk penilai terpisah dari layar masuk siswa. Penilai masuk dengan email dan kata sandi lewat Edge Function `masuk-penilai` (PT-21). Akun dibuat peneliti dengan alat pengelola yang terhubung ke Supabase, dan **pendaftaran mandiri dimatikan** di pengaturan Supabase Auth. Aturan "tanpa email pribadi" (KF-05 L4) hanya berlaku untuk siswa, jadi tidak bertentangan. Login siswa (kode + PIN, KF-05) tidak berubah.
- **Anonim bagi penilai (N1–N3).** Halaman penilaian **tidak pernah menerima** nama panggilan, kode siswa, **username** (KF-05f: username = nama tampilan, jadi termasuk identitas), `siswa.id`, atau kelas. Yang terlihat hanya jenis tes (pretest/posttest), nomor soal, tahapan, rubrik, dan jawaban. Hubungan ke akun siswa tetap tersimpan di database (`hasil_tes.siswa_id`) dan hanya dipakai untuk data penelitian peneliti (PP-10). *Catatan: jika siswa menuliskan namanya sendiri di dalam jawaban, nama itu ikut terlihat. Aplikasi tidak menyunting jawaban siswa.*
- **Koreksi (K1–K3, memperluas PT-08 M4).** Koreksi berlaku untuk skor `otomatis` maupun `dinilai_manual`. Semua koreksi tercatat di riwayat yang hanya bisa ditambah (*append-only*), lalu skor soal dan total dihitung ulang.
- **Hak akses (H1–H3):**

| Kemampuan | Siswa | Guru | Peneliti |
|---|---|---|---|
| Halaman penilaian: antrean `menunggu_manual` | ✕ | ✓ | ✓ |
| Menilai jawaban di antrean | ✕ | ✓ | ✓ |
| Menelusuri skor yang sudah dinilai untuk dikoreksi | ✕ | ✕ | ✓ |
| Mengoreksi skor otomatis atau manual | ✕ | ✕ (PT-18) | ✓ |
| Melihat seluruh hasil, riwayat koreksi, dan unduh CSV | ✕ | ✕ | ✓ |
| Mengelola akun penilai (buat, reset kata sandi, nonaktifkan/aktifkan kembali guru) dengan alat pengelola | ✕ | ✕ | ✓ (PT-14, PT-19 sampai PT-24) |

**Hak koreksi, pemulihan kata sandi, dan keamanan akun penilai** (PT-18 sampai PT-20, diputuskan 12 November 2026)

| Kode | No | Aturan |
|---|---|---|
| PT-18 | R1 | **Hanya peneliti** yang boleh mengoreksi skor, baik skor otomatis maupun skor manual. |
| | R2 | **Guru hanya boleh menilai** jawaban yang masuk antrean penilaian manual. |
| | R3 | Aturan satu penilai (M5) berlaku untuk **penilaian pertama**. Koreksi oleh peneliti adalah **proses terpisah** dan wajib tercatat dalam riwayat (K2–K3). |
| PT-19 | P1 | Penilai yang lupa kata sandi **menghubungi peneliti**. |
| | P2 | Peneliti **mereset kata sandi melalui Supabase**. |
| | P3 | **Tidak ada reset lewat email mandiri.** |
| PT-20 | S1 | Kata sandi penilai **minimal 12 karakter**. |
| | S2 | Maksimal **5 percobaan login gagal**, lalu akun **dikunci sementara 5 menit**. |
| | S3 | Peneliti dapat **menonaktifkan akun guru** setelah penelitian selesai. |

Penerapan:

- **Koreksi (R1–R3).** Ini menyelesaikan perbedaan PT-08 M4 ("penilai" boleh mengoreksi) dan PT-17 H1: kata "penilai" di M4 kini dibaca sebagai **peneliti**. Tahapan yang dikoreksi peneliti tetap berstatus `dinilai_manual` dengan `dinilai_oleh` = peneliti. Riwayat koreksi menyimpan status, skor, dan penilai sebelumnya, sehingga penilaian pertama tetap terlacak. Koreksi tidak dihitung sebagai "penilaian kedua" menurut M5.
- **Pemulihan kata sandi (P1–P3).** Layar masuk penilai tidak punya tautan "Lupa kata sandi". Pesan bantuan: "Lupa kata sandi? Hubungi peneliti." Kata sandi baru diberikan peneliti secara pribadi (A4) dan tidak dicatat di repositori atau dokumen. Fitur pemulihan lewat email di Supabase tidak dipakai, sehingga Lanora tidak bergantung pada kuota email Supabase. Reset dilakukan dengan alat pengelola khusus peneliti (PT-21 L4).
- **Kata sandi minimal 12 karakter (S1)** berlaku saat akun dibuat dan saat kata sandi direset. Aturan ini diperiksa oleh alat pengelola peneliti terhadap kata sandi yang diketik penilai, **bukan** terhadap kata sandi turunan yang disimpan Supabase (PT-21 L3).
- **Penguncian (S2)** mengikuti pola KF-05b siswa: dihitung per akun, berurutan, terkunci 5 menit setelah kegagalan ke-5, dan kembali ke 0 setelah login berhasil. Pesan saat terkunci: "Terlalu banyak percobaan. Coba lagi 5 menit lagi." Pesan login gagal tetap seragam, sehingga tidak membocorkan apakah sebuah email terdaftar. Penguncian diperiksa di Edge Function `masuk-penilai` (PT-21).
- **Penonaktifan (S3).** Peneliti mengubah `penilai.aktif` menjadi `false` (PT-22). Riwayat penilaian dan koreksi guru tersebut **tetap tersimpan** (K3).

**Pengamanan login dan penonaktifan akun penilai** (PT-21 dan PT-22, diputuskan 12 November 2026)

| Kode | No | Aturan |
|---|---|---|
| PT-21 | L1 | Login penilai **wajib melalui Edge Function `masuk-penilai`**. |
| | L2 | Penguncian 5 kali gagal selama 5 menit **diperiksa di server** dan **tidak boleh bisa dilewati** dengan login langsung ke Supabase. |
| | L3 | Autentikasi memakai **rahasia server**. Kata sandi asli dan rahasia server **tidak pernah** disimpan di frontend. |
| | L4 | Reset kata sandi dilakukan peneliti melalui **mekanisme pengelolaan khusus**. |
| PT-22 | D1 | Akun guru dinonaktifkan dengan **`aktif = false`**, **bukan** dengan menghapus akun. |
| | D2 | Edge Function **wajib menolak login** akun yang tidak aktif. |
| | D3 | **Sesi aktif guru dicabut** ketika akunnya dinonaktifkan. |
| | D4 | **Akun peneliti tidak ikut dinonaktifkan.** |

Penerapan:

- **Kata sandi turunan (L2–L3).** Kata sandi yang tersimpan di Supabase Auth bukan kata sandi yang diketik penilai, melainkan `HMAC(RAHASIA_PENILAI, "penilai-sandi:" + id akun + ":" + kata sandi)` (PT-24). Karena rahasia hanya ada di Edge Function dan komputer pengelola peneliti, kata sandi yang diketik penilai **tidak berguna** jika dipakai langsung ke layanan login Supabase. Satu-satunya jalan masuk adalah `masuk-penilai`, yang selalu memeriksa kunci lebih dulu. Ini pola yang sama dengan login siswa (KF-05).
- **Urutan di `masuk-penilai` (L1, L2, D2):** periksa kunci akun → cari penilai → tolak jika tidak aktif → periksa kata sandi turunan → perbarui hitungan gagal. Akun tidak aktif, email tidak terdaftar, dan kata sandi salah mendapat **jawaban yang sama**, dan semuanya dihitung untuk penguncian.
- **Alat pengelola peneliti (L4, A2, D1, D3).** Alat ini dijalankan di komputer peneliti (bukan di aplikasi, bukan di Netlify), memakai kunci *service role* dan rahasia server dari `.env` lokal. Kemampuannya: membuat akun penilai, mereset kata sandi (memeriksa minimal 12 karakter), dan menonaktifkan akun guru. Dasbor Supabase tidak dipakai untuk mengetik kata sandi penilai, karena dasbor tidak bisa menghitung kata sandi turunan.
- **Pencabutan sesi (D3).** Saat menonaktifkan, alat pengelola mengubah `aktif = false` lalu mencabut sesi guru di Supabase Auth, sehingga sesi tidak bisa diperpanjang. Selama sisa umur token akses, semua RPC penilai tetap menolak karena memeriksa `aktif` di setiap panggilan. Frontend yang menerima `BUKAN_PENILAI` langsung keluar dari sesi.
- **Akun peneliti (D4).** Alat pengelola hanya menonaktifkan akun berperan `guru`, dan menolak permintaan menonaktifkan akun `peneliti`. Akun peneliti tetap tunduk pada penguncian 5 kali gagal (S2).
- **Pendaftaran mandiri tetap mati** (PT-14 A3), sehingga tidak ada akun baru yang dibuat lewat layanan Supabase langsung.

**Email akun, rahasia server, dan pengaktifan kembali** (PT-23 dan PT-24, diputuskan 12 November 2026)

| Kode | No | Aturan |
|---|---|---|
| PT-23 | E1 | Akun penilai di Supabase Auth memakai **email internal yang tidak menerima email**. |
| | E2 | Login **hanya** melalui Edge Function `masuk-penilai`. |
| | E3 | **Tidak ada jalur login alternatif** lewat magic link atau OTP. |
| PT-24 | J1 | Akun penilai memakai **rahasia server terpisah**, yaitu **`RAHASIA_PENILAI`**. |
| | J2 | **`RAHASIA_KODE` tidak dipakai** untuk akun penilai. |
| | J3 | Akun guru yang sudah dinonaktifkan **boleh diaktifkan kembali**. |
| | J4 | **Hanya peneliti** yang boleh mengaktifkan atau menonaktifkan akun guru. |
| | J5 | **Riwayat penilaian tetap dipertahankan**, baik saat akun dinonaktifkan maupun diaktifkan kembali. |

Penerapan:

- **Dua jenis email (E1, PT-14 A1).** Penilai tetap **mengetik email aslinya** di layar masuk (A1). `masuk-penilai` mengubahnya menjadi `email_hash` untuk menemukan akun. Akun di Supabase Auth memakai email internal, misalnya `<uuid>@penilai.mathsave.invalid`, seperti akun siswa. Email asli **tidak disimpan** sebagai teks di database Lanora, hanya sebagai `email_hash`. Daftar email guru disimpan peneliti di luar repositori.
- **Tanpa jalur alternatif (E2–E3).** Karena email internal tidak bisa menerima surat, magic link, OTP email, dan email pemulihan tidak bisa sampai ke siapa pun. Selain itu, frontend tidak memanggil `signInWithOtp`, `signInWithPassword`, atau `resetPasswordForEmail` untuk penilai. Penyedia login lain di Supabase Auth (telepon, OAuth, masuk anonim) tidak diaktifkan.
- **Rahasia terpisah (J1–J2).** `RAHASIA_PENILAI` dipakai untuk `email_hash` dan kata sandi turunan penilai. Rahasia ini hanya ada sebagai *secret* Edge Function `masuk-penilai` dan di `.env` lokal peneliti untuk `kelola-penilai.js`, tidak pernah di frontend, repositori, atau Netlify. Rahasia siswa dan penilai saling terpisah, sehingga kebocoran salah satunya tidak membuka akun jenis lainnya. Jika `RAHASIA_PENILAI` diganti, semua kata sandi dan `email_hash` penilai harus dibuat ulang oleh peneliti.
- **Aktif kembali (J3–J5).** Peneliti menjalankan `kelola-penilai.js aktifkan` untuk akun berperan `guru`: `aktif = true` dan kunci login dikosongkan. Guru masuk lagi lewat `masuk-penilai` dengan kata sandi yang berlaku. Jika perlu, peneliti mereset kata sandinya (P2). Nilai yang pernah diberikan guru, `dinilai_oleh`, dan riwayat koreksi tidak berubah.
- **Hanya peneliti (J4).** Mengaktifkan dan menonaktifkan hanya bisa dilakukan dengan skrip pengelola, yang membutuhkan kunci *service role* dan `RAHASIA_PENILAI` di komputer peneliti. Tidak ada tombol, RPC, atau endpoint untuk itu di aplikasi, sehingga guru tidak bisa mengubah status akun mana pun.

- **Kesesuaian dengan PP-01 sampai PP-10:** rubrik yang dipakai penilai adalah rubrik asli (PP-01, PP-05). Pembahasan untuk siswa tetap baru tersedia setelah posttest (PP-06). Penilaian otomatis tetap cara utama (PP-07). Data CSV tetap memuat skor per tahapan beserta statusnya (PP-10), ditambah riwayat koreksi untuk peneliti.

**Pertanyaan terbuka teknis F-12** (belum diputuskan, tidak dikarang):

| Kode | Pertanyaan |
|---|---|
| PT-01 | **File instrumen.** File empat soal, kisi-kisi jawaban, dan rubrik Pak Aan **belum ada di folder proyek** (`referensi/` hanya berisi hasil wawancara). File ini dibutuhkan sebelum Fase 12A. |
| PT-02 | **Rincian tahapan rubrik.** Untuk setiap soal: berapa tahapan, berapa poin per tahapan (jumlahnya 6), dan apa bentuk jawaban tiap tahapan (angka, ekspresi, pilihan, atau uraian)? Diambil dari rubrik (PT-01). |
| PT-03 | ✅ **Diputuskan 12 November 2026 — Pilihan A: gabungan penilaian otomatis dan manual.** Tahapan yang bisa diperiksa secara matematis dinilai otomatis. Tahapan uraian, serta tahapan yang kebenarannya tidak bisa dipastikan sistem, dinilai manual oleh peneliti/guru berdasarkan rubrik asli. Status penilaian: `otomatis`, `menunggu_manual`, dan `dinilai_manual`. Skor keduanya digabungkan (maks 6 per soal, 24 total). Pilihan B (mengubah instrumen) dan C/D (model AI) **tidak** dipakai. **Tambahan:** jawaban kosong di semua tahapan, termasuk uraian, otomatis bernilai 0 dan tidak masuk antrean manual, untuk pretest maupun posttest (G7–G10). Rincian di "Penilaian gabungan otomatis + manual" di atas. |
| PT-04 | **Toleransi angka pada tahapan tes.** Apakah memakai aturan KF-19 (Rupiah ±1, persen/waktu ±0,01), atau toleransi yang tertulis di rubrik? |
| PT-05 | **Bentuk setara yang diterima.** Misalnya: suku bunga ditulis `6`, `6%`, atau `0,06`; lama ditulis `8 bulan` atau `2/3 tahun`. Bentuk mana yang dianggap benar di tiap tahapan, menurut rubrik? |
| PT-06 | **Skor lanjutan (*follow-through*).** Jika tahapan awal salah, tetapi tahapan berikutnya benar berdasarkan nilai yang salah itu, apakah tahapan berikutnya tetap diberi poin? |
| PT-07 | **Skor sebagian dalam satu tahapan.** Apakah satu tahapan bisa mendapat sebagian poinnya (misalnya 1 dari 2)? Jika bisa, apa kriterianya menurut rubrik? |
| PT-08 | ✅ **Diputuskan 12 November 2026.** (a) Penilaian manual lewat **halaman khusus di Lanora**. (b) **Peneliti dan guru** boleh mengakses, siswa tidak. (c) Selama penilaian belum selesai, siswa hanya melihat **"Sedang dinilai"** tanpa skor sementara. (d) Penilai **boleh mengoreksi skor otomatis**, dengan catatan wajib: skor sebelum/sesudah, alasan, identitas penilai, dan waktu. (e) Setiap jawaban dinilai **satu orang**. Rincian di "Pelaksanaan penilaian manual" (M1–M5). |
| PT-09 | **Pengaturan urutan pelaksanaan (T6, T7).** Apakah materi, latihan, dan kuis dikunci sampai pretest selesai? Siapa yang membuka posttest (peneliti atau otomatis), dan apa tanda "rangkaian pembelajaran selesai"? |
| PT-10 | **Selesai tes dan offline.** Perlu dialog konfirmasi sebelum Selesai tes? Bagaimana jawaban yang diketik saat internet putus: disimpan sementara di perangkat lalu dikirim saat tersambung, seperti KF-20? (Tes tidak punya batas waktu, jadi tidak ada penolakan karena terlambat.) |
| PT-11 | **Identitas di CSV.** Kolom identitas apa yang ikut di CSV: `siswa.id`, kode siswa (perlu dipetakan dari daftar peneliti karena kode asli tidak disimpan), nama panggilan, atau hanya ID anonim? *(Sejak KF-05f: kode siswa tidak dipakai lagi. Kandidatnya menjadi `siswa.id`, `username` (= nama tampilan), dan `kelas` pilihan siswa. Belum diputuskan. Lihat RS-05.)* |
| PT-12 | **Angka ambigu.** Untuk `1.500` atau `1,500` (ribuan atau desimal?), apakah selalu dialihkan ke penilaian manual (`menunggu_manual`, sesuai G3), atau ditafsirkan otomatis menurut konteks tahapan (misalnya tahapan Rupiah dianggap ribuan)? Sampai diputuskan, dipakai aturan yang aman: dialihkan ke penilaian manual. |
| PT-13 | **Rincian skor untuk siswa.** PP-06 menyebut siswa dapat melihat skor. Apakah yang ditampilkan cukup skor per soal dan total (rancangan saat ini), atau juga skor per tahapan? Skor per tahapan tetap tercatat untuk peneliti (PP-10). |
| PT-14 | ✅ **Diputuskan 12 November 2026.** Peneliti dan guru login dengan email + kata sandi. Akun dibuat peneliti lewat Supabase, tanpa registrasi bebas, dan kredensial guru diberikan secara pribadi (A1–A4). |
| PT-15 | ✅ **Diputuskan 12 November 2026.** Penilai tidak melihat nama atau kode siswa, tetapi boleh tahu pretest/posttest. Hubungan jawaban–akun tetap tersimpan untuk penelitian (N1–N3). |
| PT-16 | ✅ **Diputuskan 12 November 2026.** Skor yang sudah dinilai manual boleh dikoreksi kembali. Setiap koreksi mencatat skor lama, skor baru, alasan, penilai, dan waktu. Riwayat tidak bisa diubah atau dihapus (K1–K3). |
| PT-17 | ✅ **Diputuskan 12 November 2026.** Guru hanya melihat antrean penilaian manual dan menilai jawaban, tanpa akses ke seluruh hasil maupun CSV. Peneliti memiliki akses penuh (H1–H3). |
| PT-18 | ✅ **Diputuskan 12 November 2026.** Hanya peneliti yang mengoreksi skor otomatis maupun manual. Guru hanya menilai jawaban di antrean manual. M5 berlaku untuk penilaian pertama, dan koreksi peneliti adalah proses terpisah yang wajib tercatat (R1–R3). |
| PT-19 | ✅ **Diputuskan 12 November 2026.** Penilai yang lupa kata sandi menghubungi peneliti, lalu peneliti mereset lewat Supabase. Tidak ada reset lewat email mandiri (P1–P3). |
| PT-20 | ✅ **Diputuskan 12 November 2026.** Kata sandi minimal 12 karakter. Akun dikunci sementara 5 menit setelah 5 kali gagal login. Peneliti dapat menonaktifkan akun guru setelah penelitian selesai (S1–S3). |
| PT-21 | ✅ **Diputuskan 12 November 2026.** Login penilai wajib lewat Edge Function `masuk-penilai`. Penguncian 5 kali gagal/5 menit diperiksa di server dan tidak bisa dilewati lewat login langsung ke Supabase. Autentikasi memakai rahasia server, tanpa kata sandi asli atau rahasia di frontend. Reset oleh peneliti lewat mekanisme pengelolaan khusus (L1–L4). |
| PT-22 | ✅ **Diputuskan 12 November 2026.** Akun guru dinonaktifkan dengan `aktif = false`, bukan dihapus. Edge Function menolak login akun tidak aktif, dan sesi aktif guru dicabut saat dinonaktifkan. Akun peneliti tidak ikut dinonaktifkan (D1–D4). |
| PT-23 | ✅ **Diputuskan 12 November 2026.** Akun penilai di Supabase Auth memakai email internal yang tidak menerima email. Login hanya lewat `masuk-penilai`, tanpa jalur alternatif magic link atau OTP (E1–E3). |
| PT-24 | ✅ **Diputuskan 12 November 2026.** Akun penilai memakai rahasia server terpisah `RAHASIA_PENILAI`, bukan `RAHASIA_KODE`. Akun guru yang dinonaktifkan boleh diaktifkan kembali, hanya oleh peneliti, dan riwayat penilaian tetap dipertahankan (J1–J5). |

## 9. Kebutuhan Non-Fungsional

| Kode | Kebutuhan |
|---|---|
| NF-01 | **Bahasa**: seluruh teks antarmuka berbahasa Indonesia, kalimat pendek, dan menyapa siswa dengan "kamu". |
| NF-02 | **Responsif**: dirancang *mobile-first* untuk layar 360–412 px. Tetap dapat dipakai di tablet dan laptop. |
| NF-03 | **Kinerja**: halaman awal ringan. Three.js hanya dimuat ketika ilustrasi 3D dibuka. Target uji: halaman awal dapat dipakai dalam ±3 detik di Android kelas menengah dengan jaringan 4G (target, perlu diukur). |
| NF-04 | **Aksesibilitas**: kontras teks minimal WCAG AA, area sentuh minimal 48 × 48 px, status tidak hanya ditandai warna, dan menghormati pengaturan "kurangi gerakan". |
| NF-05 | **Keamanan**: Row Level Security aktif di semua tabel. Kunci jawaban tidak dikirim ke perangkat sebelum soal dijawab. Tidak ada kunci rahasia di kode frontend. |
| NF-06 | **Privasi**: data siswa minimal (nama panggilan dan kelas). Tanpa email, nomor telepon, atau foto. |
| NF-07 | **Biaya**: memakai paket gratis Supabase dan **Netlify Free** ($0, 300 credits per bulan dengan hard limit) selama memenuhi batasnya. Pemakaian credits Netlify dipantau selama penelitian, karena jika habis situs dijeda sampai bulan berikutnya (lihat [architecture.md](architecture.md) bagian 7). |
| NF-08 | **Ketepatan hitung**: semua perhitungan Rupiah dibulatkan ke rupiah terdekat. Fungsi hitung diuji dengan tes otomatis. |
| NF-09 | **Kesederhanaan visual**: mengikuti [design.md](design.md), yaitu 1 warna utama, tanpa animasi dekoratif, dan satu tujuan per layar. |

## 10. Alur Pengguna Utama

```
Daftar (KF-05f: kode kelas ──► pilih kelas + username + PIN + ulangi PIN; sekali per siswa) ──► langsung ke Beranda
   └─► Masuk (username + PIN)
   └─► Beranda ──► Belajar ──► Sub-bab (kartu langkah) ──► Contoh ──► Coba Sendiri
          │                                                     │
          │                                                     └─► (petunjuk / penjelasan kesalahan)
          ├─► Simulasi ──► (opsional) Ilustrasi 3D
          ├─► Latihan ──► Pilih sub-bab & tingkat ──► 5 soal ──► Ringkasan
          ├─► Kuis ──► 20 soal, 30 menit ──► Selesai Kuis / waktu habis ──► Nilai + pembahasan
          └─► Riwayat ──► Kesalahan tersering ──► tautan ke sub-bab
```

Urutan penelitian (KF-05e, F-12):

```
Pendaftaran pertama ──► PRETEST (4 soal ML) ──► rangkaian pembelajaran Lanora ──► POSTTEST (4 soal ML)
                         sebelum pembelajaran     (materi, simulasi, latihan, kuis)    setelah pembelajaran selesai
```

Cara aplikasi memastikan urutan ini (misalnya mengunci materi sampai pretest selesai, dan siapa yang membuka posttest) **belum diputuskan** (PT-09).

## 11. Kriteria Keberhasilan (usulan, perlu disepakati dengan dosen)

| Indikator | Cara ukur | Target usulan |
|---|---|---|
| Siswa dapat masuk dan membuka materi tanpa bantuan | Uji coba langsung | ≥ 90% peserta uji |
| Kemudahan penggunaan | Kuesioner SUS (System Usability Scale) versi Bahasa Indonesia | Skor rata-rata ≥ 68 |
| Kemampuan Mathematical Literacy meningkat | Pretest dan posttest **di dalam Lanora** (F-12, KF-05e): 4 soal, 4 indikator, total skor 0–24 | Ada peningkatan rata-rata skor total dan per indikator *(target dan uji statistik mengikuti rancangan penelitian, bukan keputusan aplikasi)* |
| Tampilan tidak membingungkan | Wawancara singkat setelah uji coba | Tidak ada keluhan utama soal warna/animasi |

## 12. Asumsi dan Hal yang Perlu Dikonfirmasi

### Asumsi

| Kode | Asumsi |
|---|---|
| AS-01 | Kebutuhan dari satu informan (S01) dipakai sebagai dasar awal. Rancangan akan divalidasi saat uji coba. |
| AS-02 | Siswa memakai smartphone Android dengan peramban Chrome versi terbaru dan koneksi internet. |
| AS-03 | Kode siswa (`S001`, …) dibuat dan dibagikan peneliti sebelum uji coba. Siswa membuat PIN sendiri saat pendaftaran pertama yang didampingi peneliti, memakai kode kelas (KF-05, KF-05d). Siswa tidak bisa membuat akun baru sendiri. |
| AS-04 | Suku bunga dalam soal dinyatakan **per tahun**, kecuali disebutkan lain di soal. |
| AS-05 | *(Digantikan KF-03, 12 November 2026.)* Notasi resmi: B = M × (p/100) × t dan A = M + B. Lihat F-02 "Notasi dan istilah resmi". |
| AS-06 | Bank soal latihan awal (±60 soal) disusun oleh pengembang dan diperiksa dosen atau guru. Bank soal kuis terpisah, minimal 40 soal (KF-14). |
| AS-07 | Frontend memakai JavaScript tanpa framework besar (Vite + JavaScript biasa) agar sesuai konteks mata kuliah Alpro. |
| AS-08 | Nilai kuis memakai skala 0–100 seperti spesifikasi sebelumnya, yaitu jumlah benar ÷ 20 × 100 (5 poin per soal). Keputusan kuis 11 November 2026 tidak menyebut skala nilai. |

### Perlu dikonfirmasi

| Kode | Pertanyaan | Kepada |
|---|---|---|
| KF-01 | ✅ **Diputuskan 12 November 2026 — Netlify Free.** Frontend (Vite + JavaScript) di-host di **Netlify paket Free ($0)** dan terhubung ke repositori GitHub untuk deployment otomatis. Database dan autentikasi tetap di Supabase. Batas paket: **300 credits per bulan dengan hard limit** (jika habis, situs dijeda sampai bulan berikutnya), dan setiap production deploy memakai 15 credits, sehingga pemakaian perlu dipantau selama penelitian. Build: `npm run build`, publish directory `dist`. Environment variables Supabase (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) diatur saat deployment. Deployment dilakukan di Fase 14. Ketentuan diperiksa 12 November 2026, rincian di architecture.md bagian 7. | Pengembang |
| KF-02 | ✅ **Diputuskan 12 November 2026: 1 tahun = 365 hari** (dasar kalender). Asumsi sementara sebelumnya kini menjadi keputusan resmi. Konversi waktu: t = banyak hari ÷ 365 dan t = banyak bulan ÷ 12 (sesuai notasi KF-03). Tahun kabisat tidak dibedakan. Rincian di F-02 "Notasi dan istilah resmi". | Pengembang |
| KF-03 | ✅ **Diputuskan 12 November 2026.** Simbol dan istilah resmi: **M** = modal awal, **B** = besar bunga, **p** = suku bunga per tahun, **t** = lama menabung (dalam tahun), **A** = jumlah tabungan akhir. Rumus: **B = M × (p/100) × t** dan **A = M + B**. Rincian, termasuk rumus mencari nilai yang belum diketahui, di F-02 "Notasi dan istilah resmi". | Pengembang |
| KF-04 | Posisi materi dalam kurikulum dan capaian pembelajaran yang dipakai sekolah (materi ini juga sering diajarkan di kelas VII). | Guru |
| KF-05 | ✅ **Diputuskan 12 November 2026: login memakai Kode Siswa + PIN.** Kode unik per siswa dibagikan peneliti, PIN per siswa (sejak KF-05d dibuat sendiri oleh siswa saat pendaftaran pertama), tanpa email pribadi. Setiap siswa hanya mengakses datanya sendiri. PIN disimpan dengan *hashing*, bukan teks biasa. Pesan salah login tidak membocorkan informasi. Mendukung penyimpanan hasil latihan, kuis, pretest, dan posttest per akun. Rincian di F-01. KF-05b (batas percobaan) sudah diputuskan: 5 kali gagal per akun, lalu dikunci 5 menit. KF-05c (lupa PIN) sudah diputuskan: reset dibantu guru/peneliti, siswa membuat PIN baru sendiri dengan akun dan data yang sama, tanpa fitur lupa PIN mandiri. KF-05d (format kode) sudah diputuskan: kode kelas `230706` hanya untuk pendaftaran pertama, kode siswa `S001`, `S002`, …, dan PIN dibuat siswa saat pendaftaran pertama. KF-05a (format PIN) sudah diputuskan: tepat 6 digit angka, diketik dua kali, ≠ kode kelas, tersamar, dan disimpan sesuai L6. Detail yang belum ditentukan: **KF-05e** (pretest/posttest di aplikasi). **Diubah oleh KF-05f (12 November 2026):** pendaftaran mandiri dengan kode kelas + pilihan kelas + username unik + PIN, dan login dengan username + PIN, tanpa kode siswa (F-01). | Pengembang |
| KF-06 | Izin penggunaan data siswa di bawah umur untuk uji coba (persetujuan sekolah atau orang tua). | Dosen/sekolah |
| KF-07 | Jumlah siswa dan kelas yang akan memakai aplikasi saat uji coba. | Dosen/guru |
| KF-08 | Apakah perlu menambah informan wawancara agar kebutuhan lebih representatif? | Dosen |
| KF-09 | Aturan pembulatan hasil (ke rupiah terdekat atau tanpa pembulatan). | Guru |
| KF-10 | ✅ **Diputuskan 11 November 2026.** Bentuk jawaban kuis: 20 soal = **15 pilihan ganda + 5 isian angka**. Hasil kedua bentuk menampilkan jawaban siswa, jawaban benar, dan pembahasan. Isian angka dinilai dengan toleransi perhitungan. Rincian di F-07. | Pengembang |
| KF-11 | ✅ **Diputuskan 11 November 2026.** Timer tetap berjalan saat aplikasi/browser ditutup atau internet putus. Siswa bisa melanjutkan selama waktu belum habis. Jika habis, kuis otomatis dikumpulkan berdasarkan **waktu server**, bukan jam perangkat. Waktu tidak diulang saat aplikasi dibuka kembali. Rincian di F-07 "Aturan timer". | Pengembang |
| KF-12 | ✅ **Diputuskan 11 November 2026.** Tingkat: mudah 6, sedang 10, sulit 4. Submateri: konsep 3, besar bunga 5, tabungan akhir 4, modal awal/suku bunga 4, lama menabung 2, penerapan sehari-hari 2. Bentuk tetap 15 pilihan ganda + 5 isian. Setiap pembagian berjumlah 20. Rincian di F-07 "Komposisi soal kuis". | Pengembang |
| KF-13 | ✅ **Diputuskan 12 November 2026.** Kuis maksimal **2 percobaan**. Setiap kuis yang berhasil dimulai dihitung satu percobaan, termasuk jika siswa keluar, menutup browser, offline, atau waktu habis. Kuis yang gagal dimulai tidak dihitung. Kedua hasil disimpan di Riwayat. Nilai utama adalah **nilai tertinggi**. Percobaan ketiga tidak bisa dimulai. Rincian di F-07 "Aturan pengulangan kuis". | Pengembang |
| KF-14 | ✅ **Diputuskan 12 November 2026.** Bank soal kuis minimal **40 soal berbeda**. Percobaan pertama dan kedua masing-masing 20 soal, tanpa soal yang sama untuk siswa yang sama. Keduanya mengikuti kisi-kisi KF-21. Jika bank kurang, kuis tidak dimulai. Rincian, termasuk sebaran minimum per kombinasi, di F-07 "Bank soal kuis". **Tambahan 12 November 2026:** bank soal latihan dan kuis **terpisah**. Latihan hanya memakai bank latihan, kuis hanya memakai bank kuis, dan latihan tidak memengaruhi ketersediaan bank kuis (F-07 "Pemisahan bank soal latihan dan kuis"). | Pengembang |
| KF-15 | ✅ **Diputuskan 12 November 2026 — sistem petunjuk dan pembahasan.** Petunjuk hanya di latihan, bertahap maksimal 3 tingkat (1: diketahui dan ditanya, 2: rumus/konsep, 3: langkah awal perhitungan), tidak pernah memberi jawaban akhir, dibuka sesuai kebutuhan, dan tidak tersedia selama kuis. Setelah jawaban latihan diperiksa, siswa mendapat pembahasan lengkap. Rincian di F-08. *(Pertanyaan yang sebelumnya bernomor KF-15 dipindah ke KF-22.)* | Pengembang |
| KF-16 | ✅ **Diputuskan 12 November 2026 — pilihan A1 + B1.** A1: dialog konfirmasi **selalu** muncul saat menekan Selesai Kuis, menampilkan jumlah dan nomor soal belum dijawab serta jawaban yang belum terkirim, dengan tombol Kembali ke soal / Ya, kumpulkan; timer tidak berhenti. B1: **satu** pengingat tenang saat sisa waktu 5 menit, berupa teks tanpa suara, kedip, atau warna merah, dihitung dari waktu server. Rincian di F-07 "Konfirmasi dan pengingat waktu". | Pengembang |
| KF-17 | ✅ **Diputuskan 12 November 2026 — pilihan C1 (keluar sementara).** ✕ Keluar (dan tombol kembali Android) memunculkan dialog yang menegaskan waktu tetap berjalan, dengan tombol Tetap di kuis / Keluar sementara. Keluar tidak mengumpulkan kuis dan tidak menghentikan timer. Kuis bisa dilanjutkan selama waktu belum habis. Jika habis, server mengumpulkannya otomatis. Rincian di F-07 "Keluar di tengah kuis". | Pengembang |
| KF-18 | ✅ **Diputuskan 12 November 2026 — pilihan D1 + E1.** Setiap soal pilihan ganda punya **4 opsi (A–D)** dengan 1 kunci. Urutan opsi **diacak per siswa** saat sesi dibuat, lalu **dikunci** untuk sesi itu (sama saat dilanjutkan dan di hasil). Jawaban disimpan dengan ID opsi tetap. Urutan soal ditetapkan kisi-kisi KF-21. Rincian di F-07 "Opsi pilihan ganda". | Pengembang |
| KF-19 | ✅ **Diputuskan 12 November 2026 — pilihan F1 + G1.** Toleransi isian angka: Rupiah **±1**, persen **±0,01**, tahun/bulan/hari **±0,01**, disimpan per soal. Kunci jawaban isian harus rapi: Rupiah bulat, persen paling banyak 1 desimal, lama menabung bulat dalam satuan yang ditanya. Jawaban tidak bulat seperti 7,5 bulan tidak dipakai di soal isian. Rincian di F-07 "Toleransi dan kunci jawaban isian angka". | Pengembang |
| KF-20 | ✅ **Diputuskan 11 November 2026 — Pilihan A: aturan ketat berdasarkan waktu penerimaan server.** Jawaban sah hanya jika sudah diterima dan tersimpan di server sebelum batas waktu. Jawaban offline hanya tersimpan sementara di perangkat dan belum resmi. Jawaban yang baru sampai setelah batas waktu ditolak. Jam perangkat tidak dipakai. Siswa diberi tahu dengan jelas bahwa jawaban offline belum terkirim. Rincian di F-07 "Aturan jawaban offline". | Pengembang |
| KF-21 | ✅ **Diputuskan 11 November 2026 — kisi-kisi tetap untuk 20 nomor soal kuis.** Setiap nomor punya submateri, tingkat, dan bentuk yang tetap. Soal diambil per nomor sesuai kisi-kisi, dan pengacakan hanya di antara variasi soal dalam kombinasi yang sama. Jika bank soal kurang, kategori tidak diganti otomatis dan kuis tidak dimulai. Kisi-kisi sesuai KF-12 dan KF-10. Rincian di F-07 "Kisi-kisi kuis". | Pengembang |
| KF-22 | ✅ **Diputuskan 12 November 2026 — pilihan N1 + R1** *(pertanyaan ini sebelumnya bernomor KF-15)*. Siswa bebas berpindah antarnomor (Sebelumnya/Berikutnya dan panel nomor 1–20) dan boleh mengubah jawaban sampai kuis dikumpulkan. Yang dinilai adalah jawaban terakhir yang diterima server sebelum batas waktu. Panel nomor menampilkan status Tersimpan / Belum terkirim / Belum dijawab, tanpa benar/salah. Tidak ada tanda ragu-ragu. Rincian di F-07 "Berpindah nomor dan mengubah jawaban". | Pengembang |
