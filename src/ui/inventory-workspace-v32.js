import { createInventoryRepository } from '../data/repositories/inventory-repository.js';
import { buildIngredientInventoryRows, summarizeIngredientInventory, inventoryActivityTimeline } from '../domain/inventory-v32-analytics.js';
import { buildFinishedGoodsRows } from '../domain/finished-goods-stock.js';
import { activeProducts } from './sales-shift-ux-refinement.js';
import { renderIcon } from './icons.js';
import { CUP_CATALOG_V34, buildCupInventoryRowsV34, buildCupLocalSimulationRowsV34, ensureCupLocalSimulationStoreV34, planCupInitialSetupV34, validateCupInitialSetupV34 } from '../domain/packaging-cup-v34.js';

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=v=>Number.isFinite(Number(v))?Number(v):0;
const qty=(v,u)=>`${new Intl.NumberFormat('id-ID',{maximumFractionDigits:2}).format(num(v))} ${String(u||'')}`.trim();
const money=v=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(num(v));
const ownerRole=role=>['owner','manajemen'].includes(String(role||'').toLowerCase());
const actionMap=Object.freeze({TRANSFER:'transfer',BUY:'purchase',CHECK_PHYSICAL:'opname'});
const actionTitle=Object.freeze({transfer:'Pindahkan Stok',purchase:'Catat Pembelian',opname:'Cek Stok Fisik'});

export function routeLegacyInventoryTabV32(tab='summary'){
  const value=String(tab||'summary').toLowerCase();
  if(['summary','workspace','stock','activity','more'].includes(value))return{kind:'workspace',tab:value==='workspace'?'summary':value};
  if(value==='movements')return{kind:'workspace',tab:'activity'};
  if(['transfer','purchase','opname'].includes(value))return{kind:'action',action:value};
  if(value==='ingredients')return{kind:'workspace',tab:'more'};
  if(value==='recipes')return{kind:'advanced',tab:'recipes'};
  return{kind:'advanced',tab:value};
}

function nav(tab){
  return `<nav class="sj-v32-inv-nav" aria-label="Menu Inventori">${[['summary','Ringkasan'],['stock','Stok'],['activity','Aktivitas'],['more','Lainnya']].map(([id,label])=>`<button type="button" data-v32-inventory-tab="${id}" class="${tab===id?'active':''}">${label}</button>`).join('')}</nav>`;
}
function statusClass(action){return action==='TRANSFER'?'transfer':action==='BUY'?'buy':action==='CHECK_PHYSICAL'?'check':'safe'}
function rowAction(row,intent=''){
  const action=intent||actionMap[row.action]||'';
  if(!action)return '<span class="sj-v32-inv-ok">Aman</span>';
  const label=intent?`Pilih untuk ${actionTitle[intent]}`:row.actionLabel;
  return `<button type="button" data-v32-inventory-action="${action}" data-v32-ingredient-id="${esc(row.id)}">${esc(label)}</button>`;
}
function stockRow(row,intent=''){
  const openAttrs=intent?`data-v32-inventory-action="${esc(intent)}" data-v32-ingredient-id="${esc(row.id)}"`:`data-v32-inventory-open-item="${esc(row.id)}"`;
  return `<article class="sj-v32-inv-stock-row ${statusClass(row.action)}" data-v32-inventory-row="${esc(row.id)}" data-action-state="${esc(row.action)}"><button type="button" class="sj-v32-inv-stock-open" ${openAttrs}><div class="sj-v32-inv-stock-head"><span><b>${esc(row.name)}</b><small>Bahan Baku${row.category?` · ${esc(row.category)}`:''}</small></span><em>${esc(row.actionLabel)}</em></div><div class="sj-v32-inv-split"><span><small>Gerai</small><strong>${esc(qty(row.outletQty,row.unit))}</strong></span><span><small>Gudang</small><strong>${esc(qty(row.warehouseQty,row.unit))}</strong></span><span><small>Total</small><strong>${esc(qty(row.totalQty,row.unit))}</strong></span></div><p>${esc(row.actionDetail||'')}</p><span class="sj-v32-inv-open-hint">${intent?'Pilih bahan ini':'Buka detail & atur'} →</span></button>${rowAction(row,intent)}</article>`;
}
function summaryHTML(rows=[]){
  const s=summarizeIngredientInventory(rows),attention=rows.filter(x=>x.action!=='SAFE');
  return `<section class="sj-v32-inv-overview"><div class="sj-v32-inv-kpis"><article><small>Bahan Aktif</small><strong>${s.total}</strong></article><article><small>Perlu Tindakan</small><strong>${s.needsAction}</strong></article><article><small>Perlu Transfer</small><strong>${s.transfer}</strong></article><article><small>Perlu Beli</small><strong>${s.buy}</strong></article></div><aside class="sj-v32-inv-principle"><b>Observe → Understand → Act</b><span>Klik item untuk melihat posisi stok, aturan, aktivitas, lalu proses dari satu tempat.</span></aside><section class="sj-v32-inv-section"><div class="sj-v32-inv-section-head"><h3>Perlu Tindakan</h3><span>${attention.length} item</span></div><div class="sj-v32-inv-action-list">${attention.length?attention.slice(0,10).map(x=>stockRow(x)).join(''):'<div class="sj-v32-inv-empty">Semua bahan dalam kondisi terkendali.</div>'}</div></section></section>`;
}
function visibleStockRows(rows=[],query='',filter='ALL'){
  const q=String(query||'').trim().toLowerCase();let visible=rows.filter(r=>!q||`${r.name} ${r.id} ${r.category}`.toLowerCase().includes(q));
  if(filter==='ACTION')visible=visible.filter(x=>x.action!=='SAFE');
  else if(filter==='TRANSFER')visible=visible.filter(x=>x.action==='TRANSFER');
  else if(filter==='BUY')visible=visible.filter(x=>x.action==='BUY');
  return visible;
}
function stockRowsHTML(rows=[],query='',filter='ALL',intent=''){
  const visible=visibleStockRows(rows,query,filter);
  return visible.length?visible.map(x=>stockRow(x,intent)).join(''):'<div class="sj-v32-inv-empty">Bahan tidak ditemukan.</div>';
}
function stockHTML(rows=[],query='',filter='ALL',intent=''){
  const intentNote=intent?`<aside class="sj-v32-inv-intent"><b>${actionTitle[intent]}</b><span>Cari dan pilih bahan. Form v3 akan terbuka dengan item sudah terpilih.</span><button type="button" data-v32-inventory-intent-cancel>Batal</button></aside>`:'';
  return `${intentNote}<label class="sj-v32-inv-search"><span>${renderIcon('search',{size:18})}</span><input type="search" data-v32-inventory-search value="${esc(query)}" placeholder="Cari bahan / kategori..." aria-label="Cari bahan"></label><div class="sj-v32-inv-filters">${[['ALL','Semua'],['ACTION','Perlu Tindakan'],['TRANSFER','Transfer'],['BUY','Perlu Beli']].map(([id,label])=>`<button type="button" data-v32-inventory-filter="${id}" class="${filter===id?'active':''}">${label}</button>`).join('')}</div><section class="sj-v32-inv-stock-list" data-v32-inventory-stock-list>${stockRowsHTML(rows,query,filter,intent)}</section>`;
}
export function renderCupInventorySectionV34(cupRows=[],{readOnly=false}={}){
  const rows=Array.isArray(cupRows)?cupRows:[],missing=rows.filter(x=>!x?.registered);
  const cards=rows.map(row=>{
    if(!row?.registered)return `<article class="sj-v34-cup-card missing" data-v34-cup-code="${esc(row?.code)}"><header><div><small>Kemasan · pcs</small><b>${esc(row?.name)}</b></div><em>Belum terdaftar</em></header><p>Master Inventory V2 belum tersedia.</p></article>`;
    const wac=row.costKnown&&row.wac!==null?money(row.wac):'Belum tersedia';
    return `<article class="sj-v34-cup-card" data-v34-cup-code="${esc(row.code)}" data-v34-cup-ingredient-id="${esc(row.ingredientId)}"><header><div><small>Kemasan · pcs</small><b>${esc(row.name)}</b></div><em>${esc(qty(row.totalQty,'pcs'))}</em></header><div class="sj-v34-cup-stock"><span><small>Gerai</small><strong>${esc(qty(row.outletQty,'pcs'))}</strong></span><span><small>Gudang</small><strong>${esc(qty(row.warehouseQty,'pcs'))}</strong></span><span><small>WAC</small><strong>${esc(wac)}</strong></span></div><div class="sj-v34-cup-actions"><button type="button" data-v32-inventory-action="purchase" data-v32-ingredient-id="${esc(row.ingredientId)}">Beli</button><button type="button" data-v32-inventory-action="transfer" data-v32-ingredient-id="${esc(row.ingredientId)}">Transfer</button><button type="button" data-v32-inventory-action="opname" data-v32-ingredient-id="${esc(row.ingredientId)}">Opname</button></div></article>`;
  }).join('');
  const simulated=rows.some(x=>x?.simulated);
  const setup=simulated?'<button type="button" data-v34-cup-setup>Ubah Simulasi Cup · LOCAL ONLY</button>':missing.length?`<button type="button" data-v34-cup-setup>${readOnly?'Simulasikan Master Cup · LOCAL ONLY':'Siapkan Master Cup'}</button>`:'<span class="sj-v32-inv-ok">5 master cup siap</span>';
  return `<section class="sj-v32-inv-section sj-v34-cup-section" data-v34-cup-inventory><div class="sj-v32-inv-section-head"><div><h3>Kemasan &amp; Cup</h3><small>Stok fisik pcs · authority Inventory V2</small></div>${setup}</div><div class="sj-v34-cup-grid">${cards}</div></section>`;
}

