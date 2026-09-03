import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { ownerHybridMarkup, normalizeOwnerHybridModel } from '../src/ui/owner-dashboard-hybrid.js';

const ROOT=path.resolve(new URL('..',import.meta.url).pathname);

function compatHarness(){
  const source=fs.readFileSync(path.join(ROOT,'src/compat/ref01-production-sales-compat.js'),'utf8');
  const modal={style:{display:'flex'}};
  const view1={classList:{contains(){return true}}};
  const context={
    console,
    cart:[{id:'p1',baseProductId:'p1',inventoryMode:'',q:1,n:'ES TEH 2K',p:2000}],
    cloudData:{global:{menu:[{id:'p1',n:'ES TEH 2K',p:2000,stok:20}],inventory:{p1:20}}},
    document:{
      getElementById(id){if(id==='modal-cart')return modal;if(id==='view1')return view1;return null},
      querySelectorAll(){return []}
    },
    SJHarden:{isActiveProduct(){return true},orderValue(){return 10},notificationVisible(){return true},notificationRead(){return false}},
    SJX:{imageFor(){return ''}},
    SJRefinementSalesV100:{renders:0,renderSales(){this.renders++}},
    SJFinalRefinementVC01A2:{openCart(){if(!context.cart.length)return;modal.dataset={rerendered:'1'}}},
    updateCartUI(){},playBeep(){},showToast(){},
    sjTrackStock(){return true},sjStockQty(){return 20},
    activeDateOnly:'2026-09-02',navigator:{vibrate(){}},setTimeout(fn){fn()},
  };
  context.window=context;
  vm.createContext(context);
  vm.runInContext(source,context,{filename:'ref01-production-sales-compat.js'});
  return {context,modal};
}

test('P2 RC2 last-item minus closes stale cart surface and same product can be added again',()=>{
  const {context,modal}=compatHarness();
  const api=context.SJRef01ProductionSalesCompat;
  assert.equal(api.productQty('p1'),1);
  assert.equal(api.adjustNormalProduct('p1',-1),true);
  assert.equal(api.productQty('p1'),0);
  assert.equal(modal.style.display,'none','last-item removal must close the stale cart overlay');
  assert.equal(api.addNormalProduct('p1'),true);
  assert.equal(api.productQty('p1'),1,'same product must be addable immediately after qty 1 -> 0');
});

test('P2 RC2 removing A while B remains does not poison A and keeps cart presentation live',()=>{
  const {context,modal}=compatHarness();
  context.cart.push({id:'p2',baseProductId:'p2',inventoryMode:'',q:1,n:'CILOK',p:4000});
  context.cloudData.global.menu.push({id:'p2',n:'CILOK',p:4000,stok:20});
  assert.equal(context.SJRef01ProductionSalesCompat.adjustNormalProduct('p1',-1),true);
  assert.equal(modal.style.display,'flex');
  assert.equal(context.SJRef01ProductionSalesCompat.addNormalProduct('p1'),true);
  assert.equal(context.SJRef01ProductionSalesCompat.productQty('p1'),1);
  assert.equal(context.SJRef01ProductionSalesCompat.productQty('p2'),1);
});

test('P2 RC2 hybrid Owner dashboard keeps clean v3 visual language but restores operational density',()=>{
  const model=normalizeOwnerHybridModel({
    name:'Owner Utama',online:true,date:'2026-09-02',shiftLabel:'Shift Pagi',sales:94000,cash:134000,txCount:9,qty:23,expense:40000,
    debt:0,debtCustomers:0,pending:0,low:5,out:0,
    selectedShift:{label:'Shift Pagi',sales:49000,txCount:4,qty:12,expense:20000,status:'AKTIF'}
  });
  const html=ownerHybridMarkup(model);
  assert.match(html,/sj-v31-owner-hybrid/);
  assert.match(html,/02 Sep 2026/);
  assert.match(html,/Shift Pagi/);
  for(const label of ['Penjualan','Kas Tersedia','Transaksi','Item Terjual'])assert.match(html,new RegExp(label));
  for(const action of ['Penjualan','Stok','Pengeluaran','Shift','Laporan'])assert.match(html,new RegExp(`>${action}<`));
  assert.match(html,/Perlu Perhatian/);
  assert.match(html,/Ringkasan Shift/);
  assert.match(html,/Rp 40\.000/);
  assert.doesNotMatch(html,/Hutang Pelanggan<\/label>[\s\S]*Restock Aktif<\/label>/,'debt/restock must not consume the four primary KPI slots');
  for(const action of ['sales-report','cash-shift','transactions','sold-items']) assert.match(html,new RegExp(`data-sj-owner-kpi=\"${action}\"`),`${action} KPI must be an interactive deep-link`);
  assert.match(html,/__SJ_V31_OWNER_DASHBOARD_HYBRID\.navigate\('sales-report'\)/);
  assert.match(html,/__SJ_V31_OWNER_DASHBOARD_HYBRID\.navigate\('transactions'\)/);
  assert.match(html,/__SJ_V31_OWNER_DASHBOARD_HYBRID\.navigate\('sold-items'\)/);
});

