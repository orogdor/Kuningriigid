import * as T from './vendor/three.module.js';
import {createV48Mesh} from './model-runtime-v48.js';
import {roadPoints,roadLevel,roadStrength} from './roads.js';
import {createAtlasBiomeDetail} from './atlas-biomes-v47.js';
import {COLS,ROWS,WORLD_WIDTH,WORLD_DEPTH,WORLD_CENTER_X,WORLD_CENTER_Z,ORIGIN_X,ORIGIN_Z,center} from './campaign.js';
const palette={
 sea:'#173f58',deepSea:'#102d4e',shallow:'#64aba7',beach:'#dfcea0',coastGrass:'#b7c28b',
 grass:'#92ae69',lush:'#79a763',steppe:'#a9ab72',forest:'#4f7756',jungle:'#3f6b46',
 desert:'#c4b078',mesa:'#997e63',tundra:'#a8ad97',taiga:'#6a7e64',
 hills:'#777d74',mountain:'#767c79',snow:'#e8e7dc',river:'#68a8bf'
};
function visualBiome(cell){
 if(!cell)return 'sea';
 if(cell.visualBiome)return cell.visualBiome;
 if(!cell.land)return 'sea';
 if(cell.mountain)return cell.h>38?'snow_mountain':'mountain';
 return cell.biome==='forest'?'forest':'grassland';
}
function biomeBaseColor(game,cell,h,x,z){
 const vb=visualBiome(cell), climate=cell.visualClimate||{}, north=game.s.geographyVersion?Math.abs((z-ORIGIN_Z)/WORLD_DEPTH-.5)*2:Math.abs(z)/550;
 let color=new T.Color(h<.7?palette.shallow:h<3.4?palette.beach:palette.grass);
 if(vb==='grassland')color.set(palette.grass);
 else if(vb==='coastal_grassland')color.set(palette.coastGrass);
 else if(vb==='steppe'||vb==='coastal_steppe')color.set(palette.steppe);
 else if(vb==='forest'||vb==='coastal_forest')color.set(palette.forest);
 else if(vb==='jungle'||vb==='coastal_jungle')color.set(palette.jungle);
 else if(vb==='lush_river')color.set(palette.lush);
 else if(vb==='desert')color.set(palette.desert);
 else if(vb==='mesa')color.set(palette.mesa);
 else if(vb==='tundra')color.set(palette.tundra);
 else if(vb==='taiga')color.set(palette.taiga);
 else if(vb==='snow')color.set(palette.snow);
 else if(vb==='mountain')color.set(palette.mountain);
 else if(vb==='snow_mountain')color.set(palette.snow);
 if(h<.7)color.set(palette.shallow);
 if(h>=3.4&&vb.startsWith('coastal_'))color.lerp(new T.Color(palette.beach),.16);
 if((vb==='mountain'||vb==='snow_mountain')&&h>22)color.lerp(new T.Color('#9aa09b'),.22);
 if((climate.lat??north)>.78&&h>3&&vb!=='desert'&&vb!=='mesa')color.lerp(new T.Color('#d7ddd2'),Math.max(0,((climate.lat??north)-.78)*1.6));
 return color;
}
export function atlasColor(game,x,z,h){
 const c=Math.min(COLS-1,Math.max(0,Math.floor((x+650)/50))),r=Math.min(ROWS-1,Math.max(0,Math.floor((z+550)/50))),cell=game.cells[r*COLS+c];
 let color=biomeBaseColor(game,cell,h,x,z);
 if(cell?.river)color.lerp(new T.Color(cell.bridge?'#88b5ba':palette.river),cell.bridge?.18:.34);
 color.multiplyScalar(.92+game.smooth(x/17+20,z/17+30)*.14);
 return color;
}
export function createAtlasDecor(game,scene,quality='medium'){const group=new T.Group();scene.add(group);const height=(x,z)=>Math.max(.7,game.atlasHeight(x,z));const material=c=>new T.MeshStandardMaterial({color:c,roughness:1});
 // One ocean mesh uses depth-dependent color, showing shelves and deep water.
 const geo=new T.PlaneGeometry(WORLD_WIDTH+200,WORLD_DEPTH+200,COLS*2,ROWS*2);geo.rotateX(-Math.PI/2);geo.translate(WORLD_CENTER_X,0,WORLD_CENTER_Z);const p=geo.attributes.position,colors=[];for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),h=game.atlasHeight(x,z),t=Math.max(0,Math.min(1,(-h+.8)/26)),shore=Math.pow(1-t,3),c=new T.Color('#5fa8aa').lerp(new T.Color('#102d4e'),Math.pow(t,.7));c.lerp(new T.Color('#9ac6b5'),shore*.33);c.multiplyScalar(.94+game.smooth(x/130+80,z/130+56)*.10);colors.push(c.r,c.g,c.b)}geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));const water=new T.Mesh(geo,new T.MeshStandardMaterial({vertexColors:true,roughness:.42,metalness:.18}));water.position.y=.72;water.userData.water=true;group.add(water);group.userData.water=water;
 const shore=[];for(let z=ORIGIN_Z;z<ORIGIN_Z+WORLD_DEPTH;z+=10)for(let x=ORIGIN_X;x<ORIGIN_X+WORLD_WIDTH;x+=10){const points=[[x,z],[x+10,z],[x+10,z+10],[x,z+10]],hits=[];for(let i=0;i<4;i++){const a=points[i],b=points[(i+1)%4],ha=game.atlasHeight(...a)-.8,hb=game.atlasHeight(...b)-.8;if((ha>0)!==(hb>0)){const t=ha/(ha-hb);hits.push([a[0]+(b[0]-a[0])*t,1.04,a[1]+(b[1]-a[1])*t])}}if(hits.length===2)shore.push(...hits[0],...hits[1])}group.add(new T.LineSegments(new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute(shore,3)),new T.LineBasicMaterial({color:'#dbeddf',transparent:true,opacity:.35})));
 // Sparse ocean strokes give water scale without animated shader cost.
 const waves=[];for(const cell of game.cells)if(!cell.land&&!cell.coast&&game.noise(cell.c,cell.r+77)>.88){const x=cell.x,z=cell.z;for(let i=0;i<5;i++){const a=x-14+i*6,b=a+6;waves.push(a,.84,z+Math.sin(i*.9)*2,b,.84,z+Math.sin((i+1)*.9)*2)}}const waveLines=new T.LineSegments(new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute(waves,3)),new T.LineBasicMaterial({color:'#91c1bd',transparent:true,opacity:.11}));group.add(waveLines);group.userData.waveLines=waveLines;
 // Faceted mountain silhouettes: irregular polygonal slopes instead of repeated simple cones.
 function cragGeometry(top=false){const n=9,rings=top?[[.57,.48],[.84,.32],[1,.06]]:[[0,1],[.40,.86],[.73,.49],[1,.06]],verts=[],indices=[];
  for(const [y,r] of rings)for(let i=0;i<n;i++){const a=i*Math.PI*2/n,irreg=1+.12*Math.sin(i*2.3+1)+.07*Math.sin(i*4.4);verts.push(Math.cos(a)*r*irreg+y*.22, y, Math.sin(a)*r*irreg+y*.12)}
  for(let j=0;j<rings.length-1;j++)for(let i=0;i<n;i++){const a=j*n+i,b=j*n+(i+1)%n,c=(j+1)*n+i,d=(j+1)*n+(i+1)%n;indices.push(a,c,b,b,c,d)}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(verts,3));g.setIndex(indices);g.computeVertexNormals();return g;
 }
 const peaks=[];for(const cell of game.cells.filter(c=>c.mountain)){
  const count=game.noise(cell.c*11,cell.r+308)>.58?2:1;
  for(let i=0;i<count;i++){const x=cell.x+(game.noise(cell.c*11+i,cell.r+308)-.5)*33,z=cell.z+(game.noise(cell.c*19+i,cell.r+408)-.5)*33,h=game.atlasHeight(x,z);if(h>18)peaks.push({x,z,h,size:6+(Math.min(48,h)-15)*.38+game.noise(cell.c+i,cell.r+907)*5})}
 }
 const mountains=new T.InstancedMesh(cragGeometry(),material('#777b76'),peaks.length),snowPeaks=peaks.filter(a=>a.h>29),caps=new T.InstancedMesh(cragGeometry(true),material('#dce3df'),snowPeaks.length),dummy=new T.Object3D();
 peaks.forEach((a,i)=>{dummy.position.set(a.x,a.h+.25,a.z);dummy.scale.set(a.size*1.35,a.size*1.75,a.size*1.25);dummy.rotation.set(0,game.noise(i,80)*6,0);dummy.updateMatrix();mountains.setMatrixAt(i,dummy.matrix);mountains.setColorAt(i,new T.Color(i%3?'#8b918c':'#767e7b'))});
 snowPeaks.forEach((a,i)=>{dummy.position.set(a.x,a.h+.25,a.z);dummy.scale.set(a.size*1.35,a.size*1.75,a.size*1.25);dummy.rotation.set(0,game.noise(peaks.indexOf(a),80)*6,0);dummy.updateMatrix();caps.setMatrixAt(i,dummy.matrix)});
 group.add(mountains,caps);
 // Civ-style world variety: fields, forests, jungles, tundra woods, deserts and mesas.
 const fields=game.cells.filter(c=>c.deposits.grain),
       plots=new T.InstancedMesh(new T.PlaneGeometry(17,12),material('#b9aa60'),fields.length),
       rocks=game.cells.filter(c=>c.deposits.stone&&c.biome!=='hills'),
       stones=new T.InstancedMesh(new T.DodecahedronGeometry(1,0),material('#a4a98e'),rocks.length);
 fields.forEach((a,i)=>{dummy.position.set(a.x+8,height(a.x+8,a.z-11)+.35,a.z-11);dummy.rotation.set(-Math.PI/2,0,game.noise(i,71)*.3);dummy.scale.set(1,1,1);dummy.updateMatrix();plots.setMatrixAt(i,dummy.matrix)});
 rocks.forEach((a,i)=>{dummy.position.set(a.x-10,height(a.x-10,a.z)+2,a.z);dummy.rotation.set(0,i*1.4,0);dummy.scale.set(3.5,2.4,3);dummy.updateMatrix();stones.setMatrixAt(i,dummy.matrix)});
 group.add(plots,stones);
 const nature=createAtlasBiomeDetail(game,group,quality);
 const rivers=new T.Group();group.add(rivers);const riverPts=[];for(const cell of game.cells.filter(c=>c.river)){const y=height(cell.x,cell.z)+.58,w=cell.bridge?7:(cell.ford?5.5:4.2);if(cell.riverDir==='v'){riverPts.push(cell.x-w,y,cell.z,cell.x+w,y,cell.z)}else if(cell.riverDir==='h'){riverPts.push(cell.x,y,cell.z-w,cell.x,y,cell.z+w)}else if(cell.riverDir==='d1'){riverPts.push(cell.x-w*.75,y,cell.z-w*.75,cell.x+w*.75,y,cell.z+w*.75)}else{riverPts.push(cell.x-w*.75,y,cell.z+w*.75,cell.x+w*.75,y,cell.z-w*.75)}if(cell.ford||cell.bridge){const deck=new T.Mesh(new T.PlaneGeometry(10,cell.bridge?18:12),new T.MeshBasicMaterial({color:cell.bridge?'#a88663':'#cab684',transparent:true,opacity:cell.bridge?.78:.45,side:T.DoubleSide,depthWrite:false}));deck.rotation.x=-Math.PI/2;deck.position.set(cell.x,y+.02,cell.z);if(cell.riverDir==='v')deck.rotation.z=Math.PI/2; else if(cell.riverDir==='d1')deck.rotation.z=Math.PI/4; else if(cell.riverDir==='d2')deck.rotation.z=-Math.PI/4;rivers.add(deck)}}if(riverPts.length)rivers.add(new T.LineSegments(new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute(riverPts,3)),new T.LineBasicMaterial({color:'#81c4d8',transparent:true,opacity:.8})));
 // Real-world traffic generates the atlas road network (no roads appear just because a route was planned).
 const roadGroup=new T.Group();group.add(roadGroup);let roadStamp='';
 function roads(state){
  const stamp=(state.roadRevision||0)+':'+(state.railRevision||0)+':'+(state.visionRevision||0);
  if(stamp===roadStamp)return;roadStamp=stamp;
  for(const o of roadGroup.children){o.geometry?.dispose();o.material?.dispose();roadGroup.remove(o)}
  const vertices=[],rgb=[],palette=['#000000','#ab997a','#c6b48a','#c7b08a','#a6b1ac'];
  for(const[key,road]of Object.entries(state.worldRoads||{})){
   const strength=roadStrength(state,...roadPoints(key),state.time),level=roadLevel(strength);
   if(!level)continue;
   const [a,b]=roadPoints(key);if(!game.seen(0,a)||!game.seen(0,b))continue;
   const aa=center(a.c,a.r),bb=center(b.c,b.r),dx=bb.x-aa.x,dz=bb.z-aa.z,d=Math.hypot(dx,dz);
   if(!d)continue;const width=[0,2.2,3.6,5.1,7.0][level],nx=-dz/d*width*.5,nz=dx/d*width*.5;
   const col=new T.Color(palette[level]),sides=[];
   for(let k=0;k<=8;k++){const t=k/8,x=aa.x+dx*t,z=aa.z+dz*t,y=game.atlasHeight(x,z)+1.45;sides.push([[x+nx,y,z+nz],[x-nx,y,z-nz]])}
   for(let k=0;k<8;k++)for(const v of [sides[k][0],sides[k][1],sides[k+1][0],sides[k+1][0],sides[k][1],sides[k+1][1]]){vertices.push(...v);rgb.push(col.r,col.g,col.b)}
  }
  // Permanent rail sleepers are separate from traffic-eroded footpaths.
  const rails=[];
  for(const key of Object.keys(state.railEdges||{})){
   const [a,b]=roadPoints(key);if(!game.seen(0,a)||!game.seen(0,b))continue;
   const pa=center(a.c,a.r),pb=center(b.c,b.r),dx=pb.x-pa.x,dz=pb.z-pa.z,len=Math.hypot(dx,dz);
   if(!len)continue;const nx=-dz/len*2.4,nz=dx/len*2.4;
   for(const offset of [-1,1]){
    const ax=pa.x+offset*nx,az=pa.z+offset*nz,bx=pb.x+offset*nx,bz=pb.z+offset*nz;
    rails.push(ax,game.atlasHeight(ax,az)+2.3,az,bx,game.atlasHeight(bx,bz)+2.3,bz);
   }
   for(let step=1;step<10;step++){
    const t=step/10,x=pa.x+dx*t,z=pa.z+dz*t;
    rails.push(x-nx*1.25,game.atlasHeight(x-nx*1.25,z-nz*1.25)+2.15,z-nz*1.25,x+nx*1.25,game.atlasHeight(x+nx*1.25,z+nz*1.25)+2.15,z+nz*1.25);
   }
  }
  if(rails.length){const railLine=new T.LineSegments(new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute(rails,3)),new T.LineBasicMaterial({color:'#3f4c56'}));roadGroup.add(railLine)}
  if(vertices.length){const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geo.setAttribute('color',new T.Float32BufferAttribute(rgb,3));const mesh=new T.Mesh(geo,new T.MeshBasicMaterial({vertexColors:true,transparent:true,opacity:.85,depthWrite:false,side:T.DoubleSide}));mesh.frustumCulled=false;roadGroup.add(mesh)}
 }
 const territories=new T.Group(),routes=new T.Group();group.add(territories,routes);let previous='',lastRoute='';
 function disposeGroup(g){for(const o of [...g.children]){o.geometry?.dispose();o.material?.dispose();g.remove(o)}}
 function territory(state){game.refreshTerritory();const stamp=state.cities.map(c=>[c.id,c.team,c.c,c.r,c.radius].join(':')).join('|');if(stamp===previous)return;previous=stamp;disposeGroup(territories);const owner=new Map();for(const cell of game.cells){const city=game.territoryOwner(cell);if(city)owner.set(cell.r*COLS+cell.c,city.team)}for(const team of [0,1,2,3]){const edges=[],fill=[];const color=['#79b9b0','#cc765d','#ab92d0','#d4b858'][team];for(const cell of game.cells){if(owner.get(cell.r*COLS+cell.c)!==team)continue;for(const[dc,dr,dx,dz]of [[-1,0,-25,-25],[1,0,25,-25],[0,-1,-25,-25],[0,1,-25,25]]){const n=cell.c+dc,m=cell.r+dr;if(n>=0&&n<COLS&&m>=0&&m<ROWS&&owner.get(m*COLS+n)===team)continue;const x=cell.x+dx,z=cell.z+dz,vx=dc===0?50:0,vz=dr===0?50:0;for(let i=0;i<10;i++){const ax=x+vx*i/10,az=z+vz*i/10,bx=x+vx*(i+1)/10,bz=z+vz*(i+1)/10;edges.push(ax,height(ax,az)+.85,az,bx,height(bx,bz)+.85,bz)}}for(let z=-25;z<25;z+=10)for(let x=-25;x<25;x+=10){const a=[cell.x+x,cell.z+z],b=[a[0]+10,a[1]],c=[a[0],a[1]+10],d=[a[0]+10,a[1]+10];for(const q of [a,c,b,b,c,d])fill.push(q[0],height(...q)+.16,q[1])}}const mesh=new T.Mesh(new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute(fill,3)),new T.MeshBasicMaterial({color,transparent:true,opacity:.075,depthWrite:false,side:T.DoubleSide}));territories.add(mesh,new T.LineSegments(new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute(edges,3)),new T.LineBasicMaterial({color,transparent:true,opacity:.88})))}}
 function route(state,mover){const path=mover?.path||[],stamp=(mover?.c??'')+':'+(mover?.r??'')+JSON.stringify(path);if(stamp===lastRoute)return;lastRoute=stamp;disposeGroup(routes);if(!path.length)return;const tiles=[mover,...path],points=[];for(let i=1;i<tiles.length;i++){const a=center(tiles[i-1].c,tiles[i-1].r),b=center(tiles[i].c,tiles[i].r);for(let j=0;j<10;j++){const x=a.x+(b.x-a.x)*j/10,z=a.z+(b.z-a.z)*j/10;points.push(new T.Vector3(x,height(x,z)+2,z))}}const end=center(path.at(-1).c,path.at(-1).r);points.push(new T.Vector3(end.x,height(end.x,end.z)+2,end.z));const line=new T.Line(new T.BufferGeometry().setFromPoints(points),new T.LineDashedMaterial({color:'#f4d48b',dashSize:5,gapSize:3,transparent:true,opacity:1,depthTest:false}));line.computeLineDistances();routes.add(line);const dots=new T.InstancedMesh(new T.RingGeometry(2,3,12),new T.MeshBasicMaterial({color:'#fae4a4',side:T.DoubleSide,depthTest:false,depthWrite:false}),path.length);path.forEach((p,i)=>{const q=center(p.c,p.r);dummy.position.set(q.x,height(q.x,q.z)+2,q.z);dummy.rotation.set(-Math.PI/2,0,0);dummy.scale.set(1,1,1);dummy.updateMatrix();dots.setMatrixAt(i,dummy.matrix)});routes.add(dots)}

 return {group,territory,route,roads,routes,waveLines,peaks:peaks.length,shoreSegments:shore.length/6,nature};
}
// V46: readable settlement silhouettes from prehistoric huts to modern urban skylines.
const cityMaterials=new Map(),cityGeometries=new Map();
function cityMat(c,metal=false){const k=c+metal;if(!cityMaterials.has(k))cityMaterials.set(k,new T.MeshStandardMaterial({color:c,roughness:metal?.45:.91,metalness:metal?.2:0}));return cityMaterials.get(k)}
function cityGeom(key,fn){if(!cityGeometries.has(key)){const g=fn();g.userData.shared=true;cityGeometries.set(key,g)}return cityGeometries.get(key)}
export function createCityMiniature(team,age){
 const g=new T.Group(),accent=['#5a8584','#ad715d','#9585b3','#ad995b'][team];
 const put=(shape,x,y,z,w,h,d,color)=>{const geo=shape==='cone'?cityGeom('city-cone',()=>new T.ConeGeometry(1,1,6)):shape==='tower'?cityGeom('city-tower',()=>new T.CylinderGeometry(1,1,1,8)):cityGeom('city-box',()=>new T.BoxGeometry(1,1,1));const m=new T.Mesh(geo,cityMat(color,age>=5));m.position.set(x,y,z);m.scale.set(w,h,d);m.castShadow=false;g.add(m);return m};
 put('cube',0,.32,0,27,.55,25,age>=5?'#8a9998':'#8c8e79');
 if(age===0){for(let i=0;i<7;i++){const x=(i%3-1)*7.5,z=(Math.floor(i/3)-1)*7.7,hh=i===1?7.5:3.8;put('tower',x,hh/2,z,2.4,hh,2.4,'#b5a27d');put('cone',x,hh+2,z,3.7,4,3.7,i===1?accent:'#8a6947')}
  for(let j=0;j<8;j++)put('cube',-11+j*2.6,.9,12,.35,1.2,.5,'#71573c');
 }else if(age<=2){for(let i=0;i<8;i++){const x=(i%4-1.5)*6.1,z=(Math.floor(i/4)-.5)*9.1,h=i===1?11:age===2?5.5+((i*7)%4):4.5+((i*3)%4);put('cube',x,h/2,z,4.4,h,5,'#b7ac91');put('cone',x,h+1.6,z,3.8,3.4,3.8,i%3===0?accent:'#7b6651');put('cube',x,h*.52,2.65+z,.85,1.2,.12,'#485f68')}
  if(age>=2){for(let x of [-12,12])put('tower',x,5,0,2.4,10,2.4,'#96978e');put('cube',0,2.4,-12,25,3.4,.8,'#9b998c')}
 }else if(age<=4){for(let i=0;i<9;i++){const x=(i%3-1)*8,z=(Math.floor(i/3)-1)*8,h=(i===4?13:5+((i*5)%5))*(age>=4?1.15:1);put('cube',x,h/2,z,5.1,h,5,'#beb7a0');put('cone',x,h+2,z,4.2,4,4.2,i===4?accent:'#806c59');for(let k=0;k<2;k++)put('cube',x-1.2+k*2.4,h*.65,z+2.58,.5,.8,.12,'#758f94')}
  for(let x of [-12,12]){put('tower',x,6,0,2.8,12,2.8,'#9c9c92');put('cone',x,13.5,0,3.2,4,3.2,accent)}
 }else if(age===5){for(let i=0;i<8;i++){const x=(i%4-1.5)*6.5,z=(Math.floor(i/4)-.5)*10,h=4+(i*3)%6;put('cube',x,h/2,z,5.8,h,6.2,i%2?'#a4aaa6':'#7e8b8a');put('cube',x,h+.1,z,6,.45,6.5,'#55646c');if(i%3===0)put('tower',x+2,h+5,z-1,.55,10,.55,'#817d76')}
  for(let x of [-9,9])put('cube',x,.35,0,1.2,.25,25,'#46575e');
 }else {for(let i=0;i<9;i++){const x=(i%3-1)*8,z=(Math.floor(i/3)-1)*8,h=(i===4?18:6+(i*7)%10);put('cube',x,h/2,z,5.4,h,5.1,i%2?'#8fa6ad':'#a8b6ba');put('cube',x,h*.60,z+2.63,4.8,.23,.14,'#3b596a');put('cube',x,h+.2,z,5.6,.4,5.5,'#6f8185')}
  for(const z of [-12,12])put('cube',0,.12,z,27,.15,1,'#596b73');
 }
 // Authored source quad meshes: visible at city scale with the original age-specific skyline kept intact.
 const accentModel=(name,x,z,scale,rot=0)=>{const model=createV48Mesh(name,scale);model.position.set(x,.5,z);model.rotation.y=rot;model.castShadow=false;g.add(model)};
 if(age<=3){
  accentModel('timber_house_1000_3',-9,7,1.75,.25);
  accentModel('timber_house_1000_3',8,7,1.55,-.25);
  if(age>=1)accentModel('market_1000_3',0,7.5,1.65);
 }else if(age===4){
  accentModel('timber_house_1000_3',-9,7,1.65,.1);
  accentModel('market_1000_3',7,6,1.7,.3);
  accentModel('windmill_1000_3',-11,-8,2.2);
 }
 g.userData.age=age;return g;
}
export function cityBanner(name,team){const canvas=document.createElement('canvas');canvas.width=384;canvas.height=80;const ctx=canvas.getContext('2d');ctx.fillStyle=['#183f40ee','#623e32ee','#443954ee','#5b5030ee'][team];ctx.fillRect?.(0,5,384,66);ctx.strokeStyle=['#a8cab4','#d49a7e','#b7a1d4','#dec783'][team];ctx.lineWidth=3;ctx.strokeRect?.(2,7,380,62);ctx.fillStyle='#f3ead1';ctx.font='600 38px Georgia';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(name,192,40);const texture=new T.CanvasTexture(canvas),sprite=new T.Sprite(new T.SpriteMaterial({map:texture,depthTest:false,transparent:true}));sprite.scale.set(96,20,1);return sprite}
