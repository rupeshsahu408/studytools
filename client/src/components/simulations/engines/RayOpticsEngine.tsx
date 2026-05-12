import { useState, useEffect, useRef, useCallback } from "react";

const W = 720, H = 420, CX = W / 2, CY = H / 2;

interface Props {
  mode?: string;
  onContextChange?: (ctx: string) => void;
  [key: string]: any;
}

// ─── Canvas Helpers ───────────────────────────────────────────────────────────

function bg(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#050d1a";
  ctx.fillRect(0, 0, W, H);
}

function principalAxis(ctx: CanvasRenderingContext2D, x1 = 0, x2 = W) {
  ctx.save();
  ctx.strokeStyle = "rgba(148,163,184,0.35)";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([8, 5]);
  ctx.beginPath(); ctx.moveTo(x1, CY); ctx.lineTo(x2, CY); ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

function arrowLine(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number, x2: number, y2: number,
  color: string, lw = 2.5, dashed = false
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lw;
  if (dashed) ctx.setLineDash([5, 4]);
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  ctx.setLineDash([]);
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const hs = 9;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - hs * Math.cos(ang - 0.35), y2 - hs * Math.sin(ang - 0.35));
  ctx.lineTo(x2 - hs * Math.cos(ang + 0.35), y2 - hs * Math.sin(ang + 0.35));
  ctx.closePath(); ctx.fill();
  ctx.restore();
}

function dashedLine(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number, x2: number, y2: number,
  color: string, dash: number[] = [6, 4]
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.setLineDash(dash);
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

function dot(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function txt(
  ctx: CanvasRenderingContext2D,
  text: string, x: number, y: number,
  color = "#cbd5e1", size = 11, bold = false
) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = `${bold ? "bold " : ""}${size}px sans-serif`;
  ctx.fillText(text, x, y);
  ctx.restore();
}

function infoPanel(
  ctx: CanvasRenderingContext2D,
  lines: string[], x: number, y: number, w = 220
) {
  const lineH = 17;
  const h = lines.length * lineH + 14;
  ctx.save();
  ctx.fillStyle = "rgba(2,10,25,0.88)";
  ctx.strokeStyle = "rgba(56,189,248,0.22)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  (ctx as any).roundRect(x, y, w, h, 7);
  ctx.fill(); ctx.stroke();
  lines.forEach((line, i) => {
    const isHeader = i === 0;
    ctx.fillStyle = isHeader ? "#38bdf8" : "#94a3b8";
    ctx.font = `${isHeader ? "bold " : ""}11px sans-serif`;
    ctx.fillText(line, x + 8, y + 13 + i * lineH);
  });
  ctx.restore();
}

function objectArr(ctx: CanvasRenderingContext2D, x: number, h: number, label = "Object") {
  ctx.save();
  ctx.strokeStyle = "#f97316"; ctx.fillStyle = "#f97316"; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(x, CY); ctx.lineTo(x, CY - h); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, CY - h);
  ctx.lineTo(x - 7, CY - h + 13); ctx.lineTo(x + 7, CY - h + 13);
  ctx.closePath(); ctx.fill();
  txt(ctx, label, x + 5, CY - h - 4, "#f97316", 10, true);
  ctx.restore();
}

function imageArr(ctx: CanvasRenderingContext2D, x: number, h: number, real: boolean) {
  const color = real ? "#22c55e" : "#a78bfa";
  ctx.save();
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 2.5;
  if (!real) ctx.setLineDash([5, 4]);
  ctx.beginPath(); ctx.moveTo(x, CY); ctx.lineTo(x, CY - h); ctx.stroke();
  ctx.setLineDash([]);
  const dir = h > 0 ? 1 : -1;
  ctx.beginPath();
  ctx.moveTo(x, CY - h);
  ctx.lineTo(x - 6, CY - h + dir * 12);
  ctx.lineTo(x + 6, CY - h + dir * 12);
  ctx.closePath(); ctx.fill();
  ctx.restore();
}

function lensShape(
  ctx: CanvasRenderingContext2D,
  lx: number, lh: number, converging: boolean, color: string
) {
  ctx.save();
  ctx.strokeStyle = color; ctx.lineWidth = 3;
  const bx = converging ? 28 : -26;
  ctx.beginPath();
  ctx.moveTo(lx, CY - lh / 2);
  ctx.bezierCurveTo(lx + bx, CY - lh / 4, lx + bx, CY + lh / 4, lx, CY + lh / 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(lx, CY - lh / 2);
  ctx.bezierCurveTo(lx - bx, CY - lh / 4, lx - bx, CY + lh / 4, lx, CY + lh / 2);
  ctx.stroke();
  // arrowhead tips
  ctx.fillStyle = color;
  const tipDir = converging ? -1 : 1;
  [CY - lh / 2, CY + lh / 2].forEach((ty, ti) => {
    const d = ti === 0 ? 1 : -1;
    ctx.beginPath();
    ctx.moveTo(lx, ty);
    ctx.lineTo(lx - 6, ty + d * tipDir * 12);
    ctx.lineTo(lx + 6, ty + d * tipDir * 12);
    ctx.closePath(); ctx.fill();
  });
  ctx.restore();
}

// ─── Mode Renderers ───────────────────────────────────────────────────────────

function renderPlaneMirror(ctx: CanvasRenderingContext2D, angle: number) {
  bg(ctx);
  const MX = CX + 100;
  // Mirror
  ctx.save();
  ctx.strokeStyle = "#38bdf8"; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(MX, 55); ctx.lineTo(MX, H - 55); ctx.stroke();
  ctx.strokeStyle = "rgba(56,189,248,0.28)"; ctx.lineWidth = 2;
  for (let y = 55; y < H - 55; y += 16) {
    ctx.beginPath(); ctx.moveTo(MX, y); ctx.lineTo(MX + 14, y + 14); ctx.stroke();
  }
  ctx.restore();
  txt(ctx, "Plane Mirror", MX + 8, 45, "#38bdf8", 12, true);
  // Normal
  dashedLine(ctx, MX - 90, CY, MX + 90, CY, "#64748b");
  txt(ctx, "Normal", MX + 92, CY + 4, "#64748b", 10);
  // Rays
  const rad = (angle * Math.PI) / 180;
  const len = 200;
  const ix = MX - len * Math.cos(rad), iy = CY - len * Math.sin(rad);
  arrowLine(ctx, ix, iy, MX, CY, "#fbbf24");
  txt(ctx, "Incident ray", ix - 15, iy - 10, "#fbbf24", 10);
  arrowLine(ctx, MX, CY, MX - len * Math.cos(rad), CY + len * Math.sin(rad), "#34d399");
  txt(ctx, "Reflected ray", MX - len * Math.cos(rad) - 45, CY + len * Math.sin(rad) + 15, "#34d399", 10);
  // Angle arcs
  if (angle > 3) {
    ctx.save();
    ctx.strokeStyle = "#fbbf24"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(MX, CY, 44, Math.PI - rad, Math.PI, false); ctx.stroke();
    ctx.strokeStyle = "#34d399";
    ctx.beginPath(); ctx.arc(MX, CY, 44, 0, rad, false); ctx.stroke();
    ctx.restore();
    txt(ctx, `∠i = ${angle}°`, MX - 110, CY - 18, "#fbbf24", 12, true);
    txt(ctx, `∠r = ${angle}°`, MX - 110, CY + 28, "#34d399", 12, true);
  }
  infoPanel(ctx, [
    "Plane Mirror — Laws of Reflection",
    `∠i = ∠r = ${angle}°`,
    "Incident, Reflected & Normal are coplanar",
    "Image: Virtual, Erect, Same size",
    "Image distance = Object distance",
  ], 10, 10, 250);
}

function renderSphericalMirror(
  ctx: CanvasRenderingContext2D,
  concave: boolean, fPx: number, uPx: number
) {
  bg(ctx);
  principalAxis();
  const POLE = CX + 130;
  const fAbs = Math.abs(fPx);

  // Draw mirror arc
  const arcR = 200;
  ctx.save();
  ctx.strokeStyle = "#38bdf8"; ctx.lineWidth = 3.5;
  ctx.beginPath();
  if (concave) {
    ctx.arc(POLE - arcR, CY, arcR, -0.42, 0.42, false);
  } else {
    ctx.arc(POLE + arcR, CY, arcR, Math.PI - 0.42, Math.PI + 0.42, false);
  }
  ctx.stroke();
  // Hatching
  ctx.strokeStyle = "rgba(56,189,248,0.25)"; ctx.lineWidth = 1.5;
  for (let a = -0.35; a <= 0.35; a += 0.1) {
    const sa = Math.sin(a), ca = Math.cos(a);
    if (concave) {
      ctx.beginPath();
      ctx.moveTo(POLE - arcR + arcR * ca, CY + arcR * sa);
      ctx.lineTo(POLE - arcR + arcR * ca + 15, CY + arcR * sa + 15);
      ctx.stroke();
    }
  }
  ctx.restore();
  txt(ctx, concave ? "Concave Mirror" : "Convex Mirror", POLE - 20, 28, "#38bdf8", 12, true);

  // Key points
  const F_X = concave ? POLE - fAbs : POLE + fAbs; // focus: in front of concave, behind convex
  const C_X = concave ? POLE - 2 * fAbs : POLE + 2 * fAbs;

  dot(ctx, POLE, CY, 4, "#94a3b8"); txt(ctx, "P", POLE + 4, CY - 8, "#94a3b8", 11);
  if (concave) {
    dot(ctx, F_X, CY, 5, "#f59e0b"); txt(ctx, "F", F_X - 12, CY - 10, "#f59e0b", 12, true);
    if (C_X > 30) { dot(ctx, C_X, CY, 5, "#a78bfa"); txt(ctx, "C", C_X - 12, CY - 10, "#a78bfa", 12, true); }
  } else {
    dot(ctx, F_X, CY, 5, "#f59e0b"); txt(ctx, "F (virtual)", F_X + 4, CY - 10, "#f59e0b", 11);
  }

  // Object (to the left of mirror)
  const objX = POLE - uPx;
  const OBJ_H = 60;
  if (objX > 10 && objX < POLE - 8) {
    objectArr(ctx, objX, OBJ_H);
  }

  // Image calc: using |u|, |f| with sign convention simplified
  const fm = concave ? -fAbs : fAbs;
  const um = -uPx; // real object always negative
  const vm = 1 / (1 / fm - 1 / um);
  const m = -vm / um; // mirror magnification: m = -v/u
  const imgH = m * OBJ_H; // m < 0 → inverted; m > 0 → erect

  // Image canvas position
  const imgX = POLE + vm; // vm negative → left of pole (real), positive → right (virtual)
  const isReal = concave ? vm < 0 : false;

  if (Math.abs(vm) < 450 && isFinite(vm) && Math.abs(uPx - fAbs) > 5) {
    if (imgX > 10 && imgX < W - 10) {
      // For real image: draw normally. For virtual (concave virtual / convex): dashed
      imageArr(ctx, imgX, imgH, isReal);
      const lbl = isReal ? "Real Image" : "Virtual Image";
      txt(ctx, lbl, imgX + 4, CY - Math.abs(imgH) - 8, isReal ? "#22c55e" : "#a78bfa", 10);
    }
  }

  const magVal = isFinite(m) ? m.toFixed(2) : "∞";
  const vDisp = isFinite(vm) ? vm.toFixed(0) : "∞";
  infoPanel(ctx, [
    `${concave ? "Concave" : "Convex"} Mirror`,
    `f = ${concave ? "−" : "+"}${fAbs} px  |  u = −${uPx} px`,
    `v = ${vDisp} px`,
    `m = v/u = ${magVal}`,
    `Image: ${isReal ? "Real, Inverted" : "Virtual, Erect"}`,
    "Formula: 1/v + 1/u = 1/f",
  ], 10, 10, 230);
}

function renderSnellLaw(
  ctx: CanvasRenderingContext2D,
  n1: number, n2: number, iDeg: number
) {
  bg(ctx);
  const SY = CY;
  ctx.fillStyle = "rgba(56,189,248,0.07)";
  ctx.fillRect(0, 0, W, SY);
  ctx.fillStyle = "rgba(99,102,241,0.09)";
  ctx.fillRect(0, SY, W, H - SY);
  ctx.save(); ctx.strokeStyle = "rgba(148,163,184,0.55)"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, SY); ctx.lineTo(W, SY); ctx.stroke(); ctx.restore();
  txt(ctx, `n₁ = ${n1.toFixed(2)} (${n1 < 1.1 ? "Air" : n1 < 1.4 ? "Water" : "Glass"})`, 12, 22, "#38bdf8", 12, true);
  txt(ctx, `n₂ = ${n2.toFixed(2)} (${n2 < 1.1 ? "Air" : n2 < 1.4 ? "Water" : n2 < 2 ? "Glass" : "Diamond"})`, 12, SY + 22, "#818cf8", 12, true);
  // Normal
  dashedLine(ctx, CX, SY - 110, CX, SY + 110, "#64748b");
  txt(ctx, "Normal", CX + 5, SY - 112, "#64748b", 10);
  const iRad = (iDeg * Math.PI) / 180;
  const sinR = (n1 * Math.sin(iRad)) / n2;
  const rayLen = 160;
  // Incident
  arrowLine(ctx, CX - rayLen * Math.sin(iRad), SY - rayLen * Math.cos(iRad), CX, SY, "#fbbf24");
  txt(ctx, "Incident", CX - rayLen * Math.sin(iRad) - 55, SY - rayLen * Math.cos(iRad) + 10, "#fbbf24", 10);
  // Angle arcs
  if (iDeg > 3) {
    ctx.save(); ctx.strokeStyle = "#fbbf24"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(CX, SY, 48, -Math.PI / 2, -Math.PI / 2 + iRad, false); ctx.stroke();
    ctx.restore();
    txt(ctx, `θ₁=${iDeg}°`, CX - 80, SY - 28, "#fbbf24", 12, true);
  }
  if (sinR <= 1) {
    const rRad = Math.asin(sinR);
    const rDeg = Math.round(rRad * 180 / Math.PI);
    arrowLine(ctx, CX, SY, CX + rayLen * Math.sin(rRad), SY + rayLen * Math.cos(rRad), "#34d399");
    txt(ctx, "Refracted", CX + rayLen * Math.sin(rRad) + 5, SY + rayLen * Math.cos(rRad) - 8, "#34d399", 10);
    if (rDeg > 3) {
      ctx.save(); ctx.strokeStyle = "#34d399"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(CX, SY, 48, Math.PI / 2 - rRad, Math.PI / 2, false); ctx.stroke();
      ctx.restore();
      txt(ctx, `θ₂=${rDeg}°`, CX + 20, SY + 32, "#34d399", 12, true);
    }
    infoPanel(ctx, [
      "Snell's Law: n₁ sinθ₁ = n₂ sinθ₂",
      `${n1.toFixed(2)} × sin${iDeg}° = ${n2.toFixed(2)} × sin${rDeg}°`,
      `θ₁ = ${iDeg}°  →  θ₂ = ${rDeg}°`,
      n1 < n2 ? "Denser medium → bends toward normal" : "Rarer medium → bends away from normal",
    ], 10, SY + 65, 310);
  } else {
    txt(ctx, "⚠ TIR! sinθ₂ > 1 — refraction impossible", CX - 160, SY + 40, "#ef4444", 12, true);
    // Reflected ray
    arrowLine(ctx, CX, SY, CX + rayLen * Math.sin(iRad), SY - rayLen * Math.cos(iRad), "#ef4444");
    txt(ctx, "TIR Reflected", CX + rayLen * Math.sin(iRad) + 5, SY - rayLen * Math.cos(iRad) + 10, "#ef4444", 10);
  }
}

