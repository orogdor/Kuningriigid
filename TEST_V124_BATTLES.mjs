// Exact replay fixtures and measured auto-vs-auto combat outcomes.
// Each *.json is an importable V4 game snapshot taken BEFORE combat begins.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {Civilization,TROOPS} from './civilization-core.js?v=123a';
import {createV124ReplayState,BATTLE_SPECS_V124} from './battle-replays-v124.js';
import {battleManCount,tickIndividualBattle} from './individual-battle-v91.js?v=117a';
const dir='artifacts-v124';fs.mkdirSync(dir,{recursive:true});
const reports=[],failures=[],begin=Date.now();
const tests=BATTLE_SPECS_V124.filter(x=>Number(process.env.V124_BATTLES||10)>=x.id);
for(const spec of tests){
 const when=Date.now();
 try{
  const state=createV124ReplayState(spec.id),game=new Civilization(state),b=state.battle;
  const initial=JSON.stringify(state),sha=crypto.createHash('sha256').update(initial).digest('hex');
  const soldiers=[0,1].map(team=>battleManCount(b,team));
  const kinds=[0,1].map(team=>Object.entries(b.squads.filter(u=>!u.reserve&&u.team===team).reduce((acc,u)=>(acc[u.kind]=(acc[u.kind]||0)+1,acc),{})));
  fs.writeFileSync(dir+'/battle-'+String(spec.id).padStart(2,'0')+'.json',initial+'\n');
  const nav=game.battleNavigation(b),initialHP=Object.fromEntries([0,1].map(team=>[team,b.squads.filter(u=>!u.reserve&&u.team===team).reduce((n,u)=>n+u.hp,0)]));
  const maxTime=Number(process.env.V124_FIGHT_SECONDS||90);
  const dt=.2;let steps=0;let peakProjectiles=0;
  while(!b.result&&b.elapsed<maxTime){
   tickIndividualBattle(b,dt,TROOPS,spec.age>=2?1:0,nav);
   steps++;
   peakProjectiles=Math.max(peakProjectiles,b.rockShots?.length||0);
  }
  const survivors=[0,1].map(team=>battleManCount(b,team)),casualties=[0,1].map(team=>soldiers[team]-survivors[team]);
  const result={id:spec.id,title:spec.title,age:spec.age,seed:spec.seed,location:b.cell,sha256:sha,
   armyUnits:[0,1].map(team=>b.squads.filter(u=>u.team===team&&!u.reserve).length),
   initialMen:soldiers,totalMen:soldiers[0]+soldiers[1],unitTypes:kinds,initialHP,
   remainingMen:survivors,casualties,winnerTeam:b.winnerTeam??null,outcome:b.result||'unresolved at '+maxTime+' seconds',battleSeconds:Math.round(b.elapsed*10)/10,steps,wallMs:Date.now()-when,reserveMen:b.reserveMen||0,
   siegeBreached:!!b.siegeBreached,projectilesPeak:peakProjectiles};
  reports.push(result);console.log('V124_BATTLE_RESULT',JSON.stringify(result));
 }catch(e){const problem={id:spec.id,title:spec.title,error:String(e),stack:e.stack?.slice(0,1300)};failures.push(problem);console.error('V124_BATTLE_ERROR',JSON.stringify(problem))}
}
const ordered=[...reports].sort((a,b)=>b.totalMen-a.totalMen||a.id-b.id);
const json={schema:'v124-battle-report-1',engine:'V123 combat',timeStep:.2,maxFightSeconds:Number(process.env.V124_FIGHT_SECONDS||90),rankedBy:'active individual combatants',methodology:'separate generated combat stress trials; not natural encounters in the campaign',ranked:ordered,failures,wallSeconds:(Date.now()-begin)/1000};
fs.writeFileSync(dir+'/TOP10_BATTLES.json',JSON.stringify(json,null,2));
const md=['# Kuningriigid V124 — kümme suurimat eraldi testlahingut','','## Mida tähendab 1:1?','','Iga stsenaariumi algseis (maastiku seeme, kaardiruut, üksuste tüübid ja arv, kogemustase, kvaliteet, iga üksiksõduri koordinaadid, laskemoon ja HP) on salvestatud mängu V4 JSON-ina. Sama stardi avab ka otselink. Mängija valikute tõttu võivad tulemused simulatsiooni omast erineda.','',
 '**Täpsustus:** need on eraldi loodud sõjalised koormustestid, mitte loomulikult toimunud kampaanialahingud. Tulemused põhinevad mängu tegelikul üksiksõdurite võitlusmootoril.','','## Top 10 suuruse järgi','','| # | Lahing | Ajastu | Võitlejaid | Väed 0 : 1 | Kaotused 0 : 1 | Tulemus | Sim. sek |','|---|---|---:|---:|---:|---:|---|---:|'];
for(let i=0;i<ordered.length;i++){const x=ordered[i];md.push('| '+(i+1)+' | '+x.title+' | '+x.age+' | '+x.totalMen+' | '+x.initialMen.join(' : ')+' | '+x.casualties.join(' : ')+' | '+x.outcome+' | '+x.battleSeconds+' |')}
md.push('','## Iga lahingu algseis ja taasesitus');
for(const x of ordered){md.push('','### '+x.title+' (#'+x.id+')','- Mängu otselink: https://orogdor.github.io/Kuningriigid/?v=124-20261023&demo=v124-'+x.id,
 '- Täpne salvestus: battle-'+String(x.id).padStart(2,'0')+'.json',
 '- SHA-256 algseis: '+x.sha256,
 '- Maailmaseeme '+x.seed+', kaardiruut ('+x.location.c+', '+x.location.r+'), ajastu '+x.age+'.',
 '- Lähteseisus '+x.totalMen+' aktiivset sõdurit, reservis '+x.reserveMen+'.',
 '- Riigi 0 üksused: '+x.unitTypes[0].map(([k,n])=>n+' × '+k).join(', ')+'.',
 '- Riigi 1 üksused: '+x.unitTypes[1].map(([k,n])=>n+' × '+k).join(', ')+'.',
 '- Automaatse võitluse tulemus: '+x.outcome+'; kaotused '+x.casualties.join(' vs ')+'.');
}
if(failures.length)md.push('','## Ebaõnnestunud katsed','',...failures.map(x=>'- '+x.id+': '+x.error));
md.push('','### Piirangud','', 'Lahingu replays taastavad ühe ja sama lahingu ALGSEISU. 1:1 tulemus oleks võimalik vaid sama käskude jada, ajasammu ja deterministliku simulatsiooniga. Päris mängija juhitav lahing ei ole kohustatud lõppema samal moel.');
fs.writeFileSync(dir+'/BATTLE_REPORT.md',md.join('\n')+'\n');
console.log('V124_BATTLE_SUMMARY',JSON.stringify({tested:reports.length,failed:failures.length,top:ordered.slice(0,10).map(x=>({id:x.id,total:x.totalMen,outcome:x.outcome,casualties:x.casualties}))}));
if(failures.length)process.exitCode=1;
