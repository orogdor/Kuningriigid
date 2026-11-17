// V354: which game buildings take a house designer model, and that the
// designer page answers model requests (static checks, no browser).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {designerIdV354,canDesignV354,designKeyV354} from '../house-designs-v354.js';
assert.equal(designerIdV354('hall',0),'hall');
assert.equal(designerIdV354('hall',1),'hall@1');
assert.equal(designerIdV354('hall',2),'hall@2');
assert.equal(designerIdV354('library',1),'library');
assert.equal(designerIdV354('library',2),'library@2');
assert.equal(designerIdV354('library',0),null,'a bronze age building has no stone age design');
assert.equal(designerIdV354('smith',2),'smith');
assert.equal(designerIdV354('hall',3),null,'later ages keep the game models');
for(const kept of ['palisade','stonewall','watchtower','field','bridge','market','fisher','harbor'])assert.equal(canDesignV354(kept,1),false,kept+' keeps its game model');
const design={id:'hall',rooms:[],wallStyle:'clay'};
assert.equal(designKeyV354(design),designKeyV354(design));
assert.notEqual(designKeyV354(design),designKeyV354({...design,wallStyle:'stone'}));
const page=fs.readFileSync(new URL('../majaehitaja/index.html',import.meta.url),'utf8');
assert.match(page,/async exportModel\(state,display\)/);
assert.match(page,/type!=='model'/);
assert.match(page,/if\(designerWorker\|\|view!=='plan'/,'the worker page never draws plan thumbnails into the export scene');
const civ=fs.readFileSync(new URL('../civilization.js',import.meta.url),'utf8');
assert.match(civ,/houseDesignStampV354\(b\.type,age,b\.houseDesignV354\)/,'stream tiles rebuild when the model is ready');
assert.match(civ,/entry\.designStamp!==designStamp/,'the active tile rebuilds when the model is ready');
console.log('PASS: designer ids, kept game models, design keys, designer export hooks, rebuild stamps');
