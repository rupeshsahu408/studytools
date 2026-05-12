import { useEffect, useRef, useState, useCallback } from "react";
import { RotateCcw, ZoomIn, ZoomOut } from "lucide-react";

interface Charge {
  x: number; // canvas coords (0-1 normalized)
  y: number;
  q: number; // charge value (+ve or -ve)
  label?: string;
}

interface Props {
  mode?: string;
  charge?: number;
  showVectors?: boolean;
  showLines?: boolean;
  showNeutralPoint?: boolean;
  showEquipotential?: boolean;
  showHeatmap?: boolean;
  showSuperposition?: boolean;
  showFormula?: boolean;
  showDensity?: boolean;
  showArrows?: boolean;
  interactive?: boolean;
  highlight?: boolean;
  showNetForce?: boolean;
  showCancellation?: boolean;
  showFaradayCage?: boolean;
  showShellTheorem?: boolean;
  showInsideField?: boolean;
  showGraph?: boolean;
  compareAxial?: boolean;
  showPE?: boolean;
  showStability?: boolean;
  showAngle?: boolean;
  animated?: boolean;
  showCalculation?: boolean;
  showUniformField?: boolean;
  showOutsideCancel?: boolean;
  showInside?: boolean;
  showGraphComparison?: boolean;
  showCondensation?: boolean;
  onContextChange?: (ctx: string) => void;
}

const W = 700, H = 440;
const K = 8.99e9;

function getChargesForMode(mode: string, charge: number): Charge[] {
  switch (mode) {
    case "single":
      return [{ x: 0.5, y: 0.5, q: charge > 0 ? 1 : -1, label: charge > 0 ? "+q" : "-q" }];
    case "two-same-positive":
      return [
        { x: 0.33, y: 0.5, q: 1, label: "+q" },
        { x: 0.67, y: 0.5, q: 1, label: "+q" },
      ];
    case "dipole":
    case "field-lines":
      return [
        { x: 0.38, y: 0.5, q: 1, label: "+q" },
        { x: 0.62, y: 0.5, q: -1, label: "-q" },
      ];
    case "triangle":
      return [
        { x: 0.5, y: 0.25, q: 1, label: "+q" },
        { x: 0.3, y: 0.65, q: -1, label: "-q" },
        { x: 0.7, y: 0.65, q: 1, label: "+q" },
      ];
    case "square":
      return [
        { x: 0.3, y: 0.3, q: 1, label: "+q" },
        { x: 0.7, y: 0.3, q: -1, label: "-q" },
        { x: 0.3, y: 0.7, q: -1, label: "-q" },
        { x: 0.7, y: 0.7, q: 1, label: "+q" },
      ];
    case "custom-5":
      return [
        { x: 0.5, y: 0.25, q: 2, label: "+2q" },
        { x: 0.25, y: 0.4, q: -1, label: "-q" },
        { x: 0.75, y: 0.4, q: -1, label: "-q" },
        { x: 0.3, y: 0.72, q: 1, label: "+q" },
        { x: 0.7, y: 0.72, q: 1, label: "+q" },
      ];
    case "equilibrium":
      return [
        { x: 0.2, y: 0.5, q: 4, label: "+4q" },
        { x: 0.8, y: 0.5, q: 1, label: "+q" },
      ];
    case "conductor-in-field":
      return [
        { x: 0.1, y: 0.5, q: 1, label: "+q" },
        { x: 0.1, y: 0.5, q: 1 },
        { x: 0.9, y: 0.5, q: -1, label: "-q" },
        { x: 0.9, y: 0.5, q: -1 },
      ];
    default:
      return [{ x: 0.5, y: 0.5, q: 1, label: "+q" }];
  }
}

function electricField(charges: Charge[], px: number, py: number, W: number, H: number) {
  let Ex = 0, Ey = 0;
  for (const c of charges) {
    const cx = c.x * W, cy = c.y * H;
    const dx = px - cx, dy = py - cy;
    const r2 = dx * dx + dy * dy;
    if (r2 < 100) continue;
    const r = Math.sqrt(r2);
    const E = c.q / r2;
    Ex += E * dx / r;
    Ey += E * dy / r;
  }
  return { Ex, Ey };
}

function drawArrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string, width = 1.5) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 2) return;
  const headLen = Math.min(8, len * 0.4);
  const angle = Math.atan2(dy, dx);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - headLen * Math.cos(angle - 0.4), y2 - headLen * Math.sin(angle - 0.4));
  ctx.lineTo(x2 - headLen * Math.cos(angle + 0.4), y2 - headLen * Math.sin(angle + 0.4));
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

export default function ElectricFieldExplorer({
  mode = "single", charge = 1, showVectors = true, showLines = true,
  showNeutralPoint = false, showHeatmap = false, interactive = false,
  showNetForce = false, showCalculation = false, onContextChange,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const particlesRef = useRef<{ x: number; y: number; t: number; lineIdx: number }[]>([]);
  const [charges, setCharges] = useState<Charge[]>(() => getChargesForMode(mode, charge));
  const [dragging, setDragging] = useState<number | null>(null);
  const [fieldMag, setFieldMag] = useState<number>(0);
  const timeRef = useRef(0);

  const drawScene = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    timeRef.current += 0.016;
    const t = timeRef.current;

    // ── Background: deep science lab gradient ───────────────────────────
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#0a0e1a");
    bg.addColorStop(1, "#0d1b2a");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // ── Grid ─────────────────────────────────────────────────────────────
    ctx.strokeStyle = "rgba(100,150,255,0.08)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= W; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y <= H; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // ── Heatmap layer ────────────────────────────────────────────────────
    if (showHeatmap) {
      const step = 8;
      for (let px = 0; px < W; px += step) {
        for (let py = 0; py < H; py += step) {
          const { Ex, Ey } = electricField(charges, px + step / 2, py + step / 2, W, H);
          const mag = Math.sqrt(Ex * Ex + Ey * Ey);
          const norm = Math.min(1, mag * 0.8);
          const r = Math.round(255 * norm);
          const b = Math.round(255 * (1 - norm));
          ctx.fillStyle = `rgba(${r},50,${b},0.18)`;
          ctx.fillRect(px, py, step, step);
        }
      }
    }

    // ── Field lines ──────────────────────────────────────────────────────
    if (showLines) {
      const fieldLines: { x: number; y: number }[][] = [];
      const posCharges = charges.filter((c) => c.q > 0);
      const linesPerCharge = Math.max(8, Math.floor(16 / Math.max(posCharges.length, 1)));

      for (const c of posCharges) {
        for (let i = 0; i < linesPerCharge; i++) {
          const angle = (2 * Math.PI * i) / linesPerCharge;
          const startR = 18;
          let x = c.x * W + startR * Math.cos(angle);
          let y = c.y * H + startR * Math.sin(angle);
          const pts: { x: number; y: number }[] = [{ x, y }];
          const maxSteps = 600;
          const stepSize = 4;

          for (let s = 0; s < maxSteps; s++) {
            const { Ex, Ey } = electricField(charges, x, y, W, H);
            const mag = Math.sqrt(Ex * Ex + Ey * Ey);
            if (mag < 1e-6) break;
            x += (Ex / mag) * stepSize;
            y += (Ey / mag) * stepSize;
            if (x < -20 || x > W + 20 || y < -20 || y > H + 20) break;
            pts.push({ x, y });
            // Check if hit negative charge
            let hitNeg = false;
            for (const nc of charges.filter((cc) => cc.q < 0)) {
              const dx = x - nc.x * W, dy = y - nc.y * H;
              if (Math.sqrt(dx * dx + dy * dy) < 15) { hitNeg = true; break; }
            }
            if (hitNeg) break;
          }
          fieldLines.push(pts);
        }
      }

      // Draw field lines
      for (let li = 0; li < fieldLines.length; li++) {
        const pts = fieldLines[li];
        if (pts.length < 2) continue;
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (const p of pts.slice(1)) ctx.lineTo(p.x, p.y);
        ctx.strokeStyle = "rgba(100,200,255,0.45)";
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Arrowheads along lines
        const arrowPositions = [0.3, 0.6, 0.85];
        for (const frac of arrowPositions) {
          const idx = Math.floor(frac * (pts.length - 1));
          if (idx + 1 >= pts.length) continue;
          const p1 = pts[idx], p2 = pts[idx + 1];
          const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
          const mx = (p1.x + p2.x) / 2, my = (p1.y + p2.y) / 2;
          ctx.beginPath();
          ctx.moveTo(mx + 5 * Math.cos(angle), my + 5 * Math.sin(angle));
          ctx.lineTo(mx - 4 * Math.cos(angle - 0.4), my - 4 * Math.sin(angle - 0.4));
          ctx.lineTo(mx - 4 * Math.cos(angle + 0.4), my - 4 * Math.sin(angle + 0.4));
          ctx.closePath();
          ctx.fillStyle = "rgba(100,220,255,0.7)";
          ctx.fill();
        }

        // Animated glowing particle on line
        const particleFrac = ((t * 0.15 + li * 0.13) % 1);
        const pidx = Math.floor(particleFrac * (pts.length - 1));
        if (pidx < pts.length) {
          const pp = pts[pidx];
          const grd = ctx.createRadialGradient(pp.x, pp.y, 0, pp.x, pp.y, 5);
          grd.addColorStop(0, "rgba(255,255,255,0.9)");
          grd.addColorStop(1, "rgba(100,200,255,0)");
          ctx.fillStyle = grd;
          ctx.beginPath();
          ctx.arc(pp.x, pp.y, 5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // ── Vector arrows on grid ─────────────────────────────────────────────
    if (showVectors && !showLines) {
      const gStep = 55;
      for (let px = gStep / 2; px < W; px += gStep) {
        for (let py = gStep / 2; py < H; py += gStep) {
          const { Ex, Ey } = electricField(charges, px, py, W, H);
          const mag = Math.sqrt(Ex * Ex + Ey * Ey);
          if (mag < 1e-6) continue;
          const len = Math.min(20, 12 * Math.log10(1 + mag * 0.1));
          const ux = Ex / mag, uy = Ey / mag;
          const hue = Math.max(0, 240 - 240 * Math.min(1, mag * 0.5));
          drawArrow(ctx, px, py, px + ux * len, py + uy * len, `hsla(${hue},100%,65%,0.7)`, 1.5);
        }
      }
    }

    // ── Neutral point marker ───────────────────────────────────────────────
    if (showNeutralPoint && mode === "two-same-positive") {
      const nx = W * 0.5, ny = H * 0.5;
      ctx.beginPath();
      ctx.arc(nx, ny, 8, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,100,0.3)";
      ctx.fill();
      ctx.strokeStyle = "#ffff00";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "#ffff00";
      ctx.font = "bold 11px sans-serif";
      ctx.fillText("Neutral Point", nx + 10, ny - 6);
      ctx.fillStyle = "rgba(255,255,100,0.15)";
      ctx.beginPath();
      ctx.arc(nx, ny, 12 + 4 * Math.sin(t * 3), 0, Math.PI * 2);
      ctx.fill();
    }

    // ── Charges ───────────────────────────────────────────────────────────
    for (const c of charges) {
      const cx = c.x * W, cy = c.y * H;
      const isPos = c.q >= 0;
      const color1 = isPos ? "#ff4444" : "#4488ff";
      const color2 = isPos ? "#ff0000" : "#0044ff";
      const pulse = 1 + 0.08 * Math.sin(t * 2 + (isPos ? 0 : Math.PI));

      // Outer glow
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 24 * pulse);
      glow.addColorStop(0, isPos ? "rgba(255,80,80,0.35)" : "rgba(80,130,255,0.35)");
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, 24 * pulse, 0, Math.PI * 2);
      ctx.fill();

      // Main sphere
      const grad = ctx.createRadialGradient(cx - 4, cy - 4, 2, cx, cy, 14);
      grad.addColorStop(0, "#ffffff");
      grad.addColorStop(0.3, color1);
      grad.addColorStop(1, color2);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, 14, 0, Math.PI * 2);
      ctx.fill();

      // + or - symbol
      ctx.fillStyle = "#fff";
      ctx.font = "bold 16px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(isPos ? "+" : "−", cx, cy);

      // Label
      if (c.label) {
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.font = "bold 11px sans-serif";
        ctx.fillText(c.label, cx, cy + 24);
      }
    }

    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
  }, [charges, mode, showLines, showVectors, showHeatmap, showNeutralPoint, showNetForce]);

  useEffect(() => {
    let running = true;
    const loop = () => {
      if (!running) return;
      drawScene();
      animRef.current = requestAnimationFrame(loop);
    };
    loop();
    return () => { running = false; cancelAnimationFrame(animRef.current); };
  }, [drawScene]);

  useEffect(() => {
    const q = charges.map(c => `${c.q > 0 ? '+' : ''}${c.q}q at (${(c.x * 100).toFixed(0)}%, ${(c.y * 100).toFixed(0)}%)`).join(', ');
    onContextChange?.(`Electric Field Explorer — Mode: ${mode}. Charges: ${q}. Field lines show direction of force on a positive test charge.`);
  }, [charges, mode]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!interactive) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (W / rect.width);
    const my = (e.clientY - rect.top) * (H / rect.height);
    for (let i = 0; i < charges.length; i++) {
      const dx = mx - charges[i].x * W, dy = my - charges[i].y * H;
      if (Math.sqrt(dx * dx + dy * dy) < 20) { setDragging(i); return; }
    }
  }, [charges, interactive]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (dragging === null) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const mx = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const my = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    setCharges((prev) => prev.map((c, i) => i === dragging ? { ...c, x: mx, y: my } : c));
  }, [dragging]);

  const handleMouseUp = useCallback(() => setDragging(null), []);

  const handleReset = () => setCharges(getChargesForMode(mode, charge));

  const posCount = charges.filter(c => c.q > 0).length;
  const negCount = charges.filter(c => c.q < 0).length;

  return (
    <div className="space-y-3">
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="w-full rounded-2xl"
        style={{ cursor: interactive ? (dragging !== null ? "grabbing" : "grab") : "default" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />

      {/* Info strip */}
      <div className="flex flex-wrap gap-2 items-center justify-between px-1">
        <div className="flex gap-3 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500 inline-block shadow-[0_0_6px_#ff4444]" />
            <span className="text-gray-300">{posCount} Positive charge{posCount !== 1 ? "s" : ""}</span>
          </span>
          {negCount > 0 && (
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-blue-500 inline-block shadow-[0_0_6px_#4488ff]" />
              <span className="text-gray-300">{negCount} Negative charge{negCount !== 1 ? "s" : ""}</span>
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <span className="w-6 h-0.5 bg-cyan-400 inline-block" />
            <span className="text-gray-300">Field lines</span>
          </span>
        </div>
        <div className="flex gap-2">
          {interactive && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-1.5 rounded-lg transition-colors">
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          )}
        </div>
      </div>

      {/* Physics info box */}
      <div className="bg-gray-800/60 border border-gray-700 rounded-xl px-4 py-3">
        <p className="text-xs text-gray-300 leading-relaxed">
          <span className="text-cyan-400 font-bold">Physics: </span>
          {mode === "single" && "Electric field lines radiate outward from positive charges (+) and inward for negative charges (-). Field strength E = kq/r² decreases with distance."}
          {mode === "two-same-positive" && "Like charges repel. A neutral point exists between them where field contributions cancel. This is why field lines push away from each other."}
          {mode === "dipole" && "A dipole has field lines from + to -. The field pattern is characteristic and appears in molecules, antennas, and many physical systems."}
          {mode === "triangle" && "Superposition principle: Net E at any point = vector sum of fields from all three charges. Each charge contributes independently."}
          {mode === "square" && "Four charges at square corners. Alternate +/- arrangement creates a strong multipole field pattern with complex symmetry."}
          {mode === "custom-5" && "Complex multi-charge system. Field can be calculated at any point by vector superposition. Regions of high density = strong field."}
          {!["single","two-same-positive","dipole","triangle","square","custom-5"].includes(mode) && "Electric field E = F/q is the force per unit positive test charge. Field lines show direction a positive charge would move."}
        </p>
      </div>
    </div>
  );
}
