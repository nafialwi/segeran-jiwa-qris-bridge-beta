import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  FINANCE_V33_TABS,
  renderFinanceWorkspaceV33,
  createFinanceWorkspaceControllerV33,
  buildCloseChecklistV33
} from '../src/ui/finance-v33-workspace.js';
import {
  renderQrisCashOutPanelV33,
  createQrisCashOutUiControllerV33
} from '../src/ui/qris-cash-out-ui.js';

const loaded=({hppKnown=true}={})=>({
  period:'2026-09',shiftCount:2,allShiftsClosed:true,activeClose:null,
  model:{
    profit:{netSales:150000,cogs:60000,cogsKnown:hppKnown,businessExpenses:10000,netProfit:hppKnown?80000:null,hppCoverage:{knownTransactions:hppKnown?2:1,unknownTransactions:hppKnown?0:1}},
    ownerCapital:{opening:200000,additional:50000,prive:10000,calculatedEnding:hppKnown?320000:null},
    inventoryPurchases:{cashOut:25000},
    cashFlow:{rows:[{id:'sale:T1',kind:'SALE',description:'Penjualan T1',source:'CASH',in:100000,out:0,ts:1},{id:'expense:E1',kind:'OPERATING_EXPENSE',description:'Listrik',source:'CASH',in:0,out:10000,ts:2}]}
  },
  input:{expenses:[{id:'E1',category:'Listrik',amount:10000,n:'Token',source:'CASH',ts:2}],ownerEvents:[{operationId:'O1',type:'OPENING_CAPITAL',amount:200000,effectiveDate:'2026-09-01'}]}
});

test('P4 finance workspace renders exactly five locked tabs and never renders unknown HPP as Rp0',()=>{
  assert.deepEqual(FINANCE_V33_TABS.map(x=>x.label),['Ringkasan','Arus Kas','Pengeluaran','Modal & Prive','Tutup Bulan']);
  const html=renderFinanceWorkspaceV33({loaded:loaded({hppKnown:false}),tab:'summary',readOnly:false});
  for(const label of FINANCE_V33_TABS.map(x=>x.label))assert.match(html,new RegExp(label.replace('&','&amp;')));
  assert.match(html,/HPP[\s\S]*Belum tersedia/);
  assert.doesNotMatch(html,/HPP[\s\S]{0,80}Rp\s*0/);
});

test('P4 finance controller delegates expense to existing authority and sends only reauth proof to owner-event/month-close writers',async()=>{
  const calls=[],proof={ok:true,role:'owner',ownerId:'owner-a',requesterId:'owner-a',requesterRole:'owner',reauthenticatedAt:1};
  const p4={authorizer:{async authorize(input){calls.push(['authorize',input]);return proof}},finance:{
    openExpense(){calls.push(['expense'])},
    async postOwnerEvent(input){calls.push(['owner',input]);return input},
    async closeMonth(input){calls.push(['close',input]);return input},
    async reopenMonth(input){calls.push(['reopen',input]);return input}
  }};
  const c=createFinanceWorkspaceControllerV33({p4,now:()=>1000,random:()=>0.25,readOnly:false});
  c.openExpense();
  await c.postOwnerEvent({period:'2026-09',type:'ADDITIONAL_CAPITAL',amount:50000,effectiveDate:'2026-09-02',source:'OWNER',note:'Tambah modal',pin:'2468'});
  await c.closeMonth({period:'2026-09',checklist:{cash:true},pin:'2468'});
  assert.deepEqual(calls.map(x=>x[0]),['expense','authorize','owner','authorize','close']);
  assert.deepEqual(calls[1][1],{pin:'2468'});assert.deepEqual(calls[3][1],{pin:'2468'});
  for(const item of [calls[2][1],calls[4][1]]){assert.equal(item.authorization,proof);assert.equal('pin' in item,false)}
});

test('P4 finance controller blocks all mutations in LOCAL QA read-only mode before authorizer/writer calls',async()=>{
  let calls=0;const p4={authorizer:{authorize(){calls++;return {}}},finance:{openExpense(){calls++},postOwnerEvent(){calls++},closeMonth(){calls++}}};
  const c=createFinanceWorkspaceControllerV33({p4,readOnly:true});
  assert.throws(()=>c.openExpense(),/LOCAL_QA_READ_ONLY/);
  await assert.rejects(()=>c.postOwnerEvent({}),/LOCAL_QA_READ_ONLY/);
  await assert.rejects(()=>c.closeMonth({}),/LOCAL_QA_READ_ONLY/);
  assert.equal(calls,0);
});

