import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdirSync} from 'node:fs';
const base='http://127.0.0.1:8765/';
const chromiumPath=process.env.CHROME_PATH||undefined;
const browser=await chromium.launch({headless:true,executablePath:chromiumPath,args:['--no-sandbox','--disable-dev-shm-usage','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
const exceptions=[];
page.on('pageerror',e=>exceptions.push(e.message));
page.on('console',m=>{if(m.type()==='error'&&!m.text().includes('WebGL'))exceptions.push(m.text())});
try{
 await page.goto(base,{waitUntil:'domcontentloaded',timeout:30000});
 await page.waitForFunction(()=>!!window.gameDebug,{timeout:90000});
 await page.locator('#continue').click();
 await page.waitForFunction(()=>document.body.classList.contains('atlas')&&document.getElementById('startmenu').hidden,{timeout:30000});
 const layouts=[
  {label:'desktop-1440',width:1440,height:900},
  {label:'desktop-1024',width:1024,height:768},
  {label:'tablet-800',width:800,height:600},
  {label:'phone-landscape-844',width:844,height:390},
  {label:'phone-landscape-667',width:667,height:375},
  {label:'phone-portrait-390',width:390,height:844}
 ];
 mkdirSync('ui-screenshots-v69',{recursive:true});
 for(const layout of layouts){
  await page.setViewportSize({width:layout.width,height:layout.height});
  await page.waitForTimeout(450);
  const info=await page.evaluate(()=>{
   const ids=['world','resources','turn','pause','tools','commandhud','atlasoverview','v51insights','atlaspanel','startmenu'];
   const r={};
   for(const id of ids){
    const n=document.getElementById(id);const a=n.getBoundingClientRect();const st=getComputedStyle(n);
    r[id]={x:a.x,y:a.y,w:a.width,h:a.height,visible:st.display!=='none'&&st.visibility!=='hidden'&&a.width>0&&a.height>0&&!n.hidden};
   }
   const overlap=(a,b)=>a.visible&&b.visible&&Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x)>3&&Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y)>3;
   const conflicts=[['tools','commandhud'],['atlasoverview','v51insights'],['atlasoverview','commandhud'],['v51insights','commandhud'],['resources','pause']].filter(([a,b])=>overlap(r[a],r[b]));
   const offscreen=['tools','commandhud','atlasoverview','v51insights'].filter(x=>r[x].visible&&(r[x].x < -3||r[x].y < -3||r[x].x+r[x].w>innerWidth+3||r[x].y+r[x].h>innerHeight+3));
   const nav=[...document.querySelectorAll('#tools button')].filter(n=>getComputedStyle(n).display!=='none');
   const hiddenTitle=document.querySelector('header .brand')?.textContent?.includes('KUNINGRIIGID');
   return {viewport:[innerWidth,innerHeight],r,conflicts,offscreen,navCount:nav.length,hiddenTitle,navOverflow:document.getElementById('tools').scrollWidth>document.getElementById('tools').clientWidth};
  });
  console.log('V69 VIEW',layout.label,JSON.stringify({viewport:info.viewport,conflicts:info.conflicts,offscreen:info.offscreen,navCount:info.navCount,navOverflow:info.navOverflow}));
  assert.equal(info.hiddenTitle,false,'title visible in HUD');
  assert.ok(info.navCount>=6,'major navigation present');
  assert.deepEqual(info.conflicts,[],'HUD collision at '+layout.label);
  assert.deepEqual(info.offscreen,[],'HUD panel cut off at '+layout.label);
  assert.ok(info.r.world.w>=layout.width-3&&info.r.world.h>=layout.height-3,'canvas covers viewport');
  await page.screenshot({path:'ui-screenshots-v69/'+layout.label+'.png'});
 }
 await page.setViewportSize({width:844,height:390});
 await page.locator('#hud-map-details').click();
 assert.equal(await page.locator('body').evaluate(n=>n.classList.contains('hud-map-open')),true,'map drawer opens');
 await page.locator('#hud-close-map').click();
 assert.equal(await page.locator('body').evaluate(n=>n.classList.contains('hud-map-open')),false,'map drawer closes');
 await page.locator('#techtoggle').click();
 assert.equal(await page.locator('#researchpanel').isVisible(),true,'research opens');
 await page.locator('#closeresearch').click();
 assert.equal(await page.locator('#researchpanel').isVisible(),false,'research closes');
 assert.deepEqual(exceptions,[],'browser errors');
 console.log('V69 UI PASS: six desktop/tablet/phone layouts, map/research controls and clean browser runtime');
}finally{await browser.close();}
