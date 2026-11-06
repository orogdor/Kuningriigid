const {chromium}=require(process.env.TREE_NODE_MODULES+'/playwright');
const fs=require('fs'),path=require('path'),http=require('http');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!file.startsWith(root+path.sep))return res.writeHead(403).end();fs.readFile(file,(error,data)=>{if(error)return res.writeHead(404).end();res.setHeader('Content-Type',file.endsWith('.html')?'text/html':'text/javascript');res.end(data)})});
(async()=>{await new Promise(r=>server.listen(8772,'127.0.0.1',r));const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});try{
 for(const desktop of [false,true]){
  const context=await browser.newContext();
  if(desktop)await context.addInitScript(()=>{window.displayModes=[];window.KuningriigidWindow={setMode:async mode=>{window.displayModes.push(mode);return {ok:true}}}});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:8772/tests/display-mode-v334.html');
  const select=page.locator('#graphics-v334-display-mode');await select.waitFor();
  if(await select.locator('option').count()!==3)throw Error('Expected three display modes');
  if(await select.locator('option[value=borderless]').isDisabled()===desktop)throw Error('Wrong borderless availability');
  if(desktop){await page.locator('#menu-graphics-v226 summary').click();await select.selectOption('borderless');await page.waitForFunction(()=>window.displayModes.includes('borderless'));await page.reload();await page.waitForFunction(()=>window.displayModes.includes('borderless'));}
  if(errors.length)throw Error(errors.join('\n'));await context.close();console.log('PASS display menu',desktop?'desktop':'browser');
 }
}finally{await browser.close();server.close()}})().catch(e=>{console.error(e);process.exit(1)});
