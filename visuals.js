import {visualKind as militaryVisualKind} from './military-v88.js';
import * as T from './vendor/three.module.js';
import {createV48Mesh} from './model-runtime-v48.js';
import {createV50CharacterRig} from './model-runtime-v50.js';
const geometries=new Map(),materials=new Map();
function geom(key,make){if(!geometries.has(key)){const g=make();g.userData.shared=true;geometries.set(key,g)}return geometries.get(key)}
function material(color,metal=false){const key=color+metal;if(!materials.has(key))materials.set(key,new T.MeshStandardMaterial({color,roughness:metal?.48:.88,metalness:metal?.55:0}));return materials.get(key)}
function part(parent,shape,color,x,y,z,sx,sy,sz,metal=false){const geometry=geom(shape,()=>shape==='sphere'?new T.SphereGeometry(1,8,6):shape==='cylinder'?new T.CylinderGeometry(1,1,1,8):shape==='cone'?new T.ConeGeometry(1,1,8):new T.BoxGeometry(1,1,1));const m=new T.Mesh(geometry,material(color,metal));m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
function normalizeKind(kind){
 if(/^(stone|bronze|iron|medieval|renaissance|industrial|modern)_builder$/.test(kind))return 'builder';
 return kind.replace(/^(bronze_|master_)/,'');
}
function humanArchetype(kind){
 if(['stone_builder','bronze_builder','iron_builder','medieval_builder','renaissance_builder','industrial_builder','modern_builder'].includes(kind))return kind;
 if(kind==='market_woman')return 'merchant';
 if(['builder','shipwright'].includes(kind))return 'builder';
 if(['artisan'].includes(kind))return 'scholar';
 if(['rifleman','motorized'].includes(kind))return 'modern';
 if(['slinger','spearman','axeman','archer','musketeer','infantry','militia','cavalry','knight','heavy_cavalry','halberdier','man_at_arms','crossbowman','catapult','battering_ram','siege_tower'].includes(kind))return 'warrior';
 if(['lumberjack','miner','forester','stone_lumber','stone_miner','stone_forester','stone_fisher','stone_worker','farmer','watercarrier','gatherer','trainer'].includes(kind))return 'worker';
 return 'villager';
}
export function createSoldier(parent,x,z,color,kind,grade='standard'){
 const originalKind=kind;kind=militaryVisualKind(kind);
 const visualKind=kind;
 const toolColor=kind.startsWith('stone_')?'#8f9185':kind.startsWith('bronze_')?'#b98a48':kind.startsWith('iron_')?'#8c959d':kind.startsWith('renaissance_')||kind.startsWith('industrial_')?'#a8afb5':kind.startsWith('modern_')?'#cfb95a':kind.startsWith('master_')?'#d0c6a2':'#a2aaa2';
 const archetype=humanArchetype(visualKind);
 kind=normalizeKind(kind);
 const root=new T.Group(),rig=createV50CharacterRig(root,archetype),{body,arms,legs,head}=rig;
 const riding=['cavalry','knight','heavy_cavalry'].includes(kind),primitive=['slinger','spearman','axeman','settler','stone_lumber','stone_miner','stone_forester','stone_worker','stone_fisher','builder','shipwright','market_woman','gatherer','farmer','watercarrier','artisan','trainer'].includes(kind);
 body.position.y=riding?.85:0;
 // A restrained faction-coloured textile strip keeps armies recognizable in the world view.
 part(body,'box',color,.10,.82,.178,.11,.048,.02);
if(primitive){if(kind==='market_woman')part(arms[0],'box','#946d43',0,-.37,.24,.24,.28,.24);if(kind==='spearman')part(arms[1],'box','#8d7149',0,-.05,.12,.06,1.8,.06);if(kind==='axeman'||kind==='stone_lumber'||kind==='stone_miner'){part(arms[1],'box','#856b45',0,-.1,.12,.07,.9,.07);part(arms[1],'sphere','#929784',.12,.3,.12,.23,.14,.12)}if(['builder','shipwright'].includes(kind)){part(arms[1],'box','#856b45',0,-.22,.12,.06,.65,.06);part(arms[1],'box',toolColor,0,.12,.12,.32,.16,.15,true);part(arms[0],'box','#ac885b',0,-.25,.18,.32,.08,.65)}if(kind==='farmer'){part(arms[1],'box','#856b45',0,-.1,.12,.055,1.3,.055);part(arms[1],'box',toolColor,.15,-.65,.12,.35,.06,.08,true)}if(kind==='watercarrier')part(arms[1],'cylinder','#8e7352',0,-.55,.2,.17,.18,.17);if(kind==='stone_fisher'){part(arms[1],'box','#846a46',0,.1,.2,.045,1.9,.045);part(arms[1],'box','#d0c5a7',0,-.1,.7,.012,1.5,.012)}if(kind==='slinger'){part(arms[1],'box','#998263',0,-.15,.1,.025,.55,.025);part(arms[1],'sphere','#9da08d',0,-.43,.1,.1,.1,.1)}}else if(['archer','crossbowman'].includes(kind)){const bow=new T.Mesh(geom('bow',()=>new T.TorusGeometry(.35,.025,5,16,Math.PI)),material('#9b784a'));bow.rotation.z=-Math.PI/2;bow.position.set(0,-.38,.13);arms[0].add(bow);part(arms[0],'box','#d1c5a0',0,-.38,.13,.014,.67,.014);part(body,'box','#5c4832',.15,1.1,-.25,.16,.5,.16)}else if(['musketeer','rifleman','motorized'].includes(kind)){part(arms[1],'box','#44484c',0,-.5,.22,.12,1.05,.13,true);part(arms[1],'box','#826b50',0,-.26,.20,.17,.36,.18);part(arms[0],'box','#747d7a',0,-.35,.23,.07,.48,.10,true);if(kind==='motorized')part(body,'box','#789094',0,1.0,-.22,.52,.33,.12,true)}else if(['lumberjack','miner','forester'].includes(kind)){part(arms[1],'box','#806343',0,-.05,.12,.055,.8,.055);if(kind==='forester')part(arms[1],'box',toolColor,0,-.38,.12,.18,.25,.04,true);else if(kind==='lumberjack')part(arms[1],'box',toolColor,.12,.28,.12,.28,.2,.08,true);else part(arms[1],'box',toolColor,0,.28,.12,.5,.065,.08,true)}else if(kind!=='worker'){part(arms[1],'box','#b7c1b8',.04,-.02,.12,.055,.85,.055,true);part(arms[1],'box','#695a3f',.04,-.42,.12,.2,.05,.08);if(!riding){const shield=part(arms[0],'cylinder',color,-.1,-.27,.14,.28,.08,.34);shield.rotation.x=Math.PI/2;part(arms[0],'sphere','#9a9f8e',-.1,-.27,.2,.08,.08,.035,true)}}
// Medieval armour is visibly equipped rather than using civilian clothing.
if(['knight','heavy_cavalry','man_at_arms','halberdier','crossbowman'].includes(kind)){
 part(body,'box','#858d94',0,.48,.06,.61,.92,.41,true);
 part(head,'box','#8d9294',0,.28,0,.5,.37,.48,true);
 for(const arm of arms)part(arm,'box','#8d9494',0,-.19,.03,.29,.45,.26,true);
 if(kind==='halberdier'){part(arms[1],'box','#6d553b',.05,-.1,.2,.06,2.4,.06);part(arms[1],'box','#b4bcba',.05,.85,.2,.18,.55,.1,true);}
 if(kind==='crossbowman'){part(arms[0],'box','#927a54',0,-.45,.4,1,.12,.12);part(arms[0],'box','#6e5942',0,-.45,.42,.1,.12,.85);}
 if(['knight','heavy_cavalry'].includes(kind)){part(body,'box','#b6b7ae',0,.65,-.28,.75,.55,.12,true);part(head,'box','#bfc4c1',0,.41,.22,.45,.14,.1,true);}
}
if(['catapult','battering_ram','siege_tower'].includes(kind)){
 const height=kind==='siege_tower'?4:kind==='catapult'?1.5:1.2;
 part(root,'box','#856641',0,.42,0,2.1,.26,2.7);
 for(const side of [-1,1])for(const zz of [-.82,.82]){const wheel=part(root,'cylinder','#63513d',side*1.08,.4,zz,.41,.16,.41);wheel.rotation.z=Math.PI/2}
 if(kind==='catapult'){const arm=part(root,'box','#775938',0,1.55,0,.22,2.8,.24);arm.rotation.x=-.5;part(root,'box','#978263',0,2.55,-.6,.75,.48,.58);}
 if(kind==='battering_ram'){part(root,'box','#7a5c38',0,1.35,0,.5,.52,3.8);for(const zz of [-1,1])part(root,'box','#8e734c',0,1.65,zz,1.7,.15,.15);}
 if(kind==='siege_tower'){part(root,'box','#876745',0,2.4,0,2.25,4,2.4);for(const h of [1.4,2.65,4.1])part(root,'box','#6c5136',0,h,0,2.5,.2,2.7);part(root,'box','#66533e',0,4.55,1.35,1.5,.18,2);}
 body.scale.setScalar(.72);root.userData.siegeModel=true;
}
let horseLegs=[];if(riding){part(root,'sphere','#765440',0,.67,0,.34,.38,.8);part(root,'box','#4c3e31',0,1.01,0,.5,.12,.55);part(root,'sphere','#806048',0,1.03,.57,.2,.42,.23);part(root,'sphere','#977457',0,1.35,.71,.18,.2,.32);for(const side of [-1,1])for(const zz of [-.5,.5]){const limb=new T.Group();limb.position.set(side*.22,.62,zz);root.add(limb);part(limb,'box','#624a3a',0,-.24,0,.12,.5,.13);part(limb,'box','#302f29',0,-.56,.025,.15,.14,.19);horseLegs.push(limb)}part(root,'box','#382c24',0,.75,-.77,.1,.6,.1)}
if(kind==='motorized'){
 // Light wheeled armoured carrier; crew is visible through the roof hatch.
 part(root,'box','#607873',0,.62,0,1.45,.65,2.55,true);
 part(root,'box','#78918a',0,1.07,-.43,1.32,.44,1.38,true);
 part(root,'box','#b0cad0',0,1.02,.31,1.08,.32,.10,true);
 part(root,'box','#465852',0,1.15,-.64,.60,.18,.72,true);
 for(const side of [-1,1])for(const zz of [-.77,.77]){
  const wheel=part(root,'cylinder','#2b3334',side*.86,.37,zz,.36,.16,.36);wheel.rotation.z=Math.PI/2;
  part(root,'cylinder','#929e9b',side*.96,.37,zz,.16,.17,.16,true).rotation.z=Math.PI/2;
 }
 for(const xx of [-.43,.43])part(root,'box','#f2e9b6',xx,.74,1.31,.20,.13,.06);
 body.scale.setScalar(.68);
}
// Distinct equipment for the new era rosters.
if(originalKind==='chariot'){
 part(root,'box','#9a7543',0,.55,-1,1.8,.2,1.6);part(root,'box','#ad864d',0,1,-1.7,1.8,.9,.12);
 for(const side of [-1,1]){part(root,'cylinder','#60452d',side,.5,-1,.6,.15,.6).rotation.z=Math.PI/2;part(root,'box','#8e7047',side*.65,.65,.2,.09,.09,2.6);}
}
if(['field_cannon','industrial_artillery','machinegun_team','rocket_team','tank'].includes(originalKind)){
 const tank=originalKind==='tank',gun=originalKind==='machinegun_team',rocket=originalKind==='rocket_team';
 if(tank){part(root,'box','#4e624a',0,.85,0,2.2,.65,3.3,true);for(const side of [-1,1])part(root,'box','#333a32',side*1.1,.42,0,.45,.6,3.5);part(root,'cylinder','#66775a',0,1.5,0,.8,.55,.8,true);body.visible=false;}
 else if(!rocket){part(root,'box','#665d45',0,.5,.5,gun?.7:1.6,.15,1.8);for(const side of [-1,1])part(root,'cylinder','#433d32',side*(gun?.4:.9),.5,0,.5,.15,.5).rotation.z=Math.PI/2;body.position.x=-1;}
 const barrel=part(rocket?arms[1]:root,'cylinder',rocket?'#62714e':'#434c42',0,rocket?-.2:tank?1.55:1.1,rocket?.4:1,rocket?.15:gun?.07:.2,rocket?1.2:gun?1.3:2.8,rocket?.15:gun?.07:.2,true);barrel.rotation.x=Math.PI/2;
}
root.userData.unitKind=originalKind;root.userData.grade=grade;
if(grade==='elite'){part(head,'box','#d6b558',0,.46,0,.25,.15,.26,true);part(body,'box','#d6b558',-.16,.86,.2,.12,.15,.04,true);}
if(grade==='mobilized')part(body,'box','#84745d',0,.72,.22,.46,.55,.04);
root.position.set(x,0,z);root.userData.rig={body,head,legs,arms,horseLegs,riding,kind,phase:x*2+z,archetype:rig.archetype};parent.add(root);return root}
export function animateSoldier(root,time,moving=false,attack=false){const r=root.userData.rig;if(!r)return;const p=time*8+r.phase,step=(moving&&r.kind!=='motorized')?Math.sin(p)*.48:0,phase=typeof attack==='object'?attack.phase:(attack?.4:-1),active=phase>=0&&phase<=1;r.legs.forEach((v,i)=>v.rotation.x=step*(i?1:-1));r.arms.forEach((v,i)=>{v.rotation.set(-step*(i?1:-1),0,0);v.position.z=0});r.body.rotation.set(0,0,0);if(r.head)r.head.rotation.set(.035*Math.sin(time*1.4+r.phase),.055*Math.sin(time*.82+r.phase),0);
if(active){if(['musketeer','rifleman','motorized'].includes(r.kind)){r.arms[0].rotation.x=-1.25;r.arms[1].rotation.x=-1.35;r.body.rotation.y=-.04*Math.sin(phase*Math.PI);r.body.rotation.x=phase>.65?-.07:0}else if(['archer','crossbowman'].includes(r.kind)){const draw=phase<.65?phase/.65:Math.max(0,(1-phase)/.35);r.arms[0].rotation.x=-1.55;r.arms[0].rotation.z=.12;r.arms[1].rotation.x=-1.4;r.arms[1].rotation.z=-.65*draw;r.arms[1].position.z=-.22*draw;r.body.rotation.y=-.2*draw}else{const swing=Math.sin(phase*Math.PI);r.arms[1].rotation.x=-2.3+phase*2.8;r.arms[1].rotation.z=.65*swing;r.arms[0].rotation.x=-.5;r.body.rotation.y=-.3+.7*phase;r.body.rotation.x=.1*swing}}
const action=typeof attack==='object'?attack.action:null,cycle=time*2*Math.PI+r.phase;if(action&&!moving){r.arms.forEach(a=>a.rotation.set(0,0,0));r.body.rotation.set(0,0,0);if(action==='fishing'){const cast=(Math.sin(time*.8+r.phase)+1)/2;r.arms[1].rotation.x=-.7-cast*.9;r.arms[0].rotation.x=-.75;r.body.rotation.x=.05+.06*Math.sin(time*.8)}else if(['chop','mine','build','forge','hunt','train'].includes(action)){const stroke=(Math.sin(cycle*(action==='build'?1.5:1))+1)/2;r.arms[1].rotation.x=-.25-stroke*(action==='chop'?2.2:1.8);r.arms[1].rotation.z=.2*Math.sin(cycle);r.arms[0].rotation.x=['mine','chop'].includes(action)?-.3-stroke*1.4:-.8;r.body.rotation.x=.08+(1-stroke)*.16;r.body.rotation.y=.12*Math.sin(cycle)}else if(['gather','plant','farm'].includes(action)){r.body.rotation.x=.35+.18*Math.sin(cycle*.7);r.arms[0].rotation.x=-.35+.45*Math.sin(cycle);r.arms[1].rotation.x=-.35-.45*Math.sin(cycle);r.legs[0].rotation.x=.12;r.legs[1].rotation.x=-.12}else if(action==='water'){r.arms[0].rotation.x=-1+Math.sin(cycle)*.6;r.arms[1].rotation.x=-1-Math.sin(cycle)*.6;r.body.rotation.x=.1}else if(action==='saw'){r.arms[0].rotation.x=-1;r.arms[1].rotation.x=-1;r.arms[0].position.z=Math.sin(cycle)*.18;r.arms[1].position.z=Math.sin(cycle)*.18;r.body.rotation.x=.12}else if(action==='mill'){r.arms[0].rotation.x=-1+Math.sin(cycle)*.3;r.arms[1].rotation.x=-1+Math.cos(cycle)*.3;r.arms[1].rotation.z=Math.sin(cycle)*.3}else{r.arms[0].rotation.x=-.8+Math.sin(cycle)*.25;r.arms[1].rotation.x=-.8-Math.sin(cycle)*.25;r.body.rotation.x=.1}}if(action==='carry'){r.arms[0].rotation.x=-.9;r.arms[1].rotation.x=-.9}if(attack?.hit)r.body.rotation.x=-.2;if(moving&&r.head)r.head.rotation.x=.04+.045*Math.sin(p); r.horseLegs.forEach((v,i)=>v.rotation.x=moving?Math.sin(p+i*Math.PI*.7)*.5:0);r.body.position.y=(r.kind==='motorized'?1.22:r.riding?.85:0)+(moving?Math.abs(Math.sin(p))*.035:Math.sin(time*2+r.phase)*.008)}
export function addTree(parent,x,y,z,seed=0,scale=1){
 // V48 artist-authored quad mesh shared between every nearby tree (also exported as GLB).
 const broadleaf=(Math.floor(Math.abs(seed)*3)%4!==0);
 const model=createV48Mesh(broadleaf?'oak_1000_3':'pine_1000_3');
 model.position.set(x,y,z);model.rotation.y=seed*.39;
 model.scale.setScalar(scale*(broadleaf?2.1:1.85));
 parent.add(model);return model;
}
