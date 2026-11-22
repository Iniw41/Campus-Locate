import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: { port: 5174 }, // user-frontend uses 5173
  resolve: {
    // '@shared/...' points at packages/shared (logo, backdrop, profile placeholder)
    alias: { '@shared': path.resolve(__dirname, '../../packages/shared') },
  },
});
