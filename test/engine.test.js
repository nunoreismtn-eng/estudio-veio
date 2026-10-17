const fs=require('fs');
global.window={};
eval(fs.readFileSync('src/content.js','utf8')+"\n"+fs.readFileSync('src/engine.js','utf8')+`
(async()=>{
  // synth voice 48k with phrase-final falls and emphasis
  const SR=48000, N=SR*16, x=new Float32Array(N); let ph=0;
  for(let i=0;i<N;i++){ const t=i/SR, cyc=t%2.8; if(cyc>2.1||t<0.5){ x[i]=(Math.random()-.5)*0.002; continue; }
    const fall = cyc>1.7? -3*(cyc-1.7)/0.4 : 0; const f=118*Math.pow(2,(3*Math.sin(2*Math.PI*0.6*t)+fall)/12);
    ph+=2*Math.PI*f/SR; let s=0; for(let h=1;h<8;h++) s+=Math.sin(h*ph)/h; const emph=1+0.6*Math.sin(2*Math.PI*0.9*t), env=0.5+0.5*Math.sin(2*Math.PI*5*t);
    x[i]=0.12*s*env*emph+(Math.random()-.5)*0.002; }
  const fake={sampleRate:SR,numberOfChannels:1,length:N,getChannelData:()=>x};
  const {metrics,series}=await analyzeVoice(toMono8k(fake,300).x);
  const v=metricValues(metrics,'pt');
  console.log('VOICE', Object.fromEntries(Object.entries(v).map(([k,x])=>[k,+x.toFixed(2)])), 'idx', voiceIndex(v), 'late', metrics.latePause.toFixed(2));
  const p=packSeries(series); console.log('PACK len', p.db.length, 'sp', p.sp.length, 'json KB', (JSON.stringify(p).length/1024).toFixed(1), 'finals', p.finals.length);
  // live + drill eval
  initLive(SR); for(let o=0;o<N;o+=4096) feedLive(x.subarray(o,Math.min(N,o+4096)));
  const L=live.db.length, q=Math.floor(L/4);
  const steps=[0,1,2,3].map(i=>({a:i*q,b:(i+1)*q}));
  steps.forEach(s=>s.stats=rangeStats(s.a,s.b));
  console.log('STEP', JSON.stringify(steps[0].stats,(k,v)=>typeof v==='number'?+v.toFixed(2):v));
  ['range','steady_pitch','projection','optimal'].forEach(ev=>{ const ex={eval:ev, steps:[{m:'pitch'},{m:'pitch'},{m:'pitch'},{m:'pitch'}]}; if(ev==='projection') ex.steps.forEach(s=>s.m='level'); const r=evalDrill(ex,steps); console.log('EVAL',ev, r.headline, fmtN(r.value,1), r.verdict.join('/'), '|', r.lines.join(' | ')); });
  const wu=EX_BY_ID['aquecimento']; const st6=[0,1,2,3,4,5].map(i=>({a:Math.floor(i*L/6),b:Math.floor((i+1)*L/6)})); st6.forEach(s=>s.stats=rangeStats(s.a,s.b)); console.log('WARMUP', JSON.stringify(evalDrill(wu,st6)));
  const sl=EX_BY_ID['respiracao']; const st5=[0,1,2,3,4].map(i=>({a:Math.floor(i*L/5),b:Math.floor((i+1)*L/5)})); st5.forEach(s=>s.stats=rangeStats(s.a,s.b)); console.log('BREATH', JSON.stringify(evalDrill(sl,st5)));
  const story="Eram três da manhã e o camião estava preso na serra. Ouvi o vento a bater na lona, o frio entrava pela pele. Mas o motorista disse: “daqui não passamos”. De repente, vi uma luz. Afinal era o dono da obra, com 2 cafés.";
  console.log('STORY', JSON.stringify(storyMarkers(story,'pt')));
  const soc="Deixa-me adivinhar, tens ar de quem desenha casas com janelas enormes. Eu acho que tu és daquelas que escolhe o vinho pelo rótulo. Vamos ao bar de vinhos na quinta?";
  console.log('SOCIAL', JSON.stringify(socialMarkers(soc,'pt')));
  console.log('MARK', markTranscript("Pronto, eu acho que vi a luz, mas tipo... deixa-me adivinhar & <b>", 'pt'));
  console.log('WORDS', JSON.stringify(analyzeWords("Pronto, tipo, eu acho que se calhar desculpa", 'pt', 30)));
  const now=new Date('2026-10-17T15:00:00').getTime(); const ss=[0,1,2,4,5].map(d=>({at: now-d*DAY, track:'voz', kind:'fala', index:70}));
  console.log('STREAK', JSON.stringify(streakInfo(ss,now)), 'XP', JSON.stringify(trackXP(ss)), JSON.stringify(levelOf(170)));
  console.log('EX count', EX.length, Object.fromEntries(TRACK_ORDER.map(t=>[t, EX.filter(e=>e.track===t).length])));
  console.log('note', noteName(110).name, noteName(261.6).name);
})();
`);
