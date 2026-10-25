// V161: smooth detail-tile changes (no shader recompiles, cached terrain + ground cover on all nine
// tiles), world map without the field patchwork, and the first-person walker.
// Needs a static server on 127.0.0.1:8765 and CHROME_PATH.
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const ctx=await browser.newContext({viewport:{width:1280,height:760}});
 await ctx.addInitScript(()=>{localStorage.setItem('kingdoms-quality','medium');window.__links=[];const P=WebGL2RenderingContext.prototype,o=P.linkProgram;P.linkProgram=function(p){window.__links.push(1);return o.call(this,p)};});
 const page=await ctx.newPage(),errors=[];page.setDefaultTimeout(240000);page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8765/?demo=ai-medieval-v159&v=161',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.gameDebug&&document.getElementById('menu-status').hidden);await page.waitForTimeout(3000);
 // 1. walking onto neighbouring tiles: after the first visit no shader program is compiled again
 const cross=async dx=>{await page.evaluate(dx=>{gameDebug.detailFocus.x=dx*(225/2+2);},dx);await page.waitForTimeout(2500);};
 await cross(1);await cross(-1);
 await page.evaluate(()=>{window.__links.length=0});
 await cross(1);await cross(-1);await cross(1);
 const links=await page.evaluate(()=>window.__links.length);console.log('V161 programs linked on repeat crossings',links);
 assert.equal(links,0,'no shader recompiles when changing detail tiles');
 // 2. ground cover covers all nine tiles of the detail area (built over a few frames)
 await page.waitForTimeout(4000);
 const cover=await page.evaluate(()=>{const tiles=new Set();gameDebug.localScene.traverse(o=>{if(o.userData?.coverCached)tiles.add(o.position.x+','+o.position.z);});return tiles.size;});
 console.log('V161 ground cover tiles',cover);assert.ok(cover>=8,'ground cover on the centre and neighbouring tiles');
 // 3. the world terrain no longer paints a field patchwork
 const src=await page.evaluate(async()=>{const m=await import('./landscape-v149.js?v=161a');const mat=m.terrainMaterial('world');const sh={uniforms:{},vertexShader:'#include <common>\n#include <begin_vertex>',fragmentShader:'#include <common>\n#include <color_fragment>\n#include <roughnessmap_fragment>'};mat.onBeforeCompile(sh);return sh.fragmentShader;});
 assert.ok(!src.includes('uT157Cult')&&!src.includes('hedge'),'no farmland patchwork on the world map');
 // 4. first-person walker: place, walk across a tile edge, exit
 await page.click('#hud-walk');await page.waitForTimeout(400);
 assert.equal(await page.evaluate(()=>!document.getElementById('fpv-place-hint').hidden),true,'placing hint shown');
 await page.mouse.click(760,520);await page.waitForTimeout(2500);
 const inFpv=await page.evaluate(()=>({fpv:document.body.classList.contains('fpv-mode'),active:gameDebug.walker.active,fov:gameDebug.camera.fov}));
 console.log('V161 fpv',JSON.stringify(inFpv));assert.ok(inFpv.fpv&&inFpv.active&&inFpv.fov===68,'first-person view active');
 await page.evaluate(()=>{gameDebug.walker.position.x=113.6;});await page.waitForTimeout(3000);
 const after=await page.evaluate(()=>({x:gameDebug.walker.position.x,focus:gameDebug.detailFocus.x,active:gameDebug.walker.active}));
 console.log('V161 crossing',JSON.stringify(after));assert.ok(after.active&&after.x<-100&&Math.abs(after.x-after.focus)<1,'walker carried onto the next tile');
 await page.keyboard.press('Escape');await page.waitForTimeout(1500);
 const out=await page.evaluate(()=>({fpv:document.body.classList.contains('fpv-mode'),fov:gameDebug.camera.fov,visible:gameDebug.walker.model.visible}));
 assert.ok(!out.fpv&&out.fov===43&&out.visible,'back to the strategy camera, character left standing');
 assert.deepEqual(errors,[]);
 await page.close();await ctx.close();
}finally{await browser.close();}
console.log('V161 PASS');
