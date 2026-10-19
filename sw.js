// Estúdio Veio: works offline once opened. Page network-first (updates arrive on the next open),
// own files cache-first, Google Fonts kept for offline use.
// Other apps live under this path (e.g. francais/): this worker only touches its own page, files and caches.
const CACHE = "veio-570c47d3a2", FONTS = "veio-fonts";
const CORE = ["./", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./icon-maskable-512.png", "./apple-touch-icon.png"];
const SCOPE = new URL(self.registration.scope).pathname;
const OWN = new Set(CORE.map(u => new URL(u, self.registration.scope).pathname));
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE.map(u => new Request(u, { cache: "reload" })))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith("veio-") && k !== CACHE && k !== FONTS).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
function page(req) {
  return new Promise(resolve => {
    let done = false;
    const finish = r => { if (!done && r) { done = true; resolve(r); } };
    const cached = () => caches.open(CACHE).then(c => c.match("./"));
    const slow = setTimeout(() => cached().then(finish), 4000);
    // always revalidate the page with the server, so a new version shows on the next open
    fetch(req.url, { cache: "no-cache", credentials: "same-origin" }).then(res => {
      clearTimeout(slow);
      if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put("./", copy)); }
      finish(res.redirected ? new Response(res.body, { status: res.status, statusText: res.statusText, headers: res.headers }) : res);
    }).catch(() => { clearTimeout(slow); cached().then(hit => finish(hit || Response.error())); });
  });
}
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === self.location.origin) {
    if (req.mode === "navigate") { if (url.pathname === SCOPE || url.pathname === SCOPE + "index.html") e.respondWith(page(req)); return; }
    if (OWN.has(url.pathname)) e.respondWith(caches.open(CACHE).then(c => c.match(req)).then(hit => hit || fetch(req)));
    return;
  }
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    e.respondWith(caches.open(FONTS).then(c => c.match(req).then(hit => {
      const net = fetch(req).then(res => { if (res && (res.ok || res.type === "opaque")) c.put(req, res.clone()); return res; }).catch(() => hit || Response.error());
      return hit || net;
    })));
  }
});
