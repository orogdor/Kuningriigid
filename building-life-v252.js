// V252: Stone Age building life. Every Stone Age building gets small animated props that match its
// trade: hearth smoke, camp fires, a clay bucket on a tripod, a turning pottery wheel and kiln fire,
// stone dust, an axe on a chopping block, a well bucket, hides and fish swaying on drying racks,
// a swinging archery target, a turning training post, a flag and a night brazier on the watchtower.
// Props are parented to the building model (so they rotate with it) and placed from the model's own
// bounding box (doors face +Z). Visual only: no gameplay, save or navigation data is touched.
import * as T from './vendor/three.module.js';
import {createFireV252,tickFireV252} from './daynight-v235.js';

const MAT={
 wood:new T.MeshStandardMaterial({color:'#6b4a2f',roughness:.95}),
 darkWood:new T.MeshStandardMaterial({color:'#3f2d1f',roughness:1}),
 hide:new T.MeshStandardMaterial({color:'#a5825c',roughness:1,side:T.DoubleSide}),
 hideDark:new T.MeshStandardMaterial({color:'#7d5e40',roughness:1,side:T.DoubleSide}),
 clay:new T.MeshStandardMaterial({color:'#a8693f',roughness:.9}),
 wetClay:new T.MeshStandardMaterial({color:'#7c5236',roughness:.6}),
 stone:new T.MeshStandardMaterial({color:'#8d8a80',roughness:.95}),
 fish:new T.MeshStandardMaterial({color:'#9aa3a3',roughness:.5,metalness:.15}),
 straw:new T.MeshStandardMaterial({color:'#c9b06a',roughness:1}),
 cloth:new T.MeshStandardMaterial({color:'#b5523a',roughness:.9,side:T.DoubleSide}),
 ember:new T.MeshStandardMaterial({color:'#3a1d10',emissive:'#d8481a',emissiveIntensity:.9,roughness:1}),
 water:new T.MeshStandardMaterial({color:'#4f7f88',roughness:.15,metalness:.05}),
 rope:new T.MeshStandardMaterial({color:'#b29a6e',roughness:1}),
 targetRing:new T.MeshStandardMaterial({color:'#d8c9a2',roughness:1}),
 targetRed:new T.MeshStandardMaterial({color:'#9c3a2a',roughness:1})
};
const GEO={
 cyl:new T.CylinderGeometry(1,1,1,8),box:new T.BoxGeometry(1,1,1),sphere:new T.SphereGeometry(1,8,6),
 cone:new T.ConeGeometry(1,1,7),plane:new T.PlaneGeometry(1,1),disc:new T.CylinderGeometry(1,1,1,16),
 torus:new T.TorusGeometry(1,.08,6,16)
};
for(const g of Object.values(GEO))g.userData.shared=true;
function part(parent,geo,mat,x,y,z,sx,sy,sz,rx=0,ry=0,rz=0){const m=new T.Mesh(GEO[geo],MAT[mat]);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.rotation.set(rx,ry,rz);m.castShadow=true;parent.add(m);return m;}
function rod(parent,a,b,r=.05,mat='wood'){const d=new T.Vector3(b[0]-a[0],b[1]-a[1],b[2]-a[2]),len=d.length();const m=new T.Mesh(GEO.cyl,MAT[mat]);m.scale.set(r,len,r);m.position.set((a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());m.castShadow=true;parent.add(m);return m;}

// ---- shared animated pieces
const smokeMat=new T.MeshBasicMaterial({color:0xb4b0a6,transparent:true,opacity:.16,depthWrite:false});
function smoke(parent,x,y,z,{puffs=5,size=1,rise=2.2}={}){
 const g=new T.Group();g.position.set(x,y,z);
 for(let i=0;i<puffs;i++){const m=new T.Mesh(GEO.sphere,smokeMat.clone());g.add(m);}
 parent.add(g);
 return {node:g,update(t,on,strength=1){g.visible=on;if(!on)return;g.children.forEach((p,i)=>{const f=(t*.22+i/g.children.length)%1;p.position.set(f*.5*size+Math.sin(t*.3+i)*.08,f*rise*size,Math.sin(i+t*.17)*.1);p.scale.setScalar((.12+f*.42)*size);p.material.opacity=(1-f)*.2*strength;});}};
}
function fire(parent,x,y,z,scale=1){
 const g=new T.Group();g.position.set(x,y,z);
 for(let i=0;i<5;i++){const a=i*Math.PI*2/5;part(g,'cyl','darkWood',Math.cos(a)*.18*scale,.06*scale,Math.sin(a)*.18*scale,.05*scale,.55*scale,.05*scale,Math.PI/2.4,a,0);}
 for(let i=0;i<7;i++){const a=i*Math.PI*2/7;part(g,'sphere','stone',Math.cos(a)*.42*scale,.06*scale,Math.sin(a)*.42*scale,.12*scale,.09*scale,.12*scale);}
 const ember=part(g,'sphere','ember',0,.04*scale,0,.22*scale,.07*scale,.22*scale);
 const flame=createFireV252(.9*scale);flame.position.y=.05*scale;g.add(flame);
 parent.add(g);
 return {node:g,flame,update(t,on,size=1){flame.visible=on;flame.scale.setScalar(size*(1+.08*Math.sin(t*9)+.05*Math.sin(t*14.3)));ember.material.emissiveIntensity=on?.7+.3*Math.sin(t*6.1):.25;}};
}
const swing=(node,axis,amp,speed,phase=0)=>t=>{node.rotation[axis]=Math.sin(t*speed+phase)*amp;};

// ---- one recipe per Stone Age building type. Each returns update(t, active, ctx) functions.
// box = model bounds: {minX,maxX,minZ,maxZ,top}; front is +Z (door side).
const RECIPES={
 house(g,box){ // hearth smoke through the roof all day, thicker in the cold morning and evening
  const s=smoke(g,box.cx+(box.maxX-box.cx)*.25,box.top*.92,box.cz,{size:1,rise:2.4});
  return [(t,active,c)=>s.update(t,true,c.cosy?1.4:.8)];
 },
 hall(g,box){ // the village fire in front of the chief's hall, smoke from the roof
  const f=fire(g,box.cx+1.6,0,box.maxZ+1.7,1.15),s=smoke(g,box.cx,box.top*.95,box.cz,{size:1.2});
  return [(t,active,c)=>{f.update(t,true,c.night?1.25:.85);s.update(t,true,1);}];
 },
 claypit(g,box){ // a wooden tripod over the pit: a bucket of wet clay goes up and down
  const x=box.maxX-.8,z=box.maxZ-.4,h=2.4;
  for(const a of [0,2.1,4.2])rod(g,[x+Math.cos(a)*.9,0,z+Math.sin(a)*.9],[x,h,z],.05);
  const rope=rod(g,[x,h,z],[x,h-1,z],.012,'rope');
  const bucket=new T.Group();g.add(bucket);part(bucket,'cyl','wood',0,0,0,.22,.32,.22);part(bucket,'cyl','wetClay',0,.16,0,.19,.02,.19);
  part(g,'cyl','wetClay',x,.02,z,.75,.04,.75);
  return [(t,active)=>{const k=active?(Math.sin(t*1.4)+1)/2:0,y=h-1.05-k*1.0;bucket.position.set(x,y-.16,z);rope.scale.y=h-y;rope.position.y=(h+y)/2;}];
 },
 pottery_kiln(g,box){ // a hand-turned wheel by the door; kiln fire and smoke while firing
  const x=box.maxX-.9,z=box.maxZ+.4;
  part(g,'cyl','wood',x,.22,z,.08,.44,.08);
  const wheel=new T.Group();wheel.position.set(x,.46,z);g.add(wheel);part(wheel,'disc','wood',0,0,0,.42,.05,.42);
  const pot=part(wheel,'cyl','clay',0,.16,0,.16,.26,.16);part(wheel,'sphere','clay',0,.14,0,.2,.14,.2);
  const f=fire(g,box.minX+.9,0,box.maxZ+.5,.7),s=smoke(g,box.minX+.9,box.top*.85,box.cz,{size:1.1});
  return [(t,active)=>{wheel.rotation.y=active?t*2.4:wheel.rotation.y;pot.visible=true;f.update(t,active,1);s.update(t,active,1.2);}];
 },
 mason(g,box){ // a block on the work floor throws up stone dust under the chisel
  const x=box.maxX-.6,z=box.maxZ+.5;
  part(g,'box','stone',x,.35,z,.9,.7,.7);
  const dust=smoke(g,x-.2,.72,z+.2,{puffs:4,size:.35,rise:1.2});
  const chips=[];for(let i=0;i<5;i++){const c=part(g,'sphere','stone',x,.75,z,.04,.03,.04);chips.push(c);}
  return [(t,active)=>{dust.update(t*3,active,1.5);chips.forEach((c,i)=>{c.visible=active;if(!active)return;const f=(t*1.6+i*.21)%1;c.position.set(x-.2+Math.cos(i*1.7)*f*.7,.75+f*.5-f*f*.9,z+.2+Math.sin(i*1.7)*f*.6);});}];
 },
 study(g,box){ // the elders' ember bowl and thin smoke; drawings on a hide frame
  const f=fire(g,box.minX+1.0,0,box.maxZ+1.0,.55),s=smoke(g,box.cx,box.top*.9,box.cz,{size:.8});
  rod(g,[box.maxX-.4,0,box.maxZ+.3],[box.maxX-.4,1.6,box.maxZ+.3]);rod(g,[box.maxX-1.6,0,box.maxZ+.3],[box.maxX-1.6,1.6,box.maxZ+.3]);
  const hideP=part(g,'plane','hide',box.maxX-1.0,1.05,box.maxZ+.32,1.1,1.0,1);
  return [(t,active,c)=>{f.update(t,true,active?1:.7);s.update(t,true,.8);hideP.rotation.x=Math.sin(t*1.1)*.04;}];
 },
 lumber(g,box){ // axe rises and falls into the chopping block, chips fly
  const x=box.maxX-.6,z=box.maxZ+.6;
  part(g,'cyl','wood',x,.3,z,.32,.6,.32);
  const axe=new T.Group();axe.position.set(x-.05,.62,z);g.add(axe);
  const handle=new T.Group();axe.add(handle);part(handle,'cyl','wood',0,.42,0,.03,.85,.03);part(handle,'box','stone',.07,.78,0,.16,.1,.05);
  const chips=[];for(let i=0;i<4;i++)chips.push(part(g,'box','wood',x,.62,z,.06,.02,.04));
  return [(t,active)=>{const u=(t*.9)%1,up=active?Math.sin(Math.min(1,u/.7)*Math.PI*.5):0,hit=active&&u>.7;handle.rotation.z=active?(hit?-.1:-.1-1.1*up):-.5;
   chips.forEach((c,i)=>{c.visible=active&&u>.7;if(!c.visible)return;const f=(u-.7)/.3;c.position.set(x+Math.cos(i*1.9)*f*.5,.62+f*.4-f*f*.6,z+Math.sin(i*1.9)*f*.5);c.rotation.set(f*6,i,f*4);});}];
 },
 quarry(g,box){ // a wooden pry bar rocks a block loose, dust drifts
  const x=box.maxX-1.0,z=box.maxZ+.4;
  part(g,'box','stone',x,.3,z,1.0,.6,.8);
  const lever=new T.Group();lever.position.set(x+.55,.3,z);g.add(lever);rod(lever,[0,0,0],[1.2,.6,0],.05);
  const dust=smoke(g,x,.6,z,{puffs:4,size:.5,rise:1.4});
  return [(t,active)=>{lever.rotation.z=active?-.15+.18*Math.sin(t*2.2):-.15;dust.update(t*2,active,1.3);}];
 },
 well(g,box){ // the bucket is lowered and drawn up on a rope over a crossbeam
  const x=box.cx,z=box.cz,h=Math.max(1.9,box.top*.85);
  rod(g,[x-.9,0,z],[x-.9,h,z],.06);rod(g,[x+.9,0,z],[x+.9,h,z],.06);rod(g,[x-1,h,z],[x+1,h,z],.05);
  const rope=rod(g,[x,h,z],[x,h-.5,z],.012,'rope');
  const bucket=new T.Group();g.add(bucket);part(bucket,'cyl','wood',0,0,0,.17,.26,.17);part(bucket,'cyl','water',0,.12,0,.15,.01,.15);
  return [(t,active)=>{const k=active?(Math.sin(t*1.1)+1)/2:1,y=h-.45-(1-k)*(h-.2);bucket.position.set(x,Math.max(.15,y),z);rope.scale.y=h-Math.max(.15,y);rope.position.y=(h+Math.max(.15,y))/2;}];
 },
 hunter(g,box){ // hides stretched on a frame stir in the wind; meat smokes over embers while working
  const x=box.maxX-.9,z=box.maxZ+.5;
  rod(g,[x-.8,0,z],[x-.8,1.9,z]);rod(g,[x+.8,0,z],[x+.8,1.9,z]);rod(g,[x-.9,1.85,z],[x+.9,1.85,z],.04);
  const hides=[];for(let i=0;i<2;i++){const piv=new T.Group();piv.position.set(x-.4+i*.8,1.82,z);g.add(piv);part(piv,'plane',i?'hideDark':'hide',0,-.55,0,.7,1.0,1);hides.push(piv);}
  const f=fire(g,box.minX+.8,0,box.maxZ+.8,.5),s=smoke(g,box.minX+.8,.5,box.maxZ+.8,{size:.7,rise:1.8});
  return [(t,active)=>{hides.forEach((h,i)=>{h.rotation.x=Math.sin(t*1.3+i)*.12+.05;h.rotation.z=Math.sin(t*.9+i*2)*.04;});f.update(t,active,1);s.update(t,active,1);}];
 },
 fisher(g,box){ // fish hang drying on a rack and sway; nets lift in the breeze
  const x=box.maxX-.9,z=box.maxZ+.5;
  rod(g,[x-.9,0,z],[x-.9,1.7,z]);rod(g,[x+.9,0,z],[x+.9,1.7,z]);rod(g,[x-1,1.65,z],[x+1,1.65,z],.04);
  const fish=[];for(let i=0;i<5;i++){const piv=new T.Group();piv.position.set(x-.72+i*.36,1.62,z);g.add(piv);rod(piv,[0,0,0],[0,-.25,0],.008,'rope');part(piv,'sphere','fish',0,-.42,0,.06,.18,.03);fish.push(piv);}
  const net=new T.Group();net.position.set(box.minX+.6,1.5,box.maxZ+.3);g.add(net);part(net,'plane','rope',0,-.6,0,1.1,1.2,1);
  return [(t)=>{fish.forEach((f,i)=>{f.rotation.x=Math.sin(t*1.7+i*.8)*.14;f.rotation.z=Math.sin(t*1.2+i)*.08;});net.rotation.x=Math.sin(t*.9)*.08+.04;}];
 },
 farm(g,box){ // sheaves on a drying pole bend in the wind; a scarecrow turns a little
  const x=box.maxX-.7,z=box.maxZ+.6;
  const sheaves=[];for(let i=0;i<3;i++){const piv=new T.Group();piv.position.set(x-.6+i*.6,0,z);g.add(piv);part(piv,'cone','straw',0,.5,0,.22,1.0,.22);sheaves.push(piv);}
  const crow=new T.Group();crow.position.set(box.minX+.6,0,box.maxZ+.8);g.add(crow);rod(crow,[0,0,0],[0,1.7,0],.04);rod(crow,[-.55,1.3,0],[.55,1.3,0],.03);part(crow,'sphere','straw',0,1.75,0,.15,.17,.15);part(crow,'plane','cloth',0,1.15,.02,.7,.55,1);
  return [(t)=>{sheaves.forEach((s,i)=>{s.rotation.z=Math.sin(t*1.1+i*.7)*.07;s.rotation.x=Math.sin(t*.8+i)*.05;});crow.rotation.y=Math.sin(t*.35)*.25;}];
 },
 pasture(g,box){ // a water trough with a rippling surface
  const x=box.maxX-.8,z=box.maxZ+.3;
  part(g,'box','wood',x,.22,z,1.4,.36,.5);const w=part(g,'box','water',x,.39,z,1.25,.02,.38);
  return [(t)=>{w.position.y=.39+.008*Math.sin(t*2.3);}];
 },
 barracks(g,box){ // a padded training post spins when struck
  const x=box.maxX-.7,z=box.maxZ+.8;
  rod(g,[x,0,z],[x,1.3,z],.07);const arm=new T.Group();arm.position.set(x,1.25,z);g.add(arm);rod(arm,[-.6,0,0],[.6,0,0],.05);part(arm,'sphere','hide',.6,0,0,.14,.14,.14);part(arm,'sphere','hide',-.6,0,0,.14,.14,.14);
  return [(t,active)=>{arm.rotation.y=active?t*1.6:arm.rotation.y;}];
 },
 archery(g,box){ // a woven target swings on its frame
  const x=box.maxX-.8,z=box.maxZ+.8;
  rod(g,[x-.7,0,z],[x-.7,1.9,z]);rod(g,[x+.7,0,z],[x+.7,1.9,z]);rod(g,[x-.8,1.85,z],[x+.8,1.85,z],.04);
  const tgt=new T.Group();tgt.position.set(x,1.8,z);g.add(tgt);part(tgt,'disc','straw',0,-.65,0,.45,.08,.45,Math.PI/2);part(tgt,'disc','targetRed',0,-.65,.045,.15,.02,.15,Math.PI/2);part(tgt,'torus','targetRing',0,-.65,.05,.3,.3,.3);
  return [(t,active)=>{tgt.rotation.x=Math.sin(t*(active?2.2:.9))*(active?.16:.04);}];
 },
 watchtower(g,box){ // a hide banner flutters at the top; a brazier burns there at night
  const piv=new T.Group();piv.position.set(box.maxX-.3,box.top+.2,box.cz);g.add(piv);rod(piv,[0,-.4,0],[0,1.3,0],.04);
  const flag=new T.Group();flag.position.set(0,1.1,0);piv.add(flag);part(flag,'plane','cloth',.35,0,0,.7,.4,1);
  const f=fire(g,box.cx,box.top*.9,box.cz,.45);
  return [(t,active,c)=>{flag.rotation.y=Math.sin(t*2.4)*.35;flag.rotation.z=Math.sin(t*3.1)*.06;f.update(t,c.night,1);}];
 },
 forester(g,box){return RECIPES.farm(g,box);},
};

const BOX=new T.Box3();
export const BUILDING_LIFE_TYPES_V252=Object.freeze(Object.keys(RECIPES));
export function attachBuildingLifeV252(model,type){
 const recipe=RECIPES[type];if(!recipe||!model||model.userData.lifeV252)return null;
 BOX.setFromObject(model);if(BOX.isEmpty())return null;
 // bounds in the model's own frame (the model is not yet placed or rotated)
 const box={minX:BOX.min.x-model.position.x,maxX:BOX.max.x-model.position.x,minZ:BOX.min.z-model.position.z,maxZ:BOX.max.z-model.position.z,top:BOX.max.y-model.position.y};
 box.cx=(box.minX+box.maxX)/2;box.cz=(box.minZ+box.maxZ)/2;
 // the props must not grow the building: keep them inside the old footprint, near the front
 box.maxZ=Math.max(box.minZ+1,box.maxZ-1.0);
 const group=new T.Group();group.name='V252 building life: '+type;
 const updates=recipe(group,box);
 group.traverse(o=>{if(o.isMesh)o.receiveShadow=true;});
 model.add(group);
 model.userData.lifeV252={group,updates,type};
 return group;
}
// t: game time (s); active: the building is producing; clock: dayClockV235 output
export function animateBuildingLifeV252(model,t,active,ready,clock){
 const life=model?.userData?.lifeV252;if(!life)return;
 life.group.visible=!!ready;if(!ready)return;
 tickFireV252(t);
 const h=clock?.hour??12,c={night:(clock?.torch??0)>.3,cosy:h<9||h>17};
 for(const u of life.updates)u(t,!!active,c);
}
