/**
 * Router berbasis hash, misalnya "#/belajar/M3".
 * Dipilih agar aplikasi bisa di-host di hosting statis apa pun tanpa aturan rewrite
 * (docs/architecture.md bagian 2).
 *
 * Setiap rute punya:
 *  - pola       : contoh "/latihan/:subMateri/:tingkat"
 *  - muat       : fungsi yang mengembalikan modul halaman (import dinamis)
 *  - navigasi   : true jika navigasi bawah ditampilkan (design.md bagian 4)
 *  - menu       : menu navigasi bawah yang ditandai aktif
 *
 * Modul halaman wajib mengekspor:
 *   tampilkan(wadah, parameter) → boleh mengembalikan fungsi bersih-bersih
 *   (dipanggil saat pindah halaman, misalnya untuk dispose() Three.js nanti).
 */

/** Mengubah "#/belajar/M3?x=1" menjadi "/belajar/M3". */
export function ambilJalur(hash) {
  let jalur = (hash || '').replace(/^#/, '');
  jalur = jalur.split('?')[0];
  if (!jalur.startsWith('/')) jalur = '/' + jalur;
  // hapus garis miring di akhir, kecuali jalur akar "/"
  if (jalur.length > 1) jalur = jalur.replace(/\/+$/, '');
  return jalur;
}

/**
 * Mencocokkan jalur dengan daftar rute.
 * Mengembalikan { rute, parameter } atau null jika tidak ada yang cocok.
 */
export function cocokkanRute(jalur, daftarRute) {
  const bagianJalur = jalur.split('/').filter(Boolean);

  for (const rute of daftarRute) {
    const bagianPola = rute.pola.split('/').filter(Boolean);
    if (bagianPola.length !== bagianJalur.length) continue;

    const parameter = {};
    let cocok = true;

    for (let i = 0; i < bagianPola.length; i++) {
      const pola = bagianPola[i];
      const nilai = bagianJalur[i];
      if (pola.startsWith(':')) {
        try {
          parameter[pola.slice(1)] = decodeURIComponent(nilai);
        } catch {
          cocok = false; // jalur rusak, misalnya "%E0%A4%A"
          break;
        }
      } else if (pola !== nilai) {
        cocok = false;
        break;
      }
    }

    if (cocok) return { rute, parameter };
  }

  return null;
}

/**
 * Menjalankan router.
 * @param {object} opsi
 * @param {Array}  opsi.daftarRute
 * @param {string} opsi.ruteAwal         jalur saat hash kosong, contoh "/beranda"
 * @param {object} opsi.ruteTidakDitemukan rute cadangan untuk jalur yang tidak dikenal
 * @param {HTMLElement} opsi.wadah       elemen tempat halaman ditampilkan
 * @param {(info: {rute: object, jalur: string}) => void} [opsi.setelahPindah]
 * @param {(rute: object) => Promise<string|null>} [opsi.periksaAkses]
 *        mengembalikan jalur tujuan pengalihan (misalnya "/masuk"), atau null jika boleh dibuka
 */
export function mulaiRouter({ daftarRute, ruteAwal, ruteTidakDitemukan, wadah, setelahPindah, periksaAkses }) {
  let bersihkanHalamanSebelumnya = null;
  let nomorPindah = 0;

  async function tanganiPerubahan() {
    const nomorIni = ++nomorPindah;
    const jalur = ambilJalur(window.location.hash);

    if (jalur === '/') {
      // replace agar tombol Kembali Android tidak kembali ke hash kosong
      window.location.replace('#' + ruteAwal);
      return;
    }

    const hasil = cocokkanRute(jalur, daftarRute) || { rute: ruteTidakDitemukan, parameter: {} };

    if (periksaAkses) {
      const tujuan = await periksaAkses(hasil.rute);
      if (nomorIni !== nomorPindah) return;
      if (tujuan && tujuan !== jalur) {
        window.location.replace('#' + tujuan);
        return;
      }
    }

    let modul;
    try {
      modul = await hasil.rute.muat();
    } catch (galat) {
      console.error('Gagal memuat halaman:', galat);
      if (nomorIni !== nomorPindah) return;
      tampilkanGalatMuat(wadah);
      return;
    }

    // Abaikan jika siswa sudah pindah ke halaman lain selama modul dimuat
    if (nomorIni !== nomorPindah) return;

    if (typeof bersihkanHalamanSebelumnya === 'function') {
      try {
        bersihkanHalamanSebelumnya();
      } catch (galat) {
        console.error('Gagal membersihkan halaman sebelumnya:', galat);
      }
    }
    bersihkanHalamanSebelumnya = null;

    wadah.replaceChildren();
    bersihkanHalamanSebelumnya = modul.tampilkan(wadah, hasil.parameter) || null;

    window.scrollTo(0, 0);
    // Pindahkan fokus ke judul halaman agar pembaca layar (TalkBack) mengumumkannya
    const judul = wadah.querySelector('h1');
    if (judul) {
      judul.setAttribute('tabindex', '-1');
      judul.focus({ preventScroll: true });
    }

    if (setelahPindah) setelahPindah({ rute: hasil.rute, jalur });
  }

  window.addEventListener('hashchange', tanganiPerubahan);
  tanganiPerubahan();
}

function tampilkanGalatMuat(wadah) {
  wadah.replaceChildren();
  const bagian = document.createElement('section');
  bagian.className = 'halaman';
  bagian.innerHTML = `
    <h1>Halaman gagal dimuat</h1>
    <p>Periksa koneksi internetmu, lalu coba lagi.</p>
    <button type="button" class="tombol tombol-penuh">Coba lagi</button>
  `;
  bagian.querySelector('button').addEventListener('click', () => window.location.reload());
  wadah.append(bagian);
}
