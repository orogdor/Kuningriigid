// A move command names an area, not one disc-sized parking spot shared by
// every formation. Reservations are transient; original orders stay saveable.
const reservations=new WeakMap();
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export const arrivalGoal=agent=>reservations.get(agent)?.point??null;
export function assignArrivalGoals(orders,occupants,nav=null){
 const result=new Map(),reserved=[],ordered=new Set(orders.map(o=>o.agent));
 const open=nav?((x,z)=>nav.open(x,z)):()=>true;
 nav?.refresh?.();
 // Keep established reservations first, then admit the nearest approaching
 // formation. The first arrival must not repeatedly steal another's place.
 const list=orders.slice().sort((a,b)=>Number(!!reservations.get(b.agent))-Number(!!reservations.get(a.agent))||distance(a.agent,a.goal)-distance(b.agent,b.goal));
 for(const order of list){
  const {agent,goal,radius,team}=order,key=goal.x+':'+goal.z+':'+team;
  const gates=nav?.buildings?.().filter(b=>b.type==='gatehouse'&&b.hp>0)||[];
  const valid=p=>open(p.x,p.z)&&gates.every(g=>{const axis=g.wallAxis?'x':'z',cross=axis==='x'?'z':'x';return Math.abs(p[axis]-g[axis])>radius*3+3||Math.abs(p[cross]-g[cross])>radius+3;})&&reserved.every(q=>distance(p,q.point)>=radius+q.radius+.5)&&occupants.every(q=>q.agent===agent||(ordered.has(q.agent)&&q.team===team)||distance(p,q.agent)>=radius+q.radius+.5);
  const memo=reservations.get(agent);
  let point=memo?.key===key&&valid(memo.point)?memo.point:null;
  if(!point){
   const spacing=Math.max(2,radius*2+.75),angle=Math.atan2(agent.z-goal.z,agent.x-goal.x);
   for(let ring=0;ring<=10&&!point;ring++){
    const n=ring?Math.max(8,Math.ceil(2*Math.PI*ring)):1;
    for(let i=0;i<n;i++){
     const a=angle+i*2*Math.PI/n,raw={x:goal.x+Math.cos(a)*spacing*ring,z:goal.z+Math.sin(a)*spacing*ring};
     const candidate=nav?.nearest?nav.nearest(raw,1):raw;
     if(!candidate||distance(candidate,raw)>1.5||!valid(candidate))continue;
     if(nav?.reachable&&!nav.reachable(agent,candidate))continue;
     // Do not park a formation over a roof/wall or block a narrow doorway.
     if(ring&&[0,Math.PI/2,Math.PI,Math.PI*1.5].some(a=>!open(candidate.x+Math.cos(a)*radius,candidate.z+Math.sin(a)*radius)))continue;
     point={x:candidate.x,z:candidate.z};break;
    }
   }
  }
  if(point){reservations.set(agent,{key,point});reserved.push({point,radius});result.set(agent,point);}
  else reservations.delete(agent);
 }
 return result;
}
