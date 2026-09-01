import { POS_ROOT } from '../data/firebase-client.js';
import { activeProducts } from './sales-shift-ux-refinement.js';
import { renderIcon } from './icons.js';

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=v=>Number.isFinite(Number(v))?Number(v):0;
const roleOf=runtime=>{try{return runtime?.__SJ_SC03_RUNTIME?.guard?.currentRole?.()||null}catch(_){return null}};

export function keepFinishedProductOptions(select){
  if(!select?.options)return [];
  const options=Array.from(select.options);for(const option of options){if(!String(option?.value||'').startsWith('P:'))option.remove?.()}
  const kept=Array.from(select.options).filter(x=>String(x?.value||'').startsWith('P:')).map(x=>String(x.value));
  return kept.length?kept:options.filter(x=>String(x?.value||'').startsWith('P:')&&!x.removed).map(x=>String(x.value));
}

export function relabelRecipeCancellation(root){
  const buttons=Array.from(root?.querySelectorAll?.('[data-toggle-var]')||[]);let changed=0;
  for(const button of buttons){const text=String(button.textContent||'').trim();if(text==='Nonaktifkan'){button.textContent='Batalkan Rumus';changed++}else if(text==='Aktifkan'){button.textContent='Aktifkan Rumus';changed++}}
  if(buttons.length&&!root?.querySelector?.('[data-sj-recipe-note]'))root?.insertAdjacentHTML?.('afterbegin','<div class="sj-v26-recipe-note" data-sj-recipe-note>Rumus masih dapat dibatalkan tanpa menghapus histori. “Batalkan Rumus” memakai mekanisme nonaktif existing.</div>');return changed;
}

function finishedProducts(runtime){return activeProducts(runtime).filter(p=>p?.trackStock===true&&!(()=>{try{return !!runtime?.SJInventoryV2?.recipeForProduct?.(p.id)}catch(_){return false}})())}
async function readBalances(runtime){
  const db=runtime?.firebase?.database?.();if(!db)return{outlet:{},warehouse:{}};
  const [outlet,warehouse]=await Promise.all([db.ref(`${POS_ROOT}/global/inventory`).once('value'),db.ref(`${POS_ROOT}/global/inventoryV2/productWarehouse`).once('value')]);return{outlet:outlet?.val?.()||{},warehouse:warehouse?.val?.()||{}};
}

