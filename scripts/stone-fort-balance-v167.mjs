// V167: real, unfunded AI playthroughs to the Bronze transition.
import fs from 'node:fs';
import {Civilization,createGame} from '../civilization-core.js';
import {stoneVillageWallPlan} from '../stone-village-defenses-v166.js';
const seeds=[142023,31757,81311],out=[];
function summary(g,c,turn){
 const t=c.team,stock=c.economy.realms[t].resources,buildings=g.allBuildings(c).filter(b=>b.hp>0&&!b.virtual);
 const plan=c.stoneDefensePlanV166,slots=plan?.slots||[];
 const local=c.economy.buildings.filter(b=>b.hp>0&&!b.virtual);
 const found=slot=>local.find(b=>['palisade','woodgate','watchtower'].includes(b.type)&&
  b.type===slot.type&&Math.hypot(b.x-slot.x,b.z-slot.z)<4.5);
 const ready=slots.filter(slot=>{const b=found(slot);return b?.ready&&!b.disabled}).length;
 const placed=slots.filter(slot=>!!found(slot)).length;
 const kinds=type=>buildings.filter(b=>b.type===type);
 return {turn,name:c.name,team:t,age:g.s.ages[t],pop:c.economy.realms[t].pop,
   homes:kinds('house').filter(b=>b.ready).length,farms:kinds('farm').filter(b=>b.ready).length,
   fields:kinds('field').filter(b=>b.ready).length,wood:Math.round(stock.wood||0),
   food:Math.round((stock.bread||0)+(stock.grain||0)+(stock.meat||0)+(stock.fish||0)),
   water:Math.round(stock.water||0),planned:slots.length,placed,ready,
   completion:slots.length?Math.round(100*ready/slots.length):0,
   gates:slots.filter(s=>s.type==='woodgate'&&found(s)?.ready).length,
   towers:slots.filter(s=>s.type==='watchtower'&&found(s)?.ready).length,
   palisades:slots.filter(s=>s.type==='palisade'&&found(s)?.ready).length,
   closed:slots.length>0&&ready===slots.length,
   status:c.aiStoneDefenseStatusV166?.reason||'not-eligible'};
}
for(const seed of seeds){
 const g=new Civilization(createGame(seed)),lastStone={},atBronze={},checkpoints=[];
 const started=Date.now();
 for(let turn=1;turn<=83;turn++){
  for(let i=0;i<5;i++)g.tick(12);
  for(const team of [1,2,3]){
   const leader=g.s.cities.find(c=>c.team===team);
   if(!leader)continue;
   if(g.s.ages[team]===0)lastStone[team]=summary(g,leader,turn);
   else if(!atBronze[team])atBronze[team]=summary(g,leader,turn);
  }
  if([25,40,55,65,83].includes(turn)){
   checkpoints.push({turn,ages:g.s.ages.slice(1),
    capitals:[1,2,3].map(team=>g.s.cities.find(c=>c.team===team)).filter(Boolean).map(c=>summary(g,c,turn))});
  }
 }
 const result={seed,seconds:Math.round((Date.now()-started)/1000),lastStone,atBronze,checkpoints};
 out.push(result);
 console.log('V167 SEED',JSON.stringify({seed,seconds:result.seconds,stone:Object.values(lastStone),bronze:Object.values(atBronze)}));
}
fs.mkdirSync('artifacts-v167',{recursive:true});
fs.writeFileSync('artifacts-v167/stone-fort-balance.json',JSON.stringify(out,null,2));
const rows=out.flatMap(x=>[1,2,3].map(t=>{
 const c=x.lastStone[t];if(!c)return null;
 return `| ${x.seed} | ${t} | ${c.name} | ${c.turn} | ${c.pop} | ${c.homes} | ${c.gates} | ${c.towers} | ${c.palisades} | ${c.ready}/${c.planned} | ${c.completion}% | ${c.wood} | ${c.closed?'Jah':'Ei'} |`;
 }).filter(Boolean));
fs.writeFileSync('artifacts-v167/stone-fort-balance.md',[
 '# V167: Kiviaja päris AI kindlustamistest',
 '',
 '3 eri maailma seemet, 3 AI riiki igas maailmas, 83 käiku; algne mängumajandus ja ehitushinnad, ilma tasuta üksuste või materjalideta.',
 'Allolev rida mõõdab pealinna viimast kiviaja käiku, mitte hilisemat pronksiaega.',
 '',
 '| Seeme | Riik | Linn | Kiviaja viimane käik | Elanikud | Elumaju | Valmis väravaid | Valmis torne | Valmis palisaade | Valmis / plaanis | Valmis % | Puiduvaru | Täisring |',
 '|---:|---:|---|---:|---:|---:|---:|---:|---:|---|---:|---:|---|',
 ...rows
].join('\n')+'\n');
const cases=out.flatMap(x=>Object.values(x.lastStone));
const full=cases.filter(c=>c.closed).length;
const started=cases.filter(c=>c.ready>=1).length;
console.log('V167 RESULT',JSON.stringify({countries:cases.length,started,full,meanCompletion:Math.round(cases.reduce((s,c)=>s+c.completion,0)/cases.length),rows:rows.length}));
if(started<1)throw Error('No Stone Age town constructed any fortification');
