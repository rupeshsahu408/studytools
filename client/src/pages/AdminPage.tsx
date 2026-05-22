import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import {
  Shield, LogOut, RefreshCw, Users, BookOpen, HelpCircle,
  MessageSquare, TrendingUp, Award, BarChart2, Search,
  ChevronDown, ChevronUp, AlertCircle, Loader2, Clock,
  Star, Flame, Target, Globe,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────

interface AdminUser {
  uid: string;
  name: string;
  school: string;
  district: string;
  class: string;
  role: string;
  streak: number;
  longestStreak: number;
  questionsAnswered: number;
  questionsWrong: number;
  badges: number;
  activeToday: boolean;
  dailyGoal: number;
  dailyDone: number;
}

interface AdminChapter {
  id: string;
  userId: string;
  chapterName: string;
  subject: string;
  classNum: string;
  language: string;
  questionsAttempted: number;
  questionsWrong: number;
  createdAt: number;
  notesRead: boolean;
  flashcardsDone: boolean;
  simulationsSeen: boolean;
}

interface AdminFeedback {
  id: string;
  userId: string;
  chapterName: string;
  subject: string;
  type: string;
  reason: string;
  note: string;
  createdAt: number;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

const today = new Date().toISOString().split("T")[0];
const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

function fmt(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

function fmtDate(ms: number) {
  if (!ms) return "—";
  return new Date(ms).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

function fmtDateShort(ms: number) {
  if (!ms) return "—";
  return new Date(ms).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

const SUBJECT_COLOR: Record<string, string> = {
  Physics:    "bg-blue-900/40 text-blue-300 border-blue-700/50",
  Chemistry:  "bg-purple-900/40 text-purple-300 border-purple-700/50",
  Mathematics:"bg-orange-900/40 text-orange-300 border-orange-700/50",
  Math:       "bg-orange-900/40 text-orange-300 border-orange-700/50",
  Biology:    "bg-green-900/40 text-green-300 border-green-700/50",
  History:    "bg-amber-900/40 text-amber-300 border-amber-700/50",
  Geography:  "bg-teal-900/40 text-teal-300 border-teal-700/50",
  Economics:  "bg-cyan-900/40 text-cyan-300 border-cyan-700/50",
  Hindi:      "bg-rose-900/40 text-rose-300 border-rose-700/50",
  English:    "bg-indigo-900/40 text-indigo-300 border-indigo-700/50",
  "Social Science": "bg-yellow-900/40 text-yellow-300 border-yellow-700/50",
};

function SubjectBadge({ subject }: { subject: string }) {
  const cls = SUBJECT_COLOR[subject] ?? "bg-gray-800 text-gray-400 border-gray-700";
  return (
    <span className={`inline-block text-xs px-2 py-0.5 rounded-md border font-medium ${cls}`}>
      {subject || "—"}
    </span>
  );
}

// ─── Stat Card ─────────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, icon: Icon, accent,
}: {
  label: string; value: string | number; sub?: string;
  icon: React.FC<{ className?: string }>; accent: string;
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex items-start gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${accent}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-white leading-none">{fmt(Number(value))}</p>
        <p className="text-xs text-gray-400 mt-1">{label}</p>
        {sub && <p className="text-xs text-gray-600 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Mini Bar Chart ────────────────────────────────────────────────────────

function BreakdownBar({
  title, items, total,
}: {
  title: string;
  items: { label: string; count: number; color?: string }[];
  total: number;
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-4">{title}</p>
      <div className="space-y-3">
        {items.map(item => {
          const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
          return (
            <div key={item.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-300">{item.label}</span>
                <span className="text-xs text-gray-500">{item.count} ({pct}%)</span>
              </div>
              <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${item.color ?? "bg-green-600"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
        {items.length === 0 && (
          <p className="text-xs text-gray-600 italic">No data yet</p>
        )}
      </div>
    </div>
  );
}

// ─── Sortable Table Head ───────────────────────────────────────────────────

function Th({
  label, col, sort, onSort,
}: {
  label: string;
  col: string;
  sort: { col: string; dir: "asc" | "desc" };
  onSort: (col: string) => void;
}) {
  const active = sort.col === col;
  return (
    <th
      onClick={() => onSort(col)}
      className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer select-none hover:text-gray-300 transition-colors whitespace-nowrap"
    >
      <span className="flex items-center gap-1">
        {label}
        {active
          ? sort.dir === "asc"
            ? <ChevronUp className="w-3 h-3 text-green-400" />
            : <ChevronDown className="w-3 h-3 text-green-400" />
          : <ChevronDown className="w-3 h-3 opacity-30" />}
      </span>
    </th>
  );
}

// ─── Tab Button ────────────────────────────────────────────────────────────

function Tab({
  id, label, icon: Icon, active, onClick,
}: {
  id: string; label: string; icon: React.FC<{ className?: string }>;
  active: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
        active
          ? "bg-green-600 text-white shadow-lg shadow-green-900/40"
          : "text-gray-400 hover:text-gray-200 hover:bg-gray-800"
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────

type TabId = "overview" | "users" | "chapters" | "feedback";

export default function AdminPage() {
  const navigate = useNavigate();

  // ── Auth gate
  useEffect(() => {
    if (sessionStorage.getItem("adm_ok") !== "1") {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  // ── State
  const [tab, setTab] = useState<TabId>("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [chapters, setChapters] = useState<AdminChapter[]>([]);
  const [feedback, setFeedback] = useState<AdminFeedback[]>([]);

  // search / sort
  const [userSearch, setUserSearch] = useState("");
  const [chapterSearch, setChapterSearch] = useState("");
  const [feedbackSearch, setFeedbackSearch] = useState("");

  const [userSort, setUserSort] = useState<{ col: string; dir: "asc" | "desc" }>({ col: "questionsAnswered", dir: "desc" });
  const [chapterSort, setChapterSort] = useState<{ col: string; dir: "asc" | "desc" }>({ col: "createdAt", dir: "desc" });

  // ── Load data
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersSnap, chaptersSnap, feedbackSnap] = await Promise.all([
        getDocs(collection(db, "users")),
        getDocs(collection(db, "chapters")),
        getDocs(collection(db, "feedback")),
      ]);

      const loadedUsers: AdminUser[] = usersSnap.docs.map(d => {
        const data = d.data();
        const dp = data.dailyProgress;
        return {
          uid: d.id,
          name: data.profile?.name || "—",
          school: data.profile?.school || "—",
          district: data.profile?.district || "—",
          class: data.profile?.class || "—",
          role: data.role || "student",
          streak: data.streak?.current || 0,
          longestStreak: data.streak?.longest || 0,
          questionsAnswered: data.totalQuestionsAnswered || 0,
          questionsWrong: data.totalQuestionsWrong || 0,
          badges: (data.badges || []).length,
          activeToday: dp?.date === today,
          dailyGoal: data.dailyGoalTarget || 10,
          dailyDone: dp?.date === today ? (dp?.questionsAnswered || 0) : 0,
        };
      });

      const loadedChapters: AdminChapter[] = chaptersSnap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          userId: data.userId || "—",
          chapterName: data.chapterName || "—",
          subject: data.subject || "—",
          classNum: data.classNum || "—",
          language: data.language || "—",
          questionsAttempted: data.questionsAttempted || 0,
          questionsWrong: data.questionsWrong || 0,
          createdAt: data.createdAt?.toMillis?.() ?? 0,
          notesRead: !!data.notesRead,
          flashcardsDone: !!data.flashcardsDone,
          simulationsSeen: !!data.simulationsSeen,
        };
      });

      const loadedFeedback: AdminFeedback[] = feedbackSnap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          userId: data.userId || "—",
          chapterName: data.chapterName || "—",
          subject: data.subject || "—",
          type: data.type || "—",
          reason: data.reason || "—",
          note: data.note || "",
          createdAt: data.createdAt?.toMillis?.() ?? 0,
        };
      });

      setUsers(loadedUsers);
      setChapters(loadedChapters);
      setFeedback(loadedFeedback.sort((a, b) => b.createdAt - a.createdAt));
      setLastRefresh(new Date());
    } catch (e: any) {
      setError(e?.message || "Failed to load data from Firestore.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ── Logout
  const handleLogout = () => {
    sessionStorage.removeItem("adm_ok");
    navigate("/", { replace: true });
  };

  // ── Derived stats
  const stats = useMemo(() => {
    const totalUsers = users.length;
    const activeToday = users.filter(u => u.activeToday).length;
    const totalChapters = chapters.length;
    const totalQuestionsAnswered = users.reduce((s, u) => s + u.questionsAnswered, 0);
    const totalQuestionsWrong = users.reduce((s, u) => s + u.questionsWrong, 0);
    const accuracy = totalQuestionsAnswered > 0
      ? Math.round(((totalQuestionsAnswered - totalQuestionsWrong) / totalQuestionsAnswered) * 100)
      : 0;
    const newChaptersThisWeek = chapters.filter(c => c.createdAt > oneWeekAgo).length;
    const totalFeedback = feedback.length;

    // class breakdown (users)
    const classCounts: Record<string, number> = {};
    users.forEach(u => {
      const k = u.class || "Unknown";
      classCounts[k] = (classCounts[k] || 0) + 1;
    });
    const classBreakdown = ["9", "10", "11", "12"].map(c => ({
      label: `Class ${c}`,
      count: classCounts[c] || 0,
      color: c === "9" ? "bg-blue-500" : c === "10" ? "bg-purple-500" : c === "11" ? "bg-orange-500" : "bg-green-500",
    }));

    // district breakdown (users) — top 8
    const districtCounts: Record<string, number> = {};
    users.forEach(u => {
      const k = u.district || "Unknown";
      districtCounts[k] = (districtCounts[k] || 0) + 1;
    });
    const districtBreakdown = Object.entries(districtCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([label, count]) => ({ label, count }));

    // subject breakdown (chapters)
    const subjectCounts: Record<string, number> = {};
    chapters.forEach(c => {
      const k = c.subject || "Unknown";
      subjectCounts[k] = (subjectCounts[k] || 0) + 1;
    });
    const subjectBreakdown = Object.entries(subjectCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([label, count]) => ({ label, count }));

    // chapter class breakdown
    const chapterClassCounts: Record<string, number> = {};
    chapters.forEach(c => {
      const k = c.classNum || "Unknown";
      chapterClassCounts[k] = (chapterClassCounts[k] || 0) + 1;
    });
    const chapterClassBreakdown = ["9", "10", "11", "12"].map(c => ({
      label: `Class ${c}`,
      count: chapterClassCounts[c] || 0,
      color: c === "9" ? "bg-blue-500" : c === "10" ? "bg-purple-500" : c === "11" ? "bg-orange-500" : "bg-green-500",
    }));

    // language breakdown
    const langCounts: Record<string, number> = {};
    chapters.forEach(c => {
      const k = c.language || "Unknown";
      langCounts[k] = (langCounts[k] || 0) + 1;
    });
    const langBreakdown = Object.entries(langCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([label, count]) => ({ label, count }));

    // top streaks
    const topStreaks = [...users].sort((a, b) => b.streak - a.streak).slice(0, 5);

    // feedback reasons
    const reasonCounts: Record<string, number> = {};
    feedback.forEach(f => {
      const k = f.reason || "other";
      reasonCounts[k] = (reasonCounts[k] || 0) + 1;
    });
    const feedbackReasons = Object.entries(reasonCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([label, count]) => ({ label, count }));

    return {
      totalUsers, activeToday, totalChapters, totalQuestionsAnswered,
      accuracy, newChaptersThisWeek, totalFeedback,
      classBreakdown, districtBreakdown, subjectBreakdown,
      chapterClassBreakdown, langBreakdown, topStreaks, feedbackReasons,
    };
  }, [users, chapters, feedback]);

  // ── User sort/filter
  const handleUserSort = (col: string) => {
    setUserSort(prev => prev.col === col
      ? { col, dir: prev.dir === "asc" ? "desc" : "asc" }
      : { col, dir: "desc" }
    );
  };

  const filteredUsers = useMemo(() => {
    const q = userSearch.toLowerCase();
    let list = users.filter(u =>
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.school.toLowerCase().includes(q) ||
      u.district.toLowerCase().includes(q) ||
      u.uid.toLowerCase().includes(q)
    );
    list = [...list].sort((a, b) => {
      const { col, dir } = userSort;
      const av = (a as any)[col];
      const bv = (b as any)[col];
      if (typeof av === "string") {
        return dir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return dir === "asc" ? av - bv : bv - av;
    });
    return list;
  }, [users, userSearch, userSort]);

  // ── Chapter sort/filter
  const handleChapterSort = (col: string) => {
    setChapterSort(prev => prev.col === col
      ? { col, dir: prev.dir === "asc" ? "desc" : "asc" }
      : { col, dir: "desc" }
    );
  };

  const filteredChapters = useMemo(() => {
    const q = chapterSearch.toLowerCase();
    let list = chapters.filter(c =>
      !q ||
      c.chapterName.toLowerCase().includes(q) ||
      c.subject.toLowerCase().includes(q) ||
      c.classNum.toLowerCase().includes(q)
    );
    list = [...list].sort((a, b) => {
      const { col, dir } = chapterSort;
      const av = (a as any)[col];
      const bv = (b as any)[col];
      if (typeof av === "string") {
        return dir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return dir === "asc" ? av - bv : bv - av;
    });
    return list;
  }, [chapters, chapterSearch, chapterSort]);

  // ── Feedback filter
  const filteredFeedback = useMemo(() => {
    const q = feedbackSearch.toLowerCase();
    return feedback.filter(f =>
      !q ||
      f.chapterName.toLowerCase().includes(q) ||
      f.subject.toLowerCase().includes(q) ||
      f.reason.toLowerCase().includes(q) ||
      f.note.toLowerCase().includes(q)
    );
  }, [feedback, feedbackSearch]);

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 bg-gray-950/95 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-green-600/20 border border-green-600/30 flex items-center justify-center flex-shrink-0">
              <Shield className="w-4 h-4 text-green-400" />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-bold text-white leading-none">Topper 2.0 Admin</p>
              <p className="text-xs text-gray-600 leading-none mt-0.5">Internal — restricted access</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {lastRefresh && (
              <span className="hidden sm:flex items-center gap-1.5 text-xs text-gray-600">
                <Clock className="w-3 h-3" />
                Updated {lastRefresh.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}
              </span>
            )}
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 text-xs text-gray-300 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-900/30 hover:bg-red-900/50 border border-red-800/50 text-xs text-red-400 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Exit
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

        {/* ── Error ── */}
        {error && (
          <div className="mb-6 flex items-start gap-3 bg-red-900/20 border border-red-800/50 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* ── Loading skeleton ── */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
            <p className="text-sm text-gray-500">Loading Firestore data…</p>
          </div>
        )}

        {!loading && (
          <>
            {/* ── Tabs ── */}
            <div className="flex items-center gap-2 mb-6 flex-wrap">
              <Tab id="overview"  label="Overview"  icon={BarChart2}     active={tab === "overview"}  onClick={() => setTab("overview")} />
              <Tab id="users"     label={`Users (${stats.totalUsers})`}   icon={Users}        active={tab === "users"}     onClick={() => setTab("users")} />
              <Tab id="chapters"  label={`Chapters (${stats.totalChapters})`} icon={BookOpen} active={tab === "chapters"}  onClick={() => setTab("chapters")} />
              <Tab id="feedback"  label={`Feedback (${stats.totalFeedback})`} icon={MessageSquare} active={tab === "feedback"}  onClick={() => setTab("feedback")} />
            </div>

            {/* ══════════════════════════════════════════════════════ OVERVIEW */}
            {tab === "overview" && (
              <div className="space-y-6">

                {/* Stat cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  <StatCard label="Total Users"       value={stats.totalUsers}              icon={Users}         accent="bg-blue-900/40 text-blue-400" />
                  <StatCard label="Active Today"      value={stats.activeToday}             icon={Target}        accent="bg-green-900/40 text-green-400" />
                  <StatCard label="Chapters Created"  value={stats.totalChapters}           icon={BookOpen}      accent="bg-purple-900/40 text-purple-400" />
                  <StatCard label="Questions Answered" value={stats.totalQuestionsAnswered} icon={HelpCircle}    accent="bg-orange-900/40 text-orange-400" sub="platform-wide" />
                  <StatCard label="Platform Accuracy" value={`${stats.accuracy}%`}         icon={TrendingUp}    accent="bg-teal-900/40 text-teal-400" />
                  <StatCard label="Feedback Reports"  value={stats.totalFeedback}           icon={MessageSquare} accent="bg-red-900/40 text-red-400" />
                </div>

                {/* Secondary stat cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                    <p className="text-xs text-gray-500 mb-1">New Chapters This Week</p>
                    <p className="text-2xl font-bold text-white">{stats.newChaptersThisWeek}</p>
                  </div>
                  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                    <p className="text-xs text-gray-500 mb-1">Avg Questions / User</p>
                    <p className="text-2xl font-bold text-white">
                      {stats.totalUsers > 0 ? Math.round(stats.totalQuestionsAnswered / stats.totalUsers) : 0}
                    </p>
                  </div>
                  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                    <p className="text-xs text-gray-500 mb-1">Avg Chapters / User</p>
                    <p className="text-2xl font-bold text-white">
                      {stats.totalUsers > 0 ? (stats.totalChapters / stats.totalUsers).toFixed(1) : 0}
                    </p>
                  </div>
                  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                    <p className="text-xs text-gray-500 mb-1">Active Today Rate</p>
                    <p className="text-2xl font-bold text-white">
                      {stats.totalUsers > 0
                        ? Math.round((stats.activeToday / stats.totalUsers) * 100)
                        : 0}%
                    </p>
                  </div>
                </div>

                {/* Breakdown grids */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <BreakdownBar
                    title="Users by Class"
                    items={stats.classBreakdown}
                    total={stats.totalUsers}
                  />
                  <BreakdownBar
                    title="Chapters by Subject"
                    items={stats.subjectBreakdown}
                    total={stats.totalChapters}
                  />
                  <BreakdownBar
                    title="Chapters by Class"
                    items={stats.chapterClassBreakdown}
                    total={stats.totalChapters}
                  />
                  <BreakdownBar
                    title="Chapters by Language"
                    items={stats.langBreakdown}
                    total={stats.totalChapters}
                  />
                  <BreakdownBar
                    title="Top Districts (Users)"
                    items={stats.districtBreakdown}
                    total={stats.totalUsers}
                  />
                  {stats.feedbackReasons.length > 0 && (
                    <BreakdownBar
                      title="Feedback Reasons"
                      items={stats.feedbackReasons}
                      total={stats.totalFeedback}
                    />
                  )}
                </div>

                {/* Top streaks */}
                {stats.topStreaks.length > 0 && (
                  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <Flame className="w-4 h-4 text-orange-400" />
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Top Active Streaks</p>
                    </div>
                    <div className="flex flex-col gap-3">
                      {stats.topStreaks.map((u, i) => (
                        <div key={u.uid} className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-xs text-gray-600 w-4 text-right flex-shrink-0">#{i + 1}</span>
                            <div className="min-w-0">
                              <p className="text-sm text-white font-medium truncate">{u.name || "—"}</p>
                              <p className="text-xs text-gray-600 truncate">{u.district} · Class {u.class}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <Flame className="w-3.5 h-3.5 text-orange-400" />
                            <span className="text-sm font-bold text-orange-300">{u.streak}</span>
                            <span className="text-xs text-gray-600">days</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ══════════════════════════════════════════════════════ USERS */}
            {tab === "users" && (
              <div className="space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search by name, school, district, or UID…"
                    value={userSearch}
                    onChange={e => setUserSearch(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-green-600 transition-colors"
                  />
                </div>
                <p className="text-xs text-gray-600">{filteredUsers.length} of {users.length} users</p>

                {/* Table */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-max">
                      <thead className="border-b border-gray-800 bg-gray-900/80">
                        <tr>
                          <Th label="Name"            col="name"             sort={userSort} onSort={handleUserSort} />
                          <Th label="District"        col="district"         sort={userSort} onSort={handleUserSort} />
                          <Th label="Class"           col="class"            sort={userSort} onSort={handleUserSort} />
                          <Th label="Role"            col="role"             sort={userSort} onSort={handleUserSort} />
                          <Th label="Streak"          col="streak"           sort={userSort} onSort={handleUserSort} />
                          <Th label="Q Answered"      col="questionsAnswered" sort={userSort} onSort={handleUserSort} />
                          <Th label="Accuracy"        col="questionsAnswered" sort={userSort} onSort={handleUserSort} />
                          <Th label="Badges"          col="badges"           sort={userSort} onSort={handleUserSort} />
                          <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Today</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800/60">
                        {filteredUsers.length === 0 && (
                          <tr>
                            <td colSpan={9} className="px-4 py-8 text-center text-sm text-gray-600">
                              No users found
                            </td>
                          </tr>
                        )}
                        {filteredUsers.map(u => {
                          const acc = u.questionsAnswered > 0
                            ? Math.round(((u.questionsAnswered - u.questionsWrong) / u.questionsAnswered) * 100)
                            : null;
                          return (
                            <tr key={u.uid} className="hover:bg-gray-800/40 transition-colors">
                              <td className="px-3 py-3 min-w-[140px]">
                                <p className="text-sm text-white font-medium">{u.name || "—"}</p>
                                <p className="text-xs text-gray-600 font-mono">{u.uid.slice(0, 8)}…</p>
                              </td>
                              <td className="px-3 py-3">
                                <div className="flex items-center gap-1.5">
                                  <Globe className="w-3 h-3 text-gray-600 flex-shrink-0" />
                                  <span className="text-xs text-gray-300">{u.district || "—"}</span>
                                </div>
                                <p className="text-xs text-gray-600 mt-0.5">{u.school || "—"}</p>
                              </td>
                              <td className="px-3 py-3 text-center">
                                <span className="text-xs text-gray-300 font-medium">{u.class || "—"}</span>
                              </td>
                              <td className="px-3 py-3">
                                <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${
                                  u.role === "teacher"
                                    ? "bg-purple-900/40 text-purple-300 border border-purple-700/50"
                                    : "bg-gray-800 text-gray-500 border border-gray-700"
                                }`}>
                                  {u.role}
                                </span>
                              </td>
                              <td className="px-3 py-3">
                                <div className="flex items-center gap-1">
                                  <Flame className="w-3.5 h-3.5 text-orange-400" />
                                  <span className="text-sm text-white font-semibold">{u.streak}</span>
                                </div>
                                <p className="text-xs text-gray-600">Best: {u.longestStreak}</p>
                              </td>
                              <td className="px-3 py-3 text-right">
                                <span className="text-sm text-white font-semibold">{fmt(u.questionsAnswered)}</span>
                              </td>
                              <td className="px-3 py-3 text-center">
                                {acc !== null ? (
                                  <span className={`text-sm font-semibold ${acc >= 70 ? "text-green-400" : acc >= 40 ? "text-yellow-400" : "text-red-400"}`}>
                                    {acc}%
                                  </span>
                                ) : (
                                  <span className="text-xs text-gray-600">—</span>
                                )}
                              </td>
                              <td className="px-3 py-3 text-center">
                                <div className="flex items-center gap-1 justify-center">
                                  <Star className="w-3.5 h-3.5 text-yellow-400" />
                                  <span className="text-sm text-white">{u.badges}</span>
                                </div>
                              </td>
                              <td className="px-3 py-3 text-center">
                                {u.activeToday ? (
                                  <span className="inline-flex items-center gap-1 text-xs text-green-400 font-medium">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
                                    {u.dailyDone}/{u.dailyGoal}
                                  </span>
                                ) : (
                                  <span className="text-xs text-gray-700">—</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════ CHAPTERS */}
            {tab === "chapters" && (
              <div className="space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search by chapter name, subject, or class…"
                    value={chapterSearch}
                    onChange={e => setChapterSearch(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-green-600 transition-colors"
                  />
                </div>
                <p className="text-xs text-gray-600">{filteredChapters.length} of {chapters.length} chapters</p>

                {/* Table */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-max">
                      <thead className="border-b border-gray-800 bg-gray-900/80">
                        <tr>
                          <Th label="Chapter"          col="chapterName"       sort={chapterSort} onSort={handleChapterSort} />
                          <Th label="Subject"          col="subject"           sort={chapterSort} onSort={handleChapterSort} />
                          <Th label="Class"            col="classNum"          sort={chapterSort} onSort={handleChapterSort} />
                          <Th label="Language"         col="language"          sort={chapterSort} onSort={handleChapterSort} />
                          <Th label="Q Attempted"      col="questionsAttempted" sort={chapterSort} onSort={handleChapterSort} />
                          <Th label="Created"          col="createdAt"         sort={chapterSort} onSort={handleChapterSort} />
                          <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Progress</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800/60">
                        {filteredChapters.length === 0 && (
                          <tr>
                            <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-600">
                              No chapters found
                            </td>
                          </tr>
                        )}
                        {filteredChapters.map(c => (
                          <tr key={c.id} className="hover:bg-gray-800/40 transition-colors">
                            <td className="px-3 py-3 min-w-[180px]">
                              <p className="text-sm text-white font-medium">{c.chapterName}</p>
                              <p className="text-xs text-gray-600 font-mono">{c.userId.slice(0, 8)}…</p>
                            </td>
                            <td className="px-3 py-3">
                              <SubjectBadge subject={c.subject} />
                            </td>
                            <td className="px-3 py-3 text-center">
                              <span className="text-xs text-gray-300 font-medium">{c.classNum || "—"}</span>
                            </td>
                            <td className="px-3 py-3">
                              <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${
                                c.language === "hindi"
                                  ? "bg-rose-900/30 text-rose-300 border border-rose-800/50"
                                  : "bg-blue-900/30 text-blue-300 border border-blue-800/50"
                              }`}>
                                {c.language || "—"}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-right">
                              <span className="text-sm text-white font-semibold">{c.questionsAttempted}</span>
                              {c.questionsWrong > 0 && (
                                <p className="text-xs text-red-400">{c.questionsWrong} wrong</p>
                              )}
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap">
                              <p className="text-xs text-gray-400">{fmtDateShort(c.createdAt)}</p>
                            </td>
                            <td className="px-3 py-3">
                              <div className="flex items-center gap-2">
                                <span title="Notes read"        className={`w-2 h-2 rounded-full ${c.notesRead       ? "bg-green-400" : "bg-gray-700"}`} />
                                <span title="Flashcards done"   className={`w-2 h-2 rounded-full ${c.flashcardsDone  ? "bg-blue-400"  : "bg-gray-700"}`} />
                                <span title="Simulations seen"  className={`w-2 h-2 rounded-full ${c.simulationsSeen ? "bg-purple-400": "bg-gray-700"}`} />
                                <span className="text-xs text-gray-700">
                                  {[c.notesRead, c.flashcardsDone, c.simulationsSeen].filter(Boolean).length}/3
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                {/* Legend */}
                <p className="text-xs text-gray-700 flex items-center gap-4">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-400 inline-block" /> Notes read</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-400  inline-block" /> Flashcards done</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-purple-400 inline-block" /> Simulations seen</span>
                </p>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════ FEEDBACK */}
            {tab === "feedback" && (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search by chapter, subject, reason, or note…"
                    value={feedbackSearch}
                    onChange={e => setFeedbackSearch(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-green-600 transition-colors"
                  />
                </div>
                <p className="text-xs text-gray-600">{filteredFeedback.length} of {feedback.length} reports</p>

                {filteredFeedback.length === 0 && (
                  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center">
                    <Award className="w-8 h-8 text-gray-700 mx-auto mb-3" />
                    <p className="text-sm text-gray-600">No feedback reports yet</p>
                  </div>
                )}

                <div className="space-y-3">
                  {filteredFeedback.map(f => (
                    <div key={f.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2 flex-wrap min-w-0">
                          <SubjectBadge subject={f.subject} />
                          <span className={`text-xs px-2 py-0.5 rounded-md border font-medium ${
                            f.type === "flashcard"
                              ? "bg-blue-900/30 text-blue-300 border-blue-800/50"
                              : "bg-orange-900/30 text-orange-300 border-orange-800/50"
                          }`}>
                            {f.type}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-md border bg-red-900/20 text-red-300 border-red-800/40 font-medium">
                            {f.reason.replace(/_/g, " ")}
                          </span>
                        </div>
                        <span className="text-xs text-gray-600 flex-shrink-0">{fmtDate(f.createdAt)}</span>
                      </div>
                      <p className="text-sm text-gray-300 font-medium">{f.chapterName}</p>
                      {f.note && (
                        <p className="text-xs text-gray-500 mt-1 italic">"{f.note}"</p>
                      )}
                      <p className="text-xs text-gray-700 font-mono mt-1">{f.userId.slice(0, 16)}…</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
