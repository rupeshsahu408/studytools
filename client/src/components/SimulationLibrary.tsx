import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Atom, Beaker, FlaskConical, BookOpen, ChevronDown, ChevronRight,
  Play, X, Sparkles, Search, Filter, AlertCircle, Zap, ArrowLeft,
} from "lucide-react";
import { sendChatMessage } from "../lib/api";
import { fetchSimulationLibrary } from "../lib/api";

// ─── Engine Registry ──────────────────────────────────────────────────────
import ElectricFieldExplorer from "./simulations/engines/ElectricFieldExplorer";
import CoulombLab from "./simulations/engines/CoulombLab";
import GaussLawExplorer from "./simulations/engines/GaussLawExplorer";
import ChargeDistributions from "./simulations/engines/ChargeDistributions";
import ElectricDipole from "./simulations/engines/ElectricDipole";
import ImmersiveElectrostatics from "./simulations/engines/ImmersiveElectrostatics";

type EngineComponent = React.ComponentType<Record<string, any>>;

const ENGINE_REGISTRY: Record<string, EngineComponent> = {
  "electric-field-explorer": ElectricFieldExplorer,
  "coulomb-lab": CoulombLab,
  "gauss-law-explorer": GaussLawExplorer,
  "charge-distributions": ChargeDistributions,
  "electric-dipole": ElectricDipole,
  "immersive-electrostatics": ImmersiveElectrostatics,
};

const ENGINE_META: Record<string, { color: string; gradient: string; icon: string }> = {
  "electric-field-explorer": { color: "from-cyan-600 to-blue-700", gradient: "rgba(0,200,255,0.15)", icon: "⚡" },
  "coulomb-lab": { color: "from-orange-600 to-red-700", gradient: "rgba(255,100,0,0.15)", icon: "🔬" },
  "gauss-law-explorer": { color: "from-violet-600 to-purple-700", gradient: "rgba(150,80,255,0.15)", icon: "🌐" },
  "charge-distributions": { color: "from-emerald-600 to-teal-700", gradient: "rgba(0,200,150,0.15)", icon: "📡" },
  "electric-dipole": { color: "from-pink-600 to-rose-700", gradient: "rgba(255,80,150,0.15)", icon: "🧲" },
  "immersive-electrostatics": { color: "from-yellow-600 to-amber-700", gradient: "rgba(255,200,0,0.15)", icon: "🏭" },
};

const DIFFICULTY_COLOR: Record<string, string> = {
  easy: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
  medium: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
  hard: "bg-red-500/20 text-red-400 border border-red-500/30",
};

interface SimEntry {
  id: string;
  title: string;
  titleHindi: string;
  concept: string;
  biharBoardTopic: string;
  engine: string;
  params: Record<string, any>;
  difficulty: string;
  tags: string[];
  learningOutcome: string;
}

interface ChapterData {
  id: string;
  number: number;
  title: string;
  titleHindi: string;
  simulations: SimEntry[];
}

interface SubjectData {
  subject: string;
  label: string;
  labelHindi: string;
  classNum: number;
  chapters: ChapterData[];
}

interface ExplainState { loading: boolean; text: string; error: string }

interface SimulationLibraryProps {
  chapterText?: string;
  language: string;
  subject: string;
  onSimLaunched?: () => void;
}

const SUBJECT_ICONS: Record<string, string> = {
  physics: "⚡",
  chemistry: "🧪",
  biology: "🌿",
  mathematics: "📐",
};

const SUBJECT_COLORS: Record<string, string> = {
  physics: "from-cyan-500 to-blue-600",
  chemistry: "from-emerald-500 to-teal-600",
  biology: "from-green-500 to-lime-600",
  mathematics: "from-violet-500 to-purple-600",
};

