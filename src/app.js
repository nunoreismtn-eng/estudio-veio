/* ===================== APP ===================== */
const IN_VIEWER = !!(window.claude && typeof window.claude.use === "function");
const PUBLIC = typeof BUILD!=="undefined" && !!BUILD.public;
const DEFAULTS = (typeof BUILD!=="undefined" && BUILD.defaults) || {};   // name/company for the private builds (private.json, never in the public site)
const IS_MOBILE = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.platform==="MacIntel" && navigator.maxTouchPoints>1);
const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition || null;
function micPolicyAllows(){
  try{ const p=document.permissionsPolicy||document.featurePolicy; if(p && typeof p.allowsFeature==="function") return !!p.allowsFeature("microphone"); }catch(e){}
  return !IN_VIEWER;
}
const MIC_OK = !!(navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia==="function") && micPolicyAllows();
const MIC_URL = (typeof BUILD!=="undefined" && BUILD.micUrl) || "";
function micLink(){ return IN_VIEWER && MIC_URL ? ` <a class="linkbtn" href="${MIC_URL}" target="_blank" rel="noopener">Abrir a versão com microfone ↗</a>` : ""; }
const SR_LANG = { pt:"pt-PT", fr:"fr-FR", en:"en-GB" };
const LANGS = { pt:"português", fr:"francês", en:"inglês" };
const TABS = ["hoje","treinar","estudio","progresso","ferramentas"];
const TAB_META = { hoje:["Hoje","home"], treinar:["Treinar","target"], estudio:["Estúdio","mic"], progresso:["Progresso","chart"], ferramentas:["Ferramentas","tools"] };
const TRACK_ICON = { voz:"wave", historia:"book", social:"chat", negocio:"case" };
const KIND_ICON = { fala:"mic", drill:"dumbbell", quiz:"quiz", escrita:"pen" };
const $ = (s,r=document)=>r.querySelector(s);
const h = escHtml;
const fmt = fmtN;

const ICONS = {
  home:'<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2"/>',
  mic:'<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7"/>',
  chart:'<path d="M3 21h18M6 17v-6M11 17V6M16 17v-9M21 17v-4"/>',
  tools:'<path d="M14.7 6.3a4 4 0 0 0-5.3 5.3L3.5 17.5a2 2 0 0 0 3 3l5.9-5.9a4 4 0 0 0 5.3-5.3l-2.6 2.6-2.4-.6-.6-2.4z"/>',
  sliders:'<path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>',
  flame:'<path d="M12 3c.8 3.2 5 5.4 5 10a5 5 0 0 1-10 0c0-2.4 1.3-3.9 2.4-5 .3 1.5 1.1 2.6 2.4 3C10.8 8 12 5.5 12 3z"/>',
  check:'<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  x:'<path d="M6 6l12 12M18 6 6 18"/>',
  star:'<path d="m12 3.6 2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z"/>',
  chevR:'<path d="m9.5 6 6 6-6 6"/>',
  play:'<path d="M8 5.5v13l10.5-6.5z"/>',
  pause:'<path d="M8.5 5v14M15.5 5v14"/>',
  skip:'<path d="M6 5.5v13l9-6.5zM18 5v14"/>',
  copy:'<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
  upload:'<path d="M12 15V4M7.5 8.5 12 4l4.5 4.5M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4"/>',
  download:'<path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4"/>',
  shuffle:'<path d="M16 4h4v4M4 20 20 4M20 16v4h-4M15 15l5 5M4 4l5 5"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  trash:'<path d="M4 7h16M9 7V4h6v3M6.5 7l1 13h9l1-13"/>',
  sparkle:'<path d="M12 3c.6 4.4 2.6 6.4 7 7-4.4.6-6.4 2.6-7 7-.6-4.4-2.6-6.4-7-7 4.4-.6 6.4-2.6 7-7z"/>',
  book:'<path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5zM5 19.5A1.5 1.5 0 0 0 6.5 21H19v-3"/>',
  wave:'<path d="M3 12h1.5M7 8.5v7M10.5 5v14M14 8v8M17.5 6.5v11M21 12h-.5"/>',
  chat:'<path d="M4 5.5h16v10.5H10l-6 4z"/>',
  case:'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M3 12.5h18"/>',
  dumbbell:'<path d="M6.5 7v10M3.5 9.5v5M17.5 7v10M20.5 9.5v5M6.5 12h11"/>',
  quiz:'<circle cx="12" cy="12" r="9"/><path d="M9.6 9.5a2.5 2.5 0 1 1 3.4 2.3c-.7.3-1 .9-1 1.7M12 17h.01"/>',
  pen:'<path d="M4 20l4.5-1L19 8.5 15.5 5 5 15.5zM13.5 7l3.5 3.5"/>',
  info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  tuner:'<path d="M3.5 16a8.5 8.5 0 1 1 17 0"/><path d="M12 16l4.5-5"/><circle cx="12" cy="16" r="1.3"/>',
  meter:'<path d="M4 19h3v-6H4zM10.5 19h3V9h-3zM17 19h3V5h-3z"/>',
  metro:'<path d="M9 3h6l3.5 18h-13zM12 15l5-7"/>',
  bulb:'<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/>',
  eye:'<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
  download:'<path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4"/>',
  search:'<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>'
};
function ic(n, cls){ return `<svg class="ic ${cls||""}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n]||""}</svg>`; }
const BRAND_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 15.5c3.2-.6 4.2-6 8.3-6 3.3 0 3.4 3.4 8.7 2.2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M6.5 20.5c1.8-2.2 4.6-3.2 6.4-6.2M13.5 9.6c.6-2.2 2.2-4 4.6-5.1" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity=".6"/></svg>';

/* ---------- Local storage ---------- */
const LS = {
  get(k,d){ try{ const v=localStorage.getItem("veio2:"+k); return v==null?d:JSON.parse(v); }catch(e){ return d; } },
  set(k,v){ try{ localStorage.setItem("veio2:"+k, JSON.stringify(v)); return true; }catch(e){ return false; } },
  del(k){ try{ localStorage.removeItem("veio2:"+k); }catch(e){} }
};

/* ---------- State ---------- */
const S = {
  tab: TABS.includes(LS.get("tab","hoje")) ? LS.get("tab","hoje") : "hoje",
  settings: Object.assign({ goal:5, lang:"pt", level:1, autotr:!IS_MOBILE, name: DEFAULTS.name||"", company: DEFAULTS.company||"" }, LS.get("settings",{})),
  favs: new Set(LS.get("favs",[])),
  sessions: [], stories: [], custom: [],
  filters: { track:"todos", kind:"todos", q:"" },
  prog: { range:"30", track:"todos", more:false },
  toolSeg: "voz",
  gen: null, qOffset: 0,
  studio: { exId: LS.get("studioEx", "pitch-genebra"), dynEx:null, view:"ready", result:null, sub:"resumo", showFile:false, file:null, transcript:"", words3:null },
  sample:null, sampleDenied:false, db:null, uid:null
};
function saveSettings(){ LS.set("settings", S.settings); }
const pzName = ()=> (S.settings.name||"").trim(), pzCompany = ()=> (S.settings.company||"").trim();
function pz(t){ return typeof t!=="string" ? t : t.replace(/\{nome\}/g, pzName()||"[o teu nome]").replace(/\{empresa\}/g, pzCompany()||"[a tua empresa]"); }
function applyPersona(){
  EX.forEach(e=>{
    if(!e._tpl) e._tpl={ brief:e.brief, target:e.target, tip:e.tip, steps:e.steps?e.steps.map(x=>x.t):null };
    e.brief=pz(e._tpl.brief); if(e._tpl.target) e.target=pz(e._tpl.target); e.tip=pz(e._tpl.tip);
    if(e._tpl.steps) e.steps.forEach((x,i)=>{ x.t=pz(e._tpl.steps[i]); });
  });
}
function quem(prep){ const n=pzName(); const map={ "do":[`do ${n}`,"de um profissional"], "pelo":[`pelo ${n}`,"por um profissional"], "para o":[`para o ${n}`,"para um profissional"] }; return n ? map[prep][0] : map[prep][1]; }

/* ---------- Helpers ---------- */
function getEx(id){ if(!id) return null; return EX_BY_ID[id] || S.custom.find(c=>c.id===id) || (S.studio.dynEx && S.studio.dynEx.id===id ? S.studio.dynEx : null); }
function currentEx(){ return S.studio.dynEx || getEx(S.studio.exId); }
function exLang(ex){ return (ex && ex.lang) || S.settings.lang; }
function targetSeconds(ex){ const s=(ex && ex.seconds) || 60; return S.settings.level===3 ? Math.max(15, Math.round(s/2)) : s; }
const fmtMin = v => fmt(v, fin(v)&&v<10?1:0);
function clockText(s){ s=Math.max(0,Math.floor(s||0)); return Math.floor(s/60)+":"+String(s%60).padStart(2,"0"); }
function durLabel(ex){ return ex.kind==="fala" ? `${ex.seconds} s` : `${ex.min} min`; }
function lvDots(n){ return `<span class="lv" aria-label="Nível ${n}">${[1,2,3].map(i=>`<i class="${i<=n?"on":""}"></i>`).join("")}</span>`; }
function ring(frac, big, small, size, stroke, cls){
  size=size||64; stroke=stroke||7; const r=(size-stroke)/2, c=2*Math.PI*r, off=c*(1-clamp(frac||0,0,1));
  return `<span class="ring ${cls||""}" style="width:${size}px;height:${size}px"><svg width="${size}" height="${size}" aria-hidden="true"><circle class="r-track" cx="${size/2}" cy="${size/2}" r="${r}" stroke-width="${stroke}"/><circle class="r-val" cx="${size/2}" cy="${size/2}" r="${r}" stroke-width="${stroke}" stroke-dasharray="${c.toFixed(2)}" stroke-dashoffset="${off.toFixed(2)}"/></svg><span class="r-label"><b>${big}</b>${small?`<small>${small}</small>`:""}</span></span>`;
}
const pill = (v)=> `<span class="pill ${v[1]}">${h(v[0])}</span>`;
function trackTag(t){ return `<span class="tag track t-${t}">${ic(TRACK_ICON[t])}${h(TRACKS[t].name)}</span>`; }
let toastT=null;
function toast(m){ const t=$("#toast"); t.textContent=m; t.hidden=false; clearTimeout(toastT); toastT=setTimeout(()=>{ t.hidden=true; }, 2800); }
function showMsg(sel, text, err){ const el=$(sel); if(!el) return; el.hidden=!text; el.textContent=text||""; el.classList.toggle("err", !!err); }
async function copyText(text, boxSel){
  let ok=false;
  try{ await navigator.clipboard.writeText(text); ok=true; }catch(e){}
  if(!ok && boxSel){ const b=$(boxSel); if(b){ b.hidden=false; b.value=text; b.focus(); b.select(); try{ ok=document.execCommand("copy"); }catch(e){} } }
  return ok;
}
const claudeOn = ()=> IN_VIEWER && !!S.sample && !S.sampleDenied;
function claudeErr(e){
  const c=e && e.code;
  if(c==="not_granted"||c==="sampling_disabled"){ S.sampleDenied=true; return "Sem autorização para usar o Claude nesta página. Podes ativá-la no menu de permissões do artefacto; entretanto, usa o botão de copiar."; }
  return c==="rate_limited" ? "Chegaste ao limite de pedidos por agora. Tenta daqui a uns minutos." : c==="invalid_json" ? "A resposta veio num formato que não consegui ler. Tenta outra vez." : c==="cancelled" ? "" : "A ligação ao Claude falhou. Tenta outra vez.";
}
async function askClaude(prompt, tier){ if(!claudeOn()) throw { code:"not_granted" }; const d = await S.sample.json(prompt, { cache:false, modelTier: tier||"default" }); if(!d || typeof d!=="object") throw { code:"invalid_json" }; return d; }
const plain = o => JSON.parse(JSON.stringify(o, (k,v)=> Array.isArray(v) && v.length && Array.isArray(v[0]) ? v.map(x=>({ t:x[0], n:x[1] })) : v));
const pairs = list => (list||[]).map(x=> Array.isArray(x) ? x : [x.t, x.n]);
function doneMap(){ const m={}; S.sessions.forEach(s=>{ const k=s.challengeId; if(!k) return; m[k]=m[k]||{n:0,best:null}; m[k].n++; const sc = s.kind==="fala"? s.index : s.kind==="quiz"? s.score : null; if(sc!=null) m[k].best=Math.max(m[k].best??-1, sc); }); return m; }
function greeting(){ const hr=new Date().getHours(); return hr<12?"Bom dia":hr<20?"Boa tarde":"Boa noite"; }

/* ---------- Data store (Claude account or this device) ---------- */
const Store = {
  mode:"local", col:null, legacy:[], dbSessions:[],
  loadLocal(){ S.sessions = LS.get("sessions",[]).sort((a,b)=>b.at-a.at); S.stories = LS.get("stories",[]); S.custom = LS.get("custom",[]); },
  async init(){
    if(!IN_VIEWER){ this.loadLocal(); return; }
    claude.use("sample").then(s=>{ if(s){ S.sample=s; schedule(); } }).catch(()=>{});
    try{
      const [db,user] = await Promise.all([claude.use("db"), claude.use("user")]);
      if(!db || !user){ this.loadLocal(); schedule(); return; }
      const id = await user.id(); if(!id){ this.loadLocal(); schedule(); return; }
      S.db=db; S.uid=id; this.mode="db";
      const base="data/users/"+id+"/veio";
      this.col = { sessions: db.collection(base+"/sessions"), stories: db.collection(base+"/stories"), custom: db.collection(base+"/custom") };
      this.col.sessions.orderBy("at","desc").limit(500).onSnapshot(snap=>{ this.dbSessions = snap.docs.map(d=>Object.assign({id:d.id}, d.data())); this.merge(); schedule(); }, ()=>{});
      this.col.stories.onSnapshot(snap=>{ S.stories = snap.docs.map(d=>Object.assign({id:d.id}, d.data())).sort((a,b)=>(b.updated||0)-(a.updated||0)); schedule(); }, ()=>{});
      this.col.custom.onSnapshot(snap=>{ S.custom = snap.docs.map(d=>Object.assign({id:d.id}, d.data())); schedule(); }, ()=>{});
      db.collection("data/users/"+id).get().then(snap=>{
        this.legacy = snap.docs.filter(d=>/^s\d+$/.test(d.id)).map(d=>legacySession(d.id, d.data()));
        this.merge(); schedule();
      }).catch(()=>{});
    }catch(e){ this.loadLocal(); schedule(); }
  },
  merge(){ const ids=new Set(this.dbSessions.map(s=>s.id)); S.sessions = this.dbSessions.concat(this.legacy.filter(s=>!ids.has(s.id))).sort((a,b)=>b.at-a.at); },
  async addSession(s){
    const body=plain(s);
    if(this.mode==="db"){ try{ await this.col.sessions.doc(body.id).set(body); return true; }catch(e){ toast("Não consegui guardar na conta. Ficou neste dispositivo."); } }
    const list=LS.get("sessions",[]).filter(x=>x.id!==body.id); list.unshift(body); list.sort((a,b)=>b.at-a.at);
    list.forEach((x,i)=>{ if(i>=40 && x.series) delete x.series; });
    if(!LS.set("sessions", list.slice(0,250))){ list.forEach((x,i)=>{ if(i>=10) delete x.series; }); LS.set("sessions", list.slice(0,250)); }
    if(this.mode!=="db") S.sessions=list;
    return true;
  },
  async updateSession(id, patch){
    const p=plain(patch);
    if(this.mode==="db" && this.dbSessions.some(s=>s.id===id)){ try{ await this.col.sessions.doc(id).update(p); return; }catch(e){} }
    const list=LS.get("sessions",[]); const it=list.find(x=>x.id===id); if(it){ Object.assign(it,p); LS.set("sessions",list); if(this.mode!=="db") S.sessions=list.sort((a,b)=>b.at-a.at); }
  },
  async saveStory(st){
    const body=plain(st);
    if(this.mode==="db"){ try{ await this.col.stories.doc(body.id).set(body); return; }catch(e){ toast("Não consegui guardar na conta. Ficou neste dispositivo."); } }
    const list=LS.get("stories",[]).filter(x=>x.id!==body.id); list.unshift(body); LS.set("stories",list); S.stories=list;
  },
  async deleteStory(id){
    if(this.mode==="db"){ try{ await this.col.stories.doc(id).delete(); return; }catch(e){} }
    const list=LS.get("stories",[]).filter(x=>x.id!==id); LS.set("stories",list); S.stories=list;
  },
  async saveCustom(ex){
    const body=plain(ex);
    if(this.mode==="db"){ try{ await this.col.custom.doc(body.id).set(body); return; }catch(e){} }
    const list=LS.get("custom",[]).filter(x=>x.id!==body.id); list.unshift(body); LS.set("custom",list); S.custom=list;
  }
};
function legacySession(id, d){
  const ex=EX_BY_ID[d.challengeId];
  const s={ id, at:d.at||Number(id.slice(1)), kind:"fala", track: ex?ex.track:"negocio", challengeId:d.challengeId||"livre", title:d.challengeTitle||"Sessão", skill: ex?ex.skill:"", level:d.level||1, lang:d.lang||"pt", metrics:d.metrics||{}, index:d.index, transcript:d.transcript||"", claude:d.claude||null, legacy:true };
  s.words = analyzeWords(s.transcript, s.lang, s.metrics.durationS);
  s.xp = xpOf(s);
  return s;
}

/* ---------- Render loop ---------- */
let pending=false, raf0=0;
function schedule(){ if(raf0) return; raf0=requestAnimationFrame(()=>{ raf0=0; render(); }); }
function render(){
  if(Rec.active || Rec.busy){ pending=true; return; }
  pending=false;
  renderNav();
  const v=$("#view");
  const fn={ hoje:viewHoje, treinar:viewTreinar, estudio:viewEstudio, progresso:viewProgresso, ferramentas:viewFerramentas }[S.tab];
  v.innerHTML = fn();
  afterRender();
}
function afterRender(){
  if(S.tab==="estudio" && MIC_OK && $("#live")) drawLive($("#live"));
}
function goTab(t){
  if(!TABS.includes(t)) return;
  if(Rec.active){ toast("Para a gravação antes de mudar de aba."); return; }
  S.tab=t; LS.set("tab",t); window.scrollTo(0,0); render(); Nav.later();
}
function renderNav(){
  const railTabs=$("#rail-tabs"), bar=$("#tabbar");
  if(railTabs) railTabs.innerHTML = TABS.map(t=>`<button class="rail-tab" role="tab" aria-selected="${S.tab===t}" data-act="tab" data-tab="${t}">${ic(TAB_META[t][1])}${TAB_META[t][0]}</button>`).join("");
  if(bar) bar.innerHTML = TABS.map(t=> t==="estudio"
    ? `<button class="tab tab-main" role="tab" aria-selected="${S.tab===t}" data-act="tab" data-tab="${t}"><span class="bubble">${ic("mic")}</span>${TAB_META[t][0]}</button>`
    : `<button class="tab" role="tab" aria-selected="${S.tab===t}" data-act="tab" data-tab="${t}">${ic(TAB_META[t][1])}${TAB_META[t][0]}</button>`).join("");
}