export function renderCupInitialSetupPreviewV34(values={}){
  let pcs=0,value=0;for(const spec of CUP_CATALOG_V34){const row=values?.[spec.code]||{},warehouse=Math.max(0,num(row.warehouseQty)),outlet=Math.max(0,num(row.outletQty)),wac=Math.max(0,num(row.wac));pcs+=warehouse+outlet;value+=(warehouse+outlet)*wac}
  return `<aside class="sj-v34-cup-setup-preview" data-v34-cup-setup-preview><span><small>Total cup awal</small><b>${esc(qty(pcs,'pcs'))}</b></span><span><small>Nilai persediaan awal</small><b>${esc(money(value))}</b></span><em>Preview · belum disimpan</em></aside>`;
}

export function renderCupInitialSetupV34(cupRows=[],{readOnly=false,values={}}={}){
  const byCode=Object.fromEntries((cupRows||[]).map(x=>[x?.code,x]));
  const fields=CUP_CATALOG_V34.map(spec=>{const row=byCode[spec.code]||{},v=values?.[spec.code]||{},locked=row.registered&&!row.simulated;return `<article class="sj-v34-cup-setup-row" data-v34-cup-setup-row="${esc(spec.code)}"><header><div><b>${esc(spec.name)}</b><small>${locked?'Master sudah ada':'Master baru · pcs'}</small></div>${locked?'<em>EXISTING</em>':''}</header><div class="sj-v34-cup-setup-grid"><label>Gudang awal<input type="number" min="0" step="1" inputmode="numeric" data-v34-cup-setup-field="${esc(spec.code)}:warehouseQty" value="${esc(v.warehouseQty??row.warehouseQty??0)}"${locked?' disabled':''}></label><label>Gerai awal<input type="number" min="0" step="1" inputmode="numeric" data-v34-cup-setup-field="${esc(spec.code)}:outletQty" value="${esc(v.outletQty??row.outletQty??0)}"${locked?' disabled':''}></label><label>WAC awal / pcs<input type="number" min="0" step="0.01" inputmode="decimal" data-v34-cup-setup-field="${esc(spec.code)}:wac" value="${esc(v.wac??row.wac??0)}"${locked?' disabled':''}></label></div></article>`}).join('');
  const local=readOnly?'<aside class="sj-v34-cup-setup-note"><b>Simulasi Master Cup Lokal</b><span>Angka hanya hidup di memori halaman ini, tidak menulis production dan hilang saat halaman direfresh.</span></aside>':'<aside class="sj-v34-cup-setup-note"><b>Initial Cup Setup</b><span>Master memakai Inventory V2 existing; WAC memakai Harga Modal Awal; saldo Gudang/Gerai memakai Opname. Tidak dibuat sebagai transaksi Pembelian.</span></aside>';
  return `<section class="sj-v32-process sj-v34-cup-setup" data-v34-cup-setup-panel><button type="button" class="sj-v32-inv-back" data-v34-cup-setup-back>‹ Kembali</button><header><div><small>Kemasan &amp; Cup · setup awal</small><h3>${readOnly?'Simulasi Master Cup Lokal':'Siapkan Master Cup'}</h3><p>Isi stok fisik awal dan harga modal per pcs untuk lima jenis cup.</p></div>${readOnly?'<em>LOCAL QA</em>':''}</header>${local}${renderCupInitialSetupPreviewV34(values)}<div class="sj-v34-cup-setup-list">${fields}</div><div class="sj-v32-process-actions"><button type="button" data-v34-cup-setup-apply>${readOnly?'Gunakan Simulasi Lokal':'Simpan Master & Saldo Awal'}</button><button type="button" data-v34-cup-setup-cancel>Batal</button></div></section>`;
}

