import { useState, useEffect, useRef, useCallback } from "react";

const W = 720, H = 400, CX = W / 2, CY = H / 2;

interface Props {
  mode?: string;
  onContextChange?: (ctx: string) => void;
  [key: string]: any;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function bg(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#050d1a";
  ctx.fillRect(0, 0, W, H);
}

function txt(
  ctx: CanvasRenderingContext2D, s: string,
  x: number, y: number,
  color = "#94a3b8", size = 11, bold = false,
  align: CanvasTextAlign = "left"
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
  ctx.strokeStyle = "rgba(167,139,250,0.3)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  (ctx as any).roundRect(x, y, w, h, 7);
  ctx.fill(); ctx.stroke();
  lines.forEach((line, i) => {
    ctx.fillStyle = i === 0 ? "#a78bfa" : "#94a3b8";
    ctx.font = `${i === 0 ? "bold " : ""}10.5px sans-serif`;
    ctx.fillText(line, x + 8, y + 12 + i * lh);
  });
  ctx.restore();
}

function pill(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string, fill: string) {
  ctx.save();
  ctx.fillStyle = fill;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  (ctx as any).roundRect(x, y, w, h, h / 2);
  ctx.fill(); ctx.stroke();
  ctx.restore();
}

function circle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string, stroke = "none", lw = 1.5) {
  ctx.save();
  ctx.fillStyle = fill;
  if (stroke !== "none") { ctx.strokeStyle = stroke; ctx.lineWidth = lw; }
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  if (stroke !== "none") ctx.stroke();
  ctx.restore();
}

function arrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string, lw = 1.5) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  ctx.save();
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = lw;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 10 * Math.cos(angle - 0.35), y2 - 10 * Math.sin(angle - 0.35));
  ctx.lineTo(x2 - 10 * Math.cos(angle + 0.35), y2 - 10 * Math.sin(angle + 0.35));
  ctx.closePath(); ctx.fill();
  ctx.restore();
}

