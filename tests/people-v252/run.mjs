// V252: town people layer. Idle neighbours gather to chat, a lone idle worker walks home and goes inside,
// two walkers on the same path never overlap, people who work hold their place, nobody enters a wall.
import assert from 'node:assert/strict';
import {createPeopleLifeV252} from '../../people-life-v252.js';
const wall=(x,z)=>!(x>9&&x<11&&z>-3&&z<3); // a small blocked square
function run(sims,frames,{night=false,homes=[{x:20,z:0}],open=wall}={}){
 const L=createPeopleLifeV252();let t=0,out={},minGap=Infinity,blockedHit=false;
 for(let f=0;f<frames;f++){t+=.1;const ctx={time:t,enabled:true,open,homes,night};const dt=L.begin(ctx);out={};
  for(const [id,s] of Object.entries(sims)){const sim=typeof s==='function'?s(t):s;out[id]=L.step(id,{visible:true,moving:false,working:false,carrying:false,heading:0,action:'work',...sim},ctx,dt);}
  L.finish(ctx);
  const ids=Object.keys(out).filter(id=>!out[id].hidden);
  for(let i=0;i<ids.length;i++){const a=L.position(ids[i]);if(!open(a.x,a.z))blockedHit=true;for(let j=i+1;j<ids.length;j++){const b=L.position(ids[j]);minGap=Math.min(minGap,Math.hypot(a.x-b.x,a.z-b.z));}}}
 return {out,minGap,blockedHit,L};
}
// 1. three idle neighbours chat, the lone one goes home
{const r=run({a:{x:0,z:0},b:{x:3,z:1},c:{x:1,z:3},d:{x:40,z:40}},300);
 for(const id of ['a','b','c'])assert.equal(r.out[id].action,'talk',id+' chats');
 assert.equal(r.out.d.hidden,true,'lone idle worker went inside a house');}
// 2. two walkers on the same line (sim positions coincide) stay apart
{const path=t=>({x:-20+t*2,z:0,moving:true});const r=run({a:path,b:t=>({...path(t),z:.05})},120,{open:()=>true});
 assert.ok(r.minGap>1.2,'walkers keep personal space, min gap '+r.minGap.toFixed(2));}
// 3. a worker at work is anchored; a walker passing by steps aside
{const r=run({w:{x:0,z:0,working:true,action:'chop'},p:t=>({x:-10+t*2,z:.1,moving:true})},120,{open:()=>true});
 const w=r.L.position('w');assert.ok(Math.hypot(w.x,w.z)<.35,'working person stays at the job');
 assert.ok(r.minGap>1.2,'passer-by does not walk through the worker');}
// 4. separation never pushes anyone into a blocked cell
{const r=run({a:{x:8.6,z:0},b:{x:8.7,z:.1}},60);assert.equal(r.blockedHit,false,'nobody pushed into a wall');}
// 5. people who go back to work leave the house and catch up with the simulated worker
{const L=createPeopleLifeV252();let t=0;const homes=[{x:5,z:0}];
 for(let f=0;f<200;f++){t+=.1;const ctx={time:t,enabled:true,open:()=>true,homes,night:true};const dt=L.begin(ctx);L.step('a',{x:0,z:0,visible:true,moving:false,working:false,carrying:false},ctx,dt);L.finish(ctx);}
 assert.equal(L.position('a').inside,true,'at night an idle worker goes home');
 let last;for(let f=0;f<60;f++){t+=.1;const ctx={time:t,enabled:true,open:()=>true,homes,night:true};const dt=L.begin(ctx);last=L.step('a',{x:0,z:0,visible:true,moving:false,working:true,carrying:false,action:'mine'},ctx,dt);L.finish(ctx);}
 assert.equal(last.hidden,false);assert.equal(last.action,'mine');const p=L.position('a');assert.ok(Math.hypot(p.x,p.z)<.2,'back at the job');}
console.log('V252 people: chat, go home, personal space, anchored workers, walls PASS');
