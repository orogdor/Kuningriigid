// V175.2 end-to-end: real game UI offers Straight and Curved and touch draws a 3D preview.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';
const output='artifacts-v1752';
fs.mkdirSync(output,{recursive:true});
const browser=await chromium.launch({headless:true,
 executablePath:process.env.CHROME_PATH||undefined,
 args:['--no-sandbox','--disable-dev-shm-usage','--enable-webgl','--use-gl=angle',
  '--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const results=[];
try{
 for(const [label,viewport,mobile] of [['desktop',{width:1280,height:800},false],
    ['mobile',{width:390,height:844},true]]){
  const ctx=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile,
   deviceScaleFactor:mobile?2:1});
  await ctx.addInitScript(()=>{
   localStorage.setItem('kingdoms-quality','low');
   localStorage.setItem('kingdoms-civ4','v1752-keep-saved');
   localStorage.setItem('kingdoms-civ4-backup','v1752-keep-backup');
  });
  const page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  try{
   await page.goto('http://127.0.0.1:8765/?v=1752-20261026&demo=ai-stone-v174',
    {waitUntil:'domcontentloaded',timeout:120000});
   await page.waitForFunction(()=>window.gameDebug&&document.getElementById('startmenu')?.hidden,
    {timeout:120000});
   await page.waitForTimeout(1400);
   const initial=await page.evaluate(()=>({
    view:gameDebug.view(),city:gameDebug.activeCity()?.name,age:gameDebug.state.ages[0],
    visibleRoads:gameDebug.localRoadStatus().spots,
    pickAvailable:typeof gameDebug.pick==='function',
    palace:document.querySelector('#tray button[data-building="palisade"]')?.outerHTML?.slice(0,200),
    catalog:document.querySelectorAll('button[data-building]').length
   }));
   assert.equal(initial.view,'local');assert.equal(initial.city,'Sogn');
   assert.ok(initial.catalog>4,'existing build menu is populated');
   await page.evaluate(()=>{
    const card=document.querySelector('#tray button[data-building="palisade"]');
    if(!card)throw Error('Palisade card unavailable');
    card.click();
   });
   const starting=await page.evaluate(()=>({
    status:gameDebug.wallDrawStatus(),
    buttons:[...document.querySelectorAll('#actions button')].map(b=>b.textContent),
    toolbarVisible:!!document.querySelector('#v175-wall-toolbar')&&!document.querySelector('#v175-wall-toolbar').hidden,
    toolbarButtons:[...document.querySelectorAll('#v175-wall-toolbar button')].map(b=>b.textContent),
    oldSave:localStorage.getItem('kingdoms-civ4'),
    oldBackup:localStorage.getItem('kingdoms-civ4-backup')
   }));
   assert.equal(starting.status.mode,'palisade','palisade mode actually selected from menu');
   assert.ok(starting.buttons.some(t=>t.includes('Sirge müür')),'straight option present');
   assert.ok(starting.buttons.some(t=>t.includes('Kumer müür')),'curved option present');
   assert.equal(starting.toolbarVisible,true,'mobile-friendly selector displayed during wall placement');
   assert.ok(starting.toolbarButtons.some(t=>t.includes('Sirge')));
   assert.ok(starting.toolbarButtons.some(t=>t.includes('Kumer')));
   await page.locator('#v175-wall-toolbar .v175-wall-choices button').nth(1).click();
   assert.equal(await page.evaluate(()=>gameDebug.wallDrawStatus().shape),'curved');
   const pt=await page.evaluate(()=>{
    const result=[];
    for(let y=Math.floor(innerHeight*.28);y<innerHeight*.76;y+=Math.max(12,Math.floor(innerHeight*.055)))
      for(let x=Math.floor(innerWidth*.16);x<innerWidth*.84;x+=Math.max(12,Math.floor(innerWidth*.05))){
       const p=gameDebug.pick({clientX:x,clientY:y});
       if(p&&Number.isFinite(p.x)&&Number.isFinite(p.z)&&Math.abs(p.x)<82&&Math.abs(p.z)<72)
        result.push({screenX:x,screenY:y,x:p.x,z:p.z});
      }
    for(const a of result)for(const b of result){
     const d=Math.hypot(a.x-b.x,a.z-b.z),screenDist=Math.hypot(a.screenX-b.screenX,a.screenY-b.screenY);
     if(d>4&&d<6.6&&screenDist>12)return {a,b,d,samples:result.length};
    }
    // A longer stroke can preview the curve even when building costs exceed funds.
    for(const a of result)for(const b of result){
     const d=Math.hypot(a.x-b.x,a.z-b.z),screenDist=Math.hypot(a.screenX-b.screenX,a.screenY-b.screenY);
     if(d>7&&d<20&&screenDist>15)return {a,b,d,samples:result.length};
    }
    return null;
   });
   assert.ok(pt,'at least two reachable screen points for a realistic wall drag');
   await page.mouse.move(pt.a.screenX,pt.a.screenY);
   await page.mouse.down();
   const mid={x:(pt.a.screenX+pt.b.screenX)/2,y:(pt.a.screenY+pt.b.screenY)/2-8};
   await page.mouse.move(mid.x,mid.y,{steps:5});
   await page.mouse.move(pt.b.screenX,pt.b.screenY,{steps:5});
   const during=await page.evaluate(()=>gameDebug.wallDrawStatus());
   assert.equal(during.shape,'curved');
   assert.ok(during.points>=2,'pointer strokes sampled, not panning camera');
   assert.equal(during.preview,true,'curved wall preview is present while drawing');
   await page.screenshot({path:output+'/curved-preview-'+label+'.png'});
   await page.mouse.up();
   await page.waitForTimeout(800);
   const after=await page.evaluate(()=>({
    draw:gameDebug.wallDrawStatus(),
    walls:gameDebug.activeCity()?.economy.buildings.filter(b=>b.drawnWallV175).length||0,
    visibleRoads:gameDebug.localRoadStatus().spots,
    save:localStorage.getItem('kingdoms-civ4'),
    backup:localStorage.getItem('kingdoms-civ4-backup'),
    name:gameDebug.activeCity()?.name
   }));
   assert.equal(after.draw.points,0,'stroke finalizes on touch/mouse release');
   assert.equal(after.draw.preview,false,'drawing preview is cleaned up');
   assert.equal(after.save,'v1752-keep-saved');
   assert.equal(after.backup,'v1752-keep-backup');
   assert.ok(after.visibleRoads>0,'naturally worn roads remain visible');
   assert.deepEqual(errors,[],'no browser JavaScript exceptions');
   await page.locator('#v175-wall-toolbar .v175-wall-choices button').first().click();
   assert.equal(await page.evaluate(()=>gameDebug.wallDrawStatus().shape),'straight','user can also select straight walls');
   await page.screenshot({path:output+'/wall-builder-'+label+'.png'});
   results.push({label,pass:true,initial,starting,during,after,pt});
   console.log('V175.2 BROWSER PASS '+label+' '+JSON.stringify({
    mode:starting.status.mode,shape:during.shape,preview:during.preview,
    realWalls:after.walls,visibleRoads:after.visibleRoads,points:pt.samples
   }));
  }catch(err){
   const msg=String(err?.stack||err);
   try{await page.screenshot({path:output+'/FAILED-'+label+'.png'})}catch{}
   results.push({label,pass:false,message:msg,errors});
   console.error('V175.2 BROWSER FAIL '+label+' '+msg);
  }finally{await ctx.close();}
 }
}finally{await browser.close();fs.writeFileSync(output+'/results.json',JSON.stringify(results,null,2));}
if(results.some(x=>!x.pass))process.exitCode=1;
