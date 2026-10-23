import fs from 'node:fs';
import {Civilization} from '../civilization-core.js';
const game=new Civilization(JSON.parse(fs.readFileSync('scenarios/ai-city-v139.json')));
for(const city of game.s.cities.filter(c=>c.team===0)){
 const plan=city.defensePlanV139;
 if(!plan)continue;
 const errors={};let ok=0,near=0;
 const statuses=[];
 for(const slot of plan.slots){
  const res=game.previewBuild(city,slot.type,{...slot,plannedDefense:true});
  const reason=res.error||'OK';errors[reason]=(errors[reason]||0)+1;
  if(!res.error)ok++;
  if(statuses.length<6)statuses.push({slot:[slot.x,slot.z,slot.type],error:reason});
 }
 console.log('WALL_SITE_V139 '+JSON.stringify({name:city.name,slots:plan.slots.length,ok,errors,examples:statuses,stock:city.economy.realms[0].resources,planType:plan.slots[0]?.type,techKnown:game.s.research[0]?.known.filter(x=>x.includes('fortif')),required:game.buildingDefinitions[plan.slots[0]?.type]?.cost,buildRule:game.buildRule(city,plan.slots[0]?.type)}));
}
