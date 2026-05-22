import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { compressImageToBase64 } from "../lib/imageUtils";
import {
  AtSign, Camera, Check, X, Loader2, Sparkles, ArrowRight, User, Lock,
  AlertCircle, GraduationCap, CheckCircle2, ChevronRight,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { checkUsernameAvailable, setupUserProfile } from "../lib/firestore";

// ─── Avatar ───────────────────────────────────────────────────────────────────

const AVATAR_GRADIENTS = [
  "from-violet-500 to-purple-600",
  "from-blue-500 to-indigo-600",
  "from-rose-500 to-pink-600",
  "from-amber-500 to-orange-600",
  "from-teal-500 to-cyan-600",
  "from-green-500 to-emerald-600",
  "from-fuchsia-500 to-pink-600",
  "from-sky-500 to-blue-600",
];

function getInitials(name: string): string {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "?";
}

function GradientAvatar({ gradient, initials, size = "lg" }: { gradient: string; initials: string; size?: "lg" | "xl" }) {
  const sz = size === "xl" ? "w-24 h-24 text-3xl" : "w-16 h-16 text-xl";
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
      <span className="text-white font-bold">{initials}</span>
    </div>
  );
}

// ─── Board Data ───────────────────────────────────────────────────────────────

interface BoardEntry {
  id: string;
  name: string;
  short: string;
  flag: string;
}

interface BoardGroup {
  label: string;
  color: string;
  boards: BoardEntry[];
}

const BOARD_GROUPS: BoardGroup[] = [
  {
    label: "Central Boards",
    color: "text-blue-600 dark:text-blue-400",
    boards: [
      { id: "CBSE",  name: "CBSE",  short: "Central Board of Secondary Education",       flag: "🏛️" },
      { id: "ICSE",  name: "ICSE / ISC", short: "Council for the Indian School Certificate Examinations", flag: "🎓" },
      { id: "NIOS",  name: "NIOS",  short: "National Institute of Open Schooling",        flag: "📡" },
      { id: "NVS",   name: "NVS",   short: "Navodaya Vidyalaya Samiti",                   flag: "🏫" },
      { id: "KVS",   name: "KVS",   short: "Kendriya Vidyalaya Sangathan",                flag: "🔵" },
    ],
  },
  {
    label: "North & Central India",
    color: "text-orange-600 dark:text-orange-400",
    boards: [
      { id: "Bihar Board",          name: "Bihar Board",          short: "BSEB — Bihar",                    flag: "🟠" },
      { id: "UP Board",             name: "UP Board",             short: "UPMSP — Uttar Pradesh",           flag: "🟡" },
      { id: "MP Board",             name: "MP Board",             short: "MPBSE — Madhya Pradesh",          flag: "🟤" },
      { id: "Rajasthan Board",      name: "Rajasthan Board",      short: "RBSE — Rajasthan",                flag: "🏜️" },
      { id: "Haryana Board",        name: "Haryana Board",        short: "HBSE — Haryana",                  flag: "🌾" },
      { id: "Punjab Board",         name: "Punjab Board",         short: "PSEB — Punjab",                   flag: "🌊" },
      { id: "Uttarakhand Board",    name: "Uttarakhand Board",    short: "UBSE — Uttarakhand",              flag: "⛰️" },
      { id: "Jharkhand Board",      name: "Jharkhand Board",      short: "JAC — Jharkhand",                 flag: "🌿" },
      { id: "Chhattisgarh Board",   name: "Chhattisgarh Board",   short: "CGBSE — Chhattisgarh",           flag: "🌳" },
      { id: "HP Board",             name: "HP Board",             short: "HPBOSE — Himachal Pradesh",       flag: "❄️" },
      { id: "Delhi Board",          name: "Delhi Board",          short: "SCERT — Delhi",                   flag: "🏙️" },
    ],
  },
  {
    label: "South India",
    color: "text-teal-600 dark:text-teal-400",
    boards: [
      { id: "Karnataka Board",   name: "Karnataka Board",   short: "KSEEB — Karnataka",         flag: "🌺" },
      { id: "AP Board",          name: "AP Board",          short: "BSEAP — Andhra Pradesh",     flag: "🌴" },
      { id: "Telangana Board",   name: "Telangana Board",   short: "BSETS — Telangana",          flag: "💠" },
      { id: "Tamil Nadu Board",  name: "Tamil Nadu Board",  short: "TNSCERT — Tamil Nadu",       flag: "🎋" },
      { id: "Kerala Board",      name: "Kerala Board",      short: "DHSE — Kerala",              flag: "🥥" },
    ],
  },
  {
    label: "East & West India",
    color: "text-purple-600 dark:text-purple-400",
    boards: [
      { id: "West Bengal Board",  name: "West Bengal Board",  short: "WBCHSE — West Bengal",   flag: "🐯" },
      { id: "Assam Board",        name: "Assam Board",        short: "AHSEC — Assam",          flag: "🍵" },
      { id: "Odisha Board",       name: "Odisha Board",       short: "CHSE — Odisha",          flag: "🛕" },
      { id: "Gujarat Board",      name: "Gujarat Board",      short: "GSEB — Gujarat",         flag: "🦁" },
      { id: "Maharashtra Board",  name: "Maharashtra Board",  short: "MSBSHSE — Maharashtra",  flag: "🌆" },
      { id: "Goa Board",          name: "Goa Board",          short: "GBSHSE — Goa",           flag: "🌊" },
    ],
  },
  {
    label: "Other",
    color: "text-gray-500 dark:text-gray-400",
    boards: [
      { id: "Other", name: "Other / Not Listed", short: "My board isn't listed above", flag: "📋" },
    ],
  },
];

