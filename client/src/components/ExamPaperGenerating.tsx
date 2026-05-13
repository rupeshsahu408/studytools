import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Target, AlignLeft, PenLine, FileText, Sparkles,
  CheckCircle2, Loader2, Wifi,
} from "lucide-react";

// ─── Step definitions ────────────────────────────────────────────────────────

const STEPS = [
  {
    id: 0,
    hi: "Chapter Analyze Ho Raha Hai…",
    en: "Reading and understanding your chapter",
    icon: BookOpen,
    accent: "blue",
    startAt: 0,
    endAt: 6,
  },
  {
    id: 1,
    hi: "Objective Questions Ban Rahe Hain (Batch 1)…",
    en: "Generating 50 MCQs — options, answers & explanations",
    icon: Target,
    accent: "amber",
    startAt: 6,
    endAt: 20,
  },
  {
    id: 2,
    hi: "Aur MCQ Questions Generate Ho Rahe Hain (Batch 2)…",
    en: "Generating 50 more MCQs to complete 100 total",
    icon: AlignLeft,
    accent: "amber",
    startAt: 20,
    endAt: 35,
  },
  {
    id: 3,
    hi: "2-Mark Short Answer Questions Tayar Ho Rahe Hain…",
    en: "Writing 20 short answer questions with model answers",
    icon: PenLine,
    accent: "green",
    startAt: 35,
    endAt: 47,
  },
  {
    id: 4,
    hi: "5-Mark Long Answer Questions Likh Rahe Hain…",
    en: "Composing 6 detailed long answers with key points",
    icon: FileText,
    accent: "purple",
    startAt: 47,
    endAt: 58,
  },
  {
    id: 5,
    hi: "Exam Paper Finalize Ho Raha Hai…",
    en: "Assembling the complete paper — almost ready!",
    icon: Sparkles,
    accent: "rose",
    startAt: 58,
    endAt: 999,
  },
];

// ─── Rotating tips ────────────────────────────────────────────────────────────

const TIPS = [
  { emoji: "💡", text: "Board exams mein har saal ek chapter se 15–20 MCQ aate hain!" },
  { emoji: "📝", text: "Is paper mein 100 MCQ + 20 Short + 6 Long — ekdum Board pattern!" },
  { emoji: "⏱️", text: "Aap dusre tabs dekh sakte hain — generation background mein chal rahi hai!" },
  { emoji: "🎯", text: "Practice papers se revision ki speed 3× ho jaati hai!" },
  { emoji: "🏆", text: "Top scorers rozana 2 practice papers solve karte hain!" },
  { emoji: "🧠", text: "Ek baar paper banao, baar-baar practice karo — yahi topper ka secret hai!" },
];

// ─── Accent colour lookup ─────────────────────────────────────────────────────

const ACCENT: Record<string, { ring: string; bg: string; text: string; bar: string; dot: string }> = {
  blue:   { ring: "border-blue-400",   bg: "bg-blue-100 dark:bg-blue-900/30",    text: "text-blue-500",   bar: "from-blue-400 to-blue-600",     dot: "bg-blue-500"   },
  amber:  { ring: "border-amber-400",  bg: "bg-amber-100 dark:bg-amber-900/30",  text: "text-amber-500",  bar: "from-amber-400 to-amber-600",   dot: "bg-amber-500"  },
  green:  { ring: "border-green-400",  bg: "bg-green-100 dark:bg-green-900/30",  text: "text-green-500",  bar: "from-green-400 to-green-600",   dot: "bg-green-500"  },
  purple: { ring: "border-purple-400", bg: "bg-purple-100 dark:bg-purple-900/30",text: "text-purple-500", bar: "from-purple-400 to-purple-600",  dot: "bg-purple-500" },
  rose:   { ring: "border-rose-400",   bg: "bg-rose-100 dark:bg-rose-900/30",    text: "text-rose-500",   bar: "from-rose-400 to-rose-600",     dot: "bg-rose-500"   },
};

// ─── Main component ───────────────────────────────────────────────────────────

