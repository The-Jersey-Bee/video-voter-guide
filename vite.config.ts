/// <reference types="vitest/config" />
import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  server: {
    // Binds to all network interfaces so the dev server is accessible
    // from other devices on the same network (e.g. mobile testing).
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [],
  },
});
