import http from 'node:http';
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import {WebSocketServer} from 'ws';
import {Arena} from './arena-model.mjs';
const inputKeys=new Set(['type','seq','x','z','yaw','pitch','fire','use','weapon','reload']);
const joinKeys=new Set(['type','room','mode','name']);
const modes=new Set(['duel','bomb']);
// Dedicated single-process authority. No RPG, Redis, payment, or persistence binding.
export function createArenaServer({origin,assets,maxRooms=1,lifetimeMs=240000,tls,allowedOrigin=origin,backendOnly=false}={}){
 if(!/^https?:\/\/(127\.0\.0\.1:\d+|[a-zA-Z0-9.-]+(?::\d+)?)$/.test(origin||'')||!Number.isInteger(maxRooms)||maxRooms<1||maxRooms>16||!Number.isInteger(lifetimeMs)||(lifetimeMs!==0&&(lifetimeMs<10000||lifetimeMs>240000)))throw Error('invalid_configuration');
 if(!/^https?:\/\/(127\.0\.0\.1:\d+|[a-zA-Z0-9.-]+(?::\d+)?)$/.test(allowedOrigin||''))throw Error('invalid_allowed_origin');
 const rooms=new Map(),started=Date.now(),deadline=lifetimeMs===0?Infinity:started+lifetimeMs;
 const stats={accepted:0,closed:0,processedInputs:0,assetBytes:0};let shuttingDown=false;
 const baseHeaders={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Permissions-Policy':'camera=(), microphone=(), geolocation=()'};
 const write=(res,status,body='')=>{res.writeHead(status,baseHeaders);res.end(body);};
 const handler=(req,res)=>{
  let url;try{url=new URL(req.url,origin);}catch{return write(res,400);}
  if(req.method!=='GET')return write(res,405);
  if(url.pathname==='/healthz'){if(req.headers.origin===allowedOrigin)res.setHeader('Access-Control-Allow-Origin',allowedOrigin);res.setHeader('Vary','Origin');return write(res,200,JSON.stringify(backendOnly?{ready:!shuttingDown}:{ready:!shuttingDown,rooms:rooms.size,remainingMs:Math.max(0,deadline-Date.now())}));}
  if(shuttingDown)return write(res,503);
  if(backendOnly)return write(res,404);
  if(url.pathname==='/fps-config.js'){res.writeHead(200,{...baseHeaders,'Content-Type':'text/javascript'});return res.end('window.FPS_BACKEND_URL='+JSON.stringify(origin.replace(/^http/,'ws'))+';');}
  const rel=url.pathname==='/'?'index.html':url.pathname.slice(1);
  if(!/^[a-zA-Z0-9._-]+$/.test(rel)||!assets||rel==='_headers')return write(res,404);
  const file=path.join(assets,rel);
  fs.readFile(file,(error,bytes)=>{if(error)return write(res,404);if(stats.assetBytes+bytes.length>33554432)return write(res,503);stats.assetBytes+=bytes.length;
   const type=rel.endsWith('.wasm')?'application/wasm':rel.endsWith('.pck')?'application/octet-stream':rel.endsWith('.html')?'text/html':rel.endsWith('.js')?'text/javascript':rel.endsWith('.png')?'image/png':'application/octet-stream';
   const headers={...baseHeaders,'Content-Type':type,'Content-Security-Policy':"default-src 'self'; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' "+origin.replace(/^http/,'ws')+"; worker-src 'self' blob:; frame-ancestors 'none'; object-src 'none'; base-uri 'self'"};
   if(rel.endsWith('.wasm')||rel.endsWith('.pck'))headers['Content-Encoding']='br';
   res.writeHead(200,headers);res.end(bytes);
  });
 };
 const server=tls?https.createServer(tls,handler):http.createServer(handler);
 server.maxConnections=64;server.headersTimeout=5000;server.requestTimeout=10000;server.keepAliveTimeout=2000;server.maxRequestsPerSocket=100;
 const wss=new WebSocketServer({noServer:true,maxPayload:2048,perMessageDeflate:false});
 function send(ws,data){if(ws.readyState!==1)return;try{if(ws.bufferedAmount>65536)throw Error('slow_peer');ws.send(JSON.stringify(data));}catch{finish(ws.room,'Koneksi terlalu lambat. Pilih ruang baru.');}}
 function broadcast(room){const state=room.arena.rooms.get(room.code);if(state)for(const[ws,c]of room.clients)if(c.player)send(ws,room.arena.snapshot(state));}
 function finish(room,message='',winner=false){
  if(!room||room.closed)return;room.closed=true;clearInterval(room.tick);clearTimeout(room.lobby);
  const state=room.arena.rooms.get(room.code);if(state&&message){state.message=message;state.stopped=message;}broadcast(room);
  for(const[ws,c]of room.clients){clearTimeout(c.joinTimeout);if(!winner)send(ws,{type:'round_closed'});try{ws.close(1000,'round_ended');setTimeout(()=>ws.terminate(),200).unref();}catch{}}
  room.clients.clear();rooms.delete(room.code);room.arena.rooms.delete(room.code);stats.closed++;
 }
 function reject(ws,reason){send(ws,{type:'error',reason});try{ws.close(1008,'invalid_request');setTimeout(()=>ws.terminate(),200).unref();}catch{}finish(ws.room,'Pemain terputus. Pilih ruang baru.');}
 server.on('upgrade',(req,socket,head)=>{
  let url;try{url=new URL(req.url,origin);}catch{socket.destroy();return;}
  const match=/^\/room\/([A-Z0-9]{4,8})$/.exec(url.pathname),mode=url.searchParams.get('mode');
  let status=0;
  if(shuttingDown||Date.now()>=deadline)status=503;
  else if(!match)status=404;
  else if(req.method!=='GET'||req.headers.origin!==allowedOrigin)status=403;
  else if(!modes.has(mode)||[...url.searchParams.keys()].length!==1)status=400;
  const code=match?.[1];let room=rooms.get(code);
  if(!status&&((room&&(room.mode!==mode||room.clients.size>=2))||(!room&&rooms.size>=maxRooms)))status=409;
  if(status){socket.end('HTTP/1.1 '+status+' Rejected\r\nConnection: close\r\nCache-Control: no-store\r\n\r\n');return;}
  if(!room){room={code,mode,arena:new Arena(),clients:new Map(),closed:false,tick:null,lobby:null,lastTick:Date.now(),lastBroadcast:0};rooms.set(code,room);}
  wss.handleUpgrade(req,socket,head,ws=>{
   ws.room=room;const c={player:null,rate:0,window:Date.now(),joinTimeout:setTimeout(()=>reject(ws,'join_timeout'),10000)};room.clients.set(ws,c);stats.accepted++;
   const disconnected=()=>{if(!room.clients.has(ws))return;clearTimeout(c.joinTimeout);room.clients.delete(ws);finish(room,'Lawan terputus. Pilih ruang baru.');};
   ws.on('close',disconnected);ws.on('error',disconnected);
   ws.on('message',(raw,binary)=>{
    if(room.closed||shuttingDown)return;
    try{
     const now=Date.now();if(now>=deadline){finish(room,'Server berakhir. Buka halaman awal FPS.');return;}
     if(now-c.window>=1000){c.window=now;c.rate=0;}if(++c.rate>60||binary||raw.length>2048)throw Error('invalid_frame');
     const data=JSON.parse(raw.toString());if(!data||typeof data!=='object'||Array.isArray(data))throw Error('invalid_shape');
     if(!c.player){
      if(data.type!=='join'||Object.keys(data).some(k=>!joinKeys.has(k))||data.room!==code||data.mode!==mode||typeof data.name!=='string'||!data.name.trim()||data.name.length>20)throw Error('invalid_join');
      const joined=room.arena.join(code,mode,data.name);c.player=joined.player;joined.room.until=Math.min(joined.room.until,deadline);clearTimeout(c.joinTimeout);send(ws,{type:'welcome',id:c.player.id});
      if(!room.tick){room.lastTick=now;room.tick=setInterval(()=>{
       if(room.closed)return;const at=Date.now();if(at>=deadline){finish(room,'Server berakhir. Buka halaman awal FPS.');return;}
       room.arena.tick((at-room.lastTick)/1000,at);room.lastTick=at;
       if([...room.clients.values()].some(client=>client.player&&at-client.player.lastInput>10000)){finish(room,'Pemain tidak merespons. Pilih ruang baru.');return;}
       if(at-room.lastBroadcast>=100){broadcast(room);room.lastBroadcast=at;}
       if(room.arena.rooms.get(code)?.winner)finish(room,'',true);
      },50);room.lobby=setTimeout(()=>{if(room.arena.rooms.get(code)?.players.length!==2)finish(room,'Menunggu terlalu lama. Pilih ruang baru.');},30000);}
      if(joined.room.players.length===2){joined.room.until=Math.min(joined.room.until,deadline);clearTimeout(room.lobby);room.lobby=null;}broadcast(room);return;
     }
     if(data.type!=='input'||Object.keys(data).some(k=>!inputKeys.has(k)))throw Error('invalid_input');
     room.arena.input(c.player,data);stats.processedInputs++;
    }catch{reject(ws,'request_rejected');}
   });
  });
 });
 const absoluteTimer=lifetimeMs===0?null:setTimeout(()=>{shuttingDown=true;for(const room of [...rooms.values()])finish(room,'Server berakhir. Buka halaman awal FPS.');},lifetimeMs);
 return {server,stats,rooms,async close(){shuttingDown=true;clearTimeout(absoluteTimer);for(const room of [...rooms.values()])finish(room,'Ruang ditutup.');for(const ws of wss.clients)ws.terminate();await new Promise(r=>wss.close(r));if(server.listening)await new Promise(r=>server.close(r));}};
}
