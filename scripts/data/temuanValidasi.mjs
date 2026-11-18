/**
 * Temuan pemeriksaan materi dan bank soal (13 November 2026), dipakai scripts/buat-paket-validasi.mjs.
 * Hasil audit: semua kunci benar; temuan di bawah menyangkut definisi tingkat, mutu pengecoh, dan variasi.
 * Tidak ada yang diperbaiki otomatis: isi soal hanya diubah setelah disetujui (AGENTS.md §6).
 */
export const TEMUAN = [
  {
    id: 'T-01', prioritas: 'Tinggi',
    judul: 'Definisi tingkat kesulitan belum seragam',
    rincian: 'PRD 3.1 menetapkan Tingkat 1 = mencari bunga, Tingkat 2 = tabungan akhir atau waktu bulan/hari, Tingkat 3 = mencari modal, suku bunga, atau waktu. Kisi-kisi KF-21 justru memuat "modal/suku bunga – mudah" (no. 4) dan "lama menabung – mudah" (no. 5). Bank soal mengikuti KF-21 dan memakai tingkat relatif di dalam setiap sub-bab (mudah = waktu dalam tahun dan angka sederhana; sedang = bulan; sulit = hari atau data jumlah tabungan akhir). Jika definisi PRD 3.1 dipakai untuk semua soal, 55 dari 94 soal hitungan berpindah tingkat.',
    soal: 'Semua soal (lihat label tingkat)',
    saran: 'Putuskan definisi yang berlaku (keputusan K-1), lalu label tingkat disesuaikan.',
  },
  {
    id: 'T-02', prioritas: 'Sedang',
    judul: 'Pengecoh pilihan ganda yang tidak masuk akal',
    rincian: 'Pengecoh yang diambil dari pola "persen tidak dibagi 100" atau "rumus invers" menghasilkan nilai mustahil, misalnya bunga Rp20.000.000 untuk modal Rp2.000.000 (KU-BUNGA-T1-PG-01), suku bunga 0,05% per tahun (KU-MODALP-T1-PG-01), lama 0,02 tahun (KU-LAMA-T1-PG-01), atau modal Rp3.240 (KU-MODALP-T2-PG-01). Siswa bisa membuang opsi ini tanpa menghitung, sehingga daya beda soal turun. Pengecoh "bunga dan tabungan akhir tertukar" tetap wajar dan sebaiknya dipertahankan.',
    soal: 'KU-BUNGA-T1-PG-01, KU-BUNGA-T1-PG-02, KU-BUNGA-T2-PG-01 s.d. -04, KU-MODALP-T1-PG-01, KU-MODALP-T1-PG-02, KU-MODALP-T2-PG-01, KU-MODALP-T2-PG-02, KU-MODALP-T3-PG-02, KU-LAMA-T1-PG-01, KU-LAMA-T1-PG-02, KU-TERAP-T2-PG-01, KU-TERAP-T3-PG-01',
    saran: 'Ganti dengan pengecoh yang dekat dan masuk akal, misalnya bunga 1 tahun saat waktu dalam bulan, atau hasil dengan t yang tertukar (12/8). Butuh persetujuan (K-2).',
  },
  {
    id: 'T-03', prioritas: 'Sedang',
    judul: 'Bank kuis tepat di batas minimum',
    rincian: 'Setiap kombinasi kisi-kisi berisi tepat 2 × jumlah nomor (total 40). Jika satu soal ditolak pada pemeriksaan ini atau dinonaktifkan nanti, kombinasinya kurang dan kuis tidak bisa dimulai (BANK_SOAL_KURANG) sampai soal pengganti ditambahkan.',
    soal: 'Seluruh bank kuis',
    saran: 'Tambahkan minimal 1 soal cadangan per kombinasi (17 soal), terutama untuk kombinasi yang dipakai 2 nomor. Butuh persetujuan (K-3).',
  },
  {
    id: 'T-04', prioritas: 'Sedang',
    judul: 'Soal latihan sama persis dengan Coba Sendiri di materi',
    rincian: 'P0-T1-01 (Rp400.000, 5% per tahun, 1 tahun) sama angka dan pertanyaannya dengan Coba Sendiri sub-bab P0.',
    soal: 'P0-T1-01',
    saran: 'Ganti angka soal latihan, misalnya Rp800.000 dengan 5%.',
  },
  {
    id: 'T-05', prioritas: 'Rendah',
    judul: 'Pengecoh umum yang tidak memberi diagnosis',
    rincian: 'Jika pola kesalahan kurang dari 3, opsi ditambah dengan nilai umum (misalnya 2 × kunci atau bunga 1 tahun). Opsi ini sah, tetapi bila dipilih siswa hanya mendapat pesan umum.',
    soal: 'KU-BUNGA-T1-PG-01, KU-BUNGA-T1-PG-02, KU-AKHIR-T1-PG-01, KU-AKHIR-T1-PG-02, KU-MODALP-T1-PG-01, KU-MODALP-T1-PG-02',
    saran: 'Periksa apakah pengecoh ini sudah wajar; bisa diganti bersama T-02.',
  },
  {
    id: 'T-06', prioritas: 'Rendah',
    judul: 'Redaksi dan variasi soal P0',
    rincian: 'Keenam soal P0 memakai satu pola kalimat ("… memberi bunga p% per tahun. Berapa bunga selama 1 tahun …"). Istilah resmi KF-03 adalah "besar bunga".',
    soal: 'P0-T1-01 s.d. P0-T3-02',
    saran: 'Gunakan "besar bunga" dan variasikan konteks (misalnya persen diskon atau persen dari uang saku), selama tetap melatih persen dari suatu jumlah.',
  },
  {
    id: 'T-07', prioritas: 'Rendah',
    judul: 'Cakupan kategori "penerapan sehari-hari" di kuis',
    rincian: 'Keempat soal penerapan berupa menabung untuk membeli barang (mencari lama, modal awal, atau jumlah tabungan akhir). Konteks membandingkan dua tawaran bunga baru ada di materi M6, belum ada di kuis.',
    soal: 'KU-TERAP-T2-PG-01, KU-TERAP-T2-PG-02, KU-TERAP-T3-PG-01, KU-TERAP-T3-PG-02',
    saran: 'Dosen/guru menilai apakah sudah mewakili indikator; jika perlu, tambah soal membandingkan dua tawaran (K-4).',
  },
  {
    id: 'T-08', prioritas: 'Rendah',
    judul: 'Kemiripan pola dengan contoh materi',
    rincian: 'Empat soal memakai modal, suku bunga, atau lama yang sama dengan contoh di materi M5, tetapi nilai yang diketahui berbeda sehingga jawabannya berbeda.',
    soal: 'M5-T1-02, KU-MODALP-T1-PG-01, KU-LAMA-T1-PG-01, KU-MODALP-T3-PG-01',
    saran: 'Boleh dipertahankan; ganti angka jika dosen menilai terlalu mirip contoh.',
  },
  {
    id: 'T-09', prioritas: 'Rendah',
    judul: 'Bilangan desimal di pembahasan',
    rincian: 'Pembahasan soal mencari modal awal dan lama menabung memuat desimal, misalnya (6/100) × (9/12) = 0,045 atau t = 1,25 tahun. Perhitungannya benar, tetapi perlu dinilai keterbacaannya untuk siswa kelas VIII.',
    soal: 'Soal M5, M6, dan kategori modal_suku_bunga / lama_menabung',
    saran: 'Pertahankan, atau ubah penyajian menjadi pecahan jika dinilai lebih mudah dipahami.',
  },
];

export const KEPUTUSAN = [
  {
    id: 'K-1', pertanyaan: 'Definisi tingkat kesulitan mana yang dipakai? (T-01)',
    pilihan: 'a) Tingkat relatif di setiap sub-bab, kisi-kisi KF-21 tetap (seperti sekarang). b) Definisi global PRD 3.1; label soal dan kisi-kisi KF-21 disesuaikan.',
  },
  {
    id: 'K-2', pertanyaan: 'Pengecoh yang tidak masuk akal diganti? (T-02, T-05)',
    pilihan: 'a) Ganti dengan pengecoh yang dekat dan masuk akal. b) Pertahankan.',
  },
  {
    id: 'K-3', pertanyaan: 'Tambah soal cadangan kuis? (T-03)',
    pilihan: 'a) Tambah 1 soal per kombinasi (total 57). b) Cukup 40 soal.',
  },
  {
    id: 'K-4', pertanyaan: 'Tambah soal penerapan "membandingkan dua tawaran" di kuis? (T-07)',
    pilihan: 'a) Ya. b) Tidak, cukup soal menabung untuk membeli barang.',
  },
];
