import { useState, useEffect, useRef, useCallback } from "react";

const W = 720, H = 420, CX = W / 2, CY = H / 2;

interface Props {
  mode?: string;
  onContextChange?: (ctx: string) => void;
  [key: string]: any;
}

// ─── Canvas Helpers ────────────────────────────────────────────────────────────

function bg(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#050d1a";
  ctx.fillRect(0, 0, W, H);
}

function txt(
  ctx: CanvasRenderingContext2D,
  s: string, x: number, y: number,
  color = "#e2e8f0", size = 12, bold = false
) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = `${bold ? "bold " : ""}${size}px Inter,sans-serif`;
  ctx.fillText(s, x, y);
  ctx.restore();
}

function dot(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function infoPanel(ctx: CanvasRenderingContext2D, lines: string[]) {
  ctx.save();
  ctx.fillStyle = "rgba(15,23,42,0.88)";
  ctx.strokeStyle = "rgba(99,102,241,0.5)";
  ctx.lineWidth = 1;
  const pw = 220, ph = lines.length * 17 + 14;
  ctx.beginPath();
  ctx.roundRect(8, 8, pw, ph, 6);
  ctx.fill(); ctx.stroke();
  lines.forEach((l, i) => txt(ctx, l, 16, 24 + i * 17, i === 0 ? "#a5b4fc" : "#cbd5e1", i === 0 ? 11 : 10, i === 0));
  ctx.restore();
}

// Wavelength → approximate RGB colour for light visualisation
function wavelengthToRGB(nm: number): string {
  let r = 0, g = 0, b = 0;
  if (nm >= 380 && nm < 440) { r = -(nm - 440) / 60; b = 1; }
  else if (nm < 490) { g = (nm - 440) / 50; b = 1; }
  else if (nm < 510) { g = 1; b = -(nm - 510) / 20; }
  else if (nm < 580) { r = (nm - 510) / 70; g = 1; }
  else if (nm < 645) { r = 1; g = -(nm - 645) / 65; }
  else if (nm <= 750) { r = 1; }
  const factor = nm < 420 ? 0.3 + 0.7 * (nm - 380) / 40
    : nm > 700 ? 0.3 + 0.7 * (750 - nm) / 50 : 1;
  return `rgb(${Math.round(r * factor * 255)},${Math.round(g * factor * 255)},${Math.round(b * factor * 255)})`;
}

// ─── Rendering Functions ───────────────────────────────────────────────────────

// 1. Huygens' Principle — Plane Wavefront
function renderHuygens(ctx: CanvasRenderingContext2D, t: number, mode: string) {
  bg(ctx);
  const isPoint = mode === "huygens-point";

  if (isPoint) {
    // Expanding spherical wavefronts from point source
    const SX = 120, SY = CY;
    const speed = 40;
    for (let w = 0; w < 5; w++) {
      const phase = ((t * speed + w * 80) % 350);
      if (phase < 5) continue;
      ctx.save();
      ctx.strokeStyle = `rgba(99,179,237,${Math.max(0, 1 - phase / 350)})`;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(SX, SY, phase, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    // Secondary wavelets on latest wavefront
    const mainR = ((t * speed) % 350) || 1;
    ctx.save();
    ctx.strokeStyle = "rgba(251,191,36,0.45)";
    ctx.lineWidth = 1;
    const nWavelets = 10;
    for (let i = 0; i < nWavelets; i++) {
      const ang = (Math.PI * 2 * i) / nWavelets;
      const wx = SX + mainR * Math.cos(ang);
      const wy = SY + mainR * Math.sin(ang);
      if (wx < 10 || wx > W - 10 || wy < 10 || wy > H - 10) continue;
      const wR = ((t * speed * 0.4) % 28) + 2;
      ctx.beginPath(); ctx.arc(wx, wy, wR, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
    dot(ctx, SX, SY, 6, "#f59e0b");
    txt(ctx, "Point Source (S)", SX - 20, SY + 22, "#f59e0b", 11, true);
    txt(ctx, "Spherical Wavefronts", CX + 30, 30, "#a5b4fc", 12, true);
    txt(ctx, "Each point on a wavefront", CX + 30, 52, "#94a3b8", 11);
    txt(ctx, "acts as a secondary source", CX + 30, 66, "#94a3b8", 11);
    txt(ctx, "→ Envelope = New Wavefront", CX + 30, 82, "#6ee7b7", 11);
    infoPanel(ctx, [
      "Huygens' Principle (Point Source)",
      "Wavefront: locus of same phase",
      "Secondary wavelets: r = cΔt",
      "Tangent to wavelets = new wavefront",
    ]);
  } else {
    // Plane wavefront with secondary wavelets
    const speed = 35;
    const xOffset = (t * speed) % 90;
    const nFronts = 6;
    const sources: number[] = [60, 120, 180, 240, 300, 360];
    for (let f = 0; f < nFronts; f++) {
      const x = 80 + xOffset + f * 90;
      if (x < 0 || x > W) continue;
      ctx.save();
      ctx.strokeStyle = `rgba(99,179,237,${0.7 - f * 0.08})`;
      ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.moveTo(x, 20); ctx.lineTo(x, H - 20); ctx.stroke();
      ctx.restore();
    }
    // Secondary wavelets on the leading front
    const leadX = 80 + xOffset;
    if (leadX > 40 && leadX < W - 40) {
      const wR = ((t * speed * 0.45) % 30) + 2;
      ctx.save();
      ctx.strokeStyle = "rgba(251,191,36,0.55)";
      ctx.lineWidth = 1;
      sources.forEach(sy => {
        ctx.beginPath();
        ctx.arc(leadX, sy, wR, -Math.PI / 2, Math.PI / 2);
        ctx.stroke();
      });
      ctx.restore();
    }
    txt(ctx, "Plane Wavefronts →", CX - 60, 18, "#a5b4fc", 12, true);
    txt(ctx, "Secondary wavelets (Huygens)", 490, 50, "#fbbf24", 11);
    txt(ctx, "Envelope → next wavefront", 490, 65, "#6ee7b7", 11);
    infoPanel(ctx, [
      "Huygens' Principle (Plane Wave)",
      "Each point: new secondary source",
      "Wavelet radius = c × Δt",
      "Envelope = next plane wavefront",
    ]);
  }
}

// 2. Coherent Sources
function renderCoherentSources(ctx: CanvasRenderingContext2D, t: number) {
  bg(ctx);
  const speed = 2.5;
  // Left panel: Coherent
  ctx.save();
  ctx.fillStyle = "rgba(99,179,237,0.08)";
  ctx.fillRect(20, 40, 320, H - 60);
  ctx.restore();
  txt(ctx, "COHERENT SOURCES", 80, 65, "#22c55e", 12, true);
  txt(ctx, "(Stable Phase Difference)", 60, 82, "#86efac", 10);
  for (let i = 0; i < 2; i++) {
    const sy = 140 + i * 100;
    for (let k = 0; k < 8; k++) {
      const x = 60 + k * 34;
      const phase = t * speed - k * 1.0 + i * 0;
      const y = sy + 18 * Math.sin(phase);
      const alpha = Math.max(0.2, 1 - k * 0.06);
      dot(ctx, x, y, 4, `rgba(99,179,237,${alpha})`);
      if (k > 0) {
        const px = 60 + (k - 1) * 34;
        const pphase = t * speed - (k - 1) * 1.0;
        const py = sy + 18 * Math.sin(pphase);
        ctx.save(); ctx.strokeStyle = `rgba(99,179,237,${alpha * 0.7})`; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(x, y); ctx.stroke();
        ctx.restore();
      }
    }
    txt(ctx, `S${i + 1}`, 38, sy + 5, "#a5b4fc", 11, true);
  }
  txt(ctx, "Δφ = constant → Stable fringes", 40, H - 50, "#22c55e", 10);

  // Right panel: Incoherent
  ctx.save();
  ctx.fillStyle = "rgba(239,68,68,0.08)";
  ctx.fillRect(360, 40, 340, H - 60);
  ctx.restore();
  txt(ctx, "INCOHERENT SOURCES", 400, 65, "#f87171", 12, true);
  txt(ctx, "(Random Phase Difference)", 385, 82, "#fca5a5", 10);
  for (let i = 0; i < 2; i++) {
    const sy = 140 + i * 100;
    const randomPhaseOffset = Math.sin(t * 0.8 + i * 3.7) * 4;
    for (let k = 0; k < 8; k++) {
      const x = 390 + k * 38;
      const phase = t * speed - k * 1.0 + randomPhaseOffset + i * 2.5;
      const y = sy + 18 * Math.sin(phase);
      const alpha = Math.max(0.2, 1 - k * 0.06);
      dot(ctx, x, y, 4, `rgba(239,68,68,${alpha})`);
      if (k > 0) {
        const px = 390 + (k - 1) * 38;
        const pphase = t * speed - (k - 1) * 1.0 + randomPhaseOffset + i * 2.5;
        const py = sy + 18 * Math.sin(pphase);
        ctx.save(); ctx.strokeStyle = `rgba(239,68,68,${alpha * 0.7})`; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(x, y); ctx.stroke();
        ctx.restore();
      }
    }
    txt(ctx, `S${i + 1}`, 370, sy + 5, "#f87171", 11, true);
  }
  txt(ctx, "Δφ = random → No stable fringes", 375, H - 50, "#f87171", 10);

  // Divider
  ctx.save();
  ctx.strokeStyle = "rgba(100,116,139,0.4)"; ctx.lineWidth = 1; ctx.setLineDash([5, 5]);
  ctx.beginPath(); ctx.moveTo(350, 40); ctx.lineTo(350, H - 20); ctx.stroke();
  ctx.restore();

  infoPanel(ctx, [
    "Coherent Sources",
    "Phase diff Δφ = constant",
    "Required for sustained interference",
    "YDSE uses single source → split",
  ]);
}

// 3. YDSE Setup (geometry)
function renderYDSESetup(ctx: CanvasRenderingContext2D, t: number, params: Record<string, number>) {
  bg(ctx);
  const d = params.d ?? 4;     // slit sep in mm (display)
  const D = params.D ?? 1000;  // distance in mm

  const SX = 80;               // source
  const SLX = 220;             // slit plane
  const SCX = W - 80;          // screen
  const SY1 = CY - 40, SY2 = CY + 40; // slit positions

  // Source
  dot(ctx, SX, CY, 8, "#f59e0b");
  txt(ctx, "S (Source)", SX - 20, CY + 22, "#f59e0b", 11, true);

  // Slit barrier
  ctx.save();
  ctx.fillStyle = "#334155";
  ctx.fillRect(SLX - 5, 20, 10, SY1 - 30);
  ctx.fillRect(SLX - 5, SY1 + 8, 10, SY2 - SY1 - 16);
  ctx.fillRect(SLX - 5, SY2 + 8, 10, H - SY2 - 28);
  ctx.restore();
  dot(ctx, SLX, SY1, 5, "#60a5fa"); txt(ctx, "S₁", SLX + 8, SY1 + 4, "#60a5fa", 11, true);
  dot(ctx, SLX, SY2, 5, "#34d399"); txt(ctx, "S₂", SLX + 8, SY2 + 4, "#34d399", 11, true);

  // Screen
  ctx.save();
  ctx.strokeStyle = "#64748b"; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(SCX, 20); ctx.lineTo(SCX, H - 20); ctx.stroke();
  ctx.restore();
  txt(ctx, "Screen", SCX - 40, H - 8, "#94a3b8", 11);

  // Animated fringe lines on screen
  const lam = 550; // nm
  const beta = (lam * 1e-6 * D) / d; // fringe width in mm → scale
  const scale = 130 / (D / 10);
  const betaPx = beta * scale;
  for (let n = -4; n <= 4; n++) {
    const y = CY + n * betaPx;
    if (y < 25 || y > H - 25) continue;
    const bright = Math.cos((Math.PI * n)) ** 2;
    ctx.save();
    ctx.fillStyle = `rgba(255,230,100,${bright * 0.85})`;
    ctx.fillRect(SCX - 3, y - 2, 6, 4);
    ctx.restore();
    if (n === 0) txt(ctx, "n=0", SCX + 6, y + 4, "#fbbf24", 10);
    if (Math.abs(n) === 1) txt(ctx, `n=±1`, SCX + 6, y + 4, "#94a3b8", 9);
  }

  // Ray lines: S1 and S2 to central point
  const PY = CY + (params.py ?? 0);
  ctx.save();
  ctx.strokeStyle = "rgba(96,165,250,0.45)"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(SLX, SY1); ctx.lineTo(SCX, PY); ctx.stroke();
  ctx.strokeStyle = "rgba(52,211,153,0.45)";
  ctx.beginPath(); ctx.moveTo(SLX, SY2); ctx.lineTo(SCX, PY); ctx.stroke();
  // Animated point P on screen
  const animPY = CY + 60 * Math.sin(t * 0.6);
  ctx.strokeStyle = "rgba(96,165,250,0.6)"; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(SLX, SY1); ctx.lineTo(SCX, animPY); ctx.stroke();
  ctx.strokeStyle = "rgba(52,211,153,0.6)";
  ctx.beginPath(); ctx.moveTo(SLX, SY2); ctx.lineTo(SCX, animPY); ctx.stroke();
  ctx.restore();
  dot(ctx, SCX, animPY, 5, "#fbbf24");
  txt(ctx, "P", SCX + 6, animPY + 4, "#fbbf24", 11, true);

  // d arrow
  ctx.save();
  ctx.strokeStyle = "#a78bfa"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(SLX - 22, SY1); ctx.lineTo(SLX - 22, SY2); ctx.stroke();
  txt(ctx, "d", SLX - 38, CY + 4, "#a78bfa", 11, true);
  ctx.restore();

  // D arrow
  ctx.save();
  ctx.strokeStyle = "#6ee7b7"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(SLX, H - 18); ctx.lineTo(SCX, H - 18); ctx.stroke();
  txt(ctx, "D", CX - 10, H - 5, "#6ee7b7", 11, true);
  ctx.restore();

  infoPanel(ctx, [
    "Young's Double Slit Experiment",
    `d = ${d} mm  (slit separation)`,
    `D = ${D} mm  (screen distance)`,
    "λ = 550 nm (green light)",
    "β = λD/d  (fringe width)",
  ]);
}

// 4. YDSE Fringe Pattern (interactive)
function renderYDSEFringes(
  ctx: CanvasRenderingContext2D,
  lambda: number, d: number, D: number,
  mode: string
) {
  bg(ctx);
  const screenX = W - 100;
  const screenW = 48;

  // White light mode
  const isWhite = mode === "ydse-white-light";

  // Compute fringe width in pixels
  // β = λD/d; we normalise so β = 60px when λ=550, d=0.5mm, D=1m
  const betaNorm = (lambda * D) / (d * 550 * 1.0); // relative
  const betaPx = betaNorm * 55;

  // Draw intensity pattern
  const imgData = ctx.createImageData(screenW, H - 40);
  for (let py = 0; py < H - 40; py++) {
    const y = py - (H - 40) / 2; // distance from centre in px
    const delta = (Math.PI * d * y) / (lambda * betaPx / Math.PI); // phase difference
    const I = Math.cos(delta) ** 2; // normalised intensity

    if (isWhite) {
      // sum over visible spectrum
      let rT = 0, gT = 0, bT = 0;
      for (let nm = 400; nm <= 700; nm += 20) {
        const beta_nm = (nm * D) / (d * 550 * 1.0) * 55;
        const del_nm = (Math.PI * d * y) / (nm * beta_nm / Math.PI);
        const I_nm = Math.cos(del_nm) ** 2;
        const { r, g, b } = nmToRGB(nm);
        rT += r * I_nm; gT += g * I_nm; bT += b * I_nm;
      }
      const scale = 16 / 255;
      for (let px = 0; px < screenW; px++) {
        const idx = (py * screenW + px) * 4;
        imgData.data[idx] = Math.min(255, rT * scale * 255);
        imgData.data[idx + 1] = Math.min(255, gT * scale * 255);
        imgData.data[idx + 2] = Math.min(255, bT * scale * 255);
        imgData.data[idx + 3] = 255;
      }
    } else {
      const { r, g, b } = nmToRGB(lambda);
      for (let px = 0; px < screenW; px++) {
        const idx = (py * screenW + px) * 4;
        imgData.data[idx] = r * I;
        imgData.data[idx + 1] = g * I;
        imgData.data[idx + 2] = b * I;
        imgData.data[idx + 3] = 255;
      }
    }
  }
  ctx.putImageData(imgData, screenX - screenW / 2, 20);

  // Screen border
  ctx.save();
  ctx.strokeStyle = "rgba(100,116,139,0.6)"; ctx.lineWidth = 1.5;
  ctx.strokeRect(screenX - screenW / 2, 20, screenW, H - 40);
  ctx.restore();
  txt(ctx, "Screen", screenX - 24, H - 4, "#94a3b8", 10);

  // Fringe labels on screen
  for (let n = -3; n <= 3; n++) {
    const y = CY + n * betaPx;
    if (y < 24 || y > H - 24) continue;
    txt(ctx, `n=${n}`, screenX + screenW / 2 + 4, y + 4, n === 0 ? "#fbbf24" : "#94a3b8", 9);
  }

  // Setup diagram (left side)
  const SLX = 180;
  ctx.save();
  ctx.fillStyle = "#334155";
  ctx.fillRect(SLX - 4, 20, 8, CY - 50);
  ctx.fillRect(SLX - 4, CY + 50, 8, H - CY - 70);
  ctx.restore();
  dot(ctx, SLX, CY - 40, 4, "#60a5fa");
  dot(ctx, SLX, CY + 40, 4, "#34d399");
  txt(ctx, "S₁", SLX + 6, CY - 36, "#60a5fa", 10);
  txt(ctx, "S₂", SLX + 6, CY + 44, "#34d399", 10);

  // β arrow
  ctx.save();
  ctx.strokeStyle = "#a78bfa"; ctx.lineWidth = 1;
  const byTop = CY - betaPx / 2, byBot = CY + betaPx / 2;
  ctx.beginPath();
  ctx.moveTo(screenX - 68, byTop); ctx.lineTo(screenX - 68, byBot); ctx.stroke();
  txt(ctx, "β", screenX - 80, CY + 4, "#a78bfa", 11, true);
  ctx.restore();

  infoPanel(ctx, [
    isWhite ? "YDSE — White Light Fringes" : "YDSE Fringe Pattern",
    isWhite ? "Central fringe = WHITE" : `λ = ${lambda} nm`,
    `d = ${d.toFixed(2)} mm   D = ${D.toFixed(0)} mm`,
    `β = λD/d = ${((lambda * 1e-6 * D) / d).toExponential(2)} mm`,
    isWhite ? "Outer fringes: coloured (dispersed)" : "Bright: Δ = nλ   Dark: Δ = (n+½)λ",
  ]);
}

function nmToRGB(nm: number): { r: number; g: number; b: number } {
  let r = 0, g = 0, b = 0;
  if (nm >= 380 && nm < 440) { r = -(nm - 440) / 60; b = 1; }
  else if (nm < 490) { g = (nm - 440) / 50; b = 1; }
  else if (nm < 510) { g = 1; b = -(nm - 510) / 20; }
  else if (nm < 580) { r = (nm - 510) / 70; g = 1; }
  else if (nm < 645) { r = 1; g = -(nm - 645) / 65; }
  else if (nm <= 750) { r = 1; }
  const factor = nm < 420 ? 0.3 + 0.7 * (nm - 380) / 40 : nm > 700 ? 0.3 + 0.7 * (750 - nm) / 50 : 1;
  return { r: Math.round(r * factor * 255), g: Math.round(g * factor * 255), b: Math.round(b * factor * 255) };
}

// 5. YDSE Path Difference
function renderYDSEPathDiff(ctx: CanvasRenderingContext2D, t: number) {
  bg(ctx);
  const SLX = 180, SCX = W - 80;
  const S1Y = CY - 50, S2Y = CY + 50;
  const d = 100; // px

  // Animated P on screen
  const PY = CY + 80 * Math.sin(t * 0.5);
  const yn = PY - CY; // displacement from centre

  // Path lengths
  const r1 = Math.sqrt((SCX - SLX) ** 2 + (PY - S1Y) ** 2);
  const r2 = Math.sqrt((SCX - SLX) ** 2 + (PY - S2Y) ** 2);
  const pathDiff = r2 - r1;

  // Slits
  dot(ctx, SLX, S1Y, 6, "#60a5fa"); txt(ctx, "S₁", SLX - 22, S1Y + 4, "#60a5fa", 11, true);
  dot(ctx, SLX, S2Y, 6, "#34d399"); txt(ctx, "S₂", SLX - 22, S2Y + 4, "#34d399", 11, true);

  // Screen
  ctx.save(); ctx.strokeStyle = "#64748b"; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(SCX, 20); ctx.lineTo(SCX, H - 20); ctx.stroke();
  ctx.restore();

  // Rays
  ctx.save();
  ctx.strokeStyle = "rgba(96,165,250,0.75)"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(SLX, S1Y); ctx.lineTo(SCX, PY); ctx.stroke();
  ctx.strokeStyle = "rgba(52,211,153,0.75)"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(SLX, S2Y); ctx.lineTo(SCX, PY); ctx.stroke();
  ctx.restore();

  // d (slit sep)
  ctx.save();
  ctx.strokeStyle = "#a78bfa"; ctx.lineWidth = 1; ctx.setLineDash([4, 3]);
  ctx.beginPath(); ctx.moveTo(SLX, S1Y); ctx.lineTo(SLX, S2Y); ctx.stroke();
  ctx.setLineDash([]);
  txt(ctx, "d", SLX - 16, CY + 4, "#a78bfa", 12, true);
  ctx.restore();

  // y (screen position)
  ctx.save(); ctx.strokeStyle = "#fbbf24"; ctx.lineWidth = 1; ctx.setLineDash([4, 3]);
  ctx.beginPath(); ctx.moveTo(SCX, CY); ctx.lineTo(SCX, PY); ctx.stroke();
  ctx.setLineDash([]);
  txt(ctx, "y", SCX + 6, (CY + PY) / 2 + 4, "#fbbf24", 11, true);
  ctx.restore();

  // D (distance to screen)
  ctx.save(); ctx.strokeStyle = "#6ee7b7"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(SLX, H - 18); ctx.lineTo(SCX, H - 18); ctx.stroke();
  txt(ctx, "D", CX - 10, H - 5, "#6ee7b7", 11, true);
  ctx.restore();

  // Point P
  dot(ctx, SCX, PY, 7, "#fbbf24");
  txt(ctx, "P", SCX + 8, PY + 4, "#fbbf24", 12, true);

  // Central fringe marker
  dot(ctx, SCX, CY, 4, "rgba(255,255,255,0.4)");
  txt(ctx, "O (n=0)", SCX + 8, CY + 4, "#94a3b8", 9);

  // Path diff approximation label
  const approxDelta = (d * Math.abs(yn)) / (SCX - SLX);
  const lambda = 550;
  const nApprox = pathDiff / lambda;
  const isBright = Math.abs(nApprox - Math.round(nApprox)) < 0.1;

  ctx.save();
  ctx.fillStyle = isBright ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.12)";
  ctx.fillRect(SCX - 12, Math.min(PY, CY) - 4, 12, Math.abs(PY - CY) + 8);
  ctx.restore();

  infoPanel(ctx, [
    "Path Difference Analysis",
    `Δ = S₂P − S₁P = ${pathDiff.toFixed(1)} px`,
    `Approx: Δ ≈ dy/D`,
    `Bright: Δ = nλ   (n = 0,1,2…)`,
    `Dark:   Δ = (2n−1)λ/2`,
    isBright ? `→ BRIGHT FRINGE ✓` : `→ Dark fringe`,
  ]);
  txt(ctx, isBright ? "BRIGHT" : "dark", SCX - 52, PY - 8,
    isBright ? "#22c55e" : "#94a3b8", 10, isBright);
}

// 6. Single Slit Diffraction
// slitW is in μm (e.g. 5 = 5 μm)
function renderSingleSlit(
  ctx: CanvasRenderingContext2D,
  slitW_um: number, lambda: number
) {
  bg(ctx);
  const slitW_m = slitW_um * 1e-6; // convert μm → m
  const lambda_m = lambda * 1e-9;  // convert nm → m

  // I = I₀(sinα/α)²  where α = πa sinθ / λ
  // Map canvas y position to sinθ over ±maxSinTheta
  const maxSinTheta = 0.18;
  const screenX = W - 110;
  const screenW = 52;
  const screenH = H - 40;
  const halfH = screenH / 2;

  // Draw the diffraction intensity strip
  const iData = ctx.createImageData(screenW, screenH);
  const { r: cr, g: cg, b: cb } = nmToRGB(lambda);
  for (let py = 0; py < screenH; py++) {
    const sinTheta = maxSinTheta * (py - halfH) / halfH;
    const alpha = (Math.PI * slitW_m * sinTheta) / lambda_m;
    const I = Math.abs(alpha) < 1e-8 ? 1 : (Math.sin(alpha) / alpha) ** 2;
    for (let px = 0; px < screenW; px++) {
      const idx = (py * screenW + px) * 4;
      iData.data[idx]     = cr * I;
      iData.data[idx + 1] = cg * I;
      iData.data[idx + 2] = cb * I;
      iData.data[idx + 3] = 255;
    }
  }
  ctx.putImageData(iData, screenX - screenW / 2, 20);

  // Screen border
  ctx.save();
  ctx.strokeStyle = "rgba(100,116,139,0.6)"; ctx.lineWidth = 1.5;
  ctx.strokeRect(screenX - screenW / 2, 20, screenW, screenH);
  ctx.restore();
  txt(ctx, "Screen", screenX - 24, H - 4, "#94a3b8", 10);

  // Minima markers: sinθ = mλ/a
  for (let m = 1; m <= 4; m++) {
    const sinT = (m * lambda_m) / slitW_m;
    if (sinT > maxSinTheta) continue;
    const yPx = sinT * halfH / maxSinTheta;
    [CY + yPx, CY - yPx].forEach(y => {
      ctx.save();
      ctx.strokeStyle = "rgba(239,68,68,0.7)"; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(screenX - screenW / 2 - 10, y);
      ctx.lineTo(screenX - screenW / 2, y);
      ctx.stroke();
      ctx.setLineDash([]);
      txt(ctx, `m=${m}`, screenX + screenW / 2 + 4, y + 4, "#f87171", 9);
      ctx.restore();
    });
  }

  // Central max bracket
  const sinT1 = lambda_m / slitW_m;
  if (sinT1 < maxSinTheta) {
    const hWpx = sinT1 * halfH / maxSinTheta;
    ctx.save();
    ctx.strokeStyle = "#6ee7b7"; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(screenX - screenW / 2 - 28, CY - hWpx);
    ctx.lineTo(screenX - screenW / 2 - 28, CY + hWpx);
    ctx.stroke();
    ctx.restore();
    txt(ctx, "2λ/a", screenX - screenW / 2 - 62, CY + 4, "#6ee7b7", 9, true);
  }

  // Slit diagram (left side) — visual gap scaled for display
  const visGap = Math.max(6, Math.min(50, 25 / slitW_um * 5)); // px: larger slit → smaller gap shown
  ctx.save();
  ctx.fillStyle = "#334155";
  ctx.fillRect(170, 20, 10, CY - visGap - 20);
  ctx.fillRect(170, CY + visGap, 10, H - CY - visGap - 20);
  ctx.restore();
  // Label gap
  ctx.save();
  ctx.strokeStyle = "#a78bfa"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(160, CY - visGap); ctx.lineTo(160, CY + visGap); ctx.stroke();
  ctx.restore();
  txt(ctx, "a", 148, CY + 4, "#a78bfa", 11, true);

  infoPanel(ctx, [
    "Single Slit Diffraction",
    "I = I₀ (sinα/α)²",
    "α = πa sinθ / λ",
    `Minima: a sinθ = mλ  (m=1,2,…)`,
    `a = ${slitW_um.toFixed(1)} μm   λ = ${lambda} nm`,
    `1st min: sinθ = ${(lambda_m / slitW_m).toFixed(3)}`,
  ]);
}

// 7. Malus's Law
function renderMalusLaw(ctx: CanvasRenderingContext2D, theta: number) {
  bg(ctx);
  const thetaRad = (theta * Math.PI) / 180;
  const I = Math.cos(thetaRad) ** 2;

  // Incident beam (polarized)
  const P1X = 160;  // polarizer
  const P2X = 420;  // analyzer
  const BEAM_Y = CY;

  // Beam before polarizer (unpolarized)
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.35)"; ctx.lineWidth = 18;
  ctx.beginPath(); ctx.moveTo(60, BEAM_Y); ctx.lineTo(P1X, BEAM_Y); ctx.stroke();
  ctx.restore();
  txt(ctx, "Unpolarised", 62, BEAM_Y - 18, "#94a3b8", 10);

  // Polarizer
  ctx.save();
  ctx.fillStyle = "#1e3a5f"; ctx.strokeStyle = "#60a5fa"; ctx.lineWidth = 2;
  ctx.fillRect(P1X - 8, BEAM_Y - 60, 16, 120);
  ctx.strokeRect(P1X - 8, BEAM_Y - 60, 16, 120);
  txt(ctx, "Polariser", P1X - 28, BEAM_Y + 78, "#60a5fa", 10, true);
  // Vertical arrow (polarisation direction)
  ctx.strokeStyle = "#60a5fa"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(P1X, BEAM_Y - 42); ctx.lineTo(P1X, BEAM_Y + 42); ctx.stroke();
  ctx.restore();

  // Beam after polarizer (polarized, fixed intensity)
  ctx.save();
  ctx.strokeStyle = "rgba(96,165,250,0.85)"; ctx.lineWidth = 14;
  ctx.beginPath(); ctx.moveTo(P1X, BEAM_Y); ctx.lineTo(P2X, BEAM_Y); ctx.stroke();
  ctx.restore();
  txt(ctx, "Polarised (I₀)", (P1X + P2X) / 2 - 40, BEAM_Y - 18, "#60a5fa", 10);

  // Analyser
  ctx.save();
  ctx.fillStyle = "#1c3a2f"; ctx.strokeStyle = "#34d399"; ctx.lineWidth = 2;
  ctx.fillRect(P2X - 8, BEAM_Y - 60, 16, 120);
  ctx.strokeRect(P2X - 8, BEAM_Y - 60, 16, 120);
  txt(ctx, "Analyser", P2X - 26, BEAM_Y + 78, "#34d399", 10, true);
  // Rotated arrow
  ctx.strokeStyle = "#34d399"; ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(P2X + 40 * Math.cos(thetaRad + Math.PI / 2), BEAM_Y + 40 * Math.sin(thetaRad + Math.PI / 2));
  ctx.lineTo(P2X - 40 * Math.cos(thetaRad + Math.PI / 2), BEAM_Y - 40 * Math.sin(thetaRad + Math.PI / 2));
  ctx.stroke();
  txt(ctx, `θ=${theta}°`, P2X + 14, BEAM_Y - 44, "#34d399", 10);
  ctx.restore();

  // Angle arc
  ctx.save();
  ctx.strokeStyle = "#fbbf24"; ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(P2X, BEAM_Y, 25, -Math.PI / 2, -Math.PI / 2 + thetaRad, thetaRad < 0);
  ctx.stroke();
  ctx.restore();

  // Beam after analyser (intensity I = cos²θ)
  const beamBright = Math.max(0.04, I);
  ctx.save();
  ctx.strokeStyle = `rgba(52,211,153,${beamBright * 0.9})`; ctx.lineWidth = Math.max(2, 14 * beamBright);
  ctx.beginPath(); ctx.moveTo(P2X, BEAM_Y); ctx.lineTo(W - 60, BEAM_Y); ctx.stroke();
  ctx.restore();

  // Screen
  ctx.save();
  ctx.fillStyle = `rgba(52,211,153,${beamBright * 0.95})`;
  ctx.fillRect(W - 68, BEAM_Y - 55, 8, 110);
  ctx.restore();
  txt(ctx, "Screen", W - 80, BEAM_Y + 72, "#94a3b8", 10);
  txt(ctx, `I = ${I.toFixed(3)} I₀`, W - 80, BEAM_Y - 66, "#34d399", 11, true);

  // Graph panel
  const GX = 80, GY = H - 90, GW = 180, GH = 65;
  ctx.save();
  ctx.fillStyle = "rgba(15,23,42,0.7)";
  ctx.fillRect(GX, GY, GW, GH);
  ctx.strokeStyle = "rgba(99,102,241,0.4)"; ctx.lineWidth = 1;
  ctx.strokeRect(GX, GY, GW, GH);
  ctx.strokeStyle = "#94a3b8"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(GX + 10, GY + GH - 10); ctx.lineTo(GX + GW - 10, GY + GH - 10); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(GX + 10, GY + GH - 10); ctx.lineTo(GX + 10, GY + 5); ctx.stroke();
  txt(ctx, "θ →", GX + GW - 20, GY + GH - 2, "#94a3b8", 9);
  txt(ctx, "I", GX + 2, GY + 10, "#94a3b8", 9);
  ctx.strokeStyle = "#34d399"; ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let deg = 0; deg <= 90; deg++) {
    const xp = GX + 10 + deg * (GW - 20) / 90;
    const yp = GY + GH - 10 - (GH - 15) * Math.cos((deg * Math.PI) / 180) ** 2;
    deg === 0 ? ctx.moveTo(xp, yp) : ctx.lineTo(xp, yp);
  }
  ctx.stroke();
  // Current θ marker
  const mx = GX + 10 + theta * (GW - 20) / 90;
  dot(ctx, mx, GY + GH - 10 - (GH - 15) * I, 4, "#fbbf24");
  ctx.restore();

  infoPanel(ctx, [
    "Malus's Law",
    "I = I₀ cos²θ",
    `θ = ${theta}°  (analyser angle)`,
    `I = ${I.toFixed(3)} × I₀`,
    theta === 0 ? "θ=0: maximum transmission" :
      theta === 90 ? "θ=90°: No light (crossed)" :
        "Adjust θ slider to explore",
  ]);
}

// 8. Brewster's Law
function renderBrewsterLaw(ctx: CanvasRenderingContext2D, n: number) {
  bg(ctx);
  const thetaB = Math.atan(n) * 180 / Math.PI;
  const thetaBr = thetaB * Math.PI / 180;

  const IX = 200, IY = CY; // interface point

  // Interface
  ctx.save();
  ctx.strokeStyle = "#334155"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, IY); ctx.lineTo(W, IY); ctx.stroke();
  ctx.fillStyle = "rgba(14,165,233,0.08)";
  ctx.fillRect(0, IY, W, H - IY);
  ctx.restore();
  txt(ctx, "Air (n₁=1.0)", 10, IY - 12, "#94a3b8", 10);
  txt(ctx, `Glass (n₂=${n.toFixed(2)})`, 10, IY + 18, "#60a5fa", 10);

  // Incident ray
  const incLen = 160;
  const incX = IX - incLen * Math.sin(thetaBr);
  const incY = IY - incLen * Math.cos(thetaBr);
  ctx.save();
  ctx.strokeStyle = "rgba(255,200,80,0.85)"; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(incX, incY); ctx.lineTo(IX, IY); ctx.stroke();
  // arrowhead
  const ang1 = Math.atan2(IY - incY, IX - incX);
  ctx.fillStyle = "rgba(255,200,80,0.85)";
  ctx.beginPath();
  ctx.moveTo(IX, IY);
  ctx.lineTo(IX - 10 * Math.cos(ang1 - 0.3), IY - 10 * Math.sin(ang1 - 0.3));
  ctx.lineTo(IX - 10 * Math.cos(ang1 + 0.3), IY - 10 * Math.sin(ang1 + 0.3));
  ctx.closePath(); ctx.fill();
  ctx.restore();
  txt(ctx, "Incident", incX - 55, incY + 10, "#fbbf24", 10);

  // Normal
  ctx.save();
  ctx.strokeStyle = "rgba(148,163,184,0.4)"; ctx.lineWidth = 1; ctx.setLineDash([5, 4]);
  ctx.beginPath(); ctx.moveTo(IX, IY - 100); ctx.lineTo(IX, IY + 110); ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // Reflected ray (perpendicular to refracted → i + r = 90° at Brewster's angle)
  const refLen = 150;
  const refX = IX + refLen * Math.sin(thetaBr);
  const refY = IY - refLen * Math.cos(thetaBr);
  ctx.save();
  ctx.strokeStyle = "rgba(167,139,250,0.85)"; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(IX, IY); ctx.lineTo(refX, refY); ctx.stroke();
  const ang2 = Math.atan2(refY - IY, refX - IX);
  ctx.fillStyle = "rgba(167,139,250,0.85)";
  ctx.beginPath();
  ctx.moveTo(refX, refY);
  ctx.lineTo(refX - 10 * Math.cos(ang2 - 0.3), refY - 10 * Math.sin(ang2 - 0.3));
  ctx.lineTo(refX - 10 * Math.cos(ang2 + 0.3), refY - 10 * Math.sin(ang2 + 0.3));
  ctx.closePath(); ctx.fill();
  ctx.restore();
  txt(ctx, "Reflected (100%", refX + 4, refY + 4, "#a78bfa", 10);
  txt(ctx, "polarised ⊥)", refX + 4, refY + 17, "#a78bfa", 10);

  // Refracted ray
  const thetaR = Math.asin(Math.sin(thetaBr) / n);
  const rfrLen = 160;
  const rfrX = IX + rfrLen * Math.sin(thetaR);
  const rfrY = IY + rfrLen * Math.cos(thetaR);
  ctx.save();
  ctx.strokeStyle = "rgba(52,211,153,0.8)"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(IX, IY); ctx.lineTo(rfrX, rfrY); ctx.stroke();
  ctx.restore();
  txt(ctx, "Refracted", rfrX + 4, rfrY - 4, "#34d399", 10);
  txt(ctx, "(partially polarised)", rfrX + 4, rfrY + 10, "#34d399", 9);

  // 90° angle between reflected and refracted
  ctx.save();
  ctx.strokeStyle = "rgba(251,191,36,0.5)"; ctx.lineWidth = 1;
  const angBetween = (Math.PI / 2 - thetaR) - thetaBr;
  txt(ctx, "90°", IX + 14, IY + 14, "#fbbf24", 11, true);
  ctx.restore();

  // θB arc
  ctx.save();
  ctx.strokeStyle = "#fbbf24"; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(IX, IY, 38, -Math.PI / 2, -Math.PI / 2 + thetaBr); ctx.stroke();
  txt(ctx, `θ_B=${thetaB.toFixed(1)}°`, IX - 5, IY - 46, "#fbbf24", 10, true);
  ctx.restore();

  infoPanel(ctx, [
    "Brewster's Law",
    `n₂ = ${n.toFixed(2)}  (glass)`,
    `tan θ_B = n₂/n₁ = ${n.toFixed(2)}`,
    `θ_B = ${thetaB.toFixed(1)}°`,
    "Reflected ray: fully polarised ⊥",
    "Reflected ⊥ Refracted at θ_B",
  ]);
}

// 9. Resolving Power — Rayleigh Criterion
function renderResolvingPower(ctx: CanvasRenderingContext2D, separation: number) {
  bg(ctx);
  const lambda = 550; // nm
  const aperture = 5; // mm
  const rayleighAngle = (1.22 * lambda * 1e-9) / (aperture * 1e-3);
  const isResolved = separation >= 100;
  const isJust = separation >= 70 && separation < 100;

  const spotY = CY - 50; // y-centre for spot display
  const cx1 = CX - separation * 0.9;
  const cx2 = CX + separation * 0.9;
  const spotRadius = 55;

  // Draw two Airy-disk-like glowing spots using radial gradients
  for (const [cx, innerCol, outerCol] of [
    [cx1, "rgba(251,191,36,0.95)", "rgba(251,191,36,0)"],
    [cx2, "rgba(96,165,250,0.95)",  "rgba(96,165,250,0)"],
  ] as [number, string, string][]) {
    const grad = ctx.createRadialGradient(cx, spotY, 0, cx, spotY, spotRadius);
    grad.addColorStop(0,    innerCol);
    grad.addColorStop(0.18, innerCol.replace("0.95)", "0.6)"));
    grad.addColorStop(0.35, outerCol.replace("0)", "0.15)"));
    grad.addColorStop(0.55, innerCol.replace("0.95)", "0.05)"));
    grad.addColorStop(1,    outerCol);
    ctx.save();
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, spotY, spotRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Status label above spots
  const statusCol = isResolved ? "#22c55e" : isJust ? "#fbbf24" : "#f87171";
  txt(ctx, isResolved ? "CLEARLY RESOLVED ✓" : isJust ? "JUST RESOLVED (Rayleigh limit)" : "NOT RESOLVED ✗",
    CX - 90, spotY - 68, statusCol, 11, true);

  // 1D Intensity profile (lower half)
  const profY0 = CY + 20;
  const profH  = H - profY0 - 18;
  ctx.save();
  ctx.fillStyle = "rgba(15,23,42,0.8)";
  ctx.fillRect(50, profY0, W - 100, profH);
  ctx.strokeStyle = "rgba(99,102,241,0.35)"; ctx.lineWidth = 1;
  ctx.strokeRect(50, profY0, W - 100, profH);
  ctx.restore();
  txt(ctx, "1D Intensity Profile", 58, profY0 + 12, "#94a3b8", 9);

  const sigma = Math.max(8, 50 - separation * 0.3);
  ctx.save();
  ctx.strokeStyle = statusCol; ctx.lineWidth = 2;
  ctx.beginPath();
  for (let px = 52; px < W - 52; px++) {
    const g1 = Math.exp(-((px - cx1) ** 2) / (2 * sigma ** 2));
    const g2 = Math.exp(-((px - cx2) ** 2) / (2 * sigma ** 2));
    const I  = Math.min(1, g1 + g2);
    const y  = profY0 + profH - 10 - I * (profH - 20);
    px === 52 ? ctx.moveTo(px, y) : ctx.lineTo(px, y);
  }
  ctx.stroke();
  ctx.restore();

  // Dip marker between peaks (shows resolution dip)
  const midI = 2 * Math.exp(-((cx2 - cx1) ** 2) / (8 * sigma ** 2));
  const dipY  = profY0 + profH - 10 - Math.min(1, midI) * (profH - 20);
  if (separation > 10) {
    dot(ctx, CX, dipY, 4, statusCol);
    txt(ctx, isResolved ? "dip ✓" : "no dip ✗", CX + 6, dipY - 6, statusCol, 9);
  }

  infoPanel(ctx, [
    "Resolving Power (Rayleigh Criterion)",
    `λ = ${lambda} nm   Aperture D = ${aperture} mm`,
    `θ_min = 1.22λ/D`,
    `= ${(rayleighAngle * 1e5).toFixed(2)} × 10⁻⁵ rad`,
    separation < 70 ? "Sources NOT resolved — increase sep." :
      separation < 100 ? "JUST resolved at Rayleigh limit" : "Sources clearly resolved",
    "Use slider to move sources apart",
  ]);
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function WaveOpticsEngine({ mode = "huygens-plane", onContextChange, ...params }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const tRef = useRef(0);

  // Slider states
  const [lambda, setLambda] = useState(params.lambda ?? 550);
  const [slitD, setSlitD] = useState(params.slitD ?? 0.5);
  const [screenD, setScreenD] = useState(params.screenD ?? 1000);
  const [theta, setTheta] = useState(params.theta ?? 0);
  const [n, setN] = useState(params.n ?? 1.5);
  // slitWidth in μm (e.g. 5 = 5 μm = 5000 nm)
  const [slitWidth, setSlitWidth] = useState(params.slitWidth ?? 5);
  const [separation, setSeparation] = useState(params.separation ?? 50);

  const animated = ["huygens-plane", "huygens-point", "coherent-sources", "ydse-setup", "ydse-path-diff"];

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const t = tRef.current;

    switch (mode) {
      case "huygens-plane":
      case "huygens-point":
        renderHuygens(ctx, t, mode);
        break;
      case "coherent-sources":
        renderCoherentSources(ctx, t);
        break;
      case "ydse-setup":
        renderYDSESetup(ctx, t, { d: slitD, D: screenD });
        break;
      case "ydse-fringes":
      case "ydse-white-light":
        renderYDSEFringes(ctx, lambda, slitD, screenD, mode);
        break;
      case "ydse-path-diff":
        renderYDSEPathDiff(ctx, t);
        break;
      case "single-slit":
        renderSingleSlit(ctx, slitWidth, lambda);
        break;
      case "malus-law":
        renderMalusLaw(ctx, theta);
        break;
      case "brewster-law":
        renderBrewsterLaw(ctx, n);
        break;
      case "resolving-power":
        renderResolvingPower(ctx, separation);
        break;
      default:
        bg(ctx);
        txt(ctx, `Mode: ${mode}`, 20, 30, "#94a3b8", 14);
    }

    tRef.current += 0.016;
  }, [mode, lambda, slitD, screenD, theta, n, slitWidth, separation]);

  useEffect(() => {
    if (animated.includes(mode)) {
      const loop = () => {
        draw();
        frameRef.current = requestAnimationFrame(loop);
      };
      frameRef.current = requestAnimationFrame(loop);
      return () => cancelAnimationFrame(frameRef.current);
    } else {
      draw();
    }
  }, [draw, mode]);

  useEffect(() => {
    if (onContextChange) {
      const contexts: Record<string, string> = {
        "huygens-plane": "Huygens' principle: every point on a plane wavefront acts as a source of secondary spherical wavelets; their tangential envelope gives the next wavefront.",
        "huygens-point": "Spherical wavefronts expand from a point source. Each wavefront point becomes a secondary source — Huygens' construction explains how light propagates.",
        "coherent-sources": "Interference needs two coherent sources with a constant phase difference. YDSE splits one source into two to achieve coherence.",
        "ydse-setup": "Young's Double Slit: two slits S1 and S2 separated by d, screen at distance D. Path difference Δ = dy/D determines bright/dark fringes.",
        "ydse-fringes": `YDSE fringe pattern: λ=${lambda}nm, d=${slitD}mm, D=${screenD}mm. Fringe width β = λD/d = ${((lambda * 1e-6 * screenD) / slitD).toFixed(3)} mm.`,
        "ydse-path-diff": "P is bright when Δ = nλ and dark when Δ = (2n−1)λ/2. The animated point shows how path difference changes across the screen.",
        "ydse-white-light": "White light YDSE: central fringe is white (all wavelengths constructive). Outer fringes are coloured — blue closer, red farther.",
        "single-slit": `Single slit diffraction: I = I₀(sinα/α)², α = πa sinθ/λ. Slit width a=${slitWidth.toFixed(1)}μm, λ=${lambda}nm. 1st minimum at sinθ = λ/a = ${(lambda * 1e-9 / (slitWidth * 1e-6)).toFixed(3)}.`,
        "malus-law": `Malus's Law: I = I₀ cos²θ. Analyser at ${theta}°, transmitted intensity = ${(Math.cos((theta * Math.PI) / 180) ** 2).toFixed(3)} I₀.`,
        "brewster-law": `Brewster's Law for glass (n=${n.toFixed(2)}): θ_B = arctan(n) = ${(Math.atan(n) * 180 / Math.PI).toFixed(1)}°. Reflected ray is fully polarised perpendicular to plane of incidence.`,
        "resolving-power": "Rayleigh criterion: two point objects are just resolved when central maximum of one coincides with first minimum of the other. θ_min = 1.22λ/D.",
      };
      onContextChange(contexts[mode] ?? `Wave Optics simulation: ${mode}`);
    }
  }, [mode, lambda, slitD, screenD, theta, n, slitWidth, separation, onContextChange]);

  const showLambda = ["ydse-fringes", "single-slit"].includes(mode);
  const showSlitD = ["ydse-setup", "ydse-fringes"].includes(mode);
  const showScreenD = ["ydse-setup", "ydse-fringes"].includes(mode);
  const showTheta = mode === "malus-law";
  const showN = mode === "brewster-law";
  const showSlitWidth = mode === "single-slit";
  const showSep = mode === "resolving-power";

  return (
    <div className="flex flex-col items-center gap-3">
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="rounded-xl border border-white/10 shadow-2xl"
        style={{ maxWidth: "100%", background: "#050d1a" }}
      />

      {/* Controls */}
      {(showLambda || showSlitD || showScreenD || showTheta || showN || showSlitWidth || showSep) && (
        <div className="flex flex-wrap gap-5 justify-center bg-slate-900/70 border border-white/10 rounded-xl px-6 py-3">
          {showLambda && (
            <label className="flex flex-col items-center gap-1">
              <span className="text-xs text-slate-400">λ (Wavelength)</span>
              <input type="range" min={400} max={700} step={5} value={lambda}
                onChange={e => setLambda(+e.target.value)} className="w-32 accent-purple-500" />
              <span className="text-xs font-mono" style={{ color: wavelengthToRGB(lambda) }}>
                {lambda} nm
              </span>
            </label>
          )}
          {showSlitD && (
            <label className="flex flex-col items-center gap-1">
              <span className="text-xs text-slate-400">d (slit sep)</span>
              <input type="range" min={0.2} max={2.0} step={0.1} value={slitD}
                onChange={e => setSlitD(+e.target.value)} className="w-32 accent-blue-500" />
              <span className="text-xs font-mono text-blue-400">{slitD.toFixed(1)} mm</span>
            </label>
          )}
          {showScreenD && (
            <label className="flex flex-col items-center gap-1">
              <span className="text-xs text-slate-400">D (screen dist)</span>
              <input type="range" min={500} max={2000} step={100} value={screenD}
                onChange={e => setScreenD(+e.target.value)} className="w-32 accent-green-500" />
              <span className="text-xs font-mono text-green-400">{screenD} mm</span>
            </label>
          )}
          {showTheta && (
            <label className="flex flex-col items-center gap-1">
              <span className="text-xs text-slate-400">θ (analyser angle)</span>
              <input type="range" min={0} max={90} step={1} value={theta}
                onChange={e => setTheta(+e.target.value)} className="w-32 accent-emerald-500" />
              <span className="text-xs font-mono text-emerald-400">{theta}°</span>
            </label>
          )}
          {showN && (
            <label className="flex flex-col items-center gap-1">
              <span className="text-xs text-slate-400">n (refractive index)</span>
              <input type="range" min={1.3} max={2.4} step={0.05} value={n}
                onChange={e => setN(+e.target.value)} className="w-32 accent-amber-500" />
              <span className="text-xs font-mono text-amber-400">{n.toFixed(2)}</span>
            </label>
          )}
          {showSlitWidth && (
            <label className="flex flex-col items-center gap-1">
              <span className="text-xs text-slate-400">a (slit width)</span>
              <input type="range" min={1} max={10} step={0.5}
                value={slitWidth}
                onChange={e => setSlitWidth(+e.target.value)}
                className="w-32 accent-sky-500" />
              <span className="text-xs font-mono text-sky-400">{slitWidth.toFixed(1)} μm</span>
            </label>
          )}
          {showSep && (
            <label className="flex flex-col items-center gap-1">
              <span className="text-xs text-slate-400">Source separation</span>
              <input type="range" min={10} max={120} step={5} value={separation}
                onChange={e => setSeparation(+e.target.value)} className="w-32 accent-yellow-500" />
              <span className="text-xs font-mono text-yellow-400">{separation} units</span>
            </label>
          )}
        </div>
      )}
    </div>
  );
}