test('P2 RC2 hybrid installer takes over an already-active Owner dashboard deterministically',async()=>{
  let renders=0;
  const view5={classList:{contains(name){return name==='active'}}};
  const runtime={
    document:{getElementById(id){return id==='view5'?view5:null}},
    setTimeout(fn){fn()},
    SJX:{async dayModel(){return {sales:10000,txCount:2,qty:3,expense:4000,shiftRows:[]}}},
    SJRefinementRoleDashboardV100:{
      async ownerModel(){const d=await runtime.SJX.dayModel();return {name:'Owner Utama',online:true,sales:d.sales,txCount:d.txCount,cash:15000,debt:0,debtCustomers:0,pending:0,low:0,out:0}},
      ownerHTML(){return '<main>legacy</main>'},
      render(){renders++;return true}
    }
  };
  const {installOwnerDashboardHybrid}=await import('../src/ui/owner-dashboard-hybrid.js');
  const api=installOwnerDashboardHybrid(runtime);
  assert.equal(api.installed,true);
  assert.equal(renders,1,'active dashboard must be re-rendered immediately after hybrid authority installs');
  const model=await runtime.SJRefinementRoleDashboardV100.ownerModel();
  assert.equal(model.qty,3);
  assert.equal(model.expense,4000);
  assert.match(runtime.SJRefinementRoleDashboardV100.ownerHTML(model),/sj-v31-owner-hybrid/);
});


test('P2 LOCK gate Owner KPI deep-links route to report/history/sold-items without changing scope selectors',async()=>{
  const routes=[];let historyOpened=0,soldScrolled=0;
  const sold={scrollIntoView(){soldScrolled++},closest(){return sold}};
  const view5={classList:{contains(){return false}}};
  const runtime={
    document:{
      getElementById(id){
        if(id==='view5')return view5;
        if(id==='date-sel')return {value:'2026-09-02'};
        if(id==='shift-sel')return {value:'S1',selectedOptions:[{textContent:'Shift Pagi'}]};
        return null;
      },
      querySelector(sel){return /sjv29-sold|sjv30-sold-list/.test(sel)?sold:null}
    },
    setTimeout(fn){fn()},showView(n){routes.push(n)},
    __SJ_V26_SALES_HISTORY:{openHistory(){historyOpened++}},
    SJX:{async dayModel(){return {shiftRows:[]}}},
    SJRefinementRoleDashboardV100:{async ownerModel(){return {name:'Owner',online:true}},ownerHTML(){return ''},render(){}}
  };
  const {installOwnerDashboardHybrid}=await import('../src/ui/owner-dashboard-hybrid.js');
  const api=installOwnerDashboardHybrid(runtime);
  assert.equal(await api.navigate('sales-report'),true);
  assert.equal(await api.navigate('transactions'),true);
  assert.equal(await api.navigate('sold-items'),true);
  assert.deepEqual(routes,[3,3,3]);
  assert.equal(historyOpened,1);
  assert.equal(soldScrolled,1);
  assert.equal(runtime.document.getElementById('date-sel').value,'2026-09-02');
  assert.equal(runtime.document.getElementById('shift-sel').value,'S1');
});

