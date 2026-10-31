// V252: town people behave like people (Stone Age first; later eras keep the old behaviour for now).
//  - Nobody just stands around: a worker with nothing to do for a few seconds either walks over to
//    another idle neighbour and they chat in a small circle (gestures, facing each other), or walks
//    home and goes inside. At night people prefer to go home. When work returns they come back out.
//  - People do not walk through each other: everyone keeps a personal radius; walkers step aside,
//    people who work or chat stand their ground. Nobody is pushed into a wall (walkability is checked).
//  - At night everyone outdoors carries a light that suits the era (Stone Age: a burning torch).
// This is a drawing layer: the economy still moves workers on its own nav grid with unchanged timing;
// only where and how they are drawn changes. No save or gameplay data is written.
import * as T from './vendor/three.module.js';
import {createFireV252} from './daynight-v235.js';

const IDLE_DELAY=3.5,WALK=2.6,CATCH_UP=7,RADIUS=.85,CHAT_RANGE=26,GROUP=3;
const hash=s=>{let n=2166136261;for(const c of String(s))n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0;};
const torchWood=new T.MeshStandardMaterial({color:'#5d3f27',roughness:1});
const torchWrap=new T.MeshStandardMaterial({color:'#a08866',roughness:1});
const stickGeo=new T.CylinderGeometry(.025,.032,.62,6),wrapGeo=new T.CylinderGeometry(.045,.04,.12,6);
stickGeo.userData.shared=wrapGeo.userData.shared=true;
function handTorch(){
 const g=new T.Group();g.name='V252 hand torch';
 const stick=new T.Mesh(stickGeo,torchWood);stick.position.y=.2;g.add(stick);
 const wrap=new T.Mesh(wrapGeo,torchWrap);wrap.position.y=.5;g.add(wrap);
 const fire=createFireV252(.34);fire.position.y=.55;g.add(fire);
 return g;
}
export function handLightKindV252(age=0){return age<=3?'torch':null;} // later eras: lanterns (to do with those eras)

