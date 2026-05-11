import express from "express";
import { callNvidia } from "../services/nvidia";
import {
  notesSystemPrompt, notesUserPrompt,
  notesOutlineSystemPrompt, notesOutlineUserPrompt,
  notesContentBatchSystemPrompt, notesContentBatchUserPrompt,
  questionsSystemPrompt,
  questionsMCQPrompt, questionsTwoMarkP1Prompt, questionsTwoMarkP2Prompt,
  questionsFiveMarkPrompt, questionsBatchAPrompt, questionsBatchBPrompt,
  examPaperMCQP1Prompt, examPaperMCQP2Prompt, examPaperTwoMarkPrompt, examPaperFiveMarkPrompt,
  formulasSystemPrompt, formulasUserPrompt,
  mindmapSystemPrompt, mindmapUserPrompt,
  mistakesSystemPrompt, mistakesUserPrompt,
  flashcardsSystemPrompt, flashcardsUserPrompt,
  simulationCatalogSystemPrompt, simulationCatalogUserPrompt,
  weakAreasSystemPrompt, weakAreasUserPrompt,
  summarySystemPrompt, summaryUserPrompt,
} from "../services/prompts";
import { keywordMatchSimulations, mergeSimulations } from "../services/simulations";

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

// ─── Notes Post-Processing ───────────────────────────────────────────────────
// Safety net that runs on every notes response regardless of whether the prompt
// was followed perfectly. Two jobs:
//   1. Strip raw LaTeX delimiters ($...$, \(...\), \[...\]) — keep the inner text
//   2. Detect and warn about Devanagari characters used as formula variables
//      (e.g. "थ = उ(अ × ठ)" instead of "F = q(v × B)")

function stripLatex(text: string): string {
  if (!text || typeof text !== "string") return text;
  let s = text;
  // $$...$$ → inner content
  s = s.replace(/\$\$([^$]*)\$\$/g, "$1");
  // $...$ → inner content (single line, max 300 chars to avoid over-matching)
  s = s.replace(/\$([^$\n]{1,300})\$/g, "$1");
  // \(...\) → inner content
  s = s.replace(/\\\((.{0,500}?)\\\)/gs, "$1");
  // \[...\] → inner content
  s = s.replace(/\\\[(.{0,500}?)\\\]/gs, "$1");
  // Clean up double spaces left after stripping
  s = s.replace(/  +/g, " ").trim();
  return s;
}

function detectDevanagariVariables(text: string): boolean {
  // Matches a single/double Devanagari char sitting between math-operator-like chars,
  // which strongly suggests it was used as a variable name (e.g., थ = उ × ठ)
  return /[=+\-×÷\/(\s][\u0900-\u097F]{1,2}[=+\-×÷\/)\s]/.test(text);
}

function cleanNotesObject(notes: any): any {
  if (!notes || typeof notes !== "object") return notes;

  const cs = (s: any): string => stripLatex(String(s || ""));
  const ca = (arr: any[]): string[] => Array.isArray(arr) ? arr.map(cs) : [];

  // Warn in server logs if Devanagari variable contamination is detected
  const fullText = JSON.stringify(notes);
  if (detectDevanagariVariables(fullText)) {
    console.warn(
      "[notes] ⚠️ DEVANAGARI VARIABLES DETECTED — AI translated formula variables into Devanagari. " +
      "Prompt enforcement may need strengthening. Returning notes as-is (symbols preserved for student readability)."
    );
  }

  // Count how many $ signs were found (for logging)
  const latexCount = (fullText.match(/\$/g) || []).length;
  if (latexCount > 0) {
    console.log(`[notes] Stripped ${latexCount} LaTeX delimiter(s) from notes output`);
  }

  return {
    ...notes,
    chapterOverview: cs(notes.chapterOverview),
    summary: cs(notes.summary),
    examTips: ca(notes.examTips),
    topics: Array.isArray(notes.topics)
      ? notes.topics.map((topic: any) => ({
          ...topic,
          content: cs(topic.content),
          subTopics: Array.isArray(topic.subTopics)
            ? topic.subTopics.map((st: any) => ({ ...st, content: cs(st.content) }))
            : [],
          keyPoints: ca(topic.keyPoints),
          importantTerms: Array.isArray(topic.importantTerms)
            ? topic.importantTerms.map((it: any) => ({ ...it, definition: cs(it.definition) }))
            : [],
          formulasUsed: Array.isArray(topic.formulasUsed)
            ? topic.formulasUsed.map((f: any) => ({
                ...f,
                formula: cs(f.formula),
                explanation: cs(f.explanation),
              }))
            : [],
          derivationSteps: ca(topic.derivationSteps),
          diagramDescription: cs(topic.diagramDescription),
          examples: ca(topic.examples),
        }))
      : [],
  };
}

