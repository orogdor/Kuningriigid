// V255: the herder takes the flock out in the morning, grazes it across open ground during the day and
// brings it back to the pasture pen in the evening; at night herder and sheep are inside.
// Drawing layer: the pasture's production and its worker timing are unchanged. The herder figure is
// the pasture's own worker, drawn out with the flock while the flock is out.
// The sheep model is a small procedural placeholder. It is meant to be replaced by a TRELLIS.2
// (MIT licence) model once one is generated; see MUUDATUSED_V255.md for how.
import * as T from './vendor/three.module.js';

const wool=new T.MeshStandardMaterial({color:'#e8e1cf',roughness:1}),woolDark=new T.MeshStandardMaterial({color:'#5b4a3a',roughness:1}),
 face=new T.MeshStandardMaterial({color:'#3b2f27',roughness:.9}),horn=new T.MeshStandardMaterial({color:'#b9a98a',roughness:.8});
const G={body:new T.SphereGeometry(.55,10,8),head:new T.SphereGeometry(.2,8,6),leg:new T.CylinderGeometry(.06,.05,.42,6),ear:new T.SphereGeometry(.08,6,4),horn:new T.TorusGeometry(.1,.03,5,8,Math.PI*1.3)};
for(const g of Object.values(G))g.userData.shared=true;
export function createSheepV255(seed=0){
 const root=new T.Group();root.name='V255 sheep';
 const body=new T.Group();root.add(body);
 const m=(geo,mat,x,y,z,sx=1,sy=1,sz=1)=>{const o=new T.Mesh(geo,mat);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.castShadow=true;body.add(o);return o;};
 const coat=(seed%5===0)?woolDark:wool;
 m(G.body,coat,0,.62,0,1,.78,1.35);
 const head=new T.Group();head.position.set(0,.78,.66);body.add(head);
 const h=new T.Mesh(G.head,face);h.scale.set(1,1,1.3);h.castShadow=true;head.add(h);
 for(const s of [-1,1]){const e=new T.Mesh(G.ear,face);e.position.set(s*.17,.08,-.05);e.scale.set(1.3,.6,.8);head.add(e);const hr=new T.Mesh(G.horn,horn);hr.position.set(s*.12,.1,-.08);hr.rotation.set(0,s*Math.PI/2,0);head.add(hr);}
 const legs=[];for(const [x,z] of [[-.22,.4],[.22,.4],[-.22,-.4],[.22,-.4]]){const l=m(G.leg,face,x,.21,z);legs.push(l);}
 root.userData={body,head,legs,phase:seed*1.7};
 const s=.75+((seed*37)%10)/40;root.scale.setScalar(s);
 return root;
}
export function poseSheepV255(sheep,time,moving){
 const u=sheep.userData,t=time+u.phase;
 u.legs.forEach((l,i)=>{l.rotation.x=moving?Math.sin(t*9+(i%2?Math.PI:0)+(i>1?Math.PI:0))*.5:0;});
 u.head.rotation.x=moving?0:.55+.15*Math.sin(t*1.3); // grazing: head down, nibbling
 u.body.position.y=moving?Math.abs(Math.sin(t*9))*.04:0;
}

const FLOCK=6;
// day plan in game hours: out 6:30-8:00, graze 8:00-17:30, home 17:30-19:00, inside otherwise
function phaseOf(hour){return hour<6.5||hour>=19?'inside':hour<8?'out':hour<17.5?'graze':'home';}

