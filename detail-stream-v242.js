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
  if(entry.ready||(entry.stage&&!VISIBLE_STAGES.has(entry.stage)))entry.visualReady=true;
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
   entry.root.visible=this.enabled&&this.desired.has(entry.key);
   entry.decor.visible=dc===0&&dr===0;
   if(ring>this.reach+1||(ring>this.radius+1&&!this.desired.has(entry.key)&&entry.key!==this.targetKey))this.remove(entry);
  }
  this.dirty=false;
 }
 prefetch(x,z){
  if(!this.enabled||!this.center)return;
  const dc=Math.abs(x)>DETAIL_TILE_X*.18?Math.sign(x):0,dr=Math.abs(z)>DETAIL_TILE_Z*.18?Math.sign(z):0;
  if(!dc&&!dr){this.targetKey=null;return;}
  const target=this.cell(this.center.c+dc,this.center.r+dr);if(!target)return;
  const key=this.key(target);
  this.ensure(target);
  if(key===this.targetKey)return;
  this.targetKey=key;
  // Only the next centre's own neighbourhood is required for the crossing;
  // its wider ring is chosen from the camera view once it becomes active.
  for(let r=-1;r<=1;r++)for(let c=-1;c<=1;c++)this.ensure(this.cell(target.c+c,target.r+r));
  this.position();
 }
 // Lower tier is loaded first.
 tier(entry,target){
  const {dc,dr}=this.offset(entry);
  if(entry.key===this.key(this.center)||entry.key===this.targetKey)return 0; // blocks crossing
  const visibleStage=!entry.stage||VISIBLE_STAGES.has(entry.stage);
  const desired=this.desired.has(entry.key);
  const ring=Math.max(Math.abs(dc),Math.abs(dr));
  if(visibleStage&&desired&&this.inView(dc,dr))return 1; // on screen now
  if(visibleStage&&desired&&ring<=1)return 2;            // neighbour behind the camera
  const near=ring<=1||(target&&Math.max(Math.abs(entry.tile.c-target.c),Math.abs(entry.tile.r-target.r))<=1);
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
