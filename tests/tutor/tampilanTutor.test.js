// Tampilan jawaban Tutor AI: Markdown, tabel, rumus inline/display, dan keamanan renderer.
import { describe, test, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { uraiMarkdown, uraiInline, pisahSelTabel } from '../../src/logika/markdownTutor.js';
import { latexKeMathml, TAG_MATHML, MAKS_KEDALAMAN_TEX } from '../../src/logika/latexKeMathml.js';
import { isiPesanTutor, NS_MATHML, TAG_HTML } from '../../src/komponen/isiTutor.js';

// ---------------------------------------------------------------------------
// DOM palsu: HANYA API aman yang dipakai renderer. innerHTML dan sejenisnya sengaja tidak ada.
// ---------------------------------------------------------------------------
const NS_HTML = 'http://www.w3.org/1999/xhtml';
class SimpulTeks {
  constructor(data) { this.nodeType = 3; this.data = String(data); }
  get textContent() { return this.data; }
}
class Elemen {
  constructor(tag, ns) {
    this.nodeType = 1; this.tagName = tag; this.namespaceURI = ns;
    this.childNodes = []; this.attributes = {}; this.className = '';
  }
  append(...anak) {
    for (const a of anak) this.childNodes.push(typeof a === 'string' ? new SimpulTeks(a) : a);
  }
  replaceChildren(...anak) { this.childNodes = []; this.append(...anak); }
  setAttribute(nama, nilai) { this.attributes[nama] = String(nilai); }
  set textContent(nilai) { this.childNodes = [new SimpulTeks(nilai)]; }
  get textContent() { return this.childNodes.map((c) => c.textContent).join(''); }
  set innerHTML(_) { throw new Error('innerHTML dilarang'); }
}
const dok = {
  createElement: (tag) => new Elemen(tag, NS_HTML),
  createElementNS: (ns, tag) => new Elemen(tag, ns),
  createTextNode: (d) => new SimpulTeks(d),
};
const render = (teks) => isiPesanTutor(teks, dok);

function* semuaElemen(e) {
  yield e;
  for (const c of e.childNodes) if (c.nodeType === 1) yield* semuaElemen(c);
}
const cari = (akar, tag) => [...semuaElemen(akar)].filter((e) => e.tagName === tag);

// ---------------------------------------------------------------------------
describe('Markdown: inline', () => {
  test('**tebal**, *miring*, `kode`', () => {
    expect(uraiInline('Modal **Rp1.000.000** dan *bunga* `B`')).toEqual([
      { jenis: 'teks', teks: 'Modal ' },
      { jenis: 'tebal', isi: [{ jenis: 'teks', teks: 'Rp1.000.000' }] },
      { jenis: 'teks', teks: ' dan ' },
      { jenis: 'miring', isi: [{ jenis: 'teks', teks: 'bunga' }] },
      { jenis: 'teks', teks: ' ' },
      { jenis: 'kode', teks: 'B' },
    ]);
  });
  test('__tebal__ dan rumus di dalam tebal', () => {
    expect(uraiInline('__Jawab:__ **$B = 40.000$**')).toEqual([
      { jenis: 'tebal', isi: [{ jenis: 'teks', teks: 'Jawab:' }] },
      { jenis: 'teks', teks: ' ' },
      { jenis: 'tebal', isi: [{ jenis: 'rumus', tex: 'B = 40.000', tampil: false }] },
    ]);
  });
  test('tanda yang tidak berpasangan tetap teks: "**", "2 * 3", nama_variabel', () => {
    expect(uraiInline('**belum ditutup')).toEqual([{ jenis: 'teks', teks: '**belum ditutup' }]);
    expect(uraiInline('2 * 3 * 4')).toEqual([{ jenis: 'teks', teks: '2 * 3 * 4' }]);
    expect(uraiInline('lama_menabung_bulan')).toEqual([{ jenis: 'teks', teks: 'lama_menabung_bulan' }]);
  });
  test('escape: \\*bukan miring\\*', () => {
    expect(uraiInline('\\*bukan miring\\*')).toEqual([{ jenis: 'teks', teks: '*bukan miring*' }]);
  });
  test('baris baru dalam paragraf', () => {
    expect(uraiMarkdown('Baris satu\nBaris dua')).toEqual([{
      jenis: 'paragraf',
      isi: [{ jenis: 'teks', teks: 'Baris satu' }, { jenis: 'baris_baru' }, { jenis: 'teks', teks: 'Baris dua' }],
    }]);
  });
  test('paragraf dipisah baris kosong, judul #', () => {
    const b = uraiMarkdown('### Langkah 1\nKenali data.\n\nLalu hitung.');
    expect(b.map((x) => x.jenis)).toEqual(['judul', 'paragraf', 'paragraf']);
    expect(b[0].tingkat).toBe(3);
  });
});

describe('Markdown: daftar', () => {
  test('daftar bernomor dan berpoin', () => {
    const b = uraiMarkdown('1. Modal\n2. Suku bunga\n\n- satu\n- dua');
    expect(b).toHaveLength(2);
    expect(b[0]).toMatchObject({ jenis: 'daftar', berurut: true, mulai: 1 });
    expect(b[0].butir).toHaveLength(2);
    expect(b[1]).toMatchObject({ jenis: 'daftar', berurut: false });
  });
  test('nomor awal selain 1 dan daftar bersarang', () => {
    const [d] = uraiMarkdown('3. Hitung bunga\n   - kalikan modal\n   - kalikan waktu\n4. Tabungan akhir');
    expect(d.mulai).toBe(3);
    expect(d.butir).toHaveLength(2);
    expect(d.butir[0].sub[0].butir).toHaveLength(2);
    expect(d.butir[1].isi).toEqual([{ jenis: 'teks', teks: 'Tabungan akhir' }]);
  });
  test('daftar dipisah baris kosong tetap satu daftar', () => {
    const [d] = uraiMarkdown('1. Satu\n\n2. Dua');
    expect(d.butir).toHaveLength(2);
  });
});

describe('Markdown: tabel', () => {
  const md = [
    '| Besaran | Simbol | Nilai |',
    '|:--------|:------:|------:|',
    '| Modal | $M$ | Rp1.000.000 |',
    '| Suku bunga | $p$ | **6%** |',
    '| Lama | $t$ | $\\frac{8}{12}$ tahun |',
  ].join('\n');

  test('kepala, rataan, dan isi sel (termasuk rumus)', () => {
    const [t] = uraiMarkdown(md);
    expect(t.jenis).toBe('tabel');
    expect(t.rata).toEqual(['kiri', 'tengah', 'kanan']);
    expect(t.kepala.map((s) => s[0].teks)).toEqual(['Besaran', 'Simbol', 'Nilai']);
    expect(t.baris).toHaveLength(3);
    expect(t.baris[0][1]).toEqual([{ jenis: 'rumus', tex: 'M', tampil: false }]);
    expect(t.baris[1][2][0].jenis).toBe('tebal');
  });
  test('"|" di dalam rumus, kode, atau \\| tidak memisah sel', () => {
    expect(pisahSelTabel('| $|x|$ | `a|b` | c\\|d |')).toEqual(['$|x|$', '`a|b`', 'c|d']);
  });
  test('jumlah sel disamakan dengan kepala', () => {
    const [t] = uraiMarkdown('| a | b |\n|---|---|\n| 1 |\n| 1 | 2 | 3 |');
    expect(t.baris.map((b) => b.length)).toEqual([2, 2]);
  });
  test('dirender sebagai <table> dengan th scope=col dan kelas rataan', () => {
    const akar = render(md);
    const [tabel] = cari(akar, 'table');
    expect(tabel.className).toBe('tabel');
    expect(cari(akar, 'div').some((d) => d.className === 'wadah-tabel')).toBe(true);
    const th = cari(akar, 'th');
    expect(th.map((e) => e.textContent)).toEqual(['Besaran', 'Simbol', 'Nilai']);
    expect(th.every((e) => e.attributes.scope === 'col')).toBe(true);
    expect(th.map((e) => e.className)).toEqual(['', 'rata-tengah', 'rata-kanan']);
    expect(cari(akar, 'td')).toHaveLength(9);
    expect(cari(tabel, 'mfrac')).toHaveLength(1);
  });
});

describe('Rumus inline', () => {
  test('$…$ dan \\(…\\)', () => {
    expect(uraiInline('maka $t = \\frac{8}{12}$ tahun')[1]).toEqual({ jenis: 'rumus', tex: 't = \\frac{8}{12}', tampil: false });
    expect(uraiInline('\\(B = 40.000\\)')).toEqual([{ jenis: 'rumus', tex: 'B = 40.000', tampil: false }]);
  });
  test('"$" yang bukan rumus tetap teks', () => {
    expect(uraiInline('harga $ 5 dan $10')).toEqual([{ jenis: 'teks', teks: 'harga $ 5 dan $10' }]);
  });
  test('dirender sebagai <math> sebaris di dalam paragraf', () => {
    const akar = render('Ubah waktu: $t = \\frac{8}{12}$ tahun.');
    const [p] = cari(akar, 'p');
    const [mathEl] = cari(p, 'math');
    expect(mathEl.namespaceURI).toBe(NS_MATHML);
    expect(mathEl.attributes.display).toBeUndefined();
    expect(cari(p, 'span')[0].className).toBe('tutor-rumus-sebaris');
    const [frac] = cari(mathEl, 'mfrac');
    expect(frac.childNodes.map((c) => c.textContent)).toEqual(['8', '12']);
    expect(p.textContent).toContain('Ubah waktu: ');
  });
});

describe('Rumus display', () => {
  test('$$…$$ sebaris dan beberapa baris, \\[…\\]', () => {
    expect(uraiMarkdown('$$B = M \\times \\frac{p}{100} \\times t$$'))
      .toEqual([{ jenis: 'rumus', tex: 'B = M \\times \\frac{p}{100} \\times t' }]);
    expect(uraiMarkdown('$$\nA = M + B\n$$')).toEqual([{ jenis: 'rumus', tex: 'A = M + B' }]);
    expect(uraiMarkdown('\\[\nB = 40.000\n\\]')).toEqual([{ jenis: 'rumus', tex: 'B = 40.000' }]);
  });
  test('$$…$$ di tengah kalimat tetap rumus display', () => {
    const [p] = uraiMarkdown('Rumusnya $$A = M + B$$ ya.');
    expect(p.isi[1]).toEqual({ jenis: 'rumus', tex: 'A = M + B', tampil: true });
  });
  test('$$ tanpa penutup tetap teks', () => {
    const [p] = uraiMarkdown('$$B = M');
    expect(p.jenis).toBe('paragraf');
    expect(p.isi[0].teks).toBe('$$B = M');
  });
  test('dirender sebagai <math display="block"> di kotak rumus yang bisa digeser', () => {
    const akar = render('$$B = M \\times \\frac{p}{100} \\times t$$');
    const [wadah] = akar.childNodes;
    expect(wadah.tagName).toBe('div');
    expect(wadah.className).toBe('tutor-rumus');
    const [mathEl] = wadah.childNodes;
    expect(mathEl.tagName).toBe('math');
    expect(mathEl.attributes.display).toBe('block');
    expect(cari(mathEl, 'mo').map((e) => e.textContent)).toEqual(['=', '×', '×']);
    expect(cari(mathEl, 'mfrac')[0].childNodes.map((c) => c.textContent)).toEqual(['p', '100']);
  });
  test('aligned dengan \\\\ menjadi beberapa baris (mtable)', () => {
    const akar = render('$$\\begin{aligned} B &= 1.000.000 \\times \\frac{6}{100} \\times \\frac{8}{12} \\\\ &= 40.000 \\end{aligned}$$');
    expect(cari(akar, 'mtr')).toHaveLength(2);
    expect(cari(akar, 'mn').map((e) => e.textContent)).toContain('1.000.000');
    expect(akar.textContent).not.toContain('aligned');
  });
});

describe('LaTeX → MathML', () => {
  const teksSemua = (s) => (s.teks ?? '') + (s.anak ?? []).map(teksSemua).join('');
  test('angka ribuan Indonesia satu <mn>, \\text{Rp} dengan spasi', () => {
    const m = latexKeMathml('\\text{Rp } 1.000.000');
    expect(m.anak[0].anak).toEqual([{ tag: 'mtext', teks: 'Rp ' }, { tag: 'mn', teks: '1.000.000' }]);
  });
  test('pangkat, indeks, akar, \\left( \\right)', () => {
    expect(latexKeMathml('x^{2}').anak[0].anak[0].tag).toBe('msup');
    expect(latexKeMathml('M_0').anak[0].anak[0].tag).toBe('msub');
    expect(latexKeMathml('\\sqrt{4}').anak[0].anak[0].tag).toBe('msqrt');
    expect(latexKeMathml('\\sqrt[3]{8}').anak[0].anak[0].tag).toBe('mroot');
    expect(teksSemua(latexKeMathml('\\left( \\frac{6}{100} \\right)'))).toBe('(6100)');
  });
  test('\\% , \\cdot, \\div, \\le, \\approx', () => {
    expect(teksSemua(latexKeMathml('6\\% \\cdot 2 \\div 3 \\le 4 \\approx 5'))).toBe('6%⋅2÷3≤4≈5');
  });
  test('perintah tidak dikenal tampil apa adanya sebagai mtext (bukan HTML/tautan)', () => {
    const m = latexKeMathml('\\href{javascript:alert(1)}{klik}');
    expect(m.anak[0].anak[0]).toEqual({ tag: 'mtext', teks: '\\href' });
    expect(JSON.stringify(m)).not.toMatch(/"(href|src|on\w+)":/);
  });
  test('hanya tag MathML yang diizinkan, tanpa atribut berbahaya', () => {
    const tag = new Set();
    const kumpulkan = (s) => { tag.add(s.tag); for (const k of Object.keys(s.atribut ?? {})) expect(['display', 'width']).toContain(k); (s.anak ?? []).forEach(kumpulkan); };
    kumpulkan(latexKeMathml('\\begin{aligned} a^2_1 &= \\sqrt[3]{x} \\quad \\\\ b &= \\dfrac{1}{2} \\end{aligned}', { tampil: true }));
    for (const t of tag) expect(TAG_MATHML).toContain(t);
  });
  test('masukan rusak/terlalu dalam/terlalu panjang → null (tidak melempar)', () => {
    expect(latexKeMathml('{'.repeat(MAKS_KEDALAMAN_TEX + 5) + 'x')).toBeNull();
    expect(latexKeMathml('x'.repeat(5000))).toBeNull();
    expect(latexKeMathml('')).toBeNull();
    expect(latexKeMathml(null)).toBeNull();
    expect(latexKeMathml('\\frac{1}')).not.toBeNull();
    expect(latexKeMathml('}}a^')).not.toBeNull();
  });
  test('rumus gagal diurai ditampilkan sebagai kode teks', () => {
    const akar = render(`$$${'{'.repeat(40)}x$$`);
    expect(cari(akar, 'math')).toHaveLength(0);
    expect(cari(akar, 'code')[0].textContent).toContain('{{{');
  });
});

describe('Keamanan renderer', () => {
  const serangan = [
    '<script>alert(1)</script>',
    '<img src=x onerror="alert(1)">',
    '**<b onclick="alert(1)">tebal</b>**',
    '[klik](javascript:alert(1))',
    '| <iframe src="javascript:alert(1)"> | b |\n|---|---|\n| <svg onload=alert(1)> | c |',
    '$\\href{javascript:alert(1)}{x}$',
    '$$<script>alert(1)</script>$$',
    '`<script>alert(1)</script>`',
    '```\n<script>alert(1)</script>\n```',
    '> <style>body{display:none}</style>',
  ];

  test.each(serangan)('%s → hanya teks, tanpa tag/atribut berbahaya', (teks) => {
    const akar = render(teks);
    const izinHtml = new Set(TAG_HTML);
    const izinMath = new Set(TAG_MATHML);
    for (const e of semuaElemen(akar)) {
      if (e.namespaceURI === NS_MATHML) expect(izinMath.has(e.tagName)).toBe(true);
      else expect(izinHtml.has(e.tagName)).toBe(true);
      for (const nama of Object.keys(e.attributes)) {
        expect(['start', 'scope', 'display', 'width']).toContain(nama);
      }
      expect(e.tagName).not.toMatch(/^(script|img|iframe|svg|style|a|b)$/);
    }
    // Isi berbahaya tetap terlihat sebagai teks biasa (tidak hilang, tidak dijalankan).
    if (teks.includes('<script>') && !teks.startsWith('$$')) expect(akar.textContent).toContain('<script>');
  });

  test('kode renderer tidak memakai innerHTML, eval, atau new Function', () => {
    for (const berkas of ['src/komponen/isiTutor.js', 'src/logika/markdownTutor.js', 'src/logika/latexKeMathml.js']) {
      const kode = readFileSync(berkas, 'utf8').replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
      expect(kode).not.toMatch(/innerHTML|outerHTML|insertAdjacentHTML|document\.write|\beval\(|new Function/);
    }
  });

  test('halaman Tutor merender jawaban AI lewat isiPesanTutor, pesan siswa tetap teks', () => {
    const kode = readFileSync('src/halaman/tutor.js', 'utf8');
    expect(kode).toMatch(/item\.role === 'assistant' \? isiPesanTutor\(item\.content\) : el\('p', \{ teks: item\.content \}\)/);
  });

  test('teks kosong atau bukan string tidak membuat galat', () => {
    expect(render('').childNodes).toHaveLength(0);
    expect(render(undefined).childNodes).toHaveLength(0);
  });
});

describe('Contoh jawaban lengkap Tutor AI', () => {
  test('campuran judul, daftar, tabel, rumus inline dan display', () => {
    const jawaban = [
      '### Langkah 1: Kenali data',
      '',
      '| Besaran | Nilai |',
      '|---|---|',
      '| Modal ($M$) | Rp1.000.000 |',
      '',
      '1. Ubah **8 bulan** ke tahun: $t = \\frac{8}{12}$',
      '2. Gunakan rumus:',
      '',
      '$$B = M \\times \\frac{p}{100} \\times t$$',
      '',
      'Coba hitung dulu, ya. Berapa hasilmu?',
    ].join('\n');
    const akar = render(jawaban);
    expect(akar.className).toBe('tutor-isi');
    expect(akar.childNodes.map((c) => c.tagName)).toEqual(['h3', 'div', 'ol', 'div', 'p']);
    expect(cari(akar, 'strong')[0].textContent).toBe('8 bulan');
    expect(cari(akar, 'math')).toHaveLength(3);
    expect(akar.textContent).not.toMatch(/\*\*|\$|\\frac|\|---/);
  });
});
