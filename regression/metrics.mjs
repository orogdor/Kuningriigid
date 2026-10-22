// Kuningriigid V104 economy / AI metrics and invariants. No external dependencies.
export const TURNS=200;
export const SECONDS_PER_TURN=60;
export const SAVE_TURNS=new Set([1,50,100,150,200]);
export const STEP_SECONDS=0.5;
export const TEAMS=[0,1,2,3];
export const almost=(a,b,eps=1e-6)=>Math.abs(a-b)<=eps;
export function validState(s){
 return s?.version===4 && Number.isFinite(s.seed) && ['cities','settlers','units','armies','research','ages'].every(k=>Array.isArray(s[k]));
}
export function simpleClone(x){return JSON.parse(JSON.stringify(x));}
export function cleanNumber(n){return Number((n??0).toFixed(3));}
export function cityStock(city){return city?.economy?.realms?.[city.team]?.resources||{};}
export function cityBuildings(city){return [city,...Object.values(city.districts||{})].flatMap(x=>(x.economy?.buildings||[]).filter(b=>!b.virtual));}
export function summarize(state,turn){
 const teams=TEAMS.map(team=>{
  const cities=state.cities.filter(c=>c.team===team);
  const stocks={},types={},bad=[],issues=[];
  let pop=0,ready=0,pending=0,housingShortages=0;
  for(const city of cities){
   const realm=city.economy?.realms?.[team];pop+=realm?.pop||0;
   if(realm?.housingShortage)housingShortages++;
   for(const [key,value] of Object.entries(realm?.resources||{}))stocks[key]=(stocks[key]||0)+Number(value||0);
   for(const b of cityBuildings(city)){
    types[b.type]=(types[b.type]||0)+1;
    if(b.ready)ready++;else if(b.hp>0&&!b.disabled)pending++;
    if((b.status||'').match(/pole ligipääsetavat|maardla puudub|blocked|stuck/i))issues.push({city:city.id,type:b.type,status:b.status});
   }
  }
  const research=state.research?.[team]||{};
  return {team,age:state.ages?.[team]??0,cities:cities.length,pop:cleanNumber(pop),ready,pending,housingShortages,
   techCount:(research.known||[]).length,activeResearch:research.active||null,ageWait:research.ageWait?.missing||null,
   totalTroops:state.units.filter(u=>u.team===team&&u.hp>0).length,
   armyPositions:state.armies.filter(a=>a.team===team).map(a=>[a.c,a.r]),
   stocks:Object.fromEntries(Object.entries(stocks).sort().map(([k,v])=>[k,cleanNumber(v)])),types,productionIssues:issues.slice(0,12)};
 });
 return {turn,seconds:cleanNumber(state.time),winner:state.winner,teams,
  totals:{cities:teams.reduce((n,t)=>n+t.cities,0),population:cleanNumber(teams.reduce((n,t)=>n+t.pop,0)),
  readyBuildings:teams.reduce((n,t)=>n+t.ready,0),technologies:teams.reduce((n,t)=>n+t.techCount,0),
  worldRoadEdges:Object.keys(state.worldRoads||{}).length,
  exploredCells:(state.explored||[]).reduce((n,v)=>n+Object.keys(v||{}).length,0),
  shipments:(state.shipments||[]).length}};
}
export function invariantErrors(state,turn){
 const out=[];
 const error=(code,detail)=>out.push({turn,code,detail});
 if(!validState(state)){error('INVALID_STATE','V4 mänguseisu põhiandmed puuduvad');return out;}
 if(!Number.isFinite(state.time)||state.time<0)error('INVALID_TIME',String(state.time));
 if(state.ages.length<4||state.ages.some(a=>!Number.isInteger(a)||a<0||a>6))error('INVALID_AGE',JSON.stringify(state.ages));
 for(const city of state.cities){
  if(!Number.isInteger(city.team)||city.team<0||city.team>3){error('INVALID_CITY_TEAM',String(city.team));continue;}
  const realm=city.economy?.realms?.[city.team];
  if(!realm){error('MISSING_ECONOMY',`city ${city.id}`);continue;}
  if(!Number.isFinite(realm.pop)||realm.pop<0)error('INVALID_POP',`city ${city.id}: ${realm.pop}`);
  for(const[k,v]of Object.entries(realm.resources||{}))if(typeof v!=='number'||!Number.isFinite(v)||v< -0.001)
   error('INVALID_STOCK',`city ${city.id}: ${k}=${v}`);
  for(const b of cityBuildings(city))if(!Number.isFinite(b.hp)||b.hp< -0.001)error('INVALID_BUILDING_HP',`city ${city.id}, ${b.type}: ${b.hp}`);
 }
 for(const a of [...state.settlers,...state.armies]){
  if(!Number.isInteger(a.c)||!Number.isInteger(a.r)||a.c<0||a.c>=220||a.r<0||a.r>=165)
   error('INVALID_WORLD_POSITION',`team ${a.team}: ${a.c}:${a.r}`);
 }
 return out;
}
export function pathErrors(game,turn){
 const result=[];
 const error=(code,detail)=>result.push({turn,code,detail});
 for(const a of [...game.s.settlers,...game.s.armies].filter(a=>a.embarked==null&&a.path?.length)){
  if(a.c==null||a.r==null)continue; // Sea ship path has separate navigation rules.
  let previous={c:a.c,r:a.r};
  for(const p of a.path){
   if(!Number.isInteger(p.c)||!Number.isInteger(p.r)||Math.max(Math.abs(p.c-previous.c),Math.abs(p.r-previous.r))>1)
    {error('PATH_DISCONTINUITY',`team ${a.team}, ${previous.c}:${previous.r} -> ${p.c}:${p.r}`);break;}
   if(!game.canTraverse(a.team,p)){error('PATH_BLOCKED',`team ${a.team}, ${p.c}:${p.r}`);break;}
   previous=p;
  }
 }
 return result;
}
export function compareSnapshots(a,b){
 const changes=[],alerts=[];
 for(const team of TEAMS){
  const x=a.teams[team],y=b.teams[team];
  const delta={team,ages:y.age-x.age,cities:y.cities-x.cities,pop:cleanNumber(y.pop-x.pop),buildings:y.ready-x.ready,techs:y.techCount-x.techCount};
  changes.push(delta);
  if(delta.ages<=-2)alerts.push({severity:'warning',code:'ERA_REGRESSION',team,delta:delta.ages});
  if(delta.cities<=-2)alerts.push({severity:'warning',code:'CITY_REGRESSION',team,delta:delta.cities});
  if(x.cities>0&&y.cities===0)alerts.push({severity:'warning',code:'CITY_LOST',team});
  if(x.pop>10&&y.pop<x.pop*.5)alerts.push({severity:'warning',code:'POP_REGRESSION',team,baseline:x.pop,candidate:y.pop});
 }
 return {changes,alerts,totals:Object.fromEntries(['cities','population','readyBuildings','technologies','worldRoadEdges','exploredCells'].map(k=>[k,cleanNumber((b.totals?.[k]||0)-(a.totals?.[k]||0))]))};
}
export function compareRuns(baseline,candidate){
 if(!baseline.checkpoints?.length||!candidate.checkpoints?.length){
  return {changes:[],totals:{},alerts:[{severity:'error',code:'MISSING_SNAPSHOT',
   baselineErrors:baseline.errors||[],candidateErrors:candidate.errors||[]}],diffByTurn:[],passed:false};
 }
 const baselineLast=baseline.checkpoints.at(-1),candidateLast=candidate.checkpoints.at(-1);
 const {changes,alerts,totals}=compareSnapshots(baselineLast,candidateLast);
 if((baseline.performance?.wallSeconds||0)>5 && candidate.performance?.wallSeconds>baseline.performance.wallSeconds*1.75)
  alerts.push({severity:'warning',code:'PERFORMANCE_SLOWDOWN',baselineSeconds:baseline.performance.wallSeconds,candidateSeconds:candidate.performance.wallSeconds});
 if(candidate.status!=='passed')alerts.push({severity:'error',code:'TEST_FAILURE',details:candidate.errors.slice(0,15)});
 if(baseline.status!=='passed')alerts.push({severity:'warning',code:'BASELINE_FAILURE',details:baseline.errors.slice(0,5)});
 if(candidate.completedTurns<baseline.completedTurns&&!candidate.finishedByVictory)
  alerts.push({severity:'error',code:'SIMULATION_SHORTER',baseline:baseline.completedTurns,candidate:candidate.completedTurns});
 const diffByTurn=[];
 for(const cur of candidate.checkpoints){const old=baseline.checkpoints.find(s=>s.turn===cur.turn);if(old){const d=compareSnapshots(old,cur);diffByTurn.push({turn:cur.turn,changes:d.changes,totals:d.totals});}}
 return {baseline:{revision:baseline.revision,seed:baseline.seed,status:baseline.status},candidate:{revision:candidate.revision,seed:candidate.seed,status:candidate.status},changes,totals,alerts,diffByTurn,passed:!alerts.some(a=>a.severity==='error')};
}

