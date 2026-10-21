import {planMerchants,advanceMerchant,receiveMerchant} from './merchant-v87.js';
import assert from 'node:assert/strict';
import {Civilization,createGame,BUILDINGS} from './civilization-core.js';
import {initialState,tickEconomy} from './economy.js';
import {TECHS,startResearch,tickResearch,newResearch} from './research.js';
import {MINERAL_BUILDINGS,consolidateMinerals,mineralSite,coastalSites,coastalPlacement} from './resource-sites-v88.js';
import {nationalResourceNeeds,settlementResourceScore} from './settlement-ai-v88.js';
import {localSurface} from './continuous-landscape.js';
import {door,Navigation} from './navigation.js';
import {createAgeBuilding} from './buildings.js';

const oldRoadIndex=(-7+62)*145+(10+72),roadWorld={resources:[],heat:{[oldRoadIndex]:30},heatLast:{[oldRoadIndex]:4}};
const expanded=new Navigation(roadWorld,()=>true,()=>[],{minX:-88,minZ:-78,w:177,h:157});
assert.equal(roadWorld.heat[expanded.index(10,-7)],30,'coast-grid expansion preserves actual old road coordinates');
const again=new Navigation(roadWorld,()=>true,()=>[],{minX:-88,minZ:-78,w:177,h:157});assert.equal(roadWorld.heat[again.index(10,-7)],30,'road migration is idempotent');
const g=new Civilization(createGame(8417));
function town(tile,team=0){
 const economy=initialState(8417);economy.settlers=[];economy.units=[];economy.cargo=[];
 economy.buildings=[{type:'hall',x:0,z:0,team,hp:1200,ready:true},{type:'lumber',x:-18,z:0,team,hp:350,ready:true}];
 const r=economy.realms[team];r.pop=8;for(const k of Object.keys(r.resources))r.resources[k]=500;
 const city={id:g.s.cities.length,c:tile.c,r:tile.r,team,name:'Test '+team,hp:600,economy,world:g.makeWorld(tile)};
 g.s.cities.push(city);g.prepareCity(city);g.territoryStamp=null;return city;
}
g.s.research[0].known=Object.keys(TECHS);g.s.ages[0]=6;
const beach=g.cell(g.s.coastalStartPositions[0]),c=town(beach);
// One visible deposit per mineral; migration conserves remaining quantities.
for(const kind of new Set(Object.values(MINERAL_BUILDINGS)))assert.ok(c.world.resources.filter(r=>r.kind===kind&&!r.removed).length<=1);
const old={resources:[{id:0,kind:'stone',x:20,z:20,amount:200},{id:1,kind:'stone',x:-20,z:20,amount:130}],revision:0};
consolidateMinerals(old,{...beach,deposits:{stone:true}});
assert.equal(old.resources.filter(r=>r.kind==='stone'&&!r.removed).length,1);assert.equal(old.resources[0].amount,330);assert.equal(old.resources[1].amount,0);
consolidateMinerals(old,beach);assert.equal(old.resources[0].amount,330,'save migration is idempotent');
const node=mineralSite(c.world,'quarry');
assert.match(g.previewBuild(c,'quarry',{x:0,z:20}).error,/otse maardla/);
const q=g.build(c,'quarry',{x:node.x+.5,z:node.z+.5});assert.ok(q.building,q.error);assert.equal(q.building.x,node.x);assert.equal(q.building.z,node.z);
assert.match(g.previewBuild(c,'quarry',node).error,/juba/);q.building.ready=true;
const before=node.amount,initial=c.economy.realms[0].resources.stone;c.economy.realms[0].resources.stone=0;
const env={...g.env(c),skipDemographics:true,assigned:b=>b===q.building?3:0};
for(let i=0;i<720;i++)tickEconomy(c.economy,.5,env);
const delivered=c.economy.realms[0].resources.stone,pending=c.economy.cargo.filter(x=>x.key==='stone').reduce((n,x)=>n+x.amount,0);
assert.ok(delivered>0,'a worker operates the on-site quarry and a carrier delivers its output');
assert.ok(Math.abs(before-node.amount-delivered-pending)<1e-6,'finite deposit, stores and in-transit cargo conserve extracted material');
c.economy.realms[0].resources.stone=initial;
// Coastline, rotation and a dry accessible land entry are actual placement rules.
for(const type of ['fisher','harbor']){
 assert.ok(g.previewBuild(c,type,{x:0,z:0}).error,'inland placement forbidden');
 const p=coastalSites(g,beach,type).find(p=>!g.previewBuild(c,type,p).error);assert.ok(p,'a real split land/sea site exists for '+type);
 const check=g.previewBuild(c,type,p),b=g.buildInArea(c,type,p).building;assert.ok(b,'player area-building can cross the land/sea tile seam');
 const inside={x:b.x+Math.sin(b.shoreAngle)*3.5,z:b.z+Math.cos(b.shoreAngle)*3.5},outside={x:b.x-Math.sin(b.shoreAngle)*3.5,z:b.z-Math.cos(b.shoreAngle)*3.5};
 assert.ok(localSurface(g,beach,inside.x,inside.z)>.15);assert.ok(localSurface(g,beach,outside.x,outside.z)<0);assert.deepEqual(door(b),check.landEntry);
 assert.ok(g.nav(c).route(door(c.economy.buildings[0]),door(b)),'builders can reach the dry entrance');
 b.hp=0;
}
// Every era uses the split waterfront model; ore changes from an exposed pit
// to a shaft, while stone/clay keep historically appropriate surface pits.
for(let age=0;age<7;age++)for(const type of ['fisher','harbor']){const m=createAgeBuilding(type,0,age);assert.ok(m.getObjectByName('land-section'));assert.ok(m.getObjectByName('sea-section'));}
assert.equal(createAgeBuilding('mine',0,1).userData.underground,false);
assert.equal(createAgeBuilding('mine',0,3).userData.underground,true);
assert.equal(createAgeBuilding('quarry',0,6).userData.underground,false);
// National coverage includes districts, and rare missing ore outweighs a nearer
// redundant location when selecting the next city.
const ai=town(g.cell(g.s.coastalStartPositions[1]),1);g.s.settlers=g.s.settlers.filter(a=>a.team!==1);
g.s.ages[1]=2;g.s.research[1].known=['stone_tools','hunting','learning','water','agriculture','bronze','settlement','woodworking','iron'];g.s.research[1].active='stone_crafts';
assert.ok(nationalResourceNeeds(g,1).includes('ore'));
const ore=g.cells.find(t=>t.land&&!t.mountain&&t.deposits.ore&&Math.abs(t.c-ai.c)+Math.abs(t.r-ai.r)<18&&g.landPath(ai,t,1));assert.ok(ore);
assert.ok(settlementResourceScore(g,1,ore,['ore'])>settlementResourceScore(g,1,{...ore,deposits:{}},['ore']));
g.s.time=700;g.aiTeam(1);const settler=g.s.settlers.find(a=>a.team===1);assert.ok(settler,'AI funds a real second-city settler');g.aiTeam(1);
const target=settler.path.at(-1)||settler;assert.ok(g.cell(target).deposits.ore,'actual AI movement targets a missing national raw material');
const coverage={s:g.s,cell:p=>g.cell(p),contexts:city=>city===ai?[ai,{...target,world:g.makeWorld(g.cell(target))}]:g.contexts(city)};
assert.ok(!nationalResourceNeeds(coverage,1).includes('ore'),'a national district also supplies resource coverage');
Object.assign(settler,{c:target.c,r:target.r,path:[],landed:true,localTarget:null});let specialized;
for(let x=-18;x<=18&&!specialized;x+=6)for(let z=-18;z<=18&&!specialized;z+=6){if(g.siteRule(settler,{x,z}))continue;settler.x=x;settler.z=z;specialized=g.found(settler.id).city;}
assert.ok(specialized);assert.ok(specialized.resourceSpecialization.includes('ore'));assert.ok(ai.importRequests.ore>=16);
for(const k of Object.keys(specialized.economy.realms[1].resources))specialized.economy.realms[1].resources[k]=1000;
specialized.economy.realms[1].resources.ore=0;
const ironNode=mineralSite(specialized.world,'mine'),mine=g.build(specialized,'mine',ironNode);assert.ok(mine.building,mine.error);mine.building.ready=true;
const extraction={...g.env(specialized),skipDemographics:true,assigned:b=>b===mine.building?4:0};
for(let i=0;i<720;i++)tickEconomy(specialized.economy,.5,extraction);
assert.ok(specialized.economy.realms[1].resources.ore>28,'specialized city actually mines ore for export');
ai.economy.realms[1].resources.ore=0;const towns=g.s.cities;g.s.cities=[ai,specialized];planMerchants(g);
const cargo=g.s.shipments.find(c=>c.to===ai.id&&c.goods.ore>0);assert.ok(cargo,'ore is dispatched between actual national cities');
assert.equal(ai.economy.realms[1].resources.ore,0,'goods do not teleport');advanceMerchant(g,cargo,200);receiveMerchant(g,cargo);assert.ok(ai.economy.realms[1].resources.ore>0,'caravan delivers ore to the existing city');g.s.cities=towns;

// Research is completed once per country and immediately unlocks both cities.
const second=town(g.cell(g.s.coastalStartPositions[2]),1);g.s.research[1]=newResearch();
assert.ok(startResearch(g.s,1,'stone_tools').ok);tickResearch(g.s,6000);
assert.ok(g.s.research[1].known.includes('stone_tools'));assert.equal(g.buildRule(ai,'quarry'),'');assert.equal(g.buildRule(second,'quarry'),'');
g.s.research[1].known.push('stone_crafts');assert.equal(g.bonus(ai.team),g.bonus(second.team));assert.ok(g.bonus(1)>g.bonus(2));
const loaded=new Civilization(JSON.parse(JSON.stringify(g.s)));assert.ok(loaded.s.research[1].known.includes('stone_crafts'));assert.equal(loaded.bonus(1),g.bonus(1));assert.equal(mineralSite(loaded.localWorld(c),'quarry').amount,node.amount);assert.equal(mineralSite(loaded.localWorld(specialized),'mine').amount,ironNode.amount);
console.log('V88 SITES PASS: on-deposit production, finite stocks, migration, split coast buildings, all-era models, AI resource expansion and national research');
