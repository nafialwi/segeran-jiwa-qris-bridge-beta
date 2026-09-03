import { posPath } from '../firebase-client.js';
import { assertOperationId } from '../../core/idempotency.js';
import { assertFreshOwnerProof } from '../../core/sensitive-authorizer.js';

const OWNER_TYPES=new Set(['OPENING_CAPITAL','ADDITIONAL_CAPITAL','PRIVE']);
const SOURCES=new Set(['OWNER','CASH','BANK','OTHER']);
const PERIOD_RE=/^\d{4}-\d{2}$/;
const DATE_RE=/^\d{4}-\d{2}-\d{2}$/;
const text=(v,max=500)=>String(v??'').trim().slice(0,max);
const positiveIdr=v=>{
  const n=Number(v);
  if(!Number.isInteger(n)||n<=0)throw new Error('INVALID_FINANCE_AMOUNT');
  return n;
};
const periodOf=v=>{const p=text(v,7);if(!PERIOD_RE.test(p))throw new Error('INVALID_FINANCE_MONTH');return p};
const effectiveDateOf=(v,period)=>{const d=text(v,10);if(!DATE_RE.test(d)||!d.startsWith(`${period}-`))throw new Error('INVALID_EFFECTIVE_DATE');return d};
const sourceOf=v=>{const s=text(v,16).toUpperCase()||'OWNER';if(!SOURCES.has(s))throw new Error('INVALID_FINANCE_SOURCE');return s};
const rows=v=>v&&typeof v==='object'?v:{};

export const FINANCE_WRITER_CONTRACT=Object.freeze({
  file:'src/data/writers/finance-writer.js',
  mutationMethods:Object.freeze(['transaction']),
  approvedPathPrefixes:Object.freeze([
    'global/financeV1/ownerEvents',
    'global/financeV1/monthCloseEvents'
  ]),
  destructiveRemove:false
});

function ownerProof(authorization,{now,maxProofAgeMs}){
  const proof=assertFreshOwnerProof(authorization,{now,maxAgeMs:maxProofAgeMs});
  if(String(proof.requesterRole)!=='owner'||String(proof.requesterId)!==String(proof.ownerId))throw new Error('OWNER_SELF_REAUTH_REQUIRED');
  return proof;
}
function reversalTargets(events){
  const set=new Set();
  for(const event of Object.values(rows(events))){if(String(event?.type||'').toUpperCase()==='REVERSAL'&&event?.reversalOf)set.add(String(event.reversalOf))}
  return set;
}
function activeOpening(events){
  const reversed=reversalTargets(events);
  return Object.values(rows(events)).find(event=>String(event?.type||'').toUpperCase()==='OPENING_CAPITAL'&&!reversed.has(String(event?.operationId||event?.id||'')))||null;
}
function activeClose(events){
  const reopened=new Set();
  for(const event of Object.values(rows(events))){if(String(event?.type||'').toUpperCase()==='REOPEN'&&event?.reopenOf)reopened.add(String(event.reopenOf))}
  const closes=Object.values(rows(events)).filter(event=>String(event?.type||'').toUpperCase()==='CLOSE'&&!reopened.has(String(event?.operationId||event?.id||'')));
  return closes.sort((a,b)=>Number(b?.createdTs||0)-Number(a?.createdTs||0))[0]||null;
}
function closeSnapshot(input={}){
  const hppKnown=input.hppKnown!==false;
  return {
    version:Number(input.version)||1,
    checklist:input.checklist&&typeof input.checklist==='object'?input.checklist:{},
    netSales:Number(input.netSales)||0,
    hpp:hppKnown?(Number(input.hpp)||0):null,
    hppKnown,
    hppCoverage:input.hppCoverage&&typeof input.hppCoverage==='object'?input.hppCoverage:{},
    businessExpenses:Number(input.businessExpenses)||0,
    inventoryPurchaseCashOut:Number(input.inventoryPurchaseCashOut)||0,
    cashFlowIn:Number(input.cashFlowIn)||0,
    cashFlowOut:Number(input.cashFlowOut)||0,
    cashFlowNet:Number(input.cashFlowNet)||0,
    modalOpening:Number(input.modalOpening)||0,
    modalAdditional:Number(input.modalAdditional)||0,
    prive:Number(input.prive)||0,
    calculatedEnding:input.calculatedEnding==null?null:Number(input.calculatedEnding),
    outstandingDebt:Number(input.outstandingDebt)||0,
    outstandingAdvance:Number(input.outstandingAdvance)||0,
    shiftCount:Number(input.shiftCount)||0,
    allShiftsClosed:input.allShiftsClosed===true,
    sourceFingerprint:text(input.sourceFingerprint,160),
    dataThrough:text(input.dataThrough,64)
  };
}

