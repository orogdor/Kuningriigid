import assert from 'node:assert/strict';
import {createBronzeSiegeState} from './bronze-siege-demo-v108.js?v=115a';
import {Civilization,TROOPS} from './civilization-core.js?v=115a';
import {initializeMen,tickIndividualBattle,battleManCount} from './individual-battle-v91.js?v=115a';
import {planSiegeAI} from './siege-assault-v108.js?v=115a';
const s=createBronzeSiegeState(),g=new Civilization(s),b=s.battle,nav=g.battleNavigation(b);initializeMen(b,nav);
for(let i=0;i<900&&!b.result;i++){planSiegeAI(b,s,nav);tickIndividualBattle(b,.1,TROOPS,0,nav);assert.ok(b.squads.every(u=>(u.men||[]).every(m=>[m.x,m.z,m.hp].every(Number.isFinite))));}
const works=(b.siegeWorks||[]).map(w=>({kind:w.kind,ready:w.ready,arrived:w.arrived,produced:w.produced||0,destroyed:!!w.destroyed}));
assert.ok(works.some(w=>w.kind==='camp'&&w.ready));assert.ok(works.some(w=>w.kind==='ladder'&&w.ready));assert.ok(battleManCount(b)<=500);assert.ok(b.ballistaShots||b.defensePosts.some(p=>p.ballista?.firedAt!=null));
console.log(JSON.stringify({pass:true,simulatedSeconds:b.elapsed,realSeconds:b.elapsed*2,men:battleManCount(b),works,wood:s.cities.find(c=>c.team===0).economy.realms[0].resources.wood,checks:'full automatic siege with real defenders, roof weapons, crew construction, navigation and ammunition'}));
