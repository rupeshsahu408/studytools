import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, CheckCircle, AlertCircle, Layers, RefreshCw } from "lucide-react";
import FeedbackButton from "./FeedbackButton";

interface FlashCard {
  id: string;
  front: string;
  back: string;
  category: string;
}

interface FlashCardsProps {
  cards: FlashCard[];
  onAllDone?: () => void;
  userId?: string;
  chapterId?: string;
  chapterName?: string;
  subject?: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  Formula:     "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
  Concept:     "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
  Definition:  "bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400",
  Law:         "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
  Application: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
};

export default function FlashCards({ cards, onAllDone, userId, chapterId, chapterName, subject }: FlashCardsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [knownIds, setKnownIds] = useState<Set<string>>(new Set());
  const [reviewIds, setReviewIds] = useState<Set<string>>(new Set());
  const [filterMode, setFilterMode] = useState<"all" | "review" | "known">("all");
  const [direction, setDirection] = useState<"left" | "right">("right");
  const calledDone = useRef(false);

  // Get active deck based on filter
  const activeDeck = cards.filter(c => {
    if (filterMode === "review") return reviewIds.has(c.id);
    if (filterMode === "known") return knownIds.has(c.id);
    return true;
  });

  const card = activeDeck[currentIndex];
  const total = activeDeck.length;

  // Reset index when filter changes
  useEffect(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [filterMode]);

  // Fire onAllDone when all cards are marked as known
  useEffect(() => {
    if (
      onAllDone &&
      !calledDone.current &&
      cards.length > 0 &&
      knownIds.size === cards.length
    ) {
      calledDone.current = true;
      onAllDone();
    }
  }, [knownIds, cards.length, onAllDone]);

  const goNext = (dir: "left" | "right" = "right") => {
    setDirection(dir);
    setIsFlipped(false);
    setTimeout(() => setCurrentIndex(i => Math.min(i + 1, total - 1)), 50);
  };

  const goPrev = () => {
    setDirection("left");
    setIsFlipped(false);
    setTimeout(() => setCurrentIndex(i => Math.max(i - 1, 0)), 50);
  };

  const markKnown = () => {
    if (!card) return;
    setKnownIds(prev => { const s = new Set(prev); s.add(card.id); return s; });
    setReviewIds(prev => { const s = new Set(prev); s.delete(card.id); return s; });
    if (currentIndex < total - 1) goNext();
  };

  const markReview = () => {
    if (!card) return;
    setReviewIds(prev => { const s = new Set(prev); s.add(card.id); return s; });
    setKnownIds(prev => { const s = new Set(prev); s.delete(card.id); return s; });
    if (currentIndex < total - 1) goNext();
  };

  const resetAll = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setKnownIds(new Set());
    setReviewIds(new Set());
    setFilterMode("all");
    calledDone.current = false;
  };

  const catStyle = card ? (CATEGORY_COLORS[card.category] || "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400") : "";
  const progressPct = total > 0 ? ((knownIds.size / cards.length) * 100) : 0;

  if (cards.length === 0) {
    return <div className="text-center py-10 text-gray-400 text-sm">No flash cards available.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Layers className="w-5 h-5 text-green-600" /> Flash Cards
          <span className="text-sm font-normal text-gray-400 ml-1">{cards.length} cards</span>
        </h2>
        <button onClick={resetAll} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-green-600 transition-colors">
          <RefreshCw className="w-3.5 h-3.5" /> Reset
        </button>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1.5">
          <div className="flex gap-3">
            <span className="text-xs text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> Known: {knownIds.size}
            </span>
            <span className="text-xs text-red-500 dark:text-red-400 font-medium flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> Review: {reviewIds.size}
            </span>
            <span className="text-xs text-gray-400 font-medium">
              Remaining: {cards.length - knownIds.size - reviewIds.size}
            </span>
          </div>
          <span className="text-xs text-gray-400">{Math.round(progressPct)}% known</span>
        </div>
        <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
          <motion.div
            className="h-full bg-green-500 rounded-full"
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* All-done celebration */}
      {knownIds.size === cards.length && cards.length > 0 && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-4 mb-4 text-center">
          <p className="text-green-700 dark:text-green-300 font-bold text-sm">🎉 Shabash! Saare cards complete ho gaye!</p>
          <p className="text-green-600 dark:text-green-400 text-xs mt-1">All {cards.length} flashcards marked as known.</p>
        </motion.div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5">
        {(["all", "review", "known"] as const).map(mode => (
          <button key={mode} onClick={() => setFilterMode(mode)}
            className={`flex-1 py-1.5 rounded-xl text-xs font-medium transition-all border ${
              filterMode === mode
                ? mode === "review" ? "bg-red-500 text-white border-red-500"
                  : mode === "known" ? "bg-green-600 text-white border-green-600"
                  : "bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 border-transparent"
                : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400"
            }`}>
            {mode === "all" ? `All (${cards.length})` : mode === "review" ? `Need Review (${reviewIds.size})` : `Known (${knownIds.size})`}
          </button>
        ))}
      </div>

      {/* Flash card */}
      {total === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800">
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {filterMode === "review" ? "No cards marked for review yet." : "No known cards yet."}
          </p>
        </div>
      ) : (
        <>
          {/* Card counter */}
          <div className="text-center text-xs text-gray-400 mb-3">
            Card {currentIndex + 1} of {total}
          </div>

          {/* 3D Flip Card */}
          <div
            className="relative h-64 cursor-pointer mb-5"
            style={{ perspective: "1000px" }}
            onClick={() => setIsFlipped(f => !f)}>
            <AnimatePresence mode="wait">
              <motion.div
                key={`${card?.id}-${currentIndex}`}
                initial={{ rotateY: direction === "right" ? 90 : -90, opacity: 0 }}
                animate={{ rotateY: 0, opacity: 1 }}
                exit={{ rotateY: direction === "right" ? -90 : 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ transformStyle: "preserve-3d" }}
                className="w-full h-full">
                <motion.div
                  animate={{ rotateY: isFlipped ? 180 : 0 }}
                  transition={{ duration: 0.35, ease: "easeInOut" }}
                  style={{ transformStyle: "preserve-3d" }}
                  className="w-full h-full">

                  {/* Front */}
                  <div className="absolute inset-0 bg-white dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center"
                    style={{ backfaceVisibility: "hidden" }}>
                    {card?.category && (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full mb-3 ${catStyle}`}>
                        {card.category}
                      </span>
                    )}
                    <p className="text-lg font-bold text-gray-900 dark:text-white leading-relaxed">{card?.front}</p>
                    <p className="text-xs text-gray-400 mt-4">Tap to reveal answer</p>
                    {card && (knownIds.has(card.id) || reviewIds.has(card.id)) && (
                      <div className="absolute top-3 right-3">
                        {knownIds.has(card.id)
                          ? <CheckCircle className="w-4 h-4 text-green-500" />
                          : <AlertCircle className="w-4 h-4 text-red-400" />
                        }
                      </div>
                    )}
                  </div>

                  {/* Back */}
                  <div className="absolute inset-0 bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center"
                    style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
                    <div className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-wide mb-3">Answer</div>
                    <p className="text-base text-gray-800 dark:text-gray-200 leading-relaxed">{card?.back}</p>
                    <p className="text-xs text-gray-400 mt-4">Tap to go back</p>
                    {/* Feedback button — only shown on back, only when feedback context provided */}
                    {userId && chapterId && chapterName && subject && card && (
                      <div className="absolute bottom-3 right-3" onClick={e => e.stopPropagation()}>
                        <FeedbackButton
                          userId={userId}
                          chapterId={chapterId}
                          chapterName={chapterName}
                          subject={subject}
                          type="flashcard"
                          itemId={card.id}
                          itemFront={card.front}
                          itemBack={card.back}
                        />
                      </div>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={goPrev} disabled={currentIndex === 0}
              className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-green-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <ChevronLeft className="w-4 h-4" /> Prev
            </button>

            <div className="flex gap-2">
              <button onClick={markReview}
                className="flex items-center gap-1.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-3 py-1.5 rounded-xl text-xs font-medium hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors">
                <AlertCircle className="w-3.5 h-3.5" /> Need Review
              </button>
              <button onClick={markKnown}
                className="flex items-center gap-1.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 px-3 py-1.5 rounded-xl text-xs font-medium hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors">
                <CheckCircle className="w-3.5 h-3.5" /> I Know This
              </button>
            </div>

            <button onClick={() => goNext()} disabled={currentIndex >= total - 1}
              className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-green-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <p className="text-center text-xs text-gray-300 dark:text-gray-700">
            Tap card to flip · Use arrows to navigate
          </p>
        </>
      )}
    </div>
  );
}
