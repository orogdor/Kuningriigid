// V175.4 stronger end-to-end: the user's *curved* wall must actually
// build multiple PAID sections on an emulated Android-sized touch viewport.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';
fs.mkdirSync('artifacts-v1754-curves',{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined,
 args:['--no-sandbox','--disable-dev-shm-usage','--enable-webgl','--use-gl=angle',
 '--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const report={};
try{
 const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});
 await ctx.addInitScript(()=>{localStorage.setItem('kingdoms-quality','low');});
 const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 try {
  await page.goto('http://127.0.0.1:8765/?demo=ai-stone-v174&v=1754-curved',
   {waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>window.gameDebug&&document.getElementById('startmenu')?.hidden,{timeout:120000});
  await page.evaluate(()=>document.querySelector('#tray button[data-building="palisade"]').click());
  await page.locator('#v175-wall-toolbar .v175-wall-choices button').nth(1).click();
  assert.equal(await page.evaluate(()=>gameDebug.wallDrawStatus().shape),'curved');
  const selection=await page.evaluate(async()=>{
   const {wallStrokePlanV175}=await import('./wall-draw-v175.js?v=1754a');
   const g=gameDebug.game,c=gameDebug.activeCity();
   const pts=[];
   for(let y=Math.floor(innerHeight*.33);y<innerHeight*.82;y+=20)
    for(let x=Math.floor(innerWidth*.10);x<innerWidth*.90;x+=17){
     const p=gameDebug.pick({clientX:x,clientY:y});
     if(p&&Number.isFinite(p.x)&&Number.isFinite(p.z)&&Math.abs(p.x)<97&&Math.abs(p.z)<85)
      pts.push({sx:x,sy:y,x:p.x,z:p.z});
    }
   let attempts=0,rejected={};
   for(const a of pts)for(const b of pts){
    const d=Math.hypot(a.x-b.x,a.z-b.z);
    if(d<10||d>13.5||Math.hypot(a.sx-b.sx,a.sy-b.sy)<30)continue;
    const mx=(a.x+b.x)/2,mz=(a.z+b.z)/2;
    for(const middle of pts){
     const offset=Math.hypot(middle.x-mx,middle.z-mz);
     if(offset<1.5||offset>3.5)continue;
     if(Math.abs(Math.hypot(middle.x-a.x,middle.z-a.z)+Math.hypot(middle.x-b.x,middle.z-b.z)-d)>3)continue;
     const plan=wallStrokePlanV175([a,middle,b],'curved');
     if(plan.error||plan.segments.length<2||plan.segments.length>3)continue;
     attempts++;
     const errs=plan.segments.map(p=>g.previewBuild(c,'palisade',p).error).filter(Boolean);
     if(errs.length){rejected[errs[0]]=(rejected[errs[0]]||0)+1;continue;}
     // Adjacent segment centres should be >= 6m to satisfy actual live
     // buildRule near-building rules once the first section exists.
     if(plan.segments.some((p,i)=>i>0&&Math.hypot(p.x-plan.segments[i-1].x,p.z-plan.segments[i-1].z)<6.01))continue;
     return {a:{x:a.sx,y:a.sy},mid:{x:middle.sx,y:middle.sy},b:{x:b.sx,y:b.sy},
      segments:plan.segments.length,attempts,points:pts.length,wood:g.constructionArea(c).stock.wood,
      rejected};
    }
    if(attempts>900)break;
   }
   return {error:'No safe two-section curved stroke on camera viewport',attempts,
    points:pts.length,rejected};
  });
  assert.ok(!selection.error,JSON.stringify(selection));
  report.selection=selection;
  const before=await page.evaluate(()=>({n:gameDebug.activeCity().economy.buildings.filter(b=>b.drawnWallV175).length,
   wood:gameDebug.game.constructionArea(gameDebug.activeCity()).stock.wood}));
  const session=await ctx.newCDPSession(page);
  const touch=async(type,p)=>session.send('Input.dispatchTouchEvent',{type,touchPoints:p?[{id:2,x:p.x,y:p.y,force:1}]:[]});
  await touch('touchStart',selection.a);
  for(const [a,b] of [[selection.a,selection.mid],[selection.mid,selection.b]]){
   for(let i=1;i<=8;i++){
    await touch('touchMove',{x:a.x+(b.x-a.x)*i/8,y:a.y+(b.y-a.y)*i/8});
    await page.waitForTimeout(30);
   }
  }
  const during=await page.evaluate(()=>gameDebug.wallDrawStatus());
  assert.equal(during.preview,true,'curved preview appears during genuine touch');
  await page.screenshot({path:'artifacts-v1754-curves/preview-mobile.png'});
  await touch('touchEnd');
  await session.detach();
  await page.waitForTimeout(700);
  const after=await page.evaluate(()=>({
   n:gameDebug.activeCity().economy.buildings.filter(b=>b.drawnWallV175).length,
   segments:gameDebug.activeCity().economy.buildings.filter(b=>b.drawnWallV175)
    .map(b=>({x:b.x,z:b.z,angle:b.wallAngleV175,span:b.palisadeSpanV167})),
   wood:gameDebug.game.constructionArea(gameDebug.activeCity()).stock.wood,
   feedback:gameDebug.wallDrawStatus().lastBuild,
   road:gameDebug.localRoadStatus().spots
  }));
  report.before=before;report.after=after;
  assert.ok(after.n-before.n>=2,'actual multi-segment rounded wall built by real finger gesture');
  assert.equal(after.feedback?.built,after.n-before.n,'user feedback agrees');
  assert.equal(after.feedback?.error,'','no interrupted construction');
  assert.ok(before.wood-after.wood>=6,'two or more segments paid for');
  assert.ok(after.road>0,'natural roads persist');
  assert.deepEqual(errors,[],'JS must not crash');
  await page.screenshot({path:'artifacts-v1754-curves/built-mobile.png'});
  console.log('V175.4 CURVED MOBILE TOUCH BUILD PASS '+JSON.stringify({built:after.n-before.n,
   woodSpent:before.wood-after.wood,turns:selection.segments,roadCells:after.road}));
  report.pass=true;
 }catch(e){report.pass=false;report.error=String(e?.stack||e);
  console.error('V175.4 CURVED MOBILE TOUCH BUILD FAIL '+report.error);
  try{await page.screenshot({path:'artifacts-v1754-curves/FAILED-mobile.png'})}catch{}
  process.exitCode=1;
 }finally{await ctx.close();}
}finally{await browser.close();fs.writeFileSync('artifacts-v1754-curves/results.json',JSON.stringify(report,null,2));}
