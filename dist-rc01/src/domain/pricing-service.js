/** Pure extraction of v1.0.40 SJPrice economic rules. */
export const PRICING_VERSION='0.1.0';
export function num(v){v=Number(v);return Number.isFinite(v)?v:0}
export function clamp(v,a,b){return Math.min(b,Math.max(a,num(v)))}
export function normalizeDiscountType(v){return String(v||'PERCENT').toUpperCase()==='NOMINAL'?'NOMINAL':'PERCENT'}
export function normalizeSettings(raw){
  raw=raw&&typeof raw==='object'?raw:{};
  return {taxEnabled:!!raw.taxEnabled,taxRate:clamp(raw.taxRate,0,100),serviceEnabled:!!raw.serviceEnabled,serviceRate:clamp(raw.serviceRate,0,100),cashierMaxDiscountPercent:clamp(raw.cashierMaxDiscountPercent,0,100)};
}
export function discountAmount(base,type,value){
  base=Math.max(0,num(base));type=normalizeDiscountType(type);value=Math.max(0,num(value));
  const out=type==='PERCENT'?Math.round(base*clamp(value,0,100)/100):Math.round(value);
  return Math.min(base,out);
}
function normalizeCartDiscount(cd){cd=cd||{};return{type:normalizeDiscountType(cd.type),value:Math.max(0,num(cd.value))}}
export function quote(items,opts={}){
  const st=normalizeSettings(opts.settings||{}),cd=normalizeCartDiscount(opts.cartDiscount||{});
  let subtotal=0,itemDiscountTotal=0;
  const lines=(items||[]).map((x,idx)=>{
    const gross=Math.max(0,Math.round(num(x?.p)*num(x?.q))),idisc=discountAmount(gross,x?.discountType,x?.discountValue),net=Math.max(0,gross-idisc);
    subtotal+=gross;itemDiscountTotal+=idisc;
    return{index:idx,id:String(x?.id!=null?x.id:''),gross,itemDiscount:idisc,net,discountType:normalizeDiscountType(x?.discountType),discountValue:Math.max(0,num(x?.discountValue))};
  });
  const afterItems=Math.max(0,subtotal-itemDiscountTotal);
  const transactionDiscountTotal=discountAmount(afterItems,cd.type,cd.value);
  const discountTotal=Math.min(subtotal,itemDiscountTotal+transactionDiscountTotal);
  const netSubtotal=Math.max(0,subtotal-discountTotal);
  const serviceCharge=st.serviceEnabled?Math.round(netSubtotal*st.serviceRate/100):0;
  const taxBase=netSubtotal+serviceCharge;
  const tax=st.taxEnabled?Math.round(taxBase*st.taxRate/100):0;
  const total=Math.max(0,netSubtotal+serviceCharge+tax);
  return{version:PRICING_VERSION,subtotal,itemDiscountTotal,transactionDiscountTotal,discountTotal,netSubtotal,serviceCharge,taxBase,tax,total,settings:st,cartDiscount:cd,lines};
}
export function authorize(q,role){
  q=q||quote([]);if(String(role||'')!=='transaksi')return{ok:true};
  const st=q.settings||normalizeSettings({}),pct=q.subtotal>0?(q.discountTotal/q.subtotal*100):0,max=num(st.cashierMaxDiscountPercent);
  if(pct>max+0.0001)return{ok:false,code:'DISCOUNT_LIMIT',message:`Diskon ${pct.toFixed(1)}% melebihi batas kasir ${max.toFixed(1)}%. Minta Owner mengubah diskon atau batas kasir.`};
  return{ok:true};
}
function hash(v){const s=String(v||'');let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return('00000000'+(h>>>0).toString(16)).slice(-8)}
export function fingerprint(items,opts){
  const q=quote(items,opts),sig={d:q.discountTotal,s:q.serviceCharge,t:q.tax,total:q.total,cd:q.cartDiscount,st:q.settings,lines:q.lines.map(x=>[x.id,x.itemDiscount,x.discountType,x.discountValue])};
  return hash(JSON.stringify(sig));
}
export function fromSnapshot(p){
  p=p&&typeof p==='object'?p:{};
  return{subtotal:num(p.subtotal),itemDiscountTotal:num(p.itemDiscountTotal),transactionDiscountTotal:num(p.transactionDiscountTotal),discountTotal:num(p.discountTotal),netSubtotal:p.netSubtotal!=null?num(p.netSubtotal):Math.max(0,num(p.subtotal)-num(p.discountTotal)),serviceCharge:num(p.serviceCharge),taxBase:num(p.taxBase),tax:num(p.tax),total:num(p.total),settings:normalizeSettings(p.settings||{}),cartDiscount:p.cartDiscount||{type:'PERCENT',value:0},lines:Array.isArray(p.lines)?p.lines:[]};
}
export function fromTx(tx){
  tx=tx||{};if(tx.pricing)return fromSnapshot(tx.pricing);
  return fromSnapshot({subtotal:tx.subtotal!=null?tx.subtotal:tx.total,itemDiscountTotal:tx.itemDiscountTotal,transactionDiscountTotal:tx.transactionDiscountTotal,discountTotal:tx.discountTotal,netSubtotal:tx.netSubtotal!=null?tx.netSubtotal:tx.total,serviceCharge:tx.serviceCharge,tax:tx.tax,total:tx.total});
}
export function hasBreakdown(q){q=q||{};return num(q.discountTotal)>0||num(q.serviceCharge)>0||num(q.tax)>0}
export function refundAllocation(tx,chosen){
  tx=tx||{};chosen=chosen||[];
  const p=fromTx(tx),base=Array.isArray(tx.cartData)?tx.cartData:(Array.isArray(tx.items)?tx.items:[]),lines=p.lines||[];
  let gross=0,itemDisc=0,selectedAfterItem=0;const allAfterItem=Math.max(0,p.subtotal-p.itemDiscountTotal);
  chosen.forEach(row=>{
    const i=num(row.index),orig=base[i]||{},oq=Math.max(0,num(orig.q)),rq=Math.min(oq,Math.max(0,num(row.q))),ratio=oq>0?rq/oq:0,line=lines[i]||{gross:Math.round(num(orig.p)*oq),itemDiscount:0,net:Math.round(num(orig.p)*oq)};
    gross+=Math.round(num(line.gross)*ratio);itemDisc+=Math.round(num(line.itemDiscount)*ratio);selectedAfterItem+=Math.round(num(line.net)*ratio);
  });
  if(gross<=0)return{subtotal:0,itemDiscountTotal:0,transactionDiscountTotal:0,discountTotal:0,netSubtotal:0,serviceCharge:0,tax:0,total:0};
  const full=chosen.length&&base.length&&base.every((x,i)=>{const row=chosen.find(r=>num(r.index)===i);return row&&num(row.q)>=num(x.q)});
  if(full)return{subtotal:p.subtotal,itemDiscountTotal:p.itemDiscountTotal,transactionDiscountTotal:p.transactionDiscountTotal,discountTotal:p.discountTotal,netSubtotal:p.netSubtotal,serviceCharge:p.serviceCharge,tax:p.tax,total:p.total};
  const txDisc=allAfterItem>0?Math.min(selectedAfterItem,Math.round(p.transactionDiscountTotal*selectedAfterItem/allAfterItem)):0,discount=itemDisc+txDisc,net=Math.max(0,gross-discount),service=p.netSubtotal>0?Math.round(p.serviceCharge*net/p.netSubtotal):0,taxBase=net+service,origTaxBase=p.netSubtotal+p.serviceCharge,tax=origTaxBase>0?Math.round(p.tax*taxBase/origTaxBase):0;
  let total=Math.max(0,net+service+tax);const remaining=Math.max(0,num(tx.total)-num(tx.refundTotal));if(total>remaining)total=remaining;
  return{subtotal:gross,itemDiscountTotal:itemDisc,transactionDiscountTotal:txDisc,discountTotal:discount,netSubtotal:net,serviceCharge:service,tax,total};
}
