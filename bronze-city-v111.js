import {wallProfile} from './siege-rules-v114.js?v=114a';
import {createDestructionModel} from './destruction-v113.js';
// Late Bronze Age fortified town, inspired by Hattusa; game-scale, not a site reconstruction.
import * as T from './vendor/three.module.js';
const cache=new Map(),mats=new Map();
function material(color){if(!mats.has(color))mats.set(color,new T.MeshStandardMaterial({color,roughness:1}));return mats.get(color);}
function box(g,x,y,z,w,h,d,color){const o=new T.Mesh(new T.BoxGeometry(w,h,d),material(color));o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;g.add(o);return o;}
const stone='#a89d85',clay='#ceb18a',wood='#70503a';
function masonry(g,w,h,d){box(g,0,h/2,0,w,h,d,stone);for(let row=0;row<Math.ceil(h/.65);row++)for(let x=-w/2+.5;x<w/2;x+=1.05){box(g,x+(row%2)*.3,row*.65+.3,d/2+.025,.94,.55,.1,row%2?'#b9ad93':'#9b927e');box(g,x+(row%2)*.3,row*.65+.3,-d/2-.025,.94,.55,.1,row%2?'#afa48a':'#a0957e');}}
function parapet(g,w,d,y,closed=false){if(closed)for(const x of [-w/2,w/2]){box(g,x,y+.35,0,.35,.7,d,clay);for(let z=-d/2+.4;z<d/2;z+=1.15)box(g,x,y+.95,z,.4,.7,.65,clay);}for(const z of [-d/2,d/2]){box(g,0,y+.35,z,w,.7,.35,clay);for(let x=-w/2+.4;x<w/2;x+=1.15)box(g,x,y+.95,z,.65,.7,.4,clay);}}
// Merge static blocks by material once per cached template, keeping phones at
// a handful of draw calls per building instead of one per masonry stone.
function compile(g){g.updateMatrixWorld(true);const groups=new Map();g.traverse(o=>{if(!o.isMesh)return;const geo=o.geometry.toNonIndexed();geo.applyMatrix4(o.matrixWorld);const key=o.material.uuid;if(!groups.has(key))groups.set(key,{material:o.material,list:[]});groups.get(key).list.push(geo);});const out=new T.Group();out.userData={...g.userData};for(const {material,list}of groups.values()){const total=list.reduce((n,a)=>n+a.attributes.position.count,0),geo=new T.BufferGeometry();for(const [key,size]of [['position',3],['normal',3],['uv',2]]){const data=new Float32Array(total*size);let offset=0;for(const a of list){if(a.attributes[key])data.set(a.attributes[key].array,offset*size);offset+=a.attributes.position.count;}geo.setAttribute(key,new T.BufferAttribute(data,size));}geo.computeBoundingSphere();geo.userData.shared=true;const m=new T.Mesh(geo,material);m.castShadow=m.receiveShadow=true;out.add(m);for(const a of list)a.dispose();}g.traverse(o=>o.geometry?.dispose());return out;}
export function createBronzeCityModel(type,team=1,stage=0){
 if(stage&&type==='palisade'){const g=new T.Group();for(let i=0;i<12;i++){const x=(i%6-2.5)*1.05,z=(i<6?-1:1);const o=box(g,x,.2,z,1.5,.25,.3,wood);o.rotation.y=i*.7;}if(stage<3)for(let i=0;i<12;i++){const x=-3.2+i*.56,h=(stage===1?2.8:1.3)+(i%3)*.18;box(g,x,h/2,-1.35,.32,h,.35,wood);}const out=compile(g);out.userData.destruction=true;out.userData.destructionKind=type;out.userData.damageStage=stage;return out;}
 if(stage&&['palisade','stonewall','reinforced_wall','stonetower','gatehouse'].includes(type)){const g=createDestructionModel(type==='palisade'?'gatehouse':type==='reinforced_wall'?'stonewall':type,stage);g.scale.y=(wallProfile(type)?.height||3.8)/3.8;const root=new T.Group();root.userData={...g.userData};root.add(g);return root;}
 if(!['palisade','stonewall','reinforced_wall','stonetower','gatehouse'].includes(type))return null;
 const key=type+team;if(cache.has(key))return cache.get(key).clone(true);const g=new T.Group();g.userData.bronzeFortification=true;
 if(type==='stonewall'||type==='reinforced_wall'){const h=wallProfile(type).height;masonry(g,7,h,2.8);box(g,0,h-.08,0,7,.16,3,stone);parapet(g,7,2.8,h);}
 if(type==='palisade'){for(let x=-3.3;x<=3.4;x+=.38){box(g,x,1.8,-1.35,.32,3.6,.35,wood);box(g,x,1.8,1.35,.32,3.6,.35,wood);}box(g,0,2.3,0,7,.2,2.8,'#9b7c50');for(const x of [-2.7,0,2.7])box(g,x,1.15,0,.24,2.3,2.6,wood);}
 if(type==='stonetower'){masonry(g,4.6,3.8,4.6);for(const a of [-1.45,1.45])for(const edge of [-2,2]){box(g,a,4.9,edge,1.4,2.2,.4,clay);box(g,edge,4.9,a,.4,2.2,1.4,clay);}box(g,0,6.1,0,4.3,.6,4.3,clay);parapet(g,4.7,4.7,6.4,true);for(const z of [-2.17,2.17])for(const x of [-1,1])box(g,x,5.2,z,.24,.75,.08,'#403c30');}
 if(type==='gatehouse'){for(const x of [-2.55,2.55]){const t=new T.Group();masonry(t,1.9,3.8,4.4);box(t,0,5,0,1.9,2.4,4.4,clay);parapet(t,2,4.5,6.2,true);t.position.x=x;g.add(t);}box(g,0,3.6,0,3.2,.4,4.4,stone);for(const x of [-.78,.78]){box(g,x,1.8,0,1.5,3.6,.3,wood);for(const y of [.65,2.7])box(g,x,y,-.2,1.45,.16,.12,'#ab8854');}parapet(g,3.2,4.4,3.8);}
 const result=compile(g);cache.set(key,result);return result.clone(true);
}
export function createBronzeTownHouse(type,team=1){
 if(!['house','hall','warehouse','cellar','market','study','barracks','bronze_foundry','pottery_kiln','well'].includes(type))return null;
 const key='town:'+type+team;if(cache.has(key))return cache.get(key).clone(true);const g=new T.Group(),large=['hall','warehouse','barracks','study'].includes(type),w=large?7:4.6,d=large?5.5:4,h=type==='hall'?5:large?3.8:2.8;
 if(type==='well'){masonry(g,2,.8,2);for(const x of [-1.2,1.2])box(g,x,1.8,0,.18,3.6,.18,wood);box(g,0,3.5,0,2.6,.2,.25,wood);}
 else{masonry(g,w,.6,d);box(g,0,h/2+.3,0,w,h-.6,d,clay);box(g,0,h,0,w+.4,.3,d+.4,'#b69b72');for(const z of [-d/2,d/2])box(g,0,h+.4,z,w+.4,.5,.2,clay);for(const x of [-w/2,w/2])box(g,x,h+.4,0,.2,.5,d,clay);box(g,0,1, d/2+.03,1.1,2,.1,'#473b2b');for(const x of [-w*.3,w*.3])box(g,x,2.1,d/2+.04,.5,.55,.1,'#584732');for(let x=-w/2+.4;x<w/2;x+=1.1)box(g,x,h-.25,d/2+.15,.18,.22,.55,wood);
 if(type==='market'){for(const x of [-3,3])box(g,x,1.5,3,.13,3,.13,wood);box(g,0,3,3,6.4,.15,3,'#caba94');for(const x of [-2,0,2])box(g,x,.7,3.5,1.4,1.4,1,'#b28d5b');}
 if(type==='bronze_foundry'||type==='pottery_kiln'){const f=new T.Mesh(new T.CylinderGeometry(.8,1.2,2.3,10),material('#a67651'));f.position.set(2,1.15,2);g.add(f);box(g,2,.6,3,.55,.8,.1,'#dc853b');}
 if(type==='hall'){for(const x of [-3,0,3])box(g,x,2,3.5,.3,4,.3,stone);box(g,0,4,3.5,7,.3,2,clay);}}
 g.userData.bronzeTown=true;const result=compile(g);cache.set(key,result);return result.clone(true);
}

export function createWallStairs(height=3.8){const g=new T.Group();for(let i=0;i<14;i++)box(g,0,(i+1)*height/28,-i*.5,2.3,(i+1)*height/14,.52,stone);return g;}
