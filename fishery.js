// V64: ocean-only fisheries. Range describes how far offshore a fisherman
// can operate; boats become available with later ages, not in the Stone Age.
import {COLS,ROWS} from './campaign.js';
import {seaDistances} from './naval.js';
import {door} from './navigation.js';
export const FISHING_RANGES=[1,2,4,7,11,17,28];
const offsets=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
export const fishingRange=age=>FISHING_RANGES[Math.max(0,Math.min(6,Math.floor(age||0)))];
export const fishingEraText=age=>['Rannalt püük','Madalas rannikumeres püük','Paadiga rannikumere püük','Kaugem avamerepüük','Suuremad kalapaadid','Mootoriga kalalaevad','Kauged püügiretked'][Math.max(0,Math.min(6,age||0))];
export const fishAt=(game,cell,dist)=>!cell?.land&&dist>=1&&
 // All shoreline tiles have reachable fish. Offshore schools are seeded,
 // predictable across reloads, and become scarcer farther offshore.
 (dist===1||game.noise(cell.c*7+815,cell.r*11+183)>(dist<=2?.28:dist<=5?.44:.56));
export function isShore(game,p){
 const cell=game.cell(p);return !!cell?.land&&offsets.slice(0,4).some(([dc,dr])=>!game.cell({c:p.c+dc,r:p.r+dr})?.land&&p.c+dc>=0&&p.c+dc<COLS&&p.r+dr>=0&&p.r+dr<ROWS);
}
export function initializeFisheries(game){
 game.fishDistance=seaDistances(game);
 for(const cell of game.cells){
  const key=cell.r*COLS+cell.c,dist=game.fishDistance[key];
  cell.fishDepth=dist;
  if(cell.land){cell.coast=isShore(game,cell);cell.deposits.fish=false;continue}
  cell.deposits.fish=fishAt(game,cell,dist);
  // All simulated fish are in water, including the visible detail-world meshes.
  if(cell.deposits.fish){
   const schools=dist<=2?3:dist<=5?4:5;
   for(let i=0;i<schools;i++){
    const x=(game.noise(cell.c*31+i*3+19,cell.r+815)-.5)*116;
    const z=(game.noise(cell.c*7+i*5+39,cell.r+733)-.5)*98;
    cell.detail.resources.push([4,x,z]);
   }
  }
 }
}
function stockFor(game,cell){
 game.s.fishStocks??={};
 const key=cell.c+':'+cell.r,prev=game.s.fishStocks[key];
 if(prev&&prev.until>game.s.time)return {key,amount:prev.amount};
 if(prev&&prev.until<=game.s.time)delete game.s.fishStocks[key];
 return {key,amount:96};
}
function takeFish(game,cell,count){
 const stock=stockFor(game,cell),amount=Math.min(count,stock.amount);
 game.s.fishStocks[stock.key]={amount:stock.amount-amount,until:game.s.time+(stock.amount-amount<=0?120:86400)};
 return amount;
}
// A bank is reachable from a shoreline hut only when both its distance from
// the original shore and its open-water depth fit the current fishing technology.
export function fishingBanks(game,p,age){
 if(!isShore(game,p))return [];
 const reach=fishingRange(age),banks=[],limit=Math.min(reach+1,30);
 for(let dr=-limit;dr<=limit;dr++)for(let dc=-limit;dc<=limit;dc++){
  const c=p.c+dc,r=p.r+dr,dist=Math.hypot(dc,dr);
  if(c<0||r<0||c>=COLS||r>=ROWS||dist>limit+.1)continue;
  const cell=game.cell({c,r});
  if(!cell?.deposits?.fish||cell.fishDepth>reach)continue;
  const stock=stockFor(game,cell);
  if(stock.amount<1)continue;
  banks.push({cell,dist,depth:cell.fishDepth,stock:stock.amount});
 }
 return banks.sort((a,b)=>a.dist-b.dist);
}
export function fishingHarvest(game,city,b,definition,workDt,nav,multiplier){
 const id=city.economy.buildings.indexOf(b),key='fishery:'+id,world=nav.world;
 world.workers??={};let w=world.workers[key];
 if(!w){const home=nav.nearest(door(b),15);if(!home)return 0;w=world.workers[key]={x:home.x,z:home.z,phase:'seek',team:b.team,kind:'fisher',building:key,work:0};}
 w.moving=false;w.working=false;
 const age=game.s.ages[b.team]||0;
 if(w.phase==='seek'){
  const sites=fishingBanks(game,city,age);
  if(!sites.length){b.status='Ligipääsetavaid kalu pole';w.retry=3;return 0}
  const target=sites[Math.min(sites.length-1,Math.floor(game.noise(city.c+game.s.time*.03,city.r+id)*Math.min(6,sites.length)))];
  w.catchTile={c:target.cell.c,r:target.cell.r};w.portTile={c:city.c,r:city.r};w.depth=target.depth;w.trip=age===0?0:Math.max(1,Math.ceil(target.dist*2.5));w.tripTotal=w.trip;w.work=0;w.phase='out';w.moving=true;if(age>=1)game.reveal(b.team,w.catchTile,1);
 }
 if(w.phase==='out'){b.status=age===0?'Läheb rannale':'Sõidab püügialale';w.moving=true;w.trip-=workDt;if(w.trip<=0)w.phase='work';return 0}
 if(w.phase==='work'){
  const target=game.cell(w.catchTile),stock=target&&stockFor(game,target);
  if(!target?.deposits.fish||!stock?.amount){w.phase='seek';return 0}
  w.working=true;w.action='fishing';b.status=age===0?'Püüab kaldalt':fishingEraText(age);w.work+=workDt*multiplier;
  if(w.work>=definition.cycle){w.carried=takeFish(game,target,definition.rate);w.trip=w.tripTotal||0;w.phase='return';w.work=0}
  return 0;
 }
 if(w.phase==='return'){b.status='Toob kalasaaki';w.moving=w.trip>0;w.trip-=workDt;if(w.trip<=0){const result=w.carried||0;w.carried=0;w.phase='seek';return result}return 0}
 return 0;
}