export function createHerdingV255(parent){
 const herds=new Map();
 function grazeSpot(nav,start,seed){
  for(let k=0;k<24;k++){const a=seed*2.4+k*.785,d=24+(k%3)*6,p={x:start.x+Math.cos(a)*d,z:start.z+Math.sin(a)*d};
   const n=nav.nearest(p,6);if(n&&nav.reachable(start,n)){let open=0;for(let dz=-3;dz<=3;dz+=3)for(let dx=-3;dx<=3;dx+=3)if(nav.open(n.x+dx,n.z+dz))open++;if(open>=7)return n;}}
  return null;
 }
 function along(path,f){ // point at fraction f of a polyline
  if(!path?.length)return null;if(path.length===1)return {...path[0],heading:0};
  let total=0;const segs=[];for(let i=1;i<path.length;i++){const l=Math.hypot(path[i].x-path[i-1].x,path[i].z-path[i-1].z);segs.push(l);total+=l;}
  let want=Math.max(0,Math.min(1,f))*total;for(let i=0;i<segs.length;i++){if(want<=segs[i]||i===segs.length-1){const k=segs[i]?Math.min(1,want/segs[i]):1,a=path[i],b=path[i+1];return {x:a.x+(b.x-a.x)*k,z:a.z+(b.z-a.z)*k,heading:Math.atan2(b.x-a.x,b.z-a.z)};}want-=segs[i];}
  return {...path[path.length-1],heading:0};
 }
 return {
  // pastures: [{key, door:{x,z}}]; makeHerder(): a figure group with userData.animate(time,moving,action)
  update({pastures,nav,time,hour,ground,makeHerder}){
   const seen=new Set();
   for(const p of pastures){
    seen.add(p.key);let h=herds.get(p.key);
    if(!h){const group=new T.Group();group.name='V255 herd '+p.key;parent.add(group);
     const sheep=Array.from({length:FLOCK},(_,i)=>{const s=createSheepV255(i+p.key.length);group.add(s);return s;});
     h={group,sheep,herder:makeHerder(),day:-1,spot:null,path:null,lastTime:null,offsets:sheep.map((_,i)=>({a:i*1.05,r:1.6+(i%3)*.9}))};group.add(h.herder);herds.set(p.key,h);}
    const dt=h.lastTime==null?0:Math.max(0,Math.min(.25,time-h.lastTime));h.lastTime=time;
    const day=Math.floor((time/60+8)/24),phase=phaseOf(hour);
    if(h.day!==day){h.day=day;h.spot=grazeSpot(nav,p.door,day+p.key.length);h.path=h.spot?nav.route(p.door,h.spot,{preferRoads:false}):null;}
    const out=phase!=='inside'&&h.spot&&h.path;
    h.group.visible=!!out;h.active=!!out;if(!out)continue;
    let pos,moving=false;
    if(phase==='out'){pos=along(h.path,(hour-6.5)/1.5);moving=true;}
    else if(phase==='home'){pos=along([...h.path].reverse(),(hour-17.5)/1.5);moving=true;}
    else{ // slow grazing loop around the spot, short pauses
     const u=(hour-8)*1.4,step=Math.floor(u),f=u-step,ang=(step*2.1+day)%6.283,ang2=((step+1)*2.1+day)%6.283;
     const a={x:h.spot.x+Math.cos(ang)*4,z:h.spot.z+Math.sin(ang)*4},b={x:h.spot.x+Math.cos(ang2)*4,z:h.spot.z+Math.sin(ang2)*4};
     const k=Math.min(1,f/.45);pos={x:a.x+(b.x-a.x)*k,z:a.z+(b.z-a.z)*k,heading:Math.atan2(b.x-a.x,b.z-a.z)};moving=k<1&&nav.open(pos.x,pos.z);
    }
    h.herder.position.set(pos.x,ground(pos.x,pos.z),pos.z);h.herder.rotation.y=pos.heading;
    h.herder.userData.animate?.(time,moving,moving?null:'herd');
    // the flock trails behind the herder while walking and spreads out to graze while he waits
    h.sheep.forEach((s,i)=>{const o=h.offsets[i],spread=moving?1:1.8,back=moving?-2.2-(i%3)*.8:0;
     const sx=pos.x+Math.sin(pos.heading)*back+Math.cos(o.a+time*.05)*o.r*spread,sz=pos.z+Math.cos(pos.heading)*back+Math.sin(o.a+time*.05)*o.r*spread;
     const prev=s.position,dx=sx-prev.x,dz=sz-prev.z,d=Math.hypot(dx,dz);
     let x=sx,z=sz;if(s.userData.placed&&d<6){const k=Math.min(1,(moving?4:.6)*dt/Math.max(d,1e-3));x=prev.x+dx*k;z=prev.z+dz*k;}
     if(!nav.open(x,z)){x=prev.x;z=prev.z;}
     const walking=Math.hypot(x-prev.x,z-prev.z)>.01;if(walking)s.rotation.y=Math.atan2(x-prev.x,z-prev.z);
     s.position.set(x,ground(x,z),z);s.userData.placed=true;poseSheepV255(s,time,walking);});
   }
   for(const [k,h] of herds)if(!seen.has(k)){h.group.removeFromParent();herds.delete(k);}
  },
  // is the herder of this pasture out with the flock (then the worker figure at the pen is hidden)
  isOut(key){return !!herds.get(key)?.active;},
  clear(){for(const h of herds.values())h.group.removeFromParent();herds.clear();}
 };
}
