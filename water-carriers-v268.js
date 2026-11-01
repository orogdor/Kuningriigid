// V268: when a town has no well (V267: water is carried from the river), two villagers with jugs walk
// from the hall to the nearest river bank, fill the jugs and carry them back, all day long.
// Drawing layer only: the economy already credits the water (civilization-core consumeHouseholds).
import * as T from './vendor/three.module.js';

const CARRIERS=2,FILL=3.5,REST=4;
function along(path,f){
 if(!path?.length)return null;if(path.length===1)return {...path[0],heading:0};
 let total=0;const seg=[];for(let i=1;i<path.length;i++){const l=Math.hypot(path[i].x-path[i-1].x,path[i].z-path[i-1].z);seg.push(l);total+=l;}
 let want=Math.max(0,Math.min(1,f))*total;
 for(let i=0;i<seg.length;i++){if(want<=seg[i]||i===seg.length-1){const k=seg[i]?Math.min(1,want/seg[i]):1,a=path[i],b=path[i+1];return {x:a.x+(b.x-a.x)*k,z:a.z+(b.z-a.z)*k,heading:Math.atan2(b.x-a.x,b.z-a.z)};}want-=seg[i];}
 return {...path[path.length-1],heading:0};
}
// nearest point of the local river meshes (sampled vertices, world space)
export function nearestRiverPointV268(rivers,from){
 if(!rivers)return null;let best=null,bd=Infinity;const v=new T.Vector3();
 rivers.updateMatrixWorld(true);
 rivers.traverse(o=>{const p=o.geometry?.getAttribute?.('position');if(!o.isMesh||!p)return;const step=Math.max(1,Math.floor(p.count/600));
  for(let i=0;i<p.count;i+=step){v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);const d=Math.hypot(v.x-from.x,v.z-from.z);if(d<bd){bd=d;best={x:v.x,z:v.z,d};}}});
 return best;
}
export function createWaterCarriersV268(parent){
 let state=null;
 function clear(){if(state){state.group.removeFromParent();state=null;}}
 return {
  // opts: {key, active, door:{x,z}, river:{x,z}|null, nav, time, ground, makeCarrier}
  update({key,active,door,river,nav,time,ground,makeCarrier}){
   if(!active||!river||!door){clear();return;}
   if(!state||state.key!==key){
    clear();
    // stand on the bank: the walkable cell closest to the water
    const bank=nav.nearest({x:river.x,z:river.z},10)||river;
    const path=nav.route(door,bank,{preferRoads:true})||[door,bank];
    const len=path.reduce((s,p,i)=>i?s+Math.hypot(p.x-path[i-1].x,p.z-path[i-1].z):0,0);
    const group=new T.Group();group.name='V268 water carriers';parent.add(group);
    state={key,group,path,back:[...path].reverse(),walk:Math.max(4,len/1.6),carriers:Array.from({length:CARRIERS},(_,i)=>{const m=makeCarrier();group.add(m);return {m,offset:i*.5};})};
   }
   const {path,back,walk}=state,cycle=walk*2+FILL+REST;
   for(const c of state.carriers){
    const t=((time/cycle)+c.offset)%1*cycle;let pos,moving=false,action=null;
    if(t<walk){pos=along(path,t/walk);moving=true;}
    else if(t<walk+FILL){pos=along(path,1);pos.heading=Math.atan2(river.x-pos.x,river.z-pos.z);action='work';}
    else if(t<walk*2+FILL){pos=along(back,(t-walk-FILL)/walk);moving=true;action='carry';}
    else{pos=along(back,1);action=null;}
    c.m.visible=t<walk*2+FILL; // resting carriers are inside the hall
    c.m.position.set(pos.x,ground(pos.x,pos.z),pos.z);c.m.rotation.y=pos.heading;
    c.m.userData.animate?.(time,moving,action);
   }
  },
  clear
 };
}
