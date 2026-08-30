import { legacyViewToRoute, routeToLegacyView, OPERATIONAL_CHILDREN, REPORT_CHILDREN, SETTINGS_CHILDREN } from './route-contract.js';

function requireDependency(value,name){
  if(!value) throw new TypeError(`SC03_${name}_REQUIRED`);
  return value;
}

export function createAppRouter({commands,guard,state}){
  requireDependency(commands,'COMMANDS');
  requireDependency(guard,'ROLE_GUARD');
  requireDependency(state,'APP_STATE');

  const snapshot=()=>state.snapshot();
  const invokeCommand=(alias,...args)=>commands.invoke(alias,...args);

  function openPrimary(route){
    if(!guard.canAccessPrimary(route)) return guard.deny();
    if(route==='home'){
      state.setPrimary('home');
      return commands.invoke('dashboard.open');
    }
    const view=routeToLegacyView(route);
    if(view==null) throw new Error(`UNKNOWN_PRIMARY_ROUTE:${route}`);
    state.setPrimary(route);
    return commands.invoke('showView',view);
  }
  const openHome=()=>openPrimary('home');
  const openSales=()=>openPrimary('sales');
  const openReports=()=>openPrimary('reports');
  const openSettingsHome=()=>openPrimary('settings');
  const navigateLegacyView=view=>{
    const route=legacyViewToRoute(view);
    if(!route) throw new Error(`UNKNOWN_LEGACY_VIEW:${view}`);
    return openPrimary(route);
  };

  function ensureParent(route){
    if(snapshot().primary===route) return true;
    return openPrimary(route)!==false;
  }

  function openOperational(id){
    const n=Number(id),meta=OPERATIONAL_CHILDREN[n];
    if(!guard.canAccessOperational(n)) return guard.deny();
    if(!meta) return guard.deny('Menu operasional tidak tersedia.');
    if(!ensureParent('operational')) return false;
    state.setChild('operational',meta.key,{id:n});
    return commands.invoke('openOpr',n);
  }
  function closeOperational(){
    const out=commands.invoke('closeOpr');
    if(snapshot().primary==='operational') state.clearChild();
    return out;
  }

  function openReport(id){
    const n=Number(id),meta=REPORT_CHILDREN[n];
    if(!guard.canAccessReport(n)) return guard.deny();
    if(!meta) return guard.deny('Laporan tidak tersedia.');
    if(!ensureParent('reports')) return false;
    state.setChild('reports',meta.key,{id:n});
    return commands.invoke('openLap',n);
  }
  function closeReport(){
    const out=commands.invoke('closeLap');
    if(snapshot().primary==='reports') state.clearChild();
    return out;
  }

  function openSettings(id){
    const n=Number(id),meta=SETTINGS_CHILDREN[n];
    if(!guard.canAccessSettings(n)) return guard.deny();
    if(!meta) return guard.deny('Pengaturan tidak tersedia.');
    if(!ensureParent('settings')) return false;
    state.setChild('settings',meta.key,{id:n});
    return commands.invoke('openMst',n);
  }
  function closeSettings(){
    const out=commands.invoke('closeMst');
    if(snapshot().primary==='settings') state.clearChild();
    return out;
  }

  function ensureSales(){return ensureParent('sales')}
  function openCart(){
    if(!ensureSales()) return false;
    state.setTransactionChild('cart');
    return commands.invoke('openCartModal');
  }
  function openCheckout(){
    if(!ensureSales()) return false;
    state.setTransactionChild('checkout');
    return commands.invoke('checkout.open');
  }
  function openPayment(method){
    const paymentMethod=String(method??'').trim();
    if(!paymentMethod) throw new Error('PAYMENT_METHOD_REQUIRED');
    if(!ensureSales()) return false;
    state.setTransactionChild(`payment:${paymentMethod.toLowerCase()}`,{method:paymentMethod});
    return commands.invoke('payment.open',paymentMethod);
  }

  return Object.freeze({
    snapshot,invokeCommand,navigateLegacyView,openPrimary,
    openHome,openSales,openReports,openSettingsHome,
    openOperational,closeOperational,
    openReport,closeReport,
    openSettings,closeSettings,
    openCart,openCheckout,openPayment
  });
}
