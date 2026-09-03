import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync,readFileSync } from 'node:fs';

const text=path=>readFileSync(path,'utf8');

test('RC01 exposes a dedicated release verifier after the full REF01 gate',()=>{
  const pkg=JSON.parse(text('package.json'));
  assert.equal(pkg.scripts['verify:rc01'],'npm run verify:ref01 && npm run build:rc01 && node scripts/verify-rc01.mjs');
  assert.equal(existsSync('scripts/verify-rc01.mjs'),true);
});

test('RC01 release verifier covers every blueprint release boundary with the exact approved writer allowlist',()=>{
  const script=text('scripts/verify-rc01.mjs');
  for(const token of [
    'toko_segeranjiwa_v58','segeranjiwa_qris_beta_v1','BASELINE_HASH_DRIFT',
    'RECONNECT_RETRY_MISSING','ANDROID_BACK_CONTRACT_MISSING','BARCODE_CAMERA_CONTRACT_MISSING',
    'QRIS_CONTRACT_MISSING','PRINTER_CONTRACT_MISSING','SHARE_CONTRACT_MISSING','PDF_PRINT_CONTRACT_MISSING',
    'NOTIFICATION_DEEPLINK_CONTRACT_MISSING','CLOSING_REPORT_CONTRACT_MISSING','MUTATION_ALLOWLIST_DRIFT'
  ]) assert.ok(script.includes(token),`missing RC verifier token ${token}`);
  assert.doesNotMatch(script,/\b(?:db|ref|firebase)[A-Za-z0-9_?.]*\.(?:set|update|transaction|remove)\s*\(/);
});
