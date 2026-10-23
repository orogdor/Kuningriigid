import fs from 'node:fs';
import {Civilization,BUILDINGS} from '../civilization-core.js';
import {isShore} from '../fishery.js';
const g=new Civilization(JSON.parse(fs.readFileSync('scenarios/ai-city-v136.json'))),s=g.s;
const totals=[];
for(let team=0;team<=3;team++){
 const towns=s.cities.filter(c=>c.team===team),research=s.research[team],cities=[];
 for(const city of towns){
  const owned=[...g.territory].filter(([,p])=>p.id===city.id),coasts=owned.map(([key])=>{const [c,r]=key.split(':').map(Number);return {c,r}}).filter(p=>isShore(g,p));
  const data={id:city.id,name:city.name,age:s.ages[team],pop:city.economy.realms[team].pop,
   ships:s.ships?.filter(a=>a.team===team).length||0,
   stock:Object.fromEntries(['wood','stone','plank'].map(k=>[k,city.economy.realms[team].resources[k]])),
   coast:coasts.length,coastCandidates:[],market:g.allBuildings(city).filter(b=>b.type==='market'&&b.hp>0).length,harbor:g.allBuildings(city).filter(b=>b.type==='harbor'&&b.hp>0).length};
  for(const p of coasts.slice(0,4)){
   const ctx=g.contextAt(p,true),sites=g.buildingSites(ctx,'harbor');
   data.coastCandidates.push({tile:[p.c,p.r],sites:sites.length,rule:g.buildRule(ctx,'harbor'),preview:sites.length?g.previewBuild(ctx,'harbor',sites[0]).error||'ok':'no-coast-sites'});
  }
  cities.push(data);
 }
 totals.push({team,age:s.ages[team],known:research.known.filter(id=>['bronze','iron','shipbuilding','fishing','woodworking','commerce','storage'].includes(id)),harborCost:BUILDINGS.harbor.cost,cities});
}
const results={seed:s.seed,gameTurn:Math.floor(s.time/60)+1,totals};console.log('HARBOR V136 DIAG',JSON.stringify(results));fs.mkdirSync('reports/ai-city-v136',{recursive:true});fs.writeFileSync('reports/ai-city-v136/harbors.json',JSON.stringify(results,null,2));
