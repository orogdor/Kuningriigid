import assert from 'node:assert/strict';
import {Civilization,createGame,TROOPS} from './civilization-core.js';
import {initialState,START,RESOURCE_PRODUCTION_MULTIPLIER} from './economy.js';
import {baseHeight,worldElevation,getRivers,riverNear} from './continuous-landscape.js?v=68';
import {createRiverNetwork} from './continuous-landscape-visual.js?v=68';
import * as T from './vendor/three.module.js';
assert.ok(START.wood<100&&START.stone<30&&START.bread<40&&START.plank<35,'initial stocks require choices');
assert.ok(RESOURCE_PRODUCTION_MULTIPLIER<1/3,'production slower than old economy');
console.log('V68 ECONOMY',JSON.stringify({wood:START.wood,plank:START.plank,stone:START.stone,bread:START.bread,water:START.water,gold:START.gold,multiplier:RESOURCE_PRODUCTION_MULTIPLIER}));
for(const seed of [17,12345,20261018]){
 const g=new Civilization(createGame(seed)),mount=g.cells.find(c=>c.mountain&&c.h>30),sea=g.cells.find(c=>!c.land&&c.h<-.9),edges=getRivers(g);
 assert.ok(mount&&sea&&edges.length>200);
 const rock=baseHeight(g,mount.x,mount.z),floor=baseHeight(g,sea.x,sea.z);
 assert.ok(rock>g.atlasHeight(mount.x,mount.z)+8,'mountains must physically protrude from the terrain');
 assert.ok(floor<g.atlasHeight(sea.x,sea.z)-.5,'sea floor must be lower than original level');
 const river=edges.find(e=>e.points.some(p=>g.atlasHeight(p.x,p.z)>4));
 assert.ok(river,'accessible river');
 const p=river.points[0];
 assert.ok(worldElevation(g,p.x,p.z)<baseHeight(g,p.x,p.z)-2.0,'river carved below banks');
 const mesh=createRiverNetwork(g,'detail',river.c);
 assert.ok(mesh.userData.riverVertexCount>0);
 const water=mesh.children.find(o=>o.name==='continuous water surface');
 assert.ok(water?.geometry.index&&water.geometry.index.count>water.geometry.attributes.position.count);
 console.log('V68 GEO',seed,JSON.stringify({peaks:mount.h,peakHeight:Math.round(rock),seaDepth:Math.round(floor),riverbed:Math.round(worldElevation(g,p.x,p.z)),riverPieces:mesh.children.length}));
}
for(const seed of [17,42,12345]){
 const state=createGame(seed),g=new Civilization(state),start=state.coastalStartPositions[0],econ=initialState(seed);
 const bank=econ.realms[0];bank.pop=18;for(const k of Object.keys(bank.resources))bank.resources[k]=500;
 econ.buildings=[{type:'hall',team:0,x:0,z:0,ready:true,hp:1200},{type:'barracks',team:0,x:15,z:5,ready:true,hp:350}];
 const city={id:0,team:0,c:start.c,r:start.r,name:'Military Town',economy:econ,world:g.localWorld(start),hp:600,districts:{}};
 g.s.cities.push(city);g.prepareCity(city);g.s.research[0].known.push('stone_tools','warfare');
 // Explorer remains away from the city; no forced return to recruit.
 const expedition=g.s.armies[0],moved={...expedition};
 expedition.c=Math.min(g.cols-1,city.c+4);expedition.r=city.r;expedition.path=[];
 assert.ok(expedition.c!==city.c);
 const a=g.recruit(city,'slinger');assert.ok(a.queued,'recruitment must not depend on field army location: '+a.error);
 a.queued.progress=a.queued.total;a.queued.efficiency=0;
 g.tickTraining(city,0);
 const own=g.s.armies.filter(x=>x.team===0&&x.c===city.c&&x.r===city.r);
 assert.ok(own.length===1,'a home detachment is created');
 assert.notEqual(own[0].id||0,expedition.id||0,'graduates do not teleport the explorer');
 const soldier=g.s.units.find(u=>u.kind==='slinger'&&u.team===0);
 assert.ok(soldier&&soldier.armyId===own[0].id);
 const second=g.recruit(city,'spearman');assert.ok(second.queued,'multiple local recruits allowed');
 second.queued.progress=second.queued.total;
 g.tickTraining(city,0);
 assert.equal(g.s.armies.filter(a=>a.team===0&&a.c===city.c&&a.r===city.r).length,1,'later trainees reuse detachment');
 assert.ok(g.s.units.some(u=>u.kind==='spearman'&&u.armyId===own[0].id));
 assert.equal(expedition.c,moved.c===city.c?city.c+4:expedition.c,'main field army remains away');
 const oldSave=JSON.parse(JSON.stringify(g.s)),restore=new Civilization(oldSave);
 assert.equal(restore.s.armies.filter(a=>a.team===0&&a.c===city.c&&a.r===city.r).length,1,'local regiment survives save/load');
 console.log('V68 RECRUITS',seed,{field:[expedition.c,expedition.r],home:[own[0].c,own[0].r],homeId:own[0].id,queued:city.training.length});
}
console.log('V68 PASS: pronounced 3D peaks, deep seabed/river trenches, slower stocks/production, remote army recruitment and independent stationed city soldiers');
