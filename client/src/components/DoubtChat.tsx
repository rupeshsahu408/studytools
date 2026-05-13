import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send, Bot, User, MessageCircle, Plus, Pin, PinOff,
  Trash2, Pencil, Check, X, ChevronLeft, MessageSquare,
  Loader2, Sparkles, Bookmark,
} from "lucide-react";
import { sendChatMessage } from "../lib/api";
import {
  subscribeChatSessions, createChatSession, saveChatMessages,
  renameChatSession, toggleChatPin, deleteChatSession,
} from "../lib/firestore";
import type { ChatSession, ChatMessage } from "../lib/firestore";

interface DoubtChatProps {
  chapterName: string;
  subject: string;
  language: string;
  chapterText: string;
  chapterId: string;
  userId: string;
}

// ─── Reaction config ──────────────────────────────────────────────────────────

type ReactionKey = "thumbsUp" | "lightbulb" | "star";

const REACTIONS: { key: ReactionKey; emoji: string; label: string; activeClass: string }[] = [
  { key: "thumbsUp",  emoji: "👍", label: "Helpful",    activeClass: "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 text-blue-600" },
  { key: "lightbulb", emoji: "💡", label: "Insightful", activeClass: "bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700 text-amber-600" },
  { key: "star",      emoji: "⭐", label: "Save",       activeClass: "bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-700 text-yellow-600" },
];

// ─── Suggestions ──────────────────────────────────────────────────────────────

const SUGGESTIONS_EN = [
  "Explain the main concept",
  "Must-memorise formulas?",
  "Typical exam questions?",
  "Real-world example?",
];
const SUGGESTIONS_HI = [
  "Main concept समझाओ",
  "जरूरी formulas कौन से हैं?",
  "Exam में कैसे प्रश्न आते हैं?",
  "Real-world example दो",
];

// ─── Time helper ──────────────────────────────────────────────────────────────

function fmtTime(ts: any): string {
  if (!ts) return "";
  try {
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    const now = new Date();
    const diff = (now.getTime() - d.getTime()) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    if (diff < 172800) return "Yesterday";
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  } catch { return ""; }
}

function makeTitle(msg: string): string {
  const t = msg.trim().replace(/\s+/g, " ");
  return t.length > 42 ? t.slice(0, 42) + "…" : t;
}

// ─── Session list item ────────────────────────────────────────────────────────

