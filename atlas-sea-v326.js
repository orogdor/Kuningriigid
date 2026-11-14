import {adaptiveAtlasSamplerV327} from './atlas-terrain-v327.js';
import * as T from './vendor/three.module.js';
import {estuaryFlareV344} from './continuous-landscape.js';
// Sample the actual overview triangles, rather than the detailed river-bed
// function that can be metres below or above this coarser mesh.
export function atlasGroundSamplerV326(geometry){
 const adaptive=adaptiveAtlasSamplerV327(geometry);if(adaptive)return adaptive;
 const p=geometry.attributes.position,nx=geometry.parameters.widthSegments,nz=geometry.parameters.heightSegments;
 const x0=p.getX(0),z0=p.getZ(0),sx=(p.getX(nx)-x0)/nx,sz=(p.getZ(nz*(nx+1))-z0)/nz;
 return (x,z)=>{
  const fx=Math.max(0,Math.min(nx-1e-7,(x-x0)/sx)),fz=Math.max(0,Math.min(nz-1e-7,(z-z0)/sz));
  const ix=Math.floor(fx),iz=Math.floor(fz),u=fx-ix,v=fz-iz,a=iz*(nx+1)+ix;
  const h00=p.getY(a),h10=p.getY(a+1),h01=p.getY(a+nx+1),h11=p.getY(a+nx+2);
  return u+v<=1?h00*(1-u-v)+h10*u+h01*v:h10*(1-v)+h01*(1-u)+h11*(u+v-1);
 };
}
// Keep the sea planar. Wet/dry masking belongs in aDepth, never in a
// -30 m vertex displacement that creates tilted triangular river-mouth cuts.
export function atlasSeaGeometryV326(game,terrainGeometry){
 const geo=terrainGeometry.clone(),p=geo.attributes.position,depth=new Float32Array(p.count);
 for(let i=0;i<p.count;i++){
  const x=p.getX(i),z=p.getZ(i),ground=p.getY(i);
  // The terrain triangles and sea triangles now share all x/z vertices.
  // The natural mask keeps deep inland river trenches from becoming ocean.
  // V344: a rounded river mouth lowers the natural shore, so the sea may
  // fill it; elsewhere the raw atlas still keeps inland trenches dry.
  const flare=game.cells?estuaryFlareV344(game,x,z):null,natural=flare?.strength>0?Math.min(game.atlasHeight(x,z),flare.ground):game.atlasHeight(x,z);
  depth[i]=Math.min(.72-ground,.72-natural);
  p.setY(i,0);
 }
 for(const name of Object.keys(geo.attributes))if(name!=='position')geo.deleteAttribute(name);
 p.needsUpdate=true;geo.setAttribute('aDepth',new T.BufferAttribute(depth,1));geo.computeVertexNormals();
 dropDryTrianglesV348(geo,depth);geo.computeBoundingBox();geo.computeBoundingSphere();
 geo.userData.sharedCoastGridV326=true;return geo;
}

// V348: the sea grid is a full copy of the terrain grid, but the water shader
// discards every fragment with interpolated depth below -0.103
// (smoothstep(-.12,.20,d)<.008). A triangle whose three vertices are all at or
// below SEA_DRY_LIMIT_V348 can therefore never draw a pixel; dropping it from
// the index changes no pixel and removes the inland part of the sea mesh.
export const SEA_DRY_LIMIT_V348=-.12;
export function dropDryTrianglesV348(geo,depth,limit=SEA_DRY_LIMIT_V348){
 const count=geo.attributes.position.count,src=geo.index?geo.index.array:null,n=src?src.length:count;
 const keep=new (count>65535?Uint32Array:Uint16Array)(n);let k=0;
 for(let i=0;i<n;i+=3){const a=src?src[i]:i,b=src?src[i+1]:i+1,c=src?src[i+2]:i+2;
  if(depth[a]<=limit&&depth[b]<=limit&&depth[c]<=limit)continue;keep[k++]=a;keep[k++]=b;keep[k++]=c;}
 geo.setIndex(new T.BufferAttribute(keep.slice(0,k),1));geo.userData.seaTrianglesV348={before:n/3,after:k/3};return geo;
}

