const fs=require('fs'),path=require('path'),http=require('http');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const root=path.resolve(process.argv[2]);
const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end()}fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);return res.end()}res.setHeader('content-type',file.endsWith('.html')?'text/html':file.endsWith('.js')?'application/javascript':'application/octet-stream');res.end(data)})});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
 const page=await browser.newPage();
 await page.goto('http://127.0.0.1:'+server.address().port+'/majaehitaja/index.html',{waitUntil:'load'});
 const result=await page.evaluate(()=>eval(`(()=>{const first={design:structuredClone(state),estimate:survey().res};const changed=structuredClone(state);changed.roofMat='bark';changed.roofHeight=100;changed.wallScale=125;changed.items=[];return [first,{design:changed,estimate:survey(changed,display).res}];})()`));
 const defaults=JSON.parse(fs.readFileSync(path.join(__dirname,'../data/house_default_designs.json'),'utf8'));
 for(const name of ['hall','fisher','palisade','woodgate','field','harbor','hall@1','house@1','fisher@1','woodgate@1','field@1','hall@2','house@2','field@2','harbor@2']){
  const design=defaults[name];const estimate=await page.evaluate(design=>eval('survey(design,geometry(design)).res'),design);result.push({design,estimate});
 }
 for(const edge of ['stones','rail','ditch']){
  const design=structuredClone(defaults['field@2']);design.field.edge=edge;
  const estimate=await page.evaluate(design=>eval('survey(design,geometry(design)).res'),design);result.push({design,estimate});
 }
 fs.writeFileSync(process.argv[3],JSON.stringify(result));
 console.log('WEB_HOUSE_SURVEY',JSON.stringify(result.map(x=>x.estimate)));await browser.close();server.close();
})().catch(error=>{console.error(error);server.close();process.exitCode=1});
