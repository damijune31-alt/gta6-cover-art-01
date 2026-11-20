/* NEON HEAT — Midnight Run Cover Maker.
   Offline browser app. One renderer paints the whole cover — title band on
   top, 3x3 photo grid in the middle, footer strip at the bottom — onto any
   canvas, so the live preview and the exported PNG are the same drawing.
   (Round-2 bug fixed here: the old helpers drew photos onto the preview
   canvas even during export, so exported PNGs lost their photos. Every
   painter below now takes its canvas context as an argument.) */

(function () {
  'use strict';

  // The nine photos shipped with the app, in grid order.
  const PHOTOS = [
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
  const GRADES = {
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
  const EXPORT_SIZES = {
    square: [1080, 1080],
    portrait: [1080, 1350],
    landscape: [1920, 1080],
  };

  const TITLE_FONT = '"Arial Black", Arial, sans-serif';
  const SCRIPT_FONT = '"Brush Script MT", "Segoe Script", cursive';

  // One entry per panel: which sample photo, crop, and an optional upload.
  const panels = [];
  for (let i = 0; i < 9; i++) {
    panels.push({ photo: i, zoom: 1, ox: 0, oy: 0, custom: null });
  }

  const cover = {
    title: 'MIDNIGHT RUN',
    subtitle: 'Neon Heat',
    grade: 'sunset',
    size: 'square',
    selected: 0,
    panels,
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

  function grade() {
    return GRADES[cover.grade] || GRADES.sunset;
  }

  /* --- Canvas helpers: every one takes its context, so export works. --- */

  function fitTitleSize(g, text, maxWidth, startSize) {
    let size = startSize;
    g.font = '900 ' + size + 'px ' + TITLE_FONT;
    while (size > 12 && g.measureText(text).width > maxWidth) {
      size -= 2;
      g.font = '900 ' + size + 'px ' + TITLE_FONT;
    }
    return size;
  }

  function pillPath(g, x, y, w, h, r) {
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
  }

  function paintPanelPhoto(g, img, x, y, w, h, zoom, ox, oy) {
    if (!img || !img.naturalWidth) {
      const fallback = g.createLinearGradient(x, y, x + w, y + h);
      fallback.addColorStop(0, '#3a2b52');
      fallback.addColorStop(1, '#1a1226');
      g.fillStyle = fallback;
      g.fillRect(x, y, w, h);
      return;
    }
    // Cover-fit the photo into the panel, then zoom and shift it.
    const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight) * zoom;
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    const dx = x + (w - dw) / 2 + (ox / 100) * w * 0.25;
    const dy = y + (h - dh) / 2 + (oy / 100) * h * 0.25;
    g.save();
    g.beginPath();
    g.rect(x, y, w, h);
    g.clip();
    g.drawImage(img, dx, dy, dw, dh);
    g.restore();
  }

  function paintPanelWash(g, x, y, w, h) {
    const wash = g.createLinearGradient(x, y, x + w, y + h);
    wash.addColorStop(0, grade().wash[0]);
    wash.addColorStop(1, grade().wash[1]);
    g.fillStyle = wash;
    g.fillRect(x, y, w, h);
    // Vignette: darker corners, bright centre.
    const shade = g.createRadialGradient(
      x + w / 2, y + h / 2, Math.min(w, h) * 0.35,
      x + w / 2, y + h / 2, Math.max(w, h) * 0.75,
    );
    shade.addColorStop(0, 'rgba(0,0,0,0)');
    shade.addColorStop(1, 'rgba(0,0,0,0.30)');
    g.fillStyle = shade;
    g.fillRect(x, y, w, h);
    g.strokeStyle = 'rgba(255,255,255,0.28)';
    g.lineWidth = Math.max(2, w * 0.006);
    g.strokeRect(x, y, w, h);
  }

  /* --- The cover, in three bands: title, grid, footer. --- */

  function paintTitleBand(g, W, H, titleH, margin) {
    const band = g.createLinearGradient(0, 0, W, 0);
    band.addColorStop(0, '#1a0b2e');
    band.addColorStop(0.55, '#2b0f3a');
    band.addColorStop(1, '#3a0f2b');
    g.fillStyle = band;
    g.fillRect(0, 0, W, titleH);

    // The NEW badge sits top-right; the title gets the rest of the width.
    const badgeH = titleH * 0.30;
    const badgeW = W * 0.115;
    const badgeX = W - margin - badgeW;
    const badgeY = titleH * 0.10;
    const titleMaxW = badgeX - margin - W * 0.03;

    const titleSize = fitTitleSize(g, cover.title, titleMaxW, Math.round(H * 0.082));
    const titleGrad = g.createLinearGradient(margin, 0, titleMaxW, 0);
    titleGrad.addColorStop(0, grade().title[0]);
    titleGrad.addColorStop(0.5, grade().title[1]);
    titleGrad.addColorStop(1, grade().title[2]);
    g.font = '900 ' + titleSize + 'px ' + TITLE_FONT;
    g.textAlign = 'left';
    g.textBaseline = 'middle';
    g.lineWidth = Math.max(2, titleSize * 0.06);
    g.strokeStyle = 'rgba(20,5,25,0.9)';
    g.strokeText(cover.title, margin, titleH * 0.38);
    g.fillStyle = titleGrad;
    g.fillText(cover.title, margin, titleH * 0.38);

    // Neon script subtitle under the title, glowing.
    const subSize = Math.round(H * 0.042);
    g.font = 'italic ' + subSize + 'px ' + SCRIPT_FONT;
    g.fillStyle = '#ffe9f4';
    g.shadowColor = grade().glow;
    g.shadowBlur = Math.round(H * 0.018);
    g.fillText(cover.subtitle, margin, titleH * 0.80);
    g.shadowBlur = 0;

    g.fillStyle = '#ff2d78';
    pillPath(g, badgeX, badgeY, badgeW, badgeH, badgeH / 2);
    g.fill();
    g.fillStyle = '#ffffff';
    g.font = '900 ' + Math.round(badgeH * 0.52) + 'px Arial, sans-serif';
    g.textAlign = 'center';
    g.fillText('★ NEW', badgeX + badgeW / 2, badgeY + badgeH / 2 + 1);
    g.textAlign = 'left';

    // Sunset divider between the title band and the grid.
    const sep = g.createLinearGradient(0, 0, W, 0);
    sep.addColorStop(0, grade().title[0]);
    sep.addColorStop(1, grade().title[2]);
    g.fillStyle = sep;
    g.fillRect(0, titleH, W, Math.max(3, H * 0.004));
  }

  function paintPhotoGrid(g, W, H, gridX, gridY, gridW, gridH, gap) {
    const cellW = (gridW - gap * 2) / 3;
    const cellH = (gridH - gap * 2) / 3;
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const idx = row * 3 + col;
        const p = cover.panels[idx];
        const x = gridX + col * (cellW + gap);
        const y = gridY + row * (cellH + gap);
        const img = p.custom ? uploads[idx] : loaded[PHOTOS[p.photo].id];
        paintPanelPhoto(g, img, x, y, cellW, cellH, p.zoom, p.ox, p.oy);
        paintPanelWash(g, x, y, cellW, cellH);
      }
    }
  }

  function paintFooter(g, W, H, footH) {
    g.fillStyle = '#120c1d';
    g.fillRect(0, H - footH, W, footH);
    g.fillStyle = '#ffd9ec';
    g.font = '700 ' + Math.round(H * 0.02) + 'px Arial, sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('VICE CITY  •  SUNSET EDITION  •  NEON HEAT', W / 2, H - footH / 2);
    g.textAlign = 'left';
  }

  // Draws the whole cover. The title band owns the top of the frame and the
  // grid starts below it, so the title can never cover a bottom-row panel.
  function paintCover(g, W, H) {
    const margin = W * 0.02;
    const titleH = H * 0.145;
    const footH = H * 0.045;
    const gap = Math.max(4, W * 0.007);

    g.fillStyle = '#0d0b16';
    g.fillRect(0, 0, W, H);

    paintTitleBand(g, W, H, titleH, margin);

    const gridX = margin;
    const gridY = titleH + gap + Math.max(3, H * 0.004);
    const gridW = W - margin * 2;
    const gridH = H - gridY - footH - gap;
    paintPhotoGrid(g, W, H, gridX, gridY, gridW, gridH, gap);

    paintFooter(g, W, H, footH);
  }

  /* --- Preview and export --- */

  function refreshPreview() {
    const size = EXPORT_SIZES[cover.size];
    canvas.width = size[0];
    canvas.height = size[1];
    paintCover(previewCtx, size[0], size[1]);
    wrapEl.classList.remove('square', 'portrait', 'landscape');
    wrapEl.classList.add(cover.size);
  }

  function downloadPng(key) {
    return new Promise(function (resolve) {
      const size = EXPORT_SIZES[key];
      const off = document.createElement('canvas');
      off.width = size[0];
      off.height = size[1];
      paintCover(off.getContext('2d'), size[0], size[1]);
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

  function renderPanelPicker() {
    const grid = document.getElementById('panelGrid');
    grid.innerHTML = '';
    PHOTOS.forEach(function (photo, i) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'panel-btn' + (i === cover.selected ? ' selected' : '');
      btn.title = 'Panel ' + (i + 1) + ': ' + photo.label;
      const thumb = document.createElement('img');
      thumb.src = photo.src;
      thumb.alt = photo.label;
      btn.appendChild(thumb);
      btn.addEventListener('click', function () { pickPanel(i); });
      grid.appendChild(btn);
    });
  }

  function renderPhotoOptions() {
    const sel = document.getElementById('photoSelect');
    sel.innerHTML = '';
    PHOTOS.forEach(function (photo, i) {
      const opt = document.createElement('option');
      opt.value = String(i);
      opt.textContent = (i + 1) + ' — ' + photo.label;
      sel.appendChild(opt);
    });
  }

  function syncPanelForm() {
    const p = cover.panels[cover.selected];
    document.getElementById('panelLabel').textContent = String(cover.selected + 1);
    document.getElementById('photoSelect').value = String(p.photo);
    document.getElementById('zoomRange').value = String(Math.round(p.zoom * 100));
    document.getElementById('zoomVal').textContent = Math.round(p.zoom * 100) + '%';
    document.getElementById('oxRange').value = String(p.ox);
    document.getElementById('oyRange').value = String(p.oy);
    document.querySelectorAll('.panel-btn').forEach(function (btn, i) {
      btn.classList.toggle('selected', i === cover.selected);
    });
  }

  function pickPanel(i) {
    cover.selected = i;
    syncPanelForm();
  }

  function preloadSamples() {
    const jobs = PHOTOS.map(function (photo) {
      return new Promise(function (resolve) {
        const img = new Image();
        img.onload = function () { loaded[photo.id] = img; resolve(); };
        img.onerror = function () { resolve(); };
        img.src = photo.src;
      });
    });
    return Promise.all(jobs);
  }

  function bindControls() {
    document.getElementById('titleInput').addEventListener('input', function (e) {
      cover.title = (e.target.value || 'MIDNIGHT RUN').toUpperCase();
      refreshPreview();
    });
    document.getElementById('subtitleInput').addEventListener('input', function (e) {
      cover.subtitle = e.target.value || 'Neon Heat';
      refreshPreview();
    });
    document.getElementById('gradeSelect').addEventListener('change', function (e) {
      cover.grade = e.target.value;
      refreshPreview();
    });
    document.querySelectorAll('.size-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        cover.size = btn.getAttribute('data-size');
        document.querySelectorAll('.size-btn').forEach(function (x) {
          x.classList.toggle('active', x === btn);
        });
        refreshPreview();
      });
    });
    document.getElementById('photoSelect').addEventListener('change', function (e) {
      const p = cover.panels[cover.selected];
      p.photo = parseInt(e.target.value, 10);
      p.custom = null;
      refreshPreview();
    });
    document.getElementById('uploadInput').addEventListener('change', function (e) {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function () {
        const img = new Image();
        img.onload = function () {
          uploads[cover.selected] = img;
          cover.panels[cover.selected].custom = reader.result;
          setStatus('Your photo is on panel ' + (cover.selected + 1) + '.');
          refreshPreview();
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
    document.getElementById('zoomRange').addEventListener('input', function (e) {
      cover.panels[cover.selected].zoom = parseInt(e.target.value, 10) / 100;
      document.getElementById('zoomVal').textContent = e.target.value + '%';
      refreshPreview();
    });
    document.getElementById('oxRange').addEventListener('input', function (e) {
      cover.panels[cover.selected].ox = parseInt(e.target.value, 10);
      refreshPreview();
    });
    document.getElementById('oyRange').addEventListener('input', function (e) {
      cover.panels[cover.selected].oy = parseInt(e.target.value, 10);
      refreshPreview();
    });
    document.getElementById('resetPanel').addEventListener('click', function () {
      cover.panels[cover.selected] = {
        photo: cover.selected, zoom: 1, ox: 0, oy: 0, custom: null,
      };
      delete uploads[cover.selected];
      syncPanelForm();
      refreshPreview();
    });
    document.getElementById('shuffleBtn').addEventListener('click', function () {
      const order = PHOTOS.map(function (_, i) { return i; });
      for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = order[i];
        order[i] = order[j];
        order[j] = tmp;
      }
      cover.panels.forEach(function (p, idx) {
        p.photo = order[idx];
        p.custom = null;
      });
      Object.keys(uploads).forEach(function (k) { delete uploads[k]; });
      syncPanelForm();
      refreshPreview();
    });
    document.getElementById('exportSquare').addEventListener('click', function () {
      downloadPng('square');
    });
    document.getElementById('exportPortrait').addEventListener('click', function () {
      downloadPng('portrait');
    });
    document.getElementById('exportLandscape').addEventListener('click', function () {
      downloadPng('landscape');
    });
    document.getElementById('exportAll').addEventListener('click', function () {
      setStatus('Exporting all 3 sizes…');
      downloadPng('square')
        .then(function () { return downloadPng('portrait'); })
        .then(function () { return downloadPng('landscape'); })
        .then(function () { setStatus('Exported all 3 PNG sizes.'); });
    });
  }

  // Screenshot mode: ?shot=cover hides the editor, ?size picks the cover
  // size, ?panel pre-selects a panel, ?title / ?subtitle set the lettering.
  function readQuery() {
    const q = new URLSearchParams(window.location.search);
    const shot = q.get('shot');
    const size = q.get('size');
    if (size && EXPORT_SIZES[size]) cover.size = size;
    const title = q.get('title');
    if (title) {
      cover.title = title.toUpperCase();
      document.getElementById('titleInput').value = cover.title;
    }
    const subtitle = q.get('subtitle');
    if (subtitle) {
      cover.subtitle = subtitle;
      document.getElementById('subtitleInput').value = subtitle;
    }
    const panel = parseInt(q.get('panel') || '', 10);
    if (panel >= 1 && panel <= 9) cover.selected = panel - 1;
    if (shot === 'cover') {
      document.body.classList.add('cover-mode');
      document.querySelectorAll('.size-btn').forEach(function (btn) {
        btn.classList.toggle('active', btn.getAttribute('data-size') === cover.size);
      });
    }
  }

  renderPanelPicker();
  renderPhotoOptions();
  bindControls();
  readQuery();
  syncPanelForm();
  preloadSamples().then(function () { refreshPreview(); });
  refreshPreview();
})();
