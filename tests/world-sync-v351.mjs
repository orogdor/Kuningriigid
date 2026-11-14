// V351: static wiring of the change-driven world map sync.
// Run: node tests/world-sync-v351.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=f=>fs.readFileSync(new URL('../'+f,import.meta.url),'utf8');
const atlas=read('atlas-style.js'),civ=read('civilization.js'),index=read('index.html'),boot=read('boot-v83.js');
// territory: chunk cache instead of a whole-world rebuild
assert.ok(atlas.includes("import {createTerritoryChunksV351} from './territory-chunks-v351.js'"));
assert.ok(!atlas.includes('disposeGroup(territories)'),'territory meshes are no longer thrown away as a whole');
assert.ok(!/regionFill\(cellRegion\(/.test(atlas),'no whole-realm region pass is left in atlas-style.js');
assert.ok(atlas.includes('territoryChunks.work(territoryBuilt?TERRITORY_BUDGET_MS:Infinity)'),'later territory changes have a frame budget');
// roads: the network is rebuilt when a piece becomes known, not for every discovered cell
const roads=atlas.slice(atlas.indexOf(' function roads(state){'),atlas.indexOf(' const territories=new T.Group()'));
assert.ok(roads.includes('if(raw===roadRaw)return')&&roads.includes("const stamp=(state.roadRevision||0)+':'+(state.railRevision||0)+':'+known;"));
assert.ok(roads.indexOf('if(stamp===roadStamp)return')<roads.indexOf('createUnifiedRoadNetwork'));
// resource icons and farmland
const res=civ.slice(civ.indexOf('function refreshResourceArea(){'),civ.indexOf('// V157: farmland'));
assert.ok(res.indexOf('if(!forcedV351&&knownV351===resourceAreaKnownV351)return')<res.indexOf('worldScene.remove(sprite)'),'icons are kept when the known cells around the focus are the same');
const cult=civ.slice(civ.indexOf('function refreshCultivation(){'),civ.indexOf('function worldSync(){'));
assert.ok(cult.includes('for(const [key,city] of game.territory)')&&cult.indexOf('if(same)return')<cult.indexOf('setCultivation(v)'),'farmland texture is uploaded only when it changed');
// discovery log: game.reveal() tells the vision delta which cells are new
const core=read('civilization-core.js'),fog=read('fog-delta-v88.js');
assert.ok(core.includes("import {noteDiscoveredV351} from './fog-delta-v88.js'")&&core.includes("noteDiscoveredV351(this.s.explored[0],c+':'+r)"));
assert.ok(fog.indexOf('revision-this.revision===log.length-this.logged')<fog.indexOf('Object.keys(explored)'),'the log is tried before the full comparison');
// version and cache keys
// (later releases bump the title and the atlas-style key; both atlas-style aliases must point to one current file)
assert.match(index,/<title>Kuningriigid · V3\d\d<\/title>/);assert.match(index,/KUNINGRIIGID · V3\d\d/);
{const a=index.match(/"\.\/atlas-style\.js": "\.\/atlas-style\.js\?v=(\d+)a"/),b=index.match(/"\.\/atlas-style\.js\?v=162a": "\.\/atlas-style\.js\?v=(\d+)a"/);assert.ok(a&&b&&a[1]===b[1]&&+a[1]>=351,'atlas-style cache key');}
// startup and main module keys are bumped together each release (tests/autosave-v338.mjs checks they match)
{const k=index.match(/boot-v83\.js\?v=(\d+)a/)?.[1];assert.ok(+k>=351);assert.ok(index.includes('"./civilization.js?v=118a": "./civilization.js?v='+k+'a"'));assert.ok(boot.includes("import('./civilization.js?v="+k+"a')"));}
for(const key of ['"./fog-delta-v88.js": "./fog-delta-v88.js?v=351"','"./civilization-core.js": "./civilization-core.js?v=351a"'])assert.ok(index.includes(key),key);
assert.ok(!index.includes('atlas-style.js?v=328a')&&!index.includes('civilization.js?v=350a')&&!index.includes('civilization-core.js?v=346a'));
console.log('PASS V351 change-driven world map sync wiring');
