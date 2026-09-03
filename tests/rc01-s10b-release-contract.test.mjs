import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync,readFileSync,readdirSync,statSync } from 'node:fs';
import { join,relative } from 'node:path';

const EXPECTED_BASELINE='877dd5d80ad3cfbae9c8ded35ea37c426bf795392240adb96c38e62fc556154f';
const EXPECTED_WRITERS=[
  'src/data/writers/finance-writer.js','src/data/writers/purchase-reconciliation-writer.js',
  'src/data/writers/qris-cash-out-coordinator.js','src/data/writers/qris-deferred-settlement-writer.js'
].sort();
const sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
function walk(dir){const out=[];for(const name of readdirSync(dir)){const p=join(dir,name);if(statSync(p).isDirectory())out.push(...walk(p));else out.push(p)}return out}

test('S10B keeps frozen baseline and mutation writer authority unchanged',()=>{
  assert.equal(sha('baseline/legacy-v1.0.40.html'),EXPECTED_BASELINE);
  const mutation=/\.(?:set|update|transaction|remove)\s*\(/;
  const writers=walk('src').filter(p=>p.endsWith('.js')&&mutation.test(readFileSync(p,'utf8'))).map(p=>relative('.',p).replaceAll('\\','/')).sort();
  assert.deepEqual(writers,EXPECTED_WRITERS);
});

test('S10B tracer is observational and declares no direct Firebase mutation',()=>{
  const src=readFileSync('src/compat/rc01-firebase-pending-write-trace.js','utf8');
  assert.match(src,/RC01-S10B/);
  assert.match(src,/SYNC_WRITE_STUCK/);
  assert.match(src,/activeWrites/);
  assert.match(src,/snapshot/);
  assert.doesNotMatch(src,/\bdb\.ref\([^\n]*\)\.(?:set|update|remove|transaction)\s*\(/);
});

test('S10B build injects trace before P3 definition and exposes verification command',()=>{
  const build=readFileSync('scripts/build-ref01.mjs','utf8');
  assert.match(build,/rc01-firebase-pending-write-trace\.js/);
  assert.match(build,/data-sj-rc01-s10b-pending-write-trace/);
  assert.match(build,/const SJProductionArchitectureP3=\{/);
  assert.equal(existsSync('scripts/verify-rc01-s10b.mjs'),true);
  const pkg=JSON.parse(readFileSync('package.json','utf8'));
  assert.equal(pkg.scripts['verify:rc01:s10b'],'npm run verify:rc01:s10a2 && node scripts/verify-rc01-s10b.mjs');
});
