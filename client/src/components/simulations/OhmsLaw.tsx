import { useEffect, useRef, useState } from "react";

interface Props {
  onContextChange?: (ctx: string) => void;
}

const W = 720, H = 380;

export default function OhmsLaw({ onContextChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [voltage, setVoltage] = useState(9);
  const [resistance, setResistance] = useState(30);

  const current = voltage / resistance;
  const power = voltage * current;

  function draw(V: number, R: number) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const I = V / R;
    const P = V * I;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, W, H);

    // ── Circuit layout ──
    const pad = 60;
    const top = 80, bottom = H - 80;
    const left = 120, right = W - 150;
    const mid = (top + bottom) / 2;

    // Wires (thick gray lines)
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 3;
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(left, top); ctx.lineTo(right, top);   // top wire
    ctx.moveTo(left, bottom); ctx.lineTo(right, bottom); // bottom wire
    ctx.moveTo(left, top); ctx.lineTo(left, bottom);     // left wire (battery side)
    ctx.moveTo(right, top); ctx.lineTo(right, bottom);   // right wire
    ctx.stroke();

    // ── Battery (left vertical wire, with cells) ──
    const batCX = left, batMid = mid;
    const cellSpacing = 12;
    ctx.strokeStyle = "#1e40af";
    ctx.lineWidth = 2;
    for (let i = -2; i <= 2; i++) {
      const y = batMid + i * cellSpacing;
      const isLong = i % 2 === 0;
      const len = isLong ? 22 : 14;
      ctx.beginPath(); ctx.moveTo(batCX - len / 2, y); ctx.lineTo(batCX + len / 2, y); ctx.stroke();
    }
    ctx.fillStyle = "#1e40af"; ctx.font = "bold 14px sans-serif"; ctx.textAlign = "center";
    ctx.fillText(`${V}V`, batCX - 35, batMid + 5);
    ctx.fillText("+", batCX, batMid - 35); ctx.fillText("−", batCX, batMid + 40);

    // ── Resistor (top wire, center) ──
    const resX = (left + right) / 2;
    const resY = top;
    const resW = 80, resH = 24;
    ctx.strokeStyle = "#92400e"; ctx.lineWidth = 2.5;
    ctx.strokeRect(resX - resW / 2, resY - resH / 2, resW, resH);
    ctx.fillStyle = "#fef3c7";
    ctx.fillRect(resX - resW / 2 + 1, resY - resH / 2 + 1, resW - 2, resH - 2);
    // Zigzag inside resistor
    ctx.strokeStyle = "#92400e"; ctx.lineWidth = 1.5;
    ctx.beginPath();
    const zigSteps = 7;
    for (let i = 0; i <= zigSteps; i++) {
      const x = (resX - resW / 2 + 8) + (i / zigSteps) * (resW - 16);
      const y = resY + (i % 2 === 0 ? -6 : 6);
      i === 0 ? ctx.moveTo(x, resY) : ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.fillStyle = "#92400e"; ctx.font = "bold 12px sans-serif";
    ctx.fillText(`R = ${R}Ω`, resX, resY - resH / 2 - 8);

    // ── Lightbulb (right vertical wire) ──
    const bulbX = right, bulbY = mid;
    const bulbR = 28;
    const brightness = Math.min(I / 0.5, 1); // normalize to max 0.5A
    // Glow
    const glowR = ctx.createRadialGradient(bulbX, bulbY, bulbR * 0.5, bulbX, bulbY, bulbR * 3);
    const alpha = brightness * 0.7;
    glowR.addColorStop(0, `rgba(253,224,71,${alpha})`);
    glowR.addColorStop(1, "transparent");
    ctx.fillStyle = glowR;
    ctx.beginPath(); ctx.arc(bulbX, bulbY, bulbR * 3, 0, Math.PI * 2); ctx.fill();

    // Bulb body
    const bulbGrad = ctx.createRadialGradient(bulbX - 5, bulbY - 5, 3, bulbX, bulbY, bulbR);
    const col1 = `rgba(253,224,71,${0.3 + brightness * 0.7})`;
    const col2 = `rgba(234,179,8,${0.5 + brightness * 0.5})`;
    bulbGrad.addColorStop(0, col1);
    bulbGrad.addColorStop(1, col2);
    ctx.fillStyle = bulbGrad;
    ctx.beginPath(); ctx.arc(bulbX, bulbY, bulbR, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#ca8a04"; ctx.lineWidth = 2; ctx.stroke();
    // Filament
    ctx.strokeStyle = `rgba(180,83,9,${0.5 + brightness * 0.5})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(bulbX - 8, bulbY); ctx.lineTo(bulbX - 4, bulbY - 8);
    ctx.lineTo(bulbX, bulbY); ctx.lineTo(bulbX + 4, bulbY - 8);
    ctx.lineTo(bulbX + 8, bulbY);
    ctx.stroke();
    // Base
    ctx.fillStyle = "#475569";
    ctx.fillRect(bulbX - 12, bulbY + bulbR - 2, 24, 14);
    ctx.fillStyle = "#334155";
    ctx.font = "10px sans-serif";
    ctx.fillText("💡", bulbX - 7, bulbY + bulbR + 10);

    // ── Ammeter ──
    const amX = (left + resX - resW / 2) / 2, amY = bottom;
    ctx.fillStyle = "white";
    ctx.beginPath(); ctx.arc(amX, amY, 18, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#0891b2"; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = "#0891b2"; ctx.font = "bold 13px sans-serif"; ctx.textAlign = "center";
    ctx.fillText("A", amX, amY + 5);

    // ── Current flow arrows on top wire ──
    const arrowPositions = [left + 60, left + 120, left + 180];
    const arrowDir = I >= 0 ? 1 : -1;
    ctx.fillStyle = `rgba(220,38,38,${0.4 + brightness * 0.5})`;
    for (const ax of arrowPositions) {
      ctx.beginPath();
      ctx.moveTo(ax + arrowDir * 12, top);
      ctx.lineTo(ax - arrowDir * 4, top - 7);
      ctx.lineTo(ax - arrowDir * 4, top + 7);
      ctx.closePath(); ctx.fill();
    }

    // ── Display panel ──
    const panW = 200, panH = 130, panX = W - panW - 10, panY = 10;
    ctx.fillStyle = "rgba(15,23,42,0.9)";
    ctx.beginPath(); ctx.roundRect(panX, panY, panW, panH, 10); ctx.fill();

    const metrics = [
      { label: "Voltage (V)", value: `${V} V`, color: "#3b82f6" },
      { label: "Resistance (R)", value: `${R} Ω`, color: "#f59e0b" },
      { label: "Current (I = V/R)", value: `${I.toFixed(3)} A`, color: "#22c55e" },
      { label: "Power (P = VI)", value: `${P.toFixed(2)} W`, color: "#f97316" },
    ];

    metrics.forEach((m, i) => {
      ctx.fillStyle = m.color;
      ctx.font = `bold 13px sans-serif`;
      ctx.textAlign = "left";
      ctx.fillText(`${m.label}`, panX + 12, panY + 22 + i * 27);
      ctx.font = "bold 14px sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(m.value, panX + panW - 12, panY + 22 + i * 27);
    });

    ctx.textAlign = "left";
  }

  useEffect(() => {
    draw(voltage, resistance);
    onContextChange?.(`Ohm's Law circuit: V=${voltage}V, R=${resistance}Ω → I=V/R=${(voltage/resistance).toFixed(3)}A, Power P=VI=${(voltage * voltage / resistance).toFixed(2)}W. Higher current = brighter bulb.`);
  }, [voltage, resistance]);

  return (
    <div className="space-y-4">
      <canvas ref={canvasRef} width={W} height={H}
        className="w-full rounded-2xl border border-gray-100 dark:border-gray-800" />

      {/* Live readings */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Voltage", value: `${voltage} V`, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/20" },
          { label: "Resistance", value: `${resistance} Ω`, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/20" },
          { label: "Current", value: `${current.toFixed(3)} A`, color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-900/20" },
          { label: "Power", value: `${power.toFixed(2)} W`, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-900/20" },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center border border-transparent`}>
            <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <div className="flex justify-between text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            <span>Voltage (V)</span><span className="text-blue-600 font-bold">{voltage} V</span>
          </div>
          <input type="range" min={1} max={20} value={voltage} onChange={e => setVoltage(Number(e.target.value))}
            className="w-full accent-blue-500" />
          <div className="flex justify-between text-xs text-gray-400 mt-0.5"><span>1V</span><span>20V</span></div>
        </div>
        <div>
          <div className="flex justify-between text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            <span>Resistance (R)</span><span className="text-amber-600 font-bold">{resistance} Ω</span>
          </div>
          <input type="range" min={1} max={100} value={resistance} onChange={e => setResistance(Number(e.target.value))}
            className="w-full accent-amber-500" />
          <div className="flex justify-between text-xs text-gray-400 mt-0.5"><span>1Ω</span><span>100Ω</span></div>
        </div>
      </div>

      <div className="text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-xl px-4 py-2">
        <span className="font-mono font-bold">V = IR</span>&nbsp;|&nbsp;
        <span className="font-mono">P = VI = I²R = V²/R</span>&nbsp;|&nbsp;
        Bulb brightness ∝ power dissipated
      </div>
    </div>
  );
}
