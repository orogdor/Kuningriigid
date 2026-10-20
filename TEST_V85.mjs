import assert from 'node:assert/strict';
import {Civilization,createGame} from './civilization-core.js';
import {createRiverNetwork,disposeNetwork} from './continuous-landscape-visual.js';
import {createMountainOutcrops} from './landscape-polish-v84.js';
import {createDetailBorders} from './detail-borders-v85.js';
import {getRivers,worldToLocal,projectHeight,surface,riverNear,overviewSurface} from './continuous-landscape.js';
for(const seed of [8417,17]){
 const g=new Civilization(createGame(seed)),tile=getRivers(g).find(e=>e.c.land).c;
 const state=JSON.stringify(g.s),river=createRiverNetwork(g,'detail',tile);
 const water=river.getObjectByName('continuous water surface'),pos=water.geometry.attributes.position;
 assert.ok(pos.count>100);
 for(let i=0;i<pos.count;i++){const x=tile.x+pos.getX(i)/3,z=tile.z+pos.getZ(i)/2.6;assert.ok(surface(g,x,z,'detail')<pos.getY(i)+.1,'actual terrain stays below the river water');}for(const v of pos.array)assert.ok(Number.isFinite(v));
 const ix=water.geometry.index.array;
 for(let j=0;j<ix.length;j+=3){const a=ix[j],b=ix[j+1],c=ix[j+2],x=tile.x+(pos.getX(a)+pos.getX(b)+pos.getX(c))/9,z=tile.z+(pos.getZ(a)+pos.getZ(b)+pos.getZ(c))/(3*2.6),y=(pos.getY(a)+pos.getY(b)+pos.getY(c))/3;assert.ok(surface(g,x,z,'detail')<y+.15,'no terrain pierces the middle of a water triangle');}
 // A shared x/z position may never have two water heights at a confluence.
 const heights=new Map();for(let i=0;i<pos.count;i++){const k=pos.getX(i).toFixed(3)+':'+pos.getZ(i).toFixed(3),y=pos.getY(i);if(heights.has(k))assert.ok(Math.abs(heights.get(k)-y)<.003);heights.set(k,y)}
 // Sample the actual overview triangle interpolation along every river.
 const step=50/3,cache=new Map();
 const height=(x,z)=>{const k=x+':'+z;if(!cache.has(k))cache.set(k,overviewSurface(g,x,z,step));return cache.get(k)};
 for(const edge of getRivers(g))for(const p of edge.points){
  if(g.atlasHeight(p.x,p.z)<2)continue;
  const gx=(p.x+650)/step,gz=(p.z+550)/step,X=Math.floor(gx),Z=Math.floor(gz),u=gx-X,v=gz-Z,x=X*step-650,z=Z*step-550;
  const a=height(x,z),b=height(x,z+step),c=height(x+step,z+step),d=height(x+step,z);
  const y=u+v<1?a*(1-u-v)+d*u+b*v:b*(1-u)+d*(1-v)+c*(u+v-1);
  assert.ok(y<riverNear(g,p.x,p.z).waterHeight+.05,'overview triangle cannot conceal a river');
 }
 const mountain=g.cells.find(c=>c.mountain),rocks=createMountainOutcrops(g,'detail',mountain);
 assert.ok(rocks.userData.outcropCount>0);assert.equal(rocks.children.length,0,'no independent cliff caps can hover over the terrain');assert.ok(rocks.userData.continuousRelief);
 assert.equal(JSON.stringify(g.s),state,'rendering leaves campaign state intact');
 // A single owned tile with a neighbouring district has six outer edges,
 // never a boundary through the middle of the same city.
 const c=tile,adjacent=g.cell({c:c.c+1,r:c.r}),city={id:900,team:0};
 const owners=new Map([[c.c+':'+c.r,city],[adjacent.c+':'+adjacent.r,city]]);
 const fake={...g,cells:[c,adjacent],territory:owners,refreshTerritory(){},seen(){return true},atlasHeight:(x,z)=>g.atlasHeight(x,z),cell:p=>g.cell(p)};
 const border=createDetailBorders(fake,c);
 assert.equal(border.children[0].geometry.attributes.position.count,6*50*6,'only exterior edges rendered');
 assert.equal(border.userData.borderTeams,1);
 for(const net of [river,rocks,border])disposeNetwork(net);
 console.log('V85 PASS',seed,{riverVertices:pos.count});
}
