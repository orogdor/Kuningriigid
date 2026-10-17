// V40: Traffic-driven world roads. Only real completed land crossings create roads.
// Edges are undirected so traders, armies and settlers share infrastructure.
import {COLS,ROWS} from './campaign.js';
export const ROAD_SPEED=1.5;
export const ROAD_THRESHOLDS=[4,12,28,65];
const clamp=n=>Math.max(0,Math.min(150,n));
const index=p=>p.r*COLS+p.c;
export function roadKey(a,b){const x=index(a),y=index(b);return x<y?x+':'+y:y+':'+x}
export function roadPoints(key){const[a,b]=key.split(':').map(Number);return [{c:a%COLS,r:Math.floor(a/COLS)},{c:b%COLS,r:Math.floor(b/COLS)}]}
export function roadLevel(heat){return heat>=65?4:heat>=28?3:heat>=12?2:heat>=4?1:0}
// A well-trodden road erodes much more slowly than a casual footpath.
export function ageTraffic(heat,elapsed){let h=clamp(heat),t=Math.max(0,elapsed);while(t>0&&h>0){const level=roadLevel(h);const rate=[.004,.0035,.0018,.0007,.0002][level];const floor=[0,4,12,28,65][level];if(!level)return Math.max(0,h-rate*t);const step=Math.max(0,(h-floor)/rate);if(step>=t){h-=rate*t;break}h= floor-.00001;t-=step;}return h<.02?0:h}
export function roadStrength(state,a,b,now=state.time||0){const edge=state.worldRoads?.[roadKey(a,b)];return edge?ageTraffic(edge.heat,now-edge.last):0}
export function roadBoost(state,a,b,now){return roadLevel(roadStrength(state,a,b,now))?ROAD_SPEED:1}
export function recordWorldStep(state,a,b,kind='army',now=state.time||0){if(!a||!b||Math.abs(a.c-b.c)+Math.abs(a.r-b.r)!==1)return;
 const key=roadKey(a,b),roads=state.worldRoads??={};const old=roads[key];const previous=old?ageTraffic(old.heat,now-old.last):0;
 const amount=kind==='caravan'?4.5:kind==='settler'?2.5:kind==='builder'?2.5:3;
 const next=clamp(previous+amount);roads[key]={heat:next,last:now};
 if(!old||roadLevel(previous)!==roadLevel(next))state.roadRevision=(state.roadRevision||0)+1;
}
export function decayWorldRoads(state,dt){state.roadDecayClock=(state.roadDecayClock||0)+dt;if(state.roadDecayClock<30)return;state.roadDecayClock%=30;
 for(const[key,edge]of Object.entries(state.worldRoads||{})){
  const next=ageTraffic(edge.heat,(state.time||0)-edge.last),changed=roadLevel(edge.heat)!==roadLevel(next);
  if(next<=0)delete state.worldRoads[key];else {edge.heat=next;edge.last=state.time}
  if(changed)state.roadRevision=(state.roadRevision||0)+1;
 }
}
