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
