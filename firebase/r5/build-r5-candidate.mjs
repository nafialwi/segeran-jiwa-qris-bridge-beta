#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { applyLateQuarantineRules, diffRuleScalars, verifyR5Candidate } from './late-quarantine-rules.mjs';

const KNOWN=Object.freeze({
  V4_1_REFERENCE:Object.freeze({raw:'3d02fc3e5567e31208816d7990fb4234a808826edf3b51c719f98e0a98829481',canonical:'81900cb33a9cfaaa963c9b7db24e670841a3f21ca628769a8baf14b4821f5793'}),
  V4_REFERENCE:Object.freeze({raw:'da433fb0ae4dae0a7e97f34b58aa688fc8a85ffeed466570b99dd1f116f0afc3',canonical:'1a7c7617e8edfa78b94af06834a8673987df1b49debb937c3a376112c28c6096'})
});
const sha=value=>crypto.createHash('sha256').update(value).digest('hex');
function stable(value){
  if(Array.isArray(value))return '['+value.map(stable).join(',')+']';
  if(value&&typeof value==='object')return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+stable(value[k])).join(',')+'}';
  return JSON.stringify(value);
}
function usage(){return 'Usage: node firebase/r5/build-r5-candidate.mjs --live <exported-live-rules.json> --out-dir <directory>'}
function args(argv){
  const out={};
  for(let i=0;i<argv.length;i++){
    const key=argv[i];if(key==='--live'||key==='--out-dir'){out[key.slice(2)]=argv[++i]}
  }
  if(!out.live||!out['out-dir'])throw new Error('R5_ARGS_REQUIRED: '+usage());
  return {live:path.resolve(out.live),outDir:path.resolve(out['out-dir'])};
}
function lineage(rawSha,canonicalSha){
  for(const [name,hashes] of Object.entries(KNOWN))if(rawSha===hashes.raw||canonicalSha===hashes.canonical)return name;
  return 'UNKNOWN_STRUCTURALLY_COMPATIBLE';
}
function main(){
  const {live,outDir}=args(process.argv.slice(2));
  const raw=fs.readFileSync(live);
  let liveRules;try{liveRules=JSON.parse(raw.toString('utf8'))}catch(error){throw new Error('R5_LIVE_RULES_JSON_INVALID: '+error.message)}

  // Validation happens before any output directory/file is created.
  const candidate=applyLateQuarantineRules(liveRules);
  const verify=verifyR5Candidate(liveRules,candidate);
  if(!verify.ok)throw new Error('R5_CANDIDATE_VERIFY_FAILED: expected exact two-scalar signal rules diff');

  const rawSha=sha(raw),canonicalSha=sha(Buffer.from(stable(liveRules))),known=lineage(rawSha,canonicalSha);
  const pretty=Buffer.from(JSON.stringify(candidate,null,2)+'\n');
  const minified=Buffer.from(JSON.stringify(candidate));
  const diffs=diffRuleScalars(liveRules,candidate);
  const report={
    workPackage:'RC01-S10C-R5',
    scope:'QRIS Late Quarantine Rules Alignment',
    patchBuildPass:true,
    published:false,
    publishGate:known==='UNKNOWN_STRUCTURALLY_COMPATIBLE'?'HOLD_UNKNOWN_LIVE_LINEAGE_MANUAL_REVIEW':'READY_FOR_MANUAL_REVIEW_NOT_PUBLISHED',
    lineage:known,
    liveRawSha256:rawSha,
    liveCanonicalSha256:canonicalSha,
    rollbackRawSha256:rawSha,
    candidatePrettySha256:sha(pretty),
    candidateMinifiedSha256:sha(minified),
    diffCount:verify.diffCount,
    changedPaths:verify.changedPaths,
    rootFailClosed:verify.rootFailClosed,
    nonTargetRulesIdentical:true,
    productionFrontendChanged:false
  };

  fs.mkdirSync(outDir,{recursive:true});
  fs.writeFileSync(path.join(outDir,'database.rules.R5_ROLLBACK_EXACT.json'),raw);
  fs.writeFileSync(path.join(outDir,'database.rules.R5_LATE_QUARANTINE_CANDIDATE.json'),pretty);
  fs.writeFileSync(path.join(outDir,'database.rules.R5_LATE_QUARANTINE_CANDIDATE_MIN.json'),minified);
  fs.writeFileSync(path.join(outDir,'R5_RULES_GATE_REPORT.json'),JSON.stringify(report,null,2)+'\n');
  fs.writeFileSync(path.join(outDir,'R5_RULES_DIFF.txt'),diffs.map(d=>`${d.path}\nBEFORE: ${String(d.before)}\nAFTER:  ${String(d.after)}\n`).join('\n'));
  console.log(`R5_PATCH_BUILD_PASS diff=${verify.diffCount} lineage=${known}`);
  console.log(`LIVE_SHA256=${rawSha}`);
  console.log(`CANDIDATE_SHA256=${report.candidatePrettySha256}`);
  console.log(`PUBLISH_GATE=${report.publishGate}`);
}
try{main()}catch(error){console.error(error?.stack||String(error));process.exitCode=1}
