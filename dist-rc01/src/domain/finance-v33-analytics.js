import { buildCostingCoverageDiagnosticsV34 } from './costing-v34-coverage.js';
const num=v=>Number.isFinite(Number(v))?Number(v):0;
const upper=v=>String(v??'').trim().toUpperCase();
const rows=v=>Array.isArray(v)?v.filter(Boolean):v&&typeof v==='object'?Object.entries(v).filter(([,x])=>x!=null).map(([id,x])=>Object.assign({_key:id},x)):[];
const amountOf=v=>Math.max(0,num(v?.amount??v?.a??v?.nominal??v?.total));
const eventTs=v=>num(v?.ts??v?.createdTs??Date.parse(v?.at||v?.createdAt||''));
const eventId=v=>String(v?.id||v?.operationId||v?._key||'');
const pendingStatus=v=>['PENDING','PROCESSING','INIT','OPEN','WAITING'].includes(upper(v?.status));
const jakartaDate=ts=>{try{return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(num(ts)))}catch(_){return ''}};
const remaining=v=>{if(v?.remaining!==null&&v?.remaining!==undefined)return Math.max(0,num(v.remaining));const total=num(v?.originalAmount??v?.nominal??v?.nom),paid=num(v?.paid);return Math.max(0,total-paid)};
const flowCategory=kind=>({SALE:'Penjualan',SALE_QRIS_CASH_OUT:'Penjualan',INVENTORY_PURCHASE:'Belanja Stok',OPERATING_EXPENSE:'Operasional',OPENING_CAPITAL:'Modal',ADDITIONAL_CAPITAL:'Modal',PRIVE:'Prive',REVERSAL:'Koreksi',PURCHASE_REVERSAL:'Koreksi Pembelian',DEBT_PAYMENT:'Piutang',ADVANCE_REPAYMENT:'Kasbon',EMPLOYEE_ADVANCE:'Kasbon',QRIS_CASH_OUT:'QRIS Cash-out',CASH_MOVEMENT:'Mutasi Kas'}[upper(kind)]||'Lainnya');

export function classifyExpense(expense={}){
  const amount=amountOf(expense),linked=!!(expense.purchaseRef||expense.systemLinked&&/BELANJA\s+(BAHAN|STOK|BARANG)/i.test(String(expense.category||'')));
  if(linked)return Object.freeze({kind:'INVENTORY_PURCHASE',cashFlowOut:amount,profitExpense:0,amount,source:upper(expense.source||expense.fundSource||'CASH')});
  return Object.freeze({kind:'OPERATING_EXPENSE',cashFlowOut:amount,profitExpense:amount,amount,source:upper(expense.source||expense.fundSource||'CASH')});
}

export function classifyPurchaseFundingV33(purchase={}, {bankAuthorityAvailable=false}={}){
  const amount=Math.max(0,num(purchase?.landedCost??purchase?.totalLandedCost??purchase?.cashCompensation??purchase?.amount)),source=upper(purchase?.fundSource||purchase?.source||'OTHER')||'OTHER';
  if(source==='CASH')return Object.freeze({source,amount,treatment:'BUSINESS_CASH',confirmedBusinessAmount:amount,ownerFunded:0,bankUnverified:0,otherUnresolved:0,requiresAuthority:false,label:'Kas Usaha'});
  if(source==='OWNER')return Object.freeze({source,amount,treatment:'OWNER_DIRECT',confirmedBusinessAmount:0,ownerFunded:amount,bankUnverified:0,otherUnresolved:0,requiresAuthority:false,label:'Dana Owner'});
  if(source==='BANK')return Object.freeze({source,amount,treatment:bankAuthorityAvailable?'BUSINESS_BANK':'BANK_UNVERIFIED',confirmedBusinessAmount:bankAuthorityAvailable?amount:0,ownerFunded:0,bankUnverified:bankAuthorityAvailable?0:amount,otherUnresolved:0,requiresAuthority:!bankAuthorityAvailable,label:bankAuthorityAvailable?'Bank Usaha':'Bank · authority belum tersedia'});
  return Object.freeze({source,amount,treatment:'OTHER_UNRESOLVED',confirmedBusinessAmount:0,ownerFunded:0,bankUnverified:0,otherUnresolved:amount,requiresAuthority:true,label:'Sumber Lain · perlu verifikasi'});
}

