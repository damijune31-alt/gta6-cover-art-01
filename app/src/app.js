// NEON HEAT — Midnight Run cover maker.
// Nine panels, one sunset grade, giant gradient title, neon script, NEW badge.
// Photos are read on the user's own machine and never uploaded. Offline only.

const SAMPLES = [
  { file: "beach.jpg", label: "Beach" },
  { file: "market.jpg", label: "Market" },
  { file: "biker.jpg", label: "Biker" },
  { file: "neon-couple.jpg", label: "Neon couple" },
  { file: "surfer.jpg", label: "Surfer" },
  { file: "car.jpg", label: "Car" },
  { file: "speedboat.jpg", label: "Speedboat" },
  { file: "fisherman.jpg", label: "Fisherman" },
  { file: "skyline.jpg", label: "Skyline" },
  { file: "boulevard.jpg", label: "Boulevard" },
  { file: "pier.jpg", label: "Pier" },
];

const SIZES = [
  { w: 1920, h: 1080 },
  { w: 1080, h: 1080 },
  { w: 1080, h: 1350 },
];

const $ = (id) => document.getElementById(id);
const canvas = $("cover");

const state = {
  panels: Array.from({ length: 9 }, () => ({ img: null, zoom: 1, panX: 0, panY: 0 })),
  selected: 0,
  title: "MIDNIGHT RUN",
  script: "Neon Heat",
  badge: "NEW",
  grade: 0.7,
  size: SIZES[0],
};

function blankPanel(i) {
  return { img: null, zoom: 1, panX: 0, panY: 0 };
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("could not load " + src));
    img.src = src;
  });
}

async function fillWithSamples() {
  for (let i = 0; i < 9; i++) {
    try {
      const img = await loadImage("./samples/" + SAMPLES[i].file);
      state.panels[i] = { img, zoom: 1, panX: 0, panY: 0 };
    } catch { /* keep the panel empty and carry on */ }
  }
  render();
  refreshPanelButtons();
}

function drawCover(target, w, h) {
  const c = target.getContext("2d");
  c.save();
  c.fillStyle = "#0d0618";
  c.fillRect(0, 0, w, h);
  const gap = Math.max(4, Math.round(Math.min(w, h) * 0.008));
  const cols = 3;
  const rows = 3;
  const cw = (w - gap * (cols + 1)) / cols;
  const ch = (h - gap * (rows + 1)) / rows;
  for (let i = 0; i < 9; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    drawPhotoOn(c, state.panels[i], {
      x: gap + col * (cw + gap),
      y: gap + row * (ch + gap),
      w: cw,
      h: ch,
    });
  }
  // Grade, title and badge are drawn through the shared helpers on this context.
  drawOn(c, w, h);
  c.restore();
}

function drawPhotoOn(c, panel, cell) {
  const { x, y, w, h } = cell;
  if (!panel.img) {
    c.fillStyle = "#2c1544";
    c.fillRect(x, y, w, h);
    c.fillStyle = "#7a5a9e";
    c.font = `700 ${Math.round(h * 0.06)}px system-ui, sans-serif`;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText("EMPTY PANEL", x + w / 2, y + h / 2);
    return;
  }
  const img = panel.img;
  const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight) * panel.zoom;
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  const dx = x + (w - dw) / 2 + (panel.panX / 100) * w;
  const dy = y + (h - dh) / 2 + (panel.panY / 100) * h;
  c.save();
  c.beginPath();
  c.rect(x, y, w, h);
  c.clip();
  c.drawImage(img, dx, dy, dw, dh);
  c.restore();
}

