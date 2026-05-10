import { useState } from "react";

interface Props {
  onContextChange?: (ctx: string) => void;
}

interface Element {
  symbol: string; name: string; atomicNum: number;
  group: number; period: number;
  atomicRadius: number;    // pm
  ionizationEnergy: number; // kJ/mol
  electronegativity: number; // Pauling scale
  electronAffinity: number; // kJ/mol (positive = exothermic)
}

// Key representative elements with accurate data
const ELEMENTS: Element[] = [
  { symbol: "H",  name: "Hydrogen",    atomicNum: 1,   group: 1,  period: 1, atomicRadius: 53,  ionizationEnergy: 1312, electronegativity: 2.20, electronAffinity: 73 },
  { symbol: "He", name: "Helium",      atomicNum: 2,   group: 18, period: 1, atomicRadius: 31,  ionizationEnergy: 2372, electronegativity: 0,    electronAffinity: 0 },
  { symbol: "Li", name: "Lithium",     atomicNum: 3,   group: 1,  period: 2, atomicRadius: 167, ionizationEnergy: 520,  electronegativity: 0.98, electronAffinity: 60 },
  { symbol: "Be", name: "Beryllium",   atomicNum: 4,   group: 2,  period: 2, atomicRadius: 112, ionizationEnergy: 900,  electronegativity: 1.57, electronAffinity: 0 },
  { symbol: "B",  name: "Boron",       atomicNum: 5,   group: 13, period: 2, atomicRadius: 87,  ionizationEnergy: 801,  electronegativity: 2.04, electronAffinity: 27 },
  { symbol: "C",  name: "Carbon",      atomicNum: 6,   group: 14, period: 2, atomicRadius: 77,  ionizationEnergy: 1086, electronegativity: 2.55, electronAffinity: 122 },
  { symbol: "N",  name: "Nitrogen",    atomicNum: 7,   group: 15, period: 2, atomicRadius: 75,  ionizationEnergy: 1402, electronegativity: 3.04, electronAffinity: 7 },
  { symbol: "O",  name: "Oxygen",      atomicNum: 8,   group: 16, period: 2, atomicRadius: 73,  ionizationEnergy: 1314, electronegativity: 3.44, electronAffinity: 141 },
  { symbol: "F",  name: "Fluorine",    atomicNum: 9,   group: 17, period: 2, atomicRadius: 64,  ionizationEnergy: 1681, electronegativity: 3.98, electronAffinity: 328 },
  { symbol: "Ne", name: "Neon",        atomicNum: 10,  group: 18, period: 2, atomicRadius: 58,  ionizationEnergy: 2081, electronegativity: 0,    electronAffinity: 0 },
  { symbol: "Na", name: "Sodium",      atomicNum: 11,  group: 1,  period: 3, atomicRadius: 190, ionizationEnergy: 496,  electronegativity: 0.93, electronAffinity: 53 },
  { symbol: "Mg", name: "Magnesium",   atomicNum: 12,  group: 2,  period: 3, atomicRadius: 160, ionizationEnergy: 738,  electronegativity: 1.31, electronAffinity: 0 },
  { symbol: "Al", name: "Aluminium",   atomicNum: 13,  group: 13, period: 3, atomicRadius: 143, ionizationEnergy: 577,  electronegativity: 1.61, electronAffinity: 43 },
  { symbol: "Si", name: "Silicon",     atomicNum: 14,  group: 14, period: 3, atomicRadius: 117, ionizationEnergy: 786,  electronegativity: 1.90, electronAffinity: 134 },
  { symbol: "P",  name: "Phosphorus",  atomicNum: 15,  group: 15, period: 3, atomicRadius: 110, ionizationEnergy: 1012, electronegativity: 2.19, electronAffinity: 72 },
  { symbol: "S",  name: "Sulfur",      atomicNum: 16,  group: 16, period: 3, atomicRadius: 104, ionizationEnergy: 1000, electronegativity: 2.58, electronAffinity: 200 },
  { symbol: "Cl", name: "Chlorine",    atomicNum: 17,  group: 17, period: 3, atomicRadius: 99,  ionizationEnergy: 1251, electronegativity: 3.16, electronAffinity: 349 },
  { symbol: "Ar", name: "Argon",       atomicNum: 18,  group: 18, period: 3, atomicRadius: 71,  ionizationEnergy: 1521, electronegativity: 0,    electronAffinity: 0 },
  { symbol: "K",  name: "Potassium",   atomicNum: 19,  group: 1,  period: 4, atomicRadius: 243, ionizationEnergy: 419,  electronegativity: 0.82, electronAffinity: 48 },
  { symbol: "Ca", name: "Calcium",     atomicNum: 20,  group: 2,  period: 4, atomicRadius: 194, ionizationEnergy: 590,  electronegativity: 1.00, electronAffinity: 2 },
  { symbol: "Cr", name: "Chromium",    atomicNum: 24,  group: 6,  period: 4, atomicRadius: 166, ionizationEnergy: 653,  electronegativity: 1.66, electronAffinity: 64 },
  { symbol: "Fe", name: "Iron",        atomicNum: 26,  group: 8,  period: 4, atomicRadius: 156, ionizationEnergy: 762,  electronegativity: 1.83, electronAffinity: 15 },
  { symbol: "Cu", name: "Copper",      atomicNum: 29,  group: 11, period: 4, atomicRadius: 145, ionizationEnergy: 745,  electronegativity: 1.90, electronAffinity: 119 },
  { symbol: "Zn", name: "Zinc",        atomicNum: 30,  group: 12, period: 4, atomicRadius: 142, ionizationEnergy: 906,  electronegativity: 1.65, electronAffinity: 0 },
  { symbol: "Br", name: "Bromine",     atomicNum: 35,  group: 17, period: 4, atomicRadius: 114, ionizationEnergy: 1140, electronegativity: 2.96, electronAffinity: 325 },
  { symbol: "Kr", name: "Krypton",     atomicNum: 36,  group: 18, period: 4, atomicRadius: 88,  ionizationEnergy: 1351, electronegativity: 3.00, electronAffinity: 0 },
  { symbol: "Rb", name: "Rubidium",    atomicNum: 37,  group: 1,  period: 5, atomicRadius: 265, ionizationEnergy: 403,  electronegativity: 0.82, electronAffinity: 47 },
  { symbol: "Sr", name: "Strontium",   atomicNum: 38,  group: 2,  period: 5, atomicRadius: 219, ionizationEnergy: 550,  electronegativity: 0.95, electronAffinity: 5 },
  { symbol: "I",  name: "Iodine",      atomicNum: 53,  group: 17, period: 5, atomicRadius: 133, ionizationEnergy: 1008, electronegativity: 2.66, electronAffinity: 295 },
  { symbol: "Xe", name: "Xenon",       atomicNum: 54,  group: 18, period: 5, atomicRadius: 108, ionizationEnergy: 1170, electronegativity: 2.60, electronAffinity: 0 },
];