export function installFinishedGoodsWarehouseRefinement(runtime=globalThis){
  if(runtime?.__SJ_V26_FINISHED_WAREHOUSE)return runtime.__SJ_V26_FINISHED_WAREHOUSE;
  const document=runtime?.document;
  function filterLegacy(tab){runtime?.setTimeout?.(()=>{const select=document?.getElementById?.(tab==='purchase'?'sjinv-purchase-item':'sjinv-transfer-item');if(select){keepFinishedProductOptions(select);select.dispatchEvent?.(new Event('change'))}const body=document?.getElementById?.('sjinv-body');if(body){body.dataset.sjFinishedGoodsOnly='true';relabelRecipeCancellation(body)}},0)}
  function openReceive(){runtime?.SJInventoryV2?.open?.('purchase');filterLegacy('purchase');return true}
  function openTransfer(){runtime?.SJInventoryV2?.open?.('transfer');filterLegacy('transfer');return true}
  function openOutletStock(){runtime?.openOpr?.(3);return true}
  function closeHub(){const hub=document?.getElementById?.('sj-v26-warehouse-hub');if(hub)hub.style.display='none'}
  async function openHub(){if(roleOf(runtime)!=='owner'&&roleOf(runtime)!==null)return false;let hub=document?.getElementById?.('sj-v26-warehouse-hub');if(!hub&&document?.createElement){hub=document.createElement('div');hub.id='sj-v26-warehouse-hub';hub.className='sj-v26-warehouse-hub';hub.innerHTML='<div class="sj-v26-warehouse-card"><header><div><h2>Stok & Gudang</h2><p>Produk jadi · Gudang → Gerai → Dijual</p></div><button type="button" data-wh-close>×</button></header><div data-wh-body></div></div>';hub.querySelector?.('[data-wh-close]')?.addEventListener?.('click',closeHub);hub.addEventListener?.('click',e=>{if(e.target===hub)closeHub()});document.body?.appendChild?.(hub)}if(!hub)return false;hub.style.display='flex';const body=hub.querySelector?.('[data-wh-body]');if(body)body.innerHTML='<div class="sj-v26-empty">Memuat stok produk jadi…</div>';
    try{const products=finishedProducts(runtime),balances=await readBalances(runtime);if(body)body.innerHTML=`<section class="sj-v26-wh-actions"><button type="button" data-wh-action="receive"><span>${renderIcon('warehouse-box',{size:22})}</span><b>Terima ke Gudang</b><small>Input stok produk yang datang</small></button><button type="button" data-wh-action="transfer"><span>${renderIcon('restock',{size:22})}</span><b>Kirim ke Gerai</b><small>Pindahkan Gudang → Gerai</small></button><button type="button" data-wh-action="outlet"><span>${renderIcon('stock',{size:22})}</span><b>Stok Gerai</b><small>Stok yang siap dijual</small></button></section><section class="sj-v26-wh-flow"><b>Alur stok</b><span>Gudang</span><i>→</i><span>Gerai</span><i>→</i><span>Penjualan</span></section><section class="sj-v26-wh-list"><div class="sj-v26-section-head"><div><h3>Produk Jadi</h3><p>${products.length} produk dikelola stok</p></div></div>${products.length?products.map(p=>`<article><div><b>${esc(p.n||p.name||p.id)}</b><small>Gudang ${num(balances.warehouse?.[p.id]).toLocaleString('id-ID')} · Gerai ${num(balances.outlet?.[p.id]).toLocaleString('id-ID')}</small></div><span>${num(balances.outlet?.[p.id]).toLocaleString('id-ID')} siap jual</span></article>`).join(''):'<div class="sj-v26-empty">Belum ada produk jadi dengan pelacakan stok.</div>'}</section><aside class="sj-v26-readonly">Bahan racikan tidak dimasukkan ke alur sederhana ini. Kelola rumus hanya bila diperlukan dari Bahan & Gudang.</aside>`;body?.querySelector?.('[data-wh-action="receive"]')?.addEventListener?.('click',()=>{closeHub();openReceive()});body?.querySelector?.('[data-wh-action="transfer"]')?.addEventListener?.('click',()=>{closeHub();openTransfer()});body?.querySelector?.('[data-wh-action="outlet"]')?.addEventListener?.('click',()=>{closeHub();openOutletStock()})}catch(_){if(body)body.innerHTML='<div class="sj-v26-empty">Stok Gudang/Gerai belum dapat dimuat. Data tidak diubah.</div>'}return true}
  function enhance(){
    const body=document?.getElementById?.('sjinv-body');if(body)relabelRecipeCancellation(body);
    if(roleOf(runtime)!=='owner')return false;const activities=document?.querySelector?.('.sjvc02-activities');if(!activities||activities.querySelector?.('[data-sj-finished-warehouse]'))return false;const button=document.createElement('button');button.type='button';button.className='sjvc02-activity sj-v26-warehouse-entry';button.dataset.sjFinishedWarehouse='true';button.innerHTML=`<span class="ico">${renderIcon('warehouse-box',{size:21})}</span><b>Stok & Gudang</b><span>Gudang → Gerai → Dijual</span>`;button.addEventListener('click',openHub);activities.insertBefore?.(button,activities.firstChild);return true
  }
  const api=Object.freeze({installed:true,openHub,openReceive,openTransfer,openOutletStock,enhance});try{Object.defineProperty(runtime,'__SJ_V26_FINISHED_WAREHOUSE',{value:api,writable:false,configurable:false})}catch(_){}return api;
}
