import assert from 'node:assert/strict';
import {createBronzeSiegeState} from './bronze-siege-demo-v108.js?v=114a';
import {Civilization,TROOPS} from './civilization-core.js?v=114a';
import {initializeMen,tickIndividualBattle,battleManCount} from './individual-battle-v91.js?v=114a';
import {wallPath,tickWallWalk,orderWallMove} from './wall-walk-v111.js?v=114a';
import {startSiegeCraft,tickSiegeCraft} from './siege-assault-v108.js?v=114a';
const s=createBronzeSiegeState(),g=new Civilization(s),b=s.battle,nav=g.battleNavigation(b);
assert.equal(b.siegeSections.length,36);assert.equal(b.siegeSections.filter(w=>w.type==='gatehouse').length,2);
assert.equal(s.cities[0].economy.buildings.filter(w=>w.type==='stonetower').length,10);
assert.equal(b.squads.filter(u=>u.kind==='bronze_catapult').length,2);
initializeMen(b,nav);assert.equal(battleManCount(b,0),218);assert.equal(battleManCount(b,1),236);
const guards=b.squads.filter(u=>u.guardPost);assert.equal(guards.length,8);assert.ok(guards.every(u=>u.men.length===16));
const guard=guards[0],wall=b.siegeSections.find(w=>w.x===42&&w.z===14);const route=wallPath(b,guard,wall);assert.ok(route.length>5);
assert.ok(orderWallMove(b,guard,wall,nav).ok);const start={x:guard.x,z:guard.z};for(let i=0;i<30;i++)tickWallWalk(b,.1,nav);assert.ok(Math.hypot(guard.x-start.x,guard.z-start.z)>1);assert.ok(guard.men.every(m=>m.elevation===3.8));
const attacker=b.squads.find(u=>u.team===0&&u.kind==='bronze_spearman'),target=b.siegeSections.find(w=>w.x===-28&&w.z===-14);
assert.ok(orderWallMove(b,attacker,target,nav).error);const wood=s.cities[1].economy.realms[0].resources.wood;
const craft=startSiegeCraft(b,attacker,'ladder',s);assert.ok(craft.ok);assert.equal(s.cities[1].economy.realms[0].resources.wood,wood-18);
for(let i=0;i<150;i++)tickSiegeCraft(b,.1,nav);assert.ok(craft.work.ready);assert.equal(craft.work.progress,30);
for(let i=0;i<500&&!craft.work.arrived;i++)tickSiegeCraft(b,.1,nav);assert.ok(craft.work.arrived);assert.equal(nav.passable(craft.work.wallX,craft.work.wallZ),false,'An assault ladder does not open a ground passage for chariots');
assert.ok(orderWallMove(b,attacker,{x:craft.work.wallX,z:craft.work.wallZ},nav).ok);
// Approach and climb using the actual individual positions, without teleporting.
for(let i=0;i<1600&&!attacker.guardPost;i++)tickWallWalk(b,.1,nav);assert.ok(attacker.guardPost);assert.ok(attacker.men.every(m=>m.elevation===3.8));
// Gates block their own cells, and opening one does not open all 36 walls.
const gate=b.siegeSections.find(w=>w.type==='gatehouse');assert.equal(nav.passable(gate.x,gate.z),false);gate.hp=0;gate.breached=true;nav.rebuildSiegeAccess();assert.equal(nav.passable(gate.x,gate.z),true);assert.equal(nav.passable(42,-14),false);
for(let i=0;i<50;i++)tickIndividualBattle(b,.1,TROOPS,0,nav);
for(const u of b.squads)for(const m of u.men||[])assert.ok([m.x,m.z,m.hp].every(Number.isFinite));
assert.equal(g.s.version,4);console.log('V111 PASS: 36 sections, 2 gates, 10 towers; 218/236 figures; 128 wall archers; connected elevated movement; ladder cost/time/ascent; local breach; 5s combat; V4 state.');
