// V355: the game's house builder module (house-builder-v355.js) makes the same
// buildings as the designer page (majaehitaja/index.html, hidden iframe) did.
// Every designer id is built both ways and the results are compared: parts,
// triangles per level, materials, textures, footprint and walk walls.
//   CHROMIUM_PATH=/usr/bin/google-chrome node tests/house-builder-v355-browser.cjs [id ...]
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require(process.env.TREE_NODE_MODULES?process.env.TREE_NODE_MODULES+'/playwright':'playwright');
const root=path.resolve(__dirname,'..');
const mime={'.js':'application/javascript','.html':'text/html','.json':'application/json','.css':'text/css','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{const pathname=decodeURIComponent(req.url.split('?')[0]);const f=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
 if(!f.startsWith(root+path.sep))return res.writeHead(403).end();fs.readFile(f,(e,d)=>{if(e)return res.writeHead(404).end();res.writeHead(200,{'content-type':mime[path.extname(f)]||'application/octet-stream'});res.end(d);});});
const source=fs.readFileSync(path.join(root,'house-designs-v354.js'),'utf8');
const all=JSON.parse(source.match(/const DESIGNER_IDS=new Set\((\[[^\]]*\])\)/)[1].replace(/'/g,'"'));
const ids=process.argv.slice(2).length?process.argv.slice(2):all;
let failures=0;const fail=m=>{failures++;console.error('FAIL',m);};
(async()=>{
 await new Promise(r=>server.listen(8781,'127.0.0.1',r));
 const launch={headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']};
 if(process.env.CHROMIUM_PATH)launch.executablePath=process.env.CHROMIUM_PATH;
 const browser=await chromium.launch(launch);
 const page=await browser.newPage();
 page.on('pageerror',e=>fail('pageerror '+e));
 await page.setContent('<!doctype html><html><body></body></html>');
 await page.goto('http://127.0.0.1:8781/house-builder-v355.js',{waitUntil:'domcontentloaded'});
 await page.setContent('<!doctype html><html><head><base href="http://127.0.0.1:8781/"></head><body></body></html>');
 await page.evaluate(async()=>{
  const frame=document.createElement('iframe');frame.src='/majaehitaja/index.html?embed=1&worker=1&textures=low';document.body.append(frame);
  await new Promise(r=>addEventListener('message',e=>{if(e.data?.source==='kuningriigid-designer'&&e.data.type==='ready')r();}));
  let next=1;const waiting=new Map();
  addEventListener('message',e=>{if(e.data?.type==='model'&&e.data.source==='kuningriigid-designer'){waiting.get(e.data.requestId)?.(e.data);waiting.delete(e.data.requestId);}});
  window.viaFrame=(id,segment)=>new Promise(resolve=>{const requestId=next++;waiting.set(requestId,resolve);frame.contentWindow.postMessage({source:'kuningriigid-game',type:'model',requestId,id,design:null,segment},location.origin);});
  window.builder=await import('/house-builder-v355.js');
  const tri=list=>list.reduce((n,m)=>n+m.indices.length/3,0);
  const r6=x=>Math.round(x*1e4)/1e4;
  // pixel check of canvas textures (ImageBitmap from the page, canvas from the module)
  const pixels=img=>{if(!img)return 'none';const c=document.createElement('canvas');c.width=img.width;c.height=img.height;const g=c.getContext('2d');g.drawImage(img,0,0);
   const d=g.getImageData(0,0,c.width,c.height).data;let h=0;for(let i=0;i<d.length;i+=3)h=(Math.imul(h,31)+(d[i]>>2))>>>0;return h.toString(36);};
  window.summary=p=>({meshes:p.meshes.length,mid:p.mid.length,far:p.far.length,tris:[tri(p.meshes),tri(p.mid),tri(p.far)],
   verts:p.meshes.reduce((n,m)=>n+m.positions.length/3,0),
   sum:r6(p.meshes.reduce((n,m)=>n+m.positions.reduce((a,b)=>a+Math.abs(b),0),0)),
   materials:p.meshes.map(m=>m.material.name+'|'+m.material.type+'|'+m.material.color+'|'+['map','normalMap','roughnessMap','bumpMap'].map(s=>m.material[s]?s:'').join('')).sort(),
   textures:Object.values(p.textures).map(t=>(t.url?t.url.split('/textures/')[1]+(t.crop?'#crop':''):'bitmap:'+(t.bitmap?.width+'x'+t.bitmap?.height)+':'+pixels(t.bitmap))+(t.flipY?':flipY':'')).sort(),
   footprint:p.footprint&&Object.values(p.footprint).map(r6),collision:p.collision.length});
 });
 const WALL={palisade:'palisadeLine','palisade@2':'rampart',stonewall:'stoneLine','stonewall@2':'stoneLine',reinforced_wall:'highStone','reinforced_wall@2':'highStone'};
 for(const id of ids){
  const segment=WALL[id]?{length:7/(1/1.05),kind:WALL[id]}:null;
  const r=await page.evaluate(async([id,segment])=>{
   const t0=performance.now();const a=await viaFrame(id,segment);const t1=performance.now();
   let b,err=null;try{b=await builder.buildHouseModelV355({id,segment});}catch(e){err=String(e&&e.stack||e);}
   const t2=performance.now();
   return {frame:a.error?{error:a.error}:summary(a.model),module:err?{error:err}:summary(b),ms:[Math.round(t1-t0),Math.round(t2-t1)]};
  },[id,segment]);
  const same=JSON.stringify(r.frame)===JSON.stringify(r.module);
  const bitmaps=(r.module.textures||[]).filter(t=>t.startsWith('bitmap')).length;console.log(same?'ok  ':'DIFF',id,'canvas textures',bitmaps,'tris',JSON.stringify(r.module.tris??r.module),'ms frame/module',r.ms.join('/'));
  if(!same){fail(id);console.log(' frame ',JSON.stringify(r.frame).slice(0,1500));console.log(' module',JSON.stringify(r.module).slice(0,1500));}
 }
 await browser.close();server.close();
 console.log(failures?failures+' failures':'all '+ids.length+' buildings match');process.exitCode=failures?1:0;
})().catch(e=>{console.error(e);process.exit(1);});
