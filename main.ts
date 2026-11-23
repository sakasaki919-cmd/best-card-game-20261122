// Lantern Duel of the Ember Isles — make.fun entry program (Node 22,
// standard library only). It hands the game in: copies this repository's
// game/ and screenshots/ into the output directory and writes
// dossier.json there with the vendored make.fun library.
//
// Run locally to check the hand-in:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// In the grader, MAKEFUN_OUTPUT_DIR is unset and /output is used.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = dirname(fileURLToPath(import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const gameSource = join(repoRoot, 'game');
const shotsSource = join(repoRoot, 'screenshots');
const gameDest = join(outputDir, 'game');
const shotsDest = join(outputDir, 'screenshots');

mkdirSync(outputDir, { recursive: true });
cpSync(gameSource, gameDest, { recursive: true });
mkdirSync(shotsDest, { recursive: true });
if (existsSync(shotsSource)) {
  cpSync(shotsSource, shotsDest, { recursive: true });
}

// Caps matching the sealed gate: at most 4 screenshots of 256 KiB each,
// game/ within 993 files and 48 MiB, paths within 1000 bytes, and the
// dossier text capped at 160 KiB.
const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);
