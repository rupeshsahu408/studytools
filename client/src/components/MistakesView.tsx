import { useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";

interface Mistake {
  id: string;
  mistake: string;
  correct: string;
  marks_impact: string;
  category: string;
}

interface MistakesViewProps {
  mistakes: Mistake[];
}

const CATEGORY_STYLES: Record<string, string> = {
  Concept: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
  Formula: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
  Calculation: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400",
  Definition: "bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400",
  Diagram: "bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400",
  Unit: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
};

function MistakeCard({ mistake, index }: { mistake: Mistake; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const catStyle = CATEGORY_STYLES[mistake.category] || "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">

      <button
        className="w-full text-left px-5 py-4 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        onClick={() => setExpanded(e => !e)}>
        {/* Number badge */}
        <div className="w-6 h-6 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-xs font-bold text-red-600 dark:text-red-400">{index + 1}</span>
        </div>

        <div className="flex-1 min-w-0">
          {/* Category + marks impact */}
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${catStyle}`}>
              {mistake.category}
            </span>
            {mistake.marks_impact && (
              <span className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {mistake.marks_impact}
              </span>
            )}
          </div>

          {/* Mistake description */}
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-800 dark:text-gray-200 font-medium leading-snug">{mistake.mistake}</p>
          </div>
        </div>

        {/* Expand indicator */}
        <span className="text-gray-300 dark:text-gray-600 flex-shrink-0 mt-0.5">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </button>

      {/* Correct approach (expanded) */}
      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="px-5 pb-4 border-t border-gray-50 dark:border-gray-800 pt-3">
          <div className="bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800/30 rounded-xl p-4">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-green-700 dark:text-green-400 mb-1 uppercase tracking-wide">Correct Approach</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{mistake.correct}</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

export default function MistakesView({ mistakes }: MistakesViewProps) {
  const [filterCategory, setFilterCategory] = useState("All");

  const categories = ["All", ...Array.from(new Set(mistakes.map(m => m.category).filter(Boolean)))];
  const filtered = filterCategory === "All" ? mistakes : mistakes.filter(m => m.category === filterCategory);

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-500" /> Ye Galti Mat Karo
          <span className="text-sm font-normal text-gray-400 ml-1">{mistakes.length} mistakes to avoid</span>
        </h2>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
        These are the most common mistakes Bihar Board students make in this chapter. Avoid them to protect your marks.
      </p>

      {/* Category filter */}
      {categories.length > 2 && (
        <div className="flex gap-2 flex-wrap mb-5">
          {categories.map(c => {
            const style = c === "All" ? "" : CATEGORY_STYLES[c] || "";
            return (
              <button key={c} onClick={() => setFilterCategory(c)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${
                  filterCategory === c
                    ? c === "All" ? "bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 border-transparent" : `${style} border-current`
                    : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300"
                }`}>
                {c}
              </button>
            );
          })}
        </div>
      )}

      {/* Mistake cards */}
      <div className="space-y-3">
        {filtered.map((m, i) => (
          <MistakeCard key={m.id} mistake={m} index={i} />
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-10 text-gray-400 dark:text-gray-600 text-sm">
            No mistakes found for this category.
          </div>
        )}
      </div>
    </div>
  );
}
