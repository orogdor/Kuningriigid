// V84 visual dressing shares the exact atlas/detail projection and saved rivers.
import * as T from './vendor/three.module.js';
import {getRivers,riverNear,surface,visualElevation,visualProject,baseHeight,projectHeight,worldToLocal} from './continuous-landscape.js?v=162a';
import {createWorldObjectCatalog} from './world-object-catalog.js';
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
const templates=new Map(),crossingMaps=new WeakMap(),crossingCatalogs=new WeakMap();
export function mountainTint(color,x,z,height,normalY){
 const slope=clamp((1-Math.abs(normalY)-.12)*2.3);
 const strata=.5+.5*Math.sin(height*.52+Math.sin(x*.025+z*.018)*1.8);
 const rock=new T.Color('#505d60').lerp(new T.Color('#aaa18e'),strata*.72);
 color.lerp(rock,.24+slope*.69);
 const snow=clamp((height-82)/24)*clamp((Math.abs(normalY)-.38)/.45);
 color.lerp(new T.Color('#e5e9df'),snow*.92);
 return color;
}
function bakedBox(list,x,y,z,w,h,d,color){
 const geo=new T.BoxGeometry(w,h,d);geo.translate(x,y,z);list.push({geo,color});
}
function mergeParts(parts){
 const group=new T.Group(),byColor=new Map();
 for(const {geo,color} of parts){const flat=geo.index?geo.toNonIndexed():geo;const a=byColor.get(color)||[];a.push(...flat.attributes.position.array);byColor.set(color,a);if(flat!==geo)flat.dispose();geo.dispose()}
 for(const [color,positions]of byColor){const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.computeVertexNormals();const mesh=new T.Mesh(geo,new T.MeshStandardMaterial({color,roughness:.94}));mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh)}
 return group;
}
// Normalized X spans the channel. Geometry is baked for batched atlas instances.
export function crossingTemplate(ford=false){
 const key=ford?'ford':'bridge';if(templates.has(key))return templates.get(key);
 const parts=[];
 if(ford){
  for(let i=0;i<11;i++){
   const geo=new T.DodecahedronGeometry(1,0);geo.scale(.065,.36+(i%3)*.08,.12);geo.translate(-.92+i*.184,.14,Math.sin(i*2.1)*.12);
   parts.push({geo,color:i%2?'#a69d85':'#c1b89e'});
  }
 }else{
  // Planked cambered deck, paired stone abutments, rails and diagonal braces.
  const deckY=x=>Math.abs(x)<.8?2.4+.55*(1-x*x):Math.max(.12,2.6-(Math.abs(x)-.8)*5.2);
  for(let i=0;i<31;i++){const x=-1.25+i/12,y=deckY(x);bakedBox(parts,x,y,0,.09,.30,1.0,i%3?'#a38151':'#bc9b67')}
  for(const x of [-.72,.72])for(const z of [-.38,.38])bakedBox(parts,x,1.2,z,.15,2.4,.24,'#8b8c80');
  for(const z of [-.48,.48]){
   for(let i=0;i<=8;i++){const x=-1+i*.25,y=deckY(x);bakedBox(parts,x,y+1.4,z,.035,2.7,.045,'#66533c')}
   for(let i=0;i<16;i++){const x=-.94+i*.125,y=deckY(x);bakedBox(parts,x,y+2.55,z,.14,.28,.055,'#8d7049')}
   bakedBox(parts,0,1.85,z,1.8,.36,.09,'#66533c');
  }
  // Low landing slabs overlap both dry banks instead of floating deck ends.
  for(const x of [-1.32,1.32])bakedBox(parts,x,.34,0,.28,.68,1.16,'#a9a18c');
 }
 const group=mergeParts(parts);group.userData.crossingStyle=key;group.traverse(o=>{if(o.geometry)o.geometry.userData.sharedLandscape=true;if(o.material)o.material.userData.sharedLandscape=true});templates.set(key,group);return group;
}
export function crossingFrame(game,cell,scope='world',tile=null,height=null){
 let map=crossingMaps.get(game);if(!map){map=new Map(getRivers(game).map(e=>[e.c.c+':'+e.c.r,e]));crossingMaps.set(game,map)}
 const edge=map.get(cell.c+':'+cell.r),points=edge?.points||[];
 const a=points[0]||cell,b=points[1]||{x:cell.x+1,z:cell.z};
 const len=Math.hypot(b.x-a.x,b.z-a.z)||1,nx=-(b.z-a.z)/len,nz=(b.x-a.x)/len;
 const width=a.width||cell.riverWidth||3,halfSpan=width*1.65+4;
 const left={x:a.x+nx*halfSpan,z:a.z+nz*halfSpan},right={x:a.x-nx*halfSpan,z:a.z-nz*halfSpan};
 const ford=!cell.bridge,LH=(scope==='world'?surface:visualElevation)(game,left.x,left.z),RH=(scope==='world'?surface:visualElevation)(game,right.x,right.z);
 // The ford stones lie on the shallow channel floor, not above a deep-water surface.
 const riverLevel=riverNear(game,a.x,a.z).waterHeight;
 const worldBase=ford?riverLevel-.13:(LH+RH)/2;let rise=ford?0:LH-RH;
 let p=scope==='world'?{x:a.x,z:a.z}:worldToLocal(tile,a.x,a.z),y=scope==='world'?worldBase:visualProject(game,worldBase,a.x,a.z);
 if(scope!=='world'&&height){const L=worldToLocal(tile,left.x,left.z),R=worldToLocal(tile,right.x,right.z);const lh=height(L.x,L.z),rh=height(R.x,R.z);y=ford?visualProject(game,worldBase,a.x,a.z):(lh+rh)/2;rise=ford?0:(lh-rh)/.30}
 // A local X axis rotated by yaw points along the river normal.
 return {x:p.x,z:p.z,y,rise,yaw:Math.atan2(-nz,nx),halfSpan,width:6.2,ford,
  scale:scope==='world'?{x:halfSpan,y:1,z:6.2}:{x:halfSpan*3,y:.30,z:6.2*2.6},left,right,normal:{x:nx,z:nz}};
}
export function applyCrossingTransform(object,frame){
 object.position.set(frame.x,frame.y,frame.z);
 // Project the rotated geometry, rather than rotating after anisotropic projection.
 const shear=new T.Matrix4();shear.elements[1]=frame.rise/(frame.halfSpan*2);
 const matrix=new T.Matrix4().makeRotationY(frame.yaw).multiply(shear);
 matrix.premultiply(new T.Matrix4().makeScale(frame.scale.x/frame.halfSpan,frame.scale.y,frame.scale.z/6.2));
 matrix.multiply(new T.Matrix4().makeScale(frame.halfSpan,1,6.2));
 matrix.setPosition(frame.x,frame.y,frame.z);object.matrixAutoUpdate=false;object.matrix.copy(matrix);
 return object;
}
export function createCrossingModel(game,cell,scope='world',tile=null,height=null){
 const model=crossingTemplate(!cell.bridge).clone(true);applyCrossingTransform(model,crossingFrame(game,cell,scope,tile,height));return model;
}
export function createBridgeBuilding(game,tile,height){
 const group=new T.Group(),cell={...tile,bridge:true},model=createCrossingModel(game,cell,'detail',tile,height);
 model.matrix.elements[13]-=height(0,0);group.add(model);return group;
}
export function createCrossingNetwork(game,scope='world',tile=null,quality='medium'){
 const group=new T.Group();group.name='V84 bank-to-bank crossings';group.userData.landscape=true;
 let existing=crossingCatalogs.get(game);if(!existing){existing=new Set(createWorldObjectCatalog(game,quality).candidates.bridge.map(c=>c.c+':'+c.r));crossingCatalogs.set(game,existing);}
 const sites=getRivers(game).map(e=>e.c).filter(c=>(scope==='world'||!game.contextAt(c,false)?.economy.buildings.some(b=>b.type==='bridge'&&b.ready))&&(c.bridge||c.ford)&&!existing.has(c.c+':'+c.r)&&(!tile||Math.abs(c.x-tile.x)<115&&Math.abs(c.z-tile.z)<115));
 for(const ford of [false,true]){
  const cells=sites.filter(c=>!c.bridge===ford),template=crossingTemplate(ford);if(!cells.length)continue;
  for(const src of template.children){const mesh=new T.InstancedMesh(src.geometry,src.material,cells.length),o=new T.Object3D();
   cells.forEach((cell,i)=>{applyCrossingTransform(o,crossingFrame(game,cell,scope,tile));mesh.setMatrixAt(i,o.matrix)});mesh.name=ford?'shallow stone ford':'timber bridge with abutments';group.add(mesh)}
 }
 group.userData.crossingCount=sites.length;return group;
}
// Compatibility holder: V85 ridges are part of the continuous terrain itself.
// No detached cone/cap geometry can hover over the detail map any longer.
export function createMountainOutcrops(game,scope='world',tile=null){
 const group=new T.Group();group.name='V84 stratified mountain crests';group.userData.landscape=true;
 group.userData.outcropCount=game.cells.filter(c=>c.mountain&&(!tile||Math.abs(c.x-tile.x)<115&&Math.abs(c.z-tile.z)<115)).length;
 group.userData.continuousRelief=true;return group;
}
