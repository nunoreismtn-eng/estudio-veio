const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const SHOTS = '/home/claude/veio/test/shots/';
const WAV = '/home/claude/veio/test/fixtures/voice.wav';
const log = (...a) => console.log(...a);
const MOCK = `
(() => {
  Object.defineProperty(document, 'featurePolicy', { value: { allowsFeature: () => false } });
  const store = new Map(); const subs = [];
  const snap = (prefix) => { const docs=[...store.entries()].filter(([k])=>k.startsWith(prefix+'/') && k.slice(prefix.length+1).indexOf('/')<0).map(([k,v])=>({ id:k.slice(prefix.length+1), data:()=>JSON.parse(JSON.stringify(v)), exists:true })); docs.sort((a,b)=>(b.data().at||0)-(a.data().at||0)); return { docs, size:docs.length, empty:!docs.length }; };
  const notify = () => subs.forEach(s=>s.next(snap(s.path)));
  const coll = (path) => ({ path,
    orderBy(){ return this; }, limit(){ return this; }, where(){ return this; },
    onSnapshot(next){ const s={path,next}; subs.push(s); setTimeout(()=>next(snap(path)),0); return ()=>{}; },
    async get(){ return snap(path); },
    doc(id){ const p=path+'/'+id; return { id, path:p,
      async set(d){ JSON.stringify(d); store.set(p, d); window.__writes=(window.__writes||0)+1; setTimeout(notify,0); },
      async update(d){ if(!store.has(p)) throw {code:'invalid_argument'}; store.set(p, Object.assign({}, store.get(p), d)); setTimeout(notify,0); },
      async delete(){ store.delete(p); setTimeout(notify,0); },
      async get(){ return { id, exists:store.has(p), data:()=>store.get(p) }; } }; } });
  // a legacy v1 session at the old path
  store.set('data/users/u1/s1700000000000', { at: Date.now()-2*86400000, challengeId:'pitch-genebra', challengeTitle:'O arquiteto de Genebra', lang:'pt', level:1, index:66, metrics:{ pitchSD:2.1, wpm:171, pausesPerMin:7, downPct:40, dynamicDb:7, hesPerMin:2.4, durationS:31 }, transcript:'Pronto, nós fazemos pedra natural, tipo, para projetos de luxo.' });
  const db = { collection: coll, doc:(p)=>coll(p.split('/').slice(0,-1).join('/')).doc(p.split('/').pop()) };
  const coach = { nota_global: 7.4, notas: { gancho:7, estrutura:8, detalhe:9, emocao:6, tensao:7, timing:6, fecho:5 }, diagnostico:'Soas seguro e concreto; o fecho perde força.', forte:['Detalhes sensoriais vivos','Ritmo calmo'], melhorar:[{o_que:'Fecho a subir', como:'Desce o tom na última frase.'},{o_que:'Bengala no fim', como:'Corta o “tipo”.'}], reformulacao:'Entrei na pedreira ao amanhecer…', exercicio:'Conta só o final três vezes, a descer.' };
  const sample = async (input) => ({ text:'ok', truncated:false });
  sample.json = async (input) => {
    window.__prompts = (window.__prompts||[]).concat([input.slice(0,120)]);
    await new Promise(r=>setTimeout(r,120));
    if (input.includes('"leitura"')) return { leitura:'Ela está a investir e a responder com energia.', investimento:{ tu:6, outra_pessoa:7 }, sinais_positivos:['Respostas longas'], sinais_atencao:['Poucas perguntas dela'], bem:['Humor leve'], corrigir:[{o_que:'Perguntas seguidas', como:'Troca uma por uma afirmação.'}], proxima_mensagem:'Quinta, bar de vinhos, contas-me o resto?', porque:'Plano concreto no pico de energia.' };
    if (input.includes('"ganchos"')) return { diagnostico:'Boa história, começa tarde.', ganchos:['Eram três da manhã…','“Daqui não passamos.”','Já viste um camião a chorar?'], estrutura:['Gancho','Contexto','Conflito','Viragem','Fecho'], detalhes:['O frio na cabine'], reviravolta:'O dono da obra apareceu com café.', fecho:'Desde então, levo sempre dois cafés.', versao_60s:'Eram três da manhã…' };
    if (input.includes('"versao_melhorada"')) return { nota_global:6.8, diagnostico:'Leve e com referência, mas longa.', forte:['Referência partilhada'], melhorar:[{o_que:'Duas perguntas', como:'Fica só com uma.'}], versao_melhorada:'Ainda me deves a história do comboio. Quinta?', alternativas:['Sobreviveste ao concerto?','Tenho uma teoria sobre o teu comboio.'], porque_funciona:'Curta, curiosa e com plano.' };
    if (input.includes('"skill"')) return { skill:'Abertura', title:'O vizinho de mesa', brief:'Num restaurante em Lisboa, a pessoa da mesa ao lado pede o mesmo prato que tu. Abre a conversa.', seconds:20, focus:'finais', tip:'Uma observação com humor.', why:'O contexto partilhado facilita.' };
    return coach;
  };
  sample.limits = async () => ({ maxPromptBytes: 262144 });
  window.claude = { use: async (name) => name==='sample' ? sample : name==='db' ? db : name==='user' ? { id: async()=>'u1', isOwner:()=>true } : null };
})();`;
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write']);
  await ctx.addInitScript(MOCK);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message + ' ' + (e.stack || '').split('\n').slice(0, 3).join(' | ')));
  page.on('console', m => { if (m.type() === 'error' && !/ERR_TUNNEL|net::/.test(m.text())) errors.push('console: ' + m.text()); });
  await page.goto('file:///home/claude/veio/dist/estudio-veio-microfone.html');
  await page.waitForTimeout(700);
  log('MODE note:', await page.locator('.note').first().innerText().catch(() => 'none'));
  log('Last session (legacy):', await page.locator('.card:has-text("Última sessão")').innerText().then(t => t.replace(/\n/g, ' | ')));
  // studio upload flow
  await page.click('.tab[data-tab="treinar"]');
  await page.click('[data-act="filter-track"][data-v="historia"]');
  await page.click('[data-act="open-ex"][data-id="cinco-sentidos"]');
  await page.click('[data-act="start-ex"]');
  log('REC card present?', await page.locator('#rec').count(), 'upload?', await page.locator('#f-pick').count());
  await page.setInputFiles('#f-pick', WAV);
  await page.fill('#transcript', 'Entrei na pedreira ao amanhecer. Vi o pó branco, ouvi o eco e senti o frio. Mas de repente ele disse: hoje não. Afinal havia uma fissura.');
  await page.click('#btn-analyze');
  await page.waitForSelector('.res-hero', { timeout: 20000 });
  await page.click('[data-act="sub"][data-sub="coach"]');
  await page.click('[data-act="coach"]');
  await page.waitForSelector('#studio-panel .fb', { timeout: 5000 });
  log('COACH', await page.locator('#studio-panel .fb .diag').innerText(), '| scores:', await page.locator('#studio-panel .score').count());
  await page.screenshot({ path: SHOTS + 'v1-coach.png', fullPage: true });
  log('writes after coach', await page.evaluate(() => window.__writes));
  // generate challenge in Treinar
  await page.click('.tab[data-tab="treinar"]');
  await page.click('[data-act="filter-track"][data-v="social"]');
  await page.click('[data-act="gen-challenge"]');
  await page.waitForTimeout(600);
  log('GEN sheet title', await page.locator('#sheet-title').innerText(), '|', await page.locator('.detail-title').innerText().catch(() => 'none'));
  await page.click('#sheet-close');
  log('custom in list', await page.locator('.ex-row:has-text("O vizinho de mesa")').count());
  // writing with Claude
  await page.click('[data-act="open-ex"][data-id="chat-encontro"]');
  await page.click('[data-act="start-ex"]');
  await page.fill('#w-text', 'Já que defendes tanto aquele bar de vinhos, prova-mo. Quinta às oito?');
  await page.click('[data-act="write-analyze"]');
  await page.waitForSelector('#w-out .fb', { timeout: 5000 });
  log('WRITE fb', await page.locator('#w-out .fb .diag').innerText());
  await page.screenshot({ path: SHOTS + 'v2-escrita.png' });
  await page.click('#sheet-close');
  // tools: conversation + story doctor
  await page.click('.tab[data-tab="ferramentas"]');
  await page.click('[data-act="tool-seg"][data-v="social"]');
  await page.click('[data-act="tool"][data-tool="conv"]');
  await page.fill('#conv-text', 'Eu: Sobreviveste ao concerto?\nEla: Por pouco! O comboio atrasou duas horas mas valeu muito a pena\nEu: Dedicação a sério');
  await page.click('[data-act="conv-analyze"]');
  await page.waitForSelector('#conv-out .fb', { timeout: 5000 });
  log('CONV fb', await page.locator('#conv-out .fb .diag').innerText());
  await page.screenshot({ path: SHOTS + 'v3-conversa.png', fullPage: true });
  await page.click('#sheet-close');
  await page.click('[data-act="tool-seg"][data-v="voz"]');
  await page.click('[data-act="tool"][data-tool="tuner"]');
  log('TUNER (no mic)', await page.locator('#sheet-body .note').innerText());
  await page.click('#sheet-close');
  await page.click('[data-act="tool-seg"][data-v="historia"]');
  await page.click('[data-act="story-new"]');
  await page.fill('#st-title', 'O camião preso na serra');
  await page.fill('#st-context', 'Entrega de uma bancada em Andorra, neve na estrada.');
  await page.click('[data-act="story-doctor"]');
  await page.waitForSelector('#story-out .fb', { timeout: 5000 });
  log('STORY fb', await page.locator('#story-out .fb .diag').innerText());
  await page.click('[data-act="story-save"]');
  await page.waitForTimeout(300);
  log('STORIES in db list', await page.locator('.story-card').count());
  // drill without mic
  await page.click('[data-act="tool-seg"][data-v="voz"]');
  await page.click('[data-act="tool"][data-tool="warmup"]');
  await page.click('[data-act="start-ex"]');
  log('DRILL note', await page.locator('#sheet-body .note').innerText());
  await page.click('[data-act="drill-go"]');
  await page.waitForTimeout(400);
  await page.click('[data-act="drill-stop"]');
  await page.click('[data-act="rate"][data-v="5"]');
  await page.click('[data-act="drill-save"]');
  await page.waitForTimeout(300);
  // progress
  await page.click('.tab[data-tab="progresso"]');
  await page.waitForTimeout(300);
  log('PROG eyebrow', await page.locator('.page-head .eyebrow').innerText(), '| hist rows', await page.locator('.hrow').count());
  await page.screenshot({ path: SHOTS + 'v4-progresso.png', fullPage: true });
  // open session from history and switch subtabs in sheet
  await page.click('.hrow:has-text("Os cinco sentidos")');
  await page.click('#sheet-body [data-act="sub"][data-sub="conteudo"]');
  log('SHEET content marks', await page.locator('#sheet-body mark').count());
  await page.click('#sheet-body [data-act="sub"][data-sub="coach"]');
  log('SHEET coach has fb', await page.locator('#sheet-body .fb').count());
  await page.click('#sheet-close');
  // settings export/import roundtrip
  await page.click('.page-head [data-act="settings"]');
  await page.click('details.disc summary');
  await page.click('[data-act="export"]');
  const exp = await page.evaluate(() => navigator.clipboard.readText());
  await page.fill('#import-box', exp);
  await page.click('[data-act="import"]');
  await page.waitForTimeout(300);
  log('IMPORT msg', await page.locator('#imp-msg').innerText());
  log('PROMPTS', JSON.stringify(await page.evaluate(() => window.__prompts)));
  log('ERRORS', JSON.stringify(errors, null, 1));
  await browser.close();
})().catch(e => { console.error('FAIL', e); process.exit(1); });
