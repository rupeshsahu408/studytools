import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  BookOpen, HelpCircle, ArrowLeft, Atom, FlaskConical,
  Calculator, Leaf, Calendar, Sigma, Network, AlertTriangle,
  Layers, MessageCircle, HelpingHand, Loader2, Beaker, Users, Zap, FileText,
  Share2, Copy, CheckCheck, Trash2, Globe, X, Check,
} from "lucide-react";
import {
  getChapter, updateChapterSection, createShareLink, revokeShareLink,
  publishNote, unpublishNote, getPublishedNote, subscribeToSocialUser,
} from "../lib/firestore";
import type { Chapter, PublicNote, PublishableSection, SocialUser } from "../lib/firestore";
import {
  generateFormulas, generateMindmap, generateMistakes,
  generateFlashcards, generateSimulationCatalog, regenerateQuestionBatch,
  regenerateNotes, generateSummary, generateExamPaper, generateQuestions,
} from "../lib/api";
import { useProgress } from "../contexts/ProgressContext";
import { useAuth } from "../contexts/AuthContext";
import Navbar from "../components/Navbar";
import NotesView from "../components/NotesView";
import QuestionsView from "../components/QuestionsView";
import FormulaSheet from "../components/FormulaSheet";
import MindMap from "../components/MindMap";
import MistakesView from "../components/MistakesView";
import FlashCards from "../components/FlashCards";
import DoubtChat from "../components/DoubtChat";
import SimulationsView from "../components/SimulationsView";
import DiscussionView from "../components/DiscussionView";
import SummaryView from "../components/SummaryView";
import ExamPaperView from "../components/ExamPaperView";
import ExamPaperGenerating from "../components/ExamPaperGenerating";

const SUBJECT_ICONS: Record<string, any> = {
  Physics: Atom, Chemistry: FlaskConical, Mathematics: Calculator, Biology: Leaf,
};

const SIDEBAR_ITEMS = [
  { key: "notes",       label: "Notes",              icon: BookOpen,       group: "study" },
  { key: "questions",   label: "Questions",           icon: HelpCircle,    group: "study" },
  { key: "summary",     label: "Quick Revision",      icon: Zap,           group: "ai" },
  { key: "formulas",    label: "Formulas",            icon: Sigma,         group: "ai" },
  { key: "mindmap",     label: "Concept Map",         icon: Network,       group: "ai" },
  { key: "mistakes",    label: "Ye Galti Mat Karo",   icon: AlertTriangle, group: "ai" },
  { key: "flashcards",  label: "Flash Cards",         icon: Layers,        group: "ai" },
  { key: "chat",        label: "Doubt Chat",          icon: MessageCircle, group: "ai" },
  { key: "simulations", label: "Simulations",         icon: Beaker,        group: "sim" },
  { key: "discussion",  label: "Discussion",          icon: Users,         group: "community" },
  { key: "exampaper",  label: "Exam Paper",           icon: FileText,      group: "exam" },
];

