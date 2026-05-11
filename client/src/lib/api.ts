import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 120000,
});

// ─── Phase 1 ──────────────────────────────────────────────────────────────

export async function uploadPDF(file: File, subject: string, classNum: string, chapterName: string) {
  const formData = new FormData();
  formData.append("pdf", file);
  formData.append("subject", subject);
  formData.append("classNum", classNum);
  formData.append("chapterName", chapterName);
  const res = await api.post("/api/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function generateNotes(text: string, subject: string, classNum: string, chapterName: string, language: string) {
  const res = await api.post("/api/generate/notes", { text, subject, classNum, chapterName, language });
  return res.data;
}

export async function regenerateNotes(text: string, subject: string, classNum: string, chapterName: string, language: string) {
  const res = await api.post("/api/generate/notes", { text, subject, classNum, chapterName, language }, { timeout: 180000 });
  return res.data;
}

export async function generateQuestions(text: string, subject: string, classNum: string, chapterName: string, language: string) {
  const res = await api.post("/api/generate/questions", { text, subject, classNum, chapterName, language });
  return res.data;
}

export async function regenerateQuestionBatch(
  text: string, subject: string, classNum: string,
  chapterName: string, language: string, batch: "A" | "B"
): Promise<{ questions: Record<string, any[]>; failedBatches: string[] }> {
  const res = await api.post("/api/generate/questions", { text, subject, classNum, chapterName, language, batch });
  return res.data;
}

export async function fetchNCERTChapters(classNum: string, subject: string) {
  const res = await api.get("/api/ncert/chapters", { params: { classNum, subject } });
  return res.data.chapters;
}

// ─── Phase 2 ──────────────────────────────────────────────────────────────

export async function generateFormulas(text: string, subject: string, classNum: string, chapterName: string, language: string) {
  const res = await api.post("/api/generate/formulas", { text, subject, classNum, chapterName, language });
  return res.data;
}

export async function generateMindmap(text: string, subject: string, classNum: string, chapterName: string, language: string) {
  const res = await api.post("/api/generate/mindmap", { text, subject, classNum, chapterName, language });
  return res.data;
}

export async function generateMistakes(text: string, subject: string, classNum: string, chapterName: string, language: string) {
  const res = await api.post("/api/generate/mistakes", { text, subject, classNum, chapterName, language });
  return res.data;
}

export async function generateFlashcards(text: string, subject: string, classNum: string, chapterName: string, language: string) {
  const res = await api.post("/api/generate/flashcards", { text, subject, classNum, chapterName, language });
  return res.data;
}

export async function sendChatMessage(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  chapterContext: string,
  chapterName: string,
  subject: string,
  language: string
) {
  const res = await api.post("/api/chat", { messages, chapterContext, chapterName, subject, language });
  return res.data;
}

// ─── Phase 3 ──────────────────────────────────────────────────────────────

export async function generateSimulationCatalog(text: string, subject: string, classNum: string, chapterName: string) {
  const res = await api.post("/api/generate/simulations", { text, subject, classNum, chapterName });
  return res.data;
}

// ─── Phase 4 ──────────────────────────────────────────────────────────────

export interface WeakAreaChapterInput {
  chapterName: string;
  subject: string;
  classNum: string;
  totalAttempted: number;
  totalWrong: number;
  wrongQuestions: Array<{ id: string; question: string; type: string }>;
}

export interface WeakAreaResult {
  chapterName: string;
  subject: string;
  weakTopics: string[];
  advice: string;
  priority: "high" | "medium" | "low";
}

export async function analyzeWeakAreas(chapters: WeakAreaChapterInput[]): Promise<{ weakAreas: WeakAreaResult[] }> {
  const res = await api.post("/api/generate/weakareas", { chapters }, { timeout: 90000 });
  return res.data;
}

// ─── Exam Paper ────────────────────────────────────────────────────────────

export async function generateExamPaper(
  text: string, subject: string, classNum: string,
  chapterName: string, language: string
) {
  const res = await api.post("/api/generate/exampaper", { text, subject, classNum, chapterName, language }, { timeout: 180000 });
  return res.data;
}

export async function generateSummary(
  text: string, subject: string, classNum: string,
  chapterName: string, language: string
) {
  const res = await api.post("/api/generate/summary", { text, subject, classNum, chapterName, language }, { timeout: 90000 });
  return res.data;
}
