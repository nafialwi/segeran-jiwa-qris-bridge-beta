import { POS_ROOT, QRIS_ROOT, posPath } from '../data/firebase-client.js';
import { createFinanceRepository } from '../data/repositories/finance-repository.js';
import { createFinanceWriter } from '../data/writers/finance-writer.js';
import { createQrisCashOutCoordinator } from '../data/writers/qris-cash-out-coordinator.js';
import { createPurchaseReconciliationWriter } from '../data/writers/purchase-reconciliation-writer.js';
import { createLegacySensitiveAuthorizer } from '../core/sensitive-authorizer.js';
import { createFinanceV33Service } from '../domain/finance-v33-service.js';

function resolveLegacyDb(runtime){
  if(runtime?.__SJ_P4_DB)return runtime.__SJ_P4_DB;
  try{return runtime?.Function?runtime.Function('try{return typeof db!=="undefined"?db:null}catch(_){return null}')():null}catch(_){return null}
}
function legacyRequester(runtime){
  return ()=>{
    try{
      if(!runtime?.Function)return {role:'cashier',id:'',name:'',shiftKey:'',sessionId:''};
      const row=runtime.Function('try{return {role:typeof currentUserRole!=="undefined"?currentUserRole:null,id:typeof currentLoginId!=="undefined"?currentLoginId:"",name:typeof currentUserName!=="undefined"?currentUserName:"",shiftKey:typeof activeDate!=="undefined"?activeDate:""}}catch(_){return {}}')()||{};
      try{row.sessionId=String(runtime?.SJShift?.currentSessionId?.()||'')}catch(_){row.sessionId=''}
      return row;
    }catch(_){return {role:'cashier',id:'',name:'',shiftKey:'',sessionId:''}}
  };
}
function drawerReader(db,readRequester){
  return async()=>{
    const shiftKey=String(readRequester()?.shiftKey||'').trim();if(!shiftKey)return 0;
    const snap=await db.ref(posPath(shiftKey,'uangLaci')).once('value');return Number(snap?.val?.())||0;
  };
}

export function installP4FinanceRuntime(runtime=globalThis,{sc03=runtime?.__SJ_SC03_RUNTIME,db=null,repository=null,writer=null,reconciliationWriter=null,authorizer=null,qrisCashOut=null,readRequester=null,readDrawerCash=null,now=()=>Date.now(),random=Math.random}={}){
  if(runtime?.__SJ_P4_FINANCE_RUNTIME)return runtime.__SJ_P4_FINANCE_RUNTIME;
  const resolvedDb=db??resolveLegacyDb(runtime);
  if(!resolvedDb||typeof resolvedDb.ref!=='function')throw new Error('P4_FINANCE_DB_REQUIRED');
  const requester=readRequester??legacyRequester(runtime);
  const repo=repository??createFinanceRepository({db:resolvedDb});
  const financeWriter=writer??createFinanceWriter({db:resolvedDb,now});
  const purchaseReconciliationWriter=reconciliationWriter??createPurchaseReconciliationWriter({db:resolvedDb,now});
  const auth=authorizer??createLegacySensitiveAuthorizer({runtime,db:resolvedDb,readRequester:requester,now});
  const transactionService=sc03?.services?.transaction;
  const cashOut=qrisCashOut??createQrisCashOutCoordinator({db:resolvedDb,transactionService,readRequester:requester,readDrawerCash:readDrawerCash??drawerReader(resolvedDb,requester),now,random});
  const finance=createFinanceV33Service({repository:repo,writer:financeWriter,reconciliationWriter:purchaseReconciliationWriter,openExpense:()=>sc03?.features?.openOperational?.(7)});
  const api=Object.freeze({phase:'P4-v3.3',db:resolvedDb,repository:repo,writer:financeWriter,purchaseReconciliationWriter,authorizer:auth,finance,qrisCashOut:cashOut,roots:Object.freeze({pos:POS_ROOT,qris:QRIS_ROOT})});
  Object.defineProperty(runtime,'__SJ_P4_FINANCE_RUNTIME',{value:api,writable:false,configurable:false,enumerable:false});
  return api;
}
