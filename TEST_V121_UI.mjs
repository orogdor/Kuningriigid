import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import fs from 'node:fs';
fs.mkdirSync('artifacts-v121',{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const sizes=[{width:390,height:844,mobile:true},{width:768,height:1024,mobile:false},{width:1366,height:768,mobile:false}];
try{
 for(const size of sizes){
  const page=await browser.newPage({viewport:{width:size.width,height:size.height},hasTouch:size.mobile,isMobile:size.mobile}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8765/?demo=stone&v=121',{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>window.gameDebug&&gameDebug.view()==='local',{timeout:120000});
  await page.evaluate(()=>{const d=gameDebug;d.openTile(d.game.cell(d.state.cities[0]));document.getElementById('hud-build').click()});
  await page.waitForSelector('.v121-build-card',{timeout:15000});
  const initial=await page.evaluate(()=>{
   const catalog=document.getElementById('tray'),cards=[...catalog.querySelectorAll('.v121-build-card')],panel=document.getElementById('citypanel');
   const r=el=>{const b=el.getBoundingClientRect();return {x:b.x,y:b.y,right:b.right,bottom:b.bottom,height:b.height,width:b.width}};
   return {count:cards.length,card:cards[0].innerText,cardRects:cards.map(r),tray:r(catalog),panel:r(panel),scrollWidth:catalog.scrollWidth,clientWidth:catalog.clientWidth,search:r(document.getElementById('buildsearch')),categories:r(document.getElementById('buildcategories')),queueClosed:!document.getElementById('buildqueuefolder').open,language:document.documentElement.lang,searchable:!!document.getElementById('buildsearch'),viewport:[innerWidth,innerHeight]};
  });
  console.log('V121 BUILD',JSON.stringify({viewport:size,initial}));
  assert.equal(initial.language,'en');
  assert.ok(initial.count>=2,'Building list has multiple items');
  assert.ok(initial.scrollWidth<=initial.clientWidth+2,'Building list never scrolls sideways');
  assert.ok(initial.tray.height>=95,'Building list has room to scroll');
  assert.ok(initial.panel.x>=-2&&initial.panel.right<=size.width+2);
  assert.ok(initial.tray.y>=initial.search.bottom&&initial.tray.bottom<=initial.panel.bottom+2,'Building list is below filters and inside panel');
  assert.ok(initial.cardRects.every(r=>r.x>=initial.tray.x-2&&r.right<=initial.tray.right+2&&r.height>=75),'Building cards are full width and visible');
  for(let i=1;i<initial.cardRects.length;i++)assert.ok(initial.cardRects[i-1].bottom<=initial.cardRects[i].y+2,'Building cards overlap vertically at index '+i);
  assert.equal(initial.queueClosed,true);
  await page.screenshot({path:'artifacts-v121/construction-'+size.width+'x'+size.height+'.png',timeout:120000});
  const originalCount=await page.locator('.v121-build-card').count();
  const first=await page.locator('.v121-card-name').first().innerText();
  await page.locator('#buildsearch').fill(first.slice(0,Math.min(5,first.length)));
  assert.ok((await page.locator('.v121-build-card').count())>=1,'Search preserves matching buildings');
  await page.locator('#buildsearch').fill('xxxxxxxxnomatch');
  assert.ok(await page.locator('.v121-build-empty').isVisible(),'Empty search has feedback');
  await page.locator('#buildsearch').fill('');
  assert.equal(await page.locator('.v121-build-card').count(),originalCount);
  await page.locator('#buildqueuefolder>summary').click();
  assert.equal(await page.locator('#buildqueuefolder').evaluate(el=>el.open),true,'Queue can expand');
  await page.locator('#buildqueuefolder>summary').click();
  await page.screenshot({path:'artifacts-v121/construction-after-filter-'+size.width+'.png',timeout:120000});
  assert.deepEqual(errors,[],'No browser exceptions');
  if(size.width===1366){
   // Directly click the visible world tile. First click selects, second opens details.
   await page.evaluate(()=>gameDebug.openWorld());
   await page.waitForTimeout(900);
   const p=await page.evaluate(async()=>{
    const d=gameDebug,cell=d.game.cell(d.state.cities.find(c=>c.team===0));
    const {Vector3}=await import('./vendor/three.module.js');
    d.camera.updateMatrixWorld(true);
    const pt=new Vector3(cell.x,0,cell.z).project(d.camera);
    return {x:Math.round((pt.x+1)*innerWidth/2),y:Math.round((1-pt.y)*innerHeight/2),ndc:{x:pt.x,y:pt.y},seen:d.game.seen(0,cell),cell:[cell.c,cell.r]};
   });
   console.log('V121_WORLD_TARGET',JSON.stringify(p));
   await page.mouse.click(p.x,p.y);
   assert.equal(await page.evaluate(()=>gameDebug.view()),'world','Single world click only selects');
   await page.waitForTimeout(700);
   await page.mouse.dblclick(p.x,p.y,{delay:55});
   const navState=await page.evaluate(()=>({view:gameDebug.view(),atlas:document.getElementById('atlasdetail')?.textContent,toast:document.getElementById('toast')?.textContent,menu:document.getElementById('startmenu')?.hidden,selected:gameDebug.currentSelection()?.name}));
   console.log('V121_WORLD_AFTER_DOUBLE',JSON.stringify(navState));
   assert.equal(navState.view,'local','Double-click opens detail');
   await page.mouse.move(p.x,p.y);
   await page.mouse.wheel(0,4400);
   assert.equal(await page.evaluate(()=>gameDebug.view()),'world','Deep wheel zoom exits detail to world map');
   console.log('V121 NAV PASS: single selects, double-click opens, deep wheel exits.');
  }
  await page.close();
 }
 console.log('V121 UI PASS: English building catalogue, 3 layouts, filtering, collapsible queue and map gestures');
}finally{await browser.close()}
