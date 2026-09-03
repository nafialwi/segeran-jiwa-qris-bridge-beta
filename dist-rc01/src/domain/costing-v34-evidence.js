const num=v=>Number.isFinite(Number(v))?Number(v):0;
const text=v=>String(v??'').trim();
const upper=v=>text(v).toUpperCase();
const money=v=>Math.round((num(v)+Number.EPSILON)*100)/100;
const rows=v=>Array.isArray(v)?v.filter(Boolean):v&&typeof v==='object'?Object.entries(v).filter(([,x])=>x!=null).map(([id,x])=>({...x,_key:x?._key??id})):[];
const CANONICAL_SHIFT=/^\d{4}-\d{2}-\d{2}-S[123]$/;
const VOID_STATUSES=new Set(['VOID','VOIDED','CANCELLED','CANCELED']);
const REFUND_STATUSES=new Set(['REFUNDED','PARTIAL_REFUND']);

function txId(tx={}){return text(tx.id||tx._key)}
function txShift(tx={}){return text(tx.shift||tx._shift||tx.shiftKey)}
function validCosting(costing){return !!(costing&&costing.costingKnown!==false&&costing.cogsTotal!==null&&costing.cogsTotal!==undefined&&costing.cogsTotal!==''&&Number.isFinite(Number(costing.cogsTotal)))}
function refundPresent(tx={}){
  if(REFUND_STATUSES.has(upper(tx.status)))return true;
  if(num(tx.refundTotal)>0)return true;
  if(tx.refundedQty&&typeof tx.refundedQty==='object'&&Object.values(tx.refundedQty).some(v=>num(v)>0))return true;
  if(tx.refundPricingTotals&&typeof tx.refundPricingTotals==='object'&&Object.keys(tx.refundPricingTotals).length)return true;
  if(tx.refundCostingTotals&&typeof tx.refundCostingTotals==='object'&&Object.keys(tx.refundCostingTotals).length)return true;
  return false;
}
function knownRefundCost(tx={}){
  const r=tx.refundCostingTotals;
  if(!r||r.known===false)return null;
  const raw=r.cogs??r.cogsTotal;
  return raw!==null&&raw!==undefined&&raw!==''&&Number.isFinite(Number(raw))?Math.max(0,money(raw)):null;
}
function reservationEvidence(tx,reservations){
  const id=txId(tx),shift=txShift(tx);if(!id||!CANONICAL_SHIFT.test(shift))return {exact:null,partial:false};
  let partial=false;
  for(const r of rows(reservations)){
    const rShift=text(r.shift),transactionId=text(r.transactionId),candidateIds=Array.isArray(r.candidateIds)?r.candidateIds.map(text):[];
    const refers=transactionId===id||candidateIds.includes(id);if(!refers)continue;
    if(rShift!==shift){partial=true;continue}
    if(upper(r.status)==='COMMITTED'&&transactionId===id&&validCosting(r.costingQuote))return {exact:r,partial};
    partial=true;
  }
  return {exact:null,partial};
}
function refundQtyEvidence(tx,refunds){
  const out=Object.create(null),direct=tx?.refundedQty&&typeof tx.refundedQty==='object'?tx.refundedQty:null;
  if(direct){let any=false;for(const [key,value] of Object.entries(direct)){const q=Math.max(0,num(value));if(q>0){out[String(key)]=q;any=true}}if(any)return {qty:out,source:'TX_REFUNDED_QTY',complete:true}}
  const id=txId(tx),shift=txShift(tx),matched=rows(refunds).filter(r=>text(r.originalTxId)===id&&(!shift||!text(r.shift)||text(r.shift)===shift));
  if(!matched.length)return {qty:out,source:'NONE',complete:false};
  let any=false;
  for(const refund of matched){
    for(const item of rows(refund.items)){
      if(item.lineIndex===null||item.lineIndex===undefined||!Number.isFinite(Number(item.lineIndex)))return {qty:Object.create(null),source:'REFUND_ROWS',complete:false};
      const key=String(Number(item.lineIndex)),q=Math.max(0,num(item.q??item.qty??item.quantity));if(q<=0)continue;out[key]=num(out[key])+q;any=true;
    }
  }
  return {qty:out,source:'REFUND_ROWS',complete:any};
}
function reconstructRefundCogs(costing,qtyEvidence){
  if(!validCosting(costing)||!qtyEvidence?.complete)return null;
  const items=Array.isArray(costing.items)?costing.items:[];if(!items.length)return null;
  let total=0,used=false;
  for(const [key,rawQty] of Object.entries(qtyEvidence.qty||{})){
    const index=Number(key),item=items.find(x=>Number(x?.lineIndex)===index);if(!item||item.costKnown===false||!Number.isFinite(Number(item.cogs))||num(item.qty)<=0)return null;
    const q=Math.max(0,num(rawQty));if(q>num(item.qty)+1e-9)return null;
    if(q<=0)continue;used=true;total+=num(item.cogs)*(q/num(item.qty));
  }
  return used?Math.max(0,money(total)):null;
}
function evidenceMeta({state,source,costKnown,effectiveCogs,refundSource=null,refundCogs=0,excluded=false,reasonCodes=[]}){
  return Object.freeze({version:'3.4',state,source,costKnown,effectiveCogs:effectiveCogs===null?null:money(effectiveCogs),refundSource,refundCogs:refundCogs===null?null:money(refundCogs),excluded,reconstructed:state==='RECONSTRUCTED_VERIFIED',reasonCodes:Object.freeze([...reasonCodes])});
}

