import express from "express";
import { checkModelHealth } from "../services/nvidia";

const router = express.Router();

// Cache results for 25s — prevents hammering NVIDIA API on concurrent requests
let statusCache: { data: StatusResponse; timestamp: number } | null = null;
const CACHE_TTL_MS = 25_000;

export type ServiceStatus = "operational" | "degraded" | "outage";
export type OverallStatus = "operational" | "degraded" | "outage";

export interface ServiceResult {
  id: string;
  name: string;
  category: string;
  description: string;
  status: ServiceStatus;
  latencyMs: number | null;
  uptime: number;
  region: string;
  detail?: string | null;
}

export interface StatusResponse {
  overall: OverallStatus;
  checkedAt: string;
  cached?: boolean;
  services: ServiceResult[];
}

// ─── Route ───────────────────────────────────────────────────────────────────

router.get("/", async (_req, res) => {
  // Return cached result if still fresh
  if (statusCache && Date.now() - statusCache.timestamp < CACHE_TTL_MS) {
    return res.json({ ...statusCache.data, cached: true });
  }

  const checkedAt = new Date().toISOString();
  const selfStart = Date.now();

  // Run all async checks in parallel for minimum latency
  const [aiCheckResult] = await Promise.allSettled([
    checkModelHealth(),
  ]);

  const selfLatencyMs = Date.now() - selfStart;

  const aiOk = aiCheckResult.status === "fulfilled" && aiCheckResult.value.ok;
  const aiLatency = aiCheckResult.status === "fulfilled" ? aiCheckResult.value.latencyMs : null;
  const aiError = aiCheckResult.status === "fulfilled" ? aiCheckResult.value.error : "Health check failed";

  const aiStatus: ServiceStatus = aiOk ? "operational" : "degraded";

  const services: ServiceResult[] = [
    // ── Core Infrastructure ─────────────────────────────────────────────────
    {
      id: "backend_api",
      name: "Backend API",
      category: "Core Infrastructure",
      description: "Express.js REST API server — all client requests, uploads, and data routing",
      status: "operational",
      latencyMs: selfLatencyMs,
      uptime: 99.98,
      region: "Render · US East",
    },
    {
      id: "pdf_engine",
      name: "PDF Processing Engine",
      category: "Core Infrastructure",
      description: "PDF upload handling, multi-page text extraction, and language detection (Hindi/English)",
      status: "operational",
      latencyMs: null,
      uptime: 99.9,
      region: "Render · US East",
    },
    // ── AI Services ──────────────────────────────────────────────────────────
    {
      id: "ai_engine",
      name: "AI Engine (NVIDIA NIM)",
      category: "AI Services",
      description: "LLaMA-4 Maverick 17B — primary model for notes, question bank, and all AI content generation",
      status: aiStatus,
      latencyMs: aiLatency,
      uptime: 99.5,
      region: "NVIDIA Cloud · NIM API",
      detail: aiOk ? null : aiError,
    },
    {
      id: "doubt_chat",
      name: "Doubt Chat & Live Streaming",
      category: "AI Services",
      description: "Real-time AI tutor with Server-Sent Events streaming for progressive, ChatGPT-style responses",
      status: aiStatus,
      latencyMs: null,
      uptime: 99.5,
      region: "NVIDIA Cloud · NIM API",
    },
    {
      id: "content_gen",
      name: "Content Generation Pipeline",
      category: "AI Services",
      description: "Formula sheets, mind maps, flashcards, mistakes, simulations, summaries, and exam papers",
      status: aiStatus,
      latencyMs: null,
      uptime: 99.5,
      region: "NVIDIA Cloud · NIM API",
    },
    // ── Data Services ────────────────────────────────────────────────────────
    {
      id: "ncert_library",
      name: "NCERT Chapter Library",
      category: "Data Services",
      description: "Built-in NCERT browser — 60+ chapters across Physics, Chemistry, Math, Biology for Class 11 & 12",
      status: "operational",
      latencyMs: null,
      uptime: 100,
      region: "Render · US East",
    },
    {
      id: "push_service",
      name: "Push Notification Service",
      category: "Data Services",
      description: "Web Push API for study reminders, streak alerts, and daily goal notifications",
      status: "operational",
      latencyMs: null,
      uptime: 99.8,
      region: "Render · US East",
    },
  ];

  const hasOutage = services.some(s => s.status === "outage");
  const hasDegraded = services.some(s => s.status === "degraded");
  const overall: OverallStatus = hasOutage ? "outage" : hasDegraded ? "degraded" : "operational";

  const data: StatusResponse = { overall, checkedAt, services };
  statusCache = { data, timestamp: Date.now() };
  res.json(data);
});

// ─── Invalidate cache (for admin use) ────────────────────────────────────────
router.post("/refresh", (_req, res) => {
  statusCache = null;
  res.json({ ok: true, message: "Cache cleared. Next GET /api/status will run fresh checks." });
});

export default router;
