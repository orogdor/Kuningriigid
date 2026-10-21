import {canAfford,spendResources} from './economy.js';
import {atWar} from './diplomacy-v87.js';
import {tempoMultiplier} from './tempo.js';
import {COLS,ROWS} from './campaign.js';
import {armyUnits,activeArmies} from './v51-systems.js';
export const SHIPS={transport:{name:'Transpordilaev',time:45,cost:{wood:70,plank:30,bread:10},hp:180,damage:2,capacity:6},warship:{name:'Sõjalaev',time:60,cost:{wood:90,plank:45,stone:20,bread:15},hp:280,damage:18,capacity:0}};
const near=(a,b)=>Math.max(Math.abs(a.c-b.c),Math.abs(a.r-b.r))<=1;
export function seaDistances(game){if(game.seaDistance)return game.seaDistance;const d=new Uint16Array(game.cells.length);d.fill(65535);const q=[];for(const p of game.cells)if(p.land){const k=p.r*COLS+p.c;d[k]=0;q.push(k)}for(let i=0;i<q.length;i++){const k=q[i],c=k%COLS,r=Math.floor(k/COLS);for(const[dx,dz]of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){const x=c+dx,z=r+dz,n=z*COLS+x;if(x<0||x>=COLS||z<0||z>=ROWS||d[n]<=d[k]+1)continue;d[n]=d[k]+1;q.push(n)}}return game.seaDistance=d}
export function seaAllowed(game,team,p){const cell=game.cell(p);if(!cell||p.c<0||p.c>=COLS||p.r<0||p.r>=ROWS||cell.land)return false;const known=game.s.research[team].known;return known.includes('shipbuilding')&&(known.includes('ocean_sailing')||seaDistances(game)[p.r*COLS+p.c]<=(known.includes('navigation')?2:1))}
export function seaPath(game,ship,to){const key=p=>p.r*COLS+p.c,start=key(ship),goal=key(to);if(!seaAllowed(game,ship.team,to))return null;const q=[start],prev=new Map([[start,null]]);for(let i=0;i<q.length;i++){const k=q[i];if(k===goal){const path=[];let n=k;while(n!==start){path.push({c:n%COLS,r:Math.floor(n/COLS)});n=prev.get(n)}return path.reverse()}const c=k%COLS,r=Math.floor(k/COLS);for(const[dc,dr]of [[1,0],[-1,0],[0,1],[0,-1]]){const p={c:c+dc,r:r+dr},n=key(p);if(prev.has(n)||!seaAllowed(game,ship.team,p))continue;prev.set(n,k);q.push(n)}}return null}
export function harborExit(game,p){for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){const v={c:p.c+dc,r:p.r+dr};if(seaAllowed(game,p.team,v))return v}return null}
export function buildShip(game,ctx,kind){const city=game.parentCity(ctx),d=SHIPS[kind],stock=city.economy.realms[city.team].resources;if(!d)return {error:'Tundmatu laev.'};if(!game.s.research[city.team].known.includes('shipbuilding'))return {error:'Uuri laevaehitust.'};const harbor=game.contexts(city).find(c=>c.economy.buildings.some(b=>b.type==='harbor'&&b.ready&&!b.disabled)&&harborExit(game,c));if(!harbor)return {error:'Vaja valmis rannikusadamat.'};city.training??=[];if(city.training.length>=4)return {error:'Tööjärjekord on täis.'};if(!canAfford(stock,d.cost))return {error:'Laeva jaoks napib materjale.'};spendResources(stock,d.cost);const job={kind,ship:true,team:city.team,harbor:{c:harbor.c,r:harbor.r},total:d.time*tempoMultiplier(game.s),progress:0,assigned:0,efficiency:0};city.training.push(job);return {queued:job}}
export function finishShip(game,city,job){const p=harborExit(game,{...job.harbor,team:city.team});if(!p){job.status='Sadama väljapääs puudub';return false}game.s.ships??=[];game.s.nextShip??=0;game.s.ships.push({id:game.s.nextShip++,kind:job.kind,team:city.team,...p,hp:SHIPS[job.kind].hp,path:[],clock:0,cool:0,cargo:null});return true}
// V72: A transport owns a *particular* detachment, not the faction's entire army.
// Legacy saves without armyId continue to resolve to the original main army (id 0).
export const cargoArmy=(game,ship)=>ship?.cargo?.kind==='army'
  ?game.s.armies.find(a=>a.team===ship.team&&(a.id||0)===(ship.cargo.armyId||0))
  :null;
