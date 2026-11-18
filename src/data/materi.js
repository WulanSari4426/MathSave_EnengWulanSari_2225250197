/**
 * Isi materi Lanora: kartu langkah, contoh langkah demi langkah, dan soal "Coba Sendiri"
 * untuk sub-bab P0, M1–M6 (PRD F-02, F-03; design.md 5.3, 5.4).
 *
 * STATUS: DRAF — wajib diperiksa dosen/guru sebelum dipakai uji coba (task.md Fase 6).
 *
 * Aturan isi:
 *  - Notasi resmi KF-03: M (modal awal), B (besar bunga), p (suku bunga per tahun),
 *    t (lama menabung, dalam tahun), A (jumlah tabungan akhir). Rumus B = M × (p/100) × t dan A = M + B.
 *    Tidak memakai "p%", "n", atau "Ma". Simbol A selalu ditulis bersama istilahnya.
 *  - 1 tahun = 12 bulan = 365 hari (KF-02). Bulan dibagi 12, hari dibagi 365, langsung ke tahun.
 *  - Satu kartu = satu ide, teks paling banyak ±60 kata (diperiksa tes).
 *  - Setiap angka contoh dan Coba Sendiri punya `data` agar tes menghitung ulang jawabannya
 *    dengan src/logika/bungaTunggal.js (satu-satunya tempat rumus, AGENTS.md §6).
 *
 * Bentuk:
 *  kartu:   { judul, teks: string[], rumus?: string[], tabel?: {kepala, baris}, gambar?: 'tabungan'|'garisWaktu' }
 *  contoh:  { judul, jenis: 'lengkap'|'setengah', soal, data, ditanya, jawaban,
 *             langkah: [{ langkah: 'Pahami'|'Rencanakan'|'Hitung'|'Periksa', baris: string[] }] (4 langkah),
 *             isian?: { langkah: 2, label, satuan, jawaban, toleransi } }   ← hanya contoh setengah jadi
 *  cobaSendiri: { soal, data, ditanya, satuan, label, jawaban, toleransi, pembahasan: string[] }
 */

export const LANGKAH = Object.freeze(['Pahami', 'Rencanakan', 'Hitung', 'Periksa']);

/** Toleransi KF-19: rupiah ±1, persen dan waktu ±0,01. */
export const TOLERANSI = Object.freeze({ rupiah: 1, persen: 0.01, tahun: 0.01, bulan: 0.01, hari: 0.01 });

