const MATCH_WINDOW_MS=15*60*1000;
const CLOCK_SKEW_MS=2*60*1000;
const SNAPSHOT_VERSION='S10A-1';
const LATE_STATUSES=new Set(['LATE_AFTER_CANCEL','LATE_OR_NEW_AMBIGUOUS']);
const UNRESOLVED_PARKED_STATUSES=new Set(['WAITING_QRIS','MATCHED','FINALIZING','MANUAL_FALLBACK']);

const num=v=>{const n=Number(v);return Number.isFinite(n)?n:0};
const text=(v,max=240)=>String(v??'').trim().slice(0,max);
const bool=v=>v===true;
const id=v=>text(v,180);
const uniqueIds=rows=>[...new Set((rows||[]).map(x=>id(x)).filter(Boolean))].sort();

function deepFreeze(value){
  if(!value||typeof value!=='object'||Object.isFrozen(value))return value;
  Object.freeze(value);
  for(const item of Object.values(value))deepFreeze(item);
  return value;
}
function normalizeSettings(value={}){
  return {
    taxEnabled:bool(value.taxEnabled),taxRate:num(value.taxRate),
    serviceEnabled:bool(value.serviceEnabled),serviceRate:num(value.serviceRate),
    cashierMaxDiscountPercent:num(value.cashierMaxDiscountPercent)
  };
}
function normalizeLine(value={},index=0){
  return {
    index:Number.isInteger(Number(value.index))?Number(value.index):index,
    id:id(value.id),gross:num(value.gross),itemDiscount:num(value.itemDiscount),net:num(value.net),
    discountType:text(value.discountType||'PERCENT',24).toUpperCase(),discountValue:num(value.discountValue)
  };
}
function normalizeItem(value={}){
  const out={
    id:id(value.id),n:text(value.n,300),q:num(value.q),p:num(value.p),note:text(value.note,500),cp:num(value.cp),c:text(value.c,120),
    discountType:text(value.discountType||'PERCENT',24).toUpperCase(),discountValue:num(value.discountValue)
  };
  // These optional identity fields are needed to restore recipe/inventory semantics through the existing sale authority.
  for(const key of ['inventoryMode','baseProductId','recipeVariantId','virtualCartId','sku','barcode','variantName','recipeVariantName']){
    if(value[key]!=null&&String(value[key])!=='')out[key]=text(value[key],180);
  }
  if(value.trackStock!=null)out.trackStock=value.trackStock===true;
  return out;
}
function normalizePricing(value={}){
  return {
    version:text(value.version,40),subtotal:num(value.subtotal),itemDiscountTotal:num(value.itemDiscountTotal),transactionDiscountTotal:num(value.transactionDiscountTotal),
    discountTotal:num(value.discountTotal),netSubtotal:num(value.netSubtotal),serviceCharge:num(value.serviceCharge),taxBase:num(value.taxBase),tax:num(value.tax),total:num(value.total),
    settings:normalizeSettings(value.settings||{}),
    cartDiscount:{type:text(value.cartDiscount?.type||'PERCENT',24).toUpperCase(),value:num(value.cartDiscount?.value)},
    lines:Array.isArray(value.lines)?value.lines.map(normalizeLine):[]
  };
}

export function normalizeSaleSnapshot(input={}){
  const items=Array.isArray(input.items)?input.items.map(normalizeItem):[];
  const pricing=normalizePricing(input.pricing||{}),amount=num(input.amount);
  if(!amount||!items.length||pricing.total!==amount)throw new Error('QRIS_S10A_SNAPSHOT_INVALID');
  const snapshot={
    capturedAt:num(input.capturedAt)||Date.now(),amount,
    cartFingerprint:text(input.cartFingerprint,120),pricingFingerprint:text(input.pricingFingerprint,120),
    items,pricing
  };
  if(!snapshot.cartFingerprint||!snapshot.pricingFingerprint)throw new Error('QRIS_S10A_SNAPSHOT_INVALID');
  return deepFreeze(snapshot);
}

export function snapshotIdentity(snapshot){
  const s=normalizeSaleSnapshot(snapshot);
  return JSON.stringify(s);
}

export function combinedQrisFingerprint(base,pricing){
  let h=2166136261;const s=String(base||'')+'|'+String(pricing||'');
  for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}
  return ('00000000'+(h>>>0).toString(16)).slice(-8);
}

export function isLateQuarantineStatus(status){return LATE_STATUSES.has(String(status||''));}
export function isUnresolvedParkedPending(row){return !!(row&&row.parkedAt!=null&&UNRESOLVED_PARKED_STATUSES.has(String(row.status||'')));}

function eventTime(signal,nowMs){return num(signal?.detectedAt)||num(signal?.firstSeenAt)||num(nowMs)||Date.now();}
function plausibleByLegacyWindow(row,amount,eventAt,nowMs,windowMs,skewMs,{live=false}={}){
  if(!row||num(row.amount)!==amount)return false;
  const created=num(row.createdAt);if(!created)return false;
  const delta=eventAt-created;if(delta < -skewMs||delta > windowMs)return false;
  if(live){
    if(String(row.status||'')!=='WAITING_QRIS'||row.providerTransactionId)return false;
    const expires=num(row.expiresAt)||created+20*60*1000;
    if(num(nowMs)>=expires)return false;
  }else{
    if(String(row.status||'')!=='CANCELLED')return false;
    const cancelled=num(row.cancelledAt);if(cancelled&&cancelled>eventAt+skewMs)return false;
  }
  return true;
}

export function classifyLateSignalConflict(signal,pendingRows,nowMs=Date.now(),windowMs=MATCH_WINDOW_MS){
  if(!signal||signal.matchedTransactionId||String(signal.status||'')==='CONFIRMED'||isLateQuarantineStatus(signal.status))return null;
  const amount=num(signal.amount),providerId=id(signal.providerTransactionId||signal._key);if(!amount||!providerId)return null;
  const at=eventTime(signal,nowMs),rows=(pendingRows||[]).filter(Boolean);
  const cancelled=rows.filter(row=>plausibleByLegacyWindow(row,amount,at,nowMs,windowMs,CLOCK_SKEW_MS,{live:false}));
  if(!cancelled.length)return null;
  const live=rows.filter(row=>plausibleByLegacyWindow(row,amount,at,nowMs,windowMs,CLOCK_SKEW_MS,{live:true}));
  return Object.freeze({
    status:live.length?'LATE_OR_NEW_AMBIGUOUS':'LATE_AFTER_CANCEL',
    providerTransactionId:providerId,
    lateCandidatePendingIds:uniqueIds(cancelled.map(x=>x.pendingId)),
    liveCandidatePendingIds:uniqueIds(live.map(x=>x.pendingId))
  });
}

export const QRIS_DEFERRED_SETTLEMENT_POLICY=Object.freeze({
  version:SNAPSHOT_VERSION,matchWindowMs:MATCH_WINDOW_MS,clockSkewMs:CLOCK_SKEW_MS,
  lateStatuses:Object.freeze([...LATE_STATUSES])
});
