import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare, ThumbsUp, Reply, Bot, Trash2,
  Send, ChevronDown, ChevronUp, Sparkles, Loader2,
  MessageCircle, User,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useProgress } from "../contexts/ProgressContext";
import {
  getDiscussionPosts, createDiscussionPost, toggleUpvotePost, deleteDiscussionPost,
  getDiscussionReplies, addDiscussionReply, toggleUpvoteReply,
  type DiscussionPost, type DiscussionReply,
} from "../lib/firestore";
import { sendChatMessage } from "../lib/api";

interface DiscussionViewProps {
  chapterId: string;
  chapterName: string;
  subject: string;
  language: string;
  chapterText: string;
}

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

function getInitials(name: string): string {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "?";
}

function Avatar({ name, isAI = false, size = "sm" }: { name: string; isAI?: boolean; size?: "sm" | "md" }) {
  const sz = size === "sm" ? "w-7 h-7 text-xs" : "w-9 h-9 text-sm";
  if (isAI) {
    return (
      <div className={`${sz} rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0`}>
        <Bot className="w-3.5 h-3.5 text-white" />
      </div>
    );
  }
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0`}>
      <span className="text-white font-bold">{getInitials(name)}</span>
    </div>
  );
}

interface ReplyListProps {
  chapterId: string;
  postId: string;
  currentUid: string;
  chapterName: string;
  subject: string;
  language: string;
  chapterText: string;
  userName: string;
  replyCount: number;
}

function ReplyList({
  chapterId, postId, currentUid, chapterName, subject, language, chapterText, userName, replyCount
}: ReplyListProps) {
  const [replies, setReplies] = useState<DiscussionReply[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [posting, setPosting] = useState(false);
  const [aiAnswering, setAiAnswering] = useState(false);

  const loadReplies = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try {
      const data = await getDiscussionReplies(chapterId, postId);
      setReplies(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [chapterId, postId]);

  const handleExpand = () => {
    if (!expanded) loadReplies();
    setExpanded(e => !e);
  };

  const handleReply = async () => {
    const text = replyText.trim();
    if (!text || posting) return;
    setPosting(true);
    try {
      await addDiscussionReply(chapterId, postId, currentUid, userName, text, false);
      setReplyText("");
      await loadReplies();
    } catch (e) {
      console.error(e);
    } finally {
      setPosting(false);
    }
  };

  const handleAIAnswer = async (postText: string) => {
    if (aiAnswering) return;
    setAiAnswering(true);
    if (!expanded) {
      await loadReplies();
      setExpanded(true);
    }
    try {
      const query = language === "hindi"
        ? `एक छात्र ने यह सवाल पूछा है: "${postText}". इसे इस chapter के context में आसान Hindi में explain करो।`
        : `A student asked: "${postText}". Please answer this in the context of this chapter in clear, simple language.`;
      const data = await sendChatMessage(
        [{ role: "user", content: query }],
        chapterText,
        chapterName,
        subject,
        language
      );
      await addDiscussionReply(chapterId, postId, "ai", "AI Tutor", data.reply, true);
      await loadReplies();
    } catch (e) {
      console.error(e);
    } finally {
      setAiAnswering(false);
    }
  };

  const handleUpvoteReply = async (replyId: string) => {
    try {
      await toggleUpvoteReply(chapterId, postId, replyId, currentUid);
      setReplies(prev => prev.map(r => {
        if (r.id !== replyId) return r;
        const upvoted = r.upvotes.includes(currentUid);
        return {
          ...r,
          upvotes: upvoted
            ? r.upvotes.filter(u => u !== currentUid)
            : [...r.upvotes, currentUid],
        };
      }));
    } catch (e) { console.error(e); }
  };

  return (
    <div className="mt-3">
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={handleExpand}
          className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 hover:text-green-600 dark:hover:text-green-400 transition-colors">
          <Reply className="w-3.5 h-3.5" />
          {replyCount > 0 ? `${replyCount} ${replyCount === 1 ? "reply" : "replies"}` : "Reply"}
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
        <button
          onClick={() => handleAIAnswer("")}
          disabled={aiAnswering}
          className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 hover:text-green-700 disabled:opacity-50 transition-colors font-medium">
          {aiAnswering
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : <Sparkles className="w-3.5 h-3.5" />
          }
          {aiAnswering ? "AI thinking..." : "Ask AI"}
        </button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 ml-4 pl-4 border-l-2 border-gray-100 dark:border-gray-800 space-y-3">

            {loading && (
              <div className="flex items-center gap-2 text-xs text-gray-400 py-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading replies...
              </div>
            )}

            {!loading && replies.map(reply => (
              <motion.div
                key={reply.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-start gap-2.5 ${reply.isAI ? "bg-green-50 dark:bg-green-900/10 rounded-xl p-3" : ""}`}>
                <Avatar name={reply.userName} isAI={reply.isAI} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="text-xs font-semibold text-gray-900 dark:text-white">{reply.userName}</span>
                    {reply.isAI && (
                      <span className="text-xs bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded-full font-medium">
                        AI Tutor
                      </span>
                    )}
                    <span className="text-xs text-gray-400 dark:text-gray-500">{formatTimeAgo(reply.createdAt)}</span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{reply.text}</p>
                  <button
                    onClick={() => handleUpvoteReply(reply.id)}
                    className={`flex items-center gap-1 text-xs mt-1.5 transition-colors ${
                      reply.upvotes.includes(currentUid)
                        ? "text-green-600 dark:text-green-400"
                        : "text-gray-400 dark:text-gray-500 hover:text-green-600 dark:hover:text-green-400"
                    }`}>
                    <ThumbsUp className="w-3 h-3" />
                    {reply.upvotes.length > 0 && reply.upvotes.length}
                  </button>
                </div>
              </motion.div>
            ))}

            {!loading && replies.length === 0 && (
              <p className="text-xs text-gray-400 dark:text-gray-500 py-1">No replies yet. Be the first!</p>
            )}

            {/* Reply input */}
            <div className="flex items-center gap-2 pt-1">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                <User className="w-3 h-3 text-white" />
              </div>
              <div className="flex-1 flex items-center gap-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleReply(); }}
                  placeholder="Write a reply..."
                  className="flex-1 text-xs bg-transparent outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  disabled={posting}
                />
                <button
                  onClick={handleReply}
                  disabled={!replyText.trim() || posting}
                  className="text-green-600 dark:text-green-400 hover:text-green-700 disabled:opacity-40 transition-colors flex-shrink-0">
                  {posting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function DiscussionView({
  chapterId, chapterName, subject, language, chapterText
}: DiscussionViewProps) {
  const { user } = useAuth();
  const { userData } = useProgress();
  const [posts, setPosts] = useState<DiscussionPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [postText, setPostText] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");

  const userName = userData?.profile?.name || user?.displayName || user?.email?.split("@")[0] || "Student";
  const uid = user?.uid || "";

  const loadPosts = useCallback(async () => {
    try {
      const data = await getDiscussionPosts(chapterId);
      setPosts(data);
    } catch (e) {
      console.error(e);
      setError("Could not load discussions.");
    } finally {
      setLoading(false);
    }
  }, [chapterId]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handlePost = async () => {
    const text = postText.trim();
    if (!text || posting || !uid) return;
    setPosting(true);
    setError("");
    try {
      await createDiscussionPost(chapterId, uid, userName, text);
      setPostText("");
      await loadPosts();
    } catch (e) {
      setError("Could not post. Please try again.");
    } finally {
      setPosting(false);
    }
  };

  const handleUpvote = async (postId: string) => {
    if (!uid) return;
    try {
      await toggleUpvotePost(chapterId, postId, uid);
      setPosts(prev => prev.map(p => {
        if (p.id !== postId) return p;
        const upvoted = p.upvotes.includes(uid);
        return {
          ...p,
          upvotes: upvoted
            ? p.upvotes.filter(u => u !== uid)
            : [...p.upvotes, uid],
        };
      }));
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm("Delete this post?")) return;
    try {
      await deleteDiscussionPost(chapterId, postId);
      setPosts(prev => prev.filter(p => p.id !== postId));
    } catch (e) { console.error(e); }
  };

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-green-600" />
          Chapter Discussion
          {posts.length > 0 && (
            <span className="text-sm font-normal text-gray-400 ml-1">{posts.length} posts</span>
          )}
        </h2>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
        Ask doubts, share tips, or discuss concepts from <strong>{chapterName}</strong>. You can also get an instant AI answer on any post.
      </p>

      {/* Post composer */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <Avatar name={userName} size="md" />
          <div className="flex-1">
            <textarea
              value={postText}
              onChange={e => setPostText(e.target.value)}
              placeholder={language === "hindi"
                ? `${chapterName} के बारे में कोई सवाल या tip share करो...`
                : `Ask a question or share a tip about ${chapterName}...`
              }
              rows={3}
              className="w-full text-sm bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-3 outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 resize-none transition-colors focus:border-green-300 dark:focus:border-green-700"
              disabled={posting}
            />
            <div className="flex items-center justify-between mt-2">
              {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
              <div className="ml-auto">
                <button
                  onClick={handlePost}
                  disabled={!postText.trim() || posting}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
                  {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {posting ? "Posting..." : "Post"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Posts list */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-28 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-center py-16">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">No discussions yet</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Be the first to start a discussion about this chapter!
          </p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {posts.map((post, i) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ delay: i * 0.04 }}
                className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5">

                {/* Post header */}
                <div className="flex items-start gap-3 mb-3">
                  <Avatar name={post.userName} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{post.userName}</span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">{formatTimeAgo(post.createdAt)}</span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mt-1.5 whitespace-pre-wrap">
                      {post.text}
                    </p>
                  </div>
                  {post.uid === uid && (
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="text-gray-300 dark:text-gray-700 hover:text-red-500 dark:hover:text-red-400 transition-colors flex-shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Post actions */}
                <div className="flex items-center gap-3 mb-2">
                  <button
                    onClick={() => handleUpvote(post.id)}
                    className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
                      post.upvotes.includes(uid)
                        ? "text-green-600 dark:text-green-400"
                        : "text-gray-400 dark:text-gray-500 hover:text-green-600 dark:hover:text-green-400"
                    }`}>
                    <ThumbsUp className="w-3.5 h-3.5" />
                    {post.upvotes.length > 0 ? post.upvotes.length : "Like"}
                  </button>
                </div>

                {/* Replies */}
                <ReplyList
                  chapterId={chapterId}
                  postId={post.id}
                  currentUid={uid}
                  chapterName={chapterName}
                  subject={subject}
                  language={language}
                  chapterText={chapterText}
                  userName={userName}
                  replyCount={post.replyCount}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
