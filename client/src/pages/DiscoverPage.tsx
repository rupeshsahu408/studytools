import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Compass, Search, Loader2, UserPlus, UserCheck, UserMinus,
  Users, Clock, Bell, UserX, ChevronDown, X, MapPin, UserCheck2,
} from "lucide-react";
import BlueTick from "../components/BlueTick";
import { useAuth } from "../contexts/AuthContext";
import TopHeader from "../components/TopHeader";
import BottomNav from "../components/BottomNav";
import {
  subscribeToSocialUser,
  searchUsersByPrefix,
  getDiscoverUsers,
  getPlatformStats,
  sendFriendRequest,
  cancelFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend,
  getFriends,
  getFriendRequests,
  getSentRequests,
  getFounderFollowCount,
  hasFollowedFounder,
  followFounder,
  type SocialUser,
} from "../lib/firestore";

// ─── Founder Constants ────────────────────────────────────────────────────────

const FOUNDER_USERNAME = "rupesh_gupta";
const FOUNDER_NAME = "Rupesh Gupta";
const FOUNDER_LOCATION = "India";
const FOUNDER_BIO = "Founder of Topper 2.0 — building an AI-powered study platform for Class 11 & 12 students across all NCERT boards. My mission is to make world-class education accessible to every student preparing for their board exams. 🚀";
const FOUNDER_INSTAGRAM = "https://www.instagram.com/rupesh_gupta___/";
const FOUNDER_TWITTER = "https://x.com/rupesh__gupta_";
const FOUNDER_AVATAR = "/founder-avatar.png";

function IconInstagram({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  );
}

