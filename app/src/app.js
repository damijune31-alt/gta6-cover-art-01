/* NEON HEAT — Midnight Run Cover Maker.
   Offline browser app. One renderer paints the whole cover — title band on
   top, 3x3 photo grid in the middle, footer strip at the bottom — onto any
   canvas, so the live preview and the exported PNG are the same drawing.
   The rule that makes export work: every drawing function below receives
   the canvas context it paints on. The old code painted photos onto the
   preview canvas even while exporting, so exported PNGs came out without
   their photos; nothing here touches a global context. */

(function () {
  'use strict';

  // The nine photos shipped with the app, in grid order.
  const SAMPLES = [
    { id: 'neon-couple', label: 'Neon couple', src: 'samples/neon-couple.jpg' },
    { id: 'surfer', label: 'Surfer', src: 'samples/surfer.jpg' },
    { id: 'biker', label: 'Biker', src: 'samples/biker.jpg' },
    { id: 'fisherman', label: 'Fisherman', src: 'samples/fisherman.jpg' },
    { id: 'market', label: 'Night market', src: 'samples/market.jpg' },
    { id: 'convertible', label: 'Convertible', src: 'samples/convertible.jpg' },
    { id: 'rooftop', label: 'Rooftop', src: 'samples/rooftop.jpg' },
    { id: 'speedboat', label: 'Speedboat', src: 'samples/speedboat.jpg' },
    { id: 'boulevard', label: 'Boulevard', src: 'samples/boulevard.jpg' },
  ];

  // Colour grades: a wash over each photo, the title gradient, the glow.
  const PALETTES = {
    sunset: {
      wash: ['rgba(255,140,0,0.10)', 'rgba(255,45,120,0.20)'],
      title: ['#ffb347', '#ff5e62', '#ff2d78'],
      glow: '#ff2d78',
    },
    neon: {
      wash: ['rgba(255,45,200,0.12)', 'rgba(0,220,255,0.16)'],
      title: ['#7df9ff', '#ff2d78', '#b967ff'],
      glow: '#00dcff',
    },
    vice: {
      wash: ['rgba(150,80,255,0.14)', 'rgba(0,200,190,0.14)'],
      title: ['#c084fc', '#ff2d78', '#22d3ee'],
      glow: '#b967ff',
    },
    golden: {
      wash: ['rgba(255,190,60,0.12)', 'rgba(225,29,72,0.18)'],
      title: ['#ffd76a', '#ff7a18', '#e11d48'],
      glow: '#ffb347',
    },
  };

  // The three post sizes the app exports.
  const SIZES = {
    square: [1080, 1080],
    portrait: [1080, 1350],
    landscape: [1920, 1080],
  };

  const TITLE_FONT = '"Arial Black", Arial, sans-serif';
  const SCRIPT_FONT = '"Brush Script MT", "Segoe Script", cursive';
  const BODY_FONT = 'Arial, sans-serif';

  // Editor state: one slot per panel — which sample photo, its crop, and an
  // optional upload that replaces the sample for that panel only.
  const state = {
    title: 'MIDNIGHT RUN',
    subtitle: 'Neon Heat',
    grade: 'sunset',
    size: 'square',
    selected: 0,
    panels: Array.from({ length: 9 }, function (_, i) {
      return { photo: i, zoom: 1, ox: 0, oy: 0, custom: null };
    }),
  };

  const loaded = {}; // sample id -> HTMLImageElement, once it loads
  const uploads = {}; // panel index -> HTMLImageElement, from the file picker

  const canvas = document.getElementById('cover');
  const previewCtx = canvas.getContext('2d');
  const statusEl = document.getElementById('status');
  const wrapEl = document.getElementById('coverWrap');

  function setStatus(text) {
    if (statusEl) statusEl.textContent = text;
  }

  function palette() {
    return PALETTES[state.grade] || PALETTES.sunset;
  }

  /* --- Small canvas helpers. Every one takes its context. --- */

  // Largest title size (starting from `start`) that still fits `maxWidth`.
  function fitText(ctx, text, maxWidth, start) {
    let size = start;
    ctx.font = '900 ' + size + 'px ' + TITLE_FONT;
    while (size > 12 && ctx.measureText(text).width > maxWidth) {
      size -= 2;
      ctx.font = '900 ' + size + 'px ' + TITLE_FONT;
    }
    return size;
  }

  function roundRectPath(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // Cover-fit a photo into a panel, then zoom and shift it.
  function drawPhoto(ctx, img, x, y, w, h, zoom, ox, oy) {
    if (!img || !img.naturalWidth) {
      const fallback = ctx.createLinearGradient(x, y, x + w, y + h);
      fallback.addColorStop(0, '#3a2b52');
      fallback.addColorStop(1, '#1a1226');
      ctx.fillStyle = fallback;
      ctx.fillRect(x, y, w, h);
      return;
    }
    const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight) * zoom;
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    const dx = x + (w - dw) / 2 + (ox / 100) * w * 0.25;
    const dy = y + (h - dh) / 2 + (oy / 100) * h * 0.25;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    ctx.drawImage(img, dx, dy, dw, dh);
    ctx.restore();
  }

  // Sunset wash over a panel, a vignette, and a thin bright frame.
  function drawPanelFinish(ctx, x, y, w, h) {
    const wash = ctx.createLinearGradient(x, y, x + w, y + h);
    wash.addColorStop(0, palette().wash[0]);
    wash.addColorStop(1, palette().wash[1]);
    ctx.fillStyle = wash;
    ctx.fillRect(x, y, w, h);
    const shade = ctx.createRadialGradient(
      x + w / 2, y + h / 2, Math.min(w, h) * 0.35,
      x + w / 2, y + h / 2, Math.max(w, h) * 0.75,
    );
    shade.addColorStop(0, 'rgba(0,0,0,0)');
    shade.addColorStop(1, 'rgba(0,0,0,0.30)');
    ctx.fillStyle = shade;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(255,255,255,0.28)';
    ctx.lineWidth = Math.max(2, w * 0.006);
    ctx.strokeRect(x, y, w, h);
  }

  /* --- The cover, in three bands: title, grid, footer. --- */

  // Where each band sits, for a cover of W x H. The title band owns the top
  // of the frame and the grid starts below it, so the title can never cover
  // a bottom-row panel.
  function layoutFor(W, H) {
    const margin = W * 0.02;
    const titleH = H * 0.145;
    const footH = H * 0.045;
    const gap = Math.max(4, W * 0.007);
    const divider = Math.max(3, H * 0.004);
    return {
      margin, titleH, footH, gap, divider,
      gridX: margin,
      gridY: titleH + gap + divider,
      gridW: W - margin * 2,
      gridH: H - (titleH + gap + divider) - footH - gap,
    };
  }

  function drawTitleBand(ctx, W, H, lay) {
    const band = ctx.createLinearGradient(0, 0, W, 0);
    band.addColorStop(0, '#1a0b2e');
    band.addColorStop(0.55, '#2b0f3a');
    band.addColorStop(1, '#3a0f2b');
    ctx.fillStyle = band;
    ctx.fillRect(0, 0, W, lay.titleH);

    // The NEW badge sits top-right; the title gets the rest of the width.
    const badgeH = lay.titleH * 0.30;
    const badgeW = W * 0.115;
    const badgeX = W - lay.margin - badgeW;
    const badgeY = lay.titleH * 0.10;
    const titleMaxW = badgeX - lay.margin - W * 0.03;

    const titleSize = fitText(ctx, state.title, titleMaxW, Math.round(H * 0.082));
    const titleGrad = ctx.createLinearGradient(lay.margin, 0, titleMaxW, 0);
    titleGrad.addColorStop(0, palette().title[0]);
    titleGrad.addColorStop(0.5, palette().title[1]);
    titleGrad.addColorStop(1, palette().title[2]);
    ctx.font = '900 ' + titleSize + 'px ' + TITLE_FONT;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = Math.max(2, titleSize * 0.06);
    ctx.strokeStyle = 'rgba(20,5,25,0.9)';
    ctx.strokeText(state.title, lay.margin, lay.titleH * 0.38);
    ctx.fillStyle = titleGrad;
    ctx.fillText(state.title, lay.margin, lay.titleH * 0.38);

    // Neon script subtitle under the title, glowing.
    const subSize = Math.round(H * 0.042);
    ctx.font = 'italic ' + subSize + 'px ' + SCRIPT_FONT;
    ctx.fillStyle = '#ffe9f4';
    ctx.shadowColor = palette().glow;
    ctx.shadowBlur = Math.round(H * 0.018);
    ctx.fillText(state.subtitle, lay.margin, lay.titleH * 0.80);
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#ff2d78';
    roundRectPath(ctx, badgeX, badgeY, badgeW, badgeH, badgeH / 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 ' + Math.round(badgeH * 0.52) + 'px ' + BODY_FONT;
    ctx.textAlign = 'center';
    ctx.fillText('★ NEW', badgeX + badgeW / 2, badgeY + badgeH / 2 + 1);
    ctx.textAlign = 'left';

    // Sunset divider between the title band and the grid.
    const sep = ctx.createLinearGradient(0, 0, W, 0);
    sep.addColorStop(0, palette().title[0]);
    sep.addColorStop(1, palette().title[2]);
    ctx.fillStyle = sep;
    ctx.fillRect(0, lay.titleH, W, lay.divider);
  }

  function drawGrid(ctx, lay) {
    const cellW = (lay.gridW - lay.gap * 2) / 3;
    const cellH = (lay.gridH - lay.gap * 2) / 3;
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const idx = row * 3 + col;
        const slot = state.panels[idx];
        const x = lay.gridX + col * (cellW + lay.gap);
        const y = lay.gridY + row * (cellH + lay.gap);
        const img = slot.custom ? uploads[idx] : loaded[SAMPLES[slot.photo].id];
        drawPhoto(ctx, img, x, y, cellW, cellH, slot.zoom, slot.ox, slot.oy);
        drawPanelFinish(ctx, x, y, cellW, cellH);
      }
    }
  }

  function drawFooter(ctx, W, H, lay) {
    ctx.fillStyle = '#120c1d';
    ctx.fillRect(0, H - lay.footH, W, lay.footH);
    ctx.fillStyle = '#ffd9ec';
    ctx.font = '700 ' + Math.round(H * 0.02) + 'px ' + BODY_FONT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('VICE CITY  •  SUNSET EDITION  •  NEON HEAT', W / 2, H - lay.footH / 2);
    ctx.textAlign = 'left';
  }

  // Draws the whole cover onto `ctx` at W x H.
  function drawCover(ctx, W, H) {
    const lay = layoutFor(W, H);
    ctx.fillStyle = '#0d0b16';
    ctx.fillRect(0, 0, W, H);
    drawTitleBand(ctx, W, H, lay);
    drawGrid(ctx, lay);
    drawFooter(ctx, W, H, lay);
  }

  /* --- Preview and export --- */

  function renderPreview() {
    const size = SIZES[state.size];
    canvas.width = size[0];
    canvas.height = size[1];
    drawCover(previewCtx, size[0], size[1]);
    wrapEl.classList.remove('square', 'portrait', 'landscape');
    wrapEl.classList.add(state.size);
  }

  // Export one size: draw the cover onto a fresh offscreen canvas — with
  // that canvas's own context, never the preview's — and download the PNG.
  function exportPng(key) {
    return new Promise(function (resolve) {
      const size = SIZES[key];
      const off = document.createElement('canvas');
      off.width = size[0];
      off.height = size[1];
      drawCover(off.getContext('2d'), size[0], size[1]);
      off.toBlob(function (blob) {
        if (!blob) {
          setStatus('Export failed for ' + key + '.');
          resolve(false);
          return;
        }
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'neon-heat-' + key + '.png';
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000);
        setStatus('Exported ' + key + ' PNG (' + size[0] + '×' + size[1] + ').');
        resolve(true);
      }, 'image/png');
    });
  }

  /* --- Editor controls --- */

  function buildPanelPicker() {
    const grid = document.getElementById('panelGrid');
    grid.innerHTML = '';
    SAMPLES.forEach(function (sample, i) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'panel-btn' + (i === state.selected ? ' selected' : '');
      btn.title = 'Panel ' + (i + 1) + ': ' + sample.label;
      const thumb = document.createElement('img');
      thumb.src = sample.src;
      thumb.alt = sample.label;
      btn.appendChild(thumb);
      btn.addEventListener('click', function () { selectPanel(i); });
      grid.appendChild(btn);
    });
  }

  function buildPhotoOptions() {
    const sel = document.getElementById('photoSelect');
    sel.innerHTML = '';
    SAMPLES.forEach(function (sample, i) {
      const opt = document.createElement('option');
      opt.value = String(i);
      opt.textContent = (i + 1) + ' — ' + sample.label;
      sel.appendChild(opt);
    });
  }

  function syncPanelForm() {
    const slot = state.panels[state.selected];
    document.getElementById('panelLabel').textContent = String(state.selected + 1);
    document.getElementById('photoSelect').value = String(slot.photo);
    document.getElementById('zoomRange').value = String(Math.round(slot.zoom * 100));
    document.getElementById('zoomVal').textContent = Math.round(slot.zoom * 100) + '%';
    document.getElementById('oxRange').value = String(slot.ox);
    document.getElementById('oyRange').value = String(slot.oy);
    document.querySelectorAll('.panel-btn').forEach(function (btn, i) {
      btn.classList.toggle('selected', i === state.selected);
    });
  }

  function selectPanel(i) {
    state.selected = i;
    syncPanelForm();
  }

  function preloadSamples() {
    const jobs = SAMPLES.map(function (sample) {
      return new Promise(function (resolve) {
        const img = new Image();
        img.onload = function () { loaded[sample.id] = img; resolve(); };
        img.onerror = function () { resolve(); };
        img.src = sample.src;
      });
    });
    return Promise.all(jobs);
  }

  function wireControls() {
    document.getElementById('titleInput').addEventListener('input', function (e) {
      state.title = (e.target.value || 'MIDNIGHT RUN').toUpperCase();
      renderPreview();
    });
    document.getElementById('subtitleInput').addEventListener('input', function (e) {
      state.subtitle = e.target.value || 'Neon Heat';
      renderPreview();
    });
    document.getElementById('gradeSelect').addEventListener('change', function (e) {
      state.grade = e.target.value;
      renderPreview();
    });
    document.querySelectorAll('.size-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.size = btn.getAttribute('data-size');
        document.querySelectorAll('.size-btn').forEach(function (x) {
          x.classList.toggle('active', x === btn);
        });
        renderPreview();
      });
    });
    document.getElementById('photoSelect').addEventListener('change', function (e) {
      const slot = state.panels[state.selected];
      slot.photo = parseInt(e.target.value, 10);
      slot.custom = null;
      renderPreview();
    });
    document.getElementById('uploadInput').addEventListener('change', function (e) {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function () {
        const img = new Image();
        img.onload = function () {
          uploads[state.selected] = img;
          state.panels[state.selected].custom = reader.result;
          setStatus('Your photo is on panel ' + (state.selected + 1) + '.');
          renderPreview();
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
    document.getElementById('zoomRange').addEventListener('input', function (e) {
      state.panels[state.selected].zoom = parseInt(e.target.value, 10) / 100;
      document.getElementById('zoomVal').textContent = e.target.value + '%';
      renderPreview();
    });
    document.getElementById('oxRange').addEventListener('input', function (e) {
      state.panels[state.selected].ox = parseInt(e.target.value, 10);
      renderPreview();
    });
    document.getElementById('oyRange').addEventListener('input', function (e) {
      state.panels[state.selected].oy = parseInt(e.target.value, 10);
      renderPreview();
    });
    document.getElementById('resetPanel').addEventListener('click', function () {
      state.panels[state.selected] = {
        photo: state.selected, zoom: 1, ox: 0, oy: 0, custom: null,
      };
      delete uploads[state.selected];
      syncPanelForm();
      renderPreview();
    });
    document.getElementById('shuffleBtn').addEventListener('click', function () {
      const order = SAMPLES.map(function (_, i) { return i; });
      for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = order[i];
        order[i] = order[j];
        order[j] = tmp;
      }
      state.panels.forEach(function (slot, idx) {
        slot.photo = order[idx];
        slot.custom = null;
      });
      Object.keys(uploads).forEach(function (k) { delete uploads[k]; });
      syncPanelForm();
      renderPreview();
    });
    document.getElementById('exportSquare').addEventListener('click', function () {
      exportPng('square');
    });
    document.getElementById('exportPortrait').addEventListener('click', function () {
      exportPng('portrait');
    });
    document.getElementById('exportLandscape').addEventListener('click', function () {
      exportPng('landscape');
    });
    document.getElementById('exportAll').addEventListener('click', function () {
      setStatus('Exporting all 3 sizes…');
      exportPng('square')
        .then(function () { return exportPng('portrait'); })
        .then(function () { return exportPng('landscape'); })
        .then(function () { setStatus('Exported all 3 PNG sizes.'); });
    });
  }

  // Screenshot mode: ?shot=cover hides the editor, ?size picks the cover
  // size, ?panel pre-selects a panel, ?title / ?subtitle set the lettering.
  function readQuery() {
    const q = new URLSearchParams(window.location.search);
    const shot = q.get('shot');
    const size = q.get('size');
    if (size && SIZES[size]) state.size = size;
    const title = q.get('title');
    if (title) {
      state.title = title.toUpperCase();
      document.getElementById('titleInput').value = state.title;
    }
    const subtitle = q.get('subtitle');
    if (subtitle) {
      state.subtitle = subtitle;
      document.getElementById('subtitleInput').value = subtitle;
    }
    const panel = parseInt(q.get('panel') || '', 10);
    if (panel >= 1 && panel <= 9) state.selected = panel - 1;
    if (shot === 'cover') {
      document.body.classList.add('cover-mode');
      document.querySelectorAll('.size-btn').forEach(function (btn) {
        btn.classList.toggle('active', btn.getAttribute('data-size') === state.size);
      });
    }
  }

  buildPanelPicker();
  buildPhotoOptions();
  wireControls();
  readQuery();
  syncPanelForm();
  preloadSamples().then(function () { renderPreview(); });
  renderPreview();
})();
