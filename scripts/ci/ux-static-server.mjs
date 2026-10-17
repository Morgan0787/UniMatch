import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

// Runner-only, deliberately serves only the approved standalone prototype.
const root = path.resolve('docs/business-turks-2026/ux-05');
const server = createServer(async (request, response) => {
  if (!['GET', 'HEAD'].includes(request.method)) { response.writeHead(405).end(); return; }
  let pathname;
  try { pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname); }
  catch { response.writeHead(400).end(); return; }
  if (pathname === '/favicon.ico') { response.writeHead(204).end(); return; }
  const files = { '/': ['index.html', 'text/html; charset=utf-8'], '/index.html': ['index.html', 'text/html; charset=utf-8'], '/styles.css': ['styles.css', 'text/css; charset=utf-8'], '/app.js': ['app.js', 'text/javascript; charset=utf-8'], '/data.js': ['data.js', 'text/javascript; charset=utf-8'] };
  if (!Object.hasOwn(files, pathname)) { response.writeHead(404).end(); return; }
  try {
    const [file, contentType] = files[pathname];
    const content = await readFile(path.join(root, file));
    response.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': 'no-store' });
    response.end(request.method === 'HEAD' ? undefined : content);
  } catch { response.writeHead(404).end(); }
});
server.listen(5183, '127.0.0.1', () => console.log('UX-05 prototype on runner loopback5183'));
const stop = () => server.close(() => process.exit(0));
process.once('SIGTERM', stop);
process.once('SIGINT', stop);
