export function reconcileRoleNavigation(document,runtime=globalThis,role='owner'){
  const nav=document?.getElementById?.('bottom-nav');
  const settings=document?.getElementById?.('tab4');
  if(!nav||!settings) return false;
  const normalized=String(role||'').toLowerCase()==='owner'?'owner':'cashier';
  if(!Object.prototype.hasOwnProperty.call(settings,'__ref01OriginalOnclick')){
    Object.defineProperty(settings,'__ref01OriginalOnclick',{value:settings.onclick??null,writable:true,configurable:true});
  }
  settings.style?.setProperty?.('display','flex','important');
  nav.style.gridTemplateColumns='repeat(5, minmax(0, 1fr))';
  if(normalized==='cashier'){
    settings.dataset.ref01CashierSettings='account';
    settings.onclick=event=>{
      event?.preventDefault?.();
      event?.stopImmediatePropagation?.();
      runtime?.SJAccountV5964?.open?.();
      return false;
    };
  }else{
    delete settings.dataset.ref01CashierSettings;
    settings.onclick=settings.__ref01OriginalOnclick;
  }
  nav.dataset.ref01Role=normalized;
  return true;
}
