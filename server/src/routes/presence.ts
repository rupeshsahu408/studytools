import express from "express";
import { upsertSession } from "../services/presence";

const router = express.Router();

// POST /api/presence/heartbeat
// Body: { sessionId: string, userId?: string, page: string }
// Called by every browser tab every 30 seconds.
router.post("/heartbeat", (req, res) => {
  const { sessionId, userId, page } = req.body as {
    sessionId?: string;
    userId?: string;
    page?: string;
  };

  if (!sessionId || typeof sessionId !== "string" || sessionId.length > 128) {
    return res.status(400).json({ error: "Invalid sessionId" });
  }

  upsertSession(sessionId, {
    userId: userId && typeof userId === "string" ? userId : undefined,
    page: typeof page === "string" ? page.slice(0, 64) : "/",
  });

  res.json({ ok: true });
});

export default router;
