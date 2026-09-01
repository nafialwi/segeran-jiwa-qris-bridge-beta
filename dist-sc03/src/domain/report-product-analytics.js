const num=v=>Number.isFinite(Number(v))?Number(v):0;
const text=v=>String(v??'').trim();

function baseItems(tx){
  if(Array.isArray(tx?.cartData))return tx.cartData;
  if(Array.isArray(tx?.items))return tx.items;
  return [];
}
function refundedAt(tx,index,item){
  const map=tx?.refundedQty&&typeof tx.refundedQty==='object'?tx.refundedQty:{};
  const candidates=[index,String(index),item?.lineIndex,item?.id!=null?String(item.id):null].filter(v=>v!==null&&v!==undefined);
  for(const key of candidates){if(Object.prototype.hasOwnProperty.call(map,key))return Math.max(0,num(map[key]));}
  return 0;
}
function lineNet(tx,index,item,originalQty){
  const line=Array.isArray(tx?.pricing?.lines)?tx.pricing.lines[index]:null;
  const stored=[line?.net,line?.netRevenue,line?.lineNet,line?.total].find(v=>Number.isFinite(Number(v)));
  if(stored!==undefined)return Math.max(0,num(stored));
  return Math.max(0,num(item?.p??item?.price))*Math.max(0,originalQty);
}

export function transactionItemLines(tx={}){
  const voided=String(tx?.status||'').toUpperCase()==='VOIDED';
  return baseItems(tx).map((item,index)=>{
    const originalQty=Math.max(0,num(item?.q??item?.qty??item?.quantity));
    const refundedQty=Math.min(originalQty,refundedAt(tx,index,item));
    const netQty=voided?0:Math.max(0,originalQty-refundedQty);
    const grossLine=lineNet(tx,index,item,originalQty);
    const netRevenue=voided||originalQty<=0?0:Math.max(0,Math.round(grossLine*(netQty/originalQty)));
    return Object.freeze({
      index,
      id:text(item?.baseProductId??item?.id??item?.productId??`line-${index}`),
      name:text(item?.n??item?.name??item?.productName??item?.id??`Produk ${index+1}`),
      originalQty,
      refundedQty,
      netQty,
      unitPrice:Math.max(0,num(item?.p??item?.price)),
      netRevenue,
      variant:text(item?.variantName??item?.recipeVariantName??''),
      sku:text(item?.sku??item?.SKU??''),
      image:text(item?.savedImg??item?.img??item?.i??'')
    });
  });
}

export function aggregateProductLeaderboard(transactions=[],{sortBy='qty'}={}){
  const map=Object.create(null);
  for(const tx of transactions||[]){
    for(const line of transactionItemLines(tx)){
      if(line.netQty<=0&&line.netRevenue<=0)continue;
      const key=line.id||line.name;
      const row=map[key]||(map[key]={id:key,name:line.name,qty:0,revenue:0,_tx:new Set()});
      row.qty+=line.netQty;row.revenue+=line.netRevenue;row._tx.add(String(tx?.id??tx?._key??tx?.ts??Math.random()));
    }
  }
  const rows=Object.values(map).map(row=>Object.freeze({id:row.id,name:row.name,qty:row.qty,revenue:Math.round(row.revenue),transactions:row._tx.size}));
  rows.sort((a,b)=>sortBy==='revenue'?(b.revenue-a.revenue||b.qty-a.qty||a.name.localeCompare(b.name)):(b.qty-a.qty||b.revenue-a.revenue||a.name.localeCompare(b.name)));
  return rows;
}
