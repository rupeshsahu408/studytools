import fs from "fs";

// pdf-parse v1 — exports a single function: pdf(buffer) => Promise<{text}>
const pdfParse = require("pdf-parse");

export async function extractTextFromPDF(filePath: string): Promise<string> {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdfParse(dataBuffer);
  return data.text || "";
}

export function cleanText(text: string): string {
  return text
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\s{3,}/g, " ")
    .replace(/[^\S\n]+/g, " ")
    .trim();
}
