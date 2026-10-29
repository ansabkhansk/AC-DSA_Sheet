import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Same-origin /api in dev mirrors CloudFront in production, so cookies behave the same.
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
});
