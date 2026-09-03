import { POS_ROOT } from '../data/firebase-client.js';
import { activeProducts } from './sales-shift-ux-refinement.js';
import { renderIcon } from './icons.js';
import {
  endingStockDecision,
  FINISHED_GOODS_EXCEPTION_REASONS,
  buildFinishedGoodsRows,
  filterFinishedGoodsRows
} from '../domain/finished-goods-stock.js';

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=v=>Number.isFinite(Number(v))?Number(v):0;
const roleOf=runtime=>{try{return runtime?.__SJ_SC03_RUNTIME?.guard?.currentRole?.()||null}catch(_){return null}};
const roleLabel=role=>role==='owner'?'Owner':'Kasir';
const isOwnerRole=role=>['owner','manajemen'].includes(String(role||'').toLowerCase());
const formatQty=v=>num(v).toLocaleString('id-ID');

export function keepFinishedProductOptions(select){
  if(!select?.options)return [];
  const options=Array.from(select.options);
  for(const option of options){if(!String(option?.value||'').startsWith('P:'))option.remove?.()}
  const kept=Array.from(select.options).filter(x=>String(x?.value||'').startsWith('P:')).map(x=>String(x.value));
  return kept.length?kept:options.filter(x=>String(x?.value||'').startsWith('P:')&&!x.removed).map(x=>String(x.value));
}

export function relabelRecipeCancellation(root){
  const buttons=Array.from(root?.querySelectorAll?.('[data-toggle-var]')||[]);let changed=0;
  for(const button of buttons){const label=String(button.textContent||'').trim();if(label==='Nonaktifkan'){button.textContent='Batalkan Rumus';changed++}else if(label==='Aktifkan'){button.textContent='Aktifkan Rumus';changed++}}
  if(buttons.length&&!root?.querySelector?.('[data-sj-recipe-note]'))root?.insertAdjacentHTML?.('afterbegin','<div class="sj-v26-recipe-note" data-sj-recipe-note>Rumus bersifat advanced. Penjualan normal barang jadi tetap mengikuti produk yang dipilih kasir.</div>');
  return changed;
}

export function finishedProductsForStock(runtime){return activeProducts(runtime).filter(p=>p?.trackStock===true)}

async function readBalances(runtime){
  const db=runtime?.firebase?.database?.();if(!db)return{outlet:{},warehouse:{}};
  const [outlet,warehouse]=await Promise.all([
    db.ref(`${POS_ROOT}/global/inventory`).once('value'),
    db.ref(`${POS_ROOT}/global/inventoryV2/productWarehouse`).once('value')
  ]);
  return{outlet:outlet?.val?.()||{},warehouse:warehouse?.val?.()||{}};
}

function renderStockCells(row){
  return `<div class="sj-v29-fg-stock-grid"><div class="sj-v29-fg-stock warehouse"><span>Gudang</span><strong>${formatQty(row.warehouseQty)}</strong></div><div class="sj-v29-fg-stock outlet"><span>Gerai</span><strong>${formatQty(row.outletQty)}</strong></div></div>`;
}

function renderOwnerProductActions(row){
  return `<div class="sj-v29-fg-row-actions"><button type="button" data-v29-fg-action="warehouse-opname" data-product-id="${esc(row.id)}">Set Stok Gudang</button><button type="button" data-v29-fg-action="transfer" data-product-id="${esc(row.id)}">Transfer ke Gerai</button><button type="button" class="secondary" data-v29-fg-action="purchase-advanced" data-product-id="${esc(row.id)}">Pembelian (Advanced)</button><button type="button" class="warning" data-v29-fg-action="draft" data-product-id="${esc(row.id)}">Laporkan Masalah</button></div>`;
}

function renderCashierProductActions(row){
  return `<div class="sj-v29-fg-row-actions cashier"><button type="button" class="warning" data-v29-fg-action="draft" data-product-id="${esc(row.id)}">Laporkan Masalah</button></div>`;
}

