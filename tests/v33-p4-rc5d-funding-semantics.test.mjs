import test from 'node:test';
import assert from 'node:assert/strict';
import * as analytics from '../src/domain/finance-v33-analytics.js';
import * as service from '../src/domain/finance-v33-service.js';
import { renderFinanceWorkspaceV33, renderPurchaseAuditV33 } from '../src/ui/finance-v33-workspace.js';

const TEH={id:'PTEH',purchaseId:'PTEH',status:'COMMITTED',itemType:'ingredient',itemId:'ING_TEA',itemName:'TEH',qtyReceived:1000,unit:'g',landedCost:25000,fundSource:'OWNER',supplier:'Supplier uji',shift:'2026-08-29-S1',expenseRef:'E-TEH',movementRef:'M-TEH',stockBefore:1700,stockAfter:2700,oldWac:20,newWac:22,createdTs:Date.parse('2026-08-29T19:15:00+07:00')};
const downstream={purchaseId:'PTEH',itemId:'ING_TEA',purchaseQty:1000,unit:'g',landedCost:25000,stockBefore:1700,stockAfter:2700,oldWac:20,newWac:22,currentWarehouse:45500,currentOutlet:4500,currentTotal:50000,currentWac:22,consumptiveQty:700,ambiguousCount:1,movements:[
  {id:'S1',type:'SALE_RECIPE',classification:'CONSUMPTION',delta:-100,location:'outlet',ts:TEH.createdTs+1000},
  {id:'O1',type:'OPNAME',classification:'ADJUSTMENT_AMBIGUOUS',delta:48000,location:'warehouse',ts:TEH.createdTs+2000},
  {id:'T1',type:'TRANSFER_OUT',classification:'TRANSFER',delta:-4500,location:'warehouse',ts:TEH.createdTs+3000}
]};

function baseInput(overrides={}){return {transactions:[],expenses:[],purchases:[],purchaseReconciliations:[],ownerEvents:[],refunds:[],customerDebts:[],employeeAdvances:[],qrisCashOut:[],debtPayments:[],advancePayments:[],advanceIssued:[],cashMovements:[],...overrides}}

test('RC5-D purchase funding classifier separates CASH OWNER BANK and OTHER from business cash semantics',()=>{
  assert.equal(typeof analytics.classifyPurchaseFundingV33,'function');
  const cash=analytics.classifyPurchaseFundingV33({...TEH,fundSource:'CASH'});
  assert.equal(cash.treatment,'BUSINESS_CASH');assert.equal(cash.confirmedBusinessAmount,25000);assert.equal(cash.ownerFunded,0);
  const owner=analytics.classifyPurchaseFundingV33(TEH);
  assert.equal(owner.treatment,'OWNER_DIRECT');assert.equal(owner.confirmedBusinessAmount,0);assert.equal(owner.ownerFunded,25000);assert.equal(owner.requiresAuthority,false);
  const bank=analytics.classifyPurchaseFundingV33({...TEH,fundSource:'BANK'});
  assert.equal(bank.treatment,'BANK_UNVERIFIED');assert.equal(bank.confirmedBusinessAmount,0);assert.equal(bank.bankUnverified,25000);assert.equal(bank.requiresAuthority,true);
  const other=analytics.classifyPurchaseFundingV33({...TEH,fundSource:'OTHER'});
  assert.equal(other.treatment,'OTHER_UNRESOLVED');assert.equal(other.confirmedBusinessAmount,0);assert.equal(other.otherUnresolved,25000);assert.equal(other.requiresAuthority,true);
});

test('RC5-D OWNER-funded TEH remains visible but does not reduce business cash-flow totals or running balance',()=>{
  const model=analytics.buildFinanceReadModel(baseInput({purchases:[TEH]}));
  assert.equal(model.cashFlow.rows.length,1);
  const row=model.cashFlow.rows[0];
  assert.equal(row.kind,'INVENTORY_PURCHASE');assert.equal(row.source,'OWNER');assert.equal(row.out,0);assert.equal(row.in,0);assert.equal(row.fundingAmount,25000);assert.equal(row.fundingTreatment,'OWNER_DIRECT');assert.equal(row.runningBalance,0);
  assert.equal(model.cashFlow.totalOut,0);assert.equal(model.cashFlow.netChange,0);
  assert.equal(model.inventoryPurchases.cashOut,0);
  assert.equal(model.inventoryPurchases.ownerFunded,25000);
  assert.equal(model.inventoryPurchases.grossPurchases,25000);
});

test('RC5-D CASH purchase is confirmed business outflow while BANK/OTHER without authority remain review-only',()=>{
  const cash={...TEH,id:'PC',purchaseId:'PC',fundSource:'CASH',landedCost:10000,createdTs:TEH.createdTs+1};
  const bank={...TEH,id:'PB',purchaseId:'PB',fundSource:'BANK',landedCost:20000,createdTs:TEH.createdTs+2};
  const other={...TEH,id:'PO',purchaseId:'PO',fundSource:'OTHER',landedCost:30000,createdTs:TEH.createdTs+3};
  const model=analytics.buildFinanceReadModel(baseInput({purchases:[cash,bank,other]}));
  assert.equal(model.cashFlow.totalOut,10000);
  assert.equal(model.inventoryPurchases.cashOut,10000);
  assert.equal(model.inventoryPurchases.bankUnverified,20000);
  assert.equal(model.inventoryPurchases.otherUnresolved,30000);
  assert.equal(model.inventoryPurchases.requiresFundingReview,true);
  assert.equal(model.cashFlow.rows.find(x=>x.refId==='PB').out,0);
  assert.equal(model.cashFlow.rows.find(x=>x.refId==='PO').out,0);
});