test('P4 QRIS cash-out UI offers action only for a real overpay candidate and differentiates Owner vs Cashier approval fields',()=>{
  const candidate={providerTransactionId:'PROV-1',amount:20000,cashOutAmount:16000};
  const none=renderQrisCashOutPanelV33({pendingId:'PEND-1',saleAmount:4000,candidates:[],role:'cashier'});
  assert.doesNotMatch(none,/data-v33-qris-cashout-submit/);
  const owner=renderQrisCashOutPanelV33({pendingId:'PEND-1',saleAmount:4000,candidates:[candidate],role:'owner'});
  assert.match(owner,/data-v33-qris-cashout-submit/);assert.match(owner,/PIN Owner/);assert.doesNotMatch(owner,/data-v33-qris-owner-id/);
  const cashier=renderQrisCashOutPanelV33({pendingId:'PEND-1',saleAmount:4000,candidates:[candidate],role:'cashier'});
  assert.match(cashier,/data-v33-qris-owner-id/);assert.match(cashier,/Rp\s*20\.000/);assert.match(cashier,/Rp\s*16\.000/);
});

test('P4 QRIS cash-out controller requires Owner reauth and sends proof, never PIN, to coordinator',async()=>{
  const calls=[],proof={ok:true,role:'owner',ownerId:'owner-a',requesterId:'kasir-a',requesterRole:'cashier',reauthenticatedAt:1};
  const p4={authorizer:{async authorize(input){calls.push(['authorize',input]);return proof}},qrisCashOut:{async execute(input){calls.push(['execute',input]);return {status:'CONFIRMED'}}}};
  const c=createQrisCashOutUiControllerV33({p4,readRole:()=> 'cashier',readOnly:false});
  const result=await c.execute({providerTransactionId:'PROV-1',pendingId:'PEND-1',ownerId:'owner-a',pin:'2468'});
  assert.equal(result.status,'CONFIRMED');assert.deepEqual(calls[0],['authorize',{pin:'2468',ownerId:'owner-a'}]);
  assert.equal(calls[1][1].authorization,proof);assert.equal('pin' in calls[1][1],false);assert.equal('ownerId' in calls[1][1],false);
});

