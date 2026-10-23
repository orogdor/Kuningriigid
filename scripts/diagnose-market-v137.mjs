import fs from 'node:fs';
import {Civilization,BUILDINGS} from '../civilization-core.js';
import {selectAIBuild} from '../ai-strategy.js';
import {grantTech} from '../research.js';
const g=new Civilization(JSON.parse(fs.readFileSync('scenarios/ai-city-v137.json')));
for(const city of g.s.cities.filter(c=>c.team===0).slice(0,8)){
 grantTech(g.s.research[city.team],'commerce');
 const all=g.allBuildings(city),r=city.economy.realms[city.team],urban=g.contexts(city).filter(ctx=>!g.isCountyTile(ctx,city));
 const sites=g.constructionArea(city).tiles.filter(p=>Math.max(Math.abs(p.c-city.c),Math.abs(p.r-city.r))<=2);
 const test=[];
 for(const p of sites){const ctx=g.contextAt(p,true);if(g.isCountyTile(ctx,city))continue;const a=g.buildingSites(ctx,'market'),errors={},success=[];
  for(const at of a.slice(0,100)){const error=g.previewBuild(ctx,'market',at).error||'ok';errors[error]=(errors[error]||0)+1;if(error==='ok'&&success.length<2)success.push(at)}
  test.push({tile:[p.c,p.r],n:ctx.economy.buildings.length,sites:a.length,success,topErrors:Object.entries(errors).sort((a,b)=>b[1]-a[1]).slice(0,5)});
 }
 console.log('V137 MARKET DIAG '+JSON.stringify({city:city.name,pop:r.pop,age:g.s.ages[city.team],stock:Object.fromEntries(['wood','stone','plank','bread','water'].map(k=>[k,r.resources[k]])),known:g.s.research[city.team].known.filter(k=>['storage','commerce','bronze','woodworking','shipbuilding'].includes(k)),cost:BUILDINGS.market.cost,globalReady:g.cityReady(city,'market'),nHouses:all.filter(b=>b.type==='house').length,decision:selectAIBuild(g,city.team,city),tiles:test}));
}
