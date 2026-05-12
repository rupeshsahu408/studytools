import { useState, useEffect, useRef, useCallback } from "react";

const W = 720, H = 400, CX = W / 2, CY = H / 2;

interface Props {
  mode?: string;
  onContextChange?: (ctx: string) => void;
  [key: string]: any;
}

// ─── Drawing Utilities ────────────────────────────────────────────────────────
function bg(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#050d1a";
  ctx.fillRect(0, 0, W, H);
}

function txt(
  ctx: CanvasRenderingContext2D, s: string, x: number, y: number,
  color = "#94a3b8", size = 11, bold = false, align: CanvasTextAlign = "left"
) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = `${bold ? "bold " : ""}${size}px sans-serif`;
  ctx.textAlign = align;
  ctx.fillText(s, x, y);
  ctx.restore();
}

function infoPanel(ctx: CanvasRenderingContext2D, lines: string[], x: number, y: number, w = 235) {
  const lh = 16;
  const h = lines.length * lh + 14;
  ctx.save();
  ctx.fillStyle = "rgba(2,8,20,0.93)";
  ctx.strokeStyle = "rgba(56,189,248,0.28)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  (ctx as any).roundRect(x, y, w, h, 7);
  ctx.fill(); ctx.stroke();
  lines.forEach((line, i) => {
    ctx.fillStyle = i === 0 ? "#38bdf8" : "#94a3b8";
    ctx.font = `${i === 0 ? "bold " : ""}10.5px sans-serif`;
    ctx.fillText(line, x + 8, y + 12 + i * lh);
  });
  ctx.restore();
}

function sphere(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, baseColor: string, alpha = 1) {
  if (r <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  const g = ctx.createRadialGradient(x - r * 0.32, y - r * 0.28, 0, x, y, r);
  g.addColorStop(0, "rgba(255,255,255,0.72)");
  g.addColorStop(0.38, baseColor);
  g.addColorStop(1, "rgba(0,0,0,0.48)");
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = `${baseColor}66`;
  ctx.lineWidth = 0.8;
  ctx.stroke();
  ctx.restore();
}

function label(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, color = "#38bdf8") {
  ctx.save();
  ctx.fillStyle = "rgba(2,8,20,0.82)";
  ctx.beginPath();
  (ctx as any).roundRect(x - 2, y - 10, ctx.measureText(s).width + 8, 14, 3);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.font = "9px sans-serif";
  ctx.fillText(s, x + 2, y);
  ctx.restore();
}

// ─── Isometric Projection ─────────────────────────────────────────────────────
const ANG = Math.PI / 6;

function toIso(gx: number, gy: number, gz: number, ox: number, oy: number, sc: number) {
  return {
    x: ox + (gx - gz) * sc * Math.cos(ANG),
    y: oy - gy * sc + (gx + gz) * sc * Math.sin(ANG),
  };
}

function isoLine(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number, z1: number,
  x2: number, y2: number, z2: number,
  ox: number, oy: number, sc: number,
  color: string, lw = 1.5, dashed = false
) {
  const a = toIso(x1, y1, z1, ox, oy, sc);
  const b = toIso(x2, y2, z2, ox, oy, sc);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  if (dashed) ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  ctx.restore();
}

function drawCubeEdges(ctx: CanvasRenderingContext2D, ox: number, oy: number, sc: number, color = "rgba(56,189,248,0.45)") {
  const edges: [number, number, number, number, number, number][] = [
    [0,0,0,1,0,0],[0,0,0,0,1,0],[0,0,0,0,0,1],
    [1,0,0,1,1,0],[1,0,0,1,0,1],
    [0,1,0,1,1,0],[0,1,0,0,1,1],
    [0,0,1,1,0,1],[0,0,1,0,1,1],
    [1,1,0,1,1,1],[1,0,1,1,1,1],[0,1,1,1,1,1],
  ];
  edges.forEach(([x1,y1,z1,x2,y2,z2]) => isoLine(ctx, x1,y1,z1, x2,y2,z2, ox, oy, sc, color));
}

// ─── Ionic crystal lattice helper (2D schematic) ──────────────────────────────
function drawIonicLattice(
  ctx: CanvasRenderingContext2D,
  cols: number, rows: number,
  cx: number, cy: number, spacing: number,
  colorA: string, colorB: string,
  rA: number, rB: number,
  labelA: string, labelB: string,
  vacancies: [number,number][] = [],
  displaced: [number,number,number,number] | null = null,
  highlight: [number,number] | null = null,
  foreign: [number,number] | null = null,
  foreignColor = "#f59e0b"
) {
  const startX = cx - ((cols - 1) * spacing) / 2;
  const startY = cy - ((rows - 1) * spacing) / 2;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = startX + c * spacing;
      const y = startY + r * spacing;
      const isA = (r + c) % 2 === 0;
      const color = isA ? colorA : colorB;
      const lbl = isA ? labelA : labelB;
      const rad = isA ? rA : rB;
      const isVacant = vacancies.some(([vc, vr]) => vc === c && vr === r);
      const isForeign = foreign && foreign[0] === c && foreign[1] === r;
      const isHighlight = highlight && highlight[0] === c && highlight[1] === r;

      if (isVacant) {
        ctx.save();
        ctx.strokeStyle = "#ef4444";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 3]);
        ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
        txt(ctx, "✕", x - 5, y + 4, "#ef4444", 11, true);
      } else if (isForeign) {
        sphere(ctx, x, y, rad * 1.1, foreignColor);
        txt(ctx, "Ca²⁺", x + rad + 2, y + 3, foreignColor, 8, true);
      } else {
        sphere(ctx, x, y, rad, isHighlight ? "#fbbf24" : color);
        txt(ctx, lbl, x - rad * 0.5, y + 3, "#050d1a", 8, true);
      }
    }
  }
  if (displaced) {
    const [fromC, fromR, toX, toY] = displaced;
    const x = startX + fromC * spacing;
    const y = startY + fromR * spacing;
    ctx.save();
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.arc(x, y, rA, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(toX, toY);
    ctx.strokeStyle = "#fbbf24";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
    sphere(ctx, toX, toY, rA * 0.85, colorA);
    txt(ctx, "Ag⁺", toX + 8, toY + 3, "#fbbf24", 8, true);
    txt(ctx, "Void (interstitial)", toX + 5, toY - 10, "#fbbf24", 8);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── MODE RENDERERS ───────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

function renderCrystallineVsAmorphous(ctx: CanvasRenderingContext2D, t: number) {
  bg(ctx);
  const midX = W / 2;
  ctx.save();
  ctx.strokeStyle = "rgba(56,189,248,0.25)"; ctx.lineWidth = 1;
  ctx.setLineDash([6, 5]);
  ctx.beginPath(); ctx.moveTo(midX, 0); ctx.lineTo(midX, H); ctx.stroke();
  ctx.restore();

  // Left: Crystalline (ordered grid)
  txt(ctx, "Crystalline Solid", 20, 28, "#38bdf8", 13, true);
  txt(ctx, "Regular, long-range order", 20, 46, "#64748b", 10);
  const spacing = 52;
  const cols = 5, rows = 6;
  const startX = 55, startY = 68;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = startX + c * spacing;
      const y = startY + r * spacing;
      const jx = Math.sin(t * 1.5 + r + c) * 1.2;
      const jy = Math.cos(t * 1.2 + r * 1.3 + c) * 1.2;
      sphere(ctx, x + jx, y + jy, 16, "#3b82f6");
      if (c < cols - 1) {
        ctx.save(); ctx.strokeStyle = "rgba(59,130,246,0.35)"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + spacing, y); ctx.stroke(); ctx.restore();
      }
      if (r < rows - 1) {
        ctx.save(); ctx.strokeStyle = "rgba(59,130,246,0.35)"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + spacing); ctx.stroke(); ctx.restore();
      }
    }
  }

  // Right: Amorphous (random positions, stored deterministically)
  txt(ctx, "Amorphous Solid", midX + 15, 28, "#f59e0b", 13, true);
  txt(ctx, "Random, short-range order only", midX + 15, 46, "#64748b", 10);
  const rng = (seed: number) => {
    const x = Math.sin(seed) * 43758.5453;
    return x - Math.floor(x);
  };
  const numAmorphous = 28;
  for (let i = 0; i < numAmorphous; i++) {
    const bx = midX + 20 + rng(i * 17.3) * (W / 2 - 40);
    const by = 62 + rng(i * 13.7) * (H - 80);
    const jx = Math.sin(t * 1.8 + i * 2.1) * 2.5;
    const jy = Math.cos(t * 1.4 + i * 1.7) * 2.5;
    sphere(ctx, bx + jx, by + jy, 16, "#f59e0b");
  }

  infoPanel(ctx, [
    "Crystalline vs Amorphous",
    "Crystalline: sharp melting point",
    "Crystalline: anisotropic properties",
    "Amorphous: no definite melting pt",
    "Amorphous: isotropic (glass, rubber)",
    "eg. Quartz (crystal) vs Glass (amor.)",
  ], 10, H - 105, 250);
}

// ─── Unit Cell Isometric Views ────────────────────────────────────────────────
function renderUnitCellSC(ctx: CanvasRenderingContext2D) {
  bg(ctx);
  const ox = CX - 20, oy = CY + 30, sc = 100;
  drawCubeEdges(ctx, ox, oy, sc);

  const corners: [number,number,number][] = [
    [0,0,0],[1,0,0],[0,1,0],[0,0,1],
    [1,1,0],[1,0,1],[0,1,1],[1,1,1],
  ];
  corners.forEach(([gx,gy,gz]) => {
    const p = toIso(gx, gy, gz, ox, oy, sc);
    sphere(ctx, p.x, p.y, 18, "#3b82f6");
  });

  // Labels for a-edge
  const P = toIso(0,0,0,ox,oy,sc), Q = toIso(1,0,0,ox,oy,sc);
  ctx.save(); ctx.strokeStyle = "#fbbf24"; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(P.x, P.y + 28); ctx.lineTo(Q.x, Q.y + 28); ctx.stroke();
  ctx.restore();
  txt(ctx, "a", (P.x + Q.x) / 2 - 4, P.y + 42, "#fbbf24", 12, true);
  txt(ctx, "r = a/2", (P.x + Q.x) / 2 - 20, P.y + 56, "#94a3b8", 10);

  infoPanel(ctx, [
    "Simple Cubic (SC) Unit Cell",
    "Atoms at 8 corners only",
    "Atoms per cell = 8 × (1/8) = 1",
    "Coordination Number = 6",
    "Relation: a = 2r",
    "Packing Efficiency = 52.4%",
    "Example: Polonium (Po)",
  ], W - 250, 10, 240);

  txt(ctx, "Simple Cubic Unit Cell", 15, 25, "#38bdf8", 15, true);
  txt(ctx, "Each corner atom shared by 8 unit cells", 15, 45, "#64748b", 10);
}

