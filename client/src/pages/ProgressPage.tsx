import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart2, BookOpen, HelpCircle, Layers, Beaker,
  CheckCircle, XCircle, Flame, TrendingUp, Clock,
  Atom, FlaskConical, Calculator, Leaf, ChevronRight,
} from "lucide-react";
import { useProgress } from "../contexts/ProgressContext";
import TopHeader from "../components/TopHeader";
import BottomNav from "../components/BottomNav";

const SUBJECT_COLORS: Record<string, { bg: string; text: string; icon: any; bar: string }> = {
  Physics:     { bg: "bg-blue-100 dark:bg-blue-900/30",    text: "text-blue-600 dark:text-blue-400",    icon: Atom,        bar: "bg-blue-500" },
  Chemistry:   { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-600 dark:text-purple-400", icon: FlaskConical, bar: "bg-purple-500" },
  Mathematics: { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-600 dark:text-orange-400", icon: Calculator,   bar: "bg-orange-500" },
  Biology:     { bg: "bg-green-100 dark:bg-green-900/30",   text: "text-green-600 dark:text-green-400",   icon: Leaf,         bar: "bg-green-500" },
};

function getChapterCompletion(chapter: any): number {
  const flags = [
    chapter.notesRead ? 1 : 0,
    (chapter.questionsAttempted || 0) > 0 ? 1 : 0,
    chapter.flashcardsDone ? 1 : 0,
    chapter.simulationsSeen ? 1 : 0,
  ];
  return Math.round((flags.reduce((a: number, b: number) => a + b, 0) / 4) * 100);
}

function formatDate(ts: any): string {
  if (!ts) return "";
  try {
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  } catch { return ""; }
}

export default function ProgressPage() {
  const navigate = useNavigate();
  const { userData, loadingUser, chapters, refreshChapters } = useProgress();

  useEffect(() => { refreshChapters(); }, []);

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-green-200 border-t-green-600 rounded-full animate-spin" />
      </div>
    );
  }

  const totalAnswered = userData?.totalQuestionsAnswered || 0;
  const totalWrong = userData?.totalQuestionsWrong || 0;
  const accuracy = totalAnswered > 0 ? Math.round(((totalAnswered - totalWrong) / totalAnswered) * 100) : 0;
  const streak = userData?.streak?.current || 0;

  const subjectStats: Record<string, { chapters: number; completion: number; attempted: number; wrong: number }> = {};
  for (const ch of chapters) {
    const s = ch.subject;
    if (!subjectStats[s]) subjectStats[s] = { chapters: 0, completion: 0, attempted: 0, wrong: 0 };
    subjectStats[s].chapters++;
    subjectStats[s].completion += getChapterCompletion(ch);
    subjectStats[s].attempted += ch.questionsAttempted || 0;
    subjectStats[s].wrong += ch.questionsWrong || 0;
  }
  for (const s of Object.keys(subjectStats)) {
    subjectStats[s].completion = Math.round(subjectStats[s].completion / subjectStats[s].chapters);
  }

  const overallCompletion = chapters.length > 0
    ? Math.round(chapters.reduce((sum, c) => sum + getChapterCompletion(c), 0) / chapters.length)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <TopHeader title="My Progress" />

      <div className="pt-12 pb-20 max-w-2xl mx-auto px-4 py-4">

        {/* Overview Stats — 2×2 grid */}
        <div className="grid grid-cols-2 gap-3 mb-4 pt-2">
          {[
            { icon: BookOpen, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/20", label: "Chapters", value: chapters.length.toString(), sub: "uploaded" },
            { icon: HelpCircle, color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-900/20", label: "Questions", value: totalAnswered.toString(), sub: "answered" },
            { icon: TrendingUp, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-900/20", label: "Accuracy", value: `${accuracy}%`, sub: totalAnswered > 0 ? "correct rate" : "no data" },
            { icon: Flame, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-900/20", label: "Streak", value: streak.toString(), sub: "day streak" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${stat.bg}`}>
                <stat.icon className={`w-4.5 h-4.5 ${stat.color}`} />
              </div>
              <div>
                <div className="text-xl font-black text-gray-900 dark:text-white leading-none">{stat.value}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{stat.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Overall Progress Bar */}
        {chapters.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-green-600" />
                <span className="font-semibold text-gray-900 dark:text-white text-sm">Overall Study Completion</span>
              </div>
              <span className="text-lg font-black text-green-600 dark:text-green-400">{overallCompletion}%</span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2.5 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all"
                style={{ width: `${overallCompletion}%` }} />
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
              Based on notes, questions, flashcards & simulations
            </p>
          </div>
        )}

        {/* Subject Breakdown */}
        {Object.keys(subjectStats).length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 mb-4">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-3">Subject Breakdown</h3>
            <div className="space-y-3.5">
              {Object.entries(subjectStats).map(([subject, stats]) => {
                const style = SUBJECT_COLORS[subject] || { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-600", icon: BookOpen, bar: "bg-gray-400" };
                const Icon = style.icon;
                const subjectAccuracy = stats.attempted > 0
                  ? Math.round(((stats.attempted - stats.wrong) / stats.attempted) * 100) : null;
                return (
                  <div key={subject}>
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${style.bg}`}>
                        <Icon className={`w-3 h-3 ${style.text}`} />
                      </div>
                      <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm flex-1">{subject}</span>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span>{stats.chapters} ch</span>
                        {subjectAccuracy !== null && (
                          <span className={`font-semibold ${
                            subjectAccuracy >= 70 ? "text-green-600 dark:text-green-400"
                            : subjectAccuracy >= 50 ? "text-orange-500" : "text-red-500"
                          }`}>{subjectAccuracy}%</span>
                        )}
                        <span className={`font-bold ${style.text}`}>{stats.completion}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${style.bar}`}
                        style={{ width: `${stats.completion}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Chapter Cards */}
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-3">Chapter-wise Progress</h3>

          {chapters.length === 0 ? (
            <div className="text-center py-14 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
              <BookOpen className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">No chapters uploaded yet.</p>
              <button onClick={() => navigate("/upload")}
                className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors">
                Upload First Chapter
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {chapters.map((chapter) => {
                const completion = getChapterCompletion(chapter);
                const style = SUBJECT_COLORS[chapter.subject] || SUBJECT_COLORS.Physics;
                const Icon = style.icon;
                const attempted = chapter.questionsAttempted || 0;
                const wrong = chapter.questionsWrong || 0;
                const chapterAccuracy = attempted > 0 ? Math.round(((attempted - wrong) / attempted) * 100) : null;
                const lastStudied = formatDate(chapter.lastStudied);

                return (
                  <div key={chapter.id}
                    onClick={() => navigate(`/chapter/${chapter.id}`)}
                    className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 cursor-pointer hover:border-green-200 dark:hover:border-green-800 hover:shadow-sm transition-all group">

                    <div className="flex items-start gap-3 mb-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${style.bg}`}>
                        <Icon className={`w-3.5 h-3.5 ${style.text}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white text-sm leading-snug truncate">
                          {chapter.chapterName}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-xs text-gray-400">{chapter.subject}</span>
                          <span className="text-gray-200 dark:text-gray-700">·</span>
                          <span className="text-xs text-gray-400">Class {chapter.classNum}</span>
                          {lastStudied && (
                            <>
                              <span className="text-gray-200 dark:text-gray-700">·</span>
                              <span className="text-xs text-gray-400 flex items-center gap-0.5">
                                <Clock className="w-2.5 h-2.5" /> {lastStudied}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className={`text-sm font-black ${
                          completion === 100 ? "text-green-600 dark:text-green-400"
                          : completion >= 50 ? "text-orange-500"
                          : "text-gray-400 dark:text-gray-600"
                        }`}>{completion}%</span>
                        <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-700 group-hover:text-green-500 transition-colors" />
                      </div>
                    </div>

                    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 mb-3 overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${
                        completion === 100 ? "bg-green-500" : completion >= 50 ? "bg-orange-400" : "bg-gray-300 dark:bg-gray-600"
                      }`} style={{ width: `${completion}%` }} />
                    </div>

                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        { icon: BookOpen, label: "Notes", done: !!chapter.notesRead },
                        { icon: HelpCircle, label: attempted > 0 ? `${attempted}Q` : "Q", done: attempted > 0, sub: chapterAccuracy !== null ? `${chapterAccuracy}%` : null },
                        { icon: Layers, label: "Cards", done: !!chapter.flashcardsDone },
                        { icon: Beaker, label: "Sims", done: !!chapter.simulationsSeen },
                      ].map(({ label, done, sub }) => (
                        <div key={label} className={`flex flex-col items-center gap-0.5 py-2 px-1 rounded-xl text-center ${
                          done ? "bg-green-50 dark:bg-green-900/10" : "bg-gray-50 dark:bg-gray-800"
                        }`}>
                          {done
                            ? <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                            : <XCircle className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600" />
                          }
                          <span className={`text-[10px] font-medium leading-tight ${
                            done ? "text-green-700 dark:text-green-400" : "text-gray-400 dark:text-gray-600"
                          }`}>{label}</span>
                          {sub && <span className="text-[9px] text-gray-400 leading-none">{sub}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
