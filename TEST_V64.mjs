import {coastalSites} from './resource-sites-v88.js';
import assert from 'node:assert/strict';
import {Civilization,createGame,BUILDINGS} from './civilization-core.js';
import {initialState,buildRule as economicBuildRule} from './economy.js';
import {fishingRange,isShore,fishingBanks,fishingHarvest} from './fishery.js';
import {COLS,ROWS} from './campaign.js';
const seeds=[17,12345,20261018];
for(const seed of seeds){
 const state=createGame(seed),g=new Civilization(state);
 let near=0,offshore=0,dryFish=0,all=0;
 for(const cell of g.cells){if(cell.land){if(cell.deposits.fish||cell.detail.resources.some(a=>a[0]===4))dryFish++}
  else if(cell.deposits.fish){all++;if(cell.fishDepth<=2)near++;if(cell.fishDepth>=5)offshore++;if(!cell.detail.resources.some(a=>a[0]===4))throw Error('Sea fish not visible in detail')}}
 assert.equal(dryFish,0,'no fish resources on dry land');
 assert.ok(near>50,'fish near shores');
 assert.ok(offshore>100,'fish farther offshore');
 assert.ok(all>1000,'populated ocean fish stocks');
 assert.deepEqual([0,1,2,3,4,5,6].map(fishingRange),[1,2,4,7,11,17,28]);
 const start=state.coastalStartPositions.find(p=>coastalSites(g,g.cell(p),'fisher').length),beach=g.cell(start);
 assert.equal(isShore(g,beach),true,'every new capital is beside the sea');
 const nearBanks=fishingBanks(g,beach,0),bronzeBanks=fishingBanks(g,beach,1),ironBanks=fishingBanks(g,beach,2);
 assert.ok(nearBanks.length,'Stone Age catches close to shore');
 assert.ok(nearBanks.every(x=>x.depth===1),'Stone Age cannot fish offshore');
 assert.ok(bronzeBanks.every(x=>x.depth<=2),'Bronze Age only shallow waters');
 assert.ok(ironBanks.every(x=>x.depth<=4),'Iron Age range limited');
 assert.ok(bronzeBanks.length>=nearBanks.length,'Bronze Age fishing access expands');
 // In existing V4 saves, stranded legacy fish may appear in town-world resource
 // lists. Migrating those locations must not move cities or leave fish on land.
 const econ=initialState(seed);econ.settlers=[];econ.buildings=[{type:'hall',x:0,z:0,ready:true,team:0,hp:1200}];
 const city={id:0,team:0,c:beach.c,r:beach.r,name:'Fish Test',economy:econ,world:g.makeWorld(beach),hp:600};
 g.s.cities.push(city);g.prepareCity(city);
 city.world.resources.push({kind:'fish',x:9,z:8,amount:22});
 g.prepareCity(city);
 assert.ok(!city.world.resources.some(r=>r.kind==='fish'),'old dry fish migrated away');
 const original={c:city.c,r:city.r};
 g.s.research[0].known.push('fishing');econ.realms[0].resources.wood=10000;econ.realms[0].resources.stone=10000;
 assert.equal(g.buildRule(city,'fisher'),'','coastal fish hut allowed');
 let testSite=null;
 for(const p of g.buildingSites(city,'fisher'))if(!g.previewBuild(city,'fisher',p).error){testSite=p;break;}
 assert.ok(testSite,'coast fishing hut buildable beyond old 13-step distance limit');
 const fisher=g.build(city,'fisher',testSite);
 assert.ok(fisher.building,'remote fisher actually placed');
 const nonshore=g.cells.find(c=>c.land&&!c.mountain&&!isShore(g,c));
 assert.ok(nonshore);
 city.c=nonshore.c;city.r=nonshore.r;g.territoryStamp=null;
 assert.match(g.buildRule(city,'fisher')||'',/Kalamehe onni saab ehitada ainult/,'fishing hut forbidden inland');
 Object.assign(city,original);g.territoryStamp=null;
 const source=fisher.building;source.ready=true;source.assigned=2;source.efficiency=1;
 let carried=0;
 const nav=g.nav(city);
 for(let t=0;t<200;t++){
  g.s.time++;
  carried+=fishingHarvest(g,city,source,BUILDINGS.fisher,1,nav,1/3);
 }
 assert.ok(carried>0,'real coastal fishing produces an edible catch');
 assert.ok(Object.keys(g.s.fishStocks||{}).length>0,'harvesting consumes actual offshore stocks');
 const fisherWorker=city.world.workers['fishery:'+city.economy.buildings.indexOf(source)];
 for(const age of [0,1,2,3,4,5,6]){
  g.s.ages[0]=age;fisherWorker.phase='seek';g.s.time+=1;
  fishingHarvest(g,city,source,BUILDINGS.fisher,1,nav,1/3);
  const bank=g.cell(fisherWorker.catchTile);
  assert.ok(bank&&!bank.land&&bank.deposits.fish,'fisher visits real offshore stock');
  assert.ok(bank.fishDepth<=fishingRange(age),'boat cannot fish beyond era range');
  if(age===0)assert.equal(fisherWorker.tripTotal,0,'Stone Age worker never leaves shore by boat');
  else assert.ok(fisherWorker.tripTotal>0,'later eras actually sail out');
  const reachable=fishingBanks(g,city,age);
  if(age>=2&&reachable.some(p=>p.depth>=Math.max(2,Math.ceil(fishingRange(age)*.45))&&p.dist>=Math.max(2,fishingRange(age)*.40)))
   assert.ok(bank.fishDepth>=Math.max(2,Math.ceil(fishingRange(age)*.45)),'advanced fishing uses offshore schools');
 }
 g.s.ages[0]=0;
 console.log('V64 fish seed',seed,JSON.stringify({fishSchools:all,near,offshore,coast:start,catch:carried,remoteHut:testSite}));
}
const econ=initialState(17);econ.buildings=[{type:'hall',x:0,z:0,team:0,ready:true,hp:1200}];econ.realms[0].resources.wood=10000;econ.realms[0].resources.stone=10000;
const env={passable:()=>true,segmentDry:()=>true,canBuild:()=>true,requirement:()=>'',unlimitedBuildingRange:true};
assert.equal(economicBuildRule(econ,0,'fisher',{x:60,z:42},env).parent,0,'remote site can connect to city hall');
assert.match(economicBuildRule(econ,0,'fisher',{x:2,z:2},env).error,/liiga lähedal/,'building collisions still enforced');
assert.match(economicBuildRule(econ,0,'fisher',{x:60,z:42},{...env,unlimitedBuildingRange:false}).error,/13 sammu/,'legacy stricter rule still available outside city mode');
console.log('V64 PASS: water fish near/far, all era reach, coast-only huts, distant builds, real production and safe migration');
