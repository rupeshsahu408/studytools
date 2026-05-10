import express from "express";
import { callNvidia } from "../services/nvidia";
import { chatSystemPrompt } from "../services/prompts";

const router = express.Router();

interface Message {
  role: "user" | "assistant";
  content: string;
}

// POST /api/chat — multi-turn doubt solver with chapter context
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

  // Build conversation for NVIDIA NIM
  const systemMessage = chatSystemPrompt(subject, chapterName, lang, context);

  // Keep last 10 turns to stay within context limits (20 messages)
  const recentMessages = messages.slice(-20);

  const conversationMessages = [
    { role: "system", content: systemMessage },
    ...recentMessages.map((m: Message) => ({
      role: m.role,
      content: m.content,
    })),
  ];

  const response = await callNvidia(
    systemMessage,
    recentMessages[recentMessages.length - 1]?.content || "",
    conversationMessages
  );

  res.json({ reply: response, language: lang });
});

export default router;
