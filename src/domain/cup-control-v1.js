const num=value=>Number.isFinite(Number(value))?Number(value):0;
const text=value=>String(value??'').trim();
const hasOwn=(obj,key)=>Object.prototype.hasOwnProperty.call(obj||{},key);

export const CUP_CONTROL_SCHEMA_VERSION=1;
export const CUP_CONTROL_AUTHORITY='CUP_CONTROL';

export function emptyCupCounts(catalog=[]){
  return Object.freeze(Object.fromEntries((catalog||[]).map(row=>[String(row?.code||''),0]).filter(([code])=>code)));
}

export function normalizeCupCounts(counts={},catalog=[]){
  const out={};
  for(const spec of catalog||[]){
    const code=text(spec?.code);if(!code)continue;
    const raw=hasOwn(counts,code)?counts[code]:0;
    const value=Number(raw);
    out[code]=Number.isFinite(value)&&value>=0?value:0;
  }
  return Object.freeze(out);
}

function adjustmentParts(value){
  if(value&&typeof value==='object'){
    return {
      positive:Math.max(0,num(value.positive??value.increase??value.plus)),
      negative:Math.max(0,num(value.negative??value.decrease??value.minus))
    };
  }
  const n=num(value);
  return n>=0?{positive:n,negative:0}:{positive:0,negative:Math.abs(n)};
}

export function reconcileCupControlV1({catalog=[],opening={},restock={},transactionUsage={},manualUsage={},waste={},adjustment={},physical={},reasons={},openingKnown=true}={}){
  const rows=(catalog||[]).map(spec=>{
    const code=text(spec?.code),open=openingKnown?Math.max(0,num(opening?.[code])):null;
    const restocked=Math.max(0,num(restock?.[code]));
    const txUsed=Math.max(0,num(transactionUsage?.[code]));
    const manualUsed=Math.max(0,num(manualUsage?.[code]));
    const wasted=Math.max(0,num(waste?.[code]));
    const adj=adjustmentParts(adjustment?.[code]);
    const rawPhysical=physical?.[code];
    const hasPhysical=rawPhysical!==null&&rawPhysical!==undefined&&String(rawPhysical).trim()!==''&&Number.isFinite(Number(rawPhysical));
    const physicalClosing=hasPhysical?Math.max(0,num(rawPhysical)):null;
    const available=openingKnown?open+restocked+adj.positive:null;
    const deductions=txUsed+manualUsed+wasted+adj.negative;
    const rawExpected=openingKnown?available-deductions:null;
    const expectedClosing=openingKnown?Math.max(0,rawExpected):null;
    const uncoveredUsage=openingKnown?Math.max(0,-rawExpected):null;
    const variance=openingKnown&&hasPhysical?physicalClosing-expectedClosing:null;
    const reasonValue=reasons?.[code];
    const reason=reasonValue&&typeof reasonValue==='object'?text(reasonValue.reason):text(reasonValue);
    const reasonNote=reasonValue&&typeof reasonValue==='object'?text(reasonValue.note):'';
    const status=!openingKnown?'OPENING_UNKNOWN':!hasPhysical?'AWAITING_PHYSICAL':uncoveredUsage>0?'NEEDS_ATTENTION':variance===0?'MATCH':variance>0?'MORE':'SHORTAGE';
    return Object.freeze({
      code,name:text(spec?.name)||code,unit:text(spec?.unit)||'pcs',
      opening:open,restock:restocked,inbound:restocked,
      transactionUsage:txUsed,theoreticalUsed:txUsed,manualUsage:manualUsed,waste:wasted,
      positiveAdjustment:adj.positive,negativeAdjustment:adj.negative,
      available,deductions,rawExpected,expectedClosing,uncoveredUsage,
      physicalClosing,closing:physicalClosing,
      physicalUsed:openingKnown&&hasPhysical?Math.max(0,available-physicalClosing):null,
      variance,status,reason:reason||null,reasonNote:reasonNote||null
    });
  });
  return Object.freeze({
    schemaVersion:CUP_CONTROL_SCHEMA_VERSION,
    version:'CUP-CONTROL-V1',authority:CUP_CONTROL_AUTHORITY,openingKnown:!!openingKnown,
    rows:Object.freeze(rows),
    totalVariance:rows.reduce((sum,row)=>sum+(row.variance==null?0:Math.abs(row.variance)),0),
    totalUncoveredUsage:rows.reduce((sum,row)=>sum+(row.uncoveredUsage==null?0:row.uncoveredUsage),0)
  });
}

export function buildCupControlLedgerV1({catalog=[],opening={},restock={},transactionUsage={},manualUsage={},waste={},adjustment={},physical={},capturedTs=Date.now()}={}){
  const events=[];
  const push=(type,code,qty,meta={})=>{if(!Number.isFinite(Number(qty))||Number(qty)===0)return;events.push(Object.freeze({type,code,qty:Number(qty),ts:Number(capturedTs)||Date.now(),...meta}))};
  for(const spec of catalog||[]){
    const code=text(spec?.code);if(!code)continue;
    push('OPENING',code,Math.max(0,num(opening?.[code])));
    push('RESTOCK',code,Math.max(0,num(restock?.[code])));
    push('TRANSACTION_USAGE',code,-Math.max(0,num(transactionUsage?.[code])));
    push('MANUAL_USAGE',code,-Math.max(0,num(manualUsage?.[code])));
    push('WASTE',code,-Math.max(0,num(waste?.[code])));
    const adj=adjustmentParts(adjustment?.[code]);
    push('ADJUSTMENT',code,adj.positive);
    push('ADJUSTMENT',code,-adj.negative);
    const rawPhysical=physical?.[code];
    if(rawPhysical!==null&&rawPhysical!==undefined&&String(rawPhysical).trim()!==''&&Number.isFinite(Number(rawPhysical)))push('CLOSING',code,Math.max(0,num(rawPhysical)),{absolute:true});
  }
  return Object.freeze(events);
}

export function normalizeHistoricalCupRowV1(row={},reconciliation={}){
  const expected=row?.expectedClosing===null||row?.expectedClosing===undefined||row?.expectedClosing===''?null:num(row.expectedClosing);
  const physicalRaw=row?.physicalClosing!==undefined?row.physicalClosing:row?.closing;
  const physical=physicalRaw===null||physicalRaw===undefined||physicalRaw===''?null:num(physicalRaw);
  const currentSchema=Number(reconciliation?.schemaVersion)>=CUP_CONTROL_SCHEMA_VERSION||String(reconciliation?.authority||'')===CUP_CONTROL_AUTHORITY;
  const legacyVariance=row?.variance===null||row?.variance===undefined||row?.variance===''?null:num(row.variance);
  const variance=expected!==null&&physical!==null?physical-Math.max(0,expected):null;
  return Object.freeze({
    ...row,
    rawExpected:row?.rawExpected===undefined?expected:row.rawExpected,
    expectedClosing:expected===null?null:Math.max(0,expected),
    physicalClosing:physical,
    variance,
    legacyVariance:currentSchema?null:legacyVariance,
    uncoveredUsage:Math.max(0,num(row?.uncoveredUsage??(expected!==null&&expected<0?Math.abs(expected):0)))
  });
}
