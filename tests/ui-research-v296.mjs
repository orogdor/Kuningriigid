// V296: actual game research opener must work even when hidden legacy button is inaccessible.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const html=read('index.html'),boot=read('boot-v83.js'),core=read('civilization.js');
const hud=read('hud-v291.js'),mobile=read('hud-v292-mobile.js'),queue=read('hud-v293-research.js');
const liveVersion=Number((html.match(/<title>Kuningriigid · V([0-9]+)<\/title>/)||[])[1]);
assert.ok(liveVersion>=296,'Page version must include research opening fix');
assert.ok(html.includes('id="menu-version">KUNINGRIIGID · V'+liveVersion+'<'));
for(const p of ['boot-v83.js','hud-v291.js','hud-v292-mobile.js','hud-v293-research.js']){
 assert.match(html,new RegExp(p.replace('.','\\.')+'\\?v=\\d{3,}[a-z]?'));
}
assert.match(boot,/await import\('\.\/civilization\.js\?v=\d{3,}[a-z]?'\)/);
assert.match(core,/window\.openKuningriigidResearchV296=openResearch/);
assert.match(hud,/const openResearch=\(\)=>\{const real=window\.openKuningriigidResearchV296/);
assert.match(hud,/['"]v291-research-main['"][^]{0,200}openResearch\(\)/);
assert.match(mobile,/if\(kind==='science'\)\{const real=window\.openKuningriigidResearchV296/);
assert.match(queue,/if\(panel\?\.hidden\)\{const real=window\.openKuningriigidResearchV296/);
// Exercise the real game's unmodified opener with a simulated panel and render callback.
const definition=core.match(/function openResearch\(\)\{[^}]+\}/)?.[0];
assert.ok(definition,'Live game openResearch function missing');
let rendered=0,focused=0;
const elements={researchpanel:{hidden:true},closeresearch:{focus(){focused++;}}};
const gameOpen=new Function('$','renderUI',definition+';return openResearch;')(
 id=>elements[id],()=>{rendered++;}
);
gameOpen();
assert.equal(elements.researchpanel.hidden,false);
assert.equal(rendered,1,'Opening research must render real technology tree');
assert.equal(focused,1,'Close control must receive focus');
// Exercise V291's button adapter: it prefers the live game API over a hidden/disabled button.
const adapter=hud.match(/^ const openResearch=.*;$/m)?.[0];
assert.ok(adapter,'HUD research adapter missing');
let calls=0;
const bridge=new Function('window','original',adapter+';return openResearch;')(
 {openKuningriigidResearchV296(){calls++;}},()=>{throw new Error('Should not use legacy hidden toggle');}
);
assert.equal(bridge(),true);
assert.equal(calls,1);
console.log('V296: real game research dialog and illustrated HUD bridge both open correctly.');
