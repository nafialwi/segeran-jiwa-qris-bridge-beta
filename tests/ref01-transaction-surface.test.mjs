import test from 'node:test';
import assert from 'node:assert/strict';
import { reconcileTransactionSurfaces } from '../src/ui/transaction-detail-refinement.js';

function classList(){
  const set=new Set();
  return {add(...xs){xs.forEach(x=>set.add(x))},remove(...xs){xs.forEach(x=>set.delete(x))},contains(x){return set.has(x)},values(){return [...set]}};
}
function node({display='',child=null}={}){
  const attrs={};
  return {style:{display},dataset:{},classList:classList(),setAttribute(k,v){attrs[k]=String(v)},removeAttribute(k){delete attrs[k]},getAttribute(k){return attrs[k]},querySelector(){return child},attrs};
}

test('REF_05 visible fullscreen receipt becomes one focused surface and suppresses bottom navigation overlap',()=>{
  const modal=node(),receipt=node({display:'flex',child:modal}),nav=node(),body=node();
  const content=node(),footer=node();
  receipt.querySelector=sel=>sel==='.modal'?modal:sel==='#struk-content'?content:sel==='.fs-footer'?footer:null;
  const document={body,getElementById(id){return id==='modal-struk-fs'?receipt:id==='bottom-nav'?nav:id==='modal-tx'?null:null}};
  const result=reconcileTransactionSurfaces(document);
  assert.equal(result.receiptOpen,true);
  assert.equal(body.classList.contains('sjr05-receipt-open'),true);
  assert.equal(receipt.classList.contains('sjr05-receipt-overlay'),true);
  assert.equal(modal.classList.contains('sjr05-receipt-sheet'),true);
  assert.equal(content.classList.contains('sjr05-receipt-content'),true);
  assert.equal(footer.classList.contains('sjr05-receipt-actions'),true);
  assert.equal(nav.getAttribute('aria-hidden'),'true');
  assert.equal(nav.getAttribute('inert'),'');
});

test('REF_05 closing the receipt restores navigation instead of leaving stale focused state',()=>{
  const modal=node(),receipt=node({display:'none',child:modal}),nav=node(),body=node();
  body.classList.add('sjr05-receipt-open');
  nav.setAttribute('aria-hidden','true');nav.setAttribute('inert','');
  const document={body,getElementById(id){return id==='modal-struk-fs'?receipt:id==='bottom-nav'?nav:null}};
  const result=reconcileTransactionSurfaces(document);
  assert.equal(result.receiptOpen,false);
  assert.equal(body.classList.contains('sjr05-receipt-open'),false);
  assert.equal(nav.getAttribute('aria-hidden'),undefined);
  assert.equal(nav.getAttribute('inert'),undefined);
});

test('REF_05 transaction detail modal is tagged for consistent mobile detail presentation without replacing authority',()=>{
  const txModal=node(),tx=node({display:'flex',child:txModal}),body=node();
  tx.querySelector=sel=>sel==='.modal'?txModal:null;
  const document={body,getElementById(id){return id==='modal-tx'?tx:null}};
  const result=reconcileTransactionSurfaces(document);
  assert.equal(result.transactionDetail,true);
  assert.equal(tx.classList.contains('sjr05-transaction-overlay'),true);
  assert.equal(txModal.classList.contains('sjr05-transaction-sheet'),true);
  assert.equal(tx.dataset.ref01Authority,'existing-receipt-and-transaction-authority');
});
