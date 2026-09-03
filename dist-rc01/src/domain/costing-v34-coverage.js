import { resolveTransactionCostingV34 } from './costing-v34-evidence.js';

const num=v=>Number.isFinite(Number(v))?Number(v):0;
const text=v=>String(v??'').trim();
const upper=v=>text(v).toUpperCase();
const money=v=>Math.round((num(v)+Number.EPSILON)*100)/100;
const pct=(a,b)=>b>0?Math.round((a/b*100+Number.EPSILON)*10)/10:0;
const VOID=new Set(['VOID','VOIDED','CANCELLED','CANCELED']);
const PENDING=new Set(['PENDING','PROCESSING','INIT','OPEN','WAITING']);

function eventTs(tx={}){return num(tx.ts??tx.createdTs??Date.parse(tx.createdAt||tx.at||''))}
function txId(tx={}){return text(tx.id||tx._key)}
function effective(tx={}){const s=upper(tx.status);return !VOID.has(s)&&!PENDING.has(s)}
function netRevenue(tx={}){
  const costing=tx.costing&&typeof tx.costing==='object'?tx.costing:{};
  const pricing=tx.pricing&&typeof tx.pricing==='object'?tx.pricing:{};
  const refund=tx.refundCostingTotals&&typeof tx.refundCostingTotals==='object'?tx.refundCostingTotals:{};
  const gross=Math.max(0,num(tx.netRevenue??costing.netRevenue??pricing.grandTotal??tx.total??tx.grandTotal));
  const refundRevenue=Math.max(0,num(refund.netRevenue??tx.refundTotal));
  return Math.max(0,money(gross-refundRevenue));
}
function evidenceOf(tx={}){
  const direct=tx._costingEvidenceV34&&typeof tx._costingEvidenceV34==='object'?tx._costingEvidenceV34:null;
  return direct||resolveTransactionCostingV34(tx,{});
}
function freezeCohorts(map){
  const out={};
  for(const [code,row] of Object.entries(map))out[code]=Object.freeze({...row,transactionIds:Object.freeze([...row.transactionIds])});
  return Object.freeze(out);
}

export function buildCostingCoverageDiagnosticsV34(transactions=[]){
  const effectiveRows=(transactions||[]).filter(Boolean).filter(effective);
  const analyzed=effectiveRows.map(tx=>({tx,id:txId(tx),ts:eventTs(tx),revenue:netRevenue(tx),e:evidenceOf(tx)}));
  const known=analyzed.filter(x=>x.e?.costKnown===true&&Number.isFinite(Number(x.e.effectiveCogs)));
  const unknown=analyzed.filter(x=>!known.includes(x));
  const totalRevenue=money(analyzed.reduce((s,x)=>s+x.revenue,0));
  const measuredRevenue=money(known.reduce((s,x)=>s+x.revenue,0));
  const measuredCogs=known.length?money(known.reduce((s,x)=>s+Math.max(0,num(x.e.effectiveCogs)),0)):null;
  const measuredGrossProfit=known.length?money(measuredRevenue-measuredCogs):null;
  const measuredGrossMargin=known.length&&measuredRevenue>0?pct(measuredGrossProfit,measuredRevenue):null;
  const verifiedTs=known.map(x=>x.ts).filter(x=>x>0).sort((a,b)=>a-b);
  const firstObservedVerifiedTs=verifiedTs.length?verifiedTs[0]:null;
  const reasonMap={};
  for(const x of unknown){
    const codes=Array.isArray(x.e?.reasonCodes)&&x.e.reasonCodes.length?x.e.reasonCodes:['UNKNOWN_COST_EVIDENCE'];
    for(const raw of codes){
      const code=upper(raw)||'UNKNOWN_COST_EVIDENCE';
      const row=reasonMap[code]||{count:0,revenue:0,transactionIds:[]};
      row.count+=1;row.revenue=money(row.revenue+x.revenue);if(x.id)row.transactionIds.push(x.id);reasonMap[code]=row;
    }
  }
  const legacyRows=unknown.filter(x=>{
    const noEvidence=(x.e?.reasonCodes||[]).map(upper).includes('NO_CONTEMPORANEOUS_COST_EVIDENCE');
    return noEvidence&&(firstObservedVerifiedTs===null||!x.ts||x.ts<firstObservedVerifiedTs);
  });
  const postRows=firstObservedVerifiedTs===null?[]:unknown.filter(x=>x.ts>firstObservedVerifiedTs);
  const voidExcluded=(transactions||[]).filter(tx=>VOID.has(upper(tx?.status))||tx?._costingEvidenceV34?.state==='VOID_EXCLUDED').length;
  return Object.freeze({
    version:'3.4-batch3',
    totalEffective:analyzed.length,
    knownTransactions:known.length,
    unknownTransactions:unknown.length,
    totalRevenue,
    measuredRevenue,
    unknownRevenue:money(totalRevenue-measuredRevenue),
    transactionCoveragePct:pct(known.length,analyzed.length),
    revenueCoveragePct:pct(measuredRevenue,totalRevenue),
    measuredCogs,
    measuredGrossProfit,
    measuredGrossMargin,
    firstObservedVerifiedTs,
    legacyNoEvidence:Object.freeze({count:legacyRows.length,revenue:money(legacyRows.reduce((s,x)=>s+x.revenue,0)),transactionIds:Object.freeze(legacyRows.map(x=>x.id).filter(Boolean))}),
    postEvidenceGaps:Object.freeze({count:postRows.length,revenue:money(postRows.reduce((s,x)=>s+x.revenue,0)),transactionIds:Object.freeze(postRows.map(x=>x.id).filter(Boolean))}),
    reasonCohorts:freezeCohorts(reasonMap),
    voidExcluded
  });
}