function renderTIR(
  ctx: CanvasRenderingContext2D,
  n1: number, iDeg: number
) {
  bg(ctx);
  const SY = 190, n2 = 1.0;
  ctx.fillStyle = "rgba(56,189,248,0.11)";
  ctx.fillRect(0, SY, W, H - SY);
  ctx.save(); ctx.strokeStyle = "rgba(148,163,184,0.6)"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, SY); ctx.lineTo(W, SY); ctx.stroke(); ctx.restore();
  txt(ctx, `Dense medium n₁ = ${n1.toFixed(2)}`, 12, SY + 22, "#38bdf8", 12, true);
  txt(ctx, `Rare medium n₂ = ${n2.toFixed(2)} (Air)`, 12, SY - 30, "#94a3b8", 11);
  const critDeg = Math.asin(n2 / n1) * 180 / Math.PI;
  const iRad = (iDeg * Math.PI) / 180;
  const rayLen = 150;
  dashedLine(ctx, CX, SY - 100, CX, SY + 100, "#64748b");
  // Incident from below
  arrowLine(ctx, CX - rayLen * Math.sin(iRad), SY + rayLen * Math.cos(iRad), CX, SY, "#fbbf24");
  // Angle arc
  ctx.save(); ctx.strokeStyle = "#fbbf24"; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(CX, SY, 46, Math.PI / 2 - iRad, Math.PI / 2, false); ctx.stroke();
  ctx.restore();
  txt(ctx, `θ=${iDeg}°`, CX - 80, SY + 32, "#fbbf24", 12, true);
  // Critical angle reference line
  const cRad = (critDeg * Math.PI) / 180;
  dashedLine(ctx, CX - rayLen * Math.sin(cRad), SY + rayLen * Math.cos(cRad), CX, SY, "#ef4444", [4, 4]);
  txt(ctx, `θc=${critDeg.toFixed(1)}°`, CX - rayLen * Math.sin(cRad) - 65, SY + rayLen * Math.cos(cRad) + 12, "#ef4444", 10);

  if (iDeg < critDeg - 0.5) {
    const sinR = (n1 * Math.sin(iRad)) / n2;
    const rRad = Math.asin(Math.min(sinR, 1));
    arrowLine(ctx, CX, SY, CX + rayLen * Math.sin(rRad), SY - rayLen * Math.cos(rRad), "#34d399");
    txt(ctx, "Refracted (exits)", CX + 5, SY - 80, "#34d399", 10);
    ctx.save(); ctx.globalAlpha = 0.35;
    arrowLine(ctx, CX, SY, CX + rayLen * Math.sin(iRad), SY + rayLen * Math.cos(iRad), "#94a3b8");
    ctx.restore();
    infoPanel(ctx, [
      `θ = ${iDeg}° < θc = ${critDeg.toFixed(1)}°`,
      "Partial refraction + partial reflection",
      "Some light escapes the medium",
    ], W - 260, 10, 250);
  } else if (iDeg > critDeg + 0.5) {
    ctx.save();
    ctx.shadowColor = "#f97316"; ctx.shadowBlur = 20;
    arrowLine(ctx, CX, SY, CX + rayLen * Math.sin(iRad), SY + rayLen * Math.cos(iRad), "#f97316", 3);
    ctx.restore();
    txt(ctx, "TOTAL INTERNAL REFLECTION!", CX + 10, SY + 60, "#f97316", 12, true);
    infoPanel(ctx, [
      `θ = ${iDeg}° > θc = ${critDeg.toFixed(1)}°`,
      "TOTAL INTERNAL REFLECTION",
      "No refracted ray — 100% reflected",
      "sin(θc) = n₂/n₁",
    ], W - 260, 10, 250);
  } else {
    arrowLine(ctx, CX, SY, W - 20, SY, "#ef4444", 2.5);
    txt(ctx, "θ = θc → Refracted ray grazes surface (90°)", CX + 5, SY - 18, "#ef4444", 11, true);
    infoPanel(ctx, [
      `θ = θc = ${critDeg.toFixed(1)}°`,
      "Critical angle condition",
      "Refracted ray along surface (θ₂=90°)",
      `sin(θc) = n₂/n₁ = ${(n2/n1).toFixed(3)}`,
    ], W - 260, 10, 250);
  }
}

