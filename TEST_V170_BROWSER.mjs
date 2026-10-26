// V170 stage 3.1d: real browser/WebGL model and mobile UI smoke checks.
// Run with python3 -m http.server 8765 & and node TEST_V170_BROWSER.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';
const out='artifacts-v170';
fs.mkdirSync(out,{recursive:true});
const reports=[];
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined,
 args:['--no-sandbox','--disable-dev-shm-usage','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 for(const {label,demo,viewport,mobile} of [
  {label:'stone-desktop',demo:'stone',viewport:{width:1280,height:800},mobile:false},
  {label:'stone-mobile',demo:'stone',viewport:{width:390,height:844},mobile:true},
  {label:'ai-town-desktop',demo:'ai-city-v139',viewport:{width:1280,height:800},mobile:false},
  {label:'ai-town-mobile',demo:'ai-city-v139',viewport:{width:390,height:844},mobile:true},
 ]){
  const ctx=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile,deviceScaleFactor:mobile?2:1});
  await ctx.addInitScript(()=>{localStorage.setItem('kingdoms-quality','low');localStorage.setItem('kingdoms-civ4','v170-original-player-save');localStorage.setItem('kingdoms-civ4-backup','v170-original-backup');});
  const page=await ctx.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(String(error?.stack||error)));
  try{
   await page.goto('http://127.0.0.1:8765/?demo='+demo+'&v=170d',{waitUntil:'domcontentloaded',timeout:90000});
   await page.waitForFunction(()=>window.gameDebug&&document.getElementById('menu-status')?.hidden,{timeout:90000});
   await page.waitForTimeout(1600);
   const m=await page.evaluate(()=>{
    const d=window.gameDebug,p=d.perfStats(),view=d.view();
    const names={},variations=new Set();let meshes=0,vertices=0;
    d.localScene.traverse(o=>{
      if(o.isMesh){meshes++;vertices+=o.geometry?.attributes?.position?.count||0;}
      const kind=o.userData?.buildingType;
      if(kind)names[kind]=(names[kind]||0)+1;
      const key=o.userData?.townModelV154;
      if(key)variations.add(key);
    });
    const cv=document.getElementById('world'),tools=document.getElementById('tools');
    const br=tools?.getBoundingClientRect(),cr=cv.getBoundingClientRect();
    return {view,meshes,vertices,types:names,modelVariants:variations.size,perf:p,
      canvas:{width:cv.width,height:cv.height,rect:[cr.width,cr.height]},
      ui:{toolsWidth:br?.width||0,toolsHeight:br?.height||0,viewportWidth:innerWidth,viewportHeight:innerHeight},
      save:localStorage.getItem('kingdoms-civ4'),backup:localStorage.getItem('kingdoms-civ4-backup'),
      gameVersion:document.title};
   });
   assert.equal(m.view,'local',label+' must show real detail map');
   assert.ok(m.meshes>15,label+' must produce scene meshes');
   assert.ok(m.perf.drawCalls>0&&m.perf.triangles>0,label+' must render with WebGL');
   assert.ok(m.canvas.width>0&&m.canvas.height>0,label+' canvas has backing buffer');
   assert.ok(m.ui.toolsHeight < m.ui.viewportHeight*.57,label+' navigation cannot cover most of ground');
   assert.ok(m.modelVariants>=3,label+' real detailed models should be visible');
   assert.equal(m.save,'v170-original-player-save','sample cannot overwrite real save');
   assert.equal(m.backup,'v170-original-backup','sample cannot overwrite backup');
   assert.deepEqual(errors,[],label+' must have zero browser exceptions');
   await page.screenshot({path:out+'/'+label+'.png',fullPage:false,animations:'disabled'});
   reports.push({label,pass:true,...m,pageErrors:errors});
   console.log('V170 BROWSER PASS '+label+' '+JSON.stringify({view:m.view,meshes:m.meshes,drawCalls:m.perf.drawCalls,triangles:m.perf.triangles,modelVariants:m.modelVariants,ui:m.ui}));
  }catch(e){
   const snap=out+'/'+label+'-failure.png';
   try{await page.screenshot({path:snap,fullPage:false})}catch{}
   reports.push({label,pass:false,error:String(e?.stack||e),pageErrors:errors});
   console.error('V170 BROWSER FAIL '+label, String(e?.stack||e));
  }finally{await ctx.close();}
 }
}finally{await browser.close();fs.writeFileSync(out+'/results.json',JSON.stringify(reports,null,2));}
if(reports.some(x=>!x.pass))process.exitCode=1;
