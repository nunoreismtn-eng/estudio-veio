/* ===================== MOTOR: voz, texto, pontuação, estatísticas ===================== */
const tick = () => new Promise(r=>setTimeout(r,0));
const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));
function pct(arr, p){ if(!arr.length) return NaN; const a=Float64Array.from(arr).sort(); const i=(a.length-1)*p; const lo=Math.floor(i), hi=Math.ceil(i); return a[lo]+(a[hi]-a[lo])*(i-lo); }
function median(a){ return pct(a,.5); }
function mean(a){ let s=0; for(const v of a) s+=v; return a.length? s/a.length : NaN; }
function std(a){ if(a.length<2) return 0; const m=mean(a); let s=0; for(const v of a) s+=(v-m)*(v-m); return Math.sqrt(s/(a.length-1)); }
const fin = v => v!=null && !isNaN(v) && isFinite(v);

/* ---------- Pitch (YIN) ---------- */
const _d = new Float32Array(1024), _cm = new Float32Array(1024);
function yin(x, s, W, MINL, MAXL, SR){
  const d=_d, cm=_cm;
  for(let tau=1; tau<=MAXL; tau++){ let sum=0; for(let j=0;j<W;j++){ const df=x[s+j]-x[s+j+tau]; sum+=df*df; } d[tau]=sum; }
  let run=0; cm[0]=1;
  for(let tau=1; tau<=MAXL; tau++){ run+=d[tau]; cm[tau]= run>0 ? d[tau]*tau/run : 1; }
  let best=-1, bestV=1;
  for(let tau=MINL; tau<=MAXL; tau++){
    if(cm[tau] < 0.15){ while(tau+1<=MAXL && cm[tau+1]<cm[tau]) tau++; best=tau; bestV=cm[tau]; break; }
    if(cm[tau] < bestV){ bestV=cm[tau]; best=tau; }
  }
  if(best<=0 || bestV>=0.35) return NaN;
  let t=best;
  if(best>MINL && best<MAXL){ const a=cm[best-1], b=cm[best], c=cm[best+1]; const den=a-2*b+c; if(den>0) t = best + 0.5*(a-c)/den; }
  return SR/t;
}

/* ---------- Ficheiros e reamostragem ---------- */
async function decodeFile(file){
  const buf = await file.arrayBuffer();
  const AC = window.AudioContext || window.webkitAudioContext;
  if(!AC) throw new Error("no-audio");
  const ctx = new AC();
  try{
    return await new Promise((res,rej)=>{
      try{ const p = ctx.decodeAudioData(buf.slice(0), res, rej); if(p && p.then) p.then(res, rej); }catch(e){ rej(e); }
    });
  } finally { try{ ctx.close(); }catch(e){} }
}
function toMono8k(ab, maxSec){
  const sr = ab.sampleRate, ch = ab.numberOfChannels;
  const n = Math.min(ab.length, Math.floor(maxSec*sr));
  const mono = new Float32Array(n);
  for(let c=0;c<ch;c++){ const d=ab.getChannelData(c); for(let i=0;i<n;i++) mono[i]+=d[i]/ch; }
  let clip=0; for(let i=0;i<n;i++) if(Math.abs(mono[i])>0.985) clip++;
  const L = Math.max(1, Math.round(sr/8000)); const half=Math.floor(L/2);
  const P = new Float64Array(n+1); for(let i=0;i<n;i++) P[i+1]=P[i]+mono[i];
  const outN = Math.floor(n*8000/sr), out = new Float32Array(outN);
  const ma = j => { const a=Math.max(0,j-half), b=Math.min(n,j-half+L); return (P[b]-P[a])/Math.max(1,b-a); };
  for(let i=0;i<outN;i++){ const pos=i*sr/8000, k=Math.floor(pos), fr=pos-k; out[i]= ma(k)*(1-fr) + ma(Math.min(n-1,k+1))*fr; }
  return { x:out, clipRatio: clip/Math.max(1,n), truncated: ab.length>n };
}

