import assert from 'node:assert/strict';
import {Civilization,createGame,BUILDINGS,BUILD_AGE} from './civilization-core.js';
import {TECHS,BUILD_TECH,techBlock} from './research.js';
import {START,RESOURCE_NAMES,MATERIAL_KEYS,initialState,tickEconomy,storageLimit} from './economy.js';
import {createBuildingModel} from './buildings.js';
import {recordWorldStep,roadKey,roadLevel} from './roads.js?v=60';
import {planTrade} from './trade-network.js';

const additions=['pottery','animal_husbandry','masonry','wheel','copper_tin','road_construction'];
const structures=['claypit','pottery_kiln','pasture','mason','cartwright','coppermine','tinmine','bronze_foundry','road_depot'];
for(const id of additions)assert.ok(TECHS[id]?.name,'Missing V60 research '+id);
for(const id of structures){
 assert.ok(BUILDINGS[id]?.name,'Missing building '+id);
 assert.ok(BUILD_TECH[id]&&TECHS[BUILD_TECH[id]],'Missing unlock rule '+id);
 assert.equal(BUILD_AGE[id],['cartwright','coppermine','tinmine','bronze_foundry','road_depot'].includes(id)?1:0);
 const g=createBuildingModel(id,0);
 assert.ok(g.children.some(m=>m.isMesh),'3D geometry must exist '+id);
}
for(const resource of ['clay','pottery','cutstone','copper','tin','bronze','carts']){
 assert.equal(START[resource],0);
 assert.ok(RESOURCE_NAMES[resource]);
 assert.ok(MATERIAL_KEYS.has(resource));
}
const known={known:['stone_tools']};
assert.equal(techBlock(known,'pottery'),'');
assert.ok(techBlock(known,'animal_husbandry'));
assert.ok(techBlock(known,'wheel'));
assert.ok(techBlock(known,'road_construction'));
const seed=17,legacy=createGame(seed);
const cityEco=initialState(seed);
cityEco.buildings=[{type:'hall',team:0,x:0,z:0,hp:1200,ready:true}];
for(const res of ['clay','pottery','cutstone','copper','tin','bronze','carts'])delete cityEco.realms[0].resources[res];
legacy.cities=[{id:0,team:0,c:legacy.settlers[0].c,r:legacy.settlers[0].r,name:'Vanast salvestusest',economy:cityEco,hp:600}];
legacy.worldRoads={[roadKey({c:3,r:3},{c:4,r:3})]:{heat:28,last:0}};
const game=new Civilization(legacy),city=game.s.cities[0],stock=city.economy.realms[0].resources;
assert.equal(game.s.version,4,'existing save schema unchanged');
for(const res of ['clay','pottery','cutstone','copper','tin','bronze','carts'])assert.equal(stock[res],0,'old stocks must be migrated');
for(const site of ['clay','copper','tin'])assert.ok(game.cell(city).deposits[site],'starting area must offer early resources');
assert.match(game.buildRule(city,'claypit'),/Uuri:/);
game.s.research[0].known.push('stone_tools','pottery');
assert.equal(game.buildRule(city,'claypit'),'');
assert.match(game.buildRule(city,'coppermine'),/Uuri:/);
game.s.research[0].known.push('bronze','masonry','copper_tin');
game.s.ages[0]=1;
assert.match(game.buildRule(city,'coppermine'),/Vaja: Kivimurd/,'mines still need a completed quarry');
city.economy.buildings.push({type:'quarry',team:0,x:8,z:0,ready:true,hp:350});
assert.equal(game.buildRule(city,'coppermine'),'');
stock.bronze=7;
const saved=JSON.parse(JSON.stringify(game.s)),loaded=new Civilization(saved);
assert.equal(loaded.s.cities[0].economy.realms[0].resources.bronze,7);
assert.deepEqual(loaded.s.worldRoads,game.s.worldRoads,'existing road wear must survive loading');
assert.ok(loaded.s.research[0].known.includes('copper_tin'),'new research survives save/load');

