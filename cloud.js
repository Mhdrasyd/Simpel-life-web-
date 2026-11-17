'use strict';
/* Cloud Save: sinkronkan progres ke penyimpanan Redis lewat /api/cloud.
   localStorage tetap penyimpanan utama; cloud adalah cadangan + pindah perangkat.
   Kalau server belum diaktifkan atau sedang offline, game jalan normal tanpa cloud. */
const CloudSave=(()=>{
  const SLOT_KEY='slrpg-cloud-slot',PREF_KEY='slrpg-cloud-pref';
  let slot=null,pref={auto:true},status='checking',cloudEntry=null,lastSync=0,timer=0;
  try{slot=localStorage.getItem(SLOT_KEY);}catch(e){}
  try{const p=JSON.parse(localStorage.getItem(PREF_KEY)||'{}');if(typeof p.auto==='boolean')pref.auto=p.auto;}catch(e){}

  const ABC='ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  function newSlot(){
    const b=new Uint8Array(8);crypto.getRandomValues(b);
    let s='';for(const x of b)s+=ABC[x%ABC.length];
    return s.slice(0,4)+'-'+s.slice(4);
  }
  function normSlot(s){return String(s||'').toUpperCase().replace(/[^A-Z0-9]/g,'');}
  function ensureSlot(){
    if(!slot){slot=newSlot();try{localStorage.setItem(SLOT_KEY,slot);}catch(e){}}
    return slot;
  }
  function persistPref(){try{localStorage.setItem(PREF_KEY,JSON.stringify(pref));}catch(e){}}

  async function api(path,opts){
    const r=await fetch(path,opts);
    let j=null;try{j=await r.json();}catch(e){}
    return{status:r.status,body:j};
  }
  async function check(){
    status='checking';paint();
    try{
      const {status:code,body}=await api('/api/cloud?slot='+encodeURIComponent(ensureSlot()));
      if(code===503&&body&&body.reason==='unconfigured'){status='unconfigured';cloudEntry=null;}
      else if(code===404){status='ready';cloudEntry=null;}
      else if(code===200&&body&&body.ok){status='ready';cloudEntry=body.entry||null;}
      else status='offline';
    }catch(e){status='offline';}
    paint();badge();
    return status;
  }
  async function push(state,force){
    if(!state)return false;
    if(!force&&status==='unconfigured')return false;
    try{
      const savedAt=state.savedAt||Date.now();
      const {status:code,body}=await api('/api/cloud',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({slot:ensureSlot(),savedAt,state})});
      if(code===200&&body&&body.ok){status='ready';lastSync=Date.now();paint();badge();return true;}
      if(code===503){status='unconfigured';}else{status='offline';}
    }catch(e){status='offline';}
    paint();badge();
    return false;
  }
  async function pull(){
    try{
      const {status:code,body}=await api('/api/cloud?slot='+encodeURIComponent(ensureSlot()));
      if(code===200&&body&&body.ok){cloudEntry=body.entry||null;status='ready';}
      else if(code===404){cloudEntry=null;status='ready';}
      else if(code===503){status='unconfigured';}
      else status='offline';
    }catch(e){status='offline';}
    paint();badge();
    return cloudEntry;
  }
  function afterLocalSave(state){
    if(!pref.auto)return;
    clearTimeout(timer);
    timer=setTimeout(()=>{if(Date.now()-lastSync>4000)push(state);},1500);
  }
  function flush(){
    const h=window.SLRPG;if(!h||!h.getState)return;
    const state=h.getState();if(!state||!pref.auto)return;
    try{navigator.sendBeacon('/api/cloud',new Blob([JSON.stringify({slot:ensureSlot(),savedAt:state.savedAt||Date.now(),state})],{type:'application/json'}));}catch(e){}
  }
  window.addEventListener('pagehide',flush);

  function adopt(input){
    const c=normSlot(input);
    if(c.length!==8)return null;
    slot=c.slice(0,4)+'-'+c.slice(4);
    try{localStorage.setItem(SLOT_KEY,slot);}catch(e){}
    check();
    return slot;
  }

  // ---- Panel modal ----
  function statusText(){
    if(status==='checking')return'⏳ Memeriksa server...';
    if(status==='ready')return cloudEntry?'● Aktif — ada cadangan di cloud':'● Aktif — belum ada cadangan';
    if(status==='unconfigured')return'○ Belum diaktifkan di server (lihat panduan di README)';
    return'○ Server tidak terjangkau — progres tetap aman di perangkat ini';
  }
  function fmt(ts){if(!ts)return'-';try{return new Date(ts).toLocaleString('id-ID',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});}catch(e){return'-';}}
  function paint(){
    const m=document.getElementById('cloud-modal');if(!m||m.hidden)return;
    const q=s=>m.querySelector(s);
    q('#cm-status').textContent=statusText();
    q('#cm-slot').textContent=slot||'—';
    q('#cm-sync').textContent=lastSync?fmt(lastSync):'-';
    const ce=cloudEntry&&cloudEntry.state;
    q('#cm-cloud-info').textContent=ce?`Cadangan: ${ce.name||'?'} · Hari ke-${ce.day||'?'} · $${(ce.money||0).toLocaleString('en-US')} · ${fmt(cloudEntry.savedAt)}`:'';
    q('#cm-auto').checked=pref.auto;
  }
  function badge(){
    const d=document.getElementById('cloud-dot');if(!d)return;
    d.className=status==='ready'?'on':status==='checking'?'busy':'';
  }
  function open(){
    const m=document.getElementById('cloud-modal');if(!m)return;
    if(!m.dataset.built){build(m);m.dataset.built='1';}
    m.hidden=false;paint();check();
  }
  function close(){const m=document.getElementById('cloud-modal');if(m)m.hidden=true;}
  function copySlot(){
    const t=slot||'';
    const done=()=>{const b=document.getElementById('cm-copy');if(b){b.textContent='Tersalin ✓';setTimeout(()=>{b.textContent='Salin';},1600);}};
    if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t).then(done,done);}
    else{const ta=document.createElement('textarea');ta.value=t;document.body.appendChild(ta);ta.select();try{document.execCommand('copy');}catch(e){}ta.remove();done();}
  }
  function validState(st){return st&&st.version===1&&Array.isArray(st.completed_side_quests)&&st.farm&&Array.isArray(st.log);}
  async function restoreNow(){
    const entry=await pull();
    if(status==='unconfigured'){alert('Cloud save belum diaktifkan di server. Ikuti langkah satu kali di README, lalu deploy ulang.');return;}
    if(!entry||!validState(entry.state)){alert('Belum ada progres tersimpan di cloud untuk kode ini.');return;}
    const ce=entry.state;
    if(!confirm(`Pulihkan progres cloud?\n\n${ce.name||'?'} · Hari ke-${ce.day||'?'} · $${(ce.money||0).toLocaleString('en-US')}\n\nProgres di perangkat ini akan diganti.`))return;
    if(window.SLRPG&&window.SLRPG.restoreState){window.SLRPG.restoreState(entry.state);close();}
  }
  async function saveNow(){
    const h=window.SLRPG;const state=h&&h.getState?h.getState():null;
    if(!state){alert('Mulai atau lanjutkan game dulu, baru bisa menyimpan ke cloud.');return;}
    if(status==='unconfigured'){alert('Cloud save belum diaktifkan di server. Ikuti langkah satu kali di README, lalu deploy ulang.');return;}
    const ok=await push(state,true);
    if(ok){const b=document.getElementById('cm-save-now');if(b){b.textContent='Tersimpan ✓';setTimeout(()=>{b.textContent='Simpan ke Cloud sekarang';},1600);}}
    else alert('Gagal menyimpan. Coba lagi saat koneksi bagus.');
  }
  function build(m){
    m.innerHTML=`<div class="cloud-panel" role="dialog" aria-modal="true" aria-label="Cloud Save">
      <div class="cp-head"><span class="eyebrow">CLOUD SAVE</span><button type="button" id="cm-close" class="icon-btn" aria-label="Tutup">✕</button></div>
      <p id="cm-status" class="cp-status"></p>
      <div class="cp-slot"><small>KODE SAVE KAMU</small><div class="cp-slot-row"><code id="cm-slot">—</code><button type="button" id="cm-copy">Salin</button></div>
      <small>Simpan kode ini. Di HP/perangkat lain, masukkan kode yang sama untuk melanjutkan progres.</small></div>
      <div class="cp-adopt"><small>PUNYA KODE DARI PERANGKAT LAIN?</small><div class="cp-slot-row"><input id="cm-adopt" placeholder="XXXX-XXXX" maxlength="9" autocomplete="off"><button type="button" id="cm-adopt-btn">Hubungkan</button></div></div>
      <p id="cm-cloud-info" class="muted"></p>
      <div class="cp-actions"><button type="button" id="cm-save-now" class="primary">Simpan ke Cloud sekarang</button><button type="button" id="cm-restore">Pulihkan dari Cloud</button></div>
      <label class="cp-auto"><input type="checkbox" id="cm-auto"> Sinkron otomatis setelah setiap aksi</label>
      <small>Sinkron terakhir: <span id="cm-sync">-</span></small>
      <p class="hint">Progres tetap tersimpan otomatis di perangkat ini walau cloud mati. Cloud save butuh satu kali setup gratis di dashboard Vercel (langkah persisnya ada di README).</p>
    </div>`;
    m.querySelector('#cm-close').addEventListener('click',close);
    m.addEventListener('click',e=>{if(e.target===m)close();});
    m.querySelector('#cm-copy').addEventListener('click',copySlot);
    m.querySelector('#cm-save-now').addEventListener('click',saveNow);
    m.querySelector('#cm-restore').addEventListener('click',restoreNow);
    m.querySelector('#cm-adopt-btn').addEventListener('click',()=>{
      const v=m.querySelector('#cm-adopt').value;
      if(!adopt(v)){alert('Format kode tidak dikenal. Contoh: KOTA-7F2K');return;}
      m.querySelector('#cm-adopt').value='';
      paint();
    });
    m.querySelector('#cm-auto').addEventListener('change',e=>{pref.auto=e.target.checked;persistPref();});
  }
  function bind(){
    const b=document.getElementById('cloud-btn');
    if(b)b.addEventListener('click',open);
  }
  if(typeof document!=='undefined'){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();}

  const apiOut={open,check,push,pull,afterLocalSave,adopt,
    get slot(){return slot;},
    get status(){return status;},
    get cloudEntry(){return cloudEntry;}};
  if(typeof window!=='undefined')window.CloudSave=apiOut;
  return apiOut;
})();
