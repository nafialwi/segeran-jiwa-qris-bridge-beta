import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const ROOT=path.resolve(path.dirname(new URL(import.meta.url).pathname),'..');
const read=rel=>fs.readFileSync(path.join(ROOT,rel),'utf8');

async function importFresh(rel){
  const file=path.join(ROOT,rel);
  assert.equal(fs.existsSync(file),true,`${rel} must exist`);
  return import(`${pathToFileURL(file).href}?t=${Date.now()}-${Math.random()}`);
}

test('P3 capability floor remains at least v3.2',()=>{
  const [maj,min]=JSON.parse(read('package.json')).version.split('.').map(Number);
  assert.ok(maj>3||(maj===3&&min>=2));
});

test('P3 reporting chooses adaptive mobile chart buckets by scope',async()=>{
  const mod=await importFresh('src/domain/report-v28-analytics.js');
  assert.equal(typeof mod.chartBucketModeForScope,'function');
  assert.equal(mod.chartBucketModeForScope({scope:'shift'}),'hour');
  assert.equal(mod.chartBucketModeForScope({scope:'day',shift:'ALL'}),'shift');
  assert.equal(mod.chartBucketModeForScope({scope:'day',shift:'S1'}),'hour');
  assert.equal(mod.chartBucketModeForScope({scope:'week'}),'day');
  assert.equal(mod.chartBucketModeForScope({scope:'month',week:'ALL'}),'week');
  assert.equal(mod.chartBucketModeForScope({scope:'month',week:'2'}),'day');
  assert.equal(mod.chartBucketModeForScope({scope:'custom',from:'2026-09-01',to:'2026-09-10'}),'day');
  assert.equal(mod.chartBucketModeForScope({scope:'custom',from:'2026-07-01',to:'2026-09-01'}),'week');
});

test('P3 monthly chart aggregates into weekly buckets unless a week is selected',async()=>{
  const {chartBucketsForScope}=await importFresh('src/domain/report-v28-analytics.js');
  const tx=(date,total=1000)=>({status:'PAID',_shift:`${date}-S1`,ts:new Date(`${date}T10:00:00`).getTime(),total,items:[{id:'A',q:1,p:total}]});
  const rows=[tx('2026-09-01'),tx('2026-09-08'),tx('2026-09-15'),tx('2026-09-22'),tx('2026-09-29')];
  const month=chartBucketsForScope(rows,{scope:'month',week:'ALL'});
  assert.deepEqual(month.map(x=>x.label),['Minggu 1','Minggu 2','Minggu 3','Minggu 4','Minggu 5']);
  const week=chartBucketsForScope(rows.slice(1,2),{scope:'month',week:'2'});
  assert.equal(week[0].label,'08 Sep');
});

test('P3 inventory semantic read model follows Check Physical > Transfer > Buy > Safe',async()=>{
  const mod=await importFresh('src/domain/inventory-v32-analytics.js');
  const core={
    transferSuggestion(balance,master){return {needed:master.kind==='transfer',qty:5}},
    purchaseSuggestion(balance,master){return {needed:master.kind==='buy',qty:10}},
    statusForIngredient(balance,master){return master.kind==='safe'?'SAFE':'WARNING'}
  };
  const raw={ingredients:{
    A:{name:'Susu',unit:'l',kind:'transfer',active:true},
    B:{name:'Cup 16 oz',unit:'pcs',kind:'buy',active:true},
    C:{name:'Gula',unit:'kg',kind:'safe',active:true},
    D:{name:'Sedotan',unit:'pcs',kind:'transfer',active:true,needsPhysicalCheck:true}
  },balances:{ingredients:{
    A:{outlet:1,warehouse:6},B:{outlet:14,warehouse:0},C:{outlet:3,warehouse:5},D:{outlet:2,warehouse:9}
  }},movements:{}};
  const rows=mod.buildIngredientInventoryRows(raw,{core});
  const by=Object.fromEntries(rows.map(x=>[x.id,x]));
  assert.equal(by.A.action,'TRANSFER');
  assert.equal(by.B.action,'BUY');
  assert.equal(by.C.action,'SAFE');
  assert.equal(by.D.action,'CHECK_PHYSICAL');
  assert.equal(by.A.totalQty,7);
  assert.equal(by.A.actionLabel,'Perlu Transfer');
});

