// V154: new detail-map building models.
// Every building type gets its own readable silhouette and signature props, styled by era, and
// houses (the most common building) come in many seeded variants so streets do not repeat.
// Each model is built once in code into one merged mesh (plus separate animated parts) with
// per-vertex colour and a material channel; one shared shader adds plaster, planks, logs,
// masonry, brick, roof tiles, thatch, slate and glass detail. Presentation only.
import * as T from './vendor/three.module.js';

// ------------------------------------------------------------------ material
const M={plain:0,plaster:1,boards:2,logs:3,stone:4,brick:5,tile:6,thatch:7,slate:8,glass:9,metal:10,beam:11,dirt:12,leaf:13,cloth:14};
const GLSL_NOISE=`
float t154h(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float t154n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(t154h(i),t154h(i+vec2(1,0)),f.x),mix(t154h(i+vec2(0,1)),t154h(i+vec2(1,1)),f.x),f.y);}
`;
export const TOWN_MATERIAL=new T.MeshStandardMaterial({vertexColors:true,roughness:.88,metalness:0,side:T.DoubleSide});
TOWN_MATERIAL.onBeforeCompile=shader=>{
 shader.vertexShader=shader.vertexShader
  .replace('#include <common>','#include <common>\nattribute float aMat;varying float vT154M;varying vec3 vT154P;varying vec3 vT154N;')
  .replace('#include <begin_vertex>','#include <begin_vertex>\nvT154M=aMat;vT154P=position;vT154N=normal;');
 shader.fragmentShader=shader.fragmentShader
  .replace('#include <common>','#include <common>\nvarying float vT154M;varying vec3 vT154P;varying vec3 vT154N;float t154Rough=-1.0;float t154Metal=-1.0;'+GLSL_NOISE)
  .replace('#include <color_fragment>',`#include <color_fragment>
 {
  int m=int(vT154M+.5);vec3 p=vT154P;vec3 n=normalize(vT154N);
  bool side=abs(n.x)>abs(n.z);float u=side?p.z:p.x;float v=p.y;
  float k=1.0;
  if(m==1){k=.93+.10*t154n(p.xz*1.7+p.y*1.3)+.04*t154n(vec2(u,v)*6.0);}
  else if(m==2){float b=fract(u*2.6);k=.90+.12*t154n(vec2(floor(u*2.6),v*.7))+.05*t154n(vec2(u*20.0,v*1.5));k*=mix(.72,1.0,smoothstep(.0,.08,b)*smoothstep(1.0,.92,b));}
  else if(m==3){float r=fract(v*3.2);float round=sin(r*3.14159);k=(.66+.38*round)*(.9+.14*t154n(vec2(u*1.3,floor(v*3.2))));}
  else if(m==4){float row=floor(v*2.2);float x=u*1.5+t154h(vec2(row,3.1))*7.0+row*.37;float cx=fract(x),cy=fract(v*2.2);float jt=min(min(cx,1.0-cx)*2.6,min(cy,1.0-cy)*4.5);
   k=(.82+.25*t154h(vec2(floor(x),row)))*mix(.55,1.0,smoothstep(.04,.16,jt));}
  else if(m==5){float row=floor(v*6.0);float x=u*3.0+row*.5;float cx=fract(x),cy=fract(v*6.0);float jt=min(min(cx,1.0-cx)*5.0,min(cy,1.0-cy)*3.0);
   k=(.84+.22*t154h(vec2(floor(x),row)))*mix(1.25,1.0,smoothstep(.05,.2,jt));if(jt<.05)k=1.35;}
  else if(m==6){float row=v*4.2+(side?p.x:p.z)*0.0;float r=fract(row);float x=fract(u*2.8+floor(row)*.5);
   k=(.78+.28*smoothstep(0.0,.85,r))*(.9+.16*t154h(vec2(floor(u*2.8+floor(row)*.5),floor(row))))*mix(.78,1.0,smoothstep(.0,.12,x));}
  else if(m==7){k=.78+.30*t154n(vec2(u*9.0,v*1.4))+.10*t154n(vec2(u*30.0,v*4.0));k*=.92+.10*smoothstep(.85,1.0,fract(v*1.6));}
  else if(m==8){float r=fract(v*5.5);float x=fract(u*3.4+floor(v*5.5)*.5);k=(.82+.2*t154h(vec2(floor(u*3.4+floor(v*5.5)*.5),floor(v*5.5))))*mix(.8,1.0,smoothstep(0.,.1,r))*mix(.85,1.0,smoothstep(0.,.08,x));}
  else if(m==9){k=1.0;float g=smoothstep(.2,.9,t154n(vec2(u*.7+v*.4,v*.3)));diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.78,.86,.9),g*.35);t154Rough=.12;}
  else if(m==10){k=.92+.1*t154n(vec2(u*4.0,v*4.0));t154Rough=.42;t154Metal=.55;}
  else if(m==11){k=.86+.16*t154n(vec2(u*1.5+v*1.5,(u+v)*14.0));}
  else if(m==12){k=.84+.24*t154n(p.xz*1.4)+.06*t154n(p.xz*9.0);}
  else if(m==13){k=.75+.35*t154n(p.xz*3.0+p.y*2.0);}
  else if(m==14){k=.95+.05*t154n(vec2(u*12.0,v*12.0));}
  diffuseColor.rgb*=k;
 }`)
  .replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nif(t154Rough>=0.0)roughnessFactor=t154Rough;')
  .replace('#include <metalnessmap_fragment>','#include <metalnessmap_fragment>\nif(t154Metal>=0.0)metalnessFactor=t154Metal;');
};
TOWN_MATERIAL.customProgramCacheKey=()=>'town-v154';
const GLOW=new T.MeshStandardMaterial({color:'#ffcf7a',emissive:'#ffb24a',emissiveIntensity:1.4,roughness:.6});

// ------------------------------------------------------------------ builder
const _m=new T.Matrix4(),_q=new T.Quaternion(),_e=new T.Euler(),_v=new T.Vector3(),_s=new T.Vector3(),_n3=new T.Matrix3();
class B{
 constructor(){this.p=[];this.n=[];this.c=[];this.m=[];this.frame=new T.Matrix4();}
 add(geo,x,y,z,rx,ry,rz,sx,sy,sz,color,mat){
  const g=geo.index?geo.toNonIndexed():geo,P=g.attributes.position,N=g.attributes.normal;
  _m.compose(_v.set(x,y,z),_q.setFromEuler(_e.set(rx,ry,rz)),_s.set(sx,sy,sz)).premultiply(this.frame);_n3.getNormalMatrix(_m);
  const col=new T.Color(color),a=new T.Vector3(),nn=new T.Vector3();
  for(let i=0;i<P.count;i++){a.fromBufferAttribute(P,i).applyMatrix4(_m);nn.fromBufferAttribute(N,i).applyMatrix3(_n3).normalize();
   this.p.push(a.x,a.y,a.z);this.n.push(nn.x,nn.y,nn.z);this.c.push(col.r,col.g,col.b);this.m.push(mat);}
  if(g!==geo)g.dispose();geo.dispose();return this;
 }
 poly(pts,color,mat){ // planar convex polygon in model space (array of [x,y,z])
  const col=new T.Color(color),A=new T.Vector3(...pts[0]).applyMatrix4(this.frame);
  const W=pts.map(p=>new T.Vector3(...p).applyMatrix4(this.frame)),nrm=new T.Vector3().subVectors(W[1],W[0]).cross(new T.Vector3().subVectors(W[2],W[0])).normalize();
  for(let i=1;i<W.length-1;i++)for(const q of [W[0],W[i],W[i+1]]){this.p.push(q.x,q.y,q.z);this.n.push(nrm.x,nrm.y,nrm.z);this.c.push(col.r,col.g,col.b);this.m.push(mat);}
  return this;
 }
 with(x,z,ry,fn){const old=this.frame.clone();this.frame.multiply(new T.Matrix4().compose(new T.Vector3(x,0,z),new T.Quaternion().setFromEuler(new T.Euler(0,ry,0)),new T.Vector3(1,1,1)));fn();this.frame.copy(old);return this;}
 geometry(){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(this.p,3));g.setAttribute('normal',new T.Float32BufferAttribute(this.n,3));
  g.setAttribute('color',new T.Float32BufferAttribute(this.c,3));g.setAttribute('aMat',new T.Float32BufferAttribute(this.m,1));g.computeBoundingSphere();g.userData.shared=true;return g;}
}
// primitives — y is the bottom of the shape
const box=(b,x,y,z,w,h,d,c,m=M.plain,ry=0)=>b.add(new T.BoxGeometry(w,h,d),x,y+h/2,z,0,ry,0,1,1,1,c,m);
const boxR=(b,x,y,z,w,h,d,c,m,rx,ry,rz)=>b.add(new T.BoxGeometry(w,h,d),x,y,z,rx,ry,rz,1,1,1,c,m); // centred, rotated
const cyl=(b,x,y,z,rt,rb,h,c,m=M.plain,seg=10)=>b.add(new T.CylinderGeometry(rt,rb,h,seg),x,y+h/2,z,0,0,0,1,1,1,c,m);
const cylR=(b,x,y,z,r,h,c,m,rx,ry,rz,seg=8)=>b.add(new T.CylinderGeometry(r,r,h,seg),x,y,z,rx,ry,rz,1,1,1,c,m);
const cone=(b,x,y,z,r,h,c,m=M.plain,seg=10)=>b.add(new T.ConeGeometry(r,h,seg),x,y+h/2,z,0,0,0,1,1,1,c,m);
const ball=(b,x,y,z,r,c,m=M.plain,sy=1,seg=8)=>b.add(new T.SphereGeometry(r,seg,Math.max(4,seg*.6|0)),x,y,z,0,0,0,1,sy,1,c,m);
const dome=(b,x,y,z,r,c,m=M.plain,seg=12)=>b.add(new T.SphereGeometry(r,seg,6,0,Math.PI*2,0,Math.PI/2),x,y,z,0,0,0,1,1,1,c,m);