function drawOn(c, w, h) {
  const strength = state.grade;
  if (strength > 0) {
    const g = c.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, "rgba(255, 41, 117, 0.55)");
    g.addColorStop(0.5, "rgba(255, 110, 30, 0.35)");
    g.addColorStop(1, "rgba(140, 30, 255, 0.55)");
    c.save();
    c.globalCompositeOperation = "overlay";
    c.globalAlpha = strength;
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
    c.restore();
    const v = c.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75);
    v.addColorStop(0, "rgba(0,0,0,0)");
    v.addColorStop(1, "rgba(10,0,25,0.45)");
    c.fillStyle = v;
    c.fillRect(0, 0, w, h);
  }
  const band = h * 0.30;
  const top = h - band;
  const scrim = c.createLinearGradient(0, top - h * 0.08, 0, h);
  scrim.addColorStop(0, "rgba(10,0,25,0)");
  scrim.addColorStop(1, "rgba(10,0,25,0.88)");
  c.fillStyle = scrim;
  c.fillRect(0, top - h * 0.08, w, h - top + h * 0.08);

  c.save();
  c.textAlign = "center";
  c.textBaseline = "middle";
  const titleSize = Math.round(w * 0.085);
  c.font = `900 ${titleSize}px system-ui, -apple-system, "Segoe UI", sans-serif`;
  try { c.letterSpacing = `${Math.round(w * 0.004)}px`; } catch { /* older canvas */ }
  const grad = c.createLinearGradient(w * 0.08, 0, w * 0.92, 0);
  grad.addColorStop(0, "#ffd319");
  grad.addColorStop(0.45, "#ff7a18");
  grad.addColorStop(0.75, "#ff2975");
  grad.addColorStop(1, "#b537f2");
  const titleY = top + band * 0.52;
  c.transform(1, 0, -0.06, 1, w * 0.03, 0);
  c.lineWidth = Math.max(3, titleSize * 0.07);
  c.strokeStyle = "rgba(20,0,40,0.9)";
  c.strokeText(state.title, w / 2, titleY);
  c.fillStyle = grad;
  c.fillText(state.title, w / 2, titleY);
  c.restore();

  const scriptSize = Math.round(w * 0.048);
  c.save();
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.font = `italic 700 ${scriptSize}px "Brush Script MT", "Segoe Script", cursive`;
  c.shadowColor = "#ff2e88";
  c.shadowBlur = Math.round(w * 0.02);
  c.fillStyle = "#ffffff";
  c.fillText(state.script, w / 2, top + band * 0.16);
  c.restore();
  try { c.letterSpacing = "0px"; } catch { /* ignore */ }

  if (state.badge) {
    const bw = w * 0.115;
    const bh = h * 0.075;
    const bx = w * 0.03;
    const by = h * 0.045;
    c.save();
    c.translate(bx + bw / 2, by + bh / 2);
    c.rotate(-0.1);
    c.fillStyle = "#ffd319";
    c.shadowColor = "#ff2975";
    c.shadowBlur = Math.round(w * 0.015);
    c.beginPath();
    const r = bh * 0.28;
    c.moveTo(-bw / 2 + r, -bh / 2);
    c.arcTo(bw / 2, -bh / 2, bw / 2, bh / 2, r);
    c.arcTo(bw / 2, bh / 2, -bw / 2, bh / 2, r);
    c.arcTo(-bw / 2, bh / 2, -bw / 2, -bh / 2, r);
    c.arcTo(-bw / 2, -bh / 2, bw / 2, -bh / 2, r);
    c.closePath();
    c.fill();
    c.shadowBlur = 0;
    c.fillStyle = "#160a2e";
    c.font = `900 ${Math.round(bh * 0.52)}px system-ui, sans-serif`;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(state.badge, 0, bh * 0.02);
    c.restore();
  }
}

function render() {
  canvas.width = state.size.w;
  canvas.height = state.size.h;
  drawCover(canvas, state.size.w, state.size.h);
}

function refreshPanelButtons() {
  const wrap = $("panelPick");
  wrap.innerHTML = "";
  state.panels.forEach((panel, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = String(i + 1);
    b.setAttribute("aria-pressed", i === state.selected ? "true" : "false");
    if (panel.img) b.style.backgroundImage = `url(${panel.img.src})`;
    b.addEventListener("click", () => selectPanel(i));
    wrap.appendChild(b);
  });
  $("panelName").textContent = String(state.selected + 1);
  const p = state.panels[state.selected];
  $("zoom").value = String(Math.round(p.zoom * 100));
  $("panX").value = String(p.panX);
  $("panY").value = String(p.panY);
}

function selectPanel(i) {
  state.selected = i;
  refreshPanelButtons();
}

function setStatus(msg) {
  $("status").textContent = msg;
}

