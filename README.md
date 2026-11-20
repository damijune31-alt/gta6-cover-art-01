# NEON HEAT — Midnight Run Cover Maker

[![make.fun](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/damijune31-alt/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/damijune31-alt/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

An entry for [Make GTA 6 Cover Art](https://make.fun/bounty/gta6-cover-art-01)
on [make.fun](https://make.fun/): a launch-week tool for GTA VI that turns
photos into shareable cover art, right in the browser, with nothing uploaded
anywhere.

## The cover it makes

The design the player picked (sample 6) is a busy poster, not a single photo
with a caption stamped on it:

- **Nine panels, nine photos** — a 3×3 grid of different photorealistic
  photos of real people: neon couple, surfer, biker, fisherman, night market,
  convertible, rooftop, speedboat, boulevard.
- **A giant gradient title** ("MIDNIGHT RUN") with a glowing neon script
  subtitle ("Neon Heat") and a **NEW** badge. The title gets its own band at
  the top of the cover, above the grid, so it never hides a bottom-row panel.
- **A Vice City sunset grade** — warm orange into pink — with grain and a
  vignette. Neon, Vice, and Golden grades are one click away.
- **A footer strip** naming the edition, below the grid, never over a photo.

## Using it

```sh
node serve.ts
```

Then open http://localhost:8080 in desktop Chrome.

1. Pick a panel, pick one of the nine sample photos for it — or upload your
   own photo. Uploads are read on your machine and never leave it.
2. Crop with the zoom and position sliders; edit the title and subtitle.
3. Export a PNG in **1080×1080**, **1080×1350**, or **1920×1080** — or all
   three at once. No watermark, no upload, no account, no network request.

## Files

- `app/index.html` — the page and its controls.
- `app/style.css` — the dark neon look of the editor.
- `app/src/app.js` — the cover engine. One renderer draws the title band,
  the 3×3 grid, and the footer strip onto a canvas, for the live preview and
  for PNG export alike, so what you see is what you get.
- `app/samples/` — the nine photos shipped with the app.
- `main.ts` — the entrypoint: copies `app/` and `screenshots/` to the output
  directory and writes `dossier.json` with the kit's `buildDossier`. It finds
  the repository from its own file URL, so it works from any working
  directory.
- `shots.json` — the four screenshots and the URL that produces each one.
- `screenshots/` — the four screenshots: the editor with a photo loaded, and
  the covers the app exported.

Everything runs offline in the browser.

## Originality

All art in this repository is original. No Rockstar Games logo, official
artwork, or font is used. The nine sample photos were generated for this
entry.
