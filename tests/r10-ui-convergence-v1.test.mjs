import test from 'node:test';
import assert from 'node:assert/strict';
import {
  convergePaymentDomV1,
  resetCompletedSaleVisualStateV1,
  installUiConvergenceV1
} from '../src/ui/ui-convergence-v1.js';

function classList(){
  const set=new Set();
  return {toggle(k,on){on?set.add(k):set.delete(k)},add(k){set.add(k)},remove(k){set.delete(k)},contains:k=>set.has(k)};
}
function paymentDoc(){
  const buttons=[
    {id:'btn-tunai',dataset:{},classList:classList()},
    {id:'btn-qris',dataset:{},classList:classList()},
    {id:'btn-tf',dataset:{},classList:classList()},
    {id:'btn-kasbon',dataset:{},classList:classList()}
  ];
  const cash={style:{}},debt={style:{}},debtor={value:'BUDI'},customer={value:'BUDI'};
  return {
    buttons,cash,debt,debtor,customer,
    querySelectorAll(sel){return (sel.includes('#modal-bayar')||sel.includes('#modal-cart'))?buttons:[]},
    getElementById(id){return id==='area-tunai'?cash:id==='area-kasbon'?debt:id==='m-kasbon-nama'?debtor:id==='sj61-customer'?customer:null},
    querySelector(){return null}
  };
}

test('payment convergence switches visual method immediately without a click',()=>{
  const d=paymentDoc();
  convergePaymentDomV1(d,'QRIS');
  assert.equal(d.buttons.find(x=>x.id==='btn-qris').classList.contains('active'),true);
  assert.equal(d.buttons.find(x=>x.id==='btn-tunai').classList.contains('active'),false);
  assert.equal(d.cash.style.display,'none');
  assert.equal(d.debt.style.display,'none');
  convergePaymentDomV1(d,'Kasbon');
  assert.equal(d.buttons.find(x=>x.id==='btn-kasbon').classList.contains('active'),true);
  assert.equal(d.debt.style.display,'block');
});

test('completed sale reset clears prior Kasbon customer/method and repaints sales immediately',()=>{
  const d=paymentDoc();let renders=0,updates=0,selected='';
  const runtime={
    document:d,
    SJCommercialFinalV5961:{cartMethod:'Kasbon',saleCustomer:'BUDI',selectCartMethod(m){this.cartMethod=m}},
    selMet:m=>{selected=m},
    updateCartUI:()=>{updates++},
    SJRefinementSalesV100:{renderSales:()=>{renders++}},
    requestAnimationFrame:fn=>fn()
  };
  resetCompletedSaleVisualStateV1(runtime);
  assert.equal(runtime.SJCommercialFinalV5961.cartMethod,'Tunai');
  assert.equal(runtime.SJCommercialFinalV5961.saleCustomer,'');
  assert.equal(d.debtor.value,'');
  assert.equal(d.customer.value,'');
  assert.equal(selected,'Tunai');
  assert.equal(renders,1);
  assert.equal(updates,1);
});

test('transaction wrapper resets only when cart converges from non-empty to empty',async()=>{
  let cart=[{id:'P1'}],resetRenders=0;
  const d=paymentDoc();
  const runtime={
    document:d,
    __SJ_LEGACY_STOCK_COMPONENT_CONTEXT:{snapshotSale:()=>({cart:[...cart]})},
    processTransaction:async()=>{cart=[]},
    SJCommercialFinalV5961:{cartMethod:'Kasbon',saleCustomer:'BUDI',openPayment:()=>{}},
    SJRefinementSalesV100:{renderSales:()=>{resetRenders++}},
    updateCartUI:()=>{},
    requestAnimationFrame:fn=>fn()
  };
  installUiConvergenceV1(runtime);
  await runtime.processTransaction();
  assert.equal(runtime.SJCommercialFinalV5961.cartMethod,'Tunai');
  assert.equal(runtime.SJCommercialFinalV5961.saleCustomer,'');
  assert.equal(resetRenders,1);
});

test('failed transaction keeps payment choice/customer because cart still exists',async()=>{
  let cart=[{id:'P1'}];
  const runtime={
    document:paymentDoc(),
    __SJ_LEGACY_STOCK_COMPONENT_CONTEXT:{snapshotSale:()=>({cart:[...cart]})},
    processTransaction:async()=>false,
    SJCommercialFinalV5961:{cartMethod:'Kasbon',saleCustomer:'BUDI',openPayment:()=>{}},
    requestAnimationFrame:fn=>fn()
  };
  installUiConvergenceV1(runtime);
  await runtime.processTransaction();
  assert.equal(runtime.SJCommercialFinalV5961.cartMethod,'Kasbon');
  assert.equal(runtime.SJCommercialFinalV5961.saleCustomer,'BUDI');
});

test('checkout method visual also converges to Tunai after prior Kasbon sale',()=>{
  const d=paymentDoc();
  convergePaymentDomV1(d,'Tunai');
  assert.equal(d.buttons.find(x=>x.id==='btn-tunai').classList.contains('active'),true);
  assert.equal(d.buttons.find(x=>x.id==='btn-kasbon').classList.contains('active'),false);
});

test('install wraps final shift render and stop restores wrapped authorities',()=>{
  const d=paymentDoc();let renders=0;
  const shift={currentSessionId:()=> 'SES2',renderWithDay(){renders++},selectShift:async()=>true,openCloseModal:()=>true};
  const baseRender=shift.renderWithDay,baseTx=async()=>false,commercial={openPayment:()=>true,cartMethod:'Tunai',saleCustomer:''};
  const runtime={document:d,SJShift:shift,processTransaction:baseTx,SJCommercialFinalV5961:commercial,__SJ_LEGACY_STOCK_COMPONENT_CONTEXT:{snapshotSale:()=>({cart:[]})},requestAnimationFrame:fn=>fn()};
  const api=installUiConvergenceV1(runtime);
  shift.renderWithDay();
  assert.equal(renders,1);
  assert.notEqual(shift.renderWithDay,baseRender);
  assert.notEqual(runtime.processTransaction,baseTx);
  api.stop();
  assert.equal(shift.renderWithDay,baseRender);
  assert.equal(runtime.processTransaction,baseTx);
});
