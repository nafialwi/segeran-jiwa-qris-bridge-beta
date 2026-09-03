const num=v=>Number.isFinite(Number(v))?Math.max(0,Number(v)):0;
const text=v=>String(v??'').trim();
const object=v=>v&&typeof v==='object'?v:{};

function physicalCheck(master,balance){
  return [master?.needsPhysicalCheck,master?.stocktakeDue,master?.variancePending,balance?.needsPhysicalCheck,balance?.stocktakeDue,balance?.variancePending].some(Boolean);
}
function fallbackTransfer(balance,master){
  const warning=num(master?.warningOutlet??master?.minOutlet),target=num(master?.targetOutlet),outlet=num(balance?.outlet),warehouse=num(balance?.warehouse);
  const need=Math.max(0,(target||warning)-outlet);return{needed:warning>0&&outlet<=warning&&warehouse>0&&need>0,qty:Math.min(warehouse,need)};
}
function fallbackPurchase(balance,master){
  const warehouse=num(balance?.warehouse),min=num(master?.minWarehouse),target=num(master?.targetWarehouse),need=Math.max(0,(target||min)-warehouse);
  return{needed:min>0&&warehouse<=min&&need>0,qty:need};
}
function actionFor(master,balance,core){
  if(physicalCheck(master,balance))return{action:'CHECK_PHYSICAL',label:'Perlu Cek Fisik',detail:'Verifikasi stok fisik sebelum koreksi.',qty:0};
  let transfer={needed:false,qty:0},purchase={needed:false,qty:0};
  try{transfer=core?.transferSuggestion?.(balance,master)||fallbackTransfer(balance,master)}catch(_){transfer=fallbackTransfer(balance,master)}
  if(transfer?.needed)return{action:'TRANSFER',label:'Perlu Transfer',detail:'Stok Gerai rendah, Gudang masih mencukupi.',qty:num(transfer.qty)};
  try{purchase=core?.purchaseSuggestion?.(balance,master)||fallbackPurchase(balance,master)}catch(_){purchase=fallbackPurchase(balance,master)}
  if(purchase?.needed)return{action:'BUY',label:'Perlu Beli',detail:'Stok Gudang/total perlu ditambah.',qty:num(purchase.qty)};
  return{action:'SAFE',label:'Aman',detail:'Stok terkendali.',qty:0};
}
export function buildIngredientInventoryRows(raw={}, {core=null}={}){
  const ingredients=object(raw?.ingredients),balances=object(object(raw?.balances).ingredients);
  return Object.keys(ingredients).filter(id=>ingredients[id]?.active!==false).map(id=>{
    const master=ingredients[id]||{},balance=Object.assign({outlet:0,warehouse:0},balances[id]||{}),decision=actionFor(master,balance,core);
    const outletQty=num(balance.outlet),warehouseQty=num(balance.warehouse);
    return Object.freeze({id:text(master.id||id)||id,name:text(master.name||id)||id,unit:text(master.unit||'unit')||'unit',category:text(master.category||''),outletQty,warehouseQty,totalQty:outletQty+warehouseQty,action:decision.action,actionLabel:decision.label,actionDetail:decision.detail,suggestedQty:decision.qty,master:Object.freeze({...master}),balance:Object.freeze({...balance})});
  }).sort((a,b)=>{const rank={CHECK_PHYSICAL:0,TRANSFER:1,BUY:2,SAFE:3};return (rank[a.action]??9)-(rank[b.action]??9)||a.name.localeCompare(b.name)});
}
export function summarizeIngredientInventory(rows=[]){
  const list=Array.isArray(rows)?rows:[],count=action=>list.filter(x=>x.action===action).length;
  return Object.freeze({total:list.length,safe:count('SAFE'),transfer:count('TRANSFER'),buy:count('BUY'),check:count('CHECK_PHYSICAL'),needsAction:list.filter(x=>x.action!=='SAFE').length});
}

