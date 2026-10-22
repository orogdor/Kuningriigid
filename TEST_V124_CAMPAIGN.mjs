import fs from 'node:fs';
import {Civilization,createGame,FACTION_NAMES} from './civilization-core.js?v=123a';
import {TECHS,ERA_NAMES} from './research.js?v=118a';
import {scienceRate} from './science.js';
import {ageDeficit,edibleSupply} from './era-economy.js';
const dir='artifacts-v124';fs.mkdirSync(dir,{recursive:true});
const seed=1241023,game=new Civilization(createGame(seed)),s=game.s;
const limit=Number(process.env.V124_MAX_TURNS||1000);
const samples=[],cityFoundings=[],trades=[],research=[],eras=[],wars=[],errors=[];
const seenCities=new Set(),seenTrade=new Set(),seenWars=new Set(),prev=[...s.ages];
const round=(n)=>Math.round((n||0)*100)/100;
function snap(team){
 const cs=s.cities.filter(c=>c.team===team),r=s.research[team],pop=cs.reduce((n,c)=>n+(c.economy.realms[team]?.pop||0),0),supplies={};
 for(const id of ['wood','stone','plank','bread','grain','flour','water','iron','coal','steel','machines','oil','fuel','power'])supplies[id]=round(cs.reduce((n,c)=>n+(c.economy.realms[team]?.resources?.[id]||0),0));
 const buildings=cs.flatMap(c=>[c,...Object.values(c.districts||{})].flatMap(ctx=>ctx.economy?.buildings||[]));
 return {team,age:s.ages[team],cities:cs.length,pop,techs:r.known.length,active:r.active,rate:round(scienceRate(s,team)),wait:r.ageWait?.id||null,deficit:r.ageWait?ageDeficit(s,team,r.ageWait.id):{},
  buildings:buildings.filter(b=>b.ready&&b.hp>0&&!b.virtual).length,unfinished:buildings.filter(b=>!b.ready&&b.hp>0&&!b.virtual).length,units:s.units.filter(u=>u.team===team&&u.hp>0).length,
  food:round(cs.reduce((n,c)=>n+edibleSupply(c.economy.realms[team].resources),0)),supplies};
}
function observe(turn){
 for(const c of s.cities)if(!seenCities.has(c.id)){seenCities.add(c.id);cityFoundings.push({turn,id:c.id,team:c.team,name:c.name,c:c.c,r:c.r})}
 for(const x of s.shipments||[])if(!seenTrade.has(x.id)){seenTrade.add(x.id);trades.push({turn,id:x.id,team:x.team,from:x.from,to:x.to,goods:{...(x.goods||{})},mode:x.mode})}
 for(const [k,x]of Object.entries(s.relations||{}))if(x.status==='war'&&!seenWars.has(k)){seenWars.add(k);wars.push({turn,teams:k})}
 for(const e of game.researchEvents.splice(0))research.push({turn,event:e});
 for(const team of [0,1,2,3]){if(s.ages[team]>prev[team])for(let age=prev[team]+1;age<=s.ages[team];age++)eras.push({turn,team,age});prev[team]=s.ages[team]}
 if(turn===1||turn%5===0)samples.push({turn,teams:[0,1,2,3].map(snap),shipments:s.shipments?.length||0,ships:s.ships?.length||0});
}
const started=Date.now();let rounds=0;
for(let turn=1;turn<=limit;turn++){
 for(let step=0;step<5;step++){game.aiTeam(0);game.tick(12)}
 rounds=turn;observe(turn);
 if(turn%25===0)console.log('CAMPAIGN_TURN',turn,'wall_seconds',round((Date.now()-started)/1000),
  JSON.stringify([0,1,2,3].map(t=>{const a=snap(t);return {t,age:a.age,cities:a.cities,pop:a.pop,techs:a.techs,active:a.active,wait:a.wait,deficit:a.deficit}})));
 if(s.ages.every(age=>age>=6))break;
}
const final=[0,1,2,3].map(snap),modern=final.filter(x=>x.age>=6).length;
const data={schema:'v124-campaign-1',seed,version:'V123',simulation:{timestep:12,stepsPerTurn:5,rounds,cap:limit,autoPlayer:true,technologyCheats:false,allModern:modern===4,modern,elapsedWallSeconds:round((Date.now()-started)/1000),headlessBattleEncounterSupport:false},final,eras,cityFoundings,trades,research,wars,samples,errors};
fs.writeFileSync(dir+'/campaign.json',JSON.stringify(data,null,2));
let md=['# Kuningriigid V124 — testmäng viimase ajastuni','','## Metoodika','',
 'V123 reaalne majandus-, rajaleidmis- ja uurimismootor, seeme '+seed+', neli riiki. Riiki 0 juhib samasugune vajadustel põhinev AI nagu ülejäänuid. 1 käik = 60 mängusekundit, simuleeritud 5 × 12 sekundit. Tehnoloogiaid, ajastuid ja materjale ei kingitud.','','## Tulemus','',
 'Läbitud käike: **'+rounds+'**. Moodsa ajastu saavutanud riike: **'+modern+'/4**. Kõik viimases ajastus: **'+(modern===4?'jah':'ei')+'**.',
 '','## Ajastute kronoloogia (käigunumber)','','| Riik | Kiviaeg | Pronks | Raud | Keskaeg | Renessanss | Tööstus | Moodne |','|---|---:|---:|---:|---:|---:|---:|---:|'];
