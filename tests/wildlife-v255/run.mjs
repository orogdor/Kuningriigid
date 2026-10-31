// V255: shy game and real hunting, herder with the flock out by day and home at night.
import assert from 'node:assert/strict';
import * as T from '../../vendor/three.module.js';
import {createWildlifeV255,wildlifeVisualHeadingV257} from '../../wildlife-v255.js';
import {createHerdingV255} from '../../herding-v255.js';
const open=()=>true;
for(const [dx,dz] of [[1,0],[0,1],[-1,0],[0,-1],[.6,.8]]){
 const heading=Math.atan2(dx,dz),axis=new T.Vector3(1,0,0).applyAxisAngle(new T.Vector3(0,1,0),wildlifeVisualHeadingV257(heading));
 assert.ok(Math.abs(axis.x-dx)<1e-7&&Math.abs(axis.z-dz)<1e-7,'deer faces its actual direction of travel');
}
// Overlapping human and deer must still give the deer a direction to flee.
{const W=createWildlifeV255(),r={id:14,x:0,z:0};const st=W.update(r,{time:1,dt:.2,people:[{x:0,z:0}],hunters:[],open});assert.ok(Math.hypot(st.x,st.z)>.1,'deer escapes overlap');
 const root=new T.Group(),body=new T.Group();root.add(body);W.pose(root,{grazing:true},1);assert.equal(body.rotation.x,0);assert.ok(body.rotation.z<0,'grazing pitches toward muzzle');W.pose(root,{lying:true},2);assert.ok(body.rotation.x>1,'deer rolls onto its side');}
// 1. a person walking up startles the deer; it runs away and later comes back
{const W=createWildlifeV255(),r={id:3,x:0,z:0};let st,maxD=0,t=0;
 for(let f=0;f<40;f++){t+=.1;st=W.update(r,{time:t,dt:.1,people:[{x:4,z:0}],hunters:[],open});maxD=Math.max(maxD,Math.hypot(st.x,st.z));}
 assert.ok(st.running||maxD>5,'deer flees from a person 4 m away (moved '+maxD.toFixed(1)+')');
 for(let f=0;f<900;f++){t+=.1;st=W.update(r,{time:t,dt:.1,people:[],hunters:[],open});}
 assert.ok(Math.hypot(st.x,st.z)<4,'deer drifts back home when nobody is near');}
// 2. the hunter who stalks it does not startle it; the throw drops it, it lies until the meat is carried home
{const W=createWildlifeV255(),r={id:5,x:0,z:0};let st,t=0;
 for(let f=0;f<30;f++){t+=.1;st=W.update(r,{time:t,dt:.1,people:[{x:3,z:0,hunterOf:5}],hunters:[{resourceId:5,phase:'out'}],open});}
 assert.ok(!st.running&&Math.hypot(st.x,st.z)<3.5,'unaware of the stalking hunter');
 for(let f=0;f<20;f++){t+=.1;st=W.update(r,{time:t,dt:.1,people:[{x:2,z:0,hunterOf:5}],hunters:[{resourceId:5,phase:'work'}],open});}
 assert.equal(st.lying,true,'shot animal lies down');
 st=W.update(r,{time:t+.1,dt:.1,people:[],hunters:[{resourceId:5,phase:'return'}],open});assert.equal(st.lying,true,'still lying while carried home');
 st=W.update(r,{time:t+.2,dt:.1,people:[],hunters:[],open});assert.equal(st.lying,false,'the next animal of the herd appears');}
// 3. herding: inside at night, out with the flock by day, back home in the evening
{const parent=new T.Group(),H=createHerdingV255(parent),door={x:0,z:0};
 const nav={nearest:p=>({x:Math.round(p.x),z:Math.round(p.z)}),reachable:()=>true,open:()=>true,route:(a,b)=>[a,{x:(a.x+b.x)/2,z:(a.z+b.z)/2},b]};
 const makeHerder=()=>{const g=new T.Group();g.userData.animate=()=>{};return g;};
 const run=hour=>{const time=(hour-8)*60;H.update({pastures:[{key:'p1',door}],nav,time,hour,ground:()=>0,makeHerder});return parent.children[0];};
 let g=run(3);assert.equal(g.visible,false,'night: herder and sheep inside');assert.equal(H.isOut('p1'),false);
 g=run(7.2);assert.equal(g.visible,true,'morning: leaving');const herder=g.children[g.children.length-1];const d1=Math.hypot(herder.position.x,herder.position.z);
 g=run(12);const d2=Math.hypot(herder.position.x,herder.position.z);assert.ok(d2>18,'midday: grazing far from the pen ('+d2.toFixed(1)+')');assert.ok(d1<d2,'walked out');
 const sheep=g.children.filter(o=>o.name==='V255 sheep');assert.equal(sheep.length,6,'a flock of six');
 assert.ok(sheep.every(s=>Math.hypot(s.position.x-herder.position.x,s.position.z-herder.position.z)<10),'the flock stays with the herder');
 g=run(18.9);const d3=Math.hypot(herder.position.x,herder.position.z);assert.ok(d3<4,'evening: back at the pen ('+d3.toFixed(1)+')');
 g=run(20);assert.equal(g.visible,false,'night again: inside');}
console.log('V255 wildlife flees people, hunter stalks and drops game, herder takes the flock out and home PASS');