test('RC5-D purchase reversal compensation follows original funding source and never creates fake business inflow for OWNER',()=>{
  const rows=analytics.buildCashFlowRows(baseInput({purchaseReconciliations:[{operationId:'R1',purchaseId:'PTEH',type:'PURCHASE_REVERSAL',status:'CONFIRMED',itemName:'TEH',cashCompensation:25000,fundSource:'OWNER',createdTs:TEH.createdTs+5000}]}));
  const row=rows.find(x=>x.kind==='PURCHASE_REVERSAL');
  assert.ok(row);assert.equal(row.in,0);assert.equal(row.out,0);assert.equal(row.fundingAmount,25000);assert.equal(row.fundingTreatment,'OWNER_DIRECT');assert.equal(row.runningBalance,0);
});

test('RC5-D WAC cost review for TEH requires manual review and explicitly forbids automatic WAC rewrite',()=>{
  assert.equal(typeof service.buildWacCostReviewV33,'function');
  const review=service.buildWacCostReviewV33({purchase:TEH,downstreamInventory:downstream});
  assert.equal(review.status,'REVIEW_REQUIRED');assert.equal(review.autoRewriteAllowed,false);
  assert.equal(review.oldWac,20);assert.equal(review.purchaseWac,22);assert.equal(review.currentWac,22);
  assert.ok(review.reasonCodes.includes('WAC_CHANGED_BY_PURCHASE'));
  assert.ok(review.reasonCodes.includes('DOWNSTREAM_OPNAME_OR_ADJUSTMENT'));
  assert.ok(review.reasonCodes.includes('DOWNSTREAM_CONSUMPTION_PRESENT'));
  assert.ok(review.reasonCodes.includes('AUTO_WAC_REWRITE_FORBIDDEN'));
});

test('RC5-D controlled resolution plan exposes safe candidates and keeps purchase reversal blocked',()=>{
  assert.equal(typeof service.buildControlledResolutionPlanV33,'function');
  const audit={fundSource:'OWNER',landedCost:25000,linkRepairDryRun:{status:'MISSING',canRepair:true},reconciliation:{linkRepair:{eligible:true,blockers:[]},reversal:{eligible:false,blockers:['DOWNSTREAM_CONSUMPTION_DETECTED','DOWNSTREAM_INVENTORY_AMBIGUOUS']}},historicalShiftResolution:{eligible:true,resolved:false,blockers:[]},wacCostReview:{status:'REVIEW_REQUIRED',autoRewriteAllowed:false}};
  const plan=service.buildControlledResolutionPlanV33({audit});
  assert.deepEqual(plan.safeActions,['LINK_REPAIR','HISTORICAL_SHIFT_ACK']);
  assert.ok(plan.blockedActions.includes('PURCHASE_REVERSAL'));
  assert.ok(plan.reviewActions.includes('WAC_COST_REVIEW'));
  assert.equal(plan.productionWriteApproved,false);
});

test('RC5-D purchase audit service adds funding treatment, WAC review, and controlled resolution without writer changes',async()=>{
  const inv={balances:{ingredients:{ING_TEA:{warehouse:45500,outlet:4500}}},costs:{ingredients:{ING_TEA:{wac:22}}},movements:{
    'M-TEH':{id:'M-TEH',purchaseId:'PTEH',itemId:'ING_TEA',type:'PURCHASE',delta:1000,ts:TEH.createdTs},
    S1:{id:'S1',itemId:'ING_TEA',type:'SALE_RECIPE',delta:-700,location:'outlet',ts:TEH.createdTs+1000},
    O1:{id:'O1',itemId:'ING_TEA',type:'OPNAME',delta:48000,location:'warehouse',ts:TEH.createdTs+2000}
  },purchaseReconciliations:{PTEH:{}}};
  const repo={async readInventoryPurchase(){return TEH},async readInventoryV2(){return inv},async readShiftExpense(){return null},async readShift(){return {inventoryMarker:{legacy:true}}}};
  const finance=service.createFinanceV33Service({repository:repo,writer:{postOwnerEvent(){},reverseOwnerEvent(){},closeMonth(){},reopenMonth(){}}});
  const audit=await finance.loadPurchaseAudit('PTEH');
  assert.equal(audit.funding.treatment,'OWNER_DIRECT');assert.equal(audit.funding.confirmedBusinessAmount,0);
  assert.equal(audit.wacCostReview.status,'REVIEW_REQUIRED');assert.equal(audit.wacCostReview.autoRewriteAllowed,false);
  assert.ok(audit.resolutionPlan.safeActions.includes('LINK_REPAIR'));
  assert.ok(audit.resolutionPlan.safeActions.includes('HISTORICAL_SHIFT_ACK'));
  assert.ok(audit.resolutionPlan.blockedActions.includes('PURCHASE_REVERSAL'));
});

