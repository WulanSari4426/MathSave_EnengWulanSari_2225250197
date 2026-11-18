/**
 * Lembar dari bawah / dialog (design.md 5.5 Pahami Soal, 5.9a–5.9d) memakai <dialog> bawaan:
 * fokus terkunci di dalam dialog dan tombol Esc/kembali menutupnya.
 */
import { el } from './elemen.js';

/**
 * @param {{ judul: string, label?: string, onTutup?: () => void }} opsi
 * @returns {{ dialog: HTMLDialogElement, isi: HTMLElement, buka: () => void, tutup: () => void, terbuka: () => boolean }}
 */
export function buatLembar({ judul, onTutup } = {}) {
  const h2 = el('h2', { teks: judul });
  const isi = el('div', { className: 'grup-tombol' });
  const dialog = el('dialog', { className: 'lembar' }, h2, isi);
  const id = `lembar-${Math.random().toString(36).slice(2, 8)}`;
  h2.id = id;
  dialog.setAttribute('aria-labelledby', id);
  dialog.addEventListener('close', () => onTutup?.());

  return {
    dialog,
    isi,
    judul: h2,
    buka() {
      if (!dialog.isConnected) document.body.append(dialog);
      if (dialog.open) return;
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
    },
    tutup() {
      if (typeof dialog.close === 'function' && dialog.open) dialog.close();
      else dialog.removeAttribute('open');
    },
    terbuka: () => dialog.open || dialog.hasAttribute('open'),
    hapus() {
      if (dialog.open && typeof dialog.close === 'function') dialog.close();
      dialog.remove();
    },
  };
}
