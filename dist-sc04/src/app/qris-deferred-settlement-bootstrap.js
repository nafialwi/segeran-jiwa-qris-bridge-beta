import { POS_ROOT, QRIS_ROOT, qrisPath } from '../data/firebase-client.js';
import { createQrisDeferredSettlementWriter } from '../data/writers/qris-deferred-settlement-writer.js';
import * as policy from '../domain/qris-deferred-settlement-policy.js';

const clone=v=>v==null?v:JSON.parse(JSON.stringify(v));
const text=v=>String(v??'').trim();

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
  async function readSignalRows(){
    const snap=await resolvedDb.ref(qrisPath('signals')).once('value');
    return clone(snap?.val?.()||{});
  }
  async function findLateReviewSignals(cashierId=''){
    const owner=text(cashierId),signals=Object.values(await readSignalRows()).filter(row=>policy.isLateQuarantineStatus(row?.status)&&String(row?.resolutionState||'')==='REVIEW_REQUIRED'&&row?.autoMatchBlocked===true);
    let rows=signals;
    if(owner){
      const pending=await readPendingRows();
      rows=signals.filter(signal=>(signal?.lateCandidatePendingIds||[]).some(id=>String(pending?.[id]?.cashierId||'')===owner));
    }
    return rows.sort((a,b)=>Number(b?.lateDetectedAt||b?.firstSeenAt||0)-Number(a?.lateDetectedAt||a?.firstSeenAt||0));
  }
  async function findOwnedUnresolvedParked(cashierId){
    const owner=text(cashierId),rows=Object.values(await readPendingRows()).filter(row=>String(row?.cashierId||'')===owner&&policy.isUnresolvedParkedPending(row));
    return rows.sort((a,b)=>Number(a?.parkedAt||a?.createdAt||0)-Number(b?.parkedAt||b?.createdAt||0));
  }

  const api=Object.freeze({
    phase:'RC01-S10A',db:resolvedDb,writer:settlementWriter,policy:Object.freeze({...policy}),
    readPending,readPendingRows,readSignalRows,findOwnedUnresolvedParked,findLateReviewSignals,
    roots:Object.freeze({pos:POS_ROOT,qris:QRIS_ROOT})
  });
  Object.defineProperty(runtime,'__SJ_QRIS_DEFERRED_SETTLEMENT_RUNTIME',{value:api,writable:false,configurable:false,enumerable:false});
  return api;
}