function transactionFinance(tx={}){
  if(['VOID','VOIDED','CANCELLED','CANCELED'].includes(upper(tx.status))||pendingStatus(tx))return null;
  const costing=tx.costing&&typeof tx.costing==='object'?tx.costing:{};
  const refund=tx.refundCostingTotals&&typeof tx.refundCostingTotals==='object'?tx.refundCostingTotals:{};
  const pricing=tx.pricing&&typeof tx.pricing==='object'?tx.pricing:{};
  const grossNet=num(tx.netRevenue??costing.netRevenue??pricing.grandTotal??tx.total??tx.grandTotal);
  const refundRevenue=Math.max(0,num(refund.netRevenue??tx.refundTotal));
  const netRevenue=Math.max(0,grossNet-refundRevenue);
  const explicitKnown=tx.costKnown!==undefined?tx.costKnown:costing.costingKnown;
  const rawCogs=tx.cogs??costing.cogsTotal;
  const costKnown=explicitKnown===false?false:rawCogs!==null&&rawCogs!==undefined&&rawCogs!=='';
  const refundCogs=Math.max(0,num(refund.cogs));
  const cogs=costKnown?Math.max(0,num(rawCogs)-refundCogs):null,evidence=tx._costingEvidenceV34&&typeof tx._costingEvidenceV34==='object'?tx._costingEvidenceV34:{},evidenceState=String(evidence.state||'').trim()||(costKnown?'SNAPSHOT_VERIFIED':'NOT_SAFE_TO_RECONSTRUCT');
  return Object.freeze({id:String(tx.id||tx._key||''),netRevenue,cogs,costKnown,method:upper(tx.method||tx.paymentMethod||tx.payment?.method||'CASH'),ts:eventTs(tx),evidenceState,refundSource:String(evidence.refundSource||'')});
}

function ownerEventState(ownerEvents=[]){
  const all=rows(ownerEvents),byId=new Map(all.map(e=>[eventId(e),e])),reversed=new Set();
  for(const e of all)if(upper(e.type)==='REVERSAL'&&e.reversalOf)reversed.add(String(e.reversalOf));
  const effective=all.filter(e=>upper(e.type)!=='REVERSAL'&&!reversed.has(eventId(e)));
  return{all,byId,reversed,effective};
}
function ownerCapitalTotals(ownerEvents=[]){
  let opening=0,additional=0,prive=0;
  for(const e of ownerEventState(ownerEvents).effective){
    const a=amountOf(e),t=upper(e.type);
    if(t==='OPENING_CAPITAL')opening+=a;
    else if(t==='ADDITIONAL_CAPITAL')additional+=a;
    else if(t==='PRIVE')prive+=a;
  }
  return{opening,additional,prive};
}

