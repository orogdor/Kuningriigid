import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdirSync} from 'node:fs';
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined,
 args:['--no-sandbox','--disable-dev-shm-usage','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const errors=[],network=[];mkdirSync('ui-screenshots-v76',{recursive:true});
async function scenario(label,width,height,isMobile){
 const ctx=await browser.newContext({viewport:{width,height},isMobile,hasTouch:isMobile,deviceScaleFactor:1});
 const page=await ctx.newPage();
 page.on('pageerror',error=>errors.push(label+': '+error.message));
 page.on('response',r=>{if(r.status()>=400)network.push(label+': '+r.status()+' '+r.url())});
 try{
  await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>!!window.gameDebug,{timeout:90000});
  await page.locator('#continue').click();
  await page.waitForFunction(()=>document.getElementById('startmenu').hidden,{timeout:15000});
  const result=await page.evaluate(()=>{
   const dbg=window.gameDebug,g=dbg.game,v=dbg.state.landmarks.find(l=>l.kind==='village');
   g.reveal(0,v,1);dbg.openTile(g.cell(v));
   return {c:v.c,r:v.r,id:'landmark:'+v.id,version:dbg.state.version};
  });
  assert.equal(result.version,4,'V76 still loads V4 game state');
  await page.waitForFunction(id=>window.gameDebug.villageLifeStatus().some(s=>s.id===id&&s.activities.some(a=>a!=='home')),result.id,{timeout:30000});
  const first=await page.evaluate(()=>window.gameDebug.villageLifeStatus().find(s=>s.id.startsWith('landmark:village-')));
  const profile=await page.evaluate(()=>window.gameDebug.quality());
  assert.equal(first.actorCount,profile==='low'?4:profile==='high'?9:6,'quality budget sets count');
  assert.ok(first.roles.includes('child')&&first.roles.includes('guard'),'children and guards are rendered, not only workers');
  assert.ok(first.activities.some(a=>['chat','visit','carry','rest','eat','play','stroll'].includes(a)),'life has non-work activities');
  await page.screenshot({path:'ui-screenshots-v76/'+label+'-village.png'});
  const atEvening=await page.evaluate(()=>{
   window.gameDebug.state.time=660;
   return new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve(window.gameDebug.villageLifeStatus()[0]))));
  });
  assert.equal(atEvening.campVisible,true,'fire lit in evening');
  assert.ok(atEvening.activities.includes('chat'),'evening conversations');
  await page.screenshot({path:'ui-screenshots-v76/'+label+'-evening.png'});
  const atNight=await page.evaluate(()=>{
   window.gameDebug.state.time=900;
   return new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve(window.gameDebug.villageLifeStatus()[0]))));
  });
  assert.ok(atNight.activities.includes('sleep'),'NPCs have overnight home/sleep state');
  assert.ok(atNight.activities.includes('guard'),'guard remains active at night');
  assert.equal(atNight.campVisible,true,'night fire remains lit');
  const atDay=await page.evaluate(()=>{
   window.gameDebug.state.time=190;
   return new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve(window.gameDebug.villageLifeStatus()[0]))));
  });
  assert.equal(atDay.campVisible,false,'fire is not continuously burning all day');
  assert.ok(atDay.activities.includes('play'),'child returns to play during day');
  const chosen=await page.evaluate(async()=>{
   const dbg=window.gameDebug,btn=document.getElementById('quality'),counts={};
   for(let i=0;i<3;i++){
    btn.click();
    await new Promise(resolve=>requestAnimationFrame(()=>resolve()));
    counts[dbg.quality()]=dbg.villageLifeStatus().find(s=>s.id.startsWith('landmark:village-'))?.actorCount||0;
   }
   return counts;
  });
  // One complete cycle includes all three quality presets (some frames may take long in software GL).
  for(const [k,n] of Object.entries({low:4,medium:6,high:9}))if(k in chosen)assert.equal(chosen[k],n,k+' count cap');
  assert.equal(await page.evaluate(()=>document.querySelectorAll('canvas#world').length),1,'original UI/canvas unchanged');
  console.log('V76 BROWSER',label,JSON.stringify({first,atEvening,atNight,atDay,chosen,profile}));
  return {first,atEvening,atNight,chosen};
 }finally{await ctx.close()}
}
try{
 await scenario('phone-portrait',390,844,true);
 await scenario('phone-landscape',844,390,true);
 await scenario('desktop',1440,900,false);
 assert.deepEqual(errors,[],'no uncaught browser exceptions');
 assert.deepEqual(network,[],'no missing models/modules');
 console.log('V76 BROWSER PASS: social NPCs, daily schedule, evening fire, children, nighttime guards, mobile/desktop and no failed loads');
}finally{await browser.close()}
