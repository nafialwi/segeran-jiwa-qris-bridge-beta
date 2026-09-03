import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT=path.resolve(new URL('..', import.meta.url).pathname);
const bootstrapUrl=pathToFileURL(path.join(ROOT,'src/app/ref01-bootstrap.js')).href;

test('operational authority reconciles after lexical legacy timers from showView and closeOpr', async()=>{
  const mod=await import(`${bootstrapUrl}?rc5op=${Date.now()}`);
  const calls=[];
  const queue=[];
  const runtime={
    setTimeout(fn){queue.push(fn);return queue.length},
    showView(n){calls.push(`show:${n}`);if(Number(n)===2)this.setTimeout(()=>calls.push('lexical-renderOperations'),0)},
    closeOpr(){calls.push('closeOpr');this.setTimeout(()=>calls.push('lexical-renderOperations-close'),0)},
    SJFinalRefinementVC02A:{renderOperations(){calls.push('public-renderOperations')}}
  };
  const ctl=mod.installOperationalPresentationAuthority(runtime,{reconcile:reason=>calls.push(`reconcile:${reason}`)});
  assert.equal(ctl.installed,true);
  while(queue.length)queue.shift()();
  calls.length=0;
  runtime.showView(2);
  while(queue.length)queue.shift()();
  assert.deepEqual(calls.slice(0,3),['show:2','lexical-renderOperations','reconcile:post-operational-route']);
  calls.length=0;
  runtime.closeOpr();
  while(queue.length)queue.shift()();
  assert.deepEqual(calls,['closeOpr','lexical-renderOperations-close','reconcile:post-operational-close']);
  ctl.stop();
});

test('LOCAL QA layout shadow keeps role-aware 4-column choice even when production state remains 3', async()=>{
  const mod=await import(`${bootstrapUrl}?rc5qa=${Date.now()}`);
  assert.equal(typeof mod.installLocalQaLayoutAuthority,'function');
  const root={dataset:{}};
  const document={documentElement:root};
  const selected={
    roleLayouts:{
      manajemen:{productColumns:4,operationColumns:2,reportColumns:2,compactCards:false},
      transaksi:{productColumns:3,operationColumns:2,reportColumns:2,compactCards:true}
    },
    managementColumns:2,productMasterColumns:2,longPressEdit:true
  };
  const runtime={
    __SJ_LOCAL_QA_READ_ONLY:true,
    SJMobileProfessionalP1:{effective(){return {productColumns:3,operationColumns:2,reportColumns:2,managementColumns:2,productMasterColumns:2,compactCards:false}}},
    SJMobileUX:{
      collectSettings(){return structuredClone(selected)},
      async saveSettings(){return {ok:true}}
    }
  };
  let changed=0;
  const ctl=mod.installLocalQaLayoutAuthority(runtime,{role:()=> 'owner',onChanged:()=>changed++});
  assert.equal(ctl.installed,true);
  await runtime.SJMobileUX.saveSettings();
  assert.equal(runtime.__SJ_LOCAL_QA_UI_SETTINGS.roleLayouts.manajemen.productColumns,4);
  const applied=mod.reconcileLayoutPreferences(document,runtime,{role:'owner'});
  assert.equal(applied.productColumns,4);
  assert.equal(root.dataset.sjProductCols,'4');
  assert.ok(changed>=1);
  ctl.stop();
});
