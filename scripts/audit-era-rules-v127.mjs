// Isolated rule fixtures, not an organic campaign. Resources/buildings are supplied
// only to exercise the actual buildRule/recruit gates at every era.
import fs from 'node:fs';
import {Civilization,createGame,AGES,BUILDINGS,BUILD_AGE,TROOPS} from '../civilization-core.js';
import {TECHS,BUILD_TECH,UNIT_TECH} from '../research.js?v=125a';
import {SHIPS} from '../naval.js?v=125b';
const base=new Civilization(createGame(12501));for(let i=0;i<8;i++){base.aiTeam(0);base.tick(12)}
const rows=[];
for(let age=0;age<=6;age++){
 const g=new Civilization(JSON.parse(JSON.stringify(base.s))),s=g.s,c=s.cities.find(c=>c.team===0);
 s.ages[0]=age;s.research[0].known=Object.keys(TECHS).filter(id=>TECHS[id].age<=age);
 c.economy.realms[0].pop=1000;for(const id of Object.keys(c.economy.realms[0].resources))c.economy.realms[0].resources[id]=100000;
 c.economy.buildings.push(...Object.keys(BUILDINGS).filter(k=>k!=='hall').map((type,i)=>({type,x:40,z:40,hp:350,team:0,ready:true})));
 const units=[],futureUnitErrors=[],futureBuildingErrors=[];
 for(const [id,d]of Object.entries(TROOPS)){
  if(SHIPS[id]||id==='militia')continue;c.training=[];
  const r=g.recruit(c,id);if(r.unit)units.push({id,name:d.name,age:d.age,technology:UNIT_TECH[id]||null});
  if(r.unit&&d.age>age)futureUnitErrors.push(id);
 }
 for(const [id,a]of Object.entries(BUILD_AGE))if(a>age&&!g.buildRule(c,id))futureBuildingErrors.push(id);
 rows.push({age,name:AGES[age].name,fixture:'Supplied resources and prerequisite buildings; this is not campaign progress',allowedRecruitment:units,futureUnitErrors,futureBuildingErrors});
}
fs.writeFileSync('reports/ai-audit-v127/era-rules.json',JSON.stringify(rows,null,2));
console.log(rows.map(r=>({age:r.name,legal:r.allowedRecruitment.map(u=>u.id),futureViolations:r.futureUnitErrors.length+r.futureBuildingErrors.length})));
