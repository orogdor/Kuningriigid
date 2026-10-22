// An elevated graph, separate from the ground grid: soldiers use continuous
// wall walks and enter via interior stairs or a completed assault ladder/tower.
import {troopRole} from './military-v88.js?v=116a';
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
// Two ranks fit on a 2.8m-wide wall walk. A sixteen-man detachment no
// longer compresses every man beyond the eighth into the same end point.
export function wallRankPoint(w,i,count){const columns=Math.min(8,count),rows=Math.ceil(count/columns),along=(i%columns-(columns-1)/2)*.82,across=(Math.floor(i/columns)-(rows-1)/2)*.85;return {x:w.x+(w.wallAxis?across:along),z:w.z+(w.wallAxis?along:across)};}
export function wallNodes(b){return (b.siegeSections||[]).filter(w=>w.hp>0&&!w.breached&&w.walkable);}
export function nearestWall(b,p){return wallNodes(b).reduce((a,w)=>!a||distance(w,p)<distance(a,p)?w:a,null);}
export function wallPath(b,a,z){const nodes=wallNodes(b),start=nearestWall(b,a),end=nearestWall(b,z);if(!start||!end)return null;const queue=[start],prev=new Map([[start,null]]);for(const n of queue){if(n===end)break;for(const v of nodes)if(!prev.has(v)&&distance(n,v)<=7.2&&Math.abs((n.height||3.8)-(v.height||3.8))<.5){prev.set(v,n);queue.push(v);}}if(!prev.has(end))return null;const route=[];for(let n=end;n;n=prev.get(n))route.unshift({x:n.x,z:n.z,index:n.index,height:n.height||3.8});return route;}
export function orderWallMove(b,u,p,nav){if(!b?.wallWalkEnabled||!['melee','ranged'].includes(troopRole(u.kind)))return null;const wall=nearestWall(b,p);if(!wall||distance(wall,p)>4){if(!u.guardPost)return null;const entries=[...(b.wallStairs||[]),...(b.siegeWorks||[]).filter(w=>['ladder','tower'].includes(w.kind)&&w.team===u.team&&w.ready&&w.arrived&&!w.destroyed).map(w=>({x:w.wallX,z:w.wallZ,groundX:w.wallX-w.inwardX*5,groundZ:w.wallZ-w.inwardZ*5,height:w.height||3.8}))];const entry=entries.sort((a,c)=>distance(a,u)-distance(c,u)).find(e=>wallPath(b,u,e)&&(!nav||nav.route({x:e.groundX,z:e.groundZ},p)));if(!entry)return {error:'Puudub ühendatud trepp või redel.'};u.wallExit={...entry,destination:{...p},progress:0};u.wallRoute=wallPath(b,u,entry);u.wallManual=true;return {ok:true};}
 if(u.guardPost){const path=wallPath(b,u,wall);if(!path)return {error:'Müürikäik on katkenud.'};u.wallRoute=path;u.wallDestination={x:wall.x,z:wall.z};u.wallManual=true;return {ok:true};}
 const entries=u.team===b.fortress.team?(b.wallStairs||[]):(b.siegeWorks||[]).filter(w=>['ladder','tower'].includes(w.kind)&&w.team===u.team&&w.ready&&w.arrived&&!w.destroyed).map(w=>({x:w.wallX,z:w.wallZ,groundX:w.wallX-w.inwardX*5,groundZ:w.wallZ-w.inwardZ*5,height:w.height||3.8}));
 const entry=entries.filter(e=>wallPath(b,e,wall)).sort((a,c)=>distance(a,u)-distance(c,u)).find(e=>nav.route(u,{x:e.groundX,z:e.groundZ}));if(!entry)return {error:'Müürile pääsemiseks vii valmis redel või piiramistorn müürini.'};
 for(const m of u.men||[]){delete m.siegeClimbed;delete m.siegeClimbing;delete m.siegeClimbFrom;}u.wallClimb={entry:{...entry},destination:{x:wall.x,z:wall.z},progress:0};u.target={x:entry.groundX,z:entry.groundZ};u.manualOrder=true;u.attackTargetSource=null;return {ok:true};
}
export function tickWallWalk(b,dt,nav){if(!b.wallWalkEnabled)return;
 const placed=new Map(),bins=new Map(),key=p=>Math.floor(p.x/2)+':'+Math.floor(p.z/2);
 const free=p=>{for(let z=-1;z<=1;z++)for(let x=-1;x<=1;x++)for(const q of bins.get((Math.floor(p.x/2)+x)+':'+(Math.floor(p.z/2)+z))||[])if(distance(p,q)<.705)return false;return true;};
 const put=(p,m)=>{placed.set(m,p);const k=key(p),list=bins.get(k)||[];list.push(p);bins.set(k,list);return p;};
 const reserve=(preferred,man)=>{if(placed.has(man))return placed.get(man);const nodes=wallNodes(b).sort((a,c)=>distance(a,preferred)-distance(c,preferred)),nearest=nodes[0];if(nearest){const along=Math.max(-3.3,Math.min(3.3,nearest.wallAxis?preferred.z-nearest.z:preferred.x-nearest.x)),across=Math.max(-.85,Math.min(.85,nearest.wallAxis?preferred.x-nearest.x:preferred.z-nearest.z)),p={x:nearest.x+(nearest.wallAxis?across:along),z:nearest.z+(nearest.wallAxis?along:across)};if(free(p))return put(p,man);}for(const w of nodes){const candidates=Array.from({length:16},(_,i)=>wallRankPoint(w,i,16)).sort((a,c)=>distance(a,preferred)-distance(c,preferred));for(const p of candidates)if(free(p))return put(p,man);}return preferred;};
 for(const u of b.squads){if(u.hp<=0||u.reserve||u.retreated)continue;
 const work=(b.siegeWorks||[]).filter(w=>['ladder','tower'].includes(w.kind)&&w.team===u.team&&w.ready&&w.arrived&&!w.destroyed&&(w.ownerSource===u.source||((u.combatMode??'auto')==='auto'&&!u.manualOrder&&distance(u,w)<220))).sort((a,c)=>distance(a,u)-distance(c,u))[0];if(work&&!u.guardPost&&!u.wallClimb&&!u.wallAssaulted&&nav){const q=orderWallMove(b,u,{x:work.wallX,z:work.wallZ},nav);if(q?.ok)u.wallAssaulted=true;}
 if(u.wallExit&&u.guardPost&&distance(u,u.wallExit)<1){const e=u.wallExit;e.progress+=dt/Math.max(3,(e.height||3.8)/.9);u.wallElevation=(e.height||3.8)*(1-Math.min(1,e.progress));for(const m of u.men||[])m.moving=true;if(e.progress>=1){u.guardPost=false;u.wallWalk=false;u.wallElevation=0;u.x=e.groundX;u.z=e.groundZ;u.anchor={x:u.x,z:u.z};for(const [i,m]of(u.men||[]).entries()){m.x=u.x+(i%4-1.5)*.75;m.z=u.z+Math.floor(i/4)*.75;m.elevation=0;}u.target=nav?.nearest(e.destination,12)||e.destination;u.manualOrder=true;delete u.wallExit;}continue;}

 if(u.wallClimb&&!u.guardPost){const q=u.wallClimb,e=q.entry,dx=e.x-e.groundX,dz=e.z-e.groundZ,length=Math.hypot(dx,dz)||1,nx=dx/length,nz=dz/length,alive=(u.men||[]).filter(m=>m.hp>0&&!m.escaped),waiting=alive.filter(m=>!m.siegeClimbed),active=waiting.filter(m=>m.siegeClimbing!=null);let slots=Math.max(0,2-active.length);
  for(const [rank,m]of waiting.entries()){
   if(m.siegeClimbing==null){const row=Math.floor(rank/2),side=rank%2?.42:-.42,queue={x:e.groundX-nx*row*.9-nz*side,z:e.groundZ-nz*row*.9+nx*side};nav?.move(m,queue,dt,3.6);m.elevation=0;
    if(row===0&&distance(m,queue)<.55&&slots>0){m.siegeClimbing=0;m.siegeClimbFrom={x:m.x,z:m.z};slots--;}}
   if(m.siegeClimbing!=null){m.siegeClimbing=Math.min(1,m.siegeClimbing+dt/Math.max(3,(e.height||3.8)/.9));const t=m.siegeClimbing;m.x=m.siegeClimbFrom.x+(e.x-m.siegeClimbFrom.x)*t;m.z=m.siegeClimbFrom.z+(e.z-m.siegeClimbFrom.z)*t;m.elevation=t*(e.height||3.8);m.moving=true;m.heading=Math.atan2(nx,nz);if(t>=1){m.siegeClimbed=true;delete m.siegeClimbing;}}
  }
  // Men who have reached the parapet spread along connected wall sections.
  const boarded=alive.filter(m=>m.siegeClimbed),wall=nearestWall(b,e),axis=wall?.wallAxis?{x:0,z:1}:{x:1,z:0};for(const [i,m]of boarded.entries()){const target=wallRankPoint({...wall,x:e.x,z:e.z},i,alive.length),w=nearestWall(b,target)||wall;if(w){const p=reserve(target,m);m.x=p.x;m.z=p.z;}m.elevation=w?.height||e.height||3.8;}
  if(alive.length){u.x=alive.reduce((n,m)=>n+m.x,0)/alive.length;u.z=alive.reduce((n,m)=>n+m.z,0)/alive.length;u.anchor={x:u.x,z:u.z};}u.moving=waiting.some(m=>m.moving);q.progress=alive.length?boarded.length/alive.length:0;
  if(waiting.length)continue;
  u.guardPost=true;u.wallType=nearestWall(b,e)?.type||'stonewall';u.wallWalk=true;u.x=e.x;u.z=e.z;u.anchor={x:u.x,z:u.z};u.manualOrder=false;u.target=null;u.wallRoute=wallPath(b,u,q.destination)||[];u.wallManual=false;delete u.wallClimb;
 }
 if(!u.guardPost||!u.wallWalk)continue;
 const fallen=(b.siegeSections||[]).find(w=>w.walkable&&(w.hp<=0||w.breached)&&distance(w,u)<3.6);if(fallen){u.guardPost=false;u.wallWalk=false;u.wallElevation=0;u.wallRoute=null;const safe=nav?.nearest(u,10);if(safe){u.x=safe.x;u.z=safe.z;}u.anchor={x:u.x,z:u.z};for(const [i,m]of(u.men||[]).entries()){m.hp*=.8;m.elevation=0;m.x=u.x+(i%4-1.5)*.75;m.z=u.z+Math.floor(i/4)*.75;}u.hp=(u.men||[]).reduce((n,m)=>n+m.hp,0);continue;}
 if(u.wallRoute?.some(p=>!(b.siegeSections||[]).some(w=>w.index===p.index&&w.hp>0&&!w.breached))){u.wallRoute=wallPath(b,u,u.wallDestination||u.wallExit||u)||[];}

 if(!u.wallManual&&!u.wallExit&&troopRole(u.kind)==='melee'){const foes=b.squads.filter(v=>v.team!==u.team&&v.hp>0&&!v.reserve&&!v.retreated);const wallThreat=foes.some(v=>v.guardPost&&distance(u,v)<12),inside=foes.filter(v=>!v.guardPost&&distance(v,b.fortress)<35).sort((a,c)=>distance(a,u)-distance(c,u))[0];if(inside&&!wallThreat){const q=orderWallMove(b,u,inside,nav);if(q?.ok&&u.wallExit)continue;}}
 const here=nearestWall(b,u);if(!here||distance(here,u)>8){u.guardPost=false;u.wallWalk=false;u.wallElevation=0;u.wallRoute=null;continue;}
 if(u.routing&&!u.wallExit){orderWallMove(b,u,{x:b.fortress.x,z:b.fortress.z},nav);u.routing=false;for(const m of u.men||[])m.routing=false;}
 if(!u.wallManual&&(!u.wallRoute?.length||b.elapsed>=(u.wallReplan||0))){const foes=b.squads.filter(v=>v.team!==u.team&&v.hp>0&&!v.retreated&&!v.reserve),threat=foes.sort((a,c)=>distance(a,u)-distance(c,u))[0];if(threat){u.wallRoute=wallPath(b,u,threat)||[];u.wallReplan=b.elapsed+7;}}
 let next=u.wallRoute?.[0];if(next&&distance(u,next)<.12){u.wallRoute.shift();next=u.wallRoute[0];}u.moving=false;
 if(next){const d=distance(u,next),step=Math.min(d,2*dt);u.heading=Math.atan2(next.x-u.x,next.z-u.z);u.x+=(next.x-u.x)/d*step;u.z+=(next.z-u.z)/d*step;u.moving=step>0;}
 u.anchor={x:u.x,z:u.z};u.wallElevation=nearestWall(b,u)?.height||3.8;u.wallType=nearestWall(b,u)?.type||u.wallType;
 const nodes=wallNodes(b),at=nearestWall(b,u),axis=at?.wallAxis?{x:0,z:1}:{x:1,z:0};
 for(const [i,m]of(u.men||[]).entries()){if(m.hp<=0)continue;const target=wallRankPoint({...at,x:u.x,z:u.z},i,u.men.length),w=nearestWall(b,target)||at;if(!w)continue;const point=reserve(target,m);m.x=point.x;m.z=point.z;m.moving=u.moving;m.elevation=w.height||3.8;}
 }
}
export const fighterElevation=(u,m=null)=>m?.elevation??(u?.guardPost?u.wallElevation??3.8:u?.wallElevation||0);
