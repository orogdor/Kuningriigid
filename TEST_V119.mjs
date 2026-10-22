import assert from 'node:assert/strict';
import {TECHS,techBlock,newResearch,grantTech,nextResearchForGoals} from './research.js?v=118a';
import {V118_ERA_IDS} from './tech-tree-data-v118.js?v=118a';
import {visibleResearchIds,verticalResearchLayout,VERTICAL_TREE} from './tech-tree-layout-v119.js?v=119a';
function inspect(research,columns){
 const visible=visibleResearchIds(TECHS,research,id=>!techBlock(research,id));
 const layout=verticalResearchLayout(TECHS,visible,7,V118_ERA_IDS,columns);
 assert.deepEqual(layout.ids,visible);
 assert.equal(layout.positions.size,visible.length,'Every visible item has a node');
 assert.ok(layout.bands.every((band,i)=>i===0||layout.bands[i-1].end<band.start),'Eras run vertically');
 for(const {from,to} of layout.edges){
  assert.ok(visible.includes(from)&&visible.includes(to),'Hidden branches never have visible arrows');
  assert.ok(layout.positions.get(from).y+VERTICAL_TREE.nodeHeight<layout.positions.get(to).y,'All arrows point downward');
 }
 const nodes=[...layout.positions.entries()];
 for(let i=0;i<nodes.length;i++){
  const [a,pa]=nodes[i];
  assert.ok(pa.x>=0&&pa.x+VERTICAL_TREE.nodeWidth<=layout.width,a+' is within canvas');
  for(let j=i+1;j<nodes.length;j++){
   const [b,pb]=nodes[j],overlap=pa.x<pb.x+VERTICAL_TREE.nodeWidth&&pb.x<pa.x+VERTICAL_TREE.nodeWidth&&pa.y<pb.y+VERTICAL_TREE.nodeHeight&&pb.y<pa.y+VERTICAL_TREE.nodeHeight;
   assert.equal(overlap,false,'Node overlap: '+a+' / '+b);
  }
 }
 return {visible,layout};
}
const fresh=newResearch();let shown=inspect(fresh,2);
assert.ok(shown.visible.includes('hunting')&&shown.visible.includes('stone_tools'));
assert.ok(!shown.visible.includes('bronze')&&!shown.visible.includes('industrialization'));
assert.ok(shown.visible.length<10,'Opening scene shows only researchable roots');
fresh.progress.modernity=1000;assert.ok(!inspect(fresh,4).visible.includes('modernity'),'Partial hidden progress cannot reveal a locked technology');
grantTech(fresh,'stone_tools');
shown=inspect(fresh,2);
assert.ok(shown.visible.includes('stone_tools')&&shown.visible.includes('water'));
assert.ok(!shown.visible.includes('modernity'));
const bronze=newResearch();grantTech(bronze,'bronze');let bronzeScene=inspect(bronze,4);
assert.ok(bronzeScene.visible.includes('bronze'));
assert.ok(bronzeScene.layout.bands.some(b=>b.age===1),'The second age opens vertically');
assert.ok(!bronzeScene.visible.includes('modernity'));
const full=newResearch();grantTech(full,'modernity');
shown=inspect(full,4);
assert.ok(shown.visible.includes('modernity'));
assert.ok(shown.visible.length<111,'Unresearched optional future branches stay hidden');
const ongoing=newResearch();ongoing.active='stone_tools';shown=inspect(ongoing,2);
assert.ok(shown.visible.includes('stone_tools'));
const simulated=newResearch(),seen=new Set();
for(let n=0;n<111&&!simulated.known.includes('modernity');n++){
 const id=nextResearchForGoals(simulated,['modernity']);
 assert.ok(id,'AI has a researchable predecessor');
 assert.equal(techBlock(simulated,id),'');
 seen.add(id);simulated.known.push(id);
 inspect(simulated,2);
}
assert.ok(simulated.known.includes('modernity'));
console.log('V119 PASS: vertically ordered eras and arrows, no overlap, mobile 2-column, hidden research stays hidden, visible current/open techs, AI progression '+seen.size+' nodes.');
