import fs from 'node:fs';
import {Civilization} from '../civilization-core.js';
import {urbanExpansionEligible} from '../historic-urban-v138.js';
const s=JSON.parse(fs.readFileSync('scenarios/ai-city-v138.json'));
const game=new Civilization(s);
for(const city of game.s.cities.filter(c=>c.team===0)){
 const area=game.constructionArea(city),r=city.economy.realms[city.team];
 const eligible=area.tiles.filter(p=>game.isCountyTile(p,city)&&urbanExpansionEligible(game,city,p));
 const food=Object.entries(r.resources).filter(([k])=>['bread','grain','meat','fish','berries','vegetables'].includes(k)).reduce((a,[,v])=>a+(v||0),0);
 const urban=[city,...Object.values(city.districts||{})].filter(ctx=>!game.isCountyTile(ctx,city)).map(ctx=>({tile:[ctx.c,ctx.r],n:ctx.economy.buildings.filter(b=>!b.virtual&&b.hp>0).length,h:ctx.economy.buildings.filter(b=>b.type==='house'&&b.hp>0).length}));
 console.log('V138 EXPANSION '+JSON.stringify({name:city.name,pop:r.pop,houses:game.allBuildings(city).filter(b=>b.type==='house'&&b.hp>0).length,food,wood:r.resources.wood,pending:area.pending.length,eligible:eligible.map(x=>[x.c,x.r]),urban}));
}
