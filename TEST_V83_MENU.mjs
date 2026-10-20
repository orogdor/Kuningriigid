import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdirSync,writeFileSync} from 'node:fs';
const dir='artifacts-v83';mkdirSync(dir,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined,args:['--no-sandbox','--disable-dev-shm-usage','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const failures=[],reports=[];
try{
for(const device of [{name:'desktop',width:1366,height:900},{name:'phone',width:390,height:844},{name:'landscape',width:844,height:390}]){
 const ctx=await browser.newContext({viewport:{width:device.width,height:device.height},isMobile:device.name!=='desktop',hasTouch:device.name!=='desktop'});
 const page=await ctx.newPage();page.on('pageerror',e=>failures.push(device.name+': '+e.message));
 await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.gameDebug||document.querySelector('#menu-status.menu-error'),{timeout:90000});
 assert.ok(await page.evaluate(()=>!!window.gameDebug),await page.locator('#menu-status').textContent());
 await page.locator('#menulanguage').selectOption('et');
 assert.equal(await page.locator('#menu-world').getAttribute('open'),null);
 assert.equal(await page.locator('#menu-saves').getAttribute('open'),null);
 assert.equal(await page.locator('#menu-extras').getAttribute('open'),null);
 const layout=await page.locator('#continue').evaluate(el=>{const r=el.getBoundingClientRect();return {top:r.top,bottom:r.bottom,width:r.width,viewport:innerHeight,overflow:document.documentElement.scrollWidth>innerWidth}});
 assert.ok(layout.top>=0&&layout.bottom<=layout.viewport,'resume visible without scrolling');assert.equal(layout.overflow,false);
 await page.screenshot({path:`${dir}/${device.name}-menu.png`});
 await page.locator('#menulanguage').selectOption('en');
 assert.equal(await page.locator('#menutitle').innerText(),'Your next chapter');
 assert.equal(await page.locator('#menu-saves summary').innerText(),'Saves and transfer');
 assert.ok(!(await page.locator('#startmenu').innerText()).includes('V79'));
 await page.locator('#menulanguage').selectOption('et');
 await page.locator('#menu-world summary').click();await page.locator('#seed').fill('V83-menu-test');
 await page.locator('#newgame').click();
 await page.waitForFunction(()=>window.gameDebug&&document.querySelector('#startmenu').hidden,{timeout:90000});
 const seed=await page.evaluate(()=>window.gameDebug.state.seed);
 await page.locator('#menubtn').click();
 const before=await page.evaluate(()=>window.gameDebug.state.time);
 await page.waitForTimeout(1000);
 assert.equal(await page.evaluate(()=>window.gameDebug.state.time),before,'menu pauses game');
 await page.locator('#menu-saves summary').click();
 const download=await Promise.all([page.waitForEvent('download'),page.locator('#v51export').click()]).then(x=>x[0]);
 assert.ok(download.suggestedFilename().endsWith('.json'));
 await page.locator('#continue').click();
 await page.reload();await page.waitForFunction(()=>!!window.gameDebug,{timeout:90000});
 assert.equal(await page.evaluate(()=>window.gameDebug.state.seed),seed,'world persists across reload');
 reports.push({device:device.name,layout,seed,checks:'menu, language, new world, pause, export, reload'});
 console.log('V83 MENU PASS '+JSON.stringify(reports.at(-1)));await ctx.close();
}
// A failed renderer/module cannot leave unexplained dead action buttons.
const ctx=await browser.newContext(),page=await ctx.newPage();
await page.route('**/civilization.js?v=83a',route=>route.abort());
await page.goto('http://127.0.0.1:8765/');
await page.locator('#menu-status.menu-error').waitFor();
assert.equal(await page.locator('#newgame').isDisabled(),true);
assert.equal(await page.locator('#continue').isDisabled(),true);
await page.screenshot({path:`${dir}/startup-error.png`});await ctx.close();
assert.deepEqual(failures,[]);
writeFileSync(`${dir}/menu-results.json`,JSON.stringify(reports,null,2));
}finally{await browser.close()}
