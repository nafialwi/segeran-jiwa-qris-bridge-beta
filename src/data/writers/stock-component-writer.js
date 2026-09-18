import { posPath } from '../firebase-client.js';
import {
  buildApplicationSnapshot,
  normalizeStockComponents,
  stockApplicationId,
  stockComponentFingerprint
} from '../../domain/product-stock-components.js';

const text=value=>String(value??'').trim();
const roleOf=actor=>text(actor?.role).toLowerCase();
const clone=value=>value==null?value:JSON.parse(JSON.stringify(value));
const nowIso=value=>new Date(value).toISOString();

const inventoryRootPath=()=>posPath('global','inventoryV2');
const mappingPath=productId=>posPath('global','inventoryV2','productStockComponents',productId);
const applicationPath=applicationId=>posPath('global','inventoryV2','stockApplications',applicationId);
const balancePath=stockItemId=>posPath('global','inventoryV2','balances','ingredients',stockItemId);

function fail(code,detail=''){
  const error=new Error(detail?`${code}:${detail}`:code);
  error.code=code;
  if(detail)error.detail=detail;
  throw error;
}

function assertKey(value,label){
  const key=text(value);
  if(!key||/[.#$/\[\]]/.test(key))fail('STOCK_COMPONENT_KEY_INVALID',label);
  return key;
}

function assertOwner(actor){
  const role=roleOf(actor);
  if(role!=='owner'&&role!=='manajemen')fail('STOCK_COMPONENT_CONFIG_OWNER_REQUIRED');
}

function assertSaleActor(actor){
  const role=roleOf(actor);
  if(!['owner','manajemen','cashier','kasir','transaksi'].includes(role)){
    fail('STOCK_COMPONENT_SALE_ACTOR_REQUIRED');
  }
}

const operationId=(kind,referenceId,stockItemId)=>
  `SCOP_${stockComponentFingerprint({kind,referenceId,stockItemId}).slice(4)}`;

const movementId=(kind,referenceId,stockItemId)=>
  `SCMV_${stockComponentFingerprint({kind,referenceId,stockItemId}).slice(4)}`;

function snapshotValue(result){
  return result?.snapshot&&typeof result.snapshot.val==='function'?result.snapshot.val():null;
}

function linesFromTransaction(transaction={}){
  const lines=transaction.cartData??transaction.cart??transaction.items??transaction.lines??[];
  return Array.isArray(lines)?lines:[];
}

function normalizedConfigRows(components,actor,now){
  const rows={};
  for(const row of normalizeStockComponents(components)){
    const stockItemId=assertKey(row.stockItemId,'stockItemId');
    rows[stockItemId]={
      stockItemId,
      qtyPerUnit:row.qtyPerUnit,
      active:row.active,
      updatedAt:now(),
      updatedBy:text(actor?.id)
    };
  }
  return rows;
}

export function createStockComponentWriter({
  db,
  now=()=>Date.now(),
  serverTimestamp=()=>Date.now()
}={}){
  if(!db||typeof db.ref!=='function')fail('STOCK_COMPONENT_WRITE_CLIENT_REQUIRED');
  void serverTimestamp;

  async function saveProductComponents({productId,components={},actor={}}={}){
    assertOwner(actor);
    const pid=assertKey(productId,'productId');
    const rows=normalizedConfigRows(components,actor,now);
    const result=await db.ref(mappingPath(pid)).transaction(()=>clone(rows));
    if(!result?.committed)fail('STOCK_COMPONENT_CONFIG_WRITE_ABORTED',pid);
    return Object.freeze({productId:pid,components:clone(snapshotValue(result))||{}});
  }

  async function readApplication({shiftKey,txId}={}){
    const applicationId=stockApplicationId(shiftKey,txId);
    const snap=await db.ref(applicationPath(applicationId)).once('value');
    return clone(typeof snap?.val==='function'?snap.val():null);
  }

  async function claimApplication({shiftKey,txId,snapshot,actor}){
    const applicationId=stockApplicationId(shiftKey,txId);
    let created=false;
    const result=await db.ref(applicationPath(applicationId)).transaction(current=>{
      created=!current;
      if(current)return current;
      return {
        id:applicationId,
        kind:'SALE',
        status:'CLAIMED',
        shiftKey:text(shiftKey),
        txId:text(txId),
        snapshot:clone(snapshot),
        createdAt:now(),
        createdBy:text(actor?.id)
      };
    });
    const application=clone(snapshotValue(result));
    if(!application)fail('STOCK_COMPONENT_APPLICATION_CLAIM_FAILED',applicationId);
    return {applicationId,application,created};
  }

  async function transactApplyComponent(applicationId,component){
    const stockItemId=assertKey(component.stockItemId,'stockItemId');
    const requiredQty=Number(component.appliedQty);
    if(!Number.isFinite(requiredQty)||requiredQty<=0)fail('STOCK_COMPONENT_APPLIED_QTY_INVALID',stockItemId);
    const op=operationId('SALE',applicationId,stockItemId);

    const result=await db.ref(balancePath(stockItemId)).transaction(current=>{
      const next=clone(current)||{outlet:0,warehouse:0};
      const markers=clone(next.stockComponentOps)||{};
      const existing=markers[op];
      if(existing?.state==='APPLIED'||existing?.state==='SHORTAGE'||existing?.state==='ROLLED_BACK'){
        return next;
      }
      const outlet=Number(next.outlet||0);
      if(outlet<requiredQty){
        markers[op]={
          state:'SHORTAGE',
          applicationId,
          qty:requiredQty,
          at:now()
        };
        next.stockComponentOps=markers;
        return next;
      }
      next.outlet=outlet-requiredQty;
      markers[op]={
        state:'APPLIED',
        applicationId,
        qty:requiredQty,
        at:now()
      };
      next.stockComponentOps=markers;
      next.lastOp=op;
      return next;
    });

    if(!result?.committed)fail('STOCK_COMPONENT_BALANCE_TRANSACTION_ABORTED',stockItemId);
    const row=clone(snapshotValue(result))||{};
    const marker=row.stockComponentOps?.[op]||null;
    return {stockItemId,operationId:op,state:marker?.state||'UNKNOWN',qty:requiredQty};
  }

  async function rollbackApplied(applicationId,component){
    const stockItemId=assertKey(component.stockItemId,'stockItemId');
    const op=operationId('SALE',applicationId,stockItemId);
    const result=await db.ref(balancePath(stockItemId)).transaction(current=>{
      const next=clone(current)||{outlet:0,warehouse:0};
      const markers=clone(next.stockComponentOps)||{};
      const marker=markers[op];
      if(!marker||marker.state==='ROLLED_BACK'||marker.state==='SHORTAGE')return next;
      if(marker.state!=='APPLIED')return next;
      next.outlet=Number(next.outlet||0)+Number(marker.qty||0);
      markers[op]={
        ...marker,
        state:'ROLLED_BACK',
        rolledBackAt:now()
      };
      next.stockComponentOps=markers;
      return next;
    });
    if(!result?.committed)fail('STOCK_COMPONENT_ROLLBACK_ABORTED',stockItemId);
  }

  function completionPatch(applicationId,application,components){
    const patch={
      [`stockApplications/${applicationId}/status`]:'COMPLETED',
      [`stockApplications/${applicationId}/completedAt`]:now()
    };
    for(const component of components){
      const id=movementId('SALE',applicationId,component.stockItemId);
      patch[`movements/${id}`]={
        id,
        itemType:'ingredient',
        itemId:component.stockItemId,
        itemName:component.stockItemName,
        type:'SALE_COMPONENT',
        location:'outlet',
        delta:-Number(component.appliedQty),
        refId:application.txId,
        applicationId,
        shift:application.shiftKey,
        user:text(application.snapshot?.actorName),
        userId:text(application.snapshot?.actorId),
        ts:now(),
        at:nowIso(now())
      };
    }
    return patch;
  }

  async function writeShortage(applicationId,shortageItems){
    const patch={
      [`stockApplications/${applicationId}/status`]:'SHORTAGE',
      [`stockApplications/${applicationId}/shortageItems`]:shortageItems,
      [`stockApplications/${applicationId}/shortageAt`]:now()
    };
    await db.ref(inventoryRootPath()).update(patch);
  }

  async function executeClaimed(applicationId,application,{resultLabel='APPLIED'}={}){
    const components=Array.isArray(application?.snapshot?.components)
      ?application.snapshot.components
      :[];

    const outcomes=[];
    for(const component of components){
      outcomes.push(await transactApplyComponent(applicationId,component));
    }

    const shortageItems=outcomes.filter(x=>x.state==='SHORTAGE').map(x=>x.stockItemId).sort();
    if(shortageItems.length){
      for(const component of components){
        const outcome=outcomes.find(x=>x.stockItemId===component.stockItemId);
        if(outcome?.state==='APPLIED')await rollbackApplied(applicationId,component);
      }
      await writeShortage(applicationId,shortageItems);
      return Object.freeze({
        applicationId,
        status:'SHORTAGE',
        result:'SHORTAGE',
        shortageItems:Object.freeze(shortageItems)
      });
    }

    const unknown=outcomes.filter(x=>x.state!=='APPLIED');
    if(unknown.length)fail('STOCK_COMPONENT_APPLICATION_STATE_UNKNOWN',unknown.map(x=>x.stockItemId).join(','));

    await db.ref(inventoryRootPath()).update(completionPatch(applicationId,application,components));
    return Object.freeze({applicationId,status:'COMPLETED',result:resultLabel});
  }

  async function applyCompletedSale({
    shiftKey,
    txId,
    transaction={},
    mapping={},
    stockItems={},
    actor={}
  }={}){
    assertSaleActor(actor);
    if(text(transaction?.status).toUpperCase()!=='COMPLETED')fail('STOCK_COMPONENT_TX_NOT_COMPLETED');

    const snapshot=buildApplicationSnapshot({
      shiftKey,
      txId,
      lines:linesFromTransaction(transaction),
      mapping,
      stockItems,
      actor
    });

    const {applicationId,application,created}=await claimApplication({shiftKey,txId,snapshot,actor});

    if(application.status==='COMPLETED'){
      return Object.freeze({applicationId,status:'COMPLETED',result:'ALREADY_APPLIED'});
    }
    if(application.status==='SHORTAGE'){
      return Object.freeze({
        applicationId,
        status:'SHORTAGE',
        result:'SHORTAGE',
        shortageItems:Object.freeze([...(application.shortageItems||[])])
      });
    }
    if(!['CLAIMED','ERROR'].includes(application.status)){
      fail('STOCK_COMPONENT_APPLICATION_STATUS_INVALID',text(application.status));
    }
    return executeClaimed(applicationId,application,{resultLabel:created?'APPLIED':'RECOVERED'});
  }

  async function recoverApplication({shiftKey,txId,actor={}}={}){
    assertSaleActor(actor);
    const applicationId=stockApplicationId(shiftKey,txId);
    const application=await readApplication({shiftKey,txId});
    if(!application)fail('STOCK_COMPONENT_APPLICATION_NOT_FOUND',applicationId);
    if(application.status==='COMPLETED'){
      return Object.freeze({applicationId,status:'COMPLETED',result:'ALREADY_APPLIED'});
    }
    if(application.status==='SHORTAGE'){
      return Object.freeze({
        applicationId,status:'SHORTAGE',result:'SHORTAGE',
        shortageItems:Object.freeze([...(application.shortageItems||[])])
      });
    }
    if(!['CLAIMED','ERROR'].includes(application.status)){
      fail('STOCK_COMPONENT_APPLICATION_STATUS_INVALID',text(application.status));
    }
    return executeClaimed(applicationId,application,{resultLabel:'RECOVERED'});
  }

  async function restoreVoid(){
    fail('STOCK_RESTORE_NOT_IMPLEMENTED');
  }

  async function restoreRefund(){
    fail('STOCK_RESTORE_NOT_IMPLEMENTED');
  }

  return Object.freeze({
    saveProductComponents,
    readApplication,
    applyCompletedSale,
    recoverApplication,
    restoreVoid,
    restoreRefund
  });
}
