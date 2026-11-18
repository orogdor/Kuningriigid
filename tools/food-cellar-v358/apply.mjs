// Recreate the cellar from its single maintained geometry definition.
// This patches the large designer source on the Actions runner and lets
// tools/house-builder-v355/build.mjs regenerate the game module exactly.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const file=path.join(root,'majaehitaja/index.html');
const source=fs.readFileSync(file,'utf8');
const replacement=fs.readFileSync(path.join(root,'tools/food-cellar-v358/cellar-function.txt'),'utf8');
const a=source.indexOf('  function cellarChamber(');
const b=source.indexOf('  function buildBerm(',a);
if(a<0||b<=a||source.indexOf('  function cellarChamber(',a+1)>=0)
  throw new Error('Cannot locate the unique cellar generator');
if(!replacement.startsWith('  function cellarChamber(')||!replacement.trimEnd().endsWith('}'))
  throw new Error('Invalid replacement generator');
const old=source.slice(a,b);
if(![3475,replacement.length].includes(old.length))
  throw new Error('Unexpected cellar generator length '+old.length+' (source changed)');
const next=source.slice(0,a)+replacement+source.slice(b);
fs.writeFileSync(file,next);
console.log('Replaced food cellar generator: '+old.length+' → '+replacement.length);
