import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus, BookOpen, Trash2, ChevronRight, FlaskConical,
  Calculator, Leaf, Atom, Flame, Target, BarChart2,
  UserCircle, TrendingUp, Loader2, RefreshCw, AlertTriangle,
  Globe, X, CheckCircle,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useProgress } from "../contexts/ProgressContext";
import {
  deleteChapter, updateChapterSection,
  publishNote, unpublishNote, getMyPublishedNotes,
} from "../lib/firestore";
import { generateNotes, generateQuestions } from "../lib/api";
import type { Chapter } from "../lib/firestore";
import Navbar from "../components/Navbar";

// ─── Constants ────────────────────────────────────────────────────────────────

const SUBJECT_ICONS: Record<string, any> = {
  Physics: Atom, Chemistry: FlaskConical, Mathematics: Calculator, Biology: Leaf,
};

const SUBJECT_COLORS: Record<string, string> = {
  Physics:     "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
  Chemistry:   "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
  Mathematics: "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400",
  Biology:     "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
};

const BOARDS = [
  "Bihar Board", "UP Board", "MP Board", "Rajasthan Board",
  "Haryana Board", "Uttarakhand Board", "CBSE", "ICSE", "Other",
];

const PUBLIC_SUBJECTS = [
  "Physics", "Chemistry", "Biology", "Mathematics",
  "Social Science", "History", "Geography", "Political Science",
  "Economics", "Hindi", "English", "Computer Science", "Sanskrit", "Other",
];

const MAX_CHAPTERS = 5;

function getChapterCompletion(chapter: Chapter): number {
  const flags = [
    chapter.notesRead ? 1 : 0,
    (chapter.questionsAttempted || 0) > 0 ? 1 : 0,
    chapter.flashcardsDone ? 1 : 0,
    chapter.simulationsSeen ? 1 : 0,
  ];
  return Math.round((flags.reduce((a, b) => a + b, 0) / 4) * 100);
}

function hasNoQuestions(questions: any): boolean {
  if (!questions) return true;
  return Object.values(questions).every((arr: any) => !Array.isArray(arr) || arr.length === 0);
}

// ─── Publish Modal ────────────────────────────────────────────────────────────

interface PublishForm {
  board: string;
  classNum: string;
  medium: string;
  subject: string;
}