/* ---------- Análise completa de uma gravação ---------- */
async function analyzeVoice(x, onProgress){
  const SR=8000, HOP=80, W=300, MINL=23, MAXL=107; // 75–350 Hz
  const FL = W+MAXL+1;
  const nF = Math.max(0, Math.floor((x.length-FL)/HOP));
  if(nF < 200) throw new Error("short");
  const db = new Float32Array(nF);
  for(let f=0; f<nF; f++){ const s=f*HOP; let e=0; for(let j=0;j<W;j++){ const v=x[s+j]; e+=v*v; } db[f]=10*Math.log10(e/W+1e-10); }
  const floor = pct(db,.10), peak = pct(db,.97);
  const thr = floor + Math.max(6, 0.30*(peak-floor));
  const snr = peak-floor;
  const sp = new Uint8Array(nF); for(let f=0;f<nF;f++) sp[f]= db[f]>thr ? 1:0;
  fillRuns(sp, 0, 15); fillRuns(sp, 1, 8, true);
  const f0 = new Float32Array(nF).fill(NaN);
  for(let f=0; f<nF; f++){
    if(db[f] > thr) f0[f] = yin(x, f*HOP, W, MINL, MAXL, SR);
    if(f % 1500 === 0){ onProgress && onProgress(0.1 + 0.75*f/nF); await tick(); }
  }
  removeShortVoiced(f0, 4);
  const med0 = median(Array.from(f0).filter(v=>!isNaN(v)));
  for(let f=0; f<nF; f++){ const v=f0[f]; if(isNaN(v)) continue;
    if(v > 1.75*med0 && v/2>=75) f0[f]=v/2; else if(v < 0.57*med0 && v*2<=350) f0[f]=v*2; }
  const f0s = medianFilterNaN(f0, 5);
  const voicedHz = Array.from(f0s).filter(v=>!isNaN(v));
  if(voicedHz.length < 60) throw new Error("novoice");
  const medHz = median(voicedHz);
  const st = new Float32Array(nF).fill(NaN);
  for(let f=0; f<nF; f++) if(!isNaN(f0s[f])) st[f]=12*Math.log2(f0s[f]/medHz);
  onProgress && onProgress(0.9); await tick();

  const segs=[]; let i=0; while(i<nF){ if(sp[i]){ let j=i; while(j<nF && sp[j]) j++; segs.push({a:i,b:j}); i=j; } else i++; }
  if(!segs.length) throw new Error("novoice");
  const start=segs[0].a, end=segs[segs.length-1].b;
  const T = Math.max(1, (end-start)*HOP/SR);
  let phon=0; segs.forEach(s=>phon+=(s.b-s.a)); const phonSec = phon*HOP/SR;
  const gaps=[]; for(let k=0;k<segs.length-1;k++) gaps.push((segs[k+1].a - segs[k].b)*HOP/SR);
  const pauses = gaps.filter(g=>g>=0.25), longP = gaps.filter(g=>g>=1.0);

  const sm = new Float32Array(nF); for(let f=0;f<nF;f++){ let s=0,c=0; for(let k=-2;k<=2;k++){ const g=f+k; if(g>=0&&g<nF){ s+=db[g]; c++; } } sm[f]=s/c; }
  const peaks=[]; let minSince=Infinity, last=-99;
  for(let f=1; f<nF-1; f++){
    minSince=Math.min(minSince, sm[f]);
    if(sm[f]>=sm[f-1] && sm[f]>sm[f+1] && sm[f]>thr && sp[f]){
      let voiced=false; for(let k=-3;k<=3;k++){ const g=f+k; if(g>=0&&g<nF&&!isNaN(f0s[g])){voiced=true;break;} }
      if(voiced && sm[f]-minSince>=2 && f-last>=7){ peaks.push(f); last=f; minSince=Infinity; }
    }
  }
  const sylRate = peaks.length / T;
  const artRate = peaks.length / Math.max(0.5, phonSec);

  const finals=[]; let engol=0, finalsN=0;
  segs.forEach((s,k)=>{
    const gapAfter = k<segs.length-1 ? gaps[k] : 9;
    if(gapAfter < 0.5 || (s.b-s.a) < 60) return;
    const lastW=[], refW=[];
    for(let f=s.b-30; f<s.b; f++) if(!isNaN(st[f])) lastW.push(st[f]);
    for(let f=Math.max(s.a,s.b-90); f<s.b-30; f++) if(!isNaN(st[f])) refW.push(st[f]);
    if(lastW.length<5 || refW.length<5) return;
    const delta = median(lastW)-median(refW);
    const segDb=[]; for(let f=s.a; f<s.b; f++) segDb.push(db[f]);
    const endDb=[]; for(let f=s.b-20; f<s.b; f++) endDb.push(db[f]);
    if(median(segDb)-mean(endDb) > 6) engol++;
    finalsN++;
    finals.push({f:s.b, type: delta<=-1 ? "down" : delta>=1 ? "up" : "flat"});
  });
  const down = finals.filter(q=>q.type==="down").length, up = finals.filter(q=>q.type==="up").length;

  let hes=0; i=0;
  while(i<nF){
    if(!isNaN(st[i])){ let j=i; while(j<nF && !isNaN(st[j])) j++;
      if(j-i>=40){ const seg=Array.from(st.subarray(i,j)); const pk=peaks.filter(p=>p>=i&&p<j).length;
        const ds=[]; for(let f=i;f<j;f++) ds.push(db[f]);
        if(std(seg)<0.6 && pk<=1 && std(ds)<2.5) hes++; }
      i=j; } else i++;
  }
  // longest pause in the last quarter of speech (pause before the reveal)
  const lastQ = start + 0.75*(end-start); let lateP=0;
  for(let k=0;k<segs.length-1;k++){ if(segs[k].b>=lastQ) lateP=Math.max(lateP, gaps[k]); }

  const spDb=[]; for(let f=start; f<end; f++) if(sp[f]) spDb.push(db[f]);
  const pkDb = peaks.map(f=>sm[f]);
  const stVoiced = Array.from(st).filter(v=>!isNaN(v));
  const lo3=pct(stVoiced,.03), hi97=pct(stVoiced,.97);
  const stTrim = stVoiced.filter(v=>v>=lo3 && v<=hi97);
  const minutes = T/60;
  const metrics = {
    durationS: T, phonationS: phonSec, speechRatio: phonSec/T, medianHz: medHz,
    pitchSD: std(stTrim), pitchRange: pct(stVoiced,.95)-pct(stVoiced,.05),
    sylRate, artRate,
    pausesPerMin: pauses.length/minutes, pausesN: pauses.length, longPauses: longP.length,
    longestPause: gaps.length? Math.max(...gaps):0, latePause: lateP,
    finalsN, downPct: finalsN? 100*down/finalsN : NaN, upPct: finalsN? 100*up/finalsN : NaN,
    swallowedPct: finalsN? 100*engol/finalsN : NaN,
    dynamicDb: pkDb.length>=8 ? pct(pkDb,.9)-pct(pkDb,.1) : pct(spDb,.9)-pct(spDb,.1),
    hesPerMin: hes/minutes, hesN: hes, snr
  };
  const series = { hopSec: HOP/SR, start, end, db: Array.from(db), st: Array.from(st), sp: Array.from(sp), floor, peak, finals };
  onProgress && onProgress(1);
  return { metrics, series };
}
function fillRuns(arr, val, maxLen, edges){
  const n=arr.length; let i=0;
  while(i<n){ if(arr[i]===val){ let j=i; while(j<n&&arr[j]===val) j++;
      const inner = i>0 && j<n; if((inner||edges) && j-i<maxLen) for(let k=i;k<j;k++) arr[k]=1-val; i=j; } else i++; }
}
function removeShortVoiced(f0, minLen){
  const n=f0.length; let i=0;
  while(i<n){ if(!isNaN(f0[i])){ let j=i; while(j<n&&!isNaN(f0[j])) j++; if(j-i<minLen) for(let k=i;k<j;k++) f0[k]=NaN; i=j; } else i++; }
}
function medianFilterNaN(a, w){
  const out=new Float32Array(a.length).fill(NaN), h=Math.floor(w/2);
  for(let i=0;i<a.length;i++){ if(isNaN(a[i])) continue; const v=[]; for(let k=-h;k<=h;k++){ const g=i+k; if(g>=0&&g<a.length&&!isNaN(a[g])) v.push(a[g]); } v.sort((p,q)=>p-q); out[i]=v[Math.floor(v.length/2)]; }
  return out;
}
/* Compact series for storage: 25 frames per second, rounded */
function packSeries(s){
  const k=4, n=Math.floor(s.db.length/k), db=[], st=[]; let sp="";
  for(let i=0;i<n;i++){
    let mx=-200, sv=[], on=0;
    for(let j=i*k;j<i*k+k;j++){ mx=Math.max(mx,s.db[j]); if(!isNaN(s.st[j])) sv.push(s.st[j]); on+=s.sp[j]; }
    db.push(Math.round(mx)); st.push(sv.length? Math.round(median(sv)*10)/10 : null); sp += on>=2 ? "1":"0";
  }
  return { hopSec:s.hopSec*k, start:Math.floor(s.start/k), end:Math.ceil(s.end/k), db, st, sp, floor:Math.round(s.floor), peak:Math.round(s.peak), finals:s.finals.map(q=>({f:Math.round(q.f/k), type:q.type})) };
}
const spAt = (s,i) => typeof s.sp==="string" ? s.sp.charCodeAt(i)===49 : !!s.sp[i];
const stAt = (s,i) => { const v=s.st[i]; return v==null ? NaN : v; };