// ─── Confirmation messages — shown after board selection ──────────────────────

const CONFIRMATION_MESSAGES: Record<string, string> = {
  "CBSE":               "CBSE is our primary board — every question, note, and simulation is aligned to your curriculum.",
  "ICSE":               "ICSE/ISC students are fully supported. All NCERT-based content works perfectly for your syllabus.",
  "NIOS":               "NIOS follows the NCERT curriculum — you're in the right place. Everything here works for you.",
  "NVS":                "Navodaya students follow CBSE/NCERT — all our AI content is perfectly matched for you.",
  "KVS":                "Kendriya Vidyalaya follows CBSE — our entire platform is built around your curriculum.",
  "Bihar Board":        "BSEB follows the NCERT pattern closely — all notes, questions, and resources are suited for you.",
  "UP Board":           "UP Board's syllabus is NCERT-aligned — you'll find everything perfectly relevant here.",
  "MP Board":           "MP Board follows NCERT — all our AI-generated content is tailored for your exam pattern.",
  "Rajasthan Board":    "RBSE is NCERT-based — our notes, flashcards, and questions are all relevant for you.",
  "Haryana Board":      "HBSE follows NCERT — every resource on this platform is designed for your curriculum.",
  "Punjab Board":       "PSEB is NCERT-aligned — our AI study tools are perfectly suited for Punjab Board students.",
  "Uttarakhand Board":  "Uttarakhand Board follows NCERT — you'll get full value from every feature here.",
  "Jharkhand Board":    "JAC follows NCERT pattern — all our content matches your board's exam requirements.",
  "Chhattisgarh Board": "CGBSE is NCERT-aligned — our study tools are designed to help you score higher.",
  "HP Board":           "HP Board follows NCERT — our AI-powered tools will prepare you thoroughly for your exams.",
  "Delhi Board":        "Delhi SCERT is closely aligned with NCERT — our platform is perfectly suited for you.",
  "Karnataka Board":    "Karnataka Board follows NCERT — our AI notes and questions are designed for your exams.",
  "AP Board":           "AP Board is NCERT-based — all features are fully relevant to your syllabus.",
  "Telangana Board":    "Telangana Board follows NCERT — our resources are perfectly aligned for your board exams.",
  "Tamil Nadu Board":   "Tamil Nadu Board uses NCERT — our AI tools will help you prepare thoroughly.",
  "Kerala Board":       "Kerala Board follows NCERT — our platform is fully suited for your curriculum.",
  "West Bengal Board":  "WBCHSE is NCERT-aligned — all our AI study resources are relevant for you.",
  "Assam Board":        "Assam Board follows NCERT — our study tools are designed to help you excel.",
  "Odisha Board":       "Odisha CHSE follows NCERT — all our content is matched to your exam pattern.",
  "Gujarat Board":      "GSEB follows NCERT — our AI-powered notes and questions are perfect for Gujarat Board.",
  "Maharashtra Board":  "Maharashtra Board is NCERT-aligned — our tools will help you prepare thoroughly.",
  "Goa Board":          "Goa Board follows NCERT — you'll find our resources fully relevant to your exams.",
  "Other":              "No matter your board — if it follows NCERT, Topper 2.0 has everything you need.",
};

