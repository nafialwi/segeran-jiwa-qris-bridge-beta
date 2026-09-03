import { POS_ROOT, QRIS_ROOT, posPath, qrisPath } from '../firebase-client.js';
import { createOperationId, assertOperationId } from '../../core/idempotency.js';
import { assertFreshOwnerProof } from '../../core/sensitive-authorizer.js';

const SAFE_ID=/^[A-Za-z0-9_-]{1,120}$/;
const ELIGIBLE_SIGNAL=new Set(['DETECTED','UNMATCHED','AMBIGUOUS']);
const ELIGIBLE_PENDING=new Set(['WAITING_QRIS','MANUAL_FALLBACK']);
const text=v=>String(v??'').trim();
const upper=v=>text(v).toUpperCase();
const num=v=>Number(v)||0;
const normalizeRole=v=>{const x=text(v).toLowerCase();return x==='owner'||x==='manajemen'?'owner':x==='cashier'||x==='kasir'||x==='transaksi'?'cashier':x||'cashier'};
const clone=v=>v==null?v:JSON.parse(JSON.stringify(v));

function assertSafeId(value,code='INVALID_PROVIDER_TRANSACTION_ID'){
  const id=text(value);
  if(!SAFE_ID.test(id))throw new Error(code);
  return id;
}
async function readValue(db,path){
  const snap=await db.ref(path).once('value');
  return snap&&typeof snap.val==='function'?snap.val():null;
}
function nowIso(ts){return new Date(Number(ts)||Date.now()).toISOString()}
function txAmount(row){return num(row?.total??row?.netRevenue??row?.grandTotal??row?.amount)}
function txId(row,key){return text(row?.id||row?.transactionId||key)}

