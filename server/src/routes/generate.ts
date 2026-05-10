import express from "express";
import { callNvidia } from "../services/nvidia";
import {
  notesSystemPrompt, notesUserPrompt,
  questionsSystemPrompt, questionsUserPrompt,
} from "../services/prompts";

const router = express.Router();

function safeParseJSON(raw: string): any {
  let cleaned = raw.trim();
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) cleaned = fenceMatch[1].trim();
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }
  return JSON.parse(cleaned);
}

router.post("/notes", async (req, res) => {
  const { text, subject, classNum, chapterName, language } = req.body;
  if (!text || !subject || !classNum || !chapterName) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  const lang = language || "english";
  const raw = await callNvidia(
    notesSystemPrompt(lang),
    notesUserPrompt(text, subject, classNum, chapterName, lang)
  );
  const notes = safeParseJSON(raw);
  res.json({ notes, language: lang });
});

router.post("/questions", async (req, res) => {
  const { text, subject, classNum, chapterName, language } = req.body;
  if (!text || !subject || !classNum || !chapterName) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  const lang = language || "english";
  const raw = await callNvidia(
    questionsSystemPrompt(lang),
    questionsUserPrompt(text, subject, classNum, chapterName, lang)
  );
  const questions = safeParseJSON(raw);
  res.json({ questions, language: lang });
});

export default router;
