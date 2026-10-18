import { preview } from 'vite';

const server = await preview({
  configFile: false,
  envFile: false,
  build: { outDir: '.tmp/ci-dist' },
  preview: { host: '127.0.0.1', port: 5182, strictPort: true },
});
const stop = async () => {
  await new Promise(resolve => server.httpServer.close(resolve));
  process.exit(0);
};
process.once('SIGTERM', stop);
process.once('SIGINT', stop);
console.log('Isolated built preview: http://127.0.0.1:5182');
