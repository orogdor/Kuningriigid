'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require(process.env.UI_NODE_MODULES+'/playwright');
const root=path.resolve(__dirname,'..'),mime={'.js':'text/javascript','.html':'text/html','.css':'text/css','.png':'image/png','.webp':'image/webp','.json':'application/json','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{
 const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
 if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
 fs.readFile(file,(err,data)=>{if(err)return res.writeHead(404).end();res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(data)});
});
(async()=>{
 await new Promise(r=>server.listen(8776,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:915,height:364}}),errors=[],requests=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('request',r=>requests.push(new URL(r.url()).pathname));
  await page.goto('http://127.0.0.1:8776/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.KUNINGRIIGID_MENU_READY_V336&&!window.gameDebug,null,{timeout:30000});
  const options=page.locator('#menu-options-v337');
  await options.locator('summary').click();
  if(!(await options.isVisible()))throw Error('Options not visible before game engine');
  const scale=page.locator('#menu-ui-scale-v337');
  await scale.selectOption('80');
  const result=await page.evaluate(()=>({storage:JSON.parse(localStorage.getItem('kingdoms-graphics-v226'))?.uiScale,variable:document.documentElement.style.getPropertyValue('--ui-scale-v337'),zoom:getComputedStyle(document.querySelector('#startmenu .menu-card')).zoom}));
  if(result.storage!==80||result.variable!=='0.8'||Math.abs(parseFloat(result.zoom)-.8)>.01)throw Error('UI scale not applied and persisted: '+JSON.stringify(result));
  if(requests.includes('/civilization.js'))throw Error('Options caused full simulation import');
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.KUNINGRIIGID_MENU_READY_V336&&!window.gameDebug);
  if(await page.locator('#menu-ui-scale-v337').inputValue()!=='80')throw Error('UI scale not restored on reload');
  await page.locator('#menu-exit-v337').click();
  if(!/Brauser/.test(await page.locator('#menu-exit-note-v337').textContent()))throw Error('Browser close fallback missing');
  await page.goto('http://127.0.0.1:8776/tests/ui-v309-preview.html');
  await page.waitForSelector('.v304-command[data-action=build]');
  await page.locator('.v304-command[data-action=build]').click();
  await page.waitForSelector('#v309-menu[data-kind=build] #tray .v310-card');
  const sizes=await page.locator('#v309-menu #tray .v310-card').first().evaluate(el=>{
   const title=el.querySelector('.v121-card-name'),price=el.querySelector('.v121-card-cost'),caption=el.querySelector('.v310-caption');
   const visual=el.querySelector('.v310-visual');return {title:title&&parseFloat(getComputedStyle(title).fontSize),price:price&&parseFloat(getComputedStyle(price).fontSize),caption:caption&&parseFloat(getComputedStyle(caption).fontSize),visual:visual&&visual.getBoundingClientRect().height};
  });
  if(!(sizes.title>0&&sizes.title<9&&sizes.price>0&&sizes.price<9&&sizes.caption>0&&sizes.caption<9&&sizes.visual>0))throw Error('Compact font size invalid: '+JSON.stringify(sizes));
  const hud=await page.evaluate(()=>{document.documentElement.style.setProperty('--ui-scale-v337','0.8');return getComputedStyle(document.body).getPropertyValue('--hud-u');});
  if(!hud||!hud.trim())throw Error('HUD scale custom property missing');
  if(errors.length)throw Error(errors.join('\n'));
  console.log('PASS V337 options/close/captions',JSON.stringify({result,sizes,hud,requests:requests.length}));
  await page.close();
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>server.close());
