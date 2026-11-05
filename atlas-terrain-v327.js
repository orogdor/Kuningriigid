// A conforming overview mesh: fine beside rivers/coasts, unchanged coarse
// density elsewhere. Shared vertices and stitched 2:1 edges prevent cracks.
import * as T from './vendor/three.module.js';
const metadata=new WeakMap();
export function createAtlasTerrainV327({width,depth,nx,nz,originX,originZ,rivers=[],coasts=[],height,maxLevel=3}){
 const sx=width/nx,sz=depth/nz,unit=2**maxLevel,row=nx*unit+1;
 const levels=new Uint8Array(nx*nz),queue=[];
 const raise=(c,r,level)=>{if(c<0||r<0||c>=nx||r>=nz)return;const k=r*nx+c;if(level>levels[k]){levels[k]=level;queue.push(k);}};
 const stamp=(x,z,radius,level)=>{
  const c0=Math.max(0,Math.floor((x-radius-originX)/sx)),c1=Math.min(nx-1,Math.floor((x+radius-originX)/sx));
  const r0=Math.max(0,Math.floor((z-radius-originZ)/sz)),r1=Math.min(nz-1,Math.floor((z+radius-originZ)/sz));
  for(let r=r0;r<=r1;r++)for(let c=c0;c<=c1;c++){
   const dx=Math.max(originX+c*sx-x,0,x-originX-(c+1)*sx),dz=Math.max(originZ+r*sz-z,0,z-originZ-(r+1)*sz);
   if(Math.hypot(dx,dz)<=radius)raise(c,r,level);
  }
 };
 for(const edge of rivers)for(const p of edge.points||[]){stamp(p.x,p.z,p.width+20,Math.min(1,maxLevel));stamp(p.x,p.z,p.width+3,maxLevel);}
 for(const p of coasts)stamp(p.x,p.z,22,Math.max(1,maxLevel-1));
 // Balance first; then every coarse/fine boundary needs just one midpoint.
 for(let q=0;q<queue.length;q++){
  const k=queue[q],c=k%nx,r=Math.floor(k/nx),level=levels[k]-1;if(level<=0)continue;
  raise(c-1,r,level);raise(c+1,r,level);raise(c,r-1,level);raise(c,r+1,level);
 }
 const vertices=[],indices=[],lookup=new Map();
 const vertex=(gx,gz)=>{
  const key=gz*row+gx;let i=lookup.get(key);if(i!==undefined)return i;
  const x=originX+gx*sx/unit,z=originZ+gz*sz/unit,y=height(x,z);
  if(!Number.isFinite(y))throw new Error('Non-finite adaptive atlas height');
  i=vertices.length/3;vertices.push(x,y,z);lookup.set(key,i);return i;
 };
 const polygon=(c,r,i,j)=>{
  const level=levels[r*nx+c],n=2**level,u=unit/n,x=c*unit+i*u,z=r*unit+j*u;
  const corners=[[x,z],[x,z+u],[x+u,z+u],[x+u,z]],splits=[
   i===0&&c>0&&levels[r*nx+c-1]>level,
   j===n-1&&r<nz-1&&levels[(r+1)*nx+c]>level,
   i===n-1&&c<nx-1&&levels[r*nx+c+1]>level,
   j===0&&r>0&&levels[(r-1)*nx+c]>level];
  const points=[];for(let k=0;k<4;k++){const a=corners[k],b=corners[(k+1)%4];points.push(a);if(splits[k])points.push([(a[0]+b[0])/2,(a[1]+b[1])/2]);}
  return {points,split:splits.some(Boolean),center:[x+u/2,z+u/2]};
 };
 for(let r=0;r<nz;r++)for(let c=0;c<nx;c++){
  const n=2**levels[r*nx+c];
  for(let j=0;j<n;j++)for(let i=0;i<n;i++){
   const {points,split,center}=polygon(c,r,i,j),ids=points.map(p=>vertex(...p));
   if(!split)indices.push(ids[0],ids[1],ids[3],ids[1],ids[2],ids[3]);
   else{const middle=vertex(...center);for(let k=0;k<ids.length;k++)indices.push(middle,ids[k],ids[(k+1)%ids.length]);}
  }
 }
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geo.setIndex(indices);
 geo.parameters={width,height:depth,widthSegments:nx,heightSegments:nz};geo.userData.adaptiveAtlasV327=true;
 geo.computeVertexNormals();geo.computeBoundingSphere();geo.computeBoundingBox();
 metadata.set(geo,{width,depth,nx,nz,originX,originZ,sx,sz,unit,row,levels,lookup,polygon});return geo;
}
export function adaptiveAtlasSamplerV327(geo){
 const m=metadata.get(geo);if(!m)return null;
 const {nx,nz,originX,originZ,sx,sz,unit,row,levels,lookup,polygon}=m,p=geo.attributes.position;
 const at=(gx,gz)=>p.getY(lookup.get(gz*row+gx));
 return (x,z)=>{
  const fx=Math.max(0,Math.min(nx-1e-8,(x-originX)/sx)),fz=Math.max(0,Math.min(nz-1e-8,(z-originZ)/sz));
  const c=Math.floor(fx),r=Math.floor(fz),n=2**levels[r*nx+c],u=(fx-c)*n,v=(fz-r)*n,i=Math.floor(u),j=Math.floor(v);
  const {points,split,center}=polygon(c,r,i,j),gx=(c+(i+u%1)/n)*unit,gz=(r+(j+v%1)/n)*unit;
  if(!split){const h=points.map(a=>at(...a)),a=u%1,b=v%1;return a+b<=1?h[0]*(1-a-b)+h[3]*a+h[1]*b:h[3]*(1-b)+h[1]*(1-a)+h[2]*(a+b-1);}
  for(let k=0;k<points.length;k++){
   const a=center,b=points[k],c=points[(k+1)%points.length],d=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);
   const wa=((b[1]-c[1])*(gx-c[0])+(c[0]-b[0])*(gz-c[1]))/d;
   const wb=((c[1]-a[1])*(gx-c[0])+(a[0]-c[0])*(gz-c[1]))/d,wc=1-wa-wb;
   if(Math.min(wa,wb,wc)>=-1e-6)return wa*at(...a)+wb*at(...b)+wc*at(...c);
  }
  return at(...points[0]);
 };
}
