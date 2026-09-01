import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  normalizeProductCode,
  productCodeAliases,
  resolveProductCode,
  resolveScannedCandidates
} from '../src/domain/product-code-resolver.js';
import {
  historicalShiftRows,
  shiftContextLabel,
  createStaleShiftAdapter
} from '../src/ui/shift-refinement.js';
import {
  installMiniCartPresentation,
  createSafeResolveAndAdd,
  installSmartBarcodeResolver,
  decorateSalesProductCard,
  shiftRowsForDate
} from '../src/ui/sales-shift-ux-refinement.js';

const jasjus={id:'j1',n:'JASJUS 1.000',barcode:'EAN:8993200664542',sku:'JASJUS-001'};

test('canonical product-code resolver accepts a unique exact legacy alias but rejects substring-only codes',()=>{
  assert.equal(normalizeProductCode(' 8993200664542\n'),'8993200664542');
  assert.ok(productCodeAliases(jasjus).includes('8993200664542'));
  assert.equal(resolveProductCode('8993200664542',[jasjus]).product.id,'j1');
  assert.equal(resolveProductCode('899320066454',[jasjus]).status,'miss');
});

test('canonical resolver refuses ambiguous aliases instead of auto-adding the wrong product',()=>{
  const two={id:'j2',n:'OTHER',barcode:'REF:8993200664542'};
  const r=resolveProductCode('8993200664542',[jasjus,two]);
  assert.equal(r.status,'ambiguous');
  assert.equal(r.matches.length,2);
});

test('camera candidate resolver checks every detected code and picks the unique database match',()=>{
  const r=resolveScannedCandidates(['(90)MD256211006232(91)261121','8993200664542'],[jasjus]);
  assert.equal(r.status,'match');
  assert.equal(r.product.id,'j1');
  assert.equal(r.code,'8993200664542');
});

test('safe resolve-and-add uses canonical resolver then delegates only to existing quickAddCart',()=>{
  const added=[];const notices=[];
  const resolveAndAdd=createSafeResolveAndAdd({
    getProducts:()=>[jasjus],
    addProduct:id=>added.push(id),
    notify:(m,k)=>notices.push([m,k])
  });
  assert.equal(resolveAndAdd('8993200664542','camera').status,'match');
  assert.deepEqual(added,['j1']);
  assert.equal(resolveAndAdd('899320066454','camera').status,'miss');
  assert.deepEqual(added,['j1']);
});

test('historical shift rows classify stale active records and never synthesize missing shifts',()=>{
  const rows=historicalShiftRows({
    '2026-08-30-S2':{shiftStatus:'ACTIVE',openedAt:'2026-08-30T08:00:00+07:00'},
    '2026-08-31-S1':{shiftStatus:'CLOSED',openedAt:'2026-08-31T08:00:00+07:00',closedAt:'2026-08-31T16:00:00+07:00'},
    global:{menu:[]},
    'not-a-shift':{}
  },{now:new Date('2026-09-01T07:00:00+07:00')});
  assert.deepEqual(rows.map(x=>x.key),['2026-08-31-S1','2026-08-30-S2']);
  assert.equal(rows[1].overdue,true);
  assert.equal(rows[1].canOwnerClose,true);
  assert.equal(rows.some(x=>x.key==='2026-09-01-S1'),false);
  assert.equal(shiftContextLabel('2026-09-01','Shift Pagi'),'01 Sep 2026 · Shift Pagi');
});

test('mini cart presentation wraps existing final cart authority and checkout removes sheet mode',()=>{
  const classes=new Set();
  const overlay={classList:{add:x=>classes.add(x),remove:x=>classes.delete(x)},querySelector:()=>null};
  const final={cartCalls:0,checkoutCalls:0,openCart(){this.cartCalls++;return 'cart'},openCheckout(){this.checkoutCalls++;return 'checkout'}};
  const runtime={SJFinalRefinementVC01A2:final,document:{getElementById:id=>id==='modal-cart'?overlay:null},requestAnimationFrame:fn=>fn()};
  const api=installMiniCartPresentation(runtime);
  assert.equal(api.installed,true);
  assert.equal(final.openCart(),'cart');
  assert.equal(final.cartCalls,1);
  assert.equal(classes.has('sj-ref-mini-cart'),true);
  assert.equal(final.openCheckout(),'checkout');
  assert.equal(final.checkoutCalls,1);
  assert.equal(classes.has('sj-ref-mini-cart'),false);
});

