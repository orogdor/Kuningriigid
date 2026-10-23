import assert from 'node:assert/strict';
import fs from 'node:fs';
import {gateTraffic} from './army-gates-v133.js';
import {tickDeployments} from './campaign.js';
import {Navigation} from './navigation.js';
import {TROOPS} from './civilization-core.js';
const fixture=JSON.parse(fs.readFileSync(new URL('./tests/traffic-v133/cases.json',import.meta.url))).find(c=>c.id==='city-gate'),starts=[[-60,-18],[-60,-6],[-60,6],[-60,18]];
const units=starts.map(()=>({team:0,armyId:0,kind:'bronze_spearman',hp:300,maxHp:300})),tile=Object.fromEntries(starts.map(([x,z],i)=>[i,{x,z,target:{...fixture.goal}}])),camp={armies:[{team:0,id:0,c:10,r:10}],deployments:{'10:10':tile}};
const buildings=fixture.buildings.map(b=>({...b,hp:100,ready:true})),nav=new Navigation({resources:[]},(x,z)=>Math.abs(x)>1.5||Math.abs(z)<1.5,()=>buildings,{minX:-85,minZ:-65,w:171,h:131});
let approach=null,steps=0,minClearance=Infinity;
for(;steps<2400&&Object.values(tile).some(p=>p.target);steps++){
 tickDeployments(camp,units,TROOPS,.05,()=>nav);
 const agents=Object.values(tile);for(let i=0;i<agents.length;i++){assert.ok(nav.open(agents[i].x,agents[i].z));for(let j=0;j<i;j++){const clearance=Math.hypot(agents[i].x-agents[j].x,agents[i].z-agents[j].z)-7;minClearance=Math.min(minClearance,clearance);assert.ok(clearance>=-.001);}}
 if(steps===159){
  approach=agents.map((p,i)=>({x:p.x,z:p.z,progress:Math.hypot(p.x-starts[i][0],p.z-starts[i][1]),pending:!!p.target}));
  assert.ok(agents.every(p=>p.x<0),'first formation has not reached the gate yet');
  assert.ok(approach.every(p=>p.progress>10),'every follower must advance before the leader reaches the gate');
  assert.ok(approach.every(p=>p.pending),'approaching a waiting bay must not complete the original order');
 }
}
assert.ok(Object.values(tile).every(p=>!p.target&&p.x>8),'every queued formation continues through the gate');
// A slow leader must not keep faster followers at their distant start.
const slowUnits=[{team:0,armyId:0,kind:'catapult',hp:300,maxHp:300},...Array.from({length:3},()=>({team:0,armyId:0,kind:'bronze_spearman',hp:300,maxHp:300}))],slowTile={0:{x:-40,z:0,target:{...fixture.goal}},1:{x:-60,z:-16,target:{...fixture.goal}},2:{x:-60,z:0,target:{...fixture.goal}},3:{x:-60,z:16,target:{...fixture.goal}}},slowCamp={armies:camp.armies,deployments:{'10:10':slowTile}},slowNav=new Navigation({resources:[]},(x,z)=>Math.abs(x)>1.5||Math.abs(z)<1.5,()=>buildings,{minX:-85,minZ:-65,w:171,h:131}),slowStats={...TROOPS,catapult:{...TROOPS.catapult,speed:.35}};
for(let i=0;i<600;i++)tickDeployments(slowCamp,slowUnits,slowStats,.05,()=>slowNav);
assert.ok(slowTile[0].x< -15,'leader is still approaching');
for(const p of Object.values(slowTile).slice(1)){assert.ok(p.x<0&&Math.hypot(p.x,p.z)<30,'follower waits near the entrance, not at its start');assert.ok(p.target,'waiting does not clear the order');}
const held=Object.values(slowTile).slice(1).map(p=>({x:p.x,z:p.z}));
for(let i=0;i<40;i++)tickDeployments(slowCamp,slowUnits,slowStats,.05,()=>slowNav);
assert.ok(Object.values(slowTile).slice(1).every((p,i)=>Math.hypot(p.x-held[i].x,p.z-held[i].z)<.5),'followers stand at their bays instead of circling');
// Independent gates do not lock formations at a later passage on their route.
const gates=[{type:'gatehouse',wallAxis:1,x:0,z:0,hp:100},{type:'gatehouse',wallAxis:1,x:40,z:0,hp:100}],two=new Navigation({resources:[]},(x,z)=>(Math.abs(x)>1.5&&Math.abs(x-40)>1.5)||Math.abs(z)<1.5,()=>gates,{minX:-85,minZ:-40,w:171,h:81});
const a={x:-50,z:0},b={x:20,z:0},c={x:-65,z:12},orders=[a,b,c].map(agent=>({agent,goal:{x:75,z:0},radius:3.5,team:0}));
const traffic=gateTraffic(orders,two,orders);
assert.ok(!traffic.waiting.has(a)&&!traffic.waiting.has(b),'each gate owner approaches its nearest gate');
assert.ok(traffic.waiting.has(c));assert.ok(traffic.approaches.get(c)?.x<0&&traffic.approaches.get(c).x> -30,'follower stages at its nearest gate');
console.log('V134 PASS',JSON.stringify({approachAt8Seconds:approach,totalSimulationSeconds:steps*.05,minClearance,nearestGateOnly:true,slowLeader:{x:slowTile[0].x,z:slowTile[0].z},waitingBays:Object.values(slowTile).slice(1).map(p=>({x:p.x,z:p.z,pending:!!p.target}))}));
