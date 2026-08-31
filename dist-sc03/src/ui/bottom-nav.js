import { renderIcon } from './icons.js';

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

export function enhanceBottomNav(document,activeRoute){
  if(!document?.getElementById) return false;
  let touched=false;
  for(const item of navState(activeRoute)){
    const button=document.getElementById(item.legacyTab);
    if(!button) continue;
    button.dataset.ref01Route=item.route;
    button.dataset.ref01Nav='true';
    button.classList?.toggle?.('ref01-active',item.active);
    const icon=button.querySelector?.('.nav-icon');
    if(icon) icon.innerHTML=renderIcon(item.icon,{size:21,label:item.label});
    const textNodes=Array.from(button.childNodes??[]).filter(node=>node.nodeType===3);
    for(const node of textNodes) node.remove?.();
    if(button.insertAdjacentText) button.insertAdjacentText('beforeend',item.label);
    touched=true;
  }
  const nav=document.getElementById('bottom-nav');
  if(nav){nav.dataset.ref01='true';nav.setAttribute?.('aria-label','Navigasi utama')}
  return touched;
}
