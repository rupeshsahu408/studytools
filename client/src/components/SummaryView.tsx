import { useState, useRef } from "react";
import {
  Zap, Clock, ChevronDown, ChevronUp, Star,
  BookOpen, Target, Brain, CheckCircle2, AlertCircle,
  TrendingUp, Flame, Eye, Award, List, Sparkles,
  Download, RefreshCw, AlertTriangle, X,
} from "lucide-react";
import { exportSummaryPDF } from "../lib/pdfExport";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Concept {
  id: string;
  title: string;
  explanation: string;
  keyFormula: string | null;
  examWeight: "high" | "medium" | "low";
}

interface FormulaItem {
  formula: string;
  context: string;
}

interface ExamSpotlight {
  highValueTopics: string[];
  questionPatterns: string[];
  mustMemorize: string[];
}

interface Summary {
  chapterEssence: string;
  readTime: number;
  concepts: Concept[];
  formulaSnapshot: FormulaItem[];
  examSpotlight: ExamSpotlight;
  lastNightRevision: string[];
}

interface SummaryViewProps {
  summary: Summary;
  chapterName: string;
  subject: string;
  classNum?: string;
  onRegenerate?: () => void;
  regenerating?: boolean;
}

// ── Weight config ─────────────────────────────────────────────────────────────

const WEIGHT = {
  high: {
    label: "High Priority",
    card: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/60",
    dot: "bg-red-500",
    badge: "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400",
    formula: "bg-white dark:bg-gray-900 border-red-200 dark:border-red-800/40",
  },
  medium: {
    label: "Medium Priority",
    card: "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/50",
    dot: "bg-amber-400",
    badge: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400",
    formula: "bg-white dark:bg-gray-900 border-amber-200 dark:border-amber-800/40",
  },
  low: {
    label: "Good to Know",
    card: "bg-gray-50 dark:bg-gray-800/30 border-gray-200 dark:border-gray-700/60",
    dot: "bg-gray-400",
    badge: "bg-gray-100 dark:bg-gray-700/60 text-gray-600 dark:text-gray-400",
    formula: "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700",
  },
};

// ── Concept Card ──────────────────────────────────────────────────────────────

