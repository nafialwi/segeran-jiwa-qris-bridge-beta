import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync,readFileSync } from 'node:fs';

const text=path=>readFileSync(path,'utf8');
const COMPAT='src/compat/rc01-qris-deferred-settlement-compat.js';

test('S10A classic compat exists and exposes Park/Restore/late-quarantine contracts without direct Firebase mutations',()=>{
  assert.equal(existsSync(COMPAT),true);
  const src=text(COMPAT);
  for(const token of [
    'RC01-S10A','Parkir QRIS & Layani Berikutnya','Pulihkan & Selesaikan',
    'attachSnapshotAndPark','findOwnedUnresolvedParked','confirmMatched','quarantineLateSignal',
    'LATE_AFTER_CANCEL','LATE_OR_NEW_AMBIGUOUS','QRIS_S10A_SECOND_QRIS_BLOCKED',
    'SERVE_NEXT_CUSTOMER','saleSnapshotVersion','S10A-1'
  ]) assert.ok(src.includes(token),`missing S10A compat token ${token}`);
  assert.doesNotMatch(src,/\b(?:db|ref|firebase)[A-Za-z0-9_?.]*\.(?:set|update|transaction|remove)\s*\(/);
});

test('S10A compat keeps parked pending on legacy WAITING_QRIS authority and wraps the existing matcher fail-closed',()=>{
  const src=text(COMPAT);
  assert.ok(src.includes('SJQrisSignalCore.matchSignal'));
  assert.ok(src.includes('classifyLateSignalConflict'));
  assert.ok(src.includes("status:'UNMATCHED'"));
  assert.ok(src.includes('candidateIds:[]'));
  assert.ok(src.includes('autoMatchBlocked'));
  assert.doesNotMatch(src,/status\s*[:=]\s*['"]PARKED/);
});

test('S10A build injects classic deferred-settlement compat after REF01 classic compat and before module entry',()=>{
  const build=text('scripts/build-ref01.mjs');
  assert.ok(build.includes('rc01-qris-deferred-settlement-compat.js'));
  const ref=build.indexOf('ref01-production-sales-compat.js');
  const s10a=build.indexOf('rc01-qris-deferred-settlement-compat.js');
  const entry=build.indexOf('src/ref01-entry.js');
  assert.ok(ref>=0&&s10a>ref&&entry>s10a,`unexpected injection order ref=${ref} s10a=${s10a} entry=${entry}`);
});

test('S10A recovery contract restores immutable pricing only around existing confirmMatched finalization',()=>{
  const src=text(COMPAT);
  for(const token of ['SJPrice.quote','SJPrice.fingerprint','pricingFingerprint','cartFingerprint','confirmMatched()','SJReliability.revalidateCart','priceChanged']){
    assert.ok(src.includes(token),`missing recovery token ${token}`);
  }
  assert.ok(src.includes('finally'));
  assert.ok(src.includes('QRIS_S10A_RECOVERY_CART_NOT_EMPTY'));
  assert.ok(src.includes('QRIS_S10A_RECOVERY_FINGERPRINT_MISMATCH'));
  assert.ok(src.includes('QRIS_S10A_RECOVERY_PRODUCT_MISSING'));
  assert.ok(src.includes('paid snapshot price is authoritative'));
  assert.ok(src.includes('originalRevalidate.apply'));
});


test('S10A.1 build contract injects early QRIS event-sync shield before frozen legacy Beta while keeping existing end-of-body order',()=>{
  const build=text('scripts/build-ref01.mjs');
  assert.ok(build.includes('rc01-qris-event-sync-shield.js'));
  assert.ok(build.includes('injectBeforeQrisBeta'));
  assert.ok(build.includes('SJQrisSignalBeta'));
  const ref=build.indexOf('ref01-production-sales-compat.js');
  const s10a=build.indexOf('rc01-qris-deferred-settlement-compat.js');
  const entry=build.indexOf('src/ref01-entry.js');
  assert.ok(ref>=0&&s10a>ref&&entry>s10a);
});