function formatDate(ts: any): string {
  if (!ts) return "";
  try {
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch { return ""; }
}

function SectionGenerating({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Loader2 className="w-8 h-8 text-green-600 animate-spin mb-4" />
      <p className="text-base font-semibold text-gray-800 dark:text-white mb-1">Generating {label}…</p>
      <p className="text-sm text-gray-400 dark:text-gray-500 max-w-xs">AI is analyzing your chapter. This takes 20–40 seconds.</p>
    </div>
  );
}

function SectionEmpty({ label, description, onGenerate, generating }: {
  label: string; description: string; onGenerate: () => void; generating: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
        <HelpingHand className="w-8 h-8 text-green-600 dark:text-green-400" />
      </div>
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{label}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-xs">{description}</p>
      <button onClick={onGenerate} disabled={generating}
        className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-xl transition-colors flex items-center gap-2">
        {generating && <Loader2 className="w-4 h-4 animate-spin" />}
        {generating ? "Generating..." : `Generate ${label}`}
      </button>
    </div>
  );
}

// ─── Publish Modal ────────────────────────────────────────────────────────────

const PUBLISH_BOARDS = [
  "Bihar Board", "UP Board", "MP Board", "Rajasthan Board",
  "Haryana Board", "Uttarakhand Board", "CBSE", "ICSE", "Other",
];

const SECTION_META: { key: PublishableSection; label: string; icon: any }[] = [
  { key: "notes",      label: "Notes",              icon: BookOpen },
  { key: "questions",  label: "Questions",           icon: HelpCircle },
  { key: "summary",    label: "Quick Revision",      icon: Zap },
  { key: "formulas",   label: "Formulas",            icon: Sigma },
  { key: "mindmap",    label: "Concept Map",         icon: Network },
  { key: "flashcards", label: "Flash Cards",         icon: Layers },
  { key: "mistakes",   label: "Ye Galti Mat Karo",   icon: AlertTriangle },
];

function getAvailableSections(chapter: Chapter): PublishableSection[] {
  const secs: PublishableSection[] = [];
  if (chapter.notes)                                        secs.push("notes");
  if (chapter.questions)                                    secs.push("questions");
  if (chapter.summary)                                      secs.push("summary");
  if (Array.isArray(chapter.formulas) && chapter.formulas.length)   secs.push("formulas");
  if (chapter.mindmap)                                      secs.push("mindmap");
  if (Array.isArray(chapter.flashcards) && chapter.flashcards.length) secs.push("flashcards");
  if (Array.isArray(chapter.mistakes) && chapter.mistakes.length)   secs.push("mistakes");
  return secs;
}

function PublishModal({
  chapter, currentPublish, onClose, onPublish, onUnpublish, loading, error,
}: {
  chapter: Chapter;
  currentPublish: PublicNote | null;
  onClose: () => void;
  onPublish: (sections: PublishableSection[], board: string) => void;
  onUnpublish: () => void;
  loading: boolean;
  error: string | null;
}) {
  const available = getAvailableSections(chapter);
  const initial: Set<PublishableSection> = currentPublish
    ? new Set(currentPublish.publishedSections)
    : new Set(available);
  const [selected, setSelected] = useState<Set<PublishableSection>>(initial);
  const [board, setBoard] = useState(currentPublish?.board || "Bihar Board");
  const [confirmUnpublish, setConfirmUnpublish] = useState(false);

  const toggle = (key: PublishableSection) => {
    setSelected(prev => {
      const s = new Set(prev);
      s.has(key) ? s.delete(key) : s.add(key);
      return s;
    });
  };

  const handleSubmit = () => {
    const secs = Array.from(selected);
    if (!secs.length) return;
    onPublish(secs, board);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-gray-50 dark:bg-gray-950 w-full sm:max-w-md sm:rounded-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-green-600 dark:text-green-400" />
            <h2 className="font-bold text-gray-900 dark:text-white text-base">
              {currentPublish ? "Update Community Post" : "Publish to Community"}
            </h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {/* Chapter info */}
          <div className="bg-white dark:bg-gray-900 rounded-xl p-3 border border-gray-100 dark:border-gray-800">
            <p className="text-sm font-semibold text-gray-900 dark:text-white leading-snug">{chapter.chapterName}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{chapter.subject} · Class {chapter.classNum}</p>
          </div>

          {/* Board selector */}
          <div>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1.5">
              Board
            </label>
            <select
              value={board}
              onChange={e => setBoard(e.target.value)}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500/30"
            >
              {PUBLISH_BOARDS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          {/* Section checkboxes */}
          <div>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-2">
              Select what to publish
            </label>
            {available.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
                Generate some content first, then you can publish it.
              </p>
            ) : (
              <div className="space-y-2">
                {SECTION_META.filter(m => available.includes(m.key)).map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => toggle(key)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                      selected.has(key)
                        ? "border-green-400 dark:border-green-600 bg-green-50 dark:bg-green-900/20"
                        : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                      selected.has(key)
                        ? "bg-green-100 dark:bg-green-900/40"
                        : "bg-gray-100 dark:bg-gray-800"
                    }`}>
                      <Icon className={`w-4 h-4 ${selected.has(key) ? "text-green-600 dark:text-green-400" : "text-gray-400"}`} />
                    </div>
                    <span className={`text-sm font-medium flex-1 ${selected.has(key) ? "text-green-700 dark:text-green-300" : "text-gray-700 dark:text-gray-300"}`}>
                      {label}
                    </span>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      selected.has(key)
                        ? "bg-green-500 border-green-500"
                        : "border-gray-300 dark:border-gray-600"
                    }`}>
                      {selected.has(key) && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl px-3 py-2">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex-shrink-0 space-y-2">
          <button
            onClick={handleSubmit}
            disabled={loading || selected.size === 0}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
            {loading ? "Publishing…" : currentPublish ? "Update Post" : "Publish to Community"}
          </button>

          {currentPublish && !confirmUnpublish && (
            <button
              onClick={() => setConfirmUnpublish(true)}
              className="w-full text-sm text-red-500 hover:text-red-600 py-2 transition-colors"
            >
              Remove from community
            </button>
          )}
          {currentPublish && confirmUnpublish && (
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmUnpublish(false)}
                className="flex-1 text-sm text-gray-500 border border-gray-200 dark:border-gray-700 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onUnpublish}
                disabled={loading}
                className="flex-1 text-sm text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 py-2 rounded-xl transition-colors flex items-center justify-center gap-1"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Yes, Remove
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ChapterPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState(
    () => searchParams.get("section") || "notes"
  );
  const [generatingSection, setGeneratingSection] = useState<string | null>(null);
  const [genError, setGenError] = useState<string | null>(null);
  const [retryingBatch, setRetryingBatch] = useState<"A" | "B" | null>(null);
  const [regeneratingNotes, setRegeneratingNotes] = useState(false);
  const [regeneratingSummary, setRegeneratingSummary] = useState(false);
  const [generatingExamPaper, setGeneratingExamPaper] = useState(false);
  const [examPaperError, setExamPaperError] = useState<string | null>(null);

  const [shareToken, setShareToken] = useState<string | null>(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [shareRevoked, setShareRevoked] = useState(false);

  const [currentPublish, setCurrentPublish] = useState<PublicNote | null>(null);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishSuccess, setPublishSuccess] = useState(false);

  const { user } = useAuth();

  // Phase 4: progress tracking
  const { markNotesRead, trackQuestionAnswer, markFlashcardsDone, markSimulationSeen, userData } = useProgress();

  // Social user — needed for username in publish flow
  const [socialUser, setSocialUser] = useState<SocialUser | null>(null);
  useEffect(() => {
    if (!user?.uid) return;
    return subscribeToSocialUser(user.uid, setSocialUser);
  }, [user?.uid]);

  useEffect(() => {
    if (!id) return;
    loadChapter();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    getPublishedNote(id).then(setCurrentPublish).catch(() => {});
  }, [id]);

  const loadChapter = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await getChapter(id);
      setChapter(data);
      setShareToken(data?.shareToken ?? null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateShare = useCallback(async () => {
    if (!chapter || !user || shareLoading) return;
    setShareLoading(true);
    try {
      const name = userData?.profile?.name || user.displayName || "A student";
      const token = await createShareLink(chapter.id, user.uid, {
        chapterName: chapter.chapterName,
        subject: chapter.subject,
        classNum: chapter.classNum,
        language: chapter.language || "english",
        notes: chapter.notes,
        sharedByName: name,
      });
      setShareToken(token);
    } catch (e) {
      console.error("Share creation failed:", e);
    } finally {
      setShareLoading(false);
    }
  }, [chapter, user, shareLoading]);

  const handlePublish = useCallback(async (sections: PublishableSection[], board: string) => {
    if (!chapter || !user || publishLoading) return;
    setPublishLoading(true);
    setPublishError(null);
    try {
      const publisherName = userData?.profile?.name || user.displayName || "Student";
      const publisherUsername = socialUser?.username || "";
      const data: Omit<PublicNote, "id" | "publishedAt" | "viewCount"> = {
        userId: user.uid,
        chapterId: chapter.id,
        chapterName: chapter.chapterName,
        publisherName,
        publisherUsername,
        board,
        classNum: chapter.classNum,
        medium: chapter.language || "hindi",
        subject: chapter.subject,
        publishedSections: sections,
      };
      sections.forEach(sec => {
        (data as any)[sec] = (chapter as any)[sec];
      });
      await publishNote(chapter.id, data);
      const updated = await getPublishedNote(chapter.id);
      setCurrentPublish(updated);
      setShowPublishModal(false);
      setPublishSuccess(true);
      setTimeout(() => setPublishSuccess(false), 3000);
    } catch {
      setPublishError("Publish failed. Please try again.");
    } finally {
      setPublishLoading(false);
    }
  }, [chapter, user, userData, socialUser, publishLoading]);

  const handleUnpublish = useCallback(async () => {
    if (!chapter || publishLoading) return;
    setPublishLoading(true);
    setPublishError(null);
    try {
      await unpublishNote(chapter.id);
      setCurrentPublish(null);
      setShowPublishModal(false);
    } catch {
      setPublishError("Failed to remove. Please try again.");
    } finally {
      setPublishLoading(false);
    }
  }, [chapter, publishLoading]);

  const handleRevokeShare = useCallback(async () => {
    if (!chapter || !shareToken || shareLoading) return;
    if (!window.confirm("Remove this share link? Anyone with the current link will lose access.")) return;
    setShareLoading(true);
    try {
      await revokeShareLink(chapter.id, shareToken);
      setShareToken(null);
      setShareRevoked(true);
      setTimeout(() => setShareRevoked(false), 2000);
    } catch (e) {
      console.error("Revoke failed:", e);
    } finally {
      setShareLoading(false);
    }
  }, [chapter, shareToken, shareLoading]);

  const handleCopyShare = useCallback(() => {
    if (!shareToken) return;
    const url = `${window.location.origin}/share/${shareToken}`;
    navigator.clipboard.writeText(url).then(() => {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    });
  }, [shareToken]);

  const generateSection = useCallback(async (sectionKey: string) => {
    if (!chapter || generatingSection) return;
    setGeneratingSection(sectionKey);
    setGenError(null);
    try {
      let result: any;
      const { text, subject, classNum, chapterName, language } = chapter;
      if (sectionKey === "summary") {
        const data = await generateSummary(text, subject, classNum, chapterName, language || "english");
        result = data.summary || null;
      } else if (sectionKey === "formulas") {
        const data = await generateFormulas(text, subject, classNum, chapterName, language);
        result = data.formulas || [];
      } else if (sectionKey === "mindmap") {
        const data = await generateMindmap(text, subject, classNum, chapterName, language || "english");
        result = data.mindmap || null;
      } else if (sectionKey === "mistakes") {
        const data = await generateMistakes(text, subject, classNum, chapterName, language);
        result = data.mistakes || [];
      } else if (sectionKey === "flashcards") {
        const data = await generateFlashcards(text, subject, classNum, chapterName, language);
        result = data.cards || [];
      } else if (sectionKey === "simulations") {
        const data = await generateSimulationCatalog(text, subject, classNum, chapterName);
        result = data.simulations || [];
      } else if (sectionKey === "questions") {
        const data = await generateQuestions(text, subject, classNum, chapterName, language || "english");
        result = data.questions || null;
      }
      if (result !== undefined && chapter.id) {
        await updateChapterSection(chapter.id, sectionKey, result);
        setChapter(prev => prev ? { ...prev, [sectionKey]: result } : prev);
      }
    } catch (err: any) {
      console.error(`Error generating ${sectionKey}:`, err);
      setGenError(`Could not generate ${sectionKey}. Please try again.`);
    } finally {
      setGeneratingSection(null);
    }
  }, [chapter, generatingSection]);

  // Auto-trigger generation on first visit to Phase 2/3 sections
  useEffect(() => {
    if (!chapter || loading) return;
    const lazyKeys = ["summary", "formulas", "mindmap", "mistakes", "flashcards", "simulations"];
    if (
      lazyKeys.includes(activeSection) &&
      !chapter[activeSection as keyof Chapter] &&
      !generatingSection
    ) {
      generateSection(activeSection);
    }
  }, [activeSection, chapter, loading]);

  const switchSection = (key: string) => {
    setActiveSection(key);
    setGenError(null);
  };

  // Retry a specific question batch (A or B) without touching the other
  const handleRetryBatch = useCallback(async (batch: "A" | "B") => {
    if (!chapter || retryingBatch) return;
    setRetryingBatch(batch);
    setGenError(null);
    try {
      const { text, subject, classNum, chapterName, language } = chapter;
      const { questions: newBatchQuestions } = await regenerateQuestionBatch(
        text, subject, classNum, chapterName, language || "english", batch
      );
      // Merge new batch into existing questions — never overwrite the working batch
      const merged = { ...(chapter.questions || {}), ...newBatchQuestions };
      if (chapter.id) {
        await updateChapterSection(chapter.id, "questions", merged);
      }
      setChapter(prev => prev ? { ...prev, questions: merged } : prev);
    } catch (err: any) {
      console.error(`Error retrying batch ${batch}:`, err);
      setGenError(`Could not generate missing questions. Please try again.`);
    } finally {
      setRetryingBatch(null);
    }
  }, [chapter, retryingBatch]);

  const handleRegenerateNotes = useCallback(async () => {
    if (!chapter || regeneratingNotes) return;
    setRegeneratingNotes(true);
    setGenError(null);
    try {
      const { text, subject, classNum, chapterName, language } = chapter;
      const data = await regenerateNotes(text, subject, classNum, chapterName, language || "english");
      const newNotes = data.notes;
      if (newNotes && chapter.id) {
        await updateChapterSection(chapter.id, "notes", newNotes);
        setChapter(prev => prev ? { ...prev, notes: newNotes } : prev);
      }
    } catch (err: any) {
      console.error("Error regenerating notes:", err);
      setGenError("Could not regenerate notes. Please try again.");
    } finally {
      setRegeneratingNotes(false);
    }
  }, [chapter, regeneratingNotes]);

  const handleRegenerateSummary = useCallback(async () => {
    if (!chapter || regeneratingSummary) return;
    setRegeneratingSummary(true);
    setGenError(null);
    try {
      const { text, subject, classNum, chapterName, language } = chapter;
      const data = await generateSummary(text, subject, classNum, chapterName, language || "english");
      const newSummary = data.summary;
      if (newSummary && chapter.id) {
        await updateChapterSection(chapter.id, "summary", newSummary);
        setChapter(prev => prev ? { ...prev, summary: newSummary } : prev);
      }
    } catch (err: any) {
      console.error("Error regenerating summary:", err);
      setGenError("Could not regenerate summary. Please try again.");
    } finally {
      setRegeneratingSummary(false);
    }
  }, [chapter, regeneratingSummary]);

  const handleGenerateExamPaper = useCallback(async () => {
    if (!chapter || generatingExamPaper) return;
    setGeneratingExamPaper(true);
    setExamPaperError(null);
    try {
      const { text, subject, classNum, chapterName, language } = chapter;
      const data = await generateExamPaper(text, subject, classNum, chapterName, language || "english");
      if (data && chapter.id) {
        const paperData = { mcq: data.mcq || [], twoMarks: data.twoMarks || [], fiveMarks: data.fiveMarks || [] };
        await updateChapterSection(chapter.id, "examPaper", paperData);
        setChapter(prev => prev ? { ...prev, examPaper: paperData } : prev);
      }
    } catch (err: any) {
      console.error("Error generating exam paper:", err);
      setExamPaperError(err?.response?.data?.error || "Could not generate exam paper. Please try again.");
    } finally {
      setGeneratingExamPaper(false);
    }
  }, [chapter, generatingExamPaper]);

  const handleResetExamPaper = useCallback(async () => {
    if (!chapter?.id) return;
    await updateChapterSection(chapter.id, "examPaper", null);
    setChapter(prev => prev ? { ...prev, examPaper: null } : prev);
    setExamPaperError(null);
  }, [chapter]);

  // Progress tracking callbacks
  const handleNotesRead = useCallback(() => {
    if (id) markNotesRead(id);
  }, [id, markNotesRead]);

  const handleQuestionAnswered = useCallback((
    isWrong: boolean,
    question: { id: string; question: string; type: string }
  ) => {
    if (id) trackQuestionAnswer(id, isWrong, question);
  }, [id, trackQuestionAnswer]);

  const handleFlashcardsDone = useCallback(() => {
    if (id) markFlashcardsDone(id);
  }, [id, markFlashcardsDone]);

  const handleSimLaunched = useCallback(() => {
    if (id) markSimulationSeen(id);
  }, [id, markSimulationSeen]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-green-200 border-t-green-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!chapter) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">Chapter not found.</p>
          <button onClick={() => navigate("/dashboard")} className="text-green-600 hover:underline text-sm">
            ← Back to Library
          </button>
        </div>
      </div>
    );
  }

  const SubjectIcon = SUBJECT_ICONS[chapter.subject] || BookOpen;
  const createdDate = formatDate(chapter.createdAt);
  const questionCount = chapter.questions
    ? Object.entries(chapter.questions).reduce((sum: number, [key, arr]: [string, any]) => {
        if (!arr) return sum;
        if (key === "caseBased") return sum + (arr as any[]).reduce((s: number, set: any) => s + (set.questions?.length || 0), 0);
        return sum + (arr as any[]).length;
      }, 0)
    : 0;

  const simCount = Array.isArray(chapter.simulations) ? chapter.simulations.length : 0;
  const isGenerating = (key: string) => generatingSection === key;

  function renderSection() {
    if (!chapter) return null;
    switch (activeSection) {
      case "notes":
        return chapter?.notes
          ? <NotesView
              notes={chapter.notes}
              subject={chapter.subject}
              chapterName={chapter.chapterName}
              classNum={chapter.classNum}
              onRead={handleNotesRead}
              onRegenerate={handleRegenerateNotes}
              regenerating={regeneratingNotes}
            />
          : <div className="text-gray-400 py-10 text-center text-sm">Notes not available.</div>;

      case "questions":
        if (isGenerating("questions")) return <SectionGenerating label="Question Bank" />;
        if (!chapter.questions) {
          return (
            <SectionEmpty
              label="Question Bank"
              description="AI will generate a complete question bank — MCQs, 1-mark, 2-mark, 5-mark, Assertion-Reason, Case-Based, True/False, Fill in the Blanks, and Exam Important questions — all tailored to Bihar Board pattern."
              onGenerate={() => generateSection("questions")}
              generating={generatingSection === "questions"}
            />
          );
        }
        return (
          <QuestionsView
            questions={chapter.questions}
            onQuestionAnswered={handleQuestionAnswered}
            onRetryBatch={handleRetryBatch}
            retryingBatch={retryingBatch}
            userId={user?.uid}
            chapterId={chapter.id}
            chapterName={chapter.chapterName}
            subject={chapter.subject}
          />
        );

      case "summary":
        if (isGenerating("summary")) return <SectionGenerating label="Quick Revision" />;
        if (!chapter.summary) {
          return (
            <SectionEmpty
              label="Quick Revision"
              description="AI will create a complete one-shot revision of this chapter — key concepts, all formulas, exam spotlight, and 10 last-night revision points. Read it once and feel fully prepared."
              onGenerate={() => generateSection("summary")}
              generating={generatingSection === "summary"}
            />
          );
        }
        return (
          <SummaryView
            summary={chapter.summary as any}
            chapterName={chapter.chapterName}
            subject={chapter.subject}
            classNum={String(chapter.classNum || "11")}
            onRegenerate={handleRegenerateSummary}
            regenerating={regeneratingSummary}
          />
        );

      case "formulas":
        if (isGenerating("formulas")) return <SectionGenerating label="Formula Sheet" />;
        if (!chapter.formulas || (chapter.formulas as any[]).length === 0) {
          return (
            <SectionEmpty
              label="Formula Sheet"
              description="AI will extract every formula from this chapter with variables, SI units, and derivation hints."
              onGenerate={() => generateSection("formulas")}
              generating={generatingSection === "formulas"}
            />
          );
        }
        return <FormulaSheet
          formulas={chapter.formulas as any[]}
          chapterName={chapter.chapterName}
          subject={chapter.subject}
          classNum={String(chapter.classNum || "11")}
        />;

      case "mindmap":
        if (isGenerating("mindmap")) return <SectionGenerating label="Concept Map" />;
        if (!chapter.mindmap) {
          return (
            <SectionEmpty
              label="Concept Map"
              description="AI will create an interactive concept map showing how all topics in this chapter connect."
              onGenerate={() => generateSection("mindmap")}
              generating={generatingSection === "mindmap"}
            />
          );
        }
        return <MindMap
          mindmap={chapter.mindmap}
          chapterName={chapter.chapterName}
          subject={chapter.subject}
          classNum={String(chapter.classNum || "11")}
        />;

      case "mistakes":
        if (isGenerating("mistakes")) return <SectionGenerating label="Common Mistakes" />;
        if (!chapter.mistakes || (chapter.mistakes as any[]).length === 0) {
          return (
            <SectionEmpty
              label="Common Mistakes"
              description="AI will identify the top 10 most common and costly mistakes Bihar Board students make in this chapter."
              onGenerate={() => generateSection("mistakes")}
              generating={generatingSection === "mistakes"}
            />
          );
        }
        return <MistakesView mistakes={chapter.mistakes as any[]} />;

      case "flashcards":
        if (isGenerating("flashcards")) return <SectionGenerating label="Flash Cards" />;
        if (!chapter.flashcards || (chapter.flashcards as any[]).length === 0) {
          return (
            <SectionEmpty
              label="Flash Cards"
              description="AI will generate 25 flash cards for quick revision of all key concepts, formulas, and definitions."
              onGenerate={() => generateSection("flashcards")}
              generating={generatingSection === "flashcards"}
            />
          );
        }
        return <FlashCards
          cards={chapter.flashcards as any[]}
          onAllDone={handleFlashcardsDone}
          userId={user?.uid}
          chapterId={chapter.id}
          chapterName={chapter.chapterName}
          subject={chapter.subject}
        />;

      case "chat":
        return (
          <DoubtChat
            chapterName={chapter.chapterName}
            subject={chapter.subject}
            language={chapter.language}
            chapterText={chapter.text || ""}
            chapterId={chapter.id}
            userId={user?.uid || ""}
          />
        );

      case "simulations":
        if (isGenerating("simulations")) return <SectionGenerating label="Interactive Simulations" />;
        if (!chapter.simulations || simCount === 0) {
          return (
            <SectionEmpty
              label="Interactive Simulations"
              description="AI will analyze this chapter and identify all topics that can be visualized with interactive 2D/3D simulations."
              onGenerate={() => generateSection("simulations")}
              generating={generatingSection === "simulations"}
            />
          );
        }
        return (
          <SimulationsView
            simulations={chapter.simulations}
            chapterName={chapter.chapterName}
            subject={chapter.subject}
            language={chapter.language}
            chapterText={chapter.text || ""}
            onSimLaunched={handleSimLaunched}
          />
        );

      case "discussion":
        return (
          <DiscussionView
            chapterId={chapter.id}
            chapterName={chapter.chapterName}
            subject={chapter.subject}
            language={chapter.language}
            chapterText={chapter.text || ""}
          />
        );

      case "exampaper":
        if (generatingExamPaper) return <ExamPaperGenerating />;
        return (
          <ExamPaperView
            subject={chapter.subject}
            classNum={chapter.classNum}
            chapterName={chapter.chapterName}
            paper={(chapter.examPaper as any) || null}
            generating={generatingExamPaper}
            error={examPaperError}
            onGenerate={handleGenerateExamPaper}
            onReset={handleResetExamPaper}
          />
        );

      default:
        return null;
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <div className="pt-14 flex">

        {/* ── Desktop Sidebar ── */}
        <aside className="hidden md:flex flex-col w-64 fixed left-0 top-14 h-[calc(100vh-3.5rem)] bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 overflow-y-auto">
          <div className="p-4">
            <button onClick={() => navigate("/dashboard")} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-green-600 transition-colors mb-5">
              <ArrowLeft className="w-3 h-3" /> Back to Library
            </button>

            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-green-100 dark:bg-green-900/40 flex items-center justify-center flex-shrink-0">
                <SubjectIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                {chapter.subject} · Class {chapter.classNum}
              </span>
            </div>
            <p className="text-sm font-bold text-gray-900 dark:text-white leading-snug mb-3">
              {chapter.chapterName}
            </p>
            <div className="space-y-1 mb-4">
              {createdDate && (
                <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
                  <Calendar className="w-3 h-3" /><span>Added {createdDate}</span>
                </div>
              )}
              {questionCount > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
                  <HelpCircle className="w-3 h-3" /><span>{questionCount} questions</span>
                </div>
              )}
              {chapter.language && (
                <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
                  chapter.language === "hindi"
                    ? "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400"
                    : "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                }`}>
                  {chapter.language === "hindi" ? "हिंदी" : "English"}
                </span>
              )}
            </div>

            {/* ── Share Notes ── */}
            <div className="mt-3 mb-3">
              {!shareToken ? (
                <button
                  onClick={handleCreateShare}
                  disabled={shareLoading || !chapter.notes}
                  className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-green-600 dark:hover:text-green-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors w-full"
                >
                  {shareLoading
                    ? <Loader2 className="w-3 h-3 animate-spin" />
                    : <Share2 className="w-3 h-3" />}
                  {shareRevoked ? "Link removed" : "Share Notes"}
                </button>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                    <span className="text-xs font-medium text-green-600 dark:text-green-400">Share active</span>
                  </div>
                  <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg pl-2 pr-1 py-1">
                    <span className="text-xs text-gray-400 flex-1 truncate font-mono leading-none">
                      /share/{shareToken.slice(0, 10)}…
                    </span>
                    <button
                      onClick={handleCopyShare}
                      title="Copy link"
                      className="flex-shrink-0 p-1 text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors rounded"
                    >
                      {shareCopied
                        ? <CheckCheck className="w-3.5 h-3.5 text-green-500" />
                        : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <button
                    onClick={handleRevokeShare}
                    disabled={shareLoading}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors disabled:opacity-40"
                  >
                    {shareLoading
                      ? <Loader2 className="w-3 h-3 animate-spin" />
                      : <Trash2 className="w-3 h-3" />}
                    Remove link
                  </button>
                </div>
              )}
            </div>

            {/* ── Publish to Community ── */}
            <div className="mb-3">
              {publishSuccess && (
                <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 mb-1.5 bg-green-50 dark:bg-green-900/20 rounded-lg px-2 py-1.5">
                  <Check className="w-3 h-3" />
                  <span>Published successfully!</span>
                </div>
              )}
              {currentPublish ? (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                    <span className="text-xs font-medium text-green-600 dark:text-green-400">Community post live</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {currentPublish.publishedSections.map(s => {
                      const meta = SECTION_META.find(m => m.key === s);
                      return meta ? (
                        <span key={s} className="text-xs bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 px-1.5 py-0.5 rounded-full">
                          {meta.label}
                        </span>
                      ) : null;
                    })}
                  </div>
                  <button
                    onClick={() => { setPublishError(null); setShowPublishModal(true); }}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                  >
                    <Globe className="w-3 h-3" />
                    Update post
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { setPublishError(null); setShowPublishModal(true); }}
                  className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors w-full"
                >
                  <Globe className="w-3 h-3" />
                  Publish to Community
                </button>
              )}
            </div>

            <div className="h-px bg-gray-100 dark:bg-gray-800 mb-3" />

            {/* Study sections */}
            <div className="mb-1">
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide px-3 mb-1.5">Study</p>
              {SIDEBAR_ITEMS.filter(s => s.group === "study").map(item => (
                <button key={item.key} onClick={() => switchSection(item.key)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all mb-0.5 ${
                    activeSection === item.key
                      ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}>
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.key === "questions" && questionCount > 0 && (
                    <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded-full">
                      {questionCount}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="h-px bg-gray-100 dark:bg-gray-800 my-3" />

            {/* AI Tools sections */}
            <div className="mb-1">
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide px-3 mb-1.5">
                AI Tools
              </p>
              {SIDEBAR_ITEMS.filter(s => s.group === "ai").map(item => {
                const isReady = !!chapter[item.key as keyof Chapter];
                const isCurrentlyGenerating = generatingSection === item.key;
                return (
                  <button key={item.key} onClick={() => switchSection(item.key)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all mb-0.5 ${
                      activeSection === item.key
                        ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}>
                    {isCurrentlyGenerating
                      ? <Loader2 className="w-4 h-4 flex-shrink-0 animate-spin text-green-500" />
                      : <item.icon className="w-4 h-4 flex-shrink-0" />
                    }
                    <span className="flex-1 text-left">{item.label}</span>
                    {isReady && !isCurrentlyGenerating && (
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="h-px bg-gray-100 dark:bg-gray-800 my-3" />

            {/* Simulations */}
            <div>
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide px-3 mb-1.5">
                Simulations
              </p>
              {SIDEBAR_ITEMS.filter(s => s.group === "sim").map(item => {
                const isReady = simCount > 0;
                const isCurrentlyGenerating = generatingSection === item.key;
                return (
                  <button key={item.key} onClick={() => switchSection(item.key)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all mb-0.5 ${
                      activeSection === item.key
                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}>
                    {isCurrentlyGenerating
                      ? <Loader2 className="w-4 h-4 flex-shrink-0 animate-spin text-blue-500" />
                      : <item.icon className="w-4 h-4 flex-shrink-0" />
                    }
                    <span className="flex-1 text-left">{item.label}</span>
                    {isReady && !isCurrentlyGenerating && (
                      <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded-full">
                        {simCount}
                      </span>
                    )}
                    {!isReady && !isCurrentlyGenerating && (
                      <span className="text-xs text-blue-400 dark:text-blue-500 font-medium">New</span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="h-px bg-gray-100 dark:bg-gray-800 my-3" />

            {/* Community */}
            <div>
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide px-3 mb-1.5">
                Community
              </p>
              {SIDEBAR_ITEMS.filter(s => s.group === "community").map(item => (
                <button key={item.key} onClick={() => switchSection(item.key)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all mb-0.5 ${
                    activeSection === item.key
                      ? "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}>
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1 text-left">{item.label}</span>
                </button>
              ))}
            </div>

            <div className="h-px bg-gray-100 dark:bg-gray-800 my-3" />

            {/* Exam Paper */}
            <div>
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide px-3 mb-1.5">
                Exam Tools
              </p>
              {SIDEBAR_ITEMS.filter(s => s.group === "exam").map(item => {
                const isReady = !!(chapter as any).examPaper;
                return (
                  <button key={item.key} onClick={() => switchSection(item.key)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all mb-0.5 ${
                      activeSection === item.key
                        ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}>
                    {generatingExamPaper
                      ? <Loader2 className="w-4 h-4 flex-shrink-0 animate-spin text-amber-500" />
                      : <item.icon className="w-4 h-4 flex-shrink-0" />
                    }
                    <span className="flex-1 text-left">{item.label}</span>
                    {isReady && !generatingExamPaper && (
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                    )}
                    {!isReady && !generatingExamPaper && (
                      <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">PDF</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* ── Mobile Bottom Tab Bar ── */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex overflow-x-auto">
          {SIDEBAR_ITEMS.map(item => (
            <button key={item.key} onClick={() => switchSection(item.key)}
              className={`flex flex-col items-center py-2 px-3 text-xs font-medium transition-colors flex-shrink-0 ${
                activeSection === item.key
                  ? item.group === "sim" ? "text-blue-600" : "text-green-600"
                  : "text-gray-400"
              }`}>
              {generatingSection === item.key
                ? <Loader2 className={`w-5 h-5 mb-0.5 animate-spin ${item.group === "sim" ? "text-blue-500" : "text-green-500"}`} />
                : <item.icon className="w-5 h-5 mb-0.5" />
              }
              <span className="truncate" style={{ maxWidth: "60px" }}>{item.label}</span>
              {item.key === "simulations" && simCount > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-0.5" />
              )}
            </button>
          ))}
        </div>

        {/* ── Main Content ── */}
        <main className="flex-1 md:ml-64 p-4 md:p-8 pb-24 md:pb-8">
          {/* Mobile chapter header */}
          <div className="md:hidden mb-4 pb-4 border-b border-gray-100 dark:border-gray-800">
            <button onClick={() => navigate("/dashboard")} className="flex items-center gap-1 text-xs text-gray-400 hover:text-green-600 mb-2">
              <ArrowLeft className="w-3 h-3" /> Back to Library
            </button>
            <div className="flex items-center gap-2">
              <SubjectIcon className="w-4 h-4 text-green-600" />
              <span className="text-xs font-semibold text-green-600">{chapter.subject} · Class {chapter.classNum}</span>
            </div>
            <p className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">{chapter.chapterName}</p>
            {createdDate && (
              <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Added {createdDate}
              </p>
            )}
          </div>

          {genError && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl px-4 py-3 text-sm flex items-center justify-between">
              <span>{genError}</span>
              <button onClick={() => generateSection(activeSection)} className="ml-3 underline text-xs">Retry</button>
            </div>
          )}

          
            <div
              key={activeSection}>
              {renderSection()}
            </div>
          
        </main>
      </div>

      {showPublishModal && chapter && (
        <PublishModal
          chapter={chapter}
          currentPublish={currentPublish}
          onClose={() => setShowPublishModal(false)}
          onPublish={handlePublish}
          onUnpublish={handleUnpublish}
          loading={publishLoading}
          error={publishError}
        />
      )}
    </div>
  );
}
