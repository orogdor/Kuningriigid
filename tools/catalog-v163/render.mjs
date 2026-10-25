// Renders every Stone Age model the game currently uses into labelled tiles (PNG per item + JSON index).
import {chromium} from 'playwright';
import fs from 'fs';
const OUT=process.argv[2]||'catalog-v163/tiles'; // usage: node tools/catalog-v163/render.mjs [outdir] (static server on 127.0.0.1:8765)
fs.rmSync(OUT,{recursive:true,force:true});fs.mkdirSync(OUT,{recursive:true});
const b=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const ctx=await b.newContext({viewport:{width:900,height:600}});await ctx.addInitScript(()=>localStorage.setItem('kingdoms-quality','high'));
const p=await ctx.newPage();p.setDefaultTimeout(600000);const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://127.0.0.1:8765/?demo=stone',{waitUntil:'domcontentloaded'});
await p.waitForFunction(()=>window.gameDebug&&document.getElementById('menu-status').hidden);await p.waitForTimeout(3000);
// list of items
const items=await p.evaluate(async()=>{
 const C=gameDebug.catalogV163,TM=await import('./town-models-v154.js?v=161b');
 const list=[];
 const types=Object.keys(C.BUILDINGS).filter(t=>(C.BUILD_AGE[t]??0)===0&&t!=='house');
 for(const t of types)list.push({cat:'1 Hooned',id:t,label:C.BUILDINGS[t]?.name||t,make:['b',t]});
 for(const t of ['palisade','watchtower'])if(!types.includes(t))list.push({cat:'1 Hooned',id:t,label:t,make:['b',t]});
 const nh=TM.houseVariantCount(0);for(let v=0;v<nh;v++)list.push({cat:'2 Elamud',id:'house#'+v,label:'Elamu variant '+(v+1),make:['house',v]});
 const people=['stone_builder','stone_worker','stone_lumber','stone_miner','stone_forester','stone_fisher','gatherer','watercarrier','farmer','market_woman','villager','settler','scholar','merchant','trainer','shipwright'];
 for(const k of people)list.push({cat:'3 Inimesed',id:k,label:k,make:['p',k]});
 for(const [k,d] of Object.entries(C.TROOPS))if(d.age===0)list.push({cat:'4 Sõdurid',id:k,label:d.name||k,make:['p',k]});
 for(const k of ['tree','game','fish','berry'])list.push({cat:'5 Loodus ja ressursid',id:k,label:k,make:['r',k]});
 for(const k of ['stone','ore','copper','tin','clay','gems','oil'])list.push({cat:'5 Loodus ja ressursid',id:'deposit:'+k,label:'maardla '+k,make:['d',k]});
 for(const k of ['oak','lime','birch','pine','spruce','palm','cactus','rock','shrub'])list.push({cat:'6 Maakaart',id:'world:'+k,label:'maakaart '+k,make:['w',k]});
 for(let sz=1;sz<=3;sz++)list.push({cat:'6 Maakaart',id:'settlement:'+sz,label:'kiviaja asula '+sz,make:['s',sz]});
 for(const t of ['army','settler','caravan'])list.push({cat:'6 Maakaart',id:'unit:'+t,label:'maakaardi '+t,make:['u',t]});
 return list.map(({make,...r})=>({...r,make}));
});
console.log('items',items.length);
// render each item in its own small scene with neutral light
await p.evaluate(async()=>{
 const T=await import('./vendor/three.module.js'),WM=await import('./world-models-v152.js?v=161a'),MU=await import('./map-units.js?v=59');
 const canvas=document.createElement('canvas');canvas.width=canvas.height=360;
 const r=new T.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true});r.setSize(360,360,false);r.toneMapping=T.ACESFilmicToneMapping;r.shadowMap.enabled=true;r.shadowMap.type=T.PCFSoftShadowMap;
 const scene=new T.Scene();scene.background=new T.Color('#dfe5df');
 scene.add(new T.HemisphereLight(0xdfe9f2,0x5b6a45,1.05));const sun=new T.DirectionalLight(0xffe2b8,2.7);sun.position.set(-6,10,7);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);scene.add(sun,sun.target);
 const ground=new T.Mesh(new T.CircleGeometry(1,48),new T.MeshStandardMaterial({color:'#9aa874',roughness:1}));ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
 const cam=new T.PerspectiveCamera(32,1,.01,5000);
 window.__renderItem=(it)=>{
  const C=gameDebug.catalogV163,[k,a]=it.make;let o=new T.Group();
  try{
   if(k==='b')o=C.townBuildingModel(a,0,0,0,7)||o;
   else if(k==='house')o=C.townBuildingModel('house',0,0,0,a)||o;
   else if(k==='p'){C.createSoldier(o,0,0,'#c0ac79',a);}
   else if(k==='r'){if(a==='tree')C.addTree(o,0,0,0,17,.9);else o.add(C.createWildlife(a));}
   else if(k==='d')o=C.createDepositPile(a)||o;
   else if(k==='w')o=new T.Mesh(WM.getWorldModel(a,'high'),WM.WORLD_MODEL_MATERIAL);
   else if(k==='s')o=new T.Mesh(WM.settlementGeometry(0,0,a),WM.SETTLEMENT_MATERIAL);
   else if(k==='u')o=MU.createWorldUnit(a,0);
  }catch(e){return {error:String(e)};}
  scene.add(o);o.traverse(m=>{if(m.isMesh){m.castShadow=true;m.receiveShadow=true;}});o.updateMatrixWorld(true);
  const box=new T.Box3().setFromObject(o),size=box.getSize(new T.Vector3()),c=box.getCenter(new T.Vector3());
  const R=Math.max(size.x,size.y,size.z,.2)*.5;
  ground.scale.setScalar(Math.max(size.x,size.z)*.9+R*.6);ground.position.set(c.x,box.min.y-.01,c.z);
  const dist=R/Math.tan(16*Math.PI/180)*1.25;const dir=new T.Vector3(.75,.62,1).normalize();
  cam.position.copy(c).addScaledVector(dir,dist);cam.near=dist/100;cam.far=dist*10;cam.updateProjectionMatrix();cam.lookAt(c);
  sun.position.copy(c).add(new T.Vector3(-R*2,R*4,R*3));sun.target.position.copy(c);const sc=sun.shadow.camera;sc.left=sc.bottom=-R*2.5;sc.right=sc.top=R*2.5;sc.near=.01;sc.far=R*12;sc.updateProjectionMatrix();
  r.render(scene,cam);const png=canvas.toDataURL('image/png');scene.remove(o);
  return {png,size:[size.x,size.y,size.z].map(v=>+v.toFixed(2))};
 };
});
const index=[];
for(const [i,it] of items.entries()){
 const res=await p.evaluate(it=>window.__renderItem(it),it);
 if(res.error){console.log('ERR',it.id,res.error);continue;}
 const file=`${String(i).padStart(3,'0')}_${it.id.replace(/[^a-z0-9]+/gi,'_')}.png`;
 fs.writeFileSync(`${OUT}/${file}`,Buffer.from(res.png.split(',')[1],'base64'));
 index.push({...it,file,size:res.size});
}
fs.writeFileSync(`${OUT}/index.json`,JSON.stringify(index,null,1));
console.log('rendered',index.length,'errors',errs.slice(0,5));
await b.close();
