/**
 * Blok tampilan materi dan pembahasan: kartu langkah (design.md 5.3), langkah contoh (5.4),
 * dan pembahasan 4 langkah (5.7, 5.9). Semua teks lewat textContent.
 */
import { el, tombol } from './elemen.js';
import { gambarMateri } from './gambarMateri.js';

export function kotakRumus(baris) {
  return el('div', { className: 'kotak-rumus' }, ...baris.map((b) => el('p', { teks: b })));
}

export function tabelMateri({ kepala, baris }) {
  return el('div', { className: 'wadah-tabel' },
    el('table', { className: 'tabel' },
      el('thead', {}, el('tr', {}, ...kepala.map((k) => el('th', { scope: 'col', teks: k })))),
      el('tbody', {}, ...baris.map((b) => el('tr', {}, ...b.map((s) => el('td', { teks: s })))))));
}

/** Isi satu kartu langkah materi. */
export function isiKartu(kartu) {
  return el('div', { className: 'kartu isi-kartu' },
    el('h2', { teks: kartu.judul }),
    ...kartu.teks.map((t) => el('p', { teks: t })),
    kartu.rumus ? kotakRumus(kartu.rumus) : null,
    kartu.tabel ? tabelMateri(kartu.tabel) : null,
    kartu.gambar ? gambarMateri(kartu.gambar) : null,
    kartu.catatan ? el('p', { className: 'keterangan', teks: kartu.catatan }) : null);
}

/** Satu langkah bernomor: "1 Pahami" + baris-barisnya. */
export function blokLangkah(nomor, langkah, baris) {
  return el('li', { className: 'langkah' },
    el('span', { className: 'penanda-langkah', teks: `${nomor} ${langkah}` }),
    ...baris.map((b) => el('p', { teks: b })));
}

/**
 * Pembahasan 4 langkah dari server: [{ langkah, isi }].
 * bertahap = true → langkah dibuka satu per satu dengan ketukan (design.md 5.7).
 */
export function daftarPembahasan(pembahasan, { bertahap = false } = {}) {
  const langkah = Array.isArray(pembahasan) ? pembahasan : [];
  const daftar = el('ol', { className: 'daftar-langkah' });
  const wadah = el('div', { className: 'pembahasan' }, el('h3', { teks: 'Pembahasan' }), daftar);
  if (langkah.length === 0) {
    daftar.append(el('li', { className: 'keterangan', teks: 'Pembahasan belum tersedia.' }));
    return wadah;
  }
  let terbuka = bertahap ? 1 : langkah.length;
  const tombolLanjut = bertahap ? tombol('', () => {
    terbuka += 1;
    gambar();
  }, { sekunder: true }) : null;

  function gambar() {
    daftar.replaceChildren(...langkah.slice(0, terbuka).map((l, i) =>
      blokLangkah(i + 1, l.langkah, [l.isi])));
    if (tombolLanjut) {
      tombolLanjut.hidden = terbuka >= langkah.length;
      tombolLanjut.textContent = `Tampilkan langkah ${terbuka + 1}`;
    }
  }
  gambar();
  if (tombolLanjut) wadah.append(tombolLanjut);
  return wadah;
}
