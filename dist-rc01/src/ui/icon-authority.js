import { renderLockedIcon } from './locked-icon-registry.js';
import { renderIcon } from './icons.js';

export const LEGACY_ICON_MAP=Object.freeze({
  dashboard:'home',cart:'cart',package:'warehouse',chart:'reports',settings:'settings',bell:'notification',clock:'history',wallet:'cash',
  users:'users',user:'profile',repeat:'history',plusbox:'add',receipt:'receipt',history:'activity',search:'search',printer:'printer',
  activity:'activity',database:'backup-restore',arrow:'chevron-right',note:'receipt',cash:'cash',scan:'barcode-scan',filter:'filter'
});

export function installRefinementIconAuthority(runtime=globalThis){
  if(runtime?.__SJ_REF01_ICON_AUTHORITY)return runtime.__SJ_REF01_ICON_AUTHORITY;
  const sjpro=runtime?.SJPro;
  const api={installed:false,render(name){
    const canonical=LEGACY_ICON_MAP[name]||name;
    return renderLockedIcon(canonical,{size:20})||renderIcon(canonical,{size:20});
  }};
  if(sjpro&&typeof sjpro.icon==='function'){
    sjpro.icon=(name)=>api.render(name);
    api.installed=true;
  }
  Object.freeze(api);
  try{Object.defineProperty(runtime,'__SJ_REF01_ICON_AUTHORITY',{value:api,writable:false,configurable:false})}catch(_){}
  return api;
}
