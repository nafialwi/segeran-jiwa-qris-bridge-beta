import { enhanceBottomNav } from '../ui/bottom-nav.js';
import { SCREEN_FAMILIES, IMPLICIT_CAPABILITIES } from '../ui/refinement-contract.js';
import { renderIcon } from '../ui/icons.js';
import { createMediaLifecycle } from '../ui/media-lifecycle.js';
import { createBrowserJsonStore } from '../data/local-store.js';
import { createStaleShiftAdapter, shiftPresentation } from '../ui/shift-refinement.js';
import { tagScreenContracts } from '../ui/screen-contracts.js';
import { renderSettingsMarkup } from '../ui/settings-refinement.js';
import { REFERENCE_MATRIX } from '../ui/refinement-visual-contract.js';
import { installRefinementIconAuthority } from '../ui/icon-authority.js';
import { installReportRefinement } from '../ui/report-refinement.js';
import { installNotificationRefinement } from '../ui/notification-refinement.js';
import { reconcileRoleNavigation } from '../ui/role-nav-refinement.js';
import { reconcileTransactionSurfaces } from '../ui/transaction-detail-refinement.js';
import { decorateCriticalOperationalSurfaces } from '../ui/critical-operational-refinement.js';
import { decorateStockReferenceSurface } from '../ui/stock-refinement.js';
import { installSalesShiftUxRefinement } from '../ui/sales-shift-ux-refinement.js';
import { installLegacyShiftCloseRecovery } from '../ui/legacy-shift-close-recovery.js';
import { installSalesHistoryRefinement } from '../ui/report-sales-history-refinement.js';
import { installFinishedGoodsWarehouseRefinement } from '../ui/finished-goods-warehouse-refinement.js';
import { installProductionSalesStability, installManualSyncControls } from '../ui/production-sales-stability.js';

const OWNER='ref01-ui-runtime';

function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function notify(runtime,message,kind='info'){try{if(typeof runtime?.showToast==='function') return runtime.showToast(message,kind)}catch(_){}try{runtime?.console?.info?.(`[REF01/${kind}] ${message}`)}catch(_){} }
function getAuth(runtime){try{return runtime?.SJProductionArchitectureP3?.auth?.()??runtime?.firebase?.auth?.()??null}catch(_){return null}}
function getImageAuthority(runtime){return runtime?.SJProductionArchitectureP3??null}
function profileIdentity(runtime,sc04){
  try{const username=sc04?.session?.snapshot?.()?.envelope?.username;if(username)return String(username).trim().toLowerCase()}catch(_){}
  try{const uid=getAuth(runtime)?.currentUser?.uid;if(uid)return `uid-${String(uid)}`}catch(_){}
  return `name-${accountName(runtime).trim().toLowerCase()}`;
}
function profileAvatarStore(runtime,sc04){
  try{return createBrowserJsonStore({runtime,key:`segeran-jiwa.profile-avatar.v1.${encodeURIComponent(profileIdentity(runtime,sc04))}`})}catch(_){return null}
}

function installStyle(document){
  if(!document?.head||document.querySelector?.('link[data-sj-ref01-style="true"]')) return false;
  const link=document.createElement('link');link.rel='stylesheet';link.href='./src/ui/ref01.css';link.dataset.sjRef01Style='true';document.head.appendChild(link);return true;
}
function currentRoute(sc03){try{return sc03?.state?.snapshot?.().primary||'home'}catch(_){return'home'}}
function currentRole(sc03){try{return sc03?.guard?.currentRole?.()||null}catch(_){return null}}

