import { aggregateProductLeaderboard, transactionItemLines } from './report-product-analytics.js';
import { reportDateKey, reportShiftCode } from './report-v29-scope.js';

const num=v=>Number.isFinite(Number(v))?Number(v):0;
const statusOf=tx=>String(tx?.status||'').toUpperCase();
export const isVoidedTransaction=tx=>['VOID','VOIDED','CANCELLED','CANCELED'].includes(statusOf(tx));
const methodOf=tx=>String(tx?.paymentMethod??tx?.method??tx?.payment?.method??tx?.payment??'LAINNYA').trim().toUpperCase()||'LAINNYA';
const timestampOf=tx=>{const raw=tx?.ts??tx?.timestamp??tx?.createdTs??tx?.createdAt??tx?.time;const n=Number(raw);if(Number.isFinite(n)&&n>0)return n;const parsed=Date.parse(raw||'');return Number.isFinite(parsed)?parsed:0};

function refundNet(tx){
  const r=tx?.refundPricingTotals||{};
  for(const v of [r.netSubtotal,r.netSales,tx?.refundNetSubtotal,tx?.refundNetSales]) if(Number.isFinite(Number(v))) return Math.max(0,num(v));
  const legacy=Math.max(0,num(tx?.refundTotal));
  if(!legacy)return 0;
  const total=Math.max(0,num(tx?.pricing?.total??tx?.grandTotal??tx?.total));
  const net=Math.max(0,num(tx?.pricing?.netSubtotal??tx?.pricing?.netSales??tx?.netSubtotal??tx?.netSales??total));
  return total>0?Math.min(net,net*(legacy/total)):Math.min(net,legacy);
}
export function transactionNetSales(tx={}){
  if(isVoidedTransaction(tx))return 0;
  const gross=Math.max(0,num(tx?.pricing?.netSubtotal??tx?.pricing?.netSales??tx?.netSubtotal??tx?.netSales??tx?.pricing?.total??tx?.grandTotal??tx?.total));
  return Math.max(0,Math.round(gross-refundNet(tx)));
}
export function transactionItemCount(tx={}){return transactionItemLines(tx).reduce((sum,line)=>sum+Math.max(0,num(line.netQty)),0)}

export function salesAnalytics(transactions=[]){
  const valid=(transactions||[]).filter(tx=>!isVoidedTransaction(tx));
  let netSales=0,itemCount=0;const payment=Object.create(null);
  for(const tx of valid){
    const amount=transactionNetSales(tx),items=transactionItemCount(tx),method=methodOf(tx);
    netSales+=amount;itemCount+=items;
    const row=payment[method]||(payment[method]={method,count:0,amount:0});row.count++;row.amount+=amount;
  }
  const paymentMix=Object.values(payment).sort((a,b)=>b.amount-a.amount||b.count-a.count||a.method.localeCompare(b.method));
  return Object.freeze({netSales:Math.round(netSales),transactionCount:valid.length,itemCount,averageTransaction:valid.length?Math.round(netSales/valid.length):0,paymentMix:Object.freeze(paymentMix.map(Object.freeze)),topByQty:Object.freeze(aggregateProductLeaderboard(valid,{sortBy:'qty'})),topByRevenue:Object.freeze(aggregateProductLeaderboard(valid,{sortBy:'revenue'}))});
}

function dayKey(ts){const d=new Date(ts||0);if(!Number.isFinite(d.getTime()))return'Unknown';return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
export function chartBuckets(transactions=[]){
  const map=Object.create(null);
  for(const tx of transactions||[]){if(isVoidedTransaction(tx))continue;const ts=timestampOf(tx);if(!ts)continue;const key=dayKey(ts),row=map[key]||(map[key]={key,label:new Date(ts).toLocaleDateString('id-ID',{day:'2-digit',month:'short'}),revenue:0,transactions:0,items:0});row.revenue+=transactionNetSales(tx);row.transactions++;row.items+=transactionItemCount(tx)}
  return Object.freeze(Object.values(map).sort((a,b)=>a.key.localeCompare(b.key)).map(row=>Object.freeze({...row,revenue:Math.round(row.revenue)})));
}

const SHIFT_LABELS=Object.freeze({S1:'Pagi',S2:'Siang',S3:'Malam'});
function hourKey(ts){const d=new Date(ts||0);return Number.isFinite(d.getTime())?String(d.getHours()).padStart(2,'0'):''}
function scopedBucketIdentity(tx,{scope='day',shift='ALL'}={}){
  scope=String(scope||'day').toLowerCase();shift=String(shift||'ALL').toUpperCase();const ts=timestampOf(tx);
  if(scope==='shift'||(scope==='day'&&shift!=='ALL')){const key=hourKey(ts);return key?{key,label:`${key}.00`}:null}
  if(scope==='day'){
    const key=reportShiftCode(tx);return key?{key,label:SHIFT_LABELS[key]?`Shift ${SHIFT_LABELS[key]}`:key}:null;
  }
  const key=reportDateKey(tx)||(ts?dayKey(ts):'');if(!key)return null;
  const d=new Date(`${key}T12:00:00`);return{key,label:Number.isFinite(d.getTime())?d.toLocaleDateString('id-ID',{day:'2-digit',month:'short'}):key};
}
export function chartBucketsForScope(transactions=[],options={}){
  const rows=Object.create(null);
  for(const tx of transactions||[]){
    if(isVoidedTransaction(tx))continue;const id=scopedBucketIdentity(tx,options);if(!id)continue;
    const row=rows[id.key]||(rows[id.key]={key:id.key,label:id.label,revenue:0,transactions:0,items:0});
    row.revenue+=transactionNetSales(tx);row.transactions++;row.items+=transactionItemCount(tx);
  }
  return Object.freeze(Object.values(rows).sort((a,b)=>a.key.localeCompare(b.key)).map(row=>Object.freeze({...row,revenue:Math.round(row.revenue)})));
}

