#!/usr/bin/env python3
"""Build from src/: the Claude artifact page, the private standalone file, and the public site (GitHub Pages)."""
import json, pathlib, math, hashlib
from PIL import Image, ImageDraw

ROOT = pathlib.Path(__file__).parent
SRC = ROOT / "src"
DIST = ROOT / "dist"
SITE = ROOT / "site"
SCRATCH = pathlib.Path("/tmp/claude-0/-home-claude/2ce96e16-f172-537e-a0ea-1e8a59815d44/scratchpad")  # artifact source, when it exists
DIST.mkdir(exist_ok=True); SITE.mkdir(exist_ok=True)
# personal defaults (name, company) live only in private.json, which is git-ignored
PRIVATE = json.loads((ROOT / "private.json").read_text(encoding="utf-8")) if (ROOT / "private.json").exists() else {}

css = (SRC / "styles.css").read_text(encoding="utf-8")
body_js = "\n".join((SRC / f).read_text(encoding="utf-8") for f in ["content.js", "engine.js", "app.js"])
shell = (SRC / "shell.html").read_text(encoding="utf-8")
assert "</style" not in css.lower()

PAGES_URL = "https://nunoreismtn-eng.github.io/estudio-veio/"

def page(public):
    build = {"public": public, "micUrl": "" if public else PAGES_URL, "defaults": {} if public else PRIVATE}
    js = '(() => {\n"use strict";\nconst BUILD = ' + json.dumps(build, ensure_ascii=False) + ';\n' + body_js + '\n})();'
    if public:
        leaked = [v for v in PRIVATE.values() if v and v.lower() in js.lower()]
        assert not leaked, "personal data left in the public build: %s" % leaked
    assert "</script" not in js.lower()
    return shell.replace("/*CSS*/", css).replace("/*JS*/", js), js

RESET = ('<style>:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}'
         'body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>')
def standalone(html, extra_head=""):
    head, body = html.split("<!--HEAD-END-->")
    return ('<!doctype html>\n<html lang="pt-PT">\n<head>\n<meta charset="utf-8">\n'
            '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,interactive-widget=resizes-content">\n'
            '<meta name="theme-color" content="#F4F3F0" media="(prefers-color-scheme: light)">\n'
            '<meta name="theme-color" content="#0D0D0C" media="(prefers-color-scheme: dark)">\n'
            '<meta name="apple-mobile-web-app-capable" content="yes">\n'
            '<meta name="mobile-web-app-capable" content="yes">\n'
            '<meta name="apple-mobile-web-app-status-bar-style" content="default">\n'
            '<meta name="apple-mobile-web-app-title" content="Estúdio Veio">\n'
            + extra_head + RESET + "\n" + head.strip() + "\n</head>\n<body>\n" + body.strip() + "\n</body>\n</html>\n")

# 1) Claude artifact (private, personalised defaults)
art, js_private = page(False)
if SCRATCH.exists(): (SCRATCH / "estudio-veio.html").write_text(art, encoding="utf-8")
(DIST / "estudio-veio.html").write_text(art, encoding="utf-8")
(DIST / "app.js").write_text(js_private, encoding="utf-8")
# 2) private standalone file
(DIST / "estudio-veio-microfone.html").write_text(standalone(art), encoding="utf-8")
# 3) public site: no personal defaults, not indexed, installable
pub, js_public = page(True)
(DIST / "app-public.js").write_text(js_public, encoding="utf-8")
extra = ('<meta name="robots" content="noindex, nofollow">\n'
         '<link rel="manifest" href="manifest.webmanifest">\n'
         '<link rel="apple-touch-icon" href="apple-touch-icon.png">\n'
         '<link rel="icon" type="image/png" sizes="192x192" href="icon-192.png">\n')
(SITE / "index.html").write_text(standalone(pub, extra), encoding="utf-8")
(SITE / ".nojekyll").write_text("", encoding="utf-8")
(SITE / "robots.txt").write_text("User-agent: *\nDisallow: /\n", encoding="utf-8")
(SITE / "manifest.webmanifest").write_text(json.dumps({
    "id": "./", "name": "Estúdio Veio", "short_name": "Veio", "lang": "pt-PT", "description": "Treino de voz, histórias e comunicação.",
    "start_url": "./", "scope": "./", "display": "standalone", "orientation": "portrait",
    "background_color": "#F4F3F0", "theme_color": "#0D0D0C",
    "icons": [{"src": "icon-192.png", "sizes": "192x192", "type": "image/png"},
              {"src": "icon-512.png", "sizes": "512x512", "type": "image/png"},
              {"src": "icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"}]
}, ensure_ascii=False, indent=2), encoding="utf-8")
(SITE / "README.md").write_text("# Estúdio Veio\n\nTreino de voz, histórias e comunicação social, com análise do microfone feita no próprio aparelho.\n\n"
                                "**Abrir:** " + PAGES_URL + "\n\nNo Android, abre no Chrome e escolhe **Instalar app** (ou menu ⋮ → Adicionar ao ecrã principal).\n", encoding="utf-8")

