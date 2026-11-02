// V284: quarry and mason workers work on their building model: the spot is found on the model itself
// (top surface of the quarry terrace, floor between back wall and bench in the mason's hut) and the worker
// faces the stone; the worker walks there from the door and back, chips fly at the blow.
import * as T from '../vendor/three.module.js';
import {WORK_SPOTS_V284,workSpotV284,applyWorkSpotV284} from '../stone-work-spots-v284.js';
import fs from 'fs';
const ok=(c,m)=>{if(!c){console.error('FAIL',m);process.exit(1);}};
ok(WORK_SPOTS_V284.quarry.onTop&&WORK_SPOTS_V284.quarry.action==='mine','quarry: on the terrace, pick');
ok(!WORK_SPOTS_V284.mason.onTop&&WORK_SPOTS_V284.mason.action==='build','mason: on the floor, hammer');
// a stepped box stands in for the quarry: the upper half (back, -z) is 2 high, the front half 1 high
const g=new T.BufferGeometry().copy(new T.BoxGeometry(10,1,10).translate(0,.5,0));
const back=new T.Mesh(new T.BoxGeometry(10,2,5).translate(0,1,-2.5),new T.MeshBasicMaterial());
const merged=new T.Group();const front=new T.Mesh(g,new T.MeshBasicMaterial());front.userData.stoneDetailedAsset='quarry';merged.add(front);merged.add(back);
const people=new T.Group();const scene=new T.Scene();scene.add(merged);scene.add(people);scene.updateMatrixWorld(true);
const spot=workSpotV284('quarry',merged,people);
ok(spot&&Math.abs(spot.y-1)<1e-6,'stands on the top surface of the model ('+spot?.y+')');
ok(Math.abs(Math.abs(spot.heading)-Math.PI)<1e-6,'faces the back wall');
ok(workSpotV284('quarry',merged,people)===spot,'spot is cached');
merged.rotation.y=Math.PI/2;scene.updateMatrixWorld(true);const s2=workSpotV284('quarry',merged,people);ok(s2!==spot&&Math.abs(s2.x-spot.z)<1e-6,'follows the building rotation');
// walking up from the door: blend goes 0 -> 1 over ~1.4 s, then the worker is on the spot
const m=new T.Group();m.add(new T.Group());let r;for(let i=0;i<60;i++)r=applyWorkSpotV284(m,spot,true,i/30,1/30,new T.Vector3(0,0,8));
ok(r.blend===1&&Math.abs(m.position.y-spot.y)<1e-6,'reached the work spot');
for(let i=0;i<60;i++)r=applyWorkSpotV284(m,spot,false,2+i/30,1/30,new T.Vector3(0,0,8));ok(r.blend===0,'goes back to the door when work stops');
const civ=fs.readFileSync(new URL('../civilization.js',import.meta.url),'utf8');ok(/workSpotV284\(bV\.type/.test(civ),'the detail map uses the work spots');
console.log('work spots V284 ok');