/* ===================== HOJE ===================== */
function dailyPlan(){
  const now=Date.now(), key=dayKey(now);
  const saved=LS.get("plan",null);
  if(saved && saved.day===key && saved.ids.every(id=>EX_BY_ID[id])) return saved.ids;
  const rnd=seeded(hashStr(key));
  const recent=new Set(S.sessions.filter(s=>s.at>now-3*DAY).map(s=>s.challengeId));
  const warmIds=["aquecimento","respiracao","ressonancia","sirenes","tom-otimo","escada-projecao"];
  const warm=warmIds[Math.floor(rnd()*warmIds.length)];
  const focus=weakestFocus() || ["finais","pausas","tom","ritmo"][Math.floor(rnd()*4)];
  let pool=EX.filter(e=>e.kind==="fala" && e.focus===focus && !recent.has(e.id) && !e.dyn && !e.lang);
  if(!pool.length) pool=EX.filter(e=>e.kind==="fala" && e.focus===focus && !e.lang);
  const second=pool[Math.floor(rnd()*pool.length)].id;
  const rot=["historia","negocio","social","historia","negocio","social","social"][new Date(now).getDay()];
  let pool3=EX.filter(e=>e.track===rot && e.id!==second && !recent.has(e.id));
  if(!pool3.length) pool3=EX.filter(e=>e.track===rot && e.id!==second);
  const ids=[warm, second, pool3[Math.floor(rnd()*pool3.length)].id];
  LS.set("plan",{ day:key, ids });
  return ids;
}
function weakestFocus(){
  const f=S.sessions.filter(s=>s.kind==="fala" && s.metrics).slice(0,6); if(f.length<2) return null;
  let worst=null, wv=101;
  METRIC_KEYS.forEach(k=>{ const sc=f.map(s=>subScore(k, metricValues(s.metrics, s.lang)[k])).filter(v=>v!=null); if(!sc.length) return; const m=mean(sc); if(m<wv){ wv=m; worst=k; } });
  return wv<95 ? worst : null;
}
function viewHoje(){
  const now=Date.now(), st=streakInfo(S.sessions, now), plan=dailyPlan();
  const today=new Set(S.sessions.filter(s=>dayKey(s.at)===dayKey(now)).map(s=>s.challengeId));
  const nDone=plan.filter(id=>today.has(id)).length, mins=plan.reduce((a,id)=>a+(EX_BY_ID[id].min||2),0);
  const wk=S.sessions.filter(s=>s.at>=weekStart(now)), wkMin=wk.reduce((a,s)=>a+speakingMin(s),0);
  const xp=trackXP(S.sessions), last=S.sessions[0], tip=TIPS[hashStr(dayKey(now))%TIPS.length];
  const date=new Date(now).toLocaleDateString("pt-PT",{weekday:"long", day:"numeric", month:"long"});
  const planRows=plan.map((id,i)=>{ const ex=EX_BY_ID[id], done=today.has(id);
    return `<li><button class="plan-row t-${ex.track} ${done?"done":""}" data-act="open-ex" data-id="${id}">
      <span class="plan-n">${done?ic("check"):i+1}</span><span class="ex-ic">${ic(KIND_ICON[ex.kind])}</span>
      <span class="ex-txt"><span class="ex-title">${h(ex.title)}</span><span class="ex-meta">${["Aquecimento","Desafio do dia","Área do dia"][i]} · ${h(TRACKS[ex.track].short)} · ${durLabel(ex)}</span></span>
      ${ic("chevR","chev")}</button></li>`; }).join("");
  const lastCard = last ? `<button class="plan-row t-${last.track}" data-act="open-session" data-id="${h(last.id)}" style="grid-template-columns:auto minmax(0,1fr) auto">
      <span class="ex-ic">${ic(KIND_ICON[last.kind]||"mic")}</span>
      <span class="ex-txt"><span class="ex-title">${h(last.title)}</span><span class="ex-meta">${h(new Date(last.at).toLocaleDateString("pt-PT",{day:"numeric",month:"short"}))} · ${h(sessionScoreLabel(last))}</span></span>${ic("chevR","chev")}</button>`
    : `<p class="sub">Ainda não treinaste. O aquecimento de cinco minutos é o melhor primeiro passo.</p><button class="btn sm" data-act="open-ex" data-id="aquecimento">Abrir o aquecimento</button>`;
  return `
  <header class="page-head">
    <div><p class="eyebrow">${h(date)}</p><h1>${greeting()}${pzName()?", "+h(pzName()):""}</h1></div>
    <div class="head-actions"><span class="streak" data-tip="Melhor sequência: ${st.best} dias">${ic("flame")}<b>${st.current}</b><span>${st.current===1?"dia":"dias"}</span></span><button class="icon-btn" data-act="settings" aria-label="Definições">${ic("sliders")}</button></div>
  </header>
  ${installCard()}
  <section class="card">
    <div class="card-head"><div><h2>Plano de hoje</h2><p class="sub">${nDone===3?"Feito. Amanhã há um plano novo.":`Três passos, cerca de ${mins} minutos.`}</p></div>${ring(nDone/3, `${nDone}/3`, "feito", 62, 7)}</div>
    <ol class="plan-list">${planRows}</ol>
    <button class="btn primary block" data-act="plan-start">${nDone===0?"Começar o plano":nDone<3?"Continuar o plano":"Treinar mais"}</button>
  </section>
  <section class="grid-2">
    <div class="card">
      <div class="card-head"><div><h2>Esta semana</h2><p class="sub">${wk.length} de ${S.settings.goal} sessões · ${fmtMin(wkMin)} min a falar</p></div>${ring(wk.length/S.settings.goal, wk.length, `de ${S.settings.goal}`, 62, 7)}</div>
      <p class="sub">${wk.length>=S.settings.goal?"Objetivo cumprido. O que vier agora é margem.":`Faltam ${S.settings.goal-wk.length} para o objetivo semanal.`}</p>
    </div>
    <div class="card"><h2>Última sessão</h2>${lastCard}</div>
  </section>
  <section class="card">
    <div class="card-head"><h2>As tuas áreas</h2><button class="linkbtn" data-act="goto" data-tab="progresso">Ver progresso</button></div>
    <div class="areas">${TRACK_ORDER.map(t=>{ const lv=levelOf(xp[t]); return `<button class="area-row t-${t}" data-act="lib-track" data-v="${t}">
      <span class="ex-ic">${ic(TRACK_ICON[t])}</span>
      <span><span class="a-name">${h(TRACKS[t].name)}</span><span class="a-meta"> · ${h(lv.name)}</span><span class="xpbar"><i style="width:${(lv.pct*100).toFixed(0)}%"></i></span></span>
      <span class="a-meta">${lv.next?`${lv.toNext} XP para ${h(lv.next)}`:"Nível máximo"}</span></button>`; }).join("")}</div>
  </section>
  <section class="tipcard t-${tip.area}"><span class="t-ic">${ic("bulb")}</span><div><p class="eyebrow" style="margin:0 0 4px">Dica do dia · ${h(TRACKS[tip.area].short)}</p><h3>${h(tip.t)}</h3><p>${h(tip.d)}</p></div></section>
  ${!pzName()?`<section class="tipcard t-voz"><span class="t-ic">${ic("sliders")}</span><div><h3>Personaliza o estúdio</h3><p>O teu nome e a tua empresa entram nos exercícios e nos pedidos ao coach. Ficam guardados só neste aparelho.</p><button class="btn sm" data-act="settings" style="margin-top:10px">Abrir definições</button></div></section>`:""}
  ${modeNote()}`;
}
function modeNote(){
  if(IN_VIEWER) return `<p class="note">${ic("info")} Dentro do Claude não há microfone ao vivo: grava no telemóvel e carrega o ficheiro no Estúdio, ou abre a versão com microfone no browser. Aqui tens a leitura do Claude e o histórico na tua conta.${micLink()}</p>`;
  if(!MIC_OK) return `<p class="note">${ic("info")} Este browser não deu acesso ao microfone. Abre a página a partir do computador no Chrome, ou de um endereço https.</p>`;
  return "";
}
function sessionScoreLabel(s){
  if(s.kind==="fala") return `índice ${s.index??"—"}`;
  if(s.kind==="quiz") return `${s.score}/${s.total} certas`;
  if(s.kind==="drill") return s.eval && s.eval.verdict ? s.eval.verdict[0] : "exercício feito";
  if(s.kind==="escrita") return s.claude && s.claude.nota_global!=null ? `nota ${fmt(Number(s.claude.nota_global),1)}` : "texto escrito";
  return "";
}

/* ===================== TREINAR ===================== */
function allExercises(){ return EX.concat(S.custom.filter(c=>c && c.title)); }
function filteredEx(){
  const f=S.filters, q=f.q.trim().toLowerCase();
  return allExercises().filter(e=>{
    if(f.track==="fav"){ if(!S.favs.has(e.id)) return false; }
    else if(f.track!=="todos" && e.track!==f.track) return false;
    if(f.kind!=="todos" && e.kind!==f.kind) return false;
    if(q && !(e.title+" "+e.skill+" "+e.brief).toLowerCase().includes(q)) return false;
    return true;
  });
}
function exRow(e, dm){
  const d=dm[e.id];
  return `<button class="ex-row t-${e.track}" data-act="open-ex" data-id="${h(e.id)}">
    <span class="ex-ic">${ic(KIND_ICON[e.kind])}</span>
    <span class="ex-txt"><span class="ex-title">${h(e.title)}${S.favs.has(e.id)?` <span class="fav-on" aria-label="Favorito">★</span>`:""}</span><span class="ex-meta">${KINDS[e.kind].name} · ${durLabel(e)} · ${h(e.skill)}${e.custom?" · criado pelo Claude":""}</span></span>
    <span class="ex-end">${d?`<span class="done-badge" aria-label="Feito ${d.n} vezes">${ic("check")}${d.n}</span>`:""}${lvDots(e.level||1)}</span></button>`;
}
function exList(){
  const list=filteredEx(), dm=doneMap(), f=S.filters;
  if(!list.length) return `<p class="empty">Nada encontrado com estes filtros.</p>`;
  if(f.track==="todos" || f.track==="fav"){
    return TRACK_ORDER.map(t=>{ const items=list.filter(e=>e.track===t); if(!items.length) return "";
      return `<h2 class="group-title t-${t}"><span class="tdot"></span>${h(TRACKS[t].name)} <small>${items.length}</small></h2><div class="ex-list">${items.map(e=>exRow(e,dm)).join("")}</div>`; }).join("");
  }
  const groups={ drill:"Exercícios guiados", fala:"Desafios falados", quiz:"Quiz", escrita:"Escrita" };
  return ["drill","fala","quiz","escrita"].map(k=>{ const items=list.filter(e=>e.kind===k); if(!items.length) return "";
    return `<p class="subgroup">${groups[k]} · ${items.length}</p><div class="ex-list">${items.map(e=>exRow(e,dm)).join("")}</div>`; }).join("");
}
function viewTreinar(){
  const f=S.filters;
  const tChips=[["todos","Todos"], ...TRACK_ORDER.map(t=>[t,TRACKS[t].name]), ["fav","Favoritos"]];
  const kChips=[["todos","Tudo"],["fala","Falar"],["drill","Exercícios"],["quiz","Quiz"],["escrita","Escrever"]];
  const gen = (TRACKS[f.track] && claudeOn()) ? `<div class="gen-card t-${f.track}"><div><b>Queres algo novo em ${h(TRACKS[f.track].name)}?</b><p class="sub">O Claude cria um desafio à tua medida, ao teu nível atual.</p></div><button class="btn sm" data-act="gen-challenge" data-v="${f.track}">${ic("sparkle")} Criar desafio</button></div>` : "";
  return `
  <header class="page-head"><div><p class="eyebrow">Biblioteca · ${allExercises().length} exercícios</p><h1>Treinar</h1></div><button class="icon-btn" data-act="settings" aria-label="Definições">${ic("sliders")}</button></header>
  <div class="filters">
    <label class="search"><span class="sr">Procurar</span>${ic("search")}<input type="search" id="q" placeholder="Procurar exercícios, competências…" value="${h(f.q)}" autocomplete="off"></label>
    <div class="chip-row" role="group" aria-label="Área">${tChips.map(([v,l])=>`<button class="fchip" aria-pressed="${f.track===v}" data-act="filter-track" data-v="${v}">${TRACKS[v]?`<span class="tdot t-${v}"></span>`:""}${h(l)}</button>`).join("")}</div>
    <div class="chip-row" role="group" aria-label="Tipo">${kChips.map(([v,l])=>`<button class="fchip sm" aria-pressed="${f.kind===v}" data-act="filter-kind" data-v="${v}">${h(l)}</button>`).join("")}</div>
  </div>
  ${gen}
  <div id="ex-list" class="stack">${exList()}</div>`;
}
function openEx(id){
  const ex=getEx(id); if(!ex) return;
  const d=doneMap()[id];
  if(ex.dyn==="words3" && !S.studio.words3) S.studio.words3=pickWords3();
  const meta=[KINDS[ex.kind].name, durLabel(ex), ex.focus?`Foco: ${FOCUS_LABEL[ex.focus]}`:"", ex.lang?ex.lang.toUpperCase():""].filter(Boolean).map(x=>`<span class="tag">${h(x)}</span>`).join("");
  const steps = ex.kind==="drill" ? `<ol class="steps-prev">${ex.steps.map(s=>`<li><span>${h(s.t)}</span><small>${s.s} s</small></li>`).join("")}</ol>` : "";
  const words = ex.dyn==="words3" ? `<div class="words3">${S.studio.words3.map(w=>`<b>${h(w)}</b>`).join("")}<button class="btn sm ghost" data-act="words3-roll">${ic("shuffle")} Outras</button></div>` : "";
  const html=`<div class="stack t-${ex.track}">
    <div class="detail-band">${trackTag(ex.track)}<span class="sub">${h(ex.skill)}</span>${lvDots(ex.level||1)}</div>
    <h2 class="detail-title">${h(ex.title)}</h2>
    <div class="row">${meta}</div>
    <p class="detail-brief">${h(ex.brief)}</p>
    ${ex.target?`<blockquote class="target">${h(ex.target)}</blockquote>`:""}
    ${words}${steps}
    ${ex.kind==="quiz"?`<p class="sub">${ex.questions.length} perguntas, com explicação em cada resposta.</p>`:""}
    ${LEVEL_NOTE[S.settings.level] && ex.kind==="fala" ? `<p class="levelnote">${h(LEVEL_NOTE[S.settings.level])}</p>`:""}
    <div class="tipbox"><h4>Dica</h4><p>${h(ex.tip||"")}</p></div>
    ${ex.why?`<p class="why"><b>Porque funciona.</b> ${h(ex.why)}</p>`:""}
    ${d?`<p class="sub">${ic("check")} Feito ${d.n} ${d.n===1?"vez":"vezes"}${d.best!=null && ex.kind==="fala"?` · melhor índice ${d.best}`:""}${d.best!=null && ex.kind==="quiz"?` · melhor ${d.best}/${ex.questions.length}`:""}</p>`:""}
    <div class="sheet-actions"><button class="btn primary" data-act="start-ex" data-id="${h(ex.id)}">${ic(ex.kind==="fala"?"mic":"play")} ${KINDS[ex.kind].verb}</button><button class="icon-btn" data-act="fav" data-id="${h(ex.id)}" aria-pressed="${S.favs.has(ex.id)}" aria-label="Favorito">${ic("star")}</button></div>
  </div>`;
  if(Sheet.isOpen) { Sheet.title(KINDS[ex.kind].name); Sheet.set(html); } else Sheet.open(KINDS[ex.kind].name, html);
}
function pickWords3(){ const a=WORDS3.slice(); const out=[]; while(out.length<3){ out.push(a.splice(Math.floor(Math.random()*a.length),1)[0]); } return out; }
function startEx(id){
  const ex=getEx(id); if(!ex) return;
  if(ex.kind==="fala"){
    if(ex.dyn==="words3"){ const w=S.studio.words3||pickWords3(); S.studio.dynEx=Object.assign({}, ex, { brief: ex.brief+` As palavras: ${w.join(", ")}.`, words:w }); S.studio.words3=null; }
    else if(EX_BY_ID[id] || S.custom.some(c=>c.id===id)){ S.studio.dynEx=null; S.studio.exId=id; LS.set("studioEx", id); }
    S.studio.view="ready"; S.studio.sub="resumo";
    Sheet.close(true); goTab("estudio");
    return;
  }
  if(ex.kind==="drill") return Drill.intro(ex);
  if(ex.kind==="quiz") return Quiz.start(ex);
  if(ex.kind==="escrita") return Writing.start(ex);
}

/* ===================== ESTÚDIO ===================== */
function viewEstudio(){
  if(S.studio.view==="results" && S.studio.result) return studioResults();
  const ex=currentEx(), lang=exLang(ex), tgt=ex?targetSeconds(ex):60;
  const ctx = ex ? `
    <div class="ctx-top"><span class="ex-ic">${ic(KIND_ICON.fala)}</span><div><p class="eyebrow" style="margin:0 0 2px">${h(TRACKS[ex.track].name)} · ${h(ex.skill)}</p><h2>${h(ex.title)}</h2></div></div>
    <p class="ctx-brief">${h(ex.brief)}</p>
    ${ex.target?`<blockquote class="target">${h(ex.target)}</blockquote>`:""}
    ${LEVEL_NOTE[S.settings.level]?`<p class="levelnote">${h(LEVEL_NOTE[S.settings.level])}</p>`:""}
    <div class="ctx-meta"><span class="tag">${ic("target")} Alvo ${clockText(tgt)}</span>${ex.focus?`<span class="tag">Foco: ${h(FOCUS_LABEL[ex.focus])}</span>`:""}<span class="tag">${h(LANGS[lang])}</span></div>
    ${ex.tip?`<div class="tipbox"><h4>Dica</h4><p>${h(ex.tip)}</p></div>`:""}`
    : `<div class="ctx-top"><span class="ex-ic">${ic("mic")}</span><div><p class="eyebrow" style="margin:0 0 2px">Sem desafio</p><h2>Treino livre</h2></div></div><p class="ctx-brief">Fala sobre o que quiseres: ensaia uma reunião, uma história ou uma conversa. Recebes a análise completa da voz.</p>`;
  const langSeg = `<span><span class="lbl">Língua</span><span class="seg" role="group" aria-label="Língua">${["pt","fr","en"].map(l=>`<button aria-pressed="${lang===l}" data-act="set-lang" data-v="${l}" ${ex&&ex.lang?"disabled":""}>${l.toUpperCase()}</button>`).join("")}</span></span>`;
  const lvlSeg = `<span><span class="lbl">Nível</span><span class="seg" role="group" aria-label="Nível">${[1,2,3].map(n=>`<button aria-pressed="${S.settings.level===n}" data-act="set-level" data-v="${n}">${n}</button>`).join("")}</span></span>`;
  const showFile = !MIC_OK || S.studio.showFile;
  return `
  <header class="page-head"><div><p class="eyebrow">Estúdio</p><h1>${ex?"Gravar desafio":"Treino livre"}</h1></div><button class="icon-btn" data-act="settings" aria-label="Definições">${ic("sliders")}</button></header>
  <section class="card ctx ${ex?"t-"+ex.track:""}">
    ${ctx}
    <div class="row"><button class="btn sm" data-act="goto" data-tab="treinar">${ic("target")} Trocar desafio</button>${ex?`<button class="btn sm ghost" data-act="free">Treino livre</button>`:""}</div>
    <div class="ctx-controls">${langSeg}${lvlSeg}</div>
  </section>
  ${MIC_OK ? recorderCard(tgt) : ""}
  ${showFile ? uploadCard() : ""}
  <div class="progress" id="prog" hidden><i></i></div>
  <p class="msg" id="an-msg" hidden></p>
  <button class="linkbtn" data-act="example-report">Ver um relatório de exemplo</button>`;
}
function recorderCard(tgt){
  const trOk=!!SpeechRec;
  return `<section class="card" id="rec">
    <div class="recbar"><button class="recbtn" id="btn-rec" data-act="rec" aria-pressed="false"><span class="dot" aria-hidden="true"></span><span id="rec-label">Começar a falar</span></button>
      <div class="clock" id="clock"><span id="rec-time">0:00</span><small>/ ${clockText(tgt)}</small></div></div>
    <div class="progress" id="rec-prog"><i></i></div>
    <canvas class="live" id="live" aria-label="Tom e energia da tua voz em tempo real"></canvas>
    <div class="livestats"><div><span>Tom</span><b id="ls-tone" data-s="">—</b></div><div><span>Ritmo · ppm</span><b id="ls-wpm" data-s="">—</b></div><div><span>Bengalas</span><b id="ls-fill" data-s="">—</b></div></div>
    <p class="live-tr" id="live-tr" hidden></p>
    <label class="switch"><input type="checkbox" id="opt-tr" ${trOk&&S.settings.autotr?"checked":""} ${trOk?"":"disabled"}><span>Transcrição automática<small id="tr-note">${trOk?(IS_MOBILE?"Conta bengalas e marcadores. No telemóvel pode impedir a medição da voz: se a gravação ficar sem som, desliga.":"Conta bengalas, linguagem fraca e marcadores de história. Usa o serviço de voz do browser."):"Este browser não transcreve automaticamente. Podes colar o texto depois, no relatório."}</small></span></label>
    <p class="msg" id="mic-msg" hidden></p>
    <button class="linkbtn" data-act="toggle-file">${S.studio.showFile?"Esconder a análise de ficheiros":"Analisar um ficheiro já gravado"}</button>
  </section>`;
}
function uploadCard(){
  return `<section class="card">
    <h2>Analisar uma gravação</h2>
    ${IN_VIEWER?`<p class="note">${ic("info")} Dentro do Claude as páginas não acedem ao microfone. Grava a resposta no gravador do telemóvel e carrega-a aqui.</p>`:""}
    <ol class="steps"><li><span>Responde ao desafio em voz alta no gravador do telemóvel, a um palmo da boca, num sítio sem eco.</span></li><li><span>Carrega o áudio. M4A, MP3 e WAV funcionam em todo o lado.</span></li><li><span>Opcional: cola a transcrição para contar bengalas e marcadores. Os gravadores do iPhone e do Android transcrevem sozinhos.</span></li></ol>
    <div class="filerow">
      <label class="btn primary filebtn" for="f-capture">${ic("mic")} Gravar agora<input type="file" id="f-capture" accept="audio/*" capture></label>
      <label class="btn filebtn" for="f-pick">${ic("upload")} Escolher ficheiro<input type="file" id="f-pick" accept="audio/*,.m4a,.mp3,.wav,.aac,.ogg,.opus,.webm,.caf,.flac"></label>
    </div>
    <p class="fname" id="fname">${S.studio.file?h(S.studio.file.name):"Nenhum ficheiro escolhido."}</p>
    <div class="field"><label class="lbl" for="transcript">Transcrição (opcional)</label><textarea id="transcript" rows="4" placeholder="Cola aqui o que disseste, tal como saiu.">${h(S.studio.transcript)}</textarea></div>
    <button class="btn primary block" data-act="analyze" id="btn-analyze" ${S.studio.file?"":"disabled"}>Analisar a minha voz</button>
  </section>`;
}
function onFile(input){
  const f=input.files && input.files[0]; if(!f) return;
  S.studio.file=f;
  const n=$("#fname"); if(n) n.textContent=f.name+" · "+(f.size/1024/1024).toFixed(1)+" MB";
  const b=$("#btn-analyze"); if(b) b.disabled=false;
  showMsg("#an-msg","",false);
}
async function analyzeFile(){
  if(!S.studio.file) return;
  const btn=$("#btn-analyze"); if(btn) btn.disabled=true;
  showMsg("#an-msg","A ler o áudio…",false);
  try{ const ab=await decodeFile(S.studio.file); await runAnalysis(ab, S.studio.transcript, "file"); }
  catch(e){ showMsg("#an-msg", e && e.message==="no-audio" ? "Este browser não consegue ler áudio. Abre a página no Chrome ou no Safari." : "Não consegui abrir este ficheiro. Exporta a gravação em M4A, MP3 ou WAV e tenta outra vez.", true); }
  finally{ if(btn) btn.disabled=false; }
}
async function runAnalysis(ab, transcript, source){
  const prog=$("#prog"), bar=prog?prog.querySelector("i"):null;
  if(prog){ prog.hidden=false; bar.style.width="8%"; }
  showMsg("#an-msg","A medir tom, ritmo e pausas…",false); await tick();
  try{
    const mono=toMono8k(ab, 300);
    const { metrics, series } = await analyzeVoice(mono.x, p=>{ if(bar) bar.style.width=Math.round(p*100)+"%"; });
    const res=buildResult(metrics, series, transcript, source);
    res.notes=[]; if(mono.truncated) res.notes.push("Analisei os primeiros 5 minutos."); if(mono.clipRatio>0.002) res.notes.push("A gravação está a saturar: afasta um pouco o microfone."); if(metrics.snr<14) res.notes.push("Muito ruído de fundo: o tom e as pausas podem estar menos precisos.");
    await Store.addSession(res);
    S.studio.result=res; S.studio.view="results"; S.studio.sub="resumo"; S.studio.transcript=""; S.studio.file=null;
    Rec.busy=false; render(); window.scrollTo(0,0);
    toast(`Sessão guardada · +${res.xp} XP`);
    return true;
  }catch(e){
    const code=e && e.message;
    let text = code==="short" ? "A gravação é demasiado curta. Fala pelo menos 5 segundos." : code==="novoice" ? "Não encontrei voz suficiente. Fala mais perto do microfone, num sítio sem ruído." : "Não consegui analisar esta gravação. Tenta outra vez.";
    if(source==="mic" && code==="novoice" && live.usedTr) text+=" Se a transcrição automática estava ligada, desliga-a: alguns telemóveis não deixam gravar e transcrever ao mesmo tempo.";
    Rec.busy=false;
    showMsg("#an-msg", text, true);
    return false;
  }finally{ if(prog) setTimeout(()=>{ prog.hidden=true; if(bar) bar.style.width="0"; }, 400); }
}
function buildResult(metrics, series, transcript, source){
  const ex=currentEx(), lang=exLang(ex), text=(transcript||"").trim();
  const words=analyzeWords(text, lang, metrics.durationS); if(words) metrics.wpm=words.wpm;
  const index=voiceIndex(metricValues(metrics, lang)), track=ex?ex.track:"voz";
  const res={ id:"s"+Date.now(), at:Date.now(), kind:"fala", track, challengeId: ex?ex.id:"livre", title: ex?ex.title:"Treino livre", skill: ex?ex.skill:"Livre",
    level:S.settings.level, lang, source, target: ex?targetSeconds(ex):null, metrics, index, words, transcript:text, series: packSeries(series) };
  if(ex && (S.studio.dynEx || ex.custom)) res.brief=ex.brief;
  res.markers = track==="historia" ? storyMarkers(text, lang) : track==="social" ? socialMarkers(text, lang) : null;
  res.xp=xpOf(res);
  return res;
}

