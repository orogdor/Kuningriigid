import fs from 'node:fs';
import {Civilization,createGame} from '../civilization-core.js';
import {takeOverAI} from '../ai-takeover-v128.js';
import {AI_CITY_SPACING} from '../historical-city-v135.js';
const seed=136023,limit=Number(process.env.V136_TURNS||245),started=Date.now();
const game=new Civilization(createGame(seed));
for(let turn=1;turn<=limit;turn++){
 for(let step=0;step<5;step++)game.tick(12);
 if(turn%20===0)console.log('V136 simulation',JSON.stringify({turn,cities:game.s.cities.length,ages:game.s.ages,seconds:Math.round((Date.now()-started)/1000)}));
 if(game.s.winner!=null)break;
}
const count=team=>game.s.cities.filter(c=>c.team===team).reduce((sum,c)=>sum+game.contexts(c).reduce((n,ctx)=>n+ctx.economy.buildings.filter(b=>!b.virtual&&b.hp>0).length,0),0);
const roster=[1,2,3].map(team=>{
 const cities=game.s.cities.filter(c=>c.team===team);
 const structures=cities.flatMap(c=>game.contexts(c).flatMap(ctx=>ctx.economy.buildings.filter(b=>!b.virtual&&b.hp>0)));
 return {team,cities:cities.length,buildings:structures.length,markets:structures.filter(b=>b.type==='market').length,harbors:structures.filter(b=>b.type==='harbor').length,ages:game.s.ages[team]};
});
const source=[...roster].sort((a,b)=>(b.markets*6+b.harbors*8+b.buildings*.2)-(a.markets*6+a.harbors*8+a.buildings*.2))[0].team;
if(!game.s.cities.some(c=>c.team===source)||count(source)<5)throw Error('AI constructed too few buildings to demonstrate a city');
const originalCities=game.s.cities.filter(c=>c.team===source);
const spacings=originalCities.flatMap((c,i)=>originalCities.slice(i+1).map(d=>Math.max(Math.abs(c.c-d.c),Math.abs(c.r-d.r))));
const state=takeOverAI(game.s,source);
state.demo='ai-city-v136';
state.aiCityTestV136={sourceTeam:source,seed,turn:Math.floor(state.time/60)+1,buildings:count(source),cities:originalCities.length,minSpacing:AI_CITY_SPACING,markets:roster.find(t=>t.team===source).markets,harbors:roster.find(t=>t.team===source).harbors,source:'All buildings created in simulated normal AI economy; city contour changed in V136'};
const districts=new Set(state.cities.flatMap(c=>Object.values(c.districts||{}).map(d=>d.economy)));
fs.mkdirSync('scenarios',{recursive:true});
const output='scenarios/ai-city-v136.json';
fs.writeFileSync(output,JSON.stringify(state,function(k,v){return districts.has(this)&&['realms','resources'].includes(k)?undefined:v}));
const metrics={version:136,roster,seed,turn:state.aiCityTestV136.turn,sourceTeam:source,cities:originalCities.length,buildings:count(source),spacingPairs:spacings,ages:state.ages,bytes:fs.statSync(output).size,seconds:Math.round((Date.now()-started)/1000)};
fs.writeFileSync('scenarios/ai-city-v136.manifest.json',JSON.stringify(metrics,null,2));
console.log('V136 AI CITY DEMO GENERATED',JSON.stringify(metrics));
