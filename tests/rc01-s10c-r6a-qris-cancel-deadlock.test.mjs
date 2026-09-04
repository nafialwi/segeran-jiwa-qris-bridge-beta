import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const COMPAT='src/compat/rc01-qris-deferred-settlement-compat.js';
const source=readFileSync(COMPAT,'utf8');

async function flush(){
  for(let i=0;i<6;i++)await Promise.resolve();
}

async function bootCompat({cancelImpl=async()=>true,confirmResult=true,providerTransactionId=null}={}){
  const intervals=[];
  const timers=[];
  const closed=[];
  const toasts=[];
  let leaveCalls=0;
  let cancelCalls=0;

  const cancelButton={
    __s10a:false,
    disabled:false,
    textContent:'Batalkan QRIS',
    onclick:null
  };
  const backButton={textContent:'Kembali',onclick:null};
  const closeButton={onclick:null};
  const page={
    querySelector(selector){
      if(selector==='[data-pay-back]')return backButton;
      if(selector==='[data-pay-close]')return closeButton;
      if(selector==='#sj-qris-commercial-cancel')return cancelButton;
      if(selector==='#sj-qris-commercial-actions')return null;
      if(selector==='[data-s10a-park]')return null;
      return null;
    }
  };
  const modal={querySelector(selector){return selector==='.sj61-pay'?page:null}};
  const overlay={style:{display:'flex'}};
  const surface={style:{display:'none'},innerHTML:'',querySelector(){return null}};

  const context={
    console,
    payMethod:'QRIS',
    currentLoginId:'kasir-1',
    cart:[{id:'P',n:'Produk',q:1,p:1000}],
    activeDate:'2026-09-04',
    confirm:()=>confirmResult,
    alert:message=>toasts.push(String(message)),
    showToast:(message,type)=>toasts.push(`${type||'info'}:${message}`),
    clsModal:id=>{closed.push(id);if(id==='modal-bayar')overlay.style.display='none'},
    showView(){},
    updateCartUI(){},
    setInterval(fn,ms){const id=intervals.length+1;intervals.push({id,fn,ms});return id},
    clearInterval(){},
    setTimeout(fn,ms){const id=timers.length+1;timers.push({id,fn,ms});return id},
    clearTimeout(){},
    document:{
      body:{appendChild(){},classList:{add(){},remove(){}}},
      getElementById(id){if(id==='modal-bayar')return overlay;if(id==='sj-s10a-qris-surface')return surface;return null},
      querySelector(selector){if(selector==='#modal-bayar .modal')return modal;return null},
      createElement(){return {style:{},setAttribute(){},appendChild(){},querySelector(){return null}}}
    },
    addEventListener(){},
  };
  context.window=context;
  context.SJQrisSignalCore={
    matchSignal(){return {status:'UNMATCHED',candidateIds:[]}},
    cartFingerprint(){return 'fp'}
  };
  context.SJQrisSignalBeta={
    status(){return {activePendingId:'PENDING-1'}},
    async cancelWaiting(safe){cancelCalls++;return await cancelImpl(safe)}
  };
  context.SJCommercialFinalV5961={openPayment(){return true},cartMethod:'QRIS'};
  context.SJFinalRefinementVC01A2={leaveTransactionFlow(){leaveCalls++}};
  context.__SJ_QRIS_DEFERRED_SETTLEMENT_RUNTIME={
    policy:{
      isUnresolvedParkedPending(){return false},
      classifyLateSignalConflict(){return null}
    },
    writer:{attachSnapshotAndPark(){},quarantineLateSignal(){}},
    async findOwnedUnresolvedParked(){return []},
    async findLateReviewSignals(){return []},
    async readPending(){return {pendingId:'PENDING-1',cashierId:'kasir-1',status:'WAITING_QRIS',amount:1000,providerTransactionId}}
  };

  vm.runInNewContext(source,context,{filename:COMPAT});
  const installTimer=timers.find(t=>t.ms===0);
  assert.ok(installTimer,'compat install timer missing');
  installTimer.fn();
  await flush();
  const patchInterval=intervals.find(t=>t.ms===250);
  assert.ok(patchInterval,'QRIS sheet patch interval missing');
  patchInterval.fn();
  assert.equal(typeof cancelButton.onclick,'function','commercial QRIS cancel handler was not installed');

  return {
    context,overlay,cancelButton,closed,toasts,timers,
    get leaveCalls(){return leaveCalls},
    get cancelCalls(){return cancelCalls}
  };
}

test('R6A RED: successful commercial QRIS cancel closes modal-bayar and releases transaction interaction state',async()=>{
  const env=await bootCompat({cancelImpl:async()=>true});
  await env.cancelButton.onclick();
  await flush();
  assert.equal(env.cancelCalls,1);
  assert.equal(env.overlay.style.display,'none','successful authoritative cancel must close the active payment overlay');
  assert.equal(env.leaveCalls,1,'successful cancel must release the focused transaction interaction state');
});

test('R6A RED: commercial QRIS cancel stays busy until authoritative cancel resolves',async()=>{
  let resolveCancel;
  const env=await bootCompat({cancelImpl:()=>new Promise(resolve=>{resolveCancel=resolve})});
  const click=env.cancelButton.onclick();
  await flush();
  assert.equal(env.cancelButton.disabled,true,'cancel must be disabled while cancellation is in flight');
  resolveCancel(true);
  await click;
  await flush();
  assert.equal(env.overlay.style.display,'none');
});

test('R6A RED: failed authoritative QRIS cancel remains fail-closed and restores the cancel control',async()=>{
  const env=await bootCompat({cancelImpl:async()=>false});
  await env.cancelButton.onclick();
  await flush();
  assert.equal(env.overlay.style.display,'flex','failed cancel must not close payment evidence UI');
  assert.equal(env.leaveCalls,0,'failed cancel must not release the transaction flow');
  assert.equal(env.cancelButton.disabled,false,'failed cancel must restore the cancel control');
});


test('R6A RED: provider-linked pending cannot be cancelled or close the payment overlay',async()=>{
  const env=await bootCompat({providerTransactionId:'PROVIDER-1',cancelImpl:async()=>true});
  await env.cancelButton.onclick();
  await flush();
  assert.equal(env.cancelCalls,0,'provider-linked pending must be rejected before cancel authority is invoked');
  assert.equal(env.overlay.style.display,'flex','provider-linked payment evidence must remain visible');
  assert.equal(env.leaveCalls,0);
});

test('R6A RED: commercial QRIS cancel has a bounded timeout instead of waiting forever',async()=>{
  const env=await bootCompat({cancelImpl:()=>new Promise(()=>{})});
  const click=env.cancelButton.onclick();
  await flush();
  const timeout=env.timers.find(t=>t.ms>=1000);
  assert.ok(timeout,'authoritative cancel must install a bounded timeout');
  timeout.fn();
  await click;
  await flush();
  assert.equal(env.overlay.style.display,'flex','timeout must remain fail-closed');
  assert.equal(env.cancelButton.disabled,false,'timeout must restore the cancel control');
  assert.ok(env.toasts.some(x=>/timeout|waktu|dibatalkan/i.test(x)),'timeout must surface a recoverable error');
});