function activityKindClass(kind=''){return String(kind||'').toLowerCase().replace(/[^a-z0-9_-]+/g,'-')}
function activityMeta(a){
  if(a.kind==='TRANSFER')return `${qty(a.qty,'')} · ${a.direction}`;
  if(a.kind==='PURCHASE')return `+${qty(a.qty,'')} · ${a.direction}`;
  if(a.kind==='OPNAME'&&a.beforeQty!==null&&a.afterQty!==null)return `${qty(a.beforeQty,'')} → ${qty(a.afterQty,'')} · ${a.direction}`;
  const signed=a.delta>0?`+${qty(a.delta,'')}`:qty(a.delta,'');return `${signed} · ${a.direction||'Persediaan'}`;
}
function activityRows(activities=[]){
  if(!activities.length)return '<div class="sj-v32-inv-empty">Belum ada aktivitas stok.</div>';
  let day='';return activities.map(a=>{
    const label=a.ts?new Intl.DateTimeFormat('id-ID',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(a.ts)):'Tanpa tanggal';
    const heading=label!==day?(day=label,`<h4 class="sj-v32-inv-day">${esc(label)}</h4>`):'';
    return `${heading}<button type="button" class="sj-v32-inv-activity ${activityKindClass(a.kind)}" data-v32-inventory-activity-item="${esc(a.itemId)}" data-v32-inventory-item-type="${esc(a.itemType)}"><span class="sj-v32-inv-activity-icon">${renderIcon(a.kind==='TRANSFER'?'transfer':a.kind==='PURCHASE'?'add':a.kind==='OPNAME'?'inventory':'activity',{size:19})}</span><span class="sj-v32-inv-activity-main"><b>${esc(a.itemName||'Item')}</b><small>${esc(a.title||'Aktivitas')} · ${esc(activityMeta(a))}</small>${a.note?`<small>${esc(a.note)}</small>`:''}</span><span class="sj-v32-inv-activity-type">${a.itemType==='ingredient'?'Bahan Baku':'Barang Jadi'}</span><span class="sj-v32-inv-chevron">›</span></button>`;
  }).join('');
}
function activityHTML(activities=[]){
  return `<section class="sj-v32-inv-actions"><button type="button" data-v32-inventory-choose="purchase"><span>${renderIcon('add',{size:22})}</span><b>Catat Pembelian</b><small>Pilih item lalu catat barang masuk Gudang.</small></button><button type="button" data-v32-inventory-choose="transfer"><span>${renderIcon('transfer',{size:22})}</span><b>Pindahkan Stok</b><small>Pindahkan persediaan dari Gudang ke Gerai.</small></button><button type="button" data-v32-inventory-choose="opname"><span>${renderIcon('inventory',{size:22})}</span><b>Cek Stok Fisik</b><small>Bandingkan jumlah sistem dengan stok fisik.</small></button></section><section class="sj-v32-inv-section"><div class="sj-v32-inv-section-head"><h3>Aktivitas Terakhir</h3><button type="button" data-v32-inventory-action="movements">Lihat semua</button></div><div class="sj-v32-inv-movements">${activityRows(activities)}</div></section>`;
}
function moreHTML(){
  return `<section class="sj-v32-inv-more"><button type="button" data-v32-inventory-action="recipes"><span>${renderIcon('product',{size:21})}</span><b>Resep Produk &amp; Ukuran (Advanced)</b><small>Editor advanced; penjualan barang jadi normal tetap tidak diintersep recipe.</small></button><button type="button" data-v32-inventory-action="movements"><span>${renderIcon('history',{size:21})}</span><b>Riwayat Stok</b><small>Baca timeline aktivitas dalam bahasa operasional, bukan kode movement mentah.</small></button><button type="button" data-v32-inventory-choose="purchase"><span>${renderIcon('customers',{size:21})}</span><b>Supplier &amp; Pembelian</b><small>Pilih item lebih dulu, lalu catat pembelian melalui writer existing.</small></button><button type="button" data-v32-inventory-action="cost"><span>${renderIcon('cash',{size:21})}</span><b>HPP &amp; Costing</b><small>HPP unknown tetap Belum tersedia, bukan Rp0.</small></button><button type="button" data-v32-inventory-manage="ingredients"><span>${renderIcon('settings',{size:21})}</span><b>Pengaturan Inventori / Bahan Baku</b><small>Tambah bahan atau klik bahan untuk mengatur batas kritis dan target.</small></button></section>`;
}
function ruleValue(value,unit){return num(value)>0?qty(value,unit):'Belum diatur'}
function itemActivities(activities=[],id=''){return activities.filter(x=>String(x.itemId)===String(id)).slice(0,6)}

export function renderInventoryItemDetailV32({row,activities=[]}={}){
  if(!row)return '<div class="sj-v32-inv-empty">Detail bahan tidak ditemukan.</div>';
  const m=row.master||{},recent=itemActivities(activities,row.id);
  return `<section class="sj-v32-inv-detail" data-v32-inventory-detail="${esc(row.id)}"><button type="button" class="sj-v32-inv-back" data-v32-inventory-detail-back>‹ Kembali ke Bahan &amp; Gudang</button><header class="sj-v32-inv-detail-hero"><div><small>Bahan Baku · ${esc(row.unit)}</small><h3>${esc(row.name)}</h3><p>${esc(row.actionDetail||'')}</p></div><em class="${statusClass(row.action)}">${esc(row.actionLabel)}</em></header><section class="sj-v32-inv-detail-stock"><article><small>Gerai</small><strong>${esc(qty(row.outletQty,row.unit))}</strong></article><article><small>Gudang</small><strong>${esc(qty(row.warehouseQty,row.unit))}</strong></article><article><small>Total</small><strong>${esc(qty(row.totalQty,row.unit))}</strong></article></section><section class="sj-v32-inv-detail-section"><div class="sj-v32-inv-section-head"><h3>Proses Item</h3><span>Act</span></div><div class="sj-v32-inv-detail-actions"><button type="button" data-v32-inventory-action="transfer" data-v32-ingredient-id="${esc(row.id)}">${renderIcon('transfer',{size:19})}<span><b>Pindahkan Stok</b><small>Gudang → Gerai</small></span></button><button type="button" data-v32-inventory-action="purchase" data-v32-ingredient-id="${esc(row.id)}">${renderIcon('add',{size:19})}<span><b>Catat Pembelian</b><small>Tambah stok Gudang</small></span></button><button type="button" data-v32-inventory-action="opname" data-v32-ingredient-id="${esc(row.id)}">${renderIcon('inventory',{size:19})}<span><b>Cek Stok Fisik</b><small>Rekonsiliasi stok</small></span></button><button type="button" data-v32-inventory-action="edit-rules" data-v32-ingredient-id="${esc(row.id)}">${renderIcon('settings',{size:19})}<span><b>Edit Aturan</b><small>Kritis, waspada &amp; target</small></span></button></div></section><section class="sj-v32-inv-detail-section"><div class="sj-v32-inv-section-head"><h3>Aturan Stok</h3><span>Understand</span></div><div class="sj-v32-inv-rules"><article><small>Batas Kritis Gerai</small><strong>${esc(ruleValue(m.criticalOutlet,row.unit))}</strong></article><article><small>Batas Waspada Gerai</small><strong>${esc(ruleValue(m.warningOutlet??m.minOutlet,row.unit))}</strong></article><article><small>Target Gerai</small><strong>${esc(ruleValue(m.targetOutlet,row.unit))}</strong></article><article><small>Minimum Gudang</small><strong>${esc(ruleValue(m.minWarehouse,row.unit))}</strong></article><article><small>Target Gudang</small><strong>${esc(ruleValue(m.targetWarehouse,row.unit))}</strong></article></div>${[m.criticalOutlet,m.warningOutlet??m.minOutlet,m.targetOutlet,m.minWarehouse,m.targetWarehouse].every(x=>num(x)===0)?'<aside class="sj-v32-inv-rule-warning">Aturan stok belum dikonfigurasi. Status otomatis tidak akan optimal sampai batas dan target ditentukan.</aside>':''}</section><section class="sj-v32-inv-detail-section"><div class="sj-v32-inv-section-head"><h3>Aktivitas Item</h3><span>${recent.length} terbaru</span></div><div class="sj-v32-inv-movements">${activityRows(recent)}</div></section></section>`;
}

function itemTypeLabel(type){return type==='ingredient'?'Bahan Baku':'Barang Jadi'}
function normalizedProductRow(row={}){return {...row,itemType:'product',unit:'pcs',totalQty:num(row.totalQty??(num(row.outletQty)+num(row.warehouseQty)))} }
function pickerRows({ingredientRows=[],productRows=[],query='',typeFilter='ALL'}={}){
  const q=String(query||'').trim().toLowerCase();
  const a=ingredientRows.map(row=>({type:'ingredient',id:row.id,name:row.name,sub:row.category||row.unit,row}));
  const b=productRows.map(raw=>{const row=normalizedProductRow(raw);return{type:'product',id:row.id,name:row.name,sub:row.sku||'Barang Jadi',row}});
  return a.concat(b).filter(x=>(typeFilter==='ALL'||x.type===typeFilter)&&(!q||`${x.name} ${x.id} ${x.sub}`.toLowerCase().includes(q)));
}

