import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft, Flame, Trophy, BookOpen, Users, UserPlus, UserCheck,
  UserMinus, Loader2, MapPin, GraduationCap, Clock, UserX, EyeOff,
  Globe,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useProgress, ALL_BADGES } from "../contexts/ProgressContext";
import Navbar from "../components/Navbar";
import {
  getUserByUsername, subscribeToSocialUser,
  sendFriendRequest, cancelFriendRequest,
  acceptFriendRequest, declineFriendRequest,
  removeFriend,
  type SocialUser,
} from "../lib/firestore";

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

function getAvatarGradient(uid: string): string {
  const idx = Math.abs(
    uid.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)
  ) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[idx];
}

function getInitials(name: string): string {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "?";
}

function ProfileAvatar({ user, size = "lg", anon = false }: { user: SocialUser; size?: "lg" | "xl"; anon?: boolean }) {
  const sz = size === "xl" ? "w-28 h-28 text-4xl" : "w-20 h-20 text-2xl";
  if (anon) {
    return (
      <div className={`${sz} rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center shadow-xl ring-4 ring-white dark:ring-gray-900`}>
        <EyeOff className="text-white w-8 h-8" />
      </div>
    );
  }
  if (user.photoURL) {
    return (
      <img
        src={user.photoURL}
        alt={user.displayName}
        className={`${sz} rounded-full object-cover shadow-xl ring-4 ring-white dark:ring-gray-900`}
      />
    );
  }
  const gradient = getAvatarGradient(user.uid);
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center shadow-xl ring-4 ring-white dark:ring-gray-900`}>
      <span className="text-white font-bold">{getInitials(user.displayName)}</span>
    </div>
  );
}

type FriendStatus = "none" | "sent" | "received" | "friends" | "self";

export default function PublicProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const { userData } = useProgress();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<SocialUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [myData, setMyData] = useState<SocialUser | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!username) return;
    getUserByUsername(username).then(p => {
      if (!p) { setNotFound(true); setLoading(false); return; }
      setProfile(p);
      setLoading(false);
    });
  }, [username]);

  useEffect(() => {
    if (!profile?.uid) return;
    return subscribeToSocialUser(profile.uid, (updated) => {
      if (updated) setProfile(updated);
    });
  }, [profile?.uid]);

  useEffect(() => {
    if (!user?.uid) return;
    return subscribeToSocialUser(user.uid, setMyData);
  }, [user?.uid]);

  const getFriendStatus = (): FriendStatus => {
    if (!user || !profile) return "none";
    if (profile.uid === user.uid) return "self";
    if (myData?.friends.includes(profile.uid)) return "friends";
    if (myData?.friendRequestsSent.includes(profile.uid)) return "sent";
    if (myData?.friendRequestsReceived.includes(profile.uid)) return "received";
    return "none";
  };

  const friendStatus = getFriendStatus();
  const isViewingSelf = friendStatus === "self";
  const isAnonymousProfile = profile?.isAnonymous && !isViewingSelf;

  const handleFriendAction = async () => {
    if (!user || !profile || actionLoading) return;
    setActionLoading(true);
    try {
      if (friendStatus === "none") {
        await sendFriendRequest(user.uid, profile.uid);
      } else if (friendStatus === "sent") {
        await cancelFriendRequest(user.uid, profile.uid);
      } else if (friendStatus === "received") {
        await acceptFriendRequest(user.uid, profile.uid);
      } else if (friendStatus === "friends") {
        if (confirm(`Remove ${isAnonymousProfile ? "Anonymous" : profile.displayName} from friends?`)) {
          await removeFriend(user.uid, profile.uid);
        }
      }
    } catch (e) { console.error(e); }
    finally { setActionLoading(false); }
  };

  const handleDecline = async () => {
    if (!user || !profile || actionLoading) return;
    setActionLoading(true);
    try { await declineFriendRequest(user.uid, profile.uid); }
    catch (e) { console.error(e); }
    finally { setActionLoading(false); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-green-200 border-t-green-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Navbar />
        <div className="pt-14 flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
            <UserX className="w-10 h-10 text-gray-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">User not found</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">@{username} doesn't exist or may have changed their username.</p>
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-green-600 dark:text-green-400 font-medium hover:underline">
            <ArrowLeft className="w-4 h-4" /> Go back
          </button>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const gradient = getAvatarGradient(profile.uid);
  const totalFriends = profile.friends.length;

  const displayName = isAnonymousProfile ? "Anonymous" : profile.displayName;
  const displayBio = isAnonymousProfile ? null : profile.bio;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />

      <div className="pt-14">
        {/* Banner */}
        <div className={`h-32 ${isAnonymousProfile ? "bg-gradient-to-br from-gray-400 to-gray-600 opacity-60" : `bg-gradient-to-br ${gradient} opacity-80`}`} />

        <div className="max-w-2xl mx-auto px-4">
          {/* Avatar + Actions Row */}
          <div className="flex items-end justify-between -mt-14 mb-4">
            <div className="relative">
              <ProfileAvatar user={profile} size="xl" anon={isAnonymousProfile} />
            </div>

            <div className="flex items-center gap-2 pb-2">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 px-3 py-2 rounded-xl transition-colors font-medium"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>

              {friendStatus !== "self" && (
                <div className="flex gap-2">
                  {friendStatus === "received" && (
                    <>
                      <button
                        onClick={handleFriendAction}
                        disabled={actionLoading}
                        className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors"
                      >
                        {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                        Accept
                      </button>
                      <button
                        onClick={handleDecline}
                        disabled={actionLoading}
                        className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 text-sm font-bold px-4 py-2 rounded-xl transition-colors"
                      >
                        Decline
                      </button>
                    </>
                  )}
                  {friendStatus !== "received" && (
                    <button
                      onClick={handleFriendAction}
                      disabled={actionLoading}
                      className={`flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-xl transition-colors disabled:opacity-50 ${
                        friendStatus === "friends"
                          ? "bg-gray-100 dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400"
                          : friendStatus === "sent"
                          ? "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                          : "bg-green-600 hover:bg-green-700 text-white"
                      }`}
                    >
                      {actionLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : friendStatus === "friends" ? (
                        <UserMinus className="w-4 h-4" />
                      ) : friendStatus === "sent" ? (
                        <Clock className="w-4 h-4" />
                      ) : (
                        <UserPlus className="w-4 h-4" />
                      )}
                      {friendStatus === "friends" ? "Friends"
                       : friendStatus === "sent" ? "Request Sent"
                       : "Add Friend"}
                    </button>
                  )}
                </div>
              )}
              {isViewingSelf && (
                <Link
                  to="/settings"
                  className="text-sm font-bold bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-xl transition-colors"
                >
                  Edit Profile
                </Link>
              )}
            </div>
          </div>

          {/* Profile Info */}
          <div className="mb-5">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-gray-900 dark:text-white">{displayName}</h1>
              {isAnonymousProfile && (
                <span className="flex items-center gap-1 text-xs font-medium text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                  <EyeOff className="w-3 h-3" /> Anonymous
                </span>
              )}
            </div>

            {!isAnonymousProfile && (
              <p className="text-green-600 dark:text-green-400 font-medium text-sm">@{profile.username}</p>
            )}

            {isAnonymousProfile ? (
              <div className="mt-3 flex items-start gap-2 bg-gray-100 dark:bg-gray-800 rounded-xl px-3 py-2.5">
                <EyeOff className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-500 dark:text-gray-400">This user has enabled anonymous mode. Their identity is hidden.</p>
              </div>
            ) : (
              <>
                {displayBio && (
                  <p className="text-gray-600 dark:text-gray-400 text-sm mt-2 leading-relaxed">{displayBio}</p>
                )}

                {/* Social Links */}
                {profile.socialLinks && Object.values(profile.socialLinks).some(v => v) && (
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    {profile.socialLinks.website && (
                      <a href={profile.socialLinks.website} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 hover:underline">
                        <Globe className="w-3.5 h-3.5" /> Website
                      </a>
                    )}
                    {profile.socialLinks.instagram && (
                      <a href={`https://instagram.com/${profile.socialLinks.instagram}`} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-pink-500 hover:underline font-medium">
                        @{profile.socialLinks.instagram}
                      </a>
                    )}
                    {profile.socialLinks.twitter && (
                      <a href={`https://x.com/${profile.socialLinks.twitter}`} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-sky-500 hover:underline font-medium">
                        @{profile.socialLinks.twitter}
                      </a>
                    )}
                    {profile.socialLinks.reddit && (
                      <a href={`https://reddit.com/u/${profile.socialLinks.reddit}`} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-orange-500 hover:underline font-medium">
                        u/{profile.socialLinks.reddit}
                      </a>
                    )}
                    {profile.socialLinks.facebook && (
                      <a href={`https://facebook.com/${profile.socialLinks.facebook}`} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline font-medium">
                        fb/{profile.socialLinks.facebook}
                      </a>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-gray-500 dark:text-gray-400">
                  {profile.class && (
                    <div className="flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5" />
                      Class {profile.class}
                    </div>
                  )}
                  {profile.district && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {profile.district}, Bihar
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {totalFriends} {totalFriends === 1 ? "friend" : "friends"}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Stats Strip — hidden for anonymous (when not self) */}
          {!isAnonymousProfile && (
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { icon: <Flame className="w-5 h-5 text-orange-500" />, value: profile.streak || 0, label: "Day Streak" },
                { icon: <BookOpen className="w-5 h-5 text-blue-500" />, value: profile.badges?.length || 0, label: "Badges" },
                { icon: <Trophy className="w-5 h-5 text-yellow-500" />, value: totalFriends, label: "Friends" },
              ].map(({ icon, value, label }) => (
                <div
                  key={label}
                  className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 text-center"
                >
                  <div className="flex justify-center mb-1">{icon}</div>
                  <div className="text-xl font-black text-gray-900 dark:text-white">{value}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">{label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Badges — hidden for anonymous */}
          {!isAnonymousProfile && (profile.badges?.length || 0) > 0 && (
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 mb-5">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-500" /> Badges Earned
              </h3>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                {ALL_BADGES.map(badge => {
                  const earned = (profile.badges || []).includes(badge.id);
                  if (!earned) return null;
                  return (
                    <div
                      key={badge.id}
                      className="flex flex-col items-center text-center p-2.5 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-800/30 rounded-xl"
                      title={`${badge.title}: ${badge.desc}`}
                    >
                      <span className="text-2xl mb-1">{badge.icon}</span>
                      <span className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 leading-tight">{badge.title}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Role badge */}
          {!isAnonymousProfile && profile.role === "teacher" && (
            <div className="bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800/30 rounded-2xl p-4 mb-5 flex items-center gap-3">
              <GraduationCap className="w-5 h-5 text-purple-500" />
              <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
                This user is a Teacher on Topper 2.0
              </p>
            </div>
          )}

          <div className="h-8" />
        </div>
      </div>
    </div>
  );
}
