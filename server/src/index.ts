import "express-async-errors";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

import uploadRouter from "./routes/upload";
import generateRouter from "./routes/generate";
import ncertRouter from "./routes/ncert";
import chatRouter from "./routes/chat";

const app = express();
const PORT = process.env.PORT || 3001;

// In production, ALLOWED_ORIGIN should be set to your Vercel frontend URL.
// Multiple origins can be comma-separated: https://app.vercel.app,https://custom-domain.com
const allowedOrigins = process.env.ALLOWED_ORIGIN
  ? process.env.ALLOWED_ORIGIN.split(",").map(o => o.trim())
  : ["*"];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error(`CORS: Origin ${origin} not allowed`));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", message: "Topper 2.0 API running", env: process.env.NODE_ENV || "development" });
});

app.use("/api/upload", uploadRouter);
app.use("/api/generate", generateRouter);
app.use("/api/ncert", ncertRouter);
app.use("/api/chat", chatRouter);

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Error:", err.message);
  res.status(500).json({ error: err.message || "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Topper 2.0 API running on port ${PORT}`);
});
