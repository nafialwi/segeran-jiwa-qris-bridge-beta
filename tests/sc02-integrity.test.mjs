import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { APPROVED_MUTATION_FILES, validateMutationSource } from '../scripts/sc04-mutation-policy.mjs';
const ROOT=dirname(dirname(fileURLToPath(import.meta.url)));
const EXPECTED='877dd5d80ad3cfbae9c8ded35ea37c426bf795392240adb96c38e62fc556154f';
const sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
function walk(dir){const out=[];for(const name of readdirSync(dir)){const p=join(dir,name);if(statSync(p).isDirectory())out.push(...walk(p));else if(p.endsWith('.js'))out.push(p)}return out}

test('SC-02 documentation and verifier artifacts exist',()=>{
  for(const rel of ['docs/SC02_WRITE_OWNERSHIP_MAP.md','docs/SC02_EXTRACTION_STATUS.md','docs/SC02_NO_REGRESSION_CONTRACT.md','docs/SC02_HANDOFF_TO_SC03.md','scripts/verify-sc02.mjs'])assert.ok(existsSync(join(ROOT,rel)),rel);
});

test('SC-02 extracted data/domain source permits mutations only in the exact P4 dedicated writer allowlist',()=>{
  const offenders=[],policyViolations=[];const re=/\.(?:set|update|transaction|remove)\s*\(/;
  for(const file of [...walk(join(ROOT,'src','data')),...walk(join(ROOT,'src','domain'))]){
    const text=readFileSync(file,'utf8'),rel=file.slice(ROOT.length+1).replaceAll('\\','/');
    if(re.test(text))offenders.push(rel);
    policyViolations.push(...validateMutationSource(rel,text));
  }
  assert.deepEqual(offenders.sort(),[...APPROVED_MUTATION_FILES].sort());
  assert.deepEqual(policyViolations,[]);
});

test('SC-02 compatibility dist remains byte-identical to frozen v1.0.40',()=>{
  execFileSync(process.execPath,[join(ROOT,'scripts','build.mjs')],{cwd:ROOT,stdio:'pipe'});
  assert.equal(sha(join(ROOT,'baseline','legacy-v1.0.40.html')),EXPECTED);
  assert.equal(sha(join(ROOT,'dist','index.html')),EXPECTED);
});

test('SC-02 verifier reports zero violations',()=>{
  execFileSync(process.execPath,[join(ROOT,'scripts','verify-sc02.mjs')],{cwd:ROOT,stdio:'pipe'});
  const result=JSON.parse(readFileSync(join(ROOT,'audit','sc02-verification.json'),'utf8'));
  assert.equal(result.violations.length,0);
  assert.equal(result.posRoot,'toko_segeranjiwa_v58');
  assert.equal(result.qrisRoot,'segeranjiwa_qris_beta_v1');
  assert.deepEqual([...result.directMutationFiles].sort(),[...APPROVED_MUTATION_FILES].sort());
  assert.deepEqual(result.mutationPolicyViolations,[]);
});

test('package retains SC-02 verification command after later phase bumps',()=>{
  const pkg=JSON.parse(readFileSync(join(ROOT,'package.json'),'utf8'));
  assert.ok(pkg.scripts['verify:sc02']);
});
