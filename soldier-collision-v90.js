import {crowdWaypoint,forgetCrowdRoute} from './crowd-movement-v132.js';
import {troopRole} from './military-v88.js?v=117a';
export const SQUAD_SIZE=12;
export const soldierCount=u=>['scout','militia','bronze_catapult','catapult'].includes(u.kind)?1:['melee','ranged'].includes(troopRole(u.kind))?24:SQUAD_SIZE;
const mounted=u=>['cavalry','vehicle'].includes(troopRole(u.kind));
export const squadRadius=u=>['bronze_catapult','catapult'].includes(u.kind)?2.3:soldierCount(u)===1?.45:u.kind==='chariot'?12.8:mounted(u)?9.4:soldierCount(u)>=24?3.5:2.05;
const alive=u=>u.hp>0&&!u.retreated&&!u.guardPost;
const radius=p=>p.radius??squadRadius(p);
// Sweep the whole displacement against occupied discs. This also prevents
// high-speed orders crossing another formation between simulation steps.
export function constrainStep(agent,to,others,open=()=>true){
 const ox=agent.x,oz=agent.z,dx=to.x-ox,dz=to.z-oz,len=Math.hypot(dx,dz);if(!len)return false;
 let fraction=1;for(const other of others){if(other===agent)continue;const r=radius(agent)+radius(other)+.02,px=ox-other.x,pz=oz-other.z,c=px*px+pz*pz-r*r,dot=px*dx+pz*dz;
  if(c<0){if(dot<0)fraction=0;continue;}const disc=dot*dot-len*len*c;if(dot<0&&disc>=0)fraction=Math.min(fraction,Math.max(0,(-dot-Math.sqrt(disc))/(len*len)-.001/len));
 }
 for(let f=Math.min(1,.25/len);f<=fraction;f+=.25/len)if(!open(ox+dx*f,oz+dz*f)){fraction=Math.max(0,f-.25/len);break;}
 const x=ox+dx*fraction,z=oz+dz*fraction;if(!open(x,z))return false;agent.x=x;agent.z=z;return fraction>.001;
}
export function moveSquad(u,target,dt,speed,nav,squads){
 const before={x:u.x,z:u.z};let done=false;if(nav)done=nav.move(u,target,dt,speed);else{const d=Math.hypot(target.x-u.x,target.z-u.z),f=d?Math.min(1,speed*dt/d):0;u.x+=(target.x-u.x)*f;u.z+=(target.z-u.z)*f;done=d<=speed*dt;}
 const to={x:u.x,z:u.z};Object.assign(u,before);const peers=squads.filter(alive),open=nav?((x,z)=>nav.open(x,z)):()=>true;
 // Look along the ordinary terrain route, beyond the blocking formation.
 let goal=target;const path=nav?.cache?.get(u)?.path;
 if(path?.length){goal=to;for(const point of path){if(Math.hypot(point.x-before.x,point.z-before.z)>60||!nav.clear(before,point))break;goal=point;}}
 const waypoint=crowdWaypoint(u,goal,peers,open,radius,dt),distance=Math.hypot(waypoint.x-u.x,waypoint.z-u.z);
 const detour=waypoint!==goal,step=Math.min(distance,speed*dt),desired=detour&&distance?{x:u.x+(waypoint.x-u.x)*step/distance,z:u.z+(waypoint.z-u.z)*step/distance}:to;
 u.moving=constrainStep(u,desired,peers,open);
 if(Math.hypot(u.x-desired.x,u.z-desired.z)>.01)forgetCrowdRoute(u);
 // A proposed nav step must never consume waypoints the formation did not reach.
 if(nav&&Math.hypot(u.x-to.x,u.z-to.z)>.01)nav.cache?.delete(u);
 if(u.moving)u.heading=Math.atan2(u.x-before.x,u.z-before.z);return done&&Math.hypot(u.x-target.x,u.z-target.z)<.25;
}
export function separateSquads(squads,nav=null){
 const list=squads.filter(alive);for(let pass=0;pass<12;pass++){let changed=false;for(let i=0;i<list.length;i++)for(let j=0;j<i;j++){const a=list[i],b=list[j],r=squadRadius(a)+squadRadius(b)+.03,dx=a.x-b.x,dz=a.z-b.z,d=Math.hypot(dx,dz);if(d>=r)continue;const nx=d?dx/d:Math.cos(i*2.4),nz=d?dz/d:Math.sin(i*2.4),push=(r-d)/2+.001;for(const [u,sign]of [[a,1],[b,-1]]){const x=u.x+nx*push*sign,z=u.z+nz*push*sign;if(!nav||nav.open(x,z)){u.x=x;u.z=z;changed=true;}}}if(!changed)break;}
}
const stored=new WeakMap();
// Fine individual discs use a spatial hash, independent of the coarse tactical
// navigation grid. Twelve men must not snap onto the same 3m path node.
export function formationMen(squads,dt,nav){
 const result=new Map();for(const u of squads)if(u.guardPost&&u.hp>0&&!u.retreated)result.set(u,[{x:u.x,z:u.z}]);const bins=new Map(),size=8,key=(x,z)=>Math.floor(x/size)+':'+Math.floor(z/size);
 const insert=p=>{const k=key(p.x,p.z),list=bins.get(k)||[];list.push(p);bins.set(k,list);};
 const nearby=p=>{const out=[];const x=Math.floor(p.x/size),z=Math.floor(p.z/size);for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++)out.push(...(bins.get((x+dx)+':'+(z+dz))||[]));return out;};
 const goals=[];for(const u of squads){if(!alive(u))continue;let men=stored.get(u);if(!men){men=[];stored.set(u,men);}const count=u.soldiers?u.soldiers.filter(m=>m.hp>0).length:Math.ceil((u.menCount||soldierCount(u))*Math.min(1,u.hp/(u.maxHp||u.hp))),c=Math.cos(u.heading||0),sn=Math.sin(u.heading||0),spacing=u.kind==='chariot'?6.2:mounted(u)?4.1:1.05;
  men.length=count;for(let i=0;i<count;i++){const columns=count>=24&&!mounted(u)?6:4,ox=count===1?0:(i%columns-(columns-1)/2)*spacing,oz=count===1?0:(Math.floor(i/columns)-(Math.ceil(count/columns)-1)/2)*spacing,goal={x:u.x+c*ox+sn*oz,z:u.z-sn*ox+c*oz};if(!men[i]){const p={...goal,radius:mounted(u)?2:.34};let found=false;for(let ring=0;ring<40&&!found;ring++)for(let n=0;n<Math.max(1,ring*8);n++){const a=n/Math.max(1,ring*8)*Math.PI*2;p.x=goal.x+Math.cos(a)*ring*.4;p.z=goal.z+Math.sin(a)*ring*.4;if((!nav||nav.open(p.x,p.z))&&nearby(p).every(q=>Math.hypot(q.x-p.x,q.z-p.z)>=q.radius+p.radius+.02)){found=true;break;}}men[i]=p;}insert(men[i]);goals.push({p:men[i],goal,speed:Math.max(5,(u.moving?9:5))});}result.set(u,men);}
 for(const {p,goal,speed}of goals){if(dt<=0)continue;const old=key(p.x,p.z),list=bins.get(old);list.splice(list.indexOf(p),1);const peers=nearby(p),open=nav?((x,z)=>nav.open(x,z)):()=>true,waypoint=crowdWaypoint(p,goal,peers,open,radius,Math.min(dt,.1)),d=Math.hypot(waypoint.x-p.x,waypoint.z-p.z),f=d?Math.min(1,speed*Math.min(dt,.1)/d):0,to={x:p.x+(waypoint.x-p.x)*f,z:p.z+(waypoint.z-p.z)*f};constrainStep(p,to,peers,open);if(Math.hypot(p.x-to.x,p.z-to.z)>.01)forgetCrowdRoute(p);insert(p);}
 return result;
}
