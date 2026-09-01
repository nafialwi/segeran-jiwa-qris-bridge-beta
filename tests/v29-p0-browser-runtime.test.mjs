import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { reconcileTransactionSurfaces } from '../src/ui/transaction-detail-refinement.js';

function classList(){
  const set=new Set();
  return {add(...xs){xs.forEach(x=>set.add(x))},remove(...xs){xs.forEach(x=>set.delete(x))},contains(x){return set.has(x)},values(){return [...set]}};
}
function node({display=''}={}){
  const attrs={};
  return {style:{display},dataset:{},classList:classList(),setAttribute(k,v){attrs[k]=String(v)},removeAttribute(k){delete attrs[k]},getAttribute(k){return attrs[k]},remove(){this.removed=true},attrs};
}

test('v2.9 P0 receipt success state hard-hides the legacy receipt action surface',()=>{
  const modal=node(),receipt=node({display:'flex'}),nav=node(),body=node(),content=node(),footer=node(),success=node();
  receipt.querySelector=sel=>sel==='.modal'?modal:sel==='#struk-content'?content:sel==='.fs-footer'?footer:null;
  receipt.querySelectorAll=sel=>sel==='.sjvc011-success'?[success]:[];
  const document={body,getElementById(id){return id==='modal-struk-fs'?receipt:id==='bottom-nav'?nav:null},querySelector(){return null}};
  const result=reconcileTransactionSurfaces(document);
  assert.equal(result.receiptPresentation,'success');
  assert.equal(receipt.classList.contains('sjr05-receipt-success'),true,'receipt root must expose explicit success state for CSS authority');
  const css=fs.readFileSync(new URL('../src/ui/ref01.css',import.meta.url),'utf8');
  assert.match(css,/\.sjr05-receipt-success[^\{]*\.sjr05-receipt-actions\s*\{[^}]*display\s*:\s*none\s*!important/i);
});

import { installProductionSalesStability, installManualSyncControls } from '../src/ui/production-sales-stability.js';

test('v2.9 P0 active mobile cart omits per-item delete while keeping quantity and global clear authorities',()=>{
  const owner={
    cartRow(){return '<div><button data-delta="-1">−</button><button data-delta="1">+</button><button data-item-discount="0">Diskon</button><button class="sjvc012-delete" data-remove><svg><path></path></svg></button></div>'}
  };
  const runtime={
    SJRefinementSalesV100:{activeProducts(){return[]}},
    SJRef01ProductionSalesCompat:{activeProducts(){return[]}},
    SJFinalRefinementVC01A2:owner
  };
  const api=installProductionSalesStability(runtime);
  assert.equal(api.installed,true);
  const html=owner.cartRow({id:'p1',n:'Produk',q:1},0);
  assert.doesNotMatch(html,/data-remove/);
  assert.match(html,/data-delta="-1"/);
  assert.match(html,/data-delta="1"/);
  assert.match(html,/data-item-discount="0"/);
});

test('v2.9 P0 sales-history query updates result regions without rebuilding the focused input',()=>{
  const src=fs.readFileSync(new URL('../src/ui/report-sales-history-refinement.js',import.meta.url),'utf8');
  assert.match(src,/dataset\.salesFilter\s*===\s*['"]query['"][\s\S]{0,240}refreshHistoryResults\s*\(/);
  const bind=src.match(/function bindHistory\(\)[\s\S]*?function openHistory\(\)/)?.[0]||'';
  const queryBranch=bind.match(/dataset\.salesFilter\s*===\s*['"]query['"][\s\S]*?return/)?.[0]||'';
  assert.ok(queryBranch,'query-specific handler must exist');
  assert.doesNotMatch(queryBranch,/openHistory\s*\(/,'query typing must not replace the report root/input');
});

test('v2.9 P0 sales cards remove the untracked Siap dijual copy without removing real stock context',()=>{
  const final={productCard(){return '<article><small class="sjvc01-context">Siap dijual</small><button class="sjvc01-add" data-add="p1">+</button></article>'}};
  const runtime={
    SJRefinementSalesV100:{activeProducts(){return[]}},
    SJRef01ProductionSalesCompat:{activeProducts(){return[]},productQty(){return 0}},
    SJFinalRefinementVC01A:final
  };
  installProductionSalesStability(runtime);
  const html=final.productCard({id:'p1',n:'Produk'});
  assert.doesNotMatch(html,/Siap dijual/i);
  assert.match(html,/data-add="p1"/);
});

test('v2.9 P0 manual refresh groups header actions instead of becoming an orphan second-row control',()=>{
  const help={className:'sjvc02-help',matches(sel){return sel.includes('.sjvc02-help')}};
  const host={
    className:'sjvc02-head',children:[help],
    matches(sel){return sel.includes('.sjvc02-head')},
    querySelector(sel){
      if(sel==='[data-sj-manual-sync]')return this.children.flatMap(x=>x.children||[]).find(x=>x?.dataset?.sjManualSync)||null;
      if(sel==='.sj-v29-header-actions')return this.children.find(x=>x?.className==='sj-v29-header-actions')||null;
      return null;
    },
    appendChild(node){this.children=this.children.filter(x=>x!==node);this.children.push(node);node.parentNode=this;return node}
  };
  const document={
    querySelectorAll(selector){return selector==='.sjvc02-head'?[host]:[]},
    createElement(tag){
      if(tag==='div')return {className:'',children:[],appendChild(node){
        if(node.parentNode?.children)node.parentNode.children=node.parentNode.children.filter(x=>x!==node);
        this.children.push(node);node.parentNode=this;return node;
      }};
      return {type:'',className:'',dataset:{},disabled:false,classList:{add(){},remove(){}},setAttribute(){},addEventListener(){},innerHTML:''};
    }
  };
  help.parentNode=host;
  const runtime={document,SJRef01ProductionSalesCompat:{async refreshNow(){return{ok:true}}}};
  installManualSyncControls(runtime).enhance();
  const group=host.children.find(x=>x?.className==='sj-v29-header-actions');
  assert.ok(group,'operational/settings header actions must be grouped into one stable right-side container');
  assert.equal(group.children.includes(help),true,'existing help control should share the action group');
  assert.equal(group.children.some(x=>x?.dataset?.sjManualSync==='true'),true,'refresh belongs inside the same action group');
  assert.equal(host.children.some(x=>x?.dataset?.sjManualSync==='true'),false,'refresh must not be appended directly to the header');
});

import { decorateCriticalOperationalSurfaces } from '../src/ui/critical-operational-refinement.js';

test('v2.9 P0 operational summary labels the active shift instead of claiming a full-day total',()=>{
  const heading={textContent:'Ringkasan Aktivitas Hari Ini',dataset:{}};
  const page={querySelector(sel){return sel==='.sjvc02-section-title h2'?heading:null}};
  const shiftSelect={value:'S3',selectedOptions:[{textContent:'Shift Malam'}]};
  const document={
    getElementById(id){return id==='shift-sel'?shiftSelect:null},
    querySelector(sel){return sel==='.sjvc02-operations'?page:null}
  };
  const runtime={document,activeShift:'S3'};
  decorateCriticalOperationalSurfaces(document,runtime);
  assert.equal(heading.textContent,'Ringkasan Shift Malam');
  assert.equal(heading.dataset.sjV29Scope,'active-shift');
});
