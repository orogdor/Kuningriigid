// V273: world-map towns are scaled 1..5x and always fit inside their tile (half width 25).
import {townScaleV273,worldCityPlacementV282} from '../world-city-v269.js';
import {createStoneTownDemoState} from '../stone-town-demo-v270.js';
const ok=(c,m)=>{if(!c){console.error('FAIL',m);process.exit(1);}};
const small=[{type:'hall',x:0,z:0,hp:1},{type:'house',x:12,z:4,hp:1}];
ok(townScaleV273(small)===5,'a tiny town gets the maximum 5x, got '+townScaleV273(small));
const big=createStoneTownDemoState().cities[0].economy.buildings;
const k=townScaleV273(big);ok(k>=1&&k<5,'the 38-building demo town is scaled down from 5x: '+k);
const huge=[{type:'hall',x:0,z:0,hp:1},{type:'house',x:110,z:0,hp:1}];
ok(townScaleV273(huge)===1,'a town filling the tile stays 1:1');
// fit: every building edge inside the tile at the chosen scale
for(const p of worldCityPlacementV282(big).list){const e=Math.max(Math.abs(p.x),Math.abs(p.z))+p.size/2;ok(e<=24.6,'inside tile '+p.b.type+' '+e.toFixed(1));}
// V282: a lumber camp far out in the forest no longer shrinks the town core to 1:1; it is pulled in to the edge
const spread=[{type:'hall',x:0,z:0,hp:1},{type:'house',x:12,z:4,hp:1},{type:'house',x:-10,z:8,hp:1},{type:'lumber',x:100,z:-80,hp:1},{type:'hunter',x:-95,z:70,hp:1}];
const ks=townScaleV273(spread);ok(ks>=4,'outlying camps do not shrink the core: '+ks.toFixed(2));
for(const p of worldCityPlacementV282(spread).list){const e=Math.max(Math.abs(p.x),Math.abs(p.z))+p.size/2;ok(e<=24.6,'outlier clamped inside tile '+p.b.type+' '+e.toFixed(1));}
console.log('world city scale V273 ok, demo town x'+k.toFixed(2));
