// V154: detail-map building models. Node part always runs; browser part needs a static server on
// 127.0.0.1:8765 and CHROME_PATH (skip with --node-only).
import assert from 'node:assert/strict';
import {createTownModelV154,TOWN_TYPES_V154,houseVariantCount,buildingSeed} from './town-models-v154.js';
const tris=m=>{let n=0;m.traverse(o=>{if(o.isMesh)n+=o.geometry.attributes.position.count/3;});return n;};
const bounds=m=>{let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9,y1=-1e9;m.traverse(o=>{if(!o.isMesh)return;const p=o.geometry.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i)+o.parent.position.x,z=p.getZ(i)+o.parent.position.z;x0=Math.min(x0,x);x1=Math.max(x1,x);z0=Math.min(z0,z);z1=Math.max(z1,z);y1=Math.max(y1,p.getY(i)+o.parent.position.y);}});return {x0,x1,z0,z1,y1};};
let models=0;
for(let age=0;age<=6;age++){
 const n=houseVariantCount(age),keys=new Set();assert.ok(n>=8,`age ${age}: at least 8 house variants`);
 for(let v=0;v<n;v++){const m=createTownModelV154('house',0,age,v),t=tris(m),b=bounds(m);keys.add(m.userData.townModelV154);models++;
  assert.ok(t>40&&t<9000,`house ${age}/${v} triangles ${t}`);
  assert.ok(b.x0>-6.2&&b.x1<6.2&&b.z0>-5.2&&b.z1<5.6,`house ${age}/${v} fits its plot ${JSON.stringify(b)}`);}
 assert.equal(keys.size,n,'house variants are distinct models');
 for(const type of TOWN_TYPES_V154()){if(type==='house')continue;const m=createTownModelV154(type,1,age,3);assert.ok(m,`${type}/${age}`);const t=tris(m);models++;
  assert.ok(t>30&&t<14000,`${type}/${age} triangles ${t}`);if(type!=='market'){const b=bounds(m);assert.ok(b.x0>-7&&b.x1<7&&b.z0>-6.5&&b.z1<6.5,`${type}/${age} footprint ${JSON.stringify(b)}`);}}
}
assert.equal(createTownModelV154('palisade',0,3,0),null,'walls keep their fortification models');
assert.equal(createTownModelV154('quarry',0,3,0),null,'mining sites keep their site models');
assert.equal(createTownModelV154('mill',0,1,0).userData.animations.length,0,'bronze-age mill has no windmill sails');
assert.equal(createTownModelV154('mill',0,3,0).userData.animations.length,1,'medieval windmill sails turn');
assert.notEqual(buildingSeed({x:10,z:4}),buildingSeed({x:-10,z:4}));
console.log('V154 models OK',models,'models,',TOWN_TYPES_V154().length,'types');
if(!process.argv.includes('--node-only')){
 const {chromium}=await import('playwright');
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{for(const demo of ['ai-medieval-v151','ai-modern-v140']){
  const page=await browser.newPage(),errors=[];page.setDefaultTimeout(240000);page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:8765/?demo=${demo}&v=154`,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.gameDebug&&document.getElementById('menu-status').hidden);await page.waitForTimeout(2500);
  const r=await page.evaluate(()=>{const keys=new Set();let houses=0,v154=0;gameDebug.localScene.traverse(o=>{const k=o.userData.townModelV154;if(k){v154++;keys.add(k);if(k.startsWith('house|'))houses++;}});return {v154,houses,distinctHouseModels:[...keys].filter(k=>k.startsWith('house|')).length,distinct:keys.size};});
  console.log('V154',demo,JSON.stringify(r));assert.deepEqual(errors,[]);
  assert.ok(r.v154>=8,'detail map uses V154 building models');assert.ok(r.distinctHouseModels>=Math.min(5,r.houses),'houses vary');
  await page.close();}
 }finally{await browser.close();}
}
console.log('V154 PASS');
