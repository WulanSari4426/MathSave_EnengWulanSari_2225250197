import { defineConfig } from 'vite';

export default defineConfig({
  // Jalur relatif agar hasil build bisa di-host di subfolder hosting statis (KF-01).
  base: './',
  server: {
    // Memungkinkan uji coba dari ponsel Android di jaringan Wi-Fi yang sama.
    host: true,
  },
  build: {
    target: 'es2020',
  },
  test: {
    include: ['tests/**/*.test.js'],
  },
});
