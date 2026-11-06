// Web fullscreen needs a user gesture. Borderless desktop mode needs the native shell.
export const DISPLAY_MODE_KEY_V334='kingdoms-display-mode-v334';
export function displayCapabilitiesV334(host=globalThis){
 const native=typeof host.KuningriigidWindow?.setMode==='function';
 return {native,fullscreen:native||!!host.document?.fullscreenEnabled,borderless:native};
}
export async function applyDisplayModeV334(mode,host=globalThis){
 if(!['windowed','fullscreen','borderless'].includes(mode))throw Error('Tundmatu kuvarežiim.');
 const caps=displayCapabilitiesV334(host),doc=host.document;
 if(caps.native){
  const result=await host.KuningriigidWindow.setMode(mode);
  if(!result?.ok)throw Error(result?.error||'Kuvarežiimi ei saanud muuta.');
 }else if(mode==='borderless')throw Error('Aknata täisekraan vajab uuendatud Windowsi rakendust.');
 else if(mode==='fullscreen'){
  if(!caps.fullscreen||!doc.documentElement?.requestFullscreen)throw Error('See seade ei toeta brauseri täisekraani.');
  if(!doc.fullscreenElement)await doc.documentElement.requestFullscreen();
 }else if(doc.fullscreenElement)await doc.exitFullscreen();
 try{host.localStorage.setItem(DISPLAY_MODE_KEY_V334,mode)}catch{}
 return mode;
}
export function savedDisplayModeV334(host=globalThis){
 try{const mode=host.localStorage.getItem(DISPLAY_MODE_KEY_V334);return ['windowed','fullscreen','borderless'].includes(mode)?mode:'windowed'}catch{return 'windowed'}
}
