import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  applyLateQuarantineRules,
  diffRuleScalars,
  lateTransitionAllowed,
  verifyR5Candidate
} from '../firebase/r5/late-quarantine-rules.mjs';

const here=path.dirname(fileURLToPath(import.meta.url));
const fixturePath=path.join(here,'fixtures/r5/database.rules.v4_1.reference-only.json');
const loadFixture=()=>JSON.parse(fs.readFileSync(fixturePath,'utf8'));
const clone=v=>JSON.parse(JSON.stringify(v));

function baseSignal(overrides={}){
  return {
    provider:'GOFOOD_MERCHANT',
    providerTransactionId:'SIG-1',
    amount:5000,
    firstSeenAt:1000,
    lastSeenAt:1100,
    sourceDeviceId:'OWNER-DEVICE',
    status:'UNMATCHED',
    matchedTransactionId:null,
    matchedAt:null,
    confirmedAt:null,
    confirmedBy:null,
    resolutionState:null,
    resolvedAt:null,
    resolvedBy:null,
    resolvedReason:null,
    ...overrides
  };
}
function lateSignal(overrides={}){
  return baseSignal({
    status:'LATE_AFTER_CANCEL',
    resolutionState:'REVIEW_REQUIRED',
    autoMatchBlocked:true,
    lateDetectedAt:2000,
    lateCandidatePendingIds:['P-CANCELLED'],
    ...overrides
  });
}
const activeUser={authenticated:true,active:true};

test('R5 policy allows only safe eligible -> late quarantine transitions',()=>{
  const oldRow=baseSignal();
  assert.equal(lateTransitionAllowed({user:activeUser,before:oldRow,after:lateSignal()}),true);
  assert.equal(lateTransitionAllowed({user:activeUser,before:oldRow,after:lateSignal({status:'LATE_OR_NEW_AMBIGUOUS'})}),true);

  assert.equal(lateTransitionAllowed({user:{authenticated:true,active:false},before:oldRow,after:lateSignal()}),false,'inactive users must be denied');
  assert.equal(lateTransitionAllowed({user:activeUser,before:baseSignal({status:'MATCHED',matchedTransactionId:'P1',matchedAt:1200}),after:lateSignal()}),false,'matched signal cannot be quarantined');
  assert.equal(lateTransitionAllowed({user:activeUser,before:baseSignal({resolutionState:'DISMISSED',resolvedAt:1500,resolvedBy:'owner',resolvedReason:'manual'}),after:lateSignal()}),false,'resolved signal cannot be reopened as late quarantine');
  assert.equal(lateTransitionAllowed({user:activeUser,before:oldRow,after:lateSignal({amount:6000})}),false,'immutable payment evidence cannot drift');
  assert.equal(lateTransitionAllowed({user:activeUser,before:oldRow,after:lateSignal({resolutionState:'DISMISSED'})}),false);
  assert.equal(lateTransitionAllowed({user:activeUser,before:oldRow,after:lateSignal({autoMatchBlocked:false})}),false);
  assert.equal(lateTransitionAllowed({user:activeUser,before:oldRow,after:lateSignal({lateCandidatePendingIds:[]})}),false);
  assert.equal(lateTransitionAllowed({user:activeUser,before:oldRow,after:lateSignal({lateDetectedAt:0})}),false);
});

test('R5 policy permits exact idempotent late state but rejects late-state mutation',()=>{
  const before=lateSignal();
  assert.equal(lateTransitionAllowed({user:activeUser,before,after:clone(before)}),true);
  assert.equal(lateTransitionAllowed({user:activeUser,before,after:lateSignal({lateCandidatePendingIds:['OTHER']})}),false);
  assert.equal(lateTransitionAllowed({user:activeUser,before,after:lateSignal({lateDetectedAt:3000})}),false);
  assert.equal(lateTransitionAllowed({user:activeUser,before,after:lateSignal({status:'LATE_OR_NEW_AMBIGUOUS'})}),false);
});

test('R5 patch changes exactly signal .write and .validate on the v4.1 reference fixture',()=>{
  const live=loadFixture();
  const candidate=applyLateQuarantineRules(live);
  const diffs=diffRuleScalars(live,candidate);
  assert.deepEqual(diffs.map(x=>x.path),[
    'rules/segeranjiwa_qris_beta_v1/signals/$signalId/.validate',
    'rules/segeranjiwa_qris_beta_v1/signals/$signalId/.write'
  ]);

  const beforeQris=live.rules.segeranjiwa_qris_beta_v1;
  const afterQris=candidate.rules.segeranjiwa_qris_beta_v1;
  assert.equal(afterQris['.write'],false,'QRIS parent must remain fail-closed');
  assert.deepEqual(afterQris.events,beforeQris.events);
  assert.deepEqual(afterQris.inboxState,beforeQris.inboxState);
  assert.deepEqual(afterQris.pending,beforeQris.pending);
  assert.deepEqual(candidate.rules.toko_segeranjiwa_v58,live.rules.toko_segeranjiwa_v58,'POS + Inventory rules must remain exact');
});

