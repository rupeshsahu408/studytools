import { useEffect, useRef, useState, useCallback } from "react";
import { RotateCcw } from "lucide-react";

interface Props {
  mode?: string;
  showGraph?: boolean;
  showFormula?: boolean;
  showPermittivity?: boolean;
  varyBoth?: boolean;
  particles?: string;
  showFieldGradient?: boolean;
  onContextChange?: (ctx: string) => void;
}

const W = 700, H = 420;
const K = 8.99e9;

const MEDIA = [
  { name: "Vacuum / Air", epsilon: 1.0, color: "#1a2a3a" },
  { name: "Water", epsilon: 80, color: "#0a1f3a" },
  { name: "Glass", epsilon: 6, color: "#1a2a2a" },
  { name: "Oil", epsilon: 2.5, color: "#2a2010" },
];

export default function CoulombLab({
  mode = "force-vs-distance",
  showGraph = true,
  showFormula = true,
  showPermittivity = false,
  particles = "charges",
  onContextChange,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);

  const [q1, setQ1] = useState(2);
  const [q2, setQ2] = useState(2);
  const [dist, setDist] = useState(0.5);
  const [mediaIdx, setMediaIdx] = useState(0);

  const q1C = q1 * 1e-9;
  const q2C = q2 * 1e-9;
  const distM = dist * 0.1;
  const epsilon = MEDIA[mediaIdx].epsilon;
  const force = (K * Math.abs(q1C) * Math.abs(q2C)) / (epsilon * distM * distM);
  const isRepel = (q1 >= 0 && q2 >= 0) || (q1 < 0 && q2 < 0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    timeRef.current += 0.02;
    const t = timeRef.current;

    // ── Background — physics lab ─────────────────────────────────────────
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#0a0e1a");
    bg.addColorStop(1, "#0d1a2e");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Lab bench
    const bench = ctx.createLinearGradient(0, H - 80, 0, H);
    bench.addColorStop(0, "#1a2030");
    bench.addColorStop(1, "#0d1520");
    ctx.fillStyle = bench;
    ctx.fillRect(0, H - 80, W, 80);
    ctx.strokeStyle = "rgba(100,150,255,0.2)";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, H - 80); ctx.lineTo(W, H - 80); ctx.stroke();

    // Grid
    ctx.strokeStyle = "rgba(100,150,255,0.07)";
    for (let x = 0; x <= W; x += 50) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H - 80); ctx.stroke(); }
    for (let y = 0; y < H - 80; y += 50) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    // ── Track rail ───────────────────────────────────────────────────────
    const trackY = H - 140;
    ctx.strokeStyle = "rgba(150,180,255,0.3)";
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(60, trackY); ctx.lineTo(W - 60, trackY); ctx.stroke();
    // Rail ticks
    for (let x = 80; x < W - 60; x += 40) {
      ctx.strokeStyle = "rgba(150,180,255,0.2)";
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x, trackY - 4); ctx.lineTo(x, trackY + 4); ctx.stroke();
    }

    // ── Sphere positions ─────────────────────────────────────────────────
    const cx = W / 2;
    const sphereR = 22;
    const pixelDist = dist * 180;
    const x1 = cx - pixelDist / 2;
    const x2 = cx + pixelDist / 2;

    // ── Force arrows (before spheres so they go behind) ───────────────────
    const forceScale = Math.min(80, 15 * Math.log10(1 + force * 10));
    const arrowPulse = 1 + 0.1 * Math.sin(t * 4);

    if (isRepel) {
      // Repulsion — arrows pointing away
      drawForceArrow(ctx, x1, trackY, x1 - forceScale * arrowPulse, trackY, "#ff6060", "F →");
      drawForceArrow(ctx, x2, trackY, x2 + forceScale * arrowPulse, trackY, "#ff6060", "← F");
    } else {
      // Attraction — arrows pointing toward each other
      drawForceArrow(ctx, x1, trackY, x1 + forceScale * arrowPulse, trackY, "#60ff60", "← F");
      drawForceArrow(ctx, x2, trackY, x2 - forceScale * arrowPulse, trackY, "#60ff60", "F →");
    }

    // ── Distance label ───────────────────────────────────────────────────
    ctx.strokeStyle = "rgba(255,220,100,0.5)";
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x1, trackY - 40); ctx.lineTo(x2, trackY - 40); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#ffd060";
    ctx.font = "bold 12px monospace";
    ctx.textAlign = "center";
    ctx.fillText(`r = ${(distM * 100).toFixed(1)} cm`, cx, trackY - 48);
    // End marks
    ctx.strokeStyle = "rgba(255,220,100,0.5)";
    ctx.lineWidth = 1;
    [[x1, 0], [x2, 0]].forEach(([bx]) => {
      ctx.beginPath(); ctx.moveTo(bx, trackY - 44); ctx.lineTo(bx, trackY - 36); ctx.stroke();
    });

    // ── Sphere 1 ──────────────────────────────────────────────────────────
    drawSphere(ctx, x1, trackY, sphereR, q1, t);
    // ── Sphere 2 ──────────────────────────────────────────────────────────
    drawSphere(ctx, x2, trackY, sphereR, q2, t + 0.5);

    // ── Spark effect when close ───────────────────────────────────────────
    if (dist < 0.25 && isRepel) {
      for (let i = 0; i < 3; i++) {
        const sx = (x1 + x2) / 2 + (Math.random() - 0.5) * 20;
        const sy = trackY + (Math.random() - 0.5) * 20;
        ctx.beginPath();
        ctx.arc(sx, sy, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,200,50,${0.5 + 0.5 * Math.sin(t * 10)})`;
        ctx.fill();
      }
    }

    // ── Force readout box ─────────────────────────────────────────────────
    ctx.fillStyle = "rgba(10,20,40,0.85)";
    ctx.strokeStyle = "rgba(100,200,255,0.3)";
    ctx.lineWidth = 1;
    roundRect(ctx, W - 180, 20, 160, 100, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#64c8ff";
    ctx.font = "bold 11px monospace";
    ctx.textAlign = "left";
    ctx.fillText("FORCE METER", W - 168, 40);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 20px monospace";
    ctx.fillText(formatForce(force), W - 168, 68);
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "10px monospace";
    ctx.fillText(`F = kq₁q₂ / εr²`, W - 168, 88);
    ctx.fillText(`k = 8.99×10⁹ N·m²/C²`, W - 168, 103);

    // ── Mini graph ─────────────────────────────────────────────────────────
    if (showGraph) {
      drawMiniGraph(ctx, mode, q1C, q2C, epsilon);
    }

    // ── Formula box ───────────────────────────────────────────────────────
    if (showFormula) {
      ctx.fillStyle = "rgba(10,20,40,0.8)";
      ctx.strokeStyle = "rgba(100,200,100,0.3)";
      roundRect(ctx, 20, 20, 200, 50, 10);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#80ff80";
      ctx.font = "bold 14px monospace";
      ctx.textAlign = "left";
      ctx.fillText("F = kq₁q₂ / εr²", 30, 50);
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.font = "10px sans-serif";
      ctx.fillText(`Coulomb's Law`, 30, 30);
    }

    // ── Media label ───────────────────────────────────────────────────────
    if (showPermittivity) {
      ctx.fillStyle = "rgba(255,180,100,0.8)";
      ctx.font = "bold 11px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`Medium: ${MEDIA[mediaIdx].name} (εᵣ = ${MEDIA[mediaIdx].epsilon})`, cx, H - 55);
    }

    ctx.textAlign = "left";
  }, [q1, q2, dist, mediaIdx, mode, showGraph, showFormula, showPermittivity]);

  useEffect(() => {
    let running = true;
    const loop = () => {
      if (!running) return;
      draw();
      animRef.current = requestAnimationFrame(loop);
    };
    loop();
    return () => { running = false; cancelAnimationFrame(animRef.current); };
  }, [draw]);

  useEffect(() => {
    onContextChange?.(`Coulomb's Law Lab — q1=${q1}nC, q2=${q2}nC, distance=${(dist * 10).toFixed(1)}cm, medium=${MEDIA[mediaIdx].name}. Force = ${formatForce(force)}. ${isRepel ? "Repulsion" : "Attraction"}.`);
  }, [q1, q2, dist, mediaIdx, force]);

  return (
    <div className="space-y-4">
      <canvas ref={canvasRef} width={W} height={H} className="w-full rounded-2xl" />

      {/* Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <div className="flex justify-between text-sm font-medium text-gray-300 mb-1">
            <span>Charge q₁</span>
            <span className="text-red-400 font-bold">{q1 > 0 ? "+" : ""}{q1} nC</span>
          </div>
          <input type="range" min={-5} max={5} step={0.5} value={q1} onChange={e => setQ1(Number(e.target.value))}
            className="w-full accent-red-500" />
        </div>
        <div>
          <div className="flex justify-between text-sm font-medium text-gray-300 mb-1">
            <span>Charge q₂</span>
            <span className="text-blue-400 font-bold">{q2 > 0 ? "+" : ""}{q2} nC</span>
          </div>
          <input type="range" min={-5} max={5} step={0.5} value={q2} onChange={e => setQ2(Number(e.target.value))}
            className="w-full accent-blue-500" />
        </div>
        <div>
          <div className="flex justify-between text-sm font-medium text-gray-300 mb-1">
            <span>Distance r</span>
            <span className="text-yellow-400 font-bold">{(dist * 10).toFixed(1)} cm</span>
          </div>
          <input type="range" min={0.15} max={1} step={0.05} value={dist} onChange={e => setDist(Number(e.target.value))}
            className="w-full accent-yellow-400" />
        </div>
      </div>

      {showPermittivity && (
        <div className="flex gap-2 flex-wrap">
          {MEDIA.map((m, i) => (
            <button key={i} onClick={() => setMediaIdx(i)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${mediaIdx === i ? "bg-cyan-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}>
              {m.name} (εᵣ={m.epsilon})
            </button>
          ))}
        </div>
      )}

      <div className="bg-gray-800/60 border border-gray-700 rounded-xl px-4 py-3">
        <p className="text-xs text-gray-300 leading-relaxed">
          <span className="text-green-400 font-bold">F = {formatForce(force)} </span>
          — {isRepel ? "⟵ Repulsion ⟶ (like charges)" : "⟶ Attraction ⟵ (unlike charges)"}.
          {mode === "force-vs-distance" && " Try halving the distance — force quadruples! This is the inverse square law."}
          {mode === "force-vs-charge" && " Doubling any charge doubles the force. Force is directly proportional to both charges."}
          {mode === "medium-effect" && ` In ${MEDIA[mediaIdx].name} (εᵣ = ${MEDIA[mediaIdx].epsilon}), force is reduced by factor of ${MEDIA[mediaIdx].epsilon}.`}
        </p>
      </div>
    </div>
  );
}

function drawSphere(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, q: number, t: number) {
  const isPos = q >= 0;
  const c1 = isPos ? "#ff5050" : "#5080ff";
  const c2 = isPos ? "#cc0000" : "#0033cc";
  const glowColor = isPos ? "rgba(255,80,80,0.3)" : "rgba(80,130,255,0.3)";

  // Glow
  const glow = ctx.createRadialGradient(x, y, 0, x, y, r * 2.2);
  glow.addColorStop(0, glowColor);
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(x, y, r * 2.2 * (1 + 0.05 * Math.sin(t * 3)), 0, Math.PI * 2); ctx.fill();

  // Sphere body
  const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
  grad.addColorStop(0, "#ffffff");
  grad.addColorStop(0.25, c1);
  grad.addColorStop(1, c2);
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();

  // Symbol
  ctx.fillStyle = "white";
  ctx.font = `bold ${r}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(isPos ? "+" : "−", x, y + 1);

  // Label
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.font = "10px sans-serif";
  ctx.fillText(`${q > 0 ? "+" : ""}${q} nC`, x, y + r + 14);
  ctx.textBaseline = "alphabetic";
}

function drawForceArrow(ctx: CanvasRenderingContext2D, x1: number, y: number, x2: number, _y2: number, color: string, _label: string) {
  const dx = x2 - x1;
  const len = Math.abs(dx);
  if (len < 5) return;
  const dir = dx > 0 ? 1 : -1;
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x2, y);
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.stroke();
  // Arrowhead
  ctx.beginPath();
  ctx.moveTo(x2, y);
  ctx.lineTo(x2 - dir * 10, y - 6);
  ctx.lineTo(x2 - dir * 10, y + 6);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  // Glow
  ctx.shadowColor = color;
  ctx.shadowBlur = 8;
  ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y);
  ctx.strokeStyle = `${color}44`;
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.shadowBlur = 0;
}

function drawMiniGraph(ctx: CanvasRenderingContext2D, mode: string, q1: number, q2: number, epsilon: number) {
  const gx = 30, gy = 280, gw = 160, gh = 100;
  ctx.fillStyle = "rgba(10,20,40,0.8)";
  ctx.strokeStyle = "rgba(100,200,255,0.2)";
  ctx.lineWidth = 1;
  roundRect(ctx, gx, gy, gw, gh + 30, 8);
  ctx.fill(); ctx.stroke();

  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = "9px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(mode === "force-vs-distance" ? "F vs r (1/r² law)" : "F vs q", gx + gw / 2, gy + 14);

  // Axes
  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(gx + 20, gy + 20); ctx.lineTo(gx + 20, gy + gh + 10); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(gx + 20, gy + gh + 10); ctx.lineTo(gx + gw - 5, gy + gh + 10); ctx.stroke();

  // Curve
  ctx.beginPath();
  ctx.strokeStyle = "#64c8ff";
  ctx.lineWidth = 2;
  for (let i = 1; i <= gw - 30; i++) {
    const t = i / (gw - 30);
    let f: number;
    if (mode === "force-vs-distance") {
      const r = 0.01 + t * 0.09;
      f = (K * Math.abs(q1) * Math.abs(q2)) / (epsilon * r * r);
    } else {
      f = (K * Math.abs(q1) * (t * 5e-9)) / (epsilon * 0.05 * 0.05);
    }
    const maxF = mode === "force-vs-distance" ? (K * Math.abs(q1) * Math.abs(q2)) / (epsilon * 0.01 * 0.01) : (K * Math.abs(q1) * 5e-9) / (epsilon * 0.05 * 0.05);
    const fy = gy + gh + 10 - (f / maxF) * (gh - 10);
    const fx = gx + 20 + i;
    if (i === 1) ctx.moveTo(fx, fy); else ctx.lineTo(fx, fy);
  }
  ctx.stroke();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function formatForce(f: number): string {
  if (f >= 1e6) return `${(f / 1e6).toFixed(2)} MN`;
  if (f >= 1e3) return `${(f / 1e3).toFixed(2)} kN`;
  if (f >= 1) return `${f.toFixed(3)} N`;
  if (f >= 1e-3) return `${(f * 1e3).toFixed(2)} mN`;
  return `${(f * 1e6).toFixed(2)} μN`;
}
