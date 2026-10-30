// V157: units that travel on the world map (settlers on the move, trade caravans and merchant
// boats) also appear on the detail map, at the matching place and moving the same way.
// Their position is the world travel pose (same as the world marker) projected into local units.
import * as T from './vendor/three.module.js';
import {createStoneLoad} from './stone-equipment-v234.js';
import {createSoldier,animateSoldier} from './visuals.js';
import {worldTravelSample} from './map-units.js?v=59';
import {center} from './campaign.js';
import {scoutSectorPositionV236,blendScoutPositionV236} from './scout-sector-v236.js';
import {attachScoutMarkerV238,sizeScoutMarkerV238} from './scout-marker-v238.js';

const TEAM=['#c0ac79','#b98362','#9b88bb','#c2a55c'],FLAG=['#4a7288','#ac5945','#7d5fb0','#c09a2e'];
const mats=new Map();const mat=c=>{if(!mats.has(c))mats.set(c,new T.MeshStandardMaterial({color:c,roughness:.9}));return mats.get(c);};
const box=(g,x,y,z,w,h,d,c)=>{const m=new T.Mesh(new T.BoxGeometry(w,h,d),mat(c));m.position.set(x,y,z);m.castShadow=true;g.add(m);return m;};
const cyl=(g,x,y,z,r,h,c,rx=0,rz=0,seg=10)=>{const m=new T.Mesh(new T.CylinderGeometry(r,r,h,seg),mat(c));m.position.set(x,y,z);m.rotation.set(rx,0,rz);m.castShadow=true;g.add(m);return m;};

function settlerModel(team){
 const g=new T.Group(),walkers=[];
 for(const [x,z] of [[0,0],[.9,-1.1],[-.8,-1.4]]){const w=new T.Group();w.position.set(x,0,z);createSoldier(w,0,0,TEAM[team]||TEAM[0],'settler');g.add(w);walkers.push(w.children[0]);}
 for(const [x,z] of [[0,-.45],[.9,-1.52]]){const pack=createStoneLoad('settler');pack.position.set(x,1.03,z);g.add(pack);}
 const pole=box(g,-.8,1.6,-1.6,.06,2.6,.06,'#6d5034');box(g,-.55,2.6,-1.6,.5,.35,.03,FLAG[team]||FLAG[0]);
 g.userData.walkers=walkers;return g;
}
function scoutModel(team){
 const g=new T.Group();
 const fighter=createSoldier(g,0,0,TEAM[team]||TEAM[0],'scout');
 attachScoutMarkerV238(fighter,team);
 g.userData.walkers=[fighter];g.name='V236 scout same world sector';
 return g;
}
function caravanModel(team,age){
 const g=new T.Group(),walkers=[];
 // draft animal (ox early, horse later)
 const coat=age>=3?'#6b4a2e':'#8a7356',an=new T.Group();an.position.set(0,0,1.9);g.add(an);
 box(an,0,1.0,0,.75,.75,1.6,coat);box(an,0,1.25,.95,.45,.45,.55,coat);if(age<3)for(const s of [-1,1])box(an,s*.28,1.55,1.05,.08,.08,.35,'#e8e0cc');
 const legs=[];for(const [x,z] of [[-.25,-.55],[.25,-.55],[-.25,.55],[.25,.55]]){const l=box(an,x,.35,z,.16,.7,.16,coat);legs.push(l);}
 // cart with goods and a cover in team colour
 box(g,0,.85,-.3,1.4,.35,2.0,'#8b6a44');box(g,0,1.25,-.5,1.2,.5,1.4,'#c9b58a');box(g,0,1.62,-.5,1.3,.12,1.5,FLAG[team]||FLAG[0]);
 const wheels=[];for(const s of [-1,1]){const w=cyl(g,s*.78,.55,-.4,.5,.12,'#5b4430',0,Math.PI/2,12);wheels.push(w);}
 box(g,0,.7,.9,.08,.08,1.4,'#6d5034');
 const driver=new T.Group();driver.position.set(.95,0,1.0);createSoldier(driver,0,0,TEAM[team]||TEAM[0],'settler');g.add(driver);walkers.push(driver.children[0]);
 g.userData.walkers=walkers;g.userData.wheels=wheels;g.userData.legs=legs;return g;
}
function boatModel(team){
 const g=new T.Group();box(g,0,.35,0,1.6,.5,4.2,'#6d5034');box(g,0,.65,-.3,1.2,.4,1.6,'#c9b58a');
 cyl(g,0,2.2,.4,.06,3.4,'#5b4430');box(g,0,2.4,.45,.05,2.2,1.5,'#efe6d0');box(g,0,3.7,.4,.02,.35,.6,FLAG[team]||FLAG[0]);return g;
}

