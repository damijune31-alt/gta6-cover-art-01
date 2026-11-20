// NEON HEAT — Midnight Run Cover Maker: local preview server.
//
// Serves app/ at http://localhost:8080 so the cover maker can be tried in
// desktop Chrome. Run from anywhere:
//   node serve.ts
// The app folder is located from this file's own URL, not from the caller's
// working directory — the same import.meta.url fix as main.ts.

import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = Number(process.env.PORT ?? 8080);
const APP_DIR = resolve(dirname(fileURLToPath(import.meta.url)), 'app');

const MIME = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.webp', 'image/webp'],
  ['.svg', 'image/svg+xml'],
]);

function mimeFor(path: string): string {
  return MIME.get(extname(path).toLowerCase()) ?? 'application/octet-stream';
}

// Map a request path to a file inside app/, or null when it escapes the
// folder or names nothing on disk. A bare "/" serves the entry page.
function resolveRequest(requestPath: string): string | null {
  let cleaned: string;
  try {
    cleaned = decodeURIComponent(requestPath);
  } catch {
    return null;
  }
  const relative = cleaned.replace(/^\/+/, '').replace(/\\/g, '/');
  const candidate = resolve(APP_DIR, relative === '' ? 'index.html' : relative);
  if (candidate !== APP_DIR && !candidate.startsWith(APP_DIR + '/')) return null;
  if (!existsSync(candidate) || !statSync(candidate).isFile()) return null;
  return candidate;
}

const server = createServer((req, res) => {
  const target = new URL(req.url ?? '/', 'http://localhost');
  const file = resolveRequest(target.pathname);
  if (file === null) {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('not found\n');
    return;
  }
  res.writeHead(200, { 'content-type': mimeFor(file) });
  createReadStream(file).pipe(res);
});

server.listen(PORT, () => {
  console.log(`NEON HEAT cover maker at http://localhost:${PORT}`);
  console.log(`serving ${APP_DIR}`);
});
