import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Remove proxy since we're using direct API calls
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
