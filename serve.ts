// NEON HEAT — Midnight Run Cover Maker: local preview server.
// Serves app/ at http://localhost:8080 so the cover maker can be tried in
// desktop Chrome. Run from anywhere:  node serve.ts
// The app folder is found from this file's own URL, not from the caller's
// working directory.

import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = 8080;
const APP_DIR = resolve(dirname(fileURLToPath(import.meta.url)), 'app');

function mimeFor(path: string): string {
  const known: Record<string, string> = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
  };
  return known[extname(path).toLowerCase()] ?? 'application/octet-stream';
}

function safePath(requestPath: string): string | null {
  const cleaned = normalize(decodeURIComponent(requestPath)).replace(/^(\.\.[/\\])+/, '');
  const file = join(APP_DIR, cleaned === '/' ? 'index.html' : cleaned);
  if (!file.startsWith(APP_DIR + '/') && file !== APP_DIR) return null;
  if (!existsSync(file) || !statSync(file).isFile()) return null;
  return file;
}

const server = createServer((req, res) => {
  const target = new URL(req.url ?? '/', 'http://localhost');
  const file = safePath(target.pathname);
  if (file === null) {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('not found\n');
    return;
  }
  res.writeHead(200, { 'content-type': mimeFor(file) });
  createReadStream(file).pipe(res);
});

server.listen(PORT, () => {
  console.log('NEON HEAT cover maker at http://localhost:' + PORT);
});