// ─── Female Reproductive Anatomy (schematic) ──────────────────────────────────
function drawUterus(ctx: CanvasRenderingContext2D, cx: number, cy: number, sc = 1, highlightTube = "none") {
  ctx.save();
  // Uterus body (inverted pear shape)
  ctx.fillStyle = "rgba(244,114,182,0.15)";
  ctx.strokeStyle = "#f472b6";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 50 * sc, cy - 52 * sc);
  ctx.bezierCurveTo(cx - 55 * sc, cy, cx - 30 * sc, cy + 42 * sc, cx, cy + 48 * sc);
  ctx.bezierCurveTo(cx + 30 * sc, cy + 42 * sc, cx + 55 * sc, cy, cx + 50 * sc, cy - 52 * sc);
  ctx.closePath();
  ctx.fill(); ctx.stroke();

  // Cervix
  ctx.fillStyle = "rgba(244,114,182,0.25)";
  ctx.beginPath();
  (ctx as any).roundRect(cx - 12 * sc, cy + 44 * sc, 24 * sc, 28 * sc, 6 * sc);
  ctx.fill(); ctx.stroke();

  // Fallopian tube — left
  const ltColor = highlightTube === "left" ? "#fbbf24" : "#f472b6";
  ctx.strokeStyle = ltColor; ctx.lineWidth = highlightTube === "left" ? 3 : 1.8;
  ctx.beginPath();
  ctx.moveTo(cx - 50 * sc, cy - 35 * sc);
  ctx.bezierCurveTo(cx - 85 * sc, cy - 85 * sc, cx - 125 * sc, cy - 72 * sc, cx - 138 * sc, cy - 48 * sc);
  ctx.stroke();

  // Fallopian tube — right
  const rtColor = highlightTube === "right" ? "#fbbf24" : "#f472b6";
  ctx.strokeStyle = rtColor; ctx.lineWidth = highlightTube === "right" ? 3 : 1.8;
  ctx.beginPath();
  ctx.moveTo(cx + 50 * sc, cy - 35 * sc);
  ctx.bezierCurveTo(cx + 85 * sc, cy - 85 * sc, cx + 125 * sc, cy - 72 * sc, cx + 138 * sc, cy - 48 * sc);
  ctx.stroke();

  // Ovaries
  ctx.strokeStyle = "#f472b6"; ctx.lineWidth = 1.8;
  ctx.fillStyle = "rgba(244,114,182,0.3)";
  ctx.beginPath(); ctx.ellipse(cx - 148 * sc, cy - 48 * sc, 14 * sc, 10 * sc, 0.3, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(cx + 148 * sc, cy - 48 * sc, 14 * sc, 10 * sc, -0.3, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();
  ctx.restore();
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── MODE RENDERERS ───────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

// ─── 1. Population Growth Curves ─────────────────────────────────────────────
function renderPopulationGrowth(ctx: CanvasRenderingContext2D, r: number, K: number, showBoth: boolean) {
  bg(ctx);
  txt(ctx, "Population Growth: Exponential vs Logistic", CX, 22, "#a78bfa", 13, true, "center");

  const gX = 80, gY = 40, gW = W - 120, gH = H - 100;
  const maxT = 60;

  // Axes
  ctx.save();
  ctx.strokeStyle = "rgba(148,163,184,0.4)"; ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(gX, gY); ctx.lineTo(gX, gY + gH); // Y
  ctx.moveTo(gX, gY + gH); ctx.lineTo(gX + gW, gY + gH); // X
  ctx.stroke();
  ctx.restore();

  txt(ctx, "Population (N)", gX - 10, gY - 6, "#94a3b8", 9, false, "right");
  txt(ctx, "Time →", gX + gW + 4, gY + gH + 3, "#94a3b8", 9);

  // K dashed line
  if (showBoth) {
    ctx.save(); ctx.strokeStyle = "rgba(34,197,94,0.45)"; ctx.lineWidth = 1; ctx.setLineDash([5,4]);
    const kY = gY + gH * 0.08;
    ctx.beginPath(); ctx.moveTo(gX, kY); ctx.lineTo(gX + gW, kY); ctx.stroke();
    ctx.restore();
    txt(ctx, `K (Carrying Capacity = ${K})`, gX + gW - 5, gY + gH * 0.08 - 5, "#22c55e", 9, false, "right");
  }

  // Exponential curve: N = N0 * e^(r*t)
  const N0 = 10;
  const Nmax = showBoth ? K : K * 1.5;

  ctx.save(); ctx.strokeStyle = "#f97316"; ctx.lineWidth = 2.5;
  ctx.beginPath();
  let started = false;
  for (let px = 0; px <= gW; px++) {
    const t = (px / gW) * maxT;
    const N = N0 * Math.exp(r * t);
    const ny = gY + gH - (N / Nmax) * gH;
    const nx = gX + px;
    if (ny >= gY && ny <= gY + gH) {
      if (!started) { ctx.moveTo(nx, ny); started = true; }
      else ctx.lineTo(nx, ny);
    }
  }
  ctx.stroke();
  txt(ctx, "J-curve (Exponential)", gX + gW * 0.6, gY + gH * 0.25, "#f97316", 9, true);

  // Logistic curve: N = K / (1 + ((K-N0)/N0) * e^(-r*t))
  if (showBoth) {
    ctx.strokeStyle = "#22c55e"; ctx.lineWidth = 2.5;
    ctx.beginPath();
    started = false;
    for (let px = 0; px <= gW; px++) {
      const t = (px / gW) * maxT;
      const N = K / (1 + ((K - N0) / N0) * Math.exp(-r * t));
      const ny = gY + gH - (N / Nmax) * gH;
      const nx = gX + px;
      if (ny >= gY && ny <= gY + gH) {
        if (!started) { ctx.moveTo(nx, ny); started = true; }
        else ctx.lineTo(nx, ny);
      }
    }
    ctx.stroke();

    // Inflection point at K/2
    const tInfl = Math.log((K - N0) / N0) / r;
    const pxInfl = (tInfl / maxT) * gW;
    if (pxInfl > 0 && pxInfl < gW) {
      ctx.strokeStyle = "rgba(34,197,94,0.5)"; ctx.lineWidth = 1; ctx.setLineDash([3,3]);
      ctx.beginPath();
      ctx.moveTo(gX + pxInfl, gY);
      ctx.lineTo(gX + pxInfl, gY + gH);
      ctx.stroke();
      ctx.setLineDash([]);
      circle(ctx, gX + pxInfl, gY + gH / 2, 5, "#22c55e", "rgba(2,8,20,0.8)");
      txt(ctx, "Inflection (N=K/2)", gX + pxInfl + 7, gY + gH / 2 + 3, "#22c55e", 8);
    }
    txt(ctx, "S-curve (Logistic)", gX + gW * 0.75, gY + gH * 0.12, "#22c55e", 9, true);
  }
  ctx.restore();

  infoPanel(ctx, [
    "Population Growth Models",
    `Exponential: dN/dt = rN (J-curve)`,
    `Logistic: dN/dt = rN(K-N)/K (S-curve)`,
    `r = intrinsic growth rate (${r.toFixed(2)})`,
    `K = carrying capacity (${K})`,
    "Logistic: realistic (limited resources)",
    "Exponential: unlimited resources",
  ], 10, H - 112, 246);
}

// ─── 2. India's Population Growth ────────────────────────────────────────────
function renderIndiaPopulation(ctx: CanvasRenderingContext2D, t: number) {
  bg(ctx);
  txt(ctx, "India's Population Growth (1951–2021)", CX, 22, "#a78bfa", 13, true, "center");

  const data: { year: number; pop: number; color: string }[] = [
    { year: 1951, pop: 361, color: "#3b82f6" },
    { year: 1961, pop: 439, color: "#6366f1" },
    { year: 1971, pop: 548, color: "#8b5cf6" },
    { year: 1981, pop: 683, color: "#a855f7" },
    { year: 1991, pop: 846, color: "#d946ef" },
    { year: 2001, pop: 1029, color: "#ec4899" },
    { year: 2011, pop: 1210, color: "#f43f5e" },
    { year: 2021, pop: 1380, color: "#f97316" },
  ];

  const maxPop = 1500;
  const barW = 58, gX = 55, gY = 42, gH = H - 100;
  const totalW = data.length * (barW + 12);
  const startX = CX - totalW / 2;

  // Y axis labels
  ctx.save(); ctx.strokeStyle = "rgba(148,163,184,0.3)"; ctx.lineWidth = 1; ctx.setLineDash([3, 4]);
  [300, 600, 900, 1200].forEach(mark => {
    const y = gY + gH - (mark / maxPop) * gH;
    ctx.beginPath(); ctx.moveTo(gX, y); ctx.lineTo(W - 20, y); ctx.stroke();
    txt(ctx, `${mark}M`, gX - 6, y + 3, "#64748b", 8, false, "right");
  });
  ctx.restore();

  // Animated bars
  const elapsed = Math.min(t * 0.6, 1);
  data.forEach(({ year, pop, color }, i) => {
    const barH = (pop / maxPop) * gH * elapsed;
    const x = startX + i * (barW + 12);
    const y = gY + gH - barH;

    // Bar
    ctx.save();
    const g = ctx.createLinearGradient(x, y, x + barW, y + barH);
    g.addColorStop(0, color);
    g.addColorStop(1, `${color}88`);
    ctx.fillStyle = g;
    ctx.beginPath();
    (ctx as any).roundRect(x, y, barW, barH, [4, 4, 0, 0]);
    ctx.fill();
    ctx.restore();

    // Year label
    txt(ctx, `${year}`, x + barW / 2, gY + gH + 14, "#64748b", 8, false, "center");
    // Population label on top of bar
    if (elapsed > 0.7) {
      txt(ctx, `${pop}M`, x + barW / 2, y - 4, color, 8, true, "center");
    }
  });

  // X axis line
  ctx.save(); ctx.strokeStyle = "rgba(148,163,184,0.4)"; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(gX, gY + gH); ctx.lineTo(W - 20, gY + gH); ctx.stroke();
  ctx.restore();

  infoPanel(ctx, [
    "India's Population Growth",
    "1951: 361 million (post-independence)",
    "2001: crossed 1 billion mark",
    "2011: 1.21 billion",
    "2021: ~1.38 billion",
    "Growth rate: declining (2.1→1.7→1.3%)",
    "Policies: NPP 1952 (1st in world!)",
  ], W - 250, H - 118, 240);
}

// ─── 3. Contraception Methods Overview ───────────────────────────────────────
function renderContraceptionOverview(ctx: CanvasRenderingContext2D, highlight: string) {
  bg(ctx);
  txt(ctx, "Contraception Methods — Classification", CX, 22, "#a78bfa", 14, true, "center");

  const categories = [
    {
      name: "Natural Methods", color: "#22c55e",
      items: ["Periodic abstinence", "Lactational amenorrhoea (LAM)", "Coitus interruptus"],
      x: 30,
    },
    {
      name: "Barrier Methods", color: "#3b82f6",
      items: ["Male condom", "Female condom", "Diaphragm / Cervical cap"],
      x: 200,
    },
    {
      name: "IUDs", color: "#f59e0b",
      items: ["Non-medicated (Lippes loop)", "Cu-releasing (CuT, Cu7)", "Hormone-releasing (LNG-20)"],
      x: 370,
    },
    {
      name: "Hormonal", color: "#a78bfa",
      items: ["Oral pills (combined)", "Injectable", "Implants / Patches"],
      x: 540,
    },
  ];

  categories.forEach(({ name, color, items, x }) => {
    const isHighlighted = highlight === name;
    const alpha = highlight === "all" || isHighlighted ? 1 : 0.5;
    ctx.save();
    ctx.globalAlpha = alpha;
    // Category box
    const cH = 130;
    ctx.fillStyle = `${color}15`;
    ctx.strokeStyle = isHighlighted ? color : `${color}55`;
    ctx.lineWidth = isHighlighted ? 2 : 1;
    ctx.beginPath();
    (ctx as any).roundRect(x, 38, 158, cH, 8);
    ctx.fill(); ctx.stroke();
    txt(ctx, name, x + 79, 56, color, 9, true, "center");
    items.forEach((item, i) => {
      ctx.fillStyle = "#94a3b8";
      ctx.font = "8.5px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`• ${item}`, x + 8, 74 + i * 18);
    });
    ctx.restore();
  });

  // Surgical methods at bottom (full width)
  ctx.save();
  ctx.fillStyle = "rgba(239,68,68,0.1)";
  ctx.strokeStyle = "#ef4444";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  (ctx as any).roundRect(30, 188, 340, 70, 8);
  ctx.fill(); ctx.stroke();
  txt(ctx, "Surgical Methods (Permanent)", 210, 204, "#ef4444", 9, true, "center");
  txt(ctx, "• Vasectomy (male — vas deferens cut)", 40, 222, "#94a3b8", 8.5);
  txt(ctx, "• Tubectomy / Tubal ligation (female — fallopian tube cut/tied/removed)", 40, 240, "#94a3b8", 8.5);
  ctx.restore();

  // Emergency contraception
  ctx.save();
  ctx.fillStyle = "rgba(249,115,22,0.1)";
  ctx.strokeStyle = "#f97316";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  (ctx as any).roundRect(388, 188, 310, 70, 8);
  ctx.fill(); ctx.stroke();
  txt(ctx, "Post-coital (Emergency)", 543, 204, "#f97316", 9, true, "center");
  txt(ctx, "• Morning-after pill (within 72 hrs)", 398, 222, "#94a3b8", 8.5);
  txt(ctx, "• High-dose estrogen/progestogen", 398, 240, "#94a3b8", 8.5);
  ctx.restore();

  infoPanel(ctx, [
    "Ideal Contraceptive Properties:",
    "User-friendly, easily available",
    "Effective with minimal side effects",
    "Non-interfering with sexual desire",
    "Reversible (except surgical)",
  ], 10, H - 90, 235);
}

// ─── 4. Barrier Methods ───────────────────────────────────────────────────────
function renderBarrierMethods(ctx: CanvasRenderingContext2D, t: number) {
  bg(ctx);
  txt(ctx, "Barrier Methods — How They Work", CX, 22, "#a78bfa", 13, true, "center");

  // Left: Male condom diagram
  const midX = W / 2;
  ctx.save(); ctx.strokeStyle = "rgba(56,189,248,0.2)"; ctx.lineWidth = 1; ctx.setLineDash([5,5]);
  ctx.beginPath(); ctx.moveTo(midX, 32); ctx.lineTo(midX, H - 10); ctx.stroke();
  ctx.restore();

  // Left panel: Condom cross-section schematic
  txt(ctx, "Male Condom", 120, 44, "#3b82f6", 11, true, "center");

  // Draw simplified penis with condom
  const penX = 120, penY = 240;
  ctx.save();
  // Latex condom (blue)
  ctx.fillStyle = "rgba(59,130,246,0.3)";
  ctx.strokeStyle = "#3b82f6";
  ctx.lineWidth = 2;
  ctx.beginPath();
  (ctx as any).roundRect(penX - 38, penY - 120, 76, 130, [40, 40, 0, 0]);
  ctx.fill(); ctx.stroke();
  txt(ctx, "Latex/Polyurethane", penX, penY - 130, "#3b82f6", 8, false, "center");
  txt(ctx, "barrier", penX, penY - 120, "#3b82f6", 8, false, "center");
  ctx.restore();

  // Sperm cells approaching (animated)
  const spermColor = "#f97316";
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI - Math.PI / 2;
    const dist = 55 - ((t * 25 + i * 20) % 55);
    const sx = penX + Math.cos(angle) * dist * 0.5;
    const sy = penY + 30 + dist;
    circle(ctx, sx, sy, 4, spermColor, "none");
    // Tail
    ctx.save(); ctx.strokeStyle = spermColor; ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx, sy + 8 + Math.sin(t * 3 + i) * 3);
    ctx.stroke();
    ctx.restore();
  }
  txt(ctx, "Sperm blocked ✓", penX, penY + 50, "#22c55e", 9, true, "center");

  // Right panel: Diagram labels
  txt(ctx, "How Barrier Methods Work", midX + 130, 44, "#a78bfa", 11, true, "center");

  const steps = [
    { y: 80, label: "Physical barrier placed before intercourse" },
    { y: 115, label: "Prevents sperm from reaching egg" },
    { y: 150, label: "No hormones involved" },
    { y: 185, label: "Also protects against STIs (condoms)" },
  ];
  steps.forEach(({ y, label }, i) => {
    circle(ctx, midX + 20, y, 8, ["#3b82f6", "#22c55e", "#a78bfa", "#f59e0b"][i], "none");
    txt(ctx, `${i + 1}`, midX + 16, y + 4, "#050d1a", 9, true);
    txt(ctx, label, midX + 36, y + 4, "#94a3b8", 9);
  });

  // Diaphragm note
  ctx.save();
  ctx.fillStyle = "rgba(167,139,250,0.1)"; ctx.strokeStyle = "rgba(167,139,250,0.4)"; ctx.lineWidth = 1;
  ctx.beginPath(); (ctx as any).roundRect(midX + 12, 220, 320, 60, 7); ctx.fill(); ctx.stroke();
  ctx.restore();
  txt(ctx, "Diaphragm / Cervical cap:", midX + 20, 238, "#a78bfa", 9, true);
  txt(ctx, "Inserted by female into vagina to cover cervix.", midX + 20, 255, "#94a3b8", 8.5);
  txt(ctx, "Used with spermicide for better effectiveness.", midX + 20, 270, "#94a3b8", 8.5);

  infoPanel(ctx, [
    "Barrier Methods — Key Facts",
    "Most effective when used correctly",
    "Male condom: 85-98% effective",
    "Only contraceptive protecting vs STIs",
    "Female condom: inserted into vagina",
    "No systemic side effects",
  ], 10, H - 103, 238);
}