/* ---------- Microphone ---------- */
const Mic = {
  ctx:null, stream:null, src:null, proc:null, mute:null, onLimit:null,
  async open(keepAudio){
    const AC=window.AudioContext||window.webkitAudioContext; const ctx=new AC(); const resumed=ctx.resume().catch(()=>{});
    let stream;
    try{ stream=await navigator.mediaDevices.getUserMedia({ audio:{ echoCancellation:false, noiseSuppression:false, autoGainControl:false, channelCount:1 } }); }
    catch(e){ const n=e&&e.name; try{ ctx.close(); }catch(_){} return { ok:false, msg: n==="NotAllowedError"||n==="SecurityError" ? "O acesso ao microfone foi recusado. Autoriza o microfone para esta página nas definições do browser e tenta outra vez." : n==="NotFoundError"||n==="OverconstrainedError" ? "Não encontrei nenhum microfone disponível." : "Não consegui abrir o microfone. Fecha outras apps que o estejam a usar e tenta outra vez." }; }
    await resumed; Wake.hold("mic");
    initLive(ctx.sampleRate); live.keepAudio=!!keepAudio;
    const src=ctx.createMediaStreamSource(stream), proc=ctx.createScriptProcessor(4096,1,1), mute=ctx.createGain(); mute.gain.value=0;
    proc.onaudioprocess = ev=>{ if(!live.on) return; const c=new Float32Array(ev.inputBuffer.getChannelData(0));
      if(live.keepAudio){ live.chunks.push(c); live.total+=c.length; if(live.total/live.sr>=300 && this.onLimit){ const f=this.onLimit; this.onLimit=null; f(); } }
      feedLive(c); };
    src.connect(proc); proc.connect(mute); mute.connect(ctx.destination);
    Object.assign(this,{ ctx, stream, src, proc, mute });
    live.on=true; live.startedAt=performance.now();
    return { ok:true };
  },
  takeAudio(){ const all=new Float32Array(live.total); let o=0; for(const c of live.chunks){ all.set(c,o); o+=c.length; } live.chunks=[]; live.total=0; return { sampleRate:live.sr, numberOfChannels:1, length:all.length, getChannelData:()=>all }; },
  async close(){
    live.on=false;
    try{ this.proc.onaudioprocess=null; this.proc.disconnect(); this.src.disconnect(); this.mute.disconnect(); }catch(e){}
    try{ this.stream.getTracks().forEach(t=>t.stop()); }catch(e){}
    try{ if(this.ctx) await this.ctx.close(); }catch(e){}
    this.ctx=null; this.stream=null; this.onLimit=null; Wake.drop("mic");
  }
};
function drawLive(cv, opts){
  opts=opts||{};
  const dpr=window.devicePixelRatio||1, W=cv.clientWidth, H=cv.clientHeight; if(!W) return;
  if(cv.width!==Math.round(W*dpr)||cv.height!==Math.round(H*dpr)){ cv.width=Math.round(W*dpr); cv.height=Math.round(H*dpr); }
  const g=cv.getContext("2d"); g.setTransform(dpr,0,0,dpr,0,0); g.clearRect(0,0,W,H);
  const cs=getComputedStyle(document.documentElement), tok=n=>cs.getPropertyValue(n).trim();
  const padL=40, padR=10, padT=10, padB=10;
  const win=Math.round(8*(live.fps||100)), L=live.db&&live.db.length||0, a=L-win;
  const X=f=>padL+(f-a)/win*(W-padL-padR), ST=9, Y=v=>padT+(1-(v+ST)/(2*ST))*(H-padT-padB);
  if(L){
    const span=Math.max(1,live.p97-live.floor), base=H-padB, eh=(H-padT-padB)*0.45, step=Math.max(1,Math.floor(win/(W-padL-padR)));
    g.beginPath(); g.moveTo(X(Math.max(a,0)),base);
    for(let f=Math.max(a,0); f<L; f+=step){ let mx=-200; for(let k=f;k<Math.min(L,f+step);k++) mx=Math.max(mx,live.db[k]); const v=clamp((mx-live.floor)/span,0,1); g.lineTo(X(f),base-v*eh); }
    g.lineTo(X(L),base); g.closePath(); g.fillStyle=tok("--line-2"); g.globalAlpha=.75; g.fill(); g.globalAlpha=1;
  }
  g.strokeStyle=tok("--grid"); g.lineWidth=1; g.font="10px "+tok("--f-mono"); g.fillStyle=tok("--muted"); g.textBaseline="middle"; g.textAlign="right";
  [-6,0,6].forEach(v=>{ g.beginPath(); g.moveTo(padL,Y(v)); g.lineTo(W-padR,Y(v)); g.stroke(); g.fillText((v>0?"+":v<0?"−":"")+Math.abs(v)+(v===0?"":" st"), padL-6, Y(v)); });
  if(L && !isNaN(live.base)){
    g.strokeStyle=tok(opts.color||"--voz"); g.lineWidth=2; g.lineJoin="round"; g.lineCap="round"; g.beginPath();
    let pen=false, lastF=-9;
    for(let f=Math.max(a,0); f<L; f++){ const hz=live.hz[f]; if(isNaN(hz)) continue; const v=clamp(12*Math.log2(hz/live.base),-ST,ST); if(!pen||f-lastF>3){ g.moveTo(X(f),Y(v)); pen=true; } else g.lineTo(X(f),Y(v)); lastF=f; }
    g.stroke();
  } else {
    g.fillStyle=tok("--muted"); g.textAlign="center"; g.font="13px "+tok("--f-ui");
    g.fillText(live.on?"A ouvir… começa a falar":"O teu tom aparece aqui enquanto falas", (padL+W-padR)/2, H/2);
  }
}

/* ---------- Studio recorder ---------- */
const Rec = {
  active:false, busy:false, raf:0, recog:null, n:0,
  async toggle(){ this.active ? this.stop() : this.start(); },
  async start(){
    if(this.active || this.busy) return;
    const btn=$("#btn-rec"); if(btn) btn.disabled=true;
    showMsg("#mic-msg","",false); showMsg("#an-msg","",false);
    const r=await Mic.open(true);
    if(!r.ok){ showMsg("#mic-msg", r.msg, true); if(btn) btn.disabled=false; return; }
    this.active=true; this.n=0; buzz(15);
    Mic.onLimit=()=>this.stop();
    ["ls-tone","ls-wpm","ls-fill"].forEach(id=>{ const b=$("#"+id); if(b){ b.textContent="—"; b.dataset.s=""; } });
    const tr=$("#live-tr"); if(tr) tr.hidden=true;
    const opt=$("#opt-tr");
    if(SpeechRec && opt && opt.checked) this.startRecognition();
    document.querySelectorAll('[data-act="set-lang"],[data-act="set-level"],[data-act="free"],[data-act="toggle-file"]').forEach(b=>b.disabled=true);
    if(opt) opt.disabled=true;
    if(btn){ btn.setAttribute("aria-pressed","true"); $("#rec-label").textContent="Parar e analisar"; btn.disabled=false; }
    this.raf=requestAnimationFrame(()=>this.loop());
  },
  loop(){
    if(!this.active) return;
    this.raf=requestAnimationFrame(()=>this.loop());
    const el=(performance.now()-live.startedAt)/1000, ex=currentEx(), target=ex?targetSeconds(ex):60;
    const t=$("#rec-time"); if(t) t.textContent=clockText(el);
    const over=el>target; const c=$("#clock"); if(c) c.classList.toggle("over", over);
    const p=$("#rec-prog"); if(p){ p.classList.toggle("over", over); p.querySelector("i").style.width=Math.min(100,100*el/target)+"%"; }
    const cv=$("#live"); if(cv) drawLive(cv);
    if(++this.n%12===0) this.stats();
  },
  stats(){
    const sd=liveToneSD(), t=$("#ls-tone");
    if(t){ if(isNaN(sd)){ t.textContent="—"; t.dataset.s=""; } else { const v=sd<1.8?["Plano","bad"]:sd<2.5?["Pouco variado","warn"]:sd<=5.5?["Expressivo","good"]:["Oscilante","warn"]; t.textContent=v[0]; t.dataset.s=v[1]; } }
    const act=liveActiveSec(), w=$("#ls-wpm"), lang=exLang(currentEx());
    const words=wordCount((live.finalText||"")+" "+(live.interim||""));
    let wpm=NaN, est=false; if(words>=8 && act>=4) wpm=words/(act/60); else if(act>=4){ wpm=(live.peaks/act)*60/(SYL_PER_WORD[lang]||2); est=true; }
    if(w){ if(isNaN(wpm)){ w.textContent="—"; w.dataset.s=""; } else { w.textContent=(est?"≈":"")+Math.round(wpm); w.dataset.s= wpm>185?"bad": (wpm>165||wpm<110)?"warn":"good"; } }
    if(!live.warned && (performance.now()-live.startedAt)>3500 && live.maxLevel<-78){ live.warned=true; showMsg("#mic-msg","Não está a chegar som do microfone. Confirma o acesso do browser e que nenhuma outra app o está a usar."+(live.usedTr?" Se continuar assim, desliga a transcrição automática.":""), true); }
  },
  startRecognition(){
    try{
      const r=new SpeechRec(); r.lang=SR_LANG[exLang(currentEx())]; r.continuous=true; r.interimResults=true; r.maxAlternatives=1;
      r.onresult=e=>{ let interim=""; for(let i=e.resultIndex;i<e.results.length;i++){ const res=e.results[i]; if(res.isFinal) live.finalText+=res[0].transcript.trim()+" "; else interim+=res[0].transcript; } live.interim=interim; this.renderTr(); };
      r.onerror=e=>{ if(e.error==="no-speech"||e.error==="aborted") return; live.recErr=e.error; const n=$("#tr-note"); if(n) n.textContent=trErrText(e.error); };
      r.onend=()=>{ if(live.on && this.active && !live.recErr && this.recog===r){ try{ r.start(); return; }catch(_){} } if(r._done) r._done(); };
      this.recog=r; live.usedTr=true; r.start();
      const tr=$("#live-tr"); if(tr){ tr.hidden=false; this.renderTr(); }
    }catch(e){ live.recErr="start"; }
  },
  stopRecognition(){
    const r=this.recog; if(!r) return Promise.resolve();
    return new Promise(res=>{ let done=false; const fin=()=>{ if(!done){ done=true; res(); } }; r._done=fin; try{ r.stop(); }catch(e){ fin(); } setTimeout(fin,1500); }).then(()=>{ this.recog=null; });
  },
  renderTr(){
    const el=$("#live-tr"); if(!el) return; const lang=exLang(currentEx());
    const fin=live.finalText||"", intr=live.interim||"";
    el.innerHTML = (!fin && !intr) ? '<span class="interim">A ouvir…</span>' : markTranscript(fin, lang) + (intr?'<span class="interim">'+markTranscript(intr, lang)+'</span>':"");
    el.scrollTop=el.scrollHeight;
    const n=sumCounts(countTerms(fin+" "+intr, (LEX[lang]||LEX.pt).fillers)), b=$("#ls-fill");
    if(b){ b.textContent=String(n); b.dataset.s= n===0?"good": n<=3?"warn":"bad"; }
  },
  async stop(){
    if(!this.active) return;
    this.active=false; this.busy=true; cancelAnimationFrame(this.raf); buzz(15);
    const btn=$("#btn-rec"); if(btn){ btn.disabled=true; btn.setAttribute("aria-pressed","false"); $("#rec-label").textContent="A analisar…"; }
    const audio=Mic.takeAudio();
    await Mic.close(); await this.stopRecognition();
    const text=((live.finalText||"")+" "+(live.interim||"")).replace(/\s+/g," ").trim();
    const ok=await runAnalysis(audio, live.usedTr?text:"", "mic");
    this.busy=false;
    if(!ok){ if(btn){ btn.disabled=false; $("#rec-label").textContent="Gravar outra vez"; } document.querySelectorAll('[data-act="set-lang"],[data-act="set-level"],[data-act="free"],[data-act="toggle-file"]').forEach(b=>b.disabled=false); const o=$("#opt-tr"); if(o) o.disabled=!SpeechRec; }
    if(pending) render();
  }
};
function trErrText(code){
  return code==="not-allowed"||code==="service-not-allowed" ? "A transcrição não está autorizada neste browser. A análise de voz continua."
    : code==="network" ? "A transcrição precisa de internet. A análise de voz continua."
    : code==="audio-capture" ? "O microfone não deu para gravar e transcrever ao mesmo tempo. A análise de voz continua."
    : code==="language-not-supported" ? "Esta língua não é suportada pela transcrição deste browser."
    : "Transcrição indisponível. A análise de voz continua.";
}

