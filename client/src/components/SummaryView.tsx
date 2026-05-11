import { motion } from "framer-motion";
import { Clock, Zap, BookMarked, FlaskConical, Star, Target, Brain } from "lucide-react";

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
}

const WEIGHT_STYLES = {
  high:   { border: "border-l-violet-500", badge: "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300", label: "High Priority" },
  medium: { border: "border-l-blue-400",   badge: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",     label: "Medium"       },
  low:    { border: "border-l-gray-300 dark:border-l-gray-600", badge: "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400", label: "Low" },
};

function SectionHeading({ icon: Icon, label, color = "violet" }: { icon: any; label: string; color?: string }) {
  const colorMap: Record<string, string> = {
    violet: "text-violet-600 dark:text-violet-400",
    amber:  "text-amber-600 dark:text-amber-400",
    green:  "text-green-600 dark:text-green-400",
    blue:   "text-blue-600 dark:text-blue-400",
  };
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon className={`w-4.5 h-4.5 flex-shrink-0 ${colorMap[color]}`} />
      <h3 className={`text-sm font-bold uppercase tracking-wide ${colorMap[color]}`}>{label}</h3>
    </div>
  );
}

export default function SummaryView({ summary, chapterName, subject }: SummaryViewProps) {
  const fade = (delay: number) => ({
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, delay },
  });

  return (
    <div className="max-w-3xl space-y-6">

      {/* ── Header ── */}
      <motion.div {...fade(0)}>
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 px-3 py-1 rounded-full">
            <Zap className="w-3 h-3" /> One-Shot Revision
          </span>
          {summary.readTime && (
            <span className="inline-flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
              <Clock className="w-3 h-3" /> {summary.readTime} min read
            </span>
          )}
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-snug">
          {chapterName}
        </h2>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{subject} · Bihar Board</p>
      </motion.div>

      {/* ── Chapter Essence ── */}
      {summary.chapterEssence && (
        <motion.div {...fade(0.05)}
          className="border-l-4 border-violet-500 bg-violet-50 dark:bg-violet-950/20 rounded-r-2xl px-5 py-4">
          <p className="text-[0.93rem] leading-relaxed text-gray-800 dark:text-gray-200 italic">
            {summary.chapterEssence}
          </p>
        </motion.div>
      )}

      {/* ── Key Concepts ── */}
      {summary.concepts && summary.concepts.length > 0 && (
        <motion.div {...fade(0.1)}>
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5">
            <SectionHeading icon={Brain} label="Key Concepts" color="violet" />
            <div className="space-y-3">
              {summary.concepts.map((concept, i) => {
                const ws = WEIGHT_STYLES[concept.examWeight] || WEIGHT_STYLES.medium;
                return (
                  <motion.div key={concept.id || i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.04 }}
                    className={`border-l-4 ${ws.border} bg-gray-50 dark:bg-gray-800/50 rounded-r-xl px-4 py-3`}>
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white leading-snug">{concept.title}</p>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${ws.badge}`}>
                        {ws.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{concept.explanation}</p>
                    {concept.keyFormula && (
                      <div className="mt-2 inline-flex items-center gap-1.5 bg-white dark:bg-gray-900 border border-violet-200 dark:border-violet-800/40 rounded-lg px-3 py-1">
                        <span className="text-violet-500 text-xs font-bold">f</span>
                        <span className="text-xs font-mono font-semibold text-gray-800 dark:text-gray-200">{concept.keyFormula}</span>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Formula Snapshot ── */}
      {summary.formulaSnapshot && summary.formulaSnapshot.length > 0 && (
        <motion.div {...fade(0.15)}>
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5">
            <SectionHeading icon={BookMarked} label="Formula Snapshot" color="green" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {summary.formulaSnapshot.map((item, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.15 + i * 0.03 }}
                  className="bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2.5">
                  <p className="font-mono text-sm font-bold text-green-700 dark:text-green-400 leading-snug">{item.formula}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">{item.context}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Exam Spotlight ── */}
      {summary.examSpotlight && (
        <motion.div {...fade(0.2)}>
          <div className="bg-amber-50 dark:bg-amber-950/15 border border-amber-200 dark:border-amber-800/30 rounded-2xl p-5">
            <SectionHeading icon={Target} label="Exam Spotlight" color="amber" />
            <div className="space-y-4">

              {/* High-value topics */}
              {summary.examSpotlight.highValueTopics?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-2">High-Value Topics</p>
                  <div className="flex flex-wrap gap-1.5">
                    {summary.examSpotlight.highValueTopics.map((topic, i) => (
                      <span key={i} className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-700/40 px-2.5 py-1 rounded-full font-medium">
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Question patterns */}
              {summary.examSpotlight.questionPatterns?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-2">Expected Question Patterns</p>
                  <ul className="space-y-1.5">
                    {summary.examSpotlight.questionPatterns.map((pat, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <span className="w-5 h-5 bg-amber-200 dark:bg-amber-800/40 text-amber-700 dark:text-amber-400 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                        {pat}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Must memorize */}
              {summary.examSpotlight.mustMemorize?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-2">Must Memorize</p>
                  <div className="space-y-1.5">
                    {summary.examSpotlight.mustMemorize.map((item, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900/50 rounded-lg px-3 py-2">
                        <Star className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <span className="font-medium">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Last Night Revision ── */}
      {summary.lastNightRevision && summary.lastNightRevision.length > 0 && (
        <motion.div {...fade(0.25)}>
          <div className="bg-gray-900 dark:bg-gray-950 border border-gray-800 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <FlaskConical className="w-4 h-4 text-violet-400" />
              <h3 className="text-sm font-bold uppercase tracking-wide text-violet-400">Last Night Revision</h3>
              <span className="text-xs text-gray-500 ml-auto">10 must-know points</span>
            </div>
            <ol className="space-y-2.5">
              {summary.lastNightRevision.slice(0, 10).map((point, i) => (
                <motion.li key={i}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 + i * 0.04 }}
                  className="flex items-start gap-3 text-sm text-gray-200 leading-relaxed">
                  <span className="w-6 h-6 bg-violet-900/50 border border-violet-700/40 text-violet-300 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span>{point}</span>
                </motion.li>
              ))}
            </ol>
          </div>
        </motion.div>
      )}

    </div>
  );
}
