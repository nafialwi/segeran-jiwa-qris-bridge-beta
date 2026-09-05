import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import crypto from 'node:crypto';

const text=p=>readFileSync(p,'utf8');
const sha=p=>crypto.createHash('sha256').update(readFileSync(p)).digest('hex');

test('R6B RED: ref01 entry installs the loading hardening module without modifying R6A QRIS compat',()=>{
  const entry=text('src/ref01-entry.js');
  assert.match(entry,/rc01-runtime-loading-hardening\.js/);
  assert.match(entry,/installRc01RuntimeLoadingHardening\(globalThis\)/);
  assert.equal(sha('src/compat/rc01-qris-deferred-settlement-compat.js'),'d24646468e7d8595ff1b356d9ba6a6f732efd1e40f02e8f6c28f924a39a7e355');
  assert.equal(sha('baseline/legacy-v1.0.40.html'),'877dd5d80ad3cfbae9c8ded35ea37c426bf795392240adb96c38e62fc556154f');
});

test('R6B RED: runtime hardener is read-only and package exposes a dedicated gate',()=>{
  const src=text('src/app/rc01-runtime-loading-hardening.js');
  assert.equal(/\b(?:db|database)\s*\.\s*ref\([^;\n]*?\)\s*\.\s*(?:set|update|remove|transaction)\s*\(/.test(src),false,'R6B must not add direct RTDB writes');
  const pkg=JSON.parse(text('package.json'));
  assert.equal(pkg.scripts['verify:rc01:s10c-r6b'],'npm run build:ref01 && npm run build:rc01 && node scripts/verify-rc01-s10c-r6a.mjs && node scripts/verify-rc01-s10c-r6b.mjs && npm test');
  assert.equal(existsSync('scripts/verify-rc01-s10c-r6b.mjs'),true);
});
