// Short-lived military detours. Ordinary terrain pathfinding still runs; these
// waypoints only steer around occupied space. Nothing is saved in game state.
const routes=new WeakMap();
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export function forgetCrowdRoute(agent){routes.delete(agent);}
// Check every crossed navigation cell, including a tiny clipped corner.
// Distance sampling can miss that corner and repeatedly steer into a post.
export function militaryLineClear(a,b,open,cellSize=1){
 if(!open(a.x,a.z)||!open(b.x,b.z))return false;
 const cuts=[0,1];
 for(const axis of ['x','z']){
  const delta=b[axis]-a[axis];if(!delta)continue;
  const low=Math.min(a[axis],b[axis]),high=Math.max(a[axis],b[axis]);
  for(let n=Math.floor(low/cellSize+.5)+.5;n*cellSize<high;n++)cuts.push((n*cellSize-a[axis])/delta);
 }
 cuts.sort((a,b)=>a-b);
 for(let i=1;i<cuts.length;i++){const t=(cuts[i-1]+cuts[i])/2;if(!open(a.x+(b.x-a.x)*t,a.z+(b.z-a.z)*t))return false;}
 return true;
}
export function crowdWaypoint(agent,goal,others,open,radiusOf,dt=.05,cellSize=1){
 const own=radiusOf(agent),peers=others.filter(p=>p!==agent),clear=(a,b)=>{
  const dx=b.x-a.x,dz=b.z-a.z,len2=dx*dx+dz*dz;
  for(const p of peers){const r=own+radiusOf(p)+.04,px=a.x-p.x,pz=a.z-p.z,dot=px*dx+pz*dz;
   if(px*px+pz*pz<r*r){if(dot<-.00001)return false;continue;}
   const t=len2?Math.max(0,Math.min(1,-dot/len2)):0;
   if((px+dx*t)**2+(pz+dz*t)**2<r*r)return false;
  }
  return militaryLineClear(a,b,open,cellSize);
 };
 let memo=routes.get(agent);
 if(memo&&distance(memo.goal,goal)>2){routes.delete(agent);memo=null;}
 if(memo){
  memo.age+=dt;
  while(memo.path.length&&distance(agent,memo.path[0])<.2)memo.path.shift();
  if(memo.path.length&&memo.age<2){return memo.path[0];}
  if(!memo.path.length&&memo.age<.4)return goal;
 }
 if(clear(agent,goal)){routes.delete(agent);return goal;}
 // An occupied destination cannot be reached by any detour. Let contact/yield
 // handling wait for it to clear instead of searching a doomed graph.
 if(peers.some(p=>distance(p,goal)<own+radiusOf(p)+.04)){routes.set(agent,{goal:{...goal},path:[],age:0});return goal;}
 // Bound local planning work. Larger terrain detours belong to Navigation.
 const obstacles=peers.filter(p=>distance(agent,p)<Math.min(65,distance(agent,goal)+own+radiusOf(p)+4))
  .sort((a,b)=>distance(agent,a)-distance(agent,b)).slice(0,12);
 const nodes=[agent,goal],sides=12;
 for(const p of obstacles){const r=(own+radiusOf(p)+.3)/Math.cos(Math.PI/sides);
  for(let i=0;i<sides;i++){const angle=i*2*Math.PI/sides,q={x:p.x+Math.cos(angle)*r,z:p.z+Math.sin(angle)*r};if(open(q.x,q.z)&&peers.every(v=>distance(q,v)>=own+radiusOf(v)+.05))nodes.push(q);}
 }
 const costs=new Float64Array(nodes.length).fill(Infinity),prev=new Int32Array(nodes.length).fill(-1),closed=new Uint8Array(nodes.length);costs[0]=0;
 for(let k=0;k<nodes.length;k++){
  let at=-1;for(let i=0;i<nodes.length;i++)if(!closed[i]&&(at<0||costs[i]<costs[at]))at=i;
  if(at<0||!Number.isFinite(costs[at])||at===1)break;closed[at]=1;
  for(let i=1;i<nodes.length;i++)if(!closed[i]){const left=(goal.x-agent.x)*(nodes[i].z-agent.z)-(goal.z-agent.z)*(nodes[i].x-agent.x)>0;const cost=costs[at]+distance(nodes[at],nodes[i])*(left?1.001:1);if(cost<costs[i]&&clear(nodes[at],nodes[i])){costs[i]=cost;prev[i]=at;}}
 }
 const path=[];if(prev[1]>=0)for(let at=1;at>0;at=prev[at])path.unshift({...nodes[at]});
 routes.set(agent,{goal:{...goal},path,age:0});return path[0]||goal;
}
