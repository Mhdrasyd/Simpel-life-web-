'use strict';
/* Tes integritas data musik: setiap lagu harus punya panjang birama yang konsisten. */
const assert=require('node:assert/strict');
const DATA=require('./music-data.js');
let tests=0;function check(name,fn){fn();tests++;console.log('PASS',name);}
check('kedua track ada dan berlabel',()=>{assert(DATA.TRACKS.kota);assert(DATA.TRACKS.boss);assert(DATA.TRACKS.kota.label);assert(DATA.TRACKS.boss.label);});
check('total langkah kelipatan 16 (birama penuh)',()=>{for(const t of Object.values(DATA.TRACKS)){assert.equal(t.total%16,0);assert(t.total>=64);}});
check('event lead/bass dalam rentang dan nada valid',()=>{for(const t of Object.values(DATA.TRACKS)){for(const e of [...t.lead,...t.bass]){assert(e.step>=0&&e.step<t.total);assert(e.midi>=21&&e.midi<=108);assert(e.len>=1&&e.len<=8);}}});
check('hat dalam rentang',()=>{for(const t of Object.values(DATA.TRACKS))for(const h of t.hats)assert(h>=0&&h<t.total);});
check('tidak ada event lead yang bertumpuk',()=>{for(const t of Object.values(DATA.TRACKS)){const seen=new Set();for(const e of t.lead){assert(!seen.has(e.step));seen.add(e.step);}}});
check('sting victory & death ada',()=>{assert(DATA.STINGS.victory.length>=4);assert(DATA.STINGS.death.length>=4);for(const n of [...DATA.STINGS.victory,...DATA.STINGS.death]){assert(n.m>=21&&n.m<=108);assert(n.t>=0);assert(n.d>0);}});
console.log(`${tests} test groups passed.`);
