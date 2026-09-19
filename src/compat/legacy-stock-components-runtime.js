import { posPath } from '../data/firebase-client.js';
import { createInventoryRepository } from '../data/repositories/inventory-repository.js';
import { createStockComponentWriter } from '../data/writers/stock-component-writer.js';
import { createBrowserJsonStore } from '../data/local-store.js';

const RUNTIME_KEY='__SJ_LEGACY_STOCK_COMPONENTS_RUNTIME';
const WRAP_MARK='__sjR10StockComponentsWrapped';
const PENDING_KEY='segeran-jiwa.r10.stock-components.pending.v1';
const text=value=>String(value??'').trim();
const clone=value=>value==null?value:JSON.parse(JSON.stringify(value));
function coded(code,detail=''){const e=new Error(detail?`${code}:${detail}`:code);e.code=code;if(detail)e.detail=detail;return e}
function qty(value){const n=Number(value);return Number.isFinite(n)?n:0}
function lineProductId(line={}){return text(line.baseProductId??line.productId??line.id)}
function lineIdentity(line={}){
  const recipe=String(line.inventoryMode||'').toUpperCase()==='RECIPE';
  return recipe?`R:${lineProductId(line)}:${text(line.recipeVariantId)}`:`P:${lineProductId(line)}`;
}
export function stockSaleFingerprint(lines=[]){
  return JSON.stringify((Array.isArray(lines)?lines:[]).map(line=>[lineIdentity(line),qty(line.q??line.qty??line.quantity),qty(line.p??line.price)]));
}
function txLines(tx={}){return Array.isArray(tx.cartData)?tx.cartData:(Array.isArray(tx.items)?tx.items:[])}
function validCandidate({txId,transaction,beforeKeys=[],fingerprint,startedAt,endedAt}={}){
  if(!text(txId)||!transaction||typeof transaction!=='object')return false;
  if(new Set((beforeKeys||[]).map(String)).has(String(txId)))return false;
  if(String(transaction.status||'').toUpperCase()!=='COMPLETED')return false;
  const ts=Number(transaction.ts||0),lo=Number(startedAt||0)-2000,hi=Number(endedAt||Date.now())+5000;
  if(ts&&((lo&&ts<lo)||(hi&&ts>hi)))return false;
  return stockSaleFingerprint(txLines(transaction))===fingerprint;
}
export function matchCompletedStockSale({beforeKeys=[],after={},fingerprint,startedAt,endedAt}={}){
  const rows=Object.entries(after||{}).filter(([txId,transaction])=>validCandidate({txId,transaction,beforeKeys,fingerprint,startedAt,endedAt}));
  if(rows.length===1)return Object.freeze({txId:String(rows[0][0]),transaction:rows[0][1]});
  if(rows.length>1)throw coded('STOCK_TX_MATCH_AMBIGUOUS',rows.map(([key])=>key).join(','));
  throw coded('STOCK_TX_MATCH_NOT_FOUND');
}
function activeRows(mapping){
  if(Array.isArray(mapping))return mapping.filter(row=>row&&row.active!==false&&text(row.stockItemId??row.itemId??row.id));
  return Object.entries(mapping||{}).map(([stockItemId,value])=>value&&typeof value==='object'?{stockItemId,...value}:{stockItemId,qtyPerUnit:value,active:true}).filter(row=>row&&row.active!==false&&text(row.stockItemId));
}
function overlapIds(transaction,mapping){
  const recipe=transaction?.inventoryRecipeAppliedConsumption||transaction?.inventoryRecipeConsumption||{};
  const recipeIds=new Set(Object.entries(recipe).filter(([,v])=>qty(v)>0).map(([id])=>String(id)));
  const mapped=new Set();
  for(const rows of Object.values(mapping||{}))for(const row of activeRows(rows))mapped.add(String(row.stockItemId));
  return [...mapped].filter(id=>recipeIds.has(id)).sort();
}
function storageAdapter(runtime,provided){
  let fallback=[],target=provided??null;
  if(!target){
    try{target=createBrowserJsonStore({runtime,key:PENDING_KEY})}catch(_){target=null}
  }
  return {
    load(){
      try{
        const value=target?.read?.(),rows=Array.isArray(value?.rows)?value.rows:null;
        if(rows){fallback=clone(rows);return clone(rows)}
      }catch(_){}
      return clone(fallback);
    },
    save(rows){
      fallback=clone(Array.isArray(rows)?rows:[]);
      try{
        if(typeof target?.write==='function')target.write({rows:clone(fallback)});
        return true;
      }catch(_){return false}
    }
  };
}
function notify(runtime,message,kind='warning'){
  try{if(typeof runtime?.showToast==='function')return runtime.showToast(message,kind)}catch(_){}
  try{runtime?.console?.warn?.(`[R10-STOCK/${kind}] ${message}`)}catch(_){}
}
function defaultTransactionReader(getDb){
  return Object.freeze({
    async readById(shiftKey,txId){
      const snap=await getDb().ref(posPath(shiftKey,'tx',txId)).once('value');
      return clone(typeof snap?.val==='function'?snap.val():null);
    },
    async readRecent(shiftKey,startedAt){
      let ref=getDb().ref(posPath(shiftKey,'tx'));
      if(typeof ref?.orderByChild==='function'){
        ref=ref.orderByChild('ts');
        if(typeof ref?.startAt==='function')ref=ref.startAt(Math.max(0,Number(startedAt||0)-2000));
        if(typeof ref?.limitToLast==='function')ref=ref.limitToLast(12);
      }
      const snap=await ref.once('value');
      return clone(typeof snap?.val==='function'?snap.val():null)||{};
    }
  });
}
export function installLegacyStockComponentsRuntime(runtime=globalThis,{
  inventoryRepository=null,
  stockComponentWriter=null,
  legacyContext=null,
  transactionReader=null,
  storage=null,
  now=()=>Date.now(),
  autoRecover=true
}={}){
  if(runtime?.[RUNTIME_KEY])return runtime[RUNTIME_KEY];
  const context=legacyContext??runtime?.__SJ_LEGACY_STOCK_COMPONENT_CONTEXT??null;
  const base=runtime?.processTransaction;
  if(!context||typeof context.snapshotSale!=='function'||typeof base!=='function'){
    return Object.freeze({installed:false,reason:'LEGACY_STOCK_CONTEXT_UNAVAILABLE',recoverPending:async()=>[]});
  }
  let repository=inventoryRepository,writer=stockComponentWriter,reader=transactionReader;
  const pending=storageAdapter(runtime,storage);
  function db(){const value=runtime?.firebase?.database?.();if(!value)throw coded('STOCK_COMPONENT_DATABASE_REQUIRED');return value}
  function repo(){return repository||(repository=createInventoryRepository({db:db(),consumer:'legacy-stock-components-runtime'}))}
  function stockWriter(){return writer||(writer=createStockComponentWriter({db:db(),now,serverTimestamp:()=>runtime?.firebase?.database?.ServerValue?.TIMESTAMP??now()}))}
  function txReader(){return reader||(reader=defaultTransactionReader(db))}
  async function mappingSnapshot(cart){
    const productIds=[...new Set((cart||[]).map(lineProductId).filter(Boolean))];
    const mapping={};const stockIds=new Set();
    for(const productId of productIds){
      const rows=await repo().readProductStockComponents(productId),active=activeRows(rows);
      if(!active.length)continue;
      mapping[productId]=rows||{};active.forEach(row=>stockIds.add(String(row.stockItemId)));
    }
    if(!Object.keys(mapping).length)return null;
    const stockItems={};
    for(const stockItemId of stockIds){
      const item=await repo().readStockItem(stockItemId);
      if(!item)throw coded('STOCK_ITEM_NOT_FOUND',stockItemId);
      stockItems[stockItemId]=item;
    }
    return Object.freeze({mapping,stockItems});
  }
  function putPending(job){const rows=pending.load().filter(x=>x?.id!==job.id);rows.push(clone(job));pending.save(rows.slice(-24))}
  function dropPending(id){pending.save(pending.load().filter(x=>x?.id!==id))}
  async function resolveSale(job,candidateTxId=''){
    const endedAt=now(),directId=text(candidateTxId);
    if(directId){
      const transaction=await txReader().readById(job.shiftKey,directId);
      if(validCandidate({txId:directId,transaction,beforeKeys:job.beforeKeys,fingerprint:job.fingerprint,startedAt:job.startedAt,endedAt})){
        return Object.freeze({txId:directId,transaction});
      }
    }
    const recent=await txReader().readRecent(job.shiftKey,job.startedAt);
    return matchCompletedStockSale({beforeKeys:job.beforeKeys,after:recent,fingerprint:job.fingerprint,startedAt:job.startedAt,endedAt});
  }
  async function applyMatched({shiftKey,match,mapping,stockItems,actor,jobId}){
    const overlap=overlapIds(match.transaction,mapping);
    if(overlap.length)throw coded('STOCK_COMPONENT_RECIPE_OVERLAP',overlap.join(','));
    const result=await stockWriter().applyCompletedSale({shiftKey,txId:match.txId,transaction:match.transaction,mapping,stockItems,actor});
    if(result?.status==='SHORTAGE')notify(runtime,'Transaksi tersimpan, tetapi stok komponen tidak mencukupi. Perlu perhatian.','warning');
    if(jobId)dropPending(jobId);
    return result;
  }
  async function recoverOne(job){
    const match=await resolveSale(job,job.candidateTxId);
    return applyMatched({...job,match,jobId:job.id});
  }
  async function recoverPending(){
    const out=[];
    for(const job of pending.load()){
      if(job?.kind!=='SALE_MATCH')continue;
      try{out.push({id:job.id,status:'COMPLETED',result:await recoverOne(job)})}
      catch(error){out.push({id:job?.id,status:'PENDING',code:String(error?.code||error?.message||'RECOVERY_FAILED')})}
    }
    return out;
  }
  async function wrappedProcessTransaction(...args){
    const snap=clone(context.snapshotSale?.()||{}),cart=Array.isArray(snap.cart)?snap.cart:[];
    if(!snap.shiftKey||!cart.length)return base.apply(this,args);
    const fingerprint=stockSaleFingerprint(cart),startedAt=Number(snap.capturedAt||now()),beforeKeys=Array.isArray(snap.preTxKeys)?snap.preTxKeys.map(String):[];
    let maps=null;
    try{maps=await mappingSnapshot(cart)}
    catch(error){notify(runtime,'Pemetaan stok belum dapat diverifikasi. Transaksi diblokir agar stok tidak terlewat.','error');return false}
    const result=await base.apply(this,args);
    if(!maps)return result;
    const candidateTxId=text(result);
    const job={id:`SALE_MATCH:${snap.shiftKey}:${candidateTxId||startedAt}:${fingerprint}`,kind:'SALE_MATCH',shiftKey:text(snap.shiftKey),beforeKeys,fingerprint,startedAt,candidateTxId,mapping:maps.mapping,stockItems:maps.stockItems,actor:snap.actor||{}};
    try{const match=await resolveSale(job,candidateTxId);await applyMatched({...job,match})}
    catch(error){putPending(job);notify(runtime,'Transaksi sudah tersimpan, tetapi sinkron stok komponen perlu perhatian.','warning');try{runtime?.console?.warn?.('[R10-STOCK] sale component application pending',error)}catch(_){}}
    return result;
  }
  try{Object.defineProperty(wrappedProcessTransaction,WRAP_MARK,{value:true,enumerable:false})}catch(_){wrappedProcessTransaction[WRAP_MARK]=true}
  runtime.processTransaction=wrappedProcessTransaction;
  const api=Object.freeze({installed:true,recoverPending,stop(){try{if(runtime.processTransaction===wrappedProcessTransaction)runtime.processTransaction=base}catch(_){}}});
  try{Object.defineProperty(runtime,RUNTIME_KEY,{value:api,writable:false,configurable:false,enumerable:false})}catch(_){runtime[RUNTIME_KEY]=api}
  if(autoRecover){const schedule=typeof runtime?.setTimeout==='function'?runtime.setTimeout.bind(runtime):setTimeout;schedule(()=>{recoverPending().catch(()=>{})},0)}
  return api;
}
