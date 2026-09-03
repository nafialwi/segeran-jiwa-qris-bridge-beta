import { posPath } from '../firebase-client.js';
import { assertOperationId } from '../../core/idempotency.js';
import { assertFreshOwnerProof } from '../../core/sensitive-authorizer.js';

const CANONICAL_SHIFT_RE=/^\d{4}-\d{2}-\d{2}-S[123]$/;
const text=(v,max=500)=>String(v??'').trim().slice(0,max);
const num=v=>Number.isFinite(Number(v))?Number(v):0;
const obj=v=>v&&typeof v==='object'?v:{};
const rows=v=>v&&typeof v==='object'?Object.values(v).filter(Boolean):[];
const safeSegment=(v,code)=>{const x=text(v,140);if(!x||x.includes('/')||/[.#$\[\]]/.test(x))throw new Error(code);return x};
const inventoryRootPath=()=>posPath('global','inventoryV2');
const purchasePath=purchaseId=>posPath('global','inventoryV2','purchases',safeSegment(purchaseId,'PURCHASE_RECONCILIATION_ID_REQUIRED'));
const reconciliationPath=(purchaseId,operationId)=>posPath('global','inventoryV2','purchaseReconciliations',safeSegment(purchaseId,'PURCHASE_RECONCILIATION_ID_REQUIRED'),assertOperationId(operationId));
const expensePath=(shiftKey,expenseRef)=>{const shift=text(shiftKey,32);if(!CANONICAL_SHIFT_RE.test(shift))throw new Error('PURCHASE_SHIFT_INVALID');return posPath(shift,'opex',safeSegment(expenseRef,'PURCHASE_EXPENSE_REF_REQUIRED'))};
const shiftPath=shiftKey=>{const shift=text(shiftKey,32);if(!CANONICAL_SHIFT_RE.test(shift))throw new Error('PURCHASE_SHIFT_INVALID');return posPath(shift)};

export const PURCHASE_RECONCILIATION_WRITER_CONTRACT=Object.freeze({
  file:'src/data/writers/purchase-reconciliation-writer.js',
  mutationMethods:Object.freeze(['transaction']),
  approvedPathPrefixes:Object.freeze(['global/inventoryV2','{shiftKey}/opex/{expenseRef}']),
  destructiveRemove:false,
  originalPurchaseImmutable:true
});

function ownerProof(authorization,{now,maxProofAgeMs}){
  const proof=assertFreshOwnerProof(authorization,{now,maxAgeMs:maxProofAgeMs});
  if(String(proof.requesterRole)!=='owner'||String(proof.requesterId)!==String(proof.ownerId))throw new Error('OWNER_SELF_REAUTH_REQUIRED');
  return proof;
}
async function readValue(db,path){const snap=await db.ref(path).once('value');return snap&&typeof snap.val==='function'?snap.val():null}
function amountOf(p){return Math.max(0,num(p?.landedCost??p?.totalLandedCost))}
function buildLinkedExpense(purchase,purchaseId,proof,ts){
  const amount=amountOf(purchase);
  return {id:text(purchase.expenseRef),category:'Belanja Bahan',n:`Pembelian ${text(purchase.itemName||purchase.itemId||'Stok',120)}`,a:amount,amount,source:text(purchase.fundSource||'OTHER',16).toUpperCase(),purchaseRef:purchaseId,supplier:text(purchase.supplier,160),systemLinked:true,user:proof.ownerName||proof.requesterId,createdAt:new Date(ts).toISOString(),ts};
}
function confirmedReversal(bucket){return rows(bucket).find(r=>text(r.type).toUpperCase()==='PURCHASE_REVERSAL'&&text(r.status).toUpperCase()==='CONFIRMED')||null}
function downstreamBlock(root,purchase,purchaseId){
  const itemId=text(purchase.itemId),purchaseTs=num(purchase.createdTs),movementRef=text(purchase.movementRef),safe=new Set(['PURCHASE','TRANSFER_OUT','TRANSFER_IN']);
  for(const movement of rows(root.movements)){
    if(text(movement.itemId)!==itemId||num(movement.ts)<=purchaseTs||text(movement.id||movement._key)===movementRef||text(movement.purchaseId)===purchaseId)continue;
    const type=text(movement.type).toUpperCase(),delta=num(movement.delta);
    if(type==='OPNAME')return 'DOWNSTREAM_INVENTORY_AMBIGUOUS';
    if(!safe.has(type))return delta<0?'DOWNSTREAM_CONSUMPTION_DETECTED':'DOWNSTREAM_INVENTORY_AMBIGUOUS';
  }
  return '';
}

export function createPurchaseReconciliationWriter({db,now=()=>Date.now(),maxProofAgeMs=120000}={}){
  if(!db||typeof db.ref!=='function')throw new Error('PURCHASE_RECONCILIATION_DB_REQUIRED');

  async function repairExpenseLink({operationId,purchaseId,note='',authorization}={}){
    const id=assertOperationId(operationId),pid=safeSegment(purchaseId,'PURCHASE_RECONCILIATION_ID_REQUIRED'),proof=ownerProof(authorization,{now,maxProofAgeMs}),ts=Number(now())||Date.now();
    const existing=await readValue(db,reconciliationPath(pid,id));if(existing&&text(existing.status).toUpperCase()==='CONFIRMED')return existing;
    const purchase=await readValue(db,purchasePath(pid));if(!purchase)throw new Error('PURCHASE_NOT_FOUND');
    if(text(purchase.status).toUpperCase()!=='COMMITTED')throw new Error('PURCHASE_NOT_COMMITTED');
    const expenseRef=safeSegment(purchase.expenseRef,'PURCHASE_EXPENSE_REF_REQUIRED'),shiftKey=text(purchase.shift);expensePath(shiftKey,expenseRef);
    const eventBase={id,operationId:id,purchaseId:pid,type:'LINK_REPAIR',status:'PREPARED',shiftKey,expenseRef,itemId:text(purchase.itemId),itemName:text(purchase.itemName||purchase.itemId||'Stok'),fundSource:text(purchase.fundSource||'OTHER').toUpperCase(),amount:amountOf(purchase),note:text(note),createdBy:proof.requesterId,createdByName:proof.ownerName,createdAt:new Date(ts).toISOString(),createdTs:ts};
    const claim=await db.ref(reconciliationPath(pid,id)).transaction(current=>current||eventBase);
    if(!claim?.committed)throw new Error('PURCHASE_RECONCILIATION_CLAIM_FAILED');
    let expenseReason='PURCHASE_EXPENSE_REF_OCCUPIED';
    const expected=buildLinkedExpense(purchase,pid,proof,ts);
    const exp=await db.ref(expensePath(shiftKey,expenseRef)).transaction(current=>{
      if(current==null)return expected;
      const same=text(current.purchaseRef)===pid&&num(current.amount??current.a)===amountOf(purchase)&&current.systemLinked===true;
      if(same)return current;
      return undefined;
    });
    if(!exp?.committed)throw new Error(expenseReason);
    const final=await db.ref(reconciliationPath(pid,id)).transaction(current=>({...obj(current),...eventBase,status:'CONFIRMED',confirmedAt:new Date(ts).toISOString(),confirmedTs:ts}));
    if(!final?.committed)throw new Error('PURCHASE_RECONCILIATION_FINALIZE_FAILED');
    return final.snapshot?.val?.()||{...eventBase,status:'CONFIRMED'};
  }

  async function acknowledgeHistoricalShift({operationId,purchaseId,note='',authorization}={}){
    const ackNote=text(note);if(!ackNote)throw new Error('HISTORICAL_SHIFT_ACK_NOTE_REQUIRED');
    const id=assertOperationId(operationId),pid=safeSegment(purchaseId,'PURCHASE_RECONCILIATION_ID_REQUIRED'),proof=ownerProof(authorization,{now,maxProofAgeMs}),ts=Number(now())||Date.now();
    const existing=await readValue(db,reconciliationPath(pid,id));if(existing&&text(existing.status).toUpperCase()==='CONFIRMED')return existing;
    const purchase=await readValue(db,purchasePath(pid));if(!purchase)throw new Error('PURCHASE_NOT_FOUND');
    if(text(purchase.status).toUpperCase()!=='COMMITTED')throw new Error('PURCHASE_NOT_COMMITTED');
    const shiftKey=text(purchase.shift,32);if(!CANONICAL_SHIFT_RE.test(shiftKey))throw new Error('PURCHASE_SHIFT_INVALID');
    const reconciliationBucket=obj(await readValue(db,posPath('global','inventoryV2','purchaseReconciliations',pid)));
    if(rows(reconciliationBucket).some(row=>text(row.type).toUpperCase()==='HISTORICAL_SHIFT_ACK'&&text(row.status).toUpperCase()==='CONFIRMED'&&text(row.shiftKey)===shiftKey))throw new Error('HISTORICAL_SHIFT_ALREADY_ACKNOWLEDGED');
    const shift=obj(await readValue(db,shiftPath(shiftKey))),shiftStatus=text(shift.shiftStatus).toUpperCase(),controlStatus=text(shift.sessionControl?.status).toUpperCase(),sessionId=text(shift.sessionControl?.currentSessionId||shift.currentSessionId),locked=shift.locked===true,closingSnapshot=!!(shift.closingSnapshot&&typeof shift.closingSnapshot==='object');
    const state=locked||shiftStatus==='CLOSED'||controlStatus==='CLOSED'?'CLOSED':((controlStatus==='ACTIVE'||shiftStatus==='ACTIVE')&&sessionId?'ACTIVE':'NOT_STARTED');
    if(state==='ACTIVE')throw new Error('HISTORICAL_SHIFT_ACTIVE');
    const issueCodes=[];
    if(state==='NOT_STARTED')issueCodes.push('SHIFT_STATUS_INCOMPLETE');
    if(state==='CLOSED'&&!locked&&!closingSnapshot&&controlStatus!=='CLOSED')issueCodes.push('CLOSING_EVIDENCE_INCOMPLETE');
    if(!issueCodes.length)throw new Error('HISTORICAL_SHIFT_ACK_NOT_REQUIRED');
    const event={id,operationId:id,purchaseId:pid,type:'HISTORICAL_SHIFT_ACK',status:'CONFIRMED',shiftKey,shiftState:state,issueCodes,note:ackNote,itemId:text(purchase.itemId),itemName:text(purchase.itemName||purchase.itemId||'Stok'),createdBy:proof.requesterId,createdByName:proof.ownerName,createdAt:new Date(ts).toISOString(),createdTs:ts,confirmedAt:new Date(ts).toISOString(),confirmedTs:ts};
    let rejectReason='PURCHASE_RECONCILIATION_CONFLICT';
    const result=await db.ref(reconciliationPath(pid,id)).transaction(current=>{
      if(current==null)return event;
      const same=text(current.type).toUpperCase()==='HISTORICAL_SHIFT_ACK'&&text(current.purchaseId)===pid&&text(current.shiftKey)===shiftKey;
      if(same)return current;
      rejectReason='PURCHASE_RECONCILIATION_OPERATION_CONFLICT';return undefined;
    });
    if(!result?.committed)throw new Error(rejectReason);
    return result.snapshot?.val?.()||event;
  }

  async function reversePurchase({operationId,purchaseId,reason='',authorization}={}){
    const reversalReason=text(reason);if(!reversalReason)throw new Error('PURCHASE_REVERSAL_REASON_REQUIRED');
    const id=assertOperationId(operationId),pid=safeSegment(purchaseId,'PURCHASE_RECONCILIATION_ID_REQUIRED'),proof=ownerProof(authorization,{now,maxProofAgeMs}),ts=Number(now())||Date.now();
    const existing=await readValue(db,reconciliationPath(pid,id));if(existing&&text(existing.status).toUpperCase()==='CONFIRMED')return existing;
    let rejectReason='PURCHASE_RECONCILIATION_CONFLICT';
    const result=await db.ref(inventoryRootPath()).transaction(current=>{
      const root=obj(current),purchases=obj(root.purchases),purchase=obj(purchases[pid]);
      if(!purchase.id&&!purchase.purchaseId){rejectReason='PURCHASE_NOT_FOUND';return}
      if(text(purchase.status).toUpperCase()!=='COMMITTED'){rejectReason='PURCHASE_NOT_COMMITTED';return}
      const reconciliations=obj(root.purchaseReconciliations),bucket=obj(reconciliations[pid]);
      if(bucket[id]&&text(bucket[id].status).toUpperCase()==='CONFIRMED')return root;
      if(confirmedReversal(bucket)){rejectReason='PURCHASE_ALREADY_REVERSED';return}
      const itemType=text(purchase.itemType).toLowerCase(),itemId=text(purchase.itemId),qty=Math.max(0,num(purchase.qtyReceived)),landedCost=amountOf(purchase);
      if(itemType!=='ingredient'){rejectReason='PRODUCT_REVERSAL_REQUIRES_MANUAL_RECONCILIATION';return}
      if(!itemId||qty<=0||landedCost<=0){rejectReason='PURCHASE_REVERSAL_EVIDENCE_INCOMPLETE';return}
      const downstream=downstreamBlock(root,purchase,pid);if(downstream){rejectReason=downstream;return}
      root.balances=obj(root.balances);root.balances.ingredients=obj(root.balances.ingredients);const balance={outlet:0,warehouse:0,...obj(root.balances.ingredients[itemId])};
      const warehouse=Math.max(0,num(balance.warehouse)),outlet=Math.max(0,num(balance.outlet));if(warehouse<qty){rejectReason='PURCHASE_REVERSAL_STOCK_LOW';return}
      root.costs=obj(root.costs);root.costs.ingredients=obj(root.costs.ingredients);const oldCost=obj(root.costs.ingredients[itemId]),currentWac=Math.max(0,num(oldCost.wac)),currentTotal=warehouse+outlet,correctedTotal=currentTotal-qty,correctedValue=currentTotal*currentWac-landedCost;
      if(correctedValue<-0.000001){rejectReason='PURCHASE_RECONCILIATION_VALUE_CONFLICT';return}
      const correctedWarehouse=warehouse-qty,correctedWac=correctedTotal>0?Math.max(0,correctedValue/correctedTotal):Math.max(0,num(purchase.oldWac));
      root.balances.ingredients[itemId]={...balance,warehouse:correctedWarehouse,lastOp:{id,action:'PURCHASE_REVERSAL',ts}};
      root.costs.ingredients[itemId]={...oldCost,itemType:'ingredient',itemId,currency:'IDR',wac:correctedWac,source:'PURCHASE_RECONCILIATION',lastReconciliationId:id,updatedAt:new Date(ts).toISOString(),updatedTs:ts,updatedBy:proof.requesterId};
      root.movements=obj(root.movements);const movementId=`PUR-REV-${id}`;root.movements[movementId]={id:movementId,itemType:'ingredient',itemId,itemName:text(purchase.itemName||itemId),type:'PURCHASE_REVERSAL',location:'warehouse',delta:-qty,purchaseId:pid,reconciliationId:id,landedCost,oldWac:currentWac,newWac:correctedWac,beforeQty:warehouse,afterQty:correctedWarehouse,note:reversalReason,user:proof.ownerName||proof.requesterId,userId:proof.requesterId,ts,at:new Date(ts).toISOString(),shift:text(purchase.shift)};
      const event={id,operationId:id,purchaseId:pid,type:'PURCHASE_REVERSAL',status:'CONFIRMED',itemType:'ingredient',itemId,itemName:text(purchase.itemName||itemId),qtyReversed:qty,landedCost,cashCompensation:landedCost,fundSource:text(purchase.fundSource||'OTHER').toUpperCase(),movementId,reason:reversalReason,beforeWarehouse:warehouse,afterWarehouse:correctedWarehouse,beforeWac:currentWac,afterWac:correctedWac,createdBy:proof.requesterId,createdByName:proof.ownerName,createdAt:new Date(ts).toISOString(),createdTs:ts,confirmedAt:new Date(ts).toISOString(),confirmedTs:ts};
      root.purchaseReconciliations=reconciliations;root.purchaseReconciliations[pid]={...bucket,[id]:event};
      return root;
    });
    if(!result?.committed)throw new Error(rejectReason);
    const root=result.snapshot?.val?.()||{},event=root?.purchaseReconciliations?.[pid]?.[id];if(!event)throw new Error('PURCHASE_RECONCILIATION_RESULT_MISSING');return event;
  }

  return Object.freeze({repairExpenseLink,acknowledgeHistoricalShift,reversePurchase,contract:PURCHASE_RECONCILIATION_WRITER_CONTRACT});
}
