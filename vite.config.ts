import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://api.dhan.co',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        secure: true,
        headers: {
          'Origin': 'https://api.dhan.co'
        }
      },
      '/marketdata-api': {
        target: 'https://api-feed.dhan.co',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/marketdata-api/, ''),
        secure: true,
        headers: {
          'Origin': 'https://api-feed.dhan.co'
        }
      }
    }
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
