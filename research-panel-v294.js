/* V294: install the single illustrated research menu image.
 * The existing research logic, technology tree and clickable discoveries remain live.
 * No second overlay is created: only one background image under those elements.
 */
(()=>{
 'use strict';
 function init(){
  const panel=document.getElementById('researchpanel');
  const windowEl=panel?.querySelector('.research-window');
  if(!windowEl)return;
  windowEl.classList.add('v294-research-screen');
  const title=document.getElementById('researchtitle');
  if(title)title.textContent='AVASTUSED';
  const tree=document.getElementById('researchtree');
  if(tree)tree.setAttribute('aria-label','Avastuste puu — puuduta avastust, et uurida või järjekorda lisada');
  const guide=windowEl.querySelector('.research-guide');
  if(guide)guide.open=false;
  const queue=document.getElementById('researchqueue');
  if(queue)queue.setAttribute('aria-label','Aktiivne uurimus ja neli järgmist');
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
 else init();
})();
