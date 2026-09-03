import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { PRESENTATION_AUTHORITIES, createPresentationLifecycle } from '../src/ui/presentation-authority.js';

const read=rel=>fs.readFileSync(new URL('../'+rel,import.meta.url),'utf8');

test('v3.0 defines one canonical presentation authority for every P1 surface',()=>{
  assert.deepEqual(Object.keys(PRESENTATION_AUTHORITIES),['dashboard','sales','cart','checkout','receipt','operational','reports','settings','notifications','profile']);
  for(const [surface,entry] of Object.entries(PRESENTATION_AUTHORITIES)){
    assert.equal(typeof entry.owner,'string',surface+' owner');
    assert.equal(typeof entry.selector,'string',surface+' selector');
    assert.ok(entry.owner.length>3);
    assert.ok(entry.selector.length>0);
  }
  assert.equal(PRESENTATION_AUTHORITIES.receipt.owner,'transaction-detail-refinement');
  assert.equal(PRESENTATION_AUTHORITIES.reports.owner,'report-refinement');
});

test('v3.0 presentation lifecycle is deterministic and does not need a broad MutationObserver',()=>{
  const calls=[];
  const runtime={
    requestAnimationFrame(fn){fn();},
    showView(n){calls.push(['showView',n]);return n;},
    clsModal(id){calls.push(['clsModal',id]);return id;},
    buildScreenReceipt(){calls.push(['receipt']);return 'ok';},
    addEventListener(){},removeEventListener(){}
  };
  const api=createPresentationLifecycle(runtime,{document:{},reconcile:reason=>calls.push(['reconcile',reason])});
  api.install();
  runtime.showView(2);runtime.clsModal('modal-struk-fs');runtime.buildScreenReceipt();
  assert.ok(calls.some(x=>x[0]==='reconcile'&&x[1]==='route:2'));
  assert.ok(calls.some(x=>x[0]==='reconcile'&&x[1]==='modal:modal-struk-fs'));
  assert.ok(calls.some(x=>x[0]==='reconcile'&&x[1]==='receipt'));
  assert.equal(api.snapshot().observer,'none');
});

test('v3.0 REF01 bootstrap no longer installs subtree class/style MutationObserver correction lifecycle',()=>{
  const src=read('src/app/ref01-bootstrap.js');
  const entry=read('src/ref01-entry.js');
  assert.doesNotMatch(src,/new\s+runtime\.MutationObserver|attributeFilter\s*:\s*\[['"]class['"],['"]style['"]\]/);
  assert.doesNotMatch(entry,/observe\s*:\s*true/);
  assert.match(src,/createPresentationLifecycle/);
});

test('v3.0 sales history delegation is scoped to report root instead of document-global click',()=>{
  const src=read('src/ui/report-sales-history-refinement.js');
  assert.doesNotMatch(src,/document\.addEventListener\(['"]click['"]/);
  assert.match(src,/dataset\.sjV30SalesHistoryDelegated/);
  assert.match(src,/root\(\)\?\.addEventListener\?\.\(['"]click['"]/);
});

test('v3.0 local QA command serves dist-ref01 and indicator is dev-server-only',()=>{
  const pkg=JSON.parse(read('package.json'));
  const [maj]=String(pkg.version).split('.').map(Number);assert.ok(maj>=3);
  assert.equal(pkg.scripts['qa:local'],'npm run build:ref01 && SJ_LOCAL_QA=1 node scripts/dev-server.mjs dist-ref01');
  const server=read('scripts/dev-server.mjs');
  assert.match(server,/dist-ref01/);
  assert.match(server,/SJ_LOCAL_QA/);
  assert.match(server,/LOCAL QA/);
  const entry=read('src/ref01-entry.js');
  assert.doesNotMatch(entry,/LOCAL QA/,'production source entry must not contain the local-only badge');
});

test('v3.0 presentation safety verifier is wired into verify:ref01',()=>{
  const pkg=JSON.parse(read('package.json'));
  assert.match(pkg.scripts['verify:ref01'],/verify:v30:presentation/);
  assert.equal(pkg.scripts['verify:v30:presentation'],'node scripts/verify-v30-presentation.mjs');
});