function renderUnitCellBCC(ctx: CanvasRenderingContext2D) {
  bg(ctx);
  const ox = CX - 20, oy = CY + 30, sc = 100;
  drawCubeEdges(ctx, ox, oy, sc);

  const corners: [number,number,number][] = [
    [0,0,0],[1,0,0],[0,1,0],[0,0,1],
    [1,1,0],[1,0,1],[0,1,1],[1,1,1],
  ];
  corners.forEach(([gx,gy,gz]) => {
    const p = toIso(gx, gy, gz, ox, oy, sc);
    sphere(ctx, p.x, p.y, 16, "#3b82f6");
  });

  // Body center — highlighted
  const bc = toIso(0.5, 0.5, 0.5, ox, oy, sc);
  sphere(ctx, bc.x, bc.y, 22, "#f59e0b");
  txt(ctx, "Centre atom", bc.x + 25, bc.y + 4, "#f59e0b", 9, true);

  // Body diagonal
  const a = toIso(0,0,0,ox,oy,sc), b = toIso(1,1,1,ox,oy,sc);
  ctx.save(); ctx.strokeStyle = "rgba(245,158,11,0.5)"; ctx.lineWidth = 1;
  ctx.setLineDash([4,3]);
  ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke();
  ctx.restore();

  infoPanel(ctx, [
    "Body-Centred Cubic (BCC)",
    "Corners (8) + 1 body-centre atom",
    "Atoms/cell = 8×(1/8) + 1 = 2",
    "Coordination Number = 8",
    "Relation: 4r = a√3",
    "Packing Efficiency = 68%",
    "Examples: Na, K, Fe, Cr, W",
  ], W - 250, 10, 240);

  txt(ctx, "Body-Centred Cubic (BCC) Unit Cell", 15, 25, "#38bdf8", 15, true);
  txt(ctx, "Centre atom fully belongs to this unit cell", 15, 45, "#64748b", 10);
}

function renderUnitCellFCC(ctx: CanvasRenderingContext2D) {
  bg(ctx);
  const ox = CX - 20, oy = CY + 30, sc = 100;
  drawCubeEdges(ctx, ox, oy, sc);

  const corners: [number,number,number][] = [
    [0,0,0],[1,0,0],[0,1,0],[0,0,1],
    [1,1,0],[1,0,1],[0,1,1],[1,1,1],
  ];
  corners.forEach(([gx,gy,gz]) => {
    const p = toIso(gx, gy, gz, ox, oy, sc);
    sphere(ctx, p.x, p.y, 14, "#3b82f6");
  });

  // Face centres — shown in distinct color
  const faces: [number,number,number][] = [
    [0.5,0.5,0],[0.5,0,0.5],[0,0.5,0.5],
    [0.5,0.5,1],[0.5,1,0.5],[1,0.5,0.5],
  ];
  faces.forEach(([gx,gy,gz]) => {
    const p = toIso(gx, gy, gz, ox, oy, sc);
    sphere(ctx, p.x, p.y, 20, "#22c55e");
  });

  const fc = toIso(0.5,0.5,0,ox,oy,sc);
  txt(ctx, "Face-centre atom\n(shared by 2 cells)", fc.x + 22, fc.y - 10, "#22c55e", 9);

  infoPanel(ctx, [
    "Face-Centred Cubic (FCC) / CCP",
    "Corners + 6 face-centre atoms",
    "Atoms/cell = 8×(1/8) + 6×(1/2) = 4",
    "Coordination Number = 12",
    "Relation: 4r = a√2",
    "Packing Efficiency = 74% (max)",
    "Examples: Cu, Ag, Au, Al, Ni",
  ], W - 250, 10, 240);

  txt(ctx, "Face-Centred Cubic (FCC) Unit Cell", 15, 25, "#38bdf8", 15, true);
  txt(ctx, "Each face atom shared between 2 unit cells", 15, 45, "#64748b", 10);
}

function renderUnitCellComparison(ctx: CanvasRenderingContext2D) {
  bg(ctx);
  txt(ctx, "Unit Cell Comparison", CX, 22, "#38bdf8", 14, true, "center");

  const cells: { name: string; atoms: number; cn: number; eff: string; color: string; ox: number }[] = [
    { name: "Simple Cubic", atoms: 1, cn: 6, eff: "52.4%", color: "#3b82f6", ox: 130 },
    { name: "BCC", atoms: 2, cn: 8, eff: "68%", color: "#f59e0b", ox: CX },
    { name: "FCC / CCP", atoms: 4, cn: 12, eff: "74%", color: "#22c55e", ox: 590 },
  ];

  cells.forEach(({ name, atoms, cn, eff, color, ox }) => {
    const oy = CY + 10, sc = 52;
    drawCubeEdges(ctx, ox, oy, sc, `${color}55`);

    // Corners
    const corners: [number,number,number][] = [
      [0,0,0],[1,0,0],[0,1,0],[0,0,1],
      [1,1,0],[1,0,1],[0,1,1],[1,1,1],
    ];
    corners.forEach(([gx,gy,gz]) => {
      const p = toIso(gx, gy, gz, ox, oy, sc);
      sphere(ctx, p.x, p.y, 9, color);
    });

    if (atoms >= 2) {
      const bc = toIso(0.5,0.5,0.5,ox,oy,sc);
      sphere(ctx, bc.x, bc.y, 12, color);
    }
    if (atoms >= 4) {
      const faces: [number,number,number][] = [
        [0.5,0.5,0],[0.5,0,0.5],[0,0.5,0.5],
        [0.5,0.5,1],[0.5,1,0.5],[1,0.5,0.5],
      ];
      faces.forEach(([gx,gy,gz]) => {
        const p = toIso(gx, gy, gz, ox, oy, sc);
        sphere(ctx, p.x, p.y, 11, color);
      });
    }

    const top = toIso(0.5,1.2,0.5,ox,oy,sc);
    txt(ctx, name, top.x, top.y - 15, color, 10, true, "center");
    txt(ctx, `${atoms} atom${atoms > 1 ? "s" : ""}`, ox, oy + 78, "#94a3b8", 9, false, "center");
    txt(ctx, `CN = ${cn}`, ox, oy + 90, "#94a3b8", 9, false, "center");
    txt(ctx, `η = ${eff}`, ox, oy + 102, color, 9, true, "center");
  });
}

// ─── Packing Efficiency ───────────────────────────────────────────────────────
function renderPackingEfficiency(ctx: CanvasRenderingContext2D, type: string) {
  bg(ctx);
  const configs: Record<string, { eff: number; rel: string; color: string; title: string; example: string }> = {
    sc:  { eff: 52.4, rel: "a = 2r", color: "#3b82f6", title: "Simple Cubic (SC)", example: "Polonium (Po)" },
    bcc: { eff: 68.0, rel: "4r = a√3", color: "#f59e0b", title: "Body-Centred Cubic (BCC)", example: "Na, Fe, Cr" },
    fcc: { eff: 74.0, rel: "4r = a√2", color: "#22c55e", title: "Face-Centred Cubic (FCC/CCP)", example: "Cu, Ag, Au, Al" },
  };
  const c = configs[type] || configs.sc;

  txt(ctx, c.title, CX, 25, c.color, 14, true, "center");
  txt(ctx, `Packing Efficiency = ${c.eff}%`, CX, 44, "#e2e8f0", 11, false, "center");

  // Visual: show how atoms touch
  if (type === "sc") {
    // 2D: atoms touching along edge
    const r = 55;
    sphere(ctx, CX - r, CY, r, c.color, 0.85);
    sphere(ctx, CX + r, CY, r, c.color, 0.85);
    ctx.save(); ctx.strokeStyle = "#fbbf24"; ctx.lineWidth = 1.5; ctx.setLineDash([4,3]);
    ctx.beginPath(); ctx.moveTo(CX - r, CY); ctx.lineTo(CX + r, CY); ctx.stroke();
    ctx.restore();
    txt(ctx, "2r = a", CX, CY + r + 20, "#fbbf24", 11, true, "center");
    txt(ctx, "Atoms touch along cube edge", CX, CY + r + 35, "#64748b", 9, false, "center");
  } else if (type === "bcc") {
    // Show atoms touching along body diagonal
    const r = 40;
    sphere(ctx, CX - 70, CY + 30, r, c.color, 0.7);
    sphere(ctx, CX, CY - 20, r, c.color, 1);
    sphere(ctx, CX + 70, CY + 30, r, c.color, 0.7);
    ctx.save(); ctx.strokeStyle = "#fbbf24"; ctx.lineWidth = 1.5; ctx.setLineDash([4,3]);
    ctx.beginPath(); ctx.moveTo(CX - 70, CY + 30); ctx.lineTo(CX + 70, CY + 30); ctx.stroke();
    ctx.restore();
    txt(ctx, "4r = a√3", CX, CY + 90, "#fbbf24", 11, true, "center");
    txt(ctx, "Atoms touch along body diagonal", CX, CY + 105, "#64748b", 9, false, "center");
  } else {
    // FCC: atoms touch along face diagonal
    const r = 40;
    sphere(ctx, CX - 75, CY, r, c.color, 0.8);
    sphere(ctx, CX, CY, r, c.color, 1);
    sphere(ctx, CX + 75, CY, r, c.color, 0.8);
    sphere(ctx, CX, CY - 75, r, c.color, 0.7);
    sphere(ctx, CX, CY + 75, r, c.color, 0.7);
    ctx.save(); ctx.strokeStyle = "#fbbf24"; ctx.lineWidth = 1.5; ctx.setLineDash([4,3]);
    ctx.beginPath(); ctx.moveTo(CX - 75, CY); ctx.lineTo(CX + 75, CY); ctx.stroke();
    ctx.restore();
    txt(ctx, "4r = a√2", CX, CY + 130, "#fbbf24", 11, true, "center");
    txt(ctx, "Atoms touch along face diagonal", CX, CY + 145, "#64748b", 9, false, "center");
  }

  // Efficiency bar on right
  const barX = W - 100, barY = 60, barW = 22, barH = 280;
  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,0.07)"; ctx.fillRect(barX, barY, barW, barH);
  const fillH = barH * (c.eff / 100);
  ctx.fillStyle = c.color;
  ctx.fillRect(barX, barY + barH - fillH, barW, fillH);
  ctx.strokeStyle = "rgba(255,255,255,0.2)"; ctx.lineWidth = 1;
  ctx.strokeRect(barX, barY, barW, barH);
  ctx.restore();
  txt(ctx, `${c.eff}%`, barX + barW / 2, barY + barH - fillH - 8, c.color, 11, true, "center");
  txt(ctx, "η", barX + barW / 2, barY + barH + 14, "#64748b", 10, false, "center");

  infoPanel(ctx, [
    `${c.title}`,
    `η = (vol of atoms / vol of cell) × 100`,
    `Relation: ${c.rel}`,
    `Efficiency: ${c.eff}%`,
    `Example: ${c.example}`,
  ], 10, H - 90, 240);
}