/* ---------- Motor ao vivo (microfone) ---------- */
const live = { on:false, busy:false };
function initLive(sr){
  const k = Math.max(1, Math.round(sr/8000)), srL = sr/k;
  Object.assign(live, {
    sr, k, srL, W: Math.round(0.0375*srL), minL: Math.floor(srL/350), maxL: Math.ceil(srL/75), hopL: Math.max(1, Math.round(0.01*srL)),
    buf: new Float32Array(8192), bufLen:0, pos:0, acc:0, accN:0,
    db:[], hz:[], act:[], sm:[], chunks:[], total:0, keepAudio:true,
    floor:-60, p97:-30, thr:-50, base:NaN, voiced:[],
    peaks:0, minSince:Infinity, lastPeak:-99, firstSpeech:-1, lastSpeech:-1, maxLevel:-140,
    finalText:"", interim:"", recErr:null, warned:false, usedTr:false
  });
  live.frameLen = live.W + live.maxL + 1;
  live.fps = srL / live.hopL;
}
function feedLive(input){
  const k = live.k;
  for(let i=0;i<input.length;i++){
    live.acc += input[i]; live.accN++;
    if(live.accN===k){ pushDec(live.acc/k); live.acc=0; live.accN=0; }
  }
}
function pushDec(v){
  if(live.bufLen === live.buf.length){
    const keep = live.frameLen, drop = live.bufLen-keep;
    live.buf.copyWithin(0, drop, live.bufLen); live.pos -= drop; live.bufLen = keep;
  }
  live.buf[live.bufLen++] = v;
  while(live.pos + live.frameLen <= live.bufLen){ liveFrame(live.pos); live.pos += live.hopL; }
}
function liveFrame(p){
  const b=live.buf, W=live.W;
  let e=0; for(let j=0;j<W;j++){ const v=b[p+j]; e+=v*v; }
  const db = 10*Math.log10(e/W+1e-10);
  const fi = live.db.length;
  live.db.push(db);
  if(db>live.maxLevel) live.maxLevel=db;
  if(fi>0 && fi%50===0){ const recent=live.db.slice(-400); live.floor=pct(recent,.1); live.p97=pct(recent,.97); live.thr=live.floor+Math.max(8, 0.3*(live.p97-live.floor)); }
  let hz = NaN; const active = db > live.thr;
  if(active){
    hz = yin(b, p, W, live.minL, live.maxL, live.srL);
    if(!isNaN(hz) && !isNaN(live.base)){ if(hz>1.75*live.base && hz/2>=75) hz/=2; else if(hz<0.57*live.base && hz*2<=350) hz*=2; }
    if(live.firstSpeech<0) live.firstSpeech=fi; live.lastSpeech=fi;
  }
  live.hz.push(hz); live.act.push(active?1:0);
  if(!isNaN(hz)){ live.voiced.push(hz); const n=live.voiced.length; if(n===15 || n%40===0) live.base=median(live.voiced.slice(-2000)); }
  const s3 = (db + (live.db[fi-1]??db) + (live.db[fi-2]??db))/3; live.sm.push(s3);
  const q = fi-1;
  if(q>=1){
    const sq=live.sm[q];
    live.minSince=Math.min(live.minSince, sq);
    if(sq>=live.sm[q-1] && sq>s3 && sq>live.thr && q-live.lastPeak>=7 && sq-live.minSince>=2){
      let voiced=false; for(let g=Math.max(0,q-3); g<=fi; g++){ if(!isNaN(live.hz[g])){ voiced=true; break; } }
      if(voiced){ live.peaks++; live.lastPeak=q; live.minSince=Infinity; }
    }
  }
}
function liveActiveSec(){ return live.firstSpeech<0 ? 0 : (live.lastSpeech-live.firstSpeech)/live.fps; }
function liveToneSD(){
  if(isNaN(live.base)) return NaN;
  const L=live.hz.length, a=Math.max(0, L-Math.round(6*live.fps)), v=[];
  for(let i=a;i<L;i++){ const h=live.hz[i]; if(!isNaN(h)) v.push(12*Math.log2(h/live.base)); }
  return v.length>=80 ? std(v) : NaN;
}
function liveNow(n){
  const L=live.db?live.db.length:0; if(!L) return { db:NaN, hz:NaN };
  const a=Math.max(0,L-n); const d=live.db.slice(a), h=live.hz.slice(a).filter(v=>!isNaN(v));
  return { db: mean(d), hz: h.length? median(h) : NaN };
}
/* statistics of live frames [a,b) */
function rangeStats(a,b){
  const fps=live.fps||100, dbs=[], hz=[]; let run=0, best=0, gap=0;
  for(let i=a;i<b && i<live.db.length;i++){
    if(live.act[i]){ dbs.push(live.db[i]); run+=1+gap; gap=0; best=Math.max(best,run); }
    else { gap++; if(gap>12){ run=0; gap=0; } }
    if(!isNaN(live.hz[i])) hz.push(live.hz[i]);
  }
  const medHz = hz.length? median(hz) : NaN;
  const st = hz.length? hz.map(h=>12*Math.log2(h/medHz)) : [];
  const lo = hz.length>=10? pct(hz,.03) : NaN, hi = hz.length>=10? pct(hz,.97) : NaN;
  return {
    activeS: dbs.length/fps, voicedS: hz.length/fps,
    medDb: dbs.length? median(dbs) : NaN, maxDb: dbs.length? Math.max(...dbs) : NaN, sdDb: dbs.length>5? std(dbs) : NaN,
    relDb: dbs.length? median(dbs)-live.floor : NaN,
    medHz, sdSt: st.length>5? std(st) : NaN, lowHz: lo, highHz: hi,
    rangeSt: fin(lo)&&fin(hi)? 12*Math.log2(hi/lo) : NaN, longestRunS: best/fps
  };
}