// seeded random
function rng(seed){let a=(seed>>>0)||1;return ()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const pick=(r,arr)=>arr[Math.floor(r()*arr.length)%arr.length];
const lerp=(a,b,t)=>a+(b-a)*t;
const shade=(c,k)=>'#'+new T.Color(c).multiplyScalar(k).getHexString();

// ------------------------------------------------------------------ roofs
// Gable roof over a w×d rectangle; ridge along x (axis 'x') or z. Slopes are thin slabs with eaves.
function gable(b,x,y,z,w,d,rise,c,m,{axis='x',over=.35,thick=.14,gableC=null,gableM=M.plaster}={}){
 b.with(x,z,axis==='x'?0:Math.PI/2,()=>{
  const W=axis==='x'?w:d,D=axis==='x'?d:w,half=D/2+over,a=Math.atan2(rise,D/2),len=half/Math.cos(a);
  for(const s of [-1,1])boxR(b,0,y+rise-Math.tan(a)*half/2+thick*.5,s*half/2,W+over*1.2,thick,len,c,m,s*a,0,0);
  boxR(b,0,y+rise+thick*.6,0,W+over*1.2,thick*1.2,thick*1.6,shade(c,.8),m,0,0,0);
  if(gableC)for(const s of [-1,1])b.poly(s>0?[[s*W/2,y,-D/2],[s*W/2,y,D/2],[s*W/2,y+rise,0]]:[[s*W/2,y,D/2],[s*W/2,y,-D/2],[s*W/2,y+rise,0]],gableC,gableM);
 });
}
function hip(b,x,y,z,w,d,rise,c,m,over=.3){
 const W=w/2+over,D=d/2+over,rx=Math.max(0,(w-d)/2),rz=Math.max(0,(d-w)/2),h=rise;
 b.with(x,z,0,()=>{
  b.poly([[-W,y,D],[W,y,D],[rx,y+h,rz],[-rx,y+h,rz]],c,m);b.poly([[W,y,-D],[-W,y,-D],[-rx,y+h,-rz],[rx,y+h,-rz]],c,m);
  b.poly([[W,y,D],[W,y,-D],[rx,y+h,-rz],[rx,y+h,rz]],shade(c,.92),m);b.poly([[-W,y,-D],[-W,y,D],[-rx,y+h,rz],[-rx,y+h,-rz]],shade(c,.92),m);
 });
}
function shed(b,x,y,z,w,d,rise,c,m){const a=Math.atan2(rise,d),len=Math.hypot(rise,d)+.4;boxR(b,x,y+rise/2+.06,z,w+.4,.12,len,c,m,a,0,0);} // high at -z
// ------------------------------------------------------------------ facade details
// windows on a face: face 'f' (+z), 'b' (-z), 'r' (+x), 'l' (-x); u along face, y bottom
function win(b,face,cx,cz,u,y,w,h,{frame='#e8e2d4',glass='#3f5560',shutter=null,cross=true,sill=true}={}){
 const ry={f:0,b:Math.PI,r:Math.PI/2,l:-Math.PI/2}[face];
 b.with(cx,cz,ry,()=>{
  box(b,u,y-.08,0,w+.18,h+.16,.1,frame,M.plain);box(b,u,y,.04,w,h,.06,glass,M.glass);
  if(cross){box(b,u,y,.08,.06,h,.04,frame);box(b,u,y+h*.55,.08,w,.06,.04,frame);}
  if(sill)box(b,u,y-.16,.1,w+.3,.08,.18,shade(frame,.85));
  if(shutter)for(const s of [-1,1])box(b,u+s*(w/2+.2),y-.02,.06,w*.48,h+.04,.06,shutter,M.boards);
 });
}
function doorway(b,face,cx,cz,u,w,h,c='#5d4127',frame='#d9d0bc',arch=false){
 const ry={f:0,b:Math.PI,r:Math.PI/2,l:-Math.PI/2}[face];
 b.with(cx,cz,ry,()=>{box(b,u,0,0,w+.24,h+.14,.12,frame);box(b,u,0,.05,w,h,.08,c,M.boards);if(arch)cylR(b,u,h,.05,w/2,.1,c,M.boards,Math.PI/2,0,0,10);box(b,u,0,.35,w+.5,.12,.5,'#8f8a7e',M.stone);});
}
// windows along all four faces of a w×d block for each storey
function windowRows(b,w,d,y0,storeyH,storeys,o){
 for(let s=0;s<storeys;s++){const y=y0+s*storeyH+storeyH*.36,h=storeyH*.42;
  for(const [face,len,cx,cz] of [['f',w,0,d/2],['b',w,0,-d/2],['r',d,w/2,0],['l',d,-w/2,0]]){
   const n=Math.max(1,Math.floor(len/(o.spacing||1.9)));
   for(let i=0;i<n;i++){const u=(i-(n-1)/2)*(len/n);if(s===0&&face==='f'&&Math.abs(u)<(o.doorGap||.9))continue;if(o.skip&&o.skip(face,s,i))continue;win(b,face,cx,cz,u,y,o.ww||.7,h,o);}
  }
 }
}
// half-timbering on the four faces
function timber(b,w,d,y0,h,c,{brace=true,spacing=1.35}={}){
 for(const [face,len,cx,cz] of [['f',w,0,d/2],['b',w,0,-d/2],['r',d,w/2,0],['l',d,-w/2,0]]){
  const ry={f:0,b:Math.PI,r:Math.PI/2,l:-Math.PI/2}[face];
  b.with(cx,cz,ry,()=>{
   const n=Math.max(2,Math.round(len/spacing));for(let i=0;i<=n;i++)box(b,-len/2+i*len/n,y0,.04,.16,h,.08,c,M.beam);
   for(const yy of [y0,y0+h-.16])box(b,0,yy,.05,len,.16,.08,c,M.beam);
   box(b,0,y0+h*.48,.05,len,.13,.08,c,M.beam);
   if(brace){const a=Math.atan2(h*.46,len/n);for(const s of [-1,1])boxR(b,s*(len/2-len/n/2),y0+h*.25,.06,Math.hypot(len/n,h*.46),.12,.06,c,M.beam,0,0,s*a);}
  });
 }
}
function chimney(b,x,z,y,h,c='#8e8578',m=M.stone){box(b,x,y,z,.55,h,.55,c,m);box(b,x,y+h,z,.7,.16,.7,shade(c,.7),m);}
function smokeFrom(root,x,y,z){const smoke=new T.Group();smoke.position.set(x,y,z);for(let i=0;i<4;i++){const m=new T.Mesh(new T.SphereGeometry(1,6,4),new T.MeshBasicMaterial({color:0xaaa99e,transparent:true,opacity:.16,depthWrite:false}));m.scale.setScalar(.14+i*.05);smoke.add(m)}root.add(smoke);root.userData.smoke=smoke;}
// ------------------------------------------------------------------ props
const logPile=(b,x,z,n=6,ry=0)=>b.with(x,z,ry,()=>{for(let i=0;i<n;i++){const row=Math.floor(i/3),k=i%3;cylR(b,(k-1)*.36+row*.18,.2+row*.32,0,.18,1.6,'#7a5a3a',M.logs,0,0,Math.PI/2);}});
const planks=(b,x,z,ry=0,c='#c09a66')=>b.with(x,z,ry,()=>{for(let i=0;i<5;i++)box(b,0,.1+i*.09,0,2.2,.08,.9-i*.05,shade(c,1-i*.03),M.boards);});
const crate=(b,x,z,s=.6,c='#9b7447')=>box(b,x,0,z,s,s,s,c,M.boards);
const barrel=(b,x,z,c='#7c5634')=>{cyl(b,x,0,z,.28,.28,.75,c,M.boards,10);cyl(b,x,.12,z,.3,.3,.06,'#4a4a48',M.metal,10);cyl(b,x,.56,z,.3,.3,.06,'#4a4a48',M.metal,10);};
const sack=(b,x,z,c='#c9b58a')=>ball(b,x,.28,z,.3,c,M.cloth,.9,7);
const hay=(b,x,z,r=.9)=>{cyl(b,x,0,z,r,r*1.05,r*.9,'#c8a95a',M.thatch,10);cone(b,x,r*.9,z,r,r*.9,'#bc9d52',M.thatch,10);};
const bush=(b,x,z,r=.5,c='#4f7a3a')=>ball(b,x,r*.7,z,r,c,M.leaf,.8,7);
const tree=(b,x,z,s=1,c='#4f7a3a')=>{cyl(b,x,0,z,.09*s,.14*s,1.4*s,'#5b4430',M.beam,6);ball(b,x,1.9*s,z,.9*s,c,M.leaf,.9,8);ball(b,x+.4*s,1.6*s,z+.2*s,.55*s,shade(c,1.1),M.leaf,.9,7);};
const fenceLine=(b,x0,z0,x1,z1,c='#8a6c48',h=.9)=>{const len=Math.hypot(x1-x0,z1-z0),n=Math.max(1,Math.round(len/1.1)),a=Math.atan2(z1-z0,x1-x0);
 for(let i=0;i<=n;i++)box(b,lerp(x0,x1,i/n),0,lerp(z0,z1,i/n),.1,h,.1,c,M.beam);for(const y of [h*.4,h*.8])boxR(b,(x0+x1)/2,y,(z0+z1)/2,len,.07,.06,c,M.boards,0,-a,0);};
const sign=(b,x,y,z,c,face=0)=>b.with(x,z,face,()=>{box(b,0,y,.05,.08,.9,.08,'#5b4430',M.beam);box(b,.4,y+.75,.05,.8,.06,.06,'#5b4430',M.beam);box(b,.45,y+.2,.05,.62,.5,.06,c,M.boards);});
const banner=(b,x,y,z,c,h=4)=>{cyl(b,x,y,z,.05,.06,h,'#5c5148',M.metal,6);box(b,x+.45,y+h-1.25,z,.85,1.1,.04,c,M.cloth);};
const awning=(b,x,y,z,w,c1,c2,face=0)=>b.with(x,z,face,()=>{const n=Math.max(2,Math.round(w/.45));for(let i=0;i<n;i++)boxR(b,-w/2+(i+.5)*w/n,y,.45,w/n,.05,1.0,i%2?c1:c2,M.cloth,.38,0,0);});
const stall=(b,x,z,c1,c2,ry=0)=>b.with(x,z,ry,()=>{box(b,0,0,0,1.8,.8,.9,'#8d6a45',M.boards);for(const sx of [-.85,.85])for(const sz of [-.4,.4])box(b,sx,0,sz,.08,1.9,.08,'#6d5034',M.beam);
 for(let i=0;i<6;i++)boxR(b,-.75+i*.3,2.0,0,.3,.05,1.25,i%2?c1:c2,M.cloth,.18,0,0);for(let i=0;i<4;i++)ball(b,-.6+i*.4,.92,0,.15,['#c4492f','#e0b33c','#7a9a3a','#b5652e'][i],M.plain,1,6);});
const cart=(b,x,z,ry=0)=>b.with(x,z,ry,()=>{box(b,0,.45,0,1.5,.4,.9,'#8b6a44',M.boards);for(const s of [-1,1])cylR(b,-.3,.38,s*.5,.38,.08,'#5b4430',M.beam,Math.PI/2,0,0,10);boxR(b,1.15,.55,0,1.1,.08,.08,'#6d5034',M.beam,0,0,.15);});
const anvil=(b,x,z)=>{box(b,x,0,z,.45,.5,.45,'#6d5a48',M.beam);box(b,x,.5,z,.75,.22,.3,'#3c3d40',M.metal);};
const target=(b,x,z,ry=0)=>b.with(x,z,ry,()=>{cylR(b,0,1.0,0,.7,.18,'#d9c59a',M.thatch,Math.PI/2,0,0,14);cylR(b,0,1.0,.1,.45,.04,'#c0392b',M.cloth,Math.PI/2,0,0,14);cylR(b,0,1.0,.13,.2,.04,'#e8d27a',M.cloth,Math.PI/2,0,0,12);for(const s of [-1,1])boxR(b,s*.35,.55,-.25,.08,1.2,.08,'#6d5034',M.beam,-.25,0,0);});
const rack=(b,x,z,ry=0,c='#a3542f')=>b.with(x,z,ry,()=>{for(const s of [-1,1])box(b,s*.8,0,0,.1,1.5,.1,'#6d5034',M.beam);box(b,0,1.4,0,1.8,.08,.08,'#6d5034',M.beam);for(let i=0;i<4;i++)box(b,-.6+i*.4,.5,.03,.32,.85,.03,i%2?c:shade(c,.8),M.cloth);});
const stoneBlocks=(b,x,z,ry=0)=>b.with(x,z,ry,()=>{for(let i=0;i<5;i++){const k=i%3,row=Math.floor(i/3);box(b,(k-1)*.75+row*.35,row*.5,0,.7,.5,.6,shade('#b3ad9e',.9+((i*37)%10)/50),M.stone);}});
const pots=(b,x,z,c='#b5683e')=>{for(let i=0;i<4;i++){const xx=x+(i%2)*.5,zz=z+Math.floor(i/2)*.5;cyl(b,xx,0,zz,.16,.12,.2,c,M.plain,8);ball(b,xx,.35,zz,.22,c,M.plain,1.0,8);}};
const bed=(b,x,z,w,d,crop,rows=4)=>{box(b,x,0,z,w,.12,d,'#6b5236',M.dirt);for(let i=0;i<rows;i++)box(b,x,.12,z-d/2+(i+.5)*d/rows,w*.92,.22,d/rows*.55,crop,M.leaf);};
const lantern=(root,x,y,z)=>{const m=new T.Mesh(new T.BoxGeometry(.18,.24,.18),GLOW);m.position.set(x,y,z);root.add(m);};

// ------------------------------------------------------------------ era styles
const ERA=a=>a<=0?0:a<=2?1:a===3?3:a===4?4:a===5?5:6;
const PAL={
 daub:['#9a7d58','#8d7352','#a3865e'],wattle:['#c2ad86','#b9a27c','#cdb994','#b29a72'],logs:['#7a5a3a','#6e4f33','#866446'],
 thatch:['#b39556','#a58a52','#8f7a4c','#9a8a5c','#7f7a4f'],
 plasterM:['#ece4d0','#e4d6b6','#dcc69c','#eadacc','#e9e1c4','#d6cdb6'],beam:['#3d2b1f','#2b231d','#4a3424'],
 tileM:['#9a4a32','#7e3f2c','#a85b3c','#8a5236'],slate:['#4f5560','#5b616a','#454b55'],
 facade:['#e6c86e','#d98f6f','#9fb7c9','#a9c29a','#efe6d2','#c97f7f','#f1f0ea','#e9b48a','#b9a6c9','#d7d18f'],
 brick:['#8e4b38','#a35a43','#7a4636','#b88a5e','#94503c'],stucco:['#e9e3d5','#ded6c2','#f2efe6'],
 concrete:['#d9d9d4','#b9bcbc','#e8e6df','#c9c3b8'],panel:['#b86b4b','#5f6b72','#8a9a7b','#c9a46a','#6d7f99','#e4ded2'],
 door:['#5d4127','#3f5b4a','#6b2f2a','#2f4157','#7a5a32'],shutter:['#3f5b4a','#6b2f2a','#2f4157','#a0743c','#56607a']
};
const TEAM=['#3f7a8c','#b0533e','#7d5fb0','#c09a2e'];

// ------------------------------------------------------------------ houses
function houseStone(b,r,v){
 const kind=v%4;
 const fire=()=>{for(let i=0;i<7;i++){const a=i/7*6.28;ball(b,1.9+Math.cos(a)*.45,.12,1.9+Math.sin(a)*.45,.16,'#8f8c80',M.stone,.7,6);}cone(b,1.9,0,1.9,.3,.5,'#c36a2e',M.plain,6);};
 if(kind===1){ // hide tent
  const R=1.9+r()*.4,H=3.4+r()*.5,hide=pick(r,['#b49a72','#a68a63','#c2aa83']);
  cone(b,0,0,0,R,H,hide,M.cloth,9);for(let i=0;i<7;i++){const a=i/7*6.28;boxR(b,Math.cos(a)*.22,H+.2,Math.sin(a)*.22,.07,1.2,.07,'#6d5034',M.beam,Math.sin(a)*.25,0,-Math.cos(a)*.25);}
  box(b,0,0,R*.82,.8,1.1,.25,'#4a3a2a',M.cloth);fire();rack(b,-2,1.4,.5,'#9b7b55');return;}
 const R=kind===2?2.6:2.0+r()*.6,wall=kind===3?1.9:2.1+r()*.4,roofH=kind===2?2.2:2.4+r()*.8,c=pick(r,PAL.daub),th=pick(r,PAL.thatch);
 cyl(b,0,0,0,R,R*1.04,wall,c,M.plaster,12);cone(b,0,wall,0,R+.5,roofH,th,M.thatch,12);cone(b,0,wall+roofH-.3,0,.3,.6,shade(th,.75),M.thatch,8);
 box(b,0,0,R-.05,1.0,1.85,.4,'#3b2c20',M.boards);
 if(kind===3){cyl(b,2.3,0,-1.3,1.1,1.15,1.6,c,M.plaster,10);cone(b,2.3,1.6,-1.3,1.45,1.6,th,M.thatch,10);}
 fire();if(r()>.4)logPile(b,-2.4,.9,5,1.2);if(r()>.5)pots(b,-1.8,-2.0);if(r()>.6)rack(b,-2.2,1.9,.3,'#a08060');
}
function houseEarly(b,r,v,age){ // bronze & iron age
 const kind=v%6,iron=age>=2,th=pick(r,PAL.thatch);
 const yard=()=>{if(r()>.35)fenceLine(b,-3.4,2.6,-1.2,2.6,'#8a6c48',.8);if(r()>.4)logPile(b,2.7,1.9,4+(r()*3|0),Math.PI/2);if(r()>.6)hay(b,-2.8,-2.2,.6);if(r()>.6)pots(b,2.4,-2.3);if(r()>.7)cart(b,-2.6,1.6,.4);};
 if(kind===2){ // round house
  const R=2.6+r()*.4,c=pick(r,PAL.wattle);cyl(b,0,0,0,R,R,2.4,c,M.plaster,14);cone(b,0,2.3,0,R+.6,3.3,th,M.thatch,14);box(b,0,0,R-.1,1.1,2.0,.6,'#4b3826',M.boards);box(b,0,2.0,R+.25,1.4,.12,.8,th,M.thatch);yard();return;}
 const long=kind===1,logH=kind===3,w=long?6.8:4.6+r()*1.3,d=long?3.8:3.6+r()*.7,wh=long?2.3:2.4+r()*.4,rise=long?2.6:2.2+r()*.8;
 const wall=logH?pick(r,PAL.logs):pick(r,PAL.wattle),wm=logH?M.logs:M.plaster;
 if(iron)box(b,0,0,0,w+.25,.3,d+.25,'#8d877a',M.stone);
 box(b,0,iron?.3:0,0,w,wh,d,wall,wm);
 const y=wh+(iron?.3:0),roofC=logH?pick(r,['#6f5b45','#7a6650']):th;
 const ax=long||kind===4?'x':(r()>.5?'z':'x');
 gable(b,0,y,0,w,d,ax==='z'?rise*.85:rise,roofC,logH?M.boards:M.thatch,{axis:ax,over:long?.6:.45,thick:logH?.12:.28,gableC:logH?wall:shade(wall,.95),gableM:wm});
 if(!logH)for(const s of [-1,1])box(b,s*w/2,0,d/2,.16,y,.16,'#5b4430',M.beam);
 doorway(b,'f',0,d/2,long?-1.2:0,.9,1.55,'#4e3a28','#6d5034');
 for(const u of long?[.8,2.2]:[-1.5,1.5])if(r()>.2)win(b,'f',0,d/2,u,y*.5,.45,.45,{frame:'#6d5034',glass:'#2b2a26',cross:false,sill:false});
 if(kind===4){box(b,-w/2-1.1,0,0,2.0,1.4,d*.7,wall,wm);shed(b,-w/2-1.1,1.4,0,2.0,d*.7,.6,roofC,M.thatch);}
 if(kind===5){for(const sx of [-.8,.8])for(const sz of [-.6,.6])box(b,w/2+1.8+sx,0,-1+sz,.14,.9,.14,'#5b4430',M.beam);box(b,w/2+1.8,.9,-1,1.9,1.0,1.5,wall,M.boards);gable(b,w/2+1.8,1.9,-1,1.9,1.5,.9,roofC,M.thatch,{axis:'z',over:.25,thick:.2});}
 if(iron&&r()>.5)chimney(b,w*.3,-d*.15,y,rise*.85,'#7d756a');
 yard();
}
function houseMedieval(b,r,v){
 const storeys=1+(v%3===0?2:v%3===1?1:0)+(r()>.85?1:0),w=5+r()*2.2,d=4.4+r()*1.2,sh=2.3,jetty=storeys>1&&r()>.35,stoneBase=r()>.45;
 const plaster=pick(r,PAL.plasterM),beam=pick(r,PAL.beam),roofKind=r(),roofC=roofKind<.55?pick(r,PAL.tileM):roofKind<.8?pick(r,PAL.slate):pick(r,PAL.thatch),roofM=roofKind<.55?M.tile:roofKind<.8?M.slate:M.thatch;
 const axisFront=r()>.5; // gable facing the street?
 let y=0;
 for(let s=0;s<storeys;s++){const o=jetty&&s>0?.35*s:0,W=w+o,D=d+o;
  if(s===0&&stoneBase){box(b,0,0,0,W,sh,D,'#a49c8c',M.stone);}
  else{box(b,0,y,0,W,sh,D,plaster,M.plaster);timber(b,W,D,y,sh,beam,{brace:r()>.3});}
  if(o)box(b,0,y-.12,0,W+.1,.2,D+.1,beam,M.beam);
  y+=sh;
 }
 const W=w+(jetty?.35*(storeys-1):0),D=d+(jetty?.35*(storeys-1):0),rise=Math.min(W,D)*(.75+r()*.3);
 gable(b,0,y,0,W,D,rise,roofC,roofM,{axis:axisFront?'z':'x',over:.4,thick:roofM===M.thatch?.3:.15,gableC:plaster,gableM:M.plaster});
 if(axisFront&&roofM!==M.thatch)timber(b,.01,.01,y,0,beam);
 windowRows(b,W,D,0,sh,storeys,{spacing:1.8,ww:.62,frame:'#ece6d6',glass:'#384b55',shutter:r()>.4?pick(r,PAL.shutter):null,doorGap:1.1});
 doorway(b,'f',0,D/2,(r()-.5)*1.2,1.0,1.9,pick(r,PAL.door),'#6d5034');
 if(r()>.3)chimney(b,W*.3*(r()>.5?1:-1),-D*.2,y,rise+.6);
 if(!axisFront&&r()>.45){const dx=(r()-.5)*W*.5;box(b,dx,y+rise*.25,D/2-.6,1.1,1.0,1.2,plaster,M.plaster);gable(b,dx,y+rise*.25+1.0,D/2-.6,1.1,1.2,.6,roofC,roofM,{axis:'z',over:.15,thick:.1});win(b,'f',dx,D/2,0,y+rise*.25+.25,.5,.55,{frame:'#ece6d6'});}
 if(r()>.6){box(b,-W/2-1,0,-.4,1.8,1.6,D*.6,'#8a6c48',M.boards);shed(b,-W/2-1,1.6,-.4,1.8,D*.6,.5,roofC,roofM);}
 if(r()>.55)awning(b,0,sh*.9,D/2,W*.6,'#b54a32','#e9dcc0');
 if(r()>.5)barrel(b,W/2+.5,D/2-.2);if(r()>.6)crate(b,W/2+.4,D/2-1.1,.55);if(r()>.6)bush(b,-W/2+.3,D/2+.4,.45);
}
function houseRenaissance(b,r,v){
 const storeys=2+(v%3)+(r()>.8?1:0),w=4.8+r()*1.8,d=6+r()*1.2,sh=2.4,fac=pick(r,PAL.facade),trim=r()>.3?'#f4efe4':shade(fac,1.15),roofC=r()>.25?pick(r,['#a2472f','#8f3f2b','#b25a3a']):pick(r,PAL.slate);
 const H=storeys*sh,gk=v%4;
 box(b,0,0,0,w,.5,d,'#9a9286',M.stone);box(b,0,.5,0,w,H-.5,d,fac,M.plaster);
 for(let s=1;s<storeys;s++)box(b,0,s*sh-.08,d/2,w+.06,.16,.1,trim);box(b,0,H-.2,0,w+.2,.25,d+.2,trim);
 for(const s of [-1,1])box(b,s*(w/2-.12),.5,d/2+.02,.25,H-.6,.08,trim);
 windowRows(b,w,d,0,sh,storeys,{spacing:1.45,ww:.7,frame:'#f4efe4',glass:'#3a4c58',shutter:r()>.6?pick(r,PAL.shutter):null,doorGap:1.0});
 doorway(b,'f',0,d/2,0,1.1,2.1,pick(r,PAL.door),trim,r()>.4);
 // front gable (street facing): stepped, bell, triangle or cornice with hip roof
 const rise=w*(.85+r()*.25);
 if(gk===3){hip(b,0,H,0,w,d,rise*.55,roofC,M.tile);}
 else{
  gable(b,0,H,0,w,d,rise,roofC,M.tile,{axis:'z',over:.15,thick:.14});
  b.with(0,d/2+.02,0,()=>{
   if(gk===0){const steps=4;for(let i=0;i<steps;i++){const ww=w*(1-i/steps),hh=rise/steps;box(b,0,H+i*hh,0,ww,hh+.05,.35,fac,M.plaster);box(b,0,H+(i+1)*hh,0,ww+.12,.12,.45,trim);}}
   else if(gk===1){for(let i=0;i<5;i++){const t=i/5,ww=w*(1-t*t*.85),hh=rise/5;box(b,0,H+i*hh,0,ww,hh+.05,.35,fac,M.plaster);}cylR(b,0,H+rise,0,w*.18,.36,fac,M.plaster,Math.PI/2,0,0,12);box(b,0,H+rise+w*.12,0,.25,.5,.3,trim);}
   else{b.poly([[-w/2,H,.2],[w/2,H,.2],[0,H+rise,.2]],fac,M.plaster);box(b,0,H,.1,w+.2,.18,.4,trim);}
   win(b,'f',0,.38,0,H+rise*.25,.6,.8,{frame:'#f4efe4'});
  });
 }
 if(r()>.5){const oy=sh*1.3;box(b,w*.2,oy,d/2,1.4,sh*.9,.6,fac,M.plaster);win(b,'f',w*.2,d/2+.6,0,oy+.4,.8,.9,{frame:'#f4efe4'});}
 if(r()>.4)chimney(b,-w*.3,-d*.3,H,rise*.7+.5,'#9a5a44',M.brick);
 if(r()>.55)awning(b,0,sh*.85,d/2,w*.7,pick(r,['#2f5e4e','#7a2f2a','#2f4c6e']),'#efe6d2');
 if(r()>.6)bush(b,w/2-.3,d/2+.5,.4,'#4a7a3a');
}
function houseIndustrial(b,r,v){
 const kind=v%5,storeys=2+(r()>.5?1:0),w=5.4+r()*1.6,d=5.4+r()*1.2,sh=2.5,H=storeys*sh;
 if(kind===4){ // clapboard house with porch
  const c=pick(r,['#e8e2d0','#c9d6dc','#d8c9a4','#b8c9b0','#e2c7b8']);box(b,0,0,0,w,.5,d,'#8d877a',M.stone);box(b,0,.5,0,w,H-.5,d,c,M.logs);
  gable(b,0,H,0,w,d,2.2,pick(r,PAL.slate),M.slate,{axis:'x',over:.35,gableC:c,gableM:M.logs});windowRows(b,w,d,0,sh,storeys,{spacing:1.6,ww:.7,frame:'#f6f3ea',shutter:pick(r,PAL.shutter)});
  box(b,0,0,d/2+.6,w*.8,.4,1.2,'#9b8f7a',M.boards);for(const s of [-1,-.33,.33,1])box(b,s*w*.38,.4,d/2+1.1,.14,2.2,.14,'#f6f3ea');shed(b,0,2.6,d/2+.6,w*.85,1.3,.35,'#5b616a',M.slate);
  doorway(b,'f',0,d/2,0,1.0,2.1,pick(r,PAL.door),'#f6f3ea');chimney(b,w*.3,0,H,2.6,'#8e4b38',M.brick);return;}
 const brick=kind===3?pick(r,PAL.stucco):pick(r,PAL.brick),bm=kind===3?M.plaster:M.brick,trim=kind===3?'#cfc6b2':'#e6dfcf';
 box(b,0,0,0,w,.6,d,'#8a847a',M.stone);box(b,0,.6,0,w,H-.6,d,brick,bm);box(b,0,H-.25,0,w+.25,.3,d+.25,trim);
 windowRows(b,w,d,0,sh,storeys,{spacing:1.5,ww:.75,frame:trim,glass:'#33454f',cross:true,doorGap:1.0});
 doorway(b,'f',w*.25,d/2,0,1.0,2.2,pick(r,PAL.door),trim,true);
 if(kind===2){ // mansard with dormers
  hip(b,0,H,0,w,d,1.4,'#6c757c',M.slate,.15);hip(b,0,H+1.4,0,w-1.6,d-1.6,.6,'#5d666d',M.metal,.05);
  for(const u of [-w*.25,w*.25]){box(b,u,H+.2,d/2-.55,.9,1.1,.6,'#e6dfcf');win(b,'f',u,d/2-.25,0,H+.45,.5,.6,{frame:'#f2ece0'});}
 }else gable(b,0,H,0,w,d,1.6+r()*.6,pick(r,PAL.slate),M.slate,{axis:'x',over:.3,gableC:brick,gableM:bm});
 if(kind===1){box(b,-w*.2,.6,d/2,1.6,sh*1.6,.7,brick,bm);for(const u of [-.5,0,.5])win(b,'f',-w*.2+u,d/2+.7,0,1.3,.38,.9,{frame:trim,cross:false});}
 for(const s of [-1,1])if(r()>.25){chimney(b,s*w*.38,0,H+.6,1.6,'#7a4636',M.brick);for(const k of [-.12,.12])cyl(b,s*w*.38+k,H+2.36,0,.1,.12,.3,'#9a5a3a',M.plain,6);}
 box(b,w*.25,0,d/2+.4,1.4,.25,.8,'#9a9286',M.stone);if(r()>.5)fenceLine(b,-w/2,d/2+1.4,0,d/2+1.4,'#2e2f31',.9);
}
const MODERN_KINDS=[0,5,1,6,2,4,5,0,6,1,3,5,2,6,4,5];
function houseModern(b,r,v){
 const kind=MODERN_KINDS[v%MODERN_KINDS.length];
 if(kind===5){ // suburban family house with pitched roof and garage
  const w=5+r()*.8,d=5+r()*.8,c=pick(r,['#e9e4d6','#cfd9dc','#e3d2a8','#d8b89a','#b9c7b4','#f0ece2','#c9b8a8']),wood=r()>.6,roofC=pick(r,['#3f4448','#5a5f63','#7a3f2f','#4f4a46']);
  box(b,0,0,0,w,.3,d,'#9a968e',M.stone);box(b,0,.3,0,w,4.9,d,c,wood?M.boards:M.plaster);gable(b,0,5.2,0,w,d,2.2,roofC,M.tile,{axis:r()>.5?'x':'z',over:.4,gableC:c,gableM:wood?M.boards:M.plaster});
  windowRows(b,w,d,.3,2.45,2,{spacing:1.7,ww:1.0,frame:'#f4f4f0',glass:'#4c6878',cross:false,doorGap:1.2});doorway(b,'f',0,d/2,-.6,1.0,2.2,pick(r,PAL.door),'#f4f4f0');
  box(b,w/2+1.1,0,.4,2.2,2.6,d*.8,shade(c,.92),M.plaster);box(b,w/2+1.1,0,.4+d*.4+.01,1.8,2.1,.06,'#d6d3cc',M.metal);box(b,w/2+1.1,2.6,.4,2.4,.2,d*.8+.2,'#9a968e');
  for(let i=0;i<4;i++)bush(b,-w/2+.4+i*1.0,d/2+.9,.4,'#3f6b34');return;}
 if(kind===6){ // brick apartment block
  const storeys=4+(r()*2|0),w=7,d=6,sh=2.8,H=storeys*sh,c=pick(r,PAL.brick);box(b,0,0,0,w,H,d,c,M.brick);
  windowRows(b,w,d,0,sh,storeys,{spacing:1.4,ww:.8,frame:'#f2efe6',glass:'#3c5664',cross:false,doorGap:1.2});
  for(let s=1;s<storeys;s++)for(const u of [-2.2,2.2]){box(b,u,s*sh-.05,d/2,1.6,.12,.9,'#cfccc4');box(b,u,s*sh+.07,d/2+.85,1.6,.8,.05,'#2f3437',M.metal);}
  box(b,0,H,0,w+.2,.5,d+.2,shade(c,.8),M.brick);doorway(b,'f',0,d/2,0,1.4,2.4,'#3c4a52','#e6e1d4');box(b,0,2.5,d/2+.5,2.4,.12,1.0,'#cfccc4');return;}
 if(kind===4){ // villa
  const c=pick(r,['#f2f2ee','#e8e6df','#d9d4c8']);box(b,0,0,0,6.4,3,4.6,c,M.plaster);box(b,-1.2,3,-.6,3.6,2.8,3.4,c,M.plaster);box(b,1.6,0,2.31,2.6,2.4,.05,'#5f7f92',M.glass);
  box(b,-1.2,3,1.11,3.0,2.2,.05,'#5f7f92',M.glass);box(b,0,3,0,6.6,.2,4.8,'#bdbab2');box(b,-1.2,5.8,-.6,3.8,.2,3.6,'#bdbab2');box(b,2.2,3,1,2.4,.12,2.6,'#8a6a48',M.boards);
  doorway(b,'f',0,2.3,-1.6,1.0,2.2,'#4b4f54','#c9c6be');box(b,4.2,0,.8,2.2,2.3,3.2,'#5c6166',M.metal);bush(b,-3.4,2.6,.5);bush(b,3.4,2.8,.45);return;}
 const storeys=kind===3?7+(r()*3|0):3+(r()*3|0),w=kind===3?5.6:6.6+r()*.8,d=kind===3?5.6:5.6+r()*.8,sh=2.8,H=storeys*sh,c=pick(r,['#d9d9d4','#e8e6df','#c9c3b8','#d8b89a','#b7c4c9','#e3d2a8','#c98f72','#a9b3a0']),panel=pick(r,PAL.panel);
 box(b,0,0,0,w,H,d,c,M.plaster);
 for(let s=0;s<storeys;s++){const y=s*sh+.9;for(const [face,len,cx,cz] of [['f',w,0,d/2],['b',w,0,-d/2],['r',d,w/2,0],['l',d,-w/2,0]]){const ry={f:0,b:Math.PI,r:Math.PI/2,l:-Math.PI/2}[face];
  b.with(cx,cz,ry,()=>{if(kind===1){box(b,0,y-.1,.03,len-.4,1.3,.06,'#4c6878',M.glass);}else{const n=Math.floor(len/1.6);for(let i=0;i<n;i++)box(b,(i-(n-1)/2)*len/n,y,.03,len/n*.62,1.2,.06,'#4f6c7c',M.glass);}
   if(kind===0&&face==='f'&&s>0){box(b,0,y-.95,.6,len*.7,.14,1.1,'#cfccc4');box(b,0,y-.81,1.12,len*.7,.75,.05,panel,M.metal);}
   if(kind===2&&s%2===0)box(b,0,y-.9,.04,len,.5,.08,panel);});}}
 box(b,0,H,0,w+.1,.4,d+.1,shade(c,.85));box(b,w*.15,H+.4,-d*.15,1.6,1.0,1.4,'#8a8f93',M.metal);
 box(b,0,0,d/2+.05,2.0,2.4,.08,'#3e5664',M.glass);box(b,0,2.5,d/2+.6,2.6,.15,1.3,'#bdbab2');
 if(r()>.4){bush(b,-w/2+.4,d/2+.6,.45);bush(b,w/2-.4,d/2+.6,.45);}
}
const HOUSE_VARIANTS={0:8,1:12,3:16,4:16,5:12,6:16};
function buildHouse(b,age,variant){
 const era=ERA(age),r=rng(variant*7919+era*104729+13);
 if(era===0)houseStone(b,r,variant);else if(era===1)houseEarly(b,r,variant,age);else if(era===3)houseMedieval(b,r,variant);
 else if(era===4)houseRenaissance(b,r,variant);else if(era===5)houseIndustrial(b,r,variant);else houseModern(b,r,variant);
}

// ------------------------------------------------------------------ era body for other buildings
// A standard building body in the era's style; returns the eave height.
function body(b,era,r,{w=6,d=5,storeys=1,roof='gable',axis:axis0='x',x=0,z=0,wallC=null,roofC=null,windows=true,door=true,chim=false,style=null}={}){
 let wall,wm,rc,rm,sh=era>=5?2.7:2.4,axis=axis0;const st=style??Math.floor(r()*4);
 if(era===0){wall=pick(r,PAL.daub);wm=st===1?M.logs:M.plaster;rc=st===3?'#7a8a4f':pick(r,PAL.thatch);rm=st===3?M.leaf:M.thatch;sh=2.4;} // V161: walls taller than a person
 else if(era===1){sh=2.5; // wattle & thatch, log & plank, gable-front thatch, dry stone & turf
  if(st===1){wall=pick(r,PAL.logs);wm=M.logs;rc=pick(r,['#6f5b45','#5f4e3c','#7a6650']);rm=M.boards;}
  else if(st===3){wall=pick(r,['#9b968a','#8e897c']);wm=M.stone;rc=pick(r,['#6d8a4a','#7a9150','#5f7d45']);rm=M.leaf;}
  else{wall=pick(r,PAL.wattle);wm=M.plaster;rc=pick(r,PAL.thatch);rm=M.thatch;if(st===2)axis=axis==='x'?'z':'x';}}
 else if(era===3){ // stone hall, half-timbered, plank-built or plastered, with varied roofs
  wall=[ '#a49c8c',pick(r,PAL.plasterM),pick(r,['#8a6a48','#7a5c3e','#6f5a44']),pick(r,PAL.plasterM)][st];wm=[M.stone,M.plaster,M.boards,M.plaster][st];
  rc=[pick(r,PAL.tileM),pick(r,PAL.slate),pick(r,['#6f5b45','#5f4e3c']),pick(r,PAL.thatch)][(st+Math.floor(r()*2))%4];rm=rc.startsWith('#4')||rc.startsWith('#5b')?M.slate:PAL.thatch.includes(rc)?M.thatch:rc.startsWith('#6')?M.boards:M.tile;}
 else if(era===4){wall=pick(r,PAL.facade);wm=M.plaster;rc=st%2?'#a2472f':pick(r,PAL.slate);rm=st%2?M.tile:M.slate;}
 else if(era===5){wall=st===3?pick(r,PAL.stucco):pick(r,PAL.brick);wm=st===3?M.plaster:M.brick;rc=st===2?'#7f878c':pick(r,PAL.slate);rm=st===2?M.metal:M.slate;}
 else{wall=pick(r,PAL.concrete);wm=M.plaster;rc='#7d8388';rm=M.metal;}
 wall=wallC||wall;rc=roofC||rc;const H=storeys*sh;
 b.with(x,z,0,()=>{
  if(era>=1)box(b,0,0,0,w+.2,.3,d+.2,'#8d877a',M.stone);
  box(b,0,era>=1?.3:0,0,w,H-(era>=1?.3:0),d,wall,wm);
  if(era===3&&st===1)timber(b,w,d,.3,H-.3,pick(r,PAL.beam));else if(era===3&&storeys>1&&st!==2)timber(b,w,d,sh,H-sh,'#3d2b1f');
  if(roof==='gable')gable(b,0,H,0,w,d,Math.min(w,d)*(era<=1?.75:era>=5?.32:.6),rc,rm,{axis,over:era<=1?.5:.35,thick:rm===M.thatch?.28:.14,gableC:wall,gableM:wm});
  else if(roof==='hip')hip(b,0,H,0,w,d,Math.min(w,d)*.45,rc,rm);
  else if(roof==='flat'){box(b,0,H,0,w+.2,.3,d+.2,shade(wall,.85));}
  else if(roof==='saw'){const n=Math.max(2,Math.round(w/2.4));for(let i=0;i<n;i++){const xx=-w/2+(i+.5)*w/n;shed(b,xx,H,0,w/n,d,1.2,rc,M.metal);box(b,xx-w/n/2+.05,H,0,.06,1.2,d,'#9fb6c2',M.glass);}}
  if(windows)windowRows(b,w,d,era>=1?.15:0,sh,storeys,{spacing:era>=5?1.5:2.2,ww:era<=1?.45:.65,frame:era<=1?'#6d5034':'#ece6d6',glass:era<=1?'#2b2a26':'#384b55',cross:era>=3,sill:era>=3,doorGap:1.3});
  if(door)doorway(b,'f',0,d/2,0,era<=1?1.1:1.3,era<=1?2.0:2.2,pick(r,PAL.door),era<=1?'#6d5034':'#d9d0bc',era===4);
  if(chim)chimney(b,w*.3,-d*.2,H,2,'#8e8578');
 });
 return H;
}

// ------------------------------------------------------------------ signature buildings
const SIG={};
SIG.hall=(b,era,r,t,root)=>{const H=body(b,era,r,{w:8.6,d:6.2,storeys:era>=3?2:1,roof:era>=4?'hip':'gable',axis:'x'});
 if(era<=1){for(const s of [-1,1])boxR(b,s*4.3,H+3.4,0,.12,1.6,.12,'#6d5034',M.beam,0,0,s*.5);banner(b,3.6,0,3.6,t,5);}
 else{const tx=era>=4?0:-3.2;box(b,tx,0,-1.2,2.4,H+4.5,2.4,era>=5?'#a35a43':'#b0a898',era>=5?M.brick:M.stone);
  if(era>=4)dome(b,tx,H+4.5,-1.2,1.3,'#6f8f86',M.metal);else{gable(b,tx,H+4.5,-1.2,2.4,2.4,1.8,'#7e3f2c',M.tile,{axis:'x',over:.2});}
  box(b,tx,H+2.6,-1.2+1.21,1.2,1.2,.06,'#efe8d6');box(b,tx,H+3.15,-1.2+1.25,.06,.45,.04,'#2b2b2b');box(b,tx+.2,H+3.2,-1.2+1.25,.4,.06,.04,'#2b2b2b');
  banner(b,tx+1.4,H+4.5,-.2,t,2.5);}
 for(let i=0;i<4;i++)box(b,0,0,3.4+i*.35,3.2-i*.4,.12,.35,'#a7a092',M.stone);};
SIG.lumber=(b,era,r)=>{body(b,era,r,{w:4.6,d:3.6,x:-1.6,z:-1.4,chim:false});logPile(b,2.6,-1,9,Math.PI/2);logPile(b,2.6,1.6,6,Math.PI/2);
 box(b,-.4,0,2.4,.7,.6,.7,'#7a5a3a',M.logs);boxR(b,-.4,.85,2.4,.08,.6,.08,'#6d5034',M.beam,0,0,.5);box(b,-.25,1.05,2.4,.3,.14,.06,'#8a8d90',M.metal);planks(b,-2.5,2.4,0,'#b48a5a');};
SIG.forester=(b,era,r)=>{body(b,era,r,{w:4.2,d:3.4,x:-1.8,z:-1.6});for(let i=0;i<3;i++)for(let j=0;j<3;j++){const x=1.2+i*1.2,z=.4+j*1.2;box(b,x,0,z,.9,.15,.9,'#5e4630',M.dirt);cone(b,x,.15,z,.25+((i+j)%3)*.08,.6+((i*2+j)%3)*.3,'#3f6b3a',M.leaf,7);}fenceLine(b,.5,3.4,4,3.4,'#8a6c48',.7);};
SIG.saw=(b,era,r,t,root)=>{const H=body(b,era,r,{w:6,d:4,x:-.8,z:-1.6,roof:'gable'});box(b,-.8,0,1.4,6.4,.25,2.2,'#7d6a52',M.boards);
 for(const s of [-1,1])box(b,s*2.6-.8,0,1.4,.2,2.2,.2,'#6d5034',M.beam);gable(b,-.8,2.2,1.4,6.4,2.2,.6,'#6f5b45',M.boards,{axis:'x',over:.2,thick:.1});
 cylR(b,-.8,.6,1.4,.25,4.8,'#7a5a3a',M.logs,0,0,Math.PI/2);box(b,.6,.3,1.4,.06,1.2,.9,'#9aa0a6',M.metal);planks(b,3.4,1.6,Math.PI/2,'#c49c68');planks(b,3.4,-1.2,Math.PI/2,'#b98f5c');};
SIG.mill=(b,era,r,t,root)=>{ // windmill (sails animated) or quern hut early
 if(era<=1){body(b,era,r,{w:4.4,d:3.6,x:-1,z:-1});cyl(b,2,0,1.6,.5,.55,.35,'#9a978d',M.stone,12);cyl(b,2,.35,1.6,.48,.48,.18,'#8c897f',M.stone,12);sack(b,2.8,.8);sack(b,2.6,2.3);return;}
 const tower=era>=5?'#a35a43':era>=4?'#e8e0cc':'#d8cdb4';cyl(b,0,0,0,1.9,2.5,6.2,tower,era>=5?M.brick:M.plaster,12);cone(b,0,6.2,0,2.2,2.2,'#6f5b45',M.boards,12);
 doorway(b,'f',0,2.3,0,.9,1.8,'#5d4127','#6d5034',true);win(b,'f',0,2.0,0,3.6,.5,.6,{frame:'#e8e2d4'});sack(b,1.6,2.6);sack(b,2.2,2.2);cart(b,-2.4,2.6,.5);
 const sails=new B();for(let i=0;i<4;i++){const a=i*Math.PI/2;sails.with(0,0,0,()=>{boxR(sails,Math.cos(a)*2.1,Math.sin(a)*2.1,0,.18,4.2,.08,'#6d5034',M.beam,0,0,a+Math.PI/2);boxR(sails,Math.cos(a)*2.4+Math.cos(a+Math.PI/2)*.45,Math.sin(a)*2.4+Math.sin(a+Math.PI/2)*.45,.02,.85,3.4,.03,'#e7dcc2',M.cloth,0,0,a+Math.PI/2);});}
 cylR(sails,0,0,-.1,.3,.6,'#5b4430',M.beam,Math.PI/2,0,0,8);return {anim:[{geo:sails,x:0,y:6.6,z:2.25,axis:'z',speed:.9,workOnly:true}]};};
SIG.bakery=(b,era,r,t,root)=>{const H=body(b,era,r,{w:5.2,d:4.2,x:-.8,z:-.8});dome(b,2.4,0,1.4,1.3,'#b4a48a',M.stone,12);box(b,2.4,0,2.6,.7,.6,.4,'#3a2c22');chimney(b,2.4,1.2,1.0,1.6,'#9a8f80');
 sign(b,-3.4,0,2.2,'#e0b33c');for(let i=0;i<3;i++)ball(b,-2.6+i*.5,.95,2.5,.18,'#c08a4a',M.plain,.6,6);box(b,-2.1,0,2.5,1.8,.85,.6,'#8d6a45',M.boards);smokeFrom(root,2.4,3.0,1.2);};
SIG.smith=(b,era,r,t,root)=>{const H=body(b,era,r,{w:4.6,d:4,x:-1.4,z:-1.2,chim:false});box(b,2.0,0,.6,3.2,.2,3.4,'#6f6458',M.stone);for(const sx of [.6,3.4])for(const sz of [-.9,2.1])box(b,sx,0,sz,.18,2.5,.18,'#5b4430',M.beam);
 shed(b,2.0,2.5,.6,3.4,3.6,.6,era>=5?'#6c757c':'#6f5b45',era>=5?M.metal:M.boards);box(b,2.8,0,-.3,1.4,1.0,1.2,'#7b7468',M.stone);box(b,2.8,1.0,-.3,1.0,.12,.8,'#c2541e');
 chimney(b,3.0,-.7,1.0,3.4,'#6e665c');anvil(b,1.6,1.4);rack(b,.3,2.6,0,'#5a5d61');barrel(b,3.7,1.8,'#5b4a3a');smokeFrom(root,3.0,4.6,-.7);};
SIG.smelter=(b,era,r,t,root)=>{body(b,era,r,{w:4.4,d:3.6,x:-2,z:-1.6,windows:false});const c=era>=5?'#7a4636':'#8d8273',m=era>=5?M.brick:M.stone;cyl(b,1.8,0,.6,1.5,1.9,4.2,c,m,12);cyl(b,1.8,4.2,.6,1.0,1.3,1.4,shade(c,.85),m,10);
 box(b,1.8,.4,2.3,.9,.9,.4,'#d0662a');stoneBlocks(b,-1.6,2.4,.2);box(b,3.6,0,2.4,1.0,.4,.8,'#5d5f62',M.metal);smokeFrom(root,1.8,5.8,.6);};
SIG.coal=(b,era,r,t,root)=>{for(const [x,z,s] of [[-1.6,-1.2,1.6],[1.6,-1.4,1.3],[0,1.6,1.4]]){dome(b,x,0,z,s,'#3f3a34',M.dirt,12);ball(b,x,s*.75,z,s*.35,'#2c2925',M.dirt,.6,8);}
 box(b,3.2,0,2.4,1.2,.5,1.2,'#24221f',M.dirt);cart(b,-3.0,2.6,.3);logPile(b,3.0,-.2,5,Math.PI/2);smokeFrom(root,-1.6,1.9,-1.2);};
SIG.barracks=(b,era,r,t)=>{const H=body(b,era,r,{w:8.6,d:4,x:0,z:-2,storeys:era>=4?2:1,roof:'gable'});box(b,0,0,1.6,8,.08,3.2,'#a69a7e',M.dirt);
 for(const x of [-3,-1]){box(b,x,0,1.2,.12,1.8,.12,'#6d5034',M.beam);boxR(b,x,1.3,1.2,.9,.12,.12,'#6d5034',M.beam,0,0,0);ball(b,x,1.85,1.2,.22,'#c9b58a',M.cloth,1.1,6);}
 rack(b,2.4,1.5,0,'#7b7f84');for(let i=0;i<4;i++)boxR(b,3.6+i*.12,.8,2.6,.04,1.8,.04,'#7a7d80',M.metal,.08*(i-2),0,0);banner(b,-4.2,0,2.8,t,4.4);};
SIG.archery=(b,era,r,t)=>{body(b,era,r,{w:4.4,d:3.4,x:-2.2,z:-2});for(const x of [-1.6,.4,2.4])target(b,x,1.9,0);box(b,1.6,0,-1.4,3.4,.06,.3,'#c8b48a',M.dirt);rack(b,2.6,-1.6,0,'#6d5034');fenceLine(b,-3.8,3.2,3.8,3.2,'#8a6c48',.6);banner(b,-4,0,1.2,t,3.6);};
SIG.stable=(b,era,r,t)=>{const H=body(b,era,r,{w:7.6,d:3.4,z:-2,roof:'gable',windows:false,door:false});for(let i=0;i<4;i++){const x=-2.85+i*1.9;box(b,x,0,-.29,1.3,1.6,.06,'#5a3f28',M.boards);box(b,x,1.0,-.27,1.3,.08,.06,'#3a2a1c');}
 fenceLine(b,-3.8,3.4,3.8,3.4);fenceLine(b,-3.8,.6,-3.8,3.4);fenceLine(b,3.8,.6,3.8,3.4);hay(b,2.6,1.6,.55);box(b,-1.6,0,1.6,1.4,.45,.5,'#6d5034',M.boards);
 for(const [x,z,c] of [[0,2.0,'#6b4a2e'],[-2.4,2.4,'#3c2d22']]){box(b,x,.75,z,1.6,.55,.55,c);box(b,x+.9,1.1,z,.5,.5,.35,c);for(const sx of [-.6,.6])for(const sz of [-.18,.18])box(b,x+sx,0,z+sz,.12,.8,.12,shade(c,.8));}};
SIG.hunter=(b,era,r)=>{body(b,era,r,{w:4.6,d:3.6,x:-1.4,z:-1.4});rack(b,2.4,.6,Math.PI/2,'#a3825c');rack(b,2.4,2.4,Math.PI/2,'#8f6b48');
 for(const s of [-1,1])boxR(b,-1.4+s*.35,3.2,.45,.06,.8,.06,'#e8dfca',M.plain,0,0,s*.6);logPile(b,-2.8,2.4,4,0);};
SIG.well=(b,era,r)=>{const c=era>=4?'#b7b0a2':'#9a968a';cyl(b,0,0,0,1.25,1.35,.9,c,M.stone,14);cyl(b,0,.9,0,1.3,1.3,.12,shade(c,.85),M.stone,14);cyl(b,0,.85,0,1.0,1.0,.04,'#2e4a50',M.glass,14);
 for(const s of [-1,1])box(b,s*1.15,.9,0,.16,1.8,.16,'#6d5034',M.beam);cylR(b,0,2.4,0,.12,2.5,'#7a5a3a',M.logs,0,0,Math.PI/2);
 if(era>=1)gable(b,0,2.7,0,2.8,1.8,.8,era>=3?'#8a4a32':'#9a8452',era>=3?M.tile:M.thatch,{axis:'x',over:.15,thick:.12});cyl(b,.2,1.4,0,.18,.15,.3,'#6e5034',M.boards,8);
 for(let i=0;i<5;i++)box(b,(i-2)*.7,0,1.9,.6,.08,.5,'#a7a092',M.stone);};
SIG.study=(b,era,r,t)=>{const H=body(b,era,r,{w:6.4,d:4.6,storeys:era>=4?2:1,roof:'gable',axis:'z'});
 if(era<=1){for(let i=0;i<4;i++)box(b,-2.4+i*.6,0,3.0,.42,.9+i*.1,.3,'#c9bfa4',M.stone);}
 else{box(b,0,H+1.4,-1.0,1.2,1.8,1.2,'#d8d0bc',M.plaster);gable(b,0,H+3.2,-1.0,1.2,1.2,1.0,'#6f5b45',M.tile,{axis:'z',over:.1});box(b,0,H+2.0,-1.0+.62,.5,.6,.04,'#c9a24a',M.metal);}
 box(b,2.4,0,2.8,1.4,.8,.6,'#7a5a3a',M.boards);box(b,2.4,.8,2.8,1.2,.06,.5,'#e8e2cf');};
SIG.scriptorium=(b,era,r,t)=>{const H=body(b,era,r,{w:6.8,d:4.4,storeys:1,roof:'gable',axis:'x'});for(let i=0;i<3;i++)box(b,-2+i*2,H*.45,2.25,.9,1.3,.1,'#c9a24a');
 box(b,3.6,0,-1,1.4,H+2.2,1.4,'#c9bfa8',M.stone);cone(b,3.6,H+2.2,-1,1.1,1.8,'#7e3f2c',M.tile,4);bush(b,-3.6,2.6,.5,'#5b8a46');bush(b,-2.8,2.9,.4,'#6b9a4e');};
SIG.library=(b,era,r,t)=>{const H=body(b,era,r,{w:7.4,d:5,storeys:2,roof:era>=4?'hip':'gable',axis:'x',wallC:era>=4?'#e9e1cc':null});
 for(let i=0;i<4;i++)cyl(b,-2.4+i*1.6,.3,2.9,.22,.26,H-.3,'#efe9da',M.plaster,10);box(b,0,H-.4,2.9,7,.5,.7,'#e5ddc8');b.poly([[-3.6,H+.1,3.2],[3.6,H+.1,3.2],[0,H+1.4,3.2]],'#e5ddc8',M.plaster);};
SIG.school=(b,era,r,t)=>{const H=body(b,era,r,{w:8,d:4.6,storeys:era>=5?2:1,roof:'gable',axis:'x'});box(b,0,H,0,1.1,1.6,1.1,'#e6dfcf');cone(b,0,H+1.6,0,.9,1.2,'#5b616a',M.slate,4);box(b,0,H+.7,.56,.4,.4,.05,'#c9a24a',M.metal);
 box(b,0,0,3.3,7,.06,2.0,'#9f8f6e',M.dirt);for(const x of [-2.6,2.6]){box(b,x,0,3.3,.1,2.4,.1,'#5b616a',M.metal);box(b,x,2.3,3.3,1.2,.08,.08,'#5b616a',M.metal);}};
SIG.public_school=SIG.school;SIG.high_school=(b,era,r,t)=>{const H=body(b,era,r,{w:8.6,d:5,storeys:3,roof:'flat'});box(b,0,0,2.6,2.6,H+.6,.6,'#d9d4c8');box(b,0,H-.6,2.9,2.2,.6,.05,'#2f5e8e',M.metal);box(b,0,0,4.2,7,.06,2.0,'#9f8f6e',M.dirt);};
SIG.academy=(b,era,r,t)=>{const H=body(b,era,r,{w:8.6,d:6,storeys:2,roof:'flat',wallC:'#ece4d2'});for(let i=0;i<6;i++)cyl(b,-3.4+i*1.36,.3,3.3,.25,.3,H-.3,'#f2ede0',M.plaster,10);
 box(b,0,H-.3,3.3,8.4,.6,.8,'#e5ddc8');b.poly([[-4.2,H+.3,3.6],[4.2,H+.3,3.6],[0,H+2,3.6]],'#e5ddc8',M.plaster);cyl(b,0,H+.3,-.6,1.8,1.8,.6,'#e5ddc8',M.plaster,14);dome(b,0,H+.9,-.6,1.8,'#6f8f86',M.metal,14);};
SIG.university=SIG.academy;
SIG.market=(b,era,r,t)=>{ // drawn at half size; the game scales markets ×2
 box(b,0,0,0,9,.08,8,'#b1a585',M.stone);const cols=[['#b54a32','#efe2c6'],['#2f6e5e','#efe2c6'],['#c9a23a','#7a3f2a'],['#3d5f8a','#ece4d2'],['#8a3f6a','#efe2c6'],['#5f7d3a','#e8dcc0']];
 let k=0;for(const x of [-2.6,0,2.6])for(const z of [-2.2,1.6]){stall(b,x,z,cols[k%6][0],cols[k%6][1],z<0?Math.PI:0);k++;}
 if(era>=3){cyl(b,0,0,0,.35,.4,2.6,'#b7b0a2',M.stone,10);ball(b,0,2.8,0,.4,'#b7b0a2',M.stone,1,8);}else{box(b,0,0,0,.9,.9,.9,'#9b7447',M.boards);}
 for(const [x,z] of [[-4,-3.4],[4,3.4],[-4,3.4],[4,-3.4]])barrel(b,x,z);sack(b,1.2,0);sack(b,-1.3,-.2);crate(b,3.9,0,.6);};
SIG.warehouse=(b,era,r,t)=>{const H=body(b,era,r,{w:8.4,d:6,roof:era>=5?'saw':'gable',axis:'x',windows:false,door:false});
 box(b,0,0,3.01,3,Math.min(H-.3,3),.08,'#6b4f33',M.boards);for(const s of [-1,1])boxR(b,s*.75,1.5,3.06,.1,Math.hypot(1.5,2.9),.04,'#4a3726',M.beam,0,0,s*.47);
 for(let i=0;i<4;i++)crate(b,-3.6+(i%2)*.7,3.6+Math.floor(i/2)*.7,.6);barrel(b,3.4,3.8);barrel(b,3.9,3.4);if(era>=3){box(b,2.8,H-1,3.0,.2,.2,1.4,'#5b4430',M.beam);cylR(b,2.8,H-1.2,3.7,.03,1.6,'#c9b58a',M.plain,0,0,0,4);}};
SIG.cellar=(b,era,r,t)=>{b.with(0,0,0,()=>{const c=era>=3?'#a49c8c':'#7f8a5a';box(b,0,0,-.5,7,1.2,6,c,era>=3?M.stone:M.leaf);hip(b,0,1.2,-.5,7,6,1.2,'#6c8a4c',M.leaf,.2);
 box(b,0,0,2.6,2.2,2.0,1.0,'#a49c8c',M.stone);cylR(b,0,1.8,3.0,1.1,.3,'#a49c8c',M.stone,Math.PI/2,0,0,12);box(b,0,0,3.12,1.3,1.9,.08,'#5d4127',M.boards);barrel(b,1.8,3.4);barrel(b,-1.8,3.4);});};
SIG.mason=(b,era,r)=>{body(b,era,r,{w:4.6,d:3.6,x:-1.8,z:-1.8});stoneBlocks(b,1.8,.4,0);stoneBlocks(b,1.6,2.4,.3);box(b,-1.2,0,2.2,1.4,.8,.8,'#b3ad9e',M.stone);
 for(const s of [-1,1])boxR(b,3.6,1.6,-1.8+s*.6,.12,3.4,.12,'#6d5034',M.beam,s*.2,0,0);box(b,3.6,3.1,-1.8,.12,.12,2.4,'#6d5034',M.beam);cylR(b,3.6,1.8,-1.8,.02,2.6,'#c9b58a',M.plain,0,0,0,4);};
SIG.pottery_kiln=(b,era,r,t,root)=>{body(b,era,r,{w:4.2,d:3.4,x:-2,z:-1.8});dome(b,1.8,0,.4,1.5,'#a55a38',M.brick,12);cyl(b,1.8,1.3,.4,.35,.4,1.1,'#8e4b38',M.brick,8);box(b,1.8,0,1.85,.8,.7,.2,'#2a1d16');
 pots(b,-1.8,2.0,'#b5683e');pots(b,.2,2.6,'#c27b4c');box(b,3.6,0,2.4,1.0,.8,.6,'#8d6a45',M.boards);smokeFrom(root,1.8,2.6,.4);};
SIG.bronze_foundry=(b,era,r,t,root)=>{body(b,era,r,{w:5.4,d:4,x:-1.4,z:-1.6,roof:'gable'});cyl(b,2.6,0,1.4,.9,1.1,1.6,'#8d8273',M.stone,10);box(b,2.6,1.6,1.4,.7,.1,.7,'#d0802a');
 chimney(b,-1.4,-1.6,2.8,3.2,'#7d756a');for(let i=0;i<3;i++)box(b,-2.6+i*.9,0,2.6,.7,.15,.4,'#b0763c',M.metal);smokeFrom(root,-1.4,6.3,-1.6);};
SIG.inn=(b,era,r,t)=>{const H=body(b,era,r,{w:8,d:5,storeys:2,roof:'gable',axis:'x',chim:true});sign(b,4.3,0,2.4,'#7a2f2a',0);for(const x of [-2.6,-.4]){cyl(b,x,0,3.6,.5,.5,.08,'#7a5a3a',M.boards,10);cyl(b,x,.0,3.6,.08,.1,.75,'#5b4430',M.beam,6);cyl(b,x,.7,3.6,.55,.55,.06,'#8b6a44',M.boards,10);}
 barrel(b,3.2,3.4);barrel(b,3.7,3.0);lanternMarker(b);};
function lanternMarker(){} // lanterns are added as glowing meshes after build (see create)
SIG.tavern=SIG.inn;
SIG.guildhall=(b,era,r,t)=>{const H=body(b,era,r,{w:7.8,d:5.6,storeys:3,roof:'gable',axis:'z',wallC:era>=4?pick(r,PAL.facade):null});b.with(0,2.82,0,()=>{for(let i=0;i<5;i++){const ww=7.8*(1-i/5);box(b,0,H+i*.9,0,ww,.95,.3,'#e8dcc0',M.plaster);}});banner(b,3.4,H,2.6,t,3);};
SIG.cartwright=(b,era,r)=>{body(b,era,r,{w:5,d:3.8,x:-1.4,z:-1.6});cart(b,2.4,1.8,.2);cylR(b,-1.6,.5,2.6,.5,.1,'#5b4430',M.beam,Math.PI/2,0,0,12);cylR(b,-.4,.5,2.8,.5,.1,'#5b4430',M.beam,Math.PI/2,.3,0,12);logPile(b,3.2,-1.4,4,Math.PI/2);};
SIG.road_depot=(b,era,r)=>{body(b,era,r,{w:6,d:4,z:-1.8,roof:'gable'});for(let i=0;i<3;i++)box(b,-2+i*2,0,2.4,1.6,.5+i*.15,1.4,'#8b8579',M.stone);cart(b,2.8,2.6,0);};
SIG.trade_yard=(b,era,r)=>{body(b,era,r,{w:6,d:4,x:0,z:-2});for(let i=0;i<6;i++)crate(b,-2.6+(i%3)*.8,1.6+Math.floor(i/3)*.8,.7);sack(b,1.4,2);sack(b,2,2.5);barrel(b,2.8,1.6);cart(b,2.8,3.2,.2);};
SIG.chapel=(b,era,r,t)=>{const H=body(b,era,r,{w:5,d:7.6,storeys:1,roof:'gable',axis:'z',wallC:'#e6dfd0',windows:false});for(const s of [-1,1])for(const z of [-2,0,2])box(b,s*2.52,.9,z,.08,1.6,.6,'#5a6f86',M.glass);
 box(b,0,0,-3.2,2.2,H+4,2.2,'#e0d8c8',M.plaster);cone(b,0,H+4,-3.2,1.5,3.4,'#5b616a',M.slate,4);box(b,0,H+7.6,-3.2,.08,.9,.08,'#c9a24a',M.metal);box(b,0,H+7.9,-3.2,.5,.08,.08,'#c9a24a',M.metal);};
SIG.monastery=SIG.chapel;
SIG.keep=null;
// goods & plantations
const plot=(crop,extra)=>(b,era,r,t)=>{body(b,era,r,{w:3.6,d:3,x:-2.6,z:-2.4,storeys:1});for(let i=0;i<2;i++)for(let j=0;j<2;j++)bed(b,.9+i*2.3,-1.2+j*2.6,2,2.2,crop,4);fenceLine(b,-.4,3.6,4.2,3.6,'#8a6c48',.7);if(extra)extra(b,era,r);};
SIG.vegetable_garden=plot('#5f8f3a',(b)=>{for(const [x,z] of [[-3.4,1.6],[-2.6,2.6]])ball(b,x,.25,z,.28,'#d07a2a',M.plain,.8,7);});
SIG.flax_farm=plot('#7d93c8',(b)=>{for(let i=0;i<3;i++)box(b,-3.4+i*.5,0,2.4,.3,1.0,.3,'#c9b58a',M.thatch);});
SIG.spice_garden=plot('#b5532f',(b)=>{pots(b,-3.4,1.8,'#c27b4c');});
SIG.dye_garden=plot('#9b4ab0',(b)=>{for(const [c,x] of [['#b0302a',-3.6],['#2c4f9a',-3.0],['#d9b02a',-2.4]])cyl(b,x,0,2.4,.28,.28,.6,c,M.cloth,10);});
SIG.coffee_farm=plot('#2f5a2c',(b)=>{for(let i=0;i<3;i++)box(b,-3.4,0,1.4+i*.8,1.2,.12,.6,'#6b3f22',M.dirt);});
SIG.cocoa_farm=plot('#5a6f2c',(b)=>{for(let i=0;i<4;i++)ball(b,-3.4+(i%2)*.6,.3,1.8+(i>>1)*.6,.22,'#a5602a',M.plain,1.3,7);});
SIG.rubber_farm=(b,era,r)=>{body(b,era,r,{w:3.6,d:3,x:-2.6,z:-2.4});for(let i=0;i<3;i++)for(let j=0;j<2;j++)tree(b,.6+i*1.5,-1.2+j*2.4,1.1,'#3f6b34');barrel(b,-3.2,2.4,'#e8e2cf');};
SIG.orchard=(b,era,r)=>{body(b,era,r,{w:3.4,d:3,x:-2.8,z:-2.4});for(let i=0;i<3;i++)for(let j=0;j<3;j++){const x=.4+i*1.6,z=-2+j*1.9;tree(b,x,z,.85,'#4f7f3a');for(let k=0;k<3;k++)ball(b,x+Math.cos(k*2.1)*.6,1.5,z+Math.sin(k*2.1)*.6,.11,'#c8402a',M.plain,1,6);}box(b,-3.2,0,2.4,.9,.6,.6,'#8d6a45',M.boards);};
SIG.silk_farm=(b,era,r)=>{const H=body(b,era,r,{w:6,d:3.4,z:-2.2,roof:'gable'});for(let i=0;i<5;i++)tree(b,-3+i*1.5,2.2,.7,'#5c8a3e');for(let i=0;i<4;i++)box(b,-1.5+i*1,.9,-.4,.7,.06,.5,'#efe9d8',M.cloth);};
SIG.dairy=(b,era,r,t)=>{body(b,era,r,{w:5.6,d:3.8,x:-1,z:-1.8,roof:'gable'});for(let i=0;i<3;i++)cyl(b,-3+i*.6,0,2.4,.22,.22,.6,'#d9d4c4',M.metal,10);for(let i=0;i<4;i++)cyl(b,2.6,i*.32,2.0,.4,.4,.3,'#e8cf7a',M.plain,12);fenceLine(b,1,3.6,4,3.6);};
SIG.gem_mine=null;
SIG.weaver=(b,era,r)=>{body(b,era,r,{w:5.4,d:4,x:-1,z:-1.6});b.with(2.6,1.6,0,()=>{for(const s of [-1,1])box(b,s*.7,0,0,.1,1.5,.9,'#6d5034',M.beam);box(b,0,1.4,0,1.5,.1,.1,'#6d5034',M.beam);box(b,0,.3,.1,1.3,1.0,.04,'#e8dcc0',M.cloth);});
 for(const [x,c] of [[-3.4,'#b0302a'],[-2.8,'#2c4f9a'],[-2.2,'#e8dcc0']])box(b,x,.7,2.4,.45,1.5,.04,c,M.cloth);box(b,-2.8,2.2,2.4,1.8,.06,.06,'#6d5034',M.beam);};
SIG.silk_weaver=SIG.weaver;
SIG.jeweler=(b,era,r,t)=>{const H=body(b,era,r,{w:5.6,d:4.6,storeys:2,roof:'gable',axis:'z'});sign(b,3,0,2.5,'#d4af37');awning(b,0,2.0,2.3,4,'#2f3d6e','#d4af37');};
SIG.perfumery=(b,era,r)=>{const H=body(b,era,r,{w:5.6,d:4.6,storeys:2,roof:'gable',axis:'z'});awning(b,0,2.0,2.3,4,'#8a3f6a','#efe2c6');for(let i=0;i<5;i++)ball(b,-3.2+i*.35,.25,2.9,.12,['#c78ab0','#8fb0c9','#d9c46a','#a7c98f','#c99a6a'][i],M.glass,1.3,6);bed(b,3.4,2.6,1.4,1.4,'#a07ab8',3);};
SIG.chocolatier=(b,era,r)=>{const H=body(b,era,r,{w:5.6,d:4.6,storeys:2,roof:'gable',axis:'z'});awning(b,0,2.0,2.3,4,'#5a3424','#e8d2b0');sign(b,3,0,2.5,'#5a3424');};
SIG.electronics_factory=(b,era,r,t)=>{const H=body(b,6,r,{w:9,d:6.4,roof:'saw',windows:true,door:true,wallC:'#dfe2e2'});box(b,-3,0,3.4,2.4,2.4,.6,'#c9ced0');box(b,3.4,H,1.4,1.4,.8,1.4,'#8a8f93',M.metal);for(let i=0;i<3;i++)box(b,-4+i*.9,0,4,.7,.7,.7,'#e8e6df');box(b,0,H-.9,3.22,3,.6,.04,TEAM[0],M.metal);};
SIG.steelworks=(b,era,r,t,root)=>{body(b,5,r,{w:8,d:5.6,roof:'saw',windows:true});for(const x of [-2.4,0,2.4]){cyl(b,x,0,-3.6,.5,.65,9,'#7a4636',M.brick,10);cyl(b,x,9,-3.6,.6,.6,.3,'#3a3a3a',M.metal,10);}smokeFrom(root,0,9.6,-3.6);};
SIG.engineworks=SIG.steelworks;
SIG.printer=(b,era,r)=>{const H=body(b,era,r,{w:7,d:5,storeys:2,roof:'gable',axis:'x'});sign(b,3.8,0,2.6,'#2b2b2b');for(let i=0;i<4;i++)box(b,-3+i*.5,0,3.2,.4,.3+i*.05,.3,'#efe9d8',M.cloth);};
SIG.polytechnic=SIG.academy;SIG.laboratory=SIG.high_school;SIG.observatory=(b,era,r)=>{const H=body(b,era,r,{w:6,d:5,storeys:2,roof:'flat'});cyl(b,0,H,0,1.6,1.6,1.0,'#e6dfcf',M.plaster,14);dome(b,0,H+1,0,1.6,'#c9ced0',M.metal,14);box(b,0,H+1.6,.9,.5,.9,1.2,'#2b2b2b');};
SIG.railstation=(b,era,r,t)=>{const H=body(b,5,r,{w:9.6,d:5,storeys:1,roof:'gable',axis:'x'});box(b,0,0,3.4,10.4,.4,2,'#9a9286',M.stone);for(let i=0;i<5;i++)box(b,-4+i*2,.4,3.9,.12,2.6,.12,'#3a3d40',M.metal);shed(b,0,3.0,3.4,10.4,2.2,-.4,'#5b616a',M.metal);
 box(b,0,H,0,1.4,2.4,1.4,'#a35a43',M.brick);box(b,0,H+1.4,.71,.9,.9,.04,'#efe8d6');};
SIG.powdermill=SIG.smelter;SIG.siegeworkshop=(b,era,r)=>{body(b,era,r,{w:6.4,d:4.4,z:-2,roof:'gable',windows:false});boxR(b,1.4,.6,2.2,3.4,.3,.5,'#7a5a3a',M.beam,0,0,.2);boxR(b,0,1.6,2.2,.25,2.8,.25,'#6d5034',M.beam,0,0,-.6);cylR(b,-1.2,.5,2.6,.5,.1,'#5b4430',M.beam,Math.PI/2,0,0,10);cylR(b,1.8,.5,2.6,.5,.1,'#5b4430',M.beam,Math.PI/2,0,0,10);logPile(b,-3,2.8,5,0);};
SIG.armorer=SIG.smith;SIG.armor_workshop=SIG.smith;SIG.crossbow_range=SIG.archery;
SIG.windmill=SIG.mill;

// ------------------------------------------------------------------ public API
const CACHE=new Map();
const HOUSE_TYPES=new Set(['house']);
export function townModelSupported(type){return HOUSE_TYPES.has(type)||!!SIG[type];}
export function houseVariantCount(age){return HOUSE_VARIANTS[ERA(age)]||8;}
export function createTownModelV154(type,team=0,age=0,seed=0){
 if(!townModelSupported(type))return null;
 age=Math.max(0,Math.min(6,age|0));const era=ERA(age);
 const variant=HOUSE_TYPES.has(type)?((seed>>>0)%houseVariantCount(age)):0;
 const key=type+'|'+age+'|'+variant+'|'+(HOUSE_TYPES.has(type)?0:team);
 let entry=CACHE.get(key);
 if(!entry){
  const b=new B(),tmp=new T.Group();let extra=null;
  if(HOUSE_TYPES.has(type))buildHouse(b,age,variant);
  else extra=SIG[type](b,era,rng(type.length*977+age*31+team*7+1),TEAM[team]||TEAM[0],tmp)||null;
  entry={geo:b.geometry(),anim:(extra?.anim||[]).map(a=>({...a,geo:a.geo.geometry()})),smoke:tmp.userData.smoke?.position.clone()||null,lantern:type==='inn'||type==='tavern'};
  CACHE.set(key,entry);
 }
 const root=new T.Group(),m=new T.Mesh(entry.geo,TOWN_MATERIAL);m.castShadow=true;m.receiveShadow=true;root.add(m);
 root.userData.animations=[];
 for(const a of entry.anim){const pivot=new T.Group();pivot.position.set(a.x,a.y,a.z);const part=new T.Mesh(a.geo,TOWN_MATERIAL);part.castShadow=true;pivot.add(part);pivot.userData.workOnly=!!a.workOnly;root.add(pivot);root.userData.animations.push({node:pivot,axis:a.axis,speed:a.speed});}
 if(entry.smoke)smokeFrom(root,entry.smoke.x,entry.smoke.y,entry.smoke.z);
 if(entry.lantern)lantern(root,4.3,2.6,2.6);
 root.userData.buildingType=type;root.userData.age=age;root.userData.townModelV154=key;
 return root;
}
// stable per-building seed from its position
export function buildingSeed(b){const x=Math.round((b?.x||0)*10),z=Math.round((b?.z||0)*10);let h=(x*73856093)^(z*19349663)^((b?.id||0)*83492791);h=Math.imul(h^(h>>>13),0x5bd1e995);return (h^(h>>>15))>>>0;}
export const TOWN_TYPES_V154=()=>['house',...Object.keys(SIG).filter(k=>SIG[k])];

// ---------------------------------------------------------------- V158 farm and field
const FARM_CACHE=new Map();
const hash=(a,b,c)=>{const v=Math.sin(a*127.1+b*311.7+c*74.7)*43758.5453;return v-Math.floor(v);};
export function farmhouseGeometry(age=0){
 const key='farm|'+Math.max(0,Math.min(6,age|0));if(FARM_CACHE.has(key))return FARM_CACHE.get(key);
 const b=new B(),era=ERA(age),r=rng(9001+era);
 // farmhouse
 if(era===0){cyl(b,-1.2,0,-.6,1.7,1.8,1.3,'#8d7352',M.plaster,12);cone(b,-1.2,1.3,-.6,2.2,2.4,'#a58a52',M.thatch,12);}
 else body(b,era,r,{w:4.6,d:3.6,x:-1.2,z:-.9,roof:'gable',axis:'x',style:era===1?0:1});
 // barn
 const barnC=era>=5?'#8e3f32':era>=3?'#7a5a3a':'#8a6c48';
 box(b,2.4,0,-1.6,2.6,2.2,3.0,barnC,M.boards);gable(b,2.4,2.2,-1.6,2.6,3.0,1.6,era>=3?'#5b4a3a':'#a08452',era>=3?M.boards:M.thatch,{axis:'z',over:.3,gableC:barnC,gableM:M.boards});
 box(b,2.4,0,-.08,1.3,1.6,.08,'#4e3a28',M.boards);
 // yard: hay, fence, cart, water trough
 hay(b,3.2,1.6,.7);hay(b,2.2,2.3,.55);
 fenceLine(b,-3.6,3.3,3.6,3.3,'#8a6c48',.8);fenceLine(b,-3.6,1.4,-3.6,3.3,'#8a6c48',.8);
 box(b,-1.6,0,2.4,1.4,.4,.5,'#7a5a3a',M.boards);box(b,-1.6,.32,2.4,1.2,.06,.35,'#4c6d70',M.glass);
 if(era>=2)cart(b,.6,2.2,.3);
 const g=b.geometry();FARM_CACHE.set(key,g);return g;
}
export function fieldGeometry(){
 if(FARM_CACHE.has('field'))return FARM_CACHE.get('field');
 const b=new B();
 box(b,0,0,0,16,.12,16,'#6b4e30',M.dirt);
 for(let i=0;i<14;i++){const z=-6.9+i*1.06;box(b,0,.12,z,15.2,.16,.5,'#7a5a38',M.dirt);
  for(let k=0;k<6;k++){const x=-6.4+k*2.56,h=.45+hash(i,k,3)*.25;box(b,x,.2,z,2.4,h,.42,hash(i,k,7)>.15?'#b9a24e':'#9aa84e',M.thatch);}}
 for(const [x0,z0,x1,z1] of [[-8,-8,8,-8],[-8,8,8,8],[-8,-8,-8,8],[8,-8,8,8]])fenceLine(b,x0,z0,x1,z1,'#8a6c48',.6);
 const g=b.geometry();FARM_CACHE.set('field',g);return g;
}
export function meshV158(geo){const m=new T.Mesh(geo,TOWN_MATERIAL);m.castShadow=true;m.receiveShadow=true;return m;}
