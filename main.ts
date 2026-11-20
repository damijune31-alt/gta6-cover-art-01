// NEON HEAT — Midnight Run Cover Maker: entrypoint.
// Copies app/ and screenshots/ into the output directory and writes the
// dossier with the kit's buildDossier library. Run from the repo root:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = process.cwd();
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
cpSync(join(repoRoot, 'app'), join(outDir, 'app'), { recursive: true });
cpSync(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });

const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);

console.log('NEON HEAT handed in:');
console.log('  output: ' + outDir);
console.log('  app/ copied, screenshots/ copied');
console.log('  dossier.json: ' + dossier.length + ' bytes');
