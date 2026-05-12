import { useState, useEffect, useRef } from "react";
import {
  Camera, Save, Check, Loader2, Globe, EyeOff, ArrowLeft,
  Settings, User, UserX, ShieldOff,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from "../contexts/AuthContext";
import Navbar from "../components/Navbar";
import {
  subscribeToSocialUser,
  updateSocialProfile,
  getBlockedUsers,
  unblockUser,
  type SocialUser,
} from "../lib/firestore";
import BlueTick from "../components/BlueTick";
import { storage } from "../lib/firebase";

const GRADIENTS = [
  "from-violet-500 to-purple-600",
  "from-blue-500 to-indigo-600",
  "from-rose-500 to-pink-600",
  "from-amber-500 to-orange-600",
  "from-teal-500 to-cyan-600",
  "from-green-500 to-emerald-600",
  "from-fuchsia-500 to-pink-600",
  "from-sky-500 to-blue-600",
];

function getGradient(uid: string) {
  const idx = Math.abs(uid.split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % GRADIENTS.length;
  return GRADIENTS[idx];
}

function getInitials(name: string) {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "?";
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
      <span className="text-green-600 dark:text-green-400">{icon}</span>
      {title}
    </h2>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [socialUser, setSocialUser] = useState<SocialUser | null>(null);
  const [loading, setLoading] = useState(true);

  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [twitter, setTwitter] = useState("");
  const [reddit, setReddit] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [blockedList, setBlockedList] = useState<SocialUser[]>([]);
  const [loadingBlocked, setLoadingBlocked] = useState(false);
  const [unblockingUid, setUnblockingUid] = useState<string | null>(null);

  // Load blocked users list whenever blocked UIDs change
  useEffect(() => {
    if (!user?.uid) return;
    setLoadingBlocked(true);
    getBlockedUsers(user.uid)
      .then(setBlockedList)
      .catch(console.error)
      .finally(() => setLoadingBlocked(false));
  }, [user?.uid, socialUser?.blockedUsers?.length]);

  const handleUnblockUser = async (targetUid: string) => {
    if (!user?.uid) return;
    setUnblockingUid(targetUid);
    try {
      await unblockUser(user.uid, targetUid);
      setBlockedList(prev => prev.filter(u => u.uid !== targetUid));
    } catch (e) {
      console.error(e);
    } finally {
      setUnblockingUid(null);
    }
  };

  useEffect(() => {
    if (!user?.uid) return;
    return subscribeToSocialUser(user.uid, (su) => {
      setSocialUser(su);
      if (su) {
        setBio(su.bio || "");
        setWebsite(su.socialLinks?.website || "");
        setInstagram(su.socialLinks?.instagram || "");
        setFacebook(su.socialLinks?.facebook || "");
        setTwitter(su.socialLinks?.twitter || "");
        setReddit(su.socialLinks?.reddit || "");
        setIsAnonymous(su.isAnonymous || false);
      }
      setLoading(false);
    });
  }, [user?.uid]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError("Photo must be under 5 MB."); return; }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setError("");
  };

  const handleSave = async () => {
    if (!user?.uid) return;
    setSaving(true);
    setSaved(false);
    setError("");

    try {
      let photoURL: string | null | undefined = undefined;

      if (photoFile) {
        setUploadingPhoto(true);
        const ext = photoFile.name.split(".").pop() || "jpg";
        const fileRef = storageRef(storage, `profilePhotos/${user.uid}.${ext}`);
        await uploadBytes(fileRef, photoFile);
        photoURL = await getDownloadURL(fileRef);
        setUploadingPhoto(false);
        setPhotoFile(null);
        setPhotoPreview(null);
      }

      await updateSocialProfile(user.uid, {
        bio: bio.slice(0, 120),
        ...(photoURL !== undefined && { photoURL }),
        socialLinks: {
          website: website.trim(),
          instagram: instagram.trim().replace(/^@/, ""),
          facebook: facebook.trim(),
          twitter: twitter.trim().replace(/^@/, ""),
          reddit: reddit.trim().replace(/^u\//, ""),
        },
        isAnonymous,
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error(e);
      setError("Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
      setUploadingPhoto(false);
    }
  };

  const currentPhoto = photoPreview || socialUser?.photoURL;
  const gradient = user?.uid ? getGradient(user.uid) : "from-green-500 to-emerald-600";

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-green-200 border-t-green-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <div className="pt-14">
        <div className="max-w-2xl mx-auto px-4 py-8">

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
              <Settings className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900 dark:text-white">Settings</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Manage your profile and privacy</p>
            </div>
          </div>

          <div className="space-y-5">

            {/* ── Profile Photo ── */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
              <SectionHeader icon={<Camera className="w-4 h-4" />} title="Profile Photo" />
              <div className="flex items-center gap-5">
                <div className="relative flex-shrink-0">
                  {currentPhoto ? (
                    <img
                      src={currentPhoto}
                      alt="Profile"
                      className="w-20 h-20 rounded-full object-cover ring-4 ring-gray-100 dark:ring-gray-800"
                    />
                  ) : (
                    <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center ring-4 ring-gray-100 dark:ring-gray-800`}>
                      <span className="text-white text-2xl font-bold">
                        {getInitials(socialUser?.displayName || user?.displayName || "?")}
                      </span>
                    </div>
                  )}
                  {uploadingPhoto && (
                    <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                    </div>
                  )}
                </div>
                <div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={saving}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors mb-2"
                  >
                    <Camera className="w-4 h-4" /> Change Photo
                  </button>
                  <p className="text-xs text-gray-500 dark:text-gray-400">JPG, PNG or GIF — max 5 MB</p>
                  {photoPreview && (
                    <button
                      onClick={() => { setPhotoPreview(null); setPhotoFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                      className="text-xs text-red-500 dark:text-red-400 hover:underline mt-1 block"
                    >
                      Cancel change
                    </button>
                  )}
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />
            </div>

            {/* ── Bio ── */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
              <SectionHeader icon={<User className="w-4 h-4" />} title="Bio" />
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value.slice(0, 120))}
                placeholder="Write something about yourself… (Hindi ya English mein)"
                rows={3}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-green-400 dark:focus:border-green-600 resize-none transition-colors"
              />
              <div className="flex items-center justify-between mt-1.5">
                <p className="text-xs text-gray-400 dark:text-gray-500">Shown on your public profile</p>
                <span className={`text-xs font-medium ${bio.length >= 100 ? "text-amber-500" : "text-gray-400 dark:text-gray-500"}`}>
                  {bio.length}/120
                </span>
              </div>
            </div>

            {/* ── Links in Bio ── */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
              <SectionHeader icon={<Globe className="w-4 h-4" />} title="Website / Link" />
              <div className="flex items-center gap-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 focus-within:border-green-400 dark:focus-within:border-green-600 transition-colors">
                <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input
                  type="url"
                  value={website}
                  onChange={e => setWebsite(e.target.value)}
                  placeholder="https://your-website.com"
                  className="flex-1 text-sm bg-transparent outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">A website or personal link visible on your profile</p>
            </div>

            {/* ── Social Links ── */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
              <SectionHeader icon={
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                </svg>
              } title="Social Links" />

              <div className="space-y-3">
                {([
                  {
                    label: "Instagram",
                    value: instagram,
                    setter: setInstagram,
                    color: "text-pink-500",
                    prefix: "@",
                    placeholder: "yourhandle",
                    hint: "instagram.com/@yourhandle",
                  },
                  {
                    label: "Facebook",
                    value: facebook,
                    setter: setFacebook,
                    color: "text-blue-600",
                    prefix: "fb/",
                    placeholder: "yourprofile",
                    hint: "facebook.com/yourprofile",
                  },
                  {
                    label: "Twitter / X",
                    value: twitter,
                    setter: setTwitter,
                    color: "text-sky-500",
                    prefix: "@",
                    placeholder: "yourhandle",
                    hint: "x.com/@yourhandle",
                  },
                  {
                    label: "Reddit",
                    value: reddit,
                    setter: setReddit,
                    color: "text-orange-500",
                    prefix: "u/",
                    placeholder: "yourprofile",
                    hint: "reddit.com/u/yourprofile",
                  },
                ] as const).map(({ label, value, setter, color, prefix, placeholder }) => (
                  <div
                    key={label}
                    className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 focus-within:border-green-400 dark:focus-within:border-green-600 transition-colors"
                  >
                    <span className={`text-xs font-bold w-[88px] flex-shrink-0 ${color}`}>{label}</span>
                    <span className={`text-xs font-mono ${color} flex-shrink-0 opacity-60`}>{prefix}</span>
                    <input
                      type="text"
                      value={value}
                      onChange={e => setter(e.target.value)}
                      placeholder={placeholder}
                      className="flex-1 text-sm bg-transparent outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                    />
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">Enter just your handle or username — no need for the full URL</p>
            </div>

            {/* ── Privacy / Anonymous Mode ── */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
              <SectionHeader icon={<EyeOff className="w-4 h-4" />} title="Privacy" />

              <div className="flex items-start gap-4">
                <button
                  onClick={() => setIsAnonymous(v => !v)}
                  className={`relative flex-shrink-0 mt-0.5 w-11 h-6 rounded-full transition-colors duration-200 ${
                    isAnonymous ? "bg-green-600" : "bg-gray-200 dark:bg-gray-700"
                  }`}
                  role="switch"
                  aria-checked={isAnonymous}
                >
                  <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                    isAnonymous ? "translate-x-5" : "translate-x-0"
                  }`} />
                </button>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Anonymous Mode</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                    When enabled, others see <strong className="text-gray-700 dark:text-gray-300">"Anonymous"</strong> instead of your name
                    and you won't appear in search results. You can still use everything normally —
                    discussions, chat, badges, and friends.
                  </p>
                  {isAnonymous && (
                    <div className="flex items-center gap-1.5 mt-2 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30 rounded-lg px-2.5 py-1.5 w-fit">
                      <EyeOff className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                      <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">Anonymous mode is ON</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Blocked Users ── */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
              <SectionHeader icon={<UserX className="w-4 h-4" />} title="Blocked Users" />

              {loadingBlocked ? (
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading…
                </div>
              ) : blockedList.length === 0 ? (
                <div className="flex items-center gap-3 py-2">
                  <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center flex-shrink-0">
                    <ShieldOff className="w-4 h-4 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-400 dark:text-gray-500">No blocked users. You can block someone from their profile.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {blockedList.map(blocked => (
                    <div key={blocked.uid} className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2.5">
                      {blocked.photoURL ? (
                        <img src={blocked.photoURL} alt={blocked.displayName} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-white">
                            {(blocked.displayName || "?")[0].toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{blocked.displayName}</p>
                          {blocked.username && <BlueTick size={12} />}
                        </div>
                        <p className="text-xs text-gray-400 dark:text-gray-500">@{blocked.username}</p>
                      </div>
                      <button
                        onClick={() => handleUnblockUser(blocked.uid)}
                        disabled={unblockingUid === blocked.uid}
                        className="flex-shrink-0 text-xs font-semibold text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 border border-red-100 dark:border-red-800/30 px-2.5 py-1.5 rounded-xl transition-colors disabled:opacity-50"
                      >
                        {unblockingUid === blocked.uid ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Unblock"}
                      </button>
                    </div>
                  ))}
                  <p className="text-xs text-gray-400 dark:text-gray-600 mt-2">
                    Blocked users cannot interact with you or see your content.
                  </p>
                </div>
              )}
            </div>

            {/* ── Error ── */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800/30 rounded-xl px-4 py-3 text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            {/* ── Save Button ── */}
            <button
              onClick={handleSave}
              disabled={saving}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold transition-all shadow-sm ${
                saved
                  ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800/30"
                  : "bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white"
              }`}
            >
              {saving ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> {uploadingPhoto ? "Uploading photo…" : "Saving…"}</>
              ) : saved ? (
                <><Check className="w-4 h-4" /> Settings saved!</>
              ) : (
                <><Save className="w-4 h-4" /> Save Settings</>
              )}
            </button>

            <div className="text-center pb-4">
              <Link to="/profile" className="text-xs text-green-600 dark:text-green-400 hover:underline">
                View your full profile →
              </Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
