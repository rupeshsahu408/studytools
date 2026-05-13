import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft, Flame, Trophy, BookOpen, Users, UserPlus, UserCheck,
  UserMinus, Loader2, MapPin, GraduationCap, Clock, UserX, EyeOff,
} from "lucide-react";

// ─── Social Media Brand Icons ─────────────────────────────────────────────────

function IconInstagram({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  );
}

function IconTwitterX({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.736-8.84L1.254 2.25H8.08l4.259 5.63 5.905-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

function IconReddit({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
    </svg>
  );
}

function IconFacebook({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

function IconGlobe({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  );
}
import { useAuth } from "../contexts/AuthContext";
import { useProgress, ALL_BADGES } from "../contexts/ProgressContext";
import TopHeader from "../components/TopHeader";
import BottomNav from "../components/BottomNav";
import {
  getUserByUsername, subscribeToSocialUser,
  sendFriendRequest, cancelFriendRequest,
  acceptFriendRequest, declineFriendRequest,
  removeFriend, blockUser, unblockUser,
  type SocialUser,
} from "../lib/firestore";
import BlueTick from "../components/BlueTick";

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
  const [blockLoading, setBlockLoading] = useState(false);

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

  const iBlockedThem = !!(myData?.blockedUsers?.includes(profile?.uid || ""));
  // If the profile user has blocked the viewer, treat as "not found" (Instagram behaviour)
  const theyBlockedMe = !!(
    !isViewingSelf &&
    user?.uid &&
    profile?.blockedUsers?.includes(user.uid)
  );

  const handleBlock = async () => {
    if (!user || !profile || blockLoading) return;
    if (!confirm(`Block @${profile.username}? They won't be able to interact with you.`)) return;
    setBlockLoading(true);
    try { await blockUser(user.uid, profile.uid); }
    catch (e) { console.error(e); }
    finally { setBlockLoading(false); }
  };

  const handleUnblock = async () => {
    if (!user || !profile || blockLoading) return;
    setBlockLoading(true);
    try { await unblockUser(user.uid, profile.uid); }
    catch (e) { console.error(e); }
    finally { setBlockLoading(false); }
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
        <TopHeader showBack backTo="/dashboard" backLabel="Dashboard" />
        <div className="pt-12 pb-20 flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
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

  // If the profile user blocked the viewer → show "not found" (invisible, Instagram-style)
  // The blocked user must never know they've been blocked — they just can't find the person
  if (theyBlockedMe) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <TopHeader showBack backTo="/dashboard" backLabel="Dashboard" />
        <div className="pt-12 pb-20 flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
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

  // If current user has blocked this profile, show a restricted view
  if (iBlockedThem && !isViewingSelf) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <TopHeader showBack backTo="/dashboard" backLabel="Dashboard" />
        <div className="pt-12 pb-20 flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
            <UserX className="w-10 h-10 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">User Blocked</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-xs">You've blocked @{profile.username}. Unblock to view their profile.</p>
          <div className="flex gap-3">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 dark:text-gray-400 font-medium hover:underline text-sm">
              <ArrowLeft className="w-4 h-4" /> Go back
            </button>
            <button
              onClick={handleUnblock}
              disabled={blockLoading}
              className="flex items-center gap-2 text-sm font-bold bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white px-4 py-2 rounded-xl transition-colors"
            >
              {blockLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Unblock @{profile.username}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <TopHeader showBack backTo="/dashboard" backLabel="Dashboard" />

      <div className="pt-12 pb-20">
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
              {!isViewingSelf && (
                <button
                  onClick={iBlockedThem ? handleUnblock : handleBlock}
                  disabled={blockLoading}
                  title={iBlockedThem ? "Unblock user" : "Block user"}
                  className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border transition-colors disabled:opacity-60 ${
                    iBlockedThem
                      ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/40 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30"
                      : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-800/40"
                  }`}
                >
                  {blockLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                      <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                    </svg>
                  )}
                  {iBlockedThem ? "Unblock" : "Block"}
                </button>
              )}
            </div>
          </div>

          {/* Profile Info */}
          <div className="mb-5">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-black text-gray-900 dark:text-white">{displayName}</h1>
              {!isAnonymousProfile && profile.username && <BlueTick size={20} />}
              {isAnonymousProfile && (
                <span className="flex items-center gap-1 text-xs font-medium text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                  <EyeOff className="w-3 h-3" /> Anonymous
                </span>
              )}
            </div>

            {!isAnonymousProfile && (
              <div className="flex items-center gap-3 flex-wrap mt-0.5">
                <p className="text-green-600 dark:text-green-400 font-medium text-sm">@{profile.username}</p>
                {(profile.coins ?? 0) > 0 && (
                  <span className="flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full border border-amber-100 dark:border-amber-800/30">
                    🪙 {profile.coins} Topper Coins
                  </span>
                )}
              </div>
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
                    {profile.socialLinks.instagram && (
                      <a
                        href={`https://instagram.com/${profile.socialLinks.instagram}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`Instagram: @${profile.socialLinks.instagram}`}
                        className="flex items-center gap-1.5 text-xs font-semibold text-white bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 px-2.5 py-1 rounded-full hover:opacity-90 transition-opacity"
                      >
                        <IconInstagram className="w-3 h-3" />
                        @{profile.socialLinks.instagram}
                      </a>
                    )}
                    {profile.socialLinks.twitter && (
                      <a
                        href={`https://x.com/${profile.socialLinks.twitter}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`X / Twitter: @${profile.socialLinks.twitter}`}
                        className="flex items-center gap-1.5 text-xs font-semibold text-white bg-gray-900 dark:bg-gray-100 dark:text-gray-900 px-2.5 py-1 rounded-full hover:opacity-90 transition-opacity"
                      >
                        <IconTwitterX className="w-3 h-3" />
                        @{profile.socialLinks.twitter}
                      </a>
                    )}
                    {profile.socialLinks.reddit && (
                      <a
                        href={`https://reddit.com/u/${profile.socialLinks.reddit}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`Reddit: u/${profile.socialLinks.reddit}`}
                        className="flex items-center gap-1.5 text-xs font-semibold text-white bg-orange-500 px-2.5 py-1 rounded-full hover:opacity-90 transition-opacity"
                      >
                        <IconReddit className="w-3 h-3" />
                        u/{profile.socialLinks.reddit}
                      </a>
                    )}
                    {profile.socialLinks.facebook && (
                      <a
                        href={`https://facebook.com/${profile.socialLinks.facebook}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`Facebook: ${profile.socialLinks.facebook}`}
                        className="flex items-center gap-1.5 text-xs font-semibold text-white bg-blue-600 px-2.5 py-1 rounded-full hover:opacity-90 transition-opacity"
                      >
                        <IconFacebook className="w-3 h-3" />
                        {profile.socialLinks.facebook}
                      </a>
                    )}
                    {profile.socialLinks.website && (
                      <a
                        href={profile.socialLinks.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Website"
                        className="flex items-center gap-1.5 text-xs font-semibold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/40 px-2.5 py-1 rounded-full hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                      >
                        <IconGlobe className="w-3 h-3" />
                        Website
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
      <BottomNav />
    </div>
  );
}
