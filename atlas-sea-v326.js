import * as T from './vendor/three.module.js';
// Sample the actual overview triangles, rather than the detailed river-bed
// function that can be metres below or above this coarser mesh.
export function atlasGroundSamplerV326(geometry){
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
  depth[i]=Math.min(.72-ground,.72-game.atlasHeight(x,z));
  p.setY(i,0);
 }
 for(const name of Object.keys(geo.attributes))if(name!=='position')geo.deleteAttribute(name);
 p.needsUpdate=true;geo.setAttribute('aDepth',new T.BufferAttribute(depth,1));geo.computeVertexNormals();geo.computeBoundingBox();geo.computeBoundingSphere();
 geo.userData.sharedCoastGridV326=true;return geo;
}