function exportPNG() {
  const off = document.createElement("canvas");
  off.width = state.size.w;
  off.height = state.size.h;
  drawCover(off, state.size.w, state.size.h);
  return new Promise((resolve) => {
    off.toBlob((blob) => {
      if (!blob) { setStatus("Export failed — try again."); resolve(null); return; }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `neon-heat-midnight-run-${state.size.w}x${state.size.h}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      setStatus(`Exported ${state.size.w} × ${state.size.h} PNG.`);
      resolve(blob);
    }, "image/png");
  });
}

function buildSamples() {
  const wrap = $("samples");
  SAMPLES.forEach((s) => {
    const img = document.createElement("img");
    img.src = "./samples/" + s.file;
    img.alt = s.label;
    img.title = s.label + " — tap to put in the selected panel";
    img.addEventListener("click", async () => {
      try {
        const loaded = await loadImage("./samples/" + s.file);
        state.panels[state.selected] = { img: loaded, zoom: 1, panX: 0, panY: 0 };
        render();
        refreshPanelButtons();
        setStatus(`${s.label} is now in panel ${state.selected + 1}.`);
      } catch { setStatus("That sample could not be loaded."); }
    });
    wrap.appendChild(img);
  });
}

function wireControls() {
  $("upload").addEventListener("change", async (e) => {
    const files = [...e.target.files];
    if (!files.length) return;
    let slot = state.selected;
    for (const file of files) {
      try {
        const img = await loadImage(URL.createObjectURL(file));
        state.panels[slot] = { img, zoom: 1, panX: 0, panY: 0 };
        slot = (slot + 1) % 9;
      } catch { /* skip unreadable files */ }
    }
    state.selected = slot;
    render();
    refreshPanelButtons();
    setStatus(`${files.length} photo${files.length > 1 ? "s" : ""} loaded.`);
    e.target.value = "";
  });

  $("fillSamples").addEventListener("click", async () => {
    setStatus("Filling all 9 panels…");
    await fillWithSamples();
    setStatus("9 panels filled — pick a panel to crop it, then export.");
  });

  $("fillOne").addEventListener("click", () => {
    const src = state.panels[state.selected].img;
    if (!src) { setStatus("Put a photo in the selected panel first."); return; }
    state.panels = state.panels.map(() => ({ img: src, zoom: 1, panX: 0, panY: 0 }));
    render();
    refreshPanelButtons();
    setStatus("One photo now fills all 9 panels.");
  });

  $("zoom").addEventListener("input", (e) => {
    state.panels[state.selected].zoom = Number(e.target.value) / 100;
    render();
  });
  $("panX").addEventListener("input", (e) => {
    state.panels[state.selected].panX = Number(e.target.value);
    render();
  });
  $("panY").addEventListener("input", (e) => {
    state.panels[state.selected].panY = Number(e.target.value);
    render();
  });
  $("resetPanel").addEventListener("click", () => {
    const p = state.panels[state.selected];
    p.zoom = 1; p.panX = 0; p.panY = 0;
    render();
    refreshPanelButtons();
  });
  $("clearPanel").addEventListener("click", () => {
    state.panels[state.selected] = blankPanel();
    render();
    refreshPanelButtons();
  });

  $("title").addEventListener("input", (e) => { state.title = e.target.value.toUpperCase() || "MIDNIGHT RUN"; render(); });
  $("script").addEventListener("input", (e) => { state.script = e.target.value || "Neon Heat"; render(); });
  $("badge").addEventListener("input", (e) => { state.badge = e.target.value.toUpperCase(); render(); });
  $("grade").addEventListener("input", (e) => { state.grade = Number(e.target.value) / 100; render(); });

  document.querySelectorAll(".size").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.size = { w: Number(btn.dataset.w), h: Number(btn.dataset.h) };
      document.querySelectorAll(".size").forEach((b) => b.setAttribute("aria-pressed", b === btn ? "true" : "false"));
      render();
    });
  });

  $("export").addEventListener("click", exportPNG);
}

function markSizeButtons() {
  document.querySelectorAll(".size").forEach((b) => {
    const match = Number(b.dataset.w) === state.size.w && Number(b.dataset.h) === state.size.h;
    b.setAttribute("aria-pressed", match ? "true" : "false");
  });
}

async function boot() {
  buildSamples();
  wireControls();
  markSizeButtons();
  refreshPanelButtons();
  render();
  const params = new URLSearchParams(location.search);
  if (params.get("shot") === "cover" || params.get("shot") === "editor") {
    document.body.classList.toggle("shot-cover", params.get("shot") === "cover");
    await fillWithSamples();
    if (params.get("size")) {
      const [w, h] = params.get("size").split("x").map(Number);
      if (w && h) { state.size = { w, h }; markSizeButtons(); render(); }
    }
  }
  window.__cover = {
    state,
    render,
    ready: () => state.panels.filter((p) => p.img).length,
    exportDataURL: () => {
      const off = document.createElement("canvas");
      off.width = state.size.w;
      off.height = state.size.h;
      drawCover(off, state.size.w, state.size.h);
      return off.toDataURL("image/png");
    },
  };
}

boot();
