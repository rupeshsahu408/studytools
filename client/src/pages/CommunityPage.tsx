import { useState, useEffect, useCallback } from "react";
import SEOHead from "../components/SEOHead";
import {
  Trophy, Users, Copy, Check, LogIn, LogOut,
  Plus, Loader2, Crown, Medal, Award,
  GraduationCap, Flame, Share2,
  Trash2, UserPlus, Bell, X, MessageSquare, ArrowRight,
  MessageCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useProgress } from "../contexts/ProgressContext";
import {
  getLeaderboard, getWeekKey,
  getClassById, getClassByInviteCode, getClassMembers, getSharedChapters,
  createClass, joinClass, leaveClass,
  shareChapterToClass, removeSharedChapter, markNotificationsRead, getNotifications,
  type LeaderboardEntry, type ClassRoom, type ClassMember, type SharedChapter, type NotificationItem,
} from "../lib/firestore";
import TopHeader from "../components/TopHeader";
import BottomNav from "../components/BottomNav";
import DiscussionView from "../components/DiscussionView";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "S";
}

function rankColor(rank: number) {
  if (rank === 1) return "from-yellow-400 to-amber-500";
  if (rank === 2) return "from-gray-300 to-gray-400";
  if (rank === 3) return "from-orange-400 to-orange-500";
  return "from-green-500 to-emerald-600";
}

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Crown className="w-4 h-4 text-yellow-500" />;
  if (rank === 2) return <Medal className="w-4 h-4 text-gray-400" />;
  if (rank === 3) return <Award className="w-4 h-4 text-orange-400" />;
  return <span className="text-xs font-bold text-gray-500 dark:text-gray-400">#{rank}</span>;
}

// ─── Leaderboard Tab ─────────────────────────────────────────────────────────

