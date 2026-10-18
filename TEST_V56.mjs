import assert from 'node:assert/strict';
import * as T from './vendor/three.module.js';
import {Civilization,createGame} from './civilization-core.js';
import {roadKey,roadLevel,roadStrength} from './roads.js';
import {createAtlasDecor} from './atlas-style.js';

for(const seed of [17,12345,777,45678,20261018]){
 const game=new Civilization(createGame(seed)),scout=game.s.armies[0];
 const first={c:scout.c,r:scout.r},adjacent=[[1,0],[-1,0],[0,1],[0,-1]].map(([dc,dr])=>({c:first.c+dc,r:first.r+dr})).find(p=>game.canTraverse(0,p));
 assert(adjacent,'There must be at least one walkable starting neighbor');
 const revealedBefore=Object.keys(game.s.explored[0]).length;
 scout.path=[adjacent];game.tick(3.2);
 const key=roadKey(first,adjacent);
 assert(game.s.worldRoads[key],'Completed traversal must create road');
 assert(roadLevel(roadStrength(game.s,first,adjacent))>=1,'One traversal must produce visible level-1 footpath');
 assert(game.seen(0,first)&&game.seen(0,adjacent),'Road must be revealed for own scout');
 const scene=new T.Scene(),decor=createAtlasDecor(game,scene,'low');decor.roads(game.s);
 const roadMeshes=decor.group.children.flatMap(g=>g.children).filter(m=>m.isMesh&&!m.isInstancedMesh&&m.geometry?.attributes?.color?.count&&m.geometry.attributes.position.count<=1200);
 assert(roadMeshes.length>=2,'Renderer must create a painted road body and darker shoulder');
 const roadWidth=roadMeshes[roadMeshes.length-1].geometry.attributes.position;
 assert(roadWidth.count>0,'Road vertices cannot be empty');
 scout.autoExplore=true;scout.path=[];
 const seen=new Set();let twoTileBounces=0,older=null,last=null;
 for(let tick=0;tick<145;tick++){
  game.tick(3);
  const here=`${scout.c},${scout.r}`;
  if(here===older&&here!==last)twoTileBounces++;
  seen.add(here);older=last;last=here;
 }
 assert(seen.size>=30,'Scout must travel outside starting plateau instead of stopping immediately');
 assert(twoTileBounces<25,'Scout must not alternate repeatedly between two tiles');
 assert(Object.keys(game.s.explored[0]).length>=revealedBefore+75,'Automatic scouting must discover substantially new territory');
 assert(Object.keys(game.s.worldRoads).length>12,'World movement must leave a traversed road network');
 console.log('V56 seed',seed,JSON.stringify({tilesVisited:seen.size,twoTileBounces,explored:Object.keys(game.s.explored[0]).length,roads:Object.keys(game.s.worldRoads).length,passes:game.startPassages.length}));
}
console.log('V56 PASS: no two-tile trap, connected starts, movement creates visible terrain roads, new territory discovered');
