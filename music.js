'use strict';
/* Pemutar musik chiptune: mesin WebAudio kecil yang memainkan data dari music-data.js.
   Suara dihasilkan di perangkat pemain, jadi tidak ada file audio dan tidak ada lisensi lagu. */
const MusicBox=(()=>{
  const STORE='slrpg-music-v1';
  const freq=m=>440*Math.pow(2,(m-69)/12);
  let ctx=null,master=null,delaySend=null,noiseBuf=null;
  let playing=false,timerID=0,nextTime=0,stepIdx=0,trackName='kota',moodState='kota';
  let pref={on:true,vol:.45};
  try{const p=JSON.parse(localStorage.getItem(STORE)||'{}');if(typeof p.on==='boolean')pref.on=p.on;if(typeof p.vol==='number')pref.vol=Math.min(1,Math.max(0,p.vol));}catch(e){}
  function persist(){try{localStorage.setItem(STORE,JSON.stringify(pref));}catch(e){}}

  function ensureCtx(){
    if(ctx)return true;
    const AC=window.AudioContext||window.webkitAudioContext;
    if(!AC)return false;
    ctx=new AC();
    const comp=ctx.createDynamicsCompressor();
    master=ctx.createGain();
    master.gain.value=pref.on?pref.vol:0;
    master.connect(comp);comp.connect(ctx.destination);
    delaySend=ctx.createGain();delaySend.gain.value=1;
    const dl=ctx.createDelay(.6);dl.delayTime.value=.23;
    const fb=ctx.createGain();fb.gain.value=.24;
    const wet=ctx.createGain();wet.gain.value=.16;
    delaySend.connect(dl);dl.connect(fb);fb.connect(dl);dl.connect(wet);wet.connect(master);
    const len=ctx.sampleRate*.09,buf=ctx.createBuffer(1,len,ctx.sampleRate),d=buf.getChannelData(0);
    for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*(1-i/len);
    noiseBuf=buf;
    return true;
  }
  function tone(midi,t,dur,type,vol,echo){
    const o=ctx.createOscillator(),g=ctx.createGain();
    o.type=type;o.frequency.value=freq(midi);
    g.gain.setValueAtTime(0,t);
    g.gain.linearRampToValueAtTime(vol,t+.012);
    g.gain.exponentialRampToValueAtTime(.0008,t+dur);
    o.connect(g);g.connect(master);
    if(echo)g.connect(delaySend);
    o.start(t);o.stop(t+dur+.03);
  }
  function hat(t,vol){
    const src=ctx.createBufferSource();src.buffer=noiseBuf;
    const f=ctx.createBiquadFilter();f.type='highpass';f.frequency.value=6500;
    const g=ctx.createGain();g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0008,t+.05);
    src.connect(f);f.connect(g);g.connect(master);src.start(t);src.stop(t+.09);
  }
  function playStep(track,idx,t){
    const stepDur=60/track.bpm/4;
    for(const e of track.lead)if(e.step===idx)tone(e.midi,t,e.len*stepDur*.92,'square',.14,true);
    for(const e of track.bass)if(e.step===idx)tone(e.midi,t,e.len*stepDur*.95,'triangle',.2,false);
    if(track.hats.includes(idx))hat(t,.05);
  }
  function schedule(){
    const track=MUSIC_DATA.TRACKS[trackName];
    const stepDur=60/track.bpm/4;
    while(nextTime<ctx.currentTime+.14){
      playStep(track,stepIdx,nextTime);
      stepIdx=(stepIdx+1)%track.total;
      nextTime+=stepDur;
    }
  }
  function start(){
    if(!ensureCtx())return;
    ctx.resume();
    if(playing)return;
    playing=true;pref.on=true;persist();
    stepIdx=0;nextTime=ctx.currentTime+.06;
    timerID=setInterval(schedule,30);
    ui();
  }
  function stop(){
    playing=false;pref.on=false;persist();
    clearInterval(timerID);
    ui();
  }
  function sting(name){
    if(!ensureCtx())return;
    const notes=MUSIC_DATA.STINGS[name];if(!notes)return;
    ctx.resume();
    const t0=ctx.currentTime+.05;
    for(const n of notes){tone(n.m,t0+n.t,n.d,'square',.16,true);tone(n.m-12,t0+n.t,n.d,'triangle',.14,false);}
  }
  function mood(name){
    if(name==='victory'||name==='death'){
      if(moodState!==name){if(playing){clearInterval(timerID);playing=false;}sting(name);}
      moodState=name;ui();return;
    }
    moodState=name;
    if(name!==trackName){trackName=name;if(playing){stepIdx=0;nextTime=Math.max(nextTime,ctx.currentTime+.05);}}
    ui();
  }
  function sfx(name){
    if(!playing||!ctx)return;
    const t=ctx.currentTime+.01;
    if(name==='coin'){tone(88,t,.06,'square',.12,false);tone(95,t+.06,.14,'square',.12,false);}
    else if(name==='plant'){tone(72,t,.08,'triangle',.16,false);tone(79,t+.08,.12,'triangle',.14,false);}
    else if(name==='harvest'){tone(72,t,.07,'square',.11,false);tone(76,t+.07,.07,'square',.11,false);tone(81,t+.14,.14,'square',.12,false);}
    else if(name==='punch'){
      const src=ctx.createBufferSource();src.buffer=noiseBuf;
      const f=ctx.createBiquadFilter();f.type='lowpass';f.frequency.value=900;
      const g=ctx.createGain();g.gain.setValueAtTime(.5,t);g.gain.exponentialRampToValueAtTime(.001,t+.16);
      src.connect(f);f.connect(g);g.connect(master);src.start(t);src.stop(t+.18);
      tone(45,t,.12,'sawtooth',.16,false);
    }
  }
  function userGesture(){if(pref.on&&!playing)start();}
  function setVolume(v){pref.vol=Math.min(1,Math.max(0,v));if(master)master.gain.value=pref.on?pref.vol:0;persist();ui();}
  function isPlaying(){return playing;}

  // ---- Panel pemutar ----
  function ui(){
    const btn=document.getElementById('music-btn'),dot=document.getElementById('music-dot');
    const tg=document.getElementById('mp-toggle'),tr=document.getElementById('mp-track'),vol=document.getElementById('mp-vol');
    if(btn){btn.classList.toggle('on',playing);}
    if(dot)dot.className=playing?'on':'';
    if(tg)tg.textContent=playing?'❚❚ Jeda':'▶ Putar';
    if(tr)tr.textContent=!playing?'JEDA':(MUSIC_DATA.TRACKS[trackName]?MUSIC_DATA.TRACKS[trackName].label:'—');
    if(vol&&Math.abs(vol.value/100-pref.vol)>.01)vol.value=Math.round(pref.vol*100);
  }
  function bind(){
    const btn=document.getElementById('music-btn'),panel=document.getElementById('music-panel');
    const tg=document.getElementById('mp-toggle'),vol=document.getElementById('mp-vol');
    if(!btn||!panel)return;
    btn.addEventListener('click',()=>{
      if(panel.hidden){panel.hidden=false;if(!playing){start();}return;}
      panel.hidden=true;
    });
    if(tg)tg.addEventListener('click',()=>{playing?stop():start();});
    if(vol)vol.addEventListener('input',()=>{setVolume(vol.value/100);if(!playing&&pref.vol>0)start();});
    document.addEventListener('click',e=>{if(!panel.hidden&&!panel.contains(e.target)&&e.target!==btn&&!btn.contains(e.target))panel.hidden=true;});
  }
  if(typeof document!=='undefined'){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{bind();ui();});else{bind();ui();}}

  const api={mood,sfx,userGesture,setVolume,isPlaying,start,stop,
    get track(){return trackName;}};
  if(typeof window!=='undefined')window.MusicBox=api;
  return api;
})();
