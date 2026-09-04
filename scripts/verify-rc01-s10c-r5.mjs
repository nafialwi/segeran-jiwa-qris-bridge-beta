import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { applyLateQuarantineRules, verifyR5Candidate } from '../firebase/r5/late-quarantine-rules.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const R4_TREE_AUTHORITY='8ba7863870e4634fa09dfc975d1d91bb7d535d24';
const R4_RUNTIME_SHA256='219149affb2844e67d9dfde5d2d98a0ef8776275def2d75f13a73724c346934c';
const FIXTURE_SHA256='3d02fc3e5567e31208816d7990fb4234a808826edf3b51c719f98e0a98829481';
const ALLOWED_RULE_PATHS=Object.freeze([
  'rules/segeranjiwa_qris_beta_v1/signals/$signalId/.validate',
  'rules/segeranjiwa_qris_beta_v1/signals/$signalId/.write'
]);
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
function assert(condition,message){if(!condition)throw new Error(message)}

const fixture=path.join(root,'tests/fixtures/r5/database.rules.v4_1.reference-only.json');
assert(fs.existsSync(fixture),'R5 fixture missing');
assert(sha(fixture)===FIXTURE_SHA256,'R5 fixture hash drift');
const live=JSON.parse(fs.readFileSync(fixture,'utf8'));
const candidate=applyLateQuarantineRules(live);
const report=verifyR5Candidate(live,candidate);
assert(report.ok,'R5 reference candidate verification failed');
assert(JSON.stringify(report.changedPaths)===JSON.stringify(ALLOWED_RULE_PATHS),'R5 diff escaped signal .write/.validate boundary');

const runtime=path.join(root,'dist-rc01/index.html');
assert(fs.existsSync(runtime),'R5 requires fresh build:rc01 output');
assert(sha(runtime)===R4_RUNTIME_SHA256,`R5 frontend/runtime drift: expected ${R4_RUNTIME_SHA256}`);

const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
assert(pkg.scripts?.['verify:rc01:s10c-r5']==='npm run verify:rc01:s10c-r4 && node scripts/verify-rc01-s10c-r5.mjs','R5 package gate missing');
assert(fs.existsSync(path.join(root,'firebase/r5/build-r5-candidate.mjs')),'R5 candidate builder missing');

console.log(`RC01-S10C-R5 verification PASS: R4 tree authority ${R4_TREE_AUTHORITY}; frontend runtime unchanged ${R4_RUNTIME_SHA256}; rules diff exact ${ALLOWED_RULE_PATHS.length}/2.`);
