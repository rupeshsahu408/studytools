import express from "express";
import { callNvidia } from "../services/nvidia";
import {
  notesSystemPrompt, notesUserPrompt,
  questionsSystemPrompt,
  questionsBatchAPrompt, questionsBatchBPrompt,
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
  // Strip markdown code fences if present
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) cleaned = fenceMatch[1].trim();
  // Find the outermost { ... } block
  const firstBrace = cleaned.indexOf("{");
  if (firstBrace === -1) throw new Error("No JSON object found in AI response");
  cleaned = cleaned.slice(firstBrace);
  // If the JSON was truncated (token limit hit), find the last complete top-level key
  // by walking back from the last valid closing brace
  let lastBrace = cleaned.lastIndexOf("}");
  if (lastBrace === -1) throw new Error("Truncated AI response — no closing brace found");
  cleaned = cleaned.slice(0, lastBrace + 1);
  // Verify it parses; if not, try to fix common truncation patterns
  try {
    return JSON.parse(cleaned);
  } catch {
    // Try trimming trailing incomplete array/object entries by removing last array item
    const lastComma = cleaned.lastIndexOf(",");
    if (lastComma !== -1) {
      const trimmed = cleaned.slice(0, lastComma) + cleaned.slice(cleaned.lastIndexOf(",") + 1).replace(/[^}\]]*$/, "");
      try { return JSON.parse(trimmed + "}}"); } catch {}
      try { return JSON.parse(trimmed + "}]}"); } catch {}
    }
    throw new Error("Could not parse AI response as JSON");
  }
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
  const sysPrompt = questionsSystemPrompt(lang);

  // Run both batches in parallel — each is small enough to complete reliably
  const [rawA, rawB] = await Promise.all([
    callNvidia(sysPrompt, questionsBatchAPrompt(text, subject, classNum, chapterName, lang), undefined, { maxTokens: 4096 }),
    callNvidia(sysPrompt, questionsBatchBPrompt(text, subject, classNum, chapterName, lang), undefined, { maxTokens: 4096 }),
  ]);

  const batchA = safeParseJSON(rawA);
  const batchB = safeParseJSON(rawB);

  const questions = {
    mcq:            batchA.mcq            || [],
    oneMarks:       batchA.oneMarks       || [],
    twoMarks:       batchA.twoMarks       || [],
    trueFalse:      batchA.trueFalse      || [],
    fillBlanks:     batchA.fillBlanks     || [],
    fiveMarks:      batchB.fiveMarks      || [],
    assertionReason:batchB.assertionReason|| [],
    caseBased:      batchB.caseBased      || [],
    examImportant:  batchB.examImportant  || [],
  };

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
