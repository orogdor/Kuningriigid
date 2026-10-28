// V218.3: replay the exact photographed Sampola checkpoint as AI, not player.
import fs from 'node:fs';import assert from 'node:assert/strict';
import {Civilization} from '../civilization-core.js';
import {takeOverAI} from '../ai-takeover-v128.js';
import {oldPerimeterStatusV218} from '../old-fortification-policy-v218.js';
const saved=JSON.parse(fs.readFileSync('scenarios/bronze-fresh-v217.json','utf8'));
assert.equal(saved.bronzeFreshV217.cityName,'Sampola');
// Remap team 0 back to its original AI side, preserving all real buildings.
const game=new Civilization(takeOverAI(saved,saved.bronzeFreshV217.originalTeam));
const city=game.s.cities.find(c=>c.id===saved.bronzeFreshV217.cityId);
const team=saved.bronzeFreshV217.originalTeam;
const before=oldPerimeterStatusV218(game,city);
const fort=()=>game.allBuildings(city).filter(b=>b.hp>0&&!b.virtual);
const count=()=>({wood:fort().filter(b=>['palisade','woodgate','watchtower'].includes(b.type)&&!b.outerRingV184).length,
 paidUpgrades:fort().filter(b=>b.wallUpgradeV184).length,
 outer:fort().filter(b=>b.outerRingV184).length,
 houseUpgraded:fort().filter(b=>b.type==='house'&&b.houseUpgradeLevelV218).length,
 ready:fort().filter(b=>b.ready).length});
const initial=count();
for(let turn=0;turn<12;turn++)for(let i=0;i<5;i++)game.tick(12);
const final=count(),old=oldPerimeterStatusV218(game,city);
console.log('V218 REAL SAMPOLA AI FOLLOW-UP',JSON.stringify({
 team,turns:12,before:{...initial,missing:before.missing.length},
 after:{...final,missing:old.missing.length},
 oldWallDecision:city.aiDefenseDiagnosticV184,
 outerDecision:city.outerRingDiagnosticV184,
 repairDecision:city.aiOldPerimeterV215
}));
assert.ok(old.missing.length<before.missing.length||old.missing.length===0,
 'the original Sampola gateway gap should be closed with a paid, safe fallback');
assert.ok(final.outer<=initial.outer||old.ready,
 'The AI must not start a new outer wall when the first curtain is incomplete');
