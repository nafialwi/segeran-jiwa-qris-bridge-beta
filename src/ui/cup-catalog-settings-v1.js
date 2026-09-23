const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const text=v=>String(v??'').trim();

export function renderCupCatalogSettingsV1(catalog=[],opts={}){
  const usageByCode=opts.usageByCode||(()=>0),readOnly=opts.readOnly===true,editing=opts.editing||null;
  const rows=(catalog||[]).map(row=>{
    const usage=Math.max(0,Number(usageByCode(row.code))||0),active=row.active!==false;
    return '<article class="sj-cup-catalog-row" data-cup-code="'+esc(row.code)+'">'
      +'<div class="sj-cup-catalog-row-main"><div><b>'+esc(row.name)+'</b><small>Kode: '+esc(row.code)+' · '+(row.builtin?'Bawaan':'Custom')+'</small></div>'
      +'<span class="'+(active?'is-on':'is-off')+'">'+(active?'Aktif':'Nonaktif')+'</span></div>'
      +'<div class="sj-cup-catalog-row-meta"><span>'+usage+' produk memakai Cup ini</span></div>'
      +'<div class="sj-cup-catalog-row-actions">'
      +'<button type="button" data-cup-edit="'+esc(row.code)+'"'+(readOnly?' disabled':'')+'>Edit</button>'
      +'<button type="button" data-cup-toggle="'+esc(row.code)+'" data-next-active="'+(active?'0':'1')+'"'+(readOnly?' disabled':'')+'>'+(active?'Nonaktifkan':'Aktifkan')+'</button>'
      +'</div></article>';
  }).join('');

  let editor='';
  if(editing){
    editor='<section class="sj-cup-catalog-editor" data-cup-editor>'
      +'<header><div><small>'+(editing.isNew?'Tambah Jenis Cup':'Edit Jenis Cup')+'</small><h3>'+(editing.isNew?'Cup baru':esc(editing.name))+'</h3></div><button type="button" data-cup-editor-close aria-label="Tutup">×</button></header>'
      +'<label><span>Kode internal</span><input data-cup-field="code" value="'+esc(editing.code||'')+'" '+(editing.isNew?'':'disabled')+' maxlength="24" placeholder="contoh: cup24"></label>'
      +'<small class="sj-cup-catalog-help">Kode menjadi identitas permanen setelah disimpan. Gunakan huruf kecil/angka, misalnya <b>cup24</b>.</small>'
      +'<label><span>Nama Cup</span><input data-cup-field="name" value="'+esc(editing.name||'')+'" maxlength="64" placeholder="contoh: Cup 24 Oz Datar"></label>'
      +'<div class="sj-cup-catalog-editor-actions"><button type="button" data-cup-editor-cancel>Batal</button><button type="button" class="sjx-primary" data-cup-editor-save'+(readOnly?' disabled':'')+'>Simpan</button></div>'
      +'</section>';
  }

  const activeCount=(catalog||[]).filter(x=>x.active!==false).length,inactiveCount=(catalog||[]).filter(x=>x.active===false).length;
  return '<section class="sj-cup-catalog-page" data-cup-catalog-page>'
    +'<header class="sj-cup-catalog-head"><div><small>Pengaturan · Owner</small><h2>Cup Control</h2><p>Kelola jenis Cup yang tersedia untuk produk dan operasional shift.</p></div><button type="button" data-cup-catalog-close aria-label="Tutup">×</button></header>'
    +'<div class="sj-cup-catalog-body">'
    +'<section class="sj-cup-catalog-summary"><span><b>'+activeCount+'</b><small>Aktif</small></span><span><b>'+inactiveCount+'</b><small>Nonaktif</small></span><span><b>'+catalog.length+'</b><small>Total jenis</small></span></section>'
    +'<aside class="sj-cup-catalog-note"><b>Satu sumber Cup</b><span>Daftar ini dipakai oleh Edit Produk, Mapping Kategori, Opening, Restock, Closing, dan Riwayat Cup. Cup nonaktif tetap dipertahankan untuk histori.</span></aside>'
    +'<button type="button" class="sj-cup-catalog-add sjx-primary" data-cup-add'+(readOnly?' disabled':'')+'>+ Tambah Jenis Cup</button>'
    +'<div class="sj-cup-catalog-list">'+(rows||'<div class="sj-cup-catalog-empty">Belum ada jenis Cup.</div>')+'</div></div>'
    +editor+'</section>';
}

