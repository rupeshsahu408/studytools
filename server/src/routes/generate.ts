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

// ─── Robust JSON Parser ──────────────────────────────────────────────────────
// Handles: markdown fences, preamble text, truncated responses, trailing commas,
// incomplete arrays/objects, and various AI formatting quirks.

function safeParseJSON(raw: string): any {
  if (!raw || !raw.trim()) throw new Error("Empty AI response");

  let cleaned = raw.trim();

  // 1. Strip markdown code fences (```json ... ``` or ``` ... ```)
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/s);
  if (fenceMatch) cleaned = fenceMatch[1].trim();

  // 2. Find the outermost JSON object (skip any preamble text)
  const firstBrace = cleaned.indexOf("{");
  if (firstBrace === -1) throw new Error("No JSON object found in AI response");
  cleaned = cleaned.slice(firstBrace);

  // 3. Find the last closing brace (skip any postamble text)
  const lastBrace = cleaned.lastIndexOf("}");
  if (lastBrace === -1) throw new Error("No closing brace found in AI response");
  cleaned = cleaned.slice(0, lastBrace + 1);

  // 4. Try parsing as-is first
  try {
    return JSON.parse(cleaned);
  } catch {}

  // 5. Remove trailing commas before ] or } (common AI mistake)
  const noTrailingCommas = cleaned.replace(/,\s*([}\]])/g, "$1");
  try {
    return JSON.parse(noTrailingCommas);
  } catch {}

  // 6. Truncation recovery — the AI hit token limit mid-array
  // Strategy: find the last COMPLETE item in the top-level arrays and close properly
  const strategies = [
    // Close an open string, then close object, array, parent object
    (s: string) => s + '"}]}',
    (s: string) => s + '"]}}',
    (s: string) => s + '"}}',
    (s: string) => s + "}]}",
    (s: string) => s + "}}",
    (s: string) => s + "}",
  ];

  // Walk back from the last complete closing brace/bracket
  for (let i = lastBrace; i >= 0; i--) {
    if (cleaned[i] === "}" || cleaned[i] === "]") {
      const candidate = cleaned.slice(0, i + 1);
      // Apply trailing comma fix then try to close
      const fixed = candidate.replace(/,\s*([}\]])/g, "$1");
      for (const strategy of strategies) {
        try {
          return JSON.parse(strategy(fixed));
        } catch {}
        try {
          return JSON.parse(fixed);
        } catch {}
      }
    }
  }

  // 7. Last resort — find the last valid JSON object in the string
  // by scanning backwards for a complete top-level object
  for (let end = cleaned.length - 1; end >= 0; end--) {
    if (cleaned[end] === "}") {
      const slice = cleaned.slice(0, end + 1);
      const fixedSlice = slice.replace(/,\s*([}\]])/g, "$1");
      try {
        return JSON.parse(fixedSlice);
      } catch {}
    }
  }

  throw new Error("Could not parse AI response as JSON after all recovery attempts");
}

// ─── Retry Wrapper ───────────────────────────────────────────────────────────
// Retries the AI call + JSON parse up to `maxAttempts` times.
// On each retry the same prompt is sent again (AI responses are non-deterministic
// so a fresh call usually succeeds when a previous one was truncated).

async function callNvidiaWithRetry(
  systemPrompt: string,
  userPrompt: string,
  options?: { maxTokens?: number },
  maxAttempts = 3
): Promise<any> {
  let lastError: Error = new Error("No attempts made");
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const raw = await callNvidia(systemPrompt, userPrompt, undefined, options);
      return safeParseJSON(raw);
    } catch (err: any) {
      lastError = err;
      console.warn(`[generate] Attempt ${attempt}/${maxAttempts} failed: ${err.message}`);
      if (attempt < maxAttempts) {
        // Small back-off before retry
        await new Promise(r => setTimeout(r, 500 * attempt));
      }
    }
  }
  throw lastError;
}

// ─── Phase 1 Endpoints ────────────────────────────────────────────────────

router.post("/notes", async (req, res) => {
  const { text, subject, classNum, chapterName, language } = req.body;
  if (!text || !subject || !classNum || !chapterName) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  const lang = language || "english";
  const notes = await callNvidiaWithRetry(
    notesSystemPrompt(lang),
    notesUserPrompt(text, subject, classNum, chapterName, lang),
    { maxTokens: 8192 }
  );
  res.json({ notes, language: lang });
});

