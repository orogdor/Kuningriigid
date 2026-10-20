import assert from 'node:assert/strict';
import * as T from './vendor/three.module.js';
import {Civilization,createGame} from './civilization-core.js';
import {createRiverNetwork,disposeNetwork} from './continuous-landscape-visual.js';
import {getRivers,surface,worldToLocal,projectHeight} from './continuous-landscape.js';
import {crossingFrame,createCrossingModel,createMountainOutcrops,mountainTint} from './landscape-polish-v84.js';
const near=(a,b,e=.004)=>assert.ok(Math.abs(a-b)<e,`${a} != ${b}`);
for(const seed of [17,12345,20261018]){
 const g=new Civilization(createGame(seed)),edge=getRivers(g).find(e=>e.c.ford&&e.c.land);
 assert.ok(edge);const tile=edge.c,bridge={...tile,bridge:true};
 const before=JSON.stringify(g.s);
 const frame=crossingFrame(g,bridge),pts=edge.points,a=pts[0],b=pts[1];
 near(frame.normal.x*(b.x-a.x)+frame.normal.z*(b.z-a.z),0,.00001);
 assert.ok(frame.halfSpan>pts[0].width*1.65,'deck and ramps reach dry banks');
 const world=createCrossingModel(g,bridge),detail=createCrossingModel(g,bridge,'detail',tile);
 for(const v of [new T.Vector3(-1,0,0),new T.Vector3(1,0,0),new T.Vector3(.2,4,.4)]){
  const W=v.clone().applyMatrix4(world.matrix),D=v.clone().applyMatrix4(detail.matrix),p=worldToLocal(tile,W.x,W.z);
  near(D.x,p.x);near(D.z,p.z);near(D.y,projectHeight(W.y,'detail'));
 }
 const L=new T.Vector3(1,0,0).applyMatrix4(world.matrix),R=new T.Vector3(-1,0,0).applyMatrix4(world.matrix);
 near(L.y,surface(g,frame.left.x,frame.left.z));near(R.y,surface(g,frame.right.x,frame.right.z));
 assert.equal(createCrossingModel(g,tile).userData.crossingStyle,'ford');
 const river=createRiverNetwork(g,'detail',tile),water=river.children.find(x=>x.name==='continuous water surface');
 assert.ok(water?.geometry.index);const colors=water.geometry.attributes.color.array;
 assert.ok(new Set(Array.from(colors).map(n=>n.toFixed(3))).size>12,'shallow edges and deep mid-channel have distinct colors');
 const rocks=createMountainOutcrops(g);assert.ok(rocks.userData.outcropCount>20);
 const crags=rocks.children[0];assert.ok(crags.geometry.attributes.position.count<300,'batched low-poly crests');
 assert.equal(JSON.stringify(g.s),before,'landscape rendering does not alter saved geography, resources or visibility');
 const rockColor=mountainTint(new T.Color('#65804f'),15,25,90,.95);
 assert.ok(rockColor.r>.5&&rockColor.g>.5,'high gentle crests receive pale snow');
 console.log('V84 LANDSCAPE PASS '+JSON.stringify({seed,crossingSpan:frame.halfSpan*2,outcrops:rocks.userData.outcropCount,riverVertices:water.geometry.attributes.position.count}));
 disposeNetwork(river);disposeNetwork(rocks);
}
