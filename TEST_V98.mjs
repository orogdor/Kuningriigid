import assert from 'node:assert/strict';
import {TROOPS,Civilization} from './civilization-core.js';
import {createBronzeBattleState} from './bronze-battle-demo-v89.js';
import {tickBattle} from './campaign.js';
import {committedOpponent,keepAdvance} from './battle-doctrine-v98.js';
const own={source:0,x:-80,z:0,deployment:{z:0},battleSide:1},a={source:1,x:80,z:0},c={source:2,x:81,z:1};assert.equal(committedOpponent(own,[a,c]),a);c.x=79;assert.equal(committedOpponent(own,[a,c]),a,'minor distance change does not switch opponent');a.routing=true;assert.equal(committedOpponent(own,[a,c]),c,'replace broken enemy');assert.deepEqual(keepAdvance(own,{x:0,z:0},{x:-3,z:2},80),{x:0,z:2});assert.deepEqual(keepAdvance({...own,routing:true},{x:0,z:0},{x:-3,z:2},80),{x:-3,z:2});
assert.deepEqual(keepAdvance(own,{x:0,z:0},{x:-3,z:2},80,{x:-80,z:0}),{x:-3,z:2},'turn toward an enemy behind the battle line');
const s=createBronzeBattleState(),b=s.battle,g=new Civilization(s),nav=g.battleNavigation(b);let backTicks=0,collectiveReversals=0,anchorBack=0,old=new Map();
for(let i=0;i<600;i++){tickBattle(b,.1,TROOPS,0,nav);for(const u of b.squads){const p=old.get(u.source);if(p&&b.elapsed>2&&!u.routing){const reverse=u.men.filter((m,j)=>m.hp>0&&!m.routing&&(m.x-p.men[j])*u.battleSide<-.025).length;if((u.x-p.x)*u.battleSide<-.025)backTicks++;if(reverse>=Math.ceil(u.men.length*.7))collectiveReversals++;if((u.anchor.x-p.anchor)*u.battleSide<-.025)anchorBack++;}old.set(u.source,{x:u.x,anchor:u.anchor.x,men:u.men.map(m=>m.x)});}}
assert.ok(collectiveReversals<10,`whole squads repeatedly reversing: ${collectiveReversals}`);const infantry=b.squads.filter(u=>u.kind==='bronze_spearman');assert.ok(infantry.every(u=>(u.x-u.deployment.x)*u.battleSide>25),'entire spear line advances');console.log(JSON.stringify({passed:true,elapsed:b.elapsed,backTicks,collectiveReversals,anchorBack,advance:infantry.map(u=>+((u.x-u.deployment.x)*u.battleSide).toFixed(1))}));
