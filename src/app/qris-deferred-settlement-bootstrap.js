import { POS_ROOT, QRIS_ROOT, qrisPath } from '../data/firebase-client.js';
import { createQrisDeferredSettlementWriter } from '../data/writers/qris-deferred-settlement-writer.js';
import * as policy from '../domain/qris-deferred-settlement-policy.js';

const clone=v=>v==null?v:JSON.parse(JSON.stringify(v));
const text=v=>String(v??'').trim();
const UNRESOLVED_STATUS=Object.freeze(['WAITING_QRIS','MATCHED','FINALIZING','MANUAL_FALLBACK']);

export function installQrisDeferredSettlementRuntime(runtime=globalThis,{p4=runtime?.__SJ_P4_FINANCE_RUNTIME,db=null,writer=null}={}){
  if(runtime?.__SJ_QRIS_DEFERRED_SETTLEMENT_RUNTIME)return runtime.__SJ_QRIS_DEFERRED_SETTLEMENT_RUNTIME;
  const resolvedDb=db??p4?.db;
  if(!resolvedDb||typeof resolvedDb.ref!=='function')throw new Error('QRIS_S10A_DB_REQUIRED');
  const settlementWriter=writer??createQrisDeferredSettlementWriter({db:resolvedDb});

  async function readPending(pendingId){
    const id=text(pendingId);if(!id)return null;
    const snap=await resolvedDb.ref(qrisPath('pending',id)).once('value');
    return clone(snap?.val?.()??null);
  }
  async function readPendingRows(){
    const snap=await resolvedDb.ref(qrisPath('pending')).once('value');
    return clone(snap?.val?.()||{});
  }
  async function readSignal(providerTransactionId){
    const id=text(providerTransactionId);if(!id)return null;
    const snap=await resolvedDb.ref(qrisPath('signals',id)).once('value');
    return clone(snap?.val?.()??null);
  }
  async function readSignalRows(){
    const snap=await resolvedDb.ref(qrisPath('signals')).once('value');
    return clone(snap?.val?.()||{});
  }

  let evidenceStarted=false,pendingReadyPromise=null,signalReadyPromise=null,pendingReadyResolve=null,pendingReadyReject=null,signalReadyResolve=null,signalReadyReject=null;
  const pendingSlices=Object.create(null),pendingReady=new Set(),reviewSignalRows={};
  const pendingOwnerCache=Object.create(null);

  function startEvidenceListeners(){
    if(evidenceStarted)return true;
    const pendingProbe=resolvedDb.ref(qrisPath('pending')),signalProbe=resolvedDb.ref(qrisPath('signals'));
    if(typeof pendingProbe?.orderByChild!=='function'||typeof signalProbe?.orderByChild!=='function')return false;
    pendingReadyPromise=new Promise((resolve,reject)=>{pendingReadyResolve=resolve;pendingReadyReject=reject});
    signalReadyPromise=new Promise((resolve,reject)=>{signalReadyResolve=resolve;signalReadyReject=reject});
    evidenceStarted=true;
    try{
      UNRESOLVED_STATUS.forEach(status=>{
        const ref=resolvedDb.ref(qrisPath('pending')).orderByChild('status').equalTo(status);
        if(typeof ref?.on!=='function')throw new Error('QRIS_S10A_PENDING_LISTENER_REQUIRED');
        ref.on('value',snap=>{
          const rows=clone(snap?.val?.()||{});pendingSlices[status]=rows;pendingReady.add(status);
          Object.entries(rows).forEach(([id,row])=>{pendingOwnerCache[String(id)]=text(row?.cashierId)});
          if(pendingReady.size===UNRESOLVED_STATUS.length&&pendingReadyResolve){pendingReadyResolve(true);pendingReadyResolve=null;pendingReadyReject=null}
        },error=>{if(pendingReadyReject){pendingReadyReject(error);pendingReadyResolve=null;pendingReadyReject=null}});
      });
      const signalRef=resolvedDb.ref(qrisPath('signals')).orderByChild('resolutionState').equalTo('REVIEW_REQUIRED');
      if(typeof signalRef?.on!=='function')throw new Error('QRIS_S10A_SIGNAL_LISTENER_REQUIRED');
      signalRef.on('value',snap=>{
        const rows=clone(snap?.val?.()||{});Object.keys(reviewSignalRows).forEach(key=>delete reviewSignalRows[key]);Object.assign(reviewSignalRows,rows);
        if(signalReadyResolve){signalReadyResolve(true);signalReadyResolve=null;signalReadyReject=null}
      },error=>{if(signalReadyReject){signalReadyReject(error);signalReadyResolve=null;signalReadyReject=null}});
      return true;
    }catch(error){
      if(pendingReadyReject){pendingReadyReject(error);pendingReadyResolve=null;pendingReadyReject=null}
      if(signalReadyReject){signalReadyReject(error);signalReadyResolve=null;signalReadyReject=null}
      return false;
    }
  }

  function cachedPendingRows(){
    const merged={};UNRESOLVED_STATUS.forEach(status=>Object.assign(merged,pendingSlices[status]||{}));return merged;
  }
  async function ownerForPendingId(id){
    const key=text(id);if(!key)return'';
    if(Object.prototype.hasOwnProperty.call(pendingOwnerCache,key))return pendingOwnerCache[key];
    const row=await readPending(key),owner=text(row?.cashierId);pendingOwnerCache[key]=owner;return owner;
  }
  async function findLateReviewSignals(cashierId=''){
    if(!startEvidenceListeners()){
      const owner=text(cashierId),signals=Object.values(await readSignalRows()).filter(row=>policy.isLateQuarantineStatus(row?.status)&&String(row?.resolutionState||'')==='REVIEW_REQUIRED'&&row?.autoMatchBlocked===true);
      let rows=signals;
      if(owner){const pending=await readPendingRows();rows=signals.filter(signal=>(signal?.lateCandidatePendingIds||[]).some(id=>String(pending?.[id]?.cashierId||'')===owner))}
      return rows.sort((a,b)=>Number(b?.lateDetectedAt||b?.firstSeenAt||0)-Number(a?.lateDetectedAt||a?.firstSeenAt||0));
    }
    await signalReadyPromise;
    const owner=text(cashierId),signals=Object.values(reviewSignalRows).filter(row=>policy.isLateQuarantineStatus(row?.status)&&String(row?.resolutionState||'')==='REVIEW_REQUIRED'&&row?.autoMatchBlocked===true);
    let rows=signals;
    if(owner){
      const ids=[...new Set(signals.flatMap(signal=>signal?.lateCandidatePendingIds||[]).map(text).filter(Boolean))];
      await Promise.all(ids.map(ownerForPendingId));
      rows=signals.filter(signal=>(signal?.lateCandidatePendingIds||[]).some(id=>pendingOwnerCache[text(id)]===owner));
    }
    return rows.sort((a,b)=>Number(b?.lateDetectedAt||b?.firstSeenAt||0)-Number(a?.lateDetectedAt||a?.firstSeenAt||0));
  }
  async function findOwnedUnresolvedParked(cashierId){
    if(!startEvidenceListeners()){
      const owner=text(cashierId),rows=Object.values(await readPendingRows()).filter(row=>String(row?.cashierId||'')===owner&&policy.isUnresolvedParkedPending(row));
      return rows.sort((a,b)=>Number(a?.parkedAt||a?.createdAt||0)-Number(b?.parkedAt||b?.createdAt||0));
    }
    await pendingReadyPromise;
    const owner=text(cashierId),rows=Object.values(cachedPendingRows()).filter(row=>String(row?.cashierId||'')===owner&&policy.isUnresolvedParkedPending(row));
    return rows.sort((a,b)=>Number(a?.parkedAt||a?.createdAt||0)-Number(b?.parkedAt||b?.createdAt||0));
  }

  const api=Object.freeze({
    phase:'RC01-S10A',db:resolvedDb,writer:settlementWriter,policy:Object.freeze({...policy}),
    readPending,readPendingRows,readSignal,readSignalRows,findOwnedUnresolvedParked,findLateReviewSignals,
    roots:Object.freeze({pos:POS_ROOT,qris:QRIS_ROOT})
  });
  Object.defineProperty(runtime,'__SJ_QRIS_DEFERRED_SETTLEMENT_RUNTIME',{value:api,writable:false,configurable:false,enumerable:false});
  return api;
}
