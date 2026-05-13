import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import SEOHead from "../components/SEOHead";
import {
  Globe, Search, BookOpen, X, ChevronDown, ChevronUp,
  Loader2, Filter, ArrowLeft, Eye, Atom, FlaskConical,
  Calculator, Leaf, Users, Calendar, HelpCircle, Zap,
  Sigma, Network, Layers, AlertTriangle, Heart, Coins,
  CheckCircle2,
} from "lucide-react";
import TopHeader from "../components/TopHeader";
import BottomNav from "../components/BottomNav";
import {
  getAllPublicNotes, togglePublicNoteLike, sendCoinTip, getUserCoins,
  getUserLikedNotes, type PublicNote, type PublishableSection,
} from "../lib/firestore";
import { useAuth } from "../contexts/AuthContext";
import QuestionsView from "../components/QuestionsView";
import SummaryView from "../components/SummaryView";
import FormulaSheet from "../components/FormulaSheet";
import MindMap from "../components/MindMap";
import FlashCards from "../components/FlashCards";
import MistakesView from "../components/MistakesView";

// ─── Constants ────────────────────────────────────────────────────────────────

const BOARDS = [
  "Bihar Board", "UP Board", "MP Board", "Rajasthan Board",
  "Haryana Board", "Uttarakhand Board", "CBSE", "ICSE", "Other",
];

const PUBLIC_SUBJECTS = [
  "Physics", "Chemistry", "Biology", "Mathematics",
  "Social Science", "History", "Geography", "Political Science",
  "Economics", "Hindi", "English", "Computer Science", "Sanskrit", "Other",
];

const SUBJECT_ICONS: Record<string, any> = {
  Physics: Atom, Chemistry: FlaskConical, Mathematics: Calculator, Biology: Leaf,
};

const SUBJECT_COLORS: Record<string, string> = {
  Physics:     "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
  Chemistry:   "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
  Mathematics: "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400",
  Biology:     "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
};

const TIP_AMOUNTS = [1, 5, 10, 20, 50];

interface SectionTab {
  key: PublishableSection;
  label: string;
  icon: any;
  check: (n: PublicNote) => boolean;
  color: string;
  emptyMsg: string;
}

const SECTION_TABS: SectionTab[] = [
  {
    key: "notes",
    label: "Notes",
    icon: BookOpen,
    check: n => hasSection(n, "notes") && !!n.notes,
    color: "text-green-600 dark:text-green-400 border-green-500",
    emptyMsg: "Koi notes share nahi ki gayi abhi tak.",
  },
  {
    key: "questions",
    label: "Questions",
    icon: HelpCircle,
    check: n => hasSection(n, "questions") && !!n.questions,
    color: "text-blue-600 dark:text-blue-400 border-blue-500",
    emptyMsg: "Koi questions share nahi ki gayi abhi tak.",
  },
  {
    key: "summary",
    label: "Quick Revision",
    icon: Zap,
    check: n => hasSection(n, "summary") && !!n.summary,
    color: "text-amber-600 dark:text-amber-400 border-amber-500",
    emptyMsg: "Koi quick revision share nahi ki gayi abhi tak.",
  },
  {
    key: "formulas",
    label: "Formulas",
    icon: Sigma,
    check: n => hasSection(n, "formulas") && Array.isArray(n.formulas) && n.formulas.length > 0,
    color: "text-indigo-600 dark:text-indigo-400 border-indigo-500",
    emptyMsg: "Koi formula sheet share nahi ki gayi abhi tak.",
  },
  {
    key: "mindmap",
    label: "Concept Map",
    icon: Network,
    check: n => hasSection(n, "mindmap") && !!n.mindmap,
    color: "text-purple-600 dark:text-purple-400 border-purple-500",
    emptyMsg: "Koi concept map share nahi ki gayi abhi tak.",
  },
  {
    key: "flashcards",
    label: "Flash Cards",
    icon: Layers,
    check: n => hasSection(n, "flashcards") && Array.isArray(n.flashcards) && n.flashcards.length > 0,
    color: "text-teal-600 dark:text-teal-400 border-teal-500",
    emptyMsg: "Koi flash cards share nahi ki gayi abhi tak.",
  },
  {
    key: "mistakes",
    label: "Ye Galti Mat Karo",
    icon: AlertTriangle,
    check: n => hasSection(n, "mistakes") && Array.isArray(n.mistakes) && n.mistakes.length > 0,
    color: "text-red-600 dark:text-red-400 border-red-500",
    emptyMsg: "Koi common mistakes share nahi ki gayi abhi tak.",
  },
];

