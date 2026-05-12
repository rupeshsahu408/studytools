import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Beaker, Zap, Waves, Eye, Lightbulb, Magnet, FlaskConical,
  Atom, BarChart2, Battery, X, Sparkles, ChevronRight,
  Play, BookOpen, AlertCircle, Library,
} from "lucide-react";
import { sendChatMessage } from "../lib/api";
import type { SimulationEntry } from "../lib/firestore";
import SimulationLibrary from "./SimulationLibrary";

// ─── Simulation Component Registry ────────────────────────────────────────
import ProjectileMotion from "./simulations/ProjectileMotion";
import SimpleHarmonicMotion from "./simulations/SimpleHarmonicMotion";
import ElectricField from "./simulations/ElectricField";
import WaveInterference from "./simulations/WaveInterference";
import LensOptics from "./simulations/LensOptics";
import OhmsLaw from "./simulations/OhmsLaw";
import MagneticField from "./simulations/MagneticField";
import AtomicOrbitals from "./simulations/AtomicOrbitals";
import MolecularStructure from "./simulations/MolecularStructure";
import PeriodicTrends from "./simulations/PeriodicTrends";
import ElectrochemicalCell from "./simulations/ElectrochemicalCell";

const SIM_REGISTRY: Record<string, {
  component: React.ComponentType<{ onContextChange?: (ctx: string) => void }>;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
}> = {
  "projectile-motion":      { component: ProjectileMotion,       icon: Zap,          color: "#16a34a", bgColor: "bg-green-50 dark:bg-green-900/20" },
  "simple-harmonic-motion": { component: SimpleHarmonicMotion,   icon: Waves,        color: "#6366f1", bgColor: "bg-indigo-50 dark:bg-indigo-900/20" },
  "electric-field":         { component: ElectricField,          icon: Zap,          color: "#dc2626", bgColor: "bg-red-50 dark:bg-red-900/20" },
  "wave-interference":      { component: WaveInterference,       icon: Waves,        color: "#0891b2", bgColor: "bg-cyan-50 dark:bg-cyan-900/20" },
  "lens-optics":            { component: LensOptics,             icon: Eye,          color: "#1d4ed8", bgColor: "bg-blue-50 dark:bg-blue-900/20" },
  "ohms-law":               { component: OhmsLaw,                icon: Lightbulb,    color: "#d97706", bgColor: "bg-amber-50 dark:bg-amber-900/20" },
  "magnetic-field":         { component: MagneticField,          icon: Magnet,       color: "#7c3aed", bgColor: "bg-violet-50 dark:bg-violet-900/20" },
  "atomic-orbitals":        { component: AtomicOrbitals,         icon: Atom,         color: "#0891b2", bgColor: "bg-sky-50 dark:bg-sky-900/20" },
  "molecular-structure":    { component: MolecularStructure,     icon: FlaskConical, color: "#059669", bgColor: "bg-emerald-50 dark:bg-emerald-900/20" },
  "periodic-trends":        { component: PeriodicTrends,         icon: BarChart2,    color: "#7c3aed", bgColor: "bg-purple-50 dark:bg-purple-900/20" },
  "electrochemical-cell":   { component: ElectrochemicalCell,    icon: Battery,      color: "#16a34a", bgColor: "bg-green-50 dark:bg-green-900/20" },
};

const DIFFICULTY_STYLES: Record<string, string> = {
  easy:   "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
  medium: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
  hard:   "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
};

interface SimulationsViewProps {
  simulations: SimulationEntry[];
  chapterName: string;
  subject: string;
  language: string;
  chapterText: string;
  onSimLaunched?: () => void;
}

interface ExplainState {
  loading: boolean;
  text: string;
  error: string;
}

type ViewMode = "chapter" | "library";

