// An elevated graph, separate from the ground grid: soldiers use continuous
// wall walks and enter via interior stairs or a completed assault ladder/tower.
import {troopRole} from './military-v88.js';
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export function wallNodes(b){return (b.siegeSections||[]).filter(w=>w.hp>0&&!w.breached&&w.walkable);}
export function nearestWall(b,p){return wallNodes(b).reduce((a,w)=>!a||distance(w,p)<distance(a,p)?w:a,null);}
export function wallPath(b,a,z){const nodes=wallNodes(b),start=nearestWall(b,a),end=nearestWall(b,z);if(!start||!end)return null;const queue=[start],prev=new Map([[start,null]]);for(const n of queue){if(n===end)break;for(const v of nodes)if(!prev.has(v)&&distance(n,v)<=7.2){prev.set(v,n);queue.push(v);}}if(!prev.has(end))return null;const route=[];for(let n=end;n;n=prev.get(n))route.unshift({x:n.x,z:n.z,index:n.index});return route;}
export function orderWallMove(b,u,p,nav){if(!b?.wallWalkEnabled||!['melee','ranged'].includes(troopRole(u.kind)))return null;const wall=nearestWall(b,p);if(!wall||distance(wall,p)>4){if(!u.guardPost)return null;const entries=u.team===b.fortress.team?(b.wallStairs||[]):(b.siegeWorks||[]).filter(w=>w.team===u.team&&w.ready&&w.arrived&&!w.destroyed).map(w=>({x:w.wallX,z:w.wallZ,groundX:w.wallX-w.inwardX*5,groundZ:w.wallZ-w.inwardZ*5}));const entry=entries.sort((a,c)=>distance(a,u)-distance(c,u)).find(e=>wallPath(b,u,e));if(!entry)return {error:'Puudub ühendatud trepp või redel.'};u.wallExit={...entry,destination:{...p},progress:0};u.wallRoute=wallPath(b,u,entry);u.wallManual=true;return {ok:true};}
 if(u.guardPost){const path=wallPath(b,u,wall);if(!path)return {error:'Müürikäik on katkenud.'};u.wallRoute=path;u.wallDestination={x:wall.x,z:wall.z};u.wallManual=true;return {ok:true};}
 const entries=u.team===b.fortress.team?(b.wallStairs||[]):(b.siegeWorks||[]).filter(w=>w.team===u.team&&w.ready&&w.arrived&&!w.destroyed).map(w=>({x:w.wallX,z:w.wallZ,groundX:w.wallX-w.inwardX*5,groundZ:w.wallZ-w.inwardZ*5}));
 const entry=entries.filter(e=>wallPath(b,e,wall)).sort((a,c)=>distance(a,u)-distance(c,u)).find(e=>nav.route(u,{x:e.groundX,z:e.groundZ}));if(!entry)return {error:'Müürile pääsemiseks vii valmis redel või piiramistorn müürini.'};
 u.wallClimb={entry:{...entry},destination:{x:wall.x,z:wall.z},progress:0};u.target={x:entry.groundX,z:entry.groundZ};u.manualOrder=true;u.attackTargetSource=null;return {ok:true};
}
export function tickWallWalk(b,dt,nav){if(!b.wallWalkEnabled)return;
 for(const u of b.squads){if(u.hp<=0||u.reserve||u.retreated)continue;
 const work=(b.siegeWorks||[]).find(w=>w.ownerSource===u.source&&w.team===u.team&&w.ready&&w.arrived&&!w.destroyed);if(work&&!u.guardPost&&!u.wallClimb&&!u.wallAssaulted&&nav){const q=orderWallMove(b,u,{x:work.wallX,z:work.wallZ},nav);if(q?.ok)u.wallAssaulted=true;}
 if(u.wallExit&&u.guardPost&&distance(u,u.wallExit)<1){const e=u.wallExit;e.progress+=dt/3;u.wallElevation=3.8*(1-Math.min(1,e.progress));for(const m of u.men||[])m.moving=true;if(e.progress>=1){u.guardPost=false;u.wallWalk=false;u.wallElevation=0;u.x=e.groundX;u.z=e.groundZ;u.anchor={x:u.x,z:u.z};for(const [i,m]of(u.men||[]).entries()){m.x=u.x+(i%4-1.5)*.75;m.z=u.z+Math.floor(i/4)*.75;m.elevation=0;}u.target=nav?.nearest(e.destination,12)||e.destination;u.manualOrder=true;delete u.wallExit;}continue;}

 if(u.wallClimb&&!u.guardPost){const q=u.wallClimb;if(distance(u,q.entry)>8)continue;q.progress+=dt/3;u.wallElevation=Math.min(1,q.progress)*3.8;if(q.progress<1)continue;u.guardPost=true;u.wallType='stonewall';u.wallWalk=true;u.x=q.entry.x;u.z=q.entry.z;u.anchor={x:u.x,z:u.z};u.manualOrder=false;u.target=null;u.wallRoute=wallPath(b,u,q.destination)||[];u.wallManual=true;delete u.wallClimb;for(const [i,m]of(u.men||[]).entries()){m.x=u.x;m.z=u.z+(i-(u.men.length-1)/2)*.65;}}
 if(!u.guardPost||!u.wallWalk)continue;
 const fallen=(b.siegeSections||[]).find(w=>w.walkable&&(w.hp<=0||w.breached)&&distance(w,u)<3.6);if(fallen){u.guardPost=false;u.wallWalk=false;u.wallElevation=0;u.wallRoute=null;const safe=nav?.nearest(u,10);if(safe){u.x=safe.x;u.z=safe.z;}u.anchor={x:u.x,z:u.z};for(const [i,m]of(u.men||[]).entries()){m.hp*=.8;m.elevation=0;m.x=u.x+(i%4-1.5)*.75;m.z=u.z+Math.floor(i/4)*.75;}u.hp=(u.men||[]).reduce((n,m)=>n+m.hp,0);continue;}
 if(u.wallRoute?.some(p=>!(b.siegeSections||[]).some(w=>w.index===p.index&&w.hp>0&&!w.breached))){u.wallRoute=wallPath(b,u,u.wallDestination||u.wallExit||u)||[];}

 const here=nearestWall(b,u);if(!here||distance(here,u)>8){u.guardPost=false;u.wallWalk=false;u.wallElevation=0;u.wallRoute=null;continue;}
 if(u.routing&&!u.wallExit){orderWallMove(b,u,{x:b.fortress.x,z:b.fortress.z},nav);u.routing=false;for(const m of u.men||[])m.routing=false;}
 if(!u.wallManual&&(!u.wallRoute?.length||b.elapsed>=(u.wallReplan||0))){const foes=b.squads.filter(v=>v.team!==u.team&&v.hp>0&&!v.retreated&&!v.reserve),threat=foes.sort((a,c)=>distance(a,u)-distance(c,u))[0];if(threat){u.wallRoute=wallPath(b,u,threat)||[];u.wallReplan=b.elapsed+7;}}
 let next=u.wallRoute?.[0];if(next&&distance(u,next)<.12){u.wallRoute.shift();next=u.wallRoute[0];}u.moving=false;
 if(next){const d=distance(u,next),step=Math.min(d,2*dt);u.heading=Math.atan2(next.x-u.x,next.z-u.z);u.x+=(next.x-u.x)/d*step;u.z+=(next.z-u.z)/d*step;u.moving=step>0;}
 u.anchor={x:u.x,z:u.z};u.wallElevation=3.8;
 const nodes=wallNodes(b),at=nearestWall(b,u),axis=at?.wallAxis?{x:0,z:1}:{x:1,z:0};
 for(const [i,m]of(u.men||[]).entries()){if(m.hp<=0)continue;const offset=(i-(u.men.length-1)/2)*.72,target={x:u.x+axis.x*offset,z:u.z+axis.z*offset},w=nearestWall(b,target)||at;if(!w)continue;const along=Math.max(-3.3,Math.min(3.3,(target.x-w.x)*axis.x+(target.z-w.z)*axis.z));m.x=w.x+axis.x*along;m.z=w.z+axis.z*along;m.moving=u.moving;m.elevation=3.8;}
 }
}
export const fighterElevation=u=>u?.guardPost?u.wallElevation??3.8:u?.wallElevation||0;
