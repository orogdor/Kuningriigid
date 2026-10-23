import fs from 'node:fs';import crypto from 'node:crypto';
import {Civilization,TROOPS} from '../civilization-core.js';
const file='scenarios/iron-ai-v129.json',raw=fs.readFileSync(file),g=new Civilization(JSON.parse(raw)),s=g.s;
g.refreshTerritory();
const cities=s.cities.map(c=>{const tiles=[...g.territory].filter(([,o])=>o.id===c.id).map(([key])=>{const[c,r]=key.split(':').map(Number);return {c,r}});return {id:c.id,name:c.name,team:c.team,c:c.c,r:c.r,urban:tiles.filter(p=>!g.isCountyTile(p,c)).length,county:tiles.filter(p=>g.isCountyTile(p,c)).length,nearest:Math.min(...s.cities.filter(x=>x!==c).map(x=>Math.max(Math.abs(x.c-c.c),Math.abs(x.r-c.r))))};});
const units=s.units.filter(u=>u.team===1&&u.hp>0&&u.kind!=='scout'),data={version:'V129',turn:s.ironAITestV128.turn,ironDiscoveries:s.ironAITestV128.knownIronTechs+'/'+s.ironAITestV128.ironTechs,sha256:crypto.createHash('sha256').update(raw).digest('hex'),bytes:raw.length,target:{team:1,cities:cities.filter(c=>c.team===1).length,combatSquads:units.length,ironSquads:units.filter(u=>TROOPS[u.kind]?.age===2).length},cities};
fs.writeFileSync('scenarios/iron-ai-v129.manifest.json',JSON.stringify(data,null,2));console.log(JSON.stringify(data));
