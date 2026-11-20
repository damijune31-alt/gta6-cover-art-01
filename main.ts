// NEON HEAT — Midnight Run Cover Maker: entrypoint (round-3 rebuild).
// Hands the app in: copies app/ and screenshots/ from beside this file into
// the output directory and writes /output/dossier.json with the kit's
// buildDossier library. The repo root is found from this file's own URL, so
// the grader can run `node /bot/main.ts` from any working directory — the
// round-2 failure was process.cwd() pointing at the grader's folder instead
// of the repo. Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Serve the app locally with `node serve.ts`, then open http://localhost:8080.

import { cpSync, existsSync, mkdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

// Directory holding this entrypoint = the repository root, whatever the
// caller's working directory is.
const repoDir = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function copyIntoOut(name: string): void {
  const src = join(repoDir, name);
  const dst = join(outDir, name);
  cpSync(src, dst, { recursive: true });
  console.log('  copied ' + name + '/');
}

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
copyIntoOut('app');
copyIntoOut('screenshots');

const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);

// The grader runs this program twice and compares the bytes, so a silent
// short write would fail the entry later. Refuse to report success unless
// the dossier is really on disk and non-empty.
const dossierPath = join(outDir, 'dossier.json');
if (!existsSync(dossierPath) || statSync(dossierPath).size === 0) {
  throw new Error('dossier.json was not written to ' + outDir);
}

console.log('NEON HEAT handed in:');
console.log('  repo: ' + repoDir);
console.log('  output: ' + outDir);
console.log('  dossier.json: ' + statSync(dossierPath).size + ' bytes');
