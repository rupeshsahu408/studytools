import { useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";

interface Props {
  onContextChange?: (ctx: string) => void;
}

const W = 720, H = 380;

interface Charge {
  x: number;
  y: number;
  q: number; // +1 or -1
}

const CONFIGS: Record<string, { label: string; charges: Charge[] }> = {
  dipole: {
    label: "Dipole (+q, −q)",
    charges: [
      { x: W / 3, y: H / 2, q: 1 },
      { x: (2 * W) / 3, y: H / 2, q: -1 },
    ],
  },
  like: {
    label: "Like Charges (+q, +q)",
    charges: [
      { x: W / 3, y: H / 2, q: 1 },
      { x: (2 * W) / 3, y: H / 2, q: 1 },
    ],
  },
  single: {
    label: "Single Charge (+q)",
    charges: [{ x: W / 2, y: H / 2, q: 1 }],
  },
  threeCharge: {
    label: "Three Charges",
    charges: [
      { x: W / 2, y: H / 4, q: 1 },
      { x: W / 3, y: (3 * H) / 4, q: -1 },
      { x: (2 * W) / 3, y: (3 * H) / 4, q: 1 },
    ],
  },
};

function electricField(charges: Charge[], px: number, py: number): { ex: number; ey: number } {
  let ex = 0, ey = 0;
  const k = 1e5;
  for (const c of charges) {
    const dx = px - c.x, dy = py - c.y;
    const r2 = dx * dx + dy * dy;
    if (r2 < 100) continue;
    const r = Math.sqrt(r2);
    const mag = k * c.q / r2;
    ex += mag * dx / r;
    ey += mag * dy / r;
  }
  return { ex, ey };
}

function drawFieldLines(ctx: CanvasRenderingContext2D, charges: Charge[]) {
  const numLines = 16;
  const dt = 1.5;
  const maxSteps = 1000;

  for (const source of charges) {
    if (source.q <= 0) continue;
    for (let i = 0; i < numLines; i++) {
      const angle = (2 * Math.PI * i) / numLines;
      let px = source.x + 18 * Math.cos(angle);
      let py = source.y + 18 * Math.sin(angle);

      ctx.beginPath();
      ctx.moveTo(px, py);

      for (let step = 0; step < maxSteps; step++) {
        const { ex, ey } = electricField(charges, px, py);
        const mag = Math.sqrt(ex * ex + ey * ey);
        if (mag < 1) break;
        const nx = ex / mag, ny = ey / mag;
        px += nx * dt;
        py += ny * dt;
        if (px < 0 || px > W || py < 0 || py > H) break;

        // Check if near a negative charge (sink)
        let nearSink = false;
        for (const c of charges) {
          if (c.q < 0) {
            const d = Math.sqrt((px - c.x) ** 2 + (py - c.y) ** 2);
            if (d < 16) { nearSink = true; break; }
          }
        }
        ctx.lineTo(px, py);
        if (nearSink) break;
      }
      ctx.stroke();
    }
  }
}

export default function ElectricField({ onContextChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [config, setConfig] = useState("dipole");

  function draw(cfg: string) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const charges = CONFIGS[cfg].charges;

    ctx.clearRect(0, 0, W, H);

    // Background with subtle grid
    ctx.fillStyle = "#fafeff";
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(0,0,0,0.04)";
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    // Draw vector field (arrows at grid points)
    const gridSpacing = 50;
    for (let gx = gridSpacing; gx < W; gx += gridSpacing) {
      for (let gy = gridSpacing; gy < H; gy += gridSpacing) {
        const { ex, ey } = electricField(charges, gx, gy);
        const mag = Math.sqrt(ex * ex + ey * ey);
        if (mag < 1) continue;
        const nx = ex / mag, ny = ey / mag;
        const len = Math.min(15, 15);
        const alpha = Math.min(0.15 + Math.log(mag + 1) * 0.015, 0.4);
        ctx.strokeStyle = `rgba(22,163,74,${alpha})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(gx - nx * len / 2, gy - ny * len / 2);
        ctx.lineTo(gx + nx * len / 2, gy + ny * len / 2);
        ctx.stroke();
      }
    }

    // Field lines
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "rgba(22,163,74,0.7)";
    drawFieldLines(ctx, charges);

    // Charges
    for (const c of charges) {
      // Glow effect
      const glow = ctx.createRadialGradient(c.x, c.y, 5, c.x, c.y, 35);
      glow.addColorStop(0, c.q > 0 ? "rgba(239,68,68,0.3)" : "rgba(59,130,246,0.3)");
      glow.addColorStop(1, "transparent");
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(c.x, c.y, 35, 0, Math.PI * 2); ctx.fill();

      // Charge circle
      const grad = ctx.createRadialGradient(c.x - 5, c.y - 5, 2, c.x, c.y, 18);
      if (c.q > 0) { grad.addColorStop(0, "#fca5a5"); grad.addColorStop(1, "#dc2626"); }
      else { grad.addColorStop(0, "#93c5fd"); grad.addColorStop(1, "#2563eb"); }
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(c.x, c.y, 18, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = c.q > 0 ? "#991b1b" : "#1e40af";
      ctx.lineWidth = 2; ctx.stroke();

      // +/- symbol
      ctx.fillStyle = "white";
      ctx.font = "bold 22px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(c.q > 0 ? "+" : "−", c.x, c.y);
      ctx.textBaseline = "alphabetic";
    }
  }

  useEffect(() => {
    draw(config);
    const cfg = CONFIGS[config];
    const posCount = cfg.charges.filter(c => c.q > 0).length;
    const negCount = cfg.charges.filter(c => c.q < 0).length;
    onContextChange?.(`Electric Field: ${cfg.label} configuration. ${posCount} positive charge(s), ${negCount} negative charge(s). Field lines go from + to −. Arrow density shows field strength.`);
  }, [config]);

  return (
    <div className="space-y-4">
      {/* Config selector */}
      <div className="flex gap-2 flex-wrap">
        {Object.entries(CONFIGS).map(([key, { label }]) => (
          <button key={key} onClick={() => setConfig(key)}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all border ${
              config === key ? "bg-green-600 text-white border-green-600" : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-green-300"
            }`}>
            {label}
          </button>
        ))}
      </div>

      <canvas ref={canvasRef} width={W} height={H}
        className="w-full rounded-2xl border border-gray-100 dark:border-gray-800" />

      {/* Legend */}
      <div className="flex items-center gap-6 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-bold">+</div>
          <span className="text-sm text-gray-600 dark:text-gray-400">Positive Charge</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">−</div>
          <span className="text-sm text-gray-600 dark:text-gray-400">Negative Charge</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5 bg-green-500" />
          <span className="text-sm text-gray-600 dark:text-gray-400">Field Lines (+ → −)</span>
        </div>
      </div>

      <button onClick={() => draw(config)}
        className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold px-5 py-2.5 rounded-xl transition-colors">
        <RotateCcw className="w-4 h-4" />Redraw
      </button>

      <div className="text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-xl px-4 py-2">
        <span className="font-mono">E = kq/r²</span>&nbsp;|&nbsp;
        Field lines start at + charges, end at − charges.&nbsp;|&nbsp;
        Denser lines = stronger field
      </div>
    </div>
  );
}
