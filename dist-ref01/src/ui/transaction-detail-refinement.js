function inlineVisible(node){
  if(!node) return false;
  const display=String(node?.style?.display??'').trim().toLowerCase();
  if(display==='none') return false;
  if(display) return true;
  return node?.classList?.contains?.('show')===true||node?.getAttribute?.('aria-hidden')==='false';
}

function mark(node,className,authority){
  if(!node) return false;
  node.classList?.add?.(className);
  if(node.dataset&&authority) node.dataset.ref01Authority=authority;
  return true;
}

function setFocusedNav(nav,focused){
  if(!nav) return;
  if(focused){
    nav.setAttribute?.('aria-hidden','true');
    nav.setAttribute?.('inert','');
  }else{
    nav.removeAttribute?.('aria-hidden');
    nav.removeAttribute?.('inert');
  }
}

export function reconcileTransactionSurfaces(document){
  if(!document) return Object.freeze({receiptOpen:false,transactionDetail:false,reportTransactionDetail:false});
  const body=document.body;
  const nav=document.getElementById?.('bottom-nav');
  const receipt=document.getElementById?.('modal-struk-fs');
  const receiptOpen=inlineVisible(receipt);

  if(receipt){
    mark(receipt,'sjr05-receipt-overlay','existing-receipt-authority');
    mark(receipt.querySelector?.('.modal'),'sjr05-receipt-sheet');
    mark(receipt.querySelector?.('#struk-content'),'sjr05-receipt-content');
    mark(receipt.querySelector?.('.fs-footer'),'sjr05-receipt-actions');
  }
  body?.classList?.[receiptOpen?'add':'remove']?.('sjr05-receipt-open');
  setFocusedNav(nav,receiptOpen);

  const tx=document.getElementById?.('modal-tx');
  const transactionDetail=Boolean(tx);
  if(tx){
    mark(tx,'sjr05-transaction-overlay','existing-receipt-and-transaction-authority');
    mark(tx.querySelector?.('.modal'),'sjr05-transaction-sheet');
  }

  const reportDetail=document.querySelector?.('.sj-rep0[data-view="transaction-detail"]')??null;
  const reportTransactionDetail=Boolean(reportDetail);
  if(reportDetail) mark(reportDetail,'sjr05-report-transaction-detail','existing-report-transaction-detail-authority');

  return Object.freeze({receiptOpen,transactionDetail,reportTransactionDetail});
}
