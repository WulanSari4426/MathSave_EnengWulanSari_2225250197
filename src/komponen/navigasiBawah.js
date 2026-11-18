
const atributIkon = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';

export const MENU = [
  {
    id: 'beranda',
    label: 'Beranda',
    href: '#/beranda',
    ikon: `<svg ${atributIkon}><path class="ikon-isi" d="M5 10v10.5h14V10L12 4.5z" stroke="none"/><path d="M3 11 12 3.5 21 11"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-5.5a2 2 0 0 1 4 0V21"/></svg>`,
  },
  {
    id: 'belajar',
    label: 'Belajar',
    href: '#/belajar',
    ikon: `<svg ${atributIkon}><path class="ikon-isi" d="M3 5h6a3 3 0 0 1 3 3v12a2 2 0 0 0-2-2H3zM21 5h-6a3 3 0 0 0-3 3v12a2 2 0 0 1 2-2h7z" stroke="none"/><path d="M3 5h6a3 3 0 0 1 3 3v12a2 2 0 0 0-2-2H3z"/><path d="M21 5h-6a3 3 0 0 0-3 3v12a2 2 0 0 1 2 2h7z"/></svg>`,
  },
  {
    id: 'latihan',
    label: 'Latihan',
    href: '#/latihan',
    ikon: `<svg ${atributIkon}><rect class="ikon-isi" x="5" y="3" width="14" height="18" rx="3" stroke="none"/><rect x="5" y="3" width="14" height="18" rx="3"/><path d="M8.5 7.5h7"/><path d="M8.5 12h1M12 12h1M15.5 12h0M8.5 16h1M12 16h1"/><path d="M15.5 15v2"/></svg>`,
  },
  {
    id: 'riwayat',
    label: 'Riwayat',
    href: '#/riwayat',
    ikon: `<svg ${atributIkon}><rect class="ikon-isi" x="3.5" y="3.5" width="17" height="17" rx="4" stroke="none"/><rect x="3.5" y="3.5" width="17" height="17" rx="4"/><path d="M7.5 16v-3M12 16V8.5M16.5 16v-5"/></svg>`,
  },
  {
    id: 'tutor',
    label: 'Tutor AI',
    href: '#/tutor',
    ikon: `<svg ${atributIkon}><path class="ikon-isi" d="M12 3a7 7 0 0 0-4 12.75V19h8v-3.25A7 7 0 0 0 12 3z" stroke="none"/><path d="M9 21h6M9 18h6M12 3a7 7 0 0 0-4 12.75V19h8v-3.25A7 7 0 0 0 12 3z"/><path d="M12 7v4M10 9h4"/></svg>`,
  },
];

export function buatNavigasiBawah(wadah) {
  const daftar = document.createElement('ul');

  for (const menu of MENU) {
    const tautan = document.createElement('a');
    tautan.href = menu.href;
    tautan.className = 'navigasi-bawah-tautan';
    tautan.dataset.menu = menu.id;
    tautan.innerHTML = menu.ikon;

    const label = document.createElement('span');
    label.className = 'nav-label';
    label.textContent = menu.label;

    tautan.append(label);

    const item = document.createElement('li');
    item.append(tautan);
    daftar.append(item);
  }

  wadah.replaceChildren(daftar);
}

export function perbaruiNavigasiBawah(wadah, rute) {
  const menuAktif = rute?.menu || '';

  wadah.querySelectorAll('[data-menu]').forEach((tautan) => {
    const aktif = tautan.dataset.menu === menuAktif;

    if (aktif) {
      tautan.setAttribute('aria-current', 'page');
    } else {
      tautan.removeAttribute('aria-current');
    }

    tautan.classList.toggle('aktif', aktif);
  });
}
