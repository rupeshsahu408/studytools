import { useEffect, useRef, useState } from "react";
import { RotateCcw, RotateCw } from "lucide-react";

interface Props {
  surfaceType?: string;
  chargeInside?: boolean;
  chargeOutside?: boolean;
  chargePair?: boolean;
  showFluxArrows?: boolean;
  showFormula?: boolean;
  showAngle?: boolean;
  showCancellation?: boolean;
  showShapeComparison?: boolean;
  chargeType?: string;
  onContextChange?: (ctx: string) => void;
}

const W = 700, H = 440;

export default function GaussLawExplorer({
  surfaceType = "sphere",
  chargeInside = true,
  chargeOutside = false,
  chargePair = false,
  showFluxArrows = true,
  showFormula = true,
  showCancellation = false,
  showShapeComparison = false,
  chargeType = "point",
  onContextChange,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);
  const [enclosed, setEnclosed] = useState(2);
  const [tiltAngle, setTiltAngle] = useState(0);

  const flux = chargePair ? 0 : (chargeInside ? enclosed * 1.13e11 : 0);

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
  }, [surfaceType, chargeInside, chargeOutside, chargePair, enclosed, tiltAngle, showFluxArrows, showFormula, showCancellation, showShapeComparison]);

  function draw(t: number) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    // ── Background ────────────────────────────────────────────────────────
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#050a14");
    bg.addColorStop(1, "#0a1525");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = "rgba(100,140,255,0.07)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= W; x += 45) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y <= H; y += 45) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    const cx = W / 2, cy = H / 2;

    if (showShapeComparison) {
      drawShapeComparison(ctx, cx, cy, t, enclosed);
      drawFormulaBox(ctx, surfaceType, chargeInside, chargeOutside, chargePair, enclosed, showFormula);
      return;
    }

    if (surfaceType === "tilted") {
      drawTiltedSurface(ctx, cx, cy, t, tiltAngle);
      drawFormulaBox(ctx, surfaceType, chargeInside, chargeOutside, chargePair, enclosed, showFormula);
      return;
    }

    // ── Main Gaussian surface ─────────────────────────────────────────────
    const surfaceR = 130;

    if (surfaceType === "sphere") {
      drawSphereGauss(ctx, cx, cy, surfaceR, t, chargeInside, chargeOutside, chargePair, showFluxArrows, enclosed);
    } else if (surfaceType === "cylinder") {
      drawCylinderGauss(ctx, cx, cy, surfaceR, t, showFluxArrows, enclosed);
    } else if (surfaceType === "pillbox") {
      drawPillboxGauss(ctx, cx, cy, surfaceR, t, showFluxArrows, enclosed);
    }

    // ── Flux counter ──────────────────────────────────────────────────────
    drawFluxCounter(ctx, flux, chargeInside, chargeOutside, chargePair, t);
    drawFormulaBox(ctx, surfaceType, chargeInside, chargeOutside, chargePair, enclosed, showFormula);
  }

  function drawSphereGauss(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, t: number, inside: boolean, outside: boolean, pair: boolean, showArrows: boolean, q: number) {
    // Draw outer glow of Gaussian surface
    const outerGlow = ctx.createRadialGradient(cx, cy, r - 5, cx, cy, r + 25);
    outerGlow.addColorStop(0, "rgba(80,180,255,0.15)");
    outerGlow.addColorStop(1, "rgba(80,180,255,0)");
    ctx.fillStyle = outerGlow;
    ctx.beginPath(); ctx.arc(cx, cy, r + 25, 0, Math.PI * 2); ctx.fill();

    // Gaussian surface (translucent sphere)
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(80,180,255,0.7)";
    ctx.lineWidth = 2.5;
    ctx.setLineDash([8, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(80,180,255,0.04)";
    ctx.fill();

    // "Gaussian Surface" label
    ctx.fillStyle = "rgba(80,200,255,0.8)";
    ctx.font = "bold 12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Gaussian Surface", cx, cy - r - 12);

    // ── Charge(s) at center ───────────────────────────────────────────────
    if (inside) {
      if (pair) {
        drawCharge(ctx, cx - 20, cy, 1, t); // +q
        drawCharge(ctx, cx + 20, cy, -1, t + Math.PI); // -q
        ctx.fillStyle = "rgba(255,255,100,0.8)";
        ctx.font = "11px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("q_net = 0", cx, cy + 45);
        ctx.fillText("∴ Φ_net = 0", cx, cy + 60);
      } else {
        for (let qi = 0; qi < q; qi++) {
          const ox = (qi - (q - 1) / 2) * 25;
          drawCharge(ctx, cx + ox, cy, 1, t + qi * 0.5);
        }
      }
    }

    if (outside) {
      drawCharge(ctx, cx + r + 60, cy, 1, t);
      ctx.fillStyle = "rgba(255,200,100,0.7)";
      ctx.font = "11px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("charge outside →", cx + r + 60, cy + 40);
      ctx.fillText("flux through surface = 0", cx, cy + 80);
    }

    // ── Flux arrows through sphere ────────────────────────────────────────
    if (showArrows && inside && !pair) {
      const numArrows = 12;
      for (let i = 0; i < numArrows; i++) {
        const angle = (2 * Math.PI * i) / numArrows + t * 0.2;
        const ix = cx + (r - 22) * Math.cos(angle);
        const iy = cy + (r - 22) * Math.sin(angle);
        const ox = cx + (r + 22) * Math.cos(angle);
        const oy = cy + (r + 22) * Math.sin(angle);
        drawArrow(ctx, ix, iy, ox, oy, "rgba(100,220,100,0.8)");
      }
    }

    if (showArrows && outside) {
      // Arrows enter and exit — net zero
      for (let i = 0; i < 8; i++) {
        const baseAngle = (2 * Math.PI * i) / 8;
        const enterDir = Math.atan2(cy - cy, (cx + r + 60) - cx + Math.cos(baseAngle) * 20);
        const ix = cx + r * Math.cos(baseAngle);
        const iy = cy + r * Math.sin(baseAngle);
        const dir = Math.atan2(iy - cy, ix - (cx + r + 60));
        drawArrow(ctx, ix - 18 * Math.cos(dir), iy - 18 * Math.sin(dir), ix + 18 * Math.cos(dir), iy + 18 * Math.sin(dir), "rgba(255,200,100,0.5)");
      }
    }
  }

  function drawCylinderGauss(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, t: number, showArrows: boolean, q: number) {
    const cylH = 160, cylW = 100;
    const top = cy - cylH / 2, bot = cy + cylH / 2;

    // Vertical line charge
    ctx.strokeStyle = "rgba(255,150,50,0.8)";
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(cx, top - 30); ctx.lineTo(cx, bot + 30); ctx.stroke();
    // + symbols along wire
    for (let y = top - 20; y <= bot + 20; y += 25) {
      ctx.fillStyle = "#ffa030";
      ctx.font = "bold 14px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("+", cx, y + 5);
    }
    ctx.fillStyle = "rgba(255,150,50,0.6)";
    ctx.font = "11px sans-serif";
    ctx.fillText("λ (line charge)", cx + 15, top - 35);

    // Cylinder walls
    ctx.strokeStyle = "rgba(80,180,255,0.7)";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath(); ctx.moveTo(cx - cylW / 2, top); ctx.lineTo(cx - cylW / 2, bot); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + cylW / 2, top); ctx.lineTo(cx + cylW / 2, bot); ctx.stroke();
    // Ellipses for top and bottom caps
    ctx.beginPath(); ctx.ellipse(cx, top, cylW / 2, 15, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(cx, bot, cylW / 2, 15, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);

    // Radial flux arrows from curved surface
    if (showArrows) {
      for (let i = 0; i < 6; i++) {
        const angle = (2 * Math.PI * i) / 6 + t * 0.15;
        const yPos = top + (cylH / 5) * (i % 3 + 1);
        const ix = cx + (cylW / 2 - 5) * Math.cos(angle);
        const oy = yPos;
        const ox = cx + (cylW / 2 + 20) * Math.cos(angle);
        drawArrow(ctx, ix, oy, ox, oy, "rgba(100,220,100,0.8)");
      }
    }

    // Dimension markers
    ctx.strokeStyle = "rgba(255,255,100,0.5)";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(cx + cylW / 2 + 5, top); ctx.lineTo(cx + cylW / 2 + 30, top); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + cylW / 2 + 5, bot); ctx.lineTo(cx + cylW / 2 + 30, bot); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + cylW / 2 + 17, top); ctx.lineTo(cx + cylW / 2 + 17, bot); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#ffff60";
    ctx.font = "11px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("L", cx + cylW / 2 + 22, cy);
    ctx.fillStyle = "rgba(80,180,255,0.8)";
    ctx.font = "bold 12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Cylindrical Gaussian Surface", cx, bot + 35);
    ctx.fillText("E = λ / 2πε₀r", cx, bot + 52);
  }

  function drawPillboxGauss(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, t: number, showArrows: boolean, q: number) {
    const sheetY = cy;
    // Infinite sheet
    const sheetGrad = ctx.createLinearGradient(0, sheetY - 5, 0, sheetY + 5);
    sheetGrad.addColorStop(0, "rgba(255,150,50,0.6)");
    sheetGrad.addColorStop(1, "rgba(255,100,20,0.3)");
    ctx.fillStyle = sheetGrad;
    ctx.fillRect(0, sheetY - 4, W, 8);
    // + charges along sheet
    for (let x = 30; x < W; x += 50) {
      ctx.fillStyle = "#ffaa40";
      ctx.font = "bold 12px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("+", x, sheetY + 5);
    }
    ctx.fillStyle = "rgba(255,150,50,0.6)";
    ctx.font = "11px sans-serif";
    ctx.fillText("σ (surface charge density)", cx, sheetY + 22);

    // Pillbox (Gaussian surface — a flat cylinder)
    const pbW = 80, pbH = 50;
    ctx.strokeStyle = "rgba(80,180,255,0.8)";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 4]);
    // Top cap
    ctx.beginPath(); ctx.ellipse(cx, sheetY - pbH, pbW, 14, 0, 0, Math.PI * 2); ctx.stroke();
    // Bottom cap
    ctx.beginPath(); ctx.ellipse(cx, sheetY + pbH, pbW, 14, 0, 0, Math.PI * 2); ctx.stroke();
    // Side
    ctx.beginPath(); ctx.moveTo(cx - pbW, sheetY - pbH); ctx.lineTo(cx - pbW, sheetY + pbH); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + pbW, sheetY - pbH); ctx.lineTo(cx + pbW, sheetY + pbH); ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = "rgba(80,180,255,0.8)";
    ctx.font = "bold 12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Pillbox Gaussian Surface", cx, sheetY - pbH - 22);

    // Upward flux arrows
    if (showArrows) {
      for (let i = -2; i <= 2; i++) {
        const ax = cx + i * 28;
        drawArrow(ctx, ax, sheetY - 10, ax, sheetY - pbH + 15, "rgba(100,220,100,0.9)");
        drawArrow(ctx, ax, sheetY + 10, ax, sheetY + pbH - 15, "rgba(100,220,100,0.9)");
      }
    }

    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = "13px monospace";
    ctx.textAlign = "center";
    ctx.fillText("E = σ / 2ε₀  (each side)", cx, sheetY + pbH + 35);
  }

  function drawTiltedSurface(ctx: CanvasRenderingContext2D, cx: number, cy: number, t: number, angle: number) {
    const surf_w = 120, surf_h = 80;
    const rad = (tiltAngle * Math.PI) / 180;

    // Uniform field arrows (horizontal)
    ctx.strokeStyle = "rgba(100,200,255,0.3)";
    for (let y = 100; y < H - 80; y += 35) {
      drawArrow(ctx, 50, y, 150, y, "rgba(100,200,255,0.5)");
    }
    ctx.fillStyle = "rgba(100,200,255,0.7)";
    ctx.font = "bold 12px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("E →", 55, 85);

    // Tilted surface
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rad);
    ctx.strokeStyle = "rgba(255,180,80,0.9)";
    ctx.lineWidth = 2.5;
    ctx.fillStyle = "rgba(255,180,80,0.1)";
    ctx.beginPath();
    ctx.rect(-surf_w / 2, -surf_h / 2, surf_w, surf_h);
    ctx.fill();
    ctx.stroke();

    // Area vector normal
    ctx.strokeStyle = "#ffdd60";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -60); ctx.stroke();
    // Arrowhead on normal
    ctx.beginPath();
    ctx.moveTo(0, -60);
    ctx.lineTo(-5, -50);
    ctx.lineTo(5, -50);
    ctx.closePath();
    ctx.fillStyle = "#ffdd60";
    ctx.fill();
    ctx.fillStyle = "#ffdd60";
    ctx.font = "bold 11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("A⃗ (normal)", 0, -68);
    ctx.restore();

    // Angle indicator
    ctx.strokeStyle = "rgba(100,255,100,0.6)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, 50, -Math.PI / 2, -Math.PI / 2 + rad, rad > 0);
    ctx.stroke();
    ctx.fillStyle = "#80ff80";
    ctx.font = "bold 12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`θ = ${tiltAngle}°`, cx + 65, cy - 30);

    const flux = Math.abs(Math.cos(rad));
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.font = "13px monospace";
    ctx.fillText(`Φ = EA cosθ = EA × ${flux.toFixed(2)}`, cx, cy + 120);
    ctx.fillText(`(${tiltAngle === 0 ? "max flux — surface ⊥ E" : tiltAngle === 90 ? "zero flux — surface ∥ E" : "partial flux"})`, cx, cy + 140);
  }

  function drawShapeComparison(ctx: CanvasRenderingContext2D, cx: number, cy: number, t: number, q: number) {
    const shapes = [
      { x: 180, label: "Sphere", type: "sphere" },
      { x: 360, label: "Cube", type: "cube" },
      { x: 540, label: "Ellipsoid", type: "ellipsoid" },
    ];
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = "bold 14px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Same Enclosed Charge → Same Flux through ANY closed surface", cx, 35);

    for (const s of shapes) {
      const sy = cy;
      // Draw shape
      ctx.strokeStyle = "rgba(80,180,255,0.7)";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.fillStyle = "rgba(80,180,255,0.05)";
      if (s.type === "sphere") {
        ctx.beginPath(); ctx.arc(s.x, sy, 70, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      } else if (s.type === "cube") {
        ctx.beginPath(); ctx.rect(s.x - 65, sy - 65, 130, 130); ctx.fill(); ctx.stroke();
      } else {
        ctx.beginPath(); ctx.ellipse(s.x, sy, 90, 55, 0.3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      }
      ctx.setLineDash([]);
      drawCharge(ctx, s.x, sy, 1, t);
      ctx.fillStyle = "rgba(100,220,100,0.8)";
      ctx.font = "bold 12px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`Φ = q/ε₀`, s.x, sy + 95);
      ctx.fillStyle = "rgba(80,180,255,0.8)";
      ctx.font = "12px sans-serif";
      ctx.fillText(s.label, s.x, sy - 85);
    }
  }

  function drawFluxCounter(ctx: CanvasRenderingContext2D, flux: number, inside: boolean, outside: boolean, pair: boolean, t: number) {
    const fx = W - 195, fy = 20;
    ctx.fillStyle = "rgba(5,15,30,0.9)";
    ctx.strokeStyle = "rgba(100,200,255,0.3)";
    ctx.lineWidth = 1;
    roundRect(ctx, fx, fy, 175, 110, 10);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = "#64c8ff";
    ctx.font = "bold 11px monospace";
    ctx.textAlign = "left";
    ctx.fillText("FLUX METER", fx + 10, fy + 20);

    const displayFlux = pair ? 0 : (outside ? 0 : flux);
    const fluxStr = pair ? "0 (cancels)" : outside ? "0 (q outside)" : `${(enclosed).toFixed(0)}q / ε₀`;
    ctx.fillStyle = pair || outside ? "#ffaa44" : "#44ff88";
    ctx.font = `bold 16px monospace`;
    ctx.fillText(fluxStr, fx + 10, fy + 48);

    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "10px monospace";
    ctx.fillText("Gauss's Law:", fx + 10, fy + 68);
    ctx.fillText("∮ E·dA = q_enc / ε₀", fx + 10, fy + 84);
    ctx.fillText(`q_enc = ${pair ? "0" : outside ? "0" : `${enclosed}e`}`, fx + 10, fy + 100);
  }

  function drawFormulaBox(ctx: CanvasRenderingContext2D, type: string, inside: boolean, outside: boolean, pair: boolean, q: number, show: boolean) {
    if (!show) return;
    ctx.fillStyle = "rgba(5,15,30,0.85)";
    ctx.strokeStyle = "rgba(100,200,100,0.3)";
    roundRect(ctx, 20, 20, 210, 100, 10);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = "#80ff80";
    ctx.font = "bold 13px monospace";
    ctx.textAlign = "left";
    const formulas: Record<string, string> = {
      sphere: "E = kq / r²",
      cylinder: "E = λ / 2πε₀r",
      pillbox: "E = σ / 2ε₀",
      tilted: "Φ = EA cosθ",
      "any-shape": "Φ = q_enc / ε₀",
    };
    ctx.fillText(formulas[type] || "∮ E·dA = q/ε₀", 32, 52);
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "10px sans-serif";
    ctx.fillText("Gauss's Law Application", 32, 30);
    ctx.fillText(
      type === "sphere" ? "Spherical Gaussian surface" :
        type === "cylinder" ? "Cylindrical surface (line charge)" :
          type === "pillbox" ? "Pillbox (infinite plane sheet)" :
            type === "tilted" ? "Flux depends on angle with E" : "Any closed surface",
      32, 72
    );
  }

  function drawCharge(ctx: CanvasRenderingContext2D, x: number, y: number, sign: number, t: number) {
    const c = sign > 0 ? "#ff4444" : "#4488ff";
    const glow = ctx.createRadialGradient(x, y, 0, x, y, 20);
    glow.addColorStop(0, sign > 0 ? "rgba(255,80,80,0.4)" : "rgba(80,130,255,0.4)");
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(x, y, 20 * (1 + 0.06 * Math.sin(t * 3)), 0, Math.PI * 2); ctx.fill();

    const grad = ctx.createRadialGradient(x - 3, y - 3, 1, x, y, 12);
    grad.addColorStop(0, "#fff"); grad.addColorStop(0.3, c); grad.addColorStop(1, sign > 0 ? "#cc0000" : "#0033cc");
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(x, y, 12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "bold 14px sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(sign > 0 ? "+" : "−", x, y);
    ctx.textBaseline = "alphabetic";
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
    ctx.lineTo(x2 - 8 * ux + 4 * uy, y2 - 8 * uy - 4 * ux);
    ctx.lineTo(x2 - 8 * ux - 4 * uy, y2 - 8 * uy + 4 * ux);
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
    const netFlux = chargePair ? 0 : (chargeInside ? flux : 0);
    onContextChange?.(`Gauss's Law Explorer — Surface: ${surfaceType}. Charge inside: ${chargeInside ? `${enclosed}q` : "none"}. Net flux = ${netFlux.toExponential(2)} N·m²/C. Gauss's Law: ∮E·dA = q_enc/ε₀`);
  }, [surfaceType, chargeInside, chargeOutside, chargePair, enclosed, flux]);

  return (
    <div className="space-y-4">
      <canvas ref={canvasRef} width={W} height={H} className="w-full rounded-2xl" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {chargeInside && !chargePair && (
          <div>
            <div className="flex justify-between text-sm font-medium text-gray-300 mb-1">
              <span>Enclosed Charge</span>
              <span className="text-green-400 font-bold">{enclosed}q</span>
            </div>
            <input type="range" min={1} max={6} step={1} value={enclosed} onChange={e => setEnclosed(Number(e.target.value))}
              className="w-full accent-green-500" />
          </div>
        )}
        {surfaceType === "tilted" && (
          <div>
            <div className="flex justify-between text-sm font-medium text-gray-300 mb-1">
              <span>Surface Tilt Angle θ</span>
              <span className="text-yellow-400 font-bold">{tiltAngle}°</span>
            </div>
            <input type="range" min={0} max={90} step={5} value={tiltAngle} onChange={e => setTiltAngle(Number(e.target.value))}
              className="w-full accent-yellow-400" />
            <div className="flex justify-between text-xs text-gray-500 mt-0.5"><span>0° (max flux)</span><span>90° (zero flux)</span></div>
          </div>
        )}
      </div>

      <div className="bg-gray-800/60 border border-gray-700 rounded-xl px-4 py-3">
        <p className="text-xs text-gray-300 leading-relaxed">
          <span className="text-green-400 font-bold">Gauss's Law: ∮E·dA = q_enc / ε₀ — </span>
          {chargeInside && !chargePair && "The total electric flux through any closed surface equals the net enclosed charge divided by ε₀. Try increasing the charge!"}
          {chargePair && "Equal and opposite charges inside give q_net = 0, so total flux = 0, even though field ≠ 0 everywhere."}
          {chargeOutside && "When charge is outside the closed surface, flux entering = flux leaving → net flux = 0. Only enclosed charge matters."}
          {surfaceType === "tilted" && "Φ = EA cosθ. When surface is perpendicular to E (θ=0°), flux is maximum. When parallel (θ=90°), flux = 0."}
          {surfaceType === "cylinder" && "E = λ/2πε₀r — field around an infinite line charge. The cylindrical Gaussian surface exploits the symmetry."}
          {surfaceType === "pillbox" && "E = σ/2ε₀ — field from infinite plane sheet. The pillbox surface captures flux from both sides."}
          {showShapeComparison && "The shape of the Gaussian surface doesn't matter — only the enclosed charge determines the total flux!"}
        </p>
      </div>
    </div>
  );
}
