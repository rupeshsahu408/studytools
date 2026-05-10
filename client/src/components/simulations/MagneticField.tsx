import { useEffect, useRef, useState } from "react";

interface Props {
  onContextChange?: (ctx: string) => void;
}

const W = 720, H = 380;
const CX = W / 2, CY = H / 2;

export default function MagneticField({ onContextChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const tRef = useRef(0);
  const lastRef = useRef<number | null>(null);
  const paramsRef = useRef({ current: 5, direction: "out" as "out" | "in", wireType: "straight" as "straight" | "solenoid" });

  const [current, setCurrent] = useState(5);
  const [direction, setDirection] = useState<"out" | "in">("out");
  const [wireType, setWireType] = useState<"straight" | "solenoid">("straight");

  paramsRef.current = { current, direction, wireType };

  const MU0 = 4 * Math.PI * 1e-7;
  const SCALE = 60; // pixels per meter

  function draw(t: number) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const { current: I, direction: dir, wireType } = paramsRef.current;

    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, W, H);

    if (wireType === "straight") {
      drawStraightWire(ctx, I, dir, t);
    } else {
      drawSolenoid(ctx, I, dir, t);
    }
  }

  function drawStraightWire(ctx: CanvasRenderingContext2D, I: number, dir: "out" | "in", t: number) {
    const MU0_OVER_2PI = MU0 / (2 * Math.PI);
    const maxR = Math.min(CX, CY) - 20;

    // Draw field circles
    const numCircles = 8;
    for (let n = 1; n <= numCircles; n++) {
      const r = (n / numCircles) * maxR;
      const B = MU0_OVER_2PI * I / (r / SCALE); // Tesla
      const alpha = Math.min(0.9, 0.15 + 0.75 * (numCircles - n + 1) / numCircles);

      // Color: strong = bright blue/red
      const hue = dir === "out" ? 200 : 0;
      ctx.strokeStyle = `hsla(${hue},90%,65%,${alpha})`;
      ctx.lineWidth = Math.max(1, 3 * (numCircles - n + 1) / numCircles);
      ctx.beginPath();
      ctx.arc(CX, CY, r, 0, Math.PI * 2);
      ctx.stroke();

      // Animated direction arrows on each circle
      const numArrows = Math.max(3, n * 2);
      for (let a = 0; a < numArrows; a++) {
        const phase = (2 * Math.PI * a) / numArrows + (dir === "out" ? 1 : -1) * t * 1.5;
        const ax = CX + r * Math.cos(phase);
        const ay = CY + r * Math.sin(phase);
        // Arrow tangent direction
        const tangentDir = dir === "out" ? 1 : -1;
        const dx = -Math.sin(phase) * tangentDir;
        const dy = Math.cos(phase) * tangentDir;
        const arrLen = 8;
        ctx.fillStyle = `hsla(${hue},90%,65%,${alpha})`;
        ctx.beginPath();
        ctx.moveTo(ax + dx * arrLen, ay + dy * arrLen);
        ctx.lineTo(ax - dx * 4 - dy * 4, ay - dy * 4 + dx * 4);
        ctx.lineTo(ax - dx * 4 + dy * 4, ay - dy * 4 - dx * 4);
        ctx.closePath();
        ctx.fill();
      }

      // B field label on outermost circle
      if (n === 1) {
        ctx.fillStyle = "rgba(148,163,184,0.8)";
        ctx.font = "10px monospace";
        ctx.fillText(`B = ${(B * 1e6).toFixed(1)} μT`, CX + r + 5, CY);
      }
    }

    // Wire cross-section
    const wireR = 16;
    const wireGrad = ctx.createRadialGradient(CX - 4, CY - 4, 2, CX, CY, wireR);
    wireGrad.addColorStop(0, "#fef9c3");
    wireGrad.addColorStop(0.4, "#fbbf24");
    wireGrad.addColorStop(1, "#d97706");
    ctx.fillStyle = wireGrad;
    ctx.beginPath(); ctx.arc(CX, CY, wireR, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#92400e"; ctx.lineWidth = 2; ctx.stroke();

    // Current direction symbol
    ctx.fillStyle = "#1e293b";
    ctx.font = "bold 18px sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(dir === "out" ? "⊙" : "⊗", CX, CY + 1);
    ctx.textBaseline = "alphabetic";

    // Labels
    ctx.fillStyle = "#94a3b8";
    ctx.font = "bold 13px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`Current ${dir === "out" ? "coming OUT of page" : "going INTO page"}`, CX, H - 15);
    ctx.fillText(`I = ${I} A`, CX, 20);
    ctx.textAlign = "left";

    // B formula
    ctx.fillStyle = "#64748b";
    ctx.font = "12px monospace";
    ctx.fillText(`B = μ₀I/(2πr)`, 10, H - 15);
  }

  function drawSolenoid(ctx: CanvasRenderingContext2D, I: number, dir: "out" | "in", t: number) {
    const solLeft = 80, solRight = W - 80;
    const solTop = CY - 60, solBot = CY + 60;
    const numLoops = 14;
    const loopW = (solRight - solLeft) / numLoops;

    // ── Internal field (uniform, horizontal) ──
    const fieldDir = dir === "out" ? 1 : -1; // right = out, left = in
    const numFieldLines = 5;
    for (let i = 0; i < numFieldLines; i++) {
      const fy = solTop + 15 + ((solBot - solTop - 30) * i) / (numFieldLines - 1);
      const strength = Math.min(0.9, 0.3 + I * 0.07);
      ctx.strokeStyle = `rgba(59,130,246,${strength})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(solLeft + 10, fy);
      ctx.lineTo(solRight - 10, fy);
      ctx.stroke();
      // Arrow
      const arrowX = solLeft + 10 + ((t * 40 * fieldDir + 200) % (solRight - solLeft - 20));
      ctx.fillStyle = `rgba(59,130,246,${strength})`;
      const ad = fieldDir;
      ctx.beginPath();
      ctx.moveTo(arrowX + ad * 10, fy);
      ctx.lineTo(arrowX - ad * 5, fy - 6);
      ctx.lineTo(arrowX - ad * 5, fy + 6);
      ctx.closePath(); ctx.fill();
    }

    // ── Solenoid loops (front view) ──
    for (let i = 0; i < numLoops; i++) {
      const lx = solLeft + i * loopW + loopW / 2;
      const isBack = i % 2 === 0;

      // Back part (dashed)
      ctx.strokeStyle = isBack ? "rgba(100,116,139,0.4)" : "#94a3b8";
      ctx.lineWidth = isBack ? 1 : 2;
      if (isBack) ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.ellipse(lx, CY, loopW * 0.5, 60, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Current direction arrows on front
      if (!isBack) {
        const topDir = dir === "out" ? -1 : 1; // top current direction
        ctx.fillStyle = "#fbbf24";
        // Top arrow
        ctx.beginPath();
        const ty = solTop + 2;
        ctx.moveTo(lx + topDir * 8, ty);
        ctx.lineTo(lx - topDir * 4, ty - 6);
        ctx.lineTo(lx - topDir * 4, ty + 6);
        ctx.closePath(); ctx.fill();
      }
    }

    // ── End caps ──
    ctx.strokeStyle = "#475569"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(solLeft, solTop); ctx.lineTo(solLeft, solBot); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(solRight, solTop); ctx.lineTo(solRight, solBot); ctx.stroke();

    // ── External field ──
    const extPaths = [
      { y: solTop - 20, dir: -fieldDir, len: solRight - solLeft - 30 },
      { y: solBot + 20, dir: fieldDir, len: solRight - solLeft - 30 },
    ];
    for (const ep of extPaths) {
      ctx.strokeStyle = "rgba(59,130,246,0.2)";
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(solLeft + 15, ep.y);
      ctx.lineTo(solRight - 15, ep.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Labels
    ctx.fillStyle = "#94a3b8"; ctx.font = "bold 12px sans-serif"; ctx.textAlign = "center";
    ctx.fillText(`B = μ₀nI  |  n = ${numLoops} turns  |  I = ${I} A`, CX, H - 12);
    const B_inside = MU0 * I * numLoops / ((solRight - solLeft) / SCALE);
    ctx.fillStyle = "#3b82f6"; ctx.font = "bold 13px sans-serif";
    ctx.fillText(`B = ${(B_inside * 1000).toFixed(2)} mT (inside)`, CX, 22);
    ctx.textAlign = "left";

    // Field direction label
    ctx.fillStyle = "#3b82f6"; ctx.font = "12px sans-serif";
    const fLabel = dir === "out" ? "→ Field points RIGHT →" : "← Field points LEFT ←";
    ctx.textAlign = "center";
    ctx.fillText(fLabel, CX, CY);
    ctx.textAlign = "left";
  }

  useEffect(() => {
    if (true) {
      const loop = (ts: number) => {
        if (!lastRef.current) lastRef.current = ts;
        const dt = Math.min((ts - lastRef.current) / 1000, 0.05);
        lastRef.current = ts;
        tRef.current += dt;
        draw(tRef.current);
        animRef.current = requestAnimationFrame(loop);
      };
      animRef.current = requestAnimationFrame(loop);
    }
    return () => { cancelAnimationFrame(animRef.current); lastRef.current = null; };
  }, [current, direction, wireType]);

  useEffect(() => {
    const B = wireType === "straight"
      ? `B = μ₀I/(2πr) — field strength decreases with distance`
      : `B = μ₀nI inside solenoid (uniform field)`;
    onContextChange?.(`Magnetic Field — ${wireType === "straight" ? "Straight Wire" : "Solenoid"}: I=${current}A, direction=${direction}. ${B}. Field circles rotate ${direction === "out" ? "anticlockwise" : "clockwise"} (right-hand rule).`);
  }, [current, direction, wireType]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {(["straight", "solenoid"] as const).map(t => (
          <button key={t} onClick={() => setWireType(t)}
            className={`px-4 py-1.5 rounded-xl text-sm font-medium border transition-all ${wireType === t ? "bg-green-600 text-white border-green-600" : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"}`}>
            {t === "straight" ? "⚡ Straight Wire" : "🌀 Solenoid"}
          </button>
        ))}
      </div>

      <canvas ref={canvasRef} width={W} height={H}
        className="w-full rounded-2xl border border-gray-700" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <div className="flex justify-between text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            <span>Current (I)</span><span className="text-green-600 font-bold">{current} A</span>
          </div>
          <input type="range" min={1} max={20} value={current} onChange={e => setCurrent(Number(e.target.value))}
            className="w-full accent-green-600" />
          <div className="flex justify-between text-xs text-gray-400 mt-0.5"><span>1A</span><span>20A</span></div>
        </div>
        <div>
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Direction</div>
          <div className="flex gap-2">
            {(["out", "in"] as const).map(d => (
              <button key={d} onClick={() => setDirection(d)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${direction === d ? "bg-blue-600 text-white border-blue-600" : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"}`}>
                {d === "out" ? "⊙ Out of Page" : "⊗ Into Page"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-xl px-4 py-2">
        <span className="font-mono">B = μ₀I/(2πr)</span>&nbsp;|&nbsp;
        Right-hand rule: thumb = current direction, fingers curl = B field direction
      </div>
    </div>
  );
}