for(const team of [0,1,2,3])md.push('| '+(FACTION_NAMES[team]||team)+' (#'+team+') | 0 | '+[1,2,3,4,5,6].map(age=>eras.find(e=>e.team===team&&e.age===age)?.turn||'—').join(' | ')+' |');
md.push('','## Lõppseis','','| Riik | Ajastu | Linnad | Elanikud | Uuritud | Teadus/min | Valmis hooneid | Üksusi |','|---|---:|---:|---:|---:|---:|---:|---:|');
for(const v of final)md.push('| '+(FACTION_NAMES[v.team]||v.team)+' | '+v.age+' | '+v.cities+' | '+v.pop+' | '+v.techs+' | '+v.rate+' | '+v.buildings+' | '+v.units+' |');
md.push('','## Majandus ja ummikud');
for(const v of final)md.push('','### '+(FACTION_NAMES[v.team]||v.team)+' — '+(ERA_NAMES[v.age]||v.age),
 '- Järgmine avastus: '+(v.active?TECHS[v.active]?.name||v.active:'puudub')+'; ajastu-ootus: '+(v.wait||'puudub'),
 '- Ajastuvahetuseks puudu: '+(Object.entries(v.deficit).map(([k,n])=>k+' '+round(n)).join(', ')||'mitte midagi'),
 '- Toit: '+v.food+'; ehitusi pooleli: '+v.unfinished,
 '- Varud: '+Object.entries(v.supplies).map(([k,n])=>k+' '+n).join(', '));
md.push('','## Linnad, kaubandus, teadus ja sõjad','',
 '- Rajatud linnu: '+cityFoundings.length,
 '- Tuvastatud kaubaveoseid: '+trades.length,
 '- Uurimissündmusi: '+research.length,
 '- Sõjaoleku sündmusi: '+wars.length,
 '','Detailne kronoloogia ja kõik iga 5 käigu andmed on failis campaign.json.',
 '','## Olulised piirangud','',
 'See on kiirendatud AI-test, mitte inimese otsustega mäng; 12-sekundiline simulatsioonisamm erineb tavapärasest kaadrisammust. Brauseri lahingu-kokkupõrkekontroll ei ole Civilization.tick osa. Kümme taasesitatavat lahingut on eraldi kontrollitud katsestsenaariumid; neid ei nimetata kampaanias loomulikult peetud lahinguteks.');
fs.writeFileSync(dir+'/CAMPAIGN_REPORT.md',md.join('\n')+'\n');
console.log('CAMPAIGN_RESULT',JSON.stringify({rounds,modern,cities:cityFoundings.length,trades:trades.length,research:research.length,events:eras.length,final:final.map(x=>({team:x.team,age:x.age,cities:x.cities,pop:x.pop,techs:x.techs,active:x.active,wait:x.wait,deficit:x.deficit}))}));
