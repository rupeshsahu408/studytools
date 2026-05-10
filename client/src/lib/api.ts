import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 120000,
});

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

export async function generateQuestions(text: string, subject: string, classNum: string, chapterName: string, language: string) {
  const res = await api.post("/api/generate/questions", { text, subject, classNum, chapterName, language });
  return res.data;
}

export async function fetchNCERTChapters(classNum: string, subject: string) {
  const res = await api.get("/api/ncert/chapters", { params: { classNum, subject } });
  return res.data.chapters;
}
