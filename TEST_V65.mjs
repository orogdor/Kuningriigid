import assert from 'node:assert/strict';
import * as T from './vendor/three.module.js';
import {createGame,Civilization} from './civilization-core.js';
import {riverSegmentsNear,rockSites,pointsOfRiver,roadCurve,worldToDetail,detailToWorld} from './landscape-shared.js';
import {createDetailLandscape} from './detail-landscape.js';
import {createDetailWorldRoads} from './detail-roads.js';
import {roadKey,recordWorldStep} from './roads.js?v=59';

for(const seed of [17,42,12345,777]){
 const g=new Civilization(createGame(seed));
 assert.equal(g.s.hydrologyVersion,2,'new games opt in to improved rivers');
 const riverCells=g.cells.filter(c=>c.river&&c.riverTo),mountains=g.cells.filter(c=>c.mountain);
 assert.ok(riverCells.length>100,'large connected rivers exist');
 assert.ok(mountains.length>100,'mountains exist');
 const sample=riverCells[Math.floor(riverCells.length*.4)],to=g.cell(sample.riverTo);
 const samples=pointsOfRiver(g,sample,12),paths=riverSegmentsNear(g,sample);
 assert.ok(paths.some(x=>x.cell===sample),'river path appears in its detail tile');
 assert.deepEqual({x:samples[0].x,z:samples[0].z},{x:sample.x,z:sample.z});
 assert.deepEqual({x:samples.at(-1).x,z:samples.at(-1).z},{x:to.x,z:to.z});
 assert.ok(samples.some((v,i)=>i&&i<samples.length-1&&Math.hypot(v.x-sample.x-(to.x-sample.x)*i/12,v.z-sample.z-(to.z-sample.z)*i/12)>.01),'river curves rather than only straight segments');
 for(const c of riverCells.slice(0,120)){
  let pos=c,visited=new Set(),steps=0;
  while(pos?.land&&steps++<40000){
   const id=pos.c+':'+pos.r;assert.ok(!visited.has(id),'drainage must be acyclic');
   visited.add(id);if(!pos.riverTo)break;
   const next=g.cell(pos.riverTo);assert.ok(next,'rivers must point to valid cells');
   if(next.river)assert.ok(next.riverFlow>=pos.riverFlow,'tributaries accumulate downstream');
   pos=next;
  }
  assert.ok(steps<40000,'river cannot loop indefinitely');
 }
 const riverScene=createDetailLandscape(g,sample,(x,z)=>2);
 assert.ok(riverScene.userData.riverVertexCount>0,'river visible in detailed view');
 assert.ok(riverScene.children.some(o=>o.isMesh),'water is drawn as geometry');
 const stone=mountains[Math.floor(mountains.length*.45)],peaks=rockSites(g,stone),rockDetail=createDetailLandscape(g,stone,(x,z)=>3);
 assert.equal(rockDetail.userData.rockCount,peaks.length,'atlas and detail share identical cliffs');
 assert.ok(peaks.length>0);
 for(const peak of peaks){const q=worldToDetail(stone,peak.x,peak.z),world=detailToWorld(stone,q.x,q.z);assert.ok(Math.abs(world.x-peak.x)<1e-8&&Math.abs(world.z-peak.z)<1e-8,'world/detail projection is lossless')}
 const coast=g.s.coastalStartPositions[0],neighbor=[[1,0],[-1,0],[0,1],[0,-1]].map(([dc,dr])=>g.cell({c:coast.c+dc,r:coast.r+dr})).find(c=>c?.land&&!c.mountain&&!c.river);
 if(neighbor){
  const a=g.cell(coast),b=neighbor;
  assert.deepEqual(roadCurve(g,a,b),roadCurve(g,b,a),'roads project with same bend from both ends');
  for(let i=0;i<4;i++)recordWorldStep(g.s,a,b,'army',0);
  g.s.explored[0][b.r*g.cols+b.c]=1;
  const nav=g.nav(a),road=createDetailWorldRoads(g,a,nav,()=>2);
  assert.ok(road.children.length>=1,'world road is drawn within detail tile');
 }
 console.log('V65 shared geography',seed,{riverCells:riverCells.length,cliffs:mountains.length,at:sample.c+':'+sample.r});
}
const old=createGame(17);old.hydrologyVersion=1;const saved=new Civilization(old);assert.equal(saved.s.hydrologyVersion,1,'old river rules remain intact');
console.log('V65 PASS: seeded drainage, curving paths, identical cliff positions, detailed water and road alignment, old saves');