test('R5 generated signal rules carry late transition, idempotence, and field guards',()=>{
  const candidate=applyLateQuarantineRules(loadFixture());
  const signal=candidate.rules.segeranjiwa_qris_beta_v1.signals['$signalId'];
  for(const token of ['LATE_AFTER_CANCEL','LATE_OR_NEW_AMBIGUOUS','REVIEW_REQUIRED','autoMatchBlocked','lateDetectedAt','lateCandidatePendingIds']){
    assert.match(signal['.write']+signal['.validate'],new RegExp(token));
  }
  assert.match(signal['.write'],/data\.child\('status'\).*LATE_AFTER_CANCEL/,'same-late idempotent branch must exist');
  assert.match(signal['.validate'],/provider.*amount.*firstSeenAt.*sourceDeviceId/s,'immutable evidence guards must be present');
});

test('R5 patch is idempotent and verifier reports no out-of-scope diff',()=>{
  const live=loadFixture();
  const once=applyLateQuarantineRules(live);
  const twice=applyLateQuarantineRules(once);
  assert.deepEqual(twice,once);
  const report=verifyR5Candidate(live,once);
  assert.equal(report.ok,true);
  assert.deepEqual(report.changedPaths,[
    'rules/segeranjiwa_qris_beta_v1/signals/$signalId/.validate',
    'rules/segeranjiwa_qris_beta_v1/signals/$signalId/.write'
  ]);
});

test('R5 patch refuses unsafe or structurally incompatible live rules',()=>{
  const missing=loadFixture();delete missing.rules.segeranjiwa_qris_beta_v1.signals;
  assert.throws(()=>applyLateQuarantineRules(missing),/R5_RULES_SIGNAL_PATH_MISSING/);

  const openRoot=loadFixture();openRoot.rules.segeranjiwa_qris_beta_v1['.write']=true;
  assert.throws(()=>applyLateQuarantineRules(openRoot),/R5_QRIS_ROOT_NOT_FAIL_CLOSED/);

  const badSignal=loadFixture();badSignal.rules.segeranjiwa_qris_beta_v1.signals['$signalId']['.validate']='true';
  assert.throws(()=>applyLateQuarantineRules(badSignal),/R5_UNSUPPORTED_SIGNAL_RULES_BASELINE/);
});

test('R5 exposes a dedicated verifier chained after the frozen R4 gate',()=>{
  const repo=path.resolve(here,'..');
  const pkg=JSON.parse(fs.readFileSync(path.join(repo,'package.json'),'utf8'));
  assert.equal(pkg.scripts['verify:rc01:s10c-r5'],'npm run verify:rc01:s10c-r4 && node scripts/verify-rc01-s10c-r5.mjs');
  const verifier=fs.readFileSync(path.join(repo,'scripts/verify-rc01-s10c-r5.mjs'),'utf8');
  assert.match(verifier,/8ba7863870e4634fa09dfc975d1d91bb7d535d24/);
  assert.match(verifier,/219149affb2844e67d9dfde5d2d98a0ef8776275def2d75f13a73724c346934c/);
  assert.match(verifier,/signals\/\$signalId\/\.write/);
  assert.match(verifier,/signals\/\$signalId\/\.validate/);
});

test('R5 rules never compare structured candidate arrays through RuleDataSnapshot.val sentinel',()=>{
  const candidate=applyLateQuarantineRules(loadFixture());
  const signal=candidate.rules.segeranjiwa_qris_beta_v1.signals['$signalId'];
  assert.doesNotMatch(signal['.write'],/child\('lateCandidatePendingIds'\)\.val\(\)\s*==/);
  assert.doesNotMatch(signal['.validate'],/child\('lateCandidatePendingIds'\)\.val\(\)\s*==/);
  assert.match(signal['.write'],/child\('lateCandidatePendingIds'\)\.child\('0'\)\.val\(\)\s*==\s*data\.child\('lateCandidatePendingIds'\)\.child\('0'\)\.val\(\)/);
});

test('R5 late write is bound to real cancelled pending evidence and current operator authority',()=>{
  const candidate=applyLateQuarantineRules(loadFixture());
  const write=candidate.rules.segeranjiwa_qris_beta_v1.signals['$signalId']['.write'];
  assert.match(write,/child\('pending'\).*child\('lateCandidatePendingIds'\).*child\('0'\)/s);
  assert.match(write,/child\('status'\)\.val\(\) == 'CANCELLED'/);
  assert.match(write,/child\('amount'\)\.val\(\) == data\.child\('amount'\)\.val\(\)/);
  assert.match(write,/role.*manajemen.*cashierId.*username/s);
});

test('R5 verifier rejects a late-rule candidate that drops cancelled-pending authorization evidence',()=>{
  const live=loadFixture();
  const candidate=applyLateQuarantineRules(live);
  const signal=candidate.rules.segeranjiwa_qris_beta_v1.signals['$signalId'];
  signal['.write']=signal['.write']
    .replace(/root\.child\('segeranjiwa_qris_beta_v1'\)\.child\('pending'\)[\s\S]*?root\.child\('toko_segeranjiwa_v58\/global\/authUsers'\)\.child\(auth\.uid\)\.child\('username'\)\.val\(\)\)/,'true');
  assert.throws(()=>verifyR5Candidate(live,candidate),/R5_UNSUPPORTED_SIGNAL_RULES_BASELINE/);
});
