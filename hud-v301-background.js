/* V301: single clean picture-backdrop for the desktop illustrated HUD.
 * Pixel coordinates were matched to the supplied 1672x941 UI reference.
 * New image covers UI chrome ONLY; central alpha lets the live map render.
 * The bottom UI was shortened 20%, its controls move with it.
 */
(()=>{
 'use strict';
 if(typeof window!=='undefined'&&window.KINGDOMS_UI304)return;
 'use strict';
 const W=1672,H=941,SPLIT=510;
 const $=(root,selector)=>root?.querySelector(selector);
 const $$=(root,selector)=>[...(root?.querySelectorAll(selector)||[])];
 const cardDefs=[
  ['card_cities',  [354,708,139,171], 'city',      'Linnad','Cities'],
  ['card_build',   [510,708,139,171], 'build',     'Ehitus','Build'],
  ['card_armies',  [665,708,139,171], 'recruit',   'Armeed','Armies'],
  ['card_trade',   [820,708,139,171], 'trade',     'Kaubandus','Trade'],
  ['card_diplomacy',[976,708,139,171],'diplomacy','Diplomaatia','Diplomacy'],
  ['card_journal', [1131,708,139,171],'journal',  'Sündmused','Journal']
 ];
 const positionDefs=[
  ['.v291-research-background',[4,62,237,322],false],
  ['.v291-minimap-frame',[0,605,343,311],true],
  ['.v291-selection-frame',[1288,605,384,311],true]
 ];
 let root,upper,lower,lastMode=false;
 const tr=(ee,en)=>(document.documentElement.lang||'en').startsWith('et')?ee:en;
 const responsive=()=>{
  const w=innerWidth,h=innerHeight;
  return w<1000||h<640||h>w||(typeof window.matchMedia==='function'&&window.matchMedia('(pointer: coarse)').matches);
 };
 function plate(id){const d=document.createElement('div');d.id=id;d.setAttribute('aria-hidden','true');root.prepend(d);return d;}
 function set(node,prop,value){node?.style.setProperty(prop,value,'important');}
 function geometry(node,rect,s,dx,dy){
  if(!node)return;
  const [x,y,w,h]=rect;
  set(node,'left',(dx+x*s)+'px');set(node,'top',(dy+y*s)+'px');
  set(node,'width',(w*s)+'px');set(node,'height',(h*s)+'px');
  set(node,'position','absolute');
 }
 function clearGeometry(node){
  if(!node)return;
  for(const p of ['left','top','width','height','position'])node.style.removeProperty(p);
 }
 function fillCards(){
  for(const [id,rect,icon,ee,en] of cardDefs){
   const b=$(root,'.v291-card[data-action="'+id+'"]');if(!b)continue;
   let im=$(b,'.v301-card-icon');if(!im){
    im=document.createElement('img');im.className='v301-card-icon';
    im.alt='';im.setAttribute('aria-hidden','true');im.draggable=false;
    im.src='ui-art-v300/action_'+icon+'.svg';b.append(im);
   }
   let cap=$(b,'.v301-card-caption');if(!cap){
    cap=document.createElement('span');cap.className='v301-card-caption';b.append(cap);
   }
   cap.textContent=tr(ee,en);
  }
  const symbols={map_zoom_in:'+',map_camera:'⌖',map_show:'☷'};
  for(const [art,symbol] of Object.entries(symbols)){
   const el=$(root,'[data-art="'+art+'"]');if(el)el.dataset.v301Icon=symbol;
  }
 }
 function update(){
  if(window.KuningriigidV302?.active)return;
  if(!root)return;
  const active=!responsive();
  root.classList.toggle('v301-picture',active);
  const world=$(root,'.v291-world');
  if(world)world.dataset.v301Title=tr('Maailmakaart','World map');
  for(const [id,rect,icon,ee,en] of cardDefs){
   const b=$(root,'.v291-card[data-action="'+id+'"]');
   const cap=$(b,'.v301-card-caption');if(cap)cap.textContent=tr(ee,en);
  }
  const positions=positionDefs.map(([selector,rect,bottom])=>[$(root,selector),rect,bottom]);
  const cards=cardDefs.map(([id,rect])=>[$(root,'.v291-card[data-action="'+id+'"]'),rect,true]);
  if(!active){
   upper.style.display='none';lower.style.display='none';
   if(lastMode){for(const [node] of [...positions,...cards])clearGeometry(node);}
   lastMode=false;return;
  }
  const s=Math.min(innerWidth/W,innerHeight/H);
  const dx=Math.max(0,(innerWidth-W*s)/2),dy=Math.max(0,innerHeight-H*s);
  const bgSize=(W*s)+'px '+(H*s)+'px';
  upper.style.display='block';lower.style.display='block';
  geometry(upper,[0,0,W,SPLIT],s,dx,0);
  geometry(lower,[0,SPLIT,W,H-SPLIT],s,dx,dy);
  set(upper,'background-size',bgSize);set(upper,'background-position','0 0');
  set(lower,'background-size',bgSize);set(lower,'background-position','0 -'+(SPLIT*s)+'px');
  for(const [node,rect,bottom] of [...positions,...cards])geometry(node,rect,s,dx,bottom?dy:0);
  lastMode=true;
 }
 function boot(){
  root=document.getElementById('v291-hud');if(!root)return;
  lower=plate('v301-backdrop-bottom');upper=plate('v301-backdrop-top');
  fillCards();update();
  addEventListener('resize',update,{passive:true});
  addEventListener('orientationchange',update,{passive:true});
  window.visualViewport?.addEventListener('resize',update,{passive:true});
  new MutationObserver(update).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  // V298 may replace inline bounds when switching from portrait to desktop.
  setInterval(()=>{if(document.body.classList.contains('v291-active'))update();},1600);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();