import {Civilization,createGame} from './civilization-core.js';
import {writeFileSync} from 'node:fs';
const reports=[];
for(const seed of [8417,20261020]){
 const g=new Civilization(createGame(seed)),start=Date.now(),checkpoints=[];
 for(let i=0;i<7200;i++){if(i%6===0)g.aiTeam(0);g.tick(.5);if((i+1)%1200===0)checkpoints.push({seconds:g.s.time,teams:[0,1,2,3].map(team=>({team,age:g.s.ages[team],research:g.s.research[team].active,waiting:g.s.research[team].ageWait?.missing,cities:g.s.cities.filter(c=>c.team===team).map(c=>({pop:c.economy.realms[team].pop,food:Math.round(c.economy.realms[team].resources.bread),water:Math.round(c.economy.realms[team].resources.water),shortage:!!c.economy.realms[team].housingShortage,ready:c.economy.buildings.filter(b=>b.ready&&!b.virtual).length,blocked:c.economy.buildings.filter(b=>/pole ligipääsetavat|maardla puudub/.test(b.status||'')).length,foodSources:c.economy.buildings.filter(b=>['hunter','fisher','farm','bakery'].includes(b.type)&&b.ready).length,pending:c.economy.buildings.filter(b=>!b.ready&&!b.disabled).length}))}))});}
 const report={seed,wallSeconds:(Date.now()-start)/1000,checkpoints};reports.push(report);console.log('V86 SOAK '+JSON.stringify(report));
}
writeFileSync('v86-soak.json',JSON.stringify(reports,null,2));