function LeaderboardTab({ currentUid, school, district }: { currentUid: string; school: string; district: string }) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "school" | "district">("all");
  const [weekOffset, setWeekOffset] = useState(0);

  const loadLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      const weekKey = getWeekKey(weekOffset);
      const data = await getLeaderboard(weekKey);
      setEntries(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [weekOffset]);

  useEffect(() => { loadLeaderboard(); }, [loadLeaderboard]);

  const filtered = entries.filter(e => {
    if (filter === "school") return school && e.school === school;
    if (filter === "district") return district && e.district === district;
    return true;
  });

  const weekKey = getWeekKey(weekOffset);
  const weekLabel = weekOffset === 0 ? "This Week" : weekOffset === 1 ? "Last Week" : `${weekOffset} weeks ago`;
  const top3 = filtered.slice(0, 3);

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white">{weekLabel}</h3>
          <p className="text-xs text-gray-400 dark:text-gray-500">{weekKey} · Updates with every question answered</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekOffset(w => w + 1)}
            className="text-xs text-gray-400 hover:text-green-600 transition-colors px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            ← Prev
          </button>
          {weekOffset > 0 && (
            <button
              onClick={() => setWeekOffset(0)}
              className="text-xs text-green-600 dark:text-green-400 font-medium px-2 py-1 rounded-lg bg-green-50 dark:bg-green-900/20">
              Current
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-2 mb-5">
        {[
          { key: "all", label: "All India" },
          { key: "school", label: "My School", disabled: !school },
          { key: "district", label: "My District", disabled: !district },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => !f.disabled && setFilter(f.key as any)}
            disabled={f.disabled}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              filter === f.key
                ? "bg-green-600 text-white"
                : f.disabled
                ? "text-gray-300 dark:text-gray-700 cursor-not-allowed"
                : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-green-300"
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">No entries yet</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Answer questions this week to appear on the leaderboard!
          </p>
        </div>
      ) : (
        <>
          {top3.length >= 2 && (
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[top3[1], top3[0], top3[2]].filter(Boolean).map((entry, idx) => {
                const rank = idx === 0 ? 2 : idx === 1 ? 1 : 3;
                const isMe = entry.uid === currentUid;
                return (
                  <div
                    key={entry.uid}
                    className={`bg-white dark:bg-gray-900 border rounded-2xl p-3 text-center flex flex-col items-center gap-1 ${
                      isMe ? "border-green-300 dark:border-green-700 shadow-md" : "border-gray-100 dark:border-gray-800"
                    }`}>
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${rankColor(rank)} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                      {getInitials(entry.displayName)}
                    </div>
                    <RankIcon rank={rank} />
                    <p className="text-xs font-bold text-gray-900 dark:text-white leading-tight line-clamp-1">{entry.displayName}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 line-clamp-1">{entry.school || entry.district || "India"}</p>
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg px-2 py-1 w-full mt-1">
                      <p className="text-xs font-bold text-green-600 dark:text-green-400">{entry.questionsThisWeek} Qs</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="space-y-2">
            {filtered.map((entry, i) => {
              const rank = i + 1;
              const isMe = entry.uid === currentUid;
              return (
                <div
                  key={entry.uid}
                  className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                    isMe
                      ? "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800"
                      : "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800"
                  }`}>
                  <div className="w-8 flex items-center justify-center flex-shrink-0">
                    <RankIcon rank={rank} />
                  </div>
                  <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${rankColor(rank)} flex items-center justify-center text-white font-bold text-xs flex-shrink-0`}>
                    {getInitials(entry.displayName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white leading-snug flex items-center gap-1.5">
                      {entry.displayName}
                      {isMe && <span className="text-xs bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded-full font-medium">You</span>}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{[entry.school, entry.district].filter(Boolean).join(" · ") || "India"}</p>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-bold text-green-600 dark:text-green-400">{entry.questionsThisWeek}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">Qs</p>
                    </div>
                    <div className="text-right hidden sm:block">
                      <div className="flex items-center gap-1">
                        <Flame className="w-3 h-3 text-orange-500" />
                        <p className="text-sm font-bold text-orange-500">{entry.streak}</p>
                      </div>
                      <p className="text-xs text-gray-400 dark:text-gray-500">streak</p>
                    </div>
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-bold text-blue-600 dark:text-blue-400">{entry.accuracy}%</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">accuracy</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 text-center">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Leaderboard resets every Monday · Answer questions to climb the ranks
            </p>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Discussion Tab ───────────────────────────────────────────────────────────

const DISCUSSION_ROOMS = [
  { id: "general",   label: "General",   emoji: "💬" },
  { id: "physics",   label: "Physics",   emoji: "⚛️" },
  { id: "chemistry", label: "Chemistry", emoji: "🧪" },
  { id: "math",      label: "Math",      emoji: "📐" },
  { id: "biology",   label: "Biology",   emoji: "🌿" },
];

function DiscussionTab() {
  const [room, setRoom] = useState("general");
  const current = DISCUSSION_ROOMS.find(r => r.id === room) || DISCUSSION_ROOMS[0];

  return (
    <div>
      {/* Room selector */}
      <div className="mb-5">
        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2.5">
          Choose a room
        </p>
        <div className="flex gap-2 flex-wrap">
          {DISCUSSION_ROOMS.map(r => (
            <button
              key={r.id}
              onClick={() => setRoom(r.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all border ${
                room === r.id
                  ? "bg-green-600 text-white border-green-600 shadow-sm"
                  : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-green-300 dark:hover:border-green-700 hover:text-green-700 dark:hover:text-green-400"
              }`}
            >
              <span>{r.emoji}</span>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Discussion feed — re-mounts on room change for fresh subscription */}
      <DiscussionView
        key={room}
        chapterId={`_room_${room}`}
        chapterName={`${current.label} Discussion`}
        subject={current.label}
      />
    </div>
  );
}

// ─── My Class Tab ─────────────────────────────────────────────────────────────

function MyClassTab({
  uid, userData, chapters, refreshUserData,
}: {
  uid: string;
  userData: any;
  chapters: any[];
  refreshUserData: () => Promise<void>;
}) {
  const navigate = useNavigate();
  const isTeacher = userData?.role === "teacher";
  const classId: string | null = userData?.classId || null;
  const displayName = userData?.profile?.name || "Student";
  const school = userData?.profile?.school || "";
  const district = userData?.profile?.district || "";
  const classNum = userData?.profile?.class || "11";

  const [myClass, setMyClass] = useState<ClassRoom | null>(null);
  const [members, setMembers] = useState<ClassMember[]>([]);
  const [sharedChapters, setSharedChapters] = useState<SharedChapter[]>([]);
  const [loadingClass, setLoadingClass] = useState(true);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createClassName, setCreateClassName] = useState("");
  const [creatingClass, setCreatingClass] = useState(false);
  const [createError, setCreateError] = useState("");

  const [joinCode, setJoinCode] = useState("");
  const [joiningClass, setJoiningClass] = useState(false);
  const [joinError, setJoinError] = useState("");

  const [sharingChapterId, setSharingChapterId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const loadClassData = useCallback(async (cid: string) => {
    setLoadingClass(true);
    try {
      const [cls, mems, shared] = await Promise.all([
        getClassById(cid),
        getClassMembers(cid),
        getSharedChapters(cid),
      ]);
      setMyClass(cls);
      setMembers(mems);
      setSharedChapters(shared);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingClass(false);
    }
  }, []);

  useEffect(() => {
    if (classId) {
      loadClassData(classId);
    } else {
      setLoadingClass(false);
    }
  }, [classId, loadClassData]);

  const handleCreateClass = async () => {
    const name = createClassName.trim();
    if (!name) { setCreateError("Please enter a class name."); return; }
    setCreatingClass(true);
    setCreateError("");
    try {
      await createClass(uid, displayName, name, school);
      await refreshUserData();
      setShowCreateForm(false);
      setCreateClassName("");
    } catch {
      setCreateError("Could not create class. Please try again.");
    } finally {
      setCreatingClass(false);
    }
  };

  const handleJoinClass = async () => {
    const code = joinCode.trim().toUpperCase();
    if (code.length < 4) { setJoinError("Please enter a valid invite code."); return; }
    setJoiningClass(true);
    setJoinError("");
    try {
      const cls = await getClassByInviteCode(code);
      if (!cls) { setJoinError("Class not found. Check the invite code."); return; }
      await joinClass(cls.id, uid, displayName, school, district, classNum);
      await refreshUserData();
    } catch {
      setJoinError("Could not join class. Please try again.");
    } finally {
      setJoiningClass(false);
    }
  };

  const handleLeaveClass = async () => {
    if (!classId || !myClass) return;
    if (!confirm(`Leave "${myClass.className}"? You can rejoin anytime with the invite code.`)) return;
    try {
      await leaveClass(classId, uid);
      setMyClass(null); setMembers([]); setSharedChapters([]);
      await refreshUserData();
    } catch (e) { console.error(e); }
  };

  const handleShareChapter = async (chapterId: string) => {
    if (!classId || !myClass) return;
    setSharingChapterId(chapterId);
    try {
      const chapter = chapters.find(c => c.id === chapterId);
      if (!chapter) return;
      await shareChapterToClass(
        classId, chapterId, uid, displayName,
        chapter.chapterName, chapter.subject, chapter.classNum, chapter.language
      );
      await loadClassData(classId);
    } catch (e) { console.error(e); }
    finally { setSharingChapterId(null); }
  };

  const handleUnshare = async (chapterId: string) => {
    if (!classId) return;
    try {
      await removeSharedChapter(classId, chapterId);
      setSharedChapters(prev => prev.filter(c => c.chapterId !== chapterId));
    } catch (e) { console.error(e); }
  };

  const copyInviteCode = () => {
    if (!myClass) return;
    navigator.clipboard.writeText(myClass.inviteCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (loadingClass) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!classId || !myClass) {
    return (
      <div>
        {isTeacher ? (
          <div>
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/10 border border-green-100 dark:border-green-800 rounded-2xl p-6 mb-6 text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
                <GraduationCap className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Create Your Class</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-5 max-w-sm mx-auto">
                Create a class, share an invite code with your students, and track their progress.
              </p>
              {!showCreateForm ? (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors flex items-center gap-2 mx-auto">
                  <Plus className="w-4 h-4" /> Create Class
                </button>
              ) : (
                <div className="max-w-sm mx-auto text-left">
                  <input
                    type="text"
                    value={createClassName}
                    onChange={e => setCreateClassName(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") handleCreateClass(); }}
                    placeholder="Class name (e.g. Science Batch 2025)"
                    className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-green-400 text-gray-900 dark:text-white placeholder-gray-400 mb-3"
                    autoFocus
                  />
                  {createError && <p className="text-xs text-red-500 mb-2">{createError}</p>}
                  <div className="flex gap-2">
                    <button
                      onClick={handleCreateClass}
                      disabled={creatingClass}
                      className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm flex items-center justify-center gap-2">
                      {creatingClass ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      {creatingClass ? "Creating..." : "Create"}
                    </button>
                    <button
                      onClick={() => { setShowCreateForm(false); setCreateClassName(""); setCreateError(""); }}
                      className="px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/10 border border-blue-100 dark:border-blue-800 rounded-2xl p-6 mb-6 text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserPlus className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Join a Class</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-5 max-w-sm mx-auto">
                Enter the 6-character invite code your teacher shared with you.
              </p>
              <div className="max-w-xs mx-auto">
                <input
                  type="text"
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                  onKeyDown={e => { if (e.key === "Enter") handleJoinClass(); }}
                  placeholder="e.g. AB3XYZ"
                  className="w-full text-center text-xl font-mono tracking-widest bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 outline-none focus:border-green-400 text-gray-900 dark:text-white placeholder-gray-400 mb-3"
                  maxLength={6}
                />
                {joinError && <p className="text-xs text-red-500 mb-2">{joinError}</p>}
                <button
                  onClick={handleJoinClass}
                  disabled={joiningClass || joinCode.length < 4}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold px-4 py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
                  {joiningClass ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                  {joiningClass ? "Joining..." : "Join Class"}
                </button>
              </div>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30 rounded-xl p-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                <strong>Don't have a code?</strong> Ask your teacher to share the invite code for their Topper 2.0 class.
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  const isShared = (chapterId: string) => sharedChapters.some(sc => sc.chapterId === chapterId);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/10 border border-green-100 dark:border-green-800 rounded-2xl p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <GraduationCap className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">{myClass.className}</h3>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isTeacher ? "Your class" : `Teacher: ${myClass.teacherName}`}
              {myClass.school && ` · ${myClass.school}`}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              <Users className="w-3.5 h-3.5 inline mr-1" />
              {members.length} {members.length === 1 ? "student" : "students"}
            </p>
          </div>
          {!isTeacher && (
            <button
              onClick={handleLeaveClass}
              className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 transition-colors border border-red-200 dark:border-red-800 px-3 py-1.5 rounded-xl flex-shrink-0">
              <LogOut className="w-3.5 h-3.5" /> Leave
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Invite Code</p>
              <p className="text-xl font-mono font-bold text-gray-900 dark:text-white tracking-widest">{myClass.inviteCode}</p>
            </div>
            <button
              onClick={copyInviteCode}
              className="flex items-center gap-1.5 text-xs font-semibold text-green-600 dark:text-green-400 hover:text-green-700 transition-colors">
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      </div>

      {chapters.length > 0 && (
        <div>
          <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
            <Share2 className="w-4 h-4 text-green-600" /> Share Chapters
          </h4>
          <div className="space-y-2">
            {chapters.map(chapter => {
              const shared = isShared(chapter.id);
              return (
                <div key={chapter.id} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{chapter.chapterName}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{chapter.subject} · Class {chapter.classNum}</p>
                  </div>
                  {shared ? (
                    <button
                      onClick={() => handleUnshare(chapter.id)}
                      className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 transition-colors border border-red-200 dark:border-red-800 px-3 py-1.5 rounded-xl flex-shrink-0">
                      <Trash2 className="w-3 h-3" /> Unshare
                    </button>
                  ) : (
                    <button
                      onClick={() => handleShareChapter(chapter.id)}
                      disabled={sharingChapterId === chapter.id}
                      className="flex items-center gap-1.5 text-xs font-semibold text-green-600 dark:text-green-400 hover:text-green-700 transition-colors border border-green-200 dark:border-green-800 px-3 py-1.5 rounded-xl flex-shrink-0 disabled:opacity-50">
                      {sharingChapterId === chapter.id
                        ? <Loader2 className="w-3 h-3 animate-spin" />
                        : <Share2 className="w-3 h-3" />
                      }
                      Share
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-green-600" /> Members
          {members.length > 0 && <span className="text-xs font-normal text-gray-400">({members.length})</span>}
        </h4>
        {members.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 text-center">
            <Users className="w-8 h-8 text-gray-300 dark:text-gray-700 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">No students yet.</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Share the invite code to get started!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {members.map(member => (
              <div
                key={member.uid}
                className={`bg-white dark:bg-gray-900 border rounded-xl p-3 flex items-center gap-3 ${
                  member.uid === uid ? "border-green-200 dark:border-green-800" : "border-gray-100 dark:border-gray-800"
                }`}>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                  {getInitials(member.displayName)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                    {member.displayName}
                    {member.uid === uid && (
                      <span className="text-xs bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded-full">You</span>
                    )}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Class {member.class}</p>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0 text-right">
                  <div>
                    <p className="text-sm font-bold text-green-600 dark:text-green-400">{member.questionsAnswered}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">Qs</p>
                  </div>
                  <div className="hidden sm:block">
                    <div className="flex items-center gap-1">
                      <Flame className="w-3 h-3 text-orange-500" />
                      <p className="text-sm font-bold text-orange-500">{member.streak}</p>
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500">streak</p>
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-sm font-bold text-blue-600 dark:text-blue-400">{member.accuracy}%</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">acc.</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Notifications Panel ──────────────────────────────────────────────────────

function timeAgo(ts: any): string {
  if (!ts?.toMillis) return "";
  const diff = Date.now() - ts.toMillis();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "abhi";
  if (m < 60) return `${m}m pehle`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h pehle`;
  const d = Math.floor(h / 24);
  return `${d}d pehle`;
}

function NotificationsPanel({ uid, onClose }: { uid: string; onClose: () => void }) {
  const navigate = useNavigate();
  const [notifs, setNotifs] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getNotifications(uid)
      .then(setNotifs)
      .catch(console.warn)
      .finally(() => setLoading(false));
  }, [uid]);

  function handleClick(n: NotificationItem) {
    onClose();
    navigate(`/chapter/${n.chapterId}?section=discussion`);
  }

  return (
    <>
      <div className="fixed inset-0 z-30 bg-black/20 dark:bg-black/40" onClick={onClose} />
      <div className="fixed right-0 top-14 bottom-0 w-80 bg-white dark:bg-gray-900 border-l border-gray-100 dark:border-gray-800 z-40 flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-purple-500" />
            <span className="font-semibold text-gray-900 dark:text-white text-sm">Notifications</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            </div>
          ) : notifs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3 px-6 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <Bell className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Koi notification nahi hai abhi.</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">Jab koi aapke post pe reply karega, yahan dikhega.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {notifs.map(n => (
                <button key={n.id} onClick={() => handleClick(n)}
                  className="w-full text-left px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors flex gap-3 items-start">
                  <div className="relative flex-shrink-0 mt-0.5">
                    {!n.read && (
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-purple-500 border-2 border-white dark:border-gray-900 z-10" />
                    )}
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold">
                      {getInitials(n.fromUserName)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs leading-snug mb-0.5 ${!n.read ? "font-semibold text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"}`}>
                      <span className="text-purple-600 dark:text-purple-400">{n.fromUserName}</span>
                      {" "}ne aapke post pe reply kiya{" "}
                      <span className="italic text-gray-500 dark:text-gray-400">"{n.chapterName}"</span>
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-snug mb-1">{n.preview}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-gray-400 dark:text-gray-500">{timeAgo(n.createdAt)}</span>
                      <span className="text-[10px] text-purple-500 flex items-center gap-0.5">Discussion dekho <ArrowRight className="w-3 h-3" /></span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        {notifs.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
            <MessageSquare className="w-3.5 h-3.5" />
            {notifs.length} notification{notifs.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CommunityPage() {
  const { user } = useAuth();
  const { userData, chapters, refreshUserData } = useProgress();
  const [activeTab, setActiveTab] = useState<"leaderboard" | "discussion" | "class">("leaderboard");
  const [showNotifPanel, setShowNotifPanel] = useState(false);

  useEffect(() => {
    if (user?.uid) markNotificationsRead(user.uid).catch(console.warn);
  }, [user?.uid]);

  const school = userData?.profile?.school || "";
  const district = userData?.profile?.district || "";

  const tabs = [
    { key: "leaderboard", label: "Leaderboard", icon: Trophy },
    { key: "discussion",  label: "Discussion",  icon: MessageCircle },
    { key: "class",       label: "My Class",    icon: Users },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <SEOHead
        title="Community — Leaderboard, Discussions & Study Groups"
        description="Join thousands of Bihar Board students on Topper 2.0's community. Compete on the weekly leaderboard, join subject discussions, share chapters in your class group and study together."
        keywords="Bihar Board student leaderboard, NCERT study community, Class 11 12 discussion group, student leaderboard India, study group Bihar Board, weekly leaderboard Bihar students"
        canonical="/community"
      />
      <TopHeader title="Community" />
      <div className="pt-12 pb-20 max-w-3xl mx-auto px-4 py-4">

        {/* Page header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
              <Users className="w-6 h-6 text-green-600" /> Community
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Compete on the leaderboard, chat with students, and study together.
            </p>
          </div>
          {user && (
            <button
              onClick={() => setShowNotifPanel(v => !v)}
              className="flex-shrink-0 mt-1 p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:border-purple-300 dark:hover:border-purple-700 transition-all shadow-sm"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
            </button>
          )}
        </div>

        {showNotifPanel && user?.uid && (
          <NotificationsPanel uid={user.uid} onClose={() => setShowNotifPanel(false)} />
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl mb-6">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === tab.key
                  ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}>
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div key={activeTab}>
          {activeTab === "leaderboard" && (
            <LeaderboardTab currentUid={user?.uid || ""} school={school} district={district} />
          )}
          {activeTab === "discussion" && (
            <DiscussionTab />
          )}
          {activeTab === "class" && (
            <MyClassTab
              uid={user?.uid || ""}
              userData={userData}
              chapters={chapters}
              refreshUserData={refreshUserData}
            />
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
