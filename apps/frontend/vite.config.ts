import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react()],
  server: {
    allowedHosts: ['client.nanodata.tr', 'rds.pratikbulut.com'],
    proxy: {
      '/api': 'http://localhost:3001',
      '/auth': 'http://localhost:3001',
    }
  }
});
