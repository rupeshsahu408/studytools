import express from "express";
import { callNvidia } from "../services/nvidia";
import {
  notesSystemPrompt, notesUserPrompt,
  questionsSystemPrompt, questionsUserPrompt,
  formulasSystemPrompt, formulasUserPrompt,
  mindmapSystemPrompt, mindmapUserPrompt,
  mistakesSystemPrompt, mistakesUserPrompt,
  flashcardsSystemPrompt, flashcardsUserPrompt,
  simulationCatalogSystemPrompt, simulationCatalogUserPrompt,
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

// ─── Phase 1 Endpoints ────────────────────────────────────────────────────

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

// ─── Phase 2 Endpoints ────────────────────────────────────────────────────

router.post("/formulas", async (req, res) => {
  const { text, subject, classNum, chapterName, language } = req.body;
  if (!text || !subject || !chapterName) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  const lang = language || "english";
  const raw = await callNvidia(
    formulasSystemPrompt(),
    formulasUserPrompt(text, subject, classNum || "11", chapterName, lang)
  );
  const parsed = safeParseJSON(raw);
  res.json({ formulas: parsed.formulas || [], language: lang });
});

router.post("/mindmap", async (req, res) => {
  const { text, subject, chapterName } = req.body;
  if (!text || !subject || !chapterName) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  const raw = await callNvidia(
    mindmapSystemPrompt(),
    mindmapUserPrompt(text, subject, chapterName)
  );
  const parsed = safeParseJSON(raw);
  res.json({ mindmap: parsed, language: "auto" });
});

router.post("/mistakes", async (req, res) => {
  const { text, subject, classNum, chapterName, language } = req.body;
  if (!text || !subject || !chapterName) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  const lang = language || "english";
  const raw = await callNvidia(
    mistakesSystemPrompt(lang),
    mistakesUserPrompt(text, subject, classNum || "11", chapterName, lang)
  );
  const parsed = safeParseJSON(raw);
  res.json({ mistakes: parsed.mistakes || [], language: lang });
});

router.post("/flashcards", async (req, res) => {
  const { text, subject, classNum, chapterName, language } = req.body;
  if (!text || !subject || !chapterName) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  const lang = language || "english";
  const raw = await callNvidia(
    flashcardsSystemPrompt(lang),
    flashcardsUserPrompt(text, subject, classNum || "11", chapterName, lang)
  );
  const parsed = safeParseJSON(raw);
  res.json({ cards: parsed.cards || [], language: lang });
});

// ─── Phase 3 Endpoint ────────────────────────────────────────────────────

router.post("/simulations", async (req, res) => {
  const { text, subject, classNum, chapterName } = req.body;
  if (!text || !subject || !chapterName) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  const raw = await callNvidia(
    simulationCatalogSystemPrompt(),
    simulationCatalogUserPrompt(text, subject, classNum || "11", chapterName)
  );
  const parsed = safeParseJSON(raw);
  res.json({ simulations: parsed.simulations || [] });
});

export default router;
