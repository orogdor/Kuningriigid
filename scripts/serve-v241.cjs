// Local preview: node scripts/serve-v241.cjs [port]
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.glb':'model/gltf-binary','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{
 let name;try{name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400);return res.end();}
 if(name==='/'||name.endsWith('/'))name+='index.html';
 const file=path.resolve(root,'.'+name);
 if(!file.startsWith(root+path.sep)||name.split('/').some(part=>part.startsWith('.'))){res.writeHead(403);return res.end();}
 fs.readFile(file,(error,data)=>{
  if(error){res.writeHead(404);return res.end();}
  res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');
  res.setHeader('Cache-Control','no-cache');res.setHeader('Content-Length',data.length);res.end(data);
 });
});
server.listen(Number(process.argv[2])||8788,'127.0.0.1',()=>console.log('V241 preview: http://127.0.0.1:'+server.address().port+'/'));
