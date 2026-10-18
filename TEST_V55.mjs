import assert from 'node:assert/strict';
import {Civilization,createGame} from './civilization-core.js';
import {COLS,ROWS} from './campaign.js';
import {collectLandmark,findExplorationPath} from './world-discoveries.js';

for(const seed of [17,12345,777]){
 const game=new Civilization(createGame(seed));const land=game.cells.filter(c=>c.land),rivers=land.filter(c=>c.river),mountains=land.filter(c=>c.mountain);
 assert.equal(game.cells.length,COLS*ROWS);assert(rivers.length>60&&rivers.length<land.length/3);assert(mountains.length>50);
 assert.equal(game.s.landmarks.length,43);assert(game.s.landmarks.some(l=>l.kind==='village'));assert(game.s.landmarks.some(l=>l.kind==='ruins'));
 const map=new Map(game.s.landmarks.map(l=>[l.id,l]));assert.equal(map.size,43);
 for(const site of game.s.landmarks){const cell=game.cell(site);assert(cell.land&&!cell.mountain&&!cell.river);assert.equal(site.claimedBy,null)}
 for(const cell of rivers) {assert(cell.riverTo);const to=game.cell(cell.riverTo);assert(to);assert.equal(Math.abs(to.c-cell.c)+Math.abs(to.r-cell.r),1)}
 // Collect a ruin after moving onto it; rewards must not repeat, even after save and reload.
 const village=game.s.landmarks.find(l=>l.kind==='village'),settler=game.s.settlers[0];settler.c=village.c;settler.r=village.r;
 const once=collectLandmark(game,0,settler);assert(once?.text.includes('küla'));assert.equal(village.claimedBy,0);
 assert.equal(collectLandmark(game,0,settler),null);
 const saved=JSON.parse(JSON.stringify(game.s));const reopened=new Civilization(saved);
 assert.equal(reopened.s.landmarks.find(l=>l.id===village.id).claimedBy,0);
 const scout=reopened.s.armies[0];const before=Object.keys(reopened.s.explored[0]).length;
 reopened.refreshVision();const path=findExplorationPath(reopened,scout);assert(path?.length>0,'Scout should have reachable frontier');
 for(const step of path)assert(reopened.canTraverse(0,step));
 scout.autoExplore=true;scout.path=[];reopened.tick(2);assert(scout.path.length>0,'Automatic discovery should schedule a path');
 reopened.tick(3);const after=Object.keys(reopened.s.explored[0]).length;assert(after>before,'Exploring should expand visible land');
 console.log(JSON.stringify({seed,rivers:rivers.length,mountains:mountains.length,landmarks:game.s.landmarks.length,exploredBefore:before,exploredAfter:after}));
}
console.log('V55 PASS: hydrology, ridges, sites, one-time rewards, persistent state, autonomous scouting');
