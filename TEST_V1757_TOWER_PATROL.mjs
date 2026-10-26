// V175.7: ground patrols from *real* tower-guard state use walkable
// Navigation paths, lay organic roads, and reset to towers in an attack.
import assert from 'node:assert/strict';
import {Navigation} from './navigation.js';
import {addTowerGuards,persistTowerGuards,tickTowerGuards} from './tower-garrison-v117.js';
import {tickPeaceTowerPatrolV1757,towerDoorDirectionV1757,GROUND_PATROL_SLOTS_V1757} from './tower-patrol-v1757.js';

const hall={type:'hall',x:0,z:0,hp:1200,ready:true};
const tower={type:'watchtower',x:20,z:0,hp:350,ready:true,assigned:1};
const city={team:0,economy:{buildings:[hall,tower]}};
const state={ages:[0,0],research:[{known:[]},{known:[]}]};
const nav=new Navigation({resources:[],heat:{},heatLast:{}},()=>true,()=>city.economy.buildings,
 {minX:-45,minZ:-45,w:91,h:91});
const direction=towerDoorDirectionV1757(city,tower);
assert.ok(direction.x<-.99&&Math.abs(direction.z)<.01,'wooden entrance faces the town');
const battle={squads:[],siegeSections:[],wallWalkEnabled:true,
 fortress:{team:0},elapsed:0};
addTowerGuards(city,state,battle);
assert.equal(battle.squads.length,5,'five defenders remain on the tower roster');
let walked=false,grass=0,outside=false,returned=false,maxDistance=0;
for(let i=0;i<360;i++){
 battle.elapsed=i*.5;
 tickPeaceTowerPatrolV1757(city,battle,nav,.5);
 tickTowerGuards(battle,.5);
 for(const u of battle.squads.filter(u=>u.peacePatrolV1757)){
  const state=u.peacePatrolV1757.phase;
  if(state==='outbound'||state==='watch'||state==='return')outside=true;
  if(u.moving)walked=true;
  if(state==='ascending'||(state==='roof'&&i>45))returned=true;
  if(!u.guardPost){
   assert.ok(nav.open(u.x,u.z),'patrol must not enter a wall, house or tower');
   maxDistance=Math.max(maxDistance,Math.hypot(u.x-tower.x,u.z-tower.z));
  }
  assert.ok(u.men[0].elevation>=0,'soldier stays at safe altitude');
 }
 grass=Object.values(nav.world.heat).reduce((a,v)=>a+v,0);
}
assert.ok(outside,'tower soldiers leave the tower');
assert.ok(walked,'ground patrol visibly walks away');
assert.ok(returned,'patrol soldiers return to their defensive tower');
assert.ok(maxDistance>7,'patrol walks along an actual neighbourhood route');
assert.ok(grass>1,'walking produces authentic use-generated dirt paths');
assert.equal(battle.squads.filter(u=>u.peacePatrolV1757).length,GROUND_PATROL_SLOTS_V1757,
 'two patrol guards, three tower defenders');
assert.equal(battle.squads.filter(u=>!u.peacePatrolV1757).length,3);
persistTowerGuards(city,battle);
assert.equal(tower.towerGuards.length,5);
assert.ok(tower.towerGuards.some(g=>g.groundPatrolV1757),'save patrol status');

// On battle start all saved guards are safely restored to their roof.
const siege={squads:[],siegeSections:[],wallWalkEnabled:true,fortress:{team:0},elapsed:0};
addTowerGuards(city,state,siege);
assert.equal(siege.squads.length,5);
for(const u of siege.squads){
 assert.ok(u.guardPost&&u.wallElevation>7,'siege returns every survivor to roof');
 assert.ok(Math.hypot(u.x-tower.x,u.z-tower.z)<3,'no attack starts with troops trapped outside');
}
console.log('V175.7 REAL TOWER GROUND PATROL PASS '+JSON.stringify({
 guards:siege.squads.length,patrollers:GROUND_PATROL_SLOTS_V1757,
 maxDistance:+maxDistance.toFixed(1),traffic:+grass.toFixed(2),walked,returned}));
