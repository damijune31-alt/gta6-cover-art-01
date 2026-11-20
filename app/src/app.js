/* NEON HEAT — Midnight Run Cover Maker.
   Offline browser app: nine photos in a 3x3 poster grid, a title band that
   lives ABOVE the grid (it can never cover a panel), a neon script subtitle,
   a NEW badge, a sunset grade, and PNG export in three post sizes. */

(function () {
  'use strict';

  var SAMPLES = [
    { id: 'neon-couple', label: 'Neon couple', src: 'samples/neon-couple.jpg' },
    { id: 'surfer', label: 'Surfer', src: 'samples/surfer.jpg' },
    { id: 'biker', label: 'Biker', src: 'samples/biker.jpg' },
    { id: 'fisherman', label: 'Fisherman', src: 'samples/fisherman.jpg' },
    { id: 'market', label: 'Night market', src: 'samples/market.jpg' },
    { id: 'convertible', label: 'Convertible', src: 'samples/convertible.jpg' },
    { id: 'rooftop', label: 'Rooftop', src: 'samples/rooftop.jpg' },
    { id: 'speedboat', label: 'Speedboat', src: 'samples/speedboat.jpg' },
    { id: 'boulevard', label: 'Boulevard', src: 'samples/boulevard.jpg' }
  ];

  var GRADES = {
    sunset: { overlay: ['rgba(255,140,0,0.10)', 'rgba(255,45,120,0.20)'], title: ['#ffb347', '#ff5e62', '#ff2d78'], glow: '#ff2d78' },
    neon: { overlay: ['rgba(255,45,200,0.12)', 'rgba(0,220,255,0.16)'], title: ['#7df9ff', '#ff2d78', '#b967ff'], glow: '#00dcff' },
    vice: { overlay: ['rgba(150,80,255,0.14)', 'rgba(0,200,190,0.14)'], title: ['#c084fc', '#ff2d78', '#22d3ee'], glow: '#b967ff' },
    golden: { overlay: ['rgba(255,190,60,0.12)', 'rgba(225,29,72,0.18)'], title: ['#ffd76a', '#ff7a18', '#e11d48'], glow: '#ffb347' }
  };

  var SIZES = {
    square: [1080, 1080],
    portrait: [1080, 1350],
    landscape: [1920, 1080]
  };

  var state = {
    title: 'MIDNIGHT RUN',
    subtitle: 'Neon Heat',
    grade: 'sunset',
    size: 'square',
    selected: 0,
    panels: []
  };
  for (var i = 0; i < 9; i++) state.panels.push({ photo: i, zoom: 1, ox: 0, oy: 0, custom: null });

  var images = {};   // sample id -> HTMLImageElement
  var customImages = {}; // panel index -> HTMLImageElement (user upload)

  var canvas = document.getElementById('cover');
  var ctx = canvas.getContext('2d');
  var statusEl = document.getElementById('status');

  function setStatus(text) { if (statusEl) statusEl.textContent = text; }

  function fitFont(text, maxWidth, startSize, weight, family) {
    var size = startSize;
    var font = function (s) { return weight + ' ' + s + 'px ' + family; };
    ctx.font = font(size);
    while (size > 12 && ctx.measureText(text).width > maxWidth) {
      size -= 2;
      ctx.font = font(size);
    }
    return size;
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawPhotoCover(img, x, y, w, h, zoom, ox, oy) {
    if (!img || !img.naturalWidth) {
      var g = ctx.createLinearGradient(x, y, x + w, y + h);
      g.addColorStop(0, '#3a2b52');
      g.addColorStop(1, '#1a1226');
      ctx.fillStyle = g;
      ctx.fillRect(x, y, w, h);
      return;
    }
    var scale = Math.max(w / img.naturalWidth, h / img.naturalHeight) * zoom;
    var dw = img.naturalWidth * scale;
    var dh = img.naturalHeight * scale;
    var dx = x + (w - dw) / 2 + (ox / 100) * w * 0.25;
    var dy = y + (h - dh) / 2 + (oy / 100) * h * 0.25;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    ctx.drawImage(img, dx, dy, dw, dh);
    ctx.restore();
  }

  function drawGradeOverlay(x, y, w, h) {
    var grade = GRADES[state.grade] || GRADES.sunset;
    var g = ctx.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, grade.overlay[0]);
    g.addColorStop(1, grade.overlay[1]);
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    var v = ctx.createRadialGradient(x + w / 2, y + h / 2, Math.min(w, h) * 0.35, x + w / 2, y + h / 2, Math.max(w, h) * 0.75);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(0,0,0,0.30)');
    ctx.fillStyle = v;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(255,255,255,0.28)';
    ctx.lineWidth = Math.max(2, w * 0.006);
    ctx.strokeRect(x, y, w, h);
  }

  function drawCover(c, W, H) {
    var grade = GRADES[state.grade] || GRADES.sunset;
    var margin = W * 0.02;
    var titleH = H * 0.145;
    var footH = H * 0.045;
    var gap = Math.max(4, W * 0.007);

    c.fillStyle = '#0d0b16';
    c.fillRect(0, 0, W, H);

    /* Title band: its own region at the top. The grid starts below it,
       so the title ribbon can never cover a bottom-row panel. */
    var band = c.createLinearGradient(0, 0, W, 0);
    band.addColorStop(0, '#1a0b2e');
    band.addColorStop(0.55, '#2b0f3a');
    band.addColorStop(1, '#3a0f2b');
    c.fillStyle = band;
    c.fillRect(0, 0, W, titleH);

    var badgeH = titleH * 0.30;
    var badgeW = W * 0.115;
    var badgeX = W - margin - badgeW;
    var badgeY = titleH * 0.10;
    var titleMaxW = badgeX - margin - W * 0.03;
    var titleSize = fitFont(state.title, titleMaxW, Math.round(H * 0.082), '900', '"Arial Black", Arial, sans-serif');
    var tg = c.createLinearGradient(margin, 0, titleMaxW, 0);
    tg.addColorStop(0, grade.title[0]);
    tg.addColorStop(0.5, grade.title[1]);
    tg.addColorStop(1, grade.title[2]);
    c.font = '900 ' + titleSize + 'px "Arial Black", Arial, sans-serif';
    c.textAlign = 'left';
    c.textBaseline = 'middle';
    c.lineWidth = Math.max(2, titleSize * 0.06);
    c.strokeStyle = 'rgba(20,5,25,0.9)';
    c.strokeText(state.title, margin, titleH * 0.38);
    c.fillStyle = tg;
    c.fillText(state.title, margin, titleH * 0.38);

    var subSize = Math.round(H * 0.042);
    c.font = 'italic ' + subSize + 'px "Brush Script MT", "Segoe Script", cursive';
    c.fillStyle = '#ffe9f4';
    c.shadowColor = grade.glow;
    c.shadowBlur = Math.round(H * 0.018);
    c.fillText(state.subtitle, margin, titleH * 0.80);
    c.shadowBlur = 0;

    c.fillStyle = '#ff2d78';
    roundRect(badgeX, badgeY, badgeW, badgeH, badgeH / 2);
    c.fill();
    c.fillStyle = '#ffffff';
    c.font = '900 ' + Math.round(badgeH * 0.52) + 'px Arial, sans-serif';
    c.textAlign = 'center';
    c.fillText('★ NEW', badgeX + badgeW / 2, badgeY + badgeH / 2 + 1);
    c.textAlign = 'left';

    var sep = c.createLinearGradient(0, 0, W, 0);
    sep.addColorStop(0, grade.title[0]);
    sep.addColorStop(1, grade.title[2]);
    c.fillStyle = sep;
    c.fillRect(0, titleH, W, Math.max(3, H * 0.004));

    /* 3x3 photo grid. */
    var gridX = margin;
    var gridY = titleH + gap + Math.max(3, H * 0.004);
    var gridW = W - margin * 2;
    var gridH = H - gridY - footH - gap;
    var cellW = (gridW - gap * 2) / 3;
    var cellH = (gridH - gap * 2) / 3;
    for (var r = 0; r < 3; r++) {
      for (var col = 0; col < 3; col++) {
        var idx = r * 3 + col;
        var p = state.panels[idx];
        var x = gridX + col * (cellW + gap);
        var y = gridY + r * (cellH + gap);
        var img = p.custom ? customImages[idx] : images[SAMPLES[p.photo].id];
        drawPhotoCover(img, x, y, cellW, cellH, p.zoom, p.ox, p.oy);
        drawGradeOverlay(x, y, cellW, cellH);
      }
    }

    /* Footer strip: its own band below the grid. */
    c.fillStyle = '#120c1d';
    c.fillRect(0, H - footH, W, footH);
    c.fillStyle = '#ffd9ec';
    c.font = '700 ' + Math.round(H * 0.02) + 'px Arial, sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('VICE CITY  •  SUNSET EDITION  •  NEON HEAT', W / 2, H - footH / 2);
    c.textAlign = 'left';
  }

  function renderPreview() {
    var size = SIZES[state.size];
    canvas.width = size[0];
    canvas.height = size[1];
    drawCover(ctx, size[0], size[1]);
    var wrap = document.getElementById('coverWrap');
    wrap.classList.remove('square', 'portrait', 'landscape');
    wrap.classList.add(state.size);
  }

  function exportSize(key) {
    return new Promise(function (resolve) {
      var size = SIZES[key];
      var off = document.createElement('canvas');
      off.width = size[0];
      off.height = size[1];
      drawCover(off.getContext('2d'), size[0], size[1]);
      off.toBlob(function (blob) {
        if (!blob) { setStatus('Export failed for ' + key + '.'); resolve(false); return; }
        var a = document.createElement('a');
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

  function buildPanelButtons() {
    var grid = document.getElementById('panelGrid');
    grid.innerHTML = '';
    SAMPLES.forEach(function (s, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'panel-btn' + (i === state.selected ? ' selected' : '');
      b.title = 'Panel ' + (i + 1) + ': ' + s.label;
      var img = document.createElement('img');
      img.src = s.src;
      img.alt = s.label;
      b.appendChild(img);
      b.addEventListener('click', function () { selectPanel(i); });
      grid.appendChild(b);
    });
  }

  function buildPhotoSelect() {
    var sel = document.getElementById('photoSelect');
    sel.innerHTML = '';
    SAMPLES.forEach(function (s, i) {
      var o = document.createElement('option');
      o.value = String(i);
      o.textContent = (i + 1) + ' — ' + s.label;
      sel.appendChild(o);
    });
  }

  function syncPanelControls() {
    var p = state.panels[state.selected];
    document.getElementById('panelLabel').textContent = String(state.selected + 1);
    document.getElementById('photoSelect').value = String(p.photo);
    document.getElementById('zoomRange').value = String(Math.round(p.zoom * 100));
    document.getElementById('zoomVal').textContent = Math.round(p.zoom * 100) + '%';
    document.getElementById('oxRange').value = String(p.ox);
    document.getElementById('oyRange').value = String(p.oy);
    var btns = document.querySelectorAll('.panel-btn');
    btns.forEach(function (b, i) { b.classList.toggle('selected', i === state.selected); });
  }

  function selectPanel(i) {
    state.selected = i;
    syncPanelControls();
  }

  function loadSamples() {
    var jobs = SAMPLES.map(function (s) {
      return new Promise(function (resolve) {
        var img = new Image();
        img.onload = function () { images[s.id] = img; resolve(); };
        img.onerror = function () { resolve(); };
        img.src = s.src;
      });
    });
    return Promise.all(jobs);
  }

  function wire() {
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
    document.querySelectorAll('.size-btn').forEach(function (b) {
      b.addEventListener('click', function () {
        state.size = b.getAttribute('data-size');
        document.querySelectorAll('.size-btn').forEach(function (x) { x.classList.toggle('active', x === b); });
        renderPreview();
      });
    });
    document.getElementById('photoSelect').addEventListener('change', function (e) {
      var p = state.panels[state.selected];
      p.photo = parseInt(e.target.value, 10);
      p.custom = null;
      renderPreview();
    });
    document.getElementById('uploadInput').addEventListener('change', function (e) {
      var file = e.target.files && e.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        var img = new Image();
        img.onload = function () {
          customImages[state.selected] = img;
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
      state.panels[state.selected] = { photo: state.selected, zoom: 1, ox: 0, oy: 0, custom: null };
      delete customImages[state.selected];
      syncPanelControls();
      renderPreview();
    });
    document.getElementById('shuffleBtn').addEventListener('click', function () {
      var order = SAMPLES.map(function (_, i) { return i; });
      for (var i = order.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var t = order[i]; order[i] = order[j]; order[j] = t;
      }
      state.panels.forEach(function (p, idx) { p.photo = order[idx]; p.custom = null; });
      customImages = {};
      syncPanelControls();
      renderPreview();
    });
    document.getElementById('exportSquare').addEventListener('click', function () { exportSize('square'); });
    document.getElementById('exportPortrait').addEventListener('click', function () { exportSize('portrait'); });
    document.getElementById('exportLandscape').addEventListener('click', function () { exportSize('landscape'); });
    document.getElementById('exportAll').addEventListener('click', function () {
      setStatus('Exporting all 3 sizes…');
      exportSize('square').then(function () { return exportSize('portrait'); }).then(function () { return exportSize('landscape'); }).then(function () { setStatus('Exported all 3 PNG sizes.'); });
    });
  }

  function applyQuery() {
    var q = new URLSearchParams(window.location.search);
    var shot = q.get('shot');
    var size = q.get('size');
    if (size && SIZES[size]) state.size = size;
    var title = q.get('title');
    if (title) { state.title = title.toUpperCase(); document.getElementById('titleInput').value = state.title; }
    var subtitle = q.get('subtitle');
    if (subtitle) { state.subtitle = subtitle; document.getElementById('subtitleInput').value = subtitle; }
    var panel = parseInt(q.get('panel') || '', 10);
    if (panel >= 1 && panel <= 9) state.selected = panel - 1;
    if (shot === 'cover') {
      document.body.classList.add('cover-mode');
      document.querySelectorAll('.size-btn').forEach(function (b) { b.classList.toggle('active', b.getAttribute('data-size') === state.size); });
    }
  }

  buildPanelButtons();
  buildPhotoSelect();
  wire();
  applyQuery();
  syncPanelControls();
  loadSamples().then(function () { renderPreview(); });
  renderPreview();
})();
