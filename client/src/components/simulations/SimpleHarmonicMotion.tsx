import { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";

interface Props {
  onContextChange?: (ctx: string) => void;
}

const W = 720, H = 380;

export default function SimpleHarmonicMotion({ onContextChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const tRef = useRef(0);
  const lastRef = useRef<number | null>(null);
  const paramsRef = useRef({ mode: "pendulum" as "pendulum" | "spring", amplitude: 60, period: 2 });

  const [mode, setMode] = useState<"pendulum" | "spring">("pendulum");
  const [amplitude, setAmplitude] = useState(60);
  const [period, setPeriod] = useState(2);
  const [running, setRunning] = useState(false);

  paramsRef.current = { mode, amplitude, period };

  const graphPoints = useRef<number[]>([]);

  function drawFrame(t: number) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const { mode, amplitude, period } = paramsRef.current;
    const omega = (2 * Math.PI) / period;
    const pos = amplitude * Math.cos(omega * t); // in pixels / degrees

    ctx.clearRect(0, 0, W, H);

    // Background
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#f8fafc");
    bg.addColorStop(1, "#f0fdf4");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Divider
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke();

    const simW = W / 2;

    if (mode === "pendulum") {
      drawPendulum(ctx, simW, pos, amplitude);
    } else {
      drawSpring(ctx, simW, pos, amplitude);
    }

    // Time-displacement graph (right half)
    drawGraph(ctx, t, pos, amplitude);
  }

  function drawPendulum(ctx: CanvasRenderingContext2D, simW: number, angleDeg: number, maxAngle: number) {
    const pivotX = simW / 2, pivotY = 40;
    const L = 180; // pendulum length px
    const rad = (angleDeg * Math.PI) / 180;
    const bobX = pivotX + L * Math.sin(rad);
    const bobY = pivotY + L * Math.cos(rad);

    // Ceiling mount
    ctx.fillStyle = "#94a3b8";
    ctx.fillRect(pivotX - 25, 25, 50, 15);

    // Angle arc
    ctx.strokeStyle = "rgba(99,102,241,0.3)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(pivotX, pivotY); ctx.lineTo(pivotX, pivotY + L); ctx.stroke();
    ctx.setLineDash([]);

    // String
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pivotX, pivotY);
    ctx.lineTo(bobX, bobY);
    ctx.stroke();

    // Pivot
    ctx.fillStyle = "#475569";
    ctx.beginPath(); ctx.arc(pivotX, pivotY, 5, 0, Math.PI * 2); ctx.fill();

    // Bob
    const bobGrad = ctx.createRadialGradient(bobX - 5, bobY - 5, 2, bobX, bobY, 18);
    bobGrad.addColorStop(0, "#fbbf24");
    bobGrad.addColorStop(1, "#d97706");
    ctx.fillStyle = bobGrad;
    ctx.beginPath(); ctx.arc(bobX, bobY, 18, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#92400e"; ctx.lineWidth = 1.5; ctx.stroke();

    // Angle label
    ctx.fillStyle = "#6366f1";
    ctx.font = "bold 12px sans-serif";
    ctx.fillText(`θ = ${angleDeg.toFixed(1)}°`, pivotX + 10, pivotY + 30);

    // Equilibrium marker
    ctx.strokeStyle = "rgba(22,163,74,0.4)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(pivotX - maxAngle * 3.5, pivotY + L);
    ctx.lineTo(pivotX + maxAngle * 3.5, pivotY + L);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function drawSpring(ctx: CanvasRenderingContext2D, simW: number, displacement: number, maxDisp: number) {
    const cx = simW / 2;
    const ceilY = 30;
    const restLength = 130;
    const massH = 50, massW = 60;
    const massY = ceilY + restLength + displacement;

    // Ceiling
    ctx.fillStyle = "#94a3b8";
    ctx.fillRect(cx - 30, ceilY, 60, 12);

    // Spring (zigzag)
    const springTop = ceilY + 12;
    const springBot = massY;
    const numCoils = 10;
    const coilW = 20;
    ctx.strokeStyle = "#6366f1";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cx, springTop);
    for (let i = 0; i <= numCoils * 2; i++) {
      const frac = i / (numCoils * 2);
      const y = springTop + frac * (springBot - springTop);
      const x = cx + (i % 2 === 0 ? -coilW : coilW);
      ctx.lineTo(x, y);
    }
    ctx.lineTo(cx, springBot);
    ctx.stroke();

    // Mass (block)
    const gradient = ctx.createLinearGradient(cx - massW / 2, massY, cx + massW / 2, massY + massH);
    gradient.addColorStop(0, "#3b82f6");
    gradient.addColorStop(1, "#1d4ed8");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(cx - massW / 2, massY, massW, massH, 6);
    ctx.fill();
    ctx.strokeStyle = "#1e40af"; ctx.lineWidth = 1.5; ctx.stroke();

    // m label
    ctx.fillStyle = "white";
    ctx.font = "bold 14px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("m", cx, massY + massH / 2 + 5);
    ctx.textAlign = "left";

    // Displacement arrow
    const equilY = ceilY + restLength + massH / 2;
    if (Math.abs(displacement) > 3) {
      ctx.strokeStyle = "#dc2626";
      ctx.lineWidth = 2;
      const arrY1 = equilY, arrY2 = massY + massH / 2;
      ctx.beginPath(); ctx.moveTo(cx + 45, arrY1); ctx.lineTo(cx + 45, arrY2); ctx.stroke();
      const dir = displacement > 0 ? 1 : -1;
      ctx.beginPath();
      ctx.moveTo(cx + 45, arrY2);
      ctx.lineTo(cx + 40, arrY2 - dir * 8);
      ctx.lineTo(cx + 50, arrY2 - dir * 8);
      ctx.closePath();
      ctx.fillStyle = "#dc2626"; ctx.fill();
      ctx.fillStyle = "#dc2626";
      ctx.font = "bold 11px sans-serif";
      ctx.fillText(`x=${displacement.toFixed(1)}px`, cx + 52, (arrY1 + arrY2) / 2);
    }
  }

  function drawGraph(ctx: CanvasRenderingContext2D, t: number, pos: number, amp: number) {
    const gx = W / 2 + 20, gy = H / 2, gw = W / 2 - 40, gh = H / 2 - 40;

    // Graph background
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.fillRect(gx, gy - gh / 2, gw, gh);

    // Axes
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(gx, gy); ctx.lineTo(gx + gw, gy);
    ctx.moveTo(gx, gy - gh / 2); ctx.lineTo(gx, gy + gh / 2);
    ctx.stroke();

    ctx.fillStyle = "#94a3b8";
    ctx.font = "10px sans-serif";
    ctx.fillText("Time →", gx + gw - 40, gy + 15);
    ctx.fillText("x", gx - 14, gy - gh / 2 + 5);

    // Track last 200 points
    graphPoints.current.push(pos);
    if (graphPoints.current.length > 200) graphPoints.current.shift();

    // Draw wave
    ctx.strokeStyle = "#16a34a";
    ctx.lineWidth = 2;
    ctx.beginPath();
    graphPoints.current.forEach((p, i) => {
      const px = gx + (i / 200) * gw;
      const py = gy - (p / (amp * 1.2)) * (gh / 2);
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    });
    ctx.stroke();

    // Current dot
    const dotX = gx + gw;
    const dotY = gy - (pos / (amp * 1.2)) * (gh / 2);
    ctx.fillStyle = "#dc2626";
    ctx.beginPath(); ctx.arc(dotX - 4, dotY, 5, 0, Math.PI * 2); ctx.fill();

    // Labels
    ctx.fillStyle = "#475569";
    ctx.font = "bold 11px sans-serif";
    ctx.fillText("x(t) = A·cos(ωt)", gx + 5, gy - gh / 2 + 14);
  }

  useEffect(() => {
    if (!running) {
      drawFrame(tRef.current);
      return;
    }
    const loop = (ts: number) => {
      if (!lastRef.current) lastRef.current = ts;
      const dt = Math.min((ts - lastRef.current) / 1000, 0.05);
      lastRef.current = ts;
      tRef.current += dt;
      drawFrame(tRef.current);
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(animRef.current); lastRef.current = null; };
  }, [running, mode, amplitude, period]);

  useEffect(() => {
    drawFrame(tRef.current);
    onContextChange?.(`${mode === "pendulum" ? "Pendulum" : "Spring-Mass"} SHM: amplitude=${amplitude}${mode === "pendulum" ? "°" : "px"}, period=${period}s, ω=${((2 * Math.PI) / period).toFixed(2)} rad/s. x(t) = A·cos(ωt)`);
  }, [mode, amplitude, period]);

  const handleReset = () => {
    setRunning(false);
    cancelAnimationFrame(animRef.current);
    tRef.current = 0;
    lastRef.current = null;
    graphPoints.current = [];
    drawFrame(0);
  };

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="flex gap-2 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 w-fit">
        {(["pendulum", "spring"] as const).map(m => (
          <button key={m} onClick={() => { handleReset(); setMode(m); }}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${mode === m ? "bg-white dark:bg-gray-700 shadow text-green-600" : "text-gray-500 dark:text-gray-400"}`}>
            {m === "pendulum" ? "🔵 Pendulum" : "🟣 Spring-Mass"}
          </button>
        ))}
      </div>

      <canvas ref={canvasRef} width={W} height={H}
        className="w-full rounded-2xl border border-gray-100 dark:border-gray-800" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <div className="flex justify-between text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            <span>Amplitude</span>
            <span className="text-green-600 font-bold">{amplitude}{mode === "pendulum" ? "°" : "px"}</span>
          </div>
          <input type="range" min={10} max={mode === "pendulum" ? 80 : 100} value={amplitude}
            onChange={e => { handleReset(); setAmplitude(Number(e.target.value)); }}
            className="w-full accent-green-600" />
        </div>
        <div>
          <div className="flex justify-between text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            <span>Period (T)</span>
            <span className="text-green-600 font-bold">{period}s</span>
          </div>
          <input type="range" min={0.5} max={5} step={0.1} value={period}
            onChange={e => { handleReset(); setPeriod(Number(e.target.value)); }}
            className="w-full accent-green-600" />
          <div className="flex justify-between text-xs text-gray-400 mt-0.5"><span>0.5s</span><span>5s</span></div>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={() => setRunning(r => !r)}
          className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-xl transition-colors">
          {running ? <><Pause className="w-4 h-4" />Pause</> : <><Play className="w-4 h-4" />Start</>}
        </button>
        <button onClick={handleReset}
          className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold px-5 py-2.5 rounded-xl transition-colors">
          <RotateCcw className="w-4 h-4" />Reset
        </button>
      </div>

      <div className="text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-xl px-4 py-2">
        <span className="font-mono">x(t) = A·cos(ωt)</span>&nbsp;|&nbsp;
        <span className="font-mono">ω = 2π/T = {((2 * Math.PI) / period).toFixed(2)} rad/s</span>
        {mode === "pendulum" && <>&nbsp;|&nbsp;<span className="font-mono">T = 2π√(L/g)</span></>}
        {mode === "spring" && <>&nbsp;|&nbsp;<span className="font-mono">T = 2π√(m/k)</span></>}
      </div>
    </div>
  );
}
