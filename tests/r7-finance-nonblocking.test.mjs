import test from 'node:test';
import assert from 'node:assert/strict';
import { installFinanceWorkspaceV33 } from '../src/ui/finance-v33-workspace.js';
import { createR7ReadCoordinator } from '../src/app/r7-read-coordinator.js';

const deferred=()=>{let resolve,reject;const promise=new Promise((res,rej)=>{resolve=res;reject=rej});return{promise,resolve,reject}};
const flush=()=>new Promise(resolve=>setImmediate(resolve));

function loaded(period,netSales=125000){return{
  period,shiftCount:1,allShiftsClosed:true,activeClose:null,openShiftKeys:[],incompleteShiftKeys:[],historicalResolvedShiftKeys:[],
  model:{
    profit:{netSales,cogs:50000,cogsKnown:true,grossProfit:netSales-50000,grossMargin:60,businessExpenses:10000,netProfit:netSales-60000,hppCoverage:{unknownTransactions:0},hppDiagnostics:{reasonCohorts:{},postEvidenceGaps:{count:0},legacyNoEvidence:{count:0},transactionCoveragePct:100,revenueCoveragePct:100,measuredRevenue:netSales,measuredCogs:50000,measuredGrossProfit:netSales-50000,measuredGrossMargin:60}},
    ownerCapital:{opening:50000,additional:0,prive:0,calculatedEnding:netSales-10000},cashPosition:{available:80000,source:'Kas shift terbaru'},outstanding:{pendingTransactions:0,customerDebt:0,employeeAdvance:0},obligations:{scheduleAuthorityAvailable:false,observed:[]},daily:[],cashFlow:{rows:[]},inventoryPurchases:{cashOut:0}
  },input:{expenses:[],ownerEvents:[]}
}}

function domFixture(){
  const nodes=new Map(),handlers={};
  const makeNode=(id='')=>({
    id,style:{display:'block'},dataset:{},innerHTML:'',firstChild:null,parentElement:null,hidden:false,
    addEventListener(type,fn){(handlers[type]||(handlers[type]=[])).push(fn)},
    setAttribute(){},remove(){nodes.delete(this.id)},querySelector(){return null},querySelectorAll(){return[]},matches(){return false},
    insertBefore(node){node.parentElement=this;nodes.set(node.id,node);if(!this.firstChild)this.firstChild=node;return node}
  });
  const host=makeNode('lap-menu-view');nodes.set(host.id,host);
  const document={getElementById(id){return nodes.get(id)||null},createElement(){return makeNode()}};
  return{document,nodes,handlers,host};
}
function target(selector,value=''){return{value,dataset:{},matches(sel){return sel.split(',').some(x=>x.trim()===selector)},closest(){return null}}}
function fixture(){
  const dom=domFixture(),pending=[],calls=[];
  const p4={authorizer:{async authorize(){return{ok:true}}},finance:{
    loadMonth(period){calls.push(period);const d=deferred();pending.push({period,d});return d.promise},
    loadPurchaseAudit:async()=>null,openExpense(){},async postOwnerEvent(){},async repairPurchaseLink(){},async acknowledgeHistoricalShift(){},async reversePurchase(){},async closeMonth(){},async reopenMonth(){}
  }};
  const runtime={document:dom.document,Function(){return()=> '2026-09-08'},SJReportFoundationV010:{Core:{renderOwnerSummary(){return'<main>SALES</main>'}}}};
  const ui=installFinanceWorkspaceV33(runtime,{document:dom.document,p4,readRole:()=> 'owner'});ui.enhance();
  assert.ok(runtime.__SJ_R7_READ_COORDINATOR,'Finance installer must ensure the shared R7 coordinator');
  return{...dom,p4,runtime,ui,pending,calls,root:()=>dom.nodes.get('sj-v33-finance-workspace')};
}

test('R7 finance unknown target keeps full shell visible with unknown placeholders while load is pending',async()=>{
  const f=fixture();f.ui.setSurface('finance');
  assert.equal(f.pending.length,1);assert.equal(f.pending[0].period,'2026-09');
  assert.match(f.root().innerHTML,/Keuangan/);assert.match(f.root().innerHTML,/2026-09|September 2026/);
  assert.match(f.root().innerHTML,/—/);assert.match(f.root().innerHTML,/Memperbarui|Mengambil data/);
  assert.doesNotMatch(f.root().innerHTML,/Memuat Finance v3\.3/);
  f.pending[0].d.resolve(loaded('2026-09',125000));await flush();await flush();
  assert.match(f.root().innerHTML,/Ringkasan Keuangan/);assert.match(f.root().innerHTML,/125\.000/);
});

test('R7 finance period change paints target cache immediately and failure preserves matching cache with warning',async()=>{
  const f=fixture();f.ui.setSurface('finance');f.pending[0].d.resolve(loaded('2026-09',125000));await flush();await flush();
  const change=f.handlers.change[0];
  change({target:target('[data-v33-fin-period]','2026-08')});
  assert.equal(f.pending.length,2);assert.match(f.root().innerHTML,/—/);assert.match(f.root().innerHTML,/2026-08|Agustus 2026/);
  f.pending[1].d.resolve(loaded('2026-08',88000));await flush();await flush();assert.match(f.root().innerHTML,/88\.000/);
  const refresh=f.ui.reload();
  assert.equal(f.pending.length,3);assert.match(f.root().innerHTML,/88\.000/);assert.match(f.root().innerHTML,/Data terakhir ditampilkan|Memperbarui/);
  f.pending[2].d.reject(new Error('FIREBASE_SLOW'));await refresh;
  assert.match(f.root().innerHTML,/88\.000/);assert.match(f.root().innerHTML,/Belum dapat memperbarui|FIREBASE_SLOW/);
});

test('R7 finance search/source/day/category filters are local and never call loadMonth',async()=>{
  const f=fixture();f.ui.setSurface('finance');f.pending[0].d.resolve(loaded('2026-09'));await flush();await flush();
  const before=f.calls.length;
  const input=f.handlers.input[0],change=f.handlers.change[0];
  input({target:target('[data-v33-fin-search]','kopi')});
  change({target:target('[data-v33-fin-source]','CASH')});
  change({target:target('[data-v33-fin-day]','2026-09-08')});
  change({target:target('[data-v33-fin-expense-category]','Operasional')});
  assert.equal(f.calls.length,before);
});
