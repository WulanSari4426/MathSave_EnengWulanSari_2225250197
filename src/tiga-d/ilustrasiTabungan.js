/**
 * Ilustrasi 3D tumpukan koin untuk halaman Simulasi (PRD F-04; design.md 8; AGENTS.md §5).
 * Dimuat HANYA lewat import() dinamis setelah siswa menekan tombol (halaman/simulasi.js).
 *
 *  - Setiap periode = satu tumpukan: bagian bawah (modal, tetap) warna --warna-permukaan bergaris tepi,
 *    bagian atas (bunga) warna --warna-utama, sehingga pertumbuhan linear bunga tunggal terlihat.
 *  - Maksimal 24 tumpukan, geometri sederhana, tanpa bayangan, rasio piksel ≤ 2.
 *  - TIDAK ada animasi otomatis: gambar ulang hanya saat siswa memutar/memperbesar (OrbitControls 'change').
 *  - dispose() membersihkan geometri, material, renderer, dan pendengar peristiwa.
 */
import {
  WebGLRenderer, Scene, PerspectiveCamera, CylinderGeometry, MeshLambertMaterial, Mesh, Group, Color,
  AmbientLight, DirectionalLight, EdgesGeometry, LineSegments, LineBasicMaterial, Vector3,
} from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { posisiKamera } from './bingkaiKamera.js';

export const MAKS_TUMPUKAN = 24;

/** true jika perangkat bisa membuat konteks WebGL. */
export function webglTersedia() {
  try {
    const kanvas = document.createElement('canvas');
    return Boolean(window.WebGLRenderingContext && (kanvas.getContext('webgl2') || kanvas.getContext('webgl')));
  } catch {
    return false;
  }
}

function warnaToken(nama) {
  const nilai = getComputedStyle(document.documentElement).getPropertyValue(nama).trim();
  return new Color(nilai || '#000');
}

/**
 * @param {HTMLElement} wadah elemen .wadah-3d
 * @param {Array<{label: string, modal: number, bunga: number}>} tumpukan
 * @returns {{ perbarui: (tumpukan) => void, aturUlang: () => void, dispose: () => void }}
 */
export function buatIlustrasi(wadah, tumpukan) {
  const renderer = new WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = false;
  renderer.setClearColor(warnaToken('--warna-kartu'));
  wadah.replaceChildren(renderer.domElement);
  renderer.domElement.setAttribute('role', 'img');

  const scene = new Scene();
  const FOV = 40;
  const kamera = new PerspectiveCamera(FOV, 1, 0.1, 400);
  scene.add(new AmbientLight(0xffffff, 1.6));
  const cahaya = new DirectionalLight(0xffffff, 1.2);
  cahaya.position.set(4, 10, 8);
  scene.add(cahaya);

  const kontrol = new OrbitControls(kamera, renderer.domElement);
  kontrol.enableDamping = false; // damping butuh animasi terus-menerus
  kontrol.enablePan = false;

  const bahanModal = new MeshLambertMaterial({ color: warnaToken('--warna-permukaan') });
  const bahanBunga = new MeshLambertMaterial({ color: warnaToken('--warna-utama') });
  const bahanTepi = new LineBasicMaterial({ color: warnaToken('--warna-utama-tua') });
  let grup = new Group();
  scene.add(grup);
  const sumberDaya = []; // geometri yang harus di-dispose

  const gambar = () => renderer.render(scene, kamera);
  let ukuranDeret = null; // { lebar, tinggi, kedalaman } dari bangun()

  /** Menempatkan kamera agar seluruh deretan tumpukan masuk kanvas (bingkaiKamera.js). */
  function bingkai() {
    if (!ukuranDeret) return;
    const { posisi, target } = posisiKamera({ ...ukuranDeret, fov: FOV, aspek: kamera.aspect });
    kamera.position.set(...posisi);
    kontrol.target.copy(new Vector3(...target));
    kontrol.minDistance = 2;
    kontrol.maxDistance = kamera.position.distanceTo(kontrol.target) * 3;
    kontrol.update();
    kontrol.saveState();
  }

  function ukur() {
    const lebar = wadah.clientWidth || 300;
    const tinggi = wadah.clientHeight || 288;
    renderer.setSize(lebar, tinggi, false);
    kamera.aspect = lebar / tinggi;
    kamera.updateProjectionMatrix();
    // Rasio kanvas berubah (HP diputar, jendela diubah) → bingkai dihitung ulang agar tetap utuh.
    bingkai();
    gambar();
  }

  function kosongkan() {
    scene.remove(grup);
    for (const g of sumberDaya.splice(0)) g.dispose();
    grup = new Group();
    scene.add(grup);
  }

  function bangun(daftar) {
    kosongkan();
    const data = daftar.slice(-MAKS_TUMPUKAN);
    const maksBunga = Math.max(...data.map((d) => d.bunga), 1);
    const tinggiModal = 1.2;
    const jarak = 1.3;
    const jariJari = 0.5;
    data.forEach((d, i) => {
      const x = (i - (data.length - 1) / 2) * jarak;
      const gModal = new CylinderGeometry(jariJari, jariJari, tinggiModal, 24);
      sumberDaya.push(gModal);
      const modal = new Mesh(gModal, bahanModal);
      modal.position.set(x, tinggiModal / 2, 0);
      const tepi = new EdgesGeometry(gModal, 30);
      sumberDaya.push(tepi);
      const garis = new LineSegments(tepi, bahanTepi);
      garis.position.copy(modal.position);
      grup.add(modal, garis);

      // Tinggi bagian bunga sebanding dengan bunga (diperbesar agar terlihat; keterangan di halaman).
      const tinggiBunga = Math.max(0.02, (3 * d.bunga) / maksBunga);
      const gBunga = new CylinderGeometry(jariJari, jariJari, tinggiBunga, 24);
      sumberDaya.push(gBunga);
      const bunga = new Mesh(gBunga, bahanBunga);
      bunga.position.set(x, tinggiModal + tinggiBunga / 2, 0);
      grup.add(bunga);
    });
    // Ukuran deret: dari tepi tumpukan pertama sampai tepi tumpukan terakhir.
    const tinggiMaks = tinggiModal + Math.max(...data.map((d) => Math.max(0.02, (3 * d.bunga) / maksBunga)));
    ukuranDeret = { lebar: (data.length - 1) * jarak + 2 * jariJari, tinggi: tinggiMaks, kedalaman: 2 * jariJari };
    bingkai();
    renderer.domElement.setAttribute('aria-label',
      `Ilustrasi ${data.length} tumpukan koin. Bagian bawah modal awal yang tetap, bagian atas hijau besar bunga yang bertambah sama setiap periode.`);
    gambar();
  }

  kontrol.addEventListener('change', gambar);
  const pengamat = typeof ResizeObserver === 'function' ? new ResizeObserver(ukur) : null;
  pengamat?.observe(wadah);
  ukur();
  bangun(tumpukan);

  return {
    perbarui: bangun,
    aturUlang() {
      kontrol.reset();
      gambar();
    },
    dispose() {
      pengamat?.disconnect();
      kontrol.removeEventListener('change', gambar);
      kontrol.dispose();
      kosongkan();
      bahanModal.dispose();
      bahanBunga.dispose();
      bahanTepi.dispose();
      renderer.dispose();
      renderer.forceContextLoss?.();
      renderer.domElement.remove();
    },
  };
}