// ─── 2D Packing ───────────────────────────────────────────────────────────────
function render2DPacking(ctx: CanvasRenderingContext2D, mode: "square" | "hex") {
  bg(ctx);
  const r = 28;
  const isHex = mode === "hex";
  txt(ctx, isHex ? "Hexagonal Close Packing (2D)" : "Square Close Packing (2D)",
    CX, 25, "#38bdf8", 13, true, "center");

  if (!isHex) {
    // Square packing
    const cols = 8, rows = 7;
    const sp = r * 2;
    const startX = CX - ((cols - 1) * sp) / 2;
    const startY = 60;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        sphere(ctx, startX + col * sp, startY + row * sp, r, "#3b82f6");
      }
    }
    infoPanel(ctx, [
      "Square Close Packing (2D)",
      "Coordination number = 4",
      "AAAA... arrangement (all rows aligned)",
      "Packing efficiency ≈ 78.5%",
      "Atoms: one above the other",
    ], 10, H - 90, 250);
    txt(ctx, "CN = 4", CX, H - 18, "#f59e0b", 11, true, "center");
  } else {
    // Hexagonal packing
    const cols = 9, rows = 7;
    const sp = r * 2;
    const startX = CX - ((cols - 1) * sp) / 2;
    const startY = 58;
    for (let row = 0; row < rows; row++) {
      const offset = (row % 2 === 1) ? r : 0;
      const c = (row % 2 === 1) ? cols - 1 : cols;
      for (let col = 0; col < c; col++) {
        sphere(ctx, startX + offset + col * sp, startY + row * r * 1.73, r, "#22c55e");
      }
    }
    infoPanel(ctx, [
      "Hexagonal Close Packing (2D)",
      "Coordination number = 6",
      "ABAB... arrangement (rows offset)",
      "Packing efficiency ≈ 90.7%",
      "More efficient than square",
    ], 10, H - 90, 250);
    txt(ctx, "CN = 6", CX, H - 18, "#f59e0b", 11, true, "center");
  }
}

// ─── HCP vs CCP Stacking ──────────────────────────────────────────────────────
function renderHCPvsCCP(ctx: CanvasRenderingContext2D, t: number) {
  bg(ctx);
  txt(ctx, "3D Close Packing: HCP vs CCP", CX, 22, "#38bdf8", 13, true, "center");
  const midX = W / 2;
  ctx.save();
  ctx.strokeStyle = "rgba(56,189,248,0.2)"; ctx.lineWidth = 1; ctx.setLineDash([5,5]);
  ctx.beginPath(); ctx.moveTo(midX, 35); ctx.lineTo(midX, H - 10); ctx.stroke();
  ctx.restore();

  const r = 20;
  const layerColors: Record<string, string> = { A: "#3b82f6", B: "#22c55e", C: "#a78bfa" };

  // Left: HCP (ABAB)
  txt(ctx, "HCP — ABAB Stacking", 80, 42, "#3b82f6", 11, true, "center");
  const hcpLayers = ["A","B","A","B","A"];
  hcpLayers.forEach((lyr, li) => {
    const y = 75 + li * 58;
    const offset = (lyr === "B") ? r : 0;
    const c = layerColors[lyr];
    txt(ctx, `Layer ${lyr}`, 18, y + 6, c, 9, true);
    const alpha = li === Math.floor((t / 2) % 5) ? 1 : 0.5;
    for (let i = 0; i < 5; i++) {
      sphere(ctx, 48 + offset + i * r * 2, y, r - 2, c, alpha);
    }
  });
  txt(ctx, "3rd layer directly\nabove 1st (A=A)", 15, 375, "#f59e0b", 9);

  // Right: CCP (ABCABC)
  txt(ctx, "CCP/FCC — ABCABC Stacking", W - 80, 42, "#a78bfa", 11, true, "center");
  const ccpLayers = ["A","B","C","A","B"];
  ccpLayers.forEach((lyr, li) => {
    const y = 75 + li * 58;
    const off = lyr === "B" ? r : lyr === "C" ? r * 2 : 0;
    const c = layerColors[lyr];
    const alpha = li === Math.floor((t / 2 + 2) % 5) ? 1 : 0.5;
    txt(ctx, `Layer ${lyr}`, midX + 8, y + 6, c, 9, true);
    for (let i = 0; i < 4; i++) {
      sphere(ctx, midX + 28 + off + i * r * 2, y, r - 2, c, alpha);
    }
  });
  txt(ctx, "4th layer above 1st\nonly in CCP (A≠A pos)", midX + 10, 370, "#f59e0b", 9);

  infoPanel(ctx, [
    "HCP: Hexagonal Close Packing (ABAB)",
    "CCP: Cubic Close Packing (ABCABC)",
    "Both have CN = 12, eff = 74%",
    "HCP: Mg, Zn, Ti, Co",
    "CCP = FCC: Cu, Ag, Au, Ni",
  ], 10, H - 90, 250);
}