export function renderFinishedGoodsRows({role,rows=[]}={}){
  if(!rows.length)return '<div class="sj-v26-empty">Produk tidak ditemukan.</div>';
  const owner=isOwnerRole(role);
  return rows.map(row=>`<article class="sj-v29-fg-row" data-v29-fg-product="${esc(row.id)}"><button type="button" class="sj-v32-fg-open-detail" data-v32-fg-open-detail="${esc(row.id)}"><div class="sj-v29-fg-product"><b>${esc(row.name)}</b>${row.sku?`<small>${esc(row.sku)}</small>`:''}</div>${renderStockCells(row)}<span class="sj-v32-fg-open-hint">Buka detail &amp; atur →</span></button>${owner?renderOwnerProductActions(row):renderCashierProductActions(row)}</article>`).join('');
}

export function renderFinishedGoodsDetailV32({role,row}={}){
  if(!row)return '<div class="sj-v26-empty">Detail produk tidak ditemukan.</div>';
  const owner=isOwnerRole(role),total=num(row.warehouseQty)+num(row.outletQty);
  return `<section class="sj-v32-fg-detail" data-v32-fg-detail="${esc(row.id)}"><button type="button" class="sj-v32-inv-back" data-v32-fg-detail-back>‹ Kembali ke Stok Barang Jadi</button><header><div><small>Barang Jadi${row.sku?` · ${esc(row.sku)}`:''}</small><h3>${esc(row.name)}</h3><p>Gudang → Gerai → Penjualan. Stok produk jadi tidak dicampur dengan bahan resep.</p></div></header><div class="sj-v32-fg-detail-stock"><article><small>Gudang</small><strong>${formatQty(row.warehouseQty)}</strong></article><article><small>Gerai</small><strong>${formatQty(row.outletQty)}</strong></article><article><small>Total</small><strong>${formatQty(total)}</strong></article></div><section class="sj-v32-inv-detail-section"><div class="sj-v32-inv-section-head"><h3>Proses Item</h3><span>${owner?'Owner':'Kasir'}</span></div>${owner?renderOwnerProductActions(row):renderCashierProductActions(row)}</section><section class="sj-v32-inv-detail-section"><div class="sj-v32-inv-section-head"><h3>Pergerakan</h3><span>Audit</span></div><button type="button" class="sj-v32-fg-movement-link" data-v29-fg-action="movements">${renderIcon('activity',{size:20})}<span><b>Lihat Pergerakan Stok</b><small>Transfer, pembelian, dan opname dari Inventory V2.</small></span><span>›</span></button></section></section>`;
}

function renderMovementPanel(){
  return `<section class="sj-v29-fg-movement"><div class="sj-v29-fg-movement-icon">${renderIcon('activity',{size:24})}</div><div><b>Pergerakan Stok</b><p>Riwayat transfer, opname, dan movement tetap dibaca dari authority Inventory V2.</p></div><button type="button" data-v29-fg-action="movements">Buka Pergerakan</button></section>`;
}

export function renderFinishedGoodsHubView({role,tab='warehouse',rows=[],query=''}={}){
  const owner=isOwnerRole(role),active=['warehouse','outlet','movement'].includes(tab)?tab:'warehouse';
  const visible=filterFinishedGoodsRows(rows,query);
  const flowSummary=`<aside class="sj-v29-fg-safe"><b>Alur aman:</b> Gudang dan Gerai tidak dicampur. Penjualan mengambil stok dari Gerai; Stok Akhir normal tetap di Gerai tanpa movement palsu.</aside>`;
  const ownerSummary=owner?`<aside class="sj-v29-fg-safe"><b>Owner:</b> Set stok fisik Gudang memakai Stock Opname existing; transfer memakai Inventory V2. Pembelian hanya fitur advanced bila Owner ingin mencatat costing/HPP.</aside>`:'';
  return `<div class="sj-v29-fg-shell" data-v29-fg-shell data-active-tab="${active}"><nav class="sj-v29-fg-tabs" aria-label="Lokasi stok"><button type="button" data-v29-fg-tab="warehouse" class="${active==='warehouse'?'active':''}">Gudang</button><button type="button" data-v29-fg-tab="outlet" class="${active==='outlet'?'active':''}">Gerai</button><button type="button" data-v29-fg-tab="movement" class="${active==='movement'?'active':''}">Pergerakan</button></nav>${active==='movement'?renderMovementPanel():`<label class="sj-v29-fg-search"><span>${renderIcon('search',{size:18})}</span><input type="search" data-v29-fg-search value="${esc(query)}" placeholder="Cari produk / SKU..." aria-label="Cari produk"></label><div class="sj-v29-fg-location-note"><b>${active==='warehouse'?'Stok Gudang':'Stok Gerai'}</b><span>${active==='warehouse'?'Stok fisik penyimpanan sebelum ditransfer ke Gerai.':'Stok yang tersedia untuk Penjualan di Gerai.'}</span></div><section class="sj-v29-fg-list" data-v29-fg-list>${renderFinishedGoodsRows({role,rows:visible})}</section>${flowSummary}${ownerSummary}`}<aside class="sj-v29-fg-advanced">Bahan/resep tetap berada pada <b>Bahan &amp; Gudang</b> advanced dan tidak menjadi flow utama barang jadi.</aside></div>`;
}

