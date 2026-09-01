import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {
  sortProductsByDisplayOrder,
  quantityControlMarkup,
  installProductionSalesStability,
  installManualSyncControls
} from '../src/ui/production-sales-stability.js';
import { renderRef01ReportSummary } from '../src/ui/report-refinement.js';
import { installSalesHistoryRefinement } from '../src/ui/report-sales-history-refinement.js';

const p=(id,order,name=id)=>({id,n:name,displayOrder:order,archived:false});

test('sales product order follows displayOrder with stable source-order fallback',()=>{
  const rows=[p('c',30),p('a',10),p('b',20),p('legacy',undefined)];
  const harden={orderValue:(row,index)=>Number.isFinite(Number(row.displayOrder))?Number(row.displayOrder):(index+1)*10};
  assert.deepEqual(sortProductsByDisplayOrder(rows,harden).map(x=>x.id),['a','b','c','legacy']);
});

test('selected product control follows concrete UAT shape and unselected product remains one plus button',()=>{
  const zero=quantityControlMarkup({id:'tea',name:'ES TEH',qty:0});
  const selected=quantityControlMarkup({id:'tea',name:'ES TEH',qty:2});
  assert.match(zero,/data-add="tea"/);
  assert.doesNotMatch(zero,/data-sj-v27-step/);
  assert.match(selected,/data-sj-v27-step/);
  assert.match(selected,/data-card-delta="-1"/);
  assert.match(selected,/>2<\/b>/);
  assert.match(selected,/data-card-delta="1"/);
});

test('report summary contains sales history launcher deterministically in initial markup',()=>{
  const html=renderRef01ReportSummary({period:{preset:'today',label:'Hari Ini'},costing:{state:'unknown'},netSales:0,transactionCount:0});
  assert.match(html,/data-sj-sales-history-open="true"/);
  assert.match(html,/Riwayat Penjualan/);
});

test('production stability installer routes sales catalog ordering and normal-cart compatibility through existing authorities',()=>{
  const sales={activeProducts:()=>[p('b',20),p('a',10)]};
  const final={productCard:()=>'<article></article>'};
  const compat={activeProducts:()=>[p('a',10),p('b',20)],productQty:id=>id==='a'?1:0,addNormalProduct(){},hasNormalCartLine:()=>false,adjustNormalProduct(){}};
  const runtime={SJRefinementSalesV100:sales,SJFinalRefinementVC01A:final,SJRef01ProductionSalesCompat:compat,SJCommercialFinalV5961:{adjustCart(){}}};
  const api=installProductionSalesStability(runtime);
  assert.equal(api.installed,true);
  assert.deepEqual(runtime.SJRefinementSalesV100.activeProducts().map(x=>x.id),['a','b']);
});

test('manual sync control is available to both roles and delegates to read-only compatibility refresh',async()=>{
  const calls=[];
  const button={dataset:{},classList:{add(){},remove(){}},setAttribute(){},addEventListener(type,fn){if(type==='click')this.click=fn},textContent:'',disabled:false};
  const host={querySelector:()=>null,appendChild(node){calls.push(['append',node])}};
  const document={querySelectorAll:()=>[host],createElement:()=>button};
  const runtime={document,SJRef01ProductionSalesCompat:{async refreshNow(){calls.push(['refresh']);return{ok:true}}},showToast:(m,k)=>calls.push(['toast',m,k])};
  const api=installManualSyncControls(runtime);
  assert.equal(api.installed,true);
  api.enhance();
  assert.equal(calls.some(x=>x[0]==='append'),true);
  await button.click({preventDefault(){},stopPropagation(){}});
  assert.equal(calls.some(x=>x[0]==='refresh'),true);
});

test('REF01 build loads classic production sales compatibility bridge before module entry',()=>{
  const build=fs.readFileSync(new URL('../scripts/build-ref01.mjs',import.meta.url),'utf8');
  assert.match(build,/ref01-production-sales-compat\.js/);
  assert.match(build,/CLASSIC_ENTRY/);
});