// V352: the world sea as one flat plane and a depth texture.
// The V326 sea was a planar copy of the whole terrain grid (985 000 vertices) whose only job was to
// carry the depth per vertex. The same depth (same formula, terrain triangles sampled through
// atlasGroundSamplerV326) is now baked into a half-float texture that the water shader reads per
// pixel, so the sea is a handful of triangles. Coastlines still come from the terrain hiding the
// flat water, exactly as before.
// The depth is computed at the terrain vertices with the V326 formula and the terrain triangles are
// rasterised into the texture with the same linear interpolation the V326 mesh had. A vertex needs
// the (slow) natural atlas height only if one of its triangles has a vertex below the dry limit;
// every other triangle is dry at all three corners, the V348 sea never drew it, and its texels stay dry.
export const SEA_DRY_TEXEL_V352=-1;
export function atlasSeaDepthTextureV352(game,terrainGeometry,{texel=4}={}){
 if(!terrainGeometry.boundingBox)terrainGeometry.computeBoundingBox();
 const b=terrainGeometry.boundingBox,x0=b.min.x,z0=b.min.z,W=b.max.x-x0,D=b.max.z-z0,w=Math.max(1,Math.round(W/texel)),h=Math.max(1,Math.round(D/texel)),sx=W/w,sz=D/h;
 const p=terrainGeometry.attributes.position,count=p.count,P=p.array,stride=p.isInterleavedBufferAttribute?p.data.stride:3,off=p.isInterleavedBufferAttribute?p.offset:0;
 const X=i=>P[i*stride+off],Y=i=>P[i*stride+off+1],Z=i=>P[i*stride+off+2];
 const index=terrainGeometry.index?terrainGeometry.index.array:null,n=index?index.length:count,at=k=>index?index[k]:k;
 // 1) which vertices touch possibly wet triangles (ground alone already dry: depth <= .72-ground)
 const groundDry=.72-SEA_DRY_LIMIT_V348,need=new Uint8Array(count);
 for(let k=0;k<n;k+=3){const a=at(k),c=at(k+1),e=at(k+2);if(Y(a)<groundDry||Y(c)<groundDry||Y(e)<groundDry)need[a]=need[c]=need[e]=1;}
 // 2) V326 depth at those vertices
 const depth=new Float32Array(count).fill(-1e9);let computed=0;
 for(let i=0;i<count;i++){if(!need[i])continue;computed++;const x=X(i),z=Z(i),ground=Y(i);
  const flare=game.cells?estuaryFlareV344(game,x,z):null,natural=flare?.strength>0?Math.min(game.atlasHeight(x,z),flare.ground):game.atlasHeight(x,z);
  depth[i]=Math.min(.72-ground,.72-natural);}
 // the V326 vertex shader computed the shore factor per vertex and interpolated it; keep that
 const shore=new Float32Array(count);for(let i=0;i<count;i++){const t=Math.max(0,Math.min(1,depth[i]/3.6));shore[i]=1-t*t*(3-2*t);}
 // 3) rasterise every triangle the V348 sea kept
 const data=new Float32Array(w*h).fill(SEA_DRY_TEXEL_V352),shoreData=new Float32Array(w*h).fill(1);let triangles=0;
 for(let k=0;k<n;k+=3){
  const a=at(k),c=at(k+1),e=at(k+2),da=depth[a],dc=depth[c],de=depth[e],sa=shore[a],sc=shore[c],se=shore[e];
  if(da<=SEA_DRY_LIMIT_V348&&dc<=SEA_DRY_LIMIT_V348&&de<=SEA_DRY_LIMIT_V348)continue;triangles++;
  const ax=(X(a)-x0)/sx-.5,az=(Z(a)-z0)/sz-.5,cx=(X(c)-x0)/sx-.5,cz=(Z(c)-z0)/sz-.5,ex=(X(e)-x0)/sx-.5,ez=(Z(e)-z0)/sz-.5;
  const area=(cx-ax)*(ez-az)-(cz-az)*(ex-ax);if(Math.abs(area)<1e-12)continue;
  const i0=Math.max(0,Math.ceil(Math.min(ax,cx,ex)-1e-6)),i1=Math.min(w-1,Math.floor(Math.max(ax,cx,ex)+1e-6)),j0=Math.max(0,Math.ceil(Math.min(az,cz,ez)-1e-6)),j1=Math.min(h-1,Math.floor(Math.max(az,cz,ez)+1e-6));
  const eps=-1e-6*Math.abs(area);
  for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){
   const wa=(cx-i)*(ez-j)-(cz-j)*(ex-i),wc=(ex-i)*(az-j)-(ez-j)*(ax-i),we=(ax-i)*(cz-j)-(az-j)*(cx-i);
   if(area>0?(wa<eps||wc<eps||we<eps):(wa>-eps||wc>-eps||we>-eps))continue;
   // dry corners of a kept triangle keep their exact value (they may be far below -1)
   data[j*w+i]=(wa*da+wc*dc+we*de)/area;shoreData[j*w+i]=(wa*sa+wc*sc+we*se)/area;
  }
 }
 // R: depth, G: shore factor (both interpolated over the terrain triangles like the V326 varyings)
 const half=new Uint16Array(w*h*2);for(let i=0;i<w*h;i++){half[i*2]=T.DataUtils.toHalfFloat(Math.max(-60000,Math.min(60000,data[i])));half[i*2+1]=T.DataUtils.toHalfFloat(shoreData[i]);}
 const texture=new T.DataTexture(half,w,h,T.RGFormat,T.HalfFloatType);
 texture.magFilter=texture.minFilter=T.LinearFilter;texture.wrapS=texture.wrapT=T.ClampToEdgeWrapping;texture.generateMipmaps=false;texture.needsUpdate=true;
 texture.name='V352 sea depth';
 return {texture,box:new T.Vector4(x0,z0,W,D),width:w,height:h,stats:{vertices:count,computed,triangles},depth:data,shore:shoreData};
}
// Flat sea plane over the terrain's extent (y = 0, the mesh is lifted to sea level by the caller).
export function atlasSeaPlaneV352(box,segments=[24,18]){
 const geo=new T.PlaneGeometry(box.z,box.w,segments[0],segments[1]);geo.rotateX(-Math.PI/2);geo.translate(box.x+box.z/2,0,box.y+box.w/2);
 geo.deleteAttribute('uv');geo.computeBoundingBox();geo.computeBoundingSphere();return geo;
}
