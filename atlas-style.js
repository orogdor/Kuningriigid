import {spatialInstances} from './spatial-batches-v86.js?v=86a';
import * as T from './vendor/three.module.js';
import {smoothBiomeColor,groundBaseColor,cellRegion,regionContour,regionFill} from './landscape-v149.js?v=162a';
import {createMountainOutcrops} from './landscape-polish-v84.js?v=162a';
import {createV48Mesh} from './model-runtime-v48.js';
import {roadPoints,roadLevel,roadStrength} from './roads.js?v=59';
import {createAtlasBiomeDetail} from './atlas-biomes-v47.js?v=162a';
import {settlementGeometry,getWorldModel,WORLD_MODEL_MATERIAL,SETTLEMENT_MATERIAL} from './world-models-v152.js?v=161a';
import {seaMaterial} from './sea-v158.js?v=161a';
import {createRiverNetwork,createUnifiedRoadNetwork,disposeNetwork} from './continuous-landscape-visual.js?v=162a';
import {surface,riverNear} from './continuous-landscape.js?v=162a';
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
 const vb=visualBiome(cell), climate=cell.visualClimate||{}, north=game.s.geographyVersion?Math.abs((z-ORIGIN_Z)/WORLD_DEPTH-.5)*2:Math.abs((z-ORIGIN_Z)/WORLD_DEPTH-.5)*2;
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
 else if(vb==='snow_mountain')color.set('#929b91');
 if(h<.7)color.set(palette.shallow);
 if(h>=3.4&&vb.startsWith('coastal_'))color.lerp(new T.Color(palette.beach),.16);
 if((vb==='mountain'||vb==='snow_mountain')&&h>22)color.lerp(new T.Color('#9aa09b'),.22);
 if((climate.lat??north)>.78&&h>3&&vb!=='desert'&&vb!=='mesa')color.lerp(new T.Color('#d7ddd2'),Math.max(0,((climate.lat??north)-.78)*1.6));
 return color;
}
// V150: biome colours blend smoothly between neighbouring cells along warped natural edges
// (no square tiles); beaches and shallows still follow the real height; grain cells show
// a patchwork of strip fields painted into the ground.
const atlasBase=(game,cell,out)=>groundBaseColor(cell,out); // V161: same palette as the detail map
export function atlasColor(game,x,z,h){
 const c=Math.min(COLS-1,Math.max(0,Math.floor((x-ORIGIN_X)/50))),r=Math.min(ROWS-1,Math.max(0,Math.floor((z-ORIGIN_Z)/50))),cell=game.cells[r*COLS+c];
 let color=smoothBiomeColor(game,x,z,'ground',(cl,out)=>atlasBase(game,cl,out));
 if(h<.7)color.set(palette.shallow);
 else if(h<3.4)color.lerp(new T.Color(palette.beach),Math.min(1,(3.4-h)/1.6)*.85);
 // Water is drawn by the real 3D channel. Do not paint the entire 50 m
 // river tile blue; it made square-ended ribbons and polygon patches.
 if(cell?.river){const near=riverNear(game,x,z);if(near.distance<near.width*1.6)color.lerp(new T.Color('#728e74'),.10)}
 color.multiplyScalar(.92+game.smooth(x/17+20,z/17+30)*.14);
 return color;
}
export function createAtlasDecor(game,scene,quality='medium'){const group=new T.Group();scene.add(group);const height=(x,z)=>Math.max(.7,surface(game,x,z,'world'));const material=c=>new T.MeshStandardMaterial({color:c,roughness:1});
 // One ocean mesh uses depth-dependent color, showing shelves and deep water.
 const geo=new T.PlaneGeometry(WORLD_WIDTH+200,WORLD_DEPTH+200,COLS*2,ROWS*2);geo.rotateX(-Math.PI/2);geo.translate(WORLD_CENTER_X,0,WORLD_CENTER_Z);const p=geo.attributes.position,colors=[];for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),h=game.atlasHeight(x,z),t=Math.max(0,Math.min(1,(-h+.8)/26)),shore=Math.pow(1-t,3),c=new T.Color('#5fa8aa').lerp(new T.Color('#102d4e'),Math.pow(t,.7));c.lerp(new T.Color('#9ac6b5'),shore*.33);c.multiplyScalar(.94+game.smooth(x/130+80,z/130+56)*.10);colors.push(c.r,c.g,c.b)}geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));{const d=new Float32Array(p.count);for(let i=0;i<p.count;i++)d[i]=.72-game.atlasHeight(p.getX(i),p.getZ(i));geo.setAttribute('aDepth',new T.BufferAttribute(d,1));}const water=new T.Mesh(geo,seaMaterial({scale:1}));water.position.y=.72;water.userData.water=true;group.add(water);group.userData.water=water;
 const shore=[];for(let z=ORIGIN_Z;z<ORIGIN_Z+WORLD_DEPTH;z+=10)for(let x=ORIGIN_X;x<ORIGIN_X+WORLD_WIDTH;x+=10){const points=[[x,z],[x+10,z],[x+10,z+10],[x,z+10]],hits=[];for(let i=0;i<4;i++){const a=points[i],b=points[(i+1)%4],ha=game.atlasHeight(...a)-.8,hb=game.atlasHeight(...b)-.8;if((ha>0)!==(hb>0)){const t=ha/(ha-hb);hits.push([a[0]+(b[0]-a[0])*t,1.04,a[1]+(b[1]-a[1])*t])}}if(hits.length===2)shore.push(...hits[0],...hits[1])}group.add(new T.LineSegments(new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute(shore,3)),new T.LineBasicMaterial({color:'#dbeddf',transparent:true,opacity:.12})));
 // Sparse ocean strokes give water scale without animated shader cost.
 const waves=[];for(const cell of game.cells)if(!cell.land&&!cell.coast&&game.noise(cell.c,cell.r+77)>.88){const x=cell.x,z=cell.z;for(let i=0;i<5;i++){const a=x-14+i*6,b=a+6;waves.push(a,.84,z+Math.sin(i*.9)*2,b,.84,z+Math.sin((i+1)*.9)*2)}}const waveLines=new T.LineSegments(new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute(waves,3)),new T.LineBasicMaterial({color:'#91c1bd',transparent:true,opacity:.11}));group.add(waveLines);group.userData.waveLines=waveLines;
 // Continuous terrain relief replaces separate rock instances.
 const peaks=game.cells.filter(c=>c.mountain);
 const dummy=new T.Object3D();
 // Civ-style world variety: fields, forests, jungles, tundra woods, deserts and mesas.
 const fields=game.cells.filter(c=>c.deposits.grain),
       plots=new T.InstancedMesh(new T.PlaneGeometry(17,12),material('#b9aa60'),fields.length),
       rocks=game.cells.filter(c=>c.deposits.stone&&c.biome!=='hills'),
       stones=new T.InstancedMesh(getWorldModel('rock','low'),WORLD_MODEL_MATERIAL,rocks.length);if(quality!=='low')stones.userData.lodGeometries={high:getWorldModel('rock','high'),low:getWorldModel('rock','low')};
 // V150: fields are painted into the terrain as strip-field patchwork (farmlandTint); no flat plates.
 plots.count=0;
 rocks.forEach((a,i)=>{dummy.position.set(a.x-10,height(a.x-10,a.z)-.2,a.z);dummy.rotation.set(0,i*1.4,0);dummy.scale.set(3.2,3.4,3.2);dummy.updateMatrix();stones.setMatrixAt(i,dummy.matrix)});
 group.add(spatialInstances(plots),spatialInstances(stones));
 const nature=createAtlasBiomeDetail(game,group,quality);
 // All tributaries and banks are one connected world-space 3D network.
 let rivers=createRiverNetwork(game,'world',null,quality),crossingRevision=game.s.crossingRevision||0;group.add(rivers);group.add(createMountainOutcrops(game,'world'));
 // Real-world traffic generates the atlas road network (no roads appear just because a route was planned).
 const roadGroup=new T.Group();roadGroup.name='V67 continuous road graph';roadGroup.userData.roadNetwork=true;group.add(roadGroup);let roadStamp='';
 function roads(state){
  if(crossingRevision!==(state.crossingRevision||0)){crossingRevision=state.crossingRevision||0;group.remove(rivers);disposeNetwork(rivers);rivers=createRiverNetwork(game,'world',null,quality);group.add(rivers)}
  const stamp=(state.roadRevision||0)+':'+(state.railRevision||0)+':'+(state.visionRevision||0);
  if(stamp===roadStamp)return;roadStamp=stamp;
  for(const o of [...roadGroup.children]){roadGroup.remove(o);disposeNetwork(o)}
  const network=createUnifiedRoadNetwork(game,'world');
  roadGroup.userData.roadEdges=network.userData.roadEdges;
  roadGroup.userData.roadVertexCount=network.userData.roadVertexCount;
  for(const mesh of [...network.children])roadGroup.add(mesh);
  // Permanent rail sleepers are separate from traffic-eroded footpaths.
  const rails=[];
  for(const key of Object.keys(state.railEdges||{})){
   const [a,b]=roadPoints(key);if(!game.seen(0,a)||!game.seen(0,b))continue;
   const pa=center(a.c,a.r),pb=center(b.c,b.r),dx=pb.x-pa.x,dz=pb.z-pa.z,len=Math.hypot(dx,dz);
   if(!len)continue;const nx=-dz/len*2.4,nz=dx/len*2.4;
   for(const offset of [-1,1]){
    const ax=pa.x+offset*nx,az=pa.z+offset*nz,bx=pb.x+offset*nx,bz=pb.z+offset*nz;
    rails.push(ax,surface(game,ax,az,'world')+1.4,az,bx,surface(game,bx,bz,'world')+1.4,bz);
   }
   for(let step=1;step<10;step++){
    const t=step/10,x=pa.x+dx*t,z=pa.z+dz*t;
    rails.push(x-nx*1.25,surface(game,x-nx*1.25,z-nz*1.25,'world')+1.22,z-nz*1.25,x+nx*1.25,surface(game,x+nx*1.25,z+nz*1.25,'world')+1.22,z+nz*1.25);
   }
  }
  if(rails.length){const railLine=new T.LineSegments(new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute(rails,3)),new T.LineBasicMaterial({color:'#3f4c56'}));roadGroup.add(railLine)}
 }
 const territories=new T.Group(),routes=new T.Group();group.add(territories,routes);let previous='',lastRoute='';
 function disposeGroup(g){for(const o of [...g.children]){o.geometry?.dispose();o.material?.dispose();g.remove(o)}}
 function territory(state){
  game.refreshTerritory();const stamp=game.territoryStamp+':'+(state.visionRevision||0);
  if(stamp===previous)return;previous=stamp;disposeGroup(territories);
  // V150: rounded, natural-looking territory shapes (same cells, smooth outline).
  const groups=new Map(),teams=new Map();
  for(const cell of game.cells){
   const city=game.territory.get(cell.c+':'+cell.r);if(!city||!game.seen(0,cell))continue;
   const rural=!!game.isCountyTile(cell,city),key=city.team+'|'+rural,k=cell.c+':'+cell.r;
   if(!groups.has(key))groups.set(key,{team:city.team,rural,cells:[],cities:new Map()});
   const g=groups.get(key);g.cells.push(k);if(!g.cities.has(city.id))g.cities.set(city.id,[]);g.cities.get(city.id).push(k);
   if(!teams.has(city.team))teams.set(city.team,[]);teams.get(city.team).push(k);
  }
  for(const {team,rural,cells,cities} of groups.values()){
   const color=rural?['#b6ce75','#dba082','#bca3d6','#dfcc87'][team]:['#69d4c3','#e77e64','#ac87e2','#ead06b'][team];
   const fillData=regionFill(cellRegion(cells)),fill=[],rgba=[];
   for(let i=0;i<fillData.alpha.length;i++){const x=fillData.pos[i*2],z=fillData.pos[i*2+1];fill.push(x,height(x,z)+.45,z);rgba.push(1,1,1,fillData.alpha[i]);}
   const edges=[];
   for(const keys of cities.values()){const seg=regionContour(cellRegion(keys));for(let i=0;i<seg.length;i+=4)edges.push(seg[i],height(seg[i],seg[i+1])+.9,seg[i+1],seg[i+2],height(seg[i+2],seg[i+3])+.9,seg[i+3]);}
   const geo=new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute(fill,3)).setAttribute('color',new T.Float32BufferAttribute(rgba,4));
   const mesh=new T.Mesh(geo,new T.MeshBasicMaterial({color,vertexColors:true,transparent:true,opacity:rural?.07:.11,depthWrite:false,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-8}));
   mesh.name=rural?'county area':'urban area';
   const line=new T.LineSegments(new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute(edges,3)),new T.LineBasicMaterial({color,transparent:true,opacity:rural?.95:.9}));line.name=rural?'county border':'urban border';territories.add(mesh,line);
  }
  // V152: country borders read as a map border, not as a river: a dashed line (cream edge, team core)
  // plus a soft team-coloured glow that fades inwards from the border.
  const national=[[],[],[],[]],underlay=[],glow=[[],[],[],[]];
  const quad=(vertices,p,q,r,t)=>vertices.push(...p,...r,...q,...q,...r,...t);
  for(const [team,keys] of teams){
   const region=cellRegion(keys),seg=regionContour(region,5);
   for(let i=0;i<seg.length;i+=4){
    const ax=seg[i],az=seg[i+1],bx=seg[i+2],bz=seg[i+3],len=Math.hypot(bx-ax,bz-az)||1,nx=-(bz-az)/len,nz=(bx-ax)/len;
    const mx=(ax+bx)/2,mz=(az+bz)/2,side=region.field(mx+nx*3,mz+nz*3)>=region.field(mx-nx*3,mz-nz*3)?1:-1;
    // glow: alpha 1 at the line, 0 eleven metres inside (alpha stored in the 4th colour channel)
    const g=glow[team],w=11*side,ex=(bx-ax)/len*.6,ez=(bz-az)/len*.6;
    const A=[ax-ex,az-ez],B=[bx+ex,bz+ez];
    g.push(A[0],height(A[0],A[1])+.55,A[1],1, B[0],height(B[0],B[1])+.55,B[1],1, A[0]+nx*w,height(A[0]+nx*w,A[1]+nz*w)+.55,A[1]+nz*w,0,
           A[0]+nx*w,height(A[0]+nx*w,A[1]+nz*w)+.55,A[1]+nz*w,0, B[0],height(B[0],B[1])+.55,B[1],1, B[0]+nx*w,height(B[0]+nx*w,B[1]+nz*w)+.55,B[1]+nz*w,0);
    // dashes: every 5 m contour piece becomes a 3 m dash
    const dx=(bx-ax)*.2,dz=(bz-az)*.2;
    for(const [vertices,half,lift] of [[underlay,2.3,1.15],[national[team],1.35,1.22]]){
     const pt=(x,z,sd)=>{const X=x+nx*half*sd,Z=z+nz*half*sd;return [X,height(X,Z)+lift,Z];};
     quad(vertices,pt(ax+dx,az+dz,-1),pt(ax+dx,az+dz,1),pt(bx-dx,bz-dz,-1),pt(bx-dx,bz-dz,1));
    }
   }
  }
  const teamColor=['#3fd2c6','#ff8a66','#b98cff','#ffd75e'];
  for(const [team,v] of glow.entries())if(v.length){
   const pos=[],col=[],c=new T.Color(teamColor[team]);for(let i=0;i<v.length;i+=4){pos.push(v[i],v[i+1],v[i+2]);col.push(c.r,c.g,c.b,v[i+3]);}
   const mesh=new T.Mesh(new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute(pos,3)).setAttribute('color',new T.Float32BufferAttribute(col,4)),
    new T.MeshBasicMaterial({vertexColors:true,transparent:true,opacity:.42,side:T.DoubleSide,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-8}));
   mesh.name='national border glow '+team;mesh.renderOrder=13;territories.add(mesh);
  }
  for(const [i,vertices]of [underlay,...national].entries())if(vertices.length){const mesh=new T.Mesh(new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute(vertices,3)),new T.MeshBasicMaterial({color:i===0?'#f4ecd4':teamColor[i-1],side:T.DoubleSide,transparent:true,opacity:i===0?.85:1,depthWrite:false,depthTest:false}));mesh.name=i===0?'national border outline':'national border '+(i-1);mesh.renderOrder=i===0?14:15;territories.add(mesh);}

 }
 function route(state,mover){const path=mover?.path||[],stamp=(mover?.c??'')+':'+(mover?.r??'')+JSON.stringify(path);if(stamp===lastRoute)return;lastRoute=stamp;disposeGroup(routes);if(!path.length)return;const tiles=[mover,...path],points=[];for(let i=1;i<tiles.length;i++){const a=center(tiles[i-1].c,tiles[i-1].r),b=center(tiles[i].c,tiles[i].r);for(let j=0;j<10;j++){const x=a.x+(b.x-a.x)*j/10,z=a.z+(b.z-a.z)*j/10;points.push(new T.Vector3(x,height(x,z)+2,z))}}const end=center(path.at(-1).c,path.at(-1).r);points.push(new T.Vector3(end.x,height(end.x,end.z)+2,end.z));const line=new T.Line(new T.BufferGeometry().setFromPoints(points),new T.LineDashedMaterial({color:'#f4d48b',dashSize:5,gapSize:3,transparent:true,opacity:1,depthTest:false}));line.computeLineDistances();routes.add(line);const dots=new T.InstancedMesh(new T.RingGeometry(2,3,12),new T.MeshBasicMaterial({color:'#fae4a4',side:T.DoubleSide,depthTest:false,depthWrite:false}),path.length);path.forEach((p,i)=>{const q=center(p.c,p.r);dummy.position.set(q.x,height(q.x,q.z)+2,q.z);dummy.rotation.set(-Math.PI/2,0,0);dummy.scale.set(1,1,1);dummy.updateMatrix();dots.setMatrixAt(i,dummy.matrix)});routes.add(dots)}

 return {group,territory,route,roads,routes,waveLines,peaks:peaks.length,shoreSegments:shore.length/6,nature};
}
// V46: readable settlement silhouettes from prehistoric huts to modern urban skylines.
const cityMaterials=new Map(),cityGeometries=new Map();
function cityMat(c,metal=false){const k=c+metal;if(!cityMaterials.has(k))cityMaterials.set(k,new T.MeshStandardMaterial({color:c,roughness:metal?.45:.91,metalness:metal?.2:0}));return cityMaterials.get(k)}
function cityGeom(key,fn){if(!cityGeometries.has(key)){const g=fn();g.userData.shared=true;cityGeometries.set(key,g)}return cityGeometries.get(key)}
export function createCityMiniature(team,age){
 // V152: one merged, era-specific settlement model (pitched-roof houses, landmark, lanes, walls).
 const g=new T.Group(),mesh=new T.Mesh(settlementGeometry(team,Math.max(0,Math.min(6,age|0))),SETTLEMENT_MATERIAL);
 mesh.castShadow=true;mesh.receiveShadow=true;mesh.userData.modelName='settlement_v152';g.add(mesh);
 g.userData.age=age;return g;
}
// V158: compact city label – dark rounded plate, team-coloured shield, name and population,
// constant size on screen (sizeAttenuation off) so it never covers the town when zoomed in.
export function cityBanner(name,team){
 const m=/^(.*?)\s*·\s*(\d+)\s*(?:el\.|elanikku|residents)?\s*$/.exec(name),title=m?m[1]:name,pop=m?m[2]:'';
 const canvas=document.createElement('canvas');canvas.width=520;canvas.height=104;const ctx=canvas.getContext('2d');
 const team_=['#4f9a92','#c0634a','#8a6cc0','#c9a43a'][team]||'#4f9a92';
 if(ctx.roundRect){ctx.fillStyle='rgba(12,26,28,.86)';ctx.beginPath();ctx.roundRect(4,12,512,80,40);ctx.fill();ctx.strokeStyle='rgba(230,199,126,.75)';ctx.lineWidth=3;ctx.stroke();}
 else if(ctx.fillRect){ctx.fillStyle='rgba(12,26,28,.86)';ctx.fillRect(4,12,512,80);}
 // team shield
 if(ctx.beginPath){ctx.fillStyle=team_;ctx.beginPath();ctx.moveTo(30,30);ctx.lineTo(70,30);ctx.lineTo(70,58);ctx.quadraticCurveTo?.(70,76,50,84);ctx.quadraticCurveTo?.(30,76,30,58);ctx.closePath?.();ctx.fill();ctx.strokeStyle='rgba(255,240,200,.8)';ctx.lineWidth=2.5;ctx.stroke();}
 if(ctx.fillText){let size=38;ctx.font='600 '+size+'px Georgia,serif';const maxW=pop?330:410;while(ctx.measureText&&ctx.measureText(title).width>maxW&&size>22){size-=2;ctx.font='600 '+size+'px Georgia,serif';}
  ctx.fillStyle='#f4ead2';ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillText(title,88,53);
  if(pop){ctx.font='600 30px Inter,Arial,sans-serif';ctx.textAlign='right';ctx.fillStyle='#e6c77e';ctx.fillText('👥 '+pop,496,54);}}
 const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=4;
 const sprite=new T.Sprite(new T.SpriteMaterial({map:texture,depthTest:false,transparent:true,sizeAttenuation:false}));
 sprite.scale.set(.21,.042,1);sprite.center.set(.5,0);sprite.renderOrder=40;sprite.userData.v158Label=true;return sprite}
