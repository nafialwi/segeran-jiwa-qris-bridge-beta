import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { injectLocalQaHtml, LOCAL_QA_GUARD_MARKER, LOCAL_QA_GUARD_SCRIPT } from '../scripts/local-qa-html.mjs';

test('v3.0 local QA injects read-only guard before Firebase app initialization and marks the page clearly',()=>{
  const html='<html><head><script src="https://www.gstatic.com/firebasejs/10.8.1/firebase-storage-compat.js"></script></head><body><script>firebase.initializeApp(fbCfg);</script></body></html>';
  const output=injectLocalQaHtml(html);
  assert.match(output,/LOCAL QA · READ ONLY/);
  assert.match(output,new RegExp(LOCAL_QA_GUARD_MARKER));
  assert.ok(output.indexOf(LOCAL_QA_GUARD_MARKER)<output.indexOf('firebase.initializeApp'), 'guard must execute before app initialization');
});

test('v3.0 local QA guard leaves production HTML untouched unless the local injector is explicitly used',()=>{
  const html='<html><body><main>production</main></body></html>';
  assert.equal(html.includes(LOCAL_QA_GUARD_MARKER),false);
  assert.equal(html.includes('LOCAL QA · READ ONLY'),false);
});

test('v3.0 local QA guard makes ordinary RTDB persistence ephemeral and rejects transaction writers',async()=>{
  const calls=[];
  class Reference{
    set(){calls.push('set')}
    update(){calls.push('update')}
    remove(){calls.push('remove')}
    transaction(){calls.push('transaction')}
    push(value){calls.push(value===undefined?'push-key':'push-write');return new Reference()}
  }
  const context={
    window:{firebase:{database:{Reference}}},
    console:{warn(){}},
    setInterval(){throw new Error('poll should not be needed')},
    clearInterval(){}
  };
  vm.runInNewContext(LOCAL_QA_GUARD_SCRIPT,context);
  const ref=new Reference();
  await ref.set({x:1});
  await ref.update({x:2});
  await ref.remove();
  ref.push({x:3});
  assert.deepEqual(calls,['push-key'],'set/update/remove/push(value) must not call original persistence methods');
  await assert.rejects(()=>ref.transaction(()=>({x:4})),/LOCAL_QA_READ_ONLY/);
  assert.equal(context.window.__SJ_LOCAL_QA_READ_ONLY,true);
  assert.equal(context.window.__SJ_LOCAL_QA_GUARD_ACTIVE,true);
});
