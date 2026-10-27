import assert from 'node:assert/strict';
import {naturalSuburbBoundaryV194} from '../outer-ring-v184.js';
const a={x:-42,z:0},b={x:42,z:0};
for(const kind of ['water','mountain']){
 const terrain=(_c,x,z)=>z>70+Math.sin(x*.03)*5?kind:null;
 const game={defenseTerrainKindV176:terrain,
  defenseTerrainPassableV177:(_c,x,z)=>terrain(null,x,z)==null};
 const path=naturalSuburbBoundaryV194(game,{},a,b,0,1,kind);
 assert.ok(path,'continuous '+kind+' must form a complete rear boundary');
 assert.ok(path.coast.length>=30);
 assert.ok(path.coast.every(p=>p.z<=71+Math.sin(p.x*.03)*5));
 const split={defenseTerrainKindV176:(_c,x,z)=>Math.abs(x)<6?null:terrain(null,x,z),
  defenseTerrainPassableV177:(_c,x,z)=>Math.abs(x)<6||terrain(null,x,z)==null};
 assert.equal(naturalSuburbBoundaryV194(split,{},a,b,0,1,kind),null,
  'a navigable break in the '+kind+' cannot replace a physical wall');
}
console.log('V194 continuous wet/cliff barrier closure and dry-gap rejection PASS');
