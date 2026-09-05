import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';

const text=p=>readFileSync(p,'utf8');

test('R6C RED: build injects notification hygiene before SJX.init without changing frozen baseline',()=>{
  const build=text('scripts/build-ref01.mjs');
  assert.match(build,/rc01-notification-permission-hygiene\.js/);
  assert.match(build,/R6C_NOTIFICATION_ENTRY/);
  assert.match(build,/injectR6CNotificationHygiene/);
  assert.equal(existsSync('src/compat/rc01-notification-permission-hygiene.js'),true);
});

test('R6C RED: package exposes dedicated R6C gate and verifier locks user-gesture-only semantics',()=>{
  const pkg=JSON.parse(text('package.json'));
  assert.equal(pkg.scripts['verify:rc01:s10c-r6c'],'npm run build:ref01 && npm run build:rc01 && node scripts/verify-rc01-s10c-r6c.mjs && npm test');
  assert.equal(existsSync('scripts/verify-rc01-s10c-r6c.mjs'),true);
  const verifier=text('scripts/verify-rc01-s10c-r6c.mjs');
  for(const token of ['userActivation','requestPermission','SJX.init();','R6A_COMPAT_SHA256','R6B_HARDENER_SHA256','baseline/legacy-v1.0.40.html'])assert.ok(verifier.includes(token),`missing verifier token ${token}`);
});