test('P3 Bahan & Gudang workspace has four local tabs and action-oriented stock UI',async()=>{
  const mod=await importFresh('src/ui/inventory-workspace-v32.js');
  assert.equal(typeof mod.renderInventoryWorkspaceV32,'function');
  const rows=[{id:'A',name:'Susu UHT',unit:'L',outletQty:1.2,warehouseQty:6,totalQty:7.2,action:'TRANSFER',actionLabel:'Perlu Transfer',actionDetail:'Gudang cukup',suggestedQty:2}];
  const summary=mod.renderInventoryWorkspaceV32({tab:'summary',rows,recentMovements:[]});
  for(const label of ['Ringkasan','Stok','Aktivitas','Lainnya'])assert.match(summary,new RegExp(`>${label}<`));
  assert.match(summary,/Observe|Perlu Tindakan|Perlu Transfer/);
  assert.match(summary,/data-v32-inventory-action="transfer"/);
  const stock=mod.renderInventoryWorkspaceV32({tab:'stock',rows,recentMovements:[]});
  assert.match(stock,/Cari bahan/);
  assert.match(stock,/Gerai/);assert.match(stock,/Gudang/);assert.match(stock,/Total/);
  assert.match(stock,/data-v32-inventory-search/);
  const activity=mod.renderInventoryWorkspaceV32({tab:'activity',rows,recentMovements:[]});
  for(const label of ['Catat Pembelian','Pindahkan Stok','Cek Stok Fisik','Aktivitas Terakhir'])assert.match(activity,new RegExp(label));
  const more=mod.renderInventoryWorkspaceV32({tab:'more',rows,recentMovements:[]});
  for(const label of ['Resep Produk','Riwayat Stok','Supplier','HPP','Pengaturan Inventori'])assert.match(more,new RegExp(label));
});

test('P3 inventory workspace delegates mutations to existing Inventory V2 forms instead of new writer tokens',()=>{
  const file=path.join(ROOT,'src/ui/inventory-workspace-v32.js');
  assert.equal(fs.existsSync(file),true,'inventory workspace must exist');
  const src=fs.readFileSync(file,'utf8');
  assert.match(src,/legacyOpen/);
  assert.match(src,/purchase/);assert.match(src,/transfer/);assert.match(src,/opname/);
  for(const token of ['.set(','.update(','.transaction(','.remove('])assert.equal(src.includes(token),false,`must not contain ${token}`);
});

test('P3 dashboard report deep-links apply active date and shift scope before navigating',async()=>{
  const mod=await importFresh('src/ui/owner-dashboard-hybrid.js');
  assert.equal(typeof mod.createOwnerDashboardNavigator,'function');
  const calls=[];
  const controller={state:{scope:'day',anchorDate:'2026-09-01',shift:'ALL'},setFilter(k,v){calls.push(['filter',k,v]);this.state[k]=v},async applyScope(scope,opt){calls.push(['scope',scope,opt.anchorDate]);this.state.scope=scope;this.state.anchorDate=opt.anchorDate;this.state.shift='ALL'},async rerender(){calls.push(['rerender'])}};
  const runtime={
    document:{getElementById(id){if(id==='date-sel')return{value:'2026-09-02'};if(id==='shift-sel')return{value:'S2',selectedOptions:[{textContent:'Shift Siang'}]};return null},querySelector(){return null}},
    __SJ_V29_REPORT_CONTROLLER:controller,
    showView(n){calls.push(['view',n])},setTimeout(fn){fn()}
  };
  const nav=mod.createOwnerDashboardNavigator(runtime);
  await nav('sales-report');
  assert.deepEqual(calls.slice(0,4),[['view',3],['scope','day','2026-09-02'],['filter','shift','S2'],['rerender']]);
});

test('P3 inventory stock search preserves the input node and only refreshes the result list',()=>{
  const src=read('src/ui/inventory-workspace-v32.js');
  assert.match(src,/function updateStockList\(/,'inventory workspace needs a partial stock-list updater');
  const inputHandler=src.match(/addEventListener\?\.\('input',[\s\S]{0,500}?\}\);/i)?.[0]||'';
  assert.match(inputHandler,/updateStockList\(/,'typing search must update only the stock list');
  assert.equal(/render\(host\)/.test(inputHandler),false,'typing search must not rebuild the search input and close Android keyboard');
});

test('P3 Finished Goods owner actions fail closed when role is unknown',async()=>{
  const mod=await importFresh('src/ui/finished-goods-warehouse-refinement.js');
  assert.equal(typeof mod.renderFinishedGoodsRows,'function');
  const rows=[{id:'P1',name:'Cilok',sku:'CL1',warehouseQty:10,outletQty:5,totalQty:15}];
  const unknown=mod.renderFinishedGoodsRows({role:null,rows});
  assert.doesNotMatch(unknown,/Set Stok Gudang|Transfer ke Gerai|Pembelian \(Advanced\)/,'unknown role must not receive Owner mutation entry points');
  const owner=mod.renderFinishedGoodsRows({role:'owner',rows});
  assert.match(owner,/Set Stok Gudang/);
});

test('P3 verifier is wired into the main ref01 verification chain',()=>{
  const pkg=JSON.parse(read('package.json'));
  assert.match(String(pkg.scripts?.['verify:v32:p3']||''),/verify-v32-reporting-inventory\.mjs/);
  assert.match(String(pkg.scripts?.['verify:ref01']||''),/verify:v32:p3/);
});
