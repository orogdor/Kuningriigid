import fs from 'node:fs';import path from 'node:path';import http from 'node:http';import assert from 'node:assert/strict';import {chromium}from'playwright';
const root=process.cwd(),server=http.createServer((req,res)=>{const p=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname==='/'?'/index.html':new URL(req.url,'http://localhost').pathname));if(!p.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}fs.readFile(p,(err,data)=>{if(err){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',p.endsWith('.js')?'text/javascript':p.endsWith('.json')?'application/json':p.endsWith('.css')?'text/css':p.endsWith('.html')?'text/html':'application/octet-stream');res.end(data);});});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||undefined,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
fs.mkdirSync('/tmp/v177-visual',{recursive:true});
try{for(const[label,viewport]of[['desktop',{width:1280,height:900}],['mobile',{width:390,height:844}]]){
 const ctx=await browser.newContext({viewport,isMobile:label==='mobile',hasTouch:label==='mobile'}),page=await ctx.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{localStorage.setItem('kingdoms-quality','medium');localStorage.setItem('kingdoms-civ4','v177-original-save');});
 await page.goto('http://127.0.0.1:'+server.address().port+'/?demo=ai-mountain-v176&v=177',{waitUntil:'domcontentloaded',timeout:120000});
 await page.waitForFunction(()=>window.gameDebug,{timeout:120000});
 await page.waitForTimeout(1500);
 const status=await page.evaluate(()=>({city:gameDebug.activeCity().name,towers:gameDebug.game.allBuildings(gameDebug.activeCity()).filter(b=>b.hp>0&&b.ready&&b.type==='watchtower').length,save:localStorage.getItem('kingdoms-civ4'),view:gameDebug.view()}));
 assert.equal(status.view,'local');assert.equal(status.save,'v177-original-save');assert.ok(status.towers>=2);assert.deepEqual(errors,[]);
 await page.screenshot({path:'/tmp/v177-visual/'+label+'-overview.png'});
 await page.evaluate(()=>{const d=gameDebug,c=d.activeCity(),b=d.game.allBuildings(c).find(b=>b.type==='watchtower'&&b.ready);d.detailFocus.set(b.x,0,b.z);});
 await page.waitForTimeout(700);await page.screenshot({path:'/tmp/v177-visual/'+label+'-tower.png'});
 await page.evaluate(()=>{const d=gameDebug,t=d.state.mountainTestV176;d.detailFocus.set(0,0,175);});
 await page.waitForTimeout(700);await page.screenshot({path:'/tmp/v177-visual/'+label+'-cliff.png'});
 console.log('V177 VISUAL PASS',label,JSON.stringify(status));await ctx.close();
}}finally{await browser.close();server.close();}
