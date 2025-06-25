// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000', // แก้ไขให้เป็น Base URL ของ Backend
        changeOrigin: true,
        // ลบกฎ rewrite ออก เพราะ Backend ของคุณต้องการ /api อยู่แล้ว
      },
    },
  },
});