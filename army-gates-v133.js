// Formations approach the next gate immediately, then wait in separate bays
// clear of its marching lane. Only passage through the gate is serialized.
const queues=new WeakMap();
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const segmentDistance=(p,a,b)=>{const dx=b.x-a.x,dz=b.z-a.z,n=dx*dx+dz*dz,t=n?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.z-a.z)*dz)/n)):0;return Math.hypot(p.x-a.x-dx*t,p.z-a.z-dz*t);};
export function gateTraffic(orders,nav,occupants=[]){
 const waiting=new Set(),approaches=new Map();if(!nav?.buildings)return {waiting,approaches,hasGates:false};
 let state=queues.get(nav);if(!state){state={claims:new Map(),routes:new WeakMap(),bays:new WeakMap()};queues.set(nav,state);}const {claims,routes,bays}=state;
 const gates=nav.buildings().filter(b=>['gatehouse','woodgate'].includes(b.type)&&b.hp>0),groups=new Map(),moving=new Set(orders.map(o=>o.agent));
 for(const order of orders){
  const {agent,goal}=order,stamp=goal.x+':'+goal.z+':'+nav.version;let memo=routes.get(agent);
  if(!memo||memo.stamp!==stamp){memo={stamp,path:nav.route(agent,goal)||[]};routes.set(agent,memo);}
  // Reserve only the next gate on the remaining route, never a later gate
  // that could stop this formation before it reaches the first one.
  let at=0;for(let i=1;i<memo.path.length;i++)if(distance(agent,memo.path[i])<distance(agent,memo.path[at]))at=i;
  let next=null,index=Infinity;
  for(const gate of gates){
   const axis=gate.wallAxis?'x':'z';if((agent[axis]-gate[axis])*(goal[axis]-gate[axis])>=0)continue;
   const hit=memo.path.findIndex((p,i)=>i>=Math.max(0,at-2)&&distance(p,gate)<4);
   if(hit>=0&&hit<index){next=gate;index=hit;}
  }
  if(next){const group=groups.get(next)||[];group.push(order);groups.set(next,group);}
 }
 for(const gate of gates){
  const axis=gate.wallAxis?'x':'z',cross=axis==='x'?'z':'x',key=gate.x+':'+gate.z+':'+axis,coordinate=p=>p[axis]-gate[axis],crossing=groups.get(gate)||[];
  let claim=claims.get(key);
  if(claim&&(!moving.has(claim.agent)||coordinate(claim.agent)*claim.side>claim.radius*2+3)){claims.delete(key);claim=null;}
  if(!claim&&crossing.length){const owner=crossing.slice().sort((a,b)=>distance(a.agent,gate)-distance(b.agent,gate))[0];claim={agent:owner.agent,side:Math.sign(coordinate(owner.goal)),radius:owner.radius};claims.set(key,claim);}
  if(!claim)continue;
  const reserved=[],ownerPath=[claim.agent,...(routes.get(claim.agent)?.path||[])];
  for(const order of crossing.slice().sort((a,b)=>distance(a.agent,gate)-distance(b.agent,gate))){
   const {agent,radius}=order;if(agent===claim.agent)continue;waiting.add(agent);
   const side=Math.sign(coordinate(agent))||-claim.side,preferred=Math.sign(agent[cross]-gate[cross])||1;
   const valid=p=>nav.open(p.x,p.z)&&[0,Math.PI/2,Math.PI,Math.PI*1.5].every(a=>nav.open(p.x+Math.cos(a)*radius,p.z+Math.sin(a)*radius))&&reserved.every(q=>distance(p,q.point)>=radius+q.radius+.75)&&occupants.every(q=>q.agent===agent||moving.has(q.agent)||distance(p,q.agent)>=radius+q.radius+.75)&&ownerPath.every((q,i)=>!i||segmentDistance(p,ownerPath[i-1],q)>=radius+claim.radius+1);
   let point=bays.get(agent)?.key===key&&bays.get(agent).side===side&&valid(bays.get(agent).point)?bays.get(agent).point:null;
   for(let ring=0;ring<8&&!point;ring++)for(let row=0;row<=ring&&!point;row++)for(const sign of [preferred,-preferred]){
    const column=ring-row,raw={x:gate.x,z:gate.z};raw[axis]+=side*(radius+4+row*(radius*2+1));raw[cross]+=sign*(radius+claim.radius+3+column*(radius*2+1));
    const p=nav.nearest?nav.nearest(raw,1):raw;
    if(p&&distance(p,raw)<1.5&&valid(p)&&nav.reachable(agent,p)){point={x:p.x,z:p.z};break;}
   }
   if(point){bays.set(agent,{key,side,point});reserved.push({point,radius});approaches.set(agent,point);}
  }
 }
 return {waiting,approaches,hasGates:gates.length>0};
}
