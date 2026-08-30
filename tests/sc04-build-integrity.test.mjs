import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT=dirname(dirname(fileURLToPath(import.meta.url)));
const EXPECTED='877dd5d80ad3cfbae9c8ded35ea37c426bf795392240adb96c38e62fc556154f';
const sha=file=>createHash('sha256').update(readFileSync(file)).digest('hex');

test('SC-04 build appends exactly one session runtime entry while immutable rollback remains exact',()=>{
  execFileSync(process.execPath,[join(ROOT,'scripts','build-sc04.mjs')],{cwd:ROOT,stdio:'pipe'});
  const base=join(ROOT,'baseline','legacy-v1.0.40.html'),compat=join(ROOT,'dist','index.html'),candidate=join(ROOT,'dist-sc04','index.html');
  assert.equal(sha(base),EXPECTED);
  assert.equal(sha(compat),EXPECTED);
  assert.ok(existsSync(candidate));
  const text=readFileSync(candidate,'utf8');
  assert.equal((text.match(/data-sj-sc04-entry="true"/g)||[]).length,1);
  assert.equal((text.match(/data-sj-sc03-entry="true"/g)||[]).length,0);
  assert.ok(text.includes('src/sc04-entry.js'));
  assert.ok(existsSync(join(ROOT,'dist-sc04','src','app','sc04-bootstrap.js')));
  assert.ok(existsSync(join(ROOT,'dist-sc04','src','core','session-manager.js')));
});

test('SC-04 package exposes build/dev/full verification while retaining all prior gates',()=>{
  const pkg=JSON.parse(readFileSync(join(ROOT,'package.json'),'utf8'));
  assert.equal(pkg.version,'0.4.0-sc04');
  for(const name of ['verify:sc02','verify:sc03','build:sc03','build:sc04','dev:sc04','verify:sc04']) assert.equal(typeof pkg.scripts[name],'string',name);
  assert.ok(pkg.scripts['verify:sc04'].includes('verify-sc04.mjs'));
  assert.ok(pkg.scripts['verify:sc04'].includes('npm test'));
});

test('SC-04 verifier emits zero violations and proves session persistence safety gates',()=>{
  assert.ok(existsSync(join(ROOT,'scripts','verify-sc04.mjs')));
  execFileSync(process.execPath,[join(ROOT,'scripts','build-sc04.mjs')],{cwd:ROOT,stdio:'pipe'});
  execFileSync(process.execPath,[join(ROOT,'scripts','verify-sc04.mjs')],{cwd:ROOT,stdio:'pipe'});
  const audit=JSON.parse(readFileSync(join(ROOT,'audit','sc04-verification.json'),'utf8'));
  assert.deepEqual(audit.violations,[]);
  assert.equal(audit.posRoot,'toko_segeranjiwa_v58');
  assert.equal(audit.qrisRoot,'segeranjiwa_qris_beta_v1');
  assert.equal(audit.session.singleStorageBoundary,true);
  assert.equal(audit.session.firebaseLocalPersistence,true);
  assert.equal(audit.session.noStoredCredentials,true);
  assert.equal(audit.session.noShiftCreation,true);
  assert.equal(audit.session.liveRevocationGuard,true);
  assert.equal(audit.authWrapperOwnership.login,1);
  assert.equal(audit.authWrapperOwnership.completeLogin,1);
  assert.equal(audit.authWrapperOwnership.logout,1);
});

test('SC-04 authority/UAT/source workflow documents are present',()=>{
  for(const rel of [
    'docs/SC04_SESSION_POLICY.md','docs/SC04_UAT_CHECKLIST.md','docs/SC04_IMPLEMENTATION_REPORT.md',
    'docs/SC04_HANDOFF_TO_REF01.md','docs/SC04_SOURCE_WORKFLOW.md'
  ]) assert.ok(existsSync(join(ROOT,rel)),rel);
});
