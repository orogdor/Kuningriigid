// Runtime-only memory: each resident learns each directed trip three times.
// A navigation revision invalidates only the memory for that detail tile.
export class CitizenRoutes{
 constructor(){this.agents=new WeakMap();this.version=-1;this.stats={searches:0,reuses:0,resets:0};}
 reset(version){this.agents=new WeakMap();this.version=version;this.stats.resets++;}
 key(nav,from,to){const a=nav.nearest(from),b=nav.nearest(to);return a&&b?nav.index(a.x,a.z)+':'+nav.index(b.x,b.z):null;}
 plan(nav,agent,goal){
  if(this.version!==nav.version)this.reset(nav.version);
  const key=this.key(nav,agent,goal);if(!key)return null;
  let trips=this.agents.get(agent);if(!trips){trips=new Map();this.agents.set(agent,trips)}
  const known=trips.get(key);
  if(known?.count>=3){this.stats.reuses++;return known.path.map(p=>({...p}))}
  this.stats.searches++;const path=nav.route(agent,goal);
  if(path?.length){
   if(!known&&trips.size>=64)trips.delete(trips.keys().next().value);
   trips.set(key,{count:(known?.count||0)+1,path:path.map(p=>({...p}))});
  }
  return path;
 }
 forget(agent){this.agents.delete(agent);}
}

const worldMemories=new WeakMap();
const tile=p=>p.c+':'+p.r;
function worldStamp(game,points){return points.map(p=>{
 const cell=game.cell(p),ctx=game.contextAt(p,false),world=ctx?.world||game.s.tileWorlds?.[tile(p)];
 return tile(p)+':'+Number(!!cell?.land)+':'+Number(!!cell?.mountain)+':'+Number(!!cell?.bridge)+':'+(world?.revision||0)+':'+(ctx?.economy.buildings||[]).map(b=>[b.type,b.x,b.z,b.hp>0,b.ready,b.wallAxis,b.navWidth,b.navDepth].join(',')).join(';');
}).join('|');}
// Builders and shoppers also cross detail tiles. Keep the active journey so
// world A* is not repeated every animation/economy tick.
export function citizenWorldRoute(game,agent,target){
 let memory=worldMemories.get(game);if(!memory){memory=new WeakMap();worldMemories.set(game,memory)}
 let m=memory.get(agent);if(!m){m={trips:new Map(),active:null};memory.set(agent,m)}
 const destination=tile(target),active=m.active;
 if(active&&active.destination===destination&&active.stamp===worldStamp(game,active.points)){
  const i=active.points.findIndex(p=>tile(p)===tile(agent));
  if(i>=0)return active.points.slice(i+1).map(p=>({...p}));
 }
 const key=tile(agent)+'>'+destination,known=m.trips.get(key);
 let path;
 if(known?.count>=3&&known.stamp===worldStamp(game,known.points))path=known.points.slice(1).map(p=>({...p}));
 else{
  path=game.landPath(agent,target);
  if(!path)return null;
  const points=[{c:agent.c,r:agent.r},...path.map(p=>({c:p.c,r:p.r}))],stamp=worldStamp(game,points);
  if(!known&&m.trips.size>=64)m.trips.delete(m.trips.keys().next().value);
  m.trips.set(key,{points,stamp,count:known?.stamp===stamp?known.count+1:1});
 }
 const points=[{c:agent.c,r:agent.r},...path.map(p=>({c:p.c,r:p.r}))];
 m.active={destination,points,stamp:worldStamp(game,points)};
 return path;
}
