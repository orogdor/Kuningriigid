// V175.3: drawn wall joins must be continuous, collision-solid, and
// must NEVER replace the use-generated paths, their wear, or V4 save logic.
import assert from 'node:assert/strict';
import {wallStrokePlanV175,wallPointInsideV175,WALL_DRAW_V175} from './wall-draw-v175.js';
import {Navigation,buildingClearance} from './navigation.js';
const verify=(label,points,mode)=>{
 const plan=wallStrokePlanV175(points,mode);
 assert.ok(!plan.error,label+': '+plan.error);
 assert.ok(plan.segments.length>=3,label+': at least three real segments');
 assert.ok(plan.segments.length<=10,label+': ten segment max');
 const walls=plan.segments.map(b=>({...b,type:'palisade',hp:350,ready:true,team:0}));
 for(let i=0;i<walls.length;i++){
  const w=walls[i],core=Math.hypot(w.to.x-w.from.x,w.to.z-w.from.z);
  assert.ok(w.palisadeSpanV167>core+.3,label+': overlapping ends '+i);
  assert.ok(w.palisadeSpanV167<=8,label+': physical segment fits build limit');
  assert.ok(Number.isFinite(w.wallAngleV175));
  if(i>0){
   const prev=walls[i-1],joint=w.from;
   assert.ok(Math.hypot(prev.to.x-joint.x,prev.to.z-joint.z)<1e-7,label+': endpoints meet');
   assert.ok(wallPointInsideV175(joint,w,.05),label+': new wall reaches corner');
   assert.ok(wallPointInsideV175(joint,prev,.05),label+': previous wall reaches corner');
  }
 }
 const world={resources:[],heat:{},heatLast:{},trailTime:20};
 const nav=new Navigation(world,()=>true,()=>walls,{minX:-90,minZ:-85,w:181,h:171});
 for(const w of walls){
  assert.equal(nav.open(w.x,w.z),false,label+': soldier cannot cross the center of wall');
  assert.ok(buildingClearance(w).rx>0&&buildingClearance(w).rz>0);
 }
 for(let i=1;i<walls.length;i++){
  const j=walls[i].from;
  assert.equal(nav.open(j.x,j.z),false,label+': no traversable crack at joint '+i);
 }
 const roadBefore=JSON.stringify(world.heat);
 for(const w of walls)nav.recordTraffic({x:w.x-1,z:w.z},{x:w.x+1,z:w.z});
 // Walkers cannot lay use-generated paths on collision-solid wall cells.
 const stained=Object.keys(world.heat).map(Number).filter(i=>nav.mask[i]===0);
 assert.equal(stained.length,0,label+': roads must not run through walls');
 assert.equal(world.heatLast&&typeof world.heatLast,'object');
 assert.ok(JSON.stringify(world.heat).length>=roadBefore.length,'wall simulation keeps road persistence');
 return {name:label,sections:walls.length,length:plan.length,overlap:WALL_DRAW_V175.jointOverlap};
};
const result=[];
result.push(verify('straight',[{x:-25,z:0},{x:-12,z:0},{x:4,z:0},{x:24,z:0}],'straight'));
result.push(verify('curve',[
 {x:-32,z:-10},{x:-23,z:-15},{x:-15,z:-16},{x:-8,z:-13},
 {x:0,z:-5},{x:8,z:4},{x:17,z:10},{x:24,z:11}
],'curved'));
assert.equal(wallStrokePlanV175([{x:0,z:0},{x:0,z:1}],'straight').segments.length,0,
 'too-short wall stroke is rejected');
const saved=JSON.parse(JSON.stringify(result));
assert.deepEqual(saved,result);
console.log('V175.3 CONTINUOUS WALL JOINTS PASS '+JSON.stringify(result));
