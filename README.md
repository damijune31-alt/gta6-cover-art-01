# NEON HEAT — Midnight Run Cover Maker

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/damijune31-alt/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/damijune31-alt/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

A GTA-style cover art maker that runs fully offline in the browser. Pick a
panel, load your own photo into it, edit the title and subtitle, choose a
sunset grade, and export a share-ready PNG in square, portrait, or landscape.

## Quick start

```sh
node serve.ts
# open http://localhost:8080
```

Hand the entry in (writes `out/dossier.json`):

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## How it works

- The cover is a 3×3 grid of nine photo panels, each filled with its own
  photo, cropped to cover its panel.
- A title band sits above the grid with a giant gradient NEON HEAT title, a
  neon-script Midnight Run subtitle, and a NEW star badge.
- A warm sunset grade (orange + pink) washes over the whole cover.
- A footer strip below the grid reads VICE CITY • SUNSET EDITION • NEON HEAT
  and never covers any photo.

## Layout

| Size | Width | Height | Title band | Grid | Footer |
| --- | --- | --- | --- | --- | --- |
| square | 1080 | 1080 | 18% | 68% | 14% |
| portrait | 1080 | 1350 | 16% | 70% | 14% |
| landscape | 1920 | 1080 | 20% | 64% | 16% |

The title band height, grid position and size, and footer height are computed
by `layoutFor(width, height)` in `app/src/app.js`, so every export size keeps
the same proportions.

## Editor

- Panel picker 1–9, with per-panel photo upload (crop + position).
- Title and subtitle inputs, grade picker (sunset, neon, vice, golden).
- Size picker (square 1080×1080, portrait 1080×1350, landscape 1920×1080).
- Export button writes a PNG of the cover at the chosen size.

Query params: `shot=cover|editor`, `size=square|portrait|landscape`,
`panel=1..9`, `title`, `subtitle`.

## Files

- `app/index.html` — editor page + cover canvas.
- `app/style.css` — theme, cover modes, editor layout.
- `app/src/app.js` — samples, palettes, sizes, layout math, painters, export.
- `app/samples/` — nine photorealistic sample photos, one per panel.
- `main.ts` — hand-in program: copies `app/` + `screenshots/`, writes the dossier.
- `serve.ts` — static server for local testing.

---

<sub>Entered on [make.fun](https://make.fun/?ref=x9vj0gh6&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