export function installCupCatalogSettingsV1(runtime=globalThis,{catalogService,notify=(message,kind='info')=>runtime?.showToast?.(message,kind)}={}){
  if(runtime?.__SJ_CUP_CATALOG_SETTINGS_V1)return runtime.__SJ_CUP_CATALOG_SETTINGS_V1;
  const document=runtime?.document;
  if(!document||!catalogService)return Object.freeze({installed:false});
  let overlay=null,editing=null,bound=false;
  const all=()=>catalogService.catalog({includeInactive:true});
  function render(){
    if(!overlay)return false;
    overlay.innerHTML=renderCupCatalogSettingsV1(all(),{usageByCode:code=>catalogService.productUsage(code),readOnly:catalogService.readOnly,editing});
    bind();return true;
  }
  function close(){if(overlay)overlay.style.display='none';editing=null}
  async function open(){
    if(!overlay){overlay=document.createElement('div');overlay.className='overlay sj-cup-catalog-overlay';overlay.id='sj-cup-catalog-overlay';document.body?.appendChild?.(overlay)}
    overlay.style.display='flex';
    await catalogService.ready.catch(()=>{});
    await catalogService.refresh().catch(()=>{});
    render();return true;
  }
  function startEdit(code){const row=all().find(x=>x.code===code);if(!row)return false;editing={isNew:false,code:row.code,name:row.name};render();return true}
  function startAdd(){editing={isNew:true,code:'',name:''};render();return true}
  async function saveEditor(){
    const code=text(overlay?.querySelector?.('[data-cup-field="code"]')?.value).toLowerCase(),name=text(overlay?.querySelector?.('[data-cup-field="name"]')?.value),btn=overlay?.querySelector?.('[data-cup-editor-save]');
    if(btn)btn.disabled=true;
    try{
      await catalogService.saveItem({originalCode:editing?.isNew?'':editing?.code,code,name,active:true});
      notify('Jenis Cup tersimpan.','success');editing=null;render();return true;
    }catch(e){
      const map={CUP_CATALOG_CODE_INVALID:'Kode Cup tidak valid. Gunakan huruf kecil/angka tanpa spasi.',CUP_CATALOG_CODE_IMMUTABLE:'Kode Cup tidak dapat diubah setelah dibuat.',CUP_CATALOG_NAME_INVALID:'Nama Cup belum valid.',CUP_CATALOG_NAME_DUPLICATE:'Nama Cup sudah digunakan.',LOCAL_QA_READ_ONLY:'Mode UAT read-only tidak mengizinkan perubahan.'};
      notify(map[e?.code]||e?.message||'Jenis Cup belum dapat disimpan.','error');if(btn?.isConnected)btn.disabled=false;return false;
    }
  }
  async function toggle(code,active){
    try{await catalogService.setActive(code,active);notify(active?'Jenis Cup diaktifkan.':'Jenis Cup dinonaktifkan.','success');render();return true}
    catch(e){notify(e?.code==='CUP_CATALOG_STILL_MAPPED'?'Cup masih dipakai oleh produk aktif. Ubah mapping produk terlebih dahulu.':e?.message||'Status Cup belum dapat diubah.','error');return false}
  }
  function bind(){
    if(!overlay)return;
    overlay.querySelector?.('[data-cup-catalog-close]')?.addEventListener?.('click',close);
    overlay.querySelector?.('[data-cup-add]')?.addEventListener?.('click',startAdd);
    overlay.querySelector?.('[data-cup-editor-close]')?.addEventListener?.('click',()=>{editing=null;render()});
    overlay.querySelector?.('[data-cup-editor-cancel]')?.addEventListener?.('click',()=>{editing=null;render()});
    overlay.querySelector?.('[data-cup-editor-save]')?.addEventListener?.('click',saveEditor);
    overlay.querySelectorAll?.('[data-cup-edit]')?.forEach?.(button=>button.addEventListener?.('click',()=>startEdit(button.dataset.cupEdit)));
    overlay.querySelectorAll?.('[data-cup-toggle]')?.forEach?.(button=>button.addEventListener?.('click',()=>toggle(button.dataset.cupToggle,button.dataset.nextActive==='1')));
  }
  if(!bound){bound=true;document.addEventListener?.('sj:cup-catalog-changed',()=>{if(overlay?.style?.display!=='none')render()})}
  const api=Object.freeze({installed:true,open,close,render});
  try{Object.defineProperty(runtime,'__SJ_CUP_CATALOG_SETTINGS_V1',{value:api,writable:false,configurable:false})}catch(_){}
  return api;
}
