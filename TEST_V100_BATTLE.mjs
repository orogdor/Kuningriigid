import assert from 'node:assert/strict';
import {TROOPS,Civilization} from './civilization-core.js';
import {createBronzeBattleState} from './bronze-battle-demo-v89.js';
import {tickBattle} from './campaign.js';
import {carriesSword} from './combat-equipment-v100.js';
import {battleManCount,escapedMen} from './individual-battle-v91.js';
const s=createBronzeBattleState(),b=s.battle,g=new Civilization(s),nav=g.battleNavigation(b),initialMen=battleManCount(b);let stones=false,horseMelee=false,swordMelee=false;
for(let i=0;i<10000&&!b.result;i++){tickBattle(b,.1,TROOPS,0,nav);stones||=b.squads.some(u=>u.kind==='bronze_catapult'&&u.men.some(m=>m.shotsFired>0));horseMelee||=b.squads.some(u=>u.kind==='bronze_cavalry'&&u.men.some(m=>m.lastMeleeDistance!=null));swordMelee||=b.squads.some(u=>carriesSword(u)&&u.men.some(m=>m.lastMeleeDistance!=null));}
assert.ok(stones,'catapults actually fire');assert.ok(horseMelee,'Bronze cavalry actually engages');assert.ok(swordMelee,'archers actually fight in melee');assert.ok(b.result,'six-type battle resolves');assert.equal(battleManCount(b)+escapedMen(b)+Object.values(b.casualties).reduce((a,n)=>a+n,0),initialMen);console.log(JSON.stringify({passed:true,result:b.result,elapsed:b.elapsed,stones,horseMelee,swordMelee,alive:battleManCount(b),escaped:escapedMen(b),deaths:b.casualties}));
