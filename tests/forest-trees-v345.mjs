// V345: generated trees for all six species, Sapling-compatible layout.
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
const root=new URL('../assets/sapling-trees/',import.meta.url),m=JSON.parse(readFileSync(new URL('manifest.json',root)));
const kinds=['pine','spruce','oak','lime','birch','palm'];
assert.equal(m.trees.length,30);
for(const k of kinds)assert.deepEqual(m.trees.filter(t=>t.species===k).map(t=>t.variant).sort(),[1,2,3,4,5],k);
const glb=b=>{const n=b.readUInt32LE(12);return JSON.parse(b.subarray(20,20+n).toString())};
let near=0,mid=0;
for(const t of m.trees){
 for(const lod of ['near','mid','far']){
  const f=new URL(`${t.id}/${lod}.glb`,root);assert.ok(existsSync(f),f.pathname);
  const b=readFileSync(f),doc=glb(b);
  assert.equal(createHash('sha256').update(b).digest('hex'),t[lod].sha256,t.id+' '+lod+' checksum');
  const tris=doc.meshes[0].primitives.reduce((n,p)=>n+doc.accessors[p.indices].count/3,0);
  assert.equal(tris,t[lod].triangles);
  if(lod==='far')assert.equal(tris,6);
  else{assert.equal(doc.meshes[0].primitives.length,2,'bark + foliage');assert.ok(doc.meshes[0].primitives.every(p=>doc.accessors[p.attributes.POSITION].min[1]>=-1e-6),'grounded');}
 }
 assert.ok(t.near.triangles<=2000,t.id+' near budget '+t.near.triangles);near+=t.near.triangles;
 assert.ok(t.mid.triangles<=250,t.id+' mid budget '+t.mid.triangles);mid+=t.mid.triangles;
 assert.ok(t.boundsZUp[1][2]>8,'tree height');assert.ok(Math.abs(t.boundsZUp[0][2])<1e-6,'base at ground');
}
console.log('V345 forest trees PASS',{trees:30,averageNear:Math.round(near/30),averageMid:Math.round(mid/30)});
