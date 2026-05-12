import express from "express";
import { callNvidia, callNvidiaStream } from "../services/nvidia";
import { chatSystemPrompt } from "../services/prompts";

const router = express.Router();

interface Message {
  role: "user" | "assistant";
  content: string;
}

// POST /api/chat — multi-turn doubt solver (non-streaming, kept as fallback)
router.post("/", async (req, res) => {
  const { messages, chapterContext, chapterName, subject, language } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "Messages array is required" });
  }
  if (!chapterName || !subject) {
    return res.status(400).json({ error: "chapterName and subject are required" });
  }

  const lang = language || "english";
  const context = chapterContext || "";
  const systemMessage = chatSystemPrompt(subject, chapterName, lang, context);
  const recentMessages = messages.slice(-20);

  const conversationMessages = [
    { role: "system", content: systemMessage },
    ...recentMessages.map((m: Message) => ({ role: m.role, content: m.content })),
  ];

  const response = await callNvidia(
    systemMessage,
    recentMessages[recentMessages.length - 1]?.content || "",
    conversationMessages
  );

  res.json({ reply: response, language: lang });
});

// POST /api/chat/stream — streaming SSE version for ChatGPT-like progressive rendering
router.post("/stream", async (req, res) => {
  const { messages, chapterContext, chapterName, subject, language } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "Messages array is required" });
  }
  if (!chapterName || !subject) {
    return res.status(400).json({ error: "chapterName and subject are required" });
  }

  const lang = language || "english";
  const context = chapterContext || "";
  const systemMessage = chatSystemPrompt(subject, chapterName, lang, context);
  const recentMessages = (messages as Message[]).slice(-20);

  const conversationMessages = [
    { role: "system", content: systemMessage },
    ...recentMessages.map((m: Message) => ({ role: m.role, content: m.content })),
  ];

  // Set SSE headers — disable all buffering so chunks reach the client immediately
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // disable nginx/Render proxy buffering
  res.flushHeaders();

  // Keep connection alive with a periodic comment ping every 15s
  const keepAlive = setInterval(() => {
    res.write(": ping\n\n");
  }, 15000);

  const cleanup = () => {
    clearInterval(keepAlive);
    res.end();
  };

  // Client disconnected early
  req.on("close", cleanup);

  try {
    const gen = callNvidiaStream(conversationMessages);
    for await (const chunk of gen) {
      res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
    }
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  } catch (err: any) {
    console.error("[chat/stream] NVIDIA stream error:", err?.message);
    res.write(`data: ${JSON.stringify({ error: "Stream failed. Please try again." })}\n\n`);
  } finally {
    cleanup();
  }
});

export default router;