function SessionItem({
  session, isActive, onSelect, onRename, onPin, onDelete,
}: {
  session: ChatSession; isActive: boolean;
  onSelect: () => void; onRename: (title: string) => void;
  onPin: () => void; onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(session.title);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  const commitRename = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== session.title) onRename(trimmed);
    else setDraft(session.title);
    setEditing(false);
  };

  const msgCount = Math.ceil((session.messages?.length || 0) / 2);
  const starCount = (session.messages || []).filter(m => m.reactions?.star).length;

  return (
    <div
      onClick={() => { if (!editing) onSelect(); }}
      className={`group relative rounded-2xl p-3.5 cursor-pointer transition-all select-none ${
        isActive
          ? "bg-green-50 dark:bg-green-900/20 ring-1 ring-green-200 dark:ring-green-800/60"
          : "hover:bg-gray-50 dark:hover:bg-gray-800/50 active:bg-gray-100 dark:active:bg-gray-800"
      }`}
    >
      <div className="flex items-start gap-2.5">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
          isActive ? "bg-green-100 dark:bg-green-900/40" : "bg-gray-100 dark:bg-gray-800"
        }`}>
          {session.isPinned
            ? <Pin className="w-3.5 h-3.5 text-amber-500" />
            : <MessageSquare className={`w-3.5 h-3.5 ${isActive ? "text-green-600 dark:text-green-400" : "text-gray-400"}`} />
          }
        </div>

        <div className="flex-1 min-w-0">
          {editing ? (
            <input
              ref={inputRef}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter") commitRename();
                if (e.key === "Escape") { setDraft(session.title); setEditing(false); }
              }}
              onBlur={commitRename}
              onClick={e => e.stopPropagation()}
              className="w-full text-sm font-medium bg-white dark:bg-gray-900 border border-green-300 dark:border-green-700 rounded-lg px-2 py-0.5 text-gray-900 dark:text-white outline-none"
            />
          ) : (
            <p className={`text-sm font-semibold leading-snug truncate ${
              isActive ? "text-green-700 dark:text-green-300" : "text-gray-800 dark:text-gray-200"
            }`}>
              {session.title}
            </p>
          )}
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[11px] text-gray-400 dark:text-gray-500">
              {msgCount > 0 ? `${msgCount} msg` : "Empty"} · {fmtTime(session.updatedAt)}
            </span>
            {starCount > 0 && (
              <span className="text-[10px] text-yellow-600 dark:text-yellow-400 font-medium">⭐ {starCount}</span>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div
          className={`flex items-center gap-0.5 flex-shrink-0 transition-opacity ${
            isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          }`}
          onClick={e => e.stopPropagation()}
        >
          <button onClick={() => setEditing(true)}
            className="w-6 h-6 rounded-lg flex items-center justify-center text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors">
            <Pencil className="w-3 h-3" />
          </button>
          <button onClick={onPin}
            className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
              session.isPinned ? "text-amber-500" : "text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20"
            }`}>
            {session.isPinned ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
          </button>
          {confirmDelete ? (
            <>
              <button onClick={() => { onDelete(); setConfirmDelete(false); }}
                className="w-6 h-6 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                <Check className="w-3 h-3" />
              </button>
              <button onClick={() => setConfirmDelete(false)}
                className="w-6 h-6 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
                <X className="w-3 h-3" />
              </button>
            </>
          ) : (
            <button onClick={() => setConfirmDelete(true)}
              className="w-6 h-6 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Reaction bar below AI messages ──────────────────────────────────────────

function ReactionBar({
  reactions, onToggle, disabled,
}: {
  reactions?: ChatMessage["reactions"];
  onToggle: (key: ReactionKey) => void;
  disabled: boolean;
}) {
  const hasAny = REACTIONS.some(r => reactions?.[r.key]);

  return (
    <div className={`flex items-center gap-1 mt-1.5 transition-opacity ${
      hasAny
        ? "opacity-100"
        : "opacity-0 group-hover:opacity-100 focus-within:opacity-100"
    }`}>
      {REACTIONS.map(r => {
        const active = !!reactions?.[r.key];
        return (
          <button
            key={r.key}
            onClick={() => !disabled && onToggle(r.key)}
            disabled={disabled}
            title={r.label}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-medium transition-all select-none ${
              active
                ? `${r.activeClass} scale-105`
                : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-600 dark:hover:text-gray-300"
            } ${disabled ? "cursor-default" : "cursor-pointer active:scale-95"}`}
          >
            <span>{r.emoji}</span>
            {active && <span className="leading-none">{r.label}</span>}
          </button>
        );
      })}
    </div>
  );
}

// ─── Sessions panel content (shared between desktop & mobile) ─────────────────

function SessionsPanel({
  tab, setTab, sessions, sessionsLoading, activeSessionId,
  onNew, onSelect, onRename, onPin, onDelete, onJumpToSession,
}: {
  tab: "chats" | "bookmarks";
  setTab: (t: "chats" | "bookmarks") => void;
  sessions: ChatSession[];
  sessionsLoading: boolean;
  activeSessionId: string | null;
  onNew: () => void;
  onSelect: (s: ChatSession) => void;
  onRename: (id: string, title: string) => void;
  onPin: (s: ChatSession) => void;
  onDelete: (s: ChatSession) => void;
  onJumpToSession: (s: ChatSession) => void;
}) {
  const pinnedSessions = sessions.filter(s => s.isPinned);
  const recentSessions = sessions.filter(s => !s.isPinned);

  // Gather all bookmarked (⭐) AI messages across sessions
  const bookmarks: { session: ChatSession; msg: ChatMessage; msgIndex: number }[] = [];
  sessions.forEach(session => {
    (session.messages || []).forEach((msg, idx) => {
      if (msg.role === "assistant" && msg.reactions?.star) {
        bookmarks.push({ session, msg, msgIndex: idx });
      }
    });
  });

  const totalStars = bookmarks.length;

  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <div className="px-3 pt-3.5 pb-2.5 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
            <MessageCircle className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
          </div>
          <span className="text-sm font-bold text-gray-900 dark:text-white">Doubt Chats</span>
        </div>

        {/* Tab strip */}
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-0.5 gap-0.5 mb-2.5">
          <button
            onClick={() => setTab("chats")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-[10px] text-xs font-semibold transition-all ${
              tab === "chats"
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            <MessageSquare className="w-3 h-3" />
            Chats
            {sessions.length > 0 && (
              <span className={`text-[10px] px-1.5 py-0 rounded-full font-bold ${
                tab === "chats" ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300" : "bg-gray-200 dark:bg-gray-700 text-gray-500"
              }`}>{sessions.length}</span>
            )}
          </button>
          <button
            onClick={() => setTab("bookmarks")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-[10px] text-xs font-semibold transition-all ${
              tab === "bookmarks"
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            <Bookmark className="w-3 h-3" />
            Saved
            {totalStars > 0 && (
              <span className={`text-[10px] px-1.5 py-0 rounded-full font-bold ${
                tab === "bookmarks" ? "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300" : "bg-gray-200 dark:bg-gray-700 text-gray-500"
              }`}>{totalStars}</span>
            )}
          </button>
        </div>

        {/* New Chat button — only on Chats tab */}
        {tab === "chats" && (
          <button
            onClick={onNew}
            className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> New Chat
          </button>
        )}
      </div>

      {/* ── CHATS tab ── */}
      {tab === "chats" && (
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
          {sessionsLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-5 h-5 text-gray-300 dark:text-gray-600 animate-spin" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-10 px-4">
              <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-2">
                <MessageSquare className="w-5 h-5 text-gray-300 dark:text-gray-600" />
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed">No chats yet.<br />Ask your first doubt!</p>
            </div>
          ) : (
            <>
              {pinnedSessions.length > 0 && (
                <>
                  <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-2 py-1.5">📌 Pinned</p>
                  {pinnedSessions.map(s => (
                    <SessionItem key={s.id} session={s} isActive={s.id === activeSessionId}
                      onSelect={() => onSelect(s)} onRename={t => onRename(s.id, t)}
                      onPin={() => onPin(s)} onDelete={() => onDelete(s)} />
                  ))}
                  {recentSessions.length > 0 && (
                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-2 py-1.5 pt-3">Recent</p>
                  )}
                </>
              )}
              {recentSessions.map(s => (
                <SessionItem key={s.id} session={s} isActive={s.id === activeSessionId}
                  onSelect={() => onSelect(s)} onRename={t => onRename(s.id, t)}
                  onPin={() => onPin(s)} onDelete={() => onDelete(s)} />
              ))}
            </>
          )}
        </div>
      )}

      {/* ── BOOKMARKS tab ── */}
      {tab === "bookmarks" && (
        <div className="flex-1 overflow-y-auto px-2 py-2.5">
          {bookmarks.length === 0 ? (
            <div className="text-center py-10 px-4">
              <div className="w-12 h-12 bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">⭐</span>
              </div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">No saved answers yet</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
                Tap ⭐ on any AI reply to save it here for quick review later.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1 pb-1">
                ⭐ {bookmarks.length} saved answer{bookmarks.length !== 1 ? "s" : ""}
              </p>
              {bookmarks.map(({ session, msg, msgIndex }, i) => (
                <button
                  key={`${session.id}-${msgIndex}`}
                  onClick={() => onJumpToSession(session)}
                  className="w-full text-left bg-white dark:bg-gray-800 border border-yellow-100 dark:border-yellow-900/30 hover:border-yellow-300 dark:hover:border-yellow-700/50 rounded-2xl p-3 transition-all group/bk"
                >
                  {/* Session label */}
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="text-[10px] font-semibold text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30 px-2 py-0.5 rounded-full truncate max-w-[160px]">
                      {session.title}
                    </span>
                    {msg.reactions?.thumbsUp && <span className="text-[11px]">👍</span>}
                    {msg.reactions?.lightbulb && <span className="text-[11px]">💡</span>}
                  </div>

                  {/* Answer snippet */}
                  <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-3">
                    {msg.content}
                  </p>

                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1.5 group-hover/bk:text-green-600 dark:group-hover/bk:text-green-400 transition-colors">
                    Tap to open chat →
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-800 flex-shrink-0">
        <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center">
          {sessions.length} chat{sessions.length !== 1 ? "s" : ""} · Auto-saved
        </p>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function DoubtChat({
  chapterName, subject, language, chapterText, chapterId, userId,
}: DoubtChatProps) {
  const [sessions, setSessions]               = useState<ChatSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages]               = useState<ChatMessage[]>([]);
  const [input, setInput]                     = useState("");
  const [loading, setLoading]                 = useState(false);
  const [error, setError]                     = useState("");
  const [showSessions, setShowSessions]       = useState(true);
  const [streamingText, setStreamingText]     = useState<string | null>(null);
  const [sidebarTab, setSidebarTab]           = useState<"chats" | "bookmarks">("chats");

  const bottomRef     = useRef<HTMLDivElement>(null);
  const inputRef      = useRef<HTMLTextAreaElement>(null);
  const typewriterRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isHindi   = language === "hindi";
  const suggestions = isHindi ? SUGGESTIONS_HI : SUGGESTIONS_EN;

  useEffect(() => {
    if (!userId || !chapterId) return;
    setSessionsLoading(true);
    return subscribeChatSessions(userId, chapterId, (s) => {
      setSessions(s);
      setSessionsLoading(false);
    });
  }, [userId, chapterId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  const selectSession = useCallback((session: ChatSession) => {
    setActiveSessionId(session.id);
    setMessages(session.messages || []);
    setError("");
    setInput("");
    setShowSessions(false);
    setTimeout(() => inputRef.current?.focus(), 150);
  }, []);

  const startNewChat = useCallback(() => {
    setActiveSessionId(null);
    setMessages([]);
    setError("");
    setInput("");
    setShowSessions(false);
    setTimeout(() => inputRef.current?.focus(), 150);
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    if (typewriterRef.current) { clearInterval(typewriterRef.current); typewriterRef.current = null; }

    const userMsg: ChatMessage = { role: "user", content: trimmed };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setError("");
    setLoading(true);
    setStreamingText("");

    const capturedSessionId = activeSessionId;
    const isFirstMessage    = messages.length === 0;
    const autoTitle         = isFirstMessage ? makeTitle(trimmed) : undefined;

    try {
      const data = await sendChatMessage(newMessages, chapterText, chapterName, subject, language);
      const fullReply: string = data.reply || "";

      await new Promise<void>((resolve) => {
        if (!fullReply) { resolve(); return; }
        let index = 0;
        typewriterRef.current = setInterval(() => {
          index = Math.min(index + 8, fullReply.length);
          setStreamingText(fullReply.slice(0, index));
          if (index >= fullReply.length) {
            if (typewriterRef.current) { clearInterval(typewriterRef.current); typewriterRef.current = null; }
            resolve();
          }
        }, 20);
      });

      const reply: ChatMessage = { role: "assistant", content: fullReply };
      const finalMessages = [...newMessages, reply];
      setMessages(finalMessages);
      setStreamingText(null);

      let sessionId = capturedSessionId;
      if (!sessionId) {
        sessionId = await createChatSession(userId, chapterId, chapterName, subject, autoTitle || "New Chat");
        setActiveSessionId(sessionId);
      }
      await saveChatMessages(sessionId, finalMessages, autoTitle);
    } catch {
      if (typewriterRef.current) { clearInterval(typewriterRef.current); typewriterRef.current = null; }
      setError(isHindi ? "जवाब नहीं मिला। दोबारा कोशिश करो।" : "Could not get a response. Please try again.");
      setMessages(prev => prev.slice(0, -1));
      setStreamingText(null);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [loading, messages, activeSessionId, userId, chapterId, chapterName, subject, language, chapterText, isHindi]);

  // ── Toggle a reaction on an AI message ────────────────────────────────────
  const toggleReaction = useCallback(async (msgIndex: number, reaction: ReactionKey) => {
    const msg = messages[msgIndex];
    if (!msg || msg.role !== "assistant") return;

    const updated: ChatMessage = {
      ...msg,
      reactions: {
        ...msg.reactions,
        [reaction]: !msg.reactions?.[reaction],
      },
    };
    const updatedMessages = messages.map((m, i) => i === msgIndex ? updated : m);
    setMessages(updatedMessages);

    if (activeSessionId) {
      try { await saveChatMessages(activeSessionId, updatedMessages); }
      catch { /* silent — reactions are best-effort */ }
    }
  }, [messages, activeSessionId]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  const handleRename = async (sessionId: string, title: string) => { await renameChatSession(sessionId, title); };
  const handlePin    = async (session: ChatSession)              => { await toggleChatPin(session.id, !session.isPinned); };
  const handleDelete = async (session: ChatSession)              => {
    await deleteChatSession(session.id);
    if (activeSessionId === session.id) { setActiveSessionId(null); setMessages([]); setShowSessions(true); }
  };

  const activeSession = sessions.find(s => s.id === activeSessionId);

  const sessionsPanel = (
    <SessionsPanel
      tab={sidebarTab} setTab={setSidebarTab}
      sessions={sessions} sessionsLoading={sessionsLoading}
      activeSessionId={activeSessionId}
      onNew={startNewChat}
      onSelect={selectSession}
      onRename={handleRename}
      onPin={handlePin}
      onDelete={handleDelete}
      onJumpToSession={(s) => { selectSession(s); setSidebarTab("chats"); }}
    />
  );

  return (
    <div
      className="flex relative rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm"
      style={{ height: "calc(100dvh - 5rem)", minHeight: "520px" }}
    >

      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex flex-col w-64 border-r border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-950/60 flex-shrink-0">
        {sessionsPanel}
      </aside>

      {/* ── Mobile: slide-in backdrop ── */}
      <div
        className={`md:hidden absolute inset-0 z-30 transition-opacity duration-300 ${
          showSessions ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
        onClick={() => { if (sessions.length > 0 || messages.length > 0) setShowSessions(false); }}
      />

      {/* ── Mobile: slide-in panel ── */}
      <aside className={`md:hidden absolute inset-y-0 left-0 z-40 w-72 flex flex-col bg-white dark:bg-gray-900 shadow-2xl transition-transform duration-300 ease-in-out ${
        showSessions ? "translate-x-0" : "-translate-x-full"
      }`}>
        {/* Close button row */}
        <div className="flex items-center justify-end px-3 pt-3 pb-0 flex-shrink-0">
          <button
            onClick={() => { if (messages.length > 0 || sessions.length > 0) setShowSessions(false); }}
            className="w-7 h-7 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {sessionsPanel}
      </aside>

      {/* ════════════════════════════════════
          CHAT PANEL
          ════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0 bg-gray-50 dark:bg-gray-950">

        {/* Header */}
        <div className="flex-shrink-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2.5 px-4 py-3">
            {/* Mobile back button */}
            <button
              className="md:hidden w-8 h-8 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
              onClick={() => setShowSessions(true)}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* AI avatar */}
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-sm">
              <Sparkles className="w-4 h-4 text-white" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                  {activeSession ? activeSession.title : (isHindi ? "नया Doubt Chat" : "New Doubt Chat")}
                </h3>
                {activeSession?.isPinned && <Pin className="w-3 h-3 text-amber-500 flex-shrink-0" />}
              </div>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">
                {subject} · {chapterName}
              </p>
            </div>

            {activeSession && (
              <button
                onClick={() => handlePin(activeSession)}
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors flex-shrink-0 ${
                  activeSession.isPinned
                    ? "text-amber-500 bg-amber-50 dark:bg-amber-900/20"
                    : "text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                }`}
              >
                {activeSession.isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5 min-h-0">

          {/* Empty / welcome state */}
          {messages.length === 0 && streamingText === null && !loading && (
            <div className="flex flex-col items-center justify-center h-full py-4 text-center">
              <div className="relative mb-5">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-200 dark:shadow-green-900/30">
                  <Bot className="w-10 h-10 text-white" />
                </div>
                <span className="absolute -top-1 -right-1 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center text-xs shadow-sm">✨</span>
              </div>
              <h3 className="text-lg font-black text-gray-900 dark:text-white mb-1.5">
                {isHindi ? "कुछ भी पूछो!" : "Ask me anything!"}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-xs leading-relaxed">
                {isHindi
                  ? `${chapterName} का AI tutor। हर doubt का जवाब हिंदी या English में।`
                  : `Your AI tutor for ${chapterName}. Ask in Hindi or English.`}
              </p>
              <div className="w-full max-w-sm">
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 mb-2.5 text-center uppercase tracking-wide">Try these →</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {suggestions.map((q, i) => (
                    <button key={i} onClick={() => sendMessage(q)}
                      className="text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-green-400 dark:hover:border-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 text-gray-700 dark:text-gray-300 hover:text-green-700 dark:hover:text-green-300 rounded-2xl px-4 py-2 transition-all font-medium active:scale-[0.97] shadow-sm">
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Message bubbles */}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex items-end gap-2.5 group ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            >
              {/* Avatar */}
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mb-0.5 ${
                msg.role === "user"
                  ? "bg-green-600 shadow-sm shadow-green-200 dark:shadow-green-900/30"
                  : "bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800"
              }`}>
                {msg.role === "user"
                  ? <User className="w-3.5 h-3.5 text-white" />
                  : <Bot className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                }
              </div>

              {/* Bubble + reactions */}
              <div className={`max-w-[78%] flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                  msg.role === "user"
                    ? "bg-green-600 text-white rounded-br-sm shadow-green-200/50 dark:shadow-green-900/30"
                    : "bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60 text-gray-800 dark:text-gray-100 rounded-bl-sm"
                }`} style={{ whiteSpace: "pre-wrap" }}>
                  {msg.content}
                </div>

                {/* Reaction bar — only on AI messages */}
                {msg.role === "assistant" && (
                  <ReactionBar
                    reactions={msg.reactions}
                    onToggle={(key) => toggleReaction(i, key)}
                    disabled={loading}
                  />
                )}
              </div>
            </div>
          ))}

          {/* Streaming bubble */}
          {streamingText !== null && (
            <div className="flex items-end gap-2.5">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center flex-shrink-0 mb-0.5">
                <Bot className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
              </div>
              <div className="max-w-[78%] bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60 rounded-2xl rounded-bl-sm px-4 py-3 text-sm leading-relaxed text-gray-800 dark:text-gray-100 shadow-sm"
                style={{ whiteSpace: "pre-wrap" }}>
                {streamingText ? (
                  <>
                    {streamingText}
                    <span className="inline-block w-[2px] h-[1em] bg-green-500 ml-0.5 align-middle animate-pulse" />
                  </>
                ) : (
                  <span className="flex gap-1.5 items-center h-5">
                    {[0, 1, 2].map(i => (
                      <span key={i}
                        className="w-2 h-2 bg-gray-300 dark:bg-gray-500 rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 150}ms`, animationDuration: "0.9s" }} />
                    ))}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex justify-center">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/40 text-red-600 dark:text-red-400 text-xs rounded-2xl px-4 py-2">
                {error}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <div className="flex-shrink-0 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 px-3 py-3">
          <div className={`flex items-end gap-2.5 bg-gray-50 dark:bg-gray-800 border rounded-2xl px-4 py-2.5 transition-all ${
            input.trim() ? "border-green-300 dark:border-green-700 shadow-sm shadow-green-100 dark:shadow-green-900/20" : "border-gray-200 dark:border-gray-700"
          }`}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isHindi ? "अपना doubt यहाँ टाइप करो…" : "Type your question here…"}
              rows={1}
              style={{ resize: "none", minHeight: "36px", maxHeight: "120px" }}
              className="flex-1 text-sm bg-transparent outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 leading-relaxed overflow-y-auto"
              onInput={e => {
                const t = e.target as HTMLTextAreaElement;
                t.style.height = "auto";
                t.style.height = Math.min(t.scrollHeight, 120) + "px";
              }}
              disabled={loading}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                input.trim() && !loading
                  ? "bg-green-600 hover:bg-green-700 active:bg-green-800 shadow-sm shadow-green-200 dark:shadow-green-900/30"
                  : "bg-gray-200 dark:bg-gray-700 opacity-50 cursor-not-allowed"
              }`}
            >
              {loading
                ? <Loader2 className="w-4 h-4 text-white animate-spin" />
                : <Send className={`w-4 h-4 ${input.trim() ? "text-white" : "text-gray-400"}`} />
              }
            </button>
          </div>
          <p className="text-[10px] text-gray-300 dark:text-gray-700 text-center mt-1.5 leading-none">
            Enter to send · Shift+Enter for new line
          </p>
        </div>

      </div>
    </div>
  );
}