// ─── Voids ────────────────────────────────────────────────────────────────────
function renderTetrahedralVoid(ctx: CanvasRenderingContext2D) {
  bg(ctx);
  txt(ctx, "Tetrahedral Void", CX, 25, "#38bdf8", 14, true, "center");
  const R = 62, voidR = R * 0.225;
  const cx = CX, cy = CY + 20;

  // 4 atoms in tetrahedral arrangement (2D projection)
  const pos = [
    { x: cx, y: cy - R },
    { x: cx - R * 0.87, y: cy + R * 0.5 },
    { x: cx + R * 0.87, y: cy + R * 0.5 },
    { x: cx, y: cy + R * 0.2 },
  ];

  // Draw bonds between all pairs
  for (let i = 0; i < pos.length; i++) {
    for (let j = i + 1; j < pos.length; j++) {
      ctx.save(); ctx.strokeStyle = "rgba(59,130,246,0.3)"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(pos[i].x, pos[i].y); ctx.lineTo(pos[j].x, pos[j].y); ctx.stroke();
      ctx.restore();
    }
  }

  pos.forEach(p => sphere(ctx, p.x, p.y, R, "#3b82f6", 0.72));

  // Void at center
  sphere(ctx, cx, cy, voidR * 2.5, "#f59e0b");
  ctx.save(); ctx.strokeStyle = "#fbbf24"; ctx.lineWidth = 1; ctx.setLineDash([3,3]);
  ctx.beginPath(); ctx.arc(cx, cy, voidR * 2.5, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();

  txt(ctx, "Void", cx - 14, cy + 5, "#050d1a", 9, true);

  infoPanel(ctx, [
    "Tetrahedral Void",
    "Formed by 4 atoms in close-packing",
    "Coordination number = 4",
    "r_void / r_atom = 0.225",
    "Smaller void (c.f. octahedral)",
    "In FCC: 8 T-voids per unit cell",
    "Located at (1/4,1/4,1/4) positions",
  ], W - 255, 10, 245);
}

function renderOctahedralVoid(ctx: CanvasRenderingContext2D) {
  bg(ctx);
  txt(ctx, "Octahedral Void", CX, 25, "#38bdf8", 14, true, "center");
  const R = 55, cx = CX, cy = CY + 20;
  const voidR = R * 0.414;

  // 6 atoms in octahedral arrangement (square cross)
  const pos = [
    { x: cx, y: cy - R * 1.42 },
    { x: cx - R * 1.42, y: cy },
    { x: cx + R * 1.42, y: cy },
    { x: cx, y: cy + R * 1.42 },
    { x: cx - R * 0.9, y: cy - R * 0.5 },
    { x: cx + R * 0.9, y: cy + R * 0.5 },
  ];

  // Connect adjacent atoms
  const bonds = [[0,1],[0,2],[0,4],[0,5],[1,3],[2,3],[1,4],[2,5],[3,4],[3,5],[4,5]];
  bonds.forEach(([a,b]) => {
    ctx.save(); ctx.strokeStyle = "rgba(34,197,94,0.3)"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(pos[a].x, pos[a].y); ctx.lineTo(pos[b].x, pos[b].y); ctx.stroke();
    ctx.restore();
  });

  pos.forEach(p => sphere(ctx, p.x, p.y, R, "#22c55e", 0.72));

  // Void at center
  sphere(ctx, cx, cy, voidR * 2.2, "#f97316");
  txt(ctx, "Void", cx - 14, cy + 4, "#050d1a", 9, true);

  infoPanel(ctx, [
    "Octahedral Void",
    "Formed by 6 atoms in close-packing",
    "Coordination number = 6",
    "r_void / r_atom = 0.414",
    "Larger void (c.f. tetrahedral)",
    "In FCC: 4 O-voids per unit cell",
    "Located at edge centres + body centre",
  ], W - 255, 10, 245);
}

function renderVoidsInFCC(ctx: CanvasRenderingContext2D, showType: "tetrahedral" | "octahedral") {
  bg(ctx);
  const ox = CX - 30, oy = CY + 20, sc = 100;
  drawCubeEdges(ctx, ox, oy, sc);

  // Corners
  const corners: [number,number,number][] = [
    [0,0,0],[1,0,0],[0,1,0],[0,0,1],
    [1,1,0],[1,0,1],[0,1,1],[1,1,1],
  ];
  corners.forEach(([gx,gy,gz]) => {
    const p = toIso(gx, gy, gz, ox, oy, sc);
    sphere(ctx, p.x, p.y, 12, "#3b82f6", 0.7);
  });

  // Face centres
  const faces: [number,number,number][] = [
    [0.5,0.5,0],[0.5,0,0.5],[0,0.5,0.5],
    [0.5,0.5,1],[0.5,1,0.5],[1,0.5,0.5],
  ];
  faces.forEach(([gx,gy,gz]) => {
    const p = toIso(gx, gy, gz, ox, oy, sc);
    sphere(ctx, p.x, p.y, 16, "#3b82f6", 0.85);
  });

  if (showType === "tetrahedral") {
    // 8 tetrahedral voids at (1/4,1/4,1/4) positions
    const tvoids: [number,number,number][] = [
      [0.25,0.25,0.25],[0.75,0.75,0.25],[0.75,0.25,0.75],[0.25,0.75,0.75],
      [0.25,0.25,0.75],[0.75,0.75,0.75],[0.75,0.25,0.25],[0.25,0.75,0.25],
    ];
    tvoids.forEach(([gx,gy,gz]) => {
      const p = toIso(gx, gy, gz, ox, oy, sc);
      sphere(ctx, p.x, p.y, 6, "#f59e0b");
    });
    txt(ctx, "● Tetrahedral voids (8)", W - 230, 160, "#f59e0b", 10, true);
    infoPanel(ctx, [
      "Tetrahedral Voids in FCC",
      "8 T-voids per FCC unit cell",
      "At (1/4,1/4,1/4) and 7 equivalent",
      "r_void = 0.225 × r_atom",
      "ZnS structure uses these voids",
    ], W - 245, H - 100, 235);
  } else {
    // 4 octahedral voids: 1 at body centre + 12 edge centres (each ¼)
    const ovoids: [number,number,number][] = [
      [0.5,0.5,0.5], // body centre
      [0.5,0.5,0],[0.5,0,0.5],[0,0.5,0.5], // edge centres shown
    ];
    ovoids.forEach(([gx,gy,gz], i) => {
      const p = toIso(gx, gy, gz, ox, oy, sc);
      sphere(ctx, p.x, p.y, 8, "#f97316");
      if (i === 0) txt(ctx, "Body centre", p.x + 10, p.y + 3, "#f97316", 8);
    });
    txt(ctx, "● Octahedral voids (4)", W - 230, 160, "#f97316", 10, true);
    infoPanel(ctx, [
      "Octahedral Voids in FCC",
      "4 O-voids per FCC unit cell",
      "1 at body centre + 12 edge (×1/4)",
      "r_void = 0.414 × r_atom",
      "NaCl structure uses these voids",
    ], W - 245, H - 100, 235);
  }

  txt(ctx, `FCC Unit Cell — ${showType === "tetrahedral" ? "Tetrahedral" : "Octahedral"} Voids`,
    15, 25, "#38bdf8", 13, true);
}

// ─── Coordination Number ──────────────────────────────────────────────────────
function renderCoordinationNumber(ctx: CanvasRenderingContext2D, cn: number) {
  bg(ctx);
  txt(ctx, `Coordination Number = ${cn}`, CX, 25, "#38bdf8", 14, true, "center");

  const cx = CX, cy = CY + 20;
  const R = 50, nr = 22;

  if (cn === 4) {
    // Tetrahedral: 1 centre + 4 around
    sphere(ctx, cx, cy, R, "#f59e0b");
    const positions = [
      [cx, cy - R * 2.1], [cx - R * 2.1, cy], [cx + R * 2.1, cy], [cx, cy + R * 2.1],
    ];
    positions.forEach(([x, y]) => {
      ctx.save(); ctx.strokeStyle = "rgba(34,197,94,0.4)"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(x, y); ctx.stroke(); ctx.restore();
      sphere(ctx, x, y, nr, "#22c55e");
    });
    txt(ctx, "CN=4 (Tetrahedral)", CX, H - 40, "#94a3b8", 10, false, "center");
    txt(ctx, "ZnS (Zinc Blende), Diamond", CX, H - 25, "#64748b", 9, false, "center");
  } else if (cn === 6) {
    // Octahedral: 1 centre + 6 around
    sphere(ctx, cx, cy, R, "#f59e0b");
    const positions = [
      [cx, cy - R * 2.2], [cx - R * 2.2, cy], [cx + R * 2.2, cy], [cx, cy + R * 2.2],
      [cx - R * 1.3, cy - R * 1.3], [cx + R * 1.3, cy + R * 1.3],
    ];
    positions.forEach(([x, y]) => {
      ctx.save(); ctx.strokeStyle = "rgba(34,197,94,0.4)"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(x, y); ctx.stroke(); ctx.restore();
      sphere(ctx, x, y, nr, "#22c55e");
    });
    txt(ctx, "CN=6 (Octahedral)", CX, H - 40, "#94a3b8", 10, false, "center");
    txt(ctx, "NaCl, MgO, Simple Cubic", CX, H - 25, "#64748b", 9, false, "center");
  } else if (cn === 8) {
    // Cubic: 8 corners around centre
    sphere(ctx, cx, cy, R, "#f59e0b");
    const d = R * 1.8;
    const positions = [
      [cx-d, cy-d*0.6],[cx+d,cy-d*0.6],[cx-d,cy+d*0.6],[cx+d,cy+d*0.6],
      [cx-d*0.3,cy-d],[cx+d*0.3,cy-d],[cx-d*0.3,cy+d],[cx+d*0.3,cy+d],
    ];
    positions.forEach(([x, y]) => {
      ctx.save(); ctx.strokeStyle = "rgba(34,197,94,0.4)"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(x, y); ctx.stroke(); ctx.restore();
      sphere(ctx, x, y, nr - 3, "#22c55e");
    });
    txt(ctx, "CN=8 (Cubic)", CX, H - 40, "#94a3b8", 10, false, "center");
    txt(ctx, "CsCl, BCC metals (Fe, Na)", CX, H - 25, "#64748b", 9, false, "center");
  } else {
    // CN = 12
    sphere(ctx, cx, cy, R, "#f59e0b");
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const x = cx + Math.cos(angle) * R * 2.3;
      const y = cy + Math.sin(angle) * R * 1.5;
      ctx.save(); ctx.strokeStyle = "rgba(34,197,94,0.4)"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(x, y); ctx.stroke(); ctx.restore();
      sphere(ctx, x, y, nr - 5, "#22c55e");
    }
    txt(ctx, "CN=12 (FCC/HCP)", CX, H - 40, "#94a3b8", 10, false, "center");
    txt(ctx, "Cu, Ag, Au (FCC), Mg, Zn (HCP)", CX, H - 25, "#64748b", 9, false, "center");
  }

  txt(ctx, "Centre atom (yellow)", cx + R + 10, cy - 6, "#f59e0b", 9);
  infoPanel(ctx, [
    `Coordination Number = ${cn}`,
    "No. of nearest neighbours",
    "CN depends on structure type:",
    "SC=6, BCC=8, FCC/HCP=12",
    "Ionic: depends on radius ratio",
  ], 10, 10, 235);
}

// ─── Defects ──────────────────────────────────────────────────────────────────
function renderSchottkyDefect(ctx: CanvasRenderingContext2D) {
  bg(ctx);
  txt(ctx, "Schottky Defect", CX, 25, "#38bdf8", 14, true, "center");

  drawIonicLattice(
    ctx, 7, 6, CX - 30, CY + 15, 58,
    "#3b82f6", "#34d399", 16, 20,
    "Na⁺", "Cl⁻",
    [[2, 1], [4, 2]], // vacancy positions (cation + anion pair)
    null, null, null
  );

  infoPanel(ctx, [
    "Schottky Defect",
    "Equal no. of cation + anion vacancies",
    "Maintained: electrical neutrality",
    "Found in: NaCl, KBr, AgBr",
    "Effect: Density decreases",
    "Effect: Crystal shrinks slightly",
    "Present in: ionic solids (large ions)",
  ], W - 255, 10, 245);
  txt(ctx, "✕ = Missing ions (vacancy pairs)", 15, H - 18, "#ef4444", 10);
}

function renderFrenkelDefect(ctx: CanvasRenderingContext2D) {
  bg(ctx);
  txt(ctx, "Frenkel Defect", CX, 25, "#38bdf8", 14, true, "center");

  // Calculate position of displaced atom
  const cols = 6, rows = 5, spacing = 60;
  const startX = CX - ((cols - 1) * spacing) / 2 - 30;
  const startY = 68;
  const intX = startX + 5 * spacing - 10; // interstitial position
  const intY = startY + 0 * spacing + spacing / 2;

  drawIonicLattice(
    ctx, cols, rows, CX - 30, CY + 15, spacing,
    "#3b82f6", "#34d399", 14, 18,
    "Na⁺", "Cl⁻",
    [[0, 0]], // vacancy where Ag+ was
    [0, 0, intX, intY], // displaced Ag+ to interstitial
    null, null
  );

  infoPanel(ctx, [
    "Frenkel Defect",
    "Smaller ion moves to interstitial site",
    "Original site becomes vacant",
    "Electrical neutrality maintained",
    "Density: unchanged",
    "Found in: AgBr, AgCl, ZnS",
    "Both Schottky + Frenkel in AgBr",
  ], W - 255, 10, 245);
}

function renderMetalExcessDefect(ctx: CanvasRenderingContext2D, t: number) {
  bg(ctx);
  txt(ctx, "Metal Excess Defect — F-Centre (Colour Centre)", CX, 25, "#38bdf8", 13, true, "center");

  // Crystal lattice with anion vacancy containing trapped electron
  const cols = 7, rows = 5, sp = 58;
  const startX = CX - ((cols - 1) * sp) / 2;
  const startY = 62;
  const vacC = 3, vacR = 2; // vacancy at (3,2)

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = startX + c * sp;
      const y = startY + r * sp;
      const isNa = (r + c) % 2 === 0;
      if (c === vacC && r === vacR) {
        // Anion vacancy — trapped electron (F-centre)
        ctx.save();
        ctx.fillStyle = `rgba(251,191,36,${0.2 + 0.2 * Math.sin(t * 3)})`;
        ctx.beginPath(); ctx.arc(x, y, 22, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "#fbbf24"; ctx.lineWidth = 1.5; ctx.setLineDash([3,3]);
        ctx.beginPath(); ctx.arc(x, y, 22, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
        // Glowing electron
        ctx.save();
        ctx.shadowColor = "#fef08a"; ctx.shadowBlur = 12 + 6 * Math.sin(t * 3);
        ctx.fillStyle = "#fef08a";
        ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        txt(ctx, "e⁻", x - 6, y + 4, "#050d1a", 9, true);
        txt(ctx, "F-centre", x - 18, y + 30, "#fbbf24", 8, true);
      } else {
        sphere(ctx, x, y, isNa ? 14 : 18, isNa ? "#3b82f6" : "#34d399");
        txt(ctx, isNa ? "Na⁺" : "Cl⁻", x - 8, y + 4, "#050d1a", 7, true);
      }
    }
  }

  infoPanel(ctx, [
    "Metal Excess Defect (F-Centre)",
    "Anion vacancy traps an extra electron",
    "Electron trapped = F-centre (Farbe)",
    "F-centres absorb visible light → colour",
    "NaCl in Na vapour → yellow colour",
    "KCl in K vapour → violet colour",
    "Excess metal as interstitial atom",
  ], W - 260, 10, 250);
}

