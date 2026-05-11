import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import os from "os";
import { v4 as uuidv4 } from "uuid";
import { extractTextFromPDF, cleanText } from "../services/pdf";

// ─── Pure-backend language detection ─────────────────────────────────────────
// Counts Devanagari Unicode characters in a sample of the text.
// No AI call needed — character counting is instant and highly reliable.
function detectLanguage(text: string): "hindi" | "english" {
  const sample = text.slice(0, 4000);
  const devanagariCount = (sample.match(/[\u0900-\u097F]/g) || []).length;
  // If more than 5% of characters are Devanagari, it's Hindi
  return devanagariCount / sample.length > 0.05 ? "hindi" : "english";
}

const router = express.Router();

// Use os.tmpdir() — guaranteed writable on all platforms including Render/cloud
const UPLOAD_DIR = path.join(os.tmpdir(), "topper-uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    cb(null, `${uuidv4()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Only PDF files are allowed"));
  },
});

function safeUnlink(filePath: string) {
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch {}
}

// POST /api/upload — upload a PDF file directly
router.post("/", (req, res, next) => {
  upload.single("pdf")(req, res, async (err) => {
    // Handle multer errors (file too large, wrong type, etc.)
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ error: "File too large. Maximum size is 20MB." });
      }
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No PDF file uploaded" });
    }

    const { subject, classNum, chapterName } = req.body;
    if (!subject || !classNum || !chapterName) {
      safeUnlink(req.file.path);
      return res.status(400).json({ error: "Subject, class, and chapter name are required" });
    }

    try {
      const { text: rawText, pageCount } = await extractTextFromPDF(req.file.path);
      const cleanedText = cleanText(rawText);

      if (cleanedText.length < 100) {
        safeUnlink(req.file.path);
        return res.status(400).json({ error: "Could not extract text from PDF. Please try a different file." });
      }

      const language = detectLanguage(cleanedText);

      safeUnlink(req.file.path);

      return res.json({
        chapterId: uuidv4(),
        subject,
        classNum,
        chapterName,
        language,
        pageCount,
        textLength: cleanedText.length,
        text: cleanedText,
      });
    } catch (error: any) {
      safeUnlink(req.file.path);
      next(error);
    }
  });
});

// POST /api/upload/url — fetch an NCERT PDF from a public URL and process it
router.post("/url", async (req, res, next) => {
  const { url, subject, classNum, chapterName } = req.body;

  if (!url || !subject || !classNum || !chapterName) {
    return res.status(400).json({ error: "URL, subject, class, and chapter name are required" });
  }

  const tempPath = path.join(UPLOAD_DIR, `${uuidv4()}.pdf`);

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/pdf,*/*",
        "Referer": "https://ncert.nic.in/",
      },
    });

    if (!response.ok) {
      return res.status(400).json({
        error: `Failed to download PDF from NCERT (${response.status}). Please download the PDF manually and upload it.`,
      });
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("pdf") && !contentType.includes("octet-stream")) {
      return res.status(400).json({
        error: "The URL did not return a PDF file. Please download the PDF manually and upload it.",
      });
    }

    const buffer = await response.arrayBuffer();
    fs.writeFileSync(tempPath, Buffer.from(buffer));

    const { text: rawText, pageCount } = await extractTextFromPDF(tempPath);
    const cleanedText = cleanText(rawText);

    if (cleanedText.length < 100) {
      safeUnlink(tempPath);
      return res.status(400).json({
        error: "Could not extract text from the NCERT PDF. Please download and upload it manually.",
      });
    }

    const language = detectLanguage(cleanedText);

    safeUnlink(tempPath);

    return res.json({
      chapterId: uuidv4(),
      subject,
      classNum,
      chapterName,
      language,
      pageCount,
      textLength: cleanedText.length,
      text: cleanedText,
    });
  } catch (error: any) {
    safeUnlink(tempPath);
    next(error);
  }
});

export default router;
