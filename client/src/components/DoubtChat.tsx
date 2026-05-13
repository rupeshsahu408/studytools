import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send, Bot, User, MessageCircle, Plus, Pin, PinOff,
  Trash2, Pencil, Check, X, ChevronLeft, MessageSquare,
  Loader2, Sparkles,
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
        {/* Session icon */}
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
          </div>
        </div>

        {/* Actions */}
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

  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLTextAreaElement>(null);
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  const handleRename = async (sessionId: string, title: string) => { await renameChatSession(sessionId, title); };
  const handlePin    = async (session: ChatSession)              => { await toggleChatPin(session.id, !session.isPinned); };
  const handleDelete = async (session: ChatSession)              => {
    await deleteChatSession(session.id);
    if (activeSessionId === session.id) { setActiveSessionId(null); setMessages([]); setShowSessions(true); }
  };

  const pinnedSessions  = sessions.filter(s => s.isPinned);
  const recentSessions  = sessions.filter(s => !s.isPinned);
  const activeSession   = sessions.find(s => s.id === activeSessionId);

  return (
    <div
      className="flex relative rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm"
      style={{ height: "calc(100dvh - 5rem)", minHeight: "480px" }}
    >

      {/* ════════════════════════════════════
          SESSIONS PANEL
          ════════════════════════════════════ */}

      {/* Desktop: always-visible sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-950/60 flex-shrink-0">
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
              <MessageCircle className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
            </div>
            <span className="text-sm font-bold text-gray-900 dark:text-white">Doubt Chats</span>
          </div>
          <button
            onClick={startNewChat}
            className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> New Chat
          </button>
        </div>

        {/* Session list */}
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
                      onSelect={() => selectSession(s)} onRename={t => handleRename(s.id, t)}
                      onPin={() => handlePin(s)} onDelete={() => handleDelete(s)} />
                  ))}
                  {recentSessions.length > 0 && <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-2 py-1.5 pt-3">Recent</p>}
                </>
              )}
              {recentSessions.map(s => (
                <SessionItem key={s.id} session={s} isActive={s.id === activeSessionId}
                  onSelect={() => selectSession(s)} onRename={t => handleRename(s.id, t)}
                  onPin={() => handlePin(s)} onDelete={() => handleDelete(s)} />
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800">
          <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center">
            {sessions.length} chat{sessions.length !== 1 ? "s" : ""} · Auto-saved
          </p>
        </div>
      </aside>

      {/* Mobile: animated slide-in sessions panel */}
      <>
        {/* Backdrop */}
        <div
          className={`md:hidden absolute inset-0 z-30 transition-opacity duration-300 ${
            showSessions ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
          style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
          onClick={() => { if (sessions.length > 0 || messages.length > 0) setShowSessions(false); }}
        />

        {/* Slide panel */}
        <aside className={`md:hidden absolute inset-y-0 left-0 z-40 w-72 flex flex-col bg-white dark:bg-gray-900 shadow-2xl transition-transform duration-300 ease-in-out ${
          showSessions ? "translate-x-0" : "-translate-x-full"
        }`}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                <MessageCircle className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-sm font-bold text-gray-900 dark:text-white">Doubt Chats</span>
            </div>
            <button
              onClick={() => { if (messages.length > 0 || sessions.length > 0) setShowSessions(false); }}
              className="w-7 h-7 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* New Chat button */}
          <div className="px-3 pt-3 pb-2">
            <button
              onClick={startNewChat}
              className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-3 rounded-2xl transition-colors shadow-sm active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" /> New Chat
            </button>
          </div>

          {/* Session list */}
          <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5">
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
                        onSelect={() => selectSession(s)} onRename={t => handleRename(s.id, t)}
                        onPin={() => handlePin(s)} onDelete={() => handleDelete(s)} />
                    ))}
                    {recentSessions.length > 0 && <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-2 py-1.5 pt-3">Recent</p>}
                  </>
                )}
                {recentSessions.map(s => (
                  <SessionItem key={s.id} session={s} isActive={s.id === activeSessionId}
                    onSelect={() => selectSession(s)} onRename={t => handleRename(s.id, t)}
                    onPin={() => handlePin(s)} onDelete={() => handleDelete(s)} />
                ))}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800">
            <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center">
              {sessions.length} chat{sessions.length !== 1 ? "s" : ""} · Auto-saved after each reply
            </p>
          </div>
        </aside>
      </>

      {/* ════════════════════════════════════
          CHAT PANEL
          ════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0 bg-gray-50 dark:bg-gray-950">

        {/* Chat panel header */}
        <div className="flex-shrink-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">

          {/* Top row — back button + title + sessions toggle */}
          <div className="flex items-center gap-2.5 px-4 py-3">
            {/* Mobile: back to sessions */}
            <button
              className="md:hidden w-8 h-8 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
              onClick={() => setShowSessions(true)}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* AI avatar */}
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-sm">
              <Sparkles className="w-4.5 h-4.5 text-white w-4 h-4" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                  {activeSession
                    ? activeSession.title
                    : isHindi ? "नया Doubt Chat" : "New Doubt Chat"
                  }
                </h3>
                {activeSession?.isPinned && <Pin className="w-3 h-3 text-amber-500 flex-shrink-0" />}
              </div>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">
                {subject} · {chapterName}
              </p>
            </div>

            {/* Actions for active session */}
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
              {/* AI Illustration */}
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

              {/* Suggestion chips — horizontal scroll on mobile */}
              <div className="w-full max-w-sm">
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 mb-2.5 text-center uppercase tracking-wide">
                  {isHindi ? "Try these →" : "Try these →"}
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {suggestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(q)}
                      className="text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-green-400 dark:hover:border-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 text-gray-700 dark:text-gray-300 hover:text-green-700 dark:hover:text-green-300 rounded-2xl px-4 py-2 transition-all font-medium active:scale-[0.97] shadow-sm"
                    >
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
              className={`flex items-end gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
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

              {/* Bubble */}
              <div className={`max-w-[78%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col gap-1`}>
                <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                  msg.role === "user"
                    ? "bg-green-600 text-white rounded-br-sm shadow-green-200/50 dark:shadow-green-900/30"
                    : "bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60 text-gray-800 dark:text-gray-100 rounded-bl-sm"
                }`} style={{ whiteSpace: "pre-wrap" }}>
                  {msg.content}
                </div>
              </div>
            </div>
          ))}

          {/* Streaming / typing bubble */}
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

        {/* ── Input bar ── */}
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
                  ? "bg-green-600 hover:bg-green-700 active:bg-green-800 shadow-sm shadow-green-200 dark:shadow-green-900/30 scale-100"
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
