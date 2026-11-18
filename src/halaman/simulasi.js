/**
 * Simulasi tabungan (PRD F-04; design.md 5.8, 8).
 * Masukan → rumus tersubstitusi, besar bunga, jumlah tabungan akhir, dan tabel per periode.
 * Hasil diperbarui ±300 ms setelah siswa berhenti mengetik, tanpa animasi angka.
 * Ilustrasi 3D dimuat dengan import() dinamis HANYA setelah tombol ditekan (AGENTS.md §5).
 */
import { el, kepalaHalaman, tombol, isiUlang } from '../komponen/elemen.js';
import { kotakRumus, tabelMateri } from '../komponen/blokMateri.js';
import { bacaMasukanSimulasi, hitungSimulasi } from '../logika/simulasi.js';

export function tampilkan(wadah) {
  let jeda = null;
  let ilustrasi = null;
  let memuat3d = false;
  let terakhir = null;

  const kolom = (id, label, nilai, keterangan) => {
    const input = el('input', { id, className: 'isian', inputmode: 'decimal', autocomplete: 'off', value: nilai });
    return { input, elemen: el('div', { className: 'kolom-isian' }, el('label', { for: id, teks: label }), input,
      keterangan ? el('p', { className: 'keterangan', teks: keterangan }) : null) };
  };
  const modal = kolom('sim-modal', 'Modal awal (Rp)', '1.000.000', 'Contoh: 1000000 atau 1.000.000');
  const suku = kolom('sim-suku', 'Suku bunga (% per tahun)', '6');
  const lamaInput = el('input', { id: 'sim-lama', className: 'isian', inputmode: 'decimal', autocomplete: 'off', value: '12' });
  const satuan = el('select', { className: 'isian isian-pilihan', 'aria-label': 'Satuan lama menabung' },
    ...['bulan', 'tahun', 'hari'].map((s) => el('option', { value: s, teks: s })));
  const lama = el('div', { className: 'kolom-isian' }, el('label', { for: 'sim-lama', teks: 'Lama menabung' }),
    el('div', { className: 'baris-isian' }, lamaInput, satuan));

  const pesan = el('p', { className: 'pesan-galat', role: 'alert', hidden: true });
  const hasilEl = el('div', { className: 'isi-kartu', 'aria-live': 'polite' });
  const wadah3d = el('div', { className: 'wadah-3d', hidden: true });
  const keterangan3d = el('p', { className: 'keterangan', hidden: true });
  const status3d = el('p', { className: 'keterangan', role: 'status' });
  const tombol3d = tombol('Tampilkan ilustrasi 3D', () => buka3d(), { sekunder: true });
  const tombolUlang = tombol('Atur ulang tampilan', () => ilustrasi?.aturUlang(), { sekunder: true });
  tombolUlang.hidden = true;

  wadah.append(el('section', { className: 'halaman' },
    kepalaHalaman({ judul: 'Simulasi Tabungan', subjudul: 'Ubah angkanya, lalu lihat hasilnya.', ilustrasi: 'koin' }),
    el('div', { className: 'kartu isi-kartu' }, modal.elemen, suku.elemen, lama, pesan),
    el('div', { className: 'kartu' }, hasilEl),
    el('div', { className: 'kartu isi-kartu' }, tombol3d, status3d, wadah3d, keterangan3d, tombolUlang)));

  function hitung() {
    for (const i of [modal.input, suku.input, lamaInput]) i.removeAttribute('aria-invalid');
    const masukan = bacaMasukanSimulasi({
      modal: modal.input.value, sukuBunga: suku.input.value, lama: lamaInput.value, satuan: satuan.value,
    });
    if (!masukan.ok) return tampilkanGalat(masukan.pesan, { modal: modal.input, sukuBunga: suku.input, lama: lamaInput }[masukan.kolom]);
    const h = hitungSimulasi(masukan.data);
    if (!h.ok) return tampilkanGalat(h.pesan);
    pesan.hidden = true;
    terakhir = h;
    isiUlang(hasilEl,
      el('h2', { teks: 'Hasil' }),
      kotakRumus(h.rumus),
      el('h3', { teks: 'Pertumbuhan tabungan' }),
      tabelMateri({ kepala: h.kepalaTabel, baris: h.baris.map((b) => [b.periode, b.bunga, b.tabungan]) }));
    // Kolom angka rata kanan (design.md 6)
    for (const td of hasilEl.querySelectorAll('td:not(:first-child), th:not(:first-child)')) td.classList.add('angka');
    keterangan3d.textContent = `Bagian hijau = bunga. Bertambah sama setiap ${h.satuanTumpukan}. Tinggi bagian hijau diperbesar agar mudah dilihat.`;
    ilustrasi?.perbarui(h.tumpukan);
    return undefined;
  }

  function tampilkanGalat(teks, input) {
    pesan.textContent = `✕ ${teks}`;
    pesan.hidden = false;
    input?.setAttribute('aria-invalid', 'true');
    terakhir = null;
    isiUlang(hasilEl, el('p', { className: 'keterangan', teks: 'Perbaiki isian di atas untuk melihat hasilnya.' }));
  }

  function jadwalkan() {
    clearTimeout(jeda);
    jeda = setTimeout(hitung, 300);
  }
  for (const i of [modal.input, suku.input, lamaInput]) i.addEventListener('input', jadwalkan);
  satuan.addEventListener('change', hitung);

  async function buka3d() {
    if (memuat3d || ilustrasi || !terakhir) return;
    memuat3d = true;
    tombol3d.disabled = true;
    status3d.textContent = 'Memuat ilustrasi…';
    try {
      const modul = await import('../tiga-d/ilustrasiTabungan.js');
      if (!wadah3d.isConnected) return;
      if (!modul.webglTersedia()) {
        status3d.textContent = 'Perangkatmu belum mendukung tampilan 3D. Lihat tabel di atas.';
        return;
      }
      wadah3d.hidden = false;
      keterangan3d.hidden = false;
      ilustrasi = modul.buatIlustrasi(wadah3d, terakhir.tumpukan);
      tombol3d.hidden = true;
      tombolUlang.hidden = false;
      status3d.textContent = 'Geser dengan jari untuk memutar, cubit untuk memperbesar.';
    } catch {
      status3d.textContent = 'Ilustrasi 3D belum bisa dimuat. Lihat tabel di atas.';
      tombol3d.disabled = false;
    } finally {
      memuat3d = false;
    }
  }

  hitung();
  return () => {
    clearTimeout(jeda);
    ilustrasi?.dispose(); // AGENTS.md §5: dispose saat keluar halaman
    ilustrasi = null;
  };
}