function hasSection(n: PublicNote, key: PublishableSection): boolean {
  if (!n.publishedSections) return key === "notes";
  return n.publishedSections.includes(key);
}

function formatDate(ts: any): string {
  if (!ts) return "";
  try {
    const d = ts.toDate ? ts.toDate() : new Date(ts.seconds ? ts.seconds * 1000 : ts);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch { return ""; }
}

// ─── Tip Modal ────────────────────────────────────────────────────────────────

function TipModal({
  note, myCoins, fromUid, onClose, onSuccess,
}: {
  note: PublicNote;
  myCoins: number;
  fromUid: string;
  onClose: () => void;
  onSuccess: (amount: number) => void;
}) {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const recipientLabel = note.publisherUsername
    ? `@${note.publisherUsername}`
    : note.publisherName;

  const handleSend = async () => {
    if (!selectedAmount) return;
    setSending(true);
    setError("");
    try {
      await sendCoinTip(fromUid, note.userId, note.id, selectedAmount);
      setSuccess(true);
      onSuccess(selectedAmount);
      setTimeout(onClose, 2200);
    } catch (err: any) {
      setError(err.message || "Kuch galat ho gaya. Dobara try karo.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-xs shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white text-base">Coins Bhejo</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {recipientLabel} ko support karo
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        {success ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-8 h-8 text-amber-500" />
            </div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-1">Bhej diya!</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {selectedAmount} coins {recipientLabel} ko successfully bheje gaye!
            </p>
          </div>
        ) : (
          <div className="p-5 space-y-4">

            {/* Balance display */}
            <div className="flex items-center justify-between bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/40 rounded-xl px-4 py-3">
              <span className="text-sm text-gray-600 dark:text-gray-400">Aapke paas</span>
              <div className="flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-amber-500" />
                <span className="font-bold text-amber-600 dark:text-amber-400">{myCoins} coins</span>
              </div>
            </div>

            {/* Amount picker */}
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                Amount choose karo
              </p>
              <div className="grid grid-cols-5 gap-1.5">
                {TIP_AMOUNTS.map(amt => {
                  const canAfford = myCoins >= amt;
                  const selected = selectedAmount === amt;
                  return (
                    <button
                      key={amt}
                      onClick={() => canAfford && setSelectedAmount(amt)}
                      disabled={!canAfford}
                      className={`py-2.5 rounded-xl text-sm font-bold transition-all ${
                        selected
                          ? "bg-amber-500 text-white shadow-md scale-105"
                          : canAfford
                            ? "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-amber-100 dark:hover:bg-amber-900/30 hover:text-amber-600 dark:hover:text-amber-400"
                            : "bg-gray-50 dark:bg-gray-800/50 text-gray-300 dark:text-gray-600 cursor-not-allowed"
                      }`}
                    >
                      {amt}
                    </button>
                  );
                })}
              </div>
              {myCoins === 0 && (
                <p className="text-xs text-red-500 dark:text-red-400 mt-2 text-center">
                  Aapke paas coins nahi hain abhi.
                </p>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="text-xs text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            {/* Send button */}
            <button
              onClick={handleSend}
              disabled={!selectedAmount || sending}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-all bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Coins className="w-4 h-4" />
                  {selectedAmount ? `${selectedAmount} Coins Bhejo` : "Amount choose karo"}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Notes Reader ─────────────────────────────────────────────────────────────

function NotesReader({ note }: { note: PublicNote }) {
  const [expandedTopics, setExpandedTopics] = useState<Set<number>>(new Set([0]));
  const notes = note.notes;
  const toggle = (i: number) => setExpandedTopics(prev => {
    const s = new Set(prev); s.has(i) ? s.delete(i) : s.add(i); return s;
  });
  if (!notes) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <p className="text-gray-500 dark:text-gray-400 text-sm">Notes content not available.</p>
      </div>
    );
  }
  return (
    <div className="p-4 sm:p-5 space-y-4">
      {notes.chapterOverview && (
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
          <h3 className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-wide mb-2">Chapter Overview</h3>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{notes.chapterOverview}</p>
        </div>
      )}
      {Array.isArray(notes.topics) && notes.topics.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Topics ({notes.topics.length})</h3>
          {notes.topics.map((topic: any, i: number) => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
              <button onClick={() => toggle(i)} className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <span className="text-sm font-semibold text-gray-900 dark:text-white leading-snug pr-2">{topic.title}</span>
                {expandedTopics.has(i) ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
              </button>
              {expandedTopics.has(i) && (
                <div className="px-4 pb-4 space-y-3 border-t border-gray-50 dark:border-gray-800 pt-3">
                  {topic.content && <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{topic.content}</p>}
                  {Array.isArray(topic.keyPoints) && topic.keyPoints.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-wide mb-1.5">Key Points</p>
                      <ul className="space-y-1">
                        {topic.keyPoints.map((pt: string, j: number) => (
                          <li key={j} className="text-sm text-gray-700 dark:text-gray-300 flex gap-2">
                            <span className="text-green-500 mt-0.5 flex-shrink-0">•</span><span>{pt}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {Array.isArray(topic.formulasUsed) && topic.formulasUsed.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1.5">Formulas</p>
                      <div className="space-y-1.5">
                        {topic.formulasUsed.map((f: any, j: number) => (
                          <div key={j} className="bg-blue-50 dark:bg-blue-900/20 rounded-lg px-3 py-2">
                            <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">{f.name}</p>
                            <p className="text-sm font-mono text-blue-800 dark:text-blue-200 mt-0.5">{f.formula}</p>
                            {f.explanation && <p className="text-xs text-blue-600/80 dark:text-blue-400/80 mt-0.5">{f.explanation}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {Array.isArray(topic.importantTerms) && topic.importantTerms.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wide mb-1.5">Important Terms</p>
                      <div className="space-y-1.5">
                        {topic.importantTerms.map((t: any, j: number) => (
                          <div key={j} className="text-sm">
                            <span className="font-semibold text-gray-900 dark:text-white">{t.term}: </span>
                            <span className="text-gray-600 dark:text-gray-400">{t.definition}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {notes.summary && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/40 rounded-xl p-4">
          <h3 className="text-xs font-bold text-green-700 dark:text-green-400 uppercase tracking-wide mb-2">Chapter Summary</h3>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{notes.summary}</p>
        </div>
      )}
      {Array.isArray(notes.examTips) && notes.examTips.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/40 rounded-xl p-4">
          <h3 className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-2">Exam Tips</h3>
          <ul className="space-y-1.5">
            {notes.examTips.map((tip: string, i: number) => (
              <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex gap-2">
                <span className="text-amber-500 mt-0.5 flex-shrink-0">★</span><span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <BottomNav />
    </div>
  );
}

// ─── Content Modal ────────────────────────────────────────────────────────────

function ContentModal({
  note, sectionKey, isLiked, likeCount, isOwnNote, myCoins, currentUserId,
  onClose, onLike, onTip,
}: {
  note: PublicNote;
  sectionKey: PublishableSection;
  isLiked: boolean;
  likeCount: number;
  isOwnNote: boolean;
  myCoins: number;
  currentUserId: string;
  onClose: () => void;
  onLike: () => void;
  onTip: () => void;
}) {
  const tab = SECTION_TABS.find(t => t.key === sectionKey)!;

  function renderBody() {
    switch (sectionKey) {
      case "notes":
        return <NotesReader note={note} />;

      case "questions":
        if (!note.questions) return <EmptyContent />;
        return (
          <div className="p-4 sm:p-5">
            <QuestionsView
              questions={note.questions}
              chapterName={note.chapterName}
              subject={note.subject}
            />
          </div>
        );

      case "summary":
        if (!note.summary) return <EmptyContent />;
        return (
          <div className="p-4 sm:p-5">
            <SummaryView
              summary={note.summary}
              chapterName={note.chapterName}
              subject={note.subject}
              classNum={note.classNum}
            />
          </div>
        );

      case "formulas":
        if (!note.formulas?.length) return <EmptyContent />;
        return (
          <div className="p-4 sm:p-5">
            <FormulaSheet
              formulas={note.formulas}
              chapterName={note.chapterName}
              subject={note.subject}
              classNum={note.classNum}
            />
          </div>
        );

      case "mindmap":
        if (!note.mindmap) return <EmptyContent />;
        return (
          <div className="p-4 sm:p-5">
            <MindMap
              mindmap={note.mindmap}
              chapterName={note.chapterName}
              subject={note.subject}
              classNum={note.classNum}
            />
          </div>
        );

      case "flashcards":
        if (!note.flashcards?.length) return <EmptyContent />;
        return (
          <div className="p-4 sm:p-5">
            <FlashCards
              cards={note.flashcards}
              chapterName={note.chapterName}
              subject={note.subject}
            />
          </div>
        );

      case "mistakes":
        if (!note.mistakes?.length) return <EmptyContent />;
        return (
          <div className="p-4 sm:p-5">
            <MistakesView mistakes={note.mistakes} />
          </div>
        );

      default:
        return <EmptyContent />;
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-gray-50 dark:bg-gray-950 w-full sm:max-w-3xl sm:rounded-2xl max-h-[95vh] sm:max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">

        {/* Header */}
        <div className="flex items-start justify-between p-4 sm:p-5 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex-shrink-0">
          <div className="flex-1 min-w-0 pr-3">
            <div className="flex items-center gap-1.5 mb-1">
              <tab.icon className={`w-3.5 h-3.5 flex-shrink-0 ${tab.color.split(" ")[0]}`} />
              <span className={`text-xs font-bold uppercase tracking-wide ${tab.color.split(" ")[0]}`}>{tab.label}</span>
            </div>
            <h2 className="font-bold text-gray-900 dark:text-white text-base leading-snug line-clamp-2">
              {note.chapterName}
            </h2>
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SUBJECT_COLORS[note.subject] || "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"}`}>
                {note.subject}
              </span>
              <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">Class {note.classNum}</span>
              <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">{note.board}</span>
              <span className="text-xs bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full">
                {note.medium === "hindi" ? "Hindi Medium" : "English Medium"}
              </span>
            </div>

            {/* Publisher */}
            <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 mt-1.5">
              <Users className="w-3 h-3 flex-shrink-0" />
              <span>By</span>
              {note.publisherUsername ? (
                <Link
                  to={`/u/${note.publisherUsername}`}
                  onClick={e => e.stopPropagation()}
                  className="text-green-600 dark:text-green-400 font-semibold hover:underline"
                >
                  @{note.publisherUsername}
                </Link>
              ) : (
                <span className="font-medium text-gray-500 dark:text-gray-400">{note.publisherName}</span>
              )}
              <span>· {formatDate(note.publishedAt)}</span>
            </div>

            {/* Like + Tip actions */}
            <div className="flex items-center gap-2 mt-3">
              {/* Like button — hidden for own notes (just show count) */}
              {isOwnNote ? (
                likeCount > 0 ? (
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-1.5">
                    <Heart className="w-3.5 h-3.5 fill-red-400 text-red-400" />
                    <span>{likeCount} {likeCount === 1 ? "like" : "likes"}</span>
                  </div>
                ) : null
              ) : (
                <button
                  onClick={onLike}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isLiked
                      ? "bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 border border-red-200 dark:border-red-800/40"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 dark:hover:text-red-400 border border-transparent"
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 transition-all ${isLiked ? "fill-current" : ""}`} />
                  <span>{likeCount > 0 ? likeCount : "Like"}</span>
                </button>
              )}

              {/* Tip button — only for other people's notes */}
              {!isOwnNote && (
                <button
                  onClick={onTip}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 border border-amber-200 dark:border-amber-800/40 transition-colors"
                >
                  <Coins className="w-3.5 h-3.5" />
                  Coins Bhejo
                </button>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {renderBody()}
        </div>
      </div>
    </div>
  );
}

function EmptyContent() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-14 h-14 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
        <BookOpen className="w-7 h-7 text-gray-300 dark:text-gray-600" />
      </div>
      <p className="text-sm text-gray-400 dark:text-gray-500">Content not available.</p>
    </div>
  );
}

// ─── Filter Select ────────────────────────────────────────────────────────────

function FilterSelect({ label, value, onChange, options, allLabel }: {
  label: string; value: string; onChange: (v: string) => void; options: string[]; allLabel: string;
}) {
  return (
    <div className="flex flex-col gap-1 min-w-0">
      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500/30 min-w-0"
      >
        <option value="">{allLabel}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────

function SectionCard({
  note, sectionKey, isLiked, likeCount, isOwnNote,
  onOpen, onLike,
}: {
  note: PublicNote;
  sectionKey: PublishableSection;
  isLiked: boolean;
  likeCount: number;
  isOwnNote: boolean;
  onOpen: () => void;
  onLike: () => void;
}) {
  const SubjectIcon = SUBJECT_ICONS[note.subject] || BookOpen;
  const colorClass = SUBJECT_COLORS[note.subject] || "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400";
  const tab = SECTION_TABS.find(t => t.key === sectionKey)!;

  function sectionDetail(): string {
    switch (sectionKey) {
      case "notes": {
        const count = Array.isArray(note.notes?.topics) ? note.notes.topics.length : 0;
        return count > 0 ? `${count} topics` : "Notes available";
      }
      case "questions": {
        if (!note.questions) return "Questions available";
        const total = Object.values(note.questions as Record<string, any[]>)
          .reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0);
        return `${total} questions`;
      }
      case "summary": {
        const rt = note.summary?.readTime;
        return rt ? `${rt} min read` : "Revision available";
      }
      case "formulas":
        return `${note.formulas?.length || 0} formulas`;
      case "mindmap":
        return "Concept map";
      case "flashcards":
        return `${note.flashcards?.length || 0} cards`;
      case "mistakes":
        return `${note.mistakes?.length || 0} common mistakes`;
      default:
        return "Available";
    }
  }

  return (
    <div
      onClick={onOpen}
      className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 cursor-pointer hover:border-green-300 dark:hover:border-green-700 hover:shadow-md transition-all group flex flex-col"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
          <SubjectIcon className="w-4.5 h-4.5" />
        </div>
        <div className="flex items-center gap-1.5">
          <tab.icon className={`w-3.5 h-3.5 ${tab.color.split(" ")[0]} opacity-60`} />
          <span className="text-xs bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full font-medium">
            {note.medium === "hindi" ? "Hindi" : "English"}
          </span>
        </div>
      </div>

      <p className="font-semibold text-gray-900 dark:text-white text-sm leading-snug mb-2 line-clamp-2">{note.chapterName}</p>

      <div className="flex flex-wrap gap-1 mb-3">
        <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">{note.subject}</span>
        <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">Class {note.classNum}</span>
        <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">{note.board}</span>
      </div>

      <div className="text-xs text-gray-400 dark:text-gray-500 mb-2">{sectionDetail()}</div>

      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 min-w-0">
          <Users className="w-3 h-3 flex-shrink-0" />
          {note.publisherUsername ? (
            <Link
              to={`/u/${note.publisherUsername}`}
              onClick={e => e.stopPropagation()}
              className="truncate max-w-[110px] text-green-600 dark:text-green-400 font-medium hover:underline"
            >
              @{note.publisherUsername}
            </Link>
          ) : (
            <span className="truncate max-w-[110px]">{note.publisherName}</span>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
          <Eye className="w-3 h-3" /> View
        </div>
      </div>

      {/* Bottom row: date + like button */}
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50 dark:border-gray-800/60">
        <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
          <Calendar className="w-3 h-3" />
          {formatDate(note.publishedAt)}
        </div>

        {/* Like button */}
        <button
          onClick={e => {
            e.stopPropagation();
            if (!isOwnNote) onLike();
          }}
          title={isOwnNote ? "Apni khud ki notes ko like nahi kar sakte" : isLiked ? "Unlike" : "Like"}
          className={`flex items-center gap-1 text-xs font-medium transition-colors px-2 py-1 rounded-lg ${
            isLiked
              ? "text-red-500 dark:text-red-400"
              : isOwnNote
                ? "text-gray-300 dark:text-gray-700 cursor-default"
                : "text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400"
          }`}
        >
          <Heart className={`w-3.5 h-3.5 transition-all ${isLiked ? "fill-current" : ""}`} />
          {likeCount > 0 && <span>{likeCount}</span>}
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PublicNotesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [allNotes, setAllNotes] = useState<PublicNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<PublishableSection>("notes");
  const [selectedNote, setSelectedNote] = useState<{ note: PublicNote; section: PublishableSection } | null>(null);
  const [search, setSearch] = useState("");
  const [filterBoard,   setFilterBoard]   = useState("");
  const [filterClass,   setFilterClass]   = useState("");
  const [filterMedium,  setFilterMedium]  = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Like state
  const [likedNotes, setLikedNotes] = useState<Record<string, boolean>>({});
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});

  // Coin / tip state
  const [tipTarget, setTipTarget] = useState<PublicNote | null>(null);
  const [myCoins, setMyCoins] = useState(0);

  // Load notes
  useEffect(() => {
    getAllPublicNotes(300)
      .then(setAllNotes)
      .catch(e => console.error("Failed to load public notes:", e))
      .finally(() => setLoading(false));
  }, []);

  // Initialize like state.
  // Source of truth for "did I like this?" is users/{uid}.likedNotes —
  // this works without any Firestore rule changes.
  // Like counts come from publicNotes.likeCount (populated once the updated
  // Firestore rule is deployed; falls back to 0 until then).
  useEffect(() => {
    if (!user || allNotes.length === 0) return;
    getUserLikedNotes(user.uid).then(likedNoteIds => {
      const liked: Record<string, boolean> = {};
      const counts: Record<string, number> = {};
      allNotes.forEach(n => {
        liked[n.id] = likedNoteIds.includes(n.id);
        counts[n.id] = n.likeCount ?? (n.likes?.length ?? 0);
      });
      setLikedNotes(liked);
      setLikeCounts(counts);
    }).catch(() => {});
  }, [allNotes, user]);

  // Load user's coin balance
  useEffect(() => {
    if (!user) return;
    getUserCoins(user.uid).then(setMyCoins).catch(() => {});
  }, [user]);

  // Handle like toggle
  const handleLike = async (noteId: string, noteOwnerId: string) => {
    if (!user || noteOwnerId === user.uid) return;
    const wasLiked = likedNotes[noteId] || false;
    const prevCount = likeCounts[noteId] || 0;
    // Optimistic update
    setLikedNotes(prev => ({ ...prev, [noteId]: !wasLiked }));
    setLikeCounts(prev => ({ ...prev, [noteId]: wasLiked ? Math.max(0, prevCount - 1) : prevCount + 1 }));
    try {
      await togglePublicNoteLike(noteId, user.uid);
    } catch {
      // Revert on failure
      setLikedNotes(prev => ({ ...prev, [noteId]: wasLiked }));
      setLikeCounts(prev => ({ ...prev, [noteId]: prevCount }));
    }
  };

  // Sync like state into selectedNote after like
  const handleLikeForNote = (noteId: string, noteOwnerId: string) => {
    handleLike(noteId, noteOwnerId);
  };

  // After a tip is sent, deduct from local coin balance
  const handleTipSuccess = (amount: number) => {
    setMyCoins(prev => Math.max(0, prev - amount));
  };

  const currentTab = SECTION_TABS.find(t => t.key === activeTab)!;

  const filtered = useMemo(() => {
    return allNotes.filter(n => {
      if (!currentTab.check(n)) return false;
      if (filterBoard   && n.board    !== filterBoard)   return false;
      if (filterClass   && n.classNum !== filterClass)   return false;
      if (filterMedium  && n.medium   !== filterMedium)  return false;
      if (filterSubject && n.subject  !== filterSubject) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!n.chapterName.toLowerCase().includes(q) &&
            !n.subject.toLowerCase().includes(q) &&
            !n.publisherName.toLowerCase().includes(q) &&
            !(n.publisherUsername || "").toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [allNotes, activeTab, filterBoard, filterClass, filterMedium, filterSubject, search]);

  const tabCounts = useMemo(() => {
    const counts: Partial<Record<PublishableSection, number>> = {};
    SECTION_TABS.forEach(t => {
      counts[t.key] = allNotes.filter(n => {
        if (!t.check(n)) return false;
        if (filterBoard   && n.board    !== filterBoard)   return false;
        if (filterClass   && n.classNum !== filterClass)   return false;
        if (filterMedium  && n.medium   !== filterMedium)  return false;
        if (filterSubject && n.subject  !== filterSubject) return false;
        if (search) {
          const q = search.toLowerCase();
          if (!n.chapterName.toLowerCase().includes(q) && !n.subject.toLowerCase().includes(q) && !n.publisherName.toLowerCase().includes(q) && !(n.publisherUsername || "").toLowerCase().includes(q)) return false;
        }
        return true;
      }).length;
    });
    return counts;
  }, [allNotes, filterBoard, filterClass, filterMedium, filterSubject, search]);

  const hasFilters = filterBoard || filterClass || filterMedium || filterSubject || search;
  const clearFilters = () => {
    setFilterBoard(""); setFilterClass(""); setFilterMedium(""); setFilterSubject(""); setSearch("");
  };

  const TabIcon = currentTab.icon;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <SEOHead
        title="Free Bihar Board & NCERT Study Notes — Community Library"
        description="Browse thousands of free AI-generated study notes shared by top Bihar Board & NCERT students. Find Class 11 & 12 notes for Physics, Chemistry, Mathematics and Biology. Filter by board, class, subject and medium."
        keywords="free NCERT study notes Bihar Board, Class 11 12 notes community, shared study notes India, Physics Chemistry Math Biology notes free, Bihar Board notes free download, NCERT chapter notes free"
        canonical="/public-notes"
      />
      <TopHeader title="Community Library" />
      <div className="pt-12 pb-20 max-w-6xl mx-auto px-4 py-4">

        {/* Header */}
        <div className="mb-6">
          <button onClick={() => navigate("/dashboard")} className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-green-600 mb-4 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
          </button>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
              <Globe className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Community Library</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Notes, questions, flashcards, formulas aur bahut kuch — sabka, sabke liye
              </p>
            </div>
          </div>
        </div>

        {/* Search + Filter toggle */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by chapter, subject, or student…"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/30"
            />
          </div>
          <button
            onClick={() => setShowFilters(f => !f)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
              hasFilters
                ? "border-green-400 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400"
                : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
            }`}
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filter</span>
            {hasFilters && <span className="w-1.5 h-1.5 rounded-full bg-green-500" />}
          </button>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Filters</span>
              {hasFilters && (
                <button onClick={clearFilters} className="text-xs text-green-600 hover:text-green-700 font-medium transition-colors flex items-center gap-1">
                  <X className="w-3 h-3" /> Clear all
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <FilterSelect label="Board"   value={filterBoard}   onChange={setFilterBoard}   options={BOARDS}              allLabel="All Boards"   />
              <FilterSelect label="Class"   value={filterClass}   onChange={setFilterClass}   options={["9","10","11","12"]} allLabel="All Classes"  />
              <FilterSelect label="Medium"  value={filterMedium}  onChange={setFilterMedium}  options={["hindi","english"]}  allLabel="All Mediums"  />
              <FilterSelect label="Subject" value={filterSubject} onChange={setFilterSubject} options={PUBLIC_SUBJECTS}       allLabel="All Subjects" />
            </div>
          </div>
        )}

        {/* Section tab bar */}
        <div className="overflow-x-auto mb-6">
          <div className="flex gap-1 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-1.5 min-w-max">
            {SECTION_TABS.map(tab => {
              const count = tabCounts[tab.key] ?? 0;
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                    active
                      ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                >
                  <tab.icon className={`w-3.5 h-3.5 flex-shrink-0 ${active ? tab.color.split(" ")[0] : ""}`} />
                  <span>{tab.label}</span>
                  {!loading && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                      active
                        ? "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500"
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Active tab header */}
        {!loading && (
          <div className="flex items-center gap-2 mb-4">
            <TabIcon className={`w-4 h-4 ${currentTab.color.split(" ")[0]}`} />
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {currentTab.label}
            </p>
            <span className="text-sm text-gray-400 dark:text-gray-500">
              — {filtered.length} entr{filtered.length !== 1 ? "ies" : "y"}
              {hasFilters ? " found" : " in the community"}
            </span>
            {hasFilters && (
              <button onClick={clearFilters} className="ml-auto text-xs text-green-600 hover:text-green-700 font-medium transition-colors flex items-center gap-1">
                <X className="w-3 h-3" /> Clear filters
              </button>
            )}
          </div>
        )}

        {/* Content grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="h-44 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <TabIcon className="w-8 h-8 text-gray-300 dark:text-gray-600" />
            </div>
            <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-1">
              {hasFilters ? "Koi result nahi mila" : "Abhi available nahi hai"}
            </h3>
            <p className="text-sm text-gray-400 dark:text-gray-500 max-w-xs">
              {hasFilters
                ? "Filters change ya clear karke dobara try karo."
                : currentTab.emptyMsg}
            </p>
            {hasFilters && (
              <button onClick={clearFilters} className="mt-4 text-sm text-green-600 hover:text-green-700 font-medium transition-colors">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(note => (
              <SectionCard
                key={`${note.id}-${activeTab}`}
                note={note}
                sectionKey={activeTab}
                isLiked={likedNotes[note.id] || false}
                likeCount={likeCounts[note.id] || 0}
                isOwnNote={user?.uid === note.userId}
                onOpen={() => setSelectedNote({ note, section: activeTab })}
                onLike={() => handleLikeForNote(note.id, note.userId)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Content reader modal */}
      {selectedNote && (
        <ContentModal
          note={selectedNote.note}
          sectionKey={selectedNote.section}
          isLiked={likedNotes[selectedNote.note.id] || false}
          likeCount={likeCounts[selectedNote.note.id] || 0}
          isOwnNote={user?.uid === selectedNote.note.userId}
          myCoins={myCoins}
          currentUserId={user?.uid || ""}
          onClose={() => setSelectedNote(null)}
          onLike={() => handleLikeForNote(selectedNote.note.id, selectedNote.note.userId)}
          onTip={() => setTipTarget(selectedNote.note)}
        />
      )}

      {/* Tip modal */}
      {tipTarget && user && (
        <TipModal
          note={tipTarget}
          myCoins={myCoins}
          fromUid={user.uid}
          onClose={() => setTipTarget(null)}
          onSuccess={handleTipSuccess}
        />
      )}
      <BottomNav />
    </div>
  );
}
