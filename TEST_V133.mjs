import {militaryLineClear} from './crowd-movement-v132.js';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {assignArrivalGoals,arrivalGoal} from './army-arrivals-v133.js';
import {createBattle,tickBattle,tickDeployments} from './campaign.js';
import {initializeMen} from './individual-battle-v91.js';
import {Civilization,TROOPS} from './civilization-core.js';
import {Navigation} from './navigation.js';
import {createArmyTrafficState} from './army-traffic-demo-v133.js';
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z),nav=new Navigation({resources:[]},()=>true,()=>[],{minX:-80,minZ:-60,w:161,h:121});
const agents=[{x:-30,z:-8},{x:-30,z:0},{x:-30,z:8}],goal={x:30,z:0},occupants=agents.map(agent=>({agent,team:0,radius:3.5})),orders=occupants.map(o=>({...o,goal}));
assert.equal(militaryLineClear({x:2.3646,z:-1.4866},{x:39,z:-7},(x,z)=>Math.round(x)!==2||Math.round(z)!==-2),false,'tiny blocked corner must not be skipped');
const first=assignArrivalGoals(orders,occupants,nav),second=assignArrivalGoals(orders,occupants,nav);
assert.equal(first.size,3);for(const [a,p]of first){assert.deepEqual(second.get(a),p);assert.deepEqual(goal,{x:30,z:0});for(const [b,q]of first)if(a!==b)assert.ok(distance(p,q)>=7.5);}
assert.equal(arrivalGoal(agents[0]),first.get(agents[0]));
// A changed command must release the old reservation.
const redirect=assignArrivalGoals([{...orders[0],goal:{x:-20,z:20}}],occupants,nav).get(agents[0]);assert.ok(distance(redirect,{x:-20,z:20})<1);
// A real city, actual gatehouse footprints, and V4 save/load halfway through.
const fixture=JSON.parse(fs.readFileSync(new URL('./tests/traffic-v133/cases.json',import.meta.url))).find(c=>c.id==='city-gate');
let state=createArmyTrafficState(fixture),game=new Civilization(state),steps=0;const key=Object.keys(state.deployments)[0];
for(;steps<2400&&Object.values(state.deployments[key]).some(p=>p.target);steps++){
 tickDeployments(state,state.units,TROOPS,.05,p=>game.nav(p));
 if(steps===100){state=JSON.parse(JSON.stringify(state));game=new Civilization(state);}
}
assert.ok(Object.values(state.deployments[key]).every(p=>!p.target),'every formation reaches city after loading a mid-march save');
assert.ok(Object.values(state.deployments[key]).every(p=>p.x>8),'all formations pass the actual city gate');
// Real individual battle orders also share an arrival area without sharing a point.
const battle=createBattle({c:50,r:50},[...Array.from({length:4},()=>({team:0,kind:'spearman',hp:125,maxHp:125})),{team:1,kind:'spearman',hp:125,maxHp:125}]);initializeMen(battle);
for(const [i,u]of battle.squads.entries()){
 const x=i<4?-35:130,z=i<4?(i-1.5)*10:100;
 for(const [j,m]of u.men.entries()){m.x=x+(j%4-1.5)*1.05;m.z=z+(Math.floor(j/4)-2.5)*1.05;}
 u.x=x;u.z=z;u.anchor={x,z};u.combatMode='manual';u.manualOrder=true;u.target={x:i<4?35:130,z:i<4?0:100};u.formation='line';u.formationManual=true;
}
let frames=0;for(;frames<2400&&battle.squads.slice(0,4).some(u=>u.target);frames++)tickBattle(battle,.1,TROOPS);
assert.ok(battle.squads.slice(0,4).every(u=>!u.target&&u.x>20),'all four individual formations complete their shared order');
assert.ok(battle.squads.every(u=>u.hp===125),'manual friendly movement causes no damage');
console.log('V133 PASS',JSON.stringify({realCitySeconds:steps*.05,battleSeconds:frames*.05,saveRestored:true,arrivals:battle.squads.slice(0,4).map(u=>({x:u.x,z:u.z}))}));
