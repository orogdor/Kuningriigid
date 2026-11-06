const {chromium}=require(process.env.UI_NODE_MODULES+'/playwright');
const fs=require('fs'),path=require('path'),http=require('http');
const root=path.resolve(__dirname,'..');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{const p=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!p.startsWith(root+path.sep))return res.writeHead(403).end();fs.readFile(p,(err,data)=>{if(err)return res.writeHead(404).end();res.setHeader('Content-Type',mime[path.extname(p)]||'application/octet-stream');res.end(data)})});
(async()=>{await new Promise(r=>server.listen(8773,'127.0.0.1',r));const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{fs.mkdirSync(path.join(root,'reports'),{recursive:true});
  for(const [name,width,height] of [['landscape',915,364],['portrait',390,844],['desktop',1200,675]]){
   const page=await browser.newPage({viewport:{width,height}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));
   await page.goto('http://127.0.0.1:8773/tests/ui-v309-preview.html');await page.addStyleTag({url:'/ui-v335.css'});
   await page.waitForSelector('.v304-command[data-action=build]');
   await page.locator('.v304-command[data-action=build]').click();await page.waitForSelector('#v309-menu[data-kind=build] #tray .v310-card');
   async function check(selector,kind){
    await page.waitForFunction(s=>document.querySelectorAll(s).length>=2,selector);
    const info=await page.locator(selector).evaluateAll(nodes=>nodes.slice(0,2).map(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,text:e.textContent.trim()}}));
    if(Math.abs(info[0].x-info[1].x)>1||info[1].y<=info[0].y+2)throw Error(kind+' cards are not stacked: '+JSON.stringify(info));
    const menu=await page.locator('#v309-menu').boundingBox();if(info[0].h>menu.height/2+.5||info[0].h<15||!info.every(c=>c.text))throw Error(kind+' incorrect or empty cards '+JSON.stringify(info));
    return info;
   }
   const buildings=await check('#v309-menu #tray > .v310-card','buildings');
   await page.screenshot({path:path.join(root,'reports','ui-v335-'+name+'-build.png')});
   await page.locator('#v309-menu #tray > button.v310-card').first().click();
   if(!/valitud/.test(await page.locator('#fixture-result').textContent()))throw Error('Building selection did not run');
   await page.locator('#v309-menu .v309-back').click();await page.locator('.v304-command[data-action=armies]').click();
   await page.waitForSelector('#v309-menu[data-kind=armies] .v264-rows .v310-card');
   const armies=await check('#v309-menu .v264-rows > .v310-card','armies');
   await page.screenshot({path:path.join(root,'reports','ui-v335-'+name+'-armies.png')});
   await page.locator('#v309-menu .v264-rows > button.v310-card').first().click();
   if(errors.length)throw Error(errors.join('\n'));console.log('PASS',name,JSON.stringify({buildings,armies}));await page.close();
  }
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exit(1)});
