import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send, Bot, User, MessageCircle, Plus, Pin, PinOff,
  Trash2, Pencil, Check, X, ChevronLeft, MessageSquare,
  Clock, Loader2,
} from "lucide-react";
import { streamChatMessage } from "../lib/api";
import {
  subscribeChatSessions, createChatSession, saveChatMessages,
  renameChatSession, toggleChatPin, deleteChatSession,
} from "../lib/firestore";
import type { ChatSession, ChatMessage } from "../lib/firestore";

// ─── Props ────────────────────────────────────────────────────────────────────

interface DoubtChatProps {
  chapterName: string;
  subject: string;
  language: string;
  chapterText: string;
  chapterId: string;
  userId: string;
}

// ─── Suggested questions ──────────────────────────────────────────────────────

const SUGGESTIONS_EN = [
  "Explain the main concept of this chapter",
  "What formulas must I memorise for the board exam?",
  "How do I solve a typical exam question from this chapter?",
  "Give me a real-world example for a key concept here",
];
const SUGGESTIONS_HI = [
  "इस chapter का main concept समझाओ",
  "Board exam के लिए कौन से formulas जरूरी हैं?",
  "इस chapter से exam में कैसे प्रश्न आते हैं?",
  "एक आसान real-world example दो",
];

// ─── Time formatting ──────────────────────────────────────────────────────────

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

// ─── Auto-title from first message ───────────────────────────────────────────

function makeTitle(msg: string): string {
  const t = msg.trim().replace(/\s+/g, " ");
  return t.length > 42 ? t.slice(0, 42) + "…" : t;
}

// ─── Session list item ────────────────────────────────────────────────────────

