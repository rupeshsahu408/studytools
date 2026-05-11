import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown, ChevronUp, Star, Lightbulb, BookOpen,
  FlaskConical, GitBranch, Image, Hash, ChevronRight,
  RefreshCw, Loader2,
} from "lucide-react";

interface SubTopic {
  title: string;
  content: string;
}

interface FormulaUsed {
  name: string;
  formula: string;
  explanation: string;
}

interface ImportantTerm {
  term: string;
  definition: string;
}

interface Topic {
  id: string;
  title: string;
  content: string;
  subTopics?: SubTopic[];
  keyPoints: string[];
  importantTerms: ImportantTerm[];
  formulasUsed?: FormulaUsed[];
  derivationSteps?: string[];
  diagramDescription?: string;
  examples: string[];
}

interface Notes {
  chapterOverview: string;
  topics: Topic[];
  summary: string;
  examTips: string[];
}

interface NotesViewProps {
  notes: Notes;
  subject?: string;
  onRead?: () => void;
  onRegenerate?: () => void;
  regenerating?: boolean;
}

export default function NotesView({ notes, onRead, onRegenerate, regenerating }: NotesViewProps) {
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(
    new Set(notes.topics?.[0]?.id ? [notes.topics[0].id] : [])
  );
  const [showConfirm, setShowConfirm] = useState(false);
  const calledOnRead = useRef(false);

  useEffect(() => {
    if (onRead && !calledOnRead.current) {
      calledOnRead.current = true;
      const t = setTimeout(() => onRead(), 1500);
      return () => clearTimeout(t);
    }
  }, [onRead]);

  const toggleTopic = (id: string) => {
    setExpandedTopics(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => setExpandedTopics(new Set(notes.topics?.map(t => t.id)));
  const collapseAll = () => setExpandedTopics(new Set());

  const handleRegenerateClick = () => {
    if (regenerating) return;
    setShowConfirm(true);
  };

  const handleConfirmRegenerate = () => {
    setShowConfirm(false);
    onRegenerate?.();
  };

  return (
    <div className="max-w-3xl">
      {/* Regenerating overlay banner */}
      <AnimatePresence>
        {regenerating && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-5 flex items-center gap-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl px-5 py-4"
          >
            <div className="relative w-8 h-8 flex-shrink-0">
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-green-200 dark:border-green-800"
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              />
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-transparent border-t-green-600"
                animate={{ rotate: 360 }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-3.5 h-3.5 text-green-600 animate-spin" />
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-green-800 dark:text-green-300">
                AI is regenerating your notes…
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                This takes 60–90 seconds. Your current notes are still visible below.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm dialog */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            className="mb-5 bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-800/50 rounded-2xl px-5 py-4"
          >
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1">
              Regenerate notes?
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mb-4">
              AI will generate a fresh, complete set of notes for this chapter using the two-phase deep generation. This will replace the current notes and takes about 60–90 seconds.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleConfirmRegenerate}
                className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Yes, regenerate
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="text-xs font-medium px-4 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-green-600" /> Chapter Notes
          {notes.topics?.length > 0 && (
            <span className="text-sm font-normal text-gray-400 ml-1">{notes.topics.length} sections</span>
          )}
        </h2>
        <div className="flex items-center gap-3">
          <button onClick={expandAll} className="text-xs text-green-600 hover:underline">Expand All</button>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <button onClick={collapseAll} className="text-xs text-gray-400 hover:underline">Collapse All</button>
          {onRegenerate && (
            <>
              <span className="text-gray-300 dark:text-gray-600">|</span>
              <button
                onClick={handleRegenerateClick}
                disabled={regenerating}
                title="Regenerate notes with deeper AI analysis"
                className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {regenerating
                  ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Regenerating…</>
                  : <><RefreshCw className="w-3.5 h-3.5" /> Regenerate</>
                }
              </button>
            </>
          )}
        </div>
      </div>

      {/* Chapter Overview */}
      {notes.chapterOverview && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-2xl p-5 mb-6">
          <p className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wide mb-2">
            Chapter Overview
          </p>
          <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{notes.chapterOverview}</p>
        </div>
      )}

      {/* Topics */}
      <div className="space-y-3 mb-6">
        {notes.topics?.map((topic, i) => {
          const isOpen = expandedTopics.has(topic.id);
          const hasFormulas = topic.formulasUsed && topic.formulasUsed.length > 0;
          const hasDerivation = topic.derivationSteps && topic.derivationSteps.length > 0;
          const hasDiagram = topic.diagramDescription && topic.diagramDescription.trim().length > 0;
          const hasSubTopics = topic.subTopics && topic.subTopics.length > 0;

          return (
            <motion.div
              key={topic.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden"
            >
              {/* Topic Header */}
              <button
                onClick={() => toggleTopic(topic.id)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-green-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {i + 1}
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white text-sm leading-snug">{topic.title}</span>
                </div>
                <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                  {hasFormulas && <FlaskConical className="w-3.5 h-3.5 text-blue-400" title="Has formulas" />}
                  {hasDerivation && <GitBranch className="w-3.5 h-3.5 text-purple-400" title="Has derivation" />}
                  {hasDiagram && <Image className="w-3.5 h-3.5 text-orange-400" title="Has diagram" />}
                  {isOpen
                    ? <ChevronUp className="w-4 h-4 text-gray-400" />
                    : <ChevronDown className="w-4 h-4 text-gray-400" />
                  }
                </div>
              </button>

              {/* Topic Body */}
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-gray-50 dark:border-gray-800"
                  >
                    <div className="px-5 pb-6 space-y-5">

                      {/* Main Content */}
                      {topic.content && (
                        <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mt-4 whitespace-pre-line">
                          {topic.content}
                        </p>
                      )}

                      {/* Sub-Topics */}
                      {hasSubTopics && (
                        <div className="space-y-3">
                          {topic.subTopics!.map((sub, j) => (
                            <div key={j} className="border-l-2 border-green-200 dark:border-green-800 pl-4 py-1">
                              <p className="text-xs font-bold text-green-700 dark:text-green-400 mb-1 flex items-center gap-1.5">
                                <ChevronRight className="w-3 h-3" /> {sub.title}
                              </p>
                              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                                {sub.content}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Formulas Used */}
                      {hasFormulas && (
                        <div>
                          <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                            <FlaskConical className="w-3 h-3" /> Formulas & Laws
                          </p>
                          <div className="space-y-2">
                            {topic.formulasUsed!.map((f, j) => (
                              <div key={j} className="bg-blue-50 dark:bg-blue-900/15 border border-blue-100 dark:border-blue-800/40 rounded-xl px-4 py-3">
                                <div className="flex items-start gap-3">
                                  <div className="flex-1">
                                    <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">{f.name}</p>
                                    <code className="block text-sm font-mono font-bold text-blue-900 dark:text-blue-200 mb-1.5 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded-lg">
                                      {f.formula}
                                    </code>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{f.explanation}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Derivation Steps */}
                      {hasDerivation && (
                        <div>
                          <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                            <GitBranch className="w-3 h-3" /> Derivation / Proof
                          </p>
                          <div className="bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800/30 rounded-xl p-4">
                            <ol className="space-y-2">
                              {topic.derivationSteps!.map((step, j) => (
                                <li key={j} className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                                  <span className="w-5 h-5 rounded-full bg-purple-200 dark:bg-purple-800 text-purple-700 dark:text-purple-300 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                                    {j + 1}
                                  </span>
                                  <span className="leading-relaxed">{step}</span>
                                </li>
                              ))}
                            </ol>
                          </div>
                        </div>
                      )}

                      {/* Diagram Description */}
                      {hasDiagram && (
                        <div>
                          <p className="text-xs font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                            <Image className="w-3 h-3" /> Diagram / Experiment
                          </p>
                          <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-800/30 rounded-xl px-4 py-3">
                            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed italic">
                              {topic.diagramDescription}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Key Points */}
                      {topic.keyPoints?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                            <Star className="w-3 h-3 text-yellow-500" /> Key Points to Remember
                          </p>
                          <ul className="space-y-1.5">
                            {topic.keyPoints.map((pt, j) => (
                              <li key={j} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                                {pt}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Important Terms */}
                      {topic.importantTerms?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                            <Hash className="w-3 h-3" /> Important Terms
                          </p>
                          <div className="space-y-2">
                            {topic.importantTerms.map((t, j) => (
                              <div key={j} className="bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-2.5">
                                <span className="font-semibold text-green-700 dark:text-green-400 text-sm">{t.term}</span>
                                <span className="text-gray-400 mx-2">—</span>
                                <span className="text-gray-600 dark:text-gray-300 text-sm">{t.definition}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Examples */}
                      {topic.examples?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                            <Lightbulb className="w-3 h-3 text-yellow-400" /> Examples & Applications
                          </p>
                          <div className="space-y-2">
                            {topic.examples.map((ex, j) => (
                              <div key={j} className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-800/30 rounded-xl px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                {ex}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Summary */}
      {notes.summary && (
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 mb-4">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <BookOpen className="w-3 h-3" /> Chapter Summary
          </p>
          <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{notes.summary}</p>
        </div>
      )}

      {/* Exam Tips */}
      {notes.examTips?.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30 rounded-2xl p-5">
          <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <Star className="w-3 h-3" /> Exam Tips — Bihar Board Focus
          </p>
          <ul className="space-y-2">
            {notes.examTips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                <span className="text-amber-500 font-bold text-xs mt-0.5 flex-shrink-0">★</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
