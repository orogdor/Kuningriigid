// V255: game animals are shy and hunters really hunt (drawing layer; the economy keeps its own timing).
//  - Each game animal grazes and wanders around its resource spot (head down, slow steps).
//  - Any person who comes within FLEE_RANGE startles it: it bolts away from that person, keeps running
//    to a safe distance, then drifts back to its spot when nobody is near.
//  - A hunter who has chosen the animal does not startle it: in the last STALK_RANGE he creeps up
//    crouched (the worker layer draws that), throws his spear when he starts working, and the animal
//    drops and lies still until the hunter carries the meat home; then the herd's next animal appears.
// Nothing here changes resource amounts, positions in the save, or worker timing.
const FLEE_RANGE=9,SAFE_RANGE=17,STALK_RANGE=14,WANDER=3.2;
const hash=n=>{let h=Math.imul(n|0,2654435761)>>>0;h^=h>>>15;return (h>>>0)/4294967296;};
// The deer GLBs and fallback face +X; travel headings use +Z as forward.
export const wildlifeVisualHeadingV257=heading=>heading-Math.PI/2;

export function createWildlifeV255(){
 const animals=new Map();
 function state(r){let a=animals.get(r.id);if(!a){a={x:r.x,z:r.z,heading:hash(r.id)*6.28,mode:'graze',goal:null,until:0,shot:-1};animals.set(r.id,a);}return a;}
 function pickGraze(a,r,t){const k=Math.floor(t/7+r.id*3.1),ang=hash(k*7+r.id)*6.283,d=hash(k*13+r.id*5)*WANDER;return {x:r.x+Math.cos(ang)*d,z:r.z+Math.sin(ang)*d};}
 function step(a,goal,speed,dt,open){const dx=goal.x-a.x,dz=goal.z-a.z,d=Math.hypot(dx,dz);if(d<.08)return false;const k=Math.min(1,speed*dt/d),nx=a.x+dx*k,nz=a.z+dz*k;if(open&&!open(nx,nz))return false;a.x=nx;a.z=nz;a.heading=Math.atan2(dx,dz);return d>.25;}
 return {
  // r: the game resource; ctx: {time, dt, people:[{x,z}], hunters:[{resourceId,phase,x,z,working,workStart}], open}
  update(r,ctx){
   const a=state(r),t=ctx.time,dt=ctx.dt;
   const hunter=ctx.hunters.find(h=>h.resourceId===r.id);
   let moving=false,running=false,lying=false;
   if(hunter&&hunter.phase==='work'){ // the spear flies about a second after the throw starts
    if(a.shot<0)a.shot=t;
    lying=t-a.shot>1.1;
   }else if(hunter&&hunter.phase==='return'){lying=true;}
   else{
    if(a.shot>=0&&!hunter){a.shot=-1;a.x=r.x+1.5;a.z=r.z-1;a.mode='graze';} // the next animal of the herd
    a.shot=-1;
    // startled by people who are not stalking it
    let threat=null,td=Infinity;
    for(const p of ctx.people){if(hunter&&p.hunterOf===r.id)continue;const d=Math.hypot(p.x-a.x,p.z-a.z);if(d<td){td=d;threat=p;}}
    if(threat&&td<FLEE_RANGE){a.mode='flee';a.from={x:threat.x,z:threat.z};a.until=t+3;}
    if(a.mode==='flee'){
     let dx=a.x-a.from.x,dz=a.z-a.from.z,d=Math.hypot(dx,dz);
     if(d<1e-6){dx=Math.sin(a.heading);dz=Math.cos(a.heading);d=1;}
     const goal={x:a.x+dx/d*3,z:a.z+dz/d*3};
     running=step(a,goal,6.5,dt,ctx.open);moving=running;
     if(!running){const side={x:a.x-dz/d*3,z:a.z+dx/d*3};running=step(a,side,6.5,dt,ctx.open);moving=running;} // blocked: veer sideways
     if(d>SAFE_RANGE||t>a.until+4)a.mode='return';
    }else if(a.mode==='return'){
     moving=step(a,{x:r.x,z:r.z},1.1,dt,ctx.open);if(!moving)a.mode='graze';
    }else{
     a.goal=pickGraze(a,r,t);moving=step(a,a.goal,.55,dt,ctx.open);
    }
   }
   return {x:a.x,z:a.z,heading:a.heading,moving,running,lying,grazing:!moving&&!lying};
  },
  // pose the deer model: grazing dips the body forward, running bounds, a shot animal lies on its side
  pose(model,s,time,seed=0){
   const body=model.children[0]||model;
   // The deer model faces +X. Roll about its length when down; pitch about Z
   // for grazing, instead of leaning sideways while it feeds.
   if(s.lying){body.rotation.set(Math.PI/2*.92,0,0);body.position.y=.35;return;}
   body.position.y=s.running?Math.abs(Math.sin(time*9+seed))*.35:0;
   body.rotation.set(0,0,s.grazing?-.18-.06*Math.sin(time*.9+seed):s.running?.08*Math.sin(time*9+seed):0);
  },
  clear(){animals.clear();}
 };
}
