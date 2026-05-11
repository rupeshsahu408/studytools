import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Clock, CheckCircle, Trophy, FileText, ThumbsUp, ThumbsDown } from "lucide-react";
import FeedbackButton from "./FeedbackButton";

const Q_TYPES = [
  { key: "mcq",             label: "MCQ",             color: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" },
  { key: "oneMarks",        label: "1 Mark",           color: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300" },
  { key: "twoMarks",        label: "2 Marks",          color: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300" },
  { key: "fiveMarks",       label: "5 Marks",          color: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300" },
  { key: "assertionReason", label: "Assertion-Reason", color: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300" },
  { key: "caseBased",       label: "Case Based",       color: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300" },
  { key: "trueFalse",       label: "True/False",       color: "bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300" },
  { key: "fillBlanks",      label: "Fill Blanks",      color: "bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300" },
  { key: "examImportant",   label: "Exam Important",   color: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300" },
];

interface QuestionsViewProps {
  questions: Record<string, any[]>;
  onQuestionAnswered?: (isWrong: boolean, question: { id: string; question: string; type: string }) => void;
  userId?: string;
  chapterId?: string;
  chapterName?: string;
  subject?: string;
}

export default function QuestionsView({ questions, onQuestionAnswered, userId, chapterId, chapterName, subject }: QuestionsViewProps) {
  const [activeType, setActiveType] = useState(() => {
    const first = Q_TYPES.find(t => (questions[t.key]?.length || 0) > 0);
    return first?.key || "mcq";
  });
  const [mode, setMode] = useState<"practice" | "test">("practice");
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [testStarted, setTestStarted] = useState(false);
  const [testDone, setTestDone] = useState(false);
  const [testMinutes, setTestMinutes] = useState(15);
  const [timerRef, setTimerRef] = useState<any>(null);

  // Phase 4: track which questions have been answered right/wrong
  const [answeredMap, setAnsweredMap] = useState<Map<string, "right" | "wrong">>(new Map());

  const currentQuestions = questions[activeType] || [];
  const isCaseBased = activeType === "caseBased";

  const getAllIdsForCurrentType = () => {
    if (isCaseBased) {
      return (currentQuestions as any[]).flatMap((set: any) =>
        (set.questions || []).map((q: any) => q.id)
      );
    }
    return currentQuestions.map((q: any) => q.id);
  };

  const toggleReveal = (id: string) => {
    setRevealedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const revealAll = () => setRevealedIds(new Set(getAllIdsForCurrentType()));
  const hideAll = () => setRevealedIds(new Set());

  const startTest = () => {
    setRevealedIds(new Set());
    setTestDone(false);
    setTestStarted(true);
    let secs = testMinutes * 60;
    setTimeLeft(secs);
    const allIds = getAllIdsForCurrentType();
    const t = setInterval(() => {
      secs--;
      setTimeLeft(secs);
      if (secs <= 0) {
        clearInterval(t);
        setTestDone(true);
        setTestStarted(false);
        setRevealedIds(new Set(allIds));
      }
    }, 1000);
    setTimerRef(t);
  };

  const endTest = () => {
    if (timerRef) clearInterval(timerRef);
    setTestDone(true);
    setTestStarted(false);
    setRevealedIds(new Set(getAllIdsForCurrentType()));
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const switchType = (key: string) => {
    setActiveType(key);
    setRevealedIds(new Set());
    setTestStarted(false);
    setTestDone(false);
    if (timerRef) clearInterval(timerRef);
  };

  const handleMarkAnswer = (
    isWrong: boolean,
    q: any,
    type: string,
    existingAnswer: "right" | "wrong" | undefined
  ) => {
    // Don't double-count if already answered the same way
    const newAnswer: "right" | "wrong" = isWrong ? "wrong" : "right";
    if (existingAnswer === newAnswer) return;

    setAnsweredMap(prev => {
      const next = new Map(prev);
      next.set(q.id, newAnswer);
      return next;
    });

    if (onQuestionAnswered) {
      const questionText = q.question || q.statement || q.assertion || "";
      onQuestionAnswered(isWrong, {
        id: q.id,
        question: questionText.slice(0, 200),
        type,
      });
    }
  };

  const totalQuestions = Object.entries(questions).reduce((sum: number, [key, arr]: [string, any]) => {
    if (!arr) return sum;
    if (key === "caseBased") {
      return sum + (arr as any[]).reduce((s: number, set: any) => s + (set.questions?.length || 0), 0);
    }
    return sum + (arr as any[]).length;
  }, 0);

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Trophy className="w-5 h-5 text-green-600" /> Question Bank
          <span className="text-sm font-normal text-gray-400 ml-1">{totalQuestions} total questions</span>
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => { setMode("practice"); setTestStarted(false); setTestDone(false); if (timerRef) clearInterval(timerRef); setRevealedIds(new Set()); }}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${mode === "practice" ? "bg-green-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"}`}>
            Practice
          </button>
          <button
            onClick={() => { setMode("test"); setTestStarted(false); setTestDone(false); setRevealedIds(new Set()); }}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${mode === "test" ? "bg-green-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"}`}>
            Timed Test
          </button>
        </div>
      </div>

      {/* Question type tabs */}
      <div className="flex gap-2 flex-wrap mb-5">
        {Q_TYPES.map(t => {
          const count = questions[t.key]?.length || 0;
          if (!count) return null;
          return (
            <button key={t.key} onClick={() => switchType(t.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${activeType === t.key ? `${t.color} border-current` : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300"}`}>
              {t.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Timed test controls */}
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

      {/* Practice mode reveal controls */}
      {mode === "practice" && currentQuestions.length > 0 && (
        <div className="flex gap-2 mb-4">
          <button onClick={revealAll} className="text-xs flex items-center gap-1.5 text-gray-500 hover:text-green-600 transition-colors">
            <Eye className="w-3.5 h-3.5" /> Show All Answers
          </button>
          <span className="text-gray-200 dark:text-gray-700">|</span>
          <button onClick={hideAll} className="text-xs flex items-center gap-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
            <EyeOff className="w-3.5 h-3.5" /> Hide All
          </button>
          {onQuestionAnswered && (
            <>
              <span className="text-gray-200 dark:text-gray-700">|</span>
              <span className="text-xs text-gray-400 dark:text-gray-500 italic">
                Mark right/wrong after revealing to track progress
              </span>
            </>
          )}
        </div>
      )}

      {/* ── CASE BASED QUESTIONS ── */}
      {isCaseBased ? (
        <div className="space-y-6">
          {(currentQuestions as any[]).map((set: any, setIdx: number) => (
            <motion.div key={set.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: setIdx * 0.06 }}
              className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-3 bg-indigo-50 dark:bg-indigo-900/20 border-b border-indigo-100 dark:border-indigo-800/30">
                <FileText className="w-4 h-4 text-indigo-500 dark:text-indigo-400 flex-shrink-0" />
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  Case Study {setIdx + 1}
                </span>
                <span className="ml-auto text-xs text-indigo-400 dark:text-indigo-500">
                  {set.questions?.length || 4} sub-questions · {(set.questions || []).reduce((s: number, q: any) => s + (q.marks || 0), 0)} marks
                </span>
              </div>

              <div className="px-5 pt-4 pb-3">
                <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4">
                  {set.paragraph}
                </p>
              </div>

              <div className="px-5 pb-5 space-y-3">
                {(set.questions || []).map((q: any, qIdx: number) => {
                  const isRevealed = revealedIds.has(q.id) || (mode === "test" && testDone);
                  const canReveal = mode === "practice" || (mode === "test" && testDone);
                  const answered = answeredMap.get(q.id);
                  return (
                    <div key={q.id} className="border border-gray-100 dark:border-gray-700 rounded-xl p-4 bg-gray-50/50 dark:bg-gray-800/50">
                      <div className="flex items-start gap-3">
                        <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                          {qIdx + 1}
                        </span>
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white leading-relaxed">{q.question}</p>
                            <span className="text-xs text-indigo-500 dark:text-indigo-400 font-semibold flex-shrink-0 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-full">
                              [{q.marks}M]
                            </span>
                          </div>

                          <AnimatePresence>
                            {isRevealed && (
                              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-2">
                                <div className="bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800/30 rounded-xl p-3">
                                  <p className="text-xs font-semibold text-green-600 dark:text-green-400 mb-1">Answer</p>
                                  <p className="text-sm text-gray-700 dark:text-gray-300">{q.answer}</p>
                                </div>
                                {/* Right/Wrong buttons */}
                                {onQuestionAnswered && (
                                  <div className="flex items-center gap-2 mt-2">
                                    <span className="text-xs text-gray-400 dark:text-gray-500">How did you do?</span>
                                    <button
                                      onClick={() => handleMarkAnswer(false, q, "caseBased", answered)}
                                      className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
                                        answered === "right"
                                          ? "bg-green-600 text-white"
                                          : "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800 hover:bg-green-100"
                                      }`}>
                                      <ThumbsUp className="w-3 h-3" /> Sahi
                                    </button>
                                    <button
                                      onClick={() => handleMarkAnswer(true, q, "caseBased", answered)}
                                      className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
                                        answered === "wrong"
                                          ? "bg-red-500 text-white"
                                          : "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-100"
                                      }`}>
                                      <ThumbsDown className="w-3 h-3" /> Galat
                                    </button>
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>

                          <div className="flex items-center justify-between mt-2">
                            {canReveal && (
                              <button onClick={() => toggleReveal(q.id)}
                                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors">
                                {isRevealed ? <><EyeOff className="w-3.5 h-3.5" /> Hide Answer</> : <><Eye className="w-3.5 h-3.5" /> Show Answer</>}
                              </button>
                            )}
                            {isRevealed && userId && chapterId && chapterName && subject && (
                              <FeedbackButton
                                userId={userId}
                                chapterId={chapterId}
                                chapterName={chapterName}
                                subject={subject}
                                type="question"
                                itemId={q.id}
                                itemFront={q.question || ""}
                                itemBack={q.answer || ""}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ))}
          {currentQuestions.length === 0 && (
            <div className="text-center py-10 text-gray-400 dark:text-gray-600 text-sm">No case-based questions available.</div>
          )}
        </div>
      ) : (
        /* ── ALL OTHER QUESTION TYPES ── */
        <div className="space-y-3">
          {currentQuestions.map((q: any, i: number) => {
            const isRevealed = revealedIds.has(q.id) || (mode === "test" && testDone);
            const canReveal = mode === "practice" || (mode === "test" && testDone);
            const answered = answeredMap.get(q.id);

            return (
              <motion.div key={q.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      answered === "right" ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                      : answered === "wrong" ? "bg-red-100 dark:bg-red-900/30 text-red-500 dark:text-red-400"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                    }`}>
                      {answered === "right" ? "✓" : answered === "wrong" ? "✗" : i + 1}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white leading-relaxed">
                        {q.question || q.statement || q.assertion}
                      </p>

                      {activeType === "assertionReason" && q.reason && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1.5">
                          <span className="font-medium">Reason:</span> {q.reason}
                        </p>
                      )}

                      {(activeType === "mcq" || activeType === "assertionReason") && q.options && (
                        <ul className="mt-3 space-y-1.5">
                          {q.options.map((opt: string, oi: number) => (
                            <li key={oi}
                              className={`text-sm px-3 py-2 rounded-xl transition-colors ${isRevealed && opt.startsWith(q.correctAnswer) ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-medium" : "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400"}`}>
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

                      {activeType === "examImportant" && q.marks && (
                        <span className="inline-block mt-1.5 text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-medium">
                          {q.marks} Marks
                        </span>
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
                          {q.explanation && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 italic">{q.explanation}</p>
                          )}
                        </div>

                        {/* Right/Wrong tracking buttons */}
                        {onQuestionAnswered && (
                          <div className="flex items-center gap-2 mt-3">
                            <span className="text-xs text-gray-400 dark:text-gray-500">How did you do?</span>
                            <button
                              onClick={() => handleMarkAnswer(false, q, activeType, answered)}
                              className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
                                answered === "right"
                                  ? "bg-green-600 text-white shadow-sm"
                                  : "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/40"
                              }`}>
                              <ThumbsUp className="w-3 h-3" /> Sahi tha
                            </button>
                            <button
                              onClick={() => handleMarkAnswer(true, q, activeType, answered)}
                              className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
                                answered === "wrong"
                                  ? "bg-red-500 text-white shadow-sm"
                                  : "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/40"
                              }`}>
                              <ThumbsDown className="w-3 h-3" /> Galat tha
                            </button>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex items-center justify-between mt-2">
                    {canReveal && (
                      <button onClick={() => toggleReveal(q.id)}
                        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors">
                        {isRevealed ? <><EyeOff className="w-3.5 h-3.5" /> Hide Answer</> : <><Eye className="w-3.5 h-3.5" /> Show Answer</>}
                      </button>
                    )}
                    {isRevealed && userId && chapterId && chapterName && subject && (
                      <FeedbackButton
                        userId={userId}
                        chapterId={chapterId}
                        chapterName={chapterName}
                        subject={subject}
                        type="question"
                        itemId={q.id}
                        itemFront={q.question || q.statement || q.assertion || ""}
                        itemBack={q.answer || q.correctAnswer || ""}
                      />
                    )}
                  </div>
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
      )}
    </div>
  );
}
