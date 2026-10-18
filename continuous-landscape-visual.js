// V67: one topology for each river system and each road network. The atlas
// and detailed view are different projections of exactly the same vertices,
// NEVER independently drawn rectangular per-tile water/road chunks.
import * as T from './vendor/three.module.js';
import {getRivers,roadNetwork,surface,baseHeight,projectHeight,worldToLocal} from './continuous-landscape.js?v=67';
const colors=['#000000','#bba078','#c0aa83','#aaa497','#9eacae'];
const V=(arr,p)=>arr.push(p.x,p.y,p.z);
const field=(game,x,z,view,tile)=>view==='world'?{x,z}:{...worldToLocal(tile,x,z)};
const elev=(game,x,z,view)=>surface(game,x,z,view);
const pos=(game,x,z,y,view,tile)=>({...field(game,x,z,view,tile),y:projectHeight(y,view)});
function join(pts,game,scope,tile,kind,level=1){
 const isRiver=kind==='river',wBase=isRiver?0:[0,4.4,5.5,7.4,9.4][level],out=[];
 for(let i=0;i<pts.length;i++){
  const p=pts[i],before=pts[Math.max(0,i-1)],after=pts[Math.min(pts.length-1,i+1)];
  const tX=after.x-before.x,tZ=after.z-before.z,d=Math.hypot(tX,tZ)||1;
  const nx=-tZ/d,nz=tX/d,width=isRiver?p.width:wBase;
  const left={x:p.x+nx*width,z:p.z+nz*width},right={x:p.x-nx*width,z:p.z-nz*width};
  const outer=width*(isRiver?1.68:1.23);
  const outerL={x:p.x+nx*outer,z:p.z+nz*outer},outerR={x:p.x-nx*outer,z:p.z-nz*outer};
  const waterHeight=baseHeight(game,p.x,p.z)-(1.6+Math.min(2,p.width*.13));
  const innerY=isRiver?projectHeight(waterHeight,scope):elev(game,p.x,p.z,scope)+(scope==='world'?1.32:.396);
  const edgeY=isRiver?innerY:elev(game,p.x,p.z,scope)+(scope==='world'?1.3:.39);
  const bankY=(v)=>elev(game,v.x,v.z,scope)+(scope==='world'?.12:.036);
  out.push({
   l:{...field(game,left.x,left.z,scope,tile),y:edgeY},
   r:{...field(game,right.x,right.z,scope,tile),y:edgeY},
   ol:{...field(game,outerL.x,outerL.z,scope,tile),y:bankY(outerL)},
   or:{...field(game,outerR.x,outerR.z,scope,tile),y:bankY(outerR)}
  });
 }
 return out;
}
function tri(arr,a,b,c){V(arr,a);V(arr,b);V(arr,c)}
function strip(arr,a,b,c,d){tri(arr,a,b,c);tri(arr,c,b,d)}
function buffers(vertices,color,{standard=false,opacity=1}={}){
 if(!vertices.length)return null;
 // Weld shared vertices into an indexed mesh. Consecutive river/road
 // sections now share actual vertices and normals, instead of separate
 // face triangles placed edge-to-edge (which caused faceting and seams).
 const unique=[],indices=[],lookup=new Map();
 for(let i=0;i<vertices.length;i+=3){
  const x=vertices[i],y=vertices[i+1],z=vertices[i+2];
  const key=Math.round(x*1000)+','+Math.round(y*1000)+','+Math.round(z*1000);
  let n=lookup.get(key);
  if(n===undefined){n=unique.length/3;unique.push(x,y,z);lookup.set(key,n)}
  indices.push(n);
 }
 const geo=new T.BufferGeometry();
 geo.setAttribute('position',new T.Float32BufferAttribute(unique,3));
 geo.setIndex(indices);geo.computeVertexNormals();geo.computeBoundingSphere();
 const mat=standard?new T.MeshStandardMaterial({color,roughness:.55,metalness:.10,transparent:opacity!==1,opacity,side:T.DoubleSide,depthWrite:opacity===1}):new T.MeshBasicMaterial({color,side:T.DoubleSide,transparent:opacity!==1,opacity,depthWrite:opacity===1,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-2});
 return new T.Mesh(geo,mat);
}
function visible(tile,path,radius=90){if(!tile)return true;return path.some(p=>Math.abs(p.x-tile.x)<radius&&Math.abs(p.z-tile.z)<radius)}
export function createRiverNetwork(game,scope='world',tile=null){
 const group=new T.Group();group.name='V67 continuous watershed network';group.userData.landscape=true;
 const water=[],banks=[],bed=[];
 let riverCount=0,sections=0;
 for(const edge of getRivers(game)){
  if(!visible(tile,edge.points))continue;
  riverCount++;
  const cross=join(edge.points,game,scope,tile,'river');
  for(let i=1;i<cross.length;i++){
   const a=cross[i-1],b=cross[i];
   strip(water,a.l,a.r,b.l,b.r);
   strip(banks,a.ol,a.l,b.ol,b.l);
   strip(banks,a.r,a.or,b.r,b.or);
   sections++;
  }
 }
 const bankMesh=buffers(banks,'#887961',{standard:true}),waterMesh=buffers(water,'#478ba5',{standard:true,opacity:.91});
 if(bankMesh){bankMesh.name='continuous river banks';group.add(bankMesh)}
 if(waterMesh){waterMesh.name='continuous water surface';waterMesh.renderOrder=9;group.add(waterMesh)}
 group.userData.riverEdges=riverCount;
 group.userData.riverVertexCount=water.length/3;
 group.userData.sections=sections;
 // Crossings remain independent STRUCTURES, but share river coordinates and
 // are only placed at actual fixed world passage locations.
 const bridgeGeom=new T.BoxGeometry(1,1,1),bridgeMaterial=new T.MeshStandardMaterial({color:'#ac9777',roughness:1});
 const crossings=getRivers(game).filter(e=>(e.c.bridge||e.c.ford)&&visible(tile,e.points)).slice(0,scope==='world'?5000:60);
 if(crossings.length){
  const bridges=new T.InstancedMesh(bridgeGeom,bridgeMaterial,crossings.length),o=new T.Object3D();
  for(let i=0;i<crossings.length;i++){
   const {c,points}=crossings[i],a=points[0],b=points[1],axis=Math.atan2(b.x-a.x,b.z-a.z);
   const p=field(game,a.x,a.z,scope,tile),scale=scope==='world'?1:2.8;
   o.position.set(p.x,elev(game,a.x,a.z,scope)+(scope==='world'?1.45:.435),p.z);
   o.rotation.set(0,axis,0);o.scale.set((c.bridge?14:9)*scale,scope==='world'?.7:.35,(c.bridge?6:5)*scale);
   o.updateMatrix();bridges.setMatrixAt(i,o.matrix);
  }
  bridges.name='river crossings';group.add(bridges);
 }
 return group;
}
export function createUnifiedRoadNetwork(game,scope='world',tile=null){
 const group=new T.Group();group.name='V67 continuous road graph';group.userData.roadNetwork=true;
 const beds=[],verges=[],ruts=[];
 let roads=0;
 for(const edge of roadNetwork(game)){
  if(!visible(tile,edge.points))continue;
  const xs=join(edge.points,game,scope,tile,'road',edge.level);
  const m=scope==='world'?1:2.8; // detail projection is physically 3x wider
  const scalePt=p=>p; // vertices already in the same world-to-detail projection
  for(let i=1;i<xs.length;i++){
   const a=xs[i-1],b=xs[i];
   strip(beds,a.l,a.r,b.l,b.r);
   strip(verges,a.ol,a.l,b.ol,b.l);strip(verges,a.r,a.or,b.r,b.or);
  }
  roads++;
 }
 const verge=buffers(verges,'#675d4d',{opacity:.87}),road=buffers(beds,'#b7a080',{opacity:.98});
 if(verge){verge.name='continuous road verge';group.add(verge)}
 if(road){road.name='continuous road pavement';road.renderOrder=10;group.add(road)}
 group.userData.roadEdges=roads;group.userData.roadVertexCount=beds.length/3;
 return group;
}
export function disposeNetwork(group){
 if(!group)return;
 group.traverse(o=>{o.geometry?.dispose();if(o.material&&!Array.isArray(o.material))o.material.dispose()});
}