function renderMetalDeficiencyDefect(ctx: CanvasRenderingContext2D) {
  bg(ctx);
  txt(ctx, "Metal Deficiency Defect", CX, 25, "#38bdf8", 14, true, "center");

  // FeO lattice where one Fe2+ is replaced by Fe3+, creating cation vacancy
  const cols = 6, rows = 5, sp = 62;
  const startX = CX - ((cols - 1) * sp) / 2;
  const startY = 68;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = startX + c * sp;
      const y = startY + r * sp;
      const isFe = (r + c) % 2 === 0;
      if (c === 2 && r === 1 && isFe) {
        // Fe3+ (compensates missing Fe2+)
        sphere(ctx, x, y, 16, "#f97316");
        txt(ctx, "Fe³⁺", x - 10, y + 4, "#050d1a", 7, true);
        txt(ctx, "+3", x + 14, y - 14, "#f97316", 8, true);
      } else if (c === 3 && r === 3 && isFe) {
        // Missing Fe2+ (vacancy)
        ctx.save();
        ctx.strokeStyle = "#ef4444"; ctx.lineWidth = 1.5; ctx.setLineDash([4,3]);
        ctx.beginPath(); ctx.arc(x, y, 16, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
        txt(ctx, "□", x - 7, y + 5, "#ef4444", 14);
        txt(ctx, "vacancy", x - 18, y + 28, "#ef4444", 7);
      } else {
        const color = isFe ? "#60a5fa" : "#f59e0b";
        sphere(ctx, x, y, isFe ? 14 : 18, color);
        txt(ctx, isFe ? "Fe²⁺" : "O²⁻", x - 10, y + 4, "#050d1a", 7, true);
      }
    }
  }

  infoPanel(ctx, [
    "Metal Deficiency Defect",
    "Cation vacancy to maintain neutrality",
    "Some cations have higher charge",
    "eg. FeO: Fe²⁺ → Fe³⁺ + vacancy",
    "Electrical neutrality maintained",
    "Found in: FeO, FeS, NiO",
    "These are p-type semiconductors",
  ], W - 260, 10, 250);
}

function renderImpurityDefect(ctx: CanvasRenderingContext2D) {
  bg(ctx);
  txt(ctx, "Impurity Defect (Substitutional)", CX, 25, "#38bdf8", 14, true, "center");
  txt(ctx, "CaCl₂ added to NaCl — Ca²⁺ replaces 2 Na⁺, one site left vacant",
    CX, 42, "#64748b", 9, false, "center");

  drawIonicLattice(
    ctx, 7, 5, CX, CY + 20, 60,
    "#3b82f6", "#34d399", 15, 19,
    "Na⁺", "Cl⁻",
    [[5, 0]], // vacancy created
    null, null,
    [3, 2],   // foreign Ca2+ at (3,2)
    "#f59e0b"
  );

  infoPanel(ctx, [
    "Impurity / Substitutional Defect",
    "Foreign ion replaces host ion",
    "Ca²⁺ replaces 2 Na⁺ (charge balance)",
    "One cation site left vacant",
    "Density: slightly changed",
    "Used to make coloured glass",
    "Controls electrical conductivity",
  ], W - 255, 10, 245);
}

// ─── Band Theory ──────────────────────────────────────────────────────────────
function renderBandTheory(ctx: CanvasRenderingContext2D, gapSize: number) {
  bg(ctx);
  const isInsulator = gapSize > 3;
  const isConductor = gapSize < 0.01;
  const title = isConductor ? "Conductor" : isInsulator ? "Insulator" : "Semiconductor";
  const titleColor = isConductor ? "#22c55e" : isInsulator ? "#ef4444" : "#f59e0b";
  txt(ctx, `Band Theory — ${title}`, CX, 25, titleColor, 14, true, "center");

  const bY = 80, bH = 100, bW = 180;

  // Draw three cases side by side
  const cases = [
    { label: "Conductor", x: 90, gap: 0, color: "#22c55e" },
    { label: "Semiconductor", x: CX, gap: 1.5, color: "#f59e0b" },
    { label: "Insulator", x: W - 90, gap: 5, color: "#ef4444" },
  ];

  cases.forEach(({ label, x, gap, color }) => {
    const halfW = bW / 2;
    const overlapY = gap < 0.1 ? bY + bH + 5 : bY + bH + gap * 18;

    // Valence band (filled)
    ctx.save();
    ctx.fillStyle = `${color}55`;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.fillRect(x - halfW, bY, bW, bH);
    ctx.strokeRect(x - halfW, bY, bW, bH);
    ctx.restore();
    txt(ctx, "Valence", x, bY + bH / 2 + 4, "#e2e8f0", 9, true, "center");
    txt(ctx, "Band (filled)", x, bY + bH / 2 + 16, "#94a3b8", 8, false, "center");

    // Conduction band
    const cbY = bY + bH + gap * 18 + (gap < 0.1 ? 0 : 12);
    ctx.save();
    ctx.fillStyle = `${color}18`;
    ctx.strokeStyle = gap < 0.1 ? color : "rgba(255,255,255,0.25)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash(gap > 0.1 ? [4, 3] : []);
    ctx.fillRect(x - halfW, cbY, bW, bH);
    ctx.strokeRect(x - halfW, cbY, bW, bH);
    ctx.restore();
    txt(ctx, "Conduction", x, cbY + bH / 2 + 4, "#94a3b8", 9, true, "center");
    txt(ctx, "Band (empty)", x, cbY + bH / 2 + 16, "#64748b", 8, false, "center");

    // Gap label
    if (gap > 0.1) {
      const midY = (bY + bH + cbY) / 2;
      ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x + halfW + 6, bY + bH); ctx.lineTo(x + halfW + 6, cbY); ctx.stroke();
      ctx.restore();
      txt(ctx, gap > 3 ? "Eg>3eV" : "Eg≈1eV", x + halfW + 10, midY + 4, color, 8);
    } else {
      txt(ctx, "Overlap!", x, bY + bH - 4, color, 8, true, "center");
    }

    txt(ctx, label, x, cbY + bH + 18, color, 10, true, "center");
  });

  // Electron arrow for the selected type
  const selCase = cases.find(c =>
    (gapSize < 0.1 && c.label === "Conductor") ||
    (gapSize > 3 && c.label === "Insulator") ||
    (gapSize >= 0.1 && gapSize <= 3 && c.label === "Semiconductor")
  );
  if (selCase) {
    ctx.save();
    ctx.fillStyle = "#38bdf8";
    ctx.beginPath();
    ctx.arc(selCase.x, bY + bH + 6 - (gapSize < 0.1 ? 0 : 8), 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  infoPanel(ctx, [
    "Band Theory of Solids",
    "Valence band: filled with electrons",
    "Conduction band: electrons flow here",
    "Conductor: bands overlap (Eg ≈ 0)",
    "Semiconductor: small Eg (~1 eV)",
    "Insulator: large Eg (> 3 eV)",
  ], 10, H - 100, 240);
}

// ─── n-type & p-type Semiconductors ──────────────────────────────────────────
function renderNTypeSemiconductor(ctx: CanvasRenderingContext2D) {
  bg(ctx);
  txt(ctx, "n-type Semiconductor — Donor (Phosphorus) Doping", CX, 25, "#38bdf8", 13, true, "center");

  // 5x5 Si lattice, one Si replaced by P
  const sp = 72, cols = 6, rows = 5;
  const startX = CX - ((cols - 1) * sp) / 2;
  const startY = 55;
  const donorC = 3, donorR = 2;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = startX + c * sp;
      const y = startY + r * sp;
      // Draw bonds to right and down
      if (c < cols - 1) {
        ctx.save(); ctx.strokeStyle = "rgba(148,163,184,0.35)"; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + sp, y); ctx.stroke(); ctx.restore();
      }
      if (r < rows - 1) {
        ctx.save(); ctx.strokeStyle = "rgba(148,163,184,0.35)"; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + sp); ctx.stroke(); ctx.restore();
      }
      if (c === donorC && r === donorR) {
        // Phosphorus atom (5 valence electrons, donates 1)
        sphere(ctx, x, y, 22, "#22c55e");
        txt(ctx, "P", x - 5, y + 5, "#050d1a", 11, true);
        txt(ctx, "(5)", x - 7, y + 16, "#050d1a", 7);
        // Extra electron floating
        ctx.save();
        ctx.fillStyle = "#fef08a"; ctx.shadowColor = "#fef08a"; ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.arc(x + 32, y - 22, 7, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        txt(ctx, "e⁻ (extra)", x + 36, y - 30, "#fef08a", 8);
        // Arrow showing free electron
        ctx.save(); ctx.strokeStyle = "#fef08a"; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(x + 22, y - 18); ctx.lineTo(x + 26, y - 22); ctx.stroke();
        ctx.restore();
      } else {
        sphere(ctx, x, y, 20, "#64748b");
        txt(ctx, "Si", x - 7, y + 5, "#e2e8f0", 10, true);
        txt(ctx, "(4)", x - 7, y + 16, "#94a3b8", 7);
      }
    }
  }

  infoPanel(ctx, [
    "n-type Semiconductor",
    "Dopant: Group 15 (P, As, Sb)",
    "Donor impurity — donates 1 e⁻",
    "Majority carriers: electrons (e⁻)",
    "Minority carriers: holes (h⁺)",
    "Fermi level moves toward CB",
    "Examples: P in Si, As in Ge",
  ], W - 255, 10, 245);
}

