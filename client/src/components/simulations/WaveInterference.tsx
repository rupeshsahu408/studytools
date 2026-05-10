import { useEffect, useRef, useState } from "react";

interface Props {
  onContextChange?: (ctx: string) => void;
}

const W = 720, H = 380;

function wavelengthToColor(wl: number): string {
  // wl in nm, 380–700
  let r = 0, g = 0, b = 0;
  if (wl < 440) { r = -(wl - 440) / 60; b = 1; }
  else if (wl < 490) { g = (wl - 440) / 50; b = 1; }
  else if (wl < 510) { g = 1; b = -(wl - 510) / 20; }
  else if (wl < 580) { r = (wl - 510) / 70; g = 1; }
  else if (wl < 645) { r = 1; g = -(wl - 645) / 65; }
  else { r = 1; }
  const factor = wl < 420 ? 0.3 + 0.7 * (wl - 380) / 40 : wl > 680 ? 0.3 + 0.7 * (700 - wl) / 20 : 1;
  return `rgb(${Math.round(r * factor * 255)},${Math.round(g * factor * 255)},${Math.round(b * factor * 255)})`;
}

export default function WaveInterference({ onContextChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const tRef = useRef(0);
  const lastRef = useRef<number | null>(null);
  const paramsRef = useRef({ slits: 2, wavelength: 550, slitSep: 60, slitWidth: 8, running: true });

  const [slits, setSlits] = useState(2);
  const [wavelength, setWavelength] = useState(550);
  const [slitSep, setSlitSep] = useState(60);
  const [running, setRunning] = useState(true);

  paramsRef.current = { slits, wavelength, slitSep, slitWidth: 8, running };

  function draw(t: number) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const { slits, wavelength, slitSep } = paramsRef.current;
    const color = wavelengthToColor(wavelength);

    ctx.clearRect(0, 0, W, H);

    // Dark background for light simulation
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, W, H);

    const barrierX = W * 0.35;
    const screenX = W * 0.85;
    const cx = H / 2;

    // ─── Source side: expanding waves ───
    const srcX = W * 0.1;
    const waveSpeed = 80; // px/s
    const numWaves = 6;
    for (let i = 0; i < numWaves; i++) {
      const phase = (t * waveSpeed + i * (wavelength / 3)) % (barrierX - srcX);
      const r = srcX + phase;
      if (r < barrierX && r > srcX) {
        const alpha = 0.6 * (1 - phase / (barrierX - srcX));
        ctx.strokeStyle = color.replace("rgb", "rgba").replace(")", `,${alpha})`);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(srcX, cx, r - srcX, -Math.PI / 2 - 0.4, -Math.PI / 2 + 0.4);
        ctx.stroke();
      }
    }

    // ─── Barrier ───
    ctx.fillStyle = "#475569";
    ctx.fillRect(barrierX - 4, 0, 8, H);

    // ─── Slit openings ───
    const slitPositions: number[] = [];
    if (slits === 1) {
      slitPositions.push(cx);
    } else {
      slitPositions.push(cx - slitSep / 2, cx + slitSep / 2);
    }
    ctx.fillStyle = "#0f172a";
    for (const sy of slitPositions) {
      ctx.fillRect(barrierX - 4, sy - 10, 8, 20);
    }

    // ─── Huygens wavelets from slits ───
    const d = screenX - barrierX;
    for (const sy of slitPositions) {
      for (let i = 0; i < numWaves; i++) {
        const phase = (t * waveSpeed + i * (wavelength / 3)) % d;
        const r = phase;
        if (r > 2 && r < d) {
          const alpha = 0.5 * (1 - r / d);
          ctx.strokeStyle = color.replace("rgb", "rgba").replace(")", `,${alpha})`);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(barrierX, sy, r, -Math.PI * 0.7, Math.PI * 0.7);
          ctx.stroke();
        }
      }
    }

    // ─── Interference pattern on screen ───
    const screenH = H * 0.85;
    const screenTop = (H - screenH) / 2;
    const numPx = Math.floor(screenH);
    const lambda = wavelength * 0.1; // scale nm to px units

    for (let i = 0; i < numPx; i++) {
      const y = screenTop + i;
      const yOffset = y - cx;

      let intensity = 0;
      if (slits === 1) {
        // Single slit: sinc²
        const a = 8 * 0.1;
        const beta = Math.PI * a * yOffset / (lambda * (screenX - barrierX));
        intensity = beta === 0 ? 1 : Math.pow(Math.sin(beta) / beta, 2);
      } else {
        // Double slit: cos² × sinc²
        const d = slitSep * 0.1;
        const a = 8 * 0.1;
        const delta = Math.PI * d * yOffset / (lambda * (screenX - barrierX));
        const beta = Math.PI * a * yOffset / (lambda * (screenX - barrierX));
        const interference = Math.pow(Math.cos(delta), 2);
        const diffraction = beta === 0 ? 1 : Math.pow(Math.sin(beta) / beta, 2);
        intensity = interference * diffraction;
      }

      intensity = Math.max(0, Math.min(1, intensity));
      const alpha = intensity * 0.95;
      ctx.fillStyle = color.replace("rgb", "rgba").replace(")", `,${alpha})`);
      ctx.fillRect(screenX, y, 20, 1);
    }

    // Screen outline
    ctx.strokeStyle = "#64748b";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(screenX, screenTop);
    ctx.lineTo(screenX, screenTop + screenH);
    ctx.stroke();

    // Labels
    ctx.fillStyle = "#94a3b8";
    ctx.font = "11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Source", srcX, H - 10);
    ctx.fillText("Barrier", barrierX, H - 10);
    ctx.fillText("Screen", screenX + 10, H - 10);
    ctx.textAlign = "left";

    // λ label
    ctx.fillStyle = color;
    ctx.font = "bold 13px sans-serif";
    ctx.fillText(`λ = ${wavelength} nm`, 10, 20);
    ctx.fillStyle = "#94a3b8";
    ctx.fillText(`${slits === 1 ? "Single Slit" : "Double Slit"}  |  Slit sep. = ${slitSep} px`, 10, 36);
  }

  useEffect(() => {
    if (!running) { draw(tRef.current); return; }
    const loop = (ts: number) => {
      if (!lastRef.current) lastRef.current = ts;
      const dt = Math.min((ts - lastRef.current) / 1000, 0.05);
      lastRef.current = ts;
      tRef.current += dt;
      draw(tRef.current);
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(animRef.current); lastRef.current = null; };
  }, [running, slits, wavelength, slitSep]);

  useEffect(() => {
    onContextChange?.(`Wave Interference: ${slits === 1 ? "Single" : "Double"} slit, wavelength=${wavelength}nm (${wavelength < 450 ? "violet" : wavelength < 490 ? "blue" : wavelength < 560 ? "green" : wavelength < 590 ? "yellow" : wavelength < 625 ? "orange" : "red"}), slit separation=${slitSep}px. Pattern shows ${slits === 1 ? "diffraction" : "constructive & destructive interference"} fringes.`);
  }, [slits, wavelength, slitSep]);

  return (
    <div className="space-y-4">
      <canvas ref={canvasRef} width={W} height={H}
        className="w-full rounded-2xl border border-gray-700" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <div className="flex justify-between text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <span>Slit Configuration</span>
          </div>
          <div className="flex gap-2">
            {[1, 2].map(n => (
              <button key={n} onClick={() => setSlits(n)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${slits === n ? "bg-green-600 text-white border-green-600" : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"}`}>
                {n === 1 ? "Single Slit" : "Double Slit"}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            <span>Wavelength</span>
            <span className="font-bold" style={{ color: wavelengthToColor(wavelength) }}>{wavelength} nm</span>
          </div>
          <input type="range" min={380} max={700} value={wavelength}
            onChange={e => setWavelength(Number(e.target.value))}
            className="w-full accent-green-600"
            style={{ accentColor: wavelengthToColor(wavelength) }} />
          <div className="flex justify-between text-xs text-gray-400 mt-0.5"><span>Violet 380</span><span>Red 700</span></div>
        </div>

        {slits === 2 && (
          <div>
            <div className="flex justify-between text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <span>Slit Separation</span>
              <span className="text-green-600 font-bold">{slitSep} px</span>
            </div>
            <input type="range" min={20} max={140} value={slitSep}
              onChange={e => setSlitSep(Number(e.target.value))}
              className="w-full accent-green-600" />
            <div className="flex justify-between text-xs text-gray-400 mt-0.5"><span>Narrow</span><span>Wide</span></div>
          </div>
        )}

        <div>
          <button onClick={() => setRunning(r => !r)}
            className={`w-full py-2 rounded-xl text-sm font-semibold transition-colors ${running ? "bg-amber-500 text-white" : "bg-green-600 text-white"}`}>
            {running ? "⏸ Pause Waves" : "▶ Resume Waves"}
          </button>
        </div>
      </div>

      <div className="text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-xl px-4 py-2">
        {slits === 1
          ? <span className="font-mono">I(θ) = I₀·sinc²(πa·sinθ/λ) — Single slit diffraction</span>
          : <span className="font-mono">I(θ) = I₀·cos²(πd·sinθ/λ)·sinc²(πa·sinθ/λ) — Double slit</span>
        }
      </div>
    </div>
  );
}
