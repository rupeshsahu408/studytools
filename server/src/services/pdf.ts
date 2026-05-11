import fs from "fs";

const pdfParse = require("pdf-parse");
const krutidevToUnicode = require("@anthro-ai/krutidev-unicode");

export async function extractTextFromPDF(filePath: string): Promise<string> {
  const dataBuffer = fs.readFileSync(filePath);
  // max: 0 explicitly means "no page limit — parse ALL pages"
  const data = await pdfParse(dataBuffer, { max: 0 });
  const pageCount = data.numpages ?? "unknown";
  const charCount = (data.text || "").length;
  console.log(`[pdf] Extracted ${pageCount} pages | ${charCount} characters from PDF`);
  return data.text || "";
}

// ─── Krutidev Detection ──────────────────────────────────────────────────────
// Krutidev is a legacy 8-bit Hindi font encoding where Devanagari glyphs are
// mapped to ASCII positions. Extracted text looks like garbled English.
// Example: "fo|qr" = विद्युत, "pqacdh;" = चुम्बकीय, "HkkSfrdh" = भौतिकी

function isKrutidevEncoded(text: string): boolean {
  // Use a larger sample for more accurate detection
  const sample = text.slice(0, 5000);
  const totalChars = sample.length;
  if (totalChars < 50) return false;

  const devanagariCount = (sample.match(/[\u0900-\u097F]/g) || []).length;
  const asciiLetterCount = (sample.match(/[a-zA-Z]/g) || []).length;

  // Already has substantial Devanagari Unicode — no conversion needed
  // Use ratio instead of absolute count (15% or more = likely already Unicode)
  if (devanagariCount > totalChars * 0.12) return false;

  // Must have enough ASCII letters to be meaningful
  if (asciiLetterCount < 30) return false;

  // ASCII letters must form a significant portion
  const asciiRatio = asciiLetterCount / totalChars;
  if (asciiRatio < 0.15) return false;

  // Krutidev-specific word patterns that appear very frequently in NCERT Hindi.
  // These are common Hindi function words and NCERT subject terminology.
  const krutidevPatterns = [
    /\besa\b/,        // में (in)
    /\bgSA?\b/,       // है / है। (is)
    /\bfd\b/,         // कि (that)
    /\bdk\b/,         // का (of)
    /\bij\b/,         // पर (on)
    /\bgksrk\b/,      // होता (happens)
    /\bvkSj\b/,       // और (and)
    /\bls\b/,         // से (from)
    /\bds\b/,         // के (of/for)
    /\bfo|qr\b/,      // विद्युत (electric)
    /\bpqacdh;\b/,    // चुम्बकीय (magnetic)
    /\bHkh\b/,        // भी (also)
    /\buk\b/,         // ना (no/not)
    /bZ\b/,           // ई suffix (very common in Hindi)
    /\biz[a-z]/,      // प्र prefix (extremely common in Hindi)
    /[a-z][kj][a-z]/, // consonant + matra + consonant pattern
  ];

  const matchCount = krutidevPatterns.filter(p => p.test(sample)).length;
  return matchCount >= 3;
}

// ─── Line Classification ─────────────────────────────────────────────────────
// Each line is classified before deciding whether to run Krutidev conversion.

type LineClass = "krutidev" | "unicode" | "preserve";

function classifyLine(line: string): LineClass {
  const trimmed = line.trim();
  if (trimmed.length === 0) return "preserve"; // empty lines: keep as-is

  const devanagariCount = (trimmed.match(/[\u0900-\u097F]/g) || []).length;
  // Already has meaningful Unicode Devanagari — don't touch it
  if (devanagariCount > 3) return "unicode";

  const totalChars = trimmed.length;
  const asciiLetterCount = (trimmed.match(/[a-zA-Z]/g) || []).length;

  // Very short lines (page numbers, bullets, single chars) — preserve
  if (totalChars < 3) return "preserve";

  // Lines that are overwhelmingly digits/symbols (equations, formulas, page refs)
  // but have very few actual letters — preserve them as numeric/symbolic content.
  // We still try to convert if there are enough letters mixed in (e.g. "E = 4.2 N/C
  // osQ" — the "osQ" is Krutidev for "के").
  const digitSymbolCount = (trimmed.match(/[\d\+\-\×\÷\=\(\)\[\]\{\}\.\,\:\;\^\*\/\\]/g) || []).length;
  const isEquationHeavy = digitSymbolCount / totalChars > 0.6 && asciiLetterCount < 6;
  if (isEquationHeavy) return "preserve";

  // If the line has a meaningful number of ASCII letters, attempt Krutidev conversion.
  // Threshold lowered from 0.10 to 0.05 to catch mixed Hindi+formula lines.
  const asciiRatio = asciiLetterCount / totalChars;
  if (asciiRatio >= 0.05) return "krutidev";

  // Fall through: mostly numbers/punctuation — preserve
  return "preserve";
}

// ─── Post-Processing ─────────────────────────────────────────────────────────
// Fixes common artifacts that the @anthro-ai/krutidev-unicode library emits.

