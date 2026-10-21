import {troopRole} from './military-v88.js';
export const soldierBodyRadius=u=>u.kind==='chariot'||troopRole(u.kind)==='vehicle'?2:troopRole(u.kind)==='cavalry'?1.05:.34;
// Combat geometry is independent of level, grade and weapon damage.
export function meleeReach(u,man,target){const bodies=(man?.radius??.34)+(target?.radius??.34);const weapon=['spearman','bronze_spearman','javelinman'].includes(u.kind)?1.05:['pikeman','halberdier'].includes(u.kind)?1.85:troopRole(u.kind)==='cavalry'?.55:.38;return bodies+weapon;}
export function squadContactGoal(u,target){const d=Math.hypot(u.x-target.x,u.z-target.z);return d>1.8?target:null;}
export function bracingThreat(u,foes){const distance=v=>Math.hypot(u.x-v.x,u.z-v.z),nearest=foes.filter(v=>!v.routing).reduce((a,v)=>!a||distance(v)<distance(a)?v:a,null);return !!nearest&&(nearest.kind!=='chariot'||nearest.ammoRemaining===0)&&troopRole(nearest.kind)==='cavalry'&&distance(nearest)<12;}
