import assert from 'node:assert/strict';
import {moveSquad,squadRadius,constrainStep,formationMen} from './soldier-collision-v90.js';
import {crowdWaypoint,forgetCrowdRoute} from './crowd-movement-v132.js';
import {Navigation} from './navigation.js';
const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const reports=[];
function traffic(kind,opposite=false,withNav=false,wall=false){
 const a={kind,hp:100,x:-45,z:0},b={kind,hp:100,x:0,z:0},ga={x:45,z:0},gb={x:-45,z:0};
 const nav=withNav?new Navigation({resources:[]},(x,z)=>!wall||z<3,()=>[],{minX:-100,minZ:-70,w:201,h:141}):null;
 let maxZ=0,frames=0;
 for(;frames<3000&&!(dist(a,ga)<.25&&(!opposite||dist(b,gb)<.25));frames++){
  moveSquad(a,ga,.05,6,nav,[a,b]);if(opposite)moveSquad(b,gb,.05,6,nav,[a,b]);
  assert.ok(dist(a,b)>=squadRadius(a)+squadRadius(b)-.001,'no formation overlap');
  if(wall)assert.ok(a.z<3&&b.z<3,'no wall crossing');maxZ=Math.max(maxZ,Math.abs(a.z),Math.abs(b.z));
 }
 assert.ok(dist(a,ga)<.25,`${kind} reaches target; ${JSON.stringify({a,b,frames})}`);
 if(opposite)assert.ok(dist(b,gb)<.25,'opposing friendly traffic reaches destination');
 reports.push({kind,opposite,withNav,wall,seconds:frames*.05,maxZ});
}
for(const kind of ['spearman','cavalry','chariot','catapult']){traffic(kind);traffic(kind,true);traffic(kind,true,true);}
traffic('spearman',false,true,true);
// Queue: one detour must go around several neighbouring stationary formations.
{
 const a={kind:'spearman',hp:100,x:-25,z:0},peers=Array.from({length:5},(_,i)=>({kind:'spearman',hp:100,x:0,z:(i-2)*7.2})),goal={x:25,z:0};
 for(let i=0;i<2000&&dist(a,goal)>.25;i++){moveSquad(a,goal,.05,6,null,peers);for(const p of peers)assert.ok(dist(a,p)>=7-.001);}
 assert.ok(dist(a,goal)<.25,'queue bypass reaches destination');
}
// Individual soldiers, including mounted bodies, keep a detour between frames.
for(const radius of [.34,2]){
 const a={x:-12,z:0,radius},b={x:0,z:0,radius},goal={x:12,z:0};
 for(let i=0;i<1200&&dist(a,goal)>.2;i++){const p=crowdWaypoint(a,goal,[b],()=>true,p=>p.radius,.05),d=dist(a,p),f=d?Math.min(.2/d,1):0,to={x:a.x+(p.x-a.x)*f,z:a.z+(p.z-a.z)*f};constrainStep(a,to,[b]);if(dist(a,to)>.01)forgetCrowdRoute(a);assert.ok(dist(a,b)>=radius*2-.001);}
 assert.ok(dist(a,goal)<.2,'individual passes stationary friendly');
}
// No route exists through a sealed terrain wall or an occupied narrow passage.
{
 const a={kind:'spearman',hp:100,x:-20,z:0},b={kind:'spearman',hp:100,x:0,z:0},nav=new Navigation({resources:[]},(x,z)=>Math.abs(z)<1,()=>[],{minX:-30,minZ:-10,w:61,h:21});
 for(let i=0;i<200;i++)moveSquad(a,{x:20,z:0},.05,6,nav,[b]);assert.ok(a.x<0&&Math.abs(a.z)<1);
}
console.log('V132 traffic PASS',JSON.stringify(reports));
// Exercise the real battle loop, rather than just the collision helper.
const {createBattle,tickBattle}=await import('./campaign.js');
const {TROOPS}=await import('./civilization-core.js');
const {initializeMen}=await import('./individual-battle-v91.js');
const battle=createBattle({c:50,r:50},[{team:0,kind:'spearman',hp:125,maxHp:125},{team:0,kind:'spearman',hp:125,maxHp:125},{team:1,kind:'spearman',hp:125,maxHp:125}]);initializeMen(battle);
for(const [i,u] of battle.squads.entries()){
 const x=i===0?-24:i===1?24:130,z=i===2?100:0;
 for(const m of u.men){m.x+=x-u.x;m.z+=z-u.z;}
 u.x=x;u.z=z;u.anchor={x,z};u.combatMode='manual';u.manualOrder=true;u.target={x:i===0?24:i===1?-24:130,z};u.formation='line';
}
for(let i=0;i<2400;i++)tickBattle(battle,.1,TROOPS);
assert.ok(battle.squads[0].x>18&&battle.squads[1].x< -18,JSON.stringify(battle.squads.map(u=>({x:u.x,z:u.z}))));
assert.ok(battle.squads.every(u=>u.hp===125),'friendly passing causes no damage');
console.log('V132 real battle friendly formations passed each other');

// Peace-time rendered men must also follow past the stationary formation.
{
 const a={kind:'scout',hp:100,maxHp:100,x:-12,z:0},b={kind:'scout',hp:100,maxHp:100,x:0,z:0},goal={x:12,z:0};
 formationMen([a,b],0,null);let positions;
 for(let i=0;i<800;i++){moveSquad(a,goal,.05,4,null,[b]);positions=formationMen([a,b],.05,null);}
 assert.ok(dist(positions.get(a)[0],goal)<.2,'visible soldiers follow their passing squad');
}