/* ---------- Report ---------- */
const CHARTS = {};
function studioResults(){
  const r=S.studio.result;
  return `<header class="page-head"><div><p class="eyebrow">Relatório · ${h(new Date(r.at).toLocaleString("pt-PT",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"}))}</p><h1>${h(r.title)}</h1></div></header>
  ${(r.notes||[]).length?`<p class="banner">${h(r.notes.join(" "))}</p>`:""}
  <section class="card t-${r.track}">${reportHTML(r, S.studio.sub, "studio")}</section>
  <div class="res-actions"><button class="btn" data-act="new-rec">${ic("mic")} Repetir</button><button class="btn primary" data-act="next-ex">Próximo desafio ${ic("chevR")}</button></div>`;
}
function contentMarkers(r){
  if(!r.transcript) return null;
  if(r.track==="historia"){ const d=storyMarkers(r.transcript, r.lang); return d && { kind:"historia", label:"Índice narrativo", score:d.score, d }; }
  if(r.track==="social"){ const d=socialMarkers(r.transcript, r.lang); return d && { kind:"social", label:"Índice social", score:d.score, d }; }
  return null;
}
function reportHTML(r, sub, scope){
  const m=r.metrics||{}, vals=metricValues(m, r.lang), idx=r.index ?? voiceIndex(vals), cm=contentMarkers(r);
  const ranked=METRIC_KEYS.map(k=>[k,subScore(k,vals[k])]).filter(x=>x[1]!=null).sort((a,b)=>a[1]-b[1]);
  const weak=ranked.filter(x=>x[1]<100).slice(0,2).map(x=>DEF[x[0]].name.toLowerCase());
  const tags=[ `<span class="tag">${ic("target")} ${fmt(m.durationS)} s${r.target?` de ${r.target}`:""}</span>`, cm?`<span class="tag">${h(cm.label)}: ${cm.score}</span>`:"", r.xp?`<span class="tag">+${r.xp} XP</span>`:"", r.isExample?`<span class="tag">Exemplo</span>`:"" ].join("");
  const subs=[["resumo","Resumo"],["voz","Voz"],["conteudo","Conteúdo"],["coach","Coach"]];
  return `<div class="res-hero">${ring(idx/100, idx, "índice", 92, 9, "lg")}<div><h3>${h(indexLabel(idx))}</h3><p>${weak.length?"Onde ganhas mais: "+h(weak.join(" e "))+".":"Todas as métricas de voz na zona boa."}</p><div class="hero-tags">${tags}</div></div></div>
  <div class="subtabs" role="tablist">${subs.map(([k,l])=>`<button role="tab" aria-selected="${sub===k}" data-act="sub" data-sub="${k}" data-scope="${scope}">${l}</button>`).join("")}</div>
  <div class="panel-body" id="${scope}-panel">${panelHTML(r, sub, scope, cm, vals)}</div>`;
}
function panelHTML(r, sub, scope, cm, vals){
  const m=r.metrics||{};
  if(sub==="voz"){
    const cards=METRIC_KEYS.map(k=>metricCard(k, vals[k], m)).join("");
    const facts=[["Duração útil",fmt(m.durationS)+" s"],["Tempo a falar",fmt(100*m.speechRatio)+"%"],["Tom médio",fmt(m.medianHz)+" Hz"],["Alcance de tom",fmt(m.pitchRange,1)+" st"],["Sílabas por segundo",fmt(m.artRate,1)],["Pausa mais longa",fmt(m.longestPause,1)+" s"],["Fins a subir",fmt(m.upPct)+"%"],["Fins engolidos",fmt(m.swallowedPct)+"%"]];
    return `<div class="metrics">${cards}</div><dl class="facts">${facts.map(([a,b])=>`<div><dt>${a}</dt><dd>${b}</dd></div>`).join("")}</dl>`;
  }
  if(sub==="conteudo") return contentPanel(r, scope, cm);
  if(sub==="coach") return coachPanel(r, scope);
  const goods=METRIC_KEYS.filter(k=>subScore(k,vals[k])===100).slice(0,2).map(k=>({ t:`${DEF[k].name}: ${DEF[k].verdict(vals[k])[0]}`, d:DEF[k].hint(vals[k]) }));
  if(cm && cm.kind==="historia" && cm.d.sensory>=3) goods.push({ t:"Detalhe sensorial", d:`Usaste ${cm.d.sensory} referências aos sentidos. Põe quem ouve dentro da cena.` });
  if(cm && cm.kind==="social" && cm.d.assume>0) goods.push({ t:"Suposições lúdicas", d:"Usaste afirmações em vez de perguntas. Cria brincadeira e mostra personalidade." });
  const fixes=focusItems(r, vals, cm);
  const contour = r.series ? contourChart(r.series, scope+"-contour") : `<p class="note">O gráfico do tom não ficou guardado nesta sessão antiga.</p>`;
  const tgt = r.target ? `<p class="sub">Falaste ${fmt(m.durationS)} s para um alvo de ${r.target} s. ${Math.abs(m.durationS-r.target)/r.target<=0.25?"Dentro do tempo.":m.durationS>r.target?"Passaste do tempo: corta o que não leva ao essencial.":"Ficaste curto: desenvolve um exemplo concreto."}</p>` : "";
  return `${contour}${tgt}
    <div class="grid-2"><div class="stack"><p class="h4">O que funcionou</p>${goods.length?`<ul class="focus-list">${goods.map(g=>`<li class="good"><span class="f-ic">${ic("check")}</span><div><b>${h(g.t)}</b><span>${h(g.d)}</span></div></li>`).join("")}</ul>`:`<p class="sub">Ainda nenhuma métrica na zona boa. Escolhe uma e foca-te só nela na próxima tentativa.</p>`}</div>
    <div class="stack"><p class="h4">A trabalhar a seguir</p>${fixes.length?`<ul class="focus-list">${fixes.map(g=>`<li class="fix"><span class="f-ic">${ic("target")}</span><div><b>${h(g.t)}</b><span>${h(g.d)}</span></div></li>`).join("")}</ul>`:`<p class="sub">Nada de urgente. Sobe o nível do desafio.</p>`}</div></div>`;
}
function focusItems(r, vals, cm){
  const out=[];
  METRIC_KEYS.map(k=>[k,subScore(k,vals[k])]).filter(x=>x[1]!=null && x[1]<100).sort((a,b)=>a[1]-b[1]).slice(0,2).forEach(([k])=>out.push({ t:`${DEF[k].name}: ${DEF[k].verdict(vals[k])[0]}`, d:DEF[k].hint(vals[k]) }));
  const w=r.words;
  if(w && w.fillerPerMin>3) out.push({ t:"Bengalas", d:`${fmt(w.fillerPerMin,1)} por minuto. Troca cada uma por um segundo de silêncio.` });
  if(w && w.hedgeTotal>=2) out.push({ t:"Linguagem que tira autoridade", d:`Disseste ${pairs(w.hedges).slice(0,3).map(x=>"“"+x[0]+"”").join(", ")}. Afirma sem amortecedores.` });
  if(cm && cm.kind==="historia"){
    if(cm.d.sensory===0) out.push({ t:"Sem detalhes sensoriais", d:"Acrescenta um som, um cheiro ou uma textura no momento-chave." });
    if(cm.d.turns===0) out.push({ t:"Sem ponto de viragem", d:"Falta um “mas”, um “até que” ou um “de repente”. Sem viragem não há tensão." });
    if(cm.d.emotions>0 && r.challengeId==="mostrar") out.push({ t:"Emoção nomeada", d:"Disseste a emoção em vez de a mostrares. Descreve o que o corpo fez." });
  }
  if(cm && cm.kind==="social"){
    if(fin(cm.d.focusPct) && cm.d.focusPct<35) out.push({ t:"Foco em ti", d:`Disseste “eu/me/meu” ${cm.d.self} vezes e “tu/te/teu” ${cm.d.other}. Devolve-lhe o foco.` });
    const ex=getEx(r.challengeId); if(ex && ex.skill==="Convite" && cm.d.plan===0) out.push({ t:"Sem plano concreto", d:"Propõe dia, sítio e motivo. Um convite vago passa o risco para ela." });
  }
  if(["reviravolta","silencio-momento","historia-jantar"].includes(r.challengeId) && r.metrics && fin(r.metrics.latePause) && r.metrics.latePause<1) out.push({ t:"A pausa antes do fim", d:`A maior pausa no último quarto foi de ${fmt(r.metrics.latePause,1)} s. Aguenta 1 a 2 segundos antes da frase final.` });
  return out.slice(0,4);
}
function metricCard(k, v, m){
  const d=DEF[k], vd=d.verdict(v), pos=!fin(v)?null:clamp(100*(v-d.min)/(d.max-d.min),0,100), zl=100*(d.lo-d.min)/(d.max-d.min), zr=100*(d.hi-d.min)/(d.max-d.min);
  return `<div class="metric"><div class="top"><span class="name">${h(d.name)}${k==="ritmo"&&!fin(m.wpm)?" (estimado)":""}</span>${pill(vd)}</div>
    <div class="val">${fmt(v,d.dec)}<small>${d.unit}</small></div>
    <div><div class="gauge"><span class="zone" style="left:${zl}%;width:${zr-zl}%"></span>${pos==null?"":`<span class="mark" style="left:${pos}%"></span>`}</div><div class="gauge-scale"><span>${d.min}</span><span>zona ${d.lo}–${d.hi}</span><span>${d.max}</span></div></div>
    <p class="hint">${h(fin(v)?d.hint(v):"Sem dados suficientes nesta gravação.")}</p></div>`;
}
function contourChart(s, id){
  const n=s.db.length, pad=Math.round(0.4/s.hopSec), a=Math.max(0,s.start-pad), b=Math.min(n,s.end+pad), N=Math.max(1,b-a);
  const X=f=>(f-a)/N*1000, ST=9, Y=v=>(1-(clamp(v,-ST,ST)+ST)/(2*ST))*100;
  let pauses="", i=a;
  while(i<b){ if(!spAt(s,i)){ let j=i; while(j<b && !spAt(s,j)) j++; if((j-i)*s.hopSec>=0.25) pauses+=`<rect class="c-pause" x="${X(i).toFixed(1)}" y="0" width="${(X(j)-X(i)).toFixed(1)}" height="100"/>`; i=j; } else i++; }
  const span=Math.max(1,s.peak-s.floor), cols=Math.min(N,500); let e="M0 100";
  for(let c=0;c<=cols;c++){ const f0=a+Math.floor(c/cols*N), f1=Math.min(b,a+Math.floor((c+1)/cols*N)+1); let mx=-200; for(let f=f0;f<f1;f++) mx=Math.max(mx,s.db[f]); const v=clamp((mx-s.floor)/span,0,1); e+=` L${(c/cols*1000).toFixed(1)} ${(100-v*45).toFixed(1)}`; }
  e+=" L1000 100 Z";
  const step=Math.max(1,Math.floor(N/700)), gapF=Math.max(2,Math.round(0.12/s.hopSec)); let p="", pen=false, lastF=-999;
  for(let f=a; f<b; f+=step){ const v=stAt(s,f); if(!fin(v)) continue; p+=`${(!pen||f-lastF>gapF+step)?"M":"L"}${X(f).toFixed(1)} ${Y(v).toFixed(1)} `; pen=true; lastF=f; }
  const tris=(s.finals||[]).filter(q=>q.type!=="flat" && q.f>=a && q.f<=b).map(q=>`<span class="c-tri ${q.type}" style="left:${(X(q.f)/10).toFixed(2)}%">${q.type==="down"?"▼":"▲"}</span>`).join("");
  const pts=[], hs=Math.max(1,Math.floor(N/180));
  for(let f=a; f<b; f+=hs){ const v=stAt(s,f); pts.push({ x:(f-a)/N, y: fin(v)?Y(v)/100:null, t:(f-s.start)*s.hopSec, v, pause:!spAt(s,f) }); }
  CHARTS[id]={ type:"contour", pts };
  const dur=N*s.hopSec;
  return `<div class="chart" data-chart="${id}" style="--h:190px;--series:var(--voz)">
    <div class="yaxis"><span style="top:${Y(6)}%">+6 st</span><span style="top:50%">0</span><span style="top:${Y(-6)}%">−6 st</span></div>
    <div class="plot" tabindex="0" aria-label="Contorno do tom e da energia ao longo da gravação. Usa as setas para percorrer.">
      <svg viewBox="0 0 1000 100" preserveAspectRatio="none" aria-hidden="true">${pauses}<path class="c-energy" d="${e}"/></svg>
      <i class="grid-line" style="top:${Y(6)}%"></i><i class="grid-line base" style="top:50%"></i><i class="grid-line" style="top:${Y(-6)}%"></i>
      <svg viewBox="0 0 1000 100" preserveAspectRatio="none" aria-hidden="true"><path class="c-line" d="${p}"/></svg>
      ${tris}<i class="cross" hidden></i><div class="ctip" hidden></div>
    </div>
    <div class="xaxis"><span>0 s</span><span>${fmt(dur/2)} s</span><span>${fmt(dur)} s</span></div>
  </div>
  <div class="legend"><span><i style="--k:var(--voz)"></i>Tom face ao teu tom médio</span><span><i class="box" style="--k:var(--line-2)"></i>Energia</span><span><i class="box" style="--k:var(--surface-2);box-shadow:inset 0 0 0 1px var(--line-2)"></i>Pausa</span><span><span class="tri" style="color:var(--good)">▼</span>Fim a descer</span><span><span class="tri" style="color:var(--warning)">▲</span>Fim a subir</span></div>`;
}
function contentPanel(r, scope, cm){
  if(!r.transcript){
    return `<p class="sub">Sem transcrição nesta sessão. Cola o que disseste para contar bengalas, linguagem fraca e marcadores de ${r.track==="historia"?"história":r.track==="social"?"conversa":"conteúdo"}.</p>
      <textarea id="retr-${scope}" rows="5" placeholder="O que disseste, tal como saiu."></textarea>
      <button class="btn primary" data-act="retr" data-scope="${scope}">Analisar o texto</button>`;
  }
  const w=r.words||analyzeWords(r.transcript, r.lang, r.metrics.durationS);
  const tagList=(list, empty)=> list && list.length ? `<div class="tags">${pairs(list).map(([t,n])=>`<span class="wtag">${h(t)}<b>×${n}</b></span>`).join("")}</div>` : `<p class="sub">${empty}</p>`;
  let mk="";
  if(cm && cm.kind==="historia"){ const d=cm.d;
    mk=`<p class="h4">Marcadores de história</p><div class="markers">
      ${[["Detalhes sensoriais",d.sensory],["Viragens e tensão",d.turns],["Diálogo",d.dialogue],["Números e tempo",d.numbers+d.time],["Emoções nomeadas",d.emotions],["Índice narrativo",d.score]].map(([a,b])=>`<div class="marker"><span>${a}</span><b>${b}</b></div>`).join("")}</div>
      <p class="sub">Contagens automáticas. Um bom ritmo: três ou mais detalhes sensoriais, pelo menos uma viragem e emoções mostradas, não nomeadas.</p>`; }
  if(cm && cm.kind==="social"){ const d=cm.d;
    mk=`<p class="h4">Marcadores de conversa</p><div class="markers">
      ${[["Foco no outro", fin(d.focusPct)?fmt(d.focusPct)+"%":"—"],["Suposições lúdicas",d.assume],["Plano concreto",d.plan],["Hesitações e desculpas",d.hedges+d.apology],["Perguntas",d.questions],["Índice social",d.score]].map(([a,b])=>`<div class="marker"><span>${a}</span><b>${b}</b></div>`).join("")}</div>
      <p class="sub">Foco no outro entre 35% e 75% equilibra partilha e atenção. Suposições lúdicas tiram a conversa do modo entrevista.</p>`; }
  return `<div class="transcript">${markTranscript(r.transcript, r.lang)}</div>
    <div class="legend"><span><i class="box" style="--k:var(--critical)"></i>Bengala</span><span><i class="box" style="--k:var(--warning)"></i>Linguagem fraca</span><span><i class="box" style="--k:var(--voz)"></i>Sentidos</span><span><i class="box" style="--k:var(--social)"></i>Viragem</span><span><i class="box" style="--k:var(--historia)"></i>Diálogo</span><span><i class="box" style="--k:var(--negocio)"></i>Suposição lúdica</span></div>
    <dl class="facts three"><div><dt>Palavras</dt><dd>${fmt(w.words)}</dd></div><div><dt>Palavras por minuto</dt><dd>${fmt(w.wpm)}</dd></div><div><dt>Bengalas por minuto</dt><dd>${fmt(w.fillerPerMin,1)}</dd></div></dl>
    <div class="grid-2"><div class="stack"><p class="h4">Bengalas</p>${tagList(w.fillers,"Nenhuma detetada.")}</div><div class="stack"><p class="h4">Linguagem que tira autoridade</p>${tagList(w.hedges,"Nenhuma detetada.")}</div></div>
    ${mk}
    <details class="disc"><summary>Corrigir a transcrição</summary><textarea id="retr-${scope}" rows="5">${h(r.transcript)}</textarea><button class="btn" data-act="retr" data-scope="${scope}" style="margin-top:10px">Atualizar a análise</button></details>`;
}
function coachPanel(r, scope){
  if(r.isExample) return `<p class="sub">Num relatório real, aqui recebes a leitura do coach: o que soa forte, o que corrigir, a tua resposta reescrita e um exercício para fazer a seguir.</p>`;
  if(claudeOn()){
    return `${r.claude?fbHTML(r.claude,"coach"):`<p class="sub">O Claude lê os teus números${r.transcript?" e a transcrição":""} e dá-te uma leitura de coach: o que soa forte, o que corrigir, a tua resposta reescrita e um exercício para a próxima tentativa.</p>`}
      <div id="${scope}-coach-out"></div>
      <button class="btn ${r.claude?"":"primary"} block" data-act="coach" data-scope="${scope}">${ic("sparkle")} ${r.claude?"Pedir outra leitura":"Pedir leitura ao Claude"}</button>
      <p class="msg" id="${scope}-coach-msg" hidden></p>`;
  }
  return `${r.claude?fbHTML(r.claude,"coach"):""}
    <p class="sub">Copia o relatório e cola-o numa conversa com o Claude. Recebes a leitura completa do coach: o que soa forte, o que corrigir, a tua resposta reescrita e um exercício.</p>
    <button class="btn primary block" data-act="copy-coach" data-scope="${scope}">${ic("copy")} Copiar relatório para o Claude</button>
    <p class="msg" id="${scope}-coach-msg" hidden></p>
    <textarea class="copybox" id="${scope}-copy" readonly hidden aria-label="Relatório para copiar"></textarea>`;
}
const NOTE_LABELS={ tom:"Tom", ritmo:"Ritmo", pausas:"Pausas", projecao:"Projeção", autoridade:"Autoridade", calor:"Calor", gancho:"Gancho", estrutura:"Estrutura", detalhe:"Detalhe", emocao:"Emoção", tensao:"Tensão", timing:"Timing", fecho:"Fecho", presenca:"Presença", foco_no_outro:"Foco no outro", brincadeira:"Brincadeira", ligacao:"Ligação", intencao:"Intenção", voz:"Voz", clareza:"Clareza", persuasao:"Persuasão" };
function fbHTML(d, kind){
  const list=(arr)=> Array.isArray(arr)&&arr.length ? `<ul class="blist">${arr.map(x=> typeof x==="object" && x ? `<li><div><b>${h(x.o_que||"")}</b><span>${h(x.como||"")}</span></div></li>` : `<li><span>${h(x)}</span></li>`).join("")}</ul>` : "";
  const sec=(t, body)=> body ? `<div><p class="h4">${t}</p>${body}</div>` : "";
  if(kind==="conv"){
    const inv=d.investimento||{};
    const bar=(l,v)=> fin(Number(v)) ? `<div class="prow" style="grid-template-columns:110px minmax(0,1fr) 40px"><span class="p-name">${l}</span><div class="gauge"><span class="zone" style="left:0;width:${clamp(Number(v),0,10)*10}%;background:var(--ink-2);box-shadow:none"></span></div><span class="p-val">${fmt(Number(v))}</span></div>` : "";
    return `<div class="fb"><p class="diag">${h(d.leitura||"")}</p>
      ${sec("Investimento aparente", bar("Tu", inv.tu)+bar("A outra pessoa", inv.outra_pessoa))}
      <div class="grid-2">${sec("Sinais positivos", list(d.sinais_positivos))}${sec("Sinais de atenção", list(d.sinais_atencao))}</div>
      ${sec("O que estás a fazer bem", list(d.bem))}${sec("A corrigir", list(d.corrigir))}
      ${d.proxima_mensagem?sec("Próxima mensagem", `<p class="rewrite">${h(d.proxima_mensagem)}</p>${d.porque?`<p class="sub" style="margin-top:8px">${h(d.porque)}</p>`:""}`):""}</div>`;
  }
  if(kind==="story"){
    return `<div class="fb"><p class="diag">${h(d.diagnostico||"")}</p>
      ${sec("Ganchos alternativos", list(d.ganchos))}
      ${Array.isArray(d.estrutura)&&d.estrutura.length?sec("Estrutura", `<ol class="steps">${d.estrutura.map(x=>`<li><span>${h(x)}</span></li>`).join("")}</ol>`):""}
      ${sec("Detalhes a acrescentar", list(d.detalhes))}
      ${d.reviravolta?sec("Reviravolta ou callback", `<p>${h(d.reviravolta)}</p>`):""}
      ${d.fecho?sec("Frase final", `<p class="rewrite">${h(d.fecho)}</p>`):""}
      ${d.versao_60s?sec("Versão de 60 segundos", `<p class="drill-box">${h(d.versao_60s)}</p>`):""}</div>`;
  }
  const notas = d.notas && typeof d.notas==="object" ? Object.entries(d.notas).filter(([k,v])=>v!=null && fin(Number(v))) : [];
  const scores = (fin(Number(d.nota_global))||notas.length) ? `<div class="scores">${fin(Number(d.nota_global))?`<div class="score"><span>Global</span><b>${fmt(Number(d.nota_global),1)}</b></div>`:""}${notas.map(([k,v])=>`<div class="score"><span>${h(NOTE_LABELS[k]||k)}</span><b>${fmt(Number(v))}</b></div>`).join("")}</div>` : "";
  return `<div class="fb"><p class="diag">${h(d.diagnostico||"")}</p>${scores}
    <div class="grid-2">${sec("O que já funciona", list(d.forte))}${sec("A corrigir na próxima", list(d.melhorar))}</div>
    ${d.reformulacao?sec("Como soaria mais forte", `<p class="rewrite">${h(d.reformulacao)}</p>`):""}
    ${d.versao_melhorada?sec("Versão melhorada", `<p class="rewrite">${h(d.versao_melhorada)}</p>`):""}
    ${sec("Alternativas", list(d.alternativas))}
    ${d.porque_funciona?`<p class="sub">${h(d.porque_funciona)}</p>`:""}
    ${d.exercicio?sec("Exercício para agora", `<p class="drill-box">${h(d.exercicio)}</p>`):""}</div>`;
}
function scopeRes(scope){ return scope==="sheet" ? SessionSheet.res : S.studio.result; }
function rerenderScope(scope){ if(scope==="sheet") SessionSheet.render(); else render(); }
async function askCoach(scope){
  const r=scopeRes(scope); if(!r) return;
  const btn=document.querySelector(`[data-act="coach"][data-scope="${scope}"]`), out=$("#"+scope+"-coach-out");
  if(btn) btn.disabled=true; if(out) out.innerHTML='<p class="thinking"><span class="spinner"></span>O coach está a ouvir os teus números…</p>';
  showMsg("#"+scope+"-coach-msg","",false);
  try{ const d=await askClaude(coachPrompt(r)); r.claude=d; await Store.updateSession(r.id,{ claude:d }); rerenderScope(scope); }
  catch(e){ if(out) out.innerHTML=""; if(btn) btn.disabled=false; showMsg("#"+scope+"-coach-msg", claudeErr(e), true); if(S.sampleDenied) rerenderScope(scope); }
}
async function retranscribe(scope){
  const r=scopeRes(scope), ta=$("#retr-"+scope); if(!r||!ta) return;
  const text=ta.value.trim();
  r.transcript=text; r.words=analyzeWords(text, r.lang, r.metrics.durationS);
  if(r.words) r.metrics.wpm=r.words.wpm; else delete r.metrics.wpm;
  r.index=voiceIndex(metricValues(r.metrics, r.lang));
  r.markers = r.track==="historia" ? storyMarkers(text, r.lang) : r.track==="social" ? socialMarkers(text, r.lang) : null;
  r.claude=null;
  await Store.updateSession(r.id, { transcript:r.transcript, words:r.words, metrics:r.metrics, index:r.index, markers:r.markers, claude:null });
  toast("Análise atualizada"); rerenderScope(scope);
}
const SessionSheet = {
  res:null, sub:"resumo",
  open(id){
    const s=S.sessions.find(x=>x.id===id); if(!s) return;
    if(s.kind==="fala"){ this.res=s; this.sub="resumo"; Sheet.open(s.title, `<div class="stack t-${s.track}">${reportHTML(s, this.sub, "sheet")}</div>`); }
    else Sheet.open(s.title, otherSessionHTML(s));
  },
  openExample(){ this.res=exampleResult(); this.sub="resumo"; Sheet.open("Relatório de exemplo", `<div class="stack t-${this.res.track}"><p class="banner">Exemplo: os números não são teus.</p>${reportHTML(this.res, this.sub, "sheet")}</div>`); },
  render(){ if(!this.res) return; Sheet.set(`<div class="stack t-${this.res.track}">${this.res.isExample?`<p class="banner">Exemplo: os números não são teus.</p>`:""}${reportHTML(this.res, this.sub, "sheet")}</div>`); }
};
function otherSessionHTML(s){
  const date=new Date(s.at).toLocaleString("pt-PT",{day:"numeric",month:"long",hour:"2-digit",minute:"2-digit"});
  let body="";
  if(s.kind==="drill"){ const e=s.eval;
    body = e && fin(e.value) ? `<div class="result-big"><span class="lbl">${h(e.headline)}</span><span class="rv">${fmt(e.value,1)}<small>${h(e.unit)}</small></span>${pill(e.verdict)}</div><ul class="result-lines">${(e.lines||[]).map(l=>`<li><span>${h(l)}</span></li>`).join("")}</ul>` : `<div class="result-big"><span class="rv">Feito</span><span class="sub">${fmt((s.durS||0)/60,1)} min de exercício</span></div>`;
    if(s.rating) body+=`<p class="sub">A tua avaliação: ${"★".repeat(s.rating)}${"☆".repeat(5-s.rating)}</p>`; }
  if(s.kind==="quiz") body=`<div class="result-big"><span class="rv">${s.score}<small>de ${s.total}</small></span><span class="sub">respostas certas</span></div>`;
  if(s.kind==="escrita") body=`<div class="transcript">${h(s.text||"")}</div>${s.claude?fbHTML(s.claude,"writing"):""}`;
  return `<div class="stack t-${s.track}"><div class="detail-band">${trackTag(s.track)}<span class="sub">${h(date)}</span></div>${body}
    <div class="sheet-actions"><button class="btn primary" data-act="open-ex" data-id="${h(s.challengeId)}">Repetir este exercício</button></div></div>`;
}

/* ---------- Prompts ---------- */
const PERSONA = "gestor de projetos e comercial de pedra natural de luxo (mármore, quartzito, granito; cozinhas, casas de banho, fachadas ventiladas, peças maciças), que fala com arquitetos, designers, construtores e clientes de alto poder aquisitivo em Portugal, França, Suíça, Reino Unido, EUA e Bahamas. Quer comunicar com presença, autoridade, calma, magnetismo e clareza, no trabalho e na vida social.";
const RUBRIC = {
  voz:{ desc:"qualidade vocal: tom, ritmo, pausas, projeção, autoridade e calor", keys:["tom","ritmo","pausas","projecao","autoridade","calor"] },
  historia:{ desc:"storytelling: gancho, estrutura, detalhe sensorial, emoção mostrada, tensão, timing e fecho, além da entrega vocal", keys:["gancho","estrutura","detalhe","emocao","tensao","timing","fecho"] },
  social:{ desc:"comunicação social e de sedução: presença e calma, foco no outro, brincadeira, ligação emocional, clareza de intenção e voz", keys:["presenca","foco_no_outro","brincadeira","ligacao","intencao","voz"] },
  negocio:{ desc:"comunicação comercial: clareza, autoridade, estrutura, persuasão e voz", keys:["clareza","autoridade","estrutura","persuasao","voz"] }
};
const CONTENT_KEYS = new Set(["gancho","estrutura","detalhe","emocao","tensao","fecho","foco_no_outro","brincadeira","ligacao","intencao","clareza","persuasao"]);
const ETHICS = "Em contexto de sedução, valoriza autenticidade, leitura de sinais e respeito pelo ritmo e pelo “não” da outra pessoa. Nunca sugiras manipulação, pressão, insistência ou técnicas para contornar a vontade de alguém.";
function sessionFacts(r){
  const ex=getEx(r.challengeId), m=r.metrics||{}, v=metricValues(m, r.lang);
  const line=k=>{ const d=DEF[k]; return `- ${d.name}: ${fmt(v[k],d.dec)} ${d.unit} (zona boa ${d.lo}–${d.hi}) → ${d.verdict(v[k])[0]}`; };
  const brief = r.brief || (ex && ex.brief) || "Treino livre.";
  let out = `DESAFIO: ${r.title} — ${brief}\n${ex&&ex.target?`TEXTO PARA LER: ${ex.target}\n`:""}${ex&&ex.tip?`DICA DADA: ${ex.tip}\n`:""}NÍVEL: ${r.level||1}. ${LEVEL_NOTE[r.level||1]||""}\nLÍNGUA: ${LANGS[r.lang]||r.lang}\nDURAÇÃO: ${fmt(m.durationS)} s${r.target?` (alvo ${r.target} s)`:""}\n\nMÉTRICAS ACÚSTICAS:\n`;
  out += [line("tom"), line("ritmo")+(fin(m.wpm)?" [da transcrição]":" [estimado por sílabas]"), line("pausas"), line("finais"), line("dinamica"), line("hesitacoes"),
    `- Fins a subir: ${fmt(m.upPct)}% · fins engolidos: ${fmt(m.swallowedPct)}% · alcance de tom: ${fmt(m.pitchRange,1)} st · tom médio ${fmt(m.medianHz)} Hz · pausa mais longa ${fmt(m.longestPause,1)} s · maior pausa no último quarto ${fmt(m.latePause,1)} s`,
    `- Índice de voz: ${r.index ?? voiceIndex(v)}/100`].join("\n");
  if(r.transcript){
    const w=r.words||analyzeWords(r.transcript, r.lang, m.durationS);
    out += `\n\nTRANSCRIÇÃO (pode ter erros de reconhecimento):\n"""${r.transcript.slice(0,6000)}"""\nBengalas: ${w&&w.fillers&&w.fillers.length?pairs(w.fillers).map(x=>x[0]+"×"+x[1]).join(", "):"nenhuma"}. Linguagem hesitante: ${w&&w.hedges&&w.hedges.length?pairs(w.hedges).map(x=>x[0]+"×"+x[1]).join(", "):"nenhuma"}.`;
    const cm=contentMarkers(r);
    if(cm && cm.kind==="historia") out+=`\nMarcadores de história: ${cm.d.sensory} detalhes sensoriais, ${cm.d.turns} viragens, ${cm.d.dialogue} marcas de diálogo, ${cm.d.numbers+cm.d.time} referências concretas, ${cm.d.emotions} emoções nomeadas.`;
    if(cm && cm.kind==="social") out+=`\nMarcadores de conversa: foco no outro ${fin(cm.d.focusPct)?fmt(cm.d.focusPct)+"%":"—"}, ${cm.d.assume} suposições lúdicas, ${cm.d.plan} palavras de plano concreto, ${cm.d.hedges+cm.d.apology} hesitações e desculpas.`;
  } else out += "\n\nSEM TRANSCRIÇÃO: não avalies conteúdo; as notas de conteúdo e a reformulação ficam a null.";
  return out;
}
function coachPrompt(r){
  const R=RUBRIC[r.track]||RUBRIC.voz;
  return `És um coach de comunicação de classe mundial, exigente e direto. Avalias uma gravação de treino ${quem("do")}, ${PERSONA}
Área: ${TRACKS[r.track].name}. Avalia sobretudo ${R.desc}.
Escreve em português de Portugal, trata-o por tu, sem floreados nem elogios vazios. Baseia-te só nos dados abaixo. As métricas acústicas são estimativas automáticas (tom por YIN, sílabas por picos de energia, hesitações por segmentos sonoros longos e planos): se algum número parecer artefacto, diz isso.${r.track==="social"?" "+ETHICS:""}

${sessionFacts(r)}

Responde só com JSON neste formato:
{"nota_global": número de 0 a 10 com uma casa decimal,
 "notas": {${R.keys.map(k=>`"${k}": 0-10${CONTENT_KEYS.has(k)?" ou null sem transcrição":""}`).join(", ")}},
 "diagnostico": "2 a 3 frases sobre como ele soou para quem ouve, ligando os números ao efeito na outra pessoa",
 "forte": ["ponto forte concreto", "outro"],
 "melhorar": [{"o_que": "o problema em poucas palavras", "como": "instrução concreta para a próxima tentativa"}],
 "reformulacao": "a resposta reescrita como ele a devia dizer, curta e falável, ou null",
 "exercicio": "um exercício de 2 minutos para fazer já a seguir, com instrução exata"}
"melhorar" tem 2 ou 3 itens, do mais importante para o menos.`;
}
function chatCoachPrompt(r){
  const R=RUBRIC[r.track]||RUBRIC.voz;
  return `Sessão de treino · Estúdio Veio · ${TRACKS[r.track].name}\n\n${sessionFacts(r)}\n\nFaz-me a leitura como meu coach de ${R.desc}: o que já soa forte, as 2 ou 3 correções que mais mudam a forma como me ouvem (com instrução concreta), ${r.transcript?"a minha resposta reescrita como a devia dizer, ":""}e um exercício de 2 minutos para a próxima tentativa.${r.track==="social"?" "+ETHICS:""}`;
}
const WRITE_RUBRIC = {
  mensagem:"mensagens em contexto social e de sedução: naturalidade, leveza, curiosidade, referência partilhada, clareza de intenção e vontade de responder",
  historia:"estrutura narrativa: gancho, contexto, conflito, ponto de viragem, fecho e potencial para ser contada em voz alta",
  negocio:"email comercial: assunto, clareza, valor acrescentado, tom confiante sem pressão e pedido concreto"
};
function writingPrompt(ex, text, chat){
  const base=`És um coach de comunicação de classe mundial, exigente e direto. Avalia este texto escrito ${quem("pelo")}, ${PERSONA}
Exercício: ${ex.title} — ${ex.brief}
Avalia sobretudo ${WRITE_RUBRIC[ex.rubric]||WRITE_RUBRIC.historia}. Escreve em português de Portugal, trata-o por tu, sem elogios vazios.${ex.track==="social"?" "+ETHICS:""}

TEXTO:
"""${text.slice(0,6000)}"""
`;
  if(chat) return base+"\nDá-me: uma nota de 0 a 10, o que funciona, o que corrigir (com instrução concreta), uma versão melhorada e duas alternativas curtas.";
  return base+`\nResponde só com JSON: {"nota_global": 0-10 com uma casa decimal, "diagnostico": "2 frases", "forte": ["…"], "melhorar": [{"o_que":"…","como":"…"}], "versao_melhorada": "o texto reescrito", "alternativas": ["versão alternativa curta", "outra"], "porque_funciona": "1 frase"}`;
}
const CONV_CTX = { seducao:"uma conversa por mensagem com alguém por quem ele tem interesse romântico", social:"uma conversa social", cliente:"uma conversa com um cliente ou parceiro de negócio" };
function convPrompt(text, ctx, chat){
  const base=`És um especialista em comunicação e dinâmica social. Analisa ${CONV_CTX[ctx]||CONV_CTX.social}, ${quem("do")}, ${PERSONA} As mensagens dele começam por “Eu:”. Escreve em português de Portugal, trata-o por tu, com honestidade.${ctx==="seducao"?" "+ETHICS+" Se os sinais mostrarem pouco interesse, diz isso com clareza e sugere dar espaço.":""}

CONVERSA:
"""${text.slice(0,12000)}"""
`;
  if(chat) return base+"\nDiz-me: a leitura geral, quanto está cada lado a investir (0 a 10), os sinais positivos e de atenção, o que estou a fazer bem, o que corrigir, e a próxima mensagem que eu devia enviar e porquê.";
  return base+`\nResponde só com JSON: {"leitura":"2 a 3 frases","investimento":{"tu":0-10,"outra_pessoa":0-10},"sinais_positivos":["…"],"sinais_atencao":["…"],"bem":["…"],"corrigir":[{"o_que":"…","como":"…"}],"proxima_mensagem":"a mensagem exata a enviar, ou null se for melhor dar espaço","porque":"1 frase"}`;
}
function storyPrompt(st, chat){
  const base=`És um mestre de storytelling, exigente e direto. Esta é uma história real ${quem("do")}, ${PERSONA} Ele quer contá-la ${st.tags&&st.tags.length?"em contexto de "+st.tags.join(", "):"em vários contextos"}.
TÍTULO: ${st.title}
GANCHO: ${st.hook||"—"}
CONTEXTO: ${st.context||"—"}
CONFLITO: ${st.conflict||"—"}
VIRAGEM: ${st.turn||"—"}
FECHO: ${st.ending||"—"}
NOTAS: ${st.notes||"—"}
Escreve em português de Portugal, trata-o por tu.
`;
  if(chat) return base+"\nDá-me: o diagnóstico, três ganchos alternativos, a estrutura ideal em passos, detalhes sensoriais a acrescentar, uma ideia de reviravolta ou callback, a frase final mais forte, e a versão para contar em 60 segundos.";
  return base+`\nResponde só com JSON: {"diagnostico":"2 a 3 frases","ganchos":["…","…","…"],"estrutura":["passo 1","passo 2","…"],"detalhes":["…"],"reviravolta":"ideia de reviravolta ou callback","fecho":"a frase final","versao_60s":"a história pronta a contar em 60 segundos"}`;
}

