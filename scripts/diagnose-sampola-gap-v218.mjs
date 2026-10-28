import fs from 'node:fs';
import {Civilization} from '../civilization-core.js';
import {takeOverAI} from '../ai-takeover-v128.js';
import {oldPerimeterStatusV218} from '../old-fortification-policy-v218.js';
const saved=JSON.parse(fs.readFileSync('scenarios/bronze-fresh-v217.json','utf8'));
const game=new Civilization(takeOverAI(saved,saved.bronzeFreshV217.originalTeam));
const city=game.s.cities.find(c=>c.id===saved.bronzeFreshV217.cityId);
const status=oldPerimeterStatusV218(game,city);
for(const old of status.missing){
 const all=game.allBuildings(city).filter(b=>b.hp>0&&!b.virtual);
 const near=all.map(b=>({type:b.type,x:b.x,z:b.z,dist:Math.hypot(b.x-old.x,b.z-old.z),
 angle:b.wallAngleV175,span:b.palisadeSpanV167})).sort((a,b)=>a.dist-b.dist).slice(0,8);
 const opts=[];
 for(const type of ['stonewall','palisade','reinforced_wall','gatehouse']){
  for(const dx of [-7,-4,-2,0,2,4,7])for(const dz of [-7,-4,-2,0,2,4,7]){
   const slot={...old,x:old.x+dx,z:old.z+dz,type,plannedDefense:true,oldPerimeterRepairV215:true};
   const err=game.previewDefenseV177(city,slot).error;
   if(!err)opts.push({type,dx,dz});
  }
 }
 console.log('V218 MISSING ORIGINAL CURTAIN',JSON.stringify({old,near,validAlternatives:opts.slice(0,30),alternativesCount:opts.length,
 originalPreview:game.previewDefenseV177(city,{...old,type:'stonewall',plannedDefense:true}).error}));
}
