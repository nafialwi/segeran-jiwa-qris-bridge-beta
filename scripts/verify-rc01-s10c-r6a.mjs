import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { applyLateQuarantineRules, verifyR5Candidate } from '../firebase/r5/late-quarantine-rules.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const rel=p=>path.join(ROOT,p);
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const text=p=>fs.readFileSync(p,'utf8');
const assert=(ok,msg)=>{if(!ok)throw new Error(msg)};

// R5 authority anchors. R6A is allowed to move COMPAT only; these hashes document the before/after authority.
const R5_COMPAT_SHA256='731fca10a891a1f3832b9b4201e77747073f6f3f0796e20994f39b7f84d94933';
const R6A_COMPAT_SHA256='d24646468e7d8595ff1b356d9ba6a6f732efd1e40f02e8f6c28f924a39a7e355';
const R4_RUNTIME_SHA256='219149affb2844e67d9dfde5d2d98a0ef8776275def2d75f13a73724c346934c';
const FIXTURE_SHA256='3d02fc3e5567e31208816d7990fb4234a808826edf3b51c719f98e0a98829481';
const STABLE_HASHES=Object.freeze({
  'baseline/legacy-v1.0.40.html':'877dd5d80ad3cfbae9c8ded35ea37c426bf795392240adb96c38e62fc556154f',
  'src/data/writers/qris-deferred-settlement-writer.js':'cac56daf9cc8495041dcff1a861edeb9a3caf5723e329ef6445653525948b8a8',
  'src/compat/rc01-qris-evaluation-convergence.js':'925f03e19db85327a1faf0b9c7473101ea045dcc85d2080e3afb6ba82b2848db',
  'src/compat/rc01-qris-event-sync-shield.js':'c2787bb2cc7878a1d7348a66c0b1682c3ebfa4470a90cccc9188953c4e122064',
  'src/app/qris-deferred-settlement-bootstrap.js':'be8380798923df1ce45edbf2bd6c36e08eaa076843db6b13bdacbed117fbead9',
  'src/compat/rc01-sync-authority.js':'a5283642e0a7fcf2679845a60783628d1121340ef8c9bd94d0b10d3200474050'
});

for(const [file,expected] of Object.entries(STABLE_HASHES)){
  const p=rel(file);assert(fs.existsSync(p),`R6A stable authority missing: ${file}`);assert(sha(p)===expected,`R6A out-of-scope hash drift: ${file}`);
}

const COMPAT=rel('src/compat/rc01-qris-deferred-settlement-compat.js');
assert(fs.existsSync(COMPAT),'R6A compat missing');
assert(R5_COMPAT_SHA256!==R6A_COMPAT_SHA256,'R6A before/after authority must differ');
assert(sha(COMPAT)===R6A_COMPAT_SHA256,`R6A compat hash drift: ${sha(COMPAT)}`);
const compat=text(COMPAT);

for(const token of [
  'COMMERCIAL_CANCEL_TIMEOUT_MS=8000',
  'function cancelCommercialPending(cancel)',
  'function releaseCommercialPayment()',
  'leaveTransactionFlow',
  "e.code='QRIS_S10C_R6_CANCEL_TIMEOUT'",
  'if(fresh.providerTransactionId)',
  'cancel.disabled=true',
  "cancel.textContent='Membatalkan…'",
  'var ok=await cancelWithTimeout(b)',
  'if(!ok)throw new Error',
  'releaseCommercialPayment();setTimeout(refreshEvidence,50)',
  'cancel.onclick=function(){return cancelCommercialPending(cancel)}'
]) assert(compat.includes(token),`R6A cancel contract missing: ${token}`);

// R4 late-quarantine safety must survive the R6A UI-only correction.
for(const token of [
  'lateHeld[id]','lateAttempts[id]=(lateAttempts[id]||0)+1','if(attempt<2)',
  "heldError.code='QRIS_LATE_QUARANTINE_FAILED_HELD'",'sameDurableLate',
  'lateInFlight[id]','lateDrainRunning=false'
]) assert(compat.includes(token),`R6A R4 safety token missing: ${token}`);

// No new Firebase mutation authority may appear in the compatibility layer.
for(const token of ['.set(','.update(','.remove(','.transaction(']){
  assert(!compat.includes(token),`R6A_NEW_MUTATION_TOKEN: ${token}`);
}

// Generated source must be exactly the approved R6A source in both static candidates.
for(const file of [
  'dist-ref01/src/compat/rc01-qris-deferred-settlement-compat.js',
  'dist-rc01/src/compat/rc01-qris-deferred-settlement-compat.js'
]){
  const p=rel(file);assert(fs.existsSync(p),`R6A generated compat missing: ${file}`);assert(sha(p)===R6A_COMPAT_SHA256,`R6A generated compat drift: ${file}`);
}
const runtime=rel('dist-rc01/index.html');
assert(fs.existsSync(runtime),'R6A dist-rc01/index.html missing');
assert(sha(runtime)===R4_RUNTIME_SHA256,'R6A must not rewrite frozen monolith runtime');

// R5 Rules regression remains exact and fail-closed.
const fixture=rel('tests/fixtures/r5/database.rules.v4_1.reference-only.json');
assert(sha(fixture)===FIXTURE_SHA256,'R6A R5 rules fixture drift');
const live=JSON.parse(text(fixture));
const candidate=applyLateQuarantineRules(live);
const report=verifyR5Candidate(live,candidate);
assert(report.ok,'R6A R5 late-quarantine candidate regression');
assert(JSON.stringify(report.changedPaths)===JSON.stringify([
  'rules/segeranjiwa_qris_beta_v1/signals/$signalId/.validate',
  'rules/segeranjiwa_qris_beta_v1/signals/$signalId/.write'
]),'R6A R5 rules diff escaped approved boundary');

const pkg=JSON.parse(text(rel('package.json')));
assert(pkg.scripts?.['verify:rc01:s10c-r5']==='npm run verify:rc01:s10c-r4 && node scripts/verify-rc01-s10c-r5.mjs','R6A must not weaken frozen R5 gate');
assert(pkg.scripts?.['verify:rc01:s10c-r6a']==='npm run verify:rc01:s10a2 && node scripts/verify-rc01-s10c.mjs && node scripts/verify-rc01-s10c-r1.mjs && node scripts/verify-rc01-s10c-r5.mjs && node scripts/verify-rc01-s10c-r6a.mjs','R6A package gate mismatch');
assert(fs.existsSync(rel('tests/rc01-s10c-r6a-qris-cancel-deadlock.test.mjs')),'R6A behavioral regression test missing');

console.log(`RC01-S10C-R6A verification PASS: commercial cancel closes only after authoritative success, provider-linked/failed/timeout paths remain fail-closed, busy timeout bounded at 8000ms; R4 late safety + R5 Rules preserved; compat ${R6A_COMPAT_SHA256}.`);
