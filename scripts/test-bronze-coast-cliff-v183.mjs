import fs from 'node:fs';
import {Civilization} from '../civilization-core.js';
import {takeOverAI} from '../ai-takeover-v128.js';
import {isShore} from '../fishery.js';
for(const kind of ['mountain','coast']){
 const source=kind==='mountain'?'scenarios/ai-mountain-v176-start.json':'scenarios/ai-stone-v174.json';
 let state=JSON.parse(fs.readFileSync(source));
 if(kind==='coast')state=takeOverAI(state,2);
 const game=new Civilization(state), team=kind==='mountain'?1:2;
 const city=kind==='mountain'?game.s.cities[0]:game.s.cities.find(c=>c.name==='Fyrisvellir');
 let bronze=null, last=null;
 for(let i=0;i<260;i++){
  for(let j=0;j<5;j++)game.tick(12);
  const turn=Math.round(game.s.time/60),age=game.s.ages[team];
  if(age>=1&&bronze===null)bronze=turn;
  if(i%20===0){const b=game.allBuildings(city).filter(x=>x.hp>0&&x.ready&&!x.virtual);console.log(JSON.stringify({kind,turn,age,bronze,pop:city.economy.realms[team].pop,fishers:b.filter(x=>x.type==='fisher').length,knownFishing:game.s.research[team].known.includes('fishing'),coast:game.constructionArea(city).tiles.filter(t=>isShore(game,game.cell(t))).length}));}
  if(age===1&&bronze!==null&&turn-bronze>=47){last=turn;break;}
  if(age>=2)break;
 }
 if(!last){console.error('NOT REACHED',kind,bronze,game.s.ages[team]);continue;}
 const buildings=game.allBuildings(city).filter(x=>x.hp>0&&!x.virtual),realm=city.economy.realms[team];
 const info={kind,turn:last,bronzeAt:bronze,age:game.s.ages[team],pop:realm.pop,resources:realm.resources,buildings:Object.fromEntries([...new Set(buildings.map(b=>b.type))].map(type=>[type,buildings.filter(b=>b.type===type&&b.ready).length])),fishing:game.s.research[team].known.includes('fishing'),targetCityId:city.id};
 const save=takeOverAI(game.s,team);save.demo='bronze-v183-'+kind;save.bronzeTestV183=info;save.cities.sort((a,b)=>a.id===city.id?-1:b.id===city.id?1:0);
 fs.writeFileSync('scenarios/bronze-v183-'+kind+'.json',JSON.stringify(save));
 fs.writeFileSync('scenarios/bronze-v183-'+kind+'.manifest.json',JSON.stringify(info,null,2));
 const proof=new Civilization(JSON.parse(JSON.stringify(save)));proof.tick(1);
 if(proof.s.ages[0]!==1||proof.s.cities.find(c=>c.id===city.id)?.team!==0)throw Error('takeover failed');
 console.log('RESULT '+JSON.stringify(info));
}