/* ===================== PROGRESSO ===================== */
function exampleSessions(){
  const rnd=seeded(42), now=Date.now(), out=[];
  const ids=["aquecimento","pitch-genebra","gancho","abertura-situacional","obj-preco","espinha","convite","quiz-sinais","fechar-descer","mostrar","provocacao","ma-noticia","sirenes","reviravolta","voz-jantar","fecho","escada-projecao","paixao"];
  ids.forEach((id,i)=>{ const ex=EX_BY_ID[id], k=i/ids.length, at=now-(26-Math.round(i*1.45))*DAY-Math.round(rnd()*6)*3600000;
    const s={ id:"ex"+i, at, kind:ex.kind, track:ex.track, challengeId:id, title:ex.title, isExample:true, lang:"pt" };
    if(ex.kind==="fala"){ s.metrics={ pitchSD:1.9+1.6*k+rnd()*.5, wpm:178-28*k+rnd()*8, pausesPerMin:6+7*k+rnd()*2, downPct:38+28*k+rnd()*8, dynamicDb:5+4*k+rnd()*2, hesPerMin:3.6-2.4*k+rnd()*.6, durationS:(ex.seconds||45)*(0.8+rnd()*.4), sylRate:4.6 }; s.index=voiceIndex(metricValues(s.metrics,"pt")); }
    if(ex.kind==="drill"){ s.durS=150; s.rating=3+Math.round(rnd()*2); s.eval={ verdict:["Feito","good"] }; }
    if(ex.kind==="quiz"){ s.total=ex.questions.length; s.score=Math.min(s.total, 3+Math.round(rnd()*3)); }
    s.xp=xpOf(s); out.push(s); });
  return out.sort((a,b)=>b.at-a.at);
}
function lineChart(id, pts, o){
  const n=pts.length; if(n<2) return `<p class="sub">Precisas de pelo menos duas sessões para ver a evolução.</p>`;
  const yMin=o.yMin, yMax=o.yMax, Yp=v=>(1-(clamp(v,yMin,yMax)-yMin)/(yMax-yMin))*100;
  const xs=pts.map((p,i)=>i/(n-1)), ys=pts.map(p=>Yp(p.v));
  CHARTS[id]={ type:"line", pts: pts.map((p,i)=>({ x:xs[i], y:ys[i]/100, v:p.v, label:p.label, tip:p.tip })), fmt:o.fmt };
  const d=xs.map((x,i)=>`${i?"L":"M"}${(x*100).toFixed(2)} ${ys[i].toFixed(2)}`).join(" ");
  const area=d+` L100 100 L0 100 Z`;
  const band=o.band?`<i class="cband" style="top:${Yp(o.band[1])}%;height:${Yp(o.band[0])-Yp(o.band[1])}%"></i>`:"";
  const ticks=o.ticks||[];
  return `<div class="chart" data-chart="${id}" style="--h:${o.h||170}px;--series:${o.color||"var(--ink)"}">
    <div class="yaxis">${ticks.map(t=>`<span style="top:${Yp(t)}%">${o.tickFmt?o.tickFmt(t):t}</span>`).join("")}</div>
    <div class="plot" tabindex="0" aria-label="${h(o.aria||"Gráfico")}. Usa as setas para percorrer os pontos.">
      ${band}${ticks.map(t=>`<i class="grid-line ${t===yMin?"base":""}" style="top:${Yp(t)}%"></i>`).join("")}
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path class="c-area" d="${area}"/><path class="c-line" d="${d}"/></svg>
      <span class="c-dot" style="left:100%;top:${ys[n-1]}%"></span>${o.endLabel?`<span class="c-end" style="top:${ys[n-1]}%">${h(o.fmt(pts[n-1].v))}</span>`:""}
      <i class="cross" hidden></i><div class="ctip" hidden></div>
    </div>
    ${o.noX?"":`<div class="xaxis"><span>${h(pts[0].label)}</span><span>${h(pts[n-1].label)}</span></div>`}
  </div>`;
}
function viewProgresso(){
  const real=S.sessions.length>0, all=real?S.sessions:exampleSessions(), now=Date.now();
  const days=S.prog.range==="7"?7:S.prog.range==="30"?30:3650, from=startOfDay(now)-(days-1)*DAY, prevFrom=from-days*DAY;
  const inR=all.filter(s=>s.at>=from), prev=all.filter(s=>s.at>=prevFrom && s.at<from);
  const fala=inR.filter(s=>s.kind==="fala" && s.metrics).sort((a,b)=>a.at-b.at), falaPrev=prev.filter(s=>s.kind==="fala" && s.metrics);
  const st=streakInfo(all, now), mins=inR.reduce((a,s)=>a+speakingMin(s),0), minsPrev=prev.reduce((a,s)=>a+speakingMin(s),0);
  const avgIdx=fala.length?mean(fala.map(s=>s.index||0)):NaN, avgPrev=falaPrev.length?mean(falaPrev.map(s=>s.index||0)):NaN;
  const delta=(a,b,unit,dec)=>{ if(days>365||!fin(a)||!fin(b)) return `<span class="k-delta">—</span>`; const p=Math.pow(10,dec||0), d=Math.round(a*p)/p-Math.round(b*p)/p; if(Math.abs(d)<1/p/2) return `<span class="k-delta">igual ao período anterior</span>`; return `<span class="k-delta ${d>0?"up":"down"}">${d>0?"▲":"▼"} ${fmt(Math.abs(d),dec||0)}${unit||""} vs período anterior</span>`; };
  const dLabel=ts=>new Date(ts).toLocaleDateString("pt-PT",{day:"numeric",month:"short"});
  const idxPts=fala.map(s=>({ v:s.index||0, label:dLabel(s.at), tip:s.title }));
  const ranges=[["7","7 dias"],["30","30 dias"],["all","Tudo"]];
  const profile=METRIC_KEYS.map(k=>{ const d=DEF[k], cur=fala.map(s=>metricValues(s.metrics,s.lang)[k]).filter(fin), pv=falaPrev.map(s=>metricValues(s.metrics,s.lang)[k]).filter(fin);
    const v=cur.length?mean(cur):NaN, pvv=pv.length?mean(pv):NaN, sc=subScore(k,v), scp=subScore(k,pvv);
    const tr = sc==null||scp==null||days>365 ? ["flat","—"] : sc-scp>3 ? ["up","▲ a melhorar"] : scp-sc>3 ? ["down","▼ a piorar"] : ["flat","estável"];
    const pos=fin(v)?clamp(100*(v-d.min)/(d.max-d.min),0,100):null, ppos=fin(pvv)?clamp(100*(pvv-d.min)/(d.max-d.min),0,100):null, zl=100*(d.lo-d.min)/(d.max-d.min), zr=100*(d.hi-d.min)/(d.max-d.min);
    return `<div class="prow"><span class="p-name">${h(d.name)}</span><div class="gauge-wrap"><div class="gauge"><span class="zone" style="left:${zl}%;width:${zr-zl}%"></span>${ppos!=null?`<span class="mark prev" style="left:${ppos}%" data-tip="Período anterior: ${fmt(pvv,d.dec)} ${d.unit}"></span>`:""}${pos!=null?`<span class="mark" style="left:${pos}%" data-tip="Média: ${fmt(v,d.dec)} ${d.unit}"></span>`:""}</div></div><span class="p-val">${fmt(v,d.dec)} ${d.unit}<small class="trend ${tr[0]}">${tr[1]}</small></span></div>`; }).join("");
  const mults=METRIC_KEYS.map(k=>{ const d=DEF[k], pts=fala.map(s=>({ v:metricValues(s.metrics,s.lang)[k], label:dLabel(s.at), tip:s.title })).filter(p=>fin(p.v)); const last=pts.length?pts[pts.length-1].v:NaN;
    return `<div class="mult"><div class="m-top"><span class="m-name">${h(d.name)}</span><span class="m-val">${fmt(last,d.dec)}<small>${d.unit}</small></span></div>${pts.length>=2?lineChart("m-"+k, pts, { yMin:d.min, yMax:d.max, band:[d.lo,d.hi], h:64, fmt:v=>fmt(v,d.dec)+" "+d.unit, noX:true, aria:d.name+" ao longo das sessões" }):`<p class="sub">Sem dados suficientes.</p>`}</div>`; }).join("");
  const xp=trackXP(all);
  const areaRows=TRACK_ORDER.map(t=>{ const lv=levelOf(xp[t]), n=inR.filter(s=>s.track===t).length; return `<div class="area-row t-${t}" style="cursor:default"><span class="ex-ic">${ic(TRACK_ICON[t])}</span><span><span class="a-name">${h(TRACKS[t].name)}</span><span class="a-meta"> · ${h(lv.name)} · ${xp[t]} XP</span><span class="xpbar"><i style="width:${(lv.pct*100).toFixed(0)}%"></i></span></span><span class="a-meta">${n} ${n===1?"sessão":"sessões"}</span></div>`; }).join("");
  const hf=S.prog.track, histAll=inR.filter(s=>hf==="todos"||s.track===hf), hist=S.prog.more?histAll:histAll.slice(0,14);
  let lastDay="", histHTML="";
  hist.forEach(s=>{ const k=dayKey(s.at); if(k!==lastDay){ histHTML+=`<li class="hday">${h(new Date(s.at).toLocaleDateString("pt-PT",{weekday:"long",day:"numeric",month:"long"}))}</li>`; lastDay=k; }
    histHTML+=`<li><button class="hrow t-${s.track}" ${s.isExample?"disabled":`data-act="open-session" data-id="${h(s.id)}"`}><span class="ex-ic">${ic(KIND_ICON[s.kind]||"mic")}</span><span class="ex-txt"><span class="ex-title">${h(s.title)}</span><span class="ex-meta">${h(TRACKS[s.track].short)} · ${KINDS[s.kind]?KINDS[s.kind].name:""} · ${h(new Date(s.at).toLocaleTimeString("pt-PT",{hour:"2-digit",minute:"2-digit"}))}</span></span><span class="h-val">${h(sessionScoreLabel(s))}<small>+${s.xp||xpOf(s)} XP</small></span></button></li>`; });
  const table = idxPts.length ? `<details class="chart-table"><summary>Ver como tabela</summary><div class="wrap-x"><table><thead><tr><th>Data</th><th>Desafio</th><th class="num">Índice</th></tr></thead><tbody>${fala.slice().reverse().map(s=>`<tr><td>${h(dLabel(s.at))}</td><td>${h(s.title)}</td><td class="num">${s.index??"—"}</td></tr>`).join("")}</tbody></table></div></details>` : "";
  return `
  <header class="page-head"><div><p class="eyebrow">${real?`${all.length} sessões no total`:"Pré-visualização"}</p><h1>Progresso</h1></div><button class="icon-btn" data-act="settings" aria-label="Definições">${ic("sliders")}</button></header>
  ${real?"":`<p class="banner">Exemplo: assim fica o teu progresso. Os teus números substituem estes depois da primeira sessão.</p>`}
  <div class="row"><div class="seg" role="group" aria-label="Período">${ranges.map(([v,l])=>`<button aria-pressed="${S.prog.range===v}" data-act="prog-range" data-v="${v}">${l}</button>`).join("")}</div></div>
  <div class="kpis">
    <div class="kpi"><span class="k-label">Sessões</span><span class="k-val">${inR.length}</span>${delta(inR.length, prev.length)}</div>
    <div class="kpi"><span class="k-label">Minutos a falar</span><span class="k-val">${fmtMin(mins)}<small>min</small></span>${delta(mins, minsPrev, " min", mins<10?1:0)}</div>
    <div class="kpi"><span class="k-label">Sequência</span><span class="k-val">${st.current}<small>${st.current===1?"dia":"dias"}</small></span><span class="k-delta">melhor: ${st.best} ${st.best===1?"dia":"dias"}</span></div>
    <div class="kpi"><span class="k-label">Índice de voz médio</span><span class="k-val">${fmt(avgIdx)}</span>${delta(avgIdx, avgPrev)}</div>
  </div>
  <section class="card"><div class="card-head"><div><h2>Índice de voz por sessão</h2><p class="sub">Zona verde a partir de 70: voz sólida.</p></div></div>
    ${lineChart("idx", idxPts, { yMin:0, yMax:100, ticks:[0,50,70,100], band:[70,100], fmt:v=>"Índice "+fmt(v), endLabel:true, aria:"Índice de voz por sessão" })}${table}</section>
  <section class="card"><h2>Perfil de voz</h2><p class="sub">Média do período (marca escura) face ao período anterior (marca clara) e à zona boa.</p><div class="profile">${profile}</div></section>
  <section class="card"><h2>Cada métrica, sessão a sessão</h2>${fala.length>=2?`<div class="multiples">${mults}</div>`:`<p class="sub">Aparece a partir da segunda sessão falada neste período.</p>`}</section>
  <section class="card"><div class="card-head"><div><h2>Atividade</h2><p class="sub">Últimas 12 semanas</p></div></div>${heatmap(all, now)}</section>
  <section class="card"><h2>Áreas</h2><div class="areas">${areaRows}</div></section>
  <section class="card"><div class="card-head"><h2>Histórico</h2></div>
    <div class="chip-row" role="group" aria-label="Filtrar histórico">${[["todos","Todas"],...TRACK_ORDER.map(t=>[t,TRACKS[t].short])].map(([v,l])=>`<button class="fchip sm" aria-pressed="${hf===v}" data-act="prog-track" data-v="${v}">${TRACKS[v]?`<span class="tdot t-${v}"></span>`:""}${h(l)}</button>`).join("")}</div>
    ${histHTML?`<ul class="hist">${histHTML}</ul>`:`<p class="empty">Sem sessões neste período.</p>`}
    ${histAll.length>14&&!S.prog.more?`<button class="btn sm" data-act="prog-more">Mostrar mais ${histAll.length-14}</button>`:""}</section>`;
}
function heatmap(all, now){
  const counts={}; all.forEach(s=>{ const k=dayKey(s.at); counts[k]=(counts[k]||0)+1; });
  const start=weekStart(now)-11*7*DAY, today=dayKey(now); let cells="";
  for(let w=0; w<12; w++) for(let d=0; d<7; d++){
    const ts=start+(w*7+d)*DAY, k=dayKey(ts), n=counts[k]||0, fut=ts>now, lvl=n===0?0:n===1?1:n===2?2:n<=4?3:4;
    const lab=new Date(ts).toLocaleDateString("pt-PT",{day:"numeric",month:"short"});
    cells+= fut ? `<span class="hm future"></span>` : `<span class="hm l${lvl} ${k===today?"today":""}" data-tip="${h(lab)} · ${n} ${n===1?"sessão":"sessões"}" ${n?'tabindex="0"':""} aria-label="${h(lab)}: ${n} sessões"></span>`;
  }
  return `<div class="heat"><div class="heat-days"><span>Seg</span><span></span><span>Qua</span><span></span><span>Sex</span><span></span><span>Dom</span></div><div class="heat-grid">${cells}</div></div>
    <div class="heat-legend">Menos <span class="hm"></span><span class="hm l1"></span><span class="hm l2"></span><span class="hm l3"></span><span class="hm l4"></span> Mais</div>`;
}

