import { useEffect, useRef, useState } from "react";

interface Props {
  mode?: string;
  showFormula?: boolean;
  compareAxial?: boolean;
  showAngle?: boolean;
  showPE?: boolean;
  showStability?: boolean;
  showGraph?: boolean;
  animated?: boolean;
  onContextChange?: (ctx: string) => void;
}

const W = 700, H = 440;
const K = 8.99e9;

export default function ElectricDipole({
  mode = "field-lines",
  showFormula = true,
  compareAxial = false,
  showAngle = false,
  showPE = false,
  showStability = false,
  showGraph = false,
  animated = true,
  onContextChange,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);
  const [angle, setAngle] = useState(45);
  const [fieldStrength, setFieldStrength] = useState(3);
  const [dipoleLen, setDipoleLen] = useState(60);

  useEffect(() => {
    let running = true;
    const loop = () => {
      if (!running) return;
      timeRef.current += 0.018;
      draw(timeRef.current);
      animRef.current = requestAnimationFrame(loop);
    };
    loop();
    return () => { running = false; cancelAnimationFrame(animRef.current); };
  }, [mode, angle, fieldStrength, dipoleLen, showFormula, showGraph, showPE]);

  function draw(t: number) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#050a14"); bg.addColorStop(1, "#0a1525");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(100,140,255,0.07)"; ctx.lineWidth = 1;
    for (let x = 0; x <= W; x += 45) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y <= H; y += 45) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    const cx = W / 2, cy = H / 2;

    switch (mode) {
      case "field-lines": drawDipoleFieldLines(ctx, cx, cy, t); break;
      case "axial-field": drawAxialField(ctx, cx, cy, t); break;
      case "equatorial-field": drawEquatorialField(ctx, cx, cy, t); break;
      case "torque-in-field": drawTorqueInField(ctx, cx, cy, t); break;
      case "alignment": drawAlignment(ctx, cx, cy, t); break;
      case "potential-energy": drawPotentialEnergy(ctx, cx, cy, t); break;
      default: drawDipoleFieldLines(ctx, cx, cy, t);
    }

    if (showFormula) drawFormulaOverlay(ctx, mode, angle, fieldStrength, dipoleLen);
  }

  function drawDipoleCharge(ctx: CanvasRenderingContext2D, x: number, y: number, sign: number, t: number, r = 14) {
    const c = sign > 0 ? "#ff4444" : "#4488ff";
    const glow = ctx.createRadialGradient(x, y, 0, x, y, r * 1.8);
    glow.addColorStop(0, sign > 0 ? "rgba(255,80,80,0.4)" : "rgba(80,130,255,0.4)");
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(x, y, r * 1.8 * (1 + 0.05 * Math.sin(t * 2)), 0, Math.PI * 2); ctx.fill();
    const grad = ctx.createRadialGradient(x - 3, y - 3, 1, x, y, r);
    grad.addColorStop(0, "#fff"); grad.addColorStop(0.3, c); grad.addColorStop(1, sign > 0 ? "#cc0000" : "#0033cc");
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.font = `bold ${r}px sans-serif`;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(sign > 0 ? "+" : "−", x, y);
    ctx.textBaseline = "alphabetic";
  }

  function drawDipoleFieldLines(ctx: CanvasRenderingContext2D, cx: number, cy: number, t: number) {
    const d = dipoleLen;
    const px = cx - d / 2, nx = cx + d / 2;
    const charges = [{ x: px, y: cy, q: 1 }, { x: nx, y: cy, q: -1 }];

    // Field lines via Euler method
    const nLines = 14;
    for (let li = 0; li < nLines; li++) {
      const startAngle = (2 * Math.PI * li) / nLines;
      let x = px + 16 * Math.cos(startAngle);
      let y = cy + 16 * Math.sin(startAngle);
      const pts: { x: number; y: number }[] = [{ x, y }];

      for (let s = 0; s < 500; s++) {
        let Ex = 0, Ey = 0;
        for (const c of charges) {
          const dx = x - c.x, dy = y - c.y;
          const r2 = dx * dx + dy * dy;
          if (r2 < 100) break;
          const E = c.q / r2;
          Ex += E * dx / Math.sqrt(r2); Ey += E * dy / Math.sqrt(r2);
        }
        const mag = Math.sqrt(Ex * Ex + Ey * Ey);
        if (mag < 1e-8) break;
        x += (Ex / mag) * 4; y += (Ey / mag) * 4;
        if (x < 20 || x > W - 20 || y < 20 || y > H - 20) break;
        pts.push({ x, y });
        const dx = x - nx, dy = y - cy;
        if (Math.sqrt(dx * dx + dy * dy) < 14) break;
      }

      if (pts.length < 2) continue;
      ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
      for (const p of pts.slice(1)) ctx.lineTo(p.x, p.y);
      const hue = 180 + li * 20;
      ctx.strokeStyle = `hsla(${hue % 360},80%,65%,0.5)`; ctx.lineWidth = 1.5; ctx.stroke();

      // Particle along line
      const pFrac = (t * 0.12 + li * 0.07) % 1;
      const pidx = Math.floor(pFrac * (pts.length - 1));
      if (pidx < pts.length) {
        const pp = pts[pidx];
        const grd = ctx.createRadialGradient(pp.x, pp.y, 0, pp.x, pp.y, 5);
        grd.addColorStop(0, "rgba(255,255,255,0.9)"); grd.addColorStop(1, "rgba(100,200,255,0)");
        ctx.fillStyle = grd;
        ctx.beginPath(); ctx.arc(pp.x, pp.y, 4, 0, Math.PI * 2); ctx.fill();
      }
    }

    // Dipole axis
    ctx.strokeStyle = "rgba(255,255,100,0.25)"; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(50, cy); ctx.lineTo(W - 50, cy); ctx.stroke(); ctx.setLineDash([]);

    // Charges
    drawDipoleCharge(ctx, px, cy, 1, t);
    drawDipoleCharge(ctx, nx, cy, -1, t + Math.PI);

    // Dipole moment arrow
    ctx.strokeStyle = "rgba(255,220,80,0.8)"; ctx.lineWidth = 2;
    drawArrow(ctx, px + 5, cy + 30, nx - 5, cy + 30, "rgba(255,220,80,0.9)");
    ctx.fillStyle = "#ffdd50"; ctx.font = "bold 12px sans-serif"; ctx.textAlign = "center";
    ctx.fillText("p⃗ (dipole moment)", cx, cy + 48);

    // Labels
    ctx.fillStyle = "#ff8080"; ctx.font = "11px sans-serif";
    ctx.textAlign = "center"; ctx.fillText("+q", px, cy - 22);
    ctx.fillStyle = "#80aaff"; ctx.fillText("−q", nx, cy - 22);
    ctx.fillStyle = "rgba(255,255,100,0.6)";
    ctx.fillText("2l (dipole length)", cx, cy - 25);
  }

  function drawAxialField(ctx: CanvasRenderingContext2D, cx: number, cy: number, t: number) {
    const d = 50;
    drawDipoleCharge(ctx, cx - d, cy, 1, t);
    drawDipoleCharge(ctx, cx + d, cy, -1, t + Math.PI);

    // Axial line
    ctx.strokeStyle = "rgba(255,255,100,0.3)"; ctx.lineWidth = 1; ctx.setLineDash([5, 5]);
    ctx.beginPath(); ctx.moveTo(40, cy); ctx.lineTo(W - 40, cy); ctx.stroke(); ctx.setLineDash([]);

    // Field along axial line (direction of p on positive side, opposite on negative side)
    const points = [-200, -150, -120, 120, 150, 200];
    for (const pos of points) {
      const ax = cx + pos;
      const r = Math.abs(pos) / 100;
      const E = 2 / (r * r * r);
      const len = Math.min(45, E * 12);
      const dir = pos > 0 ? 1 : 1; // axial field always along p direction
      const frac = (t * 0.15 + (pos + 200) * 0.005) % 1;
      const ax2 = ax - len * dir / 2 + frac * len * dir;
      drawArrow(ctx, ax2 - 15 * dir, cy, ax2 + 15 * dir, cy, pos > 0 ? "rgba(100,220,100,0.9)" : "rgba(100,180,255,0.7)");
    }

    // Labels showing E_axial = 2kp/r³
    ctx.fillStyle = "#80ff80"; ctx.font = "bold 12px monospace"; ctx.textAlign = "center";
    ctx.fillText("E_axial = 2kp/r³  (along p direction)", cx, cy - 60);
    ctx.fillStyle = "rgba(255,255,100,0.7)"; ctx.font = "11px sans-serif";
    ctx.fillText("r is measured from center of dipole to the point", cx, cy - 42);
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.fillText("← End-on position / Axial line →", cx, cy + 40);

    // r arrow annotation
    ctx.strokeStyle = "rgba(255,255,100,0.5)"; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(cx, cy - 20); ctx.lineTo(cx + 150, cy - 20); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = "#ffff60"; ctx.font = "11px sans-serif"; ctx.textAlign = "center";
    ctx.fillText("r", cx + 80, cy - 26);
  }

  function drawEquatorialField(ctx: CanvasRenderingContext2D, cx: number, cy: number, t: number) {
    const d = 50;
    drawDipoleCharge(ctx, cx - d, cy, 1, t);
    drawDipoleCharge(ctx, cx + d, cy, -1, t + Math.PI);

    // Equatorial (perpendicular bisector) line — vertical
    ctx.strokeStyle = "rgba(255,255,100,0.3)"; ctx.lineWidth = 1; ctx.setLineDash([5, 5]);
    ctx.beginPath(); ctx.moveTo(cx, 30); ctx.lineTo(cx, H - 30); ctx.stroke(); ctx.setLineDash([]);

    // Field along equatorial line — antiparallel to p
    const eqPoints = [-150, -100, -60, 60, 100, 150];
    for (const pos of eqPoints) {
      const ay = cy + pos;
      const r = Math.abs(pos) / 80;
      const E = 1 / (r * r * r + 0.1);
      const len = Math.min(40, E * 8);
      // Field direction is opposite to p (which points +x direction)
      const frac = (t * 0.12 + (pos + 150) * 0.006) % 1;
      const ay2 = ay;
      const ax2 = cx - len / 2 + frac * len;
      drawArrow(ctx, ax2 - 15, ay2, ax2 + 15, ay2, "rgba(100,180,255,0.8)");
    }

    ctx.fillStyle = "#80aaff"; ctx.font = "bold 12px monospace"; ctx.textAlign = "center";
    ctx.fillText("E_equatorial = kp/r³  (opposite to p)", cx + 130, cy);
    ctx.fillStyle = "rgba(255,220,100,0.7)"; ctx.font = "11px sans-serif";
    ctx.fillText("E_axial = 2 × E_equatorial  at same r", cx + 130, cy + 20);
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.fillText("← Broad-on / Equatorial line →", cx - 150, cy + 40);

    if (compareAxial) {
      ctx.fillStyle = "#80ff80"; ctx.font = "bold 11px sans-serif"; ctx.textAlign = "center";
      ctx.fillText("Compare: Axial field is TWICE equatorial field at same distance!", cx, H - 40);
    }
  }

  function drawTorqueInField(ctx: CanvasRenderingContext2D, cx: number, cy: number, t: number) {
    const d = 45;
    const rad = (angle * Math.PI) / 180;
    const px1 = cx - d * Math.cos(rad), py1 = cy - d * Math.sin(rad);
    const px2 = cx + d * Math.cos(rad), py2 = cy + d * Math.sin(rad);

    // External uniform field arrows (horizontal)
    for (let y = 60; y < H; y += 55) {
      ctx.strokeStyle = "rgba(255,200,100,0.3)"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(30, y); ctx.lineTo(W - 30, y); ctx.stroke();
      drawArrow(ctx, 60, y, 140, y, "rgba(255,200,100,0.5)");
      drawArrow(ctx, 250, y, 330, y, "rgba(255,200,100,0.5)");
      drawArrow(ctx, 430, y, 510, y, "rgba(255,200,100,0.5)");
      drawArrow(ctx, 580, y, 660, y, "rgba(255,200,100,0.5)");
    }
    ctx.fillStyle = "rgba(255,200,100,0.7)"; ctx.font = "11px sans-serif";
    ctx.textAlign = "left"; ctx.fillText(`E (external field strength = ${fieldStrength})`, 30, 20);

    // Torque arc
    const torque = Math.sin(rad) * fieldStrength * dipoleLen;
    const torqueDir = torque > 0 ? -1 : 1;
    if (Math.abs(torque) > 0.01) {
      ctx.strokeStyle = "rgba(255,100,255,0.7)"; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, 80, Math.min(-rad, -rad + 0.3 * torqueDir), Math.max(-rad, -rad + 0.3 * torqueDir));
      ctx.stroke();
    }

    // Dipole
    ctx.strokeStyle = "rgba(255,255,255,0.4)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(px1, py1); ctx.lineTo(px2, py2); ctx.stroke();
    drawDipoleCharge(ctx, px1, py1, 1, t);
    drawDipoleCharge(ctx, px2, py2, -1, t + Math.PI);

    // Force arrows on charges (F = qE on + charge along E, F = -qE on - charge)
    const fLen = fieldStrength * 8;
    drawArrow(ctx, px1, py1, px1 + fLen, py1, "rgba(100,255,100,0.8)");
    drawArrow(ctx, px2, py2, px2 - fLen, py2, "rgba(100,150,255,0.8)");

    // p vector
    drawArrow(ctx, cx - 30 * Math.cos(rad), cy - 30 * Math.sin(rad),
      cx + 30 * Math.cos(rad), cy + 30 * Math.sin(rad), "rgba(255,220,80,0.9)");

    // Angle arc
    ctx.strokeStyle = "rgba(100,255,100,0.5)"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(cx, cy, 50, 0, rad, rad < 0); ctx.stroke();
    ctx.fillStyle = "#80ff80"; ctx.font = "bold 12px sans-serif"; ctx.textAlign = "center";
    ctx.fillText(`θ = ${angle}°`, cx + 65, cy - 15);

    const tauVal = (fieldStrength * dipoleLen * Math.abs(Math.sin(rad)) * 0.1).toFixed(2);
    ctx.fillStyle = "#ff80ff"; ctx.font = "bold 13px monospace";
    ctx.fillText(`τ = pE sinθ = ${tauVal} N·m`, cx, H - 50);
    ctx.fillStyle = "rgba(255,255,255,0.6)"; ctx.font = "11px sans-serif";
    ctx.fillText("Torque tends to ALIGN dipole with external field", cx, H - 32);
  }

  function drawAlignment(ctx: CanvasRenderingContext2D, cx: number, cy: number, t: number) {
    // Show 3 dipoles: θ=0 (stable), θ=90 (max torque), θ=180 (unstable)
    const configs = [
      { angle: 0, x: 160, label: "θ=0° Stable\nU = -pE (min)", color: "#80ff80" },
      { angle: 90, x: cx, label: "θ=90° Max Torque\nU = 0", color: "#ffff60" },
      { angle: 180, x: W - 160, label: "θ=180° Unstable\nU = +pE (max)", color: "#ff8080" },
    ];

    // External field arrows
    for (let y = 60; y < H - 60; y += 50) {
      drawArrow(ctx, 30, y, 110, y, "rgba(255,200,100,0.4)");
      drawArrow(ctx, cx - 40, y, cx + 40, y, "rgba(255,200,100,0.4)");
      drawArrow(ctx, W - 110, y, W - 30, y, "rgba(255,200,100,0.4)");
    }

    for (const cfg of configs) {
      const rad = (cfg.angle * Math.PI) / 180;
      const d = 40;
      const cos = Math.cos(rad), sin = Math.sin(rad);
      const px1 = cfg.x - d * cos, py1 = cy - d * sin;
      const px2 = cfg.x + d * cos, py2 = cy + d * sin;

      ctx.strokeStyle = "rgba(255,255,255,0.4)"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(px1, py1); ctx.lineTo(px2, py2); ctx.stroke();
      drawDipoleCharge(ctx, px1, py1, 1, t, 12);
      drawDipoleCharge(ctx, px2, py2, -1, t + Math.PI, 12);

      // PE bar
      const pe = -Math.cos(rad);
      const barH = Math.abs(pe) * 50;
      const barY = cy + 90;
      ctx.fillStyle = pe < 0 ? "rgba(100,220,100,0.6)" : "rgba(255,100,100,0.6)";
      ctx.fillRect(cfg.x - 15, pe < 0 ? barY : barY - barH, 30, barH);
      ctx.strokeStyle = pe < 0 ? "#80ff80" : "#ff8080"; ctx.lineWidth = 1;
      ctx.strokeRect(cfg.x - 15, barY - 50, 30, 100);

      ctx.fillStyle = cfg.color; ctx.font = "bold 11px sans-serif"; ctx.textAlign = "center";
      const lines = cfg.label.split("\n");
      lines.forEach((line, i) => ctx.fillText(line, cfg.x, cy + 165 + i * 16));
    }

    ctx.fillStyle = "rgba(255,255,255,0.7)"; ctx.font = "bold 12px sans-serif"; ctx.textAlign = "center";
    ctx.fillText("PE = −pE cosθ = −p·E", cx, H - 20);
  }

  function drawPotentialEnergy(ctx: CanvasRenderingContext2D, cx: number, cy: number, t: number) {
    const rad = (angle * Math.PI) / 180;
    const pe = -fieldStrength * dipoleLen * 0.01 * Math.cos(rad);

    // Large PE graph
    const gx = 50, gy = 60, gw = 280, gh = 200;
    ctx.fillStyle = "rgba(5,15,30,0.8)"; ctx.strokeStyle = "rgba(100,150,255,0.2)";
    roundRect(ctx, gx, gy, gw, gh + 40, 10); ctx.fill(); ctx.stroke();

    ctx.fillStyle = "rgba(255,255,255,0.7)"; ctx.font = "bold 12px sans-serif"; ctx.textAlign = "center";
    ctx.fillText("U = −pE cosθ", gx + gw / 2, gy + 18);

    const ax = gx + 40, ay = gy + gh / 2 + 20;
    ctx.strokeStyle = "rgba(255,255,255,0.3)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(ax, gy + 25); ctx.lineTo(ax, gy + gh + 10); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(gx + gw - 10, ay); ctx.stroke();

    // Cosine curve (U = -pE cosθ)
    ctx.beginPath(); ctx.strokeStyle = "#64c8ff"; ctx.lineWidth = 2;
    for (let i = 0; i <= 200; i++) {
      const theta = (i / 200) * 2 * Math.PI;
      const u = -Math.cos(theta);
      const x = ax + (i / 200) * (gw - 50);
      const y = ay - u * 70;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Current angle marker
    const mx = ax + (angle / 360) * (gw - 50);
    const mu = -Math.cos(rad);
    const my = ay - mu * 70;
    ctx.beginPath(); ctx.arc(mx, my, 6, 0, Math.PI * 2);
    ctx.fillStyle = "#ffdd50"; ctx.fill();

    // Vertical dotted line from marker to x-axis
    ctx.setLineDash([3, 3]); ctx.strokeStyle = "rgba(255,220,80,0.5)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(mx, ay); ctx.lineTo(mx, my); ctx.stroke(); ctx.setLineDash([]);

    ctx.fillStyle = "#ffdd50"; ctx.font = "10px monospace"; ctx.textAlign = "left";
    ctx.fillText(`θ=${angle}°`, mx + 5, my - 3);
    ctx.fillText(`U=${pe.toFixed(2)}J`, mx + 5, my + 12);

    // Axis labels
    ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.font = "10px sans-serif"; ctx.textAlign = "center";
    ctx.fillText("0°", ax, ay + 14); ctx.fillText("180°", ax + (gw - 50) / 2, ay + 14);
    ctx.fillText("360°", ax + gw - 50, ay + 14);
    ctx.save(); ctx.translate(ax - 18, gy + gh / 2 + 20); ctx.rotate(-Math.PI / 2);
    ctx.fillText("U (PE)", 0, 0); ctx.restore();

    // Stability labels
    ctx.fillStyle = "#80ff80"; ctx.font = "10px sans-serif"; ctx.textAlign = "center";
    ctx.fillText("Min PE (Stable)", ax + 0, gy + gh + 32);
    ctx.fillStyle = "#ff8080";
    ctx.fillText("Max PE (Unstable)", ax + (gw - 50) / 2, gy + 35);

    // Dipole in field (right side)
    const dipCx = W - 170, dipCy = cy;
    const d = 40;
    const px1 = dipCx - d * Math.cos(rad), py1 = dipCy - d * Math.sin(rad);
    const px2 = dipCx + d * Math.cos(rad), py2 = dipCy + d * Math.sin(rad);
    for (let y = gy + 20; y < gy + gh + 40; y += 45)
      drawArrow(ctx, W - 240, y, W - 80, y, "rgba(255,200,100,0.3)");
    ctx.strokeStyle = "rgba(255,255,255,0.5)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(px1, py1); ctx.lineTo(px2, py2); ctx.stroke();
    drawDipoleCharge(ctx, px1, py1, 1, 0);
    drawDipoleCharge(ctx, px2, py2, -1, Math.PI);
    ctx.fillStyle = "#ffdd50"; ctx.font = "bold 11px sans-serif"; ctx.textAlign = "center";
    ctx.fillText(`U = ${pe.toFixed(3)} J`, dipCx, dipCy + 65);
    ctx.fillText(`θ = ${angle}°`, dipCx, dipCy + 82);
  }

  function drawArrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string) {
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 3) return;
    const ux = dx / len, uy = dy / len;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - 7 * ux + 3 * uy, y2 - 7 * uy - 3 * ux);
    ctx.lineTo(x2 - 7 * ux - 3 * uy, y2 - 7 * uy + 3 * ux);
    ctx.closePath(); ctx.fillStyle = color; ctx.fill();
  }

  function drawFormulaOverlay(ctx: CanvasRenderingContext2D, mode: string, ang: number, fs: number, dl: number) {
    const formulas: Record<string, string> = {
      "field-lines": "p = q × 2l  (dipole moment)",
      "axial-field": "E_axial = 2kp/r³",
      "equatorial-field": "E_eq = kp/r³",
      "torque-in-field": "τ = pE sinθ",
      "alignment": "U = −pE cosθ",
      "potential-energy": "U = −p·E = −pE cosθ",
    };
    ctx.fillStyle = "rgba(5,15,30,0.85)"; ctx.strokeStyle = "rgba(100,200,100,0.3)";
    roundRect(ctx, W - 240, H - 55, 220, 40, 8); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#80ff80"; ctx.font = "bold 13px monospace"; ctx.textAlign = "left";
    ctx.fillText(formulas[mode] || "Electric Dipole", W - 232, H - 30);
  }

  function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  useEffect(() => {
    const info: Record<string, string> = {
      "field-lines": `Dipole field lines visualization. Dipole length = ${dipoleLen}px. Field goes from +q to -q.`,
      "axial-field": `Axial field: E = 2kp/r³, directed along dipole moment p.`,
      "equatorial-field": `Equatorial field: E = kp/r³, anti-parallel to p. Half of axial at same distance.`,
      "torque-in-field": `Torque on dipole: τ = pE sinθ = ${(fieldStrength * dipoleLen * Math.abs(Math.sin(angle * Math.PI / 180)) * 0.1).toFixed(2)} N·m. Angle = ${angle}°`,
      "alignment": `Alignment in field. θ=0° (stable, U=−pE), θ=90° (max torque), θ=180° (unstable, U=+pE)`,
      "potential-energy": `Potential energy: U = −pE cosθ. At θ=${angle}°: U = ${(-fieldStrength * dipoleLen * 0.01 * Math.cos(angle * Math.PI / 180)).toFixed(2)} J`,
    };
    onContextChange?.(info[mode] || `Electric Dipole simulation — mode: ${mode}`);
  }, [mode, angle, fieldStrength, dipoleLen]);

  const showAngleControl = ["torque-in-field", "alignment", "potential-energy"].includes(mode);
  const showFieldControl = ["torque-in-field", "potential-energy"].includes(mode);
  const showLenControl = ["torque-in-field", "potential-energy", "field-lines"].includes(mode);

  const infoText: Record<string, string> = {
    "field-lines": "Field lines flow from +q to −q. The dipole moment p⃗ = q(2l) points from − to +. Field pattern is characteristic of many physical systems (molecules, antennas, magnets).",
    "axial-field": "On the axis (end-on position), E_axial = 2kp/r³. The factor 2 makes axial field stronger than equatorial. Both E and p point in the same direction.",
    "equatorial-field": "On equatorial line (broad-on), E_eq = kp/r³. Field points opposite to p. At same distance r: E_axial = 2 × E_equatorial.",
    "torque-in-field": "Dipole in uniform field: No net force, but torque τ = pE sinθ acts to align dipole with field. Maximum torque at θ = 90°, zero torque at 0° and 180°.",
    "alignment": "θ = 0° → stable equilibrium (minimum PE = −pE). θ = 180° → unstable equilibrium (maximum PE = +pE). Slight disturbance from 180° causes dipole to flip to 0°.",
    "potential-energy": "U = −p·E = −pE cosθ. Ranges from −pE (parallel, stable) to +pE (antiparallel, unstable). The PE graph shows one complete sinusoidal cycle as θ goes 0° to 360°.",
  };

  return (
    <div className="space-y-4">
      <canvas ref={canvasRef} width={W} height={H} className="w-full rounded-2xl" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {showAngleControl && (
          <div>
            <div className="flex justify-between text-sm font-medium text-gray-300 mb-1">
              <span>Angle θ with field</span>
              <span className="text-yellow-400 font-bold">{angle}°</span>
            </div>
            <input type="range" min={0} max={360} step={5} value={angle} onChange={e => setAngle(Number(e.target.value))}
              className="w-full accent-yellow-400" />
          </div>
        )}
        {showFieldControl && (
          <div>
            <div className="flex justify-between text-sm font-medium text-gray-300 mb-1">
              <span>Field Strength E</span>
              <span className="text-orange-400 font-bold">{fieldStrength}</span>
            </div>
            <input type="range" min={1} max={8} step={0.5} value={fieldStrength} onChange={e => setFieldStrength(Number(e.target.value))}
              className="w-full accent-orange-400" />
          </div>
        )}
        {showLenControl && (
          <div>
            <div className="flex justify-between text-sm font-medium text-gray-300 mb-1">
              <span>Dipole Length 2l</span>
              <span className="text-purple-400 font-bold">{dipoleLen}px</span>
            </div>
            <input type="range" min={30} max={120} step={10} value={dipoleLen} onChange={e => setDipoleLen(Number(e.target.value))}
              className="w-full accent-purple-400" />
          </div>
        )}
      </div>
      <div className="bg-gray-800/60 border border-gray-700 rounded-xl px-4 py-3">
        <p className="text-xs text-gray-300 leading-relaxed">
          <span className="text-purple-400 font-bold">Dipole Physics: </span>
          {infoText[mode] || "Electric dipole simulation."}
        </p>
      </div>
    </div>
  );
}