export function createDetailTravellers(group){
 const models=new Map();
 function sync({state,game,tile,worldToLocal,ground,age,visible,time,dt,zoom=150,showNames=true,camera=null,firstPerson=false}){
  const live=new Set();
  const consider=(key,entity,kind,team)=>{
   const pose=worldTravelSample(entity),p=kind==='scout'?scoutSectorPositionV236(pose,tile):worldToLocal(tile,pose.x,pose.z);
   if(Math.abs(p.x)>330||Math.abs(p.z)>285)return;
   if(kind==='boat'&&ground(p.x,p.z)>-.05)return;   // boats only on water
   if(kind!=='boat'&&ground(p.x,p.z)<-.15)return;
   live.add(key);let m=models.get(key);
   if(!m||m.userData.kind!==kind){if(m)group.remove(m);m=kind==='settler'?settlerModel(team):kind==='scout'?scoutModel(team):kind==='boat'?boatModel(team):caravanModel(team,age(team));m.userData.kind=kind;m.scale.setScalar(kind==='boat'?1.6:kind==='scout'?1:1.15);group.add(m);models.set(key,m);}
   // stationary travellers wait a little off the tile centre so they don't stand inside the town hall
   const off=kind==='scout'||pose.moving?{x:0,z:0}:{x:14+(entity.id%3)*4,z:10+(entity.id%2)*5};
   const target={x:p.x+off.x,z:p.z+off.z};
   const spot=kind==='scout'&&m.userData.scoutPlaced?blendScoutPositionV236(m.position,target,dt):target;
   const x=spot.x,z=spot.z;
   m.position.set(x,kind==='boat'?.25:ground(x,z),z);
   if(kind==='scout'){m.userData.scoutPlaced=true;m.userData.sectorV236=[p.sectorX,p.sectorZ];
    sizeScoutMarkerV238(m.userData.walkers?.[0],zoom,{names:showNames,camera,firstPerson});}
   const next=entity.path?.[0];if(next){const t=center(next.c,next.r),here=center(entity.c,entity.r);m.rotation.y=Math.atan2(t.x-here.x,t.z-here.z);}
   m.visible=true;
   for(const w of m.userData.walkers||[])animateSoldier(w,time,pose.moving);
   if(pose.moving){for(const w of m.userData.wheels||[])w.rotation.x-=dt*2.4;(m.userData.legs||[]).forEach((l,i)=>{l.rotation.x=Math.sin(time*6+i*Math.PI)*.35;});}
  };
  // Same-tile scouts already use the playable inspection unit. Other scouts
  // in the 3x3 detail neighbourhood use lightweight visual proxies.
  for(const army of state.armies||[]){
   if(army.embarked!=null||!visible(army))continue;
   const units=(state.units||[]).filter(u=>u.team===army.team&&(u.armyId||0)===(army.id||0)&&u.hp>0&&!u.garrison);
   if(!units.some(u=>u.kind==='scout'))continue; // also mixed armies containing a scout
   if(army.c===tile.c&&army.r===tile.r)continue;
   consider('scout:'+army.team+':'+(army.id||0),army,'scout',army.team);
  }
  for(const a of state.settlers||[])if(!a.landed&&visible(a))consider('settler:'+a.id,a,'settler',a.team);
  for(const c of state.shipments||[]){if(!visible(c))continue;if(c.mode==='sea')consider('trade:'+c.id,c,'boat',c.team);else if(c.mode!=='air'&&c.mode!=='rail')consider('trade:'+c.id,c,'caravan',c.team);}
  for(const [key,m] of models)if(!live.has(key))m.visible=false;
  return live.size;
 }
 function clear(){for(const m of models.values())group.remove(m);models.clear();}
 return {sync,clear};
}
