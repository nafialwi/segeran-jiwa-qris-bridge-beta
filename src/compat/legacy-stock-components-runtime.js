import { posPath } from '../data/firebase-client.js';
import { createInventoryRepository } from '../data/repositories/inventory-repository.js';
import { createStockComponentWriter } from '../data/writers/stock-component-writer.js';
import { createBrowserJsonStore } from '../data/local-store.js';
import { assertProductStockItemEligible } from '../domain/product-stock-components.js';

const RUNTIME_KEY='__SJ_LEGACY_STOCK_COMPONENTS_RUNTIME';
const WRAP_MARK='__sjR10StockComponentsWrapped';
const CORRECTION_MARK='__sjR10StockCorrectionHook';
const PENDING_KEY='segeran-jiwa.r10.stock-components.pending.v1';
const text=value=>String(value??'').trim();
const clone=value=>value==null?value:JSON.parse(JSON.stringify(value));
function coded(code,detail=''){const e=new Error(detail?`${code}:${detail}`:code);e.code=code;if(detail)e.detail=detail;return e}
function qty(value){const n=Number(value);return Number.isFinite(n)?n:0}
function lineProductId(line={}){return text(line.baseProductId??line.productId??line.id)}
function lineIdentity(line={}){const recipe=String(line.inventoryMode||'').toUpperCase()==='RECIPE';return recipe?`R:${lineProductId(line)}:${text(line.recipeVariantId)}`:`P:${lineProductId(line)}`}
export function stockSaleFingerprint(lines=[]){return JSON.stringify((Array.isArray(lines)?lines:[]).map(line=>[lineIdentity(line),qty(line.q??line.qty??line.quantity),qty(line.p??line.price)]))}
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
  const recipeIds=new Set(Object.entries(recipe).filter(([,v])=>qty(v)>0).map(([id])=>String(id))),mapped=new Set();
  for(const rows of Object.values(mapping||{}))for(const row of activeRows(rows))mapped.add(String(row.stockItemId));
  return [...mapped].filter(id=>recipeIds.has(id)).sort();
}
function storageAdapter(runtime,provided){
  let fallback={rows:[],issues:[],control:null},target=provided??null;
  if(!target){
    try{target=createBrowserJsonStore({runtime,key:PENDING_KEY})}catch(_){target=null}
  }
  function normalize(value){
    const source=value&&typeof value==='object'&&!Array.isArray(value)?value:{};
    return {
      rows:Array.isArray(source.rows)?clone(source.rows):[],
      issues:Array.isArray(source.issues)?clone(source.issues):[],
      control:source.control&&typeof source.control==='object'&&!Array.isArray(source.control)?clone(source.control):null
    };
  }
  function readEnvelope(){
    try{
      const value=target?.read?.();
      if(value&&typeof value==='object'&&!Array.isArray(value))fallback=normalize(value);
    }catch(_){}
    return clone(fallback);
  }
  function writeEnvelope(value){
    fallback=normalize(value);
    const payload={rows:clone(fallback.rows)};
    if(fallback.issues.length)payload.issues=clone(fallback.issues);
    if(fallback.control)payload.control=clone(fallback.control);
    try{if(typeof target?.write==='function')target.write(payload)}catch(_){}
    return clone(fallback);
  }
  return {
    load(){return readEnvelope().rows},
    save(rows){const value=readEnvelope();value.rows=clone(Array.isArray(rows)?rows:[]);writeEnvelope(value);return true},
    envelope(){return readEnvelope()},
    setControl(control){const value=readEnvelope();value.control=control&&typeof control==='object'?clone(control):null;writeEnvelope(value);return clone(value.control)},
    recordIssue(issue){
      const value=readEnvelope(),id=text(issue?.id);
      if(!id)return null;
      value.issues=value.issues.filter(row=>text(row?.id)!==id);
      value.issues.push(clone(issue));
      value.issues=value.issues.slice(-24);
      writeEnvelope(value);
      return clone(issue);
    }
  };
}
function roleOf(runtime){
  try{return text(runtime?.__SJ_SC03_RUNTIME?.guard?.currentRole?.()??runtime?.currentUserRole).toLowerCase()}catch(_){return text(runtime?.currentUserRole).toLowerCase()}
}
function assertSyncControlOwner(runtime){
  if(!['owner','manajemen'].includes(roleOf(runtime)))throw coded('STOCK_SYNC_CONTROL_OWNER_REQUIRED');
}
function notify(runtime,message,kind='warning'){try{if(typeof runtime?.showToast==='function')return runtime.showToast(message,kind)}catch(_){}try{runtime?.console?.warn?.(`[R10-STOCK/${kind}] ${message}`)}catch(_){}}
function defaultTransactionReader(getDb){
  return Object.freeze({
    async readById(shiftKey,txId){const snap=await getDb().ref(posPath(shiftKey,'tx',txId)).once('value');return clone(typeof snap?.val==='function'?snap.val():null)},
    async readRecent(shiftKey,startedAt){let ref=getDb().ref(posPath(shiftKey,'tx'));if(typeof ref?.orderByChild==='function'){ref=ref.orderByChild('ts');if(typeof ref?.startAt==='function')ref=ref.startAt(Math.max(0,Number(startedAt||0)-2000));if(typeof ref?.limitToLast==='function')ref=ref.limitToLast(12)}const snap=await ref.once('value');return clone(typeof snap?.val==='function'?snap.val():null)||{}}
  });
}
function correctionActor(updates,action){
  const row=Object.values(updates||{}).find(value=>value&&typeof value==='object'&&String(value.action||'').toUpperCase()===action)||{};
  return Object.freeze({id:text(row.userId),name:text(row.user),role:text(row.role)||'manajemen'});
}
export function correctionFromVerifiedUpdate(updates={},code=''){
  const entries=Object.entries(updates||{}),kind=String(code||'').toUpperCase();
  if(kind==='REFUND_ATOMIC_TIMEOUT'){
    const marker=entries.find(([key])=>/\/tx\/[^/]+\/lastRefundId$/.test(key));if(!marker)return null;
    const match=marker[0].match(/^(.+)\/tx\/([^/]+)\/lastRefundId$/);if(!match)return null;
    const shiftKey=match[1],txId=match[2],refundId=text(marker[1]);
    const refund=updates[`global/refunds/${refundId}`]||{};
    const refundLines=(Array.isArray(refund.items)?refund.items:[]).map(line=>{
      const rawIndex=Number(line?.lineIndex);
      const row={productId:lineProductId(line),q:qty(line?.q)};
      if(Number.isInteger(rawIndex)&&rawIndex>=0)row.lineIndex=rawIndex;
      return row;
    }).filter(line=>line.q>0);
    return Object.freeze({kind:'REFUND',shiftKey,txId,refundId,refundLines,returnStock:refund.returnStock!==false,transaction:{},actor:correctionActor(updates,'REFUND')});
  }
  if(kind==='VOID_ATOMIC_TIMEOUT'){
    const marker=entries.find(([key])=>/\/tx\/[^/]+\/voidId$/.test(key));if(!marker)return null;
    const match=marker[0].match(/^(.+)\/tx\/([^/]+)\/voidId$/);if(!match)return null;
    return Object.freeze({kind:'VOID',shiftKey:match[1],txId:match[2],voidId:text(marker[1]),transaction:{},actor:correctionActor(updates,'VOID')});
  }
  return null;
}
export function installLegacyStockComponentsRuntime(runtime=globalThis,{
  inventoryRepository=null,stockComponentWriter=null,legacyContext=null,transactionReader=null,storage=null,now=()=>Date.now(),autoRecover=true
}={}){
  if(runtime?.[RUNTIME_KEY])return runtime[RUNTIME_KEY];
  const context=legacyContext??runtime?.__SJ_LEGACY_STOCK_COMPONENT_CONTEXT??null,base=runtime?.processTransaction;
  if(!context||typeof context.snapshotSale!=='function'||typeof base!=='function')return Object.freeze({installed:false,reason:'LEGACY_STOCK_CONTEXT_UNAVAILABLE',recoverPending:async()=>[]});
  let repository=inventoryRepository,writer=stockComponentWriter,reader=transactionReader;
  const pending=storageAdapter(runtime,storage);
  function db(){const value=runtime?.firebase?.database?.();if(!value)throw coded('STOCK_COMPONENT_DATABASE_REQUIRED');return value}
  function repo(){return repository||(repository=createInventoryRepository({db:db(),consumer:'legacy-stock-components-runtime'}))}
  function stockWriter(){return writer||(writer=createStockComponentWriter({db:db(),now,serverTimestamp:()=>runtime?.firebase?.database?.ServerValue?.TIMESTAMP??now()}))}
  function txReader(){return reader||(reader=defaultTransactionReader(db))}
  async function mappingSnapshot(cart){const productIds=[...new Set((cart||[]).map(lineProductId).filter(Boolean))],mapping={},stockIds=new Set();for(const productId of productIds){const rows=await repo().readProductStockComponents(productId),active=activeRows(rows);if(!active.length)continue;mapping[productId]=rows||{};active.forEach(row=>stockIds.add(String(row.stockItemId)))}if(!Object.keys(mapping).length)return null;const stockItems={};for(const stockItemId of stockIds){const item=await repo().readStockItem(stockItemId);assertProductStockItemEligible(item,stockItemId);stockItems[stockItemId]=item}return Object.freeze({mapping,stockItems})}
  function putPending(job,error=null){
    const rows=pending.load(),previous=rows.find(x=>x?.id===job?.id),kept=rows.filter(x=>x?.id!==job?.id);
    const priorAttempts=Number(previous?.recovery?.attempts||job?.recovery?.attempts||0);
    const lastCode=text(error?.code||error?.message||job?.recovery?.lastCode);
    const next={...clone(previous||{}),...clone(job),recovery:{attempts:priorAttempts+(error?1:0),lastCode,lastAt:error?now():Number(previous?.recovery?.lastAt||job?.recovery?.lastAt||0)}};
    kept.push(next);pending.save(kept.slice(-24));return clone(next);
  }
  function dropPending(id){pending.save(pending.load().filter(x=>x?.id!==id))}
  function recordShortage(result={}){
    const applicationId=text(result?.applicationId);
    if(!applicationId)return null;
    return pending.recordIssue({id:'SHORTAGE:'+applicationId,kind:'SHORTAGE',code:'STOCK_COMPONENT_SHORTAGE',applicationId,shortageItems:Array.isArray(result?.shortageItems)?result.shortageItems.map(String):[],at:now()});
  }
  function syncEnabled(){return pending.envelope()?.control?.enabled!==false}
  function health(){
    const envelope=pending.envelope(),rows=Array.isArray(envelope.rows)?envelope.rows:[],issues=Array.isArray(envelope.issues)?envelope.issues:[];
    const pendingKinds={sale:0,refund:0,void:0};
    for(const job of rows){if(job?.kind==='SALE_MATCH')pendingKinds.sale++;else if(job?.kind==='REFUND_RESTORE')pendingKinds.refund++;else if(job?.kind==='VOID_RESTORE')pendingKinds.void++}
    const shortages=issues.filter(row=>row?.kind==='SHORTAGE'),lastPending=[...rows].reverse().find(row=>text(row?.recovery?.lastCode)),lastIssue=issues[issues.length-1]||null,enabled=envelope?.control?.enabled!==false;
    return Object.freeze({enabled,state:!enabled?'DISABLED':(rows.length||shortages.length?'ATTENTION':'HEALTHY'),pendingCount:rows.length,shortageCount:shortages.length,pendingKinds:Object.freeze(pendingKinds),lastErrorCode:text(lastPending?.recovery?.lastCode||lastIssue?.code),controlReason:text(envelope?.control?.reason)});
  }
  function pendingJobs(){return Object.freeze(pending.load().map(job=>Object.freeze({id:text(job?.id),kind:text(job?.kind),shiftKey:text(job?.shiftKey),txId:text(job?.txId),correctionId:text(job?.correctionId),recovery:Object.freeze({...clone(job?.recovery||{})})})))}
  function setSyncEnabled(enabled,{reason=''}={}){
    assertSyncControlOwner(runtime);
    pending.setControl({enabled:enabled===true,reason:text(reason),changedAt:now(),changedBy:text(runtime?.currentLoginId??runtime?.currentUserId??runtime?.currentUserName)});
    notify(runtime,enabled===true?'Sinkronisasi pemakaian stok diaktifkan kembali.':'Sinkronisasi pemakaian stok dihentikan pada perangkat ini.',enabled===true?'success':'warning');
    return health();
  }
  async function resolveSale(job,candidateTxId=''){const endedAt=now(),directId=text(candidateTxId);if(directId){const transaction=await txReader().readById(job.shiftKey,directId);if(validCandidate({txId:directId,transaction,beforeKeys:job.beforeKeys,fingerprint:job.fingerprint,startedAt:job.startedAt,endedAt}))return Object.freeze({txId:directId,transaction})}const recent=await txReader().readRecent(job.shiftKey,job.startedAt);return matchCompletedStockSale({beforeKeys:job.beforeKeys,after:recent,fingerprint:job.fingerprint,startedAt:job.startedAt,endedAt})}
  async function applyMatched({shiftKey,match,mapping,stockItems,actor,jobId}){const overlap=overlapIds(match.transaction,mapping);if(overlap.length)throw coded('STOCK_COMPONENT_RECIPE_OVERLAP',overlap.join(','));const result=await stockWriter().applyCompletedSale({shiftKey,txId:match.txId,transaction:match.transaction,mapping,stockItems,actor});if(result?.status==='SHORTAGE'){recordShortage(result);notify(runtime,'Transaksi tersimpan, tetapi stok komponen tidak mencukupi. Perlu perhatian.','warning')}if(jobId)dropPending(jobId);return result}
  async function recoverSale(job){const match=await resolveSale(job,job.candidateTxId);return applyMatched({...job,match,jobId:job.id})}
  function historicalNoApplication(error){return ['STOCK_RESTORE_APPLICATION_NOT_FOUND','STOCK_RESTORE_APPLICATION_NOT_COMPLETED'].includes(String(error?.code||''))}
  async function runCorrection(job){if(job.kind==='REFUND_RESTORE')return stockWriter().restoreRefund({shiftKey:job.shiftKey,txId:job.txId,refundId:job.correctionId,refundLines:job.refundLines||[],transaction:job.transaction||{},actor:job.actor||{}});if(job.kind==='VOID_RESTORE')return stockWriter().restoreVoid({shiftKey:job.shiftKey,txId:job.txId,voidId:job.correctionId,transaction:job.transaction||{},actor:job.actor||{}});throw coded('STOCK_CORRECTION_KIND_INVALID',job.kind)}
  async function afterCorrection(kind,input={}){const correctionId=text(kind==='REFUND'?input.refundId:input.voidId);if(!input.shiftKey||!input.txId||!correctionId)throw coded('STOCK_CORRECTION_CONTEXT_REQUIRED');const job={id:kind+'_RESTORE:'+input.shiftKey+':'+input.txId+':'+correctionId,kind:kind==='REFUND'?'REFUND_RESTORE':'VOID_RESTORE',shiftKey:text(input.shiftKey),txId:text(input.txId),correctionId,refundLines:clone(input.refundLines||[]),transaction:clone(input.transaction||{}),actor:clone(input.actor||{})};if(!syncEnabled()){const error=coded('STOCK_SYNC_DISABLED');putPending(job,error);notify(runtime,'Koreksi finansial tersimpan, tetapi sinkronisasi stok sedang dihentikan. Pemulihan stok ditandai tertunda.','warning');return Object.freeze({status:'PENDING',code:error.code})}try{const result=await runCorrection(job);dropPending(job.id);return Object.freeze({status:'COMPLETED',result})}catch(error){if(historicalNoApplication(error)){dropPending(job.id);return Object.freeze({status:'SKIPPED',reason:'NO_STOCK_APPLICATION'})}putPending(job,error);notify(runtime,'Koreksi finansial tersimpan, tetapi pemulihan stok komponen perlu perhatian.','warning');try{runtime?.console?.warn?.('[R10-STOCK] correction restore pending',error)}catch(_){}return Object.freeze({status:'PENDING',code:String(error?.code||error?.message||'STOCK_RESTORE_FAILED')})}}
  async function afterRefund(input){return afterCorrection('REFUND',input)}
  async function afterVoid(input){return afterCorrection('VOID',input)}
  async function retryPending(targetId=''){const rows=pending.load().filter(job=>!targetId||text(job?.id)===text(targetId));if(!syncEnabled())return rows.map(job=>({id:job?.id,status:'DISABLED',code:'STOCK_SYNC_DISABLED'}));const out=[];for(const job of rows){try{if(job?.kind==='SALE_MATCH')out.push({id:job.id,status:'COMPLETED',result:await recoverSale(job)});else if(job?.kind==='REFUND_RESTORE'||job?.kind==='VOID_RESTORE'){const result=await runCorrection(job);dropPending(job.id);out.push({id:job.id,status:'COMPLETED',result})}}catch(error){if((job?.kind==='REFUND_RESTORE'||job?.kind==='VOID_RESTORE')&&historicalNoApplication(error)){dropPending(job.id);out.push({id:job.id,status:'SKIPPED',code:'NO_STOCK_APPLICATION'});continue}putPending(job,error);out.push({id:job?.id,status:'PENDING',code:String(error?.code||error?.message||'RECOVERY_FAILED')})}}return out}
  async function recoverPending(){return retryPending()}
  async function wrappedProcessTransaction(...args){const snap=clone(context.snapshotSale?.()||{}),cart=Array.isArray(snap.cart)?snap.cart:[];if(!snap.shiftKey||!cart.length)return base.apply(this,args);const fingerprint=stockSaleFingerprint(cart),startedAt=Number(snap.capturedAt||now()),beforeKeys=Array.isArray(snap.preTxKeys)?snap.preTxKeys.map(String):[];let maps=null;try{maps=await mappingSnapshot(cart)}catch(error){notify(runtime,'Pemetaan stok belum dapat diverifikasi. Transaksi diblokir agar stok tidak terlewat.','error');return false}if(maps&&!syncEnabled()){notify(runtime,'Transaksi memakai Pemakaian Stok, tetapi sinkronisasi stok sedang dihentikan. Aktifkan kembali sebelum menjual produk ini.','error');return false}const result=await base.apply(this,args);if(!maps)return result;const candidateTxId=text(result),job={id:'SALE_MATCH:'+snap.shiftKey+':'+(candidateTxId||startedAt)+':'+fingerprint,kind:'SALE_MATCH',shiftKey:text(snap.shiftKey),beforeKeys,fingerprint,startedAt,candidateTxId,mapping:maps.mapping,stockItems:maps.stockItems,actor:snap.actor||{}};try{const match=await resolveSale(job,candidateTxId);await applyMatched({...job,match})}catch(error){putPending(job,error);notify(runtime,'Transaksi sudah tersimpan, tetapi sinkron stok komponen perlu perhatian.','warning');try{runtime?.console?.warn?.('[R10-STOCK] sale component application pending',error)}catch(_){}}return result}
  try{Object.defineProperty(wrappedProcessTransaction,WRAP_MARK,{value:true,enumerable:false})}catch(_){wrappedProcessTransaction[WRAP_MARK]=true}
  runtime.processTransaction=wrappedProcessTransaction;
  let correctionOwner=null,baseVerified=null,wrappedVerified=null;
  if(runtime?.SJProductionHardening&&typeof runtime.SJProductionHardening.verifiedUpdate==='function'){
    correctionOwner=runtime.SJProductionHardening;baseVerified=correctionOwner.verifiedUpdate;
    if(!baseVerified?.[CORRECTION_MARK]){
      wrappedVerified=async function(updates,code,verify){const result=await baseVerified.call(this,updates,code,verify);const correction=correctionFromVerifiedUpdate(updates,code);if(correction){if(correction.kind==='REFUND'){if(correction.returnStock!==false)await afterRefund(correction)}else await afterVoid(correction)}return result};
      try{Object.defineProperty(wrappedVerified,CORRECTION_MARK,{value:true,enumerable:false})}catch(_){wrappedVerified[CORRECTION_MARK]=true}
      correctionOwner.verifiedUpdate=wrappedVerified;
    }
  }
  const api=Object.freeze({installed:true,health,pendingJobs,retryPending,recoverPending,setSyncEnabled,afterRefund,afterVoid,stop(){try{if(runtime.processTransaction===wrappedProcessTransaction)runtime.processTransaction=base}catch(_){}try{if(correctionOwner&&wrappedVerified&&correctionOwner.verifiedUpdate===wrappedVerified)correctionOwner.verifiedUpdate=baseVerified}catch(_){}}});
  try{Object.defineProperty(runtime,RUNTIME_KEY,{value:api,writable:false,configurable:false,enumerable:false})}catch(_){runtime[RUNTIME_KEY]=api}
  if(autoRecover){const schedule=typeof runtime?.setTimeout==='function'?runtime.setTimeout.bind(runtime):setTimeout;schedule(()=>{recoverPending().catch(()=>{})},0)}
  return api;
}
