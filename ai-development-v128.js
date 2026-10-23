import {troopRole} from './military-v88.js?v=117a';
const originalBuildings=new Map(),originalUnits=new Map();
export const combatUnit=u=>u.hp>0&&!['scout','militia','transport','warship'].includes(u.kind);
export function readyForNextEra(state,team,troops){
 const age=state.ages[team],units=state.units.filter(u=>u.team===team&&combatUnit(u));
 const minimum=[1,3,5,7,9,10,0][age]||0;
 const current=units.filter(u=>(troops[u.kind]?.age??0)>=age).length;
 const modernMinimum=age<6?Math.max([1,2,2,3,3,4,0][age]||0,Math.ceil(units.length*.35)):0;
 return units.length>=minimum&&current>=modernMinimum;
}
export function allowAIResearch(state,team,id,troops,techs){
 const age=state.ages[team],d=techs[id];if(!d)return false;
 if(d.age>age)return readyForNextEra(state,team,troops);
 if(d.age<age)return true;
 const known=state.research[team].known,topics=Object.keys(techs).filter(k=>techs[k].age===age);
 const current=state.units.filter(u=>u.team===team&&combatUnit(u)&&(troops[u.kind]?.age??0)>=age).length;
 const total=state.units.filter(u=>u.team===team&&combatUnit(u)).length,needed=age<6?Math.max([1,2,2,3,3,4,0][age]||0,Math.ceil(total*.35)):0;
 if(current>=needed||known.filter(k=>techs[k]?.age===age).length<Math.ceil(topics.length/2))return true;
 // Pause optional research at the middle of an era while its basic army
 // and production chain catch up. Essential military inputs never get locked.
 return new Set(['warfare','archery','stone_tools','learning','hunting','water','agriculture','bronze','copper_tin','woodworking','masonry','iron','smelting','smithing','armor_craft','crossbows','knighthood','gunpowder','firearms','industrialization','steelmaking','rifles','modernity','combustion','petroleum']).has(id);
}
export function applyDevelopmentBalance(buildings,troops){
 const factors={farm:.62,barracks:.55,archery:.6,stable:.65,smith:.7,smelter:.8,mill:.8,bakery:.8,warehouse:.8,cellar:.8,armor_workshop:.7,crossbow_range:.7,siegeworkshop:.7,palisade:.38,stonewall:.4,watchtower:.55,stonetower:.55,gatehouse:.5,reinforced_wall:.5};
 for(const [id,factor]of Object.entries(factors)){
  const d=buildings[id];if(!d)continue;
  if(!originalBuildings.has(id))originalBuildings.set(id,{cost:{...d.cost},time:d.time});
  const base=originalBuildings.get(id);
  d.cost=Object.fromEntries(Object.entries(base.cost).map(([k,n])=>[k,Math.max(1,Math.ceil(n*factor))]));
  d.time=Math.max(8,Math.ceil(base.time*(id==='farm'?.75:.7)));
 }
 buildings.farm.workers=2;
 for(const [id,d]of Object.entries(troops)){
  if(['scout','militia','transport','warship'].includes(id)||!d.cost)continue;
  if(!originalUnits.has(id))originalUnits.set(id,{cost:{...d.cost},time:d.time});
  const base=originalUnits.get(id),role=troopRole(id);
  d.cost=Object.fromEntries(Object.entries(base.cost).map(([k,n])=>[k,Math.max(1,Math.ceil(n*.65))]));
  d.time=Math.max(15,Math.ceil((base.time||55)*.75));
  d.population=['cavalry','siege','vehicle'].includes(role)?2:1;
 }
}
export function militaryChoices(game,team,city,troops,tech){
 const s=game.s,age=s.ages[team],known=s.research[team].known;
 const actual=s.units.filter(u=>u.team===team&&combatUnit(u));
 const queued=s.cities.filter(c=>c.team===team).flatMap(c=>(c.training||[]).filter(j=>!j.ship&&j.kind!=='scout'));
 const counts={};for(const u of [...actual,...queued]){const role=troopRole(u.kind);counts[role]=(counts[role]||0)+1;}
 const weights=age<1?{melee:.65,ranged:.35}:age<2?{melee:.5,ranged:.3,cavalry:.2}:age<4?{melee:.45,ranged:.3,cavalry:.2,siege:.05}:age<5?{melee:.3,ranged:.4,cavalry:.2,siege:.1}:age<6?{ranged:.65,cavalry:.2,siege:.15}:{ranged:.65,vehicle:.2,siege:.15};
 const n=actual.length+queued.length+1;
 return Object.keys(troops).filter(id=>{
  const d=troops[id];return !['scout','militia','transport','warship','bronze_cavalry'].includes(id)&&d.age<=age&&
   !game.obsoleteUnit(team,id)&&(!tech[id]||known.includes(tech[id]))&&d.requires.every(k=>game.cityReady(city,k));
 }).sort((a,b)=>{
  const score=id=>{const d=troops[id],role=troopRole(id);return ((weights[role]||.03)*n-(counts[role]||0))*100+d.age*8+(d.dmg||0)*.02;};
  return score(b)-score(a)||a.localeCompare(b);
 });
}
export function militaryInfrastructure(game,team,city){
 const age=game.s.ages[team],n=game.s.units.filter(u=>u.team===team&&combatUnit(u)).length;
 const choices=[['barracks',188],['archery',173]];
 if(age>=1)choices.push(['mason',184],['coppermine',183],['tinmine',182],['bronze_foundry',181]);
 if(age>=2)choices.push(['coal',180],['smelter',179],['smith',178],['stable',164],['siegeworkshop',141]);
 if(age>=3)choices.push(['armor_workshop',177],['crossbow_range',176]);
 if(age>=4)choices.push(['nitrate',177],['powdermill',176]);
 if(age>=5)choices.push(['steelworks',178],['engineworks',172]);
 if(age>=6)choices.push(['oilwell',175],['refinery',174],['autofactory',171]);
 return choices.filter(([id])=>id==='barracks'||n<6+age*4||['smith','steelworks','powdermill'].includes(id));
}
export function towerGuardKind(state,team){
 const age=state.ages[team]||0,known=state.research?.[team]?.known||[],has=id=>known.includes(id);
 return age>=6&&has('modernity')?'modern_infantry':age>=5&&has('rifles')?'rifleman':age>=4&&has('firearms')?'musketeer':age>=3&&has('crossbows')?'crossbowman':age>=2&&has('iron')?'iron_archer':age>=1&&has('bronze')?'bronze_archer':'archer';
}
