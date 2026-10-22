import {UNIT_GRADES} from './military-v88.js?v=116a';
export const MAX_ARMY_LEVEL=10;
export const xpForLevel=level=>100*(Math.max(1,Math.min(10,level))-1)**2;
export const armyLevel=army=>Math.min(10,1+Math.floor(Math.sqrt(Math.max(0,army?.xp||0)/100)));
export const experienceBonus=army=>1+2*(armyLevel(army)-1)/9;
export const armyForUnit=(state,u)=>state.armies.find(a=>a.team===u.team&&(a.id||0)===(u.armyId||0));
export function unitStats(def,u,army=null){
 const experience=army?experienceBonus(army):(u.experienceMultiplier??1),quality=UNIT_GRADES[u.grade||'standard']?.strength??1;
 return {...def,hp:def.hp*quality*experience,dmg:def.dmg*quality*experience,range:def.range*experience,speed:def.speed*experience,morale:100*experience,attackSpeed:experience};
}
export function syncArmyStats(state,army,definitions){
 const factor=experienceBonus(army);army.level=armyLevel(army);
 for(const u of state.units.filter(u=>u.team===army.team&&(u.armyId||0)===(army.id||0)&&!u.garrison)){
  if(!definitions[u.kind])continue;const stats=unitStats(definitions[u.kind],u,army),previous=u.maxHp||definitions[u.kind].hp*(UNIT_GRADES[u.grade||'standard']?.strength??1)*(u.experienceMultiplier||1);
  u.hp=Math.max(0,Math.min(stats.hp,u.hp/previous*stats.hp));u.maxHp=stats.hp;
  u.morale=(u.morale??100)/(u.maxMorale||100)*stats.morale;u.maxMorale=stats.morale;
  u.grade??='standard';u.experienceMultiplier=factor;u.armyLevel=army.level;
 }
}
export function initArmyExperience(state,definitions){
 for(const army of state.armies){army.xp=Math.max(0,Math.min(xpForLevel(10),Number.isFinite(army.xp)?army.xp:0));syncArmyStats(state,army,definitions);}
}
export function rewardBattleExperience(state,battle,definitions){
 if(!battle.result||battle.experienceAwarded)return [];
 const groups=new Map();
 for(const q of battle.squads){if(q.civilian||q.source<0||!state.units[q.source])continue;const u=state.units[q.source];if(u.garrison)continue;
  const army=armyForUnit(state,u);if(!army)continue;const key=army.team+':'+(army.id||0);let record=groups.get(key);
  if(!record){record={army,xp:10};groups.set(key,record);}record.xp+=(q.damageDealt||0)*.5+(q.kills||0)*25;
 }
 const awards=[];
 for(const {army,xp}of groups.values()){
  const alive=state.units.some(u=>u.team===army.team&&(u.armyId||0)===(army.id||0)&&!u.garrison&&u.hp>0);
  if(!alive){army.xp=0;army.level=1;continue;}
  const earned=Math.round(xp+(army.team===battle.winnerTeam?100:0));army.xp=Math.min(xpForLevel(10),(army.xp||0)+earned);syncArmyStats(state,army,definitions);awards.push({team:army.team,armyId:army.id||0,earned,level:army.level,xp:army.xp});
 }
 battle.experienceAwarded=true;return awards;
}
export function armyTravelMultiplier(state,army,definitions){
 const units=state.units.filter(u=>u.team===army.team&&(u.armyId||0)===(army.id||0)&&u.hp>0&&!u.garrison);
 return units.length?Math.max(.2,Math.min(...units.map(u=>unitStats(definitions[u.kind]||{speed:3},u,army).speed))/3):1;
}
export function rallyArmies(game,target){
 if(game.s.battle)return {error:'Lõpeta esmalt lahing.'};if(target.embarked!=null)return {error:'Maabu esmalt laevalt.'};
 target.path=[];target.autoExplore=false;let ordered=0,unreachable=0;
 for(const army of game.s.armies){if(army===target||army.team!==target.team||army.embarked!=null||!game.s.units.some(u=>u.team===army.team&&(u.armyId||0)===(army.id||0)&&u.hp>0&&!u.garrison))continue;
  const path=game.landPath(army,target,army.team);if(path===null){unreachable++;continue;}army.path=path;army.autoExplore=false;army.rallyTarget=target.id||0;ordered++;
 }
 return {ok:true,ordered,unreachable};
}
export function formationTargets(units,target){
 const columns=Math.max(1,Math.ceil(Math.sqrt(units.length)));
 return units.map((u,i)=>({unit:u,target:{x:target.x+(i%columns-(columns-1)/2)*3,z:target.z+Math.floor(i/columns)*3}}));
}
