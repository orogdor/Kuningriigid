import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdirSync} from 'node:fs';
mkdirSync('artifacts-v82/screenshots',{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined,
 args:['--no-sandbox','--disable-dev-shm-usage','--enable-webgl','--use-gl=angle',
 '--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const errors=[];
async function scenario(era,width,height,isMobile,label){
 const ctx=await browser.newContext({viewport:{width,height},isMobile,hasTouch:isMobile,
  deviceScaleFactor:1,acceptDownloads:true});
 const page=await ctx.newPage();
 page.on('pageerror',e=>errors.push(label+': '+e.message));
 try{
  await page.goto('http://127.0.0.1:8765/?v=82-ci&demo='+era,
   {waitUntil:'domcontentloaded',timeout:80000});
  await page.waitForFunction(()=>window.gameDebug?.view()==='local',{timeout:110000});
  if(era!=='stone')await page.waitForFunction(()=>window.gameDebug?.localRoadStatus?.().spots>0,{timeout:35000});
  const overview=await page.evaluate(async()=>{
   const d=window.gameDebug,city=d.state.cities.find(c=>c.team===0);
   const nav=d.game.nav(city),all=city.economy.buildings;
   const actual=Object.keys(city.world.heat||{}).map(Number)
    .filter(i=>nav.roadLevel(i)>0&&nav.open(nav.point(i).x,nav.point(i).z)).length;
   return {age:d.state.ages[0],city:city.name,count:all.length,visibleRoads:actual,
    industrial:d.industrialModelStatus().length,models:d.industrialModelStatus(),
    info:d.buildingInfoStatus()};
  });
  const expAge={stone:0,bronze:1,medieval:3,renaissance:4,industrial:5}[era];
  assert.equal(overview.age,expAge);
  assert.ok(overview.count>=14);
  if(era!=='stone')assert.ok(overview.visibleRoads>=25,'roads pre-seeded for bronze and later cities');
  assert.equal(overview.info.open,false,'inspector starts closed');
  if(era==='industrial'){
   assert.ok(overview.industrial>=35,'every industrial demo building has a new 3D model');
   assert.ok(overview.models.some(m=>m.type==='steelworks')&&overview.models.some(m=>m.type==='railstation'),
    'flagship blast furnace and station displayed');
  }
  // Choose a mesh hit that lands in unobstructed canvas space. Raycast
  // independent Three.js against every *actual* building scene mesh.
  const location=await page.evaluate(async()=>{
   const T=await import('./vendor/three.module.js');
   const dbg=window.gameDebug,camera=dbg.camera;
   const roots=[];
   dbg.localScene.traverse(o=>{if(o.userData?.buildingRef)roots.push(o)});
   const ray=new T.Raycaster(),v=new T.Vector2(),center=new T.Vector3();
   const w=innerWidth,h=innerHeight;
   for(const root of roots){
    const bbox=new T.Box3().setFromObject(root);
    bbox.getCenter(center);center.project(camera);
    const x=(center.x+1)*w/2,y=(1-center.y)*h/2;
    if(!Number.isFinite(x)||!Number.isFinite(y)||x<w*.2||x>w*.93||y<h*.22||y>h*.76)continue;
    v.set(x/w*2-1,1-y/h*2);ray.setFromCamera(v,camera);
    const hits=ray.intersectObjects(roots,true);
    let hitRoot=hits[0]?.object;
    while(hitRoot&&!hitRoot.userData?.buildingRef)hitRoot=hitRoot.parent;
    if(hitRoot===root)return {x,y,type:root.userData.buildingRef.type,
     count:roots.length,buildAge:root.userData.buildingAge};
   }
   return null;
  });
  assert.ok(location,'at least one visible building can be picked by a real camera ray: '+era);
  if(isMobile)await page.touchscreen.tap(location.x,location.y);
  else await page.mouse.click(location.x,location.y);
  await page.waitForFunction(expected=>window.gameDebug?.buildingInfoStatus()?.type===expected,
   location.type,{timeout:15000});
  const selected=await page.evaluate(()=>{
   const b=window.gameDebug.buildingInfoStatus(),node=document.getElementById('building-inspector');
   const rect=node.getBoundingClientRect();
   return {type:b.type,open:b.open,status:b.data?.status,age:b.data?.age,
    inputs:node.textContent,role:node.getAttribute('role'),title:node.querySelector('h3')?.textContent,visible:getComputedStyle(node).display!=='none',
    box:{x:rect.x,y:rect.y,width:rect.width,height:rect.height},window:{w:innerWidth,h:innerHeight}};
  });
  assert.equal(selected.type,location.type);
  assert.ok(selected.open,'tapping roof opens inspector');
  console.log('V82 INSPECT TAP '+label+' '+JSON.stringify({selected,location}));
  assert.ok(selected.visible&&selected.title.length>3&&/(Töölised|Workers)/.test(selected.inputs));
  assert.ok(/(Toodang|Production)/.test(selected.inputs)&&/(Seisukord|Condition|Health)/.test(selected.inputs));
  assert.ok(selected.box.width<width+2&&selected.box.height<height+2);
  assert.ok(selected.box.x>=0&&selected.box.y>=0);
  await page.screenshot({path:'artifacts-v82/screenshots/'+label+'-selected.png'});
  await page.locator('#building-inspector .binfo-close').click();
  assert.equal(await page.evaluate(()=>window.gameDebug.buildingInfoStatus().open),false);
  if(era==='industrial'){
   assert.ok(await page.evaluate(()=>window.gameDebug.selectBuildingType('steelworks')));
   await page.waitForFunction(()=>window.gameDebug.buildingInfoStatus().type==='steelworks');
   const before=await page.evaluate(()=>window.gameDebug.buildingInfoStatus().data.disabled);
   const toggle=page.locator('#building-inspector .binfo-actions button').nth(1);
   await toggle.click();
   const after=await page.evaluate(()=>window.gameDebug.buildingInfoStatus().data.disabled);
   assert.notEqual(after,before,'real building pause/resume controls must work');
   // The real workflow closes the selected house card, opens the pause menu
   // through its button, and exports there. Manually unhiding startmenu did
   // not update menuOpen, leaving the canvas input layer active on mobile.
   await page.locator('#building-inspector .binfo-close').click();
   await page.evaluate(()=>document.getElementById('menubtn').click());
   await page.waitForFunction(()=>!document.getElementById('startmenu').hidden);
   const download=await Promise.all([
    page.waitForEvent('download',{timeout:30000}),
    page.locator('#v51export').click()
   ]).then(items=>items[0]);
   assert.equal(download.suggestedFilename(),'Kuningriigid_V82_Aurulinn.json');
  }
  console.log('V82 BROWSER PASS '+label+' '+JSON.stringify({
   age:overview.age,count:overview.count,industrialModels:overview.industrial,
   visibleRoads:overview.visibleRoads,selected:location.type,click:location,
   card: selected.box
  }));
 }finally{await ctx.close()}
}
try{
 await scenario('stone',390,844,true,'stone-phone');
 await scenario('bronze',390,844,true,'bronze-phone');
 await scenario('medieval',1440,900,false,'medieval-desktop');
 await scenario('renaissance',844,390,true,'renaissance-landscape-phone');
 await scenario('industrial',390,844,true,'industrial-phone');
 await scenario('industrial',1440,900,false,'industrial-desktop');
 assert.deepEqual(errors,[],'no uncaught browser errors');
 console.log('V82 UI PASS: real 3D building taps work across five eras, industrial 3D town, owner pause, V4 save export and responsive UI');
}finally{await browser.close()}
