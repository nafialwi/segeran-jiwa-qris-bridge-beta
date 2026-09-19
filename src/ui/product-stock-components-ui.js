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
  if(rows.length>1)return `${rows.length} item stok`;
  const row=rows[0];
  const stockItemId=text(row.stockItemId);
  const name=text(stockItems?.[stockItemId]?.name)||stockItemId;
  return `${name} ×${formatQty(row.qtyPerUnit)}`;
}
function modelFrom(mapping,stockItems,productId){
  return Object.freeze({productId,mapping:mapping||{},stockItems:stockItems||{},summary:summarizeProductStockComponents(mapping,stockItems)});
}

export function installProductStockComponentsUi(runtime=globalThis,{document=runtime?.document,inventoryRepository=null,stockComponentWriter=null}={}){
  if(runtime?.[RUNTIME_KEY])return runtime[RUNTIME_KEY];
  let repository=inventoryRepository;
  let writer=stockComponentWriter;
  let editorState=null;
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
      getRepository().readProductStockComponents(id),getRepository().readStockItems()
    ]);
    return modelFrom(mapping,stockItems,id);
  }
  async function saveProduct(productId,rows){
    assertManager();
    const id=text(productId);if(!id)fail('STOCK_COMPONENT_PRODUCT_REQUIRED');
    const components=normalizeProductStockComponentRows(rows);
    const actor=actorOf(runtime);
    await getWriter().saveProductComponents({productId:id,components,actor});
    return Object.freeze({productId:id,components,actor});
  }
  function openStockItems(){
    assertManager();
    const workspace=runtime?.__SJ_V32_INVENTORY_WORKSPACE;
    if(typeof workspace?.legacyOpen==='function')return workspace.legacyOpen('ingredients');
    if(typeof runtime?.SJInventoryV2?.open==='function')return runtime.SJInventoryV2.open('ingredients');
    fail('STOCK_ITEM_MASTER_UNAVAILABLE');
  }
  function closeEditor(){
    const node=document?.querySelector?.('[data-sj-stock-components-editor="true"]');
    if(node?.parentNode?.removeChild)node.parentNode.removeChild(node);
    editorState=null;return true;
  }
  function optionMarkup(stockItems,selected=''){
    const current=text(selected);
    return Object.entries(stockItems||{}).map(([id,item])=>{
      const key=text(id),name=text(item?.name)||key;
      return `<option value="${esc(key)}"${key===current?' selected':''}>${esc(name)}</option>`;
    }).join('');
  }
  function rowMarkup(stockItems,row={}){
    const stockItemId=text(row.stockItemId);
    const qty=Number(row.qtyPerUnit)>0?Number(row.qtyPerUnit):1;
    return `<div class="sj-stock-component-row" data-sj-stock-row="true">
      <label>Item Stok<select data-sj-stock-item="true"><option value="">Pilih Item Stok</option>${optionMarkup(stockItems,stockItemId)}</select></label>
      <label>Qty / produk<input data-sj-stock-qty="true" type="number" min="0.0001" step="any" value="${esc(formatQty(qty))}"></label>
      <button type="button" data-sj-stock-remove="true">Hapus</button>
    </div>`;
  }
  function wireEditor(editor,model){
    const rowsHost=editor.querySelector?.('[data-sj-stock-rows="true"]');
    const wireRemove=button=>button?.addEventListener?.('click',()=>{
      const row=button.closest?.('[data-sj-stock-row="true"]');
      if(row?.parentNode?.removeChild)row.parentNode.removeChild(row);
    });
    editor.querySelectorAll?.('[data-sj-stock-remove="true"]')?.forEach?.(wireRemove);
    editor.querySelector?.('[data-sj-stock-add="true"]')?.addEventListener?.('click',()=>{
      if(!rowsHost)return;
      const holder=document.createElement('div');holder.innerHTML=rowMarkup(model.stockItems,{qtyPerUnit:1});
      const row=holder.firstElementChild;if(row)rowsHost.appendChild(row);wireRemove(row?.querySelector?.('[data-sj-stock-remove="true"]'));
    });
    editor.querySelector?.('[data-sj-stock-items-master="true"]')?.addEventListener?.('click',()=>openStockItems());
    editor.querySelector?.('[data-sj-stock-close="true"]')?.addEventListener?.('click',()=>closeEditor());
    editor.querySelector?.('[data-sj-stock-save="true"]')?.addEventListener?.('click',async()=>{
      try{
        const rows=[...(editor.querySelectorAll?.('[data-sj-stock-row="true"]')||[])].map(row=>({
          stockItemId:row.querySelector?.('[data-sj-stock-item="true"]')?.value,
          qtyPerUnit:row.querySelector?.('[data-sj-stock-qty="true"]')?.value
        }));
        await saveProduct(model.productId,rows);
        runtime?.showToast?.('Pemakaian stok tersimpan.','success');closeEditor();refresh();
      }catch(error){runtime?.showToast?.(error?.message||'Pemakaian stok gagal disimpan.','warning');}
    });
  }
  async function openEditor(productId){
    assertManager();
    const model=await openProduct(productId);editorState=model;
    if(!document?.body||typeof document?.createElement!=='function')return model;
    closeEditor();
    const editor=document.createElement('div');
    editor.dataset.sjStockComponentsEditor='true';editor.setAttribute?.('data-sj-stock-components-editor','true');
    editor.innerHTML=`<div class="sj-stock-components-editor-card">
      <div class="sj-stock-components-editor-head"><div><b>PEMAKAIAN STOK</b><small>Atur item fisik yang terpakai saat 1 produk terjual.</small></div><button type="button" data-sj-stock-close="true">Tutup</button></div>
      <div data-sj-stock-rows="true">${activeEntries(model.mapping).map(row=>rowMarkup(model.stockItems,row)).join('')}</div>
      <div class="sj-stock-components-editor-actions"><button type="button" data-sj-stock-add="true">+ Item Stok</button><button type="button" data-sj-stock-items-master="true">Item Stok</button><button type="button" data-sj-stock-save="true">Simpan</button></div>
    </div>`;
    document.body.appendChild(editor);wireEditor(editor,model);return model;
  }
  function ensureSection(surface){
    const existing=surface?.querySelector?.('[data-sj-stock-components="true"]');if(existing)return existing;
    if(typeof document?.createElement!=='function')return null;
    const section=document.createElement('section');
    section.dataset.sjStockComponents='true';section.setAttribute?.('data-sj-stock-components','true');
    section.innerHTML=`<div class="sj-stock-components-summary"><div><b>PEMAKAIAN STOK</b><small>Atur item fisik yang terpakai saat 1 produk terjual.</small></div><strong data-sj-stock-summary="true">Belum diatur</strong><button type="button" data-sj-stock-edit="true">Atur Pemakaian Stok</button><button type="button" data-sj-stock-master="true">Item Stok</button></div>`;
    surface.appendChild?.(section);
    section.querySelector?.('[data-sj-stock-edit="true"]')?.addEventListener?.('click',()=>{
      const productId=productIdFromSurface(surface);
      if(!productId){runtime?.showToast?.('Pilih produk terlebih dahulu.','warning');return;}
      openEditor(productId).catch(error=>runtime?.showToast?.(error?.message||'Pemakaian stok belum dapat dibuka.','warning'));
    });
    section.querySelector?.('[data-sj-stock-master="true"]')?.addEventListener?.('click',()=>{
      try{openStockItems();}catch(error){runtime?.showToast?.(error?.message||'Item Stok belum dapat dibuka.','warning');}
    });
    return section;
  }
  function refresh(){
    if(!document||!management())return false;
    const surface=document.querySelector?.('#modal-edit-master');if(!surface)return false;
    const section=ensureSection(surface);if(!section)return false;
    const productId=productIdFromSurface(surface),summary=section.querySelector?.('[data-sj-stock-summary="true"]');
    if(!productId){if(summary)summary.textContent='Belum diatur';section.dataset.productId='';return true;}
    if(section.dataset.productId===productId)return true;
    section.dataset.productId=productId;
    openProduct(productId).then(model=>{if(section.dataset.productId===productId&&summary)summary.textContent=model.summary;})
      .catch(error=>{if(summary)summary.textContent='Perlu perhatian';runtime?.console?.warn?.('[STOCK-COMP] product mapping read skipped',error);});
    return true;
  }
  const api=Object.freeze({
    installed:true,management,openProduct,saveProduct,openEditor,openStockItems,refresh,summary:summarizeProductStockComponents,
    snapshot:()=>Object.freeze({installed:true,management:management(),editorProductId:editorState?.productId||null})
  });
  try{Object.defineProperty(runtime,RUNTIME_KEY,{value:api,writable:false,configurable:false,enumerable:false});}catch(_){}
  return api;
}
