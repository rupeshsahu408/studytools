import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, MessageCircle, RefreshCw } from "lucide-react";
import { sendChatMessage } from "../lib/api";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface DoubtChatProps {
  chapterName: string;
  subject: string;
  language: string;
  chapterText: string;
}

const SUGGESTED_QUESTIONS_EN = [
  "Can you explain the main concept of this chapter?",
  "What are the most important formulas I need to remember?",
  "How do I solve a typical board exam question from this chapter?",
  "Give me a simple real-world example for this chapter.",
];

const SUGGESTED_QUESTIONS_HI = [
  "इस chapter का main concept समझाओ",
  "कौन से formulas सबसे जरूरी हैं?",
  "Board exam में इस chapter से कैसे प्रश्न आते हैं?",
  "एक आसान real-world example दो",
];

export default function DoubtChat({ chapterName, subject, language, chapterText }: DoubtChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const isHindi = language === "hindi";
  const suggestedQs = isHindi ? SUGGESTED_QUESTIONS_HI : SUGGESTED_QUESTIONS_EN;

  // Auto scroll to bottom when new message arrives
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const newMessages: Message[] = [...messages, { role: "user", content: trimmed }];
    setMessages(newMessages);
    setInput("");
    setError("");
    setLoading(true);

    try {
      const data = await sendChatMessage(
        newMessages,
        chapterText,
        chapterName,
        subject,
        language
      );
      setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
    } catch (err: any) {
      setError("Could not get a response. Please try again.");
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError("");
    setInput("");
  };

  return (
    <div className="max-w-3xl flex flex-col" style={{ height: "calc(100vh - 10rem)" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-green-600" /> Doubt Solver
        </h2>
        {messages.length > 0 && (
          <button onClick={clearChat}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-green-600 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" /> New Chat
          </button>
        )}
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4 min-h-0">
        {/* Welcome state */}
        {messages.length === 0 && !loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bot className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-1">
              {isHindi ? `${chapterName} के बारे में कुछ पूछो` : `Ask me anything about ${chapterName}`}
            </h3>
            <p className="text-sm text-gray-400 dark:text-gray-500 mb-6">
              {isHindi
                ? "मैं इस chapter का expert हूं। कोई भी doubt पूछो!"
                : "I'm your expert tutor for this chapter. Ask anything!"}
            </p>
            {/* Suggested questions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left max-w-lg mx-auto">
              {suggestedQs.map((q, i) => (
                <button key={i} onClick={() => sendMessage(q)}
                  className="text-left text-sm bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:border-green-300 dark:hover:border-green-700 rounded-xl px-4 py-3 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-all">
                  {q}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Messages */}
        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-start gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              {/* Avatar */}
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.role === "user"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
              }`}>
                {msg.role === "user" ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>

              {/* Bubble */}
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-green-600 text-white rounded-tr-sm"
                  : "bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-sm"
              }`}
                style={{ whiteSpace: "pre-wrap" }}>
                {msg.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
              <Bot className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
            </div>
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1.5 items-center">
                {[0, 1, 2].map(i => (
                  <motion.div key={i} className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full"
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }} />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Error */}
        {error && (
          <div className="text-center text-xs text-red-500 dark:text-red-400">{error}</div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="flex-shrink-0 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-3 flex items-end gap-3">
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isHindi ? "अपना doubt यहाँ टाइप करो..." : "Type your question here..."}
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
          className="w-9 h-9 bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl flex items-center justify-center flex-shrink-0 transition-colors">
          <Send className="w-4 h-4 text-white" />
        </button>
      </div>
      <p className="text-xs text-gray-300 dark:text-gray-700 text-center mt-2">
        Press Enter to send · Shift+Enter for new line
      </p>
    </div>
  );
}
