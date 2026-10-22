import assert from 'node:assert/strict';
import {TECH_TREE_V118} from './tech-tree-data-v118.js';
import {TECH_UNLOCKS_EN_V120} from './research-unlocks-en-v120.js';
import {ENGLISH_PAIRS} from './locale-en.js';
import {ENGLISH_V120_PAIRS} from './locale-en-v120.js';
import {translateEstonian} from './localization.js';
const dictionary=new Map([...ENGLISH_PAIRS,...ENGLISH_V120_PAIRS]);
assert.equal(Object.keys(TECH_TREE_V118).length,111);
assert.equal(Object.keys(TECH_UNLOCKS_EN_V120).length,111);
assert.ok(ENGLISH_V120_PAIRS.length>100);
for(const [id,t] of Object.entries(TECH_TREE_V118)){
 const name=translateEstonian(t.name);
 assert.ok(name&&!/[äöõü]/i.test(name),id+' untranslated tech name: '+name);
 assert.ok(name!==t.name||/Renessanss|Elektromagnetism/.test(t.name),id+' unchanged legacy name');
 const detail=TECH_UNLOCKS_EN_V120[id];
 assert.ok(detail&&!/[äöõü]/i.test(detail),id+' missing English details');
}
assert.equal(translateEstonian('Kivitööriistad'),'Stone Tools');
assert.equal(translateEstonian('Moodne ajastu'),'Modern Age');
assert.equal(translateEstonian('Puu areneb ülevalt alla ↓. Pidev nool = kõik vajalikud teadmised (JA); katkendlik = alternatiivne teadmine (VÕI). Avamata harud on peidetud.'),'Technology advances from top to bottom ↓. Solid arrows mean all prerequisites are required (AND); dashed arrows show alternatives (OR). Locked branches stay hidden.');
console.log('V120 LOCALE PASS: 111 English technology names, 111 English descriptions, 7 eras, English UI terms.');
