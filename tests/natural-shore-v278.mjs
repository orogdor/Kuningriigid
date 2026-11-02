// V278: no trees or rocks in water or on beach sand; new worlds get a warped (natural) shoreline.
import {Civilization,createGame,shoreWarpV278,shoreLinesV281} from '../civilization-core.js';
const ok=(c,m)=>{if(!c){console.error('FAIL',m);process.exit(1);}};
const g=new Civilization(createGame(20261105,'tectonic'));
ok(g.s.naturalShoreV278,'new worlds use the natural shoreline');
let checked=0,wet=0;
for(const cell of g.cells.filter(c=>c.land&&c.coast).slice(0,60)){
 const w=g.makeWorld(cell);
 for(const r of w.resources){if((r.kind!=='tree'&&r.kind!=='stone')||r.depositSite)continue;checked++;
  const h=g.atlasHeight(cell.x+r.x/4.5,cell.z+r.z/3.9),line=shoreLinesV281(cell).tree;if(!r.removed&&h<=line)wet++;if(h<=line)ok(r.removed&&r.cleared,'tree on sand/water is removed and cannot regrow');}
}
ok(checked>100&&wet===0,'no standing tree or rock on beach or water ('+checked+' checked)');
// the warp is smooth and bounded
let max=0;for(let i=0;i<200;i++){const w=shoreWarpV278(i*7.3,i*3.1);max=Math.max(max,Math.hypot(w.x,w.z));}ok(max<16,'warp bounded '+max.toFixed(1));
const a=shoreWarpV278(100,100),b=shoreWarpV278(100.2,100);ok(Math.hypot(a.x-b.x,a.z-b.z)<.5,'warp is continuous');
// V281: a low forest tile (atlas floor 5) keeps its trees; only the beach is bare
let lowTiles=0,lowBare=0;for(const cell of g.cells.filter(c=>c.land&&!c.mountain&&c.h<5.6&&c.detail?.resources?.filter(r=>r[0]===0).length>=20).slice(0,40)){lowTiles++;const w=g.makeWorld(cell),t=w.resources.filter(r=>r.kind==='tree');if(t.filter(r=>!r.removed).length<t.length*.3)lowBare++;}
ok(lowTiles>5&&lowBare<=lowTiles*.25,'low forest tiles keep their trees ('+lowBare+'/'+lowTiles+' bare)');
console.log('natural shore V278 ok:',checked,'resources checked');
