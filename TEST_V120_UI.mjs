import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';
fs.mkdirSync('artifacts-v120',{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const viewports=[{width:360,height:640},{width:390,height:844},{width:768,height:1024},{width:1366,height:768}];
try{
 for(const viewport of viewports){
  const page=await browser.newPage({viewport}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8765/?demo=bronze-patrol&v=120',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>!!window.gameDebug,{timeout:120000});
  const status=await page.evaluate(()=>{
   const d=gameDebug;
   d.openResearch();
   return {lang:document.documentElement.lang,title:document.title,language:d.currentLanguage()};
  });
  assert.equal(status.lang,'en','The document must be in English');
  assert.equal(status.language,'en','The game must be in English');
  assert.match(status.title,/Kingdoms V120/);
  await page.waitForSelector('#researchtree .tech-card',{timeout:15000});
  const result=await page.evaluate(()=>{
   const rect=id=>{const r=document.querySelector(id)?.getBoundingClientRect();return r?{x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom}:null};
   const tree=document.querySelector('#researchtree'),nodeList=[...tree.querySelectorAll('.tech-card')],panel=document.querySelector('#researchpanel'),viewer=document.querySelector('.tech-map-viewport'),inspector=document.querySelector('.tech-inspector'),win=document.querySelector('.research-window');
   const intro=document.querySelector('#researchpanel .research-heading')?.innerText||'';
   const visibleText=[...document.querySelectorAll('#researchpanel,#toast,#tools,#resources,#citypanel,#commandhud,#atlaspanel,#v51insights')].filter(e=>e.getBoundingClientRect().width>0&&e.getBoundingClientRect().height>0).map(e=>e.innerText||'').join('\n');
   const suspicious=visibleText.split('\n').filter(s=>/[õäöü]/i.test(s)).slice(0,25);
   return {win:rect('.research-window'),panel:rect('#researchpanel'),viewer:rect('.tech-map-viewport'),inspector:rect('.tech-inspector'),heading:rect('#researchpanel .research-heading'),controls:rect('.tech-tree-controls'),ages:rect('.tech-ages'),legend:rect('.tech-legend'),close:rect('#closeresearch'),nodeCount:nodeList.length,hiddenNodes:nodeList.filter(e=>e.classList.contains('locked')).length,selectedNode:document.querySelector('.tech-card.is-selected')?.innerText||'',intro,suspicious,viewport:{width:innerWidth,height:innerHeight},overflow:document.documentElement.scrollWidth>innerWidth+2,guideOpen:document.querySelector('.research-guide')?.open};
  });
  console.log('V120_GEOMETRY',JSON.stringify({viewport,win:result.win,viewer:result.viewer,inspector:result.inspector,ages:result.ages,controls:result.controls,legend:result.legend,suspicious:result.suspicious}));
  assert.ok(result.nodeCount>0,'Technology nodes must render');
  assert.equal(result.hiddenNodes,0,'Future locked nodes must stay hidden');
  assert.match(result.intro,/Technology Tree/);
  assert.equal(result.guideOpen,false,'Long help must be collapsed by default');
  assert.ok(result.viewer.height>=115,'Tree viewport has to remain usable');
  assert.ok(result.close.right<=viewport.width+2&&result.close.y>=0,'Close control must remain in viewport');
  assert.ok(result.viewer.y>=result.inspector.bottom-1,'Map must not overlap details');
  assert.ok(result.viewer.bottom<=result.win.bottom+2,'Map must not escape window');
  assert.ok(result.win.x>=0&&result.win.right<=viewport.width+2,'Research window must fit viewport width');
  assert.ok(!result.overflow,'No horizontal document overflow');
  assert.deepEqual(result.suspicious,[],'Visible interface must not have Estonian accents');
  await page.screenshot({path:'artifacts-v120/research-'+viewport.width+'x'+viewport.height+'.png',timeout:120000});
  await page.locator('.tech-card').first().click();
  const shown=await page.locator('.tech-info-name').innerText();
  assert.ok(shown&&!/[õäöü]/i.test(shown),'Inspector title in English');
  await page.locator('#closeresearch').click();
  assert.equal(await page.locator('#researchpanel').isVisible(),false,'Research panel closes');
  await page.screenshot({path:'artifacts-v120/hud-'+viewport.width+'x'+viewport.height+'.png',timeout:120000});
  assert.deepEqual(errors,[],'No browser errors');
  console.log('V120 UI',JSON.stringify({viewport,lang:status.language,notes:result,errors}));
  await page.close();
 }
 console.log('V120 UI PASS: research window, mobile + desktop layout, English text, hidden techs, controls, close button.');
}finally{await browser.close()}
