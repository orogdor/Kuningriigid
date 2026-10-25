import assert from 'node:assert/strict';
import {stoneVillageWallPlan,reserveStoneVillageRingV168} from './stone-village-defenses-v166.js';
import {fortFootprintV168,footprintsCrossV168,
 fieldCrossesWoodenRingV168,objectCrossesWoodenRingV168} from './stone-fort-footprints-v168.js';
const hall={type:'hall',x:0,z:0,ready:true,hp:1200};
const house=(x,z)=>({type:'house',x,z,ready:true,hp:350});
const plan=stoneVillageWallPlan([hall,house(-21,9),house(21,-11),house(16,20),house(-18,-19)],8);
const spans=plan.slots.filter(s=>s.type==='palisade'&&s.palisadeSpanV167>20);
assert.ok(spans.length>=8,'wide palisade segments really occur in a paid ring');
const p=spans.find(x=>!x.wallAxis);
const end=p.x+p.palisadeSpanV167/2-2;
assert.ok(footprintsCrossV168(p,{type:'house',x:end,z:p.z+3},1.8),
  'house near far endpoint blocks a long palisade, even when far from centre');
assert.ok(footprintsCrossV168(p,{type:'field',x:end,z:p.z+14,width:48,depth:32},2),
  'field overlaps a palisade endpoint through its actual agricultural footprint');
assert.ok(fieldCrossesWoodenRingV168({x:end,z:p.z+14,width:48,depth:32},plan));
assert.ok(objectCrossesWoodenRingV168({type:'house',x:end,z:p.z+3},plan));
assert.equal(objectCrossesWoodenRingV168({type:'house',x:0,z:0},plan),false,
  'village centre remains free for civic and residential buildings');
assert.equal(fieldCrossesWoodenRingV168({x:180,z:180,width:48,depth:32},plan),false,
  'far distant fields are not blocked by the fortification planner');
assert.equal(plan.slots.filter(s=>s.type==='woodgate').length,2);
assert.equal(plan.slots.filter(s=>s.type==='watchtower').length,4);
for(const slot of plan.slots){
 const footprint=fortFootprintV168(slot);
 assert.ok(footprint?.rx>0&&footprint.rz>0,'fortification has nonzero geometry');
}
const founding={id:1,team:1,economy:{buildings:[hall]}};
const survey=reserveStoneVillageRingV168({
 s:{seed:142023,ages:[0,0]},
 nav:()=>({passable:()=>true})
},founding);
assert.equal(survey.reservedV168,true);
assert.equal(survey.terrainBlockedAtFounding,0);
assert.equal(survey.gateOpenings,2);
assert.equal(survey.slots.filter(s=>s.type==='watchtower').length,4);
assert.ok(survey.rx>=42&&survey.rz>=42);
const futureField={x:survey.slots[0].x+3,z:survey.slots[0].z+13,width:48,depth:32};
assert.ok(fieldCrossesWoodenRingV168(futureField,survey),
 'the real founding-day reservation protects its gate from later fields');
console.log('V168 FOOTPRINT PASS',JSON.stringify({
 slots:plan.slots.length,wide:spans.length,gates:2,towers:4,longest:Math.max(...spans.map(s=>s.palisadeSpanV167))
}));
