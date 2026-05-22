// ─── In-Memory Presence Tracker ─────────────────────────────────────────────
// Each browser session sends a heartbeat every 30s.
// A session is "active" if its lastSeen is within the last 60 seconds.
// Cleanup runs every 2 minutes to prevent memory leaks.

export interface Session {
  lastSeen: number;
  userId?: string;
  page: string;
}

const sessions = new Map<string, Session>();

// Active = seen within last 60 s
const ACTIVE_WINDOW_MS = 60_000;

// Peak tracking (resets at midnight)
let peakToday = 0;
let peakDate = new Date().toISOString().split("T")[0];

export function upsertSession(sessionId: string, data: Omit<Session, "lastSeen">) {
  sessions.set(sessionId, { ...data, lastSeen: Date.now() });

  const active = getActiveSessions();
  const today = new Date().toISOString().split("T")[0];
  if (today !== peakDate) { peakToday = 0; peakDate = today; }
  if (active.length > peakToday) peakToday = active.length;
}

export function getActiveSessions(): Session[] {
  const cutoff = Date.now() - ACTIVE_WINDOW_MS;
  return [...sessions.values()].filter(s => s.lastSeen >= cutoff);
}

export function getLiveStats() {
  const active = getActiveSessions();
  const loggedIn  = active.filter(s => !!s.userId);
  const anonymous = active.filter(s => !s.userId);

  const pageCounts: Record<string, number> = {};
  active.forEach(s => {
    const p = s.page || "/";
    pageCounts[p] = (pageCounts[p] || 0) + 1;
  });
  const pageBreakdown = Object.entries(pageCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([page, count]) => ({ page, count }));

  return {
    totalLive:     active.length,
    loggedInLive:  loggedIn.length,
    anonymousLive: anonymous.length,
    pageBreakdown,
    peakToday,
  };
}

// Cleanup stale sessions every 2 minutes
setInterval(() => {
  const cutoff = Date.now() - 120_000;
  for (const [id, s] of sessions) {
    if (s.lastSeen < cutoff) sessions.delete(id);
  }
}, 120_000);
