import assert from 'node:assert/strict';
import fs from 'node:fs';
import {wallStrokePlanV175} from './wall-draw-v175.js';
import {wallTerrainErrorV1758} from './wall-terrain-v1758.js';
import {Navigation} from './navigation.js';
import {localSurface} from './continuous-landscape.js';
import {Civilization} from './civilization-core.js';
import {DETAIL_HALF_X} from './detail-scale-v123.js';
const land=(x,z)=>z>=0&&z<=20;
for(const shape of ['straight','curved'])for(const tier of [1,2]){
 const points=shape==='straight'?[{x:0,z:-6},{x:0,z:26}]:[{x:0,z:-6},{x:3,z:10},{x:0,z:26}];
 const plan=wallStrokePlanV175(points,shape,10,land);
 assert.ok(!plan.error,plan.error);
 assert.ok(Math.abs(plan.curve[0].z)<.01&&Math.abs(plan.curve.at(-1).z-20)<.01,'ends snap to sea and mountain');
 const walls=plan.segments.map(p=>({...p,type:'palisade',woodFortTierV1757:tier,hp:350,ready:true}));
 for(const wall of walls)assert.equal(wallTerrainErrorV1758(wall,land,()=>1),'');
 const nav=new Navigation({resources:[]},land,()=>walls,{minX:-15,minZ:-5,w:31,h:31});
 assert.equal(nav.reachable({x:-10,z:10},{x:10,z:10}),false,'no walking around either terrain junction');
 assert.equal(nav.route({x:-10,z:10},{x:10,z:10}),null);
 const restored=new Navigation({resources:[]},land,()=>JSON.parse(JSON.stringify(walls)),{minX:-15,minZ:-5,w:31,h:31});
 assert.equal(restored.reachable({x:-10,z:10},{x:10,z:10}),false,'save reload retains defensive seal');
}
assert.ok(wallStrokePlanV175([{x:0,z:-20},{x:0,z:-5}],'straight',10,land).error,'no wall at sea');
assert.ok(wallStrokePlanV175([{x:-10,z:10},{x:10,z:10}],'straight',10,(x,z)=>Math.abs(x)>2).error,'no spanning an inlet or mountain');
assert.ok(wallTerrainErrorV1758({x:0,z:10,type:'palisade',wallAngleV175:Math.PI/2,palisadeSpanV167:7},(x,z)=>z<11||z>12,()=>1),'interior obstacle rejected');
assert.ok(wallTerrainErrorV1758({x:0,z:10,type:'palisade',wallAngleV175:0,palisadeSpanV167:7},()=>true,x=>x),'steep slope rejected');

// Real saved settlement: a wall can reach a neighbouring mountain tile
// without the old five-metre UI margin or the worker-grid border rejecting it.
const state=JSON.parse(fs.readFileSync('scenarios/ai-stone-v174.json'));
const game=new Civilization(state),city=game.s.cities.find(c=>c.id===state.stoneTestV174.targetCityId);
const cell=game.cell(city),mountain=game.cell({c:city.c+1,r:city.r});
mountain.land=true;mountain.mountain=true;
Object.assign(city.economy.realms[city.team].resources,{wood:1000,stone:1000});
// Flat, dry controlled fixture within the real city; retain real economy,
// rules, deposits, terrain classifier, construction and navigation.
cell.detail.heights=Array(81).fill(4);
let planSite=null;
for(let z=-80;z<=80;z+=2){
 const plan=wallStrokePlanV175([{x:DETAIL_HALF_X-10,z},{x:DETAIL_HALF_X+6,z}],'straight',10,(x,z)=>game.wallTerrainPassable(city,x,z));
 if(!plan.error&&plan.segments.length===2&&plan.segments.every(p=>!game.previewBuild(city,'palisade',{...p,woodFortTierV1757:2}).error)){planSite=plan;break;}
}
assert.ok(planSite,'legal real construction site directly against mountain boundary');
const site={...planSite.segments[0],woodFortTierV1757:2};
assert.equal(game.wallTerrainPassable(city,DETAIL_HALF_X+.1,site.z),false,'neighbouring mountain is impassable');
const before=city.economy.realms[city.team].resources.wood;
const built=game.build(city,'palisade',site);
assert.ok(built.building,built.error);
assert.equal(city.economy.realms[city.team].resources.wood,before-12);
assert.equal(game.nav(city).open(site.x,site.z),false);
assert.equal(JSON.parse(JSON.stringify(built.building)).palisadeSpanV167,site.palisadeSpanV167);
assert.ok(game.previewBuild(city,'palisade',site).error,'duplicate segment still rejected');
const finalSection=game.build(city,'palisade',{...planSite.segments[1],woodFortTierV1757:2});
assert.ok(finalSection.building,finalSection.error);
assert.equal(city.economy.realms[city.team].resources.wood,before-24,'both short joined sections paid');
// Unmodified generated coastline from the saved world's actual height field.
const shore=game.cell({c:135,r:11}),seaPlan=wallStrokePlanV175([{x:-30,z:-75},{x:-30,z:-65}],'straight',10,(x,z)=>game.wallTerrainPassable(shore,x,z));
assert.ok(!seaPlan.error,seaPlan.error);
assert.equal(game.wallTerrainPassable(shore,-30,-75),false);
assert.equal(game.wallTerrainPassable(shore,-30,-65),true);
assert.ok(Math.abs(localSurface(game,shore,seaPlan.curve[0].x,seaPlan.curve[0].z,false)-.2)<.01,'snapped to actual continuous shoreline');
for(const p of seaPlan.segments)assert.equal(wallTerrainErrorV1758({...p,type:'palisade',woodFortTierV1757:2},(x,z)=>game.wallTerrainPassable(shore,x,z),(x,z)=>localSurface(game,shore,x,z,false)),'');
for(let z=-75;z<=-65;z+=.5)assert.equal(game.nav(shore).passable(-30,z),game.wallTerrainPassable(shore,-30,z),'worker and wall use same coastline');
console.log('V175.8 TERRAIN ENDS PASS: straight/curved, both tiers, sea/mountain path seals, reload, rejected crossings, real paid mountain-edge construction');
