import fs from 'node:fs';import assert from 'node:assert/strict';
import {Civilization} from './civilization-core.js';import {localVisualSurface} from './continuous-landscape.js';
const game=new Civilization(JSON.parse(fs.readFileSync('scenarios/ai-mountain-v176.json'))),city=game.s.cities[0],all=game.defenseBuildingsV177(city),walls=all.filter(b=>b.type==='palisade'&&b.hp>0&&b.ready),towers=all.filter(b=>b.type==='watchtower'&&b.hp>0&&b.ready);
assert.ok(towers.length>=4);for(const t of towers)assert.ok(walls.some(w=>Math.hypot(w.x-t.x,w.z-t.z)<.1),'tower occupies the wall line');
const ends=walls.filter(b=>b.cliffEmbedStartV179||b.cliffEmbedEndV179);assert.equal(ends.length,2,'both ends extend into the mountain');
for(const b of ends){const sign=b.cliffEmbedEndV179?1:-1,extension=b.cliffEmbedEndV179||b.cliffEmbedStartV179,angle=b.wallAngleV175,half=b.palisadeSpanV167/2;const height=t=>localVisualSurface(game,game.cell(city),b.x+sign*Math.cos(angle)*t,b.z-sign*Math.sin(angle)*t);assert.ok(extension>=5);assert.ok(height(half+extension)>height(0)+3,'rock rises over the embedded wall');}
console.log('V179 CLIFF EMBED AND WALL TOWERS PASS',JSON.stringify({towers:towers.length,embeddedEnds:ends.length}));
