// V286: smooth beaches and river banks: sand blends into grass over a height band (no saw-tooth switch), the
// world map river trough stays just under the water surface (no wide sea-filled terraces).
import * as T from '../vendor/three.module.js';
import {Civilization,createGame} from '../civilization-core.js';
import {detailGroundColor} from '../landscape-v149.js';
import {overviewSurface,riverNear,getRivers,surface} from '../continuous-landscape.js';
const ok=(c,m)=>{if(!c){console.error('FAIL',m);process.exit(1);}};
const g=new Civilization(createGame(20261106,'tectonic'));
const cell=g.cells.find(c=>c.land&&!c.mountain);
// colour changes gradually across the sand line: no jump bigger than a small step between close heights
let prev=null,maxJump=0;for(let h=-.8;h<=1.8;h+=.05){const c=detailGroundColor(g,cell.x,cell.z,h,false);if(prev)maxJump=Math.max(maxJump,Math.abs(c.r-prev.r)+Math.abs(c.g-prev.g)+Math.abs(c.b-prev.b));prev=c.clone();}
ok(maxJump<.12,'beach colours blend smoothly (largest step '+maxJump.toFixed(3)+', a hard switch was ~.4)');
// world map: at the river line the coarse surface is at most .6 below the water, never 2.3
let worst=0,n=0;for(const e of getRivers(g).slice(0,60))for(const p of e.points||[]){const near=riverNear(g,p.x,p.z);if(!Number.isFinite(near.distance))continue;n++;
 worst=Math.max(worst,Math.min(surface(g,p.x,p.z),near.waterHeight-.6)-overviewSurface(g,p.x,p.z,50/3));}
ok(n>20&&worst<=1e-6,'world river trough at most .6 m under the water (was 2.3 m; excess '+worst.toFixed(3)+', '+n+' points)');
console.log('coast V286 ok');