// ─── 5. IUD Mechanism ────────────────────────────────────────────────────────
function renderIUDMechanism(ctx: CanvasRenderingContext2D, iudType: string) {
  bg(ctx);
  const configs: Record<string, { color: string; mechanism: string[] }> = {
    "non-medicated": {
      color: "#94a3b8",
      mechanism: ["Lippes loop — inert plastic", "Creates mild inflammatory reaction", "Prevents fertilization", "No hormones or metals"],
    },
    "cu-releasing": {
      color: "#f59e0b",
      mechanism: ["CuT 380A, Cu7 — most popular", "Cu ions toxic to sperm (motility↓)", "Phagocytosis of sperm enhanced", "Effective 5–10 years"],
    },
    "hormonal": {
      color: "#a78bfa",
      mechanism: ["LNG-20 (levonorgestrel)", "Thickens cervical mucus", "Prevents sperm entry", "May suppress ovulation"],
    },
  };
  const conf = configs[iudType] || configs["cu-releasing"];

  txt(ctx, "IUD (Intra-Uterine Device) Mechanism", CX, 22, "#a78bfa", 13, true, "center");

  // Draw uterus schematic
  drawUterus(ctx, 230, CY + 20, 0.82);

  // Draw IUD inside uterus
  const iudX = 230, iudY = CY - 14;
  if (iudType === "non-medicated") {
    // Lippes loop (S-shape)
    ctx.save(); ctx.strokeStyle = conf.color; ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(iudX - 20, iudY - 20);
    ctx.bezierCurveTo(iudX - 20, iudY - 8, iudX + 20, iudY - 8, iudX + 20, iudY);
    ctx.bezierCurveTo(iudX + 20, iudY + 8, iudX - 20, iudY + 8, iudX - 20, iudY + 20);
    ctx.stroke(); ctx.restore();
    txt(ctx, "Lippes Loop", iudX, iudY + 35, conf.color, 8, true, "center");
  } else if (iudType === "cu-releasing") {
    // T-shape CuT
    ctx.save(); ctx.strokeStyle = conf.color; ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(iudX - 28, iudY - 10);
    ctx.lineTo(iudX + 28, iudY - 10);
    ctx.moveTo(iudX, iudY - 10);
    ctx.lineTo(iudX, iudY + 28);
    ctx.stroke();
    // Cu symbol
    txt(ctx, "Cu", iudX + 28, iudY - 6, conf.color, 9, true);
    txt(ctx, "CuT-380A", iudX, iudY + 38, conf.color, 8, true, "center");
    // Cu ion arrows
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const r = 35;
      ctx.save(); ctx.fillStyle = conf.color; ctx.font = "9px sans-serif";
      ctx.fillText("Cu²⁺", iudX + Math.cos(angle) * r - 8, iudY + Math.sin(angle) * r + 3);
      ctx.restore();
    }
  } else {
    // LNG-20 — T-shape with hormone capsule
    ctx.save(); ctx.strokeStyle = conf.color; ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(iudX - 28, iudY - 8);
    ctx.lineTo(iudX + 28, iudY - 8);
    ctx.moveTo(iudX, iudY - 8);
    ctx.lineTo(iudX, iudY + 28);
    ctx.stroke();
    // Hormone capsule on stem
    ctx.fillStyle = `${conf.color}55`;
    ctx.beginPath(); ctx.ellipse(iudX, iudY + 14, 8, 18, 0, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    txt(ctx, "LNG-20", iudX, iudY + 38, conf.color, 8, true, "center");
  }

  // Info + mechanism on right
  txt(ctx, iudType === "non-medicated" ? "Non-Medicated IUD" :
    iudType === "cu-releasing" ? "Cu-Releasing IUD" : "Hormone-Releasing IUD",
    CX + 90, 45, conf.color, 11, true);

  conf.mechanism.forEach((line, i) => {
    txt(ctx, `• ${line}`, CX + 85, 70 + i * 22, "#94a3b8", 9);
  });

  // General IUD facts
  infoPanel(ctx, [
    "IUDs — Common Facts",
    "Inserted by medical professional",
    "Most effective (>99%) — 'set and forget'",
    "IUDs: Non-medicated (plastic)",
    "       Cu-releasing (spermicidal)",
    "       Hormone-releasing (LNG-20)",
    "Reversible — can be removed anytime",
  ], CX + 80, H - 118, 232);
}

