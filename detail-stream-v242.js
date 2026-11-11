// Visual streaming only. Simulation coordinates and save data never move.
import * as T from './vendor/three.module.js';
import {DETAIL_TILE_X,DETAIL_TILE_Z,DETAIL_HALF_X,DETAIL_HALF_Z} from './detail-scale-v123.js';
import {beginSliceV342} from './frame-slice-v342.js';
// V341: stages that put something on screen for a non-central tile. Horizon,
// rivers, outcrops, roads and borders live in `decor`, which only the active
// centre tile shows; navigation is needed only when a tile becomes the centre.
const VISIBLE_STAGES=new Set(['terrain','local world','resources','forest fill','ground cover','sea','buildings']); // V346b: forest fill is part of the visible tile
export class DetailStreamV242{
 constructor({scene,cell,build,dispose,clock=()=>performance.now(),budget=3}){
  Object.assign(this,{cell,build,dispose,clock,budget});
  // Desktop: display one extra tile ring at the same mesh resolution as the centre.
  this.radius=typeof matchMedia==='function'&&matchMedia('(min-width:900px) and (pointer:fine)').matches?2:1;
  // V341: the full-detail window follows the camera. Desktop may use the
  // same 25-tile budget one ring further in the viewing direction instead
  // of spending it on tiles behind the camera. Phones keep their 3x3 cost.
  this.reach=this.radius>1?this.radius+1:this.radius;
  this.maxTiles=(this.radius*2+1)**2;
  this.entries=new Map();
  this.root=new T.Group();this.root.name='V242 persistent detail tiles';scene.add(this.root);
  this.center=null;this.enabled=false;this.view=null;this.desired=new Set();this.desiredMask='';
  this.stats={created:0,reused:0,evicted:0,maxJobMs:0,crossings:0};
  this._frustum=new T.Frustum();this._matrix=new T.Matrix4();this._box=new T.Box3();
 }
 key(tile){return tile.c+':'+tile.r;}
 ensure(tile){
  if(!tile)return null;const key=this.key(tile);let entry=this.entries.get(key);
  if(entry)return entry;
  const root=new T.Group(),scenery=new T.Group(),actors=new T.Group(),sites=new T.Group(),decor=new T.Group();root.add(scenery,actors,sites,decor);
  root.name='V242 tile '+key;root.visible=false;
  entry={tile,key,root,scenery,actors,sites,decor,resources:new Map(),buildings:new Map(),workers:new Map(),units:new Map(),ready:false,visualReady:false};
  this.entries.set(key,entry);this.root.add(root);entry.jobs=this.build(entry);this.stats.created++;return entry;
 }
 step(entry,background=false){
  if(!entry||entry.ready)return;const start=this.clock();
  beginSliceV342();
  const next=entry.jobs.next();entry.ready=!!next.done;
  // V342: everything a non-central tile shows exists once its builder moves
  // past the visible stages (or finishes).
  if(!entry.visualReady&&(entry.ready||(entry.stage&&!VISIBLE_STAGES.has(entry.stage)))){
   entry.visualReady=true;
   this.updateVisibility(entry);
  }
  const ms=this.clock()-start;
  this.stats.maxJobMs=Math.max(this.stats.maxJobMs,ms);
  if(background&&ms>(this.stats.maxBackgroundJobMs||0)){this.stats.maxBackgroundJobMs=ms;this.stats.slowestStage=entry.stage;}
 }
 finish(tile){const entry=this.ensure(tile);while(!entry.ready)this.step(entry);return entry;}
 // V341: camera in the detail scene's coordinates (centre tile at 0,0) and
 // the ground point it looks at. Called once per frame before tick().
 setView(camera,x=0,z=0){
  if(!camera){this.view=null;return;}
  camera.updateMatrixWorld?.();
  this._matrix.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);
  this._frustum.setFromProjectionMatrix(this._matrix);
  this.view={x,z,frustum:this._frustum};
  if(this.enabled&&this.center){this.choose();if(this.dirty)this.position();}
 }
 offset(entry){return {dc:entry.tile.c-this.center.c,dr:entry.tile.r-this.center.r};}
 neighbours(tile){
  const cells=[];
  for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){
   const cell=this.cell(tile.c+dc,tile.r+dr);
   if(cell)cells.push(cell);
  }
  return cells;
 }
 canCross(tile){
  if(!tile||!this.entries.get(this.key(tile))?.ready)return false;
  return this.neighbours(tile).every(cell=>this.entries.get(this.key(cell))?.visualReady);
 }
 updateVisibility(entry){
  if(!this.center)return;
  const target=this.entries.get(this.targetKey)?.tile;
  const {dc,dr}=this.offset(entry);
  const ahead=target&&Math.abs(target.c-entry.tile.c)<=1&&Math.abs(target.r-entry.tile.r)<=1&&this.inView(dc,dr);
  entry.root.visible=this.enabled&&entry.visualReady&&(this.desired.has(entry.key)||!!ahead);
 }
 inView(dc,dr){
  if(!this.view)return true;
  const x=dc*DETAIL_TILE_X,z=dr*DETAIL_TILE_Z;
  this._box.min.set(x-DETAIL_HALF_X,-60,z-DETAIL_HALF_Z);this._box.max.set(x+DETAIL_HALF_X,220,z+DETAIL_HALF_Z);
  return this.view.frustum.intersectsBox(this._box);
 }
 // Ground distance from the camera's look point to a tile rectangle.
 viewDistance(dc,dr){
  const vx=this.view?this.view.x:0,vz=this.view?this.view.z:0;
  const x=Math.max(0,Math.abs(vx-dc*DETAIL_TILE_X)-DETAIL_HALF_X),z=Math.max(0,Math.abs(vz-dr*DETAIL_TILE_Z)-DETAIL_HALF_Z);
  return Math.hypot(x,z);
 }
 // Selects which tiles get full detail: the 3x3 neighbourhood (needed for
 // seamless crossing), then the tiles the camera sees, nearest first.
 choose(){
  const wanted=[],extra=[];
  for(let dr=-this.reach;dr<=this.reach;dr++)for(let dc=-this.reach;dc<=this.reach;dc++){
   const tile=this.cell(this.center.c+dc,this.center.r+dr);if(!tile)continue;
   const ring=Math.max(Math.abs(dc),Math.abs(dr));
   if(ring<=1){wanted.push(this.key(tile));continue;}
   const seen=this.inView(dc,dr);
   if(!seen&&ring>this.radius)continue;
   // Out-of-view tiles of the classic ring only fill a spare budget. Current
   // members and already loaded tiles are preferred, so moving the camera does
   // not swap a finished tile for an empty one a little further away.
   const entry=this.entries.get(this.key(tile)),loaded=entry&&entry.visualReady;
   const keep=(this.desired.has(this.key(tile))?DETAIL_TILE_X*.35:0)+(loaded?DETAIL_TILE_X*.75:0);
   extra.push({key:this.key(tile),score:this.viewDistance(dc,dr)+(seen?0:1e6)-keep});
  }
  extra.sort((a,b)=>a.score-b.score||(a.key<b.key?-1:1));
  for(const item of extra){if(wanted.length>=this.maxTiles)break;wanted.push(item.key);}
  const mask=wanted.slice().sort().join('|');
  this.dirty=mask!==this.desiredMask;
  if(this.dirty){
   this.desiredMask=mask;this.desired=new Set(wanted);
   for(const key of wanted){const [c,r]=key.split(':').map(Number);this.ensure(this.cell(c,r));}
  }
  return this.desired;
 }
 activate(tile){
  this.stats.reused+=[...this.entries.values()].filter(e=>e.ready&&e.root.visible&&Math.max(Math.abs(e.tile.c-tile.c),Math.abs(e.tile.r-tile.r))<=this.radius).length;
  if(this.center&&this.key(this.center)!==this.key(tile))this.stats.crossings++;
  // The caller rebases the camera by whole tiles; move the last frustum with it.
  if(this.center&&this.view){
   const shift=new T.Vector3(-(tile.c-this.center.c)*DETAIL_TILE_X,0,-(tile.r-this.center.r)*DETAIL_TILE_Z);
   for(const plane of this.view.frustum.planes)plane.translate(shift);
   this.view.x+=shift.x;this.view.z+=shift.z;
  }
  this.center=tile;this.enabled=true;this.root.visible=true;this.desiredMask='';
  this.choose();
  this.position();return this.entries.get(this.key(tile));
 }
 position(){
  if(!this.center)return;
  for(const entry of [...this.entries.values()]){
   const {dc,dr}=this.offset(entry),ring=Math.max(Math.abs(dc),Math.abs(dr));
   entry.root.position.set(dc*DETAIL_TILE_X,0,dr*DETAIL_TILE_Z);
   this.updateVisibility(entry);
   entry.decor.visible=dc===0&&dr===0;
   if(ring>this.reach+1||(ring>this.radius+1&&!this.desired.has(entry.key)&&entry.key!==this.targetKey))this.remove(entry);
  }
  this.dirty=false;
 }
 prefetch(x,z,dx=0,dz=0){
  if(!this.enabled||!this.center)return;
  let dc=0,dr=0;
  if(dx||dz){
   // Prioritise the edge the input reaches first, even when moving along
   // another edge. A diagonal lookahead can miss part of that tile's ring.
   const toX=dx?(DETAIL_HALF_X-Math.sign(dx)*x)/Math.abs(dx):Infinity;
   const toZ=dz?(DETAIL_HALF_Z-Math.sign(dz)*z)/Math.abs(dz):Infinity;
   if(toX<=toZ)dc=Math.sign(dx);
   else dr=Math.sign(dz);
  }else{
   dc=Math.abs(x)>DETAIL_TILE_X*.18?Math.sign(x):0;
   dr=Math.abs(z)>DETAIL_TILE_Z*.18?Math.sign(z):0;
  }
  if(!dc&&!dr)return;
  const target=this.cell(this.center.c+dc,this.center.r+dr);if(!target)return;
  const key=this.key(target);
  this.ensure(target);
  if(key===this.targetKey)return;
  this.targetKey=key;
  // Only the next centre's own neighbourhood is required for the crossing;
  // its wider ring is chosen from the camera view once it becomes active.
  for(const cell of this.neighbours(target))this.ensure(cell);
  this.position();
 }
 limitMovement(x,z,dx,dz,canEnter){
  this.prefetch(x,z,dx,dz);
  const c=this.center.c,r=this.center.r;
  const ready=(dc,dr)=>{
   const tile=this.cell(c+dc,r+dr);
   return tile&&canEnter(tile)&&this.canCross(tile);
  };
  const limit=(value,delta,half,available)=>{
   if(!delta)return value;
   const direction=Math.sign(delta),edge=half-.25,approach=direction*value;
   if(available)return direction*Math.min(half*1.12,approach+Math.abs(delta));
   const scale=Math.max(.14,Math.min(1,(edge-approach)/(half*.45)));
   return direction*Math.min(edge,approach+Math.abs(delta)*scale);
  };
  let nx=limit(x,dx,DETAIL_HALF_X,dx&&ready(Math.sign(dx),0));
  let nz=limit(z,dz,DETAIL_HALF_Z,dz&&ready(0,Math.sign(dz)));
  if(Math.abs(nx)>DETAIL_HALF_X&&Math.abs(nz)>DETAIL_HALF_Z&&!ready(Math.sign(nx),Math.sign(nz))){
   if(Math.abs(dx)/DETAIL_HALF_X>=Math.abs(dz)/DETAIL_HALF_Z)nz=Math.sign(nz)*(DETAIL_HALF_Z-.25);
   else nx=Math.sign(nx)*(DETAIL_HALF_X-.25);
  }
  return {x:nx,z:nz};
 }
 // Lower tier is loaded first.
 tier(entry,target){
  const {dc,dr}=this.offset(entry);
  if(entry.key===this.key(this.center)||entry.key===this.targetKey)return 0; // blocks crossing
  const visibleStage=!entry.stage||VISIBLE_STAGES.has(entry.stage);
  const desired=this.desired.has(entry.key);
  const ring=Math.max(Math.abs(dc),Math.abs(dr));
  const ahead=target&&Math.max(Math.abs(entry.tile.c-target.c),Math.abs(entry.tile.r-target.r))<=1;
  if(visibleStage&&ahead)return 1; // complete the destination's visible ring before crossing
  if(visibleStage&&desired&&this.inView(dc,dr))return 2;
  if(visibleStage&&desired&&ring<=1)return 2;            // neighbour behind the camera
  const near=ring<=1||ahead;
  if(near)return 3; // possible next centre: its centre-only layers
  // V342: centre-only layers (horizon, rivers, navigation, roads, borders) of
  // tiles that cannot become the centre next are not built at all for now.
  // The builder resumes when the tile moves next to the centre or target.
  if(!visibleStage)return null;
  return desired?4:5; // spare budget outside the view, then the rest
 }
 tick(budget=this.budget){
  if(!this.enabled||!this.center)return;
  const start=this.clock();
  const target=this.targetKey&&this.entries.get(this.targetKey)?.tile;
  const pending=[...this.entries.values()].filter(e=>!e.ready);
  if(!pending.length)return;
  this.stats.paused=0;
  const order=(a,b)=>a.tier-b.tier||a.distance-b.distance||a.entry.tile.r-b.entry.tile.r||a.entry.tile.c-b.entry.tile.c;
  const rank=()=>pending.filter(e=>!e.ready).map(entry=>{const {dc,dr}=this.offset(entry);return {entry,tier:this.tier(entry,target),distance:this.viewDistance(dc,dr)};}).filter(item=>item.tier!==null).sort(order);
  // V341: strict priority. Each tile's on-screen stages are short, so the
  // nearest visible tile is completed before the next; centre-only layers
  // (the expensive horizon) never delay terrain and trees that are in view.
  let list=rank();this.stats.paused=pending.length-list.length;
  while(list.length&&this.clock()-start<budget){
   const item=list[0];
   this.step(item.entry,true);
   if(item.entry.ready||this.tier(item.entry,target)!==item.tier)list=rank();
  }
 }
 remove(entry){this.dispose(entry);entry.root.removeFromParent();this.entries.delete(entry.key);this.desired.delete(entry.key);this.stats.evicted++;}
 clear(){for(const entry of [...this.entries.values()])this.remove(entry);this.center=null;this.desired=new Set();this.desiredMask='';this.targetKey=null;}
 pause(){this.enabled=false;this.root.visible=false;}
 status(){return {...this.stats,cached:this.entries.size,ready:[...this.entries.values()].filter(e=>e.ready).length,
  active:this.center&&this.key(this.center),desired:[...this.desired],
  tiles:[...this.entries.values()].map(e=>({key:e.key,ready:e.ready,visualReady:e.visualReady,visible:e.root.visible,stage:e.stage,terrain:e.terrain?.uuid}))};}
}
