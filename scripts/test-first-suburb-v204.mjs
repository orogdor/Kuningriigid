import fs from 'node:fs';
import assert from 'node:assert/strict';
import {suburbDemandV204} from '../outer-ring-v184.js';
import {cliffShelterScoreV204} from '../historic-urban-v138.js';
import {Civilization} from '../civilization-core.js';
import {takeOverAI} from '../ai-takeover-v128.js';

const n=32,outline=Array.from({length:n},(_,i)=>({x:35*Math.cos(i*2*Math.PI/n),z:35*Math.sin(i*2*Math.PI/n)}));
const mockCity={c:0,r:0,defensePlanV139:{outlineV176:outline}};
const mockBuildings=Array.from({length:12},(_,i)=>({x:(i-6)*11,z:70,type:'house',hp:100,ready:true}));
const mockGame={contexts:()=>[{c:0,r:0,economy:{buildings:mockBuildings}}]};
assert.equal(suburbDemandV204(mockGame,mockCity).ready,false,'12 houses must not trigger a second wall');
mockBuildings.push({x:66,z:70,type:'field',hp:100,ready:true});
assert.equal(suburbDemandV204(mockGame,mockCity).ready,false,'fields cannot trigger a second wall');
mockBuildings.push({x:66,z:70,type:'house',hp:100,ready:true});
assert.equal(suburbDemandV204(mockGame,mockCity).ready,true,'13 clustered buildings must trigger a second wall');
assert.equal(suburbDemandV204(mockGame,mockCity).cluster.length,13);
mockBuildings[13].x=600;
assert.equal(suburbDemandV204(mockGame,mockCity).ready,false,'remote buildings must not count');
const cliff=(kind)=>({defenseTerrainKindV176:(_city,x,z)=>kind==='double'?x>19||z>19?'mountain':null:kind==='single'&&x>19?'mountain':null});
assert.ok(cliffShelterScoreV204(cliff('double'),{},0,0)<cliffShelterScoreV204(cliff('single'),{},0,0),'two protected sides outrank one');
assert.equal(cliffShelterScoreV204(cliff('none'),{},0,0),0);
console.log('V204 RULES PASS: 12 no wall; fields excluded; 13 connected buildings; remote excluded; cliff shelter');

const state=takeOverAI(JSON.parse(fs.readFileSync('scenarios/bronze-v183-coast.json','utf8')),1);
const game=new Civilization(state);
const target=game.s.cities.find(c=>c.id===state.bronzeTestV183.targetCityId);
assert.ok(target,'coastal test city is available');
const startTime=game.s.time;
let first=null,peak=0;
for(let turn=0;turn<950;turn++){
 for(let step=0;step<5;step++)game.tick(12);
 const demand=suburbDemandV204(game,target);
 peak=Math.max(peak,demand.cluster.length);
 const built=game.allBuildings(target).filter(b=>b.outerRingV184&&b.hp>0);
 if(turn%25===0||built.length){
  console.log('V204 TURN',JSON.stringify({turn,time:game.s.time,pop:target.economy.realms[target.team].pop,
   outside:demand.count,cluster:demand.cluster.length,peak,outer:target.outerRingDiagnosticV184?.reason||null,
   planSlots:target.outerRingV184?.slots?.length||0,built:built.length}));
 }
 if(built.length){
  assert.ok(target.outerRingV184?.slots?.length);
  assert.ok(target.outerRingV184.protectedSuburbBuildingsV204>=3);
  first={turn,time:game.s.time,elapsed:game.s.time-startTime,cluster:demand.cluster.length,
   plannedBuildings:target.outerRingV184.protectedSuburbBuildingsV204,
   segments:target.outerRingV184.slots.length,built:built.length,
   natural:target.outerRingV184.naturalBoundaryV194?.kind||null};
  fs.mkdirSync('reports',{recursive:true});
  fs.writeFileSync('reports/v204-first-wall.json',JSON.stringify({result:first,state:game.s},null,2));
  break;
 }
}
assert.ok(first,'AI must naturally commission first suburb curtain within 950 simulated turns; max outside cluster '+peak+', last '+JSON.stringify(target.outerRingDiagnosticV184));
console.log('V204 FIRST ADDITIONAL WALL BUILT:',JSON.stringify(first));
