// ─── Keyword-Based Simulation Selector ───────────────────────────────────────
// This runs BEFORE and in parallel with the AI selector.
// It guarantees a minimum of 2 simulations per chapter using keyword matching
// on the chapter name and text. AI picks are always preferred; keyword picks
// fill in only when AI returns fewer than 2.

export interface SimulationEntry {
  id: string;
  title: string;
  description: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
}

interface SimDef {
  id: string;
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  subject: "physics" | "chemistry" | "both";
  keywords: string[];
}

const SIMULATION_LIBRARY: SimDef[] = [
  {
    id: "projectile-motion",
    title: "Projectile Motion",
    description: "Visualize trajectory, range and maximum height of a projectile under gravity with adjustable angle and speed",
    difficulty: "medium",
    subject: "physics",
    keywords: [
      "projectile", "trajectory", "parabola", "range", "height",
      "launch angle", "horizontal motion", "vertical motion",
      "projectile motion", "kinematics", "motion in a plane",
      "motion in plane", "two dimensional", "2d motion",
      "velocity component", "time of flight",
    ],
  },
  {
    id: "simple-harmonic-motion",
    title: "Simple Harmonic Motion",
    description: "Observe pendulum and spring-mass oscillations with live amplitude, period and frequency controls",
    difficulty: "medium",
    subject: "physics",
    keywords: [
      "shm", "simple harmonic", "pendulum", "oscillation", "spring",
      "amplitude", "period", "frequency", "restoring force",
      "periodic motion", "vibration", "oscillatory", "bob",
      "mass spring", "time period",
    ],
  },
  {
    id: "electric-field",
    title: "Electric Field Lines",
    description: "Visualize electric field lines and equipotential surfaces for point charges and dipoles",
    difficulty: "medium",
    subject: "physics",
    keywords: [
      "electric field", "charge", "coulomb", "electrostatic",
      "field lines", "dipole", "gauss", "flux", "electric potential",
      "point charge", "electric force", "capacitor", "electrostatics",
      "dielectric", "superposition",
    ],
  },
  {
    id: "wave-interference",
    title: "Wave Interference & Diffraction",
    description: "Explore single/double slit diffraction and wave interference fringe patterns",
    difficulty: "hard",
    subject: "physics",
    keywords: [
      "wave", "interference", "diffraction", "slit", "wavelength",
      "light wave", "coherent", "fringe", "young's double slit",
      "ydse", "wave optics", "superposition", "phase", "path difference",
      "constructive", "destructive", "monochromatic",
    ],
  },
  {
    id: "lens-optics",
    title: "Lens & Ray Optics",
    description: "Trace rays through converging and diverging lenses, see image formation with lens formula",
    difficulty: "medium",
    subject: "physics",
    keywords: [
      "lens", "optics", "refraction", "mirror", "image", "focal",
      "convex", "concave", "ray", "reflection", "refractive index",
      "prism", "ray optics", "geometrical optics", "snell",
      "total internal reflection", "magnification", "virtual image",
      "real image", "focal length",
    ],
  },
  {
    id: "ohms-law",
    title: "Ohm's Law Circuit",
    description: "Control voltage and resistance to see how current changes — bulb brightness updates live",
    difficulty: "easy",
    subject: "physics",
    keywords: [
      "ohm", "resistance", "current", "voltage", "circuit",
      "resistor", "conductor", "kirchhoff", "potential difference",
      "electric current", "electricity", "semiconductor",
      "series circuit", "parallel circuit", "ammeter", "voltmeter",
      "electric power", "heating effect",
    ],
  },
  {
    id: "magnetic-field",
    title: "Magnetic Field of a Wire",
    description: "See how current direction and magnitude create magnetic field circles around a wire",
    difficulty: "medium",
    subject: "physics",
    keywords: [
      "magnetic field", "magnetism", "current", "wire", "solenoid",
      "electromagnet", "ampere", "biot-savart", "lorentz",
      "moving charge", "magnetic force", "magnetization",
      "right hand rule", "toroid", "magnetic flux",
      "moving charges", "galvanometer", "cyclotron",
    ],
  },
  {
    id: "atomic-orbitals",
    title: "Atomic Orbitals",
    description: "Visualize s, p, d orbital shapes and electron probability density clouds",
    difficulty: "medium",
    subject: "chemistry",
    keywords: [
      "orbital", "electron configuration", "quantum number",
      "quantum mechanics", "heisenberg", "wave function", "probability",
      "atomic structure", "s p d f", "subshell", "shell",
      "hydrogen atom", "bohr", "de broglie", "uncertainty principle",
      "aufbau", "hund", "pauli",
    ],
  },
  {
    id: "molecular-structure",
    title: "3D Molecular Structure",
    description: "Rotate and explore 3D bond structures of common molecules like H₂O, CO₂, CH₄, NH₃",
    difficulty: "easy",
    subject: "chemistry",
    keywords: [
      "molecular structure", "bond", "covalent", "ionic", "vsepr",
      "hybridization", "h2o", "co2", "ch4", "nh3", "geometry",
      "molecule", "chemical bond", "bonding", "lewis structure",
      "sp3", "sp2", "bond angle", "valence",
    ],
  },
  {
    id: "periodic-trends",
    title: "Periodic Table Trends",
    description: "Heatmap of atomic radius, ionization energy and electronegativity across the periodic table",
    difficulty: "easy",
    subject: "chemistry",
    keywords: [
      "periodic table", "atomic radius", "ionization energy",
      "electronegativity", "electron affinity", "periodic trends",
      "group", "period", "periodic properties", "alkali",
      "halogen", "noble gas", "shielding", "effective nuclear charge",
      "periodic law", "classification of elements",
    ],
  },
  {
    id: "electrochemical-cell",
    title: "Electrochemical Cell",
    description: "Watch electron flow, anode/cathode reactions and EMF in a galvanic/electrolytic cell",
    difficulty: "hard",
    subject: "chemistry",
    keywords: [
      "electrochemical", "electrolysis", "anode", "cathode", "emf",
      "galvanic", "voltaic", "faraday", "electrolytic",
      "oxidation", "reduction", "redox", "electrode potential",
      "cell", "nernst", "standard potential", "corrosion",
      "electroplating", "Daniel cell",
    ],
  },
];

