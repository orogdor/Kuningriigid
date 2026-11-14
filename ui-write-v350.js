/* V350: change-only DOM writes for the HUD.
 * The HUD refreshes on timers. Writing a value that is already there still creates a
 * mutation record, so the localization and art observers ran and style was recalculated
 * although nothing changed. These helpers write only when the requested value differs
 * from the previous request. If another writer or the translator changed the element
 * afterwards, the first repeated call records that state (`seen`); the element is written
 * again only when it later differs from it. */
(()=>{
 'use strict';
 const texts=new WeakMap(),attrs=new WeakMap();
 function text(el,value){
  if(!el)return false;
  value=String(value??'');
  const now=el.textContent,c=texts.get(el);
  if(c&&c.req===value){if(c.seen===undefined)c.seen=now;if(now===c.seen)return false;}
  else if(!c&&now===value){texts.set(el,{req:value,seen:now});return false;}
  el.textContent=value;texts.set(el,{req:value,seen:undefined});return true;
 }
 function attr(el,name,value){
  if(!el)return false;
  value=String(value??'');
  let map=attrs.get(el);if(!map){map=new Map();attrs.set(el,map);}
  const now=el.getAttribute(name),c=map.get(name);
  if(c&&c.req===value){if(c.seen===undefined)c.seen=now;if(now===c.seen)return false;}
  else if(!c&&now===value){map.set(name,{req:value,seen:now});return false;}
  el.setAttribute(name,value);map.set(name,{req:value,seen:undefined});return true;
 }
 // Boolean and plain properties reflect to attributes; assign only on change.
 function prop(el,name,value){if(!el||el[name]===value)return false;el[name]=value;return true;}
 function data(el,name,value){value=String(value??'');if(!el||el.dataset[name]===value)return false;el.dataset[name]=value;return true;}
 window.KuningriigidUiWriteV350={text,attr,prop,data};
})();
