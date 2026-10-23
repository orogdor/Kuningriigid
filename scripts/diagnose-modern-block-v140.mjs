import fs from 'node:fs';
import {Civilization,TROOPS} from '../civilization-core.js';
import {readyForNextEra,allowAIResearch,combatUnit,militaryChoices} from '../ai-development-v128.js';
import {TECHS,techBlock,nextResearchForGoals} from '../research.js';
const game=new Civilization(JSON.parse(fs.readFileSync('scenarios/ai-modern-v140.checkpoint.json','utf8')));
for(const team of [1,2,3]){
 const s=game.s,r=s.research[team],units=s.units.filter(u=>u.team===team&&combatUnit(u)),latest=units.filter(u=>TROOPS[u.kind]?.age>=s.ages[team]),chosen=game.s.cities.find(c=>c.team===team);
 const gates=['civics','renaissance','industrialization','modernity'].map(id=>({id,known:r.known.includes(id),block:techBlock(r,id),researchAllowed:allowAIResearch(s,team,id,TROOPS,TECHS),missing:(TECHS[id].requires||[]).filter(x=>!r.known.includes(x))}));
 const possible=Object.keys(TECHS).filter(id=>!r.known.includes(id)&&techBlock(r,id)==='');
 const allowed=possible.filter(id=>allowAIResearch(s,team,id,TROOPS,TECHS));
 const newest=chosen?militaryChoices(game,team,chosen,TROOPS,{}):[];
 console.log('V140 BLOCK '+JSON.stringify({team,age:s.ages[team],ready:readyForNextEra(s,team,TROOPS),unitCount:units.length,currentAgeUnits:latest.length,unitKinds:units.reduce((o,u)=>(o[u.kind]=(o[u.kind]||0)+1,o),{}),gates,active:r.active,known:r.known.length,possible:possible.slice(0,25),allowed:allowed.slice(0,25),researchWish:nextResearchForGoals(r,['renaissance','industrialization','modernity']),cities:s.cities.filter(c=>c.team===team).length,firstCity:chosen?.name,training:chosen?.training,choices:newest.slice(0,8)}));
}