export function worldRouteChecks(game,turn){
 const errors=[];let checked=0;
 for(const team of TEAMS){
  const origin=game.s.armies.find(a=>a.team===team&&a.embarked==null)||game.s.settlers.find(a=>a.team===team&&a.embarked==null);
  if(!origin)continue;
  // Find an actually reachable land goal near each faction, without mutating its orders.
  let goal=null,route=null;
  outer:for(let d=1;d<=6;d++)for(let dy=-d;dy<=d;dy++)for(let dx=-d;dx<=d;dx++){
   if(Math.max(Math.abs(dx),Math.abs(dy))!==d)continue;
   const p={c:origin.c+dx,r:origin.r+dy};
   if(p.c<0||p.c>=220||p.r<0||p.r>=165||!game.canTraverse(team,p))continue;
   const found=game.landPath(origin,p,team);
   if(found?.length){goal=p;route=found;break outer;}
  }
  if(!route){errors.push({turn,code:'NO_WORLD_ROUTE',detail:`team ${team} at ${origin.c}:${origin.r}`});continue;}
  checked++;
  let prev=origin;
  for(const p of route){
   if(Math.max(Math.abs(p.c-prev.c),Math.abs(p.r-prev.r))>1||!game.canTraverse(team,p)){
    errors.push({turn,code:'INVALID_WORLD_ROUTE',detail:`team ${team}, ${prev.c}:${prev.r} to ${p.c}:${p.r}`});break;
   }
   prev=p;
  }
  if(prev.c!==goal.c||prev.r!==goal.r)errors.push({turn,code:'ROUTE_WRONG_TARGET',detail:`team ${team}`});
 }
 return {checked,errors};
}

