import {isBow} from './historical-tactics-v92.js';
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
// Squads keep an opponent and a marching lane. Small changes in enemy
// centroids must not turn an advancing battle line into a series of U-turns.
export function committedOpponent(u,foes){
 const available=foes.filter(v=>!v.routing),list=available.length?available:foes;
 const cost=v=>distance(u,v)+Math.abs((u.deployment?.z??u.z)-v.z)*.65;
 const best=list.reduce((p,v)=>!p||cost(v)<cost(p)?v:p,null),previous=list.find(v=>v.source===u.engagementTarget);
 const target=previous&&best&&cost(previous)<cost(best)*1.35+8?previous:best;
 if(target)u.engagementTarget=target.source;return target;
}
export function marchingGoal(u,target,goal){
 if(!goal||!target||u.routing||u.manualOrder||isBow(u)||['flank','support'].includes(u.tacticalRole))return goal;
 if(distance(u,target)>22&&(target.x-u.x)*(u.battleSide||1)>0)return {x:goal.x,z:u.deployment?.z??u.z};
 return goal;
}
export function keepAdvance(u,m,goal,enemyDistance,target=null){
 if(u.routing||m.routing||u.manualOrder||u.formation==='hold'||u.formation==='spear_wall'||(u.formationManual&&u.formation==='skirmish')||enemyDistance<18)return goal;
 // A man ahead of his dressing point waits or dresses sideways. He does not
 // march backwards with the whole squad to satisfy a virtual formation slot.
 const side=u.battleSide||1;if(target&&(target.x-m.x)*side<=0)return goal;
 return (goal.x-m.x)*side<0?{x:m.x,z:goal.z}:goal;
}
