const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const SHOTS = '/home/claude/veio/test/shots/';
const WAV = '/home/claude/veio/test/fixtures/voice.wav';
require('fs').mkdirSync(SHOTS, { recursive: true });
const log = (...a) => console.log(...a);
(async () => {
  const browser = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--use-file-for-fake-audio-capture=' + WAV] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await ctx.grantPermissions(['microphone', 'clipboard-read', 'clipboard-write']);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message + ' ' + (e.stack || '').split('\n').slice(0, 3).join(' | ')));
  page.on('console', m => { if (m.type() === 'error' && !/ERR_TUNNEL|net::/.test(m.text())) errors.push('console: ' + m.text()); });
  await page.goto('file:///home/claude/veio/dist/estudio-veio-microfone.html');
  await page.waitForTimeout(600);
  await page.screenshot({ path: SHOTS + '01-hoje.png', fullPage: true });

  // Treinar: filter and open a drill
  await page.click('.tab[data-tab="treinar"]');
  await page.click('[data-act="filter-track"][data-v="voz"]');
  await page.screenshot({ path: SHOTS + '02-treinar-voz.png', fullPage: true });
  await page.click('[data-act="open-ex"][data-id="sirenes"]');
  await page.waitForTimeout(200);
  await page.screenshot({ path: SHOTS + '03-detalhe.png' });
  await page.click('[data-act="start-ex"]');
  await page.click('[data-act="drill-go"]');
  await page.waitForTimeout(3500);
  await page.screenshot({ path: SHOTS + '04-drill.png' });
  for (let i = 0; i < 4; i++) { await page.click('[data-act="drill-skip"]'); await page.waitForTimeout(2200); }
  await page.waitForTimeout(300);
  log('DRILL RESULT', await page.locator('#sheet-body').innerText().then(t => t.slice(0, 300).replace(/\n/g, ' | ')));
  await page.screenshot({ path: SHOTS + '05-drill-result.png' });
  await page.click('[data-act="rate"][data-v="4"]');
  await page.click('[data-act="drill-save"]');
  await page.waitForTimeout(300);

  // Quiz
  await page.click('[data-act="filter-track"][data-v="social"]');
  await page.click('[data-act="open-ex"][data-id="quiz-sinais"]');
  await page.click('[data-act="start-ex"]');
  for (let i = 0; i < 6; i++) { await page.click('[data-act="quiz-opt"][data-k="1"]'); if (i === 0) await page.screenshot({ path: SHOTS + '06-quiz.png' }); await page.click('[data-act="quiz-next"]'); }
  log('QUIZ', await page.locator('#sheet-body .result-big').innerText().then(t => t.replace(/\n/g, ' ')));
  await page.click('#sheet-body [data-act="sheet-close"]');

  // Writing
  await page.click('[data-act="open-ex"][data-id="retomar"]');
  await page.click('[data-act="start-ex"]');
  await page.fill('#w-text', 'Então, já recuperaste do concerto? Ainda me deves a história do comboio, se calhar ao vivo, sábado no bar de vinhos?');
  await page.click('[data-act="write-analyze"]');
  await page.waitForTimeout(400);
  log('WRITE', await page.locator('#w-out').innerText().then(t => t.replace(/\n/g, ' | ')), '| msg:', await page.locator('#w-msg').innerText());
  await page.screenshot({ path: SHOTS + '07-escrita.png' });
  await page.click('#sheet-close');

  // Studio: start a spoken challenge and record
  await page.click('[data-act="filter-track"][data-v="historia"]');
  await page.click('[data-act="open-ex"][data-id="cinco-sentidos"]');
  await page.click('[data-act="start-ex"]');
  await page.waitForTimeout(300);
  await page.screenshot({ path: SHOTS + '08-estudio.png', fullPage: true });
  await page.click('#btn-rec');
  await page.waitForTimeout(6000);
  await page.locator('#rec').screenshot({ path: SHOTS + '09-gravar.png' });
  await page.waitForTimeout(4000);
  await page.click('#btn-rec');
  await page.waitForSelector('.res-hero', { timeout: 20000 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: SHOTS + '10-resultado.png', fullPage: true });
  for (const sub of ['voz', 'conteudo', 'coach']) { await page.click(`[data-act="sub"][data-sub="${sub}"]`); await page.waitForTimeout(150); await page.screenshot({ path: SHOTS + `11-res-${sub}.png`, fullPage: true }); }
  // add transcript in content tab
  await page.click('[data-act="sub"][data-sub="conteudo"]');
  await page.fill('#retr-studio', 'Entrei na pedreira de Carrara ao amanhecer. Vi o pó branco nos sapatos, ouvi o eco das serras e senti o frio na pele. Mas de repente o encarregado disse: hoje não se corta. Afinal o bloco tinha uma fissura. Tipo, foi um choque.');
  await page.click('[data-act="retr"]');
  await page.waitForTimeout(300);
  await page.screenshot({ path: SHOTS + '12-conteudo-texto.png', fullPage: true });
  await page.click('[data-act="sub"][data-sub="coach"]');
  await page.click('[data-act="copy-coach"]');
  await page.waitForTimeout(300);
  log('COACH MSG', await page.locator('#studio-coach-msg').innerText());
  const clip = await page.evaluate(() => navigator.clipboard.readText().catch(() => 'n/a'));
  log('CLIP head', clip.slice(0, 160).replace(/\n/g, ' | '));
  // chart hover
  const plot = page.locator('[data-act="sub"][data-sub="resumo"]');
  await plot.click();
  const box = await page.locator('.chart .plot').first().boundingBox();
  await page.mouse.move(box.x + box.width * 0.4, box.y + box.height / 2);
  log('TIP', await page.locator('.chart .ctip').first().innerText().then(t => t.replace(/\n/g, ' ')));

  // Progresso
  await page.click('.tab[data-tab="progresso"]');
  await page.waitForTimeout(300);
  await page.screenshot({ path: SHOTS + '13-progresso.png', fullPage: true });
  // Ferramentas
  await page.click('.tab[data-tab="ferramentas"]');
  await page.screenshot({ path: SHOTS + '14-ferr-voz.png', fullPage: true });
  await page.click('[data-act="tool"][data-tool="tuner"]');
  await page.click('[data-act="tool-toggle"]');
  let tn='';
  for(let k=0;k<12;k++){ await page.waitForTimeout(300); tn=await page.locator('#tn-hz').innerText(); if(!tn.startsWith('—')) break; }
  log('TUNER', await page.locator('#tn-note').innerText(), await page.locator('#tn-hz').innerText(), await page.locator('#tn-rel').innerText());
  await page.screenshot({ path: SHOTS + '15-afinador.png' });
  await page.click('#sheet-close');
  await page.click('[data-act="tool"][data-tool="meter"]');
  await page.click('[data-act="tool-toggle"]');
  await page.waitForTimeout(1500);
  log('METER', await page.locator('#mt-val').innerText(), await page.locator('#mt-zone').innerText());
  await page.click('#sheet-close');
  await page.click('[data-act="tool"][data-tool="metro"]');
  await page.click('[data-act="tool-toggle"]');
  await page.waitForTimeout(800);
  await page.click('[data-act="metro-ppm"][data-v="150"]');
  await page.waitForTimeout(500);
  await page.click('#sheet-close');
  await page.click('[data-act="tool-seg"][data-v="historia"]');
  await page.click('[data-act="gen-roll"][data-k="lugar"]');
  await page.screenshot({ path: SHOTS + '16-ferr-historias.png', fullPage: true });
  await page.click('[data-act="story-new"]');
  await page.fill('#st-title', 'O camião preso na serra');
  await page.fill('#st-hook', 'Eram três da manhã e o camião não andava.');
  await page.click('[data-act="story-tag"][data-v="Jantar"]');
  await page.click('[data-act="story-save"]');
  await page.waitForTimeout(300);
  log('STORIES', await page.locator('.story-card').count());
  await page.click('[data-act="tool-seg"][data-v="social"]');
  await page.screenshot({ path: SHOTS + '17-ferr-social.png', fullPage: true });
  await page.click('[data-act="tool"][data-tool="conv"]');
  await page.fill('#conv-text', 'Eu: Então, sobreviveste ao concerto?\nEla: Por pouco! O comboio atrasou duas horas\nEu: Isso é dedicação. Valeu a pena?\nEla: Valeu muito, foi incrível');
  await page.click('[data-act="conv-analyze"]');
  await page.waitForTimeout(300);
  log('CONV', await page.locator('#conv-out').innerText().then(t => t.slice(0, 200).replace(/\n/g, ' | ')), '|', await page.locator('#conv-msg').innerText());
  await page.click('#sheet-close');
  // Settings + export
  await page.click('.tab[data-tab="hoje"]');
  await page.click('.page-head [data-act="settings"]');
  await page.click('[data-act="set-goal"][data-d="1"]');
  await page.click('details.disc summary');
  await page.click('[data-act="export"]');
  await page.waitForTimeout(200);
  const exp = await page.evaluate(() => navigator.clipboard.readText().catch(() => ''));
  log('EXPORT bytes', exp.length, 'sessions', (() => { try { return JSON.parse(exp).sessions.length; } catch (e) { return 'parse-fail'; } })());
  await page.click('#sheet-close');
  await page.waitForTimeout(200);
  await page.screenshot({ path: SHOTS + '18-hoje-depois.png', fullPage: true });
  // dark mode pass of key screens
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.reload(); await page.waitForTimeout(500);
  await page.screenshot({ path: SHOTS + '19-hoje-dark.png', fullPage: true });
  await page.click('.tab[data-tab="progresso"]'); await page.waitForTimeout(200);
  await page.screenshot({ path: SHOTS + '20-progresso-dark.png', fullPage: true });
  await page.click('.tab[data-tab="hoje"]');
  await page.click('[data-act="open-session"]');
  await page.waitForTimeout(200);
  await page.screenshot({ path: SHOTS + '21-sessao-dark.png' });
  // desktop
  await page.emulateMedia({ colorScheme: 'light' });
  await page.setViewportSize({ width: 1280, height: 860 });
  await page.keyboard.press('Escape');
  await page.click('.rail-tab[data-tab="treinar"]'); await page.waitForTimeout(200);
  await page.screenshot({ path: SHOTS + '22-desktop-treinar.png' });
  await page.click('.rail-tab[data-tab="progresso"]'); await page.waitForTimeout(200);
  await page.screenshot({ path: SHOTS + '23-desktop-progresso.png' });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  log('H-OVERFLOW desktop', overflow);
  await page.setViewportSize({ width: 390, height: 844 });
  for (const t of ['hoje', 'treinar', 'estudio', 'progresso', 'ferramentas']) { await page.click(`.tab[data-tab="${t}"]`); await page.waitForTimeout(120); const o = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth); if (o > 0) log('H-OVERFLOW phone', t, o); }
  log('ERRORS', JSON.stringify(errors, null, 1));
  await browser.close();
})().catch(e => { console.error('FAIL', e); process.exit(1); });
