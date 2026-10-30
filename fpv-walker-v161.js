// V161: walk the detail map in first person.
// "Walk" places a character on the detail map (click where to put it) and switches the camera to
// its eyes. WASD / arrows move, the mouse looks around (click to lock the pointer), Shift runs,
// Space jumps, Esc returns to the strategy camera. On touch screens the left half of the screen
// is a move stick and the right half turns the view. The character stays where you leave it.
// Presentation only: the character is not a game unit and is never saved.
import * as T from './vendor/three.module.js';
import {createSoldier,animateSoldier} from './visuals.js';

const MOVE_KEYS=new Set(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft','ShiftRight','Space']);

export function createWalker({scene,canvas,ground,blocked,onExit,onPlace,say,onToggleNames,getNamesEnabled}){
 const model=new T.Group();model.name='v161 walker';model.visible=false;
 const body=new T.Group();createSoldier(body,0,0,'#c9a46a','stone_settler');model.add(body);scene.add(model);
 const rig=body.children[0];
 // Detail units correspond to about 1.05 metres; match the other Stone Age people.
 const height=1.66,eye=height*.90;
 const pos=new T.Vector3(),vel=new T.Vector3();let yaw=0,pitch=-.08,vy=0,airborne=false,placed=false,active=false,placing=false,time=0,bob=0,moving=false;
 const keys=new Set();const stick={id:null,x:0,y:0,dx:0,dy:0},look={id:null,x:0,y:0};let drag=null;
 let saved=null;

 // ---------------------------------------------------------------- HUD
 const hud=document.createElement('div');hud.id='fpv-hud';hud.hidden=true;
 hud.innerHTML='<div class="fpv-cross"></div><div class="fpv-bar"><b>First person</b><span class="fpv-help">WASD move · mouse look (click to lock) · Shift run · Space jump · Esc exit</span><button type="button" data-fpv="names" aria-pressed="true">Nimed: sees</button><button type="button" data-fpv="place">Move character</button><button type="button" data-fpv="exit">Exit</button></div><div class="fpv-stick" hidden><i></i></div>';
 document.body.append(hud);
 const stickEl=hud.querySelector('.fpv-stick'),knob=stickEl.querySelector('i');
 const namesButton=hud.querySelector('[data-fpv="names"]');
 function refreshNamesButton(){
  const enabled=getNamesEnabled?.()!==false;
  namesButton.textContent=enabled?'Nimed: sees':'Nimed: väljas';
  namesButton.setAttribute('aria-pressed',String(enabled));
  namesButton.title='Lülita sõdurite nimed sisse või välja';
 }
 namesButton.onclick=()=>{onToggleNames?.();refreshNamesButton();};
 refreshNamesButton();
 hud.querySelector('[data-fpv="exit"]').onclick=()=>exit();
 hud.querySelector('[data-fpv="place"]').onclick=()=>{exit();startPlacing();};
 const hint=document.createElement('div');hint.id='fpv-place-hint';hint.hidden=true;hint.textContent='Click on the map where the character should stand · Esc cancels';document.body.append(hint);

 // ---------------------------------------------------------------- input (capture phase: the game never sees FPV input)
 const onCanvas=e=>e.target===canvas;
 function keydown(e){
  if(placing&&e.code==='Escape'){e.preventDefault();e.stopImmediatePropagation();cancelPlacing();return;}
  if(!active)return;
  const editing=['INPUT','TEXTAREA','SELECT'].includes(e.target?.tagName);if(editing)return;
  if(e.code==='Escape'){e.preventDefault();e.stopImmediatePropagation();exit();return;}
  if(MOVE_KEYS.has(e.code)||/^Key[A-Z]$/.test(e.code)||/^Digit/.test(e.code)||['Equal','Minus','Enter','Home','NumpadAdd','NumpadSubtract'].includes(e.code)){
   e.preventDefault();e.stopImmediatePropagation();keys.add(e.code);
   if(e.code==='Space'&&!airborne){vy=height*3.1;airborne=true;}
  }
 }
 function keyup(e){if(!active)return;if(keys.has(e.code)){keys.delete(e.code);e.preventDefault();e.stopImmediatePropagation();}}
 function pointerdown(e){
  if(placing&&onCanvas(e)){e.stopImmediatePropagation();e.preventDefault();placeAtPointer=e;return;}
  if(!active||!onCanvas(e))return;e.stopImmediatePropagation();e.preventDefault();
  if(e.pointerType==='touch'){
   if(e.clientX<innerWidth*.5&&stick.id==null){stick.id=e.pointerId;stick.x=e.clientX;stick.y=e.clientY;stick.dx=stick.dy=0;stickEl.hidden=false;stickEl.style.left=(e.clientX-55)+'px';stickEl.style.top=(e.clientY-55)+'px';knob.style.transform='';}
   else if(look.id==null){look.id=e.pointerId;look.x=e.clientX;look.y=e.clientY;}
   return;
  }
  if(document.pointerLockElement!==canvas&&canvas.requestPointerLock){try{const r=canvas.requestPointerLock();r?.catch?.(()=>{});}catch{}}
  drag={x:e.clientX,y:e.clientY};
 }
 function pointermove(e){
  if(!active)return;
  if(e.pointerType==='touch'){
   if(e.pointerId===stick.id){stick.dx=Math.max(-50,Math.min(50,e.clientX-stick.x));stick.dy=Math.max(-50,Math.min(50,e.clientY-stick.y));knob.style.transform=`translate(${stick.dx}px,${stick.dy}px)`;}
   else if(e.pointerId===look.id){turn((e.clientX-look.x)*.006,(e.clientY-look.y)*.005);look.x=e.clientX;look.y=e.clientY;}
   if(onCanvas(e)){e.stopImmediatePropagation();e.preventDefault();}return;
  }
  if(document.pointerLockElement===canvas){turn(e.movementX*.0024,e.movementY*.0022);e.stopImmediatePropagation();return;}
  if(drag&&onCanvas(e)){turn((e.clientX-drag.x)*.005,(e.clientY-drag.y)*.004);drag.x=e.clientX;drag.y=e.clientY;e.stopImmediatePropagation();}
 }
 function pointerup(e){
  if(e.pointerId===stick.id){stick.id=null;stick.dx=stick.dy=0;stickEl.hidden=true;}
  if(e.pointerId===look.id)look.id=null;
  if(active&&onCanvas(e)){e.stopImmediatePropagation();drag=null;}
 }
 function wheel(e){if((active||placing)&&onCanvas(e)){e.stopImmediatePropagation();e.preventDefault();}}
 function click(e){if((active||placing)&&onCanvas(e))e.stopImmediatePropagation();}
 let placeAtPointer=null;
 addEventListener('keydown',keydown,true);addEventListener('keyup',keyup,true);
 addEventListener('pointerdown',pointerdown,true);addEventListener('pointermove',pointermove,true);addEventListener('pointerup',pointerup,true);addEventListener('pointercancel',pointerup,true);
 addEventListener('wheel',wheel,{capture:true,passive:false});addEventListener('click',click,true);addEventListener('dblclick',click,true);addEventListener('contextmenu',e=>{if(active&&onCanvas(e)){e.preventDefault();e.stopImmediatePropagation();}},true);
 addEventListener('blur',()=>keys.clear());

 function turn(dx,dy){yaw-=dx;pitch=Math.max(-1.35,Math.min(1.2,pitch-dy));}

 // ---------------------------------------------------------------- placing
 function startPlacing(){placing=true;hint.hidden=false;document.body.classList.add('fpv-placing');}
 function cancelPlacing(){placing=false;placeAtPointer=null;hint.hidden=true;document.body.classList.remove('fpv-placing');}
 // pick(e) -> {x,z} on the ground, supplied by the game each frame while placing
 function pollPlacing(pick){
  if(!placing||!placeAtPointer)return false;const e=placeAtPointer;placeAtPointer=null;const p=pick(e);
  if(!p){say?.('Pick a spot on the ground.');return false;}
  if(blocked(p.x,p.z)){say?.('The character cannot stand there (building or water).');return false;}
  cancelPlacing();place(p.x,p.z,.54);enter(); /* face the way the strategy camera looked */onPlace?.();return true;
 }
 function place(x,z,faceYaw=null){pos.set(x,ground(x,z),z);placed=true;if(faceYaw!=null)yaw=faceYaw;model.visible=!active;syncModel();}

 // ---------------------------------------------------------------- enter / exit
 function enter(){if(!placed)return startPlacing();refreshNamesButton();active=true;keys.clear();model.visible=false;hud.hidden=false;document.body.classList.add('fpv-mode');}
 function exit(){if(!active)return;active=false;keys.clear();drag=null;stick.id=look.id=null;stickEl.hidden=true;
  if(document.pointerLockElement===canvas)document.exitPointerLock?.();
  hud.hidden=true;document.body.classList.remove('fpv-mode');model.visible=placed;syncModel();onExit?.(pos);}

 // ---------------------------------------------------------------- simulation
 function syncModel(){model.position.copy(pos);model.rotation.y=yaw+Math.PI;}
 const fwd=new T.Vector3(),side=new T.Vector3();
 function update(dt){
  time+=dt;
  if(!placed)return;
  if(!active){animateSoldier(rig,time,false);return;}
  dt=Math.min(dt,.1);
  let mx=0,mz=0;
  if(keys.has('KeyW')||keys.has('ArrowUp'))mz+=1;if(keys.has('KeyS')||keys.has('ArrowDown'))mz-=1;
  if(keys.has('KeyD')||keys.has('ArrowRight'))mx+=1;if(keys.has('KeyA')||keys.has('ArrowLeft'))mx-=1;
  if(stick.id!=null){mx+=stick.dx/50;mz-=stick.dy/50;}
  const len=Math.hypot(mx,mz);if(len>1){mx/=len;mz/=len;}
  const run=keys.has('ShiftLeft')||keys.has('ShiftRight')||(stick.id!=null&&Math.hypot(stick.dx,stick.dy)>46);
  const speed=height*(run?5.6:2.4);
  fwd.set(-Math.sin(yaw),0,-Math.cos(yaw));side.set(Math.cos(yaw),0,-Math.sin(yaw));
  const want=new T.Vector3().addScaledVector(fwd,mz*speed).addScaledVector(side,mx*speed);
  vel.lerp(want,1-Math.exp(-dt*(airborne?2:12)));
  moving=vel.lengthSq()>.04;
  // slide along obstacles: try each axis on its own
  const nx=pos.x+vel.x*dt,nz=pos.z+vel.z*dt;
  if(!blocked(nx,pos.z))pos.x=nx;else vel.x=0;
  if(!blocked(pos.x,nz))pos.z=nz;else vel.z=0;
  const gy=ground(pos.x,pos.z);
  vy-=height*9.5*dt;pos.y+=vy*dt;
  if(pos.y<=gy){pos.y=gy;vy=0;airborne=false;}
  if(moving&&!airborne)bob+=dt*(run?13:8.5);
  syncModel();
 }
 const look3=new T.Vector3();
 function applyCamera(camera){
  if(!saved)saved={fov:camera.fov,near:camera.near,far:camera.far};
  const b=moving&&!airborne?Math.sin(bob)*height*.025:0;
  camera.position.set(pos.x,pos.y+eye+b,pos.z);
  look3.set(pos.x-Math.sin(yaw)*Math.cos(pitch),pos.y+eye+b+Math.sin(pitch),pos.z-Math.cos(yaw)*Math.cos(pitch));
  camera.lookAt(look3);
  if(camera.fov!==68||camera.near!==.05||camera.far!==2400){camera.fov=68;camera.near=.05;camera.far=2400;camera.updateProjectionMatrix();}
 }
 function restoreCamera(camera){if(!saved)return;camera.fov=saved.fov;camera.near=saved.near;camera.far=saved.far;camera.updateProjectionMatrix();saved=null;}
 // the detail map re-centres on a new tile: shift the character by the tile offset
 function shift(dx,dz,inside){if(!placed)return;pos.x-=dx;pos.z-=dz;if(!inside(pos.x,pos.z)){if(active)exit();placed=false;model.visible=false;return;}syncModel();}
 function remove(){if(active)exit();cancelPlacing();placed=false;model.visible=false;}
 return {model,update,applyCamera,restoreCamera,enter,exit,startPlacing,cancelPlacing,pollPlacing,place,shift,remove,
  get active(){return active},get placing(){return placing},get placed(){return placed},get position(){return pos},get yaw(){return yaw},refreshNamesButton,eye};
}
