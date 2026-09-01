import { renderFilledIcon } from './icons.js';

export const LEGACY_ICON_MAP=Object.freeze({
  dashboard:'home',cart:'sale',package:'warehouse-box',chart:'reports',settings:'settings',bell:'bell',clock:'shift',wallet:'wallet',
  users:'customers',user:'account-circle',repeat:'refund',plusbox:'plusbox',receipt:'receipt',history:'history',search:'search',printer:'printer',
  activity:'history',database:'database',arrow:'chevron',note:'note',cash:'cash',scan:'scan',filter:'filter'
});

export function installRefinementIconAuthority(runtime=globalThis){
  if(runtime?.__SJ_REF01_ICON_AUTHORITY)return runtime.__SJ_REF01_ICON_AUTHORITY;
  const sjpro=runtime?.SJPro;
  const api={installed:false,render(name){return renderFilledIcon(LEGACY_ICON_MAP[name]||name,{size:20})}};
  if(sjpro&&typeof sjpro.icon==='function'){
    sjpro.icon=(name)=>api.render(name);
    api.installed=true;
  }
  Object.freeze(api);
  try{Object.defineProperty(runtime,'__SJ_REF01_ICON_AUTHORITY',{value:api,writable:false,configurable:false})}catch(_){}
  return api;
}
