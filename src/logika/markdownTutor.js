/**
 * Pengurai Markdown untuk jawaban Tutor AI (modul murni, tanpa DOM, tanpa HTML).
 * Hasilnya pohon blok/inline berupa objek biasa yang dirender oleh komponen/isiTutor.js.
 * HTML mentah TIDAK pernah ditafsirkan: tag seperti <script> tetap menjadi teks biasa.
 *
 * Blok: paragraf (baris baru = baris baru), judul (#), daftar (-, *, +, 1.) termasuk bersarang,
 *       tabel (| a | b | + baris pemisah), rumus display ($$…$$ atau \[…\]), blok kode (```),
 *       kutipan (>), garis (---).
 * Inline: **tebal**, __tebal__, *miring*, _miring_, `kode`, $rumus$, \(rumus\), $$rumus$$, \[rumus\].
 */

const MAKS_KEDALAMAN_INLINE = 8;
const MAKS_KEDALAMAN_BLOK = 6;

const POLA_DAFTAR = /^(\s*)([-*+]|\d{1,9}[.)])\s+(.*)$/;
const POLA_PEMISAH_TABEL = /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$/;
const POLA_JUDUL = /^\s{0,3}(#{1,6})\s+(.*?)\s*#*\s*$/;
const POLA_GARIS = /^\s{0,3}([-*_])(\s*\1){2,}\s*$/;
const POLA_PAGAR = /^\s*```/;
const POLA_KUTIPAN = /^\s*>\s?/;

// ---------------------------------------------------------------------------
// Inline
// ---------------------------------------------------------------------------

const KARAKTER_ESCAPE = '\\`*_{}[]()#+-.!|$>~';

/** Indeks "$" penutup rumus inline, atau -1. Aturan: tidak diawali/diakhiri spasi, satu baris. */
function cariPenutupDolar(teks, mulai) {
  if (mulai >= teks.length || /\s|\$/.test(teks[mulai])) return -1;
  for (let k = mulai; k < teks.length; k += 1) {
    const c = teks[k];
    if (c === '\n') return -1;
    if (c === '\\') { k += 1; continue; }
    if (c === '$') {
      if (/\s/.test(teks[k - 1]) || /\d/.test(teks[k + 1] ?? '')) continue;
      return k;
    }
  }
  return -1;
}

/** Indeks penutup penekanan (*, _, **, __) atau -1. */
function cariPenutupTekanan(teks, mulai, penanda) {
  for (let k = teks.indexOf(penanda, mulai); k !== -1; k = teks.indexOf(penanda, k + 1)) {
    if (k <= mulai || /\s/.test(teks[k - 1])) continue;
    if (penanda.length === 1) {
      if (teks[k + 1] === penanda) { k += 1; continue; } // bagian dari ** / __
      if (penanda === '_' && /\w/.test(teks[k + 1] ?? '')) continue;
      if (teks.slice(mulai, k).includes('\n')) return -1;
    }
    return k;
  }
  return -1;
}

/**
 * @param {string} teks
 * @returns {Array<{jenis:'teks',teks:string}|{jenis:'tebal'|'miring',isi:any[]}|{jenis:'kode',teks:string}
 *   |{jenis:'rumus',tex:string,tampil:boolean}|{jenis:'baris_baru'}>}
 */
export function uraiInline(teks, kedalaman = 0) {
  const hasil = [];
  let penyangga = '';
  const simpanTeks = () => {
    if (penyangga) hasil.push({ jenis: 'teks', teks: penyangga });
    penyangga = '';
  };
  const n = teks.length;
  let i = 0;

  while (i < n) {
    const c = teks[i];

    if (c === '\n') {
      simpanTeks();
      hasil.push({ jenis: 'baris_baru' });
      i += 1;
      continue;
    }

    if (c === '\\') {
      const d = teks[i + 1];
      if (d === '(' || d === '[') {
        const penutup = d === '(' ? '\\)' : '\\]';
        const j = teks.indexOf(penutup, i + 2);
        if (j > i + 2) {
          simpanTeks();
          hasil.push({ jenis: 'rumus', tex: teks.slice(i + 2, j).trim(), tampil: d === '[' });
          i = j + 2;
          continue;
        }
      }
      if (d !== undefined && KARAKTER_ESCAPE.includes(d)) {
        penyangga += d;
        i += 2;
        continue;
      }
      penyangga += c;
      i += 1;
      continue;
    }

    if (c === '`') {
      const j = teks.indexOf('`', i + 1);
      if (j > i + 1) {
        simpanTeks();
        hasil.push({ jenis: 'kode', teks: teks.slice(i + 1, j) });
        i = j + 1;
        continue;
      }
    }

    if (c === '$') {
      if (teks[i + 1] === '$') {
        const j = teks.indexOf('$$', i + 2);
        const tex = j > -1 ? teks.slice(i + 2, j).trim() : '';
        if (tex) {
          simpanTeks();
          hasil.push({ jenis: 'rumus', tex, tampil: true });
          i = j + 2;
          continue;
        }
        penyangga += '$$';
        i += 2;
        continue;
      }
      const j = cariPenutupDolar(teks, i + 1);
      if (j > -1) {
        simpanTeks();
        hasil.push({ jenis: 'rumus', tex: teks.slice(i + 1, j).trim(), tampil: false });
        i = j + 1;
        continue;
      }
    }

    if ((c === '*' || c === '_') && kedalaman < MAKS_KEDALAMAN_INLINE) {
      const ganda = teks[i + 1] === c;
      const penanda = ganda ? c + c : c;
      const mulai = i + penanda.length;
      const bolehBuka = mulai < n && !/\s/.test(teks[mulai])
        && !(c === '_' && /\w/.test(teks[i - 1] ?? ''));
      if (bolehBuka) {
        const j = cariPenutupTekanan(teks, mulai, penanda);
        if (j > -1) {
          simpanTeks();
          hasil.push({ jenis: ganda ? 'tebal' : 'miring', isi: uraiInline(teks.slice(mulai, j), kedalaman + 1) });
          i = j + penanda.length;
          continue;
        }
      }
      penyangga += penanda;
      i += penanda.length;
      continue;
    }

    penyangga += c;
    i += 1;
  }
  simpanTeks();
  return hasil;
}

// ---------------------------------------------------------------------------
// Tabel
// ---------------------------------------------------------------------------

/** Memisah satu baris tabel menjadi sel. "|" di dalam $…$, `…`, atau \| tidak memisah. */
export function pisahSelTabel(baris) {
  let isi = baris.trim();
  if (isi.startsWith('|')) isi = isi.slice(1);
  if (isi.endsWith('|') && !isi.endsWith('\\|')) isi = isi.slice(0, -1);
  const sel = [];
  let sekarang = '';
  let dalamRumus = false;
  let dalamKode = false;
  for (let k = 0; k < isi.length; k += 1) {
    const c = isi[k];
    if (c === '\\' && isi[k + 1] === '|') { sekarang += '|'; k += 1; continue; }
    if (c === '\\') { sekarang += c + (isi[k + 1] ?? ''); k += 1; continue; }
    if (c === '`' && !dalamRumus) dalamKode = !dalamKode;
    if (c === '$' && !dalamKode) dalamRumus = !dalamRumus;
    if (c === '|' && !dalamRumus && !dalamKode) { sel.push(sekarang.trim()); sekarang = ''; continue; }
    sekarang += c;
  }
  sel.push(sekarang.trim());
  return sel;
}

function rataKolom(sel) {
  const kiri = sel.startsWith(':');
  const kanan = sel.endsWith(':');
  if (kiri && kanan) return 'tengah';
  if (kanan) return 'kanan';
  if (kiri) return 'kiri';
  return null;
}

function awalTabel(baris, i) {
  return baris[i].includes('|') && i + 1 < baris.length && POLA_PEMISAH_TABEL.test(baris[i + 1])
    && baris[i + 1].includes('-');
}

// ---------------------------------------------------------------------------
// Blok
// ---------------------------------------------------------------------------

function indentasi(baris) {
  return /^\s*/.exec(baris)[0].replace(/\t/g, '    ').length;
}

function awalRumusTampil(baris) {
  const t = baris.trim();
  return t.startsWith('$$') || t.startsWith('\\[');
}

/** Baris yang memulai blok lain (memutus paragraf). */
function awalBlok(baris, i) {
  const b = baris[i];
  return POLA_JUDUL.test(b) || POLA_PAGAR.test(b) || POLA_GARIS.test(b) || POLA_DAFTAR.test(b)
    || POLA_KUTIPAN.test(b) || awalTabel(baris, i) || awalRumusTampil(b);
}

/** Rumus display yang berdiri sendiri ($$…$$ / \[…\], boleh beberapa baris). @returns {[object, number]|null} */
function bacaRumusTampil(baris, i) {
  const t = baris[i].trim();
  const [buka, tutup] = t.startsWith('$$') ? ['$$', '$$'] : ['\\[', '\\]'];
  const sisa = t.slice(buka.length);
  const tutupSebaris = sisa.indexOf(tutup);
  if (tutupSebaris > -1) {
    // Hanya blok jika tidak ada teks lain setelah penutup; selain itu biar paragraf yang mengurus.
    if (sisa.slice(tutupSebaris + tutup.length).trim() !== '') return null;
    const tex = sisa.slice(0, tutupSebaris).trim();
    return tex ? [{ jenis: 'rumus', tex }, i + 1] : null;
  }
  const isi = [sisa];
  for (let k = i + 1; k < baris.length; k += 1) {
    const s = baris[k];
    const j = s.indexOf(tutup);
    if (j > -1) {
      if (s.slice(j + tutup.length).trim() !== '') return null;
      isi.push(s.slice(0, j));
      const tex = isi.join('\n').trim();
      return tex ? [{ jenis: 'rumus', tex }, k + 1] : null;
    }
    isi.push(s);
  }
  return null; // tidak ditutup
}

/** Daftar (bersarang berdasarkan indentasi). @returns {[object, number]} */
function bacaDaftar(baris, i, kedalaman) {
  const pertama = POLA_DAFTAR.exec(baris[i]);
  const indenDasar = indentasi(pertama[1]);
  const berurut = /\d/.test(pertama[2]);
  const butir = [];
  const blok = { jenis: 'daftar', berurut, mulai: berurut ? Number.parseInt(pertama[2], 10) : 1, butir };
  let teksButir = null;

  const tutupButir = () => {
    if (teksButir !== null) butir.at(-1).isi = uraiInline(teksButir.join('\n'));
    teksButir = null;
  };

  while (i < baris.length) {
    const b = baris[i];
    if (b.trim() === '') {
      // Baris kosong: lanjut hanya jika baris berisi berikutnya masih bagian daftar ini.
      let k = i + 1;
      while (k < baris.length && baris[k].trim() === '') k += 1;
      const berikut = baris[k];
      const m = berikut !== undefined ? POLA_DAFTAR.exec(berikut) : null;
      if (berikut === undefined || !(indentasi(berikut) > indenDasar
        || (m && indentasi(m[1]) === indenDasar && /\d/.test(m[2]) === berurut))) break;
      i = k;
      continue;
    }
    const m = POLA_DAFTAR.exec(b);
    const inden = indentasi(b);
    if (m && inden < indenDasar - 1) break; // butir milik daftar induk
    if (m && inden <= indenDasar + 1) {
      if (/\d/.test(m[2]) !== berurut) break; // jenis daftar berganti
      tutupButir();
      butir.push({ isi: [], sub: [] });
      teksButir = [m[3]];
      i += 1;
      continue;
    }
    if (m && inden > indenDasar + 1 && butir.length > 0 && kedalaman < MAKS_KEDALAMAN_BLOK) {
      tutupButir();
      const [sub, berikut] = bacaDaftar(baris, i, kedalaman + 1);
      butir.at(-1).sub.push(sub);
      i = berikut;
      continue;
    }
    // Baris lanjutan (menjorok, atau teks biasa yang langsung menempel).
    if (butir.length > 0 && (inden > indenDasar || !awalBlok(baris, i)) && butir.at(-1).sub.length === 0) {
      if (teksButir === null) teksButir = [];
      teksButir.push(b.trim());
      i += 1;
      continue;
    }
    break;
  }
  tutupButir();
  return [blok, i];
}

function bacaTabel(baris, i) {
  const kepala = pisahSelTabel(baris[i]);
  const rata = pisahSelTabel(baris[i + 1]).map(rataKolom);
  const lebar = kepala.length;
  const sesuaikan = (sel) => Array.from({ length: lebar }, (_, k) => sel[k] ?? '');
  const isiBaris = [];
  let k = i + 2;
  while (k < baris.length && baris[k].trim() !== '' && baris[k].includes('|')) {
    isiBaris.push(sesuaikan(pisahSelTabel(baris[k])).map((s) => uraiInline(s)));
    k += 1;
  }
  return [{
    jenis: 'tabel',
    kepala: kepala.map((s) => uraiInline(s)),
    rata: sesuaikan(rata).map((r) => r || null),
    baris: isiBaris,
  }, k];
}

function uraiBlokBaris(baris, kedalaman) {
  const hasil = [];
  let i = 0;
  while (i < baris.length) {
    const b = baris[i];
    if (b.trim() === '') { i += 1; continue; }

    if (POLA_PAGAR.test(b)) {
      const isi = [];
      let k = i + 1;
      while (k < baris.length && !POLA_PAGAR.test(baris[k])) { isi.push(baris[k]); k += 1; }
      hasil.push({ jenis: 'kode', teks: isi.join('\n') });
      i = k + 1;
      continue;
    }

    if (awalRumusTampil(b)) {
      const rumus = bacaRumusTampil(baris, i);
      if (rumus) { hasil.push(rumus[0]); i = rumus[1]; continue; }
    }

    const judul = POLA_JUDUL.exec(b);
    if (judul) {
      hasil.push({ jenis: 'judul', tingkat: judul[1].length, isi: uraiInline(judul[2]) });
      i += 1;
      continue;
    }

    if (POLA_GARIS.test(b)) { hasil.push({ jenis: 'garis' }); i += 1; continue; }

    if (awalTabel(baris, i)) {
      const [tabel, berikut] = bacaTabel(baris, i);
      hasil.push(tabel);
      i = berikut;
      continue;
    }

    if (POLA_DAFTAR.test(b) && kedalaman < MAKS_KEDALAMAN_BLOK) {
      const [daftar, berikut] = bacaDaftar(baris, i, kedalaman);
      hasil.push(daftar);
      i = berikut;
      continue;
    }

    if (POLA_KUTIPAN.test(b) && kedalaman < MAKS_KEDALAMAN_BLOK) {
      const isi = [];
      while (i < baris.length && POLA_KUTIPAN.test(baris[i])) {
        isi.push(baris[i].replace(POLA_KUTIPAN, ''));
        i += 1;
      }
      hasil.push({ jenis: 'kutipan', anak: uraiBlokBaris(isi, kedalaman + 1) });
      continue;
    }

    // Paragraf: sampai baris kosong atau awal blok lain.
    const isi = [b.trim()];
    i += 1;
    while (i < baris.length && baris[i].trim() !== '' && !awalBlok(baris, i)) {
      isi.push(baris[i].trim());
      i += 1;
    }
    hasil.push({ jenis: 'paragraf', isi: uraiInline(isi.join('\n')) });
  }
  return hasil;
}

/**
 * @param {string} teks jawaban Tutor AI (Markdown)
 * @returns {object[]} daftar blok
 */
export function uraiMarkdown(teks) {
  if (typeof teks !== 'string' || teks.trim() === '') return [];
  return uraiBlokBaris(teks.replace(/\r\n?/g, '\n').split('\n'), 0);
}
