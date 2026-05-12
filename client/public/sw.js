/* Topper 2.0 — Service Worker for Web Push Notifications */

const APP_NAME = "Topper 2.0";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

/* ── Push handler ── */
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data?.json() || {};
  } catch {
    data = { body: event.data?.text() || "New notification" };
  }

  const title = data.title || APP_NAME;
  const options = {
    body: data.body || "Someone replied to your post",
    icon: "/favicon.svg",
    badge: "/favicon.svg",
    tag: data.tag || "topper-reply",
    renotify: true,
    data: { url: data.url || "/" },
    vibrate: [150, 50, 150],
    actions: [
      { action: "open", title: "View Reply" },
      { action: "dismiss", title: "Dismiss" },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

/* ── Notification click handler ── */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "dismiss") return;

  const url = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        /* Focus an already-open tab if possible */
        for (const client of clientList) {
          if ("focus" in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        /* Otherwise open a new tab */
        if (self.clients.openWindow) {
          return self.clients.openWindow(url);
        }
      })
  );
});
