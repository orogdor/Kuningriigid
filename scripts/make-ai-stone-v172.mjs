// V172: reproducible, genuinely AI-built Stone Age village near the Bronze transition.
// No gifted resources, buildings, technologies or construction speed adjustments.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {Civilization,createGame} from '../civilization-core.js';
import {takeOverAI} from '../ai-takeover-v128.js';

const SEED=142023, MAX_TURN=116;
// Seed preserved from V171 to allow a direct, fair 102-turn layout comparison.
const game=new Civilization(createGame(SEED));
const lastStone=new Map(), firstBronze=new Map(), milestones=[];
const defenses=new Set(['palisade','woodgate','watchtower']);
const stats=(c,turn)=>{
 const team=c.team, buildings=game.allBuildings(c).filter(b=>b.hp>0&&!b.virtual);
 const slots=c.stoneDefensePlanV166?.slots||[],core=c.economy.buildings.filter(b=>b.hp>0&&!b.virtual);
 const count=(type)=>buildings.filter(b=>b.type===type&&b.ready).length;
 const readiness=slots.filter(slot=>core.some(b=>b.type===slot.type&&b.hp>0&&b.ready&&Math.hypot(b.x-slot.x,b.z-slot.z)<4.5)).length;
 return {turn,team,name:c.name,id:c.id,age:game.s.ages[team],
  pop:c.economy.realms[team]?.pop||0,
  totalBuildings:buildings.length,readyBuildings:buildings.filter(b=>b.ready).length,
  houses:count('house'),halls:count('hall'),markets:count('market'),
  farms:count('farm'),fields:count('field'),lumber:count('lumber'),
  gates:count('woodgate'),towers:count('watchtower'),walls:count('palisade'),
  defensesReady:readiness,defensesTotal:slots.length,
  food:['bread','meat','fish','grain'].reduce((sum,k)=>sum+(c.economy.realms[team]?.resources?.[k]||0),0),
  wood:c.economy.realms[team]?.resources?.wood||0,
  stone:c.economy.realms[team]?.resources?.stone||0};
};
for(let turn=1;turn<=MAX_TURN;turn++){
 for(let step=0;step<5;step++)game.tick(12);
 for(const team of [1,2,3]){
  const c=game.s.cities.filter(x=>x.team===team).sort((a,b)=>(b.economy.realms[team]?.pop||0)-(a.economy.realms[team]?.pop||0))[0];
  if(!c)continue;
  const v=stats(c,turn);
  if(v.age===0){
   // Capture the last *real* Stone Age state before the game's own age transition.
   if(turn>=55&&v.houses>=3&&v.defensesTotal>=12&&v.defensesReady===v.defensesTotal){
    lastStone.set(team,{info:v,state:JSON.stringify(game.s)});
   }
  } else if(!firstBronze.has(team)){firstBronze.set(team,{turn,age:v.age});}
 }
 if(turn%20===0||turn===MAX_TURN){
  const checkpoint={turn,ages:[...game.s.ages],towns:game.s.cities.filter(c=>c.team>0)
   .map(c=>({team:c.team,name:c.name,pop:Math.round(c.economy.realms[c.team]?.pop||0)}))};
  milestones.push(checkpoint);
  console.log('V172 PROGRESS '+JSON.stringify(checkpoint));
 }
}
const choices=[...lastStone.values()].filter(x=>
 x.info.defensesTotal>=12 && x.info.defensesReady===x.info.defensesTotal && x.info.age===0);
choices.sort((a,b)=>
 b.info.readyBuildings-a.info.readyBuildings ||
 b.info.pop-a.info.pop ||
 b.info.turn-a.info.turn);
const best=choices[0];
assert.ok(best,'No fully fortified real AI village near end of Stone Age');
assert.ok(best.info.turn>=60,'Too early to represent the end of the Stone Age');
const selected=best.info;
const village=JSON.parse(best.state).cities.find(c=>c.id===selected.id);
const hall=village?.economy?.buildings.find(b=>b.type==='hall'&&b.hp>0);
const actualHomes=village?.economy?.buildings.filter(b=>b.type==='house'&&b.hp>0)||[];
const meanHouseDistance=actualHomes.length&&hall?actualHomes.reduce((n,b)=>n+Math.hypot(b.x-hall.x,b.z-hall.z),0)/actualHomes.length:null;
const state=takeOverAI(JSON.parse(best.state),selected.team);
const city=state.cities.find(c=>c.id===selected.id);
assert.equal(state.version,4,'V4 save protocol remains unchanged');
assert.equal(state.ages[0],0,'Player must begin during the Stone Age');
assert.equal(city?.team,0,'Player must own the selected AI town');
assert.equal(state.time/60,selected.turn);
state.demo='ai-stone-v172';
state.stoneTestV172={seed:SEED,turn:selected.turn,sourceTeam:selected.team,
 targetCityId:selected.id,targetCityName:selected.name,firstBronzeAt:firstBronze.get(selected.team)?.turn||null,
 townStats:selected,meanHouseDistance,possibleOptions:choices.map(c=>c.info),milestones,
 description:'Real AI town after V172 compact settlement planner; no injected resources, technologies or buildings'};
state.cities.sort((a,b)=>a.id===selected.id?-1:b.id===selected.id?1:0);
// Re-open through the real game constructor, then advance on a CLONE only.
const proof=new Civilization(JSON.parse(JSON.stringify(state)));
for(let i=0;i<3;i++)proof.tick(1);
assert.ok(proof.s.time>state.time,'The selected takeover snapshot can advance');
assert.equal(proof.s.cities.find(c=>c.id===selected.id)?.team,0,'Ownership survives game ticks');
fs.mkdirSync('scenarios',{recursive:true});
fs.writeFileSync('scenarios/ai-stone-v172.json',JSON.stringify(state));
fs.writeFileSync('scenarios/ai-stone-v172.manifest.json',JSON.stringify({
 version:172,pass:true,seed:SEED,turn:selected.turn,sourceTeam:selected.team,
 selectedCity:selected.name,selectedCityId:selected.id,age:state.ages[0],
 targetTown:selected,meanHouseDistance,otherTowns:choices.map(x=>x.info),
 firstBronzeAt:firstBronze.get(selected.team)?.turn||null, milestones,
 gameTimeSeconds:state.time,savedBytes:Buffer.byteLength(JSON.stringify(state))
},null,2)+'\n');
console.log('V172 TAKEOVER PASS '+JSON.stringify({turn:selected.turn,city:selected.name,team:selected.team,
 pop:Math.round(selected.pop),ready:selected.defensesReady+'/'+selected.defensesTotal,
 houses:selected.houses,meanHouseDistance,gates:selected.gates,towers:selected.towers,
 sourceTransition:firstBronze.get(selected.team),saveBytes:Buffer.byteLength(JSON.stringify(state))}));
