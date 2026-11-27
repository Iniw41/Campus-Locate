import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { consultationsSyncPlugin } from '../../packages/shared/viteConsultationsSync.mjs';

export default defineConfig({
  plugins: [react(), consultationsSyncPlugin()],
  server: { port: 5173 }, // admin-frontend uses 5174
  resolve: {
    // '@shared/...' points at packages/shared (logo, backdrop, profile placeholder)
    alias: { '@shared': path.resolve(__dirname, '../../packages/shared') },
  },
});
