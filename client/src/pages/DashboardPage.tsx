import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, BookOpen, Trash2, ChevronRight, FlaskConical, Calculator, Leaf, Atom } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { getUserChapters, deleteChapter } from "../lib/firestore";
import type { Chapter } from "../lib/firestore";
import Navbar from "../components/Navbar";

const SUBJECT_ICONS: Record<string, any> = {
  Physics: Atom,
  Chemistry: FlaskConical,
  Mathematics: Calculator,
  Biology: Leaf,
};

const SUBJECT_COLORS: Record<string, string> = {
  Physics: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
  Chemistry: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
  Mathematics: "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400",
  Biology: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
};

const MAX_CHAPTERS = 5;

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    loadChapters();
  }, [user]);

  const loadChapters = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getUserChapters(user.uid);
      setChapters(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this chapter? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await deleteChapter(id);
      setChapters(prev => prev.filter(c => c.id !== id));
    } catch (e) {
      console.error(e);
    } finally {
      setDeletingId(null);
    }
  };

  const canAddMore = chapters.length < MAX_CHAPTERS;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <div className="pt-14 max-w-4xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Chapter Library</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {chapters.length}/{MAX_CHAPTERS} chapters used
            {!canAddMore && " — Delete a chapter to add a new one"}
          </p>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {chapters.map((ch, i) => {
              const Icon = SUBJECT_ICONS[ch.subject] || BookOpen;
              const colorClass = SUBJECT_COLORS[ch.subject] || "bg-gray-100 text-gray-600";
              return (
                <motion.div key={ch.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  onClick={() => navigate(`/chapter/${ch.id}`)}
                  className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 cursor-pointer hover:border-green-300 dark:hover:border-green-700 hover:shadow-md transition-all group">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClass}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={e => handleDelete(ch.id, e)}
                        disabled={deletingId === ch.id}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <ChevronRight className="w-4 h-4 text-green-600" />
                    </div>
                  </div>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm leading-snug mb-1 line-clamp-2">{ch.chapterName}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">{ch.subject}</span>
                    <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">Class {ch.classNum}</span>
                    {ch.notes && <span className="text-xs bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full">Ready</span>}
                  </div>
                </motion.div>
              );
            })}

            {canAddMore && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                onClick={() => navigate("/upload")}
                className="bg-white dark:bg-gray-900 rounded-2xl p-5 border-2 border-dashed border-gray-200 dark:border-gray-700 cursor-pointer hover:border-green-400 dark:hover:border-green-600 hover:bg-green-50/30 dark:hover:bg-green-900/10 transition-all flex flex-col items-center justify-center gap-2 min-h-[120px]">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                  <Plus className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">Add New Chapter</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">Upload PDF or browse NCERT</p>
              </motion.div>
            )}
          </div>
        )}

        {!loading && chapters.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No chapters yet</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Upload your first chapter and start your topper journey.</p>
            <button onClick={() => navigate("/upload")}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors">
              Add Your First Chapter
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
