// V354: which game buildings take a house designer model, and that the
// designer page answers model requests (static checks, no browser).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {designerIdV354,canDesignV354,designKeyV354,hitsDesignedWallsV354} from '../house-designs-v354.js';
assert.equal(designerIdV354('hall',0),'hall');
assert.equal(designerIdV354('hall',1),'hall@1');
assert.equal(designerIdV354('hall',2),'hall@2');
assert.equal(designerIdV354('library',1),'library');
assert.equal(designerIdV354('library',2),'library@2');
assert.equal(designerIdV354('library',0),'library','with no Stone Age version the nearest era is used');
assert.equal(designerIdV354('forester',0),'forester');
assert.equal(designerIdV354('smith',2),'smith');
assert.equal(designerIdV354('hall',3),null,'later ages keep the game models');
assert.equal(designerIdV354('bridge',1),null,'the bridge follows the river and keeps its game model');
for(const type of ['palisade','stonewall','watchtower','field','market','fisher','harbor','gatehouse','woodgate','pasture'])assert.ok(designerIdV354(type,1),type+' is drawn by the designer');
const design={id:'hall',rooms:[],wallStyle:'clay'};
assert.equal(designKeyV354(design),designKeyV354(design));
assert.notEqual(designKeyV354(design),designKeyV354({...design,wallStyle:'stone'}));
// Walk collision: one wall along x from -2 to 2 at z=0, radius .2, building turned 90°.
const model={position:{x:10,z:5},rotation:{y:Math.PI/2},scale:{x:1,z:1},userData:{houseDesignV354:{collision:[[-2,0,2,0,.2]]}}};
assert.equal(hitsDesignedWallsV354(model,10,5),true,'on the wall');
assert.equal(hitsDesignedWallsV354(model,10,6),true,'turned wall runs along z in the world');
assert.equal(hitsDesignedWallsV354(model,11,5),false,'beside the turned wall');
assert.equal(hitsDesignedWallsV354({position:{x:0,z:0},rotation:{y:0},scale:{x:1,z:1},userData:{}},0,0),null,'no designer walls');
const page=fs.readFileSync(new URL('../majaehitaja/index.html',import.meta.url),'utf8');
assert.match(page,/async exportModel\(state,display\)/);
assert.match(page,/type!=='model'/);
assert.match(page,/const collision=walkWalls\.filter/,'the designer sends its walk-mode walls');
assert.match(page,/if\(designerWorker\|\|view!=='plan'/,'the worker page never draws plan thumbnails into the export scene');
assert.match(page,/openDoors=true/,'exported doors stand open');
assert.match(page,/<html lang="en">/,'the designer is in English');
assert.doesNotMatch(page.slice(page.indexOf("<script>'use strict'"),page.indexOf('</script><script>(()=>{')),/'[^'\n]*[õäöü][^'\n]*'/,'no Estonian texts left in the designer code');
const civ=fs.readFileSync(new URL('../civilization.js',import.meta.url),'utf8');
assert.match(civ,/houseDesignStampV354\(b\.type,age,b\.houseDesignV354,b\.woodFortTierV1757\)/,'stream tiles rebuild when the model is ready');
assert.match(civ,/entry\.designStamp!==designStamp/,'the active tile rebuilds when the model is ready');
assert.match(civ,/applyDesignTemplateV354\(r\.building,city\)/,'a placed building takes the type design');
assert.match(civ,/v354-design-icon/,'build menu cards have a design icon');
console.log('PASS: walk collision, build menu design, designer ids, kept game models, design keys, designer export hooks, rebuild stamps');
