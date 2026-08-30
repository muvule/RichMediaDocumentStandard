import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import * as path from 'path';

export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      '@rmd/core': path.resolve(__dirname, '../core/src/index.ts')
    }
  },
  server: {
    port: 5173
  }
});
