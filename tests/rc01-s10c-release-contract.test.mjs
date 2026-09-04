import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const ROOT=dirname(dirname(fileURLToPath(import.meta.url)));
const sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex');

test('S10C exposes dedicated verifier and preserves frozen baseline authority',()=>{
  const pkg=JSON.parse(readFileSync(join(ROOT,'package.json'),'utf8'));
  assert.equal(pkg.scripts['verify:rc01:s10c'],'npm run verify:rc01:s10a2 && node scripts/verify-rc01-s10c.mjs');
  assert.ok(existsSync(join(ROOT,'scripts','verify-rc01-s10c.mjs')));
  assert.equal(sha(join(ROOT,'baseline','legacy-v1.0.40.html')),'877dd5d80ad3cfbae9c8ded35ea37c426bf795392240adb96c38e62fc556154f');
});

test('S10C REF generated HTML carries sync authority while RC equality remains dedicated-verifier owned',()=>{
  execFileSync(process.execPath,[join(ROOT,'scripts','build-ref01.mjs')],{cwd:ROOT,stdio:'pipe'});
  const ref=join(ROOT,'dist-ref01','index.html');
  assert.match(readFileSync(ref,'utf8'),/data-sj-rc01-s10c-sync-authority="true"/);
  const verifier=readFileSync(join(ROOT,'scripts','verify-rc01-s10c.mjs'),'utf8');
  assert.match(verifier,/REF_RC_RUNTIME_MISMATCH/);
});
