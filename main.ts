// NEON HEAT — Midnight Run Cover Maker: submission entrypoint (round 3, fix 3).
//
// Hands the app in: copies app/ and screenshots/ from beside this file into
// the output directory and writes dossier.json there with the kit library
// (vendor/makefun-app.ts). Run it as:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Try the app first with `node serve.ts` (http://localhost:8080).
//
// The round-3 fix lives in repoRoot(): the repository is located from this
// module's own URL, never from process.cwd(). The grader runs
// `node /bot/main.ts` from its own folder, so cwd points at the grader's
// directory, not the repo — the round-2 run failed with ENOENT for exactly
// that reason. Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output.

import { cpSync, existsSync, mkdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

// The directory this file sits in is the repository root, whatever folder
// the caller ran node from.
function repoRoot(): string {
  return dirname(fileURLToPath(import.meta.url));
}

const ROOT = repoRoot();
const OUT = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const HAND_IN = ['app', 'screenshots'] as const;

function copyHandIn(name: string): void {
  const from = join(ROOT, name);
  const to = join(OUT, name);
  cpSync(from, to, { recursive: true });
  console.log(`copied ${name}/ -> ${to}`);
}

function buildAndWriteDossier(): number {
  const dossier = buildDossier(OUT, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  });
  const target = join(OUT, 'dossier.json');
  writeFileSync(target, dossier);
  return statSync(target).size;
}

// Start from a clean output directory so a stale file can never survive
// from an earlier run: the grader runs this program twice and compares
// the bytes, so both runs must produce the same output.
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
for (const name of HAND_IN) copyHandIn(name);

const dossierBytes = buildAndWriteDossier();

// Refuse to claim success on a half-written hand-in: both the dossier and
// the app's entry page must be on disk, and the dossier must be non-empty.
const entryPage = join(OUT, 'app', 'index.html');
if (dossierBytes === 0 || !existsSync(entryPage)) {
  throw new Error(`hand-in incomplete in ${OUT}: dossier.json or app/index.html missing`);
}

console.log(`NEON HEAT handed in from ${ROOT}`);
console.log(`  output: ${OUT}`);
console.log(`  dossier.json: ${dossierBytes} bytes`);
console.log('  repo root: import.meta.url (works from any cwd)');
