import test from 'node:test';
import assert from 'node:assert/strict';
import { decorateCriticalOperationalSurfaces } from '../src/ui/critical-operational-refinement.js';

function cls(){const s=new Set();return{add(...xs){xs.forEach(x=>s.add(x))},contains(x){return s.has(x)}}}
function node(){return{dataset:{},classList:cls(),attrs:{},setAttribute(k,v){this.attrs[k]=String(v)},querySelector(sel){return this.children?.[sel]??null}}}

test('REF_05 closing and handover are decorated as deliberate existing SJShift surfaces',()=>{
  const close=node(),closeModal=node(),handover=node(),handoverModal=node(),detail=node(),detailModal=node();
  close.children={'.modal':closeModal};handover.children={'.modal':handoverModal};detail.children={'.modal':detailModal};
  const map={'modal-sjshift-close':close,'modal-sjshift-handover':handover,'modal-sj-shift-detail':detail};
  const document={getElementById:id=>map[id]??null};
  const result=decorateCriticalOperationalSurfaces(document);
  assert.equal(result.closing,true);assert.equal(result.handover,true);assert.equal(result.shiftDetail,true);
  assert.equal(close.dataset.ref01Authority,'existing-SJShift');
  assert.equal(close.classList.contains('sjr05-closing-overlay'),true);
  assert.equal(closeModal.classList.contains('sjr05-closing-sheet'),true);
  assert.equal(handover.dataset.ref01Authority,'existing-SJShift');
  assert.equal(detail.dataset.ref01Authority,'existing-SJShift');
});

test('REF_05 refund UI remains the existing permission-aware refund authority and gets evidence presentation only',()=>{
  const refundPage=node(),search=node(),result=node(),card=node();
  const map={opr12:refundPage,'sjx-refund-search':search,'sjx-refund-result':result,'sjx-refund-card':card};
  const document={getElementById:id=>map[id]??null};
  const out=decorateCriticalOperationalSurfaces(document);
  assert.equal(out.refund,true);
  assert.equal(refundPage.dataset.ref01Authority,'existing-refund-void-authority');
  assert.equal(refundPage.classList.contains('sjr05-refund-page'),true);
  assert.equal(search.attrs['aria-label'],'Cari transaksi untuk Refund / VOID');
  assert.equal(result.classList.contains('sjr05-refund-evidence'),true);
  assert.equal(typeof refundPage.onclick,'undefined','refinement must not replace business click/write authority');
});
