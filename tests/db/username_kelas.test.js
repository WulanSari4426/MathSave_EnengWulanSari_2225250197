// Fase 5A Tahap 2 — migrasi 20261112000005_username_dan_kelas.sql (KF-05f).
// Diuji di PGlite. PGlite hanya punya satu koneksi, jadi "bersamaan" berarti diserialkan;
// pengaman utamanya adalah batasan UNIQUE di database, yang juga diuji langsung.
import { describe, test, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import {
  buatDb, jalankanMigrasi, sebagai, sebagaiAdmin, sebagaiAnon, sebagaiServiceRole, rpcSebagai,
} from './bantuDb.js';
import { tambahSoalLatihan } from './soalUji.js';

const MIGRASI_5 = '20261112000005_username_dan_kelas.sql';
const FUNGSI_BARU = [
  'status_batas_daftar', 'catat_kode_kelas_salah', 'daftar_kelas_aktif', 'username_tersedia',
  'cari_siswa_username', 'simpan_siswa_mandiri', 'buat_reset_pin_siswa', 'kelola_kelas_daftar',
  'kelola_kelas_tambah', 'kelola_kelas_ubah_nama', 'kelola_kelas_setel_aktif', 'beri_username_akun_lama',
];

/** Menjalankan SQL sebagai service_role (seperti Edge Function / skrip pengelola). */
async function sr(db, sql, nilai = []) {
  await sebagaiServiceRole(db);
  try {
    return (await db.query(sql, nilai)).rows;
  } finally {
    await sebagaiAdmin(db);
  }
}
const srSatu = async (db, sql, nilai) => (await sr(db, sql, nilai))[0]?.h;

/** Membuat pengguna Auth (seperti auth.admin.createUser) lalu simpan_siswa_mandiri. */
async function daftarkan(db, { username, kelasId, ip = 'ip-a' }) {
  const siswaId = randomUUID();
  const authId = randomUUID();
  await sebagaiAdmin(db);
  await db.query('insert into auth.users (id, email) values ($1, $2)', [authId, `${siswaId}@siswa.mathsave.invalid`]);
  const hasil = await srSatu(db, 'select public.simpan_siswa_mandiri($1, $2, $3, $4, $5) as h',
    [siswaId, authId, username, kelasId, ip]);
  return { siswaId, authId, hasil };
}

const tambahKelas = (db, nama, jenjang, urutan = 0) =>
  srSatu(db, 'select public.kelola_kelas_tambah($1, $2, $3) as h', [nama, jenjang, urutan]);

async function jumlah(db, sql, nilai = []) {
  await sebagaiAdmin(db);
  return Number((await db.query(sql, nilai)).rows[0].n);
}

// ---------------------------------------------------------------------------
describe('Struktur dan hak akses', () => {
  let db;
  beforeAll(async () => { db = await buatDb(); }, 60000);

  test('RLS aktif di tabel baru, dan anon maupun siswa tidak bisa membacanya', async () => {
    await sebagaiAdmin(db);
    const { rows } = await db.query(
      `select relname, relrowsecurity from pg_class where relname in ('kelas', 'percobaan_daftar') order by 1`);
    expect(rows).toEqual([
      { relname: 'kelas', relrowsecurity: true }, { relname: 'percobaan_daftar', relrowsecurity: true },
    ]);
    for (const peran of ['anon', 'authenticated']) {
      for (const tabel of ['kelas', 'percobaan_daftar']) {
        if (peran === 'anon') await sebagaiAnon(db);
        else await sebagai(db, randomUUID());
        await expect(db.query(`select * from public.${tabel}`)).rejects.toThrow(/permission denied/);
        await sebagaiAdmin(db);
      }
    }
  });

  test.each(FUNGSI_BARU)('fungsi %s hanya bisa dijalankan service_role', async (nama) => {
    await sebagaiAdmin(db);
    const { rows } = await db.query(
      `select has_function_privilege('anon', p.oid, 'execute') as anon,
              has_function_privilege('authenticated', p.oid, 'execute') as siswa,
              has_function_privilege('service_role', p.oid, 'execute') as server
         from pg_proc p join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public' and p.proname = $1`, [nama]);
    expect(rows).toEqual([{ anon: false, siswa: false, server: true }]);
  });

  test('tidak ada fungsi untuk menghapus kelas', async () => {
    await sebagaiAdmin(db);
    const { rows } = await db.query(`select proname from pg_proc where proname ilike '%kelas%hapus%'`);
    expect(rows).toEqual([]);
  });

  test('file migrasi tanpa DROP/TRUNCATE; satu-satunya DELETE hanya baris penguncian status_masuk', () => {
    const sql = readFileSync(join(import.meta.dirname, '..', '..', 'supabase', 'migrations', MIGRASI_5), 'utf8')
      .replace(/--.*$/gm, '');
    expect(sql).not.toMatch(/\bdrop\s+(table|column|schema|index)\b/i);
    expect(sql).not.toMatch(/\btruncate\b/i);
    expect(sql.match(/\bdelete\s+from\s+[\w.]+/gi)).toEqual(['delete from public.status_masuk']);
  });
});

// ---------------------------------------------------------------------------
describe('Pengelolaan kelas (U6)', () => {
  let db;
  beforeAll(async () => { db = await buatDb(); }, 60000);

  test('tambah, urutan tampil, nama dirapikan, dan nama ganda (tanpa beda huruf besar/kecil) ditolak', async () => {
    const xipa = await tambahKelas(db, '  X IPA 1 ', 10);
    const viiic = await tambahKelas(db, 'VIII-C', 8, 2);
    const viiia = await tambahKelas(db, 'VIII-A', 8, 1);
    expect(await srSatu(db, 'select public.daftar_kelas_aktif() as h')).toEqual([
      { id: viiia, nama: 'VIII-A', jenjang: 8 },
      { id: viiic, nama: 'VIII-C', jenjang: 8 },
      { id: xipa, nama: 'X IPA 1', jenjang: 10 },
    ]);
    await expect(tambahKelas(db, 'viii-c', 8)).rejects.toThrow(/KELAS_SUDAH_ADA/);
  });

  test.each([['VI-A', 6], ['XIII-A', 13], ['   ', 8], ['Nama kelas yang terlalu panjang', 9]])(
    'kelas tidak sah ditolak: "%s" jenjang %i', async (nama, jenjang) => {
      await expect(tambahKelas(db, nama, jenjang)).rejects.toThrow(/KELAS_TIDAK_SAH/);
    });

  test('nonaktif disembunyikan dari pilihan, aktif lagi muncul kembali; id tidak dikenal ditolak', async () => {
    const id = await tambahKelas(db, 'IX-B', 9);
    await sr(db, 'select public.kelola_kelas_setel_aktif($1, false)', [id]);
    let aktif = await srSatu(db, 'select public.daftar_kelas_aktif() as h');
    expect(aktif.map((k) => k.id)).not.toContain(id);
    await sr(db, 'select public.kelola_kelas_setel_aktif($1, true)', [id]);
    aktif = await srSatu(db, 'select public.daftar_kelas_aktif() as h');
    expect(aktif.map((k) => k.id)).toContain(id);
    await expect(sr(db, 'select public.kelola_kelas_setel_aktif(32000::smallint, false)'))
      .rejects.toThrow(/KELAS_TIDAK_DITEMUKAN/);
  });

  test('ubah nama tidak mengubah teks kelas siswa yang sudah tersimpan; jumlah siswa terhitung', async () => {
    const id = await tambahKelas(db, 'XI TKJ 1', 11);
    await daftarkan(db, { username: 'budi_tkj', kelasId: id });
    await sr(db, 'select public.kelola_kelas_ubah_nama($1, $2)', [id, 'XI TKJ 2']);
    await sebagaiAdmin(db);
    const { rows } = await db.query(`select kelas, kelas_id from public.siswa where username = 'budi_tkj'`);
    expect(rows).toEqual([{ kelas: 'XI TKJ 1', kelas_id: id }]);
    const daftar = await srSatu(db, 'select public.kelola_kelas_daftar() as h');
    expect(daftar.find((k) => k.id === id)).toMatchObject({ nama: 'XI TKJ 2', jumlah_siswa: 1, aktif: true });
  });

  test('kelas yang sudah dipakai siswa tidak bisa dihapus, bahkan langsung oleh pemilik database', async () => {
    const id = await tambahKelas(db, 'XII-A', 12);
    await daftarkan(db, { username: 'citra_xii', kelasId: id });
    await sebagaiAdmin(db);
    await expect(db.query('delete from public.kelas where id = $1', [id])).rejects.toThrow(/foreign key/);
  });
});

// ---------------------------------------------------------------------------
describe('Username unik dan pendaftaran mandiri (U1–U5)', () => {
  let db;
  let kelasId;
  beforeAll(async () => {
    db = await buatDb();
    kelasId = await tambahKelas(db, 'VIII-C', 8);
  }, 60000);

  test('pendaftaran berhasil: huruf kecil, nama tampilan = username, kelas tersalin, tanpa kode_hash', async () => {
    const { siswaId, authId, hasil } = await daftarkan(db, { username: '  Rani_08 ', kelasId });
    expect(hasil).toEqual({ id: siswaId, nama_panggilan: 'rani_08', kelas: 'VIII-C' });
    await sebagaiAdmin(db);
    const { rows } = await db.query(
      `select auth_user_id, username, nama_panggilan, kelas, kelas_id, kode_hash, aktif,
              pin_dibuat_pada is not null as pin_ada
         from public.siswa where id = $1`, [siswaId]);
    expect(rows[0]).toEqual({
      auth_user_id: authId, username: 'rani_08', nama_panggilan: 'rani_08', kelas: 'VIII-C',
      kelas_id: kelasId, kode_hash: null, aktif: true, pin_ada: true,
    });
  });

  test('username sama dengan huruf berbeda ditolak USERNAME_SUDAH_DIPAKAI, tanpa sisa data', async () => {
    const sebelum = await jumlah(db, 'select count(*) as n from public.percobaan_daftar');
    await expect(daftarkan(db, { username: 'RANI_08', kelasId })).rejects.toThrow(/USERNAME_SUDAH_DIPAKAI/);
    expect(await jumlah(db, `select count(*) as n from public.siswa where username = 'rani_08'`)).toBe(1);
    // transaksi dibatalkan: percobaan 'akun_baru' tidak tercatat untuk pendaftaran yang gagal
    expect(await jumlah(db, 'select count(*) as n from public.percobaan_daftar')).toBe(sebelum);
    expect(await srSatu(db, 'select public.username_tersedia($1) as h', ['Rani_08'])).toBe(false);
    expect(await srSatu(db, 'select public.username_tersedia($1) as h', ['rani_09'])).toBe(true);
  });

  test('dua pendaftaran "bersamaan" dengan username sama → tepat satu berhasil', async () => {
    const hasil = await Promise.allSettled([
      daftarkan(db, { username: 'dimas', kelasId }),
      daftarkan(db, { username: 'DIMAS', kelasId }),
    ]);
    expect(hasil.filter((h) => h.status === 'fulfilled')).toHaveLength(1);
    expect(hasil.find((h) => h.status === 'rejected').reason.message).toMatch(/USERNAME_SUDAH_DIPAKAI/);
    expect(await jumlah(db, `select count(*) as n from public.siswa where username = 'dimas'`)).toBe(1);
  });

  test('database sendiri menolak username ganda dan huruf besar, walau aplikasi keliru', async () => {
    await sebagaiAdmin(db);
    const sisip = async (username) => {
      const id = randomUUID();
      await db.query('insert into auth.users (id) values ($1)', [id]);
      await db.query(
        `insert into public.siswa (auth_user_id, username, nama_panggilan, kelas) values ($1, $2, 'x', 'VIII-C')`,
        [id, username]);
    };
    await expect(sisip('rani_08')).rejects.toThrow(/siswa_username_unik/);
    await expect(sisip('Eka')).rejects.toThrow(/siswa_username_format/);
  });

  test.each(['ab', '1abc', '_abc', 'rani-08', 'rani budi', 'a'.repeat(21), 'réni', ''])(
    'format username tidak sah ditolak: "%s"', async (username) => {
      await expect(daftarkan(db, { username, kelasId })).rejects.toThrow(/USERNAME_TIDAK_SAH/);
    });

  test('batas panjang 3 dan 20 karakter diterima', async () => {
    await daftarkan(db, { username: 'abc', kelasId });
    await daftarkan(db, { username: 'a'.repeat(20), kelasId });
  });

  test('kelas nonaktif atau tidak dikenal ditolak KELAS_TIDAK_SAH', async () => {
    const nonaktif = await tambahKelas(db, 'VII-Z', 7);
    await sr(db, 'select public.kelola_kelas_setel_aktif($1, false)', [nonaktif]);
    await expect(daftarkan(db, { username: 'fajar', kelasId: nonaktif })).rejects.toThrow(/KELAS_TIDAK_SAH/);
    await expect(daftarkan(db, { username: 'fajar', kelasId: 32000 })).rejects.toThrow(/KELAS_TIDAK_SAH/);
    expect(await jumlah(db, `select count(*) as n from public.siswa where username = 'fajar'`)).toBe(0);
  });

  test('cari_siswa_username: tidak peka huruf besar, akun nonaktif dan tidak dikenal → null', async () => {
    const cari = (u) => srSatu(db, 'select public.cari_siswa_username($1) as h', [u]);
    expect(await cari(' RANI_08 ')).toMatchObject({ username: 'rani_08', nama_panggilan: 'rani_08', kelas: 'VIII-C' });
    expect(await cari('tidak_ada')).toBeNull();
    const { siswaId } = await daftarkan(db, { username: 'gita', kelasId });
    await sebagaiAdmin(db);
    await db.query('update public.siswa set aktif = false where id = $1', [siswaId]);
    expect(await cari('gita')).toBeNull();
  });

  test('akun username baru bisa memakai RPC siswa (ambil_profil = username sebagai nama tampilan)', async () => {
    const { authId } = await daftarkan(db, { username: 'hana', kelasId });
    expect(await rpcSebagai(db, { authId }, 'ambil_profil')).toEqual({ nama_panggilan: 'hana', kelas: 'VIII-C' });
  });

  test('baris tanpa username DAN tanpa kode_hash ditolak database', async () => {
    await sebagaiAdmin(db);
    const id = randomUUID();
    await db.query('insert into auth.users (id) values ($1)', [id]);
    await expect(db.query(
      `insert into public.siswa (auth_user_id, nama_panggilan, kelas) values ($1, 'x', 'VIII-C')`, [id],
    )).rejects.toThrow(/siswa_punya_identitas_login/);
  });
});

// ---------------------------------------------------------------------------
describe('Batas pendaftaran per IP (U9: 60 akun baru, 20 kode kelas salah, per jam)', () => {
  let db;
  let kelasId;
  beforeAll(async () => {
    db = await buatDb();
    kelasId = await tambahKelas(db, 'VIII-C', 8);
  }, 60000);

  const status = (ip) => srSatu(db, 'select public.status_batas_daftar($1) as h', [ip]);

  test('kode kelas salah: ke-19 belum, ke-20 tercapai; IP lain tidak terpengaruh', async () => {
    for (let i = 0; i < 19; i += 1) await sr(db, 'select public.catat_kode_kelas_salah($1)', ['ip-salah']);
    expect((await status('ip-salah')).kode_kelas_salah_tercapai).toBe(false);
    await sr(db, 'select public.catat_kode_kelas_salah($1)', ['ip-salah']);
    expect(await status('ip-salah')).toEqual({ kode_kelas_salah_tercapai: true, akun_baru_tercapai: false });
    expect((await status('ip-lain')).kode_kelas_salah_tercapai).toBe(false);
  });

  test('catatan lebih dari 1 jam lalu tidak dihitung', async () => {
    await sebagaiAdmin(db);
    await db.query(`update public.percobaan_daftar set dibuat_pada = now() - interval '61 minutes'
                     where ip_hash = 'ip-salah'`);
    expect((await status('ip-salah')).kode_kelas_salah_tercapai).toBe(false);
  });

  test('akun baru: ke-60 diterima, ke-61 ditolak TERLALU_BANYAK_PENDAFTARAN tanpa membuat siswa', async () => {
    await sebagaiAdmin(db);
    await db.query(`insert into public.percobaan_daftar (ip_hash, jenis)
                    select 'ip-sekolah', 'akun_baru' from generate_series(1, 59)`);
    expect((await status('ip-sekolah')).akun_baru_tercapai).toBe(false);
    await daftarkan(db, { username: 'siswa_ke60', kelasId, ip: 'ip-sekolah' });
    expect((await status('ip-sekolah')).akun_baru_tercapai).toBe(true);
    await expect(daftarkan(db, { username: 'siswa_ke61', kelasId, ip: 'ip-sekolah' }))
      .rejects.toThrow(/TERLALU_BANYAK_PENDAFTARAN/);
    expect(await jumlah(db, `select count(*) as n from public.siswa where username = 'siswa_ke61'`)).toBe(0);
    await daftarkan(db, { username: 'siswa_ip_lain', kelasId, ip: 'ip-rumah' });
  });

  test('satu kelas (30 siswa) dari satu Wi-Fi bisa mendaftar semua', async () => {
    for (let i = 0; i < 30; i += 1) {
      await daftarkan(db, { username: `kelas_viii_${String(i).padStart(2, '0')}`, kelasId, ip: 'ip-wifi' });
    }
    expect(await jumlah(db, `select count(*) as n from public.siswa where username like 'kelas_viii_%'`)).toBe(30);
  });
});

// ---------------------------------------------------------------------------
describe('Akun lama dan keutuhan data (U8): migrasi 0005 dijalankan di atas data yang sudah ada', () => {
  let db;
  let lama;
  let soalId;
  const TABEL_LAMA = [
    'siswa', 'soal', 'sesi_kuis', 'kisi_kisi_kuis', 'sesi_kuis_soal', 'percobaan_jawaban',
    'kemajuan_materi', 'penjelasan_siswa', 'percobaan_masuk', 'status_masuk', 'reset_pin',
  ];
  const KOLOM_SISWA_LAMA = 'id, auth_user_id, kode_hash, pin_dibuat_pada, nama_panggilan, kelas, aktif, dibuat_pada';

  async function potret() {
    await sebagaiAdmin(db);
    const hasil = {};
    for (const t of TABEL_LAMA) {
      const kolom = t === 'siswa' ? KOLOM_SISWA_LAMA : '*';
      const { rows } = await db.query(`select md5(coalesce(string_agg(r::text, '|' order by r::text), '')) as sidik,
                                              count(*) as n from (select ${kolom} from public.${t}) r`);
      hasil[t] = { n: Number(rows[0].n), sidik: rows[0].sidik };
    }
    return hasil;
  }

  beforeAll(async () => {
    db = await buatDb({ sebelum: '20261112000005' });   // database seperti sebelum Fase 5A
    // Akun lama berbasis kode siswa + data belajar + catatan login
    await sebagaiAdmin(db);
    lama = { siswaId: randomUUID(), authId: randomUUID() };
    await db.query('insert into auth.users (id, email) values ($1, $2)', [lama.authId, `${lama.siswaId}@siswa.mathsave.invalid`]);
    await db.query(
      `insert into public.siswa (id, auth_user_id, kode_hash, nama_panggilan, kelas, pin_dibuat_pada)
       values ($1, $2, 'hash-kode-S001', 'Rani', 'VIII-C', now())`, [lama.siswaId, lama.authId]);
    soalId = await tambahSoalLatihan(db, 'M3-T2-LAMA');
    await rpcSebagai(db, lama, 'periksa_jawaban', {
      p_soal_id: soalId, p_jawaban: 80000, p_jumlah_petunjuk: 1, p_durasi_detik: 30, p_sesi_kuis_id: null,
    });
    await rpcSebagai(db, lama, 'simpan_kemajuan', { p_sub_materi: 'M3', p_status: 'selesai', p_kartu_terakhir: 4 });
    await rpcSebagai(db, lama, 'simpan_penjelasan', { p_soal_id: soalId, p_isi: 'Karena 8 bulan = 8/12 tahun.' });
    await sr(db, 'select public.catat_percobaan_masuk($1, false, $2)', ['hash-kode-S001', 'ip-x']);
  }, 60000);

  test('semua tabel lama identik (jumlah baris dan isi) sebelum dan sesudah migrasi 0005', async () => {
    const sebelum = await potret();
    expect(sebelum.siswa.n).toBe(1);
    expect(sebelum.percobaan_jawaban.n).toBe(1);
    await jalankanMigrasi(db, MIGRASI_5);
    expect(await potret()).toEqual(sebelum);
  });

  test('akun lama tetap sah: kolom baru kosong, login lama (kode_hash) dan RPC siswa tetap jalan', async () => {
    await sebagaiAdmin(db);
    const { rows } = await db.query('select username, kelas_id, kode_hash from public.siswa where id = $1', [lama.siswaId]);
    expect(rows[0]).toEqual({ username: null, kelas_id: null, kode_hash: 'hash-kode-S001' });
    expect(await srSatu(db, 'select public.cari_siswa_untuk_masuk($1) as h', ['hash-kode-S001']))
      .toMatchObject({ id: lama.siswaId, auth_user_id: lama.authId });
    expect(await rpcSebagai(db, lama, 'ambil_profil')).toEqual({ nama_panggilan: 'Rani', kelas: 'VIII-C' });
    const r = await rpcSebagai(db, lama, 'ringkasan_kemajuan');
    expect(r.sub_materi_selesai).toBe(1);
  });

  test('beri username ke akun lama: id, akun Auth, dan data belajar tidak berubah', async () => {
    await sr(db, 'select public.beri_username_akun_lama($1, $2)', [lama.siswaId, 'Rani_Lama']);
    await sebagaiAdmin(db);
    const { rows } = await db.query(
      'select id, auth_user_id, username, kode_hash, nama_panggilan from public.siswa where id = $1', [lama.siswaId]);
    expect(rows[0]).toEqual({
      id: lama.siswaId, auth_user_id: lama.authId, username: 'rani_lama', kode_hash: 'hash-kode-S001', nama_panggilan: 'Rani',
    });
    expect(await jumlah(db, 'select count(*) as n from public.percobaan_jawaban where siswa_id = $1', [lama.siswaId])).toBe(1);
    expect(await jumlah(db, 'select count(*) as n from public.kemajuan_materi where siswa_id = $1', [lama.siswaId])).toBe(1);
    expect(await srSatu(db, 'select public.cari_siswa_username($1) as h', ['rani_lama'])).toMatchObject({ id: lama.siswaId });
    await expect(sr(db, 'select public.beri_username_akun_lama($1, $2)', [lama.siswaId, 'lain']))
      .rejects.toThrow(/AKUN_TIDAK_DITEMUKAN_ATAU_SUDAH_PUNYA_USERNAME/);
  });

  test('reset PIN berdasarkan siswa.id: kunci penguncian dihapus, kode reset lama dibatalkan, data tetap', async () => {
    await sr(db, 'select public.catat_percobaan_masuk($1, false, null)', ['kunci-username-rani_lama']);
    const authId1 = await srSatu(db, `select public.buat_reset_pin_siswa($1, $2, 'token-1', '24 hours', 'peneliti') as h`,
      [lama.siswaId, 'kunci-username-rani_lama']);
    expect(authId1).toBe(lama.authId);
    await srSatu(db, `select public.buat_reset_pin_siswa($1, $2, 'token-2', '24 hours', 'peneliti') as h`,
      [lama.siswaId, 'kunci-username-rani_lama']);
    await sebagaiAdmin(db);
    expect(await jumlah(db, `select count(*) as n from public.status_masuk where kode_hash = 'kunci-username-rani_lama'`)).toBe(0);
    expect(await jumlah(db, `select count(*) as n from public.reset_pin where siswa_id = $1 and kedaluwarsa_pada > now()`,
      [lama.siswaId])).toBe(1);
    expect(await jumlah(db, 'select count(*) as n from public.percobaan_jawaban where siswa_id = $1', [lama.siswaId])).toBe(1);
    expect(await srSatu(db, `select public.buat_reset_pin_siswa($1, 'k', 't', '1 hour', 'peneliti') as h`, [randomUUID()]))
      .toBeNull();
  });

  test('username yang sudah dipakai tidak bisa diberikan ke akun lama lain', async () => {
    const lain = { siswaId: randomUUID(), authId: randomUUID() };
    await sebagaiAdmin(db);
    await db.query('insert into auth.users (id) values ($1)', [lain.authId]);
    await db.query(`insert into public.siswa (id, auth_user_id, kode_hash, nama_panggilan, kelas)
                    values ($1, $2, 'hash-kode-S002', 'Budi', 'VIII-C')`, [lain.siswaId, lain.authId]);
    await expect(sr(db, 'select public.beri_username_akun_lama($1, $2)', [lain.siswaId, 'RANI_LAMA']))
      .rejects.toThrow(/USERNAME_SUDAH_DIPAKAI/);
  });
});