function PublishModal({
  chapter,
  isPublished,
  onPublish,
  onUnpublish,
  onClose,
  publishing,
  unpublishing,
}: {
  chapter: Chapter;
  isPublished: boolean;
  onPublish: (form: PublishForm) => void;
  onUnpublish: () => void;
  onClose: () => void;
  publishing: boolean;
  unpublishing: boolean;
}) {
  const [form, setForm] = useState<PublishForm>({
    board:    "Bihar Board",
    classNum: chapter.classNum || "11",
    medium:   chapter.language === "hindi" ? "hindi" : "english",
    subject:  PUBLIC_SUBJECTS.includes(chapter.subject) ? chapter.subject : "Physics",
  });

  const set = (key: keyof PublishForm) => (e: React.ChangeEvent<HTMLSelectElement>) =>
    setForm(p => ({ ...p, [key]: e.target.value }));

  const selectClass = "w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500/30";
  const labelClass  = "text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 block";

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-2xl border border-gray-100 dark:border-gray-800"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-start justify-between p-5 pb-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isPublished ? "bg-green-100 dark:bg-green-900/30" : "bg-green-100 dark:bg-green-900/30"
            }`}>
              <Globe className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-base">
                {isPublished ? "Published to Community" : "Publish to Community"}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {isPublished ? "Your content is live for everyone" : "Share all generated content with students"}
              </p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Chapter label */}
        <div className="px-5 pb-3">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2.5">
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Chapter</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{chapter.chapterName}</p>
          </div>
        </div>

        {isPublished ? (
          /* ── Already published — show status + unpublish ── */
          <div className="px-5 pb-5">
            <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/40 rounded-xl px-3 py-3 mb-4">
              <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
              <p className="text-sm text-green-700 dark:text-green-400 font-medium">
                Visible in Community Notes
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                Close
              </button>
              <button onClick={onUnpublish} disabled={unpublishing}
                className="flex-1 px-4 py-2.5 rounded-xl border border-red-200 dark:border-red-800/50 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                {unpublishing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {unpublishing ? "Removing..." : "Unpublish"}
              </button>
            </div>
          </div>
        ) : (
          /* ── Publish form ── */
          <div className="px-5 pb-5 space-y-3">
            {/* Board */}
            <div>
              <label className={labelClass}>Board</label>
              <select value={form.board} onChange={set("board")} className={selectClass}>
                {BOARDS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>

            {/* Class */}
            <div>
              <label className={labelClass}>Class</label>
              <select value={form.classNum} onChange={set("classNum")} className={selectClass}>
                {["9","10","11","12"].map(c => <option key={c} value={c}>Class {c}</option>)}
              </select>
            </div>

            {/* Medium */}
            <div>
              <label className={labelClass}>Medium</label>
              <select value={form.medium} onChange={set("medium")} className={selectClass}>
                <option value="hindi">Hindi Medium</option>
                <option value="english">English Medium</option>
              </select>
            </div>

            {/* Subject */}
            <div>
              <label className={labelClass}>Subject</label>
              <select value={form.subject} onChange={set("subject")} className={selectClass}>
                {PUBLIC_SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1.5 pt-1">
              <Globe className="w-3 h-3 flex-shrink-0" />
              All generated content (notes, questions, flashcards, etc.) will be shared
            </p>

            <div className="flex gap-2 pt-1">
              <button onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                Cancel
              </button>
              <button onClick={() => onPublish(form)} disabled={publishing}
                className="flex-1 px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                {publishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Globe className="w-3.5 h-3.5" />}
                {publishing ? "Publishing..." : "Publish to Community"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { userData, chapters, loadingUser, refreshChapters } = useProgress();

  const [deletingId,           setDeletingId]           = useState<string | null>(null);
  const [retryingNotesId,      setRetryingNotesId]      = useState<string | null>(null);
  const [retryingQuestionsId,  setRetryingQuestionsId]  = useState<string | null>(null);
  const [retryError,           setRetryError]           = useState<string | null>(null);

  // ── Publish state ──────────────────────────────────────────────────────────
  const [publishedIds,  setPublishedIds]  = useState<Set<string>>(new Set());
  const [publishModal,  setPublishModal]  = useState<Chapter | null>(null);
  const [publishing,    setPublishing]    = useState(false);
  const [unpublishing,  setUnpublishing]  = useState(false);

  // Load which of the user's chapters are already published
  useEffect(() => {
    if (!user) return;
    getMyPublishedNotes(user.uid)
      .then(notes => setPublishedIds(new Set(notes.map(n => n.chapterId))))
      .catch(() => {});
  }, [user]);

  useEffect(() => { refreshChapters(); }, []);

  // ── Chapter actions ────────────────────────────────────────────────────────

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this chapter? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await deleteChapter(id);
      await refreshChapters();
    } catch (e) { console.error(e); }
    finally     { setDeletingId(null); }
  };

  const handleRetryNotes = async (chapter: Chapter, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!chapter.text) { setRetryError("Chapter text unavailable — please re-upload the PDF."); return; }
    setRetryError(null);
    setRetryingNotesId(chapter.id);
    try {
      const r = await generateNotes(chapter.text, chapter.subject, chapter.classNum, chapter.chapterName, chapter.language);
      if (r?.notes) { await updateChapterSection(chapter.id, "notes", r.notes); await refreshChapters(); }
    } catch (err: any) {
      console.error("[dashboard] Notes retry failed:", err?.message);
      setRetryError("Notes generation failed. Please try again in a moment.");
    } finally { setRetryingNotesId(null); }
  };

  const handleRetryQuestions = async (chapter: Chapter, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!chapter.text) { setRetryError("Chapter text unavailable — please re-upload the PDF."); return; }
    setRetryError(null);
    setRetryingQuestionsId(chapter.id);
    try {
      const r = await generateQuestions(chapter.text, chapter.subject, chapter.classNum, chapter.chapterName, chapter.language);
      if (r?.questions) { await updateChapterSection(chapter.id, "questions", r.questions); await refreshChapters(); }
    } catch (err: any) {
      console.error("[dashboard] Questions retry failed:", err?.message);
      setRetryError("Questions generation failed. Please try again in a moment.");
    } finally { setRetryingQuestionsId(null); }
  };

  const handleOpenPublishModal = (ch: Chapter, e: React.MouseEvent) => {
    e.stopPropagation();
    setPublishModal(ch);
  };

  const handlePublish = async (form: PublishForm) => {
    if (!user || !publishModal) return;
    setPublishing(true);
    try {
      const publisherName = userData?.profile?.name || user.displayName || user.email?.split("@")[0] || "Student";
      const ch = publishModal;

      // Compute which sections are actually generated
      type Sec = "notes"|"questions"|"summary"|"formulas"|"mindmap"|"flashcards"|"mistakes";
      const publishedSections: Sec[] = [];
      if (ch.notes)                                                      publishedSections.push("notes");
      if (ch.questions)                                                  publishedSections.push("questions");
      if (ch.summary)                                                    publishedSections.push("summary");
      if (Array.isArray(ch.formulas)   && ch.formulas.length)           publishedSections.push("formulas");
      if (ch.mindmap)                                                    publishedSections.push("mindmap");
      if (Array.isArray(ch.flashcards) && ch.flashcards.length)         publishedSections.push("flashcards");
      if (Array.isArray(ch.mistakes)   && ch.mistakes.length)           publishedSections.push("mistakes");

      const data: any = {
        userId:           user.uid,
        chapterId:        ch.id,
        chapterName:      ch.chapterName,
        publisherName,
        board:            form.board,
        classNum:         form.classNum,
        medium:           form.medium,
        subject:          form.subject,
        publishedSections,
      };
      publishedSections.forEach(sec => { data[sec] = (ch as any)[sec]; });

      await publishNote(ch.id, data);
      setPublishedIds(prev => new Set([...prev, ch.id]));
      setPublishModal(null);
    } catch (err) {
      console.error("Publish failed:", err);
    } finally {
      setPublishing(false);
    }
  };

  const handleUnpublish = async () => {
    if (!publishModal) return;
    if (!confirm("Remove from Community Notes? Students will no longer see your notes.")) return;
    setUnpublishing(true);
    try {
      await unpublishNote(publishModal.id);
      setPublishedIds(prev => { const s = new Set(prev); s.delete(publishModal.id); return s; });
      setPublishModal(null);
    } catch (err) {
      console.error("Unpublish failed:", err);
    } finally {
      setUnpublishing(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const canAddMore = chapters.length < MAX_CHAPTERS;
  const loading    = loadingUser;

  const streak       = userData?.streak?.current || 0;
  const today        = new Date().toISOString().split("T")[0];
  const dailyDone    = userData?.dailyProgress?.date === today ? userData.dailyProgress.questionsAnswered : 0;
  const dailyTarget  = userData?.dailyGoalTarget || 10;
  const totalAnswered = userData?.totalQuestionsAnswered || 0;
  const totalWrong   = userData?.totalQuestionsWrong || 0;
  const accuracy     = totalAnswered > 0 ? Math.round(((totalAnswered - totalWrong) / totalAnswered) * 100) : null;
  const displayName  = userData?.profile?.name || user?.displayName || user?.email?.split("@")[0] || "Student";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <div className="pt-14 max-w-4xl mx-auto px-4 py-8">

        {/* Welcome + Stats strip */}
        <div className="mb-6">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Namaste, {displayName.split(" ")[0]}! 👋
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                {chapters.length}/{MAX_CHAPTERS} chapters
                {!canAddMore && " — Delete a chapter to add new"}
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => navigate("/progress")}
                className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-green-600 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 px-3 py-2 rounded-xl transition-colors">
                <BarChart2 className="w-3.5 h-3.5" /> Progress
              </button>
              <button onClick={() => navigate("/profile")}
                className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-green-600 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 px-3 py-2 rounded-xl transition-colors">
                <UserCircle className="w-3.5 h-3.5" /> Profile
              </button>
            </div>
          </div>

          {/* Quick stats row */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className={`bg-white dark:bg-gray-900 rounded-2xl border p-4 ${
              streak > 0 ? "border-orange-100 dark:border-orange-800/40" : "border-gray-100 dark:border-gray-800"
            }`}>
              <div className="flex items-center gap-2 mb-1">
                <Flame className={`w-4 h-4 ${streak > 0 ? "text-orange-500" : "text-gray-300 dark:text-gray-700"}`} />
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Streak</span>
              </div>
              <div className={`text-2xl font-black ${streak > 0 ? "text-orange-500" : "text-gray-400 dark:text-gray-600"}`}>
                {streak}<span className="text-xs font-normal text-gray-400 ml-1">days</span>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-4 h-4 text-green-600" />
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Today</span>
              </div>
              <div className="text-2xl font-black text-green-600 dark:text-green-400">
                {dailyDone}<span className="text-xs font-normal text-gray-400 ml-1">/{dailyTarget} Q</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1 mt-2 overflow-hidden">
                <div className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${Math.min(100, Math.round((dailyDone / dailyTarget) * 100))}%` }} />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Accuracy</span>
              </div>
              <div className={`text-2xl font-black ${
                accuracy === null ? "text-gray-400 dark:text-gray-600"
                : accuracy >= 70 ? "text-blue-600 dark:text-blue-400"
                : accuracy >= 50 ? "text-orange-500"
                : "text-red-500"
              }`}>
                {accuracy !== null ? `${accuracy}%` : "—"}
              </div>
              {totalAnswered > 0 && <p className="text-xs text-gray-400 mt-1">{totalAnswered} answered</p>}
            </div>
          </div>
        </div>

        {/* Chapter Library */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Chapter Library
            </h2>
            <button onClick={() => navigate("/public-notes")}
              className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-green-600 transition-colors">
              <Globe className="w-3.5 h-3.5" /> Community Notes
            </button>
          </div>
        </div>

        {/* Retry error banner */}
        {retryError && (
          <div className="mb-4 flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl px-4 py-3 text-sm">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{retryError}</span>
            <button onClick={() => setRetryError(null)} className="ml-auto text-red-400 hover:text-red-600">✕</button>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-40 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {chapters.map((ch) => {
              const Icon        = SUBJECT_ICONS[ch.subject] || BookOpen;
              const colorClass  = SUBJECT_COLORS[ch.subject] || "bg-gray-100 text-gray-600";
              const completion  = getChapterCompletion(ch);
              const missingNotes     = !ch.notes;
              const missingQuestions = hasNoQuestions(ch.questions);
              const isRetryingNotes     = retryingNotesId === ch.id;
              const isRetryingQuestions = retryingQuestionsId === ch.id;
              const hasAnythingRetrying = isRetryingNotes || isRetryingQuestions;
              const isPublished = publishedIds.has(ch.id);

              return (
                <div key={ch.id}
                  onClick={() => !hasAnythingRetrying && navigate(`/chapter/${ch.id}`)}
                  className={`bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 transition-all group ${
                    hasAnythingRetrying ? "cursor-wait opacity-90" : "cursor-pointer hover:border-green-300 dark:hover:border-green-700 hover:shadow-md"
                  }`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClass}`}>
                      <Icon className="w-5 h-5" />
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1">
                      {/* Publish/Globe button — always visible if published, visible on hover otherwise */}
                      {ch.notes && (
                        <button
                          onClick={e => handleOpenPublishModal(ch, e)}
                          title={isPublished ? "Published — click to manage" : "Publish to Community Notes"}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                            isPublished
                              ? "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20"
                              : "opacity-0 group-hover:opacity-100 text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                          }`}>
                          <Globe className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        onClick={e => handleDelete(ch.id, e)}
                        disabled={deletingId === ch.id || hasAnythingRetrying}
                        className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-40">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <ChevronRight className="w-4 h-4 text-green-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>

                  <p className="font-semibold text-gray-900 dark:text-white text-sm leading-snug mb-2 line-clamp-2">{ch.chapterName}</p>
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">{ch.subject}</span>
                    <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">Class {ch.classNum}</span>
                    {ch.notes && <span className="text-xs bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full">Ready</span>}
                    {isPublished && (
                      <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Globe className="w-2.5 h-2.5" /> Public
                      </span>
                    )}
                  </div>

                  {/* Retry buttons */}
                  {(missingNotes || missingQuestions) && (
                    <div className="mb-3 space-y-1.5">
                      {missingNotes && (
                        <button onClick={e => handleRetryNotes(ch, e)}
                          disabled={isRetryingNotes || isRetryingQuestions}
                          className="w-full flex items-center justify-center gap-1.5 text-xs font-medium py-1.5 px-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
                          {isRetryingNotes
                            ? <><Loader2 className="w-3 h-3 animate-spin" /> Generating Notes...</>
                            : <><RefreshCw className="w-3 h-3" /> Generate Notes</>}
                        </button>
                      )}
                      {missingQuestions && (
                        <button onClick={e => handleRetryQuestions(ch, e)}
                          disabled={isRetryingNotes || isRetryingQuestions}
                          className="w-full flex items-center justify-center gap-1.5 text-xs font-medium py-1.5 px-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
                          {isRetryingQuestions
                            ? <><Loader2 className="w-3 h-3 animate-spin" /> Generating Questions...</>
                            : <><RefreshCw className="w-3 h-3" /> Generate Questions</>}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Completion bar */}
                  <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${
                      completion === 100 ? "bg-green-500"
                      : completion >= 50  ? "bg-orange-400"
                      : "bg-gray-300 dark:bg-gray-600"
                    }`} style={{ width: `${completion}%` }} />
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">{completion}% complete</p>
                </div>
              );
            })}

            {canAddMore && (
              <div onClick={() => navigate("/upload")}
                className="bg-white dark:bg-gray-900 rounded-2xl p-5 border-2 border-dashed border-gray-200 dark:border-gray-700 cursor-pointer hover:border-green-400 dark:hover:border-green-600 hover:bg-green-50/30 dark:hover:bg-green-900/10 transition-all flex flex-col items-center justify-center gap-2 min-h-[140px]">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                  <Plus className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">Add New Chapter</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">Upload PDF or browse NCERT</p>
              </div>
            )}
          </div>
        )}

        {!loading && chapters.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No chapters yet</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Upload your first chapter and start your topper journey.</p>
            <button onClick={() => navigate("/upload")}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors">
              Add Your First Chapter
            </button>
          </div>
        )}
      </div>

      {/* Publish modal */}
      {publishModal && (
        <PublishModal
          chapter={publishModal}
          isPublished={publishedIds.has(publishModal.id)}
          onPublish={handlePublish}
          onUnpublish={handleUnpublish}
          onClose={() => setPublishModal(null)}
          publishing={publishing}
          unpublishing={unpublishing}
        />
      )}
    </div>
  );
}
