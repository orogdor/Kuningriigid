// Clip only the two ends of a wall stroke. An inlet or mountain between
// two stretches of land must reject the stroke, never become a land bridge.
const mix=(a,b,t)=>({x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t});
export function shoreWallCurveV1758(curve,passable){
 if(curve.length<2)return {curve};
 const samples=[curve[0]];
 for(let i=1;i<curve.length;i++){
  const a=curve[i-1],b=curve[i],n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/.2));
  for(let j=1;j<=n;j++)samples.push(mix(a,b,j/n));
 }
 const dry=samples.map(p=>passable(p.x,p.z));
 const first=dry.indexOf(true),last=dry.lastIndexOf(true);
 if(first<0)return {error:'Müür vajab kuiva maad.',curve:[]};
 if(dry.slice(first,last+1).some(v=>!v))return {error:'Müür ei saa ületada merd ega läbimatut mäge. Lõpeta müür maastiku serval.',curve:[]};
 // Resolve the shoreline to centimetres. The existing 0.52m timber joint
 // overlap then seals the walking grid against the terrain boundary.
 const boundary=(a,b)=>{
  let land=a,blocked=b;
  for(let i=0;i<8;i++){const p=mix(land,blocked,.5);if(passable(p.x,p.z))land=p;else blocked=p;}
  return land;
 };
 const out=samples.slice(first,last+1);
 if(first>0)out.unshift(boundary(samples[first],samples[first-1]));
 if(last+1<samples.length)out.push(boundary(samples[last],samples[last+1]));
 return {curve:out,terrainEndsV1758:{start:first>0,end:last+1<samples.length}};
}
export function wallTerrainErrorV1758(wall,passable,height){
 const span=wall.palisadeSpanV167||7,half=span/2;
 if(!Number.isFinite(span)||span<2.4||span>8||!Number.isFinite(wall.wallAngleV175))return 'Müürijupi pikkus või pöördenurk ei sobi.';
 if(!passable(wall.x,wall.z))return 'Müüri keskkoht peab olema kuival, läbitaval maal.';
 const c=Math.cos(wall.wallAngleV175),s=Math.sin(wall.wallAngleV175);
 const depth=wall.type==='palisade'&&wall.woodFortTierV1757===2?2.35:1.1;
 const levels=[],n=Math.ceil(span/.2);
 for(let i=0;i<=n;i++){
  const along=(i/n-.5)*span,endDistance=half-Math.abs(along);
  for(const across of [-depth,0,depth]){
   const x=wall.x+c*along+s*across,z=wall.z-s*along+c*across;
   if(!passable(x,z)){
    // Permit only the end cap to meet sea/rock; the body stays on land.
    if(endDistance>(across===0?.8:depth+.8))return 'Müür läbiks vett või läbimatut mäge.';
   }else if(height)levels.push(height(x,z));
  }
 }
 if(levels.length&&Math.max(...levels)-Math.min(...levels)>1.8)return 'Maapind on müüri jaoks liiga järsk.';
 return '';
}
// Short final sections still need to join their neighbours. The generic
// six-metre building spacing would reject a paid 4-5m shoreline section.
export function wallEndJoinV1758(a,b){
 const gates=['woodgate','gatehouse'];
 if(gates.includes(a.type)&&b.drawnWallV175)return wallEndJoinV1758(b,a);
 if(!a.drawnWallV175||(!b.drawnWallV175&&!gates.includes(b.type)))return false;
 const angle=b.wallAngleV175??(b.wallAxis?Math.PI/2:0),dx=a.x-b.x,dz=a.z-b.z;
 if(Math.abs(dx*Math.cos(angle)-dz*Math.sin(angle))<(b.palisadeSpanV167||7)/2-.8&&Math.abs(dx*Math.sin(angle)+dz*Math.cos(angle))<.4)return false;
 const ends=w=>{const angle=w.wallAngleV175??(w.wallAxis?Math.PI/2:0),half=(w.palisadeSpanV167||7)/2;
  return [-1,1].map(sign=>({x:w.x+sign*Math.cos(angle)*half,z:w.z-sign*Math.sin(angle)*half}));};
 return ends(a).some(p=>ends(b).some(q=>Math.hypot(p.x-q.x,p.z-q.z)<=.8));
}
