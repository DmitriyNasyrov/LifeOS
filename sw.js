// LifeOS Service Worker v3 — push-уведомления + безопасное кэширование (сеть всегда в приоритете)
const CACHE = "lifeos-v5";

self.addEventListener("install", (e) => { self.skipWaiting(); });
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((k) => (k !== CACHE ? caches.delete(k) : null)))).then(() => self.clients.claim())
  );
});

// Сеть в приоритете; кэш — только когда сети нет (офлайн)
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request)
      .then((r) => {
        if (r.ok && new URL(e.request.url).origin === location.origin) {
          const copy = r.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return r;
      })
      .catch(() => caches.match(e.request).then((r) => r || caches.match("./index.html")))
  );
});

// Push от сервера LifeOS
self.addEventListener("push", (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { title: "LifeOS", body: e.data ? e.data.text() : "" }; }
  e.waitUntil(
    self.registration.showNotification(d.title || "LifeOS", {
      body: d.body || "",
      icon: "./icon-192.png",
      badge: "./icon-192.png",
      tag: d.tag || undefined,
    })
  );
});

// Локальные уведомления из открытого приложения
self.addEventListener("message", (e) => {
  const d = e.data || {};
  if (d.type === "notify") {
    self.registration.showNotification(d.title || "LifeOS", {
      body: d.body || "", icon: "./icon-192.png", badge: "./icon-192.png", tag: d.tag || undefined,
    });
  }
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(clients.matchAll({ type: "window" }).then((cs) => (cs[0] ? cs[0].focus() : clients.openWindow("./"))));
});