test('P4 RC4 Owner dashboard adds restrained monthly finance summary and Keuangan/Tutup Bulan shortcuts without replacing four core KPIs',()=>{
  const model=normalizeOwnerHybridModel({
    name:'Owner Utama',online:true,date:'2026-09-03',shiftLabel:'Shift Pagi',sales:404000,cash:365000,txCount:70,qty:229,expense:60000,
    debt:0,debtCustomers:0,pending:0,low:5,out:0,
    finance:{period:'2026-09',cashAvailable:365000,opening:500000,additional:100000,prive:50000,netSales:857000,businessExpenses:105000,netProfit:null,hppKnown:false,calculatedEnding:null}
  });
  const html=ownerHybridMarkup(model);
  for(const action of ['sales-report','cash-shift','transactions','sold-items'])assert.match(html,new RegExp(`data-sj-owner-kpi="${action}"`));
  assert.match(html,/Ringkasan Keuangan Bulan Ini/);
  assert.match(html,/September 2026/);
  for(const label of ['Modal Awal','Penjualan Bersih','Pengeluaran Usaha','Prive Owner','Laba Bersih','Modal Akhir'])assert.match(html,new RegExp(label));
  assert.match(html,/Laba Bersih[\s\S]*Belum tersedia/);
  assert.match(html,/Modal Akhir[\s\S]*Belum tersedia/);
  assert.match(html,/navigate\('finance'\)/);assert.match(html,/navigate\('finance-close'\)/);
  assert.match(html,/>Keuangan</);assert.match(html,/>Tutup Bulan</);
});

test('P4 RC4 Owner dashboard installer enriches model from P4 finance read model and fails soft when HPP is unknown',async()=>{
  const view5={classList:{contains(){return false}}};
  const runtime={
    document:{getElementById(id){if(id==='view5')return view5;if(id==='date-sel')return {value:'2026-09-03'};if(id==='shift-sel')return {value:'S1',selectedOptions:[{textContent:'Shift Pagi'}]};return null}},
    setTimeout(fn){fn()},
    SJX:{async dayModel(){return {qty:4,expense:10000,shiftRows:[]}}},
    __SJ_P4_FINANCE_RUNTIME:{finance:{async loadMonth(period){assert.equal(period,'2026-09');return {period,model:{profit:{netSales:857000,businessExpenses:105000,netProfit:null,cogsKnown:false},ownerCapital:{opening:500000,additional:100000,prive:50000,calculatedEnding:null},cashPosition:{available:365000}}}}}},
    SJRefinementRoleDashboardV100:{async ownerModel(){return {name:'Owner',online:true,sales:10000,txCount:2,cash:15000,debt:0,debtCustomers:0,pending:0,low:0,out:0}},ownerHTML(){return ''},render(){}}
  };
  const {installOwnerDashboardHybrid}=await import('../src/ui/owner-dashboard-hybrid.js');
  installOwnerDashboardHybrid(runtime);
  const model=await runtime.SJRefinementRoleDashboardV100.ownerModel();
  assert.equal(model.finance.period,'2026-09');assert.equal(model.finance.netSales,857000);assert.equal(model.finance.hppKnown,false);assert.equal(model.finance.netProfit,null);
});

test('P4 RC4 Owner finance shortcuts route through canonical Report Finance surface and select summary/close tabs',async()=>{
  const routes=[],surfaces=[],tabs=[];
  const runtime={
    document:{getElementById(id){if(id==='date-sel')return {value:'2026-09-03'};if(id==='shift-sel')return {value:'S1',selectedOptions:[{textContent:'Shift Pagi'}]};return null},querySelector(){return null}},
    setTimeout(fn){fn()},showView(n){routes.push(n)},
    __SJ_REF01_RUNTIME:{financeWorkspace:{setSurface(v){surfaces.push(v);return true},setTab(v){tabs.push(v);return true}}}
  };
  const {createOwnerDashboardNavigator}=await import('../src/ui/owner-dashboard-hybrid.js');
  const navigate=createOwnerDashboardNavigator(runtime);
  assert.equal(await navigate('finance'),true);assert.equal(await navigate('finance-close'),true);
  assert.deepEqual(routes,[3,3]);assert.deepEqual(surfaces,['finance','finance']);assert.deepEqual(tabs,['summary','close']);
});