// ─── 6. Oral Contraceptives — Hormonal Mechanism ─────────────────────────────
function renderOralContraceptives(ctx: CanvasRenderingContext2D) {
  bg(ctx);
  txt(ctx, "Oral Contraceptives — Hormonal Feedback Mechanism", CX, 22, "#a78bfa", 13, true, "center");

  // HPG Axis diagram
  const boxes = [
    { label: "Hypothalamus", sub: "Releases GnRH", x: CX, y: 70, w: 160, h: 40, color: "#a78bfa" },
    { label: "Anterior Pituitary", sub: "Releases FSH + LH", x: CX, y: 155, w: 180, h: 40, color: "#3b82f6" },
    { label: "Ovary", sub: "Ovulation (suppressed!)", x: CX, y: 240, w: 180, h: 40, color: "#f472b6" },
  ];

  boxes.forEach(({ label, sub, x, y, w, h, color }) => {
    ctx.save();
    ctx.fillStyle = `${color}22`; ctx.strokeStyle = color; ctx.lineWidth = 1.5;
    ctx.beginPath(); (ctx as any).roundRect(x - w / 2, y, w, h, 7);
    ctx.fill(); ctx.stroke();
    txt(ctx, label, x, y + 16, color, 10, true, "center");
    txt(ctx, sub, x, y + 30, "#94a3b8", 8, false, "center");
    ctx.restore();
  });

  // Normal: Arrows down (GnRH → FSH/LH → Estrogen/Prog)
  arrow(ctx, CX, 110, CX, 154, "#a78bfa");
  arrow(ctx, CX, 195, CX, 239, "#3b82f6");

  // Negative feedback arrows (when pill is taken)
  ctx.save(); ctx.strokeStyle = "#ef4444"; ctx.lineWidth = 2;
  // Synthetic hormones inhibit
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.moveTo(CX - 90, 258); // from ovary level
  ctx.bezierCurveTo(CX - 200, 200, CX - 200, 100, CX - 80, 88);
  ctx.stroke();
  ctx.restore();
  arrow(ctx, CX - 200, 150, CX - 82, 105, "#ef4444");
  txt(ctx, "Negative feedback", CX - 230, 148, "#ef4444", 8, true);
  txt(ctx, "Synthetic hormones", CX - 235, 162, "#ef4444", 8);
  txt(ctx, "(estrogen + progestin)", CX - 232, 176, "#ef4444", 8);
  txt(ctx, "suppress FSH/LH", CX - 225, 190, "#ef4444", 8);

  // Pill icon on left
  ctx.save();
  for (let i = 0; i < 4; i++) {
    circle(ctx, 90, 120 + i * 30, 12, ["#f472b6", "#f472b6", "#a78bfa", "#a78bfa"][i], "#e2e8f0", 1);
    txt(ctx, i < 2 ? "E" : "P", 85, 125 + i * 30, "#e2e8f0", 9, true);
  }
  txt(ctx, "Combined pill", 90, 248, "#94a3b8", 8, false, "center");
  txt(ctx, "(E + P)", 90, 260, "#94a3b8", 8, false, "center");
  ctx.restore();

  // Result
  ctx.save();
  ctx.fillStyle = "rgba(34,197,94,0.12)"; ctx.strokeStyle = "#22c55e"; ctx.lineWidth = 1.5;
  ctx.beginPath(); (ctx as any).roundRect(CX + 80, 200, 220, 52, 7); ctx.fill(); ctx.stroke();
  ctx.restore();
  txt(ctx, "Result of Oral Contraceptives:", CX + 190, 218, "#22c55e", 9, true, "center");
  txt(ctx, "✓ Ovulation suppressed", CX + 95, 235, "#94a3b8", 9);
  txt(ctx, "✓ Cervical mucus thickened", CX + 95, 248, "#94a3b8", 9);

  infoPanel(ctx, [
    "Oral Contraceptive Pills",
    "Combined pill: Estrogen + Progestin",
    "Progestin-only: 'Mini-pill' (safer)",
    "Taken daily for 21 days/cycle",
    "Effective: ~99% if taken correctly",
    "Can cause nausea, weight changes",
    "Not recommended for smokers > 35 yrs",
  ], 10, H - 118, 248);
}

// ─── 7. Vasectomy vs Tubectomy ────────────────────────────────────────────────
function renderSurgicalMethods(ctx: CanvasRenderingContext2D) {
  bg(ctx);
  txt(ctx, "Surgical Sterilization: Vasectomy & Tubectomy", CX, 22, "#a78bfa", 13, true, "center");

  const midX = W / 2;
  ctx.save(); ctx.strokeStyle = "rgba(56,189,248,0.2)"; ctx.lineWidth = 1; ctx.setLineDash([5,5]);
  ctx.beginPath(); ctx.moveTo(midX, 32); ctx.lineTo(midX, H - 10); ctx.stroke();
  ctx.restore();

  // ─ Left: Vasectomy ──────────────────────────────────────────────────────────
  txt(ctx, "Vasectomy (Male)", 180, 42, "#3b82f6", 12, true, "center");

  // Testes
  circle(ctx, 130, 310, 30, "rgba(59,130,246,0.2)", "#3b82f6", 2);
  circle(ctx, 200, 315, 28, "rgba(59,130,246,0.2)", "#3b82f6", 2);
  txt(ctx, "Testes", 162, 355, "#3b82f6", 9, false, "center");

  // Vas deferens (tubes going up)
  ctx.save(); ctx.strokeStyle = "#3b82f6"; ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(145, 282); ctx.bezierCurveTo(130, 230, 160, 200, 180, 160);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(215, 288); ctx.bezierCurveTo(220, 235, 205, 200, 195, 160);
  ctx.stroke();
  ctx.restore();

  // Cut site on left tube with X
  ctx.save(); ctx.strokeStyle = "#ef4444"; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(145, 215); ctx.lineTo(158, 228); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(158, 215); ctx.lineTo(145, 228); ctx.stroke();
  ctx.restore();
  ctx.save(); ctx.strokeStyle = "#ef4444"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(195, 215); ctx.lineTo(205, 228); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(205, 215); ctx.lineTo(195, 228); ctx.stroke();
  ctx.restore();

  txt(ctx, "✕ Vas deferens cut", 80, 200, "#ef4444", 8, true);
  txt(ctx, "   and tied here", 80, 213, "#ef4444", 8);

  const vInfo = [
    "Small incision in scrotum",
    "Vas deferens cut + tied/cauterized",
    "Sperm cannot reach semen",
    "Permanent but reversible attempt possible",
    "Low risk, day procedure",
  ];
  vInfo.forEach((line, i) => txt(ctx, `• ${line}`, 22, 65 + i * 18, "#94a3b8", 8.5));

  // ─ Right: Tubectomy ─────────────────────────────────────────────────────────
  txt(ctx, "Tubectomy / Tubal Ligation (Female)", W - 175, 42, "#f472b6", 12, true, "center");

  drawUterus(ctx, W - 175, 200, 0.72, "both");

  // X marks on both fallopian tubes
  const txY = 165;
  ctx.save(); ctx.strokeStyle = "#ef4444"; ctx.lineWidth = 3;
  [W - 260, W - 90].forEach(tx => {
    ctx.beginPath(); ctx.moveTo(tx - 7, txY - 7); ctx.lineTo(tx + 7, txY + 7); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(tx + 7, txY - 7); ctx.lineTo(tx - 7, txY + 7); ctx.stroke();
  });
  ctx.restore();
  txt(ctx, "✕ Cut here", W - 310, 150, "#ef4444", 8);
  txt(ctx, "✕ Cut here", W - 95, 150, "#ef4444", 8);

  const tInfo = [
    "Fallopian tubes cut/tied/blocked",
    "Egg cannot meet sperm",
    "Permanent contraception",
    "Laparoscopic — minimally invasive",
    ">99.5% effective",
  ];
  tInfo.forEach((line, i) => txt(ctx, `• ${line}`, midX + 10, 270 + i * 18, "#94a3b8", 8.5));

  infoPanel(ctx, [
    "Surgical Methods — Key Points",
    "Both are permanent (irreversible)",
    "Vasectomy: simpler, outpatient",
    "Tubectomy: laparoscopic surgery",
    "Not recommended as primary choice",
    "Bihar Board: know both procedures",
  ], 10, H - 103, 240);
}

