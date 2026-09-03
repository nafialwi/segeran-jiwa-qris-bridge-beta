import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT=path.resolve(new URL('..', import.meta.url).pathname);
const css=fs.readFileSync(path.join(ROOT,'src/ui/ref01.css'),'utf8');
const bootstrapUrl=pathToFileURL(path.join(ROOT,'src/app/ref01-bootstrap.js')).href;

test('active sjui03a sales grid obeys product column preference 2/3/4',()=>{
  assert.match(css,/html\[data-sj-product-cols="2"\]\s+\.sjui03a-grid\s*\{[^}]*grid-template-columns:\s*repeat\(2,minmax\(0,1fr\)\)/s);
  assert.match(css,/html\[data-sj-product-cols="3"\]\s+\.sjui03a-grid\s*\{[^}]*grid-template-columns:\s*repeat\(3,minmax\(0,1fr\)\)/s);
  assert.match(css,/html\[data-sj-product-cols="4"\]\s+\.sjui03a-grid\s*\{[^}]*grid-template-columns:\s*repeat\(4,minmax\(0,1fr\)\)/s);
  assert.match(css,/html\[data-sj-product-cols="4"\]\s+\.sjui03a-pcopy\s*\{[^}]*padding:/s);
  assert.match(css,/html\[data-sj-product-cols="4"\]\s+\.sjui03a-add\s*\{[^}]*width:/s);
});

test('late operational renderer is wrapped and reconciled after legacy DOM write', async()=>{
  const mod=await import(`${bootstrapUrl}?rc4=${Date.now()}`);
  assert.equal(typeof mod.installOperationalPresentationAuthority,'function');
  const calls=[];
  const target={renderOperations(){calls.push('legacy');return 7}};
  const runtime={SJFinalRefinementVC02A:target};
  const ctl=mod.installOperationalPresentationAuthority(runtime,{reconcile:reason=>calls.push(reason)});
  assert.equal(ctl.installed,true);
  assert.equal(target.renderOperations(),7);
  assert.deepEqual(calls,['legacy','late-operational-render']);
  ctl.stop();
});
