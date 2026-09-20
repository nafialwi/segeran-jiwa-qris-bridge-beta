import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {applyStockComponentRules,verifyStockComponentRulesCandidate} from './stock-components-rules.mjs';

function arg(name){const i=process.argv.indexOf(name);return i>=0?process.argv[i+1]:''}
function stable(v){
  if(Array.isArray(v))return v.map(stable);
  if(v&&typeof v==='object'){const o={};for(const k of Object.keys(v).sort())o[k]=stable(v[k]);return o}
  return v;
}
const canonical=v=>JSON.stringify(stable(v),null,2)+'\n';
const sha=v=>crypto.createHash('sha256').update(typeof v==='string'||Buffer.isBuffer(v)?v:canonical(v)).digest('hex');

const livePath=arg('--live'),outDir=arg('--out-dir');
if(!livePath||!outDir){console.error('usage: node build-stock-components-rules.mjs --live <rules.json> --out-dir <dir>');process.exit(2)}
const live=JSON.parse(fs.readFileSync(livePath,'utf8'));
const candidate=applyStockComponentRules(live);
const report=verifyStockComponentRulesCandidate(live,candidate);
if(!report.ok)throw new Error('R10_STOCK_COMPONENT_RULES_CANDIDATE_INVALID '+JSON.stringify(report));
fs.mkdirSync(outDir,{recursive:true});
const candidatePath=path.join(outDir,'database.rules.stock-components.candidate.json');
const rollbackPath=path.join(outDir,'database.rules.stock-components.rollback.json');
const reportPath=path.join(outDir,'stock-components-rules-report.json');
fs.writeFileSync(candidatePath,JSON.stringify(candidate,null,2)+'\n');
fs.writeFileSync(rollbackPath,JSON.stringify(live,null,2)+'\n');
fs.writeFileSync(reportPath,JSON.stringify({...report,liveCanonicalSha256:sha(live),candidateCanonicalSha256:sha(candidate)},null,2)+'\n');
console.log(`LIVE CANONICAL SHA : ${sha(live)}`);
console.log(`CANDIDATE SHA      : ${sha(candidate)}`);
console.log(`CHANGED RULE PATHS : ${report.changedPaths.length}`);
for(const p of report.changedPaths)console.log(`  ${p}`);
console.log('DEPLOY COMMAND COUNT: 0');
console.log('PRODUCTION MUTATIONS: 0');
console.log(`CANDIDATE           : ${candidatePath}`);
