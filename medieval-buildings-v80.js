// V80: Medieval-era architectural variants, shared geometries and cached materials.
import * as T from './vendor/three.module.js';
export const MEDIEVAL_TYPES=Object.freeze(['hall','house','warehouse','cellar','market','study','lumber','quarry','hunter','fisher','farm','well','barracks','inn','chapel','monastery','guildhall','keep','gatehouse','watchtower','stonetower','stonewall','watermill','windmill','infirmary','trade_yard','armor_workshop','crossbow_range','master_workshop','siegeworkshop']);
const kinds=new Set(MEDIEVAL_TYPES),cache=new Map();
const mat=(color)=>{if(!cache.has(color))cache.set(color,new T.MeshStandardMaterial({color,roughness:.88}));return cache.get(color)};
function block(g,x,y,z,w,h,d,c){const m=new T.Mesh(new T.BoxGeometry(w,h,d),mat(c));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;g.add(m);return m}
function cone(g,x,y,z,r,h,c,n=4){const m=new T.Mesh(new T.ConeGeometry(r,h,n),mat(c));m.position.set(x,y,z);m.rotation.y=Math.PI/4;m.castShadow=true;g.add(m)}
export function createMedievalBuilding(type,team=0){
 if(!kinds.has(type))return null;
 const g=new T.Group();g.userData.medievalAgeModel=true;g.userData.buildingType=type;
 const stone='#a8a69b',timber='#6e4e37',roof='#665d5c',plaster='#ded0b0',accent=team?'#9b684b':'#566d83';
 const tall=['hall','keep','guildhall','monastery','chapel','stonetower','watchtower'].includes(type);
 const h=tall?7.5:4.7;
 block(g,0,.45,0,9,.9,8,stone);
 block(g,0,h/2+.6,0,7.5,h,6.2,plaster);
 for(const x of [-3.9,3.9]){block(g,x,h/2+.6,0,.45,h,6.6,timber);for(const z of [-2.7,2.7])block(g,x,h/2+.6,z,.6,h,.6,stone)}
 for(const z of [-3.2,3.2]){block(g,0,h/2+.6,z,7.9,h,.35,timber);for(const x of [-2.9,2.9])block(g,x,h/2+.6,z,.55,h,.55,stone)}
 block(g,0,1.8,3.35,1.6,2.9,.28,timber);
 for(const x of [-2.3,2.3]){block(g,x,3.4,3.38,.9,1.3,.22,accent);block(g,x,3.4,3.52,.13,1.6,.22,stone)}
 if(['keep','stonetower','watchtower','gatehouse','stonewall'].includes(type)){
  block(g,0,h+1,0,8.4,1.3,7.3,stone);
  for(const x of [-3.5,-1.2,1.2,3.5])for(const z of [-3.1,3.1])block(g,x,h+2,z,1,1.2,.9,stone);
 }else{
  block(g,-2.05,h+1.5,0,4.4,.4,7.1,roof).rotation.z=Math.PI/5;
  block(g,2.05,h+1.5,0,4.4,.4,7.1,roof).rotation.z=-Math.PI/5;
 }
 const tower=['chapel','monastery','guildhall','hall','keep'].includes(type);
 if(tower){block(g,-2.5,h+3,-2,2.5,5,2.5,stone);cone(g,-2.5,h+6.7,-2,2.1,3.3,roof)}
 if(type==='market'||type==='trade_yard'){for(const x of [-3,3]){block(g,x,2,6,.28,4,.3,timber);block(g,x,4.2,6,4,.4,3,accent)}}
 if(type==='watermill'||type==='windmill'){const wheel=new T.Group();wheel.position.set(4.4,3.6,0);wheel.rotation.z=Math.PI/2;for(let i=0;i<8;i++){const spoke=block(wheel,0,1.5,0,.35,3.5,.3,timber);spoke.rotation.z=i*Math.PI/4}g.add(wheel)}
 if(type==='barracks'||type==='armor_workshop'||type==='crossbow_range'||type==='siegeworkshop'){block(g,-2,1.2,5,4,.8,1.5,timber);block(g,2,2,5,.35,3,.35,accent)}
 if(type==='inn'){block(g,2.8,4.8,3.8,2.1,1.2,.3,accent)}
 if(type==='infirmary'){block(g,0,5,3.6,.65,2,.25,accent);block(g,0,5,3.6,2,.65,.3,accent)}
 if(type==='farm'||type==='hunter'||type==='lumber'||type==='quarry'){for(let i=0;i<3;i++)block(g,-3+i*2.8,.5,5.3,1.4,.9,1.5,i===0?timber:stone)}
 return g;
}
