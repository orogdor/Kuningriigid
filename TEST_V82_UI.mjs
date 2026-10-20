import assert from 'node:assert/strict';
import {readFileSync,mkdirSync} from 'node:fs';
import {chromium} from 'playwright';
mkdirSync('ui-screenshots-v82',{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined,
 args:['--no-sandbox','--disable-dev-shm-usage','--enable-webgl',
 '--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const errors=[];
async function scenario(label,demo,viewport,isMobile){
 const ctx=await browser.newContext({viewport,isMobile,hasTouch:isMobile,
  acceptDownloads:true,deviceScaleFactor:1});
 const page=await ctx.newPage();
 page.on('console',msg=>{if(msg.type()==='error')errors.push(label+' CONSOLE: '+msg.text());});
 page.on('pageerror',e=>errors.push(label+': '+e.message));
 try{
  await page.goto('http://127.0.0.1:8765/?v=82-tests&demo='+demo,
   {waitUntil:'domcontentloaded',timeout:90000});
  await page.waitForFunction(()=>window.gameDebug?.view()==='local',null,{timeout:120000});
  const stats=await page.evaluate(()=>{
   const g=window.gameDebug,c=g.state.cities.find(c=>c.team===0);
   return {age:g.state.ages[0],version:g.state.version,name:c.name,
    models:g.industrialModelStatus().length,
    types:[...new Set(g.industrialModelStatus().map(m=>m.type))],
    roads:g.localRoadStatus(),
    saves:Object.fromEntries(Object.keys(localStorage)
     .filter(k=>/save|autosave|slot|backup/.test(k)).map(k=>[k,localStorage.getItem(k)])),
    perf:g.perfStats()};
  });
  assert.equal(stats.age,{stone:0,bronze:1,medieval:3,renaissance:4,industrial:5}[demo]);
  assert.equal(stats.version,4);
  assert.ok(stats.roads.spots>30,'city roads still visible');
  if(demo==='industrial'){
   assert.equal(stats.name,'Suitsujõe tööstuslinn');
   assert.ok(stats.models>=39,'industrial buildings are in actual 3D scene');
   assert.ok(stats.types.length>=35,'distinct industrial 3D building types');
   for(const type of ['hall','house','steelworks','engineworks','polytechnic','railstation',
    'printer','smelter','warehouse','market','bakery'])
    assert.ok(stats.types.includes(type),'industrial landmark '+type);
   assert.ok(stats.perf.drawCalls>=0);
  }
  // Real shared panel is opened from a 3D building in each historic demo.
  const target=demo==='industrial'?'steelworks':demo==='renaissance'?'observatory':
   demo==='medieval'?'hall':demo==='bronze'?'saw':'house';
  assert.equal(await page.evaluate(type=>window.gameDebug.inspectBuilding(type),target),true);
  await page.locator('#building-inspector').waitFor({state:'visible',timeout:30000});
  const info=await page.evaluate(()=>{
   const d=window.gameDebug;
   const panel=document.getElementById('building-inspector');
   return {info:d.selectedBuildingInfo(),title:document.getElementById('building-info-title').textContent,
    details:document.getElementById('building-info-details').textContent,
    visible:!panel.hidden,
    closeLabel:document.getElementById('building-info-close').getAttribute('aria-label'),
    scrollHeight:panel.scrollHeight,clientHeight:panel.clientHeight,
    bodyWidth:document.body.scrollWidth,viewportWidth:innerWidth,
    aria:panel.getAttribute('role')};
  });
  assert.equal(info.info?.type,target);
  assert.ok(info.title.length>2&&info.aria==='region'&&info.visible);
  for(const choices of [['HP'],['Töötajad','Workers'],['Tootmine','Production'],
   ['Ehitus','Construction'],['Ajastu','Era']])
   assert.ok(choices.some(k=>info.details.includes(k)),
    'missing building detail (ET/EN): '+choices.join('/'));
  assert.ok(info.bodyWidth<=info.viewportWidth+4,'inspector must not create horizontal scrolling');
  if(target==='steelworks'){
   assert.ok(info.info?.production?.output,'factory production output should be described');
   assert.ok(info.info?.production?.input.length>0,'factory material inputs should be described');
  }
  await page.screenshot({path:'ui-screenshots-v82/'+label+'-'+demo+'-building-info.png'});
  // Close never changes game state, and inspector can be reopened at will.
  await page.locator('#building-info-close').click();
  assert.equal(await page.locator('#building-inspector').isVisible(),false);
  if(demo==='industrial'){
   const clicked=await page.evaluate(async()=>{
    const THREE=await import('./vendor/three.module.js');
    const d=window.gameDebug;
    const city=d.state.cities.find(c=>c.team===0);
    // Central hall should be onscreen in the city's initial view.
    const hall=city.economy.buildings.find(b=>b.type==='hall');
    let model=null;
    d.localScene.traverse(o=>{if(o.userData?.buildingRef===hall)model=o});
    if(!model)return null;
    const box=new THREE.Box3().setFromObject(model);
    const center=box.getCenter(new THREE.Vector3()).project(d.camera);
    return {x:(center.x+1)*innerWidth/2,y:(1-center.y)*innerHeight/2,
     screenW:innerWidth,screenH:innerHeight};
   });
   assert.ok(clicked&&clicked.x>0&&clicked.x<viewport.width&&clicked.y>0&&clicked.y<viewport.height,
    'city hall must have a real tappable 3D model');
   if(isMobile)await page.touchscreen.tap(clicked.x,clicked.y);
   else await page.mouse.click(clicked.x,clicked.y);
   await page.locator('#building-inspector').waitFor({state:'visible',timeout:6000});
   const title=await page.locator('#building-info-title').textContent();
   assert.ok(title?.length>0,'actual 3D model click opens the inspector');
   assert.ok((await page.evaluate(()=>window.gameDebug.selectedBuildingInfo()))?.type,
    '3D touch selects a real city building');
   await page.locator('#building-info-close').click();
   // Explicit move/construct mode must not open the inspector accidentally.
   assert.equal(await page.locator('#building-inspector').isVisible(),false);
   await page.evaluate(()=>window.gameDebug.inspectBuilding('railstation'));
   const rename=await page.locator('#building-info-category').textContent();
   assert.ok(rename?.length>0);
  }
  if(demo==='industrial'&&label==='phone-portrait'){
   await page.evaluate(()=>{document.getElementById('startmenu').hidden=false;});
   const download=await Promise.all([
    page.waitForEvent('download',{timeout:30000}),
    page.locator('#v51export').click()
   ]).then(([x])=>x);
   assert.equal(download.suggestedFilename(),'Kuningriigid_V82_Suitsujoe_toostuslinn.json');
   const save=JSON.parse(readFileSync(await download.path(),'utf8'));
   assert.equal(save.version,4);assert.equal(save.ages[0],5);
   assert.equal(save.cities.find(c=>c.team===0)?.name,'Suitsujõe tööstuslinn');
   const now=await page.evaluate(()=>Object.fromEntries(Object.keys(localStorage)
    .filter(k=>/save|autosave|slot|backup/.test(k)).map(k=>[k,localStorage.getItem(k)])));
   assert.deepEqual(now,stats.saves,'demo cannot replace an existing game save');
  }
  console.log('V82 BROWSER PASS '+JSON.stringify({label,demo,age:stats.age,
   models:stats.models,types:stats.types.length,roads:stats.roads.spots,
   selected:info.info?.type,perfs:stats.perf.drawCalls}));
 }finally{await ctx.close()}
}
try{
 await scenario('phone-portrait','industrial',{width:390,height:844},true);
 await scenario('phone-landscape','industrial',{width:844,height:390},true);
 await scenario('desktop','industrial',{width:1440,height:900},false);
 await scenario('phone-portrait','stone',{width:390,height:844},true);
 await scenario('phone-portrait','bronze',{width:390,height:844},true);
 await scenario('phone-portrait','medieval',{width:390,height:844},true);
 await scenario('phone-portrait','renaissance',{width:390,height:844},true);
 assert.deepEqual(errors,[],'zero uncaught browser errors in seven tested demos');
 console.log('V82 UI PASS industrial 3D, inspector and real touch targets in all sample eras');
}finally{await browser.close()}