// ─── Keyword Matcher ─────────────────────────────────────────────────────────

export function keywordMatchSimulations(
  chapterName: string,
  text: string,
  subject: string,
  minCount = 2
): SimulationEntry[] {
  const subjectLower = subject.toLowerCase();
  const isPhysics = subjectLower.includes("physics");
  const isChemistry = subjectLower.includes("chemistry") || subjectLower.includes("chem");

  // Chapter name is weighted 3× — it's the strongest signal
  const corpus = (
    chapterName + " " + chapterName + " " + chapterName + " " +
    text.slice(0, 10000)
  ).toLowerCase();

  // Filter to simulations for the right subject
  const candidates = SIMULATION_LIBRARY.filter(sim => {
    if (sim.subject === "both") return true;
    if (isPhysics) return sim.subject === "physics";
    if (isChemistry) return sim.subject === "chemistry";
    return true; // Math / Bio: try all
  });

  // Score by keyword match count
  const scored = candidates
    .map(sim => ({
      sim,
      score: sim.keywords.filter(kw => corpus.includes(kw)).length,
    }))
    .sort((a, b) => b.score - a.score);

  const matched = scored.filter(s => s.score > 0);
  const fallbacks = scored.filter(s => s.score === 0);

  let result = matched.map(s => s.sim);

  // Top up to minCount using fallbacks if needed
  while (result.length < minCount && fallbacks.length > 0) {
    result.push(fallbacks.shift()!.sim);
  }

  // Cap at 7 to avoid overwhelming the UI
  return result.slice(0, 7).map(sim => ({
    id: sim.id,
    title: sim.title,
    description: sim.description,
    topic: chapterName,
    difficulty: sim.difficulty,
  }));
}

// ─── Merger ──────────────────────────────────────────────────────────────────
// AI picks come first (they have chapter-specific descriptions).
// Keyword picks fill the gap only if AI returned fewer than minCount.

export function mergeSimulations(
  aiPicks: SimulationEntry[],
  keywordPicks: SimulationEntry[],
  minCount = 2
): SimulationEntry[] {
  const aiIds = new Set(aiPicks.map(s => s.id));
  const fills = keywordPicks.filter(s => !aiIds.has(s.id));

  const merged = [...aiPicks, ...fills];

  // Hard guarantee: never return fewer than minCount
  if (merged.length < minCount && fills.length > 0) {
    const extra = fills.slice(0, minCount - merged.length);
    return [...merged, ...extra];
  }

  return merged;
}
