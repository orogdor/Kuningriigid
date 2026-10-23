import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Civilization,BUILDINGS} from './civilization-core.js';
import {FOOD_KEYS} from './economy.js';
import {findAIFieldSite} from './ai-rural-v143.js';
function fixture(){const g=new Civilization(JSON.parse(fs.readFileSync('scenarios/ai-modern-v140.json')));const home=g.s.cities.find(c=>c.team===0);g.s.cities=[home];g.transferCity(home,1);g.s.ages[1]=6;g.s.research[1]=structuredClone(g.s.research[0]);g.s.winner=null;for(const ctx of g.contexts(home))ctx.economy.buildings=ctx.economy.buildings.filter(b=>b.ready||b.virtual);const stock=home.economy.realms[1].resources;for(const k of Object.keys(stock))stock[k]=3000;g.refreshTerritory();return {g,home,stock,tiles:g.constructionArea(home).tiles.map(p=>g.cell(p)).filter(p=>p.land&&!p.mountain)};}
for(const countyOnly of [false,true]){
 const {g,home,stock,tiles}=fixture();
 const target=tiles.find(t=>Math.max(Math.abs(t.c-home.c),Math.abs(t.r-home.r))>=3&&g.landPath(home,t,home.team)&&(!countyOnly||g.isCountyTile(t,home))&&t.deposits.ore&&!g.contextAt(t,false)?.economy.buildings.some(b=>!b.virtual&&b.hp>0));assert.ok(target,'real distant ore deposit exists');
 for(const ctx of g.contexts(home))ctx.economy.buildings=ctx.economy.buildings.filter(b=>b.type!=='mine');
 for(const tile of tiles)if(tile!==target)tile.deposits.ore=0;
 stock.ore=0;g.aiDistricts();
 const ctx=g.contextAt(target,false),mine=ctx?.economy.buildings.find(b=>b.type==='mine'&&b.hp>0);
 assert.ok(mine,'AI really orders a mine on the remote owned deposit');assert.equal(mine.ready,false);assert.ok(stock.wood<3000,'normal construction costs paid');
 console.log('V143 REMOTE MINE PASS',JSON.stringify({distance:Math.max(Math.abs(target.c-home.c),Math.abs(target.r-home.r)),rural:g.isCountyTile(target,home)}));
}
{
 const {g,home,stock,tiles}=fixture();
 for(const ctx of g.contexts(home))ctx.economy.buildings=ctx.economy.buildings.filter(b=>!['farm','field'].includes(b.type));
 let target=null;
 for(const tile of tiles.filter(t=>Math.max(Math.abs(t.c-home.c),Math.abs(t.r-home.r))>=3&&g.landPath(home,t,home.team)&&g.isCountyTile(t,home)&&t.deposits.grain&&!g.contextAt(t,false)?.economy.buildings.some(b=>!b.virtual&&b.hp>0))){
  const ctx=g.contextAt(tile,true);if(g.buildRule(ctx,'farm'))continue;
  if(g.buildingSites(ctx,'farm').slice(0,12).some(p=>!g.previewBuild(ctx,'farm',p).error&&findAIFieldSite(g,ctx,p))){target=tile;break;}
 }
 assert.ok(target,'real distant fertile tile has both farm and field space');
 for(const tile of tiles)if(tile!==target)tile.deposits.grain=0;
 for(const k of FOOD_KEYS)stock[k]=0;
 g.aiDistricts();const ctx=g.contextAt(target,false),farm=ctx.economy.buildings.find(b=>b.type==='farm'&&b.hp>0);assert.ok(farm,'AI orders a remote farm');
 farm.ready=true;g.ensureFarmFields(1);const field=ctx.economy.buildings.find(b=>b.type==='field'&&b.hp>0);assert.ok(field,'AI pays for a separate field on that same distant tile');assert.equal(field.ready,false);
 assert.ok(ctx.economy.buildings.filter(b=>!b.virtual&&b.hp>0).length<=3||!g.isCountyTile(ctx,home));
 console.log('V143 REMOTE FARM PASS',JSON.stringify({distance:Math.max(Math.abs(target.c-home.c),Math.abs(target.r-home.r)),field:{width:field.width,depth:field.depth}}));
}