function ConceptCard({ concept, index }: { concept: Concept; index: number }) {
  const [open, setOpen] = useState(index < 4);
  const w = WEIGHT[concept.examWeight] || WEIGHT.medium;

  return (
    <div
      className={`rounded-2xl border overflow-hidden ${w.card}`}
    >
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-start gap-3 px-4 py-3.5 text-left group summary-print-hide-chevron"
      >
        <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${w.dot}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-gray-900 dark:text-white leading-snug">
              {concept.title}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wide ${w.badge}`}>
              {w.label}
            </span>
          </div>
          {!open && concept.keyFormula && (
            <p className="text-xs text-gray-400 dark:text-gray-500 font-mono mt-0.5 truncate summary-print-hide">
              {concept.keyFormula}
            </p>
          )}
        </div>
        <span className="flex-shrink-0 text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors mt-0.5 summary-print-hide">
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </button>

      {/* Always rendered — shown via CSS on print even if open=false */}
      <div className="concept-card-body" style={open ? {} : { display: "none" }}>
        <div className="px-4 pb-4 space-y-3 pt-0.5">
          <p className="text-[0.85rem] text-gray-700 dark:text-gray-300 leading-relaxed">
            {concept.explanation}
          </p>
          {concept.keyFormula && (
            <div className={`inline-flex items-center gap-2 border rounded-xl px-3 py-1.5 ${w.formula}`}>
              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Formula</span>
              <span className="text-sm font-bold text-green-700 dark:text-green-400 font-mono">
                {concept.keyFormula}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Hidden collapsed body — only shown during print */}
      {!open && (
        <div className="concept-card-body" style={{ display: "none" }}>
          <div className="px-4 pb-4 space-y-3 pt-0.5">
            <p className="text-[0.85rem] text-gray-700 leading-relaxed">
              {concept.explanation}
            </p>
            {concept.keyFormula && (
              <div className="inline-flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-1.5 bg-white">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Formula</span>
                <span className="text-sm font-bold text-green-700 font-mono">{concept.keyFormula}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function SummaryView({ summary, chapterName, subject, classNum = "11", onRegenerate, regenerating }: SummaryViewProps) {
  const [checkedPoints, setCheckedPoints] = useState<Set<number>>(new Set());
  const [revisionComplete, setRevisionComplete] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [confirmRegen, setConfirmRegen] = useState(false);
  const printAreaRef = useRef<HTMLDivElement>(null);

  const togglePoint = (i: number) => {
    setCheckedPoints(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const handlePrint = () => {
    setPrinting(true);
    try {
      exportSummaryPDF(summary, { chapterName, subject, classNum });
    } finally {
      setTimeout(() => setPrinting(false), 600);
    }
  };

  const handleRegenerate = () => {
    setConfirmRegen(false);
    onRegenerate?.();
  };

  const totalPoints = summary.lastNightRevision?.length || 0;
  const allChecked = checkedPoints.size === totalPoints && totalPoints > 0;

  // Sort: high → medium → low
  const sortedConcepts = [...(summary.concepts || [])].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return (order[a.examWeight] ?? 1) - (order[b.examWeight] ?? 1);
  });

  const highCount = sortedConcepts.filter(c => c.examWeight === "high").length;

  return (
    <div id="summary-print-area" ref={printAreaRef}
      className="max-w-3xl mx-auto px-1 sm:px-4 py-5 space-y-5 pb-20">

      {/* ── Hero Header ──────────────────────────────────────────────────── */}
      <div
        className="relative bg-gradient-to-br from-green-600 via-green-600 to-emerald-700 rounded-3xl p-6 text-white overflow-hidden shadow-lg shadow-green-900/20"
      >
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-44 h-44 bg-white/5 rounded-full -translate-y-14 translate-x-12 pointer-events-none" />
        <div className="absolute bottom-0 left-8 w-20 h-20 bg-white/5 rounded-full translate-y-8 pointer-events-none" />

        <div className="relative">
          {/* Top row: badge + action buttons */}
          <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
            <div className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1">
              <Zap className="w-3 h-3 text-green-200" />
              <span className="text-xs font-bold text-white uppercase tracking-widest">One-Shot Revision</span>
            </div>

            <div className="summary-print-hide flex items-center gap-2">
              {/* ── Regenerate Button ── */}
              {onRegenerate && (
                <button
                  onClick={() => setConfirmRegen(true)}
                  disabled={regenerating || printing}
                  className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 active:bg-white/25 border border-white/15 rounded-full px-3 py-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Regenerate summary"
                >
                  <RefreshCw className={`w-3 h-3 text-green-200 ${regenerating ? "animate-spin" : ""}`} />
                  <span className="text-xs font-semibold text-white">
                    {regenerating ? "Regenerating…" : "Regenerate"}
                  </span>
                </button>
              )}

              {/* ── Download / Print Button ── */}
              <button
                onClick={handlePrint}
                disabled={printing || regenerating}
                className="inline-flex items-center gap-1.5 bg-white/15 hover:bg-white/25 active:bg-white/30 border border-white/20 rounded-full px-3 py-1.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                title="Save as PDF"
              >
                {printing ? (
                  <span className="w-3 h-3 border border-white/50 border-t-white rounded-full animate-spin" />
                ) : (
                  <Download className="w-3 h-3 text-white" />
                )}
                <span className="text-xs font-semibold text-white">
                  {printing ? "Opening…" : "Save PDF"}
                </span>
              </button>
            </div>
          </div>

          {/* ── Regenerate confirmation overlay ── */}
          
            {confirmRegen && (
              <div
                className="summary-print-hide absolute inset-x-4 top-4 z-10 bg-gray-900/95 backdrop-blur-sm border border-white/15 rounded-2xl p-4 shadow-xl"
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-8 h-8 bg-amber-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white mb-0.5">Regenerate Summary?</p>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      The AI will create a completely new summary for this chapter. Your current summary will be replaced. This takes 20–40 seconds.
                    </p>
                  </div>
                  <button
                    onClick={() => setConfirmRegen(false)}
                    className="flex-shrink-0 text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setConfirmRegen(false)}
                    className="text-xs font-semibold text-gray-400 hover:text-white px-3 py-1.5 rounded-xl border border-white/10 hover:border-white/20 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRegenerate}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-green-600 hover:bg-green-500 px-4 py-1.5 rounded-xl transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Yes, Regenerate
                  </button>
                </div>
              </div>
            )}
          

          <h1 className="text-[1.25rem] font-black text-white leading-tight mb-1">{chapterName}</h1>
          <p className="text-sm text-green-200 mb-5">{subject} · Bihar Board</p>

          {/* Stats row */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1 border border-white/10">
              <Clock className="w-3 h-3 text-green-200" />
              <span className="text-xs font-semibold text-white">{summary.readTime || 6} min read</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1 border border-white/10">
              <BookOpen className="w-3 h-3 text-green-200" />
              <span className="text-xs font-semibold text-white">{sortedConcepts.length} concepts</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1 border border-white/10">
              <Star className="w-3 h-3 text-green-200" />
              <span className="text-xs font-semibold text-white">{summary.formulaSnapshot?.length || 0} formulas</span>
            </div>
            {highCount > 0 && (
              <div className="flex items-center gap-1.5 bg-red-500/30 rounded-full px-3 py-1 border border-red-400/30">
                <Flame className="w-3 h-3 text-red-200" />
                <span className="text-xs font-semibold text-white">{highCount} high-priority</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Chapter Essence ──────────────────────────────────────────────── */}
      {summary.chapterEssence && (
        <div
          className="flex gap-3 bg-blue-50 dark:bg-blue-950/25 border border-blue-200 dark:border-blue-800/60 rounded-2xl p-4"
        >
          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
            <Brain className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1.5">Chapter Essence</p>
            <p className="text-[0.875rem] text-gray-800 dark:text-gray-200 leading-relaxed">
              {summary.chapterEssence}
            </p>
          </div>
        </div>
      )}

      {/* ── Key Concepts ─────────────────────────────────────────────────── */}
      {sortedConcepts.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
            <h2 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Key Concepts</h2>
            <span className="text-xs text-gray-400 dark:text-gray-600 ml-auto summary-print-hide">
              tap to expand
            </span>
          </div>
          <div className="space-y-2">
            {sortedConcepts.map((c, i) => (
              <ConceptCard key={c.id || i} concept={c} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* ── Formula Snapshot ─────────────────────────────────────────────── */}
      {summary.formulaSnapshot?.length > 0 && (
        <section
        >
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
            <h2 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Formula Snapshot</h2>
          </div>

          <div className="formula-print-panel bg-gray-950 dark:bg-black rounded-2xl p-4 space-y-3 border border-gray-800">
            {summary.formulaSnapshot.map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-3 group"
              >
                <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-green-500/15 border border-green-500/25 flex items-center justify-center mt-0.5">
                  <span className="text-[10px] font-bold text-green-400">{i + 1}</span>
                </span>
                <div className="flex-1 min-w-0">
                  <p className="formula-text text-[0.875rem] font-bold text-green-400 font-mono leading-snug break-words">
                    {item.formula}
                  </p>
                  <p className="formula-context text-xs text-gray-500 mt-0.5 leading-relaxed">{item.context}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Exam Spotlight ───────────────────────────────────────────────── */}
      {summary.examSpotlight && (
        <section
        >
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
            <h2 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Exam Spotlight</h2>
          </div>

          <div className="exam-spotlight-grid grid grid-cols-1 sm:grid-cols-3 gap-3">

            {/* High Value Topics */}
            <div className="bg-red-50 dark:bg-red-950/25 border border-red-200 dark:border-red-800/60 rounded-2xl p-4">
              <div className="flex items-center gap-1.5 mb-3">
                <Flame className="w-3.5 h-3.5 text-red-500 dark:text-red-400" />
                <span className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-widest">High Value</span>
              </div>
              <ul className="space-y-2.5">
                {summary.examSpotlight.highValueTopics?.map((t, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[9px] font-bold text-red-600 dark:text-red-400">{i + 1}</span>
                    </span>
                    <span className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">{t}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Question Patterns */}
            <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/50 rounded-2xl p-4">
              <div className="flex items-center gap-1.5 mb-3">
                <Eye className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />
                <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest">Question Patterns</span>
              </div>
              <ul className="space-y-2.5">
                {summary.examSpotlight.questionPatterns?.map((p, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 dark:bg-purple-500 flex-shrink-0 mt-1.5" />
                    <span className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">{p}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Must Memorize */}
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-4">
              <div className="flex items-center gap-1.5 mb-3">
                <Award className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">Must Memorize</span>
              </div>
              <ul className="space-y-2">
                {summary.examSpotlight.mustMemorize?.map((m, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <AlertCircle className="w-3 h-3 text-amber-500 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <span className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-medium">{m}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </section>
      )}

      {/* ── Last Night Revision ──────────────────────────────────────────── */}
      {summary.lastNightRevision?.length > 0 && (
        <section
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <List className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
              <h2 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                Last Night Revision
              </h2>
            </div>
            <span className="text-xs font-semibold text-gray-400 dark:text-gray-600 summary-print-hide">
              {checkedPoints.size}/{totalPoints} checked
            </span>
          </div>

          {/* Progress bar — hidden in print */}
          <div className="summary-print-hide h-1 bg-gray-100 dark:bg-gray-800 rounded-full mb-3 overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all"
              style={{ width: `${totalPoints ? (checkedPoints.size / totalPoints) * 100 : 0}%` }}
            />
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden divide-y divide-gray-50 dark:divide-gray-800">
            {summary.lastNightRevision.map((point, i) => {
              const checked = checkedPoints.has(i);
              return (
                <button
                  key={i}
                  onClick={() => togglePoint(i)}
                  className={`w-full flex items-start gap-3 px-4 py-3.5 text-left transition-colors duration-150 ${
                    checked
                      ? "bg-green-50/70 dark:bg-green-900/10"
                      : "hover:bg-gray-50/80 dark:hover:bg-gray-800/40"
                  }`}
                >
                  {/* Checkbox — hidden in print */}
                  <span className={`summary-print-hide flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 transition-all duration-200 ${
                    checked
                      ? "bg-green-500 border-green-500"
                      : "border-gray-300 dark:border-gray-600"
                  }`}>
                    {checked && (
                      <span
                      >
                        <CheckCircle2 className="w-3 h-3 text-white" />
                      </span>
                    )}
                  </span>

                  <div className="flex-1 min-w-0 flex items-start gap-2">
                    <span className="text-[10px] font-bold text-gray-300 dark:text-gray-600 mt-0.5 w-4 flex-shrink-0">
                      {i + 1}
                    </span>
                    <p className={`text-sm leading-relaxed transition-all duration-200 ${
                      checked
                        ? "text-gray-400 dark:text-gray-600 line-through decoration-gray-300 dark:decoration-gray-600"
                        : "text-gray-800 dark:text-gray-200"
                    }`}>
                      {point}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Completion state — hidden in print */}
          
            {allChecked && !revisionComplete && (
              <div
                className="summary-print-hide mt-3 flex items-center gap-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl px-5 py-4 shadow-lg shadow-green-900/20"
              >
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white">Revision Complete!</p>
                  <p className="text-xs text-green-100 mt-0.5">
                    All {totalPoints} points covered. You are exam ready!
                  </p>
                </div>
                <button
                  onClick={() => setRevisionComplete(true)}
                  className="flex-shrink-0 bg-white/20 hover:bg-white/30 border border-white/20 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors"
                >
                  Done
                </button>
              </div>
            )}
            {revisionComplete && (
              <p
                className="summary-print-hide mt-3 text-center text-sm font-bold text-green-600 dark:text-green-400 py-2"
              >
                All the best for your exam!
              </p>
            )}
          
        </section>
      )}

      {/* ── Print Footer (only visible in PDF) ───────────────────────────── */}
      <div className="hidden print-only" style={{ display: "none" }}>
        <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "12px", marginTop: "24px", textAlign: "center" }}>
          <p style={{ fontSize: "10px", color: "#6b7280" }}>
            Topper 2.0 · One-Shot Revision · {chapterName} · {subject} · Bihar Board
          </p>
        </div>
      </div>

    </div>
  );
}