// ─── Username validation ───────────────────────────────────────────────────────

const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;
type UsernameState = "idle" | "checking" | "available" | "taken" | "invalid" | "check_error";

// ─── Main Component ───────────────────────────────────────────────────────────

export default function UsernameSetupPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Step 1 state
  const [step, setStep] = useState<1 | 2>(1);
  const [username, setUsername] = useState("");
  const [usernameState, setUsernameState] = useState<UsernameState>("idle");
  const [bio, setBio] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [selectedGradient, setSelectedGradient] = useState(AVATAR_GRADIENTS[0]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const checkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Step 2 state
  const [selectedBoard, setSelectedBoard] = useState<string | null>(null);
  const [boardAnimating, setBoardAnimating] = useState(false);
  const [showContinue, setShowContinue] = useState(false);
  const confirmRef = useRef<HTMLDivElement>(null);

  const displayName = user?.displayName || "Student";
  const firstName = displayName.split(" ")[0];
  const initials = getInitials(displayName);

  useEffect(() => {
    const idx = Math.abs(
      (user?.uid || "").split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)
    ) % AVATAR_GRADIENTS.length;
    setSelectedGradient(AVATAR_GRADIENTS[idx]);
  }, [user?.uid]);

  // ── Username check ────────────────────────────────────────────────────────

  const handleUsernameChange = useCallback((value: string) => {
    const cleaned = value.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 20);
    setUsername(cleaned);
    setError("");
    if (checkTimer.current) clearTimeout(checkTimer.current);
    if (!cleaned) { setUsernameState("idle"); return; }
    if (!USERNAME_REGEX.test(cleaned)) { setUsernameState("invalid"); return; }
    setUsernameState("checking");
    checkTimer.current = setTimeout(async () => {
      try {
        const available = await checkUsernameAvailable(cleaned);
        setUsernameState(available ? "available" : "taken");
      } catch {
        setUsernameState("check_error");
      }
    }, 500);
  }, []);

  // ── Photo ─────────────────────────────────────────────────────────────────

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError("Photo must be under 5MB."); return; }
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Step 1 Submit → go to step 2 ─────────────────────────────────────────

  const handleSubmit = async () => {
    if (!canSubmit || !user) return;
    setSubmitting(true);
    setError("");
    try {
      let photoURL: string | null = null;
      if (photoFile) {
        photoURL = await compressImageToBase64(photoFile);
      }
      await setupUserProfile(user.uid, { username, bio, photoURL });
      setStep(2);
    } catch (e: any) {
      if (e?.message === "Username is already taken.") {
        setUsernameState("taken");
        setError("This username was just taken by someone else. Please choose a different one.");
      } else {
        setError(e?.message || "Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ── Step 2 Board selection ────────────────────────────────────────────────

  const handleBoardSelect = (boardId: string) => {
    if (selectedBoard === boardId) return;
    setSelectedBoard(boardId);
    setShowContinue(false);
    setBoardAnimating(false);

    requestAnimationFrame(() => {
      setBoardAnimating(true);
      setTimeout(() => {
        setShowContinue(true);
        confirmRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 500);
    });
  };

  const handleStartLearning = () => {
    if (user && selectedBoard) {
      localStorage.setItem(`topper_board_${user.uid}`, selectedBoard);
    }
    navigate("/dashboard", { replace: true });
  };

  const handleSkipBoard = () => {
    navigate("/dashboard", { replace: true });
  };

  const canSubmit =
    (usernameState === "available" || usernameState === "check_error") &&
    !submitting &&
    USERNAME_REGEX.test(username);

  // ─── Step 1 UI ─────────────────────────────────────────────────────────────

  if (step === 1) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4">
        <div className="w-full max-w-md">

          {/* Brand */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-4">
              <img src="/logo.png" className="w-9 h-9 rounded-xl object-cover" alt="Topper 2.0" />
              <span className="text-lg font-bold text-gray-900 dark:text-white">Topper 2.0</span>
            </div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white leading-tight">
              Set up your profile
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
              Namaste {firstName}! Choose a username to get started.
            </p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 justify-center mb-6">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full bg-green-600 text-white text-xs flex items-center justify-center font-bold">1</div>
              <span className="text-xs font-semibold text-green-600 dark:text-green-400">Profile</span>
            </div>
            <div className="w-8 h-px bg-gray-200 dark:bg-gray-700" />
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-400 text-xs flex items-center justify-center font-bold">2</div>
              <span className="text-xs font-medium text-gray-400 dark:text-gray-500">Your Board</span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm space-y-6">

            {/* Avatar */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                {photoPreview ? (
                  <div className="relative">
                    <img src={photoPreview} alt="Profile" className="w-24 h-24 rounded-full object-cover shadow-lg ring-4 ring-white dark:ring-gray-800" />
                    <button onClick={handleRemovePhoto} className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-md transition-colors">
                      <X className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>
                ) : (
                  <GradientAvatar gradient={selectedGradient} initials={initials} size="xl" />
                )}
                <button onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 w-7 h-7 bg-green-600 hover:bg-green-700 rounded-full flex items-center justify-center shadow-md transition-colors" title="Upload photo">
                  <Camera className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              {!photoPreview && (
                <div className="flex gap-2 flex-wrap justify-center">
                  {AVATAR_GRADIENTS.map((g) => (
                    <button key={g} onClick={() => setSelectedGradient(g)} className={`w-6 h-6 rounded-full bg-gradient-to-br ${g} transition-all ${selectedGradient === g ? "ring-2 ring-offset-2 ring-green-500 scale-110" : "opacity-60 hover:opacity-100"}`} title="Pick colour" />
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-400 dark:text-gray-500 text-center">Upload a photo or choose a colour — or skip, we'll use the colour.</p>
            </div>

            {/* Username */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Username <span className="text-red-400">*</span>
                </label>
                <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-medium">
                  <Lock className="w-3 h-3" /> Cannot be changed later
                </span>
              </div>
              <div className={`flex items-center gap-2 bg-gray-50 dark:bg-gray-800 border rounded-xl px-3.5 py-3 transition-colors ${
                usernameState === "available" ? "border-green-400 dark:border-green-600" :
                usernameState === "taken" || usernameState === "invalid" ? "border-red-400 dark:border-red-600" :
                usernameState === "check_error" ? "border-amber-400 dark:border-amber-500" :
                "border-gray-200 dark:border-gray-700 focus-within:border-green-400 dark:focus-within:border-green-600"
              }`}>
                <AtSign className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input
                  type="text" value={username} onChange={e => handleUsernameChange(e.target.value)}
                  placeholder="yourname" maxLength={20}
                  className="flex-1 bg-transparent outline-none text-sm text-gray-900 dark:text-white placeholder-gray-400"
                  autoComplete="off" autoCapitalize="off" spellCheck={false} autoFocus
                />
                <div className="flex-shrink-0 w-5 flex items-center justify-center">
                  {usernameState === "checking" && <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />}
                  {usernameState === "available" && <Check className="w-4 h-4 text-green-500" />}
                  {(usernameState === "taken" || usernameState === "invalid") && <X className="w-4 h-4 text-red-500" />}
                  {usernameState === "check_error" && <AlertCircle className="w-4 h-4 text-amber-500" />}
                </div>
              </div>
              <div className="mt-1.5 min-h-[1rem]">
                {usernameState === "available" && <p className="text-xs text-green-600 dark:text-green-400 font-medium">@{username} is available!</p>}
                {usernameState === "taken" && <p className="text-xs text-red-500 font-medium">Username is already taken. Try another.</p>}
                {usernameState === "invalid" && <p className="text-xs text-red-500">3–20 chars, letters, numbers, underscore only.</p>}
                {usernameState === "check_error" && <p className="text-xs text-amber-600 dark:text-amber-400">Couldn't verify availability — you can still continue and we'll confirm on submit.</p>}
                {(usernameState === "idle" || usernameState === "checking") && (
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {usernameState === "checking" ? "Checking availability…" : "3–20 chars · letters, numbers, _ only"}
                  </p>
                )}
              </div>
            </div>

            {/* Bio */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Bio</label>
                <span className="text-xs text-gray-400 dark:text-gray-500">Optional · {bio.length}/120</span>
              </div>
              <textarea
                value={bio} onChange={e => setBio(e.target.value.slice(0, 120))}
                placeholder="Class 10 student. Science lover. Aiming 90%+"
                rows={2}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:border-green-400 dark:focus:border-green-600 resize-none transition-colors"
              />
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl px-4 py-3 text-sm flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> {error}
              </div>
            )}

            <button
              onClick={handleSubmit} disabled={!canSubmit}
              className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-2xl transition-colors text-base"
            >
              {submitting
                ? <><Loader2 className="w-5 h-5 animate-spin" /> Setting up…</>
                : <><User className="w-5 h-5" /> Continue <ArrowRight className="w-4 h-4" /></>
              }
            </button>

            <p className="text-center text-xs text-gray-400 dark:text-gray-500">
              You can update your bio and photo anytime from your profile.
              <br />
              <span className="text-amber-600 dark:text-amber-400 font-medium">Username cannot be changed once set.</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ─── Step 2 UI — Board Selection ───────────────────────────────────────────

  const confirmMessage = selectedBoard ? CONFIRMATION_MESSAGES[selectedBoard] ?? CONFIRMATION_MESSAGES["Other"] : "";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 px-4 py-10">
      <div className="w-full max-w-2xl mx-auto">

        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <img src="/logo.png" className="w-9 h-9 rounded-xl object-cover" alt="Topper 2.0" />
            <span className="text-lg font-bold text-gray-900 dark:text-white">Topper 2.0</span>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 justify-center mb-5">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 text-xs flex items-center justify-center">
                <Check className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-medium text-gray-400 dark:text-gray-500">Profile</span>
            </div>
            <div className="w-8 h-px bg-green-300 dark:bg-green-800" />
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full bg-green-600 text-white text-xs flex items-center justify-center font-bold">2</div>
              <span className="text-xs font-semibold text-green-600 dark:text-green-400">Your Board</span>
            </div>
          </div>

          <h1 className="text-2xl font-black text-gray-900 dark:text-white leading-tight mb-2">
            Which board are you from?
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md mx-auto">
            We support <span className="font-semibold text-green-600 dark:text-green-400">all boards that follow NCERT</span> — Hindi medium and English medium both. Select yours and we'll tailor your experience.
          </p>
        </div>

        {/* Board Groups */}
        <div className="space-y-6">
          {BOARD_GROUPS.map((group) => (
            <div key={group.label}>
              <p className={`text-xs font-bold uppercase tracking-widest mb-3 ${group.color}`}>
                {group.label}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {group.boards.map((board) => {
                  const isSelected = selectedBoard === board.id;
                  return (
                    <button
                      key={board.id}
                      onClick={() => handleBoardSelect(board.id)}
                      className={`relative text-left px-3.5 py-3 rounded-2xl border-2 transition-all duration-200 group ${
                        isSelected
                          ? "border-green-500 dark:border-green-400 bg-green-50 dark:bg-green-900/20 shadow-md scale-[1.02]"
                          : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-green-300 dark:hover:border-green-700 hover:shadow-sm"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-base leading-none">{board.flag}</span>
                            <span className={`text-sm font-bold truncate leading-tight ${isSelected ? "text-green-700 dark:text-green-300" : "text-gray-900 dark:text-white"}`}>
                              {board.name}
                            </span>
                          </div>
                          <p className={`text-[10px] leading-tight mt-0.5 ${isSelected ? "text-green-600 dark:text-green-400" : "text-gray-400 dark:text-gray-500"}`}>
                            {board.short}
                          </p>
                        </div>
                        {isSelected && (
                          <div
                            className="flex-shrink-0 w-4 h-4 rounded-full bg-green-500 dark:bg-green-400 flex items-center justify-center mt-0.5"
                            style={{ animation: "scaleIn 0.2s ease-out" }}
                          >
                            <Check className="w-2.5 h-2.5 text-white" />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Animated Confirmation Banner */}
        <div ref={confirmRef} className="mt-6">
          {selectedBoard && (
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                animation: boardAnimating ? "slideUpFade 0.4s ease-out forwards" : "none",
                opacity: 0,
              }}
            >
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-5 text-white">
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ animation: boardAnimating ? "bounceIn 0.5s ease-out 0.2s both" : "none" }}
                  >
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-base leading-snug mb-1">
                      {selectedBoard === "Other" ? "You're all set!" : `${selectedBoard} — you're in the right place! ✓`}
                    </p>
                    <p className="text-green-100 text-sm leading-relaxed">
                      {confirmMessage}
                    </p>
                  </div>
                </div>
              </div>

              {/* Support badges */}
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 border-t-0 rounded-b-2xl px-5 py-3 flex flex-wrap gap-x-4 gap-y-1.5">
                {["AI Notes", "Question Bank", "Flash Cards", "Simulations", "Doubt Chat", "Mind Maps"].map((feature) => (
                  <div key={feature} className="flex items-center gap-1 text-xs font-medium text-green-700 dark:text-green-400">
                    <Check className="w-3 h-3" /> {feature}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* CTA Buttons */}
        <div
          className="mt-5 space-y-2.5"
          style={{
            opacity: showContinue ? 1 : 0,
            transform: showContinue ? "translateY(0)" : "translateY(8px)",
            transition: "opacity 0.4s ease, transform 0.4s ease",
            pointerEvents: showContinue ? "auto" : "none",
          }}
        >
          <button
            onClick={handleStartLearning}
            className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-2xl transition-colors text-base shadow-md"
          >
            Start Learning <ChevronRight className="w-5 h-5" />
          </button>
          <p className="text-center text-xs text-gray-400 dark:text-gray-500">
            You can change your board anytime from your profile settings.
          </p>
        </div>

        {/* Skip */}
        {!showContinue && (
          <div className="mt-8 text-center">
            <button
              onClick={handleSkipBoard}
              className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors underline underline-offset-2"
            >
              Skip for now, I'll set this later
            </button>
          </div>
        )}
      </div>

      {/* ── Keyframe animations injected inline ── */}
      <style>{`
        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { transform: scale(0); opacity: 0; }
          to   { transform: scale(1); opacity: 1; }
        }
        @keyframes bounceIn {
          0%   { transform: scale(0.3); opacity: 0; }
          50%  { transform: scale(1.1); }
          70%  { transform: scale(0.95); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
