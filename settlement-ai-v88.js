import {GOOD_BUILDINGS} from './city-needs-v87.js';
import {isShore} from './fishery.js';
import {MINERAL_BUILDINGS,mineralSite} from './resource-sites-v88.js';
export const RESOURCE_BUILDINGS={wood:'lumber',stone:'quarry',ore:'mine',copper:'coppermine',tin:'tinmine',clay:'claypit',oil:'oilwell',water:'well',grain:'farm',game:'hunter',fish:'fisher',...Object.fromEntries(Object.entries(GOOD_BUILDINGS).filter(([,d])=>d.deposit).map(([k,d])=>[d.deposit,k]))};
const ageFor={wood:0,stone:0,water:0,grain:0,game:0,fish:0,clay:0,copper:1,tin:1,ore:1,oil:5};
const weight={wood:22,stone:22,water:28,grain:30,game:14,fish:12,clay:16,copper:30,tin:30,ore:60,oil:100};
export function nationalResourceNeeds(game,team){
 const age=game.s.ages[team],towns=game.s.cities.filter(c=>c.team===team),contexts=towns.flatMap(c=>game.contexts(c));
 const wanted=Object.keys(RESOURCE_BUILDINGS).filter(k=>(ageFor[k]??GOOD_BUILDINGS[RESOURCE_BUILDINGS[k]]?.age??0)<=age);
 return wanted.filter(kind=>!contexts.some(ctx=>{
  if(kind==='fish')return isShore(game,game.cell(ctx));
  if(!game.cell(ctx)?.deposits?.[kind])return false;
  const type=RESOURCE_BUILDINGS[kind];
  if(MINERAL_BUILDINGS[type]&&ctx.world)return !!mineralSite(ctx.world,type);
  return true;
 }));
}
export function settlementResourceScore(game,team,cell,missing=nationalResourceNeeds(game,team)){
 return missing.reduce((sum,k)=>sum+((k==='fish'?isShore(game,cell):cell.deposits[k])?(weight[k]||18):0),0);
}
export function specializeNewCity(game,city,missing){
 const cell=game.cell(city),resources=missing.filter(k=>k==='fish'?isShore(game,cell):cell.deposits[k]);
 resources.sort((a,b)=>(weight[b]||18)-(weight[a]||18));
 city.resourceSpecialization=resources;
 // Specialist towns can trade complementary goods instead of all constructing
 // the same industries. A role is derived from actual deposits/coast.
 const terrain=game.cell(city),d=terrain?.deposits||{},water=isShore(game,terrain);
 city.economicRole=d.oil?'energy':d.ore||d.coal?'industry':
   d.grain||d.game?'food':water?'port':d.wood?'timber':'trade';
 // Existing national merchants carry the actual goods; import requests do
 // not credit a destination until its caravan physically arrives.
 for(const other of game.s.cities.filter(c=>c.team===city.team&&c.id!==city.id)){
  other.importRequests??={};
  for(const resource of resources)if(['stone','ore','copper','tin','clay','oil'].includes(resource))other.importRequests[resource]=Math.max(other.importRequests[resource]||0,16);
 }
}
