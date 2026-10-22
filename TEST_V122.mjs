import assert from 'node:assert/strict';
import {Civilization,createGame} from './civilization-core.js?v=118a';
import {riverNear,worldElevation,localToWorld,getRivers,surface} from './continuous-landscape.js?v=122a';
import {createRiverNetwork} from './continuous-landscape-visual.js?v=122a';
import {COLS} from './campaign.js';
let total=0,checked=0,nearby=0;
for(const seed of [17,12345,20261018]){
 const game=new Civilization(createGame(seed));
 const fordEdges=getRivers(game).filter(e=>e.c.ford&&!e.c.bridge);
 const deepEdges=getRivers(game).filter(e=>!e.c.ford&&!e.c.bridge);
 assert.ok(fordEdges.length>=4,'Should produce multiple ford sites in world '+seed);
 assert.ok(deepEdges.length>10,'Most of the river should remain deep');
 for(const edge of fordEdges.slice(0,20)){
  const p=edge.c,near=riverNear(game,p.x,p.z),bed=worldElevation(game,p.x,p.z);
  assert.ok(near.fordStrength>.7,'Ford has a complete shallow segment at '+p.c+':'+p.r);
  assert.ok(near.waterHeight-bed<=.65,'Ford riverbed is ankle deep');
  assert.ok(game.canTraverse(0,p),'Ford opens the world path');
  const delta=5,dx=edge.points[1].x-edge.points[0].x,dz=edge.points[1].z-edge.points[0].z,length=Math.hypot(dx,dz)||1,nx=-dz/length,nz=dx/length;
  for(const sign of [-1,0,1]){
   const n=riverNear(game,p.x+nx*delta*sign,p.z+nz*delta*sign);
   if(n.distance<n.width*.85)assert.ok(n.fordStrength>.7,'Shallows extend across river width');
  }
  checked++;
 }
 for(const edge of deepEdges.slice(0,20)){
  const p=edge.c,n=riverNear(game,p.x,p.z),bed=worldElevation(game,p.x,p.z);
  if(n.fordStrength>.2)continue; // Adjacent to another ford.
  assert.ok(!game.canTraverse(0,p),'Deep river is not directly crossable on world map');
  assert.ok(n.waterHeight-bed>1.6,'Normal river remains deep');
 }
 const site=fordEdges.find(e=>e.c.land&&!e.c.mountain&&!game.cell(e.c).bridge);
 if(site){
  const loc=game.nav(site.c),c=site.c,here=localToWorld(c,0,0),level=riverNear(game,here.x,here.z);
  assert.ok(level.fordStrength>.7);
  // The same city navigation grid must contain at least one traversable
  // node in the central shallow-water corridor.
  let pass=0;
  for(const x of [-3,0,3])for(const z of [-3,0,3])if(loc.passable(x,z))pass++;
  assert.ok(pass>0,'Some shallow river positions are passable to detail walkers');
 }
 const water=createRiverNetwork(game,'detail',site?.c||fordEdges[0].c);
 assert.ok(water.userData.shallowFordCount>0,'Visible detail has shallow water geometry');
 assert.ok(water.children.some(ch=>ch.name==='shallow walkable ford shoals'),'Ford shallows are visually marked');
 const world=createRiverNetwork(game,'world');
 assert.ok(world.userData.shallowFordCount>=fordEdges.length,'World map shows ford patches');
 total+=fordEdges.length;nearby+=water.userData.shallowFordCount;
}
console.log('V122 PASS: '+checked+' shallow riverbeds, '+total+' walkable fords, deep-water barriers, local walker crossings, '+nearby+' rendered detail shoals across three maps.');
