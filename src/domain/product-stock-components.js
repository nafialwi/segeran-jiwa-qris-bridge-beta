const text=value=>String(value??'').trim();

function domainError(code,detail=''){
  const error=new Error(detail?`${code}:${detail}`:code);
  error.code=code;
  if(detail)error.detail=detail;
  return error;
}

function positiveQty(value){
  const qty=Number(value);
  if(!Number.isFinite(qty)||qty<=0)throw domainError('STOCK_COMPONENT_QTY_INVALID',String(value));
  return qty;
}

function lineQty(line={}){
  const qty=Number(line.q??line.qty??line.quantity??0);
  return Number.isFinite(qty)&&qty>0?qty:0;
}

function lineProductId(line={}){
  return text(line.baseProductId??line.productId??line.id);
}

function stockItemMeta(stockItems,id){
  const row=stockItems&&typeof stockItems==='object'?stockItems[id]:null;
  if(!row||typeof row!=='object')throw domainError('STOCK_ITEM_NOT_FOUND',id);
  return row;
}

function freezeRows(rows){
  return Object.freeze(rows.map(row=>Object.freeze(row)));
}

function rawComponentRows(raw){
  if(raw==null)return [];
  if(Array.isArray(raw))return raw.filter(Boolean).map(row=>({...row}));
  if(typeof raw!=='object')throw domainError('STOCK_COMPONENTS_INVALID');
  return Object.entries(raw).map(([stockItemId,value])=>{
    if(value&&typeof value==='object'&&!Array.isArray(value))return {stockItemId,...value};
    return {stockItemId,qtyPerUnit:value,active:true};
  });
}

export function normalizeStockComponents(raw={}){
  const byId=Object.create(null);
  for(const source of rawComponentRows(raw)){
    const stockItemId=text(source.stockItemId??source.itemId??source.id);
    if(!stockItemId)throw domainError('STOCK_COMPONENT_ITEM_REQUIRED');
    const qtyPerUnit=positiveQty(source.qtyPerUnit??source.qty??source.usageQty);
    const active=source.active!==false;
    const current=byId[stockItemId];
    if(current){
      if(current.qtyPerUnit!==qtyPerUnit)throw domainError('STOCK_COMPONENT_DUPLICATE_CONFLICT',stockItemId);
      byId[stockItemId]={stockItemId,qtyPerUnit,active:current.active||active};
      continue;
    }
    byId[stockItemId]={stockItemId,qtyPerUnit,active};
  }
  return freezeRows(Object.values(byId).sort((a,b)=>a.stockItemId.localeCompare(b.stockItemId)));
}

export function componentsForProduct(productId,mapping={}){
  const id=text(productId);
  if(!id)return Object.freeze([]);
  const source=mapping&&typeof mapping==='object'?mapping[id]:null;
  if(!source)return Object.freeze([]);
  const raw=source&&typeof source==='object'&&source.components&&typeof source.components==='object'
    ?source.components
    :source;
  return freezeRows(normalizeStockComponents(raw).filter(row=>row.active));
}

function allocationFor(line,index,component){
  const soldQty=lineQty(line);
  const productId=lineProductId(line);
  const qtyPerUnit=component.qtyPerUnit;
  return Object.freeze({
    lineIndex:index,
    productId,
    soldQty,
    qtyPerUnit,
    appliedQty:soldQty*qtyPerUnit
  });
}