/* ===================== FERRAMENTAS ===================== */
function viewFerramentas(){
  const seg=S.toolSeg, segs=[["voz","Voz"],["historia","Histórias"],["social","Social"]];
  let body="";
  if(seg==="voz"){
    const tools=[["warmup","dumbbell","Aquecimento de 5 minutos","Seis passos guiados antes de uma chamada ou reunião.",true],["tuner","tuner","Afinador de voz","Vê a nota e o tom da tua voz em tempo real.",MIC_OK],["meter","meter","Medidor de projeção","Mede o volume face ao ruído, de íntimo a palco.",MIC_OK],["metro","metro","Metrónomo de ritmo","Treina o ritmo certo: uma palavra por batida.",true]];
    body=`<div class="tool-grid t-voz">${tools.map(([k,i,t,d,ok])=>`<button class="tool-card" data-act="tool" data-tool="${k}"><span class="ex-ic">${ic(i)}</span><h3>${t}</h3><p>${d}</p>${ok?"":`<span class="soon">Precisa da versão com microfone</span>`}</button>`).join("")}</div>
      <section class="card t-voz"><h2>Guia rápido de voz</h2><div class="principles">${VOICE_GUIDE.map(p=>`<div class="princ"><h3>${h(p.t)}</h3><p>${h(p.d)}</p></div>`).join("")}</div></section>`;
  } else if(seg==="historia"){
    if(!S.gen) S.gen=rollAll();
    body=`<section class="card t-historia"><div class="card-head"><div><h2>Gerador de histórias</h2><p class="sub">Cinco ingredientes ao acaso. Conta a história em 90 segundos.</p></div><button class="btn sm" data-act="gen-all">${ic("shuffle")} Sortear</button></div>
      <div class="gen">${Object.keys(GEN).map(k=>`<div class="gen-row"><span class="lbl">${GEN_LABELS[k]}</span><b>${h(GEN[k][S.gen[k]])}</b><button class="icon-btn" data-act="gen-roll" data-k="${k}" aria-label="Sortear ${GEN_LABELS[k].toLowerCase()}">${ic("shuffle")}</button></div>`).join("")}</div>
      <div class="row"><button class="btn primary" data-act="gen-tell">${ic("mic")} Contar esta história</button><button class="btn" data-act="gen-save">${ic("plus")} Guardar como ideia</button></div></section>
      <section class="card t-historia"><div class="card-head"><div><h2>Banco de histórias</h2><p class="sub">As tuas histórias reais, prontas a contar num cliente, num jantar ou num encontro.</p></div><button class="btn sm" data-act="story-new">${ic("plus")} Nova</button></div>
      ${S.stories.length?`<div class="stack">${S.stories.map(st=>`<button class="story-card" data-act="story-open" data-id="${h(st.id)}"><b>${h(st.title)}</b><p>${h(st.hook||st.context||"Sem gancho ainda.")}</p>${st.tags&&st.tags.length?`<div class="tags">${st.tags.map(t=>`<span class="wtag">${h(t)}</span>`).join("")}</div>`:""}</button>`).join("")}</div>`:`<p class="empty">Ainda não guardaste histórias. Começa pela tua história de origem: como chegaste à pedra natural.</p>`}</section>
      <section class="card t-historia"><h2>Estruturas</h2><div class="frameworks">${STORY_FRAMEWORKS.map(f=>`<details><summary>${h(f.name)} <small>${h(f.use)}</small></summary><ol>${f.beats.map(b=>`<li>${h(b)}</li>`).join("")}</ol></details>`).join("")}</div></section>
      <section class="card t-historia"><h2>Ingredientes de uma história de classe mundial</h2><ul class="checklist">${STORY_INGREDIENTS.map(x=>`<li>${ic("check")}<span>${h(x)}</span></li>`).join("")}</ul></section>
      <section class="card t-historia"><h2>Vocabulário emocional</h2><p class="sub">Troca “fiquei contente” por uma palavra exata. Ou, melhor ainda, mostra a emoção.</p><div class="emo">${EMOTIONS.map(e=>`<div class="emo-row"><b>${h(e.g)}</b><div class="tags">${e.w.map(w=>`<span class="wtag">${h(w)}</span>`).join("")}</div></div>`).join("")}</div></section>`;
  } else {
    const qs=[]; for(let i=0;i<5;i++) qs.push(DEEP_QUESTIONS[(S.qOffset+i)%DEEP_QUESTIONS.length]);
    body=`<div class="tool-grid t-social"><button class="tool-card" data-act="tool" data-tool="conv"><span class="ex-ic">${ic("chat")}</span><h3>Analisar uma conversa</h3><p>Cola uma conversa por mensagem e recebe a leitura de investimento, sinais e a próxima mensagem.</p></button>
      <button class="tool-card" data-act="open-ex" data-id="quiz-sinais"><span class="ex-ic">${ic("eye")}</span><h3>Ler sinais</h3><p>Seis situações reais para treinar calibração: quando avançar, quando dar espaço.</p></button></div>
      <section class="card t-social"><h2>Princípios</h2><div class="principles">${SOCIAL_PRINCIPLES.map(p=>`<div class="princ"><h3>${h(p.t)}</h3><p>${h(p.d)}</p><em>${h(p.ex)}</em></div>`).join("")}</div></section>
      <section class="card t-social"><div class="card-head"><div><h2>Perguntas que abrem pessoas</h2><p class="sub">Para levar uma conversa da superfície à profundidade. Partilha também a tua resposta.</p></div><button class="btn sm" data-act="q-shuffle">${ic("shuffle")} Outras</button></div>
      <ul class="qlist">${qs.map(q=>`<li><span>${h(q)}</span><button class="icon-btn" data-act="q-copy" data-q="${h(q)}" aria-label="Copiar pergunta">${ic("copy")}</button></li>`).join("")}</ul></section>`;
  }
  return `<header class="page-head"><div><p class="eyebrow">Kit de apoio</p><h1>Ferramentas</h1></div><button class="icon-btn" data-act="settings" aria-label="Definições">${ic("sliders")}</button></header>
  <div class="seg wide" role="tablist">${segs.map(([v,l])=>`<button role="tab" aria-pressed="${seg===v}" aria-selected="${seg===v}" data-act="tool-seg" data-v="${v}">${l}</button>`).join("")}</div>
  ${body}`;
}
function rollAll(){ const o={}; Object.keys(GEN).forEach(k=>o[k]=Math.floor(Math.random()*GEN[k].length)); return o; }
function genStoryEx(){ const g=S.gen; return { id:"gen-story", track:"historia", kind:"fala", skill:"Improviso", title:"História sorteada", level:2, seconds:90, focus:"tom",
  brief:`Conta uma história com ${GEN.personagem[g.personagem]}, em ${GEN.lugar[g.lugar]}, que ${GEN.desejo[g.desejo]}. Obstáculo: ${GEN.obstaculo[g.obstaculo]}. Reviravolta: ${GEN.reviravolta[g.reviravolta]}.`,
  tip:"Decide o final antes de começares. Planta a pista da reviravolta logo no início.", why:"Improvisar com ingredientes impostos treina a criatividade sob pressão." }; }

const Tools = {
  name:null, raf:0, running:false, peak:0, timer:null, actx:null, beatOn:false, ppm:130, sound:true,
  open(name){
    if(name==="warmup") return openEx("aquecimento");
    if(name==="conv") return Conv.open();
    this.name=name;
    const titles={ tuner:"Afinador de voz", meter:"Medidor de projeção", metro:"Metrónomo de ritmo" };
    Sheet.open(titles[name], this.html(), { onClose:()=>this.stop() });
  },
  html(){
    const n=this.name, noMic = (n==="tuner"||n==="meter") && !MIC_OK;
    if(noMic) return `<div class="stack t-voz"><p class="note">${ic("info")} Esta ferramenta precisa de microfone ao vivo. ${IN_VIEWER?"Dentro do Claude as páginas não lhe acedem: usa a versão com microfone no browser."+micLink():"Este browser não deu acesso ao microfone."}</p></div>`;
    if(n==="tuner") return `<div class="stack t-voz"><div class="tuner-face"><div class="tuner-note" id="tn-note">—</div><div class="tuner-hz" id="tn-hz">— Hz</div><div class="cents"><i class="zero"></i><i class="cmark" id="tn-cents"></i></div><p class="sub" id="tn-rel">Diz um “mmm” longo ou faz uma sirene.</p></div>
      <canvas class="live" id="tool-live"></canvas><button class="btn primary block" data-act="tool-toggle" id="tool-btn">${ic("mic")} Começar</button><p class="msg" id="tool-msg" hidden></p>
      <p class="sub">Usa-o com as sirenes e com o “mmm”: vês onde a tua voz assenta, quanto sobes quando projetas e se a frase acaba a descer.</p></div>`;
    if(n==="meter") return `<div class="stack t-voz"><div class="meter-face"><div class="meter-val" id="mt-val">—</div><div class="sub">dB acima do ruído de fundo</div></div>
      <div><div class="zone-bar"><i class="zfill" id="mt-fill" style="width:0"></i>${[15,25,35].map(v=>`<i class="zsep" style="left:${(v/45*100).toFixed(1)}%"></i>`).join("")}<i class="zpeak" id="mt-peak" style="left:0"></i></div><div class="zone-labels"><span>Íntimo</span><span>Conversa</span><span>Reunião</span><span>Palco</span></div></div>
      <p class="sub" id="mt-zone">Fala normalmente e vê em que zona estás. Depois projeta para o fundo da sala.</p>
      <button class="btn primary block" data-act="tool-toggle" id="tool-btn">${ic("mic")} Começar</button><p class="msg" id="tool-msg" hidden></p>
      <p class="sub">Valores aproximados: dependem do microfone e da distância. Compara-te contigo, sempre à mesma distância.</p></div>`;
    return `<div class="stack t-voz"><div class="seg wide" role="group" aria-label="Palavras por minuto">${[110,130,150,170].map(v=>`<button aria-pressed="${this.ppm===v}" data-act="metro-ppm" data-v="${v}">${v} ppm</button>`).join("")}</div>
      <div class="metro"><div class="pulse" id="pulse"></div><p class="sub">Uma palavra por batida. ${this.ppm<=120?"Ritmo de má notícia: lento e com peso.":this.ppm<=150?"Ritmo de conversa segura.":"Ritmo de entusiasmo: não passes daqui."}</p></div>
      <p class="readtext">Escolhemos este bloco entre duzentos. Não pelo preço, pelo veio. Esta pedra tem trezentos milhões de anos e vai durar mais do que todos nós. Quando a tocares, vais perceber porque é que não existe outra igual.</p>
      <label class="switch"><input type="checkbox" id="metro-sound" ${this.sound?"checked":""}><span>Som de batida</span></label>
      <button class="btn primary block" data-act="tool-toggle" id="tool-btn">${ic("play")} Começar</button></div>`;
  },
  async toggle(){ this.running ? this.stop(true) : this.start(); },
  async start(){
    const btn=$("#tool-btn");
    if(this.name==="metro"){
      this.running=true; Wake.hold("metro"); if(btn) btn.innerHTML=`${ic("pause")} Parar`;
      try{ if(!this.actx){ const AC=window.AudioContext||window.webkitAudioContext; this.actx=new AC(); } this.actx.resume(); }catch(e){ this.actx=null; }
      const ms=60000/this.ppm; this.beat(); this.timer=setInterval(()=>this.beat(), ms); return;
    }
    if(Rec.active){ showMsg("#tool-msg","Para a gravação do Estúdio primeiro.",true); return; }
    if(btn) btn.disabled=true;
    const r=await Mic.open(false); if(btn) btn.disabled=false;
    if(!r.ok){ showMsg("#tool-msg", r.msg, true); return; }
    this.running=true; this.peak=0; if(btn) btn.innerHTML=`${ic("pause")} Parar`;
    const loop=()=>{ if(!this.running) return; this.raf=requestAnimationFrame(loop); this.frame(); };
    this.raf=requestAnimationFrame(loop);
  },
  beat(){
    const p=$("#pulse"); if(p){ p.classList.add("beat"); setTimeout(()=>p.classList.remove("beat"), 90); }
    const snd=$("#metro-sound"); if(this.actx && snd && snd.checked){ try{ const o=this.actx.createOscillator(), g=this.actx.createGain(); o.frequency.value=880; g.gain.setValueAtTime(0.12,this.actx.currentTime); g.gain.exponentialRampToValueAtTime(0.0001,this.actx.currentTime+0.05); o.connect(g); g.connect(this.actx.destination); o.start(); o.stop(this.actx.currentTime+0.06); }catch(e){} }
  },
  frame(){
    const now=liveNow(this.name==="meter"?8:5);
    if(this.name==="tuner"){
      const n=noteName(now.hz), cv=$("#tool-live");
      $("#tn-note").textContent=fin(now.hz)?n.name:"—"; $("#tn-hz").textContent=fin(now.hz)?fmt(now.hz)+" Hz":"— Hz";
      $("#tn-cents").style.left=(50+clamp(n.cents,-50,50))+"%";
      const habit=habitualHz();
      $("#tn-rel").textContent = fin(now.hz)&&fin(habit) ? `${12*Math.log2(now.hz/habit)>=0?"+":""}${fmt(12*Math.log2(now.hz/habit),1)} st face ao teu tom habitual (${fmt(habit)} Hz)` : fin(now.hz)?"Grava sessões no Estúdio para comparar com o teu tom habitual.":"Diz um “mmm” longo ou faz uma sirene.";
      if(cv) drawLive(cv);
    } else if(this.name==="meter"){
      const rel=fin(now.db)? now.db-live.floor : NaN, v=fin(rel)?clamp(rel,0,45):0;
      this.peak=Math.max(v, this.peak-0.25);
      $("#mt-val").textContent=fin(rel)?fmt(Math.max(0,rel)):"—"; $("#mt-fill").style.width=(v/45*100)+"%"; $("#mt-peak").style.left=(this.peak/45*100)+"%";
      const z=v<15?"Íntimo: volume de conversa a dois.":v<25?"Conversa: mesa de reunião pequena.":v<35?"Reunião: chega a uma sala de dez pessoas.":"Palco: projeção para uma sala cheia.";
      $("#mt-zone").textContent=z;
    }
  },
  async stop(keepSheet){
    const was=this.running; this.running=false; cancelAnimationFrame(this.raf); clearInterval(this.timer); this.timer=null; Wake.drop("metro");
    if(this.name!=="metro" && was) await Mic.close();
    const btn=$("#tool-btn"); if(btn && keepSheet) btn.innerHTML=`${ic(this.name==="metro"?"play":"mic")} Começar`;
  }
};
function habitualHz(){ const f=S.sessions.filter(s=>s.kind==="fala"&&s.metrics&&fin(s.metrics.medianHz)).slice(0,8); return f.length?median(f.map(s=>s.metrics.medianHz)):NaN; }

/* ---------- Conversation analysis ---------- */
const Conv = {
  text:"", ctx:"seducao",
  open(){ Sheet.open("Analisar uma conversa", this.html()); },
  html(){
    return `<div class="stack t-social">
      <p class="sub">Cola uma conversa por mensagem. Começa as tuas mensagens por “Eu:” e as da outra pessoa pelo nome ou por “Ela:”.</p>
      <div class="field"><span class="lbl">Contexto</span><div class="seg wide" role="group">${[["seducao","Encontro"],["social","Social"],["cliente","Cliente"]].map(([v,l])=>`<button aria-pressed="${this.ctx===v}" data-act="conv-ctx" data-v="${v}">${l}</button>`).join("")}</div></div>
      <textarea id="conv-text" rows="9" placeholder="Eu: Então, sobreviveste ao concerto?&#10;Ela: Por pouco! O comboio atrasou duas horas&#10;Eu: …">${h(this.text)}</textarea>
      <p class="note">${ic("info")} A conversa não fica guardada. Usa iniciais em vez de dados pessoais.</p>
      <div class="sheet-actions"><button class="btn primary" data-act="conv-analyze">${claudeOn()?ic("sparkle")+" Analisar com o Claude":ic("copy")+" Analisar e copiar para o Claude"}</button></div>
      <p class="msg" id="conv-msg" hidden></p><textarea class="copybox" id="conv-copy" readonly hidden></textarea>
      <div id="conv-out" class="stack"></div></div>`;
  },
  local(){
    const lines=this.text.split(/\n+/).map(l=>l.trim()).filter(Boolean); const me=[], other=[];
    lines.forEach(l=>{ const m=l.match(/^([^:]{1,24}):\s*(.*)$/); if(!m) return; (/^eu$/i.test(m[1].trim())?me:other).push(m[2]); });
    const avg=a=>a.length?mean(a.map(x=>wordCount(x))):0, q=a=>a.filter(x=>x.includes("?")).length;
    return { me:me.length, other:other.length, meW:avg(me), otherW:avg(other), meQ:q(me), otherQ:q(other) };
  },
  async analyze(){
    const ta=$("#conv-text"); this.text=ta?ta.value:this.text;
    if(wordCount(this.text)<4){ showMsg("#conv-msg","Cola primeiro a conversa.",true); return; }
    const L=this.local(), out=$("#conv-out");
    out.innerHTML = L.me+L.other ? `<p class="h4">Contagem rápida</p><dl class="facts"><div><dt>Mensagens tuas</dt><dd>${L.me}</dd></div><div><dt>Mensagens da outra pessoa</dt><dd>${L.other}</dd></div><div><dt>Palavras por mensagem (tu)</dt><dd>${fmt(L.meW,1)}</dd></div><div><dt>Palavras por mensagem (outra)</dt><dd>${fmt(L.otherW,1)}</dd></div></dl><p class="sub">${L.other && L.otherW<L.meW*0.5?"Escreves muito mais do que recebes. Mensagens mais curtas equilibram o investimento.":"O tamanho das mensagens está equilibrado."}</p>` : "";
    if(!claudeOn()){
      const ok=await copyText(convPrompt(this.text, this.ctx, true), "#conv-copy");
      showMsg("#conv-msg", ok?"Pedido copiado. Cola numa conversa com o Claude para teres a leitura completa.":"Seleciona o texto abaixo e cola-o numa conversa com o Claude.", !ok);
      return;
    }
    const btn=document.querySelector('[data-act="conv-analyze"]'); if(btn) btn.disabled=true;
    out.insertAdjacentHTML("beforeend",'<p class="thinking" id="conv-wait"><span class="spinner"></span>A ler a conversa…</p>');
    try{ const d=await askClaude(convPrompt(this.text, this.ctx, false)); const w=$("#conv-wait"); if(w) w.remove(); out.insertAdjacentHTML("beforeend", fbHTML(d,"conv")); }
    catch(e){ const w=$("#conv-wait"); if(w) w.remove(); showMsg("#conv-msg", claudeErr(e), true); }
    finally{ if(btn) btn.disabled=false; }
  }
};

/* ---------- Story bank ---------- */
const STORY_TAGS=["Negócio","Social","Jantar","Encontro"];
const STORY_FIELDS=[["title","Título","Ex.: O camião preso na serra"],["hook","Gancho (a primeira frase)","Eram três da manhã e o camião não andava."],["context","Contexto","Quem, onde, o que estava em jogo."],["conflict","Conflito","O que correu mal, o obstáculo."],["turn","Ponto de viragem","O momento em que tudo muda."],["ending","Fecho","A frase final e o que ficou."],["notes","Notas","Detalhes sensoriais, falas, nomes."]];
const Stories = {
  draft:null, confirmDel:false,
  edit(id, preset){
    const st = id ? S.stories.find(s=>s.id===id) : Object.assign({ id:null, title:"", hook:"", context:"", conflict:"", turn:"", ending:"", notes:"", tags:[] }, preset||{});
    if(!st) return; this.draft=plain(st); this.confirmDel=false;
    Sheet.open(id?"Editar história":"Nova história", this.html());
  },
  html(){
    const d=this.draft;
    return `<div class="stack t-historia">
      ${STORY_FIELDS.map(([k,l,ph])=>`<div class="field"><label class="lbl" for="st-${k}">${l}</label>${k==="title"?`<input type="text" id="st-${k}" data-story="${k}" value="${h(d[k])}" placeholder="${h(ph)}">`:`<textarea id="st-${k}" data-story="${k}" rows="${k==="notes"?3:2}" placeholder="${h(ph)}">${h(d[k])}</textarea>`}</div>`).join("")}
      <div class="field"><span class="lbl">Para usar em</span><div class="chip-row">${STORY_TAGS.map(t=>`<button class="fchip sm" aria-pressed="${d.tags.includes(t)}" data-act="story-tag" data-v="${t}">${t}</button>`).join("")}</div></div>
      <div class="row"><button class="btn primary" data-act="story-save">${ic("check")} Guardar</button><button class="btn" data-act="story-rehearse">${ic("mic")} Ensaiar no Estúdio</button><button class="btn" data-act="story-doctor">${claudeOn()?ic("sparkle")+" Melhorar com o Claude":ic("copy")+" Copiar pedido para o Claude"}</button></div>
      ${d.id?`<div class="row">${this.confirmDel?`<span class="sub">Apagar esta história?</span><button class="btn sm" data-act="story-delete-yes">Apagar de vez</button><button class="btn sm ghost" data-act="story-delete-no">Cancelar</button>`:`<button class="linkbtn" data-act="story-delete">Apagar história</button>`}</div>`:""}
      <p class="msg" id="story-msg" hidden></p><textarea class="copybox" id="story-copy" readonly hidden></textarea><div id="story-out" class="stack"></div></div>`;
  },
  sync(){ document.querySelectorAll("[data-story]").forEach(el=>{ this.draft[el.dataset.story]=el.value; }); },
  async save(quiet){
    this.sync(); const d=this.draft;
    if(!d.title.trim()){ showMsg("#story-msg","Dá um título à história.",true); return false; }
    if(!d.id) d.id="h"+Date.now(); d.updated=Date.now();
    await Store.saveStory(d); if(!quiet){ toast("História guardada"); Sheet.close(); render(); }
    return true;
  },
  rehearse(){
    this.sync(); const d=this.draft;
    const beats=[d.context&&"contexto: "+d.context, d.conflict&&"conflito: "+d.conflict, d.turn&&"viragem: "+d.turn, d.ending&&"fecho: "+d.ending].filter(Boolean).join(" · ");
    S.studio.dynEx={ id:"story-"+(d.id||"rascunho"), track:"historia", kind:"fala", skill:"Banco de histórias", title:d.title||"A tua história", level:2, seconds:90, focus:"pausas",
      brief:`Conta a tua história${d.title?" “"+d.title+"”":""}.${d.hook?` Abre com: “${d.hook}”.`:""}${beats?" "+beats+".":""}`, tip:"Pausa antes da viragem e olha para quem ouve na frase final.", why:"Uma história ensaiada em voz alta sai natural quando a contas a sério." };
    S.studio.view="ready"; Sheet.close(true); goTab("estudio");
  },
  async doctor(){
    this.sync(); const d=this.draft;
    if(!d.title.trim() && !d.context.trim()){ showMsg("#story-msg","Escreve pelo menos o título e o contexto.",true); return; }
    if(!claudeOn()){ const ok=await copyText(storyPrompt(d,true), "#story-copy"); showMsg("#story-msg", ok?"Pedido copiado. Cola numa conversa com o Claude.":"Seleciona o texto abaixo e cola-o numa conversa com o Claude.", !ok); return; }
    const out=$("#story-out"); out.innerHTML='<p class="thinking"><span class="spinner"></span>A trabalhar a tua história…</p>';
    try{ const r=await askClaude(storyPrompt(d,false)); out.innerHTML=fbHTML(r,"story"); }
    catch(e){ out.innerHTML=""; showMsg("#story-msg", claudeErr(e), true); }
  }
};

