// V175.2: touch/mouse wall-stroke geometry. No game globals, no save writes.
// The builder owns resources, technology, terrain and pathfinding checks.
export const WALL_DRAW_V175=Object.freeze({spacing:7,maxSegments:10,minLength:3,maxPointGap:1.8});
const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const lerp=(a,b,t)=>({x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t});
export const isDrawableWallV175=type=>['palisade','stonewall','reinforced_wall'].includes(type);
export function cleanWallStrokeV175(points=[]){
 const filtered=[];
 for(const p of points){if(!p||!Number.isFinite(p.x)||!Number.isFinite(p.z))continue;
  const q={x:+p.x,z:+p.z};if(!filtered.length||dist(q,filtered.at(-1))>=.7)filtered.push(q);}
 return filtered;
}
export function smoothedWallStrokeV175(points=[],shape='straight'){
 const clean=cleanWallStrokeV175(points);
 if(clean.length<2)return clean;
 if(shape!=='curved')return [clean[0],clean.at(-1)];
 // Two Chaikin passes give the path a continuous-looking hand-drawn bend,
 // keeping its exact endpoints and avoiding erratic low-resolution corners.
 let path=clean;
 for(let pass=0;pass<2;pass++){
  const next=[path[0]];
  for(let i=1;i<path.length;i++){
   const a=path[i-1],b=path[i];
   next.push(lerp(a,b,.25),lerp(a,b,.75));
  }
  next.push(path.at(-1));path=next;
 }
 return path;
}
export function wallStrokePlanV175(points,shape='straight',maxSegments=WALL_DRAW_V175.maxSegments){
 const curve=smoothedWallStrokeV175(points,shape);
 if(curve.length<2)return {error:'Lohista müürile vähemalt kaks punkti.',segments:[],curve};
 let length=0;for(let i=1;i<curve.length;i++)length+=dist(curve[i-1],curve[i]);
 if(length<WALL_DRAW_V175.minLength)return {error:'Müür peab olema vähemalt 3 meetrit pikk.',segments:[],curve};
 const count=Math.max(1,Math.ceil(length/WALL_DRAW_V175.spacing));
 if(count>maxSegments)return {error:'Liiga pikk müür: maksimaalselt '+maxSegments+' lõiku korraga.',segments:[],curve,length,count};
 const sampled=[curve[0]],interval=length/count;
 let target=interval,travelled=0;
 for(let i=1;i<curve.length;i++){
  const a=curve[i-1],b=curve[i],l=dist(a,b);
  if(l<1e-7)continue;
  while(target<travelled+l-1e-7){
   sampled.push(lerp(a,b,(target-travelled)/l));target+=interval;
  }
  travelled+=l;
 }
 sampled.push(curve.at(-1));
 const segments=[];
 for(let i=1;i<sampled.length;i++){
  const a=sampled[i-1],b=sampled[i],span=dist(a,b);
  if(span<.1)continue;
  const angle=-Math.atan2(b.z-a.z,b.x-a.x);
  segments.push({x:(a.x+b.x)/2,z:(a.z+b.z)/2,
   wallAngleV175:angle,palisadeSpanV167:span,
   wallAxis:Math.abs(b.z-a.z)>Math.abs(b.x-a.x)?1:0,
   drawnWallV175:true,
   from:{x:a.x,z:a.z},to:{x:b.x,z:b.z}});
 }
 if(!segments.length)return {error:'Müüril puuduvad lõigud.',segments:[],curve};
 return {shape,curve,sampled,segments,length,count:segments.length};
}
export function wallPointInsideV175(point,wall,pad=0){
 const angle=wall.wallAngleV175??(wall.wallAxis?Math.PI/2:0);
 const span=wall.palisadeSpanV167||7;
 const dx=point.x-wall.x,dz=point.z-wall.z,c=Math.cos(angle),s=Math.sin(angle);
 const along=dx*c-dz*s,across=dx*s+dz*c;
 return Math.abs(along)<=span/2+pad&&Math.abs(across)<=1.1+pad;
}
export function wallFootprintV175(wall,pad=0){
 const angle=wall.wallAngleV175??(wall.wallAxis?Math.PI/2:0);
 const half=(wall.palisadeSpanV167||7)/2+pad,thin=1.1+pad;
 return {rx:Math.abs(Math.cos(angle))*half+Math.abs(Math.sin(angle))*thin,
         rz:Math.abs(Math.sin(angle))*half+Math.abs(Math.cos(angle))*thin};
}
