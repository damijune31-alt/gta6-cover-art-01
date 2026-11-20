// NEON HEAT — Midnight Run Cover Maker: hand-in program (Node 22, stdlib only).
// Copies this repo's app/ and screenshots/ to the output directory and writes
// dossier.json with the vendored make.fun library. Repo root is derived from
// this file's own location, never from the process working directory.

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = dirname(fileURLToPath(import.meta.url));
const appDir = join(repoRoot, 'app');
const shotsDir = join(repoRoot, 'screenshots');
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const indexPath = join(appDir, 'index.html');
if (!existsSync(indexPath) || !statSync(indexPath).isFile()) {
  throw new Error(`main.ts: app/index.html missing under repo root ${repoRoot}`);
}
if (!existsSync(shotsDir) || !statSync(shotsDir).isDirectory()) {
  throw new Error(`main.ts: screenshots/ missing under repo root ${repoRoot}`);
}
const shotFiles = readdirSync(shotsDir).filter((name) => /\.(png|jpe?g)$/i.test(name));
if (shotFiles.length < 3 || shotFiles.length > 4) {
  throw new Error(`main.ts: screenshots/ holds ${shotFiles.length} images, need 3 or 4`);
}

mkdirSync(outDir, { recursive: true });
cpSync(appDir, join(outDir, 'app'), { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
cpSync(shotsDir, join(outDir, 'screenshots'), { recursive: true });

const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});
if (dossier.length === 0) {
  throw new Error('main.ts: buildDossier wrote an empty dossier');
}
const dossierPath = join(outDir, 'dossier.json');
writeFileSync(dossierPath, dossier);
const written = readFileSync(dossierPath);
if (written.length === 0) {
  throw new Error('main.ts: dossier.json is empty after write');
}
const parsed = JSON.parse(written.toString('utf8'));
if (parsed.schema !== 'makefun/dossier/v1') {
  throw new Error(`main.ts: dossier.json schema is ${String(parsed.schema)}, expected makefun/dossier/v1`);
}
console.log(`dossier.json written: ${written.length} bytes`);
