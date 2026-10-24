// V152: world-map models, river mouths and depth range. Node part always runs; browser part needs
// a static server on 127.0.0.1:8765 and CHROME_PATH (skipped with --node-only).
import assert from 'node:assert/strict';
import {getWorldModel,settlementGeometry,WORLD_MODEL_NAMES} from './world-models-v152.js';
const budget={high:800,medium:500,low:260};
for(const name of WORLD_MODEL_NAMES)for(const lod of ['high','medium','low']){
 const g=getWorldModel(name,lod),tris=g.index.count/3;
 assert.ok(tris>20&&tris<=budget[lod],`${name}/${lod} triangles ${tris}`);
 assert.ok(Number.isFinite(g.boundingSphere.radius)&&g.boundingBox.min.y>-.6,`${name}/${lod} bounds`);
 assert.equal(g.attributes.color.count,g.attributes.position.count);
}
for(let era=0;era<=6;era++)for(let team=0;team<4;team++){const g=settlementGeometry(team,era,1),tris=g.index.count/3;assert.ok(tris>300&&tris<4000,`settlement ${team}/${era}: ${tris}`);}
console.log('V152 models OK',WORLD_MODEL_NAMES.join(','));
if(!process.argv.includes('--node-only')){
 const {chromium}=await import('playwright');
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{for(const [demo,quality] of [['ai-iron-v143','high'],['stone','low']]){
  const ctx=await browser.newContext({viewport:{width:1100,height:700}});await ctx.addInitScript(q=>localStorage.setItem('kingdoms-quality',q),quality);
  const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:8765/?demo=${demo}&v=152`,{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>window.gameDebug&&document.getElementById('menu-status').hidden,{timeout:200000});
  await page.evaluate(()=>gameDebug.openWorld());await page.waitForTimeout(2500);
  const r=await page.evaluate(()=>{const models={};let settlements=0;gameDebug.worldScene.traverse(o=>{const m=o.userData.v152Model||(o.name?.startsWith('forest ')?o.name.replace(/ -?\d+:-?\d+$/,''):null);if(m)models[m]=(models[m]||0)+1;if(o.userData.modelName==='settlement_v152')settlements++;});
   return {models,settlements,near:gameDebug.camera.near,zoom:gameDebug.getZoom()};});
  console.log('V152',demo,quality,JSON.stringify(r));
  assert.deepEqual(errors,[]);
  assert.ok(Object.keys(r.models).length>=3,'world uses V152 nature models');
  assert.ok(r.settlements>=1,'cities use V152 settlement models');
  assert.ok(r.near>=Math.min(40,r.zoom*.04)*.97,'near plane follows zoom');
  await ctx.close();}
 }finally{await browser.close();}
}
console.log('V152 PASS');
