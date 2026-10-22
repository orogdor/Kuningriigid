#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import {performance} from 'node:perf_hooks';
import {execFileSync} from 'node:child_process';
import {TURNS,SECONDS_PER_TURN,STEP_SECONDS,SAVE_TURNS,TEAMS,validState,summarize,invariantErrors,pathErrors,worldRouteChecks,localPathChecks,almost} from './metrics.mjs';

function flag(name,fallback){const i=process.argv.indexOf(`--${name}`);return i<0?fallback:process.argv[i+1];}
const gameDir=path.resolve(flag('game-dir',process.cwd()));
const outDir=path.resolve(flag('output',path.join(process.cwd(),'artifacts','regression','current')));
const seed=Number(flag('seed','8417'));
const turns=Number(flag('turns',String(TURNS)));
const dt=Number(flag('step',String(STEP_SECONDS)));
if(!Number.isInteger(seed)||!Number.isInteger(turns)||turns<1||turns>2000||dt<=0||60/dt%1!==0){console.error('Vigane seed, turns või step (60/step peab olema täisarv)');process.exit(2);}
fs.mkdirSync(outDir,{recursive:true});
let revision='unknown';try{revision=execFileSync('git',['rev-parse','HEAD'],{cwd:gameDir,encoding:'utf8'}).trim();}catch{}
const report={schema:1,gameDir,revision,seed,requestedTurns:turns,completedTurns:0,stepSeconds:dt,
 startedAt:new Date().toISOString(),status:'running',finishedByVictory:false,checkpoints:[],eraTransitions:[],saves:[],pathChecks:0,worldRouteChecks:0,localPathChecks:0,
 errors:[],warnings:[],performance:{}};
