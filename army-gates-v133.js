// A narrow gate admits one formation at a time. Followers keep their orders
// and wait outside; an opposing formation near the mouth yields into a bay.
const queues=new WeakMap();
export function gateTraffic(orders,nav){
 const waiting=new Set(),yields=new Map();if(!nav?.buildings)return {waiting,yields};
 let state=queues.get(nav);if(!state){state={claims:new Map(),routes:new WeakMap()};queues.set(nav,state);}const {claims,routes}=state;
 for(const gate of nav.buildings().filter(b=>b.type==='gatehouse'&&b.hp>0)){
  const axis=gate.wallAxis?'x':'z',cross=axis==='x'?'z':'x',key=gate.x+':'+gate.z+':'+axis,coordinate=p=>p[axis]-gate[axis];
  let claim=claims.get(key);
  if(claim&&(!orders.some(o=>o.agent===claim.agent)||coordinate(claim.agent)*claim.side>claim.radius*2+3)){claims.delete(key);claim=null;}
  const crossing=orders.filter(o=>{
   if(coordinate(o.agent)*coordinate(o.goal)>=0||Math.abs(o.agent[cross]-gate[cross])>=70||Math.abs(o.goal[cross]-gate[cross])>=70)return false;
   const stamp=o.goal.x+':'+o.goal.z+':'+nav.version;let memo=routes.get(o.agent);
   if(!memo||memo.stamp!==stamp){memo={stamp,path:nav.route(o.agent,o.goal)||[]};routes.set(o.agent,memo);}
   return memo.path.some(p=>Math.hypot(p.x-gate.x,p.z-gate.z)<4);
  });
  if(!claim&&crossing.length){const owner=crossing.slice().sort((a,b)=>Math.hypot(a.agent.x-gate.x,a.agent.z-gate.z)-Math.hypot(b.agent.x-gate.x,b.agent.z-gate.z))[0];claim={agent:owner.agent,side:Math.sign(coordinate(owner.goal)),radius:owner.radius};claims.set(key,claim);}
  if(!claim)continue;
  for(const order of crossing){
   const {agent,radius}=order;if(agent===claim.agent)continue;waiting.add(agent);
   if(Math.abs(coordinate(agent))>radius*3+8)continue;
   const side=Math.sign(coordinate(agent))||-claim.side;
   for(const offset of [radius*3+3,-radius*3-3,radius*5+3,-radius*5-3]){
    const p={...gate,[axis]:gate[axis]+side*(radius*3+8),[cross]:gate[cross]+offset};
    if(nav.open(p.x,p.z)&&nav.reachable(agent,p)){yields.set(agent,p);break;}
   }
  }
 }
 return {waiting,yields};
}