function renderPTypeSemiconductor(ctx: CanvasRenderingContext2D) {
  bg(ctx);
  txt(ctx, "p-type Semiconductor — Acceptor (Boron) Doping", CX, 25, "#38bdf8", 13, true, "center");

  const sp = 72, cols = 6, rows = 5;
  const startX = CX - ((cols - 1) * sp) / 2;
  const startY = 55;
  const accC = 2, accR = 2;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = startX + c * sp;
      const y = startY + r * sp;
      if (c < cols - 1) {
        ctx.save(); ctx.strokeStyle = "rgba(148,163,184,0.35)"; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + sp, y); ctx.stroke(); ctx.restore();
      }
      if (r < rows - 1) {
        ctx.save(); ctx.strokeStyle = "rgba(148,163,184,0.35)"; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + sp); ctx.stroke(); ctx.restore();
      }
      if (c === accC && r === accR) {
        sphere(ctx, x, y, 22, "#f97316");
        txt(ctx, "B", x - 5, y + 5, "#050d1a", 11, true);
        txt(ctx, "(3)", x - 7, y + 16, "#050d1a", 7);
        // Hole (empty circle with +)
        ctx.save();
        ctx.strokeStyle = "#a78bfa"; ctx.lineWidth = 2;
        ctx.setLineDash([2,2]);
        ctx.beginPath(); ctx.arc(x + 32, y - 22, 7, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
        txt(ctx, "h⁺ (hole)", x + 36, y - 30, "#a78bfa", 8);
      } else {
        sphere(ctx, x, y, 20, "#64748b");
        txt(ctx, "Si", x - 7, y + 5, "#e2e8f0", 10, true);
        txt(ctx, "(4)", x - 7, y + 16, "#94a3b8", 7);
      }
    }
  }

  infoPanel(ctx, [
    "p-type Semiconductor",
    "Dopant: Group 13 (B, Al, Ga)",
    "Acceptor impurity — creates hole",
    "Majority carriers: holes (h⁺)",
    "Minority carriers: electrons (e⁻)",
    "Fermi level moves toward VB",
    "Examples: B in Si, Al in Ge",
  ], W - 255, 10, 245);
}

// ─── Magnetic Properties ──────────────────────────────────────────────────────
function renderMagneticProperties(ctx: CanvasRenderingContext2D, type: string) {
  bg(ctx);
  const configs: Record<string, { label: string; color: string; desc: string[]; spins: string[][] }> = {
    diamagnetic: {
      label: "Diamagnetic",
      color: "#3b82f6",
      desc: ["All electrons paired", "Weakly repelled by field", "No permanent magnetic moment", "eg. H₂O, NaCl, C₆H₆, N₂"],
      spins: [["↑↓","↑↓","↑↓"],["↑↓","↑↓","↑↓"],["↑↓","↑↓","↑↓"]],
    },
    paramagnetic: {
      label: "Paramagnetic",
      color: "#f59e0b",
      desc: ["Some unpaired electrons", "Weakly attracted to field", "Loses magnetism without field", "eg. O₂, Cu²⁺, Fe³⁺, CuO"],
      spins: [["↑↓","↑","↑↓"],["↑","↑↓","↑"],["↑↓","↑","↑↓"]],
    },
    ferromagnetic: {
      label: "Ferromagnetic",
      color: "#ef4444",
      desc: ["Domains permanently aligned", "Strongly attracted to magnet", "Retains magnetism", "eg. Fe, Co, Ni, Gd, CrO₂"],
      spins: [["↑","↑","↑"],["↑","↑","↑"],["↑","↑","↑"]],
    },
    antiferromagnetic: {
      label: "Antiferromagnetic",
      color: "#a78bfa",
      desc: ["Opposing spins cancel out", "Net magnetic moment = 0", "Weakly magnetic overall", "eg. MnO, MnF₂, Cr₂O₃"],
      spins: [["↑","↓","↑"],["↓","↑","↓"],["↑","↓","↑"]],
    },
    ferrimagnetic: {
      label: "Ferrimagnetic",
      color: "#22c55e",
      desc: ["Unequal opposing spins", "Small net magnetic moment", "Weakly magnetic (net ≠ 0)", "eg. Fe₃O₄ (magnetite), ferrites"],
      spins: [["↑↑","↓","↑↑"],["↓","↑↑","↓"],["↑↑","↓","↑↑"]],
    },
  };

  const conf = configs[type] || configs.diamagnetic;
  txt(ctx, conf.label, CX, 25, conf.color, 16, true, "center");

  // Draw atom grid with spin arrows
  const sp = 72, startX = 80, startY = 65;
  conf.spins.forEach((row, r) => {
    row.forEach((spin, c) => {
      const x = startX + c * sp * 1.6;
      const y = startY + r * sp;
      sphere(ctx, x, y, 24, conf.color, 0.7);
      txt(ctx, spin, x - (spin.length > 2 ? 10 : 5), y + 5, "#e2e8f0", 11, true);
    });
  });

  // Info
  conf.desc.forEach((line, i) => {
    txt(ctx, line, 380, 80 + i * 22, i === 0 ? conf.color : "#94a3b8", i === 0 ? 11 : 10, i === 0);
  });

  // External field arrow
  ctx.save();
  ctx.strokeStyle = "#38bdf8"; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(W - 60, 80); ctx.lineTo(W - 60, H - 60); ctx.stroke();
  const arrowX = W - 60;
  ctx.fillStyle = "#38bdf8";
  ctx.beginPath(); ctx.moveTo(arrowX, 80); ctx.lineTo(arrowX - 7, 100); ctx.lineTo(arrowX + 7, 100); ctx.closePath(); ctx.fill();
  ctx.restore();
  txt(ctx, "B", W - 72, 80, "#38bdf8", 12, true);
  txt(ctx, "(external", W - 90, H - 45, "#38bdf8", 8);
  txt(ctx, " field)", W - 90, H - 35, "#38bdf8", 8);

  infoPanel(ctx, [
    conf.label,
    ...conf.desc,
  ], 10, H - 100, 235);
}

// ─── Crystal Structures (NaCl, CsCl, ZnS) ────────────────────────────────────
function renderNaClStructure(ctx: CanvasRenderingContext2D) {
  bg(ctx);
  txt(ctx, "NaCl — Rock Salt Structure", CX, 25, "#38bdf8", 14, true, "center");
  txt(ctx, "FCC of Cl⁻ with Na⁺ in all octahedral voids", CX, 42, "#64748b", 9, false, "center");

  // Draw 2D projection: alternating Na+ and Cl- in square lattice
  const sp = 58, cols = 7, rows = 6;
  const startX = CX - ((cols - 1) * sp) / 2;
  const startY = 60;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = startX + c * sp;
      const y = startY + r * sp;
      // Bond lines
      if (c < cols - 1) { ctx.save(); ctx.strokeStyle = "rgba(148,163,184,0.25)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x+sp,y); ctx.stroke(); ctx.restore(); }
      if (r < rows - 1) { ctx.save(); ctx.strokeStyle = "rgba(148,163,184,0.25)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x,y+sp); ctx.stroke(); ctx.restore(); }
      const isNa = (r + c) % 2 === 0;
      sphere(ctx, x, y, isNa ? 14 : 20, isNa ? "#3b82f6" : "#34d399");
      txt(ctx, isNa ? "Na⁺" : "Cl⁻", x - (isNa ? 9 : 9), y + 4, "#050d1a", isNa ? 7 : 7, true);
    }
  }

  infoPanel(ctx, [
    "NaCl (Rock Salt) Structure",
    "Cl⁻: FCC arrangement",
    "Na⁺: occupies all octahedral voids",
    "Coordination: CN(Na⁺) = CN(Cl⁻) = 6",
    "4 NaCl formula units per unit cell",
    "r⁺/r⁻ = 0.524 (octahedral)",
    "Examples: NaCl, KBr, MgO, CaO",
  ], W - 255, 10, 245);

  // Legend
  sphere(ctx, 30, H - 38, 10, "#3b82f6"); txt(ctx, "Na⁺ (small cation)", 46, H - 34, "#3b82f6", 9);
  sphere(ctx, 30, H - 18, 13, "#34d399"); txt(ctx, "Cl⁻ (large anion)", 46, H - 14, "#34d399", 9);
}

function renderCsClStructure(ctx: CanvasRenderingContext2D) {
  bg(ctx);
  txt(ctx, "CsCl — Caesium Chloride Structure", CX, 25, "#38bdf8", 14, true, "center");
  txt(ctx, "Simple cubic Cl⁻ with Cs⁺ at body centre (CN = 8:8)", CX, 42, "#64748b", 9, false, "center");

  // Show unit cell: 8 Cl- at corners + 1 Cs+ at centre (isometric)
  const ox = CX - 20, oy = CY + 30, sc = 110;
  drawCubeEdges(ctx, ox, oy, sc, "rgba(52,211,153,0.35)");

  // 8 Cl- corners
  const corners: [number,number,number][] = [
    [0,0,0],[1,0,0],[0,1,0],[0,0,1],
    [1,1,0],[1,0,1],[0,1,1],[1,1,1],
  ];
  corners.forEach(([gx,gy,gz]) => {
    const p = toIso(gx, gy, gz, ox, oy, sc);
    sphere(ctx, p.x, p.y, 22, "#34d399");
    txt(ctx, "Cl⁻", p.x - 8, p.y + 4, "#050d1a", 7, true);
  });

  // 1 Cs+ body centre
  const bc = toIso(0.5, 0.5, 0.5, ox, oy, sc);
  sphere(ctx, bc.x, bc.y, 18, "#a78bfa");
  txt(ctx, "Cs⁺", bc.x - 8, bc.y + 4, "#050d1a", 8, true);
  txt(ctx, "Body centre", bc.x + 22, bc.y - 6, "#a78bfa", 8);

  infoPanel(ctx, [
    "CsCl Structure",
    "Cs⁺: 1 at body centre",
    "Cl⁻: 8 at corners (8 × 1/8 = 1)",
    "CN(Cs⁺) = CN(Cl⁻) = 8",
    "1 CsCl formula unit per cell",
    "r⁺/r⁻ = 0.933 (cubic void)",
    "Examples: CsCl, CsBr, TlCl",
  ], W - 250, 10, 240);

  sphere(ctx, 20, H - 40, 12, "#a78bfa"); txt(ctx, "Cs⁺", 36, H - 36, "#a78bfa", 9);
  sphere(ctx, 20, H - 18, 15, "#34d399"); txt(ctx, "Cl⁻", 36, H - 14, "#34d399", 9);
}

