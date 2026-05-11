import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, HelpCircle, ArrowLeft, Atom, FlaskConical,
  Calculator, Leaf, Calendar, Sigma, Network, AlertTriangle,
  Layers, MessageCircle, HelpingHand, Loader2, Beaker, Users, Zap,
} from "lucide-react";
import { getChapter, updateChapterSection } from "../lib/firestore";
import type { Chapter } from "../lib/firestore";
import {
  generateFormulas, generateMindmap, generateMistakes,
  generateFlashcards, generateSimulationCatalog, regenerateQuestionBatch,
  regenerateNotes, generateSummary,
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

const SUBJECT_ICONS: Record<string, any> = {
  Physics: Atom, Chemistry: FlaskConical, Mathematics: Calculator, Biology: Leaf,
};

const SIDEBAR_ITEMS = [
  { key: "notes",       label: "Notes",              icon: BookOpen,       phase: 1 },
  { key: "questions",   label: "Questions",           icon: HelpCircle,    phase: 1 },
  { key: "summary",     label: "Quick Revision",      icon: Zap,           phase: 2 },
  { key: "formulas",    label: "Formulas",            icon: Sigma,         phase: 2 },
  { key: "mindmap",     label: "Concept Map",         icon: Network,       phase: 2 },
  { key: "mistakes",    label: "Ye Galti Mat Karo",   icon: AlertTriangle, phase: 2 },
  { key: "flashcards",  label: "Flash Cards",         icon: Layers,        phase: 2 },
  { key: "chat",        label: "Doubt Chat",          icon: MessageCircle, phase: 2 },
  { key: "simulations", label: "Simulations",         icon: Beaker,        phase: 3 },
  { key: "discussion",  label: "Discussion",          icon: Users,         phase: 5 },
];

function formatDate(ts: any): string {
  if (!ts) return "";
  try {
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch { return ""; }
}

function SectionGenerating({ label }: { label: string }) {
  const [dots, setDots] = useState(".");
  useEffect(() => {
    const t = setInterval(() => setDots(d => d.length >= 3 ? "." : d + "."), 500);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="relative w-16 h-16 mb-5">
        <motion.div className="absolute inset-0 rounded-full border-4 border-green-200 dark:border-green-900"
          animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} />
        <motion.div className="absolute inset-0 rounded-full border-4 border-transparent border-t-green-600"
          animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-green-600 animate-spin" />
        </div>
      </div>
      <p className="text-base font-semibold text-gray-800 dark:text-white mb-1">Generating {label}{dots}</p>
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

  const { user } = useAuth();

  // Phase 4: progress tracking
  const { markNotesRead, trackQuestionAnswer, markFlashcardsDone, markSimulationSeen } = useProgress();

  useEffect(() => {
    if (!id) return;
    loadChapter();
  }, [id]);

  const loadChapter = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await getChapter(id);
      setChapter(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

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
        const data = await generateMindmap(text, subject, chapterName);
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
              onRead={handleNotesRead}
              onRegenerate={handleRegenerateNotes}
              regenerating={regeneratingNotes}
            />
          : <div className="text-gray-400 py-10 text-center text-sm">Notes not available.</div>;

      case "questions":
        return chapter?.questions
          ? <QuestionsView
              questions={chapter.questions}
              onQuestionAnswered={handleQuestionAnswered}
              onRetryBatch={handleRetryBatch}
              retryingBatch={retryingBatch}
              userId={user?.uid}
              chapterId={chapter.id}
              chapterName={chapter.chapterName}
              subject={chapter.subject}
            />
          : <div className="text-gray-400 py-10 text-center text-sm">Questions not available.</div>;

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
        return <FormulaSheet formulas={chapter.formulas as any[]} />;

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
        return <MindMap mindmap={chapter.mindmap} />;

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

            <div className="h-px bg-gray-100 dark:bg-gray-800 mb-3" />

            {/* Phase 1 sections */}
            <div className="mb-1">
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide px-3 mb-1.5">Study</p>
              {SIDEBAR_ITEMS.filter(s => s.phase === 1).map(item => (
                <button key={item.key} onClick={() => switchSection(item.key)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all mb-0.5 ${
                    activeSection === item.key
                      ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
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

            {/* Phase 2 sections */}
            <div className="mb-1">
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide px-3 mb-1.5">
                AI Enrichment
                <span className="ml-1.5 text-xs text-green-500 font-semibold normal-case">Phase 2</span>
              </p>
              {SIDEBAR_ITEMS.filter(s => s.phase === 2).map(item => {
                const isReady = !!chapter[item.key as keyof Chapter];
                const isCurrentlyGenerating = generatingSection === item.key;
                return (
                  <button key={item.key} onClick={() => switchSection(item.key)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all mb-0.5 ${
                      activeSection === item.key
                        ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
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

            {/* Phase 3 — Simulations */}
            <div>
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide px-3 mb-1.5">
                Simulations
                <span className="ml-1.5 text-xs text-blue-500 font-semibold normal-case">Phase 3</span>
              </p>
              {SIDEBAR_ITEMS.filter(s => s.phase === 3).map(item => {
                const isReady = simCount > 0;
                const isCurrentlyGenerating = generatingSection === item.key;
                return (
                  <button key={item.key} onClick={() => switchSection(item.key)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all mb-0.5 ${
                      activeSection === item.key
                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
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

            {/* Phase 5 — Community */}
            <div>
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide px-3 mb-1.5">
                Community
                <span className="ml-1.5 text-xs text-purple-500 font-semibold normal-case">Phase 5</span>
              </p>
              {SIDEBAR_ITEMS.filter(s => s.phase === 5).map(item => (
                <button key={item.key} onClick={() => switchSection(item.key)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all mb-0.5 ${
                    activeSection === item.key
                      ? "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}>
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1 text-left">{item.label}</span>
                  <span className="text-xs text-purple-400 dark:text-purple-500 font-medium">New</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* ── Mobile Bottom Tab Bar ── */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex overflow-x-auto">
          {SIDEBAR_ITEMS.map(item => (
            <button key={item.key} onClick={() => switchSection(item.key)}
              className={`flex flex-col items-center py-2 px-3 text-xs font-medium transition-colors flex-shrink-0 ${
                activeSection === item.key
                  ? item.phase === 3 ? "text-blue-600" : "text-green-600"
                  : "text-gray-400"
              }`}>
              {generatingSection === item.key
                ? <Loader2 className={`w-5 h-5 mb-0.5 animate-spin ${item.phase === 3 ? "text-blue-500" : "text-green-500"}`} />
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

          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}>
              {renderSection()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