test('classic compatibility bridge bypasses unfinished recipe interception while preserving shift stock cart and update authorities',()=>{
  const src=fs.readFileSync(new URL('../src/compat/ref01-production-sales-compat.js',import.meta.url),'utf8');
  assert.match(src,/guardTransaction/);
  assert.match(src,/isDayLocked/);
  assert.match(src,/sjTrackStock/);
  assert.match(src,/sjStockQty/);
  assert.match(src,/cart\.push/);
  assert.match(src,/updateCartUI/);
  assert.match(src,/refreshNow/);
  assert.doesNotMatch(src,/\.set\(|\.update\(|\.transaction\(/);
});


test('production compatibility bridge adds product normally even when a legacy active recipe exists',()=>{
  const src=fs.readFileSync(new URL('../src/compat/ref01-production-sales-compat.js',import.meta.url),'utf8');
  const context={
    console,
    cart:[],
    cloudData:{global:{menu:[{id:'tea',n:'ES TEH',p:3000,displayOrder:20,archived:false,active:true,recipeId:'legacy-tea-recipe'}]}},
    activeDateOnly:'2026-09-01',
    activeDate:'2026-09-01-S1',
    isRecapMode:false,
    DB_PATH:'toko_segeranjiwa_v58',
    SJHarden:{isActiveProduct:()=>true,orderValue:(row,index)=>Number(row.displayOrder)||((index+1)*10)},
    SJShift:{guardTransaction:()=>true},
    SJInventoryV2:{recipeForProduct:()=>({id:'legacy-tea-recipe',active:true})},
    isDayLocked:()=>false,
    sjTrackStock:()=>false,
    sjStockQty:()=>999,
    showToast(){},
    playBeep(){},
    updateCartUI(){context.cartUiUpdates++},
    cartUiUpdates:0,
    navigator:{vibrate(){}},
    document:{getElementById:()=>null},
    setTimeout(fn){fn();return 1},
    alert(){},
    Object,
    Number,
    String,
    Math,
    Date,
    Promise,
  };
  context.window=context;
  vm.createContext(context);
  vm.runInContext(src,context,{filename:'ref01-production-sales-compat.js'});
  assert.equal(typeof context.quickAddCart,'function');
  assert.equal(context.quickAddCart('tea'),true);
  assert.equal(context.cart.length,1);
  assert.equal(context.cart[0].id,'tea');
  assert.equal(context.cart[0].q,1);
  assert.notEqual(String(context.cart[0].inventoryMode||'').toUpperCase(),'RECIPE');
  assert.equal(context.cartUiUpdates,1);
  assert.equal(context.SJInventoryV2.recipeForProduct().active,true,'test must prove a legacy recipe was present');
});

test('cashier report renderer contains sales-history launcher on its first render',()=>{
  const core={
    renderCashierShift:()=>'<div class="cashier-report"><section>Aktivitas Shift</section></div>'
  };
  const report={state:{model:{transactions:[]}},Core:core};
  const document={addEventListener(){},getElementById(){return null}};
  const runtime={SJReportFoundationV010:report,document,__SJ_SC03_RUNTIME:{guard:{currentRole:()=> 'cashier'}}};
  const api=installSalesHistoryRefinement(runtime);
  assert.equal(api.installed,true);
  const html=report.Core.renderCashierShift({});
  assert.match(html,/data-sj-sales-history-open="true"/);
  assert.match(html,/Riwayat Penjualan/);
});

test('sales card taps use normal-cart compatibility directly even if legacy inventory rewrites global quickAddCart',()=>{
  const calls=[];
  const addButton={dataset:{add:'tea'},onclick:null,closest:()=>null};
  const card={
    dataset:{pid:'tea',out:'0'},onclick:null,
    querySelectorAll(selector){return selector==='[data-add]'?[addButton]:[]}
  };
  const root={
    querySelectorAll(selector){
      if(selector==='[data-sj-v27-step]')return [];
      if(selector==='.sjvc01-product[data-pid]')return [card];
      return [];
    }
  };
  const sales={renderSales(){card.onclick=()=>calls.push(['legacy-card']);addButton.onclick=()=>calls.push(['legacy-add']);return true},activeProducts:()=>[]};
  const compat={activeProducts:()=>[],productQty:()=>0,hasNormalCartLine:()=>false,adjustNormalProduct(){},addNormalProduct:id=>calls.push(['normal',id])};
  const final={productCard:()=>'<article></article>'};
  const runtime={document:{getElementById:id=>id==='kasir-scroll'?root:null},SJRefinementSalesV100:sales,SJRef01ProductionSalesCompat:compat,SJFinalRefinementVC01A:final,setTimeout:fn=>fn()};
  installProductionSalesStability(runtime);
  runtime.SJRefinementSalesV100.renderSales();
  addButton.onclick({preventDefault(){},stopPropagation(){}});
  card.onclick({target:{closest:()=>null},preventDefault(){}});
  assert.deepEqual(calls,[['normal','tea'],['normal','tea']]);
});
