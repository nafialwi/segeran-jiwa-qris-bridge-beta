function esc(value){return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]))}

export function buildPrintableReceiptHtml(text,{title='Struk Segeran Jiwa'}={}){
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title><style>html,body{margin:0;padding:0;background:#fff;color:#111;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}main{max-width:78mm;margin:0 auto;padding:10mm 6mm}h1{font:700 16px/1.3 system-ui,sans-serif;margin:0 0 10px}pre{margin:0;white-space:pre-wrap;word-break:break-word;font-size:12px;line-height:1.45}@media print{main{max-width:none;margin:0;padding:0}h1{display:none}}</style></head><body><main><h1>${esc(title)}</h1><pre>${esc(text)}</pre></main></body></html>`;
}

function readReceiptText(runtime){
  const tx=runtime?.SJCommercialUATV5962?.lastReceipt;
  if(tx&&typeof runtime?.sjReceiptText==='function'){
    try{const value=runtime.sjReceiptText(tx);if(String(value||'').trim())return String(value)}catch(_){}
  }
  const node=runtime?.document?.getElementById?.('struk-content');
  const fallback=String(node?.innerText||node?.textContent||'').trim();
  return fallback;
}

export function createRc01ReceiptOutput(runtime=globalThis){
  const document=runtime?.document;
  async function printOrSavePdf(){
    const text=readReceiptText(runtime);
    if(!text){try{runtime?.showToast?.('Data struk tidak tersedia.','error')}catch(_){}return false}
    if(!document?.body||typeof document?.createElement!=='function')return false;
    const frame=document.createElement('iframe');
    try{
      if(frame?.style){frame.style.position='fixed';frame.style.right='0';frame.style.bottom='0';frame.style.width='0';frame.style.height='0';frame.style.border='0';frame.style.opacity='0'}
      document.body.appendChild(frame);
      const win=frame?.contentWindow,doc=win?.document;
      if(!win||!doc||typeof win.print!=='function')throw new Error('PRINT_API_UNAVAILABLE');
      doc.open?.();doc.write?.(buildPrintableReceiptHtml(text));doc.close?.();win.focus?.();win.print();
      const cleanup=()=>{try{frame.remove?.()}catch(_){}};
      if(typeof runtime?.setTimeout==='function')runtime.setTimeout(cleanup,250);else cleanup();
      return true;
    }catch(error){
      try{frame.remove?.()}catch(_){}
      try{runtime?.showToast?.('Fitur cetak/PDF browser tidak tersedia pada perangkat ini.','warning')}catch(_){}
      return false;
    }
  }

  function enhanceReceiptActions(){
    const host=document?.querySelector?.('.sjvc011-success-actions');
    if(!host||host.querySelector?.('[data-rc01-receipt-pdf]'))return false;
    const button=document.createElement('button');
    button.type='button';button.textContent='Simpan PDF / Cetak';button.setAttribute?.('data-rc01-receipt-pdf','true');
    button.addEventListener?.('click',()=>{void printOrSavePdf()});
    host.appendChild?.(button);
    return true;
  }

  return Object.freeze({printOrSavePdf,enhanceReceiptActions});
}

export function installRc01ReceiptOutput(runtime=globalThis){
  if(runtime?.SJRC01ReceiptOutput)return runtime.SJRC01ReceiptOutput;
  const api=createRc01ReceiptOutput(runtime);
  const final=runtime?.SJFinalRefinementVC01A1;
  if(final&&typeof final.renderSuccess==='function'&&!final.__sjRc01ReceiptOutputWrapped){
    const original=final.renderSuccess.bind(final);
    final.renderSuccess=function(...args){const out=original(...args);try{api.enhanceReceiptActions()}catch(_){}return out};
    try{Object.defineProperty(final,'__sjRc01ReceiptOutputWrapped',{value:true,enumerable:false})}catch(_){}
  }
  try{api.enhanceReceiptActions()}catch(_){}
  try{Object.defineProperty(runtime,'SJRC01ReceiptOutput',{value:api,writable:false,configurable:false,enumerable:false})}catch(_){runtime.SJRC01ReceiptOutput=api}
  return api;
}
