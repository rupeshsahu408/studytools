import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Clock, CheckCircle, XCircle, Trophy } from "lucide-react";

const Q_TYPES = [
  { key: "mcq", label: "MCQ", color: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" },
  { key: "oneMarks", label: "1 Mark", color: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300" },
  { key: "twoMarks", label: "2 Marks", color: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300" },
  { key: "fiveMarks", label: "5 Marks", color: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300" },
  { key: "assertionReason", label: "Assertion-Reason", color: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300" },
  { key: "trueFalse", label: "True/False", color: "bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300" },
  { key: "fillBlanks", label: "Fill Blanks", color: "bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300" },
  { key: "examImportant", label: "Exam Important", color: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300" },
];

interface QuestionsViewProps {
  questions: Record<string, any[]>;
}

export default function QuestionsView({ questions }: QuestionsViewProps) {
  const [activeType, setActiveType] = useState("mcq");
  const [mode, setMode] = useState<"practice" | "test">("practice");
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [testStarted, setTestStarted] = useState(false);
  const [testDone, setTestDone] = useState(false);
  const [testMinutes, setTestMinutes] = useState(15);
  const [timerRef, setTimerRef] = useState<any>(null);

  const currentQuestions = questions[activeType] || [];

  const toggleReveal = (id: string) => {
    setRevealedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const revealAll = () => setRevealedIds(new Set(currentQuestions.map((q: any) => q.id)));
  const hideAll = () => setRevealedIds(new Set());

  const startTest = () => {
    setRevealedIds(new Set());
    setTestDone(false);
    setTestStarted(true);
    let secs = testMinutes * 60;
    setTimeLeft(secs);
    const t = setInterval(() => {
      secs--;
      setTimeLeft(secs);
      if (secs <= 0) {
        clearInterval(t);
        setTestDone(true);
        setTestStarted(false);
        setRevealedIds(new Set(currentQuestions.map((q: any) => q.id)));
      }
    }, 1000);
    setTimerRef(t);
  };

  const endTest = () => {
    if (timerRef) clearInterval(timerRef);
    setTestDone(true);
    setTestStarted(false);
    setRevealedIds(new Set(currentQuestions.map((q: any) => q.id)));
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const typeInfo = Q_TYPES.find(t => t.key === activeType);
  const totalQuestions = Object.values(questions).reduce((sum: number, arr: any) => sum + (arr?.length || 0), 0);

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Trophy className="w-5 h-5 text-green-600" /> Question Bank
          <span className="text-sm font-normal text-gray-400 ml-1">{totalQuestions} total questions</span>
        </h2>
        <div className="flex gap-2">
          <button onClick={() => { setMode("practice"); setTestStarted(false); setTestDone(false); if (timerRef) clearInterval(timerRef); }}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${mode === "practice" ? "bg-green-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"}`}>
            Practice
          </button>
          <button onClick={() => { setMode("test"); setTestStarted(false); setTestDone(false); setRevealedIds(new Set()); }}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${mode === "test" ? "bg-green-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"}`}>
            Timed Test
          </button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap mb-5">
        {Q_TYPES.map(t => {
          const count = questions[t.key]?.length || 0;
          if (!count) return null;
          return (
            <button key={t.key} onClick={() => { setActiveType(t.key); setRevealedIds(new Set()); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${activeType === t.key ? `${t.color} border-current` : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300"}`}>
              {t.label} ({count})
            </button>
          );
        })}
      </div>

      {mode === "test" && (
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 mb-5">
          {!testStarted && !testDone ? (
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Time:</span>
                <select value={testMinutes} onChange={e => setTestMinutes(Number(e.target.value))}
                  className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 text-sm text-gray-900 dark:text-white">
                  {[5, 10, 15, 20, 30, 45, 60].map(m => <option key={m}>{m} min</option>)}
                </select>
              </div>
              <button onClick={startTest} className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors">
                Start Test
              </button>
            </div>
          ) : testStarted ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-red-500" />
                <span className={`text-lg font-bold ${timeLeft! < 60 ? "text-red-500" : "text-gray-900 dark:text-white"}`}>
                  {formatTime(timeLeft!)}
                </span>
                <span className="text-sm text-gray-400">remaining</span>
              </div>
              <button onClick={endTest} className="bg-red-500 hover:bg-red-600 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors">
                End Test
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Test complete! All answers revealed below.</span>
            </div>
          )}
        </div>
      )}

      {mode === "practice" && currentQuestions.length > 0 && (
        <div className="flex gap-2 mb-4">
          <button onClick={revealAll} className="text-xs flex items-center gap-1.5 text-gray-500 hover:text-green-600 transition-colors">
            <Eye className="w-3.5 h-3.5" /> Show All Answers
          </button>
          <span className="text-gray-200 dark:text-gray-700">|</span>
          <button onClick={hideAll} className="text-xs flex items-center gap-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
            <EyeOff className="w-3.5 h-3.5" /> Hide All
          </button>
        </div>
      )}

      <div className="space-y-3">
        {currentQuestions.map((q: any, i: number) => {
          const isRevealed = revealedIds.has(q.id) || (mode === "test" && testDone);
          const canReveal = mode === "practice" || (mode === "test" && testDone);

          return (
            <motion.div key={q.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
              <div className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  <span className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white leading-relaxed">{q.question || q.statement || q.assertion}</p>

                    {activeType === "assertionReason" && q.reason && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1.5"><span className="font-medium">Reason:</span> {q.reason}</p>
                    )}

                    {(activeType === "mcq" || activeType === "assertionReason") && q.options && (
                      <ul className="mt-3 space-y-1.5">
                        {q.options.map((opt: string, oi: number) => (
                          <li key={oi} className={`text-sm px-3 py-2 rounded-xl transition-colors ${isRevealed && opt.startsWith(q.correctAnswer) ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-medium" : "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400"}`}>
                            {opt}
                          </li>
                        ))}
                      </ul>
                    )}

                    {activeType === "trueFalse" && (
                      <div className="flex gap-2 mt-2">
                        <span className={`px-3 py-1 rounded-lg text-sm font-medium ${isRevealed && q.answer === true ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400" : "bg-gray-100 dark:bg-gray-800 text-gray-500"}`}>True</span>
                        <span className={`px-3 py-1 rounded-lg text-sm font-medium ${isRevealed && q.answer === false ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400" : "bg-gray-100 dark:bg-gray-800 text-gray-500"}`}>False</span>
                      </div>
                    )}
                  </div>
                </div>

                <AnimatePresence>
                  {isRevealed && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                      className="border-t border-gray-50 dark:border-gray-800 pt-3 mt-2">
                      <div className="bg-green-50 dark:bg-green-900/10 rounded-xl p-3">
                        <p className="text-xs font-semibold text-green-600 dark:text-green-400 mb-1">Answer</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{q.answer || q.correctAnswer}</p>
                        {q.keyPoints && (
                          <ul className="mt-2 space-y-1">
                            {q.keyPoints.map((kp: string, ki: number) => (
                              <li key={ki} className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-1.5">
                                <span className="text-green-500">•</span> {kp}
                              </li>
                            ))}
                          </ul>
                        )}
                        {q.explanation && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 italic">{q.explanation}</p>}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {canReveal && (
                  <button onClick={() => toggleReveal(q.id)}
                    className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-green-600 dark:hover:text-green-400 mt-2 transition-colors">
                    {isRevealed ? <><EyeOff className="w-3.5 h-3.5" /> Hide Answer</> : <><Eye className="w-3.5 h-3.5" /> Show Answer</>}
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}

        {currentQuestions.length === 0 && (
          <div className="text-center py-10 text-gray-400 dark:text-gray-600 text-sm">
            No questions available for this type.
          </div>
        )}
      </div>
    </div>
  );
}
