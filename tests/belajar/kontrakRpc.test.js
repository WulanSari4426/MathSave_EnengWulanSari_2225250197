// Tes kontrak Fase 6–10: pembungkus frontend ASLI (src/layanan/api.js) dipanggil terhadap fungsi SQL ASLI
// (migrasi + supabase/seed/soal.sql) di PGlite. Menangkap nama parameter atau bentuk data yang tidak cocok,
// yang tidak terlihat di tes logika maupun tes SQL yang terpisah.
import { describe, test, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { buatDb, buatSiswa, rpcSebagai, sebagaiAdmin } from '../db/bantuDb.js';
import {
  ambilProfil, simpanKemajuan, ambilSoalLatihan, ambilPetunjuk, periksaPemahaman, periksaJawabanLatihan,
  mulaiKuis, simpanJawabanKuis, statusKuis, selesaikanKuis, ringkasanKemajuan, riwayatBelajar,
} from '../../src/layanan/api.js';
import { SEMUA_SOAL } from '../../supabase/seed/data/bankSoal.js';
import { susunDiketahui } from '../../src/logika/latihan.js';
import { petaTersimpan, cocokkanAntrean, ringkasStatus, statusSoal } from '../../src/logika/kuis.js';
import { barisAktivitas, saranBerikutnya } from '../../src/logika/riwayat.js';
import { URUTAN_SUB_MATERI } from '../../src/data/materi.js';

const SQL_SOAL = readFileSync(join(import.meta.dirname, '..', '..', 'supabase', 'seed', 'soal.sql'), 'utf8');

/** Klien tiruan dengan antarmuka supabase.rpc(): { data, error }, galat seperti PostgREST. */
function klienUntuk(db, siswa) {
  return {
    async rpc(nama, parameter = {}) {
      try {
        return { data: await rpcSebagai(db, siswa, nama, parameter), error: null };
      } catch (e) {
        return { data: null, error: { message: e.message, details: e.detail ?? null } };
      }
    },
  };
}

let db;
let perKode;
beforeAll(async () => {
  db = await buatDb();
  await sebagaiAdmin(db);
  await db.exec(SQL_SOAL);
  const { rows } = await db.query('select id, kode from public.soal');
  const data = Object.fromEntries(SEMUA_SOAL.map((s) => [s.kode, s]));
  perKode = Object.fromEntries(rows.map((r) => [r.id, data[r.kode]]));
}, 120000);

describe('Fase 6: materi dan kemajuan', () => {
  test('simpan_kemajuan dari halaman Subbab → ringkasan Beranda/Belajar', async () => {
    const klien = klienUntuk(db, await buatSiswa(db, { nama: 'rani_08' }));
    expect((await ambilProfil({ klien })).data.nama_panggilan).toBe('rani_08');
    expect(await simpanKemajuan('P0', 'sedang', 2, { klien })).toEqual({ ok: true, data: { ok: true } });
    for (const id of ['P0', 'M1', 'M2']) expect((await simpanKemajuan(id, 'selesai', 6, { klien })).ok).toBe(true);
    // "selesai" tidak kembali menjadi "sedang" saat siswa membuka ulang kartu
    expect((await simpanKemajuan('M1', 'sedang', 0, { klien })).ok).toBe(true);
    const r = await ringkasanKemajuan({ klien });
    expect(r.data).toMatchObject({ sub_materi_selesai: 3, total_sub_materi: URUTAN_SUB_MATERI.length, sub_materi_lanjut: 'M3' });
    expect(saranBerikutnya(r.data)).toMatchObject({ href: '#/belajar/M3' });
    expect((await simpanKemajuan('M9', 'selesai', 0, { klien })).kode_galat).toBe('INPUT_TIDAK_VALID');
  });
});

describe('Fase 8: latihan lewat api.js', () => {
  test('ambil soal, Pahami Soal, petunjuk 1–3, periksa salah lalu benar', async () => {
    const klien = klienUntuk(db, await buatSiswa(db));
    const soal = await ambilSoalLatihan('M3', 2, 5, { klien });
    expect(soal.ok).toBe(true);
    expect(soal.data.length).toBeGreaterThan(0);
    const s = soal.data[0];
    const bank = perKode[s.id];
    expect(s).not.toHaveProperty('jawaban');
    expect(s.bentuk).toBe('isian');

    // Panel Pahami Soal: isian siswa → susunDiketahui → periksa_pemahaman
    const isian = { modal: String(bank.diketahui.modal), suku_bunga: String(bank.diketahui.suku_bunga), lama: String(bank.diketahui.lama), satuan_lama: bank.diketahui.satuan_lama };
    const susun = susunDiketahui(isian);
    const tepat = await periksaPemahaman(s.id, susun.diketahui, bank.ditanya, { klien });
    expect(tepat.data.semua_tepat).toBe(true);
    const keliru = await periksaPemahaman(s.id, { ...susun.diketahui, satuan_lama: 'tahun' }, bank.ditanya, { klien });
    expect(keliru.data).toMatchObject({ semua_tepat: false, pesan: 'Periksa lagi satuan lama menabung pada soal.' });

    for (const level of [1, 2, 3]) {
      const p = await ambilPetunjuk(s.id, level, { klien });
      expect(p.ok).toBe(true);
      expect(p.data.teks).toBe(bank.petunjuk[level - 1]);
      expect(p.data.level_maks).toBe(3);
    }
    expect((await ambilPetunjuk(s.id, 4, { klien })).kode_galat).toBe('INPUT_TIDAK_VALID');

    const salah = await periksaJawabanLatihan({ soalId: s.id, jawaban: bank.pola_kesalahan[0].nilai, jumlahPetunjuk: 3, durasiDetik: 40 }, { klien });
    expect(salah.data).toMatchObject({ benar: false, jenis_kesalahan: bank.pola_kesalahan[0].jenis });
    expect(salah.data.pembahasan).toHaveLength(4);
    const benar = await periksaJawabanLatihan({ soalId: s.id, jawaban: bank.jawaban, jumlahPetunjuk: 3, durasiDetik: 60 }, { klien });
    expect(benar.data).toMatchObject({ benar: true, jenis_kesalahan: null });
  });

  test('soal kuis tidak bisa dibuka lewat latihan (KF-14)', async () => {
    const klien = klienUntuk(db, await buatSiswa(db));
    const idKuis = Object.entries(perKode).find(([, s]) => s.bank === 'kuis' && s.bentuk === 'isian')[0];
    expect((await ambilPetunjuk(idKuis, 1, { klien })).kode_galat).toBe('SOAL_TIDAK_DITEMUKAN');
    expect((await periksaJawabanLatihan({ soalId: idKuis, jawaban: 1, jumlahPetunjuk: 0, durasiDetik: 1 }, { klien })).kode_galat)
      .toBe('SOAL_TIDAK_DITEMUKAN');
  });
});

describe('Fase 9: kuis lewat api.js dan logika perangkat', () => {
  test('mulai → simpan jawaban (pilihan ganda dengan id opsi, isian dengan angka) → lanjutkan → kumpulkan → hasil', async () => {
    const klien = klienUntuk(db, await buatSiswa(db));
    const awal = await statusKuis({ klien });
    expect(awal.data.percobaan).toMatchObject({ maks: 2, digunakan: 0, sisa: 2, nilai_tertinggi: null });

    const sesi = (await mulaiKuis({ klien })).data;
    expect(sesi.soal).toHaveLength(20);
    expect(sesi.soal.filter((s) => s.bentuk === 'pilihan_ganda')).toHaveLength(15);
    expect(Date.parse(sesi.batas_waktu) - Date.parse(sesi.mulai_pada)).toBe(30 * 60 * 1000);

    // Jawab 10 soal pertama dengan benar
    for (const s of sesi.soal.slice(0, 10)) {
      const bank = perKode[s.id];
      const hasil = await simpanJawabanKuis({
        sesiKuisId: sesi.sesi_kuis_id, soalId: s.id,
        jawaban: bank.bentuk === 'isian' ? bank.jawaban : null,
        opsiId: bank.bentuk === 'pilihan_ganda' ? bank.opsi.find((o) => o.kunci).id : null,
      }, { klien });
      expect(hasil).toEqual({ ok: true, data: { tersimpan: true } });
    }
    // Membuka kuis lagi: sesi sama, waktu tidak diulang, jawaban tersimpan dipakai perangkat
    const lagi = (await statusKuis({ klien })).data;
    expect(lagi.sesi_aktif.sesi_kuis_id).toBe(sesi.sesi_kuis_id);
    expect(lagi.sesi_aktif.batas_waktu).toBe(sesi.batas_waktu);
    const tersimpan = petaTersimpan(lagi.sesi_aktif.jawaban_tersimpan);
    expect(Object.keys(tersimpan)).toHaveLength(10);
    // Antrean offline yang ternyata sudah sampai ke server dibuang; yang baru tetap "Belum terkirim"
    const s0 = sesi.soal[0];
    const antrean = cocokkanAntrean({ [s0.id]: tersimpan[s0.id], [sesi.soal[11].id]: { jawaban: 1, opsi: null } }, tersimpan);
    expect(Object.keys(antrean)).toEqual([sesi.soal[11].id]);
    expect(statusSoal(sesi.soal[11].id, tersimpan, antrean)).toBe('belum_terkirim');
    expect(ringkasStatus(sesi.soal, tersimpan, {}).belum_dijawab).toHaveLength(10);

    const hasil = (await selesaikanKuis(sesi.sesi_kuis_id, { klien })).data;
    expect(hasil).toMatchObject({ skor: 50, jumlah_benar: 10, jumlah_salah: 10, jumlah_tidak_dijawab: 10, cara_selesai: 'siswa', sisa_percobaan: 1, nilai_tertinggi: 50 });
    // Jawaban setelah dikumpulkan ditolak
    expect((await simpanJawabanKuis({ sesiKuisId: sesi.sesi_kuis_id, soalId: sesi.soal[15].id, opsiId: 'o1' }, { klien })).kode_galat)
      .toBe('KUIS_SUDAH_SELESAI');
    // Urutan opsi di hasil sama dengan saat mengerjakan (KF-18 O6)
    const pg = sesi.soal.find((s) => s.bentuk === 'pilihan_ganda');
    expect(hasil.rincian.find((r) => r.soal_id === pg.id).opsi.map((o) => o.id)).toEqual(pg.opsi.map((o) => o.id));

    // Percobaan kedua lebih tinggi → nilai tertinggi berubah; percobaan ketiga ditolak
    const sesi2 = (await mulaiKuis({ klien })).data;
    for (const s of sesi2.soal) {
      const bank = perKode[s.id];
      await simpanJawabanKuis({
        sesiKuisId: sesi2.sesi_kuis_id, soalId: s.id,
        jawaban: bank.bentuk === 'isian' ? bank.jawaban : null,
        opsiId: bank.bentuk === 'pilihan_ganda' ? bank.opsi.find((o) => o.kunci).id : null,
      }, { klien });
    }
    expect((await selesaikanKuis(sesi2.sesi_kuis_id, { klien })).data).toMatchObject({ skor: 100, nilai_tertinggi: 100, sisa_percobaan: 0 });
    expect((await mulaiKuis({ klien })).kode_galat).toBe('BATAS_PERCOBAAN_KUIS');

    // Fase 10: Riwayat dari data yang sama
    const r = (await ringkasanKemajuan({ klien })).data;
    expect(r.kuis.nilai_tertinggi).toBe(100);
    expect(r.kuis.percobaan.map((p) => p.skor)).toEqual([50, 100]);
    const riwayat = (await riwayatBelajar(20, null, { klien })).data;
    const baris = riwayat.map(barisAktivitas);
    expect(baris.filter((b) => b.judul.startsWith('Kuis'))).toHaveLength(2);
    expect(baris[0].href).toBe(`#/kuis/hasil/${sesi2.sesi_kuis_id}`);
  }, 120000);

  test('bank soal kosong → BANK_SOAL_KURANG dengan rincian, kesempatan tidak berkurang', async () => {
    const dbKosong = await buatDb();
    const klien = klienUntuk(dbKosong, await buatSiswa(dbKosong));
    const hasil = await mulaiKuis({ klien });
    expect(hasil.kode_galat).toBe('BANK_SOAL_KURANG');
    expect(hasil.detail.kombinasi_kurang).toHaveLength(17);
    expect((await statusKuis({ klien })).data.percobaan.digunakan).toBe(0);
    // Latihan tanpa soal → daftar kosong (halaman menampilkan "Belum ada soal")
    expect((await ambilSoalLatihan('M3', 1, 5, { klien })).data).toEqual([]);
  }, 60000);
});
