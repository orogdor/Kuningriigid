import {GOODS} from './city-needs-v87.js';
// Era transitions are paid by the civilisation as a whole. Food is a shared
// strategic supply: bread, flour and grain contribute different nutrition.
// V88: every era material price is exactly half the original V87 amount.
// Material payments are atomic; partial payments are never deducted.
export const ERA_TECHS={bronze:1,iron:2,civics:3,renaissance:4,industrialization:5,modernity:6};
export const ERA_MATERIALS={
 bronze:{wood:45,stone:35,bread:17.5},
 iron:{plank:50,stone:50,bread:30},
 civics:{iron:20,plank:75,bread:50},
 renaissance:{iron:35,plank:85},
 industrialization:{iron:50,plank:95,gunpowder:12.5},
 modernity:{steel:35,machines:17.5}
};
export const FOOD_EQUIVALENCE={bread:1,flour:.85,grain:.70,...Object.fromEntries(Object.entries(GOODS).filter(([k,d])=>d.food).map(([k])=>[k,1]))};
const cityStocks=(state,team)=>state.cities.filter(c=>c.team===team).map(c=>c.economy.realms[team].resources);
export function edibleSupply(stock){return Object.entries({...FOOD_EQUIVALENCE,...Object.fromEntries(Object.entries(GOODS).filter(([k,d])=>d.food).map(([k])=>[k,1]))}).reduce((n,[k,v])=>n+Math.max(0,stock[k]||0)*v,0)}
export function ageDeficit(state,team,id){
 const cost=ERA_MATERIALS[id];if(!cost)return {};
 const stocks=cityStocks(state,team);
 return Object.fromEntries(Object.entries(cost).map(([k,n])=>[k,Math.max(0,n-stocks.reduce((sum,stock)=>sum+(k==='bread'?edibleSupply(stock):(stock[k]||0)),0))]).filter(([,n])=>n>1e-6));
}
export function payEraCost(state,team,id){
 const missing=ageDeficit(state,team,id);if(Object.keys(missing).length)return {paid:false,missing};
 const stocks=cityStocks(state,team);
 for(const [key,amount] of Object.entries(ERA_MATERIALS[id]||{})){
  let left=amount;
  const sources=key==='bread'?Object.entries(FOOD_EQUIVALENCE):[[key,1]];
  for(const [resource,nutrition] of sources){
   for(const stock of stocks){
    const used=Math.min(Math.max(0,stock[resource]||0),left/nutrition);
    stock[resource]=Math.max(0,(stock[resource]||0)-used);
    left-=used*nutrition;
    if(left<1e-6)break;
   }
   if(left<1e-6)break;
  }
  if(left>1e-5)throw new Error('Era payment changed during atomic deduction: '+id+'/'+key);
 }
 return {paid:true,missing:{}};
}