export default function ExamPaperGenerating() {
  const [elapsed, setElapsed] = useState(0);
  const [tipIdx, setTipIdx] = useState(0);

  // 100 ms tick for smooth progress
  useEffect(() => {
    const t = setInterval(() => setElapsed(e => +(e + 0.1).toFixed(1)), 100);
    return () => clearInterval(t);
  }, []);

  // Rotate tips every 7 s
  useEffect(() => {
    const t = setInterval(() => setTipIdx(i => (i + 1) % TIPS.length), 7000);
    return () => clearInterval(t);
  }, []);

  // Active step
  const activeIdx = Math.max(0, STEPS.findIndex(s => elapsed < s.endAt));
  const activeStep = STEPS[activeIdx];
  const accent = ACCENT[activeStep.accent];

  // Smooth progress 0–99 %
  const totalDuration = 62;
  const rawPct = Math.min((elapsed / totalDuration) * 100, 99);
  const progress = rawPct < 88 ? rawPct : 88 + (rawPct - 88) * 0.25;

  // Simulated question counters
  const mcq  = Math.min(100, Math.floor(elapsed > 6  ? ((elapsed - 6)  / 29) * 100 : 0));
  const two  = Math.min(20,  Math.floor(elapsed > 35 ? ((elapsed - 35) / 12) *  20 : 0));
  const five = Math.min(6,   Math.floor(elapsed > 47 ? ((elapsed - 47) / 11) *   6 : 0));

  const StepIcon = activeStep.icon;
  const tip = TIPS[tipIdx];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 select-none">

      {/* ── Header ── */}
      <div className="text-center mb-8">
        <div
          className="inline-flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-400 text-xs font-semibold px-4 py-1.5 rounded-full mb-4"
        >
          <Wifi className="w-3.5 h-3.5 animate-pulse" />
          AI Exam Paper Ban Raha Hai…
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
          Aapka Practice Paper Tayar Ho Raha Hai
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          100 MCQ + 20 Short Answer + 6 Long Answer — Board Exam Pattern
        </p>
      </div>

      {/* ── Central orbital animation + step list ── */}
      <div className="flex flex-col sm:flex-row gap-6 mb-6 items-center sm:items-start">

        {/* Orbital icon */}
        <div className="flex-shrink-0 relative w-36 h-36">
          {/* Outer ring — slow clockwise */}
          <div
            className={`absolute inset-0 rounded-full border-4 border-dashed ${accent.ring} opacity-30`}
            style={{ animation: "spin 8s linear infinite" }}
          />
          {/* Middle ring — counter-clockwise */}
          <div
            className="absolute inset-3 rounded-full border-4 border-transparent border-t-amber-400 border-r-amber-300"
            style={{ animation: "spin 2s linear infinite reverse" }}
          />
          {/* Inner ring — clockwise fast */}
          <div
            className="absolute inset-6 rounded-full border-2 border-transparent border-b-amber-500"
            style={{ animation: "spin 1.2s linear infinite" }}
          />
          {/* Centre icon — changes with step */}
          <div className="absolute inset-0 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep.id}
                initial={{ opacity: 0, scale: 0.7, rotate: -15 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.7, rotate: 15 }}
                transition={{ duration: 0.3 }}
                className={`w-14 h-14 rounded-2xl ${accent.bg} flex items-center justify-center`}
              >
                <StepIcon className={`w-7 h-7 ${accent.text}`} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Step list */}
        <div className="flex-1 space-y-2 w-full">
          {STEPS.map((step, i) => {
            const done    = i < activeIdx;
            const current = i === activeIdx;
            const Icon    = step.icon;
            const ac      = ACCENT[step.accent];
            return (
              <div
                key={step.id}
                className={`flex items-start gap-3 px-3 py-2.5 rounded-xl transition-all ${
                  current
                    ? "bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700"
                    : done
                    ? "bg-green-50 dark:bg-green-900/10"
                    : "bg-gray-50 dark:bg-gray-800/40"
                }`}
              >
                {/* Status icon */}
                <div className="flex-shrink-0 mt-0.5">
                  {done ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : current ? (
                    <Loader2 className={`w-4 h-4 ${ac.text} animate-spin`} />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-gray-600" />
                  )}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <AnimatePresence mode="wait">
                    {current ? (
                      <motion.p
                        key="hi"
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 6 }}
                        transition={{ duration: 0.2 }}
                        className={`text-sm font-semibold ${ac.text} leading-snug`}
                      >
                        {step.hi}
                      </motion.p>
                    ) : (
                      <motion.p
                        key="en"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className={`text-sm font-medium leading-snug ${
                          done
                            ? "text-green-700 dark:text-green-400 line-through decoration-green-400/60"
                            : "text-gray-400 dark:text-gray-500"
                        }`}
                      >
                        {done ? step.hi : step.en}
                      </motion.p>
                    )}
                  </AnimatePresence>
                  {current && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {step.en}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Progress bar ── */}
      <div className="mb-5">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Progress</span>
          <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${accent.bar} transition-all`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* ── Question counters ── */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Objective (MCQ)", value: mcq, total: 100, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/20" },
          { label: "Short Answer (2M)", value: two, total: 20, color: "text-green-600 dark:text-green-400",  bg: "bg-green-50 dark:bg-green-900/20"  },
          { label: "Long Answer (5M)", value: five, total: 6,  color: "text-purple-600 dark:text-purple-400",bg: "bg-purple-50 dark:bg-purple-900/20" },
        ].map(card => (
          <div key={card.label} className={`${card.bg} rounded-xl p-3 text-center`}>
            <p
              className={`text-2xl font-black ${card.color} tabular-nums`}
              key={card.value}
            >
              {card.value}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
              / {card.total}
            </p>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 leading-tight">
              {card.label}
            </p>
          </div>
        ))}
      </div>

      {/* ── Rotating tips ── */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl px-4 py-3 min-h-[56px] flex items-center gap-3">
        <AnimatePresence mode="wait">
          <motion.div
            key={tipIdx}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3 }}
            className="flex items-start gap-2 w-full"
          >
            <span className="text-lg leading-none mt-0.5 flex-shrink-0">{tip.emoji}</span>
            <p className="text-sm text-gray-600 dark:text-gray-300">{tip.text}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Bottom reassurance ── */}
      <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-4">
        Aap freely dusre sections dekh sakte hain — yeh process background mein chalti rahegi.
      </p>
    </div>
  );
}