type TrendKey = "atomicRadius" | "ionizationEnergy" | "electronegativity" | "electronAffinity";

const TRENDS: { key: TrendKey; label: string; unit: string; periodTrend: string; groupTrend: string; color: string }[] = [
  { key: "atomicRadius", label: "Atomic Radius", unit: "pm", periodTrend: "Decreases →", groupTrend: "Increases ↓", color: "#3b82f6" },
  { key: "ionizationEnergy", label: "Ionization Energy", unit: "kJ/mol", periodTrend: "Increases →", groupTrend: "Decreases ↓", color: "#ef4444" },
  { key: "electronegativity", label: "Electronegativity", unit: "(Pauling)", periodTrend: "Increases →", groupTrend: "Decreases ↓", color: "#f59e0b" },
  { key: "electronAffinity", label: "Electron Affinity", unit: "kJ/mol", periodTrend: "Generally increases →", groupTrend: "Decreases ↓", color: "#10b981" },
];

function heatColor(norm: number): string {
  // blue (0) → teal → green → yellow → orange → red (1)
  const colors = [
    [59, 130, 246],   // blue
    [6, 182, 212],    // teal
    [16, 185, 129],   // green
    [245, 158, 11],   // amber
    [239, 68, 68],    // red
  ];
  const idx = norm * (colors.length - 1);
  const lo = Math.floor(idx), hi = Math.min(colors.length - 1, lo + 1);
  const t = idx - lo;
  const r = Math.round(colors[lo][0] * (1 - t) + colors[hi][0] * t);
  const g = Math.round(colors[lo][1] * (1 - t) + colors[hi][1] * t);
  const b = Math.round(colors[lo][2] * (1 - t) + colors[hi][2] * t);
  return `rgb(${r},${g},${b})`;
}

// Periods 1-5, Groups 1-18 grid layout
function getGridPos(el: Element): { row: number; col: number } {
  const periodRow: Record<number, number> = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5 };
  const row = periodRow[el.period] || el.period;
  return { row, col: el.group };
}