export function createPeopleLifeV252(){
 const people=new Map();let lastTime=null,frame=[];
 function blocked(open,a,b){const d=Math.hypot(b.x-a.x,b.z-a.z),n=Math.max(1,Math.ceil(d/1.2));for(let i=1;i<n;i++){const t=i/n;if(!open(a.x+(b.x-a.x)*t,a.z+(b.z-a.z)*t))return true;}return false;}
 function moveToward(p,target,speed,dt){const dx=target.x-p.x,dz=target.z-p.z,d=Math.hypot(dx,dz);if(d<.05){p.x=target.x;p.z=target.z;return false;}const k=Math.min(1,speed*dt/d);p.x+=dx*k;p.z+=dz*k;p.heading=Math.atan2(dx,dz);return d>.18;}
 function begin(ctx){
  const dt=lastTime==null?0:Math.max(0,Math.min(.25,ctx.time-lastTime));lastTime=ctx.time;
  // idle people from the previous frame are grouped into chats here (stable, deterministic order)
  // anyone idle and still outdoors can be invited, also people who were about to walk home
  const free=frame.filter(p=>p.isIdle&&p.plan&&!p.inside&&!p.group).sort((a,b)=>a.id<b.id?-1:1);
  for(const leader of free.filter(p=>p.plan==='chat'||p.plan==='stay')){ // people with nowhere to go also start a chat
   if(leader.group)continue;
   const mates=free.filter(o=>o!==leader&&!o.group&&Math.hypot(o.simX-leader.simX,o.simZ-leader.simZ)<CHAT_RANGE&&!blocked(ctx.open,{x:o.simX,z:o.simZ},{x:leader.simX,z:leader.simZ})).slice(0,GROUP-1);
   if(!mates.length)continue;
   const members=[leader,...mates],cx=members.reduce((a,p)=>a+p.simX,0)/members.length,cz=members.reduce((a,p)=>a+p.simZ,0)/members.length;
   const centre=ctx.open(cx,cz)?{x:cx,z:cz}:{x:leader.simX,z:leader.simZ};
   const group={centre,members:members.map(m=>m.id)};
   members.forEach((m,i)=>{const a=i*Math.PI*2/members.length+(hash(leader.id)%7);m.group=group;m.plan='chat';m.home=null;m.spot={x:centre.x+Math.cos(a)*1.05,z:centre.z+Math.sin(a)*1.05};if(!ctx.open(m.spot.x,m.spot.z))m.spot={x:centre.x,z:centre.z};});
  }
  // a chat breaks up when fewer than two of its members are still idle and talking
  const talking=new Set(frame.filter(p=>p.plan==='chat').map(p=>p.id));
  for(const p of frame)if(p.group&&p.group.members.filter(id=>talking.has(id)).length<2){p.group=null;p.spot=null;p.plan=null;p.idleSince=ctx.time-IDLE_DELAY;}
  // a planned chat that found nobody turns into going home
  for(const p of frame)if(p.plan==='chat'&&!p.group&&ctx.time-p.planAt>1.5)p.plan='home';
  frame=[];return dt;
 }
 function step(id,sim,ctx,dt){const r=stepInner(id,sim,ctx,dt),p=people.get(id);p.anchor=!!sim.working||r.action==='talk';p.isIdle=ctx.enabled&&sim.visible&&!sim.moving&&!sim.working&&!sim.carrying;return r;}
 function stepInner(id,sim,ctx,dt){
  let p=people.get(id);
  if(!p){p={id,x:sim.x,z:sim.z,heading:sim.heading||0,idleSince:null,plan:null,planAt:0,group:null,spot:null,home:null,inside:false};people.set(id,p);}
  p.simX=sim.x;p.simZ=sim.z;p.seen=ctx.time;
  const idle=sim.visible&&!sim.moving&&!sim.working&&!sim.carrying;
  let action=sim.working?sim.action:null,moving=false;
  if(!ctx.enabled||!idle){
   // back to the real job: leave the house / chat circle and catch up with the simulated worker
   p.idleSince=null;p.plan=null;p.group=null;p.spot=null;p.inside=false;
   const far=Math.hypot(sim.x-p.x,sim.z-p.z);
   if(!ctx.enabled||far>25||!sim.visible){p.x=sim.x;p.z=sim.z;p.heading=sim.heading||0;moving=!!sim.moving;}
   else{const catching=moveToward(p,sim,Math.max(CATCH_UP,far*3),dt);moving=!!sim.moving||catching;if(!catching&&!sim.moving)p.heading=sim.heading||p.heading;}
   frame.push(p);return {x:p.x,z:p.z,heading:p.heading,moving,action,hidden:false};
  }
  p.idleSince??=ctx.time;
  if(ctx.time-p.idleSince<IDLE_DELAY){frame.push(p);return {x:p.x,z:p.z,heading:p.heading,moving:false,action:null,hidden:p.inside};}
  if(!p.plan){
   p.planAt=ctx.time;
   const roll=hash(id+':'+Math.floor(ctx.time/90))%100;
   p.plan=ctx.night?'home':roll<62?'chat':'home';
  }
  if(p.plan==='home'){
   if(!p.home){let best=null,bd=Infinity;for(const h of ctx.homes){const d=Math.hypot(h.x-p.x,h.z-p.z);if(d<bd&&!blocked(ctx.open,p,h)){bd=d;best=h;}}p.home=best||null;if(!best)p.plan='stay';}
   if(p.home&&!p.inside){moving=moveToward(p,p.home,WALK,dt);if(!moving)p.inside=true;}
   frame.push(p);return {x:p.x,z:p.z,heading:p.heading,moving,action:null,hidden:p.inside};
  }
  if(p.plan==='chat'&&p.group&&p.spot){
   moving=moveToward(p,p.spot,WALK,dt);
   if(!moving){p.heading=Math.atan2(p.group.centre.x-p.x,p.group.centre.z-p.z);action='talk';}
   frame.push(p);return {x:p.x,z:p.z,heading:p.heading,moving,action,hidden:false};
  }
  // waiting for a partner / nowhere to go: look around, shift weight
  frame.push(p);return {x:p.x,z:p.z,heading:p.heading+.6*Math.sin(ctx.time*.3+hash(id)%10),moving:false,action:null,hidden:p.inside};
 }
 // personal space: one relaxation pass per frame, walkers yield to workers and talkers
 function separate(ctx){
  const list=frame.filter(p=>!p.inside);
  for(let i=0;i<list.length;i++)for(let j=i+1;j<list.length;j++){
   const a=list[i],b=list[j],dx=b.x-a.x,dz=b.z-a.z,d=Math.hypot(dx,dz);if(d>=RADIUS*2||d<1e-4)continue;
   const push=(RADIUS*2-d)/2,nx=dx/d,nz=dz/d,wa=a.anchor?.15:1,wb=b.anchor?.15:1,s=wa+wb;
   const ax=a.x-nx*push*2*wa/s,az=a.z-nz*push*2*wa/s,bx=b.x+nx*push*2*wb/s,bz=b.z+nz*push*2*wb/s;
   if(ctx.open(ax,az)){a.x=ax;a.z=az;}if(ctx.open(bx,bz)){b.x=bx;b.z=bz;}
  }
 }
 return {
  begin,step,
  finish(ctx){separate(ctx);for(const [id,p] of people)if(ctx.time-p.seen>5)people.delete(id);},
  anchor(id,on){const p=people.get(id);if(p)p.anchor=on;},
  position(id){const p=people.get(id);return p?{x:+p.x.toFixed(2),z:+p.z.toFixed(2),plan:p.plan,group:p.group?.members?.length||0,home:p.home,inside:p.inside,idle:p.isIdle,idleSince:p.idleSince}:null;},
  // hand-held light at night (torch in the right hand)
  handLight(model,show,age){
   let light=model.userData.handLightV252;
   if(show&&!light&&handLightKindV252(age)){
    light=handTorch();const hand=model.children[0]?.userData?.rig?.bones?.hand_R;
    if(hand){hand.add(light);light.position.set(0,-.02,.04);light.rotation.set(-.4,0,0);}else{model.add(light);light.position.set(-.25,.9,.25);}
    model.userData.handLightV252=light;
   }
   if(light)light.visible=!!show;
  },
  clear(){people.clear();frame=[];lastTime=null;}
 };
}