function renderZnSStructure(ctx: CanvasRenderingContext2D) {
  bg(ctx);
  txt(ctx, "ZnS — Zinc Blende Structure", CX, 25, "#38bdf8", 14, true, "center");
  txt(ctx, "FCC of S²⁻ with Zn²⁺ in alternate tetrahedral voids (CN = 4:4)", CX, 42, "#64748b", 9, false, "center");

  const ox = CX - 20, oy = CY + 30, sc = 100;
  drawCubeEdges(ctx, ox, oy, sc, "rgba(245,158,11,0.3)");

  // S2- at corners + face centres (FCC)
  const corners: [number,number,number][] = [
    [0,0,0],[1,0,0],[0,1,0],[0,0,1],
    [1,1,0],[1,0,1],[0,1,1],[1,1,1],
  ];
  corners.forEach(([gx,gy,gz]) => {
    const p = toIso(gx, gy, gz, ox, oy, sc);
    sphere(ctx, p.x, p.y, 14, "#f59e0b", 0.8);
  });
  const faces: [number,number,number][] = [
    [0.5,0.5,0],[0.5,0,0.5],[0,0.5,0.5],
    [0.5,0.5,1],[0.5,1,0.5],[1,0.5,0.5],
  ];
  faces.forEach(([gx,gy,gz]) => {
    const p = toIso(gx, gy, gz, ox, oy, sc);
    sphere(ctx, p.x, p.y, 17, "#f59e0b");
  });

  // Zn2+ at 4 of 8 tetrahedral voids (alternate ones)
  const tvoids: [number,number,number][] = [
    [0.25,0.25,0.25],[0.75,0.75,0.25],
    [0.75,0.25,0.75],[0.25,0.75,0.75],
  ];
  tvoids.forEach(([gx,gy,gz]) => {
    const p = toIso(gx, gy, gz, ox, oy, sc);
    sphere(ctx, p.x, p.y, 10, "#22c55e");
    txt(ctx, "Zn", p.x - 7, p.y + 3, "#050d1a", 7, true);
  });

  infoPanel(ctx, [
    "ZnS (Zinc Blende) Structure",
    "S²⁻: FCC arrangement",
    "Zn²⁺: 4 alternate T-voids (of 8)",
    "CN(Zn²⁺) = CN(S²⁻) = 4",
    "4 ZnS formula units per cell",
    "r⁺/r⁻ = 0.40 (tetrahedral void)",
    "Examples: ZnS, CuCl, SiC",
  ], W - 250, 10, 240);

  sphere(ctx, 20, H - 40, 12, "#22c55e"); txt(ctx, "Zn²⁺ (in T-voids)", 36, H - 36, "#22c55e", 9);
  sphere(ctx, 20, H - 18, 14, "#f59e0b"); txt(ctx, "S²⁻ (FCC)", 36, H - 14, "#f59e0b", 9);
}

