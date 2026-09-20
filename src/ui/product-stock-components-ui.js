import { assertProductStockItemEligible, isProductStockItemEligible } from '../domain/product-stock-components.js';
import { createInventoryRepository } from '../data/repositories/inventory-repository.js';
import { createStockComponentWriter } from '../data/writers/stock-component-writer.js';

const RUNTIME_KEY='__SJ_PRODUCT_STOCK_COMPONENTS_UI';
const text=value=>String(value??'').trim();

function fail(code,detail=''){
  const error=new Error(detail?`${code}:${detail}`:code);
  error.code=code;
  throw error;
}
function esc(value){
  return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function roleOf(runtime){
  try{return text(runtime?.__SJ_SC03_RUNTIME?.guard?.currentRole?.()??runtime?.currentUserRole??'').toLowerCase();}
  catch(_){return text(runtime?.currentUserRole).toLowerCase();}
}
function actorOf(runtime){
  return Object.freeze({role:roleOf(runtime),id:text(runtime?.currentLoginId),name:text(runtime?.currentUserName)});
}
function productIdFromSurface(surface){
  if(!surface)return '';
  return [
    surface?.dataset?.productId,
    surface?.dataset?.id,
    surface?.querySelector?.('[name="productId"]')?.value,
    surface?.querySelector?.('[name="id"]')?.value,
    surface?.querySelector?.('#edit-m-id')?.value,
    surface?.querySelector?.('#edit-product-id')?.value,
    surface?.querySelector?.('#edit-id')?.value
  ].map(text).find(Boolean)||'';
}
function activeEntries(mapping){
  if(Array.isArray(mapping))return mapping.filter(row=>row&&row.active!==false&&text(row.stockItemId));
  return Object.values(mapping||{}).filter(row=>row&&row.active!==false&&text(row.stockItemId));
}
function formatQty(value){
  const qty=Number(value);
  if(!Number.isFinite(qty))return '0';
  return Number.isInteger(qty)?String(qty):String(qty).replace(/0+$/,'').replace(/\.$/,'');
}
function friendlyError(error){
  const code=text(error?.code||error?.message).split(':')[0];
  const map={
    STOCK_COMPONENT_CONFIG_OWNER_REQUIRED:'Hanya Owner yang dapat mengatur Pemakaian Stok.',
    STOCK_COMPONENT_PRODUCT_REQUIRED:'Produk belum dapat dikenali. Tutup lalu buka kembali Edit Produk.',
    STOCK_COMPONENT_ITEM_REQUIRED:'Pilih Item Stok untuk setiap komponen.',
    STOCK_COMPONENT_DUPLICATE_ITEM:'Item Stok yang sama tidak boleh dipilih dua kali.',
    STOCK_COMPONENT_QTY_REQUIRED:'Jumlah pemakaian per produk harus lebih dari 0.',
    STOCK_COMPONENT_CUP_FORBIDDEN:'Cup diatur melalui Kemasan / Cup Control, bukan Pemakaian Stok.',
    STOCK_ITEM_INACTIVE:'Item Stok sudah diarsipkan atau tidak aktif.',
    STOCK_ITEM_NOT_FOUND:'Item Stok tidak ditemukan.'
  };
  return map[code]||text(error?.message)||'Pemakaian stok belum dapat diproses.';
}

export function isStockComponentManager(role){
  const value=text(role).toLowerCase();
  return value==='owner'||value==='manajemen';
}
export function normalizeProductStockComponentRows(rows=[]){
  const seen=new Set();
  const components={};
  for(const raw of Array.isArray(rows)?rows:[]){
    const stockItemId=text(raw?.stockItemId);
    if(!stockItemId)fail('STOCK_COMPONENT_ITEM_REQUIRED');
    if(seen.has(stockItemId))fail('STOCK_COMPONENT_DUPLICATE_ITEM',stockItemId);
    if(raw?.qtyPerUnit===''||raw?.qtyPerUnit==null)fail('STOCK_COMPONENT_QTY_REQUIRED',stockItemId);
    const qtyPerUnit=Number(raw.qtyPerUnit);
    if(!Number.isFinite(qtyPerUnit)||qtyPerUnit<=0)fail('STOCK_COMPONENT_QTY_REQUIRED',stockItemId);
    seen.add(stockItemId);
    components[stockItemId]=Object.freeze({stockItemId,qtyPerUnit,active:true});
  }
  return Object.freeze(components);
}
export function summarizeProductStockComponents(mapping={},stockItems={}){
  const rows=activeEntries(mapping);
  if(rows.length===0)return 'Belum diatur';
  if(rows.length>1)return `${rows.length} komponen`;
  const row=rows[0];
  const stockItemId=text(row.stockItemId);
  const item=stockItems?.[stockItemId]||{};
  const name=text(item.name)||stockItemId;
  const unit=text(item.unit)||'';
  return `${name} ×${formatQty(row.qtyPerUnit)}${unit?` ${unit}`:''}`;
}
function modelFrom(mapping,stockItems,productId){
  return Object.freeze({
    productId,
    mapping:mapping||{},
    stockItems:stockItems||{},
    summary:summarizeProductStockComponents(mapping,stockItems)
  });
}
function eligibleStockItems(stockItems={}){
  return Object.freeze(Object.fromEntries(
    Object.entries(stockItems||{}).filter(([,item])=>isProductStockItemEligible(item))
  ));
}

export function installProductStockComponentsUi(runtime=globalThis,{document=runtime?.document,inventoryRepository=null,stockComponentWriter=null}={}){
  if(runtime?.[RUNTIME_KEY])return runtime[RUNTIME_KEY];
  let repository=inventoryRepository;
  let writer=stockComponentWriter;
  let editorState=null;
  let editorRequestSeq=0;
  let summaryRequestSeq=0;

  const management=()=>isStockComponentManager(roleOf(runtime));
  function assertManager(){if(!management())fail('STOCK_COMPONENT_CONFIG_OWNER_REQUIRED');}
  function getDb(){const db=runtime?.firebase?.database?.();if(!db)fail('STOCK_COMPONENT_DATABASE_REQUIRED');return db;}
  function getRepository(){
    if(repository)return repository;
    repository=createInventoryRepository({db:getDb(),consumer:'product-stock-components-ui'});
    return repository;
  }
  function getWriter(){
    if(writer)return writer;
    const databaseApi=runtime?.firebase?.database;
    writer=createStockComponentWriter({
      db:getDb(),
      now:()=>Date.now(),
      serverTimestamp:()=>databaseApi?.ServerValue?.TIMESTAMP??Date.now()
    });
    return writer;
  }
  async function openProduct(productId){
    assertManager();
    const id=text(productId);if(!id)fail('STOCK_COMPONENT_PRODUCT_REQUIRED');
    const [mapping,stockItems]=await Promise.all([
      getRepository().readProductStockComponents(id),
      getRepository().readStockItems()
    ]);
    return modelFrom(mapping,eligibleStockItems(stockItems),id);
  }
  async function saveProduct(productId,rows){
    assertManager();
    const id=text(productId);if(!id)fail('STOCK_COMPONENT_PRODUCT_REQUIRED');
    const components=normalizeProductStockComponentRows(rows);
    const stockItems=await getRepository().readStockItems();
    for(const component of Object.values(components)){
      assertProductStockItemEligible(stockItems?.[component.stockItemId],component.stockItemId);
    }
    const actor=actorOf(runtime);
    await getWriter().saveProductComponents({productId:id,components,actor});
    return Object.freeze({productId:id,components,actor});
  }

  // Compatibility API only. PU-05 redirects visible Item Stok navigation to V3.
  function openStockItems(){
    assertManager();
    const workspace=runtime?.__SJ_V32_INVENTORY_WORKSPACE;
    if(typeof workspace?.openStockItems==='function')return workspace.openStockItems();
    fail('STOCK_ITEM_MASTER_UNAVAILABLE');
  }

  function editorNode(){
    return document?.querySelector?.('[data-sj-stock-components-editor="true"]')||null;
  }
  function removeEditorNode(){
    const node=editorNode();
    if(node?.parentNode?.removeChild)node.parentNode.removeChild(node);
  }
  function closeEditor(){
    editorRequestSeq++;
    removeEditorNode();
    editorState=null;
    return true;
  }
  function optionMarkup(stockItems,selected=''){
    const current=text(selected);
    return Object.entries(stockItems||{}).map(([id,item])=>{
      const key=text(id),name=text(item?.name)||key,unit=text(item?.unit);
      const label=unit?`${name} • ${unit}`:name;
      return `<option value="${esc(key)}"${key===current?' selected':''}>${esc(label)}</option>`;
    }).join('');
  }
  function rowMarkup(stockItems,row={}){
    const stockItemId=text(row.stockItemId);
    const qty=Number(row.qtyPerUnit)>0?Number(row.qtyPerUnit):1;
    return `<div class="sj-stock-component-row" data-sj-stock-row="true">
      <label class="sj-stock-component-item"><span>Item Stok</span><select data-sj-stock-item="true"><option value="">Pilih Item Stok</option>${optionMarkup(stockItems,stockItemId)}</select></label>
      <label class="sj-stock-component-qty"><span>Qty / produk</span><input data-sj-stock-qty="true" type="number" min="0.0001" step="any" value="${esc(formatQty(qty))}"></label>
      <button class="sj-stock-component-remove" type="button" data-sj-stock-remove="true" aria-label="Hapus komponen">Hapus</button>
    </div>`;
  }
  function emptyRowsMarkup(){
    return '<div class="sj-stock-components-empty" data-sj-stock-empty="true">Belum ada komponen. Tambahkan item fisik non-Cup yang selalu terpakai saat produk terjual.</div>';
  }
  function syncEmptyState(editor){
    const rowsHost=editor?.querySelector?.('[data-sj-stock-rows="true"]');
    if(!rowsHost)return;
    const hasRows=!!rowsHost.querySelector?.('[data-sj-stock-row="true"]');
    const existing=rowsHost.querySelector?.('[data-sj-stock-empty="true"]');
    if(hasRows){existing?.remove?.();return;}
    if(!existing)rowsHost.insertAdjacentHTML?.('beforeend',emptyRowsMarkup());
  }
  function wireEditor(editor,model){
    const rowsHost=editor.querySelector?.('[data-sj-stock-rows="true"]');
    const wireRemove=button=>button?.addEventListener?.('click',()=>{
      const row=button.closest?.('[data-sj-stock-row="true"]');
      if(row?.parentNode?.removeChild)row.parentNode.removeChild(row);
      syncEmptyState(editor);
    });
    editor.querySelectorAll?.('[data-sj-stock-remove="true"]')?.forEach?.(wireRemove);
    editor.querySelector?.('[data-sj-stock-add="true"]')?.addEventListener?.('click',()=>{
      if(!rowsHost)return;
      rowsHost.querySelector?.('[data-sj-stock-empty="true"]')?.remove?.();
      const holder=document.createElement('div');
      holder.innerHTML=rowMarkup(model.stockItems,{qtyPerUnit:1});
      const row=holder.firstElementChild;
      if(row)rowsHost.appendChild(row);
      wireRemove(row?.querySelector?.('[data-sj-stock-remove="true"]'));
    });
    editor.querySelector?.('[data-sj-stock-close="true"]')?.addEventListener?.('click',()=>closeEditor());
    editor.addEventListener?.('click',event=>{if(event?.target===editor)closeEditor();});
    editor.querySelector?.('[data-sj-stock-save="true"]')?.addEventListener?.('click',async()=>{
      const button=editor.querySelector?.('[data-sj-stock-save="true"]');
      try{
        if(button)button.disabled=true;
        const rows=[...(editor.querySelectorAll?.('[data-sj-stock-row="true"]')||[])].map(row=>({
          stockItemId:row.querySelector?.('[data-sj-stock-item="true"]')?.value,
          qtyPerUnit:row.querySelector?.('[data-sj-stock-qty="true"]')?.value
        }));
        await saveProduct(model.productId,rows);
        runtime?.showToast?.('Pemakaian stok tersimpan.','success');
        closeEditor();
        refresh({force:true});
      }catch(error){
        runtime?.showToast?.(friendlyError(error),'warning');
      }finally{
        if(button)button.disabled=false;
      }
    });
    syncEmptyState(editor);
  }
  async function openEditor(productId){
    assertManager();
    const id=text(productId);if(!id)fail('STOCK_COMPONENT_PRODUCT_REQUIRED');
    const requestId=++editorRequestSeq;
    removeEditorNode();
    editorState=null;

    let editor=null;
    if(document?.body&&typeof document?.createElement==='function'){
      editor=document.createElement('div');
      editor.className='sj-stock-components-editor-layer';
      editor.dataset.sjStockComponentsEditor='true';
      editor.setAttribute?.('data-sj-stock-components-editor','true');
      editor.setAttribute?.('role','dialog');
      editor.setAttribute?.('aria-modal','true');
      editor.setAttribute?.('aria-label','Pemakaian Stok');
      editor.innerHTML='<div class="sj-stock-components-editor-card"><div class="sj-stock-components-editor-loading">Memuat Pemakaian Stok…</div></div>';
      document.body.appendChild(editor);
    }

    try{
      const model=await openProduct(id);
      if(requestId!==editorRequestSeq){editor?.remove?.();return null;}
      editorState=model;
      if(!editor)return model;
      const rows=activeEntries(model.mapping);
      editor.innerHTML=`<div class="sj-stock-components-editor-card">
        <div class="sj-stock-components-editor-head">
          <div><span>PRODUK</span><b>PEMAKAIAN STOK</b><small>Item fisik non-Cup yang selalu terpakai saat 1 produk terjual.</small></div>
          <button type="button" data-sj-stock-close="true" aria-label="Tutup">×</button>
        </div>
        <div class="sj-stock-components-editor-note">Cup diatur terpisah melalui <b>Kemasan / Cup Control</b>. Item arsip dan Cup tidak ditampilkan di sini.</div>
        <div class="sj-stock-components-rows" data-sj-stock-rows="true">${rows.length?rows.map(row=>rowMarkup(model.stockItems,row)).join(''):emptyRowsMarkup()}</div>
        <div class="sj-stock-components-editor-actions">
          <button type="button" class="secondary" data-sj-stock-add="true">+ Tambah Komponen</button>
          <button type="button" class="primary" data-sj-stock-save="true">Simpan</button>
        </div>
      </div>`;
      wireEditor(editor,model);
      return model;
    }catch(error){
      if(requestId!==editorRequestSeq){editor?.remove?.();return null;}
      if(editor){
        editor.innerHTML=`<div class="sj-stock-components-editor-card"><div class="sj-stock-components-editor-head"><div><b>PEMAKAIAN STOK</b><small>Tidak dapat dimuat.</small></div><button type="button" data-sj-stock-close="true">×</button></div><div class="sj-stock-components-editor-error">${esc(friendlyError(error))}</div></div>`;
        editor.querySelector?.('[data-sj-stock-close="true"]')?.addEventListener?.('click',()=>closeEditor());
      }
      throw error;
    }
  }

  function ensureSection(surface){
    const existing=surface?.querySelector?.('[data-sj-stock-components="true"]');
    if(existing)return existing;
    if(typeof document?.createElement!=='function')return null;
    const host=surface?.matches?.('.modal')?surface:(surface?.querySelector?.('.modal')||surface);
    if(!host)return null;
    const section=document.createElement('section');
    section.className='sj-stock-components-section';
    section.dataset.sjStockComponents='true';
    section.setAttribute?.('data-sj-stock-components','true');
    section.innerHTML=`<button class="sj-stock-components-summary" type="button" data-sj-stock-edit="true">
      <span class="sj-stock-components-summary-copy"><small>PEMAKAIAN STOK</small><b>Item fisik non-Cup</b><em>Atur komponen yang selalu terpakai saat produk terjual.</em></span>
      <span class="sj-stock-components-summary-value"><strong data-sj-stock-summary="true">Belum diatur</strong><i aria-hidden="true">›</i></span>
    </button>`;
    const anchor=host.querySelector?.('#edit-img-preview');
    if(anchor&&anchor.parentNode===host)host.insertBefore(section,anchor);
    else host.appendChild?.(section);
    section.querySelector?.('[data-sj-stock-edit="true"]')?.addEventListener?.('click',()=>{
      const productId=productIdFromSurface(surface);
      if(!productId){runtime?.showToast?.('Simpan produk terlebih dahulu sebelum mengatur Pemakaian Stok.','warning');return;}
      openEditor(productId).catch(error=>runtime?.console?.warn?.('[STOCK-COMP] editor open failed',error));
    });
    return section;
  }

  function refresh({force=false}={}){
    if(!document)return false;
    const surface=document.querySelector?.('#modal-edit-master');
    if(!surface)return false;
    if(!management()){
      surface.querySelector?.('[data-sj-stock-components="true"]')?.remove?.();
      closeEditor();
      return false;
    }
    const section=ensureSection(surface);if(!section)return false;
    const productId=productIdFromSurface(surface);
    const summary=section.querySelector?.('[data-sj-stock-summary="true"]');
    if(!productId){
      if(summary)summary.textContent='Belum diatur';
      section.dataset.productId='';
      section.dataset.state='empty';
      return true;
    }
    if(!force&&section.dataset.productId===productId&&section.dataset.state==='ready')return true;
    const requestId=++summaryRequestSeq;
    section.dataset.productId=productId;
    section.dataset.state='loading';
    if(summary)summary.textContent='Memuat…';
    openProduct(productId).then(model=>{
      if(requestId!==summaryRequestSeq||section.dataset.productId!==productId)return;
      if(summary)summary.textContent=model.summary;
      section.dataset.state='ready';
    }).catch(error=>{
      if(requestId!==summaryRequestSeq||section.dataset.productId!==productId)return;
      if(summary)summary.textContent='Tidak dapat dimuat';
      section.dataset.state='error';
      runtime?.console?.warn?.('[STOCK-COMP] product mapping read skipped',error);
    });
    return true;
  }

  const api=Object.freeze({
    installed:true,
    management,
    openProduct,
    saveProduct,
    openEditor,
    openStockItems,
    refresh,
    summary:summarizeProductStockComponents,
    snapshot:()=>Object.freeze({installed:true,management:management(),editorProductId:editorState?.productId||null})
  });
  try{Object.defineProperty(runtime,RUNTIME_KEY,{value:api,writable:false,configurable:false,enumerable:false});}catch(_){}
  return api;
}
