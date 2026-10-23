import assert from 'node:assert/strict';
import {BUILDINGS} from './civilization-core.js';
import {defenseEligibility,planAIDefenses} from './ai-defenses-v128.js';
import {surplusForWalls,reserveAfterWalls} from './ancient-walls-v139.js';
const stock={wood:160,stone:165,plank:80,cutstone:100,water:100,meat:80,gold:1000};
assert.ok(surplusForWalls(stock,14,3));
assert.equal(defenseEligibility({population:14,readyHouses:4,services:2,waiting:3,stock}).ok,true);
assert.equal(defenseEligibility({population:14,readyHouses:4,services:2,waiting:4,stock}).reason,'construction-backlog');
assert.equal(defenseEligibility({population:14,readyHouses:4,services:2,waiting:0,stock:{...stock,wood:7}}).ok,false);
assert.equal(defenseEligibility({population:8,readyHouses:4,services:2,waiting:0,stock}).reason,'population');
assert.ok(reserveAfterWalls(stock,BUILDINGS.stonewall.cost));
assert.equal(reserveAfterWalls({...stock,wood:2},BUILDINGS.stonewall.cost),false);
const buildings=[
 {type:'hall',x:0,z:0,hp:1200,ready:true},
 ...[[-13,-13],[13,-13],[-13,13],[13,13]].map(([x,z])=>({type:'house',x,z,hp:350,ready:true})),
 {type:'market',x:0,z:16,hp:350,ready:true},
 {type:'well',x:0,z:-16,hp:350,ready:true}
],city={id:7,economy:{buildings,realms:{1:{pop:14,resources:stock}}}};
let placed=0;
const game={s:{time:120,seed:142023,ages:[0,2]},
 allBuildings:()=>buildings,buildRule:()=>'',buildingDefinitions:BUILDINGS,
 previewBuild:()=>({ok:true}),
 build:(c,type,position)=>{const b={...position,type,ready:true,hp:350};buildings.push(b);placed++;return {building:b};}
};
planAIDefenses(game,1,city);
assert.equal(placed,1,'The town must build an actual tower or wall, not a simulated defense');
assert.equal(city.defensePlanV139.constructed,1);
assert.ok(buildings.some(b=>['stonetower','watchtower','stonewall','palisade'].includes(b.type)));
const first=buildings.at(-1);
game.s.time+=50;planAIDefenses(game,1,city);
assert.equal(placed,2,'The completed perimeter must progress on later turns');
assert.notDeepEqual([buildings.at(-1).x,buildings.at(-1).z],[first.x,first.z],'Do not stack two towers in the same location');
console.log('V146 DEFENSE PASS: prosperity gate, material reserves, real placement and successive nonoverlapping slots');