// Full goods production and haul-to-hall processing via the existing economy engine.
const e=initialState(19),r=e.realms[0];r.pop=100;
Object.assign(r.resources,{wood:900,stone:900,plank:900,grain:900,clay:0,pottery:0,copper:0,tin:0,cutstone:0,bronze:0,carts:0,bread:200,water:200});
e.buildings=[{type:'hall',team:0,x:0,z:0,hp:1200,ready:true}];
const factories=['claypit','pottery_kiln','pasture','mason','coppermine','tinmine','bronze_foundry','cartwright'];
for(let i=0;i<factories.length;i++)e.buildings.push({type:factories[i],team:0,x:i*4+6,z:0,parent:0,hp:350,ready:true,timer:0});
const env={skipDemographics:true,workerBudget:()=>100,assigned:b=>BUILDINGS[b.type].workers||0,productionBonus:()=>1,canOperate:()=>true,
 storageCap:()=>5000,storageUsed:(_team,k,st)=>st[k]||0,spawnPoint:b=>b,moveCargo:()=>true,operateWork:(_b,dt)=>dt};
const foodBefore=r.resources.bread;
for(let i=0;i<650;i++)tickEconomy(e,1,env);
for(const resource of ['clay','copper','tin','pottery','cutstone','bronze','carts'])assert.ok(r.resources[resource]>0,'factory must actually deliver '+resource);
assert.ok(r.resources.bread>foodBefore,'pasture must produce edible food');
const potFood=storageLimit(e.buildings,'bread');
assert.equal(potFood,160,'pottery kiln adds food storage to hall');
const traffic={time:5,worldRoads:{},roadRevision:0},a={c:1,r:1},b={c:2,r:1};
recordWorldStep(traffic,a,b,'roadworks',5);assert.equal(roadLevel(traffic.worldRoads[roadKey(a,b)].heat),0,'road crew must not create roads after one passage');
recordWorldStep(traffic,a,b,'roadworks',5);assert.ok(roadLevel(traffic.worldRoads[roadKey(a,b)].heat)>=1,'road crews build roads through repeated traffic');
// Crafted wagons must affect real intercity cargo, not merely inventory counters.
const fromStock={...START,wood:500,stone:500,plank:500,bread:100,water:100,carts:3};
const toStock={...START,wood:0,stone:0,plank:0,bread:0,water:0,carts:0};
const depot={type:'road_depot',ready:true,hp:350,assigned:1,disabled:false};
const from={id:0,c:8,r:8,team:0,economy:{realms:[{resources:fromStock}],buildings:[depot]}};
const to={id:1,c:9,r:8,team:0,economy:{realms:[{resources:toStock}],buildings:[]}};
const tradeGame={
 s:{cities:[from,to],shipments:[],nextShipment:1,research:[{known:[]}]},
 cityReady:(c,type)=>c.economy.buildings.some(b=>b.type===type&&b.ready&&!b.disabled),
 allBuildings:c=>c.economy.buildings,
 landPath:(_from,dest)=>[{c:dest.c,r:dest.r}],
 storageCap:()=>1000,storageUsed:(_city,key,stock)=>stock[key]||0
};
assert.equal(planTrade(tradeGame),1,'one scheduled convoy');
let shipment=tradeGame.s.shipments[0];
assert.equal(shipment.wagon,true,'wagon must be attached to road cargo');
assert.equal(shipment.roadCrew,true,'active road workshop upgrades dispatched caravan');
assert.ok(Object.values(shipment.goods).reduce((sum,n)=>sum+n,0)>36,'wagon should exceed pedestrian trade cargo capacity');
assert.equal(fromStock.carts,2,'wagon is consumed on dispatch');
depot.disabled=true;tradeGame.s.shipments=[];fromStock.carts=3;
assert.equal(planTrade(tradeGame),1);
shipment=tradeGame.s.shipments[0];
assert.equal(shipment.roadCrew,false,'disabled workshop gives no road maintenance');
assert.equal(shipment.wagon,true);
console.log('V60 PASS: six discoveries, nine modelled buildings, real production, clay/copper/tin sites, migration, roundtrip save, repeated traffic');
