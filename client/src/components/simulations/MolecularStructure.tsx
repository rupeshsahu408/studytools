import { useEffect, useRef, useState } from "react";

interface Props {
  onContextChange?: (ctx: string) => void;
}

const W = 720, H = 380;

interface Atom {
  x: number; y: number; z: number;
  symbol: string; color: string; radius: number;
}
interface Bond {
  a: number; b: number; order: number;
}
interface Molecule {
  name: string; formula: string;
  description: string;
  atoms: Atom[]; bonds: Bond[];
  bondAngle?: string;
}

const MOLECULES: Record<string, Molecule> = {
  H2O: {
    name: "Water", formula: "H₂O", bondAngle: "104.5°",
    description: "Bent shape due to 2 lone pairs. Polar molecule. Excellent solvent.",
    atoms: [
      { x: 0, y: 0, z: 0, symbol: "O", color: "#ef4444", radius: 22 },
      { x: -0.96, y: -0.6, z: 0, symbol: "H", color: "#e2e8f0", radius: 14 },
      { x: 0.96, y: -0.6, z: 0, symbol: "H", color: "#e2e8f0", radius: 14 },
    ],
    bonds: [{ a: 0, b: 1, order: 1 }, { a: 0, b: 2, order: 1 }],
  },
  CO2: {
    name: "Carbon Dioxide", formula: "CO₂", bondAngle: "180°",
    description: "Linear shape. Non-polar. Greenhouse gas. Double bonds.",
    atoms: [
      { x: 0, y: 0, z: 0, symbol: "C", color: "#374151", radius: 18 },
      { x: -1.16, y: 0, z: 0, symbol: "O", color: "#ef4444", radius: 22 },
      { x: 1.16, y: 0, z: 0, symbol: "O", color: "#ef4444", radius: 22 },
    ],
    bonds: [{ a: 0, b: 1, order: 2 }, { a: 0, b: 2, order: 2 }],
  },
  CH4: {
    name: "Methane", formula: "CH₄", bondAngle: "109.5°",
    description: "Tetrahedral shape. Non-polar. sp³ hybridization. Main component of natural gas.",
    atoms: [
      { x: 0, y: 0, z: 0, symbol: "C", color: "#374151", radius: 18 },
      { x: 0.63, y: 0.63, z: 0.63, symbol: "H", color: "#e2e8f0", radius: 13 },
      { x: -0.63, y: -0.63, z: 0.63, symbol: "H", color: "#e2e8f0", radius: 13 },
      { x: -0.63, y: 0.63, z: -0.63, symbol: "H", color: "#e2e8f0", radius: 13 },
      { x: 0.63, y: -0.63, z: -0.63, symbol: "H", color: "#e2e8f0", radius: 13 },
    ],
    bonds: [{ a: 0, b: 1, order: 1 }, { a: 0, b: 2, order: 1 }, { a: 0, b: 3, order: 1 }, { a: 0, b: 4, order: 1 }],
  },
  NH3: {
    name: "Ammonia", formula: "NH₃", bondAngle: "107°",
    description: "Trigonal pyramidal. Polar molecule. 1 lone pair. sp³ hybridization.",
    atoms: [
      { x: 0, y: 0.3, z: 0, symbol: "N", color: "#3b82f6", radius: 20 },
      { x: 0.94, y: -0.3, z: 0, symbol: "H", color: "#e2e8f0", radius: 13 },
      { x: -0.47, y: -0.3, z: 0.82, symbol: "H", color: "#e2e8f0", radius: 13 },
      { x: -0.47, y: -0.3, z: -0.82, symbol: "H", color: "#e2e8f0", radius: 13 },
    ],
    bonds: [{ a: 0, b: 1, order: 1 }, { a: 0, b: 2, order: 1 }, { a: 0, b: 3, order: 1 }],
  },
  NaCl: {
    name: "Sodium Chloride", formula: "NaCl", bondAngle: "—",
    description: "Ionic bond. Na⁺ donates electron to Cl⁻. Crystalline lattice structure.",
    atoms: [
      { x: -0.8, y: 0, z: 0, symbol: "Na⁺", color: "#fbbf24", radius: 20 },
      { x: 0.8, y: 0, z: 0, symbol: "Cl⁻", color: "#84cc16", radius: 24 },
    ],
    bonds: [{ a: 0, b: 1, order: 1 }],
  },
  O2: {
    name: "Oxygen", formula: "O₂", bondAngle: "—",
    description: "Diatomic molecule with double bond. Paramagnetic. Essential for respiration.",
    atoms: [
      { x: -0.6, y: 0, z: 0, symbol: "O", color: "#ef4444", radius: 22 },
      { x: 0.6, y: 0, z: 0, symbol: "O", color: "#ef4444", radius: 22 },
    ],
    bonds: [{ a: 0, b: 1, order: 2 }],
  },
};

