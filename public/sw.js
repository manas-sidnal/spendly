/* Spendly service worker.
 *
 * Deliberately small and safe:
 *  - It only ever stores the static shell (offline page, icons, manifest) and the
 *    content-hashed files under /_next/static/. Those are identical for every user.
 *  - It never stores pages (they are per-user and sit behind login) and never touches /api/*.
 *  - Navigations always go to the network; the offline page is only shown when that fails.
 */
const VERSION = "v1";
const CACHE = "spendly-static-" + VERSION;
const OFFLINE_URL = "/offline.html";
const PRECACHE = [
  OFFLINE_URL,
  "/manifest.webmanifest",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-512-maskable.png",
  "/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("spendly-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || req.headers.has("range")) return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  // Never intercept or store API traffic (user-specific financial data).
  if (url.pathname.startsWith("/api/")) return;

  // Pages: network only. If the network is unreachable, show the offline page.
  if (req.mode === "navigate") {
    event.respondWith(fetch(req).catch(() => caches.match(OFFLINE_URL)));
    return;
  }

  // Hashed build assets and the precached shell: cache first.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok && res.type === "basic") {
              const copy = res.clone();
              caches.open(CACHE).then((cache) => cache.put(req, copy));
            }
            return res;
          }),
      ),
    );
    return;
  }

  if (PRECACHE.includes(url.pathname)) {
    event.respondWith(caches.match(req).then((hit) => hit || fetch(req)));
  }
  // Everything else falls through to the browser's normal network handling.
});