function makeChangeEvent(runtime){
  const EventCtor=runtime?.Event||globalThis?.Event;
  try{return EventCtor?new EventCtor('change',{bubbles:true}):{type:'change'}}catch(_){return{type:'change'}}
}

export function installFinishedGoodsWarehouseRefinement(runtime=globalThis){
  if(runtime?.__SJ_V26_FINISHED_WAREHOUSE)return runtime.__SJ_V26_FINISHED_WAREHOUSE;
  const document=runtime?.document;
  let lastBalances={outlet:{},warehouse:{}},lastRows=[],hubState={tab:'warehouse',query:'',detailId:''},selectedDraftProductId='';

  function filterLegacy(tab,{productId='',location=''}={}){
    runtime?.setTimeout?.(()=>{
      const selectId=tab==='purchase'?'sjinv-purchase-item':tab==='opname'?'sjinv-opname-item':'sjinv-transfer-item';
      const select=document?.getElementById?.(selectId);
      if(select){
        keepFinishedProductOptions(select);
        if(productId)select.value=`P:${productId}`;
        select.dispatchEvent?.(makeChangeEvent(runtime));
        if(productId){const field=select.closest?.('.sjinv-field');if(field)field.style.display='none'}
      }
      if(tab==='opname'&&location){
        const locationSelect=document?.getElementById?.('sjinv-opname-loc');
        if(locationSelect){locationSelect.value=location;locationSelect.dispatchEvent?.(makeChangeEvent(runtime))}
      }
      const body=document?.getElementById?.('sjinv-body');
      if(body){
        body.dataset.sjFinishedGoodsOnly='true';relabelRecipeCancellation(body);
        const row=lastRows.find(x=>String(x.id)===String(productId));
        if(productId&&row&&!body.querySelector?.('[data-v32-fg-prefilled-context]'))body.insertAdjacentHTML?.('afterbegin',`<div class="sj-v32-prefilled" data-v32-fg-prefilled-context><span><b>${esc(row.name)}</b><small>Barang Jadi</small></span><span>Gudang ${formatQty(row.warehouseQty)} · Gerai ${formatQty(row.outletQty)}</span></div>`);
      }
    },0);
  }

  function v3Inventory(){return runtime?.__SJ_V32_INVENTORY_WORKSPACE||null}
  function requireV3Inventory(){const v3=v3Inventory();if(v3?.open||v3?.openAction)return v3;try{runtime?.showToast?.('Tampilan inventori V3 belum siap. Coba buka kembali sesaat lagi.','warning')}catch(_){}return null}
  function openReceive(){const v3=requireV3Inventory();return v3?.openAction?v3.openAction('purchase'):false}
  function openTransfer(){const v3=requireV3Inventory();return v3?.openAction?v3.openAction('transfer'):false}
  function openWarehouseOpname(productId=''){if(!isOwnerRole(roleOf(runtime)))return false;const v3=requireV3Inventory();return v3?.openAction?v3.openAction?.('opname','product',productId,{location:'warehouse'}):false}
  function openTransferForProduct(productId=''){if(!isOwnerRole(roleOf(runtime)))return false;const v3=requireV3Inventory();return v3?.openAction?v3.openAction?.('transfer','product',productId):false}
  function openAdvancedPurchase(productId=''){if(!isOwnerRole(roleOf(runtime)))return false;const v3=requireV3Inventory();return v3?.openAction?v3.openAction?.('purchase','product',productId):false}
  function openOwnerReconciliation(productId=''){if(!isOwnerRole(roleOf(runtime)))return false;const v3=requireV3Inventory();return v3?.openAction?v3.openAction?.('opname','product',productId,{location:'outlet'}):false}
  function openMovements(){const v3=requireV3Inventory();return v3?.open?v3.open?.('activity'):false}
  function openOutletStock(){runtime?.openOpr?.(3);return true}

  function closeHub(){const hub=document?.getElementById?.('sj-v26-warehouse-hub');if(hub)hub.style.display='none'}

  function draftProductRows(query=''){
    const rows=filterFinishedGoodsRows(lastRows,query);
    return rows.length?rows.map(row=>`<button type="button" data-v29-stock-pick="${esc(row.id)}"><span><b>${esc(row.name)}</b>${row.sku?`<small>${esc(row.sku)}</small>`:''}</span><span>Gerai <strong>${formatQty(row.outletQty)}</strong></span></button>`).join(''):'<div class="sj-v26-empty">Produk tidak ditemukan.</div>';
  }

  function updateDraftSelection(modal,productId){
    selectedDraftProductId=String(productId||'');
    const row=lastRows.find(x=>String(x.id)===selectedDraftProductId);
    const hidden=modal?.querySelector?.('[data-v28-stock-product]');if(hidden)hidden.value=selectedDraftProductId;
    const selected=modal?.querySelector?.('[data-v29-stock-selected]');
    if(selected)selected.innerHTML=row?`<span><b>${esc(row.name)}</b>${row.sku?`<small>${esc(row.sku)}</small>`:''}</span><span>Stok Gerai <strong>${formatQty(row.outletQty)}</strong></span>`:'<span>Belum ada produk dipilih.</span>';
  }

  function ensureDraftModal(){
    let modal=document?.getElementById?.('sj-v28-stock-draft');if(modal)return modal;if(!document?.createElement)return null;
    modal=document.createElement('div');modal.id='sj-v28-stock-draft';modal.className='overlay';
    modal.innerHTML='<div class="modal sj-v28-stock-draft-card"><div class="modal-title">Laporan Masalah Stok Barang Jadi</div><p class="sj-v29-stock-safe-copy">Rusak/basi/sobek/bocor/kedaluwarsa/hilang/selisih tidak mengurangi stok otomatis. <b>Draft ini belum mengubah stok.</b> Owner meninjau dan melakukan Rekonsiliasi Owner melalui Stock Opname.</p><label class="sj-v29-stock-search"><span>Cari produk</span><input data-v29-stock-search type="search" placeholder="Nama produk / SKU"></label><div class="sj-v29-stock-selected" data-v29-stock-selected><span>Belum ada produk dipilih.</span></div><div class="sj-v29-stock-results" data-v29-stock-results></div><input type="hidden" data-v28-stock-product><div class="sj-v29-stock-fields"><label>Stok fisik aktual<input data-v28-stock-counted type="number" min="0" step="1" inputmode="numeric"></label><label>Alasan<select data-v28-stock-reason></select></label></div><label>Catatan<input data-v28-stock-note placeholder="Kondisi / lokasi / keterangan"></label><div class="sj-ref-media-actions"><button type="button" data-v28-stock-draft="wa">Buat Draft + WhatsApp</button><button type="button" data-v28-stock-draft="owner">Rekonsiliasi Owner</button><button type="button" data-v28-stock-draft="close">Batal</button></div><pre data-v28-stock-preview hidden></pre></div>';
    document.body?.appendChild?.(modal);
    const reason=modal.querySelector?.('[data-v28-stock-reason]');if(reason)reason.innerHTML=FINISHED_GOODS_EXCEPTION_REASONS.map(x=>`<option value="${x}">${x}</option>`).join('');
    const search=modal.querySelector?.('[data-v29-stock-search]');
    search?.addEventListener?.('input',()=>{const results=modal.querySelector?.('[data-v29-stock-results]');if(results)results.innerHTML=draftProductRows(search.value)});
    modal.addEventListener?.('click',event=>{
      const pick=event.target?.closest?.('[data-v29-stock-pick]');
      if(pick){updateDraftSelection(modal,pick.dataset.v29StockPick);return}
      const action=event.target?.dataset?.v28StockDraft;
      if(action==='close'||event.target===modal){modal.style.display='none';return}
      if(action==='owner'){if(selectedDraftProductId)openOwnerReconciliation(selectedDraftProductId);return}
      if(action==='wa'){
        const productId=selectedDraftProductId||modal.querySelector?.('[data-v28-stock-product]')?.value;
        if(!productId)return;
        const row=lastRows.find(x=>String(x.id)===String(productId));
        const systemQty=num(row?.outletQty),countedQty=num(modal.querySelector?.('[data-v28-stock-counted]')?.value),reasonValue=modal.querySelector?.('[data-v28-stock-reason]')?.value,note=modal.querySelector?.('[data-v28-stock-note]')?.value;
        const decision=endingStockDecision({productId,productName:row?.name||productId,systemQty,countedQty,disposition:'EXCEPTION',reason:reasonValue,note,reportedBy:roleLabel(roleOf(runtime))});
        const preview=modal.querySelector?.('[data-v28-stock-preview]');if(preview){preview.hidden=false;preview.textContent=decision.whatsappText}
        const url='https://wa.me/?text='+encodeURIComponent(decision.whatsappText);try{runtime?.open?.(url,'_blank','noopener,noreferrer')}catch(_){}
      }
    });
    return modal;
  }

  function openExceptionDraft(productId=''){
    const modal=ensureDraftModal();if(!modal)return false;
    const search=modal.querySelector?.('[data-v29-stock-search]');if(search)search.value='';
    const results=modal.querySelector?.('[data-v29-stock-results]');if(results)results.innerHTML=draftProductRows('');
    updateDraftSelection(modal,productId);
    const ownerButton=modal.querySelector?.('[data-v28-stock-draft="owner"]');if(ownerButton)ownerButton.style.display=isOwnerRole(roleOf(runtime))?'':'none';
    modal.style.display='flex';return true;
  }

  function updateHubList(hub){
    const list=hub?.querySelector?.('[data-v29-fg-list]');if(!list)return;
    list.innerHTML=renderFinishedGoodsRows({role:roleOf(runtime),rows:filterFinishedGoodsRows(lastRows,hubState.query)});
  }

  function renderHubBody(hub){
    const body=hub?.querySelector?.('[data-wh-body]');if(!body)return;
    const detail=hubState.detailId?lastRows.find(x=>String(x.id)===String(hubState.detailId)):null;
    body.innerHTML=detail?renderFinishedGoodsDetailV32({role:roleOf(runtime),row:detail}):renderFinishedGoodsHubView({role:roleOf(runtime),tab:hubState.tab,rows:lastRows,query:hubState.query});
  }

  function ensureHub(){
    let hub=document?.getElementById?.('sj-v26-warehouse-hub');if(hub)return hub;if(!document?.createElement)return null;
    hub=document.createElement('div');hub.id='sj-v26-warehouse-hub';hub.className='sj-v26-warehouse-hub';
    hub.innerHTML='<div class="sj-v26-warehouse-card"><header><div><h2>Stok Barang Jadi</h2><p>Gudang dan Gerai dipisahkan dengan jelas</p></div><button type="button" data-wh-close aria-label="Tutup">×</button></header><div data-wh-body></div></div>';
    hub.querySelector?.('[data-wh-close]')?.addEventListener?.('click',closeHub);
    hub.addEventListener?.('click',event=>{
      if(event.target===hub){closeHub();return}
      if(event.target?.closest?.('[data-v32-fg-detail-back]')){hubState.detailId='';renderHubBody(hub);return}
      const detailButton=event.target?.closest?.('[data-v32-fg-open-detail]');
      if(detailButton){hubState.detailId=detailButton.dataset.v32FgOpenDetail||'';renderHubBody(hub);return}
      const tab=event.target?.closest?.('[data-v29-fg-tab]');
      if(tab){hubState.tab=tab.dataset.v29FgTab;hubState.query='';hubState.detailId='';renderHubBody(hub);return}
      const actionButton=event.target?.closest?.('[data-v29-fg-action]');if(!actionButton)return;
      const action=actionButton.dataset.v29FgAction,productId=actionButton.dataset.productId||'';
      if(action==='warehouse-opname'){closeHub();openWarehouseOpname(productId)}
      else if(action==='transfer'){closeHub();openTransferForProduct(productId)}
      else if(action==='purchase-advanced'){closeHub();openAdvancedPurchase(productId)}
      else if(action==='draft'){openExceptionDraft(productId)}
      else if(action==='movements'){closeHub();openMovements()}
    });
    hub.addEventListener?.('input',event=>{
      const input=event.target?.closest?.('[data-v29-fg-search]');if(!input)return;
      hubState.query=input.value||'';updateHubList(hub);
    });
    document.body?.appendChild?.(hub);return hub;
  }

  async function openHub(){
    const role=roleOf(runtime);if(!['owner','cashier',null].includes(role))return false;
    const hub=ensureHub();if(!hub)return false;hub.style.display='flex';
    const body=hub.querySelector?.('[data-wh-body]');if(body)body.innerHTML='<div class="sj-v26-empty">Memuat stok Gudang dan Gerai…</div>';
    try{
      const products=finishedProductsForStock(runtime),balances=await readBalances(runtime);lastBalances=balances;lastRows=buildFinishedGoodsRows(products,balances);hubState={tab:'warehouse',query:'',detailId:''};renderHubBody(hub);
    }catch(_){if(body)body.innerHTML='<div class="sj-v26-empty">Stok Gudang/Gerai belum dapat dimuat. Data tidak diubah.</div>'}
    return true;
  }

  async function openProductDetail(productId=''){
    const hub=ensureHub();if(!hub)return false;hub.style.display='flex';
    if(!lastRows.length){
      const body=hub.querySelector?.('[data-wh-body]');if(body)body.innerHTML='<div class="sj-v26-empty">Memuat detail barang jadi…</div>';
      try{const products=finishedProductsForStock(runtime),balances=await readBalances(runtime);lastBalances=balances;lastRows=buildFinishedGoodsRows(products,balances)}catch(_){return false}
    }
    if(!lastRows.some(x=>String(x.id)===String(productId)))return false;
    hubState={tab:'warehouse',query:'',detailId:String(productId)};renderHubBody(hub);return true;
  }

  function enhance(){
    const body=document?.getElementById?.('sjinv-body');if(body)relabelRecipeCancellation(body);
    const role=roleOf(runtime);if(role!=='owner'&&role!=='cashier'&&role!==null)return false;
    const activities=document?.querySelector?.('.sjvc02-activities');if(!activities||activities.querySelector?.('[data-sj-finished-warehouse]'))return false;
    const button=document.createElement('button');button.type='button';button.className='sjvc02-activity sj-v26-warehouse-entry';button.dataset.sjFinishedWarehouse='true';button.innerHTML=`<span class="ico">${renderIcon('warehouse',{size:21})}</span><b>Stok Barang Jadi</b><span>Gudang &amp; Gerai</span>`;button.addEventListener('click',openHub);activities.insertBefore?.(button,activities.firstChild);return true;
  }

  const api=Object.freeze({installed:true,openHub,openProductDetail,openReceive,openTransfer,openWarehouseOpname,openTransferForProduct,openAdvancedPurchase,openOwnerReconciliation,openMovements,openOutletStock,openExceptionDraft,enhance});
  try{Object.defineProperty(runtime,'__SJ_V26_FINISHED_WAREHOUSE',{value:api,writable:false,configurable:false})}catch(_){}
  return api;
}
