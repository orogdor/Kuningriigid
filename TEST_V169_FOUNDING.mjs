import assert from 'node:assert/strict';
import {Civilization,createGame} from './civilization-core.js';
import {stoneVillageFoundingTileV169} from './stone-village-site-v169.js';
import {reserveStoneVillageRingV168} from './stone-village-defenses-v166.js';
const game=new Civilization(createGame(31757));
const ai=game.s.settlers.find(a=>a.team===1);
assert.ok(ai);
const problematic=game.cell({c:145,r:136});
assert.ok(problematic.land&&problematic.deposits.wood&&problematic.deposits.stone,'known coastal site is on land with necessary raw materials');
const selected=stoneVillageFoundingTileV169(game,ai,problematic);
const clearance=cell=>reserveStoneVillageRingV168(game,{c:cell.c,r:cell.r,team:ai.team,
 economy:{buildings:[{type:'hall',hp:1200,ready:true,x:-18,z:-12}]}}).terrainBlockedAtFounding;
assert.ok(clearance(problematic)>0,'original founding terrain would block a Stone Age ring');
assert.equal(clearance(selected),0,'AI finds one real tile with a fully dry perimeter');
assert.ok(Math.max(Math.abs(selected.c-problematic.c),Math.abs(selected.r-problematic.r))<=1,'new city is no further than one map square from the original coast');
assert.ok(selected.deposits.wood&&selected.deposits.stone,'new town retains both key Stone Age resources');
assert.equal(stoneVillageFoundingTileV169(game,{...ai,team:0},problematic),problematic,'player settler remains under user control');
console.log('V169 FOUNDING PASS',JSON.stringify({from:[problematic.c,problematic.r],to:[selected.c,selected.r],
 originalBlocked:clearance(problematic),newBlocked:clearance(selected),water:selected.deposits.water}));
