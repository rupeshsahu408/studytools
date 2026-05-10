import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ChevronDown, ChevronUp, Star, Lightbulb, BookOpen } from "lucide-react";

interface Topic {
  id: string;
  title: string;
  content: string;
  keyPoints: string[];
  importantTerms: { term: string; definition: string }[];
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
  subject: string;
  onRead?: () => void;
}

export default function NotesView({ notes, subject, onRead }: NotesViewProps) {
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set([notes.topics?.[0]?.id]));
  const calledOnRead = useRef(false);

  // Mark notes as read on first mount
  useEffect(() => {
    if (onRead && !calledOnRead.current) {
      calledOnRead.current = true;
      // Small delay to ensure it's intentional (not a quick navigation away)
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

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-green-600" /> Chapter Notes
        </h2>
        <div className="flex gap-2">
          <button onClick={expandAll} className="text-xs text-green-600 hover:underline">Expand All</button>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <button onClick={collapseAll} className="text-xs text-gray-400 hover:underline">Collapse All</button>
        </div>
      </div>

      {notes.chapterOverview && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-2xl p-5 mb-6">
          <p className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wide mb-2">Chapter Overview</p>
          <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{notes.chapterOverview}</p>
        </div>
      )}

      <div className="space-y-3 mb-6">
        {notes.topics?.map((topic, i) => {
          const isOpen = expandedTopics.has(topic.id);
          return (
            <motion.div key={topic.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
              <button onClick={() => toggleTopic(topic.id)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-green-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                  <span className="font-semibold text-gray-900 dark:text-white text-sm">{topic.title}</span>
                </div>
                {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
              </button>

              {isOpen && (
                <div className="px-5 pb-5 space-y-4 border-t border-gray-50 dark:border-gray-800">
                  <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mt-4 whitespace-pre-line">{topic.content}</p>

                  {topic.keyPoints?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                        <Star className="w-3 h-3 text-yellow-500" /> Key Points
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

                  {topic.importantTerms?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Important Terms</p>
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

                  {topic.examples?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                        <Lightbulb className="w-3 h-3 text-yellow-400" /> Examples
                      </p>
                      {topic.examples.map((ex, j) => (
                        <div key={j} className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-800/30 rounded-xl px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300">
                          {ex}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {notes.summary && (
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 mb-4">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Chapter Summary</p>
          <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{notes.summary}</p>
        </div>
      )}

      {notes.examTips?.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30 rounded-2xl p-5">
          <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <Star className="w-3 h-3" /> Exam Tips
          </p>
          <ul className="space-y-2">
            {notes.examTips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                <span className="text-amber-500 font-bold text-xs mt-0.5">★</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
