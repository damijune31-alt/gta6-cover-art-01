// NEON HEAT — Midnight Run Cover Maker.
// 3x3 photo grid, gradient title band, neon-script subtitle, NEW star badge,
// warm sunset grade, footer strip, PNG export in three post sizes.

const SAMPLES = [
  { file: 'neon-couple.jpg', label: 'Neon couple on a night street' },
  { file: 'surfer.jpg', label: 'Surfer at golden hour' },
  { file: 'biker.jpg', label: 'Motorbike rider at dusk' },
  { file: 'fisherman.jpg', label: 'Fisherman on the pier' },
  { file: 'market.jpg', label: 'Night market crowd' },
  { file: 'convertible.jpg', label: 'Convertible on the boulevard' },
  { file: 'rooftop.jpg', label: 'Rooftop over the city' },
  { file: 'speedboat.jpg', label: 'Speedboat on the bay' },
  { file: 'boulevard.jpg', label: 'Palm boulevard at sunset' },
];

const PALETTES = {
  sunset: { title: ['#ffc93c', '#ff7a18', '#ff2e88'], band: '#1a0b2e', glow: '#ff2e88', wash: ['#ff7a18', '#ff2e88'], footer: '#160826' },
  neon: { title: ['#19e3c2', '#3a86ff', '#ff2e88'], band: '#071a24', glow: '#19e3c2', wash: ['#19e3c2', '#ff2e88'], footer: '#04141c' },
  vice: { title: ['#ff9ff3', '#f368e0', '#48dbfb'], band: '#200b33', glow: '#f368e0', wash: ['#f368e0', '#48dbfb'], footer: '#180826' },
  golden: { title: ['#fff3b0', '#ffc93c', '#ff7a18'], band: '#241503', glow: '#ffc93c', wash: ['#ffc93c', '#ff7a18'], footer: '#1c1002' },
};

const SIZES = {
  square: { width: 1080, height: 1080, label: 'Square' },
  portrait: { width: 1080, height: 1350, label: 'Portrait' },
  landscape: { width: 1920, height: 1080, label: 'Landscape' },
};

const state = {
  panel: 1,
  shot: 'editor',
  title: 'NEON HEAT',
  subtitle: 'Midnight Run',
  grade: 'sunset',
  size: 'square',
  photos: SAMPLES.map(() => null),
  zooms: SAMPLES.map(() => 1),
  offsetX: SAMPLES.map(() => 0),
  offsetY: SAMPLES.map(() => 0),
};

const canvas = document.getElementById('cover');
const previewCtx = canvas.getContext('2d');

function layoutFor(width, height) {
  const gap = Math.round(Math.min(width, height) * 0.015);
  const titleH = Math.round(height * 0.17);
  const footerH = Math.round(height * 0.12);
  const gridH = height - titleH - footerH - gap * 2;
  const gridW = gridH;
  const gridX = Math.round((width - gridW) / 2);
  const gridY = titleH + gap;
  const cell = Math.floor((gridW - gap * 2) / 3);
  return { gap, titleH, footerH, gridX, gridY, gridW, gridH, cell, cols: 3, rows: 3 };
}

function drawPhoto(ctx, img, x, y, w, h, zoom, ox, oy) {
  if (!img || !img.complete || img.naturalWidth === 0) {
    ctx.fillStyle = '#2a1445';
    ctx.fillRect(x, y, w, h);
    return;
  }
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  const scale = Math.max(w / iw, h / ih) * zoom;
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = x + (w - dw) / 2 + ox * w;
  const dy = y + (h - dh) / 2 + oy * h;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

function drawPanelFinish(ctx, x, y, w, h, palette) {
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = Math.max(2, w * 0.008);
  ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
  const shade = ctx.createLinearGradient(x, y, x, y + h);
  shade.addColorStop(0, 'rgba(255,255,255,0.10)');
  shade.addColorStop(1, 'rgba(0,0,0,0.28)');
  ctx.fillStyle = shade;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = palette.glow;
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 3, y + 3, w - 6, h - 6);
  ctx.restore();
}

