// V354: which level of detail each designer building draws at far, middle and near
// camera distances, its triangles, and which texture files are fetched (only the
// levels in view, at their own resolution). Usage: node tests/house-designs-v354-lod-browser.cjs [graphics settings JSON]
const fs=require('fs'),path=require('path'),http=require('http');
const {chromium}=require(process.env.TREE_NODE_MODULES?process.env.TREE_NODE_MODULES+'/playwright':'playwright');
const root=path.resolve(__dirname,'..');
const mime={'.js':'application/javascript','.html':'text/html','.json':'application/json','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg'};
const seen=[];
const server=http.createServer((req,res)=>{const p=decodeURIComponent(req.url.split('?')[0]);if(p.includes('/textures/'))seen.push(p.split('/textures/')[1]);const f=path.resolve(root,'.'+p);fs.readFile(f,(e,d)=>{if(e)return res.writeHead(404).end();res.writeHead(200,{'content-type':mime[path.extname(f)]||'application/octet-stream','cache-control':'no-store'});res.end(d);});});
(async()=>{await new Promise(r=>server.listen(8776,'127.0.0.1',r));
const b=await chromium.launch({...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage({viewport:{width:1000,height:700}});
p.on('pageerror',e=>console.log('pageerror',String(e)));
await p.addInitScript(g=>localStorage.setItem('kingdoms-graphics-v226',g),process.argv[2]||'{}');
await p.goto('http://127.0.0.1:8776/tests/house-designs-v354-view.html?ids=hall:0,house:0,smith:2&cam=300,250,300,0,0,0');
const st=await p.evaluate(()=>viewReady);
const fileReq=()=>seen.filter(x=>!/\/(high|medium|low)-/.test('/'+x)||true).filter(x=>!x.includes('atlas')||true);
console.log('settings',JSON.stringify({detail:st.detail,levels:st.textureLevels,interior:st.interiorDistance,far:st.nearDistance}));
console.log('triangles',JSON.stringify(st.triangles));
const designerLoads=seen.length;seen.length=0;
await p.waitForTimeout(2500);
console.log('far camera',JSON.stringify(await p.evaluate(()=>viewLevels())),'draw',JSON.stringify(await p.evaluate(()=>viewInfo())));
console.log(' game texture files',JSON.stringify([...new Set(seen)].sort()));seen.length=0;
await p.evaluate(()=>viewCamera(60,45,60,0,0,0));await p.waitForTimeout(3000);
console.log('mid camera',JSON.stringify(await p.evaluate(()=>viewLevels())),'draw',JSON.stringify(await p.evaluate(()=>viewInfo())));
console.log(' new files',JSON.stringify([...new Set(seen)].sort()));seen.length=0;
await p.evaluate(()=>viewCamera(-8,4,9,-7,1,0));await p.waitForTimeout(3500);
console.log('near camera',JSON.stringify(await p.evaluate(()=>viewLevels())),'draw',JSON.stringify(await p.evaluate(()=>viewInfo())));
console.log(' new files',JSON.stringify([...new Set(seen)].sort()));
await p.screenshot({path:require('node:os').tmpdir()+'/house-lod-near.png',timeout:240000});
await b.close();server.close();})();
