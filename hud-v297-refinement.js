/* V297: hotspot geometry follows the actual painted source images.
 * These are transparent click targets over EXISTING artwork: no duplicate icon sprites.
 * The same pictures remain in desktop, mobile landscape, and mobile portrait.
 */
(()=>{
 'use strict';
 const $=id=>document.getElementById(id);
 const root=()=> $('v291-hud');
 function position(button,frame,w,h,rect){
  if(!button||!frame||!frame.getClientRects().length)return;
  const b=frame.getBoundingClientRect();
  const vals={
   left:(b.left+rect[0]*b.width/w)+'px',
   top:(b.top+rect[1]*b.height/h)+'px',
   width:(rect[2]*b.width/w)+'px',
   height:(rect[3]*b.height/h)+'px',right:'auto',bottom:'auto'
  };
  for(const [k,v] of Object.entries(vals))button.style.setProperty(k,v,'important');
 }
 const icon=(hud,id)=>hud.querySelector('[data-art="'+id+'"]');
 function redraw(){
  const hud=root();
  if(!hud||!document.body.classList.contains('v291-active'))return;
  const research=hud.querySelector('.v291-research-background');
  if(research?.getClientRects().length){
   position(hud.querySelector('.v291-research-main'),research,208,286,[24,4,173,153]);
   const circles={
    research_compass:[2,152,53,56],research_tools:[42,160,58,61],
    research_gate:[84,159,55,63],research_ship:[123,152,55,59],
    research_city:[163,149,47,54]
   };
   for(const [id,rect] of Object.entries(circles))position(icon(hud,id),research,208,286,rect);
  }
  // Three buttons are already painted in the minimap frame.
  const map=hud.querySelector('.v291-minimap-frame');
  for(const [id,rect] of Object.entries({
   map_zoom_in:[211,39,61,62],map_camera:[234,88,67,59],map_show:[232,144,70,67]
  }))position(icon(hud,id),map,311,238,rect);
  // Four command buttons are ALREADY painted in the selection frame.
  const selection=hud.querySelector('.v291-selection-frame');
  for(const [id,rect] of Object.entries({
   cmd_attack:[20,64,68,68],cmd_move:[83,24,69,69],
   cmd_defend:[20,129,68,68],cmd_city:[82,128,71,69]
  }))position(icon(hud,id),selection,379,234,rect);
  const selected=selection?.querySelector('.v291-selected-text');
  if(selected)selected.setAttribute('aria-live','polite');
 }
 function schedule(){requestAnimationFrame(()=>{redraw();requestAnimationFrame(redraw);});}
 function start(){
  if(!root())return;
  schedule();
  addEventListener('resize',schedule,{passive:true});
  addEventListener('orientationchange',schedule,{passive:true});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule();});
  new MutationObserver(schedule).observe(document.body,{attributes:true,attributeFilter:['class']});
  new MutationObserver(schedule).observe(root(),{attributes:true,attributeFilter:['class']});
  setInterval(()=>{if(document.body.classList.contains('v291-active'))redraw();},1600);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();