export function renderInventoryActionPickerV32({action='transfer',ingredientRows=[],productRows=[],query='',typeFilter='ALL'}={}){
  const title=actionTitle[action]||'Pilih Item',items=pickerRows({ingredientRows,productRows,query,typeFilter});
  return `<section class="sj-v32-action-picker" data-v32-action-picker="${esc(action)}"><button type="button" class="sj-v32-inv-back" data-v32-action-back>‹ Kembali</button><header><small>Observe → Understand → Act</small><h3>${esc(title)}</h3><p>Pilih item terlebih dahulu. Bahan Baku dan Barang Jadi dipisahkan agar tidak salah proses.</p></header><label class="sj-v32-inv-search"><span>${renderIcon('search',{size:18})}</span><input type="search" data-v32-action-search value="${esc(query)}" placeholder="Cari nama item / SKU..." aria-label="Cari item"></label><div class="sj-v32-action-type-filter">${[['ALL','Semua'],['ingredient','Bahan Baku'],['product','Barang Jadi']].map(([id,label])=>`<button type="button" data-v32-action-type="${id}" class="${typeFilter===id?'active':''}">${label}</button>`).join('')}</div><div class="sj-v32-action-picker-list" data-v32-action-picker-list>${items.length?items.map(x=>`<button type="button" data-v32-action-pick="${esc(x.type)}:${esc(x.id)}"><span><b>${esc(x.name)}</b><small>${esc(itemTypeLabel(x.type))}${x.sub?` · ${esc(x.sub)}`:''}</small></span><span><small>Gudang</small><strong>${esc(qty(x.row.warehouseQty,x.row.unit||'pcs'))}</strong></span><span><small>Gerai</small><strong>${esc(qty(x.row.outletQty,x.row.unit||'pcs'))}</strong></span><em>›</em></button>`).join(''):'<div class="sj-v32-inv-empty">Item tidak ditemukan.</div>'}</div></section>`;
}

function processContext(row,itemType){const unit=itemType==='ingredient'?row?.unit||'unit':'pcs';return{unit,warehouse:num(row?.warehouseQty),outlet:num(row?.outletQty),total:num(row?.totalQty??(num(row?.warehouseQty)+num(row?.outletQty)))}}
export function renderInventoryProcessV32({action='transfer',itemType='ingredient',row,location='warehouse'}={}){
  if(!row)return '<div class="sj-v32-inv-empty">Item tidak ditemukan.</div>';
  const title=actionTitle[action]||'Proses Stok',c=processContext(row,itemType),typeLabel=itemTypeLabel(itemType);
  let fields='';
  if(action==='transfer')fields=`<label>Jumlah dipindahkan<input type="number" min="0" step="0.01" inputmode="decimal" data-v32-process-field="qty" placeholder="0 ${esc(c.unit)}"></label><aside class="sj-v32-process-preview"><b>Gudang → Gerai</b><span>Gudang ${esc(qty(c.warehouse,c.unit))} · Gerai ${esc(qty(c.outlet,c.unit))}</span></aside>`;
  else if(action==='purchase')fields=`<div class="sj-v32-process-grid"><label>Jumlah diterima<input type="number" min="0" step="0.01" inputmode="decimal" data-v32-process-field="qty" placeholder="0 ${esc(c.unit)}"></label><label>Harga barang<input type="number" min="0" step="1" inputmode="numeric" data-v32-process-field="goodsCost" placeholder="0"></label><label>Biaya pembelian / Ongkir<input type="number" min="0" step="1" inputmode="numeric" data-v32-process-field="fees" value="0"></label><label>Diskon supplier<input type="number" min="0" step="1" inputmode="numeric" data-v32-process-field="discount" value="0"></label></div><label>Supplier<input type="text" data-v32-process-field="supplier" placeholder="Nama supplier (opsional)"></label><label>Dibayar dari<select data-v32-process-field="fundSource"><option value="CASH">Kas Laci</option><option value="OWNER">Rekening / Dana Owner</option><option value="OTHER">Sumber lain</option></select></label><label>Catatan<input type="text" data-v32-process-field="note" placeholder="Nota / catatan (opsional)"></label><aside class="sj-v32-process-preview"><b>Pembelian → Gudang</b><span>Stok Gudang sekarang ${esc(qty(c.warehouse,c.unit))}. HPP/WAC tetap dihitung oleh writer existing.</span></aside>`;
  else fields=`<label>Lokasi<select data-v32-process-field="location"><option value="warehouse" ${location==='warehouse'?'selected':''}>Gudang</option><option value="outlet" ${location==='outlet'?'selected':''}>Gerai</option></select></label><label>Jumlah fisik aktual<input type="number" min="0" step="0.01" inputmode="decimal" data-v32-process-field="actual" placeholder="0 ${esc(c.unit)}"></label><label>Alasan / catatan<input type="text" data-v32-process-field="note" placeholder="Contoh: selisih hitung / rusak"></label><aside class="sj-v32-process-preview"><b>Cek Stok Fisik</b><span>Gudang ${esc(qty(c.warehouse,c.unit))} · Gerai ${esc(qty(c.outlet,c.unit))}</span></aside>`;
  return `<section class="sj-v32-process" data-v32-process="${esc(action)}" data-v32-process-type="${esc(itemType)}" data-v32-process-item="${esc(row.id)}"><button type="button" class="sj-v32-inv-back" data-v32-process-back>‹ Kembali ke detail</button><header><div><small>${esc(typeLabel)} · ${esc(c.unit)}</small><h3>${esc(row.name)}</h3><p>${esc(title)} dari satu konteks item.</p></div><span>${esc(qty(c.total,c.unit))} total</span></header><div class="sj-v32-process-fields">${fields}</div><div class="sj-v32-process-actions"><button type="button" data-v32-process-submit>${esc(title)}</button><button type="button" data-v32-process-cancel>Batal</button></div><p class="sj-v32-process-note">Penyimpanan tetap menggunakan Inventory V2 writer yang sudah menjadi authority produksi.</p></section>`;
}

export function renderIngredientEditorV32({row=null}={}){
  const m=row?.master||{},unit=row?.unit||m.unit||'g',isNew=!row;
  return `<section class="sj-v32-process sj-v32-rule-editor" data-v32-ingredient-editor="${isNew?'new':esc(row.id)}"><button type="button" class="sj-v32-inv-back" data-v32-editor-back>‹ Kembali</button><header><div><small>Bahan Baku</small><h3>${isNew?'Tambah Bahan Baku':`Atur ${esc(row.name)}`}</h3><p>Identitas dan aturan stok dipisahkan agar rekomendasi Aman / Transfer / Beli mudah dipahami.</p></div></header><div class="sj-v32-process-fields"><section class="sj-v32-rule-group"><h4>Identitas</h4><label>Nama bahan<input data-v32-editor-field="name" value="${esc(m.name||row?.name||'')}"></label><label>Satuan dasar<select data-v32-editor-field="unit">${['g','ml','pcs','unit'].map(x=>`<option value="${x}" ${unit===x?'selected':''}>${x}</option>`).join('')}</select></label><label>Kategori<input data-v32-editor-field="category" value="${esc(m.category||row?.category||'BAHAN')}"></label></section><section class="sj-v32-rule-group"><h4>Aturan Gerai</h4><label>Batas kritis<input type="number" min="0" step="0.01" data-v32-editor-field="criticalOutlet" value="${num(m.criticalOutlet)}"></label><label>Batas waspada<input type="number" min="0" step="0.01" data-v32-editor-field="warningOutlet" value="${num(m.warningOutlet??m.minOutlet)}"></label><label>Target normal<input type="number" min="0" step="0.01" data-v32-editor-field="targetOutlet" value="${num(m.targetOutlet)}"></label></section><section class="sj-v32-rule-group"><h4>Aturan Gudang</h4><label>Minimum aman<input type="number" min="0" step="0.01" data-v32-editor-field="minWarehouse" value="${num(m.minWarehouse)}"></label><label>Target normal<input type="number" min="0" step="0.01" data-v32-editor-field="targetWarehouse" value="${num(m.targetWarehouse)}"></label></section><label>Tampil prioritas dashboard<select data-v32-editor-field="dashboardPinned"><option value="0" ${m.dashboardPinned?'':'selected'}>Otomatis</option><option value="1" ${m.dashboardPinned?'selected':''}>Prioritaskan</option></select></label></div><div class="sj-v32-process-actions"><button type="button" data-v32-editor-save>${isNew?'Tambah Bahan':'Simpan Aturan'}</button>${isNew?'':`<button type="button" class="danger" data-v32-editor-archive data-v32-ingredient-id="${esc(row.id)}">Arsipkan Bahan</button>`}</div></section>`;
}

