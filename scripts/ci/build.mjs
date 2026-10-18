import { build } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// Deliberately ignore repository Vite config and all .env files.
// No service is listening at this endpoint; smoke forbids backend requests.
process.env.VITE_SUPABASE_URL = 'http://127.0.0.1:55439';
process.env.VITE_SUPABASE_ANON_KEY = 'ci-public-dummy';
await build({
  configFile: false,
  envFile: false,
  plugins: [react()],
  resolve: { alias: { '@': path.resolve('src') } },
  build: { outDir: '.tmp/ci-dist', emptyOutDir: true },
});