export default function SimulationLibrary({
  chapterText = "",
  language,
  subject,
  onSimLaunched,
}: SimulationLibraryProps) {
  const [activeSubject, setActiveSubject] = useState("physics");
  const [subjectData, setSubjectData] = useState<SubjectData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedChapter, setExpandedChapter] = useState<string | null>("physics-12-ch1");
  const [activeSim, setActiveSim] = useState<SimEntry | null>(null);
  const [simContext, setSimContext] = useState("");
  const [explain, setExplain] = useState<ExplainState>({ loading: false, text: "", error: "" });
  const [search, setSearch] = useState("");
  const [filterDiff, setFilterDiff] = useState<string>("all");
  const calledLaunched = useRef(false);

  // Load subject data
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    fetchSimulationLibrary(activeSubject)
      .then((data) => {
        if (!cancelled) { setSubjectData(data.subject); setLoading(false); }
      })
      .catch(() => {
        if (!cancelled) { setError("Failed to load simulation library. Please try again."); setLoading(false); }
      });
    return () => { cancelled = true; };
  }, [activeSubject]);

  const handleLaunch = (sim: SimEntry) => {
    setActiveSim(sim);
    setSimContext("");
    setExplain({ loading: false, text: "", error: "" });
    if (onSimLaunched && !calledLaunched.current) {
      calledLaunched.current = true;
      onSimLaunched();
    }
  };

  const handleClose = () => {
    setActiveSim(null);
    setSimContext("");
    setExplain({ loading: false, text: "", error: "" });
  };

  const handleExplain = useCallback(async () => {
    if (!activeSim || explain.loading) return;
    setExplain({ loading: true, text: "", error: "" });
    try {
      const chapterName = subjectData?.chapters.find(ch =>
        ch.simulations.some(s => s.id === activeSim.id)
      )?.title || "Electric Charges and Fields";
      const query = language === "hindi"
        ? `इस simulation को हिंदी में समझाओ: "${activeSim.title}". यह concept है: ${activeSim.concept}. वर्तमान स्थिति: ${simContext}. इसे class 12 Bihar Board के छात्र के लिए सरल हिंदी में समझाओ, Bihar Board exam के लिए important points बताओ।`
        : `Explain this simulation: "${activeSim.title}". Concept: ${activeSim.concept}. Current state: ${simContext}. Explain for Class 12 Bihar Board student with key exam points.`;
      const data = await sendChatMessage(
        [{ role: "user", content: query }],
        chapterText || activeSim.concept,
        chapterName,
        activeSubject,
        language
      );
      setExplain({ loading: false, text: data.reply, error: "" });
    } catch {
      setExplain({ loading: false, text: "", error: "Could not get explanation. Try again." });
    }
  }, [activeSim, simContext, language, chapterText, activeSubject, explain.loading]);

  // ── Active Simulation View ───────────────────────────────────────────────
  if (activeSim) {
    const Engine = ENGINE_REGISTRY[activeSim.engine];
    const meta = ENGINE_META[activeSim.engine] || ENGINE_META["electric-field-explorer"];
    const chapterOfSim = subjectData?.chapters.find(ch => ch.simulations.some(s => s.id === activeSim.id));

    return (
      <div className="max-w-4xl">
        {/* Back button */}
        <button onClick={handleClose}
          className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors mb-5 group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Simulation Library
        </button>

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-start gap-3 min-w-0">
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${meta.color} flex items-center justify-center flex-shrink-0 text-xl shadow-lg`}>
              {meta.icon}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">{activeSim.title}</h2>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${DIFFICULTY_COLOR[activeSim.difficulty] || DIFFICULTY_COLOR.medium}`}>
                  {activeSim.difficulty}
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-snug">{activeSim.concept}</p>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="text-xs text-cyan-600 dark:text-cyan-400 flex items-center gap-1">
                  <BookOpen className="w-3 h-3" /> {activeSim.biharBoardTopic}
                </span>
                {chapterOfSim && (
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    Ch. {chapterOfSim.number}: {chapterOfSim.title}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={handleExplain}
            disabled={explain.loading}
            className="flex-shrink-0 flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 disabled:opacity-50 text-white font-semibold px-4 py-2.5 rounded-xl transition-all shadow-md text-sm">
            {explain.loading
              ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <Sparkles className="w-4 h-4" />}
            {explain.loading ? "Explaining..." : "Explain This"}
          </button>
        </div>

        {/* Simulation canvas */}
        <div className="bg-gray-950 border border-gray-800 rounded-2xl p-4 mb-4 shadow-xl">
          {Engine ? (
            <Engine
              {...activeSim.params}
              onContextChange={(ctx: string) => setSimContext(ctx)}
            />
          ) : (
            <div className="text-center py-16 text-gray-500">
              Engine "{activeSim.engine}" is not yet available.
            </div>
          )}
        </div>

        {/* Learning outcome */}
        <div className="bg-cyan-950/30 border border-cyan-900/30 rounded-xl px-4 py-3 mb-4">
          <p className="text-xs text-cyan-300">
            <span className="font-bold text-cyan-400">Learning Outcome: </span>
            {activeSim.learningOutcome}
          </p>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {activeSim.tags.map(tag => (
            <span key={tag} className="text-xs bg-gray-800 text-gray-400 px-2.5 py-1 rounded-full border border-gray-700">
              {tag}
            </span>
          ))}
        </div>

        {/* AI Explanation */}
        <AnimatePresence>
          {(explain.text || explain.error || explain.loading) && (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="bg-gray-900 border border-cyan-900/40 rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-cyan-900/40 rounded-full flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-cyan-400 mb-2">AI Explanation</p>
                  {explain.loading && (
                    <div className="flex gap-1.5 items-center">
                      {[0, 1, 2].map(i => (
                        <motion.div key={i} className="w-2 h-2 bg-cyan-400 rounded-full"
                          animate={{ y: [0, -5, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }} />
                      ))}
                    </div>
                  )}
                  {explain.text && (
                    <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{explain.text}</p>
                  )}
                  {explain.error && (
                    <div className="flex items-center gap-2 text-red-400 text-sm">
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

  // ── Library Browser ──────────────────────────────────────────────────────
  const filteredChapters = subjectData?.chapters.map(ch => ({
    ...ch,
    simulations: ch.simulations.filter(sim => {
      const matchSearch = !search ||
        sim.title.toLowerCase().includes(search.toLowerCase()) ||
        sim.concept.toLowerCase().includes(search.toLowerCase()) ||
        sim.biharBoardTopic.toLowerCase().includes(search.toLowerCase()) ||
        sim.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
      const matchDiff = filterDiff === "all" || sim.difficulty === filterDiff;
      return matchSearch && matchDiff;
    }),
  })).filter(ch => ch.simulations.length > 0);

  const totalSims = subjectData?.chapters.reduce((acc, ch) => acc + ch.simulations.length, 0) || 0;

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <span className="text-2xl">📚</span> Simulation Library
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">
            Pre-built chapter-wise interactive simulations — Class 12, Bihar Board / NCERT
          </p>
        </div>
        {totalSims > 0 && (
          <div className="text-right">
            <div className="text-2xl font-black text-cyan-400">{totalSims}</div>
            <div className="text-xs text-gray-500">simulations</div>
          </div>
        )}
      </div>

      {/* Subject tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {["physics", "chemistry", "biology", "mathematics"].map((subj) => (
          <button
            key={subj}
            onClick={() => { setActiveSubject(subj); setExpandedChapter(null); setSearch(""); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
              activeSubject === subj
                ? `bg-gradient-to-r ${SUBJECT_COLORS[subj]} text-white shadow-lg shadow-cyan-900/30`
                : "bg-gray-800/60 text-gray-400 hover:bg-gray-700/60 hover:text-gray-200"
            }`}>
            <span>{SUBJECT_ICONS[subj]}</span>
            {subj.charAt(0).toUpperCase() + subj.slice(1)}
            {activeSubject === subj && totalSims > 0 && (
              <span className="bg-white/20 text-white text-xs px-1.5 py-0.5 rounded-md font-bold">
                {totalSims}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search + Filter row */}
      {!loading && !error && subjectData && (
        <div className="flex gap-3 mb-5">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search simulations, concepts, topics..."
              className="w-full bg-gray-800 border border-gray-700 text-gray-200 placeholder-gray-500 text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-cyan-600 transition-colors"
            />
          </div>
          <div className="flex gap-1.5">
            {["all", "easy", "medium", "hard"].map(d => (
              <button key={d} onClick={() => setFilterDiff(d)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  filterDiff === d
                    ? d === "all" ? "bg-gray-600 text-white" : DIFFICULTY_COLOR[d]
                    : "bg-gray-800 text-gray-500 hover:bg-gray-700"
                }`}>
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-12 h-12 border-4 border-gray-700 border-t-cyan-500 rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading simulation library...</p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="text-center py-16">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-red-400 font-semibold mb-2">{error}</p>
          <button onClick={() => setActiveSubject(activeSubject)}
            className="text-sm text-gray-400 hover:text-white transition-colors">Try again</button>
        </div>
      )}

      {/* Empty state for subject */}
      {!loading && !error && subjectData && totalSims === 0 && (
        <div className="text-center py-20 bg-gray-900/40 rounded-2xl border border-gray-800">
          <span className="text-5xl block mb-4">{SUBJECT_ICONS[activeSubject]}</span>
          <h3 className="text-lg font-bold text-white mb-2">
            {activeSubject.charAt(0).toUpperCase() + activeSubject.slice(1)} simulations coming soon!
          </h3>
          <p className="text-sm text-gray-400 max-w-sm mx-auto">
            We're building 50+ immersive simulations per chapter for {activeSubject}. Physics is ready — try it!
          </p>
          <button onClick={() => setActiveSubject("physics")}
            className="mt-5 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm">
            Browse Physics Library ⚡
          </button>
        </div>
      )}

      {/* Chapter list */}
      {!loading && !error && filteredChapters && filteredChapters.length > 0 && (
        <div className="space-y-3">
          {filteredChapters.map((chapter) => {
            const isExpanded = expandedChapter === chapter.id;
            const simCount = chapter.simulations.length;

            return (
              <motion.div
                key={chapter.id}
                layout
                className="bg-gray-900/60 border border-gray-800 rounded-2xl overflow-hidden">

                {/* Chapter header */}
                <button
                  onClick={() => setExpandedChapter(isExpanded ? null : chapter.id)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-800/40 transition-colors group">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${SUBJECT_COLORS[activeSubject]} flex items-center justify-center font-black text-white flex-shrink-0 text-sm shadow-md`}>
                      {chapter.number}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-white text-base leading-snug">{chapter.title}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{chapter.titleHindi}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                    <div className="text-right">
                      <div className={`text-lg font-black ${simCount > 0 ? "text-cyan-400" : "text-gray-600"}`}>
                        {simCount}
                      </div>
                      <div className="text-xs text-gray-600">sims</div>
                    </div>
                    {simCount > 0 && (
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-gray-400 group-hover:text-white transition-colors">
                        <ChevronDown className="w-5 h-5" />
                      </motion.div>
                    )}
                  </div>
                </button>

                {/* Simulation grid */}
                <AnimatePresence>
                  {isExpanded && simCount > 0 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden">
                      <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {chapter.simulations.map((sim, i) => {
                          const meta = ENGINE_META[sim.engine] || ENGINE_META["electric-field-explorer"];
                          return (
                            <motion.div
                              key={sim.id}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.03 }}
                              onClick={() => handleLaunch(sim)}
                              className="group bg-gray-950/80 border border-gray-800 hover:border-cyan-800/60 rounded-xl p-4 cursor-pointer transition-all hover:shadow-lg hover:shadow-cyan-900/20"
                              style={{ background: `linear-gradient(135deg, #0a0f1a, ${meta.gradient})` }}>

                              <div className="flex items-start gap-3 mb-2">
                                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${meta.color} flex items-center justify-center text-sm flex-shrink-0 shadow-md group-hover:scale-110 transition-transform`}>
                                  {meta.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-sm font-bold text-white leading-snug line-clamp-2">{sim.title}</h4>
                                  <p className="text-xs text-cyan-500/80 mt-0.5 truncate">{sim.biharBoardTopic}</p>
                                </div>
                              </div>

                              <p className="text-xs text-gray-400 leading-relaxed mb-3 line-clamp-2">{sim.concept}</p>

                              <div className="flex items-center justify-between">
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${DIFFICULTY_COLOR[sim.difficulty] || DIFFICULTY_COLOR.medium}`}>
                                  {sim.difficulty}
                                </span>
                                <span className="flex items-center gap-1 text-xs font-bold text-cyan-400 group-hover:gap-2 transition-all">
                                  <Play className="w-3 h-3" /> Launch
                                  <ChevronRight className="w-3 h-3" />
                                </span>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Coming soon state for empty chapters */}
                {isExpanded && simCount === 0 && (
                  <div className="px-5 pb-5">
                    <div className="bg-gray-800/30 rounded-xl p-4 text-center">
                      <p className="text-xs text-gray-500">Simulations for this chapter are coming soon!</p>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* No search results */}
      {!loading && !error && search && filteredChapters && filteredChapters.length === 0 && (
        <div className="text-center py-16 bg-gray-900/40 rounded-2xl border border-gray-800">
          <Search className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 font-semibold mb-1">No results for "{search}"</p>
          <p className="text-sm text-gray-500">Try searching for a concept, topic, or Bihar Board keyword</p>
          <button onClick={() => setSearch("")} className="mt-4 text-sm text-cyan-400 hover:text-cyan-300 transition-colors">
            Clear search
          </button>
        </div>
      )}

      {/* Footer note */}
      {!loading && !error && totalSims > 0 && !search && (
        <div className="mt-5 bg-gray-900/40 border border-gray-800 rounded-xl px-4 py-3 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-gray-400">
            All simulations are pre-built and interactive — no AI needed to run them. Use <strong className="text-cyan-400">Explain This</strong> inside any simulation for an AI explanation in Hindi or English.
          </p>
        </div>
      )}
    </div>
  );
}