export function embark(game,ship,kind,armyId=0){
 if(ship.kind!=='transport'||ship.cargo)return 'Vaja tühja transpordilaeva.';
 if(ship.path.length)return 'Peata laev enne laadimist.';
 if(kind==='army'){
  const army=game.s.armies.find(a=>a.team===ship.team&&(a.id||0)===armyId);
  const units=army?armyUnits(game.s,army):[];
  if(!army||army.embarked!=null||!near(ship,army)||!game.cell(army)?.land||army.path.length||!units.length)
   return 'Valitud armee peab seisma laeva kõrval kaldal.';
  if(units.length>SHIPS.transport.capacity)return 'Laeva mahub kuni 6 väesalka.';
  if(game.s.battle)return 'Lõpeta esmalt lahing.';
  army.embarked=ship.id;army.path=[];army.autoExplore=!!army.autoExplore;
  ship.cargo={kind:'army',team:ship.team,armyId:army.id||0};ship.boardingLand={c:army.c,r:army.r};
  return '';
 }
 const a=game.s.settlers.find(a=>a.team===ship.team&&a.embarked==null&&near(a,ship)&&!a.path.length);
 if(!a)return 'Asunik peab seisma laeva kõrval kaldal.';
 a.embarked=ship.id;a.landed=false;a.path=[];a.localTarget=null;ship.cargo={kind:'settler',id:a.id};return '';
}
export function disembark(game,ship,p){
 if(!ship.cargo)return 'Laev on tühi.';
 if(ship.path.length||!game.cell(p)?.land||game.cell(p).mountain||!near(ship,p)||!game.canTraverse(ship.team,p))
  return 'Maabumiseks vali peatunud laeva kõrval olev ligipääsetav maismaaruut.';
 const unit=ship.cargo.kind==='army'?cargoArmy(game,ship):game.s.settlers.find(a=>a.id===ship.cargo.id);
 if(!unit)return 'Reisijat ei leitud.';
 Object.assign(unit,{c:p.c,r:p.r,path:[],embarked:null,landed:false,x:0,z:0,travelClock:0});
 ship.cargo=null;ship.landing=null;ship.targetCity=null;ship.targetKind=null;
 game.reveal?.(ship.team,p,2);
 return '';
}
export function sink(game,ship){
 const cargo=ship.cargo;
 if(cargo?.kind==='army'){
  const army=cargoArmy(game,ship);
  if(army){for(const u of armyUnits(game.s,army))u.hp=0;army.embarked=null;army.path=[];}
 }else if(cargo?.kind==='settler')
  game.s.settlers=game.s.settlers.filter(a=>a.id!==cargo.id);
 ship.cargo=null;ship.path=[];ship.hp=0;
}
export function tickShips(game,dt){
 game.s.ships??=[];
 for(const a of game.s.ships){
  if(a.hp<=0)continue;
  const level=game.upgrade?.(a.team)||0;
  if(level>(a.upgrade||0))a.hp+=(level-(a.upgrade||0))*SHIPS[a.kind].hp*.15;
  a.upgrade=level;a.maxHp=SHIPS[a.kind].hp*(1+level*.15);
  a.clock=(a.clock||0)+dt;a.cool=Math.max(0,(a.cool||0)-dt);
  // Large simulated dt must not slow the fleet down by missing travel ticks.
  let steps=0;
  while(a.clock>=3&&steps++<100){
   a.clock-=3;
   if(!a.path.length)continue;
   const next=a.path[0];
   if(seaAllowed(game,a.team,next))Object.assign(a,a.path.shift());else a.path=[];
  }
  if(a.cargo){
   const passenger=a.cargo.kind==='army'?cargoArmy(game,a):game.s.settlers.find(p=>p.id===a.cargo.id);
   if(passenger){passenger.c=a.c;passenger.r=a.r;}
  }
  const foe=game.s.ships.find(b=>atWar(game.s,b.team,a.team)&&b.hp>0&&near(a,b));
  if(foe&&a.cool===0){
   foe.hp=Math.max(0,foe.hp-SHIPS[a.kind].damage*(1+level*.2));
   a.cool=2;a.attackAt=game.s.time;foe.hitAt=game.s.time;
   if(!foe.hp)sink(game,foe);
  }
 }
}
// Choose a water route beside a land landing site. Never route through land
// or beyond the current age's nautical technology.
export function landingRoute(game,ship,target){
 // Two flood-fills replace hundreds of whole-map A* searches. The first
 // finds connected land near the fort; the second finds a navigable sea route.
 if(!game.canTraverse(ship.team,target))return null;
 const total=COLS*ROWS,key=p=>p.r*COLS+p.c;
 const reached=new Uint8Array(total),landQueue=[key(target)];reached[key(target)]=1;
 for(let i=0;i<landQueue.length;i++){
  const at=landQueue[i],c=at%COLS,r=Math.floor(at/COLS);
  for(const [dc,dr]of [[1,0],[-1,0],[0,1],[0,-1]]){
   const p={c:c+dc,r:r+dr};
   if(p.c<0||p.c>=COLS||p.r<0||p.r>=ROWS)continue;
   const n=key(p);
   if(reached[n]||!game.canTraverse(ship.team,p))continue;
   reached[n]=1;landQueue.push(n);
  }
 }
 const start=key(ship),prev=new Int32Array(total),distance=new Int32Array(total);
 prev.fill(-2);prev[start]=-1;const queue=[start];
 let best=null;
 for(let i=0;i<queue.length;i++){
  const at=queue[i],c=at%COLS,r=Math.floor(at/COLS),steps=distance[at];
  if(best&&steps>best.score)break;
  for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){
   if(!dr&&!dc)continue;
   const shore={c:c+dc,r:r+dr};
   if(shore.c<0||shore.r<0||shore.c>=COLS||shore.r>=ROWS||!reached[key(shore)])continue;
   if(Math.abs(shore.c-target.c)>8||Math.abs(shore.r-target.r)>8)continue;
   const score=steps+Math.abs(shore.c-target.c)+Math.abs(shore.r-target.r);
   if(!best||score<best.score)best={at,shore,score};
  }
  for(const [dc,dr]of [[1,0],[-1,0],[0,1],[0,-1]]){
   const p={c:c+dc,r:r+dr};
   if(p.c<0||p.c>=COLS||p.r<0||p.r>=ROWS)continue;
   const n=key(p);
   if(prev[n]!==-2||!seaAllowed(game,ship.team,p))continue;
   prev[n]=at;distance[n]=steps+1;queue.push(n);
  }
 }
 if(!best)return null;
 const path=[];for(let k=best.at;k!==start;k=prev[k])path.push({c:k%COLS,r:Math.floor(k/COLS)});
 path.reverse();
 return {shore:best.shore,water:{c:best.at%COLS,r:Math.floor(best.at/COLS)},path,score:best.score};
}
// Move a ship into uncharted water; discovery is generated by the normal vision
// system, not by reading the hidden opposing faction coordinates.
export function seaExplorePath(game,ship){
 const key=p=>p.r*COLS+p.c,origin=key(ship),queue=[origin],prev=new Int32Array(COLS*ROWS);
 prev.fill(-2);prev[origin]=-1;
 for(let i=0;i<queue.length;i++){
  const pos=queue[i],c=pos%COLS,r=Math.floor(pos/COLS);
  if(pos!==origin&&!game.seen(ship.team,{c,r})){
   const path=[];for(let k=pos;k!==origin;k=prev[k])path.push({c:k%COLS,r:Math.floor(k/COLS)});
   return path.reverse();
  }
  for(const [dc,dr] of [[1,0],[-1,0],[0,1],[0,-1]]){
   const p={c:c+dc,r:r+dr};
   if(p.c<0||p.c>=COLS||p.r<0||p.r>=ROWS)continue;
   const n=key(p);
   if(prev[n]!==-2||!seaAllowed(game,ship.team,p))continue;
   prev[n]=pos;queue.push(n);
  }
 }
 return null;
}
export function navyExpedition(game,ship,army,target=null){
 if(ship.path.length)return false;
 if(ship.cargo){
  if(ship.landing){
   const landing={...ship.landing},objective=(ship.targetKind==='settler'?game.s.settlers:game.s.cities).find(c=>c.id===ship.targetCity)||target;
   const e=disembark(game,ship,landing);
   if(!e&&army){
    if(objective&&objective.team!==army.team)army.path=game.landPath(army,objective,army.team)||[];
   }
   return !e;
  }
  const possibilities=(target?[target]:[...game.s.cities,...game.s.settlers].filter(c=>atWar(game.s,c.team,ship.team)&&game.seen(ship.team,c)))
    .filter(c=>c?.team!==ship.team);
  let best=null;
  for(const c of possibilities){
   const route=landingRoute(game,ship,c);
   if(route&&(!best||route.score<best.route.score))best={city:c,route};
  }
  if(best){
   ship.path=best.route.path;ship.landing=best.route.shore;ship.targetCity=best.city.id;ship.targetKind=game.s.cities.includes(best.city)?'city':'settler';
   return true;
  }
  // Put scouts ashore on a genuinely disconnected landmass rather than
  // demanding that they chart every water square in the world first.
  if(army&&armyUnits(game.s,army).some(u=>u.kind==='scout')&&ship.boardingLand){
   for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){
    const shore={c:ship.c+dc,r:ship.r+dr};
    if(!game.canTraverse(ship.team,shore))continue;
    if(game.landPath(ship.boardingLand,shore,ship.team)!==null)continue;
    const error=disembark(game,ship,shore);
    if(!error){army.autoExplore=true;ship.autoScout=false;return true}
   }
  }
  const scout=seaExplorePath(game,ship);
  if(scout?.length){ship.path=scout;return true}
  return false;
 }
 const scout=seaExplorePath(game,ship);
 if(scout?.length){ship.path=scout;return true}
 return false;
}
// Player's auto-exploring scout can continue on other continents once a
// working transport is alongside it. The game never creates free ships.
export function autoExploreNavy(game){
 for(const army of activeArmies(game.s,0)){
  if(!army.autoExplore||army.embarked!=null||army.path?.length||!armyUnits(game.s,army).some(u=>u.kind==='scout'))continue;
  const transports=(game.s.ships||[]).filter(s=>s.team===0&&s.kind==='transport'&&s.hp>0&&!s.cargo);
  let placed=false;
  for(const ship of transports){
   if(near(ship,army)){
    const err=embark(game,ship,'army',army.id||0);
    if(!err){ship.autoScout=true;placed=true;break;}
   }else{
    // Move to a connected shore tile beside the transport.
    for(let dr=-1;dr<=1&&!placed;dr++)for(let dc=-1;dc<=1&&!placed;dc++){
     const land={c:ship.c+dc,r:ship.r+dr};
     if(!game.canTraverse(0,land))continue;
     const route=game.landPath(army,land,0);
     if(route?.length){army.path=route;placed=true;}
    }
   }
   if(placed)break;
  }
 }
 for(const ship of (game.s.ships||[]).filter(s=>s.team===0&&s.kind==='transport'&&s.hp>0&&s.cargo?.kind==='army'&&s.autoScout)){
  const army=cargoArmy(game,ship);
  if(!army?.autoExplore){ship.autoScout=false;continue}
  navyExpedition(game,ship,army);
  if(ship.cargo&&!ship.path.length&&!seaExplorePath(game,ship)){
   // Search landing zones adjacent to the last reached water.
   for(let dr=-1;dr<=1&&ship.cargo;dr++)for(let dc=-1;dc<=1&&ship.cargo;dc++){
    const site={c:ship.c+dc,r:ship.r+dr};
    if(!game.canTraverse(0,site)||game.territoryOwner(site)?.team!==undefined&&game.territoryOwner(site)?.team!==0)continue;
    if(!disembark(game,ship,site))ship.autoScout=false;
   }
  }
 }
}
export function aiNavy(game,team){
 const ships=game.s.ships||[],owned=ships.filter(a=>a.team===team&&a.hp>0);
 const cities=game.s.cities.filter(c=>c.team===team);
 // The AI must actually train ships; never spawn or grant resources.
 for(const city of cities){
  if(!game.cityReady(city,'harbor')||city.training?.some(q=>q.ship))continue;
  const kind=!owned.some(s=>s.kind==='transport')?'transport':!owned.some(s=>s.kind==='warship')?'warship':null;
  if(kind){const r=buildShip(game,city,kind);if(r.queued)break;}
 }
 for(const ship of owned){
  if(ship.kind==='warship'){
   const foe=ships.find(s=>atWar(game.s,s.team,team)&&s.hp>0&&game.seen(team,s));
   if(foe&&!ship.path.length)ship.path=seaPath(game,ship,foe)||[];
   continue;
  }
  // Split oversized detachments rather than parking transport vessels
  // forever when a faction's troop count exceeds ship capacity.
  const oversized=activeArmies(game.s,team).find(a=>a.embarked==null&&armyUnits(game.s,a).length>SHIPS.transport.capacity);
  if(oversized)game.splitArmy(oversized);
  const combat=activeArmies(game.s,team).filter(a=>a.embarked==null&&armyUnits(game.s,a).length>=2&&armyUnits(game.s,a).length<=SHIPS.transport.capacity)
    .sort((a,b)=>armyUnits(game.s,b).length-armyUnits(game.s,a).length)[0];
  const passenger=cargoArmy(game,ship);
  if(passenger||ship.cargo){navyExpedition(game,ship,passenger);continue;}
  const enemyKnown=[...game.s.cities,...game.s.settlers].some(c=>atWar(game.s,c.team,team)&&game.seen(team,c));
  if(!enemyKnown){
   // A scout must survey inland after the first landfall. Put one aboard when possible.
   const scout=activeArmies(game.s,team).find(a=>armyUnits(game.s,a).some(u=>u.kind==='scout')&&armyUnits(game.s,a).length<=SHIPS.transport.capacity);
   if(scout&&ship.path.length===0){
    if(near(scout,ship)&&scout.embarked==null){
     if(!embark(game,ship,'army',scout.id||0)){navyExpedition(game,ship,scout);continue}
    }else if(scout.embarked==null&&!scout.path.length){
     for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){
      const coast={c:ship.c+dc,r:ship.r+dr};
      if(!game.canTraverse(team,coast))continue;
      const path=game.landPath(scout,coast,team);
      if(path){scout.path=path;dr=2;break}
     }
    }
   }
   if(!ship.path.length)navyExpedition(game,ship,null);
   continue;
  }
  if(!combat||game.s.time<(game.s.aiPeaceUntil||0)||ship.path.length)continue;
  // Once contact is made at sea, return to a home harbor to collect actual troops.
  const nearby=near(combat,ship);
  if(!nearby){
   const ports=cities.flatMap(c=>game.contexts(c)).filter(c=>c.economy.buildings.some(b=>b.type==='harbor'&&b.ready&&!b.disabled));
   const candidates=ports.map(p=>{const to=harborExit(game,{...p,team});return to?seaPath(game,ship,to):null}).filter(Boolean).sort((a,b)=>a.length-b.length);
   if(candidates.length&&candidates[0].length){ship.path=candidates[0];continue}
  }
  if(near(combat,ship)){
   embark(game,ship,'army',combat.id||0);
   continue;
  }
  // Travel to a valid coastal landing position beside the ship.
  for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){
   const coast={c:ship.c+dc,r:ship.r+dr};
   if(!game.canTraverse(team,coast))continue;
   const path=game.landPath(combat,coast,team);
   if(path){combat.path=path;dr=2;break;}
  }
 }
}
