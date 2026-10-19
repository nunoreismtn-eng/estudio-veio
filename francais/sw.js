// Calepin moved to https://nunoreismtn-eng.github.io/Calepin/ . This worker takes over the old address only to remove itself.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => {
  e.waitUntil(self.registration.unregister()
    .then(() => self.clients.matchAll({ type: "window" }))
    .then(list => Promise.all(list.map(c => c.navigate("https://nunoreismtn-eng.github.io/Calepin/").catch(() => {})))));
});