// ─── 8. STIs — Types & Causative Agents ──────────────────────────────────────
function renderSTITypes(ctx: CanvasRenderingContext2D) {
  bg(ctx);
  txt(ctx, "Sexually Transmitted Infections (STIs)", CX, 22, "#a78bfa", 14, true, "center");

  const stis = [
    { name: "Gonorrhoea", agent: "Neisseria gonorrhoeae", type: "Bacteria", color: "#ef4444", tx: "Antibiotics" },
    { name: "Syphilis", agent: "Treponema pallidum", type: "Bacteria", color: "#f97316", tx: "Penicillin" },
    { name: "Chlamydia", agent: "Chlamydia trachomatis", type: "Bacteria", color: "#fbbf24", tx: "Antibiotics" },
    { name: "Genital Herpes", agent: "Herpes Simplex Virus-2", type: "Virus", color: "#a78bfa", tx: "Antiviral (no cure)" },
    { name: "HIV / AIDS", agent: "Human Immunodeficiency Virus", type: "Virus", color: "#ef4444", tx: "ART (no cure)" },
    { name: "Hepatitis B", agent: "Hepatitis B Virus (HBV)", type: "Virus", color: "#f472b6", tx: "Vaccine + Antiviral" },
    { name: "Genital Warts", agent: "Human Papillomavirus (HPV)", type: "Virus", color: "#06b6d4", tx: "Vaccine (HPV vax)" },
    { name: "Trichomoniasis", agent: "Trichomonas vaginalis", type: "Parasite", color: "#22c55e", tx: "Metronidazole" },
  ];

  // Headers
  ["STI Name", "Causative Agent", "Type", "Treatment"].forEach((h, i) => {
    const xPositions = [18, 185, 398, 528];
    txt(ctx, h, xPositions[i], 42, "#38bdf8", 9, true);
  });
  ctx.save(); ctx.strokeStyle = "rgba(56,189,248,0.3)"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(10, 46); ctx.lineTo(W - 10, 46); ctx.stroke();
  ctx.restore();

  stis.forEach(({ name, agent, type, color, tx }, i) => {
    const y = 64 + i * 38;
    if (i % 2 === 0) {
      ctx.save(); ctx.fillStyle = "rgba(255,255,255,0.03)";
      ctx.fillRect(10, y - 12, W - 20, 36); ctx.restore();
    }

    // Type badge icon
    const typeIcon = type === "Bacteria" ? "🦠" : type === "Virus" ? "🔴" : "🟡";

    circle(ctx, 14, y + 7, 5, color, "none");
    txt(ctx, name, 24, y + 11, color, 9, true);
    txt(ctx, agent, 185, y + 11, "#94a3b8", 8.5);
    txt(ctx, `${typeIcon} ${type}`, 398, y + 11, "#64748b", 8);
    txt(ctx, tx, 528, y + 11, "#94a3b8", 8);
  });

  // Divider line
  ctx.save(); ctx.strokeStyle = "rgba(255,255,255,0.06)"; ctx.lineWidth = 1;
  stis.forEach((_, i) => {
    const y = 52 + i * 38;
    ctx.beginPath(); ctx.moveTo(10, y); ctx.lineTo(W - 10, y); ctx.stroke();
  });
  ctx.restore();

  infoPanel(ctx, [
    "Prevention of STIs",
    "Use of condoms (most important)",
    "Avoid multiple sexual partners",
    "Early detection and treatment",
    "Vaccination (Hepatitis B, HPV)",
    "Avoid sharing needles (HIV/HBV)",
  ], 10, H - 103, 248);
}

// ─── 9. HIV Structure ─────────────────────────────────────────────────────────
function renderHIVStructure(ctx: CanvasRenderingContext2D) {
  bg(ctx);
  txt(ctx, "HIV — Structure of the Virus", CX, 22, "#a78bfa", 14, true, "center");

  const cx = 260, cy = CY + 20;
  const outerR = 110, innerR = 70, capsidR = 50;

  // Viral envelope (outermost)
  const envG = ctx.createRadialGradient(cx - 20, cy - 20, 10, cx, cy, outerR);
  envG.addColorStop(0, "rgba(239,68,68,0.35)");
  envG.addColorStop(1, "rgba(239,68,68,0.08)");
  ctx.save(); ctx.fillStyle = envG;
  ctx.beginPath(); ctx.arc(cx, cy, outerR, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "#ef4444"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(cx, cy, outerR, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();

  // Glycoproteins (gp120) on envelope
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const bx = cx + Math.cos(angle) * outerR;
    const by = cy + Math.sin(angle) * outerR;
    const ex = cx + Math.cos(angle) * (outerR + 16);
    const ey = cy + Math.sin(angle) * (outerR + 16);
    ctx.save(); ctx.strokeStyle = "#fbbf24"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(ex, ey); ctx.stroke();
    circle(ctx, ex, ey, 5, "#fbbf24", "none");
    ctx.restore();
  }

  // Matrix protein layer (p17)
  ctx.save(); ctx.strokeStyle = "rgba(249,115,22,0.5)"; ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.arc(cx, cy, innerR + 10, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();

  // Capsid (conical, shown as ellipse)
  ctx.save();
  ctx.fillStyle = "rgba(167,139,250,0.3)"; ctx.strokeStyle = "#a78bfa"; ctx.lineWidth = 2;
  ctx.setLineDash([]);
  ctx.beginPath(); ctx.ellipse(cx, cy, capsidR * 0.7, capsidR, 0.4, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();
  ctx.restore();

  // RNA strands inside
  ctx.save(); ctx.strokeStyle = "#22c55e"; ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 30, cy - 20);
  ctx.bezierCurveTo(cx - 10, cy - 30, cx + 10, cy - 10, cx + 20, cy - 25);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - 20, cy + 15);
  ctx.bezierCurveTo(cx, cy + 25, cx + 15, cy + 5, cx + 25, cy + 20);
  ctx.stroke();
  ctx.restore();

  // Reverse transcriptase
  circle(ctx, cx - 12, cy + 5, 8, "rgba(56,189,248,0.5)", "#38bdf8", 1.5);
  txt(ctx, "RT", cx - 16, cy + 9, "#050d1a", 7, true);

  // Labels with arrows
  const labelData = [
    { x: cx + outerR + 30, y: cy - 80, text: "gp120 glycoprotein", color: "#fbbf24" },
    { x: cx + outerR + 30, y: cy - 50, text: "Lipid bilayer envelope", color: "#ef4444" },
    { x: cx + outerR + 30, y: cy - 20, text: "p17 Matrix protein", color: "#f97316" },
    { x: cx + outerR + 30, y: cy + 10, text: "p24 Capsid protein", color: "#a78bfa" },
    { x: cx + outerR + 30, y: cy + 40, text: "ssRNA (2 copies)", color: "#22c55e" },
    { x: cx + outerR + 30, y: cy + 70, text: "Reverse Transcriptase", color: "#38bdf8" },
  ];
  labelData.forEach(({ x, y, text, color }) => {
    ctx.save(); ctx.strokeStyle = `${color}55`; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(cx + outerR + 5, cy); ctx.lineTo(x - 5, y); ctx.stroke();
    ctx.restore();
    txt(ctx, text, x, y + 3, color, 9);
  });

  infoPanel(ctx, [
    "HIV — Key Facts",
    "Retrovirus: RNA genome",
    "Attacks CD4+ T-helper cells",
    "Uses Reverse Transcriptase",
    "RNA → DNA → integrates into host",
    "Transmitted: blood, sexual contact",
    "AIDS develops after years (3-10 yrs)",
  ], 10, H - 118, 246);
}

// ─── 10. IVF Procedure (Step-by-step) ────────────────────────────────────────
function renderIVFSteps(ctx: CanvasRenderingContext2D, step: number) {
  bg(ctx);
  txt(ctx, "IVF — In Vitro Fertilisation (Test-Tube Baby)", CX, 22, "#a78bfa", 13, true, "center");

  const steps = [
    {
      title: "Step 1: Ovarian Stimulation",
      desc: "Hormones (FSH/LH) given to stimulate ovary\nto produce multiple eggs (superovulation).",
      color: "#3b82f6",
      icon: "💊",
    },
    {
      title: "Step 2: Egg Retrieval (OPU)",
      desc: "Mature eggs collected from ovary using a\nneedle under ultrasound guidance.",
      color: "#a78bfa",
      icon: "🔬",
    },
    {
      title: "Step 3: In Vitro Fertilisation",
      desc: "Egg and sperm mixed in culture dish.\nFertilisation occurs in laboratory (in vitro).",
      color: "#22c55e",
      icon: "🧫",
    },
    {
      title: "Step 4: Embryo Culture",
      desc: "Fertilised egg (zygote) grown in incubator\nfor 3–5 days to blastocyst stage.",
      color: "#f59e0b",
      icon: "🧬",
    },
    {
      title: "Step 5: Embryo Transfer (ET)",
      desc: "Healthy embryo transferred into uterus (IUT)\nor fallopian tube (ZIFT).\nPregnancy follows if implantation successful.",
      color: "#f472b6",
      icon: "🏥",
    },
  ];

  // Progress bar
  steps.forEach((s, i) => {
    const x = 30 + i * 135;
    const active = i <= step - 1;
    const current = i === step - 1;
    ctx.save();
    ctx.fillStyle = active ? s.color : "rgba(255,255,255,0.1)";
    ctx.strokeStyle = current ? s.color : "transparent";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x + 56, 48, 14, 0, Math.PI * 2); ctx.fill();
    if (current) ctx.stroke();
    txt(ctx, `${i + 1}`, x + 52, 53, active ? "#050d1a" : "#64748b", 10, true);
    // Line connector
    if (i < steps.length - 1) {
      ctx.strokeStyle = i < step - 1 ? s.color : "rgba(255,255,255,0.15)";
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x + 70, 48); ctx.lineTo(x + 135, 48); ctx.stroke();
    }
    ctx.restore();
  });

  // Active step display
  if (step >= 1 && step <= 5) {
    const s = steps[step - 1];
    ctx.save();
    ctx.fillStyle = `${s.color}18`; ctx.strokeStyle = s.color; ctx.lineWidth = 2;
    ctx.beginPath(); (ctx as any).roundRect(CX - 260, 80, 520, 200, 12); ctx.fill(); ctx.stroke();
    ctx.restore();
    txt(ctx, s.icon, CX, 130, s.color, 40, false, "center");
    txt(ctx, s.title, CX, 175, s.color, 13, true, "center");
    const lines = s.desc.split("\n");
    lines.forEach((line, li) => txt(ctx, line, CX, 198 + li * 22, "#94a3b8", 10, false, "center"));

    // Visual representation per step
    if (step === 3) {
      // Lab dish with egg + sperm
      circle(ctx, CX, 135, 28, "rgba(244,114,182,0.2)", "#f472b6", 2);
      circle(ctx, CX - 8, 135, 10, "#f472b6", "none");
      txt(ctx, "egg", CX - 12, 139, "#050d1a", 7, true);
      for (let i = 0; i < 5; i++) {
        const sx = CX + 16 + i * 8;
        circle(ctx, sx, 135 + Math.sin(i) * 5, 4, "#3b82f6", "none");
      }
    }
  }

  infoPanel(ctx, [
    "IVF — Key Facts",
    "First test-tube baby: Louise Brown, 1978",
    "India's first: Durga (Kanupriya Agarwal)",
    "Success rate: 30-40% per cycle",
    "Can use donor eggs or sperm",
    "Multiple embryos possible → IVF twins",
  ], 10, H - 103, 250);
}

