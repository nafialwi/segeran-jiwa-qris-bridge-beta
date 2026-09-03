import { SETTINGS_LAYOUT } from './refinement-visual-contract.js';
import { renderIcon } from './icons.js';

const esc=(v)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const initials=(name)=>String(name||'Owner Utama').trim().split(/\s+/).map(x=>x[0]).join('').slice(0,2).toUpperCase()||'OU';

function itemMarkup(item,layout){
  const compact=layout.includes('compact');
  const cls=compact?'sjr01-setting-card sjr01-setting-card--compact':'sjr01-setting-card sjr01-setting-card--wide';
  return `<button type="button" class="${cls}" data-ref01-feature="${esc(item.feature)}"><span class="sjr01-setting-icon">${renderIcon(item.icon,{size:compact?26:30,label:item.label})}</span><span class="sjr01-setting-copy"><b>${esc(item.label)}</b><small>${esc(item.note)}</small></span>${compact?'':`<span class="sjr01-setting-chevron">${renderIcon('chevron',{size:17})}</span>`}</button>`;
}

function groupMarkup(name,group){
  if(name==='Zona Sensitif'){
    return `<section class="sjr01-settings-section sjr01-settings-section--sensitive"><div class="sjr01-sensitive-separator"><span>${renderIcon('shield-alert',{size:16})} Zona Sensitif</span></div><div class="sjr01-grid sjr01-grid--danger-full-width" data-ref01-layout="danger-full-width">${group.items.map(x=>itemMarkup(x,group.layout)).join('')}</div></section>`;
  }
  return `<section class="sjr01-settings-section"><h2>${esc(name)}</h2><div class="sjr01-grid sjr01-grid--${esc(group.layout)}" data-ref01-layout="${esc(group.layout)}">${group.items.map(x=>itemMarkup(x,group.layout)).join('')}</div></section>`;
}

export function renderSettingsMarkup({name='Owner Utama',roleLabel='Owner / Pemilik',photoURL='',synced=true,syncLabel='Hari ini'}={}){
  const avatar=photoURL?`<img src="${esc(photoURL)}" alt="Foto profil ${esc(name)}">`:`<span>${esc(initials(name))}</span>`;
  const remove=photoURL?`<button type="button" class="sjr01-profile-remove" data-ref01-profile="remove" aria-label="Hapus foto profil">${renderIcon('trash',{size:12})}</button>`:'';
  return `<main class="sjr01-settings-page"><header class="sjr01-settings-header"><div><h1>Pengaturan</h1><p>Kelola toko, pengguna, dan sistem POS Anda</p></div><button type="button" class="sjr01-help" data-ref01-help="settings" aria-label="Bantuan">?</button></header><section class="sjr01-profile-card" data-ref01-feature="settings.account"><div class="sjr01-profile-photo" data-ref01-profile="choose">${avatar}<span class="sjr01-profile-camera">${renderIcon('camera',{size:14})}</span>${remove}<input id="sj-ref-profile-file" type="file" accept="image/*" hidden></div><div class="sjr01-profile-copy"><h2>${esc(name)}</h2><span class="sjr01-role-chip">${renderIcon('crown',{size:15})}${esc(roleLabel)}</span><p class="sjr01-sync ${synced?'is-synced':'is-offline'}">${renderIcon(synced?'check-circle':'offline',{size:16})}${synced?'Akun aman & tersinkronisasi':'Mode offline • sesi tetap tersimpan'}</p><small>Terakhir sinkronisasi: ${esc(syncLabel)}</small></div><span class="sjr01-profile-chevron">${renderIcon('chevron',{size:22})}</span></section>${Object.entries(SETTINGS_LAYOUT).filter(([name])=>name!=='logout').map(([name,group])=>groupMarkup(name,group)).join('')}<button type="button" class="sjr01-settings-logout" data-ref01-feature="ref01.logout">${renderIcon(SETTINGS_LAYOUT.logout.icon,{size:21})}<span>Keluar</span></button></main>`;
}