# icons: the brand mark (two marble veins) on graphite
def bezier(p0, p1, p2, p3, n=80):
    return [tuple((1-t)**3*a + 3*(1-t)**2*t*b + 3*(1-t)*t**2*c + t**3*d for a, b, c, d in zip(p0, p1, p2, p3)) for t in [i/n for i in range(n+1)]]
def stroke(d, pts, w, fill):
    r = w/2
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        n = max(1, int(math.hypot(x1-x0, y1-y0)/(r*0.35)))
        for i in range(n+1):
            x = x0 + (x1-x0)*i/n; y = y0 + (y1-y0)*i/n
            d.ellipse([x-r, y-r, x+r, y+r], fill=fill)
def icon(size, maskable=False, radius_frac=0.22):
    S = 4; W = size*S
    bg = Image.new("RGBA", (W, W), (0, 0, 0, 0)); d = ImageDraw.Draw(bg)
    if maskable: d.rectangle([0, 0, W, W], fill=(13, 13, 12, 255)); scale = 0.62
    else: d.rounded_rectangle([0, 0, W-1, W-1], radius=int(W*radius_frac), fill=(13, 13, 12, 255)); scale = 0.78
    off = W*(1-scale)/2; k = W*scale/24
    P = lambda x, y: (off + x*k, off + y*k)
    main = bezier(P(3.5, 15.5), P(6.7, 14.9), P(7.7, 9.5), P(11.8, 9.5), 200) + bezier(P(11.8, 9.5), P(15.1, 9.5), P(15.2, 12.9), P(20.5, 11.7), 200)[1:]
    faint = Image.new("RGBA", (W, W), (0, 0, 0, 0)); fd = ImageDraw.Draw(faint)
    stroke(fd, bezier(P(6.5, 20.5), P(8.3, 18.3), P(11.1, 17.3), P(12.9, 14.3), 200), 1.5*k, (240, 239, 236, 255))
    stroke(fd, bezier(P(13.5, 9.6), P(14.1, 7.4), P(15.7, 5.6), P(18.1, 4.5), 200), 1.5*k, (240, 239, 236, 255))
    faint.putalpha(faint.getchannel("A").point(lambda a: int(a*0.55)))
    bg.alpha_composite(faint)
    stroke(ImageDraw.Draw(bg), main, 2.0*k, (240, 239, 236, 255))
    return bg.resize((size, size), Image.LANCZOS)
icon(192).save(SITE / "icon-192.png"); icon(512).save(SITE / "icon-512.png")
icon(512, maskable=True).save(SITE / "icon-maskable-512.png")
icon(180, radius_frac=0).save(SITE / "apple-touch-icon.png")

# service worker: opens offline once visited; page network-first so updates arrive on the next open
SW = r"""// Estúdio Veio: works offline once opened. Page network-first (updates arrive on the next open),
// own files cache-first, Google Fonts kept for offline use.
const CACHE = "veio-__VERSION__", FONTS = "veio-fonts";
const CORE = ["./", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./icon-maskable-512.png", "./apple-touch-icon.png"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE.map(u => new Request(u, { cache: "reload" })))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE && k !== FONTS).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
function page(req) {
  return new Promise(resolve => {
    let done = false;
    const finish = r => { if (!done && r) { done = true; resolve(r); } };
    const cached = () => caches.open(CACHE).then(c => c.match("./"));
    const slow = setTimeout(() => cached().then(finish), 4000);
    fetch(req).then(res => {
      clearTimeout(slow);
      if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put("./", copy)); }
      finish(res);
    }).catch(() => { clearTimeout(slow); cached().then(hit => finish(hit || Response.error())); });
  });
}
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === self.location.origin) {
    if (req.mode === "navigate") { e.respondWith(page(req)); return; }
    e.respondWith(caches.match(req).then(hit => hit || fetch(req)));
    return;
  }
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    e.respondWith(caches.open(FONTS).then(c => c.match(req).then(hit => {
      const net = fetch(req).then(res => { if (res && (res.ok || res.type === "opaque")) c.put(req, res.clone()); return res; }).catch(() => hit || Response.error());
      return hit || net;
    })));
  }
});
"""
digest = hashlib.sha256()
for f in ["index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "icon-maskable-512.png", "apple-touch-icon.png"]:
    digest.update((SITE / f).read_bytes())
(SITE / "sw.js").write_text(SW.replace("__VERSION__", digest.hexdigest()[:10]), encoding="utf-8")
print("artifact", len(art)//1024, "KB · site", (SITE/"index.html").stat().st_size//1024, "KB · sw", digest.hexdigest()[:10])
