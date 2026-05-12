import { useEffect, useRef, useState } from "react";

interface Props {
  distribution?: string;
  showE?: boolean;
  showFormula?: boolean;
  showAxis?: boolean;
  showMaxPoint?: boolean;
  showIntegration?: boolean;
  showShellTheorem?: boolean;
  showInside?: boolean;
  showFaradayCage?: boolean;
  showUniformField?: boolean;
  showOutsideCancel?: boolean;
  showInsideField?: boolean;
  showGraph?: boolean;
  showCancellation?: boolean;
  showGraphComparison?: boolean;
  onContextChange?: (ctx: string) => void;
}

const W = 700, H = 440;

export default function ChargeDistributions({
  distribution = "parallel-plates",
  showE = true,
  showFormula = true,
  showAxis = false,
  showMaxPoint = false,
  showGraph = false,
  showCancellation = false,
  showGraphComparison = false,
  showShellTheorem = false,
  showInsideField = false,
  onContextChange,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);
  const [sigma, setSigma] = useState(2);
  const [radius, setRadius] = useState(80);
  const [pointX, setPointX] = useState(250);

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
  }, [distribution, sigma, radius, pointX, showFormula, showGraph, showGraphComparison]);

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

    switch (distribution) {
      case "parallel-plates": drawParallelPlates(ctx, cx, cy, t); break;
      case "sheet": drawInfiniteSheet(ctx, cx, cy, t); break;
      case "sphere-outside": drawChargedSphere(ctx, cx, cy, t, false); break;
      case "hollow-sphere": drawHollowSphere(ctx, cx, cy, t); break;
      case "line": drawLineCharge(ctx, cx, cy, t); break;
      case "ring": drawRingCharge(ctx, cx, cy, t); break;
      case "disk": drawDiskCharge(ctx, cx, cy, t); break;
      case "non-conducting": drawNonConducting(ctx, cx, cy, t); break;
      case "ring-center": drawRingCenter(ctx, cx, cy, t); break;
      case "comparison": drawComparison(ctx, cx, cy, t); break;
      default: drawParallelPlates(ctx, cx, cy, t);
    }
  }

  function drawParallelPlates(ctx: CanvasRenderingContext2D, cx: number, cy: number, t: number) {
    const plateSep = 160, plateH = 200, plateW = 12;
    const lx = cx - plateSep / 2, rx = cx + plateSep / 2;

    // + plate (left)
    const posGrad = ctx.createLinearGradient(lx - plateW, 0, lx + plateW, 0);
    posGrad.addColorStop(0, "#cc2200"); posGrad.addColorStop(1, "#ff4422");
    ctx.fillStyle = posGrad;
    ctx.fillRect(lx - plateW, cy - plateH / 2, plateW, plateH);
    for (let y = cy - plateH / 2 + 20; y < cy + plateH / 2; y += 35) {
      ctx.fillStyle = "#ffaa88";
      ctx.font = "bold 16px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("+", lx - plateW / 2, y + 6);
    }

    // - plate (right)
    const negGrad = ctx.createLinearGradient(rx - plateW, 0, rx + plateW, 0);
    negGrad.addColorStop(0, "#2244cc"); negGrad.addColorStop(1, "#0022ff");
    ctx.fillStyle = negGrad;
    ctx.fillRect(rx, cy - plateH / 2, plateW, plateH);
    for (let y = cy - plateH / 2 + 20; y < cy + plateH / 2; y += 35) {
      ctx.fillStyle = "#88aaff";
      ctx.font = "bold 16px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("−", rx + plateW / 2, y + 6);
    }

    // Uniform field arrows between plates (animated particle flow)
    const numArrows = 5;
    for (let i = 0; i < numArrows; i++) {
      const y = cy - plateH / 2 + 30 + (i * (plateH - 60)) / (numArrows - 1);
      // Field line
      ctx.strokeStyle = "rgba(100,200,255,0.25)";
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(lx, y); ctx.lineTo(rx, y); ctx.stroke();
      // Arrow
      const aFrac = (t * 0.3 + i * 0.2) % 1;
      const ax = lx + aFrac * plateSep;
      drawArrow(ctx, ax - 20, y, ax + 20, y, "rgba(100,220,100,0.9)");
    }

    // Outside — field cancels
    ctx.strokeStyle = "rgba(255,100,100,0.3)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    for (let i = 0; i < 3; i++) {
      const y = cy - 60 + i * 60;
      ctx.beginPath(); ctx.moveTo(20, y); ctx.lineTo(lx - 15, y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(rx + plateW + 15, y); ctx.lineTo(W - 20, y); ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(255,100,100,0.6)";
    ctx.font = "11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("E = 0 (outside)", cx - plateSep - 50, cy);
    ctx.fillText("E = 0 (outside)", cx + plateSep + 20, cy);

    // Labels
    ctx.fillStyle = "#80ff80";
    ctx.font = "bold 14px monospace";
    ctx.textAlign = "center";
    ctx.fillText("E = σ/ε₀ (between plates)", cx, cy + plateH / 2 + 35);
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.font = "12px sans-serif";
    ctx.fillText("Uniform field — direction: + to −", cx, cy + plateH / 2 + 55);
  }

  function drawInfiniteSheet(ctx: CanvasRenderingContext2D, cx: number, cy: number, t: number) {
    const sheetY = cy;
    const sheetGrad = ctx.createLinearGradient(0, sheetY - 6, 0, sheetY + 6);
    sheetGrad.addColorStop(0, "rgba(255,150,50,0.8)");
    sheetGrad.addColorStop(1, "rgba(255,80,20,0.5)");
    ctx.fillStyle = sheetGrad;
    ctx.fillRect(0, sheetY - 5, W, 10);
    for (let x = 30; x < W; x += 45) {
      ctx.fillStyle = "#ffaa40";
      ctx.font = "bold 14px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("+", x, sheetY + 5);
    }

    // Field arrows above and below
    const cols = [120, 200, 280, 360, 440, 520, 600];
    for (const x of cols) {
      const frac = (t * 0.25 + x * 0.003) % 1;
      const ay = sheetY - 20 - frac * 100;
      drawArrow(ctx, x, ay + 30, x, ay - 10, "rgba(100,220,100,0.8)");
      const frac2 = (t * 0.25 + x * 0.003 + 0.5) % 1;
      const ay2 = sheetY + 20 + frac2 * 100;
      drawArrow(ctx, x, ay2 - 30, x, ay2 + 10, "rgba(100,220,100,0.8)");
    }

    ctx.fillStyle = "#80ff80";
    ctx.font = "bold 13px monospace";
    ctx.textAlign = "center";
    ctx.fillText("E = σ / 2ε₀  (both sides, perpendicular)", cx, sheetY - 145);
    ctx.fillStyle = "rgba(255,220,100,0.7)";
    ctx.font = "12px sans-serif";
    ctx.fillText("Field is UNIFORM — no r dependence!", cx, sheetY - 125);
    ctx.fillText("↑ upward above  |  downward below ↓", cx, sheetY + 155);
  }

  function drawChargedSphere(ctx: CanvasRenderingContext2D, cx: number, cy: number, t: number, inside: boolean) {
    const R = 80;
    // Draw sphere
    const sGrad = ctx.createRadialGradient(cx - 20, cy - 20, 10, cx, cy, R);
    sGrad.addColorStop(0, "rgba(255,180,80,0.5)");
    sGrad.addColorStop(1, "rgba(255,80,20,0.2)");
    ctx.fillStyle = sGrad;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "rgba(255,150,50,0.9)";
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.fillStyle = "#ffaa50";
    ctx.font = "bold 12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`R = ${R}px (Charged Sphere)`, cx, cy + R + 20);

    // + on surface
    for (let i = 0; i < 10; i++) {
      const angle = (2 * Math.PI * i) / 10;
      const sx = cx + R * Math.cos(angle), sy = cy + R * Math.sin(angle);
      ctx.fillStyle = "#ffdd80";
      ctx.font = "bold 12px sans-serif";
      ctx.fillText("+", sx, sy + 4);
    }

    // Radial field arrows outside
    for (let i = 0; i < 8; i++) {
      const angle = (2 * Math.PI * i) / 8;
      const frac = (t * 0.2 + i * 0.15) % 1;
      const r1 = R + 15 + frac * 80;
      const r2 = r1 + 25;
      drawArrow(ctx, cx + r1 * Math.cos(angle), cy + r1 * Math.sin(angle),
        cx + r2 * Math.cos(angle), cy + r2 * Math.sin(angle), "rgba(100,220,100,0.8)");
    }

    ctx.fillStyle = "#80ff80";
    ctx.font = "bold 13px monospace";
    ctx.textAlign = "center";
    ctx.fillText("Outside: E = kQ/r²  (like point charge)", cx, cy - R - 30);
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.font = "11px sans-serif";
    ctx.fillText("Shell Theorem: All charge acts as if at center", cx, cy - R - 12);
  }

  function drawHollowSphere(ctx: CanvasRenderingContext2D, cx: number, cy: number, t: number) {
    const R = 100;
    // Hollow sphere shell
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,150,50,0.8)"; ctx.lineWidth = 4;
    ctx.fillStyle = "rgba(0,0,0,0)"; ctx.fill(); ctx.stroke();

    // + charges on shell
    for (let i = 0; i < 12; i++) {
      const angle = (2 * Math.PI * i) / 12;
      ctx.fillStyle = "#ffaa50"; ctx.font = "bold 12px sans-serif"; ctx.textAlign = "center";
      ctx.fillText("+", cx + R * Math.cos(angle), cy + R * Math.sin(angle) + 4);
    }

    // Inside — zero field markers
    ctx.fillStyle = "rgba(100,200,255,0.15)";
    ctx.beginPath(); ctx.arc(cx, cy, R - 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(255,255,100,0.7)";
    ctx.font = "bold 15px sans-serif"; ctx.textAlign = "center";
    ctx.fillText("E = 0", cx, cy - 10);
    ctx.font = "12px sans-serif";
    ctx.fillText("(inside hollow sphere)", cx, cy + 10);

    // × markers for zero field
    for (let i = 0; i < 5; i++) {
      const angle = (2 * Math.PI * i) / 5, r = 50;
      const sx = cx + r * Math.cos(angle), sy = cy + r * Math.sin(angle);
      ctx.fillStyle = "rgba(255,255,100,0.4)";
      ctx.font = "14px sans-serif"; ctx.fillText("×", sx - 5, sy + 5);
    }

    // Outside field arrows
    for (let i = 0; i < 8; i++) {
      const angle = (2 * Math.PI * i) / 8;
      const frac = (t * 0.2 + i * 0.125) % 1;
      const r1 = R + 15 + frac * 60, r2 = r1 + 20;
      drawArrow(ctx, cx + r1 * Math.cos(angle), cy + r1 * Math.sin(angle),
        cx + r2 * Math.cos(angle), cy + r2 * Math.sin(angle), "rgba(100,220,100,0.7)");
    }

    ctx.fillStyle = "#80ff80"; ctx.font = "bold 13px monospace"; ctx.textAlign = "center";
    ctx.fillText("Outside: E = kQ/r²", cx, cy - R - 25);
    ctx.fillStyle = "rgba(255,255,100,0.8)";
    ctx.fillText("Inside: E = 0 ← Faraday Cage Principle", cx, cy + R + 25);
  }

  function drawLineCharge(ctx: CanvasRenderingContext2D, cx: number, cy: number, t: number) {
    // Vertical wire
    ctx.strokeStyle = "rgba(255,150,50,0.9)"; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(cx, 20); ctx.lineTo(cx, H - 20); ctx.stroke();
    for (let y = 40; y < H - 30; y += 30) {
      ctx.fillStyle = "#ffaa40"; ctx.font = "bold 13px sans-serif"; ctx.textAlign = "center";
      ctx.fillText("+", cx, y + 4);
    }
    ctx.fillStyle = "rgba(255,150,50,0.6)"; ctx.font = "11px sans-serif";
    ctx.fillText("Linear charge density λ", cx + 15, 30);

    // Radial field arrows (horizontal) at multiple heights
    const heights = [100, cy, H - 120];
    const radii = [40, 80, 120, 160, 200];
    for (const wireY of heights) {
      for (const r of radii) {
        const frac = (t * 0.2 + r * 0.01) % 1;
        const r1 = r + frac * 35, r2 = r1 + 20;
        // Right side
        drawArrow(ctx, cx + r1, wireY, cx + r2, wireY, "rgba(100,220,100,0.7)");
        // Left side
        drawArrow(ctx, cx - r1, wireY, cx - r2, wireY, "rgba(100,220,100,0.7)");
      }
    }

    ctx.fillStyle = "#80ff80"; ctx.font = "bold 13px monospace"; ctx.textAlign = "center";
    ctx.fillText("E = λ / 2πε₀r  (radially outward)", cx + 180, cy);
    ctx.fillStyle = "rgba(255,255,255,0.6)"; ctx.font = "11px sans-serif";
    ctx.fillText("E ∝ 1/r  (not 1/r² as for point charge!)", cx + 180, cy + 20);
  }

  function drawRingCharge(ctx: CanvasRenderingContext2D, cx: number, cy: number, t: number) {
    const R = 80;
    // Draw ring (as ellipse for 3D feel)
    ctx.strokeStyle = "rgba(255,150,50,0.8)"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(cx, cy, R, R * 0.3, 0, 0, Math.PI * 2); ctx.stroke();

    // + charges on ring
    for (let i = 0; i < 10; i++) {
      const angle = (2 * Math.PI * i) / 10;
      const px = cx + R * Math.cos(angle), py = cy + R * 0.3 * Math.sin(angle);
      ctx.fillStyle = "#ffaa40"; ctx.font = "bold 11px sans-serif";
      ctx.textAlign = "center"; ctx.fillText("+", px, py + 4);
    }

    // Axis line
    ctx.strokeStyle = "rgba(255,255,100,0.4)"; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(cx - 200, cy); ctx.lineTo(cx + 250, cy); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(255,255,100,0.6)"; ctx.font = "11px sans-serif";
    ctx.textAlign = "left"; ctx.fillText("Axis →", cx + 220, cy - 5);

    // Animated test point on axis
    const testX = cx + 80 + 60 * Math.sin(t * 0.5);
    ctx.beginPath(); ctx.arc(testX, cy, 6, 0, Math.PI * 2);
    ctx.fillStyle = "#64c8ff"; ctx.fill();
    ctx.fillStyle = "rgba(100,200,255,0.8)"; ctx.font = "10px sans-serif";
    ctx.textAlign = "center"; ctx.fillText("P (test point)", testX, cy - 14);

    // Field arrow at test point
    const x = testX - cx;
    const Ex_dir = x > 0 ? 1 : -1;
    drawArrow(ctx, testX, cy, testX + Ex_dir * 35, cy, "rgba(100,220,100,0.9)");

    ctx.fillStyle = "#80ff80"; ctx.font = "bold 12px monospace";
    ctx.textAlign = "center";
    ctx.fillText("E = kQx / (R²+x²)^(3/2)  along axis", cx, cy + R * 0.3 + 40);
    ctx.fillStyle = "rgba(255,220,100,0.8)"; ctx.font = "11px sans-serif";
    ctx.fillText("Field = 0 at center  |  Max at x = R/√2", cx, cy + R * 0.3 + 58);
  }

  function drawDiskCharge(ctx: CanvasRenderingContext2D, cx: number, cy: number, t: number) {
    const R = 90;
    // Disk
    ctx.fillStyle = "rgba(255,150,50,0.15)";
    ctx.beginPath(); ctx.ellipse(cx, cy, R, R * 0.25, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "rgba(255,150,50,0.8)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(cx, cy, R, R * 0.25, 0, 0, Math.PI * 2); ctx.stroke();

    // Concentric rings showing disk = sum of rings
    for (let r = 20; r <= R; r += 20) {
      ctx.beginPath(); ctx.ellipse(cx, cy, r, r * 0.25, 0, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255,150,50,${0.15 + r / R * 0.3})`; ctx.stroke();
    }

    // Axis arrows
    for (let i = 0; i < 4; i++) {
      const pos = [-150, -80, 80, 150][i];
      const frac = (t * 0.2 + i * 0.25) % 1;
      const start = Math.sign(pos) * 10;
      const end = start + Math.sign(pos) * frac * 80;
      drawArrow(ctx, cx + start, cy, cx + end, cy, "rgba(100,220,100,0.7)");
    }

    ctx.fillStyle = "#80ff80"; ctx.font = "bold 12px monospace"; ctx.textAlign = "center";
    ctx.fillText("E = σ/2ε₀ × (1 - x/√(R²+x²))", cx, cy + 55);
    ctx.fillStyle = "rgba(255,255,255,0.6)"; ctx.font = "11px sans-serif";
    ctx.fillText("Disk = sum of many thin rings (integration)", cx, cy + 73);
    ctx.fillText("As R→∞, disk → infinite sheet: E → σ/2ε₀", cx, cy + 91);
  }

  function drawNonConducting(ctx: CanvasRenderingContext2D, cx: number, cy: number, t: number) {
    const R = 90;
    // Sphere with volume charge (non-conducting)
    const sGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
    sGrad.addColorStop(0, "rgba(255,180,80,0.5)");
    sGrad.addColorStop(1, "rgba(255,100,30,0.15)");
    ctx.fillStyle = sGrad;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "rgba(255,150,50,0.8)"; ctx.lineWidth = 2; ctx.stroke();

    // + charges distributed throughout volume
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * 2 * Math.PI;
      const r = Math.random() * (R - 15);
      if (Math.floor(t * 100) % 3 === 0) continue;
      ctx.fillStyle = "rgba(255,200,80,0.5)"; ctx.font = "12px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("+", cx + r * Math.cos(angle), cy + r * Math.sin(angle) + 4);
    }

    // Stable + positions
    const stablePositions = [[0, -50], [40, -30], [-40, -30], [50, 20], [-50, 20], [0, 55], [25, 50], [-25, 50]];
    for (const [dx, dy] of stablePositions) {
      ctx.fillStyle = "rgba(255,200,80,0.8)"; ctx.font = "12px sans-serif"; ctx.textAlign = "center";
      ctx.fillText("+", cx + dx, cy + dy + 4);
    }

    ctx.fillStyle = "#80ff80"; ctx.font = "bold 12px monospace"; ctx.textAlign = "center";
    ctx.fillText("Inside: E = kQr/R³  (∝ r, linear)", cx, cy + R + 22);
    ctx.fillText("Outside: E = kQ/r²  (∝ 1/r²)", cx, cy + R + 40);

    if (showGraph) {
      drawEvsRGraph(ctx, R);
    }
  }

  function drawRingCenter(ctx: CanvasRenderingContext2D, cx: number, cy: number, t: number) {
    const R = 100;
    ctx.strokeStyle = "rgba(255,150,50,0.8)"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = "rgba(255,150,50,0.08)";
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();

    // Charges with force arrows pointing to center (cancellation)
    const numCharges = 8;
    for (let i = 0; i < numCharges; i++) {
      const angle = (2 * Math.PI * i) / numCharges;
      const sx = cx + R * Math.cos(angle), sy = cy + R * Math.sin(angle);
      ctx.fillStyle = "#ffaa40"; ctx.font = "bold 14px sans-serif"; ctx.textAlign = "center";
      ctx.fillText("+", sx, sy + 5);
      // Arrow toward center
      const len = 30;
      ctx.strokeStyle = "rgba(100,200,255,0.5)"; ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx - len * Math.cos(angle), sy - len * Math.sin(angle));
      ctx.stroke();
    }

    // Center point — zero field
    ctx.beginPath(); ctx.arc(cx, cy, 8, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,100,0.9)"; ctx.fill();
    ctx.fillStyle = "#ffff60"; ctx.font = "bold 13px sans-serif"; ctx.textAlign = "center";
    ctx.fillText("E = 0", cx, cy - 18);
    ctx.fillStyle = "rgba(255,255,255,0.6)"; ctx.font = "11px sans-serif";
    ctx.fillText("(contributions cancel by symmetry)", cx, cy + 25);
    ctx.fillText("All E vectors at center point in opposite pairs", cx, cy + 42);
  }

  function drawComparison(ctx: CanvasRenderingContext2D, cx: number, cy: number, t: number) {
    const gx = 50, gy = 50, gw = W - 100, gh = H - 130;

    ctx.fillStyle = "rgba(5,15,30,0.8)"; ctx.strokeStyle = "rgba(100,150,255,0.2)";
    roundRect(ctx, gx, gy, gw, gh, 12); ctx.fill(); ctx.stroke();

    ctx.fillStyle = "rgba(255,255,255,0.8)"; ctx.font = "bold 13px sans-serif"; ctx.textAlign = "center";
    ctx.fillText("Electric Field vs Distance — Comparison", cx, gy + 22);

    // Axes
    const ax = gx + 60, ay = gy + gh - 30, aw = gw - 80, ah = gh - 60;
    ctx.strokeStyle = "rgba(255,255,255,0.4)"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax + aw, ay); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax, ay - ah); ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.font = "11px sans-serif";
    ctx.fillText("r →", ax + aw + 5, ay + 4);
    ctx.save(); ctx.translate(ax - 12, ay - ah / 2); ctx.rotate(-Math.PI / 2);
    ctx.fillText("E ↑", 0, 0); ctx.restore();

    // Plot curves
    const colors = ["#ff6060", "#60ff60", "#6060ff"];
    const labels = ["Point charge: E ∝ 1/r²", "Dipole: E ∝ 1/r³", "Infinite sheet: E = const"];
    for (let curve = 0; curve < 3; curve++) {
      ctx.beginPath(); ctx.strokeStyle = colors[curve]; ctx.lineWidth = 2;
      for (let i = 1; i <= aw; i++) {
        const r = 0.1 + (i / aw) * 2;
        let E: number;
        if (curve === 0) E = 1 / (r * r);
        else if (curve === 1) E = 1 / (r * r * r);
        else E = 0.15;
        const ey = ay - Math.min(ah - 10, E * 40);
        if (i === 1) ctx.moveTo(ax + i, ey); else ctx.lineTo(ax + i, ey);
      }
      ctx.stroke();
      // Legend
      ctx.fillStyle = colors[curve]; ctx.font = "11px sans-serif"; ctx.textAlign = "left";
      ctx.fillText(labels[curve], ax + 10, gy + 45 + curve * 18);
    }
  }

  function drawEvsRGraph(ctx: CanvasRenderingContext2D, R: number) {
    const gx = W - 180, gy = H - 170, gw = 160, gh = 130;
    ctx.fillStyle = "rgba(5,15,30,0.8)"; ctx.strokeStyle = "rgba(100,150,255,0.2)";
    roundRect(ctx, gx, gy, gw, gh, 8); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.6)"; ctx.font = "10px sans-serif"; ctx.textAlign = "center";
    ctx.fillText("E vs r", gx + gw / 2, gy + 14);

    const ax = gx + 25, ay = gy + gh - 20;
    ctx.strokeStyle = "rgba(255,255,255,0.3)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(gx + gw - 10, ay); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax, gy + 20); ctx.stroke();

    const maxW = gw - 40;
    ctx.beginPath(); ctx.strokeStyle = "#80ff80"; ctx.lineWidth = 2;
    for (let i = 1; i <= maxW; i++) {
      const r = (i / maxW) * 2 * R;
      const E = r < R ? r / (R * R) : R / (r * r);
      const ey = ay - Math.min(gh - 40, E * 80);
      if (i === 1) ctx.moveTo(ax + i, ey); else ctx.lineTo(ax + i, ey);
    }
    ctx.stroke();
    // R marker
    const rxPos = ax + maxW / 2;
    ctx.strokeStyle = "rgba(255,255,100,0.5)"; ctx.setLineDash([3, 3]); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(rxPos, ay); ctx.lineTo(rxPos, gy + 20); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(255,255,100,0.7)"; ctx.font = "9px sans-serif"; ctx.textAlign = "center";
    ctx.fillText("R", rxPos, ay + 10);
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
    const descriptions: Record<string, string> = {
      "parallel-plates": "Parallel plates: uniform E = σ/ε₀ between, zero outside",
      "sheet": "Infinite sheet: E = σ/2ε₀, uniform, distance independent",
      "sphere-outside": "Charged sphere outside: E = kQ/r² (Shell theorem)",
      "hollow-sphere": "Hollow sphere: E=0 inside, E=kQ/r² outside",
      "line": "Line charge: E = λ/2πε₀r, radially outward",
      "ring": "Charged ring axis: E = kQx/(R²+x²)^(3/2)",
      "disk": "Charged disk: E = σ/2ε₀ × (1 - x/√(R²+x²))",
      "non-conducting": "Non-conducting sphere: E∝r inside, E∝1/r² outside",
      "ring-center": "Ring center: E = 0 by symmetry",
      "comparison": "Comparison: point charge (1/r²), dipole (1/r³), sheet (constant)",
    };
    onContextChange?.(`Charge Distribution: ${distribution}. ${descriptions[distribution] || "Electric field visualization"}`);
  }, [distribution]);

  const controlMap: Record<string, string> = {
    "parallel-plates": "Uniform E field between two oppositely charged infinite plates. No r-dependence inside.",
    "sheet": "Infinite plane sheet creates uniform field E = σ/2ε₀ on both sides. Field does not weaken with distance.",
    "sphere-outside": "Outside a uniformly charged sphere, all charge appears concentrated at center (Shell theorem). E = kQ/r².",
    "hollow-sphere": "Electric field inside a hollow sphere is exactly zero (Gauss's law). Outside: E = kQ/r².",
    "line": "Infinite line charge: E = λ/2πε₀r. Falls as 1/r, not 1/r².",
    "ring": "On ring axis: E = kQx/(R²+x²)^(3/2). Zero at center, max at x = R/√2.",
    "disk": "Disk is sum of concentric rings. E = σ/2ε₀(1 - x/√(R²+x²)).",
    "non-conducting": "Volume charge: E increases linearly inside (∝r), falls as 1/r² outside.",
    "ring-center": "At ring center, all contributions cancel by symmetry → E = 0.",
    "comparison": "Point charge (1/r²) falls fastest. Dipole (1/r³) falls even faster. Sheet has no r-dependence.",
  };

  return (
    <div className="space-y-3">
      <canvas ref={canvasRef} width={W} height={H} className="w-full rounded-2xl" />
      <div className="bg-gray-800/60 border border-gray-700 rounded-xl px-4 py-3">
        <p className="text-xs text-gray-300 leading-relaxed">
          <span className="text-orange-400 font-bold">Distribution: </span>
          {controlMap[distribution] || "Electric field visualization for this charge distribution."}
        </p>
      </div>
    </div>
  );
}