export function createQrisCashOutCoordinator({
  db,
  transactionService,
  readRequester,
  readDrawerCash,
  now=()=>Date.now(),
  random=Math.random,
  maxProofAgeMs=120000
}={}){
  if(!db||typeof db.ref!=='function')throw new Error('QRIS_CASH_OUT_DB_REQUIRED');
  if(!transactionService||typeof transactionService.commitLegacy!=='function')throw new Error('QRIS_CASH_OUT_TRANSACTION_SERVICE_REQUIRED');
  if(typeof readRequester!=='function')throw new Error('QRIS_CASH_OUT_REQUESTER_READER_REQUIRED');
  if(typeof readDrawerCash!=='function')throw new Error('QRIS_CASH_OUT_DRAWER_READER_REQUIRED');

  const journalPath=providerId=>posPath('global','financeV1','qrisCashOut',providerId);
  const signalPath=providerId=>qrisPath('signals',providerId);
  const pendingPath=pendingId=>qrisPath('pending',pendingId);

  function requester(){
    const raw=readRequester()||{};
    return {role:normalizeRole(raw.role),id:text(raw.id),name:text(raw.name),shiftKey:text(raw.shiftKey),sessionId:text(raw.sessionId)};
  }
  function authorize(proof,req){
    const verified=assertFreshOwnerProof(proof,{now,maxAgeMs:maxProofAgeMs,requesterId:req.id});
    if(normalizeRole(verified.requesterRole)!==req.role)throw new Error('OWNER_REAUTH_REQUESTER_ROLE_MISMATCH');
    if(req.role==='owner'&&text(verified.ownerId)!==req.id)throw new Error('OWNER_SELF_REAUTH_REQUIRED');
    return verified;
  }
  function validatePendingContext(pending,req,{allowClaimed=false}={}){
    if(!pending)throw new Error('QRIS_PENDING_NOT_FOUND');
    const status=upper(pending.status);
    if(!ELIGIBLE_PENDING.has(status)&&!(allowClaimed&&status==='CASH_OUT_CLAIMED'))throw new Error('QRIS_PENDING_CONTEXT_INVALID');
    if(num(pending.expiresAt)>0&&num(pending.expiresAt)<=num(now()))throw new Error('QRIS_PENDING_EXPIRED');
    if(text(pending.cashierId)!==req.id)throw new Error('QRIS_PENDING_CONTEXT_INVALID');
    if(req.shiftKey&&text(pending.activeDate)!==req.shiftKey)throw new Error('QRIS_PENDING_CONTEXT_INVALID');
    if(req.sessionId&&text(pending.sessionId)&&text(pending.sessionId)!==req.sessionId)throw new Error('QRIS_PENDING_CONTEXT_INVALID');
  }
  function validateSignal(signal,pending,providerId,{allowClaimed=false}={}){
    if(!signal)throw new Error('QRIS_SIGNAL_NOT_FOUND');
    const status=upper(signal.status);
    if(!ELIGIBLE_SIGNAL.has(status)&&!(allowClaimed&&status==='CASH_OUT_CLAIMED'))throw new Error('QRIS_SIGNAL_NOT_ELIGIBLE');
    if(text(signal.matchedTransactionId))throw new Error('QRIS_SIGNAL_ALREADY_MATCHED');
    if(text(signal.providerTransactionId||providerId)!==providerId)throw new Error('QRIS_SIGNAL_PROVIDER_MISMATCH');
    if(num(signal.amount)<=num(pending.amount))throw new Error('QRIS_SIGNAL_NOT_OVERPAY');
  }

  async function findEligibleOverpay(pendingIdValue){
    const pendingId=assertSafeId(pendingIdValue,'INVALID_PENDING_ID'),req=requester();
    const pending=await readValue(db,pendingPath(pendingId));
    validatePendingContext(pending,req);
    const signals=(await readValue(db,qrisPath('signals')))||{};
    const candidates=[];
    for(const [key,row0] of Object.entries(signals)){
      const row=row0||{},providerId=text(row.providerTransactionId||key);
      if(!SAFE_ID.test(providerId))continue;
      if(!ELIGIBLE_SIGNAL.has(upper(row.status)))continue;
      if(text(row.matchedTransactionId)||text(row.cashOutOperationId))continue;
      if(num(row.amount)<=num(pending.amount))continue;
      candidates.push({...clone(row),providerTransactionId:providerId,cashOutAmount:num(row.amount)-num(pending.amount)});
    }
    candidates.sort((a,b)=>num(a.firstSeenAt??a.createdAt)-num(b.firstSeenAt??b.createdAt)||a.providerTransactionId.localeCompare(b.providerTransactionId));
    return {pending:clone(pending),candidates};
  }

  async function rollbackSignal(providerId,operationId){
    await db.ref(signalPath(providerId)).transaction(cur=>{
      if(!cur||text(cur.cashOutOperationId)!==operationId||upper(cur.status)!=='CASH_OUT_CLAIMED')return cur;
      const next={...cur,status:text(cur.cashOutPreviousStatus)||'UNMATCHED',resolutionState:null,cashOutOperationId:null,cashOutPendingId:null,cashOutClaimedAt:null};
      return next;
    });
  }
  async function rollbackPending(pendingId,operationId){
    await db.ref(pendingPath(pendingId)).transaction(cur=>{
      if(!cur||text(cur.cashOutOperationId)!==operationId||upper(cur.status)!=='CASH_OUT_CLAIMED')return cur;
      return {...cur,status:text(cur.cashOutPreviousStatus)||'WAITING_QRIS',resolutionState:null,cashOutOperationId:null,providerTransactionId:null,cashOutAmount:null,qrisReceived:null,cashOutClaimedAt:null};
    });
  }
  async function patchJournal(providerId,operationId,patch){
    let conflict=false;
    const result=await db.ref(journalPath(providerId)).transaction(cur=>{
      if(!cur||text(cur.operationId)!==operationId){conflict=true;return undefined}
      return {...cur,...clone(patch)};
    });
    if(!result.committed||conflict)throw new Error('QRIS_CASH_OUT_JOURNAL_CONFLICT');
    return result.snapshot.val();
  }
  async function identifySale(journal){
    const txs=(await readValue(db,posPath(journal.shiftKey,'tx')))||{};
    const before=new Set(Array.isArray(journal.beforeTxKeys)?journal.beforeTxKeys.map(text):[]);
    const candidates=[];
    for(const [key,row0] of Object.entries(txs)){
      if(before.has(text(key)))continue;
      const row=row0||{};
      if(upper(row.method||row.paymentMethod||row.payment)!=='QRIS')continue;
      if(txAmount(row)!==num(journal.saleAmount))continue;
      if(text(row.cashierId)&&text(row.cashierId)!==text(journal.cashierId))continue;
      const id=txId(row,key);if(id)candidates.push({id,row});
    }
    return candidates;
  }
  async function finalize(journal,transactionId){
    const providerId=assertSafeId(journal.providerTransactionId),operationId=assertOperationId(journal.operationId),pendingId=assertSafeId(journal.pendingId,'INVALID_PENDING_ID');
    const ts=num(now()),finalRecord={...journal,status:'CONFIRMED',transactionId:text(transactionId),confirmedAt:nowIso(ts),confirmedTs:ts};
    const movement={
      id:journal.cashMovementId,
      direction:'OUT',
      amount:num(journal.cashOutAmount),
      type:'QRIS_CASH_OUT',
      providerTransactionId:providerId,
      transactionId:text(transactionId),
      operationId,
      note:'QRIS Cash-out / Tukar Uang',
      createdBy:text(journal.cashierId),
      createdByName:text(journal.cashierName),
      approvedBy:text(journal.approvedBy),
      approvedByName:text(journal.approvedByName),
      createdAt:journal.createdAt,
      createdTs:journal.createdTs
    };
    const patch={
      [`${POS_ROOT}/${journal.shiftKey}/cashMovements/${journal.cashMovementId}`]:movement,
      [`${POS_ROOT}/global/financeV1/qrisCashOut/${providerId}`]:finalRecord,
      [`${QRIS_ROOT}/signals/${providerId}/status`]:'CONFIRMED',
      [`${QRIS_ROOT}/signals/${providerId}/resolutionState`]:'CASH_OUT_CONFIRMED',
      [`${QRIS_ROOT}/signals/${providerId}/matchedTransactionId`]:text(transactionId),
      [`${QRIS_ROOT}/signals/${providerId}/cashOutOperationId`]:operationId,
      [`${QRIS_ROOT}/signals/${providerId}/cashOutPendingId`]:pendingId,
      [`${QRIS_ROOT}/pending/${pendingId}/status`]:'FINALIZED',
      [`${QRIS_ROOT}/pending/${pendingId}/resolutionState`]:'CASH_OUT_CONFIRMED',
      [`${QRIS_ROOT}/pending/${pendingId}/providerTransactionId`]:providerId,
      [`${QRIS_ROOT}/pending/${pendingId}/cashOutOperationId`]:operationId,
      [`${QRIS_ROOT}/pending/${pendingId}/finalizedTransactionId`]:text(transactionId),
      [`${QRIS_ROOT}/pending/${pendingId}/qrisReceived`]:num(journal.qrisReceived),
      [`${QRIS_ROOT}/pending/${pendingId}/cashOutAmount`]:num(journal.cashOutAmount),
      [`${QRIS_ROOT}/pending/${pendingId}/finalizedAt`]:ts
    };
    await db.ref('').update(patch);
    return finalRecord;
  }
  async function resumeJournal(journal,{authorization,allowSale=true}={}){
    const req=requester();authorize(authorization,req);
    if(text(journal.cashierId)!==req.id||text(journal.shiftKey)!==req.shiftKey)throw new Error('QRIS_CASH_OUT_REQUESTER_CONTEXT_MISMATCH');
    if(upper(journal.status)==='CONFIRMED')return journal;
    let current=journal;
    if(text(current.transactionId))return finalize(current,current.transactionId);

    const priorAttempt=Boolean(current.saleAttemptedAt)||['SALE_ATTEMPTING','SALE_OUTCOME_UNKNOWN'].includes(upper(current.status));
    if(!priorAttempt&&upper(current.status)==='CLAIMED'&&allowSale){
      const attemptTs=num(now());
      current=await patchJournal(current.providerTransactionId,current.operationId,{status:'SALE_ATTEMPTING',saleAttemptedAt:attemptTs,lastUpdatedAt:attemptTs});
      try{await transactionService.commitLegacy()}catch(_){/* outcome is proven from canonical tx authority below */}
    }

    const candidates=await identifySale(current);
    if(candidates.length!==1){
      const ts=num(now());
      current=await patchJournal(current.providerTransactionId,current.operationId,{status:'SALE_OUTCOME_UNKNOWN',candidateTransactionIds:candidates.map(x=>x.id),lastRecoveryAt:ts});
      throw new Error('QRIS_CASH_OUT_RECOVERY_REQUIRED');
    }
    current=await patchJournal(current.providerTransactionId,current.operationId,{status:'SALE_IDENTIFIED',transactionId:candidates[0].id,saleIdentifiedAt:num(now())});
    return finalize(current,candidates[0].id);
  }

  async function execute({providerTransactionId,pendingId:pendingIdValue,authorization}={}){
    const providerId=assertSafeId(providerTransactionId),pendingId=assertSafeId(pendingIdValue,'INVALID_PENDING_ID'),req=requester();
    authorize(authorization,req);
    const existing=await readValue(db,journalPath(providerId));
    if(existing){
      if(text(existing.pendingId)!==pendingId)throw new Error('QRIS_CASH_OUT_PROVIDER_ALREADY_CLAIMED');
      return resumeJournal(existing,{authorization,allowSale:true});
    }
    const [signal,pending]=await Promise.all([readValue(db,signalPath(providerId)),readValue(db,pendingPath(pendingId))]);
    validatePendingContext(pending,req);validateSignal(signal,pending,providerId);
    const cashOutAmount=num(signal.amount)-num(pending.amount);
    if(num(await readDrawerCash())<cashOutAmount)throw new Error('QRIS_CASH_OUT_DRAWER_INSUFFICIENT');
    const txs=(await readValue(db,posPath(req.shiftKey,'tx')))||{},beforeTxKeys=Object.keys(txs);
    const operationId=createOperationId('QCO',{now,random}),cashMovementId=assertOperationId(`QCO_${providerId}`),ts=num(now());

    const signalClaim=await db.ref(signalPath(providerId)).transaction(cur=>{
      if(!cur||!ELIGIBLE_SIGNAL.has(upper(cur.status))||text(cur.matchedTransactionId)||text(cur.cashOutOperationId)||num(cur.amount)!==num(signal.amount))return undefined;
      return {...cur,status:'CASH_OUT_CLAIMED',resolutionState:'CASH_OUT_CLAIMED',cashOutPreviousStatus:text(cur.status)||'UNMATCHED',cashOutOperationId:operationId,cashOutPendingId:pendingId,cashOutClaimedAt:ts};
    });
    if(!signalClaim.committed)throw new Error('QRIS_SIGNAL_CLAIM_CONFLICT');

    const pendingClaim=await db.ref(pendingPath(pendingId)).transaction(cur=>{
      if(!cur||!ELIGIBLE_PENDING.has(upper(cur.status))||text(cur.cashierId)!==req.id||text(cur.activeDate)!==req.shiftKey||(req.sessionId&&text(cur.sessionId)&&text(cur.sessionId)!==req.sessionId)||num(cur.amount)!==num(pending.amount))return undefined;
      return {...cur,status:'CASH_OUT_CLAIMED',resolutionState:'CASH_OUT_CLAIMED',cashOutPreviousStatus:text(cur.status)||'WAITING_QRIS',providerTransactionId:providerId,cashOutOperationId:operationId,qrisReceived:num(signal.amount),cashOutAmount,cashOutClaimedAt:ts};
    });
    if(!pendingClaim.committed){await rollbackSignal(providerId,operationId);throw new Error('QRIS_PENDING_CONTEXT_INVALID')}

    const journal={
      providerTransactionId:providerId,
      operationId,
      pendingId,
      shiftKey:req.shiftKey,
      saleAmount:num(pending.amount),
      qrisReceived:num(signal.amount),
      cashOutAmount,
      cashMovementId,
      status:'CLAIMED',
      cashierId:req.id,
      cashierName:text(pending.cashierName||req.name),
      approvedBy:text(authorization.ownerId),
      approvedByName:text(authorization.ownerName),
      createdAt:nowIso(ts),
      createdTs:ts,
      claimStartedAt:ts,
      beforeTxKeys,
      saleAttemptedAt:null,
      transactionId:null
    };
    const journalClaim=await db.ref(journalPath(providerId)).transaction(cur=>cur?undefined:journal);
    if(!journalClaim.committed){await rollbackPending(pendingId,operationId);await rollbackSignal(providerId,operationId);throw new Error('QRIS_CASH_OUT_JOURNAL_CONFLICT')}
    return resumeJournal(journal,{authorization,allowSale:true});
  }

  async function recover({providerTransactionId,authorization}={}){
    const providerId=assertSafeId(providerTransactionId),req=requester();authorize(authorization,req);
    const journal=await readValue(db,journalPath(providerId));
    if(!journal)throw new Error('QRIS_CASH_OUT_JOURNAL_NOT_FOUND');
    return resumeJournal(journal,{authorization,allowSale:true});
  }

  return Object.freeze({findEligibleOverpay,execute,recover});
}

export const QRIS_CASH_OUT_WRITER_CONTRACT=Object.freeze({
  writerFile:'src/data/writers/qris-cash-out-coordinator.js',
  mutationMethods:Object.freeze(['transaction','update']),
  posPathPrefixes:Object.freeze(['global/financeV1/qrisCashOut','{shiftKey}/cashMovements']),
  qrisPathPrefixes:Object.freeze(['signals','pending']),
  destructiveDelete:false,
  matcherPolicy:'exact-amount matcher unchanged; cash-out uses dedicated coordinator'
});