function drawStar(ctx, cx, cy, r, fill) {
  ctx.save();
  ctx.fillStyle = fill;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.45;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const px = cx + Math.cos(a) * rad;
    const py = cy + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawTitleBand(ctx, layout, width, palette, title, subtitle) {
  const { titleH } = layout;
  ctx.save();
  ctx.fillStyle = palette.band;
  ctx.fillRect(0, 0, width, titleH);
  const bandGlow = ctx.createLinearGradient(0, 0, width, 0);
  bandGlow.addColorStop(0, palette.wash[0]);
  bandGlow.addColorStop(1, palette.wash[1]);
  ctx.globalAlpha = 0.25;
  ctx.fillStyle = bandGlow;
  ctx.fillRect(0, titleH - 6, width, 6);
  ctx.globalAlpha = 1;
  const grad = ctx.createLinearGradient(0, 0, width, 0);
  grad.addColorStop(0, palette.title[0]);
  grad.addColorStop(0.5, palette.title[1]);
  grad.addColorStop(1, palette.title[2]);
  ctx.fillStyle = grad;
  ctx.font = `900 ${Math.round(titleH * 0.52)}px "Arial Black", Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = palette.glow;
  ctx.shadowBlur = titleH * 0.12;
  ctx.fillText(title.toUpperCase(), width / 2, titleH * 0.36);
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#ffffff';
  ctx.font = `italic ${Math.round(titleH * 0.26)}px Georgia, "Times New Roman", serif`;
  ctx.fillText(subtitle, width / 2, titleH * 0.78);
  const badgeR = titleH * 0.22;
  const bx = width - badgeR * 1.6;
  const by = titleH * 0.3;
  drawStar(ctx, bx, by, badgeR, palette.title[0]);
  ctx.fillStyle = '#1a0b2e';
  ctx.font = `900 ${Math.round(badgeR * 0.42)}px Arial, sans-serif`;
  ctx.fillText('NEW', bx, by + 1);
  ctx.restore();
}

function drawGrid(ctx, layout, photos, palette, selected) {
  const { gridX, gridY, cell, gap } = layout;
  for (let i = 0; i < 9; i++) {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = gridX + col * (cell + gap);
    const y = gridY + row * (cell + gap);
    const photo = photos[i];
    drawPhoto(ctx, photo, x, y, cell, cell, state.zooms[i], state.offsetX[i], state.offsetY[i]);
    drawPanelFinish(ctx, x, y, cell, cell, palette);
    if (selected === i + 1) {
      ctx.save();
      ctx.strokeStyle = palette.glow;
      ctx.lineWidth = Math.max(4, cell * 0.02);
      ctx.shadowColor = palette.glow;
      ctx.shadowBlur = cell * 0.08;
      ctx.strokeRect(x, y, cell, cell);
      ctx.restore();
    }
  }
}

function drawFooter(ctx, layout, width, height, palette) {
  const { footerH } = layout;
  const y = height - footerH;
  ctx.save();
  ctx.fillStyle = palette.footer;
  ctx.fillRect(0, y, width, footerH);
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const footerText = 'VICE CITY  •  SUNSET EDITION  •  NEON HEAT';
  let footerSize = Math.round(footerH * 0.34);
  ctx.font = `900 ${footerSize}px "Arial Black", Arial, sans-serif`;
  while (footerSize > 10 && ctx.measureText(footerText).width > width * 0.94) {
    footerSize -= 2;
    ctx.font = `900 ${footerSize}px "Arial Black", Arial, sans-serif`;
  }
  ctx.fillText(footerText, width / 2, y + footerH / 2);
  ctx.restore();
}

function drawCover(ctx, width, height, photos, palette, title, subtitle, selected) {
  const layout = layoutFor(width, height);
  ctx.save();
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, width, height);
  drawTitleBand(ctx, layout, width, palette, title, subtitle);
  drawGrid(ctx, layout, photos, palette, selected);
  drawFooter(ctx, layout, width, height, palette);
  const wash = ctx.createLinearGradient(0, 0, width, height);
  wash.addColorStop(0, palette.wash[0]);
  wash.addColorStop(1, palette.wash[1]);
  ctx.globalAlpha = 0.12;
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, width, height);
  ctx.globalAlpha = 1;
  ctx.restore();
  return layout;
}

function renderPreview() {
  const size = SIZES[state.size];
  if (canvas.width !== size.width || canvas.height !== size.height) {
    canvas.width = size.width;
    canvas.height = size.height;
  }
  drawCover(previewCtx, size.width, size.height, state.photos, PALETTES[state.grade], state.title, state.subtitle, state.shot === 'cover' ? 0 : state.panel);
}

function exportPng() {
  const size = SIZES[state.size];
  const offscreen = document.createElement('canvas');
  offscreen.width = size.width;
  offscreen.height = size.height;
  const ownCtx = offscreen.getContext('2d');
  drawCover(ownCtx, size.width, size.height, state.photos, PALETTES[state.grade], state.title, state.subtitle, 0);
  offscreen.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.getElementById('downloadLink');
    link.href = url;
    link.download = `neon-heat-${state.size}.png`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }, 'image/png');
}

function loadSamples() {
  SAMPLES.forEach((sample, i) => {
    const img = new Image();
    img.onload = () => renderPreview();
    img.src = `../samples/${sample.file}`;
    state.photos[i] = img;
  });
}

function buildPanelPicker() {
  const picker = document.getElementById('panelPicker');
  SAMPLES.forEach((sample, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = String(i + 1);
    btn.title = sample.label;
    btn.addEventListener('click', () => selectPanel(i + 1));
    picker.appendChild(btn);
  });
}

function selectPanel(n) {
  state.panel = n;
  document.getElementById('panelLabel').textContent = String(n);
  document.querySelectorAll('#panelPicker button').forEach((b, i) => {
    b.classList.toggle('active', i + 1 === n);
  });
  document.getElementById('zoom').value = String(state.zooms[n - 1]);
  document.getElementById('offsetX').value = String(state.offsetX[n - 1]);
  document.getElementById('offsetY').value = String(state.offsetY[n - 1]);
  renderPreview();
}

function readQuery() {
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  const size = params.get('size');
  const panel = Number(params.get('panel'));
  if (shot === 'cover' || shot === 'editor') state.shot = shot;
  if (params.get('title')) state.title = params.get('title');
  if (params.get('subtitle')) state.subtitle = params.get('subtitle');
  if (size && SIZES[size]) state.size = size;
  if (Number.isInteger(panel) && panel >= 1 && panel <= 9) state.panel = panel;
  if (shot === 'cover') {
    document.body.classList.add('cover-mode', state.size);
  }
  const titleInput = document.getElementById('titleInput');
  const subtitleInput = document.getElementById('subtitleInput');
  titleInput.value = state.title;
  subtitleInput.value = state.subtitle;
  document.getElementById('gradePicker').value = state.grade;
  document.getElementById('sizePicker').value = state.size;
}

function wireEditor() {
  document.getElementById('titleInput').addEventListener('input', (e) => {
    state.title = e.target.value || 'NEON HEAT';
    renderPreview();
  });
  document.getElementById('subtitleInput').addEventListener('input', (e) => {
    state.subtitle = e.target.value || 'Midnight Run';
    renderPreview();
  });
  document.getElementById('gradePicker').addEventListener('change', (e) => {
    state.grade = e.target.value;
    renderPreview();
  });
  document.getElementById('sizePicker').addEventListener('change', (e) => {
    state.size = e.target.value;
    document.body.classList.remove('square', 'portrait', 'landscape');
    renderPreview();
  });
  document.getElementById('zoom').addEventListener('input', (e) => {
    state.zooms[state.panel - 1] = Number(e.target.value);
    renderPreview();
  });
  document.getElementById('offsetX').addEventListener('input', (e) => {
    state.offsetX[state.panel - 1] = Number(e.target.value);
    renderPreview();
  });
  document.getElementById('offsetY').addEventListener('input', (e) => {
    state.offsetY[state.panel - 1] = Number(e.target.value);
    renderPreview();
  });
  document.getElementById('photoFile').addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      state.photos[state.panel - 1] = img;
      renderPreview();
    };
    img.src = url;
  });
  document.getElementById('fillAll').addEventListener('click', () => {
    const img = state.photos[state.panel - 1];
    if (!img) return;
    for (let i = 0; i < 9; i++) state.photos[i] = img;
    renderPreview();
  });
  document.getElementById('exportBtn').addEventListener('click', exportPng);
}

readQuery();
buildPanelPicker();
wireEditor();
selectPanel(state.panel);
loadSamples();
renderPreview();
