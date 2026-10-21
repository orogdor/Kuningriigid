import assert from 'node:assert/strict';
import {createBattle,tickBattle} from './campaign.js';
import {TROOPS} from './civilization-core.js';
import {createBronzeBattleState} from './bronze-battle-demo-v89.js';
import {squadRadius,moveSquad,formationMen,constrainStep} from './soldier-collision-v90.js';
const a={kind:'spearman',hp:125,x:-10,z:0},b={kind:'spearman',hp:125,x:0,z:0};moveSquad(a,{x:10,z:0},1,100,null,[a,b]);assert.ok(a.x<0,'swept movement cannot tunnel through another squad');assert.ok(Math.hypot(a.x-b.x,a.z-b.z)>=squadRadius(a)+squadRadius(b));
const p={x:-3,z:0,radius:.34},q={x:0,z:0,radius:.34};constrainStep(p,{x:3,z:0},[q]);assert.ok(p.x<-.68,'individual cannot tunnel through another man');
const samples=Array.from({length:64},(_,i)=>({kind:'spearman',hp:125,maxHp:125,x:(i%8)*10,z:Math.floor(i/8)*10}));const groups=formationMen(samples,0,null);assert.equal([...groups.values()].flat().length,768);console.log('V90 collision helper and twelve-man display regression passed');
const T=await import('./vendor/three.module.js');const {SoldierBatch}=await import('./soldier-batch-v90.js');const parent=new T.Group(),g=new T.BoxGeometry(),m=new T.MeshBasicMaterial(),models=[];for(let i=0;i<12;i++){const root=new T.Group(),part=new T.Mesh(g,m);part.position.x=i;root.add(part);parent.add(root);models.push(root);}const batch=new SoldierBatch(parent);batch.update(models);assert.equal(batch.batches.length,1);assert.equal(batch.batches[0].mesh.count,12);models[0].visible=false;batch.update(models);assert.equal(batch.batches[0].mesh.count,11);models[1].children[0].position.x=43;batch.update(models);const matrix=new T.Matrix4();batch.batches[0].mesh.getMatrixAt(0,matrix);assert.equal(matrix.elements[12],43);console.log('V90 soldier batching: all men, visibility and animation matrices preserved');

const normalNav={enabled:true,open(){assert.equal(this.enabled,true);return true;},move(u,t){u.x=t.x;u.z=t.z;return true;}};const mover={kind:'spearman',hp:125,x:0,z:0};moveSquad(mover,{x:1,z:0},.1,3,normalNav,[]);formationMen([{...mover,maxHp:125}],.1,normalNav);console.log('V90 normal city navigation binding preserved');
