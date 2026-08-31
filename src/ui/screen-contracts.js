const contract=(selectors,authority,reference,{role='both',purpose=''}={})=>Object.freeze({selectors:Object.freeze(selectors),authority,reference:Object.freeze(reference),role,purpose});

export const SCREEN_CONTRACTS=Object.freeze({
  dashboard:contract(['#view5'],'legacy-dashboard-renderer',['REF_04'],{purpose:'Kondisi operasional sekarang dan aksi cepat; Owner/Kasir berbeda menurut role.'}),
  sales:contract(['#view1'],'legacy-sales-renderer',['REF_04','REF_07'],{purpose:'Cari/scan, kategori, produk, qty dan cart context.'}),
  cart:contract(['#modal-cart'],'legacy-cart-authority',['REF_07'],{purpose:'Item, thumbnail, qty, remove, customer/discount dan totals.'}),
  checkout:contract(['#modal-bayar'],'legacy-checkout-authority',['REF_04','REF_08'],{purpose:'Ringkasan transaksi dan pemilihan metode pembayaran.'}),
  payments:contract(['#modal-sj-qris-wait','#modal-qris-fs'],'existing-payment-and-qris-authority',['REF_08','REF_09'],{purpose:'Tunai, QRIS, Transfer, Kasbon serta critical QRIS states.'}),
  operational:contract(['#view2','#opr-container-view'],'legacy-operational-renderer',['REF_03','REF_07'],{purpose:'Stok, restock, pengeluaran, shift, notes, refund dan kasbon karyawan.'}),
  'shift-closing':contract(['#modal-sjshift-close','#modal-sjshift-handover','#modal-sj-shift-detail'],'existing-SJShift',['REF_05'],{purpose:'Shift identity, closing worksheet, handover, cash reconciliation dan stale-shift recovery.'}),
  'refund-void':contract(['#sjx-refund-search','#sjx-refund-card'],'existing-refund-void-authority',['REF_05'],{purpose:'Search evidence, reason, permission dan deliberate confirmation.'}),
  reports:contract(['#view3','#lap-container-view'],'legacy-report-renderer',['REF_06'],{role:'owner',purpose:'Historical period, trend, category dan evidence detail.'}),
  settings:contract(['#view4','#mst-container-view','#mst-menu-view'],'ref01-grouped-settings-plus-existing-feature-renderers',['REF_01','REF_03','REF_09'],{role:'owner',purpose:'Grouped responsibility IA and sensitive-zone separation.'}),
  'system-states':contract(['[data-ref01-system-state]'],'ref01-system-state-family',['REF_09'],{purpose:'Loading, empty, error, success, offline, permission dan retry.'})
});

export function tagScreenContracts(document){
  if(!document?.querySelectorAll) return 0;
  let tagged=0;
  for(const [family,meta] of Object.entries(SCREEN_CONTRACTS)){
    for(const selector of meta.selectors){
      for(const node of Array.from(document.querySelectorAll(selector)||[])){
        if(!node?.dataset) continue;
        const current=String(node.dataset.ref01Family||'').split(/\s+/).filter(Boolean);
        if(!current.includes(family)) current.push(family);
        node.dataset.ref01Family=current.join(' ');
        node.dataset.ref01Authority=meta.authority;
        tagged++;
      }
    }
  }
  return tagged;
}
