/**
 * Menerjemahkan LaTeX (subset yang dipakai Tutor AI untuk bunga tunggal) menjadi pohon MathML
 * berupa objek biasa: { tag, teks?, anak?, atribut? }. Modul murni: tidak menyentuh DOM,
 * tidak memakai eval/new Function, dan tidak pernah melempar galat ke pemanggil.
 *
 * Yang didukung: angka, huruf, operator, {grup}, ^ dan _, \frac/\dfrac/\tfrac, \sqrt[n]{x},
 * \text{…}/\mathrm{…}, simbol umum (\times, \cdot, \div, \le, \approx, \Rightarrow, …), huruf Yunani,
 * spasi (\, \; \quad), \left/\right, \begin{aligned}…\end{aligned} dengan baris "\\".
 * Perintah yang tidak dikenal ditampilkan apa adanya sebagai teks (mtext), tidak pernah sebagai HTML.
 */

export const MAKS_PANJANG_TEX = 2000;
export const MAKS_KEDALAMAN_TEX = 24;

/** Tag MathML yang boleh dihasilkan. Renderer DOM memakai daftar yang sama. */
export const TAG_MATHML = Object.freeze([
  'math', 'mrow', 'mi', 'mn', 'mo', 'mtext', 'mspace', 'mfrac', 'msqrt', 'mroot',
  'msup', 'msub', 'msubsup', 'mtable', 'mtr', 'mtd',
]);

const SIMBOL = {
  times: '×', cdot: '⋅', div: '÷', pm: '±', mp: '∓', ast: '∗',
  le: '≤', leq: '≤', ge: '≥', geq: '≥', neq: '≠', ne: '≠', approx: '≈', equiv: '≡', sim: '∼',
  lt: '<', gt: '>', to: '→', rightarrow: '→', leftarrow: '←', Rightarrow: '⇒', Leftarrow: '⇐',
  Leftrightarrow: '⇔', implies: '⟹', iff: '⟺', ldots: '…', cdots: '⋯', dots: '…',
  infty: '∞', circ: '∘', degree: '°', prime: '′', mid: '∣', colon: ':',
  langle: '⟨', rangle: '⟩', lbrace: '{', rbrace: '}', vert: '|',
  '%': '%', '{': '{', '}': '}', $: '$', '#': '#', '&': '&', _: '_', '|': '‖',
};

const YUNANI = {
  alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', epsilon: 'ε', varepsilon: 'ε', theta: 'θ',
  lambda: 'λ', mu: 'μ', pi: 'π', rho: 'ρ', sigma: 'σ', tau: 'τ', phi: 'φ', omega: 'ω',
  Gamma: 'Γ', Delta: 'Δ', Theta: 'Θ', Lambda: 'Λ', Pi: 'Π', Sigma: 'Σ', Phi: 'Φ', Omega: 'Ω',
};

const SPASI = {
  ',': '0.167em', ':': '0.222em', '>': '0.222em', ';': '0.278em', ' ': '0.25em',
  thinspace: '0.167em', enspace: '0.5em', quad: '1em', qquad: '2em',
};

const PERINTAH_TEKS = new Set(['text', 'textrm', 'mathrm', 'textbf', 'textit', 'mathit', 'mbox', 'operatorname', 'texttt', 'mathsf', 'textsf']);
const PERINTAH_PECAHAN = new Set(['frac', 'dfrac', 'tfrac', 'cfrac']);
/** Perintah ukuran/gaya yang tidak memengaruhi isi: diabaikan. */
const PERINTAH_ABAI = new Set([
  'left', 'right', 'middle', 'big', 'Big', 'bigg', 'Bigg', 'bigl', 'bigr', 'Bigl', 'Bigr',
  'biggl', 'biggr', 'displaystyle', 'textstyle', 'scriptstyle', 'limits', 'nolimits', '!',
]);
/** Perintah pembungkus: isinya ditampilkan apa adanya. */
const PERINTAH_GRUP = new Set(['mathbf', 'boldsymbol', 'bm', 'boxed', 'underline', 'overline', 'mathbb', 'mathcal', 'pmb']);

class GalatTex extends Error {}

