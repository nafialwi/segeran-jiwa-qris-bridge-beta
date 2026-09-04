import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync,readFileSync } from 'node:fs';

const text=p=>readFileSync(p,'utf8');

test('R6A RED: package exposes a dedicated release gate without weakening the frozen R5 gate',()=>{
  const pkg=JSON.parse(text('package.json'));
  assert.equal(pkg.scripts['verify:rc01:s10c-r5'],'npm run verify:rc01:s10c-r4 && node scripts/verify-rc01-s10c-r5.mjs');
  assert.equal(pkg.scripts['verify:rc01:s10c-r6a'],'npm run verify:rc01:s10a2 && node scripts/verify-rc01-s10c.mjs && node scripts/verify-rc01-s10c-r1.mjs && node scripts/verify-rc01-s10c-r5.mjs && node scripts/verify-rc01-s10c-r6a.mjs');
  assert.equal(existsSync('scripts/verify-rc01-s10c-r6a.mjs'),true);
});

test('R6A RED: verifier locks cancel close/busy/timeout semantics and preserves R4/R5 safety boundaries',()=>{
  const src=text('scripts/verify-rc01-s10c-r6a.mjs');
  for(const token of [
    'R5_COMPAT_SHA256','R6A_COMPAT_SHA256','COMMERCIAL_CANCEL_TIMEOUT_MS=8000',
    'cancelCommercialPending','releaseCommercialPayment','leaveTransactionFlow',
    'QRIS_S10C_R6_CANCEL_TIMEOUT','providerTransactionId',
    'R6A_NEW_MUTATION_TOKEN','applyLateQuarantineRules','verifyR5Candidate',
    'lateHeld[id]','sameDurableLate','dist-rc01/src/compat/rc01-qris-deferred-settlement-compat.js'
  ]) assert.ok(src.includes(token),`missing R6A verifier token ${token}`);
});
