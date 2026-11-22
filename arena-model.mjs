const randomId=()=>crypto.randomUUID().replaceAll('-','').slice(0,24);
const WEAPONS={pistol:{damage:25,delay:350,clip:12,reload:1200},carbine:{damage:20,delay:150,clip:24,reload:1800},smg:{damage:12,delay:90,clip:30,reload:1800},marksman:{damage:50,delay:850,clip:6,reload:2200},shotgun:{damage:40,delay:650,clip:6,reload:1900}};
const COVERS=[[-3,-2,2,2],[3,2,2,2],[-3,5,3,1],[3,-5,3,1]];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const finite=n=>typeof n==='number'&&Number.isFinite(n);
function blocked(x,z){return Math.abs(x)>9.5||Math.abs(z)>9.5||COVERS.some(([a,b,w,d])=>Math.abs(x-a)<w/2+.35&&Math.abs(z-b)<d/2+.35);}
function lineBlocked(ax,az,bx,bz){for(let i=1;i<80;i++){const f=i/80;if(COVERS.some(([x,z,w,d])=>Math.abs(ax+(bx-ax)*f-x)<w/2&&Math.abs(az+(bz-az)*f-z)<d/2))return true;}return false;}
class Arena {
 constructor(){this.rooms=new Map();}
 join(roomCode,mode,name,now=Date.now()){
  if(!/^[A-Z0-9]{4,8}$/.test(roomCode)||!['duel','bomb'].includes(mode))throw Error('bad_room');
  let r=this.rooms.get(roomCode);
  if(!r){r={code:roomCode,mode,players:[],until:now+180000,device:null,message:'Menunggu dua pemain nyata',winner:''};this.rooms.set(roomCode,r);}
  if(r.closed||r.mode!==mode||r.players.length>=2)throw Error('room_full_or_mode');
  const i=r.players.length,p={id:randomId(),name:String(name||'Pemain').replace(/[^\p{L}\p{N} _-]/gu,'').slice(0,20)||'Pemain',team:i===0?'Mafia':'Police',role:i===1&&mode==='bomb'?'SWAT':'',x:i===0?-7:7,z:0,yaw:i===0?-Math.PI/2:Math.PI/2,pitch:0,hp:100,score:0,weapon:'carbine',ammo:24,lastFire:0,reloading:0,input:{x:0,z:0,fire:false,use:false},lastInput:now,deadUntil:0,seq:0,rate:0,window:now,events:[]};
  r.players.push(p);if(r.players.length===2){r.until=now+180000;r.message='Mafia vs Police. Semua senjata virtual gratis.';}return{room:r,player:p};
 }
 input(p,msg,now=Date.now()){
  if(now-p.window>1000){p.window=now;p.rate=0;}if(++p.rate>60)throw Error('rate_limit');
  const allowed=['type','seq','x','z','yaw','pitch','fire','use','weapon','reload'];
  if(Object.keys(msg).some(k=>!allowed.includes(k)))throw Error('unexpected_field');
  if(!Number.isSafeInteger(msg.seq)||msg.seq<=p.seq)throw Error('old_sequence');
  if(![msg.x,msg.z,msg.yaw,msg.pitch].every(finite))throw Error('bad_input');
  p.seq=msg.seq;p.input={x:clamp(msg.x,-1,1),z:clamp(msg.z,-1,1),fire:msg.fire===true,use:msg.use===true};p.yaw=Math.atan2(Math.sin(msg.yaw),Math.cos(msg.yaw));p.pitch=clamp(msg.pitch,-1.25,1.25);p.lastInput=now;
  if(msg.weapon&&WEAPONS[msg.weapon]&&msg.weapon!==p.weapon){p.weapon=msg.weapon;p.ammo=0;p.reloading=now+WEAPONS[p.weapon].reload;}
  if(msg.reload===true&&p.reloading===0){p.reloading=now+WEAPONS[p.weapon].reload;}
 }
 tick(dt,now=Date.now()){
  dt=clamp(dt,0,.1);
  for(const [key,r] of this.rooms){
   if(r.players.length===0){this.rooms.delete(key);continue;}
   if(r.players.length!==2||r.winner||r.stopped)continue;
   if(now>=r.until){r.winner=r.players[0].score===r.players[1].score?'Seri':r.players.slice().sort((a,b)=>b.score-a.score)[0].team;r.message='Waktu habis';continue;}
   for(const p of r.players){
    if(p.deadUntil){if(now<p.deadUntil)continue;p.deadUntil=0;p.hp=100;p.x=p.team==='Mafia'?-7:7;p.z=0;}
    if(p.reloading&&now>=p.reloading){p.ammo=WEAPONS[p.weapon].clip;p.reloading=0;}
    if(now-p.lastInput>350)continue;
    const v=p.input,len=Math.max(1,Math.hypot(v.x,v.z));const dx=v.x/len*4.5*dt,dz=v.z/len*4.5*dt;
    if(!blocked(p.x+dx,p.z))p.x+=dx;if(!blocked(p.x,p.z+dz))p.z+=dz;
    const w=WEAPONS[p.weapon];
    if(v.fire&&!p.reloading&&p.ammo>0&&now-p.lastFire>=w.delay){
     p.ammo--;p.lastFire=now;
     const t=r.players.find(q=>q.id!==p.id);
     if(t&&!t.deadUntil){
      const dx=t.x-p.x,dz=t.z-p.z,dist=Math.hypot(dx,dz),fx=-Math.sin(p.yaw),fz=-Math.cos(p.yaw);
      const dot=dx*fx+dz*fz,side=Math.abs(dx*fz-dz*fx);
      if(dot>0&&dist<35&&side<.55&&Math.abs(Math.tan(p.pitch)*dist)<.9&&!lineBlocked(p.x,p.z,t.x,t.z)){
       t.hp=Math.max(0,t.hp-w.damage);r.message=p.name+' mengenai '+t.name;
       if(t.hp===0){p.score++;t.deadUntil=now+2500;r.message=p.team+' mendapat poin';if(p.score>=3){r.winner=p.team;r.message='Menang 3 poin';}}
      }
     }
    }
   }
   if(r.mode==='bomb'&&!r.winner){
    const mafia=r.players.find(p=>p.team==='Mafia'),police=r.players.find(p=>p.team==='Police');
    // Abstract timer objective only. No real-world device details.
    if(!r.device&&mafia&&!mafia.deadUntil&&mafia.input.use&&Math.hypot(mafia.x,mafia.z)<1.8){r.device={until:now+30000};r.message='Objektif aktif. SWAT: netralkan di zona tengah.';}
    else if(r.device&&police&&!police.deadUntil&&police.input.use&&Math.hypot(police.x,police.z)<1.8){r.winner='Police';r.message='SWAT menetralkan objektif';}
    else if(r.device&&now>=r.device.until){r.winner='Mafia';r.message='Waktu objektif habis';}
   }
  }
 }
 snapshot(r,now=Date.now()){return{type:'state',mode:r.mode,time:Math.max(0,Math.ceil((r.until-now)/1000)),message:r.message,winner:r.winner,stopped:r.stopped||'',device:r.device?Math.max(0,Math.ceil((r.device.until-now)/1000)):null,players:r.players.map(p=>({id:p.id,name:p.name,team:p.team,role:p.role,x:p.x,z:p.z,yaw:p.yaw,pitch:p.pitch,hp:p.hp,score:p.score,weapon:p.weapon,ammo:p.ammo,reloading:p.reloading>now,dead:!!p.deadUntil}))};}
}

export {Arena,WEAPONS,COVERS,blocked,lineBlocked};
