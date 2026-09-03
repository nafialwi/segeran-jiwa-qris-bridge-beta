import { buildFinanceReadModel, classifyPurchaseFundingV33 } from './finance-v33-analytics.js';
import { enrichTransactionsCostingV34 } from './costing-v34-evidence.js';

const PERIOD_RE=/^\d{4}-\d{2}$/;
const CANONICAL_SHIFT_RE=/^\d{4}-\d{2}-\d{2}-S[123]$/;
const rows=value=>Array.isArray(value)?value.filter(Boolean):value&&typeof value==='object'?Object.entries(value).filter(([,row])=>row!=null).map(([id,row])=>({...row,_key:row?._key??id})) : [];
const text=v=>String(v??'').trim();
const num=v=>Number.isFinite(Number(v))?Number(v):0;
const validPeriod=value=>{const period=text(value);if(!PERIOD_RE.test(period))throw new Error('INVALID_FINANCE_MONTH');return period};
const jakartaMonth=ts=>{const value=num(ts);if(!value)return'';try{return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit'}).format(new Date(value)).slice(0,7)}catch(_){return''}};
function rowEventMonth(row={}){const direct=num(row.confirmedTs??row.createdTs??row.ts);if(direct)return jakartaMonth(direct);const parsed=Date.parse(row.confirmedAt||row.createdAt||row.at||'');return Number.isFinite(parsed)?jakartaMonth(parsed):''}
function purchaseInPeriod(purchase={},period=''){const shift=text(purchase.shift);if(CANONICAL_SHIFT_RE.test(shift))return shift.slice(0,7)===period;return rowEventMonth(purchase)===period}
function reconciliationInPeriod(row={},period=''){return rowEventMonth(row)===period}

function flattenMonth(shifts={}){
  const transactions=[],expenses=[],debtPayments=[],advancePayments=[],advanceIssued=[],cashMovements=[];
  for(const [shiftKey,shift0] of Object.entries(shifts||{})){
    const shift=shift0||{},withShift=row=>({...row,_shift:shiftKey,shift:row?.shift??shiftKey});
    rows(shift.tx||shift.transactions).forEach(row=>transactions.push(withShift(row)));
    rows(shift.opex||shift.expenses).forEach(row=>expenses.push(withShift(row)));
    rows(shift.piutang_dibayar||shift.debtPayments).forEach(row=>debtPayments.push(withShift(row)));
    rows(shift.kasbon_karyawan_dibayar||shift.advancePayments).forEach(row=>advancePayments.push(withShift(row)));
    rows(shift.kasbon||shift.advanceIssued).forEach(row=>advanceIssued.push(withShift(row)));
    rows(shift.cashMovements).forEach(row=>cashMovements.push(withShift(row)));
  }
  return {transactions,expenses,debtPayments,advancePayments,advanceIssued,cashMovements};
}
function flattenPurchaseReconciliations(value={}){
  const out=[];
  for(const [purchaseId,bucket] of Object.entries(value||{})){
    for(const row of rows(bucket))out.push({...row,purchaseId:text(row.purchaseId||purchaseId)});
  }
  return out;
}
export function canonicalShiftStateV33(shift={}){
  const shiftStatus=text(shift.shiftStatus).toUpperCase(),controlStatus=text(shift.sessionControl?.status).toUpperCase();
  if(shift.locked===true||shiftStatus==='CLOSED'||controlStatus==='CLOSED')return 'CLOSED';
  const sessionId=text(shift.sessionControl?.currentSessionId||shift.currentSessionId);
  if((controlStatus==='ACTIVE'||shiftStatus==='ACTIVE')&&sessionId)return 'ACTIVE';
  return 'NOT_STARTED';
}
export function buildShiftAuditEvidenceV33({shiftKey='',shift=null}={}){
  const key=text(shiftKey),row=shift&&typeof shift==='object'?shift:{},state=canonicalShiftStateV33(row),sessionId=text(row.sessionControl?.currentSessionId||row.currentSessionId),shiftStatus=text(row.shiftStatus).toUpperCase(),controlStatus=text(row.sessionControl?.status).toUpperCase(),locked=row.locked===true,closingSnapshot=!!(row.closingSnapshot&&typeof row.closingSnapshot==='object'),issues=[];
  if(!CANONICAL_SHIFT_RE.test(key))issues.push('SHIFT_KEY_INVALID');
  if(state==='ACTIVE')issues.push('SHIFT_STILL_ACTIVE');
  if(state==='NOT_STARTED'&&(shiftStatus||controlStatus||sessionId||Object.keys(row).length))issues.push('SHIFT_STATUS_INCOMPLETE');
  if(state==='CLOSED'&&!locked&&!closingSnapshot&&controlStatus!=='CLOSED')issues.push('CLOSING_EVIDENCE_INCOMPLETE');
  return Object.freeze({shiftKey:key||null,state,sessionId:sessionId||null,locked,shiftStatus:shiftStatus||null,controlStatus:controlStatus||null,closingSnapshot,actualClosing:row.actualClosing??row.closingSnapshot?.actualClosing??null,issues:Object.freeze(issues)});
}
function canonicalShiftKey(key){return CANONICAL_SHIFT_RE.test(text(key))}

function activeMonthClose(events){
  const all=rows(events),reopened=new Set(all.filter(e=>text(e.type).toUpperCase()==='REOPEN'&&e.reopenOf).map(e=>String(e.reopenOf)));
  return all.filter(e=>text(e.type).toUpperCase()==='CLOSE'&&!reopened.has(String(e.operationId||e.id||e._key||''))).sort((a,b)=>num(b.createdTs)-num(a.createdTs))[0]||null;
}

function amount(row={}){return Math.max(0,num(row.amount??row.a??row.nominal??row.total))}
function cashExpenseTotal(shift={}){return rows(shift.opex||shift.expenses).filter(e=>text(e.source||e.fundSource||'CASH').toUpperCase()==='CASH').reduce((sum,e)=>sum+amount(e),0)}
function movementTotals(shift={}){let incoming=0,outgoing=0;for(const m of rows(shift.cashMovements)){const a=amount(m),direction=text(m.direction).toUpperCase();if(direction==='IN')incoming+=a;else if(direction==='OUT')outgoing+=a}return{incoming,outgoing}}
function transactionCashSales(shift={}){return rows(shift.tx||shift.transactions).filter(t=>{const status=text(t.status).toUpperCase();if(status==='VOIDED'||['PENDING','PROCESSING','INIT','OPEN','WAITING'].includes(status))return false;return text(t.method||t.paymentMethod||t.payment?.method||'CASH').toUpperCase()==='CASH'}).reduce((sum,t)=>sum+Math.max(0,num(t.netRevenue??t.costing?.netRevenue??t.pricing?.grandTotal??t.total??t.grandTotal)),0)}
function availableCashForShift(shift={}){
  const actual=shift.uangLaci??shift.actualClosing??shift.closingCash??shift.closingSnapshot?.actualClosing??shift.closingSnapshot?.actualCash??shift.closingSnapshot?.uangLaci;
  if(actual!==null&&actual!==undefined&&actual!=='')return Object.freeze({available:Math.max(0,num(actual)),source:'Kas penutupan'});
  const opening=num(shift.kasAwal??shift.openingCash),cashSales=shift.tunai!==undefined?num(shift.tunai):transactionCashSales(shift),debtCash=num(shift.piutang_lunas_cash??shift.piutangLunasCash),advancePayCash=num(shift.kasbon_karyawan_lunas_cash??shift.kasbonKaryawanLunasCash),advanceOut=num(shift.kasbon_karyawan_baru_cash??shift.kasbonKaryawanBaruCash),setoran=num(shift.setoran),moves=movementTotals(shift),expenses=cashExpenseTotal(shift);
  return Object.freeze({available:Math.max(0,opening+cashSales+debtCash+advancePayCash+moves.incoming-expenses-advanceOut-setoran-moves.outgoing),source:'Ekspektasi kas shift'});
}
function latestCashPosition(shiftMap={},shiftKeys=[]){const key=shiftKeys.at(-1)||'';if(!key)return Object.freeze({available:null,source:'Belum tersedia',latestShiftKey:null});const x=availableCashForShift(shiftMap[key]||{});return Object.freeze({...x,latestShiftKey:key})}

function sourceFingerprint({period,shiftKeys,input}){
  return JSON.stringify({period,shiftKeys,tx:input.transactions.length,expenses:input.expenses.length,purchases:rows(input.purchases).length,ownerEvents:rows(input.ownerEvents).length,qrisCashOut:rows(input.qrisCashOut).length,purchaseReconciliations:rows(input.purchaseReconciliations).length});
}
function closeSnapshot(loaded,checklist={}){
  const cashRows=loaded.model.cashFlow.rows,cashFlowIn=cashRows.reduce((sum,row)=>sum+num(row.in),0),cashFlowOut=cashRows.reduce((sum,row)=>sum+num(row.out),0);
  return {
    version:1,checklist,
    netSales:loaded.model.profit.netSales,
    hpp:loaded.model.profit.cogsKnown?loaded.model.profit.cogs:null,
    hppKnown:loaded.model.profit.cogsKnown,
    hppCoverage:loaded.model.profit.hppCoverage,
    businessExpenses:loaded.model.profit.businessExpenses,
    inventoryPurchaseCashOut:loaded.model.inventoryPurchases.cashOut,
    cashFlowIn,cashFlowOut,cashFlowNet:cashFlowIn-cashFlowOut,
    modalOpening:loaded.model.ownerCapital.opening,
    modalAdditional:loaded.model.ownerCapital.additional,
    prive:loaded.model.ownerCapital.prive,
    calculatedEnding:loaded.model.ownerCapital.calculatedEnding,
    outstandingDebt:num(loaded.model.outstanding?.customerDebt),outstandingAdvance:num(loaded.model.outstanding?.employeeAdvance),
    shiftCount:loaded.shiftCount,allShiftsClosed:loaded.allShiftsClosed,
    sourceFingerprint:loaded.sourceFingerprint,
    dataThrough:loaded.shiftKeys.at(-1)||loaded.period
  };
}


export function buildLinkRepairDryRunV33({purchase=null,expense=null}={}){
  if(!purchase||typeof purchase!=='object')return Object.freeze({status:'PURCHASE_NOT_FOUND',canRepair:false,target:Object.freeze({shiftKey:null,expenseRef:null}),preview:null});
  const purchaseId=text(purchase.id||purchase.purchaseId||purchase._key),shiftKey=text(purchase.shift),expenseRef=text(purchase.expenseRef),landedCost=Math.max(0,num(purchase.landedCost??purchase.totalLandedCost));
  const preview=Object.freeze({category:'Belanja Bahan',name:`Pembelian ${text(purchase.itemName||purchase.itemId||'Stok')}`,amount:landedCost,source:text(purchase.fundSource||'OTHER').toUpperCase(),purchaseRef:purchaseId,systemLinked:true,supplier:text(purchase.supplier)||null});
  const target=Object.freeze({shiftKey:shiftKey||null,expenseRef:expenseRef||null});
  if(!expense){const canRepair=text(purchase.status).toUpperCase()==='COMMITTED'&&CANONICAL_SHIFT_RE.test(shiftKey)&&!!expenseRef;return Object.freeze({status:'MISSING',canRepair,target,preview,current:null})}
  const currentAmount=Math.max(0,num(expense.amount??expense.a)),valid=text(expense.purchaseRef)===purchaseId&&currentAmount===landedCost&&expense.systemLinked===true;
  return Object.freeze({status:valid?'ALREADY_VALID':'OCCUPIED_MISMATCH',canRepair:false,target,preview,current:Object.freeze({...expense})});
}

function downstreamClassificationV33(movement={}){
  const type=text(movement.type).toUpperCase(),delta=num(movement.delta);
  if(type==='TRANSFER_IN'||type==='TRANSFER_OUT')return 'TRANSFER';
  if(type==='OPNAME'||type.includes('ADJUST'))return 'ADJUSTMENT_AMBIGUOUS';
  if(delta<0)return 'CONSUMPTION';
  if(type==='PURCHASE')return 'INBOUND';
  return 'AMBIGUOUS';
}
export function buildDownstreamInventoryEvidenceV33({purchase=null,inventory=null}={}){
  if(!purchase||typeof purchase!=='object')return Object.freeze({purchaseQty:0,landedCost:0,currentWarehouse:0,currentOutlet:0,currentTotal:0,currentWac:0,movements:Object.freeze([]),consumptiveQty:0,ambiguousCount:0});
  const itemId=text(purchase.itemId),purchaseId=text(purchase.id||purchase.purchaseId||purchase._key),purchaseTs=num(purchase.createdTs),movementRef=text(purchase.movementRef),inv=inventory&&typeof inventory==='object'?inventory:{};
  const movementRows=rows(inv.movements).filter(m=>text(m.itemId)===itemId&&num(m.ts)>purchaseTs&&text(m.id||m._key)!==movementRef).sort((a,b)=>num(a.ts)-num(b.ts));
  const evidenceRows=movementRows.map(m=>Object.freeze({id:text(m.id||m._key),type:text(m.type).toUpperCase()||'UNKNOWN',delta:num(m.delta),location:text(m.location)||null,ts:num(m.ts),classification:downstreamClassificationV33(m),purchaseId:text(m.purchaseId)||null,reconciliationId:text(m.reconciliationId)||null}));
  const consumptiveQty=evidenceRows.filter(m=>m.classification==='CONSUMPTION'&&m.delta<0).reduce((sum,m)=>sum+Math.abs(m.delta),0),ambiguousCount=evidenceRows.filter(m=>m.classification==='ADJUSTMENT_AMBIGUOUS'||m.classification==='AMBIGUOUS').length;
  const kind=text(purchase.itemType).toLowerCase()==='ingredient'?'ingredients':'products',balance=inv.balances?.[kind]?.[itemId]||{},cost=inv.costs?.[kind]?.[itemId]||{};
  const warehouse=Math.max(0,num(balance.warehouse)),outlet=Math.max(0,num(balance.outlet));
  return Object.freeze({purchaseId,itemId,purchaseQty:Math.max(0,num(purchase.qtyReceived)),unit:text(purchase.unit||'unit'),landedCost:Math.max(0,num(purchase.landedCost??purchase.totalLandedCost)),stockBefore:Object.prototype.hasOwnProperty.call(purchase,'stockBefore')?num(purchase.stockBefore):null,stockAfter:Object.prototype.hasOwnProperty.call(purchase,'stockAfter')?num(purchase.stockAfter):null,oldWac:Object.prototype.hasOwnProperty.call(purchase,'oldWac')?num(purchase.oldWac):null,newWac:Object.prototype.hasOwnProperty.call(purchase,'newWac')?num(purchase.newWac):null,currentWarehouse:warehouse,currentOutlet:outlet,currentTotal:warehouse+outlet,currentWac:Math.max(0,num(cost.wac)),movements:Object.freeze(evidenceRows),consumptiveQty,ambiguousCount});
}


export function buildWacCostReviewV33({purchase=null,downstreamInventory=null}={}){
  if(!purchase||typeof purchase!=='object')return Object.freeze({status:'UNKNOWN',autoRewriteAllowed:false,oldWac:null,purchaseWac:null,currentWac:null,reasonCodes:Object.freeze(['PURCHASE_AUDIT_NOT_FOUND'])});
  const downstream=downstreamInventory&&typeof downstreamInventory==='object'?downstreamInventory:{},hasOld=Object.prototype.hasOwnProperty.call(purchase,'oldWac'),hasNew=Object.prototype.hasOwnProperty.call(purchase,'newWac'),oldWac=hasOld?Math.max(0,num(purchase.oldWac)):null,purchaseWac=hasNew?Math.max(0,num(purchase.newWac)):null,currentWac=Object.prototype.hasOwnProperty.call(downstream,'currentWac')?Math.max(0,num(downstream.currentWac)):null,reasonCodes=[];
  if(oldWac!=null&&purchaseWac!=null&&Math.abs(purchaseWac-oldWac)>0.000001)reasonCodes.push('WAC_CHANGED_BY_PURCHASE');
  if(num(downstream.ambiguousCount)>0)reasonCodes.push('DOWNSTREAM_OPNAME_OR_ADJUSTMENT');
  if(num(downstream.consumptiveQty)>0)reasonCodes.push('DOWNSTREAM_CONSUMPTION_PRESENT');
  const reviewRequired=reasonCodes.length>0;
  if(reviewRequired)reasonCodes.push('AUTO_WAC_REWRITE_FORBIDDEN');
  return Object.freeze({status:reviewRequired?'REVIEW_REQUIRED':'NO_REVIEW_REQUIRED',autoRewriteAllowed:false,oldWac,purchaseWac,currentWac,purchaseAmount:Math.max(0,num(purchase.landedCost??purchase.totalLandedCost)),purchaseQty:Math.max(0,num(purchase.qtyReceived)),unit:text(purchase.unit||'unit'),consumptiveQty:Math.max(0,num(downstream.consumptiveQty)),ambiguousCount:Math.max(0,num(downstream.ambiguousCount)),reasonCodes:Object.freeze(reasonCodes)});
}

export function buildControlledResolutionPlanV33({audit=null}={}){
  const row=audit&&typeof audit==='object'?audit:{},safeActions=[],blockedActions=[],reviewActions=[];
  if(row.linkRepairDryRun?.canRepair===true&&row.reconciliation?.linkRepair?.eligible===true)safeActions.push('LINK_REPAIR');
  if(row.historicalShiftResolution?.eligible===true&&row.historicalShiftResolution?.resolved!==true)safeActions.push('HISTORICAL_SHIFT_ACK');
  if(row.reconciliation?.reversal?.eligible===true)safeActions.push('PURCHASE_REVERSAL');else blockedActions.push('PURCHASE_REVERSAL');
  if(row.wacCostReview?.status==='REVIEW_REQUIRED')reviewActions.push('WAC_COST_REVIEW');
  if(row.funding?.requiresAuthority===true)reviewActions.push('FUNDING_AUTHORITY_REVIEW');
  return Object.freeze({safeActions:Object.freeze(safeActions),blockedActions:Object.freeze(blockedActions),reviewActions:Object.freeze(reviewActions),productionWriteApproved:false,requiresOwnerReauth:safeActions.length>0,historyPolicy:'APPEND_ONLY_NO_DELETE'});
}

export function buildHistoricalShiftResolutionV33({purchase=null,shiftAudit=null,reconciliations=[]}={}){
  const blockers=[];
  if(!purchase||typeof purchase!=='object')return Object.freeze({eligible:false,resolved:false,blockers:Object.freeze(['PURCHASE_AUDIT_NOT_FOUND']),shiftKey:null,issueCodes:Object.freeze([])});
  const shiftKey=text(purchase.shift),status=text(purchase.status).toUpperCase(),audit=shiftAudit&&typeof shiftAudit==='object'?shiftAudit:{},state=text(audit.state).toUpperCase(),issues=rows(audit.issues).length?rows(audit.issues).map(x=>text(x)):Array.isArray(audit.issues)?audit.issues.map(text):[];
  if(status!=='COMMITTED')blockers.push('PURCHASE_NOT_COMMITTED');
  if(!CANONICAL_SHIFT_RE.test(shiftKey))blockers.push('PURCHASE_SHIFT_INVALID');
  if(state==='ACTIVE')blockers.push('SHIFT_STILL_ACTIVE');
  const eligibleIssue=state==='NOT_STARTED'||issues.includes('SHIFT_STATUS_INCOMPLETE')||issues.includes('CLOSING_EVIDENCE_INCOMPLETE');
  if(!eligibleIssue&&state!=='ACTIVE')blockers.push('HISTORICAL_SHIFT_ACK_NOT_REQUIRED');
  const existing=rows(reconciliations).find(r=>text(r.type).toUpperCase()==='HISTORICAL_SHIFT_ACK'&&text(r.status).toUpperCase()==='CONFIRMED'&&text(r.shiftKey||shiftKey)===shiftKey);
  if(existing)blockers.push('HISTORICAL_SHIFT_ALREADY_ACKNOWLEDGED');
  return Object.freeze({eligible:blockers.length===0,resolved:!!existing,blockers:Object.freeze(blockers),shiftKey:shiftKey||null,state:state||null,issueCodes:Object.freeze(issues),acknowledgement:existing?Object.freeze(existing):null});
}

export function buildPurchaseReconciliationPlanV33({purchase=null,expense=null,inventory=null,reconciliations=[]}={}){
  const blockersLink=[],blockersReverse=[];
  if(!purchase||typeof purchase!=='object')return Object.freeze({linkRepair:Object.freeze({eligible:false,blockers:Object.freeze(['PURCHASE_AUDIT_NOT_FOUND'])}),reversal:Object.freeze({eligible:false,blockers:Object.freeze(['PURCHASE_AUDIT_NOT_FOUND']),cashCompensation:0})});
  const purchaseId=text(purchase.id||purchase.purchaseId||purchase._key),status=text(purchase.status).toUpperCase(),itemType=text(purchase.itemType).toLowerCase(),itemId=text(purchase.itemId),expenseRef=text(purchase.expenseRef),shiftKey=text(purchase.shift),qty=Math.max(0,num(purchase.qtyReceived)),landedCost=Math.max(0,num(purchase.landedCost??purchase.totalLandedCost));
  if(status!=='COMMITTED'){blockersLink.push('PURCHASE_NOT_COMMITTED');blockersReverse.push('PURCHASE_NOT_COMMITTED')}
  if(!expenseRef)blockersLink.push('PURCHASE_EXPENSE_REF_MISSING');
  if(!CANONICAL_SHIFT_RE.test(shiftKey))blockersLink.push('PURCHASE_SHIFT_INVALID');
  if(expense){if(text(expense.purchaseRef)===purchaseId)blockersLink.push('EXPENSE_LINK_ALREADY_VALID');else blockersLink.push('EXPENSE_REF_OCCUPIED')}
  const reconciled=rows(reconciliations).some(r=>text(r.type).toUpperCase()==='PURCHASE_REVERSAL'&&text(r.status).toUpperCase()==='CONFIRMED');
  if(reconciled)blockersReverse.push('PURCHASE_ALREADY_REVERSED');
  if(!itemId||!qty||!landedCost)blockersReverse.push('PURCHASE_REVERSAL_EVIDENCE_INCOMPLETE');
  if(itemType!=='ingredient')blockersReverse.push('PRODUCT_REVERSAL_REQUIRES_MANUAL_RECONCILIATION');
  const inv=inventory&&typeof inventory==='object'?inventory:{},movementRows=rows(inv.movements),purchaseTs=num(purchase.createdTs),movementRef=text(purchase.movementRef);
  const downstream=movementRows.filter(m=>text(m.itemId)===itemId&&num(m.ts)>purchaseTs&&text(m.id||m._key)!==movementRef&&text(m.purchaseId)!==purchaseId);
  const safeTypes=new Set(['PURCHASE','TRANSFER_OUT','TRANSFER_IN']);
  for(const movement of downstream){const type=text(movement.type).toUpperCase(),delta=num(movement.delta);if(type==='OPNAME'){if(!blockersReverse.includes('DOWNSTREAM_INVENTORY_AMBIGUOUS'))blockersReverse.push('DOWNSTREAM_INVENTORY_AMBIGUOUS');continue}if(!safeTypes.has(type)){const code=delta<0?'DOWNSTREAM_CONSUMPTION_DETECTED':'DOWNSTREAM_INVENTORY_AMBIGUOUS';if(!blockersReverse.includes(code))blockersReverse.push(code)}}
  const balance=inv.balances?.ingredients?.[itemId]||{},warehouse=Math.max(0,num(balance.warehouse)),outlet=Math.max(0,num(balance.outlet)),currentTotal=warehouse+outlet,currentWac=Math.max(0,num(inv.costs?.ingredients?.[itemId]?.wac));
  const correctedWarehouse=warehouse-qty,correctedTotal=currentTotal-qty,correctedValue=currentTotal*currentWac-landedCost;
  if(itemType==='ingredient'&&warehouse<qty)blockersReverse.push('PURCHASE_REVERSAL_STOCK_LOW');
  if(itemType==='ingredient'&&correctedValue<-0.000001)blockersReverse.push('PURCHASE_RECONCILIATION_VALUE_CONFLICT');
  const correctedWac=correctedTotal>0?Math.max(0,correctedValue/correctedTotal):Math.max(0,num(purchase.oldWac));
  return Object.freeze({
    linkRepair:Object.freeze({eligible:blockersLink.length===0,blockers:Object.freeze(blockersLink),expenseRef,shiftKey}),
    reversal:Object.freeze({eligible:blockersReverse.length===0,blockers:Object.freeze(blockersReverse),cashCompensation:landedCost,qty,currentWarehouse:warehouse,currentOutlet:outlet,currentTotal,currentWac,correctedWarehouse:Math.max(0,correctedWarehouse),correctedTotal:Math.max(0,correctedTotal),correctedWac,downstreamCount:downstream.length})
  });
}

export function buildPurchaseAuditEvidenceV33({purchase=null,expense=null,movement=null}={}){
  if(!purchase||typeof purchase!=='object')throw new Error('PURCHASE_AUDIT_NOT_FOUND');
  const purchaseId=text(purchase.id||purchase.purchaseId||purchase._key);if(!purchaseId)throw new Error('PURCHASE_AUDIT_ID_REQUIRED');
  const expenseRef=text(purchase.expenseRef),movementRef=text(purchase.movementRef),shiftKey=text(purchase.shift);
  const expenseId=text(expense?.id||expense?._key),movementId=text(movement?.id||movement?._key);
  const expenseVerified=!!expense&&text(expense.purchaseRef)===purchaseId&&(!expenseRef||expenseId===expenseRef);
  const movementVerified=!!movement&&text(movement.purchaseId||movement.purchaseRef)===purchaseId&&(!movementRef||movementId===movementRef);
  const stockKnown=Object.prototype.hasOwnProperty.call(purchase,'stockBefore')&&Object.prototype.hasOwnProperty.call(purchase,'stockAfter');
  const wacKnown=Object.prototype.hasOwnProperty.call(purchase,'oldWac')&&Object.prototype.hasOwnProperty.call(purchase,'newWac');
  const fundingKnown=!!text(purchase.fundSource),warnings=[];
  if(expenseRef&&!expenseVerified)warnings.push('Linked expense tidak ditemukan atau tidak cocok dengan Purchase ID.');
  if(movementRef&&!movementVerified)warnings.push('Linked inventory movement tidak ditemukan atau tidak cocok dengan Purchase ID.');
  if(!stockKnown)warnings.push('Evidence stok sebelum/sesudah belum lengkap.');
  if(!wacKnown)warnings.push('Evidence WAC sebelum/sesudah belum lengkap.');
  if(!fundingKnown)warnings.push('Sumber dana pembelian belum tercatat.');
  const landedCost=Math.max(0,num(purchase.landedCost??purchase.totalLandedCost)),funding=classifyPurchaseFundingV33(purchase);
  return Object.freeze({
    purchaseId,status:text(purchase.status||'UNKNOWN').toUpperCase(),itemType:text(purchase.itemType),itemId:text(purchase.itemId),itemName:text(purchase.itemName||purchase.itemId||'Stok'),
    qtyReceived:num(purchase.qtyReceived),unit:text(purchase.unit||'unit'),landedCost,fundSource:text(purchase.fundSource||'UNKNOWN').toUpperCase(),supplier:text(purchase.supplier),note:text(purchase.note),shiftKey,
    expenseRef:expenseRef||null,movementRef:movementRef||null,createdAt:text(purchase.createdAt),createdTs:num(purchase.createdTs),
    stockBefore:stockKnown?num(purchase.stockBefore):null,stockAfter:stockKnown?num(purchase.stockAfter):null,oldWac:wacKnown?num(purchase.oldWac):null,newWac:wacKnown?num(purchase.newWac):null,
    cashOut:funding.confirmedBusinessAmount,businessExpense:0,funding,correctionPolicy:'AUDIT_FIRST_NO_DELETE',
    evidence:Object.freeze({purchase:'verified',expense:expenseRef?(expenseVerified?'verified':'missing'):'notApplicable',movement:movementRef?(movementVerified?'verified':'missing'):'notApplicable',stock:stockKnown?'verified':'missing',wac:wacKnown?'verified':'missing',funding:fundingKnown?'verified':'missing'}),
    warnings:Object.freeze(warnings)
  });
}

export function createFinanceV33Service({repository,writer,reconciliationWriter=null,openExpense=()=>{}}={}){
  if(!repository)throw new Error('FINANCE_REPOSITORY_REQUIRED');
  if(!writer)throw new Error('FINANCE_WRITER_REQUIRED');
  async function loadMonth(periodValue){
    const period=validPeriod(periodValue);
    const [shifts,purchases,refunds,customerDebts,employeeAdvances,qrisSignals,qrisEvents,ownerEvents,monthCloseEvents,qrisCashOut,purchaseReconciliationMap,costingReservationMap]=await Promise.all([
      repository.readMonthShifts(period),repository.readInventoryPurchases(),repository.readRefunds(),repository.readCustomerDebts(),repository.readEmployeeAdvances(),repository.readQrisSignals(),repository.readQrisEvents(),repository.readOwnerEvents(period),repository.readMonthCloseEvents(period),repository.readQrisCashOut(),typeof repository.readPurchaseReconciliations==='function'?repository.readPurchaseReconciliations():Promise.resolve({}),typeof repository.readCostingReservations==='function'?repository.readCostingReservations():Promise.resolve({})
    ]);
    const shiftMap=shifts||{},shiftKeys=Object.keys(shiftMap).filter(canonicalShiftKey).sort(),canonicalShiftMap=Object.fromEntries(shiftKeys.map(key=>[key,shiftMap[key]||{}])),flat=flattenMonth(canonicalShiftMap),periodPurchases=rows(purchases).filter(row=>purchaseInPeriod(row,period)),allPurchaseReconciliations=flattenPurchaseReconciliations(purchaseReconciliationMap),purchaseReconciliations=allPurchaseReconciliations.filter(row=>reconciliationInPeriod(row,period));
    const periodCostingReservations=rows(costingReservationMap).filter(row=>{const shift=text(row.shift);return canonicalShiftKey(shift)?shift.slice(0,7)===period:rowEventMonth(row)===period});
    const transactions=enrichTransactionsCostingV34(flat.transactions,{reservations:periodCostingReservations,refunds:rows(refunds)});
    const input={...flat,transactions,purchases:periodPurchases,refunds,customerDebts,employeeAdvances,qrisSignals,qrisEvents,ownerEvents,monthCloseEvents,qrisCashOut,purchaseReconciliations,costingReservations:periodCostingReservations};
    const baseModel=buildFinanceReadModel(input),cashPosition=latestCashPosition(canonicalShiftMap,shiftKeys),model=Object.freeze({...baseModel,cashPosition}),shiftCount=shiftKeys.length;
    const acknowledgedShiftKeys=new Set(allPurchaseReconciliations.filter(row=>text(row.type).toUpperCase()==='HISTORICAL_SHIFT_ACK'&&text(row.status).toUpperCase()==='CONFIRMED'&&canonicalShiftKey(row.shiftKey)).map(row=>text(row.shiftKey)));
    const openShiftKeys=shiftKeys.filter(key=>canonicalShiftStateV33(canonicalShiftMap[key])==='ACTIVE'),historicalResolvedShiftKeys=shiftKeys.filter(key=>canonicalShiftStateV33(canonicalShiftMap[key])!=='ACTIVE'&&canonicalShiftStateV33(canonicalShiftMap[key])!=='CLOSED'&&acknowledgedShiftKeys.has(key)),incompleteShiftKeys=shiftKeys.filter(key=>{const state=canonicalShiftStateV33(canonicalShiftMap[key]);return state!=='ACTIVE'&&state!=='CLOSED'&&!acknowledgedShiftKeys.has(key)}),allShiftsClosed=shiftCount>0&&shiftKeys.every(key=>{const state=canonicalShiftStateV33(canonicalShiftMap[key]);return state==='CLOSED'||(state!=='ACTIVE'&&acknowledgedShiftKeys.has(key))});
    const loaded={period,shiftMap:canonicalShiftMap,shiftKeys,shiftCount,openShiftKeys:Object.freeze(openShiftKeys),incompleteShiftKeys:Object.freeze(incompleteShiftKeys),historicalResolvedShiftKeys:Object.freeze(historicalResolvedShiftKeys),allShiftsClosed,input,model,monthCloseEvents,activeClose:activeMonthClose(monthCloseEvents)};
    loaded.sourceFingerprint=sourceFingerprint(loaded);
    return Object.freeze(loaded);
  }
  async function loadPurchaseAudit(purchaseIdValue){
    const purchaseId=text(purchaseIdValue);if(!purchaseId||purchaseId.includes('/'))throw new Error('PURCHASE_AUDIT_ID_REQUIRED');
    if(typeof repository.readInventoryPurchase!=='function')throw new Error('PURCHASE_AUDIT_REPOSITORY_REQUIRED');
    const purchase=await repository.readInventoryPurchase(purchaseId);if(!purchase)throw new Error('PURCHASE_AUDIT_NOT_FOUND');
    const movementRef=text(purchase.movementRef),expenseRef=text(purchase.expenseRef),shiftKey=text(purchase.shift);
    const [inventory,expense,shift]=await Promise.all([
      typeof repository.readInventoryV2==='function'?repository.readInventoryV2():Promise.resolve(null),
      expenseRef&&shiftKey&&typeof repository.readShiftExpense==='function'?repository.readShiftExpense(shiftKey,expenseRef):Promise.resolve(null),
      shiftKey&&typeof repository.readShift==='function'?repository.readShift(shiftKey):Promise.resolve(null)
    ]);
    const movement=movementRef?(inventory?.movements?.[movementRef]??(typeof repository.readInventoryMovement==='function'?await repository.readInventoryMovement(movementRef):null)):null;
    const reconciliationRows=rows(inventory?.purchaseReconciliations?.[purchaseId]);
    const base=buildPurchaseAuditEvidenceV33({purchase,expense,movement}),plan=buildPurchaseReconciliationPlanV33({purchase,expense,inventory,reconciliations:reconciliationRows}),shiftAudit=buildShiftAuditEvidenceV33({shiftKey,shift}),linkRepairDryRun=buildLinkRepairDryRunV33({purchase,expense}),downstreamInventory=buildDownstreamInventoryEvidenceV33({purchase,inventory}),historicalShiftResolution=buildHistoricalShiftResolutionV33({purchase,shiftAudit,reconciliations:reconciliationRows}),wacCostReview=buildWacCostReviewV33({purchase,downstreamInventory}),funding=classifyPurchaseFundingV33(purchase);
    const audit=Object.freeze({...base,funding,reconciliation:Object.freeze({...plan,events:Object.freeze(reconciliationRows)}),shiftAudit,linkRepairDryRun,downstreamInventory,historicalShiftResolution,wacCostReview});
    return Object.freeze({...audit,resolutionPlan:buildControlledResolutionPlanV33({audit})});
  }
  return Object.freeze({
    loadMonth,loadPurchaseAudit,
    postOwnerEvent:input=>writer.postOwnerEvent(input),
    reverseOwnerEvent:input=>writer.reverseOwnerEvent(input),
    repairPurchaseLink:input=>{if(!reconciliationWriter?.repairExpenseLink)throw new Error('PURCHASE_RECONCILIATION_WRITER_REQUIRED');return reconciliationWriter.repairExpenseLink(input)},
    acknowledgeHistoricalShift:input=>{if(!reconciliationWriter?.acknowledgeHistoricalShift)throw new Error('PURCHASE_RECONCILIATION_WRITER_REQUIRED');return reconciliationWriter.acknowledgeHistoricalShift(input)},
    reversePurchase:input=>{if(!reconciliationWriter?.reversePurchase)throw new Error('PURCHASE_RECONCILIATION_WRITER_REQUIRED');return reconciliationWriter.reversePurchase(input)},
    async closeMonth(input={}){const loaded=await loadMonth(input.period);return writer.closeMonth({...input,snapshot:closeSnapshot(loaded,input.checklist||{})})},
    reopenMonth:input=>writer.reopenMonth(input),
    openExpense:()=>openExpense()
  });
}
