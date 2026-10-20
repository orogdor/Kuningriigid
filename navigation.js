// Shared small-agent navigation for citizens, carriers and soldiers.
const length=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
// Horizontal exclusion zones contain the actual roof, steps, carts and
// exterior props, not only the small collision boxes used by old V78 agents.
// Width/depth are HALF extents; enough clearance remains for paved ribbons.
const FOOTPRINTS=Object.freeze({
 steelworks:[5.4,5.3],engineworks:[5.4,5.3],polytechnic:[5.4,5.3],
 railstation:[5.6,6.0],printer:[5.5,5.3],powdermill:[5.5,5.3],
 inn:[6,5], trade_yard:[5,6], siegeworkshop:[5,6], smelter:[5,6], smith:[5,6], coal:[5,6], mine:[5,6], watermill:[6,5], hall:[5.6,5.0],house:[4,3.6],warehouse:[5.6,5],cellar:[5,4.4],
 market:[5.5,5.1],study:[5,5],lumber:[4.8,5],quarry:[4.6,5],
 hunter:[4.6,5],fisher:[4.9,4.6],farm:[4.8,5],well:[3.2,3.2],
 barracks:[5,5],harbor:[5.3,8.3],saw:[5,5],mill:[4.8,5],
 bakery:[5,5],archery:[5,5],forester:[4.8,5],claypit:[4.7,4.4],
 pottery_kiln:[4.7,4.6],pasture:[4.8,4.8],mason:[4.8,5],
 cartwright:[5,6],coppermine:[5,6],tinmine:[5,6],
 bronze_foundry:[5.3,6],road_depot:[5.2,5],scriptorium:[5,5],
 keep:[5.7,5.3],gatehouse:[5.4,5.1],guildhall:[5.3,5.0],
 chapel:[5.3,5.1],monastery:[5.4,5.1],watchtower:[4.7,4.6],
 stonetower:[5.2,5.0],stonewall:[4.8,4.5],palisade:[4.8,4.5]
});
export function buildingClearance(b){
 if(!b||b.type==='bridge')return null;
 // Fortification walls are thin *oriented segments*, not wide buildings.
 // The fortification controller supplies these half-extents according to
 // wallAxis. Preserve them exactly so a 90-degree rotated wall keeps free
 // lateral ground open for soldiers and pedestrians.
 if(['palisade','stonewall','reinforced_wall'].includes(b.type)){
  const vertical=!!b.wallAxis;
  return {rx:b.navWidth??(vertical?1.1:3.6),
          rz:b.navDepth??(vertical?3.6:1.1)};
 }
 // Include a full walking-grid cell's road-ribbon margin for tall Renaissance façades.
 const v=FOOTPRINTS[b.type]||[5.0,5.0];
 return {rx:Math.max(v[0],b.navWidth||0),rz:Math.max(v[1],b.navDepth||0)};
}
export const door=b=>{
 const size=buildingClearance(b);
 return {x:b.x,z:b.z+(size?.rz||2.5)+1.15};
};
export function clearFootprint(world,b){let changed=false;for(const r of world.resources)if(['tree','berry'].includes(r.kind)&&!r.removed&&Math.abs(r.x-b.x)<Math.max(3.6,b.navWidth||0)+.5&&Math.abs(r.z-b.z)<Math.max(3.5,b.navDepth||0)+.5){r.removed=true;r.cleared=true;r.amount=0;changed=true}if(changed)world.revision=(world.revision||0)+1;return changed}
export class Navigation{
constructor(world,passable,buildings=()=>[]){this.world=world;world.heat??={};world.heatLast??={};world.trailTime??=0;world.revision??=0;this.passable=passable;this.buildings=buildings;this.minX=-72;this.minZ=-62;this.w=145;this.h=125;this.n=this.w*this.h;this.base=new Uint8Array(this.n);for(let z=0;z<this.h;z++)for(let x=0;x<this.w;x++)this.base[z*this.w+x]=passable(x+this.minX,z+this.minZ)?1:0;this.cache=new WeakMap();this.version=0;this.signature='';this.rebuild()}
index(x,z){const xx=Math.round(x)-this.minX,zz=Math.round(z)-this.minZ;return xx>=0&&xx<this.w&&zz>=0&&zz<this.h?zz*this.w+xx:-1}
point(i){return {x:i%this.w+this.minX,z:Math.floor(i/this.w)+this.minZ}}
rebuild(){this.mask=this.base.slice();const paint=(x,z,rx,rz,circle)=>{for(let zz=Math.floor(z-rz);zz<=Math.ceil(z+rz);zz++)for(let xx=Math.floor(x-rx);xx<=Math.ceil(x+rx);xx++){if(circle?Math.hypot(xx-x,zz-z)>rx:(Math.abs(xx-x)>rx||Math.abs(zz-z)>rz))continue;const i=this.index(xx,zz);if(i>=0)this.mask[i]=0}};for(const b of this.buildings()){const size=buildingClearance(b);if(size)paint(b.x,b.z,size.rx,size.rz,false)}for(const r of this.world.resources)if(!['game','fish','berry'].includes(r.kind)&&!r.removed&&r.amount>0)paint(r.x,r.z,r.kind==='tree'?1.4:3,r.kind==='tree'?1.4:3,true);// When a settlement grows or moves buildings over earlier footpaths,
 // remove buried wear rather than reviving the road through a new house.
 // Old V4 saves with roads inside construction footprints repair on load.
 let buried=0;
 for(const key of Object.keys(this.world.heat||{})){
  const i=Number(key);
  if(!Number.isInteger(i)||i<0||i>=this.n||this.mask[i]!==1){
   delete this.world.heat[key];delete this.world.heatLast[key];buried++;
  }
 }
 if(buried)this.world.trailChanges=(this.world.trailChanges||0)+buried;
 this.version++;this.signature=this.currentSignature()}
currentSignature(){
 // Buildings of equal count can be moved/destroyed; stale nav masks previously
 // caused footsteps to be drawn through a different building at the same index.
 return (this.world.revision||0)+':'+this.buildings().map(b=>
  b.type+':'+Math.round(b.x*10)+':'+Math.round(b.z*10)+':'+(b.navWidth||0)+':'+(b.navDepth||0)
 ).join('|');
}
refresh(){if(this.signature!==this.currentSignature())this.rebuild()}
open(x,z){const i=this.index(x,z);return i>=0&&this.mask[i]===1}
nearest(p,max=9){if(this.open(p.x,p.z))return this.point(this.index(p.x,p.z));for(let r=1;r<=max;r++){const points=[];for(let dz=-r;dz<=r;dz++)for(let dx=-r;dx<=r;dx++)if(Math.max(Math.abs(dx),Math.abs(dz))===r&&this.open(p.x+dx,p.z+dz))points.push(this.point(this.index(p.x+dx,p.z+dz)));if(points.length)return points.sort((a,b)=>length(a,p)-length(b,p))[0]}return null}
clear(a,b){const n=Math.max(1,Math.ceil(length(a,b)*4));for(let i=0;i<=n;i++)if(!this.open(a.x+(b.x-a.x)*i/n,a.z+(b.z-a.z)*i/n))return false;return true}
// A single local walk creates wear, not a visible road. Repeated visits build permanent paths.
roadStrength(i){const h=this.world.heat[i]||0;if(!h)return 0;const now=this.world.trailTime||0,last=this.world.heatLast[i];if(last==null){this.world.heatLast[i]=now;return h}const elapsed=Math.max(0,now-last),rate=h>=64?.0012:h>=30?.0028:h>=13?.006:h>=4?.009:.013;return Math.max(0,h-rate*elapsed)}
roadLevel(i){const h=this.roadStrength(i);return h>=64?4:h>=30?3:h>=13?2:h>=4?1:0}
roadBoost(i){return this.roadLevel(i)>=1?1.5:1}
weight(i){return 1/this.roadBoost(i)}
// Deposit footsteps along the whole travelled segment, not just the final
// coordinate. At 3m/s with coarse ticks the old code skipped road cells,
 // producing dotted or broken-looking paths.
 recordTraffic(from,to,weight=1){
  const lengthWalked=length(from,to);
  if(lengthWalked<=0)return;
  const samples=Math.max(1,Math.ceil(lengthWalked/.25));
  const contribution=lengthWalked/samples*Math.max(0,weight);
  for(let j=0;j<samples;j++){
   const f=(j+.5)/samples,k=this.index(from.x+(to.x-from.x)*f,from.z+(to.z-from.z)*f);
   if(k<0||this.mask[k]!==1)continue;
   const h=this.roadStrength(k);
   this.world.heat[k]=Math.min(125,h+contribution);
   this.world.heatLast[k]=this.world.trailTime||0;
  }
  this.world.trailChanges=(this.world.trailChanges||0)+lengthWalked*Math.max(0,weight);
 }
 pruneTrails(){let changed=false;for(const k of Object.keys(this.world.heat)){const h=this.roadStrength(Number(k));if(h<.2){delete this.world.heat[k];delete this.world.heatLast[k];changed=true}}if(changed)this.world.trailChanges=(this.world.trailChanges||0)+1}

// Reachability queries do not need a weighted A* route. Cache connected
// regions until the obstacle mask changes; diagonal moves cannot bridge
// separate four-connected regions because corner cutting is forbidden.
reachable(from,to){
 this.refresh();const a=this.nearest(from),b=this.nearest(to);if(!a||!b)return false;
 if(this.componentVersion!==this.version){
  const labels=new Int32Array(this.n),queue=new Int32Array(this.n);let id=0;
  for(let start=0;start<this.n;start++){
   if(!this.mask[start]||labels[start])continue;id++;let head=0,tail=0;queue[tail++]=start;labels[start]=id;
   while(head<tail){const k=queue[head++],x=k%this.w,z=Math.floor(k/this.w);
    for(const j of [x>0?k-1:-1,x+1<this.w?k+1:-1,z>0?k-this.w:-1,z+1<this.h?k+this.w:-1]){
     if(j>=0&&this.mask[j]&&!labels[j]){labels[j]=id;queue[tail++]=j;}
    }
   }
  }
  this.components=labels;this.componentVersion=this.version;
 }
 return this.components[this.index(a.x,a.z)]===this.components[this.index(b.x,b.z)];
}
route(from,to,{preferRoads=true}={}){this.refresh();const a=this.nearest(from),b=this.nearest(to);if(!a||!b)return null;const start=this.index(a.x,a.z),goal=this.index(b.x,b.z);if(start===goal)return [b];const costs=new Float32Array(this.n);costs.fill(Infinity);const prev=new Int32Array(this.n);prev.fill(-1);const closed=new Uint8Array(this.n),heap=[];const push=(id,cost)=>{heap.push([id,cost]);for(let i=heap.length-1;i>0;){let p=(i-1)>>1;if(heap[p][1]<=heap[i][1])break;[heap[p],heap[i]]=[heap[i],heap[p]];i=p}};const pop=()=>{const result=heap[0],last=heap.pop();if(heap.length){heap[0]=last;for(let i=0;;){let l=i*2+1,r=l+1,j=i;if(l<heap.length&&heap[l][1]<heap[j][1])j=l;if(r<heap.length&&heap[r][1]<heap[j][1])j=r;if(j===i)break;[heap[i],heap[j]]=[heap[j],heap[i]];i=j}}return result[0]};costs[start]=0;push(start,0);while(heap.length){const k=pop();if(closed[k])continue;if(k===goal){let out=[],v=k;while(v!==start){out.push(this.point(v));v=prev[v]}out.push(a);return out.reverse()}closed[k]=1;const x=k%this.w,z=Math.floor(k/this.w);for(const[dx,dz]of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){let xx=x+dx,zz=z+dz;if(xx<0||xx>=this.w||zz<0||zz>=this.h)continue;const j=zz*this.w+xx;if(!this.mask[j]||closed[j]||(dx&&dz&&(!this.mask[z*this.w+xx]||!this.mask[zz*this.w+x])))continue;const score=costs[k]+Math.hypot(dx,dz)*(preferRoads?this.weight(j):1);if(score<costs[j]){costs[j]=score;prev[j]=k;push(j,score+.45*Math.hypot(xx-(goal%this.w),zz-Math.floor(goal/this.w)))}}}return null}
move(agent,target,dt,speed=3){this.refresh();agent.moving=false;if(!target||dt<=0)return false;if(!this.open(agent.x,agent.z)){const p=this.nearest(agent);if(!p)return false;agent.x=p.x;agent.z=p.z;this.cache.delete(agent)}const goal=this.nearest(target);if(!goal)return false;let memo=this.cache.get(agent),key=goal.x+':'+goal.z;if(!memo||memo.key!==key||memo.version!==this.version){const path=length(agent,goal)<3&&this.clear(agent,goal)?[goal]:this.route(agent,goal);memo={key,path:path||[],version:this.version,failedTime:0};this.cache.set(agent,memo)}if(!memo.path.length&&length(agent,goal)>.18){memo.failedTime=(memo.failedTime||0)+dt;if(memo.failedTime>4){this.cache.delete(agent);agent.pathFailure=(agent.pathFailure||0)+1}return false}let remaining=dt;while(memo.path.length&&remaining>0&&speed>0){const p=memo.path[0],d=length(agent,p);if(d<.015){memo.path.shift();continue}const k0=this.index(agent.x,agent.z),boost=k0>=0?this.roadBoost(k0):1,step=Math.min(d,speed*remaining*boost),next={x:agent.x+(p.x-agent.x)/d*step,z:agent.z+(p.z-agent.z)/d*step};if(!this.clear(agent,next)){this.cache.delete(agent);break}this.recordTraffic(agent,next);agent.heading=Math.atan2(p.x-agent.x,p.z-agent.z);agent.x=next.x;agent.z=next.z;remaining-=step/(speed*boost);agent.moving=true;if(step>=d-.001)memo.path.shift()}return length(agent,goal)<.18}
}
export function cityWorld(seed,passable,buildings){const resources=[],noise=(a,b)=>{const n=Math.sin(a*127.1+b*311.7+seed*.017)*43758.5453;return n-Math.floor(n)};const add=(kind,x,z,amount)=>{if(!passable(x,z)||buildings.some(b=>Math.abs(b.x-x)<4&&Math.abs(b.z-z)<4))return;resources.push({id:resources.length,kind,x,z,amount,removed:false})};for(let i=0;i<420;i++){const x=noise(i,3)*140-70,z=noise(i,9)*120-60;if(noise(i,17)>.3)add('tree',x,z,24)}
// Matching starting deposits and groves for both capitals.
for(const h of buildings.filter(b=>b.type==='hall')){for(let i=0;i<18;i++){const a=i*Math.PI*2/18;add('tree',h.x+Math.cos(a)*19,h.z+Math.sin(a)*19,32)}for(const [dx,dz]of [[-15,-18],[15,18],[-21,9]])add('stone',h.x+dx,h.z+dz,420);for(const [dx,dz]of [[-18,15],[18,-15]])add('ore',h.x+dx,h.z+dz,360)}return {resources,heat:{},revision:0}}
export function gather(s,b,d,dt,nav,gatherMultiplier=1){const world=nav.world,kind=b.resourceKind||(b.type==='lumber'?'tree':b.type==='quarry'?'stone':b.type==='hunter'?'game':b.type==='fisher'?'fish':'ore'),id=b.workerKey??s.buildings.indexOf(b);world.workers??={};let w=world.workers[id];if(!w){const p=nav.nearest(door(b));if(!p)return 0;w=world.workers[id]={x:p.x,z:p.z,phase:'seek',team:b.team,kind:b.type,building:id,work:0};}w.moving=false;w.working=false;const home=door(b);if(w.phase==='return'){b.status='Toob saaki';if(nav.move(w,home,dt,3)){w.phase='seek';const amount=w.carried||0;w.carried=0;return amount}return 0}
let target=world.resources[w.resourceId];if(w.phase==='seek'||!target||target.removed){w.retry=Math.max(0,(w.retry||0)-dt);if(w.retry>0)return 0;const claimed=new Set(Object.values(world.workers).filter(v=>v!==w&&v.phase!=='return').map(v=>v.resourceId));const candidates=world.resources.filter(r=>r.kind===kind&&!r.removed&&r.amount>0&&!claimed.has(r.id)&&!(r.matureAt>s.time)&&length(r,b)<55).sort((a,c)=>length(a,w)-length(c,w));target=null;for(const r of candidates.slice(0,14)){const p=nav.nearest({x:r.x+1.8,z:r.z},4);if(p&&nav.route(w,p)){target=r;w.resourceId=r.id;w.goal=p;w.phase='out';w.work=0;break}}if(!target){b.status='Lähedal pole ligipääsetavat toorainet';w.retry=4;return 0}}
if(w.phase==='out'){b.status=kind==='tree'?'Läheb metsa':kind==='game'?'Läheb jahile':kind==='fish'?'Läheb kalale':'Läheb maardlasse';if(nav.move(w,w.goal,dt,3)){w.phase='work';w.stuck=0}else if(!w.moving){w.stuck=(w.stuck||0)+dt;if(w.stuck>8){w.phase='seek';w.stuck=0}}return 0}if(w.phase==='work'){w.action={tree:'chop',stone:'mine',ore:'mine',berry:'gather',game:'hunt',fish:'fishing'}[kind];b.status=kind==='berry'?'Korjab marju':kind==='tree'?'Raiub puud':kind==='game'?'Jahib ulukeid':kind==='fish'?'Püüab kala':'Kaevandab';w.working=true;w.heading=Math.atan2(target.x-w.x,target.z-w.z);w.work+=dt*gatherMultiplier;if(w.work>=d.cycle){target.capacity??=target.amount;w.carried=Math.min(d.rate,target.amount);if(kind==='tree'){forestLedger(s,world);world.forestCredits[b.team]=(world.forestCredits[b.team]||0)+w.carried;world.forestryStats.cut[b.team]=(world.forestryStats.cut[b.team]||0)+w.carried}target.amount-=w.carried;if(target.amount<=0){target.removed=true;if(['game','fish','berry'].includes(kind))target.respawnAt=s.time+90;else if(kind==='tree'&&!target.cleared)target.respawnAt=s.time+720;world.revision++;}w.phase='return';w.work=0;}return 0}return 0}
function forestLedger(s,world){if(!world.forestCredits){world.forestCredits={0:0,1:0};for(const r of world.resources.filter(r=>r.kind==='tree'&&r.removed&&!r.cleared)){if(s.buildings.some(b=>Math.abs(r.x-b.x)<4.5&&Math.abs(r.z-b.z)<4.5))continue;const hall=s.buildings.filter(b=>b.type==='hall').sort((a,b)=>length(a,r)-length(b,r))[0];if(hall)world.forestCredits[hall.team]+=r.capacity||24}}world.forestryStats??={cut:{0:0,1:0},planted:{0:0,1:0}}}
export function plantTrees(s,b,d,dt,nav){const world=nav.world;forestLedger(s,world);world.workers??={};const id=s.buildings.indexOf(b),quota=d.rate;let w=world.workers[id];if(!w){const p=nav.nearest(door(b));if(!p)return;w=world.workers[id]={x:p.x,z:p.z,phase:'plantSeek',team:b.team,kind:'forester',building:id,work:0}}w.moving=false;w.working=false;
const valid=(site,people=false)=>nav.passable(site.x,site.z)&&!s.buildings.some(h=>h.team===b.team&&Math.abs(site.x-h.x)<4.5&&Math.abs(site.z-h.z)<4.5)&&!world.resources.some(r=>!r.removed&&r.amount>0&&length(r,site)<3)&&(nav.roadStrength(nav.index(site.x,site.z))<3)&&(!people||![...s.cargo,...Object.values(world.workers).filter(a=>a!==w),...s.units].some(a=>a.team===b.team&&length(a,site)<1.5));
const cancel=()=>{world.forestCredits[b.team]=(world.forestCredits[b.team]||0)+w.reserved||0;w.reserved=0;w.site=null;w.phase='plantSeek';w.retry=3};
if(w.phase==='plantReturn'){b.status='Naaseb istutamast';if(nav.move(w,door(b),dt,3))w.phase='plantSeek';return}
if(w.site&&!valid(w.site)){cancel();return}
if(w.phase==='plantSeek'){b.status=world.forestCredits[b.team]>=quota?'Otsib istutuskohta':'Ootab raiutud metsa';w.retry=Math.max(0,(w.retry||0)-dt);if(w.retry||world.forestCredits[b.team]<quota)return;const sites=world.resources.filter(r=>r.kind==='tree'&&r.removed&&!r.cleared&&length(r,b)<55).map(r=>({x:r.x,z:r.z,id:r.id}));for(let r=8;r<=28;r+=4)for(let k=0;k<12;k++)sites.push({x:Math.round(b.x+Math.cos(k*Math.PI/6)*r),z:Math.round(b.z+Math.sin(k*Math.PI/6)*r)});sites.sort((a,c)=>length(a,w)-length(c,w));for(const site of sites){if(!valid(site,true)||Object.values(world.workers).some(a=>a!==w&&a.site&&length(a.site,site)<3))continue;const p=nav.nearest({x:site.x+2.3,z:site.z},3);if(p&&nav.route(w,p)){w.site=site;w.goal=p;w.phase='plantOut';w.reserved=quota;world.forestCredits[b.team]-=quota;w.work=0;break}}if(!w.site)w.retry=4;return}
if(w.phase==='plantOut'){b.status='Viib istikut metsa';if(nav.move(w,w.goal,dt,3)){w.phase='plantWork';w.stuck=0}else if(!w.moving){w.stuck=(w.stuck||0)+dt;if(w.stuck>8)cancel()}return}
if(w.phase==='plantWork'){w.action='plant';b.status='Istutab puud';w.working=true;w.heading=Math.atan2(w.site.x-w.x,w.site.z-w.z);w.work+=dt;if(w.work<d.cycle||!valid(w.site,true))return;let resource=w.site.id!=null?world.resources[w.site.id]:null;if(!resource){resource={id:world.resources.length,kind:'tree',x:w.site.x,z:w.site.z};world.resources.push(resource)}Object.assign(resource,{amount:quota,capacity:quota,removed:false,cleared:false,plantedAt:s.time,matureAt:s.time+20,plantedBy:b.team});world.forestryStats.planted[b.team]=(world.forestryStats.planted[b.team]||0)+quota;world.revision++;w.reserved=0;w.site=null;w.phase='plantReturn';w.work=0;}}
