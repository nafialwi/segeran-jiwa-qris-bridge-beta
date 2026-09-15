const STATUS=Object.freeze({
  UNRESOLVED:'UNRESOLVED',
  NEEDS_OPNAME:'NEEDS_OPNAME',
  RESOLVED:'RESOLVED'
});

const STATUS_PRIORITY=Object.freeze({
  UNRESOLVED:0,
  NEEDS_OPNAME:1,
  RESOLVED:2
});

function text(value){
  return String(value??'').trim();
}

function finite(value){
  if(value===null||value===undefined||value==='')return null;
  const n=Number(value);
  return Number.isFinite(n)?n:null;
}

function values(value){
  if(Array.isArray(value))return value;
  if(value&&typeof value==='object')return Object.values(value);
  return [];
}

function dateKeyOf(shiftKey,reconciliation={}){
  const direct=text(shiftKey).match(/\d{4}-\d{2}-\d{2}/)?.[0];
  if(direct)return direct;

  const stamp=text(reconciliation?.capturedAt);
  const fromStamp=stamp.match(/\d{4}-\d{2}-\d{2}/)?.[0];
  return fromStamp||text(shiftKey)||'unknown';
}

function mapPut(map,key,value){Map.prototype.set.call(map,key,value);return value}

function cupMap(cupRows=[]){
  const out=new Map();
  for(const row of cupRows||[]){
    const code=text(row?.code);
    if(!code)continue;
    mapPut(out,code,row);
  }
  return out;
}

function movementKind(row={}){
  return text(row.kind||row.type||row.action).toUpperCase();
}

function movementIngredientId(row={}){
  return text(row.itemId||row.ingredientId);
}

function movementLocation(row={}){
  return text(row.location||row.stockLocation).toLowerCase();
}

function movementTimestamp(row={}){
  return finite(row.ts??row.createdTs??row.updatedTs??row.atTs)??0;
}

function markerFor(reference){
  return `[CUP_RECON:${reference}]`;
}

export function buildCupReconciliationRef({
  shiftKey,
  sessionId,
  code
}={}){
  const parts=[shiftKey,sessionId,code].map(text);
  if(parts.some(x=>!x))throw Object.assign(
    new Error('CUP_RECON_IDENTITY_REQUIRED'),
    {code:'CUP_RECON_IDENTITY_REQUIRED'}
  );
  return `CUP-RECON|${parts[0]}|${parts[1]}|${parts[2]}`;
}

export function findCupReconOpname({
  reference,
  movements=[],
  ingredientId
}={}){
  const ref=text(reference);
  const ingredient=text(ingredientId);
  if(!ref||!ingredient)return null;

  const marker=markerFor(ref);

  const matches=values(movements).filter(row=>{
    if(movementKind(row)!=='OPNAME')return false;
    if(movementIngredientId(row)!==ingredient)return false;

    const location=movementLocation(row);
    if(location&&location!=='outlet')return false;

    return text(row.note).includes(marker);
  });

  if(!matches.length)return null;

  matches.sort((a,b)=>movementTimestamp(b)-movementTimestamp(a));
  return matches[0];
}

function reasonEvidence(reconciliation={},code,row={}){
  const evidence=reconciliation?.reasons?.[code];

  if(evidence&&typeof evidence==='object'){
    return {
      reason:text(evidence.reason)||text(row.reason)||null,
      reasonNote:text(evidence.note)||null
    };
  }

  return {
    reason:text(evidence)||text(row.reason)||null,
    reasonNote:null
  };
}

function sessionLabel(session={},shift={}){
  return text(
    session.shiftName||
    session.label||
    session.name||
    shift.shiftName||
    shift.label||
    shift.name
  )||'Shift';
}

