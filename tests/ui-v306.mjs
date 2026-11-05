import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const root=new URL('../',import.meta.url),read=p=>readFileSync(new URL(p,root),'utf8');
const source=read('ui-v306.js');
function load(enabled){const window={KINGDOMS_UI304:enabled};const document={readyState:'loading',addEventListener(){}};new Function('window','document',source)(window,document);return window;}
assert.equal(load(false).KuningriigidArtV306,undefined,'Classic mode keeps its own presentation');
const art=load(true).KuningriigidArtV306;
const icons=['city','build','recruit','trade','info','workers','resources','world','science','journal','explore','guard','diplomacy','move','attack','stop','focus'];
for(const icon of icons){const path=art.actionSrc(icon);assert.ok(path&&existsSync(new URL(path,root)),icon+' has real artwork');assert.ok(path.endsWith('.webp'),icon+' uses raster painting');}
assert.notEqual(art.pauseSrc(true),art.pauseSrc(false),'Paused state shows resume rather than pause');
assert.ok(existsSync(new URL(art.pauseSrc(true),root)));assert.ok(existsSync(new URL(art.pauseSrc(false),root)));
assert.equal(art.portraitSrc({kind:'unit'},'actual-unit.webp'),'actual-unit.webp','Selection keeps its real unit portrait');
assert.match(art.portraitSrc({kind:'none'},''),/kingdom_portrait\.webp$/);
let total=0;
for(const key of ['cities','build','armies','trade','diplomacy','journal']){
 const b=readFileSync(new URL('ui-art-v306/card_'+key+'.webp',root));total+=b.length;
 assert.equal(b.toString('ascii',0,4),'RIFF');assert.equal(b.toString('ascii',8,12),'WEBP');
 assert.ok(b.length>40000&&b.length<250000,key+' is a detailed optimized painting');
}
assert.ok(total<1500000,'Six command cards remain reasonably sized');
for(const [,path] of read('ui-v306.css').matchAll(/url\(['"]?([^)'"?]+)/g))assert.ok(existsSync(new URL(path,root)),path);
const html=read('index.html');assert.ok(html.indexOf('ui-v306.js')>html.indexOf('ui-v304.js'));
console.log(`PASS V306: 17 painted action paths, classic isolation, real selection portrait, distinct pause/resume art and six cards (${Math.round(total/1024)} KB)`);