export function aggregateSaleComponents(lines=[],mapping={},stockItems={}){
  const byItem=Object.create(null);
  const safeLines=Array.isArray(lines)?lines:[];
  safeLines.forEach((line,index)=>{
    const soldQty=lineQty(line);
    const productId=lineProductId(line);
    if(!productId||soldQty<=0)return;
    for(const component of componentsForProduct(productId,mapping)){
      const meta=stockItemMeta(stockItems,component.stockItemId);
      const allocation=allocationFor(line,index,component);
      const existing=byItem[component.stockItemId]||{
        stockItemId:component.stockItemId,
        stockItemName:text(meta.name??meta.nama??meta.label)||component.stockItemId,
        unit:text(meta.unit??meta.satuan)||'pcs',
        soldQty:0,
        appliedQty:0,
        allocations:[]
      };
      existing.soldQty+=allocation.soldQty;
      existing.appliedQty+=allocation.appliedQty;
      existing.allocations.push(allocation);
      byItem[component.stockItemId]=existing;
    }
  });

  const rows=Object.values(byItem)
    .sort((a,b)=>a.stockItemId.localeCompare(b.stockItemId))
    .map(row=>{
      const qtySet=new Set(row.allocations.map(x=>x.qtyPerUnit));
      return Object.freeze({
        stockItemId:row.stockItemId,
        stockItemName:row.stockItemName,
        unit:row.unit,
        qtyPerUnit:qtySet.size===1?row.allocations[0].qtyPerUnit:null,
        soldQty:row.soldQty,
        appliedQty:row.appliedQty,
        allocations:Object.freeze([...row.allocations])
      });
    });
  return Object.freeze(rows);
}