router.post("/questions", async (req, res) => {
  const { text, subject, classNum, chapterName, language, batch } = req.body;
  if (!text || !subject || !classNum || !chapterName) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  const lang = language || "english";
  const sysPrompt = questionsSystemPrompt(lang);

  // Optional `batch` param: "A" | "B" | undefined (both)
  // Allows the client to retry only the failed batch without re-running the other.
  const runA = !batch || batch === "A";
  const runB = !batch || batch === "B";

  const [batchAResult, batchBResult] = await Promise.allSettled([
    runA
      ? callNvidiaWithRetry(
          sysPrompt,
          questionsBatchAPrompt(text, subject, classNum, chapterName, lang),
          { maxTokens: 8192 },
          3
        )
      : Promise.resolve(null),
    runB
      ? callNvidiaWithRetry(
          sysPrompt,
          questionsBatchBPrompt(text, subject, classNum, chapterName, lang),
          { maxTokens: 8192 },
          3
        )
      : Promise.resolve(null),
  ]);

  const batchA = batchAResult.status === "fulfilled" ? (batchAResult.value ?? {}) : {};
  const batchB = batchBResult.status === "fulfilled" ? (batchBResult.value ?? {}) : {};

  if (runA && batchAResult.status === "rejected") {
    console.error("[generate/questions] Batch A failed after retries:", (batchAResult as PromiseRejectedResult).reason?.message);
  }
  if (runB && batchBResult.status === "rejected") {
    console.error("[generate/questions] Batch B failed after retries:", (batchBResult as PromiseRejectedResult).reason?.message);
  }

  // If every requested batch failed, return a meaningful error
  const requestedAFailed = runA && batchAResult.status === "rejected";
  const requestedBFailed = runB && batchBResult.status === "rejected";
  if (requestedAFailed && requestedBFailed) {
    return res.status(500).json({
      error: "AI could not generate questions. Please try again in a moment.",
    });
  }

  // Only include keys for the batches that were actually requested
  const questions: Record<string, any[]> = {};
  if (runA) {
    questions.mcq             = batchA.mcq             || [];
    questions.oneMarks        = batchA.oneMarks        || [];
    questions.twoMarks        = batchA.twoMarks        || [];
    questions.trueFalse       = batchA.trueFalse       || [];
    questions.fillBlanks      = batchA.fillBlanks      || [];
  }
  if (runB) {
    questions.fiveMarks       = batchB.fiveMarks       || [];
    questions.assertionReason = batchB.assertionReason || [];
    questions.caseBased       = batchB.caseBased       || [];
    questions.examImportant   = batchB.examImportant   || [];
  }

  // Report which batches failed so the client can show targeted retry UI
  const failedBatches: string[] = [];
  if (requestedAFailed) failedBatches.push("A");
  if (requestedBFailed) failedBatches.push("B");

  res.json({ questions, language: lang, failedBatches });
});

// ─── Phase 2 Endpoints ────────────────────────────────────────────────────

router.post("/formulas", async (req, res) => {
  const { text, subject, classNum, chapterName, language } = req.body;
  if (!text || !subject || !chapterName) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  const lang = language || "english";
  const parsed = await callNvidiaWithRetry(
    formulasSystemPrompt(),
    formulasUserPrompt(text, subject, classNum || "11", chapterName, lang),
    { maxTokens: 8192 }
  );
  res.json({ formulas: parsed.formulas || [], language: lang });
});

router.post("/mindmap", async (req, res) => {
  const { text, subject, chapterName } = req.body;
  if (!text || !subject || !chapterName) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  const parsed = await callNvidiaWithRetry(
    mindmapSystemPrompt(),
    mindmapUserPrompt(text, subject, chapterName),
    { maxTokens: 6144 }
  );
  res.json({ mindmap: parsed, language: "auto" });
});

router.post("/mistakes", async (req, res) => {
  const { text, subject, classNum, chapterName, language } = req.body;
  if (!text || !subject || !chapterName) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  const lang = language || "english";
  const parsed = await callNvidiaWithRetry(
    mistakesSystemPrompt(lang),
    mistakesUserPrompt(text, subject, classNum || "11", chapterName, lang),
    { maxTokens: 6144 }
  );
  res.json({ mistakes: parsed.mistakes || [], language: lang });
});

router.post("/flashcards", async (req, res) => {
  const { text, subject, classNum, chapterName, language } = req.body;
  if (!text || !subject || !chapterName) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  const lang = language || "english";
  const parsed = await callNvidiaWithRetry(
    flashcardsSystemPrompt(lang),
    flashcardsUserPrompt(text, subject, classNum || "11", chapterName, lang),
    { maxTokens: 6144 }
  );
  res.json({ cards: parsed.cards || [], language: lang });
});

// ─── Phase 3 Endpoint ────────────────────────────────────────────────────

router.post("/simulations", async (req, res) => {
  const { text, subject, classNum, chapterName } = req.body;
  if (!text || !subject || !chapterName) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  const parsed = await callNvidiaWithRetry(
    simulationCatalogSystemPrompt(),
    simulationCatalogUserPrompt(text, subject, classNum || "11", chapterName),
    { maxTokens: 4096 }
  );
  res.json({ simulations: parsed.simulations || [] });
});

// ─── Phase 4 Endpoint ────────────────────────────────────────────────────

router.post("/weakareas", async (req, res) => {
  const { chapters } = req.body;
  if (!chapters || !Array.isArray(chapters) || chapters.length === 0) {
    return res.status(400).json({ error: "chapters array is required" });
  }

  const eligible = chapters.filter((ch: any) =>
    ch.totalAttempted >= 3 && ch.wrongQuestions?.length > 0
  );

  if (eligible.length === 0) {
    return res.json({ weakAreas: [] });
  }

  const parsed = await callNvidiaWithRetry(
    weakAreasSystemPrompt(),
    weakAreasUserPrompt(eligible),
    { maxTokens: 6144 }
  );
  res.json({ weakAreas: parsed.weakAreas || [] });
});

export default router;
