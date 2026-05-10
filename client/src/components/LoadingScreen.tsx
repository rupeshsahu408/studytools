import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const STUDY_TIPS = [
  "Bihar Board toppers revise each chapter at least 3 times before the exam.",
  "Writing answers by hand improves memory retention by up to 60%.",
  "5-mark questions carry nearly 30% of total board exam marks.",
  "Practicing MCQs daily for 20 minutes improves accuracy significantly.",
  "Understanding concepts is more powerful than memorizing answers.",
  "Attempt all questions in the board exam — never leave any blank.",
  "Time management: spend max 8 minutes on a 5-mark question.",
  "The first and last pages of your answer sheet create the strongest impression.",
  "Draw neat diagrams — they can fetch full marks even with a simple explanation.",
  "Revising your notes 24 hours after reading helps you remember 80% longer.",
];

const STAGES = [
  { label: "Reading your chapter...", progress: 15 },
  { label: "Detecting language...", progress: 25 },
  { label: "Understanding key concepts...", progress: 40 },
  { label: "Writing structured notes...", progress: 60 },
  { label: "Creating question bank...", progress: 80 },
  { label: "Almost done...", progress: 95 },
];

interface LoadingScreenProps {
  stage?: number;
  message?: string;
}

export default function LoadingScreen({ stage = 0, message }: LoadingScreenProps) {
  const [tipIndex, setTipIndex] = useState(0);
  const [dots, setDots] = useState(".");

  useEffect(() => {
    const tipTimer = setInterval(() => {
      setTipIndex(i => (i + 1) % STUDY_TIPS.length);
    }, 3500);
    const dotTimer = setInterval(() => {
      setDots(d => d.length >= 3 ? "." : d + ".");
    }, 500);
    return () => { clearInterval(tipTimer); clearInterval(dotTimer); };
  }, []);

  const currentStage = STAGES[Math.min(stage, STAGES.length - 1)];

  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-950 z-50 flex flex-col items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-lg w-full">
        <div className="mb-8">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <motion.div
              className="absolute inset-0 rounded-full border-4 border-green-200 dark:border-green-900"
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="absolute inset-0 rounded-full border-4 border-transparent border-t-green-600"
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl">🎓</span>
            </div>
          </div>

          <motion.h2 key={stage} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
            {message || currentStage.label}{dots}
          </motion.h2>

          <div className="w-64 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full h-2 mt-4 mb-2 overflow-hidden">
            <motion.div
              className="h-full bg-green-600 rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: `${currentStage.progress}%` }}
              transition={{ duration: 1, ease: "easeInOut" }}
            />
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500">{currentStage.progress}% complete</p>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-2xl p-5">
          <p className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wide mb-2">Topper Tip</p>
          <AnimatePresence mode="wait">
            <motion.p key={tipIndex} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {STUDY_TIPS[tipIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

        <p className="text-xs text-gray-400 dark:text-gray-600 mt-6">
          This usually takes 30–60 seconds. Please don't close this tab.
        </p>
      </motion.div>
    </div>
  );
}
