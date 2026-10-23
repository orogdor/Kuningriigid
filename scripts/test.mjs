// Fast feedback first, then bounded parallel read-only regression processes.
import {spawn} from 'node:child_process';
import {availableParallelism} from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
const args=process.argv.slice(2),profile=args[0]||'traffic',get=name=>args.includes(name)?args[args.indexOf(name)+1]:null;
const out=get('--report')||`artifacts-tests/${profile}.json`,jobs=Math.max(1,Math.min(8,Number(get('--jobs'))||Math.min(2,availableParallelism()))),start=performance.now(),results=[];
const rules=[139,138,137,136,'136_HARBOR',135,125,126,127,128,129,130,131,132,123,122,121,'120_LOCALE',119,118,117,59,67,68].map(v=>[`TEST_V${v}.mjs`]);
const focused=[['tests/traffic-v133/run.mjs','--report','artifacts-tests/traffic-cases.json'],['TEST_V133.mjs'],['TEST_V134.mjs']];
const syntax=['urban-infill-v139.js','ancient-walls-v139.js','ai-city-demo-v139.js','historic-urban-v138.js','city-growth-v137.js','historical-districts-v137.js','ai-city-demo-v137.js','historical-city-v135.js','ai-city-demo-v135.js','civilization.js','civilization-core.js','campaign.js','army-arrivals-v133.js','army-gates-v133.js','army-traffic-demo-v133.js'].map(f=>['--check',f]);
async function run(command){
 const begun=performance.now();let output='';const child=spawn(process.execPath,command,{stdio:['ignore','pipe','pipe']});
 const append=data=>{output=(output+data.toString()).slice(-64000);};child.stdout.on('data',append);child.stderr.on('data',append);
 const result=await new Promise(resolve=>{child.on('error',error=>resolve({code:1,error:error.message}));child.on('close',code=>resolve({code}));});
 const item={command,passed:result.code===0,seconds:(performance.now()-begun)/1000,...result,output};results.push(item);
 console.log(`${item.passed?'PASS':'FAIL'} ${command.join(' ')} (${item.seconds.toFixed(2)}s)`);if(!item.passed)console.error(output||result.error);
 return item.passed;
}
async function parallel(commands){let at=0,okay=true;await Promise.all(Array.from({length:Math.min(jobs,commands.length)},async()=>{while(at<commands.length&&okay){const command=commands[at++];if(!await run(command))okay=false;}}));return okay;}
let okay=true;
if(!['traffic','rules','full'].includes(profile))throw Error('Use: node scripts/test.mjs traffic|rules|full [--jobs 2] [--report path]');
if(profile!=='rules')for(const command of focused)if(!await run(command)){okay=false;break;}
if(okay&&profile!=='traffic')okay=await parallel([...syntax,...rules]);
const report={profile,passed:okay,seconds:(performance.now()-start)/1000,jobs,results};fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(report,null,2));
console.log(`${okay?'PASS':'FAIL'} ${profile}: ${results.length} checks in ${report.seconds.toFixed(2)}s`);if(!okay)process.exitCode=1;
