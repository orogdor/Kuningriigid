import assert from 'node:assert/strict';
import * as T from './vendor/three.module.js';
import {createSoldier,animateSoldier} from './visuals.js';
import {V49_PEOPLE,characterQuadCount,createV49CharacterRig,characterGeometry} from './model-runtime-v49.js';
import {createWorldUnit,updateWorldUnit} from './map-units.js';
assert.equal(V49_PEOPLE.length,7);
const cases={villager:'settler',worker:'stone_lumber',builder:'builder',merchant:'market_woman',warrior:'spearman',modern:'rifleman',scholar:'artisan'};
let triangles=0;
for(const [variant,kind] of Object.entries(cases)){
 const n=characterQuadCount(variant); assert(n>300&&n<=1000,`${variant} q=${n}`);
 const parent=new T.Group(); const soldier=createSoldier(parent,0,0,'#947953',kind);
 assert.equal(soldier.userData.rig.archetype,variant);
 let faceCount=0; soldier.traverse(o=>{if(o.isMesh){const pos=o.geometry.attributes.position; for(let i=0;i<pos.count;i++)for(const k of ['getX','getY','getZ'])assert(Number.isFinite(pos[k](i)),`${variant} has NaN`);faceCount+=(o.geometry.index?.count||pos.count)/3;}});
 for(const kind of [false,true,{phase:.5,action:'chop'},{phase:-1,action:'farm'},{phase:-1,action:'carry'}])animateSoldier(soldier,Math.PI,true,kind);
 for(const part of ['body','head','leftArm','rightArm','leftLeg','rightLeg']){
  const geometry=characterGeometry(variant,part);assert(geometry.attributes.normal.count>0);assert(geometry.boundingSphere.radius>0);
 }
 triangles+=faceCount;
 console.log(`${variant}: ${n} quads, ${Math.round(faceCount)} rendered triangles, rig OK`);
}
for(const kind of ['worker','market_woman','builder','slinger','spearman','archer','musketeer','rifleman','cavalry','motorized','shipwright','watercarrier','stone_fisher']){
 const g=new T.Group();const p=createSoldier(g,0,0,'#97725f',kind);animateSoldier(p,1.3,true,{phase:.6,action:'saw'});
 assert.equal(p.parent,g);
}
for(const type of ['army','motorizedArmy','settler','caravan','train','plane']){
 const o=createWorldUnit(type,0);updateWorldUnit(o,{c:12,r:15,path:[{c:13,r:15}]},1,(x,z)=>7);assert(o.userData.men.length>=1);
}
const old=createV49CharacterRig(new T.Group(),'warrior'),later=createV49CharacterRig(new T.Group(),'warrior');
assert.equal(old.legs[0].children[0].geometry,later.legs[0].children[0].geometry,'geometry caching for performance');
console.log(`V49 OK: 7 character GLB archetypes, ${Math.round(triangles)} total static test-triangles, 6 world mover kinds`);
