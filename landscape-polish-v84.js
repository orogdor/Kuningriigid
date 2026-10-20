// V84 visual dressing shares the exact atlas/detail projection and saved rivers.
import * as T from './vendor/three.module.js';
import {getRivers,surface,baseHeight,projectHeight,worldToLocal} from './continuous-landscape.js?v=69a';
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
 const ford=!cell.bridge,LH=surface(game,left.x,left.z),RH=surface(game,right.x,right.z),worldBase=ford?surface(game,a.x,a.z)+3.1:(LH+RH)/2;let rise=ford?0:LH-RH;
 let p=scope==='world'?{x:a.x,z:a.z}:worldToLocal(tile,a.x,a.z),y=projectHeight(worldBase,scope);
 if(scope!=='world'&&height){const L=worldToLocal(tile,left.x,left.z),R=worldToLocal(tile,right.x,right.z);const lh=height(L.x,L.z),rh=height(R.x,R.z);y=ford?height(p.x,p.z)+.93:(lh+rh)/2;rise=ford?0:(lh-rh)/.30}
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
 const sites=getRivers(game).map(e=>e.c).filter(c=>(scope==='world'||!game.contextAt(c,false)?.economy.buildings.some(b=>b.type==='bridge'&&b.ready))&&(c.bridge||c.ford)&&!existing.has(c.c+':'+c.r)&&(!tile||Math.abs(c.x-tile.x)<90&&Math.abs(c.z-tile.z)<90));
 for(const ford of [false,true]){
  const cells=sites.filter(c=>!c.bridge===ford),template=crossingTemplate(ford);if(!cells.length)continue;
  for(const src of template.children){const mesh=new T.InstancedMesh(src.geometry,src.material,cells.length),o=new T.Object3D();
   cells.forEach((cell,i)=>{applyCrossingTransform(o,crossingFrame(game,cell,scope,tile));mesh.setMatrixAt(i,o.matrix)});mesh.name=ford?'shallow stone ford':'timber bridge with abutments';group.add(mesh)}
 }
 group.userData.crossingCount=sites.length;return group;
}
function cragGeometry(){
 const vertices=[],colors=[];
 const rings=[{y:0,r:1},{y:.28,r:.93},{y:.68,r:.55},{y:1,r:.06}],n=7;
 const point=(ring,i)=>{const a=i/n*Math.PI*2;return [Math.cos(a)*ring.r+ring.y*.18,ring.y,Math.sin(a)*ring.r]};
 for(let r=1;r<rings.length;r++)for(let i=0;i<n;i++){
  const a=point(rings[r-1],i),b=point(rings[r-1],(i+1)%n),c=point(rings[r],i),d=point(rings[r],(i+1)%n);
  for(const p of [a,c,b,b,c,d]){vertices.push(...p);const tint=new T.Color(p[1]>.8?'#c5c7b8':i%3?'#78817e':'#a59e8b');colors.push(tint.r,tint.g,tint.b)}
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.computeVertexNormals();return g;
}
export function createMountainOutcrops(game,scope='world',tile=null){
 const group=new T.Group();group.name='V84 stratified mountain crests';group.userData.landscape=true;
 const all=game.cells.filter(c=>c.mountain);
 const sites=all.filter(c=>!tile||Math.abs(c.x-tile.x)<85&&Math.abs(c.z-tile.z)<85);
 if(!sites.length)return group;
 const geo=cragGeometry(),mat=new T.MeshStandardMaterial({vertexColors:true,roughness:1,flatShading:true}),mesh=new T.InstancedMesh(geo,mat,sites.length),o=new T.Object3D();
 sites.forEach((c,i)=>{
  const x=c.x+(game.noise(c.c+71,c.r)-.5)*20,z=c.z+(game.noise(c.c,c.r+18)-.5)*20;
  const y=surface(game,x,z),size=12+game.noise(c.c+9,c.r+7)*14;
  // Embed the entire foot of the crag, not only its centre on a steep ridge.
  let base=y;
  for(let k=0;k<12;k++){const angle=k*Math.PI/6;base=Math.min(base,surface(game,x+Math.cos(angle)*size*1.15,z+Math.sin(angle)*size*1.15))}
  const yaw=game.noise(c.c,c.r)*Math.PI*2,co=Math.cos(yaw),sn=Math.sin(yaw);
  // Check the actual rotated polygon, including edge midpoints on narrow gullies.
  for(let k=0;k<7;k++)for(let step=0;step<3;step++){
   const a=k*Math.PI*2/7,b=(k+1)*Math.PI*2/7,t=step/3;
   const bx=(Math.cos(a)*(1-t)+Math.cos(b)*t)*size,bz=(Math.sin(a)*(1-t)+Math.sin(b)*t)*size*.72;
   base=Math.min(base,surface(game,x+co*bx+sn*bz,z-sn*bx+co*bz));
  }
  base-=size*1.5;
  const p=scope==='world'?{x,z}:worldToLocal(tile,x,z),height=20+size*1.25+y-base;
  o.position.set(p.x,projectHeight(base,scope),p.z);o.rotation.set(0,game.noise(c.c,c.r)*Math.PI*2,0);o.scale.set(size,height,size*.72);o.updateMatrix();
  if(scope!=='world'){const m=new T.Matrix4().makeScale(3,.30,2.6).multiply(o.matrix);m.setPosition(p.x,projectHeight(base,scope),p.z);mesh.setMatrixAt(i,m)}else mesh.setMatrixAt(i,o.matrix);
 });mesh.receiveShadow=true;mesh.castShadow=scope!=='world';mesh.name='angular ridge rock';group.add(mesh);group.userData.outcropCount=sites.length;return group;
}