export default function SimulationsView({
  simulations, chapterName, subject, language, chapterText, onSimLaunched,
}: SimulationsViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("chapter");
  const [activeSim, setActiveSim] = useState<SimulationEntry | null>(null);
  const [simContext, setSimContext] = useState<string>("");
  const [explain, setExplain] = useState<ExplainState>({ loading: false, text: "", error: "" });
  const calledLaunched = useRef(false);

  const available = simulations.filter(s => SIM_REGISTRY[s.id]);

  const handleExplain = useCallback(async () => {
    if (!activeSim || explain.loading) return;
    setExplain({ loading: true, text: "", error: "" });
    try {
      const query = language === "hindi"
        ? `इस simulation को हिंदी में समझाओ: ${activeSim.title}. वर्तमान स्थिति: ${simContext}. इसे class 11-12 Bihar Board के छात्र के लिए आसान भाषा में explain करो।`
        : `Explain what is happening in this simulation: ${activeSim.title}. Current state: ${simContext}. Explain for a Class 11-12 Bihar Board student in simple language.`;
      const data = await sendChatMessage(
        [{ role: "user", content: query }],
        chapterText, chapterName, subject, language
      );
      setExplain({ loading: false, text: data.reply, error: "" });
    } catch {
      setExplain({ loading: false, text: "", error: "Could not get explanation. Please try again." });
    }
  }, [activeSim, simContext, language, chapterText, chapterName, subject, explain.loading]);

  const handleContextChange = useCallback((ctx: string) => setSimContext(ctx), []);

  const handleLaunch = (sim: SimulationEntry) => {
    setActiveSim(sim);
    setExplain({ loading: false, text: "", error: "" });
    setSimContext("");
    if (onSimLaunched && !calledLaunched.current) {
      calledLaunched.current = true;
      onSimLaunched();
    }
  };

  const handleClose = () => {
    setActiveSim(null);
    setExplain({ loading: false, text: "", error: "" });
    setSimContext("");
  };

  // ── Tab bar (always visible unless active sim is open) ──────────────────
  const TabBar = () => (
    <div className="flex gap-2 mb-6">
      <button
        onClick={() => { setViewMode("chapter"); handleClose(); }}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
          viewMode === "chapter"
            ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-900/30"
            : "bg-gray-800/60 text-gray-400 hover:bg-gray-700/60 hover:text-gray-200"
        }`}>
        <Beaker className="w-4 h-4" />
        Chapter Simulations
        {available.length > 0 && (
          <span className={`text-xs px-1.5 py-0.5 rounded-md font-bold ${viewMode === "chapter" ? "bg-white/20" : "bg-gray-700 text-gray-400"}`}>
            {available.length}
          </span>
        )}
      </button>
      <button
        onClick={() => { setViewMode("library"); handleClose(); }}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
          viewMode === "library"
            ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-900/30"
            : "bg-gray-800/60 text-gray-400 hover:bg-gray-700/60 hover:text-gray-200"
        }`}>
        <Library className="w-4 h-4" />
        Simulation Library
        <span className={`text-xs px-1.5 py-0.5 rounded-md font-bold ${viewMode === "library" ? "bg-white/20 text-white" : "bg-cyan-900/40 text-cyan-400"}`}>
          52+
        </span>
      </button>
    </div>
  );

  // ── Library mode ────────────────────────────────────────────────────────
  if (viewMode === "library") {
    return (
      <div>
        <TabBar />
        <SimulationLibrary
          chapterText={chapterText}
          language={language}
          subject={subject}
          onSimLaunched={onSimLaunched}
        />
      </div>
    );
  }

  // ── Active Chapter Simulation ───────────────────────────────────────────
  if (activeSim) {
    const reg = SIM_REGISTRY[activeSim.id];
    if (!reg) return null;
    const SimComponent = reg.component;
    const Icon = reg.icon;

    return (
      <div className="max-w-4xl">
        <div className="mb-5">
          <TabBar />
          <button onClick={handleClose}
            className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors">
            <X className="w-4 h-4" /> Back to Catalog
          </button>
        </div>

        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${reg.bgColor}`}>
              <Icon className="w-5 h-5" style={{ color: reg.color }} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{activeSim.title}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{activeSim.description}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${DIFFICULTY_STYLES[activeSim.difficulty] || DIFFICULTY_STYLES.medium}`}>
                  {activeSim.difficulty}
                </span>
                {activeSim.topic && (
                  <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                    <BookOpen className="w-3 h-3" /> {activeSim.topic}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button onClick={handleExplain} disabled={explain.loading}
            className="flex-shrink-0 flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 text-white font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm text-sm">
            {explain.loading
              ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <Sparkles className="w-4 h-4" />}
            {explain.loading ? "Explaining..." : "Explain This"}
          </button>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 mb-4">
          <SimComponent onContextChange={handleContextChange} />
        </div>

        <AnimatePresence>
          {(explain.text || explain.error || explain.loading) && (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="bg-white dark:bg-gray-900 border border-green-100 dark:border-green-900 rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-green-700 dark:text-green-400 mb-2">AI Explanation</p>
                  {explain.loading && (
                    <div className="flex gap-1.5 items-center">
                      {[0, 1, 2].map(i => (
                        <motion.div key={i} className="w-2 h-2 bg-green-400 rounded-full"
                          animate={{ y: [0, -5, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }} />
                      ))}
                    </div>
                  )}
                  {explain.text && (
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{explain.text}</p>
                  )}
                  {explain.error && (
                    <div className="flex items-center gap-2 text-red-500 dark:text-red-400 text-sm">
                      <AlertCircle className="w-4 h-4" /> {explain.error}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ── Chapter Simulation Catalog ──────────────────────────────────────────
  return (
    <div className="max-w-3xl">
      <TabBar />

      {available.length === 0 ? (
        <div className="text-center py-16 max-w-md mx-auto">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Beaker className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No Chapter Simulations</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
            No AI-picked simulations for this chapter. Browse the Simulation Library for 50+ pre-built simulations!
          </p>
          <button onClick={() => setViewMode("library")}
            className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm flex items-center gap-2 mx-auto">
            <Library className="w-4 h-4" /> Open Simulation Library
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Beaker className="w-5 h-5 text-green-600" /> Chapter Simulations
              <span className="text-sm font-normal text-gray-400 ml-1">{available.length} available</span>
            </h2>
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
            AI has identified the following simulations relevant to <strong>{chapterName}</strong>. Launch any simulation, then tap <strong>"Explain This"</strong> for an AI explanation.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {available.map((sim, i) => {
              const reg = SIM_REGISTRY[sim.id];
              if (!reg) return null;
              const Icon = reg.icon;
              return (
                <motion.div key={sim.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="group bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:border-green-200 dark:hover:border-green-800 rounded-2xl p-5 cursor-pointer transition-all hover:shadow-md"
                  onClick={() => handleLaunch(sim)}>
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${reg.bgColor} group-hover:scale-110 transition-transform`}>
                      <Icon className="w-5 h-5" style={{ color: reg.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-snug">{sim.title}</h3>
                      {sim.topic && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">{sim.topic}</p>}
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed mb-4">{sim.description}</p>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${DIFFICULTY_STYLES[sim.difficulty] || DIFFICULTY_STYLES.medium}`}>
                      {sim.difficulty}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-semibold text-green-600 dark:text-green-400 group-hover:gap-2 transition-all">
                      <Play className="w-3.5 h-3.5" /> Launch <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="mt-5 bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800/30 rounded-xl px-4 py-3 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Each simulation has real-time controls. Use <strong>Explain This</strong> for AI explanation in Hindi or English. 
              Want more? <button onClick={() => setViewMode("library")} className="text-cyan-500 hover:text-cyan-400 font-bold underline-offset-2 hover:underline">Open the Simulation Library</button> with 52+ pre-built simulations!
            </p>
          </div>
        </>
      )}
    </div>
  );
}
