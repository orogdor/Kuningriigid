// V223 manual browser regression. Requires a static server on 127.0.0.1:8765
// and Playwright (not added to the fast CI workflow). Checks one river and one road.
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined,
 args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1100,height:750}});
 await page.addInitScript(()=>localStorage.setItem('kingdoms-quality','low'));
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8765/?demo=stone&v=223',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.gameDebug&&document.querySelector('#menu-status')?.hidden,{timeout:90000});
 const river=await page.evaluate(()=>{
  const gd=gameDebug,game=gd.game,city=gd.state.cities.find(c=>c.team===0);
  const cell=game.cells.filter(x=>x.river&&x.riverTo&&x.land)
   .sort((a,b)=>Math.abs(a.c-city.c)+Math.abs(a.r-city.r)-Math.abs(b.c-city.c)-Math.abs(b.r-city.r))[0];
  if(!cell)return null;
  gd.openTile(cell);return {c:cell.c,r:cell.r};
 });
 assert.ok(river,'a river tile is available');
 await page.waitForTimeout(1100);
 const bank=await page.evaluate(()=>{
  const results=[];
  gameDebug.localScene.traverse(o=>{if(o.userData?.riverEdges)results.push({
    edges:o.userData.riverEdges,dry:o.userData.dryBankVertexCount,
    children:o.children.map(c=>c.name)})});
  return results[0];
 });
 assert.ok(bank?.edges>0,'continuous river edges present');
 assert.ok(bank?.dry>0,'gravel and meadow banks present');
 assert.ok(bank.children.includes('continuous water surface'));
 assert.ok(!bank.children.includes('shallow walkable ford shoals'),'no former polygonal ford');
 const road=await page.evaluate(async()=>{
  const gd=gameDebug,g=gd.game,s=gd.state,city=s.cities.find(c=>c.team===0);
  const candidates=g.cells.filter(c=>c.land&&!c.river&&g.seen(0,c)&&Math.abs(c.c-city.c)+Math.abs(c.r-city.r)<6);
  const a=candidates.find(c=>{const b=g.cell({c:c.c+1,r:c.r});return b?.land&&!b.river&&g.seen(0,b)});
  if(!a)return null;
  const b=g.cell({c:a.c+1,r:a.r}),id=p=>p.r*220+p.c;
  s.worldRoads??={};s.worldRoads[id(a)+':'+id(b)]={heat:130,last:s.time};
  s.roadRevision=(s.roadRevision||0)+1;gd.openTile(a);
  const {roadSpline}=await import('./continuous-landscape.js?v=223');
  const points=roadSpline(g,a,b),finite=points.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.z));
  return {finite,unchangedEnds:points[0].x===a.x&&points[0].z===a.z&&points.at(-1).x===b.x&&points.at(-1).z===b.z};
 });
 assert.ok(road?.finite&&road?.unchangedEnds,'road contours keep original graph endpoints');
 await page.waitForTimeout(1000);
 const rendered=await page.evaluate(()=>{
  const roads=[];gameDebug.localScene.traverse(o=>{if(o.userData?.roadNetwork)roads.push(o.userData.roadEdges)});return roads.some(n=>n>0);
 });
 assert.ok(rendered,'a world road is rendered');
 assert.deepEqual(errors,[],'no browser runtime errors');
 console.log('V223 PASS',JSON.stringify({river,bankVertices:bank.dry,road}));
}finally{await browser.close();}
