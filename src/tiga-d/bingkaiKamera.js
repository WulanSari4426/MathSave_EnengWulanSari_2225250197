/**
 * Perhitungan bingkai kamera untuk ilustrasi 3D (modul murni, tanpa three.js, diuji Vitest).
 * Jarak kamera dipilih agar SELURUH deretan tumpukan masuk kanvas, baik pada kanvas sempit (HP 360 px)
 * maupun lebar (desktop): yang menentukan adalah sudut pandang horizontal, yang bergantung pada rasio kanvas.
 */

const derajatKeRadian = (d) => (d * Math.PI) / 180;

/**
 * @param {object} p
 * @param {number} p.lebar      lebar deretan tumpukan (satuan dunia), dari tepi kiri ke tepi kanan
 * @param {number} p.tinggi     tinggi tumpukan tertinggi
 * @param {number} p.kedalaman  diameter tumpukan (kedalaman objek)
 * @param {number} p.fov        sudut pandang VERTIKAL kamera (derajat)
 * @param {number} p.aspek      lebar ÷ tinggi kanvas
 * @param {number} [p.ruang=1.15] ruang tepi (1.15 = 15% di setiap sisi)
 * @returns {number} jarak kamera ke titik tengah deretan
 */
export function jarakKamera({ lebar, tinggi, kedalaman, fov, aspek, ruang = 1.15 }) {
  const setengahV = derajatKeRadian(fov) / 2;
  const setengahH = Math.atan(Math.tan(setengahV) * aspek);
  const jarakLebar = ((lebar / 2) * ruang) / Math.tan(setengahH);
  const jarakTinggi = ((tinggi / 2) * ruang) / Math.tan(setengahV);
  // Bagian depan tumpukan lebih dekat ke kamera daripada titik tengahnya.
  return Math.max(jarakLebar, jarakTinggi) + kedalaman / 2;
}

/**
 * Posisi kamera: sedikit dari atas (sudut elevasi) agar bentuk silinder terlihat, menghadap titik tengah.
 * @returns {{ posisi: [number, number, number], target: [number, number, number] }}
 */
export function posisiKamera({ lebar, tinggi, kedalaman, fov, aspek, elevasi = 18 }) {
  // Pada sudut elevasi, proyeksi tinggi ke layar ikut membesar; sertakan dalam perhitungan jarak.
  const e = derajatKeRadian(elevasi);
  const tinggiTampak = tinggi * Math.cos(e) + kedalaman * Math.sin(e);
  const jarak = jarakKamera({ lebar, tinggi: tinggiTampak, kedalaman, fov, aspek });
  const target = [0, tinggi / 2, 0];
  return {
    posisi: [0, target[1] + jarak * Math.sin(e), jarak * Math.cos(e)],
    target,
  };
}

/**
 * Apakah titik dunia (x, y, z) masuk bingkai kamera (untuk tes). Kamera di `posisi`, menghadap `target`
 * pada bidang y-z (x kamera = 0), sudut pandang vertikal `fov`, rasio `aspek`.
 */
export function titikTerlihat([x, y, z], { posisi, target }, { fov, aspek }) {
  const arah = [target[0] - posisi[0], target[1] - posisi[1], target[2] - posisi[2]];
  const panjang = Math.hypot(...arah);
  const maju = arah.map((a) => a / panjang);
  const kanan = [1, 0, 0];
  const atas = [kanan[1] * maju[2] - kanan[2] * maju[1], kanan[2] * maju[0] - kanan[0] * maju[2], kanan[0] * maju[1] - kanan[1] * maju[0]].map((v) => -v);
  const rel = [x - posisi[0], y - posisi[1], z - posisi[2]];
  const kedalaman = rel[0] * maju[0] + rel[1] * maju[1] + rel[2] * maju[2];
  if (kedalaman <= 0) return false;
  const px = (rel[0] * kanan[0] + rel[1] * kanan[1] + rel[2] * kanan[2]) / kedalaman;
  const py = (rel[0] * atas[0] + rel[1] * atas[1] + rel[2] * atas[2]) / kedalaman;
  const tanV = Math.tan(derajatKeRadian(fov) / 2);
  return Math.abs(px) <= tanV * aspek + 1e-9 && Math.abs(py) <= tanV + 1e-9;
}