function buildItem({
  shiftKey,
  shift,
  sessionId,
  session,
  reconciliation,
  row,
  movements,
  cups
}){
  const code=text(row?.code);
  if(!code)return null;

  const reference=buildCupReconciliationRef({
    shiftKey,
    sessionId,
    code
  });

  const cup=cups.get(code)||null;
  const ingredientId=text(cup?.ingredientId)||null;

  const expectedClosing=finite(row?.expectedClosing);
  const physicalClosing=finite(
    row?.physicalClosing!==undefined
      ? row.physicalClosing
      : row?.closing
  );
  const variance=finite(row?.variance);

  const evidenceComplete=
    expectedClosing!==null&&
    physicalClosing!==null&&
    variance!==null;

  const resolution=ingredientId
    ? findCupReconOpname({
        reference,
        movements,
        ingredientId
      })
    : null;

  let status=STATUS.UNRESOLVED;

  if(evidenceComplete&&variance===0){
    status=STATUS.RESOLVED;
  }else if(evidenceComplete&&variance!==0&&resolution){
    status=STATUS.RESOLVED;
  }else if(evidenceComplete&&variance!==0&&ingredientId){
    status=STATUS.NEEDS_OPNAME;
  }

  const reason=reasonEvidence(reconciliation,code,row);

  return Object.freeze({
    reference,
    dateKey:dateKeyOf(shiftKey,reconciliation),
    shiftKey:text(shiftKey),
    sessionId:text(sessionId),
    shiftLabel:sessionLabel(session,shift),
    openedTs:finite(
      session?.openedTs??
      session?.startedTs??
      session?.startTs
    )??0,
    code,
    name:text(row?.name)||text(cup?.name)||code,
    ingredientId,
    expectedClosing,
    physicalClosing,
    variance,
    reason:reason.reason,
    reasonNote:reason.reasonNote,
    status,
    resolution:resolution||null,
    reconciliationCapturedAt:text(reconciliation?.capturedAt)||null
  });
}

function sessionReconciliations(shiftKey,shift,movements,cups){
  const items=[];
  const sessions=shift?.sessions;

  if(sessions&&typeof sessions==='object'){
    for(const [sessionId,session] of Object.entries(sessions)){
      const reconciliation=session?.cupControl?.reconciliation;
      if(!reconciliation?.rows||!Array.isArray(reconciliation.rows))continue;

      for(const row of reconciliation.rows){
        const item=buildItem({
          shiftKey,
          shift,
          sessionId,
          session,
          reconciliation,
          row,
          movements,
          cups
        });
        if(item)items.push(item);
      }
    }
  }

  // Shift-level reconciliation is continuity/fallback evidence only.
  // Use it only when no session-level reconciliation exists, avoiding duplicates.
  if(items.length===0){
    const reconciliation=
      shift?.cupControl?.reconciliation||
      shift?.closingSnapshot?.cupControl?.reconciliation;

    if(reconciliation?.rows&&Array.isArray(reconciliation.rows)){
      const sessionId=
        text(shift?.currentSessionId)||
        text(reconciliation?.sessionId)||
        'legacy';

      for(const row of reconciliation.rows){
        const item=buildItem({
          shiftKey,
          shift,
          sessionId,
          session:{},
          reconciliation,
          row,
          movements,
          cups
        });
        if(item)items.push(item);
      }
    }
  }

  return items;
}

function itemSort(a,b){
  const status=
    (STATUS_PRIORITY[a.status]??99)-
    (STATUS_PRIORITY[b.status]??99);

  if(status!==0)return status;

  if(a.openedTs!==b.openedTs)return a.openedTs-b.openedTs;

  return a.name.localeCompare(b.name,'id');
}

function countsFor(items=[]){
  const counts={
    total:items.length,
    unresolved:0,
    needsOpname:0,
    resolved:0
  };

  for(const item of items){
    if(item.status===STATUS.UNRESOLVED)counts.unresolved++;
    else if(item.status===STATUS.NEEDS_OPNAME)counts.needsOpname++;
    else if(item.status===STATUS.RESOLVED)counts.resolved++;
  }

  return Object.freeze(counts);
}

export function buildCupReconciliationGroups({
  shifts={},
  movements=[],
  cupRows=[]
}={}){
  const cups=cupMap(cupRows);
  const all=[];

  for(const [shiftKey,shift] of Object.entries(shifts||{})){
    all.push(
      ...sessionReconciliations(
        shiftKey,
        shift||{},
        movements,
        cups
      )
    );
  }

  const byDate=new Map();

  for(const item of all){
    if(!byDate.has(item.dateKey))mapPut(byDate,item.dateKey,[]);
    byDate.get(item.dateKey).push(item);
  }

  const groups=[...byDate.entries()]
    .sort(([a],[b])=>b.localeCompare(a))
    .map(([dateKey,items])=>{
      items.sort(itemSort);
      return Object.freeze({
        dateKey,
        counts:countsFor(items),
        items:Object.freeze([...items])
      });
    });

  return Object.freeze({
    summary:countsFor(all),
    groups:Object.freeze(groups)
  });
}

export const CUP_RECONCILIATION_STATUS_V1=STATUS;