function renderOpticalFiber(ctx: CanvasRenderingContext2D, t: number) {
  bg(ctx);
  const FY1 = CY - 38, FY2 = CY + 38;
  // Cladding
  ctx.fillStyle = "rgba(56,189,248,0.07)";
  ctx.fillRect(40, FY1 - 22, W - 80, 22);
  ctx.fillRect(40, FY2, W - 80, 22);
  txt(ctx, "Cladding  n₂ = 1.46 (less dense)", 50, FY1 - 6, "#38bdf8", 10);
  txt(ctx, "Cladding  n₂ = 1.46", 50, FY2 + 16, "#38bdf8", 10);
  // Core
  ctx.fillStyle = "rgba(56,189,248,0.18)";
  ctx.fillRect(40, FY1, W - 80, FY2 - FY1);
  txt(ctx, "Core  n₁ = 1.50  (denser — light travels here by TIR)", 80, CY + 5, "#22c55e", 11, true);
  ctx.save(); ctx.strokeStyle = "#38bdf8"; ctx.lineWidth = 2;
  ctx.strokeRect(40, FY1, W - 80, FY2 - FY1); ctx.restore();
  // Zigzag path
  ctx.save();
  ctx.strokeStyle = "#fbbf24"; ctx.lineWidth = 2.5;
  ctx.shadowColor = "#fbbf24"; ctx.shadowBlur = 8;
  ctx.beginPath();
  let rx = 40, ry = CY, dir = 1;
  ctx.moveTo(rx, ry);
  const step = 80;
  while (rx < W - 40) {
    const nx = Math.min(rx + step, W - 40);
    const ny = ry + dir * (FY2 - FY1) * 0.85;
    const clampY = Math.max(FY1 + 4, Math.min(FY2 - 4, ny));
    ctx.lineTo(nx, clampY);
    dir *= -1;
    rx = nx; ry = clampY;
  }
  ctx.stroke(); ctx.restore();
  // Animated pulse
  const px = 40 + ((t * 85) % (W - 80));
  const phase = (px - 40) / (W - 80);
  const py = CY + Math.sin(phase * Math.PI * 4) * (FY2 - FY1) * 0.42;
  ctx.save();
  ctx.fillStyle = "#fef08a"; ctx.shadowColor = "#fef08a"; ctx.shadowBlur = 18;
  ctx.beginPath(); ctx.arc(px, py, 6, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  // Entrance
  arrowLine(ctx, 5, CY, 42, CY, "#fbbf24");
  txt(ctx, "Light\nenters", 2, CY - 15, "#fbbf24", 10, true);
  infoPanel(ctx, [
    "Optical Fibre — Total Internal Reflection",
    "n₁(core) > n₂(cladding)",
    "θ > θc at every reflection → 100% TIR",
    "Light trapped inside core",
    "Used in: Internet cables, Endoscopy",
    "Signal loss < 0.1 dB/km in modern fibres",
  ], 10, H - 115, 310);
}

function renderGlassSlab(
  ctx: CanvasRenderingContext2D,
  n: number, thick: number, iDeg: number
) {
  bg(ctx);
  const SY1 = CY - thick / 2, SY2 = CY + thick / 2;
  const SX1 = 80, SX2 = W - 80;
  ctx.fillStyle = "rgba(56,189,248,0.12)";
  ctx.fillRect(SX1, SY1, SX2 - SX1, thick);
  ctx.save(); ctx.strokeStyle = "#38bdf8"; ctx.lineWidth = 2;
  ctx.strokeRect(SX1, SY1, SX2 - SX1, thick); ctx.restore();
  txt(ctx, `Glass Slab  n = ${n.toFixed(2)}`, SX1 + 10, (SY1 + SY2) / 2 + 4, "#38bdf8", 12, true);
  const iRad = (iDeg * Math.PI) / 180;
  const sinR = Math.sin(iRad) / n;
  const rRad = Math.asin(sinR);
  const rDeg = (rRad * 180 / Math.PI).toFixed(1);
  const entryX = CX - 80;
  // Incident ray
  arrowLine(ctx, entryX - 120 * Math.sin(iRad), SY1 - 120 * Math.cos(iRad), entryX, SY1, "#fbbf24");
  // Inside slab
  const exitX = entryX + (SY2 - SY1) * Math.tan(rRad);
  arrowLine(ctx, entryX, SY1, exitX, SY2, "#38bdf8");
  // Emergent (parallel to incident)
  arrowLine(ctx, exitX, SY2, exitX + 120 * Math.sin(iRad), SY2 + 120 * Math.cos(iRad), "#34d399");
  // Dashed extension of incident ray
  dashedLine(ctx, entryX, SY1, entryX + 240 * Math.sin(iRad), SY1 + 240 * Math.cos(iRad), "#fbbf24");
  // Lateral shift
  const d = thick * Math.sin(iRad - rRad) / Math.cos(rRad);
  // Normals at surfaces
  dashedLine(ctx, entryX, SY1 - 40, entryX, SY1 + 40, "#64748b");
  dashedLine(ctx, exitX, SY2 - 40, exitX, SY2 + 40, "#64748b");
  txt(ctx, `i = ${iDeg}°`, entryX - 70, SY1 - 20, "#fbbf24", 12, true);
  txt(ctx, `r = ${rDeg}°`, entryX + 15, SY1 + 30, "#38bdf8", 11, true);
  txt(ctx, "Emergent ∥ Incident", exitX + 10, SY2 + 60, "#34d399", 11);
  infoPanel(ctx, [
    "Glass Slab — Lateral Shift",
    `i = ${iDeg}°  |  r = ${rDeg}°`,
    `Lateral shift d = ${d.toFixed(1)} px`,
    "d = t · sin(i − r) / cos(r)",
    "Emergent ray is parallel to incident",
    "No angular deviation — only lateral shift",
  ], 10, 10, 270);
}

function renderApparentDepth(
  ctx: CanvasRenderingContext2D,
  n: number, realDepth: number
) {
  bg(ctx);
  const WY = 90;
  const BOTY = WY + realDepth;
  ctx.fillStyle = "rgba(56,189,248,0.14)";
  ctx.fillRect(50, WY, W - 100, realDepth);
  ctx.save(); ctx.strokeStyle = "#38bdf8"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(50, WY); ctx.lineTo(W - 50, WY); ctx.stroke(); ctx.restore();
  txt(ctx, `Water Surface  n = ${n.toFixed(2)}`, 60, WY - 10, "#38bdf8", 11, true);
  // Object
  ctx.save(); ctx.font = "30px serif"; ctx.fillText("🐟", CX - 40, BOTY); ctx.restore();
  txt(ctx, "Object (fish)", CX + 5, BOTY - 5, "#f97316", 11, true);
  // Rays from fish to surface
  const refX = CX + 60;
  dashedLine(ctx, CX, BOTY - 15, refX, WY, "#38bdf8");
  // Refracted ray continuing upward
  const eyeX = refX + 80, eyeY = WY - 80;
  arrowLine(ctx, refX, WY, eyeX, eyeY, "#34d399");
  ctx.save(); ctx.font = "20px serif"; ctx.fillText("👁", eyeX + 5, eyeY + 8); ctx.restore();
  // Apparent depth
  const appDepth = realDepth / n;
  const appY = WY + appDepth;
  dot(ctx, CX, appY, 6, "#a78bfa");
  dashedLine(ctx, CX, appY, refX + 20, appY, "#a78bfa");
  txt(ctx, `Apparent image (d=${appDepth.toFixed(0)}px)`, CX + 5, appY - 8, "#a78bfa", 11, true);
  // Depth lines
  dashedLine(ctx, CX - 60, WY, CX - 60, BOTY - 15, "#f97316");
  dashedLine(ctx, CX - 40, WY, CX - 40, appY, "#a78bfa");
  txt(ctx, `Real depth = ${realDepth}px`, CX - 155, (WY + BOTY) / 2, "#f97316", 10);
  txt(ctx, `App. depth = ${appDepth.toFixed(0)}px`, CX - 145, (WY + appY) / 2 - 20, "#a78bfa", 10);
  infoPanel(ctx, [
    "Apparent Depth",
    `n = ${n.toFixed(2)}  (denser medium)`,
    `Real depth = ${realDepth} px`,
    `Apparent depth = d/n = ${appDepth.toFixed(0)} px`,
    "Object appears closer than actual",
    "Cause: refraction at water surface",
    "Also: pool/river appears shallower",
  ], 10, 10, 250);
}

function renderLens(
  ctx: CanvasRenderingContext2D,
  converging: boolean, fPx: number, uPx: number
) {
  bg(ctx);
  principalAxis();
  const LX = CX;
  const fAbs = Math.abs(fPx);
  const lh = 165;
  lensShape(ctx, LX, lh, converging, "#3b82f6");
  txt(ctx, converging ? "Convex Lens" : "Concave Lens", LX - 35, 26, "#3b82f6", 12, true);
  // Focal points
  dot(ctx, LX + fAbs, CY, 5, "#f59e0b"); txt(ctx, "F₂", LX + fAbs + 4, CY - 10, "#f59e0b", 11, true);
  dot(ctx, LX - fAbs, CY, 5, "#f59e0b"); txt(ctx, "F₁", LX - fAbs - 16, CY - 10, "#f59e0b", 11, true);
  if (converging) {
    dot(ctx, LX + 2 * fAbs, CY, 4, "#6366f1");
    dot(ctx, LX - 2 * fAbs, CY, 4, "#6366f1");
    txt(ctx, "2F₁", LX - 2 * fAbs - 20, CY - 9, "#6366f1", 10);
  }
  // Object
  const objX = LX - uPx;
  const OBJ_H = 55;
  if (objX > 10 && objX < LX - 5) objectArr(ctx, objX, OBJ_H);
  // Image calc: 1/v = 1/f + 1/u where u=-uPx, f=±fPx
  const fSign = converging ? fAbs : -fAbs;
  const v = 1 / (1 / fSign + 1 / (-uPx));
  const m = v / (-uPx);
  const isReal = v > 0 && converging;
  const imgX = LX + v;
  const imgH = m * OBJ_H;
  if (isFinite(v) && Math.abs(v) < 450 && imgX > 10 && imgX < W - 10 && Math.abs(uPx - fAbs) > 4) {
    imageArr(ctx, imgX, imgH, isReal); // imgH already negative for inverted images (m = v/u, u<0, v>0 → m<0)
    txt(ctx, isReal ? "Real Image" : "Virtual Image", imgX + 4, CY + Math.abs(imgH) + 14, isReal ? "#22c55e" : "#a78bfa", 10);
  }
  // Ray 1: parallel → through F2 (converging) or appears from F1 (diverging)
  if (objX > 10 && objX < LX - 5) {
    ctx.save(); ctx.strokeStyle = "rgba(251,191,36,0.85)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(objX, CY - OBJ_H); ctx.lineTo(LX, CY - OBJ_H);
    if (converging) {
      ctx.lineTo(W, CY - OBJ_H + ((CY - (CY - OBJ_H)) / (LX - (LX + fAbs))) * (W - LX));
    } else {
      const slope2 = (0 - (CY - OBJ_H)) / (LX - fAbs - LX);
      ctx.lineTo(W, CY - OBJ_H + slope2 * (W - LX));
    }
    ctx.stroke();
    // Ray 2: through center straight
    ctx.strokeStyle = "rgba(52,211,153,0.85)";
    const sC = (CY - (CY - OBJ_H)) / (LX - objX);
    ctx.beginPath(); ctx.moveTo(objX, CY - OBJ_H); ctx.lineTo(W, CY - OBJ_H + sC * (W - objX)); ctx.stroke();
    ctx.restore();
  }
  infoPanel(ctx, [
    `${converging ? "Convex (Converging)" : "Concave (Diverging)"} Lens`,
    `f = ${converging ? "+" : "−"}${fAbs}px  |  u = −${uPx}px`,
    `v = ${isFinite(v) ? v.toFixed(0) : "∞"}px`,
    `m = ${isFinite(m) ? m.toFixed(2) : "∞"}×`,
    `Image: ${isReal ? "Real, Inverted" : "Virtual, Erect"}`,
    "Formula: 1/v − 1/u = 1/f",
  ], 10, 10, 230);
}

function renderLensMaker(
  ctx: CanvasRenderingContext2D,
  n: number, R1: number, R2: number
) {
  bg(ctx); principalAxis();
  const LX = CX + 30;
  const lh = 165;
  lensShape(ctx, LX, lh, true, "#3b82f6");
  const f = 1 / ((n - 1) * (1 / R1 - 1 / (-R2)));
  // Centers of curvature
  dot(ctx, LX + R1, CY, 5, "#22c55e"); txt(ctx, `C₁ (R₁=${R1}px)`, LX + R1 + 5, CY - 12, "#22c55e", 10);
  dot(ctx, LX - R2, CY, 5, "#f59e0b"); txt(ctx, `C₂ (R₂=${R2}px)`, LX - R2 - 70, CY - 12, "#f59e0b", 10);
  dashedLine(ctx, LX, CY, LX + R1, CY, "#22c55e"); dashedLine(ctx, LX, CY, LX - R2, CY, "#f59e0b");
  if (isFinite(f) && Math.abs(f) < 350) {
    dot(ctx, LX + f, CY, 6, "#f59e0b"); txt(ctx, `F (f=${f.toFixed(0)}px)`, LX + f + 5, CY - 14, "#f59e0b", 12, true);
  }
  // Equation display
  txt(ctx, "Lens Maker's Equation:", 10, 35, "#38bdf8", 14, true);
  txt(ctx, "1/f = (n−1) × [1/R₁ − 1/R₂]", 10, 57, "#e2e8f0", 13);
  txt(ctx, `1/f = (${n}−1) × [1/${R1} − 1/(−${R2})]`, 10, 77, "#94a3b8", 12);
  txt(ctx, `f = ${isFinite(f) ? f.toFixed(1) : "∞"} px`, 10, 100, "#22c55e", 14, true);
  infoPanel(ctx, [
    "Lens Maker's Equation",
    `n = ${n.toFixed(2)}  R₁ = ${R1}px  R₂ = ${R2}px`,
    `f = ${isFinite(f) ? f.toFixed(1) : "∞"} px`,
    `P = ${isFinite(f) ? (1000 / f).toFixed(2) : "0"} D`,
    "R₁: first surface radius (positive)",
    "R₂: second surface radius (negative)",
  ], 10, H - 115, 270);
}

function renderLensPower(ctx: CanvasRenderingContext2D, fCm: number) {
  bg(ctx); principalAxis();
  const LX = CX;
  if (fCm === 0) return;
  const converging = fCm > 0;
  lensShape(ctx, LX, 165, converging, converging ? "#22c55e" : "#ef4444");
  const fM = fCm / 100;
  const P = 1 / fM;
  const fPx = fCm * 2.5;
  if (converging) {
    dot(ctx, LX + fPx, CY, 6, "#f59e0b"); txt(ctx, `F (+${fCm}cm)`, LX + fPx + 4, CY - 14, "#f59e0b", 11, true);
    ctx.save(); ctx.strokeStyle = "rgba(251,191,36,0.8)"; ctx.lineWidth = 2;
    [-70, -35, 0, 35, 70].forEach(dy => {
      ctx.beginPath(); ctx.moveTo(20, CY + dy); ctx.lineTo(LX, CY + dy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(LX, CY + dy); ctx.lineTo(LX + fPx, CY); ctx.stroke();
    }); ctx.restore();
  } else {
    const fAbs = Math.abs(fPx);
    dot(ctx, LX - fAbs, CY, 6, "#f59e0b"); txt(ctx, `F (−${Math.abs(fCm)}cm)`, LX - fAbs + 4, CY - 14, "#f59e0b", 11, true);
    ctx.save(); ctx.strokeStyle = "rgba(251,191,36,0.8)"; ctx.lineWidth = 2;
    [-70, -35, 0, 35, 70].forEach(dy => {
      ctx.beginPath(); ctx.moveTo(20, CY + dy); ctx.lineTo(LX, CY + dy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(LX, CY + dy); ctx.lineTo(LX + 180, CY + dy + dy * 0.35); ctx.stroke();
    }); ctx.restore();
  }
  txt(ctx, "Power of a Lens", 20, 40, "#38bdf8", 16, true);
  txt(ctx, "P = 1/f  (f in metres)", 20, 64, "#e2e8f0", 13);
  txt(ctx, `P = 1/${fM.toFixed(2)} = ${P.toFixed(2)} Dioptre`, 20, 88, "#22c55e", 14, true);
  txt(ctx, `f = ${fCm > 0 ? "+" : ""}${fCm} cm`, 20, 110, "#94a3b8", 12);
  infoPanel(ctx, [
    `P = ${P.toFixed(2)} D (Dioptre)`,
    converging ? "Positive P → Converging" : "Negative P → Diverging",
    "1 Dioptre = f of 1 metre",
    "P_total = P₁ + P₂ + ... (thin lenses)",
  ], 10, H - 90, 280);
}

function renderPrism(
  ctx: CanvasRenderingContext2D,
  A: number, iDeg: number, disperse: boolean
) {
  bg(ctx);
  const Ax = 310, Ay = 70;
  const Bx = 170, By = H - 70;
  const Cx = 450, Cy = H - 70;
  ctx.save();
  ctx.fillStyle = "rgba(56,189,248,0.11)"; ctx.strokeStyle = "#38bdf8"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(Ax, Ay); ctx.lineTo(Bx, By); ctx.lineTo(Cx, Cy); ctx.closePath();
  ctx.fill(); ctx.stroke(); ctx.restore();
  txt(ctx, `Prism (A=${A}°)`, Ax - 20, Ay - 15, "#38bdf8", 12, true);

  const nGlass = 1.52;
  const iRad = (iDeg * Math.PI) / 180;
  const AR = (A * Math.PI) / 180;
  const r1 = Math.asin(Math.sin(iRad) / nGlass);
  const r2 = AR - r1;
  const sinE = nGlass * Math.sin(r2);
  const eRad = sinE <= 1 ? Math.asin(sinE) : Math.PI / 2;
  const eDeg = (eRad * 180 / Math.PI).toFixed(1);
  const dev = (iDeg + parseFloat(eDeg) - A).toFixed(1);

  if (disperse) {
    const colors = [
      { c: "#7c3aed", n: 1.532, name: "V" },
      { c: "#4338ca", n: 1.528, name: "I" },
      { c: "#2563eb", n: 1.524, name: "B" },
      { c: "#16a34a", n: 1.518, name: "G" },
      { c: "#d97706", n: 1.514, name: "Y" },
      { c: "#ea580c", n: 1.510, name: "O" },
      { c: "#dc2626", n: 1.506, name: "R" },
    ];
    // Incident white ray
    arrowLine(ctx, 40, (Ay + By) / 2 - 20, (Bx + Ax) / 2 - 10, (Ay + By) / 2, "#e2e8f0", 2.5);
    txt(ctx, "White Light →", 15, (Ay + By) / 2 - 30, "#e2e8f0", 11, true);
    colors.forEach(({ c, n, name }, i) => {
      const r1i = Math.asin(Math.sin(iRad) / n);
      const r2i = AR - r1i;
      const sE = n * Math.sin(r2i);
      if (sE <= 1) {
        const eI = Math.asin(sE);
        ctx.save(); ctx.strokeStyle = c; ctx.lineWidth = 2; ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.moveTo((Ax + Cx) / 2 + i * 4, (Ay + Cy) / 2);
        ctx.lineTo((Ax + Cx) / 2 + i * 4 + 120 * Math.cos(eI + 0.2 + i * 0.02), (Ay + Cy) / 2 + 120 * Math.sin(eI + 0.2 + i * 0.02));
        ctx.stroke(); ctx.restore();
        txt(ctx, name, (Ax + Cx) / 2 + i * 4 + 128 * Math.cos(eI + 0.2 + i * 0.02), (Ay + Cy) / 2 + 128 * Math.sin(eI + 0.2 + i * 0.02), c, 12, true);
      }
    });
    txt(ctx, "Dispersion: Violet deviates most,", 10, H - 50, "#94a3b8", 10);
    txt(ctx, "Red deviates least  (shorter λ → higher n)", 10, H - 35, "#94a3b8", 10);
  } else {
    // Single ray
    arrowLine(ctx, 40, (Ay + By) / 2 - 30, (Bx + Ax) / 2 - 5, (Ay + By) / 2, "#fbbf24");
    const midX = (Bx + Ax) / 2, midY = (Ay + By) / 2;
    const exitX = (Ax + Cx) / 2 + 15, exitY = (Ay + Cy) / 2;
    arrowLine(ctx, midX, midY, exitX, exitY, "#38bdf8");
    arrowLine(ctx, exitX, exitY, exitX + 130 * Math.cos(eRad - 0.15), exitY + 130 * Math.sin(eRad - 0.15), "#fbbf24");
    // Deviation angle
    dashedLine(ctx, midX, midY, exitX + 150 * Math.cos(iRad - 0.05), midY + 150 * Math.sin(iRad - 0.05), "#94a3b8");
    infoPanel(ctx, [
      `Prism Refraction (A = ${A}°)`,
      `i = ${iDeg}°  |  e = ${eDeg}°`,
      `Deviation δ = i + e − A = ${dev}°`,
      `n(glass) ≈ 1.52`,
      "Min deviation: i = e (symmetric)",
      `n = sin((A+δm)/2) / sin(A/2)`,
    ], W - 270, 10, 260);
  }
}

function renderScattering(ctx: CanvasRenderingContext2D, blue: boolean, t: number) {
  bg(ctx);
  if (blue) {
    const g = ctx.createLinearGradient(0, 0, 0, H * 0.75);
    g.addColorStop(0, "#0c4a6e"); g.addColorStop(1, "#0ea5e9");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H * 0.75);
    ctx.fillStyle = "#14532d"; ctx.fillRect(0, H * 0.75, W, H * 0.25);
    txt(ctx, "Earth's surface", 10, H * 0.75 + 20, "#86efac", 10);
    // Sun
    ctx.save(); ctx.fillStyle = "#fef08a"; ctx.shadowColor = "#fde047"; ctx.shadowBlur = 35;
    ctx.beginPath(); ctx.arc(W - 70, 65, 38, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    txt(ctx, "Sun", W - 95, 118, "#fde047", 12, true);
    // Molecules + scattering
    [[140, 70], [300, 110], [460, 85], [190, 155], [510, 130], [90, 200], [350, 175], [550, 210]].forEach(([px, py], i) => {
      const nt = (t + i * 0.4) % 3;
      ctx.save(); ctx.fillStyle = "#93c5fd"; ctx.shadowColor = "#3b82f6"; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(px + Math.sin(nt) * 4, py + Math.cos(nt * 1.2) * 3, 5, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      if (i % 2 === 0) {
        const ang = (t * 1.8 + i * 55) % 360 * Math.PI / 180;
        ctx.save(); ctx.strokeStyle = "#60a5fa"; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.65;
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + 28 * Math.cos(ang), py + 28 * Math.sin(ang)); ctx.stroke(); ctx.restore();
      }
    });
    ctx.save(); ctx.strokeStyle = "rgba(253,224,71,0.35)"; ctx.lineWidth = 3;
    for (let x = 60; x < W; x += 100) {
      ctx.beginPath(); ctx.moveTo(W - 70, 65); ctx.lineTo(x, H * 0.73); ctx.stroke();
    }
    ctx.restore();
    infoPanel(ctx, [
      "Rayleigh Scattering — Blue Sky",
      "Scattering ∝ 1/λ⁴",
      "Blue light (λ≈450nm) scatters most",
      "Red light (λ≈700nm) scatters least",
      "Scattered blue → fills sky",
    ], 10, 10, 260);
  } else {
    const g2 = ctx.createLinearGradient(0, 0, 0, H * 0.75);
    g2.addColorStop(0, "#1c1917"); g2.addColorStop(0.45, "#7c2d12"); g2.addColorStop(0.75, "#ea580c"); g2.addColorStop(1, "#dc2626");
    ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H * 0.75);
    ctx.fillStyle = "#1c1917"; ctx.fillRect(0, H * 0.75, W, H * 0.25);
    ctx.save(); ctx.fillStyle = "#f97316"; ctx.shadowColor = "#ef4444"; ctx.shadowBlur = 45;
    ctx.beginPath(); ctx.arc(W / 2, H * 0.72, 42, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    infoPanel(ctx, [
      "Red Sunset — Scattering",
      "Sunset: longer path through atmosphere",
      "Blue/violet light scattered away",
      "Red & orange light reaches eyes",
      "Sky appears red/orange at sunset",
      "Same effect at sunrise",
    ], 10, 10, 265);
  }
}

function renderSimpleMicroscope(ctx: CanvasRenderingContext2D, fPx: number, uPx: number) {
  bg(ctx); principalAxis();
  const LX = CX + 60;
  const fAbs = Math.abs(fPx);
  const uAbs = Math.min(uPx, fAbs - 3);
  lensShape(ctx, LX, 130, true, "#3b82f6");
  txt(ctx, `Simple Microscope  f = ${fAbs}px`, LX - 45, 26, "#3b82f6", 12, true);
  dot(ctx, LX + fAbs, CY, 5, "#f59e0b"); txt(ctx, "F", LX + fAbs + 4, CY - 10, "#f59e0b", 11);
  dot(ctx, LX - fAbs, CY, 5, "#f59e0b");
  const objX = LX - uAbs;
  objectArr(ctx, objX, 35, "Object");
  // v = uf/(u-f) → since u<f, denominator negative → v negative (same side as object)
  const v = (uAbs * fAbs) / (uAbs - fAbs); // will be negative since uAbs<fAbs
  const m = Math.abs(v) / uAbs;
  const imgX = LX + v; // v<0 → to left of lens
  if (imgX > 10 && imgX < LX) {
    imageArr(ctx, imgX, m * 35, false);
    txt(ctx, `Virtual Image (m=${m.toFixed(1)}×)`, imgX - 80, CY - m * 35 - 8, "#a78bfa", 10);
  }
  ctx.save(); ctx.font = "22px serif"; ctx.fillText("👁", LX + 80, CY + 8); ctx.restore();
  const D = 250;
  infoPanel(ctx, [
    "Simple Microscope (Magnifier)",
    "Object placed inside focal length",
    `m = 1 + D/f = 1 + ${D}/${fAbs} = ${(1 + D / fAbs).toFixed(1)}×`,
    "Image: Virtual, Erect, Magnified",
    "Used in: watchmaking, stamps, gems",
    "D = 25 cm (least distance of D.V.)",
  ], 10, 10, 270);
}

function renderCompoundMicroscope(ctx: CanvasRenderingContext2D) {
  bg(ctx);
  const OBJ_X = 145, EYE_X = 555;
  dashedLine(ctx, 50, CY, W - 30, CY, "#64748b");
  lensShape(ctx, OBJ_X, 110, true, "#22c55e");
  txt(ctx, "Objective  fo=15px", OBJ_X - 35, 28, "#22c55e", 11, true);
  lensShape(ctx, EYE_X, 120, true, "#a78bfa");
  txt(ctx, "Eyepiece  fe=50px", EYE_X - 35, 28, "#a78bfa", 11, true);
  objectArr(ctx, OBJ_X - 18, 28, "O");
  // Intermediate image (inverted, beyond 2F of objective)
  const INTX = 350;
  ctx.save(); ctx.strokeStyle = "#22c55e"; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(INTX, CY); ctx.lineTo(INTX, CY + 55); ctx.stroke();
  ctx.fillStyle = "#22c55e";
  ctx.beginPath(); ctx.moveTo(INTX, CY + 55); ctx.lineTo(INTX - 5, CY + 45); ctx.lineTo(INTX + 5, CY + 45); ctx.closePath(); ctx.fill();
  ctx.restore();
  txt(ctx, "Intermediate", INTX - 38, CY + 70, "#22c55e", 10);
  txt(ctx, "Real Image", INTX - 28, CY + 83, "#22c55e", 10);
  // Rays
  ctx.save(); ctx.strokeStyle = "rgba(251,191,36,0.65)"; ctx.lineWidth = 1.5;
  [-1, 0, 1].forEach(d => {
    ctx.beginPath(); ctx.moveTo(OBJ_X - 18, CY - 28 + d * 8); ctx.lineTo(INTX, CY + 55 + d * 4); ctx.stroke();
  }); ctx.restore();
  ctx.save(); ctx.strokeStyle = "rgba(167,139,250,0.65)"; ctx.lineWidth = 1.5;
  [-1, 0, 1].forEach(d => {
    ctx.beginPath(); ctx.moveTo(INTX, CY + 55 + d * 4); ctx.lineTo(W - 55, CY - 25 + d * 18); ctx.stroke();
  }); ctx.restore();
  txt(ctx, "← Final Virtual Image (inverted)", 10, CY - 42, "#a78bfa", 11, true);
  ctx.save(); ctx.font = "20px serif"; ctx.fillText("👁", W - 52, CY + 6); ctx.restore();
  infoPanel(ctx, [
    "Compound Microscope",
    "Objective: forms real enlarged image",
    "Eyepiece: acts as simple microscope",
    "M = mₒ × mₑ",
    "mₒ = L/fₒ  |  mₑ = D/fₑ",
    "Image: Virtual, Inverted, Highly magnified",
    "Used to see: cells, microbes",
  ], 10, 10, 265);
}

function renderRefractingTelescope(ctx: CanvasRenderingContext2D) {
  bg(ctx);
  const OBJ_X = 110, EYE_X = 580;
  const fo = 220, fe = 50;
  const F_X = OBJ_X + fo;
  dashedLine(ctx, 20, CY, W - 20, CY, "#64748b");
  lensShape(ctx, OBJ_X, 170, true, "#22c55e");
  txt(ctx, `Objective  fo=${fo}px`, OBJ_X - 40, 22, "#22c55e", 11, true);
  lensShape(ctx, EYE_X, 110, true, "#a78bfa");
  txt(ctx, `Eyepiece  fe=${fe}px`, EYE_X - 35, 22, "#a78bfa", 11, true);
  // Incoming parallel rays
  ctx.save(); ctx.strokeStyle = "rgba(251,191,36,0.8)"; ctx.lineWidth = 2;
  [-65, -35, 0].forEach(dy => {
    ctx.beginPath(); ctx.moveTo(15, CY + dy); ctx.lineTo(OBJ_X, CY + dy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(OBJ_X, CY + dy); ctx.lineTo(F_X, CY + dy === CY ? CY : CY + 45); ctx.stroke();
  }); ctx.restore();
  dot(ctx, F_X, CY + 45, 5, "#f59e0b"); txt(ctx, "Common F", F_X + 4, CY + 58, "#f59e0b", 10);
  // Rays from common F through eyepiece → parallel
  ctx.save(); ctx.strokeStyle = "rgba(167,139,250,0.8)"; ctx.lineWidth = 2;
  [[F_X, CY + 45, EYE_X, CY - 32], [F_X, CY + 45, EYE_X, CY]].forEach(([x1, y1, x2, y2]) => {
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  }); ctx.restore();
  // Parallel exit
  ctx.save(); ctx.strokeStyle = "rgba(52,211,153,0.8)"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(EYE_X, CY - 32); ctx.lineTo(W - 30, CY - 32); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(EYE_X, CY); ctx.lineTo(W - 30, CY); ctx.stroke(); ctx.restore();
  ctx.save(); ctx.font = "20px serif"; ctx.fillText("👁", W - 30, CY + 7); ctx.restore();
  const M = (fo / fe).toFixed(0);
  infoPanel(ctx, [
    "Refracting Telescope (Astronomical)",
    `M = fo/fe = ${fo}/${fe} = ${M}×`,
    "Objective: large f → collects light",
    "Eyepiece: small f → magnifies",
    "Image: Inverted (astronomical)",
    "Normal adjustment: image at ∞",
    "Tube length = fo + fe",
  ], 10, 10, 265);
}

function renderReflectingTelescope(ctx: CanvasRenderingContext2D) {
  bg(ctx);
  const PX = W - 90, PR = 145;
  // Parabolic mirror
  ctx.save(); ctx.strokeStyle = "#38bdf8"; ctx.lineWidth = 3.5;
  ctx.beginPath();
  for (let y = CY - PR; y <= CY + PR; y += 2) {
    const dy = y - CY;
    const x = PX - (dy * dy) / (2.2 * PR);
    y === CY - PR ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.stroke(); ctx.restore();
  txt(ctx, "Parabolic Primary Mirror", PX - 60, CY - PR - 15, "#38bdf8", 11, true);
  // Secondary flat mirror
  const FOC_X = PX - PR * 0.5;
  ctx.save(); ctx.strokeStyle = "#94a3b8"; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(FOC_X, CY - 28); ctx.lineTo(FOC_X + 28, CY + 8); ctx.stroke(); ctx.restore();
  txt(ctx, "Flat mirror", FOC_X - 22, CY - 40, "#94a3b8", 10);
  dashedLine(ctx, 20, CY, PX, CY, "#64748b");
  // Eyepiece at top
  const EPX = FOC_X + 14, EPY = CY - 80;
  lensShape(ctx, EPX, 80, true, "#a78bfa");
  txt(ctx, "Eyepiece", EPX - 22, EPY - 50, "#a78bfa", 11, true);
  // Incoming rays
  ctx.save(); ctx.strokeStyle = "rgba(251,191,36,0.8)"; ctx.lineWidth = 2;
  [-3, -1.5, 0, 1.5, 3].forEach(i => {
    const ry = CY + i * 25;
    ctx.beginPath(); ctx.moveTo(15, ry); ctx.lineTo(PX - 145, ry); ctx.stroke();
    const startX = PX - (i * 25) * (i * 25) / (2.2 * PR);
    ctx.beginPath(); ctx.moveTo(startX, ry); ctx.lineTo(FOC_X + 10, CY + 5); ctx.stroke();
  }); ctx.restore();
  ctx.save(); ctx.strokeStyle = "rgba(167,139,250,0.8)"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(FOC_X + 10, CY + 5); ctx.lineTo(EPX, EPY + 40); ctx.stroke(); ctx.restore();
  ctx.save(); ctx.font = "20px serif"; ctx.fillText("👁", EPX + 8, EPY - 55); ctx.restore();
  infoPanel(ctx, [
    "Reflecting Telescope (Newton/Cassegrain)",
    "Primary: Parabolic mirror (large aperture)",
    "No chromatic aberration",
    "Secondary mirror redirects light",
    "M = fo/fe",
    "Used: Hubble, James Webb Space Telescope",
  ], 10, 10, 270);
}

function renderEyeCorrection(ctx: CanvasRenderingContext2D, myopia: boolean) {
  bg(ctx);
  const EX = 575, ER = 52;
  // Corrective lens
  const LENS_X = EX - ER - 65;
  lensShape(ctx, LENS_X, 105, !myopia, myopia ? "#a78bfa" : "#22c55e");
  txt(ctx, myopia ? "Concave Lens (−f)" : "Convex Lens (+f)", LENS_X - 32, CY - 70, myopia ? "#a78bfa" : "#22c55e", 11, true);
  // Eye shape
  ctx.save(); ctx.strokeStyle = "#e2e8f0"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(EX, CY, ER, ER * 0.85, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = "#38bdf8"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(EX - 10, CY, 17, 21, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = "#22c55e"; ctx.beginPath(); ctx.arc(EX + ER - 5, CY, 5, 0, Math.PI * 2); ctx.fill();
  txt(ctx, "Retina", EX + ER + 2, CY + 4, "#22c55e", 10);
  ctx.restore();
  objectArr(ctx, 80, 48, "Obj");
  // Corrected ray
  ctx.save(); ctx.strokeStyle = myopia ? "#a78bfa" : "#22c55e"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(80, CY - 48); ctx.lineTo(LENS_X, CY - 25); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(LENS_X, CY - 25); ctx.lineTo(EX + ER - 5, CY); ctx.stroke(); ctx.restore();
  // Uncorrected dashed
  ctx.save(); ctx.strokeStyle = "#ef4444"; ctx.lineWidth = 1.5; ctx.setLineDash([5, 4]);
  if (myopia) {
    ctx.beginPath(); ctx.moveTo(80, CY - 48); ctx.lineTo(EX - 20, CY); ctx.stroke();
    txt(ctx, "Without lens: focus BEFORE retina", 170, CY - 70, "#ef4444", 10);
  } else {
    ctx.beginPath(); ctx.moveTo(80, CY - 48); ctx.lineTo(EX + ER + 35, CY); ctx.stroke();
    txt(ctx, "Without lens: focus BEHIND retina", 170, CY - 70, "#ef4444", 10);
  }
  ctx.setLineDash([]); ctx.restore();
  infoPanel(ctx, myopia ? [
    "Myopia (Near-sightedness)",
    "Far objects appear blurry",
    "Eyeball too long OR lens too strong",
    "Image forms before retina",
    "Correction: Concave (Diverging) lens",
    "Lens diverges rays → image on retina",
  ] : [
    "Hyperopia (Far-sightedness)",
    "Near objects appear blurry",
    "Eyeball too short OR lens too weak",
    "Image would form behind retina",
    "Correction: Convex (Converging) lens",
    "Lens converges rays → image on retina",
  ], 10, 10, 265);
}

function renderRainbow(ctx: CanvasRenderingContext2D) {
  bg(ctx);
  ctx.fillStyle = "rgba(56,189,248,0.07)"; ctx.fillRect(0, 0, W, H * 0.72);
  ctx.fillStyle = "#14532d"; ctx.fillRect(0, H * 0.72, W, H * 0.28);
  // Water droplet
  const DX = W * 0.58, DY = 180, DR = 72;
  ctx.save(); ctx.fillStyle = "rgba(56,189,248,0.22)"; ctx.strokeStyle = "#38bdf8"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(DX, DY, DR, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.restore();
  txt(ctx, "Water Droplet", DX - 42, DY + DR + 18, "#38bdf8", 11, true);
  // Sunlight
  arrowLine(ctx, 40, DY - 25, DX - DR - 5, DY - 10, "#fef08a", 3);
  txt(ctx, "Sunlight", 40, DY - 38, "#fef08a", 12, true);
  // VIBGYOR exit rays
  const cs = ["#7c3aed", "#4338ca", "#2563eb", "#16a34a", "#d97706", "#ea580c", "#dc2626"];
  cs.forEach((c, i) => {
    ctx.save(); ctx.strokeStyle = c; ctx.lineWidth = 2.5; ctx.shadowColor = c; ctx.shadowBlur = 5;
    ctx.beginPath();
    ctx.moveTo(DX - DR * 0.6, DY - DR * 0.6);
    ctx.lineTo(DX - DR * 0.6 - 160 + i * 10, DY + 40 + i * 22);
    ctx.stroke(); ctx.restore();
  });
  // Rainbow arc
  cs.forEach((c, i) => {
    ctx.save(); ctx.strokeStyle = c; ctx.lineWidth = 7; ctx.globalAlpha = 0.8;
    ctx.beginPath(); ctx.arc(110, H * 0.82, 70 + i * 14, -Math.PI, 0, false); ctx.stroke(); ctx.restore();
  });
  txt(ctx, "Rainbow", 80, H * 0.82 - 110, "#e2e8f0", 12, true);
  infoPanel(ctx, [
    "Rainbow Formation",
    "1. Refraction entering droplet",
    "2. Total Internal Reflection inside",
    "3. Refraction exiting droplet",
    "Violet: ~40°  |  Red: ~42°",
    "Dispersion separates VIBGYOR colors",
  ], W - 270, 10, 260);
}

function renderDiamondTIR(ctx: CanvasRenderingContext2D) {
  bg(ctx);
  const DX = CX + 30, DY = CY, R = 105;
  const N = 8;
  ctx.save();
  ctx.fillStyle = "rgba(219,234,254,0.09)"; ctx.strokeStyle = "#a5f3fc"; ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2 - Math.PI / N;
    i === 0 ? ctx.moveTo(DX + R * Math.cos(a), DY + R * Math.sin(a)) : ctx.lineTo(DX + R * Math.cos(a), DY + R * Math.sin(a));
  }
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = "#67e8f9";
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2 - Math.PI / N;
    ctx.beginPath(); ctx.moveTo(DX, DY); ctx.lineTo(DX + R * Math.cos(a), DY + R * Math.sin(a)); ctx.stroke();
  }
  ctx.restore();
  txt(ctx, "Diamond  n = 2.42", DX - 55, DY - R - 20, "#a5f3fc", 12, true);
  // Incident ray
  arrowLine(ctx, DX - R - 80, DY - 65, DX - R * 0.68, DY - R * 0.68, "#fbbf24");
  // Bouncing rays inside
  ctx.save(); ctx.strokeStyle = "#fef08a"; ctx.lineWidth = 2.5; ctx.shadowColor = "#fbbf24"; ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.moveTo(DX - R * 0.68, DY - R * 0.68);
  ctx.lineTo(DX + R * 0.55, DY - R * 0.28);
  ctx.lineTo(DX + R * 0.72, DY + R * 0.55);
  ctx.lineTo(DX - R * 0.32, DY + R * 0.72);
  ctx.lineTo(DX - R * 0.68, DY + R * 0.4);
  ctx.stroke(); ctx.restore();
  const critD = Math.asin(1 / 2.42) * 180 / Math.PI;
  infoPanel(ctx, [
    "Diamond — Brilliance via TIR",
    `n = 2.42 (very high)`,
    `Critical angle θc = ${critD.toFixed(1)}°`,
    "Cut angles designed so θ > θc",
    "TIR at every internal surface",
    "Light bounces → emerges from top",
    "→ Creates the sparkle & brilliance",
  ], 10, 10, 265);
}

function renderMirage(ctx: CanvasRenderingContext2D, t: number) {
  bg(ctx);
  const GND = H - 65;
  for (let y = GND - 110; y < GND; y += 4) {
    const heat = (GND - y) / 110;
    ctx.fillStyle = `rgba(251,191,36,${heat * 0.07})`;
    ctx.fillRect(0, y, W, 4);
  }
  ctx.fillStyle = "#374151"; ctx.fillRect(0, GND, W, 65);
  ctx.fillStyle = "#4b5563"; ctx.fillRect(60, GND + 22, W - 120, 5);
  txt(ctx, "Hot Road (Dense → Rare gradient from ground up)", 70, GND + 48, "#9ca3af", 10);
  // Tree
  ctx.save(); ctx.font = "42px serif"; ctx.fillText("🌴", 100, GND - 75); ctx.restore();
  txt(ctx, "Object", 112, GND - 82, "#f97316", 10, true);
  // Direct ray
  arrowLine(ctx, 130, GND - 100, 420, 195, "#f97316", 2);
  txt(ctx, "Direct ray", 290, 182, "#f97316", 10);
  // Mirage curved ray
  ctx.save(); ctx.strokeStyle = "#38bdf8"; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(130, GND - 100);
  ctx.bezierCurveTo(200, GND - 15, 390, GND - 18, 500, GND - 95);
  ctx.stroke(); ctx.restore();
  txt(ctx, "Mirage ray (bends by TIR-like effect)", 230, GND - 40, "#38bdf8", 10, true);
  // Eye
  ctx.save(); ctx.font = "22px serif"; ctx.fillText("👁", 505, GND - 90); ctx.restore();
  // Reflected ghost image
  ctx.save(); ctx.globalAlpha = 0.35 + 0.1 * Math.sin(t * 2); ctx.font = "28px serif";
  ctx.scale(1, -0.45); ctx.fillText("🌴", 100, -(GND + 15)); ctx.restore();
  txt(ctx, "Apparent water (inverted ghost image)", 140, GND - 5, "#a78bfa", 10);
  infoPanel(ctx, [
    "Mirage — Desert / Road Effect",
    "Hot air just above road = rarer medium",
    "Density gradient: dense top → rare bottom",
    "Light bends gradually upward (TIR)",
    "Creates virtual inverted image below",
    "Looks like water / reflections on road",
  ], 10, 10, 280);
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function RayOpticsEngine({ mode = "concave-mirror", onContextChange, ...params }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  // Mirror
  const [mirrorAngle, setMirrorAngle] = useState(35);
  const [mirrorF, setMirrorF] = useState(100);
  const [mirrorU, setMirrorU] = useState(200);
  // Snell / TIR
  const [n1, setN1] = useState(1.0);
  const [n2, setN2] = useState(1.5);
  const [snellAngle, setSnellAngle] = useState(35);
  const [tirN1, setTirN1] = useState(1.5);
  const [tirAngle, setTirAngle] = useState(35);
  // Lens
  const [lensF, setLensF] = useState(100);
  const [lensU, setLensU] = useState(200);
  // Glass slab
  const [slabN, setSlabN] = useState(1.5);
  const [slabT, setSlabT] = useState(120);
  const [slabAngle, setSlabAngle] = useState(35);
  // Apparent depth
  const [adN, setAdN] = useState(1.33);
  const [adD, setAdD] = useState(200);
  // Prism
  const [prismA, setPrismA] = useState(60);
  const [prismI, setPrismI] = useState(40);
  // Lens maker
  const [lmN, setLmN] = useState(1.5);
  const [lmR1, setLmR1] = useState(80);
  const [lmR2, setLmR2] = useState(80);
  // Lens power
  const [lpF, setLpF] = useState(50);
  // Simple micro
  const [smF, setSmF] = useState(50);
  const [smU, setSmU] = useState(40);

  const animatedModes = ["optical-fiber", "scattering-blue", "scattering-red", "red-sunset", "mirage"];

  const draw = useCallback((t: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    switch (mode) {
      case "plane-mirror":
      case "mirror-lateral": renderPlaneMirror(ctx, mirrorAngle); break;
      case "concave-mirror":
      case "concave-mirror-beyond-c":
      case "concave-mirror-at-c":
      case "concave-mirror-between-c-f":
      case "concave-mirror-at-f":
      case "concave-mirror-between-f-p":
      case "mirror-formula":
      case "mirror-magnification":
        renderSphericalMirror(ctx, true, mirrorF, mirrorU); break;
      case "convex-mirror":
      case "convex-mirror-road":
        renderSphericalMirror(ctx, false, mirrorF, mirrorU); break;
      case "snell-law":
      case "snell-formula":
      case "water-refraction":
        renderSnellLaw(ctx, n1, n2, snellAngle); break;
      case "tir":
      case "critical-angle":
      case "diamond-tir-critical":
        renderTIR(ctx, tirN1, tirAngle); break;
      case "optical-fiber": renderOpticalFiber(ctx, t); break;
      case "glass-slab":
      case "lateral-shift":
        renderGlassSlab(ctx, slabN, slabT, slabAngle); break;
      case "apparent-depth": renderApparentDepth(ctx, adN, adD); break;
      case "spherical-surface": renderApparentDepth(ctx, adN, adD); break;
      case "lens-converging":
      case "lens-formula":
      case "lens-magnification":
      case "lens-combination":
        renderLens(ctx, true, lensF, lensU); break;
      case "lens-diverging":
      case "myopia-correction-lens":
        renderLens(ctx, false, lensF, lensU); break;
      case "lens-maker": renderLensMaker(ctx, lmN, lmR1, lmR2); break;
      case "lens-power": renderLensPower(ctx, lpF); break;
      case "prism-refraction":
      case "prism-deviation":
      case "minimum-deviation":
      case "angular-dispersion":
      case "cauchy":
      case "prism-reflector":
        renderPrism(ctx, prismA, prismI, false); break;
      case "dispersion": renderPrism(ctx, prismA, prismI, true); break;
      case "scattering-blue": renderScattering(ctx, true, t); break;
      case "scattering-red":
      case "red-sunset": renderScattering(ctx, false, t); break;
      case "simple-microscope": renderSimpleMicroscope(ctx, smF, smU); break;
      case "compound-microscope": renderCompoundMicroscope(ctx); break;
      case "refracting-telescope": renderRefractingTelescope(ctx); break;
      case "reflecting-telescope":
      case "cassegrain-telescope": renderReflectingTelescope(ctx); break;
      case "myopia-correction": renderEyeCorrection(ctx, true); break;
      case "hyperopia-correction": renderEyeCorrection(ctx, false); break;
      case "rainbow": renderRainbow(ctx); break;
      case "diamond-tir": renderDiamondTIR(ctx); break;
      case "mirage": renderMirage(ctx, t); break;
      default: renderSphericalMirror(ctx, true, mirrorF, mirrorU);
    }
  }, [mode, mirrorAngle, mirrorF, mirrorU, n1, n2, snellAngle, tirN1, tirAngle,
    lensF, lensU, slabN, slabT, slabAngle, adN, adD, prismA, prismI,
    lmN, lmR1, lmR2, lpF, smF, smU]);

  useEffect(() => {
    if (animatedModes.includes(mode)) {
      let start: number | null = null;
      const loop = (ts: number) => {
        if (!start) start = ts;
        draw((ts - start) / 1000);
        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);
      return () => cancelAnimationFrame(rafRef.current);
    } else {
      draw(0);
    }
  }, [draw, mode]);

  useEffect(() => {
    const map: Record<string, string> = {
      "plane-mirror": `Plane mirror: ∠i = ∠r = ${mirrorAngle}°. Laws of reflection.`,
      "concave-mirror": `Concave mirror: f=−${mirrorF}px, u=−${mirrorU}px. 1/v+1/u=1/f.`,
      "convex-mirror": `Convex mirror: f=+${mirrorF}px, u=−${mirrorU}px. Virtual, erect, diminished.`,
      "snell-law": `Snell's law: n₁=${n1} sinθ₁=n₂=${n2} sinθ₂. θ₁=${snellAngle}°.`,
      "tir": `TIR: n₁=${tirN1}, θ=${tirAngle}°, θc=${(Math.asin(1/tirN1)*180/Math.PI).toFixed(1)}°.`,
      "lens-converging": `Convex lens: f=+${lensF}px, u=−${lensU}px. 1/v−1/u=1/f.`,
      "lens-diverging": `Concave lens: f=−${lensF}px, u=−${lensU}px. Always virtual image.`,
      "prism-deviation": `Prism: A=${prismA}°, i=${prismI}°. δ=i+e−A.`,
      "dispersion": `Dispersion through prism A=${prismA}°. VIBGYOR. Violet deviates most.`,
    };
    onContextChange?.(map[mode] || `Ray Optics: ${mode}`);
  }, [mode, mirrorAngle, mirrorF, mirrorU, n1, n2, snellAngle, tirN1, tirAngle, lensF, lensU, prismA, prismI]);

  const ctrl = () => {
    const S = (p: { label: string; val: number; min: number; max: number; step?: number; set: (v: number) => void; unit: string; color: string }) => (
      <div key={p.label}>
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>{p.label}</span>
          <span className="font-bold" style={{ color: p.color }}>{p.val}{p.unit}</span>
        </div>
        <input type="range" min={p.min} max={p.max} step={p.step ?? 1} value={p.val}
          onChange={e => p.set(Number(e.target.value))}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
          style={{ accentColor: p.color }} />
      </div>
    );
    const Sel = (p: { label: string; val: number; opts: { v: number; l: string }[]; set: (v: number) => void }) => (
      <div key={p.label}>
        <div className="text-xs text-gray-400 mb-1">{p.label}</div>
        <select value={p.val} onChange={e => p.set(Number(e.target.value))}
          className="w-full bg-gray-800 border border-gray-700 text-gray-200 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-cyan-600">
          {p.opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
        </select>
      </div>
    );

    if (["plane-mirror", "mirror-lateral"].includes(mode))
      return <div className="p-4 bg-gray-900/60 rounded-xl border border-gray-800">{S({ label: "Angle of Incidence (∠i)", val: mirrorAngle, min: 5, max: 75, set: setMirrorAngle, unit: "°", color: "#f59e0b" })}</div>;

    if (["concave-mirror", "concave-mirror-beyond-c", "concave-mirror-at-c", "concave-mirror-between-c-f", "concave-mirror-at-f", "concave-mirror-between-f-p", "convex-mirror", "convex-mirror-road", "mirror-formula", "mirror-magnification"].includes(mode))
      return <div className="p-4 bg-gray-900/60 rounded-xl border border-gray-800 grid grid-cols-2 gap-3">{S({ label: "Focal Length |f|", val: mirrorF, min: 50, max: 160, set: setMirrorF, unit: "px", color: "#f59e0b" })}{S({ label: "Object Distance |u|", val: mirrorU, min: 20, max: 360, set: setMirrorU, unit: "px", color: "#f97316" })}</div>;

    if (["snell-law", "snell-formula", "water-refraction"].includes(mode))
      return <div className="p-4 bg-gray-900/60 rounded-xl border border-gray-800 space-y-3">
        <div className="grid grid-cols-2 gap-3">{Sel({ label: "Medium 1 (n₁)", val: n1, set: setN1, opts: [{ v: 1.0, l: "Air (1.00)" }, { v: 1.33, l: "Water (1.33)" }, { v: 1.5, l: "Glass (1.50)" }] })}{Sel({ label: "Medium 2 (n₂)", val: n2, set: setN2, opts: [{ v: 1.0, l: "Air (1.00)" }, { v: 1.33, l: "Water (1.33)" }, { v: 1.5, l: "Glass (1.50)" }, { v: 2.42, l: "Diamond (2.42)" }] })}</div>
        {S({ label: "Angle of Incidence (θ₁)", val: snellAngle, min: 0, max: 75, set: setSnellAngle, unit: "°", color: "#f59e0b" })}
      </div>;

    if (["tir", "critical-angle", "diamond-tir-critical"].includes(mode))
      return <div className="p-4 bg-gray-900/60 rounded-xl border border-gray-800 space-y-3">
        {Sel({ label: "Dense Medium (n₁)", val: tirN1, set: setTirN1, opts: [{ v: 1.33, l: "Water (1.33)" }, { v: 1.5, l: "Glass (1.50)" }, { v: 2.42, l: "Diamond (2.42)" }] })}
        {S({ label: "Angle in Dense Medium (θ)", val: tirAngle, min: 5, max: 85, set: setTirAngle, unit: "°", color: "#f97316" })}
        <div className="text-xs text-cyan-400 bg-cyan-950/30 rounded-lg px-3 py-2">Critical angle: <strong>{(Math.asin(1 / tirN1) * 180 / Math.PI).toFixed(1)}°</strong></div>
      </div>;

    if (["lens-converging", "lens-diverging", "lens-formula", "lens-magnification", "lens-combination", "myopia-correction-lens"].includes(mode))
      return <div className="p-4 bg-gray-900/60 rounded-xl border border-gray-800 grid grid-cols-2 gap-3">{S({ label: "Focal Length |f|", val: lensF, min: 40, max: 180, set: setLensF, unit: "px", color: "#3b82f6" })}{S({ label: "Object Distance |u|", val: lensU, min: 20, max: 400, set: setLensU, unit: "px", color: "#f97316" })}</div>;

    if (["glass-slab", "lateral-shift"].includes(mode))
      return <div className="p-4 bg-gray-900/60 rounded-xl border border-gray-800 space-y-3">
        <div className="grid grid-cols-2 gap-3">{S({ label: "Refractive Index (n)", val: slabN, min: 1.2, max: 2.0, step: 0.05, set: setSlabN, unit: "", color: "#06b6d4" })}{S({ label: "Thickness (t)", val: slabT, min: 60, max: 200, set: setSlabT, unit: "px", color: "#8b5cf6" })}</div>
        {S({ label: "Angle of Incidence (i)", val: slabAngle, min: 5, max: 65, set: setSlabAngle, unit: "°", color: "#f59e0b" })}
      </div>;

    if (mode === "apparent-depth" || mode === "spherical-surface")
      return <div className="p-4 bg-gray-900/60 rounded-xl border border-gray-800 grid grid-cols-2 gap-3">{Sel({ label: "Medium (n)", val: adN, set: setAdN, opts: [{ v: 1.33, l: "Water (1.33)" }, { v: 1.5, l: "Glass (1.50)" }] })}{S({ label: "Real Depth", val: adD, min: 100, max: 290, set: setAdD, unit: "px", color: "#3b82f6" })}</div>;

    if (["prism-refraction", "prism-deviation", "minimum-deviation", "angular-dispersion", "cauchy", "dispersion", "prism-reflector"].includes(mode))
      return <div className="p-4 bg-gray-900/60 rounded-xl border border-gray-800 grid grid-cols-2 gap-3">{S({ label: "Prism Angle (A)", val: prismA, min: 30, max: 75, set: setPrismA, unit: "°", color: "#06b6d4" })}{S({ label: "Angle of Incidence (i)", val: prismI, min: 20, max: 65, set: setPrismI, unit: "°", color: "#f59e0b" })}</div>;

    if (mode === "lens-maker")
      return <div className="p-4 bg-gray-900/60 rounded-xl border border-gray-800 space-y-3">
        {S({ label: "Refractive Index (n)", val: lmN, min: 1.2, max: 2.0, step: 0.05, set: setLmN, unit: "", color: "#06b6d4" })}
        <div className="grid grid-cols-2 gap-3">{S({ label: "Radius R₁ (first surface)", val: lmR1, min: 30, max: 200, set: setLmR1, unit: "px", color: "#22c55e" })}{S({ label: "Radius R₂ (second surface)", val: lmR2, min: 30, max: 200, set: setLmR2, unit: "px", color: "#f59e0b" })}</div>
      </div>;

    if (mode === "lens-power")
      return <div className="p-4 bg-gray-900/60 rounded-xl border border-gray-800">{S({ label: "Focal Length (f in cm, +/−)", val: lpF, min: -100, max: 100, step: 5, set: v => v !== 0 && setLpF(v), unit: " cm", color: "#22c55e" })}</div>;

    if (mode === "simple-microscope")
      return <div className="p-4 bg-gray-900/60 rounded-xl border border-gray-800 grid grid-cols-2 gap-3">{S({ label: "Focal Length (f)", val: smF, min: 20, max: 100, set: setSmF, unit: "px", color: "#3b82f6" })}{S({ label: "Object Distance (u < f)", val: smU, min: 10, max: smF - 3, set: setSmU, unit: "px", color: "#f97316" })}</div>;

    return null;
  };

  return (
    <div className="space-y-4">
      <canvas ref={canvasRef} width={W} height={H}
        className="w-full rounded-2xl border border-gray-800"
        style={{ maxHeight: 420, objectFit: "contain" }} />
      {ctrl()}
    </div>
  );
}
