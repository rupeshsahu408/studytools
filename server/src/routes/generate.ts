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
  weakAreasSystemPrompt, weakAreasUserPrompt,
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

// ─── Phase 4 Endpoint ────────────────────────────────────────────────────

router.post("/weakareas", async (req, res) => {
  const { chapters } = req.body;
  if (!chapters || !Array.isArray(chapters) || chapters.length === 0) {
    return res.status(400).json({ error: "chapters array is required" });
  }

  // Only analyze chapters with enough attempts
  const eligible = chapters.filter((ch: any) =>
    ch.totalAttempted >= 3 && ch.wrongQuestions?.length > 0
  );

  if (eligible.length === 0) {
    return res.json({ weakAreas: [] });
  }

  const raw = await callNvidia(
    weakAreasSystemPrompt(),
    weakAreasUserPrompt(eligible)
  );
  const parsed = safeParseJSON(raw);
  res.json({ weakAreas: parsed.weakAreas || [] });
});

export default router;
