import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT=dirname(dirname(fileURLToPath(import.meta.url)));
const EXPECTED='877dd5d80ad3cfbae9c8ded35ea37c426bf795392240adb96c38e62fc556154f';
const sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
function walk(dir){const out=[];for(const name of readdirSync(dir)){const p=join(dir,name);if(statSync(p).isDirectory())out.push(...walk(p));else if(p.endsWith('.js'))out.push(p)}return out}

test('SC-03 exit-gate verifier and authority documents exist',()=>{
  for(const rel of [
    'scripts/verify-sc03.mjs',
    'docs/SC03_LEGACY_CALLER_RENDERER_MAP.md',
    'docs/SC03_MENU_CAPABILITY_MAP.md',
    'docs/SC03_NO_REGRESSION_CONTRACT.md'
  ]) assert.ok(existsSync(join(ROOT,rel)),rel);
});

test('SC-03 app/core/modules source contains no direct Firebase mutation primitive or session localStorage workaround',()=>{
  const offenders=[];
  const sessionOffenders=[];
  const mutation=/\.(?:set|update|transaction|remove)\s*\(/;
  for(const dir of ['src/app','src/core','src/modules']){
    for(const file of walk(join(ROOT,dir))){
      const text=readFileSync(file,'utf8');
      if(mutation.test(text)) offenders.push(relative(ROOT,file));
      if(/localStorage/i.test(text)) sessionOffenders.push(relative(ROOT,file));
    }
  }
  assert.deepEqual(offenders,[]);
  assert.deepEqual(sessionOffenders,[]);
});

test('SC-03 bootstrap statically owns each approved visible legacy caller once',()=>{
  const text=readFileSync(join(ROOT,'src','app','bootstrap.js'),'utf8');
  const globals=['showView','openOpr','closeOpr','openLap','closeLap','openMst','closeMst','openCartModal'];
  for(const name of globals){
    assert.equal((text.match(new RegExp(`installGlobal\\('${name}'`,'g'))||[]).length,1,name);
  }
  for(const pair of [
    ['SJX','openDashboard'],
    ['SJCommercialFinalV5961','openPayment'],
    ['SJRefinementCheckoutV100','openCheckout']
  ]){
    const [objectName,methodName]=pair;
    assert.equal((text.match(new RegExp(`installMethod\\('${objectName}','${methodName}'`,'g'))||[]).length,1,`${objectName}.${methodName}`);
  }
});

test('SC-03 verifier reports zero violations while compatibility rollback remains exact',()=>{
  const pkg=JSON.parse(readFileSync(join(ROOT,'package.json'),'utf8'));
  assert.ok(pkg.scripts['verify:sc03']);
  execFileSync(process.execPath,[join(ROOT,'scripts','build-sc03.mjs')],{cwd:ROOT,stdio:'pipe'});
  execFileSync(process.execPath,[join(ROOT,'scripts','verify-sc03.mjs')],{cwd:ROOT,stdio:'pipe'});
  const result=JSON.parse(readFileSync(join(ROOT,'audit','sc03-verification.json'),'utf8'));
  assert.equal(result.violations.length,0);
  assert.equal(result.baselineSha256,EXPECTED);
  assert.equal(result.compatibilityDistSha256,EXPECTED);
  assert.equal(result.posRoot,'toko_segeranjiwa_v58');
  assert.equal(result.qrisRoot,'segeranjiwa_qris_beta_v1');
  assert.equal(result.candidateEntryCount,1);
  assert.equal(result.targetFeaturePlaceholderFiles.length,0);
  assert.equal(result.directMutationFiles.length,0);
  assert.equal(result.featureRuntime.featureCount,42);
  assert.equal(result.featureRuntime.activeCount,40);
  assert.equal(result.featureRuntime.deferredCount,2);
  assert.equal(result.featureRuntime.bootstrapUsesFeatureRuntime,true);
  assert.equal(result.featureRuntime.publicWrappersThroughFeatures,true);
  assert.equal(Object.values(result.featureRuntime.domainSeams).every(Boolean),true);
  assert.equal(sha(join(ROOT,'dist','index.html')),EXPECTED);
});