// ─── 11. GIFT / ZIFT / IUT Comparison ────────────────────────────────────────
function renderGIFTvsZIFT(ctx: CanvasRenderingContext2D, artType: string) {
  bg(ctx);
  txt(ctx, "Assisted Reproductive Technologies (ART)", CX, 22, "#a78bfa", 14, true, "center");

  drawUterus(ctx, CX, CY + 15, 0.9,
    artType === "GIFT" || artType === "ZIFT" ? "both" : "none");

  // Mark transfer site
  if (artType === "GIFT") {
    // Gametes into fallopian tube
    const ftX = CX - 148 * 0.9, ftY = CY - 48 * 0.9;
    circle(ctx, ftX + 10, ftY, 10, "rgba(34,197,94,0.6)", "#22c55e", 2);
    txt(ctx, "♀+♂", ftX + 5, ftY + 4, "#050d1a", 7, true);
    txt(ctx, "Gametes transferred\nto fallopian tube", ftX - 60, ftY - 30, "#22c55e", 8);
    arrow(ctx, ftX - 10, ftY - 18, ftX + 5, ftY - 4, "#22c55e");
  } else if (artType === "ZIFT") {
    const ftX = CX + 148 * 0.9, ftY = CY - 48 * 0.9;
    circle(ctx, ftX - 10, ftY, 10, "rgba(167,139,250,0.6)", "#a78bfa", 2);
    txt(ctx, "Z", ftX - 14, ftY + 4, "#050d1a", 9, true);
    txt(ctx, "Zygote transferred\nto fallopian tube", ftX + 12, ftY - 30, "#a78bfa", 8);
    arrow(ctx, ftX + 10, ftY - 18, ftX - 4, ftY - 4, "#a78bfa");
  } else if (artType === "IUT") {
    const iutX = CX, iutY = CY + 5;
    circle(ctx, iutX, iutY, 12, "rgba(249,115,22,0.5)", "#f97316", 2);
    txt(ctx, "E", iutX - 5, iutY + 4, "#050d1a", 9, true);
    txt(ctx, "Embryo transferred\ndirectly to uterus", iutX + 18, iutY - 20, "#f97316", 8);
    arrow(ctx, iutX + 16, iutY - 8, iutX + 8, iutY - 2, "#f97316");
  }

  // Info panel comparison table
  const tableData = [
    { name: "GIFT", full: "Gamete Intra Fallopian Transfer", what: "Gametes (egg+sperm)", where: "Fallopian tube", color: "#22c55e" },
    { name: "ZIFT", full: "Zygote Intra Fallopian Transfer", what: "Zygote", where: "Fallopian tube", color: "#a78bfa" },
    { name: "IUT", full: "Intra Uterine Transfer", what: "8-cell embryo", where: "Uterus", color: "#f97316" },
  ];

  const tX = 10, tY = H - 135;
  ctx.save();
  ctx.fillStyle = "rgba(2,8,20,0.9)"; ctx.strokeStyle = "rgba(56,189,248,0.2)"; ctx.lineWidth = 1;
  ctx.beginPath(); (ctx as any).roundRect(tX, tY, W - 20, 125, 7); ctx.fill(); ctx.stroke();
  ctx.restore();
  ["Method", "Full Form", "What is transferred", "Transfer site"].forEach((h, i) => {
    const xs = [tX + 8, tX + 52, tX + 290, tX + 500];
    txt(ctx, h, xs[i], tY + 14, "#38bdf8", 8, true);
  });
  tableData.forEach(({ name, full, what, where, color }, i) => {
    const y = tY + 30 + i * 28;
    if (name === artType) {
      ctx.save(); ctx.fillStyle = `${color}18`; ctx.fillRect(tX + 2, y - 10, W - 24, 26); ctx.restore();
    }
    txt(ctx, name, tX + 8, y + 5, color, 9, true);
    txt(ctx, full, tX + 52, y + 5, "#94a3b8", 8.5);
    txt(ctx, what, tX + 290, y + 5, "#94a3b8", 8.5);
    txt(ctx, where, tX + 500, y + 5, "#94a3b8", 8.5);
  });
}

