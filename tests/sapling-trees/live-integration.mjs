import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import * as T from '../../vendor/three.module.js';
import {withSaplingInstancesV328,withSaplingTreeV328,loadSaplingV328,saplingVariantV328,saplingSpeciesV328} from '../../sapling-trees-v328.js';
const requests=[];globalThis.fetch=async url=>{requests.push(String(url));const b=await readFile(new URL(url));return {ok:true,json:async()=>JSON.parse(b),arrayBuffer:async()=>b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength)}};
globalThis.createImageBitmap=async()=>({width:512,height:512,close(){}});
const source=new T.InstancedMesh(new T.CylinderGeometry(.1,.2,3),new T.MeshBasicMaterial(),120),m=new T.Matrix4(),c=new T.Color();
for(let i=0;i<120;i++){m.compose(new T.Vector3(i%20*12,20,Math.floor(i/20)*12),new T.Quaternion().setFromEuler(new T.Euler(0,i*.37,0)),new T.Vector3(.8,1+i%3*.1,.9));source.setMatrixAt(i,m);source.setColorAt(i,c.setHex(0xeeffdd));}
const original=source.instanceMatrix.array.slice(),root=withSaplingInstancesV328(source,'pine',source,{staticTransforms:true});assert.equal(source.visible,true);await root.userData.saplingPromiseV328;assert.equal(root.userData.saplingReadyV328,true);assert.equal(source.visible,false);
const camera=new T.OrthographicCamera(-200,200,200,-200,.1,5000);camera.position.set(0,100,200);camera.lookAt(0,0,0);camera.updateMatrixWorld();root.updateMatrixWorld();const cells=root.children.filter(o=>o.isLOD);
for(const cell of cells)cell.update(camera);
let shown=()=>cells.flatMap(c=>c.children.filter(m=>m.visible));assert.equal(shown().reduce((n,m)=>n+m.count,0),240);assert.ok(shown().every(m=>m.userData.saplingLOD==='far'));
assert.equal(new Set(cells.flatMap(c=>c.children.map(m=>m.name.split(' ')[2]))).size,5,'all five variants instantiated');
const copied=cells.map(c=>c.children.find(m=>m.visible)).flatMap(mesh=>Array.from({length:mesh.count},(_,i)=>{mesh.getMatrixAt(i,m);return m.elements.join(',')}));
assert.deepEqual(new Set(copied),new Set(Array.from({length:source.count},(_,i)=>Array.from(original.slice(i*16,i*16+16)).join(','))));
const tileRoot=new T.Group();tileRoot.add(root);
let updates=0;const updateCell=cells[0].updateMatrixWorld;
cells[0].updateMatrixWorld=function(force){updates++;return updateCell.call(this,force);};
tileRoot.updateMatrixWorld(true);
tileRoot.updateMatrixWorld(true);
assert.equal(updates,1,'stationary stands reuse their descendant transforms');
tileRoot.position.set(225,0,-195);tileRoot.updateMatrixWorld(true);
assert.equal(updates,2,'a rebased tile updates all stand transforms');
assert.equal(cells[0].matrixWorld.elements[12],225);
assert.equal(cells[0].matrixWorld.elements[14],-195);
await Promise.all(Array.from({length:5},(_,i)=>loadSaplingV328('pine',i,'mid')));camera.zoom=3;camera.updateProjectionMatrix();for(const cell of cells)cell.update(camera);assert.ok(shown().every(m=>m.userData.saplingLOD==='mid'));
assert.ok(shown().every(mesh=>mesh.matrixWorld.equals(mesh.parent.matrixWorld)),'newly loaded LOD uses the rebased position on its first frame');
await Promise.all(Array.from({length:5},(_,i)=>loadSaplingV328('pine',i,'near')));camera.zoom=150;camera.updateProjectionMatrix();for(const cell of cells)cell.update(camera);assert.ok(shown().every(m=>m.userData.saplingLOD==='near'));assert.equal(shown().reduce((n,m)=>n+m.count,0),240);assert.deepEqual(source.instanceMatrix.array,original);
for(const mesh of shown()){mesh.geometry.computeBoundingBox();assert.ok(mesh.geometry.boundingBox.min.y>=-1e-6);}
const scene=new T.Scene();let originalBefore=0;scene.onBeforeRender=()=>originalBefore++;const trees=[];
for(let i=0;i<100;i++){const tree=withSaplingTreeV328('pine',new T.Group(),123);tree.position.set(i*.01,0,0);scene.add(tree);trees.push(tree);}
await loadSaplingV328('pine',saplingVariantV328(123,123*.13),'near');camera.zoom=1;camera.left=-5;camera.right=5;camera.top=5;camera.bottom=-5;camera.updateProjectionMatrix();camera.position.set(0,3,20);camera.lookAt(0,3,0);camera.updateMatrixWorld();
function render(){scene.updateMatrixWorld();scene.onBeforeRender(null,scene,camera);for(const tree of trees)if(tree.parent&&tree.visible)tree.update(camera);}
render();render();const batches=scene.children.filter(o=>o.isInstancedMesh);assert.equal(batches.length,2);assert.ok(batches.every(b=>b.count===100));batches[0].getMatrixAt(0,m);assert.ok(Math.abs(m.elements[12])<1e-6,'growing buffer retains early matrices');batches[0].getMatrixAt(99,m);assert.ok(Math.abs(m.elements[12]-.99)<1e-5);
trees[3].visible=false;render();assert.ok(batches.every(b=>b.count===99),'chopped/hidden tree omitted');for(const tree of trees)scene.remove(tree);render();assert.ok(batches.every(b=>b.count===0),'map clear removes every live tree');assert.equal(originalBefore,4,'existing render callback retained');
const biomeKinds=new Set(Array.from({length:200},(_,i)=>saplingSpeciesV328('taiga',i)));assert.deepEqual([...biomeKinds].sort(),['birch','pine','spruce']);assert.equal(saplingSpeciesV328('jungle',3),'palm');
const result={passed:true,staticInstances:120,variants:5,sourceMatricesUnchanged:true,nearFarExclusive:true,grounded:true,liveInstances:100,capacityGrowthPreservesMatrices:true,hiddenAndRemovedTreesOmitted:true,previousSceneCallbackPreserved:true,biomeSpecies:true,glbRequests:requests.filter(x=>x.endsWith('.glb')).length};
await writeFile('reports/sapling-trees-live-integration.json',JSON.stringify(result,null,2));console.log(result);
