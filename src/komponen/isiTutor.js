/**
 * Merender jawaban Tutor AI (Markdown + rumus LaTeX) menjadi DOM.
 *
 * KEAMANAN: teks dari AI tidak pernah ditafsirkan sebagai HTML.
 * - Tidak ada innerHTML/outerHTML/insertAdjacentHTML; semua teks lewat createTextNode/textContent.
 * - Hanya tag dari daftar TAG_HTML dan TAG_MATHML yang dibuat; tag lain tidak mungkin muncul.
 * - Atribut hanya: class (tetap), start (angka), scope="col", display="block", width (pola em).
 *   Tidak ada href, src, style, atau atribut on*.
 * Rumus ditampilkan sebagai MathML bawaan browser (tanpa pustaka tambahan).
 */
import { uraiMarkdown } from '../logika/markdownTutor.js';
import { latexKeMathml, TAG_MATHML } from '../logika/latexKeMathml.js';

export const NS_MATHML = 'http://www.w3.org/1998/Math/MathML';
export const TAG_HTML = Object.freeze([
  'div', 'p', 'h3', 'strong', 'em', 'code', 'pre', 'br', 'ul', 'ol', 'li',
  'table', 'thead', 'tbody', 'tr', 'th', 'td', 'blockquote', 'hr', 'span',
]);
const TAG_MATHML_SET = new Set(TAG_MATHML);
const POLA_LEBAR = /^\d+(\.\d+)?em$/;

function buatPerender(dok) {
  function elemen(tag, kelas) {
    if (!TAG_HTML.includes(tag)) throw new Error(`Tag tidak diizinkan: ${tag}`);
    const e = dok.createElement(tag);
    if (kelas) e.className = kelas;
    return e;
  }

  function mathml(simpul) {
    if (!TAG_MATHML_SET.has(simpul.tag)) return dok.createTextNode('');
    const e = dok.createElementNS(NS_MATHML, simpul.tag);
    const atribut = simpul.atribut ?? {};
    if (atribut.display === 'block') e.setAttribute('display', 'block');
    if (typeof atribut.width === 'string' && POLA_LEBAR.test(atribut.width)) e.setAttribute('width', atribut.width);
    if (typeof simpul.teks === 'string') e.textContent = simpul.teks;
    for (const anak of simpul.anak ?? []) e.append(mathml(anak));
    return e;
  }

  /** Rumus; jika LaTeX tidak bisa diurai, sumbernya ditampilkan sebagai kode (tetap teks). */
  function rumus(tex, tampil) {
    const pohon = latexKeMathml(tex, { tampil });
    const wadah = elemen(tampil ? 'div' : 'span', tampil ? 'tutor-rumus' : 'tutor-rumus-sebaris');
    if (pohon) {
      wadah.append(mathml(pohon));
    } else {
      const kode = elemen('code');
      kode.textContent = tex;
      wadah.append(kode);
    }
    return wadah;
  }

  function inline(daftar) {
    const hasil = [];
    for (const s of daftar) {
      if (s.jenis === 'teks') hasil.push(dok.createTextNode(s.teks));
      else if (s.jenis === 'baris_baru') hasil.push(elemen('br'));
      else if (s.jenis === 'tebal' || s.jenis === 'miring') {
        const e = elemen(s.jenis === 'tebal' ? 'strong' : 'em');
        e.append(...inline(s.isi));
        hasil.push(e);
      } else if (s.jenis === 'kode') {
        const e = elemen('code');
        e.textContent = s.teks;
        hasil.push(e);
      } else if (s.jenis === 'rumus') {
        hasil.push(rumus(s.tex, s.tampil));
      }
    }
    return hasil;
  }

  function sel(tag, isi, rata) {
    const e = elemen(tag, rata === 'kanan' || rata === 'tengah' ? `rata-${rata}` : undefined);
    if (tag === 'th') e.setAttribute('scope', 'col');
    e.append(...inline(isi));
    return e;
  }

  function tabel(b) {
    const wadah = elemen('div', 'wadah-tabel');
    const t = elemen('table', 'tabel');
    const kepala = elemen('thead');
    const barisKepala = elemen('tr');
    b.kepala.forEach((isi, k) => barisKepala.append(sel('th', isi, b.rata[k])));
    kepala.append(barisKepala);
    const badan = elemen('tbody');
    for (const baris of b.baris) {
      const tr = elemen('tr');
      baris.forEach((isi, k) => tr.append(sel('td', isi, b.rata[k])));
      badan.append(tr);
    }
    t.append(kepala, badan);
    wadah.append(t);
    return wadah;
  }

  function daftar(b) {
    const e = elemen(b.berurut ? 'ol' : 'ul');
    if (b.berurut && Number.isInteger(b.mulai) && b.mulai !== 1) e.setAttribute('start', String(b.mulai));
    for (const butir of b.butir) {
      const li = elemen('li');
      li.append(...inline(butir.isi));
      for (const sub of butir.sub) li.append(daftar(sub));
      e.append(li);
    }
    return e;
  }

  function blok(b) {
    switch (b.jenis) {
      case 'paragraf': { const p = elemen('p'); p.append(...inline(b.isi)); return p; }
      case 'judul': { const h = elemen('h3', 'tutor-judul'); h.append(...inline(b.isi)); return h; }
      case 'daftar': return daftar(b);
      case 'tabel': return tabel(b);
      case 'rumus': return rumus(b.tex, true);
      case 'kode': { const pre = elemen('pre'); const c = elemen('code'); c.textContent = b.teks; pre.append(c); return pre; }
      case 'kutipan': { const q = elemen('blockquote'); q.append(...b.anak.map(blok)); return q; }
      case 'garis': return elemen('hr');
      default: return dok.createTextNode('');
    }
  }

  return { blok };
}

/**
 * @param {string} teks jawaban Tutor AI
 * @param {Document} [dok] untuk tes
 * @returns {HTMLElement} div.tutor-isi
 */
export function isiPesanTutor(teks, dok = globalThis.document) {
  const { blok } = buatPerender(dok);
  const wadah = dok.createElement('div');
  wadah.className = 'tutor-isi';
  try {
    wadah.append(...uraiMarkdown(teks).map(blok));
  } catch {
    // Cadangan terakhir: teks mentah (tetap aman, tanpa HTML).
    const p = dok.createElement('p');
    p.textContent = String(teks ?? '');
    wadah.replaceChildren(p);
  }
  return wadah;
}
