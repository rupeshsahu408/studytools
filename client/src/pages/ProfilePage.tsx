import { useState, useEffect, useRef } from "react";
import {
  Flame, Target, Calendar, Trophy, Brain,
  Edit2, Check, X, ChevronRight, AlertTriangle, Loader2,
  BookOpen, Zap, Star, GraduationCap, Users, ExternalLink,
  Camera, Lock,
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from "../contexts/AuthContext";
import { useProgress, ALL_BADGES } from "../contexts/ProgressContext";
import { analyzeWeakAreas } from "../lib/api";
import type { WeakAreaResult } from "../lib/api";
import {
  saveUserData,
  subscribeToSocialUser, updateSocialProfile,
  type SocialUser,
} from "../lib/firestore";
import { storage } from "../lib/firebase";
import Navbar from "../components/Navbar";

const SOCIAL_GRADIENTS = [
  "from-violet-500 to-purple-600",
  "from-blue-500 to-indigo-600",
  "from-rose-500 to-pink-600",
  "from-amber-500 to-orange-600",
  "from-teal-500 to-cyan-600",
  "from-green-500 to-emerald-600",
  "from-fuchsia-500 to-pink-600",
  "from-sky-500 to-blue-600",
];
function getSocialGradient(uid: string): string {
  const idx = Math.abs(uid.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)) % SOCIAL_GRADIENTS.length;
  return SOCIAL_GRADIENTS[idx];
}
function getSocialInitials(name: string): string {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "?";
}

const BIHAR_DISTRICTS = [
  "Araria","Arwal","Aurangabad","Banka","Begusarai","Bhagalpur","Bhojpur","Buxar",
  "Darbhanga","East Champaran","Gaya","Gopalganj","Jamui","Jehanabad","Kaimur",
  "Katihar","Khagaria","Kishanganj","Lakhisarai","Madhepura","Madhubani","Munger",
  "Muzaffarpur","Nalanda","Nawada","Patna","Purnia","Rohtas","Saharsa","Samastipur",
  "Saran","Sheikhpura","Sheohar","Sitamarhi","Siwan","Supaul","Vaishali",
  "West Champaran",
];

