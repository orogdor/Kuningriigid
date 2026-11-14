/* V306: the selected illustrated reference is the layout contract.
 * V304 continues to own live data and command dispatch; this file only arranges
 * its DOM and adds navigation to the restored image frames. */
(()=>{
 'use strict';
 if(!window.KINGDOMS_UI304)return;
 const $=id=>document.getElementById(id),tr=(et,en)=>(document.documentElement.lang||'en').startsWith('et')?et:en;
 const img=(src,cls='')=>{const n=document.createElement('img');n.src=src;n.alt='';n.draggable=false;n.className=cls;return n;};
  // V350: change-only writes, see ui-write-v350.js.
 const W=window.KuningriigidUiWriteV350||{text(n,v){if(n)n.textContent=v;},attr(n,k,v){n?.setAttribute(k,v);},prop(n,k,v){if(n)n[k]=v;},data(n,k,v){if(n)n.dataset[k]=v;}};
 const click=id=>{const b=$(id);if(b&&!b.disabled)b.click();};
 const button=(label,src,action)=>{const b=document.createElement('button');b.type='button';b.title=label;b.setAttribute('aria-label',label);b.append(img(src));b.onclick=action;return b;};
 const paintedActions={city:'cmd_city',build:'cmd_build',recruit:'cmd_army',trade:'res_gold',info:'cmd_city',workers:'unit_worker',resources:'res_wood',world:'cmd_map',science:'cmd_research',journal:'cmd_research',explore:'cmd_explore',guard:'cmd_stop'};
 window.KuningriigidArtV306={
  actionSrc(icon){return ['move','attack','stop','focus'].includes(icon)?'ui-art-v303/action_'+icon+'.webp':icon==='diplomacy'?'ui-art-v306/card_diplomacy.webp':paintedActions[icon]?'ui-art-v263/'+paintedActions[icon]+'.webp':null;},
  portraitSrc(selection,original){return selection.kind==='none'?'ui-art-v306/kingdom_portrait.webp':original;},
  pauseSrc(paused){return 'ui-art-v306/'+(paused?'play':'pause')+'.webp';}
 };
 function boot(){
  const root=$('v304-hud');if(!root)return;
  document.body.classList.add('v306-active');
  const top=root.querySelector('.v304-top'),brand=root.querySelector('.v304-brand');
  brand.replaceChildren(img('ui-art-v291/header_brand.webp'));
  const keys=['bread','wood','stone','gold','population','science'];
  root.querySelectorAll('.v304-resource').forEach((b,i)=>{b.dataset.hudResource=keys[i];});
  const pause=root.querySelector('.v304-pause'),menu=root.querySelector('.v304-menu');
  pause.replaceChildren(img('ui-art-v306/pause.webp','v306-pause-art'));
  menu.replaceChildren(img('ui-art-v306/settings.webp'));
  const research=root.querySelector('.v304-discoveries');
  research.prepend(img('ui-art-v302/research.webp','v306-frame'));
  const allResearch=button(tr('Kõik avastused','All discoveries'),'ui-art-v291/research_city.webp',()=>window.openKuningriigidResearchV296?.());
  allResearch.className='v306-all-research';research.append(allResearch);
  const mini=root.querySelector('.v304-map');mini.prepend(img('ui-art-v302/minimap.webp','v306-frame'));
  const selection=root.querySelector('.v304-selection');selection.prepend(img('ui-art-v302/selection.webp','v306-frame'));
  const selectedImage=selection.querySelector('.v304-selection-head>img');
  const selectionMenu=button(tr('Menüü ja seaded','Menu and settings'),'ui-art-v306/settings.webp',()=>click('menubtn'));
  selectionMenu.className='v306-selection-menu';selection.append(selectionMenu);
  const mapTools=root.querySelector('.v304-map-tools');
  mapTools.append(button(tr('Ressursid kaardil','Map resources'),'ui-art-v291/map_show.webp',()=>click('hud-resource-toggle')));
  const shortcuts=root.querySelector('.v304-map-shortcuts');
  shortcuts.children[0].title=tr('Vaheta kaarti','Switch map');
  const rail=document.createElement('div');rail.className='v306-bottom-rail';rail.setAttribute('aria-hidden','true');root.prepend(rail);
  const cards=root.querySelectorAll('.v304-command');
  for(const b of cards){
   const picture=b.querySelector('img');picture.src='ui-art-v306/card_'+b.dataset.action+'.webp';
   // Captions are part of the painted card. Accessible labels stay on buttons.
   b.querySelector('.v304-command-label').hidden=true;
  }
  const readable={cities:['Linnad, ehitamine ja kaardid','Cities, construction and maps'],build:['Ehitus ja rajatised','Construction and structures'],armies:['Armeed','Armies'],trade:['Kaubandus','Trade'],diplomacy:['Diplomaatia','Diplomacy'],journal:['Sündmuste logi','Event journal']};
  function sync(){
   const state=window.kingdomsUiV288?.snapshot?.();
   for(const b of cards){const label=tr(...readable[b.dataset.action]);W.attr(b,'title',label);W.attr(b,'aria-label',label);}
   const copy=research.querySelector('.v304-research-copy>small:first-child');if(copy)W.text(copy,tr('Avastus:','Discovery:'));
   const mobileLabels=[['Avastused','Research'],['Kaart','Map'],['Valik','Selection']];
   root.querySelectorAll('.v304-mobile-tools button').forEach((b,i)=>{const label=tr(...mobileLabels[i]);W.attr(b,'title',label);W.attr(b,'aria-label',label);W.text(b.querySelector('span'),label);});
   if(state){
    W.data(root,'selectionKind',state.selection?.kind||'none');
    W.data(root,'view',state.view);
    // The large portrait is always real selection art. An empty selection shows
    // the illustrated kingdom overview instead of magnifying a tiny map icon.
    const kind=state.selection?.kind;
    if(kind==='none'&&selectedImage.getAttribute('src')!=='ui-art-v306/kingdom_portrait.webp')selectedImage.src='ui-art-v306/kingdom_portrait.webp';
    W.data(pause,'paused',String(!!state.paused));
    W.attr(pause,'aria-label',state.paused?tr('Jätka mängu','Resume game'):tr('Peata mäng','Pause game'));
    if(!pause.querySelector('img'))pause.append(img(window.KuningriigidArtV306.pauseSrc(state.paused),'v306-pause-art'));
   }
  }
  // V304 reads the art hooks above on each state update; geometry stays in CSS.
  sync();setInterval(sync,500);
  new MutationObserver(sync).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  window.KuningriigidUIV306={sync};
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
