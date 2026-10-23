import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';
const out='artifacts-v141';fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||undefined,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const results=[];
try{
 for(const mobile of [false,true]){
  const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1280,height:800},isMobile:mobile,hasTouch:mobile});
  await context.addInitScript(()=>{localStorage.setItem('kingdoms-quality','low');localStorage.setItem('kingdoms-civ4','existing-player-save');localStorage.setItem('kingdoms-civ4-backup','existing-player-backup');});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8765/?demo=ai-modern-v140&v=141',{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>window.gameDebug&&document.getElementById('menu-status').hidden,{timeout:120000});
  const result=await page.evaluate(async()=>{
   const {scienceRate,cityScience}=await import('./science.js');
   const {EDUCATION_BUILDINGS}=await import('./education-v141.js');
   const {buildingCategory}=await import('./build-catalog-v121.js');
   const game=gameDebug.game,s=gameDebug.state,rate=scienceRate(s,0);
   const expected=s.cities.filter(c=>c.team===0).reduce((n,c)=>n+cityScience(c,s.research[0].known).total,0);
   const withoutMilitary={...s,units:[],armies:[]};
   return {rate,expected,peacefulRate:scienceRate(withoutMilitary,0),age:s.ages[0],types:Object.keys(EDUCATION_BUILDINGS).map(type=>({type,category:buildingCategory(type),age:game.buildingAge(0,type)})),main:localStorage.getItem('kingdoms-civ4'),backup:localStorage.getItem('kingdoms-civ4-backup')};
  });
  assert.equal(result.rate,result.expected);assert.equal(result.peacefulRate,result.rate);assert.equal(result.age,6);
  assert.ok(result.types.every(x=>x.category==='science'));assert.equal(result.main,'existing-player-save');assert.equal(result.backup,'existing-player-backup');
  await page.screenshot({path:`${out}/game-${mobile?'mobile':'desktop'}.png`});
  // Isolated visual fixture: inspect all four new models without editing the campaign.
  await page.evaluate(async mobile=>{
   const T=await import('./vendor/three.module.js'),{createBuildingModel}=await import('./buildings.js');
   const renderer=new T.WebGLRenderer({antialias:true});renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(1);
   renderer.domElement.id='education-gallery';Object.assign(renderer.domElement.style,{position:'fixed',inset:'0',zIndex:99999});document.body.append(renderer.domElement);
   const scene=new T.Scene();scene.background=new T.Color('#9daeb0');scene.add(new T.HemisphereLight(0xffffff,0x666655,2));
   const sun=new T.DirectionalLight(0xffffff,2);sun.position.set(10,25,20);scene.add(sun);
   const ground=new T.Mesh(new T.PlaneGeometry(70,55),new T.MeshStandardMaterial({color:'#819069'}));ground.rotation.x=-Math.PI/2;ground.position.y=-.05;scene.add(ground);
   const types=['library','school','public_school','high_school'];
   for(let i=0;i<types.length;i++){const model=createBuildingModel(types[i]);model.position.set(mobile?(i%2)*11-5.5:i*10-15,0,mobile?Math.floor(i/2)*12-6:0);scene.add(model);if(!model.children.length)throw Error('Missing model '+types[i]);}
   const camera=new T.PerspectiveCamera(45,innerWidth/innerHeight,.1,200);camera.position.set(mobile?25:15,mobile?45:25,mobile?52:39);camera.lookAt(0,1,0);renderer.render(scene,camera);
  },mobile);
  await page.screenshot({path:`${out}/education-${mobile?'mobile':'desktop'}.png`});
  assert.deepEqual(errors,[]);results.push({...result,mobile,errors});await context.close();
 }
 fs.writeFileSync(out+'/test-results.json',JSON.stringify(results,null,2));console.log('V141 BROWSER PASS',JSON.stringify(results));
}finally{await browser.close()}
