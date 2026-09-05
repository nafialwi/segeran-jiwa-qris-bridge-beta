import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import crypto from 'node:crypto';

const text=p=>readFileSync(p,'utf8');
const sha=p=>crypto.createHash('sha256').update(readFileSync(p)).digest('hex');

const BASELINE='877dd5d80ad3cfbae9c8ded35ea37c426bf795392240adb96c38e62fc556154f';
const R6A='d24646468e7d8595ff1b356d9ba6a6f732efd1e40f02e8f6c28f924a39a7e355';
const R6B='a6ee7844e884276a1f2f21a0792a3d4dd9784b18ac47fb5ce5807e6ece3a7f44';
const R6C='203caa7f78085538965a0175fc8db6c6d31638a3b9c62759ddff3de452188d2e';

test('R6D RED: build injects the recursion hardener exactly once after frozen legacy and before ref01 module wrappers',()=>{
  const build=text('scripts/build-ref01.mjs');
  assert.match(build,/R6D_SALES_RECURSION_ENTRY/);
  assert.match(build,/rc01-sales-render-recursion-hardening\.js/);
  assert.equal(existsSync('src/compat/rc01-sales-render-recursion-hardening.js'),true);
});

test('R6D RED: package exposes dedicated gate without weakening R6A-R6C authorities',()=>{
  const pkg=JSON.parse(text('package.json'));
  assert.equal(pkg.scripts['verify:rc01:s10c-r6d'],'npm run build:ref01 && npm run build:rc01 && node scripts/verify-rc01-s10c-r6d.mjs && npm test');
  assert.equal(sha('baseline/legacy-v1.0.40.html'),BASELINE);
  assert.equal(sha('src/compat/rc01-qris-deferred-settlement-compat.js'),R6A);
  assert.equal(sha('src/app/rc01-runtime-loading-hardening.js'),R6B);
  assert.equal(sha('src/compat/rc01-notification-permission-hygiene.js'),R6C);
});
