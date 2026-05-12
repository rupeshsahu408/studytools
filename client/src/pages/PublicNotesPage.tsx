import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Globe, Search, BookOpen, X, ChevronDown, ChevronUp,
  Loader2, Filter, ArrowLeft, Eye, Atom, FlaskConical,
  Calculator, Leaf, Users, Calendar,
} from "lucide-react";
import Navbar from "../components/Navbar";
import { getAllPublicNotes, type PublicNote } from "../lib/firestore";

// ─── Constants ────────────────────────────────────────────────────────────────

const BOARDS = [
  "Bihar Board", "UP Board", "MP Board", "Rajasthan Board",
  "Haryana Board", "Uttarakhand Board", "CBSE", "ICSE", "Other",
];

const PUBLIC_SUBJECTS = [
  "Physics", "Chemistry", "Biology", "Mathematics",
  "Social Science", "History", "Geography", "Political Science",
  "Economics", "Hindi", "English", "Computer Science", "Sanskrit", "Other",
];

const SUBJECT_ICONS: Record<string, any> = {
  Physics: Atom, Chemistry: FlaskConical, Mathematics: Calculator, Biology: Leaf,
};

const SUBJECT_COLORS: Record<string, string> = {
  Physics:     "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
  Chemistry:   "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
  Mathematics: "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400",
  Biology:     "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
};

