import assert from 'node:assert/strict';
import {Civilization,createGame,BUILDINGS,TROOPS} from './civilization-core.js';
import {initialState} from './economy.js';
import {COLS,ROWS} from './campaign.js';

const DELTAS=[[1,0],[-1,0],[0,1],[0,-1]];
const buildAt=({g,city,type,dx,dr,p={x:0,z:0}})=>g.buildInArea(city,type,{x:dx*150+p.x,z:dr*130+p.z});
for(const seed of [17,42,12345,20261018]){
 const state=createGame(seed),g=new Civilization(state),start=state.coastalStartPositions[0],econ=initialState(seed);
 const bank=econ.realms[0];bank.pop=65;for(const k of Object.keys(bank.resources))bank.resources[k]=20000;
 econ.buildings=[{type:'hall',team:0,x:0,z:0,ready:true,hp:1200}];
 const city={id:0,team:0,name:'Üks linn',c:start.c,r:start.r,economy:econ,world:g.localWorld(start),hp:600,districts:{}};
 g.s.cities.push(city);g.prepareCity(city);g.s.research[0].known.push('stone_tools','warfare');
 const area=g.constructionArea(city);
 assert.ok(area.tiles.length>1,'population grows the shared buildable city beyond its capital');
 assert.equal(area.parent,city);
 assert.equal(area.stock,bank.resources,'one shared stockpile');
 const neighbour=DELTAS.map(([dx,dr])=>({dx,dr,tile:g.cell({c:city.c+dx,r:city.r+dr})})).find(({tile})=>tile?.land&&!tile.mountain&&g.territoryOwner(tile)?.id===city.id);
 assert.ok(neighbour,'first owned neighbouring tile exists');
 const {dx,dr}=neighbour;
 assert.equal(g.previewInArea(city,'house',{x:dx*150,z:dr*130}).ctx.districtOf,city.id);
 let spot=null;
 for(let x=-50;x<=50&&!spot;x+=10)for(let z=-35;z<=35&&!spot;z+=7){
  const check=g.previewInArea(city,'house',{x:dx*150+x,z:dr*130+z});
  if(!check.error)spot={x,z};
 }
 assert.ok(spot,'suitable position on adjacent owned tile');
 const before=bank.resources.wood;
 const result=buildAt({g,city,type:'house',dx,dr,p:spot});
 assert.ok(result.building,'building accepted anywhere in shared city land');
 assert.equal(result.ctx.districtOf,city.id);
 assert.equal(result.ctx.economy.realms[0],city.economy.realms[0],'no extra population or stockpile');
 assert.equal(bank.resources.wood,before-BUILDINGS.house.cost.wood,'materials deducted only once');
 assert.ok(!city.economy.buildings.includes(result.building),'physical building stays in its actual detail tile');
 assert.ok(g.allBuildings(city).includes(result.building),'parent city accounts for building');
 assert.equal(g.constructionArea(result.ctx).pending.length,1,'one shared construction queue');
 assert.equal(result.ctx.name,city.name,'district is not a separate city in UI');
 // The next building remains valid even though first was ordered on another tile.
 assert.equal(g.constructionArea(city).pending.length,1);
 // Headquarters prerequisites are shared with the district and vice versa.
 result.building.ready=true;
 assert.equal(g.cityReady(city,'house'),true);
 assert.equal(g.cityReady(result.ctx,'house'),true);
 // The barracks is physically in a district; recruiting in the capital must
 // recognize that district's building instead of requiring a second barracks.
 result.building.type='barracks';result.building.hp=350;result.building.ready=true;
 assert.equal(g.cityReady(city,'barracks'),true);
 const unitNeed=TROOPS.slinger.cost;
 const popBefore=bank.pop;
 const recruit=g.recruit(city,'slinger');
 assert.ok(recruit.queued,'capital recruits using a district barracks');
 assert.equal(bank.pop,popBefore-3,'population cost applied only once');
 assert.equal(recruit.queued.kind,'slinger');
 // One hard cap of 12 pending buildings, regardless of their local positions.
 for(let i=0;i<11;i++)city.economy.buildings.push({type:'house',team:0,ready:false,hp:350,x:-60+i*2,z:45});
 result.building.ready=false;
 assert.equal(g.constructionArea(city).pending.length,12);
 assert.match(g.previewInArea(city,'house',{x:dx*150+spot.x,z:dr*130+spot.z}).error,/12 hoonet/,'global queue limit applies from neighbour');
 assert.equal(g.canBuildNow(city,'house'),false);
 assert.equal(g.canBuildNow(result.ctx,'house'),false);
 // A neighbouring NON-owned tile may never be built upon.
 const out=DELTAS.map(([dc,dr])=>({dc,dr,tile:g.cell({c:city.c+dc,r:city.r+dr})})).find(({tile})=>!tile?.land||g.territoryOwner(tile)?.id!==city.id);
 if(out)assert.match(g.previewInArea(city,'house',{x:out.dc*150,z:out.dr*130}).error,/ei kuulu/);
 // A save/load roundtrip keeps the same one-city economy and district model.
 const saved=JSON.parse(JSON.stringify(g.s));
 const reloaded=new Civilization(saved),root=reloaded.s.cities.find(c=>c.id===city.id),other=reloaded.contextAt(neighbour.tile,false);
 assert.ok(other);
 assert.equal(other.economy.realms[0],root.economy.realms[0]);
 assert.equal(reloaded.constructionArea(root).pending.length,12);
 assert.equal(reloaded.constructionArea(other).stock,root.economy.realms[0].resources);
 assert.equal(root.id,other.districtOf);
 console.log('V66 city',seed,{tiles:area.tiles.length,district:[other.c,other.r],queue:12,stock:root.economy.realms[0].resources.wood});
}
console.log('V66 PASS: one construction area for every owned tile, global prerequisites, costs, workers and queues, saved across reloads');
