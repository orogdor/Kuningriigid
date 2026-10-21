import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Civilization,createGame,BUILDINGS} from './civilization-core.js';
import {initialState,tickEconomy} from './economy.js';
import {selectAIBuild} from './ai-strategy.js';
import {allocateCity} from './labor.js';
import {VisionDelta} from './fog-delta-v88.js';
import {Navigation,door} from './navigation.js';
const r=JSON.parse(fs.readFileSync('V88_POOLHIND_TEST.json','utf8')),n=r.nations[2],old=n.cities[0],ctx=old.contexts[0];
const g=new Civilization(createGame(8417));
const e=initialState(8417),placements=r.events.filter(e=>e.kind==='building_placed'&&e.team===2);
e.buildings=ctx.buildings.map((b,i)=>({...b,x:placements[i].x,z:placements[i].z,team:2}));
e.realms[2].resources={...old.stock};e.realms[2].pop=3;e.cargo=structuredClone(ctx.cargo);
const city={id:2,name:old.name,team:2,c:ctx.c,r:ctx.r,economy:e,world:g.makeWorld(g.cell(ctx)),hp:600};
g.s.cities=[city];g.s.ages[2]=1;g.s.research[2].known=[...n.known];g.prepareCity(city);city.world.workers=structuredClone(ctx.workers);
const lumber=e.buildings.find(b=>b.type==='lumber'),worker=city.world.workers['2'],start={x:worker.x,z:worker.z};
assert.equal(worker.carried,12);assert.equal(worker.phase,'return');
let delivered=0;for(let i=0;i<1200&&!delivered;i++)delivered=g.env(city).harvest(lumber,BUILDINGS.lumber,.25,1);
assert.equal(delivered,12,'actual previously blocked worker walks back with all 12 wood');
assert.ok(Math.hypot(worker.x-start.x,worker.z-start.z)>1,'worker walks, no cargo teleport');
assert.ok(g.nav(city).reachable(start,door(lumber)));
// A new construction must not overlap the actual existing navigation envelope.
assert.equal(g.nav(city).preservesAccess({type:'saw',x:lumber.x+6,z:lumber.z}),false);
for(let team=0;team<4;team++){
 const buildings=['hall','well','lumber','hunter','quarry','house','study'].map((type,i)=>({type,hp:350,ready:true,team,x:i*15,z:0}));
 const resources={wood:40,stone:13,plank:0,water:100,bread:100};
 const c={id:team,team,economy:{realms:Array.from({length:4},()=>({resources,pop:3})),buildings}};
 const game={s:{ages:[1,1,1,1],research:Array.from({length:4},()=>({known:['woodworking'],ageWait:null})),ships:[]},allBuildings:()=>buildings,buildRule:(c,t)=>['saw','farm','barracks','watchtower','pottery_kiln'].includes(t)?'':'locked',canBuildNow:(c,t)=>Object.entries(BUILDINGS[t].cost).every(([k,n])=>(resources[k]||0)>=n),storageCap:()=>160};
 assert.equal(selectAIBuild(game,team,c)?.type,'saw','every nation prioritizes sawmill');
 assert.equal(selectAIBuild(game,team,c,new Set(['saw'])),null,'unplaceable sawmill reserves resources instead of spending on side industries');
}
const buildings=['well','hunter','lumber','quarry','saw','study',...Array(12).fill('watchtower')].map(type=>({type,hp:350,ready:true}));
const realm={pop:3,resources:{wood:20,plank:0,bread:100,water:100,stone:0}},c={id:1,team:1,economy:{realms:[{},realm]}};
allocateCity({s:{research:[{},{}]},allBuildings:()=>buildings,buildingDefinitions:BUILDINGS},c);
assert.ok(buildings.find(b=>b.type==='saw').assigned>0);
assert.ok(buildings.filter(b=>b.type==='watchtower').every(b=>b.assigned===0),'optional buildings receive only surplus labour');
// The mine's one-food input uses exactly the economy's food substitution:
// berries/meat/grain can feed miners even when the literal bread stock is zero.
const mine={type:'mine',ready:true,hp:350},miningRealm={pop:8,resources:{bread:0,berries:30,water:100,wood:100}};
const miningCity={id:5,team:1,economy:{realms:[{},miningRealm]}};
allocateCity({s:{research:[{},{ageWait:{missing:{iron:20}}}]},allBuildings:()=>[mine],buildingDefinitions:BUILDINGS},miningCity);
assert.ok(mine.assigned>0,'miners receive workers when other edible food covers bread input');
miningRealm.resources.berries=0;allocateCity({s:{research:[{},{}]},allBuildings:()=>[mine],buildingDefinitions:BUILDINGS},miningCity);
assert.equal(mine.assigned,0,'without any food miners correctly wait');
const miningEconomy=initialState(1),minerStock=miningEconomy.realms[1].resources;
for(const key of Object.keys(minerStock))minerStock[key]=0;minerStock.berries=5;
miningEconomy.buildings=[{type:'hall',team:1,x:0,z:0,hp:350,ready:true},{type:'mine',team:1,x:15,z:0,hp:350,ready:true}];
tickEconomy(miningEconomy,1,{skipDemographics:true,assigned:b=>b.type==='mine'?1:0,harvest:()=>6,spawnPoint:b=>b,moveCargo:()=>true});
assert.equal(minerStock.ore,6);assert.ok(minerStock.berries<5,'actual mining consumes substitute food');
const state={visionRevision:1,explored:[{'0:0':1}]},delta=new VisionDelta(state);
assert.equal(delta.update().changed.length,1);const serial=delta.serial;delta.update();assert.equal(delta.serial,serial);
state.explored[0]['1:0']=1;state.visionRevision++;assert.deepEqual(delta.update().changed.map(p=>p.key),['1:0']);
state.explored[0]={};state.visionRevision++;assert.equal(delta.update().changed.length,2,'visibility reset re-hides cells');
// Real scout movement continues revealing; no stationary auto-explore loop.
const scout=g.s.armies[0];scout.autoExplore=true;g.s.cities=[];let moved=0;const before={c:scout.c,r:scout.r};
for(let i=0;i<120;i++){g.s.time+=.5;g.autoExplore(.5);g.advanceWorldMovers(.5);if(scout.c!==before.c||scout.r!==before.r)moved++;}
assert.ok(moved>0);
console.log('V88 RECOVERY PASS: old blocked cargo, physical return, spacing, all-country sawmill priority/reserve, basic labour, vision deltas and real scout travel');
