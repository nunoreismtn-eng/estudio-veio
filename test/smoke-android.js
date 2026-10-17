// Android (Chrome, Pixel) behaviour of the public site served like GitHub Pages under /estudio-veio/
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = '/home/claude/veio/site', SHOTS = '/home/claude/veio/test/shots/';
const WAV = '/home/claude/veio/test/fixtures/voice.wav';
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.txt': 'text/plain', '.md': 'text/plain' };
const log = (...a) => console.log(...a);
function serve(port) {
  const srv = http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (!p.startsWith('/estudio-veio/')) { res.writeHead(404); return res.end('nf'); }
    p = p.slice('/estudio-veio'.length); if (p.endsWith('/')) p += 'index.html';
    const f = path.join(ROOT, p);
    if (!f.startsWith(ROOT) || !fs.existsSync(f)) { res.writeHead(404); return res.end('nf'); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'max-age=600' });
    fs.createReadStream(f).pipe(res);
  });
  return new Promise(r => srv.listen(port, '127.0.0.1', () => r(srv)));
}
(async () => {
  const srv = await serve(8765);
  const URL0 = 'http://127.0.0.1:8765/estudio-veio/';
  const browser = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--use-file-for-fake-audio-capture=' + WAV] });
  const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2.6, isMobile: true, hasTouch: true,
    userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36' });
  await ctx.grantPermissions(['microphone'], { origin: 'http://127.0.0.1:8765' });
  const page = await ctx.newPage(); const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' || /Intervention/i.test(m.text())) errors.push(m.type() + ': ' + m.text()); });
  await page.goto(URL0); await page.waitForTimeout(800);

  const tab = () => page.evaluate(() => { const b = document.querySelector('#tabbar [aria-selected="true"]'); return b && b.dataset.tab; });
  const hs = () => page.evaluate(() => JSON.stringify(history.state) + ' len=' + history.length);
  const sheet = () => page.evaluate(() => !document.getElementById('sheet-wrap').hidden);
  const live = () => page.evaluate(() => document.documentElement.classList.contains('live'));
  const back = async () => { await page.evaluate(() => history.back()); await page.waitForTimeout(300); };
  const setVis = v => page.evaluate(v => { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => v }); Object.defineProperty(document, 'hidden', { configurable: true, get: () => v === 'hidden' }); document.dispatchEvent(new Event('visibilitychange')); }, v);

  const sw = await page.evaluate(async () => { const r = await navigator.serviceWorker.ready; const ks = await caches.keys(); const c = await caches.open(ks.find(k => k.startsWith('veio-') && k !== 'veio-fonts')); return { state: r.active && r.active.state, scope: r.scope, caches: ks, files: (await c.keys()).map(q => new URL(q.url).pathname) }; });
  log('SW', JSON.stringify(sw));
  log('START', await tab(), await hs());

  // tab → back returns to Hoje, page stays
  await page.tap('.tab[data-tab="treinar"]'); await page.waitForTimeout(200);
  log('TREINAR', await tab(), await hs());
  await back(); log('BACK → ', await tab(), await hs(), '| url', page.url());

  // sheet on Hoje → back closes it
  await page.tap('.plan-row >> nth=0'); await page.waitForTimeout(250);
  log('SHEET open', await sheet(), await hs());
  await back(); log('BACK → sheet', await sheet(), '| tab', await tab(), await hs());

  // closing with ✕ drops the guard entry
  await page.tap('.plan-row >> nth=0'); await page.waitForTimeout(250);
  await page.tap('#sheet-close'); await page.waitForTimeout(300);
  log('X-CLOSE sheet', await sheet(), await hs());

  // Treinar + sheet: back closes sheet, back again → Hoje
  await page.tap('.tab[data-tab="treinar"]'); await page.waitForTimeout(200);
  await page.tap('.ex-row [data-act="open-ex"], [data-act="open-ex"] >> nth=0'); await page.waitForTimeout(250);
  await back(); log('BACK1 sheet', await sheet(), '| tab', await tab());
  await back(); log('BACK2 sheet', await sheet(), '| tab', await tab(), await hs());

  // typing hides the tab bar
  await page.tap('.page-head [data-act="settings"]'); await page.waitForTimeout(250);
  await page.focus('#set-name'); await page.waitForTimeout(60);
  log('TYPING', await page.evaluate(() => document.body.classList.contains('typing')), '| tabbar display', await page.evaluate(() => getComputedStyle(document.getElementById('tabbar')).display));
  await page.evaluate(() => document.activeElement.blur()); await page.waitForTimeout(150);
  log('TYPING after blur', await page.evaluate(() => document.body.classList.contains('typing')));
  await back();

  // recording: back does not leave; leaving the app stops and analyses
  await page.tap('.tab[data-tab="estudio"]'); await page.waitForTimeout(250);
  await page.tap('#btn-rec'); await page.waitForTimeout(2500);
  log('REC live-class', await live(), '| pressed', await page.getAttribute('#btn-rec', 'aria-pressed'));
  await back();
  log('BACK while REC pressed', await page.getAttribute('#btn-rec', 'aria-pressed'), '| tab', await tab(), '| toast', await page.locator('#toast').innerText().catch(() => ''), await hs());
  await page.waitForTimeout(3000);
  await setVis('hidden');
  await page.waitForSelector('.res-hero', { timeout: 20000 }).catch(() => {});
  await setVis('visible'); await page.waitForTimeout(250);
  log('LEFT APP result', await page.locator('.res-hero').count(), '| toast', await page.locator('#toast').innerText().catch(() => ''), '| live-class', await live());
  await page.screenshot({ path: SHOTS + 'a2-resultado.png' });
  await back(); log('BACK from result', await tab());

  // drill: screen kept on, pauses when the app is left, back closes and releases
  await page.tap('.tab[data-tab="ferramentas"]'); await page.waitForTimeout(200);
  await page.tap('[data-act="tool-seg"][data-v="voz"]'); await page.tap('[data-act="tool"][data-tool="warmup"]'); await page.waitForTimeout(200);
  await page.tap('#sheet-body [data-act="start-ex"]'); await page.waitForTimeout(200);
  await page.tap('[data-act="drill-go"]'); await page.waitForTimeout(1500);
  log('DRILL live-class', await live());
  await setVis('hidden'); await page.waitForTimeout(100); await setVis('visible');
  log('DRILL after leaving', (await page.locator('#d-pause').innerText()).trim());
  await back(); await page.waitForTimeout(300);
  log('DRILL back → sheet', await sheet(), '| live-class', await live(), '| tab', await tab());
  await back();

  // install card (Chrome's beforeinstallprompt)
  await page.evaluate(() => { const e = new Event('beforeinstallprompt', { cancelable: true }); e.prompt = async () => { window.__prompted = true; }; e.userChoice = Promise.resolve({ outcome: 'accepted' }); window.dispatchEvent(e); });
  await page.waitForTimeout(250);
  log('INSTALL card', await page.locator('[data-act="install"]').count(), '| tab', await tab());
  await page.screenshot({ path: SHOTS + 'a1-hoje-instalar.png' });
  await page.tap('[data-act="install"]'); await page.waitForTimeout(250);
  log('INSTALL prompted', await page.evaluate(() => window.__prompted), '| card after', await page.locator('[data-act="install"]').count());

  // offline: stop the server, reopen
  srv.closeAllConnections(); await new Promise(r => srv.close(r));
  await page.reload(); await page.waitForTimeout(900);
  log('OFFLINE h1', await page.locator('h1').innerText().catch(e => 'ERR ' + e.message), '| controlled', await page.evaluate(() => !!navigator.serviceWorker.controller));
  log('ERRORS', JSON.stringify(errors, null, 1));
  await browser.close();
})().catch(e => { console.error('FAIL', e); process.exit(1); });
