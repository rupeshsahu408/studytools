import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  BookOpen, Atom, FlaskConical, Calculator, Leaf,
  Sparkles, Eye, Share2, ArrowRight, AlertCircle,
} from "lucide-react";
import { getSharedChapter, incrementShareViews } from "../lib/firestore";
import type { SharedChapterPublic } from "../lib/firestore";
import NotesView from "../components/NotesView";

const SUBJECT_ICONS: Record<string, any> = {
  Physics: Atom, Chemistry: FlaskConical, Mathematics: Calculator, Biology: Leaf,
};

const SUBJECT_COLORS: Record<string, string> = {
  Physics: "bg-blue-100 text-blue-600",
  Chemistry: "bg-purple-100 text-purple-600",
  Mathematics: "bg-orange-100 text-orange-600",
  Biology: "bg-green-100 text-green-600",
};

export default function SharePage() {
  const { token } = useParams<{ token: string }>();
  const [shareData, setShareData] = useState<SharedChapterPublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) { setNotFound(true); setLoading(false); return; }
    loadShare();
  }, [token]);

  const loadShare = async () => {
    try {
      const data = await getSharedChapter(token!);
      if (!data) {
        setNotFound(true);
      } else {
        setShareData(data);
        incrementShareViews(token!).catch(() => {});
      }
    } catch (err: any) {
      console.error("Error loading share:", err);
      setError(
        err?.code === "permission-denied"
          ? "This share link is no longer active."
          : "Could not load this shared chapter. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-400">Loading shared chapter…</p>
        </div>
      </div>
    );
  }

  if (notFound || error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            {notFound ? "Link not found" : "Could not load"}
          </h1>
          <p className="text-gray-500 text-sm mb-6">
            {notFound
              ? "This share link may have been removed by the owner, or the link is invalid."
              : error}
          </p>
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
          >
            Start Studying Free <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  if (!shareData) return null;

  const SubjectIcon = SUBJECT_ICONS[shareData.subject] || BookOpen;
  const subjectColor = SUBJECT_COLORS[shareData.subject] || "bg-gray-100 text-gray-600";

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Sticky Top Bar ── */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100 h-14 flex items-center">
        <div className="max-w-4xl mx-auto px-4 w-full flex items-center justify-between gap-4">

          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-7 h-7 bg-green-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">T2</span>
            </div>
            <span className="font-bold text-gray-900 text-sm hidden sm:block">Topper 2.0</span>
          </Link>

          <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
            <Share2 className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
            <p className="text-xs text-gray-500 truncate">
              Shared by{" "}
              <span className="font-semibold text-gray-700">{shareData.sharedByName}</span>
            </p>
          </div>

          <Link
            to="/signup"
            className="flex-shrink-0 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-3 h-3" />
            <span className="hidden sm:inline">Study Free on</span> Topper 2.0
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* ── Chapter Info Card ── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${subjectColor}`}>
              <SubjectIcon className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-gray-900 leading-tight mb-1.5">
                {shareData.chapterName}
              </h1>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-400">
                <span className="font-medium text-gray-600">{shareData.subject}</span>
                <span>·</span>
                <span>Class {shareData.classNum}</span>
                <span>·</span>
                <span
                  className={`px-2 py-0.5 rounded-full font-medium ${
                    shareData.language === "hindi"
                      ? "bg-orange-100 text-orange-600"
                      : "bg-blue-100 text-blue-600"
                  }`}
                >
                  {shareData.language === "hindi" ? "हिंदी" : "English"}
                </span>
                {shareData.views > 0 && (
                  <span className="flex items-center gap-1 text-gray-400">
                    <Eye className="w-3 h-3" /> {shareData.views + 1} views
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Read-only Notes ── */}
        {shareData.notes ? (
          <NotesView
            notes={shareData.notes}
            subject={shareData.subject}
            chapterName={shareData.chapterName}
            classNum={shareData.classNum}
          />
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <BookOpen className="w-10 h-10 mx-auto mb-3 text-gray-200" />
            <p className="text-sm text-gray-400">Notes not available in this share.</p>
          </div>
        )}

        {/* ── Bottom CTA Banner ── */}
        <div className="mt-10 bg-gradient-to-br from-green-600 to-emerald-700 rounded-2xl p-8 text-white text-center">
          <div className="inline-flex items-center gap-1.5 bg-white/15 border border-white/20 rounded-full px-3 py-1 mb-4">
            <Sparkles className="w-3 h-3 text-green-200" />
            <span className="text-xs font-bold uppercase tracking-widest">NCERT Board AI Platform</span>
          </div>
          <h2 className="text-xl font-black mb-2">Get AI notes for your own chapters</h2>
          <p className="text-green-100 text-sm mb-6 max-w-md mx-auto leading-relaxed">
            Upload any NCERT chapter PDF and get complete notes, full question banks, flash cards,
            simulations, and more — built for all NCERT board students.
          </p>
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 bg-white text-green-700 font-bold px-7 py-3 rounded-xl hover:bg-green-50 transition-colors shadow-md"
          >
            Start Studying Free <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
