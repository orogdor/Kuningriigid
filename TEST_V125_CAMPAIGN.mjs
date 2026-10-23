// V125 repeatable long-run campaign QA: real economy, real research, AI builds,
// settlers, soldiers and physically dispatched merchant shipments. Headless core
// does not initiate browser collision battles; do not claim otherwise.
import fs from 'node:fs';
import {Civilization,createGame,FACTION_NAMES} from './civilization-core.js?v=125a';
import {ageDeficit} from './era-economy.js';
import {scienceRate} from './science.js';
import {TECHS} from './research.js?v=125a';
const seed=Number(process.env.V125_SEED||12501),limit=Number(process.env.V125_TURNS||900);
const g=new Civilization(createGame(seed)),s=g.s;
const history=[],eras=[],wars=[],trades=[],cities=[],knownCity=new Set(),knownShipment=new Set();
const oldAges=[...s.ages];let turns=0;
const fmt=n=>Math.round((Number(n)||0)*100)/100;
const sample=team=>{
 const towns=s.cities.filter(c=>c.team===team),r=s.research[team],totals={};
 for(const id of ['wood','stone','plank','grain','bread','water','iron','coal','steel','machines','oil','fuel','power']){
  totals[id]=fmt(towns.reduce((v,c)=>v+(c.economy.realms[team].resources[id]||0),0));
 }
 const buildings=towns.flatMap(c=>[c,...Object.values(c.districts||{})].flatMap(d=>d.economy?.buildings||[]));
 return {team,age:s.ages[team],towns:towns.length,pop:towns.reduce((v,c)=>v+c.economy.realms[team].pop,0),
  techs:r.known.length,rate:fmt(scienceRate(s,team)),research:r.active||null,
  wait:r.ageWait?.id||null,missing:r.ageWait?ageDeficit(s,team,r.ageWait.id):{},
  buildings:buildings.filter(b=>b.ready&&b.hp>0).length,pending:buildings.filter(b=>!b.ready&&b.hp>0).length,
  troops:s.units.filter(u=>u.team===team&&u.hp>0).length,settlers:s.settlers.filter(a=>a.team===team).length,
  stock:totals};
};
const started=Date.now();
for(let t=1;t<=limit;t++){
 for(let k=0;k<5;k++){g.aiTeam(0);g.tick(12)}
 turns=t;
 for(let team=0;team<4;team++){for(let age=oldAges[team]+1;age<=s.ages[team];age++)eras.push({turn:t,team,age});oldAges[team]=s.ages[team]}
 for(const c of s.cities)if(!knownCity.has(c.id)){knownCity.add(c.id);cities.push({turn:t,team:c.team,name:c.name,role:c.economicRole||null,c:c.c,r:c.r})}
 for(const v of s.shipments||[])if(!knownShipment.has(v.id)){knownShipment.add(v.id);trades.push({turn:t,from:v.from,to:v.to,goods:{...v.goods},mode:v.mode})}
 for(const e of s.events||[])if(/war|sõda/i.test(e.text||'')){const key=(e.time||0)+':'+e.text;if(!wars.some(x=>x.key===key))wars.push({...e,key})}
 if(t%10===0||t===1)history.push({turn:t,teams:[0,1,2,3].map(sample)});
 if(t%50===0)console.log('V125_TURN',seed,t,'seconds',fmt((Date.now()-started)/1000),JSON.stringify([0,1,2,3].map(a=>{const z=sample(a);return {team:a,age:z.age,towns:z.towns,people:z.pop,techs:z.techs,troops:z.troops,missing:z.missing}})));
 if(s.ages.every(x=>x>=6))break;
}
const final=[0,1,2,3].map(sample),arrivals=Array.from({length:4},(_,team)=>eras.find(e=>e.team===team&&e.age===6)?.turn??null);
const output={seed,revision:'V125',turns,limit,reachedModern:arrivals,allModern:arrivals.every(Boolean),final,eras,cities,trades,wars,history,elapsedSeconds:fmt((Date.now()-started)/1000),
 notes:['No injected free technology or resources','State uses the ordinary Civilization.tick and aiTeam logic','Headless engine does not create browser combat encounters','Every city placement, trade dispatch and era payment uses game logic']};
fs.mkdirSync('artifacts-v125',{recursive:true});fs.writeFileSync('artifacts-v125/seed-'+seed+'.json',JSON.stringify(output,null,2));
console.log('V125_FINAL',JSON.stringify({seed,turns,arrivals,allModern:output.allModern,cities:cities.length,trades:trades.length,wars:wars.length,final:final.map(x=>({team:x.team,age:x.age,towns:x.towns,pop:x.pop,techs:x.techs,troops:x.troops,missing:x.missing}))}));