/** Membaca isi {…} mentah mulai dari indeks kurung buka. @returns {[string, number]|null} */
function bacaGrupMentah(tex, i) {
  if (tex[i] !== '{') return null;
  let tingkat = 0;
  for (let k = i; k < tex.length; k += 1) {
    if (tex[k] === '\\') { k += 1; continue; }
    if (tex[k] === '{') tingkat += 1;
    else if (tex[k] === '}') {
      tingkat -= 1;
      if (tingkat === 0) return [tex.slice(i + 1, k), k + 1];
    }
  }
  return null;
}

function lewatiSpasi(tex, i) {
  while (i < tex.length && /\s/.test(tex[i])) i += 1;
  return i;
}

/** Teks di dalam \text{…}: perintah escape sederhana dibuka (\% → %, \{ → {). */
function bersihkanTeks(mentah) {
  return mentah.replace(/\\([%{}$#&_ ])/g, '$1').replace(/\\,|\\;|\\:|\\ /g, ' ');
}

function tokenisasi(tex) {
  const token = [];
  let i = 0;
  while (i < tex.length) {
    const c = tex[i];
    if (c === '\\') {
      const nama = /^[a-zA-Z]+/.exec(tex.slice(i + 1))?.[0];
      if (nama) {
        i += 1 + nama.length;
        if (PERINTAH_TEKS.has(nama)) {
          const grup = bacaGrupMentah(tex, lewatiSpasi(tex, i));
          if (grup) {
            token.push({ j: 'teks', v: bersihkanTeks(grup[0]) });
            i = grup[1];
            continue;
          }
        }
        if (nama === 'begin' || nama === 'end') {
          const grup = bacaGrupMentah(tex, lewatiSpasi(tex, i));
          if (grup) {
            i = grup[1];
            // \begin{array}{cc}: spesifikasi kolom dilewati.
            if (nama === 'begin' && /^(array|tabular)$/.test(grup[0])) {
              const spesifikasi = bacaGrupMentah(tex, lewatiSpasi(tex, i));
              if (spesifikasi) i = spesifikasi[1];
            }
          }
          continue;
        }
        token.push({ j: 'cmd', v: nama });
        continue;
      }
      if (i + 1 < tex.length) {
        token.push(tex[i + 1] === '\\' ? { j: 'baris' } : { j: 'cmd', v: tex[i + 1] });
        i += 2;
        continue;
      }
      token.push({ j: 'mo', v: '\\' });
      i += 1;
      continue;
    }
    if (/\s/.test(c)) { i += 1; continue; }
    const angka = /^\d+(?:[.,]\d+)*/.exec(tex.slice(i))?.[0];
    if (angka) { token.push({ j: 'mn', v: angka }); i += angka.length; continue; }
    if (c === '{') token.push({ j: 'buka' });
    else if (c === '}') token.push({ j: 'tutup' });
    else if (c === '^') token.push({ j: 'sup' });
    else if (c === '_') token.push({ j: 'sub' });
    else if (c === '&') token.push({ j: 'amp' });
    else if (c === "'") token.push({ j: 'mo', v: '′' });
    else if (/[A-Za-zÀ-ɏͰ-Ͽ]/.test(c)) token.push({ j: 'mi', v: c });
    else token.push({ j: 'mo', v: c });
    i += 1;
  }
  return token;
}

const mrow = (anak) => ({ tag: 'mrow', anak });

function buatPengurai(token) {
  let i = 0;
  const lihat = () => token[i];
  const ambil = () => token[i++];

  function argumen(d) {
    const t = lihat();
    if (!t || t.j === 'tutup') return mrow([]);
    return atomDenganSkrip(d) ?? mrow([]);
  }

  function perintah(nama, d) {
    if (PERINTAH_PECAHAN.has(nama)) return { tag: 'mfrac', anak: [argumen(d + 1), argumen(d + 1)] };
    if (nama === 'sqrt') {
      if (lihat()?.j === 'mo' && lihat().v === '[') {
        ambil();
        const indeks = [];
        while (lihat() && !(lihat().j === 'mo' && lihat().v === ']')) {
          const a = atomDenganSkrip(d + 1);
          if (a) indeks.push(a);
        }
        ambil(); // ']'
        return { tag: 'mroot', anak: [argumen(d + 1), mrow(indeks)] };
      }
      return { tag: 'msqrt', anak: [argumen(d + 1)] };
    }
    if (nama in SIMBOL) return { tag: 'mo', teks: SIMBOL[nama] };
    if (nama in YUNANI) return { tag: 'mi', teks: YUNANI[nama] };
    if (nama in SPASI) return { tag: 'mspace', atribut: { width: SPASI[nama] } };
    if (PERINTAH_ABAI.has(nama)) {
      // \left. / \right. : pembatas kosong.
      if ((nama === 'left' || nama === 'right') && lihat()?.j === 'mo' && lihat().v === '.') ambil();
      return null;
    }
    if (PERINTAH_GRUP.has(nama)) return argumen(d + 1);
    if (PERINTAH_TEKS.has(nama)) return argumen(d + 1);
    // Tidak dikenal: tampilkan apa adanya sebagai teks.
    return { tag: 'mtext', teks: `\\${nama}` };
  }

  function atom(d) {
    if (d > MAKS_KEDALAMAN_TEX) throw new GalatTex('terlalu dalam');
    const t = ambil();
    switch (t.j) {
      case 'buka': return mrow(urutan(d + 1, true));
      case 'mn': return { tag: 'mn', teks: t.v };
      case 'mi': return { tag: 'mi', teks: t.v };
      case 'mo': return { tag: 'mo', teks: t.v };
      case 'teks': return { tag: 'mtext', teks: t.v };
      case 'cmd': return perintah(t.v, d);
      case 'amp': return { tag: 'mspace', atribut: { width: '0.5em' } };
      case 'sup':
      case 'sub':
        i -= 1; // skrip tanpa dasar: dasar kosong
        return mrow([]);
      default: return null; // 'baris' di dalam grup, 'tutup' liar
    }
  }

  function atomDenganSkrip(d) {
    let dasar = atom(d);
    let atas = null;
    let bawah = null;
    while (lihat()?.j === 'sup' || lihat()?.j === 'sub') {
      const jenis = ambil().j;
      const isi = argumen(d + 1);
      if (jenis === 'sup') atas = isi;
      else bawah = isi;
    }
    if (!atas && !bawah) return dasar;
    dasar ??= mrow([]);
    if (atas && bawah) return { tag: 'msubsup', anak: [dasar, bawah, atas] };
    return atas ? { tag: 'msup', anak: [dasar, atas] } : { tag: 'msub', anak: [dasar, bawah] };
  }

  /** Urutan atom sampai '}' (jika dalamGrup) atau akhir. Baris "\\" di tingkat atas jadi penanda. */
  function urutan(d, dalamGrup = false) {
    const hasil = [];
    while (i < token.length) {
      const t = lihat();
      if (t.j === 'tutup') {
        ambil();
        if (dalamGrup) return hasil;
        continue; // kurung tutup liar diabaikan
      }
      if (t.j === 'baris') {
        ambil();
        if (!dalamGrup) hasil.push({ tag: '_baris' });
        continue;
      }
      const a = atomDenganSkrip(d);
      if (a) hasil.push(a);
    }
    return hasil;
  }

  return { urutan };
}

/**
 * @param {string} tex
 * @param {{ tampil?: boolean }} [opsi] tampil = rumus display (blok)
 * @returns {{ tag: 'math', atribut: object, anak: object[] } | null} null jika tidak bisa diurai
 */
export function latexKeMathml(tex, { tampil = false } = {}) {
  if (typeof tex !== 'string') return null;
  const sumber = tex.trim();
  if (!sumber || sumber.length > MAKS_PANJANG_TEX) return null;
  try {
    const simpul = buatPengurai(tokenisasi(sumber)).urutan(0);
    // Pisahkan baris "\\" menjadi tabel satu kolom.
    const baris = [[]];
    for (const s of simpul) {
      if (s.tag === '_baris') baris.push([]);
      else baris.at(-1).push(s);
    }
    const barisIsi = baris.filter((b) => b.length > 0);
    const anak = barisIsi.length > 1
      ? [{ tag: 'mtable', anak: barisIsi.map((b) => ({ tag: 'mtr', anak: [{ tag: 'mtd', anak: [mrow(b)] }] })) }]
      : [mrow(barisIsi[0] ?? [])];
    return { tag: 'math', atribut: tampil ? { display: 'block' } : {}, anak };
  } catch {
    return null;
  }
}
