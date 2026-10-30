// Visual streaming only. Simulation coordinates and save data never move.
import * as T from './vendor/three.module.js';
import {DETAIL_TILE_X,DETAIL_TILE_Z} from './detail-scale-v123.js';
export class DetailStreamV242{
 constructor({scene,cell,build,dispose,clock=()=>performance.now(),budget=3}){
  Object.assign(this,{cell,build,dispose,clock,budget});this.entries=new Map();
  this.root=new T.Group();this.root.name='V242 persistent detail tiles';scene.add(this.root);
  this.center=null;this.enabled=false;this.stats={created:0,reused:0,evicted:0,maxJobMs:0,crossings:0};
 }
 key(tile){return tile.c+':'+tile.r;}
 ensure(tile){
  if(!tile)return null;const key=this.key(tile);let entry=this.entries.get(key);
  if(entry)return entry;
  const root=new T.Group(),scenery=new T.Group(),actors=new T.Group(),sites=new T.Group(),decor=new T.Group();root.add(scenery,actors,sites,decor);
  root.name='V242 tile '+key;root.visible=false;
  entry={tile,key,root,scenery,actors,sites,decor,resources:new Map(),buildings:new Map(),workers:new Map(),units:new Map(),ready:false};
  this.entries.set(key,entry);this.root.add(root);entry.jobs=this.build(entry);this.stats.created++;return entry;
 }
 step(entry,background=false){
  if(!entry||entry.ready)return;const start=this.clock();
  const next=entry.jobs.next();entry.ready=!!next.done;
  const ms=this.clock()-start;
  this.stats.maxJobMs=Math.max(this.stats.maxJobMs,ms);
  if(background&&ms>(this.stats.maxBackgroundJobMs||0)){this.stats.maxBackgroundJobMs=ms;this.stats.slowestStage=entry.stage;}
 }
 finish(tile){const entry=this.ensure(tile);while(!entry.ready)this.step(entry);return entry;}
 activate(tile){
  this.stats.reused+=[...this.entries.values()].filter(e=>e.ready&&e.root.visible&&Math.max(Math.abs(e.tile.c-tile.c),Math.abs(e.tile.r-tile.r))<=1).length;
  if(this.center&&this.key(this.center)!==this.key(tile))this.stats.crossings++;
  this.center=tile;this.enabled=true;this.root.visible=true;
  for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++)this.ensure(this.cell(tile.c+dc,tile.r+dr));
  this.position();return this.entries.get(this.key(tile));
 }
 position(){
  if(!this.center)return;
  for(const entry of this.entries.values()){
   const dc=entry.tile.c-this.center.c,dr=entry.tile.r-this.center.r;
   entry.root.position.set(dc*DETAIL_TILE_X,0,dr*DETAIL_TILE_Z);
   entry.root.visible=this.enabled&&Math.max(Math.abs(dc),Math.abs(dr))<=1;
   entry.decor.visible=dc===0&&dr===0;
   if(Math.max(Math.abs(dc),Math.abs(dr))>2)this.remove(entry);
  }
 }
 prefetch(x,z){
  if(!this.enabled||!this.center)return;
  const dc=Math.abs(x)>DETAIL_TILE_X*.18?Math.sign(x):0,dr=Math.abs(z)>DETAIL_TILE_Z*.18?Math.sign(z):0;
  if(!dc&&!dr)return;
  const target=this.cell(this.center.c+dc,this.center.r+dr);if(!target)return;
  this.targetKey=this.key(target);
  this.ensure(target);
  for(let r=-1;r<=1;r++)for(let c=-1;c<=1;c++)this.ensure(this.cell(target.c+c,target.r+r));
  this.position();
 }
 tick(){
  if(!this.enabled||!this.center)return;const start=this.clock();
  const pending=[...this.entries.values()].filter(e=>!e.ready).sort((a,b)=>{
   const distance=e=>e.key===this.targetKey?-1:Math.max(Math.abs(e.tile.c-this.center.c),Math.abs(e.tile.r-this.center.r));
   return distance(a)-distance(b);
  });
  // One bounded construction step at a time, rather than one whole scene.
  while(pending.length&&this.clock()-start<this.budget){
   this.step(pending[0],true);if(pending[0].ready)pending.shift();
  }
 }
 remove(entry){this.dispose(entry);entry.root.removeFromParent();this.entries.delete(entry.key);this.stats.evicted++;}
 clear(){for(const entry of [...this.entries.values()])this.remove(entry);this.center=null;}
 pause(){this.enabled=false;this.root.visible=false;}
 status(){return {...this.stats,cached:this.entries.size,ready:[...this.entries.values()].filter(e=>e.ready).length,
  active:this.center&&this.key(this.center),tiles:[...this.entries.values()].map(e=>({key:e.key,ready:e.ready,visible:e.root.visible,terrain:e.terrain?.uuid}))};}
}
