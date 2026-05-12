import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  AtSign, Camera, Check, X, Loader2, Sparkles, ArrowRight, User, Lock, AlertCircle,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { storage } from "../lib/firebase";
import { checkUsernameAvailable, setupUserProfile } from "../lib/firestore";

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

function GradientAvatar({
  gradient, initials, size = "lg",
}: { gradient: string; initials: string; size?: "lg" | "xl" }) {
  const sz = size === "xl" ? "w-24 h-24 text-3xl" : "w-16 h-16 text-xl";
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
      <span className="text-white font-bold">{initials}</span>
    </div>
  );
}

const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;

type UsernameState = "idle" | "checking" | "available" | "taken" | "invalid" | "check_error";

export default function UsernameSetupPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

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

  const displayName = user?.displayName || "Student";
  const initials = getInitials(displayName);

  useEffect(() => {
    const idx = Math.abs(
      (user?.uid || "").split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)
    ) % AVATAR_GRADIENTS.length;
    setSelectedGradient(AVATAR_GRADIENTS[idx]);
  }, [user?.uid]);

  const handleUsernameChange = useCallback((value: string) => {
    const cleaned = value.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 20);
    setUsername(cleaned);
    setError("");

    if (checkTimer.current) clearTimeout(checkTimer.current);

    if (!cleaned) { setUsernameState("idle"); return; }
    if (!USERNAME_REGEX.test(cleaned)) {
      setUsernameState("invalid");
      return;
    }

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

  const handleSubmit = async () => {
    if (!canSubmit || !user) return;
    setSubmitting(true);
    setError("");
    try {
      let photoURL: string | null = null;
      if (photoFile) {
        const ext = photoFile.name.split(".").pop() || "jpg";
        const pathRef = storageRef(storage, `profilePhotos/${user.uid}.${ext}`);
        await uploadBytes(pathRef, photoFile);
        photoURL = await getDownloadURL(pathRef);
      }
      await setupUserProfile(user.uid, { username, bio, photoURL });
      navigate("/dashboard", { replace: true });
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

  const canSubmit =
    (usernameState === "available" || usernameState === "check_error") &&
    !submitting &&
    USERNAME_REGEX.test(username);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-9 h-9 bg-green-600 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900 dark:text-white">Topper 2.0</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white leading-tight">
            Set up your profile
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
            Namaste {displayName.split(" ")[0]}! Choose a username to get started.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm space-y-6">

          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              {photoPreview ? (
                <div className="relative">
                  <img
                    src={photoPreview}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover shadow-lg ring-4 ring-white dark:ring-gray-800"
                  />
                  <button
                    onClick={handleRemovePhoto}
                    className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-md transition-colors"
                  >
                    <X className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
              ) : (
                <GradientAvatar gradient={selectedGradient} initials={initials} size="xl" />
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-7 h-7 bg-green-600 hover:bg-green-700 rounded-full flex items-center justify-center shadow-md transition-colors"
                title="Upload photo"
              >
                <Camera className="w-3.5 h-3.5 text-white" />
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
            />

            {!photoPreview && (
              <div className="flex gap-2 flex-wrap justify-center">
                {AVATAR_GRADIENTS.map((g) => (
                  <button
                    key={g}
                    onClick={() => setSelectedGradient(g)}
                    className={`w-6 h-6 rounded-full bg-gradient-to-br ${g} transition-all ${
                      selectedGradient === g
                        ? "ring-2 ring-offset-2 ring-green-500 scale-110"
                        : "opacity-60 hover:opacity-100"
                    }`}
                    title="Pick colour"
                  />
                ))}
              </div>
            )}

            <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
              Upload a photo or choose a colour — or skip, we'll use the colour.
            </p>
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
                type="text"
                value={username}
                onChange={e => handleUsernameChange(e.target.value)}
                placeholder="yourname"
                maxLength={20}
                className="flex-1 bg-transparent outline-none text-sm text-gray-900 dark:text-white placeholder-gray-400"
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                autoFocus
              />
              <div className="flex-shrink-0 w-5 flex items-center justify-center">
                {usernameState === "checking" && <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />}
                {usernameState === "available" && <Check className="w-4 h-4 text-green-500" />}
                {(usernameState === "taken" || usernameState === "invalid") && <X className="w-4 h-4 text-red-500" />}
                {usernameState === "check_error" && <AlertCircle className="w-4 h-4 text-amber-500" />}
              </div>
            </div>
            <div className="mt-1.5 min-h-[1rem]">
              {usernameState === "available" && (
                <p className="text-xs text-green-600 dark:text-green-400 font-medium">@{username} is available!</p>
              )}
              {usernameState === "taken" && (
                <p className="text-xs text-red-500 font-medium">Username is already taken. Try another.</p>
              )}
              {usernameState === "invalid" && (
                <p className="text-xs text-red-500">3–20 chars, letters, numbers, underscore only.</p>
              )}
              {usernameState === "check_error" && (
                <p className="text-xs text-amber-600 dark:text-amber-400">Couldn't verify availability — you can still continue and we'll confirm on submit.</p>
              )}
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
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Bio
              </label>
              <span className="text-xs text-gray-400 dark:text-gray-500">Optional · {bio.length}/120</span>
            </div>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value.slice(0, 120))}
              placeholder="Class 12 student from Patna. Physics lover. Aiming 90%+"
              rows={2}
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:border-green-400 dark:focus:border-green-600 resize-none transition-colors"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl px-4 py-3 text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {/* CTA */}
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-2xl transition-colors text-base"
          >
            {submitting ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Setting up…</>
            ) : (
              <><User className="w-5 h-5" /> Complete Setup <ArrowRight className="w-4 h-4" /></>
            )}
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
