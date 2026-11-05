/* V303: illustrated controls retain existing click handlers and selection rules. */
(()=>{
 'use strict';
 if(typeof window!=='undefined'&&window.KINGDOMS_UI304)return;
 'use strict';
 const BASE='ui-art-v303/', VERSION='?v=303a';
 const CARDS={card_cities:'card_cities',card_build:'card_build',card_armies:'card_armies',
 card_trade:'card_trade',card_diplomacy:'card_diplomacy',card_journal:'card_journal'};
 const MAP={map_zoom_in:'map_zoom_in',map_camera:'map_center',map_show:'map_layers'};
 const PAINTED_ACTIONS=new Set(['move','attack','stop','focus']);
 const artForAction=icon=>PAINTED_ACTIONS.has(icon)?BASE+'action_'+icon+'.webp'+VERSION:null;
 window.KuningriigidArtV303={artForAction,cardIds:Object.keys(CARDS),mapIds:Object.keys(MAP)};
 const pic=(button,cls,filename)=>{
  if(!button)return null;
  let img=button.querySelector('img.'+cls);
  if(!img){img=document.createElement('img');img.className=cls;img.alt='';img.draggable=false;
   img.setAttribute('aria-hidden','true');button.append(img);}
  const src=BASE+filename+'.webp'+VERSION;
  if(img.getAttribute('src')!==src)img.setAttribute('src',src);
  return img;
 };
 function boot(){
  const root=document.getElementById('v291-hud');if(!root)return;
  for(const [id,file] of Object.entries(CARDS)){
   const button=root.querySelector('.v291-card[data-action="'+id+'"]');
   if(button){pic(button,'v303-card-art',file);button.classList.add('v303-ready');}
  }
  for(const [id,file] of Object.entries(MAP)){
   pic(root.querySelector('.v291-minimap-button[data-art="'+id+'"]'),'v303-round-art',file);
  }
  pic(root.querySelector('.v292-zoom-out'),'v303-round-art','map_zoom_out');
  pic(root.querySelector('.v291-unit-info'),'v303-round-art','action_focus');
  for(const button of root.querySelectorAll('.v291-unit-button')){
   const original=button.querySelector('img.v291-sprite');
   function sync(){
    const icon=original?.getAttribute('src')?.match(/action_([a-z]+)\.svg(?:\?|$)/)?.[1]||'';
    if(artForAction(icon)){
     pic(button,'v303-action-art','action_'+icon);button.dataset.v303Art=icon;
    }else{
     delete button.dataset.v303Art;
     const painted=button.querySelector('.v303-action-art');
     if(painted)painted.hidden=true;
    }
    if(artForAction(icon)){
     const painted=button.querySelector('.v303-action-art');if(painted)painted.hidden=false;
    }
   }
   sync();
   if(original)new MutationObserver(sync).observe(original,{attributes:true,attributeFilter:['src']});
  }
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
 else boot();
})();