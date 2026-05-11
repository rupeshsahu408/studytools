import { useState, useRef, useEffect } from "react";
import { Flag, X, Send, CheckCircle, Loader2 } from "lucide-react";
import { submitFeedback, type FeedbackReason } from "../lib/firestore";

interface FeedbackButtonProps {
  userId: string;
  chapterId: string;
  chapterName: string;
  subject: string;
  type: "flashcard" | "question";
  itemId: string;
  itemFront: string;
  itemBack: string;
}

const REASONS: { key: FeedbackReason; label: string; emoji: string }[] = [
  { key: "garbled_hindi", label: "Garbled Hindi",    emoji: "🔤" },
  { key: "wrong_answer",  label: "Wrong Answer",     emoji: "❌" },
  { key: "incomplete",    label: "Incomplete",        emoji: "📝" },
  { key: "other",         label: "Other Issue",       emoji: "💬" },
];

export default function FeedbackButton({
  userId, chapterId, chapterName, subject, type, itemId, itemFront, itemBack,
}: FeedbackButtonProps) {
  const [open, setOpen]         = useState(false);
  const [reason, setReason]     = useState<FeedbackReason | null>(null);
  const [note, setNote]         = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone]         = useState(false);
  const popoverRef              = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Auto-close after success
  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => {
      setOpen(false);
      setDone(false);
      setReason(null);
      setNote("");
    }, 2000);
    return () => clearTimeout(t);
  }, [done]);

  const handleSubmit = async () => {
    if (!reason) return;
    setSubmitting(true);
    try {
      await submitFeedback({
        userId, chapterId, chapterName, subject, type, itemId,
        itemFront: itemFront.slice(0, 300),
        itemBack: itemBack.slice(0, 500),
        reason,
        note: note.trim().slice(0, 300),
      });
      setDone(true);
    } catch (e) {
      console.error("Feedback submit failed:", e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative inline-block" ref={popoverRef}>
      {/* Trigger button */}
      <button
        onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
        title="Report an issue with this content"
        className="flex items-center gap-1 text-xs text-gray-300 dark:text-gray-600 hover:text-red-400 dark:hover:text-red-400 transition-colors px-1.5 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
      >
        <Flag className="w-3 h-3" />
        <span className="hidden sm:inline">Report</span>
      </button>

      {/* Popover */}
      {open && (
        <div
          className="absolute z-50 bottom-full mb-2 right-0 w-72 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl p-4"
          onClick={e => e.stopPropagation()}
        >
          {done ? (
            <div className="flex flex-col items-center justify-center py-3 gap-2">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <p className="text-sm font-semibold text-gray-800 dark:text-white">Shukriya! 🙏</p>
              <p className="text-xs text-gray-400 text-center">Your feedback helps us improve the content.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-gray-800 dark:text-white flex items-center gap-1.5">
                  <Flag className="w-3.5 h-3.5 text-red-400" /> Report an Issue
                </p>
                <button onClick={() => setOpen(false)} className="text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Reason chips */}
              <p className="text-xs text-gray-400 mb-2">What's wrong?</p>
              <div className="grid grid-cols-2 gap-1.5 mb-3">
                {REASONS.map(r => (
                  <button
                    key={r.key}
                    onClick={() => setReason(r.key)}
                    className={`flex items-center gap-1.5 text-xs px-2.5 py-2 rounded-xl border font-medium transition-all ${
                      reason === r.key
                        ? "bg-red-500 text-white border-red-500"
                        : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-red-300 dark:hover:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                    }`}
                  >
                    <span>{r.emoji}</span> {r.label}
                  </button>
                ))}
              </div>

              {/* Optional note */}
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Optional: Add more details..."
                rows={2}
                className="w-full text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-700 dark:text-gray-300 placeholder-gray-400 resize-none focus:outline-none focus:border-green-400 dark:focus:border-green-600 mb-3"
              />

              <button
                onClick={handleSubmit}
                disabled={!reason || submitting}
                className="w-full flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors"
              >
                {submitting
                  ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending...</>
                  : <><Send className="w-3.5 h-3.5" /> Submit Feedback</>
                }
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
