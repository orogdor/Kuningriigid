import {cachedCityBuildings} from './perf-state-v131.js';
// One resident supplies one point per minute; completed civic education multiplies it.
// Science points are per *game minute*, not flat points per real second.
import {tempoMultiplier} from './tempo.js';
import {EDUCATION_TYPES,EDUCATION_MULTIPLIER,knowledgeMultiplier} from './education-v141.js';
import {knowledgeCostFactor} from './growth-balance-v125.js';
export const SCIENCE_BUILDINGS=Object.freeze(Object.fromEntries(EDUCATION_TYPES.map(type=>[type,EDUCATION_MULTIPLIER])));
export const SCIENCE_PER_RESIDENT=1;
export const SCIENCE_PER_CITY=0;
export const SCIENCE_PER_TURN = 10;
export const EUREKA_FRACTION = .35;
export const researchCost = (state, tech) => (tech?.turns ?? 0) * SCIENCE_PER_TURN * tempoMultiplier(state) * (state.strategyPacingV125===true?knowledgeCostFactor(tech?.age??0):1);
const allBuildings=city=>cachedCityBuildings(city)||[city,...Object.values(city.districts||{})].flatMap(ctx=>ctx.economy?.buildings||[]).filter(b=>!b.virtual);
export function cityScience(city,known=[]){
 const base=Math.max(0,city.economy?.realms?.[city.team]?.pop||0);
 const institutions=allBuildings(city).filter(b=>SCIENCE_BUILDINGS[b.type]&&b.ready&&!b.disabled&&b.hp>0).length;
 const educationMultiplier=EDUCATION_MULTIPLIER**institutions;
 const discoveryMultiplier=knowledgeMultiplier(known);
 const total=base*educationMultiplier*discoveryMultiplier;
 return {base,institutions,educationMultiplier,discoveryMultiplier,buildings:base*(educationMultiplier-1),discoveries:base*educationMultiplier*(discoveryMultiplier-1),total};
}
export function scienceRate(state,team){
 const known=state.research?.[team]?.known||[];
 return (state.cities||[]).filter(c=>c.team===team).reduce((sum,c)=>sum+cityScience(c,known).total,0);
}
const hasBuilding=(state,team,type)=>state.cities.some(c=>c.team===team&&allBuildings(c).some(b=>b.type===type&&b.ready&&b.hp>0));
export const EUREKAS={
 hunting:'Avastasid lähedalt ulukid', fishing:'Avastasid kalavaru',
 forestry:'Esimene metsamaja valmis', bronze:'Metsamaja ja kivimurd valmis',
 settlement:'Avastatud 45 maailmaruutu', woodworking:'Metsamaja ja esimene elamu valmis',
 shipbuilding:'Kalapüügi ja puidutöö kogemus', agriculture:'Avatud viljakas põllumaa',
 milling:'Esimene talu valmis', iron:'Leitud rauamaagi maardla',
 smelting:'Esimene rauakaevandus valmis', navigation:'Rannikusadam valmis',
 civics:'Rajatud vähemalt kaks linna', horsemanship:'Valmis loomafarm ja tall',printing:'Ülikool on valmis',steelmaking:'Rauasulatusahi valmis',steam_engine:'Terasevabrik on valmis',electricity:'Masinatehas valmis',combustion:'Rafineerimistehas valmis'
};
export function discoveryUnlocked(state,team,id){
 const cities=state.cities?.filter(c=>c.team===team)||[];
 switch(id){
 case 'hunting':return cities.some(c=>c.world?.resources?.some(r=>r.kind==='game')||c.resourceDiscoveries?.game);
 case 'fishing':return cities.some(c=>c.world?.resources?.some(r=>r.kind==='fish')||c.resourceDiscoveries?.fish);
 case 'forestry':return hasBuilding(state,team,'lumber');
 case 'bronze':return hasBuilding(state,team,'lumber')&&hasBuilding(state,team,'quarry');
 case 'settlement':return Object.keys(state.explored?.[team]||{}).length>=45;
 case 'woodworking':return hasBuilding(state,team,'lumber')&&hasBuilding(state,team,'house');
 case 'shipbuilding':return hasBuilding(state,team,'lumber')&&hasBuilding(state,team,'fisher');
 case 'agriculture':return cities.some(c=>c.world?.resources?.some(r=>r.kind==='berry'&&!r.removed));
 case 'milling':return hasBuilding(state,team,'farm');
 case 'iron':return cities.some(c=>c.world?.resources?.some(r=>r.kind==='ore'));
 case 'smelting':return hasBuilding(state,team,'mine');
 case 'navigation':return hasBuilding(state,team,'harbor');
 case 'civics':return cities.length>=2;
 case 'horsemanship':return hasBuilding(state,team,'pasture')&&hasBuilding(state,team,'stable');case 'printing':return hasBuilding(state,team,'university');case 'steelmaking':return hasBuilding(state,team,'smelter');case 'steam_engine':return hasBuilding(state,team,'steelworks');case 'electricity':return hasBuilding(state,team,'engineworks');case 'combustion':return hasBuilding(state,team,'refinery');
 default:return false;
 }
}