test('REF-01 bootstrap installs the combined sales and shift UX adapter',()=>{
  const src=fs.readFileSync(new URL('../src/app/ref01-bootstrap.js',import.meta.url),'utf8');
  assert.match(src,/installSalesShiftUxRefinement/);
  assert.match(src,/salesShiftUx/);
});

test('smart scanner resolves against the existing sales catalog authority when cloudData is lexical and absent on window',()=>{
  const product={id:'p8993',n:'JASJUS 1.000',barcode:'8993163502066'};
  const added=[];
  const runtime={
    SJBarcodeV1:{openCameraScanner(){return true}},
    SJRefinementSalesV100:{activeProducts:()=>[product]},
    quickAddCart:id=>added.push(id),
    showToast(){},sjAudit(){}
  };
  const api=installSmartBarcodeResolver(runtime);
  assert.equal(api.installed,true);
  const result=runtime.SJBarcodeV1.resolveAndAdd('8993163502066','camera');
  assert.equal(result.status,'match');
  assert.deepEqual(added,['p8993']);
});

test('stale shift adapter supports read-only daily recap selection without synthesizing a shift',()=>{
  const date={value:'2026-09-01'},shift={value:'-S1'};let changed=0;
  const runtime={document:{getElementById:id=>id==='date-sel'?date:id==='shift-sel'?shift:null},changeDateAndShift:()=>changed++};
  const adapter=createStaleShiftAdapter(runtime);
  const out=adapter.selectRecap('2026-08-25');
  assert.equal(out.date,'2026-08-25');
  assert.equal(out.selector,'');
  assert.equal(date.value,'2026-08-25');
  assert.equal(shift.value,'');
  assert.equal(changed,1);
});

test('sales quantity decorator adds the legacy-compatible minus and quantity nodes beside the existing plus control',()=>{
  const made=[];
  const parent={insertBefore(node,before){made.push([node,before])}};
  const plus={dataset:{add:'p1'},parentNode:parent};
  const card={dataset:{pid:'p1'},querySelector(sel){if(sel==='[data-add]')return plus;if(sel==='[data-sj-card-qty]')return null;return null}};
  const runtime={document:{createElement(tag){return {tag,className:'',dataset:{},style:{},setAttribute(){},addEventListener(){},append(){},appendChild(){}}}}};
  const result=decorateSalesProductCard(card,runtime);
  assert.equal(result,true);
  assert.equal(made.length,1);
  assert.equal(made[0][0].dataset.sjCardQty,'1');
});

test('date shift rows only expose real records for the requested calendar date',()=>{
  const rows=shiftRowsForDate({
    '2026-08-25-S1':{shiftStatus:'CLOSED'},
    '2026-08-25-S2':{shiftStatus:'ACTIVE',currentSessionId:'x'},
    '2026-08-26-S1':{shiftStatus:'CLOSED'},
    global:{menu:[]}
  },'2026-08-25',{now:new Date('2026-09-01T07:00:00+07:00')});
  assert.deepEqual(rows.map(x=>x.key),['2026-08-25-S2','2026-08-25-S1']);
  assert.equal(rows.some(x=>x.key==='2026-08-25-S3'),false);
});

import {
  recoverLegacyActiveSessionForClose,
  installLegacyShiftCloseRecovery
} from '../src/ui/legacy-shift-close-recovery.js';

