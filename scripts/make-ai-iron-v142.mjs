import fs from 'node:fs';
import {Civilization,createGame} from '../civilization-core.js';
import {takeOverAI} from '../ai-takeover-v128.js';
const seed=142023,game=new Civilization(createGame(seed)),start=Date.now(),history=[];
let source=null,turn=0;
for(turn=1;turn<=800;turn++){
 for(let step=0;step<5;step++){
  game.tick(12);
  source=[1,2,3].find(team=>game.s.ages[team]===2);
  if(source!=null)break;
 }
 if(turn%20===0||source!=null){const row={turn,ages:[...game.s.ages],cities:game.s.cities.length,seconds:Math.round((Date.now()-start)/1000)};history.push(row);console.log('V142 PROGRESS',JSON.stringify(row));}
 if(source!=null)break;
 if(Date.now()-start>900000)throw Error('Iron Age simulation exceeded 15 minutes; no fabricated result');
}
if(source==null)throw Error('No AI reached Iron Age in 800 turns');
const state=takeOverAI(game.s,source);state.demo='ai-iron-v142';
state.ironCityTestV142={seed,sourceTeam:source,turn,source:'Fresh game; normal AI economy, research and construction; no injected buildings, technologies or resources'};
const manifest={version:142,success:true,...state.ironCityTestV142,age:2,seconds:Math.round((Date.now()-start)/1000),history,
 cities:game.s.cities.filter(c=>c.team===source).map(c=>({id:c.id,name:c.name,c:c.c,r:c.r,pop:c.economy.realms[source].pop,radius:game.radius(c),extent:2*game.radius(c)+1,ownedTiles:game.constructionArea(c).tiles.length,buildings:game.allBuildings(c).filter(b=>!b.virtual&&b.hp>0).length}))};
const districts=new Set(state.cities.flatMap(c=>Object.values(c.districts||{}).map(d=>d.economy)));
fs.mkdirSync('scenarios',{recursive:true});
fs.writeFileSync('scenarios/ai-iron-v142.json',JSON.stringify(state,function(k,v){return districts.has(this)&&['realms','resources'].includes(k)?undefined:v}));
fs.writeFileSync('scenarios/ai-iron-v142.manifest.json',JSON.stringify(manifest,null,2));
console.log('V142 RESULT',JSON.stringify(manifest));
