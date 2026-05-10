import { useEffect, useRef, useState } from "react";

interface Props {
  onContextChange?: (ctx: string) => void;
}

const W = 720, H = 380;
const CX = W / 2, CY = H / 2;

export default function LensOptics({ onContextChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const paramsRef = useRef({ lensType: "converging" as "converging" | "diverging", focalLength: 120, objectDist: 200 });

  const [lensType, setLensType] = useState<"converging" | "diverging">("converging");
  const [focalLength, setFocalLength] = useState(120);
  const [objectDist, setObjectDist] = useState(200);

  paramsRef.current = { lensType, focalLength, objectDist };

  function draw() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const { lensType, focalLength, objectDist } = paramsRef.current;
    const f = lensType === "converging" ? focalLength : -focalLength;

    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, W, H);

    // Grid (subtle)
    ctx.strokeStyle = "rgba(0,0,0,0.04)";
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    // Optical axis
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath(); ctx.moveTo(0, CY); ctx.lineTo(W, CY); ctx.stroke();
    ctx.setLineDash([]);

    // Focal points
    const F1x = CX - Math.abs(focalLength);
    const F2x = CX + Math.abs(focalLength);
    for (const fx of [F1x, F2x]) {
      ctx.fillStyle = "#6366f1";
      ctx.beginPath(); ctx.arc(fx, CY, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#6366f1";
      ctx.font = "bold 12px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("F", fx, CY + 16);
    }
    ctx.textAlign = "left";

    // Lens drawing
    const lensH = 160;
    ctx.strokeStyle = "#1d4ed8";
    ctx.lineWidth = 2.5;
    if (lensType === "converging") {
      ctx.beginPath();
      ctx.moveTo(CX, CY - lensH / 2);
      ctx.bezierCurveTo(CX + 30, CY - lensH / 4, CX + 30, CY + lensH / 4, CX, CY + lensH / 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(CX, CY - lensH / 2);
      ctx.bezierCurveTo(CX - 30, CY - lensH / 4, CX - 30, CY + lensH / 4, CX, CY + lensH / 2);
      ctx.stroke();
      // Arrowheads
      ctx.fillStyle = "#1d4ed8";
      const arrH = 8;
      // top arrow pointing up
      ctx.beginPath(); ctx.moveTo(CX, CY - lensH / 2); ctx.lineTo(CX - arrH / 2, CY - lensH / 2 + arrH * 1.5); ctx.lineTo(CX + arrH / 2, CY - lensH / 2 + arrH * 1.5); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(CX, CY + lensH / 2); ctx.lineTo(CX - arrH / 2, CY + lensH / 2 - arrH * 1.5); ctx.lineTo(CX + arrH / 2, CY + lensH / 2 - arrH * 1.5); ctx.closePath(); ctx.fill();
    } else {
      // Diverging lens (biconcave)
      ctx.beginPath();
      ctx.moveTo(CX, CY - lensH / 2);
      ctx.bezierCurveTo(CX - 30, CY - lensH / 4, CX - 30, CY + lensH / 4, CX, CY + lensH / 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(CX, CY - lensH / 2);
      ctx.bezierCurveTo(CX + 30, CY - lensH / 4, CX + 30, CY + lensH / 4, CX, CY + lensH / 2);
      ctx.stroke();
    }

    // Object arrow
    const objX = CX - objectDist;
    const objH = 70;
    if (objX > 10 && objX < CX - 10) {
      ctx.strokeStyle = "#dc2626";
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(objX, CY); ctx.lineTo(objX, CY - objH); ctx.stroke();
      // Arrowhead
      ctx.fillStyle = "#dc2626";
      ctx.beginPath(); ctx.moveTo(objX, CY - objH); ctx.lineTo(objX - 7, CY - objH + 12); ctx.lineTo(objX + 7, CY - objH + 12); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#dc2626"; ctx.font = "bold 12px sans-serif"; ctx.fillText("Object", objX + 5, CY - objH - 5);
    }

    // Lens formula: 1/v = 1/f + 1/u (where u is negative for real object)
    const u = -objectDist; // object distance (negative for real object on left)
    const v = 1 / (1 / f - 1 / u); // actually: 1/v = 1/f - 1/u gives... let me use: 1/v = 1/f + 1/u with sign convention
    // Using: 1/v - 1/u = 1/f (Cartesian), u = -objectDist (negative)
    // 1/v = 1/f + 1/u = 1/f - 1/objectDist
    const vCalc = 1 / (1 / f + 1 / u);
    const magnification = vCalc / u; // m = v/u

    const imgX = CX + vCalc;
    const imgH = Math.abs(magnification) * objH;
    const imgInverted = magnification < 0;
    const isReal = vCalc > 0;

    // Image arrow (or virtual dashed)
    if (Math.abs(imgX - CX) < W / 2 - 20 && imgX > 20 && Math.abs(imgH) < H * 0.7) {
      ctx.strokeStyle = isReal ? "#16a34a" : "#9333ea";
      ctx.lineWidth = 2.5;
      if (!isReal) ctx.setLineDash([5, 4]);
      const imgTop = imgInverted ? CY + imgH : CY - imgH;
      ctx.beginPath(); ctx.moveTo(imgX, CY); ctx.lineTo(imgX, imgTop); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = isReal ? "#16a34a" : "#9333ea";
      const arrDir = imgInverted ? 1 : -1;
      ctx.beginPath(); ctx.moveTo(imgX, imgTop); ctx.lineTo(imgX - 7, imgTop - arrDir * 12); ctx.lineTo(imgX + 7, imgTop - arrDir * 12); ctx.closePath(); ctx.fill();
      ctx.font = "bold 11px sans-serif";
      ctx.fillText(`Image (${isReal ? "Real" : "Virtual"})`, imgX + 6, CY - imgH / 2);
    }

    // Three principal rays
    const rays = [
      // Ray 1: parallel to axis → through focal point (converging) / appears from focal point (diverging)
      { color: "#f59e0b", label: "Ray 1" },
      // Ray 2: through center of lens (undeviated)
      { color: "#3b82f6", label: "Ray 2" },
      // Ray 3: through front focal point → emerges parallel
      { color: "#ec4899", label: "Ray 3" },
    ];

    ctx.lineWidth = 1.5;

    // Ray 1: from object tip, parallel to axis, then through/from F2
    if (objX > 10 && objX < CX - 5) {
      ctx.strokeStyle = "rgba(245,158,11,0.8)";
      ctx.beginPath();
      ctx.moveTo(objX, CY - objH);
      ctx.lineTo(CX, CY - objH); // to lens
      // Then refract
      if (lensType === "converging") {
        // goes through F2
        const slope = (CY - objH - CY) / (CX - F2x);
        const endX = W;
        ctx.lineTo(endX, CY - objH + slope * (endX - CX));
      } else {
        // appears to come from F1
        const slope = (CY - (CY - objH)) / (CX - F1x);
        const endX = W;
        ctx.lineTo(endX, CY - objH + slope * (endX - CX));
      }
      ctx.stroke();
    }

    // Ray 2: through center of lens (straight line)
    if (objX > 10 && objX < CX - 5) {
      ctx.strokeStyle = "rgba(59,130,246,0.8)";
      const slope = (CY - (CY - objH)) / (CX - objX);
      ctx.beginPath();
      ctx.moveTo(objX, CY - objH);
      const endX = W;
      ctx.lineTo(endX, (CY - objH) + slope * (endX - objX));
      ctx.stroke();
    }

    // Info panel
    const infoX = 10, infoY = 10;
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.beginPath(); ctx.roundRect(infoX, infoY, 200, 90, 8); ctx.fill();
    ctx.strokeStyle = "#e2e8f0"; ctx.lineWidth = 1; ctx.stroke();

    ctx.fillStyle = "#1e293b";
    ctx.font = "bold 12px sans-serif";
    ctx.fillText(`f = ${lensType === "converging" ? "+" : "−"}${focalLength} px`, infoX + 10, infoY + 20);
    ctx.fillText(`u = −${objectDist} px`, infoX + 10, infoY + 38);
    ctx.fillText(`v = ${vCalc.toFixed(0)} px (${isReal ? "real" : "virtual"})`, infoX + 10, infoY + 56);
    ctx.fillText(`m = ${magnification.toFixed(2)}× (${imgInverted ? "inverted" : "upright"})`, infoX + 10, infoY + 74);
  }

  useEffect(() => {
    draw();
    const f = lensType === "converging" ? focalLength : -focalLength;
    const u = -objectDist;
    const v = 1 / (1 / f + 1 / u);
    const m = v / u;
    onContextChange?.(`${lensType === "converging" ? "Converging" : "Diverging"} lens: f=${lensType === "converging" ? "+" : "-"}${focalLength}px, object at u=-${objectDist}px, image at v=${v.toFixed(0)}px (${v > 0 ? "real" : "virtual"}), magnification=${m.toFixed(2)}x (${m < 0 ? "inverted" : "upright"}). Lens formula: 1/v - 1/u = 1/f`);
  }, [lensType, focalLength, objectDist]);

  return (
    <div className="space-y-4">
      <canvas ref={canvasRef} width={W} height={H}
        className="w-full rounded-2xl border border-gray-100 dark:border-gray-800" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Lens Type</div>
          <div className="flex gap-2">
            {(["converging", "diverging"] as const).map(t => (
              <button key={t} onClick={() => setLensType(t)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${lensType === t ? "bg-green-600 text-white border-green-600" : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"}`}>
                {t === "converging" ? "⊕ Converging" : "⊖ Diverging"}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            <span>Focal Length</span>
            <span className="text-green-600 font-bold">{focalLength} px</span>
          </div>
          <input type="range" min={60} max={180} value={focalLength} onChange={e => setFocalLength(Number(e.target.value))}
            className="w-full accent-green-600" />
          <div className="flex justify-between text-xs text-gray-400 mt-0.5"><span>Short f</span><span>Long f</span></div>
        </div>

        <div>
          <div className="flex justify-between text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            <span>Object Distance (u)</span>
            <span className="text-green-600 font-bold">{objectDist} px</span>
          </div>
          <input type="range" min={50} max={300} value={objectDist} onChange={e => setObjectDist(Number(e.target.value))}
            className="w-full accent-green-600" />
          <div className="flex justify-between text-xs text-gray-400 mt-0.5"><span>Close (50)</span><span>Far (300)</span></div>
        </div>
      </div>

      <div className="flex gap-3 text-xs flex-wrap">
        {[
          { color: "#f59e0b", label: "Ray 1: Parallel → through F₂" },
          { color: "#3b82f6", label: "Ray 2: Through center (undeviated)" },
          { color: "#16a34a", label: "Real image" },
          { color: "#9333ea", label: "Virtual image (dashed)" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="w-4 h-1 rounded" style={{ background: color }} />
            <span className="text-gray-500 dark:text-gray-400">{label}</span>
          </div>
        ))}
      </div>

      <div className="text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-xl px-4 py-2">
        <span className="font-mono">1/v − 1/u = 1/f</span>&nbsp;|&nbsp;
        <span className="font-mono">m = v/u</span>&nbsp;|&nbsp;
        f positive = converging, f negative = diverging
      </div>
    </div>
  );
}
