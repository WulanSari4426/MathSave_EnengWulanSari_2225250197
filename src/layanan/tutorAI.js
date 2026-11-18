import { supabase } from './supabase.js';

/** Pesan untuk siswa per kode galat Edge Function tutor-ai. */
const PESAN_GALAT_TUTOR = {
  TIDAK_MASUK: 'Sesimu sudah berakhir. Silakan masuk lagi.',
  SESI_TIDAK_VALID: 'Sesimu sudah berakhir. Silakan masuk lagi.',
  AKSES_SISWA_DITOLAK: 'Tutor AI hanya untuk akun siswa.',
  TUTOR_AI_SIBUK: 'Tutor AI sedang ramai. Tunggu sebentar, lalu coba lagi.',
  TUTOR_AI_LAMBAT: 'Tutor AI terlalu lama menjawab. Coba kirim lagi.',
  PESAN_TIDAK_VALID: 'Pesanmu belum bisa dikirim. Coba tulis ulang.',
  RIWAYAT_TIDAK_VALID: 'Percakapan terlalu panjang. Mulai percakapan baru, ya.',
  GALAT_JARINGAN: 'Internet terputus. Periksa koneksimu, lalu coba lagi.',
};
const PESAN_BAWAAN = 'Maaf, Tutor AI belum bisa menjawab. Coba lagi nanti.';

/** Pesan yang ditampilkan ke siswa untuk sebuah kode galat. */
export function pesanGalatTutor(kodeGalat) {
  return PESAN_GALAT_TUTOR[kodeGalat] ?? PESAN_BAWAAN;
}

/** Kode galat dari respons non-2xx Edge Function (FunctionsHttpError.context berisi Response). */
async function bacaKodeGalat(error) {
  if (error?.name === 'FunctionsFetchError') return 'GALAT_JARINGAN';
  try {
    const isi = await error?.context?.json();
    if (typeof isi?.kode_galat === 'string') return isi.kode_galat;
  } catch {
    // Badan bukan JSON (misalnya galat gateway).
  }
  return 'TUTOR_AI_SEDANG_TIDAK_TERSEDIA';
}

/**
 * Mengirim percakapan siswa ke Tutor AI.
 * Riwayat percakapan tetap dikelola di perangkat siswa.
 * Token sesi siswa dikirim otomatis oleh supabase.functions.invoke.
 */
export async function kirimPesanTutor(messages, { klien = supabase } = {}) {
  if (!klien) {
    return { ok: false, kode_galat: 'BELUM_TERHUBUNG' };
  }

  try {
    const { data, error } = await klien.functions.invoke('tutor-ai', {
      body: { messages },
    });

    if (error) {
      const kode_galat = await bacaKodeGalat(error);
      // Hanya kode galat (tanpa isi pesan siswa) agar penyebab mudah dilacak di konsol peramban.
      console.warn('Tutor AI gagal:', kode_galat);
      return { ok: false, kode_galat };
    }

    if (typeof data?.answer !== 'string' || !data.answer.trim()) {
      return { ok: false, kode_galat: 'JAWABAN_AI_TIDAK_VALID' };
    }

    return {
      ok: true,
      data: {
        answer: data.answer.trim(),
        model: data.model,
      },
    };
  } catch {
    return { ok: false, kode_galat: 'GALAT_JARINGAN' };
  }
}