export function buildFinanceReadModel(input={}){
  const rawTransactions=rows(input.transactions),tx=rawTransactions.map(transactionFinance).filter(Boolean);
  const expenseRows=rows(input.expenses),expenseClass=expenseRows.map(classifyExpense);
  const netSales=tx.reduce((s,x)=>s+x.netRevenue,0);
  const known=tx.filter(x=>x.costKnown),unknown=tx.filter(x=>!x.costKnown);
  const cogs=known.reduce((s,x)=>s+num(x.cogs),0);
  const grossProfit=unknown.length?null:netSales-cogs,grossMargin=grossProfit===null||netSales<=0?grossProfit===null?null:0:grossProfit/netSales*100;
  const evidenceCoverage={snapshotVerified:tx.filter(x=>x.evidenceState==='SNAPSHOT_VERIFIED').length,reconstructedVerified:tx.filter(x=>x.evidenceState==='RECONSTRUCTED_VERIFIED').length,partialEvidence:tx.filter(x=>x.evidenceState==='PARTIAL_EVIDENCE').length,notSafeToReconstruct:tx.filter(x=>x.evidenceState==='NOT_SAFE_TO_RECONSTRUCT').length,refundReconstructed:tx.filter(x=>x.refundSource==='ORIGINAL_COST_SNAPSHOT_REFUND').length,voidExcluded:rawTransactions.filter(x=>['VOID','VOIDED','CANCELLED','CANCELED'].includes(upper(x.status))).length};
  const hppDiagnostics=buildCostingCoverageDiagnosticsV34(rawTransactions);
  const businessExpenses=expenseClass.reduce((s,x)=>s+x.profitExpense,0);
  const purchaseRows=rows(input.purchases).filter(p=>!upper(p.status)||['COMMITTED','EXPENSE_APPLIED','INVENTORY_APPLIED'].includes(upper(p.status)));
  const purchaseFunding=purchaseRows.map(p=>classifyPurchaseFundingV33(p,{bankAuthorityAvailable:input.bankAuthorityAvailable===true}));
  const purchaseCashOut=purchaseRows.length?purchaseFunding.reduce((s,x)=>s+x.confirmedBusinessAmount,0):expenseClass.filter(x=>x.kind==='INVENTORY_PURCHASE'&&x.source==='CASH').reduce((s,x)=>s+x.cashFlowOut,0);
  const purchaseFundingBreakdown={cashOut:purchaseCashOut,ownerFunded:purchaseFunding.reduce((s,x)=>s+x.ownerFunded,0),bankUnverified:purchaseFunding.reduce((s,x)=>s+x.bankUnverified,0),otherUnresolved:purchaseFunding.reduce((s,x)=>s+x.otherUnresolved,0),grossPurchases:purchaseFunding.reduce((s,x)=>s+x.amount,0)};
  const netProfit=unknown.length?null:netSales-cogs-businessExpenses;
  const ownerCapital=ownerCapitalTotals(input.ownerEvents);
  const calculatedEnding=netProfit===null?null:ownerCapital.opening+ownerCapital.additional+netProfit-ownerCapital.prive;
  const cashRows=buildCashFlowRows(input),totalIn=cashRows.reduce((s,x)=>s+num(x.in),0),totalOut=cashRows.reduce((s,x)=>s+num(x.out),0);
  const dailyByDate=Object.create(null);
  for(const row of cashRows){const date=row.date||jakartaDate(row.ts);if(!date)continue;const d=dailyByDate[date]||{date,cashIn:0,cashOut:0,netCash:0,count:0};d.cashIn+=num(row.in);d.cashOut+=num(row.out);d.netCash=d.cashIn-d.cashOut;d.count+=1;dailyByDate[date]=d}
  const observedByCategory=Object.create(null);
  for(const e of expenseRows){const category=String(e?.category||'').trim();if(!/^(GAJI|LISTRIK|SEWA)$/i.test(category))continue;const key=category.toLowerCase(),prev=observedByCategory[key]||{category,amount:0,count:0};prev.amount+=amountOf(e);prev.count+=1;observedByCategory[key]=prev}
  const customerDebt=rows(input.customerDebts).reduce((sum,row)=>sum+remaining(row),0),employeeAdvance=rows(input.employeeAdvances).reduce((sum,row)=>sum+remaining(row),0);
  return Object.freeze({
    profit:Object.freeze({netSales,cogs,cogsKnown:unknown.length===0,grossProfit,grossMargin,businessExpenses,netProfit,hppCoverage:Object.freeze({knownTransactions:known.length,unknownTransactions:unknown.length,knownRevenue:known.reduce((s,x)=>s+x.netRevenue,0),unknownRevenue:unknown.reduce((s,x)=>s+x.netRevenue,0),...evidenceCoverage}),hppDiagnostics}),
    ownerCapital:Object.freeze({...ownerCapital,calculatedEnding}),
    inventoryPurchases:Object.freeze({...purchaseFundingBreakdown,requiresFundingReview:purchaseFundingBreakdown.bankUnverified>0||purchaseFundingBreakdown.otherUnresolved>0}),
    cashFlow:Object.freeze({rows:cashRows,totalIn,totalOut,netChange:totalIn-totalOut}),
    daily:Object.freeze(Object.values(dailyByDate).sort((a,b)=>a.date.localeCompare(b.date)).map(x=>Object.freeze({...x}))),
    outstanding:Object.freeze({customerDebt,employeeAdvance,pendingTransactions:rawTransactions.filter(pendingStatus).length}),
    obligations:Object.freeze({observed:Object.freeze(Object.values(observedByCategory).sort((a,b)=>a.category.localeCompare(b.category,'id')).map(x=>Object.freeze({...x}))),scheduleAuthorityAvailable:false})
  });
}