export const MATERI = Object.freeze({
  // -------------------------------------------------------------------------
  P0: {
    id: 'P0',
    judul: 'Pemanasan',
    ringkas: 'Persen, perkalian bilangan besar, dan pecahan bulan',
    opsional: true,
    kartu: [
      {
        judul: 'Persen artinya per seratus',
        teks: ['Persen (%) artinya "per seratus". Jadi 6% sama dengan 6/100, atau 0,06.'],
        tabel: {
          kepala: ['Persen', 'Pecahan', 'Desimal'],
          baris: [['5%', '5/100', '0,05'], ['6%', '6/100', '0,06'], ['12%', '12/100', '0,12']],
        },
      },
      {
        judul: 'Menghitung persen dari suatu jumlah',
        teks: [
          'Untuk mencari 6% dari Rp500.000, kalikan Rp500.000 dengan 6/100.',
          'Cara mudah: bagi 100 dulu, lalu kalikan. 500.000 ÷ 100 = 5.000, lalu 5.000 × 6 = 30.000.',
        ],
        rumus: ['6% dari Rp500.000 = 500.000 × (6/100)', '= Rp30.000'],
      },
      {
        judul: 'Mengalikan bilangan besar',
        teks: [
          'Pisahkan dulu angka nolnya. Untuk 2.000.000 × 6, hitung 2 × 6 = 12.',
          'Lalu tambahkan kembali enam angka nol. Hasilnya 12.000.000.',
        ],
        rumus: ['2.000.000 × 6 = 12.000.000'],
      },
      {
        judul: 'Bulan menjadi pecahan tahun',
        teks: ['1 tahun = 12 bulan. Jadi banyak bulan dibagi 12. Sederhanakan pecahannya jika bisa.'],
        tabel: {
          kepala: ['Bulan', 'Dalam tahun'],
          baris: [['3 bulan', '3/12 = 1/4 tahun'], ['6 bulan', '6/12 = 1/2 tahun'], ['8 bulan', '8/12 = 2/3 tahun']],
        },
      },
      {
        judul: 'Hari menjadi pecahan tahun',
        teks: [
          'Di Lanora, 1 tahun = 365 hari. Jadi banyak hari dibagi 365.',
          'Contoh: 73 hari = 73/365 = 1/5 tahun. Jangan mengubah hari ke bulan lewat angka 30.',
        ],
      },
    ],
    contoh: [],
    cobaSendiri: {
      soal: 'Berapa 5% dari Rp400.000?',
      data: { modal: 400000, sukuBunga: 5, lama: 1, satuan: 'tahun' },
      ditanya: 'bunga',
      satuan: 'rupiah',
      label: 'Jawabanmu (Rp)',
      jawaban: 20000,
      toleransi: TOLERANSI.rupiah,
      pembahasan: ['5% dari Rp400.000 = 400.000 × (5/100).', '400.000 ÷ 100 = 4.000, lalu 4.000 × 5 = 20.000.', 'Jadi hasilnya Rp20.000.'],
    },
  },

  // -------------------------------------------------------------------------
  M1: {
    id: 'M1',
    judul: 'Mengenal tabungan dan bunga',
    ringkas: 'Istilah dan simbol: M, B, p, t, A',
    kartu: [
      {
        judul: 'Menabung dan bunga',
        teks: [
          'Saat kamu menabung di bank atau koperasi, uangmu disimpan di sana.',
          'Bank atau koperasi lalu memberi tambahan uang. Tambahan uang ini disebut bunga.',
        ],
        gambar: 'tabungan',
      },
      {
        judul: 'Lima istilah penting',
        teks: ['Istilah dan simbol ini dipakai di semua materi dan soal.'],
        tabel: {
          kepala: ['Simbol', 'Istilah', 'Artinya'],
          baris: [
            ['M', 'Modal awal', 'Uang yang pertama kali ditabung (Rp)'],
            ['B', 'Besar bunga', 'Tambahan uang dari bank atau koperasi (Rp)'],
            ['p', 'Suku bunga per tahun', 'Persen bunga dalam satu tahun'],
            ['t', 'Lama menabung', 'Lama uang ditabung, dalam tahun'],
            ['A', 'Jumlah tabungan akhir', 'Uang setelah ditambah bunga (Rp)'],
          ],
        },
      },
      {
        judul: 'Suku bunga selalu per tahun',
        teks: [
          '"Suku bunga 6% per tahun" artinya dalam satu tahun, bunganya 6% dari modal awal.',
          'Suku bunga ditulis sebagai angka persennya: p = 6, bukan 0,06.',
        ],
      },
      {
        judul: 'Bunga tunggal',
        teks: [
          'Pada bunga tunggal, bunga selalu dihitung dari modal awal saja.',
          'Karena itu, bunga bertambah sama besar setiap tahun.',
        ],
        tabel: {
          kepala: ['Tahun ke-', 'Bunga tahun itu', 'Total bunga'],
          baris: [['1', 'Rp100.000', 'Rp100.000'], ['2', 'Rp100.000', 'Rp200.000'], ['3', 'Rp100.000', 'Rp300.000']],
        },
        catatan: 'Contoh: modal awal Rp1.000.000 dengan suku bunga 10% per tahun.',
      },
      {
        judul: 'Membaca soal tabungan',
        teks: [
          '"Rani menabung Rp1.000.000 di koperasi dengan suku bunga 6% per tahun selama 2 tahun."',
          'Dari kalimat ini: M = Rp1.000.000, p = 6, dan t = 2. Yang belum diketahui adalah besar bunga (B) dan jumlah tabungan akhir (A).',
        ],
      },
    ],
    contoh: [],
    cobaSendiri: {
      soal: 'Dimas menabung Rp500.000 di koperasi dengan suku bunga 10% per tahun. Berapa besar bunga yang Dimas terima dalam 1 tahun?',
      data: { modal: 500000, sukuBunga: 10, lama: 1, satuan: 'tahun' },
      ditanya: 'bunga',
      satuan: 'rupiah',
      label: 'Besar bunga (Rp)',
      jawaban: 50000,
      toleransi: TOLERANSI.rupiah,
      pembahasan: ['Suku bunga 10% per tahun berarti bunga satu tahun = 10% dari modal awal.', '500.000 × (10/100) = 50.000.', 'Jadi besar bunga dalam 1 tahun adalah Rp50.000.'],
    },
  },

  // -------------------------------------------------------------------------
  M2: {
    id: 'M2',
    judul: 'Rumus bunga tunggal',
    ringkas: 'B = M × (p/100) × t, waktu dalam tahun',
    kartu: [
      {
        judul: 'Rumus bunga tunggal',
        teks: ['Besar bunga dihitung dengan rumus di bawah. t harus dalam tahun.'],
        rumus: ['B = M × (p/100) × t'],
        tabel: {
          kepala: ['Simbol', 'Artinya'],
          baris: [['B', 'Besar bunga'], ['M', 'Modal awal'], ['p', 'Suku bunga per tahun'], ['t', 'Lama menabung (tahun)']],
        },
      },
      {
        judul: 'Tiga langkah menghitung',
        teks: [
          '1. Tulis nilai M, p, dan t dari soal.',
          '2. Masukkan angkanya ke rumus.',
          '3. Hitung: bagi p dengan 100, lalu kalikan dengan M dan t.',
        ],
      },
      {
        judul: 'Periksa hasilmu',
        teks: [
          'Bunga 2 tahun sama dengan 2 kali bunga 1 tahun.',
          'Jika suku bunga di bawah 100, bunga satu tahun selalu lebih kecil dari modal awal.',
          'Jika hasilmu terlalu besar, periksa lagi apakah p sudah dibagi 100.',
        ],
      },
    ],
    contoh: [
      {
        judul: 'Contoh 1',
        jenis: 'lengkap',
        soal: 'Rani menabung Rp2.000.000 di koperasi sekolah dengan suku bunga 6% per tahun. Berapa besar bunga setelah 3 tahun?',
        data: { modal: 2000000, sukuBunga: 6, lama: 3, satuan: 'tahun' },
        ditanya: 'bunga',
        jawaban: 360000,
        langkah: [
          { langkah: 'Pahami', baris: ['M = Rp2.000.000', 'p = 6', 't = 3 tahun', 'Ditanya: besar bunga (B)'] },
          { langkah: 'Rencanakan', baris: ['Lama menabung sudah dalam tahun.', 'B = M × (p/100) × t'] },
          { langkah: 'Hitung', baris: ['B = 2.000.000 × (6/100) × 3', 'B = 20.000 × 6 × 3', 'B = Rp360.000'] },
          { langkah: 'Periksa', baris: ['Bunga 1 tahun = Rp120.000.', 'Bunga 3 tahun = 3 × Rp120.000 = Rp360.000. Cocok.'] },
        ],
      },
      {
        judul: 'Contoh 2 (lengkapi sendiri)',
        jenis: 'setengah',
        soal: 'Budi menabung Rp1.500.000 di bank dengan suku bunga 8% per tahun. Berapa besar bunga setelah 2 tahun?',
        data: { modal: 1500000, sukuBunga: 8, lama: 2, satuan: 'tahun' },
        ditanya: 'bunga',
        jawaban: 240000,
        langkah: [
          { langkah: 'Pahami', baris: ['M = Rp1.500.000', 'p = 8', 't = 2 tahun', 'Ditanya: besar bunga (B)'] },
          { langkah: 'Rencanakan', baris: ['B = M × (p/100) × t'] },
          { langkah: 'Hitung', baris: ['B = 1.500.000 × (8/100) × 2', 'B = 15.000 × 8 × 2', 'B = Rp240.000'] },
          { langkah: 'Periksa', baris: ['Bunga 1 tahun = Rp120.000, jadi 2 tahun = Rp240.000. Cocok.'] },
        ],
        isian: { langkah: 2, tampil: 2, label: 'B (Rp)', satuan: 'rupiah', jawaban: 240000, toleransi: TOLERANSI.rupiah },
      },
    ],
    cobaSendiri: {
      soal: 'Sinta menabung Rp3.000.000 di bank dengan suku bunga 5% per tahun. Berapa besar bunga setelah 2 tahun?',
      data: { modal: 3000000, sukuBunga: 5, lama: 2, satuan: 'tahun' },
      ditanya: 'bunga',
      satuan: 'rupiah',
      label: 'Besar bunga (Rp)',
      jawaban: 300000,
      toleransi: TOLERANSI.rupiah,
      pembahasan: ['M = Rp3.000.000, p = 5, t = 2.', 'B = 3.000.000 × (5/100) × 2 = 30.000 × 5 × 2 = 300.000.', 'Jadi besar bunga Rp300.000.'],
    },
  },

  // -------------------------------------------------------------------------
  M3: {
    id: 'M3',
    judul: 'Waktu dalam bulan dan hari',
    ringkas: 'Ubah dulu ke tahun: bulan ÷ 12, hari ÷ 365',
    kartu: [
      {
        judul: 't selalu dalam tahun',
        teks: ['Suku bunga ditulis per tahun. Jika lama menabung dalam bulan atau hari, ubah dulu ke tahun.'],
        rumus: ['1 tahun = 12 bulan', '6 bulan = 6/12 tahun', '8 bulan = 8/12 tahun'],
        gambar: 'garisWaktu',
      },
      {
        judul: 'Dari bulan ke tahun',
        teks: ['Bagi banyak bulan dengan 12.'],
        rumus: ['t = banyak bulan ÷ 12'],
        tabel: { kepala: ['Lama', 't (tahun)'], baris: [['3 bulan', '3/12'], ['9 bulan', '9/12'], ['18 bulan', '18/12']] },
      },
      {
        judul: 'Dari hari ke tahun',
        teks: ['Di Lanora, 1 tahun = 365 hari. Bagi banyak hari dengan 365, langsung ke tahun. Jangan lewat angka 30.'],
        rumus: ['t = banyak hari ÷ 365', '73 hari → t = 73/365'],
      },
      {
        judul: 'Kesalahan yang sering terjadi',
        teks: [
          'Menulis t = 8 untuk 8 bulan membuat bunga 12 kali terlalu besar.',
          'Biasakan bertanya: "Lama menabungnya sudah dalam tahun?" Jika belum, ubah dulu.',
        ],
      },
    ],
    contoh: [
      {
        judul: 'Contoh 1',
        jenis: 'lengkap',
        soal: 'Rani menabung Rp2.000.000 di koperasi dengan suku bunga 6% per tahun. Berapa besar bunga setelah 8 bulan?',
        data: { modal: 2000000, sukuBunga: 6, lama: 8, satuan: 'bulan' },
        ditanya: 'bunga',
        jawaban: 80000,
        langkah: [
          { langkah: 'Pahami', baris: ['M = Rp2.000.000', 'p = 6', 'Lama = 8 bulan', 'Ditanya: besar bunga (B)'] },
          { langkah: 'Rencanakan', baris: ['Lama dalam bulan, jadi t = 8/12 tahun.', 'B = M × (p/100) × t'] },
          { langkah: 'Hitung', baris: ['B = 2.000.000 × (6/100) × (8/12)', 'B = 120.000 × 8/12', 'B = Rp80.000'] },
          { langkah: 'Periksa', baris: ['Bunga 1 tahun = Rp120.000.', '8 bulan kurang dari 1 tahun, jadi bunganya harus kurang dari Rp120.000. Rp80.000 masuk akal.'] },
        ],
      },
      {
        judul: 'Contoh 2 (lengkapi sendiri)',
        jenis: 'setengah',
        soal: 'Dimas menabung Rp3.650.000 di bank dengan suku bunga 10% per tahun. Berapa besar bunga setelah 73 hari?',
        data: { modal: 3650000, sukuBunga: 10, lama: 73, satuan: 'hari' },
        ditanya: 'bunga',
        jawaban: 73000,
        langkah: [
          { langkah: 'Pahami', baris: ['M = Rp3.650.000', 'p = 10', 'Lama = 73 hari', 'Ditanya: besar bunga (B)'] },
          { langkah: 'Rencanakan', baris: ['Lama dalam hari, jadi t = 73/365 tahun.', 'B = M × (p/100) × t'] },
          { langkah: 'Hitung', baris: ['B = 3.650.000 × (10/100) × (73/365)', 'B = 365.000 × 73/365', 'B = Rp73.000'] },
          { langkah: 'Periksa', baris: ['Bunga 1 tahun = Rp365.000. 73 hari = 1/5 tahun, dan Rp365.000 ÷ 5 = Rp73.000. Cocok.'] },
        ],
        isian: { langkah: 2, tampil: 2, label: 'B (Rp)', satuan: 'rupiah', jawaban: 73000, toleransi: TOLERANSI.rupiah },
      },
    ],
    cobaSendiri: {
      soal: 'Lina menabung Rp1.200.000 di koperasi sekolah dengan suku bunga 5% per tahun. Berapa besar bunga setelah 6 bulan?',
      data: { modal: 1200000, sukuBunga: 5, lama: 6, satuan: 'bulan' },
      ditanya: 'bunga',
      satuan: 'rupiah',
      label: 'Besar bunga (Rp)',
      jawaban: 30000,
      toleransi: TOLERANSI.rupiah,
      pembahasan: ['6 bulan = 6/12 tahun.', 'B = 1.200.000 × (5/100) × (6/12) = 60.000 × 6/12 = 30.000.', 'Jadi besar bunga Rp30.000.'],
    },
  },

  // -------------------------------------------------------------------------
  M4: {
    id: 'M4',
    judul: 'Jumlah tabungan akhir',
    ringkas: 'A = M + B',
    kartu: [
      {
        judul: 'Jumlah tabungan akhir (A)',
        teks: ['Jumlah tabungan akhir adalah uang di tabungan setelah ditambah bunga.'],
        rumus: ['A = M + B', 'Jumlah tabungan akhir = modal awal + besar bunga'],
      },
      {
        judul: 'Dua langkah',
        teks: [
          '1. Hitung besar bunga dulu: B = M × (p/100) × t.',
          '2. Tambahkan bunga ke modal awal: A = M + B.',
        ],
      },
      {
        judul: 'Bunga atau tabungan akhir?',
        teks: [
          'Baca pertanyaannya dengan teliti.',
          '"Berapa bunganya?" → yang dicari B.',
          '"Berapa jumlah tabungannya sekarang?" atau "Berapa tabungan akhirnya?" → yang dicari jumlah tabungan akhir (A).',
        ],
      },
    ],
    contoh: [
      {
        judul: 'Contoh 1',
        jenis: 'lengkap',
        soal: 'Dimas menabung Rp1.500.000 di bank dengan suku bunga 8% per tahun. Berapa jumlah tabungan Dimas setelah 9 bulan?',
        data: { modal: 1500000, sukuBunga: 8, lama: 9, satuan: 'bulan' },
        ditanya: 'tabungan_akhir',
        jawaban: 1590000,
        langkah: [
          { langkah: 'Pahami', baris: ['M = Rp1.500.000', 'p = 8', 'Lama = 9 bulan', 'Ditanya: jumlah tabungan akhir (A)'] },
          { langkah: 'Rencanakan', baris: ['t = 9/12 tahun.', 'Hitung B = M × (p/100) × t, lalu A = M + B.'] },
          { langkah: 'Hitung', baris: ['B = 1.500.000 × (8/100) × (9/12) = 120.000 × 9/12 = Rp90.000', 'A = 1.500.000 + 90.000 = Rp1.590.000'] },
          { langkah: 'Periksa', baris: ['Jumlah tabungan akhir lebih besar dari modal awal, dan selisihnya Rp90.000 = besar bunga. Cocok.'] },
        ],
      },
      {
        judul: 'Contoh 2 (lengkapi sendiri)',
        jenis: 'setengah',
        soal: 'Ayu menabung Rp2.400.000 di koperasi dengan suku bunga 5% per tahun. Berapa jumlah tabungan akhir setelah 2 tahun?',
        data: { modal: 2400000, sukuBunga: 5, lama: 2, satuan: 'tahun' },
        ditanya: 'tabungan_akhir',
        jawaban: 2640000,
        langkah: [
          { langkah: 'Pahami', baris: ['M = Rp2.400.000', 'p = 5', 't = 2 tahun', 'Ditanya: jumlah tabungan akhir (A)'] },
          { langkah: 'Rencanakan', baris: ['Hitung B dulu, lalu A = M + B.'] },
          { langkah: 'Hitung', baris: ['B = 2.400.000 × (5/100) × 2 = Rp240.000', 'A = 2.400.000 + 240.000', 'A = Rp2.640.000'] },
          { langkah: 'Periksa', baris: ['A − M = Rp240.000 = besar bunga. Cocok.'] },
        ],
        isian: { langkah: 2, tampil: 2, label: 'Jumlah tabungan akhir A (Rp)', satuan: 'rupiah', jawaban: 2640000, toleransi: TOLERANSI.rupiah },
      },
    ],
    cobaSendiri: {
      soal: 'Bayu menabung Rp1.000.000 di bank dengan suku bunga 12% per tahun. Berapa jumlah tabungan akhir setelah 6 bulan?',
      data: { modal: 1000000, sukuBunga: 12, lama: 6, satuan: 'bulan' },
      ditanya: 'tabungan_akhir',
      satuan: 'rupiah',
      label: 'Jumlah tabungan akhir (Rp)',
      jawaban: 1060000,
      toleransi: TOLERANSI.rupiah,
      pembahasan: ['t = 6/12 tahun.', 'B = 1.000.000 × (12/100) × (6/12) = 60.000.', 'A = 1.000.000 + 60.000 = 1.060.000. Jadi jumlah tabungan akhir Rp1.060.000.'],
    },
  },

  // -------------------------------------------------------------------------
  M5: {
    id: 'M5',
    judul: 'Mencari nilai yang belum diketahui',
    ringkas: 'Mencari M, p, atau t',
    kartu: [
      {
        judul: 'Rumus untuk mencari nilai lain',
        teks: ['Semua rumus ini berasal dari B = M × (p/100) × t dan A = M + B.'],
        tabel: {
          kepala: ['Dicari', 'Rumus'],
          baris: [
            ['Modal awal (dari B)', 'M = B ÷ ((p/100) × t)'],
            ['Modal awal (dari A)', 'M = A ÷ (1 + (p/100) × t)'],
            ['Besar bunga (dari A)', 'B = A − M'],
            ['Suku bunga per tahun', 'p = (B × 100) ÷ (M × t)'],
            ['Lama menabung (tahun)', 't = (B × 100) ÷ (M × p)'],
          ],
        },
      },
      {
        judul: 'Langkah memilih rumus',
        teks: [
          '1. Tulis semua yang diketahui.',
          '2. Tentukan yang ditanya: M, p, atau t.',
          '3. Ubah lama menabung ke tahun dulu.',
          '4. Pilih rumus dari tabel, lalu hitung.',
        ],
      },
      {
        judul: 'Jika yang diketahui jumlah tabungan akhir',
        teks: [
          'Banyak soal memberi jumlah tabungan akhir (A), bukan bunga.',
          'Cari bunganya dulu: B = A − M. Setelah itu baru cari p atau t.',
        ],
      },
      {
        judul: 'Lama menabung dalam bulan',
        teks: [
          'Rumus t memberi hasil dalam tahun.',
          'Jika soal menanyakan bulan, kalikan hasilnya dengan 12. Contoh: t = 0,5 tahun = 0,5 × 12 = 6 bulan.',
        ],
      },
    ],
    contoh: [
      {
        judul: 'Contoh 1: mencari suku bunga',
        jenis: 'lengkap',
        soal: 'Rani menabung Rp2.000.000. Setelah 2 tahun, ia mendapat bunga Rp240.000. Berapa suku bunga per tahunnya?',
        data: { modal: 2000000, bunga: 240000, lama: 2, satuan: 'tahun' },
        ditanya: 'suku_bunga',
        jawaban: 6,
        langkah: [
          { langkah: 'Pahami', baris: ['M = Rp2.000.000', 'B = Rp240.000', 't = 2 tahun', 'Ditanya: suku bunga per tahun (p)'] },
          { langkah: 'Rencanakan', baris: ['p = (B × 100) ÷ (M × t)'] },
          { langkah: 'Hitung', baris: ['p = (240.000 × 100) ÷ (2.000.000 × 2)', 'p = 24.000.000 ÷ 4.000.000', 'p = 6, jadi 6% per tahun'] },
          { langkah: 'Periksa', baris: ['Dengan p = 6: B = 2.000.000 × (6/100) × 2 = Rp240.000. Sama dengan soal.'] },
        ],
      },
      {
        judul: 'Contoh 2: mencari modal awal',
        jenis: 'lengkap',
        soal: 'Budi mendapat bunga Rp90.000 setelah menabung 9 bulan dengan suku bunga 8% per tahun. Berapa modal awal Budi?',
        data: { bunga: 90000, sukuBunga: 8, lama: 9, satuan: 'bulan' },
        ditanya: 'modal',
        jawaban: 1500000,
        langkah: [
          { langkah: 'Pahami', baris: ['B = Rp90.000', 'p = 8', 'Lama = 9 bulan', 'Ditanya: modal awal (M)'] },
          { langkah: 'Rencanakan', baris: ['t = 9/12 tahun.', 'M = B ÷ ((p/100) × t)'] },
          { langkah: 'Hitung', baris: ['(8/100) × (9/12) = 0,06', 'M = 90.000 ÷ 0,06', 'M = Rp1.500.000'] },
          { langkah: 'Periksa', baris: ['B = 1.500.000 × (8/100) × (9/12) = Rp90.000. Sama dengan soal.'] },
        ],
      },
      {
        judul: 'Contoh 3 (lengkapi sendiri)',
        jenis: 'setengah',
        soal: 'Ayu menabung Rp1.000.000 dengan suku bunga 6% per tahun. Bunganya Rp30.000. Berapa bulan Ayu menabung?',
        data: { modal: 1000000, sukuBunga: 6, bunga: 30000 },
        ditanya: 'lama',
        satuanJawaban: 'bulan',
        jawaban: 6,
        langkah: [
          { langkah: 'Pahami', baris: ['M = Rp1.000.000', 'p = 6', 'B = Rp30.000', 'Ditanya: lama menabung, dalam bulan'] },
          { langkah: 'Rencanakan', baris: ['t = (B × 100) ÷ (M × p), hasilnya dalam tahun.', 'Lalu kalikan 12 untuk mendapat bulan.'] },
          { langkah: 'Hitung', baris: ['t = (30.000 × 100) ÷ (1.000.000 × 6)', 't = 3.000.000 ÷ 6.000.000 = 0,5 tahun', '0,5 × 12 = 6 bulan'] },
          { langkah: 'Periksa', baris: ['B = 1.000.000 × (6/100) × (6/12) = Rp30.000. Sama dengan soal.'] },
        ],
        isian: { langkah: 2, tampil: 2, label: 'Lama menabung (bulan)', satuan: 'bulan', jawaban: 6, toleransi: TOLERANSI.bulan },
      },
    ],
    cobaSendiri: {
      soal: 'Nina menabung Rp1.500.000. Setelah 2 tahun, bunganya Rp150.000. Berapa suku bunga per tahunnya?',
      data: { modal: 1500000, bunga: 150000, lama: 2, satuan: 'tahun' },
      ditanya: 'suku_bunga',
      satuan: 'persen',
      label: 'Suku bunga (% per tahun)',
      jawaban: 5,
      toleransi: TOLERANSI.persen,
      pembahasan: ['p = (B × 100) ÷ (M × t).', 'p = (150.000 × 100) ÷ (1.500.000 × 2) = 15.000.000 ÷ 3.000.000 = 5.', 'Jadi suku bunganya 5% per tahun.'],
    },
  },

  // -------------------------------------------------------------------------
  M6: {
    id: 'M6',
    judul: 'Strategi soal cerita',
    ringkas: 'Pahami → Rencanakan → Hitung → Periksa',
    kartu: [
      {
        judul: 'Empat langkah',
        teks: ['Setiap soal cerita bisa dikerjakan dengan empat langkah yang sama.'],
        tabel: {
          kepala: ['Langkah', 'Yang kamu lakukan'],
          baris: [
            ['1. Pahami', 'Tulis yang diketahui dan yang ditanya'],
            ['2. Rencanakan', 'Pilih rumus, ubah satuan waktu'],
            ['3. Hitung', 'Masukkan angka, hitung dengan teliti'],
            ['4. Periksa', 'Cek apakah hasilnya masuk akal'],
          ],
        },
      },
      {
        judul: '1. Pahami',
        teks: [
          'Baca soal dua kali. Tandai angka dan satuannya: rupiah, persen per tahun, bulan, atau hari.',
          'Lalu tulis yang ditanya: besar bunga, jumlah tabungan akhir, modal awal, suku bunga, atau lama menabung.',
        ],
      },
      {
        judul: '2. Rencanakan',
        teks: [
          'Pilih rumus yang sesuai dengan yang ditanya.',
          'Periksa satuan waktu. Jika dalam bulan atau hari, ubah dulu ke tahun.',
        ],
      },
      {
        judul: '3. Hitung dan 4. Periksa',
        teks: [
          'Masukkan angka ke rumus dan hitung pelan-pelan.',
          'Lalu periksa: apakah bunga lebih kecil dari bunga setahun jika waktunya kurang dari setahun? Apakah jumlah tabungan akhir lebih besar dari modal awal?',
        ],
      },
    ],
    contoh: [
      {
        judul: 'Contoh: membandingkan dua tawaran',
        jenis: 'lengkap',
        soal: 'Koperasi sekolah memberi suku bunga 6% per tahun. Bank memberi 5% per tahun. Tia ingin menabung Rp2.000.000 selama 1 tahun. Berapa selisih bunga dari kedua tempat itu?',
        // Untuk tes: selisih bunga = bunga dengan selisih suku bunga (6 − 5 = 1) pada M dan t yang sama.
        data: { modal: 2000000, sukuBunga: 1, lama: 1, satuan: 'tahun' },
        ditanya: 'bunga',
        jawaban: 20000,
        langkah: [
          { langkah: 'Pahami', baris: ['M = Rp2.000.000, t = 1 tahun', 'Koperasi p = 6, bank p = 5', 'Ditanya: selisih besar bunga'] },
          { langkah: 'Rencanakan', baris: ['Hitung B di masing-masing tempat dengan B = M × (p/100) × t, lalu kurangkan.'] },
          { langkah: 'Hitung', baris: ['Koperasi: B = 2.000.000 × (6/100) × 1 = Rp120.000', 'Bank: B = 2.000.000 × (5/100) × 1 = Rp100.000', 'Selisih = 120.000 − 100.000 = Rp20.000'] },
          { langkah: 'Periksa', baris: ['Selisih suku bunganya 1%, dan 1% dari Rp2.000.000 = Rp20.000. Cocok. Koperasi memberi bunga lebih besar.'] },
        ],
      },
    ],
    cobaSendiri: {
      soal: 'Tia ingin membeli sepeda seharga Rp1.590.000. Ia menabung Rp1.500.000 di bank dengan suku bunga 8% per tahun. Setelah berapa bulan jumlah tabungannya pas untuk membeli sepeda?',
      data: { modal: 1500000, sukuBunga: 8, bunga: 90000 },
      ditanya: 'lama',
      satuanJawaban: 'bulan',
      satuan: 'bulan',
      label: 'Lama menabung (bulan)',
      jawaban: 9,
      toleransi: TOLERANSI.bulan,
      pembahasan: [
        'Pahami: jumlah tabungan akhir yang diinginkan Rp1.590.000, jadi bunga yang dibutuhkan B = 1.590.000 − 1.500.000 = Rp90.000.',
        'Rencanakan dan hitung: t = (90.000 × 100) ÷ (1.500.000 × 8) = 9.000.000 ÷ 12.000.000 = 0,75 tahun = 0,75 × 12 = 9 bulan.',
        'Periksa: B = 1.500.000 × (8/100) × (9/12) = Rp90.000. Cocok.',
      ],
    },
  },
});

/** Urutan sub-bab (PRD F-02). */
export const URUTAN_SUB_MATERI = Object.freeze(['P0', 'M1', 'M2', 'M3', 'M4', 'M5', 'M6']);

/** Sub-bab yang punya latihan (bank latihan task.md Fase 7; M1 tidak punya latihan). */
export const SUB_MATERI_LATIHAN = Object.freeze(['P0', 'M2', 'M3', 'M4', 'M5', 'M6']);

/**
 * Urutan layar satu sub-bab: semua kartu, lalu contoh, lalu Coba Sendiri.
 * @returns {Array<{jenis: 'kartu'|'contoh'|'coba', indeks: number}>}
 */
export function susunLayar(subMateri) {
  const m = MATERI[subMateri];
  if (!m) return [];
  return [
    ...m.kartu.map((_, indeks) => ({ jenis: 'kartu', indeks })),
    ...m.contoh.map((_, indeks) => ({ jenis: 'contoh', indeks })),
    { jenis: 'coba', indeks: 0 },
  ];
}
