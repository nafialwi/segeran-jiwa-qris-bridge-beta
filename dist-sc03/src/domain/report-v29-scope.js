const SHIFT_KEY=/^(\d{4}-\d{2}-\d{2})-(S[123])$/i;
const text=v=>String(v??'').trim();

function parseDate(value){
  const m=text(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);if(!m)return null;
  const d=new Date(Number(m[1]),Number(m[2])-1,Number(m[3]),12,0,0,0);
  if(d.getFullYear()!==Number(m[1])||d.getMonth()!==Number(m[2])-1||d.getDate()!==Number(m[3]))return null;
  return d;
}
function ymd(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function rowShiftKey(row={}){
  for(const raw of [row?._shift,row?.shift,row?.shiftId,row?.shiftKey,row?.id,row?._key]){
    const value=text(raw);if(SHIFT_KEY.test(value))return value;
  }
  return '';
}
export function reportDateKey(row={}){const m=rowShiftKey(row).match(SHIFT_KEY);return m?m[1]:''}
export function reportShiftCode(row={}){const m=rowShiftKey(row).match(SHIFT_KEY);return m?m[2].toUpperCase():''}
export function monthWeekIndex(value){const d=parseDate(value);return d?Math.ceil(d.getDate()/7):0}

export function reportScopePeriod({scope='day',anchorDate,from,to}={}){
  scope=text(scope).toLowerCase()||'day';
  if(scope==='custom'){
    const a=parseDate(from),b=parseDate(to);if(!a||!b||b<a)throw new Error('REPORT_SCOPE_DATE_INVALID');
    return Object.freeze({scope,preset:'custom',explicit:Object.freeze({from:ymd(a),to:ymd(b)}),label:`${ymd(a)} – ${ymd(b)}`});
  }
  const anchor=parseDate(anchorDate);if(!anchor)throw new Error('REPORT_SCOPE_ANCHOR_INVALID');
  let start=new Date(anchor),end=new Date(anchor),label='Hari';
  if(scope==='week'){
    const offset=(anchor.getDay()+6)%7;start.setDate(anchor.getDate()-offset);end=new Date(start);end.setDate(start.getDate()+6);label='Minggu';
  }else if(scope==='month'){
    start=new Date(anchor.getFullYear(),anchor.getMonth(),1,12);end=new Date(anchor.getFullYear(),anchor.getMonth()+1,0,12);label='Bulan';
  }else if(scope==='shift'){label='Shift'}
  else{scope='day';label='Hari'}
  return Object.freeze({scope,preset:'custom',explicit:Object.freeze({from:ymd(start),to:ymd(end)}),label});
}

function weekValue(v){if(v===undefined||v===null||String(v).toUpperCase()==='ALL'||v==='')return 0;const n=Number(String(v).replace(/^W/i,''));return Number.isInteger(n)&&n>=1&&n<=5?n:0}
function normalized(filters={}){
  const shift=text(filters.shift).toUpperCase();
  return Object.freeze({shift:shift&&shift!=='ALL'?shift:'',day:text(filters.day)&&String(filters.day).toUpperCase()!=='ALL'?text(filters.day):'',week:weekValue(filters.week)});
}
function match(row,filters){
  if(!filters.shift&&!filters.day&&!filters.week)return true;
  const date=reportDateKey(row),shift=reportShiftCode(row);if(!date||!shift)return false;
  if(filters.shift&&shift!==filters.shift)return false;
  if(filters.day&&date!==filters.day)return false;
  if(filters.week&&monthWeekIndex(date)!==filters.week)return false;
  return true;
}
export function filterReportModel(model={},filters={}){
  const f=normalized(filters),out={...model};
  for(const key of ['transactions','shifts','expenses','debtPayments','movements'])if(Array.isArray(model?.[key]))out[key]=model[key].filter(row=>match(row,f));
  out.scopeFilters=f;
  return out;
}