function cleanQuestionItem(q: any): any {
  if (!q || typeof q !== "object") return q;
  const cs = (s: any): string => stripLatex(String(s || ""));
  const ca = (arr: any): string[] => Array.isArray(arr) ? arr.map(cs) : arr;
  return {
    ...q,
    ...(q.question    !== undefined && { question:    cs(q.question) }),
    ...(q.answer      !== undefined && { answer:      cs(q.answer) }),
    ...(q.explanation !== undefined && { explanation: cs(q.explanation) }),
    ...(q.statement   !== undefined && { statement:   cs(q.statement) }),
    ...(q.assertion   !== undefined && { assertion:   cs(q.assertion) }),
    ...(q.reason      !== undefined && { reason:      cs(q.reason) }),
    ...(q.blank       !== undefined && { blank:       cs(q.blank) }),
    ...(q.context     !== undefined && { context:     cs(q.context) }),
    ...(q.options     !== undefined && { options:     ca(q.options) }),
    // case-based sub-questions
    ...(Array.isArray(q.questions) && { questions: q.questions.map(cleanQuestionItem) }),
  };
}

function cleanQuestionsObject(questions: Record<string, any[]>): Record<string, any[]> {
  const out: Record<string, any[]> = {};
  for (const [key, arr] of Object.entries(questions)) {
    out[key] = Array.isArray(arr) ? arr.map(cleanQuestionItem) : arr;
  }
  const latex = (JSON.stringify(out).match(/\$/g) || []).length;
  if (latex > 0) console.log(`[questions] Stripped ${latex} LaTeX delimiter(s)`);
  return out;
}

function cleanFormulasArray(formulas: any[]): any[] {
  if (!Array.isArray(formulas)) return formulas;
  const cs = (s: any): string => stripLatex(String(s || ""));
  const cleaned = formulas.map(f => ({
    ...f,
    ...(f.name             !== undefined && { name:             cs(f.name) }),
    // latex field: strip outer $...$ delimiters only — KaTeX reads the inner expression directly
    ...(f.latex            !== undefined && { latex:            cs(f.latex) }),
    ...(f.plain_text       !== undefined && { plain_text:       cs(f.plain_text) }),
    ...(f.si_unit          !== undefined && { si_unit:          cs(f.si_unit) }),
    ...(f.derivation_hint  !== undefined && { derivation_hint:  cs(f.derivation_hint) }),
    ...(f.chapter_section  !== undefined && { chapter_section:  cs(f.chapter_section) }),
    ...(Array.isArray(f.variables) && {
      variables: f.variables.map((v: any) => ({
        ...v,
        ...(v.meaning !== undefined && { meaning: cs(v.meaning) }),
        ...(v.unit    !== undefined && { unit:    cs(v.unit) }),
      })),
    }),
  }));
  const latex = (JSON.stringify(cleaned).match(/\$/g) || []).length;
  if (latex > 0) console.log(`[formulas] Stripped ${latex} LaTeX delimiter(s)`);
  return cleaned;
}

function cleanMistakesArray(mistakes: any[]): any[] {
  if (!Array.isArray(mistakes)) return mistakes;
  const cs = (s: any): string => stripLatex(String(s || ""));
  const cleaned = mistakes.map(m => ({
    ...m,
    ...(m.mistake      !== undefined && { mistake:      cs(m.mistake) }),
    ...(m.correct      !== undefined && { correct:      cs(m.correct) }),
    ...(m.marks_impact !== undefined && { marks_impact: cs(m.marks_impact) }),
    ...(m.category     !== undefined && { category:     cs(m.category) }),
  }));
  const latex = (JSON.stringify(cleaned).match(/\$/g) || []).length;
  if (latex > 0) console.log(`[mistakes] Stripped ${latex} LaTeX delimiter(s)`);
  return cleaned;
}

