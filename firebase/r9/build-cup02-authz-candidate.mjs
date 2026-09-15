import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {applyCup02AuthzRules,diffRuleScalars,verifyCup02AuthzCandidate} from './cup02-authz-rules.mjs';

function arg(name){const i=process.argv.indexOf(name);return i>=0?process.argv[i+1]:''}
const livePath=arg('--live');
const outDir=arg('--out-dir');
if(!livePath||!outDir){console.error('usage: node build-cup02-authz-candidate.mjs --live <deployed-rules.json> --out-dir <dir>');process.exit(2)}
const raw=fs.readFileSync(livePath);
const live=JSON.parse(raw.toString('utf8'));
const candidate=applyCup02AuthzRules(live);
const report=verifyCup02AuthzCandidate(live,candidate);
if(!report.ok)throw new Error('CUP02_CANDIDATE_GATE_FAILED '+JSON.stringify(report));
fs.mkdirSync(outDir,{recursive:true});
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const pretty=Buffer.from(JSON.stringify(candidate,null,2)+'\n');
const min=Buffer.from(JSON.stringify(candidate));
const rollback=path.join(outDir,'database.rules.CUP02_AUTHZ_ROLLBACK_EXACT.json');
const candidatePath=path.join(outDir,'database.rules.CUP02_AUTHZ_CANDIDATE.json');
const minPath=path.join(outDir,'database.rules.CUP02_AUTHZ_CANDIDATE.min.json');
fs.writeFileSync(rollback,raw);
fs.writeFileSync(candidatePath,pretty);
fs.writeFileSync(minPath,min);
const diffs=diffRuleScalars(live,candidate);
fs.writeFileSync(path.join(outDir,'CUP02_AUTHZ_DIFF.txt'),diffs.map(d=>`PATH: ${d.path}\nBEFORE: ${JSON.stringify(d.before)}\nAFTER : ${JSON.stringify(d.after)}\n`).join('\n'));
const gate={
  milestone:'CUP-02-AUTHZ',
  generatedAt:new Date().toISOString(),
  source:'ACTUAL_DEPLOYED_RULES_EXPORT',
  liveRawSha256:sha(raw),
  rollbackRawSha256:sha(fs.readFileSync(rollback)),
  candidatePrettySha256:sha(pretty),
  candidateMinSha256:sha(min),
  rollbackByteIdentical:Buffer.compare(raw,fs.readFileSync(rollback))===0,
  patchBuildPass:report.ok,
  diffCount:report.diffCount,
  changedPaths:report.changedPaths,
  unexpectedPaths:report.unexpectedPaths,
  missingPaths:report.missingPaths,
  consumptionWriteAuthority:false,
  structuredConsumptionValSentinel:false,
  runtimeSourceChanged:false,
  firebaseWritePerformed:false,
  rulesPublished:false,
  publishGate:'CANDIDATE_ONLY_EMULATOR_REQUIRED_NOT_PUBLISHED'
};
fs.writeFileSync(path.join(outDir,'CUP02_AUTHZ_GATE_REPORT.json'),JSON.stringify(gate,null,2)+'\n');
console.log(JSON.stringify(gate,null,2));
