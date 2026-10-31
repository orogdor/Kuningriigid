/* V227 WebGPU recovery. Loaded as classic script before the optional GPU import map. */
(function(){
 const params=new URLSearchParams(location.search);
 let prefs={};try{prefs=JSON.parse(localStorage.getItem('kingdoms-graphics-v226')||'{}')||{}}catch{}
 const wants=params.get('gpu')==='1'||(params.get('gpu')!=='0'&&(prefs.renderer==='webgpu'||localStorage.getItem('kingdoms-gpu')==='1'));
 let failed=false;
 function recover(reason){
  if(!wants||failed)return;
  failed=true;
  const message=String(reason?.message||reason||'3D renderdus ei käivitunud').slice(0,240);
  console.error('[Kuningriigid] WebGPU 3D failed, switching to WebGL:',reason);
  try{
   localStorage.removeItem('kingdoms-gpu');
   const stored=JSON.parse(localStorage.getItem('kingdoms-graphics-v226')||'{}');
   stored.renderer='webgl';
   localStorage.setItem('kingdoms-graphics-v226',JSON.stringify(stored));
   sessionStorage.setItem('kingdoms-gpu-error-v227',message);
  }catch{}
  const url=new URL(location.href);url.searchParams.set('gpu','0');url.searchParams.set('gpuFallback','1');
  location.replace(url.toString());
 }
 window.KINGDOMS_WEBGPU_RECOVER_V227=recover;
 window.KINGDOMS_WEBGPU_WANTED_V227=wants;
 // V244: no global error/unhandledrejection triggers any more. Any unrelated game error (a missing
 // model file, an aborted download, a typo containing the word "material") used to switch the
 // player back to WebGL. Only real renderer failures call recover(): WebGPU init failure, device
 // loss and a rejected renderAsync (vendor/three-gpu-shim.js, graphics-runtime-v226.js).
 function banner(){
  if(params.get('gpuFallback')!=='1')return;
  const el=document.createElement('aside');el.id='webgpu-recovery-v227';
  el.style.cssText='position:fixed;top:10px;left:50%;transform:translateX(-50%);max-width:min(90vw,720px);z-index:9999;background:#432d20;color:#fff3cd;border:1px solid #e6ac75;padding:11px 14px;border-radius:8px;box-shadow:0 3px 15px #0006;font:13px system-ui';
  let msg='';try{msg=sessionStorage.getItem('kingdoms-gpu-error-v227')||''}catch{}
  el.textContent='WebGPU 3D-renderdus ei käivitunud. Mäng avati turvaliselt WebGL-iga. '+msg+' ';
  const close=document.createElement('button');close.textContent='Sulge';close.type='button';close.style.cssText='margin-left:10px;padding:5px 8px;cursor:pointer';close.onclick=()=>el.remove();el.append(close);
  document.body.append(el);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',banner,{once:true});else banner();
})();
