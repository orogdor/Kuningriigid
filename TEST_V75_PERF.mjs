import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdirSync,writeFileSync,statSync} from 'node:fs';

const DIR='benchmarks-v75';
mkdirSync(DIR,{recursive:true});
const root='http://127.0.0.1:8765/';
const flags=['--no-sandbox','--disable-dev-shm-usage','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'];
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined,args:flags});
const kinds=['village','ruins','rock','forest','bridge'];
const report={method:'Chromium Playwright, ANGLE/SwiftShader software WebGL (not physical Android GPU)',fixtures:{},objectSizes:[],benchmarks:[],errors:[],assets:{}};
for(const kind of kinds){
 const file={village:'world_village_1000',ruins:'ancient_ruin_1000',rock:'rock_outcrop_1000',forest:'forest_cluster_1000',bridge:'river_bridge_1000'}[kind];
 report.assets[kind]=statSync('assets/world1000/'+file+'.glb').size;
}
const round=(n,nDigits=1)=>Math.round(n*10**nDigits)/10**nDigits;
async function setup({width,height,dpr,isMobile,label}){
 const ctx=await browser.newContext({viewport:{width,height},deviceScaleFactor:dpr,isMobile,hasTouch:isMobile,locale:'et-EE'});
 const page=await ctx.newPage();
 page.on('pageerror',e=>report.errors.push(label+': '+e.message));
 await page.goto(root,{waitUntil:'domcontentloaded',timeout:60000});
 await page.waitForFunction(()=>!!window.gameDebug,{timeout:90000});
 await page.locator('#continue').click();
 await page.waitForFunction(()=>document.getElementById('startmenu').hidden,{timeout:20000});
 await page.waitForTimeout(850);
 return {ctx,page};
}
async function setQuality(page,want){
 await page.evaluate(want=>{
  let i=0;
  while(window.gameDebug.quality()!==want&&i++<4)document.getElementById('quality').click();
  if(window.gameDebug.quality()!==want)throw Error('Cannot activate '+want);
 },want);
 await page.waitForTimeout(300);
}
async function openSite(page,kind){
 const l=await page.evaluate(async kind=>{
  const dbg=window.gameDebug,catalog=(await import('./world-object-catalog.js')).createWorldObjectCatalog(dbg.game,dbg.quality());
  let site;
  if(kind==='village'||kind==='ruins')site=dbg.state.landmarks.find(s=>s.kind===kind);
  else site=catalog.candidates[kind].find(s=>Math.abs(s.c-110)<60&&Math.abs(s.r-82)<50)||catalog.candidates[kind][0];
  if(!site)throw Error('Missing '+kind+' map site');
  dbg.game.reveal(0,site,1);dbg.openTile(dbg.game.cell(site));
  return {c:site.c,r:site.r,id:(kind==='village'||kind==='ruins'?'landmark:'+site.id:kind+':'+site.c+':'+site.r),kind};
 },kind);
 await page.waitForFunction(id=>window.gameDebug.detailObjectStatus().some(t=>t.ids.includes(id)),l.id,{timeout:30000});
 await page.waitForTimeout(400);
 return l;
}
async function inspectSize(page,site){
 return page.evaluate(async site=>{
  const T=await import('./vendor/three.module.js'),dbg=window.gameDebug,scene=dbg.localScene,cam=dbg.camera;
  scene.updateMatrixWorld(true);cam.updateMatrixWorld(true);
  let found;scene.traverse(o=>{if(o.userData.worldSiteId===site.id)found=o});
  if(!found)throw Error('No scene geometry for '+site.id);
  const box=new T.Box3().setFromObject(found),s=box.getSize(new T.Vector3()),c=box.getCenter(new T.Vector3());
  const corners=[];
  for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){
   const q=new T.Vector3(x,y,z).project(cam);corners.push({x:(q.x+1)*innerWidth/2,y:(1-q.y)*innerHeight/2,z:q.z});
  }
  const x0=Math.min(...corners.map(q=>q.x)),x1=Math.max(...corners.map(q=>q.x));
  const y0=Math.min(...corners.map(q=>q.y)),y1=Math.max(...corners.map(q=>q.y));
  let triangles=0,meshes=0,vertices=0;found.traverse(o=>{if(o.isMesh){meshes++;const g=o.geometry;triangles+=(g.index?g.index.count:g.attributes.position.count)/3;vertices+=g.attributes.position.count;}});
  return {kind:site.kind,id:site.id,width:Math.round(s.x*10)/10,depth:Math.round(s.z*10)/10,height:Math.round(s.y*10)/10,
    tileWidth:150,tileDepth:130,footprintPct:Math.round(Math.max(s.x/150,s.z/130)*100),worldCenter:{x:c.x,y:c.y,z:c.z},
    screen:{x:Math.round(x0),y:Math.round(y0),w:Math.round(x1-x0),h:Math.round(y1-y0),
      intersectsViewport:x0<innerWidth&&x1>0&&y0<innerHeight&&y1>0},meshes,triangles:Math.round(triangles),vertices,
    renderer:dbg.perfStats()};
 },site);
}
async function benchmark(page,{hideProps,samples=44}){
 return page.evaluate(async opts=>{
  const dbg=window.gameDebug,holder=[];
  dbg.localScene.traverse(o=>{if(o.name?.startsWith('World/detail shared sites '))holder.push(o)});
  const visibility=holder.map(o=>o.visible);
  for(const o of holder)o.visible=!opts.hideProps;
  try{
   for(let i=0;i<8;i++)await new Promise(r=>requestAnimationFrame(r));
   const delta=[];let previous=null;
   for(let i=0;i<opts.samples;i++)await new Promise(r=>requestAnimationFrame(now=>{
    if(previous!==null)delta.push(now-previous);previous=now;r();
   }));
   delta.sort((a,b)=>a-b);
   const average=delta.reduce((a,b)=>a+b,0)/delta.length,stat=dbg.perfStats();
   return {activeObjects:!opts.hideProps,frames:delta.length,avgMs:Math.round(average*10)/10,
     p50Ms:Math.round(delta[Math.floor(delta.length*.50)]*10)/10,
     p95Ms:Math.round(delta[Math.floor(delta.length*.95)]*10)/10,
     fps:Math.round(1000/average*10)/10,...stat};
  }finally{holder.forEach((o,i)=>o.visible=visibility[i]);}
 },{hideProps,samples});
}
try{
 const variants=[
  {label:'phone-portrait',width:390,height:844,dpr:2,isMobile:true,qualities:['low','medium','high']},
  {label:'phone-landscape',width:844,height:390,dpr:2,isMobile:true,qualities:['medium']},
  {label:'desktop',width:1440,height:900,dpr:1,isMobile:false,qualities:['medium','high']}
 ];
 for(const variant of variants){
  const {ctx,page}=await setup(variant);
  try{
   await setQuality(page,'medium');
   for(const kind of kinds){
    const loc=await openSite(page,kind);
    const size=await inspectSize(page,loc);
    assert.ok(size.width>0&&size.depth>0&&size.height>0,kind+' nonzero dimensions');
    assert.ok(size.footprintPct<55,kind+' should not consume over half the whole detail tile');
    assert.ok(size.screen.intersectsViewport,kind+' visually falls inside the viewport');
    assert.ok(size.triangles>0&&size.meshes>0,kind+' real geometry');
    report.objectSizes.push({viewport:variant.label,...size});
    console.log('V75 SIZE '+variant.label+' '+JSON.stringify({kind,size:[size.width,size.depth,size.height],tilePct:size.footprintPct,px:[size.screen.w,size.screen.h],triangles:size.triangles,drawCalls:size.renderer.drawCalls}));
    if(variant.label==='phone-portrait'||(variant.label==='desktop'&&['village','ruins'].includes(kind)))
      await page.screenshot({path:DIR+'/'+variant.label+'-'+kind+'.png'});
   }
   const loc=await openSite(page,'village');
   for(const quality of variant.qualities){
    await setQuality(page,quality);
    const included=await benchmark(page,{hideProps:false});
    const excluded=await benchmark(page,{hideProps:true});
    // WebGL draw call parity detects whether the scene truly draws the 3D landmark.
    assert.ok(included.drawCalls>excluded.drawCalls,'3D props must increase renderer draw calls');
    report.benchmarks.push({device:variant.label,quality,site:loc.id,withProps:included,withoutProps:excluded,
      impact:{extraDrawCalls:included.drawCalls-excluded.drawCalls,extraTriangles:included.triangles-excluded.triangles,
        frameMsDifference:round(included.avgMs-excluded.avgMs),fpsDifference:round(included.fps-excluded.fps)}});
    console.log('V75 PERF '+JSON.stringify(report.benchmarks.at(-1)));
   }
  }finally{await ctx.close()}
 }
 assert.deepEqual(report.errors,[],'no browser exceptions');
 const maxFootprint=Math.max(...report.objectSizes.map(o=>o.footprintPct));
 const maxTriangles=Math.max(...report.objectSizes.map(o=>o.triangles));
 console.log('V75 BENCHMARK PASS '+JSON.stringify({assets:report.assets,measurements:report.objectSizes.length,benchmarks:report.benchmarks.length,
   maxFootprintPct:maxFootprint,maxModelTriangles,maxTriangles,drawCallDelta:report.benchmarks.map(b=>b.impact.extraDrawCalls)}));
}finally{
 writeFileSync(DIR+'/results.json',JSON.stringify(report,null,2));
 await browser.close();
}
