const num=v=>Number.isFinite(Number(v))?Number(v):0;
const nonNegative=v=>Math.max(0,num(v));
const text=v=>String(v??'').trim();
const clone=v=>v==null?v:JSON.parse(JSON.stringify(v));

export const SHIFT_STOCK_EVIDENCE_VERSION='SHIFT-STOCK-EVIDENCE-V1';

function txLines(tx={}){
  if(Array.isArray(tx.items)&&tx.items.length)return tx.items;
  if(Array.isArray(tx.cartData)&&tx.cartData.length)return tx.cartData;
  return [];
}
function productIdOf(line={}){return text(line.baseProductId??line.productId??line.id??line._key)}
function rowProductId(row={}){return text(row.id??row._key??row.productId)}
function statusOf(row={}){return text(row.status).toUpperCase()}
function add(out,id,value){if(!id)return;const q=nonNegative(value);if(q>0)out[id]=(out[id]||0)+q}

export function soldUnitsByProduct(transactions=[]){
  const out={},seen=new Set();
  for(const tx of Array.isArray(transactions)?transactions:[]){
    const identity=text(tx?.id??tx?._key??tx?.transactionId??tx?.txId);
    if(identity){if(seen.has(identity))continue;seen.add(identity)}
    if(['VOID','VOIDED','CANCELLED','CANCELED'].includes(statusOf(tx)))continue;
    for(const line of txLines(tx||{}))add(out,productIdOf(line),line?.q??line?.qty??line?.quantity);
  }
  return out;
}

export function returnedUnitsByProduct(refunds=[],shiftKey=''){
  const out={},seen=new Set(),key=text(shiftKey);
  for(const row of Array.isArray(refunds)?refunds:[]){
    const identity=text(row?.id??row?._key??row?.refundId);
    if(identity){if(seen.has(identity))continue;seen.add(identity)}
    if(row?.returnStock!==true)continue;
    if(key&&text(row?.shift)!==key)continue;
    for(const line of txLines(row||{}))add(out,productIdOf(line),line?.q??line?.qty??line?.quantity);
  }
  return out;
}

export function buildFinishedGoodsShiftSnapshot({products=[],balances={},includeSnapshot=null,capturedTs=Date.now(),capturedAt=new Date(capturedTs).toISOString(),source='SYSTEM_SNAPSHOT'}={}){
  const byId=Object.create(null);
  for(const product of Array.isArray(products)?products:[]){
    const id=rowProductId(product);if(!id)continue;
    if(product?.trackStock===true)byId[id]={productId:id,name:text(product.n||product.name||id)||id};
  }
  for(const [id,row] of Object.entries(includeSnapshot?.rows||{})){
    const key=text(id||row?.productId);if(!key||byId[key])continue;
    byId[key]={productId:key,name:text(row?.name||key)||key};
  }
  const rows={};
  for(const id of Object.keys(byId).sort()){
    const meta=byId[id];
    rows[id]=Object.freeze({...meta,qty:nonNegative(balances?.[id])});
  }
  return Object.freeze({version:SHIFT_STOCK_EVIDENCE_VERSION,schemaVersion:1,authority:'GLOBAL_INVENTORY_EVIDENCE',scope:'TRACKED_FINISHED_GOODS_OUTLET',source:text(source)||'SYSTEM_SNAPSHOT',capturedAt:text(capturedAt),capturedTs:num(capturedTs),rows:Object.freeze(rows)});
}

export function buildFinishedGoodsShiftSummary({opening=null,closing=null,transactions=[],refunds=[],shiftKey='',capturedTs=Date.now(),capturedAt=new Date(capturedTs).toISOString()}={}){
  const sales=soldUnitsByProduct(transactions),returns=returnedUnitsByProduct(refunds,shiftKey);
  const openingRows=opening?.rows||{},closingRows=closing?.rows||{},ids=new Set([...Object.keys(openingRows),...Object.keys(closingRows),...Object.keys(sales),...Object.keys(returns)]);
  const rows={};let soldTotal=0,returnedTotal=0,attentionCount=0;
  for(const id of [...ids].sort()){
    const o=openingRows[id],c=closingRows[id],openingKnown=!!o,closingKnown=!!c;
    const soldQty=nonNegative(sales[id]),returnedQty=nonNegative(returns[id]);
    soldTotal+=soldQty;returnedTotal+=returnedQty;
    const openingQty=openingKnown?nonNegative(o.qty):null,closingSystemQty=closingKnown?nonNegative(c.qty):null;
    const salesOnlyExpectedClosing=openingKnown?openingQty-soldQty+returnedQty:null;
    const nonSaleNetChange=openingKnown&&closingKnown?closingSystemQty-salesOnlyExpectedClosing:null;
    const status=!openingKnown||!closingKnown?'PARTIAL':nonSaleNetChange===0?'MATCH_SALES_ONLY':'NON_SALE_CHANGE';
    if(status!=='MATCH_SALES_ONLY')attentionCount++;
    rows[id]=Object.freeze({productId:id,name:text(c?.name||o?.name||id)||id,openingKnown,closingKnown,openingQty,soldQty,returnedQty,salesOnlyExpectedClosing,nonSaleNetChange,closingSystemQty,status});
  }
  return Object.freeze({version:SHIFT_STOCK_EVIDENCE_VERSION,schemaVersion:1,authority:'SHIFT_EVIDENCE_ONLY',stockAuthority:'GLOBAL_INVENTORY',capturedAt:text(capturedAt),capturedTs:num(capturedTs),shiftKey:text(shiftKey),trackedCount:Object.keys(rows).length,soldTotal,returnedTotal,attentionCount,rows:Object.freeze(rows)});
}

export function augmentShiftStockEvidenceUpdates(kind,shiftKey,sessionId,updates={},payload={}){
  const out=clone(updates)||{},key=text(kind).toUpperCase(),shift=text(shiftKey),sid=text(sessionId);
  if(!shift||!sid)return out;
  if(key==='START'&&payload?.opening){
    const sessionPath=`${shift}/sessions/${sid}`;
    const current=out[sessionPath]&&typeof out[sessionPath]==='object'?out[sessionPath]:{};
    out[sessionPath]={...current,stockEvidence:{...(current.stockEvidence||{}),opening:clone(payload.opening)}};
    out[`${shift}/stockEvidence/opening`]=clone(payload.opening);
  }
  if(key==='CLOSE'&&payload?.closing){
    out[`${shift}/sessions/${sid}/stockEvidence/closing`]=clone(payload.closing);
    out[`${shift}/stockEvidence/closing`]=clone(payload.closing);
    if(payload.summary){
      out[`${shift}/sessions/${sid}/stockEvidence/summary`]=clone(payload.summary);
      out[`${shift}/stockEvidence/summary`]=clone(payload.summary);
    }
    const snapPath=`${shift}/closingSnapshot`;
    const snap=out[snapPath]&&typeof out[snapPath]==='object'?out[snapPath]:{};
    out[snapPath]={...snap,stockEvidence:{...(snap.stockEvidence||{}),closing:clone(payload.closing),...(payload.summary?{summary:clone(payload.summary)}:{})}};
  }
  return out;
}