export default function PeriodicTrends({ onContextChange }: Props) {
  const [trend, setTrend] = useState<TrendKey>("electronegativity");
  const [hovered, setHovered] = useState<Element | null>(null);

  const trendInfo = TRENDS.find(t => t.key === trend)!;

  // Normalize values for coloring
  const vals = ELEMENTS.map(e => e[trend]);
  const minVal = Math.min(...vals);
  const maxVal = Math.max(...vals);
  const normalize = (v: number) => maxVal === minVal ? 0.5 : (v - minVal) / (maxVal - minVal);

  // Build 5×18 grid (periods 1-5, groups 1-18)
  const grid: (Element | null)[][] = Array.from({ length: 5 }, () => Array(18).fill(null));
  for (const el of ELEMENTS) {
    const { row, col } = getGridPos(el);
    if (row >= 1 && row <= 5 && col >= 1 && col <= 18) {
      grid[row - 1][col - 1] = el;
    }
  }

  return (
    <div className="space-y-4">
      {/* Trend selector */}
      <div className="flex gap-2 flex-wrap">
        {TRENDS.map(t => (
          <button key={t.key} onClick={() => {
            setTrend(t.key);
            onContextChange?.(`Periodic Trend: ${t.label} (${t.unit}). Period trend: ${t.periodTrend}. Group trend: ${t.groupTrend}. Color scale: blue=low, red=high.`);
          }}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-all ${trend === t.key ? "text-white border-transparent" : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"}`}
            style={trend === t.key ? { backgroundColor: t.color } : {}}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Trend arrows */}
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
          <span>Period trend:</span>
          <span className="font-semibold" style={{ color: trendInfo.color }}>{trendInfo.periodTrend}</span>
        </div>
        <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
          <span>Group trend:</span>
          <span className="font-semibold" style={{ color: trendInfo.color }}>{trendInfo.groupTrend}</span>
        </div>
      </div>

      {/* Periodic table grid */}
      <div className="overflow-x-auto">
        <div className="inline-grid gap-1" style={{ gridTemplateColumns: `repeat(18, 38px)`, minWidth: "700px" }}>
          {grid.map((row, periodIdx) =>
            row.map((el, groupIdx) => {
              if (!el) {
                return <div key={`${periodIdx}-${groupIdx}`} className="w-9 h-9" />;
              }
              const norm = normalize(el[trend]);
              const bg = heatColor(norm);
              const val = el[trend];
              const isHov = hovered?.atomicNum === el.atomicNum;
              return (
                <div
                  key={el.atomicNum}
                  className="w-9 h-9 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all relative"
                  style={{
                    background: bg,
                    opacity: 0.85 + norm * 0.15,
                    transform: isHov ? "scale(1.3)" : "scale(1)",
                    zIndex: isHov ? 20 : 1,
                    boxShadow: isHov ? "0 4px 12px rgba(0,0,0,0.3)" : "none",
                  }}
                  onMouseEnter={() => {
                    setHovered(el);
                    onContextChange?.(`${el.name} (${el.symbol}, Z=${el.atomicNum}): ${trendInfo.label} = ${val} ${trendInfo.unit}. Period ${el.period}, Group ${el.group}.`);
                  }}
                  onMouseLeave={() => setHovered(null)}>
                  <span className="text-white font-bold leading-none" style={{ fontSize: "11px" }}>{el.symbol}</span>
                  <span className="text-white/80 leading-none" style={{ fontSize: "8px" }}>{val > 0 ? val.toFixed(trend === "electronegativity" ? 2 : 0) : "-"}</span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Hovered element info */}
      {hovered && (
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl flex flex-col items-center justify-center flex-shrink-0 text-white font-bold"
            style={{ background: heatColor(normalize(hovered[trend])) }}>
            <span className="text-xl leading-none">{hovered.symbol}</span>
            <span className="text-xs font-normal leading-none mt-0.5">{hovered.atomicNum}</span>
          </div>
          <div className="flex-1">
            <p className="font-bold text-gray-900 dark:text-white">{hovered.name}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Period {hovered.period}, Group {hovered.group}</p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 mt-2 text-sm">
              {TRENDS.map(t => (
                <div key={t.key} className="flex items-center gap-1.5">
                  <span className="text-gray-400">{t.label.split(" ")[0]}:</span>
                  <span className="font-bold" style={{ color: t.color }}>
                    {hovered[t.key] > 0 ? `${hovered[t.key]} ${t.unit}` : "—"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Color legend */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-500 dark:text-gray-400">Low</span>
        <div className="flex-1 h-3 rounded-full" style={{
          background: "linear-gradient(to right, rgb(59,130,246), rgb(6,182,212), rgb(16,185,129), rgb(245,158,11), rgb(239,68,68))"
        }} />
        <span className="text-xs text-gray-500 dark:text-gray-400">High</span>
        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 ml-1">{trendInfo.unit}</span>
      </div>

      <div className="text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-xl px-4 py-2">
        Showing representative elements (periods 1–5). Hover any element for full data. Color scale: blue=lowest value, red=highest value.
      </div>
    </div>
  );
}
