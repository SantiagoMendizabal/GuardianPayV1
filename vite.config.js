import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Expone el servidor a la red local (Wi-Fi)
    port: 3000,
    open: true
  }
});
