import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const backendPort = process.env.BACKEND_PORT || '8001';
const frontendPort = parseInt(process.env.PORT || '3001');

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Expone el servidor a la red local (Wi-Fi)
    port: frontendPort,
    open: false,
    proxy: {
      '/api': {
        target: `http://127.0.0.1:${backendPort}`,
        changeOrigin: true
      },
      '/health': {
        target: `http://127.0.0.1:${backendPort}`,
        changeOrigin: true
      }
    }
  }
});