function cleanFlashcardsArray(cards: any[]): any[] {
  if (!Array.isArray(cards)) return cards;
  const cs = (s: any): string => stripLatex(String(s || ""));
  const cleaned = cards.map(c => ({
    ...c,
    ...(c.front   !== undefined && { front:   cs(c.front) }),
    ...(c.back    !== undefined && { back:    cs(c.back) }),
    ...(c.hint    !== undefined && { hint:    cs(c.hint) }),
    ...(c.example !== undefined && { example: cs(c.example) }),
  }));
  const latex = (JSON.stringify(cleaned).match(/\$/g) || []).length;
  if (latex > 0) console.log(`[flashcards] Stripped ${latex} LaTeX delimiter(s)`);
  return cleaned;
}

// ─── Phase 1 Endpoints ────────────────────────────────────────────────────

// ── Helper: chunk an array into batches of size n ──
function chunkArray<T>(arr: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

router.post("/notes", async (req, res) => {
  const { text, subject, classNum, chapterName, language } = req.body;
  if (!text || !subject || !classNum || !chapterName) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  const lang = language || "english";

  // ── TWO-PHASE NOTES GENERATION ──────────────────────────────────────────
  // Phase 1: Extract chapter outline (section titles + metadata) — fast call
  // Phase 2: Generate rich 300-word content per section in parallel batches
  // This produces far more detailed notes than a single large call because
  // each batch call can focus on only 3-4 sections at full depth.

  try {
    // ── PHASE 1: Get outline ──────────────────────────────────────────────
    console.log(`[notes] Phase 1 starting — extracting outline for "${chapterName}"`);
    const outlineRaw = await callNvidiaWithRetry(
      notesOutlineSystemPrompt(),
      notesOutlineUserPrompt(text, subject, classNum, chapterName, lang),
      { maxTokens: 4096 },
      3
    );

    const sections: Array<{
      id: string;
      title: string;
      hasDerivation: boolean;
      hasDiagram: boolean;
      hasExperiment: boolean;
      importance: string;
    }> = outlineRaw.sections || [];

    if (sections.length === 0) {
      throw new Error("Phase 1 returned no sections — falling back to single-call");
    }

    console.log(`[notes] Phase 1 done — ${sections.length} sections found`);

    // ── PHASE 2: Generate rich content per section in batches of 3 ────────
    const BATCH_SIZE = 3;
    const batches = chunkArray(sections, BATCH_SIZE);

    console.log(`[notes] Phase 2 starting — ${batches.length} parallel batches of ≤${BATCH_SIZE} sections each`);

    const batchResults = await Promise.allSettled(
      batches.map((batch, i) =>
        callNvidiaWithRetry(
          notesContentBatchSystemPrompt(lang),
          notesContentBatchUserPrompt(batch, text, subject, classNum, chapterName, lang),
          { maxTokens: 16384 },
          3
        ).then(parsed => {
          const topics = parsed.topics || [];
          console.log(`[notes] Batch ${i + 1}/${batches.length} done — ${topics.length} topics`);
          return topics;
        })
      )
    );

    // Collect all topics across batches (preserve order)
    const allTopics: any[] = [];
    let failedBatches = 0;
    for (const result of batchResults) {
      if (result.status === "fulfilled") {
        allTopics.push(...result.value);
      } else {
        failedBatches++;
        console.error(`[notes] A content batch failed:`, result.reason?.message);
      }
    }

    if (allTopics.length === 0) {
      throw new Error("All content batches failed — falling back to single-call");
    }

    console.log(`[notes] Phase 2 done — ${allTopics.length} topics total (${failedBatches} batches failed)`);

    // Validate content depth — warn if topics are short (may indicate truncation)
    const avgWords = allTopics.reduce((sum: number, t: any) => {
      const words = (t.content || "").split(/\s+/).filter(Boolean).length;
      return sum + words;
    }, 0) / allTopics.length;
    console.log(`[notes] Average content length: ${Math.round(avgWords)} words/section`);
    if (avgWords < 100) {
      console.warn(`[notes] ⚠️ LOW CONTENT DEPTH (avg ${Math.round(avgWords)} words) — notes may be shallow`);
    }

    const rawNotes = {
      chapterOverview: outlineRaw.chapterOverview || "",
      topics: allTopics,
      summary: outlineRaw.summary || "",
      examTips: outlineRaw.examTips || [],
    };

    const notes = cleanNotesObject(rawNotes);
    return res.json({ notes, language: lang });

  } catch (phaseErr: any) {
    // ── FALLBACK: single-call if two-phase fails ──────────────────────────
    console.warn(`[notes] Two-phase failed (${phaseErr.message}) — attempting single-call fallback`);
    try {
      const rawNotes = await callNvidiaWithRetry(
        notesSystemPrompt(lang),
        notesUserPrompt(text, subject, classNum, chapterName, lang),
        { maxTokens: 32768 },
        3
      );
      const notes = cleanNotesObject(rawNotes);
      return res.json({ notes, language: lang });
    } catch (fallbackErr: any) {
      console.error(`[notes] Fallback also failed:`, fallbackErr.message);
      return res.status(500).json({ error: "Could not generate notes. Please try again." });
    }
  }
});

router.post("/questions", async (req, res) => {
  const { text, subject, classNum, chapterName, language, batch } = req.body;
  if (!text || !subject || !classNum || !chapterName) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  const lang = language || "english";
  const sysPrompt = questionsSystemPrompt(lang);

  // Seven parallel batches — 2-mark is PRIMARY, 5-mark gets its own dedicated batch:
  //   MCQ-P1   — conceptual + theoretical + reasoning MCQs        (50-60)
  //   MCQ-P2   — application + formula/numerical + scenario MCQs  (50-60)
  //   2M-P1    — 2-mark: Theoretical + Reasoning                  (25-30) ★ PRIMARY
  //   2M-P2    — 2-mark: Application + Derivation                 (25-30) ★ PRIMARY
  //   5M       — 5-mark: all 5 types, full chapter coverage       (10-15) ★
  //   Batch A  — 1-mark + True/False + Fill Blanks
  //   Batch B  — Assertion-Reason + Case-Based + Exam Important
  //
  // Client retry "A" reruns MCQ + 2M + 5M + BatchA; "B" reruns BatchB only.
  const runMCQ = !batch || batch === "A";
  const run2M  = !batch || batch === "A";
  const run5M  = !batch || batch === "A";
  const runA   = !batch || batch === "A";
  const runB   = !batch || batch === "B";

  const MCQ_MAX_TOKENS     = 20000;
  const TWOMARK_MAX_TOKENS = 16384;
  const FIVEMARK_MAX_TOKENS = 20000;
  const SHORT_MAX_TOKENS   = 10000;
  const LONG_MAX_TOKENS    = 16384;

  const [mcqP1Result, mcqP2Result, twoMP1Result, twoMP2Result, fiveMResult, batchAResult, batchBResult] =
    await Promise.allSettled([
      runMCQ
        ? callNvidiaWithRetry(
            sysPrompt,
            questionsMCQPrompt(text, subject, classNum, chapterName, lang, "P1"),
            { maxTokens: MCQ_MAX_TOKENS },
            3
          )
        : Promise.resolve(null),
      runMCQ
        ? callNvidiaWithRetry(
            sysPrompt,
            questionsMCQPrompt(text, subject, classNum, chapterName, lang, "P2"),
            { maxTokens: MCQ_MAX_TOKENS },
            3
          )
        : Promise.resolve(null),
      run2M
        ? callNvidiaWithRetry(
            sysPrompt,
            questionsTwoMarkP1Prompt(text, subject, classNum, chapterName, lang),
            { maxTokens: TWOMARK_MAX_TOKENS },
            3
          )
        : Promise.resolve(null),
      run2M
        ? callNvidiaWithRetry(
            sysPrompt,
            questionsTwoMarkP2Prompt(text, subject, classNum, chapterName, lang),
            { maxTokens: TWOMARK_MAX_TOKENS },
            3
          )
        : Promise.resolve(null),
      run5M
        ? callNvidiaWithRetry(
            sysPrompt,
            questionsFiveMarkPrompt(text, subject, classNum, chapterName, lang),
            { maxTokens: FIVEMARK_MAX_TOKENS },
            3
          )
        : Promise.resolve(null),
      runA
        ? callNvidiaWithRetry(
            sysPrompt,
            questionsBatchAPrompt(text, subject, classNum, chapterName, lang),
            { maxTokens: SHORT_MAX_TOKENS },
            3
          )
        : Promise.resolve(null),
      runB
        ? callNvidiaWithRetry(
            sysPrompt,
            questionsBatchBPrompt(text, subject, classNum, chapterName, lang),
            { maxTokens: LONG_MAX_TOKENS },
            3
          )
        : Promise.resolve(null),
    ]);

  const mcqP1  = mcqP1Result.status   === "fulfilled" ? (mcqP1Result.value   ?? {}) : {};
  const mcqP2  = mcqP2Result.status   === "fulfilled" ? (mcqP2Result.value   ?? {}) : {};
  const twoMP1 = twoMP1Result.status  === "fulfilled" ? (twoMP1Result.value  ?? {}) : {};
  const twoMP2 = twoMP2Result.status  === "fulfilled" ? (twoMP2Result.value  ?? {}) : {};
  const fiveM  = fiveMResult.status   === "fulfilled" ? (fiveMResult.value   ?? {}) : {};
  const batchA = batchAResult.status  === "fulfilled" ? (batchAResult.value  ?? {}) : {};
  const batchB = batchBResult.status  === "fulfilled" ? (batchBResult.value  ?? {}) : {};

  if (runMCQ && mcqP1Result.status === "rejected")
    console.error("[generate/questions] MCQ-P1 failed:", (mcqP1Result as PromiseRejectedResult).reason?.message);
  if (runMCQ && mcqP2Result.status === "rejected")
    console.error("[generate/questions] MCQ-P2 failed:", (mcqP2Result as PromiseRejectedResult).reason?.message);
  if (run2M && twoMP1Result.status === "rejected")
    console.error("[generate/questions] 2M-P1 failed:", (twoMP1Result as PromiseRejectedResult).reason?.message);
  if (run2M && twoMP2Result.status === "rejected")
    console.error("[generate/questions] 2M-P2 failed:", (twoMP2Result as PromiseRejectedResult).reason?.message);
  if (run5M && fiveMResult.status === "rejected")
    console.error("[generate/questions] 5M failed:", (fiveMResult as PromiseRejectedResult).reason?.message);
  if (runA && batchAResult.status === "rejected")
    console.error("[generate/questions] Batch A failed:", (batchAResult as PromiseRejectedResult).reason?.message);
  if (runB && batchBResult.status === "rejected")
    console.error("[generate/questions] Batch B failed:", (batchBResult as PromiseRejectedResult).reason?.message);

  // ── Merge MCQ results from P1 + P2, re-index IDs, deduplicate ──────────────
  const rawMCQs: any[] = [
    ...(Array.isArray(mcqP1.mcq) ? mcqP1.mcq : []),
    ...(Array.isArray(mcqP2.mcq) ? mcqP2.mcq : []),
  ];
  const seenMCQ = new Set<string>();
  const mergedMCQs = rawMCQs
    .filter(q => {
      if (!q?.question) return false;
      const key = (q.question as string).trim().toLowerCase().slice(0, 80);
      if (seenMCQ.has(key)) return false;
      seenMCQ.add(key);
      return true;
    })
    .map((q, i) => ({ ...q, id: `mcq_${i + 1}` }));

  // ── Merge 2-mark results from 2M-P1 + 2M-P2, deduplicate ──────────────────
  const raw2M: any[] = [
    ...(Array.isArray(twoMP1.twoMarks) ? twoMP1.twoMarks : []),
    ...(Array.isArray(twoMP2.twoMarks) ? twoMP2.twoMarks : []),
  ];
  const seen2M = new Set<string>();
  const merged2M = raw2M
    .filter(q => {
      if (!q?.question) return false;
      const key = (q.question as string).trim().toLowerCase().slice(0, 80);
      if (seen2M.has(key)) return false;
      seen2M.add(key);
      return true;
    })
    .map((q, i) => ({ ...q, id: `2m_${i + 1}` }));

  // ── 5-mark: re-index IDs from dedicated batch ─────────────────────────────
  const raw5M: any[] = Array.isArray(fiveM.fiveMarks) ? fiveM.fiveMarks : [];
  const merged5M = raw5M
    .filter(q => q?.question)
    .map((q, i) => ({ ...q, id: `5m_${i + 1}` }));

  const count2MP1 = Array.isArray(twoMP1.twoMarks) ? twoMP1.twoMarks.length : 0;
  const count2MP2 = Array.isArray(twoMP2.twoMarks) ? twoMP2.twoMarks.length : 0;

  // Determine overall failure: A-side fails only if ALL A-side batches rejected
  const requestedAFailed = runA
    && mcqP1Result.status === "rejected"
    && mcqP2Result.status === "rejected"
    && twoMP1Result.status === "rejected"
    && twoMP2Result.status === "rejected"
    && fiveMResult.status === "rejected"
    && batchAResult.status === "rejected";
  const requestedBFailed = runB && batchBResult.status === "rejected";

  if (requestedAFailed && requestedBFailed) {
    return res.status(500).json({
      error: "AI could not generate questions. Please try again in a moment.",
    });
  }

  const questions: Record<string, any[]> = {};
  if (runMCQ || runA || run2M || run5M) {
    questions.mcq        = mergedMCQs;
    questions.twoMarks   = merged2M;
    questions.fiveMarks  = merged5M;
    questions.oneMarks   = batchA.oneMarks   || [];
    questions.trueFalse  = batchA.trueFalse  || [];
    questions.fillBlanks = batchA.fillBlanks || [];
  }
  if (runB) {
    questions.assertionReason = batchB.assertionReason || [];
    questions.caseBased       = batchB.caseBased       || [];
    questions.examImportant   = batchB.examImportant   || [];
  }

  const failedBatches: string[] = [];
  if (requestedAFailed) failedBatches.push("A");
  if (requestedBFailed) failedBatches.push("B");

  const countMCQ   = questions.mcq?.length        || 0;
  const count2M    = questions.twoMarks?.length    || 0;
  const count5M    = questions.fiveMarks?.length   || 0;
  const countMCQP1 = Array.isArray(mcqP1.mcq)     ? mcqP1.mcq.length : 0;
  const countMCQP2 = Array.isArray(mcqP2.mcq)     ? mcqP2.mcq.length : 0;
  const countA = (questions.oneMarks?.length   || 0) +
                 (questions.trueFalse?.length   || 0) +
                 (questions.fillBlanks?.length  || 0);
  const countB = (questions.assertionReason?.length || 0) +
                 (questions.examImportant?.length   || 0) +
                 (questions.caseBased?.reduce((s: number, cb: any) => s + (cb.questions?.length || 0), 0) || 0);
  const total = countMCQ + count2M + count5M + countA + countB;

  console.log(
    `[generate/questions] lang=${lang} | ` +
    `MCQ-P1=${countMCQP1} MCQ-P2=${countMCQP2} merged=${countMCQ} | ` +
    `2M-P1=${count2MP1} 2M-P2=${count2MP2} merged=${count2M} | ` +
    `5M=${count5M} | ShortQ=${countA} | LongQ=${countB} | Total=${total} | Failed=[${failedBatches.join(",")}]`
  );

  if (countMCQ < 60 && runMCQ && !(mcqP1Result.status === "rejected" && mcqP2Result.status === "rejected"))
    console.warn(`[generate/questions] ⚠️ LOW MCQ COUNT (${countMCQ}) — expected 100+`);
  if (count2M < 40 && run2M && !(twoMP1Result.status === "rejected" && twoMP2Result.status === "rejected"))
    console.warn(`[generate/questions] ⚠️ LOW 2-MARK COUNT (${count2M}) — expected 50-60+`);
  if (count5M < 8 && run5M && fiveMResult.status !== "rejected")
    console.warn(`[generate/questions] ⚠️ LOW 5-MARK COUNT (${count5M}) — expected 10-15`);

  res.json({ questions: cleanQuestionsObject(questions), language: lang, failedBatches });
});

// ─── Exam Paper Endpoint ──────────────────────────────────────────────────

router.post("/exampaper", async (req, res) => {
  const { text, subject, classNum, chapterName, language } = req.body;
  if (!text || !subject || !chapterName) {
    return res.status(400).json({ error: "Missing required fields: text, subject, chapterName" });
  }
  const lang = (language || "english") as "hindi" | "english";
  const cls  = classNum || "12";

  // 4 parallel batches: MCQ-P1 (50), MCQ-P2 (50), 2M (20), 5M (6)
  const [mcqP1Result, mcqP2Result, twoMResult, fiveMResult] = await Promise.allSettled([
    callNvidiaWithRetry(
      questionsSystemPrompt(lang),
      examPaperMCQP1Prompt(text, subject, cls, chapterName, lang),
      { maxTokens: 20000 }
    ),
    callNvidiaWithRetry(
      questionsSystemPrompt(lang),
      examPaperMCQP2Prompt(text, subject, cls, chapterName, lang),
      { maxTokens: 20000 }
    ),
    callNvidiaWithRetry(
      questionsSystemPrompt(lang),
      examPaperTwoMarkPrompt(text, subject, cls, chapterName, lang),
      { maxTokens: 14000 }
    ),
    callNvidiaWithRetry(
      questionsSystemPrompt(lang),
      examPaperFiveMarkPrompt(text, subject, cls, chapterName, lang),
      { maxTokens: 16000 }
    ),
  ]);

  // Extract MCQs from both batches
  const mcqP1Raw = mcqP1Result.status === "fulfilled" ? (mcqP1Result.value?.oneMarks || []) : [];
  const mcqP2Raw = mcqP2Result.status === "fulfilled" ? (mcqP2Result.value?.oneMarks || []) : [];

  // Deduplicate MCQs by question text (first 60 chars)
  const seenMCQ = new Set<string>();
  const allMCQ: any[] = [];
  for (const q of [...mcqP1Raw, ...mcqP2Raw]) {
    if (!q?.question) continue;
    const key = q.question.trim().toLowerCase().slice(0, 60);
    if (!seenMCQ.has(key)) {
      seenMCQ.add(key);
      allMCQ.push(q);
    }
  }

  // Extract 2-mark and 5-mark
  const twoMarksRaw  = twoMResult.status  === "fulfilled" ? (twoMResult.value?.twoMarks   || []) : [];
  const fiveMarksRaw = fiveMResult.status === "fulfilled" ? (fiveMResult.value?.fiveMarks  || []) : [];

  const countMCQ = allMCQ.length;
  const count2M  = twoMarksRaw.length;
  const count5M  = fiveMarksRaw.length;

  console.log(
    `[generate/exampaper] lang=${lang} | ` +
    `MCQ-P1=${mcqP1Raw.length} MCQ-P2=${mcqP2Raw.length} merged=${countMCQ} | ` +
    `2M=${count2M} | 5M=${count5M}`
  );

  if (countMCQ < 60)  console.warn(`[generate/exampaper] ⚠️ LOW MCQ COUNT (${countMCQ}) — expected ~100`);
  if (count2M  < 15)  console.warn(`[generate/exampaper] ⚠️ LOW 2-MARK COUNT (${count2M}) — expected 20`);
  if (count5M  < 4)   console.warn(`[generate/exampaper] ⚠️ LOW 5-MARK COUNT (${count5M}) — expected 6`);

  // Clean using existing cleaner — strip LaTeX, enforce Unicode
  const cleaned = cleanQuestionsObject({ oneMarks: allMCQ, twoMarks: twoMarksRaw, fiveMarks: fiveMarksRaw });

  res.json({
    mcq:       cleaned.oneMarks  || [],
    twoMarks:  cleaned.twoMarks  || [],
    fiveMarks: cleaned.fiveMarks || [],
    language:  lang,
    counts: { mcq: countMCQ, twoMarks: count2M, fiveMarks: count5M },
  });
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
  res.json({ formulas: cleanFormulasArray(parsed.formulas || []), language: lang });
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
  res.json({ mistakes: cleanMistakesArray(parsed.mistakes || []), language: lang });
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
  res.json({ cards: cleanFlashcardsArray(parsed.cards || []), language: lang });
});

// ─── Phase 3 Endpoint ────────────────────────────────────────────────────

router.post("/simulations", async (req, res) => {
  const { text, subject, classNum, chapterName } = req.body;
  if (!text || !subject || !chapterName) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Run keyword matching immediately (pure backend, instant)
  const keywordPicks = keywordMatchSimulations(chapterName, text, subject, 2);

  // Run AI selection in parallel — if it fails, keyword picks are the fallback
  let aiPicks: any[] = [];
  try {
    const parsed = await callNvidiaWithRetry(
      simulationCatalogSystemPrompt(),
      simulationCatalogUserPrompt(text, subject, classNum || "11", chapterName),
      { maxTokens: 4096 }
    );
    aiPicks = parsed.simulations || [];
  } catch (err: any) {
    console.warn("[generate/simulations] AI selection failed — using keyword matches only:", err?.message);
  }

  // Merge: AI picks first (richer descriptions), keyword fills guarantee ≥2
  const final = mergeSimulations(aiPicks, keywordPicks, 2);
  console.log(`[generate/simulations] AI: ${aiPicks.length} | Keyword: ${keywordPicks.length} | Final: ${final.length}`);

  res.json({ simulations: final });
});

// ─── Summary clean ───────────────────────────────────────────────────────

function cleanSummaryObject(raw: any): any {
  if (!raw || typeof raw !== "object") return raw;
  const s = { ...raw };

  if (typeof s.chapterEssence === "string") s.chapterEssence = stripLatex(s.chapterEssence);

  if (Array.isArray(s.concepts)) {
    s.concepts = s.concepts.map((c: any) => ({
      ...c,
      title: typeof c.title === "string" ? stripLatex(c.title) : c.title,
      explanation: typeof c.explanation === "string" ? stripLatex(c.explanation) : c.explanation,
      keyFormula: c.keyFormula && typeof c.keyFormula === "string" ? stripLatex(c.keyFormula) : null,
      examWeight: ["high", "medium", "low"].includes(c.examWeight) ? c.examWeight : "medium",
    }));
  }

  if (Array.isArray(s.formulaSnapshot)) {
    s.formulaSnapshot = s.formulaSnapshot.map((f: any) => ({
      formula: typeof f.formula === "string" ? stripLatex(f.formula) : f.formula,
      context: typeof f.context === "string" ? stripLatex(f.context) : f.context,
    }));
  }

  if (s.examSpotlight && typeof s.examSpotlight === "object") {
    const es = s.examSpotlight;
    if (Array.isArray(es.highValueTopics)) es.highValueTopics = es.highValueTopics.map((t: any) => typeof t === "string" ? stripLatex(t) : t);
    if (Array.isArray(es.questionPatterns)) es.questionPatterns = es.questionPatterns.map((t: any) => typeof t === "string" ? stripLatex(t) : t);
    if (Array.isArray(es.mustMemorize)) es.mustMemorize = es.mustMemorize.map((t: any) => typeof t === "string" ? stripLatex(t) : t);
    s.examSpotlight = es;
  }

  if (Array.isArray(s.lastNightRevision)) {
    s.lastNightRevision = s.lastNightRevision.map((p: any) => typeof p === "string" ? stripLatex(p) : p);
  }

  return s;
}

// ─── Summary / One-Shot Revision ─────────────────────────────────────────

router.post("/summary", async (req, res) => {
  const { text, subject, classNum, chapterName, language } = req.body;
  if (!text || !subject || !chapterName) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  const lang = language || "english";

  try {
    const parsed = await callNvidiaWithRetry(
      summarySystemPrompt(lang),
      summaryUserPrompt(text, subject, classNum || "11", chapterName, lang),
      { maxTokens: 20000 }
    );
    const summary = cleanSummaryObject(parsed);
    res.json({ summary });
  } catch (err: any) {
    console.error("[generate/summary] error:", err?.message);
    res.status(500).json({ error: "Failed to generate summary. Please try again." });
  }
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