function getDaysRemaining(examDate: string | null): number | null {
  if (!examDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exam = new Date(examDate);
  exam.setHours(0, 0, 0, 0);
  const diff = Math.ceil((exam.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

function getChapterCompletion(chapter: any): number {
  const flags = [
    chapter.notesRead ? 1 : 0,
    (chapter.questionsAttempted || 0) > 0 ? 1 : 0,
    chapter.flashcardsDone ? 1 : 0,
    chapter.simulationsSeen ? 1 : 0,
  ];
  return Math.round((flags.reduce((a, b) => a + b, 0) / 4) * 100);
}

function buildRevisionPlan(chapters: any[], daysRemaining: number): Array<{ week: number; chapters: string[]; focus: string }> {
  if (daysRemaining <= 0 || chapters.length === 0) return [];
  const incomplete = chapters
    .map(c => ({ name: c.chapterName, subject: c.subject, pct: getChapterCompletion(c) }))
    .filter(c => c.pct < 100)
    .sort((a, b) => a.pct - b.pct);
  if (incomplete.length === 0) return [];
  const weeksRemaining = Math.max(1, Math.ceil(daysRemaining / 7));
  const chapsPerWeek = Math.ceil(incomplete.length / weeksRemaining);
  const plan: Array<{ week: number; chapters: string[]; focus: string }> = [];
  for (let w = 0; w < weeksRemaining && w < 8; w++) {
    const weekChaps = incomplete.slice(w * chapsPerWeek, (w + 1) * chapsPerWeek);
    if (weekChaps.length === 0) break;
    const focuses = ["Study & Notes", "Practice Questions", "Revision & Flashcards", "Mock Test"];
    plan.push({
      week: w + 1,
      chapters: weekChaps.map(c => `${c.subject}: ${c.name}`),
      focus: focuses[w % focuses.length],
    });
  }
  return plan;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { userData, loadingUser, chapters, updateProfile, setExamDate, setDailyGoal, refreshChapters, refreshUserData } = useProgress();

  // Role state
  const [switchingRole, setSwitchingRole] = useState(false);

  // Profile editing state
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editClass, setEditClass] = useState("11");
  const [editSchool, setEditSchool] = useState("");
  const [editDistrict, setEditDistrict] = useState("");
  const [saving, setSaving] = useState(false);

  // Exam date
  const [examDateInput, setExamDateInput] = useState("");
  const [savingExamDate, setSavingExamDate] = useState(false);

  // Daily goal
  const [goalInput, setGoalInput] = useState(10);
  const [editingGoal, setEditingGoal] = useState(false);

  // Save errors
  const [saveError, setSaveError] = useState("");
  const [examDateError, setExamDateError] = useState("");
  const [goalError, setGoalError] = useState("");

  // Weak areas
  const [analyzingWeak, setAnalyzingWeak] = useState(false);
  const [weakAreas, setWeakAreas] = useState<WeakAreaResult[]>([]);
  const [weakError, setWeakError] = useState("");
  const [weakAnalyzed, setWeakAnalyzed] = useState(false);

  // ── Social ──────────────────────────────────────────────────────────────────
  const [socialUser, setSocialUser] = useState<SocialUser | null>(null);
  const [editingBio, setEditingBio] = useState(false);
  const [editBioText, setEditBioText] = useState("");
  const [savingBio, setSavingBio] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (userData) {
      setEditName(userData.profile?.name || user?.displayName || "");
      setEditClass(userData.profile?.class || "11");
      setEditSchool(userData.profile?.school || "");
      setEditDistrict(userData.profile?.district || "");
      setExamDateInput(userData.examDate || "");
      setGoalInput(userData.dailyGoalTarget || 10);
    }
  }, [userData, user]);

  useEffect(() => {
    refreshChapters();
  }, []);

  // Social effects
  useEffect(() => {
    if (!user?.uid) return;
    return subscribeToSocialUser(user.uid, (su) => {
      setSocialUser(su);
      if (!editingBio) setEditBioText(su?.bio || "");
    });
  }, [user?.uid]);

  const handleRoleSwitch = async (newRole: "student" | "teacher") => {
    if (!user || switchingRole) return;
    setSwitchingRole(true);
    try {
      await saveUserData(user.uid, { role: newRole });
      await refreshUserData();
    } catch (e) {
      console.error(e);
    } finally {
      setSwitchingRole(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setSaveError("");
    try {
      await updateProfile({ name: editName, class: editClass, school: editSchool, district: editDistrict });
      setEditing(false);
    } catch (e: any) {
      const msg = e?.code === "permission-denied"
        ? "Permission denied — your Firestore security rules may not be deployed. Go to Firebase Console → Firestore → Rules and publish them."
        : e?.message || "Failed to save profile. Please check your connection and try again.";
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveExamDate = async () => {
    setSavingExamDate(true);
    setExamDateError("");
    try {
      await setExamDate(examDateInput || null);
    } catch (e: any) {
      const msg = e?.code === "permission-denied"
        ? "Permission denied — Firestore rules may not be deployed."
        : e?.message || "Failed to save exam date. Please try again.";
      setExamDateError(msg);
    } finally {
      setSavingExamDate(false);
    }
  };

  const handleSaveGoal = async () => {
    setGoalError("");
    try {
      await setDailyGoal(goalInput);
      setEditingGoal(false);
    } catch (e: any) {
      setGoalError(e?.message || "Failed to save goal. Please try again.");
    }
  };

  // ── Social Handlers ─────────────────────────────────────────────────────────
  const handleBioSave = async () => {
    if (!user) return;
    setSavingBio(true);
    try {
      await updateSocialProfile(user.uid, { bio: editBioText.trim() });
      setEditingBio(false);
    } catch (e) { console.error(e); }
    finally { setSavingBio(false); }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) return;
    setPhotoUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const pathRef = storageRef(storage, `profilePhotos/${user.uid}.${ext}`);
      await uploadBytes(pathRef, file);
      const url = await getDownloadURL(pathRef);
      await updateSocialProfile(user.uid, { photoURL: url });
    } catch (e) { console.error(e); }
    finally { setPhotoUploading(false); if (photoInputRef.current) photoInputRef.current.value = ""; }
  };

  const handleAnalyzeWeakAreas = async () => {
    setAnalyzingWeak(true);
    setWeakError("");
    try {
      const chapterInputs = chapters
        .filter(c => (c.questionsAttempted || 0) >= 3)
        .map(c => ({
          chapterName: c.chapterName,
          subject: c.subject,
          classNum: c.classNum,
          totalAttempted: c.questionsAttempted || 0,
          totalWrong: c.questionsWrong || 0,
          wrongQuestions: c.wrongQuestions || [],
        }));
      if (chapterInputs.length === 0) {
        setWeakError("Practice at least 3 questions in a chapter first to analyze weak areas.");
        setAnalyzingWeak(false);
        return;
      }
      const result = await analyzeWeakAreas(chapterInputs);
      setWeakAreas(result.weakAreas || []);
      setWeakAnalyzed(true);
    } catch {
      setWeakError("Could not analyze weak areas. Please try again.");
    } finally {
      setAnalyzingWeak(false);
    }
  };

  const daysRemaining = getDaysRemaining(userData?.examDate || null);
  const revisionPlan = userData?.examDate && chapters.length > 0
    ? buildRevisionPlan(chapters, daysRemaining || 0)
    : [];

  const profile = userData?.profile;
  const streak = userData?.streak;
  const today = new Date().toISOString().split("T")[0];
  const dailyDone = userData?.dailyProgress?.date === today
    ? userData.dailyProgress.questionsAnswered
    : 0;
  const dailyTarget = userData?.dailyGoalTarget || 10;
  const dailyPct = Math.min(100, Math.round((dailyDone / dailyTarget) * 100));

  // Chapters with weak performance
  const weakChapters = chapters.filter(c =>
    (c.questionsAttempted || 0) >= 3 &&
    ((c.questionsWrong || 0) / (c.questionsAttempted || 1)) > 0.3
  );

  const displayName = profile?.name || user?.displayName || user?.email?.split("@")[0] || "Student";
  const avatarLetter = displayName.charAt(0).toUpperCase();

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-green-200 border-t-green-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <div className="pt-14 max-w-5xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Profile</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Manage your account, track your streak, and set your exam goal.
          </p>
        </div>

        {/* ── Social Profile Card ── */}
        {user && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm mb-6 overflow-hidden">
            {/* Gradient banner */}
            <div className={`h-20 bg-gradient-to-br ${getSocialGradient(user.uid)} opacity-75`} />

            <div className="px-6 pb-6">
              {/* Avatar + edit row */}
              <div className="flex items-end justify-between -mt-10 mb-4">
                <div className="relative">
                  {socialUser?.photoURL ? (
                    <img
                      src={socialUser.photoURL}
                      alt={displayName}
                      className="w-20 h-20 rounded-full object-cover ring-4 ring-white dark:ring-gray-900 shadow-lg"
                    />
                  ) : (
                    <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${getSocialGradient(user.uid)} flex items-center justify-center ring-4 ring-white dark:ring-gray-900 shadow-lg`}>
                      <span className="text-white text-2xl font-bold">{getSocialInitials(displayName)}</span>
                    </div>
                  )}
                  <button
                    onClick={() => photoInputRef.current?.click()}
                    disabled={photoUploading}
                    className="absolute bottom-0 right-0 w-7 h-7 bg-green-600 hover:bg-green-700 disabled:opacity-60 rounded-full flex items-center justify-center shadow-md transition-colors"
                    title="Change photo"
                  >
                    {photoUploading ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" /> : <Camera className="w-3.5 h-3.5 text-white" />}
                  </button>
                  <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                </div>
                <Link
                  to={`/u/${socialUser?.username || ""}`}
                  className={`text-xs font-semibold text-green-600 dark:text-green-400 hover:underline flex items-center gap-1 ${!socialUser?.username ? "opacity-0 pointer-events-none" : ""}`}
                >
                  <ExternalLink className="w-3.5 h-3.5" /> View public profile
                </Link>
              </div>

              {/* Name + username */}
              <div className="mb-3">
                <h2 className="text-lg font-black text-gray-900 dark:text-white">{displayName}</h2>
                {socialUser?.username && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-green-600 dark:text-green-400 font-medium text-sm flex items-center gap-1">
                      @{socialUser.username}
                    </p>
                    <span className="inline-flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                      <Lock className="w-2.5 h-2.5" /> Permanent
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>{socialUser?.friends?.length ?? 0} {(socialUser?.friends?.length ?? 0) === 1 ? "friend" : "friends"}</span>
                  {(socialUser?.friendRequestsReceived?.length ?? 0) > 0 && (
                    <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-bold px-2 py-0.5 rounded-full">
                      {socialUser!.friendRequestsReceived!.length} request{socialUser!.friendRequestsReceived!.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>

              {/* Bio */}
              {editingBio ? (
                <div className="space-y-2">
                  <textarea
                    value={editBioText}
                    onChange={e => setEditBioText(e.target.value.slice(0, 120))}
                    rows={2}
                    placeholder="Write a short bio…"
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-green-400 transition-colors resize-none"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleBioSave}
                      disabled={savingBio}
                      className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-colors"
                    >
                      {savingBio ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                      Save
                    </button>
                    <button onClick={() => setEditingBio(false)} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 px-2 py-1.5 rounded-xl transition-colors">
                      Cancel
                    </button>
                    <span className="ml-auto text-xs text-gray-400">{editBioText.length}/120</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <p className={`text-sm flex-1 leading-relaxed ${socialUser?.bio ? "text-gray-600 dark:text-gray-400" : "text-gray-400 dark:text-gray-600 italic"}`}>
                    {socialUser?.bio || "No bio yet — tell the world about yourself!"}
                  </p>
                  <button onClick={() => setEditingBio(true)} className="flex-shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ── LEFT COLUMN ── */}
          <div className="space-y-5">

            {/* Profile Card */}
            <div
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">

              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-green-600 flex items-center justify-center text-white text-2xl font-bold">
                    {avatarLetter}
                  </div>
                  <div>
                    <h2 className="font-bold text-gray-900 dark:text-white text-lg leading-tight">
                      {displayName}
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{user?.email}</p>
                    {profile?.class && (
                      <span className="inline-block mt-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full font-medium">
                        Class {profile.class}
                      </span>
                    )}
                  </div>
                </div>
                <button onClick={() => setEditing(e => !e)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>

              
                {editing ? (
                  <div
                    className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 block">Name</label>
                      <input value={editName} onChange={e => setEditName(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-green-500"
                        placeholder="Your full name" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 block">Class</label>
                      <select value={editClass} onChange={e => setEditClass(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-green-500">
                        <option value="11">Class 11</option>
                        <option value="12">Class 12</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 block">School Name</label>
                      <input value={editSchool} onChange={e => setEditSchool(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-green-500"
                        placeholder="e.g. Govt Higher Secondary School" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 block">District (Bihar)</label>
                      <select value={editDistrict} onChange={e => setEditDistrict(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-green-500">
                        <option value="">Select district</option>
                        {BIHAR_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    {saveError && (
                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl px-3 py-2 text-xs">
                        {saveError}
                      </div>
                    )}
                    <div className="flex gap-2 pt-1">
                      <button onClick={handleSaveProfile} disabled={saving}
                        className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-semibold py-2 rounded-xl transition-colors flex items-center justify-center gap-2">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        {saving ? "Saving..." : "Save"}
                      </button>
                      <button onClick={() => { setEditing(false); setSaveError(""); }}
                        className="px-4 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-sm font-medium py-2 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {[
                      { label: "Class", value: profile?.class ? `Class ${profile.class}` : "Not set" },
                      { label: "School", value: profile?.school || "Not set" },
                      { label: "District", value: profile?.district || "Not set" },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400">{label}</span>
                        <span className={`font-medium ${value === "Not set" ? "text-gray-300 dark:text-gray-600 italic" : "text-gray-800 dark:text-gray-200"}`}>
                          {value}
                        </span>
                      </div>
                    ))}
                    <button onClick={() => setEditing(true)}
                      className="w-full mt-2 text-xs text-green-600 dark:text-green-400 hover:underline text-left">
                      Edit profile →
                    </button>
                  </div>
                )}
              
            </div>

            {/* Role + Class Card */}
            <div
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-green-600" />
                <h3 className="font-bold text-gray-900 dark:text-white">Role & Class</h3>
              </div>

              {/* Role toggle */}
              <div className="mb-4">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium">I am a:</p>
                <div className="flex gap-2">
                  {(["student", "teacher"] as const).map(role => {
                    const isActive = (userData?.role || "student") === role;
                    return (
                      <button
                        key={role}
                        onClick={() => !isActive && handleRoleSwitch(role)}
                        disabled={switchingRole || isActive}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all ${
                          isActive
                            ? "bg-green-600 text-white"
                            : "bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-green-300 dark:hover:border-green-700"
                        }`}>
                        {switchingRole && !isActive
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : role === "student"
                          ? <Users className="w-3.5 h-3.5" />
                          : <GraduationCap className="w-3.5 h-3.5" />
                        }
                        {role === "student" ? "Student" : "Teacher"}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Class info */}
              {userData?.classId ? (
                <div className="bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800 rounded-xl p-3">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                    {userData.role === "teacher" ? "Your Class" : "Joined Class"}
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {userData.role === "teacher" ? "Class Active" : "Class Joined"}
                    </p>
                    <button
                      onClick={() => navigate("/community")}
                      className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 hover:text-green-700 font-medium">
                      View <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 flex items-center justify-between">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {userData?.role === "teacher" ? "No class created yet" : "Not in any class"}
                  </p>
                  <button
                    onClick={() => navigate("/community")}
                    className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 hover:text-green-700 font-medium">
                    {userData?.role === "teacher" ? "Create" : "Join"} <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            {/* Streak Card */}
            <div
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Flame className="w-5 h-5 text-orange-500" />
                <h3 className="font-bold text-gray-900 dark:text-white">Study Streak</h3>
              </div>
              <div className="flex items-end gap-6">
                <div className="text-center">
                  <div className="text-5xl font-black text-orange-500 leading-none">{streak?.current || 0}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">day streak</div>
                </div>
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Best streak</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1">
                      <Trophy className="w-3.5 h-3.5 text-yellow-500" /> {streak?.longest || 0} days
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Last studied</span>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {streak?.lastStudyDate
                        ? streak.lastStudyDate === today ? "Today 🎉" : streak.lastStudyDate
                        : "Not started"}
                    </span>
                  </div>
                </div>
              </div>
              {(streak?.current || 0) === 0 && (
                <div className="mt-4 text-center">
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Answer questions or read notes to start your streak!
                  </p>
                  <button onClick={() => navigate("/dashboard")}
                    className="mt-2 text-xs text-green-600 dark:text-green-400 font-medium hover:underline">
                    Start studying →
                  </button>
                </div>
              )}
            </div>

            {/* Daily Goal Card */}
            <div
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-green-600" />
                  <h3 className="font-bold text-gray-900 dark:text-white">Aaj Ka Target</h3>
                </div>
                <button onClick={() => setEditingGoal(e => !e)}
                  className="text-xs text-green-600 dark:text-green-400 hover:underline">
                  {editingGoal ? "Cancel" : "Edit"}
                </button>
              </div>

              {editingGoal ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <input type="number" value={goalInput} onChange={e => setGoalInput(Math.max(1, Math.min(100, Number(e.target.value))))}
                      min="1" max="100"
                      className="w-24 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-center text-gray-900 dark:text-white focus:outline-none focus:border-green-500" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">questions/day</span>
                    <button onClick={handleSaveGoal}
                      className="bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors">
                      Save
                    </button>
                  </div>
                  {goalError && (
                    <p className="text-xs text-red-500 dark:text-red-400">{goalError}</p>
                  )}
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="text-2xl font-black text-green-600">{dailyDone}</span>
                      <span className="text-gray-400 dark:text-gray-500"> / {dailyTarget} questions</span>
                    </span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      dailyPct >= 100 ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                    }`}>
                      {dailyPct}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{ width: `${dailyPct}%` }}
                    />
                  </div>
                  {dailyPct >= 100 && (
                    <p className="text-xs text-green-600 dark:text-green-400 font-medium mt-2 text-center">
                      🎉 Aaj ka target pura! Bahut badhiya!
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="space-y-5">

            {/* Exam Countdown Card */}
            <div
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-blue-500" />
                <h3 className="font-bold text-gray-900 dark:text-white">Exam Countdown</h3>
              </div>

              <div className="flex gap-3 mb-2">
                <input type="date" value={examDateInput}
                  onChange={e => setExamDateInput(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500" />
                <button onClick={handleSaveExamDate} disabled={savingExamDate}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5">
                  {savingExamDate ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Set
                </button>
              </div>
              {examDateError && (
                <p className="text-xs text-red-500 dark:text-red-400 mb-3">{examDateError}</p>
              )}

              {userData?.examDate && daysRemaining !== null && (
                <div className={`rounded-2xl p-5 text-center ${
                  daysRemaining < 0 ? "bg-gray-100 dark:bg-gray-800"
                  : daysRemaining <= 30 ? "bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800/30"
                  : daysRemaining <= 60 ? "bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-800/30"
                  : "bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30"
                }`}>
                  <div className={`text-5xl font-black leading-none mb-1 ${
                    daysRemaining < 0 ? "text-gray-400"
                    : daysRemaining <= 30 ? "text-red-500"
                    : daysRemaining <= 60 ? "text-orange-500"
                    : "text-blue-600 dark:text-blue-400"
                  }`}>
                    {daysRemaining < 0 ? "Done!" : daysRemaining}
                  </div>
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {daysRemaining < 0 ? "Board exam has passed"
                    : daysRemaining === 0 ? "Exam is TODAY! 💪"
                    : daysRemaining === 1 ? "day remaining — Kal exam hai!"
                    : `days until Bihar Board exam`}
                  </div>
                  {daysRemaining > 0 && daysRemaining <= 30 && (
                    <p className="text-xs text-red-500 dark:text-red-400 mt-2 font-medium">
                      ⚠️ Sirf {daysRemaining} din bacha hai — abhi revision shuru karo!
                    </p>
                  )}
                </div>
              )}

              {!userData?.examDate && (
                <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-2">
                  Set your exam date to see the countdown and revision plan.
                </p>
              )}
            </div>

            {/* Revision Planner */}
            
              {revisionPlan.length > 0 && daysRemaining && daysRemaining > 0 && (
                <div
                  className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <BookOpen className="w-5 h-5 text-purple-500" />
                    <h3 className="font-bold text-gray-900 dark:text-white">Revision Planner</h3>
                    <span className="ml-auto text-xs text-gray-400">{daysRemaining} days left</span>
                  </div>
                  <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                    {revisionPlan.map(week => (
                      <div key={week.week} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-2 py-0.5 rounded-full">
                            Week {week.week}
                          </span>
                          <span className="text-xs text-gray-400">{week.focus}</span>
                        </div>
                        <ul className="space-y-1">
                          {week.chapters.map((ch, i) => (
                            <li key={i} className="flex items-start gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                              <ChevronRight className="w-3 h-3 text-purple-400 mt-0.5 flex-shrink-0" />
                              {ch}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            

            {/* Badges */}
            <div
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <h3 className="font-bold text-gray-900 dark:text-white">Badges</h3>
                <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">
                  {userData?.badges?.length || 0} / {ALL_BADGES.length} earned
                </span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {ALL_BADGES.map(badge => {
                  const earned = (userData?.badges || []).includes(badge.id);
                  return (
                    <div key={badge.id}
                      className={`flex flex-col items-center text-center p-3 rounded-xl border transition-all ${
                        earned
                          ? "bg-yellow-50 dark:bg-yellow-900/10 border-yellow-100 dark:border-yellow-800/30"
                          : "bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700 opacity-50"
                      }`}
                      title={`${badge.title}: ${badge.desc}`}>
                      <span className="text-2xl mb-1">{badge.icon}</span>
                      <span className={`text-xs font-semibold leading-tight ${
                        earned ? "text-gray-800 dark:text-gray-200" : "text-gray-400 dark:text-gray-600"
                      }`}>
                        {badge.title}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Weak Area Detection */}
            <div
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Brain className="w-5 h-5 text-red-500" />
                <h3 className="font-bold text-gray-900 dark:text-white">Weak Area Detection</h3>
              </div>

              {weakChapters.length === 0 && !weakAnalyzed ? (
                <div className="text-center py-4">
                  <Zap className="w-8 h-8 text-gray-300 dark:text-gray-700 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Practice questions in your chapters to detect weak areas.
                    <br />
                    <span className="text-xs">At least 3 questions per chapter needed.</span>
                  </p>
                </div>
              ) : (
                <>
                  {weakChapters.length > 0 && !weakAnalyzed && (
                    <div className="space-y-2 mb-4">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                        Chapters with &gt;30% wrong answers:
                      </p>
                      {weakChapters.map(ch => {
                        const wrongPct = Math.round(((ch.questionsWrong || 0) / (ch.questionsAttempted || 1)) * 100);
                        return (
                          <div key={ch.id} className="flex items-center gap-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800/30 rounded-xl px-3 py-2.5">
                            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{ch.chapterName}</p>
                              <p className="text-xs text-red-500 dark:text-red-400">{ch.subject} · {wrongPct}% wrong</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {weakAnalyzed && weakAreas.length > 0 && (
                    <div className="space-y-3 mb-4">
                      {weakAreas.map((area, i) => (
                        <div key={i} className={`rounded-xl p-3 border ${
                          area.priority === "high" ? "bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-800/30"
                          : area.priority === "medium" ? "bg-orange-50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-800/30"
                          : "bg-yellow-50 dark:bg-yellow-900/10 border-yellow-100 dark:border-yellow-800/30"
                        }`}>
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className={`text-xs font-bold px-1.5 py-0.5 rounded uppercase ${
                              area.priority === "high" ? "bg-red-200 dark:bg-red-800/40 text-red-700 dark:text-red-300"
                              : area.priority === "medium" ? "bg-orange-200 dark:bg-orange-800/40 text-orange-700 dark:text-orange-300"
                              : "bg-yellow-200 dark:bg-yellow-800/40 text-yellow-700 dark:text-yellow-300"
                            }`}>
                              {area.priority}
                            </span>
                            <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">
                              {area.chapterName}
                            </span>
                          </div>
                          {area.weakTopics.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {area.weakTopics.map((t, ti) => (
                                <span key={ti} className="text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">
                                  {t}
                                </span>
                              ))}
                            </div>
                          )}
                          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{area.advice}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {weakAnalyzed && weakAreas.length === 0 && (
                    <div className="text-center py-3 mb-4">
                      <Star className="w-8 h-8 text-green-400 mx-auto mb-1" />
                      <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                        No significant weak areas found! Keep practicing.
                      </p>
                    </div>
                  )}

                  {weakError && (
                    <p className="text-xs text-red-500 dark:text-red-400 mb-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800 rounded-xl px-3 py-2">
                      {weakError}
                    </p>
                  )}

                  <button onClick={handleAnalyzeWeakAreas} disabled={analyzingWeak}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-xl transition-all">
                    {analyzingWeak
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing with AI...</>
                      : <><Brain className="w-4 h-4" /> {weakAnalyzed ? "Re-analyze Weak Areas" : "Analyze with AI"}</>
                    }
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
