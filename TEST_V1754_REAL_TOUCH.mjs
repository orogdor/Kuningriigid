// V175.4: an actual mobile touch and desktop pointer must spend resources
// and create a REAL palisade, not merely a green line preview.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';
const out='artifacts-v1754';
fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined,
 args:['--no-sandbox','--disable-dev-shm-usage','--enable-webgl','--use-gl=angle',
 '--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const results=[];
const tapDrag=async(page,from,to,mobile)=>{
 const points=[from,{x:(from.x+to.x)/2,y:(from.y+to.y)/2},to];
 if(mobile){
  const client=await page.context().newCDPSession(page);
  try {
   await client.send('Input.dispatchTouchEvent',{type:'touchStart',
    touchPoints:[{x:from.x,y:from.y,id:3,force:.9}]});
   for(let i=1;i<points.length;i++){
    const a=points[i-1],b=points[i];
    for(let step=1;step<=5;step++){
     await client.send('Input.dispatchTouchEvent',{type:'touchMove',
      touchPoints:[{x:a.x+(b.x-a.x)*step/5,y:a.y+(b.y-a.y)*step/5,id:3,force:.9}]});
     await page.waitForTimeout(35);
    }
   }
   await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  }finally{await client.detach();}
 }else{
  await page.mouse.move(from.x,from.y);
  await page.mouse.down();
  for(const p of points.slice(1))await page.mouse.move(p.x,p.y,{steps:5});
  await page.mouse.up();
 }
};
try{
 for(const [label,viewport,mobile] of [
  ['desktop',{width:1280,height:800},false],
  ['mobile',{width:390,height:844},true]]){
  const ctx=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile,deviceScaleFactor:mobile?2:1});
  await ctx.addInitScript(()=>{
   localStorage.setItem('kingdoms-quality','low');
   localStorage.setItem('kingdoms-civ4','v1754-original-save');
   localStorage.setItem('kingdoms-civ4-backup','v1754-original-backup');
  });
  const page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  try{
   await page.goto('http://127.0.0.1:8765/?demo=ai-stone-v174&v=1754',
    {waitUntil:'domcontentloaded',timeout:120000});
   await page.waitForFunction(()=>window.gameDebug&&document.getElementById('startmenu')?.hidden,
    {timeout:120000});
   await page.waitForTimeout(700);
   await page.evaluate(()=>document.querySelector('#tray button[data-building="palisade"]').click());
   assert.equal(await page.evaluate(()=>gameDebug.wallDrawStatus().mode),'palisade');
   // Physically validate the actual in-game previewBuild rule. This avoids
   // falsely blaming touch controls for drawing in a busy/occupied square.
   const candidate=await page.evaluate(async()=>{
    const debug=gameDebug,city=debug.activeCity(),game=debug.game;
    const {wallStrokePlanV175}=await import('./wall-draw-v175.js?v=1754a');
    const pickable=[],width=innerWidth,height=innerHeight;
    for(let y=Math.floor(height*.27);y<height*.83;y+=Math.max(14,Math.floor(height*.035)))
     for(let x=Math.floor(width*.09);x<width*.89;x+=Math.max(13,Math.floor(width*.035))){
      const p=debug.pick({clientX:x,clientY:y});
      if(p&&Number.isFinite(p.x)&&Number.isFinite(p.z)&&Math.abs(p.x)<100&&Math.abs(p.z)<90)
       pickable.push({sx:x,sy:y,x:p.x,z:p.z});
     }
    let rejected={},attempts=0;
    for(let i=0;i<pickable.length;i++)for(let j=i+1;j<pickable.length;j++){
      const a=pickable[i],b=pickable[j],d=Math.hypot(a.x-b.x,a.z-b.z);
      if(d<3.5||d>6.25||Math.hypot(a.sx-b.sx,a.sy-b.sy)<20)continue;
      const plan=wallStrokePlanV175([{x:a.x,z:a.z},{x:b.x,z:b.z}],'straight');
      if(plan.error||plan.segments.length!==1)continue;
      attempts++;
      const p=plan.segments[0],rule=game.previewBuild(city,'palisade',p);
      if(rule.error){rejected[rule.error]=(rejected[rule.error]||0)+1;continue;}
      return {from:{x:a.sx,y:a.sy},to:{x:b.sx,y:b.sy},
        actual:{x:p.x,z:p.z,span:p.palisadeSpanV167},attempts,
        count:pickable.length,rejected,wood:game.constructionArea(city).stock.wood};
    }
    return {error:'No buildable pair of screen positions',attempts,count:pickable.length,rejected};
   });
   assert.ok(!candidate.error,label+': '+JSON.stringify(candidate));
   await page.locator('#v175-wall-toolbar .v175-wall-choices button').first().click();
   const before=await page.evaluate(()=>({
    count:gameDebug.activeCity().economy.buildings.filter(b=>b.drawnWallV175).length,
    wood:gameDebug.game.constructionArea(gameDebug.activeCity()).stock.wood,
    road:gameDebug.localRoadStatus().spots
   }));
   await tapDrag(page,candidate.from,candidate.to,mobile);
   await page.waitForTimeout(600);
   const after=await page.evaluate(()=>({
    count:gameDebug.activeCity().economy.buildings.filter(b=>b.drawnWallV175).length,
    walls:gameDebug.activeCity().economy.buildings.filter(b=>b.drawnWallV175)
      .map(b=>({x:b.x,z:b.z,angle:b.wallAngleV175,span:b.palisadeSpanV167,
       hp:b.hp,ready:b.ready})),
    wood:gameDebug.game.constructionArea(gameDebug.activeCity()).stock.wood,
    road:gameDebug.localRoadStatus().spots,
    drawing:gameDebug.wallDrawStatus(),
    save:localStorage.getItem('kingdoms-civ4'),
    backup:localStorage.getItem('kingdoms-civ4-backup')
   }));
   assert.ok(after.count>before.count,label+': a real paid palisade is built');
   assert.equal(after.drawing.lastBuild?.built,after.count-before.count,
    label+': construction feedback reflects actual created segments');
   assert.equal(after.drawing.lastBuild?.error,'',
    label+': builder reports no ignored placement failures');
   assert.ok(after.wood<before.wood,label+': paid resources deducted');
   assert.ok(after.walls.every(w=>Number.isFinite(w.angle)&&w.span>=3));
   assert.ok(after.road>0,'natural traffic paths remain');
   assert.equal(after.save,'v1754-original-save');
   assert.equal(after.backup,'v1754-original-backup');
   assert.deepEqual(errors,[],label+' JS errors');
   await page.screenshot({path:out+'/built-'+label+'.png'});
   results.push({label,pass:true,candidate,before,after});
   console.log('V175.4 REAL '+(mobile?'TOUCH':'MOUSE')+' BUILD PASS '+label+' '+JSON.stringify({
    walls:after.count,woodSpent:before.wood-after.wood,roadCells:after.road,attempts:candidate.attempts}));
  }catch(e){
   results.push({label,pass:false,error:String(e?.stack||e),errors});
   console.error('V175.4 REAL BUILD FAIL '+label+' '+String(e?.stack||e));
   try{await page.screenshot({path:out+'/FAILED-'+label+'.png'})}catch{}
  }finally{await ctx.close();}
 }
}finally{await browser.close();fs.writeFileSync(out+'/results.json',JSON.stringify(results,null,2));}
if(results.some(r=>!r.pass))process.exitCode=1;
