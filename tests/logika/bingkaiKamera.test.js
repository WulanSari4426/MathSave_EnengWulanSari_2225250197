// Ilustrasi 3D Simulasi: bingkai kamera memuat SELURUH tumpukan di HP (360 px) maupun desktop.
import { describe, test, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { jarakKamera, posisiKamera, titikTerlihat } from '../../src/tiga-d/bingkaiKamera.js';

// Ukuran sama dengan src/tiga-d/ilustrasiTabungan.js
const JARAK = 1.3;
const JARI = 0.5;
const TINGGI_MODAL = 1.2;
const FOV = 40;

/** Semua sudut kotak pembatas setiap tumpukan (bagian bunga tertinggi = 3). */
function sudutTumpukan(n) {
  const titik = [];
  for (let i = 0; i < n; i += 1) {
    const x = (i - (n - 1) / 2) * JARAK;
    const tinggi = TINGGI_MODAL + (3 * (i + 1)) / n;
    for (const dx of [-JARI, JARI]) for (const y of [0, tinggi]) for (const dz of [-JARI, JARI]) titik.push([x + dx, y, dz]);
  }
  return titik;
}

const ukuranDeret = (n) => ({ lebar: (n - 1) * JARAK + 2 * JARI, tinggi: TINGGI_MODAL + 3, kedalaman: 2 * JARI });

// Ukuran kanvas .wadah-3d yang sebenarnya (dari CSS): lebar = layar − padding konten 2×16 − padding kartu 2×24 − garis 2;
// tinggi = 18rem − garis 2 = 286 px. HP 360 px → 278 × 286; desktop (konten maks 480 px) → 398 × 286.
const KANVAS = { 'HP 360 px': 278 / 286, 'HP 320 px': 238 / 286, desktop: 398 / 286, 'desktop lebar': 2.2 };

describe('Bingkai kamera ilustrasi 3D', () => {
  for (const [nama, aspek] of Object.entries(KANVAS)) {
    for (const n of [1, 2, 12, 24]) {
      test(`${nama}: ${n} tumpukan terlihat utuh (tidak ada sudut terpotong)`, () => {
        const kamera = posisiKamera({ ...ukuranDeret(n), fov: FOV, aspek });
        const terpotong = sudutTumpukan(n).filter((t) => !titikTerlihat(t, kamera, { fov: FOV, aspek }));
        expect(terpotong).toEqual([]);
      });
    }
  }

  test('proporsional: kanvas lebih lebar → kamera lebih dekat (tumpukan tampak lebih besar)', () => {
    const d = (aspek) => jarakKamera({ ...ukuranDeret(12), fov: FOV, aspek });
    expect(d(KANVAS['desktop lebar'])).toBeLessThan(d(KANVAS['HP 360 px']));
    expect(d(KANVAS['HP 360 px'])).toBeLessThan(d(KANVAS['HP 320 px']));
  });

  test('ruang tepi: deretan memakai sebagian besar lebar kanvas, tidak mengecil berlebihan', () => {
    const aspek = KANVAS['HP 360 px'];
    const kamera = posisiKamera({ ...ukuranDeret(12), fov: FOV, aspek });
    // Dengan ruang 15%, tepi deret sedikit di dalam batas; diperbesar 1,3× tepi sudah keluar bingkai.
    const tepi = [((ukuranDeret(12).lebar / 2) * 1.3), TINGGI_MODAL, JARI];
    expect(titikTerlihat(tepi, kamera, { fov: FOV, aspek })).toBe(false);
  });

  test('regresi: posisi kamera LAMA memotong tumpukan di HP 360 px (cacat yang dilaporkan)', () => {
    const aspek = KANVAS['HP 360 px'];
    for (const n of [12, 24]) {
      const lama = { posisi: [0, 4.5, Math.max(n * JARAK, 4) * 1.15 + 4], target: [0, 1.8, 0] };
      expect(sudutTumpukan(n).some((t) => !titikTerlihat(t, lama, { fov: FOV, aspek }))).toBe(true);
    }
  });

  test('ilustrasiTabungan.js memakai bingkaiKamera dan menghitung ulang saat ukuran kanvas berubah', () => {
    const isi = readFileSync(join(import.meta.dirname, '..', '..', 'src', 'tiga-d', 'ilustrasiTabungan.js'), 'utf8');
    expect(isi).toMatch(/import \{ posisiKamera \} from '\.\/bingkaiKamera\.js'/);
    expect(isi).toMatch(/const JARAK|jarak = 1\.3/);
    expect(isi).toMatch(/jariJari = 0\.5/);
    expect(isi).toMatch(/tinggiModal = 1\.2/);
    expect(isi).toMatch(/updateProjectionMatrix\(\);\s*\/\/[^\n]*\n\s*bingkai\(\);/);
  });
});
