import {detailWorldRoadWidth} from './road-width-v89.js';
import assert from 'node:assert/strict';
import {Civilization,createGame} from './civilization-core.js';
import {getRivers,sampleRiver,roadSpline,baseHeight,worldElevation,surface,localSurface,worldToLocal,roadNetwork} from './continuous-landscape.js';
import {createRiverNetwork,createUnifiedRoadNetwork,disposeNetwork} from './continuous-landscape-visual.js';
import {recordWorldStep} from './roads.js';
import {COLS,ROWS} from './campaign.js';

for(const seed of [17,12345,20261018]){
 const game=new Civilization(createGame(seed));
 const edges=getRivers(game),first=edges[0];
 assert.ok(edges.length>300,'a connected watershed exists');
 assert.ok(first.points.length>=11,'smooth Hermite river curve is sampled');
 for(const e of edges.slice(0,150)){
  const end=game.cell(e.c.riverTo),pts=sampleRiver(game,e.c,12);
  assert.ok(Math.abs(pts[0].x-e.c.x)<1e-8&&Math.abs(pts[0].z-e.c.z)<1e-8);
  assert.ok(Math.abs(pts.at(-1).x-end.x)<1e-8&&Math.abs(pts.at(-1).z-end.z)<1e-8);
  const next=end.riverTo?game.cell(end.riverTo):null;
  if(next?.river){
   const ext=sampleRiver(game,end,12);
   assert.ok(Math.abs(pts.at(-1).x-ext[0].x)<1e-8&&Math.abs(pts.at(-1).z-ext[0].z)<1e-8,'river edges connect exactly at shared junction');
   assert.ok(Math.abs(pts.at(-1).width-ext[0].width)<1e-8,'river banks join without width gap');
  }
 }
 const cell=first.c,neighbour=game.cell({c:cell.c+1,r:cell.r});
 if(neighbour){
  for(const z of [-24,-12,0,12,24]){
   const y=localSurface(game,cell,75,z*2.6),other=localSurface(game,neighbour,-75,z*2.6);
   assert.ok(Math.abs(y-other)<1e-8,'adjacent detail mesh heights meet exactly at x tile borders');
   const x=cell.x+25,Z=cell.z+z,global=surface(game,x,Z,'world');
   assert.ok(Math.abs((global-.7)*.30-y)<1e-8,'world and detail use the identical mountain/water height field');
  }
 }
 const world=createRiverNetwork(game,'world'),detail=createRiverNetwork(game,'detail',cell);
 assert.ok(world.children.some(c=>c.name==='continuous water surface'),'entire world river is one connected batched water surface');
 assert.ok(detail.children.some(c=>c.name==='continuous water surface'),'all 9 detailed neighbourhood tiles share one water surface');
 assert.ok(world.userData.riverVertexCount>detail.userData.riverVertexCount);
 const worldWater=world.children.find(c=>c.name==='continuous water surface');
 const detailWater=detail.children.find(c=>c.name==='continuous water surface');
 assert.ok(worldWater.geometry.index&&detailWater.geometry.index,'rivers form indexed continuous 3D surfaces');
 assert.ok(worldWater.geometry.attributes.position.count<worldWater.geometry.index.count,'river vertices are shared across triangles');
 const original=worldWater.geometry.attributes.position;
 const projected=detailWater.geometry.attributes.position;
 const firstGlobal=[original.getX(0),original.getY(0),original.getZ(0)],firstDetail=[projected.getX(0),projected.getY(0),projected.getZ(0)];
 const p=worldToLocal(cell,firstGlobal[0],firstGlobal[2]);
 assert.ok(Math.abs(firstDetail[0]-p.x)<.001&&Math.abs(firstDetail[2]-p.z)<.001,'same river mesh x/z coordinates, just world-to-detail projection');
 assert.ok(Math.abs(firstDetail[1]-(firstGlobal[1]-.7)*.30)<.001,'same river water heights, just world-to-detail projection');
 const positions=game.s.coastalStartPositions,orig=game.cell(positions[0]);
 const adjacent=[[1,0],[-1,0],[0,1],[0,-1]].map(([dc,dr])=>game.cell({c:orig.c+dc,r:orig.r+dr})).find(c=>c?.land&&!c.mountain);
 if(adjacent){
  game.reveal(0,orig,3);
  for(let i=0;i<15;i++)recordWorldStep(game.s,orig,adjacent,'army',game.s.time);
  const edges=roadNetwork(game);
  assert.ok(edges.length,'road has enough foot traffic to appear');
  assert.deepEqual(roadSpline(game,orig,adjacent),roadSpline(game,adjacent,orig),'same road from either tile');
  const network=createUnifiedRoadNetwork(game,'world'),local=createUnifiedRoadNetwork(game,'detail',orig);
  assert.equal(network.children.filter(c=>c.name==='continuous road pavement').length,1,'all roads share one road mesh');
  assert.equal(local.children.filter(c=>c.name==='continuous road pavement').length,1,'all detailed roads share one road mesh');
  assert.ok(local.userData.roadEdges>0);
  const worldRoad=network.children.find(c=>c.name==='continuous road pavement').geometry;
  const localRoad=local.children.find(c=>c.name==='continuous road pavement').geometry;
  assert.ok(worldRoad.index&&localRoad.index,'roads have welded vertices across adjacent segments');
  const W=worldRoad.attributes.position,L=localRoad.attributes.position;
  const wa=worldRoad.index.getX(0),wb=worldRoad.index.getX(1),la=localRoad.index.getX(0),lb=localRoad.index.getX(1);
  // Centerlines retain the world projection; tactical road widths intentionally do not scale 3x.
  assert.ok(Math.abs((L.getX(la)+L.getX(lb))/2-((W.getX(wa)+W.getX(wb))/2-orig.x)*3)<.002);
  assert.ok(Math.abs(L.getY(la)-(W.getY(wa)-.7)*.30)<.002);
  assert.ok(Math.abs((L.getZ(la)+L.getZ(lb))/2-((W.getZ(wa)+W.getZ(wb))/2-orig.z)*2.6)<.002);
  assert.ok(Math.abs(Math.hypot(L.getX(la)-L.getX(lb),L.getZ(la)-L.getZ(lb))-detailWorldRoadWidth(edges[0].level))<.002);
  disposeNetwork(network);disposeNetwork(local);
 }
 console.log('V67',seed,{watersheds:edges.length,detailRiverTriangles:detail.userData.riverVertexCount/3,fullRiverTriangles:world.userData.riverVertexCount/3});
 disposeNetwork(world);disposeNetwork(detail);
}
console.log('V67 PASS: continuous height field, matched projected water and roads, C0 stream junctions, no per-tile river mesh seams');
