// V222: fast offline motion regression tests; no Playwright, download, model export or CI build.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {animateStoneWorkerV222,enhanceStoneWarriorV222} from './stone-motion-v222.js';

const NAMES=['hips','spine','chest','neck','head','upperArm_L','forearm_L','hand_L','upperArm_R','forearm_R','hand_R','thigh_L','shin_L','foot_L','thigh_R','shin_R','foot_R','body'];
function bone(){
 const o={x:0,y:0,z:0};
 return {rotation:{...o,set(x,y,z){this.x=x;this.y=y;this.z=z;}},position:{...o,set(x,y,z){this.x=x;this.y=y;this.z=z;}}};
}
function rig(kind,worker=false){
 const bones=Object.fromEntries(NAMES.map(n=>[n,bone()]));
 const r={bones,phase:.2,kind,unitKind:kind,...(worker?{stoneHuman:true,tool:{visible:true}}:{v148:true})};
 return {userData:{rig:r}};
}
function finite(root){
 for(const b of Object.values(root.userData.rig.bones)){
  for(const v of Object.values(b.rotation).filter(x=>typeof x==='number'))assert.ok(Number.isFinite(v),'rotation must stay finite');
  for(const v of Object.values(b.position).filter(x=>typeof x==='number'))assert.ok(Number.isFinite(v),'position must stay finite');
 }
}
const workerKinds=[
 ['stone_lumber','chop'],['stone_miner','mine'],['stone_builder','build'],
 ['stone_forester','chop'],['stone_farmer','farm'],['stone_gatherer','gather'],
 ['stone_fisher','fishing'],['stone_watercarrier','water'],['stone_worker','work']
];
for(const [kind,action] of workerKinds){
 const root=rig(kind,true);let min=Infinity,max=-Infinity;
 for(let frame=0;frame<140;frame++){
  const t=frame/30;const moving=frame<30||frame>=100;
  assert.equal(animateStoneWorkerV222(root,t,moving,{action,phase:-1}),true);
  finite(root);
  const a=root.userData.rig.bones.upperArm_R.rotation.x;min=Math.min(min,a);max=Math.max(max,a);
 }
 assert.ok(max-min>.12,kind+': arm is animated');
 assert.equal(root.userData.rig.animationV222,true);
}
const carrier=rig('stone_worker',true);for(let i=0;i<60;i++)animateStoneWorkerV222(carrier,i/30,true,{phase:-1,action:'carry'});
assert.ok(carrier.userData.rig.bones.forearm_R.rotation.x<-.6,'carry holds arms while walking');
assert.equal(carrier.userData.rig.tool.visible,false,'carry hides work tool');
const idle=rig('stone_settler',true);animateStoneWorkerV222(idle,1,false,false);finite(idle);
for(const kind of ['slinger','spearman','axeman','archer','scout','militia']){
 const root=rig(kind);const a=[];
 for(let i=0;i<=100;i++){
  assert.equal(enhanceStoneWarriorV222(root,i/60,i<20,{phase:i/100,formed:.8,formation:'spear_wall'}),true);
  finite(root);a.push(root.userData.rig.bones.upperArm_R.rotation.x);
  // The underlying V148 animation sampler overwrites the pose every frame.
  for(const b of Object.values(root.userData.rig.bones))b.rotation.set(0,0,0);
 }
 assert.ok(Math.max(...a)-Math.min(...a)>.15,kind+': distinctive attack');
 assert.equal(root.userData.rig.animationV222,true);
}
const other=rig('knight');assert.equal(enhanceStoneWarriorV222(other,1,true,{phase:.4}),false,'later eras unaffected');
assert.ok(readFileSync('stone-age-models-v221.js','utf8').includes('animateStoneWorkerV222'));
assert.ok(readFileSync('soldier-models-v148.js','utf8').includes('enhanceStoneWarriorV222'));
console.log('V222 PASS: 9 workers, carry, idle, 6 Stone Age warriors, other-era guard, integrations.');