function accountName(runtime){
  try{const value=runtime?.SJAccountV5964?.displayName?.();if(value)return String(value)}catch(_){}
  return String(getAuth(runtime)?.currentUser?.displayName||runtime?.currentUserName||'Owner Utama');
}
function syncLabel(runtime){
  try{if(runtime?.SJProductionArchitectureP3?.serverConnected===false||runtime?.navigator?.onLine===false)return 'Menunggu koneksi'}catch(_){}
  try{return new Intl.DateTimeFormat('id-ID',{hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'Asia/Jakarta'}).format(new Date())}catch(_){return 'Hari ini'}
}
function renderSettingsLanding(document,runtime,sc03,media,openFeature,{force=false}={}){
  const root=document?.getElementById?.('mst-menu-view');if(!root||currentRole(sc03)!=='owner') return false;
  if(root.dataset?.ref01Settings==='true'&&!force&&root.querySelector?.('.sjr01-settings-page')) return false;
  const photo=media.currentPhoto();
  const online=runtime?.navigator?.onLine!==false&&runtime?.SJProductionArchitectureP3?.serverConnected!==false;
  root.dataset.ref01Settings='true';
  root.innerHTML=renderSettingsMarkup({name:accountName(runtime),roleLabel:'Owner / Pemilik',photoURL:photo,synced:online,syncLabel:online?`Hari ini ${syncLabel(runtime)}`:'Menunggu koneksi'});
  if(root.dataset.ref01Events!=='true'){
    root.dataset.ref01Events='true';
    root.addEventListener?.('click',event=>{
      const photoTarget=event.target?.closest?.('[data-ref01-profile]');
      if(photoTarget){
        event.preventDefault?.();
        if(photoTarget.dataset?.ref01Profile==='remove'){
          media.removeProfilePhoto().then(()=>{renderSettingsLanding(document,runtime,sc03,media,openFeature,{force:true});enhanceProfileAvatars(document,runtime,media);notify(runtime,'Foto profil dihapus.','success')}).catch(e=>notify(runtime,e.message||'Gagal menghapus foto profil.','error'));
        }else document.getElementById('sj-ref-profile-file')?.click?.();
        return;
      }
      const featureTarget=event.target?.closest?.('[data-ref01-feature]');
      if(featureTarget){event.preventDefault?.();openFeature(featureTarget.dataset.ref01Feature)}
    });
  }
  const input=document.getElementById?.('sj-ref-profile-file');
  if(input&&input.dataset?.ref01Bound!=='true'){
    input.dataset.ref01Bound='true';
    input.addEventListener?.('change',async event=>{
      const file=event.target.files?.[0];if(!file)return;
      try{await media.saveProfilePhoto(file);renderSettingsLanding(document,runtime,sc03,media,openFeature,{force:true});enhanceProfileAvatars(document,runtime,media);notify(runtime,'Foto profil diperbarui.','success')}
      catch(e){notify(runtime,e.message||'Gagal memperbarui foto profil.','error')}
    });
  }
  return true;
}
function openAvatarActions(document,runtime,media,onChanged){
  let panel=document?.getElementById?.('sj-ref-avatar-actions');
  if(!panel){
    panel=document?.createElement?.('div');if(!panel)return false;
    panel.id='sj-ref-avatar-actions';panel.className='overlay';
    panel.innerHTML=`<div class="modal sj-ref-avatar-modal"><div class="modal-title">Foto Profil</div><p>Gunakan foto akun saat ini atau kembali ke inisial.</p><div class="sj-ref-media-actions"><button type="button" data-ref01-avatar-action="upload">Upload / Ganti Foto</button><button type="button" data-ref01-avatar-action="initials">Gunakan Inisial</button><button type="button" data-ref01-avatar-action="close">Batal</button></div><input id="sj-ref-avatar-file" type="file" accept="image/*" hidden></div>`;
    document.body?.appendChild?.(panel);
    const input=panel.querySelector?.('#sj-ref-avatar-file');
    panel.addEventListener?.('click',event=>{
      const action=event.target?.dataset?.ref01AvatarAction;
      if(action==='upload') input?.click?.();
      if(action==='initials') media.removeProfilePhoto().then(()=>{panel.style.display='none';onChanged?.();notify(runtime,'Foto profil dihapus. Inisial digunakan.','success')}).catch(e=>notify(runtime,e.message||'Gagal menghapus foto profil.','error'));
      if(action==='close'||event.target===panel) panel.style.display='none';
    });
    input?.addEventListener?.('change',async event=>{const file=event.target.files?.[0];if(!file)return;try{await media.saveProfilePhoto(file);panel.style.display='none';onChanged?.();notify(runtime,'Foto profil diperbarui.','success')}catch(e){notify(runtime,e.message||'Gagal memperbarui foto profil.','error')}finally{event.target.value=''}});
  }
  panel.style.display='flex';return true;
}
function enhanceProfileAvatars(document,runtime,media){
  const photo=media.currentPhoto();
  const nodes=Array.from(document?.querySelectorAll?.('.sjvc01-avatar,.sjui02-avatar,.sj5964-avatar')||[]);
  let changed=0;
  for(const node of nodes){
    if(!node)continue;
    if(photo&&node.dataset?.ref01Photo!==photo){node.dataset.ref01Photo=photo;node.innerHTML=`<img src="${esc(photo)}" alt="Foto profil ${esc(accountName(runtime))}">`;changed++}
    else if(!photo&&node.dataset?.ref01Photo){delete node.dataset.ref01Photo;node.innerHTML=esc(accountName(runtime).trim().split(/\s+/).map(x=>x[0]).join('').slice(0,2).toUpperCase()||'U');changed++}
    if(node.dataset?.ref01AvatarBound!=='true'){
      node.dataset.ref01AvatarBound='true';node.setAttribute?.('role','button');node.setAttribute?.('tabindex','0');node.setAttribute?.('aria-label','Ubah foto profil');
      const open=e=>{e?.preventDefault?.();e?.stopPropagation?.();openAvatarActions(document,runtime,media,()=>enhanceProfileAvatars(document,runtime,media))};
      node.addEventListener?.('click',open);node.addEventListener?.('keydown',e=>{if(e?.key==='Enter'||e?.key===' '){e.preventDefault?.();open(e)}});changed++;
    }
  }
  const cashierProfiles=Array.from(document?.querySelectorAll?.('.sjvc01-cashier .sjvc01-profile,.sjui02-cashier .sjui02-profile')||[]);
  for(const profile of cashierProfiles){
    if(profile.dataset?.ref01Account==='true')continue;
    profile.dataset.ref01Account='true';profile.setAttribute?.('role','button');profile.setAttribute?.('tabindex','0');profile.setAttribute?.('aria-label','Akun Saya');
    const open=e=>{e?.preventDefault?.();runtime?.SJAccountV5964?.open?.()};
    profile.addEventListener?.('click',open);profile.addEventListener?.('keydown',e=>{if(e?.key==='Enter'||e?.key===' '){e.preventDefault?.();open(e)}});changed++;
  }
  return changed;
}
function renderInfoPanel(document,{title,message,rows=[],actions=[]}={}){
  let panel=document.getElementById?.('sj-ref-info-panel');if(!panel){panel=document.createElement?.('div');if(!panel)return false;panel.id='sj-ref-info-panel';panel.className='overlay';panel.innerHTML='<div class="modal"><div class="modal-title" id="sj-ref-info-title"></div><div id="sj-ref-info-body"></div><button type="button" class="btn-act" id="sj-ref-info-close">TUTUP</button></div>';document.body?.appendChild?.(panel);document.getElementById('sj-ref-info-close')?.addEventListener?.('click',()=>{panel.style.display='none'})}
  const t=document.getElementById('sj-ref-info-title'),body=document.getElementById('sj-ref-info-body');if(t)t.textContent=title||'Informasi';if(body){body.innerHTML=`<p style="font-size:11px;color:#66776d">${esc(message||'')}</p>${rows.map(r=>`<div style="padding:8px 0;border-bottom:1px solid #e5ebe7;font-size:10px"><b>${esc(r[0])}</b><span style="float:right">${esc(r[1])}</span></div>`).join('')}${actions.length?`<div class="sj-ref-media-actions">${actions.map((a,i)=>`<button type="button" data-ref01-info-action="${i}">${esc(a.label)}</button>`).join('')}</div>`:''}`;body.querySelectorAll?.('[data-ref01-info-action]')?.forEach?.(button=>button.addEventListener?.('click',()=>actions[Number(button.dataset.ref01InfoAction)]?.run?.()))}panel.style.display='flex';return true;
}
function installConnectivityBanner(document,runtime){
  const app=document?.getElementById?.('app-wrapper');if(!app)return false;let banner=document.getElementById?.('sj-ref-connectivity');if(!banner){banner=document.createElement('div');banner.id='sj-ref-connectivity';banner.className='sj-ref-connectivity';banner.innerHTML=`${renderIcon('activity',{size:17})}<span>Menghubungkan kembali… sesi Anda tetap tersimpan dan akan divalidasi saat Firebase kembali online.</span>`;app.insertBefore(banner,app.firstChild)}
  let disconnected=runtime?.navigator?.onLine===false;try{if(runtime?.SJProductionArchitectureP3&&runtime.SJProductionArchitectureP3.serverConnected===false)disconnected=true}catch(_){}banner.classList?.toggle?.('show',disconnected);return true;
}
function enhanceImageRemove(document){
  const targets=[['new-i','new-img-preview'],['edit-m-i','edit-img-preview'],['sjmux-q-img','sjmux-q-preview'],['set-logo-val','set-logo-preview'],['set-qris-val','set-qris-preview']];let count=0;
  for(const [hiddenId,previewId] of targets){const hidden=document?.getElementById?.(hiddenId);if(!hidden||hidden.dataset?.ref01Remove==='true')continue;hidden.dataset.ref01Remove='true';const preview=document.getElementById(previewId);const host=hidden.parentElement||preview?.parentElement;if(!host?.appendChild)continue;const wrap=document.createElement('div');wrap.className='sj-ref-media-actions';const button=document.createElement('button');button.type='button';button.textContent='Hapus foto';button.addEventListener('click',()=>{hidden.value='';if(preview){preview.src='';preview.style.display='none'}notify(globalThis,'Foto akan dihapus saat perubahan disimpan.','info')});wrap.appendChild(button);host.appendChild(wrap);count++}
  return count;
}
function enhanceScanner(document,sc03){
  const wrap=document?.querySelector?.('.sj-search-wrap');if(!wrap||document.getElementById?.('sj-ref-scan'))return false;const btn=document.createElement('button');btn.id='sj-ref-scan';btn.type='button';btn.className='sj-ref-scan-btn';btn.setAttribute('aria-label','Scan barcode atau SKU');btn.innerHTML=`${renderIcon('camera',{size:18})}<span>Scan</span>`;btn.addEventListener('click',()=>{const f=sc03?.features?.get?.('sales.barcode');if(f?.open)return f.open()});wrap.parentElement?.appendChild?.(btn);return true;
}
function enhanceTransferDraft(document){
  const modal=document?.querySelector?.('#modal-bayar .modal');if(!modal||document.getElementById?.('sj-ref-transfer-draft'))return false;const box=document.createElement('div');box.id='sj-ref-transfer-draft';box.className='sj-ref-transfer-draft';box.style.display='none';box.innerHTML=`<strong>Lampiran bukti transfer</strong><span>Opsional untuk pengecekan operator. REF-01 belum menyimpan lampiran ke transaksi sampai writer evidence existing tersedia.</span><div class="sj-ref-media-actions"><button type="button" data-ref01-transfer="choose">Pilih foto</button><button type="button" data-ref01-transfer="remove">Hapus</button></div><input id="sj-ref-transfer-file" type="file" accept="image/*" hidden><img id="sj-ref-transfer-preview" class="sj-ref-photo-draft-preview" alt="Preview bukti transfer">`;const payButton=modal.querySelector?.('.btn-pay[onclick="processTransaction()"]');modal.insertBefore?.(box,payButton||null);const input=box.querySelector?.('#sj-ref-transfer-file'),preview=box.querySelector?.('#sj-ref-transfer-preview');box.addEventListener?.('click',event=>{const action=event.target?.dataset?.ref01Transfer;if(action==='choose')input?.click?.();if(action==='remove'){if(input)input.value='';if(preview){preview.src='';preview.style.display='none'}}});input?.addEventListener?.('change',event=>{const file=event.target.files?.[0];if(!file||!String(file.type||'').startsWith('image/'))return;const reader=new FileReader();reader.onload=e=>{preview.src=String(e.target?.result||'');preview.style.display='block'};reader.readAsDataURL(file)});return true;
}
function syncTransferDraft(document){const box=document?.getElementById?.('sj-ref-transfer-draft'),tf=document?.getElementById?.('btn-tf');if(box)box.style.display=tf?.classList?.contains?.('active')?'block':'none'}
function tagSemanticScreens(document){
  tagScreenContracts(document);
  const report=document?.getElementById?.('view3');if(report){report.classList?.add?.('sj-ref-report-semantic');report.dataset.ref01Report='true'}
  const title=document?.getElementById?.('sjpro-page-title');if(title&&/manajemen/i.test(title.textContent||''))title.textContent='Pengaturan';
}
function addStaleShiftAction(document,shiftAdapter){
  const rows=Array.from(document?.querySelectorAll?.('[data-shift-key]')||[]);let changed=0;for(const row of rows){const key=row.dataset?.shiftKey;if(!key||row.querySelector?.('[data-ref01-stale]'))continue;const text=String(row.textContent||'').toLowerCase();if(!/aktif|open/.test(text))continue;let model=null;try{model=shiftPresentation({key,data:{shiftStatus:'ACTIVE'},now:new Date()})}catch(_){continue}if(!model.overdue)continue;const box=document.createElement('div');box.className='sj-ref-overdue';box.dataset.ref01Stale='true';box.innerHTML=`<b>Shift lama masih terbuka</b><span>${esc(key)} · Rekonsiliasi perlu diselesaikan Owner.</span><button type="button">Buka Closing</button>`;box.querySelector('button')?.addEventListener('click',event=>{event.stopPropagation?.();shiftAdapter.openClosing(key)});row.insertAdjacentElement?.('afterend',box);changed++}return changed;
}

