import { useEffect, useRef, useState } from "react";

interface Props {
  onContextChange?: (ctx: string) => void;
}

const W = 720, H = 380;

const CELL_CONFIGS = [
  { id: "daniell", label: "Daniell Cell (Zn/Cu)", emf: 1.10, anode: "Zn", cathode: "Cu", anodeRxn: "Zn → Zn²⁺ + 2e⁻", cathodeRxn: "Cu²⁺ + 2e⁻ → Cu", anodeColor: "#a3a3a3", cathodeColor: "#c97b3a", electrolyte: "ZnSO₄ | CuSO₄" },
  { id: "lead", label: "Lead Acid Cell (Pb/PbO₂)", emf: 2.05, anode: "Pb", cathode: "PbO₂", anodeRxn: "Pb → Pb²⁺ + 2e⁻", cathodeRxn: "PbO₂ + 4H⁺ + 2e⁻ → Pb²⁺ + 2H₂O", anodeColor: "#9ca3af", cathodeColor: "#7c3aed", electrolyte: "H₂SO₄" },
  { id: "galvanic", label: "Zinc-Carbon Cell", emf: 1.50, anode: "Zn", cathode: "C", anodeRxn: "Zn → Zn²⁺ + 2e⁻", cathodeRxn: "2MnO₂ + 2NH₄⁺ + 2e⁻ → 2MnOOH + N₂", anodeColor: "#a3a3a3", cathodeColor: "#374151", electrolyte: "NH₄Cl (paste)" },
];

