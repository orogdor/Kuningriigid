import assert from 'node:assert/strict';
import {applyDisplayModeV334,displayCapabilitiesV334,savedDisplayModeV334} from '../display-mode-v334.js';

const values=new Map(),storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)};
const doc={fullscreenEnabled:true,fullscreenElement:null};
doc.documentElement={async requestFullscreen(){doc.fullscreenElement=this}};
doc.exitFullscreen=async()=>{doc.fullscreenElement=null};
const browser={document:doc,localStorage:storage};
assert.equal(displayCapabilitiesV334(browser).borderless,false);
await applyDisplayModeV334('fullscreen',browser);
assert.equal(doc.fullscreenElement,doc.documentElement);
assert.equal(savedDisplayModeV334(browser),'fullscreen');
await applyDisplayModeV334('windowed',browser);
assert.equal(doc.fullscreenElement,null);
await assert.rejects(applyDisplayModeV334('borderless',browser),/Windowsi/);
assert.equal(savedDisplayModeV334(browser),'windowed');

let mode;
const desktop={document:doc,localStorage:storage,KuningriigidWindow:{async setMode(value){mode=value;return {ok:true}}}};
assert.equal(displayCapabilitiesV334(desktop).borderless,true);
await applyDisplayModeV334('borderless',desktop);
assert.equal(mode,'borderless');
assert.equal(savedDisplayModeV334(desktop),'borderless');
desktop.KuningriigidWindow.setMode=async()=>({ok:false,error:'Keelatud'});
await assert.rejects(applyDisplayModeV334('fullscreen',desktop),/Keelatud/);
assert.equal(savedDisplayModeV334(desktop),'borderless');
console.log('PASS V334 browser fullscreen, desktop mode and failures');
