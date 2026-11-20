# NEON HEAT — Midnight Run Cover Maker

[![make.fun](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/damijune31-alt/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/damijune31-alt/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

An entry for [Make GTA 6 Cover Art](https://make.fun/bounty/gta6-cover-art-01) on [make.fun](https://make.fun/).

## What it is

A launch-week sharing tool for GTA VI: an offline browser web app that turns
photos into GTA 6-style cover art — the iconic multi-panel poster and
loading-screen look with a Vice City neon-sunset grade — and exports it as a
PNG to share.

- **Busy 9-panel cover**: nine different photorealistic photos of real people
  (neon couple, surfer, biker, fisherman, night market, convertible, rooftop,
  speedboat, boulevard), each in its own panel.
- **Giant gradient title** ("MIDNIGHT RUN") with a neon script subtitle
  ("Neon Heat") and a **NEW** badge. The title lives in its own band above
  the grid, so it can never cover the bottom-row panels.
- **Sunset grade** (plus Neon, Vice, and Golden grades) with grain and vignette.
- **Any photo**: pick a sample for any panel, drag the crop with zoom and
  position sliders, or upload your own photo. Uploads stay on your device.
- **Fast and easy**: one tap exports a PNG in **1080×1080**, **1080×1350**,
  or **1920×1080** — or all three at once. No watermark, no upload, no account.

## Try it

```sh
node serve.ts
```

Then open http://localhost:8080 in desktop Chrome.

## How it works

- `app/index.html` — the page. `app/style.css` — the look.
  `app/src/app.js` — the cover engine: one `drawCover` function renders the
  title band, the 3×3 grid, and the footer strip onto a canvas, both for the
  on-screen preview and for PNG export, so what you see is what you get.
- `app/samples/` — the nine photos shipped with the app.
- `main.ts` — the entrypoint: copies `app/` and `screenshots/` to the output
  directory and writes `dossier.json` with the kit's `buildDossier`.
- `shots.json` — the four screenshots and the URL that produces each one.
- `screenshots/` — the four screenshots of the app and its exported covers.

Everything runs offline in the browser. The app makes no network request.

## Originality

All art in this repository is original. No Rockstar Games logo, official
artwork, or font is used. The nine sample photos were generated for this entry.