function formatDate(ts: any): string {
  if (!ts) return "";
  try {
    const d = ts.toDate ? ts.toDate() : new Date(ts.seconds ? ts.seconds * 1000 : ts);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch { return ""; }
}

// ─── Notes Reader Modal ───────────────────────────────────────────────────────

function NotesReader({ note, onClose }: { note: PublicNote; onClose: () => void }) {
  const [expandedTopics, setExpandedTopics] = useState<Set<number>>(new Set([0]));
  const notes = note.notes;

  const toggle = (i: number) => {
    setExpandedTopics(prev => {
      const s = new Set(prev);
      s.has(i) ? s.delete(i) : s.add(i);
      return s;
    });
  };

  if (!notes) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 text-center max-w-sm w-full">
          <p className="text-gray-500 dark:text-gray-400">Notes content unavailable.</p>
          <button onClick={onClose} className="mt-4 text-green-600 hover:underline text-sm">Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-gray-50 dark:bg-gray-950 w-full sm:max-w-3xl sm:rounded-2xl max-h-[95vh] sm:max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">

        {/* Sticky header */}
        <div className="flex items-start justify-between p-4 sm:p-5 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex-shrink-0">
          <div className="flex-1 min-w-0 pr-3">
            <h2 className="font-bold text-gray-900 dark:text-white text-base leading-snug line-clamp-2">
              {note.chapterName}
            </h2>
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">{note.subject}</span>
              <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">Class {note.classNum}</span>
              <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">{note.board}</span>
              <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">
                {note.medium === "hindi" ? "Hindi Medium" : "English Medium"}
              </span>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5 flex items-center gap-1">
              <Users className="w-3 h-3" />
              By {note.publisherName} · {formatDate(note.publishedAt)}
            </p>
          </div>
          <button onClick={onClose}
            className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">

          {/* Chapter Overview */}
          {notes.chapterOverview && (
            <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
              <h3 className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-wide mb-2">Chapter Overview</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{notes.chapterOverview}</p>
            </div>
          )}

          {/* Topics */}
          {Array.isArray(notes.topics) && notes.topics.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Topics ({notes.topics.length})</h3>
              {notes.topics.map((topic: any, i: number) => (
                <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                  <button
                    onClick={() => toggle(i)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white leading-snug pr-2">{topic.title}</span>
                    {expandedTopics.has(i)
                      ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                  </button>

                  {expandedTopics.has(i) && (
                    <div className="px-4 pb-4 space-y-3 border-t border-gray-50 dark:border-gray-800 pt-3">
                      {topic.content && (
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{topic.content}</p>
                      )}

                      {Array.isArray(topic.keyPoints) && topic.keyPoints.length > 0 && (
                        <div>
                          <p className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-wide mb-1.5">Key Points</p>
                          <ul className="space-y-1">
                            {topic.keyPoints.map((pt: string, j: number) => (
                              <li key={j} className="text-sm text-gray-700 dark:text-gray-300 flex gap-2">
                                <span className="text-green-500 mt-0.5 flex-shrink-0">•</span>
                                <span>{pt}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {Array.isArray(topic.formulasUsed) && topic.formulasUsed.length > 0 && (
                        <div>
                          <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1.5">Formulas</p>
                          <div className="space-y-1.5">
                            {topic.formulasUsed.map((f: any, j: number) => (
                              <div key={j} className="bg-blue-50 dark:bg-blue-900/20 rounded-lg px-3 py-2">
                                <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">{f.name}</p>
                                <p className="text-sm font-mono text-blue-800 dark:text-blue-200 mt-0.5">{f.formula}</p>
                                {f.explanation && <p className="text-xs text-blue-600/80 dark:text-blue-400/80 mt-0.5">{f.explanation}</p>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {Array.isArray(topic.importantTerms) && topic.importantTerms.length > 0 && (
                        <div>
                          <p className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wide mb-1.5">Important Terms</p>
                          <div className="space-y-1.5">
                            {topic.importantTerms.map((t: any, j: number) => (
                              <div key={j} className="text-sm">
                                <span className="font-semibold text-gray-900 dark:text-white">{t.term}: </span>
                                <span className="text-gray-600 dark:text-gray-400">{t.definition}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Summary */}
          {notes.summary && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/40 rounded-xl p-4">
              <h3 className="text-xs font-bold text-green-700 dark:text-green-400 uppercase tracking-wide mb-2">Chapter Summary</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{notes.summary}</p>
            </div>
          )}

          {/* Exam Tips */}
          {Array.isArray(notes.examTips) && notes.examTips.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/40 rounded-xl p-4">
              <h3 className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-2">Exam Tips</h3>
              <ul className="space-y-1.5">
                {notes.examTips.map((tip: string, i: number) => (
                  <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex gap-2">
                    <span className="text-amber-500 mt-0.5 flex-shrink-0">★</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Filter Select ────────────────────────────────────────────────────────────

function FilterSelect({
  label, value, onChange, options, allLabel,
}: { label: string; value: string; onChange: (v: string) => void; options: string[]; allLabel: string }) {
  return (
    <div className="flex flex-col gap-1 min-w-0">
      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500/30 min-w-0">
        <option value="">{allLabel}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PublicNotesPage() {
  const navigate = useNavigate();
  const [notes, setNotes] = useState<PublicNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNote, setSelectedNote] = useState<PublicNote | null>(null);
  const [search, setSearch] = useState("");

  const [filterBoard,   setFilterBoard]   = useState("");
  const [filterClass,   setFilterClass]   = useState("");
  const [filterMedium,  setFilterMedium]  = useState("");
  const [filterSubject, setFilterSubject] = useState("");

  useEffect(() => {
    getAllPublicNotes(200)
      .then(setNotes)
      .catch(e => console.error("Failed to load public notes:", e))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return notes.filter(n => {
      if (filterBoard   && n.board    !== filterBoard)   return false;
      if (filterClass   && n.classNum !== filterClass)   return false;
      if (filterMedium  && n.medium   !== filterMedium)  return false;
      if (filterSubject && n.subject  !== filterSubject) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!n.chapterName.toLowerCase().includes(q) &&
            !n.subject.toLowerCase().includes(q) &&
            !n.publisherName.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [notes, filterBoard, filterClass, filterMedium, filterSubject, search]);

  const hasFilters = filterBoard || filterClass || filterMedium || filterSubject || search;
  const clearFilters = () => {
    setFilterBoard(""); setFilterClass(""); setFilterMedium(""); setFilterSubject(""); setSearch("");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <div className="pt-14 max-w-5xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-6">
          <button onClick={() => navigate("/dashboard")}
            className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-green-600 mb-4 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
          </button>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
              <Globe className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Community Notes</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Study notes shared by students — filter by board, class, medium, and subject
              </p>
            </div>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by chapter name, subject, or student..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/30"
          />
        </div>

        {/* Filter bar */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Filters</span>
            {hasFilters && (
              <button onClick={clearFilters}
                className="ml-auto text-xs text-green-600 hover:text-green-700 font-medium transition-colors flex items-center gap-1">
                <X className="w-3 h-3" /> Clear all
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <FilterSelect label="Board"   value={filterBoard}   onChange={setFilterBoard}   options={BOARDS}          allLabel="All Boards"   />
            <FilterSelect label="Class"   value={filterClass}   onChange={setFilterClass}   options={["9","10","11","12"].map(c => c)} allLabel="All Classes"  />
            <FilterSelect label="Medium"  value={filterMedium}  onChange={setFilterMedium}  options={["hindi","english"]} allLabel="All Mediums"  />
            <FilterSelect label="Subject" value={filterSubject} onChange={setFilterSubject} options={PUBLIC_SUBJECTS}  allLabel="All Subjects" />
          </div>
        </div>

        {/* Results summary */}
        {!loading && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {hasFilters
              ? `${filtered.length} note${filtered.length !== 1 ? "s" : ""} found`
              : `${notes.length} note${notes.length !== 1 ? "s" : ""} shared by the community`}
          </p>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="h-40 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-gray-300 dark:text-gray-600" />
            </div>
            <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-1">No notes found</h3>
            <p className="text-sm text-gray-400 dark:text-gray-500 max-w-xs">
              {hasFilters ? "Try changing or clearing the filters above." : "No notes have been published yet. Be the first to share!"}
            </p>
            {hasFilters && (
              <button onClick={clearFilters}
                className="mt-4 text-sm text-green-600 hover:text-green-700 font-medium transition-colors">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(note => {
              const Icon = SUBJECT_ICONS[note.subject] || BookOpen;
              const colorClass = SUBJECT_COLORS[note.subject] || "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400";
              return (
                <div key={note.id}
                  onClick={() => setSelectedNote(note)}
                  className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 cursor-pointer hover:border-green-300 dark:hover:border-green-700 hover:shadow-md transition-all group">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                      <Icon className="w-4.5 h-4.5" />
                    </div>
                    <span className="text-xs bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full font-medium">
                      {note.medium === "hindi" ? "Hindi" : "English"}
                    </span>
                  </div>

                  <p className="font-semibold text-gray-900 dark:text-white text-sm leading-snug mb-2 line-clamp-2">{note.chapterName}</p>

                  <div className="flex flex-wrap gap-1 mb-3">
                    <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">{note.subject}</span>
                    <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">Class {note.classNum}</span>
                    <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">{note.board}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
                      <Users className="w-3 h-3" />
                      <span className="truncate max-w-[100px]">{note.publisherName}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      <Eye className="w-3 h-3" /> Read
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 mt-1.5">
                    <Calendar className="w-3 h-3" />
                    {formatDate(note.publishedAt)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Notes reader modal */}
      {selectedNote && (
        <NotesReader note={selectedNote} onClose={() => setSelectedNote(null)} />
      )}
    </div>
  );
}