function safeToken(value,name){
  const raw=text(value);
  if(!raw)throw domainError('STOCK_ID_TOKEN_REQUIRED',name);
  return raw.replace(/[%\.#$\/\[\]\|]/g,ch=>`%${ch.codePointAt(0).toString(16).toUpperCase().padStart(2,'0')}`);
}

export function stockApplicationId(shiftKey,txId){
  return `STOCK_APPLY|${safeToken(shiftKey,'shiftKey')}|${safeToken(txId,'txId')}`;
}

export function stockRestoreId(kind,shiftKey,txId,correctionId){
  const normalized=text(kind).toUpperCase();
  if(!normalized)throw domainError('STOCK_RESTORE_KIND_REQUIRED');
  return `STOCK_${safeToken(normalized,'kind')}|${safeToken(shiftKey,'shiftKey')}|${safeToken(txId,'txId')}|${safeToken(correctionId,'correctionId')}`;
}

function stable(value){
  if(value===null)return 'null';
  if(Array.isArray(value))return `[${value.map(stable).join(',')}]`;
  if(value&&typeof value==='object'){
    return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${stable(value[key])}`).join(',')}}`;
  }
  const encoded=JSON.stringify(value);
  return encoded===undefined?'null':encoded;
}

function fnv1a32(input){
  let hash=0x811c9dc5;
  for(let i=0;i<input.length;i++){
    hash^=input.charCodeAt(i);
    hash=Math.imul(hash,0x01000193)>>>0;
  }
  return hash.toString(16).padStart(8,'0');
}

export function stockComponentFingerprint(value){
  return `sc1:${fnv1a32(stable(value))}`;
}

export function buildApplicationSnapshot({
  shiftKey,
  txId,
  lines=[],
  mapping={},
  stockItems={},
  actor={}
}={}){
  const id=stockApplicationId(shiftKey,txId);
  const components=aggregateSaleComponents(lines,mapping,stockItems);
  const lineSnapshot=Object.freeze((Array.isArray(lines)?lines:[]).map((line,index)=>Object.freeze({
    lineIndex:index,
    productId:lineProductId(line),
    soldQty:lineQty(line)
  })));
  return Object.freeze({
    id,
    shiftKey:text(shiftKey),
    txId:text(txId),
    actorId:text(actor.id??actor.userId),
    actorName:text(actor.name??actor.userName),
    lineFingerprint:stockComponentFingerprint(lineSnapshot),
    lines:lineSnapshot,
    components
  });
}

function restoreLineIndex(line,applicationLines){
  const explicit=Number(line?.lineIndex);
  if(Number.isInteger(explicit)&&explicit>=0){
    const target=applicationLines.find(row=>Number(row.lineIndex)===explicit);
    if(!target)throw domainError('STOCK_RESTORE_LINE_NOT_FOUND',String(explicit));
    const requestedProduct=lineProductId(line);
    if(requestedProduct&&requestedProduct!==target.productId){
      throw domainError('STOCK_RESTORE_LINE_PRODUCT_MISMATCH',String(explicit));
    }
    return explicit;
  }

  const productId=lineProductId(line);
  if(!productId)throw domainError('STOCK_RESTORE_LINE_REQUIRED');
  const matches=applicationLines.filter(row=>row.productId===productId);
  if(matches.length===0)throw domainError('STOCK_RESTORE_LINE_NOT_FOUND',productId);
  if(matches.length>1)throw domainError('STOCK_RESTORE_LINE_AMBIGUOUS',productId);
  return Number(matches[0].lineIndex);
}

function restoredLineQty(alreadyRestored,lineIndex){
  const source=alreadyRestored&&typeof alreadyRestored==='object'
    ?(alreadyRestored.lines&&typeof alreadyRestored.lines==='object'?alreadyRestored.lines:alreadyRestored)
    :{};
  const qty=Number(source[String(lineIndex)]??source[lineIndex]??0);
  if(!Number.isFinite(qty)||qty<0)throw domainError('STOCK_RESTORE_HISTORY_INVALID',String(lineIndex));
  return qty;
}

export function restoreAllocation(application={},refundLines=[],alreadyRestored={}){
  const snapshot=application?.snapshot&&typeof application.snapshot==='object'
    ?application.snapshot
    :application;
  const components=Array.isArray(snapshot?.components)?snapshot.components:[];
  const applicationLines=Array.isArray(snapshot?.lines)?snapshot.lines:[];
  const refunds=Array.isArray(refundLines)?refundLines:[];

  if(!refunds.length||!components.length)return Object.freeze([]);

  const requested=Object.create(null);
  for(const line of refunds){
    const lineIndex=restoreLineIndex(line,applicationLines);
    const qty=lineQty(line);
    if(qty<=0)throw domainError('STOCK_RESTORE_QTY_INVALID',String(lineIndex));
    requested[lineIndex]=(requested[lineIndex]||0)+qty;
  }

  for(const [rawIndex,qty] of Object.entries(requested)){
    const lineIndex=Number(rawIndex);
    const original=applicationLines.find(row=>Number(row.lineIndex)===lineIndex);
    if(!original)throw domainError('STOCK_RESTORE_LINE_NOT_FOUND',rawIndex);
    const prior=restoredLineQty(alreadyRestored,lineIndex);
    if(prior+qty>Number(original.soldQty||0)+Number.EPSILON){
      throw domainError('STOCK_RESTORE_EXCEEDS_APPLIED',rawIndex);
    }
  }

  const rows=[];
  for(const component of components){
    const allocations=[];
    let restoredQty=0;
    for(const allocation of Array.isArray(component.allocations)?component.allocations:[]){
      const lineIndex=Number(allocation.lineIndex);
      const restoredSoldQty=Number(requested[lineIndex]||0);
      if(restoredSoldQty<=0)continue;
      const qtyPerUnit=Number(allocation.qtyPerUnit);
      if(!Number.isFinite(qtyPerUnit)||qtyPerUnit<=0){
        throw domainError('STOCK_RESTORE_ALLOCATION_INVALID',String(lineIndex));
      }
      const qty=restoredSoldQty*qtyPerUnit;
      restoredQty+=qty;
      allocations.push(Object.freeze({
        lineIndex,
        productId:text(allocation.productId),
        restoredSoldQty,
        qtyPerUnit,
        restoredQty:qty
      }));
    }
    if(restoredQty<=0)continue;
    rows.push(Object.freeze({
      stockItemId:text(component.stockItemId),
      stockItemName:text(component.stockItemName)||text(component.stockItemId),
      unit:text(component.unit)||'pcs',
      restoredQty,
      allocations:Object.freeze(allocations)
    }));
  }

  return freezeRows(rows.sort((a,b)=>a.stockItemId.localeCompare(b.stockItemId)));
}
