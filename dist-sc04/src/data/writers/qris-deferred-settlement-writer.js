import { qrisPath } from '../firebase-client.js';
import { combinedQrisFingerprint, normalizeSaleSnapshot, snapshotIdentity, isLateQuarantineStatus } from '../../domain/qris-deferred-settlement-policy.js';

const SNAPSHOT_VERSION='S10A-1';
const safeId=(value,code='QRIS_S10A_INVALID_ID')=>{const id=String(value??'').trim();if(!/^[A-Za-z0-9_-]{1,180}$/.test(id))throw new Error(code);return id};
const text=(v,max=180)=>String(v??'').trim().slice(0,max);
const ids=v=>[...new Set((Array.isArray(v)?v:[]).map(x=>text(x)).filter(Boolean))].sort();
const eligibleSignal=new Set(['DETECTED','UNMATCHED','AMBIGUOUS']);
const defaultServerTimestamp=()=>({'.sv':'timestamp'});
const sameIds=(a,b)=>JSON.stringify(ids(a))===JSON.stringify(ids(b));

export const QRIS_DEFERRED_SETTLEMENT_WRITER_CONTRACT=Object.freeze({
  file:'src/data/writers/qris-deferred-settlement-writer.js',
  mutationMethods:Object.freeze(['transaction']),
  qrisPathPrefixes:Object.freeze(['pending','signals']),
  pendingFields:Object.freeze(['saleSnapshotVersion','saleSnapshot','parkedAt','parkedBy','parkReason']),
  signalFields:Object.freeze(['status','resolutionState','autoMatchBlocked','lateDetectedAt','lateCandidatePendingIds']),
  destructiveRemove:false,
  posWrites:false
});

export function createQrisDeferredSettlementWriter({db,serverTimestamp=defaultServerTimestamp}={}){
  if(!db||typeof db.ref!=='function')throw new Error('QRIS_S10A_WRITE_CLIENT_REQUIRED');

  async function attachSnapshotAndPark({pendingId,cashierId,parkedBy,snapshot}={}){
    const pid=safeId(pendingId,'QRIS_S10A_INVALID_PENDING_ID'),cashier=text(cashierId),actor=text(parkedBy),normalized=normalizeSaleSnapshot(snapshot),identity=snapshotIdentity(normalized);
    if(!cashier)throw new Error('QRIS_S10A_CASHIER_REQUIRED');
    let reason='QRIS_S10A_PENDING_CONFLICT';
    const result=await db.ref(qrisPath('pending',pid)).transaction(cur=>{
      if(!cur){reason='QRIS_S10A_PENDING_NOT_FOUND';return}
      if(String(cur.cashierId||'')!==cashier){reason='QRIS_S10A_CASHIER_MISMATCH';return}
      if(String(cur.status||'')!=='WAITING_QRIS'){reason='QRIS_S10A_PENDING_NOT_WAITING';return}
      if(cur.providerTransactionId){reason='QRIS_S10A_PROVIDER_ALREADY_LINKED';return}
      if(Number(cur.amount)!==Number(normalized.amount)){reason='QRIS_S10A_AMOUNT_MISMATCH';return}
      if(String(cur.cartFingerprint||'')!==combinedQrisFingerprint(normalized.cartFingerprint,normalized.pricingFingerprint)){reason='QRIS_S10A_FINGERPRINT_MISMATCH';return}
      if(cur.saleSnapshotVersion||cur.saleSnapshot){
        if(String(cur.saleSnapshotVersion||'')!==SNAPSHOT_VERSION){reason='QRIS_S10A_SNAPSHOT_CONFLICT';return}
        try{if(snapshotIdentity(cur.saleSnapshot)!==identity){reason='QRIS_S10A_SNAPSHOT_CONFLICT';return}}catch(_){reason='QRIS_S10A_SNAPSHOT_CONFLICT';return}
        if(cur.parkedAt!=null)return cur;
      }
      return {...cur,saleSnapshotVersion:SNAPSHOT_VERSION,saleSnapshot:normalized,parkedAt:serverTimestamp(),parkedBy:actor||cashier,parkReason:'SERVE_NEXT_CUSTOMER'};
    });
    if(!result?.committed)throw new Error(reason);
    return result.snapshot?.val?.()||null;
  }

  async function quarantineLateSignal({providerTransactionId,status,lateCandidatePendingIds}={}){
    const providerId=safeId(providerTransactionId,'QRIS_S10A_INVALID_PROVIDER_ID'),lateStatus=String(status||'');
    if(!isLateQuarantineStatus(lateStatus))throw new Error('QRIS_S10A_INVALID_LATE_STATUS');
    const candidateIds=ids(lateCandidatePendingIds);if(!candidateIds.length)throw new Error('QRIS_S10A_LATE_CANDIDATE_REQUIRED');
    let reason='QRIS_S10A_SIGNAL_CONFLICT';
    const quarantineUpdater=cur=>{
      if(!cur){reason='QRIS_S10A_SIGNAL_NOT_FOUND';return}
      if(cur.matchedTransactionId||['MATCHED','CONFIRMED','CASH_OUT_CLAIMED'].includes(String(cur.status||''))){reason='QRIS_S10A_SIGNAL_ALREADY_LINKED';return}
      if(isLateQuarantineStatus(cur.status)){
        if(String(cur.status)===lateStatus&&cur.autoMatchBlocked===true&&String(cur.resolutionState||'')==='REVIEW_REQUIRED'&&sameIds(cur.lateCandidatePendingIds,candidateIds))return cur;
        reason='QRIS_S10A_SIGNAL_QUARANTINE_CONFLICT';return;
      }
      if(!eligibleSignal.has(String(cur.status||'DETECTED'))){reason='QRIS_S10A_SIGNAL_NOT_ELIGIBLE';return}
      return {...cur,status:lateStatus,resolutionState:'REVIEW_REQUIRED',autoMatchBlocked:true,lateDetectedAt:serverTimestamp(),lateCandidatePendingIds:candidateIds};
    };
    Object.defineProperty(quarantineUpdater,'__sjS10AQuarantine',{value:true,writable:false,configurable:false,enumerable:false});
    const result=await db.ref(qrisPath('signals',providerId)).transaction(quarantineUpdater);
    if(!result?.committed)throw new Error(reason);
    return result.snapshot?.val?.()||null;
  }

  return Object.freeze({attachSnapshotAndPark,quarantineLateSignal,contract:QRIS_DEFERRED_SETTLEMENT_WRITER_CONTRACT});
}
