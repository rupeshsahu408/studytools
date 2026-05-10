import { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";

interface Props {
  onContextChange?: (ctx: string) => void;
}

const W = 720, H = 380;
const GROUND_Y = H - 50;
const ORIGIN_X = 60;
const ORIGIN_Y = GROUND_Y;
const G = 9.8;

function degToRad(d: number) { return d * Math.PI / 180; }

export default function ProjectileMotion({ onContextChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const stateRef = useRef({ t: 0, running: false, landed: false, trailPoints: [] as {x: number, y: number}[] });
  const paramsRef = useRef({ angle: 45, velocity: 30 });

  const [angle, setAngle] = useState(45);
  const [velocity, setVelocity] = useState(30);
  const [isRunning, setIsRunning] = useState(false);
  const [stats, setStats] = useState<{range: number, maxH: number, time: number} | null>(null);

  // Keep paramsRef in sync
  paramsRef.current = { angle, velocity };

  // Compute scale so max range fits in canvas
  function getScale(v: number, ang: number) {
    const maxRange = (v * v * Math.sin(2 * degToRad(ang))) / G;
    const effectiveRange = Math.max(maxRange, 1);
    return Math.min((W - ORIGIN_X - 60) / effectiveRange, 80);
  }

  function drawFrame() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const { angle, velocity } = paramsRef.current;
    const s = stateRef.current;
    const scale = getScale(velocity, angle);
    const rad = degToRad(angle);
    const vx = velocity * Math.cos(rad);
    const vy = velocity * Math.sin(rad);

    ctx.clearRect(0, 0, W, H);

    // Sky gradient
    const sky = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    sky.addColorStop(0, "#e0f2fe");
    sky.addColorStop(1, "#f0fdf4");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, GROUND_Y);

    // Grid
    ctx.strokeStyle = "rgba(0,0,0,0.06)";
    ctx.lineWidth = 1;
    for (let x = ORIGIN_X; x < W; x += 60) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, GROUND_Y); ctx.stroke();
    }
    for (let y = 0; y < GROUND_Y; y += 50) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // Ground
    ctx.fillStyle = "#86efac";
    ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);
    ctx.strokeStyle = "#16a34a";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, GROUND_Y); ctx.lineTo(W, GROUND_Y); ctx.stroke();

    // Predicted trajectory (dashed)
    const totalTime = (2 * vy) / G;
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = "rgba(22,163,74,0.25)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i <= 100; i++) {
      const t = (totalTime * i) / 100;
      const px = ORIGIN_X + vx * t * scale;
      const py = ORIGIN_Y - (vy * t - 0.5 * G * t * t) * scale;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Trail
    if (s.trailPoints.length > 1) {
      ctx.strokeStyle = "#16a34a";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      s.trailPoints.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
      ctx.stroke();
    }

    // Projectile ball
    const t = s.t;
    const bx = ORIGIN_X + vx * t * scale;
    const by = ORIGIN_Y - (vy * t - 0.5 * G * t * t) * scale;

    if (!s.landed) {
      const grad = ctx.createRadialGradient(bx - 3, by - 3, 1, bx, by, 10);
      grad.addColorStop(0, "#fbbf24");
      grad.addColorStop(1, "#d97706");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(bx, by, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#92400e";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Launch point
    ctx.fillStyle = "#dc2626";
    ctx.beginPath();
    ctx.arc(ORIGIN_X, ORIGIN_Y, 6, 0, Math.PI * 2);
    ctx.fill();

    // Angle indicator (arc)
    ctx.strokeStyle = "#2563eb";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.arc(ORIGIN_X, ORIGIN_Y, 35, -Math.PI / 2, -rad, true);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#2563eb";
    ctx.font = "bold 11px sans-serif";
    ctx.fillText(`${angle}°`, ORIGIN_X + 40, ORIGIN_Y - 10);

    // Stats (max height marker)
    if (s.landed && stats) {
      const maxT = vy / G;
      const peakX = ORIGIN_X + vx * maxT * scale;
      const peakY = ORIGIN_Y - (vy * maxT - 0.5 * G * maxT * maxT) * scale;
      ctx.strokeStyle = "rgba(239,68,68,0.5)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(peakX, peakY);
      ctx.lineTo(peakX, ORIGIN_Y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#dc2626";
      ctx.font = "bold 11px sans-serif";
      ctx.fillText(`H = ${stats.maxH.toFixed(1)}m`, peakX + 4, (peakY + ORIGIN_Y) / 2);
    }
  }

  useEffect(() => {
    drawFrame();
  }, [angle, velocity]);

  useEffect(() => {
    if (!isRunning) {
      cancelAnimationFrame(animRef.current);
      return;
    }

    const { angle, velocity } = paramsRef.current;
    const rad = degToRad(angle);
    const vx = velocity * Math.cos(rad);
    const vy = velocity * Math.sin(rad);
    const scale = getScale(velocity, angle);
    let last: number | null = null;

    const loop = (ts: number) => {
      if (!last) last = ts;
      const dt = Math.min((ts - last) / 1000, 0.05);
      last = ts;

      const s = stateRef.current;
      if (!s.landed) {
        s.t += dt;
        const bx = ORIGIN_X + vx * s.t * scale;
        const by = ORIGIN_Y - (vy * s.t - 0.5 * G * s.t * s.t) * scale;
        s.trailPoints.push({ x: bx, y: by });

        if (by >= ORIGIN_Y) {
          s.landed = true;
          s.t = (2 * vy) / G;
          const range = vx * s.t;
          const maxH = (vy * vy) / (2 * G);
          setStats({ range: parseFloat(range.toFixed(1)), maxH: parseFloat(maxH.toFixed(1)), time: parseFloat(s.t.toFixed(2)) });
          setIsRunning(false);
          onContextChange?.(`Projectile launched at ${angle}° with velocity ${velocity} m/s. Range=${range.toFixed(1)}m, Max Height=${maxH.toFixed(1)}m, Time of flight=${s.t.toFixed(2)}s`);
          drawFrame();
          return;
        }
      }
      drawFrame();
      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [isRunning]);

  useEffect(() => {
    onContextChange?.(`Projectile Motion: angle=${angle}°, initial velocity=${velocity} m/s, g=9.8 m/s². The yellow ball follows a parabolic path.`);
  }, [angle, velocity]);

  const handlePlay = () => {
    if (stateRef.current.landed) handleReset();
    setIsRunning(true);
    stateRef.current.running = true;
  };

  const handleReset = () => {
    cancelAnimationFrame(animRef.current);
    stateRef.current = { t: 0, running: false, landed: false, trailPoints: [] };
    setIsRunning(false);
    setStats(null);
    drawFrame();
  };

  const handleAngle = (v: number) => { handleReset(); setAngle(v); };
  const handleVelocity = (v: number) => { handleReset(); setVelocity(v); };

  return (
    <div className="space-y-4">
      <canvas
        ref={canvasRef} width={W} height={H}
        className="w-full rounded-2xl border border-gray-100 dark:border-gray-800"
        style={{ background: "#f0fdf4" }}
      />

      {/* Stats bar */}
      {stats && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Range", value: `${stats.range} m` },
            { label: "Max Height", value: `${stats.maxH} m` },
            { label: "Time of Flight", value: `${stats.time} s` },
          ].map(s => (
            <div key={s.label} className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-xl p-3 text-center">
              <div className="text-lg font-bold text-green-700 dark:text-green-400">{s.value}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <div className="flex justify-between text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            <span>Launch Angle</span><span className="text-green-600 font-bold">{angle}°</span>
          </div>
          <input type="range" min={5} max={85} value={angle} onChange={e => handleAngle(Number(e.target.value))}
            className="w-full accent-green-600" />
          <div className="flex justify-between text-xs text-gray-400 mt-0.5"><span>5°</span><span>85°</span></div>
        </div>
        <div>
          <div className="flex justify-between text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            <span>Initial Velocity</span><span className="text-green-600 font-bold">{velocity} m/s</span>
          </div>
          <input type="range" min={10} max={60} value={velocity} onChange={e => handleVelocity(Number(e.target.value))}
            className="w-full accent-green-600" />
          <div className="flex justify-between text-xs text-gray-400 mt-0.5"><span>10 m/s</span><span>60 m/s</span></div>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={isRunning ? () => { setIsRunning(false); cancelAnimationFrame(animRef.current); } : handlePlay}
          className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-xl transition-colors">
          {isRunning ? <><Pause className="w-4 h-4" /> Pause</> : <><Play className="w-4 h-4" /> Launch</>}
        </button>
        <button onClick={handleReset}
          className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold px-5 py-2.5 rounded-xl transition-colors">
          <RotateCcw className="w-4 h-4" /> Reset
        </button>
      </div>

      <div className="text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-xl px-4 py-2">
        <span className="font-mono">x(t) = v₀cos(θ)·t</span> &nbsp;|&nbsp;
        <span className="font-mono">y(t) = v₀sin(θ)·t - ½gt²</span>
        &nbsp;|&nbsp; g = 9.8 m/s²
      </div>
    </div>
  );
}
