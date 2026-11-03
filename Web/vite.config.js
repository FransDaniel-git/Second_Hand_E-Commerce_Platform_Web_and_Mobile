import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc'; // tetap pakai SWC
import 'tailwind-scrollbar-hide';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000', // Backend server
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api'), // Keep /api prefix if needed
      },
    },
  },
});