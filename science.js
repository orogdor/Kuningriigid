import {cachedCityBuildings} from './perf-state-v131.js';
// Every city contributes basic knowledge; staffed academic buildings add science.
// Science points are per *game minute*, not flat points per real second.
import {tempoMultiplier} from './tempo.js';
import {knowledgeCostFactor,knowledgeCityMultiplier} from './growth-balance-v125.js';
export const SCIENCE_BUILDINGS = Object.freeze({study:6,scriptorium:10,academy:16,university:24,monastery:16,chapel:10,observatory:30,polytechnic:42,laboratory:65});
export const SCIENCE_PER_RESIDENT = .45;
export const SCIENCE_PER_CITY = 2.4;
export const SCIENCE_PER_TURN = 10;
export const EUREKA_FRACTION = .35;
export const researchCost = (state, tech) => (tech?.turns ?? 0) * SCIENCE_PER_TURN * tempoMultiplier(state) * (state.strategyPacingV125===true?knowledgeCostFactor(tech?.age??0):1);
const allBuildings=city=>cachedCityBuildings(city)||[city,...Object.values(city.districts||{})].flatMap(ctx=>ctx.economy?.buildings||[]).filter(b=>!b.virtual);
export function cityScience(city){
 const pop=Math.max(0,city.economy?.realms?.[city.team]?.pop||0);
 const base=SCIENCE_PER_CITY+pop*SCIENCE_PER_RESIDENT;
 const buildings=allBuildings(city).reduce((n,b)=>n+(b.ready&&!b.disabled&&b.hp>0 ? (SCIENCE_BUILDINGS[b.type]||0)*Math.max(0,Math.min(1,b.efficiency||0))*(b.researchActivity??1) : 0),0);
 return {base,buildings,total:base+buildings};
}
export function scienceRate(state,team){
 const own=state.cities?.filter(c=>c.team===team)||[];
 if(!own.length)return 0;
 const raw=own.reduce((n,c)=>n+cityScience(c).total,0);
 const rate=state.strategyPacingV125===true ? raw * knowledgeCityMultiplier(own.length) / Math.max(1,own.length) * (1+.40*Math.log2(Math.max(1,own.length))) : raw;
 // Difficulty is only a small scientific catch-up adjustment, not the old 45% penalty.
 const modifier=team===0?1:(state.difficulty==='easy'?.88:state.difficulty==='hard'?1.12:1);
 return rate*modifier;
}
const hasBuilding=(state,team,type)=>state.cities.some(c=>c.team===team&&allBuildings(c).some(b=>b.type===type&&b.ready&&b.hp>0));
export const EUREKAS={
 hunting:'Avastasid lähedalt ulukid', fishing:'Avastasid kalavaru',
 forestry:'Esimene metsamaja valmis', bronze:'Metsamaja ja kivimurd valmis',
 settlement:'Avastatud 45 maailmaruutu', woodworking:'Metsamaja ja esimene elamu valmis',
 shipbuilding:'Kalapüügi ja puidutöö kogemus', agriculture:'Avatud viljakas põllumaa',
 milling:'Esimene talu valmis', iron:'Leitud rauamaagi maardla',
 smelting:'Esimene rauakaevandus valmis', navigation:'Esimene laev merel',
 civics:'Rajatud vähemalt kaks linna', horsemanship:'Värvatud viis sõdurit',printing:'Ülikool on valmis',steelmaking:'Rauasulatusahi valmis',steam_engine:'Terasevabrik on valmis',electricity:'Masinatehas valmis',combustion:'Rafineerimistehas valmis'
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
 case 'navigation':return state.ships?.some(s=>s.team===team&&s.hp>0);
 case 'civics':return cities.length>=2;
 case 'horsemanship':return (state.units?.filter(u=>u.team===team&&u.hp>0).length||0)>=5;case 'printing':return hasBuilding(state,team,'university');case 'steelmaking':return hasBuilding(state,team,'smelter');case 'steam_engine':return hasBuilding(state,team,'steelworks');case 'electricity':return hasBuilding(state,team,'engineworks');case 'combustion':return hasBuilding(state,team,'refinery');
 default:return false;
 }
}
