function norm(v){return String(v??'').toLowerCase()}

export function classifyNotificationText(text){
  const value=norm(text);
  if(/qris|pembayaran|payment/.test(value)) return 'qris';
  if(/stok|restock|hutang|jatuh tempo|perlu|gagal|error|peringatan|warning/.test(value)) return 'action';
  if(/backup|restore|sinkron|password|keamanan|aktivitas|riwayat|login|logout/.test(value)) return 'history';
  return 'all';
}

function ensureTabs(document,modal){
  if(!document||!modal||modal.querySelector?.('.sjr06-notif-tabs')) return null;
  const tabs=document.createElement?.('div');
  if(!tabs) return null;
  tabs.className='sjr06-notif-tabs';
  tabs.setAttribute?.('role','tablist');
  const defs=[['all','Semua'],['action','Perlu Tindakan'],['qris','QRIS'],['history','Riwayat']];
  for(const [kind,label] of defs){
    const button=document.createElement('button');
    button.type='button';
    button.dataset.ref01NotifFilter=kind;
    button.textContent=label;
    if(kind==='all') button.classList?.add?.('active');
    tabs.appendChild(button);
  }
  const anchor=modal.querySelector?.('.sjx-note-list')||modal.querySelector?.('.modal-title')?.nextSibling||modal.firstChild;
  if(anchor&&anchor.parentNode===modal) modal.insertBefore(tabs,anchor);
  else modal.insertBefore?.(tabs,modal.firstChild||null);
  return tabs;
}

function decorateRows(modal){
  const rows=Array.from(modal?.querySelectorAll?.('.sjx-note-row')||[]);
  for(const row of rows){
    const kind=classifyNotificationText(row.textContent||'');
    row.dataset.ref01NotifKind=kind;
    row.classList?.add?.('sjr06-notif-row');
    if(/baru|belum dibaca|unread/i.test(String(row.className||'')+' '+String(row.textContent||''))) row.dataset.ref01Unread='true';
  }
  return rows;
}

export function decorateNotificationSurface(document){
  const modal=document?.querySelector?.('#modal-sjx-notif .modal')||document?.getElementById?.('modal-sjx-notif')?.querySelector?.('.modal');
  if(!modal) return false;
  modal.classList?.add?.('sjr06-notifications');
  const title=modal.querySelector?.('.modal-title');
  if(title){
    title.textContent='Notifikasi';
    if(!modal.querySelector?.('.sjr06-notif-subtitle')){
      const sub=document.createElement?.('p');
      if(sub){sub.className='sjr06-notif-subtitle';sub.textContent='Informasi dan aktivitas penting toko';title.insertAdjacentElement?.('afterend',sub)}
    }
  }
  const tabs=ensureTabs(document,modal)||modal.querySelector?.('.sjr06-notif-tabs');
  const rows=decorateRows(modal);
  if(tabs&&tabs.dataset?.ref01Bound!=='true'){
    tabs.dataset.ref01Bound='true';
    tabs.addEventListener?.('click',event=>{
      const button=event.target?.closest?.('[data-ref01-notif-filter]');
      if(!button)return;
      const filter=button.dataset.ref01NotifFilter||'all';
      tabs.querySelectorAll?.('[data-ref01-notif-filter]')?.forEach?.(b=>b.classList?.toggle?.('active',b===button));
      for(const row of rows){
        const kind=row.dataset?.ref01NotifKind||'all';
        row.style&&(row.style.display=(filter==='all'||kind===filter)?'':'none');
      }
    });
  }
  return true;
}

export function installNotificationRefinement(runtime=globalThis,{decorate=decorateNotificationSurface}={}){
  if(runtime?.__SJ_REF01_NOTIFICATION_REFINEMENT) return runtime.__SJ_REF01_NOTIFICATION_REFINEMENT;
  const target=runtime?.SJX;
  if(!target||typeof target.renderNotifications!=='function'){
    const api=Object.freeze({installed:false,reconcileAuthority:()=>false});
    try{Object.defineProperty(runtime,'__SJ_REF01_NOTIFICATION_REFINEMENT',{value:api,configurable:true})}catch(_){}
    return api;
  }
  const syncUnreadBadge=()=>runtime?.SJRef01ProductionSalesCompat?.syncUnreadBadge?.();
  let managedRender=null,managedBell=null,renderDelegate=null,bellFallback=null;
  function bindRender(){
    if(target.renderNotifications===managedRender)return false;
    renderDelegate=typeof target.renderNotifications==='function'?target.renderNotifications.bind(target):null;
    managedRender=function(...args){
      const result=renderDelegate?.(...args);
      try{decorate(runtime?.document)}catch(_){}
      try{syncUnreadBadge()}catch(_){}
      return result;
    };
    target.renderNotifications=managedRender;return true;
  }
  function bindBell(){
    if(target.updateBell===managedBell)return false;
    bellFallback=typeof target.updateBell==='function'?target.updateBell.bind(target):null;
    managedBell=function(){
      const count=syncUnreadBadge();
      if(Number.isFinite(Number(count)))return Number(count);
      return bellFallback?.();
    };
    target.updateBell=managedBell;return true;
  }
  function reconcileAuthority(){bindRender();bindBell();try{syncUnreadBadge()}catch(_){}return true}
  reconcileAuthority();
  const api=Object.freeze({installed:true,decorate:()=>decorate(runtime?.document),syncUnreadBadge,reconcileAuthority});
  try{Object.defineProperty(runtime,'__SJ_REF01_NOTIFICATION_REFINEMENT',{value:api,writable:false,configurable:false})}catch(_){runtime.__SJ_REF01_NOTIFICATION_REFINEMENT=api}
  return api;
}