/* ---------- Notas musicais ---------- */
const NOTE_NAMES=["Dó","Dó♯","Ré","Ré♯","Mi","Fá","Fá♯","Sol","Sol♯","Lá","Lá♯","Si"];
function noteName(hz){ if(!fin(hz)||hz<=0) return { name:"—", cents:0 }; const m=69+12*Math.log2(hz/440), r=Math.round(m); return { name: NOTE_NAMES[((r%12)+12)%12]+(Math.floor(r/12)-1), cents: Math.round((m-r)*100) }; }

/* ---------- Texto: léxico por língua ---------- */
const LEX = {
  pt:{
    fillers:["tipo","pronto","prontos","é pá","pá","basicamente","quer dizer","digamos","sabes","percebes","não é","né","hum","ahm","ãh","eh","ééé","ou seja","na verdade","literalmente","ok","okay","portanto","então"],
    hedges:["acho que","se calhar","talvez","penso que","não sei se","um bocadinho","um bocado","só queria","mais ou menos","de certa forma","tentar","espero que","julgo que","eventualmente"],
    apology:["desculpa","desculpe","peço desculpa","lamento"],
    sensory:["vi","via","vimos","olhei","olhava","brilho","brilhava","luz","cor","cores","escuro","escura","escuridão","ouvi","ouvia","ouvimos","som","barulho","silêncio","eco","estrondo","cheiro","cheirava","perfume","aroma","sabor","provei","doce","amargo","salgado","frio","fria","gelado","gelada","quente","calor","áspero","áspera","liso","lisa","macio","macia","pesado","pesada","húmido","húmida","molhado","molhada","vento","toquei","tocava","pele","poeira","pó","suor","fumo"],
    emotions:["nervoso","nervosa","nervosismo","ansioso","ansiosa","ansiedade","triste","tristeza","feliz","felicidade","contente","medo","assustado","assustada","zangado","zangada","irritado","irritada","frustrado","frustrada","emocionado","emocionada","alegre","alegria","envergonhado","envergonhada","orgulhoso","orgulhosa","entusiasmado","entusiasmada"],
    dialogue:["disse","diz","dizia","perguntou","pergunta","respondeu","responde","gritou","sussurrou","atirou","exclamou","comentou"],
    turns:["mas","só que","até que","de repente","nesse momento","foi então que","afinal","no entanto","contudo","porém","sem aviso","quando dei por mim"],
    time:["naquele dia","nessa noite","nessa manhã","nessa tarde","de manhã","à noite","era uma vez","um dia","na altura","há uns anos","no ano passado","eram"],
    numbers:["dois","duas","três","quatro","cinco","seis","sete","oito","nove","dez","doze","quinze","vinte","trinta","cem","cento","duzentos","trezentos","quatrocentos","quinhentos","mil","metade"],
    self:["eu","me","mim","meu","minha","meus","minhas","comigo"],
    other:["tu","te","ti","teu","tua","teus","tuas","contigo","você","vocês"],
    assume:["aposto","deixa-me adivinhar","tens ar de","tens cara de","parece-me que","tenho a impressão","tenho a sensação","diria que","juro que"],
    plan:["vamos","anda","bora","sábado","domingo","sexta","quinta","quarta","terça","segunda","amanhã","hoje à noite","jantar","café","copo","conheço um sítio"]
  },
  fr:{
    fillers:["euh","heu","ben","bah","genre","en fait","du coup","voilà","quoi","tu vois","vous voyez","bon","enfin","bref"],
    hedges:["je pense que","je crois que","peut-être","un peu","j'espère","éventuellement","juste","plus ou moins"],
    apology:["désolé","désolée","pardon","excusez-moi"],
    sensory:["vu","voyais","lumière","couleur","sombre","entendu","bruit","silence","odeur","parfum","goût","froid","chaud","doux","lourd","vent","peau","poussière"],
    emotions:["nerveux","nerveuse","anxieux","anxieuse","triste","heureux","heureuse","peur","fâché","frustré","ému","émue","joie","fier","fière"],
    dialogue:["a dit","dit","a demandé","a répondu","a crié","a murmuré"],
    turns:["mais","jusqu'à ce que","soudain","à ce moment","finalement","pourtant","cependant"],
    time:["ce jour-là","ce soir-là","un jour","il était une fois","l'année dernière"],
    numbers:["deux","trois","quatre","cinq","dix","vingt","cent","mille"],
    self:["je","me","moi","mon","ma","mes"], other:["tu","te","toi","ton","ta","tes","vous","votre","vos"],
    assume:["je parie","laisse-moi deviner","tu as l'air","j'ai l'impression"],
    plan:["on va","samedi","vendredi","demain","dîner","café","un verre"]
  },
  en:{
    fillers:["um","uh","erm","like","you know","basically","actually","literally","i mean","right","kind of","sort of","so yeah"],
    hedges:["i think","maybe","just","a bit","a little","hopefully","i guess","perhaps","i feel like","probably"],
    apology:["sorry","apologies","excuse me"],
    sensory:["saw","see","light","colour","color","dark","heard","sound","noise","silence","smell","scent","taste","cold","warm","hot","rough","smooth","soft","heavy","wind","skin","dust"],
    emotions:["nervous","anxious","sad","happy","afraid","scared","angry","frustrated","excited","proud","ashamed"],
    dialogue:["said","says","asked","replied","shouted","whispered"],
    turns:["but","until","suddenly","at that moment","that's when","however","turns out"],
    time:["that day","that night","one day","once upon a time","last year","years ago"],
    numbers:["two","three","four","five","ten","twenty","hundred","thousand","half"],
    self:["i","me","my","mine","myself"], other:["you","your","yours","yourself"],
    assume:["i bet","let me guess","you look like","you seem like","i get the feeling"],
    plan:["let's","saturday","friday","tomorrow","tonight","dinner","coffee","a drink"]
  }
};
const escRe = t => t.replace(/[.*+?^${}()|[\]\\]/g,"\\$&").replace(/\s+/g,"\\s+");
function countTerms(text, terms){
  const out=[];
  (terms||[]).forEach(t=>{
    const re=new RegExp("(^|[^\\p{L}])"+escRe(t)+"(?=$|[^\\p{L}])","giu");
    const m=text.match(re); if(m && m.length) out.push([t,m.length]);
  });
  return out.sort((a,b)=>b[1]-a[1]);
}
const sumCounts = list => list.reduce((s,x)=>s+x[1],0);
function wordCount(text){ return (text||"").trim().split(/\s+/).filter(w=>/\p{L}/u.test(w)).length; }
function analyzeWords(text, lang, durS){
  const t=(text||"").trim(); if(!t) return null;
  const L=LEX[lang]||LEX.pt, words=wordCount(t);
  const sentences=t.split(/[.!?…]+/).map(s=>s.trim()).filter(Boolean);
  const fillers=countTerms(t,L.fillers), hedges=countTerms(t,L.hedges.concat(L.apology));
  const fillerTotal=sumCounts(fillers);
  return { words, wpm: durS? words/(durS/60) : NaN, avgSentence: sentences.length? words/sentences.length : words,
    fillers, hedges, fillerTotal, hedgeTotal: sumCounts(hedges), fillerPerMin: durS? fillerTotal/(durS/60) : 0 };
}
function storyMarkers(text, lang){
  const t=(text||"").trim(); if(!t) return null;
  const L=LEX[lang]||LEX.pt;
  const sensory=countTerms(t,L.sensory), emotions=countTerms(t,L.emotions), dialogue=countTerms(t,L.dialogue),
        turns=countTerms(t,L.turns), time=countTerms(t,L.time), numW=countTerms(t,L.numbers);
  const digits=(t.match(/\d+/g)||[]).length, quotes=(t.match(/[“”"«»]/g)||[]).length/2;
  const n={ sensory:sumCounts(sensory), emotions:sumCounts(emotions), dialogue:sumCounts(dialogue)+Math.floor(quotes), turns:sumCounts(turns), time:sumCounts(time), numbers:sumCounts(numW)+digits };
  const parts={
    sens: Math.min(1, n.sensory/4), tens: Math.min(1, n.turns/3), dia: Math.min(1, n.dialogue/2),
    conc: Math.min(1, (n.numbers+n.time)/3), show: n.emotions===0 ? 1 : Math.max(0, 1-n.emotions/4)
  };
  const score=Math.round(100*(0.25*parts.sens+0.25*parts.tens+0.15*parts.dia+0.2*parts.conc+0.15*parts.show));
  return { ...n, lists:{ sensory, emotions, dialogue, turns }, parts, score, words: wordCount(t) };
}
function socialMarkers(text, lang){
  const t=(text||"").trim(); if(!t) return null;
  const L=LEX[lang]||LEX.pt;
  const self=sumCounts(countTerms(t,L.self)), other=sumCounts(countTerms(t,L.other));
  const assume=sumCounts(countTerms(t,L.assume)), plan=sumCounts(countTerms(t,L.plan));
  const hedges=sumCounts(countTerms(t,L.hedges)), apology=sumCounts(countTerms(t,L.apology));
  const questions=(t.match(/\?/g)||[]).length;
  const focusPct = self+other>=3 ? 100*other/(self+other) : NaN;
  const focusScore = !fin(focusPct) ? 0.7 : (focusPct>=35 && focusPct<=75 ? 1 : focusPct<35 ? focusPct/35 : Math.max(0,1-(focusPct-75)/25));
  const hedgeScore = 1-Math.min(1,(hedges+apology)/4);
  const playScore = Math.min(1, assume);
  const score=Math.round(100*(0.4*focusScore+0.35*hedgeScore+0.25*playScore));
  return { self, other, focusPct, assume, plan, hedges, apology, questions, score, words: wordCount(t) };
}
const escHtml = s => String(s==null?"":s).replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function markTranscript(text, lang){
  const L=LEX[lang]||LEX.pt;
  const cats=[["fillers","m-fill"],["hedges","m-hedge"],["apology","m-hedge"],["sensory","m-sense"],["turns","m-turn"],["dialogue","m-dial"],["emotions","m-emo"],["assume","m-play"]];
  const map=new Map(); cats.forEach(([k,cls])=>(L[k]||[]).forEach(term=>{ if(!map.has(term.toLowerCase())) map.set(term.toLowerCase(), cls); }));
  const terms=[...map.keys()].sort((a,b)=>b.length-a.length);
  if(!terms.length) return escHtml(text);
  const re=new RegExp("(^|[^\\p{L}&#;])("+terms.map(escRe).join("|")+")(?=$|[^\\p{L}])","giu");
  return escHtml(text).replace(re,(m,pre,w)=>{ const cls=map.get(w.toLowerCase().replace(/\s+/g," ")); return pre+(cls?`<mark class="${cls}">${w}</mark>`:w); });
}

/* ---------- Pontuação de voz ---------- */
const DEF = {
  tom:{name:"Variação de tom", unit:"st", min:0, max:8, lo:2.5, hi:5.5, dec:1,
    verdict:v=> !fin(v)?["Sem dados","warn"]: v<1.8?["Monótono","bad"]: v<2.5?["Pouco variado","warn"]: v<=5.5?["Expressivo","good"]:["Muito oscilante","warn"],
    hint:v=> v<2.5?"A voz anda sempre na mesma altura. Escolhe uma palavra por frase e sobe nela.": v<=5.5?"Boa melodia. Mantém a variação nas palavras que contam.":"Sobes e desces muito. Pode soar a entusiasmo forçado; assenta a voz."},
  ritmo:{name:"Ritmo", unit:"ppm", min:80, max:220, lo:125, hi:165, dec:0,
    verdict:v=> !fin(v)?["Sem dados","warn"]: v<110?["Lento","warn"]: v<125?["Calmo","good"]: v<=165?["Bom ritmo","good"]: v<=185?["Acelerado","warn"]:["Rápido demais","bad"],
    hint:v=> v>165?"Abranda nos números, nas datas e na frase final. Ritmo calmo lê-se como segurança.": v<110?"Pode soar hesitante. Encurta as frases e liga as ideias.":"Ritmo de quem está à vontade com o assunto."},
  pausas:{name:"Pausas", unit:"/min", min:0, max:36, lo:8, hi:22, dec:1,
    verdict:v=> !fin(v)?["Sem dados","warn"]: v<5?["Sem respirar","bad"]: v<8?["Poucas","warn"]: v<=22?["Bem pausado","good"]:["Fragmentado","warn"],
    hint:v=> v<8?"Falas em bloco. Faz uma pausa curta no fim de cada ideia e antes da palavra mais importante.": v<=22?"As pausas dão espaço ao que dizes.":"Muitas paragens. Liga frases curtas numa só ideia."},
  finais:{name:"Fins de frase a descer", unit:"%", min:0, max:100, lo:55, hi:100, dec:0,
    verdict:v=> !fin(v)?["Sem dados","warn"]: v>=55?["Assertivo","good"]: v>=35?["Misto","warn"]:["Interrogativo","bad"],
    hint:v=> !fin(v)?"Poucas frases completas com pausa a seguir para medir.": v>=55?"Fechas as frases com autoridade.":"Muitas frases acabam planas ou a subir. Afirmações descem na última sílaba."},
  dinamica:{name:"Dinâmica de volume", unit:"dB", min:0, max:24, lo:6, hi:14, dec:1,
    verdict:v=> !fin(v)?["Sem dados","warn"]: v<4?["Plano","bad"]: v<6?["Pouco relevo","warn"]: v<=14?["Com relevo","good"]:["Irregular","warn"],
    hint:v=> v<6?"O volume é sempre igual. Dá força às palavras-chave e baixa nos apartes.": v<=14?"Usas o volume para marcar o que importa.":"Saltos fortes de volume. Pode ser a distância ao microfone; mantém-na fixa."},
  hesitacoes:{name:"Hesitações sonoras", unit:"/min", min:0, max:10, lo:0, hi:2, dec:1,
    verdict:v=> !fin(v)?["Sem dados","warn"]: v<=2?["Limpo","good"]: v<=4?["Algumas","warn"]:["Frequentes","bad"],
    hint:v=> v<=2?"Poucos “ééé” ou “hmm” detetados.":"Sons de enchimento detetados. Troca-os por silêncio."}
};
const METRIC_KEYS = ["tom","ritmo","pausas","finais","dinamica","hesitacoes"];
const WEIGHTS = {tom:25, ritmo:15, pausas:15, finais:20, dinamica:10, hesitacoes:15};
const SYL_PER_WORD = { pt:2.0, fr:1.5, en:1.45 };
function metricValues(m, lang){
  if(!m) return {};
  return { tom:m.pitchSD, ritmo: fin(m.wpm) ? m.wpm : (m.sylRate*60/(SYL_PER_WORD[lang]||2)), pausas:m.pausesPerMin, finais:m.downPct, dinamica:m.dynamicDb, hesitacoes:m.hesPerMin };
}
function subScore(k, v){
  const d=DEF[k]; if(!fin(v)) return null;
  if(v>=d.lo && v<=d.hi) return 100;
  if(v<d.lo) return Math.max(0, 100*(1-(d.lo-v)/Math.max(1e-6,d.lo-d.min)));
  return Math.max(0, 100*(1-(v-d.hi)/Math.max(1e-6,d.max-d.hi)));
}
function voiceIndex(vals){
  let s=0,w=0; for(const k in WEIGHTS){ const sc=subScore(k, vals[k]); if(sc==null) continue; s+=sc*WEIGHTS[k]; w+=WEIGHTS[k]; }
  return w? Math.round(s/w) : 0;
}
function indexLabel(i){ return i>=85 ? "Voz de quem manda na sala" : i>=70 ? "Sólido, com margem clara" : i>=50 ? "A base está lá, falta controlo" : "Há trabalho a fazer na entrega"; }

/* ---------- Avaliação dos exercícios guiados ---------- */
const fmtN = (v,dec=0)=> !fin(v) ? "—" : Number(v).toLocaleString("pt-PT",{minimumFractionDigits:dec, maximumFractionDigits:dec});
function evalDrill(ex, steps){
  const st = steps.map(s=>s.stats||{});
  const pitchSteps = steps.map((s,i)=>i).filter(i=>ex.steps[i] && ex.steps[i].m==="pitch");
  const levelSteps = steps.map((s,i)=>i).filter(i=>ex.steps[i] && ex.steps[i].m==="level");
  const merged = idxs => { const hz=[]; idxs.forEach(i=>{ const s=steps[i]; if(!s) return; for(let f=s.a; f<s.b && f<live.hz.length; f++) if(!isNaN(live.hz[f])) hz.push(live.hz[f]); }); return hz; };
  const out = { lines:[], verdict:["Feito","good"], value:null, unit:"", headline:"" };
  if(ex.eval==="steady_level"){
    const longest = Math.max(0, ...[1,2,3].map(i=>st[i]&&fin(st[i].longestRunS)?st[i].longestRunS:0));
    const sds = levelSteps.map(i=>st[i]&&st[i].sdDb).filter(fin);
    out.value=longest; out.unit="s"; out.headline="Sopro mais longo";
    out.verdict = longest>=15?["Fôlego sólido","good"]: longest>=10?["A crescer","warn"]:["Fôlego curto","bad"];
    out.lines.push(`Objetivo: 15 segundos ou mais num só sopro.`);
    if(sds.length) out.lines.push(`Variação de volume no som contínuo: ${fmtN(median(sds),1)} dB. Abaixo de 3 dB é estável.`);
  } else if(ex.eval==="steady_pitch"){
    const hz=merged(pitchSteps); const med=hz.length?median(hz):NaN; const sds=pitchSteps.map(i=>st[i]&&st[i].sdSt).filter(fin); const sd=sds.length?median(sds):NaN;
    out.value=sd; out.unit="st"; out.headline="Estabilidade do “mmm”";
    out.verdict = !fin(sd)?["Sem dados","warn"]: sd<0.8?["Estável","good"]: sd<1.5?["Quase lá","warn"]:["Instável","bad"];
    if(fin(med)) out.lines.push(`O teu “mmm” assenta em ${fmtN(med)} Hz (${noteName(med).name}). Está perto do teu tom ótimo.`);
    out.lines.push("Abaixo de 0,8 semitons de variação, a ressonância está estável.");
  } else if(ex.eval==="range"){
    const hz=merged(pitchSteps.filter(i=>i<3)); const lo=hz.length>=10?pct(hz,.03):NaN, hi=hz.length>=10?pct(hz,.97):NaN; const r=fin(lo)&&fin(hi)?12*Math.log2(hi/lo):NaN;
    out.value=r; out.unit="st"; out.headline="Amplitude";
    out.verdict = !fin(r)?["Sem dados","warn"]: r>=14?["Amplitude larga","good"]: r>=9?["Média","warn"]:["Curta","bad"];
    if(fin(r)) out.lines.push(`Do ${noteName(lo).name} (${fmtN(lo)} Hz) ao ${noteName(hi).name} (${fmtN(hi)} Hz).`);
    out.lines.push("Objetivo: 12 semitons ou mais, que é uma oitava.");
  } else if(ex.eval==="projection"){
    const d=[0,1,2].map(i=>st[i]?st[i].medDb:NaN), h=[0,1,2].map(i=>st[i]?st[i].medHz:NaN);
    const total = fin(d[2])&&fin(d[0]) ? d[2]-d[0] : NaN, rise = fin(h[2])&&fin(h[0]) ? 12*Math.log2(h[2]/h[0]) : NaN;
    out.value=total; out.unit="dB"; out.headline="Subida de volume";
    out.verdict = !fin(total)?["Sem dados","warn"]: total>=8 && (!fin(rise)||rise<=3) ? ["Projeção com apoio","good"] : total>=8 ? ["Volume empurrado pelo tom","warn"] : ["Pouca diferença","warn"];
    if(fin(d[0])) out.lines.push(`1 m: base · 5 m: ${fin(d[1])?(d[1]-d[0]>=0?"+":"")+fmtN(d[1]-d[0],1):"—"} dB · 15 m: ${fin(d[2])?(d[2]-d[0]>=0?"+":"")+fmtN(d[2]-d[0],1):"—"} dB`);
    if(fin(rise)) out.lines.push(`O tom subiu ${fmtN(rise,1)} semitons entre 1 m e 15 m. Até 3 é sinal de apoio; acima disso estás a empurrar com a garganta.`);
  } else if(ex.eval==="optimal"){
    const hum=merged([0,1]), sp=merged([2]), sp2=merged([3]);
    const h=hum.length?median(hum):NaN, s=sp.length?median(sp):NaN, s2=sp2.length?median(sp2):NaN;
    const diff = fin(h)&&fin(s) ? 12*Math.log2(s/h) : NaN, diff2 = fin(h)&&fin(s2) ? 12*Math.log2(s2/h) : NaN;
    out.value=diff; out.unit="st"; out.headline="Fala face ao tom ótimo";
    out.verdict = !fin(diff)?["Sem dados","warn"]: Math.abs(diff)<=2?["Falas no teu tom","good"]: diff>2?["Acima do teu tom","warn"]:["Abaixo do teu tom","warn"];
    if(fin(h)) out.lines.push(`Tom ótimo (“mm-hmm”): ${fmtN(h)} Hz (${noteName(h).name}).`);
    if(fin(s)) out.lines.push(`Primeira leitura: ${fmtN(s)} Hz (${diff>=0?"+":""}${fmtN(diff,1)} st).`);
    if(fin(s2)) out.lines.push(`Segunda leitura: ${fmtN(s2)} Hz (${diff2>=0?"+":""}${fmtN(diff2,1)} st).`);
  } else if(ex.eval==="warmup"){
    const hz=merged(pitchSteps); const lo=hz.length>=10?pct(hz,.03):NaN, hi=hz.length>=10?pct(hz,.97):NaN; const r=fin(lo)&&fin(hi)?12*Math.log2(hi/lo):NaN;
    const cnt = st[4]&&st[4].medDb, base = st[5]&&st[5].medDb;
    out.value=r; out.unit="st"; out.headline="Amplitude usada";
    out.verdict=["Voz aquecida","good"];
    if(fin(cnt)&&fin(base)) out.lines.push(`A contagem projetada ficou ${fmtN(cnt-base,1)} dB acima da tua frase de abertura.`);
    out.lines.push("Faz esta rotina antes de chamadas e reuniões importantes.");
  }
  return out;
}

/* ---------- Estatísticas ---------- */
const DAY = 86400000;
function dayKey(ts){ const d=new Date(ts); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }
function startOfDay(ts){ const d=new Date(ts); d.setHours(0,0,0,0); return d.getTime(); }
function weekStart(ts){ const d=new Date(startOfDay(ts)); const wd=(d.getDay()+6)%7; return d.getTime()-wd*DAY; }
function streakInfo(sessions, now){
  const days=new Set(sessions.map(s=>dayKey(s.at)));
  let d=startOfDay(now); if(!days.has(dayKey(d))) d-=DAY;
  let cur=0; while(days.has(dayKey(d))){ cur++; d-=DAY; }
  const sorted=[...days].sort(); let best=0, run=0, prev=null;
  sorted.forEach(k=>{ const t=new Date(k+"T12:00:00").getTime(); run = prev!=null && Math.round((t-prev)/DAY)===1 ? run+1 : 1; best=Math.max(best,run); prev=t; });
  return { current:cur, best, today: days.has(dayKey(now)) };
}
function xpOf(s){
  if(s.kind==="fala") return 10 + Math.round((s.index||0)/10);
  if(s.kind==="drill") return 8 + (s.rating||0);
  if(s.kind==="quiz") return 4 + 2*(s.score||0);
  if(s.kind==="escrita") return 10 + (s.claude?2:0);
  return 5;
}
const LEVELS=[{n:"Bruto",xp:0},{n:"Serrado",xp:60},{n:"Amaciado",xp:160},{n:"Polido",xp:320},{n:"Obra-prima",xp:560}];
function levelOf(xp){
  let i=0; for(let k=0;k<LEVELS.length;k++) if(xp>=LEVELS[k].xp) i=k;
  const next=LEVELS[i+1]; const pctv = next ? (xp-LEVELS[i].xp)/(next.xp-LEVELS[i].xp) : 1;
  return { i, name:LEVELS[i].n, next: next?next.n:null, toNext: next? next.xp-xp : 0, pct: clamp(pctv,0,1) };
}
function trackXP(sessions){ const o={voz:0,historia:0,social:0,negocio:0}; sessions.forEach(s=>{ if(o[s.track]!=null) o[s.track]+=xpOf(s); }); return o; }
function speakingMin(s){ if(s.kind==="fala") return (s.metrics&&s.metrics.durationS||0)/60; if(s.kind==="drill") return (s.durS||0)/60; return 0; }
function hashStr(str){ let h=2166136261; for(let i=0;i<str.length;i++){ h^=str.charCodeAt(i); h=Math.imul(h,16777619); } return h>>>0; }
function seeded(seed){ let s=seed||1; return ()=>{ s=(Math.imul(s,1664525)+1013904223)>>>0; return s/4294967296; }; }
