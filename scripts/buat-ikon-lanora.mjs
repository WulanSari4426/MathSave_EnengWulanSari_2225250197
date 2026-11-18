/**
 * Membuat aset merek Lanora dari src/komponen/logo.js (satu sumber gambar):
 *   public/favicon.svg     emblem sederhana (tanpa simbol kecil) agar jelas di 16–32 px
 *   public/logo-lanora.svg emblem + tulisan "Lanora"
 *   <folderBahan>/ikon-*.html  halaman bahan untuk dipotret Edge/Chrome headless menjadi PNG
 *
 * Pakai: node scripts/buat-ikon-lanora.mjs <folderBahan>
 * Ikon PNG berlatar penuh (tanpa sudut membulat), karena Android dan iOS memotongnya sendiri.
 * Isi emblem berada di zona aman tengah (±80%), sehingga aman untuk ikon "maskable".
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { emblemSvg, logoLengkapSvg } from '../src/komponen/logo.js';

const akar = join(import.meta.dirname, '..');
const folderBahan = process.argv[2];
if (!folderBahan) {
  console.error('Cara pakai: node scripts/buat-ikon-lanora.mjs <folderBahan>');
  process.exit(1);
}

writeFileSync(join(akar, 'public', 'favicon.svg'), emblemSvg({ sederhana: true, sudut: 26 }));
writeFileSync(join(akar, 'public', 'logo-lanora.svg'), logoLengkapSvg());

mkdirSync(folderBahan, { recursive: true });
for (const [nama, ukuran] of [['ikon-192', 192], ['ikon-512', 512], ['apple-touch-icon', 180]]) {
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
html,body{margin:0;padding:0;width:${ukuran}px;height:${ukuran}px;overflow:hidden;background:#17784F}
svg{display:block}</style></head><body>${emblemSvg({ sudut: 0, skala: 0.78, ukuran })}</body></html>`;
  writeFileSync(join(folderBahan, `${nama}.html`), html);
}
console.log('favicon.svg, logo-lanora.svg, dan halaman bahan ikon dibuat.');