function postProcessDevanagari(text: string): string {
  return text
    // Step 1: Unicode NFC normalization — ensures consistent character composition.
    // This fixes cases where a character + combining mark appear as separate
    // code points when they should be a single precomposed character.
    .normalize("NFC")

    // Step 2: Pipe characters → Devanagari dandas.
    // In Krutidev, | is used for danda (।) and || for double danda (॥).
    // This is the MOST common artifact in NCERT Hindi PDFs.
    .replace(/\|\|/g, "॥")
    .replace(/\|/g, "।")

    // Step 3: Fix ।। sequences that remain after the pipe replacement
    .replace(/।।/g, "॥")

    // Step 4: Fix stray space before matra signs.
    // Matras (vowel signs) attach to the preceding consonant. The library
    // sometimes inserts a space before them, producing " ा" instead of "ा".
    // Unicode ranges: ा–ौ = U+093E–U+094F, ं ः ँ = U+0902–U+0903 U+0901
    // Also includes ़ (nukta, U+093C) and ् (virama/halant, U+094D)
    .replace(/ ([\u093C-\u094F\u0900-\u0903])/g, "$1")

    // Step 5: Fix stray space before chandrabindu ँ and anudatta
    .replace(/ ([\u0900\u0901\u0902\u0903])/g, "$1")

    // Step 6: Remove backslash-f artifacts from some PDF encodings
    .replace(/\\f/g, "")
    .replace(/\f/g, "\n")

    // Step 7: Remove zero-width non-joiner (U+200C) when it appears between
    // a consonant and a matra (it should only appear for explicit non-joining)
    .replace(/(?<=[\u0900-\u097F])\u200C(?=[\u093E-\u094F])/g, "")

    // Step 8: Normalize horizontal whitespace (but preserve newlines)
    .replace(/[^\S\n]{2,}/g, " ")

    .trim();
}

// ─── Conversion Quality Assessment ───────────────────────────────────────────
// After conversion, we measure how much of the output is Devanagari to
// understand how well the conversion worked. This is only used for logging.

function assessQuality(text: string): { ratio: number; grade: "excellent" | "good" | "partial" | "poor" } {
  const nonSpaceChars = text.replace(/[\s\d\+\-\=\(\)\[\]\.\,\:\;\*\/]/g, "").length;
  if (nonSpaceChars === 0) return { ratio: 0, grade: "poor" };

  const devanagariChars = (text.match(/[\u0900-\u097F]/g) || []).length;
  const ratio = devanagariChars / nonSpaceChars;

  const grade =
    ratio > 0.65 ? "excellent" :
    ratio > 0.40 ? "good" :
    ratio > 0.20 ? "partial" :
    "poor";

  return { ratio, grade };
}

// ─── Main Conversion ─────────────────────────────────────────────────────────

function convertKrutidevIfNeeded(text: string): string {
  if (!isKrutidevEncoded(text)) {
    console.log("[pdf] Text detected as Unicode — no Krutidev conversion needed");
    return text;
  }

  console.log(`[pdf] Krutidev detected — starting line-by-line conversion (${text.length} chars)`);

  try {
    const lines = text.split("\n");
    let convertedCount = 0;
    let preservedCount = 0;
    let skippedCount = 0;

    const processedLines = lines.map((line: string) => {
      const cls = classifyLine(line);

      if (cls === "preserve" || cls === "unicode") {
        if (cls === "preserve") preservedCount++;
        else skippedCount++;
        return line;
      }

      // cls === "krutidev"
      try {
        const converted = krutidevToUnicode(line);
        const cleaned = postProcessDevanagari(converted);
        convertedCount++;
        return cleaned;
      } catch {
        // If a single line fails, keep the original rather than crashing
        preservedCount++;
        return line;
      }
    });

    const result = processedLines.join("\n");
    const { ratio, grade } = assessQuality(result);

    console.log(
      `[pdf] Conversion complete — ` +
      `converted: ${convertedCount} lines, ` +
      `preserved: ${preservedCount} lines, ` +
      `unicode-skipped: ${skippedCount} lines | ` +
      `Devanagari ratio: ${(ratio * 100).toFixed(1)}% | ` +
      `Quality: ${grade}`
    );

    if (grade === "poor") {
      console.warn(
        "[pdf] Conversion quality is poor — the AI will fall back to its NCERT " +
        "knowledge for this chapter. Consider uploading a Unicode Hindi PDF for better results."
      );
    }

    return result;
  } catch (err: any) {
    console.error(`[pdf] Krutidev conversion crashed: ${err?.message} — using raw text`);
    return text;
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

export function cleanText(text: string): string {
  // 1. Attempt Krutidev → Unicode Devanagari conversion
  const decoded = convertKrutidevIfNeeded(text);

  // 2. Collapse excessive blank lines (3+ → 2)
  const noExcessiveBlankLines = decoded.replace(/\n{3,}/g, "\n\n");

  // 3. Collapse runs of whitespace within lines (preserve newlines)
  const normalized = noExcessiveBlankLines.replace(/[^\S\n]+/g, " ");

  return normalized.trim();
}
