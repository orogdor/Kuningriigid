import assert from 'node:assert/strict';
import fs from 'node:fs';
import {terrainDefensePlanV176,insideDefenseV176,defensePlotPenaltyV176} from './terrain-defenses-v176.js';
import {Navigation} from './navigation.js';
import {Civilization} from './civilization-core.js';
import {planStoneVillageDefenses} from './stone-village-defenses-v166.js';
const buildings=[{type:'hall',x:0,z:0,hp:1200,ready:true},
 ...[[15,12],[-17,8],[-9,-18],[19,-15]].map(([x,z])=>({type:'house',x,z,hp:350,ready:true}))];
const plans=[];
for(const mode of ['open','cliff','shore','walkable-hill','stone-cliff']){
 const passable=(x,z)=>(mode==='cliff'||mode==='stone-cliff')?x<70:mode==='shore'?z>-55:true;
 const game={wallTerrainPassable:(_,x,z)=>passable(x,z),defenseTerrainKindV176:(_,x,z)=>passable(x,z)?null:(mode==='cliff'||mode==='stone-cliff')?'mountain':'water'};
 const before=JSON.stringify(buildings),plan=terrainDefensePlanV176(game,{},buildings,42,mode==='stone-cliff'?{wall:'stonewall',tower:'stonetower'}:{});
 assert.ok(plan,mode+' has a valid organic enclosure');
 assert.equal(JSON.stringify(buildings),before,'survey cannot alter terrain/buildings or resources');
 assert.deepEqual(plan,terrainDefensePlanV176(game,{},buildings,42,mode==='stone-cliff'?{wall:'stonewall',tower:'stonetower'}:{}),'deterministic save geometry');
 assert.ok(buildings.every(b=>insideDefenseV176(b,plan)),'historic homes inside the contour');
 assert.ok(plan.slots.some(s=>s.drawnWallV175&&Math.abs(Math.sin(s.wallAngleV175*2))>.25),'true diagonal/curved segments');
 assert.equal(plan.terrainBackedV176,mode==='cliff'||mode==='stone-cliff'||mode==='shore','only real impassable features replace walls');
 assert.ok(plan.gateOpenings>=1&&plan.gateOpenings<=2);
 const ready=plan.slots.map(s=>({...s,hp:350,ready:true}));
 const bounds={minX:-110,minZ:-95,w:221,h:191};
 const nav=new Navigation({resources:[]},passable,()=>ready,bounds);
 const exit={x:-100,z:0};
 assert.ok(nav.reachable({x:0,z:0},exit),'a genuine gate keeps the town accessible');
 // Close only the deliberate gate apertures. Any remaining escape route
 // would be an unintended wall/terrain joint hole, not an entrance.
 const seals=plan.gates.map(g=>({...g,type:'palisade',wallAngleV175:g.wallAxis?Math.PI/2:0,palisadeSpanV167:7,hp:350}));
 const closed=new Navigation({resources:[]},passable,()=>[...ready,...seals],bounds);
 assert.equal(closed.reachable({x:0,z:0},exit),false,mode+' has no accidental perimeter gap');
 const restored=JSON.parse(JSON.stringify([...ready,...seals]));
 assert.equal(new Navigation({resources:[]},passable,()=>restored,bounds).reachable({x:0,z:0},exit),false,'saved enclosure remains sealed');
 assert.equal(defensePlotPenaltyV176({x:0,z:0},'house',plan),0);
 assert.ok(defensePlotPenaltyV176({x:-105,z:-90},'house',plan)>0,'infill favours the organic outline');
 assert.equal(defensePlotPenaltyV176({x:-105,z:-90},'farm',plan),0,'farms can remain outside');
 plans.push({mode,plan});
}
assert.notDeepEqual(plans[0].plan.outlineV176,terrainDefensePlanV176({wallTerrainPassable:()=>true,defenseTerrainKindV176:()=>null},{},buildings,99).outlineV176,'towns do not repeat one template');

// The real AI scheduler buys and persists its organic wall segments using
// the ordinary game's tech, deposit, collision and material rules.
const state=JSON.parse(fs.readFileSync('scenarios/ai-stone-v174.json'));
const game=new Civilization(state),city=game.s.cities.find(c=>c.id===3),team=city.team;
const fortTypes=new Set(['palisade','woodgate','watchtower','stonewall','stonetower','gatehouse','reinforced_wall']);
city.economy.buildings=city.economy.buildings.filter(b=>!fortTypes.has(b.type));
for(const b of city.economy.buildings)b.ready=true;
delete city.stoneDefensePlanV166;delete city.stoneDefenseReserveV168;
game.s.ages[team]=0;
game.s.research[team].known=[...new Set([...game.s.research[team].known,'fortifications'])];
const stock=city.economy.realms[team].resources;
Object.assign(stock,{wood:10000,stone:10000,water:10000,bread:10000});
city.economy.realms[team].pop=Math.max(10,city.economy.realms[team].pop);
game.nav(city).rebuild();
let paid=0;
for(let step=0;step<100;step++){
 game.s.time+=10;
 const wood=stock.wood,count=city.economy.buildings.length;
 planStoneVillageDefenses(game,team,city);
 if(city.economy.buildings.length>count){
  assert.ok(stock.wood<wood,'real AI orders consume materials');paid++;
  city.economy.buildings.at(-1).ready=true; // isolate scheduling from construction labour in this fixture
 }
 if(city.aiStoneDefenseStatusV166?.reason==='ring-complete')break;
}
assert.equal(city.stoneDefensePlanV166?.version,176,'real scheduler adopts natural plan');
assert.ok(paid>=5,'real AI bought gates and multiple rotated wall sections');
assert.equal(city.aiStoneDefenseStatusV166?.reason,'ring-complete',JSON.stringify(city.aiStoneDefenseStatusV166));
assert.ok(city.economy.buildings.some(b=>b.historicPalisadeV166&&Number.isFinite(b.wallAngleV175)),'angle persists on real paid buildings');
console.log('V176 TERRAIN CITIES PASS',JSON.stringify({plans:plans.map(({mode,plan})=>({mode,slots:plan.slots.length,gates:plan.gateOpenings,barriers:plan.naturalBarriersV176.length})),realPaidOrders:paid}));
if(process.env.V176_PLAN_OUTPUT)fs.writeFileSync(process.env.V176_PLAN_OUTPUT,JSON.stringify(plans));
