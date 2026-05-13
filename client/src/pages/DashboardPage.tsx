import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus, BookOpen, Trash2, ChevronRight, FlaskConical,
  Calculator, Leaf, Atom, Flame, Target,
  TrendingUp, Loader2, RefreshCw, AlertTriangle,
  Globe, X, CheckCircle, Compass, Settings, Trophy,
  Calendar, Upload,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useProgress, ALL_BADGES } from "../contexts/ProgressContext";
import {
  deleteChapter, updateChapterSection,
  publishNote, unpublishNote, getMyPublishedNotes,
  subscribeToSocialUser,
} from "../lib/firestore";
import { generateNotes, generateQuestions } from "../lib/api";
import type { Chapter, SocialUser } from "../lib/firestore";
import TopHeader from "../components/TopHeader";
import BottomNav from "../components/BottomNav";

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

function getDaysRemaining(examDate: string | null): number | null {
  if (!examDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exam = new Date(examDate);
  exam.setHours(0, 0, 0, 0);
  const diff = Math.ceil((exam.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

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

interface PublishForm {
  board: string; classNum: string; medium: string; subject: string;
}

function PublishModal({
  chapter, isPublished, onPublish, onUnpublish, onClose, publishing, unpublishing,
}: {
  chapter: Chapter; isPublished: boolean;
  onPublish: (form: PublishForm) => void; onUnpublish: () => void;
  onClose: () => void; publishing: boolean; unpublishing: boolean;
}) {
  const [form, setForm] = useState<PublishForm>({
    board: "Bihar Board", classNum: chapter.classNum || "11",
    medium: chapter.language === "hindi" ? "hindi" : "english",
    subject: PUBLIC_SUBJECTS.includes(chapter.subject) ? chapter.subject : "Physics",
  });
  const set = (key: keyof PublishForm) => (e: React.ChangeEvent<HTMLSelectElement>) =>
    setForm(p => ({ ...p, [key]: e.target.value }));
  const selectClass = "w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500/30";
  const labelClass = "text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 block";
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl border border-gray-100 dark:border-gray-800" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between p-5 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Globe className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-base">
                {isPublished ? "Published to Community" : "Publish to Community"}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {isPublished ? "Your content is live for everyone" : "Share your generated content"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-5 pb-3">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2.5">
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Chapter</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{chapter.chapterName}</p>
          </div>
        </div>
        {isPublished ? (
          <div className="px-5 pb-5">
            <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/40 rounded-xl px-3 py-3 mb-4">
              <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
              <p className="text-sm text-green-700 dark:text-green-400 font-medium">Visible in Community Notes</p>
            </div>
            <div className="flex gap-2">
              <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Close</button>
              <button onClick={onUnpublish} disabled={unpublishing} className="flex-1 px-4 py-2.5 rounded-xl border border-red-200 dark:border-red-800/50 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                {unpublishing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {unpublishing ? "Removing..." : "Unpublish"}
              </button>
            </div>
          </div>
        ) : (
          <div className="px-5 pb-5 space-y-3">
            <div><label className={labelClass}>Board</label><select value={form.board} onChange={set("board")} className={selectClass}>{BOARDS.map(b => <option key={b} value={b}>{b}</option>)}</select></div>
            <div><label className={labelClass}>Class</label><select value={form.classNum} onChange={set("classNum")} className={selectClass}>{["9","10","11","12"].map(c => <option key={c} value={c}>Class {c}</option>)}</select></div>
            <div><label className={labelClass}>Medium</label><select value={form.medium} onChange={set("medium")} className={selectClass}><option value="hindi">Hindi Medium</option><option value="english">English Medium</option></select></div>
            <div><label className={labelClass}>Subject</label><select value={form.subject} onChange={set("subject")} className={selectClass}>{PUBLIC_SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
            <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1.5 pt-1">
              <Globe className="w-3 h-3 flex-shrink-0" /> All generated content will be shared
            </p>
            <div className="flex gap-2 pt-1">
              <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Cancel</button>
              <button onClick={() => onPublish(form)} disabled={publishing} className="flex-1 px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                {publishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Globe className="w-3.5 h-3.5" />}
                {publishing ? "Publishing..." : "Publish"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { userData, chapters, loadingUser, refreshChapters } = useProgress();

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [retryingNotesId, setRetryingNotesId] = useState<string | null>(null);
  const [retryingQuestionsId, setRetryingQuestionsId] = useState<string | null>(null);
  const [retryError, setRetryError] = useState<string | null>(null);

  const [publishedIds, setPublishedIds] = useState<Set<string>>(new Set());
  const [publishModal, setPublishModal] = useState<Chapter | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [unpublishing, setUnpublishing] = useState(false);
  const [socialUser, setSocialUser] = useState<SocialUser | null>(null);

  useEffect(() => {
    if (!user?.uid) return;
    return subscribeToSocialUser(user.uid, setSocialUser);
  }, [user?.uid]);

  useEffect(() => {
    if (!user) return;
    getMyPublishedNotes(user.uid)
      .then(notes => setPublishedIds(new Set(notes.map(n => n.chapterId))))
      .catch(() => {});
  }, [user]);

  useEffect(() => { refreshChapters(); }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this chapter? This cannot be undone.")) return;
    setDeletingId(id);
    try { await deleteChapter(id); await refreshChapters(); }
    catch (e) { console.error(e); }
    finally { setDeletingId(null); }
  };

  const handleRetryNotes = async (chapter: Chapter, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!chapter.text) { setRetryError("Chapter text unavailable — please re-upload the PDF."); return; }
    setRetryError(null); setRetryingNotesId(chapter.id);
    try {
      const r = await generateNotes(chapter.text, chapter.subject, chapter.classNum, chapter.chapterName, chapter.language);
      if (r?.notes) { await updateChapterSection(chapter.id, "notes", r.notes); await refreshChapters(); }
    } catch (err: any) {
      console.error("[dashboard] Notes retry failed:", err?.message);
      setRetryError("Notes generation failed. Please try again.");
    } finally { setRetryingNotesId(null); }
  };

  const handleRetryQuestions = async (chapter: Chapter, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!chapter.text) { setRetryError("Chapter text unavailable — please re-upload the PDF."); return; }
    setRetryError(null); setRetryingQuestionsId(chapter.id);
    try {
      const r = await generateQuestions(chapter.text, chapter.subject, chapter.classNum, chapter.chapterName, chapter.language);
      if (r?.questions) { await updateChapterSection(chapter.id, "questions", r.questions); await refreshChapters(); }
    } catch (err: any) {
      console.error("[dashboard] Questions retry failed:", err?.message);
      setRetryError("Questions generation failed. Please try again.");
    } finally { setRetryingQuestionsId(null); }
  };

  const handlePublish = async (form: PublishForm) => {
    if (!user || !publishModal) return;
    setPublishing(true);
    try {
      const publisherName = userData?.profile?.name || user.displayName || "Student";
      const publisherUsername = socialUser?.username || "";
      const ch = publishModal;
      type Sec = "notes"|"questions"|"summary"|"formulas"|"mindmap"|"flashcards"|"mistakes";
      const publishedSections: Sec[] = [];
      if (ch.notes) publishedSections.push("notes");
      if (ch.questions) publishedSections.push("questions");
      if (ch.summary) publishedSections.push("summary");
      if (Array.isArray(ch.formulas) && ch.formulas.length) publishedSections.push("formulas");
      if (ch.mindmap) publishedSections.push("mindmap");
      if (Array.isArray(ch.flashcards) && ch.flashcards.length) publishedSections.push("flashcards");
      if (Array.isArray(ch.mistakes) && ch.mistakes.length) publishedSections.push("mistakes");
      const data: any = { userId: user.uid, chapterId: ch.id, chapterName: ch.chapterName, publisherName, publisherUsername, board: form.board, classNum: form.classNum, medium: form.medium, subject: form.subject, publishedSections };
      publishedSections.forEach(sec => { data[sec] = (ch as any)[sec]; });
      await publishNote(ch.id, data);
      setPublishedIds(prev => new Set([...prev, ch.id]));
      setPublishModal(null);
    } catch (err) { console.error("Publish failed:", err); }
    finally { setPublishing(false); }
  };

  const handleUnpublish = async () => {
    if (!publishModal) return;
    if (!confirm("Remove from Community Notes?")) return;
    setUnpublishing(true);
    try {
      await unpublishNote(publishModal.id);
      setPublishedIds(prev => { const s = new Set(prev); s.delete(publishModal.id); return s; });
      setPublishModal(null);
    } catch (err) { console.error("Unpublish failed:", err); }
    finally { setUnpublishing(false); }
  };

  const canAddMore = chapters.length < MAX_CHAPTERS;
  const loading = loadingUser;
  const streak = userData?.streak?.current || 0;
  const today = new Date().toISOString().split("T")[0];
  const dailyDone = userData?.dailyProgress?.date === today ? userData.dailyProgress.questionsAnswered : 0;
  const dailyTarget = userData?.dailyGoalTarget || 10;
  const totalAnswered = userData?.totalQuestionsAnswered || 0;
  const totalWrong = userData?.totalQuestionsWrong || 0;
  const accuracy = totalAnswered > 0 ? Math.round(((totalAnswered - totalWrong) / totalAnswered) * 100) : null;
  const displayName = userData?.profile?.name || user?.displayName || "Student";

  // Badges
  const earnedBadges = userData?.badges || [];
  const totalBadges = ALL_BADGES.length;
  const earnedCount = earnedBadges.length;

  // Exam countdown
  const examDate = userData?.examDate || null;
  const daysRemaining = getDaysRemaining(examDate);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <TopHeader />

      <div className="pt-12 pb-20 max-w-2xl mx-auto px-4 py-4">

        {/* Greeting */}
        <div className="pt-2 mb-4 flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Namaste, {displayName.split(" ")[0]}! 👋
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">
              {chapters.length}/{MAX_CHAPTERS} chapters
              {!canAddMore && " · Delete a chapter to add more"}
            </p>
          </div>
          {/* Upload shortcut since Upload was moved out of BottomNav */}
          {canAddMore && (
            <button
              onClick={() => navigate("/upload")}
              className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors flex-shrink-0"
            >
              <Upload className="w-3.5 h-3.5" /> Upload PDF
            </button>
          )}
        </div>

        {/* ── Exam Countdown Banner ── */}
        {daysRemaining !== null && (
          <div
            onClick={() => navigate("/profile")}
            className={`mb-4 cursor-pointer rounded-2xl border px-4 py-3 flex items-center gap-3 transition-all hover:shadow-sm ${
              daysRemaining <= 7
                ? "bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800/40"
                : daysRemaining <= 30
                ? "bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800/40"
                : "bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800/40"
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              daysRemaining <= 7
                ? "bg-red-100 dark:bg-red-900/40"
                : daysRemaining <= 30
                ? "bg-amber-100 dark:bg-amber-900/40"
                : "bg-green-100 dark:bg-green-900/40"
            }`}>
              <Calendar className={`w-5 h-5 ${
                daysRemaining <= 7
                  ? "text-red-600 dark:text-red-400"
                  : daysRemaining <= 30
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-green-600 dark:text-green-400"
              }`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-semibold ${
                daysRemaining <= 7
                  ? "text-red-600 dark:text-red-400"
                  : daysRemaining <= 30
                  ? "text-amber-700 dark:text-amber-400"
                  : "text-green-700 dark:text-green-400"
              }`}>
                {daysRemaining <= 0
                  ? "Exam day is today! All the best! 🎯"
                  : daysRemaining === 1
                  ? "Exam is tomorrow — be ready! 🎯"
                  : `${daysRemaining} days to exam`}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {daysRemaining > 0
                  ? daysRemaining <= 7
                    ? "Last stretch — revise hard!"
                    : daysRemaining <= 30
                    ? "Keep your revision on track"
                    : "Stay consistent — you're doing great"
                  : "Best of luck for your exam!"}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
          </div>
        )}

        {/* Quick stats strip */}
        <div className="grid grid-cols-3 gap-2.5 mb-4">
          {/* Streak */}
          <div className={`bg-white dark:bg-gray-900 rounded-2xl border p-3.5 ${
            streak > 0 ? "border-orange-100 dark:border-orange-800/40" : "border-gray-100 dark:border-gray-800"
          }`}>
            <div className="flex items-center gap-1.5 mb-0.5">
              <Flame className={`w-3.5 h-3.5 ${streak > 0 ? "text-orange-500" : "text-gray-300 dark:text-gray-700"}`} />
              <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">Streak</span>
            </div>
            <div className={`text-2xl font-black leading-none ${streak > 0 ? "text-orange-500" : "text-gray-400 dark:text-gray-600"}`}>
              {streak}
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5">days</div>
          </div>

          {/* Daily goal */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-3.5">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Target className="w-3.5 h-3.5 text-green-600" />
              <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">Aaj Ka Target</span>
            </div>
            <div className="text-2xl font-black text-green-600 dark:text-green-400 leading-none">
              {dailyDone}
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5">/{dailyTarget} Q</div>
            <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1 mt-1.5 overflow-hidden">
              <div className="h-full bg-green-500 rounded-full transition-all"
                style={{ width: `${Math.min(100, Math.round((dailyDone / dailyTarget) * 100))}%` }} />
            </div>
          </div>

          {/* Accuracy */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-3.5">
            <div className="flex items-center gap-1.5 mb-0.5">
              <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">Accuracy</span>
            </div>
            <div className={`text-2xl font-black leading-none ${
              accuracy === null ? "text-gray-400 dark:text-gray-600"
              : accuracy >= 70 ? "text-blue-600 dark:text-blue-400"
              : accuracy >= 50 ? "text-orange-500"
              : "text-red-500"
            }`}>
              {accuracy !== null ? `${accuracy}%` : "—"}
            </div>
            {totalAnswered > 0 && <div className="text-[10px] text-gray-400 mt-0.5">{totalAnswered} answered</div>}
          </div>
        </div>

        {/* ── Badges + Discover + Settings quick-access row ── */}
        <div className="grid grid-cols-3 gap-2.5 mb-5">

          {/* Badges card */}
          <button
            onClick={() => navigate("/profile")}
            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-3.5 text-left hover:border-green-300 dark:hover:border-green-700 hover:shadow-sm transition-all group"
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">Badges</span>
            </div>
            <div className="text-2xl font-black text-amber-500 leading-none">{earnedCount}</div>
            <div className="text-[10px] text-gray-400 mt-0.5">/{totalBadges} earned</div>
            {earnedCount > 0 && (
              <div className="mt-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1 overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all"
                  style={{ width: `${Math.round((earnedCount / totalBadges) * 100)}%` }}
                />
              </div>
            )}
          </button>

          {/* Find Friends / Discover card */}
          <button
            onClick={() => navigate("/discover")}
            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-3.5 text-left hover:border-green-300 dark:hover:border-green-700 hover:shadow-sm transition-all group"
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Compass className="w-3.5 h-3.5 text-indigo-500" />
              <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">Discover</span>
            </div>
            <p className="text-xs font-bold text-gray-800 dark:text-white leading-snug">Find Friends</p>
            <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">Search students</p>
          </button>

          {/* Settings card */}
          <button
            onClick={() => navigate("/settings")}
            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-3.5 text-left hover:border-green-300 dark:hover:border-green-700 hover:shadow-sm transition-all group"
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Settings className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
              <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">Settings</span>
            </div>
            <p className="text-xs font-bold text-gray-800 dark:text-white leading-snug">Profile & Privacy</p>
            <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">Photo, bio, links</p>
          </button>
        </div>

        {/* ── No exam date set nudge ── */}
        {!examDate && (
          <button
            onClick={() => navigate("/profile")}
            className="w-full mb-4 flex items-center gap-3 bg-white dark:bg-gray-900 border border-dashed border-green-300 dark:border-green-700 rounded-2xl px-4 py-3 text-left hover:bg-green-50/40 dark:hover:bg-green-900/10 transition-colors group"
          >
            <Calendar className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-green-700 dark:text-green-400">Set your exam date</p>
              <p className="text-[10px] text-gray-400">Get a personalised countdown + revision plan</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-green-500 transition-colors" />
          </button>
        )}

        {/* Chapter Library header */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">Chapter Library</h2>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate("/public-notes")}
              className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-green-600 transition-colors">
              <Globe className="w-3 h-3" /> Community Notes
            </button>
            {canAddMore && (
              <button onClick={() => navigate("/upload")}
                className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors">
                <Plus className="w-3 h-3" /> Add
              </button>
            )}
          </div>
        </div>

        {/* Retry error banner */}
        {retryError && (
          <div className="mb-3 flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl px-4 py-3 text-sm">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{retryError}</span>
            <button onClick={() => setRetryError(null)} className="ml-auto text-red-400 hover:text-red-600">✕</button>
          </div>
        )}

        {/* Chapter cards */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : chapters.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-8 text-center">
            <BookOpen className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">No chapters yet. Upload your first chapter!</p>
            <button onClick={() => navigate("/upload")}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors flex items-center gap-2 mx-auto">
              <Plus className="w-4 h-4" /> Upload Chapter
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {chapters.map((ch) => {
              const Icon = SUBJECT_ICONS[ch.subject] || BookOpen;
              const colorClass = SUBJECT_COLORS[ch.subject] || "bg-gray-100 text-gray-600";
              const completion = getChapterCompletion(ch);
              const missingNotes = !ch.notes;
              const missingQuestions = hasNoQuestions(ch.questions);
              const isRetryingNotes = retryingNotesId === ch.id;
              const isRetryingQuestions = retryingQuestionsId === ch.id;
              const hasAnythingRetrying = isRetryingNotes || isRetryingQuestions;
              const isDeleting = deletingId === ch.id;
              const isPublished = publishedIds.has(ch.id);

              return (
                <div key={ch.id}
                  onClick={() => !hasAnythingRetrying && !isDeleting && navigate(`/chapter/${ch.id}`)}
                  className={`bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 transition-all ${
                    hasAnythingRetrying || isDeleting
                      ? "cursor-wait opacity-90"
                      : "cursor-pointer hover:border-green-300 dark:hover:border-green-700 hover:shadow-sm"
                  }`}>

                  <div className="flex items-start gap-3 mb-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white text-sm leading-snug truncate">
                        {ch.chapterName}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-400">{ch.subject}</span>
                        <span className="text-gray-200 dark:text-gray-700">·</span>
                        <span className="text-xs text-gray-400">Class {ch.classNum}</span>
                        {isPublished && (
                          <>
                            <span className="text-gray-200 dark:text-gray-700">·</span>
                            <span className="text-xs text-green-600 dark:text-green-400 font-medium flex items-center gap-0.5">
                              <Globe className="w-2.5 h-2.5" /> Live
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-sm font-black ${
                        completion === 100 ? "text-green-600 dark:text-green-400"
                        : completion >= 50 ? "text-orange-500"
                        : "text-gray-400 dark:text-gray-600"
                      }`}>{completion}%</span>
                      <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-700" />
                    </div>
                  </div>

                  <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 mb-3 overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${
                      completion === 100 ? "bg-green-500"
                      : completion >= 50 ? "bg-orange-400"
                      : "bg-gray-300 dark:bg-gray-600"
                    }`} style={{ width: `${completion}%` }} />
                  </div>

                  <div className="flex items-center gap-2 flex-wrap" onClick={e => e.stopPropagation()}>
                    {missingNotes && (
                      <button onClick={(e) => handleRetryNotes(ch, e)} disabled={isRetryingNotes}
                        className="flex items-center gap-1 text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 px-2.5 py-1.5 rounded-lg disabled:opacity-50 transition-colors hover:bg-amber-100 dark:hover:bg-amber-900/30">
                        {isRetryingNotes ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                        {isRetryingNotes ? "Generating..." : "Retry Notes"}
                      </button>
                    )}
                    {missingQuestions && (
                      <button onClick={(e) => handleRetryQuestions(ch, e)} disabled={isRetryingQuestions}
                        className="flex items-center gap-1 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50 px-2.5 py-1.5 rounded-lg disabled:opacity-50 transition-colors hover:bg-blue-100 dark:hover:bg-blue-900/30">
                        {isRetryingQuestions ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                        {isRetryingQuestions ? "Generating..." : "Retry Questions"}
                      </button>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); setPublishModal(ch); }}
                      className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
                        isPublished
                          ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800/50 hover:bg-green-100"
                          : "bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}>
                      <Globe className="w-3 h-3" />
                      {isPublished ? "Published" : "Publish"}
                    </button>
                    <button onClick={(e) => handleDelete(ch.id, e)} disabled={isDeleting}
                      className="flex items-center gap-1 text-xs bg-gray-50 dark:bg-gray-800 text-red-500 border border-gray-200 dark:border-gray-700 px-2.5 py-1.5 rounded-lg disabled:opacity-50 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-200 ml-auto">
                      {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Add new chapter card */}
            {canAddMore && (
              <button onClick={() => navigate("/upload")}
                className="w-full bg-white dark:bg-gray-900 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-5 text-center hover:border-green-400 dark:hover:border-green-600 hover:bg-green-50/30 dark:hover:bg-green-900/10 transition-all group">
                <Plus className="w-6 h-6 text-gray-400 group-hover:text-green-600 mx-auto mb-1 transition-colors" />
                <p className="text-sm text-gray-400 group-hover:text-green-600 font-medium transition-colors">Add Chapter ({chapters.length}/{MAX_CHAPTERS})</p>
              </button>
            )}
          </div>
        )}
      </div>

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

      <BottomNav />
    </div>
  );
}
