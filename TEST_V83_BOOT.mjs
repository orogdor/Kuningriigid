// Exercise the boot boundary without relying on WebGL or a display server.
// The real browser/device regression remains TEST_V83_MENU.mjs.
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync('boot-v83.js','utf8');
for(const success of [true,false]){
 const elements=new Map();
 const element=id=>elements.get(id)||elements.set(id,{id,disabled:true,hidden:id==='startmenu',classList:{add(name){this.name=name}},append(child){this.child=child}}).get(id);
 const sandbox={document:{getElementById:element,createElement:()=>({})},window:{},console:{error(){}},location:{reload(){}}};
 const context=vm.createContext(sandbox);
 const mod=new vm.SourceTextModule(source,{context,importModuleDynamically:async()=>{
  if(!success)throw Error('Simulated import/WebGL startup failure');
  sandbox.window.gameDebug={};
  const child=new vm.SyntheticModule([],()=>{},{context});await child.link(()=>{});await child.evaluate();return child;
 }});
 await mod.link(()=>{});await mod.evaluate();
 assert.equal(element('continue').disabled,!success);
 assert.equal(element('newgame').disabled,!success);
 assert.equal(element('menu-status').hidden,success);
 if(!success){assert.equal(element('startmenu').hidden,false);assert.equal(element('menu-status').classList.name,'menu-error');assert.ok(element('menu-status').child.textContent)}
}
console.log('V83 BOOT PASS: ready state, failed imports, visible recovery and disabled game actions');
