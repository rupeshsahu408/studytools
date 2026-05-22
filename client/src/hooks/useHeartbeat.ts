import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

// Generates a stable per-browser session ID stored in localStorage.
function getSessionId(): string {
  const key = "topper_sid";
  let sid = localStorage.getItem(key);
  if (!sid) {
    sid = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(key, sid);
  }
  return sid;
}

const HEARTBEAT_INTERVAL_MS = 30_000;
const API_BASE = import.meta.env.VITE_API_URL || "";

export function useHeartbeat(userId?: string | null) {
  const location = useLocation();
  const pageRef  = useRef(location.pathname);
  const userRef  = useRef(userId);

  useEffect(() => { pageRef.current = location.pathname; }, [location.pathname]);
  useEffect(() => { userRef.current = userId; }, [userId]);

  useEffect(() => {
    const sessionId = getSessionId();

    const send = () => {
      const body: Record<string, string> = {
        sessionId,
        page: pageRef.current,
      };
      if (userRef.current) body.userId = userRef.current;

      fetch(`${API_BASE}/api/presence/heartbeat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        // Use keepalive so the request survives tab close
        keepalive: true,
      }).catch(() => {});
    };

    // Fire immediately on mount
    send();

    const timer = setInterval(send, HEARTBEAT_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []); // run once — refs keep values current
}
