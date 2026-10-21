import fs from 'node:fs';
import {gzipSync} from 'node:zlib';
import {BUILDINGS} from './economy.js';
import {TECHS,ERA_NAMES} from './research.js';
import {researchCost} from './science.js';
import {ERA_MATERIALS,ageDeficit} from './era-economy.js';
const turn=time=>+(time/60).toFixed(4);
const clean=value=>JSON.parse(JSON.stringify(value,(_,v)=>typeof v==='number'&&Number.isFinite(v)?+v.toFixed(6):v));
export class CampaignLog{
 constructor(game,prefix,revision){
  this.g=game;this.prefix=prefix;this.events=[];this.counts={};this.fd=fs.openSync(prefix+'.jsonl','w');
  this.cities=new Set();this.buildings=new Map();this.active=[];this.waits=new Map();this.waitHistory=[];this.completed=[0,0,0,0];this.shipments=new Map();
  this.event('configuration',{revision,seed:game.s.seed,stepSeconds:.5,aiPlanSeconds:12,deadlineTurns:100,targetAge:3,eraCosts:ERA_MATERIALS,stockGrants:false});
 }
 write(record){fs.writeSync(this.fd,JSON.stringify(clean(record))+'\n');}
 event(kind,data){const event={turn:turn(this.g.s.time),kind,...clean(data)};this.events.push(event);this.counts[kind]=(this.counts[kind]||0)+1;this.write(event);}
 observe(){
  const g=this.g;
  for(let team=0;team<4;team++){
   const r=g.s.research[team];
   for(const item of r.completed.slice(this.completed[team]))this.event('research_completed',{team,id:item.id,name:TECHS[item.id].name,completedTurn:turn(item.time)});
   this.completed[team]=r.completed.length;
   if(r.active!==this.active[team]){if(r.active)this.event('research_started',{team,id:r.active,name:TECHS[r.active].name,progress:r.progress[r.active]||0,cost:researchCost(g.s,TECHS[r.active])});this.active[team]=r.active;}
   const wait=r.ageWait?.id,previous=this.waits.get(team);
   if(previous&&previous.id!==wait){const entry={...previous,team,endTurn:turn(g.s.time),duration:turn(g.s.time-previous.time)};this.waitHistory.push(entry);this.event('era_material_wait_ended',entry);this.waits.delete(team);}
   if(wait&&!this.waits.has(team)){const entry={id:wait,time:g.s.time,startTurn:turn(g.s.time),missing:r.ageWait.missing};this.waits.set(team,clean(entry));this.event('era_material_wait_started',{team,...entry});}
  }
  for(const city of g.s.cities){
   if(!this.cities.has(city.id)){this.cities.add(city.id);this.event('city_founded',{team:city.team,id:city.id,name:city.name,c:city.c,r:city.r,specialization:city.resourceSpecialization});}
   for(const ctx of g.contexts(city))for(const [i,b] of ctx.economy.buildings.entries()){
    const key=city.id+':'+ctx.c+','+ctx.r+':'+i,prev=this.buildings.get(key);
    const detail={team:city.team,city:city.id,context:{c:ctx.c,r:ctx.r},index:i,type:b.type,x:b.x,z:b.z};
    if(!prev)this.event('building_placed',{...detail,ready:!!b.ready});
    else if(b.ready&&!prev.ready)this.event('building_completed',detail);
    else if(b.hp<=0&&prev.hp>0)this.event('building_destroyed',detail);
    this.buildings.set(key,{ready:b.ready,hp:b.hp});
   }
  }
  const current=new Map(g.s.shipments.map(s=>[s.id,s]));
  for(const [id,s] of current)if(!this.shipments.has(id)){
   this.event('trade_departed',{id,team:s.team,from:s.from,to:s.to,fromTeam:g.s.cities.find(c=>c.id===s.from)?.team,toTeam:g.s.cities.find(c=>c.id===s.to)?.team,goods:s.goods,fees:s.fees,legs:s.legs?.map(l=>({mode:l.mode,stop:l.stop,pathLength:l.path.length}))});
  }
  for(const [id,old] of this.shipments){
   const s=current.get(id)||old.ref,fees=(s.fees||[]).slice(old.feeCount),feeTotals={};
   for(const fee of fees){this.event('trade_fee',{id,...fee});for(const[k,n]of Object.entries(fee.goods))feeTotals[k]=(feeTotals[k]||0)+n;}
   const delivered={};for(const[k,n]of Object.entries(old.goods)){const delta=n-(s.goods[k]||0)-(feeTotals[k]||0);if(delta>1e-6)delivered[k]=delta;}
   if(Object.keys(delivered).length)this.event('trade_delivered',{id,team:s.team,from:s.from,to:s.to,goods:delivered});
   if(!current.has(id))this.event(Object.keys(s.goods).length?'trade_removed':'trade_finished',{id,remaining:s.goods});
   else if(s.status!==old.status)this.event('trade_status',{id,status:s.status,blocked:s.blocked});
  }
  this.shipments=new Map([...current].map(([id,s])=>[id,{ref:s,goods:{...s.goods},feeCount:s.fees?.length||0,status:s.status}]));
 }
 nations(entered){const g=this.g;return [0,1,2,3].map(team=>{
  const r=g.s.research[team],next=['bronze','iron','civics'][g.s.ages[team]];
  return {team,age:ERA_NAMES[g.s.ages[team]],turnsInAge:turn(g.s.time-entered[team]),research:r.active,researchName:TECHS[r.active]?.name,
   progress:r.progress[r.active]||0,cost:r.active?researchCost(g.s,TECHS[r.active]):0,science:r.rate,known:r.known,
   ageWait:r.ageWait,eraDeficit:next?ageDeficit(g.s,team,next):{},nextEraTech:next,
   cities:g.s.cities.filter(c=>c.team===team).map(c=>({id:c.id,name:c.name,pop:c.economy.realms[team].pop,stock:c.economy.realms[team].resources,
    specialization:c.resourceSpecialization,imports:c.importRequests,basicAssigned:c.basicAssigned,laborBudget:c.laborBudget,buildersAssigned:c.buildersAssigned,builderCount:c.builderCount,builderAgents:c.builderAgents,
    contexts:g.contexts(c).map(ctx=>({c:ctx.c,r:ctx.r,localTime:ctx.economy.time,
     deliveries:ctx.economy.realms[team].deliveryHistory,cargo:ctx.economy.cargo,
     storage:Object.fromEntries(['wood','plank','stone','iron','bread','grain','meat'].map(k=>[k,{cap:g.storageCap(ctx,k),used:g.storageUsed(ctx,k,c.economy.realms[team].resources)}])),
     buildings:ctx.economy.buildings.map(b=>({type:b.type,ready:b.ready,hp:b.hp,disabled:b.disabled,progress:b.progress,timer:b.timer,assigned:b.assigned,efficiency:b.efficiency,status:b.status,input:BUILDINGS[b.type]?.input,out:BUILDINGS[b.type]?.out,workerLimit:b.workerLimit})),
     deposits:ctx.world.resources.filter(d=>d.depositSite).map(d=>({kind:d.kind,amount:d.amount,removed:d.removed})),
     workers:ctx.world.workers
    }))})),
   shipments:g.s.shipments.filter(s=>s.team===team).map(s=>({id:s.id,from:s.from,to:s.to,goods:s.goods,fees:s.fees,status:s.status,c:s.c,r:s.r,blocked:s.blocked,pathLength:s.path?.length}))};
 });}
 snapshot(entered){const nations=this.nations(entered);this.write({turn:turn(this.g.s.time),kind:'turn_snapshot',nations});return nations;}
 finish(report){
  for(const [team,w]of this.waits)this.waitHistory.push({...w,team,endTurn:report.stopTurn,duration:turn(this.g.s.time-w.time),ongoing:true});
  this.event('test_stopped',{outcome:report.outcome,failed:report.failed});
  const full=clean({...report,eventCounts:this.counts,materialWaits:this.waitHistory,events:this.events});
  fs.writeFileSync(this.prefix+'.json',JSON.stringify(full,null,2)+'\n');fs.closeSync(this.fd);
  fs.writeFileSync(this.prefix+'.jsonl.gz',gzipSync(fs.readFileSync(this.prefix+'.jsonl')));fs.unlinkSync(this.prefix+'.jsonl');
  const lines=['# V88 uus kampaaniatest – ajastuvahetus poole odavam','',`Seeme: ${report.seed}. Koodi revisjon: ${report.revision}. Üks käik = 60 mängusekundit.`,
   'Kõiki nelja riiki juhib AI sama 12-sekundilise planeerimissammuga; simulatsioonisamm 0,5 sekundit. Tavalised raskusastme kordajad säilivad. Materjale ega teadust juurde ei anta.',
   '',`**${report.outcome}**, peatumine käigul **${report.stopTurn}**.`,report.failed.length?`100 käigu piir täitus riigil: ${report.failed.map(t=>t+1).join(', ')}. Katse peatati kohe.`:'Kõik riigid jõudsid keskaega; katse peatati kohe.',
   '','## Ajastuvahetused','','| Riik | Ajastu | Mängu käik | Eelmises ajastus käike |','|---|---|---:|---:|',
   ...report.transitions.map(t=>`| ${t.team+1} | ${ERA_NAMES[t.to]} | ${t.turn} | ${t.duration} |`),
   '','## Peatumise seis','','| Riik | Ajastu | Käike ajastus | Uurimine | Teadus / hind | Linnu |','|---|---|---:|---|---:|---:|',
   ...report.nations.map(n=>`| ${n.team+1} | ${n.age} | ${n.turnsInAge} | ${n.researchName||'—'} | ${n.progress.toFixed(2)} / ${n.cost.toFixed(2)} | ${n.cities.length} |`),
   '','## Materjaliootused','','| Riik | Tehnoloogia | Oote algus | Oote lõpp | Oodatud käike | Pooleli |','|---|---|---:|---:|---:|---|',
   ...this.waitHistory.map(w=>`| ${w.team+1} | ${TECHS[w.id].name} | ${w.startTurn} | ${w.endTurn} | ${w.duration} | ${w.ongoing?'jah':'ei'} |`),
   '','## Uurimiste kronoloogia','','| Riik | Käik | Avastatud tehnoloogia |','|---|---:|---|',
   ...this.events.filter(e=>e.kind==='research_completed').map(e=>`| ${e.team+1} | ${e.completedTurn} | ${e.name} |`),
   '','## Linnade rajamine','',...this.events.filter(e=>e.kind==='city_founded').map(e=>`- Käik ${e.turn}: riik ${e.team+1}, ${e.name}, ruut (${e.c}, ${e.r}), eriala ${JSON.stringify(e.specialization||null)}.`),
   '','## Tegelikult kohale toimetatud kaubad','','| Käik | Saatja linn → saaja linn | Kaup ja kogus |','|---:|---|---|',
   ...this.events.filter(e=>e.kind==='trade_delivered').map(e=>`| ${e.turn} | ${this.g.s.cities.find(c=>c.id===e.from)?.name||e.from} → ${this.g.s.cities.find(c=>c.id===e.to)?.name||e.to} | ${JSON.stringify(e.goods)} |`),
   '','## Peatumise diagnostika','',...report.nations.flatMap(n=>[`### Riik ${n.team+1}`,'',`Järgmise ajastu materjalide puudujääk: ${JSON.stringify(n.eraDeficit)}. Teadust käigus: ${n.science.toFixed(2)}.`,
    ...n.cities.flatMap(c=>[`- ${c.name}: elanikke ${c.pop.toFixed(2)}; varud ${JSON.stringify(c.stock)}.`,...c.contexts.flatMap(ctx=>ctx.buildings.filter(b=>['saw','quarry','mine','farm','hunter','fisher','smelter'].includes(b.type)).map(b=>`  - (${ctx.c}, ${ctx.r}) ${b.type}: valmis=${b.ready}, töötajaid=${b.assigned||0}, olek=${b.status}.`))]),'']),
   '','## Logi sisu','',`Sündmused: ${JSON.stringify(this.counts)}.`,
   'JSON-aruanne sisaldab sündmusi, materjaliootusi ja lõppseisu. JSONL.GZ sisaldab lisaks iga käigu kõigi linnade ja piirkondade seisu: tööjõud, hoonete valmidus ja olekud, sisendid, lao kasutus ja piir, kohalikud veosed, töötajad, maardlate jäägid, tarnete ajalugu ning linnadevahelised veosed. Kohalike tarnete ajalugu sisaldab ka kaubaveoga saabunut; see ei ole puhta tootmise mõõdik. Kaupmehe tarne kogus arvutatakse koorma vähenemisest pärast eraldi peatumistasude mahaarvamist.',
   'Katse oli kampaanialoogika simulatsioon, mitte brauseri visuaalne kontroll. Keskaega jõudnud riikide teadus pannakse ootele. Pärast stopptingimust katset ei jätkata ega korrata.',''];
  fs.writeFileSync(this.prefix+'.md',lines.join('\n'));return full;
 }
}