function SessionItem({
  session, isActive, onSelect, onRename, onPin, onDelete,
}: {
  session: ChatSession;
  isActive: boolean;
  onSelect: () => void;
  onRename: (title: string) => void;
  onPin: () => void;
  onDelete: () => void;
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

  return (
    <div
      className={`group relative rounded-xl px-3 py-2.5 cursor-pointer transition-all ${
        isActive
          ? "bg-green-50 dark:bg-green-900/20 ring-1 ring-green-200 dark:ring-green-800"
          : "hover:bg-gray-50 dark:hover:bg-gray-800/60"
      }`}
      onClick={() => { if (!editing) onSelect(); }}
    >
      {/* Title row */}
      <div className="flex items-start gap-1.5 mb-0.5">
        {session.isPinned && !editing && (
          <Pin className="w-3 h-3 text-amber-500 flex-shrink-0 mt-0.5" />
        )}
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
            className="flex-1 text-xs font-medium bg-white dark:bg-gray-900 border border-green-300 dark:border-green-700 rounded px-1.5 py-0.5 text-gray-900 dark:text-white outline-none min-w-0"
          />
        ) : (
          <span className={`flex-1 text-xs font-medium leading-snug truncate ${
            isActive ? "text-green-700 dark:text-green-400" : "text-gray-700 dark:text-gray-300"
          }`}>
            {session.title}
          </span>
        )}
      </div>

      {/* Meta row */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-gray-400 dark:text-gray-500">
          {session.messages.length > 0 && `${Math.ceil(session.messages.length / 2)} msg · `}
          {fmtTime(session.updatedAt)}
        </span>

        {/* Action icons — visible on hover or when active */}
        <div className={`flex items-center gap-1 transition-opacity ${
          isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`} onClick={e => e.stopPropagation()}>
          {/* Rename */}
          <button
            onClick={() => setEditing(true)}
            className="w-5 h-5 rounded flex items-center justify-center text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
            title="Rename"
          >
            <Pencil className="w-3 h-3" />
          </button>

          {/* Pin / Unpin */}
          <button
            onClick={onPin}
            className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
              session.isPinned
                ? "text-amber-500 hover:text-amber-700"
                : "text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20"
            }`}
            title={session.isPinned ? "Unpin" : "Pin"}
          >
            {session.isPinned ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
          </button>

          {/* Delete */}
          {confirmDelete ? (
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => { onDelete(); setConfirmDelete(false); }}
                className="w-5 h-5 rounded flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                title="Confirm delete"
              >
                <Check className="w-3 h-3" />
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="w-5 h-5 rounded flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                title="Cancel"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="w-5 h-5 rounded flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function DoubtChat({
  chapterName, subject, language, chapterText, chapterId, userId,
}: DoubtChatProps) {
  const [sessions, setSessions]           = useState<ChatSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages]           = useState<ChatMessage[]>([]);
  const [input, setInput]                 = useState("");
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState("");
  const [showSidebar, setShowSidebar]     = useState(true); // mobile toggle
  const [streamingText, setStreamingText] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);

  const isHindi = language === "hindi";
  const suggestions = isHindi ? SUGGESTIONS_HI : SUGGESTIONS_EN;

  // ── Subscribe to sessions ──────────────────────────────────────────────────
  useEffect(() => {
    if (!userId || !chapterId) return;
    setSessionsLoading(true);
    const unsub = subscribeChatSessions(userId, chapterId, (s) => {
      setSessions(s);
      setSessionsLoading(false);
    });
    return unsub;
  }, [userId, chapterId]);

  // ── Auto-scroll ────────────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // ── Select a session ───────────────────────────────────────────────────────
  const selectSession = useCallback((session: ChatSession) => {
    setActiveSessionId(session.id);
    setMessages(session.messages || []);
    setError("");
    setInput("");
    setShowSidebar(false); // on mobile, hide sidebar when session selected
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  // ── Start a new (unsaved) chat ─────────────────────────────────────────────
  const startNewChat = useCallback(() => {
    setActiveSessionId(null);
    setMessages([]);
    setError("");
    setInput("");
    setShowSidebar(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  // ── Send a message (streaming) ─────────────────────────────────────────────
  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: ChatMessage = { role: "user", content: trimmed };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setError("");
    setLoading(true);
    setStreamingText(""); // empty string = streaming started, bubble is visible

    // Capture these at call-time to avoid stale-closure issues in the async flow
    const capturedSessionId = activeSessionId;
    const capturedIsFirst   = messages.length === 0;
    const autoTitle         = capturedIsFirst ? makeTitle(trimmed) : undefined;

    try {
      const fullReply = await streamChatMessage(
        newMessages,
        chapterText,
        chapterName,
        subject,
        language,
        (fullText) => setStreamingText(fullText)
      );

      const reply: ChatMessage = { role: "assistant", content: fullReply };
      const finalMessages = [...newMessages, reply];
      setMessages(finalMessages);
      setStreamingText(null);

      // Persist to Firestore
      let sessionId = capturedSessionId;
      if (!sessionId) {
        sessionId = await createChatSession(userId, chapterId, chapterName, subject, autoTitle || "New Chat");
        setActiveSessionId(sessionId);
      }
      await saveChatMessages(sessionId, finalMessages, autoTitle);

    } catch {
      setError(isHindi ? "जवाब नहीं मिला। दोबारा कोशिश करो।" : "Could not get a response. Please try again.");
      setMessages(prev => prev.slice(0, -1));
      setStreamingText(null);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [loading, messages, activeSessionId, userId, chapterId, chapterName, subject, language, chapterText, isHindi]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  // ── Session actions ────────────────────────────────────────────────────────
  const handleRename = async (sessionId: string, title: string) => {
    await renameChatSession(sessionId, title);
  };

  const handlePin = async (session: ChatSession) => {
    await toggleChatPin(session.id, !session.isPinned);
  };

  const handleDelete = async (session: ChatSession) => {
    await deleteChatSession(session.id);
    if (activeSessionId === session.id) {
      setActiveSessionId(null);
      setMessages([]);
      setShowSidebar(true);
    }
  };

  // ── Sidebar content ────────────────────────────────────────────────────────
  const pinnedSessions  = sessions.filter(s => s.isPinned);
  const recentSessions  = sessions.filter(s => !s.isPinned);
  const activeSession   = sessions.find(s => s.id === activeSessionId);

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Sidebar header */}
      <div className="p-3 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
        <button
          onClick={startNewChat}
          className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </button>
      </div>

      {/* Sessions list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {sessionsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-8 px-3">
            <MessageSquare className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-xs text-gray-400 dark:text-gray-500">
              No chats yet. Ask your first doubt!
            </p>
          </div>
        ) : (
          <>
            {pinnedSessions.length > 0 && (
              <>
                <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide px-2 pt-1 pb-0.5">
                  📌 Pinned
                </p>
                {pinnedSessions.map(s => (
                  <SessionItem key={s.id} session={s} isActive={s.id === activeSessionId}
                    onSelect={() => selectSession(s)}
                    onRename={title => handleRename(s.id, title)}
                    onPin={() => handlePin(s)}
                    onDelete={() => handleDelete(s)}
                  />
                ))}
                {recentSessions.length > 0 && (
                  <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide px-2 pt-2 pb-0.5">
                    Recent
                  </p>
                )}
              </>
            )}
            {recentSessions.map(s => (
              <SessionItem key={s.id} session={s} isActive={s.id === activeSessionId}
                onSelect={() => selectSession(s)}
                onRename={title => handleRename(s.id, title)}
                onPin={() => handlePin(s)}
                onDelete={() => handleDelete(s)}
              />
            ))}
          </>
        )}
      </div>

      {/* Sidebar footer */}
      <div className="p-3 border-t border-gray-100 dark:border-gray-800 flex-shrink-0">
        <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center">
          {sessions.length} chat{sessions.length !== 1 ? "s" : ""} saved · Auto-saved after each reply
        </p>
      </div>
    </div>
  );

  // ── Chat panel content ─────────────────────────────────────────────────────
  const chatPanel = (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="flex-shrink-0 flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        {/* Mobile: back to sessions */}
        <button
          className="md:hidden flex-shrink-0 text-gray-400 hover:text-green-600 transition-colors"
          onClick={() => setShowSidebar(true)}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex-1 min-w-0">
          {activeSession ? (
            <div className="flex items-center gap-1.5">
              {activeSession.isPinned && <Pin className="w-3 h-3 text-amber-500 flex-shrink-0" />}
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                {activeSession.title}
              </h3>
            </div>
          ) : (
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              {isHindi ? "नया Doubt Chat" : "New Doubt Chat"}
            </h3>
          )}
          <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
            {chapterName} · {subject}
          </p>
        </div>

        {activeSession && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => handlePin(activeSession)}
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                activeSession.isPinned
                  ? "text-amber-500 bg-amber-50 dark:bg-amber-900/20"
                  : "text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20"
              }`}
              title={activeSession.isPinned ? "Unpin" : "Pin this chat"}
            >
              {activeSession.isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
        {/* Welcome / empty state */}
        {messages.length === 0 && !loading && (
          <div className="text-center py-8">
            <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Bot className="w-7 h-7 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-1 text-sm">
              {isHindi ? `${chapterName} — कुछ भी पूछो!` : `Ask anything about ${chapterName}`}
            </h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-5">
              {isHindi
                ? "मैं इस chapter का expert हूं। Chat automatically save होती है।"
                : "Your expert tutor for this chapter. Chats are automatically saved."}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-md mx-auto">
              {suggestions.map((q, i) => (
                <button key={i} onClick={() => sendMessage(q)}
                  className="text-left text-xs bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:border-green-300 dark:hover:border-green-700 rounded-xl px-3 py-2.5 text-gray-600 dark:text-gray-400 hover:text-green-700 dark:hover:text-green-400 transition-all">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        
          {messages.map((msg, i) => (
            <div key={i}
              className={`flex items-start gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.role === "user"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
              }`}>
                {msg.role === "user" ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>
              <div className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-green-600 text-white rounded-tr-sm"
                  : "bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-sm"
              }`} style={{ whiteSpace: "pre-wrap" }}>
                {msg.content}
              </div>
            </div>
          ))}
        

        {/* Streaming bubble — shows text progressively as it arrives, ChatGPT-style */}
        {streamingText !== null && (
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
              <Bot className="w-3.5 h-3.5 text-gray-500" />
            </div>
            <div className="max-w-[78%] bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm leading-relaxed text-gray-800 dark:text-gray-200"
              style={{ whiteSpace: "pre-wrap" }}>
              {streamingText || (
                <span className="flex gap-1.5 items-center py-0.5">
                  {[0, 1, 2].map(i => (
                    <span key={i} className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce inline-block"
                      style={{ animationDelay: `${i * 150}ms`, animationDuration: "0.9s" }} />
                  ))}
                </span>
              )}
              {streamingText && (
                <span className="inline-block w-[2px] h-[1em] bg-green-500 ml-0.5 align-middle animate-pulse" />
              )}
            </div>
          </div>
        )}

        {/* Error */}
        {error && <div className="text-center text-xs text-red-500 dark:text-red-400 py-1">{error}</div>}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-4 pb-4 pt-2">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-3 flex items-end gap-3">
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
            className="w-9 h-9 bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
          >
            {loading ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" />}
          </button>
        </div>
        <p className="text-[10px] text-gray-300 dark:text-gray-700 text-center mt-1.5">
          Enter to send · Shift+Enter for new line · Auto-saved after each reply
        </p>
      </div>
    </div>
  );

  // ── Layout ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden bg-gray-50 dark:bg-gray-950"
      style={{ height: "calc(100vh - 9rem)" }}>

      {/* ── Desktop sidebar (always visible) ── */}
      <aside className="hidden md:flex flex-col w-60 border-r border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex-shrink-0">
        {sidebarContent}
      </aside>

      {/* ── Mobile sidebar (overlay) ── */}
      
        {showSidebar && (
          <aside
            className="md:hidden absolute inset-y-0 left-0 z-30 w-72 flex flex-col border-r border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl"
          >
            <div className="flex items-center justify-between px-3 pt-3 pb-1">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm font-bold text-gray-900 dark:text-white">Doubt Chats</span>
              </div>
              <button onClick={() => setShowSidebar(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            {sidebarContent}
          </aside>
        )}
      

      {/* ── Mobile overlay backdrop ── */}
      {showSidebar && (
        <div
          className="md:hidden absolute inset-0 z-20 bg-black/30"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* ── Chat panel (main) ── */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Mobile: show sessions toggle button when chat is open */}
        {!showSidebar && (
          <button
            className="md:hidden absolute top-3 left-3 z-10 w-8 h-8 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg flex items-center justify-center text-gray-500 shadow-sm"
            onClick={() => setShowSidebar(true)}
          >
            <MessageCircle className="w-4 h-4" />
          </button>
        )}
        {chatPanel}
      </div>
    </div>
  );
}
