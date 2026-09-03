import { renderIcon } from './icons.js';
import { renderLockedIcon } from './locked-icon-registry.js';

export const PRIMARY_NAV=Object.freeze([
  Object.freeze({route:'home',label:'Beranda',icon:'home',legacyTab:'tab5',motionMs:200}),
  Object.freeze({route:'sales',label:'Jual',icon:'sale',legacyTab:'tab1',motionMs:200}),
  Object.freeze({route:'operational',label:'Operasional',icon:'operations',legacyTab:'tab2',motionMs:200}),
  Object.freeze({route:'reports',label:'Laporan',icon:'reports',legacyTab:'tab3',motionMs:200}),
  Object.freeze({route:'settings',label:'Pengaturan',icon:'settings',legacyTab:'tab4',motionMs:200})
]);

export function navState(activeRoute='home'){
  return PRIMARY_NAV.map(item=>Object.freeze({...item,active:item.route===activeRoute}));
}

function activeIcon(name,label){
  return renderLockedIcon(name,{active:true,size:21,label,className:'sj-ref-icon sjr02-nav-icon-active'})||renderIcon(name,{size:21,label,className:'sj-ref-icon sjr02-nav-icon-active'});
}

function ensureCapsule(document,nav){
  let capsule=nav?.querySelector?.('.sjr02-nav-capsule')??null;
  if(capsule||!document?.createElement||!nav?.insertBefore) return capsule;
  capsule=document.createElement('span');
  capsule.className='sjr02-nav-capsule';
  capsule.dataset.ref01NavCapsule='true';
  capsule.setAttribute?.('aria-hidden','true');
  nav.insertBefore(capsule,nav.firstChild??null);
  return capsule;
}

function positionCapsule(capsule,button){
  if(!capsule||!button) return false;
  const left=Number(button.offsetLeft),width=Number(button.offsetWidth);
  if(!Number.isFinite(left)||!Number.isFinite(width)||width<=0) return false;
  capsule.style.width=`${width}px`;
  capsule.style.transform=`translateX(${left}px)`;
  return true;
}

export function enhanceBottomNav(document,activeRoute){
  if(!document?.getElementById) return false;
  let touched=false,activeButton=null;
  for(const item of navState(activeRoute)){
    const button=document.getElementById(item.legacyTab);
    if(!button) continue;
    button.dataset.ref01Route=item.route;
    button.dataset.ref01Nav='true';
    button.classList?.toggle?.('ref01-active',item.active);
    button.classList?.toggle?.('active',item.active);
    if(item.active) activeButton=button;
    const icon=button.querySelector?.('.nav-icon');
    if(icon) icon.innerHTML=item.active?activeIcon(item.icon,item.label):renderIcon(item.icon,{size:21,label:item.label});
    const textNodes=Array.from(button.childNodes??[]).filter(node=>node.nodeType===3);
    for(const node of textNodes) node.remove?.();
    const semanticLabel=button.querySelector?.('.sjui01-nav-label');
    if(semanticLabel) semanticLabel.textContent=item.label;
    else if(button.insertAdjacentText) button.insertAdjacentText('beforeend',item.label);
    touched=true;
  }
  const nav=document.getElementById('bottom-nav');
  if(nav){
    nav.dataset.ref01='true';
    nav.dataset.ref01ActiveRoute=String(activeRoute||'home');
    nav.setAttribute?.('aria-label','Navigasi utama');
    positionCapsule(ensureCapsule(document,nav),activeButton);
  }
  return touched;
}