function movementList(raw={}){
  return Object.keys(object(raw?.movements)).map(id=>{
    const m=raw.movements[id]||{};
    return Object.freeze({
      id:text(m.id||id)||id,
      itemType:text(m.itemType||'unknown')||'unknown',
      itemId:text(m.itemId||m.productId),
      itemName:text(m.itemName||m.productName||m.itemId||m.productId)||'Item',
      type:text(m.type||m.reason||'ACTIVITY')||'ACTIVITY',
      location:text(m.location),
      delta:Number(m.delta)||0,
      beforeQty:Number.isFinite(Number(m.beforeQty))?Number(m.beforeQty):null,
      afterQty:Number.isFinite(Number(m.afterQty))?Number(m.afterQty):null,
      ts:Number(m.ts)||0,
      at:text(m.at),note:text(m.note),user:text(m.user),refId:text(m.refId||m.purchaseRef||m.transactionId)
    });
  }).sort((a,b)=>b.ts-a.ts||String(b.id).localeCompare(String(a.id)));
}

export function recentInventoryMovements(raw={},limit=8){
  return movementList(raw).slice(0,Math.max(0,Number(limit)||0));
}

function humanActivity(m){
  const common={id:m.id,itemType:m.itemType,itemId:m.itemId,itemName:m.itemName,ts:m.ts,note:m.note,user:m.user,refId:m.refId,movementIds:[m.id],delta:m.delta,beforeQty:m.beforeQty,afterQty:m.afterQty,location:m.location};
  if(m.type==='PURCHASE')return Object.freeze({...common,kind:'PURCHASE',title:'Pembelian',direction:'Masuk ke Gudang',qty:Math.abs(m.delta)});
  if(m.type==='OPNAME')return Object.freeze({...common,kind:'OPNAME',title:'Cek Stok Fisik',direction:m.location==='warehouse'?'Gudang':'Gerai',qty:Math.abs(m.delta)});
  if(m.type==='SALE_RECIPE')return Object.freeze({...common,kind:'SALE_RECIPE',title:'Pemakaian Resep',direction:'Pemakaian di Gerai',qty:Math.abs(m.delta)});
  if(m.type==='TRANSFER_OUT'||m.type==='TRANSFER_IN')return Object.freeze({...common,kind:'TRANSFER',title:'Pindah Stok',direction:'Gudang → Gerai',qty:Math.abs(m.delta)});
  return Object.freeze({...common,kind:m.type||'ACTIVITY',title:'Penyesuaian Stok',direction:m.location==='warehouse'?'Gudang':m.location==='outlet'?'Gerai':'Persediaan',qty:Math.abs(m.delta)});
}

export function inventoryActivityTimeline(raw={},limit=40){
  const list=movementList(raw),used=Object.create(null),out=[];
  for(const m of list){
    if(used[m.id])continue;
    if(m.type==='TRANSFER_OUT'||m.type==='TRANSFER_IN'){
      const opposite=m.type==='TRANSFER_OUT'?'TRANSFER_IN':'TRANSFER_OUT';
      const peer=list.find(x=>!used[x.id]&&x.id!==m.id&&x.type===opposite&&x.ts===m.ts&&x.itemType===m.itemType&&x.itemId===m.itemId&&Math.abs(x.delta)===Math.abs(m.delta));
      if(peer){
        used[m.id]=true;used[peer.id]=true;
        out.push(Object.freeze({
          id:`TRANSFER:${m.itemType}:${m.itemId}:${m.ts}`,
          kind:'TRANSFER',title:'Pindah Stok',direction:'Gudang → Gerai',
          itemType:m.itemType,itemId:m.itemId,itemName:m.itemName||peer.itemName,
          qty:Math.max(Math.abs(m.delta),Math.abs(peer.delta)),delta:0,ts:m.ts,
          note:m.note||peer.note,user:m.user||peer.user,refId:m.refId||peer.refId,
          movementIds:[m.id,peer.id],beforeQty:null,afterQty:null,location:'warehouse_to_outlet'
        }));
        if(out.length>=Math.max(0,Number(limit)||0))break;
        continue;
      }
    }
    used[m.id]=true;out.push(humanActivity(m));
    if(out.length>=Math.max(0,Number(limit)||0))break;
  }
  return out;
}