function IconTwitterX({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.736-8.84L1.254 2.25H8.08l4.259 5.63 5.905-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

// ─── Founder Card ─────────────────────────────────────────────────────────────

function FounderCard({ currentUid }: { currentUid: string }) {
  const [followed, setFollowed] = useState(false);
  const [followCount, setFollowCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      getFounderFollowCount(),
      currentUid ? hasFollowedFounder(currentUid) : Promise.resolve(false),
    ]).then(([count, hasFollowed]) => {
      if (!mounted) return;
      setFollowCount(count);
      setFollowed(hasFollowed);
      setLoading(false);
    }).catch(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [currentUid]);

  const handleFollow = async () => {
    if (!currentUid || following || followed) return;
    setFollowing(true);
    try {
      await followFounder(currentUid);
      setFollowed(true);
      setFollowCount(prev => prev + 1);
    } catch (e) {
      console.error("Follow error:", e);
    } finally {
      setFollowing(false);
    }
  };

  return (
    <div className="mb-5 rounded-2xl overflow-hidden shadow-lg">
      {/* Premium dark forest green gradient background */}
      <div className="bg-gradient-to-br from-[#1a2619] via-[#253D2C] to-[#1a2619] px-5 pt-5 pb-4 relative overflow-hidden">
        {/* Decorative radial glow */}
        <div className="absolute inset-0 opacity-20 pointer-events-none"
          style={{ background: "radial-gradient(circle at 80% 20%, #4CBB17 0%, transparent 60%)" }} />

        {/* Founder badge */}
        <div className="flex items-center justify-between mb-4">
          <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2.5 py-1 rounded-full">
            ★ FOUNDER
          </span>
          <span className="text-[10px] text-green-400/60 font-medium">Topper 2.0</span>
        </div>

        {/* Avatar + Info row */}
        <div className="flex items-start gap-4">
          {/* Avatar with gold ring */}
          <Link to={`/u/${FOUNDER_USERNAME}`} className="flex-shrink-0">
            <div className="relative">
              <div className="w-16 h-16 rounded-full ring-2 ring-amber-400 ring-offset-2 ring-offset-[#1a2619] overflow-hidden shadow-xl">
                <img
                  src={FOUNDER_AVATAR}
                  alt={FOUNDER_NAME}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
              {/* Crown badge */}
              <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center shadow-md text-[10px]">
                👑
              </div>
            </div>
          </Link>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <Link to={`/u/${FOUNDER_USERNAME}`} className="block">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-base font-black text-white leading-tight">{FOUNDER_NAME}</span>
                <span className="w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg viewBox="0 0 12 12" fill="white" className="w-2.5 h-2.5">
                    <path d="M5.285 0.684a.8.8 0 0 1 1.43 0l1.04 2.107 2.325.338a.8.8 0 0 1 .443 1.364L8.78 6.178l.397 2.314a.8.8 0 0 1-1.16.843L6 8.27l-2.017 1.06a.8.8 0 0 1-1.16-.843l.397-2.314-1.743-1.685a.8.8 0 0 1 .443-1.364l2.325-.338L5.285.684z"/>
                  </svg>
                </span>
              </div>
              <p className="text-xs text-green-400/80 font-medium mt-0.5">@{FOUNDER_USERNAME}</p>
            </Link>
            <div className="flex items-center gap-1 mt-1">
              <MapPin className="w-3 h-3 text-green-400/60 flex-shrink-0" />
              <span className="text-xs text-green-400/60">{FOUNDER_LOCATION}</span>
            </div>
          </div>

          {/* Follow button */}
          <div className="flex-shrink-0 self-start">
            {loading ? (
              <div className="w-20 h-8 bg-white/10 rounded-xl animate-pulse" />
            ) : followed ? (
              <span className="flex items-center gap-1.5 text-xs font-bold text-amber-300 bg-amber-400/10 border border-amber-400/30 px-3 py-1.5 rounded-xl">
                <UserCheck2 className="w-3.5 h-3.5" /> Following
              </span>
            ) : (
              <button
                onClick={handleFollow}
                disabled={following}
                className="flex items-center gap-1.5 text-xs font-bold bg-amber-400 hover:bg-amber-300 disabled:opacity-60 text-gray-900 px-3 py-1.5 rounded-xl transition-colors shadow-md"
              >
                {following ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                Follow
              </button>
            )}
          </div>
        </div>

        {/* Bio */}
        <p className="text-xs text-green-100/70 leading-relaxed mt-3 line-clamp-3">{FOUNDER_BIO}</p>

        {/* Social links + follow count */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/10">
          <div className="flex items-center gap-2">
            <a
              href={FOUNDER_INSTAGRAM}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[11px] font-semibold text-white bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 px-2.5 py-1 rounded-full hover:opacity-90 transition-opacity"
            >
              <IconInstagram className="w-3 h-3" />
              Instagram
            </a>
            <a
              href={FOUNDER_TWITTER}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[11px] font-semibold text-white bg-black px-2.5 py-1 rounded-full hover:opacity-80 transition-opacity border border-white/20"
            >
              <IconTwitterX className="w-3 h-3" />
              X
            </a>
          </div>
          <div className="text-right">
            <p className="text-lg font-black text-white leading-none">{followCount.toLocaleString()}</p>
            <p className="text-[10px] text-green-400/60 font-medium mt-0.5">followers</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

function Avatar({ user, size = "md" }: { user: SocialUser; size?: "sm" | "md" | "lg" }) {
  const sz = size === "lg" ? "w-12 h-12" : size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm";
  if (user.photoURL) {
    return <img src={user.photoURL} alt={user.displayName} className={`${sz} rounded-full object-cover flex-shrink-0 ring-2 ring-white dark:ring-gray-900`} />;
  }
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br ${getGradient(user.uid)} flex items-center justify-center flex-shrink-0 ring-2 ring-white dark:ring-gray-900`}>
      <span className="text-white font-bold text-xs">{getInitials(user.displayName)}</span>
    </div>
  );
}

// ─── Friend Action Button ─────────────────────────────────────────────────────

function FriendButton({
  relation, uid, loading,
  onSend, onCancel, onAccept, onDecline,
}: {
  relation: "self" | "friends" | "sent" | "received" | "none";
  uid: string;
  loading: boolean;
  onSend: () => void;
  onCancel: () => void;
  onAccept: () => void;
  onDecline: () => void;
}) {
  if (relation === "self") return null;
  if (relation === "friends") {
    return (
      <span className="flex items-center gap-1 text-xs font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2.5 py-1.5 rounded-xl border border-green-100 dark:border-green-900/30">
        <UserCheck className="w-3 h-3" /> Friends
      </span>
    );
  }
  if (relation === "sent") {
    return (
      <button
        onClick={onCancel}
        disabled={loading}
        className="flex items-center gap-1 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 dark:hover:text-red-400 px-2.5 py-1.5 rounded-xl transition-colors border border-gray-200 dark:border-gray-700"
      >
        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Clock className="w-3 h-3" />}
        Pending
      </button>
    );
  }
  if (relation === "received") {
    return (
      <div className="flex gap-1.5">
        <button onClick={onAccept} disabled={loading}
          className="text-xs font-bold bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-2.5 py-1.5 rounded-xl transition-colors flex items-center gap-1">
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserCheck className="w-3 h-3" />} Accept
        </button>
        <button onClick={onDecline} disabled={loading}
          className="text-xs font-medium bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400 px-2.5 py-1.5 rounded-xl transition-colors">
          ✕
        </button>
      </div>
    );
  }
  return (
    <button
      onClick={onSend}
      disabled={loading}
      className="flex items-center gap-1 text-xs font-bold bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-2.5 py-1.5 rounded-xl transition-colors"
    >
      {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserPlus className="w-3 h-3" />}
      Add
    </button>
  );
}

// ─── User Card ────────────────────────────────────────────────────────────────

function UserCard({
  user, currentUid, myProfile, actionUid,
  onSend, onCancel, onAccept, onDecline,
}: {
  user: SocialUser;
  currentUid: string;
  myProfile: SocialUser | null;
  actionUid: string | null;
  onSend: (uid: string) => void;
  onCancel: (uid: string) => void;
  onAccept: (uid: string) => void;
  onDecline: (uid: string) => void;
}) {
  const getRelation = (): "self" | "friends" | "sent" | "received" | "none" => {
    if (user.uid === currentUid) return "self";
    if (myProfile?.friends.includes(user.uid)) return "friends";
    if (myProfile?.friendRequestsSent.includes(user.uid)) return "sent";
    if (myProfile?.friendRequestsReceived.includes(user.uid)) return "received";
    return "none";
  };

  const relation = getRelation();
  const loading = actionUid === user.uid;

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors group">
      <Link to={`/u/${user.username}`} className="flex-shrink-0">
        <Avatar user={user} />
      </Link>
      <div className="flex-1 min-w-0">
        <Link to={`/u/${user.username}`} className="block">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-semibold text-gray-900 dark:text-white leading-snug truncate group-hover:text-green-700 dark:group-hover:text-green-400 transition-colors">
              {user.displayName}
            </p>
            {user.username && <BlueTick size={13} />}
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
            @{user.username}
            {(user.streak || 0) > 0 && <span className="ml-1.5">· 🔥 {user.streak}</span>}
            {(user.badges?.length || 0) > 0 && <span className="ml-1.5">· 🏅 {user.badges!.length}</span>}
          </p>
          {user.bio && (
            <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5 max-w-[200px]">{user.bio}</p>
          )}
        </Link>
      </div>
      <div className="flex-shrink-0">
        <FriendButton
          relation={relation}
          uid={user.uid}
          loading={loading}
          onSend={() => onSend(user.uid)}
          onCancel={() => onCancel(user.uid)}
          onAccept={() => onAccept(user.uid)}
          onDecline={() => onDecline(user.uid)}
        />
      </div>
    </div>
  );
}

// ─── Discover Tab ─────────────────────────────────────────────────────────────

function DiscoverTab({
  currentUid, myProfile, actionUid,
  onSend, onCancel, onAccept, onDecline,
}: {
  currentUid: string;
  myProfile: SocialUser | null;
  actionUid: string | null;
  onSend: (uid: string) => void;
  onCancel: (uid: string) => void;
  onAccept: (uid: string) => void;
  onDecline: (uid: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [feedUsers, setFeedUsers] = useState<SocialUser[]>([]);
  const [searchResults, setSearchResults] = useState<SocialUser[] | null>(null);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [realUserCount, setRealUserCount] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const PAGE_SIZE = 20;
  const FEED_CAP = 300;
  const blockedUids = myProfile?.blockedUsers || [];

  // Load platform stats once
  useEffect(() => {
    getPlatformStats().then(s => setRealUserCount(s.realUserCount)).catch(() => {});
  }, []);

  // Filter helper: hides (1) yourself, (2) users YOU blocked, (3) users who blocked YOU
  const notBlockRelated = (u: SocialUser) =>
    u.uid !== currentUid &&
    !blockedUids.includes(u.uid) &&
    !(u.blockedUsers?.includes(currentUid));

  // Initial feed load
  const loadFeed = useCallback(async (reset = false) => {
    if (reset) {
      setLoadingFeed(true);
      setFeedUsers([]);
      setLastDoc(null);
      setHasMore(true);
    }
    try {
      const { users, lastDoc: newLast } = await getDiscoverUsers(PAGE_SIZE, reset ? null : lastDoc);
      const filtered = users.filter(notBlockRelated);
      if (reset) {
        setFeedUsers(filtered);
      } else {
        setFeedUsers(prev => {
          const existing = new Set(prev.map(u => u.uid));
          return [...prev, ...filtered.filter(u => !existing.has(u.uid))];
        });
      }
      setLastDoc(newLast);
      setHasMore(users.length === PAGE_SIZE);
    } catch (e) {
      console.error("Discover feed error:", e);
    } finally {
      setLoadingFeed(false);
    }
  }, [currentUid, lastDoc]);

  useEffect(() => {
    loadFeed(true);
  }, [currentUid]);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const { users, lastDoc: newLast } = await getDiscoverUsers(PAGE_SIZE, lastDoc);
      const filtered = users.filter(notBlockRelated);
      setFeedUsers(prev => {
        const existing = new Set(prev.map(u => u.uid));
        return [...prev, ...filtered.filter(u => !existing.has(u.uid))];
      });
      setLastDoc(newLast);
      setHasMore(users.length === PAGE_SIZE);
    } catch (e) {
      console.error("Load more error:", e);
    } finally {
      setLoadingMore(false);
    }
  };

  // Debounced prefix search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (!q) {
      setSearchResults(null);
      setLoadingSearch(false);
      return;
    }
    setLoadingSearch(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await searchUsersByPrefix(q);
        setSearchResults(results.filter(notBlockRelated));
      } catch (e) {
        console.error("Search error:", e);
        setSearchResults([]);
      } finally {
        setLoadingSearch(false);
      }
    }, 280);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, currentUid]);

  const isSearching = query.trim().length > 0;

  // Real users first, demo users after; cap at FEED_CAP
  const sortedFeed = [
    ...feedUsers.filter(u => !u.isDemo),
    ...feedUsers.filter(u => u.isDemo),
  ].slice(0, FEED_CAP);

  const displayUsers = isSearching ? (searchResults ?? []) : sortedFeed;
  const atCap = !isSearching && feedUsers.length >= FEED_CAP;

  // Friendly "3.1K+" display using realUserCount + 3000 demo base
  const totalStudents = 3000 + realUserCount;
  const studentCountLabel = totalStudents >= 1000
    ? `${(totalStudents / 1000).toFixed(1)}K+`
    : `${totalStudents}+`;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">

      {/* Search bar */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-50 dark:border-gray-800">
        <div className="flex items-center gap-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 focus-within:border-green-400 dark:focus-within:border-green-600 transition-colors">
          {loadingSearch
            ? <Loader2 className="w-4 h-4 text-gray-400 flex-shrink-0 animate-spin" />
            : <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
          }
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by @username…"
            className="flex-1 text-sm bg-transparent outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
          />
          {query && (
            <button
              onClick={() => { setQuery(""); inputRef.current?.focus(); }}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex-shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Section label */}
      <div className="px-4 py-2 bg-gray-50/70 dark:bg-gray-800/30 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between">
        <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
          {isSearching
            ? loadingSearch ? "Searching…" : `Results for "${query}"`
            : "All Students"
          }
        </p>
        {!isSearching && (
          <span className="text-[11px] font-semibold text-green-600 dark:text-green-400">
            {studentCountLabel} students
          </span>
        )}
      </div>

      {/* User list */}
      <div className="divide-y divide-gray-50 dark:divide-gray-800">

        {/* Feed / search loading skeleton */}
        {(loadingFeed && !isSearching) && (
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse w-32" />
                  <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse w-24" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty search result */}
        {isSearching && !loadingSearch && searchResults !== null && searchResults.length === 0 && (
          <div className="text-center py-12 px-4">
            <UserX className="w-10 h-10 text-gray-200 dark:text-gray-700 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              No users found for "<span className="text-gray-700 dark:text-gray-300">{query}</span>"
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">Try a different spelling or shorter prefix.</p>
          </div>
        )}

        {/* Empty feed (shouldn't normally happen) */}
        {!isSearching && !loadingFeed && feedUsers.length === 0 && (
          <div className="text-center py-12 px-4">
            <Compass className="w-10 h-10 text-gray-200 dark:text-gray-700 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No students found yet.</p>
            <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">Be the first to explore!</p>
          </div>
        )}

        {/* User cards */}
        {!loadingFeed && displayUsers.map(u => (
          <UserCard
            key={u.uid}
            user={u}
            currentUid={currentUid}
            myProfile={myProfile}
            actionUid={actionUid}
            onSend={onSend}
            onCancel={onCancel}
            onAccept={onAccept}
            onDecline={onDecline}
          />
        ))}

        {/* Inline search loading */}
        {isSearching && loadingSearch && (
          <div className="flex items-center justify-center gap-2 py-10 text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Searching…</span>
          </div>
        )}
      </div>

      {/* Load more (only in feed mode, below cap) */}
      {!isSearching && !loadingFeed && hasMore && !atCap && (
        <div className="px-4 py-3 border-t border-gray-50 dark:border-gray-800">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/10 rounded-xl transition-colors disabled:opacity-60"
          >
            {loadingMore
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Loading more…</>
              : <><ChevronDown className="w-4 h-4" /> Load more students</>
            }
          </button>
        </div>
      )}

      {/* 300-cap banner: at cap → show how many more exist */}
      {!isSearching && !loadingFeed && atCap && (
        <div className="px-4 py-4 border-t border-gray-50 dark:border-gray-800 text-center">
          <p className="text-xs font-semibold text-green-600 dark:text-green-400">
            {studentCountLabel} students on Topper 2.0
          </p>
          <p className="text-[11px] text-gray-400 dark:text-gray-600 mt-0.5">
            Use search to find a specific student
          </p>
        </div>
      )}

      {/* End of feed indicator (below cap, no more pages) */}
      {!isSearching && !loadingFeed && feedUsers.length > 0 && !hasMore && !atCap && (
        <div className="px-4 py-3 border-t border-gray-50 dark:border-gray-800 text-center">
          <p className="text-xs text-gray-300 dark:text-gray-700">You've seen all students · {feedUsers.length} total</p>
        </div>
      )}
    </div>
  );
}

// ─── Requests Tab ─────────────────────────────────────────────────────────────

function RequestsTab({
  requests, sentRequests, loadingLists, actionUid,
  onAccept, onDecline, onCancel,
}: {
  requests: SocialUser[];
  sentRequests: SocialUser[];
  loadingLists: boolean;
  actionUid: string | null;
  onAccept: (uid: string) => void;
  onDecline: (uid: string) => void;
  onCancel: (uid: string) => void;
}) {
  return (
    <div className="space-y-4">
      {/* Incoming */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 dark:border-gray-800 flex items-center gap-2">
          <Bell className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">Incoming Requests</h3>
          {requests.length > 0 && (
            <span className="ml-auto text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 font-bold px-2 py-0.5 rounded-full">
              {requests.length}
            </span>
          )}
        </div>
        {loadingLists ? (
          <div className="flex items-center gap-2 text-xs text-gray-400 p-5">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading…
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-8 px-4">
            <Bell className="w-8 h-8 text-gray-200 dark:text-gray-700 mx-auto mb-2" />
            <p className="text-sm text-gray-400 dark:text-gray-600">No incoming requests.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {requests.map(req => (
              <div key={req.uid} className="flex items-center gap-3 px-4 py-3">
                <Link to={`/u/${req.username}`}>
                  <Avatar user={req} />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/u/${req.username}`} className="text-sm font-bold text-gray-900 dark:text-white hover:underline block truncate">
                    {req.displayName}
                  </Link>
                  <p className="text-xs text-gray-500 dark:text-gray-400">@{req.username}</p>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <button onClick={() => onAccept(req.uid)} disabled={actionUid === req.uid}
                    className="flex items-center gap-1 text-xs font-bold bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-2.5 py-1.5 rounded-xl transition-colors">
                    {actionUid === req.uid ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserCheck className="w-3 h-3" />} Accept
                  </button>
                  <button onClick={() => onDecline(req.uid)} disabled={actionUid === req.uid}
                    className="text-xs font-medium bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 px-2.5 py-1.5 rounded-xl transition-colors">
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Outgoing */}
      {sentRequests.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 dark:border-gray-800 flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Sent Requests</h3>
            <span className="ml-auto text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-bold px-2 py-0.5 rounded-full">
              {sentRequests.length}
            </span>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {sentRequests.map(req => (
              <div key={req.uid} className="flex items-center gap-3 px-4 py-3">
                <Link to={`/u/${req.username}`}>
                  <Avatar user={req} />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/u/${req.username}`} className="text-sm font-bold text-gray-900 dark:text-white hover:underline block truncate">
                    {req.displayName}
                  </Link>
                  <p className="text-xs text-gray-500 dark:text-gray-400">@{req.username}</p>
                </div>
                <button onClick={() => onCancel(req.uid)} disabled={actionUid === req.uid}
                  className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 dark:hover:text-red-400 border border-gray-200 dark:border-gray-700 px-2.5 py-1.5 rounded-xl transition-colors">
                  {actionUid === req.uid ? <Loader2 className="w-3 h-3 animate-spin" /> : <Clock className="w-3 h-3" />} Cancel
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Friends Tab ──────────────────────────────────────────────────────────────

function FriendsTab({
  friends, loadingLists, actionUid, onRemove, onGoDiscover,
}: {
  friends: SocialUser[];
  loadingLists: boolean;
  actionUid: string | null;
  onRemove: (uid: string) => void;
  onGoDiscover: () => void;
}) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-50 dark:border-gray-800 flex items-center gap-2">
        <Users className="w-4 h-4 text-green-600" />
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">Study Friends</h3>
        {friends.length > 0 && (
          <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">
            {friends.length} friend{friends.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {loadingLists ? (
        <div className="flex items-center gap-2 text-xs text-gray-400 p-5">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading…
        </div>
      ) : friends.length === 0 ? (
        <div className="text-center py-10 px-4">
          <Users className="w-10 h-10 text-gray-200 dark:text-gray-700 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No study friends yet.</p>
          <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">Discover students and send them a request!</p>
          <button
            onClick={onGoDiscover}
            className="mt-4 text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 px-4 py-2 rounded-xl transition-colors"
          >
            Discover Students
          </button>
        </div>
      ) : (
        <div className="divide-y divide-gray-50 dark:divide-gray-800">
          {friends.map(friend => (
            <div key={friend.uid} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors group">
              <Link to={`/u/${friend.username}`}>
                <Avatar user={friend} />
              </Link>
              <div className="flex-1 min-w-0">
                <Link to={`/u/${friend.username}`} className="text-sm font-bold text-gray-900 dark:text-white hover:underline block truncate">
                  {friend.displayName}
                </Link>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  @{friend.username}
                  {(friend.streak || 0) > 0 && <span className="ml-1.5">· 🔥 {friend.streak}</span>}
                </p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <Link to={`/u/${friend.username}`}
                  className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 px-2.5 py-1.5 rounded-xl transition-colors">
                  View
                </Link>
                <button
                  onClick={() => onRemove(friend.uid)}
                  disabled={actionUid === friend.uid}
                  title="Remove friend"
                  className="p-1.5 rounded-xl text-gray-300 dark:text-gray-700 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                >
                  {actionUid === friend.uid
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />
                    : <UserMinus className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type Tab = "discover" | "requests" | "friends";

export default function DiscoverPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("discover");

  const [myProfile, setMyProfile] = useState<SocialUser | null>(null);
  const [friends, setFriends] = useState<SocialUser[]>([]);
  const [requests, setRequests] = useState<SocialUser[]>([]);
  const [sentRequests, setSentRequests] = useState<SocialUser[]>([]);
  const [loadingLists, setLoadingLists] = useState(true);
  const [actionUid, setActionUid] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) return;
    return subscribeToSocialUser(user.uid, (su) => setMyProfile(su));
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;
    setLoadingLists(true);
    Promise.all([
      getFriends(user.uid),
      getFriendRequests(user.uid),
      getSentRequests(user.uid),
    ]).then(([f, r, s]) => {
      setFriends(f);
      setRequests(r);
      setSentRequests(s);
      setLoadingLists(false);
    }).catch(() => setLoadingLists(false));
  }, [
    user?.uid,
    myProfile?.friends?.length,
    myProfile?.friendRequestsReceived?.length,
    myProfile?.friendRequestsSent?.length,
  ]);

  const handleSend = async (toUid: string) => {
    if (!user?.uid) return;
    setActionUid(toUid);
    try { await sendFriendRequest(user.uid, toUid); }
    catch (e) { console.error(e); }
    finally { setActionUid(null); }
  };

  const handleCancel = async (toUid: string) => {
    if (!user?.uid) return;
    setActionUid(toUid);
    try { await cancelFriendRequest(user.uid, toUid); }
    catch (e) { console.error(e); }
    finally { setActionUid(null); }
  };

  const handleAccept = async (fromUid: string) => {
    if (!user?.uid) return;
    setActionUid(fromUid);
    try { await acceptFriendRequest(user.uid, fromUid); }
    catch (e) { console.error(e); }
    finally { setActionUid(null); }
  };

  const handleDecline = async (fromUid: string) => {
    if (!user?.uid) return;
    setActionUid(fromUid);
    try { await declineFriendRequest(user.uid, fromUid); }
    catch (e) { console.error(e); }
    finally { setActionUid(null); }
  };

  const handleRemove = async (friendUid: string) => {
    if (!user?.uid) return;
    if (!confirm("Remove this friend?")) return;
    setActionUid(friendUid);
    try { await removeFriend(user.uid, friendUid); }
    catch (e) { console.error(e); }
    finally { setActionUid(null); }
  };

  const totalRequests = requests.length + sentRequests.length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <TopHeader title="Discover" />
      <div className="pt-12 pb-20">
        <div className="max-w-xl mx-auto px-4 py-8">

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
              <Compass className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900 dark:text-white">Discover</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Find and connect with fellow board exam students</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-1 mb-5 gap-1">
            {([
              { key: "discover" as Tab, label: "Discover", icon: <Compass className="w-3.5 h-3.5" /> },
              { key: "requests" as Tab, label: "Requests", badge: totalRequests > 0 ? totalRequests : null, icon: <Bell className="w-3.5 h-3.5" /> },
              { key: "friends" as Tab, label: "Friends", badge: friends.length > 0 ? friends.length : null, icon: <Users className="w-3.5 h-3.5" /> },
            ]).map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  tab === t.key
                    ? "bg-green-600 text-white shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                }`}
              >
                {t.icon}
                {t.label}
                {t.badge !== null && t.badge !== undefined && (
                  <span className={`min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center ${
                    tab === t.key ? "bg-white/30 text-white" : "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                  }`}>
                    {t.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {tab === "discover" && (
            <>
              {/* Founder card always appears first */}
              <FounderCard currentUid={user?.uid || ""} />
              <DiscoverTab
                currentUid={user?.uid || ""}
                myProfile={myProfile}
                actionUid={actionUid}
                onSend={handleSend}
                onCancel={handleCancel}
                onAccept={handleAccept}
                onDecline={handleDecline}
              />
            </>
          )}

          {tab === "requests" && (
            <RequestsTab
              requests={requests}
              sentRequests={sentRequests}
              loadingLists={loadingLists}
              actionUid={actionUid}
              onAccept={handleAccept}
              onDecline={handleDecline}
              onCancel={handleCancel}
            />
          )}

          {tab === "friends" && (
            <FriendsTab
              friends={friends}
              loadingLists={loadingLists}
              actionUid={actionUid}
              onRemove={handleRemove}
              onGoDiscover={() => setTab("discover")}
            />
          )}

        </div>
      </div>
      <BottomNav />
    </div>
  );
}
