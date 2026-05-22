/* Topper 2.0 — Web Push Notification utilities */

const API_BASE = import.meta.env.VITE_API_URL || "";

// VAPID public key — read from env at build time (Vite), or fetched from server at runtime
let _vapidPublicKey: string | null = (import.meta.env.VITE_VAPID_PUBLIC_KEY as string) || null;

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export function getPermissionState(): NotificationPermission | "unsupported" {
  if (!isPushSupported()) return "unsupported";
  return Notification.permission;
}

/** Fetch VAPID public key from server if not available from env */
async function getVapidPublicKey(): Promise<string | null> {
  if (_vapidPublicKey) return _vapidPublicKey;
  try {
    const res = await fetch(`${API_BASE}/api/push/vapid-key`);
    if (!res.ok) return null;
    const data = await res.json();
    _vapidPublicKey = data.publicKey || null;
    return _vapidPublicKey;
  } catch {
    return null;
  }
}

/** Register the service worker (idempotent — safe to call on every mount) */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    return reg;
  } catch (e) {
    console.warn("[push] SW registration failed:", e);
    return null;
  }
}

/**
 * Request notification permission, register SW, and create a push subscription.
 * Returns null if the user denies or push isn't supported.
 * Throws with a typed reason so the caller can show useful UI.
 */
export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!isPushSupported()) throw new Error("unsupported");

  const vapidKey = await getVapidPublicKey();
  if (!vapidKey) throw new Error("no_vapid_key");

  const permission = await Notification.requestPermission();
  if (permission === "denied") throw new Error("denied");
  if (permission !== "granted") return null; // dismissed without a choice

  try {
    const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    await navigator.serviceWorker.ready;

    const existing = await reg.pushManager.getSubscription();
    if (existing) return existing;

    return await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    });
  } catch (e: any) {
    console.warn("[push] Subscribe failed:", e);
    throw new Error("subscribe_failed");
  }
}

/**
 * Unsubscribe from push notifications.
 * Returns true if successfully unsubscribed.
 */
export async function unsubscribeFromPush(): Promise<boolean> {
  if (!("serviceWorker" in navigator)) return false;
  try {
    const reg = await navigator.serviceWorker.getRegistration("/sw.js");
    if (!reg) return false;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return true;
    return await sub.unsubscribe();
  } catch (e) {
    console.warn("[push] Unsubscribe failed:", e);
    return false;
  }
}

/**
 * Get the current push subscription without requesting permission.
 * Returns null if no subscription exists.
 */
export async function getExistingSubscription(): Promise<PushSubscription | null> {
  if (!("serviceWorker" in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.getRegistration("/sw.js");
    if (!reg) return null;
    return reg.pushManager.getSubscription();
  } catch {
    return null;
  }
}

/** Call the backend to deliver a push notification to a given subscription */
export async function sendPushNotification(params: {
  subscription: PushSubscriptionJSON;
  title: string;
  body: string;
  url: string;
}): Promise<void> {
  try {
    await fetch(`${API_BASE}/api/push/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
  } catch (e) {
    console.warn("[push] sendPushNotification failed:", e);
  }
}
