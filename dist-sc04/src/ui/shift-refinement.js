const DEFAULT_OPERATIONAL_TIME_ZONE='Asia/Jakarta';
function localDateString(date,timeZone=DEFAULT_OPERATIONAL_TIME_ZONE){
  const d=date instanceof Date?date:new Date(date);
  if(Number.isNaN(d.getTime())) throw new Error('SHIFT_DATE_INVALID');
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(d);
  const values=Object.fromEntries(parts.map(part=>[part.type,part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}
export function parseShiftKey(key){
  const raw=String(key||'');const match=/^(\d{4}-\d{2}-\d{2})-(S[123])$/.exec(raw);if(!match) return null;
  return Object.freeze({key:raw,date:match[1],code:match[2],selector:`-${match[2]}`});
}
function readOpenedAt(data,parsed){return data?.openedAt||data?.startedAt||data?.sessionControl?.startedAt||data?.sessions?.[data?.sessionControl?.currentSessionId]?.openedAt||`${parsed.date}T00:00:00`}
function isOpen(data){return !(data?.locked||data?.shiftStatus==='CLOSED'||data?.sessionControl?.status==='CLOSED')&&(data?.shiftStatus==='ACTIVE'||data?.sessionControl?.status==='ACTIVE'||Boolean(data?.currentSessionId||data?.sessionControl?.currentSessionId))}
function durationLabel(ms){const mins=Math.max(0,Math.floor(ms/60000)),h=Math.floor(mins/60),m=mins%60;return h?`${h} jam${m?` ${m} menit`:''}`:`${m} menit`}
export function shiftPresentation({key,data={},now=new Date(),timeZone=DEFAULT_OPERATIONAL_TIME_ZONE}={}){
  const parsed=parseShiftKey(key);if(!parsed) throw new Error('SHIFT_KEY_INVALID');
  const open=isOpen(data),today=localDateString(now,timeZone),overdue=open&&parsed.date<today,openedAt=readOpenedAt(data,parsed),openedMs=Date.parse(openedAt),durationMs=Number.isFinite(openedMs)?Math.max(0,new Date(now).getTime()-openedMs):0;
  return Object.freeze({key:parsed.key,date:parsed.date,code:parsed.code,selector:parsed.selector,open,overdue,durationMs,durationLabel:durationLabel(durationMs),canOwnerClose:open,autoClose:false,openedAt,closedAt:data.closedAt||null});
}
export function createStaleShiftAdapter(runtime=globalThis){
  const document=runtime?.document;
  function select(key){const parsed=parseShiftKey(key);if(!parsed) throw new Error('SHIFT_KEY_INVALID');const date=document?.getElementById?.('date-sel'),shift=document?.getElementById?.('shift-sel');if(date)date.value=parsed.date;if(shift)shift.value=parsed.selector;runtime?.changeDateAndShift?.();runtime?.showView?.(2);runtime?.openOpr?.(1);runtime?.SJShift?.render?.();return parsed}
  function openClosing(key){const parsed=select(key);if(typeof runtime?.SJShift?.openCloseModal!=='function') throw new Error('SHIFT_CLOSE_AUTHORITY_UNAVAILABLE');runtime.SJShift.openCloseModal();return parsed}
  return Object.freeze({select,openClosing});
}


function dateLabel(date,timeZone=DEFAULT_OPERATIONAL_TIME_ZONE){
  const d=new Date(`${String(date||'')}T12:00:00`);if(Number.isNaN(d.getTime()))return String(date||'');
  return new Intl.DateTimeFormat('id-ID',{timeZone,day:'2-digit',month:'short',year:'numeric'}).format(d).replace(/\./g,'');
}
export function shiftContextLabel(date,shiftLabel,timeZone=DEFAULT_OPERATIONAL_TIME_ZONE){
  return `${dateLabel(date,timeZone)} · ${String(shiftLabel||'Shift').trim()}`;
}
export function historicalShiftRows(snapshot,{now=new Date(),timeZone=DEFAULT_OPERATIONAL_TIME_ZONE}={}){
  const rows=[];
  for(const [key,data] of Object.entries(snapshot||{})){
    if(!parseShiftKey(key))continue;
    try{rows.push(Object.freeze({...shiftPresentation({key,data:data||{},now,timeZone}),data:data||{}}))}catch(_){}
  }
  return rows.sort((a,b)=>b.key.localeCompare(a.key));
}
