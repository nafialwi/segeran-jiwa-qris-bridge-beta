function tag(node,className,authority){
  if(!node) return false;
  node.classList?.add?.(className);
  if(node.dataset&&authority) node.dataset.ref01Authority=authority;
  return true;
}

function decorateSheet(root,overlayClass,sheetClass,authority){
  if(!root) return false;
  tag(root,overlayClass,authority);
  tag(root.querySelector?.('.modal'),sheetClass);
  return true;
}

export function decorateCriticalOperationalSurfaces(document){
  if(!document?.getElementById) return Object.freeze({closing:false,handover:false,shiftDetail:false,refund:false});
  const closing=decorateSheet(document.getElementById('modal-sjshift-close'),'sjr05-closing-overlay','sjr05-closing-sheet','existing-SJShift');
  const handover=decorateSheet(document.getElementById('modal-sjshift-handover'),'sjr05-handover-overlay','sjr05-handover-sheet','existing-SJShift');
  const shiftDetail=decorateSheet(document.getElementById('modal-sj-shift-detail'),'sjr05-shift-detail-overlay','sjr05-shift-detail-sheet','existing-SJShift');

  const refundPage=document.getElementById('opr12');
  const search=document.getElementById('sjx-refund-search');
  const result=document.getElementById('sjx-refund-result');
  const card=document.getElementById('sjx-refund-card');
  const refund=Boolean(refundPage||search||result||card);
  if(refundPage) tag(refundPage,'sjr05-refund-page','existing-refund-void-authority');
  if(card) tag(card,'sjr05-refund-launcher','existing-refund-void-authority');
  if(search){tag(search,'sjr05-refund-search');search.setAttribute?.('aria-label','Cari transaksi untuk Refund / VOID')}
  if(result) tag(result,'sjr05-refund-evidence');

  return Object.freeze({closing,handover,shiftDetail,refund});
}
