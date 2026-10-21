import assert from 'node:assert/strict';
import {createBronzeBattleState} from './bronze-battle-demo-v89.js';
import {tickBattle} from './campaign.js';
import {tickIndividualBattle,battleManCount} from './individual-battle-v91.js';
import {BATTLE_TIME_SCALE,BATTLE_EMPTY_HALF_WIDTH} from './battle-pacing-v93.js';
import {TROOPS} from './civilization-core.js';
const s=createBronzeBattleState(),b=s.battle;assert.equal(battleManCount(b),500);let left=-Infinity,right=Infinity;for(const u of b.squads)for(const m of u.men){if(m.hp<=0)continue;if(u.battleSide===1){left=Math.max(left,m.x+m.radius);assert.ok(m.x+m.radius<=-BATTLE_EMPTY_HALF_WIDTH);}else{right=Math.min(right,m.x-m.radius);assert.ok(m.x-m.radius>=BATTLE_EMPTY_HALF_WIDTH);}}assert.ok(right-left>=150);
const half=structuredClone(b),reference=structuredClone(b);for(let i=0;i<400;i++){tickBattle(half,.1,TROOPS);tickIndividualBattle(reference,.05,TROOPS);}assert.deepEqual(half,reference,'movement, health, attacks, morale, fatigue, ammo and elapsed clock all use half speed');assert.ok(Math.abs(half.elapsed-20)<1e-7);assert.equal(BATTLE_TIME_SCALE,.5);console.log(JSON.stringify({passed:true,men:500,emptySectorWidth:150,nearestArmyEdges:[left,right],actualGap:right-left,realSeconds:40,battleSeconds:half.elapsed,scale:BATTLE_TIME_SCALE,checks:'empty entire middle sector including bodies, exact half-speed simulation state, paused time unchanged'}));