test('RC5-D UI shows OWNER funding as non-business cash, WAC cost review, and controlled resolution in LOCAL QA',()=>{
  const audit={purchaseId:'PTEH',status:'COMMITTED',itemName:'TEH',fundSource:'OWNER',landedCost:25000,shiftKey:'2026-08-29-S1',expenseRef:'E-TEH',movementRef:'M-TEH',evidence:{stock:'verified',wac:'verified',expense:'missing',movement:'verified'},warnings:['Linked expense tidak ditemukan atau tidak cocok dengan Purchase ID.'],linkRepairDryRun:{status:'MISSING',canRepair:true,target:{shiftKey:'2026-08-29-S1',expenseRef:'E-TEH'},preview:{category:'Belanja Bahan',name:'Pembelian TEH',amount:25000,source:'OWNER',supplier:'Supplier uji',purchaseRef:'PTEH',systemLinked:true}},downstreamInventory:downstream,reconciliation:{linkRepair:{eligible:true,blockers:[]},reversal:{eligible:false,blockers:['DOWNSTREAM_CONSUMPTION_DETECTED','DOWNSTREAM_INVENTORY_AMBIGUOUS']},events:[]},shiftAudit:{shiftKey:'2026-08-29-S1',state:'NOT_STARTED',sessionId:null,locked:false,closingSnapshot:false,issues:['SHIFT_STATUS_INCOMPLETE']},historicalShiftResolution:{eligible:true,resolved:false,blockers:[]},funding:{treatment:'OWNER_DIRECT',source:'OWNER',amount:25000,confirmedBusinessAmount:0,ownerFunded:25000,requiresAuthority:false},wacCostReview:{status:'REVIEW_REQUIRED',autoRewriteAllowed:false,oldWac:20,purchaseWac:22,currentWac:22,reasonCodes:['WAC_CHANGED_BY_PURCHASE','DOWNSTREAM_OPNAME_OR_ADJUSTMENT','AUTO_WAC_REWRITE_FORBIDDEN']},resolutionPlan:{safeActions:['LINK_REPAIR','HISTORICAL_SHIFT_ACK'],blockedActions:['PURCHASE_REVERSAL'],reviewActions:['WAC_COST_REVIEW'],productionWriteApproved:false}};
  const html=renderPurchaseAuditV33(audit,{readOnly:true});
  assert.match(html,/Dana Owner/);assert.match(html,/tidak mengurangi kas usaha/i);
  assert.match(html,/WAC Cost Review/);assert.match(html,/REVIEW_REQUIRED/);assert.match(html,/auto WAC rewrite/i);
  assert.match(html,/Rencana Resolusi Terkontrol/);assert.match(html,/LINK_REPAIR/);assert.match(html,/HISTORICAL_SHIFT_ACK/);assert.match(html,/PURCHASE_REVERSAL/);
  assert.match(html,/LOCAL QA/);assert.match(html,/disabled/);
});

test('RC5-D cashflow UI keeps OWNER-funded purchase auditable while KPI Uang Keluar remains zero',()=>{
  const loaded={period:'2026-08',allShiftsClosed:true,openShiftKeys:[],incompleteShiftKeys:[],historicalResolvedShiftKeys:[],model:{daily:[],profit:{netSales:0,cogs:0,cogsKnown:true,businessExpenses:0,netProfit:0,hppCoverage:{unknownTransactions:0}},ownerCapital:{opening:0,additional:0,prive:0,calculatedEnding:0},cashPosition:{available:0,source:'Ekspektasi kas shift'},cashFlow:{totalIn:0,totalOut:0,netChange:0,rows:[{id:'purchase:PTEH',ts:TEH.createdTs,kind:'INVENTORY_PURCHASE',description:'Pembelian TEH',source:'OWNER',in:0,out:0,fundingAmount:25000,fundingTreatment:'OWNER_DIRECT',category:'Belanja Stok',date:'2026-08-29',runningBalance:0,refId:'PTEH'}]},inventoryPurchases:{cashOut:0,ownerFunded:25000,bankUnverified:0,otherUnresolved:0,grossPurchases:25000,requiresFundingReview:false},outstanding:{pendingTransactions:0,customerDebt:0,employeeAdvance:0},obligations:{observed:[],scheduleAuthorityAvailable:false}},input:{expenses:[],ownerEvents:[]},activeClose:null,shiftCount:1,shiftKeys:['2026-08-29-S1']};
  const html=renderFinanceWorkspaceV33({loaded,tab:'cashflow',readOnly:true,purchaseAudit:null});
  assert.match(html,/Uang Keluar/);assert.match(html,/Rp\s?0/);
  assert.match(html,/Dana Owner/);assert.match(html,/Rp\s?25\.000/);assert.match(html,/tidak mengurangi kas usaha/i);
  assert.match(html,/data-v33-purchase-audit="PTEH"/);
});
