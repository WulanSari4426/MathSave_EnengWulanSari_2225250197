/**
 * Komponen formulir sederhana untuk layar Masuk, Daftar, dan Buat PIN baru.
 * Setiap kolom punya label yang terlihat (design.md bagian 11).
 */

let nomorKolom = 0;

/** Atribut kolom PIN (KF-05a P5): selalu tersamar, papan ketik angka, tanpa tombol tampilkan. */
export const ATRIBUT_PIN = {
  type: 'password',
  inputmode: 'numeric',
  maxlength: '6',
  pattern: '[0-9]{6}',
  autocomplete: 'off',
};

/** Kolom username (KF-05f). Huruf besar boleh diketik; server mengubahnya ke huruf kecil. */
export const ATRIBUT_USERNAME = {
  type: 'text',
  autocapitalize: 'none',
  autocomplete: 'off',
  autocorrect: 'off',
  spellcheck: 'false',
  maxlength: '20',
  placeholder: 'contoh: rani_08',
};

/** Kolom kode kelas (6 angka). Nilainya hanya disimpan di memori halaman, tidak di perangkat. */
export const ATRIBUT_KODE_KELAS = {
  type: 'text',
  inputmode: 'numeric',
  autocomplete: 'off',
  maxlength: '6',
  placeholder: '6 angka',
};

/** Menandai kolom bermasalah untuk pembaca layar dan memindahkan fokus ke sana. */
export function tandaiKolom(input, salah) {
  if (!input) return;
  if (salah) {
    input.setAttribute('aria-invalid', 'true');
    input.focus();
  } else {
    input.removeAttribute('aria-invalid');
  }
}

/**
 * @param {{ label: string, atribut?: Record<string,string> }} opsi
 * @returns {{ elemen: HTMLElement, input: HTMLInputElement }}
 */
export function buatKolom({ label, atribut = {}, keterangan = '' }) {
  nomorKolom += 1;
  const id = `kolom-${nomorKolom}`;
  const elemen = document.createElement('div');
  elemen.className = 'kolom-isian';

  const labelEl = document.createElement('label');
  labelEl.htmlFor = id;
  labelEl.textContent = label;

  const input = document.createElement('input');
  input.id = id;
  input.className = 'isian';
  for (const [nama, nilai] of Object.entries(atribut)) input.setAttribute(nama, nilai);

  elemen.append(labelEl, input);
  if (keterangan) {
    const ket = document.createElement('p');
    ket.id = `${id}-ket`;
    ket.className = 'keterangan';
    ket.textContent = keterangan;
    input.setAttribute('aria-describedby', ket.id);
    elemen.append(ket);
  }
  return { elemen, input };
}

/**
 * Pilihan kelas: <select> bawaan (ramah TalkBack dan Android) dengan <optgroup> per jenjang.
 * @param {Array<{label: string, kelas: Array<{id: number, nama: string}>}>} kelompok  dari kelompokkanKelas()
 * @returns {{ elemen: HTMLElement, input: HTMLSelectElement }}
 */
export function buatPilihanKelas(kelompok) {
  nomorKolom += 1;
  const id = `kolom-${nomorKolom}`;
  const elemen = document.createElement('div');
  elemen.className = 'kolom-isian';

  const labelEl = document.createElement('label');
  labelEl.htmlFor = id;
  labelEl.textContent = 'Kelasmu';

  const input = document.createElement('select');
  input.id = id;
  input.className = 'isian isian-pilihan';
  const awal = document.createElement('option');
  awal.value = '';
  awal.textContent = 'Pilih kelas';
  input.append(awal);
  for (const { label, kelas } of kelompok) {
    const grup = document.createElement('optgroup');
    grup.label = label;
    for (const k of kelas) {
      const opsi = document.createElement('option');
      opsi.value = String(k.id);
      opsi.textContent = k.nama; // textContent: nama dari server tidak ditafsirkan sebagai HTML
      grup.append(opsi);
    }
    input.append(grup);
  }

  elemen.append(labelEl, input);
  return { elemen, input };
}

/**
 * Kotak pesan galat dengan ikon ✕ dan teks (tidak hanya warna), diumumkan pembaca layar.
 * @returns {{ elemen: HTMLElement, tampilkan: (teks: string) => void, sembunyikan: () => void }}
 */
export function buatPesanGalat() {
  const elemen = document.createElement('p');
  elemen.className = 'pesan-galat';
  elemen.setAttribute('role', 'alert');
  elemen.hidden = true;
  return {
    elemen,
    tampilkan(teks) {
      elemen.replaceChildren();
      const ikon = document.createElement('span');
      ikon.className = 'pesan-galat-ikon';
      ikon.setAttribute('aria-hidden', 'true');
      ikon.textContent = '✕';
      const isi = document.createElement('span');
      isi.textContent = teks;
      elemen.append(ikon, isi);
      elemen.hidden = false;
    },
    sembunyikan() {
      elemen.hidden = true;
      elemen.replaceChildren();
    },
  };
}

/** Kepala layar fokus: tombol ✕ (kembali) dan judul. */
export function buatKepalaFokus(judul, kembaliKe) {
  const kepala = document.createElement('header');
  kepala.className = 'halaman-kepala';
  const baris = document.createElement('div');
  baris.className = 'kepala-fokus';
  const tutup = document.createElement('a');
  tutup.className = 'tombol tombol-ikon';
  tutup.href = kembaliKe;
  tutup.innerHTML =
    '<span class="ikon-tutup" aria-hidden="true">✕</span><span class="khusus-pembaca-layar">Kembali ke layar Masuk</span>';
  const h1 = document.createElement('h1');
  h1.textContent = judul;
  baris.append(tutup, h1);
  kepala.append(baris);
  return kepala;
}

/** Menonaktifkan tombol kirim selama permintaan berjalan, agar tidak terkirim dua kali. */
export function setelSibuk(tombol, sibuk, teksSibuk = 'Memproses…') {
  if (sibuk) {
    tombol.dataset.teksAsli = tombol.textContent;
    tombol.textContent = teksSibuk;
    tombol.disabled = true;
    tombol.setAttribute('aria-busy', 'true');
  } else {
    tombol.textContent = tombol.dataset.teksAsli ?? tombol.textContent;
    tombol.disabled = false;
    tombol.removeAttribute('aria-busy');
  }
}