test('P4 finance canonical-report containment preserves P2 important budget without weakening selector scope',()=>{
  const css=fs.readFileSync(new URL('../src/ui/ref01.css',import.meta.url),'utf8');
  const sales=css.match(/#lap-menu-view\[data-sj-v33-report-surface="sales"\]>#sj-v33-finance-workspace\{display:none\}/);
  const finance=css.match(/#lap-menu-view\[data-sj-v33-report-surface="finance"\]>:not\(#sj-v33-report-switcher\):not\(#sj-v33-finance-workspace\)\{display:none\}/);
  assert.ok(sales,'missing sales-surface finance containment rule');
  assert.ok(finance,'missing finance-surface report containment rule');
  assert.doesNotMatch(`${sales[0]}${finance[0]}`,/!important/);
  assert.doesNotMatch(css,/#lap2\[data-sj-v33-finance-active=/);
  assert.equal((css.match(/!important/g)||[]).length<=252,true);
});

test('REF01 lifecycle wires P4 finance and QRIS cash-out refinements without direct RTDB mutation in UI',()=>{
  const bootstrap=fs.readFileSync(new URL('../src/app/ref01-bootstrap.js',import.meta.url),'utf8');
  const finance=fs.readFileSync(new URL('../src/ui/finance-v33-workspace.js',import.meta.url),'utf8');
  const qris=fs.readFileSync(new URL('../src/ui/qris-cash-out-ui.js',import.meta.url),'utf8');
  assert.match(bootstrap,/installFinanceWorkspaceV33/);assert.match(bootstrap,/installQrisCashOutUiV33/);assert.match(bootstrap,/financeWorkspace\?\.enhance/);assert.match(bootstrap,/qrisCashOutUi\?\.enhance/);
  assert.doesNotMatch(finance,/\.(?:set|update|transaction|remove)\s*\(/);assert.doesNotMatch(qris,/\.(?:set|update|transaction|remove)\s*\(/);
});



test('P4 finance shell survives canonical Report Foundation async rerender without a manual REF01 enhance',async()=>{
  const nodes=new Map();
  const makeNode=(id='')=>({
    id,style:{display:'block'},dataset:{},innerHTML:'',firstChild:null,parentElement:null,className:'',
    addEventListener(){},querySelector(){return null},matches(){return false},setAttribute(){},
    insertBefore(node){node.parentElement=this;nodes.set(node.id,node);if(!this.firstChild)this.firstChild=node;return node}
  });
  const host=makeNode('lap-menu-view');nodes.set(host.id,host);
  const document={getElementById(id){return nodes.get(id)||null},createElement(){return makeNode()}};
  const core={renderOwnerSummary(){return '<main class="canonical-sales">SALES</main>'}};
  const runtime={document,__SJ_LOCAL_QA_READ_ONLY:true,SJReportFoundationV010:{Core:core}};
  const p4={
    authorizer:{async authorize(){return{ok:true}}},
    finance:{
      async loadMonth(period){return{period,shiftCount:0,allShiftsClosed:false,activeClose:null,model:{profit:{netSales:0,cogs:null,cogsKnown:false,businessExpenses:0,netProfit:null,hppCoverage:{unknownTransactions:0}},ownerCapital:{opening:0,additional:0,prive:0,calculatedEnding:null},inventoryPurchases:{cashOut:0},cashFlow:{rows:[]}},input:{expenses:[],ownerEvents:[]}}},
      openExpense(){},async postOwnerEvent(){},async closeMonth(){},async reopenMonth(){}
    }
  };
  const { installFinanceWorkspaceV33 }=await import('../src/ui/finance-v33-workspace.js');
  const ui=installFinanceWorkspaceV33(runtime,{document,p4,readRole:()=> 'owner'});
  assert.equal(ui.enhance(),true);

  const finalHtml=core.renderOwnerSummary({});
  assert.match(finalHtml,/id="sj-v33-report-switcher"[\s\S]*Penjualan[\s\S]*Keuangan/,'canonical final report render must carry the Finance surface switcher');
  assert.match(finalHtml,/id="sj-v33-finance-workspace"/,'canonical final report render must carry the Finance workspace slot');
  assert.match(finalHtml,/canonical-sales/,'canonical sales report must remain present');

  // Simulate Report Foundation showHTML(): host.innerHTML replacement creates new DOM nodes
  // after the initial REF01 enhancement. No ui.enhance() is called here on purpose.
  const newNav=makeNode('sj-v33-report-switcher'),newRoot=makeNode('sj-v33-finance-workspace');
  nodes.set(newNav.id,newNav);nodes.set(newRoot.id,newRoot);
  ui.setSurface('finance');
  await ui.reload();
  assert.match(newRoot.innerHTML,/Ringkasan Keuangan/,'Finance paint must target the post-rerender workspace node, not a detached stale node');
});
test('P4 finance report integration mounts on canonical Report Foundation host, not legacy lap2',async()=>{
  const nodes=new Map();
  const makeNode=(id='')=>({
    id,style:{display:'block'},dataset:{},innerHTML:'',firstChild:null,parentElement:null,
    addEventListener(){},querySelector(){return null},matches(){return false},
    insertBefore(node){node.parentElement=this;nodes.set(node.id,node);if(!this.firstChild)this.firstChild=node;return node}
  });
  const host=makeNode('lap-menu-view');nodes.set(host.id,host);
  const document={
    getElementById(id){return nodes.get(id)||null},
    createElement(){return makeNode()}
  };
  const runtime={document,__SJ_LOCAL_QA_READ_ONLY:true};
  const p4={
    authorizer:{async authorize(){return{ok:true}}},
    finance:{
      async loadMonth(period){return{period,shiftCount:0,allShiftsClosed:false,activeClose:null,model:{profit:{netSales:0,cogs:null,cogsKnown:false,businessExpenses:0,netProfit:null,hppCoverage:{unknownTransactions:0}},ownerCapital:{opening:0,additional:0,prive:0,calculatedEnding:null},inventoryPurchases:{cashOut:0},cashFlow:{rows:[]}},input:{expenses:[],ownerEvents:[]}}},
      openExpense(){},async postOwnerEvent(){},async closeMonth(){},async reopenMonth(){}
    }
  };
  const { installFinanceWorkspaceV33 }=await import('../src/ui/finance-v33-workspace.js');
  const ui=installFinanceWorkspaceV33(runtime,{document,p4,readRole:()=> 'owner'});
  assert.equal(ui.enhance(),true);
  assert.ok(nodes.has('sj-v33-report-switcher'),'missing Penjualan/Keuangan switcher on canonical report host');
  assert.ok(nodes.has('sj-v33-finance-workspace'),'missing finance workspace on canonical report host');
  assert.match(nodes.get('sj-v33-report-switcher').innerHTML,/Penjualan/);
  assert.match(nodes.get('sj-v33-report-switcher').innerHTML,/Keuangan/);
  ui.setSurface('finance');
  assert.equal(host.dataset.sjV33ReportSurface,'finance');
  nodes.delete('sj-v33-report-switcher');nodes.delete('sj-v33-finance-workspace');
  assert.equal(ui.enhance(),true,'finance shell must be recreated after canonical report rerender');
  assert.ok(nodes.has('sj-v33-report-switcher'));assert.ok(nodes.has('sj-v33-finance-workspace'));
  assert.equal(host.dataset.sjV33ReportSurface,'finance');
  const source=fs.readFileSync(new URL('../src/ui/finance-v33-workspace.js',import.meta.url),'utf8');
  assert.match(source,/getElementById\?\.\('lap-menu-view'\)/);
  assert.doesNotMatch(source,/getElementById\?\.\('lap2'\)/);
});

test('RC4 Finance Ringkasan conforms to locked owner finance headline instead of summary-only RC3 cards',()=>{
  const fixture=loaded({hppKnown:true});
  fixture.model.cashPosition={available:275000,source:'Shift terbaru',latestShiftKey:'2026-09-02-S2'};
  fixture.model.outstanding={customerDebt:12000,employeeAdvance:5000,pendingTransactions:0};
  fixture.model.obligations={observed:[{category:'Listrik',amount:10000,count:1}],scheduleAuthorityAvailable:false};
  const html=renderFinanceWorkspaceV33({loaded:fixture,tab:'summary',readOnly:true});
  assert.match(html,/September 2026/);
  assert.match(html,/data-v33-fin-period/);
  for(const label of ['Kas Tersedia','Modal Awal','Tambahan Modal','Prive','Penjualan Bersih','HPP','Pengeluaran Bisnis','Laba Bersih','Modal Akhir Terhitung'])assert.match(html,new RegExp(label));
  assert.match(html,/Kas Tersedia[\s\S]*Rp\s*275\.000/);
  assert.match(html,/Kas Tersedia[^]*Modal Akhir Terhitung/);
  assert.match(html,/Peringatan|Perlu diperiksa/);
  assert.match(html,/Jadwal tagihan belum memiliki authority persistence/);
});

test('RC4 Arus Kas exposes four KPI cards, filters, search, date grouping, source/category and running balance',()=>{
  const fixture=loaded();
  fixture.model.cashPosition={available:190000,source:'Shift terbaru',latestShiftKey:'2026-09-02-S2'};
  fixture.model.cashFlow={
    totalIn:100000,totalOut:10000,netChange:90000,
    rows:[
      {id:'sale:T1',kind:'SALE',category:'Penjualan',description:'Penjualan Shift Pagi',source:'CASH',in:100000,out:0,ts:Date.parse('2026-09-02T09:15:00+07:00'),runningBalance:100000,date:'2026-09-02'},
      {id:'expense:E1',kind:'OPERATING_EXPENSE',category:'Operasional',description:'Listrik',source:'CASH',in:0,out:10000,ts:Date.parse('2026-09-02T14:00:00+07:00'),runningBalance:90000,date:'2026-09-02'}
    ]
  };
  const html=renderFinanceWorkspaceV33({loaded:fixture,tab:'cashflow',readOnly:true});
  for(const label of ['Uang Masuk','Uang Keluar','Arus Kas Bersih','Kas Tersedia'])assert.match(html,new RegExp(label));
  assert.match(html,/data-v33-fin-source/);assert.match(html,/data-v33-fin-search/);assert.match(html,/data-v33-fin-day/);
  assert.match(html,/02 Sep 2026/);assert.match(html,/Penjualan/);assert.match(html,/Operasional/);assert.match(html,/CASH/);assert.match(html,/Saldo/);
});

test('RC4 Pengeluaran shows monthly total and category breakdown but still delegates write to existing authority',()=>{
  const fixture=loaded();
  fixture.input.expenses.push({id:'E2',category:'Sewa',amount:20000,n:'Sewa kios',source:'BANK',ts:3});
  const html=renderFinanceWorkspaceV33({loaded:fixture,tab:'expenses',readOnly:true});
  assert.match(html,/Total Pengeluaran Bisnis/);assert.match(html,/Rp\s*30\.000/);
  assert.match(html,/Ringkasan Kategori/);assert.match(html,/Listrik/);assert.match(html,/Sewa/);
  assert.match(html,/data-v33-fin-expense-category/);
  assert.match(html,/Buka Pengeluaran/);assert.match(html,/disabled/);
  assert.match(html,/existing|authority/i);
});

test('RC4 Modal & Prive keeps owner controls visible but disabled in LOCAL QA and shows monthly chronology/reversal semantics',()=>{
  const fixture=loaded();
  fixture.input.ownerEvents=[
    {operationId:'O1',type:'OPENING_CAPITAL',amount:200000,effectiveDate:'2026-09-01',createdTs:1},
    {operationId:'O2',type:'ADDITIONAL_CAPITAL',amount:50000,effectiveDate:'2026-09-02',createdTs:2},
    {operationId:'O3',type:'PRIVE',amount:10000,effectiveDate:'2026-09-03',createdTs:3},
    {operationId:'R1',type:'REVERSAL',amount:50000,effectiveDate:'2026-09-04',reversalOf:'O2',createdTs:4}
  ];
  const html=renderFinanceWorkspaceV33({loaded:fixture,tab:'capital',readOnly:true});
  for(const label of ['Modal Awal','Tambahan Modal','Prive','Modal Akhir Terhitung'])assert.match(html,new RegExp(label));
  assert.match(html,/Riwayat Modal &amp; Prive/);assert.match(html,/REVERSAL/);assert.match(html,/Pembalikan/);
  assert.match(html,/data-v33-owner-event-form/);assert.match(html,/LOCAL QA/);assert.match(html,/disabled/);
});


test('RC4 month-close checklist derives automatic evidence from loaded authority data instead of disabled FormData fields',()=>{
  const fixture=loaded({hppKnown:false});
  fixture.allShiftsClosed=true;
  fixture.model.outstanding={pendingTransactions:0,customerDebt:12000,employeeAdvance:5000};
  fixture.input.expenses.push({id:'E2',category:'',amount:5000,n:'Belum dikategorikan'});
  const checklist=buildCloseChecklistV33(fixture,{obligations:true,outstanding:true});
  assert.equal(checklist.cash,true);
  assert.equal(checklist.pending,true);
  assert.equal(checklist.hpp,true,'HPP status has been inspected even when completeness is false');
  assert.equal(checklist.hppKnown,false);
  assert.equal(checklist.expense,false);
  assert.equal(checklist.expenseUncategorized,1);
  assert.equal(checklist.obligations,true);
  assert.equal(checklist.outstanding,true);
});

test('RC4 Tutup Bulan renders recap, all locked checklist semantics, outstanding issues and visible-disabled LOCAL QA action',()=>{
  const fixture=loaded({hppKnown:false});
  fixture.allShiftsClosed=false;
  fixture.model.cashPosition={available:275000,source:'Shift terbaru'};
  fixture.model.outstanding={customerDebt:12000,employeeAdvance:5000,pendingTransactions:2};
  fixture.model.obligations={observed:[{category:'Listrik',amount:10000,count:1}],scheduleAuthorityAvailable:false};
  const html=renderFinanceWorkspaceV33({loaded:fixture,tab:'close',readOnly:true});
  assert.match(html,/Ringkasan Bulan/);assert.match(html,/Modal &amp; Prive Bulan Ini/);assert.match(html,/Tagihan Bulanan/);
  for(const label of ['Semua shift ditutup','Tidak ada transaksi pending','Status HPP sudah diperiksa','Pengeluaran sudah dikategorikan','Tagihan\/kewajiban bulanan sudah diperiksa','Outstanding issues sudah diperiksa'])assert.match(html,new RegExp(label));
  assert.match(html,/2 transaksi pending/);assert.match(html,/HPP belum lengkap/);assert.match(html,/Hutang pelanggan/);assert.match(html,/Kasbon karyawan/);
  assert.match(html,/Tutup Bulan September 2026/);assert.match(html,/disabled/);assert.match(html,/LOCAL QA/);
});