// ─── Radius Ratio ─────────────────────────────────────────────────────────────
function renderRadiusRatio(ctx: CanvasRenderingContext2D, ratio: number) {
  bg(ctx);
  txt(ctx, "Radius Ratio Rule", CX, 25, "#38bdf8", 14, true, "center");

  const anionR = 80;
  const cationR = Math.min(anionR * ratio, anionR - 4);
  const cx = CX, cy = CY + 10;

  // Anion circle
  sphere(ctx, cx, cy, anionR, "#34d399", 0.3);
  ctx.save(); ctx.strokeStyle = "#34d399"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(cx, cy, anionR, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  txt(ctx, "r⁻ (anion)", cx - 18, cy + 4, "#34d399", 9, false, "center");

  // Cation circle (fitting in void)
  if (cationR > 2) {
    sphere(ctx, cx, cy, cationR, "#3b82f6");
    txt(ctx, "r⁺", cx - 6, cy + 4, "#050d1a", 9, true);
  }

  // Ratio line
  ctx.save();
  ctx.strokeStyle = "#fbbf24"; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + anionR, cy); ctx.stroke();
  ctx.fillStyle = "#fbbf24"; ctx.beginPath(); ctx.arc(cx + anionR, cy, 3, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  txt(ctx, `r⁺/r⁻ = ${ratio.toFixed(3)}`, cx + anionR + 10, cy + 4, "#fbbf24", 10, true);

  // Table of expected structures
  const rows: [string, string, string][] = [
    ["< 0.155", "Linear / 2", "—"],
    ["0.155 – 0.225", "Triangular / 3", "—"],
    ["0.225 – 0.414", "Tetrahedral / 4", "ZnS"],
    ["0.414 – 0.732", "Octahedral / 6", "NaCl"],
    ["> 0.732", "Cubic / 8", "CsCl"],
  ];

  const tX = 20, tY = 75;
  txt(ctx, "r⁺/r⁻ Range", tX, tY, "#38bdf8", 9, true);
  txt(ctx, "CN", tX + 145, tY, "#38bdf8", 9, true);
  txt(ctx, "Structure", tX + 190, tY, "#38bdf8", 9, true);

  rows.forEach(([range, cn, struct], i) => {
    const y = tY + 18 + i * 18;
    const inRange = (
      (i === 0 && ratio < 0.155) ||
      (i === 1 && ratio >= 0.155 && ratio < 0.225) ||
      (i === 2 && ratio >= 0.225 && ratio < 0.414) ||
      (i === 3 && ratio >= 0.414 && ratio < 0.732) ||
      (i === 4 && ratio >= 0.732)
    );
    const c = inRange ? "#fbbf24" : "#64748b";
    if (inRange) {
      ctx.save(); ctx.fillStyle = "rgba(251,191,36,0.12)";
      ctx.fillRect(tX - 4, y - 12, 265, 16); ctx.restore();
    }
    txt(ctx, range, tX, y, c, 9);
    txt(ctx, cn, tX + 145, y, c, 9);
    txt(ctx, struct, tX + 190, y, c, 9);
  });
}

// ─── Density Calculator ───────────────────────────────────────────────────────
function renderDensityCalculator(
  ctx: CanvasRenderingContext2D,
  n: number, M: number, a: number
) {
  bg(ctx);
  txt(ctx, "Unit Cell Density Formula", CX, 25, "#38bdf8", 14, true, "center");

  const Na = 6.022e23;
  const aCm = a * 1e-8; // pm to cm
  const density = (n * M) / (Na * aCm * aCm * aCm);

  // Formula display
  txt(ctx, "d = ", 80, 90, "#e2e8f0", 20, true);
  txt(ctx, "n × M", 138, 80, "#22c55e", 16, true);
  ctx.save(); ctx.strokeStyle = "#e2e8f0"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(130, 86); ctx.lineTo(230, 86); ctx.stroke();
  ctx.restore();
  txt(ctx, "Nₐ × a³", 138, 104, "#f59e0b", 16, true);

  // Values
  txt(ctx, `n = ${n}  (atoms per unit cell)`, 280, 70, "#22c55e", 11);
  txt(ctx, `M = ${M} g/mol  (molar mass)`, 280, 90, "#22c55e", 11);
  txt(ctx, `Nₐ = 6.022 × 10²³ mol⁻¹`, 280, 110, "#f59e0b", 11);
  txt(ctx, `a = ${a} pm = ${a}×10⁻⁸ cm`, 280, 130, "#f59e0b", 11);
  txt(ctx, `a³ = (${a}×10⁻⁸)³ cm³`, 280, 150, "#f59e0b", 11);

  // Result
  ctx.save();
  ctx.fillStyle = "rgba(34,197,94,0.12)";
  ctx.strokeStyle = "#22c55e";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  (ctx as any).roundRect(80, 180, W - 160, 70, 10);
  ctx.fill(); ctx.stroke();
  ctx.restore();

  txt(ctx, `d = (${n} × ${M}) / (6.022×10²³ × (${a}×10⁻⁸)³)`, CX, 205, "#e2e8f0", 11, false, "center");
  txt(ctx, `d = ${density.toFixed(3)} g/cm³`, CX, 232, "#22c55e", 18, true, "center");

  infoPanel(ctx, [
    "Unit Cell Density",
    "n = atoms per unit cell",
    "SC: n=1, BCC: n=2, FCC: n=4",
    "M = molar mass (g/mol)",
    "a = edge length (pm → cm)",
    "Nₐ = Avogadro number",
  ], 10, H - 110, 235);

  // Examples
  txt(ctx, "eg. NaCl: n=4, M=58.5, a=564 pm → d=2.16 g/cm³", CX, H - 18, "#64748b", 9, false, "center");
}

// ─── Solid Types Comparison ───────────────────────────────────────────────────
function renderSolidTypes(ctx: CanvasRenderingContext2D) {
  bg(ctx);
  txt(ctx, "Classification of Crystalline Solids", CX, 22, "#38bdf8", 13, true, "center");

  const types = [
    {
      name: "Ionic", color: "#3b82f6", icon: "⊕⊖",
      bond: "Electrostatic", mp: "High", cond: "Solid: No\nMolten: Yes",
      hard: "Hard, brittle", example: "NaCl, MgO",
    },
    {
      name: "Covalent", color: "#22c55e", icon: "—",
      bond: "Covalent bonds", mp: "Very High", cond: "No (insulator)",
      hard: "Very hard", example: "Diamond, SiC",
    },
    {
      name: "Molecular", color: "#f59e0b", icon: "···",
      bond: "vdW / H-bond", mp: "Low", cond: "No",
      hard: "Soft", example: "Dry ice, Naphthalene",
    },
    {
      name: "Metallic", color: "#a78bfa", icon: "e⁻",
      bond: "Metallic bond", mp: "Moderate-High", cond: "Yes (free e⁻)",
      hard: "Ductile, lustrous", example: "Fe, Cu, Ag",
    },
  ];

  const colW = W / 4;
  types.forEach(({ name, color, icon, bond, mp, cond, hard, example }, i) => {
    const x = colW * i + colW / 2;
    // Header
    ctx.save();
    ctx.fillStyle = `${color}22`;
    ctx.strokeStyle = `${color}66`;
    ctx.lineWidth = 1;
    ctx.fillRect(colW * i + 4, 38, colW - 8, H - 50);
    ctx.strokeRect(colW * i + 4, 38, colW - 8, H - 50);
    ctx.restore();

    txt(ctx, icon, x, 66, color, 16, true, "center");
    txt(ctx, name, x, 85, color, 11, true, "center");
    const props = [
      `Bond: ${bond}`,
      `MP: ${mp}`,
      `Conduct: ${cond}`,
      `Hardness: ${hard}`,
      `eg: ${example}`,
    ];
    props.forEach((p, pi) => {
      txt(ctx, p, colW * i + 10, 105 + pi * 44, "#94a3b8", 8.5);
    });
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

export default function SolidStateEngine({
  mode = "crystalline-vs-amorphous",
  onContextChange,
  ...params
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const frameRef = useRef(0);

  // Interactive state
  const [packType, setPackType] = useState<"sc" | "bcc" | "fcc">("fcc");
  const [packMode2D, setPackMode2D] = useState<"square" | "hex">("hex");
  const [voidType, setVoidType] = useState<"tetrahedral" | "octahedral">("tetrahedral");
  const [cnValue, setCnValue] = useState(6);
  const [magType, setMagType] = useState("ferromagnetic");
  const [bandGap, setBandGap] = useState(1.5);
  const [radiusRatio, setRadiusRatio] = useState(0.524);
  const [densN, setDensN] = useState(4);
  const [densM, setDensM] = useState(58.5);
  const [densA, setDensA] = useState(564);

  const draw = useCallback((t: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    switch (mode) {
      case "crystalline-vs-amorphous": renderCrystallineVsAmorphous(ctx, t); break;
      case "unit-cell-sc":            renderUnitCellSC(ctx); break;
      case "unit-cell-bcc":           renderUnitCellBCC(ctx); break;
      case "unit-cell-fcc":           renderUnitCellFCC(ctx); break;
      case "unit-cell-comparison":    renderUnitCellComparison(ctx); break;
      case "packing-efficiency":      renderPackingEfficiency(ctx, packType); break;
      case "2d-packing":              render2DPacking(ctx, packMode2D); break;
      case "hcp-ccp-stacking":        renderHCPvsCCP(ctx, t); break;
      case "tetrahedral-void":        renderTetrahedralVoid(ctx); break;
      case "octahedral-void":         renderOctahedralVoid(ctx); break;
      case "voids-in-fcc":            renderVoidsInFCC(ctx, voidType); break;
      case "coordination-number":     renderCoordinationNumber(ctx, cnValue); break;
      case "schottky-defect":         renderSchottkyDefect(ctx); break;
      case "frenkel-defect":          renderFrenkelDefect(ctx); break;
      case "metal-excess-defect":     renderMetalExcessDefect(ctx, t); break;
      case "metal-deficiency-defect": renderMetalDeficiencyDefect(ctx); break;
      case "impurity-defect":         renderImpurityDefect(ctx); break;
      case "band-theory":             renderBandTheory(ctx, bandGap); break;
      case "n-type-semiconductor":    renderNTypeSemiconductor(ctx); break;
      case "p-type-semiconductor":    renderPTypeSemiconductor(ctx); break;
      case "magnetic-properties":     renderMagneticProperties(ctx, magType); break;
      case "nacl-structure":          renderNaClStructure(ctx); break;
      case "cscl-structure":          renderCsClStructure(ctx); break;
      case "zns-structure":           renderZnSStructure(ctx); break;
      case "radius-ratio":            renderRadiusRatio(ctx, radiusRatio); break;
      case "density-calculator":      renderDensityCalculator(ctx, densN, densM, densA); break;
      case "solid-types":             renderSolidTypes(ctx); break;
      default:                        renderCrystallineVsAmorphous(ctx, t); break;
    }

    // Update context string for "Explain This"
    if (onContextChange) {
      const contextMap: Record<string, string> = {
        "crystalline-vs-amorphous": "Comparing crystalline (ordered, sharp melting point) vs amorphous (disordered, no sharp melting point) solids",
        "unit-cell-sc": "Simple Cubic unit cell: 1 atom/cell, CN=6, a=2r, efficiency=52.4%",
        "unit-cell-bcc": "BCC unit cell: 2 atoms/cell, CN=8, 4r=a√3, efficiency=68%",
        "unit-cell-fcc": "FCC unit cell: 4 atoms/cell, CN=12, 4r=a√2, efficiency=74%",
        "unit-cell-comparison": "Comparison of SC (1 atom, CN6, 52.4%), BCC (2 atoms, CN8, 68%), FCC (4 atoms, CN12, 74%)",
        "packing-efficiency": `Packing efficiency for ${packType.toUpperCase()}`,
        "2d-packing": `2D ${packMode2D} close packing`,
        "hcp-ccp-stacking": "ABAB stacking (HCP) vs ABCABC stacking (CCP/FCC), both CN=12, efficiency=74%",
        "tetrahedral-void": "Tetrahedral void: formed by 4 atoms, CN=4, r_void/r=0.225",
        "octahedral-void": "Octahedral void: formed by 6 atoms, CN=6, r_void/r=0.414",
        "voids-in-fcc": `${voidType} voids in FCC unit cell`,
        "coordination-number": `Coordination number = ${cnValue} — number of nearest neighbours`,
        "schottky-defect": "Schottky defect: equal no. of cation and anion vacancies, density decreases, found in NaCl, KBr",
        "frenkel-defect": "Frenkel defect: smaller ion displaced to interstitial site, density unchanged, found in AgBr, ZnS",
        "metal-excess-defect": "Metal excess defect: F-centre (trapped electron in anion vacancy), gives color to crystals",
        "metal-deficiency-defect": "Metal deficiency defect: cation vacancy compensated by higher-charge cation (eg. Fe²⁺→Fe³⁺)",
        "impurity-defect": "Impurity substitutional defect: Ca²⁺ replaces 2 Na⁺ creating vacancy for charge balance",
        "band-theory": `Band theory: gap = ${bandGap.toFixed(1)} eV — ${bandGap < 0.1 ? "conductor" : bandGap > 3 ? "insulator" : "semiconductor"}`,
        "n-type-semiconductor": "n-type: Group 15 dopant (P) donates extra electron, majority carriers are electrons",
        "p-type-semiconductor": "p-type: Group 13 dopant (B) creates hole, majority carriers are holes",
        "magnetic-properties": `${magType} material — showing electron spin arrangement`,
        "nacl-structure": "NaCl rock salt structure: FCC of Cl⁻, Na⁺ in octahedral voids, CN=6:6, 4 formula units/cell",
        "cscl-structure": "CsCl structure: Cs⁺ at body centre of Cl⁻ cube, CN=8:8, 1 formula unit/cell",
        "zns-structure": "ZnS zinc blende: FCC of S²⁻, Zn²⁺ in alternate tetrahedral voids, CN=4:4",
        "radius-ratio": `Radius ratio r⁺/r⁻ = ${radiusRatio.toFixed(3)} — determines coordination number and crystal structure`,
        "density-calculator": `Density = (${densN} × ${densM}) / (6.022×10²³ × (${densA}×10⁻⁸)³)`,
        "solid-types": "4 types of crystalline solids: ionic (high MP, brittle), covalent (very high MP), molecular (low MP), metallic (ductile)",
      };
      onContextChange(contextMap[mode] || mode);
    }
  }, [mode, packType, packMode2D, voidType, cnValue, magType, bandGap, radiusRatio, densN, densM, densA, onContextChange]);

  // Animation loop
  useEffect(() => {
    const loop = () => {
      frameRef.current += 0.016;
      draw(frameRef.current);
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  // ─── Controls per mode ───────────────────────────────────────────────────
  const renderControls = () => {
    const btn = (label: string, active: boolean, onClick: () => void) => (
      <button
        key={label}
        onClick={onClick}
        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
          active
            ? "bg-cyan-600 text-white shadow-md"
            : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200"
        }`}
      >
        {label}
      </button>
    );

    const slider = (label: string, val: number, min: number, max: number, step: number, set: (v: number) => void, disp?: string) => (
      <div key={label} className="flex items-center gap-3 flex-1">
        <span className="text-xs text-gray-400 whitespace-nowrap w-32">{label}</span>
        <input
          type="range" min={min} max={max} step={step} value={val}
          onChange={e => set(parseFloat(e.target.value))}
          className="flex-1 accent-cyan-500"
        />
        <span className="text-xs text-cyan-400 font-bold w-16 text-right">{disp ?? val}</span>
      </div>
    );

    if (mode === "packing-efficiency") return (
      <div className="flex gap-2 justify-center flex-wrap">
        {btn("Simple Cubic (52.4%)", packType === "sc", () => setPackType("sc"))}
        {btn("BCC (68%)", packType === "bcc", () => setPackType("bcc"))}
        {btn("FCC/CCP (74%)", packType === "fcc", () => setPackType("fcc"))}
      </div>
    );

    if (mode === "2d-packing") return (
      <div className="flex gap-2 justify-center">
        {btn("Square Packing (CN=4)", packMode2D === "square", () => setPackMode2D("square"))}
        {btn("Hexagonal Packing (CN=6)", packMode2D === "hex", () => setPackMode2D("hex"))}
      </div>
    );

    if (mode === "voids-in-fcc") return (
      <div className="flex gap-2 justify-center">
        {btn("Tetrahedral Voids (8 per cell)", voidType === "tetrahedral", () => setVoidType("tetrahedral"))}
        {btn("Octahedral Voids (4 per cell)", voidType === "octahedral", () => setVoidType("octahedral"))}
      </div>
    );

    if (mode === "coordination-number") return (
      <div className="flex gap-2 justify-center flex-wrap">
        {([4, 6, 8, 12] as const).map(n =>
          btn(`CN = ${n}`, cnValue === n, () => setCnValue(n))
        )}
      </div>
    );

    if (mode === "magnetic-properties") return (
      <div className="flex gap-2 justify-center flex-wrap">
        {["diamagnetic","paramagnetic","ferromagnetic","antiferromagnetic","ferrimagnetic"].map(t =>
          btn(t.charAt(0).toUpperCase() + t.slice(1), magType === t, () => setMagType(t))
        )}
      </div>
    );

    if (mode === "band-theory") return (
      <div className="flex items-center gap-4 px-4">
        {slider("Band Gap (eV)", bandGap, 0, 6, 0.1, setBandGap,
          `${bandGap.toFixed(1)} eV — ${bandGap < 0.1 ? "Conductor" : bandGap > 3 ? "Insulator" : "Semiconductor"}`)}
      </div>
    );

    if (mode === "radius-ratio") return (
      <div className="flex items-center gap-4 px-4">
        {slider("r⁺/r⁻ ratio", radiusRatio, 0.05, 1.0, 0.01, setRadiusRatio, radiusRatio.toFixed(3))}
      </div>
    );

    if (mode === "density-calculator") return (
      <div className="flex flex-wrap gap-4 px-4">
        {slider("n (atoms/cell)", densN, 1, 4, 1, setDensN)}
        {slider("M (g/mol)", densM, 10, 200, 0.5, setDensM, `${densM} g/mol`)}
        {slider("a (pm)", densA, 200, 700, 1, setDensA, `${densA} pm`)}
      </div>
    );

    return null;
  };

  const hasControls = [
    "packing-efficiency", "2d-packing", "voids-in-fcc",
    "coordination-number", "magnetic-properties",
    "band-theory", "radius-ratio", "density-calculator",
  ].includes(mode);

  return (
    <div className="flex flex-col gap-3">
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        style={{ width: "100%", height: "auto", display: "block", borderRadius: 10 }}
      />
      {hasControls && (
        <div className="bg-gray-900/60 border border-gray-800 rounded-xl px-4 py-3 flex flex-col gap-2">
          {renderControls()}
        </div>
      )}
    </div>
  );
}