function pushRow(out,{id,ts,kind,description,source='OTHER',inflow=0,outflow=0,refId=null,fundingAmount=0,fundingTreatment='',fundingLabel='',requiresAuthority=false}){
  out.push(Object.freeze({id:String(id||`${kind}-${ts}-${out.length}`),ts:num(ts),kind,description:String(description||kind),source:upper(source),in:Math.max(0,num(inflow)),out:Math.max(0,num(outflow)),refId:refId?String(refId):null,fundingAmount:Math.max(0,num(fundingAmount)),fundingTreatment:String(fundingTreatment||''),fundingLabel:String(fundingLabel||''),requiresAuthority:requiresAuthority===true}));
}

export function buildCashFlowRows(input={}){
  const out=[];
  const purchases=rows(input.purchases),purchaseIds=new Set(purchases.map(p=>String(p.id||p.purchaseId||p._key||'')).filter(Boolean));
  const qrisCashOutByTx=new Map(rows(input.qrisCashOut).filter(x=>upper(x.status)==='CONFIRMED'&&x.transactionId).map(x=>[String(x.transactionId),x]));
  for(const p of purchases){
    if(upper(p.status)&&!['COMMITTED','EXPENSE_APPLIED','INVENTORY_APPLIED'].includes(upper(p.status)))continue;
    const id=String(p.id||p.purchaseId||p._key||''),funding=classifyPurchaseFundingV33(p,{bankAuthorityAvailable:input.bankAuthorityAvailable===true});
    pushRow(out,{id:`purchase:${id}`,ts:eventTs(p),kind:'INVENTORY_PURCHASE',description:`Pembelian ${p.itemName||'stok'}`,source:funding.source,outflow:funding.confirmedBusinessAmount,refId:id,fundingAmount:funding.amount,fundingTreatment:funding.treatment,fundingLabel:funding.label,requiresAuthority:funding.requiresAuthority});
  }
  for(const r of rows(input.purchaseReconciliations)){
    if(upper(r.type)!=='PURCHASE_REVERSAL'||upper(r.status)!=='CONFIRMED')continue;
    const purchaseId=String(r.purchaseId||r.refId||''),funding=classifyPurchaseFundingV33({fundSource:r.fundSource||'OTHER',landedCost:r.cashCompensation??r.landedCost},{bankAuthorityAvailable:input.bankAuthorityAvailable===true});
    pushRow(out,{id:`purchase-reversal:${r.operationId||r.id||r._key||purchaseId}`,ts:eventTs(r),kind:'PURCHASE_REVERSAL',description:`Reversal Pembelian ${r.itemName||purchaseId||'stok'}`,source:funding.source,inflow:funding.confirmedBusinessAmount,refId:purchaseId,fundingAmount:funding.amount,fundingTreatment:funding.treatment,fundingLabel:funding.label,requiresAuthority:funding.requiresAuthority});
  }
  for(const e of rows(input.expenses)){
    const linked=String(e.purchaseRef||'');
    if(linked&&purchaseIds.has(linked))continue;
    const c=classifyExpense(e);
    pushRow(out,{id:`expense:${e.id||e._key||''}`,ts:eventTs(e),kind:c.kind,description:e.n||e.desc||e.category||'Pengeluaran',source:e.source||e.fundSource||'CASH',outflow:c.cashFlowOut,refId:linked||null});
  }
  for(const t0 of rows(input.transactions)){
    const t=transactionFinance(t0); if(!t)continue;
    if(t.method==='KASBON'||t.method==='CREDIT')continue;
    const cashOut=qrisCashOutByTx.get(t.id),inflow=cashOut?Math.max(t.netRevenue,num(cashOut.qrisReceived)):t.netRevenue;
    pushRow(out,{id:`sale:${t.id}`,ts:t.ts,kind:cashOut?'SALE_QRIS_CASH_OUT':'SALE',description:`Penjualan ${t.id||''}`.trim(),source:t.method||'CASH',inflow,refId:t.id});
  }
  for(const p of rows(input.debtPayments))pushRow(out,{id:`debt:${p.id||p._key||''}`,ts:eventTs(p),kind:'DEBT_PAYMENT',description:`Pelunasan hutang ${p.nama||''}`.trim(),source:p.method||'CASH',inflow:amountOf(p),refId:p.refId});
  for(const p of rows(input.advancePayments))pushRow(out,{id:`advance-pay:${p.id||p._key||''}`,ts:eventTs(p),kind:'ADVANCE_REPAYMENT',description:`Pengembalian kasbon ${p.nama||''}`.trim(),source:p.method||'CASH',inflow:amountOf(p),refId:p.refId});
  for(const e of rows(input.advanceIssued))pushRow(out,{id:`advance-issue:${e.id||e._key||''}`,ts:eventTs(e),kind:'EMPLOYEE_ADVANCE',description:`Kasbon karyawan ${e.nama||''}`.trim(),source:e.source||'CASH',outflow:amountOf(e),refId:e.refId});
  for(const m of rows(input.cashMovements))pushRow(out,{id:`cash:${m.id||m._key||''}`,ts:eventTs(m),kind:upper(m.type)==='QRIS_CASH_OUT'?'QRIS_CASH_OUT':'CASH_MOVEMENT',description:m.note||'Mutasi kas',source:'CASH',inflow:upper(m.direction)==='IN'?amountOf(m):0,outflow:upper(m.direction)==='OUT'?amountOf(m):0,refId:m.operationId});

  const state=ownerEventState(input.ownerEvents);
  for(const e of state.all){
    const t=upper(e.type),a=amountOf(e),id=eventId(e);
    if(t==='REVERSAL'){
      const target=state.byId.get(String(e.reversalOf||'')),targetType=upper(target?.type),targetAmount=amountOf(target||e),targetIn=targetType==='OPENING_CAPITAL'||targetType==='ADDITIONAL_CAPITAL';
      if(target)pushRow(out,{id:`owner:${id}`,ts:eventTs(e),kind:'REVERSAL',description:`Pembalikan ${targetType}`,source:e.source||target.source||'OWNER',inflow:targetType==='PRIVE'?targetAmount:0,outflow:targetIn?targetAmount:0,refId:e.reversalOf});
      continue;
    }
    const isIn=t==='OPENING_CAPITAL'||t==='ADDITIONAL_CAPITAL';
    if(isIn||t==='PRIVE')pushRow(out,{id:`owner:${id}`,ts:eventTs(e),kind:t,description:t==='PRIVE'?'Prive Owner':t==='OPENING_CAPITAL'?'Modal Awal':'Tambahan Modal',source:e.source||'OWNER',inflow:isIn?a:0,outflow:t==='PRIVE'?a:0,refId:id});
  }
  let running=0;
  return Object.freeze(out.sort((a,b)=>a.ts-b.ts).map(row=>{running+=num(row.in)-num(row.out);return Object.freeze({...row,category:flowCategory(row.kind),date:jakartaDate(row.ts),runningBalance:running})}));
}

export function qrisCashOutSemantics({saleAmount=0,qrisReceived=0}={}){
  const saleRevenue=Math.max(0,num(saleAmount)),qrisInflow=Math.max(0,num(qrisReceived)),cashOut=Math.max(0,qrisInflow-saleRevenue);
  return Object.freeze({saleRevenue,qrisInflow,cashOut,businessExpense:0,refund:0,netLiquidityChange:qrisInflow-cashOut});
}
