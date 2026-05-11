import fs from "fs";

// pdf-parse v1 — exports a single function: pdf(buffer) => Promise<{text}>
const pdfParse = require("pdf-parse");
const krutidevToUnicode = require("@anthro-ai/krutidev-unicode");

export async function extractTextFromPDF(filePath: string): Promise<string> {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdfParse(dataBuffer);
  return data.text || "";
}

/**
 * Detects if a text block looks like Krutidev-encoded Hindi.
 * Krutidev PDFs use ASCII chars to render Devanagari glyphs via a custom font.
 * Signature: high ratio of ASCII letters, very few/no actual Devanagari codepoints,
 * and contains specific Krutidev marker patterns (like "gS", "esa", "dk", etc.)
 */
function isKrutidevEncoded(text: string): boolean {
  const totalChars = text.length;
  if (totalChars < 50) return false;

  // Count actual Devanagari Unicode characters (U+0900–U+097F)
  const devanagariCount = (text.match(/[\u0900-\u097F]/g) || []).length;

  // Count ASCII letters
  const asciiLetterCount = (text.match(/[a-zA-Z]/g) || []).length;

  // If already has significant Devanagari content, skip conversion
  if (devanagariCount > 20) return false;

  // Must have a meaningful number of ASCII letters
  if (asciiLetterCount < 30) return false;

  // Krutidev ratio: mostly ASCII letters, almost no Devanagari
  const asciiRatio = asciiLetterCount / totalChars;
  if (asciiRatio < 0.15) return false;

  // Krutidev-specific bigram/trigram patterns that appear very frequently
  // in Hindi educational text encoded in Krutidev
  const krutidevPatterns = [
    /\besa\b/,    // "में"
    /\bgSA?\b/,   // "है" / "है।"
    /\bfd\b/,     // "कि"
    /\bdk\b/,     // "का" / "क्"
    /\bij\b/,     // "पर"
    /\bgksrk\b/,  // "होता"
    /[a-z][kj][a-z]/, // consonant + matra + consonant (very common Krutidev pattern)
    /bZ\b/,       // "ई" suffix (very common in Krutidev Hindi)
    /\biz[a-z]/,  // "प्र" prefix (extremely common in Hindi)
  ];

  const matchCount = krutidevPatterns.filter(p => p.test(text)).length;
  return matchCount >= 3;
}

/**
 * Converts Krutidev-encoded text to Unicode Devanagari.
 * Falls back to original text if conversion fails or isn't needed.
 */
function convertKrutidevIfNeeded(text: string): string {
  if (!isKrutidevEncoded(text)) return text;

  try {
    // Process paragraph by paragraph for better accuracy
    const converted = text
      .split("\n")
      .map((line: string) => {
        if (line.trim().length === 0) return line;
        // Only convert lines that look like Krutidev (some lines may be English)
        const lineAsciiRatio = (line.match(/[a-zA-Z]/g) || []).length / Math.max(line.length, 1);
        const lineDevanagari = (line.match(/[\u0900-\u097F]/g) || []).length;
        if (lineDevanagari > 5) return line; // already Unicode — skip
        if (lineAsciiRatio < 0.1) return line; // mostly numbers/punctuation — skip
        return krutidevToUnicode(line);
      })
      .join("\n");

    console.log(`[pdf] Krutidev → Unicode conversion applied (${text.length} chars)`);
    return converted;
  } catch (err: any) {
    console.warn(`[pdf] Krutidev conversion failed, using raw text: ${err?.message}`);
    return text;
  }
}

export function cleanText(text: string): string {
  // First attempt Krutidev → Unicode conversion
  const decoded = convertKrutidevIfNeeded(text);

  return decoded
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\s{3,}/g, " ")
    .replace(/[^\S\n]+/g, " ")
    .trim();
}
