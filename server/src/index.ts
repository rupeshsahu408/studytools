import "express-async-errors";
import express from "express";
import dotenv from "dotenv";

dotenv.config();

import uploadRouter from "./routes/upload";
import generateRouter from "./routes/generate";
import ncertRouter from "./routes/ncert";
import chatRouter from "./routes/chat";

const app = express();
const PORT = process.env.PORT || 3001;

// Parse ALLOWED_ORIGIN env var — comma-separated list of allowed origins
// If not set, defaults to * (allow all) which is safe for development
const allowedOrigins = process.env.ALLOWED_ORIGIN
  ? process.env.ALLOWED_ORIGIN.split(",").map(o => o.trim())
  : ["*"];

// ─── CORS Middleware ────────────────────────────────────────────────────────
// Manual CORS implementation instead of the `cors` package.
// The `cors` package calls next(err) when origin is rejected, which causes
// the error handler to respond WITHOUT CORS headers — making the browser
// show a CORS error instead of the real error message.
// This middleware ALWAYS sets the headers first on every response.
app.use((req, res, next) => {
  const origin = req.headers.origin as string | undefined;
  const originAllowed =
    !origin ||
    allowedOrigins.includes("*") ||
    allowedOrigins.includes(origin);

  if (originAllowed) {
    res.setHeader("Access-Control-Allow-Origin", origin || "*");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
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
  });
});

app.use("/api/upload", uploadRouter);
app.use("/api/generate", generateRouter);
app.use("/api/ncert", ncertRouter);
app.use("/api/chat", chatRouter);

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
});
