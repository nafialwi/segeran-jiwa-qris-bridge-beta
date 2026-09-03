import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync,readFileSync } from 'node:fs';
const text=p=>readFileSync(p,'utf8');

test('S10A has a dedicated verifier chained after the full RC01 gate',()=>{
  const pkg=JSON.parse(text('package.json'));
  assert.equal(pkg.scripts['verify:rc01:s10a'],'npm run verify:rc01 && node scripts/verify-rc01-s10a.mjs');
  assert.equal(existsSync('scripts/verify-rc01-s10a.mjs'),true);
});

test('S10A verifier locks baseline, roots, build order, parked recovery, late quarantine, and exact four-writer boundary',()=>{
  const script=text('scripts/verify-rc01-s10a.mjs');
  for(const token of [
    '877dd5d80ad3cfbae9c8ded35ea37c426bf795392240adb96c38e62fc556154f',
    'toko_segeranjiwa_v58','segeranjiwa_qris_beta_v1','MUTATION_ALLOWLIST_DRIFT',
    'rc01-qris-deferred-settlement-compat.js','qris-deferred-settlement-writer.js',
    'Parkir QRIS & Layani Berikutnya','Pulihkan & Selesaikan','LATE_AFTER_CANCEL','LATE_OR_NEW_AMBIGUOUS',
    'QRIS_S10A_DIRECT_FIREBASE_MUTATION','S10A_BUILD_ORDER_DRIFT'
  ]) assert.ok(script.includes(token),`missing S10A verifier token ${token}`);
});
