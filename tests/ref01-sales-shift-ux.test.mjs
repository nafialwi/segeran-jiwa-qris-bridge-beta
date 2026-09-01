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
  shiftContextLabel
} from '../src/ui/shift-refinement.js';
import {
  installMiniCartPresentation,
  createSafeResolveAndAdd
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
