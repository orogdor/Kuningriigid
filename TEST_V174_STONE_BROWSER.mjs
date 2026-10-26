// V174: browser takeover QA. Opens real AI-generated near-Bronze Stone Age state.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';
const out='artifacts-v174';fs.mkdirSync(out,{recursive:true});
const result=[];
const manifest=JSON.parse(fs.readFileSync('scenarios/ai-stone-v174.manifest.json','utf8'));
const browser=await chromium.launch({headless:true,
 executablePath:process.env.CHROME_PATH||undefined,
 args:['--no-sandbox','--disable-dev-shm-usage','--enable-webgl','--use-gl=angle',
  '--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 for(const [label,viewport,mobile] of [['desktop',{width:1280,height:800},false],
   ['mobile',{width:390,height:844},true]]){
  const ctx=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile,deviceScaleFactor:mobile?2:1});
  await ctx.addInitScript(()=>{
   localStorage.setItem('kingdoms-quality','low');
   localStorage.setItem('kingdoms-civ4','v174-protected-user-save');
   localStorage.setItem('kingdoms-civ4-backup','v174-protected-backup');
  });
  const page=await ctx.newPage(),errors=[];
  page.on('pageerror',err=>errors.push(err.message));
  try{
   await page.goto('http://127.0.0.1:8765/?v=174&demo=ai-stone-v174',
    {waitUntil:'domcontentloaded',timeout:120000});
   await page.waitForFunction(()=>window.gameDebug&&document.getElementById('startmenu')?.hidden,
    {timeout:120000});
   await page.waitForTimeout(1900);
   const initial=await page.evaluate(()=>{
    const d=window.gameDebug,t=d.state.stoneTestV174,
      c=d.state.cities.find(x=>x.id===t?.targetCityId);
    const modelKeys=new Set();let sceneMeshes=0;
    d.localScene.traverse(o=>{
     if(o.isMesh)sceneMeshes++;
     if(o.userData?.townModelV154)modelKeys.add(o.userData.townModelV154);
    });
    return {view:d.view(),demo:d.state.demo,turn:t?.turn,city:c?.name,
     owner:c?.team,selected:d.activeCity()?.id,age:d.state.ages[0],
     time:d.state.time,pop:c?.economy.realms[0]?.pop,
     meshes:sceneMeshes,modelVariants:modelKeys.size,
     perf:d.perfStats(),pause:document.getElementById('pause')?.textContent.trim(),
     activeSave:localStorage.getItem('kingdoms-civ4'),
     backup:localStorage.getItem('kingdoms-civ4-backup'),errorText:document.getElementById('menu-status')?.textContent};
   });
   assert.equal(initial.demo,'ai-stone-v174',label+' genuine demo');
   assert.equal(initial.age,0,label+' is late Stone Age, not Bronze');
   assert.equal(initial.owner,0,label+' is player-owned');
   assert.equal(initial.selected,manifest.selectedCityId,label+' city opened directly');
   assert.equal(initial.city,manifest.selectedCity,label+' correct settlement');
   assert.equal(initial.view,'local',label+' sees detail view');
   assert.ok(initial.turn>=60,label+' is late enough');
   assert.ok(initial.meshes>40&&initial.perf.drawCalls>0&&initial.perf.triangles>0,label+' WebGL active');
   assert.ok(initial.modelVariants>=4,label+' real building models visible');
   assert.equal(initial.pause,'▶',label+' starts paused for inspection');
   assert.equal(initial.activeSave,'v174-protected-user-save');
   assert.equal(initial.backup,'v174-protected-backup');
   assert.deepEqual(errors,[],label+' startup JavaScript errors');
   await page.screenshot({path:out+'/stone-takeover-'+label+'.png'});
   await page.locator('#pause').click();
   await page.waitForTimeout(1800);
   const after=await page.evaluate(()=>({t:gameDebug.state.time,owner:gameDebug.state.cities.find(x=>x.id===gameDebug.state.stoneTestV174.targetCityId)?.team}));
   assert.ok(after.t>initial.time,label+' game continues on Play');
   assert.equal(after.owner,0,label+' still controls the city after unpausing');
   assert.deepEqual(errors,[],label+' after Play');
   result.push({label,pass:true,...initial,advancedSeconds:after.t-initial.time,pageErrors:errors});
   console.log('V174 BROWSER PASS '+label+' '+JSON.stringify({city:initial.city,turn:initial.turn,
      age:initial.age,meshes:initial.meshes,drawCalls:initial.perf.drawCalls,
      triangles:initial.perf.triangles,advancedSeconds:after.t-initial.time}));
  }catch(err){
   try{await page.screenshot({path:out+'/stone-takeover-'+label+'-FAILED.png'})}catch{}
   const message=String(err?.stack||err);
   result.push({label,pass:false,message,errors});
   console.error('V174 BROWSER FAIL '+label+' '+message);
  }finally{await ctx.close();}
 }
}finally{await browser.close();fs.writeFileSync(out+'/results.json',JSON.stringify(result,null,2));}
if(result.some(x=>!x.pass))process.exitCode=1;
