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

export default router;
