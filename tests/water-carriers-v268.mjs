// V268: water carriers walk hall -> river bank -> hall; inactive towns draw nothing.
import * as T from '../vendor/three.module.js';
import {createWaterCarriersV268,nearestRiverPointV268} from '../water-carriers-v268.js';
import {cityNeeds} from '../city-needs-v87.js';
const ok=(c,m)=>{if(!c){console.error('FAIL',m);process.exit(1);}};
const parent=new T.Group(),wc=createWaterCarriersV268(parent);
const nav={nearest:p=>({x:p.x-1,z:p.z}),route:(a,b)=>[a,{x:(a.x+b.x)/2,z:a.z},b]};
const make=()=>{const g=new T.Group();g.userData.animate=(t,m,a)=>{g.userData.last={m,a};};return g;};
// river mesh at x=30
const geo=new T.PlaneGeometry(4,40);geo.rotateX(-Math.PI/2);const river=new T.Group();const mesh=new T.Mesh(geo);mesh.position.set(30,0,0);river.add(mesh);
const rp=nearestRiverPointV268(river,{x:0,z:0});ok(rp&&Math.abs(rp.x-28)<.01,'nearest river point '+JSON.stringify(rp));
wc.update({key:'a',active:false,door:{x:0,z:0},river:rp,nav,time:0,ground:()=>0,makeCarrier:make});ok(parent.children.length===0,'inactive draws nothing');
const seen=new Set();let farthest=0;
for(let t=0;t<120;t+=.5){wc.update({key:'a',active:true,door:{x:0,z:0},river:rp,nav,time:t,ground:()=>0,makeCarrier:make});
 for(const m of parent.children[0].children){if(!m.visible)continue;farthest=Math.max(farthest,m.position.x);seen.add(String(m.userData.last?.a));}}
ok(parent.children[0].children.length===2,'two carriers');
ok(farthest>25,'carriers reach the bank '+farthest);
ok(seen.has('carry')&&seen.has('work'),'fill and carry actions '+[...seen]);
wc.clear();ok(parent.children.length===0,'clear removes');
// V267 satisfaction rule
const city={team:0,economy:{realms:[{pop:5,resources:{bread:10}}]}};const a=cityNeeds(city,0).productivity;city.waterFetchV267=true;const b=cityNeeds(city,0).productivity;
ok(Math.abs(b-(a-.05)*.9)<1e-9,'river water: -5% satisfaction then x0.9 work');
console.log('water carriers V268 ok');