/* ---------- Drill runner ---------- */
const Drill = {
  ex:null, i:0, steps:[], mic:false, left:0, last:0, paused:false, raf:0, t0:0, rating:0, ev:null, total:0,
  intro(ex){
    this.ex=ex;
    const html=`<div class="stack t-${ex.track}"><div class="detail-band">${trackTag(ex.track)}<span class="sub">${h(ex.skill)}</span></div>
      <h2 class="detail-title">${h(ex.title)}</h2><p class="detail-brief">${h(ex.brief)}</p>
      <ol class="steps-prev">${ex.steps.map(s=>`<li><span>${h(s.t)}</span><small>${s.s} s</small></li>`).join("")}</ol>
      ${MIC_OK?`<p class="note">${ic("mic")} O microfone mede cada passo: volume, tom e estabilidade. Nada é gravado.</p>`:`<p class="note">${ic("info")} Sem microfone ao vivo nesta versão: segue os passos com o temporizador. As medições estão na versão com microfone.${micLink()}</p>`}
      <div class="sheet-actions"><button class="btn primary" data-act="drill-go">${ic("play")} Começar</button></div><p class="msg" id="drill-msg" hidden></p></div>`;
    if(Sheet.isOpen){ Sheet.title(ex.title); Sheet.set(html); Sheet.onClose=()=>this.abort(); } else Sheet.open(ex.title, html, { onClose:()=>this.abort() });
  },
  async go(){
    if(Rec.active){ showMsg("#drill-msg","Para a gravação do Estúdio primeiro.",true); return; }
    this.mic=false; Wake.hold("drill");
    if(MIC_OK){ const r=await Mic.open(false); this.mic=r.ok; if(!r.ok) toast(r.msg); }
    this.steps=this.ex.steps.map(()=>({ a:0, b:0 })); this.t0=performance.now(); this.rating=0; this.ev=null;
    this.begin(0);
    const loop=()=>{ if(!this.ex || this.i<0) return; this.raf=requestAnimationFrame(loop); this.frame(); };
    cancelAnimationFrame(this.raf); this.raf=requestAnimationFrame(loop);
  },
  begin(i){
    this.i=i; this.paused=false; const st=this.ex.steps[i]; if(i>0) buzz(35);
    this.steps[i].a=this.mic?live.db.length:0; this.left=st.s; this.last=performance.now();
    const meter = this.mic && st.m ? (st.m==="level" ? `<div class="meter-mini"><div class="row"><span class="lbl">Volume face ao ruído</span><b id="d-val">—</b></div><div class="zone-bar"><i class="zfill" id="d-fill" style="width:0"></i></div></div>` : `<div class="meter-mini"><div class="row"><span class="lbl">Tom</span><b id="d-val">—</b></div><canvas class="live" id="d-live" style="height:110px"></canvas></div>`) : "";
    Sheet.set(`<div class="stack t-${this.ex.track}">
      <div class="run-top"><span class="dots">${this.ex.steps.map((s,k)=>`<i class="${k<i?"done":k===i?"on":""}"></i>`).join("")}</span><span class="lbl">Passo ${i+1} de ${this.ex.steps.length}</span></div>
      <p class="step-text">${h(st.t)}</p>
      <div class="countdown" id="d-ring">${ring(1, st.s, "seg", 132, 10, "lg")}</div>
      ${meter}
      <div class="run-ctrl"><button class="btn" data-act="drill-pause" id="d-pause">${ic("pause")} Pausa</button><button class="btn" data-act="drill-skip">${ic("skip")} Seguinte</button><button class="btn ghost" data-act="drill-stop">Terminar</button></div></div>`);
  },
  frame(){
    const now=performance.now(), dt=(now-this.last)/1000; this.last=now;
    if(!this.paused) this.left-=dt;
    const st=this.ex.steps[this.i]; if(!st) return;
    const ringEl=$("#d-ring .r-val"), lab=$("#d-ring .r-label b");
    if(ringEl){ const c=parseFloat(ringEl.getAttribute("stroke-dasharray")); ringEl.setAttribute("stroke-dashoffset", (c*(1-clamp(this.left/st.s,0,1))).toFixed(2)); }
    if(lab) lab.textContent=Math.max(0,Math.ceil(this.left));
    if(this.mic && st.m==="level"){ const n=liveNow(8), rel=fin(n.db)?n.db-live.floor:NaN, v=$("#d-val"), f=$("#d-fill"); if(v) v.textContent=fin(rel)?fmt(Math.max(0,rel))+" dB":"—"; if(f) f.style.width=(clamp(fin(rel)?rel:0,0,45)/45*100)+"%"; }
    if(this.mic && st.m==="pitch"){ const n=liveNow(6), v=$("#d-val"), cv=$("#d-live"); if(v) v.textContent=fin(n.hz)?`${noteName(n.hz).name} · ${fmt(n.hz)} Hz`:"—"; if(cv) drawLive(cv); }
    if(this.left<=0) this.next();
  },
  next(){
    this.steps[this.i].b=this.mic?live.db.length:0;
    if(this.i+1<this.ex.steps.length) this.begin(this.i+1); else this.finish();
  },
  togglePause(){ this.paused=!this.paused; const b=$("#d-pause"); if(b) b.innerHTML=this.paused?`${ic("play")} Retomar`:`${ic("pause")} Pausa`; },
  async finish(early){
    if(this.i>=0 && this.steps[this.i] && !this.steps[this.i].b) this.steps[this.i].b=this.mic?live.db.length:0;
    cancelAnimationFrame(this.raf); const idx=this.i; this.i=-1; Wake.drop("drill"); if(!early) buzz([30,60,30]);
    this.total=(performance.now()-this.t0)/1000;
    if(this.mic){ this.steps.forEach(s=>{ if(s.b>s.a) s.stats=rangeStats(s.a,s.b); }); this.ev=evalDrill(this.ex, this.steps); await Mic.close(); }
    const ev=this.ev, done=early?idx:this.ex.steps.length;
    const table = this.mic ? `<div class="chart-table"><table class="steptable"><thead><tr><th>Passo</th><th class="num">Acima do ruído</th><th class="num">Tom</th><th class="num">Amplitude</th></tr></thead><tbody>${this.steps.map((s,k)=>s.stats?`<tr><td>${k+1}</td><td class="num">${fin(s.stats.relDb)?fmt(s.stats.relDb)+" dB":"—"}</td><td class="num">${fin(s.stats.medHz)?fmt(s.stats.medHz)+" Hz":"—"}</td><td class="num">${fin(s.stats.rangeSt)?fmt(s.stats.rangeSt,1)+" st":"—"}</td></tr>`:"").join("")}</tbody></table></div>` : "";
    Sheet.set(`<div class="stack t-${this.ex.track}">
      ${ev && fin(ev.value) ? `<div class="result-big"><span class="lbl">${h(ev.headline)}</span><span class="rv">${fmt(ev.value,1)}<small>${h(ev.unit)}</small></span>${pill(ev.verdict)}</div><ul class="result-lines">${ev.lines.map(l=>`<li><span>${h(l)}</span></li>`).join("")}</ul>${table}`
        : `<div class="result-big"><span class="rv">${early?"Terminado":"Feito"}</span><span class="sub">${done} de ${this.ex.steps.length} passos em ${clockText(this.total)}</span></div>${ev&&ev.lines.length?`<ul class="result-lines">${ev.lines.map(l=>`<li><span>${h(l)}</span></li>`).join("")}</ul>`:""}`}
      <div class="field"><span class="lbl">Como correu?</span><div class="stars" role="group" aria-label="Avaliação">${[1,2,3,4,5].map(n=>`<button data-act="rate" data-v="${n}" aria-label="${n} de 5">${ic("star")}</button>`).join("")}</div></div>
      <div class="sheet-actions"><button class="btn primary" data-act="drill-save">${ic("check")} Guardar</button><button class="btn" data-act="drill-again">Repetir</button></div></div>`);
  },
  rate(n){ this.rating=n; document.querySelectorAll('.stars button').forEach(b=>b.classList.toggle("on", Number(b.dataset.v)<=n)); },
  async save(){
    const ex=this.ex, ev=this.ev;
    const s={ id:"d"+Date.now(), at:Date.now(), kind:"drill", track:ex.track, challengeId:ex.id, title:ex.title, skill:ex.skill, durS:Math.round(this.total), rating:this.rating||null,
      eval: ev ? { headline:ev.headline, value: fin(ev.value)?Math.round(ev.value*10)/10:null, unit:ev.unit, verdict:ev.verdict, lines:ev.lines } : null };
    s.xp=xpOf(s); await Store.addSession(s);
    this.ex=null; Sheet.onClose=null; Sheet.close(); toast(`Exercício guardado · +${s.xp} XP`); render();
  },
  abort(){ cancelAnimationFrame(this.raf); this.i=-1; Wake.drop("drill"); if(live.on && !Rec.active) Mic.close(); }
};

/* ---------- Quiz runner ---------- */
const Quiz = {
  ex:null, i:0, picks:[],
  start(ex){ this.ex=ex; this.i=0; this.picks=[]; if(Sheet.isOpen){ Sheet.title(ex.title); Sheet.onClose=null; } else Sheet.open(ex.title,""); this.render(); },
  render(){
    const ex=this.ex, q=ex.questions[this.i], picked=this.picks[this.i], answered=picked!=null, last=this.i===ex.questions.length-1;
    Sheet.set(`<div class="stack t-${ex.track}">
      <div class="run-top"><span class="dots">${ex.questions.map((x,k)=>`<i class="${k<this.i?"done":k===this.i?"on":""}"></i>`).join("")}</span><span class="lbl">Pergunta ${this.i+1} de ${ex.questions.length}</span></div>
      <p class="qtext">${h(q.q)}</p>
      <div class="opts">${q.opts.map((o,k)=>`<button class="opt ${answered&&k===q.a?"right":""} ${answered&&k===picked&&k!==q.a?"wrong":""}" data-act="quiz-opt" data-k="${k}" ${answered?"disabled":""}><span class="o-k">${"ABCD"[k]}</span><span>${h(o)}</span></button>`).join("")}</div>
      ${answered?`<div class="explain"><b>${picked===q.a?"Certo.":"Não exatamente."}</b> ${h(q.why)}</div><div class="sheet-actions"><button class="btn primary" data-act="quiz-next">${last?"Ver resultado":"Seguinte"} ${ic("chevR")}</button></div>`:""}</div>`);
  },
  pick(k){ if(this.picks[this.i]!=null) return; this.picks[this.i]=k; this.render(); },
  async next(){
    if(this.i<this.ex.questions.length-1){ this.i++; this.render(); return; }
    const ex=this.ex, score=this.picks.filter((p,k)=>p===ex.questions[k].a).length;
    const s={ id:"q"+Date.now(), at:Date.now(), kind:"quiz", track:ex.track, challengeId:ex.id, title:ex.title, skill:ex.skill, score, total:ex.questions.length };
    s.xp=xpOf(s); await Store.addSession(s);
    Sheet.set(`<div class="stack t-${ex.track}"><div class="result-big"><span class="rv">${score}<small>de ${ex.questions.length}</small></span><span class="sub">${score===ex.questions.length?"Perfeito.":score>=ex.questions.length-1?"Muito bom.":"Revê as explicações e repete daqui a uns dias."}</span><span class="tag">+${s.xp} XP</span></div>
      <ul class="result-lines">${ex.questions.map((q,k)=>`<li><span>${this.picks[k]===q.a?"✓":"✗"} ${h(q.q)}</span></li>`).join("")}</ul>
      <div class="sheet-actions"><button class="btn primary" data-act="sheet-close">Fechar</button><button class="btn" data-act="start-ex" data-id="${h(ex.id)}">Repetir</button></div></div>`);
    render();
  }
};

/* ---------- Writing runner ---------- */
const Writing = {
  ex:null, text:"",
  start(ex){ this.ex=ex; this.text=""; const html=this.html(); if(Sheet.isOpen){ Sheet.title(ex.title); Sheet.set(html); Sheet.onClose=null; } else Sheet.open(ex.title, html); },
  html(){
    const ex=this.ex;
    return `<div class="stack t-${ex.track}"><div class="detail-band">${trackTag(ex.track)}<span class="sub">${h(ex.skill)}</span></div>
      <p class="detail-brief">${h(ex.brief)}</p><div class="tipbox"><h4>Dica</h4><p>${h(ex.tip)}</p></div>
      <textarea id="w-text" rows="8" placeholder="${h(ex.placeholder||"")}">${h(this.text)}</textarea>
      <div class="wcount" id="w-count">${this.counts()}</div>
      <div class="sheet-actions"><button class="btn primary" data-act="write-analyze">${claudeOn()?ic("sparkle")+" Analisar com o Claude":ic("check")+" Analisar"}</button></div>
      <p class="msg" id="w-msg" hidden></p><textarea class="copybox" id="w-copy" readonly hidden></textarea><div id="w-out" class="stack"></div></div>`;
  },
  counts(){
    const t=this.text, w=wordCount(t), L=LEX.pt, hedges=sumCounts(countTerms(t,L.hedges.concat(L.apology))), q=(t.match(/\?/g)||[]).length;
    return [`${w} palavras`, `${q} ${q===1?"pergunta":"perguntas"}`, `${hedges} ${hedges===1?"hesitação":"hesitações"}`].map(x=>`<span class="tag">${x}</span>`).join("");
  },
  onInput(v){ this.text=v; const c=$("#w-count"); if(c) c.innerHTML=this.counts(); },
  checks(){
    const ex=this.ex, t=this.text, w=wordCount(t), L=LEX.pt, out=[];
    const hedges=sumCounts(countTerms(t,L.hedges.concat(L.apology))), plan=sumCounts(countTerms(t,L.plan)), q=(t.match(/\?/g)||[]).length;
    if(ex.rubric==="mensagem"){
      out.push([w<=45, w<=45?`Curta: ${w} palavras.`:`Longa: ${w} palavras. Por mensagem, menos é mais.`]);
      out.push([hedges===0, hedges===0?"Sem hesitações nem desculpas.":`${hedges} ${hedges===1?"hesitação ou desculpa":"hesitações ou desculpas"}. Tiram leveza.`]);
      out.push([q<=1, q<=1?"No máximo uma pergunta.":`${q} perguntas: parece entrevista.`]);
      if(ex.id==="chat-encontro") out.push([plan>0, plan>0?"Tem um plano concreto.":"Falta um plano concreto: dia, sítio, motivo."]);
    } else if(ex.rubric==="historia"){
      const filled=t.split("\n").filter(l=>/:\s*\S/.test(l)||(!l.includes(":") && l.trim().length>8)).length;
      out.push([filled>=4, `${filled} elementos preenchidos.`]);
      const sens=sumCounts(countTerms(t,L.sensory)); out.push([sens>0, sens>0?`${sens} detalhes sensoriais.`:"Sem detalhes sensoriais."]);
      const turns=sumCounts(countTerms(t,L.turns)); out.push([turns>0, turns>0?"Tem um ponto de viragem marcado.":"Falta um “mas” ou “até que”: onde está a viragem?"]);
    } else {
      out.push([/assunto\s*:/i.test(t), /assunto\s*:/i.test(t)?"Tem assunto.":"Falta a linha de assunto."]);
      out.push([w>=60 && w<=180, `${w} palavras ${w<60?"(curto demais)":w>180?"(longo demais)":"(bom tamanho)"}.`]);
      out.push([hedges<=1, hedges<=1?"Tom confiante.":`${hedges} hesitações: soa a pedido de desculpa.`]);
      out.push([/reuni|minutos|chamada|\d{1,2}h|semana|dia/i.test(t), "Pedido concreto: reunião, data ou duração."]);
    }
    return out;
  },
  async analyze(){
    const ta=$("#w-text"); this.text=ta?ta.value:this.text;
    if(wordCount(this.text)<3){ showMsg("#w-msg","Escreve primeiro o teu texto.",true); return; }
    const out=$("#w-out"), ex=this.ex;
    const checks=this.checks();
    out.innerHTML=`<p class="h4">Verificação rápida</p><ul class="focus-list">${checks.map(([ok,t])=>`<li class="${ok?"good":"fix"}"><span class="f-ic">${ic(ok?"check":"target")}</span><div><span>${h(t)}</span></div></li>`).join("")}</ul>`;
    const s={ id:"w"+Date.now(), at:Date.now(), kind:"escrita", track:ex.track, challengeId:ex.id, title:ex.title, skill:ex.skill, text:this.text, checks:checks.map(c=>({ ok:c[0], t:c[1] })) };
    if(!claudeOn()){
      const ok=await copyText(writingPrompt(ex,this.text,true), "#w-copy");
      showMsg("#w-msg", ok?"Pedido copiado. Cola numa conversa com o Claude para teres a leitura completa.":"Seleciona o texto abaixo e cola-o numa conversa com o Claude.", !ok);
      s.xp=xpOf(s); await Store.addSession(s); render(); return;
    }
    const btn=document.querySelector('[data-act="write-analyze"]'); if(btn) btn.disabled=true;
    out.insertAdjacentHTML("beforeend",'<p class="thinking" id="w-wait"><span class="spinner"></span>A ler o teu texto…</p>');
    try{ const d=await askClaude(writingPrompt(ex,this.text,false)); s.claude=d; const w=$("#w-wait"); if(w) w.remove(); out.insertAdjacentHTML("beforeend", fbHTML(d,"writing")); }
    catch(e){ const w=$("#w-wait"); if(w) w.remove(); showMsg("#w-msg", claudeErr(e), true); }
    finally{ if(btn) btn.disabled=false; s.xp=xpOf(s); await Store.addSession(s); render(); }
  }
};

/* ---------- Settings ---------- */
const Settings = {
  confirmWipe:false,
  open(){ this.confirmWipe=false; Sheet.open("Definições", this.html()); },
  html(){
    const st=S.settings;
    return `<div class="stack">
      <div class="grid-2"><div class="field"><label class="lbl" for="set-name">O teu nome</label><input type="text" id="set-name" value="${h(st.name||"")}" placeholder="O teu primeiro nome" autocomplete="given-name"></div>
      <div class="field"><label class="lbl" for="set-company">A tua empresa</label><input type="text" id="set-company" value="${h(st.company||"")}" placeholder="Onde trabalhas" autocomplete="organization"></div></div>
      <div class="field"><span class="lbl">Objetivo semanal</span><div class="row"><button class="icon-btn" data-act="set-goal" data-d="-1" aria-label="Menos">−</button><b style="font-size:1.4rem;min-width:2ch;text-align:center">${st.goal}</b><button class="icon-btn" data-act="set-goal" data-d="1" aria-label="Mais">+</button><span class="sub">sessões por semana</span></div></div>
      <div class="field"><span class="lbl">Língua de treino</span><div class="seg" role="group">${["pt","fr","en"].map(l=>`<button aria-pressed="${st.lang===l}" data-act="set-lang" data-v="${l}">${LANGS[l]}</button>`).join("")}</div></div>
      <div class="field"><span class="lbl">Nível de exigência</span><div class="seg" role="group">${[1,2,3].map(n=>`<button aria-pressed="${st.level===n}" data-act="set-level" data-v="${n}">Nível ${n}</button>`).join("")}</div><p class="sub">${h(LEVEL_NOTE[st.level]||"Nível 1: o desafio tal como está.")}</p></div>
      <details class="disc"><summary>Exportar e importar progresso <small>para passar entre o Claude e o browser</small></summary>
        <div class="stack" style="margin-top:12px"><button class="btn" data-act="export">${ic("download")} Copiar o meu progresso</button><textarea class="copybox" id="export-box" readonly hidden></textarea>
        <textarea id="import-box" rows="4" placeholder="Cola aqui o progresso exportado da outra versão."></textarea><button class="btn" data-act="import">${ic("upload")} Importar</button><p class="msg" id="imp-msg" hidden></p></div></details>
      ${Store.mode!=="db"?`<details class="disc"><summary>Apagar dados deste aparelho</summary><div class="row" style="margin-top:12px">${this.confirmWipe?`<span class="sub">Apaga todas as sessões e histórias deste browser.</span><button class="btn sm" data-act="wipe-yes">Apagar tudo</button><button class="btn sm ghost" data-act="wipe-no">Cancelar</button>`:`<button class="btn sm" data-act="wipe">${ic("trash")} Apagar</button>`}</div></details>`:""}
      <p class="note">${ic("info")} ${IN_VIEWER?`Versão Claude: histórico guardado ${Store.mode==="db"?"na tua conta":"neste dispositivo"}, leitura do coach pelo Claude, sem microfone ao vivo.${micLink()}`:`Versão com microfone: análise ao vivo, histórico guardado neste browser. A leitura do coach faz-se a copiar o relatório para o Claude.`}</p></div>`;
  },
  refresh(){ if(Sheet.isOpen && $("#sheet-title").textContent==="Definições") Sheet.set(this.html()); },
  async exportAll(){ const data=JSON.stringify({ app:"estudio-veio", v:2, exported:Date.now(), sessions:S.sessions.filter(s=>!s.isExample), stories:S.stories }); const ok=await copyText(data, "#export-box"); toast(ok?"Progresso copiado":"Seleciona e copia o texto"); },
  async importAll(){
    const ta=$("#import-box"); let data;
    try{ data=JSON.parse(ta.value); }catch(e){ showMsg("#imp-msg","Esse texto não é um progresso exportado.",true); return; }
    if(!data || data.app!=="estudio-veio" || !Array.isArray(data.sessions)){ showMsg("#imp-msg","Esse texto não é um progresso exportado.",true); return; }
    const have=new Set(S.sessions.map(s=>s.id)); let n=0;
    for(const s of data.sessions){ if(s && s.id && s.at && !have.has(s.id)){ await Store.addSession(s); n++; } }
    for(const st of (data.stories||[])){ if(st && st.id && !S.stories.some(x=>x.id===st.id)) await Store.saveStory(st); }
    if(Store.mode!=="db") Store.loadLocal();
    showMsg("#imp-msg", `${n} ${n===1?"sessão importada":"sessões importadas"}.`, false); render();
  }
};

/* ---------- Sheet ---------- */
const Sheet = {
  onClose:null, lastFocus:null,
  get isOpen(){ return !$("#sheet-wrap").hidden; },
  open(title, html, opts){
    if(this.isOpen) this.close(true);
    this.title(title); this.set(html); this.onClose=(opts&&opts.onClose)||null; this.lastFocus=document.activeElement;
    $("#sheet-wrap").hidden=false; document.body.classList.add("locked"); Nav.later();
    setTimeout(()=>{ const c=$("#sheet-close"); if(c) c.focus(); }, 40);
  },
  title(t){ $("#sheet-title").textContent=t; },
  set(html){ const b=$("#sheet-body"); b.innerHTML=html; b.scrollTop=0; },
  close(silent){
    if(!this.isOpen) return;
    const cb=this.onClose; this.onClose=null; if(cb) cb();
    $("#sheet-wrap").hidden=true; document.body.classList.remove("locked"); $("#sheet-body").innerHTML=""; Nav.later();
    if(!silent && this.lastFocus && this.lastFocus.focus){ try{ this.lastFocus.focus(); }catch(e){} }
  }
};

