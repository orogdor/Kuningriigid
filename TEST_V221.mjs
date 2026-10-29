// V221: the first proper Stone Age models are in the game: skinned, animated Stone Age people and
// new hall, houses, lumber camp and quarry. Needs a static server on 127.0.0.1:8765 and CHROME_PATH.
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const ctx=await browser.newContext({viewport:{width:1100,height:700}});
 await ctx.addInitScript(()=>localStorage.setItem('kingdoms-quality','low'));
 const page=await ctx.newPage(),errors=[];page.setDefaultTimeout(300000);page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8765/?demo=stone&v=221',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.gameDebug&&document.getElementById('menu-status').hidden);await page.waitForTimeout(2000);
 await page.evaluate(()=>{const c=gameDebug.state.cities.find(c=>c.team===0);gameDebug.openTile(gameDebug.game.cell(c));const b=document.getElementById('pause');if(b.textContent.includes('▶'))b.click();});
 await page.waitForTimeout(6000);
 const r=await page.evaluate(async()=>{
  const T=await import('./vendor/three.module.js');
  const people=[],buildings=new Set();
  gameDebug.localScene.traverse(o=>{if(o.userData?.rig?.stoneHuman)people.push(o);if(o.userData?.stoneModelV221)buildings.add(o.userData.stoneModelV221);});
  const p=people[0],B=p?.userData.rig.bones,before=B?.hand_R.getWorldPosition(new T.Vector3());
  await new Promise(res=>setTimeout(res,2500));
  const after=B?.hand_R.getWorldPosition(new T.Vector3());
  let skinned=0;p?.traverse(o=>{if(o.isSkinnedMesh&&o.skeleton?.bones.length===17)skinned++;});
  return {people:people.length,kinds:[...new Set(people.map(o=>o.userData.rig.kind))],buildings:[...buildings],skinned,moved:before&&after?before.distanceTo(after):0};
 });
 console.log('V221',JSON.stringify(r));
 assert.ok(r.people>=5,'Stone Age people use the new model');
 assert.equal(r.skinned,1,'a 17-bone skinned mesh');
 assert.ok(r.moved>0.01,'people are animated');
 for(const k of ['hall','lumber','quarry'])assert.ok(r.buildings.includes(k),k+' uses the new Stone Age model');
 assert.ok(r.buildings.some(k=>k.startsWith('house')),'houses use the new Stone Age models');
 assert.deepEqual(errors,[]);
 await page.close();await ctx.close();
}finally{await browser.close();}
console.log('V221 PASS');
