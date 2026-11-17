'use strict';
/* Data lagu chiptune asli untuk Simple Life RPG.
   Digubah khusus untuk game ini dan disintesis langsung dengan WebAudio.
   Tanpa file audio, tanpa cuplikan lagu mana pun: nol risiko hak cipta.
   Format: pasangan [midi, durasiDalamLangkah]; 1 langkah = 1/16 birama. */
const MUSIC_DATA=(()=>{
  function expand(bars){
    const events=[];let s=0;
    for(const bar of bars)for(const [m,len] of bar){if(m>0)events.push({step:s,midi:m,len});s+=len;}
    return{events,total:s};
  }
  // Bas per birama: pola ketukan kedelapan, angka = geseran semitone dari nada dasar.
  function bassline(roots,pattern){
    const events=[];let s=0;
    for(const root of roots){for(const off of pattern){if(off!==null)events.push({step:s,midi:root+off,len:2});s+=2;}}
    return{events,total:s};
  }
  // Birama = 16 langkah.
  const kotaLead=expand([
    [[69,3],[0,1],[72,2],[76,2],[74,2],[72,2],[69,4]],   // Am
    [[69,2],[72,2],[77,4],[76,2],[72,2],[69,4]],          // F
    [[76,3],[0,1],[79,2],[76,2],[74,4],[72,4]],           // C
    [[74,2],[76,2],[79,3],[0,1],[76,2],[74,2],[71,4]],    // G
    [[69,4],[72,2],[76,2],[81,4],[79,2],[76,2]],          // Am
    [[77,4],[81,2],[79,2],[77,2],[76,2],[72,4]],          // F
    [[76,2],[79,2],[84,4],[79,2],[76,2],[74,4]],          // C
    [[74,3],[0,1],[71,2],[74,2],[76,4],[69,4]]            // G -> Am
  ]);
  const kotaBass=bassline([45,41,48,43,45,41,48,43],[0,12,0,7,0,12,7,0]);
  const kotaHats=[];for(let bar=0;bar<8;bar++){kotaHats.push(bar*16+4,bar*16+12);}

  const bossLead=expand([
    [[69,2],[69,2],[72,2],[69,2],[67,2],[69,2],[76,2],[74,2]],
    [[72,2],[72,2],[76,2],[72,2],[71,2],[72,2],[79,2],[76,2]],
    [[69,2],[69,2],[72,2],[69,2],[76,2],[76,2],[77,2],[76,2]],
    [[74,2],[72,2],[74,2],[76,2],[71,2],[72,2],[69,4]]
  ]);
  const bossBassPat=[0,null,0,null,0,null,12,null,0,null,0,null,7,null,12,null];
  const bossBass=(()=>{const ev=[];let s=0;for(const root of [45,45,41,43]){for(const off of bossBassPat){if(off!==null)ev.push({step:s,midi:root+off,len:1});s+=1;}}return{events:ev,total:s};})();
  const bossHats=[];for(let s=0;s<64;s+=2)bossHats.push(s);

  const STINGS={
    victory:[{m:69,t:0,d:.13},{m:72,t:.14,d:.13},{m:76,t:.28,d:.13},{m:81,t:.42,d:.16},{m:84,t:.60,d:.55}],
    death:[{m:64,t:0,d:.22},{m:62,t:.24,d:.22},{m:57,t:.48,d:.22},{m:52,t:.72,d:.22},{m:45,t:.96,d:.7}]
  };

  const TRACKS={
    kota:{bpm:108,total:kotaLead.total,lead:kotaLead.events,bass:kotaBass.events,hats:kotaHats,label:'KOTA LOOP'},
    boss:{bpm:152,total:bossLead.total,lead:bossLead.events,bass:bossBass.events,hats:bossHats,label:'BOSS LOOP'}
  };
  return{TRACKS,STINGS};
})();
if(typeof module!=='undefined')module.exports=MUSIC_DATA;
