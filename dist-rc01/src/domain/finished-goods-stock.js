const num=v=>Number.isFinite(Number(v))?Math.max(0,Number(v)):0;
const text=v=>String(v??'').trim();
export const FINISHED_GOODS_EXCEPTION_REASONS=Object.freeze(['RUSAK','BASI','SOBEK','BOCOR','KEDALUWARSA','HILANG','SELISIH']);

export function buildFinishedGoodsRows(products=[],balances={}){
  const warehouse=balances?.warehouse||{},outlet=balances?.outlet||{};
  return (Array.isArray(products)?products:[]).filter(p=>p?.trackStock===true).map(p=>Object.freeze({
    id:text(p?.id),
    name:text(p?.n||p?.name||p?.id)||'Produk',
    sku:text(p?.sku||p?.code||p?.barcode),
    warehouseQty:num(warehouse?.[p?.id]),
    outletQty:num(outlet?.[p?.id])
  }));
}

export function filterFinishedGoodsRows(rows=[],query=''){
  const q=text(query).toLowerCase();
  if(!q)return Array.isArray(rows)?rows.slice():[];
  return (Array.isArray(rows)?rows:[]).filter(row=>`${text(row?.id)} ${text(row?.name)} ${text(row?.sku)}`.toLowerCase().includes(q));
}

export function endingStockDecision(input={}){
  const disposition=String(input.disposition||'STAY').toUpperCase(),systemQty=num(input.systemQty),countedQty=num(input.countedQty),delta=countedQty-systemQty;
  if(disposition==='STAY')return Object.freeze({kind:'NO_MOVEMENT',mutationAllowed:false,requiresOwner:false,authority:null,systemQty,countedQty,delta,location:'OUTLET'});
  const reason=String(input.reason||'SELISIH').toUpperCase();if(!FINISHED_GOODS_EXCEPTION_REASONS.includes(reason))throw new Error('FINISHED_GOODS_REASON_INVALID');
  const productName=text(input.productName)||text(input.productId)||'Produk',reporter=text(input.reportedBy)||'Kasir',note=text(input.note)||'-';
  const whatsappText=`DRAFT PENYESUAIAN STOK BARANG JADI\nProduk: ${productName}\nStok sistem Gerai: ${systemQty}\nHitung fisik: ${countedQty}\nSelisih: ${delta}\nAlasan: ${reason}\nCatatan: ${note}\nPelapor: ${reporter}\n\nStatus: BELUM MENGUBAH STOK. Owner meninjau laporan ini dan melakukan rekonsiliasi melalui Inventory V2 / Stock Opname sebelum saldo berubah.`;
  return Object.freeze({kind:'OWNER_RECONCILIATION_DRAFT',mutationAllowed:false,requiresOwner:true,authority:'INVENTORY_V2_OPNAME',systemQty,countedQty,delta,reason,note,productId:text(input.productId),productName,reportedBy:reporter,whatsappText});
}