function project(x: number, y: number, z: number, rotX: number, rotY: number, scale: number) {
  // Rotate around Y axis
  const rx = x * Math.cos(rotY) + z * Math.sin(rotY);
  const ry2 = z * Math.cos(rotY) - x * Math.sin(rotY);
  // Rotate around X axis
  const ry = y * Math.cos(rotX) - ry2 * Math.sin(rotX);
  const rz = y * Math.sin(rotX) + ry2 * Math.cos(rotX);
  // Perspective projection
  const fov = 5;
  const pz = rz + fov;
  const px = rx * fov / pz;
  const py = ry * fov / pz;
  return { sx: px * scale + W / 2, sy: py * scale + H / 2, sz: rz, depthScale: fov / pz };
}

export default function MolecularStructure({ onContextChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const tRef = useRef(0);
  const lastRef = useRef<number | null>(null);
  const rotRef = useRef({ x: 0.3, y: 0 });
  const dragRef = useRef({ dragging: false, lastX: 0, lastY: 0 });
  const [molKey, setMolKey] = useState("H2O");
  const molKeyRef = useRef("H2O");
  molKeyRef.current = molKey;

  function draw(t: number) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const mol = MOLECULES[molKeyRef.current];
    const { x: rotX, y: rotY } = rotRef.current;
    const scale = 110;

    ctx.clearRect(0, 0, W, H);

    // Dark background
    const bg = ctx.createRadialGradient(W / 2, H / 2, 50, W / 2, H / 2, W / 2);
    bg.addColorStop(0, "#1e293b");
    bg.addColorStop(1, "#0f172a");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Subtle grid
    ctx.strokeStyle = "rgba(255,255,255,0.03)";
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    // Project all atoms
    const projected = mol.atoms.map(a =>
      ({ ...project(a.x, a.y, a.z, rotX, rotY, scale), atom: a })
    );

    // Sort by depth for correct rendering order
    const sortedIndices = projected.map((_, i) => i).sort((a, b) => projected[a].sz - projected[b].sz);

    // Draw bonds first (behind atoms)
    for (const bond of mol.bonds) {
      const pa = projected[bond.a];
      const pb = projected[bond.b];
      const midX = (pa.sx + pb.sx) / 2;
      const midY = (pa.sy + pb.sy) / 2;
      const dx = pb.sx - pa.sx, dy = pb.sy - pa.sy;
      const len = Math.sqrt(dx * dx + dy * dy);
      const nx = -dy / len, ny = dx / len;

      if (bond.order === 1) {
        ctx.strokeStyle = "#94a3b8";
        ctx.lineWidth = 6;
        ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(pa.sx, pa.sy); ctx.lineTo(pb.sx, pb.sy); ctx.stroke();
      } else if (bond.order === 2) {
        // Double bond
        const offset = 6;
        for (const sign of [-1, 1]) {
          ctx.strokeStyle = "#94a3b8";
          ctx.lineWidth = 4;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(pa.sx + sign * nx * offset, pa.sy + sign * ny * offset);
          ctx.lineTo(pb.sx + sign * nx * offset, pb.sy + sign * ny * offset);
          ctx.stroke();
        }
      }
    }

    // Draw atoms
    for (const i of sortedIndices) {
      const { sx, sy, depthScale, atom } = projected[i];
      const r = atom.radius * Math.max(0.5, depthScale);
      const grad = ctx.createRadialGradient(sx - r * 0.3, sy - r * 0.3, r * 0.05, sx, sy, r);
      grad.addColorStop(0, lightenColor(atom.color, 0.8));
      grad.addColorStop(0.4, atom.color);
      grad.addColorStop(1, darkenColor(atom.color, 0.5));
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.fill();
      // Specular highlight
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.beginPath(); ctx.arc(sx - r * 0.25, sy - r * 0.25, r * 0.3, 0, Math.PI * 2); ctx.fill();
      // Symbol
      ctx.fillStyle = atom.symbol === "H" ? "#374151" : "white";
      ctx.font = `bold ${Math.max(9, r * 0.7)}px sans-serif`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(atom.symbol, sx, sy);
    }
    ctx.textBaseline = "alphabetic"; ctx.textAlign = "left";

    // Rotation hint
    if (!dragRef.current.dragging) {
      ctx.fillStyle = "rgba(148,163,184,0.5)";
      ctx.font = "11px sans-serif";
      ctx.fillText("Drag to rotate molecule", 10, H - 12);
    }

    // Info panel
    ctx.fillStyle = "rgba(30,41,59,0.9)";
    ctx.beginPath(); ctx.roundRect(10, 10, 220, 72, 8); ctx.fill();
    ctx.fillStyle = "#f1f5f9"; ctx.font = "bold 15px sans-serif";
    ctx.fillText(`${mol.name} (${mol.formula})`, 18, 32);
    ctx.fillStyle = "#94a3b8"; ctx.font = "11px sans-serif";
    const words = mol.description.split(" ");
    let line = "", lineY = 50;
    for (const w of words) {
      const test = line + w + " ";
      if (ctx.measureText(test).width > 200 && line !== "") {
        ctx.fillText(line, 18, lineY); lineY += 14; line = w + " ";
      } else line = test;
    }
    ctx.fillText(line, 18, lineY);

    // Bond angle
    if (mol.bondAngle && mol.bondAngle !== "—") {
      ctx.fillStyle = "#fbbf24"; ctx.font = "bold 12px sans-serif";
      ctx.fillText(`Bond angle: ${mol.bondAngle}`, 18, lineY + 16);
    }
  }

  function lightenColor(hex: string, amount: number): string {
    const num = parseInt(hex.slice(1), 16);
    const r = Math.min(255, (num >> 16) + Math.round(amount * 255));
    const g = Math.min(255, ((num >> 8) & 0xff) + Math.round(amount * 255));
    const b = Math.min(255, (num & 0xff) + Math.round(amount * 255));
    return `rgb(${r},${g},${b})`;
  }
  function darkenColor(hex: string, amount: number): string {
    const num = parseInt(hex.slice(1), 16);
    const r = Math.max(0, (num >> 16) - Math.round(amount * 255));
    const g = Math.max(0, ((num >> 8) & 0xff) - Math.round(amount * 255));
    const b = Math.max(0, (num & 0xff) - Math.round(amount * 255));
    return `rgb(${r},${g},${b})`;
  }

  // Mouse / touch drag handlers
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      dragRef.current.dragging = true;
      const pos = "touches" in e ? e.touches[0] : e;
      dragRef.current.lastX = pos.clientX;
      dragRef.current.lastY = pos.clientY;
    };
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!dragRef.current.dragging) return;
      const pos = "touches" in e ? e.touches[0] : e;
      const dx = pos.clientX - dragRef.current.lastX;
      const dy = pos.clientY - dragRef.current.lastY;
      rotRef.current.y += dx * 0.01;
      rotRef.current.x += dy * 0.01;
      dragRef.current.lastX = pos.clientX;
      dragRef.current.lastY = pos.clientY;
    };
    const onUp = () => { dragRef.current.dragging = false; };
    canvas.addEventListener("mousedown", onDown);
    canvas.addEventListener("mousemove", onMove as any);
    window.addEventListener("mouseup", onUp);
    canvas.addEventListener("touchstart", onDown as any, { passive: true });
    canvas.addEventListener("touchmove", onMove as any, { passive: true });
    window.addEventListener("touchend", onUp);
    return () => {
      canvas.removeEventListener("mousedown", onDown);
      canvas.removeEventListener("mousemove", onMove as any);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  useEffect(() => {
    const loop = (ts: number) => {
      if (!lastRef.current) lastRef.current = ts;
      const dt = Math.min((ts - lastRef.current) / 1000, 0.05);
      lastRef.current = ts;
      tRef.current += dt;
      if (!dragRef.current.dragging) rotRef.current.y += dt * 0.3;
      draw(tRef.current);
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(animRef.current); lastRef.current = null; };
  }, [molKey]);

  useEffect(() => {
    const mol = MOLECULES[molKey];
    onContextChange?.(`3D Molecular Structure of ${mol.name} (${mol.formula}): ${mol.description}${mol.bondAngle && mol.bondAngle !== "—" ? ` Bond angle: ${mol.bondAngle}.` : ""}`);
  }, [molKey]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {Object.entries(MOLECULES).map(([key, mol]) => (
          <button key={key} onClick={() => setMolKey(key)}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-all ${molKey === key ? "bg-green-600 text-white border-green-600" : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-green-300"}`}>
            {mol.formula}
          </button>
        ))}
      </div>

      <canvas ref={canvasRef} width={W} height={H}
        className="w-full rounded-2xl border border-gray-700 cursor-grab active:cursor-grabbing touch-none" />

      {/* Atom legend */}
      <div className="flex gap-4 flex-wrap">
        {MOLECULES[molKey].atoms.filter((a, i, arr) => arr.findIndex(b => b.symbol === a.symbol) === i).map(a => (
          <div key={a.symbol} className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full border border-gray-300" style={{ background: a.color }} />
            <span className="text-sm text-gray-600 dark:text-gray-400">{a.symbol} ({a.symbol === "O" ? "Oxygen" : a.symbol === "H" ? "Hydrogen" : a.symbol === "C" ? "Carbon" : a.symbol === "N" ? "Nitrogen" : a.symbol === "Na⁺" ? "Sodium" : a.symbol === "Cl⁻" ? "Chlorine" : a.symbol})</span>
          </div>
        ))}
      </div>

      <div className="text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-xl px-4 py-2">
        Drag to rotate the molecule in 3D. Ball-and-stick model: colored balls = atoms, gray sticks = bonds, double lines = double bonds.
      </div>
    </div>
  );
}
