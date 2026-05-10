import { useEffect, useRef, useState } from "react";

interface Props {
  onContextChange?: (ctx: string) => void;
}

const W = 720, H = 380;
const CX = W / 2, CY = H / 2;

const ORBITALS = [
  { id: "1s", label: "1s", n: 1, l: 0, color: "#3b82f6" },
  { id: "2s", label: "2s", n: 2, l: 0, color: "#06b6d4" },
  { id: "2p", label: "2p", n: 2, l: 1, color: "#8b5cf6" },
  { id: "3s", label: "3s", n: 3, l: 0, color: "#10b981" },
  { id: "3p", label: "3p", n: 3, l: 1, color: "#f59e0b" },
  { id: "3d", label: "3d", n: 3, l: 2, color: "#ef4444" },
];

export default function AtomicOrbitals({ onContextChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const tRef = useRef(0);
  const lastRef = useRef<number | null>(null);
  const [selected, setSelected] = useState("2p");

  function draw(t: number, orb: string) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const orbital = ORBITALS.find(o => o.id === orb) || ORBITALS[2];
    const { n, l, color } = orbital;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, W, H);

    // Nucleus
    const nucR = 8;
    const nucGrad = ctx.createRadialGradient(CX - 2, CY - 2, 1, CX, CY, nucR);
    nucGrad.addColorStop(0, "#fef9c3");
    nucGrad.addColorStop(1, "#ef4444");
    ctx.fillStyle = nucGrad;
    ctx.beginPath(); ctx.arc(CX, CY, nucR, 0, Math.PI * 2); ctx.fill();

    // Draw probability density using stipple-like approach
    if (l === 0) {
      // s orbital: spherically symmetric, exponential decay
      drawSOrbital(ctx, n, color, t);
    } else if (l === 1) {
      // p orbital: two lobes along each axis
      drawPOrbital(ctx, n, color, t);
    } else if (l === 2) {
      // d orbital: four lobes
      drawDOrbital(ctx, n, color, t);
    }

    // Labels & info
    ctx.fillStyle = color;
    ctx.font = "bold 16px sans-serif";
    ctx.fillText(`${orb} Orbital`, 14, 24);
    ctx.fillStyle = "#94a3b8";
    ctx.font = "12px sans-serif";
    ctx.fillText(`n = ${n} (principal)   l = ${l} (angular momentum)`, 14, 44);
    ctx.fillText(l === 0 ? "Shape: Sphere" : l === 1 ? "Shape: Dumbbell (2 lobes)" : "Shape: Cloverleaf (4 lobes)", 14, 60);

    // Quantum numbers box
    ctx.fillStyle = "rgba(30,41,59,0.9)";
    ctx.beginPath(); ctx.roundRect(W - 190, 10, 175, 75, 8); ctx.fill();
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px monospace";
    ctx.textAlign = "right";
    const qns = l === 0 ? ["mₗ = 0 (1 orbital)"] : l === 1 ? ["mₗ = −1, 0, +1 (3 orbitals)"] : ["mₗ = −2,−1,0,+1,+2 (5 orbitals)"];
    ctx.fillText(`n = ${n}, l = ${l}`, W - 20, 30);
    ctx.fillText(`Type: ${l === 0 ? "s" : l === 1 ? "p" : "d"}-orbital`, W - 20, 48);
    ctx.fillText(qns[0], W - 20, 66);
    ctx.fillText(`Max electrons: ${2 * (2 * l + 1)}`, W - 20, 78);
    ctx.textAlign = "left";
  }

  function drawSOrbital(ctx: CanvasRenderingContext2D, n: number, color: string, t: number) {
    const baseR = 50 + n * 30;
    const numShells = n;

    for (let shell = numShells; shell >= 1; shell--) {
      const r = (shell / numShells) * baseR;
      const alpha = shell === numShells ? 0.08 : 0.15;

      // Density cloud (many small dots)
      const numDots = 600;
      const hexColor = color;
      ctx.fillStyle = hexColor.replace(")", `,${alpha})`).replace("rgb", "rgba").replace("#", "rgba(").replace(/([0-9a-f]{2})/gi, (m) => parseInt(m, 16) + ",").replace(/,$/, ")");

      for (let i = 0; i < numDots; i++) {
        const angle = Math.random() * 2 * Math.PI;
        const rr = Math.random() * r;
        const px = CX + rr * Math.cos(angle);
        const py = CY + rr * Math.sin(angle);
        const dist = rr / r;
        // s orbital density ~ exp(-r/r0) for 1s, oscillates for 2s, 3s
        let density = 0;
        if (n === 1) density = Math.exp(-2.5 * dist);
        else if (n === 2) density = Math.pow(2 - dist * 2, 2) * Math.exp(-dist * 2);
        else density = Math.pow(27 - 18 * dist * 3 + 2 * dist * dist * 9, 2) * Math.exp(-dist * 2 / 3) * 0.001;
        if (density > 0.01) {
          ctx.fillStyle = color;
          ctx.globalAlpha = Math.min(density * 0.8, 0.6);
          ctx.beginPath(); ctx.arc(px, py, 1.5, 0, Math.PI * 2); ctx.fill();
        }
      }
    }
    ctx.globalAlpha = 1;

    // Boundary circle (animated pulse)
    const pulse = 1 + 0.03 * Math.sin(t * 2);
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.4;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]);
    ctx.beginPath(); ctx.arc(CX, CY, baseR * pulse, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;

    // Radial node circles for 2s, 3s
    for (let node = 1; node < n; node++) {
      const nr = (node / n) * baseR;
      ctx.strokeStyle = "#f59e0b";
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.arc(CX, CY, nr, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#f59e0b"; ctx.font = "10px sans-serif";
      ctx.fillText("node", CX + nr + 3, CY - 3);
    }
  }

  function drawPOrbital(ctx: CanvasRenderingContext2D, n: number, color: string, t: number) {
    const lobeR = 80 + n * 15;
    const wobble = Math.sin(t * 0.8) * 5;
    const axes = [
      { dx: 1, dy: 0, label: "px" },
      { dx: 0, dy: 1, label: "py" },
      { dx: 0.7, dy: 0.7, label: "pz" },
    ];

    for (const axis of axes) {
      for (const sign of [1, -1]) {
        // Draw petal lobe
        const lobeCX = CX + sign * axis.dx * lobeR * 0.5;
        const lobeCY = CY + sign * axis.dy * lobeR * 0.5;
        const grad = ctx.createRadialGradient(lobeCX, lobeCY, 0, lobeCX, lobeCY, lobeR * 0.6);
        grad.addColorStop(0, color + "ee");
        grad.addColorStop(0.5, color + "66");
        grad.addColorStop(1, "transparent");
        ctx.fillStyle = grad;
        ctx.globalAlpha = 0.7;

        // Elongated circle (lobe)
        ctx.save();
        ctx.translate(CX + sign * axis.dx * lobeR * 0.3 + wobble * axis.dy, CY + sign * axis.dy * lobeR * 0.3 + wobble * axis.dx);
        const lAngle = Math.atan2(axis.dy, axis.dx);
        ctx.rotate(lAngle);
        ctx.scale(1.8, 1);
        ctx.beginPath(); ctx.arc(sign * lobeR * 0.35, 0, lobeR * 0.45, 0, Math.PI * 2);
        ctx.restore();
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;

    // Node plane (xy plane for pz)
    ctx.strokeStyle = "#f59e0b";
    ctx.globalAlpha = 0.4;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(CX - lobeR, CY); ctx.lineTo(CX + lobeR, CY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(CX, CY - lobeR); ctx.lineTo(CX, CY + lobeR); ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
  }

  function drawDOrbital(ctx: CanvasRenderingContext2D, n: number, color: string, t: number) {
    const lobeR = 90 + n * 10;
    const rotation = t * 0.3;
    const numPetals = 4;

    ctx.save();
    ctx.translate(CX, CY);
    ctx.rotate(rotation * 0.2);

    for (let p = 0; p < numPetals; p++) {
      const angle = (p * Math.PI / 2) + rotation * 0.05;
      const px = lobeR * 0.4 * Math.cos(angle);
      const py = lobeR * 0.4 * Math.sin(angle);

      const grad = ctx.createRadialGradient(px, py, 0, px, py, lobeR * 0.55);
      grad.addColorStop(0, color + "dd");
      grad.addColorStop(0.5, color + "55");
      grad.addColorStop(1, "transparent");

      ctx.fillStyle = grad;
      ctx.globalAlpha = 0.75;
      ctx.save();
      ctx.translate(px * 0.5, py * 0.5);
      ctx.rotate(angle);
      ctx.scale(1.5, 1);
      ctx.beginPath(); ctx.arc(px * 0.5, py * 0.5, lobeR * 0.45, 0, Math.PI * 2);
      ctx.restore();
      ctx.fill();
    }
    ctx.restore();
    ctx.globalAlpha = 1;

    // Node planes
    ctx.strokeStyle = "#f59e0b"; ctx.globalAlpha = 0.35; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
    ctx.save(); ctx.translate(CX, CY); ctx.rotate(Math.PI / 4);
    ctx.beginPath(); ctx.moveTo(-lobeR, 0); ctx.lineTo(lobeR, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -lobeR); ctx.lineTo(0, lobeR); ctx.stroke();
    ctx.restore();
    ctx.setLineDash([]); ctx.globalAlpha = 1;
  }

  useEffect(() => {
    const loop = (ts: number) => {
      if (!lastRef.current) lastRef.current = ts;
      const dt = Math.min((ts - lastRef.current) / 1000, 0.05);
      lastRef.current = ts;
      tRef.current += dt;
      draw(tRef.current, selected);
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(animRef.current); lastRef.current = null; };
  }, [selected]);

  useEffect(() => {
    const orb = ORBITALS.find(o => o.id === selected)!;
    onContextChange?.(`Atomic Orbital ${selected}: n=${orb.n} (principal quantum number), l=${orb.l} (angular momentum). Shape: ${orb.l === 0 ? "spherical (s-orbital)" : orb.l === 1 ? "dumbbell with 2 lobes (p-orbital)" : "cloverleaf with 4 lobes (d-orbital)"}. Max ${2 * (2 * orb.l + 1)} electrons.`);
  }, [selected]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {ORBITALS.map(orb => (
          <button key={orb.id} onClick={() => setSelected(orb.id)}
            className={`px-3 py-1.5 rounded-xl text-sm font-bold border transition-all ${selected === orb.id ? "text-white border-transparent" : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"}`}
            style={selected === orb.id ? { backgroundColor: orb.color } : {}}>
            {orb.label}
          </button>
        ))}
      </div>

      <canvas ref={canvasRef} width={W} height={H}
        className="w-full rounded-2xl border border-gray-700" />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        {[
          { label: "Orbital Type", value: selected[1] + "-orbital" },
          { label: "n (principal)", value: ORBITALS.find(o => o.id === selected)?.n.toString() || "" },
          { label: "l (angular)", value: ORBITALS.find(o => o.id === selected)?.l.toString() || "" },
          { label: "Max electrons", value: `${2 * (2 * (ORBITALS.find(o => o.id === selected)?.l || 0) + 1)}` },
        ].map(s => (
          <div key={s.label} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
            <div className="font-bold text-gray-900 dark:text-white">{s.value}</div>
            <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-xl px-4 py-2">
        Probability density = |ψ(r,θ,φ)|² — Cloud density shows where electron is most likely to be found.
        Yellow dashed lines = nodal planes/surfaces (zero probability)
      </div>
    </div>
  );
}