test('legacy active shift missing sessions entry is recoverable in memory for Owner close without creating a new session id',()=>{
  const d={
    kasAwal:0,
    shiftStatus:'ACTIVE',
    currentSessionId:'SES-20260829S1-MTDRWTVG',
    currentCashierId:'owner-1',
    currentCashierName:'OWNER UTAMA',
    sessionControl:{status:'ACTIVE',currentSessionId:'SES-20260829S1-MTDRWTVG',currentCashierId:'owner-1',currentCashierName:'OWNER UTAMA'}
  };
  const shift={
    currentData:()=>d,
    state:()=> 'ACTIVE',
    isOwner:()=>true,
    currentSessionId:()=>d.currentSessionId,
    currentCashierId:()=>d.currentCashierId,
    currentCashierName:()=>d.currentCashierName,
    snapshot:()=>({omset:0,tunai:0,qris:0,tf:0,kasbon:0,debtPay:0,debtPayCash:0,advancePay:0,advancePayCash:0,advanceNew:0,advanceNewCash:0,setoran:0,expense:0,expenseCash:0,cashMove:0,cashMoveIn:0,cashMoveOut:0,qty:0,txCount:0})
  };
  const runtime={SJShift:shift,document:{getElementById:id=>id==='date-sel'?{value:'2026-08-29'}:id==='shift-sel'?{value:'-S1'}:null}};
  const r=recoverLegacyActiveSessionForClose(runtime);
  assert.equal(r.status,'recovered');
  assert.equal(r.sessionId,'SES-20260829S1-MTDRWTVG');
  assert.equal(d.sessions[r.sessionId].recoveredLegacy,true);
  assert.equal(d.sessions[r.sessionId].openingCash,0);
});

test('legacy shift recovery augments the existing CLOSE write with recovery metadata while delegating the same writer',async()=>{
  const d={shiftStatus:'ACTIVE',currentSessionId:'legacy-sid',currentCashierId:'owner',currentCashierName:'OWNER',sessionControl:{status:'ACTIVE',currentSessionId:'legacy-sid',currentCashierId:'owner',currentCashierName:'OWNER'}};
  const calls=[];
  const shift={currentData:()=>d,state:()=> 'ACTIVE',isOwner:()=>true,currentSessionId:()=> 'legacy-sid',currentCashierId:()=> 'owner',currentCashierName:()=> 'OWNER',snapshot:()=>({})};
  const hardening={async verifiedShiftWrite(...args){calls.push(args);return true}};
  const runtime={SJShift:shift,SJOperationalHardening:hardening,document:{getElementById:id=>id==='date-sel'?{value:'2026-08-29'}:id==='shift-sel'?{value:'-S1'}:null}};
  shift.openCloseModal=()=>true;shift.submitClose=async()=>true;
  const api=installLegacyShiftCloseRecovery(runtime);
  assert.equal(api.installed,true);
  shift.openCloseModal();
  const updates={};
  await hardening.verifiedShiftWrite('CLOSE','2026-08-29-S1','legacy-sid',updates);
  assert.equal(updates['2026-08-29-S1/sessions/legacy-sid/id'],'legacy-sid');
  assert.equal(updates['2026-08-29-S1/sessions/legacy-sid/recoveredLegacy'],true);
  assert.equal(calls.length,1);
});

test('inline product quantity stepper uses equal touch targets, separators, and centered quantity for precise mobile control',()=>{
  const css=fs.readFileSync(new URL('../src/ui/ref01.css',import.meta.url),'utf8');
  assert.match(css,/\.sj-ref-card-step:has\(\.item-minus-btn\.show\)\{[^}]*grid-template-columns:38px 32px 38px/s);
  assert.match(css,/\.sj-ref-card-step:has\(\.item-minus-btn\.show\)::before/);
  assert.match(css,/\.sj-ref-card-step:has\(\.item-minus-btn\.show\)::after/);
  assert.match(css,/\.sj-ref-card-step \.item-qty-badge\.show\{[^}]*font-variant-numeric:tabular-nums/s);
});
