// One shared visibility diff for all atlas layers. No per-vertex terrain work
// is repeated when a scout reveals a handful of cells.
import {COLS,ROWS} from './campaign.js';
// V351: newly discovered cells per explored-object, written by game.reveal(). Not part of the save.
const DISCOVERED_V351=new WeakMap();
export function noteDiscoveredV351(explored,key){let log=DISCOVERED_V351.get(explored);if(!log){log=[];DISCOVERED_V351.set(explored,log);}log.push(key);}
export const discoveredLogV351=explored=>explored?DISCOVERED_V351.get(explored):undefined;
export class VisionDelta {
 constructor(state){this.state=state;this.revision=null;this.known=new Set();this.changed=[];this.serial=0;}
 update(){
  const revision=this.state.visionRevision||0;
  if(this.revision===revision)return this;
  const all=!!globalThis.KINGDOMS_REVEAL_V248,explored=this.state.explored?.[0]||{},log=DISCOVERED_V351.get(explored);
  // V351: game.reveal() writes every newly discovered cell of the player to a log (one entry per
  // visionRevision step). When the revision moved exactly by the new log entries, those cells are
  // the whole change: no list of all explored cells is built for a scout step.
  // Anything else (loaded save, "show whole map", a revision bumped elsewhere) takes the full comparison.
  if(!all&&!this.all&&log&&this.source===explored&&this.revision!==null&&revision-this.revision===log.length-this.logged){
   const changed=[];let fresh=true;
   for(let i=this.logged;i<log.length&&fresh;i++){const key=log[i];if(this.known.has(key))fresh=false;else{const cut=key.indexOf(':');changed.push({c:+key.slice(0,cut),r:+key.slice(cut+1),key});}}
   if(fresh){for(const at of changed)this.known.add(at.key);this.logged=log.length;this.changed=changed;this.revision=revision;this.serial++;return this;}
  }
  // V351: "show whole map" stays on: every cell is already known, a scout step changes nothing.
  if(all&&this.all&&this.known.size===COLS*ROWS){this.changed=[];this.source=explored;this.logged=log?log.length:0;this.revision=revision;this.serial++;return this;}
  // V248 temporary: with "show whole map" every cell counts as known
  const next=all?new Set(Array.from({length:COLS*ROWS},(_,i)=>(i%COLS)+':'+Math.floor(i/COLS))):new Set(Object.keys(explored)),changed=[];
  for(const key of next)if(!this.known.has(key))changed.push(key);
  for(const key of this.known)if(!next.has(key))changed.push(key);
  this.known=next;this.changed=changed.map(key=>{const[c,r]=key.split(':').map(Number);return {c,r,key};});
  this.all=all;this.source=explored;this.logged=log?log.length:0;
  this.revision=revision;this.serial++;return this;
 }
}
