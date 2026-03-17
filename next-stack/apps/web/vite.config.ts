import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

export default defineConfig({
  envDir: path.resolve(__dirname, '../..'),
  plugins: [react(), tailwindcss()],
  server: {
    allowedHosts: ['.ngrok-free.dev'],
  },
  preview: {
    allowedHosts: ['.ngrok-free.dev'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
