// V140: long, real AI campaign. Stop at the *first* modern-era transition,
// without creating technologies, buildings, resources or units by fiat.
import fs from 'node:fs';
import {Civilization,createGame,AGES} from '../civilization-core.js';
import {takeOverAI} from '../ai-takeover-v128.js';
import {ageDeficit} from '../era-economy.js';
const seed=Number(process.env.MODERN_SEED||139023);
const maxTurns=Number(process.env.MODERN_MAX_TURNS||2400);
const maxMs=Number(process.env.MODERN_MAX_MS||1080000);
const started=Date.now(),maxMemory=Number(process.env.MODERN_MEM_MB||0);
const checkpointPath='scenarios/ai-modern-v140.checkpoint.json';
const existing=process.env.MODERN_RESUME==='1'&&fs.existsSync(checkpointPath);
const startState=existing?JSON.parse(fs.readFileSync(checkpointPath,'utf8')):createGame(seed);
const game=new Civilization(startState);
const began=Math.floor(game.s.time/60);
const reportPath='scenarios/ai-modern-v140.manifest.json';
const stages=existing&&fs.existsSync(reportPath)?(JSON.parse(fs.readFileSync(reportPath,'utf8')).history||[]):[];
let modern=null,stopReason=null,iteration=began,latestEvent='';
const status=turn=>{
 const teams=[0,1,2,3].map(team=>{
  const cities=game.s.cities.filter(c=>c.team===team);
  const known=game.s.research[team]?.known||[];
  const resources={};
  for(const key of ['wood','stone','plank','iron','steel','machines','water','bread']){
   resources[key]=Math.round(cities.reduce((sum,c)=>sum+(c.economy.realms[team]?.resources?.[key]||0),0));
  }
  return {team,age:game.s.ages[team],cities:cities.length,pop:cities.reduce((sum,c)=>sum+(c.economy.realms[team]?.pop||0),0),active:game.s.research[team]?.active,wait:game.s.research[team]?.ageWait?.id,known:known.length,resources};
 });
 return {turn,ages:[...game.s.ages],teams,winner:game.s.winner,seconds:Math.round((Date.now()-started)/1000)};
};
for(let turn=began+1;turn<=maxTurns;turn++){
 for(let step=0;step<5;step++){
  game.tick(12);
  const first=[1,2,3].find(team=>game.s.ages[team]>=6);
  if(first!=null){modern={team:first,turn:Math.ceil(game.s.time/60),time:game.s.time};break;}
 }
 iteration=turn;
 if(turn%40===0||modern){const s=status(turn);stages.push(s);console.log('V140 PROGRESS '+JSON.stringify(s));}
 if(modern){stopReason='first_modern';break;}
 if(game.s.winner!=null){stopReason='game_winner_before_modern';break;}
 if(Date.now()-started>maxMs){stopReason='time_limit';break;}
 if(maxMemory&&process.memoryUsage().rss/1048576>maxMemory){stopReason='memory_limit';break;}
 if(turn%200===0){fs.mkdirSync('scenarios',{recursive:true});fs.writeFileSync(checkpointPath,JSON.stringify(game.s));}
}
if(!stopReason)stopReason='turn_limit';
fs.mkdirSync('scenarios',{recursive:true});
fs.writeFileSync(checkpointPath,JSON.stringify(game.s));
const first=modern?.team??[1,2,3].sort((a,b)=>game.s.ages[b]-game.s.ages[a]||a-b)[0];
const team=game.s.cities.some(c=>c.team===first)?first:[1,2,3].find(t=>game.s.cities.some(c=>c.team===t));
const original=game.s.cities.filter(c=>c.team===team);
const taken=takeOverAI(game.s,team);
taken.demo='ai-modern-v140';
const summary={version:140,success:!!modern,reason:stopReason,seed,startTurn:began,turn:iteration,modern,sourceTeam:team,age:game.s.ages[team],ages:game.s.ages,elapsedSeconds:Math.round((Date.now()-started)/1000),
 cities:original.map(c=>({id:c.id,name:c.name,c:c.c,r:c.r,pop:c.economy.realms[team]?.pop,
  structures:game.allBuildings(c).filter(b=>b.hp>0&&!b.virtual).length,
  houses:game.allBuildings(c).filter(b=>b.type==='house'&&b.hp>0).length,
  markets:game.allBuildings(c).filter(b=>b.type==='market'&&b.hp>0).length,
  harbors:game.allBuildings(c).filter(b=>b.type==='harbor'&&b.hp>0).length,
  walls:game.allBuildings(c).filter(b=>['palisade','stonewall','reinforced_wall'].includes(b.type)&&b.hp>0).length})),
  research:game.s.research.map((r,team)=>({team,active:r.active,known:r.known.length,ageWait:r.ageWait?.id||null,missing:r.ageWait?.id?ageDeficit(game.s,team,r.ageWait.id):{}})),history:stages};
taken.aiModernTestV140={sourceTeam:team,turn:iteration,firstModern:!!modern,reason:stopReason};
const districts=new Set(taken.cities.flatMap(c=>Object.values(c.districts||{}).map(d=>d.economy)));
fs.writeFileSync('scenarios/ai-modern-v140.json',JSON.stringify(taken,function(k,v){return districts.has(this)&&['realms','resources'].includes(k)?undefined:v}));
fs.writeFileSync('scenarios/ai-modern-v140.manifest.json',JSON.stringify(summary,null,2));
console.log('V140 RESULT '+JSON.stringify({...summary,history:undefined}));
if(!modern&&process.env.MODERN_REQUIRE_SUCCESS==='1')process.exitCode=2;
