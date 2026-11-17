'use strict';
/* Tes untuk api/cloud.js: menjalankan handler dengan mock server Upstash REST. */
const assert=require('node:assert/strict');
const http=require('node:http');

function mockUpstash(){
  const store=new Map();
  const server=http.createServer((req,res)=>{
    let body='';
    req.on('data',c=>body+=c);
    req.on('end',()=>{
      if(req.headers.authorization!=='Bearer test-token'){res.writeHead(401);res.end('{}');return;}
      let cmd;try{cmd=JSON.parse(body);}catch(e){res.writeHead(400);res.end('{"error":"bad"}');return;}
      const [op,key,val]=cmd;
      if(op==='GET'){res.end(JSON.stringify({result:store.has(key)?store.get(key):null}));return;}
      if(op==='SET'){store.set(key,val);res.end(JSON.stringify({result:'OK'}));return;}
      res.writeHead(400);res.end('{"error":"unknown"}');
    });
  });
  return new Promise(resolve=>server.listen(0,'127.0.0.1',()=>resolve({server,store,port:server.address().port})));
}
function fakeReqRes(method,{query,body}={}){
  const headers={};
  const req={method,query:query||{},body};
  const res={statusCode:0,jsonBody:null,
    setHeader:(k,v)=>{headers[k]=v;},
    status(code){this.statusCode=code;return this;},
    json(o){this.jsonBody=o;return this;}};
  return{req,res};
}
async function main(){
  const handler=require('./api/cloud.js');
  let tests=0;
  const check=async(name,fn)=>{await fn();tests++;console.log('PASS',name);};

  // Tanpa env: unconfigured
  delete process.env.KV_REST_API_URL;delete process.env.KV_REST_API_TOKEN;
  await check('unconfigured tanpa env',async()=>{
    const {req,res}=fakeReqRes('GET',{query:{slot:'KOTA-7F2K'}});
    await handler(req,res);
    assert.equal(res.statusCode,503);
    assert.equal(res.jsonBody.reason,'unconfigured');
  });
  await check('slot tidak valid ditolak',async()=>{
    const {req,res}=fakeReqRes('GET',{query:{slot:'???'}});
    await handler(req,res);
    assert.equal(res.statusCode,400);
    assert.equal(res.jsonBody.reason,'bad_slot');
  });

  // Dengan mock Upstash
  const mock=await mockUpstash();
  process.env.KV_REST_API_URL=`http://127.0.0.1:${mock.port}`;
  process.env.KV_REST_API_TOKEN='test-token';

  await check('belum ada save -> not_found',async()=>{
    const {req,res}=fakeReqRes('GET',{query:{slot:'KOTA-7F2K'}});
    await handler(req,res);
    assert.equal(res.statusCode,404);
    assert.equal(res.jsonBody.reason,'not_found');
  });
  await check('simpan lalu muat (round-trip)',async()=>{
    const state={version:1,name:'Rasyd',money:5000,day:3,farm:{seeds:{padi:1,jagung:0},goods:{padi:0,jagung:0},plots:[null,null,null,null]},completed_side_quests:[],log:['halo']};
    let r=fakeReqRes('POST',{body:{slot:'kota-7f2k',savedAt:123,state}});
    await handler(r.req,r.res);
    assert.equal(r.res.statusCode,200);
    assert.equal(r.res.jsonBody.ok,true);
    r=fakeReqRes('GET',{query:{slot:'KOTA-7F2K'}});
    await handler(r.req,r.res);
    assert.equal(r.res.statusCode,200);
    assert.equal(r.res.jsonBody.entry.savedAt,123);
    assert.deepEqual(r.res.jsonBody.entry.state,state);
  });
  await check('bad_state ditolak',async()=>{
    const {req,res}=fakeReqRes('POST',{body:{slot:'KOTA-7F2K',state:[1,2,3]}});
    await handler(req,res);
    assert.equal(res.statusCode,400);
    assert.equal(res.jsonBody.reason,'bad_state');
  });
  await check('body terlalu besar ditolak',async()=>{
    const big='x'.repeat(60*1024);
    const {req,res}=fakeReqRes('POST',{body:{slot:'KOTA-7F2K',state:{big}}});
    await handler(req,res);
    assert.equal(res.statusCode,413);
  });
  await check('method lain ditolak',async()=>{
    const {req,res}=fakeReqRes('DELETE',{query:{slot:'KOTA-7F2K'}});
    await handler(req,res);
    assert.equal(res.statusCode,405);
  });
  await check('token salah -> store_error',async()=>{
    process.env.KV_REST_API_TOKEN='salah';
    const {req,res}=fakeReqRes('GET',{query:{slot:'KOTA-7F2K'}});
    await handler(req,res);
    assert.equal(res.statusCode,502);
    process.env.KV_REST_API_TOKEN='test-token';
  });
  mock.server.close();
  console.log(`${tests} test groups passed.`);
}
main().catch(e=>{console.error(e);process.exit(1);});
