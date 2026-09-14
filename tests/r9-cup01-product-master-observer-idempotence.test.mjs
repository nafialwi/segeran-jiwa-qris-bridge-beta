import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const SOURCE='src/compat/legacy-cup-01b-product-cup-ui.js';

class Node {
  constructor(){
    this.dataset={};
    this.children=[];
    this.parentNode=null;
    this.className='';
    this._text='';
    this.textWrites=0;
  }
  set textContent(value){
    this._text=String(value);
    this.textWrites++;
  }
  get textContent(){ return this._text; }
  appendChild(child){
    this.children.push(child);
    child.parentNode=this;
    if(child.dataset?.sjCupMappingChip)this.chip=child;
    return child;
  }
  insertBefore(child){ return this.appendChild(child); }
  remove(){}
  addEventListener(){}
  querySelector(){ return null; }
  querySelectorAll(){ return []; }
}

test('CUP-01 Product Master decorator is idempotent and does not self-trigger MutationObserver forever',()=>{
  const meta=new Node();

  const card=new Node();
  card.dataset.masterCard=encodeURIComponent('P1');
  card.querySelector=selector=>{
    if(selector==='.sjmux-product-master-meta')return meta;
    if(selector==='[data-sj-cup-mapping-chip]')return meta.chip||null;
    return null;
  };

  const list=new Node();
  list.querySelectorAll=selector=>
    selector==='[data-master-card]'?[card]:[];

  const head=new Node();

  const document={
    readyState:'complete',
    head,
    getElementById(id){
      if(id==='master-menu-list')return list;
      return null;
    },
    querySelector(){ return null; },
    createElement(){ return new Node(); },
    addEventListener(){}
  };

  class MutationObserver {
    constructor(callback){ this.callback=callback; }
    observe(){}
  }

  const window={
    document,
    MutationObserver,
    cloudData:{
      global:{
        menu:[{id:'P1',cp:'c16'}]
      }
    }
  };
  window.window=window;

  const context=vm.createContext({
    window,
    document,
    MutationObserver,
    queueMicrotask,
    Event:class {},
    console
  });

  vm.runInContext(readFileSync(SOURCE,'utf8'),context,{filename:SOURCE});

  const api=window.SJLegacyCup01BProductCupUI;
  assert.ok(api?.decorateMasterCupMappings);
  assert.ok(meta.chip);
  assert.equal(meta.chip.textContent,'Cup: Cup 16 Oz');

  const writesBefore=meta.chip.textWrites;

  api.decorateMasterCupMappings();

  assert.equal(
    meta.chip.textWrites,
    writesBefore,
    'second decoration with unchanged cup mapping must not mutate chip text again'
  );
});
