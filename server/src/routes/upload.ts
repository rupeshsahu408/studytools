import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { extractTextFromPDF, cleanText } from "../services/pdf";
import { callNvidia } from "../services/nvidia";
import { detectLanguagePrompt } from "../services/prompts";

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../../uploads");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${uuidv4()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Only PDF files are allowed"));
  },
});

// POST /api/upload — upload a PDF file directly
router.post("/", upload.single("pdf"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No PDF file uploaded" });
  }

  const { subject, classNum, chapterName } = req.body;
  if (!subject || !classNum || !chapterName) {
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: "Subject, class, and chapter name are required" });
  }

  const rawText = await extractTextFromPDF(req.file.path);
  const cleanedText = cleanText(rawText);

  if (cleanedText.length < 100) {
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: "Could not extract text from PDF. Please try a different file." });
  }

  const langRaw = await callNvidia(
    "You detect language. Respond with only 'hindi' or 'english'.",
    detectLanguagePrompt(cleanedText)
  );
  const language = langRaw.toLowerCase().includes("hindi") ? "hindi" : "english";

  const chapterId = uuidv4();
  fs.unlinkSync(req.file.path);

  res.json({
    chapterId,
    subject,
    classNum,
    chapterName,
    language,
    textLength: cleanedText.length,
    text: cleanedText,
  });
});

// POST /api/upload/url — fetch an NCERT PDF from a public URL and process it
router.post("/url", async (req, res) => {
  const { url, subject, classNum, chapterName } = req.body;

  if (!url || !subject || !classNum || !chapterName) {
    return res.status(400).json({ error: "URL, subject, class, and chapter name are required" });
  }

  const uploadDir = path.join(__dirname, "../../uploads");
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  const tempPath = path.join(uploadDir, `${uuidv4()}.pdf`);

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

    const rawText = await extractTextFromPDF(tempPath);
    const cleanedText = cleanText(rawText);

    if (cleanedText.length < 100) {
      fs.unlinkSync(tempPath);
      return res.status(400).json({
        error: "Could not extract text from the NCERT PDF. Please download and upload it manually.",
      });
    }

    const langRaw = await callNvidia(
      "You detect language. Respond with only 'hindi' or 'english'.",
      detectLanguagePrompt(cleanedText)
    );
    const language = langRaw.toLowerCase().includes("hindi") ? "hindi" : "english";

    const chapterId = uuidv4();
    fs.unlinkSync(tempPath);

    res.json({
      chapterId,
      subject,
      classNum,
      chapterName,
      language,
      textLength: cleanedText.length,
      text: cleanedText,
    });
  } catch (err: any) {
    if (fs.existsSync(tempPath)) {
      try { fs.unlinkSync(tempPath); } catch {}
    }
    throw err;
  }
});

export default router;
