import assert from 'node:assert/strict';
import {ENGLISH_PAIRS} from './locale-en.js';
import {translateEstonian,currentLanguage} from './localization.js';
import {BUILDINGS,TROOPS,AGES,RESOURCE_NAMES} from './civilization-core.js';
import {TECHS} from './research.js';

assert.equal(currentLanguage(),'en','default language must be English');
assert.ok(ENGLISH_PAIRS.length>=550,'Broad coverage for the game UI and descriptions');
const common={
 'KUNINGRIIGID':'KINGDOMS',
 'Kiviaeg':'Stone Age',
 'Kivitöö':'Stoneworking',
 'Linna juhtimine':'City Management',
 'Puidust kaitsemüür':'Wooden Palisade',
 'Soomustöökoda':"Armorer's Workshop",
 'Tugevdatud linnamüür':'Reinforced City Wall',
 'Ristvibumees':'Crossbowman',
 'Maailma tüüp':'World Type',
 'Juhuslikud 2–4 kontinenti':'Random 2–4 Continents',
 'Jätka praegust mängu':'Continue Game',
 'Tööjõud ja tootmine':'Labor and Production'
};
for(const [source,target] of Object.entries(common))assert.equal(translateEstonian(source),target,source);
for(const [collection,label] of [[BUILDINGS,'building'],[TROOPS,'unit'],[TECHS,'technology'],[RESOURCE_NAMES,'resource']]){
 for(const [id,item]of Object.entries(collection)){
  const name=typeof item==='string'?item:item.name;
  const translated=translateEstonian(name);
  assert.ok(!/[õäöüÕÄÖÜ]/.test(translated),label+' untranslated: '+id+' -> '+name+' -> '+translated);
  assert.ok(translated.length>0,label+' empty name '+id);
 }
}
for(const a of AGES)assert.ok(!/[õäöüÕÄÖÜ]/.test(translateEstonian(a.name)));
assert.equal(translateEstonian('V63 · Tavaline tempo · suurem maailm · avastamata alad on joonistatud kaardistiilis · teadus 0.0 p/min').includes('larger world'),true);
console.log('V63 PASS: English defaults, '+ENGLISH_PAIRS.length+' strings, every building, troop, research and resource');