export function createFinanceWriter({db,now=()=>Date.now(),maxProofAgeMs=120000}={}){
  if(!db||typeof db.ref!=='function')throw new Error('FINANCE_WRITE_CLIENT_REQUIRED');

  async function transactMonth(path,currentOperationId,mutator){
    let reason='FINANCE_WRITE_CONFLICT';
    const ref=db.ref(path);
    const result=await ref.transaction(current=>{
      const month=rows(current);
      if(Object.prototype.hasOwnProperty.call(month,currentOperationId)){reason='DUPLICATE_OPERATION_ID';return}
      const next=mutator({...month},value=>{reason=value});
      if(next===undefined)return;
      return next;
    });
    if(!result?.committed)throw new Error(reason);
    const full=result.snapshot?.val?.()||{};
    return full[currentOperationId];
  }

  async function postOwnerEvent({operationId,period,type,amount,effectiveDate,source='OWNER',note='',authorization}={}){
    const id=assertOperationId(operationId),p=periodOf(period),kind=text(type,32).toUpperCase();
    if(!OWNER_TYPES.has(kind))throw new Error('INVALID_OWNER_EVENT_TYPE');
    const proof=ownerProof(authorization,{now,maxProofAgeMs}),ts=Number(now())||Date.now();
    const record=Object.freeze({
      id,operationId:id,period:p,type:kind,amount:positiveIdr(amount),effectiveDate:effectiveDateOf(effectiveDate,p),source:sourceOf(source),note:text(note),reversalOf:null,status:'POSTED',
      createdBy:proof.requesterId,createdByName:proof.ownerName,createdAt:new Date(ts).toISOString(),createdTs:ts
    });
    return transactMonth(posPath('global','financeV1','ownerEvents',p),id,(month,reject)=>{
      if(kind==='OPENING_CAPITAL'&&activeOpening(month)){reject('OPENING_CAPITAL_ALREADY_ACTIVE');return}
      month[id]=record;return month;
    });
  }

  async function reverseOwnerEvent({operationId,period,reversalOf,note='',authorization}={}){
    const id=assertOperationId(operationId),targetId=assertOperationId(reversalOf),p=periodOf(period),proof=ownerProof(authorization,{now,maxProofAgeMs}),ts=Number(now())||Date.now();
    return transactMonth(posPath('global','financeV1','ownerEvents',p),id,(month,reject)=>{
      const target=month[targetId];
      if(!target||String(target.type||'').toUpperCase()==='REVERSAL'){reject('OWNER_EVENT_REVERSAL_TARGET_INVALID');return}
      if(reversalTargets(month).has(targetId)){reject('OWNER_EVENT_ALREADY_REVERSED');return}
      month[id]={
        id,operationId:id,period:p,type:'REVERSAL',amount:positiveIdr(target.amount),effectiveDate:text(target.effectiveDate,10),source:sourceOf(target.source||'OWNER'),note:text(note),reversalOf:targetId,status:'POSTED',
        createdBy:proof.requesterId,createdByName:proof.ownerName,createdAt:new Date(ts).toISOString(),createdTs:ts
      };
      return month;
    });
  }

  async function closeMonth({operationId,period,snapshot={},authorization}={}){
    const id=assertOperationId(operationId),p=periodOf(period),proof=ownerProof(authorization,{now,maxProofAgeMs}),ts=Number(now())||Date.now(),canonical=closeSnapshot(snapshot);
    return transactMonth(posPath('global','financeV1','monthCloseEvents',p),id,(month,reject)=>{
      if(activeClose(month)){reject('MONTH_ALREADY_CLOSED');return}
      month[id]={id,operationId:id,period:p,type:'CLOSE',...canonical,closedBy:proof.requesterId,closedByName:proof.ownerName,closedAt:new Date(ts).toISOString(),createdAt:new Date(ts).toISOString(),createdTs:ts};
      return month;
    });
  }

  async function reopenMonth({operationId,period,reopenOf,note='',authorization}={}){
    const id=assertOperationId(operationId),targetId=assertOperationId(reopenOf),p=periodOf(period),proof=ownerProof(authorization,{now,maxProofAgeMs}),ts=Number(now())||Date.now();
    return transactMonth(posPath('global','financeV1','monthCloseEvents',p),id,(month,reject)=>{
      const target=month[targetId];
      if(!target||String(target.type||'').toUpperCase()!=='CLOSE'){reject('MONTH_CLOSE_TARGET_INVALID');return}
      const already=Object.values(month).some(event=>String(event?.type||'').toUpperCase()==='REOPEN'&&String(event?.reopenOf||'')===targetId);
      if(already){reject('MONTH_CLOSE_ALREADY_REOPENED');return}
      const current=activeClose(month);
      if(!current||String(current.operationId||current.id)!==targetId){reject('MONTH_CLOSE_NOT_ACTIVE');return}
      month[id]={id,operationId:id,period:p,type:'REOPEN',reopenOf:targetId,note:text(note),status:'POSTED',reopenedBy:proof.requesterId,reopenedByName:proof.ownerName,reopenedAt:new Date(ts).toISOString(),createdAt:new Date(ts).toISOString(),createdTs:ts};
      return month;
    });
  }

  return Object.freeze({postOwnerEvent,reverseOwnerEvent,closeMonth,reopenMonth,contract:FINANCE_WRITER_CONTRACT});
}
