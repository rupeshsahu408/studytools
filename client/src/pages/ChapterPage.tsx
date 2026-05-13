import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import {
  BookOpen, HelpCircle, ArrowLeft, Atom, FlaskConical,
  Calculator, Leaf, Calendar, Sigma, Network, AlertTriangle,
  Layers, MessageCircle, HelpingHand, Loader2, Beaker, Users, Zap, FileText,
  Copy, CheckCheck, Trash2, Globe, X, Check, Share2,
  Menu, Settings, Sun, Moon, Bell, LogOut,
} from "lucide-react";
import {
  getChapter, updateChapterSection, createShareLink, revokeShareLink,
  publishNote, unpublishNote, getPublishedNote, subscribeToSocialUser,
  onNotificationsSnapshot,
} from "../lib/firestore";
import type { Chapter, PublicNote, PublishableSection, SocialUser } from "../lib/firestore";
import {
  generateFormulas, generateMindmap, generateMistakes,
  generateFlashcards, generateSimulationCatalog, regenerateQuestionBatch,
  regenerateNotes, generateSummary, generateExamPaper, generateQuestions,
} from "../lib/api";
import { useProgress } from "../contexts/ProgressContext";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import TopHeader from "../components/TopHeader";
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

const TAB_ITEMS = [
  { key: "notes",       label: "Notes",        icon: BookOpen,       group: "study" },
  { key: "questions",   label: "Questions",    icon: HelpCircle,     group: "study" },
  { key: "summary",     label: "Revision",     icon: Zap,            group: "ai" },
  { key: "formulas",    label: "Formulas",     icon: Sigma,          group: "ai" },
  { key: "mindmap",     label: "Mind Map",     icon: Network,        group: "ai" },
  { key: "mistakes",    label: "Ye Galti",     icon: AlertTriangle,  group: "ai" },
  { key: "flashcards",  label: "Flash Cards",  icon: Layers,         group: "ai" },
  { key: "simulations", label: "Simulations",  icon: Beaker,         group: "sim" },
  { key: "chat",        label: "Doubt Chat",   icon: MessageCircle,  group: "ai" },
  { key: "discussion",  label: "Discussion",   icon: Users,          group: "community" },
  { key: "exampaper",   label: "Exam Paper",   icon: FileText,       group: "exam" },
];

const PUBLISH_BOARDS = [
  "Bihar Board", "UP Board", "MP Board", "Rajasthan Board",
  "Haryana Board", "Uttarakhand Board", "CBSE", "ICSE", "Other",
];

