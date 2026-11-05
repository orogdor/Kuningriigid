/* V295: improve the existing research dialog instead of creating a duplicate HUD.
   The full decorative frame is exactly one image at any given breakpoint.
   All discovery cards and queue buttons are the existing live game elements.
 */
(()=>{
 'use strict';
 if(typeof window!=='undefined'&&window.KINGDOMS_UI304)return;
 'use strict';
 function init(){
  const panel=document.getElementById('researchpanel');
  const screen=panel?.querySelector('.research-window');
  if(!panel||!screen)return;
  screen.classList.add('v294-research-screen','v295-research-screen');
  // V294 left the close hotspot inside a pointer-events:none title row and
  // positioned it using percentages of that narrow row. Make it a direct
  // child of the image-backed screen so it is tappable on Android.
  const close=document.getElementById('closeresearch');
  if(close&&close.parentElement!==screen){
    screen.append(close); // preserves its existing game click listener
  }
  if(close){
    close.type='button';
    close.textContent='✕';
    close.setAttribute('aria-label','Sulge avastuste menüü');
    close.title='Sulge avastuste menüü';
  }
  const title=document.getElementById('researchtitle');
  if(title)title.textContent='AVASTUSED';
  const map=document.getElementById('researchtree');
  if(map){
    map.setAttribute('aria-label','Tehnoloogiapuu. Puuduta avastuse pilti, et näha tingimusi ja alustada uurimist.');
  }
  const queue=document.getElementById('researchqueue');
  if(queue){
    queue.setAttribute('aria-label','Üks aktiivne ja neli järgmist uurimust');
  }
  panel.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&!panel.hidden){
      close?.click();
      e.preventDefault();
    }
  });
  // Prevent touch-scrolling on the painted frame from scrolling the map behind
  // the dialog; tree and inspector each have their own scroll region.
  panel.addEventListener('touchmove',e=>{
    if(e.target===panel||e.target===screen)e.preventDefault();
  },{passive:false});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
 else init();
})();