function ingredientManagerHTML(rows=[]){return `<section class="sj-v32-inv-manager"><button type="button" class="sj-v32-inv-back" data-v32-manager-back>‹ Kembali ke Lainnya</button><div class="sj-v32-inv-section-head"><h3>Pengaturan Inventori / Bahan Baku</h3><button type="button" data-v32-manager-add>+ Tambah Bahan</button></div><p class="sj-v32-manager-copy">Klik bahan untuk membuka detail lalu atur batas kritis, waspada, target Gerai, dan target Gudang.</p><div class="sj-v32-inv-stock-list">${rows.length?rows.map(x=>stockRow(x)).join(''):'<div class="sj-v32-inv-empty">Belum ada bahan baku.</div>'}</div></section>`}

export function renderInventoryWorkspaceV32({tab='summary',rows=[],cupRows=[],readOnly=false,recentMovements=[],recentActivities=[],query='',filter='ALL',intent='',selectedItemId='',mode='',productRows=[],process=null,manager=false,editorRow=undefined,actionQuery='',actionType='ALL',cupSetupValues={}}={}){
  const activities=recentActivities.length?recentActivities:recentMovements,cupIds=new Set((cupRows||[]).filter(x=>x?.registered&&x.ingredientId).map(x=>String(x.ingredientId))),baseRows=(rows||[]).filter(x=>!cupIds.has(String(x.id)));
  if(mode==='cup-setup')return `<div class="sj-v32-inv-shell" data-v32-inventory-shell data-active-tab="cup-setup"><div class="sj-v32-inv-body">${renderCupInitialSetupV34(cupRows,{readOnly,values:cupSetupValues})}</div></div>`;
  if(mode==='action-picker')return `<div class="sj-v32-inv-shell" data-v32-inventory-shell data-active-tab="action-picker"><div class="sj-v32-inv-body">${renderInventoryActionPickerV32({action:process?.action,ingredientRows:rows,productRows,query:actionQuery,typeFilter:actionType})}</div></div>`;
  if(mode==='process')return `<div class="sj-v32-inv-shell" data-v32-inventory-shell data-active-tab="process"><div class="sj-v32-inv-body">${renderInventoryProcessV32({action:process?.action,itemType:process?.itemType,row:process?.row,location:process?.location})}</div></div>`;
  if(mode==='manager')return `<div class="sj-v32-inv-shell" data-v32-inventory-shell data-active-tab="manager"><div class="sj-v32-inv-body">${ingredientManagerHTML(rows)}</div></div>`;
  if(mode==='editor')return `<div class="sj-v32-inv-shell" data-v32-inventory-shell data-active-tab="editor"><div class="sj-v32-inv-body">${renderIngredientEditorV32({row:editorRow})}</div></div>`;
  const active=['summary','stock','activity','more'].includes(tab)?tab:'summary';
  if(selectedItemId){const row=rows.find(x=>String(x.id)===String(selectedItemId));return `<div class="sj-v32-inv-shell" data-v32-inventory-shell data-active-tab="detail"><div class="sj-v32-inv-body">${renderInventoryItemDetailV32({row,activities})}</div></div>`}
  const cupSection=(active==='summary'||active==='stock')?renderCupInventorySectionV34(cupRows,{readOnly}):'';
  const body=cupSection+(active==='stock'?stockHTML(baseRows,query,filter,intent):active==='activity'?activityHTML(activities):active==='more'?moreHTML():summaryHTML(baseRows));
  return `<div class="sj-v32-inv-shell" data-v32-inventory-shell data-active-tab="${active}">${nav(active)}<div class="sj-v32-inv-body">${body}</div></div>`;
}

function roleOf(runtime){try{return runtime?.__SJ_SC03_RUNTIME?.guard?.currentRole?.()||runtime?.currentUserRole||null}catch(_){return null}}
function changeEvent(runtime){try{return new (runtime?.Event||Event)('change',{bubbles:true})}catch(_){return{type:'change'}}}
function inputEvent(runtime){try{return new (runtime?.Event||Event)('input',{bubbles:true})}catch(_){return{type:'input'}}}
function wait(runtime,ms=30){return new Promise(resolve=>(typeof runtime?.setTimeout==='function'?runtime.setTimeout:setTimeout)(resolve,ms))}

export function assertActivePurchaseShiftV32(runtime=globalThis){
  const shift=runtime?.SJShift;if(!shift||typeof shift.currentData!=='function'||typeof shift.state!=='function')throw Object.assign(new Error('PURCHASE_SHIFT_AUTHORITY_UNAVAILABLE: Status shift belum dapat diverifikasi.'),{code:'PURCHASE_SHIFT_AUTHORITY_UNAVAILABLE'});
  const data=shift.currentData()||{},state=String(shift.state(data)||'NOT_STARTED').toUpperCase(),sessionId=String(shift.currentSessionId?.()||data?.sessionControl?.currentSessionId||data?.currentSessionId||'').trim();
  if(state!=='ACTIVE'||!sessionId)throw Object.assign(new Error('PURCHASE_SHIFT_REQUIRED: Shift harus berstatus AKTIF sebelum mencatat pembelian.'),{code:'PURCHASE_SHIFT_REQUIRED'});
  return Object.freeze({state,sessionId,data});
}

