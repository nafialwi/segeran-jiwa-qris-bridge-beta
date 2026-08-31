import test from 'node:test';
import assert from 'node:assert/strict';
import { reconcileRoleNavigation } from '../src/ui/role-nav-refinement.js';

function node(){
  const attrs={};
  return {
    dataset:{},style:{props:{},setProperty(k,v,p=''){this.props[k]=[v,p]}},
    onclick:null,
    setAttribute(k,v){attrs[k]=v},getAttribute(k){return attrs[k]},
    attrs
  };
}

test('REF_02 cashier retains five visible tabs but Pengaturan opens secure account surface instead of owner Settings',()=>{
  const tab4=node(),nav=node();
  const doc={getElementById(id){return id==='tab4'?tab4:id==='bottom-nav'?nav:null}};
  let opened=0;
  const runtime={SJAccountV5964:{open(){opened++}}};
  const result=reconcileRoleNavigation(doc,runtime,'cashier');
  assert.equal(result,true);
  assert.deepEqual(tab4.style.props.display,['flex','important']);
  assert.equal(nav.style.gridTemplateColumns,'repeat(5, minmax(0, 1fr))');
  assert.equal(tab4.dataset.ref01CashierSettings,'account');
  let prevented=0,stopped=0;
  tab4.onclick({preventDefault(){prevented++},stopImmediatePropagation(){stopped++}});
  assert.equal(opened,1);
  assert.equal(prevented,1);
  assert.equal(stopped,1);
});

test('REF_02 owner restores the original Settings click authority',()=>{
  const original=()=> 'owner-settings';
  const tab4=node(),nav=node();tab4.onclick=original;
  const doc={getElementById(id){return id==='tab4'?tab4:id==='bottom-nav'?nav:null}};
  reconcileRoleNavigation(doc,{SJAccountV5964:{open(){}}},'cashier');
  reconcileRoleNavigation(doc,{},'owner');
  assert.equal(tab4.onclick,original);
  assert.equal(tab4.dataset.ref01CashierSettings,undefined);
  assert.equal(nav.style.gridTemplateColumns,'repeat(5, minmax(0, 1fr))');
});