export function localPathChecks(game,doorFn,turn){
 const warnings=[],errors=[];let checked=0;
 for(const city of game.s.cities){
  for(const ctx of [city,...Object.values(city.districts||{})]){
   const ready=(ctx.economy?.buildings||[]).filter(b=>b.ready&&!b.virtual&&b.hp>0&&!b.disabled);
   const hall=ready.find(b=>b.type==='hall')||ctx.economy?.buildings?.find(b=>b.type==='hall');
   if(!hall||ready.filter(b=>b!==hall).length===0)continue;
   let nav;
   try{nav=game.nav(ctx);}catch(e){errors.push({turn,code:'NAV_INIT_FAILED',detail:`city ${city.id} ${e}`});continue;}
   // Sample up to 4 doors per district; workers and cargo need a connected path.
   for(const b of ready.filter(b=>b!==hall).slice(0,4)){
    checked++;
    try{
     const a=nav.nearest(doorFn(hall),9),z=nav.nearest(doorFn(b),9);
     if(!a||!z||!nav.reachable(a,z))warnings.push({turn,code:'LOCAL_BUILDING_UNREACHABLE',detail:`city ${city.id}, ${b.type}`});
     else if(!nav.route(a,z))errors.push({turn,code:'LOCAL_ROUTE_MISSING',detail:`city ${city.id}, ${b.type}`});
    }catch(e){errors.push({turn,code:'LOCAL_ROUTE_EXCEPTION',detail:`city ${city.id}, ${b.type} ${e}`});}
   }
  }
 }
 return {checked,warnings,errors};
}
