import { Router, Request, Response } from "express";
import webpush from "web-push";

const router = Router();

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";
const VAPID_EMAIL = process.env.VAPID_EMAIL || "mailto:admin@topper2.com";

let vapidConfigured = false;

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  vapidConfigured = true;
  console.log("[push] VAPID configured ✓");
} else {
  console.warn("[push] VAPID keys not set — push notifications disabled");
}

/* ── POST /api/push/send ── */
router.post("/send", async (req: Request, res: Response) => {
  if (!vapidConfigured) {
    return res.status(503).json({ error: "Push not configured" });
  }

  const { subscription, title, body, url } = req.body as {
    subscription: webpush.PushSubscription;
    title?: string;
    body?: string;
    url?: string;
  };

  if (!subscription?.endpoint) {
    return res.status(400).json({ error: "Missing subscription endpoint" });
  }

  const payload = JSON.stringify({
    title: title || "Topper 2.0",
    body: body || "Someone replied to your post",
    url: url || "/community",
    tag: "topper-reply",
  });

  try {
    await webpush.sendNotification(subscription, payload);
    return res.json({ ok: true });
  } catch (err: any) {
    /* 410/404 = subscription expired or unregistered — client should clean up */
    if (err.statusCode === 410 || err.statusCode === 404) {
      return res.status(410).json({ error: "Subscription expired" });
    }
    console.error("[push] sendNotification error:", err.message);
    return res.status(500).json({ error: "Push delivery failed" });
  }
});

/* ── GET /api/push/vapid-key  (clients can fetch the public key) ── */
router.get("/vapid-key", (_req: Request, res: Response) => {
  res.json({ publicKey: VAPID_PUBLIC_KEY });
});

export default router;
