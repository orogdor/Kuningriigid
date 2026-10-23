import fs from 'node:fs';
import {Civilization,createGame} from '../civilization-core.js';
import {takeOverAI} from '../ai-takeover-v128.js';
import {AI_CITY_SPACING} from '../historical-city-v135.js';
const seed=139023,limit=Number(process.env.V139_TURNS||200),started=Date.now();
const game=new Civilization(createGame(seed));
for(let turn=1;turn<=limit;turn++){
 for(let step=0;step<5;step++)game.tick(12);
 if(turn%20===0)console.log('V139 simulation',JSON.stringify({turn,cities:game.s.cities.length,ages:game.s.ages,seconds:Math.round((Date.now()-started)/1000)}));
 if(game.s.winner!=null)break;
}
const count=team=>game.s.cities.filter(c=>c.team===team).reduce((sum,c)=>sum+game.contexts(c).reduce((n,ctx)=>n+ctx.economy.buildings.filter(b=>!b.virtual&&b.hp>0).length,0),0);
const roster=[1,2,3].map(team=>{
 const cities=game.s.cities.filter(c=>c.team===team);
 const structures=cities.flatMap(c=>game.contexts(c).flatMap(ctx=>ctx.economy.buildings.filter(b=>!b.virtual&&b.hp>0)));
 return {team,cities:cities.length,buildings:structures.length,markets:structures.filter(b=>b.type==='market').length,harbors:structures.filter(b=>b.type==='harbor').length,houses:structures.filter(b=>b.type==='house').length,fields:structures.filter(b=>b.type==='field').length,ages:game.s.ages[team]};
});
const source=[...roster].sort((a,b)=>(b.markets*6+b.harbors*8+b.buildings*.2)-(a.markets*6+a.harbors*8+a.buildings*.2))[0].team;
if(!game.s.cities.some(c=>c.team===source)||count(source)<5)throw Error('AI constructed too few buildings to demonstrate a city');
const originalCities=game.s.cities.filter(c=>c.team===source);
const spacings=originalCities.flatMap((c,i)=>originalCities.slice(i+1).map(d=>Math.max(Math.abs(c.c-d.c),Math.abs(c.r-d.r))));
const landUse=originalCities.map(city=>{
 const area=game.constructionArea(city),tiles=area.tiles.map(p=>({p,ctx:game.contextAt(p,false)}));
 const developed=tiles.filter(({ctx})=>ctx?.economy.buildings.some(b=>!b.virtual&&b.hp>0)).length;
 const ruralDeveloped=tiles.filter(({p,ctx})=>game.isCountyTile(p,city)&&ctx?.economy.buildings.some(b=>!b.virtual&&b.hp>0)).length;
 return {name:city.name,owned:tiles.length,developed,ruralDeveloped,planned:city.aiTerritoryBuiltV137||0,homes:game.allBuildings(city).filter(b=>b.type==='house'&&b.hp>0).length,foodGrowthBonus:city.economy.realms[city.team].marketFoodBonusV137||0};
});
const density=originalCities.map(city=>{
 const area=game.constructionArea(city),tiles=area.tiles.map(p=>({p,ctx:game.contextAt(p,false)}));
 const nearEdge=tiles.flatMap(({ctx})=>ctx?.economy.buildings||[]).filter(b=>b.hp>0&&!b.virtual&&['house','market','warehouse','cellar'].includes(b.type)&&
  (Math.abs(b.x)>87||Math.abs(b.z)>73)).length;
 const expanded=tiles.filter(({ctx})=>ctx?.urbanExpansionV139).length;
 const urbanBuildings=tiles.filter(({p})=>!game.isCountyTile(p,city)).reduce((sum,{ctx})=>sum+(ctx?.economy.buildings.filter(b=>!b.virtual&&b.hp>0&&b.type!=='field').length||0),0);
 return {city:city.name,nearEdge,expanded,urbanBuildings,urbanTiles:tiles.filter(({p})=>!game.isCountyTile(p,city)).length};
});
const historicMetrics=originalCities.map(city=>{
 const b=game.allBuildings(city).filter(b=>b.hp>0&&!b.virtual);
 const cityBuildings=city.economy.buildings.filter(b=>b.hp>0&&!b.virtual);
 const house=cityBuildings.filter(b=>b.type==='house');
 const centre=house.filter(b=>Math.hypot(b.x,b.z)<52).length;
 const walls=cityBuildings.filter(b=>['palisade','stonewall','reinforced_wall','gatehouse','watchtower','stonetower'].includes(b.type));
 const services=b.filter(b=>['market','warehouse','cellar','study','scriptorium','well','harbor'].includes(b.type));
 return {name:city.name,centreHouses:centre,mainTileHouses:house.length,totalHouses:b.filter(b=>b.type==='house').length,
 walls:walls.length,gates:walls.filter(b=>b.type==='gatehouse').length,wallPlan:city.defensePlanV139?.slots?.length||0,
 services:services.map(b=>b.type).reduce((a,k)=>(a[k]=(a[k]||0)+1,a),{})};
});
const state=takeOverAI(game.s,source);
state.demo='ai-city-v139';
state.aiCityTestV139={sourceTeam:source,seed,turn:Math.floor(state.time/60)+1,buildings:count(source),cities:originalCities.length,minSpacing:AI_CITY_SPACING,markets:roster.find(t=>t.team===source).markets,harbors:roster.find(t=>t.team===source).harbors,houses:roster.find(t=>t.team===source).houses,fields:roster.find(t=>t.team===source).fields,landUse,density,historicMetrics,source:'All buildings created in simulated normal AI economy; city contour changed in V139'};
const districts=new Set(state.cities.flatMap(c=>Object.values(c.districts||{}).map(d=>d.economy)));
fs.mkdirSync('scenarios',{recursive:true});
const output='scenarios/ai-city-v139.json';
fs.writeFileSync(output,JSON.stringify(state,function(k,v){return districts.has(this)&&['realms','resources'].includes(k)?undefined:v}));
const metrics={version:138,roster,landUse,density,seed,turn:state.aiCityTestV139.turn,sourceTeam:source,cities:originalCities.length,buildings:count(source),spacingPairs:spacings,ages:state.ages,bytes:fs.statSync(output).size,seconds:Math.round((Date.now()-started)/1000)};
fs.writeFileSync('scenarios/ai-city-v139.manifest.json',JSON.stringify(metrics,null,2));
console.log('V139 AI CITY DEMO GENERATED',JSON.stringify(metrics));
