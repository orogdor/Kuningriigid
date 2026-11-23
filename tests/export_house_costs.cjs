// Reproduce the designer's literal estimate tables from majaehitaja/index.html.
const fs=require('fs'),vm=require('vm');
const html=fs.readFileSync(process.argv[2],'utf8');
const names=['itemCost','wallCost','fenceCost','roofCostOf','fieldEdgeCost'];
const context=vm.createContext({});
for(const name of names){
 const match=html.match(new RegExp('const '+name+'=([\\s\\S]*?);'));
 if(!match)throw Error('Missing table '+name);
 context[name]=vm.runInContext('('+match[1]+')',context);
 const assignments=html.matchAll(new RegExp('Object\\.assign\\('+name+',([\\s\\S]*?)\\);','g'));
 for(const assignment of assignments)Object.assign(context[name],vm.runInContext('('+assignment[1]+')',context));
}
const period=html.match(/for\(const \[id,cost\] of Object\.entries\(([\s\S]*?)\)\)itemCost\[id\]=cost;/);
if(!period)throw Error('Missing period furnishings cost table');
Object.assign(context.itemCost,vm.runInContext('('+period[1]+')',context));
const result=Object.fromEntries(names.map(name=>[name,context[name]]));
fs.writeFileSync(process.argv[3],JSON.stringify(result,null,2)+'\n');
