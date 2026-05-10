import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, HelpCircle, ArrowLeft, Atom, FlaskConical, Calculator, Leaf, Calendar } from "lucide-react";
import { getChapter } from "../lib/firestore";
import type { Chapter } from "../lib/firestore";
import Navbar from "../components/Navbar";
import NotesView from "../components/NotesView";
import QuestionsView from "../components/QuestionsView";

const SUBJECT_ICONS: Record<string, any> = {
  Physics: Atom, Chemistry: FlaskConical, Mathematics: Calculator, Biology: Leaf,
};

const SIDEBAR_ITEMS = [
  { key: "notes", label: "Notes", icon: BookOpen },
  { key: "questions", label: "Questions", icon: HelpCircle },
];

function formatDate(ts: any): string {
  if (!ts) return "";
  try {
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return "";
  }
}

export default function ChapterPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("notes");

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

  // Count total questions across all types for display
  const questionCount = chapter.questions
    ? Object.entries(chapter.questions).reduce((sum: number, [key, arr]: [string, any]) => {
        if (!arr) return sum;
        if (key === "caseBased") {
          return sum + (arr as any[]).reduce((s: number, set: any) => s + (set.questions?.length || 0), 0);
        }
        return sum + (arr as any[]).length;
      }, 0)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <div className="pt-14 flex">

        {/* ── Desktop Sidebar ── */}
        <aside className="hidden md:flex flex-col w-60 fixed left-0 top-14 h-[calc(100vh-3.5rem)] bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 p-4">
          <div className="mb-6">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-green-600 transition-colors mb-5">
              <ArrowLeft className="w-3 h-3" /> Back to Library
            </button>

            {/* Subject + class badge */}
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-green-100 dark:bg-green-900/40 flex items-center justify-center flex-shrink-0">
                <SubjectIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                {chapter.subject} · Class {chapter.classNum}
              </span>
            </div>

            {/* Chapter name */}
            <p className="text-sm font-bold text-gray-900 dark:text-white leading-snug mb-3">
              {chapter.chapterName}
            </p>

            {/* Meta info */}
            <div className="space-y-1.5">
              {createdDate && (
                <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
                  <Calendar className="w-3 h-3" />
                  <span>Added {createdDate}</span>
                </div>
              )}
              {questionCount > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
                  <HelpCircle className="w-3 h-3" />
                  <span>{questionCount} questions generated</span>
                </div>
              )}
              {chapter.language && (
                <div className="text-xs">
                  <span className={`inline-block px-2 py-0.5 rounded-full font-medium ${chapter.language === "hindi" ? "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400" : "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"}`}>
                    {chapter.language === "hindi" ? "हिंदी" : "English"}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-gray-100 dark:bg-gray-800 mb-4" />

          {/* Navigation */}
          <nav className="space-y-1">
            {SIDEBAR_ITEMS.map(item => (
              <button key={item.key} onClick={() => setActiveSection(item.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeSection === item.key
                    ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}>
                <item.icon className="w-4 h-4" />
                {item.label}
                {item.key === "questions" && questionCount > 0 && (
                  <span className="ml-auto text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded-full">
                    {questionCount}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </aside>

        {/* ── Mobile Bottom Tab Bar ── */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex">
          {SIDEBAR_ITEMS.map(item => (
            <button key={item.key} onClick={() => setActiveSection(item.key)}
              className={`flex-1 flex flex-col items-center py-2 text-xs font-medium transition-colors ${
                activeSection === item.key ? "text-green-600" : "text-gray-400"
              }`}>
              <item.icon className="w-5 h-5 mb-0.5" />
              {item.label}
            </button>
          ))}
        </div>

        {/* ── Main Content ── */}
        <main className="flex-1 md:ml-60 p-4 md:p-8 pb-20 md:pb-8">
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

          <motion.div key={activeSection} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            {activeSection === "notes" && chapter.notes && (
              <NotesView notes={chapter.notes} subject={chapter.subject} />
            )}
            {activeSection === "questions" && chapter.questions && (
              <QuestionsView questions={chapter.questions} />
            )}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
