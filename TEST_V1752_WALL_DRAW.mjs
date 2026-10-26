// V175.2: straight/curved wall drag creates solid buildable world-state, not decals.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {wallStrokePlanV175,wallPointInsideV175,wallFootprintV175} from './wall-draw-v175.js';
import {Navigation} from './navigation.js';
import {Civilization,BUILDINGS} from './civilization-core.js';
const straight=wallStrokePlanV175([{x:0,z:0},{x:9,z:4},{x:28,z:0}],'straight');
const curved=wallStrokePlanV175([{x:0,z:0},{x:7,z:7},{x:14,z:11},{x:21,z:7},{x:28,z:0}],'curved');
assert.equal(straight.error,undefined);
assert.equal(curved.error,undefined);
assert.ok(straight.segments.length>=3&&curved.segments.length>=3);
assert.ok(straight.segments.every(s=>Math.abs(s.wallAngleV175)<.001));
assert.ok(curved.segments.some(s=>Math.abs(s.wallAngleV175)>.2),'curved stroke needs genuine angles');
assert.ok(curved.sampled.some(p=>p.z>6),'curved plan follows finger motion');
for(const plan of [straight,curved]){
 for(let i=0;i<plan.segments.length-1;i++){
  const a=plan.segments[i],b=plan.segments[i+1];
  assert.ok(Math.hypot(a.to.x-b.from.x,a.to.z-b.from.z)<.001,'adjacent palisades share real endpoints');
 }
 assert.ok(plan.segments.every(s=>s.palisadeSpanV167>2&&s.palisadeSpanV167<=8));
}
assert.ok(wallStrokePlanV175([{x:0,z:0},{x:150,z:0}],'straight').error,'limits prevent 22 pending construction jobs');
const wall={type:'palisade',x:0,z:0,ready:true,hp:350,...curved.segments[1]};
const nav=new Navigation({resources:[],heat:{},heatLast:{},trailTime:0},()=>true,()=>[wall],
 {minX:-42,minZ:-42,w:85,h:85});
assert.equal(nav.open(wall.x,wall.z),false,'wall centre solid');
for(const d of [-2,-1,0,1,2])assert.equal(nav.open(wall.x+Math.cos(wall.wallAngleV175)*d,
 wall.z-Math.sin(wall.wallAngleV175)*d),false,'soldier cannot cut through rotated segment');
const outside={x:wall.x-15,z:wall.z-15};
assert.equal(nav.open(outside.x,outside.z),true);
assert.ok(wallPointInsideV175(wall,wall));
assert.ok(wallFootprintV175(wall).rx>=1&&wallFootprintV175(wall).rz>=1);
// Real Sogn late-Stone-Age V4 save: require all construction rules and real cost.
const source=JSON.parse(fs.readFileSync('scenarios/ai-stone-v174.json','utf8'));
const game=new Civilization(source),city=game.s.cities.find(c=>c.id===source.stoneTestV174.targetCityId);
assert.equal(city?.team,0);
const beforeRoad=Object.keys(city.world.heat||{}).length;
const cost=BUILDINGS.palisade.cost,stock=city.economy.realms[0].resources;
const possible=[];
for(let z=-65;z<=65;z+=7)for(let x=-85;x<=85;x+=7){
 const params={x,z,wallAngleV175:Math.PI/6,wallAxis:0,palisadeSpanV167:7,drawnWallV175:true};
 if(!game.previewBuild(city,'palisade',params).error)possible.push(params);
}
assert.ok(possible.length>=1,'at least one user-drawn palisade placement is available');
const part=possible[0];
const before={wood:stock.wood,stone:stock.stone,buildings:city.economy.buildings.length};
const result=game.build(city,'palisade',part);
assert.ok(result.building,'paid wall construction can start in actual Sogn: '+JSON.stringify(result));
assert.equal(result.building.wallAngleV175,part.wallAngleV175);
assert.equal(result.building.palisadeSpanV167,7);
assert.equal(stock.wood,before.wood-(cost.wood||0));
assert.equal(stock.stone,before.stone-(cost.stone||0));
assert.equal(city.economy.buildings.length,before.buildings+1);
const liveNav=game.nav(city);
assert.equal(liveNav.open(part.x,part.z),false,'new rotated wall blocks movement');
const loaded=new Civilization(JSON.parse(JSON.stringify(game.s)));
const loadedWall=loaded.s.cities.find(c=>c.id===city.id).economy.buildings
 .find(b=>b.drawnWallV175&&Math.abs(b.x-part.x)<.01);
assert.ok(loadedWall,'manual curved-wall angle survives V4 save load');
assert.equal(loaded.nav(city).open(part.x,part.z),false,'saved wall remains impassable');
assert.ok(Object.keys(city.world.heat||{}).length<=beforeRoad,'wall draw never fakes extra traffic roads');
console.log('V175.2 WALL DRAW PASS '+JSON.stringify({straight:straight.segments.length,
 curved:curved.segments.length,validSites:possible.length,
 boughtWall:{x:part.x,z:part.z,angle:part.wallAngleV175},
 saved:!!loadedWall,paidWood:cost.wood}));