export function installInventoryWorkspaceV32(runtime=globalThis){
  if(runtime?.__SJ_V32_INVENTORY_WORKSPACE)return runtime.__SJ_V32_INVENTORY_WORKSPACE;
  const document=runtime?.document,inventory=runtime?.SJInventoryV2;
  if(!document||!inventory||typeof inventory.open!=='function')return Object.freeze({installed:false});
  const legacyOpen=inventory.open.bind(inventory),repository=createInventoryRepository({db:runtime?.firebase?.database?.()}),core=runtime?.SJInventoryCore||null,localSimulation=ensureCupLocalSimulationStoreV34(runtime);
  let rows=[],cupRows=[],productRows=[],activities=[],state={tab:'summary',query:'',filter:'ALL',intent:'',detailId:'',mode:'',process:null,manager:false,editorId:'',actionQuery:'',actionType:'ALL'};

  function ensureHost(){
    let host=document.getElementById?.('sj-v32-inventory-workspace');if(host)return host;
    host=document.createElement?.('div');if(!host)return null;host.id='sj-v32-inventory-workspace';host.className='sj-v32-inv-overlay';host.innerHTML='<div class="sj-v32-inv-card"><header><div><h2>Bahan & Gudang</h2><p>Observe → Understand → Act</p></div><button type="button" data-v32-inventory-close aria-label="Tutup">×</button></header><div data-v32-inventory-content></div></div>';
    host.querySelector?.('[data-v32-inventory-close]')?.addEventListener?.('click',()=>{host.style.display='none'});
    host.addEventListener?.('click',event=>handleClick(event,host));
    host.addEventListener?.('input',event=>{
      const input=event.target?.closest?.('[data-v32-inventory-search]');if(input){state.query=input.value||'';updateStockList(host);return}
      const actionSearch=event.target?.closest?.('[data-v32-action-search]');if(actionSearch){state.actionQuery=actionSearch.value||'';updateActionPickerList(host)}
    });
    host.addEventListener?.('input',event=>{const setupField=event.target?.closest?.('[data-v34-cup-setup-field]');if(!setupField)return;const preview=host.querySelector?.('[data-v34-cup-setup-preview]');if(preview)preview.outerHTML=renderCupInitialSetupPreviewV34(cupSetupValues(host))});
    document.body?.appendChild?.(host);return host;
  }
  function render(host=ensureHost()){
    const content=host?.querySelector?.('[data-v32-inventory-content]');if(!content)return;
    const editorRow=state.editorId&&state.editorId!=='__new__'?contextRow(state.editorId):state.editorId==='__new__'?null:undefined;
    content.innerHTML=renderInventoryWorkspaceV32({tab:state.tab,rows,cupRows,readOnly:runtime?.__SJ_LOCAL_QA_READ_ONLY===true,productRows,recentActivities:activities,query:state.query,filter:state.filter,intent:state.intent,selectedItemId:state.detailId,mode:state.mode,process:state.process,manager:state.manager,editorRow,actionQuery:state.actionQuery,actionType:state.actionType,cupSetupValues:localSimulation.masterConfig||{}});
  }
  function updateStockList(host=ensureHost()){
    const list=host?.querySelector?.('[data-v32-inventory-stock-list]');if(list)list.innerHTML=stockRowsHTML(rows,state.query,state.filter,state.intent);
  }
  function updateActionPickerList(host=ensureHost()){
    const list=host?.querySelector?.('[data-v32-action-picker-list]');if(!list)return;
    const items=pickerRows({ingredientRows:rows,productRows,query:state.actionQuery,typeFilter:state.actionType});
    list.innerHTML=items.length?items.map(x=>`<button type="button" data-v32-action-pick="${esc(x.type)}:${esc(x.id)}"><span><b>${esc(x.name)}</b><small>${esc(itemTypeLabel(x.type))}${x.sub?` · ${esc(x.sub)}`:''}</small></span><span><small>Gudang</small><strong>${esc(qty(x.row.warehouseQty,x.row.unit||'pcs'))}</strong></span><span><small>Gerai</small><strong>${esc(qty(x.row.outletQty,x.row.unit||'pcs'))}</strong></span><em>›</em></button>`).join(''):'<div class="sj-v32-inv-empty">Item tidak ditemukan.</div>';
  }
  function contextRow(id){return rows.find(x=>String(x.id)===String(id))||null}
  function productRow(id){return productRows.find(x=>String(x.id)===String(id))||null}
  function itemRow(type,id){return type==='product'?productRow(id):contextRow(id)}
  function legacyKey(type,id,forCost=false){return forCost?`${type==='ingredient'?'ingredient':'product'}:${id}`:`${type==='ingredient'?'I':'P'}:${id}`}
  function legacyModal(){return document.getElementById?.('modal-sjinv')||null}
  function hideLegacyWriterHost(){const modal=legacyModal();if(!modal)return;modal.dataset.sjV32WriterHost='true';modal.style.display='none';modal.setAttribute?.('aria-hidden','true')}
  function releaseLegacyWriterHost(){const modal=legacyModal();if(!modal)return;delete modal.dataset.sjV32WriterHost;modal.removeAttribute?.('aria-hidden')}
  function setValue(id,value,{event='change'}={}){const el=document.getElementById?.(id);if(!el)return false;el.value=value;el.dispatchEvent?.(event==='input'?inputEvent(runtime):changeEvent(runtime));return true}

  async function invokeLegacyWriter(action,itemType,id,values={}){
    if(action==='purchase')assertActivePurchaseShiftV32(runtime);
    const tab=action==='purchase'?'purchase':action==='transfer'?'transfer':'opname';
    legacyOpen(tab);hideLegacyWriterHost();
    await wait(runtime,action==='purchase'?70:25);hideLegacyWriterHost();
    const key=legacyKey(itemType,id,false),costKey=legacyKey(itemType,id,true);
    let button=null;
    if(action==='transfer'){
      setValue('sjinv-transfer-item',key);setValue('sjinv-transfer-qty',values.qty,{event:'input'});button=document.getElementById?.('sjinv-transfer-go');
    }else if(action==='opname'){
      setValue('sjinv-opname-item',key);setValue('sjinv-opname-loc',values.location||'warehouse');setValue('sjinv-opname-qty',values.actual,{event:'input'});setValue('sjinv-opname-note',values.note||'',{event:'input'});button=document.getElementById?.('sjinv-opname-go');
    }else{
      const costing=document.getElementById?.('sjcost-purchase-item');
      if(costing){setValue('sjcost-purchase-item',costKey);setValue('sjcost-purchase-qty',values.qty,{event:'input'});setValue('sjcost-goods-cost',values.goodsCost,{event:'input'});setValue('sjcost-purchase-fees',values.fees,{event:'input'});setValue('sjcost-supplier-discount',values.discount,{event:'input'});setValue('sjcost-supplier',values.supplier||'',{event:'input'});setValue('sjcost-fund-source',values.fundSource||'CASH');setValue('sjcost-purchase-note',values.note||'',{event:'input'});await wait(runtime,30);button=document.getElementById?.('sjcost-purchase-save')}
      else{setValue('sjinv-purchase-item',key);setValue('sjinv-purchase-qty',values.qty,{event:'input'});setValue('sjinv-purchase-note',values.note||'',{event:'input'});button=document.getElementById?.('sjinv-purchase-go')}
    }
    if(!button)throw new Error('INVENTORY_V2_WRITER_SURFACE_NOT_FOUND');
    const handler=button.onclick;if(typeof handler==='function')await Promise.resolve(handler.call(button,{type:'click',target:button,currentTarget:button,preventDefault(){}}));else button.click?.();
    hideLegacyWriterHost();await wait(runtime,120);releaseLegacyWriterHost();
    return true;
  }

  async function invokeLegacyIngredientArchive(row){
    if(!row?.id)throw new Error('INVENTORY_V2_INGREDIENT_ID_REQUIRED');
    legacyOpen('ingredients');hideLegacyWriterHost();await wait(runtime,25);hideLegacyWriterHost();
    const safe=String(row.id).replace(/"/g,'\\"');
    const button=document.querySelector?.(`[data-retire-ing="${safe}"]`);
    if(!button){releaseLegacyWriterHost();throw new Error('INVENTORY_V2_INGREDIENT_ARCHIVE_NOT_FOUND')}
    const handler=button.onclick;
    if(typeof handler==='function')await Promise.resolve(handler.call(button,{type:'click',target:button,currentTarget:button,preventDefault(){}}));else button.click?.();
    hideLegacyWriterHost();await wait(runtime,160);releaseLegacyWriterHost();return true;
  }

  async function invokeLegacyIngredientSave(row,values={}){
    legacyOpen('ingredients');hideLegacyWriterHost();await wait(runtime,25);hideLegacyWriterHost();
    if(row){const safe=String(row.id||'').replace(/"/g,'\\"');document.querySelector?.(`[data-edit-ing="${safe}"]`)?.click?.();await wait(runtime,10);hideLegacyWriterHost()}
    setValue('sjinv-ing-name',String(values.name||'').trim().toUpperCase(),{event:'input'});setValue('sjinv-ing-unit',values.unit||'g');setValue('sjinv-ing-cat',String(values.category||'BAHAN').trim().toUpperCase(),{event:'input'});setValue('sjinv-ing-critical',values.criticalOutlet,{event:'input'});setValue('sjinv-ing-warning',values.warningOutlet,{event:'input'});setValue('sjinv-ing-targetout',values.targetOutlet,{event:'input'});setValue('sjinv-ing-minwh',values.minWarehouse,{event:'input'});setValue('sjinv-ing-targetwh',values.targetWarehouse,{event:'input'});setValue('sjinv-ing-pin',values.dashboardPinned?'1':'0');
    const button=document.getElementById?.('sjinv-save-ing');if(!button)throw new Error('INVENTORY_V2_INGREDIENT_WRITER_NOT_FOUND');
    const handler=button.onclick;if(typeof handler==='function')await Promise.resolve(handler.call(button,{type:'click',target:button,currentTarget:button,preventDefault(){}}));else button.click?.();hideLegacyWriterHost();await wait(runtime,120);releaseLegacyWriterHost();return true;
  }

  async function ensureCupMasters(){
    if(runtime?.__SJ_LOCAL_QA_READ_ONLY===true)throw new Error('LOCAL_QA_READ_ONLY');
    const missing=(cupRows||[]).filter(x=>!x?.registered);
    for(const row of missing){
      const spec=CUP_CATALOG_V34.find(x=>x.code===row.code);if(!spec)continue;
      await invokeLegacyIngredientSave(null,{name:spec.name,unit:'pcs',category:'KEMASAN CUP',criticalOutlet:0,warningOutlet:0,targetOutlet:0,minWarehouse:0,targetWarehouse:0,dashboardPinned:false});
    }
    return true;
  }

  function containAdvancedLegacy(tab){
    const host=ensureHost();if(host)host.style.display='none';legacyOpen(tab);
    const apply=()=>{const modal=legacyModal(),card=modal?.querySelector?.('.modal'),body=document.getElementById?.('sjinv-body');if(!modal||!card||!body)return;delete modal.dataset.sjV32WriterHost;modal.dataset.sjV32Contained='true';modal.style.display='flex';modal.querySelector?.('.sjinv-head')?.setAttribute?.('hidden','');modal.querySelector?.('.sjinv-tabs')?.setAttribute?.('hidden','');if(!card.querySelector?.('[data-v32-contained-head]'))card.insertAdjacentHTML?.('afterbegin',`<div class="sj-v32-contained-head" data-v32-contained-head><div><small>Lainnya · Advanced</small><h2>${tab==='recipes'?'Resep Produk & Ukuran':'Inventori Advanced'}</h2><p>Writer tetap Inventory V2; presentation dibatasi dalam shell v3.</p></div><button type="button" data-v32-contained-close>×</button></div>`);card.querySelector?.('[data-v32-contained-close]')?.addEventListener?.('click',()=>{modal.style.display='none';modal.removeAttribute?.('data-sj-v32-contained');const h=ensureHost();if(h){h.style.display='flex';state={...state,tab:'more',mode:'',detailId:'',process:null};render(h)}})};
    (typeof runtime?.setTimeout==='function'?runtime.setTimeout:setTimeout)(apply,25);(typeof runtime?.setTimeout==='function'?runtime.setTimeout:setTimeout)(apply,100);return true;
  }

  function choose(action){state={...state,mode:'action-picker',process:{action},actionQuery:'',actionType:'ALL',detailId:'',intent:''};render()}
  function openItem(id){if(!contextRow(id))return false;state={...state,mode:'',manager:false,editorId:'',detailId:String(id),intent:''};render();return true}
  async function openAction(action,itemType='ingredient',id='',options={}){
    if(!ownerRole(roleOf(runtime)))return false;const host=ensureHost();if(!host)return false;host.style.display='flex';if(!rows.length&&!productRows.length){const content=host.querySelector?.('[data-v32-inventory-content]');if(content)content.innerHTML='<div class="sj-v32-inv-empty">Memuat item…</div>';await load()}
    if(!id){state={...state,mode:'action-picker',process:{action},actionQuery:'',actionType:'ALL',detailId:''};render(host);return true}
    const row=itemRow(itemType,id);if(!row)return false;state={...state,mode:'process',process:{action,itemType,row,location:options.location||'warehouse'},detailId:'',actionQuery:'',actionType:'ALL'};render(host);return true;
  }

  function processValues(host){
    const get=name=>host?.querySelector?.(`[data-v32-process-field="${name}"]`)?.value;
    return{qty:num(get('qty')),goodsCost:num(get('goodsCost')),fees:num(get('fees')),discount:num(get('discount')),supplier:get('supplier')||'',fundSource:get('fundSource')||'CASH',note:get('note')||'',location:get('location')||'warehouse',actual:num(get('actual'))};
  }
  function editorValues(host){const get=name=>host?.querySelector?.(`[data-v32-editor-field="${name}"]`)?.value;return{name:get('name')||'',unit:get('unit')||'g',category:get('category')||'BAHAN',criticalOutlet:num(get('criticalOutlet')),warningOutlet:num(get('warningOutlet')),targetOutlet:num(get('targetOutlet')),minWarehouse:num(get('minWarehouse')),targetWarehouse:num(get('targetWarehouse')),dashboardPinned:get('dashboardPinned')==='1'}}

  function cupSetupValues(host){const out={};for(const spec of CUP_CATALOG_V34){const get=name=>host?.querySelector?.(`[data-v34-cup-setup-field="${spec.code}:${name}"]`)?.value;out[spec.code]={warehouseQty:get('warehouseQty')??0,outletQty:get('outletQty')??0,wac:get('wac')??0}}return out}

  async function applyInitialCupSetup(config){
    if(!ownerRole(roleOf(runtime)))throw new Error('CUP_INITIAL_SETUP_OWNER_REQUIRED');
    const valid=validateCupInitialSetupV34(config);
    await ensureCupMasters();await load();const plan=planCupInitialSetupV34(cupRows,valid);
    for(const action of plan.rows){const row=cupRows.find(x=>x.code===action.code);if(!row?.ingredientId)throw new Error(`CUP_MASTER_RESOLVE_FAILED:${action.code}`);if(!action.createMaster&&row.totalQty>0)continue;if(action.setInitialCost){const setCost=runtime?.SJCostingV1?.setInitialCost;if(typeof setCost!=='function')throw new Error('CUP_INITIAL_COST_AUTHORITY_UNAVAILABLE');await setCost('ingredient',row.ingredientId,action.wac)}await invokeLegacyWriter('opname','ingredient',row.ingredientId,{location:'warehouse',actual:action.warehouseQty,note:'Initial Cup Setup v3.4'});await invokeLegacyWriter('opname','ingredient',row.ingredientId,{location:'outlet',actual:action.outletQty,note:'Initial Cup Setup v3.4'})}
    await load();return true;
  }

  async function handleClick(event,host){
    if(event.target===host){host.style.display='none';return}
    if(event.target?.closest?.('[data-v32-inventory-detail-back]')){state.detailId='';state.mode='';render(host);return}
    if(event.target?.closest?.('[data-v32-action-back]')){state.mode='';state.process=null;state.tab='activity';render(host);return}
    if(event.target?.closest?.('[data-v32-process-back],[data-v32-process-cancel]')){const p=state.process;state.mode='';state.process=null;if(p?.itemType==='ingredient'){state.detailId=p.row?.id||''}else{host.style.display='none';runtime?.__SJ_V26_FINISHED_WAREHOUSE?.openProductDetail?.(p?.row?.id||'');return}render(host);return}
    if(event.target?.closest?.('[data-v32-manager-back]')){state.mode='';state.manager=false;state.tab='more';render(host);return}
    if(event.target?.closest?.('[data-v32-editor-back]')){state.mode=state.editorId==='__new__'?'manager':'';state.manager=state.editorId==='__new__';state.editorId='';render(host);return}
    if(event.target?.closest?.('[data-v32-manager-add]')){state.mode='editor';state.editorId='__new__';render(host);return}
    if(event.target?.closest?.('[data-v34-cup-setup-back],[data-v34-cup-setup-cancel]')){state.mode='';render(host);return}
    const cupSetup=event.target?.closest?.('[data-v34-cup-setup]');if(cupSetup){state.mode='cup-setup';render(host);return}
    const cupSetupApply=event.target?.closest?.('[data-v34-cup-setup-apply]');if(cupSetupApply){cupSetupApply.disabled=true;const label=cupSetupApply.textContent;cupSetupApply.textContent=runtime?.__SJ_LOCAL_QA_READ_ONLY===true?'Menerapkan simulasi…':'Menyiapkan…';try{const values=validateCupInitialSetupV34(cupSetupValues(host));if(runtime?.__SJ_LOCAL_QA_READ_ONLY===true){localSimulation.masterConfig=values;cupRows=buildCupLocalSimulationRowsV34(values);state.mode='';render(host);runtime?.alert?.('Simulasi master cup aktif hanya di halaman LOCAL QA ini.')}else{await applyInitialCupSetup(values);state.mode='';render(host)}}catch(e){runtime?.alert?.(e?.code==='CUP_INITIAL_WAC_REQUIRED'?'Isi WAC awal untuk cup yang memiliki stok.':e?.message||'Initial Cup Setup belum dapat dijalankan.')}finally{if(cupSetupApply.isConnected){cupSetupApply.disabled=false;cupSetupApply.textContent=label}}return}
    const manage=event.target?.closest?.('[data-v32-inventory-manage]');if(manage){state.mode='manager';state.manager=true;state.detailId='';render(host);return}
    const typeFilter=event.target?.closest?.('[data-v32-action-type]');if(typeFilter){state.actionType=typeFilter.dataset.v32ActionType||'ALL';render(host);return}
    const pick=event.target?.closest?.('[data-v32-action-pick]');if(pick){const [itemType,id]=String(pick.dataset.v32ActionPick||'').split(':');const row=itemRow(itemType,id);if(row){state.mode='process';state.process={action:state.process?.action||'transfer',itemType,row,location:'warehouse'};render(host)}return}
    const open=event.target?.closest?.('[data-v32-inventory-open-item]');if(open){openItem(open.dataset.v32InventoryOpenItem);return}
    const activity=event.target?.closest?.('[data-v32-inventory-activity-item]');if(activity){const id=activity.dataset.v32InventoryActivityItem,type=activity.dataset.v32InventoryItemType;if(type==='ingredient'){openItem(id);return}const finished=runtime?.__SJ_V26_FINISHED_WAREHOUSE;if(finished?.openProductDetail){host.style.display='none';finished.openProductDetail(id);return}}
    const tab=event.target?.closest?.('[data-v32-inventory-tab]');if(tab){state={...state,tab:tab.dataset.v32InventoryTab,query:'',filter:'ALL',intent:'',detailId:'',mode:'',process:null,manager:false,editorId:''};render(host);return}
    const filter=event.target?.closest?.('[data-v32-inventory-filter]');if(filter){state.filter=filter.dataset.v32InventoryFilter||'ALL';render(host);return}
    if(event.target?.closest?.('[data-v32-inventory-intent-cancel]')){state.intent='';render(host);return}
    const chooser=event.target?.closest?.('[data-v32-inventory-choose]');if(chooser){choose(chooser.dataset.v32InventoryChoose);return}
    const submit=event.target?.closest?.('[data-v32-process-submit]');if(submit){const p=state.process;if(!p)return;submit.disabled=true;const label=submit.textContent;submit.textContent='Memproses…';try{await invokeLegacyWriter(p.action,p.itemType,p.row.id,processValues(host));await load();if(p.itemType==='ingredient'){state={...state,mode:'',process:null,detailId:p.row.id};render(host)}else{host.style.display='none';runtime?.__SJ_V26_FINISHED_WAREHOUSE?.openProductDetail?.(p.row.id)}}catch(e){runtime?.alert?.(e?.message||'Proses belum dapat dijalankan.')}finally{if(submit.isConnected){submit.disabled=false;submit.textContent=label}}return}
    const saveEditor=event.target?.closest?.('[data-v32-editor-save]');if(saveEditor){const row=state.editorId&&state.editorId!=='__new__'?contextRow(state.editorId):null;saveEditor.disabled=true;const label=saveEditor.textContent;saveEditor.textContent='Menyimpan…';try{await invokeLegacyIngredientSave(row,editorValues(host));await load();state={...state,mode:'manager',manager:true,editorId:'',detailId:''};render(host)}catch(e){runtime?.alert?.(e?.message||'Bahan belum dapat disimpan.')}finally{if(saveEditor.isConnected){saveEditor.disabled=false;saveEditor.textContent=label}}return}
    const archiveEditor=event.target?.closest?.('[data-v32-editor-archive]');if(archiveEditor){const row=contextRow(archiveEditor.dataset.v32IngredientId||state.editorId);if(!row)return;archiveEditor.disabled=true;const label=archiveEditor.textContent;archiveEditor.textContent='Memproses…';try{await invokeLegacyIngredientArchive(row);await load();state={...state,mode:'manager',manager:true,editorId:'',detailId:''};render(host)}catch(e){runtime?.alert?.(e?.message||'Bahan belum dapat diarsipkan.')}finally{if(archiveEditor.isConnected){archiveEditor.disabled=false;archiveEditor.textContent=label}}return}
    const actionButton=event.target?.closest?.('[data-v32-inventory-action]');if(!actionButton)return;
    const action=actionButton.dataset.v32InventoryAction,id=actionButton.dataset.v32IngredientId||'';
    if(['transfer','purchase','opname'].includes(action)){openAction(action,'ingredient',id);return}
    if(action==='edit-rules'){state.mode='editor';state.editorId=id;state.detailId='';render(host);return}
    if(action==='recipes'){containAdvancedLegacy('recipes');return}
    if(action==='movements'){state={...state,tab:'activity',mode:'',detailId:'',process:null};render(host);return}
    if(action==='settings'){state.mode='manager';state.manager=true;render(host);return}
    if(action==='cost'){host.style.display='none';if(typeof runtime?.SJCostingV1?.openInitialCost==='function')runtime.SJCostingV1.openInitialCost();else containAdvancedLegacy('purchase')}
  }

  async function load(){
    const [raw,outlet]=await Promise.all([repository.readInventoryV2(),repository.readLegacyStock()]);const inv=raw||{};rows=buildIngredientInventoryRows(inv,{core});cupRows=runtime?.__SJ_LOCAL_QA_READ_ONLY===true&&localSimulation.masterConfig?buildCupLocalSimulationRowsV34(localSimulation.masterConfig):buildCupInventoryRowsV34(inv);activities=inventoryActivityTimeline(inv,120);
    const products=activeProducts(runtime).filter(p=>p?.trackStock===true);productRows=buildFinishedGoodsRows(products,{outlet:outlet||{},warehouse:inv.productWarehouse||{}}).map(normalizedProductRow);return{rows,cupRows,productRows,activities}
  }
  async function openWorkspace(tab='summary'){
    if(!ownerRole(roleOf(runtime)))return false;
    const host=ensureHost();if(!host)return false;state={tab:['summary','stock','activity','more'].includes(tab)?tab:'summary',query:'',filter:'ALL',intent:'',detailId:'',mode:'',process:null,manager:false,editorId:'',actionQuery:'',actionType:'ALL'};host.style.display='flex';const content=host.querySelector?.('[data-v32-inventory-content]');if(content)content.innerHTML='<div class="sj-v32-inv-empty">Memuat Bahan & Gudang…</div>';
    try{await load();render(host)}catch(_){if(content)content.innerHTML='<div class="sj-v32-inv-empty">Data inventory belum dapat dimuat. Tidak ada data yang diubah.</div>'}return true;
  }
  function wrappedOpen(tab){
    const value=String(tab||'summary'),route=routeLegacyInventoryTabV32(value);
    if(route.kind==='workspace')return openWorkspace(route.tab);
    if(route.kind==='action')return openAction(route.action);
    if(route.kind==='advanced')return containAdvancedLegacy(route.tab);
    return openWorkspace('summary');
  }
  inventory.open=wrappedOpen;
  const api=Object.freeze({installed:true,open:openWorkspace,openItem,openAction,legacyOpen,render:()=>render(),reload:load,ensureCupMasters,applyInitialCupSetup,localCupSimulation:()=>localSimulation,rows:()=>rows.slice(),cupRows:()=>cupRows.slice(),productRows:()=>productRows.slice(),activities:()=>activities.slice()});
  try{Object.defineProperty(runtime,'__SJ_V32_INVENTORY_WORKSPACE',{value:api,writable:false,configurable:false})}catch(_){}
  return api;
}
