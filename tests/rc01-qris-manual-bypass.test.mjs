import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const ROOT=dirname(dirname(fileURLToPath(import.meta.url)));
const SCRIPT=join(ROOT,'src','compat','rc01-qris-manual-bypass.js');
const BUILD=join(ROOT,'scripts','build-ref01.mjs');
const BASELINE=join(ROOT,'baseline','legacy-v1.0.40.html');

function loadManualRuntime(){
  assert.ok(existsSync(SCRIPT),'QRIS manual bypass compatibility script must exist');
  const code=readFileSync(SCRIPT,'utf8');
  const calls=[];
  const checkbox={checked:false,onchange:null};
  const pay={disabled:true,onclick:null,textContent:''};
  const back={onclick:null};
  const back2={onclick:null};
  const modal={
    innerHTML:'',
    querySelector(selector){
      if(selector==='[data-qris-manual-confirm]')return checkbox;
      if(selector==='[data-qris-manual-pay]')return pay;
      if(selector==='[data-back]')return back;
      if(selector==='[data-back2]')return back2;
      return null;
    }
  };
  const overlay={style:{display:'none'}};
  const head={appendChild(){}};
  const document={
    head,
    createElement(){return{id:'',textContent:''}},
    getElementById(){return null}
  };
  const context={
    console,
    document,
    window:null,
    globalThis:null,
    cart:[{id:'A',n:'Es Teh',p:12000,q:1}],
    payMethod:'Tunai',
    TOKO_QRIS:'data:image/png;base64,STATIC-QR',
    clsModal:id=>calls.push(['close',id]),
    processTransaction(){calls.push(['processTransaction',context.payMethod,context.SJCommercialFinalV5961.cartMethod]);return 'TX_OK'},
    SJShift:{guardTransaction:()=>true},
    SJQrisSignalBeta:{ensureWaitingPending(){calls.push(['ensureWaitingPending']);throw new Error('must not be called')}},
    SJCommercialFinalV5961:{
      cartMethod:'Tunai',
      openPayment(method){calls.push(['baseOpenPayment',method]);return `BASE:${method}`}
    },
    SJFinalRefinementVC01B:{
      setupOverlay(){return{ov:overlay,modal}},
      head(title,sub){return `<header><h1>${title}</h1><p>${sub}</p></header>`},
      totalHero(){return '<section>Total Tagihan Rp 12.000</section>'},
      money(v){return `Rp ${Number(v).toLocaleString('id-ID')}`},
      esc(v){return String(v)},
      total(){return 12000},
      backCheckout(){calls.push(['backCheckout'])}
    },
    setTimeout(fn){fn();return 1},
    clearTimeout(){},
    setInterval(){return 1},
    clearInterval(){}
  };
  context.window=context;context.globalThis=context;
  vm.createContext(context);
  vm.runInContext(code,context,{filename:SCRIPT});
  return{context,calls,checkbox,pay,back,back2,modal,overlay,code};
}

test('QRIS manual bypass intercepts QRIS without opening automatic Signal Beta pending flow',()=>{
  const h=loadManualRuntime();
  const result=h.context.SJCommercialFinalV5961.openPayment('QRIS');
  assert.equal(result,true);
  assert.equal(h.context.payMethod,'QRIS');
  assert.equal(h.context.SJCommercialFinalV5961.cartMethod,'QRIS');
  assert.equal(h.overlay.style.display,'flex');
  assert.match(h.modal.innerHTML,/Pembayaran QRIS/i);
  assert.match(h.modal.innerHTML,/verifikasi manual/i);
  assert.match(h.modal.innerHTML,/STATIC-QR/);
  assert.equal(h.calls.some(([name])=>name==='baseOpenPayment'),false,'QRIS manual mode must not delegate to the automatic QRIS renderer');
  assert.equal(h.calls.some(([name])=>name==='ensureWaitingPending'),false,'QRIS manual mode must not create or ensure a pending row');
});

test('QRIS manual confirmation is disabled until checkbox is checked and confirms as QRIS',()=>{
  const h=loadManualRuntime();
  h.context.SJCommercialFinalV5961.openPayment('QRIS');
  assert.equal(h.pay.disabled,true);
  assert.equal(typeof h.checkbox.onchange,'function');
  h.checkbox.checked=true;h.checkbox.onchange();
  assert.equal(h.pay.disabled,false);
  assert.equal(typeof h.pay.onclick,'function');
  const out=h.pay.onclick();
  assert.equal(out,'TX_OK');
  assert.deepEqual(h.calls.filter(([name])=>name==='processTransaction'),[['processTransaction','QRIS','QRIS']]);
  assert.equal(h.calls.some(([name])=>name==='ensureWaitingPending'),false);
});

test('Transfer, Tunai, and Kasbon continue through the pre-existing payment authority unchanged',()=>{
  const h=loadManualRuntime();
  for(const method of ['Transfer','Tunai','Kasbon'])assert.equal(h.context.SJCommercialFinalV5961.openPayment(method),`BASE:${method}`);
  assert.deepEqual(h.calls.filter(([name])=>name==='baseOpenPayment'),[
    ['baseOpenPayment','Transfer'],['baseOpenPayment','Tunai'],['baseOpenPayment','Kasbon']
  ]);
});

test('manual bypass has no QRIS persistence, pending, signal, matching, cancellation, or evidence deletion authority',()=>{
  assert.ok(existsSync(SCRIPT),'QRIS manual bypass compatibility script must exist');
  const source=readFileSync(SCRIPT,'utf8');
  for(const forbidden of ['ensureWaitingPending','confirmMatched','cancelWaiting','qrisRef(','db.ref(','.remove(']){
    assert.equal(source.includes(forbidden),false,`manual bypass must not reference ${forbidden}`);
  }
});

test('build loads QRIS manual bypass after deferred-settlement compatibility and before modular command capture',()=>{
  const source=readFileSync(BUILD,'utf8');
  assert.match(source,/QRIS_MANUAL_ENTRY/);
  assert.match(source,/\$\{S10A_CLASSIC_ENTRY\}\\n\$\{QRIS_MANUAL_ENTRY\}\\n\$\{ENTRY\}/);
});


test('canonical transaction writer keeps QRIS accounting separate from Transfer and cash',()=>{
  const source=readFileSync(BASELINE,'utf8');
  assert.match(source,/else if\(payMethod==='QRIS'\)upd\[base\+'\/qris'\]=sjServerInc\(total\)/);
  assert.match(source,/else if\(payMethod==='Transfer'\)upd\[base\+'\/tf'\]=sjServerInc\(total\)/);
  assert.match(source,/if\(payMethod==='Tunai'\)upd\[base\+'\/tunai'\]=sjServerInc\(total\)/);
  assert.match(source,/method:payMethod==='Kasbon'\?'KASBON: '\+debtor:payMethod/);
});
