import { useState, useEffect, useCallback, useRef } from "react";
import {
  Heart, MessageCircle, Trash2, Send, ChevronDown, ChevronUp,
  Sparkles, Loader2, Bot, Users, Flame, Bell, BellOff, EyeOff,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useProgress } from "../contexts/ProgressContext";
import {
  subscribeDiscussionPosts, createDiscussionPost,
  addUpvotePost, removeUpvotePost,
  deleteDiscussionPost,
  getDiscussionReplies, addDiscussionReply,
  addUpvoteReply, removeUpvoteReply,
  createReplyNotification,
  savePushSubscription, getPushSubscription,
  subscribeToSocialUser,
  type DiscussionPost, type DiscussionReply, type SocialUser,
} from "../lib/firestore";
import { sendChatMessage } from "../lib/api";
import {
  isPushSupported, getPermissionState,
  subscribeToPush, getExistingSubscription,
  sendPushNotification,
} from "../lib/push";

// ─── Props ────────────────────────────────────────────────────────────────────

interface DiscussionViewProps {
  chapterId: string;
  chapterName: string;
  subject?: string;
  language?: string;
  chapterText?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTimeAgo(ts: any): string {
  if (!ts) return "";
  try {
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  } catch { return ""; }
}

// Deterministic anonymous number: consistent for a given user in a given room/chapter
function getAnonNumber(uid: string, chapterId: string): number {
  const str = uid + chapterId;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return (Math.abs(hash) % 99) + 1;
}

// Resolve the display name to use — never exposes email
function resolveDisplayName(
  uid: string,
  chapterId: string,
  socialUser: SocialUser | null,
  userData: any,
  firebaseUser: any
): string {
  if (socialUser?.isAnonymous) {
    return `Anonymous User ${getAnonNumber(uid, chapterId)}`;
  }
  return (
    socialUser?.username ||
    userData?.profile?.name ||
    firebaseUser?.displayName ||
    "Student"
  );
}

const AVATAR_PALETTES = [
  { from: "from-violet-500", to: "to-purple-600" },
  { from: "from-blue-500", to: "to-indigo-600" },
  { from: "from-rose-500", to: "to-pink-600" },
  { from: "from-amber-500", to: "to-orange-600" },
  { from: "from-teal-500", to: "to-cyan-600" },
  { from: "from-green-500", to: "to-emerald-600" },
];

function getAvatarPalette(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_PALETTES[Math.abs(hash) % AVATAR_PALETTES.length];
}

function getInitials(name: string): string {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "?";
}

function Avatar({ name, isAI = false, size = "sm" }: { name: string; isAI?: boolean; size?: "sm" | "md" }) {
  const sz = size === "md" ? "w-9 h-9 text-sm" : "w-7 h-7 text-xs";
  if (isAI) {
    return (
      <div className={`${sz} rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-sm`}>
        <Bot className="w-3.5 h-3.5 text-white" />
      </div>
    );
  }
  const { from, to } = getAvatarPalette(name);
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br ${from} ${to} flex items-center justify-center flex-shrink-0 shadow-sm`}>
      <span className="text-white font-bold leading-none">{getInitials(name)}</span>
    </div>
  );
}

// ─── Notification Permission Banner ──────────────────────────────────────────

function NotificationBanner({ uid }: { uid: string }) {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!isPushSupported()) return;
    const dismissed = localStorage.getItem("push_dismissed");
    if (!dismissed && getPermissionState() === "default") {
      setVisible(true);
    }
    if (getPermissionState() === "granted" && uid) {
      getExistingSubscription()
        .then(sub => { if (sub) savePushSubscription(uid, sub.toJSON()).catch(console.warn); })
        .catch(console.warn);
    }
  }, [uid]);

  if (!visible || done) return null;

  const handleEnable = async () => {
    setLoading(true);
    try {
      const sub = await subscribeToPush();
      if (sub && uid) {
        await savePushSubscription(uid, sub.toJSON());
        setDone(true);
        setVisible(false);
      }
    } catch (e) { console.warn("[push] enable failed:", e); }
    setLoading(false);
  };

  const handleDismiss = () => {
    localStorage.setItem("push_dismissed", "1");
    setVisible(false);
  };

  return (
    <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-2xl px-4 py-3 mb-4">
      <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center flex-shrink-0">
        <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400" />
      </div>
      <p className="text-sm text-amber-700 dark:text-amber-300 flex-1 leading-snug">
        <span className="font-semibold">Get reply notifications</span> — even when the app is closed.
      </p>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={handleDismiss}
          className="text-xs text-amber-500 dark:text-amber-400 hover:text-amber-700 transition-colors p-1"
          title="Dismiss"
        >
          <BellOff className="w-4 h-4" />
        </button>
        <button
          onClick={handleEnable}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white px-3 py-1.5 rounded-xl transition-colors"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Bell className="w-3 h-3" />}
          {loading ? "Enabling…" : "Enable"}
        </button>
      </div>
    </div>
  );
}

// ─── Animated Like Button ─────────────────────────────────────────────────────

function LikeButton({
  count, liked, onLike, size = "sm",
}: {
  count: number; liked: boolean; onLike: () => void; size?: "sm" | "xs";
}) {
  const [animating, setAnimating] = useState(false);
  const [showBurst, setShowBurst] = useState(false);

  const handleClick = () => {
    if (!liked) {
      setAnimating(true);
      setShowBurst(true);
      setTimeout(() => setAnimating(false), 400);
      setTimeout(() => setShowBurst(false), 500);
    }
    onLike();
  };

  const iconSz = size === "xs" ? "w-3 h-3" : "w-3.5 h-3.5";
  const textSz = size === "xs" ? "text-[11px]" : "text-xs";

  return (
    <button
      onClick={handleClick}
      className={`relative group flex items-center gap-1 ${textSz} font-semibold transition-all duration-150 select-none ${
        liked
          ? "text-rose-500 dark:text-rose-400"
          : "text-gray-400 dark:text-gray-500 hover:text-rose-500 dark:hover:text-rose-400"
      }`}
    >
      {showBurst && (
        <span
          className="absolute rounded-full border-2 border-rose-400 animate-like-burst pointer-events-none"
          style={{ top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "24px", height: "24px" }}
        />
      )}
      <Heart
        className={`${iconSz} transition-colors ${animating ? "animate-like-pop" : ""} ${
          liked ? "fill-rose-500 dark:fill-rose-400" : "fill-none group-hover:fill-rose-300/40"
        }`}
      />
      <span className={`tabular-nums ${liked ? "text-rose-500 dark:text-rose-400" : ""}`}>
        {count > 0 ? count : ""}
      </span>
    </button>
  );
}

// ─── Reply Thread ─────────────────────────────────────────────────────────────

interface ReplyListProps {
  chapterId: string;
  postId: string;
  postAuthorUid: string;
  postText: string;
  currentUid: string;
  chapterName: string;
  subject?: string;
  language?: string;
  chapterText?: string;
  userName: string;
  replyCount: number;
}

function ReplyList({
  chapterId, postId, postAuthorUid, postText, currentUid,
  chapterName, subject, language, chapterText, userName, replyCount,
}: ReplyListProps) {
  const [replies, setReplies] = useState<DiscussionReply[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [posting, setPosting] = useState(false);
  const [aiAnswering, setAiAnswering] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadReplies = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getDiscussionReplies(chapterId, postId);
      setReplies(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [chapterId, postId]);

  const handleExpand = () => {
    const next = !expanded;
    setExpanded(next);
    if (next) {
      loadReplies();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  };

  const handleReply = async () => {
    const text = replyText.trim();
    if (!text || posting) return;
    setPosting(true);
    try {
      await addDiscussionReply(chapterId, postId, currentUid, userName, text, false);
      setReplyText("");

      if (postAuthorUid && postAuthorUid !== currentUid && postAuthorUid !== "ai") {
        createReplyNotification(postAuthorUid, chapterId, postId, userName, text, chapterName)
          .catch(console.warn);
      }

      if (postAuthorUid && postAuthorUid !== currentUid && postAuthorUid !== "ai") {
        getPushSubscription(postAuthorUid)
          .then(sub => {
            if (!sub) return;
            const notifUrl = chapterId.startsWith("_room_")
              ? "/community"
              : `/chapter/${chapterId}?section=discussion`;
            return sendPushNotification({
              subscription: sub,
              title: `${userName} replied to your post`,
              body: text.length > 80 ? text.slice(0, 80) + "…" : text,
              url: notifUrl,
            });
          })
          .catch(console.warn);
      }

      await loadReplies();
      setTimeout(() => inputRef.current?.focus(), 50);
    } catch (e) { console.error(e); }
    finally { setPosting(false); }
  };

  const handleAIAnswer = async () => {
    if (aiAnswering || !chapterText) return;
    setAiAnswering(true);
    if (!expanded) { setExpanded(true); await loadReplies(); }
    try {
      const query = language === "hindi"
        ? `एक छात्र ने यह सवाल पूछा है: "${postText}". इसे इस chapter के context में आसान Hindi में explain करो।`
        : `A student asked: "${postText}". Please answer this in the context of this chapter in clear, simple language.`;
      const data = await sendChatMessage(
        [{ role: "user", content: query }],
        chapterText, chapterName, subject || "Science", language || "english"
      );
      await addDiscussionReply(chapterId, postId, "ai", "AI Tutor", data.reply, true);
      await loadReplies();
    } catch (e) { console.error(e); }
    finally { setAiAnswering(false); }
  };

  const handleUpvoteReply = useCallback((reply: DiscussionReply) => {
    const wasLiked = reply.upvotes.includes(currentUid);
    setReplies(prev => prev.map(r => {
      if (r.id !== reply.id) return r;
      return {
        ...r,
        upvotes: wasLiked
          ? r.upvotes.filter(u => u !== currentUid)
          : [...r.upvotes, currentUid],
      };
    }));
    if (wasLiked) {
      removeUpvoteReply(chapterId, postId, reply.id, currentUid).catch(console.error);
    } else {
      addUpvoteReply(chapterId, postId, reply.id, currentUid).catch(console.error);
    }
  }, [currentUid, chapterId, postId]);

  const totalReplies = replies.length || replyCount;

  return (
    <div className="mt-2.5">
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={handleExpand}
          className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
            expanded
              ? "text-green-600 dark:text-green-400"
              : "text-gray-400 dark:text-gray-500 hover:text-green-600 dark:hover:text-green-400"
          }`}
        >
          <MessageCircle className="w-3.5 h-3.5" />
          {totalReplies > 0 ? `${totalReplies} ${totalReplies === 1 ? "reply" : "replies"}` : "Reply"}
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        {chapterText && (
          <button
            onClick={handleAIAnswer}
            disabled={aiAnswering}
            className="flex items-center gap-1.5 text-xs font-semibold text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 disabled:opacity-50 transition-colors"
          >
            {aiAnswering ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            {aiAnswering ? "AI thinking…" : "Ask AI"}
          </button>
        )}
      </div>

      {expanded && (
        <div className="mt-3 ml-3 pl-4 border-l-2 border-gray-100 dark:border-gray-800 space-y-3">
          {loading && (
            <div className="flex items-center gap-2 text-xs text-gray-400 py-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading…
            </div>
          )}

          {!loading && replies.map(reply => {
            // Always show the current user's resolved name (respects anonymous mode + fixes old email entries)
            const replyDisplayName = (!reply.isAI && reply.uid === currentUid) ? userName : reply.userName;
            return (
            <div
              key={reply.id}
              className={`flex items-start gap-2.5 animate-post-in ${
                reply.isAI
                  ? "bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 rounded-xl p-3"
                  : ""
              }`}
            >
              <Avatar name={replyDisplayName} isAI={reply.isAI} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span className="text-xs font-semibold text-gray-900 dark:text-white">{replyDisplayName}</span>
                  {reply.isAI && (
                    <span className="text-[10px] bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wide">
                      AI Tutor
                    </span>
                  )}
                  <span className="text-[10px] text-gray-400 dark:text-gray-500">{formatTimeAgo(reply.createdAt)}</span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{reply.text}</p>
                <div className="mt-1.5">
                  <LikeButton
                    count={reply.upvotes.length}
                    liked={reply.upvotes.includes(currentUid)}
                    onLike={() => handleUpvoteReply(reply)}
                    size="xs"
                  />
                </div>
              </div>
            </div>
            );
          })}

          {!loading && replies.length === 0 && (
            <p className="text-xs text-gray-400 dark:text-gray-500 py-1">No replies yet — be the first!</p>
          )}

          <div className="flex items-center gap-2 pt-0.5">
            <div className="flex-1 flex items-center gap-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 focus-within:border-green-400 dark:focus-within:border-green-600 transition-colors">
              <input
                ref={inputRef}
                type="text"
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleReply(); }}
                placeholder="Write a reply…"
                className="flex-1 text-xs bg-transparent outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                disabled={posting}
              />
              <button
                onClick={handleReply}
                disabled={!replyText.trim() || posting}
                className="text-green-600 dark:text-green-400 hover:text-green-700 disabled:opacity-40 transition-colors flex-shrink-0"
              >
                {posting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Post Card ────────────────────────────────────────────────────────────────

function PostCard({
  post, currentUid, chapterId, chapterName, subject, language, chapterText,
  userName, onDelete, onLike,
}: {
  post: DiscussionPost;
  currentUid: string;
  chapterId: string;
  chapterName: string;
  subject?: string;
  language?: string;
  chapterText?: string;
  userName: string;
  onDelete: (id: string) => void;
  onLike: (post: DiscussionPost) => void;
}) {
  // For the current user's own posts, always use the resolved display name
  // (respects anonymous mode and removes stale stored email/name)
  const displayedName = post.uid === currentUid ? userName : post.userName;

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 md:p-5 hover:border-gray-200 dark:hover:border-gray-700 transition-colors animate-post-in">
      <div className="flex items-start gap-3 mb-3">
        <Avatar name={displayedName} size="md" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">{displayedName}</span>
            {post.uid === currentUid && (
              <span className="text-[10px] bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded-full font-semibold">You</span>
            )}
            <span className="text-xs text-gray-400 dark:text-gray-500">{formatTimeAgo(post.createdAt)}</span>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{post.text}</p>
        </div>
        {post.uid === currentUid && (
          <button
            onClick={() => onDelete(post.id)}
            className="flex-shrink-0 p-1.5 rounded-lg text-gray-300 dark:text-gray-700 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            title="Delete post"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="h-px bg-gray-50 dark:bg-gray-800 mb-2.5" />

      <div className="flex items-center gap-4">
        <LikeButton
          count={post.upvotes.length}
          liked={post.upvotes.includes(currentUid)}
          onLike={() => onLike(post)}
        />
        <ReplyList
          chapterId={chapterId}
          postId={post.id}
          postAuthorUid={post.uid}
          postText={post.text}
          currentUid={currentUid}
          chapterName={chapterName}
          subject={subject}
          language={language}
          chapterText={chapterText}
          userName={userName}
          replyCount={post.replyCount}
        />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DiscussionView({
  chapterId, chapterName, subject, language, chapterText,
}: DiscussionViewProps) {
  const { user } = useAuth();
  const { userData } = useProgress();
  const [socialUser, setSocialUser] = useState<SocialUser | null>(null);
  const [posts, setPosts] = useState<DiscussionPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [postText, setPostText] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const uid = user?.uid || "";

  // Subscribe to the current user's social profile for username + anonymous status
  useEffect(() => {
    if (!uid) return;
    const unsub = subscribeToSocialUser(uid, (su) => {
      setSocialUser(su);
    });
    return unsub;
  }, [uid]);

  // Resolve display name — username preferred, never email, anonymous masked
  const displayName = uid
    ? resolveDisplayName(uid, chapterId, socialUser, userData, user)
    : "Student";

  const isAnonymous = socialUser?.isAnonymous ?? false;

  // ── Real-time subscription ──────────────────────────────────────────────────
  useEffect(() => {
    if (!chapterId) return;
    setLoading(true);
    const unsub = subscribeDiscussionPosts(chapterId, (newPosts) => {
      setPosts(newPosts);
      setLoading(false);
    });
    return unsub;
  }, [chapterId]);

  // ── Post ────────────────────────────────────────────────────────────────────
  const handlePost = async () => {
    const text = postText.trim();
    if (!text || posting || !uid) return;
    setPosting(true);
    setError("");
    try {
      await createDiscussionPost(chapterId, uid, displayName, text);
      setPostText("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    } catch {
      setError("Could not post. Please try again.");
    } finally {
      setPosting(false);
    }
  };

  // ── Like (fully optimistic) ─────────────────────────────────────────────────
  const handleLike = useCallback((post: DiscussionPost) => {
    if (!uid) return;
    const wasLiked = post.upvotes.includes(uid);
    setPosts(prev => prev.map(p => {
      if (p.id !== post.id) return p;
      return { ...p, upvotes: wasLiked ? p.upvotes.filter(u => u !== uid) : [...p.upvotes, uid] };
    }));
    if (wasLiked) {
      removeUpvotePost(chapterId, post.id, uid).catch(() => {
        setPosts(prev => prev.map(p => p.id === post.id ? { ...p, upvotes: [...p.upvotes, uid] } : p));
      });
    } else {
      addUpvotePost(chapterId, post.id, uid).catch(() => {
        setPosts(prev => prev.map(p => p.id === post.id ? { ...p, upvotes: p.upvotes.filter(u => u !== uid) } : p));
      });
    }
  }, [uid, chapterId]);

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDelete = async (postId: string) => {
    if (!confirm("Delete this post?")) return;
    try { await deleteDiscussionPost(chapterId, postId); } catch (e) { console.error(e); }
  };

  const isGlobalRoom = chapterId.startsWith("_room_");

  return (
    <div className="max-w-2xl">

      {/* Notification permission banner */}
      {uid && <NotificationBanner uid={uid} />}

      {/* Anonymous mode active banner */}
      {uid && isAnonymous && (
        <div className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700/50 rounded-2xl px-4 py-3 mb-4">
          <EyeOff className="w-4 h-4 text-slate-400 dark:text-slate-500 flex-shrink-0" />
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">
            <span className="font-semibold text-slate-600 dark:text-slate-300">Anonymous mode is on.</span>{" "}
            Others will see you as <span className="font-semibold text-slate-700 dark:text-slate-200">{displayName}</span> in this room.
          </p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-5 gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
            {isGlobalRoom ? "Community Discussion" : "Chapter Discussion"}
            {!loading && posts.length > 0 && (
              <span className="text-sm font-normal text-gray-400 dark:text-gray-500">
                {posts.length} {posts.length === 1 ? "post" : "posts"}
              </span>
            )}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {isGlobalRoom
              ? "Ask doubts, share tips, and help fellow Bihar Board students."
              : `Discuss concepts from ${chapterName}. Ask doubts or share tips with other students.`
            }
          </p>
        </div>
        {!loading && posts.length > 0 && (
          <div className="flex items-center gap-1.5 flex-shrink-0 text-xs text-gray-400 dark:text-gray-500">
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            <span>Live</span>
          </div>
        )}
      </div>

      {/* Composer */}
      {uid && (
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 mb-5 shadow-sm">
          <div className="flex items-start gap-3">
            <Avatar name={displayName} size="md" />
            <div className="flex-1 min-w-0">
              {/* Identity indicator */}
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  {displayName}
                </span>
                {isAnonymous && (
                  <span className="flex items-center gap-1 text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded-full">
                    <EyeOff className="w-2.5 h-2.5" />
                    Anonymous
                  </span>
                )}
              </div>
              <textarea
                ref={textareaRef}
                value={postText}
                onChange={e => {
                  setPostText(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";
                }}
                onKeyDown={e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handlePost(); }}
                placeholder={
                  isGlobalRoom
                    ? "Ask a question or share something useful for Bihar Board students…"
                    : (language === "hindi"
                        ? `${chapterName} के बारे में कोई सवाल या tip share करो…`
                        : `Ask a question or share a tip about ${chapterName}…`)
                }
                rows={2}
                style={{ resize: "none", minHeight: "60px", maxHeight: "160px" }}
                className="w-full text-sm bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl px-3.5 py-2.5 outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-green-300 dark:focus:border-green-700 transition-colors overflow-y-auto"
                disabled={posting}
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] text-gray-300 dark:text-gray-700">Ctrl+Enter to post</span>
                <div className="flex items-center gap-2">
                  {error && <p className="text-xs text-red-500">{error}</p>}
                  <button
                    onClick={handlePost}
                    disabled={!postText.trim() || posting}
                    className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors"
                  >
                    {posting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    {posting ? "Posting…" : "Post"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Posts */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-28 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">No posts yet</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
            Be the first to start a discussion! Ask a doubt or share a helpful tip.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              currentUid={uid}
              chapterId={chapterId}
              chapterName={chapterName}
              subject={subject}
              language={language}
              chapterText={chapterText}
              userName={displayName}
              onDelete={handleDelete}
              onLike={handleLike}
            />
          ))}
        </div>
      )}
    </div>
  );
}