function persist(){fs.writeFileSync(path.join(outDir,'report.json'),JSON.stringify(report,null,2));}
function fail(code,detail,turn=report.completedTurns){report.errors.push({code,detail:String(detail),turn});}
function warning(code,detail,turn=report.completedTurns){report.warnings.push({code,detail:String(detail),turn});}
const start=performance.now();
try{
 const engine=await import(url.pathToFileURL(path.join(gameDir,'civilization-core.js')).href);
 const saves=await import(url.pathToFileURL(path.join(gameDir,'save-safety-v73.js')).href);
 const navigation=await import(url.pathToFileURL(path.join(gameDir,'navigation.js')).href);
 if(typeof engine.Civilization!=='function'||typeof engine.createGame!=='function')throw Error('Civilization / createGame puudub');
 let game=new engine.Civilization(engine.createGame(seed));
 let ages=[...game.s.ages];
 // The normal browser player is human; give team 0 the same legal AI decisions as team 1..3.
 const ticksPerTurn=Math.round(SECONDS_PER_TURN/dt),aiEvery=Math.round(12/dt);
 const initialTime=game.s.time;
 const storage=new Map(),localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,String(v))};
 const checkpoints=new Set([1,turns]);for(let t=10;t<=turns;t+=10)checkpoints.add(t);
 const saveTurns=new Set([...SAVE_TURNS].filter(t=>t<=turns));saveTurns.add(turns);
 storage.set(saves.ACTIVE_SAVE_KEY,JSON.stringify(game.s)); // previous valid autosave for backup recovery
 const observedMovers=new Map();
 for(let turn=1;turn<=turns;turn++){
  for(let sub=0;sub<ticksPerTurn;sub++){
   const tickIdx=(turn-1)*ticksPerTurn+sub;
   if(tickIdx%aiEvery===0)game.aiTeam(0);
   game.tick(dt);
   if(game.s.winner!==null)break;
  }
  report.completedTurns=turn;
  // Check real simulation time; no artificial time advancement / resource grants.
  if(game.s.winner===null&&!almost(game.s.time,initialTime+turn*SECONDS_PER_TURN,.05))
   fail('GAME_CLOCK',`at turn ${turn}: ${game.s.time}` ,turn);
  report.errors.push(...invariantErrors(game.s,turn));
  for(const team of TEAMS)if(game.s.ages[team]!==ages[team]){
   report.eraTransitions.push({turn,team,from:ages[team],to:game.s.ages[team]});ages[team]=game.s.ages[team];
  }
  if(checkpoints.has(turn)){
   report.checkpoints.push(summarize(game.s,turn));
   const routeProblems=pathErrors(game,turn);report.pathChecks++;report.errors.push(...routeProblems);
   if(turn===1||turn===100||turn===turns){const test=worldRouteChecks(game,turn);report.worldRouteChecks+=test.checked;report.errors.push(...test.errors);}
   if(turn===100||turn===turns){const test=localPathChecks(game,navigation.door,turn);report.localPathChecks+=test.checked;report.errors.push(...test.errors);report.warnings.push(...test.warnings);}
   for(const army of [...game.s.armies,...game.s.settlers]){
    const id=`${army.team}:${army.id??'main'}:${game.s.settlers.includes(army)?'settler':'army'}`;
    const at=`${army.c}:${army.r}:${army.path?.length||0}`;
    const prior=observedMovers.get(id);
    if(army.path?.length&&prior?.position===at&&turn-prior.turn>=30)
     warning('MOVER_STALLED',`team ${army.team}, ${id}, position ${at}`,turn);
    if(!prior||prior.position!==at)observedMovers.set(id,{position:at,turn});
   }
  }
  if(saveTurns.has(turn)){
   const before=summarize(game.s,turn);
   const json=JSON.stringify(game.s);
   if(turn===100||turn===turns)fs.writeFileSync(path.join(outDir,`save-${turn}.json`),json);
   if(!validState(JSON.parse(json)))fail('SAVE_SCHEMA',`turn ${turn}`,turn);
   // Mimics browser's autosave and recovery path, including backup slot.
   saves.writeAutosave(localStorage,json,game.s.time,game.s.time-61,validState);
   const loaded=saves.loadProtectedGame(localStorage,validState);
   if(!loaded.state)fail('LOAD_FAILURE',`turn ${turn}`,turn);
   let ok=false;
   if(loaded.state){
    const recovered=new engine.Civilization(loaded.state);
    const after=summarize(recovered.s,turn);
    ok=JSON.stringify(before.teams)!==JSON.stringify(after.teams)?false:true;
    if(!ok)fail('SAVE_ROUNDTRIP_CHANGE',`team economy changed at turn ${turn}`,turn);
    if(recovered.s.time!==game.s.time)fail('SAVE_TIME',`turn ${turn}`,turn);
    game=recovered; // prove simulation can continue after a real reload
   }
   // Test corrupted active save recovers the previous valid slot.
   localStorage.setItem(saves.ACTIVE_SAVE_KEY,'{broken-json');
   const fallback=saves.loadProtectedGame(localStorage,validState);
   if(!fallback.recovered||!fallback.state)fail('BACKUP_RECOVERY',`turn ${turn}`,turn);
   localStorage.setItem(saves.ACTIVE_SAVE_KEY,json);
   report.saves.push({turn,bytes:Buffer.byteLength(json),loaded:!!loaded.state,roundTrip:ok,backupRecovered:!!fallback.state&&fallback.recovered});
  }
  if(turn===30&&TEAMS.some(team=>!game.s.cities.some(c=>c.team===team)))
   warning('CITY_NOT_FOUNDED_30',`teams without cities: ${TEAMS.filter(team=>!game.s.cities.some(c=>c.team===team))}`,turn);
  if(turn===80&&TEAMS.some(team=>game.s.ages[team]===0))
   warning('STONE_AGE_AT_80',`teams ${TEAMS.filter(team=>game.s.ages[team]===0)}`,turn);
  if(turn%20===0)console.log(`SEED ${seed} REV ${revision.slice(0,8)} TURN ${turn}/${turns} ages=${game.s.ages.join(',')} cities=${game.s.cities.length}`);
  // The browser, not Civilization.tick, is responsible for interactive battle transitions.
  if(game.s.winner!==null){report.finishedByVictory=true;warning('EARLY_WINNER',`Winner ${game.s.winner}; remaining turns not simulated`,turn);break;}
  if(report.errors.length>=100){warning('EARLY_STOP','100 errors; stopping to prevent huge report',turn);break;}
 }
 if(!report.finishedByVictory&&report.completedTurns===turns&&turns>=100){
  const end=report.checkpoints.at(-1);
  for(const team of TEAMS){
   if(end.teams[team].cities===0)fail('AI_NEVER_FOUNDED',`team ${team} has zero cities at ${turns} turns`,turns);
   if(end.teams[team].age===0)fail('AI_NO_BRONZE',`team ${team} still in Stone Age after ${turns} turns`,turns);
  }
 }
 report.status=report.errors.length?'failed':'passed';
}catch(e){fail('UNCAUGHT',e?.stack||e);report.status='failed';}
report.performance.wallSeconds=Number(((performance.now()-start)/1000).toFixed(3));
report.finishedAt=new Date().toISOString();
persist();
fs.writeFileSync(path.join(outDir,'summary.md'),[
 `# Kuningriigid regressioon: ${report.revision.slice(0,12)}`,'',
 `- Tulemus: **${report.status}**`, `- Seeme: ${seed}`,`- Käike: ${report.completedTurns}/${turns}`,
 `- Aeg: ${report.performance.wallSeconds} s`,`- Salvestuse kontrollpunkte: ${report.saves.length}`,
 `- Rajakontrolle: ${report.pathChecks} olekuskanni; ${report.worldRouteChecks} maailma marsruuti; ${report.localPathChecks} linna marsruuti`,`- Vigu: ${report.errors.length}; hoiatusi: ${report.warnings.length}`,
 '',`## Lõppseis`, '',
 '| Riik | Ajastu | Linnu | Elanikke | Valmis ehitisi | Tehnoloogiaid |',
 '|---:|---:|---:|---:|---:|---:|',
 ...(report.checkpoints.at(-1)?.teams||[]).map(t=>`| ${t.team} | ${t.age} | ${t.cities} | ${t.pop} | ${t.ready} | ${t.techCount} |`),
 '',`## Vead`,``,...(report.errors.length?report.errors.slice(0,50).map(e=>`- Käik ${e.turn}: ${e.code} — ${e.detail}`):['Vigu ei tuvastatud.']),
 '',`## Piirang`,``,
 '200 käiku kasutab päris Civilization.tick() mootorit ja kõigi nelja riigi AI-d. Brauseri 3D-graafikat ning interaktiivseid lahinguüleminekuid see test ei käivita.'
].join('\n'));
console.log(`REGRESSION_RESULT ${report.status} ${path.join(outDir,'report.json')}`);
process.exitCode=report.status==='passed'?0:1;