export function installRef01Runtime(runtime=globalThis,{sc03=runtime?.__SJ_SC03_RUNTIME,sc04=runtime?.__SJ_SC04_RUNTIME,observe=false}={}){
  if(runtime?.__SJ_REF01_RUNTIME) return runtime.__SJ_REF01_RUNTIME;
  if(!sc03) throw new Error('REF01_SC03_RUNTIME_REQUIRED');if(!sc04) throw new Error('REF01_SC04_RUNTIME_REQUIRED');
  const document=runtime?.document??null;installStyle(document);installRefinementIconAuthority(runtime);installReportRefinement(runtime);const notificationRefinement=installNotificationRefinement(runtime);
  const media=createMediaLifecycle({imageAuthority:getImageAuthority(runtime),auth:getAuth(runtime),avatarStore:profileAvatarStore(runtime,sc04)});const shift=createStaleShiftAdapter(runtime);const legacyShiftClose=installLegacyShiftCloseRecovery(runtime);const salesShiftUx=installSalesShiftUxRefinement(runtime,{shiftAdapter:shift});const productionSales=installProductionSalesStability(runtime);const manualSync=installManualSyncControls(runtime);const salesHistory=installSalesHistoryRefinement(runtime);const finishedWarehouse=installFinishedGoodsWarehouseRefinement(runtime);
  const backupActions=Object.freeze({
    backup:()=>typeof runtime?.backupDatabase==='function'?runtime.backupDatabase():notify(runtime,'Backup existing tidak tersedia pada runtime ini.','warning'),
    restore:()=>document?.getElementById?.('restore-file')?.click?.()??notify(runtime,'Restore existing tidak tersedia pada runtime ini.','warning')
  });
  function openFeature(key){
    if(key==='ref01.appearance'){if(typeof runtime?.SJMobileUX?.openSettings==='function')return runtime.SJMobileUX.openSettings();return renderInfoPanel(document,{title:'Tampilan Aplikasi',message:'REF-01 mengikuti perangkat secara responsif. Kepadatan komponen menjaga target sentuh minimal 44px.',rows:[['Mobile','320 / 390 / 430'],['Tablet','≥ 768px'],['Desktop','≥ 1200px']]})}
    if(key==='ref01.security'){const s=sc04?.session?.snapshot?.()||{};return renderInfoPanel(document,{title:'Keamanan & Sinkronisasi',message:'Session Manager SC-04 adalah authority sesi.',rows:[['Session',s.envelope?'Tersimpan':'Tidak tersimpan'],['Koneksi',runtime?.navigator?.onLine===false?'Offline':'Online']]})}
    if(key==='ref01.backup') return renderInfoPanel(document,{title:'Backup & Restore',message:'Semua aksi memakai authority existing. Restore tetap membutuhkan guard Owner dan file backup terverifikasi.',rows:[['Backup','Unduh snapshot database existing'],['Restore','Pilih file JSON untuk restore existing']],actions:[{label:'Backup sekarang',run:backupActions.backup},{label:'Pilih file restore',run:backupActions.restore}]});
    if(key==='ref01.sensitive'){if(typeof runtime?.openModalHapusGranular==='function')return runtime.openModalHapusGranular();return notify(runtime,'Aksi data sensitif tidak tersedia pada runtime ini.','warning')}
    if(key==='ref01.logout'){if(typeof runtime?.SJAccountV5964?.logout==='function')return runtime.SJAccountV5964.logout();if(typeof runtime?.SJProductionArchitectureP3?.logout==='function')return runtime.SJProductionArchitectureP3.logout();return notify(runtime,'Logout existing tidak tersedia pada runtime ini.','warning')}
    const feature=sc03?.features?.get?.(key);if(feature?.open)return feature.open();return notify(runtime,'Fitur belum tersedia pada runtime ini.','warning');
  }
  function enhance(){
    if(!document)return false;const route=currentRoute(sc03),role=currentRole(sc03);enhanceBottomNav(document,route);reconcileRoleNavigation(document,runtime,role);tagSemanticScreens(document);installConnectivityBanner(document,runtime);renderSettingsLanding(document,runtime,sc03,media,openFeature);enhanceProfileAvatars(document,runtime,media);enhanceImageRemove(document);enhanceScanner(document,sc03);enhanceTransferDraft(document);syncTransferDraft(document);addStaleShiftAction(document,shift);salesShiftUx?.enhance?.();productionSales?.sortProducts?.([]);manualSync?.enhance?.();notificationRefinement?.syncUnreadBadge?.();salesHistory?.enhance?.();finishedWarehouse?.enhance?.();decorateCriticalOperationalSurfaces(document,runtime);decorateStockReferenceSurface(document);reconcileTransactionSurfaces(document);document.documentElement&&(document.documentElement.dataset.sjRef01='true');return true;
  }
  let enhanceScheduled=false;function scheduleEnhance(){if(enhanceScheduled)return;enhanceScheduled=true;const run=()=>{enhanceScheduled=false;try{enhance()}catch(_){}};if(typeof runtime?.requestAnimationFrame==='function')runtime.requestAnimationFrame(run);else setTimeout(run,0)}
  let observer=null;if(observe&&document&&typeof runtime?.MutationObserver==='function'){observer=new runtime.MutationObserver(scheduleEnhance);observer.observe(document.documentElement||document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style']})}
  runtime?.addEventListener?.('online',scheduleEnhance);runtime?.addEventListener?.('offline',scheduleEnhance);
  const api=Object.freeze({phase:'REF-01',owner:OWNER,sc03,sc04,media,shift,legacyShiftClose,salesShiftUx,productionSales,manualSync,salesHistory,finishedWarehouse,backupActions,openFeature,enhance,scheduleEnhance,stop:()=>observer?.disconnect?.(),snapshot:()=>Object.freeze({phase:'REF-01',owner:OWNER,familyCount:SCREEN_FAMILIES.length,families:SCREEN_FAMILIES,implicitCapabilities:IMPLICIT_CAPABILITIES,referenceCoverage:Object.keys(REFERENCE_MATRIX),route:currentRoute(sc03)})});
  Object.defineProperty(runtime,'__SJ_REF01_RUNTIME',{value:api,writable:false,configurable:false,enumerable:false});
  try{enhance()}catch(error){runtime?.console?.warn?.('[REF01] initial enhancement skipped',error)}
  return api;
}