// ─── 12. Amniocentesis ────────────────────────────────────────────────────────
function renderAmniocentesis(ctx: CanvasRenderingContext2D) {
  bg(ctx);
  txt(ctx, "Amniocentesis — Prenatal Diagnostic Technique", CX, 22, "#a78bfa", 13, true, "center");

  // Draw pregnant abdomen schematic (simplified)
  const cx = 240, cy = CY + 30;

  // Abdomen outline
  ctx.save();
  ctx.fillStyle = "rgba(253,186,116,0.12)"; ctx.strokeStyle = "#fbbf24"; ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(cx, cy, 120, 130, 0, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();
  ctx.restore();

  // Uterus wall
  ctx.save();
  ctx.fillStyle = "rgba(244,114,182,0.1)"; ctx.strokeStyle = "#f472b6"; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.ellipse(cx, cy, 95, 108, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.restore();

  // Amniotic fluid
  ctx.save();
  ctx.fillStyle = "rgba(56,189,248,0.12)";
  ctx.beginPath(); ctx.ellipse(cx, cy, 75, 90, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // Fetus (simplified — just head + body blob)
  ctx.save();
  ctx.fillStyle = "rgba(253,186,116,0.4)"; ctx.strokeStyle = "#fbbf24"; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.ellipse(cx + 15, cy, 45, 60, 0.3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx + 30, cy - 55, 22, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.restore();
  txt(ctx, "Fetus", cx + 52, cy + 5, "#fbbf24", 8);

  // Amniotic fluid label
  txt(ctx, "Amniotic fluid\n(with fetal cells)", cx - 70, cy + 70, "#38bdf8", 8);

  // Needle insertion
  ctx.save(); ctx.strokeStyle = "#ef4444"; ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx + 115, cy - 40);
  ctx.lineTo(cx + 65, cy);
  ctx.stroke();
  // Needle tip
  ctx.fillStyle = "#ef4444";
  ctx.beginPath();
  ctx.moveTo(cx + 65, cy);
  ctx.lineTo(cx + 60, cy - 8);
  ctx.lineTo(cx + 72, cy - 4);
  ctx.closePath(); ctx.fill();
  ctx.restore();
  txt(ctx, "Needle", cx + 118, cy - 46, "#ef4444", 8);

  // Syringe
  ctx.save();
  ctx.fillStyle = "rgba(148,163,184,0.2)"; ctx.strokeStyle = "#94a3b8"; ctx.lineWidth = 1.5;
  ctx.beginPath(); (ctx as any).roundRect(cx + 115, cy - 55, 50, 18, 4); ctx.fill(); ctx.stroke();
  txt(ctx, "Syringe", cx + 150, cy - 42, "#94a3b8", 8);
  ctx.restore();

  // Ultrasound probe
  ctx.save();
  ctx.fillStyle = "rgba(56,189,248,0.2)"; ctx.strokeStyle = "#38bdf8"; ctx.lineWidth = 1.5;
  ctx.beginPath(); (ctx as any).roundRect(cx - 150, cy - 20, 30, 45, 6); ctx.fill(); ctx.stroke();
  txt(ctx, "Ultrasound", cx - 155, cy + 35, "#38bdf8", 7);
  txt(ctx, "probe", cx - 148, cy + 46, "#38bdf8", 7);
  ctx.restore();

  // Right side: procedure steps
  const rX = W - 250;
  txt(ctx, "Procedure & Analysis:", rX, 44, "#a78bfa", 10, true);
  const steps = [
    "1. Ultrasound guidance of needle",
    "2. Needle inserted into amniotic sac",
    "3. ~15 mL amniotic fluid withdrawn",
    "4. Fetal cells isolated + cultured",
    "5. Karyotype analysis performed",
    "6. Detects chromosomal abnormalities",
  ];
  steps.forEach((s, i) => txt(ctx, s, rX, 62 + i * 22, "#94a3b8", 9));

  ctx.save();
  ctx.fillStyle = "rgba(239,68,68,0.12)"; ctx.strokeStyle = "#ef4444"; ctx.lineWidth = 1;
  ctx.beginPath(); (ctx as any).roundRect(rX - 5, 196, 235, 75, 6); ctx.fill(); ctx.stroke();
  ctx.restore();
  txt(ctx, "⚠ Misuse for sex determination", rX + 5, 212, "#ef4444", 8.5, true);
  txt(ctx, "is illegal in India (PCPNDT Act)", rX + 5, 227, "#94a3b8", 8.5);
  txt(ctx, "Misuse leads to sex-selective abortion", rX + 5, 242, "#94a3b8", 8.5);
  txt(ctx, "(legally punishable offence)", rX + 5, 258, "#94a3b8", 8.5);

  infoPanel(ctx, [
    "Amniocentesis",
    "Done at 14–18 weeks of pregnancy",
    "Detects: Down syndrome (trisomy 21)",
    "Also detects: Trisomy 13, 18, XXY",
    "Sickle cell anaemia, haemophilia",
    "Small risk of miscarriage (~0.5%)",
  ], 10, H - 103, 248);
}

// ─── 13. MTP — Legal Window ────────────────────────────────────────────────────
function renderMTPWindow(ctx: CanvasRenderingContext2D) {
  bg(ctx);
  txt(ctx, "Medical Termination of Pregnancy (MTP) — Legal Framework", CX, 22, "#a78bfa", 12, true, "center");

  // Timeline bar
  const tX = 60, tY = 100, tW = W - 130, tH = 28;
  ctx.save();

  // Full pregnancy bar
  const g = ctx.createLinearGradient(tX, tY, tX + tW, tY);
  g.addColorStop(0, "#22c55e");
  g.addColorStop(20 / 40, "#22c55e");
  g.addColorStop(20 / 40, "#f59e0b");
  g.addColorStop(28 / 40, "#ef4444");
  g.addColorStop(1, "#7f1d1d");
  ctx.fillStyle = g;
  ctx.beginPath(); (ctx as any).roundRect(tX, tY, tW, tH, 6); ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.2)"; ctx.lineWidth = 1;
  ctx.strokeRect(tX, tY, tW, tH);
  ctx.restore();

  // Week markers
  [0, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40].forEach(wk => {
    const x = tX + (wk / 40) * tW;
    ctx.save(); ctx.strokeStyle = "rgba(255,255,255,0.4)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x, tY); ctx.lineTo(x, tY + tH); ctx.stroke();
    txt(ctx, `${wk}`, x - 4, tY + tH + 14, "#94a3b8", 8);
    ctx.restore();
  });
  txt(ctx, "Weeks of pregnancy →", CX, tY + tH + 30, "#64748b", 9, false, "center");

  // Zones
  const zone1X = tX, zone1W = (20 / 40) * tW;
  const zone2X = tX + zone1W, zone2W = (8 / 40) * tW;
  const zone3X = zone2X + zone2W;

  txt(ctx, "ZONE 1: LEGAL (< 20 weeks)", zone1X + zone1W / 2, tY - 12, "#22c55e", 9, true, "center");
  txt(ctx, "ZONE 2: Restricted", zone2X + zone2W / 2, tY - 12, "#f59e0b", 8, true, "center");
  txt(ctx, "ZONE 3: NOT", zone3X + (tX + tW - zone3X) / 2, tY - 12, "#ef4444", 8, true, "center");
  txt(ctx, "PERMITTED", zone3X + (tX + tW - zone3X) / 2, tY - 2, "#ef4444", 8, true, "center");

  // Details boxes
  const boxes = [
    {
      x: 20, y: 155, w: 240, h: 120, color: "#22c55e",
      title: "First Trimester (0–12 wks)",
      items: ["Requires 1 doctor's opinion", "Most common and safe time", "Can be performed on request", "Mifepristone + Misoprostol (pills)"],
    },
    {
      x: 270, y: 155, w: 220, h: 120, color: "#f59e0b",
      title: "12–20 Weeks",
      items: ["Requires 2 doctors' opinions", "Medical or surgical MTP", "Special cases only", "Risk increases with gestation"],
    },
    {
      x: 500, y: 155, w: 200, h: 120, color: "#ef4444",
      title: "After 20 Weeks",
      items: ["NOT legal in India", "MTP Act: 2021 amended", "Only life-threatening cases", "Court permission required"],
    },
  ];

  boxes.forEach(({ x, y, w, h, color, title, items }) => {
    ctx.save();
    ctx.fillStyle = `${color}15`; ctx.strokeStyle = color; ctx.lineWidth = 1.5;
    ctx.beginPath(); (ctx as any).roundRect(x, y, w, h, 8); ctx.fill(); ctx.stroke();
    ctx.restore();
    txt(ctx, title, x + w / 2, y + 16, color, 9, true, "center");
    items.forEach((item, i) => txt(ctx, `• ${item}`, x + 8, y + 32 + i * 20, "#94a3b8", 8));
  });

  infoPanel(ctx, [
    "MTP Act India (1971, amended 2021)",
    "Legal reasons for MTP:",
    "Rape / failure of contraception",
    "Risk to mother's physical/mental health",
    "Foetal abnormality detected",
    "About 15 million MTPs/yr in India",
  ], 10, H - 103, 250);
}

// ─── 14. Infertility & Causes ─────────────────────────────────────────────────
function renderInfertility(ctx: CanvasRenderingContext2D) {
  bg(ctx);
  txt(ctx, "Infertility — Causes & Assisted Reproductive Technologies", CX, 22, "#a78bfa", 12, true, "center");

  // Causes
  txt(ctx, "Causes of Infertility", 30, 50, "#f472b6", 11, true);
  txt(ctx, "Male Causes", 80, 70, "#3b82f6", 10, true);
  const maleCauses = [
    "Low sperm count (oligospermia)",
    "Poor sperm motility",
    "Abnormal sperm morphology",
    "Blocked vas deferens",
    "Hormonal imbalances",
    "Genetic factors",
  ];
  maleCauses.forEach((c, i) => txt(ctx, `• ${c}`, 22, 88 + i * 18, "#94a3b8", 8.5));

  txt(ctx, "Female Causes", 250, 70, "#f472b6", 10, true);
  const femaleCauses = [
    "Ovulation disorders (PCOS)",
    "Blocked fallopian tubes",
    "Uterine abnormalities",
    "Endometriosis",
    "Premature ovarian failure",
    "Hormonal imbalances",
  ];
  femaleCauses.forEach((c, i) => txt(ctx, `• ${c}`, 225, 88 + i * 18, "#94a3b8", 8.5));

  // ART options on right
  ctx.save();
  ctx.fillStyle = "rgba(167,139,250,0.08)"; ctx.strokeStyle = "rgba(167,139,250,0.3)"; ctx.lineWidth = 1;
  ctx.beginPath(); (ctx as any).roundRect(430, 38, 275, 250, 8); ctx.fill(); ctx.stroke();
  ctx.restore();
  txt(ctx, "Assisted Reproductive Technologies", 568, 55, "#a78bfa", 10, true, "center");

  const arts = [
    { name: "IVF + ET", desc: "In vitro fertilisation + Embryo transfer", color: "#22c55e" },
    { name: "GIFT", desc: "Gamete Intra Fallopian Transfer", color: "#3b82f6" },
    { name: "ZIFT", desc: "Zygote Intra Fallopian Transfer", color: "#a78bfa" },
    { name: "IUT", desc: "Intra Uterine Transfer (8-cell embryo)", color: "#f59e0b" },
    { name: "ICSI", desc: "Intra Cytoplasmic Sperm Injection", color: "#f472b6" },
    { name: "AI", desc: "Artificial Insemination (donor sperm)", color: "#38bdf8" },
  ];

  arts.forEach(({ name, desc, color }, i) => {
    const y = 72 + i * 36;
    ctx.save();
    ctx.fillStyle = `${color}20`;
    ctx.beginPath(); (ctx as any).roundRect(438, y - 2, 260, 28, 4); ctx.fill();
    ctx.restore();
    txt(ctx, name, 445, y + 12, color, 9, true);
    txt(ctx, desc, 490, y + 12, "#94a3b8", 8);
  });

  // Definition box at bottom
  ctx.save();
  ctx.fillStyle = "rgba(2,8,20,0.7)"; ctx.strokeStyle = "rgba(56,189,248,0.25)"; ctx.lineWidth = 1;
  ctx.beginPath(); (ctx as any).roundRect(10, H - 105, W - 20, 95, 7); ctx.fill(); ctx.stroke();
  ctx.restore();
  txt(ctx, "Infertility Definition:", 20, H - 88, "#38bdf8", 9, true);
  txt(ctx, "Inability to conceive after 1 year of unprotected intercourse.", 20, H - 72, "#94a3b8", 9);
  txt(ctx, "Affects ~10-15% of couples worldwide. NOT a disease — treated medically.", 20, H - 56, "#94a3b8", 9);
  txt(ctx, "ICSI: Direct injection of single sperm into egg cytoplasm — for severe male infertility.", 20, H - 40, "#94a3b8", 9);
  txt(ctx, "Surrogate mother: embryo implanted in uterus of another woman.", 20, H - 24, "#94a3b8", 9);
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

export default function ReproductiveHealthEngine({
  mode = "population-growth",
  onContextChange,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const frameRef = useRef(0);

  // Interactive state
  const [growthR, setGrowthR] = useState(0.12);
  const [carryingK, setCarryingK] = useState(500);
  const [showLogistic, setShowLogistic] = useState(true);
  const [iudType, setIudType] = useState("cu-releasing");
  const [contraHighlight, setContraHighlight] = useState("all");
  const [artType, setArtType] = useState("GIFT");
  const [ivfStep, setIvfStep] = useState(1);
  const [magType, setMagType] = useState("diamagnetic");

  const draw = useCallback((t: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    switch (mode) {
      case "population-growth":     renderPopulationGrowth(ctx, growthR, carryingK, showLogistic); break;
      case "india-population":      renderIndiaPopulation(ctx, t); break;
      case "contraception-overview": renderContraceptionOverview(ctx, contraHighlight); break;
      case "barrier-methods":       renderBarrierMethods(ctx, t); break;
      case "iud-mechanism":         renderIUDMechanism(ctx, iudType); break;
      case "oral-contraceptives":   renderOralContraceptives(ctx); break;
      case "surgical-methods":      renderSurgicalMethods(ctx); break;
      case "sti-types":             renderSTITypes(ctx); break;
      case "hiv-structure":         renderHIVStructure(ctx); break;
      case "ivf-procedure":         renderIVFSteps(ctx, ivfStep); break;
      case "gift-zift":             renderGIFTvsZIFT(ctx, artType); break;
      case "amniocentesis":         renderAmniocentesis(ctx); break;
      case "mtp-window":            renderMTPWindow(ctx); break;
      case "infertility-art":       renderInfertility(ctx); break;
      default:                      renderPopulationGrowth(ctx, growthR, carryingK, showLogistic); break;
    }

    if (onContextChange) {
      const contextMap: Record<string, string> = {
        "population-growth": `Population growth: r=${growthR.toFixed(2)}, K=${carryingK}. ${showLogistic ? "Showing both J-curve (exponential) and S-curve (logistic)" : "Showing exponential J-curve only"}`,
        "india-population": "India's population growth from 361 million (1951) to 1380 million (2021)",
        "contraception-overview": "All contraceptive methods: natural, barrier, IUD, hormonal, surgical, emergency",
        "barrier-methods": "Barrier contraceptives: male/female condoms, diaphragm prevent sperm reaching egg; also protect against STIs",
        "iud-mechanism": `IUD type: ${iudType}. IUDs are inserted into the uterus to prevent fertilization or implantation`,
        "oral-contraceptives": "Oral contraceptive pills: synthetic estrogen+progestin suppress FSH/LH → no ovulation",
        "surgical-methods": "Vasectomy (male: vas deferens cut) and tubectomy (female: fallopian tube tied/cut) — permanent contraception",
        "sti-types": "STIs: Gonorrhoea (bacteria), Syphilis (bacteria), HIV/AIDS (virus), Hepatitis B (virus), Chlamydia (bacteria), Genital Herpes (HSV-2)",
        "hiv-structure": "HIV: retrovirus with ssRNA, reverse transcriptase, gp120/gp41 glycoproteins, p24 capsid, p17 matrix, lipid envelope",
        "ivf-procedure": `IVF Step ${ivfStep}/5: ${["Ovarian stimulation","Egg retrieval","In vitro fertilisation","Embryo culture","Embryo transfer"][ivfStep-1]}`,
        "gift-zift": `ART: ${artType} — ${artType === "GIFT" ? "gametes to fallopian tube" : artType === "ZIFT" ? "zygote to fallopian tube" : "embryo to uterus"}`,
        "amniocentesis": "Amniocentesis: fluid from amniotic sac analysed for chromosomal abnormalities; illegal for sex determination in India",
        "mtp-window": "MTP Act India: legal <20 weeks; 1 doctor opinion <12 wks, 2 doctors 12-20 wks; illegal >20 wks except special cases",
        "infertility-art": "Infertility causes (male: low sperm count, female: PCOS/blocked tubes) and ART options: IVF, GIFT, ZIFT, ICSI, AI",
      };
      onContextChange(contextMap[mode] || mode);
    }
  }, [mode, growthR, carryingK, showLogistic, iudType, contraHighlight, artType, ivfStep, onContextChange]);

  useEffect(() => {
    const loop = () => {
      frameRef.current += 0.016;
      draw(frameRef.current);
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  const btn = (label: string, active: boolean, onClick: () => void, color = "cyan") => (
    <button
      key={label}
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
        active
          ? `bg-${color}-600 text-white shadow-md`
          : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200"
      }`}
      style={active ? { backgroundColor: { cyan: "#0891b2", purple: "#7c3aed", pink: "#db2777" }[color as string] || "#0891b2" } : undefined}
    >
      {label}
    </button>
  );

  const slider = (label: string, val: number, min: number, max: number, step: number, set: (v: number) => void, disp?: string) => (
    <div key={label} className="flex items-center gap-3 flex-1">
      <span className="text-xs text-gray-400 whitespace-nowrap w-32">{label}</span>
      <input type="range" min={min} max={max} step={step} value={val}
        onChange={e => set(parseFloat(e.target.value))}
        className="flex-1 accent-purple-500" />
      <span className="text-xs text-purple-400 font-bold w-20 text-right">{disp ?? val}</span>
    </div>
  );

  const renderControls = () => {
    if (mode === "population-growth") return (
      <div className="flex flex-col gap-2">
        <div className="flex gap-2 flex-wrap justify-center">
          {btn("Exponential only", !showLogistic, () => setShowLogistic(false))}
          {btn("Both curves", showLogistic, () => setShowLogistic(true))}
        </div>
        <div className="flex flex-col gap-2">
          {slider("Growth rate (r)", growthR, 0.05, 0.3, 0.01, setGrowthR, growthR.toFixed(2))}
          {showLogistic && slider("Carrying capacity (K)", carryingK, 100, 2000, 50, setCarryingK, `${carryingK}`)}
        </div>
      </div>
    );

    if (mode === "iud-mechanism") return (
      <div className="flex gap-2 justify-center flex-wrap">
        {btn("Non-medicated (Lippes Loop)", iudType === "non-medicated", () => setIudType("non-medicated"))}
        {btn("Cu-releasing (CuT)", iudType === "cu-releasing", () => setIudType("cu-releasing"))}
        {btn("Hormone-releasing (LNG-20)", iudType === "hormonal", () => setIudType("hormonal"))}
      </div>
    );

    if (mode === "gift-zift") return (
      <div className="flex gap-2 justify-center">
        {btn("GIFT", artType === "GIFT", () => setArtType("GIFT"))}
        {btn("ZIFT", artType === "ZIFT", () => setArtType("ZIFT"))}
        {btn("IUT", artType === "IUT", () => setArtType("IUT"))}
      </div>
    );

    if (mode === "ivf-procedure") return (
      <div className="flex gap-2 justify-center flex-wrap">
        {[1,2,3,4,5].map(s =>
          btn(`Step ${s}`, ivfStep === s, () => setIvfStep(s))
        )}
      </div>
    );

    return null;
  };

  const hasControls = ["population-growth", "iud-mechanism", "gift-zift", "ivf-procedure"].includes(mode);

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