const SECTION_META: { key: PublishableSection; label: string; icon: any }[] = [
  { key: "notes",      label: "Notes",         icon: BookOpen },
  { key: "questions",  label: "Questions",     icon: HelpCircle },
  { key: "summary",    label: "Quick Revision", icon: Zap },
  { key: "formulas",   label: "Formulas",      icon: Sigma },
  { key: "mindmap",    label: "Concept Map",   icon: Network },
  { key: "flashcards", label: "Flash Cards",   icon: Layers },
  { key: "mistakes",   label: "Ye Galti Mat Karo", icon: AlertTriangle },
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
    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
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

function getAvailableSections(chapter: Chapter): PublishableSection[] {
  const secs: PublishableSection[] = [];
  if (chapter.notes) secs.push("notes");
  if (chapter.questions) secs.push("questions");
  if (chapter.summary) secs.push("summary");
  if (Array.isArray(chapter.formulas) && chapter.formulas.length) secs.push("formulas");
  if (chapter.mindmap) secs.push("mindmap");
  if (Array.isArray(chapter.flashcards) && chapter.flashcards.length) secs.push("flashcards");
  if (Array.isArray(chapter.mistakes) && chapter.mistakes.length) secs.push("mistakes");
  return secs;
}

function PublishModal({
  chapter, currentPublish, onClose, onPublish, onUnpublish, loading, error,
}: {
  chapter: Chapter; currentPublish: PublicNote | null;
  onClose: () => void; onPublish: (sections: PublishableSection[], board: string) => void;
  onUnpublish: () => void; loading: boolean; error: string | null;
}) {
  const available = getAvailableSections(chapter);
  const initial: Set<PublishableSection> = currentPublish ? new Set(currentPublish.publishedSections) : new Set(available);
  const [selected, setSelected] = useState<Set<PublishableSection>>(initial);
  const [board, setBoard] = useState(currentPublish?.board || "Bihar Board");
  const [confirmUnpublish, setConfirmUnpublish] = useState(false);

  const toggle = (key: PublishableSection) => {
    setSelected(prev => { const s = new Set(prev); s.has(key) ? s.delete(key) : s.add(key); return s; });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
      <div className="bg-gray-50 dark:bg-gray-950 w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-green-600 dark:text-green-400" />
            <h2 className="font-bold text-gray-900 dark:text-white text-base">
              {currentPublish ? "Update Community Post" : "Publish to Community"}
            </h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-3 border border-gray-100 dark:border-gray-800">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{chapter.chapterName}</p>
            <p className="text-xs text-gray-400 mt-0.5">{chapter.subject} · Class {chapter.classNum}</p>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1.5">Board</label>
            <select value={board} onChange={e => setBoard(e.target.value)}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500/30">
              {PUBLISH_BOARDS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-2">Select what to publish</label>
            {available.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Generate some content first.</p>
            ) : (
              <div className="space-y-2">
                {SECTION_META.filter(m => available.includes(m.key)).map(({ key, label, icon: Icon }) => (
                  <button key={key} onClick={() => toggle(key)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                      selected.has(key)
                        ? "border-green-400 dark:border-green-600 bg-green-50 dark:bg-green-900/20"
                        : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                    }`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${selected.has(key) ? "bg-green-100 dark:bg-green-900/40" : "bg-gray-100 dark:bg-gray-800"}`}>
                      <Icon className={`w-4 h-4 ${selected.has(key) ? "text-green-600 dark:text-green-400" : "text-gray-400"}`} />
                    </div>
                    <span className={`text-sm font-medium flex-1 ${selected.has(key) ? "text-green-700 dark:text-green-300" : "text-gray-700 dark:text-gray-300"}`}>{label}</span>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selected.has(key) ? "bg-green-500 border-green-500" : "border-gray-300 dark:border-gray-600"}`}>
                      {selected.has(key) && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-xl px-3 py-2">{error}</p>}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex-shrink-0 space-y-2">
          <button onClick={() => onPublish(Array.from(selected), board)} disabled={loading || selected.size === 0}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
            {loading ? "Publishing…" : currentPublish ? "Update Post" : "Publish to Community"}
          </button>
          {currentPublish && !confirmUnpublish && (
            <button onClick={() => setConfirmUnpublish(true)} className="w-full text-sm text-red-500 hover:text-red-600 py-2">Remove from community</button>
          )}
          {currentPublish && confirmUnpublish && (
            <div className="flex gap-2">
              <button onClick={() => setConfirmUnpublish(false)} className="flex-1 text-sm text-gray-500 border border-gray-200 dark:border-gray-700 py-2 rounded-xl">Cancel</button>
              <button onClick={onUnpublish} disabled={loading} className="flex-1 text-sm text-white bg-red-500 hover:bg-red-600 py-2 rounded-xl flex items-center justify-center gap-1 disabled:opacity-50">
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null} Yes, Remove
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ChapterPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mobileTabScrollRef = useRef<HTMLDivElement>(null);
  const tabScrollRef = useRef<HTMLDivElement>(null);

  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState(() => searchParams.get("section") || "notes");
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

  // Mobile popup states
  const [showMenuPopup, setShowMenuPopup] = useState(false);
  const [showSettingsPopup, setShowSettingsPopup] = useState(false);
  const [unreadNotifs, setUnreadNotifs] = useState(0);

  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { markNotesRead, trackQuestionAnswer, markFlashcardsDone, markSimulationSeen, userData } = useProgress();
  const [socialUser, setSocialUser] = useState<SocialUser | null>(null);

  useEffect(() => {
    if (!user?.uid) return;
    return subscribeToSocialUser(user.uid, setSocialUser);
  }, [user?.uid]);

  useEffect(() => {
    if (!user) { setUnreadNotifs(0); return; }
    const unsub = onNotificationsSnapshot(user.uid, setUnreadNotifs);
    return unsub;
  }, [user]);

  useEffect(() => { if (!id) return; loadChapter(); }, [id]);
  useEffect(() => { if (!id) return; getPublishedNote(id).then(setCurrentPublish).catch(() => {}); }, [id]);

  const loadChapter = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await getChapter(id);
      setChapter(data);
      setShareToken(data?.shareToken ?? null);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleCreateShare = useCallback(async () => {
    if (!chapter || !user || shareLoading) return;
    setShareLoading(true);
    try {
      const name = userData?.profile?.name || user.displayName || "A student";
      const token = await createShareLink(chapter.id, user.uid, {
        chapterName: chapter.chapterName, subject: chapter.subject, classNum: chapter.classNum,
        language: chapter.language || "english", notes: chapter.notes, sharedByName: name,
      });
      setShareToken(token);
    } catch (e) { console.error("Share creation failed:", e); }
    finally { setShareLoading(false); }
  }, [chapter, user, shareLoading]);

  const handlePublish = useCallback(async (sections: PublishableSection[], board: string) => {
    if (!chapter || !user || publishLoading) return;
    setPublishLoading(true); setPublishError(null);
    try {
      const publisherName = userData?.profile?.name || user.displayName || "Student";
      const publisherUsername = socialUser?.username || "";
      const data: Omit<PublicNote, "id" | "publishedAt" | "viewCount"> = {
        userId: user.uid, chapterId: chapter.id, chapterName: chapter.chapterName,
        publisherName, publisherUsername, board, classNum: chapter.classNum,
        medium: chapter.language || "hindi", subject: chapter.subject, publishedSections: sections,
      };
      sections.forEach(sec => { (data as any)[sec] = (chapter as any)[sec]; });
      await publishNote(chapter.id, data);
      const updated = await getPublishedNote(chapter.id);
      setCurrentPublish(updated); setShowPublishModal(false);
      setPublishSuccess(true); setTimeout(() => setPublishSuccess(false), 3000);
    } catch { setPublishError("Publish failed. Please try again."); }
    finally { setPublishLoading(false); }
  }, [chapter, user, userData, socialUser, publishLoading]);

  const handleUnpublish = useCallback(async () => {
    if (!chapter || publishLoading) return;
    setPublishLoading(true); setPublishError(null);
    try { await unpublishNote(chapter.id); setCurrentPublish(null); setShowPublishModal(false); }
    catch { setPublishError("Failed to remove. Please try again."); }
    finally { setPublishLoading(false); }
  }, [chapter, publishLoading]);

  const handleRevokeShare = useCallback(async () => {
    if (!chapter || !shareToken || shareLoading) return;
    if (!window.confirm("Remove this share link?")) return;
    setShareLoading(true);
    try { await revokeShareLink(chapter.id, shareToken); setShareToken(null); setShareRevoked(true); setTimeout(() => setShareRevoked(false), 2000); }
    catch (e) { console.error("Revoke failed:", e); }
    finally { setShareLoading(false); }
  }, [chapter, shareToken, shareLoading]);

  const handleCopyShare = useCallback(() => {
    if (!shareToken) return;
    const url = `${window.location.origin}/share/${shareToken}`;
    navigator.clipboard.writeText(url).then(() => { setShareCopied(true); setTimeout(() => setShareCopied(false), 2000); });
  }, [shareToken]);

  const generateSection = useCallback(async (sectionKey: string) => {
    if (!chapter || generatingSection) return;
    setGeneratingSection(sectionKey); setGenError(null);
    try {
      let result: any;
      const { text, subject, classNum, chapterName, language } = chapter;
      if (sectionKey === "summary") { const d = await generateSummary(text, subject, classNum, chapterName, language || "english"); result = d.summary || null; }
      else if (sectionKey === "formulas") { const d = await generateFormulas(text, subject, classNum, chapterName, language); result = d.formulas || []; }
      else if (sectionKey === "mindmap") { const d = await generateMindmap(text, subject, classNum, chapterName, language || "english"); result = d.mindmap || null; }
      else if (sectionKey === "mistakes") { const d = await generateMistakes(text, subject, classNum, chapterName, language); result = d.mistakes || []; }
      else if (sectionKey === "flashcards") { const d = await generateFlashcards(text, subject, classNum, chapterName, language); result = d.cards || []; }
      else if (sectionKey === "simulations") { const d = await generateSimulationCatalog(text, subject, classNum, chapterName); result = d.simulations || []; }
      else if (sectionKey === "questions") { const d = await generateQuestions(text, subject, classNum, chapterName, language || "english"); result = d.questions || null; }
      if (result !== undefined && chapter.id) {
        await updateChapterSection(chapter.id, sectionKey, result);
        setChapter(prev => prev ? { ...prev, [sectionKey]: result } : prev);
      }
    } catch (err: any) { console.error(`Error generating ${sectionKey}:`, err); setGenError(`Could not generate ${sectionKey}. Please try again.`); }
    finally { setGeneratingSection(null); }
  }, [chapter, generatingSection]);

  useEffect(() => {
    if (!chapter || loading) return;
    const lazyKeys = ["summary", "formulas", "mindmap", "mistakes", "flashcards", "simulations"];
    if (lazyKeys.includes(activeSection) && !chapter[activeSection as keyof Chapter] && !generatingSection) {
      generateSection(activeSection);
    }
  }, [activeSection, chapter, loading]);

  const switchSection = (key: string) => {
    setActiveSection(key); setGenError(null);
    setTimeout(() => {
      const el = document.getElementById(`tab-${key}`);
      el?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      const mobEl = document.getElementById(`mob-tab-${key}`);
      mobEl?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }, 50);
  };

  const handleRetryBatch = useCallback(async (batch: "A" | "B") => {
    if (!chapter || retryingBatch) return;
    setRetryingBatch(batch); setGenError(null);
    try {
      const { text, subject, classNum, chapterName, language } = chapter;
      const { questions: newBatchQuestions } = await regenerateQuestionBatch(text, subject, classNum, chapterName, language || "english", batch);
      const merged = { ...(chapter.questions || {}), ...newBatchQuestions };
      if (chapter.id) await updateChapterSection(chapter.id, "questions", merged);
      setChapter(prev => prev ? { ...prev, questions: merged } : prev);
    } catch (err: any) { console.error(`Error retrying batch ${batch}:`, err); setGenError("Could not generate missing questions. Please try again."); }
    finally { setRetryingBatch(null); }
  }, [chapter, retryingBatch]);

  const handleRegenerateNotes = useCallback(async () => {
    if (!chapter || regeneratingNotes) return;
    setRegeneratingNotes(true); setGenError(null);
    try {
      const { text, subject, classNum, chapterName, language } = chapter;
      const data = await regenerateNotes(text, subject, classNum, chapterName, language || "english");
      if (data.notes && chapter.id) { await updateChapterSection(chapter.id, "notes", data.notes); setChapter(prev => prev ? { ...prev, notes: data.notes } : prev); }
    } catch (err: any) { console.error("Error regenerating notes:", err); setGenError("Could not regenerate notes. Please try again."); }
    finally { setRegeneratingNotes(false); }
  }, [chapter, regeneratingNotes]);

  const handleRegenerateSummary = useCallback(async () => {
    if (!chapter || regeneratingSummary) return;
    setRegeneratingSummary(true); setGenError(null);
    try {
      const { text, subject, classNum, chapterName, language } = chapter;
      const data = await generateSummary(text, subject, classNum, chapterName, language || "english");
      if (data.summary && chapter.id) { await updateChapterSection(chapter.id, "summary", data.summary); setChapter(prev => prev ? { ...prev, summary: data.summary } : prev); }
    } catch (err: any) { console.error("Error regenerating summary:", err); setGenError("Could not regenerate summary. Please try again."); }
    finally { setRegeneratingSummary(false); }
  }, [chapter, regeneratingSummary]);

  const handleGenerateExamPaper = useCallback(async () => {
    if (!chapter || generatingExamPaper) return;
    setGeneratingExamPaper(true); setExamPaperError(null);
    try {
      const { text, subject, classNum, chapterName, language } = chapter;
      const data = await generateExamPaper(text, subject, classNum, chapterName, language || "english");
      if (data && chapter.id) {
        const paperData = { mcq: data.mcq || [], twoMarks: data.twoMarks || [], fiveMarks: data.fiveMarks || [] };
        await updateChapterSection(chapter.id, "examPaper", paperData);
        setChapter(prev => prev ? { ...prev, examPaper: paperData } : prev);
      }
    } catch (err: any) { console.error("Error generating exam paper:", err); setExamPaperError(err?.response?.data?.error || "Could not generate exam paper."); }
    finally { setGeneratingExamPaper(false); }
  }, [chapter, generatingExamPaper]);

  const handleResetExamPaper = useCallback(async () => {
    if (!chapter?.id) return;
    await updateChapterSection(chapter.id, "examPaper", null);
    setChapter(prev => prev ? { ...prev, examPaper: null } : prev);
    setExamPaperError(null);
  }, [chapter]);

  const handleNotesRead = useCallback(() => { if (id) markNotesRead(id); }, [id, markNotesRead]);
  const handleQuestionAnswered = useCallback((isWrong: boolean, question: { id: string; question: string; type: string }) => {
    if (id) trackQuestionAnswer(id, isWrong, question);
  }, [id, trackQuestionAnswer]);
  const handleFlashcardsDone = useCallback(() => { if (id) markFlashcardsDone(id); }, [id, markFlashcardsDone]);
  const handleSimLaunched = useCallback(() => { if (id) markSimulationSeen(id); }, [id, markSimulationSeen]);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

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
          <button onClick={() => navigate("/dashboard")} className="text-green-600 hover:underline text-sm">← Back to Library</button>
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
          ? <NotesView notes={chapter.notes} subject={chapter.subject} chapterName={chapter.chapterName} classNum={chapter.classNum} onRead={handleNotesRead} onRegenerate={handleRegenerateNotes} regenerating={regeneratingNotes} />
          : <div className="text-gray-400 py-10 text-center text-sm">Notes not available.</div>;

      case "questions":
        if (isGenerating("questions")) return <SectionGenerating label="Question Bank" />;
        if (!chapter.questions) return <SectionEmpty label="Question Bank" description="AI will generate a complete question bank — MCQs, 1-mark, 2-mark, 5-mark, Assertion-Reason, Case-Based, True/False, Fill in the Blanks, and Exam Important questions — all tailored to Bihar Board pattern." onGenerate={() => generateSection("questions")} generating={generatingSection === "questions"} />;
        return <QuestionsView questions={chapter.questions} onQuestionAnswered={handleQuestionAnswered} onRetryBatch={handleRetryBatch} retryingBatch={retryingBatch} userId={user?.uid} chapterId={chapter.id} chapterName={chapter.chapterName} subject={chapter.subject} />;

      case "summary":
        if (isGenerating("summary")) return <SectionGenerating label="Quick Revision" />;
        if (!chapter.summary) return <SectionEmpty label="Quick Revision" description="AI will create a complete one-shot revision of this chapter — key concepts, all formulas, exam spotlight, and 10 last-night revision points." onGenerate={() => generateSection("summary")} generating={generatingSection === "summary"} />;
        return <SummaryView summary={chapter.summary as any} chapterName={chapter.chapterName} subject={chapter.subject} classNum={String(chapter.classNum || "11")} onRegenerate={handleRegenerateSummary} regenerating={regeneratingSummary} />;

      case "formulas":
        if (isGenerating("formulas")) return <SectionGenerating label="Formula Sheet" />;
        if (!chapter.formulas || (chapter.formulas as any[]).length === 0) return <SectionEmpty label="Formula Sheet" description="AI will extract every formula from this chapter with variables, SI units, and derivation hints." onGenerate={() => generateSection("formulas")} generating={generatingSection === "formulas"} />;
        return <FormulaSheet formulas={chapter.formulas as any[]} chapterName={chapter.chapterName} subject={chapter.subject} classNum={String(chapter.classNum || "11")} />;

      case "mindmap":
        if (isGenerating("mindmap")) return <SectionGenerating label="Concept Map" />;
        if (!chapter.mindmap) return <SectionEmpty label="Concept Map" description="AI will create an interactive concept map showing how all topics in this chapter connect." onGenerate={() => generateSection("mindmap")} generating={generatingSection === "mindmap"} />;
        return <MindMap mindmap={chapter.mindmap} chapterName={chapter.chapterName} subject={chapter.subject} classNum={String(chapter.classNum || "11")} />;

      case "mistakes":
        if (isGenerating("mistakes")) return <SectionGenerating label="Common Mistakes" />;
        if (!chapter.mistakes || (chapter.mistakes as any[]).length === 0) return <SectionEmpty label="Ye Galti Mat Karo" description="AI will identify the top 10 most common and costly mistakes Bihar Board students make in this chapter." onGenerate={() => generateSection("mistakes")} generating={generatingSection === "mistakes"} />;
        return <MistakesView mistakes={chapter.mistakes as any[]} />;

      case "flashcards":
        if (isGenerating("flashcards")) return <SectionGenerating label="Flash Cards" />;
        if (!chapter.flashcards || (chapter.flashcards as any[]).length === 0) return <SectionEmpty label="Flash Cards" description="AI will generate 25 flash cards for quick revision of all key concepts, formulas, and definitions." onGenerate={() => generateSection("flashcards")} generating={generatingSection === "flashcards"} />;
        return <FlashCards cards={chapter.flashcards as any[]} onAllDone={handleFlashcardsDone} userId={user?.uid} chapterId={chapter.id} chapterName={chapter.chapterName} subject={chapter.subject} />;

      case "chat":
        return <DoubtChat chapterName={chapter.chapterName} subject={chapter.subject} language={chapter.language} chapterText={chapter.text || ""} chapterId={chapter.id} userId={user?.uid || ""} />;

      case "simulations":
        if (isGenerating("simulations")) return <SectionGenerating label="Interactive Simulations" />;
        if (!chapter.simulations || simCount === 0) return <SectionEmpty label="Interactive Simulations" description="AI will analyze this chapter and identify all topics that can be visualized with interactive 2D/3D simulations." onGenerate={() => generateSection("simulations")} generating={generatingSection === "simulations"} />;
        return <SimulationsView simulations={chapter.simulations} chapterName={chapter.chapterName} subject={chapter.subject} language={chapter.language} chapterText={chapter.text || ""} onSimLaunched={handleSimLaunched} />;

      case "discussion":
        return <DiscussionView chapterId={chapter.id} chapterName={chapter.chapterName} subject={chapter.subject} language={chapter.language} chapterText={chapter.text || ""} />;

      case "exampaper":
        if (generatingExamPaper) return <ExamPaperGenerating />;
        return <ExamPaperView subject={chapter.subject} classNum={chapter.classNum} chapterName={chapter.chapterName} paper={(chapter.examPaper as any) || null} generating={generatingExamPaper} error={examPaperError} onGenerate={handleGenerateExamPaper} onReset={handleResetExamPaper} />;

      default: return null;
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">

      {/* ── Desktop TopHeader (hidden on mobile) ── */}
      <TopHeader
        className="hidden md:flex"
        showBack
        backTo="/dashboard"
        backLabel="Library"
        rightSlot={
          <button
            onClick={() => { setPublishError(null); setShowPublishModal(true); }}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
              currentPublish
                ? "text-green-600 bg-green-50 dark:bg-green-900/20"
                : "text-gray-400 hover:text-green-600 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
          </button>
        }
      />

      {/* ── Mobile Header (hidden on desktop) ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 h-12 flex items-center">

        {/* Menu toggle button */}
        <button
          onClick={() => setShowMenuPopup(true)}
          className="w-12 h-12 flex items-center justify-center text-gray-500 dark:text-gray-400 flex-shrink-0 active:bg-gray-100 dark:active:bg-gray-800 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Scrollable tab strip */}
        <div ref={mobileTabScrollRef} className="flex-1 overflow-x-auto scrollbar-none h-full">
          <div className="flex items-center h-full min-w-max px-1">
            {TAB_ITEMS.map(item => {
              const isActive = activeSection === item.key;
              const isCurrentlyGenerating = generatingSection === item.key || (item.key === "exampaper" && generatingExamPaper);
              const isReady = item.key === "simulations" ? simCount > 0
                : item.key === "questions" ? questionCount > 0
                : item.key === "exampaper" ? !!(chapter as any).examPaper
                : !!(chapter[item.key as keyof Chapter]);

              return (
                <button
                  id={`mob-tab-${item.key}`}
                  key={item.key}
                  onClick={() => switchSection(item.key)}
                  className={`flex items-center gap-1.5 px-3 h-full text-xs font-medium whitespace-nowrap flex-shrink-0 border-b-2 transition-all relative ${
                    isActive
                      ? "text-green-600 dark:text-green-400 border-green-600 dark:border-green-400"
                      : "text-gray-400 dark:text-gray-500 border-transparent"
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    {isCurrentlyGenerating
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin text-green-500" />
                      : <item.icon className="w-3.5 h-3.5" />
                    }
                    {isReady && !isCurrentlyGenerating && !isActive && (
                      <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-green-500 rounded-full" />
                    )}
                  </div>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Settings button */}
        <button
          onClick={() => setShowSettingsPopup(true)}
          className="w-12 h-12 flex items-center justify-center text-gray-500 dark:text-gray-400 flex-shrink-0 active:bg-gray-100 dark:active:bg-gray-800 transition-colors relative"
        >
          <Settings className="w-5 h-5" />
          {unreadNotifs > 0 && (
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
          )}
        </button>
      </div>

      {/* ── Chapter info strip ── */}
      <div className="fixed top-12 left-0 right-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-2">
        <div className="flex items-center gap-2 max-w-4xl mx-auto">
          <SubjectIcon className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
          <span className="text-xs font-semibold text-green-600 flex-shrink-0">{chapter.subject} · Cl.{chapter.classNum}</span>
          <span className="text-gray-200 dark:text-gray-700 flex-shrink-0">|</span>
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{chapter.chapterName}</span>
          {createdDate && <span className="text-xs text-gray-400 flex-shrink-0 hidden sm:flex items-center gap-1"><Calendar className="w-3 h-3" />{createdDate}</span>}
          {publishSuccess && <span className="text-xs text-green-600 font-semibold ml-auto flex-shrink-0">✓ Published!</span>}
        </div>
      </div>

      {/* ── Desktop: Horizontal scrollable tab bar ── */}
      <div ref={tabScrollRef} className="hidden md:block fixed top-[88px] left-0 right-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 overflow-x-auto scrollbar-none">
        <div className="flex items-center px-2 min-w-max">
          {TAB_ITEMS.map(item => {
            const isActive = activeSection === item.key;
            const isCurrentlyGenerating = generatingSection === item.key || (item.key === "exampaper" && generatingExamPaper);
            const isReady = item.key === "simulations" ? simCount > 0
              : item.key === "questions" ? questionCount > 0
              : item.key === "exampaper" ? !!(chapter as any).examPaper
              : !!(chapter[item.key as keyof Chapter]);

            return (
              <button
                id={`tab-${item.key}`}
                key={item.key}
                onClick={() => switchSection(item.key)}
                className={`flex flex-col items-center gap-0.5 px-3.5 py-2.5 text-xs font-medium transition-all flex-shrink-0 relative border-b-2 ${
                  isActive
                    ? "text-green-600 dark:text-green-400 border-green-600 dark:border-green-400"
                    : "text-gray-400 dark:text-gray-500 border-transparent hover:text-gray-600 dark:hover:text-gray-300"
                }`}
              >
                <div className="relative">
                  {isCurrentlyGenerating
                    ? <Loader2 className="w-4 h-4 animate-spin text-green-500" />
                    : <item.icon className="w-4 h-4" />
                  }
                  {isReady && !isCurrentlyGenerating && !isActive && (
                    <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-green-500 rounded-full" />
                  )}
                </div>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Desktop Sidebar (md+) ── */}
      <aside className="hidden md:flex flex-col w-56 fixed left-0 top-12 h-[calc(100vh-3rem)] bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 overflow-y-auto z-20">
        <div className="p-4">
          <button onClick={() => navigate("/dashboard")} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-green-600 transition-colors mb-4">
            <ArrowLeft className="w-3 h-3" /> Back to Library
          </button>
          <div className="flex items-center gap-2 mb-1">
            <SubjectIcon className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
            <span className="text-xs font-semibold text-green-600 dark:text-green-400">{chapter.subject} · Class {chapter.classNum}</span>
          </div>
          <p className="text-xs font-bold text-gray-900 dark:text-white leading-snug mb-2">{chapter.chapterName}</p>
          <div className="space-y-0.5 mb-3 text-xs text-gray-400">
            {createdDate && <div className="flex items-center gap-1"><Calendar className="w-3 h-3" /><span>Added {createdDate}</span></div>}
            {questionCount > 0 && <div className="flex items-center gap-1"><HelpCircle className="w-3 h-3" /><span>{questionCount} questions</span></div>}
          </div>

          {/* Share */}
          <div className="mb-2 pb-2 border-b border-gray-100 dark:border-gray-800">
            {!shareToken ? (
              <button onClick={handleCreateShare} disabled={shareLoading || !chapter.notes}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-green-600 disabled:opacity-40 transition-colors">
                {shareLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Share2 className="w-3 h-3" />}
                {shareRevoked ? "Link removed" : "Share Notes"}
              </button>
            ) : (
              <div className="space-y-1">
                <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-green-500" /><span className="text-xs font-medium text-green-600">Share active</span></div>
                <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg pl-2 pr-1 py-1">
                  <span className="text-xs text-gray-400 flex-1 truncate font-mono">/share/{shareToken.slice(0,8)}…</span>
                  <button onClick={handleCopyShare} className="flex-shrink-0 p-1 text-gray-400 hover:text-green-600">
                    {shareCopied ? <CheckCheck className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
                <button onClick={handleRevokeShare} disabled={shareLoading} className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors">
                  {shareLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />} Remove link
                </button>
              </div>
            )}
          </div>

          {/* Publish */}
          <div className="mb-3 pb-3 border-b border-gray-100 dark:border-gray-800">
            {publishSuccess && <div className="flex items-center gap-1 text-xs text-green-600 mb-1.5"><Check className="w-3 h-3" />Published!</div>}
            {currentPublish ? (
              <button onClick={() => { setPublishError(null); setShowPublishModal(true); }} className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700">
                <Globe className="w-3 h-3" /> Update community post
              </button>
            ) : (
              <button onClick={() => { setPublishError(null); setShowPublishModal(true); }} className="flex items-center gap-1 text-xs text-gray-400 hover:text-green-600 transition-colors">
                <Globe className="w-3 h-3" /> Publish to Community
              </button>
            )}
          </div>

          {/* Section items */}
          {["study", "ai", "sim", "community", "exam"].map(group => {
            const items = TAB_ITEMS.filter(t => t.group === group);
            const groupLabels: Record<string, string> = { study: "Study", ai: "AI Tools", sim: "Simulations", community: "Community", exam: "Exam Tools" };
            return (
              <div key={group} className="mb-3">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-2 mb-1">{groupLabels[group]}</p>
                {items.map(item => {
                  const isCurrentlyGenerating = generatingSection === item.key || (item.key === "exampaper" && generatingExamPaper);
                  const isReady = item.key === "simulations" ? simCount > 0 : item.key === "questions" ? questionCount > 0 : item.key === "exampaper" ? !!(chapter as any).examPaper : !!(chapter[item.key as keyof Chapter]);
                  return (
                    <button key={item.key} onClick={() => switchSection(item.key)}
                      className={`w-full flex items-center gap-2 px-2 py-2 rounded-xl text-xs font-medium transition-all mb-0.5 ${
                        activeSection === item.key
                          ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                          : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}>
                      {isCurrentlyGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin text-green-500 flex-shrink-0" /> : <item.icon className="w-3.5 h-3.5 flex-shrink-0" />}
                      <span className="flex-1 text-left">{item.label}</span>
                      {isReady && !isCurrentlyGenerating && <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </aside>

      {/* ── Main Content ── */}
      {/* Mobile: top 80px (header 48px + strip 32px), Desktop: top 136px (header+strip+tabs) */}
      <main className="md:ml-56 pt-[80px] md:pt-[136px] pb-8 min-h-screen">
        {genError && (
          <div className="mx-4 mt-4 mb-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl px-4 py-3 text-sm flex items-center justify-between">
            <span>{genError}</span>
            <button onClick={() => generateSection(activeSection)} className="ml-3 underline text-xs">Retry</button>
          </div>
        )}
        <div key={activeSection} className="p-4 md:p-8">
          {renderSection()}
        </div>
      </main>

      {/* ── Mobile Menu Popup (Back / Publish) ── */}
      {showMenuPopup && (
        <div
          className="md:hidden fixed inset-0 z-50 flex items-end"
          style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
          onClick={() => setShowMenuPopup(false)}
        >
          <div
            className="bg-white dark:bg-gray-900 w-full rounded-t-2xl shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-200 dark:bg-gray-700 rounded-full" />
            </div>

            <div className="px-4 pb-2 pt-1">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Navigation</p>

              {/* Back to Dashboard */}
              <button
                onClick={() => { setShowMenuPopup(false); navigate("/dashboard"); }}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors mb-1"
              >
                <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                  <ArrowLeft className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-800 dark:text-white text-sm">Back to Library</p>
                  <p className="text-xs text-gray-400">Return to your chapter list</p>
                </div>
              </button>

              {/* Publish */}
              <button
                onClick={() => { setShowMenuPopup(false); setPublishError(null); setShowPublishModal(true); }}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-colors mb-1 ${
                  currentPublish
                    ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  currentPublish ? "bg-green-100 dark:bg-green-900/40" : "bg-gray-100 dark:bg-gray-800"
                }`}>
                  <Globe className={`w-4 h-4 ${currentPublish ? "text-green-600 dark:text-green-400" : "text-gray-500 dark:text-gray-400"}`} />
                </div>
                <div className="text-left">
                  <p className={`font-semibold text-sm ${currentPublish ? "text-green-700 dark:text-green-300" : "text-gray-800 dark:text-white"}`}>
                    {currentPublish ? "Update Community Post" : "Publish to Community"}
                  </p>
                  <p className="text-xs text-gray-400">
                    {currentPublish ? "Already published · tap to update" : "Share your notes with others"}
                  </p>
                </div>
                {currentPublish && (
                  <span className="ml-auto text-[10px] font-bold bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full flex-shrink-0">LIVE</span>
                )}
              </button>
            </div>

            {/* Safe area spacer */}
            <div className="h-6" />
          </div>
        </div>
      )}

      {/* ── Mobile Settings Popup (Theme / Notifications / Logout) ── */}
      {showSettingsPopup && (
        <div
          className="md:hidden fixed inset-0 z-50 flex items-end"
          style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
          onClick={() => setShowSettingsPopup(false)}
        >
          <div
            className="bg-white dark:bg-gray-900 w-full rounded-t-2xl shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-200 dark:bg-gray-700 rounded-full" />
            </div>

            <div className="px-4 pb-2 pt-1">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Settings</p>

              {/* Theme toggle */}
              <button
                onClick={() => toggleTheme()}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors mb-1"
              >
                <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                  {isDark ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-500" />}
                </div>
                <div className="text-left flex-1">
                  <p className="font-semibold text-gray-800 dark:text-white text-sm">{isDark ? "Light Mode" : "Dark Mode"}</p>
                  <p className="text-xs text-gray-400">Switch appearance</p>
                </div>
                <div className={`w-11 h-6 rounded-full transition-colors flex-shrink-0 ${isDark ? "bg-green-600" : "bg-gray-200 dark:bg-gray-700"}`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow-sm mt-0.5 transition-transform ${isDark ? "translate-x-5.5 ml-0.5" : "ml-0.5"}`} />
                </div>
              </button>

              {/* Notifications */}
              <Link
                to="/community"
                onClick={() => setShowSettingsPopup(false)}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors mb-1"
              >
                <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 relative">
                  <Bell className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  {unreadNotifs > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-3.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
                      {unreadNotifs > 9 ? "9+" : unreadNotifs}
                    </span>
                  )}
                </div>
                <div className="text-left flex-1">
                  <p className="font-semibold text-gray-800 dark:text-white text-sm">Notifications</p>
                  <p className="text-xs text-gray-400">
                    {unreadNotifs > 0 ? `${unreadNotifs} unread` : "All caught up"}
                  </p>
                </div>
                {unreadNotifs > 0 && (
                  <span className="ml-auto text-xs font-bold bg-red-100 dark:bg-red-900/30 text-red-500 px-2 py-0.5 rounded-full flex-shrink-0">{unreadNotifs}</span>
                )}
              </Link>

              {/* Logout */}
              <button
                onClick={() => { setShowSettingsPopup(false); handleLogout(); }}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors mb-1"
              >
                <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
                  <LogOut className="w-4 h-4 text-red-500" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-red-500 text-sm">Logout</p>
                  <p className="text-xs text-gray-400">Sign out of your account</p>
                </div>
              </button>
            </div>

            {/* Safe area spacer */}
            <div className="h-6" />
          </div>
        </div>
      )}

      {showPublishModal && chapter && (
        <PublishModal
          chapter={chapter} currentPublish={currentPublish}
          onClose={() => setShowPublishModal(false)}
          onPublish={handlePublish} onUnpublish={handleUnpublish}
          loading={publishLoading} error={publishError}
        />
      )}
    </div>
  );
}
