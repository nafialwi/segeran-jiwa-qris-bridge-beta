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

  let receiptPresentation='legacy';
  if(receipt){
    mark(receipt,'sjr05-receipt-overlay','existing-receipt-authority');
    mark(receipt.querySelector?.('.modal'),'sjr05-receipt-sheet');
    const content=receipt.querySelector?.('#struk-content');
    const footer=receipt.querySelector?.('.fs-footer');
    mark(content,'sjr05-receipt-content');
    mark(footer,'sjr05-receipt-actions');
    const success=Array.from(receipt.querySelectorAll?.('.sjvc011-success')||[]);
    if(success.length){
      receiptPresentation='success';
      receipt.classList?.add?.('sjr05-receipt-success');
      success.slice(1).forEach(node=>node.remove?.());
      if(content?.style) content.style.display='none';
      if(footer?.style) footer.style.display='none';
    }else{
      receipt.classList?.remove?.('sjr05-receipt-success');
      if(content?.style&&content.style.display==='none') content.style.display='';
      if(footer?.style&&footer.style.display==='none') footer.style.display='';
    }
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

  return Object.freeze({receiptOpen,receiptPresentation,transactionDetail,reportTransactionDetail});
}