/* ---------- Phone behaviour: back gesture, screen on, haptics, install ---------- */
// Back gesture / back button: closes the open panel, then returns to Hoje, and never leaves mid-recording.
// One guard entry sits on top of history while there is something to go back from.
const Nav = {
  on: !IN_VIEWER, guard:false, skip:0, t:0, armed:false,
  init(){
    if(!this.on) return;
    try{ const st=history.state; if(st && st.veio===1) this.guard=true; else history.replaceState({ veio:0 }, ""); }
    catch(e){ this.on=false; return; }
    window.addEventListener("popstate", e=>this.pop(e));
    this.later();
  },
  later(){ if(!this.on || this.t) return; this.t=setTimeout(()=>{ this.t=0; this.sync(); }, 0); },
  atRoot(){ return S.tab==="hoje" && !Sheet.isOpen; },
  sync(){
    const need=!this.atRoot();
    try{
      if(need && !this.guard){
        // entries pushed before the first tap get skipped by Chrome's back button, so wait for one
        const ua=navigator.userActivation;
        if(ua && !ua.hasBeenActive){ if(!this.armed){ this.armed=true; const go=()=>{ this.armed=false; removeEventListener("pointerup",go,true); removeEventListener("keydown",go,true); this.later(); }; addEventListener("pointerup",go,true); addEventListener("keydown",go,true); } return; }
        history.pushState({ veio:1 }, ""); this.guard=true;
      } else if(!need && this.guard){ this.guard=false; this.skip++; history.back(); }
    }catch(e){}
  },
  pop(e){
    if(this.skip>0){ this.skip--; return; }
    if(e.state && e.state.veio===1){ this.guard=true; this.later(); return; }
    this.guard=false;
    if(Rec.active || Rec.busy) toast(Rec.active?"Estás a gravar. Para a gravação antes de sair.":"Ainda estou a analisar a gravação.");
    else if(Sheet.isOpen) Sheet.close();
    else if(S.tab!=="hoje") goTab("hoje");
    this.later();
  }
};
// Keeps the screen on while the mic or a timed exercise is running (Android dims after 30 s by default).
const Wake = {
  why:new Set(), lock:null, busy:false,
  hold(k){ this.why.add(k); document.documentElement.classList.add("live"); this.refresh(); },
  drop(k){ this.why.delete(k); if(this.why.size) return; document.documentElement.classList.remove("live"); const l=this.lock; this.lock=null; if(l) l.release().catch(()=>{}); },
  async refresh(){
    if(!this.why.size || this.lock || this.busy || !("wakeLock" in navigator) || document.visibilityState!=="visible") return;
    this.busy=true;
    try{ const l=await navigator.wakeLock.request("screen"); if(!this.why.size) l.release().catch(()=>{}); else { this.lock=l; l.addEventListener("release", ()=>{ if(this.lock===l) this.lock=null; }); } }
    catch(e){}
    this.busy=false;
  }
};
function buzz(p){ try{ if(IS_MOBILE && navigator.vibrate) navigator.vibrate(p); }catch(e){} }
// On the phone, leaving the app ends what is using the mic: the recording is analysed, a running exercise pauses.
document.addEventListener("visibilitychange", ()=>{
  if(document.visibilityState==="visible"){ Wake.refresh(); if(Rec.leftApp){ Rec.leftApp=false; toast("A gravação parou quando saíste da app."); } return; }
  if(!IS_MOBILE) return;
  if(Rec.active){ Rec.leftApp=true; Rec.stop(); }
  if(Drill.ex && Drill.i>=0 && !Drill.paused) Drill.togglePause();
  if(Tools.running) Tools.stop(true);
});
// Install as an app (Chrome on Android offers it; on iPhone it is Share → Add to Home Screen)
let installEvt=null;
const STANDALONE = (()=>{ try{ return matchMedia("(display-mode: standalone)").matches || navigator.standalone===true; }catch(e){ return false; } })();
window.addEventListener("beforeinstallprompt", e=>{ e.preventDefault(); installEvt=e; if(S.tab==="hoje") schedule(); });
window.addEventListener("appinstalled", ()=>{ installEvt=null; toast("App instalada. Já a tens no ecrã principal."); if(S.tab==="hoje") schedule(); });
function installCard(){
  if(IN_VIEWER || STANDALONE || !installEvt || Date.now() < Number(LS.get("install-later",0)||0)) return "";
  return `<section class="tipcard t-voz"><span class="t-ic">${ic("download")}</span><div><h3>Instala a app no telemóvel</h3><p>Fica com ícone no ecrã principal, ocupa o ecrã inteiro e abre mesmo sem rede.</p><div class="tip-actions"><button class="btn sm primary" data-act="install">Instalar</button><button class="btn sm ghost" data-act="install-later">Agora não</button></div></div></section>`;
}
// While typing on a phone the tab bar steps aside so the keyboard has room
const isField = el=> !!el && (el.tagName==="TEXTAREA" || el.isContentEditable || (el.tagName==="INPUT" && !/^(checkbox|radio|range|button|submit|reset|file|color)$/i.test(el.type||"")));
document.addEventListener("focusin", e=>{ if(isField(e.target)) document.body.classList.add("typing"); });
document.addEventListener("focusout", e=>{ if(isField(e.target)) setTimeout(()=>{ if(!isField(document.activeElement)) document.body.classList.remove("typing"); }, 80); });

/* ---------- Generated challenges (Claude) ---------- */
async function genChallenge(track){
  const btn=document.querySelector('[data-act="gen-challenge"]'); if(btn){ btn.disabled=true; btn.innerHTML='<span class="spinner"></span> A criar…'; }
  try{
    const titles=allExercises().filter(e=>e.track===track).map(e=>e.title).join("; ");
    const d=await askClaude(`Cria um desafio de treino de comunicação falada ${quem("para o")}, ${PERSONA} Área: ${TRACKS[track].name} (${TRACKS[track].desc}). Situação realista, concreta e um pouco desconfortável, ao nível ${S.settings.level} de 3. Ele responde em ${LANGS[S.settings.lang]}${S.settings.lang!=="pt"?" (escreve o brief nessa língua)":""}.${track==="social"?" "+ETHICS:""} Evita repetir estes títulos: ${titles}.
Responde só com JSON: {"skill":"competência em 1 a 3 palavras","title":"título até 5 palavras","brief":"a situação e o que ele tem de dizer, 1 a 3 frases","seconds": 20 a 90,"focus":"tom|ritmo|pausas|finais|dinamica|hesitacoes","tip":"uma dica de entrega concreta, 1 frase","why":"porque é que isto funciona, 1 frase"}`, "quick");
    if(!d.title || !d.brief) throw { code:"invalid_json" };
    const ex={ id:"c"+Date.now(), custom:true, track, kind:"fala", skill:String(d.skill||"Desafio"), title:String(d.title), level:S.settings.level, seconds:clamp(Number(d.seconds)||45,15,120), focus:DEF[d.focus]?d.focus:"tom", brief:String(d.brief), tip:String(d.tip||""), why:String(d.why||""), min:2 };
    if(S.settings.lang!=="pt") ex.lang=S.settings.lang;
    await Store.saveCustom(ex); if(!S.custom.some(c=>c.id===ex.id)) S.custom.unshift(ex);
    render(); openEx(ex.id);
  }catch(e){ toast(claudeErr(e)||"Não consegui criar o desafio."); render(); }
}

/* ---------- Example report ---------- */
function exampleResult(){
  const rnd=seeded(7), hop=0.04, nF=1200, db=new Array(nF).fill(-62), st=new Array(nF).fill(null); let sp=""; const spA=new Array(nF).fill(0), finals=[];
  let f=15, k=0; const types=["down","up","down","flat","down","up","down","down","up","flat","down"];
  while(f<nF-30){ const len=Math.floor(38+rnd()*65), end=Math.min(nF-15,f+len), t=types[k++%types.length];
    for(let x=f;x<end;x++){ spA[x]=1; const ph=(x-f)/len; db[x]=Math.round(-30+6*Math.sin(x*2.2)+4*Math.sin(x*.5+k)-3*ph+(rnd()-.5)*2);
      if(Math.sin(x*2.2)>-0.6){ let v=2.2*Math.sin(x*.18+k)+1.2*Math.sin(x*.7)-1.5*ph+(rnd()-.5)*.4; if(end-x<8) v+= t==="down"?-2.5*(1-(end-x)/8): t==="up"?2.5*(1-(end-x)/8):0; st[x]=Math.round(v*10)/10; } }
    finals.push({ f:end, type:t }); f=end+Math.floor(6+rnd()*22); }
  spA.forEach(v=>sp+=v?"1":"0");
  const metrics={ durationS:46, phonationS:35, speechRatio:.76, medianHz:118, pitchSD:2.2, pitchRange:7.4, sylRate:5.0, artRate:6.1, pausesPerMin:9.1, pausesN:7, longPauses:1, longestPause:1.3, latePause:.6, finalsN:11, downPct:45, upPct:27, swallowedPct:18, dynamicDb:8.4, hesPerMin:3.1, hesN:2, snr:30, wpm:168 };
  const transcript="Pronto, então, tipo, nós basicamente fazemos pedra natural para projetos de luxo. Acho que o que nos distingue é que vamos à pedreira escolher cada bloco. Tipo, vi o veio de um Calacatta ao amanhecer e percebi logo que era para aquela casa. Mas o cliente queria outra coisa, e afinal, se calhar, tínhamos razão.";
  const r={ id:"exemplo", isExample:true, at:Date.now(), kind:"fala", track:"negocio", challengeId:"pitch-genebra", title:"O arquiteto de Genebra", skill:"Pitch", level:1, lang:"pt", target:30, metrics, transcript,
    series:{ hopSec:hop, start:15, end:f, db, st, sp, floor:-62, peak:-22, finals } };
  r.words=analyzeWords(transcript,"pt",46); r.index=voiceIndex(metricValues(metrics,"pt")); r.xp=0;
  return r;
}

/* ---------- Actions ---------- */
const ACT = {
  "tab": el=>goTab(el.dataset.tab),
  "goto": el=>{ Sheet.close(true); goTab(el.dataset.tab); },
  "settings": ()=>Settings.open(),
  "sheet-close": ()=>Sheet.close(),
  "install": async ()=>{ const e=installEvt; if(!e) return; installEvt=null; try{ await e.prompt(); await e.userChoice; }catch(_){} render(); },
  "install-later": ()=>{ LS.set("install-later", Date.now()+14*DAY); render(); },
  "open-ex": el=>openEx(el.dataset.id),
  "start-ex": el=>startEx(el.dataset.id),
  "fav": el=>{ const id=el.dataset.id; S.favs.has(id)?S.favs.delete(id):S.favs.add(id); LS.set("favs",[...S.favs]); el.setAttribute("aria-pressed", S.favs.has(id)); toast(S.favs.has(id)?"Adicionado aos favoritos":"Removido dos favoritos"); if(S.tab==="treinar") render(); },
  "plan-start": ()=>{ const plan=dailyPlan(), today=new Set(S.sessions.filter(s=>dayKey(s.at)===dayKey(Date.now())).map(s=>s.challengeId)); const id=plan.find(x=>!today.has(x)); if(id) openEx(id); else goTab("treinar"); },
  "lib-track": el=>{ S.filters.track=el.dataset.v; S.filters.kind="todos"; goTab("treinar"); },
  "filter-track": el=>{ S.filters.track=el.dataset.v; render(); },
  "filter-kind": el=>{ S.filters.kind=el.dataset.v; render(); },
  "gen-challenge": el=>genChallenge(el.dataset.v),
  "words3-roll": ()=>{ S.studio.words3=pickWords3(); const ex=getEx("tres-palavras"); openEx(ex.id); },
  "set-lang": el=>{ S.settings.lang=el.dataset.v; saveSettings(); Settings.refresh(); if(S.tab==="estudio") render(); },
  "set-level": el=>{ S.settings.level=Number(el.dataset.v); saveSettings(); Settings.refresh(); render(); },
  "set-goal": el=>{ S.settings.goal=clamp(S.settings.goal+Number(el.dataset.d),1,21); saveSettings(); Settings.refresh(); render(); },
  "free": ()=>{ S.studio.exId=null; S.studio.dynEx=null; LS.set("studioEx",null); render(); },
  "rec": ()=>Rec.toggle(),
  "toggle-file": ()=>{ S.studio.showFile=!S.studio.showFile; render(); },
  "analyze": ()=>analyzeFile(),
  "sub": el=>{ if(el.dataset.scope==="sheet"){ SessionSheet.sub=el.dataset.sub; SessionSheet.render(); } else { S.studio.sub=el.dataset.sub; render(); } },
  "coach": el=>askCoach(el.dataset.scope),
  "copy-coach": async el=>{ const sc=el.dataset.scope, r=scopeRes(sc); if(!r) return; const ok=await copyText(chatCoachPrompt(r), "#"+sc+"-copy"); showMsg("#"+sc+"-coach-msg", ok?"Copiado. Cola numa conversa com o Claude para teres a leitura completa.":"Seleciona o texto abaixo, copia-o e cola-o numa conversa com o Claude.", !ok); },
  "retr": el=>retranscribe(el.dataset.scope),
  "new-rec": ()=>{ S.studio.view="ready"; render(); },
  "next-ex": ()=>{ const cur=currentEx(), track=cur?cur.track:"voz", recent=new Set(S.sessions.filter(s=>s.at>Date.now()-7*DAY).map(s=>s.challengeId));
    let pool=EX.filter(e=>e.track===track && e.kind==="fala" && (!cur||e.id!==cur.id) && !recent.has(e.id) && !e.lang); if(!pool.length) pool=EX.filter(e=>e.track===track && e.kind==="fala" && (!cur||e.id!==cur.id));
    const ex=pool[Math.floor(Math.random()*pool.length)]; S.studio.dynEx=null; S.studio.exId=ex.id; LS.set("studioEx",ex.id); S.studio.view="ready"; render(); window.scrollTo(0,0); },
  "open-session": el=>SessionSheet.open(el.dataset.id),
  "example-report": ()=>SessionSheet.openExample(),
  "prog-range": el=>{ S.prog.range=el.dataset.v; S.prog.more=false; render(); },
  "prog-track": el=>{ S.prog.track=el.dataset.v; S.prog.more=false; render(); },
  "prog-more": ()=>{ S.prog.more=true; render(); },
  "tool-seg": el=>{ S.toolSeg=el.dataset.v; render(); },
  "tool": el=>Tools.open(el.dataset.tool),
  "tool-toggle": ()=>Tools.toggle(),
  "metro-ppm": el=>{ Tools.ppm=Number(el.dataset.v); const was=Tools.running; Tools.stop(true); Sheet.set(Tools.html()); if(was) Tools.start(); },
  "gen-all": ()=>{ S.gen=rollAll(); render(); },
  "gen-roll": el=>{ const k=el.dataset.k; let v; do{ v=Math.floor(Math.random()*GEN[k].length); }while(GEN[k].length>1 && v===S.gen[k]); S.gen[k]=v; render(); },
  "gen-tell": ()=>{ S.studio.dynEx=genStoryEx(); S.studio.view="ready"; goTab("estudio"); },
  "gen-save": ()=>{ const g=S.gen; Stories.edit(null,{ title:`Ideia: ${GEN.personagem[g.personagem]}`, context:`${GEN.personagem[g.personagem]}, em ${GEN.lugar[g.lugar]}, ${GEN.desejo[g.desejo]}.`, conflict:GEN.obstaculo[g.obstaculo], turn:GEN.reviravolta[g.reviravolta], tags:["Jantar"] }); },
  "story-new": ()=>Stories.edit(null),
  "story-open": el=>Stories.edit(el.dataset.id),
  "story-tag": el=>{ Stories.sync(); const t=el.dataset.v, a=Stories.draft.tags; const i=a.indexOf(t); if(i>=0) a.splice(i,1); else a.push(t); el.setAttribute("aria-pressed", a.includes(t)); },
  "story-save": ()=>Stories.save(),
  "story-rehearse": ()=>Stories.rehearse(),
  "story-doctor": ()=>Stories.doctor(),
  "story-delete": ()=>{ Stories.sync(); Stories.confirmDel=true; Sheet.set(Stories.html()); },
  "story-delete-no": ()=>{ Stories.sync(); Stories.confirmDel=false; Sheet.set(Stories.html()); },
  "story-delete-yes": async ()=>{ await Store.deleteStory(Stories.draft.id); Sheet.close(); toast("História apagada"); render(); },
  "q-shuffle": ()=>{ S.qOffset=(S.qOffset+5)%DEEP_QUESTIONS.length; render(); },
  "q-copy": async el=>{ const ok=await copyText(el.dataset.q); toast(ok?"Pergunta copiada":"Não consegui copiar"); },
  "conv-ctx": el=>{ const ta=$("#conv-text"); if(ta) Conv.text=ta.value; Conv.ctx=el.dataset.v; Sheet.set(Conv.html()); },
  "conv-analyze": ()=>Conv.analyze(),
  "drill-go": ()=>Drill.go(),
  "drill-pause": ()=>Drill.togglePause(),
  "drill-skip": ()=>Drill.next(),
  "drill-stop": ()=>Drill.finish(true),
  "drill-save": ()=>Drill.save(),
  "drill-again": ()=>{ const ex=Drill.ex; if(ex) Drill.intro(ex); },
  "rate": el=>Drill.rate(Number(el.dataset.v)),
  "quiz-opt": el=>Quiz.pick(Number(el.dataset.k)),
  "quiz-next": ()=>Quiz.next(),
  "write-analyze": ()=>Writing.analyze(),
  "export": ()=>Settings.exportAll(),
  "import": ()=>Settings.importAll(),
  "wipe": ()=>{ Settings.confirmWipe=true; Settings.refresh(); },
  "wipe-no": ()=>{ Settings.confirmWipe=false; Settings.refresh(); },
  "wipe-yes": ()=>{ ["sessions","stories","custom","plan"].forEach(k=>LS.del(k)); Store.loadLocal(); Settings.confirmWipe=false; Settings.refresh(); render(); toast("Dados deste aparelho apagados"); }
};

/* ---------- Events ---------- */
document.addEventListener("click", e=>{
  const el=e.target.closest("[data-act]"); if(!el || el.disabled) return;
  if(el.classList.contains("sheet-backdrop") && e.target!==el) return;
  const fn=ACT[el.dataset.act]; if(fn){ e.preventDefault(); fn(el,e); }
});
document.addEventListener("input", e=>{
  const t=e.target;
  if(t.id==="q"){ S.filters.q=t.value; const l=$("#ex-list"); if(l) l.innerHTML=exList(); }
  else if(t.id==="transcript") S.studio.transcript=t.value;
  else if(t.id==="w-text") Writing.onInput(t.value);
  else if(t.id==="conv-text") Conv.text=t.value;
});
document.addEventListener("change", e=>{
  const t=e.target;
  if(t.id==="f-pick"||t.id==="f-capture") onFile(t);
  else if(t.id==="opt-tr"){ S.settings.autotr=t.checked; saveSettings(); }
  else if(t.id==="set-name"||t.id==="set-company"){ S.settings[t.id==="set-name"?"name":"company"]=t.value.trim().slice(0,40); saveSettings(); applyPersona(); render(); }
});
document.addEventListener("keydown", e=>{
  if(e.key==="Escape" && Sheet.isOpen){ Sheet.close(); return; }
  const plot=e.target.closest && e.target.closest(".chart .plot");
  if(plot && (e.key==="ArrowLeft"||e.key==="ArrowRight")){ const d=CHARTS[plot.closest(".chart").dataset.chart]; if(!d) return; e.preventDefault(); const i=clamp((d.sel??d.pts.length-1)+(e.key==="ArrowRight"?1:-1),0,d.pts.length-1); chartShow(plot,null,i); }
});
function chartShow(plot, clientX, idx){
  const ch=plot.closest(".chart"), d=CHARTS[ch.dataset.chart]; if(!d || !d.pts.length) return;
  const r=plot.getBoundingClientRect(); let i=idx;
  if(i==null){ const x=(clientX-r.left)/r.width; let bd=9; d.pts.forEach((p,k)=>{ const dd=Math.abs(p.x-x); if(dd<bd){ bd=dd; i=k; } }); }
  i=clamp(i,0,d.pts.length-1); d.sel=i; const p=d.pts[i];
  const cross=plot.querySelector(".cross"), tip=plot.querySelector(".ctip"); if(!cross||!tip) return;
  cross.hidden=false; cross.style.left=(p.x*100)+"%";
  tip.hidden=false; tip.textContent="";
  const b=document.createElement("b"), sp=document.createElement("span");
  if(d.type==="contour"){ b.textContent = p.pause ? "Pausa" : fin(p.v) ? (p.v>=0?"+":"")+fmt(p.v,1)+" st" : "Sem tom"; sp.textContent=fmt(Math.max(0,p.t),1)+" s"; }
  else { const k=document.createElement("i"); k.className="k"; b.textContent=d.fmt(p.v); sp.append(k, document.createTextNode(p.label+(p.tip?" · "+p.tip:""))); }
  tip.append(b, sp);
  tip.style.left=clamp(p.x*r.width, 70, Math.max(70, r.width-70))+"px";
  tip.style.top=Math.max(30,(p.y!=null?p.y:0.3)*r.height)+"px";
}
function chartHide(plot){ const c=plot.querySelector(".cross"), t=plot.querySelector(".ctip"); if(c) c.hidden=true; if(t) t.hidden=true; }
document.addEventListener("pointermove", e=>{ const plot=e.target.closest && e.target.closest(".chart .plot"); if(plot) chartShow(plot, e.clientX); });
document.addEventListener("pointerout", e=>{
  const plot=e.target.closest && e.target.closest(".chart .plot"); if(plot && !plot.contains(e.relatedTarget)) chartHide(plot);
  const t=e.target.closest && e.target.closest("[data-tip]"); if(t && !t.contains(e.relatedTarget)) $("#ftip").hidden=true;
});
document.addEventListener("pointerover", e=>{ const t=e.target.closest && e.target.closest("[data-tip]"); if(t) showFtip(t); });
document.addEventListener("focusin", e=>{
  const plot=e.target.closest && e.target.closest(".chart .plot"); if(plot){ const d=CHARTS[plot.closest(".chart").dataset.chart]; if(d) chartShow(plot,null,d.sel??d.pts.length-1); }
  const t=e.target.closest && e.target.closest("[data-tip]"); if(t) showFtip(t);
});
document.addEventListener("focusout", e=>{
  const plot=e.target.closest && e.target.closest(".chart .plot"); if(plot) chartHide(plot);
  if(e.target.closest && e.target.closest("[data-tip]")) $("#ftip").hidden=true;
});
function showFtip(t){ const f=$("#ftip"); f.textContent=t.dataset.tip; f.hidden=false; const r=t.getBoundingClientRect(); f.style.left=clamp(r.left+r.width/2, 90, window.innerWidth-90)+"px"; f.style.top=r.top+"px"; }
let rzT=null; window.addEventListener("resize", ()=>{ clearTimeout(rzT); rzT=setTimeout(()=>{ if(S.tab==="estudio" && MIC_OK && !Rec.active && $("#live")) drawLive($("#live")); }, 150); });

/* ---------- Boot ---------- */
(function boot(){
  $("#rail-brand").innerHTML=`<span class="brand-mark">${BRAND_SVG}</span><span><b>Estúdio Veio</b><small>Treino de comunicação</small></span>`;
  $("#rail-foot").innerHTML=`<button class="btn sm ghost" data-act="settings">${ic("sliders")} Definições</button><p class="mode-badge">${ic(IN_VIEWER?"info":MIC_OK?"mic":"info")}<span>${IN_VIEWER?"Versão Claude · sem microfone ao vivo":MIC_OK?"Versão com microfone":"Microfone indisponível neste browser"}</span></p>`;
  const hash=(location.hash||"").replace("#",""); if(TABS.includes(hash)) S.tab=hash;
  if(S.studio.exId && !EX_BY_ID[S.studio.exId]) S.studio.exId=null;
  applyPersona();
  if(!IN_VIEWER) Store.loadLocal();
  render();
  Store.init();
  Nav.init();
  // the public site works offline once opened: the service worker keeps the page and icons
  if(PUBLIC && !IN_VIEWER && "serviceWorker" in navigator && (location.protocol==="https:" || /^(localhost|127\.0\.0\.1)$/.test(location.hostname)))
    window.addEventListener("load", ()=>{ navigator.serviceWorker.register("sw.js").catch(()=>{}); });
})();
