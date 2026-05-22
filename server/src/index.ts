import "express-async-errors";
import express from "express";
import dotenv from "dotenv";

dotenv.config();

import uploadRouter from "./routes/upload";
import generateRouter from "./routes/generate";
import ncertRouter from "./routes/ncert";
import chatRouter from "./routes/chat";
import simulationsRouter from "./routes/simulations";
import pushRouter from "./routes/push";
import adminRouter from "./routes/admin";
import statusRouter from "./routes/status";
import { MODEL, checkModelHealth, runStartupHealthCheck } from "./services/nvidia";

const app = express();
const PORT = process.env.PORT || 3001;

// ─── CORS Middleware ────────────────────────────────────────────────────────
// Always echo the incoming origin back (or "*" if there is none).
// This ensures CORS headers are present on EVERY response — including
// multipart/form-data uploads and error responses — regardless of what
// ALLOWED_ORIGIN is set to in the environment.
app.use((req, res, next) => {
  const origin = req.headers.origin as string | undefined;
  res.setHeader("Access-Control-Allow-Origin", origin || "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-admin-secret, x-seed-secret");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Vary", "Origin");

  // Respond immediately to preflight OPTIONS requests
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    message: "Topper 2.0 API running",
    env: process.env.NODE_ENV || "development",
    model: MODEL,
  });
});

app.get("/api/health/ai", async (_req, res) => {
  const result = await checkModelHealth();
  res.status(result.ok ? 200 : 503).json(result);
});

app.use("/api/upload", uploadRouter);
app.use("/api/generate", generateRouter);
app.use("/api/ncert", ncertRouter);
app.use("/api/chat", chatRouter);
app.use("/api/simulations", simulationsRouter);
app.use("/api/push", pushRouter);
app.use("/api/admin", adminRouter);
app.use("/api/status", statusRouter);

// ─── Global Error Handler ───────────────────────────────────────────────────
// CORS headers are already set by the middleware above, so all error
// responses will also carry the correct Access-Control-Allow-Origin header.
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Error:", err.message);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ error: err.message || "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Topper 2.0 API running on port ${PORT}`);
  runStartupHealthCheck();
});
