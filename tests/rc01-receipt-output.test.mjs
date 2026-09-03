import test from 'node:test';
import assert from 'node:assert/strict';

async function loadModule(){
  try{return await import('../src/ui/rc01-receipt-output.js')}
  catch(error){assert.fail(`RC01 receipt output module required: ${error?.code||error?.message}`)}
}

test('RC01 printable receipt HTML escapes receipt text and exposes print/PDF media contract',async()=>{
  const {buildPrintableReceiptHtml}=await loadModule();
  const html=buildPrintableReceiptHtml('Es <Teh> & Susu\nTOTAL Rp10.000',{title:'Struk <SJ>'});
  assert.match(html,/Struk &lt;SJ&gt;/);
  assert.match(html,/Es &lt;Teh&gt; &amp; Susu/);
  assert.match(html,/@media print/);
  assert.match(html,/white-space:pre-wrap/);
});

test('RC01 printOrSavePdf uses an isolated printable frame and never needs POS persistence',async()=>{
  const {createRc01ReceiptOutput}=await loadModule();
  let appended=0,removed=0,writes='',prints=0;
  const frameDoc={open(){},write(value){writes+=value},close(){}};
  const frame={style:{},contentWindow:{document:frameDoc,focus(){},print(){prints++}},remove(){removed++}};
  const runtime={
    sjReceiptText:()=> 'STRUK\nTOTAL Rp10.000',
    SJCommercialUATV5962:{lastReceipt:{id:'TX-1'}},
    document:{
      body:{appendChild(node){assert.equal(node,frame);appended++}},
      createElement(tag){assert.equal(tag,'iframe');return frame},
      querySelector(){return null}
    },
    setTimeout(fn){fn()},
    showToast(){}
  };
  const api=createRc01ReceiptOutput(runtime);
  assert.equal(await api.printOrSavePdf(),true);
  assert.equal(appended,1);
  assert.equal(prints,1);
  assert.equal(removed,1);
  assert.match(writes,/TOTAL Rp10\.000/);
});

test('RC01 receipt enhancement adds exactly one Simpan PDF / Cetak action and is idempotent',async()=>{
  const {createRc01ReceiptOutput}=await loadModule();
  const buttons=[];
  const host={
    querySelector(selector){return selector==='[data-rc01-receipt-pdf]'?buttons.find(x=>x.dataset?.rc01ReceiptPdf==='true')||null:null},
    appendChild(node){buttons.push(node)}
  };
  const makeButton=()=>({dataset:{},setAttribute(name,value){if(name==='data-rc01-receipt-pdf')this.dataset.rc01ReceiptPdf=value},addEventListener(type,fn){this.onclick=fn},type:'',textContent:''});
  const runtime={
    document:{querySelector(selector){return selector==='.sjvc011-success-actions'?host:null},createElement(tag){assert.equal(tag,'button');return makeButton()}},
    SJCommercialUATV5962:{lastReceipt:{id:'TX-1'}},
    sjReceiptText:()=> 'STRUK',
    setTimeout(fn){fn()},
    showToast(){}
  };
  const api=createRc01ReceiptOutput(runtime);
  assert.equal(api.enhanceReceiptActions(),true);
  assert.equal(api.enhanceReceiptActions(),false);
  assert.equal(buttons.length,1);
  assert.equal(buttons[0].textContent,'Simpan PDF / Cetak');
  assert.equal(buttons[0].dataset.rc01ReceiptPdf,'true');
});