export function resolveTransactionCostingV34(tx={},options={}){
  const status=upper(tx.status);
  if(VOID_STATUSES.has(status)){
    const meta=evidenceMeta({state:'VOID_EXCLUDED',source:'VOID_STATUS',costKnown:true,effectiveCogs:0,excluded:true});
    return Object.freeze({...meta,enriched:Object.freeze({...tx,_costingEvidenceV34:meta})});
  }
  const reasons=[];let costing=null,source='',reconstructedOriginal=false;
  if(validCosting(tx.costing)){costing=tx.costing;source='TX_COSTING_SNAPSHOT'}
  else if(tx.costKnown===true&&tx.cogs!==null&&tx.cogs!==undefined&&tx.cogs!==''&&Number.isFinite(Number(tx.cogs))){costing={version:'P4-EXPLICIT-HPP',costingKnown:true,cogsTotal:Math.max(0,money(tx.cogs)),netRevenue:Math.max(0,num(tx.netRevenue??tx.pricing?.netSubtotal??tx.total??tx.grandTotal)),items:[]};source='P4_EXPLICIT_HPP'}
  else{
    const reservation=reservationEvidence(tx,options.reservations);
    if(reservation.exact){costing=reservation.exact.costingQuote;source='COMMITTED_COSTING_RESERVATION';reconstructedOriginal=true}
    else if(reservation.partial)reasons.push('RESERVATION_NOT_COMMITTED');
    if(tx.costing&&Array.isArray(tx.costing.items)&&tx.costing.items.some(x=>x&&x.costKnown!==false))reasons.push('PARTIAL_TRANSACTION_COST_SNAPSHOT');
  }
  if(!costing){
    if(!reasons.length)reasons.push('NO_CONTEMPORANEOUS_COST_EVIDENCE');
    const state=reasons.includes('RESERVATION_NOT_COMMITTED')||reasons.includes('PARTIAL_TRANSACTION_COST_SNAPSHOT')?'PARTIAL_EVIDENCE':'NOT_SAFE_TO_RECONSTRUCT';
    const meta=evidenceMeta({state,source:source||'NONE',costKnown:false,effectiveCogs:null,reasonCodes:reasons});
    return Object.freeze({...meta,enriched:Object.freeze({...tx,costKnown:false,_costingEvidenceV34:meta})});
  }

  const originalCogs=Math.max(0,money(costing.cogsTotal));let refundSource=null,refundCogs=0,reconstructedRefund=false;
  if(refundPresent(tx)){
    const stored=knownRefundCost(tx);
    if(stored!==null){refundCogs=stored;refundSource='REFUND_COSTING_SNAPSHOT'}
    else{
      const qtyEvidence=refundQtyEvidence(tx,options.refunds),reconstructed=reconstructRefundCogs(costing,qtyEvidence);
      if(reconstructed===null){
        reasons.push('REFUND_COST_EVIDENCE_INCOMPLETE');
        const meta=evidenceMeta({state:'PARTIAL_EVIDENCE',source,refundSource:null,costKnown:false,effectiveCogs:null,refundCogs:null,reasonCodes:reasons});
        return Object.freeze({...meta,enriched:Object.freeze({...tx,costing,costKnown:false,_costingEvidenceV34:meta})});
      }
      refundCogs=reconstructed;refundSource='ORIGINAL_COST_SNAPSHOT_REFUND';reconstructedRefund=true;
    }
  }
  const effective=Math.max(0,money(originalCogs-refundCogs));
  const state=reconstructedOriginal||reconstructedRefund?'RECONSTRUCTED_VERIFIED':'SNAPSHOT_VERIFIED';
  const meta=evidenceMeta({state,source,costKnown:true,effectiveCogs:effective,refundSource,refundCogs,reasonCodes:reasons});
  const refundTotals=reconstructedRefund?{...(tx.refundCostingTotals||{}),cogs:refundCogs,known:true,source:'ORIGINAL_COST_SNAPSHOT_REFUND'}:tx.refundCostingTotals;
  return Object.freeze({...meta,enriched:Object.freeze({...tx,costing,costKnown:true,...(refundTotals?{refundCostingTotals:refundTotals}:{}),_costingEvidenceV34:meta})});
}

export function enrichTransactionsCostingV34(transactions=[],options={}){
  return Object.freeze((transactions||[]).map(tx=>resolveTransactionCostingV34(tx,options).enriched));
}

export function summarizeCostingCoverageV34(transactions=[]){
  const out={totalEffective:0,snapshotVerified:0,reconstructedVerified:0,partialEvidence:0,notSafeToReconstruct:0,voidExcluded:0,refundReconstructed:0};
  for(const tx of transactions||[]){
    const e=tx?._costingEvidenceV34||resolveTransactionCostingV34(tx||{},{});
    if(e.state==='VOID_EXCLUDED'){out.voidExcluded++;continue}
    out.totalEffective++;
    if(e.state==='SNAPSHOT_VERIFIED')out.snapshotVerified++;
    else if(e.state==='RECONSTRUCTED_VERIFIED')out.reconstructedVerified++;
    else if(e.state==='PARTIAL_EVIDENCE')out.partialEvidence++;
    else out.notSafeToReconstruct++;
    if(e.refundSource==='ORIGINAL_COST_SNAPSHOT_REFUND')out.refundReconstructed++;
  }
  return Object.freeze(out);
}