export default function ElectrochemicalCell({ onContextChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const tRef = useRef(0);
  const lastRef = useRef<number | null>(null);
  const [cellIdx, setCellIdx] = useState(0);
  const [showCurrent] = useState(true);
  const cellIdxRef = useRef(0);
  cellIdxRef.current = cellIdx;
  const showCurrentRef = useRef(true);
  showCurrentRef.current = showCurrent;

  function draw(t: number) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const cell = CELL_CONFIGS[cellIdxRef.current];

    ctx.clearRect(0, 0, W, H);

    // Background
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#f8fafc"); bg.addColorStop(1, "#f0fdf4");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    // ── Beaker body ──
    const bx = 80, by = 60, bw = W - 160, bh = 220;
    ctx.strokeStyle = "#475569"; ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(bx, by); ctx.lineTo(bx, by + bh);
    ctx.lineTo(bx + bw, by + bh);
    ctx.lineTo(bx + bw, by);
    ctx.stroke();

    // Electrolyte (liquid)
    const liqGrad = ctx.createLinearGradient(bx, by + bh - 140, bx, by + bh);
    liqGrad.addColorStop(0, "rgba(59,130,246,0.08)");
    liqGrad.addColorStop(1, "rgba(59,130,246,0.25)");
    ctx.fillStyle = liqGrad;
    ctx.fillRect(bx + 3, by + bh - 140, bw - 6, 137);
    ctx.fillStyle = "#3b82f6";
    ctx.font = "12px sans-serif"; ctx.textAlign = "center";
    ctx.fillText(cell.electrolyte, bx + bw / 2, by + bh - 10);

    // ── Salt bridge / separator ──
    const sepX = bx + bw / 2;
    ctx.strokeStyle = "#94a3b8"; ctx.lineWidth = 2; ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(sepX, by + bh - 140); ctx.lineTo(sepX, by + bh); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#94a3b8"; ctx.font = "10px sans-serif";
    ctx.fillText("Salt Bridge", sepX, by + bh - 148);

    // ── Anode electrode (left) ──
    const anodeX = bx + bw * 0.28, elecTop = by + 20, elecBot = by + bh - 20;
    const elecW = 28;
    ctx.fillStyle = cell.anodeColor;
    ctx.fillRect(anodeX - elecW / 2, elecTop, elecW, elecBot - elecTop);
    ctx.strokeStyle = "#374151"; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = "#dc2626"; ctx.font = "bold 13px sans-serif"; ctx.textAlign = "center";
    ctx.fillText("ANODE (−)", anodeX, by - 12);
    ctx.fillStyle = "#374151";
    ctx.fillText(cell.anode, anodeX, elecTop + 18);
    // Oxidation reaction
    ctx.fillStyle = "#dc2626"; ctx.font = "10px sans-serif";
    ctx.fillText("Oxidation", anodeX, by + bh + 25);
    ctx.fillStyle = "#374151";
    ctx.fillText(cell.anodeRxn, anodeX, by + bh + 40);

    // Anode dissolving animation (dots going into solution)
    for (let i = 0; i < 4; i++) {
      const phase = (t * 0.8 + i * 0.7) % 1.5;
      if (phase < 1) {
        const py = elecBot - 30 + phase * 70;
        const alpha = 1 - phase;
        ctx.fillStyle = `rgba(163,163,163,${alpha * 0.8})`;
        ctx.beginPath(); ctx.arc(anodeX + (Math.sin(i * 2.5) * 15), py, 4, 0, Math.PI * 2); ctx.fill();
      }
    }

    // ── Cathode electrode (right) ──
    const cathodeX = bx + bw * 0.72;
    ctx.fillStyle = cell.cathodeColor;
    ctx.fillRect(cathodeX - elecW / 2, elecTop, elecW, elecBot - elecTop);
    ctx.strokeStyle = "#374151"; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = "#16a34a"; ctx.font = "bold 13px sans-serif"; ctx.textAlign = "center";
    ctx.fillText("CATHODE (+)", cathodeX, by - 12);
    ctx.fillStyle = "#374151";
    ctx.fillText(cell.cathode, cathodeX, elecTop + 18);
    // Reduction reaction
    ctx.fillStyle = "#16a34a"; ctx.font = "10px sans-serif";
    ctx.fillText("Reduction", cathodeX, by + bh + 25);
    ctx.fillStyle = "#374151";
    ctx.fillText(cell.cathodeRxn, cathodeX, by + bh + 40);

    // Ions depositing on cathode (dots forming)
    for (let i = 0; i < 3; i++) {
      const phase = (t * 0.6 + i * 1.1) % 2;
      if (phase > 1 && phase < 2) {
        const norm = phase - 1;
        const py = by + bh - 60 + norm * 40;
        ctx.fillStyle = `rgba(196,124,56,${(1 - norm) * 0.7})`;
        ctx.beginPath(); ctx.arc(cathodeX + (Math.sin(i * 1.8) * 18), py, 4, 0, Math.PI * 2); ctx.fill();
      }
    }

    if (showCurrentRef.current) {
      // ── External circuit (wire + bulb) ──
      const wireY = by - 35;
      ctx.strokeStyle = "#374151"; ctx.lineWidth = 3; ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(anodeX, elecTop); ctx.lineTo(anodeX, wireY);
      ctx.lineTo(bx + bw * 0.38, wireY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cathodeX, elecTop); ctx.lineTo(cathodeX, wireY);
      ctx.lineTo(bx + bw * 0.62, wireY);
      ctx.stroke();

      // Bulb between wires
      const bulbX = bx + bw / 2, bulbY = wireY;
      // Glow
      const glowGrad = ctx.createRadialGradient(bulbX, bulbY, 5, bulbX, bulbY, 30);
      glowGrad.addColorStop(0, "rgba(253,224,71,0.7)");
      glowGrad.addColorStop(1, "transparent");
      ctx.fillStyle = glowGrad;
      ctx.beginPath(); ctx.arc(bulbX, bulbY, 30, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#fef08a";
      ctx.beginPath(); ctx.arc(bulbX, bulbY, 14, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#ca8a04"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(bulbX, bulbY, 14, 0, Math.PI * 2); ctx.stroke();

      // Electron flow arrows (external circuit: anode → cathode)
      const arrowPhase = (t * 60) % (cathodeX - anodeX);
      const arrX = anodeX + 60 + arrowPhase;
      if (arrX < cathodeX - 60) {
        ctx.fillStyle = "#dc2626";
        ctx.beginPath();
        ctx.moveTo(arrX + 10, wireY); ctx.lineTo(arrX - 2, wireY - 7); ctx.lineTo(arrX - 2, wireY + 7);
        ctx.closePath(); ctx.fill();
        // e- label
        ctx.fillStyle = "#dc2626"; ctx.font = "bold 10px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("e⁻", arrX + 14, wireY - 8);
      }

      // Ion flow arrows (inside solution: anode → cathode for + ions)
      const ionPhase = (t * 30) % (cathodeX - anodeX - 60);
      const ionX = anodeX + 30 + ionPhase;
      if (ionX < cathodeX - 30) {
        const solY = by + bh - 70;
        ctx.fillStyle = "#2563eb";
        ctx.beginPath();
        ctx.moveTo(ionX + 8, solY); ctx.lineTo(ionX - 2, solY - 5); ctx.lineTo(ionX - 2, solY + 5);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = "#2563eb"; ctx.font = "bold 10px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("M²⁺", ionX + 10, solY - 6);
      }
    }

    // ── EMF panel ──
    ctx.fillStyle = "rgba(15,23,42,0.9)";
    ctx.beginPath(); ctx.roundRect(W - 180, 8, 165, 65, 8); ctx.fill();
    ctx.fillStyle = "#22c55e"; ctx.font = "bold 14px sans-serif"; ctx.textAlign = "right";
    ctx.fillText(`EMF = ${cell.emf} V`, W - 16, 32);
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif";
    ctx.fillText(`E°(cathode) − E°(anode)`, W - 16, 50);
    ctx.fillText(cell.label.split("(")[0], W - 16, 66);

    ctx.textAlign = "left";
  }

  useEffect(() => {
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
  }, [cellIdx, showCurrent]);

  useEffect(() => {
    const cell = CELL_CONFIGS[cellIdx];
    onContextChange?.(`Electrochemical Cell: ${cell.label}. EMF = ${cell.emf}V. Anode (−): ${cell.anodeRxn} (oxidation). Cathode (+): ${cell.cathodeRxn} (reduction). Electrons flow from anode to cathode through external circuit. E°cell = E°cathode − E°anode`);
  }, [cellIdx]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {CELL_CONFIGS.map((c, i) => (
          <button key={c.id} onClick={() => setCellIdx(i)}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-all ${cellIdx === i ? "bg-green-600 text-white border-green-600" : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"}`}>
            {c.label}
          </button>
        ))}
      </div>

      <canvas ref={canvasRef} width={W} height={H}
        className="w-full rounded-2xl border border-gray-100 dark:border-gray-800" />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Cell EMF", value: `${CELL_CONFIGS[cellIdx].emf} V`, color: "text-green-600 dark:text-green-400" },
          { label: "Anode", value: CELL_CONFIGS[cellIdx].anode, color: "text-red-600 dark:text-red-400" },
          { label: "Cathode", value: CELL_CONFIGS[cellIdx].cathode, color: "text-green-600 dark:text-green-400" },
          { label: "Electrolyte", value: CELL_CONFIGS[cellIdx].electrolyte, color: "text-blue-600 dark:text-blue-400" },
        ].map(s => (
          <div key={s.label} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
            <div className={`font-bold text-sm ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800/30 rounded-xl p-3">
          <p className="text-xs font-bold text-red-600 dark:text-red-400 mb-1">Anode (Oxidation)</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 font-mono">{CELL_CONFIGS[cellIdx].anodeRxn}</p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800/30 rounded-xl p-3">
          <p className="text-xs font-bold text-green-600 dark:text-green-400 mb-1">Cathode (Reduction)</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 font-mono">{CELL_CONFIGS[cellIdx].cathodeRxn}</p>
        </div>
      </div>

      <div className="text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-xl px-4 py-2">
        <span className="font-mono font-bold">E°cell = E°cathode − E°anode</span>&nbsp;|&nbsp;
        Red arrows = electron flow (e⁻) in external circuit &nbsp;|&nbsp; Blue arrows = cation flow in solution
      </div>
    </div>
  );
}
