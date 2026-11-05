import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'node:path'
import seoPlugin from './scripts/seo-plugin.mjs'

// https://vite.dev/config/
export default defineConfig({
  logLevel: 'error',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  plugins: [react(), seoPlugin()]
});
