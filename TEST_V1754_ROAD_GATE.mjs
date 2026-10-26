// V175.4 road rendering follows the SAME gate-aware navigation as soldiers,
// while the terrain is marked ONLY by real pedestrian/unit traffic.
import assert from 'node:assert/strict';
import {Navigation} from './navigation.js';
import {navigableWorldRoadV1754,createDetailTrailLinks} from './detail-roads.js';
const builders=(gate)=>{
 const buildings=[
  {type:'palisade',x:-11,z:0,hp:350,palisadeSpanV167:14,wallAxis:0},
  {type:'palisade',x:11,z:0,hp:350,palisadeSpanV167:14,wallAxis:0}
 ];
 if(gate)buildings.push({type:'woodgate',x:0,z:0,hp:350,ready:true,
   wallAxis:0,extendedPalisadeV166:true});
 const world={resources:[],heat:{},heatLast:{},trailTime:20};
 const nav=new Navigation(world,()=>true,()=>buildings,
  {minX:-30,minZ:-25,w:61,h:51});
 return {nav,world};
};
const {nav,world}=builders(true);
const direct=navigableWorldRoadV1754(nav,{x:0,z:-8},{x:0,z:8});
assert.equal(direct.length,2,'world road goes directly through open gate');
assert.equal(nav.open(0,0),true);
const detour=navigableWorldRoadV1754(nav,{x:11,z:-8},{x:11,z:8});
assert.ok(detour.length>2,'world road routes around timber via gate');
assert.ok(detour.every((p,i)=>i===0||nav.clear(detour[i-1],p)),
 'no road ribbon may be drawn across a solid wall');
// Fresh world traffic starts with no visible paths.
assert.deepEqual(Object.keys(world.heat),[]);
for(let i=0;i<12;i++)
 nav.recordTraffic({x:0,z:-8},{x:0,z:8},3);
const spots=Object.keys(world.heat).map(key=>({key:Number(key)}))
 .filter(({key})=>nav.roadLevel(key)>0);
assert.ok(spots.length>8,'footsteps create real marked path through gate');
const visual=createDetailTrailLinks(spots,nav,()=>0);
const verts=visual.children.reduce((n,o)=>n+(o.geometry?.attributes?.position?.count||0),0);
assert.ok(verts>18,'real gate passage renders earth ribbon');
const blocked={nav:builders(false).nav};
const pathNoGate=navigableWorldRoadV1754(blocked.nav,{x:0,z:-8},{x:0,z:8});
assert.ok(pathNoGate.every((p,i)=>i===0||blocked.nav.clear(pathNoGate[i-1],p)),
 'no-gate wall is never painted through, even when routing around an end');
assert.ok(nav.open(11,0)===false,'regular wall remains physically solid');
console.log('V175.4 GATE ROAD RIBBONS PASS '+JSON.stringify({
 viaGate:direct.length,detourNodes:detour.length,visibleCells:spots.length,
 ribbonVertices:verts,worldRoutesOnlyThroughWalkableGround:true}));
