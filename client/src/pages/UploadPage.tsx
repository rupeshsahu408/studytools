import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDropzone } from "react-dropzone";
import { useNavigate } from "react-router-dom";
import {
  Upload, FileText, X, BookOpen, CheckCircle, FileDigit,
  ChevronRight, RotateCcw, Loader2, Cpu, Sparkles, Database,
  FileSearch, Layers, Zap,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { api, uploadPDF, generateNotes, fetchNCERTChapters } from "../lib/api";
import { saveChapter, updateChapterSection } from "../lib/firestore";
import TopHeader from "../components/TopHeader";
import BottomNav from "../components/BottomNav";

const SUBJECTS = ["Physics", "Chemistry", "Mathematics", "Biology"];
const CLASSES = ["11", "12"];

const PROMPT_LIMITS: Record<string, number> = {
  Notes: 150000, Questions: 100000, Formulas: 150000,
  "Mind Map": 120000, Mistakes: 120000, "Flash Cards": 120000, Simulations: 80000,
};

const TOPPER_TIPS = [
  "Bihar Board toppers revise each chapter at least 3 times before the exam.",
  "Writing answers by hand improves memory retention by up to 60%.",
  "5-mark questions carry nearly 30% of total board exam marks.",
  "Practicing MCQs daily for 20 minutes improves accuracy significantly.",
  "Understanding concepts is more powerful than memorizing answers.",
  "Attempt all questions in the board exam — never leave any blank.",
  "Draw neat diagrams — they can fetch full marks even with a simple explanation.",
  "Revising notes 24 hours after reading helps you remember 80% longer.",
];

function getCoverage(textLength: number, limit: number): number {
  if (textLength === 0) return 0;
  return Math.min(100, Math.round((Math.min(textLength, limit) / textLength) * 100));
}

function CoverageBar({ label, pct }: { label: string; pct: number }) {
  const color = pct >= 100 ? "bg-green-500" : pct >= 80 ? "bg-yellow-400" : "bg-orange-400";
  const textColor = pct >= 100 ? "text-green-600 dark:text-green-400" : pct >= 80 ? "text-yellow-600 dark:text-yellow-400" : "text-orange-600 dark:text-orange-400";
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 dark:text-gray-400 w-24 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-xs font-semibold w-10 text-right ${textColor}`}>{pct === 100 ? "100%" : `${pct}%`}</span>
    </div>
  );
}

interface UploadResult {
  text: string;
  textLength: number;
  pageCount: number;
  language: string;
}

type Stage = "form" | "uploading" | "confirming" | "generating";
type StepStatus = "waiting" | "running" | "done" | "error";

interface GenStep {
  id: string;
  label: string;
  sublabel: string;
  status: StepStatus;
  icon: any;
}

// ─── Upload Animation Screen ─────────────────────────────────────────────────

function UploadingScreen({ fileName, fileSize }: { fileName: string; fileSize: number }) {
  const [stepIdx, setStepIdx] = useState(0);
  const [tipIdx, setTipIdx] = useState(0);
  const [progress, setProgress] = useState(0);

  const steps = [
    { msg: "Uploading your PDF securely...", icon: Upload, color: "text-blue-500" },
    { msg: "Reading document structure...", icon: FileSearch, color: "text-purple-500" },
    { msg: "Extracting text from all pages...", icon: FileText, color: "text-orange-500" },
    { msg: "Cleaning & processing text...", icon: Cpu, color: "text-green-500" },
    { msg: "Detecting language...", icon: Layers, color: "text-pink-500" },
    { msg: "Almost ready...", icon: Zap, color: "text-green-600" },
  ];

  useEffect(() => {
    // Advance through steps based on estimated upload+extraction time
    // Larger files take longer — estimate 1s per 500KB
    const totalMs = Math.max(4000, (fileSize / 500000) * 1000);
    const stepMs = totalMs / steps.length;

    const stepTimer = setInterval(() => {
      setStepIdx(i => Math.min(i + 1, steps.length - 1));
    }, stepMs);

    // Smooth progress bar
    const startTime = Date.now();
    const progTimer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(92, (elapsed / totalMs) * 92);
      setProgress(pct);
    }, 80);

    const tipTimer = setInterval(() => {
      setTipIdx(i => (i + 1) % TOPPER_TIPS.length);
    }, 3500);

    return () => { clearInterval(stepTimer); clearInterval(progTimer); clearInterval(tipTimer); };
  }, []);

  const StepIcon = steps[stepIdx].icon;

  return (
    <div className="fixed inset-0 bg-gray-50 dark:bg-gray-950 z-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">

        {/* Animated icon */}
        <div className="relative w-24 h-24 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full border-4 border-green-100 dark:border-green-900/40" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-green-500 animate-spin" />
          <div className="absolute inset-2 rounded-full border-2 border-transparent border-b-green-300 dark:border-b-green-700" style={{ animation: "spin 2s linear infinite reverse" }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={stepIdx}
                initial={{ opacity: 0, scale: 0.75 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.75 }}
                transition={{ duration: 0.2 }}
              >
                <StepIcon className={`w-8 h-8 ${steps[stepIdx].color}`} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* File info */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-xl px-4 py-2.5 mb-5 flex items-center gap-3 text-left">
          <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{fileName}</p>
            <p className="text-xs text-gray-400">{(fileSize / 1024 / 1024).toFixed(2)} MB</p>
          </div>
        </div>

        {/* Current step message */}
        <AnimatePresence mode="wait">
          <motion.p
            key={stepIdx}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="text-base font-semibold text-gray-800 dark:text-white mb-4"
          >
            {steps[stepIdx].msg}
          </motion.p>
        </AnimatePresence>

        {/* Progress bar */}
        <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 mb-1.5 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all"
            style={{ width: `${progress}%` }} />
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-6">{Math.round(progress)}% complete</p>

        {/* Tip box */}
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/40 rounded-2xl p-4">
          <p className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wide mb-1.5">Topper Tip</p>
          <AnimatePresence mode="wait">
            <motion.p
              key={tipIdx}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed"
            >
              {TOPPER_TIPS[tipIdx]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ─── Generation Animation Screen ──────────────────────────────────────────────

function GeneratingScreen({
  steps, chapterName, subject, classNum, pageCount, textLength, language,
}: {
  steps: GenStep[];
  chapterName: string;
  subject: string;
  classNum: string;
  pageCount: number;
  textLength: number;
  language: string;
}) {
  const [tipIdx, setTipIdx] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  const doneCount = steps.filter(s => s.status === "done").length;
  const totalSteps = steps.length;
  const overallProgress = Math.round((doneCount / totalSteps) * 85) + 5;

  useEffect(() => {
    const tipTimer = setInterval(() => setTipIdx(i => (i + 1) % TOPPER_TIPS.length), 3500);
    const elapsedTimer = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => { clearInterval(tipTimer); clearInterval(elapsedTimer); };
  }, []);

  const formatElapsed = (s: number) => s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;

  return (
    <div className="fixed inset-0 bg-gray-50 dark:bg-gray-950 z-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-6">
          <div className="relative w-20 h-20 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-green-100 dark:border-green-900/40" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-green-500" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Creating Your Chapter</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate px-4">{chapterName} · {subject} · Class {classNum}</p>
        </div>

        {/* PDF stats strip */}
        <div className="flex gap-2 mb-5 text-center">
          {[
            { label: "Pages", value: pageCount || "—" },
            { label: "Characters", value: textLength >= 1000 ? `${(textLength / 1000).toFixed(0)}K` : textLength },
            { label: "Language", value: language === "hindi" ? "हिंदी" : "English" },
          ].map(stat => (
            <div key={stat.label} className="flex-1 bg-gray-50 dark:bg-gray-900 rounded-xl py-2 px-1">
              <p className="text-sm font-bold text-gray-800 dark:text-white">{stat.value}</p>
              <p className="text-xs text-gray-400">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Steps list */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden mb-4">
          {steps.map((step, i) => {
            const StepIcon = step.icon;
            const isLast = i === steps.length - 1;
            return (
              <div key={step.id} className={`flex items-start gap-3 px-4 py-3.5 ${!isLast ? "border-b border-gray-50 dark:border-gray-800" : ""}`}>
                {/* Status icon */}
                <div className="mt-0.5 flex-shrink-0">
                  {step.status === "done" ? (
                    <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                  ) : step.status === "running" ? (
                    <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                      <Loader2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 animate-spin" />
                    </div>
                  ) : step.status === "error" ? (
                    <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
                      <X className="w-3.5 h-3.5 text-red-500" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <StepIcon className="w-3.5 h-3.5 text-gray-400" />
                    </div>
                  )}
                </div>
                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium leading-tight ${step.status === "done" ? "text-green-700 dark:text-green-400" : step.status === "running" ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-gray-500"}`}>
                    {step.label}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{step.sublabel}</p>
                </div>
                {/* Duration badge */}
                {step.status === "running" && (
                  <div className="flex-shrink-0">
                    <span className="text-xs text-blue-500 dark:text-blue-400 font-medium">Working...</span>
                  </div>
                )}
                {step.status === "done" && (
                  <div className="flex-shrink-0">
                    <span className="text-xs text-green-600 dark:text-green-400 font-semibold">✓ Done</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Overall progress bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-gray-500 dark:text-gray-400">{doneCount}/{totalSteps} steps complete</span>
            <span className="text-xs text-gray-400 dark:text-gray-500">{formatElapsed(elapsed)}</span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all"
              style={{ width: `${overallProgress}%` }} />
          </div>
        </div>

        {/* Tip box */}
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/40 rounded-xl px-4 py-3">
          <p className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wide mb-1">Topper Tip</p>
          <AnimatePresence mode="wait">
            <motion.p
              key={tipIdx}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed"
            >
              {TOPPER_TIPS[tipIdx]}
            </motion.p>
          </AnimatePresence>
          
        </div>

        <p className="text-xs text-gray-400 dark:text-gray-600 mt-4 text-center">Please don't close this tab — AI is working on your chapter.</p>
      </div>
    </div>
  );
}

// ─── Main UploadPage ──────────────────────────────────────────────────────────

export default function UploadPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"upload" | "browse">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [subject, setSubject] = useState("Physics");
  const [classNum, setClassNum] = useState("11");
  const [chapterName, setChapterName] = useState("");
  const [stage, setStage] = useState<Stage>("form");
  const [error, setError] = useState("");
  const [ncertChapters, setNcertChapters] = useState<{ name: string; url: string }[]>([]);
  const [selectedNcert, setSelectedNcert] = useState<{ name: string; url: string } | null>(null);
  const [loadingChapters, setLoadingChapters] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [resolvedChapterName, setResolvedChapterName] = useState("");

  // Generation step tracking — save first so chapter is secured before AI generation
  const [genSteps, setGenSteps] = useState<GenStep[]>([
    { id: "save",  label: "Securing Your Chapter", sublabel: "Saving extracted text to your library",          status: "waiting", icon: Database },
    { id: "notes", label: "Writing Study Notes",   sublabel: "AI crafting detailed notes from your chapter",   status: "waiting", icon: BookOpen },
  ]);

  const updateStep = (id: string, status: StepStatus) => {
    setGenSteps(prev => prev.map(s => s.id === id ? { ...s, status } : s));
  };

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) {
      setFile(accepted[0]);
      if (!chapterName) setChapterName(accepted[0].name.replace(".pdf", ""));
    }
  }, [chapterName]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { "application/pdf": [".pdf"] }, maxFiles: 1, maxSize: 20 * 1024 * 1024,
  });

  const loadNcertChapters = async () => {
    setLoadingChapters(true);
    try {
      const chapters = await fetchNCERTChapters(classNum, subject);
      setNcertChapters(chapters);
      setSelectedNcert(null);
    } catch {
      setError("Could not load NCERT chapters. Please try again.");
    } finally {
      setLoadingChapters(false);
    }
  };

  const handleUpload = async () => {
    if (!user) return;
    setError("");

    const nameToUse = tab === "browse" && selectedNcert ? selectedNcert.name : chapterName;
    if (!nameToUse.trim()) { setError("Please enter a chapter name."); return; }
    if (tab === "upload" && !file) { setError("Please select a PDF file."); return; }
    if (tab === "browse" && !selectedNcert) { setError("Please select a chapter from the list."); return; }

    setStage("uploading");

    try {
      let data: any;
      if (tab === "upload" && file) {
        data = await uploadPDF(file, subject, classNum, nameToUse);
      } else if (tab === "browse" && selectedNcert) {
        const res = await api.post("/api/upload/url", {
          url: selectedNcert.url, subject, classNum, chapterName: selectedNcert.name,
        });
        data = res.data;
      }

      setResolvedChapterName(nameToUse);
      setUploadResult({
        text: data.text,
        textLength: data.textLength ?? data.text?.length ?? 0,
        pageCount: data.pageCount ?? 0,
        language: data.language,
      });
      setStage("confirming");
    } catch (e: any) {
      const msg = e?.response?.data?.error || e.message || "Something went wrong. Please try again.";
      setError(msg);
      setStage("form");
    }
  };

  const handleGenerate = async () => {
    if (!user || !uploadResult) return;
    setError("");

    // Reset step statuses
    setGenSteps(prev => prev.map(s => ({ ...s, status: "waiting" as StepStatus })));
    setStage("generating");

    try {
      // ── Step 1: Save chapter stub FIRST ────────────────────────────────────
      // This guarantees the chapter exists in the library even if AI generation
      // fails later. Notes and questions can be retried from the dashboard.
      updateStep("save", "running");
      const chapterId = await saveChapter(user.uid, {
        chapterName: resolvedChapterName,
        subject,
        classNum,
        language: uploadResult.language,
        text: uploadResult.text,
        notes: null,
        questions: null,
      });
      updateStep("save", "done");

      // ── Step 2: Generate notes only ────────────────────────────────────────
      // Questions are generated manually by the student from the dashboard,
      // just like Formulas, Mind Map, Flash Cards, and other AI tools.
      updateStep("notes", "running");

      await generateNotes(
        uploadResult.text, subject, classNum, resolvedChapterName, uploadResult.language
      ).then(async r => {
        if (r?.notes) {
          await updateChapterSection(chapterId, "notes", r.notes);
        }
        updateStep("notes", "done");
      }).catch(err => {
        console.error("[upload] Notes generation failed:", err?.message);
        updateStep("notes", "error");
      });

      // Brief pause so user sees the completed step indicators
      await new Promise(r => setTimeout(r, 700));
      navigate(`/chapter/${chapterId}`);
    } catch (e: any) {
      const serverMsg = e?.response?.data?.error;
      const msg = serverMsg || e.message || "Something went wrong. Please try again.";
      if (msg.includes("MAX_CHAPTERS_REACHED")) {
        setError("You've reached the 5-chapter limit. Please delete a chapter first.");
      } else {
        setError(msg);
      }
      setStage("confirming");
    }
  };

  // ── Uploading stage ──
  if (stage === "uploading") {
    return (
      <UploadingScreen
        fileName={file?.name || (selectedNcert?.name ? `${selectedNcert.name}.pdf` : "chapter.pdf")}
        fileSize={file?.size || 1024 * 1024}
      />
    );
  }

  // ── Generating stage ──
  if (stage === "generating" && uploadResult) {
    return (
      <GeneratingScreen
        steps={genSteps}
        chapterName={resolvedChapterName}
        subject={subject}
        classNum={classNum}
        pageCount={uploadResult.pageCount}
        textLength={uploadResult.textLength}
        language={uploadResult.language}
      />
    );
  }

  // ── Confirmation stage ──
  if (stage === "confirming" && uploadResult) {
    const { textLength, pageCount, language } = uploadResult;
    const coverageEntries = Object.entries(PROMPT_LIMITS) as [string, number][];
    const allFull = coverageEntries.every(([, limit]) => getCoverage(textLength, limit) === 100);

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <TopHeader showBack backTo="/upload" backLabel="Back" />
        <div className="pt-12 pb-20 max-w-2xl mx-auto px-4 py-6">
          <div>
            <button onClick={() => setStage("form")} className="text-sm text-gray-500 dark:text-gray-400 hover:text-green-600 mb-6 flex items-center gap-1">
              ← Back
            </button>

            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
              {/* Header */}
              <div className="bg-green-50 dark:bg-green-900/20 border-b border-green-100 dark:border-green-800/40 px-6 py-5 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-800/40 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white">PDF Extracted Successfully</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate max-w-sm">{resolvedChapterName}</p>
                </div>
              </div>

              <div className="px-6 py-5 space-y-6">
                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 text-center">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{pageCount || "—"}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Pages Found</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 text-center">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {textLength >= 1000 ? `${(textLength / 1000).toFixed(0)}K` : textLength}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Characters</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 text-center">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white capitalize">
                      {language === "hindi" ? "हिंदी" : "English"}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Language</p>
                  </div>
                </div>

                {/* Coverage */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <FileDigit className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">AI Coverage</span>
                    </div>
                    {allFull && (
                      <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2.5 py-1 rounded-full">
                        Full Chapter
                      </span>
                    )}
                  </div>
                  <div className="space-y-2.5">
                    {coverageEntries.map(([label, limit]) => (
                      <CoverageBar key={label} label={label} pct={getCoverage(textLength, limit)} />
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-3 leading-relaxed">
                    Coverage shows how much of the extracted text each AI feature will process. 100% means the AI reads the entire chapter.
                  </p>
                </div>

                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl px-4 py-3 text-sm">
                    {error}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => { setStage("form"); setUploadResult(null); setError(""); }}
                    className="flex items-center gap-1.5 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <RotateCcw className="w-3.5 h-3.5" />
                    Change PDF
                  </button>
                  <button
                    onClick={handleGenerate}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
                    Generate Notes & Questions
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Form stage ──
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <TopHeader title="Add Chapter" showBack backTo="/dashboard" backLabel="Library" />
      <div className="pt-12 pb-20 max-w-2xl mx-auto px-4 py-6">
        <div>
          <button onClick={() => navigate("/dashboard")} className="text-sm text-gray-500 dark:text-gray-400 hover:text-green-600 mb-6 flex items-center gap-1">
            ← Back to Library
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Add a New Chapter</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Upload your PDF or pick from the official NCERT library</p>

          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
            <div className="flex border-b border-gray-100 dark:border-gray-800">
              {(["upload", "browse"] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`flex-1 py-3 text-sm font-medium transition-colors ${tab === t ? "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-b-2 border-green-600" : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"}`}>
                  {t === "upload" ? "Upload PDF" : "Browse NCERT"}
                </button>
              ))}
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Subject</label>
                  <select value={subject} onChange={e => { setSubject(e.target.value); setNcertChapters([]); setSelectedNcert(null); }}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500">
                    {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Class</label>
                  <select value={classNum} onChange={e => { setClassNum(e.target.value); setNcertChapters([]); setSelectedNcert(null); }}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500">
                    {CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
                  </select>
                </div>
              </div>

              
                {tab === "upload" ? (
                  <div key="upload" className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Chapter Name</label>
                      <input value={chapterName} onChange={e => setChapterName(e.target.value)} placeholder="e.g. Laws of Motion"
                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500" />
                    </div>
                    <div {...getRootProps()}
                      className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${isDragActive ? "border-green-400 bg-green-50 dark:bg-green-900/20" : "border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-700"}`}>
                      <input {...getInputProps()} />
                      {file ? (
                        <div className="flex items-center justify-center gap-3">
                          <FileText className="w-8 h-8 text-green-600" />
                          <div className="text-left">
                            <p className="font-medium text-gray-900 dark:text-white text-sm">{file.name}</p>
                            <p className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                          <button onClick={e => { e.stopPropagation(); setFile(null); }} className="ml-auto text-gray-400 hover:text-red-500">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div>
                          <Upload className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Drop your PDF here or click to browse</p>
                          <p className="text-xs text-gray-400 mt-1">Max 20MB • PDF only</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div key="browse" className="space-y-3">
                    <button onClick={loadNcertChapters} disabled={loadingChapters}
                      className="w-full flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50">
                      <BookOpen className="w-4 h-4" />
                      {loadingChapters ? "Loading chapters..." : `Load ${subject} Class ${classNum} Chapters`}
                    </button>

                    {ncertChapters.length > 0 && (
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {ncertChapters.map((ch, i) => (
                          <button key={i} onClick={() => { setSelectedNcert(ch); setChapterName(ch.name); }}
                            className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${selectedNcert?.name === ch.name ? "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300" : "border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-green-300"}`}>
                            {ch.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl px-4 py-3 text-sm">
                  {error}
                </div>
              )}

              <button onClick={handleUpload}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2">
                <Upload className="w-4 h-4" />
                Upload & Process PDF
              </button>
            </div>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
