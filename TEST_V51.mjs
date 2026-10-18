import assert from 'node:assert/strict';
import {Civilization,createGame} from './civilization-core.js';
import {visibleNow,updateEnemyIntel,knownEnemyCities,constructionForecast,cityProblems,actionTips,armyUnits,activeArmies,splitArmy,mergeArmies} from './v51-systems.js';
import {TECHS,techBlock} from './research.js';

const game=new Civilization(createGame(17851));
const s=game.s;
assert.equal(s.version,4);
assert.equal(s.armies.length,4);
assert.equal(game.builderStrength(0),1);
assert.equal(game.builderProfile(0).archetype,'stone_builder');
const unknown={c:120,r:100};assert.equal(visibleNow(game,0,unknown),false);
const intel=updateEnemyIntel(game,0);assert.equal(typeof intel,'object');
const own=s.armies[0];assert.equal(armyUnits(s,own).length,1);
assert.equal(splitArmy(s,own).error!==undefined,true,'1-unit army cannot split');
s.units.push({kind:'spearman',team:0,hp:125,morale:100});
const group=splitArmy(s,own);assert.equal(group.count,1);assert(group.army.id>=1);assert.equal(armyUnits(s,own).length,1);assert.equal(armyUnits(s,group.army).length,1);
assert.equal(activeArmies(s,0).length,2);assert.equal(mergeArmies(s,group.army).ok,true);assert.equal(activeArmies(s,0).length,1);
assert.equal(s.armies.length,4);
// Saved V50 states need no version change and must accept newly added fields.
const restored=new Civilization(JSON.parse(JSON.stringify(s)));
assert.equal(restored.s.version,4);
assert.equal(restored.s.nextArmyId,s.nextArmyId);
assert(techBlock(restored.s.research[0],'modernity'),'modernity should not be available in stone age');
assert(Object.keys(TECHS).some(id=>!techBlock(restored.s.research[0],id)));
assert(actionTips(game,0).length>0);
for(const age of [0,1,2,3,4,5,6]){s.ages[0]=age;const profile=game.builderProfile(0);assert(profile.tier===age);assert(profile.power>=1);}
s.ages[0]=0;
console.log('V51 RULES PASS: fog, saved intel, army split/merge, builder tier, research availability, suggestions');
// Tick simulation: prevent UI-only success claims, test AI economy integration.
const simSeed=Number(process.env.V51_SEED||17),steps=Number(process.env.V51_STEPS||600),sim=new Civilization(createGame(simSeed));
for(let i=0;i<steps;i++)sim.tick(1);
assert(sim.s.cities.every(c=>c.economy.realms[c.team].pop>=0));
assert(sim.s.armies.length>=4);
assert(sim.s.research.length===4);
console.log(JSON.stringify({passed:true,seed:simSeed,seconds:steps,cities:sim.s.cities.length,ages:sim.s.ages,aiDiagnostics:sim.s.cities.filter(c=>c.team>0).map(c=>({team:c.team,issues:c.aiDiagnostics?.length||0})).slice(0,4)}));
