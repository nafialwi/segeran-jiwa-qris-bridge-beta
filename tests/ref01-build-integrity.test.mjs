import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const expected='877dd5d80ad3cfbae9c8ded35ea37c426bf795392240adb96c38e62fc556154f';
const sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex');

test('REF-01 candidate build appends one convergence entry and preserves rollback artifacts',()=>{
  execFileSync(process.execPath,['scripts/build-ref01.mjs'],{stdio:'pipe'});
  const html=readFileSync('dist-ref01/index.html','utf8');
  assert.equal((html.match(/data-sj-ref01-entry="true"/g)||[]).length,1);
  assert.equal((html.match(/src="\.\/src\/ref01-entry\.js"/g)||[]).length,1);
  assert.equal(sha('dist/index.html'),expected);
  assert.equal(sha('baseline/legacy-v1.0.40.html'),expected);
  assert.ok(readFileSync('dist-ref01/src/ui/ref01.css','utf8').includes('--sj-ref-motion:200ms'));
});

test('REF-01 package exposes build/dev/full verification while retaining SC-04 gate',()=>{
  const pkg=JSON.parse(readFileSync('package.json','utf8'));
  assert.equal(pkg.scripts['build:ref01'],'node scripts/build-ref01.mjs');
  assert.equal(pkg.scripts['dev:ref01'],'node scripts/dev-server.mjs dist-ref01');
  assert.match(pkg.scripts['verify:ref01'],/verify:sc04|verify-sc04/);
  assert.ok(pkg.scripts['verify:sc04']);
});
