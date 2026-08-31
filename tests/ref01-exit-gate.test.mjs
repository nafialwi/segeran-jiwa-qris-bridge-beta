import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

test('REF-01 verifier reports zero violations and covers implicit-logic convergence gates',()=>{
  execFileSync(process.execPath,['scripts/build-ref01.mjs'],{stdio:'pipe'});
  execFileSync(process.execPath,['scripts/verify-ref01.mjs'],{stdio:'pipe'});
  const report=JSON.parse(readFileSync('audit/ref01-verification.json','utf8'));
  assert.deepEqual(report.violations,[]);
  assert.equal(report.refinementReferences,9);
  assert.equal(report.directMutationFiles.length,0);
  assert.equal(report.implicitLogic.photoLifecycle,true);
  assert.equal(report.implicitLogic.staleShiftRecovery,true);
  assert.equal(report.implicitLogic.unknownHppSafe,true);
  assert.equal(report.entries,1);
  assert.equal(report.screenCoverage.coveredFamilies,11);
  assert.equal(report.screenCoverage.unresolvedSelectors.length,0);
  assert.equal(report.correctionObserverDefault,true);
});

test('REF-01 implementation/release/QA handoff documents exist',()=>{
  for(const f of ['docs/REF01_IMPLEMENTATION_REPORT.md','docs/REF01_RELEASE_MANIFEST.md','docs/REF01_HANDOFF_TO_QA01.md']) assert.ok(existsSync(f),f);
});
