// V39: settlement specialisation; bonuses improve throughput rather than creating goods.
// Terrain bonuses apply only when the building is actually staffed and supplied.
export function terrainYields(game,point){
 const cell=game.cell(point);if(!cell?.land)return {};
 const neighbours=[];
 for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){
  const c=cell.c+dc,r=cell.r+dr;
  if(c<0||r<0||c>=game.cols||r>=game.rows)continue;
  const a=game.cells[r*game.cols+c];if(a)neighbours.push(a);
 }
 const river=cell.river||neighbours.some(n=>n.river);
 const hills=neighbours.some(n=>n.mountain);
 const forest=cell.biome==='forest';
 const coast=neighbours.some(n=>!n.land);
 const a={};const bonus=(type,v)=>{a[type]=+(1+v).toFixed(2)};
 if(forest){bonus('lumber',.25);bonus('forester',.20);bonus('saw',.18)}
 if(hills&&cell.deposits?.stone)bonus('quarry',.25);
 if(hills&&cell.deposits?.ore)bonus('mine',.20);
 if(cell.deposits?.grain){bonus('farm',(cell.biome==='plains'?.18:0)+(river?.15:0))}
 if(river&&cell.deposits?.water)bonus('well',.20);
 if(coast&&cell.deposits?.fish)bonus('fisher',.22);
 return a;
}
export function bonusDescription(map){
 const names={lumber:'Metsamaja',forester:'Metsnik',saw:'Saeveski',quarry:'Kivimurd',mine:'Rauakaevandus',farm:'Talu',well:'Kaev',fisher:'Kalamees'};
 return Object.entries(map).map(([k,v])=>`${names[k]} +${Math.round((v-1)*100)}%`).join(' · ');
}
